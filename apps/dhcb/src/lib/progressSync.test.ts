import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@core/authHeader', () => ({
  getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
}))

import { pushProgressAsync, pushProgress, pullProgress } from './progressSync'
import { pending, getSyncVersion } from './syncOutbox'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function flush() {
  await new Promise((r) => setTimeout(r, 0))
}

describe('pushProgressAsync', () => {
  it('userId rỗng → không gọi fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await pushProgressAsync('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('đọc localStorage hiện có và gửi đúng URL/method/body', async () => {
    localStorage.setItem('et_learned_u1', JSON.stringify(['book', 'go']))
    localStorage.setItem('et_hard_u1', JSON.stringify(['leaf']))
    localStorage.setItem(
      'srs_u1',
      JSON.stringify({ book: { interval: 1, ease: 2, due: 0, reps: 1 } }),
    )
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe('/api/progress')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.learned).toEqual(['book', 'go'])
      expect(body.hard).toEqual(['leaf'])
      expect(body.srs).toEqual({ book: { interval: 1, ease: 2, due: 0, reps: 1 } })
      expect(body.placement).toEqual({})
      expect(body.weeklyGoal).toEqual({})
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    await pushProgressAsync('u1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('localStorage có dữ liệu hỏng (không parse được) → dùng giá trị mặc định an toàn, không ném lỗi', async () => {
    localStorage.setItem('et_learned_u1', 'not-json')
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string)
      expect(body.learned).toEqual([])
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(pushProgressAsync('u1')).resolves.toBeUndefined()
  })

  // S09-2: lỗi tạm thời KHÔNG còn bị nuốt bằng console.warn nữa — mục nằm lại hàng đợi để gửi
  // lại. Đây chính là phát hiện F1 của đặc tả (dữ liệu học lúc server/mạng lỗi bị mất im lặng).
  it('HTTP 5xx → không ném lỗi, GIỮ mục trong hàng đợi để gửi lại', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('err', { status: 500 })),
    )
    await expect(pushProgressAsync('u1')).resolves.toBeUndefined()
    expect(pending('u1')).toBe(1)
  })

  it('fetch reject (mất mạng) → không ném lỗi, GIỮ mục trong hàng đợi để gửi lại', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    await expect(pushProgressAsync('u1')).resolves.toBeUndefined()
    expect(pending('u1')).toBe(1)
  })

  it('CHỜ pullProgress đang chạy xong rồi mới đọc localStorage để gửi (chống mất dữ liệu race — xem đầu file progressSync.ts)', async () => {
    // Máy vừa mở app: học 1 từ MỚI ngay lập tức, trước khi pull kịp kéo dữ liệu cũ về.
    localStorage.setItem('et_learned_u1', JSON.stringify(['freshword']))
    let resolveGet: ((value: Response) => void) | undefined
    const getPromise = new Promise<Response>((resolve) => {
      resolveGet = resolve
    })
    const postedBodies: { learned: string[] }[] = []
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        postedBodies.push(JSON.parse(init.body as string) as { learned: string[] })
        return new Response('{}', { status: 200 })
      }
      return getPromise // GET (pull) — cố ý treo, test tự resolve sau
    })
    vi.stubGlobal('fetch', fetchMock)

    const pullPromise = pullProgress('u1')
    const pushPromise = pushProgressAsync('u1') // "gọi tới" trong lúc pull còn đang treo

    // Pull chưa xong (GET chưa trả lời) → push phải CHƯA gửi POST nào (đang chờ).
    await Promise.resolve()
    await Promise.resolve()
    expect(postedBodies.length).toBe(0)

    resolveGet?.(
      new Response(
        JSON.stringify({
          learned: ['cloudword'],
          hard: [],
          srs: {},
          cefrGrammar: [],
          cefrDialogues: [],
          cefrUnlocked: [],
          cefrExams: {},
          placement: {},
          weeklyGoal: {},
          achievements: [],
        }),
        { status: 200 },
      ),
    )
    await Promise.all([pullPromise, pushPromise])

    // Sau khi pull xong, push phải gửi bản ĐÃ HỢP NHẤT — không phải bản rỗng/cũ lúc gọi.
    expect(postedBodies.length).toBeGreaterThanOrEqual(1)
    for (const body of postedBodies) {
      expect(new Set(body.learned)).toEqual(new Set(['freshword', 'cloudword']))
    }
  })
})

// GĐ2a: quyền mở cấp là việc của server — client KHÔNG khai lên nữa (đặc tả §② progressSync.ts).
describe('sendProgressSnapshot — không gửi cefrUnlocked lên server', () => {
  it('payload POST KHÔNG chứa khoá cefrUnlocked, dù localStorage có bộ đệm', async () => {
    localStorage.setItem('et_cefr_unlocked_u1', JSON.stringify(['A1', 'A2', 'C2']))
    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'POST') bodies.push(JSON.parse(init.body as string))
        return new Response('{}', { status: 200 })
      }),
    )
    await pushProgressAsync('u1')
    expect(bodies.length).toBe(1)
    expect(bodies[0]).not.toHaveProperty('cefrUnlocked')
  })

  it('ghi bộ đệm từ cefrUnlocked server trả về trong response POST', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true, cefrUnlocked: ['A1', 'A2'] }), {
            status: 200,
          }),
      ),
    )
    await pushProgressAsync('u1')
    expect(JSON.parse(localStorage.getItem('et_cefr_unlocked_u1') as string)).toEqual(['A1', 'A2'])
  })
})

describe('pushProgress (bắn rồi quên)', () => {
  it('gọi fetch nhưng không chặn — trả về ngay, không phải Promise', () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const r = pushProgress('u1')
    expect(r).toBeUndefined()
  })
})

describe('pullProgress', () => {
  it('userId rỗng → không gọi fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await pullProgress('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('HTTP lỗi → không ghi localStorage, không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('err', { status: 500 })),
    )
    await expect(pullProgress('u1')).resolves.toBeUndefined()
    expect(localStorage.getItem('et_learned_u1')).toBeNull()
  })

  it('fetch reject → không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    await expect(pullProgress('u1')).resolves.toBeUndefined()
  })

  it('hợp nhất learned/hard theo hợp (union) giữa local và cloud, rồi đẩy bản hợp nhất lên', async () => {
    localStorage.setItem('et_learned_u1', JSON.stringify(['book']))
    localStorage.setItem('et_hard_u1', JSON.stringify(['leaf']))
    const cloudData = {
      learned: ['go'],
      hard: ['run'],
      srs: {},
      cefrGrammar: [],
      cefrDialogues: [],
      cefrUnlocked: [],
      cefrExams: {},
      placement: {},
      weeklyGoal: {},
      achievements: [],
    }
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        // POST push (đẩy bản hợp nhất) — chỉ cần trả 200
        return new Response('{}', { status: 200 })
      }
      // GET pull
      return new Response(JSON.stringify(cloudData), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    await pullProgress('u1')
    await flush()

    const learned = JSON.parse(localStorage.getItem('et_learned_u1') as string) as string[]
    const hard = JSON.parse(localStorage.getItem('et_hard_u1') as string) as string[]
    expect(new Set(learned)).toEqual(new Set(['book', 'go']))
    expect(new Set(hard)).toEqual(new Set(['leaf', 'run']))
  })

  it('SRS: giữ thẻ có reps cao hơn khi hợp nhất', async () => {
    localStorage.setItem(
      'srs_u1',
      JSON.stringify({ book: { interval: 1, ease: 2, due: 0, reps: 5 } }),
    )
    const cloudData = {
      learned: [],
      hard: [],
      srs: { book: { interval: 1, ease: 2, due: 0, reps: 2 } },
      cefrGrammar: [],
      cefrDialogues: [],
      cefrUnlocked: [],
      cefrExams: {},
      placement: {},
      weeklyGoal: {},
      achievements: [],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? new Response('{}', { status: 200 })
          : new Response(JSON.stringify(cloudData), { status: 200 }),
      ),
    )
    await pullProgress('u1')
    const srs = JSON.parse(localStorage.getItem('srs_u1') as string) as Record<
      string,
      { reps: number }
    >
    expect(srs.book.reps).toBe(5) // local thắng vì reps cao hơn (tiến bộ hơn)
  })

  it('cloud đã có đủ mọi thứ local có (không có gì mới) → KHÔNG xếp hàng đẩy lại (audit 2026-09-19, docs/changelog/0380-*.md mục 2: tránh banner "Đã đồng bộ" bắn lại mỗi lần điều hướng trang)', async () => {
    localStorage.setItem('et_learned_sync99', JSON.stringify(['book']))
    const cloudData = {
      learned: ['book'],
      hard: [],
      srs: {},
      cefrGrammar: [],
      cefrDialogues: [],
      cefrUnlocked: [],
      cefrExams: {},
      placement: {},
      weeklyGoal: {},
      achievements: [],
    }
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? new Response('{}', { status: 200 })
        : new Response(JSON.stringify(cloudData), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await pullProgress('sync99')
    await flush()

    expect(pending('sync99')).toBe(0)
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0)
  })

  it('local có dữ liệu cloud chưa có → CÓ xếp hàng đẩy lên', async () => {
    localStorage.setItem('et_learned_sync99', JSON.stringify(['book', 'apple']))
    const cloudData = {
      learned: ['book'],
      hard: [],
      srs: {},
      cefrGrammar: [],
      cefrDialogues: [],
      cefrUnlocked: [],
      cefrExams: {},
      placement: {},
      weeklyGoal: {},
      achievements: [],
    }
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? new Response('{}', { status: 200 })
        : new Response(JSON.stringify(cloudData), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await pullProgress('sync99')
    await flush()

    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
  })

  it('placement/weeklyGoal: chọn bản có lastAt/updatedAt mới hơn giữa local và cloud', async () => {
    localStorage.setItem(
      'et_placement_u1',
      JSON.stringify({ cefr: 'A1', appLevel: 'A1', lastAt: '2026-08-01T00:00:00Z' }),
    )
    const cloudData = {
      learned: [],
      hard: [],
      srs: {},
      cefrGrammar: [],
      cefrDialogues: [],
      cefrUnlocked: [],
      cefrExams: {},
      placement: { cefr: 'B1', appLevel: 'B1', lastAt: '2026-08-02T00:00:00Z' },
      weeklyGoal: {},
      achievements: [],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? new Response('{}', { status: 200 })
          : new Response(JSON.stringify(cloudData), { status: 200 }),
      ),
    )
    await pullProgress('u1')
    const placement = JSON.parse(localStorage.getItem('et_placement_u1') as string) as {
      cefr: string
    }
    expect(placement.cefr).toBe('B1') // cloud mới hơn nên thắng
  })

  it('data null/undefined trả về → không xử lý gì thêm, không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('null', { status: 200 })),
    )
    await expect(pullProgress('u1')).resolves.toBeUndefined()
  })

  it('hợp nhất cefrGrammar, cefrDialogues, cefrUnlocked, achievements, streakFreezeDates', async () => {
    localStorage.setItem('et_cefr_grammar_u1', JSON.stringify(['g1']))
    localStorage.setItem('et_cefr_dialogue_u1', JSON.stringify(['d1']))
    localStorage.setItem('et_cefr_unlocked_u1', JSON.stringify(['u1']))
    localStorage.setItem('et_achievements_u1', JSON.stringify(['a1']))

    const cloudData = {
      learned: [],
      hard: [],
      srs: {},
      cefrGrammar: ['g2'],
      cefrDialogues: ['d2'],
      cefrUnlocked: ['u2'],
      cefrExams: {
        B1: { passed: true, bestPct: 85, attempts: 2, lastAt: '2026-08-10T00:00:00Z' },
      },
      placement: {},
      weeklyGoal: { goal: 50, updatedAt: '2026-08-10T00:00:00Z' },
      achievements: ['a2'],
      settings: { theme: 'dark', updatedAt: '2026-08-15T00:00:00Z' },
      streakFreezeDates: ['2026-08-14'],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? new Response('{}', { status: 200 })
          : new Response(JSON.stringify(cloudData), { status: 200 }),
      ),
    )

    await pullProgress('u1')
    await flush()

    const grammar = JSON.parse(localStorage.getItem('et_cefr_grammar_u1') as string)
    const dialogues = JSON.parse(localStorage.getItem('et_cefr_dialogue_u1') as string)
    const unlocked = JSON.parse(localStorage.getItem('et_cefr_unlocked_u1') as string)
    const achievements = JSON.parse(localStorage.getItem('et_achievements_u1') as string)
    const exams = JSON.parse(localStorage.getItem('et_cefr_exams_u1') as string)

    expect(new Set(grammar)).toEqual(new Set(['g1', 'g2']))
    expect(new Set(dialogues)).toEqual(new Set(['d1', 'd2']))
    // [SỬA CÓ CHỦ ĐÍCH — GĐ2a] cefrUnlocked KHÔNG hợp nhất nữa: server là nguồn sự thật duy nhất,
    // lấy union sẽ giữ lại đúng những cấp giả mạo/hết hạn mà server vừa gỡ. Bản local 'u1' bị bỏ.
    expect(new Set(unlocked)).toEqual(new Set(['u2']))
    expect(new Set(achievements)).toEqual(new Set(['a1', 'a2']))
    expect(exams.B1.passed).toBe(true)
  })

  it('mergeExamMaps: hợp nhất kết quả thi khi local và cloud cùng có kỳ thi', async () => {
    localStorage.setItem(
      'et_cefr_exams_u1',
      JSON.stringify({
        A2: { passed: false, bestPct: 60, attempts: 1, lastAt: '2026-08-01T00:00:00Z' },
        B1: { passed: true, bestPct: 90, attempts: 3, lastAt: '2026-08-05T00:00:00Z' },
      }),
    )

    const cloudData = {
      learned: [],
      hard: [],
      srs: {},
      cefrExams: {
        A2: { passed: true, bestPct: 75, attempts: 2, lastAt: '2026-08-02T00:00:00Z' },
        C1: { passed: true, bestPct: 80, attempts: 1, lastAt: '2026-08-03T00:00:00Z' },
      },
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? new Response('{}', { status: 200 })
          : new Response(JSON.stringify(cloudData), { status: 200 }),
      ),
    )

    await pullProgress('u1')
    await flush()

    const exams = JSON.parse(localStorage.getItem('et_cefr_exams_u1') as string)
    expect(exams.A2.passed).toBe(true) // Cloud passed wins
    expect(exams.A2.bestPct).toBe(75) // Max bestPct
    expect(exams.A2.attempts).toBe(2) // Max attempts
    expect(exams.B1.bestPct).toBe(90) // Local only
    expect(exams.C1.bestPct).toBe(80) // Cloud only
  })
})

// ── Ca biên hợp nhất — thêm 2026-09-01 để nới biên coverage branches (đang sát sàn 90%) ──
// Các helper đọc/hợp nhất là hàm nội bộ nên đi qua đúng hai cửa công khai: pushProgressAsync
// (đọc localStorage → body gửi đi) và pullProgress (cloud → hợp nhất → localStorage).
function mockFetchPull(cloud: unknown) {
  const calls: { method: string; body?: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push({ method, body: init?.body ? JSON.parse(init.body as string) : undefined })
      return method === 'GET'
        ? new Response(JSON.stringify(cloud), { status: 200 })
        : new Response('{}', { status: 200 })
    }),
  )
  return calls
}

async function bodyOfPush(userId: string): Promise<Record<string, unknown>> {
  let body: Record<string, unknown> = {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      body = JSON.parse(init.body as string)
      return new Response('{}', { status: 200 })
    }),
  )
  await pushProgressAsync(userId)
  return body
}

describe('progressSync — ca biên đọc localStorage hỏng/lạ', () => {
  it('placement/weeklyGoal/cefrExams/srs là JSON hợp lệ nhưng SAI HÌNH DẠNG → coi như rỗng', async () => {
    localStorage.setItem('et_placement_u9', JSON.stringify('chuoi')) // không phải object
    localStorage.setItem('et_weekly_goal_u9', JSON.stringify({ goal: 5 })) // thiếu updatedAt
    localStorage.setItem('et_cefr_exams_u9', JSON.stringify(7)) // số
    localStorage.setItem('srs_u9', JSON.stringify('x'))
    localStorage.setItem('et_learned_u9', JSON.stringify({ khong: 'phai-mang' }))
    const body = await bodyOfPush('u9')
    expect(body.placement).toEqual({})
    expect(body.weeklyGoal).toEqual({})
    expect(body.cefrExams).toEqual({})
    expect(body.srs).toEqual({})
    expect(body.learned).toEqual([])
  })

  it('placement/weeklyGoal/cefrExams/srs KHÔNG parse được → rỗng, không ném', async () => {
    for (const k of ['et_placement_u9', 'et_weekly_goal_u9', 'et_cefr_exams_u9', 'srs_u9']) {
      localStorage.setItem(k, '{{hong')
    }
    const body = await bodyOfPush('u9')
    expect(body.placement).toEqual({})
    expect(body.weeklyGoal).toEqual({})
    expect(body.cefrExams).toEqual({})
    expect(body.srs).toEqual({})
  })

  it('settings: gửi đủ các khoá đang có trong localStorage kèm mốc updatedAt', async () => {
    localStorage.setItem('ui_lang', 'en')
    localStorage.setItem('tts_voice', 'en-GB-A')
    localStorage.setItem('et_settings_updated_at', '2026-09-01T00:00:00.000Z')
    const body = await bodyOfPush('u9')
    expect(body.settings).toEqual({
      updatedAt: '2026-09-01T00:00:00.000Z',
      uiLang: 'en',
      voicePref: 'en-GB-A',
    })
  })
})

describe('progressSync — ca biên hợp nhất khi kéo về', () => {
  it('placement: chỉ có local → giữ local; cloud có nhưng thiếu lastAt → coi như không có', async () => {
    const local = { cefr: 'B1', appLevel: 'inter', lastAt: '2026-01-01' }
    localStorage.setItem('et_placement_u2', JSON.stringify(local))
    mockFetchPull({ placement: { cefr: 'A1', appLevel: 'x' } })
    await pullProgress('u2')
    expect(JSON.parse(localStorage.getItem('et_placement_u2')!)).toEqual(local)
  })

  it('placement: chỉ có cloud → ghi cloud xuống local', async () => {
    const cloud = { cefr: 'A2', appLevel: 'x', lastAt: '2026-02-02' }
    mockFetchPull({ placement: cloud })
    await pullProgress('u2')
    expect(JSON.parse(localStorage.getItem('et_placement_u2')!)).toEqual(cloud)
  })

  it('placement/weeklyGoal: lastAt/updatedAt là null ở một bên → bên có mốc thắng, không ném', async () => {
    localStorage.setItem(
      'et_placement_u2',
      JSON.stringify({ cefr: 'B2', appLevel: 'y', lastAt: null }),
    )
    localStorage.setItem('et_weekly_goal_u2', JSON.stringify({ goal: 3, updatedAt: null }))
    mockFetchPull({
      placement: { cefr: 'A1', appLevel: 'z', lastAt: '2026-03-03' },
      weeklyGoal: { goal: 9, updatedAt: '2026-03-03' },
    })
    await pullProgress('u2')
    expect(JSON.parse(localStorage.getItem('et_placement_u2')!).cefr).toBe('A1')
    expect(JSON.parse(localStorage.getItem('et_weekly_goal_u2')!).goal).toBe(9)
  })

  it('weeklyGoal: chỉ có local → giữ; cloud thiếu updatedAt → bỏ qua', async () => {
    localStorage.setItem('et_weekly_goal_u2', JSON.stringify({ goal: 4, updatedAt: '2026-01-01' }))
    mockFetchPull({ weeklyGoal: { goal: 99 } })
    await pullProgress('u2')
    expect(JSON.parse(localStorage.getItem('et_weekly_goal_u2')!).goal).toBe(4)
  })

  it('weeklyGoal: chỉ có cloud → ghi cloud xuống local', async () => {
    mockFetchPull({ weeklyGoal: { goal: 7, updatedAt: '2026-01-01' } })
    await pullProgress('u2')
    expect(JSON.parse(localStorage.getItem('et_weekly_goal_u2')!).goal).toBe(7)
  })

  it('cefrExams: cùng cấp thi → passed OR, bestPct/attempts max (thiếu coi là 0), lastAt mới hơn', async () => {
    localStorage.setItem(
      'et_cefr_exams_u2',
      JSON.stringify({
        a1: { passed: false, bestPct: 40, attempts: 1, lastAt: '2026-01-01' },
        b1: { passed: true, bestPct: 80, attempts: 2, lastAt: '2026-05-05' },
      }),
    )
    mockFetchPull({
      cefrExams: {
        a1: { passed: true, lastAt: '2026-02-02' }, // thiếu bestPct/attempts
        a2: { passed: false, bestPct: 10, attempts: 1, lastAt: '2026-01-01' },
        b1: { passed: false, bestPct: 50, attempts: 5, lastAt: '2026-04-04' },
      },
    })
    await pullProgress('u2')
    const exams = JSON.parse(localStorage.getItem('et_cefr_exams_u2')!)
    expect(exams.a1).toEqual({ passed: true, bestPct: 40, attempts: 1, lastAt: '2026-02-02' })
    expect(exams.a2).toEqual({ passed: false, bestPct: 10, attempts: 1, lastAt: '2026-01-01' })
    expect(exams.b1).toEqual({ passed: true, bestPct: 80, attempts: 5, lastAt: '2026-05-05' })
  })

  it('SRS: cloud có thẻ reps cao hơn → giữ cloud; local thiếu reps coi là 0', async () => {
    localStorage.setItem(
      'srs_u2',
      JSON.stringify({
        book: { interval: 1, ease: 2, due: 0, reps: 1 },
        pen: { interval: 1, ease: 2, due: 0 }, // thiếu reps
      }),
    )
    mockFetchPull({
      srs: {
        book: { interval: 9, ease: 2.5, due: 5, reps: 4 },
        pen: { interval: 3, ease: 2.5, due: 5, reps: 2 },
      },
    })
    await pullProgress('u2')
    const srs = JSON.parse(localStorage.getItem('srs_u2')!)
    expect(srs.book.reps).toBe(4)
    expect(srs.pen.reps).toBe(2)
  })

  it('SRS hoà reps: dùng CÙNG luật với server (due xa hơn thắng) → hội tụ, không đẩy thừa (AUD-XFEAT-001)', async () => {
    localStorage.setItem(
      'srs_u2',
      JSON.stringify({ book: { interval: 1, ease: 2, due: 100, reps: 3 } }),
    )
    const calls = mockFetchPull({ srs: { book: { interval: 2, ease: 2, due: 200, reps: 3 } } })
    await pullProgress('u2')
    await pullProgress('u2')
    await flush()
    const srs = JSON.parse(localStorage.getItem('srs_u2')!)
    expect(srs.book).toEqual({ interval: 2, ease: 2, due: 200, reps: 3 })
    expect(calls.filter((c) => c.method !== 'GET')).toHaveLength(0)
    expect(pending('u2')).toBe(0)
  })

  it('SRS hoà reps, local có due xa hơn → local thắng và được đẩy lên', async () => {
    localStorage.setItem(
      'srs_u2',
      JSON.stringify({ book: { interval: 4, ease: 2, due: 300, reps: 3 } }),
    )
    mockFetchPull({ srs: { book: { interval: 2, ease: 2, due: 200, reps: 3 } } })
    await pullProgress('u2')
    const srs = JSON.parse(localStorage.getItem('srs_u2')!)
    expect(srs.book.due).toBe(300)
  })

  it('settings: cloud có mốc updatedAt MỚI HƠN → ghi đè từng khoá có giá trị, giữ khoá cloud không gửi', async () => {
    localStorage.setItem('ui_lang', 'vi')
    localStorage.setItem('tts_voice', 'vi-VN-A')
    localStorage.setItem('et_settings_updated_at', '2026-01-01T00:00:00.000Z')
    mockFetchPull({
      settings: { uiLang: 'en', updatedAt: '2026-06-06T00:00:00.000Z' },
    })
    await pullProgress('u2')
    expect(localStorage.getItem('ui_lang')).toBe('en')
    expect(localStorage.getItem('tts_voice')).toBe('vi-VN-A') // cloud không có → không đụng
    expect(localStorage.getItem('et_settings_updated_at')).toBe('2026-06-06T00:00:00.000Z')
  })

  it('settings: cloud KHÔNG có mốc → giữ local (kể cả local chưa có mốc)', async () => {
    localStorage.setItem('ui_lang', 'vi')
    mockFetchPull({ settings: { uiLang: 'en' } })
    await pullProgress('u2')
    expect(localStorage.getItem('ui_lang')).toBe('vi')
    expect(localStorage.getItem('et_settings_updated_at')).toBeNull()
  })

  it('cùng user gọi pullProgress hai lần đồng thời → dùng chung MỘT lượt kéo (chỉ 1 GET)', async () => {
    const calls = mockFetchPull({})
    const p1 = pullProgress('u3')
    const p2 = pullProgress('u3')
    expect(p1).toBe(p2)
    await p1
    expect(calls.filter((c) => c.method === 'GET')).toHaveLength(1)
  })

  it('localStorage đầy (setItem ném) khi ghi bản hợp nhất → nuốt lỗi, vẫn đẩy lên server', async () => {
    // Local có 'y' mà cloud chưa có → hợp nhất THẬT SỰ có gì mới cần đẩy lên (khác bản cloud
    // vừa kéo về), nên đây là ca đúng để kiểm khả năng chịu lỗi đĩa đầy của hàng đợi.
    localStorage.setItem('et_learned_u4', JSON.stringify(['y']))
    const calls = mockFetchPull({ learned: ['x'] })
    // Spy tren chinh `localStorage` (thuoc tinh rieng cua instance), khong phai prototype.
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    await expect(pullProgress('u4')).resolves.toBeUndefined()
    setItem.mockRestore()
    await flush()
    expect(calls.some((c) => c.method === 'POST')).toBe(true)
  })
})

describe('progressSync — hàng chờ review offline sau khi đẩy thành công', () => {
  it('có review chờ → xoá đúng các id có thật; không có → không gọi xoá', async () => {
    const offline = await import('./offlineSrsStore')
    const getPending = vi.spyOn(offline, 'getPendingOfflineReviews')
    const clearPending = vi
      .spyOn(offline, 'clearPendingOfflineReviews')
      .mockResolvedValue(undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    )

    getPending.mockResolvedValue([])
    await pushProgressAsync('u5')
    await flush()
    expect(clearPending).not.toHaveBeenCalled()

    getPending.mockResolvedValue([
      { id: 11, uid: 'u5', word: 'a', rating: 'good', at: 1 },
      { id: undefined, uid: 'u5', word: 'b', rating: 'good', at: 1 },
    ] as never)
    await pushProgressAsync('u5')
    await flush()
    expect(clearPending).toHaveBeenCalledWith('u5', [11])
  })
})

// ── AC-14: thiết bị cũ gửi muộn → giao diện KHÔNG BAO GIỜ "nhảy lùi" ──
describe('progressSync — server báo xung đột và trả bản gộp (S09-1 conflict/merged)', () => {
  it('conflict:true → áp bản gộp xuống localStorage, số từ chỉ TĂNG, không bao giờ ít đi', async () => {
    localStorage.setItem('et_learned_u9', JSON.stringify(['a', 'b', 'c', 'd', 'e']))
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ok: true,
              version: 12,
              conflict: true,
              replayed: false,
              cefrUnlocked: ['A1'],
              merged: { learned: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], version: 12 },
            }),
            { status: 200 },
          ),
      ),
    )
    await pushProgressAsync('u9')
    const learned = JSON.parse(localStorage.getItem('et_learned_u9')!) as string[]
    expect(learned).toHaveLength(7)
    expect(learned).toEqual(expect.arrayContaining(['a', 'e', 'f', 'g']))
    // Version server được ghi lại để lần gửi sau gửi đúng `baseVersion`.
    expect(getSyncVersion('u9')).toBe(12)
  })

  it('server CŨ (không có trường version) → vẫn coi là gửi thành công, không kẹt hàng đợi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"ok":true,"cefrUnlocked":[]}', { status: 200 })),
    )
    await pushProgressAsync('u9')
    expect(pending('u9')).toBe(0)
    expect(getSyncVersion('u9')).toBe(0)
  })
})

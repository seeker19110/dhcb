// Test handler /api/progress — tập trung nhánh MỚI (2026-07-26): phát hiện học thật
// (mảng learned/hard/cefrGrammar/cefrDialogues dài ra so với bản đang lưu) → gọi
// grant_daily_bonus_rolling cộng thưởng lượt (cửa sổ trượt) cho gói Free. Không cộng khi chỉ đồng bộ
// lại dữ liệu cũ (không mảng nào dài ra) — tránh mở app không học gì cũng được thưởng.

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: vi.fn(async () => true),
  validateAuth: vi.fn(async () => ({ userId: 'u1' })),
  logSecurityEvent: () => undefined,
}))

import handler from './progress.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { checkRateLimit, validateAuth } from '@dhcb/core-auth/security'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()
const release = vi.fn()

const EMPTY_PROGRESS_ROW = {
  learned: [],
  hard: [],
  srs: {},
  cefr_grammar: [],
  cefr_dialogues: [],
  cefr_unlocked: [],
  cefr_unlocked_grandfathered: [],
  cefr_exams: {},
  placement: {},
  weekly_goal: {},
  achievements: [],
}

beforeEach(() => {
  query.mockReset()
  release.mockReset()
  vi.mocked(checkRateLimit).mockResolvedValue(true)
  vi.mocked(validateAuth).mockResolvedValue({ userId: 'u1' })
  mockedGetPool.mockReturnValue({
    query,
    connect: vi.fn(async () => ({ query, release })),
  } as unknown as ReturnType<typeof getPgPool>)
})

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
    body: JSON.stringify(body),
  })
}

function findCall(sqlSubstr: string): unknown[] | undefined {
  return query.mock.calls.find(([sql]) => (sql as string).includes(sqlSubstr))
}

describe('Rate limit và method not allowed', () => {
  it('rate limit vượt quá → trả 429', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const req = new Request('http://localhost/api/progress', {
      method: 'GET',
      headers: { Authorization: 'Bearer x' },
    })
    const resp = await handler(req)
    expect(resp.status).toBe(429)
    const json = await resp.json()
    expect(json.error).toContain('Quá nhiều yêu cầu')
  })

  it('method PUT → trả 405 Method not allowed', async () => {
    const req = new Request('http://localhost/api/progress', {
      method: 'PUT',
      headers: { Authorization: 'Bearer x' },
    })
    const resp = await handler(req)
    expect(resp.status).toBe(405)
    const json = await resp.json()
    expect(json.error).toBe('Method not allowed')
  })
})

describe('GET /api/progress — đọc tiến độ học', () => {
  it('không có dữ liệu tiến độ → trả body null', async () => {
    query.mockResolvedValue({ rows: [] })
    query.mockResolvedValueOnce({ rows: [] })
    const req = new Request('http://localhost/api/progress', {
      method: 'GET',
      headers: { Authorization: 'Bearer x' },
    })
    const resp = await handler(req)
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toBeNull()
  })

  // GĐ2a: `cefrUnlocked` KHÔNG còn là cột đọc thẳng — server tính lại mỗi lượt đọc từ gói +
  // cefr_exams + grandfather, nên response không phản chiếu giá trị rác trong cột nữa.
  it('có dữ liệu tiến độ → trả camelCase response', async () => {
    query.mockResolvedValue({ rows: [] })
    query.mockResolvedValueOnce({
      rows: [
        {
          learned: ['apple'],
          hard: ['banana'],
          srs: { apple: { reps: 3 } },
          cefr_grammar: ['g1'],
          cefr_dialogues: ['d1'],
          cefr_unlocked: ['u1'],
          cefr_unlocked_grandfathered: ['A2'],
          cefr_exams: { e1: { score: 90 } },
          placement: { cefr: 'A2' },
          weekly_goal: { target: 10 },
          achievements: ['first_word'],
        },
      ],
    })
    const req = new Request('http://localhost/api/progress', {
      method: 'GET',
      headers: { Authorization: 'Bearer x' },
    })
    const resp = await handler(req)
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toEqual({
      learned: ['apple'],
      hard: ['banana'],
      srs: { apple: { reps: 3 } },
      cefrGrammar: ['g1'],
      cefrDialogues: ['d1'],
      // 'u1' là giá trị client cũ tự khai — server BỎ QUA; A1 luôn mở, A2 nhờ grandfather.
      cefrUnlocked: ['A1', 'A2'],
      cefrExams: {},
      placement: { cefr: 'A2' },
      weeklyGoal: { target: 10 },
      achievements: ['first_word'],
      settings: {},
      streakFreezeDates: [],
      // S09-1: GET trả thêm `version`; mock không có cột → mặc định 1.
      version: 1,
    })
  })
})

describe('POST /api/progress — cộng thưởng lượt khi phát hiện học thật', () => {
  it('learned dài ra so với bản cũ → gọi grant_daily_bonus_rolling', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [EMPTY_PROGRESS_ROW] }
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ learned: ['apple'] }))
    expect(resp.status).toBe(200)
    expect(findCall('grant_daily_bonus_rolling')).toBeTruthy()
  })

  it('cefrDialogues dài ra → cũng tính là học thật, gọi grant_daily_bonus_rolling', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [EMPTY_PROGRESS_ROW] }
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ cefrDialogues: ['a1-u1-d1'] }))
    expect(resp.status).toBe(200)
    expect(findCall('grant_daily_bonus_rolling')).toBeTruthy()
  })

  it('gửi lại ĐÚNG dữ liệu cũ (không mảng nào dài ra) → KHÔNG cộng thưởng', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [{ ...EMPTY_PROGRESS_ROW, learned: ['apple'] }] }
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ learned: ['apple'] }))
    expect(resp.status).toBe(200)
    expect(findCall('grant_daily_bonus_rolling')).toBeFalsy()
  })

  it('lỗi khi cộng thưởng (DB throw) → vẫn lưu tiến độ thành công (fail-open, không vỡ luồng chính)', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [EMPTY_PROGRESS_ROW] }
      if (sql.includes('grant_daily_bonus_rolling')) throw new Error('db down')
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ learned: ['apple'] }))
    expect(resp.status).toBe(200)
    expect(findCall('insert into english.learning_progress')).toBeTruthy()
  })
})

// ── GĐ2a: server là NGUỒN SỰ THẬT của quyền mở cấp CEFR ──────────────────────────────────
// Đặc tả docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md §④ — tiêu chí 4 (chống giả mạo) là
// test quan trọng nhất của cả đợt: client POST mảng cefrUnlocked bịa ra phải bị BỎ QUA.
describe('POST /api/progress — cefrUnlocked do SERVER tính, không nhận từ client', () => {
  // Dựng mock DB: hàng tiến độ hiện có + gói trả về cho câu đọc public.profiles.
  function mockDb(options: {
    plan?: string
    planExpiresAt?: Date | null
    exams?: Record<string, unknown>
    grandfathered?: string[]
  }) {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('platform.feature_state'))
        return {
          rows: [
            {
              cefr_exams: Object.fromEntries(
                Object.entries(options.exams ?? {}).map(([key, value]) => [
                  key,
                  { bestPct: 0, attempts: 1, lastAt: '2026-09-27', ...(value as object) },
                ]),
              ),
            },
          ],
        }
      if (sql.includes('select plan, plan_expires_at'))
        return {
          rows: [{ plan: options.plan ?? 'free', plan_expires_at: options.planExpiresAt ?? null }],
        }
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return {
          rows: [
            {
              ...EMPTY_PROGRESS_ROW,
              cefr_exams: options.exams ?? {},
              cefr_unlocked_grandfathered: options.grandfathered ?? [],
            },
          ],
        }
      return { rows: [] }
    })
  }

  // Tham số $7 của câu insert = cefr_unlocked (xem thứ tự cột trong handler).
  function savedUnlocked(): string[] {
    const call = findCall('insert into english.learning_progress')
    if (!call) throw new Error('không thấy câu insert')
    return JSON.parse((call[1] as unknown[])[6] as string) as string[]
  }

  it('TIÊU CHÍ 4 — Free POST cefrUnlocked giả [A1..C2] → server BỎ QUA, chỉ lưu [A1]', async () => {
    mockDb({ plan: 'free' })
    const resp = await handler(makeRequest({ cefrUnlocked: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }))
    expect(resp.status).toBe(200)
    expect(savedUnlocked()).toEqual(['A1'])
    // Response cũng trả đúng danh sách của server, không phải mảng client gửi.
    expect((await resp.json()).cefrUnlocked).toEqual(['A1'])
  })

  it('TIÊU CHÍ 1 — VIP chưa thi cấp nào → lưu cả 6 cấp', async () => {
    mockDb({ plan: 'vip' })
    await handler(makeRequest({}))
    expect(savedUnlocked()).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  })

  it('TIÊU CHÍ 3 — Free đã thi đạt A1 → lưu [A1, A2]', async () => {
    mockDb({ plan: 'free', exams: { A1: { passed: true, bestPct: 85, attempts: 1, lastAt: 'x' } } })
    await handler(makeRequest({}))
    expect(savedUnlocked()).toEqual(['A1', 'A2'])
  })

  it('TIÊU CHÍ 5 — grandfather giữ quyền của user cũ dù chưa thi cấp nào', async () => {
    mockDb({ plan: 'free', grandfathered: ['A1', 'A2', 'B1'] })
    await handler(makeRequest({}))
    expect(savedUnlocked()).toEqual(['A1', 'A2', 'B1'])
  })

  it('TIÊU CHÍ 6 — VIP HẾT HẠN → chỉ còn cấp thi đạt thật, cấp mở nhờ VIP bị khoá lại', async () => {
    mockDb({
      plan: 'vip',
      planExpiresAt: new Date('2020-01-01T00:00:00Z'), // đã quá hạn
      exams: { A1: { passed: true } },
    })
    await handler(makeRequest({}))
    expect(savedUnlocked()).toEqual(['A1', 'A2'])
  })

  it('FAIL-SAFE — đọc plan lỗi → coi như Free (khoá chặt), KHÔNG mở hết', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select plan, plan_expires_at')) throw new Error('db down')
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [EMPTY_PROGRESS_ROW] }
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ cefrUnlocked: ['A1', 'C2'] }))
    expect(resp.status).toBe(200)
    expect(savedUnlocked()).toEqual(['A1'])
  })
})

// Điều tra "mất dữ liệu học tập admin": trước đây POST ghi đè thẳng dữ liệu client gửi lên
// (on conflict do update set x = excluded.x) — một thiết bị/tab gửi lên bản CŨ/RỖNG (trước
// khi kịp pull) sẽ xoá mất dữ liệu server đang có. Nhóm test dưới xác nhận srs/cefrExams/
// placement/weeklyGoal (không có thao tác "bỏ đánh dấu" thật) được HỢP NHẤT với dữ liệu đã
// có trên server trước khi lưu, thay vì ghi đè thẳng.
describe('POST /api/progress — hợp nhất với dữ liệu đã có trên server (chống mất dữ liệu race)', () => {
  function insertedParams(): unknown[] {
    const call = findCall('insert into english.learning_progress')
    if (!call) throw new Error('không thấy câu insert')
    return call[1] as unknown[]
  }

  it('srs: giữ thẻ đã có trên server nếu reps cao hơn bản client gửi lên (client gửi bản CŨ)', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return {
          rows: [
            { ...EMPTY_PROGRESS_ROW, srs: { book: { interval: 5, ease: 2, due: 10, reps: 5 } } },
          ],
        }
      return { rows: [] }
    })
    // Client gửi lên bản CŨ (reps=1) — vd tab/thiết bị chưa kịp pull dữ liệu mới.
    const resp = await handler(
      makeRequest({ srs: { book: { interval: 1, ease: 2, due: 0, reps: 1 } } }),
    )
    expect(resp.status).toBe(200)
    const params = insertedParams()
    expect(JSON.parse(params[3] as string)).toEqual({
      book: { interval: 5, ease: 2, due: 10, reps: 5 },
    })
  })

  it('placement: giữ bản trên server nếu lastAt mới hơn bản client gửi lên', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return {
          rows: [
            {
              ...EMPTY_PROGRESS_ROW,
              placement: { cefr: 'B1', appLevel: 'B1', lastAt: '2026-08-02T00:00:00Z' },
            },
          ],
        }
      return { rows: [] }
    })
    const resp = await handler(
      makeRequest({ placement: { cefr: 'A1', appLevel: 'A1', lastAt: '2026-08-01T00:00:00Z' } }),
    )
    expect(resp.status).toBe(200)
    const params = insertedParams()
    expect(JSON.parse(params[8] as string)).toEqual({
      cefr: 'B1',
      appLevel: 'B1',
      lastAt: '2026-08-02T00:00:00Z',
    })
  })

  it('learned HỢP UNION với server (2026-08-13: chỉ tăng, không giảm dù đổi máy/nhiều thiết bị) — client bỏ đánh dấu 1 từ KHÔNG xoá được nó khỏi server nếu server đã từng lưu', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [{ ...EMPTY_PROGRESS_ROW, learned: ['apple', 'banana'] }] }
      return { rows: [] }
    })
    // Client vừa unmarkLearned('banana') — gửi lên mảng đã bớt đi 1 từ, nhưng server union
    // lại nên 'banana' vẫn còn (đúng yêu cầu "chỉ tăng, không giảm").
    const resp = await handler(makeRequest({ learned: ['apple'] }))
    expect(resp.status).toBe(200)
    const params = insertedParams()
    expect(JSON.parse(params[1] as string)).toEqual(['apple', 'banana'])
  })

  it('hard VẪN ghi đè theo client (chỉ là lọc hiển thị, không phải tiến độ học)', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [{ ...EMPTY_PROGRESS_ROW, hard: ['apple', 'banana'] }] }
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ hard: ['apple'] }))
    expect(resp.status).toBe(200)
    const params = insertedParams()
    expect(JSON.parse(params[2] as string)).toEqual(['apple'])
  })

  it('settings: giữ bản có updatedAt MỚI HƠN (không phải tiến độ chỉ tăng, là lựa chọn hiện tại)', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return {
          rows: [
            {
              ...EMPTY_PROGRESS_ROW,
              settings: { uiLang: 'vi', updatedAt: '2026-08-13T10:00:00Z' },
            },
          ],
        }
      return { rows: [] }
    })
    // Client gửi lên bản CŨ HƠN (mốc sớm hơn) — server giữ nguyên bản mới hơn đang có.
    const resp = await handler(
      makeRequest({ settings: { uiLang: 'en', updatedAt: '2026-08-13T09:00:00Z' } }),
    )
    expect(resp.status).toBe(200)
    const params = insertedParams()
    expect(JSON.parse(params[11] as string)).toEqual({
      uiLang: 'vi',
      updatedAt: '2026-08-13T10:00:00Z',
    })
  })

  it('streakFreezeDates HỢP UNION với server (vé nghỉ đã dùng ở máy khác không bị mất)', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return { rows: [{ ...EMPTY_PROGRESS_ROW, streak_freeze_dates: ['2026-08-01'] }] }
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ streakFreezeDates: ['2026-08-05'] }))
    expect(resp.status).toBe(200)
    const params = insertedParams()
    expect(JSON.parse(params[12] as string)).toEqual(['2026-08-01', '2026-08-05'])
  })
})

describe('POST /api/progress — Daily Plan completion do server xác nhận', () => {
  const now = 2_000_000_000_000

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(now)
  })

  function oldState(srs: Record<string, unknown>) {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs'))
        return { rows: [{ ...EMPTY_PROGRESS_ROW, srs }] }
      return { rows: [] }
    })
  }

  it('thẻ từ vựng đến hạn tăng reps và dời due sang tương lai → tạo một receipt tối giản', async () => {
    oldState({ apple: { reps: 1, due: now - 1, interval: 1 } })
    const resp = await handler(
      makeRequest({ srs: { apple: { reps: 2, due: now + 86_400_000, interval: 2 } } }),
    )

    expect(resp.status).toBe(200)
    const receipt = findCall('insert into public.daily_plan_completions')
    expect(receipt?.[1]).toEqual(['u1', 'p1.1', JSON.stringify({ reviewedCardCount: 1 })])
    expect(String(receipt?.[0])).not.toContain('card_id')
    expect(query.mock.calls.map(([sql]) => String(sql))).toEqual(
      expect.arrayContaining(['begin', 'commit']),
    )
    expect(release).toHaveBeenCalledOnce()
  })

  it.each([
    ['sync state cũ', { apple: { reps: 1, due: now - 1 } }, { apple: { reps: 1, due: now - 1 } }],
    ['chỉ đổi hard', { apple: { reps: 1, due: now - 1 } }, { apple: { reps: 1, due: now - 1 } }],
    [
      'grammar card',
      { 'grammar:a1': { reps: 1, due: now - 1 } },
      { 'grammar:a1': { reps: 2, due: now + 1 } },
    ],
    [
      'thẻ chưa đến hạn',
      { apple: { reps: 1, due: now + 1 } },
      { apple: { reps: 2, due: now + 2 } },
    ],
    ['reps không tăng', { apple: { reps: 2, due: now - 1 } }, { apple: { reps: 2, due: now + 1 } }],
    [
      'due chưa sang tương lai',
      { apple: { reps: 1, due: now - 2 } },
      { apple: { reps: 2, due: now - 1 } },
    ],
  ])('%s → không tạo receipt', async (_label, before, after) => {
    oldState(before)
    await handler(makeRequest({ hard: ['optional'], srs: after }))
    expect(findCall('insert into public.daily_plan_completions')).toBeFalsy()
  })

  it('chưa có state trước merge → không coi payload client là completion', async () => {
    query.mockResolvedValue({ rows: [] })
    await handler(makeRequest({ srs: { apple: { reps: 2, due: now + 1 } } }))
    expect(findCall('insert into public.daily_plan_completions')).toBeFalsy()
  })

  it('nhiều thẻ hợp lệ → một insert receipt với count tổng; unique index xử lý retry trong ngày', async () => {
    oldState({
      apple: { reps: 1, due: now - 1 },
      book: { reps: 3, due: now },
    })
    await handler(
      makeRequest({
        srs: {
          apple: { reps: 2, due: now + 1 },
          book: { reps: 4, due: now + 2 },
        },
      }),
    )
    const receipts = query.mock.calls.filter(([sql]) =>
      String(sql).includes('insert into public.daily_plan_completions'),
    )
    expect(receipts).toHaveLength(1)
    expect(receipts[0]?.[1]?.[2]).toBe(JSON.stringify({ reviewedCardCount: 2 }))
    expect(String(receipts[0]?.[0])).toContain('on conflict do nothing')
  })

  it('ghi receipt lỗi → rollback cả progress và giải phóng connection', async () => {
    oldState({ apple: { reps: 1, due: now - 1 } })
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs'))
        return { rows: [{ ...EMPTY_PROGRESS_ROW, srs: { apple: { reps: 1, due: now - 1 } } }] }
      if (sql.includes('insert into public.daily_plan_completions')) throw new Error('receipt down')
      return { rows: [] }
    })

    await expect(
      handler(makeRequest({ srs: { apple: { reps: 2, due: now + 1 } } })),
    ).rejects.toThrow('receipt down')
    expect(query.mock.calls.map(([sql]) => String(sql))).toContain('rollback')
    expect(query.mock.calls.map(([sql]) => String(sql))).not.toContain('commit')
    expect(release).toHaveBeenCalledOnce()
  })
})

describe('Ca biên: cột DB trả NULL và chưa có bản ghi nào', () => {
  it('OPTIONS → 204 (preflight CORS), không cần đăng nhập', async () => {
    const resp = await handler(new Request('http://localhost/api/progress', { method: 'OPTIONS' }))
    expect(resp.status).toBe(204)
    expect(query).not.toHaveBeenCalled()
  })

  it('GET với mọi cột NULL → trả mảng/đối tượng RỖNG, không trả null gây vỡ client', async () => {
    // DB cũ (trước các migration thêm cột) trả null cho cột chưa từng ghi. Client
    // (cloud.ts) ghi thẳng response vào localStorage nên null sẽ làm vỡ chỗ dùng .length.
    query.mockResolvedValue({
      rows: [
        {
          learned: null,
          hard: null,
          srs: null,
          cefr_grammar: null,
          cefr_dialogues: null,
          cefr_unlocked: null,
          cefr_unlocked_grandfathered: null,
          cefr_exams: null,
          placement: null,
          weekly_goal: null,
          achievements: null,
        },
      ],
    })
    const resp = await handler(
      new Request('http://localhost/api/progress', {
        method: 'GET',
        headers: { Authorization: 'Bearer x' },
      }),
    )
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({
      learned: [],
      hard: [],
      srs: {},
      cefrGrammar: [],
      cefrDialogues: [],
      // Cột NULL hết → không có quyền nào được cấp, nhưng A1 luôn mở (sàn của luật mở cấp).
      cefrUnlocked: ['A1'],
      cefrExams: {},
      placement: {},
      weeklyGoal: {},
      achievements: [],
      settings: {},
      streakFreezeDates: [],
      // S09-1: GET trả thêm `version` (dòng cũ chưa có cột → 1).
      version: 1,
    })
  })

  it('POST khi CHƯA có bản ghi nào → tính là học thật và lưu được (không nổ vì existing undefined)', async () => {
    query.mockResolvedValue({ rows: [] })
    const resp = await handler(makeRequest({ learned: ['apple'] }))
    expect(resp.status).toBe(200)
    expect(findCall('grant_daily_bonus_rolling')).toBeTruthy()
    expect(findCall('insert into english.learning_progress')).toBeTruthy()
  })

  it('POST khi bản ghi cũ có cột NULL → hợp nhất dùng mặc định rỗng, không nổ', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs'))
        return {
          rows: [
            {
              ...EMPTY_PROGRESS_ROW,
              learned: null,
              srs: null,
              cefr_exams: null,
              placement: null,
              weekly_goal: null,
            },
          ],
        }
      return { rows: [] }
    })
    const resp = await handler(makeRequest({ learned: ['apple'] }))
    expect(resp.status).toBe(200)
  })

  it('cefrGrammar dài ra → cũng tính là học thật', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs'))
        return { rows: [{ ...EMPTY_PROGRESS_ROW, cefr_grammar: ['a1-u1'] }] }
      return { rows: [] }
    })
    await handler(makeRequest({ cefrGrammar: ['a1-u1', 'a1-u2'] }))
    expect(findCall('grant_daily_bonus_rolling')).toBeTruthy()
  })

  it('body không phải JSON hợp lệ → 400, không đụng DB', async () => {
    const resp = await handler(
      new Request('http://localhost/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
        body: '{hong',
      }),
    )
    expect(resp.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })
})

// ── S09-1: version đơn điệu + idempotency theo lần gửi ───────────────────────
// Đặc tả: docs/specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md AC-1..AC-3, AC-7.
describe('POST /api/progress — version, xung đột, replay (S09-1)', () => {
  const ATTEMPT = 'attempt-0000-1111'
  function envelope(baseVersion: number) {
    return { attemptId: ATTEMPT, baseVersion, clientUpdatedAt: '2026-09-15T08:00:00.000Z' }
  }

  /** Mock `pg` theo NỘI DUNG câu SQL (thứ tự call đổi khi có/không có phong bì `sync`). */
  function mockDb(options: {
    existing?: Record<string, unknown>
    nextVersion?: number
    receipt?: { endpoint: string; response: Record<string, unknown> } | null
  }) {
    query.mockImplementation(async (sql: string) => {
      const text = String(sql)
      if (text.includes('select endpoint, response'))
        return { rows: options.receipt ? [options.receipt] : [] }
      if (text.includes('from public.profiles')) return { rows: [{ plan: 'free' }] }
      if (text.includes('for update'))
        return { rows: options.existing ? [{ ...EMPTY_PROGRESS_ROW, ...options.existing }] : [] }
      if (text.includes('insert into english.learning_progress'))
        return { rows: [{ version: options.nextVersion ?? 1 }] }
      return { rows: [] }
    })
  }

  it('AC-1 mỗi POST thành công tăng version đúng 1 và trả về version mới', async () => {
    mockDb({ existing: { version: 4 }, nextVersion: 5 })
    const resp = await handler(makeRequest({ learned: ['apple'], sync: envelope(4) }))
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toMatchObject({ ok: true, version: 5, conflict: false, replayed: false })
    // Bất biến: version tăng TRONG câu SQL, không tính ở tầng ứng dụng.
    const upsert = findCall('insert into english.learning_progress')
    expect(String(upsert?.[0])).toContain('version = english.learning_progress.version + 1')
    expect(String(upsert?.[0])).toContain('returning version')
  })

  it('AC-1b không có phong bì `sync` (client cũ) → đường cũ y nguyên, response vẫn có version', async () => {
    mockDb({ existing: { version: 2 }, nextVersion: 3 })
    const resp = await handler(makeRequest({ learned: ['apple'] }))
    const json = await resp.json()
    expect(json).toMatchObject({ ok: true, version: 3, conflict: false })
    // Không gửi phong bì thì KHÔNG tra và KHÔNG ghi biên nhận.
    expect(findCall('sync_receipts')).toBeUndefined()
  })

  it('AC-2 baseVersion khớp → conflict false, KHÔNG kèm merged', async () => {
    mockDb({ existing: { version: 3 }, nextVersion: 4 })
    const json = (await (await handler(makeRequest({ sync: envelope(3) }))).json()) as {
      conflict: boolean
      merged?: unknown
    }
    expect(json.conflict).toBe(false)
    expect(json.merged).toBeUndefined()
  })

  it('AC-2b baseVersion lệch → conflict true + merged là BẢN GỘP (union, không kéo lùi)', async () => {
    mockDb({ existing: { version: 9, learned: ['cat'] }, nextVersion: 10 })
    const json = (await (
      await handler(makeRequest({ learned: ['dog'], sync: envelope(3) }))
    ).json()) as {
      version: number
      conflict: boolean
      merged: { learned: string[] }
    }
    expect(json).toMatchObject({ version: 10, conflict: true })
    // Merge vẫn là luật domain cũ: union — cả hai từ đều còn.
    expect([...json.merged.learned].sort()).toEqual(['cat', 'dog'])
  })

  it('AC-3 gửi trùng attemptId → replay: không merge, không thưởng, không ghi daily_plan', async () => {
    mockDb({
      receipt: { endpoint: 'progress', response: { ok: true, version: 7, conflict: false } },
    })
    const resp = await handler(makeRequest({ learned: ['apple'], sync: envelope(6) }))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ ok: true, version: 7, conflict: false, replayed: true })
    expect(findCall('insert into english.learning_progress')).toBeUndefined()
    expect(findCall('grant_daily_bonus_rolling')).toBeUndefined()
    expect(findCall('daily_plan_completions')).toBeUndefined()
  })

  it('AC-3b biên nhận của endpoint KHÁC → 409, không ghi gì', async () => {
    mockDb({ receipt: { endpoint: 'programming-progress', response: { ok: true } } })
    const resp = await handler(makeRequest({ sync: envelope(1) }))
    expect(resp.status).toBe(409)
    expect(findCall('insert into english.learning_progress')).toBeUndefined()
  })

  it('biên nhận ghi TRONG cùng transaction với upsert (trước commit)', async () => {
    mockDb({ existing: { version: 1 }, nextVersion: 2 })
    await handler(makeRequest({ learned: ['apple'], sync: envelope(1) }))
    const order = query.mock.calls.map(([s]) => String(s).trim().toLowerCase())
    const receiptIdx = order.findIndex((s) => s.includes('insert into public.sync_receipts'))
    expect(receiptIdx).toBeGreaterThan(-1)
    expect(receiptIdx).toBeLessThan(order.lastIndexOf('commit'))
  })

  it('AC-7 429 mang header Retry-After: 60; đếm lượt chạy TRƯỚC khi tra biên nhận', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const resp = await handler(makeRequest({ sync: envelope(1) }))
    expect(resp.status).toBe(429)
    expect(resp.headers.get('Retry-After')).toBe('60')
    expect(query).not.toHaveBeenCalled()
  })
})

describe('CEFR chỉ cấp quyền từ sổ chấm thi máy chủ', () => {
  it('đọc được kết quả đã chấm dù chưa có hàng tiến độ legacy', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('platform.feature_state'))
        return {
          rows: [
            {
              cefr_exams: { A1: { passed: true, bestPct: 90, attempts: 1, lastAt: '2026-09-27' } },
            },
          ],
        }
      return { rows: [] }
    })
    const response = await handler(new Request('http://localhost/api/progress'))
    expect((await response.json()).cefrUnlocked).toEqual(['A1', 'A2'])
  })
  it('từ chối passed và marker tự khai kể cả từ dữ liệu legacy trong DB', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select learned, hard, srs, cefr_grammar'))
        return {
          rows: [
            { ...EMPTY_PROGRESS_ROW, cefr_exams: { A1: { passed: true, serverVerified: true } } },
          ],
        }
      return { rows: [] }
    })
    const response = await handler(
      makeRequest({ cefrExams: { A1: { passed: true, serverVerified: true, bestPct: 100 } } }),
    )
    expect((await response.json()).cefrUnlocked).toEqual(['A1'])
    const saved = findCall('insert into english.learning_progress')!
    expect(JSON.parse((saved[1] as unknown[])[7] as string)).toEqual({})
  })
})

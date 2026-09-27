// syncOutbox.test.ts — canh hàng đợi gửi lại tiến độ (slice S09-2, AC-8 → AC-17).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ Authorization: 'Bearer t' }) }))

import {
  enqueue,
  flush,
  pending,
  pendingProgrammingItems,
  isBlockedByAuth,
  subscribe,
  registerKindHandler,
  getSyncVersion,
  setSyncVersion,
  backoffMs,
  newAttemptId,
  DEBOUNCE_MS,
  MAX_TRIES,
  OUTBOX_KEY,
  __resetOutboxForTests,
  type OutboxEntry,
} from './syncOutbox'

const UID = '11111111-1111-4111-8111-111111111111'

/** Handler tối thiểu cho loại `english` (thân request đọc "localStorage" lúc gửi). */
function registerEnglish(): void {
  registerKindHandler('english', {
    buildRequest: (uid, entry) => ({
      url: '/api/progress',
      body: {
        learned: JSON.parse(localStorage.getItem(`et_learned_${uid}`) ?? '[]') as string[],
        sync: { attemptId: entry.attemptId, baseVersion: getSyncVersion(uid) },
      },
    }),
  })
}

function readOutbox(uid: string): OutboxEntry[] {
  return JSON.parse(localStorage.getItem(OUTBOX_KEY(uid)) ?? '[]') as OutboxEntry[]
}

function mockFetch(impl: (url: string, init?: RequestInit) => Response) {
  const fn = vi.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)))
  vi.stubGlobal('fetch', fn as unknown as typeof fetch)
  return fn
}

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

function bodyOf(call: unknown[]): Record<string, unknown> {
  return JSON.parse(String((call[1] as RequestInit).body)) as Record<string, unknown>
}

beforeEach(() => {
  localStorage.clear()
  __resetOutboxForTests()
  registerEnglish()
  setOnline(true)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  __resetOutboxForTests()
})

describe('AC-8 — mất mạng khi gửi: không mất, tự gửi khi có mạng lại', () => {
  it('offline → KHÔNG gọi fetch, mục nằm trong hàng đợi của đúng chủ', async () => {
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    setOnline(false)
    enqueue(UID, 'english')
    const res = await flush(UID)
    expect(fn).not.toHaveBeenCalled()
    expect(res.blocked).toBe('offline')
    expect(pending(UID)).toBe(1)
    expect(readOutbox(UID)[0]?.kind).toBe('english')
  })

  it('có mạng lại → gửi đúng MỘT request, hàng đợi rỗng sau 200', async () => {
    const fn = mockFetch(() => new Response('{"ok":true,"version":4}', { status: 200 }))
    setOnline(false)
    enqueue(UID, 'english')
    await flush(UID)
    setOnline(true)
    localStorage.setItem(`et_learned_${UID}`, JSON.stringify(['cat']))
    await flush(UID, { resetBackoff: true })
    expect(fn).toHaveBeenCalledTimes(1)
    // Bản chụp phải đọc localStorage LÚC GỬI, không phải lúc xếp hàng.
    expect(bodyOf(fn.mock.calls[0]!).learned).toEqual(['cat'])
    expect(pending(UID)).toBe(0)
    expect(getSyncVersion(UID)).toBe(0) // handler test không ghi version — xem AC-11 cho ca thật
  })
})

describe('AC-9 — gộp nhiều thay đổi thành một request', () => {
  it('40 lần xếp hàng liên tiếp → đúng 1 mục english, 1 request', async () => {
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    for (let i = 0; i < 40; i++) enqueue(UID, 'english')
    expect(pending(UID)).toBe(1)
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('xếp hàng KHÔNG gửi ngay; chỉ gửi sau debounce hoặc khi flush tay', async () => {
    vi.useFakeTimers()
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    try {
      enqueue(UID, 'english')
      expect(fn).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10)
    } finally {
      // `scheduleFlush` bắn `void flush(uid)` không được chờ — bản thân `flush()` giờ `await
      // import()` lười phần gửi (lib/syncOutbox.ts, 2026-09-16), và dynamic import cần I/O THẬT
      // (transform module) mà `advanceTimersByTimeAsync` không thay thế được. Chuyển về timer
      // THẬT rồi `await flush(uid)` lại — `flush` trả ĐÚNG promise đang dở (khoá qua `inFlight`)
      // nên đây là chờ đúng lượt gửi đã bắt đầu, không phải bắn thêm request thứ hai. Đặt trong
      // `finally` để timer thật luôn được khôi phục dù assertion phía trên có rớt.
      vi.useRealTimers()
      await flush(UID)
    }
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('programming: nhiều bài gộp vào MỘT batch theo lessonId, completed không kéo lùi', async () => {
    const fn = mockFetch(() => new Response('{"ok":true,"lessons":[]}', { status: 200 }))
    enqueue(UID, 'programming', [{ lessonId: 'a', status: 'completed', clientUpdatedAt: 'T1' }])
    enqueue(UID, 'programming', [{ lessonId: 'a', status: 'in_progress', clientUpdatedAt: 'T2' }])
    enqueue(UID, 'programming', [{ lessonId: 'b', status: 'completed', clientUpdatedAt: 'T3' }])
    expect(pending(UID)).toBe(1)
    registerKindHandler('programming', {
      buildRequest: (_uid, entry) => ({
        url: '/api/programming/progress',
        body: { attemptId: entry.attemptId, items: entry.payload },
      }),
    })
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(1)
    const items = bodyOf(fn.mock.calls[0]!).items as { lessonId: string; status: string }[]
    expect(items).toEqual([
      { lessonId: 'a', status: 'completed', clientUpdatedAt: 'T1' },
      { lessonId: 'b', status: 'completed', clientUpdatedAt: 'T3' },
    ])
  })
})

describe('AC-10 — backoff có trần, không gửi lại lỗi 4xx vĩnh viễn', () => {
  it('2s → 4s → 8s → 16s → 32s rồi chạm trần 32s; 429 theo Retry-After', () => {
    expect([1, 2, 3, 4, 5, 6].map((t) => backoffMs(t))).toEqual([
      2000, 4000, 8000, 16000, 32000, 32000,
    ])
    expect(backoffMs(1, 90_000)).toBe(90_000)
  })

  it('5xx → giữ mục, tăng tries, hẹn giờ thử lại', async () => {
    mockFetch(() => new Response('boom', { status: 500 }))
    enqueue(UID, 'english')
    await flush(UID)
    const entry = readOutbox(UID)[0]!
    expect(entry.tries).toBe(1)
    expect(entry.lastError).toBe('http_5xx')
    expect(entry.nextAt).toBeGreaterThan(Date.now())
  })

  it('429 → lùi theo header Retry-After', async () => {
    mockFetch(() => new Response('slow down', { status: 429, headers: { 'Retry-After': '30' } }))
    enqueue(UID, 'english')
    const before = Date.now()
    await flush(UID)
    const entry = readOutbox(UID)[0]!
    expect(entry.lastError).toBe('http_429')
    expect(entry.nextAt).toBeGreaterThanOrEqual(before + 30_000)
  })

  it('400 → XOÁ mục (gửi lại mãi cũng hỏng) và ghi cảnh báo kèm attemptId', async () => {
    mockFetch(() => new Response('bad', { status: 400 }))
    enqueue(UID, 'english')
    const attemptId = readOutbox(UID)[0]!.attemptId
    await flush(UID)
    expect(pending(UID)).toBe(0)
    expect(vi.mocked(console.warn).mock.calls.flat().join(' ')).toContain(attemptId)
  })

  it('hết MAX_TRIES lần tự động → dừng hẹn giờ, mục VẪN nằm lại chờ online/flush tay', async () => {
    mockFetch(() => new Response('boom', { status: 500 }))
    enqueue(UID, 'english')
    for (let i = 0; i < MAX_TRIES; i++) {
      // Mô phỏng "đã tới hạn thử lại" mà KHÔNG reset bộ đếm (reset chỉ xảy ra khi có mạng lại /
      // mở lại app — xem ca `online` ở AC-8).
      const entries = JSON.parse(localStorage.getItem(OUTBOX_KEY(UID))!) as OutboxEntry[]
      entries[0]!.nextAt = 0
      localStorage.setItem(OUTBOX_KEY(UID), JSON.stringify(entries))
      await flush(UID)
    }
    const entry = readOutbox(UID)[0]!
    expect(entry.nextAt).toBe(Number.MAX_SAFE_INTEGER)
    expect(pending(UID)).toBe(1)
  })
})

describe('AC-11 — server lưu rồi timeout: gửi lại CÙNG attemptId', () => {
  it('lần 1 lỗi mạng, lần 2 trả replayed → cùng attemptId, coi là thành công, ghi version', async () => {
    registerKindHandler('english', {
      buildRequest: (uid, entry) => ({
        url: '/api/progress',
        body: { sync: { attemptId: entry.attemptId, baseVersion: getSyncVersion(uid) } },
      }),
      onSuccess: (uid, _entry, body) => {
        const v = (body as { version?: number }).version
        if (typeof v === 'number') setSyncVersion(uid, v)
      },
    })
    let call = 0
    const fn = mockFetch(() => {
      call++
      if (call === 1) throw new Error('mạng rớt sau khi server đã commit')
      return new Response('{"ok":true,"version":9,"replayed":true}', { status: 200 })
    })
    enqueue(UID, 'english')
    await flush(UID)
    await flush(UID, { resetBackoff: true })
    const first = bodyOf(fn.mock.calls[0]!).sync as { attemptId: string }
    const second = bodyOf(fn.mock.calls[1]!).sync as { attemptId: string }
    expect(second.attemptId).toBe(first.attemptId)
    expect(pending(UID)).toBe(0)
    expect(getSyncVersion(UID)).toBe(9)
  })

  it('payload ĐỔI giữa hai lần gửi → attemptId MỚI (không bị server trả lại biên nhận cũ)', async () => {
    mockFetch(() => new Response('boom', { status: 500 }))
    enqueue(UID, 'english')
    const first = readOutbox(UID)[0]!.attemptId
    await flush(UID)
    enqueue(UID, 'english') // người học vừa học thêm → nội dung khác
    expect(readOutbox(UID)[0]!.attemptId).not.toBe(first)
  })

  it('programming: payload đổi → attemptId đổi; xếp lại y nguyên → giữ nguyên', () => {
    enqueue(UID, 'programming', [{ lessonId: 'a', status: 'completed', clientUpdatedAt: 'T1' }])
    const first = readOutbox(UID)[0]!.attemptId
    enqueue(UID, 'programming', [{ lessonId: 'a', status: 'completed', clientUpdatedAt: 'T1' }])
    expect(readOutbox(UID)[0]!.attemptId).toBe(first)
    enqueue(UID, 'programming', [{ lessonId: 'b', status: 'completed', clientUpdatedAt: 'T2' }])
    expect(readOutbox(UID)[0]!.attemptId).not.toBe(first)
  })
})

describe('AC-12 — hai tab cùng chủ: chỉ một tab gửi', () => {
  it('không lấy được khoá Web Locks → thoát, KHÔNG gửi, mục vẫn nằm lại', async () => {
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    const locks = {
      request: vi.fn(async (_n: string, _o: unknown, cb: (l: null) => unknown) => cb(null)),
    }
    Object.defineProperty(navigator, 'locks', { value: locks, configurable: true })
    enqueue(UID, 'english')
    const res = await flush(UID)
    expect(fn).not.toHaveBeenCalled()
    expect(res.blocked).toBe('locked')
    expect(pending(UID)).toBe(1)
    Reflect.deleteProperty(navigator, 'locks')
  })

  it('trình duyệt KHÔNG có Web Locks → vẫn gửi (server merge, không mất dữ liệu)', async () => {
    Reflect.deleteProperty(navigator, 'locks')
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    enqueue(UID, 'english')
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('AC-13 — hết auth và đổi tài khoản', () => {
  const OTHER = '22222222-2222-4222-8222-222222222222'

  it('401 → giữ mục, báo blocked auth, không gửi tiếp', async () => {
    const fn = mockFetch(() => new Response('unauthorized', { status: 401 }))
    enqueue(UID, 'english')
    const res = await flush(UID)
    expect(res.blocked).toBe('auth')
    expect(pending(UID)).toBe(1)
    expect(isBlockedByAuth(UID)).toBe(true)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('đăng nhập lại ĐÚNG chủ → gửi hết; hàng đợi chủ KHÁC không bị đụng tới', async () => {
    mockFetch(() => new Response('unauthorized', { status: 401 }))
    enqueue(UID, 'english')
    enqueue(OTHER, 'english')
    await flush(UID)
    mockFetch(() => new Response('{}', { status: 200 }))
    await flush(UID, { resetBackoff: true })
    expect(pending(UID)).toBe(0)
    expect(pending(OTHER)).toBe(1) // chủ khác: KHÔNG gửi chéo, cũng KHÔNG xoá
  })

  it('khách vãng lai không bao giờ vào hàng đợi', async () => {
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    enqueue('guest_abc', 'english')
    expect(pending('guest_abc')).toBe(0)
    await flush('guest_abc')
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('AC-15/AC-17 — phủ mục chờ, thông báo, dọn hàng đợi giả', () => {
  it('pendingProgrammingItems trả các bài chờ gửi (để phủ lên bản server khi đọc)', () => {
    enqueue(UID, 'programming', [{ lessonId: 'a', status: 'completed', clientUpdatedAt: 'T1' }])
    expect(pendingProgrammingItems(UID)).toEqual([
      { lessonId: 'a', status: 'completed', clientUpdatedAt: 'T1' },
    ])
    expect(pendingProgrammingItems('guest_abc')).toEqual([])
  })

  it('subscribe nhận thông báo khi hàng đợi đổi, huỷ đăng ký thì thôi', () => {
    const seen: string[] = []
    const off = subscribe((uid) => seen.push(uid))
    enqueue(UID, 'english')
    expect(seen).toContain(UID)
    off()
    seen.length = 0
    enqueue(UID, 'english')
    expect(seen).toEqual([])
  })

  it('khoá hàng đợi tách theo chủ sở hữu (không còn khoá dùng chung như offlineStore cũ)', () => {
    enqueue(UID, 'english')
    expect(localStorage.getItem(OUTBOX_KEY(UID))).not.toBeNull()
    expect(localStorage.getItem('donghanh_offline_queue')).toBeNull()
  })

  it('localStorage hỏng (ném khi ghi) → vẫn xếp hàng được trong bộ nhớ, vẫn gửi lên server', async () => {
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    enqueue(UID, 'english')
    expect(pending(UID)).toBe(1)
    setItem.mockRestore()
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('AC-16 — hợp đồng cho loại evidence (S11)', () => {
  it('mỗi bằng chứng là một mục riêng, gửi qua cùng cơ chế retry/401', async () => {
    registerKindHandler('evidence', {
      buildRequest: (_uid, entry) => ({ url: '/api/learning/evidence', body: entry.payload }),
    })
    const fn = mockFetch(() => new Response('{"ok":true}', { status: 200 }))
    enqueue(UID, 'evidence', { attemptId: 'e1', lessonId: 'x' })
    enqueue(UID, 'evidence', { attemptId: 'e2', lessonId: 'y' })
    expect(pending(UID)).toBe(2)
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn.mock.calls[0]![0]).toBe('/api/learning/evidence')
    expect(pending(UID)).toBe(0)
  })
})

describe('tiện ích', () => {
  it('newAttemptId sinh id duy nhất, dài trong khoảng server chấp nhận (8..64)', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newAttemptId()))
    expect(ids.size).toBe(50)
    for (const id of ids) {
      expect(id.length).toBeGreaterThanOrEqual(8)
      expect(id.length).toBeLessThanOrEqual(64)
    }
  })

  it('crypto.randomUUID thiếu → vẫn sinh được id (trình duyệt cũ / ngữ cảnh không bảo mật)', () => {
    const original = globalThis.crypto
    vi.stubGlobal('crypto', {})
    expect(newAttemptId().length).toBeGreaterThanOrEqual(8)
    vi.stubGlobal('crypto', original)
  })

  it('version chỉ nhận số dương; giá trị rác → 0', () => {
    expect(getSyncVersion(UID)).toBe(0)
    setSyncVersion(UID, 0)
    expect(getSyncVersion(UID)).toBe(0)
    setSyncVersion(UID, 7)
    expect(getSyncVersion(UID)).toBe(7)
    localStorage.setItem(`dhcb_sync_version_${UID}`, 'rác')
    expect(getSyncVersion(UID)).toBe(0)
  })
})

describe('audit — chia batch chấm và bảo toàn bài khi bảo trì', () => {
  const item = (index: number) => ({
    lessonId: `git-u${index}-l1`,
    status: 'completed' as const,
    clientUpdatedAt: '2026-09-27T00:00:00Z',
    code: `# draft ${index}`,
  })
  function registerProgramming() {
    registerKindHandler('programming', {
      buildRequest: (_uid, entry) => ({
        url: '/api/programming/progress',
        body: { attemptId: entry.attemptId, items: entry.payload },
      }),
    })
  }

  it('12 bài có code được chia 5+5+2, giữ đủ bài và id retry ổn định', async () => {
    registerProgramming()
    const items = Array.from({ length: 12 }, (_, i) => item(i))
    enqueue(UID, 'programming', items)
    const ids = readOutbox(UID).map((entry) => entry.attemptId)
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
    expect(pendingProgrammingItems(UID)).toEqual(items)
    const fn = mockFetch(() => new Response('boom', { status: 500 }))
    await flush(UID)
    expect(fn.mock.calls.map((call) => (bodyOf(call).items as unknown[]).length)).toEqual([5, 5, 2])
    expect(readOutbox(UID).map((entry) => entry.attemptId)).toEqual(ids)
    mockFetch(() => new Response('{}', { status: 200 }))
    await flush(UID, { resetBackoff: true })
    expect(pending(UID)).toBe(0)
  })

  it('51 bài in_progress không bị slice(-50) làm mất bài đầu', () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      ...item(i),
      status: 'in_progress' as const,
    }))
    enqueue(UID, 'programming', items)
    expect(pendingProgrammingItems(UID)).toEqual(items)
    expect(readOutbox(UID).map((entry) => (entry.payload as unknown[]).length)).toEqual([50, 1])
  })

  it('thêm bài thứ 6 không đổi receipt của batch 5 bài đang chờ', () => {
    enqueue(
      UID,
      'programming',
      Array.from({ length: 5 }, (_, index) => item(index)),
    )
    const first = readOutbox(UID)[0]!
    enqueue(UID, 'programming', [item(5)])
    expect(readOutbox(UID)[0]?.attemptId).toBe(first.attemptId)
    expect(readOutbox(UID)[0]?.payload).toEqual(first.payload)
    expect(pendingProgrammingItems(UID)).toHaveLength(6)
  })

  it('hơn 200 mục bị bảo trì không mất code khi ghi thêm vào hàng đợi', () => {
    enqueue(UID, 'programming', [item(0)])
    const base = readOutbox(UID)[0]!
    const parked = Array.from({ length: 205 }, (_, index) => ({
      ...base,
      attemptId: `parked-${index}`,
      payload: [item(index)],
      lastError: 'grading_unavailable',
      nextAt: Number.MAX_SAFE_INTEGER,
    }))
    localStorage.setItem(OUTBOX_KEY(UID), JSON.stringify(parked))
    enqueue(UID, 'english')
    expect(pendingProgrammingItems(UID)).toHaveLength(205)
    expect(pendingProgrammingItems(UID)[0]?.code).toBe('# draft 0')
  })

  it('hàng đợi phiên bản cũ 12 completion được chia trước gửi, không nhận 413 rồi mất bài', async () => {
    registerProgramming()
    enqueue(UID, 'programming', [item(0)])
    const legacy = readOutbox(UID)[0]!
    legacy.payload = Array.from({ length: 12 }, (_, i) => item(i))
    localStorage.setItem(OUTBOX_KEY(UID), JSON.stringify([legacy]))
    const fn = mockFetch(() => new Response('{}', { status: 200 }))
    await flush(UID)
    expect(fn.mock.calls.map((call) => (bodyOf(call).items as unknown[]).length)).toEqual([5, 5, 2])
    expect(fn.mock.calls.flatMap((call) => bodyOf(call).items)).toEqual(legacy.payload)
    expect(pending(UID)).toBe(0)
  })

  it('503 maintenance tách bài, giữ code đã nộp; mô phỏng khác vẫn đồng bộ, không tự quay vòng', async () => {
    registerProgramming()
    const paused = { ...item(0), lessonId: 'p1-u1-l1', code: 'print(1)' }
    enqueue(UID, 'programming', [paused, item(1)])
    const fn = mockFetch((_url, init) => {
      const body = JSON.parse(String(init?.body)) as { items: Array<{ lessonId: string }> }
      return body.items.some((entry) => entry.lessonId === paused.lessonId)
        ? new Response(JSON.stringify({ code: 'PROGRAMMING_GRADING_UNAVAILABLE' }), { status: 503 })
        : new Response('{}', { status: 200 })
    })
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(3) // batch ban đầu, rồi từng bài để cô lập maintenance
    expect(pendingProgrammingItems(UID)).toEqual([paused])
    const held = readOutbox(UID)[0]!
    expect(held.lastError).toBe('grading_unavailable')
    expect(held.nextAt).toBe(Number.MAX_SAFE_INTEGER)
    await flush(UID)
    enqueue(UID, 'programming', [paused]) // xếp lại y nguyên cũng không mở retry
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(readOutbox(UID)[0]?.attemptId).toBe(held.attemptId)
    mockFetch(() => new Response('{}', { status: 200 }))
    await flush(UID, { resetBackoff: true })
    expect(pending(UID)).toBe(0)
  })

  it('413 ngân sách server đổi: tách payload/id, không bỏ bài', async () => {
    registerProgramming()
    enqueue(UID, 'programming', [item(0), item(1)])
    const fn = mockFetch((_url, init) => {
      const body = JSON.parse(String(init?.body)) as { items: unknown[] }
      return body.items.length > 1
        ? new Response(JSON.stringify({ code: 'PROGRAMMING_GRADING_BATCH_LIMIT' }), { status: 413 })
        : new Response('{}', { status: 200 })
    })
    await flush(UID)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(new Set(fn.mock.calls.map((call) => bodyOf(call).attemptId)).size).toBe(3)
    expect(pending(UID)).toBe(0)
  })

  it('bài đã completed nhưng sửa code sau đó: giữ bản mới và đổi attemptId', () => {
    enqueue(UID, 'programming', [item(0)])
    const before = readOutbox(UID)[0]!.attemptId
    const newer = { ...item(0), code: '# fixed draft', clientUpdatedAt: '2026-09-27T01:00:00Z' }
    enqueue(UID, 'programming', [newer])
    expect(pendingProgrammingItems(UID)).toEqual([newer])
    expect(readOutbox(UID)[0]?.attemptId).not.toBe(before)
  })
})

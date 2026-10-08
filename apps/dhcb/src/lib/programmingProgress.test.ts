import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({}) }))

import {
  fetchProgress,
  fetchProgressWithState,
  fetchProgressWithStatus,
  saveLessonProgress,
  isLessonCompleted,
  type ProgrammingLessonProgress,
} from './programmingProgress'
import { enqueue, flush as flushSync, pending } from './syncOutbox'

const UID = 'u1'
const CACHE_KEY = `dhcb_prog_progress_${UID}`

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  const fn = vi.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)))
  vi.stubGlobal('fetch', fn as unknown as typeof fetch)
  return fn
}

const okJson = (body: unknown) => ({ ok: true, json: async () => body })

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('programmingProgress — đọc tiến độ', () => {
  it('server trả dữ liệu → dùng dữ liệu server và ghi cache', async () => {
    const lessons: ProgrammingLessonProgress[] = [
      { lessonId: 'p1-u4-l1', status: 'completed', completedAt: 123 },
    ]
    mockFetch(() => okJson({ lessons }))
    expect(await fetchProgress(UID)).toEqual(lessons)
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual(lessons)
  })

  it('server lỗi HTTP → rơi về cache đã lưu', async () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify([{ lessonId: 'p1-u1-l1', status: 'in_progress', completedAt: null }]),
    )
    mockFetch(() => ({ ok: false, json: async () => ({}) }))
    const got = await fetchProgress(UID)
    expect(got.map((l) => l.lessonId)).toEqual(['p1-u1-l1'])
  })

  it('mất mạng (fetch ném lỗi) → cache; cache hỏng → mảng rỗng, không ném', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    expect(await fetchProgress(UID)).toEqual([])
    localStorage.setItem(CACHE_KEY, '{{{ hỏng')
    expect(await fetchProgress(UID)).toEqual([])
  })
})

describe('programmingProgress — ghi tiến độ', () => {
  // S09-2: không POST thẳng nữa — ghi cache rồi XẾP HÀNG (`syncOutbox`), hàng đợi gộp nhiều bài
  // thành MỘT batch khi gửi. Nhờ vậy hoàn thành bài lúc mất mạng không còn bị nuốt (phát hiện F4).
  it('bài mới → thêm vào cache + xếp hàng đợi, gửi batch đúng thân yêu cầu', async () => {
    const fn = mockFetch(() => okJson({ ok: true, replayed: false, lessons: [] }))
    await saveLessonProgress(UID, 'p1-u4-l1', 'in_progress')
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY)!) as ProgrammingLessonProgress[]
    expect(cache).toEqual([{ lessonId: 'p1-u4-l1', status: 'in_progress', completedAt: null }])
    expect(fn).not.toHaveBeenCalled() // chưa gửi ngay — chờ gộp
    expect(pending(UID)).toBe(1)

    await flushSync(UID)
    const body = JSON.parse(String((fn.mock.calls[0]?.[1] as RequestInit).body)) as {
      attemptId: string
      items: { lessonId: string; status: string }[]
    }
    expect(typeof body.attemptId).toBe('string')
    expect(body.items).toEqual([
      { lessonId: 'p1-u4-l1', status: 'in_progress', clientUpdatedAt: expect.any(String) },
    ])
    expect(pending(UID)).toBe(0)
  })

  it('hai bài hoàn thành liên tiếp → MỘT request batch, không phải hai (AC-9)', async () => {
    const fn = mockFetch(() => okJson({ ok: true, replayed: false, lessons: [] }))
    await saveLessonProgress(UID, 'p1-u4-l1', 'completed')
    await saveLessonProgress(UID, 'p1-u4-l2', 'completed')
    await flushSync(UID)
    expect(fn).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String((fn.mock.calls[0]?.[1] as RequestInit).body)) as {
      items: { lessonId: string }[]
    }
    expect(body.items.map((i) => i.lessonId)).toEqual(['p1-u4-l1', 'p1-u4-l2'])
  })

  it('hoàn thành → có completedAt; học lại KHÔNG kéo lùi về in_progress (bất biến)', async () => {
    mockFetch(() => okJson({ ok: true }))
    await saveLessonProgress(UID, 'p1-u4-l1', 'completed')
    const first = JSON.parse(localStorage.getItem(CACHE_KEY)!)[0] as ProgrammingLessonProgress
    expect(first.status).toBe('completed')
    expect(first.completedAt).toBeTypeOf('number')

    await saveLessonProgress(UID, 'p1-u4-l1', 'in_progress')
    const after = JSON.parse(localStorage.getItem(CACHE_KEY)!)[0] as ProgrammingLessonProgress
    expect(after.status).toBe('completed')
    expect(after.completedAt).toBe(first.completedAt)
  })

  it('đang học rồi mới hoàn thành → cập nhật đúng mốc thời gian', async () => {
    mockFetch(() => okJson({ ok: true }))
    await saveLessonProgress(UID, 'p1-u1-l1', 'in_progress')
    await saveLessonProgress(UID, 'p1-u1-l1', 'completed')
    const row = JSON.parse(localStorage.getItem(CACHE_KEY)!)[0] as ProgrammingLessonProgress
    expect(row.status).toBe('completed')
    expect(row.completedAt).toBeTypeOf('number')
  })

  it('ngoại tuyến → vẫn ghi cache, KHÔNG ném lỗi ra ngoài', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    await expect(saveLessonProgress(UID, 'p1-u4-l1', 'completed')).resolves.toBeUndefined()
    expect(localStorage.getItem(CACHE_KEY)).toContain('p1-u4-l1')
  })
})

describe('isLessonCompleted', () => {
  const lessons: ProgrammingLessonProgress[] = [
    { lessonId: 'a', status: 'completed', completedAt: 1 },
    { lessonId: 'b', status: 'in_progress', completedAt: null },
  ]
  it('chỉ true khi bài đó ở trạng thái completed', () => {
    expect(isLessonCompleted(lessons, 'a')).toBe(true)
    expect(isLessonCompleted(lessons, 'b')).toBe(false)
    expect(isLessonCompleted(lessons, 'không-có')).toBe(false)
    expect(isLessonCompleted([], 'a')).toBe(false)
  })
})

// ── AC-15: hoàn thành bài lúc mất mạng KHÔNG còn biến mất khi fetch về ──
// Trước S09-2, `fetchProgress` ghi đè thẳng cache bằng bản server (chưa có bài vừa học offline)
// nên bài đó mất hẳn và không bao giờ được gửi lại (phát hiện F4 của đặc tả).
describe('programmingProgress — mục còn chờ gửi được phủ lên bản server (AC-15)', () => {
  it('offline → hoàn thành bài → đọc lại (server chưa có bài) → bài VẪN hoàn thành', async () => {
    mockFetch(() => okJson({ ok: true, replayed: false, lessons: [] }))
    await saveLessonProgress(UID, 'p1-u4-l9', 'completed')
    // Server trả về bản CHƯA có bài vừa học (mục còn nằm trong hàng đợi).
    mockFetch(() =>
      okJson({ lessons: [{ lessonId: 'p1-u4-l1', status: 'completed', completedAt: 1 }] }),
    )
    const lessons = await fetchProgress(UID)
    expect(isLessonCompleted(lessons, 'p1-u4-l9')).toBe(true)
    expect(isLessonCompleted(lessons, 'p1-u4-l1')).toBe(true)
    // Cache cũng phải giữ bài đó, nếu không lần mở sau lại mất.
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY)!) as ProgrammingLessonProgress[]
    expect(cache.some((l) => l.lessonId === 'p1-u4-l9' && l.status === 'completed')).toBe(true)
  })

  it('gửi xong (hàng đợi rỗng) → không phủ gì thêm, bản server là nguồn sự thật', async () => {
    mockFetch(() => okJson({ ok: true, replayed: false, lessons: [] }))
    await saveLessonProgress(UID, 'p1-u4-l9', 'completed')
    await flushSync(UID)
    expect(pending(UID)).toBe(0)
    mockFetch(() => okJson({ lessons: [] }))
    expect(await fetchProgress(UID)).toEqual([])
  })
})

describe('programmingProgress — khách vãng lai (localStorage LÀ nguồn sự thật)', () => {
  const GUEST = 'guest_abc'
  const GUEST_KEY = `dhcb_prog_progress_${GUEST}`

  it('đọc: KHÔNG gọi server, KHÔNG gắn cờ "từ cache" (không phải lỗi)', async () => {
    localStorage.setItem(
      GUEST_KEY,
      JSON.stringify([{ lessonId: 'p1-u1-l1', status: 'completed', completedAt: 5 }]),
    )
    const fetchFn = mockFetch(() => okJson({ lessons: [] }))
    expect(await fetchProgressWithStatus(GUEST)).toEqual({
      lessons: [{ lessonId: 'p1-u1-l1', status: 'completed', completedAt: 5 }],
      fromCache: false,
    })
    expect((await fetchProgressWithState(GUEST)).state).toBe('ready')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('ghi: lưu localStorage nhưng KHÔNG xếp hàng gửi server', async () => {
    await saveLessonProgress(GUEST, 'p1-u1-l2', 'completed')
    expect(isLessonCompleted(JSON.parse(localStorage.getItem(GUEST_KEY)!), 'p1-u1-l2')).toBe(true)
    expect(pending(GUEST)).toBe(0)
  })
})

describe('fetchProgressWithStatus / fetchProgressWithState — "chưa học" khác "chưa đo được"', () => {
  const cached = [{ lessonId: 'p1-u1-l1', status: 'in_progress', completedAt: null }]

  it('server lỗi HTTP → trả cache kèm cờ lỗi', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
    mockFetch(() => ({ ok: false, json: async () => ({}) }))
    expect(await fetchProgressWithStatus(UID)).toEqual({ lessons: cached, fromCache: true })
    expect(await fetchProgressWithState(UID)).toEqual({ lessons: cached, state: 'error' })
  })

  it('mất mạng → trả cache kèm cờ lỗi, không ném', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    expect(await fetchProgressWithStatus(UID)).toEqual({ lessons: cached, fromCache: true })
    expect(await fetchProgressWithState(UID)).toEqual({ lessons: cached, state: 'error' })
  })

  it('server trả thân thiếu `lessons` → coi là rỗng (không ném) và GHI ĐÈ cache cũ', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
    mockFetch(() => okJson({}))
    expect(await fetchProgressWithState(UID)).toEqual({ lessons: [], state: 'ready' })
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual([])
  })

  it('fetchProgressWithState cũng phủ mục còn chờ gửi lên bản server', async () => {
    const at = '2026-10-01T00:00:00.000Z'
    enqueue(UID, 'programming', [
      { lessonId: 'p1-u2-l1', status: 'completed', clientUpdatedAt: at },
    ])
    mockFetch(() => okJson({ lessons: [] }))
    expect(await fetchProgressWithState(UID)).toEqual({
      lessons: [{ lessonId: 'p1-u2-l1', status: 'completed', completedAt: Date.parse(at) }],
      state: 'ready',
    })
  })
})

describe('overlayPending — luật phủ giống server: completed không bao giờ bị kéo lùi', () => {
  it('server "đang học" + mục chờ "hoàn thành" → hoàn thành, completedAt theo mốc client', async () => {
    const at = '2026-10-02T00:00:00.000Z'
    enqueue(UID, 'programming', [
      { lessonId: 'p1-u3-l1', status: 'completed', clientUpdatedAt: at },
    ])
    mockFetch(() =>
      okJson({ lessons: [{ lessonId: 'p1-u3-l1', status: 'in_progress', completedAt: null }] }),
    )
    expect(await fetchProgress(UID)).toEqual([
      { lessonId: 'p1-u3-l1', status: 'completed', completedAt: Date.parse(at) },
    ])
  })

  it('server "hoàn thành" + mục chờ "đang học" → GIỮ hoàn thành và mốc của server', async () => {
    enqueue(UID, 'programming', [
      { lessonId: 'p1-u3-l2', status: 'in_progress', clientUpdatedAt: '2026-10-03T00:00:00.000Z' },
    ])
    const server = [{ lessonId: 'p1-u3-l2', status: 'completed', completedAt: 7 }]
    mockFetch(() => okJson({ lessons: server }))
    expect(await fetchProgress(UID)).toEqual(server)
  })

  it('mục chờ "đang học" cho bài server chưa có → thêm với completedAt null', async () => {
    enqueue(UID, 'programming', [
      { lessonId: 'p1-u3-l3', status: 'in_progress', clientUpdatedAt: '2026-10-03T00:00:00.000Z' },
    ])
    mockFetch(() => okJson({ lessons: [] }))
    expect(await fetchProgress(UID)).toEqual([
      { lessonId: 'p1-u3-l3', status: 'in_progress', completedAt: null },
    ])
  })

  it('mốc client hỏng: bài mới → completedAt null (KHÔNG NaN); bài đã có → "bây giờ"', async () => {
    enqueue(UID, 'programming', [
      { lessonId: 'moi', status: 'completed', clientUpdatedAt: 'không-phải-ngày' },
      { lessonId: 'cu', status: 'completed', clientUpdatedAt: 'không-phải-ngày' },
    ])
    mockFetch(() =>
      okJson({ lessons: [{ lessonId: 'cu', status: 'in_progress', completedAt: null }] }),
    )
    const now = vi.spyOn(Date, 'now').mockReturnValue(999)
    let lessons: ProgrammingLessonProgress[]
    try {
      lessons = await fetchProgress(UID)
    } finally {
      now.mockRestore()
    }
    expect(lessons).toEqual([
      { lessonId: 'cu', status: 'completed', completedAt: 999 },
      { lessonId: 'moi', status: 'completed', completedAt: null },
    ])
  })
})

describe('saveLessonProgress — localStorage đầy/bị chặn', () => {
  it('ghi cache ném lỗi → không ném ra ngoài, vẫn xếp hàng gửi server', async () => {
    const original = localStorage.setItem.bind(localStorage)
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === CACHE_KEY) throw new DOMException('đầy', 'QuotaExceededError')
      // Mọi khoá khác (hàng đợi gửi) ghi bình thường qua bản gốc.
      original(key, value)
    })
    try {
      await expect(saveLessonProgress(UID, 'p1-u5-l1', 'completed')).resolves.toBeUndefined()
    } finally {
      setItem.mockRestore()
    }
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
    expect(pending(UID)).toBeGreaterThan(0)
  })
})

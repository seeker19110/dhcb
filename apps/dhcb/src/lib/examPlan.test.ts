// Test examPlan (client) — ghép dữ liệu học thật vào hàm lập lịch thuần, và gọi API an toàn.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ Authorization: 'Bearer t' }) }))

const getLevelWordsMock = vi.fn()
const getDailySpeedMock = vi.fn(() => 10)
vi.mock('./curriculum', () => ({
  getLevelWords: (...a: unknown[]) => getLevelWordsMock(...a),
  getDailySpeed: () => getDailySpeedMock(),
}))
const getLearnedWordsMock = vi.fn(() => new Set<string>())
vi.mock('./vocab', () => ({ getLearnedWords: () => getLearnedWordsMock() }))
const getSRSStatsMock = vi.fn(() => ({ total: 0, due: 0 }))
vi.mock('./srs', () => ({ getSRSStats: () => getSRSStatsMock() }))

const {
  computeTodayPlan,
  getExamScopeWords,
  suggestedDailyCap,
  fetchExamPlan,
  createExamPlan,
  endExamPlan,
} = await import('./examPlan')

const PLAN = {
  examDate: '2026-12-26',
  dailyCapItems: 20,
  restDays: [] as number[],
  scopeItems: 999,
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  getLevelWordsMock.mockReset()
  getLearnedWordsMock.mockReturnValue(new Set<string>())
  getSRSStatsMock.mockReturnValue({ total: 0, due: 0 })
  // A1/A2/B1 mỗi cấp 2 từ, trong đó 'apple' xuất hiện ở hai cấp (kiểm khử trùng).
  getLevelWordsMock
    .mockReturnValueOnce([{ word: 'Apple' }, { word: 'book' }])
    .mockReturnValueOnce([{ word: 'apple' }, { word: 'cat' }])
    .mockReturnValueOnce([{ word: 'dog' }, { word: 'egg' }])
})
afterEach(() => vi.unstubAllGlobals())

function res(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body }
}

describe('getExamScopeWords', () => {
  it('gộp A1+A2+B1 và KHỬ TRÙNG không phân biệt hoa thường', () => {
    expect(getExamScopeWords().sort()).toEqual(['apple', 'book', 'cat', 'dog', 'egg'])
  })
})

describe('computeTodayPlan', () => {
  it('đếm "đã nắm" theo giao của từ đã thuộc với phạm vi thi', () => {
    getLearnedWordsMock.mockReturnValue(new Set(['apple', 'cat', 'ngoai-pham-vi']))
    const out = computeTodayPlan(PLAN, 'u1', '2026-08-26')
    expect(out.scopeItems).toBe(5)
    expect(out.masteredItems).toBe(2) // 'ngoai-pham-vi' KHÔNG được tính
  })

  it('lấy số thẻ đến hạn từ SRS thật', () => {
    getSRSStatsMock.mockReturnValue({ total: 100, due: 7 })
    expect(computeTodayPlan(PLAN, 'u1', '2026-08-26').todayReviewItems).toBe(7)
  })

  it('sát ngày thi → taper, không giao thêm mục mới', () => {
    const out = computeTodayPlan({ ...PLAN, examDate: '2026-08-28' }, 'u1', '2026-08-26')
    expect(out.phase).toBe('taper')
    expect(out.todayNewItems).toBe(0)
  })
})

describe('suggestedDailyCap', () => {
  it('mặc định bằng tốc độ học người dùng đã chọn', () => {
    getDailySpeedMock.mockReturnValue(20)
    expect(suggestedDailyCap('u1')).toBe(20)
  })
})

describe('gọi API', () => {
  // [changelog 0525] Lỗi phải NÉM, không được trả `null` — `null` nghĩa là "chưa có kế hoạch" và
  // trang sẽ mời tạo kế hoạch mới + đặt lại mức nhớ FSRS.
  it('fetchExamPlan: lỗi mạng → ném lỗi (không giả làm "chưa có kế hoạch")', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    await expect(fetchExamPlan()).rejects.toThrow('offline')
  })

  it('fetchExamPlan: HTTP 500 → ném lỗi', async () => {
    fetchMock.mockResolvedValue(res({ error: 'boom' }, false, 500))
    await expect(fetchExamPlan()).rejects.toThrow('HTTP 500')
  })

  it('fetchExamPlan: body thiếu khoá plan → ném lỗi', async () => {
    fetchMock.mockResolvedValue(res({}, true, 200))
    await expect(fetchExamPlan()).rejects.toThrow('không đúng định dạng')
  })

  it('fetchExamPlan: { plan: null } → null (thật sự chưa có kế hoạch)', async () => {
    fetchMock.mockResolvedValue(res({ plan: null }, true, 200))
    await expect(fetchExamPlan()).resolves.toBeNull()
  })

  it('createExamPlan: giữ nguyên thông điệp lỗi server (vd đã có kế hoạch)', async () => {
    fetchMock.mockResolvedValue(res({ error: 'Bạn đang có một kế hoạch ôn thi' }, false, 409))
    expect(
      await createExamPlan({ examKind: 'vao10-english', examDate: '2030-01-01', scopeItems: 1 }),
    ).toEqual({ ok: false, message: 'Bạn đang có một kế hoạch ôn thi' })
  })

  it('createExamPlan: 200 nhưng thiếu plan → coi là lỗi, không trả ok', async () => {
    fetchMock.mockResolvedValue(res({}))
    const out = await createExamPlan({
      examKind: 'vao10-english',
      examDate: '2030-01-01',
      scopeItems: 1,
    })
    expect(out.ok).toBe(false)
  })

  it('endExamPlan: mã hoá planId vào query', async () => {
    fetchMock.mockResolvedValue(res({ ok: true }))
    await endExamPlan('a b&c')
    expect(String(fetchMock.mock.calls[0]![0])).toContain('planId=a%20b%26c')
  })
})

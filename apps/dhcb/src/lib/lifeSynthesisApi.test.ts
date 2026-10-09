// lifeSynthesisApi.test.ts — phản hồi lệch hợp đồng là LỖI, không thành báo cáo nửa vời.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchLifeSynthesisReport, LIFE_SYNTHESIS_ENDPOINT } from './lifeSynthesisApi'

const REPORT = {
  schemaVersion: 2,
  generatedAt: '2026-10-09T03:00:00.000Z',
  windowDays: 30,
  windowStart: '2026-09-10',
  windowEnd: '2026-10-09',
  learning: { activeDays: 0, streakDays: 0, lastActiveDate: null, subjects: [] },
  notes: {
    totalTasks: 0,
    openTasks: 0,
    overdueTasks: 0,
    dueSoonTasks: 0,
    undatedOpenTasks: 0,
    blockedTasks: 0,
    totalNotes: 0,
    notesCreated: 0,
  },
  observations: [],
  recommendations: [],
}

function mockFetch(res: Partial<Response> & { body?: unknown }) {
  const fn = vi.fn().mockResolvedValueOnce({
    ok: res.ok ?? true,
    status: res.status ?? 200,
    json: async () => res.body,
  } as unknown as Response)
  global.fetch = fn
  return fn
}

describe('fetchLifeSynthesisReport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('GET đúng endpoint (không tham số), trả báo cáo đã parse', async () => {
    const fn = mockFetch({ body: { report: REPORT } })
    const report = await fetchLifeSynthesisReport()
    expect(report.windowDays).toBe(30)
    expect(fn).toHaveBeenCalledWith(LIFE_SYNTHESIS_ENDPOINT, expect.objectContaining({}))
    expect(LIFE_SYNTHESIS_ENDPOINT).toBe('/api/life-synthesis')
  })

  it('HTTP lỗi → ném lỗi kèm mã', async () => {
    mockFetch({ ok: false, status: 500 })
    await expect(fetchLifeSynthesisReport()).rejects.toThrow('Lỗi tải bản tổng hợp: 500')
  })

  it('bản v5.4 cũ (có điểm số) → ném lỗi sai định dạng', async () => {
    mockFetch({ body: { report: { schemaVersion: 'v5.4.0', holisticAlignmentScore: 88 } } })
    await expect(fetchLifeSynthesisReport()).rejects.toThrow('sai định dạng')
  })

  it('báo cáo đúng nhưng kèm trường điểm lạ → strict từ chối', async () => {
    mockFetch({ body: { report: { ...REPORT, lifeSynergyIndex: 92 } } })
    await expect(fetchLifeSynthesisReport()).rejects.toThrow('sai định dạng')
  })
})

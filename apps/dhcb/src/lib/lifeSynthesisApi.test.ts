import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchLifeSynthesisReport, generateCustomLifeSynthesisReport } from './lifeSynthesisApi'

describe('lifeSynthesisApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('fetches life synthesis report successfully', async () => {
    localStorage.setItem('gsa_session_present_v1', 'session:fixture')
    const mockReport = {
      schemaVersion: 'v5.4.0',
      holisticAlignmentScore: 88,
      domainBreakdown: [],
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, report: mockReport }),
    } as unknown as Response)

    const report = await fetchLifeSynthesisReport('weekly')
    expect(report.holisticAlignmentScore).toBe(88)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/life-synthesis?timeframe=weekly',
      expect.objectContaining({
        headers: {},
      }),
    )
  })

  it('posts custom synthesis report successfully', async () => {
    const mockReport = {
      schemaVersion: 'v5.4.0',
      holisticAlignmentScore: 92,
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, report: mockReport }),
    } as unknown as Response)

    const report = await generateCustomLifeSynthesisReport({
      timeframe: 'monthly',
      metacognitiveAwarenessIndex: 90,
    })

    expect(report.holisticAlignmentScore).toBe(92)
  })

  it('throws error when response not ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as unknown as Response)

    await expect(fetchLifeSynthesisReport()).rejects.toThrow(
      'Lỗi tải báo cáo tổng hợp đa miền: 500',
    )
  })
})

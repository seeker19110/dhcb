// LifeSynthesisDashboard.test.tsx — không còn số bịa (`|| 88`/`|| 92`/`|| 85` bản cũ): dữ liệu
// thiếu → "Chưa đủ dữ liệu"; điểm 0 thật vẫn là 0; chỉ in số đến từ báo cáo.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { LifeSynthesisReport } from '@dhcb/core-contracts/lifeSynthesis'
import LifeSynthesisDashboard from './LifeSynthesisDashboard'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const fetchReport = vi.hoisted(() => vi.fn())
vi.mock('../../lib/lifeSynthesisApi', () => ({
  fetchLifeSynthesisReport: fetchReport,
  generateCustomLifeSynthesisReport: vi.fn(),
}))

const NOI_DUNG_BIA = ['88', '92', '85']

function baoCao(patch: Partial<LifeSynthesisReport>): LifeSynthesisReport {
  return {
    schemaVersion: 'v5.4.0',
    timestamp: '2026-10-08T00:00:00Z',
    personId: 'u1',
    timeframe: 'weekly',
    holisticAlignmentScore: 41,
    lifeSynergyIndex: 17,
    cognitiveResilienceScore: 63,
    domainBreakdown: [],
    predictiveGoals: [],
    highLeverageRecommendations: [],
    synthesisSummaryMarkdown: '',
    ...patch,
  }
}

describe('LifeSynthesisDashboard — không bịa số', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    fetchReport.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  async function hien() {
    await act(async () => {
      root.render(<LifeSynthesisDashboard />)
    })
    await act(async () => {
      for (let i = 0; i < 6; i++) await Promise.resolve()
    })
  }

  const soHienThi = () =>
    Array.from(container.querySelectorAll('span.text-2xl')).map((e) => e.textContent)

  it('thiếu cả ba chỉ số → "Chưa đủ dữ liệu" ×3, không có số nào (đặc biệt 88/92/85)', async () => {
    // Server lệch hợp đồng: thiếu trường. Cast qua unknown vì cố ý tạo dữ liệu sai hình dạng.
    fetchReport.mockResolvedValue({
      timeframe: 'weekly',
      domainBreakdown: [],
    } as unknown as LifeSynthesisReport)
    await hien()
    expect(soHienThi()).toEqual([])
    expect(container.textContent?.match(/Chưa đủ dữ liệu/g)?.length).toBeGreaterThanOrEqual(3)
    for (const so of NOI_DUNG_BIA) expect(container.textContent).not.toContain(so)
    expect(container.textContent).not.toMatch(/\d+\s*\/\s*100/)
    for (const bar of Array.from(container.querySelectorAll<HTMLElement>('[style*="width"]'))) {
      expect(bar.style.width).toBe('0%')
    }
  })

  it('điểm 0 thật hiển thị 0, không bị đổi thành số "đẹp"', async () => {
    fetchReport.mockResolvedValue(
      baoCao({ holisticAlignmentScore: 0, lifeSynergyIndex: 0, cognitiveResilienceScore: 0 }),
    )
    await hien()
    expect(soHienThi()).toEqual(['0', '0', '0'])
    for (const so of NOI_DUNG_BIA) expect(container.textContent).not.toContain(so)
  })

  it('có dữ liệu → đúng số từ báo cáo', async () => {
    fetchReport.mockResolvedValue(baoCao({}))
    await hien()
    expect(soHienThi()).toEqual(['41', '17', '63'])
  })

  it('tải hỏng → khối lỗi + Thử lại, không số nào', async () => {
    fetchReport.mockRejectedValue(new TypeError('Failed to fetch'))
    await hien()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(soHienThi()).toEqual([])
    for (const so of NOI_DUNG_BIA) expect(container.textContent).not.toContain(so)
  })
})

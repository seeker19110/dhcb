// LifeSynthesisDashboard.test.tsx — khối "30 ngày qua của bạn" (changelog 0550): đủ ba trạng thái
// tải/lỗi/rỗng, chỉ hiện số đếm từ báo cáo, không điểm số/phần trăm (Luật số 1).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import {
  LifeSynthesisReportSchema,
  type LifeSynthesisReport,
} from '@dhcb/core-contracts/lifeSynthesis'
import { findForbiddenLanguage } from '@dhcb/core-personal/intakeSuggestion'
import LifeSynthesisDashboard from './LifeSynthesisDashboard'
import { duongDanDich } from '../../lib/lifeSynthesisRoutes'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const fetchReport = vi.hoisted(() => vi.fn())
vi.mock('../../lib/lifeSynthesisApi', () => ({ fetchLifeSynthesisReport: fetchReport }))

const EMPTY: LifeSynthesisReport = LifeSynthesisReportSchema.parse({
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
  observations: [
    {
      ruleId: 'learning.none',
      domain: 'learning',
      text: 'Chưa có hoạt động học nào trong 30 ngày qua.',
    },
    { ruleId: 'notes.none', domain: 'notes', text: 'Chưa có việc hay ghi chú nào trong Ghi chú.' },
  ],
  recommendations: [
    {
      ruleId: 'rec.learning_start',
      domain: 'learning',
      text: 'Chọn một môn và học một bài ngắn để bắt đầu.',
      actionLabel: 'Mở Góc học tập',
      target: { kind: 'learning-hub' },
    },
  ],
})

const FULL: LifeSynthesisReport = LifeSynthesisReportSchema.parse({
  ...EMPTY,
  learning: {
    activeDays: 5,
    streakDays: 3,
    lastActiveDate: '2026-10-09',
    subjects: [
      {
        subjectId: 'english',
        label: 'Tiếng Anh',
        activeDays: 5,
        lastActiveDate: '2026-10-09',
        streakDays: 3,
        completions: null,
      },
      {
        subjectId: 'programming',
        label: 'Lập trình',
        activeDays: 2,
        lastActiveDate: '2026-09-28',
        streakDays: 0,
        completions: 4,
      },
    ],
  },
  notes: { ...EMPTY.notes, totalTasks: 6, openTasks: 4, overdueTasks: 2 },
  observations: [
    {
      ruleId: 'learning.subject_streak',
      domain: 'learning',
      text: 'Có học Tiếng Anh 3 ngày liên tiếp, tính tới hôm nay.',
    },
    { ruleId: 'notes.overdue', domain: 'notes', text: '2 việc đã quá hạn.' },
  ],
  recommendations: [
    {
      ruleId: 'rec.notes_overdue',
      domain: 'notes',
      text: 'Xem lại 2 việc quá hạn: làm tiếp, dời hạn hoặc đánh dấu xong.',
      actionLabel: 'Mở Ghi chú',
      target: { kind: 'notes' },
    },
    {
      ruleId: 'rec.learning_resume',
      domain: 'learning',
      text: 'Quay lại Lập trình với một bài ngắn.',
      actionLabel: 'Mở Lập trình',
      target: { kind: 'subject', subjectId: 'programming' },
    },
  ],
})

describe('LifeSynthesisDashboard', () => {
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

  async function render() {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <LifeSynthesisDashboard />
        </MemoryRouter>,
      )
    })
    await act(async () => {
      for (let i = 0; i < 6; i++) await Promise.resolve()
    })
  }

  const text = () => container.textContent ?? ''

  it('đang tải → khung chờ aria-busy, chưa có số nào', async () => {
    fetchReport.mockReturnValue(new Promise(() => {}))
    await render()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(text()).toContain('Đang tải bản tổng hợp')
    expect(text()).not.toMatch(/\d+ ngày có học/)
  })

  it('tải hỏng → khối lỗi role=alert + nút Thử lại; bấm thử lại thì tải lại', async () => {
    fetchReport.mockRejectedValueOnce(new Error('Lỗi tải bản tổng hợp: 500'))
    await render()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(text()).toContain('Máy chủ đang gặp sự cố')
    fetchReport.mockResolvedValueOnce(FULL)
    const retry = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Thử lại'),
    )
    expect(retry).toBeDefined()
    await act(async () => {
      retry?.click()
    })
    await act(async () => {
      for (let i = 0; i < 6; i++) await Promise.resolve()
    })
    expect(fetchReport).toHaveBeenCalledTimes(2)
    expect(text()).toContain('Tiếng Anh')
  })

  it('rỗng → nói thật "chưa có hoạt động", không danh sách môn, có một lối bắt đầu', async () => {
    fetchReport.mockResolvedValue(EMPTY)
    await render()
    expect(text()).toContain('Chưa có hoạt động học nào trong 30 ngày qua.')
    expect(text()).toContain('Chưa có việc hay ghi chú nào trong Ghi chú.')
    expect(text()).not.toContain('việc đang mở')
    const links = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(links).toEqual(['/goc-hoc-tap'])
  })

  it('có dữ liệu → đúng số đếm từ báo cáo, khuyến nghị dẫn đúng route', async () => {
    fetchReport.mockResolvedValue(FULL)
    await render()
    expect(text()).toContain('5 ngày có học · gần nhất hôm nay')
    expect(text()).toContain('2 ngày có học · gần nhất 28/09')
    expect(text()).toContain('4 việc đang mở')
    expect(text()).toContain('từ 10/09 đến hôm nay')
    const links = Array.from(container.querySelectorAll('a')).map((a) => [
      a.textContent,
      a.getAttribute('href'),
    ])
    expect(links).toEqual([
      ['Mở Ghi chú', '/ghi-chu'],
      ['Mở Lập trình', '/goc-hoc-tap/programming'],
    ])
  })

  it('Luật số 1: không thanh điểm, không x/100, không phần trăm trong DOM', async () => {
    fetchReport.mockResolvedValue(FULL)
    await render()
    expect(findForbiddenLanguage([text()])).toEqual([])
    expect(container.querySelector('[style*="width"]')).toBeNull()
    expect(container.querySelector('[role="progressbar"], progress, meter')).toBeNull()
  })

  it('tiêu đề khối là h3, ba khu con là h4 (thứ bậc tiêu đề trong studio)', async () => {
    fetchReport.mockResolvedValue(FULL)
    await render()
    expect(container.querySelector('h3')?.textContent).toBe('30 ngày qua của bạn')
    expect(Array.from(container.querySelectorAll('h4')).map((h) => h.textContent)).toEqual([
      'Học tập',
      'Ghi chú',
      'Gợi ý cho hôm nay',
    ])
  })
})

describe('duongDanDich', () => {
  it('ba loại đích → ba route dùng chung', () => {
    expect(duongDanDich({ kind: 'notes' })).toBe('/ghi-chu')
    expect(duongDanDich({ kind: 'learning-hub' })).toBe('/goc-hoc-tap')
    expect(duongDanDich({ kind: 'subject', subjectId: 'mathematics' })).toBe(
      '/goc-hoc-tap/mathematics',
    )
  })
})

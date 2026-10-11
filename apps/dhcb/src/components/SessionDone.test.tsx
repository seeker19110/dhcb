// Cổng cho <SessionDone> — overlay kết phiên gộp 3 celebration (P1-6, lệnh 8).
// Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P1-6 ④.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import SessionDone from './SessionDone'
import type { SessionOutcome } from '../lib/session/sessionFact'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../lib/analytics', () => ({ track: vi.fn() }))

const outcome: SessionOutcome = {
  subjectId: 'english',
  contentId: 'l1',
  kind: 'lesson',
  steps: 5,
  durationSec: 60,
}

describe('SessionDone', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const dialog = () => document.body.querySelector('[role="dialog"]')

  function render(props: Partial<Parameters<typeof SessionDone>[0]> = {}) {
    act(() => {
      root.render(
        <SessionDone outcome={outcome} uid="u1" isA srsDue={0} onClose={() => {}} {...props} />,
      )
    })
  }

  it('AC-2: có role dialog + aria-modal + đúng 1 nút chính, không CTA phụ khi srsDue=0', () => {
    render({ srsDue: 0 })
    const dlg = dialog()
    expect(dlg).not.toBeNull()
    expect(dlg?.getAttribute('aria-modal')).toBe('true')
    const buttons = dlg?.querySelectorAll('button') ?? []
    expect(buttons.length).toBe(1)
    expect(buttons[0]?.textContent).toContain('Về trang chủ')
  })

  it('AC-2: srsDue > 0 và có onMore → thêm đúng 1 CTA phụ (tổng 2 nút)', () => {
    render({ srsDue: 5, onMore: () => {} })
    const dlg = dialog()
    const buttons = dlg?.querySelectorAll('button') ?? []
    expect(buttons.length).toBe(2)
    expect(buttons[0]?.textContent).toContain('Ôn')
  })

  it('AC-5: steps === 0 → không render dialog', () => {
    render({ outcome: { ...outcome, steps: 0 } })
    expect(dialog()).toBeNull()
  })

  it('srsDue âm coi như 0 → ẩn CTA phụ', () => {
    render({ srsDue: -3, onMore: () => {} })
    const buttons = dialog()?.querySelectorAll('button') ?? []
    expect(buttons.length).toBe(1)
  })

  it('AC-3: streak + tuần cùng trùng ngày → vẫn CHỈ MỘT [role="dialog"]', () => {
    render({ streakJustChanged: true, weeklyGoalJustReached: true })
    expect(document.body.querySelectorAll('[role="dialog"]').length).toBe(1)
    // cả hai sub-block đều render bên trong dialog duy nhất đó
    const dlg = dialog()
    expect(dlg?.textContent).toContain('Chuỗi')
    expect(dlg?.textContent).toContain('mục tiêu tuần')
  })

  it('AC-6: panel dùng class animate-scale-in (bị neutralize toàn cục bởi prefers-reduced-motion, index.css)', () => {
    render()
    const dlg = dialog()
    expect(dlg?.className).toContain('animate-scale-in')
  })

  it('đóng dialog gọi onClose', () => {
    const onClose = vi.fn()
    render({ onClose })
    const dlg = dialog()
    const mainBtn = Array.from(dlg?.querySelectorAll('button') ?? []).find((b) =>
      b.textContent?.includes('Về trang chủ'),
    )
    act(() => mainBtn?.click())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closeLabel thay nhãn nút chính — nút chỉ đóng overlay thì không hứa "Về trang chủ"', () => {
    render({ closeLabel: 'Tiếp tục bài' })
    const buttons = dialog()?.querySelectorAll('button') ?? []
    expect(buttons.length).toBe(1)
    expect(buttons[0]?.textContent).toBe('Tiếp tục bài')
  })

  it('milestone hiện ở tầng (2) TRONG cùng một dialog (không bật overlay thứ hai)', () => {
    render({
      streakJustChanged: true,
      milestone: { icon: '🏆', title: 'Tuần trọn vẹn 7/7!', subtitle: 'Đủ 7 ngày.' },
    })
    expect(document.body.querySelectorAll('[role="dialog"]').length).toBe(1)
    expect(dialog()?.textContent).toContain('Tuần trọn vẹn 7/7!')
    expect(dialog()?.textContent).toContain('Chuỗi')
  })
})

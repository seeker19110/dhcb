// CompanionBreakReminder.test.tsx — nhắc nghỉ khi trẻ trò chuyện lâu (GĐ4b, changelog 0631):
// hook + khối nhắc chạy với đồng hồ giả, đúng cách Companion.tsx gắn.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, useState, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import CompanionBreakReminder from './CompanionBreakReminder'
import { useCompanionBreakReminder } from '../../lib/useCompanionBreakReminder'
import {
  BREAK_REMINDER_COPY,
  breakStorageKey,
  loadBreakState,
} from '../../lib/companionBreakReminder'
import type { AgeGroup } from '../../types'

const MIN = 60_000
const UID = 'u-break'

// Khung thử: hook + khối nhắc, giống cách Companion.tsx gắn.
function Harness({ ageGroup, onLeave }: { ageGroup: AgeGroup; onLeave: () => void }) {
  const r = useCompanionBreakReminder(UID, ageGroup)
  return (
    <div>
      <button type="button" onClick={r.recordTurn}>
        gửi
      </button>
      {r.remindFor && (
        <CompanionBreakReminder
          ageGroup={r.remindFor}
          minutes={r.minutes}
          onSnooze={r.snoozeReminder}
          onBreak={() => {
            r.endSession()
            onLeave()
          }}
        />
      )}
    </div>
  )
}

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root | null = null

function render(el: ReactElement) {
  root = createRoot(container)
  act(() => root?.render(el))
  return {
    unmount: () => {
      act(() => root?.unmount())
      root = null
    },
  }
}

function click(name: string) {
  const btn = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === name)
  if (!btn) throw new Error(`không thấy nút "${name}"`)
  act(() => btn.click())
}

function send() {
  click('gửi')
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

// Trò chuyện đều: một lượt mỗi 5 phút, tổng `minutes` phút.
function chatFor(minutes: number) {
  send()
  for (let m = 5; m <= minutes; m += 5) {
    advance(5 * MIN)
    send()
  }
}

const reminder = () => container.querySelector('[data-testid="companion-break-reminder"]')

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-13T08:00:00+07:00'))
  localStorage.clear()
})

afterEach(() => {
  if (root) act(() => root?.unmount())
  root = null
  container.remove()
  vi.useRealTimers()
  localStorage.clear()
})

describe('Nhắc nghỉ — Nhi đồng', () => {
  it('chưa tới 20 phút thì chưa nhắc; tới 20 phút thì nhắc, nói rõ là AI', () => {
    render(<Harness ageGroup="nhi_dong" onLeave={() => {}} />)
    chatFor(15)
    expect(reminder()).toBeNull()
    advance(5 * MIN)
    expect(reminder()).not.toBeNull()
    const status = container.querySelector('[role="status"]')
    expect(status?.textContent).toContain('khoảng 20 phút')
    expect(status?.textContent).toContain('bạn đồng hành AI')
  })

  it('"Thêm một chút" ẩn lời nhắc, 10 phút sau (vẫn đang trò chuyện) nhắc lại', () => {
    render(<Harness ageGroup="nhi_dong" onLeave={() => {}} />)
    chatFor(20)
    expect(reminder()).not.toBeNull()
    click('Thêm một chút')
    expect(reminder()).toBeNull()
    advance(5 * MIN)
    send()
    expect(reminder()).toBeNull()
    advance(5 * MIN)
    expect(reminder()).not.toBeNull()
  })

  it('"Mình nghỉ đây" rời trang và xoá trạng thái trong localStorage NGAY', () => {
    // Mô phỏng điều hướng thật: trang bị gỡ TRONG CÙNG lượt cập nhật với lúc xoá phiên, nên
    // effect lưu của trang không còn cơ hội chạy.
    const onLeave = vi.fn()
    function Page() {
      const [open, setOpen] = useState(true)
      return open ? (
        <Harness
          ageGroup="nhi_dong"
          onLeave={() => {
            onLeave()
            setOpen(false)
          }}
        />
      ) : null
    }
    render(<Page />)
    chatFor(20)
    expect(loadBreakState(UID)).not.toBeNull()
    click('Mình nghỉ đây')
    expect(onLeave).toHaveBeenCalledTimes(1)
    expect(reminder()).toBeNull()
    expect(localStorage.getItem(breakStorageKey(UID))).toBeNull()
  })

  it('tải lại trang không làm đồng hồ về 0 (đọc lại từ localStorage)', () => {
    const first = render(<Harness ageGroup="nhi_dong" onLeave={() => {}} />)
    chatFor(15)
    first.unmount()
    render(<Harness ageGroup="nhi_dong" onLeave={() => {}} />)
    advance(5 * MIN)
    expect(reminder()).not.toBeNull()
  })

  it('rời đi quá 15 phút rồi quay lại: không bật lời nhắc, lượt mới mở phiên mới', () => {
    render(<Harness ageGroup="nhi_dong" onLeave={() => {}} />)
    chatFor(15)
    advance(16 * MIN)
    expect(reminder()).toBeNull()
    send()
    advance(15 * MIN)
    expect(reminder()).toBeNull()
  })
})

describe('Nhắc nghỉ — các nhóm khác', () => {
  it('thiếu niên: 20 phút chưa nhắc, 40 phút mới nhắc', () => {
    render(<Harness ageGroup="thieu_nien" onLeave={() => {}} />)
    chatFor(20)
    expect(reminder()).toBeNull()
    chatFor(20)
    expect(reminder()).not.toBeNull()
    expect(container.querySelector('h2')?.textContent).toBe(BREAK_REMINDER_COPY.thieu_nien.title)
  })

  it.each<AgeGroup>(['nguoi_lon', 'thanh_nien'])('%s: không bao giờ nhắc, không ghi gì', (g) => {
    render(<Harness ageGroup={g} onLeave={() => {}} />)
    chatFor(120)
    advance(30 * MIN)
    expect(reminder()).toBeNull()
    expect(localStorage.getItem(breakStorageKey(UID))).toBeNull()
  })
})

describe('Câu chữ', () => {
  it.each(Object.entries(BREAK_REMINDER_COPY))(
    '%s: có "AI", không câu chuỗi ngày/streak hay trách móc',
    (_g, copy) => {
      const text = `${copy.title} ${copy.body(20)}`
      expect(text).toContain('AI')
      expect(text).toContain('20 phút')
      expect(text).not.toMatch(/streak|chuỗi|đừng bỏ|mất|tiếc/i)
    },
  )
})

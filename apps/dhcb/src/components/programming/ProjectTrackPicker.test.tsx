// Bộ chọn dự án trục T1/T2/T3 (hạ tầng 2026-10-09,
// docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PROJECT_TRACKS, type ProjectTrack } from '@dhcb/subject-programming/projectTracks'
import ProjectTrackPicker from './ProjectTrackPicker'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function radios(): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
}

/** Nhãn đọc được của một ô radio (chữ trong <label for=…>). */
function labelOf(input: HTMLInputElement): string {
  return container.querySelector(`label[for="${input.id}"]`)?.textContent ?? ''
}

/**
 * Bộ dữ liệu giả CỐ ĐỊNH: T1 + T2 mở, T3 chưa mở — kiểm luồng chọn và luồng chặn dự án chưa mở mà
 * KHÔNG phụ thuộc dự án nào đã có nội dung thật (T3 có bước từ đợt nội dung 2026-10-09).
 */
const WITH_T2_OPEN: ProjectTrack[] = PROJECT_TRACKS.map((t) => ({
  ...t,
  available: t.id !== 'T3',
}))

describe('ProjectTrackPicker', () => {
  it('nhóm radio gốc có legend, đủ 3 dự án đúng thứ tự, đúng ô đang chọn', () => {
    act(() =>
      root.render(<ProjectTrackPicker tracks={PROJECT_TRACKS} value="T1" onChange={vi.fn()} />),
    )
    const fieldset = container.querySelector('fieldset')
    expect(fieldset?.querySelector('legend')?.textContent).toBe('Chọn dự án của bạn')
    const rs = radios()
    expect(rs.map((r) => r.value)).toEqual(['T1', 'T2', 'T3'])
    expect(new Set(rs.map((r) => r.name)).size).toBe(1)
    expect(rs.map((r) => r.checked)).toEqual([true, false, false])
    expect(labelOf(rs[0]!)).toContain('Cửa hàng của tôi')
  })

  it('dự án chưa mở: radio bị `disabled` THẬT và nhãn có chữ "Sắp mở"; dự án mở thì không', () => {
    act(() =>
      root.render(<ProjectTrackPicker tracks={PROJECT_TRACKS} value="T1" onChange={vi.fn()} />),
    )
    for (const r of radios()) {
      const track = PROJECT_TRACKS.find((t) => t.id === r.value)!
      expect(r.disabled, r.value).toBe(!track.available)
      expect(labelOf(r).includes('Sắp mở'), r.value).toBe(!track.available)
    }
  })

  it('dữ liệu thật: chỉ chọn được đúng các dự án đang mở, luôn có T1', () => {
    act(() =>
      root.render(<ProjectTrackPicker tracks={PROJECT_TRACKS} value="T1" onChange={vi.fn()} />),
    )
    const enabled = radios()
      .filter((r) => !r.disabled)
      .map((r) => r.value)
    expect(enabled).toEqual(PROJECT_TRACKS.filter((t) => t.available).map((t) => t.id))
    expect(enabled).toContain('T1')
  })

  it('bấm dự án đang mở → gọi onChange với đúng mã', () => {
    const onChange = vi.fn()
    act(() =>
      root.render(<ProjectTrackPicker tracks={WITH_T2_OPEN} value="T1" onChange={onChange} />),
    )
    act(() => radios()[1]!.click())
    expect(onChange).toHaveBeenCalledWith('T2')
  })

  it('bấm dự án chưa mở → KHÔNG gọi onChange', () => {
    const onChange = vi.fn()
    act(() =>
      root.render(<ProjectTrackPicker tracks={WITH_T2_OPEN} value="T1" onChange={onChange} />),
    )
    act(() => radios()[2]!.click())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('busy (đang lưu/đổi dự án) → khoá cả nhóm, báo aria-busy', () => {
    const onChange = vi.fn()
    act(() =>
      root.render(<ProjectTrackPicker tracks={WITH_T2_OPEN} value="T1" onChange={onChange} busy />),
    )
    expect(radios().every((r) => r.disabled)).toBe(true)
    expect(container.querySelector('fieldset')?.getAttribute('aria-busy')).toBe('true')
    act(() => radios()[1]!.click())
    expect(onChange).not.toHaveBeenCalled()
  })
})

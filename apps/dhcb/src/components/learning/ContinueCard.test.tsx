// Cổng của khối "Học tiếp" dùng chung (audit đồng nhất bố cục 2026-10-01, mục #9).
//
// Điều đáng canh: mọi môn có CÙNG cấu trúc (nhãn nhỏ → tên bài là tiêu đề → MỘT nút chính),
// nút chính là nút chuẩn `primary` (không tự ghép màu), và kiểu `inset` không dựng thêm khung
// thẻ lồng trong thẻ.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ContinueCard, ContinueRow, type ContinueCardProps } from './ContinueCard'
import { buttonClass } from '@core/buttonStyles'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('ContinueCard', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function hien(props: Partial<ContinueCardProps> = {}) {
    const onAction = vi.fn()
    act(() => {
      root.render(
        <ContinueCard
          eyebrow="Học tiếp"
          actionLabel="Bắt đầu bài này"
          onAction={onAction}
          {...props}
        />,
      )
    })
    const nut = container.querySelector('button')!
    return { onAction, nut }
  }

  it('khung `card`: <section> viền accent, tên bài là h2, MỘT nút chính chuẩn', () => {
    const { nut, onAction } = hien({ title: 'Chương trình đầu tiên', meta: <span>Bậc P1</span> })
    const khung = container.firstElementChild!
    expect(khung.tagName).toBe('SECTION')
    expect(khung.className).toContain('border-accent-500/40')
    expect(container.querySelector('h2')?.textContent).toBe('Chương trình đầu tiên')
    expect(container.textContent).toContain('Bậc P1')
    expect(container.querySelectorAll('button')).toHaveLength(1)
    // Nút chính chuẩn — màu do biến thể quyết định, không phải trang tự ghép.
    expect(nut.className).toContain(buttonClass({ variant: 'primary', size: 'lg' }))
    // Điện thoại giãn hết dòng, từ 640px co về cỡ nội dung (nằm bên phải tên bài).
    expect(nut.className).toContain('w-full')
    expect(nut.className).toContain('sm:w-auto')
    expect(nut.textContent).toBe('Bắt đầu bài này')
    act(() => nut.click())
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('khung `inset` + headingLevel 3: không dựng <section>/viền thẻ, chỉ vạch ngăn trên', () => {
    hien({ frame: 'inset', headingLevel: 3, title: 'Đại từ & lời chào' })
    const khung = container.firstElementChild!
    expect(khung.tagName).toBe('DIV')
    expect(khung.className).toContain('border-t')
    expect(khung.className).not.toContain('rounded-3xl')
    expect(container.querySelector('h2')).toBeNull()
    expect(container.querySelector('h3')?.textContent).toBe('Đại từ & lời chào')
  })

  it('chưa có tên bài (đang tải): không dựng tiêu đề rỗng; nút vô hiệu không gọi onAction', () => {
    const { nut, onAction } = hien({ disabled: true, actionLabel: 'Đang tải…' })
    expect(container.querySelector('h2, h3')).toBeNull()
    expect(nut.disabled).toBe(true)
    act(() => nut.click())
    expect(onAction).not.toHaveBeenCalled()
  })

  it('lối phụ (children) nằm dưới nút chính', () => {
    hien({ children: <a href="/gioi-thieu">Khoá học này là gì?</a> })
    const nut = container.querySelector('button')!
    const loiPhu = container.querySelector('a')!
    expect(nut.compareDocumentPosition(loiPhu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('ContinueRow', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('cả dòng là MỘT nút, tên nút gồm nhãn + tên mục; chỉ chứa phần tử dòng (HTML hợp lệ)', () => {
    const onClick = vi.fn()
    act(() => {
      root.render(
        <ContinueRow label="Tiếp tục" title="Bài 2: Một ngày" onClick={onClick} className="mb-4" />,
      )
    })
    const nut = container.querySelector('button')!
    expect(nut.textContent).toBe('Tiếp tục' + 'Bài 2: Một ngày')
    expect(nut.className).toContain('mb-4')
    // <button> chỉ được chứa nội dung dạng dòng — bản chép tay cũ lồng <div>/<p> bên trong.
    expect(nut.querySelector('div, p')).toBeNull()
    act(() => nut.click())
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

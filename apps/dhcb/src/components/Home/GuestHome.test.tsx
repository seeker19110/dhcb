// GuestHome.test.tsx — AC-2/AC-3/bất biến "không mặc định tiếng Anh" của đặc tả P0-3.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { SUBJECT_ENTRIES } from '@dhcb/core-learner/subjectEntry'
import GuestHome from './GuestHome'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../lib/analytics', () => ({ track: vi.fn() }))

describe('GuestHome', () => {
  let container: HTMLDivElement
  let root: Root

  function render() {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root.render(
        <MemoryRouter>
          <GuestHome />
        </MemoryRouter>,
      )
    })
  }

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('AC-2: ĐÚNG MỘT liên kết nút chính, trỏ /bat-dau', () => {
    render()
    const primaryLinks = Array.from(container.querySelectorAll('a')).filter((a) =>
      a.className.includes('bg-accent-500'),
    )
    expect(primaryLinks).toHaveLength(1)
    expect(primaryLinks[0]?.getAttribute('href')).toBe('/bat-dau')
  })

  it('[U9b] có liên kết "Đăng nhập" bằng chữ tới /login cho người đã có tài khoản', () => {
    render()
    const login = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent === 'Đăng nhập',
    )
    expect(login?.getAttribute('href')).toBe('/login')
    expect(login?.className).not.toContain('bg-accent-500')
  })

  it('dưới nút chính có dòng "Không cần tài khoản"', () => {
    render()
    expect(container.textContent).toContain('Không cần tài khoản')
  })

  it('AC-3: dải môn render đủ SUBJECT_ENTRIES.length chip, href đúng entry.ctaPath, ĐÚNG thứ tự', () => {
    render()
    const links = Array.from(container.querySelectorAll('a')).filter(
      (a) => !a.className.includes('bg-accent-500'),
    )
    const subjectLinks = SUBJECT_ENTRIES.map((entry) =>
      links.find((a) => a.getAttribute('href') === entry.ctaPath),
    )
    // Bất biến: không môn nào "nổi" hơn — đúng thứ tự SUBJECT_ENTRIES, không sắp lại theo môn nào.
    subjectLinks.forEach((a, i) => {
      expect(a).toBeDefined()
      expect(a?.getAttribute('href')).toBe(SUBJECT_ENTRIES[i]!.ctaPath)
    })
  })

  it('có Companion (svg trang trí) + bong bóng chào', () => {
    render()
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    expect(container.textContent).toContain('Học điều bạn muốn. Hiểu điều bạn học.')
    expect(container.textContent).toContain('tự học tốt hơn')
  })

  it('STEM nói rõ xem trước, không hứa hoàn thiện ngang môn đã mở', () => {
    render()
    for (const entry of SUBJECT_ENTRIES) {
      const chip = container.querySelector(`a[href="${entry.ctaPath}"]`)
      if (entry.status === 'preview') expect(chip?.textContent).toContain('Xem trước')
      else expect(chip?.textContent).not.toContain('Xem trước')
    }
    expect(container.querySelector('a[href="/gioi-thieu"]')).not.toBeNull()
  })

  it('bấm CTA gọi track cta_click với refCode guest_home_start', async () => {
    const { track } = await import('../../lib/analytics')
    render()
    const cta = container.querySelector('a[href="/bat-dau"]')
    act(() => {
      cta?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(track).toHaveBeenCalledWith('cta_click', { refCode: 'guest_home_start' })
  })
})

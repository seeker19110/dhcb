import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTheme, applyTheme, setTheme, THEMES, KID_THEME, type Theme } from './theme.js'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.head.innerHTML = '<meta name="theme-color" content="" />'
})

describe('getTheme', () => {
  it('chưa lưu gì → mặc định blue-sky', () => {
    expect(getTheme()).toBe('blue-sky')
  })

  it('đã lưu theme hợp lệ → đọc đúng giá trị đó', () => {
    localStorage.setItem('ui_theme', 'dark-blue')
    expect(getTheme()).toBe('dark-blue')
  })

  it('giá trị lưu không hợp lệ (rác/cũ, kể cả "pink"/"vibrant" đã xoá) → rơi về mặc định, không throw', () => {
    localStorage.setItem('ui_theme', 'khong-ton-tai')
    expect(getTheme()).toBe('blue-sky')
    localStorage.setItem('ui_theme', 'pink')
    expect(getTheme()).toBe('blue-sky')
    localStorage.setItem('ui_theme', 'vibrant')
    expect(getTheme()).toBe('blue-sky')
  })

  it('theme "kid" (Nhi đồng) cũng đọc được dù không nằm trong THEMES', () => {
    localStorage.setItem('ui_theme', 'kid')
    expect(getTheme()).toBe('kid')
  })
})

// Audit 2026-09-30 M13 — lần đầu vào (chưa tự chọn) theo chế độ sáng/tối của máy.
describe('getTheme — theo prefers-color-scheme khi CHƯA chọn', () => {
  function mockPrefersDark(dark: boolean) {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((q: string) => ({ matches: dark && q === '(prefers-color-scheme: dark)', media: q })),
    )
  }
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('máy đặt chế độ TỐI, chưa chọn → Xanh đêm', () => {
    mockPrefersDark(true)
    expect(getTheme()).toBe('dark-blue')
  })

  it('máy đặt chế độ SÁNG, chưa chọn → Blue sky', () => {
    mockPrefersDark(false)
    expect(getTheme()).toBe('blue-sky')
  })

  it('đã tự chọn Blue sky → giữ Blue sky dù máy đang tối (lựa chọn đã lưu thắng)', () => {
    mockPrefersDark(true)
    localStorage.setItem('ui_theme', 'blue-sky')
    expect(getTheme()).toBe('blue-sky')
  })

  it('giá trị rác + máy tối → Xanh đêm (rác coi như chưa chọn)', () => {
    mockPrefersDark(true)
    localStorage.setItem('ui_theme', 'pink')
    expect(getTheme()).toBe('dark-blue')
  })

  it('không GHI lại theme suy ra — đổi chế độ máy thì lần sau đổi theo', () => {
    mockPrefersDark(true)
    getTheme()
    expect(localStorage.getItem('ui_theme')).toBeNull()
  })

  it('"kid" đã lưu không bị chế độ máy ghi đè', () => {
    mockPrefersDark(true)
    localStorage.setItem('ui_theme', 'kid')
    expect(getTheme()).toBe('kid')
  })

  it('localStorage bị chặn (ném lỗi) → không throw, theo chế độ máy', () => {
    mockPrefersDark(true)
    const spy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(getTheme()).toBe('dark-blue')
    spy.mockRestore()
  })

  it('matchMedia ném lỗi → rơi về Blue sky', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('boom')
      }),
    )
    expect(getTheme()).toBe('blue-sky')
  })
})

describe('applyTheme', () => {
  it('gắn data-theme lên <html> và đổi meta theme-color tương ứng', () => {
    applyTheme('blue-sky')
    expect(document.documentElement.getAttribute('data-theme')).toBe('blue-sky')
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    expect(meta?.content).toBe('#f0f9ff')
  })

  it('không có thẻ meta theme-color trong DOM → không throw', () => {
    document.head.innerHTML = ''
    expect(() => applyTheme('dark-blue')).not.toThrow()
  })
})

describe('setTheme', () => {
  it('lưu vào localStorage VÀ áp dụng ngay lên DOM', () => {
    setTheme('dark-blue')
    expect(localStorage.getItem('ui_theme')).toBe('dark-blue')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark-blue')
  })
})

describe('THEMES / KID_THEME', () => {
  it('THEMES có đúng 2 theme tự chọn, KHÔNG chứa "kid"', () => {
    expect(THEMES).toHaveLength(2)
    expect(THEMES.some((t) => t.value === ('kid' as Theme))).toBe(false)
  })

  it('KID_THEME tách riêng, value = "kid"', () => {
    expect(KID_THEME.value).toBe('kid')
  })
})

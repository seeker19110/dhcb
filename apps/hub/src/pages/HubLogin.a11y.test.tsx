// HubLogin.a11y.test.tsx — cổng canh audit UI/UX 2026-09-30, mục C3 + C4 (hub): form đăng nhập
// / đăng ký của hub phải có nhãn HIỆN, `autocomplete` đúng mục đích, luật mật khẩu cố định nối
// `aria-describedby`, khối lỗi `role="alert"`, ô sai `aria-invalid`, hai nút chế độ
// `aria-pressed`, và logo-link có tên đọc được (axe `link-name`).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import HubLogin from './HubLogin'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const loginMock = vi.fn()
const registerMock = vi.fn()

vi.mock('@core/clientAuth', () => ({
  isValidNewPassword: (p: string) => p.length >= 15,
  login: (...a: unknown[]) => loginMock(...a),
  register: (...a: unknown[]) => registerMock(...a),
  loginWithGoogle: vi.fn(),
  loginWithGoogleRedirect: vi.fn(),
  handleOAuthRedirectCallback: () => Promise.resolve(null),
  GoogleAuthError: class GoogleAuthError extends Error {},
  loginWithFacebook: vi.fn(),
  loginWithApple: vi.fn(),
  loginWithMicrosoft: vi.fn(),
  preloadOAuthProviders: vi.fn(),
  getCurrentUser: () => Promise.resolve(null),
  logout: vi.fn(),
  getSafeRedirectUrl: (u: string) => u,
}))
vi.mock('@core/ThemeToggle', () => ({ ThemeToggle: () => null }))

let host: HTMLDivElement
let root: Root

async function mountForm() {
  await act(async () => {
    root.render(<HubLogin />)
  })
  // Chờ getCurrentUser (Promise) xong để form thay cho màn "đang kiểm tra".
  await act(async () => {
    await Promise.resolve()
  })
}

async function click(el: Element) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

async function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(async () => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function submit() {
  const form = host.querySelector('form')
  if (!form) throw new Error('không có form')
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

function byId(id: string): HTMLInputElement {
  const el = host.querySelector<HTMLInputElement>(`#${id}`)
  if (!el) throw new Error(`không thấy #${id}`)
  return el
}

function expectVisibleLabel(id: string) {
  const label = host.querySelector(`label[for="${id}"]`)
  expect(label, `thiếu <label for="${id}">`).not.toBeNull()
  expect(label?.textContent?.trim().length ?? 0).toBeGreaterThan(0)
}

function modeButton(text: string): HTMLButtonElement {
  const btn = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)
  if (!btn) throw new Error(`không thấy nút "${text}"`)
  return btn
}

beforeEach(() => {
  loginMock.mockReset()
  registerMock.mockReset()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('HubLogin', () => {
  it('logo-link có aria-label (axe link-name)', async () => {
    await mountForm()
    const logo = host.querySelector('a[href="/"]')
    expect(logo?.getAttribute('aria-label')).toBeTruthy()
  })

  it('đăng nhập: nhãn hiện + autocomplete email/current-password', async () => {
    await mountForm()
    expectVisibleLabel('hub-email')
    expectVisibleLabel('hub-password')
    expect(byId('hub-email').getAttribute('autocomplete')).toBe('email')
    expect(byId('hub-password').getAttribute('autocomplete')).toBe('current-password')
  })

  it('hai nút chế độ có aria-pressed', async () => {
    await mountForm()
    expect(modeButton('Đăng nhập').getAttribute('aria-pressed')).toBe('true')
    expect(modeButton('Đăng ký mới').getAttribute('aria-pressed')).toBe('false')
    await click(modeButton('Đăng ký mới'))
    expect(modeButton('Đăng nhập').getAttribute('aria-pressed')).toBe('false')
    expect(modeButton('Đăng ký mới').getAttribute('aria-pressed')).toBe('true')
  })

  it('đăng ký: nhãn tên, autocomplete name/new-password, luật 15 ký tự cố định', async () => {
    await mountForm()
    await click(modeButton('Đăng ký mới'))
    expectVisibleLabel('hub-name')
    expect(byId('hub-name').getAttribute('autocomplete')).toBe('name')
    const pw = byId('hub-password')
    expect(pw.getAttribute('autocomplete')).toBe('new-password')
    const hintId = pw.getAttribute('aria-describedby')
    expect(hintId).toBeTruthy()
    expect(host.querySelector(`#${hintId}`)?.textContent).toContain('15')
    await type(pw, 'a')
    expect(host.querySelector(`#${hintId}`)).not.toBeNull()
    expect(pw.minLength).toBe(15)
  })

  it('mật khẩu quá ngắn: role=alert + chỉ ô mật khẩu aria-invalid, không gọi API', async () => {
    await mountForm()
    await click(modeButton('Đăng ký mới'))
    await type(byId('hub-name'), 'An')
    await type(byId('hub-email'), 'a@b.co')
    await type(byId('hub-password'), 'ngan')
    await submit()
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
    expect(byId('hub-password').getAttribute('aria-invalid')).toBe('true')
    expect(byId('hub-email').getAttribute('aria-invalid')).toBe('false')
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('đăng nhập sai: role=alert, email + mật khẩu aria-invalid', async () => {
    loginMock.mockResolvedValue(null)
    await mountForm()
    await type(byId('hub-email'), 'a@b.co')
    await type(byId('hub-password'), 'sai')
    await submit()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('không chính xác')
    expect(byId('hub-email').getAttribute('aria-invalid')).toBe('true')
    expect(byId('hub-password').getAttribute('aria-invalid')).toBe('true')
  })
})

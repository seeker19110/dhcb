// AuthForms.a11y.test.tsx — cổng canh audit UI/UX 2026-09-30, mục C3 (WCAG 1.3.5, 3.3.2, 4.1.2,
// 4.1.3): form đăng nhập / đăng ký / đặt lại mật khẩu phải có nhãn HIỆN, `autocomplete` đúng mục
// đích, luật mật khẩu cố định nối `aria-describedby`, khối lỗi `role="alert"`, ô sai
// `aria-invalid`, hai nút chế độ `aria-pressed`.
//
// Không canh logic gửi form (đã có ở chỗ khác); chỉ canh các thuộc tính trợ năng. Mock mọi thứ
// ngoài vùng đo (API auth, theme, tiêu đề trang).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import Login from './Login'
import ResetPassword from './ResetPassword'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const registerMock = vi.fn()
const loginMock = vi.fn()

vi.mock('../../lib/auth', () => ({
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
}))
vi.mock('../../lib/referral', () => ({ claimPendingReferral: () => Promise.resolve() }))
vi.mock('../../lib/usePageTitle', () => ({ usePageTitle: () => undefined }))
vi.mock('../../components/ThemeToggle', () => ({ default: () => null }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}))
vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: null, isGuest: false, refresh: vi.fn() }),
}))
vi.mock('../../context/useLang', () => ({
  useLang: () => ({ T: t.vi, lang: 'vi' as const, setLang: vi.fn() }),
}))

let host: HTMLDivElement
let root: Root

async function mount(node: React.ReactElement, url = '/login') {
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[url]}>{node}</MemoryRouter>)
  })
}

async function click(el: Element) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

/** Gõ giá trị vào ô nhập React (phải đi qua setter gốc để onChange nhận được). */
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

/** Mọi ô nhập phải có `<label for=id>` có chữ — placeholder không tính là nhãn. */
function expectVisibleLabel(id: string) {
  const label = host.querySelector(`label[for="${id}"]`)
  expect(label, `thiếu <label for="${id}">`).not.toBeNull()
  expect(label?.textContent?.trim().length ?? 0).toBeGreaterThan(0)
}

function tabButton(text: string): HTMLButtonElement {
  const btn = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)
  if (!btn) throw new Error(`không thấy nút "${text}"`)
  return btn
}

beforeEach(() => {
  registerMock.mockReset()
  loginMock.mockReset()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('Login — chế độ đăng nhập', () => {
  it('ô email + mật khẩu có nhãn hiện và autocomplete đúng', async () => {
    await mount(<Login />)
    expectVisibleLabel('email')
    expectVisibleLabel('password')
    expect(byId('email').getAttribute('autocomplete')).toBe('email')
    expect(byId('password').getAttribute('autocomplete')).toBe('current-password')
  })

  it('hai nút chế độ có aria-pressed phản ánh chế độ hiện tại', async () => {
    await mount(<Login />)
    expect(tabButton(t.vi.loginTabLogin).getAttribute('aria-pressed')).toBe('true')
    expect(tabButton(t.vi.loginTabRegister).getAttribute('aria-pressed')).toBe('false')
    await click(tabButton(t.vi.loginTabRegister))
    expect(tabButton(t.vi.loginTabLogin).getAttribute('aria-pressed')).toBe('false')
    expect(tabButton(t.vi.loginTabRegister).getAttribute('aria-pressed')).toBe('true')
  })

  it('đăng nhập sai: khối lỗi role=alert, hai ô aria-invalid', async () => {
    loginMock.mockResolvedValue(null)
    await mount(<Login />)
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(byId('email').getAttribute('aria-invalid')).toBe('false')
    await type(byId('email'), 'a@b.co')
    await type(byId('password'), 'sai-mat-khau')
    await submit()
    const alert = host.querySelector('[role="alert"]')
    expect(alert?.textContent).toBe(t.vi.errBadCredentials)
    expect(byId('email').getAttribute('aria-invalid')).toBe('true')
    expect(byId('password').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('Login — chế độ đăng ký', () => {
  it('ô tên + email + mật khẩu có nhãn hiện, autocomplete name/email/new-password', async () => {
    await mount(<Login />)
    await click(tabButton(t.vi.loginTabRegister))
    expectVisibleLabel('name')
    expectVisibleLabel('email')
    expectVisibleLabel('password')
    expect(byId('name').getAttribute('autocomplete')).toBe('name')
    expect(byId('email').getAttribute('autocomplete')).toBe('email')
    expect(byId('password').getAttribute('autocomplete')).toBe('new-password')
  })

  it('luật 15 ký tự hiện cố định, nối aria-describedby, và vẫn là 15', async () => {
    await mount(<Login />)
    await click(tabButton(t.vi.loginTabRegister))
    const pw = byId('password')
    const hintId = pw.getAttribute('aria-describedby')
    expect(hintId).toBeTruthy()
    const hint = host.querySelector(`#${hintId}`)
    expect(hint?.textContent).toContain('15')
    // Gõ ký tự đầu KHÔNG làm gợi ý biến mất (khác placeholder).
    await type(pw, 'a')
    expect(host.querySelector(`#${hintId}`)).not.toBeNull()
    expect(pw.minLength).toBe(15)
  })

  it('mật khẩu quá ngắn: role=alert + chỉ ô mật khẩu aria-invalid, không gọi API', async () => {
    await mount(<Login />)
    await click(tabButton(t.vi.loginTabRegister))
    await type(byId('name'), 'An')
    await type(byId('email'), 'a@b.co')
    await type(byId('password'), 'ngan')
    await submit()
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
    expect(byId('password').getAttribute('aria-invalid')).toBe('true')
    expect(byId('email').getAttribute('aria-invalid')).toBe('false')
    expect(byId('name').getAttribute('aria-invalid')).toBe('false')
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('đổi chế độ xoá lỗi và trạng thái aria-invalid', async () => {
    loginMock.mockResolvedValue(null)
    await mount(<Login />)
    await type(byId('email'), 'a@b.co')
    await type(byId('password'), 'x')
    await submit()
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
    await click(tabButton(t.vi.loginTabRegister))
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(byId('email').getAttribute('aria-invalid')).toBe('false')
  })
})

describe('ResetPassword', () => {
  const url = '/reset-password?token=abc'

  it('ô mật khẩu mới có nhãn hiện, new-password, gợi ý luật nối aria-describedby', async () => {
    await mount(<ResetPassword />, url)
    expectVisibleLabel('new-password')
    const pw = byId('new-password')
    expect(pw.getAttribute('autocomplete')).toBe('new-password')
    const hint = host.querySelector(`#${pw.getAttribute('aria-describedby')}`)
    expect(hint?.textContent).toContain('15')
    expect(pw.minLength).toBe(15)
  })

  it('mật khẩu quá ngắn: role=alert + aria-invalid', async () => {
    await mount(<ResetPassword />, url)
    expect(byId('new-password').getAttribute('aria-invalid')).toBe('false')
    await type(byId('new-password'), 'ngan')
    await submit()
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
    expect(byId('new-password').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('Google là nhà cung cấp đăng nhập duy nhất hiển thị', () => {
  it('cả đăng nhập và đăng ký giữ Google + email, không còn nút nhà cung cấp ẩn', async () => {
    await mount(<Login />)
    for (const mode of ['Đăng nhập', 'Đăng ký']) {
      await click(tabButton(mode))
      const buttons = [...host.querySelectorAll('button')].map((b) => b.textContent).join(' ')
      expect(buttons).toContain('Google')
      expect(buttons).not.toMatch(/Facebook|Apple|Microsoft/)
      expect(host.querySelector('input[type="email"]')).not.toBeNull()
      expect(host.querySelector('input[type="password"]')).not.toBeNull()
    }
  })
})

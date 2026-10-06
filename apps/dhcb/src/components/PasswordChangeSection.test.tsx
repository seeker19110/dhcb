import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import PasswordChangeSection from './PasswordChangeSection'
const mocks = vi.hoisted(() => ({ status: vi.fn(), change: vi.fn() }))
vi.mock('../lib/passwordApi', () => ({
  fetchPasswordStatus: mocks.status,
  changeAccountPassword: mocks.change,
}))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let host: HTMLDivElement
let root: Root
const changed = vi.fn()
beforeEach(async () => {
  vi.clearAllMocks()
  mocks.status.mockResolvedValue(true)
  mocks.change.mockResolvedValue(undefined)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () => root.render(<PasswordChangeSection isA onChanged={changed} />))
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})
async function open() {
  await act(async () => host.querySelector('button')!.click())
}
async function type(id: string, value: string) {
  const el = host.querySelector<HTMLInputElement>(`#${id}`)!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function submit() {
  await act(async () => {
    host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}
async function fill(newPassword = 'a new strong password', confirmation = newPassword) {
  await type('password-current', 'the current password')
  await type('password-new', newPassword)
  await type('password-confirm', confirmation)
}
it('collapsed section does not fetch; opening has labeled password fields and autocomplete', async () => {
  expect(mocks.status).not.toHaveBeenCalled()
  await open()
  expect(mocks.status).toHaveBeenCalledOnce()
  for (const id of ['password-current', 'password-new', 'password-confirm']) {
    expect(host.querySelector(`label[for="${id}"]`)).not.toBeNull()
    expect(host.querySelector(`#${id}`)?.getAttribute('type')).toBe('password')
  }
  expect(host.querySelector('#password-current')?.getAttribute('autocomplete')).toBe(
    'current-password',
  )
  expect(host.querySelector('#password-new')?.getAttribute('autocomplete')).toBe('new-password')
})
it('OAuth-only account gets guidance rather than a password creation form', async () => {
  mocks.status.mockResolvedValue(false)
  await open()
  expect(host.textContent).toContain('chưa có mật khẩu riêng')
  expect(host.querySelector('form')).toBeNull()
  expect(mocks.change).not.toHaveBeenCalled()
})
it('failed status fetch provides retry', async () => {
  mocks.status.mockRejectedValueOnce(new Error('network'))
  await open()
  expect(host.querySelector('[role="alert"]')).not.toBeNull()
  const retry = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Thử lại')!
  await act(async () => retry.click())
  expect(host.querySelector('form')).not.toBeNull()
})
it.each([
  ['short', 'short', 'tối thiểu 15'],
  ['a new strong password', 'not the same password', 'chưa khớp'],
  ['the current password', 'the current password', 'phải khác'],
  ['😀'.repeat(19), '😀'.repeat(19), '72 byte'],
])('rejects invalid values before request: %s', async (password, confirmation, expected) => {
  await open()
  await fill(password, confirmation)
  await submit()
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(expected)
  expect(mocks.change).not.toHaveBeenCalled()
})
it('wrong current password leaves form open, retry can succeed, only verified success signs out', async () => {
  await open()
  await fill()
  mocks.change.mockRejectedValueOnce(new Error('Mật khẩu hiện tại không đúng.'))
  await submit()
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('hiện tại không đúng')
  expect(changed).not.toHaveBeenCalled()
  await submit()
  expect(mocks.change).toHaveBeenLastCalledWith('the current password', 'a new strong password')
  expect(changed).toHaveBeenCalledOnce()
  expect(host.querySelector<HTMLInputElement>('#password-current')!.value).toBe('')
})
it('closing section clears typed passwords and visibility state', async () => {
  await open()
  await fill()
  await open()
  await open()
  expect(host.querySelector<HTMLInputElement>('#password-new')!.value).toBe('')
})
it('visibility toggle is explicit and does not modify values', async () => {
  await open()
  await fill()
  const toggle = [...host.querySelectorAll('button')].find(
    (b) => b.textContent === 'Hiện mật khẩu',
  )!
  await act(async () => toggle.click())
  expect(host.querySelector('#password-current')?.getAttribute('type')).toBe('text')
  expect(toggle.getAttribute('aria-pressed')).toBe('true')
  await act(async () => toggle.click())
  expect(host.querySelector('#password-current')?.getAttribute('type')).toBe('password')
})

// AccountDataSection — tải dữ liệu + xoá tài khoản ở trang cá nhân (changelog 0533).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AccountOptions } from '@dhcb/core-contracts/account'

const api = vi.hoisted(() => ({
  fetchAccountOptions: vi.fn(),
  exportMyData: vi.fn(),
  deleteMyAccount: vi.fn(),
}))
vi.mock('../lib/accountApi', async () => {
  const actual = await vi.importActual<typeof import('../lib/accountApi')>('../lib/accountApi')
  return { ...actual, ...api }
})
const google = vi.hoisted(() => ({
  requestGoogleAccessToken: vi.fn(),
  preloadGoogleIdentity: vi.fn(),
}))
vi.mock('@core/clientAuth', () => google)

import AccountDataSection from './AccountDataSection'
import { AccountApiError } from '../lib/accountApi'

const BASE_OPTIONS: AccountOptions = {
  methods: ['password'],
  twoFactorRequired: false,
  vipActive: false,
  planExpiresAt: null,
}

let container: HTMLDivElement
let root: Root

function setValue(el: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function buttonByText(text: string): HTMLButtonElement {
  const b = Array.from(container.querySelectorAll('button')).find((x) =>
    x.textContent?.includes(text),
  )
  if (!b) throw new Error(`không thấy nút "${text}"`)
  return b
}

async function renderOpen(options: AccountOptions = BASE_OPTIONS, onDeleted = vi.fn()) {
  api.fetchAccountOptions.mockResolvedValue(options)
  await act(async () => root.render(<AccountDataSection isA onDeleted={onDeleted} />))
  await act(async () => buttonByText('Dữ liệu & tài khoản').click())
  return onDeleted
}

/** Ô nhập theo nhãn (label for=). */
function inputByLabel(text: string): HTMLInputElement {
  const label = Array.from(container.querySelectorAll('label')).find((l) =>
    l.textContent?.includes(text),
  )
  const id = label?.getAttribute('for')
  const input = id ? container.querySelector<HTMLInputElement>(`[id="${id}"]`) : null
  if (!input) throw new Error(`không thấy ô "${text}"`)
  return input
}

function inputsByLabel(text: string): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('label'))
    .filter((l) => l.textContent?.includes(text))
    .map((l) => container.querySelector<HTMLInputElement>(`[id="${l.getAttribute('for')}"]`)!)
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  for (const fn of [...Object.values(api), ...Object.values(google)]) fn.mockReset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('AccountDataSection', () => {
  it('đóng mặc định; mở ra mới tải tuỳ chọn; lỗi tải có nút Thử lại', async () => {
    api.fetchAccountOptions.mockRejectedValueOnce(new Error('mạng'))
    await act(async () => root.render(<AccountDataSection isA onDeleted={vi.fn()} />))
    expect(api.fetchAccountOptions).not.toHaveBeenCalled()
    await act(async () => buttonByText('Dữ liệu & tài khoản').click())
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/Không tải được/)
    api.fetchAccountOptions.mockResolvedValueOnce(BASE_OPTIONS)
    await act(async () => buttonByText('Thử lại').click())
    expect(container.textContent).toContain('Tải dữ liệu của tôi')
    expect(container.textContent).toContain('Xoá tài khoản')
  })

  it('nút xoá chỉ bật khi gõ đúng câu xác nhận (chấp nhận XÓA/XOÁ)', async () => {
    await renderOpen()
    const del = buttonByText('Xoá vĩnh viễn')
    expect(del.disabled).toBe(true)
    setValue(inputByLabel('để xác nhận'), 'xoá tài')
    expect(del.disabled).toBe(true)
    setValue(inputByLabel('để xác nhận'), 'XÓA TÀI KHOẢN')
    expect(del.disabled).toBe(false)
  })

  it('VIP còn hạn: cảnh báo không hoàn tiền + phải đánh dấu mới xoá được, gửi acknowledgeNoRefund', async () => {
    const onDeleted = await renderOpen({ ...BASE_OPTIONS, vipActive: true, planExpiresAt: null })
    expect(container.textContent).toMatch(/KHÔNG được hoàn tiền/)
    setValue(inputByLabel('để xác nhận'), 'XOÁ TÀI KHOẢN')
    const del = buttonByText('Xoá vĩnh viễn')
    expect(del.disabled).toBe(true)
    act(() => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
    expect(del.disabled).toBe(false)
    setValue(inputsByLabel('Mật khẩu hiện tại')[1]!, 'mk-dung')
    api.deleteMyAccount.mockResolvedValueOnce({ erasedAt: '2026-10-08T00:00:00Z' })
    await act(async () => del.click())
    expect(api.deleteMyAccount).toHaveBeenCalledWith({
      reauth: { method: 'password', password: 'mk-dung' },
      confirmation: 'XOÁ TÀI KHOẢN',
      acknowledgeNoRefund: true,
    })
    expect(onDeleted).toHaveBeenCalledOnce()
  })

  it('xoá: thiếu mật khẩu ⇒ báo lỗi, không gọi API; server từ chối ⇒ hiện lỗi, không gọi onDeleted', async () => {
    const onDeleted = await renderOpen()
    setValue(inputByLabel('để xác nhận'), 'XOÁ TÀI KHOẢN')
    await act(async () => buttonByText('Xoá vĩnh viễn').click())
    expect(api.deleteMyAccount).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/mật khẩu/)

    setValue(inputsByLabel('Mật khẩu hiện tại')[1]!, 'sai')
    api.deleteMyAccount.mockRejectedValueOnce(
      new AccountApiError('Mật khẩu không đúng.', 401, 'REAUTH_FAILED'),
    )
    await act(async () => buttonByText('Xoá vĩnh viễn').click())
    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Mật khẩu không đúng.')
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('còn đơn thanh toán chờ (409 PAYMENT_PENDING) ⇒ hiện thông điệp server, không gọi onDeleted', async () => {
    const onDeleted = await renderOpen()
    setValue(inputByLabel('để xác nhận'), 'XOÁ TÀI KHOẢN')
    setValue(inputsByLabel('Mật khẩu hiện tại')[1]!, 'dung')
    const msg = 'Bạn còn đơn thanh toán đang chờ xử lý. Vui lòng đợi đơn hoàn tất hoặc hết hạn.'
    api.deleteMyAccount.mockRejectedValueOnce(new AccountApiError(msg, 409, 'PAYMENT_PENDING'))
    await act(async () => buttonByText('Xoá vĩnh viễn').click())
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(msg)
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('PAYMENT_PENDING ở giao diện tiếng Anh (chiều B) ⇒ thông điệp tiếng Anh', async () => {
    const onDeleted = vi.fn()
    api.fetchAccountOptions.mockResolvedValue(BASE_OPTIONS)
    await act(async () => root.render(<AccountDataSection isA={false} onDeleted={onDeleted} />))
    await act(async () => buttonByText('Your data & account').click())
    setValue(inputByLabel('to confirm'), 'DELETE MY ACCOUNT')
    setValue(inputsByLabel('Current password')[1]!, 'right')
    api.deleteMyAccount.mockRejectedValueOnce(
      new AccountApiError('Bạn còn đơn thanh toán…', 409, 'PAYMENT_PENDING'),
    )
    await act(async () => buttonByText('Permanently delete account').click())
    const alert = container.querySelector('[role="alert"]')?.textContent ?? ''
    expect(alert).toMatch(/payment in progress/)
    expect(alert).toMatch(/24 hours/)
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('server đòi 2FA (STEP_UP_REQUIRED) ⇒ hiện ô mã 2FA, gửi lại kèm mã', async () => {
    await renderOpen()
    setValue(inputsByLabel('Mật khẩu hiện tại')[0]!, 'mk')
    api.exportMyData.mockRejectedValueOnce(
      new AccountApiError('Nhập mã xác thực hai bước để tiếp tục.', 403, 'STEP_UP_REQUIRED'),
    )
    await act(async () => buttonByText('Tải dữ liệu (JSON)').click())
    const codeInputs = inputsByLabel('Mã xác thực hai bước')
    expect(codeInputs).toHaveLength(2)
    setValue(codeInputs[0]!, '123456')
    setValue(inputsByLabel('Mật khẩu hiện tại')[0]!, 'mk')
    api.exportMyData.mockResolvedValueOnce('dhcb-du-lieu-cua-toi-2026-10-08.json')
    await act(async () => buttonByText('Tải dữ liệu (JSON)').click())
    expect(api.exportMyData).toHaveBeenLastCalledWith({
      reauth: { method: 'password', password: 'mk' },
      twoFactorCode: '123456',
    })
    expect(container.querySelector('[role="status"]')?.textContent).toMatch(/Đã tải về tệp/)
  })

  it('xuất xong KHÔNG hiển thị nội dung tệp (Luật số 1) — chỉ báo tên tệp', async () => {
    await renderOpen()
    setValue(inputsByLabel('Mật khẩu hiện tại')[0]!, 'mk')
    api.exportMyData.mockResolvedValueOnce('dhcb-du-lieu-cua-toi-2026-10-08.json')
    await act(async () => buttonByText('Tải dữ liệu (JSON)').click())
    for (const leak of ['focus', 'extra_hour', 'flow_activity', 'suggested_task_id', 'intake'])
      expect(container.textContent).not.toContain(leak)
  })

  it('xác minh bằng Google: mở popup lấy token; huỷ popup ⇒ báo lỗi, không gọi API', async () => {
    await renderOpen({ ...BASE_OPTIONS, methods: ['google'] })
    expect(google.preloadGoogleIdentity).toHaveBeenCalled()
    google.requestGoogleAccessToken.mockResolvedValueOnce(null)
    await act(async () => buttonByText('Tải dữ liệu (JSON)').click())
    expect(api.exportMyData).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/Google/)

    google.requestGoogleAccessToken.mockResolvedValueOnce('ya29.token-moi')
    api.exportMyData.mockResolvedValueOnce('f.json')
    await act(async () => buttonByText('Tải dữ liệu (JSON)').click())
    expect(api.exportMyData).toHaveBeenCalledWith({
      reauth: { method: 'google', accessToken: 'ya29.token-moi' },
    })
  })

  it('tài khoản không có cách xác minh nào ⇒ hướng dẫn liên hệ, không có biểu mẫu', async () => {
    await renderOpen({ ...BASE_OPTIONS, methods: [] })
    expect(container.textContent).toMatch(/liên hệ hỗ trợ/)
    expect(container.querySelector('form')).toBeNull()
  })
})

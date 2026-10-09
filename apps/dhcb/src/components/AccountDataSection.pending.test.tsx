// AccountDataSection — khối "Đơn thanh toán đang chờ" chặn xoá tài khoản + nút tự huỷ (changelog 0546).
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
const cancelApi = vi.hoisted(() => ({ cancelPendingPayment: vi.fn() }))
vi.mock('../lib/paymentCancelApi', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/paymentCancelApi')>('../lib/paymentCancelApi')
  return { ...actual, ...cancelApi }
})
vi.mock('@core/clientAuth', () => ({
  requestGoogleAccessToken: vi.fn(),
  preloadGoogleIdentity: vi.fn(),
}))

import AccountDataSection from './AccountDataSection'
import { formatRemaining } from '../lib/formatRemaining'
import { AccountApiError } from '../lib/accountApi'
import { PaymentCancelError } from '../lib/paymentCancelApi'

const NOW = Date.parse('2026-10-09T03:00:00.000Z')
const PENDING = {
  id: '11111111-1111-4111-8111-111111111111',
  paymentCode: 'DHCB7K2M9QRT',
  amountVnd: 99_000,
  plan: 'vip',
  cycle: 'month',
  createdAt: '2026-10-09T02:40:00.000Z',
  expiresAt: '2026-10-09T03:10:00.000Z',
  // 24 giờ 10 phút sau NOW
  graceEndsAt: '2026-10-10T03:10:00.000Z',
}
const OPTIONS: AccountOptions = {
  methods: ['password'],
  twoFactorRequired: false,
  vipActive: false,
  planExpiresAt: null,
  pendingPayments: [PENDING],
}

let container: HTMLDivElement
let root: Root

function buttonByText(text: string): HTMLButtonElement {
  const b = Array.from(container.querySelectorAll('button')).find((x) =>
    x.textContent?.includes(text),
  )
  if (!b) throw new Error(`không thấy nút "${text}"`)
  return b
}

function checkboxByText(text: string): HTMLInputElement {
  const label = Array.from(container.querySelectorAll('label')).find((l) =>
    l.textContent?.includes(text),
  )
  const box = label?.querySelector<HTMLInputElement>('input[type="checkbox"]')
  if (!box) throw new Error(`không thấy ô tick "${text}"`)
  return box
}

/** Ô nhập theo nhãn — lấy ô CUỐI (mật khẩu có ở cả khối tải dữ liệu lẫn khối xoá). */
function inputByLabel(text: string): HTMLInputElement {
  const label = Array.from(container.querySelectorAll('label'))
    .filter((l) => l.textContent?.includes(text))
    .at(-1)
  const input = container.querySelector<HTMLInputElement>(`[id="${label?.getAttribute('for')}"]`)
  if (!input) throw new Error(`không thấy ô "${text}"`)
  return input
}

function setValue(el: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function renderOpen(options: AccountOptions, isA = true) {
  api.fetchAccountOptions.mockResolvedValue(options)
  await act(async () => root.render(<AccountDataSection isA={isA} onDeleted={vi.fn()} />))
  await act(async () => buttonByText(isA ? 'Dữ liệu & tài khoản' : 'Your data & account').click())
}

const region = () => container.querySelector('section[aria-labelledby]')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(NOW)
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  for (const fn of [...Object.values(api), ...Object.values(cancelApi)]) fn.mockReset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('formatRemaining', () => {
  it('làm tròn LÊN theo phút, không âm', () => {
    expect(formatRemaining(24 * 3600_000 + 10 * 60_000, true)).toBe('24 giờ 10 phút')
    expect(formatRemaining(30_001, true)).toBe('1 phút')
    expect(formatRemaining(-5000, true)).toBe('0 phút')
    expect(formatRemaining(90 * 60_000, false)).toBe('1 h 30 min')
  })
})

describe('AccountDataSection — đơn chờ chặn xoá', () => {
  it('không có đơn chờ ⇒ không hiện khối', async () => {
    await renderOpen({ ...OPTIONS, pendingPayments: [] })
    expect(container.textContent).not.toContain('Đơn thanh toán đang chờ')
    expect(region()).toBeNull()
  })

  it('hiện RÕ đơn (số tiền, mã nội dung CK, giờ tạo, còn bao lâu hết ân hạn); nút xoá bị khoá', async () => {
    await renderOpen(OPTIONS)
    const block = region()
    expect(block?.textContent).toContain('Đơn thanh toán đang chờ')
    expect(block?.textContent).toContain('99.000 đ')
    expect(block?.textContent).toContain('DHCB7K2M9QRT')
    expect(block?.textContent).toContain(new Date(PENDING.createdAt).toLocaleString('vi-VN'))
    expect(block?.textContent).toContain('24 giờ 10 phút')
    // Đủ điều kiện khác vẫn KHÔNG bật được nút xoá khi còn đơn chặn.
    setValue(inputByLabel('Mật khẩu hiện tại'), 'pw')
    setValue(inputByLabel('để xác nhận'), 'XOÁ TÀI KHOẢN')
    expect(buttonByText('Xoá vĩnh viễn tài khoản').disabled).toBe(true)
  })

  it('nút huỷ khoá tới khi tick "CHƯA chuyển khoản"; huỷ xong khối biến mất, nút xoá mở lại', async () => {
    cancelApi.cancelPendingPayment.mockResolvedValue({
      ok: true,
      alreadyCancelled: false,
      cancelledAt: '2026-10-09T03:00:00.000Z',
    })
    await renderOpen(OPTIONS)
    const cancel = buttonByText('Huỷ đơn — tôi CHƯA chuyển khoản')
    expect(cancel.disabled).toBe(true)
    await act(async () => cancel.click())
    expect(cancelApi.cancelPendingPayment).not.toHaveBeenCalled()

    await act(async () => checkboxByText('CHƯA chuyển khoản cho đơn DHCB7K2M9QRT').click())
    expect(cancel.disabled).toBe(false)
    await act(async () => cancel.click())
    expect(cancelApi.cancelPendingPayment).toHaveBeenCalledWith(PENDING.id)
    expect(region()).toBeNull()

    setValue(inputByLabel('Mật khẩu hiện tại'), 'pw')
    setValue(inputByLabel('để xác nhận'), 'XOÁ TÀI KHOẢN')
    expect(buttonByText('Xoá vĩnh viễn tài khoản').disabled).toBe(false)
  })

  it('đơn vừa được TRẢ (webhook thắng đua) ⇒ báo rõ, KHÔNG gỡ khối', async () => {
    cancelApi.cancelPendingPayment.mockRejectedValue(
      new PaymentCancelError('Đơn này đã được thanh toán', 409, 'ALREADY_PAID'),
    )
    await renderOpen(OPTIONS)
    await act(async () => checkboxByText('CHƯA chuyển khoản').click())
    await act(async () => buttonByText('Huỷ đơn — tôi CHƯA chuyển khoản').click())
    expect(region()?.querySelector('[role="alert"]')?.textContent).toContain('vừa được thanh toán')
    expect(region()).not.toBeNull()
  })

  it('đơn đã tự kết thúc (NOT_CANCELLABLE) ⇒ không còn chặn: gỡ khối', async () => {
    cancelApi.cancelPendingPayment.mockRejectedValue(
      new PaymentCancelError('Đơn đã kết thúc', 409, 'NOT_CANCELLABLE'),
    )
    await renderOpen(OPTIONS)
    await act(async () => checkboxByText('CHƯA chuyển khoản').click())
    await act(async () => buttonByText('Huỷ đơn — tôi CHƯA chuyển khoản').click())
    expect(region()).toBeNull()
  })

  it('lỗi mạng ⇒ thông báo + vẫn bấm lại được', async () => {
    cancelApi.cancelPendingPayment.mockRejectedValue(
      new PaymentCancelError('Lỗi kết nối — kiểm tra mạng rồi thử lại.', 0),
    )
    await renderOpen(OPTIONS)
    await act(async () => checkboxByText('CHƯA chuyển khoản').click())
    await act(async () => buttonByText('Huỷ đơn — tôi CHƯA chuyển khoản').click())
    expect(region()?.textContent).toContain('Lỗi kết nối')
    expect(buttonByText('Huỷ đơn — tôi CHƯA chuyển khoản').disabled).toBe(false)
  })

  it('server từ chối xoá vì đơn tạo ở tab khác (PAYMENT_PENDING) ⇒ tải lại danh sách đơn, GIỮ ô đã nhập', async () => {
    await renderOpen({ ...OPTIONS, pendingPayments: [] })
    api.deleteMyAccount.mockRejectedValue(
      new AccountApiError('Bạn còn đơn thanh toán đang chờ xử lý.', 409, 'PAYMENT_PENDING'),
    )
    api.fetchAccountOptions.mockResolvedValue(OPTIONS)
    setValue(inputByLabel('Mật khẩu hiện tại'), 'pw')
    setValue(inputByLabel('để xác nhận'), 'XOÁ TÀI KHOẢN')
    await act(async () => buttonByText('Xoá vĩnh viễn tài khoản').click())
    await act(async () => {}) // lượt tải lại danh sách đơn chạy sau khi nhận lỗi
    expect(api.deleteMyAccount).toHaveBeenCalledTimes(1)
    expect(region()?.textContent).toContain('DHCB7K2M9QRT')
    expect(inputByLabel('Mật khẩu hiện tại').value).toBe('pw')
  })

  it('chiều B: tiếng Anh, lỗi server tiếng Việt thay bằng câu tiếng Anh', async () => {
    cancelApi.cancelPendingPayment.mockRejectedValue(
      new PaymentCancelError('Không tìm thấy đơn thanh toán.', 404, 'NOT_FOUND'),
    )
    await renderOpen(OPTIONS, false)
    expect(region()?.textContent).toContain('Pending payment orders')
    await act(async () => checkboxByText('have NOT transferred').click())
    await act(async () => buttonByText('Cancel order — I have NOT paid').click())
    expect(region()?.textContent).toContain('Could not cancel the order')
  })
})

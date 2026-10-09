// AdminRefundQueue — hàng chờ hoàn tiền thủ công ở /admin (changelog 0546).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AdminRefundRow } from '@dhcb/core-contracts/paymentCancel'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ Authorization: 'Bearer t' }) }))

import AdminRefundQueue from './AdminRefundQueue'

const NEEDED: AdminRefundRow = {
  id: '22222222-2222-4222-8222-222222222222',
  paymentId: 'p1',
  paymentCode: 'DHCB7K2M9QRT',
  provider: 'sepay',
  providerTxnId: '92704',
  amountVnd: 99_000,
  reason: 'cancelled_by_user',
  gateway: 'Vietcombank',
  referenceCode: 'MBVCB.3278907687',
  receivingAccount: '0123499999',
  transactionDate: '2026-10-09 14:02:37',
  receivedAt: '2026-10-09T07:02:40.000Z',
  status: 'needed',
  refundedAt: null,
  refundedBy: null,
  refundNote: null,
}
const DONE: AdminRefundRow = {
  ...NEEDED,
  id: '33333333-3333-4333-8333-333333333333',
  reason: 'account_deleted',
  status: 'refunded',
  refundedAt: '2026-10-09T08:00:00.000Z',
  refundedBy: 'a1',
  refundNote: 'Đã CK hoàn FT1',
}

let container: HTMLDivElement
let root: Root
const fetchMock = vi.fn()

function respond(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }))
}

async function render() {
  await act(async () => root.render(<AdminRefundQueue />))
  await act(async () => {})
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('AdminRefundQueue', () => {
  it('chưa từng có khoản nào ⇒ không chiếm chỗ', async () => {
    fetchMock.mockReturnValueOnce(respond({ refunds: [] }))
    await render()
    expect(container.innerHTML).toBe('')
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin-payments?view=refunds')
  })

  it('hiện nổi bật số khoản CẦN hoàn + đủ thông tin SePay; khoản đã hoàn gom riêng', async () => {
    fetchMock.mockReturnValueOnce(respond({ refunds: [NEEDED, DONE] }))
    await render()
    const text = container.textContent ?? ''
    expect(container.querySelector('h4')?.textContent).toBe('Cần hoàn tiền (1)')
    for (const s of ['99.000 đ', '92704', 'MBVCB.3278907687', 'Vietcombank', '0123499999']) {
      expect(text).toContain(s)
    }
    expect(text).toContain('Người dùng đã tự huỷ đơn')
    expect(container.querySelector('details summary')?.textContent).toBe('Đã hoàn (1)')
    expect(text).toContain('Đã CK hoàn FT1')
  })

  it('"Đã hoàn tiền" khoá tới khi có ghi chú; gửi đúng body rồi tải lại danh sách', async () => {
    fetchMock
      .mockReturnValueOnce(respond({ refunds: [NEEDED] }))
      .mockReturnValueOnce(respond({ ok: true, alreadyRefunded: false }))
      .mockReturnValueOnce(respond({ refunds: [{ ...NEEDED, ...DONE, id: NEEDED.id }] }))
    await render()
    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Đã hoàn tiền',
    )!
    expect(btn.disabled).toBe(true)
    const input = container.querySelector<HTMLInputElement>('input')!
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        input,
        ' FT999 ',
      )
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(btn.disabled).toBe(false)
    await act(async () => btn.click())
    await act(async () => {})
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/admin-payments')
    expect(JSON.parse(String(init.body))).toEqual({
      action: 'mark-refunded',
      refundId: NEEDED.id,
      note: 'FT999',
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(container.querySelector('h4')?.textContent).toBe('Cần hoàn tiền (0)')
  })

  it('lỗi tải ⇒ thông báo + Thử lại', async () => {
    fetchMock.mockReturnValueOnce(respond({ error: 'x' }, 500))
    await render()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Không tải được danh sách cần hoàn tiền',
    )
    fetchMock.mockReturnValueOnce(respond({ refunds: [NEEDED] }))
    const retry = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Thử lại',
    )!
    await act(async () => retry.click())
    await act(async () => {})
    expect(container.querySelector('h4')?.textContent).toBe('Cần hoàn tiền (1)')
  })
})

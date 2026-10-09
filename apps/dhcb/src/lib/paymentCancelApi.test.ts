// paymentCancelApi — gọi /api/payment-cancel + kiểm phản hồi bằng Zod (changelog 0546).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cancelPendingPayment, PaymentCancelError } from './paymentCancelApi'

const ID = '11111111-1111-4111-8111-111111111111'
const respond = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }))

afterEach(() => vi.unstubAllGlobals())

describe('cancelPendingPayment', () => {
  it('gửi đúng body (luôn kèm tick xác nhận) và trả kết quả đã kiểm', async () => {
    const fetchMock = vi.fn(() =>
      respond({ ok: true, alreadyCancelled: false, cancelledAt: '2026-10-09T03:00:00.000Z' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await cancelPendingPayment(ID)).toEqual({
      ok: true,
      alreadyCancelled: false,
      cancelledAt: '2026-10-09T03:00:00.000Z',
    })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/payment-cancel')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ paymentId: ID, confirmNotTransferred: true })
  })

  it('lỗi có mã ⇒ PaymentCancelError mang code', async () => {
    vi.stubGlobal('fetch', () => respond({ error: 'Đã trả', code: 'ALREADY_PAID' }, 409))
    await expect(cancelPendingPayment(ID)).rejects.toMatchObject({
      name: 'PaymentCancelError',
      status: 409,
      code: 'ALREADY_PAID',
      message: 'Đã trả',
    })
  })

  it('lỗi không đúng khuôn ⇒ thông điệp chung theo mã HTTP', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('oops', { status: 502 })))
    await expect(cancelPendingPayment(ID)).rejects.toMatchObject({ status: 502, code: undefined })
  })

  it('mất mạng ⇒ lỗi kết nối (status 0)', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')))
    const err = await cancelPendingPayment(ID).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(PaymentCancelError)
    expect((err as PaymentCancelError).status).toBe(0)
  })

  it('200 nhưng thân lệch hợp đồng ⇒ ném, không coi là đã huỷ', async () => {
    vi.stubGlobal('fetch', () => respond({ ok: true }))
    await expect(cancelPendingPayment(ID)).rejects.toBeInstanceOf(PaymentCancelError)
  })
})

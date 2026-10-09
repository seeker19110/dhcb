// @vitest-environment node
// Test /api/payment-cancel — người dùng tự huỷ đơn chờ "tôi CHƯA chuyển khoản" (changelog 0546).
// Canh: thứ tự rate limit → auth → Zod, IDOR (userId CHỈ từ phiên), idempotent, đơn đã paid/expired.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { userId: 'user-1' } as { userId: string } | null,
  limits: new Map<string, boolean>(),
  events: [] as { type: string; meta: Record<string, unknown> }[],
}))

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async (_key: string, _max: number, bucket: string) =>
    state.limits.get(bucket) ?? true,
  validateAuth: async () => state.user,
  logSecurityEvent: (type: string, _ip: string, meta: Record<string, unknown>) =>
    state.events.push({ type, meta }),
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))
const billing = vi.hoisted(() => ({ cancelPendingPayment: vi.fn() }))
vi.mock('@dhcb/core-billing/paymentCancel', () => billing)

import handler from './payment-cancel.js'
import { accountSubjectHash } from '@dhcb/core-personal/accountErasureShared'

const PAYMENT_ID = '11111111-1111-4111-8111-111111111111'
const post = (body: unknown) =>
  new Request('http://localhost/api/payment-cancel', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
const OK_BODY = { paymentId: PAYMENT_ID, confirmNotTransferred: true }

beforeEach(() => {
  state.user = { userId: 'user-1' }
  state.limits.clear()
  state.events.length = 0
  billing.cancelPendingPayment.mockReset()
  billing.cancelPendingPayment.mockResolvedValue({
    kind: 'cancelled',
    cancelledAt: '2026-10-09T03:00:00.000Z',
  })
})

describe('/api/payment-cancel', () => {
  it('GET → 405', async () => {
    const res = await handler(new Request('http://localhost/api/payment-cancel'))
    expect(res.status).toBe(405)
  })

  it('vượt rate limit theo IP → 429, CHƯA xác thực, không huỷ', async () => {
    state.limits.set('payment-cancel', false)
    state.user = null
    const res = await handler(post(OK_BODY))
    expect(res.status).toBe(429)
    expect((await res.json()).code).toBe('RATE_LIMITED')
    expect(billing.cancelPendingPayment).not.toHaveBeenCalled()
  })

  it('chưa đăng nhập → 401', async () => {
    state.user = null
    const res = await handler(post(OK_BODY))
    expect(res.status).toBe(401)
    expect(billing.cancelPendingPayment).not.toHaveBeenCalled()
  })

  it('vượt rate limit theo người dùng → 429, log không có userId trần', async () => {
    state.limits.set('payment-cancel-user', false)
    const res = await handler(post(OK_BODY))
    expect(res.status).toBe(429)
    expect(billing.cancelPendingPayment).not.toHaveBeenCalled()
    expect(JSON.stringify(state.events)).not.toContain('user-1')
  })

  it.each([
    { label: 'thiếu tick xác nhận', body: { paymentId: PAYMENT_ID } },
    { label: 'tick = false', body: { paymentId: PAYMENT_ID, confirmNotTransferred: false } },
    {
      label: 'paymentId không phải uuid',
      body: { paymentId: 'DHCB1', confirmNotTransferred: true },
    },
  ])('$label → 400, không huỷ', async ({ body }) => {
    const res = await handler(post(body))
    expect(res.status).toBe(400)
    expect(billing.cancelPendingPayment).not.toHaveBeenCalled()
  })

  it('huỷ thành công: userId lấy từ PHIÊN, bỏ qua userId trong body (IDOR)', async () => {
    const res = await handler(post({ ...OK_BODY, userId: 'user-2' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ok: true,
      alreadyCancelled: false,
      cancelledAt: '2026-10-09T03:00:00.000Z',
    })
    expect(billing.cancelPendingPayment).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      PAYMENT_ID,
    )
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(state.events).toEqual([
      {
        type: 'PAYMENT_CANCELLED_BY_USER',
        meta: { subject: accountSubjectHash('user-1'), paymentId: PAYMENT_ID },
      },
    ])
  })

  it('bấm lại (đã huỷ từ trước) → 200 alreadyCancelled, không log lại', async () => {
    billing.cancelPendingPayment.mockResolvedValue({
      kind: 'already_cancelled',
      cancelledAt: '2026-10-09T02:00:00.000Z',
    })
    const res = await handler(post(OK_BODY))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ alreadyCancelled: true })
    expect(state.events).toEqual([])
  })

  it('đơn đã paid (webhook thắng đua) → 409 ALREADY_PAID', async () => {
    billing.cancelPendingPayment.mockResolvedValue({ kind: 'already_paid' })
    const res = await handler(post(OK_BODY))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('ALREADY_PAID')
  })

  it('đơn đã expired → 409 NOT_CANCELLABLE', async () => {
    billing.cancelPendingPayment.mockResolvedValue({ kind: 'not_cancellable', status: 'expired' })
    const res = await handler(post(OK_BODY))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('NOT_CANCELLABLE')
  })

  it('đơn của người khác / không tồn tại → 404 NOT_FOUND (cùng một phản hồi)', async () => {
    billing.cancelPendingPayment.mockResolvedValue({ kind: 'not_found' })
    const res = await handler(post(OK_BODY))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Không tìm thấy đơn thanh toán.', code: 'NOT_FOUND' })
  })

  it('lỗi CSDL → NÉM (wrapEdge trả 500), không nuốt', async () => {
    billing.cancelPendingPayment.mockRejectedValue(new Error('db down'))
    await expect(handler(post(OK_BODY))).rejects.toThrow('db down')
  })
})

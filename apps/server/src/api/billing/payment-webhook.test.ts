// Test webhook SePay — trọng tâm CHỐNG TRÙNG và KIỂM TRA SỐ TIỀN (đây là chỗ đụng tiền thật).

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('@dhcb/core-auth/security', () => ({ logSecurityEvent: vi.fn() }))
const granted: { calls: { userId: string; plan: string; days: number }[]; failNext: boolean } = {
  calls: [],
  failNext: false,
}
vi.mock('@dhcb/core-billing/planGrant', () => ({
  grantPlanDays: async (userId: string, plan: string, days: number) => {
    if (granted.failNext) {
      granted.failNext = false
      throw new Error('grant failed')
    }
    granted.calls.push({ userId, plan, days })
    return { plan, planExpiresAt: new Date() }
  },
}))

import handler from './payment-webhook.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { logSecurityEvent } from '@dhcb/core-auth/security'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()
const API_KEY = 'sepay-test-key'

// withTransaction() lấy client qua pool.connect() rồi tự gọi 'begin'/'commit'/'rollback' — những
// câu lệnh transaction đó không nằm trong kịch bản mockResolvedValueOnce của từng test (vốn chỉ
// mô phỏng SELECT/UPDATE nghiệp vụ), nên chặn riêng và cho qua ngay, còn lại uỷ quyền cho `query`
// dùng chung để giữ nguyên thứ tự mock các test đã viết trước khi có transaction.
const client = {
  query: vi.fn((sql: string, params?: unknown[]) => {
    if (sql === 'begin' || sql === 'commit' || sql === 'rollback') {
      return Promise.resolve({ rows: [], rowCount: 0 })
    }
    return query(sql, params)
  }),
  release: vi.fn(),
}

function makeRequest(body: unknown, apiKey: string | null = API_KEY): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (apiKey) headers.authorization = `Apikey ${apiKey}`
  return new Request('http://localhost/api/payment-webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

const PENDING_PAYMENT = {
  id: 'payment-1',
  user_id: 'user-1',
  plan: 'pro',
  cycle: 'month',
  amount_vnd: 40_000,
  status: 'pending',
  years: 1,
}

beforeEach(() => {
  query.mockReset()
  client.query.mockClear()
  client.release.mockClear()
  mockedGetPool.mockReturnValue({
    query,
    connect: () => Promise.resolve(client),
  } as unknown as ReturnType<typeof getPgPool>)
  granted.calls = []
  granted.failNext = false
  vi.mocked(logSecurityEvent).mockClear()
  process.env.SEPAY_WEBHOOK_API_KEY = API_KEY
})

afterEach(() => {
  delete process.env.SEPAY_WEBHOOK_API_KEY
})

describe('/api/payment-webhook', () => {
  it('sai/thiếu API key → 401, không đụng DB', async () => {
    const resp = await handler(makeRequest({ id: 1, transferAmount: 40_000 }, 'sai-khoa'))
    expect(resp.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('transferType=out (tiền ra) → success:true, bỏ qua, không đụng DB', async () => {
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'out', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ success: true })
    expect(query).not.toHaveBeenCalled()
  })

  it('nội dung không chứa mã nào → success:true, không cấp gói', async () => {
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 40_000, content: 'chuyen tien' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
  })

  it('mã không khớp đơn nào trong DB → success:true, không cấp gói', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
  })

  it('chuyển THIẾU tiền → không cấp gói, giữ pending (không update)', async () => {
    query.mockResolvedValueOnce({ rows: [PENDING_PAYMENT] })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 10_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(query).toHaveBeenCalledTimes(1) // chỉ SELECT, không UPDATE
  })

  it('đơn QUÁ HẠN (quá expires_at + ân hạn 24h) → success:true, giữ pending, KHÔNG cấp gói', async () => {
    const expired = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // hết hạn 2 ngày trước
    query.mockResolvedValueOnce({ rows: [{ ...PENDING_PAYMENT, expires_at: expired }] })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(query).toHaveBeenCalledTimes(1) // chỉ SELECT, không UPDATE
  })

  it('đơn hết hạn NHƯNG còn trong ân hạn 24h (chuyển khoản chậm) → vẫn cấp gói', async () => {
    const justExpired = new Date(Date.now() - 60 * 60 * 1000) // hết hạn 1 giờ trước
    query
      .mockResolvedValueOnce({ rows: [{ ...PENDING_PAYMENT, expires_at: justExpired }] })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 'user-1', plan: 'pro', cycle: 'month', years: 1 }],
      })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toHaveLength(1)
  })

  it('đơn ĐÃ paid (webhook lặp) → success:true, không cấp gói lần 2', async () => {
    query.mockResolvedValueOnce({ rows: [{ ...PENDING_PAYMENT, status: 'paid' }] })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('đơn của tài khoản ĐÃ XOÁ (user_id null, changelog 0533) → ghi hàng chờ hoàn tiền (0546), log ORPHANED, không cấp gói, không update', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ ...PENDING_PAYMENT, user_id: null, status: 'expired' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(query).toHaveBeenCalledTimes(2)
    const [insertSql, insertParams] = query.mock.calls[1] as [string, unknown[]]
    expect(insertSql).toContain('insert into public.payment_refunds')
    expect(insertParams.slice(0, 4)).toEqual(['payment-1', '1', 40_000, 'account_deleted'])
    expect(query.mock.calls.some(([sql]) => String(sql).startsWith('update'))).toBe(false)
    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith(
      'SEPAY_PAYMENT_ORPHANED',
      'sepay',
      expect.objectContaining({ paymentId: PENDING_PAYMENT.id, refundQueued: true }),
    )
  })

  it('đủ tiền, đơn pending → cấp đúng gói/số ngày, ghi provider_txn_id', async () => {
    query.mockResolvedValueOnce({ rows: [PENDING_PAYMENT] }).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id: 'user-1', plan: 'pro', cycle: 'month' }],
    })
    const resp = await handler(
      makeRequest({ id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([{ userId: 'user-1', plan: 'pro', days: 30 }])
    const [sql, params] = query.mock.calls[1] as [string, unknown[]]
    expect(sql).toContain("status = 'pending'")
    expect(params).toEqual(['payment-1', '999'])
  })

  it('đủ tiền, đơn pending → cấp gói nhưng KHÔNG xác thực quyền sở hữu email', async () => {
    query.mockResolvedValueOnce({ rows: [PENDING_PAYMENT] }).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ user_id: 'user-1', plan: 'pro', cycle: 'month' }],
    })
    const resp = await handler(
      makeRequest({ id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(query.mock.calls.map(([sql]) => String(sql)).join('\n')).not.toContain('email_verified')
    expect(granted.calls).toEqual([{ userId: 'user-1', plan: 'pro', days: 30 }])
  })

  it('2 webhook song song cho cùng đơn: cái thứ 2 thấy rowCount=0 → KHÔNG cấp lần 2', async () => {
    query
      .mockResolvedValueOnce({ rows: [PENDING_PAYMENT] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // request khác đã thắng UPDATE trước
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] }) // đọc lại: đơn vẫn còn chủ
    const resp = await handler(
      makeRequest({ id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    // Thua race bình thường KHÔNG phải sự cố — không bắn cảnh báo mồ côi.
    expect(vi.mocked(logSecurityEvent)).not.toHaveBeenCalledWith(
      'SEPAY_PAYMENT_ORPHANED',
      expect.anything(),
      expect.anything(),
    )
  })

  it('đơn bị ẩn danh GIỮA select và update (chủ vừa xoá tài khoản) → hàng chờ hoàn tiền trong CÙNG transaction, log ORPHANED, không PII', async () => {
    query
      .mockResolvedValueOnce({ rows: [PENDING_PAYMENT] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // `and user_id is not null` chặn update
      .mockResolvedValueOnce({ rows: [{ user_id: null, status: 'expired' }] }) // đọc lại: mất chủ
      .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
    const resp = await handler(
      makeRequest({ id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith('SEPAY_PAYMENT_ORPHANED', 'sepay', {
      paymentId: PENDING_PAYMENT.id,
      txnId: '999',
      transferAmount: 40_000,
      refundQueued: true,
      duplicate: false,
      stage: 'update',
    })
    const [recheckSql] = query.mock.calls[2] as [string]
    expect(recheckSql).toContain('select user_id, status from public.payments')
    // Ghi hàng chờ qua CLIENT của transaction (không phải pool) — commit cùng lúc.
    const clientSqls = client.query.mock.calls.map(([sql]) => String(sql))
    expect(clientSqls.some((sql) => sql.includes('insert into public.payment_refunds'))).toBe(true)
    expect(clientSqls).toContain('commit')
  })

  // ── Changelog 0546: người dùng tự huỷ đơn ("tôi chưa chuyển khoản") ─────────────────────────
  const CANCELLED = { ...PENDING_PAYMENT, status: 'cancelled' }

  it.each([
    { label: 'đúng số tiền, còn hạn', amount: 40_000, expires_at: null },
    { label: 'chuyển THIẾU', amount: 10_000, expires_at: null },
    {
      label: 'quá hạn + ân hạn (3 ngày sau)',
      amount: 40_000,
      expires_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ])(
    'tiền về cho đơn ĐÃ HUỶ ($label) → KHÔNG cấp gói, KHÔNG update đơn, ghi hàng chờ hoàn đúng số tiền về',
    async ({ amount, expires_at }) => {
      query
        .mockResolvedValueOnce({ rows: [{ ...CANCELLED, expires_at }] })
        .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
      const resp = await handler(
        makeRequest({ id: 777, transferType: 'in', transferAmount: amount, code: 'ENVI7K2M9QRT' }),
      )
      expect(resp.status).toBe(200)
      expect(await resp.json()).toEqual({ success: true })
      expect(granted.calls).toEqual([])
      expect(query).toHaveBeenCalledTimes(2)
      const [sql, params] = query.mock.calls[1] as [string, unknown[]]
      expect(sql).toContain('insert into public.payment_refunds')
      expect(sql).toContain('on conflict (provider, provider_txn_id) do nothing')
      expect(params.slice(0, 4)).toEqual(['payment-1', '777', amount, 'cancelled_by_user'])
      expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith(
        'SEPAY_PAYMENT_CANCELLED_PAID',
        'sepay',
        expect.objectContaining({ paymentId: 'payment-1', txnId: '777', refundQueued: true }),
      )
    },
  )

  it('đơn đã huỷ RỒI chủ xoá tài khoản (user_id null) → lý do vẫn là "người dùng huỷ"', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ ...CANCELLED, user_id: null }] })
      .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
    await handler(
      makeRequest({ id: 5, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params[3]).toBe('cancelled_by_user')
  })

  it('lưu bằng chứng SePay cần cho hoàn tiền (mã tham chiếu, ngân hàng, TK nhận, thời gian) — KHÔNG lưu nội dung CK', async () => {
    query
      .mockResolvedValueOnce({ rows: [CANCELLED] })
      .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
    await handler(
      makeRequest({
        id: 92704,
        gateway: 'Vietcombank',
        transactionDate: '2026-10-09 14:02:37',
        accountNumber: '0123499999',
        code: null,
        content: 'NGUYEN VAN A chuyen tien ENVI7K2M9QRT',
        transferType: 'in',
        transferAmount: 40_000,
        referenceCode: 'MBVCB.3278907687',
      }),
    )
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params).toEqual([
      'payment-1',
      '92704',
      40_000,
      'cancelled_by_user',
      'Vietcombank',
      'MBVCB.3278907687',
      '0123499999',
      '2026-10-09 14:02:37',
    ])
    expect(JSON.stringify(params)).not.toContain('NGUYEN')
  })

  it('trường bằng chứng lạ/quá dài KHÔNG làm hỏng payload — vẫn khớp đơn, trường đó thành null', async () => {
    query
      .mockResolvedValueOnce({ rows: [CANCELLED] })
      .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
    const resp = await handler(
      makeRequest({
        id: 8,
        transferType: 'in',
        transferAmount: 40_000,
        content: 'ENVI7K2M9QRT',
        gateway: 12345,
        referenceCode: 'x'.repeat(500),
      }),
    )
    expect(resp.status).toBe(200)
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params.slice(4)).toEqual([null, null, null, null])
  })

  it('SePay gửi LẠI giao dịch đã vào hàng chờ (insert không thêm dòng) → 200, log đánh dấu trùng', async () => {
    query
      .mockResolvedValueOnce({ rows: [CANCELLED] })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const resp = await handler(
      makeRequest({ id: 777, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith(
      'SEPAY_PAYMENT_CANCELLED_PAID',
      'sepay',
      expect.objectContaining({ duplicate: true }),
    )
  })

  it.each([
    { amount: 40_000.6, recorded: 40_001 },
    { amount: -5, recorded: 0 },
  ])(
    'số tiền SePay bất thường ($amount) cho đơn đã huỷ → vẫn GHI hàng chờ ($recorded), không 500 làm mất dấu vết tiền',
    async ({ amount, recorded }) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      query
        .mockResolvedValueOnce({ rows: [CANCELLED] })
        .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
      const resp = await handler(
        makeRequest({ id: 31, transferType: 'in', transferAmount: amount, code: 'ENVI7K2M9QRT' }),
      )
      expect(resp.status).toBe(200)
      const [, params] = query.mock.calls[1] as [string, unknown[]]
      expect(params[2]).toBe(recorded)
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('payment_refunds'),
        expect.objectContaining({ paymentId: 'payment-1', rawAmount: amount }),
      )
      warn.mockRestore()
    },
  )

  it('payload sai schema → log CHỈ khoá + id giao dịch, KHÔNG log content/description (họ tên người chuyển)', async () => {
    const resp = await handler(
      makeRequest({
        id: 42,
        transferType: 'in',
        transferAmount: 'không phải số',
        content: 'NGUYEN VAN A chuyen tien',
        description: 'BankAPINotify NGUYEN VAN A',
      }),
    )
    expect(resp.status).toBe(200)
    expect(query).not.toHaveBeenCalled()
    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith('SEPAY_WEBHOOK_BAD_PAYLOAD', 'sepay', {
      payloadType: 'object',
      keys: ['id', 'transferType', 'transferAmount', 'content', 'description'],
      txnId: '42',
    })
    expect(JSON.stringify(vi.mocked(logSecurityEvent).mock.calls)).not.toContain('NGUYEN')
  })

  it('ghi hàng chờ LỖI CSDL → ném (500) để SePay gửi lại, không trả success giả', async () => {
    query.mockResolvedValueOnce({ rows: [CANCELLED] }).mockRejectedValueOnce(new Error('db down'))
    await expect(
      handler(
        makeRequest({ id: 9, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
      ),
    ).rejects.toThrow('db down')
    expect(granted.calls).toEqual([])
  })

  it('ĐUA: người dùng huỷ GIỮA select (thấy pending) và update của webhook → không cấp gói, ghi hàng chờ trong transaction', async () => {
    query
      .mockResolvedValueOnce({ rows: [PENDING_PAYMENT] }) // webhook thấy pending
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // update thua: đơn vừa thành cancelled
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', status: 'cancelled' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'refund-1' }], rowCount: 1 })
    const resp = await handler(
      makeRequest({ id: 31, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    const [, params] = query.mock.calls[3] as [string, unknown[]]
    expect(params.slice(0, 4)).toEqual(['payment-1', '31', 40_000, 'cancelled_by_user'])
    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith(
      'SEPAY_PAYMENT_CANCELLED_PAID',
      'sepay',
      expect.objectContaining({ stage: 'update' }),
    )
  })

  it('đơn biến mất giữa select và update (không đọc lại được dòng) → coi như race, không log mồ côi', async () => {
    query
      .mockResolvedValueOnce({ rows: [PENDING_PAYMENT] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    const resp = await handler(
      makeRequest({ id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(vi.mocked(logSecurityEvent)).not.toHaveBeenCalledWith(
      'SEPAY_PAYMENT_ORPHANED',
      expect.anything(),
      expect.anything(),
    )
  })

  it('hai webhook chạy đồng thời và retry → chỉ cấp một lần, không xác thực email', async () => {
    let paid = false
    query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('select'))
        return { rows: [{ ...PENDING_PAYMENT, status: paid ? 'paid' : 'pending' }] }
      if (sql.startsWith('update public.payments') && !paid) {
        paid = true
        return { rows: [PENDING_PAYMENT], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })
    const payload = { id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }
    const responses = await Promise.all([
      handler(makeRequest(payload)),
      handler(makeRequest(payload)),
    ])
    expect(responses.map((r) => r.status)).toEqual([200, 200])
    expect((await handler(makeRequest(payload))).status).toBe(200)
    expect(granted.calls).toEqual([{ userId: 'user-1', plan: 'pro', days: 30 }])
    expect(query.mock.calls.some(([sql]) => String(sql).includes('email_verified'))).toBe(false)
  })

  it('cấp gói lỗi → rollback; retry tiếp tục cấp đúng một lần', async () => {
    let paid = false
    const transactionSql: string[] = []
    query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('select'))
        return { rows: [{ ...PENDING_PAYMENT, status: paid ? 'paid' : 'pending' }] }
      if (sql.startsWith('update public.payments') && !paid) {
        paid = true
        return { rows: [PENDING_PAYMENT], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })
    mockedGetPool.mockReturnValue({
      query,
      connect: async () => ({
        release: vi.fn(),
        query: async (sql: string, params?: unknown[]) => {
          transactionSql.push(sql)
          if (sql === 'rollback') paid = false
          if (['begin', 'commit', 'rollback'].includes(sql)) return { rows: [], rowCount: 0 }
          return query(sql, params)
        },
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const payload = { id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }
    granted.failNext = true
    await expect(handler(makeRequest(payload))).rejects.toThrow('grant failed')
    expect(paid).toBe(false)
    expect(transactionSql).toContain('rollback')
    expect(transactionSql).not.toContain('commit')
    expect((await handler(makeRequest(payload))).status).toBe(200)
    expect(paid).toBe(true)
    expect(granted.calls).toEqual([{ userId: 'user-1', plan: 'pro', days: 30 }])
    expect(transactionSql).toContain('commit')
  })

  it('UNIQUE violation provider_txn_id (23505) → coi như đã xử lý, success:true', async () => {
    query
      .mockResolvedValueOnce({ rows: [PENDING_PAYMENT] })
      .mockRejectedValueOnce({ code: '23505' })
    const resp = await handler(
      makeRequest({ id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ success: true })
    expect(granted.calls).toEqual([])
  })

  it('cấp đúng số ngày theo cycle year (365)', async () => {
    query
      .mockResolvedValueOnce({
        rows: [{ ...PENDING_PAYMENT, plan: 'vip', cycle: 'year', amount_vnd: 500_000 }],
      })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 'user-1', plan: 'vip', cycle: 'year', years: 1 }],
      })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 500_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([{ userId: 'user-1', plan: 'vip', days: 365 }])
  })

  it('mua NHIỀU NĂM (years=3) → cấp đúng 3×365 ngày, không phải 365', async () => {
    query
      .mockResolvedValueOnce({
        rows: [{ ...PENDING_PAYMENT, plan: 'vip', cycle: 'year', amount_vnd: 1_050_000, years: 3 }],
      })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 'user-1', plan: 'vip', cycle: 'year', years: 3 }],
      })
    const resp = await handler(
      makeRequest({
        id: 2,
        transferType: 'in',
        transferAmount: 1_050_000,
        content: 'ENVI7K2M9QRT',
      }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([{ userId: 'user-1', plan: 'vip', days: 1095 }])
  })

  it('years > 1 nhưng cycle KHÔNG phải year (dữ liệu lệch bất thường) → vẫn cấp đúng 1 chu kỳ, bỏ qua years', async () => {
    query
      .mockResolvedValueOnce({
        rows: [{ ...PENDING_PAYMENT, plan: 'pro', cycle: 'month', years: 3 }],
      })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: 'user-1', plan: 'pro', cycle: 'month', years: 3 }],
      })
    const resp = await handler(
      makeRequest({ id: 3, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([{ userId: 'user-1', plan: 'pro', days: 30 }])
  })
})

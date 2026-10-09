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

  it('đơn của tài khoản ĐÃ XOÁ (user_id null, changelog 0533) → log ORPHANED, không cấp gói, không update', async () => {
    query.mockResolvedValueOnce({ rows: [{ ...PENDING_PAYMENT, user_id: null }] })
    const resp = await handler(
      makeRequest({ id: 1, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(query).toHaveBeenCalledTimes(1)
    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith(
      'SEPAY_PAYMENT_ORPHANED',
      'sepay',
      expect.objectContaining({ paymentId: PENDING_PAYMENT.id }),
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

  it('đơn bị ẩn danh GIỮA select và update (chủ vừa xoá tài khoản) → log ORPHANED, không cấp gói, không PII', async () => {
    query
      .mockResolvedValueOnce({ rows: [PENDING_PAYMENT] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // `and user_id is not null` chặn update
      .mockResolvedValueOnce({ rows: [{ user_id: null }] }) // đọc lại: đơn đã mất chủ
    const resp = await handler(
      makeRequest({ id: 999, transferType: 'in', transferAmount: 40_000, content: 'ENVI7K2M9QRT' }),
    )
    expect(resp.status).toBe(200)
    expect(granted.calls).toEqual([])
    expect(vi.mocked(logSecurityEvent)).toHaveBeenCalledWith('SEPAY_PAYMENT_ORPHANED', 'sepay', {
      paymentId: PENDING_PAYMENT.id,
      txnId: '999',
      transferAmount: 40_000,
      stage: 'update',
    })
    const [recheckSql] = query.mock.calls[2] as [string]
    expect(recheckSql).toContain('select user_id from public.payments')
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

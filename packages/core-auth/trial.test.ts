// Test quà dùng thử Pro 14 ngày — trọng tâm: KHÔNG cấp được 2 lần (đây là chỗ đụng tiền API
// thật). Điều kiện "chỉ cấp khi đã xác thực" được test ở api/auth.test.ts (nơi quyết định KHI
// NÀO gọi hàm này) — file này chỉ test bản thân cơ chế cấp/chống cấp trùng.

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const granted: { calls: { userId: string; plan: string; days: number }[] } = { calls: [] }
vi.mock('@dhcb/core-billing/planGrant', () => ({
  grantPlanDays: async (userId: string, plan: string, days: number) => {
    granted.calls.push({ userId, plan, days })
    return { plan, planExpiresAt: new Date() }
  },
}))

// Sổ chống lạm dụng (0545) — logic tra đã test riêng ở core-billing/erasedBenefitLedger.test.ts.
const ledger = vi.hoisted(() => ({
  isBenefitBlocked: vi.fn<(...args: unknown[]) => Promise<boolean>>(),
}))
vi.mock('@dhcb/core-billing/erasedBenefitLedger', () => ledger)
const security = vi.hoisted(() => ({ logSecurityEvent: vi.fn() }))
vi.mock('./security.js', () => security)

import { grantSignupTrial, SIGNUP_TRIAL_DAYS } from './trial.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  query.mockReset()
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  granted.calls = []
  ledger.isBenefitBlocked.mockReset().mockResolvedValue(false)
  security.logSecurityEvent.mockReset()
})

describe('grantSignupTrial', () => {
  it('lần đầu → cấp đúng 14 ngày gói vip', async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [] })
    expect(await grantSignupTrial('u1')).toBe(true)
    expect(granted.calls).toEqual([{ userId: 'u1', plan: 'vip', days: SIGNUP_TRIAL_DAYS }])
  })

  it('đã nhận trước đó (rowCount = 0) → KHÔNG cấp lần 2', async () => {
    query.mockResolvedValueOnce({ rowCount: 0, rows: [] })
    expect(await grantSignupTrial('u1')).toBe(false)
    expect(granted.calls).toEqual([])
  })

  it('lỗi DB → trả false, KHÔNG ném lỗi ra ngoài (không phá luồng xác thực/đăng nhập)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    query.mockRejectedValueOnce(new Error('db down'))
    expect(await grantSignupTrial('u1')).toBe(false)
    expect(granted.calls).toEqual([])
    spy.mockRestore()
  })

  it('dùng cột signup_trial_granted_at để giành quyền nhận 1 lần', async () => {
    query.mockResolvedValueOnce({ rowCount: 1, rows: [] })
    await grantSignupTrial('u1')
    const sql = query.mock.calls[0]?.[0] as string
    expect(sql).toContain('signup_trial_granted_at')
  })

  it('0545: email trùng tài khoản đã xoá từng nhận dùng thử ⇒ KHÔNG cấp, không giành dấu, log không PII', async () => {
    ledger.isBenefitBlocked.mockResolvedValueOnce(true)
    expect(await grantSignupTrial('u1')).toBe(false)
    expect(granted.calls).toEqual([])
    expect(query).not.toHaveBeenCalled()
    expect(ledger.isBenefitBlocked.mock.calls[0]?.slice(1)).toEqual(['u1', 'signup_trial'])
    expect(security.logSecurityEvent).toHaveBeenCalledWith(
      'SIGNUP_TRIAL_REPEAT_AFTER_ERASURE',
      'system',
      { benefit: 'signup_trial' },
    )
  })

  it('0545: tra sổ lỗi ⇒ false, không ném (không phá đăng ký)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ledger.isBenefitBlocked.mockRejectedValueOnce(new Error('db down'))
    expect(await grantSignupTrial('u1')).toBe(false)
    expect(granted.calls).toEqual([])
    spy.mockRestore()
  })
})

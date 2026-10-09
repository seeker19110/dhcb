// Test mời bạn — tập trung vào CHỐNG GIAN LẬN, vì thưởng ở đây là tiền API thật:
//  1. Không tự mời chính mình.
//  2. Mã không tồn tại → từ chối.
//  3. 1 người chỉ được ghi nhận lời mời 1 lần (không đổi được người mời).
//  4. CHƯA xác thực email → KHÔNG thưởng (hàng rào chính chống email giả).
//  5. Đã thưởng rồi → không thưởng lần 2 (chống race + gọi lặp).
//  6. Thiết bị đã được thưởng lượt khác → không thưởng, nhưng KHÔNG khoá tài khoản.
//  7. Vượt trần 10 lượt → người MỜI hết được thưởng, người ĐƯỢC MỜI vẫn được.
//  8. Sổ chống lạm dụng (0545): người được mời trùng tài khoản đã xoá từng được thưởng → không
//     thưởng; lượt thưởng của tài khoản cũ cùng email tính vào trần người mời; người mời đã xoá
//     (referrer_id null) → chỉ người được mời nhận.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Pool, Client, type PoolClient } from 'pg'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const security = vi.hoisted(() => ({ logSecurityEvent: vi.fn() }))
vi.mock('@dhcb/core-auth/security', () => security)
const ledger = vi.hoisted(() => ({
  isBenefitBlocked: vi.fn<(...args: unknown[]) => Promise<boolean>>(),
  erasedBenefitUnits: vi.fn<(...args: unknown[]) => Promise<number>>(),
}))
vi.mock('@dhcb/core-billing/erasedBenefitLedger', () => ledger)
const granted: { calls: { userId: string; days: number }[] } = { calls: [] }
vi.mock('@dhcb/core-billing/planGrant', () => ({
  grantPlanDays: vi.fn(async (userId: string, _plan: string, days: number) => {
    granted.calls.push({ userId, days })
    return { plan: 'vip', planExpiresAt: new Date() }
  }),
}))

import {
  claimReferral,
  rewardReferralIfEligible,
  ensureReferralCode,
  getReferralStats,
  MAX_REWARDED_REFERRALS,
  REFERRAL_REWARD_DAYS,
} from './referral'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ rows: [], rowCount: 0 })
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  granted.calls = []
  security.logSecurityEvent.mockReset()
  ledger.isBenefitBlocked.mockReset().mockResolvedValue(false)
  ledger.erasedBenefitUnits.mockReset().mockResolvedValue(0)
})

describe('claimReferral', () => {
  it('mã không tồn tại → từ chối', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await claimReferral('u2', 'ABC123')).toEqual({ ok: false, reason: 'code_not_found' })
  })

  it('tự mời chính mình → từ chối', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
    expect(await claimReferral('u1', 'ABC123')).toEqual({ ok: false, reason: 'self_invite' })
  })

  it('đã có người mời trước đó → KHÔNG ghi đè (không đổi được người mời)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
    expect(await claimReferral('u2', 'ABC123')).toEqual({ ok: false, reason: 'already_referred' })
  })

  it('hợp lệ → ghi nhận lời mời, chuẩn hoá mã về chữ HOA', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
    expect(await claimReferral('u2', ' abc123 ')).toEqual({ ok: true })
    expect(query.mock.calls[0]?.[1]).toEqual(['ABC123'])
  })

  it('lưu kèm dấu vân tay thiết bị khi có', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
    await claimReferral('u2', 'ABC123', 'a'.repeat(64))
    expect((query.mock.calls[1]?.[1] as unknown[])[2]).toBe('a'.repeat(64))
  })
})

// Fake DB giữ khoá tới commit/rollback, cô lập thay đổi để kiểm nguyên tử và race thật sự.
describe('rewardReferralIfEligible — bằng chứng, nguyên tử và đồng thời', () => {
  type Referral = {
    referrer_id: string | null
    device_hash: string | null
    rewarded_at: Date | null
    reward_blocked_at?: Date | null
  }
  const referrals = new Map<string, Referral>()
  const balances = new Map<string, number>()
  const locks = new Map<string, Promise<void>>()
  const states = new Map<
    unknown,
    {
      days: Map<string, number>
      reward: string | null
      blocked: string | null
      acquire: (key: string) => Promise<void>
      recipients: string[]
    }
  >()
  let verified: boolean
  let graded: boolean
  let cefrPassed: boolean
  let failGrantFor: string | null
  let failCommit: boolean
  let clients: PoolClient[]

  beforeEach(() => {
    referrals.clear()
    balances.clear()
    locks.clear()
    states.clear()
    verified = true
    graded = true
    cefrPassed = false
    failGrantFor = null
    failCommit = false
    clients = []
    referrals.set('u2', { referrer_id: 'u1', device_hash: null, rewarded_at: null })
    const connect = vi.fn(async () => {
      const releases: (() => void)[] = []
      const held = new Set<string>()
      const acquire = async (key: string) => {
        if (held.has(key)) return
        const previous = locks.get(key) ?? Promise.resolve()
        locks.set(
          key,
          new Promise<void>((resolve) => {
            releases.push(resolve)
          }),
        )
        await previous
        held.add(key)
      }
      const finish = () => releases.splice(0).forEach((release) => release())
      const state = {
        days: new Map<string, number>(),
        reward: null as string | null,
        blocked: null as string | null,
        acquire,
        recipients: [] as string[],
      }
      const transactionQuery = vi.fn(async (sql: string, params: unknown[] = []) => {
        if (sql === 'begin') return { rows: [] }
        if (sql === 'rollback') {
          finish()
          return { rows: [] }
        }
        if (sql === 'commit') {
          if (failCommit) {
            failCommit = false
            throw new Error('commit failed')
          }
          state.days.forEach((days, id) => balances.set(id, (balances.get(id) ?? 0) + days))
          if (state.reward) referrals.get(state.reward)!.rewarded_at = new Date()
          if (state.blocked) referrals.get(state.blocked)!.reward_blocked_at = new Date()
          finish()
          return { rows: [] }
        }
        if (sql.includes('select email_verified'))
          return { rows: [{ email_verified: verified ? new Date() : null }] }
        if (sql.includes('platform.completion_evidence')) {
          expect(sql).toContain("evidence_kind = 'server_graded'")
          expect(sql).toContain("activity_kind = 'stem_lesson_check'")
          expect(sql).toContain('passed = true and total > 0')
          return { rows: [{ eligible: graded }] }
        }
        if (sql.includes('platform.feature_state'))
          return {
            rows: [
              {
                cefr_exams: cefrPassed
                  ? { A1: { passed: true, bestPct: 80, attempts: 1, lastAt: '2026-09-27' } }
                  : {},
              },
            ],
          }
        if (sql.includes('for update')) {
          await acquire(`row:${String(params[0])}`)
          const referral = referrals.get(String(params[0]))
          return { rows: referral ? [{ ...referral }] : [] }
        }
        if (sql.includes('pg_advisory_xact_lock')) {
          await acquire(String(params[0]))
          return { rows: [] }
        }
        if (sql.includes('device_hash = $1')) {
          expect(held.has(`referral:device:${String(params[0])}`)).toBe(true)
          return {
            rows: [
              {
                count: String(
                  [...referrals].filter(
                    ([id, row]) =>
                      id !== params[1] && row.device_hash === params[0] && row.rewarded_at,
                  ).length,
                ),
              },
            ],
          }
        }
        if (sql.includes('count(*)')) {
          expect(held.has(`referral:referrer:${String(params[0])}`)).toBe(true)
          return {
            rows: [
              {
                count: String(
                  [...referrals.values()].filter(
                    (row) => row.referrer_id === params[0] && row.rewarded_at,
                  ).length,
                ),
              },
            ],
          }
        }
        if (sql.startsWith('update public.referrals set reward_blocked_at')) {
          state.blocked = String(params[0])
          return { rows: [], rowCount: 1 }
        }
        if (sql.startsWith('update public.referrals')) {
          state.reward = String(params[0])
          return { rows: [], rowCount: 1 }
        }
        throw new Error(`Unexpected SQL: ${sql}`)
      })
      const client = Object.assign(new Client(), {
        query: transactionQuery,
        release: vi.fn(finish),
      })
      states.set(client, state)
      clients.push(client)
      return client
    })
    mockedGetPool.mockReturnValue(Object.assign(new Pool(), { query, connect }))
    vi.mocked(grantPlanDays).mockReset()
    vi.mocked(grantPlanDays).mockImplementation(async (userId, _plan, days, _now, client) => {
      const state = states.get(client)
      expect(state).toBeDefined() // Bắt mọi lần cấp ngoài transaction.
      if (!state) throw new Error('grant outside transaction')
      state.recipients.push(userId)
      expect(state.recipients).toEqual([...state.recipients].sort())
      await state.acquire(`profile:${userId}`)
      if (failGrantFor === userId) {
        failGrantFor = null
        throw new Error('grant failed')
      }
      state.days.set(userId, (state.days.get(userId) ?? 0) + days)
      return { plan: 'vip', planExpiresAt: new Date() }
    })
  })

  it('chưa xác minh email không thưởng dù bài đã được server chấm', async () => {
    verified = false
    await rewardReferralIfEligible('u2')
    expect(balances.size).toBe(0)
    expect(referrals.get('u2')?.rewarded_at).toBeNull()
  })

  it('chỉ có lịch sử tự khai / bài chưa đạt thì không thưởng', async () => {
    graded = false
    await rewardReferralIfEligible('u2')
    expect(balances.size).toBe(0)
    expect(referrals.get('u2')?.rewarded_at).toBeNull()
    expect(query).not.toHaveBeenCalled() // Tất cả đọc/ghi dùng client giao dịch.
  })

  it('CEFR được server xác minh cũng đủ bằng chứng', async () => {
    graded = false
    cefrPassed = true
    await rewardReferralIfEligible('u2')
    expect(balances.get('u1')).toBe(REFERRAL_REWARD_DAYS)
    expect(balances.get('u2')).toBe(REFERRAL_REWARD_DAYS)
  })

  it('không có lời mời thì không thưởng', async () => {
    referrals.clear()
    await rewardReferralIfEligible('u2')
    expect(balances.size).toBe(0)
  })

  it('hai lần hoàn thành đồng thời và retry chỉ cấp mỗi bên một lần', async () => {
    await Promise.all([rewardReferralIfEligible('u2'), rewardReferralIfEligible('u2')])
    await rewardReferralIfEligible('u2')
    expect(balances.get('u1')).toBe(REFERRAL_REWARD_DAYS)
    expect(balances.get('u2')).toBe(REFERRAL_REWARD_DAYS)
    expect(referrals.get('u2')?.rewarded_at).toBeInstanceOf(Date)
    expect(clients.every((client) => vi.mocked(client.release).mock.calls.length === 1)).toBe(true)
  })

  it.each(['u1', 'u2', 'commit'])(
    'lỗi %s rollback cả hai gói và rewarded_at; retry khôi phục đủ',
    async (failedStep) => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        failGrantFor = failedStep === 'commit' ? null : failedStep
        failCommit = failedStep === 'commit'
        await rewardReferralIfEligible('u2')
        expect(balances.size).toBe(0)
        expect(referrals.get('u2')?.rewarded_at).toBeNull()
        await rewardReferralIfEligible('u2')
        expect(balances.get('u1')).toBe(REFERRAL_REWARD_DAYS)
        expect(balances.get('u2')).toBe(REFERRAL_REWARD_DAYS)
      } finally {
        spy.mockRestore()
      }
    },
  )

  it('cùng thiết bị, khác người mời, chạy đồng thời vẫn chỉ một lượt thưởng', async () => {
    referrals.get('u2')!.device_hash = 'shared-device'
    referrals.set('u4', { referrer_id: 'u3', device_hash: 'shared-device', rewarded_at: null })
    await Promise.all([rewardReferralIfEligible('u2'), rewardReferralIfEligible('u4')])
    expect([...referrals.values()].filter((row) => row.rewarded_at)).toHaveLength(1)
    expect([...balances.values()].reduce((a, b) => a + b, 0)).toBe(2 * REFERRAL_REWARD_DAYS)
  })

  it('hai lượt đồng thời ở sát trần chỉ cộng người mời đúng một lần', async () => {
    for (let i = 0; i < MAX_REWARDED_REFERRALS - 1; i++) {
      referrals.set(`old-${i}`, { referrer_id: 'u1', device_hash: null, rewarded_at: new Date() })
    }
    referrals.set('u3', { referrer_id: 'u1', device_hash: null, rewarded_at: null })
    await Promise.all([rewardReferralIfEligible('u2'), rewardReferralIfEligible('u3')])
    expect(balances.get('u1')).toBe(REFERRAL_REWARD_DAYS)
    expect(balances.get('u2')).toBe(REFERRAL_REWARD_DAYS)
    expect(balances.get('u3')).toBe(REFERRAL_REWARD_DAYS)
  })

  it('0545: người được mời trùng tài khoản đã xoá từng được thưởng ⇒ không thưởng ai, log không PII', async () => {
    referrals.get('u2')!.device_hash = 'dev-u2'
    ledger.isBenefitBlocked.mockResolvedValue(true)
    await rewardReferralIfEligible('u2')
    expect(balances.size).toBe(0)
    expect(referrals.get('u2')?.rewarded_at).toBeNull()
    // Đánh dấu bị chặn ⇒ không còn "chờ"; lần chấm bài sau không tra sổ lại.
    expect(referrals.get('u2')?.reward_blocked_at).toBeInstanceOf(Date)
    await rewardReferralIfEligible('u2')
    expect(ledger.isBenefitBlocked).toHaveBeenCalledOnce()
    expect(balances.size).toBe(0)
    const [db, userId, benefit, devices] = ledger.isBenefitBlocked.mock.calls[0] ?? []
    expect(clients).toContain(db) // tra trong CHÍNH transaction thưởng
    expect([userId, benefit, devices]).toEqual(['u2', 'referral_referee', ['dev-u2']])
    expect(security.logSecurityEvent).toHaveBeenCalledWith(
      'REFERRAL_REPEAT_AFTER_ERASURE',
      'system',
      { benefit: 'referral_referee' },
    )
  })

  it('0545: lượt thưởng của tài khoản cũ cùng email tính vào trần ⇒ người mời không được thêm', async () => {
    referrals.set('old-0', { referrer_id: 'u1', device_hash: null, rewarded_at: new Date() })
    ledger.erasedBenefitUnits.mockResolvedValue(MAX_REWARDED_REFERRALS - 1)
    await rewardReferralIfEligible('u2')
    expect(balances.get('u1')).toBeUndefined()
    expect(balances.get('u2')).toBe(REFERRAL_REWARD_DAYS)
    expect(ledger.erasedBenefitUnits.mock.calls[0]?.slice(1)).toEqual(['u1', 'referral_referrer'])
  })

  it('0545: dưới trần sau khi cộng sổ ⇒ người mời vẫn được thưởng', async () => {
    ledger.erasedBenefitUnits.mockResolvedValue(MAX_REWARDED_REFERRALS - 1)
    await rewardReferralIfEligible('u2')
    expect(balances.get('u1')).toBe(REFERRAL_REWARD_DAYS)
    expect(balances.get('u2')).toBe(REFERRAL_REWARD_DAYS)
  })

  it('0545: người mời đã xoá tài khoản (referrer_id null) ⇒ chỉ người được mời nhận', async () => {
    referrals.get('u2')!.referrer_id = null
    await rewardReferralIfEligible('u2')
    expect([...balances]).toEqual([['u2', REFERRAL_REWARD_DAYS]])
    expect(referrals.get('u2')?.rewarded_at).toBeInstanceOf(Date)
    expect(ledger.erasedBenefitUnits).not.toHaveBeenCalled()
  })

  it('mời chéo khóa profile cùng thứ tự ID và hoàn thành cả hai giao dịch', async () => {
    referrals.set('u1', { referrer_id: 'u2', device_hash: null, rewarded_at: null })
    await Promise.all([rewardReferralIfEligible('u1'), rewardReferralIfEligible('u2')])
    expect(balances.get('u1')).toBe(2 * REFERRAL_REWARD_DAYS)
    expect(balances.get('u2')).toBe(2 * REFERRAL_REWARD_DAYS)
  })
})

describe('claimReferral — hàng rào DB (check_violation)', () => {
  it('DB ném lỗi check_violation (23514) → coi như tự mời chính mình', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockRejectedValueOnce(Object.assign(new Error('check violation'), { code: '23514' }))
    expect(await claimReferral('u2', 'ABC123')).toEqual({ ok: false, reason: 'self_invite' })
  })

  it('DB ném lỗi khác (không phải 23514) → ném ra ngoài', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] }).mockRejectedValueOnce(new Error('lỗi lạ'))
    await expect(claimReferral('u2', 'ABC123')).rejects.toThrow('lỗi lạ')
  })
})

describe('ensureReferralCode', () => {
  it('user đã có mã → trả về luôn, không sinh mới', async () => {
    query.mockResolvedValueOnce({ rows: [{ referral_code: 'ABCDEF' }] })
    expect(await ensureReferralCode('u1')).toBe('ABCDEF')
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('chưa có mã → sinh mới và ghi thành công', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ referral_code: null }] })
      .mockResolvedValueOnce({ rows: [{ referral_code: 'XYZ123' }] })
    const code = await ensureReferralCode('u1')
    expect(code).toBe('XYZ123')
  })

  it('mã đầu trùng (unique_violation) → thử mã khác rồi thành công', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ referral_code: null }] })
      .mockRejectedValueOnce(Object.assign(new Error('trùng'), { code: '23505' }))
      .mockResolvedValueOnce({ rows: [{ referral_code: 'RETRY1' }] })
    const code = await ensureReferralCode('u1')
    expect(code).toBe('RETRY1')
  })

  it('insert không trả dòng (request song song vừa ghi) → đọc lại thấy mã đã có', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ referral_code: null }] })
      .mockResolvedValueOnce({ rows: [] }) // insert không update được dòng nào
      .mockResolvedValueOnce({ rows: [{ referral_code: 'RACE01' }] }) // đọc lại
    const code = await ensureReferralCode('u1')
    expect(code).toBe('RACE01')
  })

  it('lỗi khác unique_violation khi insert → ném ra ngoài', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ referral_code: null }] })
      .mockRejectedValueOnce(new Error('lỗi lạ'))
    await expect(ensureReferralCode('u1')).rejects.toThrow('lỗi lạ')
  })

  it('trùng mã liên tục vượt quá số lần thử tối đa → ném lỗi', async () => {
    query.mockResolvedValueOnce({ rows: [{ referral_code: null }] })
    // Mọi lần insert đều đụng unique_violation.
    query.mockRejectedValue(Object.assign(new Error('trùng'), { code: '23505' }))
    await expect(ensureReferralCode('u1')).rejects.toThrow(
      'Không sinh được mã mời sau nhiều lần thử',
    )
  })
})

describe('getReferralStats', () => {
  it('trả về đủ thống kê: mã, số đã thưởng, số đang chờ, trần, số ngày thưởng', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ referral_code: 'ABCDEF' }] }) // ensureReferralCode
      .mockResolvedValueOnce({ rows: [{ rewarded: '3', pending: '2' }] })
    ledger.erasedBenefitUnits.mockResolvedValueOnce(1) // 1 lượt của người được mời đã xoá (0545)
    const stats = await getReferralStats('u1')
    const statsSql = query.mock.calls[1]?.[0] as string
    expect(statsSql).toContain('rewarded_at is null and reward_blocked_at is null')
    expect(stats).toEqual({
      code: 'ABCDEF',
      rewardedCount: 4,
      pendingCount: 2,
      maxRewarded: MAX_REWARDED_REFERRALS,
      rewardDays: REFERRAL_REWARD_DAYS,
    })
  })
})

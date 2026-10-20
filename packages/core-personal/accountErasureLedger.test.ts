// accountErasureLedger.test.ts — Audit 2026-10-20, D-6: sổ chống lạm dụng sau xoá tài khoản
// (changelog 0545) là thứ giữ "đã nhận lượt thử / thưởng mời" sống sót sau khi xoá. Nhánh
// `rows[0]` không có hoặc cột null (`?? []`, `?? 0`) chưa từng được phủ — sai ở đây là xoá
// tài khoản rồi đăng ký lại nhận lượt thử lần hai.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PoolClient } from 'pg'

const ledger = vi.hoisted(() => ({
  readLedgerKey: vi.fn(),
  recordErasedBenefits: vi.fn(),
}))
vi.mock('@dhcb/core-billing/erasedBenefitLedger', () => ({
  readLedgerKey: (...a: unknown[]) => ledger.readLedgerKey(...a),
  recordErasedBenefits: (...a: unknown[]) => ledger.recordErasedBenefits(...a),
}))

import { readErasedAccountFacts, recordErasedBenefitsForAccount } from './accountErasureLedger.js'

const query = vi.fn()
const client = { query } as unknown as PoolClient
const EMPTY = {
  emails: [],
  refereeDeviceHashes: [],
  signupTrialTaken: false,
  refereeRewarded: false,
  referrerRewardedCount: 0,
  rewardedReferrerEmails: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  ledger.recordErasedBenefits.mockResolvedValue({ status: 'recorded', count: 0 })
})

describe('readErasedAccountFacts — null vs 0, ca rỗng', () => {
  it('không có dòng nào → mọi mảng rỗng, đếm = 0, cờ = false (không phải undefined/NaN)', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await readErasedAccountFacts(client, 'u1')).toEqual(EMPTY)
    expect(query).toHaveBeenCalledWith(expect.stringContaining('from public.users where id = $1'), [
      'u1',
    ])
  })

  it('cột mảng null (Postgres trả array rỗng thành null qua driver cũ) → [] ; count null → 0', async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          emails: null,
          signup_trial_taken: false,
          referee_device_hashes: null,
          referee_rewarded: false,
          referrer_rewarded_count: null,
          rewarded_referrer_emails: null,
        },
      ],
    })
    expect(await readErasedAccountFacts(client, 'u1')).toEqual(EMPTY)
  })

  it('count về dạng CHUỖI "3" (bigint) → số 3; cờ chỉ true khi đúng boolean true', async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          emails: ['a@x.vn'],
          signup_trial_taken: true,
          referee_device_hashes: ['h1'],
          referee_rewarded: 'true', // chuỗi, KHÔNG phải boolean → phải là false
          referrer_rewarded_count: '3',
          rewarded_referrer_emails: ['b@x.vn'],
        },
      ],
    })
    expect(await readErasedAccountFacts(client, 'u1')).toEqual({
      emails: ['a@x.vn'],
      refereeDeviceHashes: ['h1'],
      signupTrialTaken: true,
      refereeRewarded: false,
      referrerRewardedCount: 3,
      rewardedReferrerEmails: ['b@x.vn'],
    })
  })
})

describe('recordErasedBenefitsForAccount — sổ tắt vs sổ bật', () => {
  it('thiếu khoá sổ → KHÔNG đọc DB, ghi với facts rỗng (chỉ log "sổ tắt")', async () => {
    ledger.readLedgerKey.mockReturnValue({ status: 'missing' })
    await recordErasedBenefitsForAccount(client, 'u1', {})
    expect(query).not.toHaveBeenCalled()
    expect(ledger.recordErasedBenefits).toHaveBeenCalledWith(client, EMPTY, {})
  })

  it('có khoá → đọc sự thật rồi ghi sổ trong CÙNG client (transaction của luồng xoá)', async () => {
    ledger.readLedgerKey.mockReturnValue({ status: 'ok', key: Buffer.alloc(32) })
    query.mockResolvedValueOnce({ rows: [] })
    await recordErasedBenefitsForAccount(client, 'u1', { ERASED_BENEFIT_LEDGER_KEY: 'x' })
    expect(query).toHaveBeenCalledTimes(1)
    expect(ledger.recordErasedBenefits).toHaveBeenCalledWith(client, EMPTY, {
      ERASED_BENEFIT_LEDGER_KEY: 'x',
    })
  })

  it('đọc sự thật lỗi CSDL → NÉM (để transaction xoá rollback), không nuốt', async () => {
    ledger.readLedgerKey.mockReturnValue({ status: 'ok', key: Buffer.alloc(32) })
    query.mockRejectedValueOnce(new Error('db down'))
    await expect(recordErasedBenefitsForAccount(client, 'u1', {})).rejects.toThrow('db down')
    expect(ledger.recordErasedBenefits).not.toHaveBeenCalled()
  })
})

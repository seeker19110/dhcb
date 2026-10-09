// Test sổ chống lạm dụng sau khi xoá tài khoản (changelog 0545). Phần chạy trên Postgres thật nằm ở
// packages/core-personal/accountErasureService.integration.test.ts.

import { createHash, createHmac } from 'node:crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ERASED_BENEFIT_LEDGER_KEY_ENV,
  ERASED_BENEFIT_RETENTION_MONTHS,
  buildLedgerEntries,
  erasedBenefitUnits,
  hashSubjects,
  isBenefitBlocked,
  ledgerConfigProblem,
  ledgerSubjectHash,
  normalizeEmailForLedger,
  purgeExpiredErasedBenefits,
  readLedgerKey,
  recordErasedBenefits,
  resetLedgerWarningForTest,
  type ErasedAccountFacts,
} from './erasedBenefitLedger.js'

const KEY_B64 = Buffer.alloc(32, 9).toString('base64')
const ENV_OK = { [ERASED_BENEFIT_LEDGER_KEY_ENV]: KEY_B64 } as NodeJS.ProcessEnv
const ENV_NONE = {} as NodeJS.ProcessEnv
const KEY = Buffer.alloc(32, 9)
const DEVICE = 'a'.repeat(64)

function fakeDb(rows: unknown[] = [], rowCount: number | null = 0) {
  const query = vi.fn(async () => ({ rows, rowCount }))
  return { db: { query } as never, query }
}

beforeEach(() => {
  resetLedgerWarningForTest()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('readLedgerKey / ledgerConfigProblem', () => {
  it('khoá hợp lệ ≥ 32 byte base64 ⇒ ok', () => {
    const s = readLedgerKey(ENV_OK)
    expect(s.status).toBe('ok')
    expect(s.status === 'ok' ? s.key.length : 0).toBe(32)
    expect(ledgerConfigProblem({ ...ENV_OK, NODE_ENV: 'production' })).toBeNull()
  })

  it.each([
    ['ngắn hơn 32 byte', Buffer.alloc(16, 1).toString('base64')],
    ['không phải base64', 'đây-không-phải-base64!!'],
    ['giữ chỗ trong .env.example', '...'],
  ])('%s ⇒ invalid, báo lỗi ở MỌI môi trường', (_label, value) => {
    const env = { [ERASED_BENEFIT_LEDGER_KEY_ENV]: value } as NodeJS.ProcessEnv
    expect(readLedgerKey(env).status).toBe('invalid')
    expect(ledgerConfigProblem(env)).toMatch(/sai định dạng/)
  })

  it('thiếu khoá: missing; chỉ báo lỗi khi production', () => {
    expect(readLedgerKey(ENV_NONE).status).toBe('missing')
    expect(readLedgerKey({ [ERASED_BENEFIT_LEDGER_KEY_ENV]: '   ' }).status).toBe('missing')
    expect(ledgerConfigProblem({ NODE_ENV: 'development' })).toBeNull()
    expect(ledgerConfigProblem({ NODE_ENV: 'production' })).toMatch(/chưa cấu hình/)
  })
})

describe('normalizeEmailForLedger', () => {
  it.each([
    ['  Nguyen.Van.A@Gmail.com ', 'nguyenvana@gmail.com'],
    ['nguyen.van.a+trial2@googlemail.com', 'nguyenvana@gmail.com'],
    ['a.b+x@outlook.com', 'a.b@outlook.com'], // miền khác: GIỮ dấu chấm, bỏ +nhãn
    ['A.B@Example.VN', 'a.b@example.vn'],
    ['+only@example.com', '+only@example.com'], // phần tên chỉ có +nhãn: giữ nguyên
    ['khong-co-a-cong', 'khong-co-a-cong'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeEmailForLedger(input)).toBe(expected)
  })
})

describe('ledgerSubjectHash / hashSubjects', () => {
  it('HMAC có khoá + tiền tố miền: KHÁC sha256 trần, khác theo khoá và theo loại chủ thể', () => {
    const h = ledgerSubjectHash(KEY, 'email', 'a@gmail.com')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).toBe(
      createHmac('sha256', KEY).update('dhcb:erased-benefit:v1:email:a@gmail.com').digest('hex'),
    )
    expect(h).not.toBe(createHash('sha256').update('a@gmail.com').digest('hex'))
    expect(ledgerSubjectHash(Buffer.alloc(32, 1), 'email', 'a@gmail.com')).not.toBe(h)
    expect(ledgerSubjectHash(KEY, 'device', 'a@gmail.com')).not.toBe(h)
  })

  it('biến thể cùng hộp thư ra cùng mã (bỏ trùng); mã thiết bị sai định dạng bị bỏ qua', () => {
    const subjects = hashSubjects(
      KEY,
      ['A.B@gmail.com', 'ab+x@googlemail.com', '', '  '],
      [DEVICE, DEVICE.toUpperCase(), 'khong-hop-le'],
    )
    expect(subjects.map((s) => s.kind)).toEqual(['email', 'device'])
  })
})

const FACTS: ErasedAccountFacts = {
  emails: ['nguoi.dung@gmail.com', 'nguoidung@googlemail.com', 'khac@example.vn'],
  refereeDeviceHashes: [DEVICE],
  signupTrialTaken: true,
  refereeRewarded: true,
  referrerRewardedCount: 4,
}

describe('buildLedgerEntries', () => {
  it('dùng thử: chỉ email; được mời: email + thiết bị; người mời: email kèm số lượt', () => {
    const entries = buildLedgerEntries(KEY, FACTS)
    const by = (b: string) => entries.filter((e) => e.benefit === b)
    // 2 email riêng biệt (hai biến thể gmail gộp một).
    expect(by('signup_trial').map((e) => e.subjectKind)).toEqual(['email', 'email'])
    expect(
      by('referral_referee')
        .map((e) => e.subjectKind)
        .sort(),
    ).toEqual(['device', 'email', 'email'])
    expect(by('referral_referrer').map((e) => e.units)).toEqual([4, 4])
    // Không lọt plaintext.
    const json = JSON.stringify(entries)
    for (const raw of [...FACTS.emails, DEVICE, 'nguoidung@gmail.com'])
      expect(json).not.toContain(raw)
  })

  it('không hưởng gì ⇒ không ghi dòng nào', () => {
    expect(
      buildLedgerEntries(KEY, {
        ...FACTS,
        signupTrialTaken: false,
        refereeRewarded: false,
        referrerRewardedCount: 0,
      }),
    ).toEqual([])
  })
})

describe('recordErasedBenefits', () => {
  it('sổ tắt (thiếu khoá) ⇒ KHÔNG chạy câu nào, không ghi mã băm yếu thay thế', async () => {
    const { db, query } = fakeDb()
    expect(await recordErasedBenefits(db, FACTS, ENV_NONE)).toEqual({ status: 'disabled' })
    expect(query).not.toHaveBeenCalled()
  })

  it('khoá hỏng ⇒ cũng tắt', async () => {
    const { db, query } = fakeDb()
    const env = { [ERASED_BENEFIT_LEDGER_KEY_ENV]: 'abc' } as NodeJS.ProcessEnv
    expect(await recordErasedBenefits(db, FACTS, env)).toEqual({ status: 'disabled' })
    expect(query).not.toHaveBeenCalled()
  })

  it('có khoá ⇒ MỘT câu insert, tham số chỉ là mã băm hex', async () => {
    const { db, query } = fakeDb([], 7)
    const res = await recordErasedBenefits(db, FACTS, ENV_OK)
    expect(res).toEqual({ status: 'recorded', entries: 7 })
    expect(query).toHaveBeenCalledOnce()
    const [sql, params] = query.mock.calls[0] as unknown as [string, string[][]]
    expect(sql).toMatch(/insert into platform\.erased_benefit_ledger/)
    for (const h of params[1] ?? []) expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(params)).not.toContain('gmail')
  })

  it('không có gì để ghi ⇒ không chạy câu nào', async () => {
    const { db, query } = fakeDb()
    const res = await recordErasedBenefits(
      db,
      { ...FACTS, signupTrialTaken: false, refereeRewarded: false, referrerRewardedCount: 0 },
      ENV_OK,
    )
    expect(res).toEqual({ status: 'recorded', entries: 0 })
    expect(query).not.toHaveBeenCalled()
  })
})

describe('isBenefitBlocked / erasedBenefitUnits', () => {
  it('sổ tắt ⇒ false/0, không truy vấn, cảnh báo đúng một lần', async () => {
    const { db, query } = fakeDb()
    expect(await isBenefitBlocked(db, 'u1', 'signup_trial', [], ENV_NONE)).toBe(false)
    expect(await erasedBenefitUnits(db, 'u1', 'referral_referrer', ENV_NONE)).toBe(0)
    expect(query).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledOnce()
  })

  it('tra theo mã băm email của tài khoản + thiết bị, lọc hạn giữ', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ email: 'Nguoi.Dung+abc@gmail.com' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ blocked: true }], rowCount: 1 })
    const blocked = await isBenefitBlocked(
      { query } as never,
      'u1',
      'referral_referee',
      [DEVICE],
      ENV_OK,
    )
    expect(blocked).toBe(true)
    const [sql, params] = query.mock.calls[1] as [string, unknown[]]
    expect(sql).toMatch(/make_interval\(months => \$3::int\)/)
    expect(params[0]).toBe('referral_referee')
    expect(params[1]).toEqual([
      ledgerSubjectHash(KEY, 'email', 'nguoidung@gmail.com'),
      ledgerSubjectHash(KEY, 'device', DEVICE),
    ])
    expect(params[2]).toBe(ERASED_BENEFIT_RETENTION_MONTHS)
  })

  it('tài khoản không có email nào ⇒ false, không tra sổ', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [], rowCount: 0 })
    expect(await isBenefitBlocked({ query } as never, 'u1', 'signup_trial', [], ENV_OK)).toBe(false)
    expect(query).toHaveBeenCalledOnce()
  })

  it('erasedBenefitUnits đọc số (chuỗi/null đều an toàn)', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ email: 'a@example.vn' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ units: '6' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ email: 'a@example.vn' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ units: null }], rowCount: 1 })
    expect(await erasedBenefitUnits({ query } as never, 'u1', 'referral_referrer', ENV_OK)).toBe(6)
    expect(await erasedBenefitUnits({ query } as never, 'u1', 'referral_referrer', ENV_OK)).toBe(0)
  })
})

describe('purgeExpiredErasedBenefits', () => {
  it('xoá dòng quá 12 tháng, trả số dòng (null ⇒ 0)', async () => {
    const a = fakeDb([], 3)
    expect(await purgeExpiredErasedBenefits(a.db)).toEqual({ deleted: 3 })
    expect(a.query.mock.calls[0]).toEqual([
      expect.stringMatching(/delete from platform\.erased_benefit_ledger/),
      [12],
    ])
    const b = fakeDb([], null)
    expect(await purgeExpiredErasedBenefits(b.db, 6)).toEqual({ deleted: 0 })
  })
})

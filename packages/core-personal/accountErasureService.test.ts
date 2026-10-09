// packages/core-personal/accountErasureService.test.ts — unit (pg giả) cho xoá tài khoản + xuất
// dữ liệu (changelog 0533).
//
// Mock `pg` KHÔNG bắt được sai tên cột/thứ tự khoá ngoại — phần đó do
// `accountErasureService.integration.test.ts` canh trên Postgres thật. Ở đây canh LOGIC chạy được
// trong job `unit` của CI: transaction, thứ tự, uỷ Personal OS, không nuốt lỗi, đếm, nhật ký.

import { createHash } from 'node:crypto'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { ConflictError, NotFoundError } from '@dhcb/core-errors/appError'
import { SEPAY_LATE_GRACE_MS } from '@dhcb/core-billing/sepay'
import { PENDING_PAYMENT_MESSAGE, PendingPaymentError } from './accountErasureShared.js'
import { encryptUserField } from '@dhcb/core-config/userDataCrypto'
import {
  ACCOUNT_TABLES,
  EXPORT_NOTES,
  accountSubjectHash,
  deleteAccount,
  exportAccountData,
  hasLivePendingPayment,
} from './accountErasureService.js'
import { PERSON_TABLES } from './personErasureService.js'
import { ERASED_BENEFIT_LEDGER_KEY_ENV } from '@dhcb/core-billing/erasedBenefitLedger'

process.env.USER_DATA_MASTER_KEY ??= Buffer.alloc(32, 5).toString('base64')

const USER_ID = '00000000-0000-4000-8000-0000000000aa'
const EMAIL = 'nguoi.dung@example.test'
const PERSON_ID = '00000000-0000-4000-8000-0000000000bb'

type QueryResult = { rows: unknown[]; rowCount: number | null }
type Responder = (sql: string, params?: unknown[]) => Promise<QueryResult> | QueryResult

function norm(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase()
}

function makePool(respond: Responder) {
  const calls: { sql: string; params?: unknown[] }[] = []
  const client = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      const n = norm(sql)
      calls.push({ sql: n, params })
      return respond(n, params)
    }),
    release: vi.fn(),
  }
  const pool = {
    query: vi.fn(() => Promise.reject(new Error('không được gọi pool.query ngoài transaction'))),
    connect: vi.fn().mockResolvedValue(client),
  }
  return { pool, client, calls }
}

const one = (row: unknown): QueryResult => ({ rows: [row], rowCount: 1 })
const none: QueryResult = { rows: [], rowCount: 0 }

/** Trả lời "bình thường" cho luồng xoá: user có, Person có, mỗi câu xoá/ẩn danh chạm 2 dòng. */
function happyDelete(
  overrides: Partial<Record<'person' | 'userDelete' | 'log' | 'pendingPayment', QueryResult>> = {},
): Responder {
  return (sql) => {
    if (sql.startsWith('select id, email from public.users'))
      return one({ id: USER_ID, email: EMAIL })
    if (sql.startsWith('select 1 from public.payments')) return overrides.pendingPayment ?? none
    if (sql.startsWith('select id from personal.persons where user_id'))
      return overrides.person ?? one({ id: PERSON_ID })
    if (sql.startsWith('select id from personal.persons where id')) return one({ id: PERSON_ID })
    if (sql.startsWith('insert into platform.person_erasure_log')) return one({ id: 'plog-1' })
    if (sql.startsWith('delete from public.users'))
      return overrides.userDelete ?? { rows: [], rowCount: 1 }
    if (sql.startsWith('insert into platform.account_erasure_log'))
      return overrides.log ?? one({ id: 'alog-1', erased_at: new Date('2026-10-08T10:00:00Z') })
    // Câu của personErasureService (theo person_id / id) — 1 dòng mỗi bảng. Hai bảng personal.*
    // theo user_id (intake, learner_intent) thuộc ACCOUNT_TABLES ⇒ rơi xuống nhánh 2 dòng dưới.
    if (
      (sql.startsWith('delete from personal.') || sql.startsWith('delete from worklife.')) &&
      !sql.includes('user_id')
    )
      return { rows: [], rowCount: 1 }
    if (sql.startsWith('delete from') || sql.startsWith('update')) return { rows: [], rowCount: 2 }
    return none
  }
}

describe('ACCOUNT_TABLES', () => {
  it('mỗi (bảng, cột) và mỗi khoá xuất là duy nhất', () => {
    const refs = ACCOUNT_TABLES.map((s) => `${s.table}.${s.userColumn}`)
    const keys = ACCOUNT_TABLES.map((s) => s.exportKey)
    expect(new Set(refs).size).toBe(refs.length)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('không xuất cột bí mật xác thực / ghi chú nội bộ / id người khác', () => {
    const exported = ACCOUNT_TABLES.flatMap((s) => s.columns.map((c) => `${s.table}.${c}`))
    for (const banned of [
      'public.sessions.session_token',
      'public.user_2fa.secret',
      'public.user_2fa.last_used_step',
      'public.user_2fa_recovery_codes.code_hash',
      'public.password_resets.token_hash',
      'public.email_verifications.code_hash',
      'public.push_subscriptions.endpoint',
      'public.push_subscriptions.p256dh',
      'public.push_subscriptions.auth_key',
      'location.sessions.invite_code',
      'public.companion_invites.code',
      'public.user_feedback.admin_notes',
      'public.referrals.device_hash',
      'public.referrals.referee_id',
      'public.friendships.user_id_b',
      'public.companion_links.watcher_id',
    ])
      expect(exported, banned).not.toContain(banned)
  })

  it('chứng từ thanh toán CHỈ ẩn danh hoá, không bao giờ xoá', () => {
    const pay = ACCOUNT_TABLES.find((s) => s.table === 'public.payments')
    expect(pay?.erase.kind).toBe('anonymize')
    expect(pay?.erase.kind === 'anonymize' ? pay.erase.setSql : '').toMatch(
      /anonymized_at = now\(\)/,
    )
  })

  it('thứ tự: vị trí/thành viên/nhật ký chuyến đi trước chuyến đi', () => {
    const idx = (t: string) => ACCOUNT_TABLES.findIndex((s) => s.table === t)
    for (const child of ['location.positions', 'location.consent_log', 'location.session_members'])
      expect(idx(child)).toBeLessThan(idx('location.sessions'))
  })
})

describe('accountSubjectHash', () => {
  it('64 ký tự hex, tất định, KHÁC sha256 trần của user_id (có tiền tố miền)', () => {
    const h = accountSubjectHash(USER_ID)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(accountSubjectHash(USER_ID)).toBe(h)
    expect(h).not.toBe(createHash('sha256').update(USER_ID).digest('hex'))
    expect(accountSubjectHash('00000000-0000-4000-8000-0000000000ab')).not.toBe(h)
  })
})

describe('deleteAccount', () => {
  it('một transaction: khoá users trước tiên, chạy đúng thứ tự khai báo, Personal OS, users, nhật ký, commit', async () => {
    const { pool, client, calls } = makePool(happyDelete())
    const res = await deleteAccount(pool as never, USER_ID)

    expect(calls[0]?.sql).toBe('begin')
    expect(calls[1]?.sql).toBe('select id, email from public.users where id = $1 for update')
    // Kiểm đơn chờ trả NGAY SAU khoá users (rà soát 0533), trước mọi câu xoá.
    expect(calls[2]?.sql).toContain('select 1 from public.payments')
    expect(calls[2]?.params).toEqual([USER_ID, SEPAY_LATE_GRACE_MS / 1000])
    expect(calls.at(-1)?.sql).toBe('commit')
    expect(client.release).toHaveBeenCalledOnce()

    const statements = calls.map((c) => c.sql)
    const firstOf = (needle: string) => statements.findIndex((s) => s.includes(needle))
    // Thứ tự khai báo được giữ nguyên.
    // Ngay sau câu khoá là đúng N câu của ACCOUNT_TABLES, theo đúng thứ tự khai báo.
    ACCOUNT_TABLES.forEach((spec, i) => {
      const sql = statements[3 + i] ?? ''
      expect(sql, spec.table).toContain(` ${spec.table} `)
      const where =
        spec.match === 'email' ? `lower(${spec.userColumn}) = lower($1)` : `${spec.userColumn} = $1`
      expect(sql, spec.table).toContain(`where ${where}`)
      expect(
        sql.startsWith(spec.erase.kind === 'delete' ? 'delete from' : 'update'),
        spec.table,
      ).toBe(true)
    })
    expect(firstOf('delete from public.users')).toBeGreaterThan(firstOf('update public.payments'))
    expect(firstOf('delete from public.users')).toBeGreaterThan(
      firstOf('delete from personal.persons'),
    )
    expect(firstOf('insert into platform.account_erasure_log')).toBeGreaterThan(
      firstOf('delete from public.users'),
    )

    // Đếm: mỗi câu xoá/ẩn danh của danh sách chạm 2 dòng (giả lập).
    const deletes = ACCOUNT_TABLES.filter((s) => s.erase.kind === 'delete').length
    const anonymizes = ACCOUNT_TABLES.length - deletes
    const personRows = PERSON_TABLES.length + 1
    expect(res.recordsAnonymized).toBe(anonymizes * 2)
    expect(res.recordsDeleted).toBe(deletes * 2 + personRows + 1)
    expect(res.tableCounts['public.payments.user_id']).toEqual({ action: 'anonymize', rows: 2 })
    expect(res.tableCounts['personal.persons.user_id']).toEqual({
      action: 'delete',
      rows: personRows,
    })
    expect(res.personErasureLogId).toBe('plog-1')
    expect(res).toMatchObject({ erasureLogId: 'alog-1', erasedAt: '2026-10-08T10:00:00.000Z' })

    // Nhật ký: chỉ mã băm, không có user_id/email trong tham số.
    const logCall = calls.find((c) => c.sql.startsWith('insert into platform.account_erasure_log'))
    expect(logCall?.params?.[0]).toBe(accountSubjectHash(USER_ID))
    expect(JSON.stringify(logCall?.params)).not.toContain(USER_ID)
    expect(JSON.stringify(logCall?.params)).not.toContain(EMAIL)
  })

  it('bảng khớp theo email nhận EMAIL làm tham số, so không phân biệt hoa thường', async () => {
    const { pool, calls } = makePool(happyDelete())
    await deleteAccount(pool as never, USER_ID)
    const fsc = calls.find((c) => c.sql.startsWith('update public.feature_status_checks'))
    expect(fsc?.sql).toContain('lower(triggered_by_email) = lower($1)')
    expect(fsc?.params).toEqual([EMAIL])
    const sessions = calls.find((c) => c.sql.startsWith('delete from public.sessions'))
    expect(sessions?.params).toEqual([USER_ID])
  })

  it('không có Person ⇒ bỏ qua Personal OS, vẫn xoá tài khoản', async () => {
    const { pool, calls } = makePool(happyDelete({ person: none }))
    const res = await deleteAccount(pool as never, USER_ID)
    expect(res.personErasureLogId).toBeNull()
    expect(res.tableCounts['personal.persons.user_id']).toEqual({ action: 'delete', rows: 0 })
    expect(calls.some((c) => c.sql.startsWith('insert into platform.person_erasure_log'))).toBe(
      false,
    )
  })

  it('không tìm thấy user ⇒ NotFoundError + rollback, không chạy câu xoá nào', async () => {
    const { pool, calls } = makePool(() => none)
    await expect(deleteAccount(pool as never, USER_ID)).rejects.toBeInstanceOf(NotFoundError)
    expect(calls.at(-1)?.sql).toBe('rollback')
    expect(calls.some((c) => c.sql.startsWith('delete') || c.sql.startsWith('update'))).toBe(false)
  })

  it('một câu lỗi giữa chừng ⇒ NÉM đúng lỗi đó + rollback, không ghi nhật ký (không nuốt lỗi)', async () => {
    const base = happyDelete()
    const { pool, calls } = makePool((sql, params) => {
      if (sql.startsWith('update public.payments')) throw new Error('payments hỏng')
      return base(sql, params)
    })
    await expect(deleteAccount(pool as never, USER_ID)).rejects.toThrow('payments hỏng')
    expect(calls.at(-1)?.sql).toBe('rollback')
    expect(calls.some((c) => c.sql.startsWith('insert into platform.account_erasure_log'))).toBe(
      false,
    )
    expect(calls.some((c) => c.sql.startsWith('delete from public.users'))).toBe(false)
  })

  it('xoá users không đúng 1 dòng ⇒ ném lỗi + rollback', async () => {
    const { pool, calls } = makePool(happyDelete({ userDelete: { rows: [], rowCount: 0 } }))
    await expect(deleteAccount(pool as never, USER_ID)).rejects.toThrow(/rowCount=0/)
    expect(calls.at(-1)?.sql).toBe('rollback')
  })

  it('không ghi được nhật ký ⇒ ném lỗi + rollback (không báo "đã xoá" khi thiếu vết kiểm toán)', async () => {
    const { pool, calls } = makePool(happyDelete({ log: none }))
    await expect(deleteAccount(pool as never, USER_ID)).rejects.toThrow(/account_erasure_log/)
    expect(calls.at(-1)?.sql).toBe('rollback')
  })

  it('còn đơn pending chưa quá hạn + ân hạn ⇒ PendingPaymentError (409) + rollback, KHÔNG ẩn danh/xoá gì', async () => {
    const { pool, calls } = makePool(happyDelete({ pendingPayment: one({ '?column?': 1 }) }))
    const err = await deleteAccount(pool as never, USER_ID).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(PendingPaymentError)
    expect(err).toBeInstanceOf(ConflictError)
    expect((err as PendingPaymentError).status).toBe(409)
    expect((err as Error).message).toBe(PENDING_PAYMENT_MESSAGE)
    expect(calls.at(-1)?.sql).toBe('rollback')
    expect(calls.some((c) => c.sql.startsWith('delete') || c.sql.startsWith('update'))).toBe(false)
  })

  it('rowCount = null được tính là 0 (không NaN)', async () => {
    const base = happyDelete()
    const { pool } = makePool((sql, params) =>
      sql.startsWith('delete from public.daily_usage')
        ? { rows: [], rowCount: null }
        : base(sql, params),
    )
    const res = await deleteAccount(pool as never, USER_ID)
    expect(res.tableCounts['public.daily_usage.user_id']).toEqual({ action: 'delete', rows: 0 })
    expect(Number.isFinite(res.recordsDeleted)).toBe(true)
  })
})

describe('deleteAccount — sổ chống lạm dụng (0545)', () => {
  const FACTS_ROW = {
    emails: [EMAIL],
    signup_trial_taken: true,
    referee_device_hashes: ['b'.repeat(64)],
    referee_rewarded: true,
    referrer_rewarded_count: 2,
  }
  function withLedger(fail = false): Responder {
    const base = happyDelete()
    return (sql, params) => {
      if (sql.startsWith('select array( select email from public.users')) return one(FACTS_ROW)
      if (sql.startsWith('insert into platform.erased_benefit_ledger')) {
        if (fail) throw new Error('sổ hỏng')
        return { rows: [], rowCount: 4 }
      }
      return base(sql, params)
    }
  }

  afterEach(() => {
    delete process.env[ERASED_BENEFIT_LEDGER_KEY_ENV]
  })

  it('có khoá: đọc sự thật + ghi sổ NGAY sau kiểm đơn chờ, TRƯỚC mọi câu xoá; tham số không chứa PII', async () => {
    process.env[ERASED_BENEFIT_LEDGER_KEY_ENV] = Buffer.alloc(32, 3).toString('base64')
    const { pool, calls } = makePool(withLedger())
    await deleteAccount(pool as never, USER_ID)
    expect(calls[3]?.sql).toMatch(/^select array\( select email from public\.users/)
    expect(calls[3]?.params).toEqual([USER_ID])
    expect(calls[4]?.sql).toMatch(/^insert into platform\.erased_benefit_ledger/)
    expect(calls[5]?.sql).toContain(` ${ACCOUNT_TABLES[0].table} `)
    const params = JSON.stringify(calls[4]?.params)
    expect(params).not.toContain(EMAIL)
    expect(params).not.toContain(USER_ID)
    expect(params).not.toContain('b'.repeat(64))
    expect(calls.at(-1)?.sql).toBe('commit')
  })

  it('ghi sổ lỗi ⇒ NÉM + rollback, không xoá gì (không nuốt lỗi)', async () => {
    process.env[ERASED_BENEFIT_LEDGER_KEY_ENV] = Buffer.alloc(32, 3).toString('base64')
    const { pool, calls } = makePool(withLedger(true))
    await expect(deleteAccount(pool as never, USER_ID)).rejects.toThrow('sổ hỏng')
    expect(calls.at(-1)?.sql).toBe('rollback')
    expect(calls.some((c) => c.sql.startsWith('delete'))).toBe(false)
  })

  it('thiếu khoá: KHÔNG đọc/ghi sổ, xoá vẫn chạy trọn vẹn', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { pool, calls } = makePool(withLedger())
    await deleteAccount(pool as never, USER_ID)
    expect(calls.some((c) => c.sql.includes('erased_benefit_ledger'))).toBe(false)
    expect(calls.some((c) => c.sql.startsWith('select array('))).toBe(false)
    expect(calls.at(-1)?.sql).toBe('commit')
    spy.mockRestore()
  })

  it('người mời xoá tài khoản: referrals.referrer_id chỉ ẩn danh (giữ dòng của người được mời)', () => {
    const spec = ACCOUNT_TABLES.find(
      (s) => s.table === 'public.referrals' && s.userColumn === 'referrer_id',
    )
    expect(spec?.erase).toEqual({ kind: 'anonymize', setSql: 'referrer_id = null' })
  })
})

describe('hasLivePendingPayment', () => {
  it('điều kiện "còn hiệu lực" khớp webhook: pending + expires_at > now() − ân hạn; tham số là giây', async () => {
    const query = vi.fn(async () => ({ rows: [] as unknown[], rowCount: 0 }))
    expect(await hasLivePendingPayment({ query } as never, USER_ID)).toBe(false)
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]]
    expect(norm(sql)).toContain("status = 'pending'")
    expect(norm(sql)).toContain('expires_at > now() - make_interval(secs => $2::double precision)')
    expect(params).toEqual([USER_ID, 86_400])
  })

  it('có ≥ 1 dòng ⇒ true (kể cả khi driver trả rowCount null)', async () => {
    const query = vi.fn(async () => ({ rows: [{}], rowCount: null }))
    expect(await hasLivePendingPayment({ query } as never, USER_ID)).toBe(true)
  })
})

describe('exportAccountData', () => {
  it('một transaction repeatable read + read only; giải mã câu tự do của intake; gắn Personal OS', async () => {
    const encrypted = await encryptUserField(USER_ID, 'vẽ tranh')
    const { pool, calls } = makePool((sql) => {
      if (sql.startsWith('select id, email, email_verified, created_at from public.users'))
        return one({ id: USER_ID, email: EMAIL, email_verified: null, created_at: new Date(0) })
      if (sql.includes('from personal.intake'))
        return one({ focus: 'hoc_thi', extra_hour_enc: encrypted, flow_activity_enc: null })
      if (sql.startsWith('select id from personal.persons where user_id'))
        return one({ id: PERSON_ID })
      if (sql.includes('from personal.persons where id'))
        return one({ id: PERSON_ID, user_id: USER_ID, display_name: 'X' })
      return none
    })
    const out = await exportAccountData(pool as never, USER_ID)

    expect(calls[0]?.sql).toBe('begin')
    expect(calls[1]?.sql).toBe('set transaction isolation level repeatable read, read only')
    expect(calls.at(-1)?.sql).toBe('commit')
    expect(calls.some((c) => /^(insert|update|delete)/.test(c.sql))).toBe(false)

    expect(out).toMatchObject({ format: 'dhcb-account-export', formatVersion: 1, userId: USER_ID })
    expect(out.notes).toEqual(EXPORT_NOTES)
    expect(out.tables.intake).toEqual([
      { focus: 'hoc_thi', extra_hour: 'vẽ tranh', flow_activity: null },
    ])
    expect(Object.keys(out.tables).sort()).toEqual(ACCOUNT_TABLES.map((s) => s.exportKey).sort())
    expect(out.personalOs?.personId).toBe(PERSON_ID)
  })

  it('không có Person ⇒ personalOs = null', async () => {
    const { pool } = makePool((sql) =>
      sql.startsWith('select id, email, email_verified, created_at from public.users')
        ? one({ id: USER_ID, email: EMAIL })
        : none,
    )
    expect((await exportAccountData(pool as never, USER_ID)).personalOs).toBeNull()
  })

  it('không tìm thấy user ⇒ NotFoundError', async () => {
    const { pool } = makePool(() => none)
    await expect(exportAccountData(pool as never, USER_ID)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('một bảng lỗi ⇒ NÉM (không trả bản xuất thiếu)', async () => {
    const { pool, calls } = makePool((sql) => {
      if (sql.startsWith('select id, email, email_verified, created_at from public.users'))
        return one({ id: USER_ID, email: EMAIL })
      if (sql.includes('from public.payments')) throw new Error('payments đọc lỗi')
      return none
    })
    await expect(exportAccountData(pool as never, USER_ID)).rejects.toThrow('payments đọc lỗi')
    expect(calls.at(-1)?.sql).toBe('rollback')
  })
})

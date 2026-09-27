import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Pool } from 'pg'
import { createHash } from 'node:crypto'
import { generateTotpCode, currentTimeStep } from './totp.js'
import {
  getTwoFactorStatus,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  verifyTwoFactor,
  disableTwoFactor,
  grantStepUp,
  hasStepUp,
  STEPUP_WINDOW_MS,
} from './twoFactor.js'

vi.mock('./authService.js', () => ({
  hashSessionToken: (raw: string) => `hashed:${raw}`,
  verifyPassword: async () => true,
}))

// Khoá giả 32 byte — mã hoá chạy THẬT trong test này (không mock), để kiểm được rằng secret
// không bao giờ chạm CSDL ở dạng plaintext.
process.env.USER_DATA_MASTER_KEY = Buffer.alloc(32, 7).toString('base64')

// Pool giả: khớp theo mảnh SQL. Đủ để kiểm LOGIC nghiệp vụ; tính hợp lệ của SQL được kiểm riêng
// bằng cách chạy thật lên PostgreSQL (xem PROGRESS.md).
type Handler = (params: unknown[]) => { rows: unknown[]; rowCount?: number }
let handlers: { match: string; fn: Handler }[] = []
const seen: { sql: string; params: unknown[] }[] = []

function run(sql: string, params: unknown[] = []) {
  seen.push({ sql, params })
  const h = handlers.find((x) => sql.includes(x.match))
  return h ? h.fn(params) : { rows: [], rowCount: 0 }
}

const pool = {
  query: async (sql: string, params?: unknown[]) => run(sql, params ?? []),
  connect: async () => ({
    query: async (sql: string, params?: unknown[]) => run(sql, params ?? []),
    release: () => {},
  }),
} as unknown as Pool

function on(match: string, fn: Handler) {
  handlers.unshift({ match, fn })
}

beforeEach(() => {
  handlers = []
  seen.length = 0
  on('set last_used_step', () => ({ rows: [], rowCount: 1 }))
})

const SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const USER = 'user-1'

async function validCode(): Promise<string> {
  return generateTotpCode(SECRET, currentTimeStep())
}

function stub2fa(row: {
  secret?: string
  enabled_at: Date | null
  last_used_step?: number | null
}) {
  on('from public.user_2fa where', () => ({
    rows: [
      {
        secret: row.secret ?? SECRET,
        enabled_at: row.enabled_at,
        last_used_step: row.last_used_step == null ? null : String(row.last_used_step),
      },
    ],
  }))
}

describe('getTwoFactorStatus', () => {
  it('chưa thiết lập gì → tắt, không chờ, 0 mã khôi phục', async () => {
    expect(await getTwoFactorStatus(pool, USER)).toEqual({
      enabled: false,
      pending: false,
      recoveryCodesLeft: 0,
    })
  })

  it('đã sinh secret nhưng chưa xác nhận → pending, CHƯA có hiệu lực', async () => {
    stub2fa({ enabled_at: null })
    on('count(*)', () => ({ rows: [{ n: '0' }] }))
    const s = await getTwoFactorStatus(pool, USER)
    expect(s).toEqual({ enabled: false, pending: true, recoveryCodesLeft: 0 })
  })

  it('đã bật → đếm đúng số mã khôi phục còn lại', async () => {
    stub2fa({ enabled_at: new Date() })
    on('count(*)', () => ({ rows: [{ n: '7' }] }))
    expect(await getTwoFactorStatus(pool, USER)).toEqual({
      enabled: true,
      pending: false,
      recoveryCodesLeft: 7,
    })
  })
})

describe('mã hoá secret TOTP', () => {
  it('secret KHÔNG bao giờ chạm CSDL ở dạng plaintext', async () => {
    const res = await startTwoFactorSetup(pool, USER, 'a@b.vn')
    const insert = seen.find((q) => q.sql.includes('insert into public.user_2fa'))
    const stored = insert?.params[1] as string

    expect(stored).not.toBe(res.secret)
    expect(stored).not.toContain(res.secret)
    expect(stored).toMatch(/^v\d+:/) // định dạng phong bì của userDataCrypto
    // Nhưng chuỗi trả cho người dùng (để dựng QR) vẫn là secret thật.
    expect(res.otpauthUri).toContain(`secret=${res.secret}`)
  })

  it('đọc lại thì giải mã đúng — mã sinh từ secret gốc vẫn xác thực được', async () => {
    const { secret } = await startTwoFactorSetup(pool, USER, 'a@b.vn')
    const insert = seen.find((q) => q.sql.includes('insert into public.user_2fa'))
    const stored = insert?.params[1] as string

    // Mô phỏng CSDL trả về đúng ciphertext vừa ghi.
    on('from public.user_2fa where', () => ({
      rows: [{ secret: stored, enabled_at: new Date(), last_used_step: null }],
    }))
    const code = await generateTotpCode(secret, currentTimeStep())
    expect(await verifyTwoFactor(pool, USER, code)).toEqual({ ok: true, usedRecoveryCode: false })
  })

  it('bản ghi CŨ chưa mã hoá vẫn dùng được (chuyển đổi dần, không cần dừng dịch vụ)', async () => {
    stub2fa({ secret: SECRET, enabled_at: new Date(), last_used_step: null })
    expect(await verifyTwoFactor(pool, USER, await validCode())).toEqual({
      ok: true,
      usedRecoveryCode: false,
    })
  })
})

describe('startTwoFactorSetup', () => {
  it('sinh secret + chuỗi otpauth dùng được', async () => {
    const res = await startTwoFactorSetup(pool, USER, 'lien@example.com')
    expect(res.secret).toMatch(/^[A-Z2-7]+$/)
    expect(res.otpauthUri).toContain(`secret=${res.secret}`)
    expect(res.otpauthUri).toContain(encodeURIComponent('DHCB:lien@example.com'))
  })

  it('ghi đè secret cũ khi người dùng quét QR hỏng và làm lại', async () => {
    stub2fa({ enabled_at: null })
    on('count(*)', () => ({ rows: [{ n: '0' }] }))
    await startTwoFactorSetup(pool, USER, 'a@b.vn')
    const upsert = seen.find((q) => q.sql.includes('insert into public.user_2fa'))
    expect(upsert?.sql).toContain('enabled_at = null')
  })

  it('TỪ CHỐI khi 2FA đã bật — đổi secret phải đi qua luồng tắt (vốn đòi mã hiện tại)', async () => {
    stub2fa({ enabled_at: new Date() })
    await expect(startTwoFactorSetup(pool, USER, 'a@b.vn')).rejects.toThrow(/đã bật/)
  })
})

describe('confirmTwoFactorSetup', () => {
  it('mã đúng → bật, trả 10 mã khôi phục', async () => {
    stub2fa({ enabled_at: null })
    const res = await confirmTwoFactorSetup(pool, USER, await validCode())
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.recoveryCodes).toHaveLength(10)
    expect(new Set(res.recoveryCodes).size).toBe(10) // không trùng nhau
    // Base32 chia nhóm — không có 0/1/8/9 nên chép từ giấy in không nhầm O với 0, I với 1.
    for (const c of res.recoveryCodes) expect(c).toMatch(/^([A-Z2-7]{4}-){3}[A-Z2-7]{4}$/)
    expect(seen.some((q) => q.sql.includes('set enabled_at = now()'))).toBe(true)
  })

  it('mã sai → KHÔNG bật', async () => {
    stub2fa({ enabled_at: null })
    const res = await confirmTwoFactorSetup(pool, USER, '000000')
    expect(res.ok).toBe(false)
    expect(seen.some((q) => q.sql.includes('set enabled_at = now()'))).toBe(false)
  })

  it('chưa bắt đầu thiết lập → từ chối', async () => {
    const res = await confirmTwoFactorSetup(pool, USER, await validCode())
    expect(res).toEqual({ ok: false, reason: 'Chưa bắt đầu thiết lập 2FA' })
  })

  it('bật và phát mã khôi phục nằm trong CÙNG transaction', async () => {
    stub2fa({ enabled_at: null })
    await confirmTwoFactorSetup(pool, USER, await validCode())
    const sqls = seen.map((q) => q.sql)
    expect(sqls.some((s) => /BEGIN/i.test(s))).toBe(true)
    expect(sqls.some((s) => /COMMIT/i.test(s))).toBe(true)
  })
})

describe('verifyTwoFactor', () => {
  it('chưa bật → not_enabled', async () => {
    stub2fa({ enabled_at: null })
    expect(await verifyTwoFactor(pool, USER, await validCode())).toEqual({
      ok: false,
      reason: 'not_enabled',
    })
  })

  it('mã TOTP đúng → qua, và GHI LẠI bước vừa dùng', async () => {
    stub2fa({ enabled_at: new Date(), last_used_step: null })
    const res = await verifyTwoFactor(pool, USER, await validCode())
    expect(res).toEqual({ ok: true, usedRecoveryCode: false })
    expect(seen.some((q) => q.sql.includes('set last_used_step'))).toBe(true)
  })

  it('hai request TOTP đọc cùng trạng thái → chỉ một lần thành công, retry bị chặn', async () => {
    stub2fa({ enabled_at: new Date(), last_used_step: null })
    let consumedStep: number | null = null
    on('set last_used_step', (params) => {
      const step = Number(params[1])
      if (consumedStep != null && consumedStep >= step) return { rows: [], rowCount: 0 }
      consumedStep = step
      return { rows: [], rowCount: 1 }
    })
    const code = await validCode()
    const results = await Promise.all([
      verifyTwoFactor(pool, USER, code),
      verifyTwoFactor(pool, USER, code),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: 'invalid' }])
    expect(await verifyTwoFactor(pool, USER, code)).toEqual({ ok: false, reason: 'invalid' })
    const update = seen.find((q) => q.sql.includes('set last_used_step'))
    expect(update?.sql).toContain('last_used_step < $2')
    expect(update?.sql).toContain('enabled_at is not null')
    expect(update?.sql).toContain('secret = $3')
    expect(update?.params[2]).toBe(SECRET)
  })

  it('TOTP đúng nhưng DB không tiêu được mã → từ chối, không mở cửa sổ nâng quyền', async () => {
    stub2fa({ enabled_at: new Date(), last_used_step: null })
    on('set last_used_step', () => ({ rows: [], rowCount: 0 }))
    expect(await verifyTwoFactor(pool, USER, await validCode())).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(seen.some((q) => q.sql.includes('set used_at'))).toBe(false)
  })

  it('DÙNG LẠI đúng mã đó → bị từ chối', async () => {
    // Bước hiện tại đã được ghi là "đã dùng" ⇒ mã của bước đó không còn giá trị.
    stub2fa({ enabled_at: new Date(), last_used_step: currentTimeStep() })
    expect(await verifyTwoFactor(pool, USER, await validCode())).toEqual({
      ok: false,
      reason: 'invalid',
    })
  })

  const sha = (code: string) =>
    createHash('sha256').update(code.replace(/[\s-]/g, '').toUpperCase()).digest('hex')

  it('mã khôi phục đúng → qua, tiêu bằng ĐÚNG MỘT câu UPDATE có điều kiện chống đua', async () => {
    const code = 'ABCD-EFGH-IJKLM'
    stub2fa({ enabled_at: new Date(), last_used_step: null })
    on('set used_at = now()', (params) =>
      params[1] === sha(code) ? { rows: [], rowCount: 1 } : { rows: [], rowCount: 0 },
    )

    expect(await verifyTwoFactor(pool, USER, code)).toEqual({ ok: true, usedRecoveryCode: true })
    const upd = seen.find((q) => q.sql.includes('set used_at = now()'))
    expect(upd?.sql).toContain('used_at is null') // điều kiện chống đua
    // Không còn vòng lặp so từng mã: chỉ đúng MỘT câu chạm bảng mã khôi phục.
    expect(seen.filter((q) => q.sql.includes('user_2fa_recovery_codes'))).toHaveLength(1)
  })

  it('mã khôi phục chấp nhận hoa/thường, gạch nối và khoảng trắng thừa', async () => {
    const code = 'ABCD-EFGH-IJKLM'
    stub2fa({ enabled_at: new Date(), last_used_step: null })
    on('set used_at = now()', (params) =>
      params[1] === sha(code) ? { rows: [], rowCount: 1 } : { rows: [], rowCount: 0 },
    )
    expect((await verifyTwoFactor(pool, USER, '  abcdefghijklm ')).ok).toBe(true)
  })

  it('hai request cùng gửi MỘT mã khôi phục → chỉ một cái thắng', async () => {
    stub2fa({ enabled_at: new Date(), last_used_step: null })
    // Request thua cuộc đua: UPDATE không chạm được hàng nào vì used_at đã bị set.
    on('set used_at = now()', () => ({ rows: [], rowCount: 0 }))
    expect(await verifyTwoFactor(pool, USER, 'ABCD-EFGH-IJKLM')).toEqual({
      ok: false,
      reason: 'invalid',
    })
  })

  it('mã khôi phục sai → từ chối', async () => {
    stub2fa({ enabled_at: new Date(), last_used_step: null })
    on('set used_at = now()', (params) =>
      params[1] === sha('ABCD-EFGH-IJKLM') ? { rows: [], rowCount: 1 } : { rows: [], rowCount: 0 },
    )
    expect(await verifyTwoFactor(pool, USER, 'ZZZZ-ZZZZ-ZZZZZ')).toEqual({
      ok: false,
      reason: 'invalid',
    })
  })
})

describe('disableTwoFactor', () => {
  it('xoá cả thiết lập lẫn mã khôi phục, trong một transaction', async () => {
    await disableTwoFactor(pool, USER)
    const sqls = seen.map((q) => q.sql)
    expect(sqls.some((s) => s.includes('delete from public.user_2fa_recovery_codes'))).toBe(true)
    expect(sqls.some((s) => s.includes('delete from public.user_2fa where'))).toBe(true)
    expect(sqls.some((s) => /BEGIN/i.test(s))).toBe(true)
  })
})

describe('cửa sổ nâng quyền', () => {
  it('grantStepUp ghi vào ĐÚNG session (theo token băm), không theo người dùng', async () => {
    const until = await grantStepUp(pool, 'raw-token')
    const q = seen.find((x) => x.sql.includes('set stepup_until'))
    expect(q?.sql).toContain('where session_token = $1')
    expect(q?.params[0]).toBe('hashed:raw-token')
    expect(until.getTime()).toBeGreaterThan(Date.now() + STEPUP_WINDOW_MS - 5000)
  })

  it('người CHƯA bật 2FA luôn có quyền — 2FA là tuỳ chọn, không được lấy làm rào chặn', async () => {
    expect(await hasStepUp(pool, USER, 'raw-token')).toBe(true)
    expect(await hasStepUp(pool, USER, null)).toBe(true)
  })

  it('đã bật 2FA + trong cửa sổ → có quyền', async () => {
    stub2fa({ enabled_at: new Date() })
    on('count(*)', () => ({ rows: [{ n: '5' }] }))
    on('select stepup_until', () => ({ rows: [{ stepup_until: new Date(Date.now() + 60_000) }] }))
    expect(await hasStepUp(pool, USER, 'raw-token')).toBe(true)
  })

  it('đã bật 2FA + cửa sổ HẾT HẠN → không có quyền', async () => {
    stub2fa({ enabled_at: new Date() })
    on('count(*)', () => ({ rows: [{ n: '5' }] }))
    on('select stepup_until', () => ({ rows: [{ stepup_until: new Date(Date.now() - 1000) }] }))
    expect(await hasStepUp(pool, USER, 'raw-token')).toBe(false)
  })

  it('đã bật 2FA + chưa từng nâng quyền → không có quyền', async () => {
    stub2fa({ enabled_at: new Date() })
    on('count(*)', () => ({ rows: [{ n: '5' }] }))
    on('select stepup_until', () => ({ rows: [{ stepup_until: null }] }))
    expect(await hasStepUp(pool, USER, 'raw-token')).toBe(false)
  })

  it('đã bật 2FA nhưng không đọc được token phiên → không có quyền', async () => {
    stub2fa({ enabled_at: new Date() })
    on('count(*)', () => ({ rows: [{ n: '5' }] }))
    expect(await hasStepUp(pool, USER, null)).toBe(false)
  })
})

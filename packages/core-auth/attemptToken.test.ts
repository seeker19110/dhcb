// attemptToken — token lượt làm ký HMAC + seed ẩn (đợt 0558, đặc tả
// docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md ④.2–④.4).
import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_ATTEMPT_TOKEN_LENGTH,
  SigningKeyUnavailableError,
  hiddenSeedFor,
  resetAttemptTokenKeyForTests,
  signAttemptToken,
  verifyAttemptToken,
} from './attemptToken.js'

const SCOPE = 'test-scope'
const KEY = randomBytes(32).toString('base64')

beforeEach(() => {
  vi.stubEnv('USER_DATA_MASTER_KEY', KEY)
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('VERCEL_ENV', '')
  resetAttemptTokenKeyForTests()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  resetAttemptTokenKeyForTests()
})

describe('signAttemptToken / verifyAttemptToken', () => {
  it('ký rồi verify → payload nguyên vẹn + exp = now + ttl; seed ẩn tất định theo token', () => {
    const { token, expiresAt } = signAttemptToken(SCOPE, { u: 'user-1', n: 7 }, 60_000, 1_000)
    expect(expiresAt).toBe(61_000)
    const v = verifyAttemptToken(SCOPE, token, 1_500)
    expect(v.ok).toBe(true)
    if (!v.ok) return
    expect(v.payload).toMatchObject({ u: 'user-1', n: 7, exp: 61_000 })
    expect(hiddenSeedFor(SCOPE, v.signature)).toBe(hiddenSeedFor(SCOPE, v.signature))
    expect(hiddenSeedFor(SCOPE, v.signature)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hai lần ký cùng payload → hai token KHÁC nhau (nonce) và seed ẩn khác nhau', () => {
    const a = signAttemptToken(SCOPE, { u: 'user-1' }, 60_000, 0)
    const b = signAttemptToken(SCOPE, { u: 'user-1' }, 60_000, 0)
    expect(a.token).not.toBe(b.token)
    const va = verifyAttemptToken(SCOPE, a.token, 1)
    const vb = verifyAttemptToken(SCOPE, b.token, 1)
    if (!va.ok || !vb.ok) throw new Error('phải verify được')
    expect(hiddenSeedFor(SCOPE, va.signature)).not.toBe(hiddenSeedFor(SCOPE, vb.signature))
  })

  it('seed KHÔNG nằm trong token (phần payload không chứa seed)', () => {
    const { token } = signAttemptToken(SCOPE, { u: 'user-1' }, 60_000)
    const v = verifyAttemptToken(SCOPE, token)
    if (!v.ok) throw new Error('phải verify được')
    const seed = hiddenSeedFor(SCOPE, v.signature)
    expect(token).not.toContain(seed)
    expect(Buffer.from(token.split('.')[1]!, 'base64url').toString()).not.toContain(seed)
  })

  it('sửa một ký tự payload hoặc chữ ký → bad-signature; sai scope → bad-signature', () => {
    const { token } = signAttemptToken(SCOPE, { u: 'user-1' }, 60_000)
    const [v, body, sig] = token.split('.') as [string, string, string]
    const flip = (s: string) => (s[0] === 'A' ? 'B' : 'A') + s.slice(1)
    expect(verifyAttemptToken(SCOPE, `${v}.${flip(body)}.${sig}`)).toEqual({
      ok: false,
      reason: 'bad-signature',
    })
    expect(verifyAttemptToken(SCOPE, `${v}.${body}.${flip(sig)}`)).toEqual({
      ok: false,
      reason: 'bad-signature',
    })
    expect(verifyAttemptToken('khac', token)).toEqual({ ok: false, reason: 'bad-signature' })
  })

  it('chữ ký KHÔNG chuẩn tắc (ký tự cuối đổi bit thừa, thêm ký tự rác) → bad-signature dù giải mã ra cùng byte', () => {
    const { token } = signAttemptToken(SCOPE, { u: 'user-1' }, 60_000)
    const [v, body, sig] = token.split('.') as [string, string, string]
    // Ký tự base64url cuối của 32 byte chỉ dùng 2 bit cao; đổi 4 bit thấp vẫn decode ra cùng byte.
    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    const last = sig[sig.length - 1]!
    const twin = ALPHA[(ALPHA.indexOf(last) + 1) % 64]!
    const variant = sig.slice(0, -1) + twin
    const decodesSame = Buffer.from(variant, 'base64url').equals(Buffer.from(sig, 'base64url'))
    if (decodesSame) {
      expect(verifyAttemptToken(SCOPE, `${v}.${body}.${variant}`)).toEqual({
        ok: false,
        reason: 'bad-signature',
      })
    }
    expect(verifyAttemptToken(SCOPE, `${v}.${body}.${sig}=`)).toEqual({
      ok: false,
      reason: 'bad-signature',
    })
    expect(verifyAttemptToken(SCOPE, `${v}.${body}.${sig}!`)).toEqual({
      ok: false,
      reason: 'bad-signature',
    })
  })

  it('hết hạn → expired (đúng mốc exp là hết); chữ ký sai VÀ hết hạn → vẫn báo bad-signature', () => {
    const { token } = signAttemptToken(SCOPE, { u: 'user-1' }, 1_000, 0)
    expect(verifyAttemptToken(SCOPE, token, 999).ok).toBe(true)
    expect(verifyAttemptToken(SCOPE, token, 1_000)).toEqual({ ok: false, reason: 'expired' })
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')
    expect(verifyAttemptToken(SCOPE, tampered, 5_000)).toEqual({
      ok: false,
      reason: 'bad-signature',
    })
  })

  it.each([
    ['rỗng', ''],
    ['thiếu phần', 'v1.abc'],
    ['phiên bản lạ', 'v2.abc.def'],
    ['quá dài', 'v1.' + 'a'.repeat(MAX_ATTEMPT_TOKEN_LENGTH) + '.b'],
    ['không phải chuỗi', 42 as unknown as string],
  ])('token %s → malformed, không ném', (_label, token) => {
    expect(verifyAttemptToken(SCOPE, token)).toEqual({ ok: false, reason: 'malformed' })
  })

  it('payload tự đặt exp/nonce → ném (nơi gọi dùng sai)', () => {
    expect(() => signAttemptToken(SCOPE, { exp: 1 }, 1_000)).toThrow(/exp\/nonce/)
    expect(() => signAttemptToken(SCOPE, { nonce: 'x' }, 1_000)).toThrow(/exp\/nonce/)
  })
})

describe('khoá ký', () => {
  it('thiếu USER_DATA_MASTER_KEY ở production → SigningKeyUnavailableError', () => {
    vi.stubEnv('USER_DATA_MASTER_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    resetAttemptTokenKeyForTests()
    expect(() => signAttemptToken(SCOPE, { u: 'x' }, 1_000)).toThrow(SigningKeyUnavailableError)
  })

  it('khoá sai độ dài ở production → SigningKeyUnavailableError', () => {
    vi.stubEnv('USER_DATA_MASTER_KEY', Buffer.from('ngan').toString('base64'))
    vi.stubEnv('NODE_ENV', 'production')
    resetAttemptTokenKeyForTests()
    expect(() => signAttemptToken(SCOPE, { u: 'x' }, 1_000)).toThrow(SigningKeyUnavailableError)
  })

  it('thiếu khoá ngoài production → khoá ngẫu nhiên theo tiến trình, cảnh báo MỘT lần, vẫn ký/verify được', () => {
    vi.stubEnv('USER_DATA_MASTER_KEY', '')
    resetAttemptTokenKeyForTests()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { token } = signAttemptToken(SCOPE, { u: 'x' }, 60_000)
    signAttemptToken(SCOPE, { u: 'y' }, 60_000)
    expect(verifyAttemptToken(SCOPE, token).ok).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('USER_DATA_MASTER_KEY')
  })

  it('đổi khoá gốc → token cũ không còn verify được (khoá suy ra bằng HKDF từ khoá gốc)', () => {
    const { token } = signAttemptToken(SCOPE, { u: 'x' }, 60_000)
    vi.stubEnv('USER_DATA_MASTER_KEY', randomBytes(32).toString('base64'))
    resetAttemptTokenKeyForTests()
    expect(verifyAttemptToken(SCOPE, token)).toEqual({ ok: false, reason: 'bad-signature' })
  })
})

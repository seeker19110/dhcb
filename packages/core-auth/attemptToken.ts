// attemptToken.ts — TOKEN LƯỢT LÀM ký HMAC + SEED ẨN (đợt 0558).
//
// Bài toán: một bài kiểm tra sinh TẤT ĐỊNH từ dữ liệu công khai (vd kiểm tra hiểu hội thoại CEFR)
// thì ai cầm seed đều tự tính được đáp án. Cách chặn: server tự sinh lượt, cấp cho client một token
// mờ; SEED không nằm trong token mà SUY RA từ chữ ký bằng khoá chỉ server có. Client gửi token lại
// khi nộp, server verify rồi suy lại đúng seed để dựng lại đề và chấm.
//
// Định dạng: `v1.<payload base64url>.<HMAC-SHA256(scope|v1.<payload>) base64url>`
//   - payload là JSON do nơi gọi đưa (userId, nội dung…) + `exp` (epoch ms) do đây thêm.
//   - `scope` tách không gian khoá giữa các loại lượt (token của loại này không dùng cho loại kia).
// Khoá ký: HKDF-SHA256 từ `USER_DATA_MASTER_KEY` (đã bắt buộc ở production — không thêm biến môi
// trường), info cố định để không trùng với khoá mã hoá dữ liệu người dùng. Dev/test thiếu khoá →
// khoá ngẫu nhiên theo tiến trình (token mất hiệu lực khi khởi động lại; cảnh báo một lần).
// Production thiếu khoá → ném `SigningKeyUnavailableError` (nơi gọi trả 503, fail-closed).
//
// Verify: so chữ ký bằng `timingSafeEqual` TRƯỚC, rồi mới xem hạn — token giả không được biết là
// "giả nhưng đúng hạn" hay "giả và hết hạn".
import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto'

const VERSION = 'v1'
const KEY_LENGTH = 32
const HKDF_INFO = 'dhcb:attempt-token:v1'
const HKDF_SALT = 'dhcb-attempt-token'
/** Trần độ dài token nhận vào — chặn body quá khổ trước khi parse. */
export const MAX_ATTEMPT_TOKEN_LENGTH = 2048

export class SigningKeyUnavailableError extends Error {
  constructor() {
    super('Server chưa cấu hình USER_DATA_MASTER_KEY nên không ký được token lượt làm')
    this.name = 'SigningKeyUnavailableError'
  }
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
}

let cachedKey: Buffer | null = null
let warnedEphemeral = false

function signingKey(): Buffer {
  if (cachedKey) return cachedKey
  const b64 = process.env.USER_DATA_MASTER_KEY
  if (b64) {
    const ikm = Buffer.from(b64, 'base64')
    if (ikm.length !== KEY_LENGTH) throw new SigningKeyUnavailableError()
    cachedKey = Buffer.from(hkdfSync('sha256', ikm, HKDF_SALT, HKDF_INFO, KEY_LENGTH))
    return cachedKey
  }
  if (isProduction()) throw new SigningKeyUnavailableError()
  if (!warnedEphemeral) {
    warnedEphemeral = true
    console.warn(
      '[attempt-token] thiếu USER_DATA_MASTER_KEY — dùng khoá ngẫu nhiên theo tiến trình (chỉ dev/test)',
    )
  }
  cachedKey = randomBytes(KEY_LENGTH)
  return cachedKey
}

/** Chỉ cho test: quên khoá đã cache sau khi đổi biến môi trường. */
export function resetAttemptTokenKeyForTests(): void {
  cachedKey = null
  warnedEphemeral = false
}

function hmac(message: string): Buffer {
  return createHmac('sha256', signingKey()).update(message).digest()
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

export type AttemptPayload = Record<string, string | number>

/**
 * Ký một lượt. `payload` KHÔNG được có khoá `exp` (đây thêm). Trả token + mốc hết hạn.
 * Mỗi lần gọi thêm `nonce` ngẫu nhiên nên hai lượt cùng nội dung vẫn ra token (và seed) khác nhau.
 */
export function signAttemptToken(
  scope: string,
  payload: AttemptPayload,
  ttlMs: number,
  now: number = Date.now(),
): { token: string; expiresAt: number } {
  if ('exp' in payload || 'nonce' in payload) {
    throw new Error('payload không được tự đặt exp/nonce')
  }
  const expiresAt = now + ttlMs
  const body = b64url(
    Buffer.from(JSON.stringify({ ...payload, nonce: b64url(randomBytes(12)), exp: expiresAt })),
  )
  const unsigned = `${VERSION}.${body}`
  const sig = b64url(hmac(`${scope}|${unsigned}`))
  return { token: `${unsigned}.${sig}`, expiresAt }
}

export type VerifyAttemptOutcome =
  | { ok: true; payload: AttemptPayload & { exp: number }; signature: string }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' }

/** Verify token của `scope`: cấu trúc → chữ ký (timing-safe) → hạn. */
export function verifyAttemptToken(
  scope: string,
  token: string,
  now: number = Date.now(),
): VerifyAttemptOutcome {
  if (typeof token !== 'string' || token.length > MAX_ATTEMPT_TOKEN_LENGTH) {
    return { ok: false, reason: 'malformed' }
  }
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== VERSION || !parts[1] || !parts[2]) {
    return { ok: false, reason: 'malformed' }
  }
  const [, body, sig] = parts as [string, string, string]
  const expected = hmac(`${scope}|${VERSION}.${body}`)
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: 'bad-signature' }
  }
  // base64url KHÔNG chuẩn tắc: `Buffer.from` bỏ qua ký tự lạ và bit thừa ở ký tự cuối, nên nhiều
  // chuỗi khác nhau giải mã ra cùng 32 byte. Nếu chấp nhận, một token sẽ có nhiều "chữ ký" → nhiều
  // khoá lượt (lách "mỗi lượt chấm một lần") và nhiều seed ẩn. Chỉ nhận ĐÚNG dạng server đã phát.
  if (b64url(given) !== sig) return { ok: false, reason: 'bad-signature' }
  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, reason: 'malformed' }
  }
  const exp = (payload as { exp?: unknown }).exp
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return { ok: false, reason: 'malformed' }
  if (now >= exp) return { ok: false, reason: 'expired' }
  return { ok: true, payload: payload as AttemptPayload & { exp: number }, signature: sig }
}

/**
 * SEED ẨN của một token ĐÃ verify — suy từ chữ ký bằng khoá server, nên client không tính được.
 * Cùng token → cùng seed (để dựng lại đúng đề lúc chấm).
 */
export function hiddenSeedFor(scope: string, signature: string): string {
  return hmac(`${scope}|seed|${signature}`).toString('hex')
}

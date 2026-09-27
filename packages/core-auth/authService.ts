// api/_lib/authService.ts — Auth tự viết thay Supabase Auth (Giai đoạn B).
// Quyết định kiến trúc GỐC (xem docs/migration-thoat-ly-supabase.md): Bearer token — khớp
// đúng kiến trúc SPA hiện có lúc đó.
//
// [Cập nhật Bước 6, docs/adr/0002-quan-ly-nguoi-dung.md] Bearer đã BỊ THAY bằng cookie
// `session_token` (packages/core-auth/sessionCookie.ts) làm cơ chế xác thực DUY NHẤT —
// `security.ts#validateAuth` không còn đọc header Authorization. Client vẫn trả `token` trong
// body đăng nhập (dùng làm cờ UI "đã đăng nhập chưa" ở localStorage, xem
// packages/core-ui/authHeader.ts) nhưng giá trị đó KHÔNG còn được server dùng để xác thực —
// cookie mới là nguồn sự thật. Đổi lúc này chấp nhận đăng xuất hàng loạt các phiên chỉ có
// Bearer từ trước khi Bước 3 (2026-08-08) triển khai (chưa từng có cookie) — quyết định có
// chủ ý, xem ADR-0002 mục Bước 6.
//
// Session token: chuỗi ngẫu nhiên 32 byte (crypto.randomBytes), CHỈ hash SHA-256 của token
// được lưu trong bảng `sessions` (không lưu token gốc) — giống thông lệ lưu API key, để lộ
// DB không đồng nghĩa với lộ token dùng được ngay.

import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { resolvePlan, type Plan } from '@dhcb/core-billing/plan'
import { grantFounderIfAvailable } from '@dhcb/core-billing/founder'

// Xuất ra để packages/core-auth/sessionCookie.ts đặt đúng Max-Age cho cookie — PHẢI khớp
// thời hạn session thật lưu ở bảng `sessions` (dưới), không lệch cookie sống lâu hơn session.
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 ngày — khớp thời hạn session Supabase cũ
const BCRYPT_ROUNDS = 12

export interface AuthUserRow {
  id: string
  email: string
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

/**
 * Băm session token đúng cách bảng `public.sessions` đang lưu (cột `session_token` là BĂM, không
 * phải token gốc).
 *
 * Xuất ra ngoài để module khác cần truy vấn/cập nhật đúng hàng session (vd. `twoFactor.ts` ghi
 * cửa sổ nâng quyền) dùng lại thay vì tự băm — tự băm là chép lại thuật toán, và nếu sau này đổi
 * cách băm ở đây thì chỗ chép sẽ âm thầm trỏ sai hàng.
 */
export function hashSessionToken(rawToken: string): string {
  return hashToken(rawToken)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Tạo user email/password mới. Trả `null` nếu email đã tồn tại (unique_violation, code 23505).
export async function createUserWithPassword(
  email: string,
  password: string,
): Promise<AuthUserRow | null> {
  const pool = getPgPool()
  const passwordHash = await hashPassword(password)
  try {
    const { rows } = await pool.query<AuthUserRow>(
      'insert into public.users (email, password_hash) values ($1, $2) returning id, email',
      [email.toLowerCase().trim(), passwordHash],
    )
    return rows[0] ?? null
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      return null // email đã tồn tại
    }
    throw err
  }
}

// Xác thực email/password. Trả `null` nếu sai email hoặc sai mật khẩu (không phân biệt lỗi
// nào để tránh lộ thông tin "email này có tồn tại không" cho kẻ dò email hàng loạt).
export async function verifyUserPassword(
  email: string,
  password: string,
): Promise<AuthUserRow | null> {
  const pool = getPgPool()
  const { rows } = await pool.query<AuthUserRow & { password_hash: string | null }>(
    'select id, email, password_hash from public.users where email = $1',
    [email.toLowerCase().trim()],
  )
  const user = rows[0]
  if (!user?.password_hash) return null
  const ok = await verifyPassword(password, user.password_hash)
  return ok ? { id: user.id, email: user.email } : null
}

// ── Google OAuth (Google Identity Services — client gửi ID token, server verify) ──────
let googleClient: OAuth2Client | null = null
let googleClientId: string | null = null
function getGoogleClient(): { client: OAuth2Client; clientId: string } {
  if (googleClient && googleClientId) return { client: googleClient, clientId: googleClientId }
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('Server chưa cấu hình GOOGLE_CLIENT_ID')
  googleClientId = clientId
  googleClient = new OAuth2Client(clientId)
  return { client: googleClient, clientId }
}

// Verify ID token nhận từ client (Google Identity Services), trả thông tin đã xác thực
// hoặc `null` nếu token không hợp lệ/giả mạo/sai audience.
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<{ googleId: string; email: string; name: string } | null> {
  try {
    const { client, clientId } = getGoogleClient()
    const ticket = await client.verifyIdToken({ idToken, audience: clientId })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email) return null
    if (payload.email_verified === false) return null
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0] ?? payload.email,
    }
  } catch (err) {
    console.error(
      '[authService] verifyGoogleIdToken thất bại:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

// Verify access_token nhận từ luồng OAuth2 popup của GIS (`initTokenClient` — dùng thay cho
// One Tap vì One Tap phụ thuộc cookie bên thứ 3/FedCM, KHÔNG hoạt động trên Safari/iOS,
// đặc biệt khi chạy PWA ở chế độ standalone — xem src/lib/auth.ts). Xác thực bằng cách gọi
// endpoint tokeninfo của Google (kiểm audience đúng client_id của app) rồi lấy userinfo.
export async function verifyGoogleAccessToken(
  accessToken: string,
): Promise<{ googleId: string; email: string; name: string } | null> {
  try {
    const { clientId } = getGoogleClient()

    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    )
    if (!tokenInfoRes.ok) return null
    const tokenInfo = (await tokenInfoRes.json()) as { aud?: string }
    if (tokenInfo.aud !== clientId) return null

    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userInfoRes.ok) return null
    const userInfo = (await userInfoRes.json()) as {
      sub?: string
      email?: string
      email_verified?: boolean
      name?: string
    }
    if (!userInfo.sub || !userInfo.email) return null
    if (userInfo.email_verified === false) return null

    return {
      googleId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name ?? userInfo.email.split('@')[0] ?? userInfo.email,
    }
  } catch (err) {
    console.warn(
      '[authService] verifyGoogleAccessToken thất bại:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

// ── OAuth dùng chung (Google/Facebook/Apple/Microsoft) ──────────────────────────────────
// [Cập nhật Bước 6, docs/adr/0002-quan-ly-nguoi-dung.md] Tra cứu qua bảng `identities` (0034)
// THAY VÌ 4 cột `google_id`/`facebook_id`/`apple_id`/`microsoft_id` cũ trên `users` — 4 cột đó
// đã bị xoá ở migration 0037 (cùng đợt deploy với thay đổi này, không được lệch nhau).
//
// Email trùng KHÔNG chứng minh người đăng nhập sở hữu tài khoản hiện có. Identity mới phải
// được liên kết bằng một luồng có xác thực tài khoản cũ; không tự ghép theo email.
// Trả kèm `isNew` — cần để BIẾT có phải lần đăng nhập ĐẦU TIÊN không (chỉ tài khoản mới mới
// được cấp quà dùng thử tự động, xem grantSignupTrial ở api/auth.ts — người dùng cũ đăng nhập
// lại KHÔNG được cấp thêm).
type OAuthProvider = 'google' | 'facebook' | 'apple' | 'microsoft'

export class OAuthAccountLinkRequiredError extends Error {
  constructor() {
    super('Hãy đăng nhập bằng email đã xác minh hoặc nhà cung cấp đã liên kết với tài khoản.')
    this.name = 'OAuthAccountLinkRequiredError'
  }
}

/** Giữ tương thích với nơi gọi cũ; mọi provider đều dùng cùng rào chắn liên kết. */
export class MicrosoftAccountLinkRequiredError extends OAuthAccountLinkRequiredError {
  constructor() {
    super()
    this.name = 'MicrosoftAccountLinkRequiredError'
  }
}

async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  providerId: string,
  email: string,
): Promise<{ user: AuthUserRow; isNew: boolean }> {
  const pool = getPgPool()
  const normalizedEmail = email.toLowerCase().trim()

  const byIdentity = await pool.query<AuthUserRow>(
    `select u.id, u.email from public.users u
     join public.identities i on i.user_id = u.id
     where i.provider = $1 and i.provider_user_id = $2`,
    [provider, providerId],
  )
  if (byIdentity.rows[0]) return { user: byIdentity.rows[0], isNew: false }

  // Chỉ identity đã liên kết mới được đăng nhập Microsoft. Không chiếm email của user cũ,
  // cũng không tạo user mới với email chưa chứng minh sở hữu (gây khóa đăng ký của chủ thật).
  if (provider === 'microsoft') throw new MicrosoftAccountLinkRequiredError()

  const byEmail = await pool.query<AuthUserRow>(
    'select id, email from public.users where email = $1',
    [normalizedEmail],
  )
  if (byEmail.rows[0]) {
    throw new OAuthAccountLinkRequiredError()
  }

  try {
    // Tạo user + identity cùng transaction, tránh tài khoản mồ côi nếu hai đăng nhập đua nhau.
    return await withTransaction(pool, async (client) => {
      const { rows } = await client.query<AuthUserRow>(
        'insert into public.users (email, email_verified) values ($1, now()) returning id, email',
        [normalizedEmail],
      )
      const created = rows[0]
      if (!created) throw new Error(`Không tạo được user ${provider} mới`)
      await client.query(
        `insert into public.identities (provider, provider_user_id, user_id, email)
         values ($1, $2, $3, $4)`,
        [provider, providerId, created.id, normalizedEmail],
      )
      return { user: created, isNew: true }
    })
  } catch (err) {
    if ((err as { code?: string }).code !== '23505') throw err
    // Sau rollback, chỉ identity chính xác mới được phép phục hồi retry. Email trùng vẫn chặn.
    const retry = await pool.query<AuthUserRow>(
      `select u.id, u.email from public.users u
       join public.identities i on i.user_id = u.id
       where i.provider = $1 and i.provider_user_id = $2`,
      [provider, providerId],
    )
    if (retry.rows[0]) return { user: retry.rows[0], isNew: false }
    throw new OAuthAccountLinkRequiredError()
  }
}

export async function findOrCreateGoogleUser(
  googleId: string,
  email: string,
): Promise<{ user: AuthUserRow; isNew: boolean }> {
  return findOrCreateOAuthUser('google', googleId, email)
}

export async function findOrCreateFacebookUser(
  facebookId: string,
  email: string,
): Promise<{ user: AuthUserRow; isNew: boolean }> {
  return findOrCreateOAuthUser('facebook', facebookId, email)
}

export async function findOrCreateAppleUser(
  appleId: string,
  email: string,
): Promise<{ user: AuthUserRow; isNew: boolean }> {
  return findOrCreateOAuthUser('apple', appleId, email)
}

export async function findOrCreateMicrosoftUser(
  microsoftId: string,
  email: string,
): Promise<{ user: AuthUserRow; isNew: boolean }> {
  return findOrCreateOAuthUser('microsoft', microsoftId, email)
}

// ── Facebook Login (SDK trả access token, server verify qua Graph API) ─────────────────
// Xác minh access token: (1) debug_token bằng app access token (app_id|app_secret) — chống
// người khác gửi access token của MỘT APP FACEBOOK KHÁC (is_valid + đúng app_id của mình);
// (2) gọi /me lấy id/email/name bằng CHÍNH access token đó. Cần FACEBOOK_APP_ID +
// FACEBOOK_APP_SECRET trong .env (tạo app tại developers.facebook.com).
export async function verifyFacebookAccessToken(
  accessToken: string,
): Promise<{ facebookId: string; email: string; name: string } | null> {
  try {
    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    if (!appId || !appSecret) {
      throw new Error('Server chưa cấu hình FACEBOOK_APP_ID/FACEBOOK_APP_SECRET')
    }

    const appToken = `${appId}|${appSecret}`
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`,
    )
    const debugData = (await debugRes.json()) as {
      data?: { is_valid?: boolean; app_id?: string }
    }
    if (!debugData.data?.is_valid || debugData.data.app_id !== appId) return null

    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,email,name&access_token=${encodeURIComponent(accessToken)}`,
    )
    const me = (await meRes.json()) as { id?: string; email?: string; name?: string }
    // Facebook cho phép user KHÔNG cấp quyền email (hiếm, thường do tài khoản chỉ có SĐT) —
    // không tạo được tài khoản nếu thiếu, vì `users.email` là NOT NULL UNIQUE.
    if (!me.id || !me.email) return null

    return {
      facebookId: me.id,
      email: me.email,
      name: me.name ?? me.email.split('@')[0] ?? me.email,
    }
  } catch (err) {
    console.warn(
      '[authService] verifyFacebookAccessToken thất bại:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

// ── Sign in with Apple (client trả id_token JWT, server verify qua JWKS của Apple) ─────
// Chỉ verify chữ ký + issuer/audience — KHÔNG cần Client Secret/private key .p8 (chỉ cần cho
// luồng server-to-server đổi authorization code, ta không dùng luồng đó). Cần APPLE_CLIENT_ID
// (Services ID, tạo tại developer.apple.com → Certificates, Identifiers & Profiles).
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

// Apple CHỈ gửi tên/email trong object `user` riêng (không nằm trong id_token) và CHỈ ở LẦN
// ĐẦU TIÊN người dùng đồng ý chia sẻ với app này — client PHẢI tự lưu/gửi lên ngay lần đó
// (xem src/lib/auth.ts). Các lần đăng nhập sau, id_token vẫn có `email` (Apple luôn nhúng lại
// email — kể cả địa chỉ ẩn danh @privaterelay.appleid.com) nhưng KHÔNG có tên, nên `nameFromClient`
// chỉ dùng khi tạo user mới lần đầu, có thể để trống.
export async function verifyAppleIdToken(
  idToken: string,
  nameFromClient?: string,
): Promise<{ appleId: string; email: string; name: string } | null> {
  try {
    const clientId = process.env.APPLE_CLIENT_ID
    if (!clientId) throw new Error('Server chưa cấu hình APPLE_CLIENT_ID')

    const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: clientId,
    })
    if (typeof payload.sub !== 'string') return null
    const email = typeof payload.email === 'string' ? payload.email : null
    // Không có email = không tạo/khớp được tài khoản an toàn (email NOT NULL UNIQUE) — ca hiếm
    // (Apple không nhúng lại email cho id_token cũ/đã cache phía client), yêu cầu đăng nhập lại.
    if (!email) return null

    return {
      appleId: payload.sub,
      email,
      name: nameFromClient?.trim() || email.split('@')[0] || email,
    }
  } catch (err) {
    console.warn(
      '[authService] verifyAppleIdToken thất bại:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

// ── Đăng nhập Microsoft (client trả id_token JWT qua MSAL.js, server verify qua JWKS) ───
// Dùng authority 'common' (chấp nhận CẢ tài khoản công ty/trường lẫn tài khoản cá nhân
// Microsoft — outlook.com/hotmail.com...) nên mỗi tenant có issuer KHÁC NHAU (chứa tenant id
// trong URL) — không so sánh issuer CỐ ĐỊNH như Apple/Google được, phải khớp theo MẪU. JWKS
// của endpoint 'common' phục vụ chung cho mọi tenant nên vẫn verify chữ ký được bình thường.
// Cần MICROSOFT_CLIENT_ID (Application/client ID, tạo tại portal.azure.com → App registrations
// → chọn "Accounts in any organizational directory and personal Microsoft accounts").
const MICROSOFT_JWKS = createRemoteJWKSet(
  new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys'),
)
const MICROSOFT_ISSUER_RE = /^https:\/\/login\.microsoftonline\.com\/[^/]+\/v2\.0$/

export async function verifyMicrosoftIdToken(
  idToken: string,
): Promise<{ microsoftId: string; email: string; name: string } | null> {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID
    if (!clientId) throw new Error('Server chưa cấu hình MICROSOFT_CLIENT_ID')

    const { payload } = await jwtVerify(idToken, MICROSOFT_JWKS, {
      audience: clientId,
    })
    // Issuer kiểm bằng regex NGAY SAU khi verify chữ ký (không truyền issuer cho jwtVerify vì
    // nó chỉ so khớp CHUỖI CỐ ĐỊNH, không hỗ trợ mẫu/tenant động).
    if (typeof payload.iss !== 'string' || !MICROSOFT_ISSUER_RE.test(payload.iss)) return null
    if (typeof payload.sub !== 'string') return null

    // 'email' claim không phải lúc nào cũng có (phụ thuộc cấu hình tenant) — 'preferred_username'
    // luôn có và thường CHÍNH LÀ email/UPN đăng nhập, dùng làm phương án dự phòng.
    const email =
      (typeof payload.email === 'string' && payload.email) ||
      (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
      null
    if (!email) return null

    const name = typeof payload.name === 'string' ? payload.name : email.split('@')[0] || email
    return { microsoftId: payload.sub, email, name }
  } catch (err) {
    console.warn(
      '[authService] verifyMicrosoftIdToken thất bại:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

export async function getUserById(userId: string): Promise<AuthUserRow | null> {
  const pool = getPgPool()
  const { rows } = await pool.query<AuthUserRow>(
    'select id, email from public.users where id = $1',
    [userId],
  )
  return rows[0] ?? null
}

// ── Session (Bearer token) ─────────────────────────────────────────────────────
export async function createSession(userId: string): Promise<string> {
  const pool = getPgPool()
  const rawToken = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + SESSION_TTL_MS)
  await pool.query(
    'insert into public.sessions (session_token, user_id, expires) values ($1, $2, $3)',
    [hashToken(rawToken), userId, expires],
  )
  return rawToken
}

export async function validateSessionToken(rawToken: string): Promise<{ userId: string } | null> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ user_id: string; expires: Date }>(
    'select user_id, expires from public.sessions where session_token = $1',
    [hashToken(rawToken)],
  )
  const session = rows[0]
  if (!session) return null
  if (new Date(session.expires).getTime() < Date.now()) {
    // Hết hạn — dọn luôn (best-effort, không chặn request nếu lỗi)
    void pool
      .query('delete from public.sessions where session_token = $1', [hashToken(rawToken)])
      .catch(() => undefined)
    return null
  }
  return { userId: session.user_id }
}

export async function revokeSession(rawToken: string): Promise<void> {
  const pool = getPgPool()
  await pool.query('delete from public.sessions where session_token = $1', [hashToken(rawToken)])
}

// ── Profile (tối thiểu cho luồng auth — phần còn lại của `profiles` thuộc Giai đoạn C) ──
export interface ProfileInfo {
  plan: Plan
  onboarded: boolean
  name: string
  // Hạn gói VIP hiện tại (ISO string), null = gói vĩnh viễn HOẶC đang Free. Cần cho UI
  // hiển thị "còn X ngày dùng thử" (banner trial/upsell) — xem src/lib/planExpiry.ts.
  planExpiresAt: string | null
  // `true` = "Người tiên phong" (một trong 2026 tài khoản đầu tiên, VIP vĩnh viễn) — CHỈ để
  // hiển thị huy hiệu. Quyền VIP vẫn do cặp (plan, plan_expires_at) quyết định như mọi user
  // khác; xem packages/core-billing/founder.ts.
  isFounder: boolean
}

// Tạo profile nếu chưa có (khớp hành vi trigger handle_new_user cũ của Supabase, nhưng
// chạy trong code server thay vì trigger DB ẩn) rồi trả thông tin hiện tại.
export async function ensureProfileRow(userId: string, name: string): Promise<ProfileInfo> {
  const pool = getPgPool()
  const inserted = await pool.query<{ id: string }>(
    'insert into public.profiles (id, name) values ($1, $2) on conflict (id) do nothing returning id',
    [userId, name],
  )
  // Profile vừa được tạo lần đầu (không phải user cũ) → nếu email nằm trong danh sách VIP
  // (public.vip_whitelist, quản lý qua /admin) thì cấp VIP vĩnh viễn ngay, không cần chờ admin
  // thao tác tay. Xem api/admin-vip-whitelist.ts.
  if ((inserted.rowCount ?? 0) > 0) {
    await pool.query(
      `update public.profiles set plan = 'vip', plan_expires_at = null
       where id = $1
         and exists (
           select 1 from public.vip_whitelist w
           join public.users u on lower(u.email) = w.email
           where u.id = $1
         )`,
      [userId],
    )
  }
  // "Ưu đãi Người tiên phong": 2026 tài khoản ĐẦU TIÊN được VIP vĩnh viễn. Gọi ở đây (chứ
  // không chỉ trong migration) để nếu lúc migration chạy tổng số tài khoản còn dưới 2026 thì
  // người đăng ký tiếp theo vẫn được cấp, cho tới khi đủ suất. Hàm SQL tự kiểm hạn ngạch dưới
  // khoá tư vấn nên gọi lại nhiều lần vô hại.
  if ((inserted.rowCount ?? 0) > 0) {
    await grantFounderIfAvailable(userId, pool)
  }

  const { rows } = await pool.query<{
    plan: string
    plan_expires_at: Date | null
    onboarded: boolean
    name: string | null
    is_founder: boolean | null
  }>(
    'select plan, plan_expires_at, onboarded, name, is_founder from public.profiles where id = $1',
    [userId],
  )
  const row = rows[0]
  const plan = resolvePlan(row?.plan, row?.plan_expires_at)
  return {
    plan,
    onboarded: !!row?.onboarded,
    name: row?.name ?? name,
    // Chỉ có ý nghĩa khi gói ĐANG hiệu lực và có hạn (không phải gói vĩnh viễn/Free) — Free
    // luôn null dù cột DB có giá trị cũ sót lại (tránh hiểu nhầm "Free sắp hết hạn").
    planExpiresAt:
      plan !== 'free' && row?.plan_expires_at ? row.plan_expires_at.toISOString() : null,
    isFounder: row?.is_founder === true,
  }
}

// packages/core-ui/clientAuth.ts — Xác thực phía client dùng chung cho toàn bộ hệ sinh thái (Hub & Subdomains).
// Quản lý đăng nhập, đăng ký, OAuth 2.0 (Google, Facebook, Apple, Microsoft), SSO cookie và chuyển hướng an toàn.

import { z } from 'zod'
import { setStoredToken, clearStoredToken, getAuthHeader, getStoredToken } from './authHeader.js'

// GĐ1 2026-09-12 (docs/specs/2026-09-12-gd1-xoa-goi-pro.md): chỉ còn Free + VIP.
// PHẢI khớp packages/core-billing/plan.ts (server là nguồn sự thật) và apps/dhcb/src/types.ts.
export type Plan = 'free' | 'vip'

export interface AppUser {
  id: string
  email: string
  name: string
  plan: Plan
  onboarded: boolean
  planExpiresAt?: string | null
  emailVerified?: boolean
  isAdmin?: boolean
  /** Một trong 2026 tài khoản đầu tiên — VIP vĩnh viễn, chỉ dùng để hiện huy hiệu. */
  isFounder?: boolean
  createdAt: number
}

interface AuthApiUser {
  id: string
  email: string
  name: string
  plan: Plan
  onboarded: boolean
  planExpiresAt?: string | null
  isFounder?: boolean
  createdAt: number
}

// ── Kiểm tra và làm sạch URL chuyển hướng (Safe Redirect URL) ───────────────────────────
// Chống lỗ hổng Open Redirect Attack: chỉ cho phép các URL nội bộ hoặc thuộc hệ sinh thái Đồng Hành.
const ALLOWED_REDIRECT_ORIGINS = new Set([
  'https://donghanhcungban.org',
  'https://www.donghanhcungban.org',
  'https://en-vi.donghanhcungban.org',
])
const DEV_REDIRECT_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
])

function hasUnsafeRedirectCharacters(value: string, rejectSpace = false): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return character === '\\' || code < (rejectSpace ? 33 : 32) || code === 127
  })
}

export function getSafeRedirectUrl(
  redirectParam: string | null | undefined,
  fallbackUrl = 'https://www.donghanhcungban.org/',
): string {
  if (!redirectParam) return fallbackUrl
  // Chặn ký tự điều khiển và gạch chéo ngược trước khi URL tự chuẩn hóa.
  if (hasUnsafeRedirectCharacters(redirectParam, true)) return fallbackUrl
  try {
    const decoded = decodeURIComponent(redirectParam)
    if (hasUnsafeRedirectCharacters(decoded)) return fallbackUrl
    if (redirectParam.startsWith('/')) {
      if (decoded.startsWith('//')) return fallbackUrl
      const parsed = new URL(redirectParam, 'https://www.donghanhcungban.org')
      return parsed.origin === 'https://www.donghanhcungban.org' &&
        !parsed.pathname.startsWith('//')
        ? `${parsed.pathname}${parsed.search}${parsed.hash}`
        : fallbackUrl
    }
    const parsed = new URL(redirectParam)
    if (parsed.username || parsed.password) return fallbackUrl
    if (
      ALLOWED_REDIRECT_ORIGINS.has(parsed.origin) ||
      (import.meta.env.DEV && DEV_REDIRECT_ORIGINS.has(parsed.origin))
    )
      return parsed.toString()
  } catch {
    // URL hoặc chuỗi mã hóa phần trăm không hợp lệ.
  }
  return fallbackUrl
}

export function isValidNewPassword(password: string): boolean {
  return Array.from(password).length >= 15 && new TextEncoder().encode(password).byteLength <= 72
}

const authApiUserSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  name: z.string(),
  plan: z.enum(['free', 'vip']),
  onboarded: z.boolean(),
  planExpiresAt: z.string().nullable().optional(),
  isFounder: z.boolean().optional(),
  createdAt: z.number(),
})
const authResponseSchema = z.object({ authenticated: z.literal(true), user: authApiUserSchema })

// ── Gọi API xác thực ──────────────────────────────────────────────────────────────────
export async function callAuthApi(
  body: Record<string, unknown>,
): Promise<{ authenticated: true; user: AuthApiUser } | null> {
  const resp = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!resp.ok) return null
  const parsed = authResponseSchema.safeParse(await resp.json())
  return parsed.success ? parsed.data : null
}

export async function register(
  email: string,
  name: string,
  password: string,
): Promise<AppUser | null> {
  const result = await callAuthApi({ action: 'register', email, name, password })
  if (!result) return null
  setStoredToken()
  return result.user
}

export async function login(email: string, password: string): Promise<AppUser | null> {
  const result = await callAuthApi({ action: 'login', email, password })
  if (!result) return null
  setStoredToken()
  return result.user
}

// ── Google OAuth (Google Identity Services) ───────────────────────────────────────────
export class GoogleAuthError extends Error {
  constructor(
    public readonly code:
      'popup_blocked' | 'popup_closed' | 'access_denied' | 'origin_mismatch' | 'unknown',
    message: string,
  ) {
    super(message)
    this.name = 'GoogleAuthError'
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: {
              access_token?: string
              error?: string
              error_description?: string
            }) => void
            error_callback?: (err: { type?: string; message?: string }) => void
          }) => { requestAccessToken: (overrideConfig?: { prompt?: string }) => void }
        }
      }
    }
  }
}

let googleInitPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (googleInitPromise) return googleInitPromise
  googleInitPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không tải được Google Identity Services'))
    document.head.appendChild(script)
  })
  return googleInitPromise
}

export async function loginWithGoogle(): Promise<AppUser | null> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!clientId) throw new Error('Thiếu VITE_GOOGLE_CLIENT_ID')

  // Không await microtask nếu script đã có sẵn để bảo toàn User Activation cho Chrome
  if (!window.google?.accounts?.oauth2) {
    await loadGoogleScript()
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (resp) => {
          if (!resp.access_token) {
            if (resp.error) {
              console.warn(
                '[auth] Google OAuth response error:',
                resp.error,
                resp.error_description,
              )
            }
            resolve(null)
            return
          }
          void callAuthApi({ action: 'google-token', accessToken: resp.access_token })
            .then((result) => {
              if (!result) {
                resolve(null)
                return
              }
              setStoredToken()
              resolve(result.user)
            })
            .catch(reject)
        },
        error_callback: (err) => {
          console.warn('[auth] Google OAuth error_callback:', err)
          if (err?.type === 'popup_closed') {
            resolve(null)
            return
          }
          if (err?.type === 'popup_blocked_by_browser') {
            reject(
              new GoogleAuthError(
                'popup_blocked',
                'Trình duyệt đang chặn cửa sổ Popup Google. Vui lòng cho phép popup trên thanh địa chỉ hoặc chọn chế độ chuyển trang.',
              ),
            )
            return
          }
          if (err?.type === 'origin_mismatch') {
            reject(
              new GoogleAuthError(
                'origin_mismatch',
                'Tên miền hiện tại chưa được cấp phép trong Google Cloud Console (Authorized JavaScript origins).',
              ),
            )
            return
          }
          if (err?.type === 'access_denied') {
            reject(
              new GoogleAuthError('access_denied', 'Bạn đã từ chối cấp quyền đăng nhập Google.'),
            )
            return
          }
          resolve(null)
        },
      })

      client.requestAccessToken({ prompt: 'select_account' })
    } catch (err) {
      reject(err)
    }
  })
}

// `state` của OAuth là token CHỐNG CSRF: kẻ tấn công đoán được nó thì ghép được phản hồi đăng
// nhập của mình vào phiên của nạn nhân. Vì vậy phải lấy từ `crypto.getRandomValues` (nguồn mật
// mã của trình duyệt), KHÔNG phải Math.random — V8 dùng xorshift128+, suy được trạng thái từ
// vài giá trị đã thấy nên token sinh ra đoán được (audit 2026-08-28, F7).
// 16 byte = 128 bit, hiện dạng hex.
function randomStateToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Đăng nhập Google qua Luồng Chuyển Hướng (Universal OAuth2 Redirect Flow) ───────────
export function loginWithGoogleRedirect(redirectPath = '/login'): void {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!clientId) throw new Error('Thiếu VITE_GOOGLE_CLIENT_ID')

  const redirectUri = `${window.location.origin}${redirectPath}`
  const state = randomStateToken()
  try {
    sessionStorage.setItem('oauth_state_google', state)
  } catch {
    throw new Error('Không lưu được trạng thái bảo mật OAuth; hãy dùng cửa sổ đăng nhập')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Xử lý callback sau khi quay lại từ Google OAuth Redirect
export async function handleOAuthRedirectCallback(): Promise<AppUser | null> {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const hashParams = new URLSearchParams(hash)
  const accessTokenFromHash = hashParams.get('access_token')

  const searchParams = new URLSearchParams(window.location.search)
  const accessTokenFromSearch = searchParams.get('access_token')

  const accessToken = accessTokenFromHash || accessTokenFromSearch
  if (!accessToken) return null

  window.history.replaceState({}, document.title, window.location.pathname)
  const returnedState = hashParams.get('state') || searchParams.get('state')
  let expectedState: string | null = null
  try {
    expectedState = sessionStorage.getItem('oauth_state_google')
    sessionStorage.removeItem('oauth_state_google')
  } catch {
    return null
  }
  if (!expectedState || returnedState !== expectedState) return null

  try {
    const result = await callAuthApi({ action: 'google-token', accessToken })
    if (!result) return null

    setStoredToken()

    const cleanUrl = window.location.pathname
    window.history.replaceState({}, document.title, cleanUrl)

    return result.user
  } catch (err) {
    console.error('[auth] Lỗi xử lý Google OAuth Redirect Callback:', err)
    return null
  }
}

// ── Facebook Login ─────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
      login: (
        callback: (resp: { status: string; authResponse?: { accessToken: string } }) => void,
        options: { scope: string },
      ) => void
    }
  }
}

let facebookInitPromise: Promise<void> | null = null

function loadFacebookScript(appId: string): Promise<void> {
  if (facebookInitPromise) return facebookInitPromise
  facebookInitPromise = new Promise((resolve, reject) => {
    if (window.FB) {
      resolve()
      return
    }
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, cookie: false, xfbml: false, version: 'v21.0' })
      resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Không tải được Facebook SDK'))
    document.head.appendChild(script)
  })
  return facebookInitPromise
}

export async function loginWithFacebook(): Promise<AppUser | null> {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined
  if (!appId) throw new Error('Thiếu VITE_FACEBOOK_APP_ID')

  await loadFacebookScript(appId)

  return new Promise((resolve, reject) => {
    window.FB!.login(
      (resp) => {
        if (resp.status !== 'connected' || !resp.authResponse) {
          resolve(null)
          return
        }
        void callAuthApi({ action: 'facebook', accessToken: resp.authResponse.accessToken })
          .then((result) => {
            if (!result) {
              resolve(null)
              return
            }
            setStoredToken()
            resolve(result.user)
          })
          .catch(reject)
      },
      { scope: 'email' },
    )
  })
}

// ── Apple Sign In ──────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope: string
          redirectURI: string
          usePopup: boolean
        }) => void
        signIn: () => Promise<{
          authorization: { id_token: string }
          user?: { name?: { firstName?: string; lastName?: string } }
        }>
      }
    }
  }
}

let appleInitPromise: Promise<void> | null = null

function loadAppleScript(): Promise<void> {
  if (appleInitPromise) return appleInitPromise
  appleInitPromise = new Promise((resolve, reject) => {
    if (window.AppleID) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src =
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không tải được Sign in with Apple JS'))
    document.head.appendChild(script)
  })
  return appleInitPromise
}

export async function loginWithApple(): Promise<AppUser | null> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined
  if (!clientId) throw new Error('Thiếu VITE_APPLE_CLIENT_ID')

  await loadAppleScript()
  window.AppleID!.auth.init({
    clientId,
    scope: 'name email',
    redirectURI: window.location.origin,
    usePopup: true,
  })

  const resp = await window.AppleID!.auth.signIn()
  const first = resp.user?.name?.firstName
  const last = resp.user?.name?.lastName
  const name = [first, last].filter(Boolean).join(' ').trim() || undefined

  const result = await callAuthApi({
    action: 'apple',
    idToken: resp.authorization.id_token,
    ...(name ? { name } : {}),
  })
  if (!result) return null
  setStoredToken()
  return result.user
}

// ── Microsoft Sign In ──────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    msal?: {
      PublicClientApplication: new (config: { auth: { clientId: string; authority: string } }) => {
        initialize: () => Promise<void>
        loginPopup: (request: { scopes: string[] }) => Promise<{ idToken: string }>
      }
    }
  }
}

let microsoftInitPromise: Promise<void> | null = null

function loadMicrosoftScript(): Promise<void> {
  if (microsoftInitPromise) return microsoftInitPromise
  microsoftInitPromise = new Promise((resolve, reject) => {
    if (window.msal) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://alcdn.msauth.net/browser/3.7.1/js/msal-browser.min.js'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không tải được MSAL.js'))
    document.head.appendChild(script)
  })
  return microsoftInitPromise
}

export async function loginWithMicrosoft(): Promise<AppUser | null> {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string | undefined
  if (!clientId) throw new Error('Thiếu VITE_MICROSOFT_CLIENT_ID')

  await loadMicrosoftScript()
  const app = new window.msal!.PublicClientApplication({
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/common',
    },
  })
  await app.initialize()

  const resp = await app.loginPopup({ scopes: ['openid', 'profile', 'email'] })
  const result = await callAuthApi({ action: 'microsoft', idToken: resp.idToken })
  if (!result) return null
  setStoredToken()
  return result.user
}

// ── Đăng xuất & Lấy thông tin user hiện tại ─────────────────────────────────────────────
export async function logout(): Promise<void> {
  await callAuthApi({ action: 'logout' }).catch(() => undefined)
  clearStoredToken()
}

/** Nạp cờ UI từ cookie SSO mà không đọc hay nhận token bí mật. */
async function adoptSessionFromCookie(): Promise<AppUser | null> {
  try {
    const data = await callAuthApi({ action: 'session-from-cookie' })
    if (!data) return null
    setStoredToken()
    return data.user
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!getStoredToken()) {
    const adopted = await adoptSessionFromCookie()
    if (!adopted) return null
    if (!getStoredToken()) return adopted
  }

  const resp = await fetch('/api/auth?action=me', {
    headers: getAuthHeader(),
    credentials: 'include',
  })
  if (!resp.ok) {
    if (resp.status === 401) clearStoredToken()
    return null
  }
  const profile = (await resp.json()) as {
    id: string
    email: string
    name: string
    plan: Plan
    onboarded: boolean
    planExpiresAt?: string | null
    emailVerified?: boolean
    isAdmin?: boolean
    isFounder?: boolean
  }
  return { ...profile, createdAt: Date.now() }
}

/** Đọc lại phiên mà không diễn giải lỗi server thành đăng xuất. Không tự đổi token. */
export class SessionVerificationError extends Error {
  constructor(public readonly reason: 'unauthorized' | 'http' | 'invalid-response') {
    super('Không xác nhận được phiên đăng nhập')
    this.name = 'SessionVerificationError'
  }
}

const verifiedUserSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  name: z.string(),
  plan: z.enum(['free', 'vip']),
  onboarded: z.boolean(),
  planExpiresAt: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  isFounder: z.boolean().optional(),
})

export async function getCurrentUserVerified(): Promise<AppUser> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const resp = await fetch('/api/auth?action=me', {
      headers: getAuthHeader(),
      credentials: 'include',
      signal: controller.signal,
    })
    if (!resp.ok) throw new SessionVerificationError(resp.status === 401 ? 'unauthorized' : 'http')
    const parsed = verifiedUserSchema.safeParse(await resp.json())
    if (!parsed.success) throw new SessionVerificationError('invalid-response')
    return { ...parsed.data, createdAt: Date.now() }
  } finally {
    clearTimeout(timer)
  }
}

export function clearProfileCache(): void {
  /* no-op */
}

// Chỉ Google đang hiển thị (quyết định 2026-10-06). Giữ adapter của các nhà cung cấp
// cũ để không xoá liên kết tài khoản; không tải SDK không dùng trên màn đăng nhập.
export function preloadOAuthProviders(): void {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (googleClientId) void loadGoogleScript().catch(() => undefined)
}

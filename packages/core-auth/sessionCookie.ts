// Cookie phiên HttpOnly; JavaScript trình duyệt không nhận thông tin xác thực.
// Request sửa dữ liệu bằng cookie còn cần Origin tin cậy tại bộ chuyển đổi API.

import { SESSION_TTL_MS } from './authService.js'

export const SESSION_COOKIE_NAME = 'session_token'

// COOKIE_DOMAIN mặc định đúng domain gốc đã chốt ở ADR-0002 — set qua env để override khi cần
// (vd môi trường staging dùng domain khác). Để trống (dev local/localhost) thì KHÔNG set thuộc
// tính Domain — trình duyệt tự giới hạn cookie vào đúng host hiện tại, tránh lỗi cookie bị từ
// chối vì Domain không khớp origin (vd chạy `npm run dev` ở localhost).
// Đọc lại process.env MỖI LẦN gọi (không cache ở module scope) — test đổi biến môi trường
// giữa các case, và về nguyên tắc process.env có thể đổi runtime nếu process manager reload.
function getCookieDomain(reqHost?: string): string {
  if (process.env.COOKIE_DOMAIN) return process.env.COOKIE_DOMAIN
  if (reqHost && /^(?:[a-z0-9-]+\.)*donghanhcungban\.com(?::[0-9]+)?$/i.test(reqHost)) {
    return '.donghanhcungban.com'
  }
  return '.donghanhcungban.org'
}
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
}

// Dựng giá trị header Set-Cookie cho phiên đăng nhập mới — gọi cùng lúc tạo Bearer token.
export function buildSessionCookie(token: string, reqHost?: string): string {
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000)
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ]
  // Secure bắt buộc đi kèm domain cha production (HTTPS) — bỏ ở dev để cookie hoạt động qua
  // http://localhost (browser từ chối cookie Secure trên kết nối không mã hoá).
  if (isProduction()) {
    parts.push('Secure')
    parts.push(`Domain=${getCookieDomain(reqHost)}`)
  }
  return parts.join('; ')
}

// Xoá cookie lúc đăng xuất — cùng thuộc tính Domain/Path như lúc set, khác đi trình duyệt sẽ
// coi là cookie khác và không xoá được cookie cũ.
export function buildClearSessionCookie(reqHost?: string): string {
  const parts = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (isProduction()) {
    parts.push('Secure')
    parts.push(`Domain=${getCookieDomain(reqHost)}`)
  }
  return parts.join('; ')
}

// Đọc session token từ header Cookie thô (Web API Request không tự parse cookie).
export function readSessionCookie(req: Request): string | null {
  const header = req.headers.get('Cookie') ?? req.headers.get('cookie')
  if (!header) return null

  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    const name = pair.slice(0, eq).trim()
    if (name === SESSION_COOKIE_NAME) {
      try {
        return decodeURIComponent(pair.slice(eq + 1).trim())
      } catch {
        return null
      }
    }
  }
  return null
}

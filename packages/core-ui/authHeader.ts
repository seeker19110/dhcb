// Phiên được xác thực duy nhất bằng cookie HttpOnly. localStorage chỉ chứa cờ UI
// không bí mật, thay đổi theo lần đăng nhập để bỏ kết quả bất đồng bộ từ phiên cũ.
import { getGuestHeader } from './guestId.js'

const LEGACY_TOKEN_KEY = 'gsa_session_token_v1'
export const SESSION_MARKER_KEY = 'gsa_session_present_v1'

/** Tên cũ giữ tương thích với các caller kiểm sự hiện diện phiên; KHÔNG trả secret. */
export function getStoredToken(): string | null {
  try {
    const legacy = localStorage.getItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    let marker = localStorage.getItem(SESSION_MARKER_KEY)
    if (legacy && !marker) {
      marker = `session:${crypto.randomUUID()}`
      localStorage.setItem(SESSION_MARKER_KEY, marker)
    }
    return marker?.startsWith('session:') ? marker : null
  } catch {
    return null
  }
}

/** Chỉ lưu cờ không bí mật; bỏ qua đối số token của caller phiên bản cũ. */
export function setStoredToken(legacyToken?: string): void {
  void legacyToken
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.setItem(SESSION_MARKER_KEY, `session:${crypto.randomUUID()}`)
  } catch {
    /* Cookie vẫn hoạt động khi localStorage bị chặn. */
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(SESSION_MARKER_KEY)
  } catch {
    /* ignore */
  }
}

/** Cookie HttpOnly không được đọc hay chuyển thành bearer token. */
export function getAccessToken(): undefined {
  return undefined
}

export function getAuthHeader(): Record<string, string> {
  return getStoredToken() ? {} : getGuestHeader()
}

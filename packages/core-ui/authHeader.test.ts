import { describe, it, expect, beforeEach } from 'vitest'
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getAccessToken,
  getAuthHeader,
} from './authHeader.js'

beforeEach(() => {
  localStorage.clear()
})

describe('getStoredToken/setStoredToken/clearStoredToken', () => {
  it('chưa lưu gì → null', () => {
    expect(getStoredToken()).toBeNull()
  })

  it('chỉ lưu cờ, loại bỏ secret phiên', () => {
    setStoredToken('abc123')
    expect(getStoredToken()).toMatch(/^session:/)
    expect(localStorage.getItem('gsa_session_token_v1')).toBeNull()
    expect(JSON.stringify(localStorage)).not.toContain('abc123')
  })

  it('xoá token → đọc lại null', () => {
    setStoredToken('abc123')
    clearStoredToken()
    expect(getStoredToken()).toBeNull()
  })

  // `vi.spyOn(Storage.prototype, ...)` KHÔNG dùng ở đây dù chạy đúng logic (đã xác minh thủ công) —
  // v8 coverage provider của Vitest không ghi nhận nhánh `catch` được chạm khi spy ở tầng
  // prototype xen giữa các lệnh gọi `localStorage` bình thường khác trong cùng file test (bug
  // công cụ, không phải bug code). Thay `window.localStorage` toàn bộ bằng
  // `Object.defineProperty` để v8 coverage đếm đúng nhánh catch.
  function withBlockedLocalStorage<T>(stub: Partial<Storage>, run: () => T): T {
    const original = window.localStorage
    Object.defineProperty(window, 'localStorage', { configurable: true, value: stub })
    try {
      return run()
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: original })
    }
  }

  it('localStorage bị chặn (throw) → getStoredToken trả null, không throw', () => {
    const result = withBlockedLocalStorage(
      {
        getItem() {
          throw new Error('blocked')
        },
      },
      () => getStoredToken(),
    )
    expect(result).toBeNull()
  })

  it('localStorage bị chặn (throw) → setStoredToken không throw', () => {
    withBlockedLocalStorage(
      {
        setItem() {
          throw new Error('blocked')
        },
      },
      () => expect(() => setStoredToken('x')).not.toThrow(),
    )
  })

  it('localStorage bị chặn (throw) → clearStoredToken không throw', () => {
    withBlockedLocalStorage(
      {
        removeItem() {
          throw new Error('blocked')
        },
      },
      () => expect(() => clearStoredToken()).not.toThrow(),
    )
  })
})

describe('getAccessToken', () => {
  it('chưa đăng nhập → undefined (không phải null)', () => {
    expect(getAccessToken()).toBeUndefined()
  })

  it('đã đăng nhập cũng không đọc được secret cookie', () => {
    setStoredToken('tok-1')
    expect(getAccessToken()).toBeUndefined()
  })
})

describe('getAuthHeader', () => {
  // [2026-09-15 — chế độ Khách] Trước đây kỳ vọng ở đây là header RỖNG. Đổi có chủ ý: chưa
  // đăng nhập nay gửi danh tính khách ẩn danh để 3 endpoint AI/audio đếm được lượt dùng thử.
  it('chưa đăng nhập → gửi danh tính khách, KHÔNG có Authorization', () => {
    const headers = getAuthHeader()
    expect(headers.Authorization).toBeUndefined()
    expect(headers['X-Guest-Id']).toMatch(/^guest_/)
  })

  it('đã đăng nhập → cookie xác thực, không có Authorization hoặc id khách', () => {
    setStoredToken('tok-2')
    expect(getAuthHeader()).toEqual({})
  })
})

it('tự loại bỏ token legacy, giữ cờ đăng nhập không bí mật', () => {
  localStorage.setItem('gsa_session_token_v1', 'secret-legacy')
  expect(getStoredToken()).toMatch(/^session:/)
  expect(localStorage.getItem('gsa_session_token_v1')).toBeNull()
  expect(getAuthHeader()).toEqual({})
})

it('cờ đổi theo mỗi lần đăng nhập để bỏ callback của tài khoản cũ', () => {
  setStoredToken()
  const previous = getStoredToken()
  setStoredToken()
  expect(getStoredToken()).not.toBe(previous)
})

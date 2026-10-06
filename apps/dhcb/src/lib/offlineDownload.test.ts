// Test chính sách tải ngầm dữ liệu học ngoại tuyến (audit 2026-09-30 M14) — đủ ca biên của điều
// kiện tải: khách / chưa học / Save-Data / công tắc tắt / trình duyệt không hỗ trợ.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  OFFLINE_DOWNLOAD_EVENT,
  OFFLINE_DOWNLOAD_KEY,
  formatMegabytes,
  isOfflineDownloadEnabled,
  isSaveDataOn,
  precacheBlockReason,
  readPrecacheConditions,
  setOfflineDownloadEnabled,
  type PrecacheConditions,
} from './offlineDownload'

const OK: PrecacheConditions = {
  isProd: true,
  hasCacheStorage: true,
  hasAccount: true,
  hasStudied: true,
  enabled: true,
  saveData: false,
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('precacheBlockReason', () => {
  it('đủ mọi điều kiện → được tải (null)', () => {
    expect(precacheBlockReason(OK)).toBeNull()
  })

  it.each<[Partial<PrecacheConditions>, string]>([
    [{ isProd: false }, 'unsupported'],
    [{ hasCacheStorage: false }, 'unsupported'],
    [{ enabled: false }, 'disabled'],
    [{ saveData: true }, 'save-data'],
    [{ hasAccount: false, hasStudied: false }, 'guest'],
    [{ hasStudied: false }, 'not-studied'],
  ])('%o → %s', (patch, reason) => {
    expect(precacheBlockReason({ ...OK, ...patch })).toBe(reason)
  })

  it('khách vãng lai có lịch sử học trên máy vẫn KHÔNG được tải (cần tài khoản thật)', () => {
    expect(precacheBlockReason({ ...OK, hasAccount: false, hasStudied: true })).toBe('guest')
  })

  it('lựa chọn của người dùng (tắt công tắc) nói trước lý do "chưa đủ điều kiện"', () => {
    expect(precacheBlockReason({ ...OK, enabled: false, saveData: true, hasAccount: false })).toBe(
      'disabled',
    )
  })

  it('Save-Data nói trước "chưa đăng nhập"', () => {
    expect(precacheBlockReason({ ...OK, saveData: true, hasAccount: false })).toBe('save-data')
  })
})

describe('công tắc "Tải để học ngoại tuyến"', () => {
  it('mặc định BẬT khi chưa chọn gì', () => {
    expect(isOfflineDownloadEnabled()).toBe(true)
  })

  it('tắt → lưu "0" và đọc lại là tắt; bật lại → xoá khoá, về mặc định bật', () => {
    setOfflineDownloadEnabled(false)
    expect(localStorage.getItem(OFFLINE_DOWNLOAD_KEY)).toBe('0')
    expect(isOfflineDownloadEnabled()).toBe(false)
    setOfflineDownloadEnabled(true)
    expect(localStorage.getItem(OFFLINE_DOWNLOAD_KEY)).toBeNull()
    expect(isOfflineDownloadEnabled()).toBe(true)
  })

  it('giá trị lạ trong localStorage → coi là bật (chỉ "0" mới là tắt)', () => {
    localStorage.setItem(OFFLINE_DOWNLOAD_KEY, 'false')
    expect(isOfflineDownloadEnabled()).toBe(true)
  })

  it('đổi công tắc phát sự kiện kèm trạng thái mới', () => {
    const seen: unknown[] = []
    const on = (e: Event) => seen.push((e as CustomEvent).detail)
    window.addEventListener(OFFLINE_DOWNLOAD_EVENT, on)
    setOfflineDownloadEnabled(false)
    setOfflineDownloadEnabled(true)
    window.removeEventListener(OFFLINE_DOWNLOAD_EVENT, on)
    expect(seen).toEqual([{ enabled: false }, { enabled: true }])
  })

  it('localStorage bị chặn → đọc ra mặc định bật, ghi không throw và vẫn phát sự kiện', () => {
    localStorage.setItem(OFFLINE_DOWNLOAD_KEY, '0') // nếu đọc được thì sẽ ra "tắt"
    const g = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const st = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const on = vi.fn()
    window.addEventListener(OFFLINE_DOWNLOAD_EVENT, on)
    expect(isOfflineDownloadEnabled()).toBe(true)
    expect(() => setOfflineDownloadEnabled(false)).not.toThrow()
    window.removeEventListener(OFFLINE_DOWNLOAD_EVENT, on)
    expect(on).toHaveBeenCalledTimes(1)
    g.mockRestore()
    st.mockRestore()
  })
})

describe('isSaveDataOn', () => {
  it('trình duyệt không có navigator.connection (Safari/Firefox) → false', () => {
    expect(isSaveDataOn({})).toBe(false)
  })
  it('connection.saveData = true → true', () => {
    expect(isSaveDataOn({ connection: { saveData: true } })).toBe(true)
  })
  it('connection.saveData = false / thiếu → false', () => {
    expect(isSaveDataOn({ connection: { saveData: false } })).toBe(false)
    expect(isSaveDataOn({ connection: {} })).toBe(false)
  })
  it('navigator vắng mặt → false', () => {
    expect(isSaveDataOn(undefined)).toBe(false)
  })
  it('mặc định đọc navigator thật', () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } })
    expect(isSaveDataOn()).toBe(true)
  })
})

describe('readPrecacheConditions', () => {
  const UID = 'u-123'
  function studied(uid: string) {
    localStorage.setItem(
      `et_usage_${uid}_2026-10-01`,
      JSON.stringify({ date: '2026-10-01', chatCount: 1, writingCount: 0, speakingCount: 0 }),
    )
  }

  it('chưa đăng nhập (null) → không tài khoản, không học', () => {
    const c = readPrecacheConditions(null, true)
    expect(c.hasAccount).toBe(false)
    expect(c.hasStudied).toBe(false)
    expect(precacheBlockReason({ ...c, hasCacheStorage: true })).toBe('guest')
  })

  it('khách vãng lai có lịch sử học → vẫn không tính (không quét lịch sử)', () => {
    studied('guest_abc')
    const c = readPrecacheConditions({ id: 'guest_abc', isGuest: true }, true)
    expect(c.hasAccount).toBe(false)
    expect(c.hasStudied).toBe(false)
  })

  it('tài khoản thật chưa học → not-studied', () => {
    const c = readPrecacheConditions({ id: UID }, true)
    expect(c.hasAccount).toBe(true)
    expect(precacheBlockReason({ ...c, hasCacheStorage: true })).toBe('not-studied')
  })

  it('tài khoản thật đã học 1 phiên → được tải', () => {
    studied(UID)
    const c = readPrecacheConditions({ id: UID }, true)
    expect(precacheBlockReason({ ...c, hasCacheStorage: true })).toBeNull()
  })

  it('bản dev (isProd=false) → unsupported dù đủ điều kiện khác', () => {
    studied(UID)
    expect(precacheBlockReason(readPrecacheConditions({ id: UID }, false))).toBe('unsupported')
  })

  it('đọc công tắc + Save-Data thật', () => {
    setOfflineDownloadEnabled(false)
    vi.stubGlobal('navigator', { connection: { saveData: true } })
    const c = readPrecacheConditions({ id: UID }, true)
    expect(c.enabled).toBe(false)
    expect(c.saveData).toBe(true)
  })

  it('isProd mặc định lấy từ import.meta.env.PROD (vitest = false)', () => {
    expect(readPrecacheConditions(null).isProd).toBe(false)
  })
})

describe('formatMegabytes', () => {
  it('tiếng Việt dùng dấu phẩy, tiếng Anh dùng dấu chấm', () => {
    expect(formatMegabytes(23_500_000)).toBe('23,5 MB')
    expect(formatMegabytes(23_500_000, 'en')).toBe('23.5 MB')
  })
  it('0, âm, NaN → "0 MB"', () => {
    expect(formatMegabytes(0)).toBe('0 MB')
    expect(formatMegabytes(-5)).toBe('0 MB')
    expect(formatMegabytes(Number.NaN)).toBe('0 MB')
  })
  it('rất nhỏ nhưng > 0 → "0,1 MB" (không ghi 0 cho thứ có thật)', () => {
    expect(formatMegabytes(10)).toBe('0,1 MB')
  })
})

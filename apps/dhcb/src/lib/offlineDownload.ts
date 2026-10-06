// apps/dhcb/src/lib/offlineDownload.ts — CHÍNH SÁCH tải ngầm dữ liệu học ngoại tuyến.
//
// Bối cảnh (audit 2026-09-30 M14): trước đây MỌI người — kể cả khách vào lần đầu — bị tải ngầm
// ~23,5 MB `/data/*` (≈ 315 yêu cầu trong vài giây đầu), không kiểm Save-Data, không có cách tắt.
// Quyết định chủ dự án 2026-10-05: CHỈ tải khi (1) đã đăng nhập tài khoản thật (không phải khách)
// VÀ (2) đã học ít nhất một phiên; bỏ qua khi máy bật Save-Data; có công tắc "Tải để học ngoại
// tuyến" ở Cài đặt, MẶC ĐỊNH BẬT.
//
// File này chỉ chứa phần QUYẾT ĐỊNH (hàm thuần + đọc/ghi công tắc) để test đủ ca biên; phần tải
// thật nằm ở `dataPrecache.ts`, phần gắn vào app ở `components/DataPrecacheGate.tsx`.

import type { User } from '../types'
import { hasEverStudied } from './storage'

// Công tắc lưu theo MÁY (không đồng bộ đa thiết bị): dữ liệu tải về nằm trên máy này, máy khác có
// thể là điện thoại dùng 4G cần tắt riêng. Giá trị: '0' = tắt; vắng mặt / khác = bật (mặc định).
export const OFFLINE_DOWNLOAD_KEY = 'et_offline_download'
// Sự kiện phát trên window khi công tắc đổi — cổng tải ngầm nghe để dừng/chạy lại ngay.
export const OFFLINE_DOWNLOAD_EVENT = 'offline-download-setting'

export function isOfflineDownloadEnabled(): boolean {
  try {
    return localStorage.getItem(OFFLINE_DOWNLOAD_KEY) !== '0'
  } catch {
    // localStorage bị chặn — không đọc được lựa chọn thì giữ mặc định (bật).
    return true
  }
}

export function setOfflineDownloadEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.removeItem(OFFLINE_DOWNLOAD_KEY)
    else localStorage.setItem(OFFLINE_DOWNLOAD_KEY, '0')
  } catch {
    /* localStorage bị chặn — vẫn phát sự kiện để phiên hiện tại dừng/chạy đúng ý */
  }
  window.dispatchEvent(new CustomEvent(OFFLINE_DOWNLOAD_EVENT, { detail: { enabled } }))
}

// Network Information API (Chrome/Android; Safari/Firefox chưa có) — chỉ đọc cờ saveData.
interface NavigatorWithConnection {
  connection?: { saveData?: boolean }
}

// Máy đang bật chế độ tiết kiệm dữ liệu (Data Saver / Lite mode)? Trình duyệt không hỗ trợ API
// → false (không có tín hiệu thì không suy diễn).
export function isSaveDataOn(nav: unknown = globalThis.navigator): boolean {
  return (nav as NavigatorWithConnection | undefined)?.connection?.saveData === true
}

export interface PrecacheConditions {
  isProd: boolean // chỉ bản build thật mới cần (dev không có service worker)
  hasCacheStorage: boolean // 'caches' in window — không có thì không lưu bền được
  hasAccount: boolean // đã đăng nhập tài khoản thật (khách vãng lai = false)
  hasStudied: boolean // đã có ít nhất một phiên học
  enabled: boolean // công tắc "Tải để học ngoại tuyến"
  saveData: boolean // máy bật Save-Data
}

// Lý do KHÔNG tải (null = được tải). Thứ tự kiểm cũng là thứ tự ưu tiên hiển thị ở Cài đặt:
// lý do do người dùng tự chọn (tắt công tắc, Save-Data) nói trước lý do "chưa đủ điều kiện".
export type PrecacheBlockReason = 'unsupported' | 'disabled' | 'save-data' | 'guest' | 'not-studied'

export function precacheBlockReason(c: PrecacheConditions): PrecacheBlockReason | null {
  if (!c.isProd || !c.hasCacheStorage) return 'unsupported'
  if (!c.enabled) return 'disabled'
  if (c.saveData) return 'save-data'
  if (!c.hasAccount) return 'guest'
  if (!c.hasStudied) return 'not-studied'
  return null
}

// MB thập phân (10^6 byte) — cùng cách iOS/Android báo dung lượng, nên người dùng đối chiếu được.
const BYTES_PER_MB = 1_000_000

// Đổi số byte thành chuỗi MB dễ đọc: tiếng Việt dùng dấu phẩy thập phân ("23,5 MB"), tiếng Anh
// dấu chấm ("23.5 MB"). < 0,1 MB vẫn hiện "0,1 MB" để không ghi "0 MB" cho một thứ có thật.
export function formatMegabytes(bytes: number, lang: 'vi' | 'en' = 'vi'): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB'
  const mb = Math.max(bytes / BYTES_PER_MB, 0.1).toFixed(1)
  return `${lang === 'vi' ? mb.replace('.', ',') : mb} MB`
}

// Gom điều kiện từ trạng thái THẬT của trình duyệt + người dùng hiện tại. `isProd` tách thành
// tham số để test được cả nhánh dev/prod.
export function readPrecacheConditions(
  user: Pick<User, 'id' | 'isGuest'> | null,
  isProd: boolean = import.meta.env.PROD,
): PrecacheConditions {
  const hasAccount = !!user && !user.isGuest
  return {
    isProd,
    hasCacheStorage: typeof window !== 'undefined' && 'caches' in window,
    hasAccount,
    // Chỉ quét lịch sử học khi đã có tài khoản — khách không cần (đằng nào cũng bị chặn).
    hasStudied: hasAccount && hasEverStudied(user.id),
    enabled: isOfflineDownloadEnabled(),
    saveData: isSaveDataOn(),
  }
}

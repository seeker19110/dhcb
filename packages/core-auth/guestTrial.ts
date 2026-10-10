// guestTrial.ts — Hạn mức DÙNG THỬ cho khách vãng lai (chưa đăng nhập).
//
// Đặc tả: docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md
//
// Khách được nếm thử các tính năng tốn tiền AI (chat, chấm viết/nói, STT, TTS) ở mức RẤT thấp so
// với gói Free đã đăng nhập (30 lượt/ngày, cấu hình ở app_settings). Mục tiêu là đủ để thấy sản
// phẩm hoạt động thật rồi tự muốn đăng ký, chứ không phải để dùng lâu dài mà không có tài khoản.
//
// Hai tầng chặn, phải qua CẢ HAI:
//   1. Theo `X-Guest-Id` — id trình duyệt tự khai. Xoá localStorage là reset được, nên tầng này
//      một mình không đủ.
//   2. Theo IP — trần cao hơn (một nhà/quán cà phê có thể có nhiều người thật sau một NAT), vừa
//      đủ để việc "xoá localStorage rồi dùng tiếp vô hạn" không còn rẻ.
//
// Cả hai đều là chặn lạm dụng THÔ, không phải chống gian lận có chủ đích — đúng mức rủi ro: mỗi
// lượt chỉ tốn vài đồng tiền API, không có điểm/tiền/xếp hạng nào gắn với khách.

// Đặt ở `core-auth` chứ không phải `core-billing` là CÓ CHỦ Ý: `core-auth` đã phụ thuộc
// `core-billing` (auth.ts/trial.ts), nên để ngược lại sẽ tạo vòng phụ thuộc giữa hai gói và
// `tsc -b` (project references) từ chối biên dịch.
import { consumeDailyCounterStatus, rateLimitSubject, releaseDailyCounter } from './security.js'

/** Số lượt AI/ngày cho MỘT trình duyệt khách. Thấp hơn nhiều hạn mức Free (30). */
export const GUEST_DAILY_TRIAL = 3

/** Trần theo IP/ngày — cao hơn để không chặn oan nhiều người thật sau cùng một NAT. */
export const GUEST_IP_DAILY_TRIAL = 15

export const GUEST_TRIAL_MESSAGE =
  'Bạn đã dùng hết lượt thử miễn phí hôm nay. Đăng ký tài khoản (miễn phí) để có 30 lượt mỗi ngày nhé.'

/** Khoá bộ đếm — tách namespace rõ ràng để không đụng khoá của `checkRateLimit`. */
function guestKeyOf(guestKey: string): string {
  return `guest-trial:id:${guestKey}`
}

// IPv6 gom theo /64 (xem rateLimitSubject): đổi địa chỉ trong dải không được thêm lượt thử.
function ipKeyOf(ip: string): string {
  return `guest-trial:ip:${rateLimitSubject(ip)}`
}

/**
 * Production mà Redis không đếm được (audit 2026-10-10, E1.9): vẫn CHẶN (fail-closed) nhưng nói
 * đúng lý do — trước đây khách thấy "đã dùng hết lượt thử" dù chưa dùng lượt nào.
 */
export const GUEST_TRIAL_UNAVAILABLE_MESSAGE =
  'Máy chủ đang tạm bận nên chưa dùng thử được. Bạn thử lại sau ít phút nhé.'

export interface GuestTrialGate {
  ok: boolean
  message?: string
  /** `true` = bị chặn vì không đếm được lượt (hạ tầng), KHÔNG phải vì khách đã hết lượt. */
  unavailable?: boolean
}

const UNAVAILABLE_GATE: GuestTrialGate = {
  ok: false,
  message: GUEST_TRIAL_UNAVAILABLE_MESSAGE,
  unavailable: true,
}

/**
 * Trừ 1 lượt thử của khách. Trả `ok: false` kèm lời nhắn khi hết lượt ở BẤT KỲ tầng nào.
 *
 * Thứ tự cố ý: đếm theo id TRƯỚC, theo IP SAU. Nếu tầng IP chặn thì hoàn lại lượt vừa trừ ở tầng
 * id — nếu không, một người bị chặn vì IP sẽ vẫn bị đốt sạch quota id của chính mình, và sau đó
 * đăng nhập/đổi mạng cũng không dùng được.
 */
export async function checkAndConsumeGuestTrial(
  guestKey: string,
  ip: string,
): Promise<GuestTrialGate> {
  const idStatus = await consumeDailyCounterStatus(guestKeyOf(guestKey), GUEST_DAILY_TRIAL)
  if (idStatus === 'unavailable') return UNAVAILABLE_GATE
  if (idStatus === 'exhausted') return { ok: false, message: GUEST_TRIAL_MESSAGE }

  // IP rỗng (không xác định được) → bỏ qua tầng 2, tầng 1 vẫn chặn.
  if (!ip) return { ok: true }

  const ipStatus = await consumeDailyCounterStatus(ipKeyOf(ip), GUEST_IP_DAILY_TRIAL)
  if (ipStatus !== 'ok') {
    await releaseDailyCounter(guestKeyOf(guestKey))
    return ipStatus === 'unavailable'
      ? UNAVAILABLE_GATE
      : { ok: false, message: GUEST_TRIAL_MESSAGE }
  }
  return { ok: true }
}

/** Hoàn lại lượt đã trừ khi nhà cung cấp AI lỗi (khách không nhận được kết quả). */
export async function refundGuestTrial(guestKey: string, ip: string): Promise<void> {
  await releaseDailyCounter(guestKeyOf(guestKey))
  if (ip) await releaseDailyCounter(ipKeyOf(ip))
}

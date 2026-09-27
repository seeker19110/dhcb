// pushSubscription.ts — Hợp đồng Web Push subscription + chính sách `endpoint` được phép gửi tới.
//
// VÌ SAO CẦN (lỗ hổng vá 2026-09-27): `endpoint` do TRÌNH DUYỆT gửi lên, và server sẽ POST tới
// đúng URL đó — mỗi giờ (nhắc học) và MỖI tin nhắn chat gửi tới người đang offline. Trước đây
// chỉ kiểm "chuỗi không rỗng", nên ai cũng đăng ký được `endpoint` trỏ về:
//   - máy của chính kẻ tấn công → server kết nối ra ngoài → LỘ IP THẬT của VPS đứng sau
//     Cloudflare (mở đường gọi thẳng vào origin, bỏ qua mọi lớp bảo vệ của CF);
//   - dịch vụ nội bộ nói HTTPS (localhost, mạng riêng) → SSRF mù, kích hoạt theo ý muốn qua chat.
// Trình duyệt thật chỉ bao giờ trả endpoint của vài dịch vụ push lớn, nên danh sách cho phép hẹp
// không chặn nhầm người dùng thật.
import { z } from 'zod'

/** Host dịch vụ push khớp CHÍNH XÁC. */
const PUSH_HOSTS_EXACT = new Set([
  'fcm.googleapis.com', // Chrome, Edge mới, Opera, Brave, Samsung Internet (Firebase Cloud Messaging)
  'updates.push.services.mozilla.com', // Firefox
  'web.push.apple.com', // Safari macOS 13+, iOS/iPadOS 16.4+
])

/** Host dịch vụ push khớp theo HẬU TỐ (dịch vụ dùng nhiều subdomain theo vùng). */
const PUSH_HOST_SUFFIXES = [
  '.push.apple.com',
  '.push.services.mozilla.com',
  '.notify.windows.com', // Windows Push Notification Services (Edge cũ/PWA cài trên Windows)
]

/** `endpoint` có phải URL của một dịch vụ push trình duyệt thật không. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (url.username || url.password) return false
  // `new URL` bỏ cổng mặc định 443 → còn cổng nghĩa là cổng lạ (dò dịch vụ nội bộ).
  if (url.port) return false
  const host = url.hostname.toLowerCase()
  return PUSH_HOSTS_EXACT.has(host) || PUSH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

// Giới hạn độ dài: endpoint thật ~200–500 ký tự; p256dh là khoá EC P-256 (65 byte → 87 ký tự
// base64url), auth 16 byte (22 ký tự). Trần rộng rãi nhưng chặn rác phình bảng.
export const PUSH_ENDPOINT_MAX = 1024
const P256DH_MAX = 256
const AUTH_KEY_MAX = 64

/** Hình dạng subscription (`PushSubscription.toJSON()`). KHÔNG kiểm host — xem isAllowedPushEndpoint. */
export const PushSubscriptionSchema = z.object({
  endpoint: z.string().min(1).max(PUSH_ENDPOINT_MAX),
  keys: z.object({
    p256dh: z.string().min(1).max(P256DH_MAX),
    auth: z.string().min(1).max(AUTH_KEY_MAX),
  }),
})

export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>

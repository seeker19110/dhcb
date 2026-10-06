// Chính sách do chủ dự án chốt 2026-10-06: VIP không có hạn mức lượt AI/ngày.
// Không thay thế xác thực, ngày hết hạn, rate limit, thống kê và cầu dao chi phí.
// Đổi phiên bản làm mất hiệu lực ETag cũ dù hàng app_settings chưa thay đổi.
export const AI_USAGE_POLICY_VERSION = 'vip-unlimited-20261006'

export function hasUnlimitedAiTurns(plan: string): boolean {
  return plan === 'vip'
}

// packages/core-contracts/companionSafety.ts — Hợp đồng "thẻ hỗ trợ khủng hoảng" của Bạn Đồng
// Hành, dùng chung server (safetyGuard) và client (CrisisSupportCard).
//
// VÌ SAO CÓ FILE NÀY (2026-10-11, nâng cấp Companion GĐ1): nền tảng có người dùng nhỏ tuổi
// (nhóm `nhi_dong`/`thieu_nien`), mà Companion trước đó KHÔNG có lớp nào nhận ra câu nói về tự
// hại, bị bạo hành/xâm hại — AI trả lời như một lượt trò chuyện thường, và còn có thể đề xuất
// "lưu ký ức" chính câu đó. Lớp an toàn (server) phân loại mức rủi ro; thẻ (client) đưa số
// điện thoại thật để gọi ngay. Mọi số ở đây phải là số THẬT, kiểm chứng được — xem ghi chú từng
// dòng; đổi số thì đổi cả ghi chú nguồn.
import { z } from 'zod'

/** Mức rủi ro mà lớp an toàn kết luận cho MỘT lượt thoại. */
export const SafetyRiskLevelSchema = z.enum(['none', 'concern', 'imminent'])
export type SafetyRiskLevel = z.infer<typeof SafetyRiskLevelSchema>

/** Loại tình huống — chỉ để chọn lời dẫn/tài nguyên phù hợp, KHÔNG phải chẩn đoán. */
export const SafetyCategorySchema = z.enum(['self_harm', 'abuse', 'other', 'none'])
export type SafetyCategory = z.infer<typeof SafetyCategorySchema>

export const SafetyResourceSchema = z.object({
  /** Số gọi được: giữ dạng gõ vào `tel:` (không khoảng trắng). */
  phone: z.string().min(3).max(20),
  /** Tên hiển thị. */
  name: z.string().min(1).max(120),
  /** Ghi chú ngắn: miễn phí? giờ hoạt động? */
  note: z.string().max(200),
})
export type SafetyResource = z.infer<typeof SafetyResourceSchema>

/** Thẻ gửi xuống client kèm lượt trả lời (chỉ khi `level` ≠ none). */
export const CompanionSafetyNoticeSchema = z.object({
  level: z.enum(['concern', 'imminent']),
  category: SafetyCategorySchema,
  resources: z.array(SafetyResourceSchema).min(1),
})
export type CompanionSafetyNotice = z.infer<typeof CompanionSafetyNoticeSchema>

/**
 * Tài nguyên hỗ trợ ở Việt Nam. Thứ tự = thứ tự hiện trên thẻ.
 *
 * Nguồn (kiểm 2026-10-11, agent nghiên cứu đọc trang chính thức):
 * - 111: Tổng đài quốc gia bảo vệ trẻ em — miễn phí, 24/7 (tongdai111.vn; báo cáo hoạt động
 *   2025 của Tổng đài, nay thuộc Cục Bà mẹ và Trẻ em, Bộ Y tế).
 * - 115: cấp cứu y tế toàn quốc.
 * - Đường dây Ngày Mai 096 306 1414: hỗ trợ tâm lý miễn phí nhưng GIỜ GIỚI HẠN (khoảng
 *   13:00–20:30, Thứ Tư–Chủ Nhật theo befrienders.org và findahelpline.com/countries/vn) —
 *   ghi chú nói rõ để người dùng không gọi ngoài giờ rồi tưởng không ai nghe.
 */
export const VIETNAM_SAFETY_RESOURCES: readonly SafetyResource[] = [
  {
    phone: '111',
    name: 'Tổng đài quốc gia bảo vệ trẻ em 111',
    note: 'Miễn phí, 24/7. Gọi khi bị đánh, bị ép buộc, bị xâm hại hoặc cần người lớn giúp.',
  },
  {
    phone: '115',
    name: 'Cấp cứu 115',
    note: 'Khi có nguy hiểm tới tính mạng ngay lúc này.',
  },
  {
    phone: '0963061414',
    name: 'Đường dây nóng Ngày Mai',
    note: 'Hỗ trợ tâm lý miễn phí, 13:00–20:30 Thứ Tư–Chủ Nhật. Ngoài giờ hãy gọi 111 hoặc 115.',
  },
]

/** Dựng thẻ từ kết luận của lớp an toàn — tài nguyên lấy từ danh sách cố định ở trên. */
export function buildSafetyNotice(
  level: Exclude<SafetyRiskLevel, 'none'>,
  category: SafetyCategory,
): CompanionSafetyNotice {
  return CompanionSafetyNoticeSchema.parse({
    level,
    category,
    resources: VIETNAM_SAFETY_RESOURCES,
  })
}

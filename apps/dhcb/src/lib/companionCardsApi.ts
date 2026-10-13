// apps/dhcb/src/lib/companionCardsApi.ts — "Thẻ hôm nay" của Bạn Đồng Hành (GĐ4a, changelog 0629).
//
// Phản hồi được PARSE qua đúng hợp đồng Zod của server: lệch hình dạng là LỖI (khối lỗi + Thử
// lại), không bao giờ là bộ thẻ nửa vời (CLAUDE.md mục 4.1 + 4.3).
// Đặc tả: docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md.
import { getAuthHeader } from '@core/authHeader'
import {
  CompanionDailyCardsResponseSchema,
  DailyCardFeedbackResponseSchema,
  type CompanionDailyCardsResponse,
  type DailyCardFeedback,
  type DailyCardFeedbackResponse,
} from '@dhcb/core-contracts/companionDailyCards'

export const COMPANION_CARDS_ENDPOINT = '/api/companion-cards'

export async function fetchCompanionDailyCards(): Promise<CompanionDailyCardsResponse> {
  const res = await fetch(COMPANION_CARDS_ENDPOINT, { headers: { ...getAuthHeader() } })
  if (!res.ok) throw new Error(`Lỗi tải thẻ hôm nay: ${res.status}`)
  const parsed = CompanionDailyCardsResponseSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Thẻ hôm nay trả về sai định dạng — thử lại sau ít phút.')
  return parsed.data
}

export async function sendCompanionCardFeedback(
  cardId: string,
  feedback: DailyCardFeedback,
): Promise<DailyCardFeedbackResponse> {
  const res = await fetch(`${COMPANION_CARDS_ENDPOINT}?action=feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ cardId, feedback }),
  })
  if (!res.ok) throw new Error(`Lỗi lưu phản hồi thẻ: ${res.status}`)
  const parsed = DailyCardFeedbackResponseSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Phản hồi thẻ trả về sai định dạng.')
  return parsed.data
}

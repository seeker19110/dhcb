// todayItemId.ts — Phần THUẦN (không zod) của hợp đồng "Hôm nay" (`todayPlan.ts`).
//
// Tách riêng (audit 2026-10-10, đợt E4.1b): trang chủ chỉ cần dựng mã mục, nhưng import từ
// `todayPlan.ts` là kéo cả zod bản đầy đủ (`vendor-zod`) vào route `/`. File này cố ý không
// import gì; `todayPlan.ts` re-export lại nên nơi dùng cũ không đổi.

/** Bốn loại mục — nguồn DUY NHẤT, `TodayItemSchema.kind` dựng enum từ mảng này. */
export const TODAY_ITEM_KINDS = ['resume', 'next', 'review', 'pick'] as const
export type TodayItemKind = (typeof TODAY_ITEM_KINDS)[number]

/** Mã định danh một mục — dựng ở MỘT chỗ để resolver và test không lệch nhau. */
export function todayItemId(
  kind: TodayItemKind,
  subjectId: string | undefined,
  contentId: string | undefined,
): string {
  return `${kind}:${subjectId ?? '-'}:${contentId ?? '-'}`
}

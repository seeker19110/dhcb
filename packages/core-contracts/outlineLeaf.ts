// outlineLeaf.ts — Phần THUẦN (không zod) của hợp đồng cây mục lục (`outline.ts`).
//
// Tách riêng (audit 2026-10-10, đợt E4.1b): trang chủ (qua `outlineNav`) chỉ cần hỏi "nút này có
// phải lá không", nhưng import từ `outline.ts` là kéo cả zod bản đầy đủ vào route `/`. Chỉ import
// KIỂU từ `outline.ts` (bị xoá lúc biên dịch); `outline.ts` re-export lại nên nơi dùng cũ không đổi.
import type { OutlineKind } from './outline.js'

/** Lá = nút người học bấm vào để học. */
export function isOutlineLeaf(node: { kind: OutlineKind }): boolean {
  return node.kind === 'lesson' || node.kind === 'activity'
}

// outlineLeaf.ts — Phần THUẦN (không zod) của hợp đồng cây mục lục (`outline.ts`).
//
// Tách riêng (audit 2026-10-10, đợt E4.1b): trang chủ (qua `outlineNav`) chỉ cần hỏi "nút này có
// phải lá không", nhưng import từ `outline.ts` là kéo cả zod bản đầy đủ vào route `/`. File này
// KHÔNG import gì (kể cả kiểu từ `outline.ts` — thành chu trình import, CI job `audit` chặn);
// `outline.ts` import ngược lại và re-export nên nơi dùng cũ không đổi.

/** Vai trò của một nút trong cây. `lesson`/`activity` là LÁ (bấm vào là học). */
export type OutlineKind = 'level' | 'chapter' | 'lesson' | 'activity'

/** Lá = nút người học bấm vào để học. */
export function isOutlineLeaf(node: { kind: OutlineKind }): boolean {
  return node.kind === 'lesson' || node.kind === 'activity'
}

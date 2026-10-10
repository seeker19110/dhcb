// outlineNav — điều hướng TRONG một cây mục lục (`Outline` của @dhcb/core-contracts/outline).
//
// Giao diện cần bốn câu hỏi, môn nào cũng hỏi y hệt: nút này ở đâu · đường từ gốc tới nó ·
// các lá theo thứ tự học · bài trước/bài sau là gì. Viết MỘT lần ở đây để ba môn (và mọi môn
// thêm sau) không mỗi nơi tự tính một kiểu — nhất là "bài sau" phải BỎ QUA bài đang khoá,
// nếu không nút "Bài tiếp theo" sẽ dẫn người học vào một ổ khoá.
//
// THUẦN: không React, không I/O, không đồng hồ. `nodes` đã ở thứ tự duyệt trước (pre-order)
// nên mọi hàm ở đây chỉ duyệt tuyến tính.
import type { Outline, OutlineNode } from '@dhcb/core-contracts/outline'
import { isOutlineLeaf } from '@dhcb/core-contracts/outlineLeaf'

/** Tra một nút theo `nodeId`. */
export function findNode(outline: Outline, nodeId: string): OutlineNode | undefined {
  return outline.nodes.find((n) => n.nodeId === nodeId)
}

/** Tra LÁ theo mã nội dung thật (lessonId…) — giao diện chỉ biết mã bài trên URL. */
export function findLeafByContentId(
  outline: Outline,
  contentId: string | undefined,
): OutlineNode | undefined {
  if (contentId === undefined) return undefined
  return outline.nodes.find((n) => isOutlineLeaf(n) && n.contentId === contentId)
}

/** Con trực tiếp của một nút, theo `order` tăng dần. */
export function childrenOf(outline: Outline, nodeId: string | undefined): OutlineNode[] {
  return outline.nodes.filter((n) => n.parentId === nodeId).sort((a, b) => a.order - b.order)
}

/**
 * Đường từ gốc tới nút: `[root, …, node]`. Nút không có thật → mảng rỗng.
 * Có chặn vòng lặp (`parentId` trỏ ngược lên chính mình do dữ liệu hỏng) để không treo trang.
 */
export function pathTo(outline: Outline, nodeId: string): OutlineNode[] {
  const byId = new Map(outline.nodes.map((n) => [n.nodeId, n]))
  const path: OutlineNode[] = []
  const seen = new Set<string>()
  let current = byId.get(nodeId)
  while (current && !seen.has(current.nodeId)) {
    seen.add(current.nodeId)
    path.unshift(current)
    current = current.parentId === undefined ? undefined : byId.get(current.parentId)
  }
  return path
}

/** Mọi LÁ theo đúng thứ tự học (thứ tự duyệt trước của cây). */
export function flattenLeaves(outline: Outline): OutlineNode[] {
  return outline.nodes.filter(isOutlineLeaf)
}

/**
 * Lá liền trước/liền sau một mã nội dung, **bỏ qua lá đang khoá** (người học không vào được
 * thì không phải là "bài tiếp theo"). Mã không có trong cây → cả hai đều `undefined`.
 */
export function prevNext(
  outline: Outline,
  contentId: string | undefined,
): { prev?: OutlineNode; next?: OutlineNode } {
  const leaves = flattenLeaves(outline)
  const index = leaves.findIndex((n) => n.contentId === contentId)
  if (index === -1) return {}
  const prev = [...leaves.slice(0, index)].reverse().find((n) => n.availability === 'available')
  const next = leaves.slice(index + 1).find((n) => n.availability === 'available')
  return { ...(prev ? { prev } : {}), ...(next ? { next } : {}) }
}

/**
 * Mã các nút CHA của lá đang mở (chương, mạch, gốc) — tập "phải mở sẵn" của mục lục.
 *
 * Không có lá nào đang mở (trang bậc/khoá/danh sách) thì mở sẵn chương ĐẦU TIÊN, để cây
 * không hiện ra như một danh sách câm chỉ toàn tiêu đề thu gọn.
 */
export function ancestorChapterIds(
  outline: Outline,
  activeContentId: string | undefined,
): Set<string> {
  if (activeContentId === undefined) return chuongDauTien(outline)
  const leaf = findLeafByContentId(outline, activeContentId)
  if (!leaf) return new Set()
  return ancestorChapterIdsOfNode(outline, leaf.nodeId)
}

/**
 * Như `ancestorChapterIds` nhưng nhận thẳng `nodeId` của lá.
 *
 * Vì sao cần bản này: mã nội dung KHÔNG phải lúc nào cũng duy nhất trong một cây. Đo trên
 * `cefr.json` (2026-09-16): cấp B2 dùng vòng từ vựng `it` ở HAI unit khác nhau, nên tra theo
 * `contentId` sẽ luôn ra unit đầu — mở nhầm chương, và hai lá cùng mang `aria-current="page"`.
 * `nodeId` thì duy nhất theo hợp đồng `OutlineNode`, nên nơi gọi biết chính xác lá nào đang mở
 * (Tiếng Anh: unit + loại hoạt động + mã) thì truyền `nodeId`.
 */
export function ancestorChapterIdsOfNode(outline: Outline, nodeId: string): Set<string> {
  const duongDan = pathTo(outline, nodeId)
  if (duongDan.length === 0) return new Set()
  // Bỏ chính lá ra, chỉ giữ các tầng cha.
  return new Set(duongDan.slice(0, -1).map((n) => n.nodeId))
}

/** Không có lá nào đang mở → mở sẵn chương đầu tiên. */
function chuongDauTien(outline: Outline): Set<string> {
  const first = outline.nodes.find((n) => n.kind === 'chapter')
  return new Set(first ? [first.nodeId] : [])
}

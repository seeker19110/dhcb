// programmingNext — adapter "Hôm nay" của môn Lập trình (slice S06-1, đặc tả §③.2).
//
// Hai nguồn, theo thứ tự:
//  1. CÓ mục lục S07 (`Outline`) và biết đang đứng ở bài nào → lá kế tiếp theo `prevNext` (đã tự
//     bỏ lá khoá). Đây là nguồn đúng nhất vì nó đi theo đúng cây người học đang xem (khoá ngắn
//     giữ được `?khoa=`), thay vì một danh sách phẳng toàn môn.
//  2. KHÔNG có mục lục → `pickNextLesson` (luật cũ, đã có test): bài đang dở sớm nhất, rồi bài
//     chưa hoàn thành đầu tiên.
//
// KHÔNG nạp nội dung bài: chỉ dùng chỉ mục nhẹ (`lessonsLoader`) như `pickNextLesson` vẫn làm —
// registry bài 3 MB tuyệt đối không được vào chunk Trang chủ.
import type { TodayItem } from '@dhcb/core-contracts/todayPlan'
import { todayItemId } from '@dhcb/core-contracts/todayItemId'
import type { Outline, OutlineNode } from '@dhcb/core-contracts/outline'
import { findLeafByContentId, prevNext } from '@dhcb/core-learner/outline/outlineNav'
import type { ProgrammingLessonProgress } from '../programmingProgress'
import { pickNextLesson, type NextLesson } from '../programmingNextLesson'
import { duongDanBaiHoc } from '../programmingRoutes'

export const PROGRAMMING_SUBJECT_ID = 'programming'

export interface ProgrammingNextCtx {
  progress: readonly ProgrammingLessonProgress[]
  /** Mục lục bậc/khoá người học đang xem (S07) — vắng thì dùng luật cũ toàn môn. */
  outline?: Outline
  /** Bài đang đứng trong mục lục đó (bài dở, hoặc lá cuối đã xong). */
  activeContentId?: string
}

/**
 * Mốc bằng chứng gần nhất = lần hoàn thành bài muộn nhất.
 *
 * `ProgrammingLessonProgress` KHÔNG có `updatedAt` (bài đang dở có `completedAt = null`), nên bài
 * dở không cho mốc nào — khi ấy resolver rơi xuống thứ tự phá hoà cố định. Nợ này sẽ hết khi
 * phiên S08 phủ đủ (phiên có `updatedAt` thật).
 */
function mocBangChung(progress: readonly ProgrammingLessonProgress[]): number | undefined {
  const moc = progress
    .map((p) => p.completedAt)
    .filter((t): t is number => typeof t === 'number' && t > 0)
  return moc.length > 0 ? Math.max(...moc) : undefined
}

/** Lá mục lục → mục "Hôm nay". Lá mở luôn có `href` (luật của `OutlineSchema`). */
function mucTuLaMucLuc(node: OutlineNode): TodayItem | undefined {
  if (!node.href) return undefined
  return {
    id: todayItemId('next', node.subjectId, node.contentId),
    kind: 'next',
    subjectId: node.subjectId,
    ...(node.courseId === undefined ? {} : { courseId: node.courseId }),
    ...(node.contentId === undefined ? {} : { contentId: node.contentId }),
    title: node.title,
    hint: 'Bài kế tiếp trong mục lục',
    href: node.href,
    evidenceSource: 'outline.next',
  }
}

export interface ProgrammingNextResult {
  next?: TodayItem
  lastEvidenceAt?: number
  /**
   * Kết quả thô của `pickNextLesson` — bậc, tên bậc, ngôn ngữ, cờ `resuming`.
   *
   * [S06-3] TRANG MÔN cần những thứ này (huy hiệu ngôn ngữ, chặng dự án đang ở, cột mốc bậc) mà
   * `TodayItem` cố ý không mang (hợp đồng chung không biết khái niệm "bậc" của riêng môn Lập
   * trình). Trả kèm ở đây để trang KHÔNG phải gọi `pickNextLesson` lần nữa: luật "học tiếp bài
   * nào" chạy đúng MỘT lần, ở đúng MỘT nơi. Chỉ có ở nhánh (2); nhánh mục lục không dùng bậc.
   */
  picked?: NextLesson
}

/** Bài kế tiếp + mốc bằng chứng của môn Lập trình. */
export function programmingNext(ctx: ProgrammingNextCtx): ProgrammingNextResult {
  const lastEvidenceAt = mocBangChung(ctx.progress)
  const moc = lastEvidenceAt === undefined ? {} : { lastEvidenceAt }

  // (1) Mục lục biết chỗ đang đứng → đi theo cây. Hết lá mở phía sau thì KHÔNG có mục nào:
  // không bao giờ lấy bài đang khoá làm việc để học.
  if (ctx.outline && ctx.activeContentId && findLeafByContentId(ctx.outline, ctx.activeContentId)) {
    const { next } = prevNext(ctx.outline, ctx.activeContentId)
    const item = next ? mucTuLaMucLuc(next) : undefined
    return { ...(item ? { next: item } : {}), ...moc }
  }

  // (2) Luật cũ toàn môn.
  const picked = pickNextLesson([...ctx.progress])
  if (!picked) return moc
  const item: TodayItem = {
    id: todayItemId('next', PROGRAMMING_SUBJECT_ID, picked.lesson.id),
    kind: 'next',
    subjectId: PROGRAMMING_SUBJECT_ID,
    contentId: picked.lesson.id,
    title: picked.lesson.title,
    hint: picked.resuming ? 'Đang học dở' : 'Bài chưa học tiếp theo',
    href: duongDanBaiHoc(picked.lesson),
    evidenceSource: 'programming.progress',
  }
  return { next: item, picked, ...moc }
}

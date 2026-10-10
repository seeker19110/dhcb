// stemNext — adapter "Hôm nay" của bốn môn STEM (Toán · Lý · Hoá · Sinh), slice S06-1.
//
// LUẬT QUAN TRỌNG NHẤT Ở ĐÂY LÀ MỘT LUẬT CẤM: bốn môn STEM hiện CHƯA có bằng chứng hoàn thành
// nào phía client (không khoá localStorage, không endpoint tiến độ — S11 mới định nghĩa "hoàn
// thành", S11-2 mới nối vào giao diện). Vì thế adapter này KHÔNG được suy ra tiến độ giả: "đã mở
// trang danh sách bài" không phải là bằng chứng, và gợi "Bài 1 lớp 10" mãi trong khi người học
// đang ở bài 7 vừa sai vừa không đo được.
//
// Nó chỉ trả bài kế tiếp khi có HAI thứ thật: một phiên đang dở (S08) và mục lục môn (S07) để
// biết lá nào đứng sau bài đang dở. Không có thì trả rỗng — resolver sẽ mời chọn môn.
import type { TodayItem } from '@dhcb/core-contracts/todayPlan'
import type { Outline } from '@dhcb/core-contracts/outline'
import type { ResumePoint } from '@dhcb/core-contracts/todayPlan'
import { findLeafByContentId, prevNext } from '@dhcb/core-learner/outline/outlineNav'
import { todayItemId } from '@dhcb/core-contracts/todayItemId'
import type { StemSubjectId } from '@dhcb/core-contracts/stemLesson'

export interface StemNextCtx {
  subjectId: StemSubjectId
  /** Phiên đang dở của môn (S08) — không có thì không có gì để nói. */
  resume?: ResumePoint
  /** Mục lục lớp/chương đang học (S07). */
  outline?: Outline
}

/** Bài kế tiếp sau bài đang học dở. Không phiên hoặc không mục lục → `{}` (KHÔNG bịa bài 1). */
export function stemNext(ctx: StemNextCtx): { next?: TodayItem } {
  const { resume, outline } = ctx
  if (!resume || !outline) return {}
  if (!findLeafByContentId(outline, resume.contentId)) return {}

  const { next } = prevNext(outline, resume.contentId)
  if (!next?.href) return {}
  return {
    next: {
      id: todayItemId('next', ctx.subjectId, next.contentId),
      kind: 'next',
      subjectId: ctx.subjectId,
      ...(next.contentId === undefined ? {} : { contentId: next.contentId }),
      title: next.title,
      hint: 'Bài kế tiếp trong mục lục',
      href: next.href,
      evidenceSource: 'outline.next',
    },
  }
}

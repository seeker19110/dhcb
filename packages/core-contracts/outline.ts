// outline.ts — HỢP ĐỒNG CÂY MỤC LỤC dùng chung cho mọi môn (slice S07 của goal learning-ux).
//
// Đặc tả: docs/specs/2026-09-15-goc-hoc-tap-07-muc-luc-mon-khoa.md §③.1.
//
// VÌ SAO CÓ FILE NÀY: mỗi môn có cách tổ chức nội dung riêng (Lập trình: bậc → unit → bài;
// STEM: lớp → chương → bài; Tiếng Anh: cấp → unit → hoạt động). Nếu mỗi môn tự vẽ mục lục
// theo dữ liệu của mình thì có bao nhiêu môn là bấy nhiêu bản mục lục, và mỗi bản lại sai
// khác một kiểu về a11y/tiến độ/khoá. Khai MỘT hình dạng cây ở đây, mỗi môn viết một adapter
// thuần biến dữ liệu của mình thành cây này, giao diện chỉ còn MỘT chỗ để vẽ và để test.
//
// Cây là dữ liệu PHẲNG (mảng nút + `parentId`) chứ không lồng nhau: dễ tìm kiếm, dễ tính
// bài trước/bài sau, dễ so sánh trong test, và không phải đệ quy khi tuần tự hoá.
import { z } from 'zod'
import { isOutlineLeaf } from './outlineLeaf.js'

export { isOutlineLeaf } from './outlineLeaf.js'

/** Vai trò của một nút trong cây. `lesson`/`activity` là LÁ (bấm vào là học). */
export type OutlineKind = 'level' | 'chapter' | 'lesson' | 'activity'

/** Người học có vào được nút này không. Nguồn sự thật là luật khoá của từng môn. */
export type OutlineAvailability = 'available' | 'locked'

/**
 * Tiến độ của một nút.
 * · `unknown` = CHƯA ĐO ĐƯỢC (môn chưa có bằng chứng, hoặc tải tiến độ lỗi) — khác hẳn
 *   `not-started`, và giao diện phải nói ra sự khác nhau đó bằng chữ.
 */
export type OutlineProgress = 'unknown' | 'not-started' | 'in-progress' | 'completed'

export interface OutlineNode {
  /** Duy nhất trong cây: `${kind}:${contentId}` (+ `@${courseId}` khi thuộc một khoá ngắn). */
  nodeId: string
  /** Nút cha; vắng nghĩa là nút gốc. */
  parentId?: string
  subjectId: string
  /** Khoá ngắn chứa nút (Lập trình). Cấp CEFR dùng levelId ở `contentId`, không dùng trường này. */
  courseId?: string
  /** Mã nội dung thật: lessonId · unitId · số chương · circleId · grammarId… */
  contentId?: string
  kind: OutlineKind
  title: string
  /** Chữ phụ: "4 bài" · "sắp mở" · "Cấp tỉnh". Là CHỮ, không phải màu. */
  hint?: string
  /** 0-based trong cùng `parentId`, duy nhất. */
  order: number
  /** Route nội bộ. BẮT BUỘC với lá `available` (xem `OutlineSchema`). */
  href?: string
  availability: OutlineAvailability
  /** Câu giải thích khoá, lấy từ luật khoá sẵn có — KHÔNG tự bịa. */
  lockReason?: string
  progress: OutlineProgress
  /** Bắt buộc khi `in-progress`/`completed`: 'programming.progress' | 'english.vocab' | … */
  evidenceSource?: string
}

export interface Outline {
  /** `nodeId` của nút gốc (level hoặc course). */
  rootId: string
  subjectId: string
  courseId?: string
  /** Đã sắp theo thứ tự duyệt trước (pre-order) — giao diện vẽ thẳng, không sắp lại. */
  nodes: readonly OutlineNode[]
  /** `Date.now()` lúc dựng — để giao diện biết lớp tiến độ cũ hay mới. */
  builtAt: number
}

export const OutlineKindSchema = z.enum(['level', 'chapter', 'lesson', 'activity'])
export const OutlineAvailabilitySchema = z.enum(['available', 'locked'])
export const OutlineProgressSchema = z.enum(['unknown', 'not-started', 'in-progress', 'completed'])

const OutlineNodeSchema = z.object({
  nodeId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  subjectId: z.string().min(1),
  courseId: z.string().min(1).optional(),
  contentId: z.string().min(1).optional(),
  kind: OutlineKindSchema,
  title: z.string().min(1),
  hint: z.string().min(1).optional(),
  order: z.number().int().min(0),
  href: z.string().min(1).optional(),
  availability: OutlineAvailabilitySchema,
  lockReason: z.string().min(1).optional(),
  progress: OutlineProgressSchema,
  evidenceSource: z.string().min(1).optional(),
})

const OutlineObjectSchema = z.object({
  rootId: z.string().min(1),
  subjectId: z.string().min(1),
  courseId: z.string().min(1).optional(),
  nodes: z.array(OutlineNodeSchema).min(1),
  builtAt: z.number().int().nonnegative(),
})

/**
 * Schema Zod của cả cây — kiểm cả những luật mà kiểu TypeScript không diễn đạt được:
 * `nodeId` duy nhất · `rootId` có thật · `parentId` trỏ nút có thật · `order` duy nhất trong
 * cùng cha · lá `available` phải có `href` · tiến độ đã đo phải nói rõ nguồn bằng chứng.
 *
 * Adapter nào cũng phải qua được schema này (test từng môn tự gọi `OutlineSchema.parse`).
 */
export const OutlineSchema: z.ZodType<Outline> = OutlineObjectSchema.superRefine((outline, ctx) => {
  const ids = new Set<string>()
  for (const node of outline.nodes) {
    if (ids.has(node.nodeId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `nodeId trùng: ${node.nodeId}` })
    }
    ids.add(node.nodeId)
  }

  if (!ids.has(outline.rootId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'rootId không có trong nodes' })
  }

  const orderSeen = new Set<string>()
  for (const node of outline.nodes) {
    if (node.parentId !== undefined && !ids.has(node.parentId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `parentId không tồn tại: ${node.parentId} (nút ${node.nodeId})`,
      })
    }
    const orderKey = `${node.parentId ?? ''}#${node.order}`
    if (orderSeen.has(orderKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `order trùng trong cùng cha: ${orderKey}`,
      })
    }
    orderSeen.add(orderKey)

    if (isOutlineLeaf(node) && node.availability === 'available' && node.href === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `lá mở phải có href: ${node.nodeId}` })
    }
    if (
      (node.progress === 'completed' || node.progress === 'in-progress') &&
      node.evidenceSource === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `tiến độ đã đo phải có evidenceSource: ${node.nodeId}`,
      })
    }
  }
}) as unknown as z.ZodType<Outline>

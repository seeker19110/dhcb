// lessonAnimation.ts — Hợp đồng CHUNG cho hoạt ảnh minh hoạ bài học + nhánh nâng cao (HSG),
// dùng chung cho cả 4 môn STEM (Toán · Lí · Hoá · Sinh).
//
// VÌ SAO KHAI BÁO chứ không nhúng HTML/SVG tự do:
//   1. Bài học là DỮ LIỆU do AI sinh ra — nhúng HTML tự do là lỗ XSS (CLAUDE.md mục 4.2).
//   2. Màu phải lấy từ token `--a-*` để đạt tương phản ở cả 5 theme (CLAUDE.md mục 4.5 + 4.8);
//      cho phép hex tự do thì mỗi bài một kiểu, không cổng nào rà nổi.
//   3. Một trình vẽ duy nhất (`packages/core-ui/LessonAnimation.tsx`) lo `prefers-reduced-motion`
//      và mô tả cho trình đọc màn hình — thay vì mỗi môn tự làm một kiểu rồi sót a11y.
import { z } from 'zod'

/** Vai trò màu theo NGỮ NGHĨA, trình vẽ ánh xạ sang biến CSS `--a-*`.
 *  Giữ nghĩa quy ước của dự án: `correct` = xanh lá, `danger` = đỏ. */
export const AnimationColorRoleSchema = z.enum([
  'primary',
  'accent',
  'correct',
  'warn',
  'danger',
  'neutral',
  'muted',
  'surface',
])
export type AnimationColorRole = z.infer<typeof AnimationColorRoleSchema>

/** Một mốc thời gian của hình: chỉ biến đổi hình học + độ mờ, không đổi cấu trúc.
 *  Giới hạn này giữ hoạt ảnh chạy bằng CSS transform (mượt, không layout reflow).
 *
 *  Luật đọc mốc (bộ vẽ thi hành ở `packages/core-ui/animationKeyframes.ts`):
 *  - thuộc tính không khai ở một mốc thì GIỮ giá trị mốc trước — `{ atMs: 2400, opacity: 0 }`
 *    sau `{ atMs: 2000, dx: 96 }` nghĩa là đứng ở dx = 96 rồi mờ đi, không trượt về 0;
 *  - trước mốc đầu, hình giữ trạng thái mốc đầu; sau mốc cuối, giữ trạng thái mốc cuối;
 *  - opacity trước lần khai đầu tiên là `opacity` tĩnh của hình (mặc định 1). */
export const AnimationKeyframeSchema = z
  .object({
    /** Mốc thời gian tính từ đầu hoạt ảnh (ms). */
    atMs: z.number().int().min(0).max(60_000),
    /** Tịnh tiến theo trục x/y, đơn vị toạ độ viewBox. */
    dx: z.number().optional(),
    dy: z.number().optional(),
    /** Xoay (độ) quanh `origin` của hình nếu có khai, không thì quanh tâm hình. */
    rotate: z.number().optional(),
    /** Phóng to/thu nhỏ quanh `origin` của hình nếu có khai, không thì quanh tâm hình. */
    scale: z.number().positive().max(20).optional(),
    /** Co giãn riêng một trục (nhân thêm vào `scale`), cũng quanh `origin`. Dành cho thứ chỉ lớn
     *  theo một chiều: cột nhiệt kế dâng, chất lỏng đầy dần, thanh số liệu mọc lên. Muốn "mọc từ
     *  số 0" thì dùng số dương rất nhỏ như 0,01 (schema không nhận 0). */
    scaleX: z.number().positive().max(20).optional(),
    scaleY: z.number().positive().max(20).optional(),
    opacity: z.number().min(0).max(1).optional(),
  })
  .strict()
export type AnimationKeyframe = z.infer<typeof AnimationKeyframeSchema>

const styleFields = {
  fill: AnimationColorRoleSchema.optional(),
  stroke: AnimationColorRoleSchema.optional(),
  strokeWidth: z.number().positive().max(20).optional(),
  /** Nét đứt, ví dụ '4 2' — dùng cho đường phụ trợ (trục, đường chiếu). */
  dash: z.string().max(20).optional(),
  opacity: z.number().min(0).max(1).optional(),
  keyframes: z.array(AnimationKeyframeSchema).max(20).optional(),
  /**
   * Điểm gốc của `rotate`/`scale` trong keyframes, theo toạ độ viewBox. Bỏ trống = tâm hình.
   * Vì sao cần (2026-09-26): chỉ co giãn/xoay quanh TÂM thì mũi tên lực "dài dần" bị tách khỏi
   * điểm đặt, cột năng lượng "cao dần" bị nhấc khỏi mặt đất, con lắc/bán kính quay quanh trung
   * điểm của chính nó. Khai `origin` = đuôi mũi tên, chân cột, điểm treo thì hình đúng nghĩa.
   */
  origin: z.tuple([z.number().min(-2000).max(4000), z.number().min(-2000).max(4000)]).optional(),
}

/** Hình vẽ trong một cảnh. Bộ hình cố tình HẸP — đủ vẽ mọi minh hoạ STEM phổ thông
 *  (vector lực, quỹ đạo, mạch điện, sơ đồ phản ứng, tế bào, đồ thị hàm số) mà vẫn rà được. */
export const AnimationShapeSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('circle'),
      id: z.string().min(1).max(40),
      cx: z.number(),
      cy: z.number(),
      r: z.number().positive(),
      ...styleFields,
    })
    .strict(),
  z
    .object({
      kind: z.literal('rect'),
      id: z.string().min(1).max(40),
      x: z.number(),
      y: z.number(),
      w: z.number().positive(),
      h: z.number().positive(),
      /** Bo góc. */
      rx: z.number().min(0).optional(),
      ...styleFields,
    })
    .strict(),
  z
    .object({
      kind: z.literal('line'),
      id: z.string().min(1).max(40),
      x1: z.number(),
      y1: z.number(),
      x2: z.number(),
      y2: z.number(),
      ...styleFields,
    })
    .strict(),
  z
    .object({
      kind: z.literal('arrow'),
      id: z.string().min(1).max(40),
      x1: z.number(),
      y1: z.number(),
      x2: z.number(),
      y2: z.number(),
      ...styleFields,
    })
    .strict(),
  z
    .object({
      kind: z.literal('polyline'),
      id: z.string().min(1).max(40),
      /** Danh sách điểm [x, y] — dùng vẽ đồ thị hàm số, quỹ đạo, đường đặc trưng. */
      points: z
        .array(z.tuple([z.number(), z.number()]))
        .min(2)
        .max(400),
      /** Khép kín: vẽ cả cạnh nối điểm cuối về điểm đầu (đa giác — vòng benzen, mạch điện,
       *  miền nghiệm). Không cần lặp lại điểm đầu ở cuối danh sách. */
      closed: z.boolean().optional(),
      ...styleFields,
    })
    .strict(),
  z
    .object({
      kind: z.literal('label'),
      id: z.string().min(1).max(40),
      x: z.number(),
      y: z.number(),
      text: z.string().min(1).max(120),
      /** Cỡ chữ theo đơn vị viewBox. */
      size: z.number().positive().max(60).optional(),
      anchor: z.enum(['start', 'middle', 'end']).optional(),
      ...styleFields,
      // CHỮ trong hoạt ảnh là chữ thật (thẻ <text>), nên phải đạt ngưỡng tương phản của chữ.
      // Ba vai trò correct/warn/danger là màu ĐỒ HOẠ (chỉ cần 3:1), dùng làm màu chữ sẽ rớt
      // cổng a11y ở một số theme — chặn ngay tại schema thay vì đợi CI đỏ.
      fill: AnimationColorRoleSchema.exclude(['correct', 'warn', 'danger']).optional(),
      stroke: AnimationColorRoleSchema.exclude(['correct', 'warn', 'danger']).optional(),
    })
    .strict(),
])
export type AnimationShape = z.infer<typeof AnimationShapeSchema>

/** Lời dẫn hiện theo thời gian — vừa giải thích cảnh, vừa là bản ghi văn bản của hoạt ảnh. */
export const AnimationCaptionSchema = z
  .object({
    atMs: z.number().int().min(0).max(60_000),
    text: z.string().min(1).max(240),
  })
  .strict()

export const LessonAnimationSchema = z
  .object({
    title: z.string().min(1).max(120),
    /** BẮT BUỘC: mô tả bằng lời cho người dùng trình đọc màn hình và khi tắt hoạt ảnh.
     *  Hoạt ảnh không có mô tả = nội dung chỉ tới được một nhóm người học. */
    description: z.string().min(20).max(800),
    viewBoxWidth: z.number().positive().max(2000),
    viewBoxHeight: z.number().positive().max(2000),
    durationMs: z.number().int().min(500).max(60_000),
    loop: z.boolean(),
    shapes: z.array(AnimationShapeSchema).min(1).max(60),
    captions: z.array(AnimationCaptionSchema).max(12).optional(),
  })
  .strict()
  .refine((a) => new Set(a.shapes.map((s) => s.id)).size === a.shapes.length, {
    message: 'id của các hình trong một hoạt ảnh phải khác nhau',
  })
  .refine((a) => a.shapes.every((s) => (s.keyframes ?? []).every((k) => k.atMs <= a.durationMs)), {
    message: 'mốc thời gian của keyframe không được vượt quá durationMs',
  })
export type LessonAnimation = z.infer<typeof LessonAnimationSchema>

/** Nhánh học: chương trình chuẩn, hay chuyên đề bồi dưỡng học sinh giỏi. */
export const LessonTrackSchema = z.enum(['core', 'advanced'])
export type LessonTrack = z.infer<typeof LessonTrackSchema>

/** Cấp độ của chuyên đề nâng cao — tăng dần theo kì thi thật ở Việt Nam. */
export const AdvancedTierSchema = z.enum(['hsg-truong', 'hsg-tinh', 'hsg-quoc-gia'])
export type AdvancedTier = z.infer<typeof AdvancedTierSchema>

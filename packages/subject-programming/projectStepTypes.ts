// projectStepTypes — Kiểu + Zod schema + helper của MỘT BƯỚC dự án trục (tách ở PR-L9).
//
// VÌ SAO TÁCH RA: nội dung các chặng nằm ở nhiều file (projectSteps.ts giữ P1/P2 và bảng
// PROJECT_STAGES, projectStepsP3.ts giữ chặng P3). Nếu file nội dung import kiểu từ file
// bảng, còn file bảng import nội dung, ta có CHU TRÌNH IMPORT — cổng `npm run codemap --
// cycles` chặn CI vì đúng lý do đó (chu trình làm thứ tự khởi tạo module phụ thuộc vào ai
// được nạp trước, sinh lỗi "undefined lúc chạy" cực khó truy).
//
// Cách xếp đúng: phần DÙNG CHUNG (schema/kiểu/helper) nằm ở đây, không import ai trong họ
// projectSteps*; mọi file nội dung import xuống đây. Một chiều, không vòng.
import { z } from 'zod'
import { TestCaseSchema } from './lessonTypes.js'

/** File làm việc của chặng P1 (P2 trở đi mới chia nhiều file). */
export const PROJECT_MAIN_FILE = 'cua_hang.py'

export const ProjectStepSchema = z
  .object({
    /** id ổn định `p<bậc>-s<số>` — khoá tiến độ (cùng bảng lesson_progress). */
    id: z.string().regex(/^p[1-6]-s\d+$/),
    title: z.string().min(1).max(120),
    /** Unit cung cấp kiến thức cho bước (tham chiếu curriculum). */
    unitId: z.string().regex(/^p[1-6]-u\d+$/),
    /** Ngôn ngữ của bước (PR-L8) — quyết định bộ chạy nào chấm. Bỏ trống = 'python' (đọc qua
     *  getStepLanguage(), cùng khuôn với getStepFiles): chặng P1/P2 thuần Python nên không
     *  phải sửa 23 bước cũ, còn bước web/SQL của chặng P3 thì ghi rõ. */
    language: z.enum(['python', 'pytest', 'apisim', 'html', 'dom', 'sql', 'fetch']).optional(),
    /** Bước 'dom'/'fetch': trang HTML có sẵn mà script của học viên tác động lên. Bắt buộc với
     *  hai ngôn ngữ đó, cấm với các ngôn ngữ khác (refine bên dưới kiểm). */
    domHtml: z.string().max(6000).optional(),
    /** Yêu cầu bước — nói rõ hợp đồng nhập/xuất để chấm được. */
    requirement: z.string().min(1).max(2000),
    /** Gợi ý khi kẹt (1 mức — gợi ý bậc thang đầy đủ nằm ở bài học unit tương ứng). */
    hint: z.string().min(1).max(500),
    /** Code tham chiếu của bước (phao — mở được, đánh dấu đã xem). */
    referenceCode: z.string().min(1).max(6000),
    /** Milestone check: đạt HẾT thì mở bước sau. */
    checks: z.array(TestCaseSchema).min(1).max(8),
    /** true = bước cuối chặng: đạt xong thì chốt snapshot milestone. */
    isMilestone: z.boolean().default(false),
    /** Các file workspace bước này dùng — phần tử ĐẦU là file chạy chính (PR-L6b).
     *  Chặng P1 chỉ một file; chặng P2 tách 3 file ở bước cuối. */
    files: z
      .array(z.string().regex(/^[a-z0-9_][a-z0-9_.-]{0,99}$/))
      .min(1)
      .max(6)
      .optional(),
    /** Nội dung mẫu của các file PHỤ (ngoài file chính) — "phao" như referenceCode. */
    referenceFiles: z.record(z.string(), z.string().min(1).max(6000)).optional(),
    /** Code CHẤM chạy thay cho file chính: import module của học viên rồi gọi hàm.
     *  Dùng khi cần ép tách file thật (chấm hành vi qua ranh giới module), vì chỉ chạy
     *  file chính thì code gộp một file vẫn cho output y hệt. */
    probeCode: z.string().max(2000).optional(),
  })
  .strict()
  .refine((s) => s.checks.every((c) => c.gitAssertions === undefined), {
    message: 'Project chua ho tro Git assertions',
  })
  .refine((s) => (s.language === 'dom' || s.language === 'fetch') === (s.domHtml !== undefined), {
    message: "bước 'dom'/'fetch' phải có domHtml; ngôn ngữ khác thì không được có",
  })
  // `?? 'python'` chứ không so thẳng: bước chặng P1/P2 bỏ trống `language` nghĩa là Python
  // (xem getStepLanguage) — so thẳng sẽ đánh trượt oan chính những bước cũ đang dùng probeCode.
  .refine((s) => (s.language ?? 'python') === 'python' || s.probeCode === undefined, {
    // probeCode = "chạy code chấm thay file chính để ép tách module" — chỉ có nghĩa với
    // Python thuần; làn pytest/apisim đã có bộ chạy riêng nối ở cuối (pyLanes.ts).
    message: "probeCode chỉ dùng cho bước 'python'",
  })

export type ProjectStep = z.infer<typeof ProjectStepSchema>

/** Ngôn ngữ của bước — bỏ trống nghĩa là Python (chặng P1/P2 thuần Python, xem schema). */
export function getStepLanguage(step: ProjectStep): NonNullable<ProjectStep['language']> {
  return step.language ?? 'python'
}

/** Danh sách file của bước — bước không khai báo thì chỉ dùng file chính của chặng P1. */
export function getStepFiles(step: ProjectStep): string[] {
  return step.files ?? [PROJECT_MAIN_FILE]
}

/** File CHẠY CHÍNH của bước (phần tử đầu trong `files`). */
export function getStepMainFile(step: ProjectStep): string {
  return getStepFiles(step)[0]!
}

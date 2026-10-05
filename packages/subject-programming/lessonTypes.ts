// lessonTypes — Kiểu + Zod schema cho BÀI HỌC 8 BƯỚC môn Lập trình (PR-L3).
// Khuôn 8 bước (đặc tả dac-ta-mon-lap-trinh-2026-08-24.md §3): ① móc thực tế → ② khái niệm
// → ③ ví dụ mẫu → ④ Predict → ⑤ Parsons → ⑥ tự viết (Make, chấm test-case) → ⑦ ứng dụng
// về nhà → ⑧ thẻ SRS (⑧ nối vào SRS chung ở PR sau — schema đã chừa chỗ).
// Zod validate ở test (chặn CI khi soạn nội dung sai khuôn) — dữ liệu là hằng biên dịch.
import { z } from 'zod'
import { LessonAnimationSchema } from '@dhcb/core-contracts/lessonAnimation'

/** Một ca chấm cho bài Make: chạy code học viên với stdin này, so output. */
export const TestCaseSchema = z
  .object({
    /** Mỗi phần tử một lần input(). */
    stdinLines: z.array(z.string().max(200)).max(20).default([]),
    /** Chuỗi PHẢI XUẤT HIỆN trong output (sau chuẩn hoá) — chấm "contains" là mặc định
     *  vì bài cho người mới thường in kèm lời dẫn tự do. */
    expected: z.string().min(1).max(500),
    /** 'exact': toàn bộ output (chuẩn hoá) phải bằng expected. Mặc định 'contains'. */
    match: z.enum(['contains', 'exact']).default('contains'),
    /** Ca ẩn: học viên chỉ thấy đạt/không đạt, không thấy stdin/expected (chống hardcode). */
    hidden: z.boolean().default(false),
    /** Mô tả ngắn hiện cho học viên (vd "180 kWh → 380.870 đồng"). */
    label: z.string().min(1).max(200),
    /** Bài SQL: BỘ DỮ LIỆU RIÊNG của ca chấm này (DDL + INSERT), nạp thay cho SQL_SEED mặc
     *  định trước khi chạy câu của học viên. Để trống thì dùng SQL_SEED như cũ — nhờ vậy mọi
     *  bài soạn trước vẫn giữ nguyên hành vi. Mục đích: một bài chấm được trên NHIỀU cảnh dữ
     *  liệu (có NULL, bảng rỗng, thứ tự khác) để bắt lời giải chỉ đúng với đúng một bộ số.
     *  Ngôn ngữ khác SQL bỏ qua trường này. */
    datasetSql: z.string().min(1).max(4000).optional(),
  })
  .strict()

/**
 * Danh sách ngôn ngữ bài học, khai ở MỘT chỗ để giao diện duyệt được đủ giá trị mà không
 * chép tay (LangBadge.test.tsx dùng nó để bắt ca "thêm ngôn ngữ mà quên nhãn hiển thị").
 */
export const LESSON_LANGUAGES = [
  'python',
  'pytest',
  'httpsim',
  'apisim',
  'typescript',
  'javascript',
  'sql',
  'html',
  'dom',
  'fetch',
  'git',
  'bash',
  // Mô phỏng Hermes Agent (hermesSim.ts) — khoá ngắn "Hermes Agent" (PR 2/4 khoá Hermes).
  'hermes',
  // Mô phỏng tác tử AI viết code (vibeSim.ts) — khoá ngắn "Vibe Code" (đặc tả
  // docs/specs/2026-08-31-khoa-vibe-code.md).
  'vibe',
  // Mô phỏng OpenClaw (openclawSim.ts) — khoá ngắn "OpenClaw" (PR 2/3 khoá OpenClaw).
  'openclaw',
  'swift',
  // Khoá ngắn "Học máy" (docs/specs/2026-08-31-khoa-hoc-may.md) dùng language: 'python' bình
  // thường (mọi thuật toán tự cài Python thuần) — không cần thêm giá trị riêng ở đây.
  'kotlin',
] as const

export const LessonSchema = z
  .object({
    /**
     * id ổn định `<unit>-l<số>` (vd 'p1-u4-l1') — khoá tiến độ trong Postgres.
     * Nhánh `git-u\d+-l\d+` (vd 'git-u2-l1') và các tiền tố khoá ngắn khác (hermes/vibe/
     * openclaw/ml/pyai/mathai/mlds/cv1/cv2/llmagent) dành riêng cho bài thuộc TẦNG KHOÁ NGẮN
     * (packages/subject-programming/courses/) — khoá cắt ngang bậc P1–P6 nên không đánh số
     * theo `p[1-6]`. Xem docs/specs/2026-08-30-khoa-hoc-thuc-hanh-github.md,
     * docs/specs/2026-08-31-khoa-dieu-phoi-ai-van-phong.md và
     * docs/specs/2026-09-01-cum-6-khoa-ai-engineer.md (cụm 6 khoá pyai→llmagent).
     */
    id: z
      .string()
      .regex(
        /^(p[1-6]-u\d+-l\d+|(git|hermes|vibe|openclaw|ml|pyai|mathai|mlds|cv1|cv2|llmagent)-u\d+-l\d+)$/,
      ),
    /**
     * Unit chứa bài — phải tồn tại trong curriculum.ts (test kiểm chéo), TRỪ nhánh `git-u\d+`/`hermes-u\d+`
     * vốn là "unit ảo" của tầng khoá ngắn, được công nhận qua SHORT_COURSES thay vì curriculum
     * (xem lessons.test.ts).
     */
    unitId: z
      .string()
      .regex(
        /^(p[1-6]-u\d+|(git|hermes|vibe|openclaw|ml|pyai|mathai|mlds|cv1|cv2|llmagent)-u\d+)$/,
      ),
    /** Ngôn ngữ của bài (PR-L7b1) — quyết định bộ chạy ở trình duyệt VÀ cổng CI nào chấm
     *  bài. KHÔNG có giá trị mặc định ngầm: người soạn phải ghi rõ, vì chọn sai ngôn ngữ
     *  nghĩa là bài không được cổng nào chấm. */
    language: z.enum(LESSON_LANGUAGES),
    /** Bài 'dom'/'fetch': TRANG CÓ SẴN mà JavaScript của học viên tác động lên (PR-L7d).
     *  Học viên không sửa trang này — họ chỉ viết script. Bài 'fetch' (PR-L7e) = bài DOM
     *  cộng fetch giả lập (fetchPrelude.ts). Bắt buộc với hai ngôn ngữ này, cấm với các
     *  ngôn ngữ khác (refine bên dưới kiểm). */
    domHtml: z.string().max(4000).optional(),
    title: z.string().min(1).max(120),
    /** ① Móc thực tế (≤ 3 câu). */
    hook: z.string().min(1).max(600),
    /** ② Khái niệm — đoạn văn thuần, xuống dòng bằng \n (chưa cần markdown ở PR-L3). */
    theory: z.string().min(1).max(4000),
    /** Minh hoạ cơ chế ở bước Khái niệm; không tham gia chấm điểm hay tiến độ. */
    animation: LessonAnimationSchema.optional(),
    /** ③ Ví dụ mẫu chạy được, chú thích TỪNG DÒNG bằng comment tiếng Việt trong code. */
    workedExample: z
      .object({
        code: z.string().min(1).max(4000),
        stdinLines: z.array(z.string().max(200)).max(20).default([]),
      })
      .strict(),
    /** ④ Predict: cho code, hỏi "in ra gì?" trước khi cho chạy. */
    predict: z
      .object({
        code: z.string().min(1).max(2000),
        question: z.string().min(1).max(300),
        choices: z.array(z.string().min(1).max(200)).min(2).max(4),
        answerIndex: z.number().int().nonnegative(),
        explain: z.string().min(1).max(600),
      })
      .strict(),
    /** ⑤ Parsons: xếp các dòng code về đúng thứ tự (mảng `lines` là thứ tự ĐÚNG;
     *  UI tự xáo trộn khi hiển thị — deterministic theo id, xem parsonsShuffle()). */
    parsons: z
      .object({
        prompt: z.string().min(1).max(400),
        lines: z.array(z.string().min(1).max(200)).min(3).max(12),
      })
      .strict(),
    /** ⑥ Tự viết (Make): đề + code khởi đầu + test-case + gợi ý bậc thang + code mẫu (phao). */
    make: z
      .object({
        prompt: z.string().min(1).max(1500),
        starterCode: z.string().max(2000).default(''),
        testCases: z.array(TestCaseSchema).min(1).max(10),
        /** Gợi ý bậc thang: nhắc khái niệm → chỉ vùng lỗi → ví dụ tương tự (mở dần). */
        hints: z.array(z.string().min(1).max(500)).min(1).max(5),
        /** Code mẫu tham chiếu — "phao", mở ra được nhưng đánh dấu đã xem. */
        sampleSolution: z.string().min(1).max(4000),
      })
      .strict(),
    /** ⑦ Ứng dụng về nhà — biến thể gắn đời thật, không chấm. */
    homework: z.string().min(1).max(800),
    /** ⑧ Thẻ SRS (PR-L10) — 2–4 thẻ chốt khái niệm CỐT LÕI của bài, vào vòng ôn khi học viên
     *  đạt bài Make. Optional vì bài soạn trước PR-L10 bổ sung dần; cổng srsCards.test.ts
     *  canh chất lượng những thẻ đã có (xem luật soạn thẻ ở đầu file đó). */
    srsCards: z
      .array(
        z
          .object({
            /** Mặt trước: MỘT câu hỏi, trả lời được trong đầu ~10 giây. */
            hoi: z.string().min(1).max(200),
            /** Mặt sau: câu trả lời ngắn gọn, đủ để tự chấm đúng/sai. */
            dap: z.string().min(1).max(400),
          })
          .strict(),
      )
      .min(2)
      .max(4)
      .optional(),
  })
  .strict()
  .refine((l) => l.predict.answerIndex < l.predict.choices.length, {
    message: 'predict.answerIndex vượt quá số lựa chọn',
  })
  .refine((l) => l.id.startsWith(`${l.unitId}-l`), {
    message: 'id bài học phải bắt đầu bằng unitId',
  })
  .refine((l) => (l.language === 'dom' || l.language === 'fetch') === (l.domHtml !== undefined), {
    message: "bài 'dom'/'fetch' phải có domHtml; ngôn ngữ khác thì không được có",
  })

export type ProgrammingTestCase = z.infer<typeof TestCaseSchema>
export type ProgrammingLesson = z.infer<typeof LessonSchema>

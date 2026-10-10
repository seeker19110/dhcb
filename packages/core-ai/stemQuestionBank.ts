// packages/core-ai/stemQuestionBank.ts — Ngân hàng đề cho bảng nháp STEM, dựng từ bài học THẬT.
//
// Đặc tả: docs/specs/2026-10-09-stem-goi-y-socratic-va-nop-loi-giai.md §①, §③.
//
// TRƯỚC changelog 0551 file này là 60 câu DỮ LIỆU MẪU sinh máy: đề "Câu hỏi về hệ phương trình",
// `problemLatex: 'P_{2} = 10x + 0'`, đáp án `S_{2} = 0` — không có câu nào là bài toán thật. Nay
// ngân hàng lấy NGUYÊN VĂN các câu "Tự kiểm tra" (`checkQuestions`) của bài học Toán · Lí · Hoá đã
// có trong repo (`packages/subject-*/lessons`), kèm ĐÁP ÁN MÁY CHẤM ĐƯỢC (`AnswerSpec` của chính bài
// học — cùng engine `gradeAnswer` mà trang bài học dùng). Không bịa đề, không bịa đáp án.
//
// Lọc (giải thích ở đặc tả §①):
//   - bỏ câu trắc nghiệm (`choice`) — bảng nháp là chỗ VIẾT lời giải, không phải chọn A/B/C;
//   - bỏ câu "Nhập 1 nếu ĐÚNG, nhập 0 nếu SAI" — đó là câu đúng/sai mã hoá thành số, không có phép
//     tính để nháp.
//
// File này THUẦN (không import gói môn học — `packages/core-*` không phụ thuộc `subject-*`): server
// truyền danh sách bài học vào `buildStemQuestionBank` (apps/server/src/api/learning/stem-scratchpad.ts).
import type { AnswerSpec } from '@dhcb/core-grading/types'
import type {
  StemBankQuestionPublic,
  StemSubjectType,
  StemVariableTable,
} from '@dhcb/core-contracts/stemScratchpad'

/** Phần bài học STEM mà ngân hàng đề cần — khớp `MathLesson`/`PhysicsLesson`/`ChemLesson`. */
export interface StemLessonSource {
  readonly id: string
  /** Mọi lớp bài học có (Toán có cả 6–9); ngân hàng chỉ nhận lớp `LOP_NGAN_HANG`. */
  readonly grade: string
  readonly chapterTitle: string
  readonly title: string
  readonly track: 'core' | 'advanced'
  readonly reviewStatus: 'draft' | 'reviewed'
  readonly checkQuestions: readonly {
    readonly prompt: string
    readonly answer: AnswerSpec
    readonly explain: string
    /** Bảng thứ nguyên biến (chỉ câu Vật lí có — changelog 0560). */
    readonly variables?: StemVariableTable
  }[]
}

/** Một câu của ngân hàng — bản ĐẦY ĐỦ, chỉ sống ở server (có đáp án + lời giải). */
export interface StemQuestion extends StemBankQuestionPublic {
  /** Đáp án máy chấm được, lấy nguyên từ bài học. */
  answer: Exclude<AnswerSpec, { kind: 'choice' }>
  /** Lời giải của bài học — chỉ trả cho client SAU khi giải đúng. */
  explain: string
  /**
   * Bảng thứ nguyên biến của câu (Vật lí, changelog 0560) — server gắn vào phiên ở
   * `create_problem` để bộ kiểm thứ nguyên chạy được. KHÔNG đưa vào bản công khai của DANH SÁCH đề
   * (`toPublicStemQuestion`) vì màn chọn đề không dùng tới. Phiên đã mở thì vẫn mang bảng (trường
   * `variables` của `StemProblemState`, có từ 0552) — bảng chỉ là ký hiệu → đơn vị, không phải
   * đáp án.
   */
  variables?: StemVariableTable
}

/** Lớp ngân hàng đề phục vụ. Bảng nháp (Companion › Thử thách) là chỗ luyện đề THPT; bài Toán
 *  THCS (lớp 6–9, docs/specs/2026-10-10-toan-thcs-6-9.md) KHÔNG vào đây: client lấy đề không lọc
 *  lớp và cắt theo `limit`, nên trộn lớp 6 vào sẽ đẩy đề lớp 6 lên đầu cho học sinh cấp 3. */
const LOP_NGAN_HANG = ['10', '11', '12'] as const
type LopNganHang = (typeof LOP_NGAN_HANG)[number]

function laLopNganHang(grade: string): grade is LopNganHang {
  return (LOP_NGAN_HANG as readonly string[]).includes(grade)
}

/** Câu đúng/sai mã hoá thành số ("Nhập 1 nếu ĐÚNG, nhập 0 nếu SAI") — không có phép tính để nháp. */
const CAU_MA_HOA_DUNG_SAI = /nhập\s+\d+\s+nếu/i

/** Id ổn định của câu: `<id bài>-q<số thứ tự câu trong bài, từ 1>`. */
export function stemQuestionId(lessonId: string, index: number): string {
  return `${lessonId}-q${index + 1}`
}

/** Đáp số có cần đơn vị không — theo đúng luật của `gradeAnswer` (`unitRequired` mặc định true). */
function canDonVi(answer: AnswerSpec): boolean {
  return (
    answer.kind === 'numeric' &&
    answer.unit !== undefined &&
    answer.unit !== '' &&
    answer.unitRequired !== false
  )
}

/** Dựng ngân hàng đề từ bài học của từng môn. Thứ tự giữ theo thứ tự bài và câu trong bài. */
export function buildStemQuestionBank(
  sources: readonly { subject: StemSubjectType; lessons: readonly StemLessonSource[] }[],
): StemQuestion[] {
  const bank: StemQuestion[] = []
  for (const { subject, lessons } of sources) {
    for (const lesson of lessons) {
      const grade = lesson.grade
      if (!laLopNganHang(grade)) continue
      lesson.checkQuestions.forEach((q, index) => {
        const answer = q.answer
        if (answer.kind === 'choice') return
        if (CAU_MA_HOA_DUNG_SAI.test(q.prompt)) return
        bank.push({
          id: stemQuestionId(lesson.id, index),
          subject,
          grade,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          topic: lesson.chapterTitle,
          track: lesson.track,
          problemStatement: q.prompt,
          needsUnit: canDonVi(answer),
          expectsFraction: answer.kind === 'fraction',
          reviewStatus: lesson.reviewStatus,
          answer,
          explain: q.explain,
          ...(q.variables === undefined ? {} : { variables: q.variables }),
        })
      })
    }
  }
  return bank
}

/**
 * Bản cho client: danh sách TRẮNG từng trường công khai — đáp án và lời giải không bao giờ lọt ra
 * (trước 0551, `get_questions` trả nguyên `solutionLatex`, tức lộ đáp án).
 */
export function toPublicStemQuestion(q: StemQuestion): StemBankQuestionPublic {
  return {
    id: q.id,
    subject: q.subject,
    grade: q.grade,
    lessonId: q.lessonId,
    lessonTitle: q.lessonTitle,
    topic: q.topic,
    track: q.track,
    problemStatement: q.problemStatement,
    needsUnit: q.needsUnit,
    expectsFraction: q.expectsFraction,
    reviewStatus: q.reviewStatus,
  }
}

export function filterStemQuestions(
  bank: readonly StemQuestion[],
  opts: {
    subject?: StemSubjectType
    grade?: '10' | '11' | '12'
    track?: 'core' | 'advanced'
    limit?: number
  },
): StemQuestion[] {
  let filtered = [...bank]
  if (opts.subject) filtered = filtered.filter((q) => q.subject === opts.subject)
  if (opts.grade) filtered = filtered.filter((q) => q.grade === opts.grade)
  if (opts.track) filtered = filtered.filter((q) => q.track === opts.track)
  if (opts.limit !== undefined && opts.limit > 0) filtered = filtered.slice(0, opts.limit)
  return filtered
}

export function getStemQuestionById(
  bank: readonly StemQuestion[],
  id: string,
): StemQuestion | undefined {
  return bank.find((q) => q.id === id)
}

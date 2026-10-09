// api/stem-scratchpad.ts — REST handler cho Platform V5 STEM Interactive Scratchpad.
import { jsonResponse, badJsonOrInternalError } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import { StemScratchpadService } from '@dhcb/core-ai/stemScratchpadService'
import { z } from 'zod'
import {
  StemSubjectTypeSchema,
  StemVariableTableSchema,
  type StemProblemState,
  type SubmitSolutionResult,
} from '@dhcb/core-contracts/stemScratchpad'
import {
  buildStemQuestionBank,
  filterStemQuestions,
  getStemQuestionById,
  toPublicStemQuestion,
} from '@dhcb/core-ai/stemQuestionBank'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'
import { finalValueText } from '@dhcb/core-grading/finalAnswer'
import { gradeAnswer } from '@dhcb/core-grading/index'
import { MATH_LESSONS } from '@dhcb/subject-math/lessons'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { CHEM_LESSONS } from '@dhcb/subject-chemistry/lessons'

// Ngân hàng đề THẬT (changelog 0551): các câu "Tự kiểm tra" có đáp án máy chấm được của bài học
// Toán · Lí · Hoá. Dựng MỘT lần khi nạp module (hàm thuần, vài trăm câu). Sinh học chưa có trong
// bảng nháp (giao diện không có tab, bộ kiểm bước chưa hỗ trợ) nên không đưa vào.
const BANK = buildStemQuestionBank([
  { subject: 'math', lessons: MATH_LESSONS },
  { subject: 'physics', lessons: PHYSICS_LESSONS },
  { subject: 'chemistry', lessons: CHEM_LESSONS },
])

/** Tham số lọc của `get_questions` — sai kiểu thì 400, không âm thầm bỏ qua. */
const GetQuestionsQuerySchema = z.object({
  subject: StemSubjectTypeSchema.optional(),
  grade: z.enum(['10', '11', '12']).optional(),
  track: z.enum(['core', 'advanced']).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(20),
})

/** Mở phiên giải một câu của ngân hàng: client CHỈ gửi id, đề/môn do server tra. */
const CreateFromBankSchema = z.object({ questionId: z.string().min(1).max(100) })

// [2026-08-24] Trước đây các bài đang làm dở nằm trong `new Map` cấp module — mất khi restart,
// VỠ trong PM2 cluster 3 instance, và Map khoá theo problemId TOÀN CỤC nên ai biết id cũng đọc
// /sửa được bài của người khác. Nay lưu ở platform.feature_state THEO USER: vừa bền, vừa khép
// kín theo người dùng (mỗi người chỉ thấy bài của chính mình).
const FEATURE = 'stem_scratchpad'
// Trần số bài giữ lại mỗi người, để dòng JSONB không phình vô hạn.
const MAX_PROBLEMS = 30

type ProblemBook = Record<string, StemProblemState>

async function readProblems(userId: string): Promise<ProblemBook> {
  const state = await getFeatureState<ProblemBook>(userId, FEATURE)
  return state && typeof state === 'object' ? state : {}
}

// Ghi lại một bài, cắt bớt bài cũ nhất nếu vượt trần (theo updatedAt).
async function saveProblem(userId: string, book: ProblemBook, prob: StemProblemState) {
  book[prob.id] = prob
  const ids = Object.keys(book)
  if (ids.length > MAX_PROBLEMS) {
    const keep = ids
      .sort((a, b) => (book[b]!.updatedAt ?? '').localeCompare(book[a]!.updatedAt ?? ''))
      .slice(0, MAX_PROBLEMS)
    const trimmed: ProblemBook = {}
    for (const id of keep) trimmed[id] = book[id]!
    await setFeatureState(userId, FEATURE, trimmed)
    return
  }
  await setFeatureState(userId, FEATURE, book)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Yêu cầu đăng nhập để sử dụng STEM Scratchpad.' },
      401,
    )
  }

  const personId = auth.userId
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    const problemId = url.searchParams.get('problemId')
    if (problemId) {
      const prob = (await readProblems(personId))[problemId]
      if (!prob) {
        return jsonResponse({ error: 'Problem not found' }, 404)
      }
      return jsonResponse({ success: true, problem: prob }, 200)
    }

    // Lọc ngân hàng đề — chỉ trả trường CÔNG KHAI (không đáp án, không lời giải).
    if (action === 'get_questions') {
      const q = GetQuestionsQuerySchema.safeParse({
        subject: url.searchParams.get('subject') ?? undefined,
        grade: url.searchParams.get('grade') ?? undefined,
        track: url.searchParams.get('track') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
      })
      if (!q.success) {
        return jsonResponse({ error: 'Tham số lọc không hợp lệ' }, 400)
      }
      const all = filterStemQuestions(BANK, { ...q.data, limit: undefined })
      const questions = all.slice(0, q.data.limit).map(toPublicStemQuestion)
      return jsonResponse({ success: true, questions, total: all.length }, 200)
    }

    // Trước changelog 0551 nhánh này trả 3 "bài mẫu" viết cứng (2x + 5 = 15…). Bảng nháp nay chỉ
    // dùng ngân hàng đề thật (`action=get_questions`).
    return jsonResponse({ error: 'Invalid action parameter' }, 400)
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'create_problem') {
        // Mở phiên từ NGÂN HÀNG ĐỀ: đề, môn, tiêu đề lấy ở server — không tin client.
        if (body && typeof body === 'object' && 'questionId' in body) {
          const parsed = CreateFromBankSchema.safeParse(body)
          if (!parsed.success) return jsonResponse({ error: 'questionId không hợp lệ' }, 400)
          const question = getStemQuestionById(BANK, parsed.data.questionId)
          if (!question) return jsonResponse({ error: 'Question not found' }, 404)
          const prob = StemScratchpadService.createProblemSession({
            personId,
            subject: question.subject,
            title: question.lessonTitle,
            problemStatement: question.problemStatement,
            questionId: question.id,
          })
          await saveProblem(personId, await readProblems(personId), prob)
          return jsonResponse({ success: true, problem: prob }, 200)
        }

        const { subject, title, problemStatement, problemLatex } = body
        if (!subject || !title || !problemStatement) {
          return jsonResponse({ error: 'Missing required problem fields' }, 400)
        }
        // Bảng thứ nguyên biến (đề Vật lí, changelog 0552) — dữ liệu ngoài nên validate bằng Zod.
        const variables =
          body.variables === undefined
            ? undefined
            : StemVariableTableSchema.safeParse(body.variables)
        if (variables !== undefined && !variables.success) {
          return jsonResponse({ error: 'Invalid variables table' }, 400)
        }

        const prob = StemScratchpadService.createProblemSession({
          personId,
          subject,
          title,
          problemStatement,
          problemLatex,
          ...(variables?.success ? { variables: variables.data } : {}),
        })
        await saveProblem(personId, await readProblems(personId), prob)
        return jsonResponse({ success: true, problem: prob }, 200)
      }

      if (action === 'validate_step') {
        const { problemId, latexInput, explanation } = body
        if (!latexInput) {
          return jsonResponse({ error: 'Missing latexInput' }, 400)
        }

        const book = await readProblems(personId)
        let prob = problemId ? book[problemId] : undefined
        if (!prob) {
          prob = StemScratchpadService.createProblemSession({
            personId,
            subject: 'math',
            title: 'Bài tập STEM',
            problemStatement: 'Giải phương trình',
            // KHÔNG lấy chính bước này làm "đề": bộ kiểm (changelog 0547) sẽ so bước với chính nó
            // và khen "tương đương đề bài" một cách vô nghĩa. Không có đề thì bước đầu là mốc so
            // cho các bước sau, còn bản thân nó "chưa tự kiểm được".
          })
          if (problemId) prob.id = problemId
          book[prob.id] = prob
        }

        const validation = StemScratchpadService.validateStep(
          prob.subject,
          latexInput,
          prob.steps,
          prob,
        )

        const newStep = {
          stepNumber: prob.steps.length + 1,
          latexInput,
          explanation,
          validation,
          createdAt: new Date().toISOString(),
        }
        prob.steps.push(newStep)

        // Chỉ "giải xong" khi bộ kiểm khẳng định đúng đáp số. Trước 2026-10-02 so chuỗi con nên
        // "x = 50" cũng được tính là xong (changelog 0473). Từ changelog 0547 bước GIỮA cũng có
        // thể `valid` (biến đổi tương đương), nên phải có thêm cờ `isFinalAnswer`.
        if (validation.status === 'valid' && validation.isFinalAnswer === true) {
          prob.isSolved = true
        }

        prob.updatedAt = new Date().toISOString()
        await saveProblem(personId, book, prob)

        return jsonResponse(
          {
            success: true,
            step: newStep,
            validation,
            isSolved: prob.isSolved,
            problem: prob,
          },
          200,
        )
      }

      if (action === 'get_hint') {
        const { problemId } = body
        const book = await readProblems(personId)
        const prob = problemId ? book[problemId] : undefined
        if (!prob) {
          return jsonResponse({ error: 'Problem not found' }, 404)
        }

        prob.hintsUsed += 1
        const hint = StemScratchpadService.generateMicroHint(prob)
        // Số gợi ý đã dùng phải được LƯU — trước đây chỉ tăng trong bộ nhớ rồi mất, nên người
        // dùng có thể xin gợi ý vô hạn mà bộ đếm luôn về 1 sau mỗi lần restart/đổi instance.
        await saveProblem(personId, book, prob)
        return jsonResponse({ success: true, hint, hintsUsed: prob.hintsUsed }, 200)
      }

      if (action === 'submit_solution') {
        const { problemId, finalAnswer } = body
        const book = await readProblems(personId)
        const prob = problemId ? book[problemId] : undefined
        if (!prob) {
          return jsonResponse({ error: 'Problem not found' }, 404)
        }
        if (typeof finalAnswer !== 'string') {
          return jsonResponse({ error: 'Missing finalAnswer' }, 400)
        }
        // Chấm theo câu NGÂN HÀNG gắn với phiên (`prob.questionId` — do server gán lúc mở phiên).
        // Trước changelog 0551 tra `getStemQuestionById(problemId)`: id phiên (`prob-…`) không bao
        // giờ trùng id câu, nên nút nộp không thể chấm đúng cho phiên thật; còn client đặt
        // problemId = id câu thì tự chọn được câu để chấm.
        const question =
          prob.questionId === undefined ? undefined : getStemQuestionById(BANK, prob.questionId)
        if (!question) {
          return jsonResponse(
            {
              error: 'NO_ANSWER_KEY',
              message: 'Bài này không thuộc ngân hàng đề nên chưa có đáp án để chấm.',
            },
            409,
          )
        }
        // Đáp án của BÀI HỌC (`AnswerSpec`) qua engine chấm dùng chung: dung sai, đơn vị/thứ
        // nguyên, phân số, công thức hoá — y như trang bài học. `finalValueText` bỏ "x =", vỏ LaTeX.
        const ketQua = gradeAnswer(finalValueText(finalAnswer), question.answer)
        prob.isSolved = prob.isSolved || ketQua.correct
        prob.updatedAt = new Date().toISOString()
        await saveProblem(personId, book, prob)
        // Chỉ hé lời giải khi bài ĐÃ giải đúng — nếu không, nộp bừa thành nút "xem đáp án".
        const result: SubmitSolutionResult = {
          success: true,
          isSolved: prob.isSolved,
          correct: ketQua.correct,
          reason: ketQua.reason,
          ...(prob.isSolved ? { explanation: question.explain } : {}),
        }
        return jsonResponse(result, 200)
      }

      return jsonResponse({ error: 'Invalid action parameter' }, 400)
    } catch (err) {
      return badJsonOrInternalError(err, 'stem-scratchpad')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

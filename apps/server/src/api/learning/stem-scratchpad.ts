// api/stem-scratchpad.ts — REST handler cho Platform V5 STEM Interactive Scratchpad.
import { jsonResponse, badJsonOrInternalError } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import { StemScratchpadService } from '@dhcb/core-ai/stemScratchpadService'
import {
  StemProblemState,
  StemSubjectType,
  StemVariableTableSchema,
} from '@dhcb/core-contracts/stemScratchpad'
import { filterStemQuestions, getStemQuestionById } from '@dhcb/core-ai/stemQuestionBank'
import type { StemQuestion } from '@dhcb/core-ai/stemQuestionBank'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'
import { gradeFinalAnswer } from '@dhcb/core-grading/finalAnswer'

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

    // Lọc ngân hàng câu hỏi nâng cao
    if (action === 'get_questions') {
      const subject = url.searchParams.get('subject') as StemQuestion['subject'] | null
      const gradeStr = url.searchParams.get('grade')
      const difficulty = url.searchParams.get('difficulty') as StemQuestion['difficulty'] | null
      const limitStr = url.searchParams.get('limit')

      const questions = filterStemQuestions({
        subject: subject ?? undefined,
        grade: gradeStr ? (parseInt(gradeStr) as 10 | 11 | 12) : undefined,
        difficulty: difficulty ?? undefined,
        limit: limitStr ? parseInt(limitStr) : 20,
      })
      return jsonResponse({ success: true, questions, total: questions.length }, 200)
    }

    // Trả về danh sách bài tập STEM mẫu
    const sampleProblems = [
      {
        id: 'math-linear-1',
        subject: 'math' as StemSubjectType,
        title: 'Phương trình bậc nhất 1 ẩn',
        problemStatement: 'Giải phương trình: 2x + 5 = 15',
        problemLatex: '2x + 5 = 15',
      },
      {
        id: 'chem-redox-1',
        subject: 'chemistry' as StemSubjectType,
        title: 'Cân bằng phản ứng Oxy hóa - Khử',
        problemStatement: 'Cân bằng phản ứng tạo nước từ Hydro và Oxi:',
        problemLatex: 'H_2 + O_2 \\rightarrow H_2O',
      },
      {
        id: 'phys-motion-1',
        subject: 'physics' as StemSubjectType,
        title: 'Phương trình chuyển động thẳng đều',
        problemStatement:
          'Một vật chuyển động từ trạng thái nghỉ với gia tốc a = 2m/s². Tính vận tốc v sau t = 5s:',
        problemLatex: 'v = v_0 + a \\cdot t',
      },
    ]

    return jsonResponse({ success: true, problems: sampleProblems }, 200)
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'create_problem') {
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
        // So ĐÁP SỐ đã chuẩn hoá với đáp án ngân hàng đề qua engine chấm dùng chung
        // (@dhcb/core-grading): bỏ "x =", thống nhất `,`/`.`, dung sai nhỏ, đơn vị phải khớp.
        // Trước changelog 0539 so CHUỖI CON với 10 ký tự đầu đáp án — "15" khớp "5".
        const question = getStemQuestionById(problemId)
        const isCorrect =
          question !== undefined && gradeFinalAnswer(finalAnswer, question.solutionLatex).correct
        prob.isSolved = prob.isSolved || isCorrect
        prob.updatedAt = new Date().toISOString()
        await saveProblem(personId, book, prob)
        // Chỉ hé lời giải khi bài ĐÃ giải đúng — trước đây nộp đại một đáp số sai cũng nhận về
        // 100 ký tự đầu lời giải, biến nút "nộp" thành nút "xem đáp án".
        return jsonResponse(
          {
            success: true,
            isSolved: prob.isSolved,
            ...(prob.isSolved ? { solutionPreview: question?.solutionLatex?.slice(0, 100) } : {}),
          },
          200,
        )
      }

      return jsonResponse({ error: 'Invalid action parameter' }, 400)
    } catch (err) {
      return badJsonOrInternalError(err, 'stem-scratchpad')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

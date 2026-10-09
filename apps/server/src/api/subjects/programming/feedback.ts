// api/subjects/programming/feedback.ts — AI PHẢN HỒI CODE môn Lập trình (PR-L5).
//
// POST /api/programming/feedback
//   body { kind:'review'|'socratic_hint'|'explain_error', lessonId, code, hintLevel?,
//          errorText?, failedCaseLabels? }
//   → { text, kind, hintLevel? }
//
// Đây là đường gọi AI DUY NHẤT của môn Lập trình. Đường chấm CHÍNH vẫn là test-case chạy
// trong trình duyệt (0đ) — AI chỉ làm phần test-case không làm được (đặc tả §6.3).
//
// Vì sao KHÔNG dùng /api/agent: nó chèn cứng guardrail "gia sư NGÔN NGỮ" (hỏi về Python là
// đúng cái nó được dặn từ chối) và chỉ nhận mode chat/writing/speaking. Xem giải thích đầy đủ
// ở đầu packages/subject-programming/feedbackPrompt.ts.
import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp, internalErrorResponse } from '@dhcb/core-http/http'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { generateChatText } from '@dhcb/core-ai/chatFallback'
import { getLesson } from '@dhcb/subject-programming/lessons'
import {
  buildCodeFeedbackPrompt,
  clampHintLevel,
  MAX_CODE_CHARS,
  MAX_ERROR_CHARS,
  MAX_HINT_LEVEL,
} from '@dhcb/subject-programming/feedbackPrompt'

const BodySchema = z
  .object({
    kind: z.enum(['review', 'socratic_hint', 'explain_error']),
    // 'git-u2-l1'/'hermes-u1-l1'…: bài thuộc tầng KHOÁ NGẮN (cắt ngang bậc P1–P6) — xem
    // lessonTypes.ts.
    lessonId: z
      .string()
      .regex(
        /^(p[1-6]-u\d+-l\d+|(git|hermes|vibe|openclaw|ml|pyai|mathai|mlds|cv1|cv2|llmagent)-u\d+-l\d+)$/,
      ),
    // Code rỗng thì không có gì để góp ý — chặn ở đây để không tiêu lượt vô ích.
    code: z.string().min(1).max(MAX_CODE_CHARS),
    hintLevel: z.number().int().min(1).max(MAX_HINT_LEVEL).optional(),
    errorText: z.string().max(MAX_ERROR_CHARS).optional(),
    // Nhãn ca test chưa đạt — client đã ẩn nhãn ca ẩn trước khi gửi (xem lib/programmingFeedback.ts).
    failedCaseLabels: z.array(z.string().max(200)).max(10).optional(),
  })
  .strict()

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  // Rate-limit chặt hơn các endpoint tiến độ (10/phút thay vì 60): mỗi lượt ở đây là một lời
  // gọi model TRẢ TIỀN, không phải một dòng UPDATE.
  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 10, 'programming-feedback'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/programming/feedback' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, headers)

  const parsed = await readJsonBody(req)
  if (!parsed.ok) return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
  const validated = validateBody(BodySchema, parsed.raw)
  if (!validated.ok)
    return jsonResponse({ error: validated.error.message }, validated.error.status, headers)
  const body = validated.data

  const lesson = getLesson(body.lessonId)
  if (!lesson) {
    return jsonResponse({ error: `Bài học "${body.lessonId}" không tồn tại` }, 400, headers)
  }

  try {
    // "Góp ý chất lượng code" CHỈ mở sau khi bài đã hoàn thành thật (tiến độ server, không tin
    // client báo). Trước khi đạt, thứ học viên cần là gợi ý dẫn dắt — mở review sớm là biến AI
    // thành đường vòng để lấy lời giải, đúng thứ luật NO_SOLUTION_RULE muốn chặn.
    if (body.kind === 'review') {
      const { rows } = await getPgPool().query<{ status: string }>(
        'select status from programming.lesson_progress where user_id = $1 and lesson_id = $2',
        [auth.userId, body.lessonId],
      )
      if (rows[0]?.status !== 'completed') {
        return jsonResponse(
          {
            error:
              'Góp ý chất lượng code mở sau khi bạn đạt hết test-case của bài. Trong lúc đó, dùng "Gợi ý Socratic" nhé!',
          },
          403,
          headers,
        )
      }
    }

    const gate = await checkAndConsumeUsage(auth.userId, 'code_feedback')
    if (!gate.ok) return jsonResponse({ error: gate.message }, 429, headers)

    const hintLevel = body.kind === 'socratic_hint' ? clampHintLevel(body.hintLevel) : undefined
    const prompt = buildCodeFeedbackPrompt({
      kind: body.kind,
      lesson,
      code: body.code,
      hintLevel,
      errorText: body.errorText,
      failedCaseLabels: body.failedCaseLabels,
    })

    const text = await generateChatText({
      system: prompt.system,
      userMessage: prompt.userMessage,
      maxTokens: prompt.maxTokens,
      mode: 'code_feedback',
      task: 'code_feedback',
    })

    if (!text) {
      // Không provider nào dùng được → HOÀN lượt (người học không nhận được gì) và nói thật,
      // không đắp nội dung mẫu như thể AI vừa nghĩ ra.
      await refundUsage(auth.userId, 'code_feedback', gate.day)
      return jsonResponse(
        {
          error:
            'AI đang bận, chưa xem code được. Thử lại sau ít phút nhé — lượt của bạn giữ nguyên.',
        },
        503,
        headers,
      )
    }

    return jsonResponse({ text, kind: body.kind, hintLevel }, 200, headers)
  } catch (err: unknown) {
    return internalErrorResponse(err, headers, 'programming-feedback')
  }
}

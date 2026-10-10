// api/personal/intake.ts — Luồng NGƯỜI MỚI (5 câu ~90 giây).
// Đặc tả: docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md
//
// GET  /api/intake                          → đã trả lời chưa + gợi ý hiện tại (nếu có)
// POST /api/intake { answers }              → lưu câu trả lời, trả về ĐÚNG MỘT việc + ≤2 lựa chọn
// POST /api/intake { action:'choose', taskId } → ghi lại việc người dùng chọn
//
// LUẬT KIẾN TRÚC: route này KHÔNG bao giờ trả ra nội dung lớp hồ sơ ẩn. Thứ duy nhất đi ra là kết
// quả của `buildIntakeResult()` — vốn đã qua bộ lọc ngôn ngữ và được test quét toàn bộ tổ hợp.

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { IntakeAnswersSchema, AgeGroupSchema } from '@dhcb/core-contracts/intake'
import {
  getIntakeState,
  saveIntake,
  saveChosenTask,
  markTaskDone,
} from '@dhcb/core-personal/intakeService'
import { buildIntakeResult } from '@dhcb/core-personal/intakeSuggestion'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const BodySchema = z.union([
  z.object({
    action: z.literal('save').optional(),
    answers: IntakeAnswersSchema,
    // Nhóm tuổi đi thẳng vào public.profiles (nguồn sự thật nền tảng), không vào personal.intake.
    ageGroup: AgeGroupSchema.optional(),
  }),
  z.object({ action: z.literal('choose'), taskId: z.string().min(1).max(60) }),
  z.object({ action: z.literal('done') }),
])

const INTAKE_MISSING_MESSAGE = 'Bạn chưa trả lời 5 câu hỏi đầu — hãy trả lời trước nhé.'

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'intake'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/intake' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  const pool = getPgPool()

  if (req.method === 'GET') {
    const state = await getIntakeState(pool, auth.userId)
    return jsonResponse(
      {
        done: state.done,
        chosenTaskId: state.chosenTaskId,
        taskDone: state.taskDone,
        // Chỉ sinh gợi ý khi đã trả lời — chưa trả lời mà đưa gợi ý là đoán mò không có cơ sở nào.
        result: state.done ? buildIntakeResult(state.answers) : null,
      },
      200,
      allHeaders,
    )
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  }

  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok)
    return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, allHeaders)
  const result = validateBody(BodySchema, parsedBody.raw)
  if (!result.ok)
    return jsonResponse({ error: result.error.message }, result.error.status, allHeaders)

  if (result.data.action === 'choose' || result.data.action === 'done') {
    const saved =
      result.data.action === 'choose'
        ? await saveChosenTask(pool, auth.userId, result.data.taskId)
        : await markTaskDone(pool, auth.userId)
    // Chưa trả lời 5 câu thì chưa có hàng intake để ghi — báo thẳng thay vì `ok: true` giả.
    if (!saved) return jsonResponse({ error: INTAKE_MISSING_MESSAGE }, 409, allHeaders)
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  // Sinh gợi ý TRƯỚC rồi mới lưu: cần ghi lại đúng việc ĐÃ gợi ý (`suggested_task_id`) để về sau
  // đo được suy luận có trúng không. Tính lại lúc thống kê thì mọi số liệu lịch sử sẽ đổi theo mỗi
  // lần sửa thuật toán, và ta mất khả năng so sánh trước/sau khi cải tiến.
  const preview = buildIntakeResult(IntakeAnswersSchema.parse(result.data.answers))
  const answers = await saveIntake(pool, auth.userId, result.data.answers, preview.primary.id)
  if (result.data.ageGroup) {
    await pool.query('update public.profiles set age_group = $1 where id = $2', [
      result.data.ageGroup,
      auth.userId,
    ])
  }
  return jsonResponse({ ok: true, result: buildIntakeResult(answers) }, 200, allHeaders)
}

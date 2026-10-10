// api/companion.ts — V2-09 Companion Runtime API endpoint.
// POST /api/companion -> executes a complete Companion turn.
import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { getTwoFactorStatus, hasStepUp } from '@dhcb/core-auth/twoFactor'
import { readSessionCookie } from '@dhcb/core-auth/sessionCookie'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { executeCompanionTurn, streamCompanionTurn } from '@dhcb/core-personal/companionRuntime'
import {
  listRecentCompanionMessages,
  COMPANION_HISTORY_PAGE_SIZE,
} from '@dhcb/core-personal/companionMessageService'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp, internalErrorResponse } from '@dhcb/core-http/http'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'

const CompanionApiRequestSchema = z
  .object({
    message: z.string().min(1).max(2000),
    intent: z.string().max(100).optional(),
    domain: z.string().max(100).optional(),
    tokenBudget: z.number().int().positive().max(8000).optional(),
    stream: z.boolean().optional(),
  })
  .strict()

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'companion'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/companion' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  // GET /api/companion → lịch sử hội thoại gần nhất, để mở lại trang là thấy lại cuộc trò chuyện.
  // KHÔNG đếm lượt: đây là đọc dữ liệu đã có, không gọi model AI nên không tốn tiền API.
  if (req.method === 'GET') {
    try {
      const pool = getPgPool()
      const person = await getOrCreatePerson(pool, auth.userId)
      const privateAccess =
        (await getTwoFactorStatus(pool, auth.userId)).enabled &&
        (await hasStepUp(pool, auth.userId, readSessionCookie(req)))
      const messages = await listRecentCompanionMessages(
        pool,
        person.id,
        COMPANION_HISTORY_PAGE_SIZE,
        undefined,
        privateAccess ? 'restricted' : 'personal',
      )
      return jsonResponse({ messages }, 200, headers)
    } catch (err: unknown) {
      if (isAppError(err)) {
        return jsonResponse(toErrorBody(err), err.status, headers)
      }
      return internalErrorResponse(err, headers, 'companion-history')
    }
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  const bodyParsed = await readJsonBody(req)
  if (!bodyParsed.ok) {
    return jsonResponse(bodyParsed.error, bodyParsed.error.status, headers)
  }
  const validation = validateBody(CompanionApiRequestSchema, bodyParsed.raw)
  if (!validation.ok) {
    return jsonResponse(validation.error, validation.error.status, headers)
  }

  // Đếm lượt như chế độ 'chat' — Companion gọi đúng các model trả phí của /api/agent nên
  // phải chịu cùng hạn mức Free/Pro (lỗ hổng chi phí vá 2026-08-23, xem đề xuất N1 mục B3).
  const gate = await checkAndConsumeUsage(auth.userId, 'chat')
  if (!gate.ok) {
    logSecurityEvent('USAGE_LIMIT', clientIp, { path: '/api/companion' })
    return jsonResponse({ error: gate.message }, 429, headers)
  }

  try {
    const pool = getPgPool()
    const person = await getOrCreatePerson(pool, auth.userId)

    const privateAccess =
      (await getTwoFactorStatus(pool, auth.userId)).enabled &&
      (await hasStepUp(pool, auth.userId, readSessionCookie(req)))
    const turnInput = {
      personId: person.id,
      userMessage: validation.data.message,
      intent: validation.data.intent,
      targetDomain: validation.data.domain,
      tokenBudget: validation.data.tokenBudget,
      maxSensitivity: privateAccess ? ('sensitive' as const) : ('personal' as const),
    }

    if (validation.data.stream) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          // Hoàn lượt TỐI ĐA một lần: nhánh câu mẫu dự phòng và nhánh lỗi đều hoàn, mà nhánh lỗi
          // vẫn có thể chạy SAU khi đã hoàn (vd `enqueue` ném vì client đã đóng kết nối).
          let refunded = false
          const refundOnce = () => {
            if (refunded) return
            refunded = true
            refundUsage(auth.userId, 'chat', gate.day).catch(() => {})
          }
          try {
            for await (const event of streamCompanionTurn(pool, turnInput)) {
              // Không AI nào trả lời được (câu mẫu dự phòng) → hoàn lượt như khi lỗi.
              if (event.type === 'done' && event.data.isFallback) refundOnce()
              // Metadata công khai chỉ chứa số liệu, không gửi raw context qua SSE.
              const data =
                event.type === 'meta'
                  ? { ...event.data, contextPackage: { ...event.data.contextPackage, items: [] } }
                  : event.data
              const sseChunk = `event: ${event.type}\ndata: ${JSON.stringify(data)}\n\n`
              controller.enqueue(encoder.encode(sseChunk))
            }
            controller.close()
          } catch (streamErr) {
            // Provider lỗi giữa chừng → trả lại lượt vừa trừ (cùng quy ước /api/agent)
            refundOnce()
            // Lỗi không phải AppError có thể mang thông điệp nội bộ (pg, nhà cung cấp AI) → chỉ
            // ghi log phía server, client nhận thông điệp chung (audit 2026-10-10, E1).
            if (!isAppError(streamErr)) {
              console.error(
                '[500] companion stream',
                streamErr instanceof Error ? streamErr.message : String(streamErr),
              )
            }
            const errPayload = isAppError(streamErr)
              ? toErrorBody(streamErr)
              : { error: 'Stream error', message: 'Internal server error' }
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify(errPayload)}\n\n`),
            )
            controller.close()
          }
        },
      })

      return new Response(stream, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    }

    const response = await executeCompanionTurn(pool, turnInput)
    // Câu mẫu dự phòng (mọi nhà cung cấp AI đều hỏng) không phải câu trả lời AI → hoàn lượt
    // (audit 2026-10-10, E1). Lượt vẫn trả 200 vì hành động đề xuất/đã chạy là kết quả thật.
    if (response.isFallback) refundUsage(auth.userId, 'chat', gate.day).catch(() => {})

    return jsonResponse(
      { ...response, contextPackage: { ...response.contextPackage, items: [] } },
      200,
      headers,
    )
  } catch (err: unknown) {
    // Lỗi trước khi có phản hồi AI → trả lại lượt (cùng quy ước /api/agent)
    refundUsage(auth.userId, 'chat', gate.day).catch(() => {})
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    return internalErrorResponse(err, headers, 'companion')
  }
}

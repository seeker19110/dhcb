// api/realtime-multimodal.ts — API Gateway quản lý phiên đàm thoại đa phương thức song công V4.
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders, logSecurityEvent } from '@dhcb/core-auth/security'
import {
  createMultimodalSession,
  getMultimodalSession,
  removeMultimodalSession,
} from '@dhcb/core-ai/realtimeMultimodalService'
import {
  RealtimeSessionConfigSchema,
  REALTIME_MULTIMODAL_VERSION,
} from '@dhcb/core-contracts/realtimeMultimodal'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const url = new URL(req.url)

  if (req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId) {
      return jsonResponse({ error: 'Missing sessionId parameter' }, 400)
    }

    const session = getMultimodalSession(sessionId)
    // Chỉ CHỦ phiên mới xem được. Phiên của người khác trả CÙNG 404 với phiên không tồn tại —
    // không để lộ "id này có thật" (cùng khuôn với /api/gemini-live).
    if (!session || session.config.personId !== auth.userId) {
      return jsonResponse({ error: 'Session not found or already closed' }, 404)
    }

    return jsonResponse({
      sessionId: session.config.sessionId,
      state: session.getState(),
      config: session.config,
      schemaVersion: REALTIME_MULTIMODAL_VERSION,
    })
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const parsedConfig = RealtimeSessionConfigSchema.partial().parse(body)
      // sessionId LUÔN do server sinh. Trước đây client gửi kèm sessionId được dùng thẳng làm
      // khoá Map → gửi id phiên của người khác là ghi đè (chiếm) phiên đó. Bỏ qua + ghi log.
      const { sessionId: clientSessionId, ...safeConfig } = parsedConfig
      if (clientSessionId) {
        logSecurityEvent('CLIENT_SESSION_ID_IGNORED', getClientIp(req), {
          path: '/api/realtime-multimodal',
        })
      }

      const session = createMultimodalSession({
        ...safeConfig,
        personId: auth.userId,
      })

      return jsonResponse(
        {
          sessionId: session.config.sessionId,
          state: session.getState(),
          config: session.config,
          websocketEndpoint: `/ws/realtime-multimodal?sessionId=${session.config.sessionId}`,
          schemaVersion: REALTIME_MULTIMODAL_VERSION,
        },
        201,
      )
    } catch (err) {
      return jsonResponse(
        { error: 'Invalid session configuration payload', details: String(err) },
        400,
      )
    }
  }

  if (req.method === 'DELETE') {
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId) {
      return jsonResponse({ error: 'Missing sessionId parameter' }, 400)
    }

    // Chỉ chủ phiên mới đóng được phiên của mình (trước đây ai biết id cũng xoá được).
    const session = getMultimodalSession(sessionId)
    if (!session || session.config.personId !== auth.userId) {
      return jsonResponse({ error: 'Session not found or already closed' }, 404)
    }
    const removed = removeMultimodalSession(sessionId)
    return jsonResponse({ success: removed })
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

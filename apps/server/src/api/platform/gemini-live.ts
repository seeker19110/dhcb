// api/gemini-live.ts — REST handler cho Gemini Live Session Gateway V7.2.
import { jsonResponse } from '@dhcb/core-http/http'
import { randomUUID } from 'node:crypto'
import {
  validateAuth,
  getCorsHeaders,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getClientIp } from '@dhcb/core-http/http'
import { reserveGeminiLiveUsage } from '@dhcb/core-ai/geminiLiveAdmission'
import { readJsonBody } from '@dhcb/core-http/validation'
import { getAppSettings } from '@dhcb/core-db/settings'
import {
  createGeminiLiveSession,
  getGeminiLiveSession,
  removeGeminiLiveSession,
} from '@dhcb/core-ai/geminiLiveService'
import {
  GeminiLiveSessionRequestSchema,
  GEMINI_LIVE_VERSION,
} from '@dhcb/core-contracts/geminiLive'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 10, 'gemini_live'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/gemini-live' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429)
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

    const session = getGeminiLiveSession(sessionId)
    if (!session || session.config.personId !== auth.userId) {
      return jsonResponse({ error: 'Session not found or already closed' }, 404)
    }

    return jsonResponse({
      sessionId: session.config.sessionId,
      status: session.getStatus(),
      config: session.config,
      schemaVersion: GEMINI_LIVE_VERSION,
    })
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req)
    if (!body.ok) return jsonResponse({ error: body.error.message }, body.error.status)
    const parsedConfig = GeminiLiveSessionRequestSchema.safeParse(body.raw)
    if (!parsedConfig.success) return jsonResponse({ error: 'Invalid configuration' }, 400)

    const gate = await reserveGeminiLiveUsage(auth.userId)
    if (!gate.ok) {
      logSecurityEvent('USAGE_LIMIT', clientIp, { path: '/api/gemini-live' })
      return jsonResponse({ error: gate.message }, gate.status)
    }
    const sessionId = `live-${randomUUID()}`
    let session: ReturnType<typeof createGeminiLiveSession> | undefined
    try {
      session = createGeminiLiveSession({
        ...parsedConfig.data,
        sessionId,
        personId: auth.userId,
      })
      session.once('closed', gate.admission.release)
      session.start()
      if (session.hasProviderStarted()) gate.admission.markStarted()
      else await gate.admission.refundBeforeStart()
      // start/hoàn lượt có thể đã đóng phiên; không gắn interval mồ côi hoặc báo tạo thành công.
      if (session.getStatus() === 'closed') throw new Error('Session closed during startup')
      let checking = false
      const revalidation = setInterval(() => {
        if (checking) return
        checking = true
        void Promise.all([validateAuth(req), getAppSettings({ requireAvailable: true })])
          .then(([currentAuth, settings]) => {
            if (currentAuth?.userId !== auth.userId || settings.aiCircuitBreaker) {
              removeGeminiLiveSession(sessionId)
            }
          })
          .catch(() => removeGeminiLiveSession(sessionId))
          .finally(() => {
            checking = false
          })
      }, 30_000)
      revalidation.unref()
      session.once('closed', () => clearInterval(revalidation))

      return jsonResponse(
        {
          success: true,
          sessionId: session.config.sessionId,
          status: session.getStatus(),
          config: session.config,
          schemaVersion: GEMINI_LIVE_VERSION,
        },
        201,
      )
    } catch {
      if (session?.hasProviderStarted()) gate.admission.markStarted()
      removeGeminiLiveSession(sessionId)
      gate.admission.release()
      await gate.admission.refundBeforeStart()
      return jsonResponse({ error: 'Không thể mở phiên giọng nói.' }, 503)
    }
  }

  if (req.method === 'DELETE') {
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId) {
      return jsonResponse({ error: 'Missing sessionId parameter' }, 400)
    }

    const session = getGeminiLiveSession(sessionId)
    if (!session || session.config.personId !== auth.userId) {
      return jsonResponse({ error: 'Session not found or already closed' }, 404)
    }
    removeGeminiLiveSession(sessionId)
    return jsonResponse({ success: true, message: 'Session closed successfully' }, 200)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

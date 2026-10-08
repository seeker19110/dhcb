// api/mesh-telemetry.ts — REST handler cho WebSocket Mesh & Realtime Telemetry V4.4.
import { jsonResponse, badJsonOrInternalError } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import {
  RealtimeSessionTelemetry,
  RealtimeSessionTelemetrySchema,
  MESH_TELEMETRY_VERSION,
} from '@dhcb/core-contracts/meshTelemetry'
import { MeshTelemetryService } from '@dhcb/core-ai/meshTelemetryService'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'

// [2026-08-24] Trước đây telemetry nằm trong `new Map` cấp module — mất khi restart và VỠ trong
// PM2 cluster 3 instance (mỗi tiến trình một bản sao, số liệu chi phí đọc ra tuỳ instance nào
// nhận request). Nay lưu ở platform.feature_state.
const FEATURE = 'mesh_telemetry'

// Đọc telemetry đang có, hoặc dựng bản mặc định nếu người này chưa có phiên nào.
async function readOrCreate(personId: string): Promise<RealtimeSessionTelemetry> {
  const saved = await getFeatureState<RealtimeSessionTelemetry>(personId, FEATURE)
  if (saved) return saved
  return MeshTelemetryService.createDefaultSessionTelemetry({
    sessionId: `40000000-0000-4000-8000-${Date.now().toString().slice(-12).padStart(12, '0')}`,
    personId,
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Yêu cầu đăng nhập để truy cập Telemetry.' },
      401,
    )
  }

  const personId = auth.userId
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    const existing = await readOrCreate(personId)
    await setFeatureState(personId, FEATURE, existing)

    return jsonResponse(
      {
        success: true,
        telemetry: existing,
        meshStatus: {
          activeNodes: 3,
          overallQuality: 98,
          region: 'ap-southeast-1 (Singapore)',
        },
      },
      200,
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'record_metric') {
        const current = await readOrCreate(personId)

        const updated = MeshTelemetryService.trackLiveSessionCost({
          current,
          addedTokens: Number(body.addedTokens || 0),
          addedAudioSeconds: Number(body.addedAudioSeconds || 0),
          provider: body.provider || 'gemini_live',
          latencyMs: Number(body.latencyMs || 50),
        })

        await setFeatureState(personId, FEATURE, updated)
        return jsonResponse({ success: true, telemetry: updated }, 200)
      }

      if (action === 'reset_budget') {
        const current = await readOrCreate(personId)

        const newCap = Math.max(0.01, Number(body.costCapUsd || 0.1))
        const resetState: RealtimeSessionTelemetry = {
          ...current,
          costCapUsd: newCap,
          budgetWarning: false,
          isThrottled: false,
          qualityTier: 'ultra_low_latency',
          updatedAt: new Date().toISOString(),
        }

        await setFeatureState(personId, FEATURE, resetState)
        return jsonResponse({ success: true, telemetry: resetState }, 200)
      }

      const parseResult = RealtimeSessionTelemetrySchema.safeParse({
        ...body,
        personId,
        schemaVersion: MESH_TELEMETRY_VERSION,
      })

      if (!parseResult.success) {
        return jsonResponse({ error: 'invalid_request', details: parseResult.error.format() }, 400)
      }

      await setFeatureState(personId, FEATURE, parseResult.data)
      return jsonResponse({ success: true, telemetry: parseResult.data }, 200)
    } catch (err) {
      return badJsonOrInternalError(err, 'mesh-telemetry', 'Invalid payload')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

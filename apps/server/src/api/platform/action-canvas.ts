// api/action-canvas.ts — REST handler cho Không gian làm việc Tương tác Action Canvas V4.2.
// State đã chuyển sang bảng platform.feature_state (migration 0058, packages/core-db/featureState.ts)
// — thay cho Map in-memory cấp module, tránh mất dữ liệu/vỡ trong PM2 cluster.
import { jsonResponse } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import {
  ActionCanvasState,
  ActionCanvasStateSchema,
  ACTION_CANVAS_VERSION,
} from '@dhcb/core-contracts/actionCanvas'
import { ActionCanvasService } from '@dhcb/core-personal/actionCanvasService'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'

const FEATURE = 'action_canvas'

// Đọc canvas đã lưu và chuẩn hoá qua hợp đồng: canvas lưu trước 2026-10-02 có thể còn nút gán miền
// đã xoá (career/startup/life) — hợp đồng đổi chúng về `general` (changelog 0485). Bản lưu không
// khớp hợp đồng vì lý do khác thì trả nguyên văn như trước, không làm mất dữ liệu của người dùng.
async function readCanvas(personId: string): Promise<ActionCanvasState | null> {
  const stored = await getFeatureState<ActionCanvasState>(personId, FEATURE)
  if (!stored) return null
  const parsed = ActionCanvasStateSchema.safeParse(stored)
  return parsed.success ? parsed.data : stored
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Yêu cầu đăng nhập để truy cập Action Canvas.' },
      401,
    )
  }

  const personId = auth.userId
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    const existing =
      (await readCanvas(personId)) ||
      ActionCanvasService.synthesizeCrossDomainGoalCanvas({
        canvasId: '11111111-1111-4111-8111-111111111111',
        personId,
        goalPrompt: 'Lộ trình Phát triển Toàn diện & Tiếng Anh Quốc tế 2026',
      })

    return jsonResponse(
      {
        success: true,
        canvas: existing,
      },
      200,
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'synthesize') {
        const goalPrompt = String(body.goalPrompt || 'Mục tiêu Phát triển Cá nhân').slice(0, 200)
        const canvasId = body.canvasId || '11111111-1111-4111-8111-111111111111'
        const synthesized = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
          canvasId,
          personId,
          goalPrompt,
        })
        await setFeatureState(personId, FEATURE, synthesized)
        return jsonResponse({ success: true, canvas: synthesized }, 200)
      }

      if (action === 'auto_layout') {
        const existing = await readCanvas(personId)
        if (!existing) {
          return jsonResponse({ error: 'canvas_not_found' }, 404)
        }
        const updatedNodes = ActionCanvasService.autoLayoutCanvasNodes(
          existing.nodes,
          existing.edges,
        )
        const updatedCanvas: ActionCanvasState = {
          ...existing,
          nodes: updatedNodes,
          updatedAt: new Date().toISOString(),
        }
        await setFeatureState(personId, FEATURE, updatedCanvas)
        return jsonResponse({ success: true, canvas: updatedCanvas }, 200)
      }

      if (action === 'export') {
        const existing = await readCanvas(personId)
        if (!existing) {
          return jsonResponse({ error: 'canvas_not_found' }, 404)
        }
        const markdown = ActionCanvasService.exportCanvasToMarkdown(existing)
        return jsonResponse(
          {
            success: true,
            format: 'markdown',
            markdown,
            title: existing.title,
          },
          200,
        )
      }

      const parseResult = ActionCanvasStateSchema.safeParse({
        ...body,
        personId,
        schemaVersion: ACTION_CANVAS_VERSION,
      })

      if (!parseResult.success) {
        return jsonResponse({ error: 'invalid_request', details: parseResult.error.format() }, 400)
      }

      await setFeatureState(personId, FEATURE, parseResult.data)
      return jsonResponse({ success: true, canvas: parseResult.data }, 200)
    } catch (err) {
      return jsonResponse({ error: 'Invalid payload', details: String(err) }, 400)
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

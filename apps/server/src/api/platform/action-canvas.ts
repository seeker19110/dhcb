// api/action-canvas.ts — REST handler cho Không gian làm việc Tương tác Action Canvas V4.2.
// State đã chuyển sang bảng platform.feature_state (migration 0058, packages/core-db/featureState.ts)
// — thay cho Map in-memory cấp module, tránh mất dữ liệu/vỡ trong PM2 cluster.
import { jsonResponse, internalErrorResponse } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import {
  ActionCanvasState,
  ActionCanvasStateSchema,
  ACTION_CANVAS_VERSION,
} from '@dhcb/core-contracts/actionCanvas'
import { UuidSchema } from '@dhcb/core-contracts/shared'
import { ActionCanvasService } from '@dhcb/core-personal/actionCanvasService'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'

const FEATURE = 'action_canvas'
const DEFAULT_CANVAS_ID = '11111111-1111-4111-8111-111111111111'

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
    // [audit M11, đợt U5] Chưa lưu canvas nào → canvas RỖNG (giao diện hiện hướng dẫn), không
    // còn tự dựng 4 thẻ mẫu trông như kế hoạch của chính người dùng.
    const existing =
      (await readCanvas(personId)) ||
      ActionCanvasService.createEmptyCanvas({ canvasId: DEFAULT_CANVAS_ID, personId })

    return jsonResponse(
      {
        success: true,
        canvas: existing,
      },
      200,
    )
  }

  if (req.method === 'POST') {
    // [đợt U5] Chỉ body JSON hỏng mới là lỗi phía client (400). Trước đây MỌI lỗi — kể cả CSDL
    // hỏng khi ghi feature_state — bị gom thành 400 "Invalid payload" kèm chuỗi lỗi nội bộ.
    let body: Record<string, unknown>
    try {
      const parsed: unknown = await req.json()
      body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400)
    }
    try {
      if (action === 'synthesize') {
        const goalPrompt = String(body.goalPrompt || 'Mục tiêu Phát triển Cá nhân').slice(0, 200)
        // canvasId lạ (gọi API trực tiếp) mà vẫn lưu thì canvas không qua được hợp đồng ở lần
        // đọc sau — chỉ nhận UUID, còn lại dùng id mặc định.
        const requestedId = UuidSchema.safeParse(body.canvasId)
        const canvasId = requestedId.success ? requestedId.data : DEFAULT_CANVAS_ID
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
      return internalErrorResponse(err, {}, 'action-canvas')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/actionCanvasApi.ts — Client API giao tiếp Action Canvas V4.2.
import { z } from 'zod'
import { ActionCanvasState, ActionCanvasStateSchema } from '@dhcb/core-contracts/actionCanvas'

export async function fetchActionCanvas(): Promise<ActionCanvasState> {
  const res = await fetch('/api/action-canvas', {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải Action Canvas: ${res.status}`)
  }

  const data = await res.json()
  return data.canvas
}

export async function saveActionCanvas(canvas: ActionCanvasState): Promise<ActionCanvasState> {
  const res = await fetch('/api/action-canvas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(canvas),
  })

  if (!res.ok) {
    throw new Error(`Lỗi lưu Action Canvas: ${res.status}`)
  }

  const data = await res.json()
  return data.canvas
}

// ── AI ĐỀ XUẤT phân rã mục tiêu (changelog 0549) ─────────────────────────────────────────────
// Server KHÔNG lưu đề xuất — trang hiển thị cho người dùng xem/sửa, bấm "Lưu" mới gọi
// saveActionCanvas. Kết quả trả về là union theo từng tình huống để giao diện hiện đúng trạng thái
// (hết lượt khác AI hỏng khác đang chạy), không gom mọi lỗi thành một câu chung.
export type SynthesizeResult =
  | { kind: 'ok'; proposal: ActionCanvasState }
  /** Hết lượt AI hôm nay / cầu dao AI đang bật — gợi ý tự bắt đầu không dùng AI. */
  | { kind: 'quota'; message: string }
  /** Đang có một lần tạo khác chạy (bấm hai lần, hai tab). */
  | { kind: 'busy'; message: string }
  /** Mục tiêu không hợp lệ (quá ngắn…). */
  | { kind: 'invalid'; message: string }
  /** AI không trả lời / trả đầu ra hỏng / lỗi mạng — lượt đã được hoàn ở server. */
  | { kind: 'error'; message: string }

const ErrorBodySchema = z.object({ error: z.string().optional(), message: z.string().optional() })
const ProposalBodySchema = z.object({ proposal: ActionCanvasStateSchema })

const MSG_GENERIC = 'Chưa tạo được đề xuất. Kiểm tra kết nối rồi thử lại nhé.'

export async function synthesizeGoalCanvas(
  goalPrompt: string,
  canvasId?: string,
): Promise<SynthesizeResult> {
  let res: Response
  try {
    res = await fetch('/api/action-canvas?action=synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ goalPrompt, canvasId }),
    })
  } catch {
    return { kind: 'error', message: MSG_GENERIC }
  }

  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    // body không phải JSON (proxy lỗi…) — rơi xuống nhánh lỗi chung bên dưới.
  }

  if (res.ok) {
    // Dữ liệu ngoài → validate lúc chạy (CLAUDE.md §4.1): đề xuất lệch hợp đồng thì coi là lỗi,
    // không vẽ một canvas mà bấm Lưu sẽ bị server từ chối.
    const parsed = ProposalBodySchema.safeParse(json)
    return parsed.success
      ? { kind: 'ok', proposal: parsed.data.proposal }
      : { kind: 'error', message: MSG_GENERIC }
  }

  const body = ErrorBodySchema.safeParse(json)
  const message = (body.success && body.data.message) || MSG_GENERIC
  const code = body.success ? body.data.error : undefined
  if (res.status === 429 && code === 'usage_limit') return { kind: 'quota', message }
  if (res.status === 409) return { kind: 'busy', message }
  if (res.status === 400) return { kind: 'invalid', message }
  return { kind: 'error', message }
}

export async function exportCanvasMarkdown(): Promise<{ markdown: string; title: string }> {
  const res = await fetch('/api/action-canvas?action=export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    throw new Error(`Lỗi xuất Markdown: ${res.status}`)
  }

  return await res.json()
}

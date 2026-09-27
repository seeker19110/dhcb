import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/actionCanvasApi.ts — Client API giao tiếp Action Canvas V4.2.
import { ActionCanvasState } from '@dhcb/core-contracts/actionCanvas'

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

export async function synthesizeGoalCanvas(goalPrompt: string): Promise<ActionCanvasState> {
  const res = await fetch('/api/action-canvas?action=synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ goalPrompt }),
  })

  if (!res.ok) {
    throw new Error(`Lỗi phân rã mục tiêu: ${res.status}`)
  }

  const data = await res.json()
  return data.canvas
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

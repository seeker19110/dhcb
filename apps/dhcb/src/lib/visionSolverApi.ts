// apps/dhcb/src/lib/visionSolverApi.ts — Client API for Multimodal Vision STEM Solver.
import type { VisionSolveRequest, VisionSolveResponse } from '@dhcb/core-contracts/visionSolver'

export async function solveProblemImage(request: VisionSolveRequest): Promise<VisionSolveResponse> {
  const resp = await fetch('/api/vision-solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!resp.ok) {
    const data: unknown = await resp.json().catch(() => ({}))
    throw new Error(readErrorMessage(data) ?? `Lỗi giải bài tập qua hình ảnh (${resp.status})`)
  }

  return resp.json()
}

/**
 * Server trả lỗi theo hai khuôn: `{error: 'chuỗi'}` (handler cũ) và `{error: {message, code}}`
 * (`AppError`, vd 503 khi server chưa cấu hình key AI). Đọc được cả hai, tránh hiện "[object Object]".
 */
function readErrorMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('error' in data)) return undefined
  const err = data.error
  if (typeof err === 'string') return err
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof err.message === 'string'
  )
    return err.message
  return undefined
}

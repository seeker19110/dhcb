// programmingPathProgress — tiến độ LỘ TRÌNH MỤC TIÊU môn Lập trình phía client.
//
// Cùng khuôn với programmingSpecProgress.ts: nguồn sự thật là server
// (/api/programming/path-progress), localStorage chỉ là bộ đệm để mở trang thấy ngay.
import { getAuthHeader } from '@core/authHeader'
import { readLocalArray } from './localJson'

export type PathStageStatus = 'skipped' | 'in_progress' | 'completed'

export interface PathStageProgress {
  pathId: string
  stageId: string
  status: PathStageStatus
  updatedAt: number
}

const cacheKey = (uid: string, pathId: string) => `dhcb_prog_path_${pathId}_${uid}`

function readCache(uid: string, pathId: string): PathStageProgress[] {
  return readLocalArray<PathStageProgress>(cacheKey(uid, pathId))
}

function writeCache(uid: string, pathId: string, stages: PathStageProgress[]): void {
  try {
    localStorage.setItem(cacheKey(uid, pathId), JSON.stringify(stages))
  } catch {
    // localStorage đầy/bị chặn — bỏ qua, server vẫn là nguồn sự thật.
  }
}

const API = '/api/programming/path-progress'

/** Đọc tiến độ của một lộ trình; server lỗi/ngoại tuyến thì trả bộ đệm để trang vẫn hiển thị. */
export async function fetchPathProgress(uid: string, pathId: string): Promise<PathStageProgress[]> {
  try {
    const res = await fetch(`${API}?pathId=${encodeURIComponent(pathId)}`, {
      headers: getAuthHeader(),
    })
    if (!res.ok) return readCache(uid, pathId)
    const body = (await res.json()) as { stages?: PathStageProgress[] }
    const stages = body.stages ?? []
    writeCache(uid, pathId, stages)
    return stages
  } catch {
    return readCache(uid, pathId)
  }
}

/** Ghi hàng loạt kết quả chẩn đoán (nhiều chặng 'skipped' + một chặng 'in_progress'). */
export async function savePathStages(
  pathId: string,
  stages: { stageId: string; status: PathStageStatus }[],
): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ pathId, stages }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function isPathStageDone(stages: PathStageProgress[], stageId: string): boolean {
  return stages.some((s) => s.stageId === stageId && s.status === 'completed')
}

export function isPathStageSkipped(stages: PathStageProgress[], stageId: string): boolean {
  return stages.some((s) => s.stageId === stageId && s.status === 'skipped')
}

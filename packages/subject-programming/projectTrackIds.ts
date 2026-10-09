// projectTrackIds — KHUÔN MÃ của ba dự án trục T1/T2/T3 (hạ tầng T2/T3, 2026-10-09).
// Đặc tả: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md.
//
// File này CỐ Ý không import gì: nó là đáy của họ projectStep* (projectStepTypes.ts import
// xuống đây), đồng thời server (`project.ts`) dùng được mà không kéo theo nội dung bước dự án.
// Thêm import vào đây là dễ tạo chu trình — cổng `npm run codemap -- cycles` chặn CI.
//
// Ba thứ phải TÁCH THEO DỰ ÁN để "đổi qua đổi lại không mất gì":
//  1. Mã bước (khoá tiến độ trong bảng lesson_progress):
//       T1 `p<n>-s<k>`  — GIỮ NGUYÊN, tiến độ người học thật đang gắn vào đó.
//       T2 `t2-p<n>-s<k>` · T3 `t3-p<n>-s<k>`.
//  2. Đường dẫn file workspace (bảng project_files là MỘT không gian tên phẳng mỗi người):
//       T1 `<file>` (giữ nguyên) · T2 `t2--<file>` · T3 `t3--<file>`.
//     Tên file khi CHẠY vẫn là `<file>` — bộ chạy Python import module theo tên thật.
//  3. Mốc snapshot: T1 `p<n>` (giữ nguyên) · T2 `t2-p<n>` · T3 `t3-p<n>`.

export const PROJECT_TRACK_IDS = ['T1', 'T2', 'T3'] as const
export type ProjectTrackId = (typeof PROJECT_TRACK_IDS)[number]

/** Dự án mặc định — cũng là giá trị mặc định của cột `programming.learner_state.project_track`. */
export const DEFAULT_PROJECT_TRACK: ProjectTrackId = 'T1'

/** Năm chặng dự án ứng với bậc P1–P5 (P6 là chuyên sâu, không có chặng dự án trục). */
export const PROJECT_STAGE_LEVELS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const
export type ProjectStageLevel = (typeof PROJECT_STAGE_LEVELS)[number]

export function isProjectTrackId(value: unknown): value is ProjectTrackId {
  return typeof value === 'string' && (PROJECT_TRACK_IDS as readonly string[]).includes(value)
}

/**
 * Khuôn mã bước của CẢ BA dự án. Nhóm 1 = tiền tố dự án (`t2`/`t3`, vắng = T1), nhóm 2 = bậc,
 * nhóm 3 = số bước. `p6` vẫn hợp lệ ở mức khuôn (giữ đúng regex cũ `^p[1-6]-s\d+$` của T1).
 */
export const PROJECT_STEP_ID_RE = /^(?:(t[23])-)?(p[1-6])-s(\d+)$/

/** Tiền tố mã bước của một dự án: T1 không có tiền tố (giữ mã cũ). */
export function projectStepIdPrefix(track: ProjectTrackId): '' | 't2-' | 't3-' {
  if (track === 'T2') return 't2-'
  if (track === 'T3') return 't3-'
  return ''
}

export interface ParsedProjectStepId {
  track: ProjectTrackId
  level: string
  step: number
}

/** Tách mã bước → dự án/bậc/số bước; mã không đúng khuôn → null. */
export function parseProjectStepId(id: string): ParsedProjectStepId | null {
  const m = PROJECT_STEP_ID_RE.exec(id)
  if (!m) return null
  const track: ProjectTrackId = m[1] === 't2' ? 'T2' : m[1] === 't3' ? 'T3' : 'T1'
  return { track, level: m[2]!, step: Number(m[3]) }
}

// ── Workspace: tách không gian tên file theo dự án ─────────────────────────────────────────

/** Ngăn cách tiền tố dự án và tên file khi LƯU (`t2--quy_lop.py`). Hợp lệ với PathSchema server. */
const WORKSPACE_TRACK_SEPARATOR = '--'

function workspacePrefix(track: ProjectTrackId): string {
  return track === 'T1' ? '' : `${track.toLowerCase()}${WORKSPACE_TRACK_SEPARATOR}`
}

/** Tên file khi chạy → đường dẫn LƯU ở server/cache. T1 giữ nguyên tên. */
export function toWorkspaceStoragePath(track: ProjectTrackId, file: string): string {
  return workspacePrefix(track) + file
}

/** Dự án sở hữu một đường dẫn đã lưu (không có tiền tố dự án khác → T1). */
export function trackOfWorkspaceStoragePath(storedPath: string): ProjectTrackId {
  for (const track of PROJECT_TRACK_IDS) {
    const prefix = workspacePrefix(track)
    if (prefix !== '' && storedPath.startsWith(prefix)) return track
  }
  return 'T1'
}

/** Đường dẫn đã lưu → tên file khi chạy, CHỈ khi thuộc đúng dự án; file của dự án khác → null. */
export function fromWorkspaceStoragePath(track: ProjectTrackId, storedPath: string): string | null {
  if (trackOfWorkspaceStoragePath(storedPath) !== track) return null
  return storedPath.slice(workspacePrefix(track).length)
}

// ── Snapshot milestone ────────────────────────────────────────────────────────────────────

/** Khuôn mốc snapshot server nhận: `p1`..`p6` (T1) hoặc `t2-p1`.. / `t3-p1`.. */
export const PROJECT_SNAPSHOT_MILESTONE_RE = /^(?:(t[23])-)?p[1-6]$/

/** Mốc snapshot của một chặng trong một dự án. */
export function projectSnapshotMilestone(track: ProjectTrackId, level: string): string {
  return projectStepIdPrefix(track) + level
}

/** Dự án của một mốc snapshot (mốc sai khuôn → null). */
export function trackOfSnapshotMilestone(milestone: string): ProjectTrackId | null {
  const m = PROJECT_SNAPSHOT_MILESTONE_RE.exec(milestone)
  if (!m) return null
  return m[1] === 't2' ? 'T2' : m[1] === 't3' ? 'T3' : 'T1'
}

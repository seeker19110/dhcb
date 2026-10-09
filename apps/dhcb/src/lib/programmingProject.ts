// programmingProject — workspace dự án trục phía client (PR-L3b; nhiều file từ PR-L6b).
// Server (/api/programming/project) là nguồn sự thật; localStorage là bộ đệm để mở tức thì
// và làm việc ngoại tuyến (cùng mô hình programmingProgress.ts).
//
// BA DỰ ÁN TRỤC (2026-10-09): server giữ MỘT cây file phẳng mỗi người, nên file của T2/T3 lưu
// dưới tiền tố `t2--`/`t3--` (luật ở projectTrackIds.ts). Các hàm ở đây nhận `track` và tự đổi
// qua lại giữa tên LƯU và tên CHẠY — trang dự án chỉ thấy tên chạy (`logic.py`…), và đổi dự án
// không đè mất file của dự án kia. Bỏ trống `track` = T1, giữ đúng hành vi cũ.
import { getAuthHeader } from '@core/authHeader'
import {
  DEFAULT_PROJECT_TRACK,
  fromWorkspaceStoragePath,
  projectSnapshotMilestone,
  toWorkspaceStoragePath,
  type ProjectTrackId,
} from '@dhcb/subject-programming/projectTrackIds'
import { getProjectTrack } from '@dhcb/subject-programming/projectTracks'

const cacheKey = (uid: string) => `dhcb_prog_project_${uid}`

interface ProjectCache {
  files: Record<string, string>
}

function readCache(uid: string): ProjectCache {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    return raw ? (JSON.parse(raw) as ProjectCache) : { files: {} }
  } catch {
    return { files: {} }
  }
}

function writeCache(uid: string, cache: ProjectCache): void {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(cache))
  } catch {
    // localStorage đầy/bị chặn — bỏ qua, server vẫn giữ bản thật.
  }
}

/** Đọc workspace CỦA MỘT DỰ ÁN (tên chạy → nội dung): ưu tiên server, lỗi mạng thì dùng cache
 *  (PR-L6b). File chính của dự án luôn có mặt (rơi về code khởi đầu) để trang dự án không bao
 *  giờ trắng ô soạn. Cache vẫn giữ CẢ cây (mọi dự án) theo tên lưu. */
export async function loadProjectFiles(
  uid: string,
  track: ProjectTrackId = DEFAULT_PROJECT_TRACK,
): Promise<Record<string, string>> {
  try {
    const res = await fetch('/api/programming/project', { headers: getAuthHeader() })
    if (res.ok) {
      const body = (await res.json()) as { files: { path: string; content: string }[] }
      const files: Record<string, string> = {}
      for (const f of body.files) files[f.path] = f.content
      writeCache(uid, { files })
      return filesOfTrack(files, track)
    }
  } catch {
    // rơi xuống cache
  }
  return filesOfTrack(readCache(uid).files, track)
}

/** Lọc cây file (tên lưu) lấy đúng dự án, đổi sang tên chạy, rồi bảo đảm có file chính. */
function filesOfTrack(
  stored: Record<string, string>,
  track: ProjectTrackId,
): Record<string, string> {
  const files: Record<string, string> = {}
  for (const [path, content] of Object.entries(stored)) {
    const name = fromWorkspaceStoragePath(track, path)
    if (name !== null) files[name] = content
  }
  const { mainFile, starterCode } = getProjectTrack(track)
  return files[mainFile] === undefined ? { ...files, [mainFile]: starterCode } : files
}

/** Lưu MỘT file của workspace một dự án (cache lạc quan trước, rồi đẩy server).
 *  `path` là tên CHẠY (`logic.py`); hàm tự gắn tiền tố lưu của dự án. */
export async function saveProjectFileAt(
  uid: string,
  file: string,
  content: string,
  track: ProjectTrackId = DEFAULT_PROJECT_TRACK,
): Promise<boolean> {
  const path = toWorkspaceStoragePath(track, file)
  const cache = readCache(uid)
  cache.files[path] = content
  writeCache(uid, cache)
  try {
    const res = await fetch('/api/programming/project', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ action: 'save', path, content }),
    })
    return res.ok
  } catch {
    return false // ngoại tuyến — cache đã giữ, lần lưu sau sẽ đẩy lại
  }
}

/** Chốt snapshot milestone chặng (vd 'p1') của một dự án — gọi khi đạt bước cuối chặng.
 *  Mốc gửi lên mang tiền tố dự án (`t2-p1`) để server chỉ chốt file của dự án đó. */
export async function snapshotMilestone(
  level: string,
  track: ProjectTrackId = DEFAULT_PROJECT_TRACK,
): Promise<boolean> {
  const milestone = projectSnapshotMilestone(track, level)
  try {
    const res = await fetch('/api/programming/project', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ action: 'snapshot', milestone }),
    })
    return res.ok
  } catch {
    return false
  }
}

// programmingProjectTrack — DỰ ÁN TRỤC đang chọn (T1/T2/T3) phía client (2026-10-09).
// Đặc tả: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md.
//
// Cùng mô hình với programmingProgress.ts: server (`programming.learner_state.project_track`,
// đọc qua GET /api/programming/progress) là nguồn sự thật của người có tài khoản; localStorage
// là bộ đệm để trang mở ngay đúng dự án. Khách vãng lai: localStorage LÀ nguồn sự thật.
//
// File này CỐ Ý chỉ import `projectTrackIds` (không có dữ liệu bước): programmingProgress.ts
// import nó, mà programmingProgress nằm trong bundle của rất nhiều trang. Phép "quy về dự án
// đang mở" (`normalizeProjectTrack`, cần dữ liệu bước) do TRANG gọi:
//   normalizeProjectTrack(readCachedProjectTrack(uid))
import { getAuthHeader } from '@core/authHeader'
import { isGuestId } from '@core/guestId'
import { isProjectTrackId, type ProjectTrackId } from '@dhcb/subject-programming/projectTrackIds'

const cacheKey = (uid: string) => `dhcb_prog_track_${uid}`

/** Dự án đang chọn theo bộ đệm máy này; chưa chọn/giá trị hỏng/không đọc được → null.
 *  CHƯA kiểm dự án có mở hay không — nơi dùng phải qua `normalizeProjectTrack`. */
export function readCachedProjectTrack(uid: string): ProjectTrackId | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    return isProjectTrackId(raw) ? raw : null
  } catch {
    return null
  }
}

/** Ghi bộ đệm (gọi cả khi server trả về giá trị — xem programmingProgress.readProgress). */
export function cacheProjectTrack(uid: string, track: ProjectTrackId): void {
  try {
    localStorage.setItem(cacheKey(uid), track)
  } catch {
    // localStorage đầy/bị chặn — bỏ qua, server vẫn giữ bản thật.
  }
}

/**
 * Chọn dự án: ghi bộ đệm ngay (giao diện đổi tức thì), rồi đẩy server nếu có tài khoản.
 * Trả `false` khi server không nhận (mất mạng/4xx/5xx) để trang báo "chưa lưu được lên máy chủ";
 * lựa chọn vẫn có hiệu lực trên máy này cho tới lần đọc server kế tiếp.
 */
export async function saveProjectTrack(uid: string, track: ProjectTrackId): Promise<boolean> {
  cacheProjectTrack(uid, track)
  if (isGuestId(uid)) return true
  try {
    const res = await fetch('/api/programming/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ projectTrack: track }),
    })
    return res.ok
  } catch {
    return false
  }
}

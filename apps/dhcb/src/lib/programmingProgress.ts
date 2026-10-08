// programmingProgress — tiến độ bài học môn Lập trình phía client (PR-L3).
// Nguồn sự thật: server (/api/programming/progress, schema programming.*); localStorage chỉ
// là bộ đệm hiển thị nhanh/ngoại tuyến — cùng mô hình với sổ tay lỗi sai (mistakes.ts).
import { getAuthHeader } from '@core/authHeader'
import { isGuestId } from '@core/guestId'
import {
  enqueue as enqueueSync,
  pendingProgrammingItems,
  registerKindHandler,
  type ProgrammingItem,
} from './syncOutbox'

// Đăng ký cách gửi tiến độ bài Lập trình cho hàng đợi dùng chung (S09-2).
// Server nhận DẠNG BATCH `{ attemptId, items }` từ S09-1 — nhiều bài hoàn thành lúc mất mạng đi
// chung MỘT request khi có mạng lại, thay vì mỗi bài một POST (hạn mức 60/phút).
registerKindHandler('programming', {
  buildRequest: (_uid, entry) => {
    const items = Array.isArray(entry.payload) ? (entry.payload as ProgrammingItem[]) : []
    if (items.length === 0) return null
    return {
      url: '/api/programming/progress',
      body: { attemptId: entry.attemptId, items },
    }
  },
})

/**
 * Phủ các mục CÒN CHỜ GỬI lên bản server.
 *
 * Vì sao bắt buộc: trước S09-2, `fetchProgress` ghi đè thẳng cache bằng bản server, nên bài hoàn
 * thành lúc mất mạng (chưa kịp lên server) BIẾN MẤT ở lần mở sau và không bao giờ được gửi lại
 * (phát hiện F4 của đặc tả). Luật phủ giống hệt server: `completed` không bao giờ bị kéo lùi.
 */
function overlayPending(
  uid: string,
  serverLessons: ProgrammingLessonProgress[],
): ProgrammingLessonProgress[] {
  const items = pendingProgrammingItems(uid)
  if (items.length === 0) return serverLessons
  const out = serverLessons.map((l) => ({ ...l }))
  for (const item of items) {
    const existing = out.find((l) => l.lessonId === item.lessonId)
    if (!existing) {
      out.push({
        lessonId: item.lessonId,
        status: item.status,
        completedAt: item.status === 'completed' ? Date.parse(item.clientUpdatedAt) || null : null,
      })
    } else if (existing.status !== 'completed' && item.status === 'completed') {
      existing.status = 'completed'
      existing.completedAt = Date.parse(item.clientUpdatedAt) || Date.now()
    }
  }
  return out
}

export interface ProgrammingLessonProgress {
  lessonId: string
  status: 'in_progress' | 'completed'
  completedAt: number | null
}

const cacheKey = (uid: string) => `dhcb_prog_progress_${uid}`

function readCache(uid: string): ProgrammingLessonProgress[] {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    return raw ? (JSON.parse(raw) as ProgrammingLessonProgress[]) : []
  } catch {
    return []
  }
}

function writeCache(uid: string, lessons: ProgrammingLessonProgress[]): void {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(lessons))
  } catch {
    // localStorage đầy/bị chặn — bỏ qua, server vẫn là nguồn sự thật.
  }
}

export interface ProgressReadResult {
  lessons: ProgrammingLessonProgress[]
  /**
   * Dữ liệu này lấy từ cache vì server KHÔNG trả lời được (mạng hỏng, 401/5xx). Khách vãng lai
   * KHÔNG tính là lỗi: với họ localStorage vốn là nguồn sự thật.
   *
   * Có cờ này thì giao diện mới nói thật được ("Chưa tải được tiến độ · Thử lại") thay vì im lặng
   * hiển thị số cũ như thể vừa đồng bộ xong.
   */
  fromCache: boolean
}

/**
 * Lõi chung của mọi lần đọc tiến độ: khách → cache (không lỗi); người có tài khoản → hỏi server,
 * phủ mục còn chờ gửi rồi ghi cache; server/mạng hỏng → rơi về cache và báo `fromCache: true`.
 */
async function readProgress(uid: string): Promise<ProgressReadResult> {
  // Khách vãng lai: localStorage LÀ nguồn sự thật (không có tài khoản để lưu server).
  if (isGuestId(uid)) return { lessons: readCache(uid), fromCache: false }
  try {
    const res = await fetch('/api/programming/progress', { headers: getAuthHeader() })
    if (!res.ok) return { lessons: readCache(uid), fromCache: true }
    const body = (await res.json()) as { lessons: ProgrammingLessonProgress[] }
    const lessons = overlayPending(uid, body.lessons ?? [])
    writeCache(uid, lessons)
    return { lessons, fromCache: false }
  } catch {
    return { lessons: readCache(uid), fromCache: true }
  }
}

/** Đọc tiến độ kèm việc CÓ PHẢI rơi về cache hay không (S06-2: thẻ "Hôm nay" cần biết để báo lỗi). */
export function fetchProgressWithStatus(uid: string): Promise<ProgressReadResult> {
  return readProgress(uid)
}

/** Đọc tiến độ: trả cache ngay nếu server lỗi (ngoại tuyến vẫn xem được). */
export async function fetchProgress(uid: string): Promise<ProgrammingLessonProgress[]> {
  return (await fetchProgressWithStatus(uid)).lessons
}

/** Ghi tiến độ 1 bài: cập nhật cache lạc quan rồi đẩy server (lỗi mạng không chặn UI). */
export async function saveLessonProgress(
  uid: string,
  lessonId: string,
  status: 'in_progress' | 'completed',
  /** ADR-0007 + ADR-0008: BẮT BUỘC kèm code khi báo 'completed' bài thuộc phạm vi chấm-lại-ở-
   *  server (bài xương sống P1–P6 Python, 7 khoá ngắn Python, Kotlin/Swift/bash/git/hermes/
   *  vibe/openclaw) — server chấm lại bằng chính code này, không tin trạng thái client tự khai. */
  code?: string,
): Promise<void> {
  const lessons = readCache(uid)
  const existing = lessons.find((l) => l.lessonId === lessonId)
  // Giữ bất biến như server: completed không bị kéo lùi.
  if (existing) {
    if (existing.status !== 'completed') {
      existing.status = status
      existing.completedAt = status === 'completed' ? Date.now() : existing.completedAt
    }
  } else {
    lessons.push({ lessonId, status, completedAt: status === 'completed' ? Date.now() : null })
  }
  writeCache(uid, lessons)
  if (isGuestId(uid)) return // khách: đã ghi localStorage, không có gì để đẩy lên
  // S09-2: xếp hàng thay vì POST thẳng. Mất mạng thì mục nằm lại hàng đợi (theo chủ sở hữu) và
  // tự gửi khi có mạng/mở lại app — không còn bị nuốt lỗi rồi mất như trước.
  enqueueSync(uid, 'programming', [
    { lessonId, status, clientUpdatedAt: new Date().toISOString(), ...(code ? { code } : {}) },
  ])
}

/**
 * Như `fetchProgress`, nhưng NÓI RÕ lần đọc này có tới được server không.
 *
 * Vì sao cần: `fetchProgress` cố tình nuốt lỗi và trả cache — đúng cho danh sách bài (thà
 * hiện số cũ còn hơn trắng trang). Nhưng mục lục phải phân biệt "chưa học" với "CHƯA ĐO
 * ĐƯỢC": vẽ một dãy ○ "chưa học" trong khi thật ra vừa mất mạng là nói dối người học. Nơi
 * gọi lấy `state:'error'` để chuyển mọi lá về `unknown` và hiện dòng "Thử lại".
 *
 * Khách vãng lai luôn `ready`: localStorage LÀ nguồn sự thật của họ, không có gì để hỏng.
 */
export async function fetchProgressWithState(
  uid: string,
): Promise<{ lessons: ProgrammingLessonProgress[]; state: 'ready' | 'error' }> {
  const { lessons, fromCache } = await readProgress(uid)
  return { lessons, state: fromCache ? 'error' : 'ready' }
}

export function isLessonCompleted(
  lessons: readonly ProgrammingLessonProgress[],
  lessonId: string,
): boolean {
  return lessons.some((l) => l.lessonId === lessonId && l.status === 'completed')
}

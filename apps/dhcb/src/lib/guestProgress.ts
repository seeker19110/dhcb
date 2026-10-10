// guestProgress.ts — Tiến độ học của KHÁCH VÃNG LAI và cách nó chuyển sang tài khoản thật.
//
// Đặc tả: docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md
//
// Ý tưởng cốt lõi: khách dùng một `uid` ổn định dạng `guest_<uuid>` (@core/guestId), nên MỌI
// module tiến độ sẵn có (vocab, cefrProgress, srs, programmingProgress…) hoạt động y nguyên —
// chúng chỉ ghi `localStorage` theo khoá `<tiền tố>_<uid>`. File này lo đúng hai việc còn lại:
//
//   1. Liệt kê các khoá localStorage thuộc về một uid (dùng cho cả đọc lẫn xoá).
//   2. Khi đăng nhập/đăng ký: DỜI tiến độ khách sang khoá của tài khoản thật theo kiểu HỢP
//      (union — chỉ tăng, không bao giờ ghi đè mất dữ liệu đã có), rồi đẩy lên server bằng
//      `pushProgressAsync` để server hợp nhất tiếp bằng `api/_lib/progressMerge.ts` (cơ chế
//      union đã có sẵn, không viết lại).
//
// Vì sao union ở CẢ hai tầng: tài khoản có thể đã có tiến độ từ máy khác. Ghi đè bằng bản của
// khách (thường nghèo hơn) sẽ là mất dữ liệu — đúng loại lỗi `progressMerge.ts` sinh ra để chặn.

import { getGuestId, clearGuestId, isGuestId } from '@core/guestId'
import { pushProgressAsync } from './progressSync'
import { flush as flushSync } from './syncOutbox'
import { saveLessonProgress } from './programmingProgress'
import { LEARNING_SESSION_PREFIX, moveGuestSessionsTo } from './learningSession'
import { pushGuestEvidence } from './stemEvidence'
import {
  readLocalIntent,
  writeLocalIntent,
  clearLocalIntent,
  fetchServerIntent,
  saveServerIntent,
} from './intent/learnerIntentStore'

import {
  ALL_PREFIXES,
  ARRAY_KEYS,
  MAP_KEYS,
  PROGRAMMING_PROGRESS_PREFIX,
  hasGuestProgress,
} from './guestProgressKeys'

export { getGuestId, isGuestId, hasGuestProgress }

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage đầy/bị chặn — bỏ qua, server vẫn là nguồn sự thật sau khi đăng nhập */
  }
}

function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

interface LessonProgressLike {
  lessonId: string
  status: 'in_progress' | 'completed'
  completedAt: number | null
}

/** Hợp nhất tiến độ bài Lập trình: `completed` không bao giờ bị kéo lùi về `in_progress`. */
export function mergeLessonProgress(
  target: readonly LessonProgressLike[],
  source: readonly LessonProgressLike[],
): LessonProgressLike[] {
  const out = new Map<string, LessonProgressLike>()
  for (const row of target) out.set(row.lessonId, { ...row })
  for (const row of source) {
    const existing = out.get(row.lessonId)
    if (!existing) {
      out.set(row.lessonId, { ...row })
      continue
    }
    if (existing.status !== 'completed' && row.status === 'completed') {
      existing.status = 'completed'
      existing.completedAt = row.completedAt
    }
  }
  return [...out.values()]
}

/** Xoá sạch dấu vết của một khách (gọi SAU khi đã hợp nhất xong). */
export function clearGuestKeys(guestId: string): void {
  for (const prefix of ALL_PREFIXES) removeKey(prefix + guestId)
  // Hai họ khoá dưới đây có HẬU TỐ nên không ghép thẳng được, phải quét:
  //  - `et_usage_<uid>_<YYYY-MM-DD>` (lượt dùng theo ngày)
  //  - `dhcb_lsession_v1_guest:<uid>_<subject>_<content>` (nháp phiên học — lib/learningSession.ts)
  const sessionPrefix = `${LEARNING_SESSION_PREFIX}guest:${guestId}_`
  try {
    const stale: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.startsWith(`et_usage_${guestId}`) || key.startsWith(sessionPrefix)) stale.push(key)
    }
    for (const key of stale) removeKey(key)
  } catch {
    /* ignore */
  }
}

/**
 * Dời tiến độ của khách sang uid tài khoản thật (union, chỉ tăng), rồi đẩy lên server.
 *
 * An toàn khi gọi nhiều lần: sau lần đầu, khoá của khách đã bị xoá nên `hasGuestProgress()`
 * trả `false` và hàm thoát ngay.
 *
 * @returns `true` nếu thực sự có tiến độ được hợp nhất.
 */
export async function mergeGuestProgressInto(realUid: string): Promise<boolean> {
  if (!realUid || isGuestId(realUid)) return false
  const guestId = getGuestId()
  if (guestId === realUid) return false

  // ── Nháp phiên học (code/đáp án đang gõ dở — lib/learningSession.ts) ──
  // Làm TRƯỚC cả cổng `hasGuestProgress`: nháp không phải tiến độ nên không được tính vào cổng
  // đó, nhưng người vừa đăng nhập vẫn phải thấy lại phần mình đang gõ. Hàm tự xoá khoá khách sau
  // khi dời, nên đăng xuất không lộ. Truyền `guestId` đã đọc ở trên, không gọi lại `getGuestId()`.
  moveGuestSessionsTo(guestId, realUid)

  if (!hasGuestProgress(guestId)) return false

  // ── Mảng chuỗi: union ──
  for (const prefix of ARRAY_KEYS) {
    const guestArr = readJson<unknown>(prefix + guestId)
    if (!Array.isArray(guestArr) || guestArr.length === 0) continue
    const mine = readJson<unknown>(prefix + realUid)
    const merged = new Set<string>([
      ...(Array.isArray(mine) ? (mine as string[]) : []),
      ...(guestArr as string[]),
    ])
    writeJson(prefix + realUid, [...merged])
  }

  // ── Map: chỉ điền vào chỗ tài khoản CHƯA có (bản của tài khoản luôn thắng) ──
  for (const prefix of MAP_KEYS) {
    const guestMap = readJson<Record<string, unknown>>(prefix + guestId)
    if (!guestMap || Object.keys(guestMap).length === 0) continue
    const mine = readJson<Record<string, unknown>>(prefix + realUid) ?? {}
    writeJson(prefix + realUid, { ...guestMap, ...mine })
  }

  // ── Tiến độ bài Lập trình ──
  // Môn này có nguồn sự thật riêng ở server (`/api/programming/progress`, không đi qua
  // /api/progress), nên ngoài việc ghi bộ đệm còn phải đẩy TỪNG bài lên. Server giữ bất biến
  // "completed không kéo lùi" nên gửi lại bài đã xong cũng vô hại.
  const guestLessons = readJson<LessonProgressLike[]>(PROGRAMMING_PROGRESS_PREFIX + guestId)
  if (Array.isArray(guestLessons) && guestLessons.length > 0) {
    const mine = readJson<LessonProgressLike[]>(PROGRAMMING_PROGRESS_PREFIX + realUid) ?? []
    writeJson(PROGRAMMING_PROGRESS_PREFIX + realUid, mergeLessonProgress(mine, guestLessons))
    // S09-2: xếp CẢ LOẠT vào hàng đợi rồi gửi MỘT batch, thay vì mỗi bài một POST (khách học
    // nhiều bài trước khi đăng nhập là ca thường gặp — 30 bài từng là 30 request nối đuôi).
    for (const row of guestLessons) {
      await saveLessonProgress(realUid, row.lessonId, row.status).catch(() => undefined)
    }
    // Lỗi mạng ở đây không được chặn phần còn lại của việc hợp nhất — hàng đợi tự gửi lại sau.
    await flushSync(realUid).catch(() => undefined)
  }

  // ── Bằng chứng hoàn thành bài STEM (S11-2) ──
  // KHÔNG chép `passed` của khách sang tài khoản: gửi TRẢ LỜI THÔ kèm `attemptId` cũ để SERVER
  // chấm lại. Nhờ vậy khách sửa localStorage thành `passed: true` cũng không thành hoàn thành,
  // và gọi lại lần hai không sinh dòng nhật ký thứ hai (idempotent theo `attemptId`).
  await pushGuestEvidence(guestId, realUid).catch(() => undefined)

  await mergeGuestIntentInto(guestId, realUid)

  clearGuestKeys(guestId)
  // Danh tính khách đã hết vai trò — xoá để lần đăng xuất sau bắt đầu bằng khách MỚI, không
  // kéo theo tiến độ vừa gán cho tài khoản này.
  clearGuestId()

  // Server hợp nhất tiếp bằng union (api/_lib/progressMerge.ts) → tiến độ sẵn có trên tài
  // khoản không mất, tiến độ khách được cộng vào.
  await pushProgressAsync(realUid)
  return true
}

/**
 * Hợp nhất Ý ĐỊNH HỌC của khách vào tài khoản (slice S05, §③.4).
 *
 * Luật: tài khoản CHƯA có ý định ⇒ đẩy bản của khách lên server (giữ `createdAt` của khách);
 * tài khoản ĐÃ có ⇒ giữ bản server, bỏ bản khách. Bản thắng được ghi lại thành bộ đệm dưới khoá
 * của tài khoản để màn `/bat-dau` không phải hỏi lại ngay sau khi đăng nhập.
 *
 * Lỗi mạng không được chặn phần còn lại của việc hợp nhất — bản local vẫn còn nguyên.
 */
export async function mergeGuestIntentInto(guestId: string, realUid: string): Promise<void> {
  const guestIntent = readLocalIntent(guestId)
  if (!guestIntent) return
  const serverIntent = await fetchServerIntent()
  if (serverIntent) {
    writeLocalIntent(realUid, serverIntent)
    clearLocalIntent(guestId)
    return
  }
  // Ghi bộ đệm của tài khoản TRƯỚC khi gọi mạng: đẩy lên hỏng thì ý định vẫn còn trên máy này
  // (khoá của khách sắp bị `clearGuestKeys` dọn), nên không ai mất câu trả lời vừa cho.
  writeLocalIntent(realUid, guestIntent)
  await saveServerIntent({ ...guestIntent, updatedAt: Date.now() })
  clearLocalIntent(guestId)
}

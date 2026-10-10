// apps/dhcb/src/lib/learningSession.ts — KHUNG PHIÊN HỌC (nháp + vị trí đang học, CÙNG THIẾT BỊ)
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md (slice S08-1).
//
// Vấn đề nó giải: người học đang dở một bài (gõ code, trả lời câu tự kiểm tra, đang ở một tab)
// mà lỡ reload/đóng tab thì mở lại vẫn quay về đúng bước + đúng nháp — trên CÙNG một trình duyệt.
//
// Năm luật quan trọng, đọc kỹ trước khi sửa:
//  1. NHÁP KHÔNG PHẢI TIẾN ĐỘ. File này KHÔNG bao giờ chạm completion/tiến độ/hạn mức, không gọi
//     API. "Đã hoàn thành hay chưa" vẫn chỉ do server/domain quyết.
//  2. NHÁP CÓ CHỦ SỞ HỮU. Khoá chứa owner; đọc bằng danh tính khác trả `empty` — không để lộ là
//     người trước từng gõ gì.
//  3. DỮ LIỆU TỪ STORAGE LÀ DỮ LIỆU NGOÀI (người dùng sửa được bằng devtools) → luôn qua Zod.
//     Bản ghi hỏng trả `invalid` và KHÔNG xoá ngầm (tab khác có thể là bản app mới hơn).
//  4. KHÔNG BAO GIỜ CẮT NHÁP CỦA NGƯỜI HỌC. Quá dài thì BÁO (`too-large`), bản cũ giữ nguyên.
//  5. THỜI GIAN LUÔN TRUYỀN VÀO (`now`) để test không phụ thuộc đồng hồ máy.
import { z } from 'zod'
import { LEARNING_SESSION_PREFIX } from './storageKeyPrefixes'

/** Nháp quá hạn này (tính từ `updatedAt`) thì không nạp lại nữa — §7 Q2 của đặc tả. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Đo trên chuỗi `JSON.stringify(session)`. Vượt ngưỡng thì BÁO, không cắt. */
export const MAX_SESSION_CHARS = 16_000

/** Tiền tố khoá localStorage, không phải bí mật. Đăng ký thêm ở `guestProgress.ts`. */
export { LEARNING_SESSION_PREFIX }

const ownerSchema = z.object({
  kind: z.enum(['guest', 'account']),
  id: z.string().min(1),
})

export type SessionOwner = z.infer<typeof ownerSchema>

export const LearningSessionSchema = z
  .object({
    version: z.literal(1),
    subjectId: z.string().min(1),
    courseId: z.string().min(1).optional(),
    contentId: z.string().min(1),
    contentVersion: z.string().min(1),
    owner: ownerSchema,
    stepIndex: z.number().int().nonnegative(),
    stepLabel: z.string().max(60).optional(),
    draft: z.unknown(),
    startedAt: z.number().int().positive(),
    updatedAt: z.number().int().positive(),
  })
  .refine((s) => s.updatedAt >= s.startedAt, { message: 'updatedAt < startedAt' })

export type LearningSession = z.infer<typeof LearningSessionSchema>

export type SessionReadResult =
  | { status: 'ready'; session: LearningSession }
  /** Nội dung bài đã đổi — KHÔNG tự prefill; trang tự hỏi người học có dùng lại không. */
  | { status: 'stale'; session: LearningSession }
  | { status: 'empty' | 'expired' | 'invalid' | 'unavailable' }

export type SaveSessionResult =
  | { status: 'saved' | 'memory-only'; session: LearningSession }
  /** Bản trước đó (nếu có) GIỮ NGUYÊN trong storage. */
  | { status: 'too-large'; chars: number }

export interface SessionKeyParts {
  owner: SessionOwner
  subjectId: string
  contentId: string
}

export interface ResumableSessionSummary {
  subjectId: string
  courseId?: string
  contentId: string
  stepIndex: number
  stepLabel?: string
  updatedAt: number
}

/** Phần nội dung của một phiên do trang truyền vào — phần còn lại module tự điền. */
export type SessionInput = Omit<
  LearningSession,
  'version' | 'owner' | 'subjectId' | 'contentId' | 'startedAt' | 'updatedAt'
>

export function sessionKey(parts: SessionKeyParts): string {
  return `${LEARNING_SESSION_PREFIX}${parts.owner.kind}:${parts.owner.id}_${parts.subjectId}_${parts.contentId}`
}

// Bộ nhớ dự phòng: khi trình duyệt chặn localStorage (chế độ riêng tư, chặn site data…) thì nháp
// vẫn sống trong Map này — đủ để đi lại trong CÙNG một lần tải trang, nhưng KHÔNG qua nổi reload.
// Nơi gọi phải nói thật điều đó với người dùng (`status: 'memory-only'`).
const memorySessions = new Map<string, LearningSession>()

function getLocalStorage(): Storage | null {
  try {
    const store = globalThis.localStorage
    if (!store) return null
    // Truy cập thôi chưa đủ: Safari chế độ riêng tư cho đọc nhưng ném lỗi lúc GHI.
    const probe = '__dhcb_lsession_probe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return store
  } catch {
    return null
  }
}

/** Storage có dùng được không — để giao diện báo trước "rời trang là mất phần đang gõ". */
export function isSessionStorageAvailable(): boolean {
  return getLocalStorage() !== null
}

type RawRead =
  | { kind: 'ok'; session: LearningSession }
  | { kind: 'none' }
  | { kind: 'bad' }
  | { kind: 'unavailable' }

function parseSession(text: string): RawRead {
  try {
    const parsed = LearningSessionSchema.safeParse(JSON.parse(text))
    return parsed.success ? { kind: 'ok', session: parsed.data } : { kind: 'bad' }
  } catch {
    return { kind: 'bad' }
  }
}

function loadRaw(key: string): RawRead {
  const store = getLocalStorage()
  if (!store) {
    const fromMemory = memorySessions.get(key)
    return fromMemory ? { kind: 'ok', session: fromMemory } : { kind: 'unavailable' }
  }
  let text: string | null = null
  try {
    text = store.getItem(key)
  } catch {
    const fromMemory = memorySessions.get(key)
    return fromMemory ? { kind: 'ok', session: fromMemory } : { kind: 'unavailable' }
  }
  if (text === null) {
    const fromMemory = memorySessions.get(key)
    return fromMemory ? { kind: 'ok', session: fromMemory } : { kind: 'none' }
  }
  return parseSession(text)
}

/**
 * Lưu phiên. Giữ `startedAt` của bản đang có (cùng khoá, cùng owner) để biết phiên bắt đầu từ bao
 * giờ; `updatedAt` luôn là `now`.
 */
export function saveSession(
  parts: SessionKeyParts,
  input: SessionInput,
  now: number = Date.now(),
): SaveSessionResult {
  const key = sessionKey(parts)
  const existing = loadRaw(key)
  const startedAt = existing.kind === 'ok' ? existing.session.startedAt : now

  const session: LearningSession = {
    version: 1,
    subjectId: parts.subjectId,
    contentId: parts.contentId,
    owner: parts.owner,
    startedAt,
    updatedAt: now,
    contentVersion: input.contentVersion,
    stepIndex: input.stepIndex,
    draft: input.draft,
    ...(input.courseId === undefined ? {} : { courseId: input.courseId }),
    ...(input.stepLabel === undefined ? {} : { stepLabel: input.stepLabel }),
  }

  const text = JSON.stringify(session)
  // Quá dài thì BÁO, tuyệt đối không cắt nháp của người học; bản cũ giữ nguyên.
  if (text.length > MAX_SESSION_CHARS) return { status: 'too-large', chars: text.length }

  memorySessions.set(key, session)
  const store = getLocalStorage()
  if (!store) return { status: 'memory-only', session }
  try {
    store.setItem(key, text)
    return { status: 'saved', session }
  } catch {
    // Hết dung lượng (QuotaExceededError): KHÔNG xoá khoá của người khác để lấy chỗ.
    return { status: 'memory-only', session }
  }
}

/**
 * Đọc phiên cho đúng chủ sở hữu + đúng phiên bản nội dung hiện tại.
 *
 * Thứ tự kiểm là hợp đồng: hỏng → `invalid` (không xoá); owner khác → `empty` (không lộ);
 * quá TTL → `expired`; `contentVersion` khác → `stale` (kèm bản ghi để UI mời dùng lại).
 */
export function readSession(
  parts: SessionKeyParts,
  contentVersion: string,
  now: number = Date.now(),
): SessionReadResult {
  const raw = loadRaw(sessionKey(parts))
  if (raw.kind === 'bad') return { status: 'invalid' }
  if (raw.kind === 'none') return { status: 'empty' }
  if (raw.kind === 'unavailable') return { status: 'unavailable' }
  const session = raw.session
  if (session.owner.kind !== parts.owner.kind || session.owner.id !== parts.owner.id) {
    return { status: 'empty' }
  }
  if (now - session.updatedAt > SESSION_TTL_MS) return { status: 'expired' }
  if (session.contentVersion !== contentVersion) return { status: 'stale', session }
  return { status: 'ready', session }
}

export function clearSession(parts: SessionKeyParts): void {
  const key = sessionKey(parts)
  memorySessions.delete(key)
  const store = getLocalStorage()
  if (!store) return
  try {
    store.removeItem(key)
  } catch {
    // Không xoá được thì thôi; phiên vẫn hết hạn sau TTL.
  }
}

/** Duyệt mọi khoá phiên đang có trong localStorage (một vòng `for`, chỉ lọc theo tiền tố). */
function forEachSessionKey(visit: (key: string, text: string) => void): void {
  const store = getLocalStorage()
  if (!store) return
  try {
    const keys: string[] = []
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i)
      if (key && key.startsWith(LEARNING_SESSION_PREFIX)) keys.push(key)
    }
    for (const key of keys) {
      const text = store.getItem(key)
      if (text !== null) visit(key, text)
    }
  } catch {
    /* ignore */
  }
}

/**
 * Nguồn dữ liệu cho "Học tiếp" (slice S06). KHÔNG trả `draft` — danh sách chỉ cần biết đi đâu.
 * Bỏ qua phiên hết hạn, hỏng, hoặc của chủ sở hữu khác.
 */
export function listResumableSessions(
  owner: SessionOwner,
  now: number = Date.now(),
): ResumableSessionSummary[] {
  const out: ResumableSessionSummary[] = []
  forEachSessionKey((_key, text) => {
    const raw = parseSession(text)
    if (raw.kind !== 'ok') return
    const s = raw.session
    if (s.owner.kind !== owner.kind || s.owner.id !== owner.id) return
    if (now - s.updatedAt > SESSION_TTL_MS) return
    out.push({
      subjectId: s.subjectId,
      contentId: s.contentId,
      stepIndex: s.stepIndex,
      updatedAt: s.updatedAt,
      ...(s.courseId === undefined ? {} : { courseId: s.courseId }),
      ...(s.stepLabel === undefined ? {} : { stepLabel: s.stepLabel }),
    })
  })
  return out.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Dọn phiên quá hạn lúc khởi động app. Chỉ đụng khoá `dhcb_lsession_v1_*` và chỉ xoá khi ĐỌC ĐƯỢC
 * `updatedAt` đã quá TTL — bản ghi hỏng để nguyên (có thể do bản app mới hơn ở tab khác ghi).
 *
 * @returns số khoá đã xoá.
 */
export function pruneExpiredSessions(now: number = Date.now()): number {
  const expired: string[] = []
  forEachSessionKey((key, text) => {
    const raw = parseSession(text)
    if (raw.kind !== 'ok') return
    if (now - raw.session.updatedAt > SESSION_TTL_MS) expired.push(key)
  })
  const store = getLocalStorage()
  for (const key of expired) {
    memorySessions.delete(key)
    try {
      store?.removeItem(key)
    } catch {
      /* ignore */
    }
  }
  return expired.length
}

/**
 * Dời nháp của khách sang tài khoản vừa đăng nhập (gọi trong `mergeGuestProgressInto`).
 *
 * Luật: tài khoản chưa có nháp cho bài đó → lấy bản của khách; đã có → giữ bản `updatedAt` mới
 * hơn. Xong thì xoá khoá của khách để đăng xuất không lộ.
 *
 * @returns số phiên đã dời sang tài khoản.
 */
export function moveGuestSessionsTo(guestId: string, accountId: string): number {
  if (!guestId || !accountId || guestId === accountId) return 0
  const store = getLocalStorage()
  if (!store) return 0
  const guestPrefix = `${LEARNING_SESSION_PREFIX}guest:${guestId}_`
  const found: LearningSession[] = []
  const guestKeys: string[] = []
  forEachSessionKey((key, text) => {
    if (!key.startsWith(guestPrefix)) return
    guestKeys.push(key)
    const raw = parseSession(text)
    if (raw.kind === 'ok' && raw.session.owner.kind === 'guest') found.push(raw.session)
  })

  let moved = 0
  for (const session of found) {
    const parts: SessionKeyParts = {
      owner: { kind: 'account', id: accountId },
      subjectId: session.subjectId,
      contentId: session.contentId,
    }
    const key = sessionKey(parts)
    const mine = loadRaw(key)
    // Bản của tài khoản mới hơn thì giữ nguyên — không kéo lùi bằng nháp cũ của khách.
    if (mine.kind === 'ok' && mine.session.updatedAt >= session.updatedAt) continue
    const movedSession: LearningSession = { ...session, owner: parts.owner }
    memorySessions.set(key, movedSession)
    try {
      store.setItem(key, JSON.stringify(movedSession))
      moved += 1
    } catch {
      /* hết dung lượng — bản trong bộ nhớ vẫn dùng được trong lượt tải trang này */
    }
  }

  for (const key of guestKeys) {
    memorySessions.delete(key)
    try {
      store.removeItem(key)
    } catch {
      /* ignore */
    }
  }
  return moved
}

/**
 * Vân tay nội dung bài (FNV-1a 32-bit, hex) — hàm THUẦN, tất định, không phụ thuộc DOM.
 *
 * Dùng để biết "phần người học đã gõ còn khớp khung bài không". Ba kiểu bài của dự án đều không
 * có trường version/hash, thêm trường là sửa hàng trăm file — xem §7 Q4 của đặc tả.
 */
export function contentFingerprint(parts: readonly (string | number)[]): string {
  // Ký tự NUL ('\u0000') làm dấu ngăn: ['ab','c'] và ['a','bc'] phải ra hai vân tay khác nhau.
  const text = parts.map((p) => String(p)).join('\u0000')
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    // Nhân với 16777619 theo kiểu 32-bit không dấu (Math.imul tránh sai số của số thực).
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/** Chỉ dùng trong test — dọn bộ nhớ dự phòng giữa các ca. */
export function __resetSessionMemory(): void {
  memorySessions.clear()
}

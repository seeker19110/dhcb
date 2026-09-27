// syncOutboxStorage.ts — KIỂU + LƯU TRỮ dùng chung cho hàng đợi đồng bộ (tách 2026-09-16).
//
// Vì sao tách riêng khỏi `syncOutbox.ts`: `syncOutboxSender.ts` (phần GỬI, nạp lười bằng
// `import()` động — xem `syncOutbox.ts`) cần đọc/ghi cùng hàng đợi, nhưng nếu nó import THẲNG
// từ `syncOutbox.ts` thì tạo ra chu trình `syncOutbox → (động) → syncOutboxSender → (tĩnh) →
// syncOutbox` — cổng CI `npm run codemap -- cycles` coi CẢ import động lẫn tĩnh là cạnh của đồ
// thị (xem `scripts/lib/scanGraph.ts`, cố ý bắt cả 3 dạng để không báo mồ côi nhầm các trang
// lazy) nên chu trình này bị chặn thật (đã dính ở PR #984). Module LÁ này không import từ hai
// file kia — cả hai cùng đọc từ đây, không ai đọc ngược lại ai.
export type OutboxKind = 'english' | 'programming' | 'evidence'

export interface OutboxEntry {
  /** Khoá idempotency theo LẦN GỬI (server S09-1 tra `public.sync_receipts`). */
  attemptId: string
  kind: OutboxKind
  uid: string
  /**
   * Dữ liệu cần gửi. `english` luôn là `null`: bản chụp tiến độ được ĐỌC TỪ localStorage LÚC
   * GỬI, không phải lúc xếp hàng — giữ đúng tinh thần guard `pullInFlight` của `progressSync`
   * (gửi bản đã hợp nhất mới nhất, không phải bản cũ đã chụp sẵn).
   */
  payload: unknown
  /** Băm của payload — payload đổi thì `attemptId` phải đổi (đặc tả AC-11). */
  payloadHash: string
  createdAt: string
  tries: number
  /** Mốc epoch ms sớm nhất được thử lại; 0 = gửi ngay. */
  nextAt: number
  lastError?: 'network' | 'http_5xx' | 'http_401' | 'http_429' | 'timeout' | 'grading_unavailable'
}

export interface FlushResult {
  sent: number
  remaining: number
  /**
   * Vì sao còn mục chưa gửi: hết phiên đăng nhập · mất mạng · tab khác đang giữ khoá gửi.
   * Không có nghĩa là mất dữ liệu — mục vẫn nằm trong hàng đợi.
   */
  blocked?: 'auth' | 'offline' | 'locked'
}

export interface KindHandler {
  /**
   * Chạy TRƯỚC khi dựng request (ví dụ chờ lượt `pullProgress` đang chạy xong để bản chụp đọc
   * ra là bản ĐÃ hợp nhất, không phải bản rỗng lúc app vừa mở). Lỗi ở đây bị bỏ qua.
   */
  beforeSend?(uid: string): Promise<void>
  /**
   * Dựng request LÚC GỬI. Trả `null` = không có gì để gửi nữa (mục bị bỏ, coi như xong).
   * `attemptId` của mục phải được gắn vào thân request (phong bì `sync` hoặc trường `attemptId`).
   */
  buildRequest(uid: string, entry: OutboxEntry): { url: string; body: unknown } | null
  /** Xử lý response 2xx (áp `merged`, ghi `version`, dọn hàng chờ phụ…). Lỗi ở đây KHÔNG chặn. */
  onSuccess?(uid: string, entry: OutboxEntry, body: unknown): void | Promise<void>
}

export const OUTBOX_KEY = (uid: string) => `dhcb_sync_outbox_${uid}`
export const VERSION_KEY = (uid: string) => `dhcb_sync_version_${uid}`

/** Chờ 1,5 giây gộp nhiều thay đổi liên tiếp thành MỘT request (AC-9). */
export const DEBOUNCE_MS = 1500
/** Số lần thử lại tự động tối đa trong một phiên tab; hết thì chờ `online`/mở lại app. */
export const MAX_TRIES = 6
/** Trần số mục giữ lại — vượt thì gộp/cắt bớt mục cũ nhất để localStorage không phình vô hạn. */
export const MAX_ENTRIES = 200

export const handlers = new Map<OutboxKind, KindHandler>()
export const subscribers = new Set<(uid: string) => void>()

export function registerKindHandler(kind: OutboxKind, handler: KindHandler): void {
  handlers.set(kind, handler)
}

/**
 * Bản sao trong BỘ NHỚ khi localStorage không ghi được (hết dung lượng, chế độ ẩn danh nghiêm
 * ngặt). Không bền qua lần tải trang, nhưng còn hơn im lặng đánh rơi thay đổi ngay tại chỗ —
 * phiên hiện tại vẫn gửi được lên server.
 */
const memoryQueues = new Map<string, OutboxEntry[]>()

// ── Lưu trữ ────────────────────────────────────────────────────────────────────────────────
export function readEntries(uid: string): OutboxEntry[] {
  const inMemory = memoryQueues.get(uid)
  if (inMemory) return inMemory.map((e) => ({ ...e }))
  try {
    const raw = localStorage.getItem(OUTBOX_KEY(uid))
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    // Lọc mục hỏng (người dùng/phiên bản cũ ghi lẫn) — thà bỏ còn hơn kẹt cả hàng đợi.
    return arr.filter(
      (e): e is OutboxEntry =>
        !!e && typeof e === 'object' && typeof (e as OutboxEntry).attemptId === 'string',
    )
  } catch {
    return []
  }
}

export function writeEntries(uid: string, entries: OutboxEntry[]): void {
  // Chia batch/bảo trì có thể tăng số entry dù số bài không đổi. Không áp trần
  // entry để âm thầm xoá code học viên; quota localStorage vẫn có fallback bộ nhớ.
  const kept = entries.filter(
    (entry, index) => entry.kind === 'programming' || index >= entries.length - MAX_ENTRIES,
  )
  try {
    if (kept.length === 0) localStorage.removeItem(OUTBOX_KEY(uid))
    else localStorage.setItem(OUTBOX_KEY(uid), JSON.stringify(kept))
    memoryQueues.delete(uid)
  } catch {
    // Không ghi được xuống đĩa → giữ trong bộ nhớ để phiên này vẫn gửi được.
    if (kept.length === 0) memoryQueues.delete(uid)
    else memoryQueues.set(uid, kept)
  }
  notify(uid)
}

export function notify(uid: string): void {
  for (const cb of subscribers) {
    try {
      cb(uid)
    } catch {
      /* một người nghe lỗi không được chặn những người còn lại */
    }
  }
}

/** Version server mà client tin là đang có (gửi kèm `baseVersion`); 0 = chưa từng biết. */
export function getSyncVersion(uid: string): number {
  try {
    const v = Number(localStorage.getItem(VERSION_KEY(uid)))
    return Number.isFinite(v) && v > 0 ? v : 0
  } catch {
    return 0
  }
}

export function setSyncVersion(uid: string, version: number): void {
  if (!Number.isFinite(version) || version <= 0) return
  try {
    localStorage.setItem(VERSION_KEY(uid), String(version))
  } catch {
    /* ignore */
  }
}

export function pending(uid: string): number {
  if (!uid) return 0
  return readEntries(uid).length
}

/** `true` khi có mục đang bị chặn vì hết phiên đăng nhập (giao diện nói "đăng nhập lại"). */
export function isBlockedByAuth(uid: string): boolean {
  if (!uid) return false
  return readEntries(uid).some((e) => e.lastError === 'http_401')
}

/** Mã bài vẫn nằm trong outbox khi dịch vụ chấm đang bảo trì. */
export function isGradingUnavailable(uid: string): boolean {
  return !!uid && readEntries(uid).some((entry) => entry.lastError === 'grading_unavailable')
}

/** Chia cả hàng đợi cũ theo ngân sách mới, không cắt mất bài hoặc tái dùng receipt
 * cho payload khác. maxItems=1 cô lập bài bị bảo trì để bài khác vẫn đồng bộ được. */
export function splitProgrammingEntry(entry: OutboxEntry, maxItems = 50): OutboxEntry[] {
  if (entry.kind !== 'programming' || !Array.isArray(entry.payload)) return [entry]
  const chunks: unknown[][] = []
  let current: unknown[] = []
  let completed = 0
  for (const item of entry.payload as unknown[]) {
    const isCompleted =
      !!item && typeof item === 'object' && 'status' in item && item.status === 'completed'
    if (current.length >= maxItems || (isCompleted && completed >= 5)) {
      chunks.push(current)
      current = []
      completed = 0
    }
    current.push(item)
    if (isCompleted) completed++
  }
  if (current.length > 0) chunks.push(current)
  if (chunks.length <= 1) return [entry]
  return chunks.map((payload) => ({
    ...entry,
    payload,
    payloadHash: hashPayload('programming', payload),
    attemptId: newAttemptId(),
    tries: 0,
    nextAt: 0,
    lastError: undefined,
  }))
}

export function subscribe(cb: (uid: string) => void): () => void {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}

/** 2s → 4s → 8s → 16s → 32s (trần 32s); 429 tôn trọng `Retry-After`. */
export function backoffMs(tries: number, retryAfterMs?: number): number {
  if (retryAfterMs !== undefined) return retryAfterMs
  return Math.min(2 ** Math.max(1, tries), 32) * 1000
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

/** Băm djb2 — chỉ để so "payload có đổi không", không dùng cho bảo mật. */
export function hashPayload(kind: OutboxKind, payload: unknown): string {
  let str: string
  try {
    str = kind + ':' + JSON.stringify(payload ?? null)
  } catch {
    return kind + ':unhashable-' + Date.now()
  }
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return kind + ':' + (h >>> 0).toString(36)
}

export function newAttemptId(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  // Trình duyệt cũ / ngữ cảnh không bảo mật: id chỉ cần DUY NHẤT theo (user, lần gửi).
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/** Chỉ dùng trong test: gỡ toàn bộ trạng thái trong bộ nhớ của module. */
export function __resetOutboxStorageForTests(): void {
  subscribers.clear()
  handlers.clear()
  memoryQueues.clear()
}

// syncOutbox.ts — HÀNG ĐỢI GỬI LẠI tiến độ học theo CHỦ SỞ HỮU (slice S09-2).
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md §③.4.
//
// Vì sao cần: trước S09, mọi thay đổi tiến độ được POST NGAY, không debounce, không gửi lại;
// lỗi mạng/5xx/401/429 chỉ `console.warn` rồi mất (phát hiện F1/F3/F4 của đặc tả §②). Hệ quả
// thật: học lúc mất mạng → bài Lập trình hoàn thành BIẾN MẤT ở lần mở sau; ôn nhanh 40 thẻ SRS
// → 40 POST → chạm hạn mức 30/phút → 429 im lặng.
//
// Module này KHÔNG biết gì về nội dung từng loại tài liệu: mỗi loại (`english` · `programming` ·
// `evidence`) tự đăng ký một `KindHandler` dựng thân request lúc GỬI và xử lý response. Nhờ vậy
// CHỈ CÓ MỘT chính sách gửi lại (debounce · gộp · backoff · Web Locks · 401) cho cả ba loại, và
// module này không import ngược lên `progressSync`/`programmingProgress` (tránh vòng import).
//
// **Đây là mặt ngoài công khai** — mọi nơi khác trong app vẫn `import ... from './syncOutbox'`
// như trước. Kiểu + hàm lưu trữ THẬT nằm ở `syncOutboxStorage.ts` (module lá, xem file đó để
// biết lý do tách); phần GỬI (chỉ chạy khi tới hạn) nằm ở `syncOutboxSender.ts`, nạp bằng
// `import()` động trong `runFlush` — giữ ngân sách `Initial JS` (đo 2026-09-16, PR #984) VÀ
// tránh chu trình import mà cổng `npm run codemap -- cycles` chặn (cả hai module kia chỉ đọc
// từ `syncOutboxStorage.ts`, không đọc lẫn nhau).
//
// Bất biến quan trọng:
//   • Khách vãng lai (`isGuestId`) KHÔNG BAO GIỜ vào hàng đợi — họ không có phiên để gửi.
//   • Hàng đợi tách theo `uid` (`dhcb_sync_outbox_<uid>`): đổi tài khoản không gửi chéo dữ liệu,
//     đăng xuất KHÔNG xoá hàng đợi (đăng nhập lại đúng chủ là gửi tiếp).
//   • `attemptId` chỉ đổi khi PAYLOAD đổi — gửi lại nguyên payload giữ nguyên id, nhờ vậy server
//     (S09-1) nhận ra "đã lưu rồi" và không cộng thưởng hai lần.

import { isGuestId } from '@core/guestId'
// Kiểu + hàm CHỈ dùng lại nguyên (không có logic riêng ở file này) — re-export thẳng, không
// tạo biến cục bộ, để nơi khác trong app tiếp tục `import ... from './syncOutbox'` như trước,
// không cần biết có `syncOutboxStorage.ts` tồn tại.
export type { OutboxKind, OutboxEntry, FlushResult, KindHandler } from './syncOutboxStorage.js'
export {
  OUTBOX_KEY,
  VERSION_KEY,
  MAX_TRIES,
  handlers,
  registerKindHandler,
  isBlockedByAuth,
  isGradingUnavailable,
  subscribe,
  getSyncVersion,
  setSyncVersion,
  backoffMs,
} from './syncOutboxStorage.js'

// Tên CÓ dùng lại ở logic của chính file này — import thường.
import {
  DEBOUNCE_MS,
  __resetOutboxStorageForTests,
  hashPayload,
  isOnline,
  newAttemptId,
  notify,
  pending,
  readEntries,
  splitProgrammingEntry,
  writeEntries,
  type FlushResult,
  type OutboxEntry,
  type OutboxKind,
} from './syncOutboxStorage.js'
// `pending`/`newAttemptId` được LOGIC của file này dùng (runFlush/onStorage/enqueue) NÊN import
// thường ở trên — vẫn phải re-export để nơi khác (và test) tiếp tục `import { pending,
// newAttemptId } from './syncOutbox'` như trước khi tách module.
export { pending, newAttemptId }

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
const inFlight = new Map<string, Promise<FlushResult>>()

// ── Xếp hàng ───────────────────────────────────────────────────────────────────────────────
/**
 * Xếp một thay đổi vào hàng đợi của `uid`.
 *
 * `english` chỉ giữ ĐÚNG MỘT mục (bản chụp toàn bộ localStorage — xếp thêm là thừa).
 * `programming` gộp theo `lessonId`, chia batch ≤ 50 mục và ≤ 5 lượt chấm.
 * Không cắt bỏ mục cũ khi học offline nhiều bài. `evidence` mỗi bằng chứng một mục (server S11 tự dedupe theo `attemptId` riêng).
 */
export function enqueue(uid: string, kind: OutboxKind, payload: unknown = null): void {
  if (!uid || isGuestId(uid)) return // khách: localStorage LÀ nguồn sự thật, không có gì để gửi
  const entries = readEntries(uid)
  const now = Date.now()

  if (kind === 'english') {
    const existing = entries.find((e) => e.kind === 'english')
    if (existing) {
      // Đã có mục chờ: bản chụp được đọc lúc GỬI nên không có payload để so băm — nhưng nội dung
      // localStorage VỪA đổi (người học vừa làm gì đó), nên phải sinh `attemptId` MỚI. Giữ id cũ
      // thì lần gửi lại sẽ bị server coi là "đã lưu rồi" (biên nhận S09-1) và phần vừa học không
      // bao giờ tới nơi. Gửi lại KHÔNG kèm thay đổi mới thì id vẫn nguyên — đúng bất biến AC-11.
      existing.attemptId = newAttemptId()
      existing.nextAt = 0
      existing.tries = 0
      writeEntries(uid, entries)
    } else {
      entries.push(makeEntry(uid, 'english', null, now))
      writeEntries(uid, entries)
    }
  } else if (kind === 'programming') {
    const items = normalizeProgrammingItems(payload)
    if (items.length === 0) return
    for (const item of items) {
      // Ưu tiên đúng bài đã xếp; không nhập bài mới vào mục đang chờ bảo trì.
      const existing =
        entries.find(
          (entry) =>
            entry.kind === 'programming' &&
            normalizeProgrammingItems(entry.payload).some((old) => old.lessonId === item.lessonId),
        ) ??
        entries.find(
          (entry) =>
            entry.kind === 'programming' &&
            !entry.lastError &&
            normalizeProgrammingItems(entry.payload).length < 50 &&
            (item.status !== 'completed' ||
              normalizeProgrammingItems(entry.payload).filter((old) => old.status === 'completed')
                .length < 5),
        )
      if (!existing) {
        entries.push(makeEntry(uid, 'programming', [item], now))
        continue
      }
      const merged = mergeProgrammingItems(normalizeProgrammingItems(existing.payload), [item])
      const hash = hashPayload('programming', merged)
      if (hash === existing.payloadHash) continue // cùng bài không được tự mở lại vòng retry bảo trì
      existing.payload = merged
      existing.payloadHash = hash
      existing.attemptId = newAttemptId()
      existing.nextAt = 0
      existing.tries = 0
      delete existing.lastError
    }
    writeEntries(
      uid,
      entries.flatMap((entry) => splitProgrammingEntry(entry)),
    )
  } else {
    entries.push(makeEntry(uid, kind, payload, now))
    writeEntries(uid, entries)
  }

  scheduleFlush(uid)
}

function makeEntry(uid: string, kind: OutboxKind, payload: unknown, now: number): OutboxEntry {
  return {
    attemptId: newAttemptId(),
    kind,
    uid,
    payload,
    payloadHash: hashPayload(kind, payload),
    createdAt: new Date(now).toISOString(),
    tries: 0,
    nextAt: 0,
  }
}

export interface ProgrammingItem {
  lessonId: string
  status: 'in_progress' | 'completed'
  clientUpdatedAt: string
  /** ADR-0007: code Make lúc báo 'completed' — server chấm lại bằng nó trước khi ghi nhận. */
  code?: string
}

function normalizeProgrammingItems(payload: unknown): ProgrammingItem[] {
  if (!Array.isArray(payload)) return []
  return payload.filter(
    (i): i is ProgrammingItem =>
      !!i && typeof i === 'object' && typeof (i as ProgrammingItem).lessonId === 'string',
  )
}

/** Gộp theo `lessonId`; `completed` KHÔNG BAO GIỜ bị kéo lùi (cùng luật server). */
function mergeProgrammingItems(a: ProgrammingItem[], b: ProgrammingItem[]): ProgrammingItem[] {
  const out = new Map<string, ProgrammingItem>()
  for (const item of [...a, ...b]) {
    const prev = out.get(item.lessonId)
    if (
      !prev ||
      prev.status !== 'completed' ||
      (item.status === 'completed' && item.clientUpdatedAt >= prev.clientUpdatedAt)
    )
      out.set(item.lessonId, item)
  }
  return [...out.values()]
}

/** Các mục `programming` còn chờ gửi — dùng để phủ lên bản server khi đọc (AC-15). */
export function pendingProgrammingItems(uid: string): ProgrammingItem[] {
  if (!uid || isGuestId(uid)) return []
  const items: ProgrammingItem[] = []
  for (const e of readEntries(uid)) {
    if (e.kind === 'programming') items.push(...normalizeProgrammingItems(e.payload))
  }
  return items
}

function scheduleFlush(uid: string): void {
  const existing = debounceTimers.get(uid)
  if (existing) clearTimeout(existing)
  debounceTimers.set(
    uid,
    setTimeout(() => {
      debounceTimers.delete(uid)
      void flush(uid)
    }, DEBOUNCE_MS),
  )
}

// ── Gửi ────────────────────────────────────────────────────────────────────────────────────
/**
 * Gửi mọi mục tới hạn của `uid`. Gọi tay thì BỎ QUA debounce (`pushProgressAsync` cần chắc
 * chắn server đã nhận trước khi làm bước sau, ví dụ claim nhiệm vụ "thi đạt cấp CEFR").
 *
 * An toàn khi gọi chồng: lượt đang chạy được trả lại thay vì mở lượt thứ hai.
 */
export function flush(uid: string, opts: { resetBackoff?: boolean } = {}): Promise<FlushResult> {
  if (!uid || isGuestId(uid)) return Promise.resolve({ sent: 0, remaining: 0 })
  const timer = debounceTimers.get(uid)
  if (timer) {
    clearTimeout(timer)
    debounceTimers.delete(uid)
  }
  const running = inFlight.get(uid)
  if (running) return running
  const p = runFlush(uid, opts.resetBackoff === true).finally(() => {
    inFlight.delete(uid)
  })
  inFlight.set(uid, p)
  return p
}

async function runFlush(uid: string, resetBackoff: boolean): Promise<FlushResult> {
  // Di trú hàng đã lưu bởi phiên bản cũ (từng có tới 50 completion/batch).
  const before = readEntries(uid)
  const split = before.flatMap((entry) => splitProgrammingEntry(entry))
  if (split.length !== before.length) writeEntries(uid, split)
  if (resetBackoff) {
    const entries = readEntries(uid)
    let changed = false
    for (const e of entries) {
      if (e.tries > 0 || e.nextAt > 0) {
        e.tries = 0
        e.nextAt = 0
        changed = true
      }
    }
    if (changed) writeEntries(uid, entries)
  }
  if (readEntries(uid).length === 0) return { sent: 0, remaining: 0 }
  // Mất mạng: KHÔNG gọi fetch (tránh rác lỗi + tốn pin); sự kiện `online` sẽ gọi lại.
  if (!isOnline()) return { sent: 0, remaining: pending(uid), blocked: 'offline' }
  // Nạp LƯỜI phần gửi: `sendDueEntries`/`postEntry`/`withLock` chỉ cần khi THẬT SỰ tới lúc gửi,
  // còn đường xếp hàng (`enqueue`) thì phải luôn sẵn trong chunk khởi động. `syncOutboxSender.ts`
  // chỉ đọc từ `syncOutboxStorage.ts` (không đọc từ file này) — tránh chu trình import mà
  // `npm run codemap -- cycles` chặn (đã dính ở PR #984).
  const { withLock, sendDueEntries } = await import('./syncOutboxSender.js')
  return withLock(uid, () => sendDueEntries(uid))
}

// ── Kích hoạt gửi lại ──────────────────────────────────────────────────────────────────────
let activeUid: string | null = null

/**
 * Cho outbox biết ai đang đăng nhập, để các sự kiện toàn cục (`online`, `visibilitychange`,
 * `storage`) biết nên gửi hàng đợi của AI. Đăng xuất → gọi `setActiveUid(null)`: hàng đợi của
 * chủ cũ vẫn nằm nguyên, chỉ là không ai gửi hộ nữa.
 */
export function setActiveUid(uid: string | null): void {
  activeUid = uid && !isGuestId(uid) ? uid : null
  if (activeUid) void flush(activeUid, { resetBackoff: true })
}

function onWake(): void {
  if (activeUid) void flush(activeUid, { resetBackoff: true })
}

function onVisible(): void {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
  onWake()
}

function onStorage(ev: StorageEvent): void {
  // Tab khác vừa đổi hàng đợi (gửi xong hoặc xếp thêm) → báo giao diện vẽ lại số mục chờ.
  if (!ev.key || !ev.key.startsWith('dhcb_sync_outbox_')) return
  const uid = ev.key.slice('dhcb_sync_outbox_'.length)
  notify(uid)
  if (activeUid === uid && pending(uid) > 0) void flush(uid)
}

let listenersBound = false
export function bindOutboxListeners(): void {
  if (listenersBound || typeof window === 'undefined') return
  listenersBound = true
  window.addEventListener('online', onWake)
  window.addEventListener('storage', onStorage)
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible)
}

/** Chỉ dùng trong test: gỡ toàn bộ trạng thái trong bộ nhớ của module (và của lớp lưu trữ). */
export function __resetOutboxForTests(): void {
  for (const t of debounceTimers.values()) clearTimeout(t)
  debounceTimers.clear()
  inFlight.clear()
  activeUid = null
  __resetOutboxStorageForTests()
}

bindOutboxListeners()

// packages/core-personal/ttlSessionStore.ts — Bộ lưu phiên tạm trong RAM có hạn (TTL + trần).
//
// Vì sao có file này (changelog 0538): `/api/scenario-holodeck` và `/api/socratic-diagnostics`
// từng giữ phiên trong một `Map` toàn cục KHÔNG BAO GIỜ DỌN — mỗi lần bấm "Bắt đầu" là thêm một
// phiên sống tới khi tiến trình khởi động lại. Kẻ xấu (hoặc chỉ một người dùng bấm nhiều lần)
// làm RAM tăng mãi. Bộ lưu này đặt ba giới hạn, dùng chung cho cả hai service (DRY):
//
//   1. TTL TRƯỢT: phiên hết hạn sau `idleTtlMs` KHÔNG hoạt động; mỗi lần chủ phiên đọc/ghi thì
//      đồng hồ đặt lại từ đầu.
//   2. TRẦN MỖI NGƯỜI: vượt trần thì ĐÓNG PHIÊN CŨ NHẤT (ít hoạt động gần đây nhất) của chính
//      người đó, KHÔNG từ chối 429. Lý do: giao diện chỉ giữ MỘT phiên đang mở, nút "Đổi kịch
//      bản/chủ đề" bỏ phiên cũ mà không báo server — phiên cũ nhất gần như chắc chắn đã bị bỏ.
//      Từ chối 429 sẽ chặn đúng người dùng thật vừa đổi ý vài lần; đóng phiên cũ thì không hại ai.
//   3. TRẦN TOÀN TIẾN TRÌNH: chạm trần thì TỪ CHỐI tạo phiên mới (503), KHÔNG đuổi phiên của
//      người khác — nếu đuổi theo LRU toàn cục, kẻ tạo phiên hàng loạt sẽ đá văng phiên đang
//      dùng dở của người thật. Người đang luyện dở không bị ảnh hưởng; người mới thử lại sau.
//
// Phiên của người khác và phiên không còn được đối xử Y HỆT (cùng `undefined` → 404 ở handler):
// không để lộ id nào có thật (audit kiểm soát truy cập 0526).
//
// Dọn định kỳ bằng `setInterval(...).unref()` (không giữ tiến trình sống), khởi động LƯỜI ở lần
// ghi đầu tiên; `dispose()` dừng hẳn — dùng trong test. Ngoài ra `get` tự kiểm hạn nên mốc hết hạn
// chính xác tới từng mili-giây, không phụ thuộc chu kỳ dọn.

import { AppError } from '@dhcb/core-errors/appError'

/** Mã lỗi ổn định cho client nhận ra "phiên hết hạn/không còn" (không đổi khi đổi câu chữ). */
export const SESSION_GONE_CODE = 'session_not_found'

/** Phiên đã hết hạn, đã bị đóng, không tồn tại, hoặc thuộc người khác → 404 kèm lời dặn. */
export class SessionGoneError extends AppError {
  constructor(message = 'Phiên luyện đã hết hạn hoặc không còn — hãy bấm "Bắt đầu lại".') {
    super(message, 404, SESSION_GONE_CODE)
    this.name = 'SessionGoneError'
  }
}

/** Toàn tiến trình đã chạm trần số phiên → 503, người dùng thử lại sau. */
export class SessionCapacityError extends AppError {
  constructor(message = 'Phòng luyện đang quá tải — vui lòng thử lại sau ít phút.') {
    super(message, 503, 'session_capacity')
    this.name = 'SessionCapacityError'
  }
}

export interface TtlSessionStoreOptions {
  /** Phiên hết hạn sau ngần này mili-giây không hoạt động (TTL trượt). */
  idleTtlMs: number
  /** Số phiên đang mở tối đa của MỘT người; vượt thì đóng phiên cũ nhất của người đó. */
  maxPerOwner: number
  /** Số phiên tối đa của cả tiến trình; chạm trần thì từ chối phiên mới (SessionCapacityError). */
  maxTotal: number
  /** Chu kỳ dọn phiên hết hạn chạy nền. */
  sweepIntervalMs: number
  /** Đồng hồ — mặc định `Date.now`, tiêm vào được để test. */
  now?: () => number
}

interface Entry<T> {
  value: T
  ownerId: string
  lastActiveAt: number
}

export class TtlSessionStore<T> {
  // BẤT BIẾN: `entries` luôn xếp theo `lastActiveAt` TĂNG DẦN (Map giữ thứ tự chèn; mỗi lần
  // chạm phiên ta xoá rồi chèn lại ở cuối). Nhờ vậy dọn hết hạn chỉ cần duyệt từ đầu và dừng ở
  // phiên còn hạn đầu tiên.
  private readonly entries = new Map<string, Entry<T>>()
  // Chỉ mục theo người dùng; Set cũng giữ thứ tự → phần tử đầu là phiên cũ nhất của người đó.
  private readonly byOwner = new Map<string, Set<string>>()
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly now: () => number

  constructor(private readonly options: TtlSessionStoreOptions) {
    if (options.idleTtlMs <= 0 || options.sweepIntervalMs <= 0) {
      throw new Error('TtlSessionStore: idleTtlMs và sweepIntervalMs phải > 0')
    }
    if (options.maxPerOwner < 1 || options.maxTotal < options.maxPerOwner) {
      throw new Error('TtlSessionStore: cần 1 ≤ maxPerOwner ≤ maxTotal')
    }
    // Gọi `Date.now()` lúc chạy, KHÔNG giữ tham chiếu `Date.now` lúc khởi tạo: bộ lưu tạo ở cấp
    // module (trước khi test bật fake timers) vẫn phải theo đồng hồ giả.
    this.now = options.now ?? (() => Date.now())
  }

  /** Số phiên còn trong bộ nhớ (có thể gồm phiên đã quá hạn nhưng chưa tới lượt dọn). */
  get size(): number {
    return this.entries.size
  }

  /** Số phiên đang giữ của một người. */
  countForOwner(ownerId: string): number {
    return this.byOwner.get(ownerId)?.size ?? 0
  }

  /**
   * Thêm phiên mới cho `ownerId`. Trả danh sách id phiên cũ đã bị đóng vì vượt trần mỗi người.
   * Ném `SessionCapacityError` nếu cả tiến trình đã đầy (sau khi đã dọn phiên hết hạn).
   */
  create(id: string, ownerId: string, value: T): { evictedIds: string[] } {
    if (this.entries.has(id)) throw new Error(`TtlSessionStore: id ${id} đã tồn tại`)
    this.sweep()

    // Trần mỗi người TRƯỚC trần toàn cục: người đã đủ phiên luôn mở được phiên mới (đổi phiên
    // cũ nhất của chính họ), kể cả khi tiến trình đang đầy.
    const evictedIds: string[] = []
    const owned = this.byOwner.get(ownerId)
    while (owned && owned.size >= this.options.maxPerOwner) {
      const oldest = owned.values().next().value
      if (oldest === undefined) break
      this.delete(oldest)
      evictedIds.push(oldest)
    }

    if (this.entries.size >= this.options.maxTotal) {
      throw new SessionCapacityError()
    }

    this.insert(id, { value, ownerId, lastActiveAt: this.now() })
    this.ensureSweeper()
    return { evictedIds }
  }

  /**
   * Đọc phiên của đúng chủ và gia hạn TTL. Không có / hết hạn / của người khác → `undefined`
   * (ba ca giống hệt nhau, cố ý). Người khác đọc thử KHÔNG gia hạn hộ phiên.
   */
  get(id: string, ownerId: string): T | undefined {
    const entry = this.entries.get(id)
    if (!entry) return undefined
    if (this.isExpired(entry, this.now())) {
      this.delete(id)
      return undefined
    }
    if (entry.ownerId !== ownerId) return undefined
    this.touch(id, entry)
    return entry.value
  }

  /** Như `get` nhưng ném `SessionGoneError` (404) thay vì trả `undefined`. */
  require(id: string, ownerId: string): T {
    const value = this.get(id, ownerId)
    if (value === undefined) throw new SessionGoneError()
    return value
  }

  /** Xoá một phiên (không lỗi nếu không có). */
  delete(id: string): boolean {
    const entry = this.entries.get(id)
    if (!entry) return false
    this.entries.delete(id)
    const owned = this.byOwner.get(entry.ownerId)
    owned?.delete(id)
    if (owned && owned.size === 0) this.byOwner.delete(entry.ownerId)
    return true
  }

  /** Dọn mọi phiên đã hết hạn. Trả số phiên đã dọn. */
  sweep(): number {
    const now = this.now()
    let removed = 0
    // Duyệt theo thứ tự lastActiveAt tăng dần (bất biến ở trên) → gặp phiên còn hạn là dừng.
    for (const [id, entry] of this.entries) {
      if (!this.isExpired(entry, now)) break
      this.delete(id)
      removed++
    }
    if (this.entries.size === 0) this.stopSweeper()
    return removed
  }

  /** Dừng bộ dọn nền và xoá sạch phiên — dùng trong test (và khi tắt tiến trình nếu cần). */
  dispose(): void {
    this.stopSweeper()
    this.entries.clear()
    this.byOwner.clear()
  }

  /** Bộ dọn nền có đang chạy không (để test kiểm vòng đời timer). */
  get sweeperRunning(): boolean {
    return this.timer !== null
  }

  // Hết hạn ĐÚNG MỐC: còn hạn tới `lastActiveAt + idleTtlMs - 1`, hết hạn từ `+ idleTtlMs`.
  private isExpired(entry: Entry<T>, now: number): boolean {
    return now - entry.lastActiveAt >= this.options.idleTtlMs
  }

  private touch(id: string, entry: Entry<T>): void {
    entry.lastActiveAt = this.now()
    // Dời về cuối cả hai chỉ mục để giữ bất biến thứ tự.
    this.entries.delete(id)
    this.entries.set(id, entry)
    const owned = this.byOwner.get(entry.ownerId)
    owned?.delete(id)
    owned?.add(id)
  }

  private insert(id: string, entry: Entry<T>): void {
    this.entries.set(id, entry)
    let owned = this.byOwner.get(entry.ownerId)
    if (!owned) {
      owned = new Set<string>()
      this.byOwner.set(entry.ownerId, owned)
    }
    owned.add(id)
  }

  private ensureSweeper(): void {
    if (this.timer) return
    this.timer = setInterval(() => this.sweep(), this.options.sweepIntervalMs)
    // unref: bộ dọn không được giữ tiến trình Node sống (test kết thúc, server tắt êm).
    this.timer.unref?.()
  }

  private stopSweeper(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }
}

// ─── Giới hạn dùng chung cho các phòng luyện có phiên trong RAM ──────────────────────────────
// Ước lượng RAM: một phiên Holodeck đầy trần lượt (xem MAX_HOLODECK_USER_TURNS) ~ 80 lượt × ~2 KB
// ≈ 160 KB; 2 000 phiên × 160 KB ≈ 320 MB là ca XẤU NHẤT mỗi service — phiên thật thường < 10 KB.

/** 30 phút không thao tác thì phiên hết hạn: đủ để nghĩ lâu một câu trả lời, đủ ngắn để RAM nhả. */
export const PRACTICE_SESSION_IDLE_TTL_MS = 30 * 60 * 1000
/** Mỗi người giữ tối đa 5 phiên mở (giao diện chỉ dùng 1; dư cho nhiều tab). */
export const PRACTICE_SESSION_MAX_PER_PERSON = 5
/** Trần toàn tiến trình mỗi service. */
export const PRACTICE_SESSION_MAX_TOTAL = 2000
/** Dọn nền mỗi 5 phút (mốc hết hạn vẫn chính xác nhờ `get` tự kiểm). */
export const PRACTICE_SESSION_SWEEP_INTERVAL_MS = 5 * 60 * 1000

/** Tạo bộ lưu phiên luyện tập với các giới hạn chuẩn ở trên. */
export function createPracticeSessionStore<T>(): TtlSessionStore<T> {
  return new TtlSessionStore<T>({
    idleTtlMs: PRACTICE_SESSION_IDLE_TTL_MS,
    maxPerOwner: PRACTICE_SESSION_MAX_PER_PERSON,
    maxTotal: PRACTICE_SESSION_MAX_TOTAL,
    sweepIntervalMs: PRACTICE_SESSION_SWEEP_INTERVAL_MS,
  })
}

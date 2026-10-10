// apps/dhcb/src/lib/learningQuestionDraft.ts — NHÁP CÂU HỎI HỌC TẬP (handoff Home → Companion)
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-foundation.md §④ A (slice S02).
//
// Vấn đề nó giải: người dùng gõ câu hỏi ở Home, rồi được đưa sang Bạn Đồng Hành. Trước đây câu
// hỏi đó BỐC HƠI (Companion khởi tạo ô nhập rỗng), và với khách thì còn mất thêm một lần nữa khi
// đi qua màn đăng nhập. Module này giữ nguyên văn câu hỏi hộ họ.
//
// Ba luật quan trọng, đọc kỹ trước khi sửa:
//  1. NHÁP KHÔNG PHẢI LỆNH GỬI. Nơi nhận chỉ đổ chữ vào ô soạn; người dùng tự bấm gửi. Không có
//     đường nào từ file này dẫn tới một lệnh gọi AI tính phí.
//  2. NHÁP CÓ CHỦ SỞ HỮU. Mỗi nháp gắn với guestId/userId lúc tạo. Đọc bằng danh tính khác thì
//     coi như không có nháp — đăng xuất hay đổi tài khoản không được phép làm lộ chữ của người
//     trước. Chuyển khách → tài khoản chỉ xảy ra khi có người gọi `transferDraftOwner` một cách
//     tường minh.
//  3. NHÁP LÀ THỨ TẠM. sessionStorage (riêng từng tab, tự mất khi đóng tab) + hạn 30 phút. Không
//     bao giờ đưa câu hỏi vào URL, log hay localStorage lâu dài — đó là chữ riêng tư của người học.
// `zod/mini` thay bản đầy đủ (audit 2026-10-10, E4.1b): file này nằm trên route `/` (thanh hỏi
// AI ở trang chủ) — bản đầy đủ là thêm ~12 kB gzip chỉ để kiểm một bản nháp sessionStorage.
import * as z from 'zod/mini'

/** Khớp `message.max(2000)` ở `apps/server/src/api/personal/companion.ts`. */
export const MAX_QUESTION_LENGTH = 2000

/** Nháp quá hạn này thì không nạp lại nữa (mili giây). */
export const DRAFT_TTL_MS = 30 * 60 * 1000

// Tên khoá sessionStorage, không phải bí mật.
const STORAGE_KEY = 'dhcb_learning_question_draft_v1'

/** Đích được phép nhận handoff — allowlist, KHÔNG nhận URL tùy ý từ bên ngoài. */
export const DRAFT_TARGETS = ['companion'] as const

const ownerSchema = z.object({
  kind: z.enum(['guest', 'account']),
  id: z.string().check(z.minLength(1)),
})

const draftSchema = z.object({
  version: z.literal(1),
  id: z.string().check(z.minLength(1)),
  question: z.string().check(z.minLength(1), z.maxLength(MAX_QUESTION_LENGTH)),
  source: z.literal('home'),
  owner: ownerSchema,
  target: z.enum(DRAFT_TARGETS),
  createdAt: z.int().check(z.positive()),
})

export type DraftOwner = z.infer<typeof ownerSchema>
export type LearningQuestionDraft = z.infer<typeof draftSchema>

export type DraftReadResult =
  | { status: 'ready'; draft: LearningQuestionDraft }
  | { status: 'empty' | 'expired' | 'invalid' | 'unavailable' }

export type QuestionValidation =
  { ok: true; question: string } | { ok: false; reason: 'empty' | 'too-long' }

/**
 * Kiểm câu hỏi trước khi lưu.
 *
 * Chú ý chi tiết dễ làm sai: chỉ dùng `trim()` để BIẾT chuỗi có rỗng không, còn chuỗi trả về là
 * NGUYÊN VĂN người dùng gõ — dấu tiếng Việt, xuống dòng, khoảng trắng canh lề trong đoạn code đều
 * phải giữ y hệt. Và quá dài thì BÁO LỖI, tuyệt đối không tự cắt bớt câu hỏi của người ta.
 */
export function validateQuestion(raw: string): QuestionValidation {
  if (!raw.trim()) return { ok: false, reason: 'empty' }
  if (raw.length > MAX_QUESTION_LENGTH) return { ok: false, reason: 'too-long' }
  return { ok: true, question: raw }
}

// Bộ nhớ dự phòng: khi trình duyệt chặn storage (chế độ riêng tư, chặn cookie bên thứ ba…) thì
// nháp vẫn sống trong biến này — đủ để đi Home → Companion trong cùng một lần tải trang, nhưng
// KHÔNG qua nổi reload. Nơi gọi phải nói thật điều đó với người dùng, xem `saveDraft` trả về gì.
let memoryDraft: LearningQuestionDraft | null = null

function getSessionStorage(): Storage | null {
  try {
    const store = globalThis.sessionStorage
    if (!store) return null
    // Truy cập thôi chưa đủ: Safari chế độ riêng tư cho đọc nhưng ném lỗi lúc GHI.
    const probe = '__dhcb_probe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return store
  } catch {
    return null
  }
}

/** Storage có dùng được không — để giao diện báo trước "chỉ giữ được trong tab này". */
export function isDraftStorageAvailable(): boolean {
  return getSessionStorage() !== null
}

function newDraftId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export type SaveDraftResult =
  | { status: 'saved' | 'memory-only'; draft: LearningQuestionDraft }
  | { status: 'invalid'; reason: 'empty' | 'too-long' }

/**
 * Lưu nháp. `status: 'memory-only'` nghĩa là storage bị chặn — giao diện PHẢI báo cho người dùng
 * biết câu hỏi không chắc còn sau khi rời trang, và cho họ cách sao chép lại.
 */
export function saveDraft(
  rawQuestion: string,
  owner: DraftOwner,
  now: number = Date.now(),
): SaveDraftResult {
  const checked = validateQuestion(rawQuestion)
  if (!checked.ok) return { status: 'invalid', reason: checked.reason }

  const draft: LearningQuestionDraft = {
    version: 1,
    id: newDraftId(),
    question: checked.question,
    source: 'home',
    owner,
    target: 'companion',
    createdAt: now,
  }

  memoryDraft = draft
  const store = getSessionStorage()
  if (!store) return { status: 'memory-only', draft }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(draft))
    return { status: 'saved', draft }
  } catch {
    // Hết dung lượng: vẫn còn bản trong bộ nhớ, nói thật là chỉ giữ được trong tab.
    return { status: 'memory-only', draft }
  }
}

function loadRaw(): { draft: LearningQuestionDraft | null; unavailable: boolean; bad: boolean } {
  const store = getSessionStorage()
  if (!store) return { draft: memoryDraft, unavailable: memoryDraft === null, bad: false }
  let text: string | null = null
  try {
    text = store.getItem(STORAGE_KEY)
  } catch {
    return { draft: memoryDraft, unavailable: memoryDraft === null, bad: false }
  }
  if (text === null) return { draft: memoryDraft, unavailable: false, bad: false }
  try {
    const parsed = draftSchema.safeParse(JSON.parse(text))
    if (!parsed.success) return { draft: null, unavailable: false, bad: true }
    return { draft: parsed.data, unavailable: false, bad: false }
  } catch {
    return { draft: null, unavailable: false, bad: true }
  }
}

/**
 * Đọc nháp cho đúng chủ sở hữu hiện tại.
 *
 * Nháp của người khác KHÔNG trả về và cũng không báo là "có nháp" — trả `empty` để phía gọi không
 * suy ra được rằng tài khoản trước đó từng gõ gì.
 */
export function readDraft(owner: DraftOwner, now: number = Date.now()): DraftReadResult {
  const { draft, unavailable, bad } = loadRaw()
  if (bad) return { status: 'invalid' }
  if (!draft) return { status: unavailable ? 'unavailable' : 'empty' }
  if (draft.owner.kind !== owner.kind || draft.owner.id !== owner.id) return { status: 'empty' }
  if (now - draft.createdAt > DRAFT_TTL_MS) return { status: 'expired' }
  return { status: 'ready', draft }
}

/**
 * Xoá nháp. Truyền `id` khi xoá sau một lần gửi thành công: nếu trong lúc chờ phản hồi người dùng
 * đã gõ câu hỏi MỚI, nháp mới đó phải sống sót — nên chỉ xoá khi id còn khớp.
 */
export function clearDraft(id?: string): void {
  if (id !== undefined) {
    const { draft } = loadRaw()
    if (draft && draft.id !== id) return
  }
  memoryDraft = null
  const store = getSessionStorage()
  if (!store) return
  try {
    store.removeItem(STORAGE_KEY)
  } catch {
    // Không xoá được thì thôi; nháp vẫn hết hạn sau TTL.
  }
}

/**
 * Xem nháp mà KHÁCH đã để lại trong tab này, không cần biết guestId cũ.
 *
 * Vì sao phải có hàm riêng: `mergeGuestProgressInto` xoá danh tính khách ngay khi đăng nhập
 * (`clearGuestId`), nên sau khi login không còn id nào để khớp chủ sở hữu. Nháp khách trong
 * sessionStorage của CHÍNH tab này thì chắc chắn do người đang ngồi trước máy gõ ra.
 *
 * Hàm này chỉ ĐỌC để giao diện mời "dùng lại câu hỏi" — nó KHÔNG tự gán nháp cho tài khoản.
 */
export function peekGuestDraft(now: number = Date.now()): DraftReadResult {
  const { draft, unavailable, bad } = loadRaw()
  if (bad) return { status: 'invalid' }
  if (!draft) return { status: unavailable ? 'unavailable' : 'empty' }
  if (draft.owner.kind !== 'guest') return { status: 'empty' }
  if (now - draft.createdAt > DRAFT_TTL_MS) return { status: 'expired' }
  return { status: 'ready', draft }
}

/**
 * Gán nháp của khách cho tài khoản vừa đăng nhập. CHỈ gọi từ một thao tác rõ ràng của người dùng
 * (bấm nút "dùng lại câu hỏi này") — không bao giờ chạy ngầm lúc phiên đăng nhập tự khôi phục,
 * vì như vậy là đổ chữ của lần duyệt trước vào một tài khoản có thể không phải của người đã gõ.
 */
export function claimGuestDraft(
  accountId: string,
  now: number = Date.now(),
): LearningQuestionDraft | null {
  const result = peekGuestDraft(now)
  if (result.status !== 'ready') return null
  const moved: LearningQuestionDraft = {
    ...result.draft,
    owner: { kind: 'account', id: accountId },
  }
  memoryDraft = moved
  const store = getSessionStorage()
  if (store) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(moved))
    } catch {
      // Giữ bản trong bộ nhớ là đủ cho lần điều hướng ngay sau đó.
    }
  }
  return moved
}

/** Chỉ dùng trong test — dọn bộ nhớ dự phòng giữa các ca. */
export function __resetDraftMemory(): void {
  memoryDraft = null
}

// stemEvidence.ts — Phía CLIENT của "bằng chứng hoàn thành" bài tự kiểm tra STEM (slice S11-2).
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s11-completion-evidence.md §③.1 (chữ ký), §③.4
// (bảng ca lỗi), AC-9…AC-13.
//
// BA Ý QUAN TRỌNG, đọc trước khi sửa file này:
//
//  1. CLIENT KHÔNG PHẢI NGƯỜI CHẤM. Nó gửi TRẢ LỜI THÔ lên `/api/learning/evidence`; server tra
//     bài trong mã nguồn của chính nó, chấm lại bằng cùng `gradeAnswer`, rồi mới nói ai đạt.
//     Việc chấm ở đây (`gradeStemEvidence`) chỉ để (a) phản hồi tức thì cho người học và (b)
//     khách vãng lai — người không có tài khoản để server ghi vào.
//
//  2. KHÁCH là `local_graded`, và nói thật ra điều đó. Bản ghi của khách lưu KÈM trả lời thô,
//     vì lúc đăng nhập ta phải đẩy chính `answers` đó lên cho server chấm LẠI. Nếu chỉ lưu
//     `passed` rồi tin nó khi merge thì sửa localStorage là "hoàn thành" cả môn.
//
//  3. HÀNG ĐỢI GỬI LẠI CHỈ TRONG MỘT THIẾT BỊ. Không version, không giải quyết xung đột hai
//     thiết bị — đó là slice S09. Ở đây: `attemptId` giữ nguyên khi gửi lại nên server nhận
//     trùng là vô hại (idempotent), và 401 thì GIỮ bản ghi lại chứ không vứt.
import { z } from 'zod'
import { getAuthHeader } from '@core/authHeader'
import { isGuestId } from '@core/guestId'
import {
  CompletionEvidenceInputSchema,
  CompletionEvidenceSchema,
  CompletionStateSchema,
  COMPLETION_EVIDENCE_SCHEMA_VERSION,
  type CompletionEvidence,
  type CompletionEvidenceInput,
  type CompletionState,
  type EvidenceSubject,
} from '@dhcb/core-contracts/completionEvidence'
import type { StemLessonLike } from '@dhcb/core-learner/stemEvidenceGrader'
import {
  EVIDENCE_LOG_PREFIX,
  EVIDENCE_PENDING_PREFIX,
  EVIDENCE_STATE_PREFIX,
} from './storageKeyPrefixes'

export { EVIDENCE_LOG_PREFIX, EVIDENCE_STATE_PREFIX, EVIDENCE_PENDING_PREFIX }

/** Trần nhật ký khách và hàng đợi gửi lại — vượt thì bỏ bản CŨ NHẤT (đặc tả §③.4). */
export const MAX_EVIDENCE_LOG = 200
export const MAX_PENDING_EVIDENCE = 50

const API = '/api/learning/evidence'

/**
 * Bản ghi lưu trên máy = kết quả ĐÃ CHẤM + TRẢ LỜI THÔ sinh ra nó.
 *
 * Đặc tả AC-10 nói "mảng `CompletionEvidence`", nhưng AC-11 đòi lúc merge phải gửi `answers`
 * thô cho server chấm lại — mà `CompletionEvidenceSchema` cố ý KHÔNG có `answers`. Hai dòng đó
 * chỉ thoả được cùng lúc khi lưu kèm `input`. Chọn theo AC-11 vì đó là dòng giữ bất biến bảo
 * mật ("client không tự phong hoàn thành").
 */
export const StoredEvidenceSchema = z
  .object({ input: CompletionEvidenceInputSchema, evidence: CompletionEvidenceSchema })
  .strict()
export type StoredEvidence = z.infer<typeof StoredEvidenceSchema>

/** Vì sao bản ghi này còn nằm trong hàng đợi — quyết định lời nhắn hiện cho người học. */
export const PendingReasonSchema = z.enum(['offline', 'server', 'auth'])
export type PendingReason = z.infer<typeof PendingReasonSchema>

export const PendingEvidenceSchema = StoredEvidenceSchema.extend({
  reason: PendingReasonSchema,
}).strict()
export type PendingEvidence = z.infer<typeof PendingEvidenceSchema>

export type SubmitEvidenceResult =
  | { kind: 'server'; evidence: CompletionEvidence }
  /** Khách: chấm ở máy này, KHÔNG có server để xác nhận. */
  | { kind: 'local'; evidence: CompletionEvidence }
  | { kind: 'queued'; evidence: CompletionEvidence; reason: PendingReason }
  /** 400: gửi lại cũng vẫn sai → không xếp hàng đợi, nói thẳng lỗi. */
  | { kind: 'rejected'; error: string }

/** Trả lời thô của MỘT lượt nộp, do trang bài gom lại. */
export type StemEvidenceDraft = Omit<
  CompletionEvidenceInput,
  'schemaVersion' | 'attemptId' | 'clientAt'
>

// ───────────────────────────── localStorage (mọi truy cập bọc try/catch) ─────────────────────

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // Safari riêng tư nghiêm ngặt: coi như chưa có gì
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage đầy/bị chặn. Tài khoản vẫn còn đường server; khách thì trang đã nói ra điều này
    // qua `storageMode` của khung phiên học.
  }
}

function removeRaw(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Đọc một mảng đã validate — phần tử hỏng/định dạng cũ bị BỎ thay vì làm vỡ cả trang. */
function readList<T>(key: string, schema: z.ZodType<T>): T[] {
  const raw = readRaw(key)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out: T[] = []
    for (const item of parsed) {
      const ok = schema.safeParse(item)
      if (ok.success) out.push(ok.data)
    }
    return out
  } catch {
    return []
  }
}

function writeList(key: string, rows: readonly unknown[]): void {
  if (rows.length === 0) {
    removeRaw(key)
    return
  }
  writeRaw(key, JSON.stringify(rows))
}

// ───────────────────────────── trạng thái suy ra (không kéo lùi) ─────────────────────────────

const StateMapSchema = z.record(z.string(), CompletionStateSchema)

function stateKey(subjectId: string, contentId: string): string {
  // Bốn môn có thể trùng mã bài, nên khoá bộ đệm phải mang CẢ mã môn. `fetchCompletionState`
  // lọc lại theo môn và trả Map khoá bằng `contentId` — đúng hợp đồng mục lục S07 đọc.
  return `${subjectId}:${contentId}`
}

function readStateMap(uid: string): Record<string, CompletionState> {
  const raw = readRaw(EVIDENCE_STATE_PREFIX + uid)
  if (!raw) return {}
  try {
    const parsed = StateMapSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

function writeStateMap(uid: string, map: Record<string, CompletionState>): void {
  if (Object.keys(map).length === 0) {
    removeRaw(EVIDENCE_STATE_PREFIX + uid)
    return
  }
  writeRaw(EVIDENCE_STATE_PREFIX + uid, JSON.stringify(map))
}

/**
 * Gộp một lượt nộp vào trạng thái đang có, giữ bất biến "KHÔNG KÉO LÙI" y như SQL upsert của
 * server: `completed` không bao giờ về `in_progress`, `bestRatio` chỉ tăng, `completedAt` giữ
 * lần đạt ĐẦU TIÊN.
 */
export function mergeCompletionState(
  prev: CompletionState | undefined,
  evidence: CompletionEvidence,
  now: string = new Date().toISOString(),
): CompletionState {
  const daXong = prev?.status === 'completed' || evidence.passed
  return {
    subjectId: evidence.subjectId,
    contentId: evidence.contentId,
    status: daXong ? 'completed' : 'in_progress',
    bestRatio: Math.max(prev?.bestRatio ?? 0, evidence.ratio),
    lastRatio: evidence.ratio,
    attempts: (prev?.attempts ?? 0) + 1,
    completedAt: (prev?.completedAt ?? null) || (evidence.passed ? now : null),
    updatedAt: now,
    source: evidence.evidenceKind === 'local_graded' ? 'local' : 'server',
  }
}

function ghiTrangThai(uid: string, evidence: CompletionEvidence): void {
  const map = readStateMap(uid)
  const key = stateKey(evidence.subjectId, evidence.contentId)
  map[key] = mergeCompletionState(map[key], evidence)
  writeStateMap(uid, map)
}

// ───────────────────────────── nhật ký + hàng đợi ─────────────────────────────

function ghiNhatKy(uid: string, row: StoredEvidence): void {
  const key = EVIDENCE_LOG_PREFIX + uid
  const rows = readList(key, StoredEvidenceSchema)
  rows.push(row)
  writeList(key, rows.slice(-MAX_EVIDENCE_LOG))
}

/** Đọc nhật ký evidence cục bộ của một uid (khách). */
export function readEvidenceLog(uid: string): StoredEvidence[] {
  return readList(EVIDENCE_LOG_PREFIX + uid, StoredEvidenceSchema)
}

/** Hàng đợi chờ gửi lại của một uid, theo thứ tự nộp. */
export function readPendingEvidence(uid: string): PendingEvidence[] {
  return readList(EVIDENCE_PENDING_PREFIX + uid, PendingEvidenceSchema)
}

export function hasPendingEvidence(uid: string): boolean {
  return readPendingEvidence(uid).length > 0
}

function xepHangDoi(uid: string, row: StoredEvidence, reason: PendingReason): void {
  const rows = readPendingEvidence(uid).filter(
    (r) => r.evidence.attemptId !== row.evidence.attemptId,
  )
  rows.push({ ...row, reason })
  if (rows.length > MAX_PENDING_EVIDENCE) {
    console.warn(
      `[evidence] hàng đợi đầy (${MAX_PENDING_EVIDENCE}) — bỏ ${rows.length - MAX_PENDING_EVIDENCE} bản ghi cũ nhất`,
    )
  }
  writeList(EVIDENCE_PENDING_PREFIX + uid, rows.slice(-MAX_PENDING_EVIDENCE))
}

// ───────────────────────────── gửi lên server ─────────────────────────────

/** `crypto.randomUUID` chỉ có trên secure context — nhánh dự phòng vẫn khớp `AttemptIdSchema`. */
export function newAttemptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const ran = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')
  return `${Date.now().toString(36)}-${ran()}-${ran()}`
}

type PostOutcome =
  | { ok: true; evidence: CompletionEvidence }
  | { ok: false; kind: 'rejected'; error: string }
  | { ok: false; kind: 'queue'; reason: PendingReason }

async function postEvidence(input: CompletionEvidenceInput): Promise<PostOutcome> {
  let res: Response
  try {
    res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(input),
    })
  } catch {
    return { ok: false, kind: 'queue', reason: 'offline' }
  }

  if (res.ok) {
    try {
      const parsed = CompletionEvidenceSchema.safeParse(await res.json())
      if (parsed.success) return { ok: true, evidence: parsed.data }
    } catch {
      /* thân phản hồi không phải JSON — rơi xuống nhánh xếp hàng đợi bên dưới */
    }
    // 200 nhưng không đúng hợp đồng: coi như server đang hỏng, giữ lại để gửi lại.
    console.warn('[evidence] phản hồi 200 không khớp hợp đồng CompletionEvidence')
    return { ok: false, kind: 'queue', reason: 'server' }
  }

  // Hết phiên: GIỮ bản ghi, không gửi lại tự động cho tới khi đăng nhập lại (AC-12).
  if (res.status === 401 || res.status === 403) return { ok: false, kind: 'queue', reason: 'auth' }

  if (res.status === 400) {
    const loi = await res
      .json()
      .then((b: unknown) =>
        typeof b === 'object' && b && 'error' in b ? String((b as { error: unknown }).error) : '',
      )
      .catch(() => '')
    return { ok: false, kind: 'rejected', error: loi || 'Máy chủ từ chối lượt nộp này' }
  }

  // 429 và 5xx: thử lại sau thì có cơ hội thành công.
  return { ok: false, kind: 'queue', reason: 'server' }
}

// ───────────────────────────── API của module ─────────────────────────────

/**
 * Nộp MỘT lượt làm bài tự kiểm tra STEM.
 *
 * `lessonForLocal` chỉ dùng để chấm tại chỗ (phản hồi tức thì + khách). Với tài khoản, con số
 * hiện trên màn hình là con số SERVER trả về — nếu bài đã đổi nội dung từ lúc nộp thì hai bên
 * có thể lệch, và bản đúng là bản của server.
 */
export async function submitStemEvidence(
  uid: string,
  draft: StemEvidenceDraft,
  lessonForLocal: StemLessonLike,
): Promise<SubmitEvidenceResult> {
  const input: CompletionEvidenceInput = {
    ...draft,
    schemaVersion: COMPLETION_EVIDENCE_SCHEMA_VERSION,
    attemptId: newAttemptId(),
    clientAt: new Date().toISOString(),
  }

  // Nạp LƯỜI phần CHẤM ĐIỂM: `gradeStemEvidence`/`decideCompletion` (và `core-grading` mà chúng
  // kéo theo — chemistry/expression/number/tolerance/units) chỉ cần khi THẬT SỰ có người nộp bài
  // STEM (từ trang bài học, vốn đã lazy). File này còn được `guestProgress.ts` import EAGER cho
  // `pushGuestEvidence` (không đụng chấm điểm), nên trước đây cả module — gồm cả phần chấm điểm —
  // bị kéo vào chunk khởi động. Đo 2026-09-16: đây là phần lớn nhất còn lại có thể nạp lười.
  const { gradeStemEvidence, decideCompletion } = await import('@dhcb/core-learner/stemGrading.js')
  const cham = gradeStemEvidence(lessonForLocal, input.answers)
  const quyetDinh = decideCompletion(input.activityKind, cham)
  const local: CompletionEvidence = {
    schemaVersion: COMPLETION_EVIDENCE_SCHEMA_VERSION,
    subjectId: input.subjectId,
    contentId: input.contentId,
    ...(input.courseId === undefined ? {} : { courseId: input.courseId }),
    activityKind: input.activityKind,
    attemptId: input.attemptId,
    clientAt: input.clientAt,
    ownerId: uid,
    evidenceKind: 'local_graded',
    correct: cham.correct,
    total: cham.total,
    ratio: quyetDinh.supported ? quyetDinh.ratio : 0,
    passed: quyetDinh.supported && quyetDinh.passed,
    items: cham.items,
  }
  const stored: StoredEvidence = { input, evidence: local }

  // ── Khách: không có tài khoản để server ghi vào. Chấm ở máy này và NÓI RA tính cục bộ. ──
  if (isGuestId(uid)) {
    ghiNhatKy(uid, stored)
    ghiTrangThai(uid, local)
    return { kind: 'local', evidence: local }
  }

  const ketQua = await postEvidence(input)
  if (ketQua.ok) {
    ghiTrangThai(uid, ketQua.evidence)
    return { kind: 'server', evidence: ketQua.evidence }
  }
  if (ketQua.kind === 'rejected') return { kind: 'rejected', error: ketQua.error }

  xepHangDoi(uid, stored, ketQua.reason)
  return { kind: 'queued', evidence: local, reason: ketQua.reason }
}

/**
 * Trạng thái hoàn thành của MỘT môn, khoá theo `contentId` — thứ mục lục (S07/S11-3) đọc.
 *
 * Tài khoản: server là nguồn sự thật; hỏng thì rơi về bộ đệm và NÓI RA bằng `status: 'error'`
 * để giao diện không im lặng hiện số cũ như vừa đồng bộ xong.
 */
export async function fetchCompletionState(
  uid: string,
  subjectId: EvidenceSubject,
): Promise<{ status: 'ready' | 'error'; state: Map<string, CompletionState> }> {
  const tuBoDem = (): Map<string, CompletionState> => {
    const out = new Map<string, CompletionState>()
    for (const row of Object.values(readStateMap(uid))) {
      if (row.subjectId === subjectId) out.set(row.contentId, row)
    }
    return out
  }

  // Khách: localStorage LÀ nguồn sự thật, đọc đồng bộ nên `ready` ngay.
  if (!uid || isGuestId(uid)) return { status: 'ready', state: tuBoDem() }

  try {
    const res = await fetch(`${API}?subjectId=${encodeURIComponent(subjectId)}`, {
      headers: getAuthHeader(),
    })
    if (!res.ok) return { status: 'error', state: tuBoDem() }
    const parsed = z.object({ state: z.array(CompletionStateSchema) }).safeParse(await res.json())
    if (!parsed.success) return { status: 'error', state: tuBoDem() }

    // Ghi đè bộ đệm của ĐÚNG môn này (bản server thắng), giữ nguyên các môn khác.
    const map = readStateMap(uid)
    for (const key of Object.keys(map)) {
      if (map[key]?.subjectId === subjectId) delete map[key]
    }
    const out = new Map<string, CompletionState>()
    for (const row of parsed.data.state) {
      map[stateKey(row.subjectId, row.contentId)] = row
      if (row.subjectId === subjectId) out.set(row.contentId, row)
    }
    writeStateMap(uid, map)
    return { status: 'ready', state: out }
  } catch {
    return { status: 'error', state: tuBoDem() }
  }
}

/**
 * Các môn STEM người này ĐÃ TỪNG nộp bài trên thiết bị này (đọc bộ đệm trạng thái, đồng bộ).
 *
 * Dùng để hub ôn tập biết phải hỏi nhật ký của môn NÀO: hỏi cả bốn môn cho người chưa từng học
 * STEM là bốn request thừa mỗi lần mở hub. Bộ đệm có thể vắng trên máy mới — khi đó hub đơn
 * giản là chưa có lỗi STEM cho tới lần mở mục lục môn đầu tiên, chứ không hiện số sai.
 */
export function monStemDaHocTrenMay(uid: string): EvidenceSubject[] {
  const ra = new Set<EvidenceSubject>()
  for (const row of Object.values(readStateMap(uid))) ra.add(row.subjectId)
  return [...ra]
}

/**
 * Nhật ký LƯỢT NỘP của một môn — thứ sổ lỗi STEM (S12-2) dựng `MistakeEntry` từ đó.
 *
 * Vì sao cần riêng, không dùng `fetchCompletionState`: trạng thái chỉ nói "bài này đạt chưa",
 * còn sổ lỗi cần ĐÚNG CÂU nào sai — tức `items[]` của từng lượt, chỉ có ở `?include=attempts`.
 *
 * Mạng/máy chủ hỏng thì rơi về nhật ký cục bộ (`dhcb_evidence_<uid>`, vốn chỉ có bản của khách)
 * và NÓI RA bằng `status: 'error'`: sổ lỗi rỗng vì chưa tải được KHÁC hẳn sổ lỗi rỗng vì không
 * còn lỗi nào, giao diện phải phân biệt được hai điều đó.
 */
export async function fetchEvidenceAttempts(
  uid: string,
  subjectId: EvidenceSubject,
): Promise<{ status: 'ready' | 'error'; attempts: CompletionEvidence[] }> {
  const tuBoDem = (): CompletionEvidence[] =>
    readEvidenceLog(uid)
      .map((r) => r.evidence)
      .filter((e) => e.subjectId === subjectId)

  // Khách: localStorage LÀ nguồn sự thật, đọc đồng bộ nên `ready` ngay.
  if (!uid || isGuestId(uid)) return { status: 'ready', attempts: tuBoDem() }

  try {
    const res = await fetch(`${API}?subjectId=${encodeURIComponent(subjectId)}&include=attempts`, {
      headers: getAuthHeader(),
    })
    if (!res.ok) return { status: 'error', attempts: tuBoDem() }
    const parsed = z.object({ attempts: z.array(z.unknown()) }).safeParse(await res.json())
    if (!parsed.success) return { status: 'error', attempts: tuBoDem() }
    // Validate TỪNG mục: một lượt nộp định dạng lạ (bản ghi cũ, môn mới) bị bỏ chứ không làm
    // hỏng cả sổ lỗi (đặc tả §③.4).
    const attempts: CompletionEvidence[] = []
    let boQua = 0
    for (const row of parsed.data.attempts) {
      const ok = CompletionEvidenceSchema.safeParse(row)
      if (ok.success) attempts.push(ok.data)
      else boQua += 1
    }
    if (boQua > 0) console.warn(`[evidence] bỏ ${boQua} lượt nộp không khớp hợp đồng`)
    return { status: 'ready', attempts }
  } catch {
    return { status: 'error', attempts: tuBoDem() }
  }
}

/**
 * Gửi lại các lượt nộp đang chờ (mở app lần sau, hoặc sự kiện `online`).
 *
 * Gửi THEO THỨ TỰ và DỪNG ngay khi gặp lỗi còn có thể thử lại — gửi tiếp lúc mạng đang hỏng chỉ
 * tốn thời gian và làm rối nhật ký. 400 thì bỏ khỏi hàng đợi kèm lý do: gửi lại cũng vẫn sai.
 */
export async function flushPendingEvidence(uid: string): Promise<{ sent: number; kept: number }> {
  const hangDoi = readPendingEvidence(uid)
  if (hangDoi.length === 0) return { sent: 0, kept: 0 }
  // Khách chưa có tài khoản để gửi vào — giữ nguyên (thực tế khách không xếp hàng đợi bao giờ).
  if (isGuestId(uid)) return { sent: 0, kept: hangDoi.length }

  let sent = 0
  let i = 0
  for (; i < hangDoi.length; i += 1) {
    const row = hangDoi[i]!
    const ketQua = await postEvidence(row.input)
    if (ketQua.ok) {
      ghiTrangThai(uid, ketQua.evidence)
      sent += 1
      continue
    }
    if (ketQua.kind === 'rejected') {
      console.warn(`[evidence] bỏ lượt nộp ${row.evidence.contentId}: ${ketQua.error}`)
      continue
    }
    break // còn có thể thử lại — giữ nguyên từ đây trở đi
  }

  const conLai = hangDoi.slice(i)
  writeList(EVIDENCE_PENDING_PREFIX + uid, conLai)
  return { sent, kept: conLai.length }
}

/**
 * Đẩy evidence KHÁCH lên tài khoản vừa đăng nhập (dùng bởi `guestProgress.mergeGuestProgressInto`).
 *
 * Gửi `answers` THÔ với `attemptId` cũ: server chấm lại (nên khách sửa `passed` trong
 * localStorage cũng không lọt) và idempotent (gọi hai lần không sinh dòng thứ hai). Lỗi mạng ở
 * một bản ghi KHÔNG chặn các bản còn lại.
 */
export async function pushGuestEvidence(
  guestId: string,
  realUid: string,
): Promise<{ sent: number; failed: number }> {
  if (!isGuestId(guestId) || !realUid || isGuestId(realUid)) return { sent: 0, failed: 0 }
  let sent = 0
  let failed = 0
  for (const row of readEvidenceLog(guestId)) {
    // Bản ghi của CHỦ KHÁC (localStorage bị chỉnh tay, hoặc sót lại từ khách trước) không được
    // gắn vào tài khoản này. Danh tính thật vẫn do token quyết định ở server — đây là lớp chặn
    // thứ hai, rẻ tiền, đứng ngay chỗ dữ liệu không đáng tin.
    if (row.evidence.ownerId !== guestId) {
      failed += 1
      continue
    }
    const ketQua = await postEvidence(row.input)
    if (ketQua.ok) {
      ghiTrangThai(realUid, ketQua.evidence)
      sent += 1
    } else {
      failed += 1
    }
  }
  return { sent, failed }
}

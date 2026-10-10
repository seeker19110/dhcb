// apps/dhcb/src/pages/learning/practice/fillBlankQuestions.ts — S05 (goal UI/UX & sư phạm,
// docs/specs/2026-09-23-uiux-s03-s05-tinh-dung-bai-tap.md §4 + 2026-09-23-s05-offline-audit-manifest.md).
//
// Bộ tạo câu "điền từ" THUẦN, dùng chung cho runtime (FillBlankQuiz) và script audit ngoại tuyến
// (scripts/audit-fillblank.ts). Một luật duy nhất: chuẩn hoá, tìm span, lý do loại, chọn options.
//
// Vì sao phải có (lỗi F7 của audit 23/09): bản cũ replace bằng regex không ranh giới từ nên
// `he` khớp trong `the`, câu không khớp vẫn phát nguyên văn, options có thể trùng nhãn. Từ nay
// mọi câu được kiểm TRƯỚC khi trộn/cắt; câu không chắc chắn bị loại kèm đúng MỘT lý do.

import type { DictEntry } from '../../../types'
import { fnv1a32 } from '@dhcb/core-contracts/seededRandom'

/** Phiên bản luật — đổi luật match/chọn options thì tăng số này (audit ghi vào metadata). */
export const FILL_BLANK_RULE_VERSION = 's05-v1'
/** Số câu hợp lệ tối thiểu để mở phiên; ít hơn thì hiện màn "chưa đủ câu", không chấm 0. */
export const FILL_BLANK_MIN_SESSION = 4
/** Chỗ trống hiển thị — chỉ để hiển thị, KHÔNG dùng để khôi phục câu (câu gốc có thể có `_`). */
export const BLANK_MARKER = '_____'

const DISTRACTOR_COUNT = 3
// Bảy trường dạng chuỗi của WordForms; hai cờ boolean (uncountable/irregular) KHÔNG phải đáp án.
const STRING_FORM_KEYS = [
  'plural',
  'v3s',
  'ving',
  'past',
  'pastPart',
  'comparative',
  'superlative',
] as const

export type FillBlankDirection = 'A' | 'B'

/** Lý do loại, theo đúng thứ tự ưu tiên — mỗi ứng viên chỉ nhận lý do ĐẦU TIÊN gặp. */
export const FILL_BLANK_REASONS = [
  'invalid_entry',
  'missing_sentence',
  'empty_target',
  'no_match',
  'multiple_spans',
  'invalid_span',
  'insufficient_distractors',
  'invariant_failed',
] as const
export type FillBlankReason = (typeof FILL_BLANK_REASONS)[number]

export interface FillBlankSpan {
  start: number
  end: number
}

export interface FillBlankOption {
  id: string
  label: string
  sourceRef: string
}

export interface FillBlankQuestion {
  ref: string
  direction: FillBlankDirection
  targetLang: 'en' | 'vi'
  sourceWord: string
  /** Câu ví dụ đã chuẩn hoá NFC — mọi offset tham chiếu chuỗi này. */
  sentence: string
  span: FillBlankSpan
  /** Đúng bằng sentence.slice(span) — giữ dạng xuất hiện thật (went, hoa thường…). */
  answer: string
  prefix: string
  suffix: string
  options: FillBlankOption[]
  correctOptionId: string
  /** true nếu span khớp một FORM chứ không khớp chính headword (chỉ chiều A). */
  formOnly: boolean
}

export interface FillBlankRejection {
  ref: string
  reason: FillBlankReason
}

export interface FillBlankBuildResult {
  /** Câu hợp lệ theo thứ tự pool, CHƯA trộn/cắt — caller trộn và cap sau validate. */
  questions: FillBlankQuestion[]
  rejections: FillBlankRejection[]
  counts: Record<FillBlankReason | 'accepted', number>
  /** Số entry đã xét; khi có maxQuestions, phần còn lại chưa được kiểm tra. */
  total: number
}

export interface FillBlankBuildOptions {
  /** Dừng khi đủ câu hợp lệ cho phiên học; bỏ trống để audit toàn bộ pool. */
  maxQuestions?: number
  /** Định danh từng entry; mặc định `pool#<vị trí>` (id phiên, không dùng xuyên phiên). */
  refs?: readonly string[]
  /** Hạt giống cho thứ tự distractor/options — cùng seed + pool thì cùng kết quả. */
  seed?: string
  /** Hàm băm ra chuỗi so sánh được; audit tiêm SHA256, runtime dùng FNV-1a mặc định. */
  rank?: (key: string) => string
}

/** Chữ cái / dấu kết hợp / chữ số Unicode — ranh giới từ không dùng `\b` ASCII. */
const WORD_CHAR = /[\p{L}\p{M}\p{N}]/u

export function nfc(text: string): string {
  return text.normalize('NFC')
}

/** Khoá so sánh nhãn: trim + NFC + lowercase không locale (luật v1, không phải full case folding). */
export function foldLabel(text: string): string {
  return nfc(text.trim()).toLowerCase()
}

/** Khoá xếp hạng mặc định (đồng bộ, chạy được trên trình duyệt): FNV-1a 32-bit × 2 lượt. */
export function fnvRank(key: string): string {
  // Làn 1 là FNV-1a chuẩn (hàm dùng chung); làn 2 cùng khuôn nhưng hằng số khác để giảm va chạm.
  const h1 = fnv1a32(key)
  let h2 = 0x01000193 ^ key.length
  for (let i = 0; i < key.length; i++) {
    h2 = Math.imul(h2 ^ key.charCodeAt(i), 0x5bd1e995) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

/** Tuple xếp hạng đúng khuôn thiết kế manifest §4. */
export function rankKey(seed: string, direction: FillBlankDirection, ...parts: string[]): string {
  return JSON.stringify([FILL_BLANK_RULE_VERSION, seed, direction, ...parts])
}

/** So sánh code-unit, KHÔNG dùng localeCompare (kết quả phụ thuộc môi trường). */
export function compareCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string'
}

/** Entry hợp lệ tối thiểu: word/vi là chuỗi, câu ví dụ (nếu có) là chuỗi, forms là object. */
export function isValidEntry(entry: unknown): entry is DictEntry {
  if (!isRecord(entry)) return false
  if (typeof entry.word !== 'string' || typeof entry.vi !== 'string') return false
  if (!isOptionalString(entry.ex_en) || !isOptionalString(entry.ex_vi)) return false
  return entry.forms === undefined || entry.forms === null || isRecord(entry.forms)
}

/** Nhãn đáp án của entry theo chiều: A = word + forms dạng chuỗi; B = nguyên `vi`, không tách. */
export function targetLabels(entry: DictEntry, direction: FillBlankDirection): string[] {
  if (direction === 'B') return [entry.vi]
  const forms = isRecord(entry.forms) ? (entry.forms as Record<string, unknown>) : {}
  const out = [entry.word]
  for (const key of STRING_FORM_KEYS) {
    const value = forms[key]
    if (typeof value === 'string') out.push(value)
  }
  return out
}

function codePointBefore(text: string, index: number): string {
  if (index <= 0) return ''
  const low = text.charCodeAt(index - 1)
  if (index >= 2 && low >= 0xdc00 && low <= 0xdfff) {
    const high = text.charCodeAt(index - 2)
    if (high >= 0xd800 && high <= 0xdbff) return text.slice(index - 2, index)
  }
  return text.slice(index - 1, index)
}

function codePointAt(text: string, index: number): string {
  const cp = text.codePointAt(index)
  return cp === undefined ? '' : String.fromCodePoint(cp)
}

/** Span nằm trọn ranh giới từ Unicode: ký tự liền trước/sau không phải chữ/mark/số. */
export function isOnBoundary(sentence: string, span: FillBlankSpan): boolean {
  return (
    !WORD_CHAR.test(codePointBefore(sentence, span.start)) &&
    !WORD_CHAR.test(codePointAt(sentence, span.end))
  )
}

/**
 * Mọi vị trí `candidate` xuất hiện trong `sentence` (không phân biệt hoa thường) ở ranh giới từ.
 * So từng lát cắt của CHÍNH câu NFC — offset không bao giờ lấy từ chuỗi đã lowercase, vì
 * lowercase có thể đổi độ dài (vd `İ`).
 */
export function findSpans(sentence: string, candidate: string): FillBlankSpan[] {
  const needle = candidate.toLowerCase()
  const len = candidate.length
  const out: FillBlankSpan[] = []
  if (len === 0) return out
  for (let start = 0; start + len <= sentence.length; start++) {
    if (sentence.slice(start, start + len).toLowerCase() !== needle) continue
    const span = { start, end: start + len }
    if (isOnBoundary(sentence, span)) out.push(span)
  }
  return out
}

/** Kiểm bất biến của một câu đã dựng — dùng ở builder, test và audit. */
export function checkQuestionInvariants(q: FillBlankQuestion): {
  spanBoundary: boolean
  roundTrip: boolean
  uniqueLabels: boolean
  uniqueIds: boolean
  correctIdCount: number
  correctLabel: boolean
} {
  const spanOk =
    Number.isInteger(q.span.start) &&
    Number.isInteger(q.span.end) &&
    q.span.start >= 0 &&
    q.span.end <= q.sentence.length &&
    q.span.start < q.span.end &&
    q.sentence.slice(q.span.start, q.span.end) === q.answer
  const labels = new Set(q.options.map((o) => foldLabel(o.label)))
  const ids = new Set(q.options.map((o) => o.id))
  const correct = q.options.filter((o) => o.id === q.correctOptionId)
  return {
    spanBoundary: spanOk && isOnBoundary(q.sentence, q.span),
    roundTrip: q.prefix + q.answer + q.suffix === q.sentence && spanOk,
    uniqueLabels:
      q.options.length === DISTRACTOR_COUNT + 1 &&
      labels.size === q.options.length &&
      q.options.every((o) => o.label.trim() !== ''),
    uniqueIds: ids.size === q.options.length,
    correctIdCount: correct.length,
    correctLabel: correct.length === 1 && correct[0]!.label === q.answer,
  }
}

export function questionIsValid(q: FillBlankQuestion): boolean {
  const c = checkQuestionInvariants(q)
  return (
    c.spanBoundary &&
    c.roundTrip &&
    c.uniqueLabels &&
    c.uniqueIds &&
    c.correctIdCount === 1 &&
    c.correctLabel
  )
}

/** Chuỗi chỗ trống để hiển thị/manifest — dựng từ span, không replace. */
export function blankedSentence(q: Pick<FillBlankQuestion, 'prefix' | 'suffix'>): string {
  return q.prefix + BLANK_MARKER + q.suffix
}

type LabelCandidate = { ref: string; label: string; key: string; refJson: string }

/**
 * Chọn DISTRACTOR_COUNT nhãn có hạng nhỏ nhất, khác khoá fold nhau — tương đương "sort theo
 * (hạng, ref) rồi lấy nhãn chưa trùng", nhưng quét tuyến tính (audit toàn từ điển ~12k entry).
 */
function pickDistractors(
  labelPool: readonly LabelCandidate[],
  sourceRef: string,
  banned: ReadonlySet<string>,
  rankOf: (c: LabelCandidate) => string,
): LabelCandidate[] {
  // best: tối đa DISTRACTOR_COUNT phần tử, mỗi khoá một đại diện hạng nhỏ nhất, xếp tăng dần.
  const best: { c: LabelCandidate; r: string }[] = []
  const before = (a: { c: LabelCandidate; r: string }, b: { c: LabelCandidate; r: string }) =>
    (compareCodeUnit(a.r, b.r) || compareCodeUnit(a.c.ref, b.c.ref)) < 0
  for (const c of labelPool) {
    if (c.ref === sourceRef || banned.has(c.key)) continue
    const item = { c, r: rankOf(c) }
    const same = best.findIndex((b) => b.c.key === c.key)
    if (same >= 0) {
      if (!before(item, best[same]!)) continue
      best.splice(same, 1)
    } else if (best.length === DISTRACTOR_COUNT && !before(item, best[best.length - 1]!)) {
      continue
    }
    let at = best.findIndex((b) => before(item, b))
    if (at < 0) at = best.length
    best.splice(at, 0, item)
    if (best.length > DISTRACTOR_COUNT) best.pop()
  }
  return best.map((b) => b.c)
}

type Candidate =
  | { kind: 'rejected'; reason: FillBlankReason }
  | {
      kind: 'matched'
      entry: DictEntry
      sentence: string
      span: FillBlankSpan
      formOnly: boolean
    }

function matchEntry(raw: unknown, direction: FillBlankDirection): Candidate {
  if (!isValidEntry(raw)) return { kind: 'rejected', reason: 'invalid_entry' }
  const sentenceRaw = direction === 'A' ? raw.ex_en : raw.ex_vi
  const sentence = nfc(sentenceRaw ?? '')
  if (sentence.trim() === '') return { kind: 'rejected', reason: 'missing_sentence' }
  const primary = direction === 'A' ? raw.word : raw.vi
  if (primary.trim() === '') return { kind: 'rejected', reason: 'empty_target' }

  // Khử trùng ứng viên theo khoá fold, rồi khử trùng span theo cặp start/end.
  const seenLabels = new Set<string>()
  const spans = new Map<string, { span: FillBlankSpan; matchesHeadword: boolean }>()
  const headKey = foldLabel(primary)
  for (const label of targetLabels(raw, direction)) {
    const candidate = nfc(label.trim())
    const key = foldLabel(candidate)
    if (candidate === '' || seenLabels.has(key)) continue
    seenLabels.add(key)
    for (const span of findSpans(sentence, candidate)) {
      const spanKey = `${span.start}:${span.end}`
      const prev = spans.get(spanKey)
      spans.set(spanKey, {
        span,
        matchesHeadword: (prev?.matchesHeadword ?? false) || key === headKey,
      })
    }
  }
  if (spans.size === 0) return { kind: 'rejected', reason: 'no_match' }
  // Hai span khác nhau — kể cả chồng lấn — là mơ hồ: không đoán chỗ cần kiểm tra.
  if (spans.size > 1) return { kind: 'rejected', reason: 'multiple_spans' }
  const only = [...spans.values()][0]!
  const answer = sentence.slice(only.span.start, only.span.end)
  if (answer === '' || answer.trim() !== answer || !isOnBoundary(sentence, only.span)) {
    return { kind: 'rejected', reason: 'invalid_span' }
  }
  return {
    kind: 'matched',
    entry: raw,
    sentence,
    span: only.span,
    formOnly: direction === 'A' && !only.matchesHeadword,
  }
}

/**
 * Dựng câu điền từ từ pool. Trả câu hợp lệ theo thứ tự pool (chưa trộn/cắt) + thống kê
 * mỗi entry đúng MỘT lý do: `total = accepted + tổng các lý do loại`.
 */
export function buildFillBlankQuestions(
  pool: readonly unknown[],
  direction: FillBlankDirection,
  options: FillBlankBuildOptions = {},
): FillBlankBuildResult {
  const refs = options.refs ?? pool.map((_, i) => `pool#${i}`)
  if (refs.length !== pool.length) throw new Error('refs phải cùng độ dài với pool')
  const maxQuestions = options.maxQuestions ?? Infinity
  if (maxQuestions !== Infinity && (!Number.isInteger(maxQuestions) || maxQuestions < 0))
    throw new Error('maxQuestions phải là số nguyên không âm')
  const seed = options.seed ?? ''
  const rank = options.rank ?? fnvRank

  // Nhãn distractor ứng viên: nhãn đích của các entry hợp lệ khác trong pool.
  const labelPool: LabelCandidate[] = []
  pool.forEach((entry, i) => {
    if (!isValidEntry(entry)) return
    const label = nfc((direction === 'A' ? entry.word : entry.vi).trim())
    if (label !== '') {
      labelPool.push({
        ref: refs[i]!,
        label,
        key: foldLabel(label),
        refJson: JSON.stringify(refs[i]),
      })
    }
  })

  const uniqueLabelKeys = new Set(labelPool.map((c) => c.key))

  const counts = Object.fromEntries(
    [...FILL_BLANK_REASONS, 'accepted'].map((k) => [k, 0]),
  ) as FillBlankBuildResult['counts']
  const questions: FillBlankQuestion[] = []
  const rejections: FillBlankRejection[] = []
  const reject = (ref: string, reason: FillBlankReason) => {
    counts[reason]++
    rejections.push({ ref, reason })
  }

  let total = 0
  const inspect = (raw: unknown, i: number) => {
    const ref = refs[i]!
    const matched = matchEntry(raw, direction)
    if (matched.kind === 'rejected') return reject(ref, matched.reason)

    const { entry, sentence, span, formOnly } = matched
    const answer = sentence.slice(span.start, span.end)
    // Loại mọi nhãn/form của entry nguồn và chính đáp án, rồi khử trùng theo khoá fold.
    const banned = new Set(targetLabels(entry, direction).map(foldLabel))
    banned.add(foldLabel(answer))
    let available = uniqueLabelKeys.size
    for (const key of banned) if (uniqueLabelKeys.has(key)) available--
    if (available < DISTRACTOR_COUNT) return reject(ref, 'insufficient_distractors')
    // Khoá = rankKey(seed, direction, ref, c.ref), ghép chuỗi trước cho nhanh (audit ~12k × 12k).
    const keyHead = rankKey(seed, direction, ref).slice(0, -1) + ','
    const picked = pickDistractors(labelPool, ref, banned, (c) => rank(keyHead + c.refJson + ']'))
    if (picked.length < DISTRACTOR_COUNT) return reject(ref, 'insufficient_distractors')

    const correctOptionId = `${direction}:${ref}:correct`
    const unordered: FillBlankOption[] = [
      { id: correctOptionId, label: answer, sourceRef: ref },
      ...picked.map((c, k) => ({
        id: `${direction}:${ref}:d${k + 1}`,
        label: c.label,
        sourceRef: c.ref,
      })),
    ]
    const optionList = unordered
      .map((o) => ({ o, r: rank(rankKey(seed, direction, 'option', ref, o.id)) }))
      .sort((a, b) => compareCodeUnit(a.r, b.r) || compareCodeUnit(a.o.id, b.o.id))
      .map((x) => x.o)

    const question: FillBlankQuestion = {
      ref,
      direction,
      targetLang: direction === 'A' ? 'en' : 'vi',
      sourceWord: entry.word,
      sentence,
      span,
      answer,
      prefix: sentence.slice(0, span.start),
      suffix: sentence.slice(span.end),
      options: optionList,
      correctOptionId,
      formOnly,
    }
    if (!questionIsValid(question)) return reject(ref, 'invariant_failed')
    counts.accepted++
    questions.push(question)
  }
  for (let i = 0; i < pool.length && questions.length < maxQuestions; i++) {
    total++
    inspect(pool[i], i)
  }

  return { questions, rejections, counts, total }
}

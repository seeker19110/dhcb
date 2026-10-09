// scripts/lib/evalScoring.ts — LOGIC THUẦN chấm bài đánh giá gia sư AI (⑤ T1).
//
// Tách khỏi scripts/eval-tutor.ts (phần gọi provider, tốn API) để:
//   1. test được ở CI mà KHÔNG tốn tiền API (không gọi mạng), và
//   2. đảm bảo cách tách feedback + phân loại kết quả khớp đúng logic UI thật.
//
// Không phụ thuộc DOM/trình duyệt → an toàn cho cả tsx (script) lẫn vitest.

import { z } from 'zod'

// ─── Loại lỗi trong golden set (khớp các nhóm VIET_COMMON_ERRORS ở src/prompts) ───
export const ERROR_TYPES = [
  'third_person_s', // thiếu -s/-es ngôi thứ 3 số ít (she go → she goes)
  'plural_s', // thiếu -s danh từ số nhiều (two book → two books)
  'article', // thiếu/thừa/sai a/an/the
  'tense', // sai thì (yesterday I go → I went)
  'aux_verb', // thiếu trợ động từ do/does/did
  'missing_be', // thiếu động từ to be (I very tired → I am very tired)
  'extra_be', // thừa be trước động từ thường (I am go → I go)
  'preposition', // sai giới từ (good in → good at)
  'adjective_order', // sai trật tự tính từ (a red big car → a big red car)
  'pronoun', // sai đại từ (me and him → he and I)
  'word_by_word', // dịch word-by-word nghe không tự nhiên
  // ── Loại lỗi riêng của chiều B (người nước ngoài viết tiếng Việt) — thêm 2026-10-09 ──
  'tone_mark', // sai dấu thanh/dấu phụ làm đổi nghĩa (mua → mùa, mưa → mua)
  'classifier', // sai loại từ (hai con sách → hai quyển sách)
  'word_order', // sai trật tự từ (tôi thích rất phở → tôi rất thích phở)
  'negation', // sai phủ định không/chưa/đừng/không phải
] as const
// Các nhãn dùng chung hai chiều (tense, preposition, pronoun…) mang nghĩa theo chiều của câu:
// chiều B = đã/đang/sẽ · giới từ tiếng Việt · xưng hô · thiếu/thừa "là" · tính từ sau danh từ.
export type ErrorType = (typeof ERROR_TYPES)[number]

// error = câu CÓ lỗi (đo recall) · correct = câu ĐÚNG (đo bịa lỗi) · edge = ca biên
// (trộn ngôn ngữ, 1 từ, emoji…) — cũng KHÔNG nên bị bịa lỗi.
export type FixtureKind = 'error' | 'correct' | 'edge'

export const FixtureSchema = z.object({
  id: z.string().min(1),
  input: z.string(), // cho phép rỗng-ish ở ca biên (vd chỉ emoji) — không .min(1)
  kind: z.enum(['error', 'correct', 'edge']),
  expectedErrors: z.array(z.enum(ERROR_TYPES)),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  dir: z.enum(['A', 'B']).default('A'),
  note: z.string().optional(),
  // ── Trường đối chiếu (bắt buộc với bộ mở rộng, xem parseRichFixtures; bộ 62 câu cũ không có) ──
  corrected: z.string().optional(), // bản sửa đúng (chỉ câu 'error')
  explanation: z.string().optional(), // giải thích ngắn: chiều A bằng tiếng Việt, chiều B bằng tiếng Anh
  source: z.string().optional(), // nguồn đối chiếu hoặc "quy tắc chung" + luật
  whyCorrect: z.string().optional(), // vì sao câu 'correct'/'edge' là ĐÚNG
})
export type Fixture = z.infer<typeof FixtureSchema>

// Parse + validate cả bộ golden set. Ném lỗi rõ ràng nếu file hỏng (fail sớm khi chạy/CI).
export function parseFixtures(raw: unknown): Fixture[] {
  const arr = z.array(FixtureSchema).parse(raw)
  const ids = new Set<string>()
  for (const f of arr) {
    if (ids.has(f.id)) throw new Error(`Golden set trùng id: "${f.id}"`)
    ids.add(f.id)
    // Bất biến: câu 'error' phải khai báo ≥1 loại lỗi; 'correct'/'edge' phải để rỗng.
    if (f.kind === 'error' && f.expectedErrors.length === 0) {
      throw new Error(`Fixture "${f.id}" kind=error nhưng expectedErrors rỗng`)
    }
    if (f.kind !== 'error' && f.expectedErrors.length > 0) {
      throw new Error(`Fixture "${f.id}" kind=${f.kind} nhưng lại có expectedErrors`)
    }
  }
  return arr
}

// Bộ mở rộng (scripts/eval-tutor-fixtures-extra.json) có chuẩn chặt hơn bộ cũ: mỗi câu phải mang
// đủ bằng chứng đối chiếu để người duyệt kiểm lại được "đáp án" mà không phải tin vào trí nhớ.
export function parseRichFixtures(raw: unknown): Fixture[] {
  const arr = parseFixtures(raw)
  for (const f of arr) {
    const miss = (field: string): never => {
      throw new Error(`Fixture "${f.id}" (${f.kind}) thiếu trường "${field}"`)
    }
    if (!f.source || f.source.trim().length < 15) miss('source')
    if (f.kind === 'error') {
      if (!f.corrected?.trim()) miss('corrected')
      if (!f.explanation?.trim()) miss('explanation')
      if (f.whyCorrect !== undefined) throw new Error(`Fixture "${f.id}" kind=error có whyCorrect`)
    } else {
      if (!f.whyCorrect?.trim()) miss('whyCorrect')
      if (f.corrected !== undefined) {
        throw new Error(`Fixture "${f.id}" kind=${f.kind} (câu đúng) lại có bản sửa "corrected"`)
      }
    }
  }
  return arr
}

// ─── Tách feedback từ câu trả lời của AI ──────────────────────────────────────
export type EvalMode = 'chat' | 'speaking'

// Chat: mirror src/pages/Chat.tsx parseAssistantReply — tách 💬 (thoại) và ✅ (nhận xét).
// Giữ ĐỒNG BỘ với UI: nếu logic tách ở UI đổi, cập nhật cả hai (có test canh).
export function parseChatFeedback(content: string): { speech: string; feedback: string } {
  const lines = content.split('\n')
  const speechLines: string[] = []
  const feedbackLines: string[] = []
  let inFeedback = false
  for (const line of lines) {
    if (line.startsWith('✅')) {
      inFeedback = true
      feedbackLines.push(
        line.replace(/^✅\s*(Nhận xét|Nhan xet|Feedback):\s*/i, '').replace(/^✅\s*/i, ''),
      )
      continue
    }
    if (inFeedback) feedbackLines.push(line)
    else speechLines.push(line.replace(/^💬\s*/, ''))
  }
  return { speech: speechLines.join('\n').trim(), feedback: feedbackLines.join('\n').trim() }
}

export interface SpeakingReply {
  speech: string
  feedback: string
  corrected: string
}

// Speaking: mirror src/lib/ai.ts parseJson + kiểm tra đúng 3 khoá speech/feedback/corrected.
export function parseSpeakingReply(rawText: string): {
  jsonValid: boolean
  reply: SpeakingReply | null
} {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  let obj: unknown
  try {
    obj = JSON.parse(cleaned)
  } catch {
    return { jsonValid: false, reply: null }
  }
  if (!obj || typeof obj !== 'object') return { jsonValid: false, reply: null }
  const o = obj as Record<string, unknown>
  if (
    typeof o.speech !== 'string' ||
    typeof o.feedback !== 'string' ||
    typeof o.corrected !== 'string'
  ) {
    return { jsonValid: false, reply: null }
  }
  return {
    jsonValid: true,
    reply: { speech: o.speech, feedback: o.feedback, corrected: o.corrected },
  }
}

export interface Extracted {
  feedback: string // đã trim; rỗng = AI KHÔNG báo lỗi
  jsonValid: boolean | null // chỉ có ý nghĩa với mode speaking; chat = null
}

export function extractFeedback(mode: EvalMode, rawText: string): Extracted {
  if (mode === 'speaking') {
    const { jsonValid, reply } = parseSpeakingReply(rawText)
    return { feedback: (reply?.feedback ?? '').trim(), jsonValid }
  }
  return { feedback: parseChatFeedback(rawText).feedback.trim(), jsonValid: null }
}

// ─── Nhận diện tiếng Việt (feedback chiều A phải bằng tiếng Việt) ──────────────
const VIETNAMESE_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i
export function hasVietnamese(text: string): boolean {
  return VIETNAMESE_CHARS.test(text)
}

// ─── Phân loại kết quả 1 câu ───────────────────────────────────────────────────
export type Outcome = 'TP' | 'FN' | 'TN' | 'FP'
// hasError = fixture kỳ vọng có lỗi (kind 'error') · detected = AI trả feedback không rỗng.
export function classifyOutcome(hasError: boolean, detected: boolean): Outcome {
  if (hasError) return detected ? 'TP' : 'FN'
  return detected ? 'FP' : 'TN'
}

// ─── Đo GẦN ĐÚNG "có nhắm đúng loại lỗi không" (soft signal, KHÔNG pass/fail) ────
// Từ khoá tiếng Việt điển hình AI dùng khi giải thích từng loại lỗi. Chỉ tham khảo:
// feedback tự do nên không thể match chính xác — dùng để thấy xu hướng, không để chấm đỗ/trượt.
export const ERROR_TYPE_KEYWORDS: Record<ErrorType, string[]> = {
  third_person_s: ['ngôi thứ ba', 'ngôi thứ 3', 'số ít', 'thêm s', 'thêm "s"', '-s', '-es'],
  plural_s: ['số nhiều', 'đếm được', 'thêm s', '-s', 'plural', 'số từ'],
  article: ['mạo từ', 'quán từ', 'a/an', '"a"', '"an"', '"the"'],
  tense: [
    'thì',
    'quá khứ',
    'hiện tại',
    'chia động từ',
    'chia thì',
    'tense marker',
    'future',
    'past',
  ],
  aux_verb: ['trợ động từ', '"do"', '"does"', '"did"'],
  missing_be: ['động từ to be', 'thiếu be', 'thiếu "be"', 'thiếu động từ', '"là"'],
  extra_be: ['thừa be', 'thừa "be"', 'bỏ be', 'không cần be', 'do not insert', 'no need for'],
  preposition: ['giới từ', 'good at', 'depend on', '"in"', '"on"', '"at"', 'preposition'],
  adjective_order: [
    'trật tự tính từ',
    'thứ tự tính từ',
    'trật tự từ',
    'adjective',
    'follow the noun',
  ],
  pronoun: ['đại từ', 'chủ ngữ', 'tân ngữ', 'pronoun', 'address', 'kinship', 'polite'],
  word_by_word: ['word-by-word', 'từng chữ', 'từng từ', 'tự nhiên hơn', 'người bản xứ', 'bản ngữ'],
  // Loại lỗi chiều B: nhận xét bằng tiếng Anh nên từ khoá là tiếng Anh (soft signal như trên).
  tone_mark: ['tone', 'diacritic', 'accent mark', 'tone mark'],
  classifier: ['classifier', 'measure word'],
  word_order: ['word order', 'comes before', 'comes after', 'goes before', 'goes after', 'placed'],
  negation: ['negat', 'not yet', 'no longer', 'double negative'],
}
export function typeHit(feedback: string, expected: ErrorType[]): boolean {
  if (expected.length === 0 || feedback === '') return false
  const low = feedback.toLowerCase()
  return expected.some((t) => ERROR_TYPE_KEYWORDS[t].some((kw) => low.includes(kw.toLowerCase())))
}

// ─── Kết quả 1 câu + tổng hợp ──────────────────────────────────────────────────
export interface EvalResult {
  id: string
  kind: FixtureKind
  dir?: 'A' | 'B' // chiều học của câu; thiếu = A (kết quả cũ). Chiều B: nhận xét bằng tiếng Anh.
  expectedErrors: ErrorType[]
  outcome: Outcome
  feedbackNonEmpty: boolean
  feedbackVi: boolean // feedback (nếu có) chứa tiếng Việt
  jsonValid: boolean | null // chỉ speaking
  typeHit: boolean
  providerError?: string // gọi provider lỗi ở câu này → không tính vào metric
}

// Chấm 1 fixture từ text thô AI trả về (thuần, test được).
export function scoreOne(mode: EvalMode, fixture: Fixture, rawText: string): EvalResult {
  const { feedback, jsonValid } = extractFeedback(mode, rawText)
  const detected = feedback.length > 0
  const hasError = fixture.kind === 'error'
  return {
    id: fixture.id,
    kind: fixture.kind,
    dir: fixture.dir,
    expectedErrors: fixture.expectedErrors,
    outcome: classifyOutcome(hasError, detected),
    feedbackNonEmpty: detected,
    feedbackVi: detected && hasVietnamese(feedback),
    jsonValid,
    typeHit: typeHit(feedback, fixture.expectedErrors),
  }
}

// ─── Bản ghi NGUYÊN VĂN 1 câu (cờ --dump) ──────────────────────────────────────
// Bảng tổng chỉ nói "FP" — không nói AI đã VIẾT GÌ. Thiếu nguyên văn thì không phân biệt được
// "khen đặt nhầm vào dòng ✅" với "sửa oan câu đúng", hai lỗi cần cách sửa khác nhau
// (phát hiện 2026-10-09: Haiku 5.5 có FP-rate 48% ở các câu như "Hello").
export interface DumpRecord {
  run: number
  mode: EvalMode
  id: string
  kind: FixtureKind
  dir: 'A' | 'B'
  input: string
  outcome: Outcome | 'ERROR'
  feedback: string // phần sau ✅ (chat) hoặc khoá feedback (speaking) — đúng thứ UI hiện ra
  raw: string // nguyên văn AI trả về; rỗng khi lỗi provider
  error?: string
}

export function buildDumpRecord(
  run: number,
  mode: EvalMode,
  fixture: Fixture,
  rawText: string | null,
  error?: string,
): DumpRecord {
  const base = {
    run,
    mode,
    id: fixture.id,
    kind: fixture.kind,
    dir: fixture.dir,
    input: fixture.input,
  }
  if (rawText === null) {
    return { ...base, outcome: 'ERROR', feedback: '', raw: '', error: error ?? 'unknown' }
  }
  const r = scoreOne(mode, fixture, rawText)
  return {
    ...base,
    outcome: r.outcome,
    feedback: extractFeedback(mode, rawText).feedback,
    raw: rawText,
  }
}

export interface Summary {
  scored: number // số câu chấm được (không tính câu provider lỗi)
  providerErrors: number
  tp: number
  fn: number
  tn: number
  fp: number
  recall: number | null // TP/(TP+FN) — bắt được lỗi thật
  precision: number | null // TP/(TP+FP) — báo lỗi thì đúng là có lỗi
  falsePositiveRate: number | null // FP/(FP+TN) — bịa lỗi ở câu đúng
  specificity: number | null // TN/(FP+TN)
  typeHitRate: number | null // (TP nhắm đúng loại)/TP — soft
  feedbackViRate: number | null // feedback tiếng Việt / feedback không rỗng
  jsonValidRate: number | null // chỉ mode speaking
}

function ratio(num: number, den: number): number | null {
  return den > 0 ? num / den : null
}

export function summarize(results: EvalResult[]): Summary {
  const scored = results.filter((r) => !r.providerError)
  const tp = scored.filter((r) => r.outcome === 'TP').length
  const fn = scored.filter((r) => r.outcome === 'FN').length
  const tn = scored.filter((r) => r.outcome === 'TN').length
  const fp = scored.filter((r) => r.outcome === 'FP').length
  // Tỉ lệ "nhận xét bằng tiếng Việt" chỉ có nghĩa ở chiều A; chiều B nhận xét phải là tiếng Anh.
  const withFeedback = scored.filter((r) => r.feedbackNonEmpty && r.dir !== 'B')
  const speakingScored = scored.filter((r) => r.jsonValid !== null)
  const typeHitTp = scored.filter((r) => r.outcome === 'TP' && r.typeHit).length
  return {
    scored: scored.length,
    providerErrors: results.length - scored.length,
    tp,
    fn,
    tn,
    fp,
    recall: ratio(tp, tp + fn),
    precision: ratio(tp, tp + fp),
    falsePositiveRate: ratio(fp, fp + tn),
    specificity: ratio(tn, fp + tn),
    typeHitRate: ratio(typeHitTp, tp),
    feedbackViRate: ratio(withFeedback.filter((r) => r.feedbackVi).length, withFeedback.length),
    jsonValidRate: ratio(
      speakingScored.filter((r) => r.jsonValid === true).length,
      speakingScored.length,
    ),
  }
}

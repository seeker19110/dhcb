// ──────────────────────────────────────────────────────────────────────
// BÀI THI CUỐI CẤP CEFR (End-of-level assessment)
//
// Mỗi cấp CEFR (A1→C2) có 1 bài thi tổng hợp CHẤT LƯỢNG CAO — đạt ≥70% mới
// "qua cấp" và mở khóa cấp tiếp theo (xem docs/research/bai-kiem-tra-cuoi-cap.md).
// TỪ GĐ2b (2026-10-10, PR #1320; đặc tả docs/specs/2026-10-12-gd2b-cham-thi-cefr-server.md):
// bài thi cuối cấp do SERVER dựng đề, giữ đáp án và chấm (`/api/cefr-assessment`,
// apps/server/src/api/_lib/cefrAssessment.ts) — trình duyệt KHÔNG còn chấm, KHÔNG còn tự quyết
// "đạt". File này còn lại:
//   1. Đọc KẾT QUẢ thi từ bộ đệm localStorage (`et_cefr_exams_*`) — bản chụp của sổ thi do
//      server chấm (CefrExam.tsx ghi sau khi nộp, progressSync.ts ghi khi kéo về). Luật mở cấp
//      THẬT nằm ở server (`packages/core-learner/cefrUnlock.ts`); bộ đệm chỉ để hiển thị.
//      `saveExamAttempt` giữ cho test cũ dựng dữ liệu, mã sản phẩm không gọi.
//   2. buildExam(): DỰNG ĐỀ xáo trộn tại máy — nay chỉ còn bài test XẾP LỚP dùng
//      (pages/Placement.tsx, không cấp quyền gì) và bài luyện nghe (buildListeningQuestions).
//   3. scoreExam(): tính %/đạt từ số câu đúng — màn kết quả dùng để HIỂN THỊ con số server trả.
//   4. randomVoice(): giọng ngẫu nhiên cho câu Nghe (chống học vẹt theo 1 giọng, mục ③ N2) —
//      CefrExam.tsx gắn vào câu Nghe của đề server (server không chọn giọng).
//
// Điều kiện DỰ THI (đã học đủ: ≥70% từ vựng + 100% ngữ pháp) do trang cấp tính.
// ──────────────────────────────────────────────────────────────────────

import type { DictEntry } from '../types'
import type { QuizItem, CefrLevel } from '../data/cefr'
import type { Dialogue } from '../data/dialogues'
import type { Voice } from './tts'
import { VOICE_OPTIONS } from './voiceTiers'
import { pushProgress } from './progressSync'
import { shuffle } from '@dhcb/core-contracts/shuffle'

// Ngưỡng đạt: ≥70% tổng điểm (đồng bộ với UNLOCK_PCT của lộ trình).
export const EXAM_PASS_PCT = 0.7

// Số câu mỗi phần — kiểu chung cho cả đề thi cuối cấp (EXAM_PLAN) lẫn đề test
// xếp lớp (PLACEMENT_ROUND_PLAN, lib/placement.ts).
export interface ExamPlan {
  vocab: number
  grammar: number
  listening: number
  reading: number
}

// Số câu mong muốn mỗi phần (tổng ~24). Nếu kho mỏng thì lấy ít hơn (chấm theo
// tổng thực tế), nhưng điều kiện dự thi đã bảo đảm kho đủ lớn ở hầu hết trường hợp.
export const EXAM_PLAN: ExamPlan = { vocab: 8, grammar: 8, listening: 4, reading: 4 }

const CHOICES = 4

// ── Kết quả thi lưu trữ ─────────────────────────────────────────────────
export interface ExamResult {
  passed: boolean
  bestPct: number // 0..100 (điểm % cao nhất từng đạt)
  attempts: number
  lastAt: string // ISO timestamp lần thi gần nhất
}

export type ExamMap = Record<string, ExamResult>

const EXAM_KEY = (uid: string) => `et_cefr_exams_${uid}`

export function getExamMap(uid: string): ExamMap {
  try {
    const raw = localStorage.getItem(EXAM_KEY(uid))
    const obj = raw ? (JSON.parse(raw) as unknown) : {}
    return obj && typeof obj === 'object' ? (obj as ExamMap) : {}
  } catch {
    return {}
  }
}

function writeExamMap(uid: string, map: ExamMap) {
  try {
    localStorage.setItem(EXAM_KEY(uid), JSON.stringify(map))
  } catch {
    /* hết dung lượng — bỏ qua */
  }
}

export function getExamResult(uid: string, levelId: string): ExamResult | undefined {
  return getExamMap(uid)[levelId]
}

export function isExamPassed(uid: string, levelId: string): boolean {
  return getExamMap(uid)[levelId]?.passed ?? false
}

// Tập các cấp đã THI ĐẠT — dùng cho luật mở khóa (cefrProgress.ts).
export function getPassedExamLevels(uid: string): Set<string> {
  const map = getExamMap(uid)
  return new Set(Object.keys(map).filter((id) => map[id]?.passed))
}

// Lưu 1 lần thi: giữ điểm cao nhất, passed = OR, tăng attempts, cập nhật lastAt.
// pct = 0..100 (đã làm tròn). Trả về ExamResult sau khi cập nhật.
export function saveExamAttempt(uid: string, levelId: string, pct: number): ExamResult {
  const map = getExamMap(uid)
  const prev = map[levelId]
  const passedNow = pct >= Math.round(EXAM_PASS_PCT * 100)
  const next: ExamResult = {
    passed: (prev?.passed ?? false) || passedNow,
    bestPct: Math.max(prev?.bestPct ?? 0, pct),
    attempts: (prev?.attempts ?? 0) + 1,
    lastAt: new Date().toISOString(),
  }
  map[levelId] = next
  writeExamMap(uid, map)
  if (uid) pushProgress(uid) // đồng bộ lên Supabase
  return next
}

// ── Chấm điểm ───────────────────────────────────────────────────────────
export interface ExamScore {
  correct: number
  total: number
  pct: number // 0..100 đã làm tròn
  passed: boolean
}

export function scoreExam(correct: number, total: number): ExamScore {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  // So theo % đã làm tròn để khớp con số hiển thị cho người dùng (≥70).
  return { correct, total, pct, passed: pct >= Math.round(EXAM_PASS_PCT * 100) }
}

// ── Dựng đề ─────────────────────────────────────────────────────────────
export type ExamPart = 'vocab' | 'grammar' | 'listening' | 'reading'

// Hội thoại rút gọn để hiển thị ở phần Đọc (chỉ ngôn ngữ ĐÍCH, không lộ nghĩa).
export interface ExamPassage {
  titleVi: string
  titleEn: string
  lines: { who: 'A' | 'B'; text: string }[]
}

export interface ExamQuestion {
  key: string
  part: ExamPart
  // 'text' = hiện prompt chữ; 'audio' = phần Nghe, chỉ có nút phát, KHÔNG hiện chữ.
  promptKind: 'text' | 'audio'
  prompt: string // vocab: từ · grammar: câu có "___" · reading: câu hỏi (ngôn ngữ đích)
  audioText?: string // listening: nội dung đọc (ẩn chữ)
  audioLang?: 'en-US' | 'vi-VN'
  // listening: giọng NGẪU NHIÊN mỗi câu (chống học vẹt theo 1 giọng quen — xem
  // đặc tả mục ③ N2). Không đặt cho các phần khác — speak() tự dùng giọng global.
  audioVoice?: Voice
  passage?: ExamPassage // reading: hội thoại để đọc
  correct: string
  options: string[]
  lessonId?: string // grammar: mở lại bài khi sai
  wordKey?: string // vocab/listening: từ gốc (để ôn lại)
}

export interface GrammarExamSource {
  lessonId: string
  item: QuizItem
}

export interface BuildExamParams {
  isA: boolean
  words: DictEntry[] // từ vựng của cấp
  learned: Set<string> // từ đã thuộc (ưu tiên hỏi)
  grammar: GrammarExamSource[] // câu quiz ngữ pháp của cấp
  dialogues: Dialogue[] // hội thoại của cấp
  plan?: ExamPlan
}

// 14 giọng ngẫu nhiên cho câu Nghe — thi lại (đề mới) nghe giọng khác, chống
// học vẹt theo 1 giọng quen thay vì nghe hiểu thật (đặc tả mục ③ N2).
const LISTENING_VOICES: Voice[] = VOICE_OPTIONS.map((v) => v.id)
export function randomVoice(): Voice {
  return LISTENING_VOICES[Math.floor(Math.random() * LISTENING_VOICES.length)] as Voice
}

// Lấy tối đa `n` phương án nhiễu KHÁC `correct`, không trùng nhau.
function pickDistractors(pool: string[], correct: string, n: number): string[] {
  const seen = new Set<string>([correct])
  const out: string[] = []
  for (const v of shuffle(pool)) {
    if (out.length >= n) break
    if (v && !seen.has(v)) {
      seen.add(v)
      out.push(v)
    }
  }
  return out
}

// Dựng câu từ vựng 2 chiều (EN→VI và VI→EN, xen kẽ). Cả 2 chiều app đều luyện
// cặp EN↔VI nên không phụ thuộc isA (khác phần Nghe/Đọc dùng ngôn ngữ đích).
function buildVocabQuestions(
  words: DictEntry[],
  learned: Set<string>,
  count: number,
): ExamQuestion[] {
  // Ưu tiên từ đã thuộc; thiếu thì bù bằng từ còn lại của cấp.
  const shuffled = shuffle(words)
  const learnedPool = shuffled.filter(
    (w) => learned.has(w.word) || learned.has(w.word.toLowerCase()),
  )
  const rest = shuffled.filter((w) => !(learned.has(w.word) || learned.has(w.word.toLowerCase())))
  const cands = [...learnedPool, ...rest].slice(0, count)

  const allVi = words.map((w) => w.vi)
  const allWord = words.map((w) => w.word)
  const out: ExamQuestion[] = []
  cands.forEach((q, i) => {
    // Chiều đích của app: A học tiếng Anh (EN↔VI), B học tiếng Việt (VI↔EN).
    // Trộn 2 chiều để không chỉ nhận biết 1 phía.
    const enToVi = i % 2 === 0
    if (enToVi) {
      const distractors = pickDistractors(allVi, q.vi, CHOICES - 1)
      if (distractors.length === 0) return
      out.push({
        key: `v-${i}-${q.word}`,
        part: 'vocab',
        promptKind: 'text',
        prompt: q.word,
        correct: q.vi,
        options: shuffle([q.vi, ...distractors]),
        wordKey: q.word,
      })
    } else {
      const distractors = pickDistractors(allWord, q.word, CHOICES - 1)
      if (distractors.length === 0) return
      out.push({
        key: `v-${i}-${q.word}`,
        part: 'vocab',
        promptKind: 'text',
        prompt: q.vi,
        correct: q.word,
        options: shuffle([q.word, ...distractors]),
        wordKey: q.word,
      })
    }
  })
  return out
}

function buildGrammarQuestions(grammar: GrammarExamSource[], count: number): ExamQuestion[] {
  return shuffle(grammar)
    .slice(0, count)
    .map(({ lessonId, item }, i) => ({
      key: `g-${i}-${lessonId}`,
      part: 'grammar' as const,
      promptKind: 'text' as const,
      prompt: item.q,
      correct: item.options[item.answer] ?? '',
      options: item.options,
      lessonId,
    }))
    .filter((q) => q.correct !== '')
}

// Nghe: phát audio ngôn ngữ ĐÍCH → chọn nghĩa/từ đúng (ẩn chữ được phát).
// Xuất khẩu để tái dùng ở bài luyện nghe riêng (③ N3, lib/listening.ts) — cùng
// logic với phần Nghe của đề thi cuối cấp, không viết lại (nguyên tắc DRY).
export function buildListeningQuestions(
  isA: boolean,
  words: DictEntry[],
  learned: Set<string>,
  count: number,
): ExamQuestion[] {
  const shuffled = shuffle(words)
  const learnedPool = shuffled.filter(
    (w) => learned.has(w.word) || learned.has(w.word.toLowerCase()),
  )
  const cands = (learnedPool.length >= count ? learnedPool : shuffled).slice(0, count)
  const allVi = words.map((w) => w.vi)
  const allWord = words.map((w) => w.word)
  const out: ExamQuestion[] = []
  cands.forEach((q, i) => {
    if (isA) {
      // Học tiếng Anh → nghe TỪ tiếng Anh → chọn nghĩa tiếng Việt.
      const distractors = pickDistractors(allVi, q.vi, CHOICES - 1)
      if (distractors.length === 0) return
      out.push({
        key: `l-${i}-${q.word}`,
        part: 'listening',
        promptKind: 'audio',
        prompt: '',
        audioText: q.word,
        audioLang: 'en-US',
        audioVoice: randomVoice(),
        correct: q.vi,
        options: shuffle([q.vi, ...distractors]),
        wordKey: q.word,
      })
    } else {
      // Học tiếng Việt → nghe TỪ tiếng Việt → chọn từ tiếng Anh.
      const distractors = pickDistractors(allWord, q.word, CHOICES - 1)
      if (distractors.length === 0) return
      out.push({
        key: `l-${i}-${q.word}`,
        part: 'listening',
        promptKind: 'audio',
        prompt: '',
        audioText: q.vi,
        audioLang: 'vi-VN',
        audioVoice: randomVoice(),
        correct: q.word,
        options: shuffle([q.word, ...distractors]),
        wordKey: q.word,
      })
    }
  })
  return out
}

// Đọc hiểu: hiện 1 hội thoại (ngôn ngữ đích) → hỏi nghĩa của 1 câu trong đó.
function buildReadingQuestions(isA: boolean, dialogues: Dialogue[], count: number): ExamQuestion[] {
  // Chỉ lấy hội thoại đủ dài (≥3 dòng) để có ngữ cảnh; mỗi hội thoại 1 câu hỏi.
  const usable = shuffle(dialogues.filter((d) => d.lines.length >= 3)).slice(0, count)
  // Kho nghĩa của TẤT CẢ dòng (làm phương án nhiễu hợp lý, cùng miền hội thoại).
  const allTargetMeaning = dialogues.flatMap((d) => d.lines.map((ln) => (isA ? ln.vi : ln.en)))
  const out: ExamQuestion[] = []
  usable.forEach((d, i) => {
    const lineIdx = Math.floor(Math.random() * d.lines.length)
    const ln = d.lines[lineIdx]
    if (!ln) return
    const targetLine = isA ? ln.en : ln.vi // câu hiển thị để hỏi (ngôn ngữ đích)
    const answer = isA ? ln.vi : ln.en // nghĩa đúng (tiếng mẹ đẻ)
    const distractors = pickDistractors(allTargetMeaning, answer, CHOICES - 1)
    if (distractors.length === 0) return
    out.push({
      key: `r-${i}`,
      part: 'reading',
      promptKind: 'text',
      prompt: targetLine,
      passage: {
        titleVi: d.titleVi,
        titleEn: d.titleEn,
        lines: d.lines.map((l) => ({ who: l.who, text: isA ? l.en : l.vi })),
      },
      correct: answer,
      options: shuffle([answer, ...distractors]),
    })
  })
  return out
}

// Gom mọi câu quiz ngữ pháp của 1 cấp (không lọc "đã học xong": người gọi tự quyết
// định điều kiện dự thi). Dùng chung cho bài thi cuối cấp (CefrExam.tsx) và bài
// test xếp lớp (pages/Placement.tsx).
export function levelGrammarSources(level: CefrLevel): GrammarExamSource[] {
  const out: GrammarExamSource[] = []
  for (const u of level.units) {
    for (const g of u.grammar) {
      if (g.quiz) for (const item of g.quiz) out.push({ lessonId: g.id, item })
    }
  }
  return out
}

// Dựng cả đề: 4 phần, xáo trộn thứ tự câu TOÀN BÀI.
export function buildExam(params: BuildExamParams): ExamQuestion[] {
  const { isA, words, learned, grammar, dialogues, plan = EXAM_PLAN } = params
  const qs = [
    ...buildVocabQuestions(words, learned, plan.vocab),
    ...buildGrammarQuestions(grammar, plan.grammar),
    ...buildListeningQuestions(isA, words, learned, plan.listening),
    ...buildReadingQuestions(isA, dialogues, plan.reading),
  ]
  return shuffle(qs)
}

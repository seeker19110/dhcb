// dialogueComprehension — KIỂM TRA HIỂU sau khi xem một hội thoại CEFR (bằng chứng "đã học").
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md (đề + ngưỡng) và
// docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md (server chấm lại).
//
// VÌ SAO: trước đây mở hội thoại là ghi "đã xem" (`markDialogueViewed`) — không có gì chứng minh
// người học HIỂU. File này sinh 3 câu hỏi chọn đáp án TỪ CHÍNH DỮ LIỆU hội thoại, không gọi AI
// (không tốn lượt, không bịa nội dung):
//   ① meaning   — câu ngôn ngữ đích này nghĩa là gì? (đáp án = bản dịch tác giả viết sẵn của
//                 chính câu đó; phương án nhiễu = bản dịch các câu KHÁC trong cùng hội thoại)
//   ② next-line — trong hội thoại vừa xem, câu nào được nói NGAY SAU câu này? (nhiễu = câu khác
//                 của CÙNG người nói, để không đoán được nhờ tên người nói)
//   ③ speaker   — ai nói câu này? (hai tên nhân vật)
// Câu hỏi hỏi về điều ĐÃ XẢY RA trong hội thoại, không hỏi "câu nào hợp lý" — nên đáp án đúng
// là một sự thật kiểm được từ dữ liệu, không phụ thuộc phán đoán.
//
// HÀM THUẦN + TẤT ĐỊNH theo seed: cùng seed → cùng đề (test lặp lại được); làm lại thì nơi gọi
// đổi seed (số lần làm) để đề đổi câu, tránh học thuộc vị trí đáp án.
//
// DÙNG CHUNG client + server (đợt 0555): giao diện dựng đề để hiển thị, server dựng LẠI đúng đề
// đó từ cùng seed để chấm — một hàm, một nguồn sự thật, không có bản "server viết lại".
// Gói này không được import `apps/`, nên kiểu hội thoại khai CẤU TRÚC ở đây (`ComprehensionDialogue`)
// — `Dialogue` của app khớp kiểu này mà không cần chuyển đổi.

import { shuffle } from '@dhcb/core-contracts/shuffle'
import type { PublicDialogueQuestion } from '@dhcb/core-contracts/cefrDialogueCheck'

/** Tên nhân vật song ngữ (chiều A hiện `vi`, chiều B hiện `en`). */
export interface ComprehensionSpeaker {
  vi: string
  en: string
}

/** Phần dữ liệu hội thoại mà việc sinh đề cần — tập con cấu trúc của `Dialogue` ở app. */
export interface ComprehensionDialogue {
  titleEn: string
  speakerA?: ComprehensionSpeaker
  speakerB?: ComprehensionSpeaker
  lines: readonly { who: 'A' | 'B'; en: string; vi: string }[]
}

export type ComprehensionDirection = 'A' | 'B'
export type ComprehensionKind = 'meaning' | 'next-line' | 'speaker'
export type TextLang = 'en' | 'vi'

/** Số câu mỗi lượt kiểm tra. */
export const QUIZ_SIZE = 3
/** Ít hơn số câu này thì hội thoại KHÔNG đủ chất liệu để kiểm tra (không ghi "đã học" được). */
export const MIN_QUESTIONS = 2
/** Ngưỡng đạt = PASS_NUM/PASS_DEN số câu (làm tròn LÊN): 3 câu → 2, 2 câu → 2. */
export const PASS_NUM = 2
export const PASS_DEN = 3
/** Câu làm "đề" cho câu hỏi nghĩa nên đủ dài để có nghĩa đáng hỏi ("Yes." thì không). */
const MIN_STEM_WORDS = 3
/** Số phương án nhiễu tối đa / tối thiểu cho câu hỏi nhiều lựa chọn. */
const MAX_DISTRACTORS = 3
const MIN_DISTRACTORS = 2

export interface ComprehensionOption {
  id: string
  text: string
  /** Ngôn ngữ của chữ trong phương án — để giao diện gắn `lang` (WCAG 3.1.2). Tên người: vắng. */
  lang?: TextLang
}

export interface ComprehensionQuestion {
  /** Duy nhất trong một đề: `<loại>-<chỉ số dòng làm đề>`. */
  id: string
  kind: ComprehensionKind
  /** Câu hỏi bằng tiếng mẹ đẻ của người học (chiều A: Việt, chiều B: Anh). */
  prompt: string
  /** Dòng thoại làm đề — luôn bằng NGÔN NGỮ ĐÍCH. */
  stem: string
  stemLang: TextLang
  /** Tên người nói câu làm đề (chỉ có ở câu hỏi "câu tiếp theo" — để đề rõ ngữ cảnh). */
  stemSpeaker?: string
  options: ComprehensionOption[]
  correctId: string
  /** Lời giải thích hiện SAU khi nộp — tiếng mẹ đẻ, phần trích lấy nguyên văn từ dữ liệu. */
  explanation: ComprehensionExplanation
}

/**
 * Lời giải thích tách phần: câu dẫn (tiếng mẹ đẻ) + câu TRÍCH nguyên văn (có thể là ngôn ngữ
 * khác) — để giao diện gắn đúng `lang` cho phần trích (WCAG 3.1.2), không trộn hai thứ tiếng
 * trong cùng một chuỗi.
 */
export interface ComprehensionExplanation {
  lead: string
  quote?: string
  quoteLang?: TextLang
}

export interface ComprehensionResult {
  correct: number
  total: number
  required: number
  passed: boolean
  items: { questionId: string; chosenId: string | undefined; correct: boolean }[]
}

// ── Câu chữ hai chiều ────────────────────────────────────────────────────────────────────
// Chiều A (người Việt học Anh): câu hỏi/giải thích tiếng Việt. Chiều B (người nước ngoài học
// Việt): câu hỏi/giải thích tiếng Anh. Nội dung đề luôn là ngôn ngữ đích.
const PROMPT: Record<ComprehensionDirection, Record<ComprehensionKind, string>> = {
  A: {
    meaning: 'Câu này trong hội thoại có nghĩa là gì?',
    'next-line': 'Trong hội thoại vừa xem, câu nào được nói ngay sau câu này?',
    speaker: 'Ai nói câu này trong hội thoại?',
  },
  B: {
    meaning: 'What does this line from the dialogue mean?',
    'next-line': 'In the dialogue you just read, which line comes right after this one?',
    speaker: 'Who says this line in the dialogue?',
  },
}

function explain(
  dir: ComprehensionDirection,
  kind: ComprehensionKind,
  quote: string,
  quoteLang: TextLang,
  speaker: string,
): ComprehensionExplanation {
  if (kind === 'speaker') {
    return { lead: dir === 'A' ? `${speaker} nói câu này.` : `${speaker} says this line.` }
  }
  const lead =
    kind === 'meaning'
      ? dir === 'A'
        ? 'Nghĩa đúng:'
        : 'Correct meaning:'
      : dir === 'A'
        ? `Ngay sau đó, ${speaker} nói:`
        : `Right after that, ${speaker} says:`
  return { lead, quote, quoteLang }
}

// ── Ngẫu nhiên có seed (FNV-1a 32-bit → mulberry32) ──────────────────────────────────────
function hashSeed(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Chuẩn hoá để so trùng: bỏ hoa/thường, khoảng trắng thừa, dấu câu cuối. */
function norm(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?…,;:]+$/u, '')
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Từ (chữ/số, ≥ 2 ký tự) của một câu, chữ thường — để so trùng giữa hai thứ tiếng. */
function tokens(text: string): Set<string> {
  return new Set((text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []) as string[])
}

/**
 * Câu hỏi nghĩa "lộ đáp án" khi câu làm đề và bản dịch đúng có CHUNG một từ (tên riêng "Lan",
 * con số "5"…) mà KHÔNG phương án nhiễu nào có — người học chỉ cần dò chữ trùng, không cần hiểu.
 * Anh và Việt hầu như không chung từ thường, nên chữ trùng gần như luôn là tên/số.
 */
function loDapAn(stem: { target: string; native: string }, wrongNatives: readonly string[]) {
  const shared = [...tokens(stem.target)].filter((t) => tokens(stem.native).has(t))
  const wrongTokens = wrongNatives.map(tokens)
  return shared.some((t) => !wrongTokens.some((w) => w.has(t)))
}

interface Line {
  index: number
  who: 'A' | 'B'
  target: string
  native: string
}

/** Tên người nói theo chiều: chiều A hiển thị tên tiếng Việt, chiều B tên tiếng Anh. */
export function speakerLabel(
  dialogue: ComprehensionDialogue,
  who: 'A' | 'B',
  dir: ComprehensionDirection,
): string {
  const sp = who === 'A' ? dialogue.speakerA : dialogue.speakerB
  return (dir === 'A' ? sp?.vi : sp?.en)?.trim() || who
}

/** Lấy tối đa `max` phần tử có khoá chuẩn hoá KHÁC nhau và khác `exclude`. */
function pickDistinct(
  pool: readonly Line[],
  key: (l: Line) => string,
  exclude: readonly string[],
  max: number,
): Line[] {
  const seen = new Set(exclude.map(norm))
  const out: Line[] = []
  for (const l of pool) {
    const k = norm(key(l))
    if (k === '' || seen.has(k)) continue
    seen.add(k)
    out.push(l)
    if (out.length >= max) break
  }
  return out
}

/**
 * Sinh đề kiểm tra hiểu cho MỘT hội thoại.
 *
 * Trả `[]` khi hội thoại không đủ chất liệu cho `MIN_QUESTIONS` câu tử tế (vd chỉ 2 dòng) — nơi
 * gọi khi đó nói thật là "hội thoại này chưa kiểm tra được", KHÔNG tự chế câu hỏi.
 */
export function buildComprehensionQuiz(
  dialogue: ComprehensionDialogue,
  dir: ComprehensionDirection,
  seed: string,
): ComprehensionQuestion[] {
  const rng = makeRng(hashSeed(seed))
  const lines: Line[] = dialogue.lines
    .map((ln, index) => ({
      index,
      who: ln.who,
      target: (dir === 'A' ? ln.en : ln.vi).trim(),
      native: (dir === 'A' ? ln.vi : ln.en).trim(),
    }))
    .filter((l) => l.target !== '' && l.native !== '')
  const byIndex = new Map(lines.map((l) => [l.index, l]))
  const targetLang: TextLang = dir === 'A' ? 'en' : 'vi'
  const nativeLang: TextLang = dir === 'A' ? 'vi' : 'en'
  const name = (who: 'A' | 'B') => speakerLabel(dialogue, who, dir)
  // Dòng đã dùng làm đề/đáp án — không dùng lại, để câu này không "lộ" đáp án câu kia.
  const used = new Set<number>()

  /** Ghép phương án (đáp án + nhiễu), trộn thứ tự bằng rng. */
  const options = (correct: string, wrong: readonly string[], lang?: TextLang) => {
    const all = shuffle([correct, ...wrong], rng)
    const opts = all.map((text, i) => ({ id: `o${i}`, text, ...(lang ? { lang } : {}) }))
    const correctId = opts[all.indexOf(correct)]?.id ?? 'o0'
    return { opts, correctId }
  }

  function meaning(): ComprehensionQuestion | null {
    const pool = shuffle(
      lines.filter((l) => !used.has(l.index)),
      rng,
    )
    // Ưu tiên câu đủ dài (ổn định: giữ thứ tự đã trộn trong mỗi nhóm).
    const ordered = [
      ...pool.filter((l) => wordCount(l.target) >= MIN_STEM_WORDS),
      ...pool.filter((l) => wordCount(l.target) < MIN_STEM_WORDS),
    ]
    // Phương án dựng được cho từng câu làm đề; câu nào "lộ" đáp án (xem `loDapAn`) xếp SAU.
    let duPhong: { stem: Line; wrong: Line[] } | null = null
    let chon: { stem: Line; wrong: Line[] } | null = null
    for (const stem of ordered) {
      const others = shuffle(
        lines.filter((l) => l.index !== stem.index),
        rng,
      )
      const wrong = pickDistinct(others, (l) => l.native, [stem.native], MAX_DISTRACTORS)
      if (wrong.length < MIN_DISTRACTORS) continue
      if (
        loDapAn(
          stem,
          wrong.map((w) => w.native),
        )
      ) {
        duPhong ??= { stem, wrong }
        continue
      }
      chon = { stem, wrong }
      break
    }
    const picked = chon ?? duPhong
    if (!picked) return null
    const { stem, wrong } = picked
    used.add(stem.index)
    const { opts, correctId } = options(
      stem.native,
      wrong.map((l) => l.native),
      nativeLang,
    )
    return {
      id: `meaning-${stem.index}`,
      kind: 'meaning',
      prompt: PROMPT[dir].meaning,
      stem: stem.target,
      stemLang: targetLang,
      options: opts,
      correctId,
      explanation: explain(dir, 'meaning', stem.native, nativeLang, name(stem.who)),
    }
  }

  function nextLine(): ComprehensionQuestion | null {
    const pool = shuffle(
      lines.filter((l) => {
        const next = byIndex.get(l.index + 1)
        return next !== undefined && !used.has(l.index) && !used.has(next.index)
      }),
      rng,
    )
    for (const stem of pool) {
      const answer = byIndex.get(stem.index + 1)
      if (!answer) continue
      // Nhiễu = câu khác của CÙNG người nói với đáp án → tên người nói không gợi ý được gì.
      const others = shuffle(
        lines.filter(
          (l) => l.who === answer.who && l.index !== answer.index && l.index !== stem.index,
        ),
        rng,
      )
      const wrong = pickDistinct(
        others,
        (l) => l.target,
        [answer.target, stem.target],
        MAX_DISTRACTORS,
      )
      if (wrong.length < MIN_DISTRACTORS) continue
      used.add(stem.index)
      used.add(answer.index)
      const { opts, correctId } = options(
        answer.target,
        wrong.map((l) => l.target),
        targetLang,
      )
      return {
        id: `next-line-${stem.index}`,
        kind: 'next-line',
        prompt: PROMPT[dir]['next-line'],
        stem: stem.target,
        stemLang: targetLang,
        stemSpeaker: name(stem.who),
        options: opts,
        correctId,
        explanation: explain(dir, 'next-line', answer.target, targetLang, name(answer.who)),
      }
    }
    return null
  }

  function speaker(): ComprehensionQuestion | null {
    const nameA = name('A')
    const nameB = name('B')
    // Cần đủ HAI người nói, tên khác nhau — không thì câu hỏi vô nghĩa.
    if (norm(nameA) === norm(nameB)) return null
    if (!lines.some((l) => l.who === 'A') || !lines.some((l) => l.who === 'B')) return null
    const pool = shuffle(
      lines.filter((l) => !used.has(l.index)),
      rng,
    )
    const stem = pool[0]
    if (!stem) return null
    used.add(stem.index)
    // Thứ tự cố định A rồi B (đúng thứ tự xuất hiện của nhân vật) — chỉ hai lựa chọn.
    const opts: ComprehensionOption[] = [
      { id: 'A', text: nameA },
      { id: 'B', text: nameB },
    ]
    return {
      id: `speaker-${stem.index}`,
      kind: 'speaker',
      prompt: PROMPT[dir].speaker,
      stem: stem.target,
      stemLang: targetLang,
      options: opts,
      correctId: stem.who,
      explanation: explain(dir, 'speaker', stem.target, targetLang, name(stem.who)),
    }
  }

  const makers: Record<ComprehensionKind, () => ComprehensionQuestion | null> = {
    meaning,
    'next-line': nextLine,
    speaker,
  }
  // Kế hoạch: mỗi loại một câu; loại nào không dựng được (vd hội thoại một người nói) thì bù
  // bằng loại khác cho đủ QUIZ_SIZE.
  const plan: ComprehensionKind[] = ['meaning', 'next-line', 'speaker']
  const fallback: ComprehensionKind[] = ['meaning', 'next-line', 'meaning', 'next-line']
  const questions: ComprehensionQuestion[] = []
  for (const kind of [...plan, ...fallback]) {
    if (questions.length >= QUIZ_SIZE) break
    const q = makers[kind]()
    if (q) questions.push(q)
  }
  return questions.length >= MIN_QUESTIONS ? questions : []
}

/**
 * BẢN CÔNG KHAI của một câu hỏi — gửi cho giao diện khi seed do SERVER cấp (đợt 0558): giữ đúng
 * phần cần để hiện đề, BỎ `correctId` và `explanation` (giải thích trích nguyên văn đáp án).
 * Liệt kê từng trường thay vì rest-spread để thêm trường mới vào `ComprehensionQuestion` sau này
 * không vô tình lọt ra ngoài.
 */
export function toPublicComprehensionQuestion(q: ComprehensionQuestion): PublicDialogueQuestion {
  return {
    id: q.id,
    kind: q.kind,
    prompt: q.prompt,
    stem: q.stem,
    stemLang: q.stemLang,
    ...(q.stemSpeaker !== undefined ? { stemSpeaker: q.stemSpeaker } : {}),
    options: q.options.map((o) => ({
      id: o.id,
      text: o.text,
      ...(o.lang ? { lang: o.lang } : {}),
    })),
  }
}

/** Số câu đúng tối thiểu để đạt với `total` câu (làm tròn LÊN, số nguyên — không sai số thực). */
export function requiredCorrect(total: number): number {
  return Math.ceil((total * PASS_NUM) / PASS_DEN)
}

/** Chấm một lượt. Câu bỏ trống = sai. Đề rỗng/thiếu câu không bao giờ "đạt". */
export function gradeComprehension(
  questions: readonly ComprehensionQuestion[],
  answers: Readonly<Record<string, string | undefined>>,
): ComprehensionResult {
  const items = questions.map((q) => {
    const chosenId = answers[q.id]
    return { questionId: q.id, chosenId, correct: chosenId === q.correctId }
  })
  const correct = items.filter((i) => i.correct).length
  const total = questions.length
  const required = requiredCorrect(total)
  return {
    correct,
    total,
    required,
    passed: total >= MIN_QUESTIONS && correct >= required,
    items,
  }
}

/** Seed của một lượt: cùng hội thoại + chiều + số lần làm → cùng đề. */
export function comprehensionSeed(
  ownerId: string,
  titleEn: string,
  dir: ComprehensionDirection,
  attempt: number,
): string {
  return `${ownerId}:${titleEn}|${dir}|${attempt}`
}

/** Một lựa chọn thô client gửi lên: id câu → id phương án. */
export interface ComprehensionAnswer {
  questionId: string
  optionId: string
}

export type RegradeOutcome =
  | { ok: true; questions: ComprehensionQuestion[]; result: ComprehensionResult }
  /** `NO_QUIZ`: hội thoại không dựng được đề · `QUIZ_MISMATCH`: id câu lạ/trùng (lệch dữ liệu). */
  | { ok: false; code: 'NO_QUIZ' | 'QUIZ_MISMATCH' }

/**
 * SERVER CHẤM LẠI một lượt (đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③):
 * dựng LẠI đề từ dữ liệu + seed bằng đúng `buildComprehensionQuiz` mà giao diện đã dùng, rồi chấm
 * bằng `gradeComprehension`. Không tin bất kỳ con số nào client tính.
 *
 * Id câu client gửi mà không có trong đề (hoặc gửi trùng một câu) → `QUIZ_MISMATCH`, KHÔNG chấm:
 * nghĩa là hai bên đang cầm hai phiên bản dữ liệu khác nhau (client còn cache `dialogues.json` cũ),
 * chấm tiếp thì kết quả vô nghĩa. Câu thiếu trả lời = sai (cùng luật "bỏ trống = sai").
 */
export function regradeComprehension(
  dialogue: ComprehensionDialogue,
  dir: ComprehensionDirection,
  seed: string,
  answers: readonly ComprehensionAnswer[],
): RegradeOutcome {
  const questions = buildComprehensionQuiz(dialogue, dir, seed)
  if (questions.length === 0) return { ok: false, code: 'NO_QUIZ' }
  const ids = new Set(questions.map((q) => q.id))
  // Map thay vì object thường: id do client gửi không bao giờ chạm được prototype.
  const chosen = new Map<string, string>()
  for (const a of answers) {
    if (!ids.has(a.questionId) || chosen.has(a.questionId)) {
      return { ok: false, code: 'QUIZ_MISMATCH' }
    }
    chosen.set(a.questionId, a.optionId)
  }
  return { ok: true, questions, result: gradeComprehension(questions, Object.fromEntries(chosen)) }
}

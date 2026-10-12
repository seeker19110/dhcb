import { describe, it, expect, beforeEach, vi } from 'vitest'

// Chặn import supabase thật (thiếu env trong test) — giống cefrProgress.test.ts.
vi.mock('./progressSync.js', () => ({ pushProgress: vi.fn() }))

import {
  EXAM_PASS_PCT,
  scoreExam,
  saveExamAttempt,
  getExamResult,
  isExamPassed,
  getPassedExamLevels,
  getExamMap,
  buildExam,
  buildListeningQuestions,
  levelGrammarSources,
  randomVoice,
  type GrammarExamSource,
} from './cefrExam'
import { VOICE_OPTIONS } from './voiceTiers'
import type { DictEntry } from '../types'
import type { Dialogue } from '../data/dialogues'
import type { CefrLevel, CefrUnit, GrammarLesson } from '../data/cefr'

const word = (w: string): DictEntry =>
  ({ word: w, vi: `nghĩa ${w}`, ex_en: `${w} example`, ex_vi: `ví dụ ${w}` }) as DictEntry

const dialogue = (id: number): Dialogue => ({
  titleVi: `hội thoại ${id}`,
  titleEn: `dialogue ${id}`,
  lines: [
    { who: 'A', en: `A-en ${id}`, vi: `A-vi ${id}` },
    { who: 'B', en: `B-en ${id}`, vi: `B-vi ${id}` },
    { who: 'A', en: `A2-en ${id}`, vi: `A2-vi ${id}` },
  ],
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('scoreExam — ngưỡng đạt ≥70% (theo % làm tròn)', () => {
  it('17/24 = 71% → đạt; 16/24 = 67% → trượt', () => {
    expect(scoreExam(17, 24)).toMatchObject({ pct: 71, passed: true })
    expect(scoreExam(16, 24)).toMatchObject({ pct: 67, passed: false })
  })

  it('đúng 70% tròn → đạt (≥, không phải >)', () => {
    expect(scoreExam(7, 10)).toMatchObject({ pct: 70, passed: true })
    expect(scoreExam(6, 10).passed).toBe(false)
  })

  it('tổng 0 câu → 0%, không đạt', () => {
    expect(scoreExam(0, 0)).toMatchObject({ pct: 0, passed: false })
  })

  it('ngưỡng khớp hằng số EXAM_PASS_PCT', () => {
    expect(Math.round(EXAM_PASS_PCT * 100)).toBe(70)
  })
})

describe('saveExamAttempt — dữ liệu chỉ tốt lên (best/passed/attempts)', () => {
  it('lưu điểm cao nhất, passed = OR, tăng attempts, đồng bộ', async () => {
    const { pushProgress } = await import('./progressSync')

    saveExamAttempt('u1', 'A1', 60) // trượt
    expect(getExamResult('u1', 'A1')).toMatchObject({ passed: false, bestPct: 60, attempts: 1 })
    expect(isExamPassed('u1', 'A1')).toBe(false)

    saveExamAttempt('u1', 'A1', 80) // đạt
    expect(getExamResult('u1', 'A1')).toMatchObject({ passed: true, bestPct: 80, attempts: 2 })
    expect(isExamPassed('u1', 'A1')).toBe(true)

    saveExamAttempt('u1', 'A1', 50) // điểm thấp hơn không làm mất "đã qua"/điểm cao
    expect(getExamResult('u1', 'A1')).toMatchObject({ passed: true, bestPct: 80, attempts: 3 })

    expect(vi.mocked(pushProgress)).toHaveBeenCalledTimes(3)
  })

  it('getPassedExamLevels chỉ gồm cấp đã đạt', () => {
    saveExamAttempt('u1', 'A1', 90)
    saveExamAttempt('u1', 'A2', 40)
    const passed = getPassedExamLevels('u1')
    expect(passed.has('A1')).toBe(true)
    expect(passed.has('A2')).toBe(false)
  })

  it('tách theo user', () => {
    saveExamAttempt('u1', 'A1', 90)
    expect(isExamPassed('u2', 'A1')).toBe(false)
  })
})

describe('buildExam — dựng đề 4 phần từ kho của cấp', () => {
  const words = Array.from({ length: 12 }, (_, i) => word(`w${i}`))
  const grammar: GrammarExamSource[] = Array.from({ length: 12 }, (_, i) => ({
    lessonId: `g${i}`,
    item: { q: `Điền ___ số ${i}`, options: [`a${i}`, `b${i}`, `c${i}`, `d${i}`], answer: 1 },
  }))
  const dialogues = Array.from({ length: 6 }, (_, i) => dialogue(i))
  const learned = new Set(words.map((w) => w.word))

  it('đủ 4 phần đúng số câu (8+8+4+4 = 24) khi kho đủ lớn', () => {
    const qs = buildExam({ isA: true, words, learned, grammar, dialogues })
    const count = (p: string) => qs.filter((q) => q.part === p).length
    expect(count('vocab')).toBe(8)
    expect(count('grammar')).toBe(8)
    expect(count('listening')).toBe(4)
    expect(count('reading')).toBe(4)
    expect(qs.length).toBe(24)
  })

  it('mọi câu có đáp án đúng nằm trong options', () => {
    const qs = buildExam({ isA: true, words, learned, grammar, dialogues })
    for (const q of qs) {
      expect(q.options).toContain(q.correct)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('câu ngữ pháp mang lessonId để "mở lại bài"', () => {
    const qs = buildExam({ isA: true, words, learned, grammar, dialogues })
    for (const q of qs.filter((x) => x.part === 'grammar')) {
      expect(q.lessonId).toBeTruthy()
    }
  })

  it('câu Nghe có promptKind audio + audioText (ẩn chữ)', () => {
    const qs = buildExam({ isA: true, words, learned, grammar, dialogues })
    for (const q of qs.filter((x) => x.part === 'listening')) {
      expect(q.promptKind).toBe('audio')
      expect(q.audioText).toBeTruthy()
      expect(q.prompt).toBe('')
    }
  })

  it('câu Đọc có passage (hội thoại) để đọc hiểu', () => {
    const qs = buildExam({ isA: true, words, learned, grammar, dialogues })
    for (const q of qs.filter((x) => x.part === 'reading')) {
      expect(q.passage?.lines.length).toBeGreaterThanOrEqual(3)
      expect(q.prompt).toBeTruthy()
    }
  })

  it('chiều B (học tiếng Việt): Nghe phát tiếng Việt, chọn từ tiếng Anh', () => {
    const qs = buildExam({ isA: false, words, learned, grammar, dialogues })
    const listen = qs.find((q) => q.part === 'listening')
    expect(listen?.audioLang).toBe('vi-VN')
  })
})

// Đợt 2 coverage 2026-09-05: các nhánh dưới đây chưa test nào đi qua (xem uncovered-all.md) —
// dữ liệu localStorage hỏng/lạ của getExamMap, ghi đè bị lỗi (hết dung lượng), từ đã thuộc khớp
// không phân biệt hoa/thường + kho quá mỏng phải bù bằng shuffled, các ca "0 phương án nhiễu"
// (kho chỉ có 1 giá trị) khiến câu bị bỏ qua thay vì tạo ra đáp án trùng nhau, đáp án ngữ pháp
// trỏ ra ngoài mảng options, chỉ số dòng hội thoại vượt biên (Math.random() sát 1), và hàm
// levelGrammarSources chưa từng được gọi tới trong test nào.

describe('getExamMap — dữ liệu localStorage hỏng hoặc không đúng dạng', () => {
  beforeEach(() => localStorage.clear())

  it('localStorage rỗng (chưa thi lần nào) → object rỗng', () => {
    expect(getExamMap('u9')).toEqual({})
  })

  it('JSON hợp lệ nhưng không phải object (vd number) → coi như rỗng', () => {
    localStorage.setItem('et_cefr_exams_u9', '42')
    expect(getExamMap('u9')).toEqual({})
  })

  it('JSON "null" → coi như rỗng (obj falsy)', () => {
    localStorage.setItem('et_cefr_exams_u9', 'null')
    expect(getExamMap('u9')).toEqual({})
  })

  it('chuỗi không phải JSON hợp lệ → bắt lỗi, coi như rỗng, không ném ra ngoài', () => {
    localStorage.setItem('et_cefr_exams_u9', '{khong-phai-json')
    expect(getExamMap('u9')).toEqual({})
  })

  it('setItem lỗi (hết dung lượng) → saveExamAttempt không ném lỗi và không lưu được', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    try {
      expect(() => saveExamAttempt('u9', 'A1', 80)).not.toThrow()
    } finally {
      setItemSpy.mockRestore()
    }
    expect(getExamResult('u9', 'A1')).toBeUndefined()
  })
})

describe('buildListeningQuestions — nhánh riêng (không qua buildExam)', () => {
  const words5 = [
    word('case0'),
    { ...word('Case1'), word: 'Case1', vi: 'nghĩa Case1' },
    word('case2'),
    word('case3'),
    word('case4'),
  ]

  it('từ đã thuộc khớp KHÔNG phân biệt hoa/thường + kho thuộc mỏng hơn số câu cần → bù bằng shuffled', () => {
    // learned chỉ ghi chữ thường: 'case0' khớp trực tiếp, 'Case1' phải qua nhánh
    // learned.has(w.word.toLowerCase()) mới nhận ra là đã thuộc → learnedPool có 2 từ,
    // ít hơn count=3 → phải rơi vào nhánh dùng `shuffled` (toàn bộ 5 từ) thay vì chỉ 2 từ đã thuộc.
    const learned = new Set(['case0', 'case1'])
    const qs = buildListeningQuestions(true, words5, learned, 3)
    expect(qs).toHaveLength(3) // nếu không bù bằng shuffled thì tối đa chỉ ra được 2 câu
  })

  it('kho chỉ có 1 giá trị lặp lại → không tìm được phương án nhiễu → bỏ qua câu (chiều A)', () => {
    const dup = [word('dup'), word('dup')]
    const qs = buildListeningQuestions(true, dup, new Set(), 2)
    expect(qs).toHaveLength(0)
  })

  it('kho chỉ có 1 giá trị lặp lại → không tìm được phương án nhiễu → bỏ qua câu (chiều B)', () => {
    const dup = [word('dup'), word('dup')]
    const qs = buildListeningQuestions(false, dup, new Set(), 2)
    expect(qs).toHaveLength(0)
  })
})

describe('buildExam — nhánh của buildVocabQuestions/buildGrammarQuestions/buildReadingQuestions', () => {
  const zeroPlan = { vocab: 0, grammar: 0, listening: 0, reading: 0 }

  it('từ vựng: đã thuộc khớp không phân biệt hoa/thường được ưu tiên hỏi trước', () => {
    const words5 = [
      word('case0'),
      { ...word('Case1'), word: 'Case1', vi: 'nghĩa Case1' },
      word('case2'),
      word('case3'),
      word('case4'),
    ]
    const learned = new Set(['case0', 'case1'])
    const qs = buildExam({
      isA: true,
      words: words5,
      learned,
      grammar: [],
      dialogues: [],
      plan: { ...zeroPlan, vocab: 2 },
    })
    expect(qs).toHaveLength(2)
    expect(new Set(qs.map((q) => q.wordKey))).toEqual(new Set(['case0', 'Case1']))
  })

  it('từ vựng: kho chỉ có 1 giá trị lặp lại → 0 phương án nhiễu cả 2 chiều → bỏ qua hết', () => {
    const dup = [word('dup'), word('dup')]
    const qs = buildExam({
      isA: true,
      words: dup,
      learned: new Set(),
      grammar: [],
      dialogues: [],
      plan: { ...zeroPlan, vocab: 2 },
    })
    expect(qs).toHaveLength(0)
  })

  it('ngữ pháp: answer trỏ ra ngoài mảng options → correct rỗng → bị lọc bỏ', () => {
    const grammar: GrammarExamSource[] = [
      { lessonId: 'gbad', item: { q: 'Điền ___', options: ['a', 'b'], answer: 9 } },
      { lessonId: 'ggood1', item: { q: 'Điền ___ 1', options: ['a', 'b'], answer: 0 } },
      { lessonId: 'ggood2', item: { q: 'Điền ___ 2', options: ['a', 'b'], answer: 1 } },
    ]
    const qs = buildExam({
      isA: true,
      words: [],
      learned: new Set(),
      grammar,
      dialogues: [],
      plan: { ...zeroPlan, grammar: 3 },
    })
    expect(qs).toHaveLength(2)
    expect(new Set(qs.map((q) => q.lessonId))).toEqual(new Set(['ggood1', 'ggood2']))
  })

  it('đọc hiểu: hội thoại chỉ có 1 nghĩa lặp lại → 0 phương án nhiễu → bỏ qua câu', () => {
    const dupLine = { who: 'A' as const, en: 'same-en', vi: 'same-vi' }
    const dupDialogue: Dialogue = {
      titleVi: 'lặp',
      titleEn: 'dup',
      lines: [dupLine, dupLine, dupLine],
    }
    const qs = buildExam({
      isA: true,
      words: [],
      learned: new Set(),
      grammar: [],
      dialogues: [dupDialogue],
      plan: { ...zeroPlan, reading: 1 },
    })
    expect(qs).toHaveLength(0)
  })

  it('đọc hiểu: chỉ số dòng random rơi đúng biên (Math.random() = 1) → bỏ qua câu, không vỡ', () => {
    // d.lines[lineIdx] chỉ undefined khi Math.random() trả đúng 1 — không xảy ra thật với
    // Math.random() (luôn < 1), nhưng code vẫn phải phòng thủ đúng. Chỉ 1 hội thoại + words/
    // grammar rỗng để lệnh Math.random() ĐẦU TIÊN trong cả lượt gọi chính là phép tính lineIdx.
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValueOnce(1)
    try {
      const qs = buildExam({
        isA: true,
        words: [],
        learned: new Set(),
        grammar: [],
        dialogues: [dialogue(1)],
        plan: { ...zeroPlan, reading: 1 },
      })
      expect(qs).toHaveLength(0)
    } finally {
      randomSpy.mockRestore()
    }
  })
})

describe('levelGrammarSources — gom quiz từ mọi unit, bỏ qua bài không có quiz', () => {
  const grammarLesson = (id: string, quiz?: GrammarLesson['quiz']): GrammarLesson => ({
    id,
    titleVi: `ngữ pháp ${id}`,
    titleEn: `grammar ${id}`,
    structure: 'S + V',
    explainVi: 'giải thích',
    examples: [{ en: 'I am', vi: 'Tôi là' }],
    quiz,
  })

  const unit = (id: string, grammar: GrammarLesson[]): CefrUnit => ({
    id,
    titleVi: `unit ${id}`,
    titleEn: `unit ${id}`,
    emoji: '📘',
    grammar,
    vocabCircleIds: [],
  })

  it('lấy đúng câu quiz từ bài CÓ quiz (nhiều câu), bỏ qua bài không có quiz', () => {
    const level: CefrLevel = {
      id: 'A1',
      titleVi: 'A1',
      titleEn: 'A1',
      subtitleVi: 'sub',
      goalVi: 'goal',
      accent: 'emerald',
      canDo: [],
      units: [
        unit('u1', [
          grammarLesson('g1', [
            { q: 'câu 1', options: ['a', 'b'], answer: 0 },
            { q: 'câu 2', options: ['a', 'b'], answer: 1 },
          ]),
          grammarLesson('g2'), // không có quiz — phải bị bỏ qua
        ]),
        unit('u2', [grammarLesson('g3', [{ q: 'câu 3', options: ['a', 'b'], answer: 0 }])]),
      ],
    }

    const sources = levelGrammarSources(level)
    expect(sources.map((s) => s.lessonId)).toEqual(['g1', 'g1', 'g3'])
  })
})

describe('randomVoice — giọng ngẫu nhiên cho câu Nghe (GĐ2b: CefrExam.tsx gắn vào đề server)', () => {
  it('luôn trả một giọng có trong VOICE_OPTIONS', () => {
    const ids = new Set(VOICE_OPTIONS.map((v) => v.id))
    for (let i = 0; i < 50; i++) expect(ids.has(randomVoice())).toBe(true)
  })

  it('không dính một giọng duy nhất (50 lần rút ra ≥ 2 giọng khác nhau)', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 50; i++) seen.add(randomVoice())
    expect(seen.size).toBeGreaterThanOrEqual(2)
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Chặn import supabase thật (thiếu env trong test) — giống srs.test.ts/vocab.test.ts.
vi.mock('./progressSync.js', () => ({ pushProgress: vi.fn() }))

import {
  UNLOCK_PCT,
  getDoneGrammar,
  markGrammarDone,
  unmarkGrammarDone,
  isGrammarDone,
  getViewedDialogues,
  getLearnedDialogues,
  markDialogueViewed,
  markDialogueLearned,
  dialogueKey,
  DIALOGUE_LEARNED_PREFIX,
  circleDoneCount,
  unitVocabCounts,
  levelVocabCounts,
  unitGrammarCounts,
  levelGrammarCounts,
  computeLockedMap,
  computeLockedMapFromServer,
  getUnlockedLevels,
  isExamEligible,
  findNextStep,
} from './cefrProgress'
import { _resetSrsMemCacheForTests } from './srs'
import type { CefrLevel, CefrUnit, GrammarLesson } from '../data/cefr'
import type { Circle } from '../data/curriculum'
import type { DictEntry } from '../types'

// ── Dữ liệu giả nhỏ gọn để test logic thuần ─────────────────────────────
const word = (w: string): DictEntry => ({ word: w, vi: `nghĩa ${w}` }) as DictEntry

const circle = (id: string, words: string[]): Circle => ({
  id,
  titleVi: id,
  titleEn: id,
  emoji: '📚',
  words: words.map(word),
  sentences: [],
})

const lesson = (id: string): GrammarLesson => ({
  id,
  titleVi: id,
  titleEn: id,
  structure: 'S + V',
  explainVi: 'giải thích',
  examples: [],
})

const unit = (id: string, grammarIds: string[], circleIds: string[]): CefrUnit => ({
  id,
  titleVi: id,
  titleEn: id,
  emoji: '🧩',
  grammar: grammarIds.map(lesson),
  vocabCircleIds: circleIds,
})

const level = (id: CefrLevel['id'], units: CefrUnit[]): CefrLevel => ({
  id,
  titleVi: id,
  titleEn: id,
  subtitleVi: '',
  goalVi: '',
  accent: 'emerald',
  canDo: [],
  units,
})

const BY_ID: Record<string, Circle> = {
  c1: circle('c1', ['apple', 'banana']),
  c2: circle('c2', ['cat', 'dog']),
  c3: circle('c3', ['egg', 'fish']),
}

const A1 = level('A1', [unit('u1', ['g1', 'g2'], ['c1']), unit('u2', ['g3'], ['c2'])])
const A2 = level('A2', [unit('u3', ['g4'], ['c3'])])

beforeEach(() => {
  localStorage.clear()
  _resetSrsMemCacheForTests()
  vi.clearAllMocks()
})

describe('đánh dấu bài ngữ pháp đã học', () => {
  it('mặc định rỗng, mark/unmark hoạt động và tách theo user', () => {
    expect(getDoneGrammar('u1').size).toBe(0)
    markGrammarDone('u1', 'g1')
    expect(isGrammarDone('u1', 'g1')).toBe(true)
    expect(isGrammarDone('u2', 'g1')).toBe(false)
    unmarkGrammarDone('u1', 'g1')
    expect(isGrammarDone('u1', 'g1')).toBe(false)
  })

  it('chịu được dữ liệu hỏng trong localStorage', () => {
    localStorage.setItem('et_cefr_grammar_u1', '{oops')
    expect(getDoneGrammar('u1').size).toBe(0)
  })
})

describe('hội thoại đã xem', () => {
  it('mark rồi đọc lại theo khóa owner:titleEn', () => {
    markDialogueViewed('u1', 'a1-greetings', 'Morning greeting')
    expect(getViewedDialogues('u1').has(dialogueKey('a1-greetings', 'Morning greeting'))).toBe(true)
    expect(getViewedDialogues('u2').size).toBe(0)
  })

  it('xem lại hội thoại đã xem → không đẩy đồng bộ thừa', async () => {
    const { pushProgress } = await import('./progressSync')
    markDialogueViewed('u1', 'a1-greetings', 'Morning greeting')
    markDialogueViewed('u1', 'a1-greetings', 'Morning greeting')
    expect(getViewedDialogues('u1').size).toBe(1)
    expect(vi.mocked(pushProgress)).toHaveBeenCalledTimes(1)
  })
})

// Đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
describe('hội thoại đã học (đạt kiểm tra hiểu)', () => {
  it('dữ liệu CŨ chỉ có "đã xem" → vẫn là đã xem, KHÔNG tự thành đã học', () => {
    localStorage.setItem('et_cefr_dialogue_u1', JSON.stringify(['a1-greetings:Meeting in class']))
    expect(getViewedDialogues('u1').has('a1-greetings:Meeting in class')).toBe(true)
    expect(getLearnedDialogues('u1').size).toBe(0)
  })

  it('markDialogueLearned ghi cả "đã xem" lẫn "đã học", cùng một kho (đồng bộ chung)', () => {
    markDialogueLearned('u1', 'a1-greetings', 'Meeting in class')
    const key = dialogueKey('a1-greetings', 'Meeting in class')
    expect(getLearnedDialogues('u1')).toEqual(new Set([key]))
    // Bản ghi có tiền tố KHÔNG lẫn vào tập "đã xem" (mục lục đếm theo khoá unit).
    expect(getViewedDialogues('u1')).toEqual(new Set([key]))
    const raw = JSON.parse(localStorage.getItem('et_cefr_dialogue_u1') ?? '[]') as string[]
    expect(raw.sort()).toEqual([key, `${DIALOGUE_LEARNED_PREFIX}${key}`].sort())
    expect(getLearnedDialogues('u2').size).toBe(0)
  })

  it('ghi lại lần nữa → idempotent, không đẩy đồng bộ thừa', async () => {
    const { pushProgress } = await import('./progressSync')
    markDialogueLearned('u1', 'a1-greetings', 'Meeting in class')
    markDialogueLearned('u1', 'a1-greetings', 'Meeting in class')
    expect(vi.mocked(pushProgress)).toHaveBeenCalledTimes(1)
  })

  it('đã xem trước rồi mới học → vẫn ghi (và đẩy) bản "đã học"', async () => {
    const { pushProgress } = await import('./progressSync')
    markDialogueViewed('u1', 'a1-greetings', 'Meeting in class')
    markDialogueLearned('u1', 'a1-greetings', 'Meeting in class')
    expect(getLearnedDialogues('u1').size).toBe(1)
    expect(vi.mocked(pushProgress)).toHaveBeenCalledTimes(2)
  })
})

describe('đồng bộ Supabase khi đánh dấu', () => {
  it('mark/unmark bài ngữ pháp đều gọi pushProgress (mark gọi 2 lần: ghi cờ xong + vào SRS ngữ pháp — đề xuất E, xem lib/srs.ts)', async () => {
    const { pushProgress } = await import('./progressSync')
    markGrammarDone('u1', 'g1')
    unmarkGrammarDone('u1', 'g1')
    expect(vi.mocked(pushProgress)).toHaveBeenCalledTimes(3)
  })
})

describe('đếm tiến độ từ vựng / ngữ pháp', () => {
  it('circleDoneCount so khớp cả nguyên dạng lẫn chữ thường', () => {
    const c = circle('x', ['Apple', 'banana'])
    expect(circleDoneCount(c, new Set(['apple']))).toBe(1)
    expect(circleDoneCount(c, new Set(['Apple', 'banana']))).toBe(2)
  })

  it('unitVocabCounts bỏ qua id vòng không tồn tại', () => {
    const u = unit('u', [], ['c1', 'missing'])
    expect(unitVocabCounts(u, BY_ID, new Set(['apple']))).toEqual({ done: 1, total: 2 })
  })

  it('levelVocabCounts cộng dồn các unit', () => {
    expect(levelVocabCounts(A1, BY_ID, new Set(['apple', 'cat']))).toEqual({ done: 2, total: 4 })
  })

  it('đếm ngữ pháp theo Set bài đã xong', () => {
    const done = new Set(['g1', 'g3'])
    expect(unitGrammarCounts(A1.units[0]!, done)).toEqual({ done: 1, total: 2 })
    expect(levelGrammarCounts(A1, done)).toEqual({ done: 2, total: 3 })
  })
})

// A1 có 3 bài ngữ pháp: g1, g2 (unit u1) + g3 (unit u2).
const A1_ALL_GRAMMAR_DONE = new Set(['g1', 'g2', 'g3'])

describe('isExamEligible — điều kiện DỰ THI: ≥70% từ vựng + 100% ngữ pháp', () => {
  it('đủ điều kiện khi ≥70% từ vựng VÀ ngữ pháp xong hết', () => {
    // A1 có 4 từ → 3/4 = 75% ≥ 70%
    const learned = new Set(['apple', 'banana', 'cat'])
    expect(3 / 4).toBeGreaterThanOrEqual(UNLOCK_PCT)
    expect(isExamEligible(A1, BY_ID, learned, A1_ALL_GRAMMAR_DONE)).toBe(true)
  })

  it('CHƯA đủ nếu từ vựng < 70% (dù ngữ pháp xong hết)', () => {
    const learned = new Set(['apple']) // 1/4 = 25%
    expect(isExamEligible(A1, BY_ID, learned, A1_ALL_GRAMMAR_DONE)).toBe(false)
  })

  it('CHƯA đủ nếu ngữ pháp chưa xong hết (dù từ vựng đủ)', () => {
    const learned = new Set(['apple', 'banana', 'cat'])
    expect(isExamEligible(A1, BY_ID, learned, new Set(['g1', 'g2']))).toBe(false) // thiếu g3
  })
})

describe('computeLockedMap — mở khóa cấp sau khi THI ĐẠT cấp trước', () => {
  it('A1 luôn mở; A2 khóa khi chưa thi đạt A1', () => {
    const map = computeLockedMap([A1, A2], new Set())
    expect(map.get('A1')).toBe(false)
    expect(map.get('A2')).toBe(true)
  })

  it('A2 mở khi A1 đã thi đạt', () => {
    const map = computeLockedMap([A1, A2], new Set(['A1']))
    expect(map.get('A2')).toBe(false)
  })
})

// [SỬA CÓ CHỦ ĐÍCH — GĐ2a, 2026-09-12, đặc tả docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md]
// Nhóm test cũ kiểm `computeLockedMapPersisted` + `persistUnlockedLevels`: client TỰ TÍNH quyền
// mở cấp rồi GHI vào `et_cefr_unlocked_*` và đẩy lên server. Đó chính là lỗ hổng đợt này vá —
// server ghi hộ mà không kiểm chứng, sửa localStorage là mở được mọi cấp. Hai hàm đó đã bị XOÁ.
// Thay bằng `computeLockedMapFromServer`: chỉ ĐỌC danh sách server cấp (bộ đệm `et_cefr_unlocked_*`
// do progressSync ghi từ response). Grandfather chuyển sang cột DB `cefr_unlocked_grandfathered`
// (migration 0077) nên bất biến "không ai mất quyền đã có" vẫn giữ, chỉ đổi chỗ thi hành.
describe('computeLockedMapFromServer — đọc quyền mở cấp do SERVER cấp', () => {
  it('có danh sách server → theo đúng danh sách đó, bỏ qua kết quả thi trên máy', () => {
    localStorage.setItem('et_cefr_unlocked_u1', JSON.stringify(['A1', 'A2']))
    // examPassed rỗng nhưng server đã cấp A2 (vd người dùng VIP) → A2 vẫn mở.
    const map = computeLockedMapFromServer('u1', [A1, A2], new Set())
    expect(map.get('A1')).toBe(false)
    expect(map.get('A2')).toBe(false)
  })

  it('server CHỈ cấp A1 → A2 khoá, dù localStorage cũ từng ghi là đã thi đạt A1', () => {
    localStorage.setItem('et_cefr_unlocked_u1', JSON.stringify(['A1']))
    const map = computeLockedMapFromServer('u1', [A1, A2], new Set(['A1']))
    expect(map.get('A2')).toBe(true) // server là nguồn sự thật, không phải máy người dùng
  })

  it('chưa có bộ đệm (lần đầu mở app / offline) → tạm dùng luật sống để hiển thị', () => {
    const map = computeLockedMapFromServer('u1', [A1, A2], new Set(['A1']))
    expect(map.get('A2')).toBe(false)
  })

  it('THUẦN: không ghi gì vào localStorage', () => {
    computeLockedMapFromServer('u1', [A1, A2], new Set(['A1']))
    expect(localStorage.getItem('et_cefr_unlocked_u1')).toBeNull()
    expect(getUnlockedLevels('u1').size).toBe(0)
  })
})

describe('findNextStep — xen kẽ từ vựng ↔ ngữ pháp trong 1 unit, theo unit', () => {
  it('chưa học gì → vòng từ vựng đầu tiên của unit 1', () => {
    const step = findNextStep(A1, BY_ID, new Set(), new Set())
    expect(step).toMatchObject({ unitIndex: 0, kind: 'vocab', circleId: 'c1' })
  })

  it('xong vòng từ vựng đầu (chỉ 1 vòng trong unit) → sang ngữ pháp bài 1', () => {
    const step = findNextStep(A1, BY_ID, new Set(['apple', 'banana']), new Set())
    expect(step).toMatchObject({ unitIndex: 0, kind: 'grammar', lessonId: 'g1' })
  })

  it('xong cả unit 1 → sang unit 2', () => {
    const learned = new Set(['apple', 'banana'])
    const done = new Set(['g1', 'g2'])
    const step = findNextStep(A1, BY_ID, learned, done)
    expect(step).toMatchObject({ unitIndex: 1, kind: 'vocab', circleId: 'c2' })
  })

  it('hoàn thành hết → null', () => {
    const learned = new Set(['apple', 'banana', 'cat', 'dog'])
    const done = new Set(['g1', 'g2', 'g3'])
    expect(findNextStep(A1, BY_ID, learned, done)).toBeNull()
  })

  it('unit có NHIỀU vòng từ vựng: xen kẽ vòng 1 → bài 1 → vòng 2 → bài 2 (không bắt xong hết từ vựng mới tới ngữ pháp)', () => {
    const byId: Record<string, Circle> = {
      cA: circle('cA', ['apple']),
      cB: circle('cB', ['banana']),
    }
    const multi = level('A1', [unit('u1', ['g1', 'g2'], ['cA', 'cB'])])

    // Chưa học gì → vòng cA trước (thứ tự j=0)
    expect(findNextStep(multi, byId, new Set(), new Set())).toMatchObject({
      kind: 'vocab',
      circleId: 'cA',
    })

    // Xong vòng cA → sang bài g1 (KHÔNG nhảy thẳng qua vòng cB — đúng interleaving)
    expect(findNextStep(multi, byId, new Set(['apple']), new Set())).toMatchObject({
      kind: 'grammar',
      lessonId: 'g1',
    })

    // Xong cA + g1 → tới vòng cB (thứ tự j=1)
    expect(findNextStep(multi, byId, new Set(['apple']), new Set(['g1']))).toMatchObject({
      kind: 'vocab',
      circleId: 'cB',
    })

    // Xong cA + cB + g1 → tới bài g2
    expect(findNextStep(multi, byId, new Set(['apple', 'banana']), new Set(['g1']))).toMatchObject({
      kind: 'grammar',
      lessonId: 'g2',
    })
  })
})

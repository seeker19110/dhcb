// Test logic chấm eval gia sư (thuần, KHÔNG gọi API). Cũng canh golden set luôn hợp lệ.
import { describe, it, expect } from 'vitest'
import goldenSet from '../eval-tutor-fixtures.json'
import extraGoldenSet from '../eval-tutor-fixtures-extra.json'
import {
  parseChatFeedback,
  parseSpeakingReply,
  extractFeedback,
  hasVietnamese,
  classifyOutcome,
  typeHit,
  scoreOne,
  summarize,
  parseFixtures,
  ERROR_TYPES,
  type Fixture,
  type EvalResult,
} from './evalScoring'

describe('parseChatFeedback', () => {
  it('tách 💬 speech và ✅ Nhận xét (chiều A)', () => {
    const r = parseChatFeedback('💬 How are you?\n✅ Nhận xét: Câu "I go" nên là "I went".')
    expect(r.speech).toBe('How are you?')
    expect(r.feedback).toBe('Câu "I go" nên là "I went".')
  })
  it('không có ✅ → feedback rỗng', () => {
    expect(parseChatFeedback('💬 Great job! Keep going.').feedback).toBe('')
  })
  it('feedback nhiều dòng + nhãn "Feedback:" (chiều B)', () => {
    const r = parseChatFeedback('💬 Xin chào!\n✅ Feedback: line one\nline two')
    expect(r.feedback).toBe('line one\nline two')
  })
  it('nhãn không dấu "Nhan xet"', () => {
    expect(parseChatFeedback('💬 Hi\n✅ Nhan xet: co loi').feedback).toBe('co loi')
  })
})

describe('parseSpeakingReply', () => {
  it('JSON hợp lệ đủ 3 khoá', () => {
    const { jsonValid, reply } = parseSpeakingReply(
      '{"speech":"Hello","feedback":"Thiếu chữ s","corrected":"She goes"}',
    )
    expect(jsonValid).toBe(true)
    expect(reply?.feedback).toBe('Thiếu chữ s')
  })
  it('JSON bọc trong ```json fence vẫn parse được', () => {
    const { jsonValid } = parseSpeakingReply(
      '```json\n{"speech":"a","feedback":"","corrected":""}\n```',
    )
    expect(jsonValid).toBe(true)
  })
  it('không phải JSON → jsonValid false', () => {
    expect(parseSpeakingReply('xin chào, đây không phải JSON').jsonValid).toBe(false)
  })
  it('thiếu khoá corrected → jsonValid false', () => {
    expect(parseSpeakingReply('{"speech":"a","feedback":"b"}').jsonValid).toBe(false)
  })
})

describe('extractFeedback', () => {
  it('mode chat lấy phần ✅', () => {
    const e = extractFeedback('chat', '💬 Hi\n✅ Nhận xét: sai thì')
    expect(e.feedback).toBe('sai thì')
    expect(e.jsonValid).toBeNull()
  })
  it('mode speaking lấy field feedback + jsonValid', () => {
    const e = extractFeedback('speaking', '{"speech":"a","feedback":"lỗi","corrected":"b"}')
    expect(e.feedback).toBe('lỗi')
    expect(e.jsonValid).toBe(true)
  })
  it('mode speaking JSON hỏng → feedback rỗng, jsonValid false', () => {
    const e = extractFeedback('speaking', 'not json')
    expect(e.feedback).toBe('')
    expect(e.jsonValid).toBe(false)
  })
})

describe('hasVietnamese', () => {
  it('nhận diện chữ có dấu', () => {
    expect(hasVietnamese('Bạn thêm chữ "s" nhé')).toBe(true)
  })
  it('tiếng Anh thuần → false', () => {
    expect(hasVietnamese('You should add s here')).toBe(false)
  })
})

describe('classifyOutcome', () => {
  it('có lỗi + phát hiện = TP', () => expect(classifyOutcome(true, true)).toBe('TP'))
  it('có lỗi + bỏ sót = FN', () => expect(classifyOutcome(true, false)).toBe('FN'))
  it('câu đúng + bịa lỗi = FP', () => expect(classifyOutcome(false, true)).toBe('FP'))
  it('câu đúng + im lặng = TN', () => expect(classifyOutcome(false, false)).toBe('TN'))
})

describe('typeHit', () => {
  it('feedback nhắc đúng loại → true', () => {
    expect(typeHit('Bạn quên chia ngôi thứ ba số ít', ['third_person_s'])).toBe(true)
  })
  it('expected rỗng → false', () => {
    expect(typeHit('bất kỳ', [])).toBe(false)
  })
  it('feedback rỗng → false', () => {
    expect(typeHit('', ['tense'])).toBe(false)
  })
})

describe('scoreOne', () => {
  const errFixture: Fixture = {
    id: 'x1',
    input: 'She go to school.',
    kind: 'error',
    expectedErrors: ['third_person_s'],
    level: 'beginner',
    dir: 'A',
  }
  const okFixture: Fixture = {
    id: 'x2',
    input: 'She goes to school.',
    kind: 'correct',
    expectedErrors: [],
    level: 'beginner',
    dir: 'A',
  }
  it('câu lỗi + AI báo lỗi tiếng Việt = TP, feedbackVi', () => {
    const r = scoreOne('chat', errFixture, '💬 Nice.\n✅ Nhận xét: Bạn quên "s" ở ngôi thứ ba.')
    expect(r.outcome).toBe('TP')
    expect(r.feedbackVi).toBe(true)
    expect(r.typeHit).toBe(true)
  })
  it('câu lỗi + AI im lặng = FN', () => {
    const r = scoreOne('chat', errFixture, '💬 Great, keep going!')
    expect(r.outcome).toBe('FN')
    expect(r.feedbackNonEmpty).toBe(false)
  })
  it('câu đúng + AI bịa lỗi = FP', () => {
    const r = scoreOne('chat', okFixture, '💬 Ok\n✅ Nhận xét: nên nói khác đi')
    expect(r.outcome).toBe('FP')
  })
  it('câu đúng + AI im lặng = TN', () => {
    expect(scoreOne('chat', okFixture, '💬 Perfect!').outcome).toBe('TN')
  })
})

describe('summarize', () => {
  const mk = (o: EvalResult['outcome'], extra: Partial<EvalResult> = {}): EvalResult => ({
    id: Math.random().toString(),
    kind: o === 'TP' || o === 'FN' ? 'error' : 'correct',
    expectedErrors: [],
    outcome: o,
    feedbackNonEmpty: o === 'TP' || o === 'FP',
    feedbackVi: o === 'TP' || o === 'FP',
    jsonValid: null,
    typeHit: false,
    ...extra,
  })
  it('tính recall/precision/FP-rate đúng', () => {
    const s = summarize([mk('TP'), mk('TP'), mk('FN'), mk('TN'), mk('FP')])
    expect(s.tp).toBe(2)
    expect(s.recall).toBeCloseTo(2 / 3)
    expect(s.precision).toBeCloseTo(2 / 3)
    expect(s.falsePositiveRate).toBeCloseTo(1 / 2)
  })
  it('loại câu provider lỗi khỏi metric', () => {
    const s = summarize([mk('TP'), mk('TN', { providerError: 'timeout' })])
    expect(s.scored).toBe(1)
    expect(s.providerErrors).toBe(1)
  })
  it('mẫu số 0 → null (không chia cho 0)', () => {
    const s = summarize([mk('TN')])
    expect(s.recall).toBeNull()
    expect(s.jsonValidRate).toBeNull()
  })
})

describe('parseFixtures', () => {
  it('trùng id → ném lỗi', () => {
    const dup = [
      { id: 'a', input: 'x', kind: 'error', expectedErrors: ['tense'], level: 'beginner' },
      { id: 'a', input: 'y', kind: 'error', expectedErrors: ['tense'], level: 'beginner' },
    ]
    expect(() => parseFixtures(dup)).toThrow(/trùng id/)
  })
  it('kind=error nhưng expectedErrors rỗng → ném lỗi', () => {
    const bad = [{ id: 'a', input: 'x', kind: 'error', expectedErrors: [], level: 'beginner' }]
    expect(() => parseFixtures(bad)).toThrow(/expectedErrors rỗng/)
  })
  it('kind=correct nhưng có expectedErrors → ném lỗi', () => {
    const bad = [
      { id: 'a', input: 'x', kind: 'correct', expectedErrors: ['tense'], level: 'beginner' },
    ]
    expect(() => parseFixtures(bad)).toThrow(/lại có expectedErrors/)
  })
})

describe('golden set thật (eval-tutor-fixtures.json)', () => {
  const fixtures = parseFixtures(goldenSet)
  it('có ≥ 55 câu', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(55)
  })
  it('phủ đủ mọi loại lỗi trong ERROR_TYPES (bộ cũ + bộ mở rộng chiều B)', () => {
    const covered = new Set(
      parseFixtures([...goldenSet, ...extraGoldenSet]).flatMap((f) => f.expectedErrors),
    )
    for (const t of ERROR_TYPES) expect(covered.has(t)).toBe(true)
  })
  it('có cả câu đúng và ca biên (đo bịa lỗi)', () => {
    expect(fixtures.some((f) => f.kind === 'correct')).toBe(true)
    expect(fixtures.some((f) => f.kind === 'edge')).toBe(true)
  })
})

// S05 — test bất biến của bộ tạo câu điền từ (đặc tả §4 "AC và negative cases").
import { describe, expect, it } from 'vitest'
import type { DictEntry } from '../../../types'
import {
  BLANK_MARKER,
  FILL_BLANK_REASONS,
  blankedSentence,
  buildFillBlankQuestions,
  checkQuestionInvariants,
  findSpans,
  foldLabel,
  fnvRank,
  type FillBlankQuestion,
} from './fillBlankQuestions'

const e = (
  word: string,
  vi: string,
  ex_en: string,
  ex_vi: string,
  extra: Partial<DictEntry> = {},
) => ({ word, vi, pos: 'n', ex_en, ex_vi, ...extra }) as DictEntry

// Ba entry "đệm" luôn hợp lệ để có đủ distractor.
const fillers = [
  e('apple', 'quả táo', 'An apple a day.', 'Một quả táo mỗi ngày.'),
  e('river', 'dòng sông', 'The river is long.', 'Dòng sông rất dài.'),
  e('window', 'cửa sổ', 'Open the window.', 'Mở cửa sổ ra.'),
]

function only(entry: unknown, direction: 'A' | 'B' = 'A') {
  const result = buildFillBlankQuestions([entry, ...fillers], direction, { seed: 't' })
  return {
    result,
    q: result.questions.find((x) => x.ref === 'pool#0'),
    reason: result.rejections.find((r) => r.ref === 'pool#0')?.reason,
  }
}

function assertInvariants(q: FillBlankQuestion) {
  const c = checkQuestionInvariants(q)
  expect(c).toEqual({
    spanBoundary: true,
    roundTrip: true,
    uniqueLabels: true,
    uniqueIds: true,
    correctIdCount: 1,
    correctLabel: true,
  })
  expect(q.sentence.slice(q.span.start, q.span.end)).toBe(q.answer)
  expect(q.options).toHaveLength(4)
}

describe('findSpans — ranh giới Unicode', () => {
  it('không khớp từ con: he trong the, an trong banana', () => {
    expect(findSpans('the banana', 'he')).toEqual([])
    expect(findSpans('the banana', 'an')).toEqual([])
    expect(findSpans('He said', 'he')).toEqual([{ start: 0, end: 2 }])
  })
  it('dấu tiếng Việt là chữ: "hoa" không khớp trong "hoà"', () => {
    expect(findSpans('Cây hoà bình', 'hoa')).toEqual([])
    expect(findSpans('Bông hoa đỏ.', 'hoa')).toEqual([{ start: 5, end: 8 }])
  })
  it('ký tự đặc biệt regex được coi là chữ thường', () => {
    expect(findSpans('Meet at 9 a.m. sharp', 'a.m.')).toEqual([{ start: 10, end: 14 }])
    expect(findSpans('I use C++ daily', 'c++')).toEqual([{ start: 6, end: 9 }])
  })
  it('offset không lệch khi lowercase đổi độ dài (İ)', () => {
    const s = 'İİ cat'
    expect('İ'.toLowerCase().length).toBe(2)
    expect(findSpans(s, 'cat')).toEqual([{ start: 3, end: 6 }])
  })
})

describe('buildFillBlankQuestions — chiều A', () => {
  it('khớp hoa thường, giữ nguyên dạng trong câu', () => {
    const { q } = only(e('hello', 'xin chào', 'Hello, my friend!', 'Xin chào, bạn tôi!'))
    expect(q?.answer).toBe('Hello')
    expect(blankedSentence(q!)).toBe(`${BLANK_MARKER}, my friend!`)
    assertInvariants(q!)
  })
  it('từ biến hình: đáp án là dạng xuất hiện (went), đánh dấu formOnly', () => {
    const { q } = only(
      e('go', 'đi', 'She went home.', 'Cô ấy đã về nhà.', {
        pos: 'v',
        forms: { past: 'went', pastPart: 'gone', v3s: 'goes', ving: 'going' },
      }),
    )
    expect(q?.answer).toBe('went')
    expect(q?.formOnly).toBe(true)
    assertInvariants(q!)
  })
  it('bỏ cờ boolean của forms, không ép thành chữ', () => {
    const { q } = only(
      e('rice', 'gạo', 'I cook rice.', 'Tôi nấu cơm.', {
        forms: { uncountable: true, irregular: true },
      }),
    )
    expect(q?.answer).toBe('rice')
    expect(q?.formOnly).toBe(false)
  })
  it('nhiều vị trí → multiple_spans; form trùng headword không tính hai lần', () => {
    expect(only(e('cat', 'mèo', 'A cat sees a cat.', 'Mèo.')).reason).toBe('multiple_spans')
    const same = only(e('sheep', 'cừu', 'One sheep.', 'Cừu.', { forms: { plural: 'sheep' } }))
    expect(same.q?.answer).toBe('sheep')
  })
  it('hai span chồng lấn khác nhau là mơ hồ', () => {
    // "ice" và "ice cream" (form giả định) chồng lấn ở cùng vị trí bắt đầu.
    const r = only(e('ice', 'đá', 'I like ice cream.', 'Kem.', { forms: { plural: 'ice cream' } }))
    expect(r.reason).toBe('multiple_spans')
  })
  it('không khớp / thiếu câu / đáp án rỗng / entry lỗi', () => {
    expect(only(e('dog', 'chó', 'I have a puppy.', 'Chó con.')).reason).toBe('no_match')
    expect(only(e('dog', 'chó', '   ', 'Chó.')).reason).toBe('missing_sentence')
    expect(only(e('  ', 'chó', 'A dog.', 'Chó.')).reason).toBe('empty_target')
    expect(only({ word: 3, vi: 'x' }).reason).toBe('invalid_entry')
    expect(only(null).reason).toBe('invalid_entry')
  })
  it('câu gốc có sẵn gạch dưới vẫn khôi phục đúng theo span', () => {
    const { q } = only(e('name', 'tên', 'Write your name on _____ line.', 'Tên.'))
    expect(q?.prefix + q!.answer + q!.suffix).toBe('Write your name on _____ line.')
    assertInvariants(q!)
  })
  it('NFD được chuẩn hoá NFC trước khi tính offset', () => {
    const nfd = 'Café time.'.normalize('NFD')
    const { q } = only(e('café'.normalize('NFD'), 'cà phê', nfd, 'Cà phê.'))
    expect(q?.sentence).toBe('Café time.'.normalize('NFC'))
    expect(q?.answer).toBe('Café'.normalize('NFC'))
    assertInvariants(q!)
  })
})

describe('buildFillBlankQuestions — chiều B', () => {
  it('khớp nguyên cụm có dấu, không phân biệt hoa thường', () => {
    const { q } = only(e('hello', 'xin chào', 'Hello.', 'Xin chào, bạn khỏe không?'), 'B')
    expect(q?.answer).toBe('Xin chào')
    expect(q?.targetLang).toBe('vi')
    assertInvariants(q!)
  })
  it('nghĩa có dấu phẩy không bị tự tách → no_match', () => {
    const r = only(e('amazed', 'kinh ngạc, sửng sốt', 'I was amazed.', 'Tôi rất kinh ngạc.'), 'B')
    expect(r.reason).toBe('no_match')
  })
})

describe('options và distractor', () => {
  it('distractor khử trùng theo trim/NFC/lowercase và loại form của entry nguồn', () => {
    const pool = [
      e('go', 'đi', 'They go now.', 'Đi.', { forms: { past: 'went' } }),
      e('Went', 'x1', 'x', 'x'),
      e('apple', 'y1', 'x', 'x'),
      e('APPLE ', 'y2', 'x', 'x'),
      e('river', 'y3', 'x', 'x'),
      e('lake', 'y4', 'x', 'x'),
    ]
    const r = buildFillBlankQuestions(pool, 'A', { seed: 's' })
    const q = r.questions.find((x) => x.ref === 'pool#0')!
    // "Went" là form của nguồn → loại; "apple"/"APPLE " trùng khoá → chỉ một.
    expect(q.options.map((o) => foldLabel(o.label)).sort()).toEqual([
      'apple',
      'go',
      'lake',
      'river',
    ])
  })
  it('không đủ 3 distractor khác nhau → insufficient_distractors', () => {
    const pool = [
      e('cat', 'mèo', 'A cat.', 'Mèo.'),
      e('dog', 'chó', 'x', 'x'),
      e('DOG', 'chó', 'x', 'x'),
      e('cat', 'mèo', 'x', 'x'),
    ]
    const r = buildFillBlankQuestions(pool, 'A')
    expect(r.rejections.find((x) => x.ref === 'pool#0')?.reason).toBe('insufficient_distractors')
  })
  it('xác định: cùng seed → cùng options; id theo ref+direction', () => {
    const pool = [e('cat', 'mèo', 'A cat.', 'Con mèo.'), ...fillers, e('bird', 'chim', 'x', 'x')]
    const a = buildFillBlankQuestions(pool, 'A', { seed: 'k' })
    const b = buildFillBlankQuestions([...pool], 'A', { seed: 'k' })
    expect(a).toEqual(b)
    const q = a.questions[0]!
    expect(q.correctOptionId).toBe('A:pool#0:correct')
    expect(q.options.every((o) => o.id.startsWith('A:pool#0:'))).toBe(true)
  })
  it('rank tiêm vào được dùng cho cả distractor lẫn thứ tự options', () => {
    const calls: string[] = []
    buildFillBlankQuestions([e('cat', 'mèo', 'A cat.', 'x'), ...fillers], 'A', {
      seed: 'z',
      rank: (k) => {
        calls.push(k)
        return fnvRank(k)
      },
    })
    expect(calls.some((k) => k.includes('"option"'))).toBe(true)
    expect(JSON.parse(calls[0]!)).toEqual(['s05-v1', 'z', 'A', 'pool#0', 'pool#1'])
  })
})

describe('thống kê', () => {
  it('mỗi entry đúng một lý do: total = accepted + tổng loại; lọc không phụ thuộc thứ tự', () => {
    const pool = [
      null,
      e('dog', 'chó', '', ''),
      e('cat', 'mèo', 'A cat sees a cat.', 'x'),
      e('fox', 'cáo', 'No match here.', 'x'),
      ...fillers,
    ]
    const r = buildFillBlankQuestions(pool, 'A')
    const sum = FILL_BLANK_REASONS.reduce((n, k) => n + r.counts[k], 0)
    expect(r.total).toBe(pool.length)
    expect(r.counts.accepted + sum).toBe(pool.length)
    expect(r.counts.accepted).toBe(3)
    expect(r.questions).toHaveLength(3)
    for (const q of r.questions) assertInvariants(q)
  })
  it('refs khác độ dài pool bị từ chối', () => {
    expect(() => buildFillBlankQuestions([fillers[0]], 'A', { refs: [] })).toThrow()
  })
})

describe('giới hạn dựng câu trong phiên học', () => {
  it('chỉ xếp hạng distractor cho số câu cần dùng, vẫn quét qua câu lỗi', () => {
    const pool = [
      null,
      ...Array.from({ length: 1000 }, (_, i) =>
        e(`word${i}`, `từ${i}`, `A word${i} here.`, `Một từ${i}.`),
      ),
    ]
    let ranks = 0
    const result = buildFillBlankQuestions(pool, 'A', {
      maxQuestions: 10,
      rank: (key) => {
        ranks++
        return fnvRank(key)
      },
    })
    expect(result.questions).toHaveLength(10)
    expect(result.total).toBe(11)
    expect(ranks).toBeLessThan(11_000)
    result.questions.forEach(assertInvariants)
  })
  it('audit không giới hạn vẫn kiểm đủ pool; giới hạn rỗng không tạo câu', () => {
    expect(buildFillBlankQuestions(fillers, 'A').total).toBe(fillers.length)
    expect(buildFillBlankQuestions(fillers, 'A', { maxQuestions: 0 }).total).toBe(0)
    expect(() => buildFillBlankQuestions(fillers, 'A', { maxQuestions: -1 })).toThrow()
  })
})

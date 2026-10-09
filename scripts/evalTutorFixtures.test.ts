// Cổng TĨNH cho golden set của `npm run eval:tutor` (không gọi AI, không tốn phí).
//
// VÌ SAO: bộ 62 câu cũ có mẫu số nhóm "câu đúng/ca biên" chỉ 18 → một câu đổi phán đoán làm
// FP-rate nhảy 5,6 điểm (PROGRESS.md, nợ 2026-08-26). Bộ mở rộng (eval-tutor-fixtures-extra.json)
// nâng lên ≥ 150 câu, và test này canh để nó KHÔNG xuống cấp âm thầm: đủ số lượng từng nhóm,
// không trùng câu, mọi câu mang đủ bằng chứng đối chiếu, hai chiều A/B cân bằng.
import { describe, it, expect } from 'vitest'
import baseSet from './eval-tutor-fixtures.json'
import extraSet from './eval-tutor-fixtures-extra.json'
import {
  ERROR_TYPES,
  hasVietnamese,
  parseFixtures,
  parseRichFixtures,
  type Fixture,
} from './lib/evalScoring'

const MIN_TOTAL = 150
const MIN_CLEAN = 60 // câu đúng + ca biên
const MIN_PER_ERROR_TYPE = 8
const MAX_DIR_SHARE = 0.6 // mỗi chiều chiếm tối đa 60% (lệch ≤ ±20% quanh mức 50/50 → 40–60%)

const base = parseFixtures(baseSet)
const extra = parseRichFixtures(extraSet)
const all = parseFixtures([...baseSet, ...extraSet])

// Chuẩn hoá để bắt câu trùng dù khác khoảng trắng/hoa thường/dấu câu cuối.
function normalize(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?…]+$/u, '')
    .trim()
}

// Bỏ phần trong ngoặc kép (trích từ tiếng Việt) trước khi kiểm "giải thích bằng tiếng Anh".
function stripQuoted(s: string): string {
  return s.replace(/"[^"]*"/g, '')
}

const KNOWN_REFERENCE =
  /quy tắc chung|Swan|Murphy|Quirk|Carter|Biber|Huddleston|Thompson|Cao Xuân Hạo|Diệp Quang Ban|Nguyễn Tài Cẩn|Hoàng Phê|Nguyễn Lân/i

describe('golden set eval:tutor — quy mô và độ phủ', () => {
  it(`tổng ≥ ${MIN_TOTAL} câu, gộp bộ cũ + bộ mở rộng`, () => {
    expect(all.length).toBe(base.length + extra.length)
    expect(all.length).toBeGreaterThanOrEqual(MIN_TOTAL)
  })

  it(`nhóm câu đúng/ca biên ≥ ${MIN_CLEAN}`, () => {
    const clean = all.filter((f) => f.kind !== 'error')
    expect(clean.length).toBeGreaterThanOrEqual(MIN_CLEAN)
    expect(all.filter((f) => f.kind === 'correct').length).toBeGreaterThanOrEqual(30)
    expect(all.filter((f) => f.kind === 'edge').length).toBeGreaterThanOrEqual(15)
  })

  it.each(ERROR_TYPES.map((t) => [t] as const))(
    `loại lỗi %s có ≥ ${MIN_PER_ERROR_TYPE} câu`,
    (type) => {
      const n = all.filter((f) => f.kind === 'error' && f.expectedErrors.includes(type)).length
      expect(n).toBeGreaterThanOrEqual(MIN_PER_ERROR_TYPE)
    },
  )

  it('mỗi chiều A/B chiếm 40–60% toàn bộ (cân bằng ±20%)', () => {
    const a = all.filter((f) => f.dir === 'A').length
    const b = all.filter((f) => f.dir === 'B').length
    expect(a + b).toBe(all.length)
    expect(a / all.length).toBeLessThanOrEqual(MAX_DIR_SHARE)
    expect(b / all.length).toBeLessThanOrEqual(MAX_DIR_SHARE)
  })

  it('cả hai chiều đều có câu lỗi VÀ câu đúng/ca biên', () => {
    for (const dir of ['A', 'B'] as const) {
      expect(all.filter((f) => f.dir === dir && f.kind === 'error').length).toBeGreaterThanOrEqual(
        30,
      )
      expect(all.filter((f) => f.dir === dir && f.kind !== 'error').length).toBeGreaterThanOrEqual(
        20,
      )
    }
  })

  it('không dồn hết vào trình độ sơ cấp: bộ mở rộng có ≥ 30% câu intermediate/advanced', () => {
    const upper = extra.filter((f) => f.level !== 'beginner').length
    expect(upper / extra.length).toBeGreaterThanOrEqual(0.3)
    expect(extra.filter((f) => f.level === 'advanced').length).toBeGreaterThanOrEqual(5)
  })
})

describe('golden set eval:tutor — toàn vẹn dữ liệu', () => {
  it('id duy nhất trên TOÀN bộ (cũ + mở rộng)', () => {
    expect(new Set(all.map((f) => f.id)).size).toBe(all.length)
  })

  it('không câu nào trùng (chuẩn hoá khoảng trắng, hoa/thường, dấu câu cuối)', () => {
    const seen = new Map<string, string>()
    const dup: string[] = []
    for (const f of all) {
      const key = normalize(f.input)
      const prev = seen.get(key)
      if (prev) dup.push(`${f.id} trùng ${prev}`)
      else seen.set(key, f.id)
    }
    expect(dup).toEqual([])
  })

  it('bản sửa không trùng một câu khác trong bộ (tránh nhầm đáp án thành đề)', () => {
    const inputs = new Set(all.map((f) => normalize(f.input)))
    const clash = extra
      .filter((f) => f.corrected && inputs.has(normalize(f.corrected)))
      .map((f) => f.id)
    expect(clash).toEqual([])
  })

  it('bộ mở rộng: câu có lỗi → bản sửa KHÁC câu gốc; câu đúng → KHÔNG có bản sửa', () => {
    for (const f of extra) {
      if (f.kind === 'error') {
        expect(f.corrected, f.id).toBeTruthy()
        expect(normalize(f.corrected!), f.id).not.toBe(normalize(f.input))
        expect(f.whyCorrect, f.id).toBeUndefined()
      } else {
        expect(f.corrected, f.id).toBeUndefined()
        expect(f.whyCorrect, f.id).toBeTruthy()
      }
    }
  })

  it('bộ mở rộng: mỗi câu có nguồn đối chiếu là sách/ngữ pháp đã biết hoặc "quy tắc chung"', () => {
    for (const f of extra) {
      expect(f.source, f.id).toMatch(KNOWN_REFERENCE)
    }
  })

  it('bộ mở rộng: id có tiền tố theo chiều và bám đúng trường dir', () => {
    for (const f of extra) {
      expect(f.id.startsWith(`x-${f.dir.toLowerCase()}-`), f.id).toBe(true)
    }
  })
})

describe('golden set eval:tutor — ngôn ngữ đúng chiều', () => {
  const errorsOf = (dir: Fixture['dir']): Fixture[] =>
    extra.filter((f) => f.kind === 'error' && f.dir === dir)

  it('chiều A: câu gốc là tiếng Anh (không dấu tiếng Việt), giải thích bằng tiếng Việt', () => {
    for (const f of errorsOf('A')) {
      expect(hasVietnamese(f.input), `${f.id} input`).toBe(false)
      expect(hasVietnamese(f.explanation ?? ''), `${f.id} explanation`).toBe(true)
    }
  })

  it('chiều B: câu gốc là tiếng Việt có dấu, giải thích bằng tiếng Anh (ngoài phần trích dẫn)', () => {
    for (const f of errorsOf('B')) {
      expect(hasVietnamese(f.input), `${f.id} input`).toBe(true)
      expect(hasVietnamese(stripQuoted(f.explanation ?? '')), `${f.id} explanation`).toBe(false)
      expect(hasVietnamese(f.corrected ?? ''), `${f.id} corrected`).toBe(true)
    }
  })

  it('chiều A: câu đúng/ca biên của bộ mở rộng là tiếng Anh', () => {
    for (const f of extra.filter((x) => x.kind !== 'error' && x.dir === 'A')) {
      expect(hasVietnamese(f.input), f.id).toBe(false)
    }
  })

  it('chiều B: câu đúng là tiếng Việt có dấu; chỉ ca biên "không dấu" được phép thiếu dấu', () => {
    const noDiacritics = extra.filter(
      (x) => x.kind !== 'error' && x.dir === 'B' && !hasVietnamese(x.input),
    )
    // Tối đa 3 câu không dấu (đối thoại nhắn nhanh) và bắt buộc là 'edge'.
    expect(noDiacritics.length).toBeLessThanOrEqual(3)
    for (const f of noDiacritics) expect(f.kind, f.id).toBe('edge')
    for (const f of extra.filter((x) => x.kind === 'correct' && x.dir === 'B')) {
      expect(hasVietnamese(f.input), f.id).toBe(true)
    }
  })

  it('loại lỗi riêng chiều B chỉ xuất hiện ở câu chiều B', () => {
    const bOnly = ['tone_mark', 'classifier', 'word_order', 'negation'] as const
    for (const f of all.filter((x) => x.expectedErrors.some((t) => bOnly.includes(t as never)))) {
      expect(f.dir, f.id).toBe('B')
    }
  })
})

describe('parseRichFixtures — chặn fixture thiếu bằng chứng', () => {
  const ok = {
    id: 'z-1',
    input: 'She go home.',
    kind: 'error',
    expectedErrors: ['third_person_s'],
    level: 'beginner',
    dir: 'A',
    corrected: 'She goes home.',
    explanation: 'Thêm -es.',
    source: 'quy tắc chung: ngôi thứ ba số ít thêm -s/-es',
  }
  it('hợp lệ thì qua', () => {
    expect(parseRichFixtures([ok])).toHaveLength(1)
  })
  it('thiếu bản sửa → ném lỗi', () => {
    expect(() => parseRichFixtures([{ ...ok, corrected: undefined }])).toThrow(/corrected/)
  })
  it('thiếu nguồn → ném lỗi', () => {
    expect(() => parseRichFixtures([{ ...ok, source: '' }])).toThrow(/source/)
  })
  it('câu đúng mà có bản sửa → ném lỗi', () => {
    const correct = {
      ...ok,
      kind: 'correct',
      expectedErrors: [],
      whyCorrect: 'Đúng vì…',
    }
    expect(() => parseRichFixtures([correct])).toThrow(/bản sửa/)
  })
  it('câu đúng thiếu whyCorrect → ném lỗi', () => {
    const correct = { ...ok, kind: 'correct', expectedErrors: [], corrected: undefined }
    expect(() => parseRichFixtures([correct])).toThrow(/whyCorrect/)
  })
})

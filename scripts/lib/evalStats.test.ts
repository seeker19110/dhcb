// Test hàm thống kê thuần của `eval:tutor --runs/--group` (KHÔNG gọi AI).
import { describe, it, expect } from 'vitest'
import {
  aggregateGroups,
  aggregateOverall,
  fixtureInGroup,
  isGroupName,
  mean,
  parseGroup,
  parseRuns,
  renderStatsTable,
  sampleStdDev,
  tallyGroups,
  wilsonInterval,
  MAX_RUNS,
} from './evalStats'
import { summarize, type EvalResult } from './evalScoring'

const r = (outcome: EvalResult['outcome'], extra: Partial<EvalResult> = {}): EvalResult => ({
  id: 'x',
  kind: outcome === 'TP' || outcome === 'FN' ? 'error' : 'correct',
  expectedErrors: outcome === 'TP' || outcome === 'FN' ? ['tense'] : [],
  outcome,
  feedbackNonEmpty: outcome === 'TP' || outcome === 'FP',
  feedbackVi: true,
  jsonValid: null,
  typeHit: false,
  ...extra,
})

describe('mean / sampleStdDev', () => {
  it('rỗng → null', () => {
    expect(mean([])).toBeNull()
    expect(sampleStdDev([])).toBeNull()
  })
  it('trung bình đúng', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5)
  })
  it('1 lượt → độ lệch chuẩn 0 (không chia cho 0)', () => {
    expect(sampleStdDev([0.7])).toBe(0)
  })
  it('độ lệch chuẩn MẪU (n−1): [2,4,4,4,5,5,7,9] → sqrt(32/7)', () => {
    expect(sampleStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(Math.sqrt(32 / 7), 10)
  })
  it('các giá trị bằng nhau → 0', () => {
    expect(sampleStdDev([0.5, 0.5, 0.5])).toBe(0)
  })
})

describe('wilsonInterval', () => {
  it('n = 0 → null', () => {
    expect(wilsonInterval(0, 0)).toBeNull()
  })
  it('giá trị tham chiếu: 8/10 → ≈ [0.490, 0.943]', () => {
    const ci = wilsonInterval(8, 10)!
    expect(ci.low).toBeCloseTo(0.4902, 3)
    expect(ci.high).toBeCloseTo(0.9433, 3)
  })
  it('0/60 (không bịa lỗi nào): cận dưới = 0, cận trên ≈ 6% (không phải 0 như Wald)', () => {
    const ci = wilsonInterval(0, 60)!
    expect(ci.low).toBe(0)
    expect(ci.high).toBeCloseTo(0.06, 2)
    expect(ci.high).toBeGreaterThan(0)
  })
  it('n/n: cận trên = 1 (kẹp), cận dưới < 1', () => {
    const ci = wilsonInterval(20, 20)!
    expect(ci.high).toBe(1)
    expect(ci.low).toBeLessThan(1)
  })
  it('luôn nằm trong [0,1] và chứa tỉ lệ quan sát', () => {
    for (const [s, n] of [
      [0, 1],
      [1, 1],
      [3, 7],
      [50, 100],
    ] as const) {
      const ci = wilsonInterval(s, n)!
      expect(ci.low).toBeGreaterThanOrEqual(0)
      expect(ci.high).toBeLessThanOrEqual(1)
      expect(ci.low).toBeLessThanOrEqual(s / n)
      expect(ci.high).toBeGreaterThanOrEqual(s / n)
    }
  })
  it('mẫu càng lớn khoảng càng hẹp (cùng tỉ lệ 10%)', () => {
    const small = wilsonInterval(1, 10)!
    const big = wilsonInterval(10, 100)!
    expect(big.high - big.low).toBeLessThan(small.high - small.low)
  })
  it('đầu vào sai (successes > n, âm, không nguyên) → ném lỗi', () => {
    expect(() => wilsonInterval(5, 3)).toThrow()
    expect(() => wilsonInterval(-1, 3)).toThrow()
    expect(() => wilsonInterval(1.5, 3)).toThrow()
  })
})

describe('parseRuns / parseGroup', () => {
  it('chấp nhận 1..MAX_RUNS', () => {
    expect(parseRuns('1')).toBe(1)
    expect(parseRuns('3')).toBe(3)
    expect(parseRuns(String(MAX_RUNS))).toBe(MAX_RUNS)
  })
  it.each(['0', '-1', '2.5', 'abc', '', String(MAX_RUNS + 1)])('từ chối "%s"', (raw) => {
    expect(() => parseRuns(raw)).toThrow(/--runs/)
  })
  it('--group rỗng = không lọc; tên lạ → ném lỗi liệt kê tên hợp lệ', () => {
    expect(parseGroup('')).toBeNull()
    expect(parseGroup('tense')).toBe('tense')
    expect(parseGroup('clean')).toBe('clean')
    expect(() => parseGroup('tenses')).toThrow(/tense/)
  })
  it('isGroupName nhận loại lỗi mới của chiều B', () => {
    for (const g of ['tone_mark', 'classifier', 'word_order', 'negation', 'A', 'B', 'edge']) {
      expect(isGroupName(g)).toBe(true)
    }
    expect(isGroupName('nonsense')).toBe(false)
  })
})

describe('fixtureInGroup', () => {
  type Key = Parameters<typeof fixtureInGroup>[0]
  const err: Key = { kind: 'error', expectedErrors: ['tense', 'missing_be'], dir: 'A' }
  const ok: Key = { kind: 'correct', expectedErrors: [], dir: 'B' }
  const edge: Key = { kind: 'edge', expectedErrors: [], dir: 'A' }
  it('theo loại lỗi (câu nhiều lỗi thuộc cả hai nhóm)', () => {
    expect(fixtureInGroup(err, 'tense')).toBe(true)
    expect(fixtureInGroup(err, 'missing_be')).toBe(true)
    expect(fixtureInGroup(err, 'article')).toBe(false)
  })
  it('theo kind', () => {
    expect(fixtureInGroup(err, 'error')).toBe(true)
    expect(fixtureInGroup(ok, 'correct')).toBe(true)
    expect(fixtureInGroup(edge, 'edge')).toBe(true)
    expect(fixtureInGroup(ok, 'edge')).toBe(false)
  })
  it('clean = correct + edge, không có error', () => {
    expect(fixtureInGroup(ok, 'clean')).toBe(true)
    expect(fixtureInGroup(edge, 'clean')).toBe(true)
    expect(fixtureInGroup(err, 'clean')).toBe(false)
  })
  it('theo chiều', () => {
    expect(fixtureInGroup(err, 'A')).toBe(true)
    expect(fixtureInGroup(ok, 'A')).toBe(false)
    expect(fixtureInGroup(ok, 'B')).toBe(true)
  })
})

describe('tallyGroups / aggregateGroups', () => {
  const run1 = [r('TP'), r('TP'), r('FN'), r('TN'), r('FP')]
  const run2 = [r('TP'), r('FN'), r('FN'), r('TN'), r('TN')]

  it('recall nhóm tense = TP / (câu có tense); FP-rate nhóm clean = FP / câu sạch', () => {
    const t = tallyGroups(run1)
    expect(t.find((x) => x.group === 'tense')).toMatchObject({ n: 3, hits: 2, metric: 'recall' })
    expect(t.find((x) => x.group === 'clean')).toMatchObject({ n: 2, hits: 1, metric: 'fpRate' })
    expect(t.find((x) => x.group === 'article')).toMatchObject({ n: 0, hits: 0 })
  })

  it('bỏ qua câu lỗi provider', () => {
    const t = tallyGroups([r('TP'), r('FN', { providerError: '429' })])
    expect(t.find((x) => x.group === 'error')).toMatchObject({ n: 1, hits: 1 })
  })

  it('gộp hai lượt: trung bình, SD mẫu và Wilson trên số gộp', () => {
    const rows = aggregateGroups([run1, run2])
    const tense = rows.find((x) => x.group === 'tense')!
    // lượt 1 = 2/3, lượt 2 = 1/3 → trung bình 0.5, SD mẫu = |2/3 − 1/3| / √2
    expect(tense.mean).toBeCloseTo(0.5, 10)
    expect(tense.sd).toBeCloseTo(1 / 3 / Math.SQRT2, 10)
    expect(tense.hits).toBe(3)
    expect(tense.trials).toBe(6)
    expect(tense.ci).toEqual(wilsonInterval(3, 6))
    expect(tense.runs).toBe(2)
  })

  it('nhóm không có câu nào → mean null, trials 0, ci null', () => {
    const art = aggregateGroups([run1, run2]).find((x) => x.group === 'article')!
    expect(art.mean).toBeNull()
    expect(art.trials).toBe(0)
    expect(art.ci).toBeNull()
  })

  it('1 lượt duy nhất → SD = 0', () => {
    const row = aggregateGroups([run1]).find((x) => x.group === 'error')!
    expect(row.sd).toBe(0)
  })
})

describe('aggregateOverall + renderStatsTable', () => {
  it('khớp summarize: recall/precision/FP-rate của từng lượt', () => {
    const s1 = summarize([r('TP'), r('TP'), r('FN'), r('TN'), r('FP')])
    const s2 = summarize([r('TP'), r('FN'), r('TN'), r('TN'), r('TN')])
    const [recall, precision, fpRate] = aggregateOverall([s1, s2])
    expect(recall!.mean).toBeCloseTo((2 / 3 + 1 / 2) / 2, 10)
    expect(precision!.mean).toBeCloseTo((2 / 3 + 1) / 2, 10)
    expect(fpRate!.mean).toBeCloseTo((1 / 2 + 0) / 2, 10)
    expect(fpRate!.hits).toBe(1)
    expect(fpRate!.trials).toBe(5)
  })

  it('bảng markdown: bỏ nhóm rỗng, có định dạng trung bình ± SD và khoảng Wilson', () => {
    const md = renderStatsTable(
      aggregateGroups([
        [r('TP'), r('FN'), r('TN'), r('FP')],
        [r('TP'), r('TP'), r('TN'), r('TN')],
      ]),
    )
    expect(md).toContain('| Nhóm | Chỉ số |')
    expect(md).toMatch(/\| tense \| Recall \| 2 \| 75\.0% ± 35\.4 \|/)
    expect(md).toMatch(/\| clean \| FP-rate \| 2 \| 25\.0% ± 35\.4 \|/)
    expect(md).not.toContain('| article |')
  })
})

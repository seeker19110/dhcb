// scripts/lib/evalStats.ts — THỐNG KÊ THUẦN cho `npm run eval:tutor -- --runs N` (không gọi AI).
//
// VÌ SAO: LLM lấy mẫu ngẫu nhiên nên một lượt chạy chỉ là MỘT mẫu (xem "DẢI NHIỄU" cuối
// docs/research/eval-tutor-baseline.md). Chạy N lượt rồi báo trung bình ± độ lệch chuẩn giữa các
// lượt + khoảng tin cậy Wilson thì mới phân biệt được "prompt tệ đi" với "nhiễu lấy mẫu".
// Tách khỏi eval-tutor.ts để test được mà không tốn tiền API.

import { ERROR_TYPES, type EvalResult, type Fixture, type Summary } from './evalScoring.ts'

// ─── Nhóm câu (cho --group và bảng thống kê) ────────────────────────────────────
// Nhóm lỗi = từng loại lỗi (đo recall) · 'error' = mọi câu lỗi · 'correct'/'edge'/'clean' = câu
// ĐÚNG hoặc ca biên (đo FP-rate = bịa lỗi) · 'A'/'B' = lọc theo chiều học.
export const GROUP_NAMES = [...ERROR_TYPES, 'error', 'correct', 'edge', 'clean', 'A', 'B'] as const
export type GroupName = (typeof GROUP_NAMES)[number]

export function isGroupName(x: string): x is GroupName {
  return (GROUP_NAMES as readonly string[]).includes(x)
}

type GroupKey = Pick<Fixture, 'kind' | 'expectedErrors' | 'dir'>

export function fixtureInGroup(f: GroupKey, group: GroupName): boolean {
  switch (group) {
    case 'error':
    case 'correct':
    case 'edge':
      return f.kind === group
    case 'clean':
      return f.kind !== 'error'
    case 'A':
    case 'B':
      return f.dir === group
    default:
      return f.expectedErrors.includes(group)
  }
}

// ─── Đọc tham số dòng lệnh (thuần để test) ──────────────────────────────────────
export const MAX_RUNS = 20

export function parseRuns(raw: string): number {
  if (!/^\d+$/.test(raw)) throw new Error(`--runs phải là số nguyên dương, nhận "${raw}"`)
  const n = Number(raw)
  if (n < 1 || n > MAX_RUNS) throw new Error(`--runs phải nằm trong 1..${MAX_RUNS}, nhận ${n}`)
  return n
}

export function parseGroup(raw: string): GroupName | null {
  if (raw === '') return null
  if (!isGroupName(raw)) {
    throw new Error(`--group không hợp lệ: "${raw}" (cho phép: ${GROUP_NAMES.join(' | ')})`)
  }
  return raw
}

// ─── Thống kê cơ bản ────────────────────────────────────────────────────────────
export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

// Độ lệch chuẩn MẪU (chia n−1): các lượt chạy là mẫu của một quá trình ngẫu nhiên. 1 lượt → 0.
export function sampleStdDev(xs: number[]): number | null {
  if (xs.length === 0) return null
  if (xs.length === 1) return 0
  const m = mean(xs)!
  const ss = xs.reduce((a, x) => a + (x - m) ** 2, 0)
  return Math.sqrt(ss / (xs.length - 1))
}

const Z_95 = 1.959964

export interface Interval {
  low: number
  high: number
}

// Khoảng tin cậy nhị thức Wilson — tốt hơn "p ± z·sqrt(p(1−p)/n)" khi n nhỏ hoặc p sát 0/1
// (đúng ca của FP-rate: vài chục câu đúng, tỉ lệ gần 0).
export function wilsonInterval(successes: number, n: number, z: number = Z_95): Interval | null {
  if (n <= 0) return null
  if (!Number.isInteger(successes) || !Number.isInteger(n) || successes < 0 || successes > n) {
    throw new Error(`wilsonInterval: successes=${successes} không hợp lệ với n=${n}`)
  }
  const p = successes / n
  const z2 = z * z
  const denom = 1 + z2 / n
  const centre = (p + z2 / (2 * n)) / denom
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom
  return { low: Math.max(0, centre - half), high: Math.min(1, centre + half) }
}

// ─── Gộp kết quả theo nhóm, qua nhiều lượt ───────────────────────────────────────
export type MetricKind = 'recall' | 'fpRate'

export interface GroupTally {
  group: string
  metric: MetricKind
  n: number // số câu chấm được trong nhóm ở lượt này
  hits: number // recall: số TP · fpRate: số FP
}

const TALLY_GROUPS: Array<{ group: GroupName; metric: MetricKind }> = [
  ...ERROR_TYPES.map((t): { group: GroupName; metric: MetricKind } => ({
    group: t,
    metric: 'recall',
  })),
  { group: 'error', metric: 'recall' },
  { group: 'correct', metric: 'fpRate' },
  { group: 'edge', metric: 'fpRate' },
  { group: 'clean', metric: 'fpRate' },
]

export function tallyGroups(results: EvalResult[]): GroupTally[] {
  const scored = results.filter((r) => !r.providerError)
  return TALLY_GROUPS.map(({ group, metric }) => {
    const members = scored.filter((r) =>
      fixtureInGroup({ kind: r.kind, expectedErrors: r.expectedErrors, dir: r.dir ?? 'A' }, group),
    )
    const wanted = metric === 'recall' ? 'TP' : 'FP'
    return {
      group,
      metric,
      n: members.length,
      hits: members.filter((r) => r.outcome === wanted).length,
    }
  })
}

export interface AggregateRow {
  group: string
  metric: MetricKind | 'precision'
  runs: number // số lượt có dữ liệu cho nhóm này
  nPerRun: number
  mean: number | null
  sd: number | null
  hits: number // gộp mọi lượt
  trials: number // gộp mọi lượt
  ci: Interval | null // Wilson trên (hits, trials) gộp
}

function aggregate(
  group: string,
  metric: AggregateRow['metric'],
  perRun: Array<{ hits: number; n: number }>,
): AggregateRow {
  const used = perRun.filter((r) => r.n > 0)
  const rates = used.map((r) => r.hits / r.n)
  const hits = used.reduce((a, r) => a + r.hits, 0)
  const trials = used.reduce((a, r) => a + r.n, 0)
  return {
    group,
    metric,
    runs: used.length,
    nPerRun: used.length > 0 ? Math.round(trials / used.length) : 0,
    mean: mean(rates),
    sd: sampleStdDev(rates),
    hits,
    trials,
    ci: wilsonInterval(hits, trials),
  }
}

// Mỗi phần tử của `runs` = kết quả TẤT CẢ câu của một lượt chạy.
export function aggregateGroups(runs: EvalResult[][]): AggregateRow[] {
  const tallies = runs.map(tallyGroups)
  return TALLY_GROUPS.map(({ group, metric }) =>
    aggregate(
      group,
      metric,
      tallies.map((t) => {
        const row = t.find((x) => x.group === group)!
        return { hits: row.hits, n: row.n }
      }),
    ),
  )
}

// Chỉ số tổng (recall · precision · FP-rate) qua nhiều lượt — cùng cách tính với `summarize`.
export function aggregateOverall(summaries: Summary[]): AggregateRow[] {
  return [
    aggregate(
      'tổng',
      'recall',
      summaries.map((s) => ({ hits: s.tp, n: s.tp + s.fn })),
    ),
    aggregate(
      'tổng',
      'precision',
      summaries.map((s) => ({ hits: s.tp, n: s.tp + s.fp })),
    ),
    aggregate(
      'tổng',
      'fpRate',
      summaries.map((s) => ({ hits: s.fp, n: s.fp + s.tn })),
    ),
  ]
}

// ─── Định dạng ─────────────────────────────────────────────────────────────────
function pct(x: number | null): string {
  return x === null ? 'n/a' : `${(x * 100).toFixed(1)}%`
}

const METRIC_LABEL: Record<AggregateRow['metric'], string> = {
  recall: 'Recall',
  precision: 'Precision',
  fpRate: 'FP-rate',
}

export function renderStatsTable(rows: AggregateRow[]): string {
  const L: string[] = []
  L.push('| Nhóm | Chỉ số | Câu/lượt | Trung bình ± SD giữa các lượt | Wilson 95% (gộp) | Gộp |')
  L.push('| --- | --- | --- | --- | --- | --- |')
  for (const r of rows) {
    if (r.trials === 0) continue // nhóm không có câu nào (vd đang lọc --group) thì bỏ
    const ms = r.mean === null ? 'n/a' : `${pct(r.mean)} ± ${((r.sd ?? 0) * 100).toFixed(1)}`
    const ci = r.ci ? `${pct(r.ci.low)} – ${pct(r.ci.high)}` : 'n/a'
    L.push(
      `| ${r.group} | ${METRIC_LABEL[r.metric]} | ${r.nPerRun} | ${ms} | ${ci} | ${r.hits}/${r.trials} |`,
    )
  }
  return L.join('\n')
}

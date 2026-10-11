// src/lib/stats.ts — Gom số liệu tiến độ cho trang Bảng tiến độ (/progress)
// Lấy dữ liệu từ nhiều nơi (lượt dùng, vocab, SRS, lịch sử, CEFR) rồi tổng hợp lại,
// để trang Dashboard chỉ cần gọi vài hàm thay vì tự lắp ráp từng mảnh.

import type { DailyUsage } from '../types'
import { loadCefr } from '../data/cefrLoader'
import { loadFoundationIndex } from '../data/curriculumLoader'
import type { CefrLevel } from '../data/cefr'
import type { CircleSummary } from '../data/curriculum'
import { getWritingSubs } from './storage'
import { parseJson } from './ai'
import { vnDateStr, vnDayOfWeek } from './date'

const DAY_MS = 86_400_000
const dayStr = vnDateStr

// Đọc lượt dùng của 1 ngày bất kỳ — DÙNG CHUNG KEY với storage.ts (`et_usage_<uid>_<date>`).
function readUsage(uid: string, date: string): DailyUsage | null {
  try {
    const raw = localStorage.getItem(`et_usage_${uid}_${date}`)
    return raw ? (JSON.parse(raw) as DailyUsage) : null
  } catch {
    return null
  }
}

// Tổng số hoạt động trong 1 ngày (chat + viết + nói + STT + chấm phát âm + HỌC TỪ VỰNG).
// PHẢI gồm learnCount để KHỚP với getStreak() (storage.ts) — nếu không, ngày chỉ học
// từ vựng vẫn cộng streak nhưng lại hiện TRỐNG trên biểu đồ/lịch ở Dashboard (lệch số liệu).
function usageTotal(u: DailyUsage | null): number {
  if (!u) return 0
  return (
    u.chatCount +
    u.writingCount +
    u.speakingCount +
    (u.sttCount ?? 0) +
    (u.pronounceCount ?? 0) +
    (u.learnCount ?? 0)
  )
}

export interface DayActivity {
  date: string // YYYY-MM-DD
  dow: number // 0 = Chủ nhật … 6 = Thứ bảy (component tự đổi sang nhãn theo ngôn ngữ)
  count: number // tổng số hoạt động trong ngày
  active: boolean
}

// 7 ngày gần nhất (cũ → mới) — dùng để vẽ biểu đồ streak dạng cột/chấm.
export function getActivity7Days(uid: string): DayActivity[] {
  const out: DayActivity[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS)
    const count = usageTotal(readUsage(uid, dayStr(d)))
    out.push({ date: dayStr(d), dow: vnDayOfWeek(d), count, active: count > 0 })
  }
  return out
}

// Tổng số hoạt động trong 7 ngày gần nhất (gồm cả hôm nay).
export function getWeekTotal(uid: string): number {
  return getActivity7Days(uid).reduce((sum, d) => sum + d.count, 0)
}

// ── Lịch hoạt động dạng heatmap (vài tuần gần nhất) ─────────────────────────
export interface ActivityCalendar {
  days: DayActivity[] // cũ → mới (ngày cuối = hôm nay)
  firstColumn: number // 0..6 — cột (Thứ 2 = 0) của ô đầu tiên, để xếp lưới 7 cột
  activeDays: number // số ngày có học trong khoảng
  bestDay: number // số hoạt động của ngày bận nhất (để tô đậm nhạt)
}

// `totalDays` ngày gần nhất, kèm chỉ số cột để component xếp thành lưới 7 cột
// (Thứ 2 → Chủ nhật) đúng như lịch.
export function getActivityCalendar(uid: string, totalDays = 35): ActivityCalendar {
  const days: DayActivity[] = []
  const today = new Date()
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS)
    const count = usageTotal(readUsage(uid, dayStr(d)))
    days.push({ date: dayStr(d), dow: vnDayOfWeek(d), count, active: count > 0 })
  }
  // Đổi getDay() (0 = CN) sang chỉ số cột bắt đầu từ Thứ 2 (0 = T2 … 6 = CN).
  const firstColumn = ((days[0]?.dow ?? 0) + 6) % 7
  return {
    days,
    firstColumn,
    activeDays: days.filter((d) => d.active).length,
    bestDay: Math.max(0, ...days.map((d) => d.count)),
  }
}

// ── Chi tiết hoạt động của MỘT ngày (bấm vào ô lịch) ────────────────────────
// Lịch heatmap chỉ nói "ngày này đậm hơn ngày kia". Câu hỏi tiếp theo của người học luôn là
// "hôm đó mình đã làm gì?", nên ô lịch bấm được và trả lời đúng câu đó.
// Đọc theo YÊU CẦU (chỉ khi bấm) chứ không kèm sẵn vào 182 ngày của lịch: hầu hết ô không
// bao giờ được bấm, gói sẵn là trả giá bộ nhớ cho thứ gần như không ai xem.
export interface DayBreakdownItem {
  key: 'learn' | 'chat' | 'writing' | 'speaking' | 'stt' | 'pronounce'
  count: number
}

export interface DayBreakdown {
  date: string
  total: number
  /** Chỉ các mục CÓ số > 0, theo thứ tự cố định để giao diện không nhảy lung tung. */
  items: DayBreakdownItem[]
}

export function getDayBreakdown(uid: string, date: string): DayBreakdown {
  const u = readUsage(uid, date)
  const raw: DayBreakdownItem[] = [
    { key: 'learn', count: u?.learnCount ?? 0 },
    { key: 'chat', count: u?.chatCount ?? 0 },
    { key: 'writing', count: u?.writingCount ?? 0 },
    { key: 'speaking', count: u?.speakingCount ?? 0 },
    { key: 'stt', count: u?.sttCount ?? 0 },
    { key: 'pronounce', count: u?.pronounceCount ?? 0 },
  ]
  const items = raw.filter((i) => i.count > 0)
  return { date, total: usageTotal(u), items }
}

// ── Tiến bộ luyện viết (điểm IELTS ước lượng theo thời gian) ─────────────────
// `feedback` của mỗi bài viết là JSON string (xem Writing.tsx) — parse lấy điểm.
interface WritingScores {
  task_response: number
  coherence: number
  lexical: number
  grammar: number
  overall: number
}
interface WritingFeedback {
  scores?: WritingScores
}

export interface BandPoint {
  date: string
  overall: number
}

export interface WritingProgress {
  history: BandPoint[] // theo thứ tự thời gian tăng dần (cũ → mới)
  count: number
  latest: number | null
  best: number | null
  avg: number | null
  // Điểm trung bình từng tiêu chí (để chỉ ra điểm mạnh / yếu)
  components: { task_response: number; coherence: number; lexical: number; grammar: number } | null
}

export function getWritingProgress(uid: string): WritingProgress {
  // getWritingSubs trả về mới→cũ; lọc các bài đã chấm (có scores.overall hợp lệ).
  const rows = getWritingSubs(uid)
    .map((s) => {
      const sc = s.feedback ? parseJson<WritingFeedback>(s.feedback)?.scores : null
      return sc && typeof sc.overall === 'number' ? { t: s.submittedAt, sc } : null
    })
    .filter((x): x is { t: number; sc: WritingScores } => x != null)

  if (rows.length === 0) {
    return { history: [], count: 0, latest: null, best: null, avg: null, components: null }
  }

  const asc = [...rows].sort((a, b) => a.t - b.t)
  const overalls = asc.map((r) => r.sc.overall)
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
  const round1 = (x: number) => Math.round(x * 10) / 10

  return {
    history: asc.map((r) => ({ date: dayStr(new Date(r.t)), overall: r.sc.overall })),
    count: rows.length,
    latest: overalls[overalls.length - 1] ?? null,
    best: Math.max(...overalls),
    avg: round1(mean(overalls)),
    components: {
      task_response: round1(mean(asc.map((r) => r.sc.task_response))),
      coherence: round1(mean(asc.map((r) => r.sc.coherence))),
      lexical: round1(mean(asc.map((r) => r.sc.lexical))),
      grammar: round1(mean(asc.map((r) => r.sc.grammar))),
    },
  }
}

// ── Tiến độ theo cấp CEFR (A1 → B2) ─────────────────────────────────────────
export interface LevelProgress {
  id: CefrLevel['id']
  titleVi: string
  titleEn: string
  accent: CefrLevel['accent']
  doneWords: number
  totalWords: number
  pct: number // 0..100 (theo số từ vựng đã thuộc của cấp)
  grammarCount: number
}

// Số từ trong 1 vòng đã thuộc — so cả bản gốc lẫn chữ thường (giống RoadmapTab).
function circleDone(circle: CircleSummary, learned: Set<string>): number {
  return circle.words.filter((w) => learned.has(w.word) || learned.has(w.word.toLowerCase())).length
}

// % hoàn thành mỗi cấp = số từ đã thuộc / tổng số từ trong các vòng vocab của cấp.
// Đây CHÍNH là cách RoadmapTab tính tiến độ + mở khóa cấp (ngưỡng 70%) — giữ nhất quán.
export async function getCefrProgress(learned: Set<string>): Promise<LevelProgress[]> {
  const [levels, foundation] = await Promise.all([loadCefr(), loadFoundationIndex()])
  const byId: Record<string, CircleSummary> = {}
  foundation.forEach((c) => {
    byId[c.id] = c
  })

  return levels.map((level) => {
    const ids = level.units.flatMap((u) => u.vocabCircleIds)
    let totalWords = 0
    let doneWords = 0
    for (const id of ids) {
      const c = byId[id]
      if (!c) continue
      totalWords += c.words.length
      doneWords += circleDone(c, learned)
    }
    const grammarCount = level.units.reduce((s, u) => s + u.grammar.length, 0)
    return {
      id: level.id,
      titleVi: level.titleVi,
      titleEn: level.titleEn,
      accent: level.accent,
      doneWords,
      totalWords,
      pct: totalWords ? Math.round((doneWords / totalWords) * 100) : 0,
      grammarCount,
    }
  })
}

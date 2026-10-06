// DashboardEnglishDetails — boundary "Chi tiết Tiếng Anh" ở trang Tiến độ (R3-4, UX-R3 §6.3).
//
// PROGRESSIVE DISCLOSURE: summary luôn hiện (số từ cần ôn · chỉ dấu lộ trình · trạng thái lượt
// AI) + panel chi tiết đóng mặc định ở MỌI viewport (320/390/1440), chứa các khối English hiện
// hành (Hôm nay · Từ vựng · Sổ lỗi · CEFR · IELTS · Tổng kết). Đây là slice CUỐI của chuỗi
// R3-1→R3-4 — sau khi merge, `docs/specs/2026-09-18-ui-clarity-dashboard-progressive-disclosure.md`
// coi UX-R3 hoàn tất.
//
// Vì sao KHÔNG fetch ở đây (boundary §6.1): mọi resource async (lượt AI · CEFR) do Dashboard.tsx
// sở hữu (keyed resource + focus recovery theo §4.1) — component này chỉ NHẬN dữ liệu đã tính và
// callback retry, giữ đúng ranh giới "không tự tạo authoritative progress".
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BookMarked,
  BookOpen,
  GraduationCap,
  MessageCircle,
  PenLine,
  Mic,
  RotateCcw,
  Target,
  TrendingUp,
  Trophy,
  ArrowRight,
} from 'lucide-react'
import type { LevelProgress } from '../lib/stats'

// Màu theo band IELTS (đồng bộ với trang Luyện viết) — chuyển từ Dashboard.tsx, chỉ dùng ở đây.
function bandBar(v: number): string {
  return v >= 7 ? 'bg-accent-500' : v >= 5 ? 'bg-amber-500' : 'bg-red-500'
}
function bandText(v: number): string {
  return v >= 7
    ? 'text-accent-400 theme-light:text-accent-800'
    : v >= 5
      ? 'text-amber-400 theme-light:text-amber-800'
      : 'text-red-400 theme-light:text-red-700'
}

// Bảng màu nhấn cho từng cấp CEFR (Tailwind cần class tĩnh — không ghép động được).
const ACCENT: Record<LevelProgress['accent'], { bar: string; text: string; soft: string }> = {
  emerald: {
    bar: 'bg-accent-500',
    text: 'text-accent-300 theme-light:text-accent-800',
    soft: 'bg-accent-500/10',
  },
  sky: { bar: 'bg-sky-500', text: 'text-sky-300 theme-light:text-sky-800', soft: 'bg-sky-500/10' },
  violet: {
    bar: 'bg-violet-500',
    text: 'text-violet-300 theme-light:text-violet-800',
    soft: 'bg-violet-500/10',
  },
  amber: {
    bar: 'bg-amber-500',
    text: 'text-amber-300 theme-light:text-amber-800',
    soft: 'bg-amber-500/10',
  },
  rose: {
    bar: 'bg-rose-500',
    text: 'text-rose-300 theme-light:text-rose-800',
    soft: 'bg-rose-500/10',
  },
  cyan: {
    bar: 'bg-cyan-500',
    text: 'text-cyan-300 theme-light:text-cyan-800',
    soft: 'bg-cyan-500/10',
  },
}

// Một thẻ số liệu nhỏ (icon + số to + nhãn) kiểu Bento hiện đại — chuyển từ Dashboard.tsx.
function StatCard({
  icon,
  value,
  label,
  sub,
  color,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl sm:rounded-3xl p-4 flex flex-col justify-between gap-2 transition-colors duration-200 hover:shadow-md">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight">
          {value}
        </p>
        <p className="text-xs font-medium text-zinc-400 leading-tight mt-1">{label}</p>
        {sub && <p className="text-[0.6875rem] text-zinc-400 leading-tight mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// Thanh tiến độ ngang đơn giản — chuyển từ Dashboard.tsx.
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-zinc-800/90 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} shadow-sm`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

export interface DashboardEnglishDetailsWeeklyCredit {
  info: {
    freeWeeklyCredit: number | null
    freeWeeklyCap: number
    unlimited?: true
    usedToday?: number
  } | null
  status: 'loading' | 'ready' | 'error'
  retryRevision: number
}

export interface DashboardEnglishDetailsCefr {
  state: { status: 'loading' } | { status: 'ready'; data: LevelProgress[] } | { status: 'error' }
  retryRevision: number
  examMap: Record<string, { passed: boolean; bestPct: number } | undefined>
  overallPct: number
}

export interface DashboardEnglishDetailsWriting {
  count: number
  latest: number | null
  best: number | null
  avg: number | null
  history: { date: string; overall: number }[]
  components?: {
    task_response: number
    coherence: number
    lexical: number
    grammar: number
  } | null
}

export interface DashboardEnglishDetailsProps {
  vi: boolean
  expanded: boolean
  onToggle: () => void
  // ── Summary (luôn hiển thị, không nằm trong panel hidden) ──────────────────────────────
  srsDue: number
  weeklyCredit: DashboardEnglishDetailsWeeklyCredit
  weeklyCreditRetryRef: React.RefObject<HTMLButtonElement | null>
  onRetryWeeklyCredit: () => void
  // ── Panel: Hôm nay ──────────────────────────────────────────────────────────────────────
  learnedToday: number
  dailySpeed: number
  // ── Panel: Từ vựng ──────────────────────────────────────────────────────────────────────
  learnedTotal: number
  srsTotal: number
  pathDone: number
  pathTotal: number
  pathReady: boolean
  // ── Panel: Sổ lỗi ───────────────────────────────────────────────────────────────────────
  mistakesDue: number
  mistakesTotal: number
  onOpenMistakes: () => void
  // ── Panel: CEFR ─────────────────────────────────────────────────────────────────────────
  cefr: DashboardEnglishDetailsCefr
  cefrRetryRef: React.RefObject<HTMLButtonElement | null>
  onRetryCefr: () => void
  // ── Panel: IELTS ────────────────────────────────────────────────────────────────────────
  writing: DashboardEnglishDetailsWriting
  onWriteFirst: () => void
  // ── Panel: Tổng kết ─────────────────────────────────────────────────────────────────────
  chatN: number
  writeN: number
  speakN: number
  englishSubjectHref: string
}

const TOGGLE_ID = 'dashboard-english-details-toggle'
const PANEL_ID = 'dashboard-english-details-panel'

/**
 * Boundary "Chi tiết Tiếng Anh": summary compact luôn hiển thị + disclosure panel chứa các khối
 * English hiện hành. KHÔNG fetch, KHÔNG đổi phép tính/route hoặc tự mặc định evidence — nhận dữ
 * liệu và callback retry đã tính sẵn từ Dashboard (owner của resource).
 */
export default function DashboardEnglishDetails({
  vi,
  expanded,
  onToggle,
  srsDue,
  weeklyCredit,
  weeklyCreditRetryRef,
  onRetryWeeklyCredit,
  learnedToday,
  dailySpeed,
  learnedTotal,
  srsTotal,
  pathDone,
  pathTotal,
  pathReady,
  mistakesDue,
  mistakesTotal,
  onOpenMistakes,
  cefr,
  cefrRetryRef,
  onRetryCefr,
  writing,
  onWriteFirst,
  chatN,
  writeN,
  speakN,
  englishSubjectHref,
}: DashboardEnglishDetailsProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  function handleToggle() {
    // Trước khi ẩn panel: nếu focus đang ở trong panel thì chuyển về toggle (§6.3); nếu focus
    // đã ở ngoài (vd người dùng đang thao tác chỗ khác) thì tuyệt đối không "steal".
    if (expanded) {
      const active = document.activeElement
      if (active instanceof Node && panelRef.current?.contains(active)) {
        toggleRef.current?.focus()
      }
    }
    onToggle()
  }

  const weeklyCreditInfo =
    weeklyCredit.status === 'ready' && weeklyCredit.info ? weeklyCredit.info : null
  const cefrList = cefr.state.status === 'ready' ? cefr.state.data : []
  const cefrOverallText =
    cefr.state.status === 'loading'
      ? vi
        ? 'Đang tải…'
        : 'Loading…'
      : cefr.state.status === 'error'
        ? vi
          ? 'Chưa tải được'
          : 'Unavailable'
        : cefrList.length === 0
          ? vi
            ? 'Chưa có dữ liệu'
            : 'No data yet'
          : `${cefr.overallPct}%`
  const wp = writing

  return (
    <section
      aria-labelledby="dashboard-english-details-heading"
      className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-sm animate-fade-in motion-reduce:animate-none"
    >
      <h2 id="dashboard-english-details-heading" className="text-sm font-bold text-zinc-200">
        {vi ? 'Chi tiết Tiếng Anh' : 'English details'}
      </h2>
      <p className="text-xs text-zinc-400 mt-1 read-measure">
        {vi ? (
          <>
            Số liệu Tiếng Anh — xem thêm ở{' '}
            <Link
              to={englishSubjectHref}
              aria-label="về trang môn"
              className="underline underline-offset-2 text-accent-300 theme-light:text-accent-900 hover:text-white theme-light:hover:text-accent-950"
            >
              trang môn
            </Link>
            .
          </>
        ) : (
          <>
            English numbers — see the{' '}
            <Link
              to={englishSubjectHref}
              aria-label="go to subject page"
              className="underline underline-offset-2 text-accent-300 theme-light:text-accent-900 hover:text-white theme-light:hover:text-accent-950"
            >
              subject page
            </Link>
            .
          </>
        )}
      </p>

      {/* ── Summary: luôn hiển thị, không nằm trong panel hidden ─────────────────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-2xl p-2.5">
          <p className="text-[0.6875rem] text-zinc-400">{vi ? 'Cần ôn hôm nay' : 'Due today'}</p>
          <p className="text-lg font-bold text-teal-300 theme-light:text-teal-900 leading-none mt-0.5">
            {srsDue}
          </p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-2xl p-2.5">
          <p className="text-[0.6875rem] text-zinc-400">{vi ? 'Lộ trình CEFR' : 'CEFR roadmap'}</p>
          <p className="text-lg font-bold text-accent-300 theme-light:text-accent-900 leading-none mt-0.5">
            {cefrOverallText}
          </p>
        </div>
      </div>

      {/* Lượt dùng AI — MỘT hạn mức TỔNG/ngày cho mọi tính năng AI, CẢ Free lẫn VIP (GĐ1
          2026-09-12). Số đọc từ SERVER (api/usage-summary.ts) vì bộ đếm local theo từng chế độ
          không cộng ra được con số server chặn. [2026-10-05, audit M9] Trước đây nhánh VIP hiện
          3 ô Chat/Nói/Viết đọc hạn mức THEO CHẾ ĐỘ đã bỏ từ GĐ1 → mẫu số `undefined`, ra "0/".
          Heading recovery target §4.1 — luôn visible, KHÔNG nằm trong panel disclosure. */}
      <div className="mt-2">
        <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-2xl p-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3
              id="dashboard-weekly-credit-heading"
              tabIndex={-1}
              className="text-[0.6875rem] text-zinc-400 flex items-start gap-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-md"
            >
              <MessageCircle className="w-3.5 h-3.5 text-accent-400 shrink-0 mt-0.5" />
              <span>
                {weeklyCreditInfo?.unlimited
                  ? vi
                    ? 'Lượt AI hôm nay'
                    : 'AI turns today'
                  : vi
                    ? 'Lượt AI còn lại hôm nay'
                    : 'AI credits left today'}
              </span>
            </h3>
            {weeklyCreditInfo && (
              <span className="text-sm font-semibold text-accent-300 theme-light:text-accent-800 shrink-0">
                {weeklyCreditInfo.unlimited
                  ? vi
                    ? 'Không giới hạn'
                    : 'Unlimited'
                  : `${weeklyCreditInfo.freeWeeklyCredit}/${weeklyCreditInfo.freeWeeklyCap} ${vi ? 'lượt' : 'credits'}`}
              </span>
            )}
          </div>
          {weeklyCreditInfo?.unlimited ? (
            <p className="text-sm text-zinc-300 mt-1">
              {vi
                ? `Đã dùng ${weeklyCreditInfo.usedToday ?? 0} lượt hôm nay. Gói còn hiệu lực: không giới hạn lượt AI.`
                : `${weeklyCreditInfo.usedToday ?? 0} turns used today. Unlimited AI turns while your plan is active.`}
            </p>
          ) : weeklyCreditInfo && weeklyCreditInfo.freeWeeklyCredit !== null ? (
            <div className="mt-1.5">
              <Bar
                pct={(weeklyCreditInfo.freeWeeklyCredit / weeklyCreditInfo.freeWeeklyCap) * 100}
                color="bg-accent-500"
              />
            </div>
          ) : weeklyCredit.status === 'error' ? (
            <div role="status" className="mt-1 flex items-center gap-2 flex-wrap">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {vi ? 'Chưa tải được lượt AI hôm nay.' : 'Today’s AI credits are unavailable.'}
              </p>
              <button
                ref={weeklyCreditRetryRef}
                type="button"
                onClick={onRetryWeeklyCredit}
                className="min-h-11 px-2 text-sm font-semibold text-accent-300 theme-light:text-accent-800 rounded-lg hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {vi ? 'Thử lại' : 'Retry'}
              </button>
            </div>
          ) : weeklyCredit.retryRevision > 0 ? (
            <div role="status" className="mt-1 flex items-center gap-2 flex-wrap">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {vi ? 'Đang tải lại lượt AI…' : 'Reloading AI credits…'}
              </p>
              <button
                ref={weeklyCreditRetryRef}
                type="button"
                aria-disabled="true"
                onClick={onRetryWeeklyCredit}
                className="min-h-11 px-2 text-sm font-semibold text-zinc-400 rounded-lg cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {vi ? 'Đang thử lại…' : 'Retrying…'}
              </button>
            </div>
          ) : (
            <p role="status" className="mt-1 text-sm text-zinc-300 leading-relaxed">
              {vi ? 'Đang tải lượt AI…' : 'Loading AI credits…'}
            </p>
          )}
        </div>
      </div>

      {/* ── Disclosure: đóng mặc định ở MỌI viewport, không auto mở/đóng ─────────────────── */}
      <button
        ref={toggleRef}
        id={TOGGLE_ID}
        type="button"
        aria-expanded={expanded}
        aria-controls={PANEL_ID}
        onClick={handleToggle}
        className="min-h-11 w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring mt-4"
      >
        {expanded
          ? vi
            ? 'Ẩn chi tiết Tiếng Anh'
            : 'Hide English details'
          : vi
            ? 'Xem chi tiết Tiếng Anh'
            : 'View English details'}
      </button>

      <div ref={panelRef} id={PANEL_ID} hidden={!expanded} className="mt-4 space-y-6 min-w-0">
        {/* ── Hôm nay ─────────────────────────────────────────────────────────────────── */}
        <section className="animate-fade-in motion-reduce:animate-none">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-lime-400 theme-light:text-lime-900" />{' '}
            {vi ? 'Hôm nay' : 'Today'}
          </h3>
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-300">
                {vi ? 'Từ mới hôm nay' : 'New words today'}
              </span>
              <span className="text-sm font-semibold text-lime-300 theme-light:text-lime-800">
                {learnedToday}/{dailySpeed}
              </span>
            </div>
            <Bar pct={(learnedToday / dailySpeed) * 100} color="bg-lime-500" />
          </div>
        </section>

        {/* ── Từ vựng ─────────────────────────────────────────────────────────────────── */}
        <section className="animate-fade-in motion-reduce:animate-none">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />{' '}
            {vi ? 'Từ vựng' : 'Vocabulary'}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<BookOpen className="w-5 h-5 text-amber-300 theme-light:text-amber-900" />}
              color="bg-amber-500/10"
              value={learnedTotal}
              label={vi ? 'từ đã thuộc' : 'words learned'}
            />
            <StatCard
              icon={<RotateCcw className="w-5 h-5 text-teal-300 theme-light:text-teal-900" />}
              color="bg-teal-500/10"
              value={srsDue}
              label={vi ? 'cần ôn hôm nay' : 'due to review'}
              sub={vi ? `${srsTotal} trong SRS` : `${srsTotal} in SRS`}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-lime-300 theme-light:text-lime-900" />}
              color="bg-lime-500/10"
              value={pathTotal ? `${Math.round((pathDone / pathTotal) * 100)}%` : '—'}
              label={vi ? 'lộ trình' : 'of path'}
              sub={pathReady ? `${pathDone}/${pathTotal}` : '…'}
            />
          </div>
        </section>

        {/* ── Sổ lỗi cá nhân ──────────────────────────────────────────────────────────── */}
        {mistakesTotal > 0 && (
          <section className="animate-fade-in motion-reduce:animate-none">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-rose-400 theme-light:text-rose-900" />{' '}
              {vi ? 'Sổ lỗi của tôi' : 'Mistake Bank'}
            </h3>
            <button
              onClick={onOpenMistakes}
              className="w-full bg-zinc-900/80 border border-zinc-800/80 hover:border-rose-500/40 rounded-2xl p-4 flex items-center justify-between transition-colors group text-left"
            >
              <div>
                <p className="text-sm text-zinc-200">
                  {mistakesDue > 0
                    ? vi
                      ? `${mistakesDue} lỗi cần ôn hôm nay`
                      : `${mistakesDue} mistakes to review`
                    : vi
                      ? 'Không có lỗi cần ôn hôm nay'
                      : 'No mistakes due today'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {vi
                    ? `${mistakesTotal} lỗi đã ghi từ Chat · Viết · Nói`
                    : `${mistakesTotal} recorded from Chat · Writing · Speaking`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {mistakesDue > 0 && (
                  <span className="text-sm font-bold text-rose-300 theme-light:text-rose-700 bg-rose-500/10 rounded-full w-8 h-8 flex items-center justify-center">
                    {mistakesDue}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-rose-400 transition-colors" />
              </div>
            </button>
          </section>
        )}

        {/* ── Lộ trình CEFR ───────────────────────────────────────────────────────────── */}
        <section className="animate-fade-in motion-reduce:animate-none">
          <div className="flex items-center justify-between mb-3">
            <h3
              id="dashboard-cefr-heading"
              tabIndex={-1}
              className="text-sm font-semibold text-zinc-300 flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <GraduationCap className="w-4 h-4 text-accent-400" />{' '}
              {vi ? 'Lộ trình CEFR' : 'CEFR Roadmap'}
            </h3>
            {cefrList.length > 0 && (
              <span className="text-xs text-zinc-400">
                {vi ? 'Tổng' : 'Overall'} {cefr.overallPct}%
              </span>
            )}
          </div>
          {/* min-h khớp GẦN ĐÚNG chiều cao thật của 6 cấp CEFR A1–C2 (đo canonical ~318px @390,
              data cố định ở `src/data/cefr.ts`) — không phải số ma thuật tuỳ ý: mục đích DUY
              NHẤT là giữ CLS <0,1 khi loading/error→ready (AC-11). */}
          <div
            data-testid="cefr-roadmap-content"
            className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4 min-h-[19.5rem]"
          >
            {cefr.state.status === 'loading' ? (
              cefr.retryRevision > 0 ? (
                <div role="status" className="text-center">
                  <p className="text-sm text-zinc-300 py-1">
                    {vi ? 'Đang tải lại lộ trình Tiếng Anh…' : 'Reloading the English roadmap…'}
                  </p>
                  <button
                    ref={cefrRetryRef}
                    type="button"
                    aria-disabled="true"
                    onClick={onRetryCefr}
                    className="min-h-11 px-3 text-sm font-semibold text-zinc-400 rounded-lg cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    {vi ? 'Đang thử lại…' : 'Retrying…'}
                  </button>
                </div>
              ) : (
                <p role="status" className="text-sm text-zinc-300 text-center py-4">
                  {vi ? 'Đang tải lộ trình Tiếng Anh…' : 'Loading the English roadmap…'}
                </p>
              )
            ) : cefr.state.status === 'error' ? (
              <div role="status" className="text-center">
                <p className="text-sm text-zinc-300 py-1">
                  {vi ? 'Chưa tải được lộ trình Tiếng Anh.' : 'The English roadmap is unavailable.'}
                </p>
                <button
                  ref={cefrRetryRef}
                  type="button"
                  onClick={onRetryCefr}
                  className="min-h-11 px-3 text-sm font-semibold text-accent-300 theme-light:text-accent-800 rounded-lg hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {vi ? 'Thử lại' : 'Retry'}
                </button>
              </div>
            ) : cefrList.length === 0 ? (
              <p className="text-sm text-zinc-300 text-center py-4">
                {vi ? 'Chưa có dữ liệu lộ trình.' : 'No roadmap data yet.'}
              </p>
            ) : (
              cefrList.map((l) => {
                const c = ACCENT[l.accent]
                const exam = cefr.examMap[l.id]
                return (
                  <div key={l.id}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className={`font-semibold ${c.text} flex items-center gap-1.5`}>
                        {vi ? l.titleVi : l.titleEn}
                        {exam?.passed && (
                          <span className="flex items-center gap-0.5 text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 theme-light:text-amber-800">
                            <GraduationCap className="w-2.5 h-2.5" />
                            {exam.bestPct}%
                          </span>
                        )}
                      </span>
                      <span className="text-zinc-400 text-xs">
                        {l.doneWords}/{l.totalWords} {vi ? 'từ' : 'words'} · {l.pct}%
                      </span>
                    </div>
                    <Bar pct={l.pct} color={c.bar} />
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ── Điểm IELTS luyện viết theo thời gian ───────────────────────────────────── */}
        <section className="animate-fade-in motion-reduce:animate-none">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-violet-400 theme-light:text-violet-800" />{' '}
            {vi ? 'Điểm viết IELTS (ước lượng)' : 'IELTS writing score (estimated)'}
          </h3>

          {wp.count === 0 ? (
            <button
              onClick={onWriteFirst}
              className="w-full bg-zinc-900/80 border border-zinc-800/80 hover:border-violet-500/40 rounded-2xl p-5 text-center transition-colors group"
            >
              <p className="text-sm text-zinc-400 read-measure">
                {vi ? 'Chưa có bài viết nào được chấm.' : 'No graded essays yet.'}
              </p>
              <p className="text-xs text-violet-400 theme-light:text-violet-800 mt-1 group-hover:underline read-measure">
                {vi ? 'Viết bài đầu tiên →' : 'Write your first essay →'}
              </p>
            </button>
          ) : (
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className={`text-2xl font-bold leading-none ${bandText(wp.latest!)}`}>
                    {wp.latest}
                  </p>
                  <p className="text-[0.6875rem] text-zinc-400 mt-1">
                    {vi ? 'gần nhất' : 'latest'}
                  </p>
                </div>
                <div className="text-center border-x border-zinc-800">
                  <p className="text-2xl font-bold leading-none text-amber-300 theme-light:text-amber-900 flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {wp.best}
                  </p>
                  <p className="text-[0.6875rem] text-zinc-400 mt-1">{vi ? 'cao nhất' : 'best'}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold leading-none text-zinc-200">{wp.avg}</p>
                  <p className="text-[0.6875rem] text-zinc-400 mt-1">
                    {vi ? 'trung bình' : 'average'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[0.6875rem] text-zinc-400 mb-2">
                  {vi ? `${wp.count} bài đã chấm` : `${wp.count} essays graded`}
                </p>
                <div className="flex items-end justify-between gap-1.5 h-24">
                  {wp.history.slice(-12).map((p, i) => (
                    <div
                      key={`${p.date}-${i}`}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${p.date}: ${p.overall}`}
                    >
                      <span className="text-[0.6875rem] text-zinc-400">{p.overall}</span>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className={`w-full rounded-md ${bandBar(p.overall)}`}
                          style={{ height: `${(p.overall / 9) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {wp.components && (
                <div className="space-y-2 pt-1">
                  {[
                    {
                      label: vi ? 'Trả lời đề (TR)' : 'Task Response',
                      val: wp.components.task_response,
                    },
                    { label: vi ? 'Mạch lạc (CC)' : 'Coherence', val: wp.components.coherence },
                    { label: vi ? 'Từ vựng (LR)' : 'Lexical', val: wp.components.lexical },
                    { label: vi ? 'Ngữ pháp (GRA)' : 'Grammar', val: wp.components.grammar },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 w-28 shrink-0">{c.label}</span>
                      <div className="flex-1">
                        <Bar pct={(c.val / 9) * 100} color={bandBar(c.val)} />
                      </div>
                      <span className={`text-xs font-semibold w-6 text-right ${bandText(c.val)}`}>
                        {c.val}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Tổng kết hoạt động ──────────────────────────────────────────────────────── */}
        <section className="animate-fade-in motion-reduce:animate-none">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            {vi ? 'Tổng kết' : 'All-time totals'}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<MessageCircle className="w-5 h-5 text-accent-300" />}
              color="bg-accent-500/10"
              value={chatN}
              label={vi ? 'phiên chat' : 'chat sessions'}
            />
            <StatCard
              icon={<Mic className="w-5 h-5 text-sky-300 theme-light:text-sky-900" />}
              color="bg-sky-500/10"
              value={speakN}
              label={vi ? 'lượt luyện nói' : 'speaking turns'}
            />
            <StatCard
              icon={<PenLine className="w-5 h-5 text-violet-300 theme-light:text-violet-800" />}
              color="bg-violet-500/10"
              value={writeN}
              label={vi ? 'bài đã chấm' : 'graded essays'}
            />
          </div>
        </section>
      </div>
    </section>
  )
}

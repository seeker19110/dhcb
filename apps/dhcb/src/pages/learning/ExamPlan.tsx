// src/pages/learning/ExamPlan.tsx — Chế độ ôn thi có hạn chót ("Đếm ngược kỳ thi").
//
// Đặc tả: docs/research/companion-va-personal-policy.md §5 (gộp từ dac-ta-che-do-on-thi-2026-08-26.md).
//
// SONG NGỮ (2026-09-05): trang chạy ở CẢ HAI chiều học. Chiều A = người Việt học tiếng Anh, thi
// vào lớp 10 môn Tiếng Anh. Chiều B = người nước ngoài học tiếng Việt, chứng chỉ tiếng Việt bậc 3.
// Dùng khuôn `isA ? 'vi' : 'en'` tại chỗ, giống `CompanionLinkSection.tsx` — dự án chưa có lớp i18n
// và thêm một lớp cho riêng trang này sẽ là hai khuôn song song.
//
// LUẬT BỐ CỤC (mục 4.1, và luật số 1 của sản phẩm): màn hình này là ĐỒNG HỒ ĐẾM NGƯỢC + ĐÚNG 3
// VIỆC HÔM NAY. Không phải bảng điểm, không phải biểu đồ tiến độ, không phải kết quả chẩn đoán.
// Con số "đã thuộc bao nhiêu/bao nhiêu" nằm ở dòng phụ, không phải nhân vật chính.
//
// LUẬT GIỌNG (mục 4.2, 4.3): trễ thì NÉN LỊCH, không phạt — không có màn hình "bạn đã bỏ lỡ N
// ngày". Không kịp thì NÓI THẲNG và đề xuất cắt phạm vi, không im lặng nhồi lịch.

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { duongDanMonTiengAnh } from '../../lib/subjectsHost'
import { duongDanLoTrinh, duongDanLuyenNoi } from '../../lib/englishRoutes'
import { CalendarClock, Target, BookOpen, RotateCcw, Sparkles } from 'lucide-react'
import { usePageTitle } from '../../lib/usePageTitle'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import { Skeleton } from '../../components/Skeleton'
import { useAuth } from '../../context/useAuth'
import { setExamRetention } from '../../lib/srs'
import { useLang } from '../../context/useLang'
import type { ExamPlan as ExamPlanRecord } from '@dhcb/core-contracts/examPlan'
import {
  fetchExamPlan,
  createExamPlan,
  endExamPlan,
  computeTodayPlan,
  getExamScopeWords,
  suggestedDailyCap,
  examKindForDirection,
  type TodayPlan,
} from '../../lib/examPlan'
import { buttonClass } from '@core/buttonStyles'
import { useToast } from '@core/ToastProvider'
import LoadError from '../../components/LoadError'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'

const WEEKDAY_LABELS_A = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const WEEKDAY_LABELS_B = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Tên kỳ thi của từng chiều — hiện ngay trên đồng hồ đếm ngược. */
const EXAM_NAME_A = 'Thi vào lớp 10 — Tiếng Anh'
const EXAM_NAME_B = 'Vietnamese proficiency — Level 3 (B1)'

function daysLabel(n: number, isA: boolean): string {
  if (isA) {
    if (n === 0) return 'Thi hôm nay'
    if (n === 1) return 'Còn 1 ngày'
    return `Còn ${n} ngày`
  }
  if (n === 0) return 'Exam is today'
  if (n === 1) return '1 day left'
  return `${n} days left`
}

// ── Màn hình khi CHƯA có kế hoạch ────────────────────────────────────────────
function CreateForm({ uid, isA, onCreated }: { uid: string; isA: boolean; onCreated: () => void }) {
  const [examDate, setExamDate] = useState('')
  const [targetLabel, setTargetLabel] = useState('')
  const [dailyCap, setDailyCap] = useState(() => suggestedDailyCap(uid))
  const [restDays, setRestDays] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleRestDay(d: number) {
    setRestDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  async function submit() {
    if (!examDate) return
    setSaving(true)
    setError(null)
    const res = await createExamPlan(
      {
        examKind: examKindForDirection(isA),
        examDate,
        scopeItems: getExamScopeWords().length,
        ...(targetLabel.trim() ? { targetLabel: targetLabel.trim() } : {}),
        dailyCapItems: dailyCap,
        restDays,
      },
      isA,
    )
    setSaving(false)
    if (res.ok) onCreated()
    else setError(res.message)
  }

  return (
    <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
      <p className="text-sm text-zinc-300">
        {isA
          ? 'Cho biết ngày thi, hệ thống tự chia việc mỗi ngày từ đó ngược về hôm nay. Bận vài hôm cũng không sao — lịch tự tính lại, không có ai trừ điểm bạn cả.'
          : 'Tell us your exam date and we plan backwards from it, one day at a time. Busy for a few days? The plan simply recalculates — nobody takes points off you.'}
      </p>

      <div>
        <label htmlFor="exam-date" className="block text-xs font-medium text-zinc-200 mb-1.5">
          {isA ? 'Ngày thi' : 'Exam date'}
        </label>
        <input
          id="exam-date"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-base text-zinc-100"
        />
      </div>

      <div>
        <label htmlFor="exam-target" className="block text-xs font-medium text-zinc-200 mb-1.5">
          {isA ? 'Mục tiêu của bạn (tuỳ chọn)' : 'Your target (optional)'}
        </label>
        <input
          id="exam-target"
          value={targetLabel}
          onChange={(e) => setTargetLabel(e.target.value)}
          placeholder={isA ? 'ví dụ: 8 điểm' : 'e.g. level 3'}
          maxLength={60}
          className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-400"
        />
        <p className="text-xs text-zinc-300 mt-1">
          {isA
            ? 'Chỉ để bạn nhớ mình đang nhắm gì — hệ thống không dùng con số này để chấm bất cứ thứ gì.'
            : 'Just a reminder of what you are aiming for — it is never used to score anything.'}
        </p>
      </div>

      <div>
        <label htmlFor="exam-cap" className="block text-xs font-medium text-zinc-200 mb-1.5">
          {isA ? `Nhiều nhất mỗi ngày: ${dailyCap} mục` : `At most ${dailyCap} items per day`}
        </label>
        <input
          id="exam-cap"
          type="range"
          min={5}
          max={40}
          step={5}
          value={dailyCap}
          onChange={(e) => setDailyCap(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-zinc-200 mb-1.5">
          {isA ? 'Ngày nghỉ trong tuần' : 'Days off each week'}
        </legend>
        <div className="flex flex-wrap gap-2">
          {(isA ? WEEKDAY_LABELS_A : WEEKDAY_LABELS_B).map((label, d) => {
            const on = restDays.includes(d)
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleRestDay(d)}
                aria-pressed={on}
                className={`tap-44 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  on
                    ? 'bg-accent-500/20 border-accent-500/40 text-accent-400 theme-light:text-accent-800'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-xs text-rose-300 theme-light:text-rose-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!examDate || saving}
        className="tap-44 w-full rounded-xl bg-accent-500/15 border border-accent-500/30 px-3 py-3 text-sm font-semibold text-accent-400 theme-light:text-accent-800 hover:bg-accent-500/25 transition disabled:opacity-60"
      >
        {saving
          ? isA
            ? 'Đang tạo…'
            : 'Creating…'
          : isA
            ? 'Bắt đầu đếm ngược'
            : 'Start the countdown'}
      </button>
    </section>
  )
}

// ── Ba việc hôm nay ──────────────────────────────────────────────────────────
function TodayTasks({ plan, isA }: { plan: TodayPlan; isA: boolean }) {
  const navigate = useNavigate()

  const tasks = [
    plan.todayReviewItems > 0 && {
      key: 'review',
      icon: RotateCcw,
      title: isA
        ? `Ôn ${plan.todayReviewItems} thẻ đến hạn`
        : `Review ${plan.todayReviewItems} cards due today`,
      desc: isA
        ? 'Trả nợ cũ trước — đây là phần dễ quên nhất.'
        : 'Clear the backlog first — this is the part you forget fastest.',
      to: `${duongDanLoTrinh('A1')}?tab=srs`,
    },
    plan.todayNewItems > 0 && {
      key: 'new',
      icon: BookOpen,
      title: isA ? `Học ${plan.todayNewItems} mục mới` : `Learn ${plan.todayNewItems} new items`,
      desc: isA
        ? 'Đúng bằng phần chia đều từ nay tới ngày thi.'
        : 'Exactly your share when the work is spread evenly up to exam day.',
      to: duongDanMonTiengAnh(),
    },
    {
      key: 'speak',
      icon: Sparkles,
      title: isA ? 'Nói thử 5 phút' : 'Speak for 5 minutes',
      desc: isA
        ? 'Phần dễ bỏ nhất khi ôn thi, và mất điểm nhiều nhất.'
        : 'The easiest part to skip while cramming — and the one that costs the most marks.',
      to: duongDanLuyenNoi(),
    },
  ].filter(Boolean) as Array<{
    key: string
    icon: typeof BookOpen
    title: string
    desc: string
    to: string
  }>

  return (
    <section aria-labelledby="today-heading" className="space-y-2">
      <h2 id="today-heading" className="text-sm font-semibold text-white">
        {plan.phase === 'taper'
          ? isA
            ? 'Mấy ngày cuối — chỉ ôn lại'
            : 'Final days — review only'
          : isA
            ? 'Hôm nay'
            : 'Today'}
      </h2>
      {tasks.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => navigate(t.to)}
          className="tap-44 w-full text-left flex items-start gap-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-3.5 hover:border-zinc-700 transition"
        >
          <t.icon className="w-5 h-5 mt-0.5 shrink-0 text-accent-400 theme-light:text-accent-800" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">{t.title}</span>
            <span className="block text-xs text-zinc-300 mt-0.5">{t.desc}</span>
          </span>
        </button>
      ))}
    </section>
  )
}

export default function ExamPlanPage() {
  // [Slice 04] Chữ giao diện theo ngôn ngữ giao diện, không theo chiều học Tiếng Anh.
  const isA = useLang().lang === 'vi'
  usePageTitle(
    isA ? 'Đếm ngược kỳ thi | Đồng Hành Cùng Bạn' : 'Exam countdown | Đồng Hành Cùng Bạn',
  )
  const { user } = useAuth()
  const uid = user?.id ?? ''
  const [record, setRecord] = useState<ExamPlanRecord | null>(null)
  const [plan, setPlan] = useState<TodayPlan | null>(null)
  const [loading, setLoading] = useState(true)
  // [changelog 0525] Lỗi TẢI tách khỏi "chưa có kế hoạch" — xem chú thích ở `fetchExamPlan`.
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const toast = useToast()

  const apply = useCallback(
    (rec: ExamPlanRecord | null) => {
      const next = rec && uid ? computeTodayPlan(rec, uid) : null
      setRecord(rec)
      setPlan(next)
      setLoading(false)
      // Nối vào FSRS: càng gần ngày thi, mức nhớ mục tiêu càng cao → lịch ôn dày lên. Không có
      // kế hoạch thì trả về mặc định 0,9. Xem lib/srs.ts mục "Mức nhớ mục tiêu".
      if (uid) setExamRetention(uid, next?.requestRetention ?? null)
    },
    [uid],
  )

  // Cờ `alive` để không setState sau khi component đã rời màn hình (cùng khuôn ReferralSection).
  // Lỗi tải: KHÔNG gọi `apply` — giữ nguyên mức nhớ FSRS đang có, chỉ hiện lỗi + Thử lại.
  const loiTai = useCallback(
    (err: unknown) => {
      setLoading(false)
      setLoadError(
        thongDiepLoiThanThien(
          err,
          isA
            ? 'Chưa tải được kế hoạch ôn thi. Kiểm tra kết nối rồi thử lại.'
            : 'Could not load your exam plan. Check your connection and try again.',
          isA ? 'vi' : 'en',
        ),
      )
    },
    [isA],
  )

  useEffect(() => {
    let alive = true
    fetchExamPlan().then(
      (rec) => {
        if (alive) apply(rec)
      },
      (err: unknown) => {
        if (alive) loiTai(err)
      },
    )
    return () => {
      alive = false
    }
  }, [apply, loiTai, attempt])

  function retryLoad() {
    setLoadError(null)
    setLoading(true)
    setAttempt((n) => n + 1)
  }

  async function reload() {
    try {
      apply(await fetchExamPlan())
    } catch (err) {
      loiTai(err)
    }
  }

  // Bản cũ: kết thúc thất bại thì im lặng — người học bấm mà không thấy gì xảy ra.
  async function handleEnd() {
    if (!record) return
    if (await endExamPlan(record.id)) {
      setRecord(null)
      setPlan(null)
    } else {
      toast.error(
        isA
          ? 'Chưa kết thúc được kế hoạch — kiểm tra kết nối rồi thử lại.'
          : 'Could not end the plan — check your connection and try again.',
      )
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout backTo={duongDanMonTiengAnh()} title={isA ? 'Ôn thi' : 'Exam prep'} />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Đồng hồ đếm ngược + 3 việc hôm nay → width reading. */}
      <PageShell width="reading" baseWidth="max-w-2xl" className="!pb-[calc(1.5rem+var(--bnav-h))]">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? 'Ôn thi' : 'Exam prep'}
        </h1>

        {loading ? (
          /* Skeleton thay vòng xoay: giữ đúng khung nội dung sắp hiện, đỡ giật layout. */
          <div
            className="space-y-5 py-4"
            aria-busy="true"
            aria-label={isA ? 'Đang tải kế hoạch ôn thi' : 'Loading your exam plan'}
          >
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : loadError ? (
          <LoadError
            message={loadError}
            onRetry={retryLoad}
            lang={isA ? 'vi' : 'en'}
            hint={
              isA
                ? 'Kế hoạch ôn thi của bạn vẫn còn nguyên — đây chỉ là lỗi kết nối.'
                : 'Your exam plan is safe — this is only a connection problem.'
            }
          />
        ) : !record || !plan ? (
          <CreateForm uid={uid} isA={isA} onCreated={() => void reload()} />
        ) : (
          <div className="space-y-5">
            {/* Đồng hồ đếm ngược — nhân vật chính của màn hình này. */}
            <section className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-5 text-center">
              <p className="flex items-center justify-center gap-2 text-xs text-zinc-300">
                <CalendarClock className="w-4 h-4" aria-hidden />
                {isA ? EXAM_NAME_A : EXAM_NAME_B} · {plan.examDate}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                {daysLabel(plan.daysLeft, isA)}
              </p>
              {record.targetLabel && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-300">
                  <Target className="w-3.5 h-3.5" aria-hidden />
                  {isA ? 'Mục tiêu bạn đặt' : 'Your target'}: {record.targetLabel}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-300">
                {isA
                  ? `Đã nắm ${plan.masteredItems}/${plan.scopeItems} mục trong phạm vi thi`
                  : `${plan.masteredItems}/${plan.scopeItems} items mastered in the exam scope`}
              </p>
              {/* Nói THẲNG giới hạn đã biết của chiều B thay vì để người học tự phát hiện — cùng
                  tinh thần luật 4.3 "không kịp thì nói thẳng". Xem ghi chú ở ExamKindSchema. */}
              {!isA && (
                <p className="mt-2 text-xs text-zinc-300">
                  Scope note: these items come from the app’s A1–B1 word pairs, studied Vietnamese →
                  English. The levels shown are CEFR levels of the English side, not official
                  Vietnamese proficiency levels — a graded Vietnamese word list is still being
                  written.
                </p>
              )}
            </section>

            {/* Không kịp thì NÓI THẲNG, kèm đề xuất cắt phạm vi. */}
            {plan.feasibility === 'not-feasible' && plan.suggestedScopeCut !== null && (
              <section
                role="alert"
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
              >
                <h2 className="text-sm font-semibold text-amber-200 theme-light:text-amber-900">
                  {isA
                    ? 'Với quỹ thời gian này, học hết phạm vi là không kịp'
                    : 'With this much time, covering the whole scope will not fit'}
                </h2>
                {isA ? (
                  <p className="mt-1.5 text-xs text-zinc-200">
                    Nói thẳng để bạn còn kịp đổi cách: nên bỏ bớt khoảng{' '}
                    <strong>{plan.suggestedScopeCut} mục</strong> ít gặp trong đề, dồn sức vào phần
                    còn lại. Hoặc nâng số mục mỗi ngày nếu bạn thật sự có thời gian.
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-zinc-200">
                    Saying it plainly while you can still change course: drop about{' '}
                    <strong>{plan.suggestedScopeCut} items</strong> that rarely come up, and put
                    your effort into the rest. Or raise your daily cap if you genuinely have the
                    time.
                  </p>
                )}
              </section>
            )}

            {plan.feasibility === 'tight' && (
              <p className="text-xs text-zinc-300">
                {isA
                  ? 'Lịch đang khá sát — nghỉ một hôm là phải bù. Cân nhắc nâng số mục mỗi ngày một chút.'
                  : 'The plan is tight — a day off has to be made up later. Consider raising your daily cap a little.'}
              </p>
            )}

            <TodayTasks plan={plan} isA={isA} />

            <button
              type="button"
              onClick={handleEnd}
              className={buttonClass({
                variant: 'outline',
                size: 'sm',
                fullWidth: true,
                className: 'tap-44',
              })}
            >
              {isA ? 'Kết thúc kế hoạch này' : 'End this plan'}
            </button>
          </div>
        )}
      </PageShell>
    </div>
  )
}

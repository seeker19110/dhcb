import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { duongDanMonTiengAnh } from '../../lib/subjectsHost'
import { duongDanLuyenViet, duongDanSoTayLoiSai } from '../../lib/englishRoutes'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import QuickActions from '../../components/QuickActions'
import SubjectProgressSection from '../../components/SubjectProgressSection'
import DashboardWeeklyOverview from '../../components/DashboardWeeklyOverview'
import DashboardEnglishDetails from '../../components/DashboardEnglishDetails'
import { usePageTitle } from '../../lib/usePageTitle'
import { useIsDesktopViewport, useMediaQuery } from '../../lib/useIsDesktopViewport'
import { PageShell } from '@core/PageShell'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../context/useLang'
import { useCloudSync } from '../../lib/useCloudSync'
import { useOnboarding } from '../../lib/onboarding'
import { getStreak, getChatSessions, getWritingSubs, getSpeakingSessions } from '../../lib/storage'
import { getLearnedWords, getLearnedCount } from '../../lib/vocab'
import { getSRSStats } from '../../lib/srs'
import { getMistakeStats } from '../../lib/mistakes'
import { getExamMap } from '../../lib/cefrExam'
import {
  loadCurriculum,
  getPathProgress,
  getDailyLearned,
  getDailySpeed,
} from '../../lib/curriculum'
import {
  getActivity7Days,
  getWeekTotal,
  getCefrProgress,
  getActivityCalendar,
  getWritingProgress,
  type LevelProgress,
} from '../../lib/stats'
import { getWeeklyProgress } from '../../lib/weeklyGoal'
import { effectivePlan } from '../../lib/promo'
import { fetchWeeklyCredit, type WeeklyCreditInfo } from '../../lib/weeklyCredit'

// Số tuần của lịch hoạt động trên desktop (bố cục tuần-theo-cột — xem chú thích ở khối
// render). HAI mức, chọn theo bề ngang thật ĐO ĐƯỢC chứ không theo cảm giác: cột trái
// (sidebar 256px) và cột phải ngữ cảnh ăn hết phần lớn màn 1024px, nên thẻ ở đó chỉ còn
// ~430px = vừa 13 tuần (một quý); từ 1280px trở lên thẻ mới đủ rộng cho 26 tuần (nửa năm).
// Đặt sai ngưỡng thì lịch bị CẮT giữa chừng — trông như lỗi render chứ không như nội dung
// cuộn được.
const CALENDAR_WEEKS_WIDE = 26
const CALENDAR_WEEKS_DESKTOP = 13

type DashboardResource<T> =
  | { key: string; status: 'loading' }
  | { key: string; status: 'ready'; data: T }
  | { key: string; status: 'error' }

export default function Dashboard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { lang } = useLang()
  const vi = lang === 'vi'
  // PHẢI dùng giá trị trả về (xem cảnh báo trong useCloudSync.ts) — thêm vào deps của mọi
  // useMemo bên dưới đọc localStorage, nếu không stats sẽ đứng yên ở 0 trên thiết bị mới cho
  // tới khi có lý do khác khiến deps đổi (bug đã xác nhận 2026-07-28).
  const syncVersion = useCloudSync(user?.id)
  const onboarding = useOnboarding(user?.id) // nhóm tuổi (GĐ 4, PROGRESS.md) — lọc % lộ trình
  // Cột ngữ cảnh phải ở desktop (≥1024px): khối "Tuần này" (DashboardWeeklyOverview, gộp
  // streak/mục tiêu/lịch từ R3-3) + QuickActions dời sang đó thay vì nằm ở đầu/cuối cột chính —
  // một cây DOM duy nhất, CSS grid area đổi vị trí thị giác, không remount (R3-2).
  const isDesktop = useIsDesktopViewport()
  // ≥1280px thì thẻ lịch đủ rộng cho nửa năm; 1024–1279px chỉ đủ một quý (xem hằng số ở trên).
  const isWide = useMediaQuery('(min-width: 1280px)')
  const calendarWeeks = isWide ? CALENDAR_WEEKS_WIDE : CALENDAR_WEEKS_DESKTOP
  const [calendarSelectedDate, setCalendarSelectedDate] = useState('')
  // Disclosure "Chi tiết Tiếng Anh" (R3-4, §6.3) — đóng mặc định ở MỌI viewport, không
  // localStorage, không tự mở/đóng vì breakpoint/lỗi/dữ liệu. CEFR heading nằm trong panel này
  // nên chỉ có thể là activeElement khi panel đang mở — nhờ vậy focus recovery của CEFR bên
  // dưới không cần biết state này: nếu panel đã đóng trước khi resolve, nút Retry (nằm trong
  // panel `hidden`) đã bị component con tự chuyển focus ra toggle rồi (§6.3), nên
  // `document.activeElement === cefrRetryRef.current` tự nhiên là false.
  const [englishDetailsExpanded, setEnglishDetailsExpanded] = useState(false)

  const [curriculumRetryRevision, setCurriculumRetryRevision] = useState(0)
  const curriculumRetryGuardRef = useRef(false)
  const cefrRetryRef = useRef<HTMLButtonElement>(null)
  const shouldRecoverCefrFocusRef = useRef(false)
  const [cefrResource, setCefrResource] = useState<DashboardResource<LevelProgress[]>>({
    key: '',
    status: 'loading',
  })
  // Lượt AI: hạn mức là TỔNG/ngày cho MỌI gói (GĐ1), không suy ra được từ dữ liệu local
  // per-mode — phải hỏi server (usage-summary.ts). [audit M9] Trước đây chỉ hỏi cho gói Free,
  // VIP đọc hạn mức theo chế độ đã bỏ → hiện "0/".
  const [weeklyRetryRevision, setWeeklyRetryRevision] = useState(0)
  const weeklyRetryGuardRef = useRef(false)
  const weeklyRetryRef = useRef<HTMLButtonElement>(null)
  const shouldRecoverWeeklyFocusRef = useRef(false)
  const [weeklyCreditResource, setWeeklyCreditResource] = useState<
    DashboardResource<WeeklyCreditInfo | null>
  >({ key: '', status: 'loading' })

  const currentPlan = user ? effectivePlan(user.plan) : 'free'
  const weeklyCreditKey = `weekly-credit:${user?.id ?? 'anonymous'}:${currentPlan}:${weeklyRetryRevision}`
  const cefrKey = `cefr:${user?.id ?? 'anonymous'}:${syncVersion}:${curriculumRetryRevision}`
  const weeklyCredit: DashboardResource<WeeklyCreditInfo | null> =
    weeklyCreditResource.key === weeklyCreditKey
      ? weeklyCreditResource
      : { key: weeklyCreditKey, status: 'loading' }
  const cefrState: DashboardResource<LevelProgress[]> =
    cefrResource.key === cefrKey ? cefrResource : { key: cefrKey, status: 'loading' }
  const weeklyCreditInfo =
    weeklyCredit.status === 'ready' &&
    weeklyCredit.data &&
    weeklyCredit.data.freeWeeklyCredit !== null
      ? { ...weeklyCredit.data, freeWeeklyCredit: weeklyCredit.data.freeWeeklyCredit }
      : null
  const cefr = cefrState.status === 'ready' ? cefrState.data : []
  const ready = cefrState.status === 'ready'

  usePageTitle('Tiến độ học tập | Đồng Hành Cùng Bạn')

  useEffect(() => {
    if (!user) return
    let alive = true
    fetchWeeklyCredit().then((info) => {
      if (!alive) return
      weeklyRetryGuardRef.current = false
      shouldRecoverWeeklyFocusRef.current =
        info !== null &&
        weeklyRetryRef.current !== null &&
        document.activeElement === weeklyRetryRef.current
      setWeeklyCreditResource(
        info
          ? { key: weeklyCreditKey, status: 'ready', data: info }
          : { key: weeklyCreditKey, status: 'error' },
      )
    })
    return () => {
      alive = false
    }
  }, [user, weeklyCreditKey])
  // Kết quả thi cuối cấp — để hiện huy hiệu "🎓 Đã qua" cạnh từng cấp.
  // syncVersion: KHÔNG dùng trong thân hàm nhưng BẮT BUỘC có trong deps — báo hiệu cloud sync
  // vừa kéo dữ liệu mới, cần đọc lại localStorage (xem cảnh báo trong useCloudSync.ts).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const examMap = useMemo(() => getExamMap(user?.id ?? ''), [user, syncVersion])

  // Nạp dữ liệu từ điển (cho tiến độ lộ trình) + tiến độ CEFR — đều bất đồng bộ.
  useEffect(() => {
    if (!user) return
    let alive = true
    ;(async () => {
      try {
        await loadCurriculum()
        const levels = await getCefrProgress(getLearnedWords(user.id))
        if (!alive) return
        curriculumRetryGuardRef.current = false
        shouldRecoverCefrFocusRef.current =
          cefrRetryRef.current !== null && document.activeElement === cefrRetryRef.current
        setCefrResource({ key: cefrKey, status: 'ready', data: levels })
      } catch {
        if (!alive) return
        curriculumRetryGuardRef.current = false
        setCefrResource({ key: cefrKey, status: 'error' })
      }
    })()
    return () => {
      alive = false
    }
    // syncVersion: nạp lại tiến độ CEFR sau khi cloud sync xong (learned words vừa được kéo
    // từ server về có thể khác bản local cũ trên thiết bị này).
  }, [cefrKey, user])

  useLayoutEffect(() => {
    if (weeklyCredit.status === 'ready' && shouldRecoverWeeklyFocusRef.current) {
      document.querySelector<HTMLElement>('#dashboard-weekly-credit-heading')?.focus()
      shouldRecoverWeeklyFocusRef.current = false
    }
  }, [weeklyCredit.key, weeklyCredit.status])

  useLayoutEffect(() => {
    if (cefrState.status === 'ready' && shouldRecoverCefrFocusRef.current) {
      document.querySelector<HTMLElement>('#dashboard-cefr-heading')?.focus()
      shouldRecoverCefrFocusRef.current = false
    }
  }, [cefrState.key, cefrState.status])

  function retryWeeklyCredit() {
    if (weeklyRetryGuardRef.current || weeklyCredit.status === 'loading') return
    weeklyRetryGuardRef.current = true
    setWeeklyRetryRevision((revision) => revision + 1)
  }

  function retryCurriculum() {
    if (curriculumRetryGuardRef.current || cefrState.status === 'loading') return
    curriculumRetryGuardRef.current = true
    setCurriculumRetryRevision((revision) => revision + 1)
  }

  // Số liệu đọc tức thì từ localStorage (re-tính khi đã nạp xong dữ liệu).
  const stats = useMemo(() => {
    if (!user) return null
    return {
      streak: getStreak(user.id),
      week: getActivity7Days(user.id),
      weekTotal: getWeekTotal(user.id),
      // Desktop có bề ngang để kể chuyện dài hơn: 16 tuần (một quý) thay vì 5 tuần.
      // Xem chú thích ở khối render — lịch desktop xếp TUẦN THEO CỘT nên thêm tuần là
      // rộng ra, không phải cao lên.
      calendar: getActivityCalendar(user.id, isDesktop ? calendarWeeks * 7 : 35),
      weekly: getWeeklyProgress(user.id),
      writing: getWritingProgress(user.id),
      learnedToday: getDailyLearned(user.id),
      learnedTotal: getLearnedCount(user.id),
      dailySpeed: getDailySpeed(user.id),
      path: ready
        ? getPathProgress(getLearnedWords(user.id), onboarding?.ageGroup)
        : { done: 0, total: 0 },
      srs: getSRSStats(user.id),
      mistakes: getMistakeStats(user.id),
      chatN: getChatSessions(user.id).length,
      writeN: getWritingSubs(user.id).length,
      speakN: getSpeakingSessions(user.id).length,
    }
    // syncVersion: bắt buộc có trong deps dù không dùng trong thân hàm — xem examMap ở trên.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ready, onboarding?.ageGroup, syncVersion, isDesktop, calendarWeeks])

  if (!user || !stats) return null

  // Nhãn thứ bắt đầu từ Thứ 2 — cho lưới lịch heatmap.
  const WDOW = vi ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const wp = stats.writing

  // Tổng tiến độ CEFR (trung bình % 4 cấp) — chỉ để hiển thị 1 con số tổng quan.
  const cefrOverall = cefr.length
    ? Math.round(cefr.reduce((s, l) => s + l.pct, 0) / cefr.length)
    : 0

  return (
    <div className="min-h-dvh bg-zinc-950">
      {/* [tiêu đề chuyển lên thanh header] Trước đây `<Layout />` không nhận title, tiêu đề to
          + mô tả nằm riêng trong `<PageHeader>` ở thân trang — theo yêu cầu người dùng, tiêu đề
          nay hiện NGAY trên thanh header (cùng khuôn Home.tsx đang dùng `title={T.greeting}`),
          mô tả phụ (subtitle) bị bỏ hẳn, không chuyển đi đâu khác. */}
      <Layout title={vi ? 'Tiến độ học' : 'Your Progress'} />

      {/* [đợt nhỏ tận dụng khoảng trống desktop] `fluid` thay `standard`: lưới bên dưới đã dùng
          `minmax(0,1fr)_minmax(18rem,22rem)` nên cột trái tự co giãn theo khoảng trống thật. */}
      <PageShell width="fluid" baseWidth="max-w-3xl">
        {/* Một cây DOM duy nhất ở mọi viewport. Grid chỉ đổi vị trí thị giác trên desktop;
            thứ tự đọc/Tab luôn là header → môn → tuần → English → công cụ. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          {/* `sr-only`: tiêu đề đã hiện ở thanh header, khối này chỉ giữ đúng MỘT thẻ h1 cho
              a11y (đọc màn hình/cấu trúc trang) — cùng khuôn `Home.tsx`. */}
          <h1 tabIndex={-1} className="sr-only focus:outline-none lg:col-span-2">
            {vi ? 'Tiến độ học' : 'Your Progress'}
          </h1>

          <div className="lg:col-start-1 lg:row-start-2">
            <SubjectProgressSection uid={user.id} plan={effectivePlan(user.plan)} />
          </div>

          <div
            data-dashboard-region="weekly"
            className="min-w-0 space-y-6 lg:col-start-2 lg:row-start-2"
          >
            <DashboardWeeklyOverview
              vi={vi}
              weekTotal={stats.weekTotal}
              weekly={stats.weekly}
              onChangeGoal={() => nav('/trang-ca-nhan')}
              calendar={{
                calendar: stats.calendar,
                uid: user.id,
                isDesktop,
                weeks: isDesktop ? calendarWeeks : 5,
                wdow: WDOW,
                selectedDate: calendarSelectedDate,
                onSelectedDateChange: setCalendarSelectedDate,
              }}
            />
          </div>

          <div
            data-dashboard-region="english"
            className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-3"
          >
            {/* R3-4 (§6.3): summary luôn hiện (từ cần ôn · lộ trình · lượt AI) + panel chi tiết
                đóng mặc định ở mọi viewport — xem boundary DashboardEnglishDetails. */}
            <DashboardEnglishDetails
              vi={vi}
              expanded={englishDetailsExpanded}
              onToggle={() => setEnglishDetailsExpanded((value) => !value)}
              srsDue={stats.srs.due}
              weeklyCredit={{
                info: weeklyCreditInfo,
                status: weeklyCredit.status,
                retryRevision: weeklyRetryRevision,
              }}
              weeklyCreditRetryRef={weeklyRetryRef}
              onRetryWeeklyCredit={retryWeeklyCredit}
              learnedToday={stats.learnedToday}
              dailySpeed={stats.dailySpeed}
              learnedTotal={stats.learnedTotal}
              srsTotal={stats.srs.total}
              pathDone={stats.path.done}
              pathTotal={stats.path.total}
              pathReady={ready}
              mistakesDue={stats.mistakes.due}
              mistakesTotal={stats.mistakes.total}
              onOpenMistakes={() => nav(duongDanSoTayLoiSai())}
              cefr={{
                state: cefrState,
                retryRevision: curriculumRetryRevision,
                examMap,
                overallPct: cefrOverall,
              }}
              cefrRetryRef={cefrRetryRef}
              onRetryCefr={retryCurriculum}
              writing={wp}
              onWriteFirst={() => nav(duongDanLuyenViet())}
              chatN={stats.chatN}
              writeN={stats.writeN}
              speakN={stats.speakN}
              englishSubjectHref={duongDanMonTiengAnh()}
            />
          </div>

          <div data-dashboard-region="actions" className="lg:col-start-2 lg:row-start-3">
            <QuickActions />
          </div>
        </div>
      </PageShell>
    </div>
  )
}

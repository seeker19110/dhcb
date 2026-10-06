// apps/dhcb/src/pages/EnglishSettings.tsx — Cài đặt: phần Chung (cả app) + phần Môn Tiếng Anh.
// [2026-09-22, audit P2-4] Tách hai mục bằng h2 vì trang chứa cả cài đặt nền tảng (ngôn ngữ,
// nhóm tuổi, giọng đọc, âm thanh) lẫn cài đặt riêng môn (tốc độ từ mới, mục tiêu tuần).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import { ArrowLeftRight, Gauge, CalendarCheck, Users, Volume2, VolumeX } from 'lucide-react'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import VoicePicker from '../../../components/VoicePicker'
import RateToggle from '../../../components/RateToggle'
import OfflineDownloadSetting from '../../../components/OfflineDownloadSetting'
import { useAuth } from '../../../context/useAuth'
import { useLang } from '../../../context/useLang'
import { getDirection, setDirection } from '../../../lib/storage'
import {
  getDailySpeed,
  setDailySpeed,
  DAILY_SPEEDS,
  type DailySpeed,
} from '../../../lib/curriculum'
import {
  getWeeklyGoal,
  setWeeklyGoal,
  WEEKLY_GOALS,
  type WeeklyGoal,
} from '../../../lib/weeklyGoal'
import { isSoundEnabled, setSoundEnabled, sound } from '../../../lib/sound'
import { useOnboarding, pushAgeGroup } from '../../../lib/onboarding'
import type { AgeGroup, Direction } from '../../../types'

const AGE_GROUP_OPTIONS: { value: AgeGroup; emoji: string; vi: string; en: string }[] = [
  { value: 'nhi_dong', emoji: '🧸', vi: 'Nhi đồng (<10)', en: 'Kids (<10)' },
  { value: 'thieu_nien', emoji: '🎒', vi: 'Thiếu niên (10–15)', en: 'Teens (10–15)' },
  { value: 'thanh_nien', emoji: '🎓', vi: 'Thanh niên (16–22)', en: 'Young adult (16–22)' },
  { value: 'nguoi_lon', emoji: '💼', vi: 'Người lớn (23+)', en: 'Adult (23+)' },
]

const SPEED_LABEL: Record<DailySpeed, { vi: string; en: string }> = {
  5: { vi: 'Nhẹ nhàng', en: 'Light' },
  10: { vi: 'Vừa', en: 'Regular' },
  20: { vi: 'Nhanh', en: 'Fast' },
}

const GOAL_LABEL: Record<WeeklyGoal, { vi: string; en: string }> = {
  3: { vi: 'Thoải mái', en: 'Relaxed' },
  5: { vi: 'Đều đặn', en: 'Steady' },
  7: { vi: 'Mỗi ngày', en: 'Every day' },
}

export default function EnglishSettings() {
  usePageTitle('Cài đặt | Môn tiếng Anh · Đồng hành cùng bạn')
  const nav = useNavigate()
  const { user } = useAuth()
  const { T, setLang } = useLang()

  const [dir, setDir] = useState<Direction>(getDirection)
  const [speed, setSpeed] = useState<DailySpeed>(() => getDailySpeed(user?.id ?? ''))
  const [weekGoal, setWeekGoal] = useState<WeeklyGoal>(() => getWeeklyGoal(user?.id ?? ''))
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled())
  const onboardingData = useOnboarding(user?.id)
  const [ageGroup, setAgeGroupState] = useState<AgeGroup>(
    () => onboardingData?.ageGroup ?? 'nguoi_lon',
  )

  if (!user) return null

  const isA = dir === 'A'

  function toggleDirection() {
    const next: Direction = dir === 'A' ? 'B' : 'A'
    setDirection(next)
    setDir(next)
    setLang(next === 'A' ? 'vi' : 'en')
  }

  function chooseSpeed(s: DailySpeed) {
    if (!user) return
    setDailySpeed(user.id, s)
    setSpeed(s)
  }

  function chooseWeekGoal(g: WeeklyGoal) {
    if (!user) return
    setWeeklyGoal(user.id, g)
    setWeekGoal(g)
  }

  function chooseAgeGroup(a: AgeGroup) {
    if (!user) return
    setAgeGroupState(a)
    void pushAgeGroup(user.id, a)
  }

  function chooseSound(enabled: boolean) {
    setSoundEnabled(enabled)
    setSoundOn(enabled)
    if (enabled) sound.correct()
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout onBack={() => nav(-1)} title={isA ? 'Cài đặt' : 'Settings'} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Biểu mẫu cài đặt → width reading, giữ hẹp. */}
      <PageShell
        width="reading"
        baseWidth="max-w-3xl"
        className="!pb-[calc(1.5rem+var(--bnav-h))] space-y-6"
      >
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? 'Cài đặt' : 'Settings'}
        </h1>

        <h2 className="text-sm font-semibold text-content-secondary pt-2">
          {isA ? 'Chung — áp dụng cho cả app' : 'General — whole app'}
        </h2>
        {/* Ngôn ngữ hiển thị & chiều học */}
        <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-semibold text-white">
              {isA ? 'Ngôn ngữ hiển thị & Chiều học' : 'Display language & Direction'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleDirection}
            title={isA ? T.toggleDirTitleA : T.toggleDirTitleB}
            aria-label={isA ? T.toggleDirTitleA : T.toggleDirTitleB}
            className={`w-full flex items-center justify-between gap-3 py-3 px-4 rounded-xl border transition ${
              isA
                ? 'bg-accent-500/10 border-accent-500/30 hover:border-accent-500/60'
                : 'bg-sky-500/10 border-sky-500/30 hover:border-sky-500/60'
            }`}
          >
            <span
              className={`text-sm font-semibold ${isA ? 'text-accent-300 theme-light:text-accent-700' : 'text-sky-300 theme-light:text-sky-700'}`}
            >
              {isA ? '🇻🇳 → 🇺🇸 Tiếng Việt (học tiếng Anh)' : '🇺🇸 → 🇻🇳 English (learn Vietnamese)'}
            </span>
            <span className="text-xs text-zinc-400">{isA ? 'Bấm để đổi' : 'Tap to switch'}</span>
          </button>
          <p className="text-xs text-zinc-400 mt-3">
            {isA
              ? 'Đổi cùng lúc chiều học (Việt học Anh ⇄ nước ngoài học Việt) và ngôn ngữ giao diện.'
              : 'Switches learning direction (Vietnamese ⇄ English) and interface language together.'}
          </p>
        </section>

        {/* Nhóm tuổi */}
        <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-semibold text-white">
              {isA ? 'Nhóm tuổi' : 'Age group'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AGE_GROUP_OPTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => chooseAgeGroup(a.value)}
                aria-pressed={ageGroup === a.value}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border transition ${
                  ageGroup === a.value
                    ? 'bg-accent-500/20 border-accent-500/60 text-accent-300 theme-light:text-accent-800'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-lg shrink-0">{a.emoji}</span>
                <span className="text-left">{isA ? a.vi : a.en}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            {isA
              ? 'Giúp app hiển thị giao diện và nội dung bài học phù hợp với độ tuổi của bạn.'
              : 'Helps customize lesson content and vocabulary to match your age group.'}
          </p>
        </section>

        {/* Chọn giọng đọc AI */}
        <VoicePicker plan={user.plan} isA={isA} />

        {/* Tốc độ phát */}
        <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-accent-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  {isA ? 'Tốc độ phát âm thanh' : 'Playback speed'}
                </p>
                <p className="text-xs text-zinc-400">
                  {isA
                    ? 'Áp dụng cho mọi nút nghe trong bài học'
                    : 'Applies to every listen button'}
                </p>
              </div>
            </div>
            <RateToggle />
          </div>
        </section>

        {/* Âm thanh phản hồi UI */}
        <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-accent-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-accent-400" />
            )}
            <span className="text-sm font-semibold text-white">
              {isA ? 'Âm thanh khi học' : 'Study sound effects'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => chooseSound(true)}
              aria-pressed={soundOn}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition ${
                soundOn
                  ? 'bg-accent-500/20 border-accent-500/60 text-accent-300 theme-light:text-accent-800'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Volume2 className="w-4 h-4" /> {isA ? 'Bật' : 'On'}
            </button>
            <button
              onClick={() => chooseSound(false)}
              aria-pressed={!soundOn}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition ${
                !soundOn
                  ? 'bg-accent-500/20 border-accent-500/60 text-accent-300 theme-light:text-accent-800'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <VolumeX className="w-4 h-4" /> {isA ? 'Tắt' : 'Off'}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            {isA
              ? 'Tiếng "ting" nhỏ khi trả lời đúng/sai và khi đạt mốc (streak, huy hiệu).'
              : 'A small "ting" when you answer right/wrong and when you hit a milestone.'}
          </p>
        </section>

        <h2 className="text-sm font-semibold text-content-secondary pt-2">
          {isA ? 'Môn tiếng Anh' : 'English subject'}
        </h2>
        {/* Tốc độ học: số từ mới/ngày */}
        <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-semibold text-white">
              {isA ? 'Tốc độ học (từ mới/ngày)' : 'Learning speed (new words/day)'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DAILY_SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => chooseSpeed(s)}
                aria-pressed={speed === s}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl text-sm font-medium border transition ${
                  speed === s
                    ? 'bg-accent-500/20 border-accent-500/60 text-accent-300 theme-light:text-accent-800'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-base font-bold">{s}</span>
                <span className="text-[11px]">{isA ? SPEED_LABEL[s].vi : SPEED_LABEL[s].en}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            {isA
              ? 'Đổi tốc độ chỉ áp dụng cho các batch từ mới tiếp theo, không ảnh hưởng từ đã học.'
              : 'Changing speed only affects upcoming batches, not words already learned.'}
          </p>
        </section>

        {/* Mục tiêu tuần: số ngày học/tuần */}
        <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-semibold text-white">
              {isA ? 'Mục tiêu tuần (số ngày học/tuần)' : 'Weekly goal (study days/week)'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WEEKLY_GOALS.map((g) => (
              <button
                key={g}
                onClick={() => chooseWeekGoal(g)}
                aria-pressed={weekGoal === g}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl text-sm font-medium border transition ${
                  weekGoal === g
                    ? 'bg-accent-500/20 border-accent-500/60 text-accent-300 theme-light:text-accent-800'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-base font-bold">{g}</span>
                <span className="text-[11px]">{isA ? GOAL_LABEL[g].vi : GOAL_LABEL[g].en}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            {isA
              ? 'Tuần tính từ Thứ 2. Ngày có học bất kỳ hoạt động nào (từ vựng, chat, viết, nói) đều được tính.'
              : 'Weeks start on Monday. Any study activity counts towards your weekly goal.'}
          </p>
        </section>

        {/* Tải để học ngoại tuyến (audit M14) — dữ liệu tải về là của môn Tiếng Anh. */}
        <OfflineDownloadSetting isA={isA} />
      </PageShell>
    </div>
  )
}

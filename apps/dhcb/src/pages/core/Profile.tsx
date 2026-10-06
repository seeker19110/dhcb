// apps/dhcb/src/pages/Profile.tsx — Trung tâm Không gian Cá nhân & Đồng Hành (Personal Command Center)
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  History as HistoryIcon,
  LogOut,
  Mail,
  Flame,
  BookOpen,
  Award,
  Gift,
  ChevronDown,
  ChevronRight,
  Loader2,
  Settings,
  Users,
  MessageSquare,
  MessageSquareHeart,
  Sparkles,
} from 'lucide-react'
import Layout from '../../components/Layout'
import ThemeToggle from '../../components/ThemeToggle'
import LoadError from '../../components/LoadError'
import { Skeleton } from '../../components/Skeleton'
import ReferralSection from '../../components/ReferralSection'
import CompanionLinkSection from '../../components/CompanionLinkSection'
import QuestsPanel from '../../components/QuestsPanel'
import EmailVerifySection from '../../components/EmailVerifySection'
import TwoFactorSection from '../../components/TwoFactorSection'
import PasswordChangeSection from '../../components/PasswordChangeSection'
import { clearStoredToken } from '@core/authHeader'
import UpgradeSection from '../../components/UpgradeSection'
import PricePromoBanner from '../../components/PricePromoBanner'
import FeedbackModal from '../../components/FeedbackModal'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../context/useLang'
import { useToast } from '@core/ToastProvider'
import { useCloudSync } from '../../lib/useCloudSync'
import { getStreak } from '../../lib/storage'
import { getLearnedCount } from '../../lib/vocab'
import {
  checkNewAchievements,
  achievementMessage,
  getEarnedAchievements,
} from '../../lib/achievements'
import {
  fetchAchievementRewards,
  claimAchievementReward,
  type AchievementRewardStatus,
} from '../../lib/achievementRewards'
import { ACHIEVEMENTS } from '../../data/achievements'
import { logout } from '../../lib/auth'
import { navigateTo } from '../../lib/subjectsHost'
import { PageShell } from '@core/PageShell'
import { TwoPane } from '@core/TwoPane'
import { useIsDesktopViewport } from '../../lib/useIsDesktopViewport'
import { STUDIOS } from '../../lib/studios'

export default function Profile() {
  const nav = useNavigate()
  const { user, refresh } = useAuth()
  const { T, lang } = useLang()
  const toast = useToast()
  useCloudSync(user?.id)

  // [Slice 04] Chữ giao diện theo ngôn ngữ giao diện, không theo chiều học Tiếng Anh.
  const isA = lang === 'vi'

  const [earned, setEarned] = useState<Set<string>>(() => getEarnedAchievements(user?.id ?? ''))
  const [rewards, setRewards] = useState<AchievementRewardStatus[] | null>(null)
  // Trạng thái TẢI phần thưởng huy hiệu — trước đây chỉ `void ...then(setRewards)` nên
  // lỗi mạng/API im lặng: khối thưởng biến mất, người dùng tưởng mình không có gì.
  const [rewardsLoading, setRewardsLoading] = useState(true)
  const [rewardsError, setRewardsError] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [questsOpen, setQuestsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  // Gọi trước `if (!user) return null` bên dưới — hook có điều kiện là vi phạm Rules of Hooks.
  const isDesktop = useIsDesktopViewport()

  usePageTitle('Trang cá nhân | Đồng Hành Cùng Bạn')

  // Backfill huy hiệu — chạy trong callback bất đồng bộ để không setState đồng bộ
  // trong effect (luật react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!user) return
    let alive = true
    void Promise.resolve().then(() => {
      if (!alive) return
      const fresh = checkNewAchievements(user.id)
      if (fresh.length > 0) {
        setEarned(getEarnedAchievements(user.id))
        for (const a of fresh) toast.success(achievementMessage(a, isA))
      }
    })
    return () => {
      alive = false
    }
  }, [user, isA, toast])

  // Thưởng huy hiệu
  const loadRewards = useCallback(() => {
    setRewardsLoading(true)
    setRewardsError(false)
    // fetchAchievementRewards đã nuốt lỗi và trả null — coi null là LỖI TẢI để còn
    // hiện nút "Thử lại" (danh sách rỗng hợp lệ vẫn là mảng []).
    void fetchAchievementRewards()
      .then((items) => {
        if (items) setRewards(items)
        else setRewardsError(true)
      })
      .catch(() => setRewardsError(true))
      .finally(() => setRewardsLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    void Promise.resolve().then(loadRewards)
  }, [user, loadRewards])

  async function handleClaimReward(id: string) {
    setClaimingId(id)
    const result = await claimAchievementReward(id)
    setClaimingId(null)
    if (result) {
      const planLabel = result.rewardPlan === 'vip' ? 'VIP' : 'Pro'
      toast.success(
        isA
          ? `Tuyệt vời! Tặng thêm ${result.rewardDays} ngày gói ${planLabel} 🎁`
          : `Nice! +${result.rewardDays} day of ${planLabel} 🎁`,
      )
      loadRewards()
    } else {
      toast.error(isA ? 'Chưa nhận được, thử lại sau nhé' : 'Could not claim right now')
    }
  }

  async function handleLogout() {
    await logout()
    await refresh()
    nav('/login')
  }

  async function passwordChanged() {
    clearStoredToken()
    try {
      await refresh()
      toast.success(
        isA
          ? 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.'
          : 'Password changed. Please sign in again.',
      )
      nav('/login', { replace: true })
    } catch {
      // Mật khẩu đã đổi và phiên đã thu hồi: tải lại trang đăng nhập nếu refresh lỗi,
      // không để UI giữ hồ sơ đã đăng xuất hoặc báo nhầm đổi mật khẩu thất bại.
      window.location.replace('/login')
    }
  }

  if (!user) return null

  const streak = getStreak(user.id)
  const learned = getLearnedCount(user.id)

  // [2026-09-22, audit UI/UX P1-3] Trước đây có HAI khối cách nhau ~150px cùng liệt kê Ghi chú ·
  // Góc học tập · Bạn Đồng Hành ("Không gian" từ STUDIOS + "Không Gian Chuyên Biệt (Hubs)"). Nay
  // chỉ còn MỘT khối: STUDIOS + hai đích chưa có trong STUDIOS (Bạn bè · Tin nhắn).
  const EXTRA_HUBS = [
    {
      path: '/ban-be',
      title: isA ? 'Bạn bè' : 'Friends',
      desc: isA ? 'Kết bạn qua link/QR' : 'Add friends via link/QR code',
      icon: Users,
      color: 'text-cyan-400 theme-light:text-cyan-900',
      bg: 'bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/60',
    },
    {
      path: '/tin-nhan',
      title: isA ? 'Tin nhắn' : 'Chat & Direct Messages',
      desc: isA ? 'Nhắn tin 1-1 với bạn bè' : 'Real-time 1-on-1 chat with friends',
      icon: MessageSquare,
      color: 'text-blue-400 theme-light:text-blue-800',
      bg: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60',
    },
  ]

  /* Cột phải ở desktop: DANH TÍNH + số liệu nhanh — thông tin để TRA CỨU, không phải để thao
     tác. Đưa chúng ra khỏi luồng dọc để cột chính bắt đầu ngay bằng các mục hành động được
     (không gian chuyên biệt, cài đặt, nhiệm vụ) thay vì đẩy chúng xuống dưới hai thẻ tĩnh. */
  const rail = (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line-subtle bg-surface-card p-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-400 text-2xl font-bold text-white">
          {user.name[0]?.toUpperCase()}
        </div>
        <p className="t-body mt-3 break-words font-semibold text-content">{user.name}</p>
        <p className="t-caption mt-1 flex items-center justify-center gap-1.5 break-words text-content-muted">
          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {user.email}
        </p>
        <span
          className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
            user.plan === 'vip'
              ? 'border border-violet-500/20 bg-violet-500/15 text-violet-300 theme-light:text-violet-800'
              : 'border border-line-strong bg-surface-raised text-content-muted'
          }`}
        >
          {user.plan === 'vip' ? T.planVip : T.planFree}
        </span>
        {/* Huy hiệu "Người tiên phong" — 2026 tài khoản đầu tiên, VIP vĩnh viễn.
            Chỉ là ghi nhận hiển thị: quyền VIP do server quyết qua (plan, plan_expires_at),
            xem packages/core-billing/founder.ts. Màu lấy từ token nhấn theo theme. */}
        {user.isFounder ? (
          <span className="t-caption mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent-500/25 bg-accent-500/10 px-2.5 py-1 font-medium text-accent-300 theme-light:text-accent-900">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isA ? 'Người tiên phong · VIP vĩnh viễn' : 'Founding member · Lifetime VIP'}
          </span>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line-subtle bg-surface-card p-3 text-center">
          <Flame
            className={`mx-auto h-5 w-5 ${streak > 0 ? 'text-orange-400 theme-light:text-orange-900' : 'text-content-muted'}`}
            aria-hidden="true"
          />
          <p className="t-h3 mt-1.5 font-bold leading-none text-content">{streak}</p>
          <p className="t-caption mt-1 text-content-muted">{T.streakDays}</p>
        </div>
        <div className="rounded-2xl border border-line-subtle bg-surface-card p-3 text-center">
          <BookOpen
            className="mx-auto h-5 w-5 text-amber-300 theme-light:text-amber-900"
            aria-hidden="true"
          />
          <p className="t-h3 mt-1.5 font-bold leading-none text-content">{learned}</p>
          <p className="t-caption mt-1 text-content-muted">
            {isA ? 'từ đã thuộc' : 'words learned'}
          </p>
        </div>
      </section>
    </div>
  )

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title={isA ? 'Trang cá nhân' : 'Personal Profile'} />

      {/* [2026-09-02, đợt 1 thiết kế lại desktop] Trước đây một cột `max-w-3xl` ở mọi bề rộng. */}
      <PageShell
        width="standard"
        baseWidth="max-w-3xl"
        className="!pb-[calc(1.5rem+var(--bnav-h))]"
      >
        <TwoPane isDesktop={isDesktop} railLabel="Thông tin tài khoản" rail={rail}>
          <div className="space-y-6">
            <h1 tabIndex={-1} className="sr-only focus:outline-none">
              {isA ? 'Trang cá nhân' : 'Personal Profile'}
            </h1>

            {/* Thông tin người dùng & Gói cước — ở desktop khối này nằm trong cột phải, nên chỉ
            dựng ở mobile. Dựng đúng MỘT nhánh (không `lg:hidden`) để DOM không có hai bản
            trùng: trình đọc màn hình sẽ đọc tên/email hai lần. */}
            {!isDesktop && (
              <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 flex items-center gap-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center text-2xl font-bold text-white shadow-md shrink-0">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-lg break-words">{user.name}</p>
                  <p className="text-sm text-zinc-400 break-words flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {user.email}
                  </p>
                  <span
                    className={`inline-block mt-2 text-[11px] px-2.5 py-1 rounded-full font-medium ${
                      user.plan === 'vip'
                        ? 'bg-violet-500/15 text-violet-300 theme-light:text-violet-800 border border-violet-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {user.plan === 'vip' ? T.planVip : T.planFree}
                  </span>
                </div>
              </section>
            )}

            {/* Số liệu nhanh: streak + từ đã học — cũng đã chuyển sang cột phải ở desktop. */}
            {!isDesktop && (
              <section className="grid grid-cols-2 gap-3 animate-fade-in">
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${streak > 0 ? 'bg-orange-500/15' : 'bg-zinc-800'}`}
                  >
                    <Flame
                      className={`w-5 h-5 ${streak > 0 ? 'text-orange-400 theme-light:text-orange-900' : 'text-zinc-400'}`}
                    />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white leading-none">{streak}</p>
                    <p className="text-xs text-zinc-400 mt-1">{T.streakDays}</p>
                  </div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-amber-300 theme-light:text-amber-900" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white leading-none">{learned}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {isA ? 'từ đã thuộc' : 'words learned'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ── KHÔNG GIAN (bộ chuyển Studio) ────────────────────────────────
                [P0-4, 2026-09-17] Bộ chuyển Studio ("⌘K") bị ẩn khỏi header dưới
                1024px (xem `components/Layout.tsx`) — nội dung của nó chuyển hẳn
                về đây để người dùng mobile vẫn có đường sang 5 Studio nền tảng. */}
            <section className="space-y-3 animate-fade-in">
              <h2 className="text-sm font-semibold text-white">{isA ? 'Không gian' : 'Spaces'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STUDIOS.map((st) => {
                  const Icon = st.icon
                  return (
                    <button
                      key={st.id}
                      onClick={() => navigateTo(nav, st.to)}
                      className={`tap-44 flex items-start gap-3.5 p-4 rounded-2xl border text-left transition group active:scale-[0.99] ${st.color}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-950/60 flex items-center justify-center shrink-0 border border-zinc-800/80 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm group-hover:text-accent-300 transition-colors">
                          {st.title}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed break-words">
                          {st.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition shrink-0 mt-2.5" />
                    </button>
                  )
                })}
                {EXTRA_HUBS.map((hub) => {
                  const Icon = hub.icon
                  return (
                    <button
                      key={hub.path}
                      onClick={() => navigateTo(nav, hub.path)}
                      className={`tap-44 flex items-start gap-3.5 p-4 rounded-2xl border text-left transition group active:scale-[0.99] ${hub.bg}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-950/60 flex items-center justify-center shrink-0 border border-zinc-800/80 group-hover:scale-105 transition-transform">
                        <Icon className={`w-5 h-5 ${hub.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm group-hover:text-accent-300 transition-colors">
                          {hub.title}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed break-words">
                          {hub.desc}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition shrink-0 mt-2.5" />
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ── CÀI ĐẶT & TIỆN ÍCH HỆ THỐNG ──────────────────────────────────── */}
            <section className="space-y-3 animate-fade-in">
              <h2 className="text-sm font-semibold text-white">
                {isA ? 'Cài đặt & Tiện ích' : 'Settings & Utilities'}
              </h2>

              {/* Đổi giao diện — dưới 1024px, header ẩn nút này (P0-4); đây là nơi thay thế
                  trên mobile, cạnh Hồ sơ đã có sẵn. */}
              <div className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-[15px]">
                    {isA ? 'Giao diện' : 'Theme'}
                  </p>
                  <p className="text-xs text-zinc-400 break-words mt-0.5">
                    {isA ? 'Xanh đêm · Blue sky' : 'Night blue · Blue sky'}
                  </p>
                </div>
                <ThemeToggle className="tap-44 flex items-center justify-center text-zinc-400 hover:text-white transition p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 hover:bg-zinc-700/60 shrink-0" />
              </div>

              {/* Nút sang Cài đặt học Tiếng Anh */}
              <button
                onClick={() => nav('/cai-dat')}
                className="w-full bg-zinc-900/80 border border-zinc-800/80 hover:border-accent-500/40 rounded-2xl p-4 flex items-center gap-4 transition group text-left active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5 text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-[15px]">
                    {isA ? 'Cài đặt' : 'Settings'}
                  </p>
                  <p className="text-xs text-zinc-400 break-words mt-0.5">
                    {isA
                      ? 'Tốc độ học, giọng đọc AI, âm thanh, nhóm tuổi & chiều học'
                      : 'Study speed, AI voice, sound effects, age group & direction'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
              </button>

              {/* Tiến độ học */}
              <button
                onClick={() => nav('/tien-do')}
                aria-label={isA ? 'Xem tiến độ học' : 'View progress'}
                className="w-full bg-zinc-900/80 border border-zinc-800/80 hover:border-accent-500/40 rounded-2xl p-4 flex items-center gap-4 transition group text-left active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5 text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-[15px]">
                    {isA ? 'Tiến độ học tập' : 'Learning Progress'}
                  </p>
                  <p className="text-xs text-zinc-400 break-words mt-0.5">
                    {isA
                      ? 'Chuỗi ngày học, từ vựng, lộ trình CEFR & kết quả luyện tập'
                      : 'Streak, vocabulary, CEFR roadmap & practice scores'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
              </button>

              {/* Lịch sử học */}
              <button
                onClick={() => nav('/lich-su-hoc')}
                aria-label={isA ? 'Xem lịch sử học' : 'View learning history'}
                className="w-full bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 flex items-center gap-4 transition group text-left active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <HistoryIcon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-[15px]">
                    {isA ? 'Lịch sử học' : 'Learning history'}
                  </p>
                  <p className="text-xs text-zinc-400 break-words mt-0.5">
                    {isA
                      ? 'Các phiên chat, viết, nói trước đây'
                      : 'Past chat, writing and speaking sessions'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
              </button>

              {/* Đóng góp ý kiến & Báo lỗi */}
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                aria-label={isA ? 'Đóng góp ý kiến & Báo lỗi' : 'Feedback & Bug Report'}
                className="w-full bg-zinc-900/80 border border-zinc-800/80 hover:border-accent-500/40 rounded-2xl p-4 flex items-center gap-4 transition group text-left active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquareHeart className="w-5 h-5 text-purple-400 theme-light:text-purple-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-[15px]">
                    {isA ? 'Đóng góp ý kiến & Báo lỗi' : 'Feedback & Bug Report'}
                  </p>
                  <p className="text-xs text-zinc-400 break-words mt-0.5">
                    {isA
                      ? 'Gửi đề xuất tính năng, báo lỗi hoặc góp ý nội dung bài học'
                      : 'Suggest features, report issues or content improvements'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            </section>

            {/* Nhiệm vụ */}
            <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
              <button
                type="button"
                onClick={() => setQuestsOpen((v) => !v)}
                aria-expanded={questsOpen}
                className="tap-44 w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isA ? 'Nhiệm vụ' : 'Quests'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isA ? 'Kiếm thêm ngày dùng gói VIP miễn phí' : 'Earn extra free days of VIP'}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${questsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {questsOpen && (
                <div className="mt-4 pt-4 border-t border-zinc-800/80">
                  <QuestsPanel isA={isA} userId={user.id} />
                </div>
              )}
            </section>

            {/* Băng khuyến mãi % */}
            <PricePromoBanner isA={isA} />

            {/* Nâng cấp VIP — bản RÚT GỌN dẫn sang /nang-cap; bảng so sánh đầy đủ + luồng
            thanh toán SePay nay ở trang riêng (audit UI/UX 2026-08-31 mục B9). Gói đang dùng
            của người dùng vẫn hiện ở khối thông tin tài khoản phía trên. */}
            <UpgradeSection isA={isA} currentPlan={user.plan} variant="compact" />

            {/* Xác thực email */}
            {user.emailVerified === false && (
              <EmailVerifySection
                isA={isA}
                currentEmail={user.email}
                onVerified={() => void refresh()}
              />
            )}

            {/* Xác thực hai bước (tuỳ chọn) */}
            <PasswordChangeSection key={user.id} isA={isA} onChanged={passwordChanged} />
            <TwoFactorSection isA={isA} />

            {/* Mời bạn cùng học */}
            <ReferralSection isA={isA} />

            {/* Người thân theo dõi — báo cáo tuần cho bố mẹ/thầy cô. Cả giao diện lẫn nội dung
            thư (weeklyReport.ts) nay đều có bản chiều B (2026-09-03, trả nợ ghi ở PROGRESS.md). */}
            <CompanionLinkSection isA={isA} />

            {/* Huy hiệu & mốc */}
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                  {isA ? 'Huy hiệu & mốc' : 'Achievements'}
                </h2>
                <span className="text-xs text-zinc-400">
                  {earned.size}/{ACHIEVEMENTS.length}
                </span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 grid grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((a) => {
                  const has = earned.has(a.id)
                  const name = isA ? a.nameVi : a.nameEn
                  return (
                    <div key={a.id} className="flex flex-col items-center gap-1 text-center">
                      <span
                        title={name}
                        aria-label={`${name}${has ? (isA ? ' — đã đạt' : ' — earned') : isA ? ' — chưa đạt' : ' — locked'}`}
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 ${
                          has
                            ? 'bg-amber-500/15 border border-amber-500/40'
                            : 'bg-zinc-900/60 border border-zinc-800/60 opacity-40 grayscale'
                        }`}
                      >
                        {a.icon}
                      </span>
                      <span className="text-[11px] text-zinc-400 text-center leading-tight break-words">
                        {name}
                      </span>
                    </div>
                  )
                })}
              </div>

              {rewardsLoading && <Skeleton className="mt-3 h-16 rounded-2xl" />}

              {!rewardsLoading && rewardsError && (
                <div className="mt-3">
                  <LoadError
                    message={
                      isA
                        ? 'Không tải được phần thưởng huy hiệu.'
                        : 'Could not load achievement rewards.'
                    }
                    onRetry={loadRewards}
                  />
                </div>
              )}

              {!rewardsLoading &&
                rewards &&
                rewards.some(
                  (r) => r.earned && !r.claimed && r.reward.enabled && r.reward.rewardDays > 0,
                ) && (
                  <div className="mt-3 space-y-2">
                    {rewards
                      .filter(
                        (r) =>
                          r.earned && !r.claimed && r.reward.enabled && r.reward.rewardDays > 0,
                      )
                      .map((r) => {
                        const def = ACHIEVEMENTS.find((a) => a.id === r.id)
                        if (!def) return null
                        const name = isA ? def.nameVi : def.nameEn
                        const planLabel = r.reward.rewardPlan === 'vip' ? 'VIP' : 'Pro'
                        return (
                          <div
                            key={r.id}
                            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center gap-3"
                          >
                            <span className="text-lg shrink-0">{def.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white break-words">{name}</p>
                              <p className="text-xs text-amber-300 theme-light:text-amber-900 mt-0.5 flex items-center gap-1">
                                <Gift className="w-3 h-3" />
                                {isA
                                  ? `+${r.reward.rewardDays} ngày gói ${planLabel}`
                                  : `+${r.reward.rewardDays} day of ${planLabel}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleClaimReward(r.id)}
                              disabled={claimingId === r.id}
                              className="tap-44 inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-60 text-[#09090b] text-xs font-medium px-3 py-2 rounded-lg transition active:scale-[0.97] shrink-0"
                            >
                              {claimingId === r.id && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              )}
                              {isA ? 'Nhận thưởng' : 'Claim'}
                            </button>
                          </div>
                        )
                      })}
                  </div>
                )}
            </section>

            {/* Quản trị hệ thống */}
            {user?.isAdmin && (
              <button
                onClick={() => nav('/admin-s')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition text-xs font-medium animate-fade-in"
              >
                Quản trị hệ thống (Admin)
              </button>
            )}

            {/* Đăng xuất */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/25 text-red-400 theme-light:text-red-700 hover:bg-red-500/10 transition text-sm font-medium animate-fade-in"
            >
              <LogOut className="w-4 h-4" /> {T.logout}
            </button>
          </div>
        </TwoPane>
      </PageShell>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  )
}

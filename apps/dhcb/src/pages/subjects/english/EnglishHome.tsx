// EnglishHome.tsx — trang TỔNG QUAN môn Tiếng Anh tại /goc-hoc-tap/english.
//
// [Slice 02, 2026-09-15] Tiếng Anh là MỘT MÔN ngang hàng trong Góc học tập, không còn là "không
// gian" cấp nền tảng — tiêu đề, breadcrumb (Trang chủ › Góc học tập › Tiếng Anh) và đường dẫn
// theo đó. Đủ 5 công cụ của `ENGLISH_CHILDREN` (navTree.ts) có nút ở trang này (AC-8).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import {
  MessageCircle,
  PenLine,
  Mic,
  ChevronRight,
  BookOpen,
  History,
  Target,
  TrendingUp,
  Brain,
  Video,
  Bot,
  X,
  Sparkles,
  Headphones,
  GraduationCap,
  Bookmark,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import Layout from '../../../components/Layout.js'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import { SECTION_TITLE_CLASS as TIEU_DE_MUC } from '@core/cardStyles'
import { ContinueCard } from '../../../components/learning/ContinueCard'
import PricePromoBanner from '../../../components/PricePromoBanner.js'
import RewardTipBanner from '../../../components/RewardTipBanner.js'
import { getDirection } from '../../../lib/storage'
import type { Direction } from '../../../types'
import { useAuth } from '../../../context/useAuth'
import {
  duongDanBaiHocAnh,
  duongDanCauThongDung,
  duongDanLuyenNghe,
  duongDanLuyenNoi,
  duongDanLuyenViet,
  duongDanLoTrinh,
  duongDanOnThi,
  duongDanSoTayLoiSai,
  duongDanThuThach,
  duongDanTroTruyen,
  duongDanTruyen,
  duongDanTuDien,
} from '../../../lib/englishRoutes'
import { useCloudSync } from '../../../lib/useCloudSync'
import type { CefrLevel } from '../../../data/cefr'
import type { Circle } from '../../../data/curriculum'
import { loadCefr } from '../../../data/cefrLoader'
import { loadFoundation } from '../../../data/curriculumLoader'
import { getLearnedWords, getRecentlyLearnedWords } from '../../../lib/vocab'
import { getDoneGrammar, computeLockedMapFromServer } from '../../../lib/cefrProgress'
import { englishNext, duongDanCapCefr } from '../../../lib/today/englishNext'
import { getPassedExamLevels } from '../../../lib/cefrExam'
import { getSRSStats } from '../../../lib/srs'
import { getDailyLearned, getDailySpeed } from '../../../lib/curriculum'
import {
  shouldShowComeback,
  dismissComebackToday,
  comebackDaysAway,
  COMEBACK_SRS_CARDS,
  COMEBACK_NEW_WORDS,
} from '../../../lib/comeback'

// Số từ vừa học tối đa gợi ý cho 1 phiên Speaking
const RECENT_WORDS_FOR_SPEAKING = 8

export default function EnglishHome() {
  usePageTitle('Tiếng Anh | Đồng Hành Cùng Bạn')
  const nav = useNavigate()
  const { user } = useAuth()
  const syncVersion = useCloudSync(user?.id)

  const dir: Direction = getDirection()
  const [comebackClosed, setComebackClosed] = useState(false)

  const [cefrLevels, setCefrLevels] = useState<CefrLevel[]>([])
  const [circleById, setCircleById] = useState<Record<string, Circle>>({})
  useEffect(() => {
    Promise.all([loadCefr(), loadFoundation()]).then(([lv, foundation]) => {
      setCefrLevels(lv)
      setCircleById(Object.fromEntries(foundation.map((c) => [c.id, c])))
    })
  }, [])

  const uid = user?.id ?? ''
  // Đọc từ localStorage mỗi render — bỏ useMemo thủ công vì React Compiler không
  // bảo toàn được (hàm ngoài opaque); compiler tự memo phần nó chứng minh được.
  // syncVersion tăng (đồng bộ cloud xong) → re-render → tự đọc lại bản mới.
  void syncVersion
  const learned = getLearnedWords(uid)
  const doneGrammar = getDoneGrammar(uid)
  const examPassed = getPassedExamLevels(uid)

  // Quyền mở cấp do SERVER cấp (GĐ2a) — client chỉ đọc danh sách server trả về.
  const lockedMap = computeLockedMapFromServer(uid, cefrLevels, examPassed)

  const isA = dir === 'A'

  // [S06-3] MỘT luật "học tiếp" cho cả ba nơi hiển thị (Trang chủ · thẻ "Hôm nay" · trang môn
  // này): adapter `englishNext` bọc `findNextStep`. Trước đây trang chép lại nguyên vòng lặp
  // chọn cấp + đoạn dựng nhãn của `Home.tsx`, nên mỗi lần sửa luật là phải nhớ sửa hai chỗ.
  // Không truyền `srsDue`: trang đã có nút "N thẻ đến hạn" riêng, không cần mục ôn của adapter.
  const { next: nextItem, levelId: continueLevelId } = englishNext({
    levels: cefrLevels,
    circleById,
    learned,
    doneGrammar,
    lockedMap,
    isA,
  })
  const nextLabel = nextItem?.title ?? ''
  // [U9b, audit 2026-09-30 M19] Chưa có dấu vết học nào (cùng định nghĩa "bằng chứng" của thẻ
  // "Hôm nay" — useTodayPlan) thì KHÔNG nói "Học tiếp": người vừa xong onboarding chưa học gì để
  // mà tiếp. Nói đúng: đây là bài đầu tiên, nút là "Bắt đầu".
  const chuaHocGi = learned.size === 0 && doneGrammar.size === 0 && examPassed.size === 0
  const continueHref = continueLevelId ? duongDanCapCefr(continueLevelId) : ''

  const showComeback = !comebackClosed && !!continueLevelId && shouldShowComeback(uid)
  const daysAway = showComeback ? comebackDaysAway(uid) : 0
  function closeComeback() {
    dismissComebackToday(uid)
    setComebackClosed(true)
  }

  const recentWords = getRecentlyLearnedWords(uid, RECENT_WORDS_FOR_SPEAKING)

  if (!user) return null

  const srsDue = getSRSStats(user.id).due
  const dailyLearned = getDailyLearned(user.id)
  // [U9b] Mục tiêu NGÀY là tốc độ người học chọn (onboarding: 10 phút → 10 từ), không phải trần
  // 5 lượt × tốc độ (`getDailyMax` = 50) — trước đây người chọn 10 phút thấy "0 / 50 từ vựng".
  const dailyGoal = getDailySpeed(user.id)

  function goToNextStep() {
    if (continueHref) nav(continueHref)
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout title={isA ? 'Tiếng Anh' : 'English'} back />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Danh sách/lưới nhiều thẻ → width standard. */}
      <PageShell width="standard" baseWidth="max-w-3xl" className="!pt-4 space-y-5">
        <h1 className="sr-only">{isA ? 'Môn tiếng Anh' : 'English'}</h1>

        {/* ── TIÊU ĐỀ & TIẾP TỤC HỌC CEFR ── */}
        <section
          aria-label="Học tập trọng tâm"
          className="glass rounded-3xl p-5 border border-emerald-500/30 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-emerald-950/30 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-black shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {isA ? 'Gia sư tiếng Anh song ngữ' : 'Bilingual English tutor'}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 font-bold border border-emerald-500/30 whitespace-nowrap">
                    A1–C2
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  {isA ? 'Mục tiêu hôm nay:' : "Today's goal:"}{' '}
                  <span className="text-emerald-400 theme-light:text-emerald-900 font-bold">
                    {dailyLearned}
                  </span>{' '}
                  / {dailyGoal} {isA ? 'từ vựng' : 'words'}
                </p>
              </div>
            </div>
            {/* Ôn thẻ nằm ở tab `srs` của trang cấp (mặc định ôn MỌI cấp nên khớp số `srsDue`);
                `/luyen-tap` không có phần ôn thẻ. */}
            {srsDue > 0 && continueHref && (
              <button
                onClick={() => nav(`${continueHref}?tab=srs`)}
                className="tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-xs text-sky-300 theme-light:text-sky-900 font-semibold transition"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>{srsDue} thẻ đến hạn</span>
              </button>
            )}
          </div>

          {continueLevelId && (
            // [2026-10-02] Khối "Học tiếp" dùng chung (ContinueCard) — cùng bố cục với trang môn
            // Lập trình. Tên bài trước đây xanh lá: CLAUDE.md §4.8 dành xanh lá cho nghĩa "đúng".
            <ContinueCard
              frame="inset"
              headingLevel={3}
              eyebrow={
                chuaHocGi
                  ? isA
                    ? 'Bài đầu tiên theo lộ trình'
                    : 'First roadmap lesson'
                  : isA
                    ? 'Bài tiếp theo theo lộ trình'
                    : 'Next roadmap lesson'
              }
              title={nextLabel || (isA ? 'Bắt đầu bài học mới' : 'Start new lesson')}
              actionLabel={chuaHocGi ? (isA ? 'Bắt đầu' : 'Start') : isA ? 'Học tiếp' : 'Continue'}
              onAction={goToNextStep}
            />
          )}
        </section>

        {/* ── Luồng "quay lại sau khi bỏ bẵng" ── */}
        {showComeback && continueLevelId && (
          <div className="glass rounded-2xl p-4 border border-accent-500/30 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0" aria-hidden="true">
                👋
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">
                  {isA ? 'Mừng bạn quay lại!' : 'Welcome back!'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isA
                    ? `Đã ${daysAway} ngày rồi — bắt đầu nhẹ nhàng thôi, không cần ôn hết nợ cũ.`
                    : `It's been ${daysAway} days — let's ease back in, no need to clear the backlog.`}
                </p>
              </div>
              <button
                onClick={closeComeback}
                aria-label={isA ? 'Đóng' : 'Dismiss'}
                className="tap-44 shrink-0 text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              {srsDue > 0 && (
                <button
                  onClick={() => nav(`${continueHref}?tab=srs&cap=${COMEBACK_SRS_CARDS}`)}
                  className={buttonClass({ variant: 'outline', className: 'flex-1' })}
                >
                  <Brain className="w-4 h-4" />
                  {isA
                    ? `Ôn ${Math.min(srsDue, COMEBACK_SRS_CARDS)} thẻ`
                    : `Review ${Math.min(srsDue, COMEBACK_SRS_CARDS)} cards`}
                </button>
              )}
              <button
                onClick={() => nav(`${continueHref}?tab=today&cap=${COMEBACK_NEW_WORDS}`)}
                // [0500] Biến thể `secondary` — bản cũ thiếu `theme-light:text-accent-800` nên chữ
                // accent-300 nhạt trên nền sáng (Blue sky).
                className={buttonClass({ variant: 'secondary', className: 'flex-1' })}
              >
                <Sparkles className="w-4 h-4" />
                {isA ? `Học ${COMEBACK_NEW_WORDS} từ mới` : `Learn ${COMEBACK_NEW_WORDS} words`}
              </button>
            </div>
          </div>
        )}

        {/* ── Mẹo kiếm huy hiệu & thưởng ── */}
        {uid && <RewardTipBanner uid={uid} isA={isA} />}

        {/* ── Gợi ý "Luyện nói với từ vừa học" ── */}
        {recentWords.length > 0 && (
          <button
            onClick={() =>
              nav(`${duongDanLuyenNoi()}?words=${encodeURIComponent(recentWords.join(','))}`)
            }
            className="tap-44 w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs text-sky-300 theme-light:text-sky-800 hover:border-sky-500/50 transition animate-fade-in"
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            {isA
              ? `Luyện nói với ${recentWords.length} từ vừa học`
              : `Practice speaking with ${recentWords.length} recent words`}
          </button>
        )}

        {/* DailyQuestsCard + ReferralVipBanner (dữ liệu giả in-memory) đã gỡ 2026-08-23 — hệ nhiệm vụ/giới thiệu THẬT ở /nhiem-vu và /profile (QuestsPanel, ReferralSection) */}

        {/* ── GIA SƯ 4 KỸ NĂNG AI ── */}
        <section aria-label="Gia Sư 4 Kỹ Năng AI" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent-500/15 text-accent-400 border border-accent-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className={TIEU_DE_MUC}>Gia sư luyện 4 kỹ năng AI</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => nav(duongDanLuyenNghe())}
              className="tap-44 flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-rose-500/40 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center group-hover:scale-110 transition">
                <Headphones className="w-5 h-5 text-rose-400 theme-light:text-rose-900" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">Luyện Nghe</span>
            </button>

            <button
              onClick={() => nav(duongDanTroTruyen())}
              className="tap-44 flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-accent-500/40 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center group-hover:scale-110 transition">
                <MessageCircle className="w-5 h-5 text-accent-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">Chat đối thoại</span>
            </button>

            <button
              onClick={() => nav(duongDanLuyenNoi())}
              className="tap-44 flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-sky-500/40 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center group-hover:scale-110 transition">
                <Mic className="w-5 h-5 text-sky-400 theme-light:text-sky-900" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">Luyện Nói IPA</span>
            </button>

            <button
              onClick={() => nav(duongDanLuyenViet())}
              className="tap-44 flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-violet-500/40 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center group-hover:scale-110 transition">
                <PenLine className="w-5 h-5 text-violet-400 theme-light:text-violet-800" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">Luyện Viết IELTS</span>
            </button>
          </div>
        </section>

        {/* ── LỘ TRÌNH VÀ TỪ ĐIỂN ── */}
        <section aria-label="Lộ trình & Từ điển" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Lộ trình CEFR */}
          <button
            onClick={() => nav(duongDanLoTrinh())}
            className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/50 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex items-start gap-3.5"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-white text-sm">Học theo lộ trình CEFR</h4>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 theme-light:text-emerald-800 font-semibold border border-emerald-500/20">
                  A1-C2
                </span>
              </div>
              <p className="text-xs text-zinc-400 break-words leading-relaxed">
                6 cấp độ chuẩn hóa, 5-20 từ mới mỗi ngày theo vòng tròn chủ đề ngữ cảnh.
              </p>
            </div>
          </button>

          {/* Từ điển Song Ngữ */}
          <button
            onClick={() => nav(duongDanTuDien())}
            className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-amber-500/50 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex items-start gap-3.5"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-white text-sm">Từ điển song ngữ 12.000+</h4>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 theme-light:text-amber-800 font-semibold border border-amber-500/20">
                  Có phiên âm
                </span>
              </div>
              <p className="text-xs text-zinc-400 break-words leading-relaxed">
                Tra cứu phát âm chuẩn IPA, câu ví dụ thực tế và giải thích chi tiết ngữ cảnh.
              </p>
            </div>
          </button>
        </section>

        {/* ── THƯ VIỆN & TÀI NGUYÊN HỌC TẬP MỞ RỘNG ── */}
        <section aria-label="Tài nguyên học tập" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            {/* [0500, audit mục 7] Cùng một thang với tiêu đề mục phía trên — trước đây mục này
                12px xám, mục kia 14px trắng: hai mục ngang cấp mà trông như hai cấp khác nhau. */}
            <h3 className={TIEU_DE_MUC}>Tài nguyên & công cụ bổ trợ</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Bài học ngữ pháp */}
            <button
              onClick={() => nav(duongDanBaiHocAnh())}
              className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 text-left transition active:scale-95 flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 theme-light:text-teal-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white text-xs break-words">Ngữ Pháp</h4>
                <p className="text-[11px] text-zinc-400 break-words">100+ chủ điểm</p>
              </div>
            </button>

            {/* Mẫu câu thông dụng */}
            <button
              onClick={() => nav(duongDanCauThongDung())}
              className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 text-left transition active:scale-95 flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 theme-light:text-blue-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white text-xs break-words">Mẫu Câu</h4>
                <p className="text-[11px] text-zinc-400 break-words">Giao tiếp nhanh</p>
              </div>
            </button>

            {/* Truyện song ngữ */}
            <button
              onClick={() => nav(duongDanTruyen())}
              className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 text-left transition active:scale-95 flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 theme-light:text-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white text-xs break-words">Truyện song ngữ</h4>
                <p className="text-[11px] text-zinc-400 break-words">Chữ sáng theo giọng đọc</p>
              </div>
            </button>

            {/* Ôn thi — công cụ thứ 5 của ENGLISH_CHILDREN, trước đây chỉ có ở sidebar. */}
            <button
              onClick={() => nav(duongDanOnThi())}
              className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 text-left transition active:scale-95 flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 theme-light:text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Target className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white text-xs break-words">
                  {isA ? 'Ôn thi' : 'Exam prep'}
                </h4>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isA ? 'Kế hoạch tới ngày thi' : 'Plan to exam day'}
                </p>
              </div>
            </button>

            {/* Cài đặt môn (chiều học, tốc độ, giọng) — chỉ ở đây, không lên sidebar (spec 03 D2). */}
            <button
              onClick={() => nav('/cai-dat')}
              className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 text-left transition active:scale-95 flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-500/15 text-zinc-300 theme-light:text-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white text-xs break-words">
                  {isA ? 'Cài đặt môn' : 'Subject settings'}
                </h4>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isA ? 'Chiều học · tốc độ · giọng' : 'Direction · pace · voice'}
                </p>
              </div>
            </button>

            {/* Sổ tay lỗi sai */}
            <button
              onClick={() => nav(duongDanSoTayLoiSai())}
              className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 text-left transition active:scale-95 flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 theme-light:text-rose-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white text-xs break-words">Sổ lỗi sai</h4>
                <p className="text-[11px] text-zinc-400 break-words">Khắc phục lỗ hổng</p>
              </div>
            </button>
          </div>
        </section>

        {/* ── THỬ THÁCH VIDEO 1 PHÚT ──
            [S06b, 2026-09-24] Nền ĐẶC `bg-zinc-900` (token --z-900) thay gradient zinc→rose:
            axe không xác định được màu nền gradient nên cổng AAA không đo được tương phản. */}
        <button
          onClick={() => nav(duongDanThuThach())}
          className="w-full p-3.5 rounded-2xl bg-zinc-900 border border-rose-500/20 hover:border-rose-500/40 text-left transition flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 theme-light:text-rose-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Thử thách video nói 1 phút mỗi ngày</h4>
              <p className="text-[11px] text-zinc-400">
                Ghi hình phát âm, nhận phản hồi AI và tích lũy chuỗi ngày học
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition" />
        </button>

        {/* ── TIẾN ĐỘ & LỊCH SỬ HỌC ── */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => nav('/tien-do')}
            aria-label="Xem bảng tiến độ"
            className="bg-zinc-900/70 border border-zinc-800/80 hover:border-accent-500/40 rounded-2xl p-4 flex items-center gap-3.5 transition duration-200 group hover:bg-zinc-800/60 active:scale-98 animate-fade-in shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 group-hover:bg-accent-500/20 flex items-center justify-center shrink-0 transition">
              <TrendingUp className="w-4 h-4 text-accent-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition flex-1 text-left">
              {isA ? 'Tiến độ học' : 'Progress'}
            </span>
          </button>

          <button
            onClick={() => nav('/lich-su-hoc')}
            aria-label="Xem lịch sử học"
            className="bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 flex items-center gap-3.5 transition duration-200 group hover:bg-zinc-800/60 active:scale-98 animate-fade-in shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 group-hover:bg-zinc-700 flex items-center justify-center shrink-0 transition">
              <History className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
            </div>
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition flex-1 text-left">
              {isA ? 'Lịch sử học' : 'History'}
            </span>
          </button>
        </div>

        <PricePromoBanner isA={isA} />
      </PageShell>
    </div>
  )
}

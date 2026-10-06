// Practice — trang GỘP "Luyện tập" (4 kỹ năng Nghe/Nói/Đọc/Viết vào 1 trang).
// Các tính năng NẶNG (AI hội thoại, chấm bài viết) vẫn ở nguyên trang gốc /chat,
// /speaking, /writing — trang này chỉ điều hướng tới (KHÔNG đổi code các trang đó).
// Các bài tập MỚI chạy ngay tại đây, dùng lại dữ liệu/hàm đã có sẵn (curriculum,
// listening.ts, PronunciationCheck, challengeTopics) — không soạn nội dung mới,
// TRỪ 2 bài đợt 2 (shadowing, phỏng vấn ngược) cần gọi AI chấm nội dung —
// dùng chung cột lượt "speaking" đã có (LIMITS trong types.ts), KHÔNG thêm cột mới.
//
// [2026-09-06] File này từng dài 1.752 dòng; 8 mini-game + phần dùng chung nay nằm ở
// `pages/learning/practice/` (mỗi game một file), file này chỉ còn TRANG CHÍNH (hub).
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../lib/usePageTitle'
import {
  duongDanLuyenNghe,
  duongDanLuyenNoi,
  duongDanLuyenViet,
  duongDanSoTayLoiSai,
  duongDanTroTruyen,
} from '../../lib/englishRoutes'
import {
  Headphones,
  Mic,
  PenLine,
  MessageCircle,
  Volume2,
  Keyboard,
  ListChecks,
  Shuffle,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Activity,
  GraduationCap,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import Layout from '../../components/Layout.js'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import {
  FEATURE_DESC_CLASS as MO_TA_THE_NOI_BAT,
  FEATURE_TITLE_CLASS as TIEU_DE_THE_NOI_BAT,
  SECTION_TITLE_CLASS as TIEU_DE_MUC,
} from '@core/cardStyles'
import PvPArenaCard from '../../components/PvPArena/PvPArenaCard.js'
import { useLang } from '../../context/useLang'
import { useAuth } from '../../context/useAuth'
import { loadCurriculum, getLearningPath } from '../../lib/curriculum'
import { getDirection } from '../../lib/storage'
import { getLearnedWords } from '../../lib/vocab'
import type { DictEntry } from '../../types'
import { shuffle } from '@dhcb/core-contracts/shuffle'
import { goToSubjects, duongDanMonTiengAnh } from '../../lib/subjectsHost'
import { SESSION_SIZE } from './practice/shared'
import { MiniHeader } from './practice/GameChrome'
import type { Mode } from './practice/shared'
import { VocabListenGuess } from './practice/VocabListenGuess'
import { SentenceScramble } from './practice/SentenceScramble'
import { DictationTyping } from './practice/DictationTyping'
import { FillBlankQuiz } from './practice/FillBlankQuiz'
import { PronounceList } from './practice/PronounceList'
import { Shadowing } from './practice/Shadowing'
import { ReverseInterview } from './practice/ReverseInterview'

// [2026-09-24, audit UI/UX P2-1] Lối tắt 4 kỹ năng gia sư AI môn Tiếng Anh. Mô tả đầy đủ nằm ở
// trang nhà của môn (EnglishHome) — ở đây chỉ nhãn ngắn, đi qua đúng hàm dựng URL dùng chung.
const AI_TUTOR_LINKS: ReadonlyArray<{
  key: string
  to: () => string
  icon: LucideIcon
  iconClass: string
  vi: string
  en: string
}> = [
  {
    key: 'speaking',
    to: duongDanLuyenNoi,
    icon: Mic,
    iconClass: 'bg-sky-500/15 text-sky-400 theme-light:text-sky-900',
    vi: 'Luyện nói',
    en: 'Speaking',
  },
  {
    key: 'writing',
    to: duongDanLuyenViet,
    icon: PenLine,
    iconClass: 'bg-violet-500/15 text-violet-400 theme-light:text-violet-800',
    vi: 'Luyện viết',
    en: 'Writing',
  },
  {
    key: 'chat',
    to: duongDanTroTruyen,
    icon: MessageCircle,
    iconClass: 'bg-accent-500/15 text-accent-400',
    vi: 'Trò chuyện',
    en: 'Chat',
  },
  {
    key: 'listening',
    to: duongDanLuyenNghe,
    icon: Headphones,
    iconClass: 'bg-rose-500/15 text-rose-400 theme-light:text-rose-900',
    vi: 'Luyện nghe',
    en: 'Listening',
  },
]

// ── Trang chính ─────────────────────────────────────────────────────────
export default function Practice() {
  const nav = useNavigate()
  const { user } = useAuth()
  const ownerToken = useMemo(() => ({ owner: user?.id }), [user?.id])
  const uiLang: 'vi' | 'en' = useLang().lang === 'vi' ? 'vi' : 'en'
  const isUiVi = uiLang === 'vi'
  usePageTitle(isUiVi ? 'Luyện tập | Đồng hành cùng bạn' : 'Practice | Your Companion')
  const [mode, setMode] = useState<Mode>('hub')
  const [pool, setPool] = useState<DictEntry[]>([])
  const [poolState, setPoolState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [poolOwner, setPoolOwner] = useState<string | undefined>(undefined)
  const [retryPool, setRetryPool] = useState(0)
  const [session, setSession] = useState<{
    ownerToken: object
    direction: 'A' | 'B'
    pool: DictEntry[]
    pronunciationItems: string[]
  } | null>(null)

  useEffect(() => {
    let active = true
    loadCurriculum()
      .then(() => {
        if (!active) return
        const learned = getLearnedWords(user?.id ?? '')
        const path = getLearningPath()
        let p = path.filter((w) => learned.has(w.word.toLowerCase()))
        if (p.length < 12) p = path.slice(0, 80)
        setPool(p)
        setPoolOwner(user?.id)
        setPoolState('ready')
      })
      .catch(() => {
        if (active) {
          setPoolOwner(user?.id)
          setPoolState('error')
        }
      })
    return () => {
      active = false
    }
  }, [user?.id, retryPool])

  function openMode(nextMode: Exclude<Mode, 'hub'>) {
    if (poolState !== 'ready' || poolOwner !== user?.id) return
    const direction = getDirection() === 'B' ? 'B' : 'A'
    const learningIsA = direction === 'A'
    const sentencePool = pool.filter((w) => (learningIsA ? w.ex_en : w.ex_vi))
    const pronunciationItems =
      nextMode === 'pronounce-words'
        ? shuffle(pool)
            .slice(0, SESSION_SIZE)
            .map((w) => (learningIsA ? w.word : w.vi))
        : nextMode === 'read-aloud'
          ? shuffle(sentencePool)
              .slice(0, SESSION_SIZE)
              .map((w) => (learningIsA ? w.ex_en : w.ex_vi))
          : []
    setSession({ ownerToken, direction, pool: [...pool], pronunciationItems })
    setMode(nextMode)
  }

  function closeMode() {
    setSession(null)
    setMode('hub')
  }

  const activeMode = session?.ownerToken === ownerToken ? mode : 'hub'
  const poolReadyForUser = poolState === 'ready' && poolOwner === user?.id
  const learningIsA = session?.direction !== 'B'
  const sentencePool = useMemo(
    () => session?.pool.filter((w) => (session.direction === 'A' ? w.ex_en : w.ex_vi)) ?? [],
    [session],
  )

  if (activeMode !== 'hub' && session) {
    const titles: Record<Exclude<Mode, 'hub'>, [string, string]> = {
      'vocab-listen': [
        isUiVi ? 'Nghe đoán từ vựng' : 'Listen & guess',
        isUiVi ? 'Nghe rồi chọn nghĩa đúng' : 'Listen then pick the meaning',
      ],
      scramble: [
        isUiVi ? 'Sắp xếp câu' : 'Sentence scramble',
        isUiVi ? 'Ghép từ đúng thứ tự' : 'Put the words in order',
      ],
      dictation: [
        isUiVi ? 'Nghe & viết lại' : 'Listen & write',
        isUiVi ? 'Nghe rồi gõ lại câu' : 'Listen then type the sentence',
      ],
      fillblank: [
        isUiVi ? 'Điền từ trắc nghiệm' : 'Fill in the blank',
        isUiVi ? 'Khôi phục câu ví dụ đã học' : 'Restore the example sentence you learned',
      ],
      'pronounce-words': [
        isUiVi ? 'Chấm phát âm từ vựng' : 'Word pronunciation',
        isUiVi ? 'Đọc to từng từ, AI chấm điểm' : 'Read each word aloud',
      ],
      'read-aloud': [
        isUiVi ? 'Đọc lại câu' : 'Read the sentence',
        isUiVi ? 'Đọc to cả câu, AI chấm điểm' : 'Read the sentence aloud',
      ],
      shadowing: [
        isUiVi ? 'Shadowing' : 'Shadowing',
        isUiVi ? 'Nghe & nói đè theo ngay khi audio phát' : 'Speak along as the audio plays',
      ],
      interview: [
        isUiVi ? 'Phỏng vấn ngược' : 'Reverse interview',
        isUiVi ? 'AI hỏi, bạn trả lời nói, AI chấm nội dung' : 'AI asks, you answer, AI grades',
      ],
    }
    const [title, sub] = titles[activeMode]
    return (
      <>
        <Layout onBack={closeMode} />
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] Bài luyện tập 1 lượt → width reading. */}
        <PageShell
          width="reading"
          baseWidth="max-w-2xl"
          className="!pb-[calc(1.5rem+var(--bnav-h))]"
        >
          <MiniHeader title={title} sub={sub} uiLang={uiLang} onBack={closeMode} />
          {activeMode === 'vocab-listen' && (
            <VocabListenGuess
              pool={session.pool}
              isA={learningIsA}
              uiLang={uiLang}
              onExit={closeMode}
            />
          )}
          {activeMode === 'scramble' && (
            <SentenceScramble
              pool={sentencePool}
              isA={learningIsA}
              uiLang={uiLang}
              onExit={closeMode}
            />
          )}
          {activeMode === 'dictation' && (
            <DictationTyping
              pool={sentencePool}
              isA={learningIsA}
              uiLang={uiLang}
              onExit={closeMode}
            />
          )}
          {activeMode === 'fillblank' && (
            <FillBlankQuiz
              pool={sentencePool}
              isA={learningIsA}
              uiLang={uiLang}
              onExit={closeMode}
            />
          )}
          {activeMode === 'pronounce-words' && (
            <PronounceList
              items={session.pronunciationItems}
              isA={learningIsA}
              uiLang={uiLang}
              lang={learningIsA ? 'en' : 'vi'}
              onExit={closeMode}
            />
          )}
          {activeMode === 'read-aloud' && (
            <PronounceList
              items={session.pronunciationItems}
              isA={learningIsA}
              uiLang={uiLang}
              lang={learningIsA ? 'en' : 'vi'}
              onExit={closeMode}
            />
          )}
          {activeMode === 'shadowing' && (
            <Shadowing pool={sentencePool} isA={learningIsA} uiLang={uiLang} onExit={closeMode} />
          )}
          {activeMode === 'interview' && user && (
            <ReverseInterview isA={learningIsA} uiLang={uiLang} user={user} onExit={closeMode} />
          )}
        </PageShell>
      </>
    )
  }

  return (
    <>
      <Layout
        back={false}
        title={
          isUiVi ? 'Phòng luyện tập đa môn & sửa lỗi' : 'Multi-Subject Practice & Mistake Studio'
        }
      />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trung tâm luyện tập, nhiều thẻ → width standard. */}
      <PageShell width="standard" baseWidth="max-w-3xl" className="space-y-7">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isUiVi ? 'Phòng luyện tập đa môn & sửa lỗi' : 'Multi-Subject Practice & Mistake Studio'}
        </h1>

        {/* ── BANNER SPOTLIGHT: SỔ TAY SỬA LỖI ĐA MÔN & CUNG ĐIỆN TRÍ NHỚ ──
            [S06b, 2026-09-24] Chữ đọc nằm trên nền token ĐẶC (`bg-surface-card`) chứ không trên
            gradient: axe không xác định được màu nền của gradient nên không đo được 7:1 (cổng
            AAA báo `incomplete`). Gradient rose→amber chỉ còn là dải trang trí mảnh ở mép trên,
            nằm NGOÀI vùng chữ. */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-surface-card border border-rose-500/30 hover:border-rose-500/60 transition-colors duration-200 shadow-lg group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"
          />
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform text-white font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className={TIEU_DE_THE_NOI_BAT}>Sổ tay sửa lỗi đa môn AI</h2>
              </div>
              <p className={MO_TA_THE_NOI_BAT}>
                Tự động tổng hợp các bẫy biến đổi Toán - Lý - Hóa, lỗi phát âm IPA, sai ngữ pháp
                IELTS để bạn ôn tập ngắt quãng (SRS) và không lặp lại lỗi sai.
              </p>
            </div>
          </div>
          {/* [0500, audit M17] Nút CHÍNH của trang (accent) — trước đây đỏ, đứng cạnh nút cam của
              Đấu trường: hai nút chính khác màu tranh nhau điểm neo. Đấu trường nay là nút phụ. */}
          <button
            onClick={() => nav(duongDanSoTayLoiSai())}
            className={buttonClass({ variant: 'primary', className: 'w-full sm:w-auto shrink-0' })}
          >
            <span>Mở sổ lỗi & ôn tập</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* DailyQuestsCard + ReferralVipBanner (dữ liệu giả in-memory) đã gỡ 2026-08-23 — hệ nhiệm vụ/giới thiệu THẬT ở /nhiem-vu và /profile (QuestsPanel, ReferralSection) */}

        {/* ── ĐẤU TRƯỜNG 1V1 PVP ARENA ── */}
        <PvPArenaCard />

        {/* ── 1. 8 BÀI TẬP PHẢN XẠ NHANH — nội dung RIÊNG của trang này (nhà của 8 mini-game), nên
            đứng đầu thay vì nằm dưới hai lớp danh mục như trước 2026-09-24. ── */}
        <section
          aria-label={isUiVi ? 'Bài tập tương tác nhanh' : 'Quick interactive exercises'}
          className="space-y-3"
        >
          {(poolState === 'loading' || poolOwner !== user?.id) && (
            <p role="status" className="text-sm text-zinc-300">
              {isUiVi ? 'Đang tải nội dung luyện tập…' : 'Loading practice content…'}
            </p>
          )}
          {poolState === 'error' && poolOwner === user?.id && (
            <div role="alert" className="flex items-center gap-3 text-sm text-zinc-200">
              <span>
                {isUiVi ? 'Chưa tải được nội dung luyện tập.' : 'Could not load practice content.'}
              </span>
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => {
                  setPoolState('loading')
                  setPool([])
                  setRetryPool((n) => n + 1)
                }}
              >
                {isUiVi ? 'Thử lại' : 'Retry'}
              </button>
            </div>
          )}
          <div className="flex items-center justify-between px-1">
            <h2 className={TIEU_DE_MUC}>
              {isUiVi ? '1. 8 chế độ luyện tập phản xạ nhanh' : '1. Eight quick practice modes'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Nghe đoán từ */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('vocab-listen')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 theme-light:text-sky-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors break-words">
                  {isUiVi ? 'Nghe đoán từ vựng' : 'Listen and guess vocabulary'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi ? 'Nghe phát âm, chọn nghĩa đúng' : 'Listen and choose the meaning'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* 2. Sắp xếp câu */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('scramble')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 theme-light:text-indigo-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Shuffle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors break-words">
                  {isUiVi ? 'Sắp xếp câu hoàn chỉnh' : 'Put the sentence in order'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi
                    ? 'Ghép từ ngữ thành câu chuẩn ngữ pháp'
                    : 'Arrange words into a sentence'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* 3. Nghe viết chính tả */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('dictation')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 theme-light:text-violet-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Keyboard className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors break-words">
                  {isUiVi ? 'Nghe & viết chính tả' : 'Listen and type'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi
                    ? 'Nghe từng câu và gõ lại chính xác'
                    : 'Listen to each sentence and type it'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* 4. Điền từ trắc nghiệm */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('fillblank')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 theme-light:text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <ListChecks className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors break-words">
                  {isUiVi ? 'Điền từ ngữ cảnh' : 'Fill in the blank'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi
                    ? 'Khôi phục câu ví dụ đã học'
                    : 'Restore the example sentence you learned'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* 5. Chấm phát âm từ */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('pronounce-words')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 theme-light:text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Mic className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors break-words">
                  {isUiVi ? 'Chấm phát âm từ vựng' : 'Word pronunciation'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi ? 'Đọc to từ vựng, AI chấm điểm chuẩn' : 'Read words aloud for feedback'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* 6. Đọc diễn cảm cả câu */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('read-aloud')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 theme-light:text-rose-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors break-words">
                  {isUiVi ? 'Đọc lại câu ví dụ' : 'Read example sentences'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi
                    ? 'Rèn ngữ điệu và nối âm tự nhiên'
                    : 'Practice intonation and connected speech'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* 7. Shadowing */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('shadowing')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-500/15 text-accent-400 theme-light:text-accent-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-accent-300 transition-colors break-words">
                  {isUiVi ? 'Nói đè theo mẫu' : 'Shadow the model'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi ? 'Nói đồng thời theo nhịp audio phát' : 'Speak along with the audio'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* 8. Phỏng vấn ngược */}
            <button
              disabled={!poolReadyForUser}
              onClick={() => openMode('interview')}
              className="tap-44 flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 theme-light:text-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                  {isUiVi ? 'Phỏng vấn ngược AI' : 'Reverse interview'}
                </p>
                <p className="text-[11px] text-zinc-400 break-words">
                  {isUiVi
                    ? 'AI đặt câu hỏi, bạn trả lời bằng giọng nói'
                    : 'Answer AI questions by voice'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>
          </div>
        </section>

        {/* ── 2. GIA SƯ AI TIẾNG ANH — LỐI VÀO NHANH ──
            [2026-09-24, audit UI/UX P2-1] Nhà của 4 kỹ năng gia sư AI (và của Từ điển · Truyện ·
            Mẫu câu · Ngữ pháp · Thử thách 1 phút) là trang môn Tiếng Anh — nơi mô tả đầy đủ. Ở
            đây chỉ giữ 4 lối tắt một dòng, KHÔNG nhân bản mô tả; kho học liệu bổ trợ đã gỡ hẳn
            khỏi trang này, vào qua thẻ "Tiếng Anh CEFR" ở mục 3. */}
        <section aria-labelledby="practice-ai-tutor" className="space-y-3">
          <h2 id="practice-ai-tutor" className={`px-1 ${TIEU_DE_MUC}`}>
            {isUiVi
              ? '2. Luyện với gia sư AI · Tiếng Anh'
              : '2. Practice with the AI tutor · English'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {AI_TUTOR_LINKS.map(({ key, to, icon: Icon, iconClass, vi, en }) => (
              <button
                key={key}
                onClick={() => nav(to())}
                className="tap-44 flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 text-left transition active:scale-[0.98] group"
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition ${iconClass}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-zinc-200 min-w-0">
                  {isUiVi ? vi : en}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. LUYỆN TẬP 5 MÔN HỌC CỐT LÕI & GIẢI ĐỀ AI ── */}
        <section aria-label="Luyện tập 5 Môn học cốt lõi" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className={TIEU_DE_MUC}>3. Luyện tập 5 môn học & giải đề từng bước</h2>
            <button
              onClick={() => goToSubjects(nav)}
              className="tap-44-y text-[11px] text-zinc-400 hover:text-blue-300 transition flex items-center gap-1 font-medium"
            >
              <span>Xem tất cả môn</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Toán Học */}
            <button
              onClick={() => goToSubjects(nav, 'mathematics')}
              className="tap-44 p-4 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-blue-500/30 hover:border-blue-500/60 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-bold text-white text-sm">Toán Học</h3>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 theme-light:text-blue-800 font-semibold border border-blue-500/20">
                      Giải từng bước
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 break-words leading-relaxed">
                    Khảo sát hàm số, đạo hàm, tích phân, hình học Oxyz & giải đề thi.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-blue-400 theme-light:text-blue-800 font-medium pt-2 border-t border-zinc-800/80">
                <span>Giải bài tập & Nhận gợi ý gợi mở</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Vật Lý */}
            <button
              onClick={() => goToSubjects(nav, 'physics')}
              className="tap-44 p-4 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-cyan-500/30 hover:border-cyan-500/60 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Atom className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-bold text-white text-sm">Vật Lý</h3>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 theme-light:text-cyan-800 font-semibold border border-cyan-500/20">
                      Thí nghiệm mô phỏng
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 break-words leading-relaxed">
                    Dao động cơ, sóng âm, điện xoay chiều kèm phân tích công thức.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-cyan-400 theme-light:text-cyan-800 font-medium pt-2 border-t border-zinc-800/80">
                <span>Luyện giải & Thí nghiệm</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Hóa Học */}
            <button
              onClick={() => goToSubjects(nav, 'chemistry')}
              className="tap-44 p-4 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-amber-500/30 hover:border-amber-500/60 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-bold text-white text-sm">Hóa Học</h3>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 theme-light:text-amber-800 font-semibold border border-amber-500/20">
                      Cân bằng phản ứng
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 break-words leading-relaxed">
                    Cân bằng oxi hóa khử, este - lipit, amino axit & bài toán dung dịch.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-400 theme-light:text-amber-800 font-medium pt-2 border-t border-zinc-800/80">
                <span>Luyện chuỗi phản ứng</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Sinh Học */}
            <button
              onClick={() => goToSubjects(nav, 'biology')}
              className="tap-44 p-4 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Dna className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-bold text-white text-sm">Sinh Học</h3>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 theme-light:text-emerald-800 font-semibold border border-emerald-500/20">
                      Di Truyền
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 break-words leading-relaxed">
                    Di truyền Mendel, phiên mã ADN, đột biến gen và phả hệ.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-400 theme-light:text-emerald-800 font-medium pt-2 border-t border-zinc-800/80">
                <span>Luyện giải bài tập ADN</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Tiếng Anh Song Ngữ */}
            <button
              onClick={() => nav(duongDanMonTiengAnh())}
              className="tap-44 p-4 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-purple-500/30 hover:border-purple-500/60 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-bold text-white text-sm">Tiếng Anh CEFR</h3>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 theme-light:text-purple-800 font-semibold border border-purple-500/20">
                      A1 - C2
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 break-words leading-relaxed">
                    Lộ trình CEFR, từ điển, truyện song ngữ, mẫu câu & thử thách 1 phút.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-purple-400 theme-light:text-purple-800 font-medium pt-2 border-t border-zinc-800/80">
                <span>Khám phá lộ trình</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 10 Simulators Thí Nghiệm */}
            <button
              onClick={() => nav('/ung-dung-thuc-te')}
              className="tap-44 p-4 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-teal-500/30 hover:border-teal-500/60 text-left transition duration-200 group active:scale-[0.98] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="font-bold text-white text-sm">10 thí nghiệm STEM</h3>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 theme-light:text-teal-800 font-semibold border border-teal-500/20">
                      Phòng thí nghiệm
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 break-words leading-relaxed">
                    Mô phỏng điện EVN, con lắc lò xo, tên lửa nước, thấu kính quang học.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-teal-400 theme-light:text-teal-800 font-medium pt-2 border-t border-zinc-800/80">
                <span>Vào phòng thí nghiệm</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </section>
      </PageShell>
    </>
  )
}

// apps/dhcb/src/components/studyTabs/TodayLesson.tsx — tách từ components/StudyTabs.tsx (2.071 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.
// Barrel `components/StudyTabs.tsx` re-export nên nơi dùng không đổi đường import.
// ──────────────────────────────────────────────────────────────────────
// CÁC TAB HỌC THEO CẤP — Hôm nay · Ôn SRS · Từ khó · Kiểm tra
//
// Trước đây nằm ở trang /learning-path (Learn.tsx); nay mỗi cấp CEFR có
// TRANG RIÊNG (/learning-path/a1…b2) nên 4 tab này chuyển vào trang cấp
// (CefrLevelPage) và GIỚI HẠN theo từ vựng của cấp qua prop `pool`:
//   - pool = getLevelWords(cấp); riêng cấp CUỐI (B2) cộng thêm phần ngoài
//     lộ trình CEFR (getBeyondCefrWords) để học tiếp sau khi xong B2.
//   - Giới hạn ngày (20 từ/lượt, tối đa 100/ngày, quiz mở batch) vẫn tính
//     CHUNG toàn app (lib/curriculum.ts), KHÔNG tách theo cấp.
// Yêu cầu: đã await loadCurriculum() trước khi render (trang cấp lo việc này).
// ──────────────────────────────────────────────────────────────────────

import { useMemo, useState, useEffect } from 'react'
import {
  Check,
  X,
  RotateCcw,
  Trophy,
  Sparkles,
  ClipboardList,
  ChevronRight,
  MessageCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { duongDanLuyenNoi, duongDanTroTruyen } from '../../lib/englishRoutes'
import { useQuizKeyboard } from '@dhcb/core-ui/useQuizKeyboard'
import QuizOptionKey from '../QuizOptionKey'
import KaraokeText, { KARAOKE_INDENT } from '../KaraokeText'
import WordCard from '../WordCard'
import type { DictEntry } from '../../types'
import {
  markStudiedToday,
  shouldCelebrateStreak,
  markStreakCelebrated,
  getStreak,
} from '../../lib/storage'
import { haptics, vibrate } from '../../lib/haptics'
import { sound } from '../../lib/sound'
import SessionDone from '../SessionDone'
import {
  markSessionDoneOpenInUrl,
  clearSessionDoneOpenInUrl,
  isSessionDoneOpenInUrl,
} from '../../lib/session/sessionDoneUrl'
import type { SessionOutcome } from '../../lib/session/sessionFact'
import { shouldCelebrateWeeklyGoal, markWeeklyGoalCelebrated } from '../../lib/weeklyGoal'
import { checkNewAchievements, achievementMessage } from '../../lib/achievements'
import { useToast } from '@core/ToastProvider'
import { getLearnedWords, markLearned } from '../../lib/vocab'
import { addToSRS, getDueWords } from '../../lib/srs'
import {
  getTodayBatchFrom,
  getPoolProgress,
  getDailyLearned,
  bumpDailyLearned,
  getDailyQuizPasses,
  bumpDailyQuizPasses,
  getDailyAllowance,
  getDailySpeed,
  getDailyMax,
  getSkippedToday,
  addSkippedToday,
  findCircleOfWord,
  getCircleProgress,
  getCefrLevelOfCircle,
  isQuizPass,
  QUIZ_PASS_THRESHOLD_PCT,
} from '../../lib/curriculum'
import { getDialogues } from '../../data/dialoguesLoader'
import type { Dialogue } from '../../data/dialogues'
import { MiniQuizQ, buildMiniQuiz } from './quizBuilders'
import { buttonClass } from '@core/buttonStyles'

type TodayPhase = 'learning' | 'batch-done' | 'mini-quiz' | 'mini-quiz-review' | 'daily-max'

// ── Màn "Xong batch": câu + hội thoại dựng TỪ CHÍNH 20 từ vừa học ─────────────
// "Câu thông dụng" lấy thẳng ví dụ của CHÍNH 20 từ trong batch (ex_en/ex_vi),
// kèm 1 HỘI THOẠI của vòng có nhiều từ nhất trong batch.
function BatchDoneView({
  batch,
  uid,
  isA,
  dailyStart,
  onStartQuiz,
}: {
  batch: DictEntry[]
  uid: string
  isA: boolean
  dailyStart: number
  onStartQuiz: () => void
}) {
  const nav = useNavigate()
  const learnedToday = getDailyLearned(uid) - dailyStart
  const totalToday = getDailyLearned(uid)
  const quizPasses = getDailyQuizPasses(uid)
  const speed = getDailySpeed(uid)
  const dailyMax = getDailyMax(uid)
  const canLearnMore = totalToday < dailyMax

  // Câu ví dụ từ CHÍNH các từ vừa học (mỗi từ có sẵn ex_en/ex_vi) → đổi theo batch.
  const sentences = useMemo(() => {
    const seen = new Set<string>()
    const out: { en: string; vi: string }[] = []
    for (const e of batch) {
      const en = e.ex_en?.trim()
      if (en && e.ex_vi && !seen.has(en)) {
        seen.add(en)
        out.push({ en, vi: e.ex_vi })
      }
    }
    return out
  }, [batch])

  // Hội thoại của vòng hiện tại — chọn circle có NHIỀU từ nhất trong batch.
  // topId dẫn xuất thuần từ batch (useMemo); effect chỉ còn phần nạp async
  // (setState trong callback promise — không setState đồng bộ trong effect).
  const topCircleId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of batch) {
      const c = findCircleOfWord(e.word)
      if (c) counts.set(c.id, (counts.get(c.id) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  }, [batch])

  const [loadedDialogue, setLoadedDialogue] = useState<Dialogue | null>(null)
  useEffect(() => {
    if (!topCircleId) return
    let alive = true
    getDialogues(topCircleId).then((ds) => {
      if (alive) setLoadedDialogue(ds[ds.length - 1] ?? null)
    })
    return () => {
      alive = false
    }
  }, [topCircleId])
  // Không có circle → không hiện hội thoại (thay cho setDialogue(null) đồng bộ cũ).
  const dialogue = topCircleId ? loadedDialogue : null

  return (
    <div className="animate-fade-in space-y-4">
      <div className="glass rounded-xl p-8 text-center">
        <Check className="w-10 h-10 text-accent-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">
          {isA ? 'Hoàn thành bài hôm nay!' : "Today's lesson done!"}
        </p>
        <p className="text-sm text-zinc-400 mb-1">
          {isA ? (
            <>
              {`Đã học `}
              <strong className="text-accent-300">{learnedToday}</strong>
              {` từ trong lượt này · Tổng hôm nay: `}
              <strong className="text-accent-300">{totalToday}</strong>
              {`/${dailyMax}`}
            </>
          ) : (
            <>
              Learned <strong className="text-accent-300">{learnedToday}</strong> words · Today
              total: <strong className="text-accent-300">{totalToday}</strong>/{dailyMax}
            </>
          )}
        </p>
        {canLearnMore && (
          <p className="text-xs text-zinc-400 mt-2">
            {isA
              ? `Còn ${dailyMax - totalToday} từ có thể học hôm nay.`
              : `${dailyMax - totalToday} more words available today.`}
          </p>
        )}
      </div>

      {sentences.length > 0 && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 theme-light:text-teal-900" />
              <span className="text-sm font-semibold text-white">
                {isA ? 'Câu thông dụng từ những từ vừa học' : 'Common sentences from these words'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {sentences.map((s, i) => (
              <div
                key={i}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-3"
              >
                {/* isA (học tiếng Anh): đích đọc = câu tiếng Anh, dịch hiện dưới = tiếng Việt.
                    !isA (học tiếng Việt): đích đọc = câu tiếng Việt, dịch hiện dưới = tiếng Anh. */}
                <KaraokeText
                  text={isA ? s.en : s.vi}
                  lang={isA ? 'en-US' : 'vi-VN'}
                  textClass="font-medium text-[0.9375rem] leading-snug text-teal-300 theme-light:text-teal-900"
                  buttonClass="w-full"
                />
                <p className={`text-sm text-zinc-400 mt-1 ${KARAOKE_INDENT}`}>
                  {isA ? s.vi : s.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {dialogue && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-teal-400 theme-light:text-teal-900" />
              <span className="text-sm font-semibold text-white">
                {isA ? 'Hội thoại dùng các từ vừa học' : 'A conversation using these words'}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-3">{isA ? dialogue.titleVi : dialogue.titleEn}</p>
          <div className="space-y-2.5">
            {dialogue.lines.map((ln, i) => {
              const isB = ln.who === 'B'
              const name =
                ln.who === 'A'
                  ? isA
                    ? (dialogue.speakerA?.vi ?? 'A')
                    : (dialogue.speakerA?.en ?? 'A')
                  : isA
                    ? (dialogue.speakerB?.vi ?? 'B')
                    : (dialogue.speakerB?.en ?? 'B')
              return (
                <div key={i} className={`flex ${isB ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 border ${isB ? 'bg-teal-500/10 border-teal-500/30' : 'bg-zinc-900/80 border-zinc-800/80'}`}
                  >
                    <span
                      className={`text-[0.6875rem] font-semibold tracking-wide ${isB ? 'text-teal-300 theme-light:text-teal-900' : 'text-zinc-400'}`}
                    >
                      {name}
                    </span>
                    <KaraokeText
                      text={isA ? ln.en : ln.vi}
                      lang={isA ? 'en-US' : 'vi-VN'}
                      textClass={`font-medium text-[0.9375rem] leading-snug ${isB ? 'text-teal-300 theme-light:text-teal-900' : 'text-zinc-100'}`}
                      buttonClass="w-full"
                    />
                    <p className={`text-sm text-zinc-400 mt-1 ${KARAOKE_INDENT}`}>
                      {isA ? ln.vi : ln.en}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CTA: 1 nút chính + các lựa chọn phụ (V-3 "vòng cung phiên" + đề xuất B) ──
          Nút chính: LUYỆN NGAY các từ vừa học bằng hội thoại — đóng vòng
          recognition → use (từ được bơm vào prompt Chat/Nói qua ?words=). */}
      <button
        onClick={() =>
          nav(
            `${duongDanTroTruyen()}?words=${encodeURIComponent(batch.map((w) => w.word).join(','))}`,
          )
        }
        className={buttonClass({ size: 'lg', fullWidth: true })}
      >
        <MessageCircle className="w-4 h-4" />
        {isA
          ? `Luyện ngay ${batch.length} từ này bằng hội thoại`
          : `Practice these ${batch.length} words in a chat`}
      </button>
      <button
        onClick={() =>
          nav(
            `${duongDanLuyenNoi()}?words=${encodeURIComponent(batch.map((w) => w.word).join(','))}`,
          )
        }
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 theme-light:text-sky-700 text-sm font-medium transition"
      >
        🎤 {isA ? 'Hoặc luyện nói với giọng thật' : 'Or practice speaking aloud'}
      </button>
      {canLearnMore && quizPasses < dailyMax / speed - 1 && (
        <button
          onClick={onStartQuiz}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 theme-light:text-violet-800 font-medium transition"
        >
          <ClipboardList className="w-4 h-4" />
          {isA
            ? `Muốn học thêm? Kiểm tra ngắn để mở ${speed} từ tiếp theo →`
            : `Want more? Short quiz unlocks ${speed} more words →`}
        </button>
      )}
    </div>
  )
}

export function TodayLesson({
  uid,
  isA,
  pool,
  onProgress,
  sessionCap,
}: {
  uid: string
  isA: boolean
  pool: DictEntry[]
  onProgress: () => void
  // Giới hạn RIÊNG cho batch ĐẦU của phiên này (không đổi tốc độ đã lưu) — dùng
  // cho luồng "quay lại sau khi bỏ bẵng" (② M4, lib/comeback.ts): phiên đầu chỉ
  // vài từ thay vì đủ tốc độ đã chọn. Các batch mở thêm sau (unlock qua quiz)
  // vẫn dùng tốc độ bình thường.
  sessionCap?: number
}) {
  const navigate = useNavigate()
  const dailyMax = getDailyMax(uid)
  const speed = getDailySpeed(uid)
  const initialBatchSize = sessionCap ?? speed
  const toast = useToast()

  // Phase bắt đầu dựa trên trạng thái ngày hiện tại
  const [phase, setPhase] = useState<TodayPhase>(() => {
    const learned = getDailyLearned(uid)
    if (learned >= dailyMax) return 'daily-max'
    if (learned >= getDailyAllowance(uid)) return 'batch-done'
    return 'learning'
  })
  const [batch, setBatch] = useState<DictEntry[]>(() =>
    getTodayBatchFrom(pool, getLearnedWords(uid), initialBatchSize, getSkippedToday(uid)),
  )
  const [idx, setIdx] = useState(0)
  const [dailyStart] = useState(() => getDailyLearned(uid))

  // Mini-quiz state
  const [quizQs, setQuizQs] = useState<MiniQuizQ[]>([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizSel, setQuizSel] = useState<string | null>(null)
  const [quizAns, setQuizAns] = useState<boolean[]>([])
  const [quizDone, setQuizDone] = useState(false)
  // Từ trả lời sai trong mini-quiz — ôn lại flashcard TRƯỚC KHI cho làm lại quiz.
  const [wrongWords, setWrongWords] = useState<DictEntry[]>([])
  const [reviewIdx, setReviewIdx] = useState(0)
  // [P1-6, lệnh 8] Màn kết phiên gộp `SessionDone` — hiện khi xong batch. `streakJustChanged`/
  // `weeklyGoalJustReached` chỉ báo có vừa đổi (gate + mark vẫn ở lib gốc), CẢ HAI có thể true
  // cùng lúc (trùng ngày) nhưng vẫn CHỈ MỘT overlay (AC-3).
  // Reload/Back với `?xong=1` trong URL → mở lại overlay (nội dung streak/tuần không phục
  // hồi được sau reload nên chỉ mở lại tầng (1)+(3), coi như đã qua tầng (2) lần trước).
  const [sessionDoneOpen, setSessionDoneOpen] = useState(() => isSessionDoneOpenInUrl())
  const [streakJustChanged, setStreakJustChanged] = useState(false)
  const [weeklyGoalJustReached, setWeeklyGoalJustReached] = useState(false)

  // Tiến độ CỦA CẤP này (pool đã lọc theo cấp ở trang cha) — trước đây dùng
  // getPathProgress (cả lộ trình, ~10.000 từ) gây khó hiểu khi đang xem 1 cấp.
  const progress = useMemo(() => getPoolProgress(pool, getLearnedWords(uid)), [pool, uid])
  const card = batch[idx]
  const circle = card ? findCircleOfWord(card.word) : undefined

  const circleProgress = useMemo(() => {
    if (!circle) return null
    return getCircleProgress(circle.id, getLearnedWords(uid))
  }, [circle, uid])

  function learn() {
    if (!card) return
    haptics.success() // phản hồi xúc giác khi thuộc thêm 1 từ
    sound.correct()
    markLearned(uid, card.word)
    addToSRS(uid, card.word)
    bumpDailyLearned(uid)
    markStudiedToday(uid) // ghi nhận có học hôm nay → tính streak (đồng bộ server)
    onProgress()
    // Huy hiệu mới (chuỗi ngày/khối lượng từ vựng — ② M2) — kiểm tra sau mỗi từ học
    // xong vì đây là điểm chạm thường xuyên nhất, bắt kịp lúc vừa đạt mốc.
    for (const a of checkNewAchievements(uid)) toast.success(achievementMessage(a, isA))
    const nextIdx = idx + 1
    if (nextIdx >= batch.length) {
      // Hết batch → check tổng hôm nay
      const totalToday = getDailyLearned(uid) // đã bump rồi
      if (totalToday >= dailyMax) setPhase('daily-max')
      else setPhase('batch-done')
      // Lần ĐẦU hoàn thành bài trong ngày → tầng (2) "🔥 Chuỗi N ngày" của SessionDone.
      // Đánh dấu đã ăn mừng NGAY (không đợi đóng overlay) — rời trang giữa chừng vẫn
      // không hiện lại tầng này trong cùng ngày.
      if (shouldCelebrateStreak(uid)) {
        markStreakCelebrated(uid)
        setStreakJustChanged(true)
      }
      // Hôm nay vừa thành "ngày có học" → có thể vừa chạm mục tiêu tuần.
      // Đánh dấu NGAY (không đợi đóng overlay) để rời trang giữa chừng không bắn lặp.
      if (shouldCelebrateWeeklyGoal(uid)) {
        markWeeklyGoalCelebrated(uid)
        setWeeklyGoalJustReached(true)
      }
      setSessionDoneOpen(true)
      markSessionDoneOpenInUrl()
    } else {
      setIdx(nextIdx)
    }
  }

  function skip() {
    haptics.tap()
    if (card) addSkippedToday(uid, card.word) // hoãn xuống cuối hàng đợi trong ngày, không mất hẳn
    const nextIdx = idx + 1
    if (nextIdx >= batch.length) {
      const totalToday = getDailyLearned(uid)
      if (totalToday >= dailyMax) setPhase('daily-max')
      else setPhase('batch-done')
    } else {
      setIdx(nextIdx)
    }
  }

  function startMiniQuiz() {
    setQuizQs(buildMiniQuiz(batch, pool))
    setQuizIdx(0)
    setQuizSel(null)
    setQuizAns([])
    setQuizDone(false)
    setPhase('mini-quiz')
  }

  function quizNext() {
    const q = quizQs[quizIdx]
    if (!q) return
    const ok = quizSel === q.correct
    const newAns = [...quizAns, ok]
    setQuizAns(newAns)
    if (quizIdx + 1 >= quizQs.length) {
      const wrongKeys = new Set(
        quizQs.filter((_, i) => !newAns[i]).map((qq) => qq.word.toLowerCase()),
      )
      setWrongWords(batch.filter((w) => wrongKeys.has(w.word.toLowerCase())))
      setQuizDone(true)
    } else {
      setQuizIdx((q) => q + 1)
      setQuizSel(null)
    }
  }

  // Bàn phím cho mini-quiz mở batch mới: 1..n chọn đáp án, Enter/Space sang câu tiếp.
  // Hook phải nằm ở cấp component (không đặt được trong nhánh render bên dưới), nên điều kiện
  // "đang ở màn mini-quiz và chưa chấm xong" được đưa vào `enabled`.
  const miniQuizQ = quizQs[quizIdx]
  useQuizKeyboard({
    optionCount: miniQuizQ?.options.length ?? 0,
    onPick: (i) => {
      const opt = miniQuizQ?.options[i]
      if (opt === undefined || quizSel !== null) return
      setQuizSel(opt)
      if (opt === miniQuizQ?.correct) {
        haptics.success()
        sound.correct()
      } else {
        vibrate(60)
        sound.wrong()
      }
    },
    onNext: quizNext,
    answered: quizSel !== null,
    enabled: phase === 'mini-quiz' && !quizDone && Boolean(miniQuizQ),
  })

  // Xem lại flashcard của từng từ trả lời sai TRƯỚC KHI làm lại quiz.
  function startWrongReview() {
    setReviewIdx(0)
    setPhase('mini-quiz-review')
  }

  function reviewNext() {
    if (reviewIdx + 1 >= wrongWords.length) {
      startMiniQuiz()
    } else {
      setReviewIdx((i) => i + 1)
    }
  }

  function unlockNextBatch() {
    bumpDailyQuizPasses(uid)
    const newBatch = getTodayBatchFrom(pool, getLearnedWords(uid), speed, getSkippedToday(uid))
    setBatch(newBatch)
    setIdx(0)
    setPhase('learning')
    onProgress()
  }

  // ── Đã thuộc hết từ vựng của cấp này ──────────────────────────────────
  // Trước đây chỉ kiểm `phase === 'learning'` — nhưng batch.length === 0 CHỈ có thể xảy ra
  // khi pool đã học hết (getTodayBatchFrom lọc từ CHƯA thuộc, độc lập với giới hạn/lượt
  // ngày). Người đã thuộc hết pool VÀ vừa hết lượt hôm nay (phase khởi tạo = 'batch-done')
  // trước đây rơi thẳng vào BatchDoneView với batch rỗng → "Hoàn thành! Đã học 0 từ trong
  // lượt này" + CTA "Luyện 0 từ này" vô nghĩa (audit toàn diện 2026-08-23). `phase ===
  // 'daily-max'` KHÔNG cần sửa — màn hình đó đã đúng và không phụ thuộc `batch`.
  if (batch.length === 0 && (phase === 'learning' || phase === 'batch-done')) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <Trophy className="w-10 h-10 text-amber-400 theme-light:text-amber-900 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">
          {isA
            ? 'Tuyệt vời! Bạn đã thuộc hết từ vựng phần này.'
            : 'Amazing! You learned all words here.'}
        </p>
        <p className="text-sm text-zinc-400">
          {isA
            ? 'Hãy ôn lại để nhớ lâu hơn, hoặc sang cấp tiếp theo.'
            : 'Review SRS to retain more, or move to the next level.'}
        </p>
      </div>
    )
  }

  // ── Màn kết phiên gộp (P1-6, lệnh 8) — hiện TRƯỚC màn xong bài, gộp streak + tuần
  // thành CÙNG MỘT overlay (AC-3) thay vì hai màn nối tiếp như trước.
  if (sessionDoneOpen) {
    const sessionOutcome: SessionOutcome = {
      subjectId: 'english',
      contentId: `batch-${dailyStart}`,
      kind: 'lesson',
      steps: batch.length,
      durationSec: 0,
    }
    const closeSessionDone = () => {
      setSessionDoneOpen(false)
      setStreakJustChanged(false)
      setWeeklyGoalJustReached(false)
      clearSessionDoneOpenInUrl()
    }
    return (
      <SessionDone
        outcome={sessionOutcome}
        uid={uid}
        isA={isA}
        srsDue={getDueWords(uid, pool).length}
        streakJustChanged={streakJustChanged}
        weeklyGoalJustReached={weeklyGoalJustReached}
        onClose={closeSessionDone}
        onMore={() => {
          closeSessionDone()
          navigate('/goc-hoc-tap/on-tap')
        }}
      />
    )
  }

  // ── Đã đạt 100 từ/ngày ────────────────────────────────────────────────
  if (phase === 'daily-max') {
    const streakTomorrow = getStreak(uid) + 1
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in space-y-2">
        <Trophy className="w-10 h-10 text-amber-400 theme-light:text-amber-900 mx-auto" />
        <p className="text-white font-semibold">
          {isA
            ? `Xuất sắc! Đã học đủ ${dailyMax} từ hôm nay 🎉`
            : `Amazing! ${dailyMax} words learned today 🎉`}
        </p>
        {/* Móc quay lại: cho thấy phần thưởng cụ thể của ngày mai (V-3 "kết" phiên) */}
        <p className="text-sm text-orange-400 theme-light:text-orange-900">
          {isA
            ? `🔥 Hẹn mai nhé — chuỗi sẽ thành ${streakTomorrow} ngày!`
            : `🔥 See you tomorrow — your streak becomes ${streakTomorrow} days!`}
        </p>
        <p className="text-xs text-zinc-400 pt-1">
          {isA
            ? 'Trong khi chờ, hãy ôn SRS để nhớ lâu hơn.'
            : 'Meanwhile, review SRS to retain better.'}
        </p>
      </div>
    )
  }

  // ── Xong batch, chờ kiểm tra ──────────────────────────────────────────
  if (phase === 'batch-done') {
    return (
      <BatchDoneView
        batch={batch}
        uid={uid}
        isA={isA}
        dailyStart={dailyStart}
        onStartQuiz={startMiniQuiz}
      />
    )
  }

  // ── Mini-quiz mở batch mới ────────────────────────────────────────────
  if (phase === 'mini-quiz') {
    const q = quizQs[quizIdx]
    const score = quizAns.filter(Boolean).length
    const passed = quizAns.length === quizQs.length && isQuizPass(score, quizQs.length)

    if (quizDone) {
      if (passed) {
        return (
          <div className="glass rounded-xl p-8 text-center animate-fade-in space-y-3">
            <p className="text-4xl">🏆</p>
            <p className="text-white font-semibold">
              {isA
                ? `Xuất sắc! ${score}/${quizQs.length} đúng!`
                : `Great! ${score}/${quizQs.length} correct!`}
            </p>
            <p className="text-sm text-zinc-400">
              {isA
                ? `Bạn đã mở được ${speed} từ mới. Tiếp tục thôi!`
                : `You unlocked ${speed} more words. Keep going!`}
            </p>
            <button
              onClick={unlockNextBatch}
              className={buttonClass({ size: 'lg', fullWidth: true, className: 'mt-2' })}
            >
              {isA ? `Học ${speed} từ tiếp theo →` : `Learn next ${speed} words →`}
            </button>
          </div>
        )
      }
      return (
        <div className="glass rounded-xl p-8 text-center animate-fade-in space-y-3">
          <p className="text-4xl">📚</p>
          <p className="text-white font-semibold">
            {isA
              ? `${score}/${quizQs.length} — Cần đạt ≥${QUIZ_PASS_THRESHOLD_PCT}% để mở batch mới`
              : `${score}/${quizQs.length} — Need ≥${QUIZ_PASS_THRESHOLD_PCT}% to unlock next batch`}
          </p>
          <p className="text-sm text-zinc-400">
            {isA ? 'Ôn lại rồi thử lại nhé!' : 'Review and try again!'}
          </p>
          <button
            onClick={wrongWords.length > 0 ? startWrongReview : startMiniQuiz}
            className="w-full py-3 rounded-2xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 theme-light:text-violet-800 font-medium transition"
          >
            <RotateCcw className="w-4 h-4 inline mr-1" />
            {wrongWords.length > 0
              ? isA
                ? `Ôn lại ${wrongWords.length} từ sai rồi làm lại`
                : `Review ${wrongWords.length} missed words then retry`
              : isA
                ? 'Làm lại kiểm tra'
                : 'Retry quiz'}
          </button>
          <button
            onClick={() => setPhase('batch-done')}
            className={buttonClass({ variant: 'outline', fullWidth: true })}
          >
            {isA ? 'Ôn lại từ vừa học trước' : 'Review words first'}
          </button>
        </div>
      )
    }

    if (!q) return null // quizIdx luôn hợp lệ ở nhánh này; guard để TS narrow kiểu
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="text-violet-400 theme-light:text-violet-800 font-medium">
            {isA ? 'Kiểm tra mở batch mới' : 'Quiz to unlock next batch'}
          </span>
          <span>
            {quizIdx + 1}/{quizQs.length}
          </span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full">
          <div
            className="h-full bg-violet-500 rounded-full transition-[width]"
            style={{ width: `${(quizIdx / quizQs.length) * 100}%` }}
          />
        </div>
        <div className="text-center py-4">
          <p className="text-xs text-zinc-400 mb-3">
            {q.direction === 'en-vi'
              ? isA
                ? 'Nghĩa tiếng Việt của từ này là?'
                : 'Vietnamese meaning?'
              : isA
                ? 'Từ tiếng Anh của nghĩa này là?'
                : 'English word for this meaning?'}
          </p>
          <p className="text-4xl font-bold text-white">{q.prompt}</p>
        </div>
        <div className="space-y-2.5">
          {q.options.map((opt, optIdx) => {
            let cls = 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-600'
            if (quizSel !== null) {
              // Đúng → phồng nhẹ; đáp án sai đã chọn → lắc ngang (phản hồi tức thì)
              if (opt === q.correct)
                cls = 'bg-accent-500/20 border-accent-500/60 text-accent-300 animate-pop-correct'
              else if (opt === quizSel)
                cls =
                  'bg-rose-500/20 border-rose-500/60 text-rose-300 theme-light:text-rose-900 animate-shake'
              else cls = 'bg-zinc-900/40 border-zinc-800/40 text-zinc-400'
            }
            return (
              <button
                key={opt}
                onClick={() => {
                  if (quizSel === null) {
                    setQuizSel(opt)
                    if (opt === q.correct) {
                      haptics.success()
                      sound.correct()
                    } else {
                      vibrate(60)
                      sound.wrong()
                    }
                  }
                }}
                className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border font-medium text-[0.9375rem] transition-colors ${cls}`}
              >
                <QuizOptionKey index={optIdx} />
                <span className="min-w-0 flex-1">{opt}</span>
              </button>
            )
          })}
        </div>
        {quizSel !== null && (
          <button
            onClick={quizNext}
            className={buttonClass({
              variant: 'primary',
              size: 'lg',
              fullWidth: true,
              className: 'animate-fade-in',
            })}
          >
            {quizIdx + 1 >= quizQs.length
              ? isA
                ? 'Xem kết quả'
                : 'See results'
              : isA
                ? 'Câu tiếp theo'
                : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // ── Ôn lại flashcard của từ trả lời sai TRƯỚC KHI làm lại mini-quiz ────
  if (phase === 'mini-quiz-review') {
    const reviewCard = wrongWords[reviewIdx]
    if (!reviewCard) return null // wrongWords không rỗng khi vào phase này
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <span>{isA ? 'Ôn lại từ đã trả lời sai' : 'Review missed words'}</span>
          <span>
            {reviewIdx + 1}/{wrongWords.length}
          </span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full mb-4">
          <div
            className="h-full bg-violet-500 rounded-full transition-[width]"
            style={{ width: `${((reviewIdx + 1) / wrongWords.length) * 100}%` }}
          />
        </div>

        <div key={reviewCard.word} className="animate-fade-in">
          <WordCard card={reviewCard} isA={isA} uid={uid} onUpdate={onProgress} />
        </div>

        <button
          onClick={reviewNext}
          className="w-full flex items-center justify-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 theme-light:text-violet-800 transition py-3 rounded-xl text-sm font-medium mt-3"
        >
          {reviewIdx + 1 >= wrongWords.length
            ? isA
              ? 'Làm lại kiểm tra'
              : 'Retry quiz'
            : isA
              ? 'Từ tiếp theo'
              : 'Next word'}
        </button>
      </div>
    )
  }

  // ── Đang học ──────────────────────────────────────────────────────────
  if (!card) return null // idx luôn trong batch ở phase này; guard để TS narrow kiểu
  // Cấp CEFR của vòng đang học (null với vòng mở rộng) — hiện chip nhỏ cho biết
  // từ hôm nay thuộc cấp nào.
  const circleLevel = circle ? getCefrLevelOfCircle(circle.id) : null
  // Màn mở phiên (V-3): 1 dòng cho biết lượt này gồm gì — chỉ hiện ở thẻ ĐẦU,
  // tự biến mất khi sang thẻ 2 (không thêm bước bấm nào).
  const srsWaiting = idx === 0 ? getDueWords(uid, pool).length : 0
  return (
    <div className="animate-fade-in">
      {idx === 0 && (
        <div className="glass rounded-xl px-4 py-2.5 mb-3 text-center">
          <p className="text-sm text-white font-medium">
            {isA
              ? `Lượt này: ${batch.length} từ mới · ~${Math.max(2, Math.round(batch.length / 2))} phút`
              : `This round: ${batch.length} new words · ~${Math.max(2, Math.round(batch.length / 2))} min`}
          </p>
          {srsWaiting > 0 && (
            <p className="text-xs text-zinc-400 mt-0.5">
              {isA
                ? `+ ${srsWaiting} thẻ SRS đang chờ ôn sau đó`
                : `+ ${srsWaiting} SRS cards waiting after`}
            </p>
          )}
          {/* NÓI RÕ khi phiên bị rút gọn (2026-09-03).
              Luồng "quay lại sau khi bỏ bẵng" (lib/comeback.ts) trỏ tới `?cap=3`, khiến lượt
              đầu chỉ còn 3 từ thay vì tốc độ đã chọn. Trước đây app KHÔNG nói gì: người học
              thấy ít bài hơn thường lệ mà không biết vì sao — dễ tưởng mất tiến độ hoặc app
              lỗi. Một dòng giải thích rẻ hơn nhiều so với việc để họ tự đoán.
              Chỉ hiện khi cap thật sự NHỎ HƠN tốc độ thường; `?cap=` bằng hoặc lớn hơn thì
              không có gì để giải thích. */}
          {sessionCap != null && sessionCap < speed && (
            <p className="text-xs text-accent-300 theme-light:text-accent-800 mt-0.5">
              {isA
                ? `Phiên nhẹ để quay lại: ${sessionCap} từ thay vì ${speed}. Xong vẫn học tiếp được.`
                : `Easy restart session: ${sessionCap} words instead of ${speed}. You can keep going after.`}
            </p>
          )}
        </div>
      )}
      {/* Tên chủ đề + cấp CEFR + tiến độ vòng */}
      {circle && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 mb-2">
          {circleLevel && (
            <span className="px-1.5 py-0.5 rounded bg-accent-500/15 text-accent-300 theme-light:text-accent-900 font-bold text-[0.6875rem]">
              {circleLevel}
            </span>
          )}
          <span>{circle.emoji}</span>
          <span>{isA ? circle.titleVi : circle.titleEn}</span>
          {circleProgress && circleProgress.total > 0 && (
            <span className="text-zinc-400">
              ({circleProgress.done}/{circleProgress.total})
            </span>
          )}
        </div>
      )}

      {/* Tiến độ trong lượt — số bước pop nhẹ khi nhảy, thanh chạy mượt */}
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
        <span>
          {isA ? 'Từ' : 'Word'}{' '}
          <span key={idx} className="inline-block animate-pop-correct">
            {idx + 1}
          </span>
          /{batch.length}
        </span>
        <span className="text-zinc-400">
          {isA ? 'Tổng đã thuộc' : 'Total learned'}: {progress.done}/{progress.total}
        </span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full mb-4">
        <div
          className="h-full bg-accent-500 rounded-full transition-[width] duration-300"
          style={{ width: `${(idx / batch.length) * 100}%` }}
        />
      </div>

      {/* key theo từ → thẻ mới trượt vào khi chuyển */}
      <div key={card.word} className="animate-fade-in">
        <WordCard card={card} isA={isA} uid={uid} onUpdate={onProgress} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={skip} className={buttonClass({ variant: 'outline' })}>
          <X className="w-4 h-4" /> {isA ? 'Để sau' : 'Later'}
        </button>
        <button onClick={learn} className={buttonClass({ variant: 'secondary' })}>
          <Check className="w-4 h-4" /> {isA ? 'Đã thuộc' : 'Got it'}
        </button>
      </div>
    </div>
  )
}

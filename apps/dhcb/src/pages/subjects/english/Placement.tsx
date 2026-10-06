import { getStoredToken } from '@core/authHeader'
// ──────────────────────────────────────────────────────────────────────
// BÀI TEST XẾP LỚP ĐẦU VÀO — trang riêng, KHÔNG bọc RequireAuth (giống /onboarding)
// vì có thể vào từ giữa luồng onboarding, trước khi user.onboarded = true.
//
// Nguồn: docs/research/dac-ta-nang-cap-su-pham-2026-07-15.md (mục ④). Thuật toán
// bậc thang thuần ở lib/placement.ts; trang này chỉ lo dựng câu hỏi (tái dùng
// buildExam của lib/cefrExam.ts qua PLACEMENT_ROUND_PLAN) + UI + điều hướng.
//
// 2 nơi vào trang này (phân biệt qua location.state.from):
//   - 'onboarding': từ Onboarding bước 1 → xong bài test KHÔNG tự lưu vào profiles
//     (tránh set onboarded=true giữa chừng) — quay lại /onboarding kèm presetLevel,
//     Onboarding tự hoàn tất bước mục tiêu/thời gian rồi lưu thật.
//   - mặc định (từ /profile, "Kiểm tra lại trình độ"): áp kết quả NGAY vào profiles
//     (chỉ đổi level, giữ nguyên goal/dailyMinutes đã có) rồi quay lại /profile.
// ──────────────────────────────────────────────────────────────────────

import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import { GraduationCap, ArrowLeft, Sparkles, RotateCcw } from 'lucide-react'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import ExamQuestionCard from '../../../components/ExamQuestionCard'
import { useAuth } from '../../../context/useAuth'
import { getDirection } from '../../../lib/storage'
import { ACCENT } from '../../../lib/cefrAccent'
import { CEFR_LEVELS, type CefrLevel } from '../../../data/cefr'
import type { Dialogue } from '../../../data/dialogues'
import { getDialogues } from '../../../data/dialoguesLoader'
import { getLevelWords } from '../../../lib/curriculum'
import { getLearnedWords } from '../../../lib/vocab'
import { stopSpeaking } from '../../../lib/tts'
import { buildExam, levelGrammarSources, type ExamQuestion } from '../../../lib/cefrExam'
import {
  nextPlacementStep,
  canRetakePlacement,
  PLACEMENT_START,
  PLACEMENT_ROUND_PLAN,
  PLACEMENT_MAX_ROUNDS,
  type CefrId,
  type PlacementRound,
  type PlacementResult,
} from '../../../lib/placement'
import { getPlacementResult, savePlacementResult } from '../../../lib/placementResult'
import { saveOnboarding } from '../../../lib/cloud'
import { cacheOnboarding, getCachedOnboarding } from '../../../lib/onboarding'
import { setDailySpeed } from '../../../lib/curriculum'
import { minutesToSpeed } from '../../../lib/onboarding'

// Màu nhấn trung tính cho bài test (không gắn với 1 cấp CEFR cụ thể như CefrExam).
const accent = ACCENT.emerald

const CEFR_LABEL: Record<CefrId, { vi: string; en: string }> = {
  A1: { vi: 'A1 · Mới bắt đầu', en: 'A1 · Beginner' },
  A2: { vi: 'A2 · Sơ cấp', en: 'A2 · Elementary' },
  B1: { vi: 'B1 · Trung cấp', en: 'B1 · Intermediate' },
  B2: { vi: 'B2 · Trung cấp cao', en: 'B2 · Upper-intermediate' },
  C1: { vi: 'C1 · Nâng cao', en: 'C1 · Advanced' },
  C2: { vi: 'C2 · Thành thạo', en: 'C2 · Proficient' },
}

type Phase = 'intro' | 'testing' | 'result'

export default function Placement() {
  const { user } = useAuth()
  return <PlacementSession key={user?.id ?? ''} />
}

function PlacementSession() {
  const nav = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isA = getDirection() === 'A'
  const fromOnboarding = (location.state as { from?: string } | null)?.from === 'onboarding'

  const [phase, setPhase] = useState<Phase>('intro')
  const [history, setHistory] = useState<PlacementRound[]>([])
  const [levelObj, setLevelObj] = useState<CefrLevel | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [result, setResult] = useState<PlacementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [roundToLoad, setRoundToLoad] = useState<CefrId>(PLACEMENT_START)
  const steps = useMemo(
    () => ({ questions, picked: new Set<number>(), advanced: new Set<number>() }),
    [questions],
  )
  const resultHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (phase === 'result') resultHeading.current?.focus()
  }, [phase])
  const requestId = useRef(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const pendingSave = useRef(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(
    () => () => {
      requestId.current += 1
    },
    [],
  )

  usePageTitle('Kiểm tra trình độ | Môn tiếng Anh · Đồng Hành Cùng Bạn')

  if (!user) return null // như /onboarding: chưa đăng nhập thì AuthProvider tự điều hướng /login

  const saved = getPlacementResult(user.id)
  const canRetake = canRetakePlacement(saved?.lastAt ?? null)

  // Dựng 1 vòng thi ở cấp `levelId`: nạp hội thoại của cấp rồi buildExam thu nhỏ.
  async function loadRound(levelId: CefrId) {
    const level = CEFR_LEVELS.find((l) => l.id === levelId)
    if (!level || !user) return
    const request = ++requestId.current
    setRoundToLoad(levelId)
    setLoadError(false)
    setLoading(true)
    try {
      const dialogueLists = await Promise.all(level.units.map((u) => getDialogues(u.id)))
      if (request !== requestId.current) return
      const dialogues: Dialogue[] = dialogueLists.flat()
      const qs = buildExam({
        isA,
        words: getLevelWords(level.id, getCachedOnboarding(user.id)?.ageGroup),
        learned: getLearnedWords(user.id),
        grammar: levelGrammarSources(level),
        dialogues,
        plan: PLACEMENT_ROUND_PLAN,
      })
      // Thiếu câu hỏi không phải bằng chứng về trình độ của người học.
      if (qs.length === 0) throw new Error('No placement questions')
      setLevelObj(level)
      setQuestions(qs)
      setCurrent(0)
      setSelected(null)
      setAnswers([])
    } catch {
      if (request === requestId.current) setLoadError(true)
    } finally {
      if (request === requestId.current) setLoading(false)
    }
  }

  function startTest() {
    setHistory([])
    setPhase('testing')
    void loadRound(PLACEMENT_START)
  }

  function pick(opt: string) {
    const q = questions?.[current]
    if (
      phase !== 'testing' ||
      loading ||
      loadError ||
      !q ||
      selected !== null ||
      steps.picked.has(current) ||
      steps.advanced.has(current) ||
      !q.options.includes(opt)
    )
      return
    steps.picked.add(current)
    setSelected(opt)
  }

  function next() {
    if (
      phase !== 'testing' ||
      loading ||
      loadError ||
      !questions ||
      !levelObj ||
      selected === null ||
      steps.advanced.has(current)
    )
      return
    const q = questions[current]
    if (!q) return
    steps.advanced.add(current)
    const ok = selected === q?.correct
    const newAnswers = [...answers, ok]
    setAnswers(newAnswers)

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1)
      setSelected(null)
      return
    }

    // Hết câu của vòng → chấm điểm vòng, hỏi bước kế tiếp.
    stopSpeaking()
    const correct = newAnswers.filter(Boolean).length
    const pct = Math.round((correct / questions.length) * 100)
    const newHistory = [...history, { levelId: levelObj.id, pct }]
    setHistory(newHistory)
    const step = nextPlacementStep(newHistory)
    if (step.done) {
      finish(step.result)
    } else {
      void loadRound(step.nextLevel)
    }
  }

  function finish(res: PlacementResult) {
    if (!user) return
    savePlacementResult(user.id, res)
    setResult(res)
    setPhase('result')
  }

  // Áp kết quả vào profiles NGAY (chỉ đổi level, giữ goal/dailyMinutes đã có) —
  // dùng khi thi từ /profile (đã onboarded từ trước).
  async function applyResultNow(res: PlacementResult) {
    if (!user || pendingSave.current) return
    pendingSave.current = true
    setSaving(true)
    setSaveError(false)
    const token = getStoredToken()
    const cached = getCachedOnboarding(user.id)
    const goal = cached?.goal ?? 'daily'
    const dailyMinutes = cached?.dailyMinutes ?? 10
    const ageGroup = cached?.ageGroup ?? 'nguoi_lon'
    try {
      const outcome = await saveOnboarding({ level: res.appLevel, goal, dailyMinutes, ageGroup })
      if (!mounted.current || token !== getStoredToken()) return
      if (!outcome.ok) {
        setSaveError(true)
        return
      }
      cacheOnboarding(user.id, { level: res.appLevel, goal, dailyMinutes, ageGroup })
      setDailySpeed(user.id, minutesToSpeed(dailyMinutes))
      nav('/cai-dat', { replace: true })
    } catch {
      if (mounted.current) setSaveError(true)
    } finally {
      pendingSave.current = false
      if (mounted.current) setSaving(false)
    }
  }

  function continueAfterResult() {
    if (!result) return
    if (fromOnboarding) {
      // Chưa lưu profiles ở đây — để Onboarding tự hoàn tất bước mục tiêu/thời
      // gian rồi lưu 1 lần (tránh set onboarded=true giữa chừng).
      nav('/onboarding', { replace: true, state: { presetLevel: result.appLevel } })
    } else {
      void applyResultNow(result)
    }
  }

  function skipTest() {
    requestId.current += 1
    stopSpeaking()
    if (fromOnboarding) nav('/onboarding', { replace: true })
    else nav('/cai-dat', { replace: true })
  }

  // ── Màn giới thiệu ─────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh bg-zinc-950">
        {!fromOnboarding && (
          <Layout
            backTo={duongDanMonTiengAnh()}
            title={isA ? '🎯 Test xếp lớp' : '🎯 Placement test'}
          />
        )}
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] Luồng tuần tự hẹp → width reading. */}
        <PageShell
          width="reading"
          baseWidth="max-w-lg"
          className={`!pb-[calc(1.5rem+var(--bnav-h))] space-y-5 ${fromOnboarding ? '!pt-10' : ''}`}
        >
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            {isA ? '🎯 Test xếp lớp' : '🎯 Placement test'}
          </h1>

          {saved && !canRetake ? (
            <div className="glass rounded-2xl p-6 text-center space-y-3 animate-fade-in">
              <GraduationCap className={`w-8 h-8 mx-auto ${accent.text}`} />
              <p className="text-sm text-zinc-300">
                {isA
                  ? 'Bạn đã làm bài test này gần đây. Kết quả:'
                  : "You've taken this test recently. Result:"}
              </p>
              <p className="text-2xl font-bold text-white">
                {isA ? CEFR_LABEL[saved.cefr].vi : CEFR_LABEL[saved.cefr].en}
              </p>
              <button
                onClick={() => continueAfterResultFromSaved()}
                className="w-full bg-accent-500 hover:bg-accent-400 text-black font-semibold py-3 rounded-2xl transition"
              >
                {isA ? 'Dùng kết quả này' : 'Use this result'}
              </button>
              <button
                onClick={skipTest}
                className="tap-44-y w-full text-sm text-zinc-400 hover:text-zinc-200 py-2 transition"
              >
                {isA ? 'Bỏ qua — tự chọn trình độ' : 'Skip — pick manually'}
              </button>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center space-y-4 animate-fade-in">
              <Sparkles className={`w-8 h-8 mx-auto ${accent.text}`} />
              <p className="text-sm text-zinc-400">
                {isA
                  ? `Tối đa ${PLACEMENT_MAX_ROUNDS} vòng, mỗi vòng ${Object.values(PLACEMENT_ROUND_PLAN).reduce((a, b) => a + b, 0)} câu (từ vựng · ngữ pháp · nghe · đọc hiểu). Câu hỏi tự điều chỉnh độ khó theo bạn.`
                  : `Up to ${PLACEMENT_MAX_ROUNDS} rounds, ${Object.values(PLACEMENT_ROUND_PLAN).reduce((a, b) => a + b, 0)} questions each (vocabulary · grammar · listening · reading). Difficulty adapts to you.`}
              </p>
              <button
                onClick={startTest}
                className="w-full bg-accent-500 hover:bg-accent-400 text-black font-semibold py-3 rounded-2xl transition"
              >
                {isA ? 'Bắt đầu' : 'Start'}
              </button>
              <button
                onClick={skipTest}
                className="tap-44-y w-full text-sm text-zinc-400 hover:text-zinc-200 py-2 transition"
              >
                {isA ? 'Bỏ qua — tự chọn trình độ' : 'Skip — pick manually'}
              </button>
            </div>
          )}
        </PageShell>
      </div>
    )
  }

  // Dùng kết quả ĐÃ LƯU trước đó (không thi lại) — chỉ hợp lệ khi `saved` tồn tại.
  function continueAfterResultFromSaved() {
    if (!saved) return
    finish({ cefr: saved.cefr, appLevel: saved.appLevel })
  }

  // ── Màn kết quả ─────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div className="min-h-dvh bg-zinc-950">
        {!fromOnboarding && <Layout backTo={duongDanMonTiengAnh()} />}
        <PageShell
          width="reading"
          baseWidth="max-w-lg"
          className={`!pb-[calc(1.5rem+var(--bnav-h))] space-y-5 ${fromOnboarding ? '!pt-10' : ''}`}
        >
          {/* [S07d] Mỗi màn có đúng một h1 — trình đọc màn hình nhảy theo tiêu đề cần biết
              đang ở trang nào; tiêu đề nhìn thấy là h2 trình độ ngay dưới. */}
          <h1 className="sr-only">{isA ? 'Kết quả test xếp lớp' : 'Placement test result'}</h1>
          <div className="glass rounded-2xl p-8 text-center space-y-3 animate-fade-in">
            <p className="text-5xl">🎓</p>
            <p className="text-sm text-zinc-400">
              {isA ? 'Trình độ đề xuất của bạn:' : 'Your suggested level:'}
            </p>
            <h2 ref={resultHeading} tabIndex={-1} className="text-3xl font-bold text-white">
              {isA ? CEFR_LABEL[result.cefr].vi : CEFR_LABEL[result.cefr].en}
            </h2>
            {saveError && (
              <p role="alert" className="text-sm text-content leading-relaxed">
                {isA
                  ? 'Chưa xác nhận được việc lưu hồ sơ. Kết quả vẫn còn; hãy thử lại.'
                  : 'Could not confirm the profile was saved. Your result is still here; please try again.'}
              </p>
            )}
            <button
              disabled={saving}
              onClick={continueAfterResult}
              className="w-full mt-4 bg-accent-500 hover:bg-accent-400 text-black font-semibold py-3 rounded-2xl transition"
            >
              {saving
                ? isA
                  ? 'Đang lưu…'
                  : 'Saving…'
                : saveError
                  ? isA
                    ? 'Thử lưu lại'
                    : 'Retry saving'
                  : isA
                    ? 'Tiếp tục'
                    : 'Continue'}
            </button>
          </div>
        </PageShell>
      </div>
    )
  }

  // ── Màn đang thi (hoặc đang nạp câu hỏi) ─────────────────────────────────
  return (
    <div className="min-h-dvh bg-zinc-950">
      {!fromOnboarding && <Layout backTo={duongDanMonTiengAnh()} />}
      <PageShell
        width="reading"
        baseWidth="max-w-lg"
        className={`!pb-[calc(1.5rem+var(--bnav-h))] space-y-4 ${fromOnboarding ? '!pt-10' : ''}`}
      >
        {/* [S07d] h1 ẩn thị giác, cùng khuôn màn bắt đầu — màn đang thi trước đây có 0 h1. */}
        <h1 className="sr-only">{isA ? '🎯 Test xếp lớp' : '🎯 Placement test'}</h1>
        {loadError ? (
          <div className="glass rounded-xl p-6 space-y-4">
            <p role="alert" className="text-content leading-relaxed">
              {isA
                ? 'Chưa tải được câu hỏi. Bạn có thể thử lại; các vòng đã làm vẫn được giữ trong phiên này.'
                : 'Could not load questions. Try again; completed rounds are kept in this session.'}
            </p>
            <button
              type="button"
              onClick={() => void loadRound(roundToLoad)}
              className="tap-44 w-full rounded-xl bg-accent-500 px-4 py-3 font-semibold text-black hover:bg-accent-400 transition-colors"
            >
              {isA ? 'Thử lại' : 'Try again'}
            </button>
            <button
              type="button"
              onClick={skipTest}
              className="tap-44 w-full rounded-xl bg-zinc-800 px-4 py-3 text-content transition-colors hover:bg-zinc-700"
            >
              {isA ? 'Thoát bài kiểm tra' : 'Exit test'}
            </button>
          </div>
        ) : loading || !questions || !levelObj ? (
          <div className="glass rounded-xl p-8 text-center animate-fade-in">
            <RotateCcw
              className={`w-6 h-6 mx-auto mb-2 animate-spin motion-reduce:animate-none ${accent.text}`}
            />
            <p className="text-zinc-400 text-sm">
              {isA ? 'Đang chuẩn bị câu hỏi…' : 'Preparing questions…'}
            </p>
          </div>
        ) : (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={skipTest}
                className="tap-44 -ml-2 px-2 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition"
              >
                <ArrowLeft className="w-4 h-4" /> {isA ? 'Thoát' : 'Exit'}
              </button>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <GraduationCap className={`w-4 h-4 ${accent.text}`} />
                {isA
                  ? `Vòng ${history.length + 1}/${PLACEMENT_MAX_ROUNDS} · ${levelObj.id}`
                  : `Round ${history.length + 1}/${PLACEMENT_MAX_ROUNDS} · ${levelObj.id}`}
              </span>
              <span className="text-xs text-zinc-400">
                {current + 1}/{questions.length}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${accent.bar} transition-all`}
                style={{ width: `${(current / questions.length) * 100}%` }}
              />
            </div>
            <ExamQuestionCard
              q={questions[current] as ExamQuestion}
              isA={isA}
              accent={accent}
              current={current}
              total={questions.length}
              selected={selected}
              onPick={pick}
              onNext={next}
              nextLabel={{
                last: isA ? 'Xong vòng này' : 'Finish round',
                more: isA ? 'Câu tiếp theo' : 'Next',
              }}
            />
          </div>
        )}
      </PageShell>
    </div>
  )
}

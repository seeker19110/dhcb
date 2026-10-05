import { useState } from 'react'
import { thongDiepLoiThanThien } from '../../../lib/friendlyError'
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { PenLine, Send, RotateCcw, ChevronDown, Trophy } from 'lucide-react'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { saveWritingSub, getUsage, incrementUsage, getDirection } from '../../../lib/storage'
import { addMistakes, scheduleMistakeSync } from '../../../lib/mistakes'
import { checkNewAchievements, achievementMessage } from '../../../lib/achievements'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '@core/ToastProvider'
import { useCloudSync } from '../../../lib/useCloudSync'
import { useApiThrottle } from '../../../lib/useApiThrottle'
import { callClaude, parseJson, hasNumberFields } from '../../../lib/ai'
import { writingSystemPrompt } from '../../../prompts'
import { useOnboarding } from '../../../lib/onboarding'
import type { WritingSubmission, Direction } from '../../../types'
import { effectivePlan } from '../../../lib/promo'
import { getLimits } from '../../../lib/appSettings'
import { useEdgeAi } from '../../../lib/edgeAi/useEdgeAi.js'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { PageShell } from '@core/PageShell'
import { TwoPane } from '@core/TwoPane'
import EdgeAiIndicator from '../../../components/EdgeAi/EdgeAiIndicator'

// Đề bài mẫu — Chiều A: đề IELTS tiếng Anh | Chiều B: đề viết tiếng Việt
const SAMPLE_PROMPTS_A = [
  'Some people think that children should be taught to be competitive. Others believe cooperation is more important. Discuss both views and give your opinion.',
  'The internet has made the world a smaller place. Do the advantages of this outweigh the disadvantages?',
  'In many countries, the number of people choosing to live alone has increased. What are the reasons for this? Is this a positive or negative development?',
  'Some people believe that unpaid community service should be compulsory for teenagers. To what extent do you agree or disagree?',
]
const SAMPLE_PROMPTS_B = [
  'Hãy mô tả một địa điểm yêu thích của bạn ở Việt Nam và giải thích tại sao bạn yêu thích nó.',
  'Bạn nghĩ gì về văn hóa ẩm thực Việt Nam? Hãy giới thiệu một món ăn truyền thống mà bạn thích.',
  'Kể về một kỳ nghỉ lễ hoặc sự kiện đặc biệt ở Việt Nam và ý nghĩa của nó.',
  'Phong tục Tết Nguyên Đán ở Việt Nam là gì? Hãy mô tả những hoạt động truyền thống trong dịp này.',
]

interface Scores {
  task_response: number
  coherence: number
  lexical: number
  grammar: number
  overall: number
}
interface FeedbackData {
  scores: Scores
  errors: { original: string; corrected: string; explanation: string }[]
  suggestions: string[]
  sample: string
  encouragement: string
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 9) * 100
  const color = score >= 7 ? 'bg-accent-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    score >= 7
      ? 'text-accent-400 theme-light:text-accent-800'
      : score >= 5
        ? 'text-amber-400 theme-light:text-amber-800'
        : 'text-red-400 theme-light:text-red-700'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-6 text-right ${textColor}`}>{score}</span>
    </div>
  )
}

// ResultPanel — RUỘT của phần kết quả chấm (không kèm khung trang).
// Tách riêng để dùng lại ở CẢ HAI bố cục: mobile (trang riêng, `ResultView`) và
// desktop (cột phải cạnh khung soạn bài).
function ResultPanel({
  feedback,
  onReset,
  dir,
}: {
  feedback: FeedbackData
  onReset: () => void
  dir: Direction
}) {
  const [showSample, setShowSample] = useState(false)
  const isA = dir === 'A'
  const overall = feedback.scores.overall
  const scoreGradient =
    overall >= 7
      ? 'from-emerald-400 via-teal-300 to-cyan-300'
      : overall >= 5
        ? 'from-amber-400 via-yellow-300 to-amber-200'
        : 'from-rose-500 via-red-400 to-orange-400'

  return (
    <div className="space-y-4.5 animate-fade-up">
      <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 border border-zinc-800/80 rounded-3xl p-7 text-center shadow-xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl p-3.5">
          <Trophy className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <p className="text-xs font-semibold text-zinc-400 mb-1">
          {isA ? 'Điểm ước lượng IELTS Overall' : 'Estimated IELTS Band'}
        </p>
        <div
          className={`text-7xl sm:text-8xl font-black bg-gradient-to-b ${scoreGradient} bg-clip-text text-transparent leading-none py-2 tracking-tight drop-shadow-sm`}
        >
          {overall}
        </div>
        <p className="text-sm font-medium text-zinc-300 mt-3 max-w-sm mx-auto leading-relaxed">
          {feedback.encouragement}
        </p>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 space-y-4 shadow-sm animate-fade-in delay-100 backdrop-blur-md">
        <p className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          {isA ? 'Chi tiết 4 tiêu chí chấm điểm' : 'Score breakdown'}
        </p>
        <ScoreBar label="Task Response" score={feedback.scores.task_response} />
        <ScoreBar label="Coherence & Cohesion" score={feedback.scores.coherence} />
        <ScoreBar label="Lexical Resource" score={feedback.scores.lexical} />
        <ScoreBar label="Grammatical Range" score={feedback.scores.grammar} />
      </div>

      {feedback.errors.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 space-y-3.5 shadow-sm animate-fade-in delay-150">
          <p className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {isA ? 'Lỗi cần sửa' : 'Errors to fix'}
            <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 theme-light:text-rose-900 border border-rose-500/25">
              {feedback.errors.length}
            </span>
          </p>
          <div className="space-y-3">
            {feedback.errors.map((err, i) => (
              <div
                key={i}
                className="border border-zinc-800/90 rounded-2xl overflow-hidden shadow-inner bg-zinc-950/60"
              >
                <div className="px-3.5 py-2.5 bg-red-500/10 border-b border-zinc-800/80">
                  <p className="text-xs text-red-300 theme-light:text-red-700 font-medium line-through">
                    {err.original}
                  </p>
                </div>
                <div className="px-3.5 py-2.5 bg-emerald-500/10 border-b border-zinc-800/80">
                  <p className="text-xs text-emerald-300 theme-light:text-emerald-800 font-semibold">
                    → {err.corrected}
                  </p>
                </div>
                <div className="px-3.5 py-2.5">
                  <p className="text-xs text-zinc-400">{err.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 shadow-sm animate-fade-in delay-200">
        <p className="text-sm font-bold text-zinc-100 mb-3.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {isA ? 'Gợi ý nâng band' : 'Suggestions to improve'}
        </p>
        <ul className="space-y-2.5 max-w-prose">
          {feedback.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
              <span className="text-amber-400 theme-light:text-amber-900 shrink-0 font-bold mt-0.5">
                ✦
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 shadow-sm animate-fade-in delay-250">
        <button
          onClick={() => setShowSample((p) => !p)}
          className="flex items-center justify-between w-full"
          aria-expanded={showSample}
          aria-label={isA ? 'Hiện/ẩn đoạn văn mẫu' : 'Toggle sample paragraph'}
        >
          <p className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            {isA ? 'Đoạn văn mẫu tham khảo' : 'Sample paragraph'}
          </p>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showSample ? 'rotate-180' : ''}`}
          />
        </button>
        {showSample && (
          <p className="mt-3.5 max-w-prose text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/80 rounded-2xl p-4.5 border border-zinc-800/80 shadow-inner">
            {feedback.sample}
          </p>
        )}
      </div>

      <button
        onClick={onReset}
        aria-label={isA ? 'Bài viết mới' : 'New essay'}
        className="w-full flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white rounded-2xl py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-zinc-850 active:scale-[0.98] shadow-sm"
      >
        <RotateCcw className="w-4 h-4" />
        {isA ? 'Viết bài luận mới' : 'New essay'}
      </button>
    </div>
  )
}

// ResultView — bố cục MOBILE: kết quả chấm chiếm trọn một trang riêng (giữ nguyên như cũ).
function ResultView({
  feedback,
  onReset,
  dir,
}: {
  feedback: FeedbackData
  onReset: () => void
  dir: Direction
}) {
  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout
        backTo={duongDanMonTiengAnh()}
        title={dir === 'A' ? 'Kết quả chấm bài IELTS' : 'Writing Results'}
      />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-[calc(1.5rem+var(--bnav-h))]">
        <ResultPanel feedback={feedback} onReset={onReset} dir={dir} />
      </main>
    </div>
  )
}

export default function Writing() {
  usePageTitle('Luyện viết & chấm điểm | Môn tiếng Anh · Đồng hành cùng bạn')
  const user = useAuth().user! // RequireAuth đã đảm bảo có user trước khi vào trang
  const toast = useToast()
  useCloudSync(user.id) // kéo lượt dùng từ Supabase khi mở trang
  const onboarding = useOnboarding(user.id) // nhóm tuổi khai lúc onboarding (GĐ 3, PROGRESS.md)
  const dir: Direction = getDirection()
  const isA = dir === 'A'
  const isDesktop = useIsDesktopViewport() // ≥1024px — bố cục 2 cột "soạn | nhận xét"
  const samplePrompts = isA ? SAMPLE_PROMPTS_A : SAMPLE_PROMPTS_B

  const [essayPrompt, setEssayPrompt] = useState('')
  const [essay, setEssay] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<WritingSubmission | null>(null)
  const [throttleCountdown, setThrottleCountdown] = useState(0)

  const { checkGrammar } = useEdgeAi()
  const grammarIssues = isA && essay.length > 8 ? checkGrammar(essay).issues : []

  // Rate limit chặn double-click/bão request — giới hạn lượt/ngày đã cap riêng
  // qua daily_usage nên throttle chỉ cần mức nhẹ (mặc định 3s của hook).
  const { isThrottled, throttle } = useApiThrottle({
    onCountdown: setThrottleCountdown,
  })

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length
  // [2026-09-22, audit UI/UX P2-4] Chưa gõ chữ nào thì KHÔNG tô đỏ — phản hồi tiêu cực trước
  // khi người dùng làm gì là vô nghĩa. Chỉ đỏ khi đã viết mà còn thiếu.
  const wordColor =
    wordCount === 0
      ? 'text-zinc-400'
      : wordCount < 150
        ? 'text-red-400 theme-light:text-red-700'
        : wordCount < 250
          ? 'text-amber-400 theme-light:text-amber-800'
          : 'text-accent-400 theme-light:text-accent-800'
  const wordHint = isA
    ? wordCount === 0
      ? '(cần 150–350 từ)'
      : wordCount < 150
        ? '(tối thiểu 150)'
        : wordCount < 250
          ? '(IELTS Task 2: 250+)'
          : '✓'
    : wordCount < 100
      ? '(min. 100 words)'
      : '✓'

  async function submit() {
    if (!essay.trim() || !essayPrompt.trim()) return
    // Chặn bài quá ngắn — tránh tốn lượt/API cho bài không thực chất.
    if (wordCount < 20) {
      const m = isA
        ? 'Bài viết quá ngắn — viết ít nhất 20 từ để AI chấm chính xác.'
        : 'Essay too short — write at least 20 words for accurate grading.'
      setError(m)
      toast.error(m)
      return
    }
    if (isThrottled) {
      toast.error(
        isA ? `Chờ ${throttleCountdown}s để tiếp tục...` : `Wait ${throttleCountdown}s...`,
      )
      return
    }
    if (essay.length > 10000) {
      setError(
        isA ? 'Bài viết quá dài (tối đa 10.000 ký tự).' : 'Essay too long (max 10,000 characters).',
      )
      return
    }
    const usage = getUsage(user.id)
    // Gói Free: kho lượt tuần chung nằm ở server, không suy ra được từ dữ liệu local
    // (writingCount đếm theo ngày, không còn đúng ý nghĩa) — để server tự chặn.
    if (
      effectivePlan(user.plan) !== 'free' &&
      usage.writingCount >= getLimits()[effectivePlan(user.plan)].writing
    ) {
      setError(
        isA ? 'Bạn đã dùng hết lượt chấm bài hôm nay.' : "You've used all grading sessions today.",
      )
      return
    }
    setLoading(true)
    setError('')
    const sys = writingSystemPrompt(dir, onboarding?.ageGroup)
    const userMsg = isA
      ? `De bai: ${essayPrompt}\n\nBai viet cua hoc vien:\n${essay}`
      : `Essay prompt: ${essayPrompt}\n\nLearner's Vietnamese essay:\n${essay}`
    try {
      const raw = await callClaude([{ role: 'user', content: userMsg }], sys, 2048, 'writing')
      const data = parseJson<FeedbackData>(raw)
      if (
        !data ||
        !hasNumberFields(data.scores, [
          'task_response',
          'coherence',
          'lexical',
          'grammar',
          'overall',
        ]) ||
        !Array.isArray(data.errors) ||
        !Array.isArray(data.suggestions) ||
        typeof data.sample !== 'string'
      )
        throw new Error(
          isA
            ? 'AI trả về định dạng không đúng. Thử lại.'
            : 'AI returned invalid format. Please try again.',
        )
      const sub: WritingSubmission = {
        id: crypto.randomUUID(),
        userId: user.id,
        essayPrompt,
        essay,
        feedback: raw,
        submittedAt: Date.now(),
      }
      saveWritingSub(sub)
      // Thu lỗi vào SỔ LỖI CÁ NHÂN để ôn lại sau (đề xuất A — mistakes.ts).
      addMistakes(
        user.id,
        (data.errors ?? []).map((e) => ({
          wrong: e.original,
          corrected: e.corrected,
          explanation: e.explanation,
          source: 'writing' as const,
          dir,
        })),
      )
      scheduleMistakeSync(user.id)
      setResult(sub)
      incrementUsage(user.id, 'writingCount')
      throttle() // Rate limit sau lần gọi thành công
      // Huy hiệu mới (kỹ năng — ② M2) — bài viết vừa được chấm + lưu.
      for (const a of checkNewAchievements(user.id)) toast.success(achievementMessage(a, isA))
    } catch (e) {
      const m = thongDiepLoiThanThien(
        e,
        isA ? 'Lỗi không xác định' : 'Unknown error',
        isA ? 'vi' : 'en',
      )
      setError(m)
      toast.error(m)
    }
    setLoading(false)
  }

  const feedback = result?.feedback ? parseJson<FeedbackData>(result.feedback) : null
  const reset = () => {
    setResult(null)
    setEssay('')
    setEssayPrompt('')
  }

  // MOBILE: kết quả chấm thay hẳn màn soạn bài (thứ tự dọc cũ, không đổi hành vi).
  if (result && feedback && !isDesktop) {
    return <ResultView feedback={feedback} onReset={reset} dir={dir} />
  }

  // Khung soạn bài — dùng chung cho cả hai bố cục.
  const composer = (
    <>
      {/* Tiêu đề trang — nay hiện ở thanh header (Layout title=…), giữ đúng MỘT h1 cho a11y. */}
      <h1 tabIndex={-1} className="sr-only focus:outline-none">
        {isA ? 'Luyện viết & chấm điểm' : 'Writing Practice & Grading'}
      </h1>

      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm backdrop-blur-md">
        <label htmlFor="essay-prompt-select" className="text-xs font-bold text-zinc-300 block">
          {isA ? '1. Chọn hoặc nhập đề bài IELTS' : '1. Choose or enter prompt'}
        </label>
        <div className="relative">
          <select
            id="essay-prompt-select"
            name="prompt"
            value={essayPrompt}
            onChange={(e) => e.target.value && setEssayPrompt(e.target.value)}
            className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-zinc-300 appearance-none outline-none focus:border-violet-500/70 transition shadow-inner"
          >
            <option value="">
              {isA ? '— Chọn đề mẫu có sẵn —' : '— Choose a sample prompt —'}
            </option>
            {samplePrompts.map((p, i) => (
              <option key={i} value={p}>
                {p.slice(0, 65)}…
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
        <textarea
          id="prompt-input"
          name="essayPrompt"
          value={essayPrompt}
          onChange={(e) => setEssayPrompt(e.target.value)}
          placeholder={
            isA
              ? 'Hoặc dán đề bài IELTS tự chọn vào đây...'
              : 'Or paste a custom writing prompt here...'
          }
          rows={3}
          className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-500/70 transition resize-none shadow-inner"
        />
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-300">
              {isA ? '2. Bài viết của bạn' : '2. Your essay'}
            </label>
            <EdgeAiIndicator />
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 ${wordColor}`}
          >
            {wordCount} {isA ? 'từ' : 'words'} {wordHint}
          </span>
        </div>
        <textarea
          id="essay-input"
          name="essay"
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder={
            isA
              ? 'Viết bài vào đây... (IELTS Task 2 nên từ 250–350 từ để đạt điểm tối ưu)'
              : 'Write your essay here... (aim for 150–250 words)'
          }
          className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl px-4.5 py-4 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-500/70 transition resize-none min-h-[180px] max-h-[45dvh] sm:max-h-[55dvh] shadow-inner leading-relaxed"
        />

        {/* Instant Edge Grammar Suggestions */}
        {grammarIssues.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 space-y-2 animate-fade-in text-xs shadow-inner">
            <div className="font-bold text-amber-300 theme-light:text-amber-900 flex items-center gap-1.5">
              <span>⚡ Phát hiện nhanh lỗi ngữ pháp ({grammarIssues.length}):</span>
            </div>
            <div className="space-y-1.5">
              {grammarIssues.slice(0, 3).map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-zinc-300 bg-zinc-950/40 p-2 rounded-xl border border-amber-500/15"
                >
                  <span className="line-through text-rose-400 theme-light:text-rose-900 mr-2">
                    {issue.original}
                  </span>
                  <span className="font-semibold text-emerald-400 theme-light:text-emerald-900">
                    → {issue.suggestion}
                  </span>
                  <span className="text-[11px] text-zinc-400 ml-auto pl-2 truncate max-w-[200px]">
                    {issue.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl px-4.5 py-3 text-sm text-red-400 theme-light:text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading || !essay.trim() || !essayPrompt.trim() || isThrottled}
        aria-label={isA ? 'Chấm bài ngay' : 'Grade my essay'}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-200 active:scale-[0.98] shadow-xl relative"
      >
        {isThrottled && throttleCountdown > 0 ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {isA ? `Chờ ${throttleCountdown}s...` : `Wait ${throttleCountdown}s...`}
          </>
        ) : loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {isA ? 'Đang chấm bài & phân tích 4 tiêu chí...' : 'Grading...'}
          </>
        ) : (
          <>
            <PenLine className="w-4 h-4" />
            <Send className="w-4 h-4" />
            {isA ? 'Chấm bài ngay' : 'Grade my essay'}
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-400">
        {isA
          ? 'AI chấm theo tiêu chí IELTS — Task Response · Coherence · Lexical · Grammar'
          : 'AI grades Vietnamese writing — Task Response · Coherence · Lexical · Grammar'}
      </p>
    </>
  )

  // DESKTOP: 2 cột — trái soạn bài (rộng hơn), phải kết quả chấm dính (sticky) cuộn độc lập.
  // [2026-09-02, đợt 3] Bố cục này trước đây viết tay tại chỗ; nay dùng chung `PageShell` +
  // `TwoPane` (`railWidth="wide"` — bảng chấm nhiều chữ nên cần rộng hơn cột ngữ cảnh thường).
  if (isDesktop) {
    return (
      <div className="min-h-dvh bg-zinc-950">
        <Layout
          title={isA ? 'Luyện viết & chấm điểm' : 'Writing Practice & Grading'}
          backTo={duongDanMonTiengAnh()}
        />
        <PageShell width="standard" baseWidth="max-w-2xl">
          <TwoPane
            isDesktop
            railWidth="wide"
            railLabel="Kết quả chấm bài"
            rail={
              <>
                {result && feedback ? (
                  <ResultPanel feedback={feedback} onReset={reset} dir={dir} />
                ) : (
                  // Trạng thái rỗng có ý nghĩa — tránh để cột phải trống trơn khi chưa chấm.
                  <div className="bg-zinc-900/60 border border-dashed border-zinc-800 rounded-3xl p-6 text-center space-y-2">
                    <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
                      <Trophy className="w-5 h-5 text-violet-300 theme-light:text-violet-800" />
                    </div>
                    <p className="text-sm font-bold text-zinc-100">
                      {isA ? 'Kết quả chấm sẽ hiện ở đây' : 'Your results will appear here'}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isA
                        ? 'Chọn đề bài, viết bài rồi bấm “Chấm bài ngay” — điểm 4 tiêu chí, lỗi cần sửa và gợi ý nâng band sẽ hiện ở cột này.'
                        : 'Pick a prompt, write your essay, then press “Grade my essay” — scores, corrections and suggestions will show up in this column.'}
                    </p>
                  </div>
                )}
              </>
            }
          >
            <div className="max-w-3xl space-y-4 animate-fade-up">{composer}</div>
          </TwoPane>
        </PageShell>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout
        title={isA ? 'Luyện viết & chấm điểm' : 'Writing Practice & Grading'}
        backTo={duongDanMonTiengAnh()}
      />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-[calc(1.5rem+var(--bnav-h))] space-y-4 animate-fade-up">
        {composer}
      </main>
    </div>
  )
}

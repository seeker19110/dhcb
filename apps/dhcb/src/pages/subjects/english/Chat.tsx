import { buttonClass } from '@core/buttonStyles'
import { useState, useRef, useEffect, useMemo } from 'react'
import { thongDiepLoiThanThien } from '../../../lib/friendlyError'
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import { Send, Plus, ChevronDown, Sparkles, Award } from 'lucide-react'
import Layout from '../../../components/Layout'
import KaraokeText from '../../../components/KaraokeText'
import EvaluationResultView from '../../../components/EvaluationResultView'
import LoadError from '../../../components/LoadError'
import {
  saveChatSession,
  getChatSessions,
  getUsage,
  incrementUsage,
  getDirection,
} from '../../../lib/storage'
import { addMistake, scheduleMistakeSync } from '../../../lib/mistakes'
import { reportTutorFeedback } from '../../../lib/tutorFeedback'
import { stopSpeaking } from '../../../lib/tts'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '@core/ToastProvider'
import { useCloudSync } from '../../../lib/useCloudSync'
import { useApiThrottle } from '../../../lib/useApiThrottle'
import { useMountedRef } from '../../../lib/useMountedRef'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { useVisualViewportHeight } from '../../../lib/useVisualViewportHeight'
import { useOnboarding, situationForGoal } from '../../../lib/onboarding'
import { callClaude, parseJson, hasNumberFields } from '../../../lib/ai'
import { effectivePlan } from '../../../lib/promo'
import { hasReachedDailyLimit } from '../../../lib/appSettings'
import { chatSystemPrompt, chatFullEvaluationPrompt, situationLabel } from '../../../prompts'
import {
  SITUATIONS,
  LEVELS,
  type Level,
  type ChatSession,
  type Message,
  type Direction,
  type EvaluationResult,
} from '../../../types'
import { MAIN_CONTENT_ID } from '@core/PageShell'

// Số lượt trao đổi tối thiểu trước khi cho phép chấm điểm — tránh chấm khi mới 1 câu.
const MIN_TURNS_TO_GRADE = 3

// Chỉ gửi N tin nhắn GẦN NHẤT lên AI mỗi lượt hội thoại (không phải lúc chấm điểm cả phiên) —
// hội thoại càng dài, gửi nguyên lịch sử càng tốn token gần như bậc hai. Vẫn lưu đủ session
// để hiển thị UI, chỉ cắt phần gửi AI. Chấm điểm (endAndGrade) vẫn dùng TOÀN BỘ lịch sử.
const MAX_AI_HISTORY = 20

// ── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({
  onStart,
  loading,
  error,
  dir,
  defaultLevel,
  defaultGoal,
  practiceWords,
}: {
  onStart: (situation: string, level: Level) => void
  loading: boolean
  error: string
  dir: Direction
  // Trình độ khai lúc onboarding (U-3) — làm mặc định thay vì cứng 'intermediate'
  defaultLevel?: Level
  // [U9b] Mục tiêu khai lúc onboarding → tình huống mặc định (thay cho "Phỏng vấn xin việc" cứng
  // với MỌI người, kể cả người vừa chọn "Giao tiếp hàng ngày" — audit 2026-09-30 M19).
  defaultGoal?: string
  // Từ mục tiêu đến từ màn "xong batch" của lộ trình (?words=..., đề xuất B)
  practiceWords?: string[]
}) {
  const [situation, setSituation] = useState(() => situationForGoal(defaultGoal))
  const [level, setLevel] = useState<Level>(defaultLevel ?? 'intermediate')
  // Onboarding có thể về TRỄ (thiết bị mới phải fetch DB) — chỉ áp lại mặc định
  // khi người dùng CHƯA tự bấm chọn, tránh ghi đè lựa chọn tay.
  const levelTouched = useRef(false)
  useEffect(() => {
    if (defaultLevel && !levelTouched.current) setLevel(defaultLevel)
  }, [defaultLevel])
  const situationTouched = useRef(false)
  useEffect(() => {
    if (defaultGoal && !situationTouched.current) setSituation(situationForGoal(defaultGoal))
  }, [defaultGoal])
  const isA = dir === 'A'

  return (
    // [2026-09-05, đợt 3 "desktop giáo dục"] Xem lý do ở `Speaking.tsx`: căn giữa theo chiều dọc
    // đẩy thẻ cài đặt xuống quá nửa màn hình desktop (đo được thẻ bắt đầu ở y≈530 trong khi
    // tiêu đề trang ở y≈95). Điện thoại giữ nguyên căn giữa.
    //
    // KHÁC `Speaking`: ở đây tiêu đề "Chọn tình huống luyện tập" được GIỮ, vì nó nói một bước
    // khác với tiêu đề trang "Chat với gia sư" — không phải nhắc lại nguyên văn.
    <div className="flex-1 flex flex-col items-center justify-center lg:justify-start lg:pt-2 px-4 py-10 lg:py-6 overflow-y-auto">
      <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-accent-500 via-accent-600 to-indigo-600 flex items-center justify-center mb-5 shadow-xl animate-scale-in p-4">
        <Sparkles className="w-9 h-9 text-white drop-shadow-md" />
      </div>
      <h2 className="text-2xl font-extrabold text-white mb-1.5 tracking-tight animate-fade-in delay-50">
        {isA ? 'Chọn tình huống luyện tập' : 'Choose a practice situation'}
      </h2>
      <p className="text-zinc-400 text-sm mb-6 animate-fade-in delay-100 text-center">
        {isA
          ? 'AI sẽ đóng vai đối tác hội thoại tự nhiên'
          : 'AI will role-play a conversation partner'}
      </p>

      <div className="w-full max-w-sm space-y-4.5 animate-fade-up delay-150 bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-md">
        {/* Từ mục tiêu từ lộ trình — AI sẽ dẫn dắt để học viên DÙNG các từ này */}
        {practiceWords && practiceWords.length > 0 && (
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-teal-300 theme-light:text-teal-800 mb-1">
              🎯{' '}
              {isA
                ? `Luyện ${practiceWords.length} từ vừa học`
                : `Practice ${practiceWords.length} new words`}
            </p>
            <p className="text-xs text-zinc-300 break-words">{practiceWords.join(' · ')}</p>
          </div>
        )}
        {/* Tình huống */}
        <div>
          <label htmlFor="situation" className="text-xs font-semibold text-zinc-300 mb-2 block">
            {isA ? 'Tình huống đối thoại' : 'Situation'}
          </label>
          <div className="relative">
            <select
              id="situation"
              name="situation"
              value={situation}
              onChange={(e) => {
                situationTouched.current = true
                setSituation(e.target.value)
              }}
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white appearance-none outline-none focus:border-accent-500/70 transition shadow-inner"
            >
              {SITUATIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {isA ? s.labelA : s.labelB}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Trình độ */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-2 block">
            {isA ? 'Trình độ hiện tại' : 'Level'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => {
                  levelTouched.current = true
                  setLevel(l.value)
                }}
                aria-pressed={level === l.value}
                className={buttonClass({ variant: level === l.value ? 'primary' : 'ghost' })}
              >
                {isA ? l.labelA : l.labelB}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-2 text-center">
            {isA
              ? LEVELS.find((l) => l.value === level)?.descA
              : LEVELS.find((l) => l.value === level)?.descB}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-xs text-red-400 theme-light:text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={() => onStart(situation, level)}
          disabled={loading}
          className={buttonClass({ fullWidth: true, size: 'lg', className: 'mt-2' })}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isA ? 'Đang kết nối AI...' : 'Connecting to AI...'}
            </>
          ) : isA ? (
            'Bắt đầu hội thoại →'
          ) : (
            'Start conversation →'
          )}
        </button>
      </div>
    </div>
  )
}

// Tách câu thoại (💬) và phần nhận xét (✅) từ nội dung 1 tin nhắn của gia sư.
// Dùng chung cho Bubble (hiển thị) và luồng bắt lỗi vào SỔ LỖI CÁ NHÂN (mistakes.ts).
function parseAssistantReply(content: string): { speech: string; feedback: string } {
  const lines = content.split('\n')
  const speechLines: string[] = []
  const feedbackLines: string[] = []
  let inFeedback = false
  for (const line of lines) {
    if (line.startsWith('✅')) {
      inFeedback = true
      // Cắt nhãn đầu dòng: "Nhận xét:" (chiều A, CÓ DẤU) hoặc "Feedback:" (chiều B).
      // Bản không dấu "Nhan xet" giữ lại phòng khi AI bỏ dấu.
      feedbackLines.push(
        line.replace(/^✅\s*(Nhận xét|Nhan xet|Feedback):\s*/i, '').replace(/^✅\s*/i, ''),
      )
      continue
    }
    if (inFeedback) feedbackLines.push(line)
    else speechLines.push(line.replace(/^💬\s*/, ''))
  }
  return {
    speech: speechLines.join('\n').trim(),
    feedback: feedbackLines.join('\n').trim(),
  }
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function Bubble({
  msg,
  isNew,
  dir,
  userId,
  userInput,
  isDesktop,
}: {
  msg: Message
  isNew?: boolean
  dir: Direction
  // uid học viên — dùng để ghi vòng phản hồi (mục ⑤ T3) khi bấm 👎
  userId: string
  // câu học viên vừa gõ NGAY TRƯỚC tin nhắn AI này — làm user_input khi ghi phản hồi
  userInput: string
  // true ở desktop (≥1024px) — khi đó FeedbackPanel (Chat.tsx) đã hiện lời sửa/giải thích
  // này rồi nên Bubble KHÔNG render lại (tránh trùng DOM, xem comment ở khối feedbackText).
  isDesktop: boolean
}) {
  // Chiều A: AI nói tiếng Anh, giải thích tiếng Việt
  // Chiều B: AI nói tiếng Việt, giải thích tiếng Anh
  const speechLang = dir === 'A' ? ('en-US' as const) : ('vi-VN' as const)
  const feedbackLang = dir === 'A' ? ('vi-VN' as const) : ('en-US' as const)

  if (msg.role === 'user') {
    return (
      <div className={`flex justify-end ${isNew ? 'animate-fade-in' : ''}`}>
        <div className="max-w-[82%] sm:max-w-[75%] bg-gradient-to-r from-accent-600 to-accent-500 text-white rounded-3xl rounded-tr-xs px-5 py-3.5 text-sm leading-relaxed shadow-md break-words">
          {msg.content}
        </div>
      </div>
    )
  }

  const { speech: speechText, feedback: feedbackText } = parseAssistantReply(msg.content)

  return (
    <div className={`flex justify-start ${isNew ? 'animate-fade-in' : ''}`}>
      <div className="max-w-[88%] sm:max-w-[78%] space-y-2.5">
        <div className="bg-zinc-900/90 text-zinc-100 rounded-3xl rounded-tl-xs p-4.5 border border-zinc-800/80 break-words shadow-sm">
          {speechText && (
            <KaraokeText
              text={speechText}
              lang={speechLang}
              textClass="text-sm leading-relaxed text-zinc-100 font-medium"
            />
          )}
        </div>

        {/* Chỉ hiện ở MOBILE/TABLET (<1024px) — desktop xem cột FeedbackPanel bên phải
            (Chat.tsx render nó 1 lần cho cả phiên). Gate bằng JS (`isDesktop`, không phải
            class `lg:hidden`) để phần tử KHÔNG tồn tại trong DOM ở nhánh còn lại — ẩn bằng
            CSS vẫn để nguyên text ở CẢ HAI nơi, khiến trình đọc màn hình đọc trùng 2 lần và
            `getByText` của Playwright báo strict-mode violation (đã dính thật ở
            e2e/a11y.spec.ts khi thêm FeedbackPanel). */}
        {feedbackText && !isDesktop && (
          <FeedbackBlock
            feedback={feedbackText}
            lang={feedbackLang}
            dir={dir}
            userId={userId}
            userInput={userInput}
          />
        )}
      </div>
    </div>
  )
}

// FeedbackBlock — khung "✅ nhận xét/sửa lỗi" DÙNG CHUNG giữa Bubble (mobile, gắn NGAY dưới
// từng tin nhắn) và FeedbackPanel (desktop, gom hết vào cột phải) — tách ra để vote 👍👎 hoạt
// động y hệt ở cả hai nơi mà không viết trùng logic.
function FeedbackBlock({
  feedback,
  lang,
  dir,
  userId,
  userInput,
}: {
  feedback: string
  lang: 'vi-VN' | 'en-US'
  dir: Direction
  userId: string
  userInput: string
}) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  const handleVote = (vote: 'up' | 'down') => {
    if (voted) return
    setVoted(vote)
    // Chỉ ghi DB khi tín hiệu ÂM (👎) — 👍 chỉ đổi UI, không gọi API (quyết định đã chốt).
    if (vote === 'down') {
      void reportTutorFeedback(userId, 'chat', userInput, feedback)
    }
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/25 border-l-4 border-l-amber-400 rounded-2xl px-4 py-3 shadow-inner">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 theme-light:text-amber-800 font-bold shrink-0 mt-0.5">
          ✅
        </span>
        <KaraokeText
          text={feedback}
          lang={lang}
          textClass="text-xs leading-relaxed text-amber-200 theme-light:text-amber-800 font-medium"
          buttonClass="flex-1"
          iconSize="xs"
        />
        {/* Vote nhận xét đúng/sai — mục ⑤ T3, xem tutorFeedback.ts.
            Emoji thô (không phải icon lucide) — tránh phình vendor-ui chunk
            chỉ vì 2 icon dùng đúng 1 chỗ, và nhất quán với ✅ ngay cạnh đây. */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => handleVote('up')}
            disabled={!!voted}
            aria-label={dir === 'A' ? 'Nhận xét đúng' : 'Feedback is correct'}
            className={`tap-44 h-9 w-9 flex items-center justify-center rounded-full text-xs transition ${
              voted === null
                ? 'opacity-60 hover:opacity-100 hover:bg-amber-500/15'
                : voted === 'up'
                  ? 'scale-110'
                  : 'disabled:opacity-25'
            }`}
          >
            👍
          </button>
          <button
            type="button"
            onClick={() => handleVote('down')}
            disabled={!!voted}
            aria-label={dir === 'A' ? 'Nhận xét sai/thiếu' : 'Feedback is wrong/incomplete'}
            className={`tap-44 h-9 w-9 flex items-center justify-center rounded-full text-xs transition ${
              voted === null
                ? 'opacity-60 hover:opacity-100 hover:bg-amber-500/15'
                : voted === 'down'
                  ? 'scale-110'
                  : 'disabled:opacity-25'
            }`}
          >
            👎
          </button>
        </div>
      </div>
      {voted === 'down' && (
        <p className="text-[11px] text-zinc-500 mt-1 pl-5">
          {dir === 'A' ? 'Đã ghi nhận, cảm ơn bạn!' : 'Recorded, thank you!'}
        </p>
      )}
    </div>
  )
}

// FeedbackPanel — cột "Sửa lỗi & giải thích" ghim bên phải. Cha (Chat.tsx) chỉ render
// component này khi `isDesktop` true — KHÔNG lọc bằng CSS `hidden lg:flex` vì Bubble cũng
// hiện cùng nội dung này khi ở mobile; ẩn bằng CSS vẫn để cả hai bản tồn tại trong DOM cùng
// lúc, gây trùng nội dung cho trình đọc màn hình (xem comment `isDesktop` ở Bubble).
// Gom TẤT CẢ lời sửa/giải thích trong phiên (không chỉ câu mới nhất) để đối chiếu ngược lại
// câu học viên đã gõ, không cần cuộn lên cột chat bên trái tìm lại tin nhắn cũ.
function FeedbackPanel({
  messages,
  dir,
  userId,
}: {
  messages: Message[]
  dir: Direction
  userId: string
}) {
  const feedbackLang = dir === 'A' ? ('vi-VN' as const) : ('en-US' as const)
  const items = messages
    .map((m, i) => {
      if (m.role !== 'assistant') return null
      const { feedback } = parseAssistantReply(m.content)
      if (!feedback) return null
      const userInput = messages[i - 1]?.role === 'user' ? messages[i - 1]!.content : ''
      return { id: m.id, feedback, userInput }
    })
    .filter((x): x is { id: string; feedback: string; userInput: string } => x !== null)

  return (
    <aside className="flex w-72 xl:w-80 shrink-0 flex-col min-h-0">
      <div className="shrink-0 pb-2">
        <p className="text-[11px] font-bold text-zinc-400">
          {dir === 'A' ? 'Sửa lỗi & giải thích' : 'Corrections & explanations'}
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            {dir === 'A'
              ? 'Chưa có lỗi nào cần sửa — tiếp tục trò chuyện nhé!'
              : 'No corrections yet — keep chatting!'}
          </p>
        ) : (
          items.map((it) => (
            <div key={it.id}>
              {it.userInput && (
                <p className="text-[11px] text-zinc-500 mb-1 truncate px-0.5" title={it.userInput}>
                  “{it.userInput}”
                </p>
              )}
              <FeedbackBlock
                feedback={it.feedback}
                lang={feedbackLang}
                dir={dir}
                userId={userId}
                userInput={it.userInput}
              />
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

function TypingDots() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-zinc-800/80 rounded-2xl rounded-bl-sm px-4 py-3 border border-zinc-700/30">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Tạo Message mới kèm id ngẫu nhiên + mốc thời gian — đặt NGOÀI component để
// React Compiler không coi crypto.randomUUID/Date.now là gọi trong lúc render
// (các hàm này chỉ chạy trong event handler async).
function newMessage(role: Message['role'], content: string): Message {
  return { id: crypto.randomUUID(), role, content, timestamp: Date.now() }
}

// Mốc thời gian hiện tại (ms) — tách ra ngoài component, lý do như newMessage.
function currentTimeMs(): number {
  return Date.now()
}

// ── Main Chat page ────────────────────────────────────────────────────────────
export default function Chat() {
  usePageTitle('Trò chuyện với gia sư AI | Môn tiếng Anh · Đồng Hành Cùng Bạn')
  const user = useAuth().user! // RequireAuth đã đảm bảo có user trước khi vào trang
  const toast = useToast()
  useCloudSync(user.id) // kéo lịch sử + lượt dùng từ Supabase khi mở trang
  const dir = getDirection()
  const isA = dir === 'A'
  const onboarding = useOnboarding(user.id) // trình độ khai lúc onboarding (U-3)
  // 1 listener DUY NHẤT cho cả trang — Bubble/FeedbackPanel nhận qua prop, không mỗi tin nhắn
  // tự tạo matchMedia riêng.
  const isDesktop = useIsDesktopViewport()

  // Từ mục tiêu từ màn "xong batch" của lộ trình (?words=a,b,c — đề xuất B, V-3).
  // Cap 20 từ để prompt không phình; đọc 1 lần khi vào trang.
  const [searchParams] = useSearchParams()
  const practiceWords = useMemo(
    () =>
      (searchParams.get('words') ?? '')
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean)
        .slice(0, 20),
    [searchParams],
  )

  const [session, setSession] = useState<ChatSession | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limitHit, setLimitHit] = useState(false)
  const [lastIdx, setLastIdx] = useState(-1)
  const [throttleCountdown, setThrottleCountdown] = useState(0)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Chặn setState sau khi rời trang giữa lúc đang chờ AI trả lời (callClaude có thể mất vài giây)
  const mountedRef = useMountedRef()

  // Rate limit chặn double-click/bão request — giới hạn lượt/ngày đã cap riêng
  // qua daily_usage nên throttle chỉ cần mức nhẹ (mặc định 3s của hook).
  const { isThrottled, throttle } = useApiThrottle({
    onCountdown: setThrottleCountdown,
  })

  // Dừng audio khi thoát trang chat
  useEffect(() => () => stopSpeaking(), [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length, loading])

  // Bàn phím ảo iOS KHÔNG làm `100dvh` co lại → ô nhập bị che. Đo vùng nhìn thấy thật.
  const { height: viewportHeight, keyboardOpen } = useVisualViewportHeight()

  // Khi bàn phím vừa mở/đóng, khung vừa đổi chiều cao → kéo tin nhắn cuối vào tầm nhìn.
  useEffect(() => {
    if (keyboardOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [keyboardOpen])

  async function startSession(situation: string, level: Level) {
    const usage = getUsage(user.id)
    // Hạn mức là TỔNG lượt AI/ngày (GĐ1) — chặn sớm theo tổng bộ đếm local. Gói Free giữ
    // nguyên cách cũ: để server tự chặn (cổng thật luôn ở packages/core-billing/usage.ts).
    if (
      effectivePlan(user.plan) !== 'free' &&
      hasReachedDailyLimit(usage, effectivePlan(user.plan))
    ) {
      // SetupScreen chỉ đọc prop `error` (banner limitHit chỉ render khi đã có session) —
      // set cả hai để không "bấm mà không có gì xảy ra".
      setLimitHit(true)
      setError(
        isA
          ? 'Bạn đã dùng hết lượt hôm nay. Quay lại vào ngày mai nhé!'
          : "You've used all your sessions today. Come back tomorrow!",
      )
      return
    }
    if (isThrottled) {
      toast.error(
        isA ? `Chờ ${throttleCountdown}s để tiếp tục...` : `Wait ${throttleCountdown}s...`,
      )
      return
    }
    setLoading(true)
    setError('')
    const targets = practiceWords.length > 0 ? practiceWords : undefined
    const sys = chatSystemPrompt(
      situationLabel(situation, dir),
      level,
      dir,
      targets,
      onboarding?.ageGroup,
    )
    try {
      const reply = await callClaude([], sys)
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        userId: user.id,
        situation,
        level,
        messages: [newMessage('assistant', reply)],
        createdAt: currentTimeMs(),
        ...(targets ? { targetWords: targets } : {}),
      }
      saveChatSession(newSession)
      incrementUsage(user.id, 'chatCount')
      // Đã rời trang trong lúc chờ AI trả lời — vẫn lưu phiên/lượt dùng ở trên, chỉ
      // bỏ qua các setState (component không còn mount để nhận cập nhật).
      if (!mountedRef.current) return
      setSession(newSession)
      setLastIdx(0)
      throttle() // Rate limit sau lần gọi thành công
    } catch (e) {
      if (!mountedRef.current) return
      const msg = thongDiepLoiThanThien(
        e,
        isA ? 'Lỗi không xác định' : 'Unknown error',
        isA ? 'vi' : 'en',
      )
      setError(msg)
      toast.error(msg)
    }
    if (mountedRef.current) setLoading(false)
  }

  // overrideText: dùng cho nút "AI phản hồi" (gợi ý tiếp) — không lấy từ ô nhập, và không
  // ghi vào Sổ lỗi cá nhân vì đây là câu nhắc hệ thống, không phải học viên tự viết.
  async function sendMessage(
    overrideText?: string,
    opts?: { isRetry?: boolean; base?: ChatSession },
  ) {
    const text = overrideText ?? input.trim()
    // Gửi lại sau lỗi mạng vẫn là câu của HỌC VIÊN → vẫn phải vào Sổ lỗi cá nhân;
    // chỉ câu nhắc hệ thống ("AI phản hồi") mới bị loại.
    const isSuggestionRequest = overrideText !== undefined && !opts?.isRetry
    // `base`: phiên đã được cắt bỏ tin nhắn lỗi (nút "Thử lại"). Không đọc từ state vì
    // setSession chưa kịp áp dụng trong cùng một lượt render.
    const current = opts?.base ?? session
    if (!text || !current || loading) return
    if (isThrottled) {
      toast.error(
        isA ? `Chờ ${throttleCountdown}s để tiếp tục...` : `Wait ${throttleCountdown}s...`,
      )
      return
    }
    const usage = getUsage(user.id)
    // Hạn mức là TỔNG lượt AI/ngày (GĐ1) — chặn sớm theo tổng bộ đếm local. Gói Free giữ
    // nguyên cách cũ: để server tự chặn (cổng thật luôn ở packages/core-billing/usage.ts).
    if (
      effectivePlan(user.plan) !== 'free' &&
      hasReachedDailyLimit(usage, effectivePlan(user.plan))
    ) {
      setLimitHit(true)
      return
    }
    const userMsg: Message = newMessage('user', text)
    const updated = { ...current, messages: [...current.messages, userMsg] }
    setSession(updated)
    saveChatSession(updated)
    setInput('')
    setLoading(true)
    setError('')
    setLastIdx(updated.messages.length)
    const history = updated.messages
      .slice(-MAX_AI_HISTORY)
      .map((m) => ({ role: m.role, content: m.content }))
    const sys = chatSystemPrompt(
      situationLabel(current.situation, dir),
      current.level,
      dir,
      current.targetWords,
      onboarding?.ageGroup,
    )
    try {
      const reply = await callClaude(history, sys)
      const assistantMsg: Message = newMessage('assistant', reply)
      const final = { ...updated, messages: [...updated.messages, assistantMsg] }
      saveChatSession(final)
      // Nếu gia sư có phần "✅ Nhận xét" → thu vào SỔ LỖI CÁ NHÂN. Chat không tách riêng
      // "câu đúng" nên chỉ lưu câu học viên (wrong) + giải thích; câu đúng để rỗng.
      if (!isSuggestionRequest) {
        const { feedback } = parseAssistantReply(reply)
        if (feedback) {
          addMistake(user.id, {
            wrong: userMsg.content,
            corrected: '',
            explanation: feedback,
            source: 'chat',
            dir,
          })
          scheduleMistakeSync(user.id)
        }
      }
      incrementUsage(user.id, 'chatCount')
      // Đã rời trang trong lúc chờ AI trả lời — vẫn lưu phiên/lượt dùng ở trên, chỉ
      // bỏ qua các setState (component không còn mount để nhận cập nhật).
      if (!mountedRef.current) return
      setSession(final)
      setLastIdx(final.messages.length - 1)
      throttle() // Rate limit sau lần gọi thành công
    } catch (e) {
      if (!mountedRef.current) return
      const msg = thongDiepLoiThanThien(
        e,
        isA ? 'Lỗi không xác định' : 'Unknown error',
        isA ? 'vi' : 'en',
      )
      setError(msg)
      toast.error(msg)
    }
    if (!mountedRef.current) return
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Nút "AI phản hồi" — nhờ AI chủ động gợi ý câu hỏi/chủ đề tiếp theo dựa trên
  // câu trả lời gần nhất của nó, không cần học viên tự gõ.
  function requestAiFollowUp() {
    if (!session || loading || isThrottled) return
    void sendMessage(
      isA
        ? 'Hãy chủ động gợi ý một câu hỏi hoặc chủ đề tiếp theo để mình tiếp tục hội thoại, dựa trên nội dung bạn vừa trả lời.'
        : 'Please suggest a follow-up question or topic to continue our conversation, based on what you just said.',
    )
  }

  // Thử lại sau lỗi (mạng/AI 500). Câu người dùng đã nằm trong phiên nên phải GỠ nó ra
  // trước khi gửi lại, nếu không bong bóng sẽ bị nhân đôi.
  function retryLastSend() {
    if (!session || loading || isThrottled) return
    const msgs = session.messages
    const idx = msgs.map((m) => m.role).lastIndexOf('user')
    if (idx === -1) return
    const lastText = msgs[idx]!.content
    const trimmed = { ...session, messages: msgs.slice(0, idx) }
    setSession(trimmed)
    saveChatSession(trimmed)
    setError('')
    void sendMessage(lastText, { isRetry: true, base: trimmed })
  }

  // Kết thúc & chấm điểm cả phiên — gọi AI 1 lần thêm với prompt chấm điểm, tính
  // là 1 lượt chat (không thêm cột giới hạn riêng). Kết quả chỉ hiện tạm, không lưu Supabase.
  async function endAndGrade() {
    if (!session || loading || evaluating) return
    const usage = getUsage(user.id)
    // Hạn mức là TỔNG lượt AI/ngày (GĐ1) — chặn sớm theo tổng bộ đếm local. Gói Free giữ
    // nguyên cách cũ: để server tự chặn (cổng thật luôn ở packages/core-billing/usage.ts).
    if (
      effectivePlan(user.plan) !== 'free' &&
      hasReachedDailyLimit(usage, effectivePlan(user.plan))
    ) {
      setLimitHit(true)
      return
    }
    if (isThrottled) {
      toast.error(
        isA ? `Chờ ${throttleCountdown}s để tiếp tục...` : `Wait ${throttleCountdown}s...`,
      )
      return
    }
    setEvaluating(true)
    setError('')
    const sys = chatFullEvaluationPrompt(dir)
    const history = session.messages.map((m) => ({ role: m.role, content: m.content }))
    try {
      const raw = await callClaude(history, sys, 2048, 'chat')
      const data = parseJson<EvaluationResult>(raw)
      if (
        !data ||
        !hasNumberFields(data.scores, ['fluency', 'lexical', 'grammar', 'overall']) ||
        !Array.isArray(data.errors) ||
        !Array.isArray(data.strengths) ||
        !Array.isArray(data.suggestions)
      )
        throw new Error(
          isA
            ? 'AI trả về định dạng không đúng. Thử lại.'
            : 'AI returned invalid format. Please try again.',
        )
      incrementUsage(user.id, 'chatCount')
      if (!mountedRef.current) return
      setEvaluation(data)
      throttle()
    } catch (e) {
      if (!mountedRef.current) return
      const msg = thongDiepLoiThanThien(
        e,
        isA ? 'Lỗi không xác định' : 'Unknown error',
        isA ? 'vi' : 'en',
      )
      setError(msg)
      toast.error(msg)
    }
    if (mountedRef.current) setEvaluating(false)
  }

  const userTurns = session?.messages.filter((m) => m.role === 'user').length ?? 0
  const prevSessions = getChatSessions(user.id).slice(0, 3)

  return (
    // Bàn phím ảo mở → ép chiều cao bằng vùng nhìn thấy thật (thanh điều hướng đáy
    // đã bị bàn phím che nên không trừ `--bnav-h` nữa); còn lại giữ nguyên `100dvh`.
    <div
      className={`${keyboardOpen ? '' : 'h-[calc(100dvh-var(--bnav-h))]'} bg-zinc-950 flex flex-col`}
      style={keyboardOpen ? { height: `${viewportHeight}px` } : undefined}
    >
      <Layout
        backTo={duongDanMonTiengAnh()}
        title={isA ? 'Chat với gia sư' : 'Chat with tutor'}
        subtitle={
          session
            ? `${situationLabel(session.situation, dir)} · ${
                isA
                  ? LEVELS.find((l) => l.value === session.level)?.labelA
                  : LEVELS.find((l) => l.value === session.level)?.labelB
              }`
            : undefined
        }
      />

      {/* Đích của liên kết "Bỏ qua tới nội dung chính" (WCAG 2.4.1, audit 2026-09-30 M7) — trước
          đây trang không có <main>, người dùng bàn phím phải Tab qua cả thanh bên. */}
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex-1 flex flex-col min-h-0 focus:outline-none"
      >
        {!session ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Tiêu đề trang — ngay dưới AppHeader, cỡ chữ lớn */}
            <div className="max-w-sm mx-auto w-full px-4 pt-5">
              <h1 tabIndex={-1} className="sr-only focus:outline-none">
                {isA ? 'Chat với gia sư' : 'Chat with tutor'}
              </h1>
            </div>
            <SetupScreen
              onStart={startSession}
              loading={loading}
              error={error}
              dir={dir}
              defaultLevel={onboarding?.level}
              {...(onboarding?.goal ? { defaultGoal: onboarding.goal } : {})}
              practiceWords={practiceWords}
            />

            {prevSessions.length > 0 && (
              <div className="max-w-sm mx-auto w-full px-4 pb-8 animate-fade-in delay-200">
                <p className="text-xs text-zinc-400 mb-2 font-medium">
                  {isA ? 'Hội thoại gần đây' : 'Recent sessions'}
                </p>
                {prevSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSession(s)}
                    className="w-full text-left glass rounded-xl px-4 py-3 mb-2 hover:bg-zinc-800/60 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-300 font-medium">
                        {situationLabel(s.situation, dir)}
                      </p>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition -rotate-90" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {s.messages.length} {isA ? 'tin nhắn' : 'messages'} ·{' '}
                      {new Date(s.createdAt).toLocaleDateString(isA ? 'vi-VN' : 'en-US')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : evaluation ? (
          <EvaluationResultView
            evaluation={evaluation}
            onClose={() => setEvaluation(null)}
            dir={dir}
          />
        ) : (
          <>
            {/* Desktop (lg+): hội thoại bên trái + cột "Sửa lỗi & giải thích" ghim bên phải —
              mobile giữ nguyên 1 cột như cũ (mỗi lỗi vẫn hiện ngay dưới tin nhắn, xem Bubble).
              Cột phải chỉ THÊM VÀO, không thay thế: người dùng desktop khỏi phải cuộn lên
              tìm lại lời sửa của câu trước khi so với câu hiện tại. */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:gap-4 max-w-3xl lg:max-w-5xl mx-auto w-full lg:px-4 lg:pt-3 overflow-hidden">
              <div className="flex-1 min-h-0 px-4 py-4 lg:p-0 space-y-3 overflow-y-auto">
                {session.messages.map((m, i) => (
                  <Bubble
                    key={m.id}
                    msg={m}
                    isNew={i >= lastIdx}
                    dir={dir}
                    userId={user.id}
                    isDesktop={isDesktop}
                    userInput={
                      session.messages[i - 1]?.role === 'user'
                        ? session.messages[i - 1]!.content
                        : ''
                    }
                  />
                ))}
                {loading && <TypingDots />}
                {/* Lỗi gọi AI: hiện bảng lỗi kèm nút "Thử lại" thay vì một dòng chữ chết —
                  câu vừa gõ được gửi lại chứ không bắt học viên gõ tay. */}
                {error && !limitHit && (
                  <LoadError message={error} onRetry={retryLastSend} retrying={loading} />
                )}
                {limitHit && (
                  <div className="text-center text-xs text-amber-400 theme-light:text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                    {isA
                      ? 'Bạn đã dùng hết lượt hôm nay. Quay lại vào ngày mai nhé!'
                      : "You've used all your sessions today. Come back tomorrow!"}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {isDesktop && (
                <FeedbackPanel messages={session.messages} dir={dir} userId={user.id} />
              )}
            </div>

            <div className="sticky bottom-0 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/60 px-4 py-3 pb-safe">
              {/* Cùng bề rộng với cột hội thoại phía trên (max-w-3xl lg:max-w-5xl) — trước
                đây thanh nhập bị hẹp hơn nên lệch hẳn sang trái ở desktop. */}
              <div className="max-w-3xl lg:max-w-5xl mx-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    setSession(null)
                    setError('')
                    setLimitHit(false)
                  }}
                  className="tap-44 flex items-center justify-center p-2.5 text-zinc-400 hover:text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition shrink-0 hover:bg-zinc-800/50"
                  title={isA ? 'Hội thoại mới' : 'New session'}
                  aria-label={isA ? 'Hội thoại mới' : 'New session'}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {userTurns >= MIN_TURNS_TO_GRADE && (
                  <button
                    onClick={endAndGrade}
                    disabled={loading || evaluating || limitHit || isThrottled}
                    className="tap-44 flex items-center justify-center p-2.5 text-zinc-400 hover:text-violet-400 border border-zinc-800/80 hover:border-violet-500/50 rounded-xl transition shrink-0 hover:bg-zinc-800/50 disabled:opacity-50"
                    title={isA ? 'Kết thúc & chấm điểm' : 'End & grade conversation'}
                    aria-label={isA ? 'Kết thúc & chấm điểm' : 'End & grade conversation'}
                  >
                    {evaluating ? (
                      <span className="w-4 h-4 border-2 border-zinc-500/40 border-t-zinc-300 rounded-full animate-spin block" />
                    ) : (
                      <Award className="w-4 h-4" />
                    )}
                  </button>
                )}

                <input
                  id="message-input"
                  name="message"
                  // Đánh dấu ô nhập CHÍNH của trang — Layout dùng để đưa con trỏ về đây
                  // khi bấm phím tắt "/".
                  data-primary-input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => {
                    // GIỮ vá tạm này: `visualViewport.resize` chỉ bắn SAU khi bàn phím
                    // trượt lên xong (~300ms trên iOS), nên lần mở đầu tiên vẫn cần cuộn
                    // chủ động; hook useVisualViewportHeight lo phần co khung sau đó.
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
                  }}
                  onKeyDown={(e) => {
                    const isMobile = window.matchMedia('(pointer: coarse)').matches
                    if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={isA ? 'Nhập tiếng Anh...' : 'Type in Vietnamese...'}
                  disabled={loading || limitHit || isThrottled}
                  inputMode="text"
                  className="flex-1 min-w-0 bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 focus:bg-zinc-900 transition disabled:opacity-50"
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading || limitHit || isThrottled}
                  className="tap-44 flex items-center justify-center p-2.5 bg-gradient-to-br from-accent-600 to-accent-500 hover:from-accent-500 hover:to-teal-400 disabled:opacity-40 text-white rounded-xl transition shrink-0 shadow-md active:scale-95 relative"
                  aria-label={isA ? 'Gửi tin nhắn' : 'Send message'}
                >
                  <Send className="w-4 h-4" />
                  {isThrottled && throttleCountdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl text-[11px] font-bold text-white">
                      {throttleCountdown}s
                    </div>
                  )}
                </button>

                <button
                  onClick={requestAiFollowUp}
                  disabled={loading || limitHit || isThrottled}
                  className="tap-44 flex items-center justify-center p-2.5 text-zinc-400 hover:text-amber-400 border border-zinc-800/80 hover:border-amber-500/50 rounded-xl transition shrink-0 hover:bg-zinc-800/50 disabled:opacity-40"
                  title={isA ? 'AI phản hồi (gợi ý tiếp)' : 'AI follow-up suggestion'}
                  aria-label={isA ? 'AI phản hồi (gợi ý tiếp)' : 'AI follow-up suggestion'}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

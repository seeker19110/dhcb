import { buttonClass } from '@core/buttonStyles'
import { useState, useRef, useEffect, useMemo } from 'react'
import { thongDiepLoiThanThien } from '../../../lib/friendlyError'
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronDown,
  Plus,
  Send,
  Award,
  Sparkles,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import EvaluationResultView from '../../../components/EvaluationResultView'
import { saveSpeakingSession, getUsage, incrementUsage, getDirection } from '../../../lib/storage'
import { checkNewAchievements, achievementMessage } from '../../../lib/achievements'
import { addMistake, scheduleMistakeSync } from '../../../lib/mistakes'
import { reportTutorFeedback } from '../../../lib/tutorFeedback'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '@core/ToastProvider'
import { useCloudSync } from '../../../lib/useCloudSync'
import { useApiThrottle } from '../../../lib/useApiThrottle'
import { useMountedRef } from '../../../lib/useMountedRef'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { useVisualViewportHeight } from '../../../lib/useVisualViewportHeight'
import { useOnboarding } from '../../../lib/onboarding'
import { callClaude, parseJson, hasNumberFields } from '../../../lib/ai'
import {
  speakingSystemPrompt,
  speakingFullEvaluationPrompt,
  situationLabel,
} from '../../../prompts'
import { startListening, isSTTSupported } from '../../../lib/stt'
import { startRecording, isRecordingSupported, type Recorder } from '../../../lib/sttServer'
import { speakBilingual, stopSpeaking, isTTSSupported, getRatePref } from '../../../lib/tts'
import { effectivePlan } from '../../../lib/promo'
import { hasReachedDailyLimit } from '../../../lib/appSettings'
import { haptics } from '../../../lib/haptics'
import {
  SITUATIONS,
  LEVELS,
  type Level,
  type SpeakingSession,
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

// JSON trả về từ AI — dùng chung cho cả 2 chiều
// Chiều A: speech=EN, feedback=VI | Chiều B: speech=VI, feedback=EN
interface AIResponse {
  speech: string
  feedback: string
  corrected: string
}

// Đổi mã lỗi của Web Speech API sang thông điệp dễ hiểu cho người dùng.
function sttErrorMessage(code: string, isA: boolean): string {
  switch (code) {
    case 'no-speech':
      return isA
        ? 'Không nghe thấy giọng nói — thử nói lại gần micro hơn.'
        : "Didn't hear anything — try speaking closer to the mic."
    case 'not-allowed':
    case 'service-not-allowed':
      return isA
        ? 'Bị chặn quyền micro. Hãy cho phép micro trong cài đặt trình duyệt.'
        : 'Microphone blocked. Please allow mic access in browser settings.'
    case 'audio-capture':
      return isA
        ? 'Không tìm thấy micro. Kiểm tra thiết bị ghi âm.'
        : 'No microphone found. Check your recording device.'
    case 'network':
      return isA
        ? 'Lỗi mạng khi nhận diện giọng nói — thử lại.'
        : 'Network error during recognition — please try again.'
    default:
      return isA ? `Lỗi nhận diện giọng nói (${code}).` : `Speech recognition error (${code}).`
  }
}

// ── Setup Screen ─────────────────────────────────────────────────────────
function SetupScreen({
  onStart,
  loading,
  error,
  dir,
  defaultLevel,
  practiceWords,
}: {
  onStart: (s: string, l: Level) => void
  loading: boolean
  error: string
  dir: Direction
  // Trình độ khai lúc onboarding (U-3) — làm mặc định thay vì cứng 'intermediate'
  defaultLevel?: Level
  // Từ mục tiêu đến từ màn "xong batch" của lộ trình (?words=..., đề xuất B)
  practiceWords?: string[]
}) {
  const [situation, setSituation] = useState('small_talk')
  const [level, setLevel] = useState<Level>(defaultLevel ?? 'intermediate')
  // Onboarding có thể về TRỄ (thiết bị mới phải fetch DB) — chỉ áp lại mặc định
  // khi người dùng CHƯA tự bấm chọn, tránh ghi đè lựa chọn tay.
  const levelTouched = useRef(false)
  useEffect(() => {
    if (defaultLevel && !levelTouched.current) setLevel(defaultLevel)
  }, [defaultLevel])
  const isA = dir === 'A'

  return (
    // [2026-09-05, đợt 3 "desktop giáo dục"] `justify-center` bỏ đi, thay bằng `justify-start`
    // + `lg:pt-2`. Ở màn cao 900px, căn giữa theo chiều dọc đẩy thẻ cài đặt xuống quá nửa
    // trang: đo được nút "Bắt đầu luyện nói" nằm ở y≈766 trong khi tiêu đề trang ở y≈95, tức
    // gần 700px trống ở giữa. Trên điện thoại căn giữa là đúng (màn ngắn, nội dung vừa khít),
    // nên chỉ đổi từ `lg` trở lên.
    <div className="flex-1 flex flex-col items-center justify-center lg:justify-start lg:pt-2 px-4 py-10 lg:py-6 overflow-y-auto">
      <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-600 flex items-center justify-center mb-5 shadow-xl animate-scale-in p-4">
        <Mic className="w-9 h-9 text-white drop-shadow-md" />
      </div>
      {/* [2026-09-05, đợt 3] Bỏ thẻ `<h2>` "Luyện nói song ngữ" vốn nhắc lại NGUYÊN VĂN tiêu đề
          `PageHeader` ngay phía trên (thấy rõ trong ảnh chụp 1440px: cùng một câu, hai lần,
          cách nhau ~300px). Phụ đề bên dưới thì GIỮ — nó nói thêm cơ chế hai giọng, là thông
          tin thật chứ không phải nhắc lại. */}
      <p className="text-zinc-400 text-sm mb-2 text-center max-w-xs animate-fade-in delay-100">
        {isA ? (
          <>
            Nói tiếng Anh · AI trả lời bằng <strong className="text-zinc-200">giọng Anh</strong> ·
            Sửa lỗi bằng <strong className="text-zinc-200">giọng Việt</strong>
          </>
        ) : (
          <>
            Speak Vietnamese · AI replies in{' '}
            <strong className="text-zinc-200">Vietnamese voice</strong> · Corrects in{' '}
            <strong className="text-zinc-200">English voice</strong>
          </>
        )}
      </p>

      {!(isRecordingSupported() || isSTTSupported()) && (
        <div className="mt-3 mb-2 text-amber-400 theme-light:text-amber-800 text-xs bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 text-center max-w-sm animate-fade-in delay-150 shadow-sm">
          {isA ? (
            <>
              Trình duyệt không hỗ trợ giọng nói. Dùng <strong>Chrome</strong> hoặc{' '}
              <strong>Edge</strong>. Bạn vẫn có thể <strong>gõ tay</strong>.
            </>
          ) : (
            <>
              Browser doesn't support mic. Use <strong>Chrome</strong> or <strong>Edge</strong>. You
              can still <strong>type</strong>.
            </>
          )}
        </div>
      )}

      <div className="w-full max-w-sm space-y-4.5 mt-4 animate-fade-up delay-200 bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-md">
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
        <div>
          <label
            htmlFor="speaking-situation"
            className="text-xs font-semibold text-zinc-300 mb-2 block"
          >
            {isA ? 'Tình huống giao tiếp' : 'Situation'}
          </label>
          <div className="relative">
            <select
              id="speaking-situation"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white appearance-none outline-none focus:border-sky-500/70 transition shadow-inner"
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

        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-2 block">
            {isA ? 'Trình độ của bạn' : 'Your level'}
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
          {/* [2026-09-22] Đồng bộ với trang Trò chuyện: mỗi mức có một dòng giải thích. */}
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
          aria-label={isA ? 'Bắt đầu luyện nói' : 'Start speaking practice'}
          className={buttonClass({ fullWidth: true, size: 'lg', className: 'mt-2' })}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isA ? 'Đang kết nối AI...' : 'Connecting to AI...'}
            </>
          ) : isA ? (
            'Bắt đầu luyện nói →'
          ) : (
            'Start speaking →'
          )}
        </button>
      </div>
    </div>
  )
}

// Đang phát audio của tin nhắn nào (msgId) — phần nào (speech/feedback) — từ thứ mấy.
// Dùng để karaoke sáng chữ đúng nhịp cả khi AI vừa trả lời (tự phát) lẫn khi bấm "Nghe lại".
interface SpkWordSync {
  msgId: string
  field: 'speech' | 'feedback'
  wordIdx: number | null
}

// Text sáng từng chữ kiểu karaoke khi đang là đoạn audio đang phát — giống cách WordText
// (src/pages/Lessons.tsx) làm, tách riêng vì SpeakBubble không dùng KaraokeText (nút "Nghe lại"
// phát TUẦN TỰ cả speech lẫn feedback qua speakBilingual, không phải phát 1 đoạn độc lập).
function HighlightText({
  text,
  active,
  wordIdx,
  className,
  highlightClass = 'bg-sky-500/25 text-sky-200 theme-light:text-sky-900',
}: {
  text: string
  active: boolean
  wordIdx: number | null
  className: string
  highlightClass?: string
}) {
  if (!active) return <span className={className}>{text}</span>
  const parts = text.split(/(\s+)/)
  let wi = 0
  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Bỏ qua đoạn rỗng '' (chỉ sinh ở đầu/cuối text) để chỉ số từ khớp bộ đếm audio.
        if (part === '') return null
        if (/^\s+$/.test(part)) return <span key={i}>{part}</span>
        const thisIdx = wi++
        return (
          <span
            key={i}
            className={
              thisIdx === wordIdx ? `rounded px-0.5 font-medium transition ${highlightClass}` : ''
            }
          >
            {part}
          </span>
        )
      })}
    </span>
  )
}

// SpeakFeedbackBlock — khung "✅ sửa lỗi & giải thích" DÙNG CHUNG giữa SpeakBubble (mobile,
// gắn ngay dưới từng lượt nói của AI) và SpeakFeedbackPanel (desktop, gom vào cột phải).
// Tách ra để vote 👍👎 và karaoke chạy y hệt ở cả hai nơi mà không viết trùng logic.
function SpeakFeedbackBlock({
  msg,
  wordSync,
  dir,
  userId,
  userInput,
}: {
  msg: Message
  wordSync: SpkWordSync | null
  dir: Direction
  userId: string
  userInput: string
}) {
  // Vòng phản hồi người dùng (mục ⑤ T3) — mỗi tin nhắn vote tối đa 1 lần, chỉ lưu cục bộ
  // (không lưu Supabase trạng thái đã vote, mất khi tải lại trang là chấp nhận được).
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  const handleVote = (vote: 'up' | 'down') => {
    if (voted) return
    setVoted(vote)
    // Chỉ ghi DB khi tín hiệu ÂM (👎) — 👍 chỉ đổi UI, không gọi API (quyết định đã chốt).
    if (vote === 'down') {
      void reportTutorFeedback(userId, 'speaking', userInput, msg.feedbackVi ?? '')
    }
  }

  const feedbackActive = wordSync?.msgId === msg.id && wordSync.field === 'feedback'

  return (
    <div className="bg-amber-500/10 border border-amber-500/25 border-l-4 border-l-amber-400 rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-inner">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 theme-light:text-amber-800 font-bold shrink-0 mt-0.5">
          ✅
        </span>
        <HighlightText
          text={msg.feedbackVi ?? ''}
          active={feedbackActive}
          wordIdx={wordSync?.wordIdx ?? null}
          className="text-amber-200 theme-light:text-amber-800 font-medium flex-1"
          highlightClass="bg-amber-500/25 text-amber-100 theme-light:text-amber-900"
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
            className={`h-9 w-9 flex items-center justify-center rounded-full text-xs transition ${
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
            className={`h-11 w-11 flex items-center justify-center rounded-full text-xs transition ${
              voted === null
                ? 'opacity-60 hover:opacity-100'
                : voted === 'down'
                  ? ''
                  : 'disabled:opacity-25'
            }`}
          >
            👎
          </button>
        </div>
      </div>
      {voted === 'down' && (
        <p className="text-[0.6875rem] text-zinc-500 mt-1 pl-5">
          {dir === 'A' ? 'Đã ghi nhận, cảm ơn bạn!' : 'Recorded, thank you!'}
        </p>
      )}
      {msg.correctedEn && (
        <p className="text-accent-400 theme-light:text-accent-800 mt-1.5 pl-4">
          → {msg.correctedEn}
        </p>
      )}
    </div>
  )
}

// SpeakFeedbackPanel — cột "Sửa lỗi & giải thích" bên phải ở DESKTOP. Cha chỉ render khi
// `isDesktop` true, và SpeakBubble khi đó KHÔNG render bản inline nữa — không lọc bằng CSS
// `hidden lg:flex` vì ẩn bằng CSS vẫn để cả hai bản tồn tại trong DOM, gây trùng nội dung cho
// trình đọc màn hình và strict-mode violation của Playwright (xem Chat.tsx cùng lý do).
function SpeakFeedbackPanel({
  messages,
  wordSync,
  dir,
  userId,
}: {
  messages: Message[]
  wordSync: SpkWordSync | null
  dir: Direction
  userId: string
}) {
  const items = messages
    .map((m, i) => {
      if (m.role !== 'assistant' || !m.feedbackVi) return null
      const userInput = messages[i - 1]?.role === 'user' ? messages[i - 1]!.content : ''
      return { msg: m, userInput }
    })
    .filter((x): x is { msg: Message; userInput: string } => x !== null)

  return (
    <aside className="flex w-72 xl:w-80 shrink-0 flex-col min-h-0">
      <div className="shrink-0 pb-2">
        <p className="text-[0.6875rem] font-bold text-zinc-400">
          {dir === 'A' ? 'Sửa lỗi & giải thích' : 'Corrections & explanations'}
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            {dir === 'A'
              ? 'Chưa có lỗi nào cần sửa — cứ nói tiếp nhé!'
              : 'No corrections yet — keep speaking!'}
          </p>
        ) : (
          items.map((it) => (
            <div key={it.msg.id}>
              {it.userInput && (
                <p
                  className="text-[0.6875rem] text-zinc-500 mb-1 truncate px-0.5"
                  title={it.userInput}
                >
                  “{it.userInput}”
                </p>
              )}
              <SpeakFeedbackBlock
                msg={it.msg}
                wordSync={wordSync}
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

// ── Speak Bubble ───────────────────────────────────────────────────────
function SpeakBubble({
  msg,
  onPlay,
  isNew,
  wordSync,
  dir,
  userId,
  userInput,
  isDesktop,
}: {
  msg: Message
  onPlay?: () => void
  isNew?: boolean
  wordSync: SpkWordSync | null
  dir: Direction
  // uid học viên — dùng để ghi vòng phản hồi (mục ⑤ T3) khi bấm 👎
  userId: string
  // câu học viên vừa nói NGAY TRƯỚC tin nhắn AI này — làm user_input khi ghi phản hồi
  userInput: string
  // true ở desktop (≥1024px) — khi đó cột SpeakFeedbackPanel đã hiện lời sửa/giải thích này
  // rồi nên bong bóng KHÔNG render lại (tránh trùng DOM).
  isDesktop: boolean
}) {
  if (msg.role === 'user') {
    return (
      <div className={`flex justify-end ${isNew ? 'animate-fade-in' : ''}`}>
        <div className="max-w-[82%] sm:max-w-[75%] bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-3xl rounded-tr-xs px-5 py-3.5 text-sm leading-relaxed shadow-md break-words">
          {msg.content}
        </div>
      </div>
    )
  }
  const speechActive = wordSync?.msgId === msg.id && wordSync.field === 'speech'
  return (
    <div className={`flex justify-start ${isNew ? 'animate-fade-in' : ''}`}>
      <div className="max-w-[88%] sm:max-w-[78%] space-y-2.5">
        {/* Loa "Nghe lại" đặt BÊN TRÁI văn bản, căn với dòng đầu — thống nhất với
            chuẩn KaraokeText ở mọi trang khác; tap-44 đảm bảo vùng chạm ≥ 44px. */}
        <div className="bg-zinc-900/90 text-zinc-100 rounded-3xl rounded-tl-xs p-4.5 text-sm leading-relaxed border border-zinc-800/80 flex items-start gap-3 break-words shadow-sm">
          {onPlay && (
            <button
              onClick={onPlay}
              title="Nghe lại"
              aria-label="Nghe lại"
              className="tap-44 shrink-0 w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 theme-light:text-sky-900 hover:bg-sky-500/25 transition mt-0.5 shadow-inner"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
          <HighlightText
            text={msg.speechEn ?? ''}
            active={speechActive}
            wordIdx={wordSync?.wordIdx ?? null}
            className="flex-1 min-w-0 font-medium"
          />
        </div>
        {/* Chỉ hiện ở MOBILE/TABLET (<1024px) — desktop xem cột SpeakFeedbackPanel bên phải.
            Gate bằng JS (`isDesktop`), không phải class `lg:hidden` — xem comment ở prop. */}
        {msg.feedbackVi && !isDesktop && (
          <SpeakFeedbackBlock
            msg={msg}
            wordSync={wordSync}
            dir={dir}
            userId={userId}
            userInput={userInput}
          />
        )}
      </div>
    </div>
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
function newMessage(fields: Omit<Message, 'id' | 'timestamp'>): Message {
  return { ...fields, id: crypto.randomUUID(), timestamp: Date.now() }
}

// Mốc thời gian hiện tại (ms) — tách ra ngoài component, lý do như newMessage.
function currentTimeMs(): number {
  return Date.now()
}

// ── Main Speaking page ──────────────────────────────────────────────────
export default function Speaking() {
  usePageTitle('Luyện nói song ngữ | Môn tiếng Anh · Đồng Hành Cùng Bạn')
  const user = useAuth().user! // RequireAuth đã đảm bảo có user trước khi vào trang
  const toast = useToast()
  useCloudSync(user.id) // kéo lịch sử + lượt dùng từ Supabase khi mở trang
  const onboarding = useOnboarding(user.id) // trình độ khai lúc onboarding (U-3)
  const dir: Direction = getDirection()
  const isA = dir === 'A'
  // 1 listener DUY NHẤT cho cả trang — SpeakBubble/SpeakFeedbackPanel nhận qua prop.
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

  // Chiều A: STT tiếng Anh, TTS speech=EN + feedback=VI
  // Chiều B: STT tiếng Việt, TTS speech=VI + feedback=EN
  const sttLang = isA ? ('en' as const) : ('vi' as const)

  const [session, setSession] = useState<SpeakingSession | null>(null)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const [limitHit, setLimitHit] = useState(false)
  const [muted, setMuted] = useState(false)
  const [typedInput, setTypedInput] = useState('')
  const [processing, setProcessing] = useState(false) // đang gửi audio lên server nhận diện
  const [lastIdx, setLastIdx] = useState(-1)
  const [throttleCountdown, setThrottleCountdown] = useState(0)
  // Karaoke: tin nhắn/phần/từ nào đang phát (xem SpkWordSync + HighlightText ở trên).
  const [wordSync, setWordSync] = useState<SpkWordSync | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  // Câu vừa ghi âm/nhận diện xong, chờ người dùng xác nhận trước khi gửi AI —
  // đếm ngược PENDING_CONFIRM_S rồi tự gửi, hoặc bấm "Ghi lại" để xoá và ghi âm lại.
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null)
  const [pendingCountdown, setPendingCountdown] = useState(0)
  const stopRecRef = useRef<(() => void) | null>(null) // dừng Web Speech (fallback)
  const recorderRef = useRef<Recorder | null>(null) // recorder server STT (chính)
  const recTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null) // tự dừng ghi âm khi quá lâu
  const pendingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null) // đếm ngược xác nhận
  const bottomRef = useRef<HTMLDivElement>(null)
  // Chặn setState sau khi rời trang giữa lúc đang chờ AI trả lời (callClaude có thể mất vài giây)
  const mountedRef = useMountedRef()
  const MAX_REC_MS = 60_000 // tự dừng ghi âm server sau 60s (tránh micro mở vô tận)
  const PENDING_CONFIRM_S = 2 // số giây chờ xác nhận trước khi tự gửi câu vừa ghi âm
  // Ưu tiên ghi âm gửi server (chính xác, đa trình duyệt); Web Speech chỉ là dự phòng.
  const canRecord = isRecordingSupported()
  const sttSupported = canRecord || isSTTSupported()

  // Rate limit chặn double-click/bão request — giới hạn lượt/ngày đã cap riêng
  // qua daily_usage nên throttle chỉ cần mức nhẹ (mặc định 3s của hook).
  const { isThrottled, throttle } = useApiThrottle({
    onCountdown: setThrottleCountdown,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length, loading])

  // Bàn phím ảo iOS KHÔNG làm `100dvh` co lại → thanh điều khiển ghi âm bị che.
  const { height: viewportHeight, keyboardOpen } = useVisualViewportHeight()

  useEffect(() => {
    if (keyboardOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [keyboardOpen])

  useEffect(
    () => () => {
      stopSpeaking()
      stopRecRef.current?.()
      recorderRef.current?.cancel()
      if (recTimerRef.current) clearTimeout(recTimerRef.current)
      if (pendingTimerRef.current) clearInterval(pendingTimerRef.current)
    },
    [],
  )

  // Hiện câu vừa ghi âm/nhận diện, đếm ngược rồi tự gửi cho AI — bấm "Ghi lại" để huỷ.
  function startPendingConfirm(text: string) {
    if (pendingTimerRef.current) clearInterval(pendingTimerRef.current)
    setTranscript('')
    setPendingConfirm(text)
    let remaining = PENDING_CONFIRM_S
    setPendingCountdown(remaining)
    pendingTimerRef.current = setInterval(() => {
      remaining -= 1
      setPendingCountdown(remaining)
      if (remaining <= 0) {
        if (pendingTimerRef.current) clearInterval(pendingTimerRef.current)
        pendingTimerRef.current = null
        setPendingConfirm(null)
        void sendUserSpeech(text)
      }
    }, 1000)
  }

  // "Ghi lại" — xoá câu đang chờ, không gửi AI, để người dùng ghi âm lại từ đầu.
  function cancelPendingConfirm() {
    if (pendingTimerRef.current) clearInterval(pendingTimerRef.current)
    pendingTimerRef.current = null
    setPendingConfirm(null)
    setPendingCountdown(0)
  }

  // Nút "AI phản hồi" — nhờ AI chủ động gợi ý câu hỏi/chủ đề tiếp theo dựa trên
  // câu trả lời gần nhất của nó, không cần học viên tự nói.
  function requestAiFollowUp() {
    if (!session || loading || isThrottled) return
    void sendUserSpeech(
      isA
        ? 'Hãy chủ động gợi ý một câu hỏi hoặc chủ đề tiếp theo để mình tiếp tục hội thoại, dựa trên nội dung bạn vừa trả lời.'
        : 'Please suggest a follow-up question or topic to continue our conversation, based on what you just said.',
      true,
    )
  }

  // Dừng ghi âm server (chính) rồi gửi audio lên nhận diện. Gọi khi người dùng nhấn dừng
  // HOẶC khi quá thời lượng tối đa (recTimerRef).
  async function stopServerRecording() {
    if (recTimerRef.current) {
      clearTimeout(recTimerRef.current)
      recTimerRef.current = null
    }
    const r = recorderRef.current
    if (!r) return
    recorderRef.current = null
    setRecording(false)
    setProcessing(true)
    try {
      const text = await r.stop()
      setProcessing(false)
      // Tới được đây nghĩa là /api/stt đã được gọi thành công (server đã trừ 1 lượt) —
      // kể cả khi Whisper nghe ra rỗng (im lặng/tạp âm), vẫn tính đúng 1 lượt để khớp
      // số server, không đợi lần pullUserData kế tiếp mới đúng.
      incrementUsage(user.id, 'sttCount')
      if (text.trim()) startPendingConfirm(text.trim())
      else setError(isA ? 'Không nghe rõ, thử nói lại nhé.' : "Didn't catch that, try again.")
    } catch (e) {
      setProcessing(false)
      if (e instanceof Error && e.message === 'EMPTY_RECORDING') {
        // Chưa hề gọi /api/stt (không có gì để gửi) — không tính lượt.
        setError(isA ? 'Không nghe rõ, thử nói lại nhé.' : "Didn't catch that, try again.")
        return
      }
      const m = thongDiepLoiThanThien(
        e,
        isA ? 'Lỗi nhận diện giọng nói' : 'STT error',
        isA ? 'vi' : 'en',
      )
      setError(m)
      toast.error(m)
    }
  }

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
    const sys = speakingSystemPrompt(
      situationLabel(situation, dir),
      level,
      dir,
      targets,
      onboarding?.ageGroup,
    )
    try {
      const raw = await callClaude([], sys, 1024, 'speaking')
      const ai = parseJson<AIResponse>(raw) ?? { speech: raw, feedback: '', corrected: '' }
      const msg: Message = newMessage({
        role: 'assistant',
        content: raw,
        speechEn: ai.speech,
        feedbackVi: ai.feedback,
        correctedEn: ai.corrected,
      })
      const s: SpeakingSession = {
        id: crypto.randomUUID(),
        userId: user.id,
        situation,
        level,
        messages: [msg],
        createdAt: currentTimeMs(),
        ...(targets ? { targetWords: targets } : {}),
      }
      saveSpeakingSession(s)
      incrementUsage(user.id, 'speakingCount')
      // Đã rời trang trong lúc chờ AI trả lời — vẫn lưu phiên/lượt dùng ở trên, chỉ
      // bỏ qua các setState (component không còn mount để nhận cập nhật).
      if (!mountedRef.current) return
      setSession(s)
      setLastIdx(0)
      throttle() // Rate limit sau lần gọi thành công
      // Huy hiệu mới (kỹ năng — ② M2) — phiên MỚI vừa được lưu (getSpeakingSessions tăng 1).
      for (const a of checkNewAchievements(user.id)) toast.success(achievementMessage(a, isA))
      if (!muted) {
        setSpeaking(true)
        // Chiều A: giọng Anh trước, không có feedback khi mở đầu
        // Chiều B: giọng Việt trước
        await speakBilingual(
          ai.speech,
          '',
          isA ? 'en-US' : 'vi-VN',
          isA ? 'vi-VN' : 'en-US',
          undefined,
          getRatePref(),
          (wi) =>
            mountedRef.current && setWordSync({ msgId: msg.id, field: 'speech', wordIdx: wi }),
        )
        if (mountedRef.current) setSpeaking(false)
      }
    } catch (e) {
      if (!mountedRef.current) return
      const m = thongDiepLoiThanThien(
        e,
        isA ? 'Có lỗi xảy ra' : 'Something went wrong',
        isA ? 'vi' : 'en',
      )
      setError(m)
      toast.error(m)
    }
    if (mountedRef.current) setLoading(false)
  }

  async function toggleRecord() {
    haptics[recording ? 'stop' : 'start']() // rung nhẹ báo bắt đầu/dừng ghi âm
    // ── Đang ghi → dừng lại ──────────────────────────────────────────────
    if (recording) {
      // STT server: dừng recorder, gửi audio lên nhận diện
      if (recorderRef.current) {
        await stopServerRecording()
        return
      }
      // Web Speech (fallback): dừng, kết quả trả qua callback onEnd
      stopRecRef.current?.()
      stopRecRef.current = null
      setRecording(false)
      return
    }

    // ── Chưa ghi → bắt đầu ghi ──────────────────────────────────────────
    if (!session) return
    // Chặn nếu đã hết hạn mức TỔNG lượt AI/ngày (STT cũng tính vào tổng — GĐ1). Gói Free giữ
    // nguyên cách cũ: để server tự chặn.
    if (
      effectivePlan(user.plan) !== 'free' &&
      hasReachedDailyLimit(getUsage(user.id), effectivePlan(user.plan))
    ) {
      setLimitHit(true)
      toast.error(
        isA
          ? 'Bạn đã hết lượt nhận diện giọng nói hôm nay. Có thể gõ tay để tiếp tục.'
          : "You've used all speech-recognition turns today. You can type instead.",
      )
      return
    }
    setTranscript('')
    setError('')

    if (canRecord) {
      // Phương án chính: ghi âm rồi gửi server
      try {
        const r = await startRecording(sttLang)
        recorderRef.current = r
        setRecording(true)
        // An toàn: tự dừng + gửi nhận diện nếu người dùng quên nhấn dừng (mic mở quá lâu)
        recTimerRef.current = setTimeout(() => {
          void stopServerRecording()
        }, MAX_REC_MS)
      } catch {
        setError(
          isA
            ? 'Không truy cập được micro. Hãy cho phép quyền micro hoặc gõ tay.'
            : 'Cannot access microphone. Allow mic permission or type instead.',
        )
      }
      return
    }

    // Fallback: Web Speech API (Chrome/Edge)
    setRecording(true)
    const stop = startListening(
      sttLang,
      (r) => setTranscript(r.transcript),
      // KHÔNG đếm sttCount cho nhánh Web Speech: nó chạy MIỄN PHÍ ở trình duyệt, không qua
      // /api/stt nên server không đếm → bump cục bộ chỉ gây lệch rồi bị pullUserData ghi đè.
      // (Đường tốn tiền là server STT/Whisper ở stopServerRecording — chỗ đó mới tính lượt.)
      (last) => {
        setRecording(false)
        if (last.trim()) startPendingConfirm(last.trim())
      },
      (err) => {
        setError(sttErrorMessage(err, isA))
        setRecording(false)
      },
    )
    stopRecRef.current = stop
  }

  // isSuggestionRequest: gọi từ nút "AI phản hồi" (gợi ý tiếp) — không ghi vào Sổ lỗi cá
  // nhân vì đây là câu nhắc hệ thống, không phải học viên tự nói.
  async function sendUserSpeech(text: string, isSuggestionRequest = false) {
    if (!session || loading) return
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
    const userMsg: Message = newMessage({ role: 'user', content: text })
    const updated = { ...session, messages: [...session.messages, userMsg] }
    setSession(updated)
    saveSpeakingSession(updated)
    setTranscript('')
    setLoading(true)
    setError('')
    setLastIdx(updated.messages.length)
    const history = updated.messages.slice(-MAX_AI_HISTORY).map((m) => ({
      role: m.role,
      content: m.role === 'assistant' ? (m.speechEn ?? m.content) : m.content,
    }))
    const sys = speakingSystemPrompt(
      situationLabel(session.situation, dir),
      session.level,
      dir,
      session.targetWords,
      onboarding?.ageGroup,
    )
    try {
      const raw = await callClaude(history, sys, 1024, 'speaking')
      const ai = parseJson<AIResponse>(raw) ?? { speech: raw, feedback: '', corrected: '' }
      const aiMsg: Message = newMessage({
        role: 'assistant',
        content: raw,
        speechEn: ai.speech,
        feedbackVi: ai.feedback,
        correctedEn: ai.corrected,
      })
      const final = { ...updated, messages: [...updated.messages, aiMsg] }
      saveSpeakingSession(final)
      // Nếu AI có sửa lỗi → thu vào SỔ LỖI CÁ NHÂN (câu sai = câu học viên vừa nói).
      if (!isSuggestionRequest && (ai.corrected?.trim() || ai.feedback?.trim())) {
        addMistake(user.id, {
          wrong: text,
          corrected: ai.corrected ?? '',
          explanation: ai.feedback ?? '',
          source: 'speaking',
          dir,
        })
        scheduleMistakeSync(user.id)
      }
      incrementUsage(user.id, 'speakingCount')
      // Đã rời trang trong lúc chờ AI trả lời — vẫn lưu phiên/lượt dùng ở trên, chỉ
      // bỏ qua các setState (component không còn mount để nhận cập nhật).
      if (!mountedRef.current) return
      setSession(final)
      setLastIdx(final.messages.length - 1)
      throttle() // Rate limit sau lần gọi thành công
      if (!muted && isTTSSupported()) {
        setSpeaking(true)
        await speakBilingual(
          ai.speech,
          ai.feedback,
          isA ? 'en-US' : 'vi-VN',
          isA ? 'vi-VN' : 'en-US',
          undefined,
          getRatePref(),
          (wi) =>
            mountedRef.current && setWordSync({ msgId: aiMsg.id, field: 'speech', wordIdx: wi }),
          (wi) =>
            mountedRef.current && setWordSync({ msgId: aiMsg.id, field: 'feedback', wordIdx: wi }),
        )
        if (mountedRef.current) setSpeaking(false)
      }
    } catch (e) {
      if (!mountedRef.current) return
      const m = thongDiepLoiThanThien(
        e,
        isA ? 'Có lỗi xảy ra' : 'Something went wrong',
        isA ? 'vi' : 'en',
      )
      setError(m)
      toast.error(m)
    }
    if (mountedRef.current) setLoading(false)
  }

  async function playMsg(msg: Message) {
    if (!msg.speechEn) return
    setSpeaking(true)
    await speakBilingual(
      msg.speechEn,
      msg.feedbackVi ?? '',
      isA ? 'en-US' : 'vi-VN',
      isA ? 'vi-VN' : 'en-US',
      undefined,
      getRatePref(),
      (wi) => setWordSync({ msgId: msg.id, field: 'speech', wordIdx: wi }),
      (wi) => setWordSync({ msgId: msg.id, field: 'feedback', wordIdx: wi }),
    )
    setSpeaking(false)
  }

  // Kết thúc & chấm điểm cả phiên — gọi AI 1 lần thêm với prompt chấm điểm sẵn có
  // (speakingFullEvaluationPrompt, có tiêu chí Pronunciation), tính là 1 lượt speaking
  // (không thêm cột giới hạn riêng). Kết quả chỉ hiện tạm, không lưu Supabase.
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
    const sys = speakingFullEvaluationPrompt(dir)
    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.role === 'assistant' ? (m.speechEn ?? m.content) : m.content,
    }))
    try {
      const raw = await callClaude(history, sys, 2048, 'speaking')
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
      incrementUsage(user.id, 'speakingCount')
      if (!mountedRef.current) return
      setEvaluation(data)
      throttle()
    } catch (e) {
      if (!mountedRef.current) return
      const m = thongDiepLoiThanThien(
        e,
        isA ? 'Lỗi không xác định' : 'Unknown error',
        isA ? 'vi' : 'en',
      )
      setError(m)
      toast.error(m)
    }
    if (mountedRef.current) setEvaluating(false)
  }

  const userTurns = session?.messages.filter((m) => m.role === 'user').length ?? 0

  return (
    // Bàn phím ảo mở → dùng chiều cao vùng nhìn thấy thật thay cho `100dvh`.
    <div
      className={`${keyboardOpen ? '' : 'h-[calc(100dvh-var(--bnav-h))]'} bg-zinc-950 flex flex-col`}
      style={keyboardOpen ? { height: `${viewportHeight}px` } : undefined}
    >
      <Layout
        backTo={duongDanMonTiengAnh()}
        title={!session ? (isA ? 'Luyện nói song ngữ' : 'Bilingual Speaking') : undefined}
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
                {isA ? 'Luyện nói song ngữ' : 'Bilingual Speaking'}
              </h1>
            </div>
            <SetupScreen
              onStart={startSession}
              loading={loading}
              error={error}
              dir={dir}
              defaultLevel={onboarding?.level}
              practiceWords={practiceWords}
            />
          </div>
        ) : evaluation ? (
          <EvaluationResultView
            evaluation={evaluation}
            onClose={() => setEvaluation(null)}
            dir={dir}
          />
        ) : (
          <>
            {/* Desktop (lg+): hội thoại nói + nút mic bên trái, cột "Sửa lỗi & giải thích" ghim
              bên phải (cuộn riêng) — mobile giữ nguyên 1 cột dọc như cũ (lời sửa vẫn nằm ngay
              dưới từng lượt nói của AI, xem SpeakBubble). Cùng khuôn với Chat.tsx. */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:gap-4 max-w-3xl lg:max-w-5xl mx-auto w-full lg:px-4 lg:pt-3 overflow-hidden">
              <div className="flex-1 min-h-0 px-4 py-4 lg:p-0 space-y-3 overflow-y-auto">
                {session.messages.map((m, i) => (
                  <SpeakBubble
                    key={m.id}
                    msg={m}
                    isNew={i >= lastIdx}
                    onPlay={m.role === 'assistant' ? () => playMsg(m) : undefined}
                    wordSync={speaking ? wordSync : null}
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
                {transcript && (
                  <div className="flex justify-end animate-fade-in">
                    <div className="max-w-[78%] bg-sky-600/20 border border-sky-500/25 text-sky-300 theme-light:text-sky-800 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm italic break-words">
                      {transcript}…
                    </div>
                  </div>
                )}
                {pendingConfirm && (
                  <div className="flex flex-col items-end gap-2 animate-fade-in">
                    <div className="max-w-[78%] bg-sky-600/20 border border-sky-500/25 text-sky-300 theme-light:text-sky-800 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm break-words">
                      {pendingConfirm}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">
                        {isA
                          ? `Tự gửi sau ${pendingCountdown}s...`
                          : `Sending in ${pendingCountdown}s...`}
                      </span>
                      <button
                        onClick={cancelPendingConfirm}
                        className="tap-44 text-xs font-medium text-red-400 theme-light:text-red-900 border border-red-500/30 hover:bg-red-500/10 rounded-full px-3 py-1.5 transition"
                      >
                        {isA ? 'Ghi lại' : 'Re-record'}
                      </button>
                    </div>
                  </div>
                )}
                {error && (
                  <p className="text-center text-xs text-red-400 theme-light:text-red-700 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                    {error}
                  </p>
                )}
                {limitHit && (
                  <div className="text-center text-xs text-amber-400 theme-light:text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                    {isA
                      ? 'Bạn đã dùng hết lượt hôm nay. Quay lại vào ngày mai.'
                      : "You've used all sessions today. Come back tomorrow."}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {isDesktop && (
                <SpeakFeedbackPanel
                  messages={session.messages}
                  wordSync={speaking ? wordSync : null}
                  dir={dir}
                  userId={user.id}
                />
              )}
            </div>

            <div className="sticky bottom-0 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/60 px-4 py-4 pb-safe">
              {/* Cùng bề rộng với khung hội thoại phía trên (max-w-3xl lg:max-w-5xl) — nếu để
                hẹp hơn thì thanh mic bị lệch sang trái ở desktop. */}
              <div className="max-w-3xl lg:max-w-5xl mx-auto">
                {userTurns >= MIN_TURNS_TO_GRADE && (
                  <div className="flex justify-center mb-3">
                    <button
                      onClick={endAndGrade}
                      disabled={loading || evaluating || limitHit || isThrottled}
                      className="tap-44 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-violet-400 border border-zinc-800/80 hover:border-violet-500/50 rounded-full px-4 py-2 transition hover:bg-zinc-800/50 disabled:opacity-50"
                    >
                      {evaluating ? (
                        <span className="w-3.5 h-3.5 border-2 border-zinc-500/40 border-t-zinc-300 rounded-full animate-spin shrink-0" />
                      ) : (
                        <Award className="w-3.5 h-3.5 shrink-0" />
                      )}
                      {isA ? 'Kết thúc & chấm điểm' : 'End & grade conversation'}
                    </button>
                  </div>
                )}
                {sttSupported ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-between w-full max-w-sm">
                      <button
                        onClick={() => {
                          stopSpeaking()
                          setSession(null)
                        }}
                        className="tap-44 p-3 text-zinc-400 hover:text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition hover:bg-zinc-800/50"
                        title={isA ? 'Phòng mới' : 'New room'}
                        aria-label={isA ? 'Phòng mới' : 'New room'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={toggleRecord}
                        disabled={
                          loading || limitHit || processing || isThrottled || !!pendingConfirm
                        }
                        aria-label={
                          recording
                            ? isA
                              ? 'Dừng ghi âm'
                              : 'Stop recording'
                            : isA
                              ? 'Bắt đầu ghi âm'
                              : 'Start recording'
                        }
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition shadow-xl disabled:opacity-40 active:scale-95 ${
                          recording
                            ? 'bg-red-500 shadow-red-500/40'
                            : 'bg-gradient-to-br from-sky-500 to-cyan-400'
                        }`}
                      >
                        {recording && (
                          <>
                            <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring" />
                            <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring delay-[400ms]" />
                            <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring delay-[800ms]" />
                          </>
                        )}
                        {recording ? (
                          <MicOff className="w-8 h-8 text-white relative z-10" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                        {isThrottled && throttleCountdown > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white font-bold text-lg">
                            {throttleCountdown}s
                          </div>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setMuted((m) => !m)
                          stopSpeaking()
                          setSpeaking(false)
                        }}
                        aria-label={
                          muted ? (isA ? 'Bật âm thanh' : 'Unmute') : isA ? 'Tắt âm thanh' : 'Mute'
                        }
                        className={`tap-44 p-3 border rounded-xl transition ${
                          muted
                            ? 'text-zinc-400 border-zinc-800/80'
                            : speaking
                              ? 'text-sky-400 theme-light:text-sky-800 border-sky-500/40 bg-sky-500/10'
                              : 'text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/50'
                        }`}
                      >
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={requestAiFollowUp}
                        disabled={loading || limitHit || isThrottled || !!pendingConfirm}
                        title={isA ? 'AI phản hồi (gợi ý tiếp)' : 'AI follow-up suggestion'}
                        aria-label={isA ? 'AI phản hồi (gợi ý tiếp)' : 'AI follow-up suggestion'}
                        className="tap-44 p-3 text-zinc-400 hover:text-amber-400 border border-zinc-800/80 hover:border-amber-500/50 rounded-xl transition hover:bg-zinc-800/50 disabled:opacity-40"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-center text-xs text-zinc-400">
                      {recording
                        ? isA
                          ? '🔴 Đang ghi... nhấn lại để dừng'
                          : '🔴 Recording… tap to stop'
                        : processing
                          ? isA
                            ? '⏳ Đang nhận diện giọng nói...'
                            : '⏳ Transcribing...'
                          : speaking
                            ? isA
                              ? '🔊 AI đang đọc...'
                              : '🔊 AI speaking...'
                            : isA
                              ? 'Nhấn mic để nói tiếng Anh'
                              : 'Tap mic to speak Vietnamese'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          stopSpeaking()
                          setSession(null)
                        }}
                        aria-label={isA ? 'Phòng mới' : 'New room'}
                        className="tap-44 p-3 text-zinc-400 hover:text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition shrink-0 hover:bg-zinc-800/50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <input
                        id="speaking-input"
                        name="input"
                        value={typedInput}
                        onChange={(e) => setTypedInput(e.target.value)}
                        onKeyDown={(e) => {
                          const isMobile = window.matchMedia('(pointer: coarse)').matches
                          if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (typedInput.trim()) {
                              sendUserSpeech(typedInput.trim())
                              setTypedInput('')
                            }
                          }
                        }}
                        placeholder={
                          isA
                            ? 'Gõ tiếng Anh thay vì nói...'
                            : 'Type Vietnamese instead of speaking...'
                        }
                        disabled={loading || limitHit || isThrottled}
                        inputMode="text"
                        className="flex-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-zinc-400 outline-none focus:border-sky-500/60 transition disabled:opacity-50"
                      />
                      <button
                        onClick={() => {
                          if (typedInput.trim()) {
                            sendUserSpeech(typedInput.trim())
                            setTypedInput('')
                          }
                        }}
                        disabled={!typedInput.trim() || loading || limitHit || isThrottled}
                        aria-label={isA ? 'Gửi tin nhắn' : 'Send message'}
                        className="tap-44 p-3 bg-gradient-to-br from-sky-600 to-cyan-500 disabled:opacity-40 text-white rounded-xl transition shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        {isThrottled && throttleCountdown > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl text-[0.6875rem] font-bold text-white">
                            {throttleCountdown}s
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setMuted((m) => !m)
                          stopSpeaking()
                          setSpeaking(false)
                        }}
                        aria-label={
                          muted ? (isA ? 'Bật âm thanh' : 'Unmute') : isA ? 'Tắt âm thanh' : 'Mute'
                        }
                        className={`tap-44 p-3 border rounded-xl transition shrink-0 ${muted ? 'text-zinc-400 border-zinc-800/80' : 'text-zinc-400 border-zinc-800/80 hover:border-zinc-700'}`}
                      >
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={requestAiFollowUp}
                        disabled={loading || limitHit || isThrottled}
                        title={isA ? 'AI phản hồi (gợi ý tiếp)' : 'AI follow-up suggestion'}
                        aria-label={isA ? 'AI phản hồi (gợi ý tiếp)' : 'AI follow-up suggestion'}
                        className="tap-44 p-3 text-zinc-400 hover:text-amber-400 border border-zinc-800/80 hover:border-amber-500/50 rounded-xl transition shrink-0 disabled:opacity-40"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-center text-xs text-zinc-400">
                      {isA ? (
                        <>
                          Trình duyệt không hỗ trợ mic — dùng{' '}
                          <strong className="text-zinc-400">Chrome</strong>
                        </>
                      ) : (
                        <>
                          Browser doesn't support mic — use{' '}
                          <strong className="text-zinc-400">Chrome</strong>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// apps/dhcb/src/components/Home/HomeUniversalAiBar.tsx — Ô hỏi nhanh ở Trang chủ.
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-foundation.md §④ A (slice S02).
//
// [2026-09-15] ĐÃ BỎ "phản hồi nhanh AI" giả. Bản trước hiện vòng quay "Bạn Đồng Hành AI đang
// phân tích và trích xuất lời giải..." trong 450ms rồi in ra một đoạn văn VIẾT SẴN chọn theo từ
// khoá — không có lệnh gọi AI nào cả. Với người học, đó là lời hứa sai: họ tin mình vừa được AI
// trả lời, trong khi đoạn chữ đó không hề đọc câu hỏi của họ.
//
// Thay bằng đúng thứ ô này làm được thật: ĐOÁN NƠI HỌC PHÙ HỢP theo từ khoá, nói rõ đó chỉ là
// gợi ý điều hướng, rồi đưa người dùng tới đó kèm nguyên văn câu hỏi. Việc trả lời để cho trang
// đích (có AI thật) làm.
import React, { useState, useRef, useMemo, useCallback, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Calculator,
  MessageSquare,
  Activity,
  Brain,
  Search,
  X,
  ArrowRight,
  Compass,
  Copy,
  LogIn,
  Info,
} from 'lucide-react'
import { startListening, isSTTSupported } from '../../lib/stt'
import { useToast } from '@core/ToastProvider'
import { useAuth } from '../../context/useAuth'
import { suggestDestination, type Destination } from '../../lib/learningDestination'
import {
  MAX_QUESTION_LENGTH,
  saveDraft,
  peekGuestDraft,
  claimGuestDraft,
  clearDraft,
  type DraftOwner,
} from '../../lib/learningQuestionDraft'
import { buttonClass } from '@core/buttonStyles'

interface PromptChip {
  id: string
  label: string
  icon: typeof Sparkles
  query: string
  badgeColor: string
}

const PROMPT_CHIPS: PromptChip[] = [
  {
    id: 'speak',
    label: '🗣️ Luyện phát âm AI',
    icon: MessageSquare,
    query: 'Luyện phát âm với từ vựng',
    badgeColor: 'hover:border-sky-500/50 hover:bg-sky-500/10 text-sky-300 theme-light:text-sky-800',
  },
  {
    id: 'math',
    label: '📐 Giải Toán & STEM',
    icon: Calculator,
    query: 'Tìm cực trị của hàm số bậc 3: y = x^3 - 3x + 2',
    badgeColor:
      'hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-300 theme-light:text-blue-800',
  },
  {
    id: 'simulators',
    label: '🔬 10 thí nghiệm đời sống',
    icon: Activity,
    query: 'Cách tính tiền điện bậc thang EVN và tối ưu công suất',
    badgeColor:
      'hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-300 theme-light:text-cyan-800',
  },
  {
    id: 'companion',
    label: '🧠 Hỏi đáp & ghi nhớ',
    icon: Brain,
    query: 'Cách xây dựng Cung điện Trí nhớ (Memory Palace) để học từ vựng',
    badgeColor:
      'hover:border-accent-500/50 hover:bg-accent-500/10 text-accent-300 theme-light:text-accent-800',
  },
]

interface HomeUniversalAiBarProps {
  isDesktop: boolean
}

export default function HomeUniversalAiBar({ isDesktop }: HomeUniversalAiBarProps) {
  const nav = useNavigate()
  const toast = useToast()
  const { user, isGuest } = useAuth()
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    question: string
    destination: Destination
    /** true = storage bị chặn, câu hỏi chỉ sống trong lần tải trang này. */
    memoryOnly: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const effectiveVisible = isDesktop || expanded
  // Người dùng đã xử lý (dùng lại / bỏ qua) lời mời khôi phục câu hỏi cũ chưa.
  const [leftoverHandled, setLeftoverHandled] = useState(false)

  const stopVoiceRef = useRef<(() => void) | null>(null)
  const firstPromptRef = useRef<HTMLButtonElement | null>(null)
  // Ghi nhận focus bằng event thay vì đọc DOM ref trong render. Blur luôn xóa cờ, kể cả
  // relatedTarget=null (click vùng không focusable), để resize sau đó không cướp focus.
  const promptToggleFocusedRef = useRef(false)

  useLayoutEffect(() => {
    if (!isDesktop || !promptToggleFocusedRef.current) return
    promptToggleFocusedRef.current = false
    firstPromptRef.current?.focus()
  }, [isDesktop])

  // Trên màn hẹp, panel gợi ý nằm dưới mép màn hình — bấm xong mà không thấy gì hiện ra thì
  // người dùng tưởng nút hỏng. Ref dạng hàm chạy đúng lúc panel gắn vào DOM, cuộn nó lên vừa đủ.
  // Dùng `block: 'nearest'` để không giật cả trang khi panel vốn đã nằm trong tầm nhìn.
  const focusSuggestion = useCallback((node: HTMLElement | null) => {
    node?.scrollIntoView({ block: 'nearest' })
  }, [])

  const owner: DraftOwner = user
    ? { kind: isGuest ? 'guest' : 'account', id: user.id }
    : { kind: 'guest', id: 'anonymous' }

  // Quay lại Home sau khi đăng nhập: câu hỏi gõ lúc còn là khách vẫn nằm trong tab này. Chỉ MỜI
  // dùng lại — việc gán nháp cho tài khoản phải do người dùng bấm (đặc tả §③).
  //
  // Cố ý KHÔNG dùng useEffect + setState: đây chỉ là một phép ĐỌC, tính thẳng lúc render vừa
  // tránh một vòng vẽ thừa, vừa khỏi vướng luật `react-hooks/set-state-in-effect`.
  const guestLeftover = useMemo(() => {
    if (!user || isGuest || leftoverHandled) return null
    const left = peekGuestDraft()
    return left.status === 'ready' ? left.draft.question : null
  }, [user, isGuest, leftoverHandled])

  const askAgain = useCallback(() => {
    if (!user) return
    const claimed = claimGuestDraft(user.id)
    setLeftoverHandled(true)
    if (!claimed) return
    setQuery(claimed.question)
    setSuggestion({
      question: claimed.question,
      destination: suggestDestination(claimed.question),
      memoryOnly: false,
    })
  }, [user])

  const suggest = (rawQuery: string) => {
    setError(null)
    if (!rawQuery.trim()) return

    if (rawQuery.length > MAX_QUESTION_LENGTH) {
      // Báo tại chỗ; tuyệt đối không tự cắt bớt câu hỏi rồi đi tiếp.
      setError(
        `Câu hỏi đang dài ${rawQuery.length} ký tự, vượt giới hạn ${MAX_QUESTION_LENGTH}. Bạn rút ngắn giúp nhé.`,
      )
      setSuggestion(null)
      return
    }

    const destination = suggestDestination(rawQuery)
    let memoryOnly = false
    if (destination.isCompanion) {
      // Lưu nháp để trang đích đổ sẵn vào ô soạn. Lưu KHÔNG phải gửi: không có lệnh gọi AI nào
      // chạy ở bước này, kể cả khi người dùng đã đăng nhập.
      const saved = saveDraft(rawQuery, owner)
      memoryOnly = saved.status === 'memory-only'
    }
    setSuggestion({ question: rawQuery, destination, memoryOnly })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    suggest(query)
  }

  const openDestination = () => {
    if (!suggestion) return
    setSuggestion(null)
    nav(suggestion.destination.route)
  }

  const copyQuestion = async () => {
    if (!suggestion) return
    try {
      await navigator.clipboard.writeText(suggestion.question)
      toast.info('Đã sao chép câu hỏi')
    } catch {
      toast.error('Trình duyệt không cho sao chép — bạn bôi đen câu hỏi rồi chép tay giúp nhé')
    }
  }

  const toggleVoice = () => {
    if (isListening) {
      stopVoiceRef.current?.()
      setIsListening(false)
      return
    }

    if (!isSTTSupported()) {
      toast.info('Trình duyệt chưa hỗ trợ nhận dạng giọng nói trực tiếp')
      return
    }

    setIsListening(true)
    stopVoiceRef.current = startListening(
      'vi',
      () => {},
      (finalText) => {
        setIsListening(false)
        if (finalText.trim()) {
          setQuery(finalText)
          suggest(finalText)
        }
      },
      () => {
        setIsListening(false)
        toast.error('Lỗi nhận giọng nói, vui lòng thử lại')
      },
    )
  }

  // Khách bấm vào đích cần tài khoản: đưa tới Login, không gọi API riêng tư nào trước đó.
  const needsLogin = Boolean(suggestion?.destination.isCompanion && (!user || isGuest))

  return (
    <div className="w-full mb-4 animate-fade-up motion-reduce:animate-none">
      {/* Câu hỏi còn lại từ lúc chưa đăng nhập */}
      {guestLeftover && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl border border-line-strong bg-surface-card px-3 py-2 text-xs text-content">
          <Info className="w-4 h-4 shrink-0 text-content-secondary" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            Trước khi đăng nhập bạn có gõ một câu hỏi. Dùng lại nhé?
          </span>
          <button
            type="button"
            onClick={askAgain}
            className={buttonClass({ size: 'sm', className: 'tap-44' })}
          >
            Dùng lại câu hỏi
          </button>
          <button
            type="button"
            onClick={() => {
              clearDraft()
              setLeftoverHandled(true)
            }}
            className="tap-44 rounded-xl px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-raised hover:text-content"
          >
            Bỏ qua
          </button>
        </div>
      )}

      {/* Universal Ask Bar */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center gap-2 bg-zinc-900/90 border rounded-2xl p-2 sm:p-2.5 transition-colors duration-200 shadow-lg shadow-black/20 ${
          isListening
            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-zinc-900'
            : 'border-zinc-800 focus-within:border-accent-500/80 focus-within:ring-2 focus-within:ring-accent-500/20'
        }`}
      >
        <div className="pl-2.5 text-zinc-400">
          {isListening ? (
            <span className="relative flex h-4 w-4">
              <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
            </span>
          ) : (
            <Search className="w-4 h-4 text-accent-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Câu hỏi của bạn"
          aria-invalid={error !== null}
          placeholder={
            isListening
              ? 'Đang lắng nghe câu hỏi của bạn...'
              : 'Bạn muốn học gì? (Toán, Tiếng Anh, Phỏng vấn, thí nghiệm mô phỏng)...'
          }
          className="tap-44-y flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none min-w-0"
        />

        {/* Voice Command Button */}
        <button
          type="button"
          onClick={toggleVoice}
          aria-label={isListening ? 'Dừng lắng nghe' : 'Hỏi bằng giọng nói'}
          className={`tap-44 p-2 rounded-xl transition-colors duration-200 flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 animate-pulse motion-reduce:animate-none'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Nút này KHÔNG gửi câu hỏi cho AI — nó chỉ tìm nơi học phù hợp. Nhãn phải nói đúng thế. */}
        <button
          type="submit"
          disabled={!query.trim()}
          aria-label="Tìm nơi học cho câu hỏi này"
          className={`tap-44 px-3 py-2 rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 shrink-0 text-xs font-semibold ${
            query.trim()
              ? 'bg-accent-500 hover:bg-accent-400 text-[#09090b] shadow-md active:scale-95 motion-reduce:transform-none'
              : 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <span className="hidden sm:inline">Tìm nơi học</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Copy validation dài tối đa ba dòng ở 320px: 3×16px line-height + 8px margin = 56px.
          Reserve sẵn đúng 3.5rem để toggle/panel bên dưới không dịch khi lỗi xuất hiện.
          [0501, audit mục 7 — nhịp dọc] Từ `sm` (≥ 640px) câu lỗi dài nhất (~95 ký tự) chỉ
          còn tối đa HAI dòng — kể cả cột chính hẹp ~424px ở 1024px — nên giữ 2×16 + 8 = 40px.
          Giữ 56px ở mọi bề rộng làm khoảng trống rỗng dưới ô hỏi thành khe ~70px, lệch hẳn
          nhịp 12px của các khối phía trên. */}
      <div className="min-h-14 sm:min-h-10">
        {error && (
          <p
            role="alert"
            className="mt-2 px-1 text-xs font-medium text-rose-300 theme-light:text-rose-900"
          >
            {error}
          </p>
        )}
      </div>

      {!isDesktop && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="home-prompt-chips"
          onFocus={() => {
            promptToggleFocusedRef.current = true
          }}
          onBlur={() => {
            promptToggleFocusedRef.current = false
          }}
          onClick={() => setExpanded((current) => !current)}
          className={buttonClass({ variant: 'outline', fullWidth: true, className: 'mt-1' })}
        >
          {expanded ? 'Ẩn gợi ý nhanh' : `Xem ${PROMPT_CHIPS.length} gợi ý nhanh`}
        </button>
      )}

      {/* Chỉ một panel chip trong DOM. HTML hidden loại descendants khỏi tab order và a11y tree. */}
      <div
        id="home-prompt-chips"
        hidden={!effectiveVisible}
        className={`${effectiveVisible ? 'flex' : 'hidden'} items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 scrollbar-none [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]`}
      >
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip.id}
            ref={chip.id === PROMPT_CHIPS[0]?.id ? firstPromptRef : undefined}
            type="button"
            onClick={() => {
              setQuery(chip.query)
              suggest(chip.query)
            }}
            className={`tap-44 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900/80 border border-zinc-800/80 transition-colors duration-200 shrink-0 shadow-sm active:scale-95 motion-reduce:transform-none ${chip.badgeColor}`}
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Gợi ý nơi học — thẻ NỘI TUYẾN, không phải lớp phủ toàn màn hình: nó không chặn trang,
          không cần bẫy focus, và trên màn 320px cũng không bị thanh điều hướng che. */}
      {suggestion && (
        <section
          ref={focusSuggestion}
          aria-label="Gợi ý nơi học"
          className="mt-3 scroll-mb-28 rounded-2xl border border-line-subtle bg-surface-card p-3 sm:p-4 shadow-lg animate-fade-in motion-reduce:animate-none"
        >
          <div className="flex items-start justify-between gap-3 border-b border-line-subtle pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-500/15 text-content">
                <Compass className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-content">Gợi ý nơi học</h3>
                <p className="text-[0.6875rem] text-content-secondary">
                  Chọn theo từ khoá trong câu hỏi — đây chưa phải câu trả lời.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              aria-label="Đóng gợi ý nơi học"
              className="tap-44 rounded-xl p-1.5 text-content-muted transition-colors hover:bg-surface-raised hover:text-content"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nguyên văn câu hỏi: whitespace-pre-wrap để xuống dòng và khoảng trắng không mất. */}
          <div className="mt-3 rounded-2xl border border-line-subtle bg-surface-base p-3 text-xs text-content">
            <span className="mb-1 block font-semibold text-content-secondary">Câu hỏi của bạn</span>
            <span className="block whitespace-pre-wrap break-words">{suggestion.question}</span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-content-secondary">
            <span className="font-semibold text-content">{suggestion.destination.label}</span>{' '}
            <span>— {suggestion.destination.reason}</span>
          </p>

          {suggestion.memoryOnly && (
            <p className="mt-2 rounded-xl border border-line-strong bg-surface-base p-2.5 text-xs text-content-secondary">
              Trình duyệt đang chặn bộ nhớ tạm, nên câu hỏi này không chắc còn khi bạn rời trang.
              Bạn nên sao chép lại trước khi đi tiếp.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={copyQuestion}
              className="tap-44 flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-raised hover:text-content"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>Sao chép câu hỏi</span>
            </button>
            {needsLogin ? (
              <button
                type="button"
                onClick={() => {
                  setSuggestion(null)
                  nav('/login')
                }}
                className={buttonClass()}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Đăng nhập để hỏi Bạn Đồng Hành</span>
              </button>
            ) : (
              <button type="button" onClick={openDestination} className={buttonClass()}>
                <span>Mở {suggestion.destination.label}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {needsLogin && (
            <p className="mt-2 text-right text-[0.6875rem] text-content-secondary">
              Câu hỏi được giữ lại; đăng nhập xong bạn quay về đây bấm tiếp.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

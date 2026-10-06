import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from '../useDialogBehavior'
import type { DebateSessionState, DebateTurn } from '@dhcb/core-contracts/debateArena'
import {
  createDebateSessionApi,
  submitDebateTurnApi,
  evaluateDebateMatchApi,
} from '../../lib/debateArenaApi.js'

interface LiveDebateModalProps {
  onClose: () => void
}

export default function LiveDebateModal({ onClose }: LiveDebateModalProps) {
  const [session, setSession] = useState<DebateSessionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inputTurn, setInputTurn] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  // 6 hành vi a11y bắt buộc của hộp thoại.
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose)

  useEffect(() => {
    async function init() {
      try {
        const newSession = await createDebateSessionApi({
          topicId: 'ai-ethics-1',
          motion:
            'This house believes that AI development should require mandatory government ethical auditing.',
          category: 'technology',
          userStance: 'support',
          difficulty: 'advanced_c1',
          maxRounds: 3,
        })
        setSession(newSession)
      } catch (err) {
        console.error('Failed to init debate session:', err)
      } finally {
        setIsLoading(false)
      }
    }
    void init()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.turns])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputTurn.trim() || !session || isSubmitting) return

    const content = inputTurn.trim()
    setInputTurn('')
    setIsSubmitting(true)

    try {
      const res = await submitDebateTurnApi({
        sessionId: session.id,
        content,
      })
      setSession(res.session)
    } catch (err) {
      console.error('Failed to submit turn:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEvaluate = async () => {
    if (!session) return
    setIsSubmitting(true)
    try {
      const rubric = await evaluateDebateMatchApi(session.id)
      setSession({
        ...session,
        status: 'completed',
        finalRubric: rubric,
      })
    } catch (err) {
      console.error('Failed to evaluate match:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    // role/aria-modal trước đây nằm nhầm ở LỚP NỀN (phủ kín màn hình); nay chuyển vào
    // đúng khung hộp thoại, kèm Escape + bẫy tiêu điểm + khoá cuộn nền.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-3xl border border-indigo-500/30 bg-zinc-950 text-white shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
              ⚔️
            </div>
            <div>
              <h2 id={titleId} className="text-base sm:text-lg font-bold text-white">
                Đấu trường tranh biện AI
              </h2>
              <p className="text-xs text-indigo-300 theme-light:text-indigo-800">
                Chủ đề: {session?.config.motion || 'Đang chuẩn bị...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-44 shrink-0 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Đang kết nối hội đồng AI và khởi tạo sàn tranh biện...
            </div>
          ) : (
            <>
              {/* Personas Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                {session?.personas.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3"
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                        <span className="text-[0.6875rem] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800 font-semibold uppercase">
                          {p.role}
                        </span>
                      </div>
                      <p className="text-[0.6875rem] text-zinc-400 truncate mt-0.5">{p.stance}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Turns Timeline */}
              {session?.turns.length === 0 ? (
                <div className="p-8 text-center bg-indigo-950/20 border border-indigo-500/20 rounded-2xl">
                  <p className="text-sm text-zinc-300 font-medium">
                    Hãy đưa ra luận điểm mở màn (Opening Argument) của bạn bằng tiếng Anh!
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Gợi ý: Sử dụng cấu trúc Toulmin (Claim + Evidence + Warrant) để đạt điểm logic
                    cao nhất.
                  </p>
                </div>
              ) : (
                session?.turns.map((turn: DebateTurn) => (
                  <div
                    key={turn.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      turn.speakerRole === 'user'
                        ? 'bg-indigo-950/30 border-indigo-500/30 ml-4 sm:ml-12'
                        : 'bg-zinc-900/70 border-white/10 mr-4 sm:mr-12'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-300 theme-light:text-indigo-800">
                          {turn.speakerName} ({turn.speakerRole})
                        </span>
                        {/* Nói THẬT khi lượt này là câu mẫu chứ không phải AI vừa nghĩ ra
                            (thiếu key AI / provider lỗi) — xem debateArenaService.ts. */}
                        {turn.isFallback && (
                          <span className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 theme-light:text-amber-900 border border-amber-500/30 font-semibold">
                            Câu mẫu — chưa gọi được AI
                          </span>
                        )}
                        {turn.detectedFallacy !== 'none' && (
                          <span className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 theme-light:text-rose-900 border border-rose-500/30 font-semibold">
                            ⚠️ Ngụy biện: {turn.detectedFallacy}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[0.6875rem] text-zinc-400">
                        <span>Logic: {turn.logicScore}/100</span>
                        <span>•</span>
                        <span>Thuyết phục: {turn.persuasionScore}/100</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {turn.content}
                    </p>

                    {turn.fallacyExplanation && (
                      <div className="mt-2 text-xs p-2 rounded-xl bg-rose-950/40 text-rose-200 theme-light:text-rose-900 border border-rose-500/20">
                        {turn.fallacyExplanation}
                      </div>
                    )}

                    {turn.advancedVocabulary.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[0.6875rem] text-zinc-400">Từ vựng C1/C2:</span>
                        {turn.advancedVocabulary.map((v) => (
                          <span
                            key={v}
                            className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 border border-emerald-500/30 font-semibold"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Rubric Review when completed */}
              {session?.finalRubric && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-zinc-950 border border-indigo-500/40 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🏆</span> Bảng Điểm & Nhận Xét Toàn Trận
                    </h3>
                    <span className="text-lg font-extrabold text-indigo-400 theme-light:text-indigo-800">
                      {session.finalRubric.overallScore}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[0.6875rem] text-zinc-400">Cấu trúc Toulmin</div>
                      <div className="text-xs font-bold text-white">
                        {session.finalRubric.toulminStructureScore}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[0.6875rem] text-zinc-400">Tránh ngụy biện</div>
                      <div className="text-xs font-bold text-white">
                        {session.finalRubric.fallacyAvoidanceScore}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[0.6875rem] text-zinc-400">Từ vựng học thuật</div>
                      <div className="text-xs font-bold text-white">
                        {session.finalRubric.lexicalResourceScore}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-[0.6875rem] text-zinc-400">Sức phản biện</div>
                      <div className="text-xs font-bold text-white">
                        {session.finalRubric.rebuttalEffectivenessScore}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Footer Input */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/80">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputTurn}
              onChange={(e) => setInputTurn(e.target.value)}
              placeholder="Nhập luận điểm của bạn bằng tiếng Anh (ví dụ: It is paramount that...)"
              disabled={isSubmitting || session?.status === 'completed'}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 focus:border-indigo-500 focus:outline-none text-xs sm:text-sm text-white placeholder-zinc-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputTurn.trim() || session?.status === 'completed'}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? '...' : 'Gửi'}
            </button>
            {session && session.turns.length >= 2 && session.status !== 'completed' && (
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={isSubmitting}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs text-zinc-300 font-semibold transition-all"
              >
                Tổng kết
              </button>
            )}
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}

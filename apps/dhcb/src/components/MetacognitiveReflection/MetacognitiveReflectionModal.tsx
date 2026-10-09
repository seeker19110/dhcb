import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { X, Sparkles, Brain, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react'
import {
  fetchDailySocraticPrompt,
  fetchMetacognitiveSummary,
  submitMetacognitiveReflectionApi,
} from '../../lib/metacognitiveReflectionApi.js'
import {
  COGNITIVE_BIAS_LABELS,
  type SocraticDailyPrompt,
  type MetacognitiveReflection,
  type MetacognitiveSummary,
} from '@dhcb/core-contracts/metacognitiveReflection'

/**
 * Bẫy tư duy để HIỂN THỊ. Server đã lọc bẫy "none" giữ chỗ của bản ghi cũ, nhưng giao diện vẫn
 * lọc lại và bù `triggerPhrases` — để bản client mới không vỡ nếu gặp server cũ (rollback) hay
 * phản hồi cũ còn trong bộ nhớ đệm.
 */
function shownTraps(r: MetacognitiveReflection) {
  return (r.identifiedBiases ?? [])
    .filter((b) => b.biasType !== 'none')
    .map((b) => ({ ...b, triggerPhrases: b.triggerPhrases ?? [] }))
}

interface MetacognitiveReflectionModalProps {
  initialPrompt?: SocraticDailyPrompt | null
  onClose: () => void
}

export default function MetacognitiveReflectionModal({
  initialPrompt,
  onClose,
}: MetacognitiveReflectionModalProps) {
  const [domain, setDomain] = useState<'learning' | 'career' | 'work' | 'startup' | 'life'>(
    'learning',
  )
  const [prompt, setPrompt] = useState<SocraticDailyPrompt | null>(initialPrompt || null)
  const [userText, setUserText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentReflection, setCurrentReflection] = useState<MetacognitiveReflection | null>(null)
  const [history, setHistory] = useState<MetacognitiveReflection[]>([])
  const [summary, setSummary] = useState<MetacognitiveSummary | null>(null)
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write')

  useEffect(() => {
    fetchMetacognitiveSummary()
      .then((data) => {
        setSummary(data.summary)
        setHistory(data.reflections)
      })
      .catch(() => {})
  }, [])

  const handleDomainChange = async (newDomain: typeof domain) => {
    setDomain(newDomain)
    try {
      const p = await fetchDailySocraticPrompt(newDomain)
      setPrompt(p)
    } catch {
      // fallback
    }
  }

  const handleSubmit = async () => {
    if (!userText.trim() || !prompt) return
    setIsSubmitting(true)
    try {
      const result = await submitMetacognitiveReflectionApi({
        domain,
        title: `Phản tỉnh ${domain.toUpperCase()} — ${prompt.theme}`,
        reflectionPrompt: `${prompt.promptText} ${prompt.deepDivingQuestion}`,
        userReflection: userText,
      })
      setCurrentReflection(result)
      setHistory((prev) => [result, ...prev])
      setUserText('')
    } catch (err: unknown) {
      const msg = thongDiepLoiThanThien(err, 'Lỗi khi lưu phản tỉnh')
      alert(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90dvh] bg-zinc-950 border border-teal-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-xl">
              🪞
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Nhật ký phản tỉnh Socratic & điểm mù nhận thức
              </h2>
              <p className="text-xs text-zinc-400">
                Viết ra suy nghĩ của bạn, nhận lại câu hỏi để tự soi tiếp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeTab === 'write'
                    ? 'bg-teal-500 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Phản tỉnh mới
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeTab === 'history'
                    ? 'bg-teal-500 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Lịch sử ({history.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'write' ? (
            <>
              {/* Domain Selector */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'learning', label: '🎓 Học tập & Ngôn ngữ' },
                  { id: 'career', label: '💼 Sự nghiệp' },
                  { id: 'work', label: '⚡ Công việc' },
                  { id: 'startup', label: '🚀 Khởi nghiệp' },
                  { id: 'life', label: '🌱 Đời sống & Thói quen' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      handleDomainChange(
                        d.id as 'learning' | 'career' | 'work' | 'startup' | 'life',
                      )
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      domain === d.id
                        ? 'bg-teal-500/20 border-teal-400 text-teal-300 theme-light:text-teal-900 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Socratic Prompt Card */}
              {prompt && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 to-emerald-950/30 border border-teal-500/30">
                  <div className="flex items-center gap-2 text-teal-400 theme-light:text-teal-900 text-xs font-bold mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Chủ đề: {prompt.theme}</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-100 leading-relaxed mb-2">
                    {prompt.promptText}
                  </p>
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-teal-500/20 text-xs text-teal-200 theme-light:text-teal-900/90 leading-relaxed flex items-start gap-2">
                    <Brain className="w-4 h-4 text-teal-400 theme-light:text-teal-900 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Câu hỏi đào sâu Socratic:</strong> {prompt.deepDivingQuestion}
                    </div>
                  </div>
                </div>
              )}

              {/* Reflection Input */}
              <div className="space-y-2">
                <label
                  htmlFor="metacognitivereflectionmodal-dong-suy-ngam-chan-thuc-cua-ban"
                  className="block text-xs font-bold text-zinc-300"
                >
                  Dòng suy ngẫm chân thực của bạn
                </label>
                <textarea
                  id="metacognitivereflectionmodal-dong-suy-ngam-chan-thuc-cua-ban"
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Hãy viết lại cảm nhận, suy nghĩ, sự ngập ngừng hoặc bài học của bạn một cách tự do không phán xét..."
                  rows={5}
                  className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition placeholder:text-zinc-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!userText.trim() || isSubmitting}
                  onClick={handleSubmit}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Đang đọc bài viết...</span>
                  ) : (
                    <>
                      <span>Nhận câu hỏi gợi mở</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Result */}
              {currentReflection && (
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-teal-500/40 space-y-4 animate-fadeIn">
                  {/* Luật số 1 (changelog 0539): phản hồi ĐỊNH TÍNH — không con số chấm người viết. */}
                  <div className="border-b border-zinc-800 pb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">
                        🌟
                      </span>
                      <h4 className="font-bold text-sm text-white">
                        Phản hồi cho bài viết của bạn
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Gợi ý dưới đây dựa trên những cụm từ trong bài viết — để bạn tự hỏi lại, không
                      phải một lời chẩn đoán.
                    </p>
                  </div>

                  {/* Bẫy tư duy có thể đang hiện diện */}
                  {shownTraps(currentReflection).length === 0 ? (
                    <p className="text-xs text-zinc-300">
                      Lần này chưa thấy dấu hiệu bẫy tư duy quen thuộc nào trong bài viết.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 theme-light:text-amber-900" />
                        Có thể bạn đang mắc bẫy tư duy:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {shownTraps(currentReflection).map((b, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-1.5"
                          >
                            <div className="text-xs font-bold text-amber-300 theme-light:text-amber-900">
                              {b.biasName}
                            </div>
                            <p className="text-xs text-zinc-300">{b.explanation}</p>
                            {b.triggerPhrases.length > 0 && (
                              <p className="text-[0.6875rem] text-zinc-400">
                                Vì bạn viết: {b.triggerPhrases.map((t) => `“${t}”`).join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aha Moments */}
                  {currentReflection.ahaMoments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-400 theme-light:text-yellow-900" />
                        Khoảnh khắc "Aha!" sáng suốt:
                      </span>
                      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-100 theme-light:text-yellow-900 space-y-1">
                        {currentReflection.ahaMoments.map((aha, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-yellow-400 theme-light:text-yellow-900 font-bold">
                              •
                            </span>
                            <span>{aha}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Socratic Follow-up */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-teal-500/30 text-xs space-y-1.5">
                    <span className="font-bold text-teal-400 theme-light:text-teal-900 flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5" />
                      Câu hỏi để bạn suy ngẫm tiếp:
                    </span>
                    {currentReflection.socraticFollowUps.map((fu, i) => (
                      <p key={i} className="text-zinc-300 pl-4 border-l-2 border-teal-500/30">
                        {fu}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              {summary && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-teal-500/30 flex flex-wrap items-start gap-x-8 gap-y-3 text-xs">
                  <div>
                    <div className="text-zinc-400">Đã phản tỉnh</div>
                    <div className="font-bold text-zinc-100">
                      {summary.totalReflectionsCount} phiên
                    </div>
                  </div>
                  {summary.topDetectedBiases.length > 0 && (
                    <div className="min-w-0">
                      <div className="text-zinc-400">Bẫy tư duy bạn hay nhắc tới</div>
                      <div className="font-bold text-zinc-100">
                        {summary.topDetectedBiases.map((t) => COGNITIVE_BIAS_LABELS[t]).join(' · ')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {history.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  Chưa có phiên phản tỉnh nào. Hãy bắt đầu phiên đầu tiên hôm nay!
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-teal-500/30 transition space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-300 theme-light:text-teal-900">
                        {h.title}
                      </span>
                      <span className="text-zinc-500">
                        {new Date(h.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2">{h.userReflection}</p>
                    {shownTraps(h).length > 0 && (
                      <p className="pt-1 text-[0.6875rem] text-zinc-400">
                        Bẫy tư duy gợi ý:{' '}
                        {shownTraps(h)
                          .map((b) => COGNITIVE_BIAS_LABELS[b.biasType])
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

import { useState } from 'react'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import {
  Users,
  Flame,
  Award,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import {
  HolodeckScenarioSchema,
  type HolodeckSession,
  type HolodeckTurn,
} from '@dhcb/core-contracts/scenarioHolodeck'
import LoadError from '../LoadError'
import { useCatalogList } from '../../lib/useCatalogList'
import { buttonClass } from '@core/buttonStyles'
import { isSessionGone, practiceErrorFromResponse } from '../../lib/practiceSessionError'
import PracticeSessionAlert from './PracticeSessionAlert'

export default function ScenarioHolodeckCard() {
  // Danh sách kịch bản: trạng thái tải/lỗi/rỗng tách bạch (trước đây lỗi tải để thân thẻ trống trơn).
  const { state: catalog, retry: retryCatalog } = useCatalogList(
    '/api/scenario-holodeck',
    'scenarios',
    HolodeckScenarioSchema,
  )
  const scenarios = catalog.status === 'ready' ? catalog.items : []
  const [activeSession, setActiveSession] = useState<HolodeckSession | null>(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('bigtech_panel_interview')
  const [userUtterance, setUserUtterance] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Phiên trên server đã hết hạn/không còn (404 session_not_found) → khoá ô nhập, hiện
  // "Bắt đầu lại" (changelog 0538). Không thì người học bấm "Gửi" mãi vào một phiên đã chết.
  const [sessionGone, setSessionGone] = useState<boolean>(false)

  /** Ghi lỗi lên UI; lỗi "phiên không còn" bật thêm trạng thái mở lại phiên. */
  const showError = (err: unknown, fallback: string) => {
    if (isSessionGone(err)) setSessionGone(true)
    setErrorMsg(thongDiepLoiThanThien(err, fallback))
  }

  const currentScenario =
    scenarios.find((s) => s.id === (activeSession?.scenarioId || selectedScenarioId)) ||
    scenarios[0]

  const handleStartSession = async (scenarioId: string) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/scenario-holodeck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', scenarioId }),
      })
      if (!res.ok) throw await practiceErrorFromResponse(res, 'Không thể bắt đầu kịch bản')
      const data = await res.json()
      setActiveSession(data.session)
      setSessionGone(false)
    } catch (err) {
      showError(err, 'Lỗi bắt đầu phiên')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTurn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSession || !userUtterance.trim() || isLoading) return

    const message = userUtterance.trim()
    setUserUtterance('')
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/scenario-holodeck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'turn',
          sessionId: activeSession.sessionId,
          utterance: message,
        }),
      })
      if (!res.ok) throw await practiceErrorFromResponse(res, 'Lỗi gửi lượt phản hồi')
      const data = await res.json()
      setActiveSession(data.updatedSession)
    } catch (err) {
      // Trả lại câu vừa gõ để người học không mất bài (gửi lại / chép sang phiên mới).
      setUserUtterance(message)
      showError(err, 'Lỗi gửi lượt phản hồi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!activeSession || isLoading) return
    setIsLoading(true)
    // Xoá lỗi của lượt trước — không thì tổng kết thành công vẫn còn treo khung lỗi cũ.
    setErrorMsg(null)
    try {
      const res = await fetch('/api/scenario-holodeck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          sessionId: activeSession.sessionId,
        }),
      })
      if (!res.ok) throw await practiceErrorFromResponse(res, 'Lỗi tổng kết phiên')
      const data = await res.json()
      setActiveSession(data.session)
    } catch (err) {
      showError(err, 'Lỗi tổng kết')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-surface-card border border-indigo-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden transition duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-line-subtle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-[#fff]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-bold text-white tracking-wide">Scenario Holodeck V3</h3>
              <span className="text-[0.6875rem] px-2 py-0.5 font-bold uppercase rounded-full bg-indigo-500/20 text-indigo-200 theme-light:text-indigo-900 border border-indigo-500/30">
                Multi-Agent VR
              </span>
            </div>
            <p className="text-xs text-content-secondary">
              Phòng giả lập đa nhân vật AI áp lực cao & chấm Rubric chuẩn quốc tế
            </p>
          </div>
        </div>

        {activeSession && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-raised px-3 py-1.5 rounded-lg border border-line-strong">
              <Flame
                className={`w-4 h-4 ${
                  activeSession.currentPressure > 60
                    ? 'text-red-400 theme-light:text-red-900 animate-pulse'
                    : 'text-amber-400 theme-light:text-amber-900'
                }`}
              />
              <span className="text-xs font-semibold text-content-secondary">Áp lực:</span>
              <span
                className={`text-xs font-bold ${
                  activeSession.currentPressure > 60
                    ? 'text-red-400 theme-light:text-red-900'
                    : 'text-amber-300 theme-light:text-amber-900'
                }`}
              >
                {activeSession.currentPressure}%
              </span>
            </div>
            <button
              onClick={() => {
                setActiveSession(null)
                setSessionGone(false)
                setErrorMsg(null)
              }}
              className="p-1.5 text-content-secondary hover:text-content hover:bg-surface-raised rounded-lg transition-colors"
              title="Đổi kịch bản"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <PracticeSessionAlert
          message={errorMsg}
          restarting={isLoading}
          onRestart={
            sessionGone && activeSession
              ? () => void handleStartSession(activeSession.scenarioId)
              : undefined
          }
        />
      )}

      {!activeSession && catalog.status === 'loading' && (
        <p role="status" className="mt-4 text-xs text-content-secondary">
          Đang tải kịch bản…
        </p>
      )}
      {!activeSession && catalog.status === 'error' && (
        <div className="mt-4">
          <LoadError
            message={catalog.message}
            hint="Tiến độ học của bạn không bị ảnh hưởng — chỉ danh sách kịch bản chưa tải được."
            onRetry={retryCatalog}
          />
        </div>
      )}
      {!activeSession && catalog.status === 'ready' && scenarios.length === 0 && (
        <p className="mt-4 text-xs text-content-secondary">
          Chưa có kịch bản nào để luyện. Hãy quay lại sau.
        </p>
      )}

      {/* Body State 1: Select Scenario */}
      {!activeSession && scenarios.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId
              return (
                // Thẻ chọn kịch bản LÀ nút bấm thật (audit 2026-09-05, F1): trước đây là <div
                // onClick> nên bàn phím và trình đọc màn hình không dùng được. aria-pressed cho
                // biết thẻ nào đang được chọn.
                <button
                  key={sc.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`w-full text-left p-4 rounded-xl cursor-pointer border transition duration-200 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-surface-raised border-line-subtle hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[0.6875rem] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800">
                      {sc.difficulty}
                    </span>
                    <span className="text-[0.6875rem] text-content-secondary flex items-center gap-1">
                      <Users className="w-3 h-3" /> {sc.personas.length} Persona
                    </span>
                  </div>
                  <h4
                    className={`text-sm font-semibold mb-1.5 ${isSelected ? 'text-[#fff]' : 'text-white'}`}
                  >
                    {sc.title}
                  </h4>
                  <p className="text-xs text-content-secondary line-clamp-2">{sc.description}</p>
                </button>
              )
            })}
          </div>

          {currentScenario && (
            <div className="p-4 rounded-xl bg-surface-raised border border-line-strong mt-4">
              <div className="text-xs font-semibold text-content-secondary mb-2">
                Hội đồng nhân vật tham gia:
              </div>
              <div className="flex flex-wrap gap-3">
                {currentScenario.personas.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 bg-surface-raised px-3 py-2 rounded-lg border border-line-strong"
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover border border-indigo-400/40"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[0.6875rem] text-content-secondary">
                        {p.speakingStyle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleStartSession(currentScenario.id)}
                disabled={isLoading}
                className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-[#fff] font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bước vào phòng giả lập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Body State 2: Active Simulation Session */}
      {activeSession && (
        <div className="mt-4 space-y-4">
          {/* Persona avatars banner */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {currentScenario?.personas.map((p) => {
              const isLastSpeaker =
                activeSession.turns[activeSession.turns.length - 1]?.personaId === p.id
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                    isLastSpeaker
                      ? 'bg-indigo-900/50 border-indigo-400 ring-2 ring-indigo-400/30'
                      : 'bg-surface-raised border-line-subtle opacity-70'
                  }`}
                >
                  <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-xs font-semibold text-content">{p.name}</span>
                </div>
              )
            })}
          </div>

          {/* Turn stream */}
          <div className="max-h-72 overflow-y-auto space-y-3 p-3 rounded-xl bg-surface-raised border border-line-subtle">
            {activeSession.turns.map((turn: HolodeckTurn, idx: number) => {
              const isUser = turn.speakerType === 'user'
              const speakerPersona = currentScenario?.personas.find((p) => p.id === turn.personaId)

              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="text-[0.6875rem] text-content-secondary mb-1 flex items-center gap-1.5">
                    {!isUser && speakerPersona && (
                      <span className="font-bold text-indigo-400 theme-light:text-indigo-800">
                        {speakerPersona.name}
                      </span>
                    )}
                    {isUser && (
                      <span className="font-bold text-emerald-400 theme-light:text-emerald-900">
                        Bạn
                      </span>
                    )}
                    <span>
                      •{' '}
                      {new Date(turn.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 theme-light:text-emerald-900 rounded-tr-none'
                        : 'bg-surface-raised border border-line-strong text-content rounded-tl-none'
                    }`}
                  >
                    {turn.content}
                  </div>

                  {/* Instant Feedback if user turn */}
                  {isUser && turn.instantFeedback && (
                    <div className="mt-1.5 max-w-[85%] p-2 rounded-lg bg-surface-raised border border-line-subtle text-[0.6875rem] space-y-1 text-content-secondary">
                      {turn.instantFeedback.strengths.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-400 theme-light:text-emerald-900">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>{turn.instantFeedback.strengths.join(', ')}</span>
                        </div>
                      )}
                      {turn.instantFeedback.weaknesses.length > 0 && (
                        <div className="flex items-center gap-1 text-amber-400 theme-light:text-amber-900">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{turn.instantFeedback.weaknesses.join(', ')}</span>
                        </div>
                      )}
                      {turn.instantFeedback.suggestedNuance && (
                        <div className="text-[0.6875rem] text-indigo-300 theme-light:text-indigo-800 italic pt-0.5 border-t border-line-subtle">
                          💡 Gợi ý tinh chỉnh: {turn.instantFeedback.suggestedNuance}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Final Rubric if completed */}
          {activeSession.status === 'completed' && activeSession.finalRubric && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400 theme-light:text-amber-900" />
                  <h4 className="text-sm font-bold text-[#fff]">
                    Bảng điểm rubric tổng kết chuẩn quốc tế
                  </h4>
                </div>
                <div className="text-lg font-black text-amber-400 theme-light:text-amber-900 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                  Overall Band: {activeSession.finalRubric.overallBand}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded bg-surface-raised border border-line-subtle">
                  <div className="text-[0.6875rem] text-content-secondary">Fluency</div>
                  <div className="text-xs font-bold text-indigo-300 theme-light:text-indigo-800">
                    {activeSession.finalRubric.fluencyAndCoherence}
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-raised border border-line-subtle">
                  <div className="text-[0.6875rem] text-content-secondary">Lexical</div>
                  <div className="text-xs font-bold text-indigo-300 theme-light:text-indigo-800">
                    {activeSession.finalRubric.lexicalResource}
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-raised border border-line-subtle">
                  <div className="text-[0.6875rem] text-content-secondary">Grammar</div>
                  <div className="text-xs font-bold text-indigo-300 theme-light:text-indigo-800">
                    {activeSession.finalRubric.grammaticalRange}
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-raised border border-line-subtle">
                  <div className="text-[0.6875rem] text-content-secondary">Persuasion</div>
                  <div className="text-xs font-bold text-indigo-300 theme-light:text-indigo-800">
                    {activeSession.finalRubric.strategicPersuasion}
                  </div>
                </div>
              </div>

              <p className="text-xs text-content-secondary leading-relaxed">
                {activeSession.finalRubric.detailedCritique}
              </p>

              <div className="space-y-1">
                <div className="text-[0.6875rem] font-semibold text-amber-300 theme-light:text-amber-900">
                  🎯 Lộ trình bài tập đề xuất tiếp theo:
                </div>
                {activeSession.finalRubric.recommendedDrills.map((drill, i) => (
                  <div key={i} className="text-xs text-content-secondary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{drill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Turn Input Form */}
          {/* Màn hẹp: ô nhập một hàng, nút xuống hàng dưới (ảnh Tầng 8b 0538: nút tràn khỏi thẻ ở 390px). */}
          {activeSession.status === 'active' && !sessionGone && (
            <form onSubmit={handleSendTurn} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={userUtterance}
                onChange={(e) => setUserUtterance(e.target.value)}
                placeholder="Nhập câu trả lời hoặc phản biện bằng tiếng Anh..."
                disabled={isLoading}
                className="min-w-0 basis-full sm:basis-0 flex-1 px-4 py-2.5 rounded-xl bg-surface-raised border border-line-strong text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!userUtterance.trim() || isLoading}
                className={buttonClass({ variant: 'primary' })}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isLoading}
                className={buttonClass({ variant: 'outline' })}
              >
                Kết thúc
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

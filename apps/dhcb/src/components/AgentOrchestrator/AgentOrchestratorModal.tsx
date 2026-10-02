import { useState } from 'react'
import { createPortal } from 'react-dom'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { useDialogBehavior } from '../useDialogBehavior'
import { X, Bot, Play, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import type {
  AutonomousAgentRole,
  AgentExecutionSession,
} from '@dhcb/core-contracts/agentOrchestrator'
import { createAutonomousAgentSession } from '../../lib/agentOrchestratorApi'

interface Props {
  onClose: () => void
  onSessionCreated: (session: AgentExecutionSession) => void
}

export default function AgentOrchestratorModal({ onClose, onSessionCreated }: Props) {
  // 6 hành vi a11y bắt buộc của hộp thoại (Escape, bẫy tiêu điểm, khoá cuộn nền…).
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose)
  const [role, setRole] = useState<AutonomousAgentRole>('code_architect')
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSession, setActiveSession] = useState<AgentExecutionSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rolesList: Array<{ id: AutonomousAgentRole; name: string; desc: string; icon: string }> = [
    {
      id: 'code_architect',
      name: 'Kiến Trúc Sư Phần Mềm',
      desc: 'Rà soát cấu trúc module, thiết kế hợp đồng dữ liệu & giải pháp phân tầng',
      icon: '🏛️',
    },
    {
      id: 'socratic_mentor',
      name: 'Cố Vấn Nhận Thức Socratic',
      desc: 'Phát hiện bẫy ngụy biện, dẫn dắt thấu suốt và mở khóa tư duy đột phá',
      icon: '🧠',
    },
    {
      id: 'career_strategist',
      name: 'Chiến Lược Gia Sự Nghiệp',
      desc: 'Phân tích khoảng cách kỹ năng chuẩn quốc tế và lộ trình thăng tiến',
      icon: '💼',
    },
    {
      id: 'venture_validator',
      name: 'Thẩm Định Viên Khởi Nghiệp',
      desc: 'Kiểm chứng giả định thị trường, phản biện bài toán và xây dựng kế hoạch MVP',
      icon: '🚀',
    },
    {
      id: 'life_concierge',
      name: 'Quản Gia Nhịp Sống & Năng Lượng',
      desc: 'Tối ưu hóa lịch trình nhịp sinh học và kích hoạt lá chắn dòng chảy',
      icon: '🌱',
    },
  ]

  const handleLaunch = async () => {
    if (!title.trim() || !goal.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const session = await createAutonomousAgentSession({
        sessionTitle: title,
        primaryRole: role,
        userGoalDescription: goal,
        budgetGuardrail: {
          maxTokens: 50000,
          maxCostUsd: 0.1,
          maxExecutionSeconds: 120,
        },
      })
      setActiveSession(session)
      onSessionCreated(session)
    } catch (err: unknown) {
      setError(thongDiepLoiThanThien(err, 'Không thể khởi chạy Agent'))
    } finally {
      setLoading(false)
    }
  }

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold text-zinc-100">
                Studio Điều Phối Agent Tự Trị
              </h2>
              <p className="text-xs text-zinc-400">
                Ủy quyền nhiệm vụ đa bước với chu trình Tự lập kế hoạch $\rightarrow$ Thực thi
                $\rightarrow$ Bàn giao
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="tap-44 shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!activeSession ? (
            <>
              {/* Role Selection */}
              <div className="space-y-2.5">
                <div
                  id="agent-role-label"
                  className="text-xs font-bold text-zinc-300 uppercase tracking-wider block"
                >
                  1. Chọn Vai Trò Agent Chuyên Môn
                </div>
                <div
                  role="group"
                  aria-labelledby="agent-role-label"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  {rolesList.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={role === r.id}
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                        role === r.id
                          ? 'bg-indigo-500/15 border-indigo-500/50 ring-1 ring-indigo-500/40 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xl shrink-0">{r.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-zinc-100 block">{r.name}</span>
                        <span className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                          {r.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Inputs */}
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="agentorchestratormodal-2-tieu-de-nhiem-vu"
                    className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5"
                  >
                    2. Tiêu Đề Nhiệm Vụ
                  </label>
                  <input
                    id="agentorchestratormodal-2-tieu-de-nhiem-vu"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Thiết kế cấu trúc phân tầng cho hệ thống"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="agentorchestratormodal-3-mo-ta-chi-tiet-muc-tieu-can-da"
                    className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5"
                  >
                    3. Mô Tả Chi Tiết Mục Tiêu Cần Đạt
                  </label>
                  <textarea
                    id="agentorchestratormodal-3-mo-ta-chi-tiet-muc-tieu-can-da"
                    rows={3}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Mô tả cụ thể bối cảnh, kỳ vọng đầu ra và các ràng buộc..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Budget Guardrails Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
                  <span>Trần ngân sách: tối đa 50.000 tokens</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 theme-light:text-emerald-900 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Lá chắn bảo vệ
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 theme-light:text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Active / Completed Execution View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-sky-950/40 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-300 theme-light:text-indigo-800 uppercase tracking-wider">
                    {activeSession.sessionTitle}
                  </span>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Đã hoàn tất {activeSession.steps.length} bước tự trị · Dùng{' '}
                    {activeSession.totalTokensUsed} tokens
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 theme-light:text-emerald-900 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                </span>
              </div>

              {/* Execution Trace Timeline */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Dòng Thực Thi Tự Trị (Execution Trace):
                </span>
                <div className="space-y-2">
                  {activeSession.steps.map((step) => (
                    <div
                      key={step.stepIndex}
                      className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800 font-bold text-[11px] flex items-center justify-center">
                            {step.stepIndex}
                          </span>
                          <span className="font-bold text-zinc-200 uppercase text-[11px] tracking-wider bg-zinc-800 px-2 py-0.5 rounded">
                            {step.phase}
                          </span>
                          <span className="font-medium text-zinc-300">
                            {step.actionDescription}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500">{step.tokensUsed} tok</span>
                      </div>

                      {step.outputArtifact && (
                        <div className="ml-7 text-[11px] text-emerald-400 theme-light:text-emerald-900 font-medium">
                          ✨ Sản phẩm: {step.outputArtifact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverable Markdown */}
              {activeSession.finalDeliverableMarkdown && (
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {activeSession.finalDeliverableMarkdown}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          {activeSession ? (
            <button
              type="button"
              onClick={() => setActiveSession(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
            >
              ← Tạo phiên khác
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
            >
              Đóng
            </button>

            {!activeSession && (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={loading || !title.trim() || !goal.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white transition active:scale-98 disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang điều phối...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Khởi Chạy Agent Ngay</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

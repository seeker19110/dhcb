import { useState, useEffect } from 'react'
import { Play, Cpu, CheckCircle2 } from 'lucide-react'
import { fetchAgentSessions } from '../../lib/agentOrchestratorApi'
import type { AgentExecutionSession } from '@dhcb/core-contracts/agentOrchestrator'
import AgentOrchestratorModal from './AgentOrchestratorModal'

export default function AgentOrchestratorCard() {
  const [sessions, setSessions] = useState<AgentExecutionSession[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchAgentSessions()
      .then((data) => setSessions(data))
      .catch(() => {})
  }, [])

  const roleLabelMap: Record<string, string> = {
    socratic_mentor: 'Cố vấn Nhận thức Socratic',
    career_strategist: 'Chiến lược gia Sự nghiệp',
    code_architect: 'Kiến trúc sư Phần mềm',
    venture_validator: 'Thẩm định viên Khởi nghiệp',
    life_concierge: 'Quản gia Nhịp sống & Năng lượng',
  }

  const latestSession = sessions[0]

  return (
    <>
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-xl space-y-4 transition-all duration-300 hover:border-indigo-500/40">
        {/* Màn hẹp: header xếp dọc (khuôn S06d-b). Trước đây tiêu đề + huy hiệu + nút chung một hàng
            nên tiêu đề bị ép thành 3 dòng ở 390px — lộ ra khi thẻ dời sang studio "Kế hoạch"
            (changelog 0475), nơi cổng e2e đo header thẻ. */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  Studio Điều Phối Agent Tự Trị
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 theme-light:text-indigo-800 border border-indigo-500/30 uppercase tracking-wider">
                  V5.5 Flagship
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Vòng lặp tự trị đa bước với lá chắn kiểm soát ngân sách tokens
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-[#fff] transition active:scale-98 shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Khởi chạy Agent</span>
          </button>
        </div>

        {/* Status or Latest Session Preview */}
        {latestSession ? (
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">
                  {latestSession.sessionTitle}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800 border border-indigo-500/30">
                  {roleLabelMap[latestSession.primaryRole] || latestSession.primaryRole}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 theme-light:text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Đã dùng: {latestSession.totalTokensUsed} tokens</span>
              <span>Tokens: {latestSession.totalTokensUsed}</span>
              <span>{latestSession.steps.length} bước thực thi</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-1">
            <p className="text-xs text-zinc-300 font-semibold">Chưa có phiên Agent nào đang chạy</p>
            <p className="text-[11px] text-content-secondary">
              Nhấn nút &quot;Khởi chạy Agent&quot; để ủy quyền giải quyết nhiệm vụ phức tạp đa bước.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AgentOrchestratorModal
          onClose={() => setIsModalOpen(false)}
          onSessionCreated={(session) => {
            setSessions((prev) => [session, ...prev])
          }}
        />
      )}
    </>
  )
}

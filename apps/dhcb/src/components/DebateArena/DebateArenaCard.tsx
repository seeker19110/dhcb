import { useState } from 'react'
import LiveDebateModal from './LiveDebateModal.js'

interface DebateArenaCardProps {
  onOpenTopic?: (topicId: string) => void
}

export default function DebateArenaCard({ onOpenTopic }: DebateArenaCardProps) {
  const [isOpenModal, setIsOpenModal] = useState(false)

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-surface-card p-5 shadow-xl transition-all duration-300 hover:border-indigo-500/50 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/30 border border-indigo-400/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 theme-light:text-indigo-800 border border-indigo-500/30 tracking-wide uppercase">
                  Platform V5 Flagship
                </span>
                <span className="text-[0.6875rem] font-semibold text-zinc-400">
                  Oxbridge & Toulmin Model
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Đấu Trường Tranh Biện AI (Multi-Agent Debate)
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 leading-relaxed">
                Đối kháng luận điểm cùng hội đồng AI phản biện, phân tích ngụy biện (Fallacy
                Detection) và nâng band IELTS 7.5+.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpenModal(true)
              onOpenTopic?.('ai-ethics')
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-[#fff] font-bold text-xs sm:text-sm shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span>Bắt đầu Tranh biện</span>
            <span>⚡</span>
          </button>
        </div>
      </div>

      {isOpenModal && <LiveDebateModal onClose={() => setIsOpenModal(false)} />}
    </>
  )
}

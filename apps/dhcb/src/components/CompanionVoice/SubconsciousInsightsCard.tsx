import React, { useEffect, useState } from 'react'
import { Brain, Sparkles, Target, ShieldAlert, RefreshCw, Layers, CheckCircle2 } from 'lucide-react'
import type { SubconsciousThoughtLog } from '@dhcb/core-contracts/subconscious'

export const SubconsciousInsightsCard: React.FC = () => {
  const [thought, setThought] = useState<SubconsciousThoughtLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const triggerConsolidation = async () => {
    try {
      setTriggering(true)
      const res = await fetch('/api/subconscious', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.thought) {
          setThought(data.thought)
        }
      }
    } catch {
      // Bỏ qua lỗi
    } finally {
      setTriggering(false)
    }
  }

  // Nạp suy nghĩ ngầm mới nhất 1 lần lúc mount — hàm async định nghĩa TRONG
  // effect, mọi setState nằm sau await (không setState đồng bộ trong effect);
  // `loading` khởi tạo mặc định true nên không cần setLoading(true).
  useEffect(() => {
    const fetchLatestThought = async () => {
      const res = await fetch('/api/subconscious')
      if (res.ok) {
        const data = await res.json()
        if (data.thought) {
          setThought(data.thought)
        }
      }
    }
    fetchLatestThought()
      .catch(() => {
        // Bỏ qua lỗi kết nối
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-indigo-950/40 border border-purple-800/40 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
        <Brain className="w-5 h-5 text-purple-400 theme-light:text-purple-800 animate-spin" />
        <span className="text-xs text-purple-300 theme-light:text-purple-800 font-medium">
          Đang đọc luồng nhận thức ngầm và chiến lược đón đầu ngày mới...
        </span>
      </div>
    )
  }

  if (!thought) return null

  const { preComputedStrategy, graphChanges, hypothesesEvaluated } = thought

  return (
    <div className="bg-gradient-to-br from-purple-950/50 via-zinc-900/90 to-indigo-950/50 border border-purple-700/50 rounded-2xl p-4 space-y-3.5 shadow-xl animate-fade-in text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 theme-light:text-purple-800 border border-purple-500/30">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[#fff] text-sm flex items-center gap-1.5">
              <span>Nhận thức ngầm & dự đoán đón đầu</span>
              <span className="px-1.5 py-0.5 rounded text-[0.6875rem] font-mono bg-purple-500/20 text-purple-300 theme-light:text-purple-800 border border-purple-500/30">
                V3 Autonomous
              </span>
            </h4>
            <p className="text-[0.6875rem] text-zinc-400">
              Tổng hợp tự động từ chu trình củng cố ký ức ban đêm (REM Consolidation)
            </p>
          </div>
        </div>

        <button
          onClick={triggerConsolidation}
          disabled={triggering}
          className="tap-44 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 theme-light:text-purple-800 border border-purple-500/40 transition disabled:opacity-50 text-xs font-semibold"
          title="Kích hoạt chu trình hợp nhất nhận thức ngầm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${triggering ? 'animate-spin' : ''}`} />
          <span>{triggering ? 'Đang hợp nhất…' : 'Hợp nhất lại'}</span>
        </button>
      </div>

      {/* Recommended Mindset */}
      <div className="bg-purple-950/60 theme-light:bg-purple-100 border border-purple-800/50 rounded-xl p-3 text-purple-200 theme-light:text-purple-800 leading-relaxed font-medium flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-purple-400 theme-light:text-purple-800 shrink-0 mt-0.5" />
        <div>
          <span className="text-[0.6875rem] font-bold text-purple-400 theme-light:text-purple-800 block mb-0.5">
            Tâm thế khuyến nghị ngày mới
          </span>
          <p className="text-xs text-purple-100 theme-light:text-purple-800">
            {preComputedStrategy.recommendedMindset}
          </p>
        </div>
      </div>

      {/* Vital Tasks */}
      <div className="space-y-1.5">
        <div className="text-[0.6875rem] font-semibold text-zinc-300 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900" />
          <span>Top nhiệm vụ đón đầu đã tính toán sẵn:</span>
        </div>
        <div className="space-y-1">
          {preComputedStrategy.vitalTasks.map((task, idx) => (
            <div
              key={idx}
              className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-center gap-2 text-zinc-200"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
              <span className="font-medium text-[0.6875rem]">{task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Potential Obstacles */}
      {preComputedStrategy.potentialObstacles.length > 0 && (
        <div className="space-y-1">
          {preComputedStrategy.potentialObstacles.map((obs, idx) => (
            <div
              key={idx}
              className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-2.5 flex items-center gap-2 text-rose-300 theme-light:text-rose-900 text-[0.6875rem]"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 theme-light:text-rose-900 shrink-0" />
              <span>{obs}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Graph & Hypotheses Detail */}
      <div className="pt-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[0.6875rem] text-purple-400 theme-light:text-purple-800 hover:text-purple-300 font-semibold flex items-center gap-1 transition"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>
            {isExpanded
              ? 'Thu gọn chi tiết nhận thức ngầm'
              : `Xem chi tiết tái cấu trúc đồ thị (${graphChanges.edgesRewired} liên kết mới)`}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-purple-800/30 space-y-2 text-[0.6875rem] animate-fade-in text-zinc-300">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <div className="font-bold text-white text-xs">{graphChanges.nodesCreated}</div>
                <div className="text-[0.6875rem] text-zinc-400">Nút tri thức</div>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <div className="font-bold text-purple-400 theme-light:text-purple-800 text-xs">
                  {graphChanges.edgesRewired}
                </div>
                <div className="text-[0.6875rem] text-zinc-400">Liên kết mới</div>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <div className="font-bold text-sky-400 theme-light:text-sky-900 text-xs">
                  {graphChanges.redundantItemsPruned}
                </div>
                <div className="text-[0.6875rem] text-zinc-400">Đã lọc nhiễu</div>
              </div>
            </div>

            {hypothesesEvaluated.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[0.6875rem] uppercase font-bold text-purple-300 theme-light:text-purple-800">
                  Giả thuyết AI tự động kiểm chứng:
                </div>
                {hypothesesEvaluated.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-zinc-950/70 border border-purple-900/40 text-[0.6875rem] space-y-1"
                  >
                    <div className="text-zinc-200 font-medium">💡 {h.hypothesis}</div>
                    {h.actionProposed && (
                      <div className="text-purple-300 theme-light:text-purple-800 text-[0.6875rem]">
                        ↳ {h.actionProposed}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubconsciousInsightsCard

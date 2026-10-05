import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Compass, RefreshCw, TrendingUp, Zap, CheckCircle2 } from 'lucide-react'
import type { LifeSynthesisReport, LifeDomainType } from '@dhcb/core-contracts/lifeSynthesis'
import { generateCustomLifeSynthesisReport } from '../../lib/lifeSynthesisApi'

interface Props {
  report: LifeSynthesisReport
  onClose: () => void
  onRefresh: (report: LifeSynthesisReport) => void
}

export default function LifeSynthesisDetailModal({ report, onClose, onRefresh }: Props) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>(report.timeframe)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleTimeframeChange = async (newTf: 'daily' | 'weekly' | 'monthly') => {
    setTimeframe(newTf)
    setIsRefreshing(true)
    try {
      const updated = await generateCustomLifeSynthesisReport({ timeframe: newTf })
      onRefresh(updated)
    } catch {
      // Bỏ qua lỗi cập nhật tạm thời
    } finally {
      setIsRefreshing(false)
    }
  }

  const domainLabelMap: Record<LifeDomainType, string> = {
    learning: 'Học tập',
    career: 'Sự nghiệp',
    work: 'Công việc',
    startup: 'Khởi nghiệp',
    life: 'Đời sống',
  }

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Báo cáo tổng hợp đa miền & dự báo chiến lược
              </h2>
              <p className="text-xs text-zinc-400">
                Phân tích cộng hưởng 5 miền & dự báo xác suất cán đích mục tiêu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Timeframe Selector */}
          <div className="flex items-center justify-between bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleTimeframeChange(tf)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    timeframe === tf
                      ? 'bg-accent-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tf === 'daily' ? 'Hàng Ngày' : tf === 'weekly' ? 'Hàng Tuần' : 'Hàng Tháng'}
                </button>
              ))}
            </div>

            {isRefreshing && (
              <div className="flex items-center gap-1 text-xs text-accent-400 pr-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tính toán lại...</span>
              </div>
            )}
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <span className="text-[11px] font-semibold text-zinc-400">Đồng bộ toàn diện</span>
              <div className="text-xl font-black text-accent-400 mt-1">
                {report.holisticAlignmentScore}%
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <span className="text-[11px] font-semibold text-zinc-400">Cộng hưởng đa miền</span>
              <div className="text-xl font-black text-indigo-400 theme-light:text-indigo-800 mt-1">
                {report.lifeSynergyIndex}%
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <span className="text-[11px] font-semibold text-zinc-400">Bền bỉ nhận thức</span>
              <div className="text-xl font-black text-emerald-400 theme-light:text-emerald-900 mt-1">
                {report.cognitiveResilienceScore}%
              </div>
            </div>
          </div>

          {/* Predictive Goals Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-accent-400" />
              Dự báo xác suất mục tiêu chiến lược
            </h3>

            <div className="space-y-3">
              {report.predictiveGoals.map((goal) => (
                <div
                  key={goal.goalId}
                  className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{goal.title}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-300 font-semibold border border-accent-500/25">
                          {domainLabelMap[goal.domain]}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Ngày mục tiêu: {goal.targetDate} · Dự kiến về đích:{' '}
                        <strong className="text-zinc-200">{goal.estimatedCompletionDate}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-emerald-400 theme-light:text-emerald-900">
                        {goal.successProbabilityPercent}%
                      </span>
                      <span className="block text-[11px] text-zinc-500 uppercase font-semibold">
                        Xác suất đạt
                      </span>
                    </div>
                  </div>

                  {/* Critical Path Steps */}
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-400 block">
                      Các bước đường găng (Critical Path):
                    </span>
                    {goal.criticalPathSteps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High Leverage Recommendations */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
              Khuyến nghị chiến lược đòn bẩy cao
            </h3>

            <div className="space-y-2.5">
              {report.highLeverageRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">{rec.title}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        rec.priority === 'critical'
                          ? 'bg-rose-500/15 text-rose-300 theme-light:text-rose-900 border-rose-500/30'
                          : rec.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-300 theme-light:text-amber-900 border-amber-500/30'
                            : 'bg-sky-500/15 text-sky-300 theme-light:text-sky-900 border-sky-500/30'
                      }`}
                    >
                      Ưu tiên {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{rec.actionPrompt}</p>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <span>⚡ {rec.expectedSynergyImpact}</span>
                    <span>⏱️ ~{rec.estimatedMinutes} phút</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

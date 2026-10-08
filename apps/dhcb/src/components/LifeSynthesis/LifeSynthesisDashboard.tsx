// CHƯA GẮN vào giao diện từ 2026-10-02 (changelog 0475): API nguồn trả 501 vì chưa có dữ liệu
// hoạt động thật (trước đó trả điểm bịa giống nhau cho mọi người dùng). Giữ mã để bật lại sau.
import { useState, useEffect } from 'react'
import {
  Sparkles,
  TrendingUp,
  Target,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Layers,
} from 'lucide-react'
import { fetchLifeSynthesisReport } from '../../lib/lifeSynthesisApi'
import type { LifeSynthesisReport } from '@dhcb/core-contracts/lifeSynthesis'
import LifeSynthesisDetailModal from './LifeSynthesisDetailModal'
import { buttonClass } from '@core/buttonStyles'

export default function LifeSynthesisDashboard() {
  const [report, setReport] = useState<LifeSynthesisReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchLifeSynthesisReport('weekly')
      .then((data) => setReport(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const domainIconColorMap: Record<string, string> = {
    learning: 'text-sky-400 theme-light:text-sky-900 bg-sky-400/10 border-sky-400/20',
    career: 'text-purple-400 theme-light:text-purple-800 bg-purple-400/10 border-purple-400/20',
    work: 'text-emerald-400 theme-light:text-emerald-900 bg-emerald-400/10 border-emerald-400/20',
    startup: 'text-amber-400 theme-light:text-amber-900 bg-amber-400/10 border-amber-400/20',
    life: 'text-rose-400 theme-light:text-rose-900 bg-rose-400/10 border-rose-400/20',
  }

  const domainLabelMap: Record<string, string> = {
    learning: 'Học tập',
    career: 'Sự nghiệp',
    work: 'Công việc',
    startup: 'Khởi nghiệp',
    life: 'Đời sống',
  }

  const topGoal = report?.predictiveGoals?.[0]

  return (
    <>
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-xl space-y-4 transition duration-300 hover:border-accent-500/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  Tổng hợp đa miền & dự báo mục tiêu
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-bold bg-accent-500/15 text-accent-200 theme-light:text-accent-900 border border-accent-500/30 uppercase tracking-wider">
                  V5.4 Flagship
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Ma trận đồng bộ 5 miền & dự toán xác suất cán đích mục tiêu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={buttonClass({ size: 'sm', className: 'tap-44' })}
          >
            <span>Phân tích sâu</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Core Indices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-accent-400" />
                Đồng bộ toàn diện
              </span>
              <span className="text-[0.6875rem] font-bold text-accent-300 theme-light:text-accent-900">
                Holistic
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-100">
                {loading ? '--' : `${report?.holisticAlignmentScore || 88}`}
              </span>
              <span className="text-xs text-zinc-400">/ 100</span>
            </div>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-accent-500 h-full rounded-full transition-[width] duration-700"
                style={{ width: `${report?.holisticAlignmentScore || 88}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 theme-light:text-indigo-800" />
                Cộng hưởng đa miền
              </span>
              <span className="text-[0.6875rem] font-bold text-indigo-400 theme-light:text-indigo-800">
                Synergy
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-100">
                {loading ? '--' : `${report?.lifeSynergyIndex || 92}`}
              </span>
              <span className="text-xs text-zinc-400">/ 100</span>
            </div>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-[width] duration-700"
                style={{ width: `${report?.lifeSynergyIndex || 92}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900" />
                Bền bỉ nhận thức
              </span>
              <span className="text-[0.6875rem] font-bold text-emerald-400 theme-light:text-emerald-900">
                Resilience
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-100">
                {loading ? '--' : `${report?.cognitiveResilienceScore || 85}`}
              </span>
              <span className="text-xs text-zinc-400">/ 100</span>
            </div>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-[width] duration-700"
                style={{ width: `${report?.cognitiveResilienceScore || 85}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5 Domains Momentum Bar */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Xung lực hoạt động 5 lĩnh vực
            </span>
            <span className="text-[0.6875rem] text-zinc-400">Cập nhật theo tuần</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(report?.domainBreakdown || []).map((dom) => (
              <div
                key={dom.domain}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem] font-bold text-zinc-200">
                    {domainLabelMap[dom.domain] || dom.domain}
                  </span>
                  <span
                    className={`text-[0.6875rem] font-bold px-1.5 py-0.5 rounded-full border ${
                      domainIconColorMap[dom.domain] || 'text-zinc-400'
                    }`}
                  >
                    {dom.momentum === 'accelerating'
                      ? '⚡ Tăng tốc'
                      : dom.momentum === 'stable'
                        ? 'Ổn định'
                        : dom.momentum === 'decelerating'
                          ? 'Chậm'
                          : 'Ngủ đông'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-zinc-100">{dom.score}</span>
                  <span className="text-[0.6875rem] text-zinc-400">/ 100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Predictive Goal Spotlight */}
        {topGoal && (
          <div className="bg-gradient-to-r from-accent-950/30 via-zinc-900/60 to-indigo-950/30 border border-accent-500/20 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-500/20 text-accent-300 flex items-center justify-center shrink-0 border border-accent-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-zinc-100 flex items-center gap-2">
                  <span>{topGoal.title}</span>
                  <span className="text-[0.6875rem] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 font-bold border border-emerald-500/30">
                    {topGoal.successProbabilityPercent}% Xác suất đạt
                  </span>
                </div>
                <p className="text-[0.6875rem] text-zinc-400 mt-0.5">
                  Dự kiến hoàn tất:{' '}
                  <span className="text-zinc-200 font-medium">
                    {topGoal.estimatedCompletionDate}
                  </span>{' '}
                  · Đích chuẩn: {topGoal.targetDate}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-accent-400 hover:text-accent-300 whitespace-nowrap transition"
            >
              Chi tiết →
            </button>
          </div>
        )}
      </div>

      {isModalOpen && report && (
        <LifeSynthesisDetailModal
          report={report}
          onClose={() => setIsModalOpen(false)}
          onRefresh={(newReport) => setReport(newReport)}
        />
      )}
    </>
  )
}

import { useState } from 'react'
import type { GoalAutoPilotPlan, GoalAutoPilotStep } from '@dhcb/core-contracts/proactiveAgent'
import ProactiveAgentSettingsModal from './ProactiveAgentSettingsModal'
import { buttonClass } from '@core/buttonStyles'

interface GoalAutoPilotCardProps {
  plan: GoalAutoPilotPlan
  onActionClick?: (route: string) => void
}

export default function GoalAutoPilotCard({ plan, onActionClick }: GoalAutoPilotCardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const currentStep = plan.steps.find((s) => s.status === 'in_progress') || plan.steps[0]

  return (
    <div className="p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md shadow-xl mb-4 transition">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-indigo-600 flex items-center justify-center text-zinc-950 font-black text-sm shadow-md">
            🎯
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{plan.goalTitle}</h3>
            <p className="text-[0.6875rem] text-accent-400 font-medium">
              Auto-Pilot • {plan.domain.toUpperCase()} • Mục tiêu tuần
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-semibold"
          title="Cài đặt Proactive Agent"
        >
          ⚙️ Cấu hình
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs font-semibold text-zinc-400">
          <span>Tiến độ hành động</span>
          <span className="text-accent-300">{plan.progressPercentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-500 via-indigo-500 to-emerald-400 transition-[width] duration-500 rounded-full"
            style={{ width: `${plan.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current Atomic Step Card */}
      {currentStep && (
        <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/60 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-accent-500/20 text-accent-300 text-[0.6875rem] font-bold">
                Bước {currentStep.stepNumber} • {currentStep.estimatedMinutes} phút
              </span>
              <span className="text-[0.6875rem] text-zinc-500 font-medium">Đang tiến hành</span>
            </div>
            <h4 className="text-xs font-bold text-zinc-100 mt-1 truncate">{currentStep.title}</h4>
            <p className="text-[0.6875rem] text-zinc-400 line-clamp-1 mt-0.5">
              {currentStep.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onActionClick?.(currentStep.actionRoute)}
            className={buttonClass({ size: 'sm', className: 'flex-shrink-0 tap-44' })}
          >
            Thực hiện ➔
          </button>
        </div>
      )}

      {/* Timeline Steps Preview */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {plan.steps.map((step: GoalAutoPilotStep) => (
          <div
            key={step.stepNumber}
            className={`p-2 rounded-xl border text-[0.6875rem] font-medium transition ${
              step.status === 'completed'
                ? 'bg-emerald-950/20 theme-light:bg-emerald-50 border-emerald-500/30 text-emerald-300 theme-light:text-emerald-900'
                : step.status === 'in_progress'
                  ? 'bg-accent-950/20 border-accent-500/40 text-accent-200 ring-1 ring-accent-500/30'
                  : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Bước {step.stepNumber}</span>
              <span>
                {step.status === 'completed' ? '✓' : step.status === 'in_progress' ? '▶' : '⏳'}
              </span>
            </div>
            <p className="truncate mt-0.5 font-semibold">{step.title}</p>
          </div>
        ))}
      </div>

      <ProactiveAgentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

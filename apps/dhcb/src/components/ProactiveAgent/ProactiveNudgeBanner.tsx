import { useState } from 'react'
import type { ProactiveNudge } from '@dhcb/core-contracts/proactiveAgent'
import { dismissProactiveNudge, executeProactiveAction } from '../../lib/proactiveAgentApi.js'
import { buttonClass } from '@core/buttonStyles'

interface ProactiveNudgeBannerProps {
  nudge: ProactiveNudge
  onDismiss?: (nudgeId: string) => void
  onActionTriggered?: (targetUrl: string) => void
}

export default function ProactiveNudgeBanner({
  nudge,
  onDismiss,
  onActionTriggered,
}: ProactiveNudgeBannerProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed || nudge.dismissed) return null

  const handleDismiss = async () => {
    setIsDismissed(true)
    try {
      await dismissProactiveNudge(nudge.id)
      onDismiss?.(nudge.id)
    } catch {
      // ignore
    }
  }

  const handleAction = async () => {
    if (!nudge.suggestedAction) return
    setIsExecuting(true)
    try {
      const res = await executeProactiveAction(nudge.id, nudge.suggestedAction)
      setIsDismissed(true)
      onActionTriggered?.(res.targetUrl)
    } catch {
      // ignore
    } finally {
      setIsExecuting(false)
    }
  }

  const getPriorityColor = () => {
    switch (nudge.priority) {
      case 'urgent':
        return 'border-rose-500/40 bg-rose-950/30 text-rose-200 theme-light:text-rose-900'
      case 'high':
        return 'border-amber-500/40 bg-amber-950/30 text-amber-200 theme-light:text-amber-900'
      default:
        return 'border-accent-500/40 bg-accent-950/30 text-accent-200'
    }
  }

  const getIcon = () => {
    switch (nudge.nudgeType) {
      case 'circadian_peak':
        return '⚡'
      case 'neuro_burnout_prevention':
        return '🛡️'
      case 'canvas_blocker':
        return '📌'
      case 'streak_at_risk':
        return '🔥'
      default:
        return '🤖'
    }
  }

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl border backdrop-blur-md shadow-lg transition duration-300 mb-3 animate-fade-in ${getPriorityColor()}`}
      role="alert"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
        <span className="text-2xl flex-shrink-0 select-none">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-white">{nudge.title}</h4>
            <span className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-white/10 uppercase">
              {nudge.priority}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed line-clamp-2">
            {nudge.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto justify-end flex-shrink-0">
        {nudge.suggestedAction && (
          <button
            type="button"
            onClick={handleAction}
            disabled={isExecuting}
            className={buttonClass({ size: 'sm', className: 'tap-44' })}
          >
            {isExecuting ? 'Đang kích hoạt...' : nudge.suggestedAction.label}
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Ẩn nhắc nhở"
          aria-label="Ẩn nhắc nhở"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

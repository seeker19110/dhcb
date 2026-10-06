import React, { useEffect, useState } from 'react'
import {
  Activity,
  Zap,
  Shield,
  Heart,
  Wind,
  BellOff,
  Sliders,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import type { NeuroAffectiveState, ActiveShield } from '@dhcb/core-contracts/neuroAffective'

export const NeuroAffectiveCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<NeuroAffectiveState | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const handleToggleShield = async (shield: ActiveShield, currentlyEnabled: boolean) => {
    try {
      setToggling(shield)
      const res = await fetch('/api/neuro-affective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_shield',
          shield,
          enabled: !currentlyEnabled,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.state) setState(data.state)
      }
    } catch {
      // Bỏ qua lỗi
    } finally {
      setToggling(null)
    }
  }

  // Nạp trạng thái 1 lần lúc mount — hàm async định nghĩa TRONG effect, mọi
  // setState nằm sau await (không setState đồng bộ trong thân effect);
  // `loading` khởi tạo mặc định true nên không cần setLoading(true).
  useEffect(() => {
    const fetchState = async () => {
      const res = await fetch('/api/neuro-affective')
      if (res.ok) {
        const data = await res.json()
        if (data.state) setState(data.state)
      }
    }
    fetchState()
      .catch(() => {
        // Bỏ qua lỗi
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading && !state) return null
  if (!state) return null

  const isPeakFlow = state.energyLevel === 'peak_flow'
  const isBurnout = state.energyLevel === 'burnout_risk'

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition text-xs shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-xl border ${
              isPeakFlow
                ? 'bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 border-emerald-500/40 animate-pulse'
                : isBurnout
                  ? 'bg-rose-500/20 text-rose-300 theme-light:text-rose-900 border-rose-500/40'
                  : 'bg-teal-500/20 text-teal-300 theme-light:text-teal-900 border-teal-500/30'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white text-xs block">
              Thấu cảm sinh học & điều tiết thần kinh
            </span>
            <span className="text-[0.6875rem] text-zinc-400">
              {isPeakFlow
                ? 'Đang ở trạng thái tập trung sâu (Flow State)'
                : isBurnout
                  ? 'Đang bật can thiệp phục hồi năng lượng'
                  : 'Nhịp sinh học ổn định'}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold border ${
            isPeakFlow
              ? 'bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 border-emerald-500/30'
              : isBurnout
                ? 'bg-rose-500/20 text-rose-300 theme-light:text-rose-900 border-rose-500/30'
                : 'bg-teal-500/20 text-teal-300 theme-light:text-teal-900 border-teal-500/30'
          }`}
        >
          {state.energyLevel.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-zinc-800/80 space-y-4 animate-fade-in bg-zinc-950/60">
          {/* Energy & Stress Meters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-zinc-400 text-[0.6875rem]">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 theme-light:text-amber-900" />
                  Điểm tập trung (Focus)
                </span>
                <span className="font-bold text-white">{state.focusScore}/100</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${state.focusScore}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-zinc-400 text-[0.6875rem]">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400 theme-light:text-rose-900" />
                  Chỉ số Căng thẳng (Stress)
                </span>
                <span className="font-bold text-white">{state.stressIndex}/100</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    state.stressIndex > 70
                      ? 'bg-rose-500'
                      : state.stressIndex > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${state.stressIndex}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-zinc-300 leading-relaxed font-medium flex items-start gap-2.5">
            <Sliders className="w-4 h-4 text-teal-400 theme-light:text-teal-900 shrink-0 mt-0.5" />
            <div>
              <span className="text-[0.6875rem] font-bold text-teal-400 theme-light:text-teal-900 block mb-0.5">
                Khuyến nghị điều tiết
              </span>
              <p className="text-xs text-zinc-200">{state.recommendedAction}</p>
            </div>
          </div>

          {/* Active Adaptive Shields */}
          <div className="space-y-2">
            <div className="text-[0.6875rem] font-semibold text-zinc-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900" />
              <span>Lá chắn thích ứng thần kinh (Adaptive Shields):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'mute_notifications' as ActiveShield,
                  label: 'Chặn thông báo xao nhãng',
                  icon: BellOff,
                },
                {
                  id: 'focus_timer_lock' as ActiveShield,
                  label: 'Khóa đồng hồ Flow 45p',
                  icon: Zap,
                },
                {
                  id: 'suggest_breathing' as ActiveShield,
                  label: 'Hướng dẫn thở phục hồi',
                  icon: Wind,
                },
                {
                  id: 'downscale_difficulty' as ActiveShield,
                  label: 'Giảm tải độ khó bài tập',
                  icon: Sliders,
                },
              ].map((shield) => {
                const isEnabled = state.activeShields.includes(shield.id)
                const Icon = shield.icon
                return (
                  <button
                    key={shield.id}
                    onClick={() => handleToggleShield(shield.id, isEnabled)}
                    disabled={toggling === shield.id}
                    className={`tap-44 p-2.5 rounded-xl border flex items-center justify-between transition text-left ${
                      isEnabled
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 theme-light:text-emerald-900'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {toggling === shield.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900" />
                      )}
                      <span className="font-semibold text-xs">{shield.label}</span>
                    </div>
                    {isEnabled && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NeuroAffectiveCard

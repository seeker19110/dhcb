import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { ProactiveAgentConfig } from '@dhcb/core-contracts/proactiveAgent'
import { updateProactiveConfigApi } from '../../lib/proactiveAgentApi.js'

interface ProactiveAgentSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentConfig?: ProactiveAgentConfig
  onConfigSaved?: (config: ProactiveAgentConfig) => void
}

export default function ProactiveAgentSettingsModal({
  isOpen,
  onClose,
  currentConfig,
  onConfigSaved,
}: ProactiveAgentSettingsModalProps) {
  const [frequency, setFrequency] = useState<'gentle' | 'balanced' | 'high_focus'>(
    currentConfig?.nudgeFrequency || 'balanced',
  )
  const [autoFlowShield, setAutoFlowShield] = useState(currentConfig?.autoFlowShieldEnabled ?? true)
  const [autoPilot, setAutoPilot] = useState(currentConfig?.autoPilotEnabled ?? true)
  const [quietStart, setQuietStart] = useState(currentConfig?.quietHoursStart || '22:30')
  const [quietEnd, setQuietEnd] = useState(currentConfig?.quietHoursEnd || '06:30')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateProactiveConfigApi({
        nudgeFrequency: frequency,
        autoFlowShieldEnabled: autoFlowShield,
        autoPilotEnabled: autoPilot,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
      })
      onConfigSaved?.(updated)
      onClose()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h3 className="text-base font-bold text-white">Cấu hình Trợ lý Tự trị V5</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Nudge Frequency */}
        <div className="space-y-2">
          <div
            id="nudge-frequency-label"
            className="text-xs font-bold text-zinc-300 block uppercase"
          >
            Tần suất chủ động đề xuất
          </div>
          <div
            role="group"
            aria-labelledby="nudge-frequency-label"
            className="grid grid-cols-3 gap-2"
          >
            {(['gentle', 'balanced', 'high_focus'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={frequency === mode}
                onClick={() => setFrequency(mode)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  frequency === mode
                    ? 'bg-accent-500 text-zinc-950 border-accent-400 shadow-md'
                    : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {mode === 'gentle' ? 'Nhẹ nhàng' : mode === 'balanced' ? 'Cân bằng' : 'Tập trung'}
              </button>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-2">
          <div id="quiet-hours-label" className="text-xs font-bold text-zinc-300 block uppercase">
            Khung giờ yên tĩnh (Không gửi Nudge)
          </div>
          <div role="group" aria-labelledby="quiet-hours-label" className="flex items-center gap-3">
            <input
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
            />
            <span className="text-zinc-500 text-xs">đến</span>
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-zinc-300">
              Tự động bật Lá chắn Dòng chảy (Flow Shield)
            </span>
            <input
              type="checkbox"
              checked={autoFlowShield}
              onChange={(e) => setAutoFlowShield(e.target.checked)}
              className="toggle rounded accent-accent-500 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-zinc-300">
              Kích hoạt Mục tiêu Tự hành (Goal Auto-Pilot)
            </span>
            <input
              type="checkbox"
              checked={autoPilot}
              onChange={(e) => setAutoPilot(e.target.checked)}
              className="toggle rounded accent-accent-500 w-4 h-4"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-zinc-950 text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

import { useState } from 'react'
import { RealtimeSessionTelemetry } from '@dhcb/core-contracts/meshTelemetry'
import { MeshStatusSummary, resetSessionBudget } from '../../lib/meshTelemetryApi.js'
import { useToast } from '@core/ToastProvider'
import { ShieldCheck, X, Radio } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'

interface MeshHealthMonitorModalProps {
  isOpen: boolean
  onClose: () => void
  telemetry: RealtimeSessionTelemetry
  meshStatus: MeshStatusSummary
  onUpdated: (t: RealtimeSessionTelemetry) => void
}

export default function MeshHealthMonitorModal({
  isOpen,
  onClose,
  telemetry,
  meshStatus,
  onUpdated,
}: MeshHealthMonitorModalProps) {
  const toast = useToast()
  const [newCap, setNewCap] = useState(String(telemetry.costCapUsd))
  const [updating, setUpdating] = useState(false)

  if (!isOpen) return null

  const handleUpdateCap = async () => {
    const parsed = parseFloat(newCap)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Vui lòng nhập hạn mức hợp lệ (USD).')
      return
    }
    setUpdating(true)
    try {
      const updated = await resetSessionBudget(parsed)
      onUpdated(updated)
      toast.success('Đã cập nhật trần ngân sách: $' + parsed)
    } catch {
      toast.error('Lỗi khi cập nhật ngân sách.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/40 bg-zinc-900 p-6 shadow-2xl space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 theme-light:text-cyan-800 border border-cyan-500/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              Giám sát mạng lưới WebSocket Mesh
              <span className="rounded px-1.5 py-0.2 text-[0.6875rem] font-bold uppercase bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-800 border border-emerald-500/40">
                {meshStatus.overallQuality}% Quality
              </span>
            </h3>
            <p className="text-[0.6875rem] text-zinc-400">Vùng máy chủ: {meshStatus.region}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[0.6875rem] text-zinc-400 block mb-1">Độ trễ mạng (P50/P95)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 theme-light:text-emerald-800 font-mono">
                {telemetry.currentLatencyMs}
              </span>
              <span className="text-xs text-zinc-500 font-mono">ms</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[0.6875rem] text-zinc-400 block mb-1">
              Số node relay hoạt động
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-400 theme-light:text-cyan-800 font-mono">
                {meshStatus.activeNodes}
              </span>
              <span className="text-xs text-zinc-500">nodes</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[0.6875rem] text-zinc-400 block mb-1">Tổng tokens phiên</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-zinc-100 font-mono">
                {telemetry.totalTokens}
              </span>
              <span className="text-xs text-zinc-500 font-mono">tokens</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[0.6875rem] text-zinc-400 block mb-1">Chi phí tích lũy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 theme-light:text-emerald-800 font-mono">
                {telemetry.totalTokens} tokens
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950/80 p-3.5 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400 theme-light:text-cyan-800" />
              <span>Budget Quota Guard (Circuit Breaker)</span>
            </div>
            <span className="text-[0.6875rem] text-zinc-400 font-mono">
              Hạn mức phiên: theo gói
            </span>
          </div>

          <p className="text-[0.6875rem] text-zinc-400">
            Tự động chuyển sang mô hình siêu tiết kiệm (Edge AI / Flash) nếu chi phí vượt ngưỡng
            trần để đảm bảo không phát sinh chi phí ngoài ý muốn.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="10"
              value={newCap}
              onChange={(e) => setNewCap(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
              placeholder="0.10"
            />
            <button
              type="button"
              disabled={updating}
              onClick={handleUpdateCap}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition flex-shrink-0"
            >
              {updating ? 'Lưu...' : 'Cập nhật'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={buttonClass({
            variant: 'outline',
            size: 'sm',
            fullWidth: true,
            className: 'tap-44',
          })}
        >
          Đóng
        </button>
      </div>
    </div>
  )
}

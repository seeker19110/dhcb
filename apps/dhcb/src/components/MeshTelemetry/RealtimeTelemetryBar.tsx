import { useState, useEffect } from 'react'
import { RealtimeSessionTelemetry } from '@dhcb/core-contracts/meshTelemetry'
import { fetchMeshTelemetry, MeshStatusSummary } from '../../lib/meshTelemetryApi.js'
import MeshHealthMonitorModal from './MeshHealthMonitorModal'

export default function RealtimeTelemetryBar() {
  const [telemetry, setTelemetry] = useState<RealtimeSessionTelemetry | null>(null)
  const [meshStatus, setMeshStatus] = useState<MeshStatusSummary | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Nạp telemetry lúc mount + mỗi 15s — hàm async định nghĩa TRONG effect, mọi
  // setState nằm sau await (không setState đồng bộ trong thân effect).
  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        const data = await fetchMeshTelemetry()
        setTelemetry(data.telemetry)
        setMeshStatus(data.meshStatus)
      } catch {
        // im lặng
      }
    }
    void loadTelemetry()
    const interval = setInterval(() => {
      void loadTelemetry()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  if (!telemetry || !meshStatus) return null

  return (
    <div className="flex items-center justify-between py-1.5 px-2 bg-zinc-950/40 rounded-xl border border-zinc-800/60 mb-2">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[11px] text-zinc-400 font-medium">
          {/* Vùng máy chủ là thông tin hạ tầng — không hiện cho người học */}
          <span className="text-zinc-200 font-semibold">Kết nối ổn định</span>
        </span>
      </div>

      {/* Badge chi phí USD đã gỡ khỏi UI người dùng cuối (việc quyết định #3, 2026-08-23) —
          số USD là ước tính nội bộ, chỉ admin xem qua /api/admin-usage-stats */}

      <MeshHealthMonitorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        telemetry={telemetry}
        meshStatus={meshStatus}
        onUpdated={(updated) => setTelemetry(updated)}
      />
    </div>
  )
}

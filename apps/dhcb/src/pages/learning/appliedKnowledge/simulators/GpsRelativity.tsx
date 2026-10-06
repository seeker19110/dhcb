// SIMULATOR 5: GPS RELATIVITY — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { Radio } from 'lucide-react'
import { calculateGpsRelativity } from '../../../../lib/simulators'

export function GpsRelativity() {
  const [gpsDays, setGpsDays] = useState(3)
  const gpsSimResult = calculateGpsRelativity(gpsDays)

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-cyan-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-cyan-400 theme-light:text-cyan-800 flex items-center gap-2">
            <Radio className="w-5 h-5" />
            Mô phỏng 5: Thuyết tương đối Einstein & độ trôi vị trí vệ tinh GPS
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Vật lý hiện đại lớp 12 & Công nghệ định vị toàn cầu
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 theme-light:text-cyan-800 font-mono font-bold">
          Δt = +38.6 μs / ngày
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Số ngày vệ tinh bay không bù trừ hiệu ứng Einstein:</span>
              <span className="font-bold text-cyan-300 theme-light:text-cyan-800">
                {gpsDays} ngày
              </span>
            </div>
            <input
              type="range"
              aria-label="Số ngày vệ tinh bay không bù trừ hiệu ứng Einstein"
              min="1"
              max="30"
              step="1"
              value={gpsDays}
              onChange={(e) => setGpsDays(+e.target.value)}
              className="w-full accent-cyan-500"
            />
          </div>

          <div className="space-y-2 text-xs text-zinc-400">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-rose-400 theme-light:text-rose-800 font-bold">
                • Thuyết tương đối hẹp (Do vận tốc $v = 14.000$ km/h):
              </span>
              <div>Làm đồng hồ vệ tinh chạy CHẬM hơn {Math.abs(gpsSimResult.srDilationUs)} μs.</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 theme-light:text-emerald-800 font-bold">
                • Thuyết tương đối rộng (Do trọng lực yếu ở độ cao 20.000 km):
              </span>
              <div>Làm đồng hồ vệ tinh chạy NHANH hơn {gpsSimResult.grDilationUs} μs.</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Tổng chênh lệch thời gian đồng hồ:</div>
            <div className="text-2xl font-black text-cyan-400 theme-light:text-cyan-800 mt-1">
              +{gpsSimResult.netDilationUs} micro-giây
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Tốc độ ánh sáng $c = 300.000$ km/s</div>
          </div>

          <div className="p-3.5 rounded-lg bg-rose-950/40 theme-light:bg-rose-50 border border-rose-500/40">
            <div className="text-xs text-rose-300 theme-light:text-rose-800 font-bold">
              🚨 Độ sai lệch vị trí trên Google Maps:
            </div>
            <div className="text-xl font-extrabold text-rose-400 theme-light:text-rose-800 mt-1">
              {gpsSimResult.positionDriftKm} km
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Nếu không có công thức Einstein, bạn đặt xe ở Hà Nội nhưng bản đồ sẽ chỉ sang tận Hải
              Dương hoặc Bắc Ninh!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

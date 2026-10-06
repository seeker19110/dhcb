// SIMULATOR 6: BRAKING DISTANCE — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { Car } from 'lucide-react'
import { calculateBrakingDistance } from '../../../../lib/simulators'

export function BrakingDistance() {
  const [carSpeed, setCarSpeed] = useState(60)
  const [reactionTime, setReactionTime] = useState(1.0)
  const [roadFriction, setRoadFriction] = useState(0.7)
  const brakingSimResult = calculateBrakingDistance(carSpeed, reactionTime, roadFriction)

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-red-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-red-400 theme-light:text-red-800 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Mô Phỏng 6: Khoảng Cách Phanh Xe & Động Năng Va Chạm ($E_k = \\frac{1}
            {2}mv^2$)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Vật lý động học lớp 10 & quy tắc an toàn giao thông đường bộ
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-red-500/20 text-red-300 theme-light:text-red-800 font-mono font-bold">
          Stopping Distance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Vận tốc di chuyển của xe ($v$):</span>
              <span className="font-bold text-zinc-200">{carSpeed} km/h</span>
            </div>
            <input
              type="range"
              aria-label="Vận tốc di chuyển của xe (v)"
              min="20"
              max="140"
              step="5"
              value={carSpeed}
              onChange={(e) => setCarSpeed(+e.target.value)}
              className="w-full accent-red-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Thời gian phản xạ người lái (t_phản_xạ):</span>
              <span
                className={`font-bold ${
                  reactionTime <= 0.8
                    ? 'text-emerald-400 theme-light:text-emerald-800'
                    : reactionTime <= 1.2
                      ? 'text-yellow-300 theme-light:text-yellow-800'
                      : 'text-red-400 theme-light:text-red-800'
                }`}
              >
                {reactionTime}s{' '}
                {reactionTime >= 1.5 ? '(Nguy hiểm: dùng ĐT/mệt mỏi)' : '(Tỉnh táo)'}
              </span>
            </div>
            <input
              type="range"
              aria-label="Thời gian phản xạ người lái (t phản xạ)"
              min="0.5"
              max="2.5"
              step="0.1"
              value={reactionTime}
              onChange={(e) => setReactionTime(+e.target.value)}
              className="w-full accent-red-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Hệ số ma sát mặt đường ($\mu$):</span>
              <span className="font-bold text-zinc-200">
                {roadFriction >= 0.7
                  ? 'Đường nhựa khô ráo (0.7 - 0.8)'
                  : roadFriction >= 0.4
                    ? 'Đường mưa ướt (0.4 - 0.5)'
                    : 'Đường trơn trượt (0.3)'}
              </span>
            </div>
            <input
              type="range"
              aria-label="Hệ số ma sát mặt đường (mu)"
              min="0.25"
              max="0.85"
              step="0.05"
              value={roadFriction}
              onChange={(e) => setRoadFriction(+e.target.value)}
              className="w-full accent-red-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Tổng khoảng cách dừng xe tối thiểu:</div>
            <div className="text-3xl font-black text-red-400 theme-light:text-red-800 mt-1">
              {brakingSimResult.totalStoppingDistanceM} mét
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              (Quãng đường phản xạ: {brakingSimResult.reactionDistanceM}m + Quãng đường phanh trượt:{' '}
              {brakingSimResult.brakingDistanceM}m)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="text-xs text-zinc-400">Động năng chiếc xe 1.5 tấn cần triệt tiêu:</div>
            <div className="text-base font-bold text-amber-300 theme-light:text-amber-800">
              {brakingSimResult.initialKineticEnergyKj.toLocaleString()} kJ
            </div>
            <div className="text-[11px] text-zinc-500">
              Vận tốc tăng gấp đôi thì động năng và quãng đường phanh tăng gấp 4 lần ($v^2$)!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

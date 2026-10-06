// SIMULATOR 7: ALCOHOL DILUTION — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { calculateAlcoholDilution } from '../../../../lib/simulators'

export function AlcoholDilution() {
  const [targetAlcoholVol, setTargetAlcoholVol] = useState(500)
  const [initialAlcoholDeg, setInitialAlcoholDeg] = useState(90)
  const alcoholSimResult = calculateAlcoholDilution(targetAlcoholVol, initialAlcoholDeg)

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-purple-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-purple-400 theme-light:text-purple-800 flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Mô Phỏng 7: Nồng Độ Dung Dịch & Công Thức Pha Cồn 70° ($C_1 V_1 = C_2 V_2$)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hóa học lớp 8-9 & quy chuẩn sát khuẩn y tế chuẩn WHO
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 theme-light:text-purple-800 font-mono font-bold">
          $C_1 V_1 = C_2 V_2$
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Thể tích cồn 70° mong muốn pha chế:</span>
              <span className="font-bold text-purple-300 theme-light:text-purple-800">
                {targetAlcoholVol} ml
              </span>
            </div>
            <input
              type="range"
              aria-label="Thể tích cồn 70° mong muốn pha chế"
              min="100"
              max="2000"
              step="50"
              value={targetAlcoholVol}
              onChange={(e) => setTargetAlcoholVol(+e.target.value)}
              className="w-full accent-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Nồng độ cồn nguyên liệu ban đầu:</span>
              <span className="font-bold text-zinc-200">Cồn {initialAlcoholDeg}°</span>
            </div>
            <div className="flex gap-2 mt-1">
              {[90, 96].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setInitialAlcoholDeg(deg)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                    initialAlcoholDeg === deg
                      ? 'bg-purple-600 text-[#fff] border-purple-400'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  Cồn {deg}°
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Công thức pha chế chính xác:</div>
            <div className="text-xl font-bold text-purple-300 theme-light:text-purple-800 mt-2 space-y-1">
              <div>
                • Lấy:{' '}
                <span className="text-white font-black">
                  {alcoholSimResult.initialAlcoholVolumeMl} ml
                </span>{' '}
                cồn {initialAlcoholDeg}°
              </div>
              <div>
                • Thêm:{' '}
                <span className="text-cyan-400 theme-light:text-cyan-800 font-black">
                  {alcoholSimResult.waterToAddMl} ml
                </span>{' '}
                nước đun sôi để nguội
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-950/30 theme-light:bg-purple-50 border border-purple-500/20 text-xs text-zinc-300">
            🧪 <strong>Vì sao cồn 70° tốt hơn 90°?</strong> {alcoholSimResult.scientificReason}
          </div>
        </div>
      </div>
    </div>
  )
}

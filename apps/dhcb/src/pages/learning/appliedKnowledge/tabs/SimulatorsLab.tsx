// Tab 1 — Phòng thí nghiệm mô phỏng: bảng chọn 10 simulator + simulator đang chọn.
// Tách từ AppliedKnowledge.tsx (2026-09-06). Chỉ MỘT simulator được mount tại một thời điểm
// (phương án A), nên giá trị đã nhập không được nhớ khi đổi simulator.
// React 19 gỡ namespace JSX toàn cục — phải import type JSX từ 'react' thay vì dựa vào global.
import type { JSX } from 'react'
import {
  TrendingUp,
  Zap,
  Radio,
  Car,
  FlaskConical,
  Activity,
  HeartPulse,
  Dna,
  Calculator,
  Building2,
} from 'lucide-react'
import { ProfitOptimization } from '../simulators/ProfitOptimization'
import { CompoundInterest } from '../simulators/CompoundInterest'
import { LoanAmortization } from '../simulators/LoanAmortization'
import { EvnElectricity } from '../simulators/EvnElectricity'
import { GpsRelativity } from '../simulators/GpsRelativity'
import { BrakingDistance } from '../simulators/BrakingDistance'
import { AlcoholDilution } from '../simulators/AlcoholDilution'
import { PhScale } from '../simulators/PhScale'
import { TdeeMacro } from '../simulators/TdeeMacro'
import { BloodGenetics } from '../simulators/BloodGenetics'

export type SimulatorId =
  | 'profit'
  | 'compound_interest'
  | 'loan'
  | 'evn_electric'
  | 'gps_relativity'
  | 'braking'
  | 'alcohol_dilution'
  | 'ph_scale'
  | 'tdee_macro'
  | 'blood_genetics'

const SIMULATORS: Record<SimulatorId, () => JSX.Element> = {
  profit: ProfitOptimization,
  compound_interest: CompoundInterest,
  loan: LoanAmortization,
  evn_electric: EvnElectricity,
  gps_relativity: GpsRelativity,
  braking: BrakingDistance,
  alcohol_dilution: AlcoholDilution,
  ph_scale: PhScale,
  tdee_macro: TdeeMacro,
  blood_genetics: BloodGenetics,
}

type Props = {
  activeSimulator: SimulatorId
  setActiveSimulator: (id: SimulatorId) => void
}

export function SimulatorsLab({ activeSimulator, setActiveSimulator }: Props) {
  const ActiveSimulator = SIMULATORS[activeSimulator]
  return (
    <div className="space-y-6">
      {/* Simulator Picker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveSimulator('profit')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'profit'
              ? 'bg-blue-950/60 theme-light:bg-blue-50 border-blue-500 text-white shadow-lg shadow-blue-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <TrendingUp className="w-5 h-5 text-blue-400 theme-light:text-blue-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 theme-light:text-blue-800 font-mono">
              Toán
            </span>
          </div>
          <div className="text-xs font-bold mt-2">1. Tối ưu Lợi nhuận</div>
        </button>

        <button
          onClick={() => setActiveSimulator('compound_interest')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'compound_interest'
              ? 'bg-emerald-950/60 theme-light:bg-emerald-50 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <Calculator className="w-5 h-5 text-emerald-400 theme-light:text-emerald-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-800 font-mono">
              Tài chính
            </span>
          </div>
          <div className="text-xs font-bold mt-2">2. Lãi kép & FIRE</div>
        </button>

        <button
          onClick={() => setActiveSimulator('loan')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'loan'
              ? 'bg-amber-950/60 theme-light:bg-amber-50 border-amber-500 text-white shadow-lg shadow-amber-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <Building2 className="w-5 h-5 text-amber-400 theme-light:text-amber-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 theme-light:text-amber-800 font-mono">
              Vay vốn
            </span>
          </div>
          <div className="text-xs font-bold mt-2">3. Trả góp Mua nhà</div>
        </button>

        <button
          onClick={() => setActiveSimulator('evn_electric')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'evn_electric'
              ? 'bg-yellow-950/60 theme-light:bg-yellow-50 border-yellow-500 text-white shadow-lg shadow-yellow-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <Zap className="w-5 h-5 text-yellow-400 theme-light:text-yellow-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 theme-light:text-yellow-800 font-mono">
              Vật lý
            </span>
          </div>
          <div className="text-xs font-bold mt-2">4. Tiền điện EVN</div>
        </button>

        <button
          onClick={() => setActiveSimulator('gps_relativity')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'gps_relativity'
              ? 'bg-cyan-950/60 theme-light:bg-cyan-50 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <Radio className="w-5 h-5 text-cyan-400 theme-light:text-cyan-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 theme-light:text-cyan-800 font-mono">
              Vũ trụ
            </span>
          </div>
          <div className="text-xs font-bold mt-2">5. GPS & Einstein</div>
        </button>

        <button
          onClick={() => setActiveSimulator('braking')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'braking'
              ? 'bg-red-950/60 theme-light:bg-red-50 border-red-500 text-white shadow-lg shadow-red-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <Car className="w-5 h-5 text-red-400 theme-light:text-red-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 theme-light:text-red-800 font-mono">
              An toàn
            </span>
          </div>
          <div className="text-xs font-bold mt-2">6. Phanh & Động năng</div>
        </button>

        <button
          onClick={() => setActiveSimulator('alcohol_dilution')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'alcohol_dilution'
              ? 'bg-purple-950/60 theme-light:bg-purple-50 border-purple-500 text-white shadow-lg shadow-purple-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <FlaskConical className="w-5 h-5 text-purple-400 theme-light:text-purple-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 theme-light:text-purple-800 font-mono">
              Hóa học
            </span>
          </div>
          <div className="text-xs font-bold mt-2">7. Pha Cồn 70°</div>
        </button>

        <button
          onClick={() => setActiveSimulator('ph_scale')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'ph_scale'
              ? 'bg-indigo-950/60 theme-light:bg-indigo-50 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <Activity className="w-5 h-5 text-indigo-400 theme-light:text-indigo-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800 font-mono">
              Axit-Bazơ
            </span>
          </div>
          <div className="text-xs font-bold mt-2">8. Thang Đo pH</div>
        </button>

        <button
          onClick={() => setActiveSimulator('tdee_macro')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'tdee_macro'
              ? 'bg-rose-950/60 theme-light:bg-rose-50 border-rose-500 text-white shadow-lg shadow-rose-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <HeartPulse className="w-5 h-5 text-rose-400 theme-light:text-rose-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 theme-light:text-rose-800 font-mono">
              Dinh dưỡng
            </span>
          </div>
          <div className="text-xs font-bold mt-2">9. BMR / TDEE Macro</div>
        </button>

        <button
          onClick={() => setActiveSimulator('blood_genetics')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSimulator === 'blood_genetics'
              ? 'bg-teal-950/60 theme-light:bg-teal-50 border-teal-500 text-white shadow-lg shadow-teal-500/10'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <Dna className="w-5 h-5 text-teal-400 theme-light:text-teal-800" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 theme-light:text-teal-800 font-mono">
              Di truyền
            </span>
          </div>
          <div className="text-xs font-bold mt-2">10. Nhóm máu men-đen</div>
        </button>
      </div>

      <ActiveSimulator />
    </div>
  )
}

// SIMULATOR 9: TDEE & MACRO — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { calculateTdeeAndMacro } from '../../../../lib/simulators'

export function TdeeMacro() {
  const [userWeight, setUserWeight] = useState(65)
  const [userHeight, setUserHeight] = useState(170)
  const [userAge, setUserAge] = useState(24)
  const [userGender, setUserGender] = useState<'male' | 'female'>('male')
  const [userActivity, setUserActivity] = useState(1.375)
  const [userGoal, setUserGoal] = useState<'fat_loss' | 'maintenance' | 'muscle_gain'>('fat_loss')
  const tdeeSimResult = calculateTdeeAndMacro(
    userWeight,
    userHeight,
    userAge,
    userGender,
    userActivity,
    userGoal,
  )

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-rose-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-rose-400 theme-light:text-rose-800 flex items-center gap-2">
            <HeartPulse className="w-5 h-5" />
            Mô phỏng 9: Chuyển hóa năng lượng tế bào BMR/TDEE & phân bổ macro
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sinh học chuyển hóa lớp 10 & Khoa học dinh dưỡng giảm mỡ tăng cơ
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 theme-light:text-rose-800 font-mono font-bold">
          Mifflin-St Jeor
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="appliedknowledge-can-nang-kg" className="text-[11px] text-zinc-400">
                Cân nặng (kg)
              </label>
              <input
                id="appliedknowledge-can-nang-kg"
                type="number"
                value={userWeight}
                onChange={(e) => setUserWeight(+e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-bold"
              />
            </div>
            <div>
              <label htmlFor="appliedknowledge-chieu-cao-cm" className="text-[11px] text-zinc-400">
                Chiều cao (cm)
              </label>
              <input
                id="appliedknowledge-chieu-cao-cm"
                type="number"
                value={userHeight}
                onChange={(e) => setUserHeight(+e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-bold"
              />
            </div>
            <div>
              <label htmlFor="appliedknowledge-do-tuoi" className="text-[11px] text-zinc-400">
                Độ tuổi
              </label>
              <input
                id="appliedknowledge-do-tuoi"
                type="number"
                value={userAge}
                onChange={(e) => setUserAge(+e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setUserGender('male')}
              className={`py-2 rounded-lg text-xs font-bold border ${
                userGender === 'male'
                  ? 'bg-rose-600 text-[#fff] border-rose-400'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              Nam giới
            </button>
            <button
              onClick={() => setUserGender('female')}
              className={`py-2 rounded-lg text-xs font-bold border ${
                userGender === 'female'
                  ? 'bg-rose-600 text-[#fff] border-rose-400'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              Nữ giới
            </button>
          </div>

          <div>
            <label
              htmlFor="appliedknowledge-muc-do-van-dong-the-luc"
              className="text-[11px] text-zinc-400"
            >
              Mức độ vận động thể lực:
            </label>
            <select
              id="appliedknowledge-muc-do-van-dong-the-luc"
              value={userActivity}
              onChange={(e) => setUserActivity(+e.target.value)}
              className="w-full mt-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200"
            >
              <option value={1.2}>Ít vận động (Dân văn phòng / học sinh)</option>
              <option value={1.375}>Vận động nhẹ (Tập thể thao 1-3 buổi/tuần)</option>
              <option value={1.55}>Vận động vừa (Tập thể thao 3-5 buổi/tuần)</option>
              <option value={1.725}>Vận động nhiều (Tập nặng 6-7 buổi/tuần)</option>
            </select>
          </div>

          <div>
            <div id="fitness-goal-label" className="text-[11px] text-zinc-400">
              Mục tiêu thể hình:
            </div>
            <div
              role="group"
              aria-labelledby="fitness-goal-label"
              className="grid grid-cols-3 gap-1.5 mt-1"
            >
              {(['fat_loss', 'maintenance', 'muscle_gain'] as const).map((g) => (
                <button
                  key={g}
                  aria-pressed={userGoal === g}
                  onClick={() => setUserGoal(g)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border transition ${
                    userGoal === g
                      ? 'bg-rose-600 text-[#fff] border-rose-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {g === 'fat_loss' ? 'Giảm mỡ' : g === 'maintenance' ? 'Giữ cân' : 'Tăng cơ'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Calo mục tiêu mỗi ngày:</div>
            <div className="text-3xl font-black text-rose-400 theme-light:text-rose-800 mt-1">
              {tdeeSimResult.targetCalories.toLocaleString()} kcal
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              (BMR chuyển hóa cơ bản: {tdeeSimResult.bmr} kcal | TDEE duy trì: {tdeeSimResult.tdee}{' '}
              kcal)
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center">
            <div className="p-2 rounded-lg bg-blue-950/40 theme-light:bg-blue-50 border border-blue-500/30">
              <div className="text-[11px] text-blue-300 theme-light:text-blue-800">
                Đạm (Protein)
              </div>
              <div className="text-sm font-bold text-blue-400 theme-light:text-blue-800">
                {tdeeSimResult.proteinGrams}g
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-950/40 theme-light:bg-amber-50 border border-amber-500/30">
              <div className="text-[11px] text-amber-300 theme-light:text-amber-800">
                Đường bột (Carb)
              </div>
              <div className="text-sm font-bold text-amber-400 theme-light:text-amber-800">
                {tdeeSimResult.carbGrams}g
              </div>
            </div>
            <div className="p-2 rounded-lg bg-rose-950/40 theme-light:bg-rose-50 border border-rose-500/30">
              <div className="text-[11px] text-rose-300 theme-light:text-rose-800">
                Chất béo (Fat)
              </div>
              <div className="text-sm font-bold text-rose-400 theme-light:text-rose-800">
                {tdeeSimResult.fatGrams}g
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

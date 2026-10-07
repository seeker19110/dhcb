// SIMULATOR 10: BLOOD GENETICS — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { Dna } from 'lucide-react'
import { predictOffspringBloodTypes, type BloodType } from '../../../../lib/simulators'

export function BloodGenetics() {
  const [fatherBlood, setFatherBlood] = useState<BloodType>('A')
  const [motherBlood, setMotherBlood] = useState<BloodType>('B')
  const bloodSimResult = predictOffspringBloodTypes(fatherBlood, motherBlood)

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-teal-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-teal-400 theme-light:text-teal-800 flex items-center gap-2">
            <Dna className="w-5 h-5" />
            Mô phỏng 10: Di truyền học Men-đen & dự đoán nhóm máu đời con
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sinh học di truyền lớp 12 & ứng dụng y học huyết học
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 theme-light:text-teal-800 font-mono font-bold">
          $I^A, I^B, I^O$ Alleles
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div id="blood-father-label" className="text-xs text-zinc-400">
              Nhóm máu của Bố:
            </div>
            <div
              role="group"
              aria-labelledby="blood-father-label"
              className="grid grid-cols-4 gap-2 mt-1"
            >
              {(['A', 'B', 'AB', 'O'] as BloodType[]).map((type) => (
                <button
                  key={type}
                  aria-pressed={fatherBlood === type}
                  onClick={() => setFatherBlood(type)}
                  className={`py-2 rounded-lg text-xs font-bold border transition ${
                    fatherBlood === type
                      ? 'bg-teal-600 text-[#fff] border-teal-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Loại {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div id="blood-mother-label" className="text-xs text-zinc-400">
              Nhóm máu của Mẹ:
            </div>
            <div
              role="group"
              aria-labelledby="blood-mother-label"
              className="grid grid-cols-4 gap-2 mt-1"
            >
              {(['A', 'B', 'AB', 'O'] as BloodType[]).map((type) => (
                <button
                  key={type}
                  aria-pressed={motherBlood === type}
                  onClick={() => setMotherBlood(type)}
                  className={`py-2 rounded-lg text-xs font-bold border transition ${
                    motherBlood === type
                      ? 'bg-teal-600 text-[#fff] border-teal-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Loại {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Xác suất nhóm máu thế hệ con:</div>
            <div className="space-y-2 mt-3">
              {bloodSimResult.map((res) => (
                <div key={res.bloodType} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Nhóm máu {res.bloodType}</span>
                    <span className="text-teal-400 theme-light:text-teal-800">
                      {res.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 transition-[width] duration-500"
                      style={{ width: `${res.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-400 bg-teal-950/30 theme-light:bg-teal-50 p-2.5 rounded-lg border border-teal-500/20">
            🧬 <strong>Quy luật Men-đen:</strong> $I^A$ và $I^B$ là các allele đồng trội, còn $I^O$
            là allele lặn. Người nhóm máu O bắt buộc phải nhận 2 allele $I^O$ từ cả bố và mẹ!
          </div>
        </div>
      </div>
    </div>
  )
}

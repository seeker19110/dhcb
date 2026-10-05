// SIMULATOR 8: PH SCALE — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { Activity } from 'lucide-react'
import { COMMON_PH_ITEMS, getPhComparison } from '../../../../lib/simulators'

export function PhScale() {
  const [selectedPh1, setSelectedPh1] = useState(1.5)
  const [selectedPh2, setSelectedPh2] = useState(7.0)
  const phDifferenceRatio = getPhComparison(selectedPh1, selectedPh2)

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-indigo-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-indigo-400 theme-light:text-indigo-800 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Mô Phỏng 8: Thang Đo pH & Nồng Độ Ion [H+] = 10^(-pH)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hóa học lớp 11 & cơ chế trung hòa axit dịch vị dạ dày
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800 font-mono font-bold">
          Logarithmic Scale
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div id="ph-compare-label" className="text-xs text-zinc-400 font-semibold">
            Chọn Chất A và Chất B để so sánh nồng độ ion axit [H+]:
          </div>
          <div role="group" aria-labelledby="ph-compare-label" className="space-y-1.5">
            {COMMON_PH_ITEMS.map((item) => (
              <div
                key={item.name}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between"
              >
                <div className="text-xs font-medium text-zinc-300">{item.name}</div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      item.ph < 4
                        ? 'bg-red-500/20 text-red-400 theme-light:text-red-800'
                        : item.ph < 7
                          ? 'bg-amber-500/20 text-amber-300 theme-light:text-amber-800'
                          : item.ph === 7
                            ? 'bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-800'
                            : 'bg-cyan-500/20 text-cyan-300 theme-light:text-cyan-800'
                    }`}
                  >
                    pH {item.ph}
                  </span>
                  <button
                    onClick={() => setSelectedPh1(item.ph)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                      selectedPh1 === item.ph
                        ? 'bg-indigo-600 text-[#fff] border-indigo-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    Chất A
                  </button>
                  <button
                    onClick={() => setSelectedPh2(item.ph)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                      selectedPh2 === item.ph
                        ? 'bg-purple-600 text-[#fff] border-purple-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    Chất B
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">
              Chênh lệch nồng độ axit giữa Chất A (pH {selectedPh1}) và Chất B (pH {selectedPh2}):
            </div>
            <div className="text-3xl font-black text-indigo-400 theme-light:text-indigo-800 mt-2">
              {phDifferenceRatio.toLocaleString()} lần
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Chênh lệch |{selectedPh1} - {selectedPh2}| ={' '}
              {Math.abs(selectedPh1 - selectedPh2).toFixed(1)} đơn vị pH tương đương chênh lệch nồng
              độ ion [H+] gấp 10^
              {Math.abs(selectedPh1 - selectedPh2).toFixed(1)}.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/30 theme-light:bg-indigo-50 border border-indigo-500/20 text-xs text-zinc-300">
            💡 <strong>Nguyên lý Logarit:</strong> Vì thang đo pH là hàm logarit cơ số 10
            (-log[H+]), mỗi bước nhảy 1 đơn vị pH là nồng độ ion axit thay đổi gấp{' '}
            <strong>10 lần</strong>!
          </div>
        </div>
      </div>
    </div>
  )
}

// SIMULATOR 2: COMPOUND INTEREST — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { calculateCompoundInterest } from '../../../../lib/simulators'

export function CompoundInterest() {
  const [ciInitial, setCiInitial] = useState(10000000)
  const [ciMonthly, setCiMonthly] = useState(3000000)
  const [ciRate, setCiRate] = useState(10)
  const [ciInflation, setCiInflation] = useState(4)
  const [ciYears, setCiYears] = useState(10)
  const compoundSimResult = calculateCompoundInterest(
    ciInitial,
    ciMonthly,
    ciRate,
    ciInflation,
    ciYears,
  )

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-emerald-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-emerald-400 theme-light:text-emerald-800 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Mô Phỏng 2: Sức Mạnh Lãi Kép Cấp Số Nhân & Kế Hoạch FIRE ($A = P(1+r)^n$)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Toán Đại Số Lớp 11 & Chiến lược Tự Do Tài Chính (FIRE)
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-800 font-mono font-bold">
          Exponential Growth
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Vốn ban đầu ($P$):</span>
              <span className="font-bold text-zinc-200">
                {(ciInitial / 1000000).toFixed(0)} Triệu đ
              </span>
            </div>
            <input
              type="range"
              aria-label="Vốn ban đầu (P)"
              min="0"
              max="100000000"
              step="5000000"
              value={ciInitial}
              onChange={(e) => setCiInitial(+e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Tích lũy định kỳ mỗi tháng ($PMT$):</span>
              <span className="font-bold text-zinc-200">
                {(ciMonthly / 1000000).toFixed(1)} Triệu đ / tháng
              </span>
            </div>
            <input
              type="range"
              aria-label="Tích lũy định kỳ mỗi tháng (PMT)"
              min="500000"
              max="20000000"
              step="500000"
              value={ciMonthly}
              onChange={(e) => setCiMonthly(+e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Lãi suất đầu tư hàng năm kỳ vọng ($r$):</span>
              <span className="font-bold text-zinc-200">{ciRate}% / năm</span>
            </div>
            <input
              type="range"
              aria-label="Lãi suất đầu tư hàng năm kỳ vọng (r)"
              min="4"
              max="18"
              step="0.5"
              value={ciRate}
              onChange={(e) => setCiRate(+e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Tỷ lệ lạm phát kỳ vọng/năm ($i$):</span>
              <span className="font-bold text-zinc-200">{ciInflation}% / năm</span>
            </div>
            <input
              type="range"
              aria-label="Tỷ lệ lạm phát kỳ vọng/năm (i)"
              min="2"
              max="8"
              step="0.5"
              value={ciInflation}
              onChange={(e) => setCiInflation(+e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Số năm đầu tư ($n$):</span>
              <span className="font-bold text-zinc-200">{ciYears} năm</span>
            </div>
            <input
              type="range"
              aria-label="Số năm đầu tư (n)"
              min="3"
              max="30"
              step="1"
              value={ciYears}
              onChange={(e) => setCiYears(+e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Tổng tài sản tích lũy sau {ciYears} năm:</div>
            <div className="text-2xl font-black text-emerald-400 theme-light:text-emerald-800 mt-1">
              {(compoundSimResult.totalWealth / 1000000).toFixed(1)} Triệu đ
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Giá trị quy đổi sức mua (đã trừ lạm phát {ciInflation}%):{' '}
              <span className="font-bold text-zinc-300">
                {(compoundSimResult.realWealth / 1000000).toFixed(1)} Tr đ
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
            <div className="p-2.5 rounded-lg bg-zinc-900">
              <div className="text-[11px] text-zinc-400">Tiền túi bạn nộp vào:</div>
              <div className="text-sm font-bold text-zinc-300">
                {(compoundSimResult.totalContributed / 1000000).toFixed(1)} Tr đ
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/40 theme-light:bg-emerald-50 border border-emerald-500/30">
              <div className="text-[11px] text-emerald-400 theme-light:text-emerald-800">
                Tiền lãi kép đẻ ra:
              </div>
              <div className="text-sm font-bold text-emerald-300 theme-light:text-emerald-800">
                +{(compoundSimResult.totalInterest / 1000000).toFixed(1)} Tr đ
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-400 bg-emerald-950/30 theme-light:bg-emerald-50 p-2.5 rounded-lg border border-emerald-500/20">
            📈 <strong>Nhận định:</strong> Tiền lãi chiếm{' '}
            <span className="font-bold text-emerald-300 theme-light:text-emerald-800">
              {((compoundSimResult.totalInterest / compoundSimResult.totalWealth) * 100).toFixed(0)}
              %
            </span>{' '}
            tổng tài sản của bạn nhờ thời gian $n$ tạo đà số mũ!
          </div>
        </div>
      </div>
    </div>
  )
}

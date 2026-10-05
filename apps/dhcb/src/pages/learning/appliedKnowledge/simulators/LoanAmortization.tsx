// SIMULATOR 3: LOAN AMORTIZATION — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { calculateLoanAmortization } from '../../../../lib/simulators'

export function LoanAmortization() {
  const [loanAmount, setLoanAmount] = useState(1000000000)
  const [loanRate, setLoanRate] = useState(9.5)
  const [loanYears, setLoanYears] = useState(20)
  const loanSimResult = calculateLoanAmortization(loanAmount, loanRate, loanYears)

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-amber-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-amber-400 theme-light:text-amber-800 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Mô phỏng 3: Trả góp khoản vay mua nhà / xe theo dư nợ giảm dần
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Toán tài chính & phương thức tính toán của hệ thống Ngân hàng
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 theme-light:text-amber-800 font-mono font-bold">
          Loan Amortization
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Số tiền vay ngân hàng:</span>
              <span className="font-bold text-zinc-200">
                {(loanAmount / 1000000000).toFixed(2)} Tỷ đồng
              </span>
            </div>
            <input
              type="range"
              aria-label="Số tiền vay ngân hàng"
              min="200000000"
              max="5000000000"
              step="100000000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(+e.target.value)}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Lãi suất vay ưu đãi/năm:</span>
              <span className="font-bold text-zinc-200">{loanRate}% / năm</span>
            </div>
            <input
              type="range"
              aria-label="Lãi suất vay ưu đãi/năm"
              min="5"
              max="16"
              step="0.25"
              value={loanRate}
              onChange={(e) => setLoanRate(+e.target.value)}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Thời hạn vay:</span>
              <span className="font-bold text-zinc-200">{loanYears} năm</span>
            </div>
            <input
              type="range"
              aria-label="Thời hạn vay"
              min="3"
              max="30"
              step="1"
              value={loanYears}
              onChange={(e) => setLoanYears(+e.target.value)}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Số tiền phải trả cố định mỗi tháng:</div>
            <div className="text-2xl font-black text-amber-400 theme-light:text-amber-800 mt-1">
              {(loanSimResult.monthlyPayment / 1000000).toFixed(2)} Triệu đ / tháng
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Tháng đầu: Gốc {(loanSimResult.firstMonthPrincipal / 1000000).toFixed(2)} Tr + Lãi{' '}
              {(loanSimResult.firstMonthInterest / 1000000).toFixed(2)} Tr
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
            <div className="p-2.5 rounded-lg bg-zinc-900">
              <div className="text-[11px] text-zinc-400">Tổng tiền trả gốc + lãi:</div>
              <div className="text-sm font-bold text-zinc-300">
                {(loanSimResult.totalPayment / 1000000000).toFixed(2)} Tỷ đ
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/40 theme-light:bg-rose-50 border border-rose-500/30">
              <div className="text-[11px] text-rose-400 theme-light:text-rose-800">
                Tổng lãi trả cho NH:
              </div>
              <div className="text-sm font-bold text-rose-300 theme-light:text-rose-800">
                {(loanSimResult.totalInterestPaid / 1000000000).toFixed(2)} Tỷ đ
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-400 bg-amber-950/30 theme-light:bg-amber-50 p-2.5 rounded-lg border border-amber-500/20">
            💡 <strong>Kinh nghiệm vay:</strong> Kéo dài thời gian vay làm giảm áp lực trả tháng
            nhưng tổng tiền lãi trả cho ngân hàng có thể gần bằng số tiền gốc ban đầu!
          </div>
        </div>
      </div>
    </div>
  )
}

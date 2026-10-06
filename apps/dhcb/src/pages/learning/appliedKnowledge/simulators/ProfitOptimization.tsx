// SIMULATOR 1: PROFIT OPTIMIZATION — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { calculateProfitOptimization } from '../../../../lib/simulators'

export function ProfitOptimization() {
  const [simFixedCost, setSimFixedCost] = useState(1000000)
  const [simUnitCost, setSimUnitCost] = useState(15000)
  const [simBaseDemand, setSimBaseDemand] = useState(500)
  const [simElasticity, setSimElasticity] = useState(0.005)
  const profitSimResult = calculateProfitOptimization(
    simFixedCost,
    simUnitCost,
    simBaseDemand,
    simElasticity,
    10000,
    150000,
  )

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-blue-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-blue-400 theme-light:text-blue-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Mô Phỏng 1: Tối Ưu Hóa Giá Bán Bằng Đạo Hàm Bậc 1 ($P'(x) = 0$)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Toán giải tích lớp 12 & ứng dụng trong Dynamic Pricing của Grab, Shopee, Airlines
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 theme-light:text-blue-800 font-mono font-bold">
          Max Profit
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Chi phí cố định mặt bằng & nhân công ($F$):</span>
              <span className="font-bold text-zinc-200">
                {(simFixedCost / 1000000).toFixed(1)} Triệu đ / ngày
              </span>
            </div>
            <input
              type="range"
              aria-label="Chi phí cố định mặt bằng và nhân công (F)"
              min="200000"
              max="5000000"
              step="100000"
              value={simFixedCost}
              onChange={(e) => setSimFixedCost(+e.target.value)}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Giá vốn mỗi đơn vị sản phẩm ($c$):</span>
              <span className="font-bold text-zinc-200">{simUnitCost.toLocaleString()} đ</span>
            </div>
            <input
              type="range"
              aria-label="Giá vốn mỗi đơn vị sản phẩm (c)"
              min="5000"
              max="50000"
              step="1000"
              value={simUnitCost}
              onChange={(e) => setSimUnitCost(+e.target.value)}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Lượng khách cơ sở ở giá vốn ($Q_0$):</span>
              <span className="font-bold text-zinc-200">{simBaseDemand} khách / ngày</span>
            </div>
            <input
              type="range"
              aria-label="Lượng khách cơ sở ở giá vốn (Q 0)"
              min="100"
              max="1500"
              step="50"
              value={simBaseDemand}
              onChange={(e) => setSimBaseDemand(+e.target.value)}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Độ nhạy giá của khách hàng (Elasticity $k$):</span>
              <span className="font-bold text-zinc-200">
                Mất {(simElasticity * 1000).toFixed(1)} khách / tăng 1k
              </span>
            </div>
            <input
              type="range"
              aria-label="Độ nhạy giá của khách hàng (Elasticity k)"
              min="0.001"
              max="0.015"
              step="0.001"
              value={simElasticity}
              onChange={(e) => setSimElasticity(+e.target.value)}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Results Display */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">Giá bán tối ưu toán học:</div>
            <div className="text-2xl font-black text-blue-400 theme-light:text-blue-800 mt-1">
              {profitSimResult.optimalPrice.toLocaleString()} đ / ly
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Dự kiến bán ra:{' '}
              <span className="font-bold text-zinc-300">{profitSimResult.unitsSold} đơn</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
            <div className="p-2.5 rounded-lg bg-zinc-900">
              <div className="text-[0.6875rem] text-zinc-400">Doanh thu dự kiến:</div>
              <div className="text-sm font-bold text-zinc-200">
                {(profitSimResult.totalRevenue / 1000000).toFixed(2)} Tr đ
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/40 theme-light:bg-emerald-50 border border-emerald-500/30">
              <div className="text-[0.6875rem] text-emerald-400 theme-light:text-emerald-800">
                Lợi nhuận ròng MAX:
              </div>
              <div className="text-sm font-bold text-emerald-300 theme-light:text-emerald-800">
                {(profitSimResult.maxProfit / 1000000).toFixed(2)} Tr đ
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-400 bg-blue-950/30 theme-light:bg-blue-50 p-2.5 rounded-lg border border-blue-500/20">
            💡 <strong>Nguyên lý Đạo hàm:</strong> Lợi nhuận $P(x) = (x - c)(Q_0 - k(x - c)) - F$.
            Đạo hàm triệt tiêu $P'(x) = 0$ tại chênh lệch giá $x - c = Q_0 / (2k)$.
          </div>
        </div>
      </div>
    </div>
  )
}

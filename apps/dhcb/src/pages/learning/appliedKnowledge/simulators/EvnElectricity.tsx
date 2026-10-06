// SIMULATOR 4: EVN ELECTRICITY — tách từ AppliedKnowledge.tsx (2026-09-06, phương án A: state nằm trong simulator,
// đổi sang simulator khác rồi quay lại → giá trị về mặc định).
import { useState } from 'react'
import { Zap } from 'lucide-react'
import { calculateEvnElectricityBill } from '../../../../lib/simulators'

export function EvnElectricity() {
  const [acHours, setAcHours] = useState(8)
  const [acTemp, setAcTemp] = useState(20)
  const [heaterMins, setHeaterMins] = useState(30)
  const [pcHours, setPcHours] = useState(8)
  const [otherKwh, setOtherKwh] = useState(80)
  const evnSimResult = calculateEvnElectricityBill(acHours, acTemp, heaterMins, pcHours, otherKwh)

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-yellow-500/40 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-yellow-400 theme-light:text-yellow-800 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Mô Phỏng 4: Công Suất Điện & Tối Ưu Hóa Đơn EVN 6 Bậc ($A = P \\cdot t$)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Vật lý điện học lớp 9 & biểu giá điện bậc thang sinh hoạt EVN
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-yellow-500/20 text-yellow-300 theme-light:text-yellow-800 font-mono font-bold">
          6-Tier EVN
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Thời gian bật điều hòa:</span>
              <span className="font-bold text-zinc-200">{acHours} giờ / ngày</span>
            </div>
            <input
              type="range"
              aria-label="Thời gian bật điều hòa"
              min="0"
              max="24"
              step="1"
              value={acHours}
              onChange={(e) => setAcHours(+e.target.value)}
              className="w-full accent-yellow-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Nhiệt độ cài đặt điều hòa:</span>
              <span
                className={`font-bold ${
                  acTemp <= 21
                    ? 'text-red-400 theme-light:text-red-800'
                    : acTemp <= 25
                      ? 'text-yellow-300 theme-light:text-yellow-800'
                      : 'text-emerald-400 theme-light:text-emerald-800'
                }`}
              >
                {acTemp}°C {acTemp >= 26 ? '(Rất tiết kiệm)' : '(Rất ngốn điện)'}
              </span>
            </div>
            <input
              type="range"
              aria-label="Nhiệt độ cài đặt điều hòa"
              min="18"
              max="29"
              step="1"
              value={acTemp}
              onChange={(e) => setAcTemp(+e.target.value)}
              className="w-full accent-yellow-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Thời gian bật bình nóng lạnh:</span>
              <span className="font-bold text-zinc-200">{heaterMins} phút / ngày</span>
            </div>
            <input
              type="range"
              aria-label="Thời gian bật bình nóng lạnh"
              min="0"
              max="120"
              step="10"
              value={heaterMins}
              onChange={(e) => setHeaterMins(+e.target.value)}
              className="w-full accent-yellow-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Sử dụng máy tính / TV:</span>
              <span className="font-bold text-zinc-200">{pcHours} giờ / ngày</span>
            </div>
            <input
              type="range"
              aria-label="Sử dụng máy tính / TV"
              min="0"
              max="16"
              step="1"
              value={pcHours}
              onChange={(e) => setPcHours(+e.target.value)}
              className="w-full accent-yellow-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Tủ lạnh, đèn & thiết bị khác:</span>
              <span className="font-bold text-zinc-200">{otherKwh} kWh / tháng</span>
            </div>
            <input
              type="range"
              aria-label="Tủ lạnh, đèn và thiết bị khác"
              min="30"
              max="200"
              step="10"
              value={otherKwh}
              onChange={(e) => setOtherKwh(+e.target.value)}
              className="w-full accent-yellow-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-400">
              Tổng điện năng tiêu thụ:{' '}
              <span className="font-bold text-yellow-300 theme-light:text-yellow-800">
                {evnSimResult.totalKwh} kWh / tháng
              </span>
            </div>
            <div className="text-2xl font-black text-yellow-400 theme-light:text-yellow-800 mt-1">
              {evnSimResult.totalBill.toLocaleString()} đ / tháng
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              (Đã gồm 8% thuế VAT: {evnSimResult.vat.toLocaleString()} đ)
            </div>
          </div>

          {evnSimResult.acSavingPotentialMoney > 0 && (
            <div className="p-3 rounded-lg bg-emerald-950/40 theme-light:bg-emerald-50 border border-emerald-500/30 text-xs text-emerald-300 theme-light:text-emerald-800">
              🌿 <strong>Giải pháp tiết kiệm:</strong> Nếu tăng điều hòa lên 26°C kèm quạt, bạn sẽ
              cắt giảm được <strong>{evnSimResult.acSavingPotentialKwh} kWh</strong> điện và tiết
              kiệm <strong>{evnSimResult.acSavingPotentialMoney.toLocaleString()} đ / tháng</strong>
              !
            </div>
          )}

          <div className="text-xs text-zinc-400 bg-yellow-950/30 theme-light:bg-yellow-50 p-2.5 rounded-lg border border-yellow-500/20">
            ⚡ <strong>Bản chất:</strong> Giá điện tính theo lũy tiến (Bậc 6 lên đến 3.151 đ/kWh).
            Càng dùng nhiều thì các số điện cuối càng phải trả ở mức giá đắt gấp đôi bậc 1!
          </div>
        </div>
      </div>
    </div>
  )
}

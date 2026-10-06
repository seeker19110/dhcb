import { useState } from 'react'
import { getRatePref, setRatePref, type Rate } from '../lib/tts'

const RATES: Rate[] = [0.75, 1, 1.25]

// Pill toggle chọn tốc độ phát TOÀN CỤC — bấm vào 1 trong 3 mức để đổi ngay.
export default function RateToggle() {
  const [rate, setRate] = useState<Rate>(getRatePref())

  function choose(r: Rate) {
    setRate(r)
    setRatePref(r)
  }

  return (
    <div
      role="group"
      title="Chọn tốc độ phát (áp dụng cho cả app)"
      className="tap-44-y flex rounded-full bg-zinc-800 text-[0.6875rem] leading-none shrink-0"
    >
      {/* [U9a, M20] Mỗi mức là một đích chạm 44×44 (trước đây cao 40px, mức "1×" chỉ rộng
          28px). Bỏ đệm `p-0.5` của khung để cụm không cao quá 44px. */}
      {RATES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => choose(r)}
          className={`tap-44 flex items-center justify-center px-2 rounded-full transition cursor-pointer ${
            rate === r
              ? 'bg-accent-500/30 text-accent-300 theme-light:text-accent-800'
              : 'text-zinc-400'
          }`}
        >
          {r}×
        </button>
      ))}
    </div>
  )
}

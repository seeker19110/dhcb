// apps/dhcb/src/components/location/TripSetup.tsx — Màn hình khi CHƯA ở trong chuyến nào.
//
// Đây là màn hình quyết định người dùng có dùng tính năng này không. Nó phải trả lời được ba
// câu hỏi, theo đúng thứ tự người ta nghĩ:
//   1. "Tôi đang dở chuyến nào không?" → danh sách chuyến đang mở nằm TRÊN CÙNG. Người quay lại
//      app giữa buổi đi chơi cần vào tiếp, chứ không phải tạo chuyến mới.
//   2. "Bật cái này có bị theo dõi không?" → ba cam kết riêng tư nằm ngay dưới tiêu đề, bằng chữ
//      thường, không giấu trong "điều khoản". Đây là tính năng chia sẻ vị trí — lòng tin là rào
//      cản lớn nhất, nên nói trước, không nói sau.
//   3. "Bắt đầu kiểu gì?" → tạo chuyến mới, hoặc vào bằng mã bạn gửi.

import { useState } from 'react'
import { Clock, EyeOff, MapPinOff, Users } from 'lucide-react'
import { formatRemaining } from '../../lib/locationFormat'
import type { SessionSummary } from '../../lib/locationShare'
import { buttonClass } from '@core/buttonStyles'

const DURATIONS: { value: 60 | 240 | 480; label: string }[] = [
  { value: 60, label: '1 giờ' },
  { value: 240, label: '4 giờ' },
  { value: 480, label: '8 giờ' },
]

/** Ba lời hứa riêng tư — nói bằng ngôn ngữ hậu quả, không phải ngôn ngữ kỹ thuật. */
const PROMISES = [
  { icon: Clock, text: 'Tự tắt khi hết giờ, không có chế độ chia sẻ vĩnh viễn' },
  { icon: MapPinOff, text: 'Không lưu lịch sử hành trình — không ai dựng lại được đường bạn đi' },
  { icon: EyeOff, text: 'Bấm tắt là vị trí bị xoá khỏi máy chủ ngay, không phải chỉ ẩn đi' },
]

interface Props {
  sessions: SessionSummary[]
  onOpen: (sessionId: string) => void
  onCreate: (name: string, durationMinutes: 60 | 240 | 480) => void
  onJoin: (code: string) => void
  busy?: boolean
}

export default function TripSetup({ sessions, onOpen, onCreate, onJoin, busy = false }: Props) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState<60 | 240 | 480>(240)
  const [code, setCode] = useState('')

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {PROMISES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm text-zinc-200">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-accent-400 theme-light:text-accent-700"
              aria-hidden="true"
            />
            {text}
          </li>
        ))}
      </ul>

      {sessions.length > 0 && (
        <section className="rounded-2xl border border-accent-500/40 bg-accent-500/10 p-4">
          <h2 className="mb-3 text-lg font-bold text-zinc-100">Chuyến đang mở của bạn</h2>
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <button
                  type="button"
                  onClick={() => onOpen(session.sessionId)}
                  className="tap-44 flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-3 py-2 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-zinc-100">
                      {session.name}
                    </span>
                    <span className="block text-sm text-zinc-300">
                      <Users className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                      {session.memberCount} người · {formatRemaining(session.expiresAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-accent-400 theme-light:text-accent-700">
                    Vào tiếp
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-bold text-zinc-100">Tạo chuyến mới</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onCreate(name.trim(), duration)
            setName('')
          }}
        >
          <label className="mb-1.5 block text-sm text-zinc-200" htmlFor="trip-name">
            Tên chuyến
          </label>
          <input
            id="trip-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="VD: Đi cà phê Bờ Hồ"
            className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-[1rem] text-zinc-100 placeholder:text-zinc-500"
          />

          <fieldset className="mb-4">
            <legend className="mb-1.5 text-sm text-zinc-200">Tự tắt sau</legend>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  aria-pressed={duration === d.value}
                  className={`tap-44 flex-1 rounded-xl px-3 font-semibold ${
                    duration === d.value
                      ? 'bg-accent-500 text-[#09090b]'
                      : 'border border-zinc-700 text-zinc-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={busy || name.trim().length === 0}
            className={buttonClass({ fullWidth: true })}
          >
            Tạo chuyến
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-1 text-lg font-bold text-zinc-100">Vào chuyến bằng mã mời</h2>
        <p className="mb-3 text-sm text-zinc-200">
          Bạn bè gửi bạn mã 6 ký tự hoặc một đường link — mở link là vào thẳng, không cần nhập.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onJoin(code)
            setCode('')
          }}
        >
          <label className="sr-only" htmlFor="invite-code">
            Mã mời
          </label>
          <input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoComplete="off"
            placeholder="K7M2QP"
            className="w-full min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-center text-[1.25rem] font-bold uppercase tracking-[0.3em] text-zinc-100 placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className="tap-44 shrink-0 rounded-xl border border-zinc-700 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors px-4 font-semibold text-zinc-100 disabled:opacity-50"
          >
            Vào
          </button>
        </form>
      </section>
    </div>
  )
}

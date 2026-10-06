import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { Check, ChevronUp, ChevronDown, Volume2 } from 'lucide-react'
import { setVoicePref, type Voice } from '../lib/tts'
import { VOICE_OPTIONS, getAllowedVoices } from '../lib/voiceTiers'
import type { Plan } from '../types'

interface Props {
  voice: Voice
  gender: 'female' | 'male'
  label: string // vd: "A" / "B" — vai đang nói giọng này
  isA: boolean
  plan: Plan
  onChange: (voice: Voice) => void
  onSet?: () => void // gọi sau khi đặt mặc định — cha dùng để tự ẩn panel sau vài giây
}

const STEP_PX = 36 // vuốt mỗi 36px đổi 1 giọng

// Khối chọn giọng lớn cho 1 vai (A/B) trong màn hội thoại 2 nhân vật — vuốt lên/xuống (hoặc
// bấm mũi tên) để đổi NGAY giọng đang phát trong số các giọng cùng giới tính mà gói hiện tại
// cho phép, cộng nút "Đặt mặc định" để lưu lại giọng này làm pref toàn cục (setVoicePref).
export default function VoiceRoleBadge({
  voice,
  gender,
  label,
  isA,
  plan,
  onChange,
  onSet,
}: Props) {
  const [justSet, setJustSet] = useState(false)
  const dragRef = useRef<{ startY: number; steps: number } | null>(null)

  const list = VOICE_OPTIONS.filter(
    (v) => v.gender === gender && getAllowedVoices(plan).includes(v.id),
  )
  const idx = Math.max(
    0,
    list.findIndex((v) => v.id === voice),
  )

  function move(delta: number) {
    if (list.length === 0) return
    const next = list[(idx + delta + list.length) % list.length]
    if (next) onChange(next.id)
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, steps: 0 }
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (!d) return
    const diff = e.clientY - d.startY
    const targetSteps = Math.trunc(-diff / STEP_PX)
    if (targetSteps !== d.steps) {
      move(targetSteps - d.steps)
      d.steps = targetSteps
    }
  }
  function onPointerUp() {
    dragRef.current = null
  }

  function setDefault() {
    setVoicePref(voice)
    setJustSet(true)
    setTimeout(() => setJustSet(false), 1500)
    onSet?.()
  }

  return (
    <div className="flex-1 min-w-[130px] flex flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 select-none">
      <div className="flex items-center gap-1 text-[0.6875rem] text-zinc-500">
        <Volume2 className="w-3 h-3" />
        {label} · {gender === 'female' ? (isA ? 'Nữ' : 'Female') : isA ? 'Nam' : 'Male'}
      </div>

      <button
        type="button"
        onClick={() => move(-1)}
        aria-label={isA ? 'Giọng trước' : 'Previous voice'}
        className="text-zinc-500 hover:text-zinc-200 transition"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-full text-center py-1 cursor-ns-resize touch-none"
        title={isA ? 'Vuốt lên/xuống để đổi giọng' : 'Swipe up/down to change voice'}
      >
        <span className="text-base font-semibold text-zinc-100">{voice}</span>
      </div>

      <button
        type="button"
        onClick={() => move(1)}
        aria-label={isA ? 'Giọng sau' : 'Next voice'}
        className="text-zinc-500 hover:text-zinc-200 transition"
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={setDefault}
        className={`mt-0.5 px-2 py-0.5 rounded-full border text-[0.6875rem] transition ${
          justSet
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 theme-light:text-emerald-900'
            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
        }`}
      >
        {justSet ? (
          <span className="flex items-center gap-0.5">
            <Check className="w-3 h-3" /> {isA ? 'Đã đặt' : 'Set'}
          </span>
        ) : isA ? (
          'Đặt mặc định'
        ) : (
          'Set default'
        )}
      </button>
    </div>
  )
}

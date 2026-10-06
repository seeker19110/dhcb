// KaraokeText — nút loa + văn bản với từng chữ sáng lên theo giọng đọc.
// Tự quản lý trạng thái phát/dừng và word-sync, không cần state ở component cha.
//
// CHUẨN UI THỐNG NHẤT cho mọi nút loa đi kèm text:
// - Icon loa luôn nằm BÊN TRÁI văn bản, căn giữa với DÒNG ĐẦU của văn bản.
// - iconSize: 'sm' cho text ≥ 14px (text-sm / text-[15px]), 'xs' cho text-xs.
// - Với iconSize 'sm', văn bản bắt đầu ở 36px (icon w-7 + gap-2) — dòng phụ
//   (bản dịch) đặt dưới phải dùng KARAOKE_INDENT để thẳng hàng với văn bản.

import { useState, useRef } from 'react'
import { Volume2, Square } from 'lucide-react'
import { speak, stopSpeaking, getRatePref, type Voice } from '../lib/tts'

// Class thụt lề cho dòng phụ (vd bản dịch) đặt ngay dưới KaraokeText (iconSize 'sm')
// để thẳng hàng với phần văn bản: 36px = cột icon w-7 (28px) + gap-2 (8px).
export const KARAOKE_INDENT = 'pl-9'

interface Props {
  text: string
  lang: 'en-US' | 'vi-VN'
  textClass?: string // class CSS cho phần văn bản (font, màu, size...)
  buttonClass?: string // class CSS thêm vào nút container (padding, hover...)
  iconSize?: 'xs' | 'sm'
  voice?: Voice // giọng riêng cho nhân vật (vd hội thoại 2 người) — bỏ trống thì dùng giọng mặc định
  // Cho cha ĐIỀU KHIỂN trạng thái phát/từ đang đọc từ bên ngoài — dùng khi cha tự phát audio
  // tuần tự nhiều câu (vd "Phát tất cả" trong hội thoại ở RoadmapTab) để chữ vẫn sáng lên đúng
  // nhịp, thay vì im lìm vì component không biết cha đang phát. Bỏ trống (mặc định) thì component
  // tự quản lý phát/dừng khi bấm — giữ nguyên hành vi ở mọi nơi khác đang dùng component này.
  externalState?: { playing: boolean; wordIdx: number | null }
  // Chặn bấm phát audio riêng — dùng khi cha đang phát tuần tự nhiều dòng (vd "Phát tất cả" ở
  // StoryReader) để tránh người dùng bấm loa dòng khác làm chồng tiếng lên audio cha đang phát.
  disabled?: boolean
}

export default function KaraokeText({
  text,
  lang,
  textClass = 'text-sm text-zinc-300 leading-relaxed',
  buttonClass = '',
  iconSize = 'sm',
  voice,
  externalState,
  disabled = false,
}: Props) {
  const [playing, setPlaying] = useState(false)
  const [wordIdx, setWordIdx] = useState<number | null>(null)
  const wordIdxRef = useRef<number | null>(null)

  const isControlled = externalState !== undefined
  const displayPlaying = isControlled ? externalState.playing : playing
  const displayWordIdx = isControlled ? externalState.wordIdx : wordIdx

  // Chỉ setState khi từ thực sự thay đổi — ontimeupdate gọi ~4 lần/giây
  function onWord(idx: number) {
    if (wordIdxRef.current === idx) return
    wordIdxRef.current = idx
    setWordIdx(idx)
  }

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation() // tránh trigger parent nếu nằm trong nút khác
    // Cha đang điều khiển (vd giữa lúc "Phát tất cả") → bấm không tự phát audio riêng,
    // tránh chồng tiếng với audio cha đang phát.
    if (isControlled || disabled) return
    if (playing) {
      stopSpeaking()
      return
    }
    if (!text.trim()) return
    setPlaying(true)
    wordIdxRef.current = null
    setWordIdx(null)
    try {
      await speak(text, lang, voice, getRatePref(), onWord)
    } catch {
      // lỗi mạng / TTS → im lặng
    } finally {
      setPlaying(false)
      setWordIdx(null)
      wordIdxRef.current = null
    }
  }

  // Icon loa 18px (xs) / 21px (sm) — đủ lớn để thấy rõ trên mobile.
  const iSize = iconSize === 'xs' ? 'w-[1.125rem] h-[1.125rem]' : 'w-[1.3125rem] h-[1.3125rem]'
  // Cột icon: CAO ĐÚNG BẰNG dòng chữ đầu tiên (xs ≈ text-xs 18px, sm ≈ text-sm/15px 22px)
  // để icon căn giữa với dòng đầu — không lệch xuống dưới khi văn bản nhiều dòng.
  const bSize = iconSize === 'xs' ? 'w-6 h-[1.125rem]' : 'w-7 h-[1.375rem]'
  const accent = lang === 'en-US' ? 'text-accent-300' : 'text-sky-300 theme-light:text-sky-900'
  const idle =
    lang === 'en-US' ? 'text-zinc-400 hover:text-accent-400' : 'text-zinc-400 hover:text-sky-400'
  const wordHl =
    lang === 'en-US'
      ? 'bg-accent-500/20 text-accent-200 rounded px-0.5'
      : 'bg-sky-500/20 text-sky-200 theme-light:text-sky-900 rounded px-0.5'

  // Tách text thành [từ, khoảng-trắng, từ...] để giữ nguyên whitespace gốc
  const parts = text.split(/(\s+)/)
  let wi = 0

  const label = displayPlaying
    ? lang === 'en-US'
      ? 'Dừng đọc'
      : 'Stop'
    : lang === 'en-US'
      ? 'Nghe tiếng Anh'
      : 'Nghe tiếng Việt'

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      disabled={disabled && !isControlled}
      // [U9a, M20] Vùng chạm ≥ 44px trên màn chạm (`tap-44-touch-y`): câu một dòng trước đây
      // chỉ cao 22px. Nút căn GIỮA theo chiều dọc một khối con (icon + chữ, căn đầu dòng như cũ)
      // nên câu ngắn không bị dồn lên trên, câu nhiều dòng thì cao hơn 44px sẵn — không đổi.
      className={`tap-44-touch-y flex items-center text-left transition group disabled:opacity-40 ${buttonClass}`}
    >
      <span className="flex flex-1 min-w-0 items-start gap-2">
        {/* Icon loa / dừng */}
        <span
          className={`shrink-0 ${bSize} flex items-center justify-center transition
        ${displayPlaying ? accent : idle}`}
        >
          {displayPlaying ? (
            <Square className={`${iSize} fill-current`} />
          ) : (
            <Volume2 className={iSize} />
          )}
        </span>

        {/* Văn bản: từng chữ highlight đúng lúc đọc (min-w-0 để câu dài xuống dòng gọn) */}
        <span className={`min-w-0 ${textClass}`}>
          {parts.map((part, i) => {
            // Đoạn rỗng '' chỉ sinh ra ở đầu/cuối khi text có khoảng trắng thừa; bỏ qua để
            // chỉ số từ (wi) khớp với bộ đếm của audio (dùng text.trim().split ở tts.ts).
            if (part === '') return null
            if (/^\s+$/.test(part)) return <span key={i}>{part}</span>
            const thisIdx = wi++
            return (
              <span
                key={i}
                className={
                  displayPlaying && thisIdx === displayWordIdx ? wordHl : 'transition-colors'
                }
              >
                {part}
              </span>
            )
          })}
        </span>
      </span>
    </button>
  )
}

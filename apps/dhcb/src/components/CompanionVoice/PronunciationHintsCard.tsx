import { useEffect, useMemo, useState } from 'react'
import { Activity, Play, Square } from 'lucide-react'
import { findPronunciationHints } from '@dhcb/core-ai/pronunciationHints'
import { speak, stopSpeaking } from '../../lib/tts'
import { buttonClass } from '@core/buttonStyles'

// Thay "Acoustic Phonetics & GOP Lab" (changelog 0484). Bản cũ hiện "Điểm GOP", lưu loát, ngữ điệu
// dạng % gán bằng công thức cứng — không nghe giọng ai. Thẻ này chỉ GỢI Ý: trong câu mẫu có âm nào
// người Việt hay đọc nhầm, kèm mẹo đặt lưỡi/môi; KHÔNG ghi âm, KHÔNG chấm điểm.
const SAMPLE_SENTENCES = [
  'Think outside the box',
  'Three thousand feathers',
  'She sells seashells',
  'Red leather yellow leather',
] as const

export default function PronunciationHintsCard() {
  const [sentence, setSentence] = useState<string>(SAMPLE_SENTENCES[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [playError, setPlayError] = useState<string | null>(null)
  const hints = useMemo(() => findPronunciationHints(sentence), [sentence])

  // Rời thẻ thì dừng giọng đọc đang phát.
  useEffect(() => () => stopSpeaking(), [])

  const handlePlay = async () => {
    if (isPlaying) {
      stopSpeaking()
      setIsPlaying(false)
      return
    }
    setPlayError(null)
    setIsPlaying(true)
    try {
      await speak(sentence, 'en-US')
    } catch {
      setPlayError('Chưa phát được giọng mẫu. Kiểm tra loa/kết nối rồi thử lại nhé.')
    } finally {
      setIsPlaying(false)
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-surface-card p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-indigo-800/30 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 theme-light:text-indigo-800">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100">Gợi ý luyện âm</h3>
            <p className="text-xs text-zinc-400">
              Âm người Việt hay đọc nhầm trong câu mẫu, kèm mẹo đặt lưỡi và môi
            </p>
          </div>
        </div>

        <button onClick={handlePlay} className={buttonClass({ variant: 'primary' })}>
          {isPlaying ? (
            <>
              <Square className="h-4 w-4 fill-current" aria-hidden /> Dừng giọng mẫu
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" aria-hidden /> Nghe câu mẫu
            </>
          )}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SENTENCES.map((sample) => (
            <button
              key={sample}
              onClick={() => {
                stopSpeaking()
                setIsPlaying(false)
                setPlayError(null)
                setSentence(sample)
              }}
              aria-pressed={sentence === sample}
              className={`tap-44-y rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sentence === sample
                  ? 'bg-indigo-500/30 text-indigo-200 theme-light:text-indigo-800 border border-indigo-500/40'
                  : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {sample}
            </button>
          ))}
        </div>

        {playError && (
          <p role="alert" className="text-xs text-red-300 theme-light:text-red-900">
            {playError}
          </p>
        )}

        {hints.length === 0 ? (
          <p className="text-xs text-zinc-400">Câu này không có âm nào trong danh sách hay nhầm.</p>
        ) : (
          <ul className="space-y-3">
            {hints.map((hint) => (
              <li
                key={hint.key}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-1.5"
              >
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono font-bold text-sm text-indigo-200 theme-light:text-indigo-900">
                    {hint.targetIpa}
                  </span>
                  <span className="text-xs text-zinc-400">
                    trong:{' '}
                    <span className="font-semibold text-zinc-300">{hint.words.join(', ')}</span>
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{hint.diagnostic}</p>
                <p className="text-sm text-zinc-300">
                  <span className="font-semibold">Mẹo: </span>
                  {hint.drillTip}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-zinc-400">
          Gợi ý dựa trên chữ viết của câu, không nghe giọng bạn và không chấm điểm. Nghe câu mẫu rồi
          tự đọc theo, chú ý các âm ở trên.
        </p>
      </div>
    </div>
  )
}

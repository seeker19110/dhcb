import { useState, useEffect } from 'react'
import { Eye, Star } from 'lucide-react'
import WordVoiceCycleButton from './WordVoiceCycleButton'
import KaraokeText from './KaraokeText'
import PronunciationCheck from './PronunciationCheck'
import WordFormsBlock from './WordFormsBlock'
import type { ExPair } from '../data/extra-examples'
import { loadExtraExamples } from '../data/extraExamplesLoader'

// Cache module-level để không fetch lại mỗi lần component mount
let _extraCache: Record<string, [ExPair, ExPair]> | null = null
loadExtraExamples().then((d) => {
  _extraCache = d
})
import type { DictEntry } from '../types'
import { isDifficult, toggleDifficult } from '../lib/vocab'
import { haptics } from '../lib/haptics'

// ── Thẻ từ chung ─────────────────────────────────────────────────────────────
// Tách ra file riêng để cả trang Học (Learn.tsx) lẫn tab Lộ trình (RoadmapTab)
// dùng chung — giữ nguyên phần "tinh túy" (flashcard lật thẻ + phát âm + chấm).
export default function WordCard({
  card,
  isA,
  uid,
  onUpdate,
}: {
  card: DictEntry
  isA: boolean
  uid: string
  onUpdate?: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [difficult, setDifficult] = useState(() => isDifficult(uid, card.word))
  const [extraExamples, setExtraExamples] = useState<Record<string, [ExPair, ExPair]>>(
    _extraCache ?? {},
  )

  useEffect(() => {
    // Cache đã có → state đã nhận sẵn qua initializer ở trên, không cần setState
    // đồng bộ trong effect. Chỉ nạp lười khi chưa có cache (setState trong .then là async).
    if (_extraCache) return
    loadExtraExamples().then((d) => {
      _extraCache = d
      setExtraExamples(d)
    })
  }, [])

  function handleStar(e: React.MouseEvent) {
    e.stopPropagation()
    const next = toggleDifficult(uid, card.word)
    setDifficult(next)
    onUpdate?.()
  }

  return (
    <div>
      {/* Wrapper chứa nút ⭐ + thẻ lật */}
      <div className="relative mb-4">
        <button
          onClick={handleStar}
          title={
            isA
              ? difficult
                ? 'Bỏ đánh dấu khó'
                : 'Đánh dấu từ khó'
              : difficult
                ? 'Unmark'
                : 'Mark difficult'
          }
          aria-label={
            isA
              ? difficult
                ? 'Bỏ đánh dấu từ khó'
                : 'Đánh dấu từ khó'
              : difficult
                ? 'Unmark difficult word'
                : 'Mark word as difficult'
          }
          aria-pressed={difficult}
          className="tap-44 absolute top-2 right-2 z-10 p-2.5 rounded-full hover:bg-zinc-700/50 transition"
        >
          <Star
            className={`w-4 h-4 transition ${difficult ? 'fill-amber-400 text-amber-400 theme-light:text-amber-900' : 'text-zinc-400 hover:text-zinc-200'}`}
          />
        </button>

        {/* Lật thẻ 3D: 2 mặt render đồng thời trong grid overlay (cao = max 2 mặt),
            xoay rotateY 180°; reduced-motion toàn cục tắt transition → thành swap tức thì. */}
        <button
          onClick={() => {
            haptics.tap()
            setFlipped((f) => !f)
          }}
          aria-pressed={flipped}
          className="w-full flip-scene group focus-visible:outline-none"
        >
          <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
            {/* Mặt trước — từ + IPA */}
            <div
              aria-hidden={flipped}
              style={{ visibility: flipped ? 'hidden' : 'visible' }}
              className="flip-face bg-zinc-900 border border-zinc-800/80 group-hover:border-accent-500/50 shadow-xl w-full rounded-3xl p-8 sm:p-10 min-h-[220px] flex flex-col items-center justify-center text-center transition-[border-color,visibility] duration-300 relative overflow-hidden"
            >
              <span
                data-reading-content
                className="font-extrabold text-white text-3xl sm:text-4xl mb-2 tracking-tight drop-shadow-sm"
              >
                {card.word}
              </span>
              {card.ipa_en && (
                <span
                  data-reading-content
                  className="text-sm text-accent-400 font-semibold theme-light:text-accent-900 font-mono bg-accent-500/10 px-3 py-0.5 rounded-full border border-accent-500/20"
                >
                  {card.ipa_en}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mt-5 group-hover:text-zinc-200 transition-colors">
                <Eye className="w-3.5 h-3.5 text-accent-400" />{' '}
                {isA ? 'Bấm để xem nghĩa & ví dụ' : 'Tap to flip'}
              </span>
            </div>
            {/* Mặt sau — nghĩa + ví dụ (xoay sẵn 180° để hiện đúng chiều khi lật) */}
            <div
              aria-hidden={!flipped}
              data-reading-content
              style={{ visibility: flipped ? 'visible' : 'hidden' }}
              className="flip-face flip-back bg-zinc-900 border border-zinc-800/80 shadow-xl w-full rounded-3xl p-8 sm:p-10 min-h-[220px] flex flex-col items-center justify-center text-center transition-[visibility] duration-300"
            >
              <span className="text-2xl text-zinc-100 font-bold mb-2 tracking-tight">
                {card.vi}
              </span>
              {card.ex_vi && (
                <span className="text-xs font-medium text-zinc-400 mt-1">{card.ex_vi}</span>
              )}
              {extraExamples[card.word.toLowerCase()] && (
                <div className="mt-3 space-y-1.5 text-left w-full border-t border-zinc-800/80 pt-3">
                  {extraExamples[card.word.toLowerCase()]?.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/50"
                    >
                      <p className="text-xs font-medium text-accent-300 theme-light:text-accent-900 italic">
                        {ex.en}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{ex.vi}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Các dạng của từ — hiện sau khi lật thẻ để học kèm cách chia */}
      {flipped && (
        <div className="mb-3 flex justify-center">
          <div className="w-full max-w-md">
            <WordFormsBlock forms={card.forms} base={card.base} word={card.word} isA={isA} />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 mb-3">
        <div className="flex flex-row items-center gap-2">
          {/* key theo từ: buộc remount khi đổi thẻ, tránh giữ audioUrls/currentVoice cũ của
              từ trước (bug: nhãn tên giọng đổi đúng nhưng phát nhầm audio đã cache của từ cũ). */}
          <WordVoiceCycleButton
            key={isA ? card.word : card.vi}
            word={isA ? card.word : card.vi}
            lang={isA ? 'en-US' : 'vi-VN'}
            isA={isA}
          />
        </div>
        {card.ex_en && (
          <KaraokeText
            text={isA ? card.ex_en : card.ex_vi}
            lang={isA ? 'en-US' : 'vi-VN'}
            textClass="text-sm text-zinc-400 italic"
          />
        )}
      </div>

      <div className="mb-4">
        <PronunciationCheck target={isA ? card.word : card.vi} lang={isA ? 'en' : 'vi'} isA={isA} />
      </div>
    </div>
  )
}

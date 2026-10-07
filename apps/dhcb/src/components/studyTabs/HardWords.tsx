// apps/dhcb/src/components/studyTabs/HardWords.tsx — tách từ components/StudyTabs.tsx (2.071 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.
// Barrel `components/StudyTabs.tsx` re-export nên nơi dùng không đổi đường import.

import { useMemo, useState } from 'react'
import { RotateCcw, Star } from 'lucide-react'
import WordCard from '../WordCard'
import type { DictEntry } from '../../types'
import { getDifficultWords } from '../../lib/vocab'
import { getLeechWords } from '../../lib/srs'

// ── Tab Từ khó ────────────────────────────────────────────────────────────────
// Gồm từ đánh dấu ⭐ thủ công VÀ "leech" tự động (≥3 lần bấm "Quên" ở SRS) —
// cả 2 loại đều cần chú ý thêm nên gộp chung 1 danh sách.
export function HardWords({
  uid,
  isA,
  pool,
  onUpdate,
}: {
  uid: string
  isA: boolean
  pool: DictEntry[]
  onUpdate: () => void
}) {
  const [hardSet, setHardSet] = useState(() => getDifficultWords(uid))
  const leechWords = useMemo(() => getLeechWords(uid, pool), [uid, pool])
  const hardWords = useMemo(() => {
    const leechKeys = new Set(leechWords.map((w) => w.word.toLowerCase()))
    return pool.filter(
      (w) => hardSet.has(w.word.toLowerCase()) || leechKeys.has(w.word.toLowerCase()),
    )
  }, [pool, hardSet, leechWords])
  const [idx, setIdx] = useState(0)

  function refresh() {
    setHardSet(getDifficultWords(uid))
    onUpdate()
  }

  if (hardWords.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in space-y-2">
        <Star className="w-8 h-8 text-zinc-400 mx-auto" />
        <p className="text-white font-medium">
          {isA ? 'Chưa có từ khó trong phần này' : 'No difficult words here yet'}
        </p>
        <p className="text-sm text-zinc-400">
          {isA
            ? 'Bấm ⭐ trên thẻ từ để đánh dấu từ cần ôn thêm.'
            : 'Tap ⭐ on a word card to mark it as difficult.'}
        </p>
      </div>
    )
  }

  const card = hardWords[idx % hardWords.length]
  if (!card) return null // hardWords không rỗng ở nhánh này; guard để TS narrow kiểu

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
        <span>
          {isA ? `${hardWords.length} từ đã đánh dấu khó` : `${hardWords.length} difficult words`}
        </span>
        <span>
          {(idx % hardWords.length) + 1}/{hardWords.length}
        </span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full mb-4">
        <div
          className="h-full bg-amber-500 rounded-full transition-[width]"
          style={{ width: `${(((idx % hardWords.length) + 1) / hardWords.length) * 100}%` }}
        />
      </div>

      <WordCard key={card.word} card={card} isA={isA} uid={uid} onUpdate={refresh} />

      <button
        onClick={() => setIdx((i) => i + 1)}
        className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 theme-light:text-amber-900 transition py-3 rounded-xl text-sm font-medium"
      >
        <RotateCcw className="w-4 h-4" /> {isA ? 'Từ tiếp theo' : 'Next word'}
      </button>
    </div>
  )
}

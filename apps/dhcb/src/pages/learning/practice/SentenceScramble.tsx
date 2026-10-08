// apps/dhcb/src/pages/learning/practice/SentenceScramble.tsx — tách từ pages/learning/Practice.tsx (1.752 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.

import { useMemo, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speak } from '../../../lib/tts'
import type { DictEntry } from '../../../types'
import { shuffle } from '@dhcb/core-contracts/shuffle'
import { Button } from '@core/Button'
import { SESSION_SIZE, pickExampleSentences } from './shared'
import { GameResult } from './GameChrome'
import { buttonClass } from '@core/buttonStyles'

// ── 2) Sắp xếp câu — ghép các từ theo đúng thứ tự ──────────────────────────
function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?"']/g, '')
    .trim()
}

export function SentenceScramble({
  pool,
  isA,
  uiLang,
  onExit,
}: {
  pool: DictEntry[]
  isA: boolean
  uiLang: 'vi' | 'en'
  onExit: () => void
}) {
  const isUiVi = uiLang === 'vi'
  const sentences = useMemo(() => pickExampleSentences(pool, isA, 4, 8, SESSION_SIZE), [pool, isA])

  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [built, setBuilt] = useState<string[]>([])

  const target = sentences[idx]

  // Sang câu mới (target đổi) → xáo lại ngân hàng từ + xóa phần đã ghép — pattern
  // so-sánh-prev ngay trong render, thay cho setState đồng bộ trong effect.
  const [bank, setBank] = useState<string[]>(() =>
    target ? shuffle(target.trim().split(/\s+/)) : [],
  )
  const [checked, setChecked] = useState<boolean | null>(null)
  const [prevTarget, setPrevTarget] = useState(target)
  if (target !== prevTarget) {
    setPrevTarget(target)
    if (target) {
      setBank(shuffle(target.trim().split(/\s+/)))
      setBuilt([])
      setChecked(null)
    }
  }

  if (sentences.length < 3) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">
        {isUiVi ? 'Chưa đủ câu ví dụ phù hợp để sắp xếp.' : 'Not enough example sentences yet.'}
      </p>
    )
  }

  if (idx >= sentences.length || !target) {
    return (
      <GameResult
        score={score}
        total={sentences.length}
        uiLang={uiLang}
        onRetry={() => {
          setIdx(0)
          setScore(0)
        }}
        onExit={onExit}
      />
    )
  }

  function tapBank(word: string, i: number) {
    if (checked) return
    setBuilt((b) => [...b, word])
    setBank((b) => b.filter((_, j) => j !== i))
  }

  function tapBuilt(i: number) {
    if (checked) return
    const word = built[i]
    if (word === undefined) return
    setBank((b) => [...b, word])
    setBuilt((b) => b.filter((_, j) => j !== i))
  }

  function check() {
    const ok = normalizeForCompare(built.join(' ')) === normalizeForCompare(target ?? '')
    setChecked(ok)
    if (ok) setScore((s) => s + 1)
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-zinc-500 text-center">
        {idx + 1}/{sentences.length}
      </p>
      <div className="flex justify-center">
        <button
          onClick={() => void speak(target, isA ? 'en-US' : 'vi-VN')}
          className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
        >
          <Volume2 className="w-4 h-4" /> {isUiVi ? 'Nghe câu' : 'Listen'}
        </button>
      </div>

      <div className="min-h-14 flex flex-wrap gap-2 p-3 rounded-xl border border-zinc-700/60 bg-zinc-900/50">
        {built.length === 0 && (
          <span className="text-xs text-zinc-500">
            {isUiVi ? 'Bấm các từ bên dưới theo đúng thứ tự' : 'Tap the words below in order'}
          </span>
        )}
        {built.map((w, i) => (
          <button
            key={i}
            onClick={() => tapBuilt(i)}
            className="px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-200 text-sm font-medium border border-accent-500/30"
          >
            {w}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {bank.map((w, i) => (
          <button
            key={i}
            onClick={() => tapBank(w, i)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition"
          >
            {w}
          </button>
        ))}
      </div>

      {checked !== null && (
        <p
          className={`text-center text-sm font-medium ${checked ? 'text-emerald-400 theme-light:text-emerald-800' : 'text-rose-400 theme-light:text-rose-800'}`}
        >
          {checked
            ? isUiVi
              ? 'Chính xác! 🎉'
              : 'Correct! 🎉'
            : `${isUiVi ? 'Đáp án đúng' : 'Correct answer'}: ${target}`}
        </p>
      )}

      {checked === null ? (
        <Button onClick={check} disabled={bank.length > 0} fullWidth>
          {isUiVi ? 'Kiểm tra' : 'Check'}
        </Button>
      ) : (
        <Button onClick={() => setIdx((i) => i + 1)} fullWidth>
          {isUiVi ? 'Câu tiếp theo →' : 'Next →'}
        </Button>
      )}
    </div>
  )
}

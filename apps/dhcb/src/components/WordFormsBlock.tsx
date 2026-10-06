import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { WordForms } from '../types'
import PronounceButton from './PronounceButton'
import KaraokeText from './KaraokeText'
import { loadFormExamples } from '../data/formExamplesLoader'
import type { ExPair } from '../data/form-examples'

// Cache module-level để không fetch lại /data/form-examples.json mỗi lần component mount.
let _formExCache: Record<string, [ExPair, ExPair]> | null = null
loadFormExamples()
  .then((d) => {
    _formExCache = d
  })
  .catch(() => {
    // Lỗi mạng → không có ví dụ, phần chip dạng từ vẫn hiển thị bình thường.
  })

interface Props {
  forms?: WordForms
  base?: string // nếu entry này LÀ dạng biến thể → trỏ về từ gốc
  word: string // từ của entry hiện tại (để nhận biết dạng "không đổi")
  isA: boolean // chiều A (giải thích tiếng Việt) hay B (tiếng Anh)
  onPick?: (w: string) => void // bấm 1 dạng → tra từ đó
}

// Nhãn từng dạng biến thể theo chiều học (A: tiếng Việt · B: tiếng Anh).
const LABELS: Record<string, { vi: string; en: string }> = {
  plural: { vi: 'số nhiều', en: 'plural' },
  v3s: { vi: 'ngôi 3 (thêm -s)', en: 'he/she/it' },
  ving: { vi: 'dạng V-ing', en: '-ing form' },
  past: { vi: 'quá khứ', en: 'past' },
  pastPart: { vi: 'phân từ (V3)', en: 'past participle' },
  comparative: { vi: 'so sánh hơn', en: 'comparative' },
  superlative: { vi: 'so sánh nhất', en: 'superlative' },
}

// Thứ tự hiển thị các dạng.
const ORDER: (keyof WordForms)[] = [
  'plural',
  'v3s',
  'ving',
  'past',
  'pastPart',
  'comparative',
  'superlative',
]

export default function WordFormsBlock({ forms, base, word, isA, onPick }: Props) {
  // Ví dụ cho từng dạng (nạp lười 1 lần, dùng chung mọi nơi). Hook phải chạy TRƯỚC mọi
  // early-return bên dưới để tuân thủ quy tắc hook của React.
  const [formEx, setFormEx] = useState<Record<string, [ExPair, ExPair]>>(_formExCache ?? {})
  useEffect(() => {
    // Cache đã có → state đã nhận sẵn qua initializer ở trên, không cần setState
    // đồng bộ trong effect. Chỉ nạp lười khi chưa có cache (setState trong .then là async).
    if (_formExCache) return
    loadFormExamples()
      .then((d) => {
        _formExCache = d
        setFormEx(d)
      })
      .catch(() => {
        // Lỗi mạng → giữ formEx rỗng, chip dạng từ vẫn hiển thị bình thường.
      })
  }, [])

  // Entry là DẠNG BIẾN THỂ → chỉ hiện liên kết/chú thích về từ gốc.
  if (base) {
    const content = (
      <>
        {isA ? 'Xem từ gốc' : 'See base word'}: <span className="font-semibold">{base}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </>
    )
    const cls =
      'mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-accent-500/10 text-accent-300 theme-light:text-accent-800 border border-accent-500/30'
    return onPick ? (
      <button
        type="button"
        onClick={() => onPick(base)}
        className={`${cls} hover:bg-accent-500/20 transition`}
      >
        {content}
      </button>
    ) : (
      <span className={cls}>{content}</span>
    )
  }

  if (!forms) return null

  // Danh từ không đếm được → chỉ 1 dòng chú thích.
  if (forms.uncountable) {
    return (
      <p className="mt-2 text-[0.6875rem] text-zinc-400 italic">
        {isA ? 'Danh từ không đếm được (không có số nhiều)' : 'Uncountable noun (no plural)'}
      </p>
    )
  }

  // Gom các dạng thật sự có giá trị.
  const items = ORDER.map((key) => {
    const val = forms[key]
    if (typeof val !== 'string' || !val) return null
    return { key, val }
  }).filter((x): x is { key: keyof WordForms; val: string } => x !== null)

  if (items.length === 0) return null

  // Các dạng có kèm ví dụ (khoá `word|formKey` trong form-examples.json).
  const itemsWithEx = items
    .map(({ key, val }) => ({ key, val, examples: formEx[`${word.toLowerCase()}|${key}`] }))
    .filter(
      (x): x is { key: keyof WordForms; val: string; examples: [ExPair, ExPair] } =>
        x.examples != null,
    )

  const irregular = !!forms.irregular

  return (
    <div className="mt-2.5">
      <p className="text-[0.6875rem] text-zinc-400 mb-1.5">
        {isA ? 'Các dạng của từ' : 'Word forms'}
        {irregular && (
          <span className="ml-1.5 normal-case text-amber-400 theme-light:text-amber-900 font-medium">
            • {isA ? 'bất quy tắc' : 'irregular'}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(({ key, val }) => {
          const label = LABELS[key] ?? { vi: key, en: key }
          const unchanged = val.toLowerCase() === word.toLowerCase()
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${
                irregular ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/60'
              }`}
            >
              <span className="text-[0.6875rem] text-zinc-400">{isA ? label.vi : label.en}</span>
              {onPick ? (
                <button
                  type="button"
                  onClick={() => onPick(val)}
                  className="text-xs font-medium text-zinc-100 hover:text-accent-300 transition"
                  title={isA ? 'Bấm để tra từ này' : 'Tap to look up'}
                >
                  {val}
                  {unchanged && (
                    <span className="text-[0.6875rem] text-zinc-500 ml-0.5">
                      {isA ? '(không đổi)' : '(same)'}
                    </span>
                  )}
                </button>
              ) : (
                <span className="text-xs font-medium text-zinc-100">
                  {val}
                  {unchanged && (
                    <span className="text-[0.6875rem] text-zinc-500 ml-0.5">
                      {isA ? '(không đổi)' : '(same)'}
                    </span>
                  )}
                </span>
              )}
              {/* Chỉ phát âm khi dạng khác từ gốc (từ gốc đã có nút phát âm riêng ở đầu thẻ). */}
              {!unchanged && <PronounceButton word={val} />}
            </span>
          )
        })}
      </div>

      {/* Ví dụ cho từng dạng (2 câu/dạng) — chỉ hiện dạng nào có sẵn ví dụ. */}
      {itemsWithEx.length > 0 && (
        <div className="mt-2 space-y-2">
          {itemsWithEx.map(({ key, val, examples }) => {
            const label = LABELS[key] ?? { vi: key, en: key }
            return (
              <div
                key={key}
                className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 overflow-hidden"
              >
                <p className="px-3 pt-2 text-[0.6875rem] text-zinc-400">
                  <span>{isA ? label.vi : label.en}</span>
                  <span className="ml-1.5 font-medium text-zinc-200">{val}</span>
                </p>
                <div className="divide-y divide-zinc-800/50">
                  {examples.map((ex, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute left-3 top-2 text-[0.6875rem] text-zinc-500 font-mono select-none">
                        {idx + 1}.
                      </span>
                      <KaraokeText
                        text={ex.en}
                        lang="en-US"
                        textClass="text-xs text-accent-300/80 theme-light:text-accent-800 italic leading-relaxed"
                        buttonClass="w-full pl-7 pr-3 py-1.5 hover:bg-accent-500/5 active:bg-accent-500/10 text-left transition"
                        iconSize="xs"
                      />
                      <KaraokeText
                        text={ex.vi}
                        lang="vi-VN"
                        textClass="text-xs text-zinc-400 leading-relaxed"
                        buttonClass="w-full pl-7 pr-3 py-1.5 hover:bg-sky-500/5 active:bg-sky-500/10 text-left transition"
                        iconSize="xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

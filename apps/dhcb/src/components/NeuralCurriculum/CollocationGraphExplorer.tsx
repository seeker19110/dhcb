import { useState } from 'react'
import { CollocationNode } from '@dhcb/core-contracts/neuralCurriculum'
import { Sparkles, Network, Volume2, BookOpen, Layers } from 'lucide-react'

interface CollocationGraphExplorerProps {
  collocations: CollocationNode[]
  title?: string
}

export default function CollocationGraphExplorer({
  collocations,
  title = 'Mạng lưới cụm từ chuẩn bản xứ (Collocations Graph)',
}: CollocationGraphExplorerProps) {
  const [selectedId, setSelectedId] = useState<string>(collocations[0]?.id || '')
  const activeCol = collocations.find((c) => c.id === selectedId) || collocations[0]

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/30 bg-zinc-950/80 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 theme-light:text-sky-900 border border-sky-500/30">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100">{title}</h4>
            <p className="text-[0.6875rem] text-zinc-400">
              Học theo cụm từ tự nhiên giúp loại bỏ thói quen dịch từng từ ngữ.
            </p>
          </div>
        </div>
        <span className="rounded px-2 py-0.5 text-[0.6875rem] font-bold uppercase bg-sky-500/20 text-sky-300 theme-light:text-sky-900 border border-sky-500/40">
          {collocations.length} Collocations
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {collocations.map((col) => {
          const isSelected = col.id === selectedId
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setSelectedId(col.id)}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ' +
                (isSelected
                  ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/25 border border-sky-400'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800')
              }
            >
              <Sparkles
                className={
                  'w-3 h-3 ' +
                  (isSelected ? 'text-zinc-950' : 'text-sky-400 theme-light:text-sky-900')
                }
              />
              <span>{col.phraseEn}</span>
              <span
                className={
                  'text-[0.6875rem] font-mono px-1 rounded ' +
                  (isSelected
                    ? 'bg-zinc-950/30 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-400')
                }
              >
                {col.cefrLevel}
              </span>
            </button>
          )
        })}
      </div>

      {activeCol && (
        <div className="mt-1 rounded-xl border border-sky-500/20 bg-sky-950/20 p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-sky-200 theme-light:text-sky-900">
                {activeCol.phraseEn}
              </span>
              <button
                type="button"
                onClick={() => playAudio(activeCol.phraseEn)}
                className="p-1 text-sky-400 theme-light:text-sky-900 hover:text-sky-200 hover:bg-sky-900/40 rounded-lg transition"
                title="Phát âm"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              {activeCol.ipa && (
                <span className="text-[0.6875rem] font-mono text-zinc-400">{activeCol.ipa}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[0.6875rem] text-zinc-400">
              <Layers className="w-3 h-3 text-sky-400 theme-light:text-sky-900" />
              <span className="capitalize">{activeCol.type.replace('_', ' ')}</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 font-medium">
            👉 <span className="text-sky-300 theme-light:text-sky-900">Nghĩa:</span>{' '}
            {activeCol.meaningVi}
          </p>

          <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/80 text-xs">
            <div className="flex items-start gap-1.5 text-zinc-200 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-sky-400 theme-light:text-sky-900 mt-0.5 flex-shrink-0" />
              <p className="italic font-sans">"{activeCol.exampleSentenceEn}"</p>
            </div>
            <p className="text-[0.6875rem] text-zinc-400 pl-5">{activeCol.exampleSentenceVi}</p>
          </div>
        </div>
      )}
    </div>
  )
}

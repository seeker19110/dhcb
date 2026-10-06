import { useState, useEffect } from 'react'
import MetacognitiveReflectionModal from './MetacognitiveReflectionModal.js'
import {
  fetchDailySocraticPrompt,
  fetchMetacognitiveSummary,
} from '../../lib/metacognitiveReflectionApi.js'
import type {
  SocraticDailyPrompt,
  MetacognitiveSummary,
} from '@dhcb/core-contracts/metacognitiveReflection'

export default function MetacognitiveJournalCard() {
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [dailyPrompt, setDailyPrompt] = useState<SocraticDailyPrompt | null>(null)
  const [summary, setSummary] = useState<MetacognitiveSummary | null>(null)

  useEffect(() => {
    Promise.all([
      fetchDailySocraticPrompt('learning').catch(() => null),
      fetchMetacognitiveSummary().catch(() => null),
    ]).then(([p, s]) => {
      if (p) setDailyPrompt(p)
      if (s?.summary) setSummary(s.summary)
    })
  }, [])

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-surface-card p-5 shadow-xl transition-all duration-300 hover:border-teal-500/50 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/30 border border-teal-400/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              🪞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 theme-light:text-teal-900 border border-teal-500/30 tracking-wide uppercase">
                  Platform V5 Peak Cognitive
                </span>
                <span className="text-[0.6875rem] font-semibold text-zinc-400">
                  Socratic Metacognition & Biases
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Nhật Ký Phản Tỉnh & Điểm Mù Nhận Thức (Metacognition)
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 leading-relaxed">
                {dailyPrompt
                  ? `Hôm nay: "${dailyPrompt.theme}" — ${dailyPrompt.promptText.slice(0, 85)}...`
                  : 'Khám phá tư duy sâu, đo lường chỉ số Metacognitive Index và phát hiện thiên kiến nhận thức.'}
              </p>
              {summary && summary.totalReflectionsCount > 0 && (
                <div className="flex items-center gap-3 mt-2 text-xs text-teal-300 theme-light:text-teal-900/90 font-medium">
                  <span>
                    💡 MAI Index:{' '}
                    <strong className="text-white">{summary.overallAwarenessIndex}/100</strong>
                  </span>
                  <span>•</span>
                  <span>
                    📝 Đã phản tỉnh:{' '}
                    <strong className="text-white">{summary.totalReflectionsCount} phiên</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-[#fff] font-bold text-xs sm:text-sm shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span>Phản tỉnh Socratic</span>
            <span>✨</span>
          </button>
        </div>
      </div>

      {isOpenModal && (
        <MetacognitiveReflectionModal
          initialPrompt={dailyPrompt}
          onClose={() => {
            setIsOpenModal(false)
            fetchMetacognitiveSummary()
              .then((s) => s?.summary && setSummary(s.summary))
              .catch(() => {})
          }}
        />
      )}
    </>
  )
}

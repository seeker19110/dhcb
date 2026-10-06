import { useState, useEffect } from 'react'
import { Briefcase, Zap, CheckCircle2, Plus, BookOpen } from 'lucide-react'
import type { HarvestedMistake, AutoSrsCard } from '@dhcb/core-contracts/workplaceErrorHarvester'

// Fetch dữ liệu lỗi + thẻ SRS — helper thuần fetch NGOÀI component, để cả effect
// mount lẫn handler dùng chung mà không dính rule set-state-in-effect.
async function fetchWorkplaceData(): Promise<{
  mistakes?: HarvestedMistake[]
  cards?: AutoSrsCard[]
}> {
  const [mRes, cRes] = await Promise.all([
    fetch('/api/workplace-insights'),
    fetch('/api/workplace-insights?kind=srs_cards'),
  ])
  const result: { mistakes?: HarvestedMistake[]; cards?: AutoSrsCard[] } = {}
  if (mRes.ok) {
    const mData = await mRes.json()
    if (mData.mistakes) result.mistakes = mData.mistakes
  }
  if (cRes.ok) {
    const cData = await cRes.json()
    if (cData.cards) result.cards = cData.cards
  }
  return result
}

export default function WorkplaceHarvesterCard() {
  const [mistakes, setMistakes] = useState<HarvestedMistake[]>([])
  const [srsCards, setSrsCards] = useState<AutoSrsCard[]>([])
  const [testText, setTestText] = useState<string>('')
  const [isHarvesting, setIsHarvesting] = useState<boolean>(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'mistakes' | 'cards'>('mistakes')

  // Dùng lại được từ handler (harvest/convert xong nạp lại danh sách).
  const loadData = async () => {
    try {
      const { mistakes: m, cards: c } = await fetchWorkplaceData()
      if (m) setMistakes(m)
      if (c) setSrsCards(c)
    } catch (err) {
      console.error('Failed to load workplace harvester data', err)
    }
  }

  // Nạp lần đầu lúc mount — hàm async định nghĩa TRONG effect, mọi setState
  // nằm sau await (không setState đồng bộ trong thân effect).
  useEffect(() => {
    const load = async () => {
      try {
        const { mistakes: m, cards: c } = await fetchWorkplaceData()
        if (m) setMistakes(m)
        if (c) setSrsCards(c)
      } catch (err) {
        console.error('Failed to load workplace harvester data', err)
      }
    }
    void load()
  }, [])

  const handleHarvestText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testText.trim() || isHarvesting) return
    setIsHarvesting(true)
    try {
      const res = await fetch('/api/workplace-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'harvest',
          rawText: testText.trim(),
          sourceType: 'email',
        }),
      })
      if (res.ok) {
        setTestText('')
        await loadData()
      }
    } catch (err) {
      console.error('Failed to harvest', err)
    } finally {
      setIsHarvesting(false)
    }
  }

  const handleConvertToSrs = async (mistakeId: string) => {
    setConvertingId(mistakeId)
    try {
      const res = await fetch('/api/workplace-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_to_srs',
          mistakeId,
        }),
      })
      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error('Failed to convert to SRS', err)
    } finally {
      setConvertingId(null)
    }
  }

  return (
    <div className="bg-surface-card border border-amber-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-subtle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg">
            <Briefcase className="w-5 h-5 text-[#fff]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Workplace Error Harvester & Auto-SRS
              </h3>
              <span className="text-[0.6875rem] px-2 py-0.5 font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 theme-light:text-amber-900 border border-amber-500/30">
                Workplace AI
              </span>
            </div>
            <p className="text-xs text-content-secondary">
              Thu hoạch câu từ chưa chuẩn từ công việc thực tế ➔ Tự động sinh Flashcard Spaced
              Repetition
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-surface-raised p-1 rounded-xl border border-line-strong">
          <button
            type="button"
            onClick={() => setActiveTab('mistakes')}
            aria-pressed={activeTab === 'mistakes'}
            className={`tap-44-y px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'mistakes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            Lỗi Thu Hoạch ({mistakes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            aria-pressed={activeTab === 'cards'}
            className={`tap-44-y px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'cards'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            Thẻ SRS ({srsCards.length})
          </button>
        </div>
      </div>

      {/* Quick Ingest Form */}
      <form onSubmit={handleHarvestText} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Dán đoạn thảo luận / email (ví dụ: 'I am agree with you to discuss about this project')..."
          disabled={isHarvesting}
          aria-label="Đoạn văn cần thu hoạch lỗi"
          className="min-w-0 flex-1 basis-48 px-4 py-2.5 rounded-xl bg-surface-raised border border-line-strong text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!testText.trim() || isHarvesting}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isHarvesting ? 'Đang quét...' : 'Thu hoạch Lỗi'}</span>
        </button>
      </form>

      {/* Tab 1: Mistakes List */}
      {activeTab === 'mistakes' && (
        <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
          {mistakes.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-surface-raised border border-line-subtle space-y-2 hover:border-line-strong transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[0.6875rem] font-bold uppercase px-2 py-0.5 rounded bg-surface-raised text-content-secondary">
                    {m.sourceType}
                  </span>
                  <span className="text-[0.6875rem] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 theme-light:text-blue-800">
                    CEFR {m.cefrLevel}
                  </span>
                  <span
                    className={`text-[0.6875rem] font-semibold ${
                      m.urgency === 'critical'
                        ? 'text-red-400 theme-light:text-red-900'
                        : m.urgency === 'moderate'
                          ? 'text-amber-400 theme-light:text-amber-900'
                          : 'text-teal-400 theme-light:text-teal-900'
                    }`}
                  >
                    • {m.urgency === 'critical' ? 'Lỗi nặng' : 'Cần sửa'}
                  </span>
                </div>

                {m.convertedToSrs ? (
                  <span className="text-[0.6875rem] font-semibold text-emerald-400 theme-light:text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã tạo Flashcard SRS
                  </span>
                ) : (
                  <button
                    onClick={() => handleConvertToSrs(m.id)}
                    disabled={convertingId === m.id}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 theme-light:text-amber-900 text-[0.6875rem] font-semibold flex items-center gap-1 border border-amber-500/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{convertingId === m.id ? 'Đang tạo...' : 'Tạo Thẻ SRS'}</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-content-secondary italic bg-surface-raised p-2 rounded-lg border border-line-subtle">
                &ldquo;{m.originalContextSnippet}&rdquo;
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-red-950/30 border border-red-500/30 text-red-200 theme-light:text-red-900">
                  <span className="font-bold text-red-400 theme-light:text-red-900">
                    ❌ Cần tránh:{' '}
                  </span>
                  {m.detectedMistake}
                </div>
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 theme-light:text-emerald-900">
                  <span className="font-bold text-emerald-400 theme-light:text-emerald-900">
                    ✨ Chuẩn bản xứ:{' '}
                  </span>
                  {m.nativeAlternative}
                </div>
              </div>

              <p className="text-[0.6875rem] text-content-secondary">
                💡 <span className="text-content-secondary">Giải thích:</span> {m.explanationVi}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: SRS Cards List */}
      {activeTab === 'cards' && (
        <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
          {srsCards.length === 0 ? (
            <div className="p-6 text-center text-xs text-content-secondary">
              Chưa có thẻ SRS nào được tạo từ lỗi công việc. Hãy nhấn &quot;Tạo Thẻ SRS&quot; ở tab
              bên cạnh!
            </div>
          ) : (
            srsCards.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400 theme-light:text-indigo-800" />
                    <span className="text-xs font-bold text-indigo-200 theme-light:text-indigo-800">
                      Thẻ ôn tập ngắt quãng
                    </span>
                  </div>
                  <span className="text-[0.6875rem] text-content-secondary">
                    Lặp lại sau {c.repetitionIntervalDays} ngày
                  </span>
                </div>

                <div className="text-xs font-medium text-content">
                  <span className="text-amber-400 theme-light:text-amber-900 font-bold">
                    Mặt trước:{' '}
                  </span>
                  {c.frontPrompt}
                </div>

                <div className="text-xs font-medium text-emerald-300 theme-light:text-emerald-900 bg-surface-raised p-2 rounded-lg border border-line-subtle">
                  <span className="text-emerald-400 theme-light:text-emerald-900 font-bold">
                    Đáp án:{' '}
                  </span>
                  {c.backAnswer}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

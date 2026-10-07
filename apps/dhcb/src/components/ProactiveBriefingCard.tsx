// apps/dhcb/src/components/ProactiveBriefingCard.tsx — V2 Flagship Proactive Briefing Card.
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Sun, Moon, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import { fetchProactiveBriefing } from '../lib/proactiveBriefingApi'
import type { ProactiveBriefing } from '@dhcb/core-contracts/proactiveBriefing'

export default function ProactiveBriefingCard() {
  const [briefing, setBriefing] = useState<ProactiveBriefing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProactiveBriefing()
      .then(setBriefing)
      .catch(() => setBriefing(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !briefing) return null

  const isMorning = briefing.type === 'morning'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-purple-950/40 p-5 shadow-xl backdrop-blur-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border ${isMorning ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 theme-light:text-amber-900' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 theme-light:text-indigo-800'}`}
          >
            {isMorning ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-400 theme-light:text-indigo-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Bản Tin Đồng Hành {isMorning ? 'Buổi Sáng' : 'Buổi Tối'}
            </span>
            <h3 className="text-sm font-medium text-zinc-200 line-clamp-1">{briefing.greeting}</h3>
          </div>
        </div>

        <Link
          to="/ban-dong-hanh"
          className="text-xs font-medium text-indigo-400 theme-light:text-indigo-800 hover:text-indigo-300 flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/20 transition"
        >
          Hội thoại
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <p className="text-xs sm:text-sm text-zinc-300 mb-4 leading-relaxed">{briefing.summary}</p>

      {/* Action Items List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {briefing.actionItems.map((item) => (
          <Link
            key={item.id}
            to={item.route}
            className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition group"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${item.priority === 'urgent' ? 'bg-rose-400 animate-pulse' : item.priority === 'high' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
                <span className="text-xs font-semibold text-zinc-200 truncate">{item.title}</span>
              </div>
              <p className="text-xs text-zinc-400 truncate">{item.action}</p>
            </div>

            <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-indigo-600/30 text-zinc-400 group-hover:text-indigo-300 shrink-0 transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {briefing.insights.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-emerald-400 theme-light:text-emerald-900">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{briefing.insights[0]}</span>
        </div>
      )}
    </div>
  )
}

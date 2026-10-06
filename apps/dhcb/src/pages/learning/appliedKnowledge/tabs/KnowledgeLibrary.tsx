// Tab 2 — Kho tri thức ứng dụng (K12): tìm kiếm + lọc theo cấp/môn. Tách từ AppliedKnowledge.tsx (2026-09-06).
import { useState } from 'react'
import { Search, ShieldCheck, Building2, Lightbulb } from 'lucide-react'
import {
  APPLIED_KNOWLEDGE_DATABASE,
  type SchoolLevel,
  type SubjectCategory,
} from '../../../../data/appliedKnowledgeData'

export function KnowledgeLibrary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | 'all'>('all')
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory | 'all'>('all')

  // Lọc kho tri thức theo ô tìm + cấp học + môn
  const filteredLibrary = APPLIED_KNOWLEDGE_DATABASE.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLevel = selectedLevel === 'all' || item.level === selectedLevel
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject
    return matchesSearch && matchesLevel && matchesSubject
  })

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo chủ đề, từ khóa đời sống (tiền điện, lãi kép, GPS, cồn 70, AI, giảm cân)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm placeholder-zinc-500 focus:outline-none focus:border-accent-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedLevel === 'all'
                ? 'bg-accent-500 text-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
            }`}
          >
            Tất cả cấp học
          </button>
          <button
            onClick={() => setSelectedLevel('secondary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedLevel === 'secondary'
                ? 'bg-accent-500 text-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
            }`}
          >
            Cấp 2 (THCS)
          </button>
          <button
            onClick={() => setSelectedLevel('high_school')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedLevel === 'high_school'
                ? 'bg-accent-500 text-black'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
            }`}
          >
            Cấp 3 (THPT)
          </button>
        </div>

        {/* Subject pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60 items-center">
          <span className="text-xs text-zinc-500 mr-1">Môn học:</span>
          {[
            { id: 'all', label: 'Tất cả môn' },
            { id: 'math', label: 'Toán học' },
            { id: 'physics', label: 'Vật lý' },
            { id: 'chemistry', label: 'Hóa học' },
            { id: 'biology', label: 'Sinh học' },
            { id: 'informatics', label: 'Tin học & AI' },
            { id: 'economics_law', label: 'Kinh tế & Pháp luật' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id as SubjectCategory | 'all')}
              className={`px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium transition ${
                selectedSubject === s.id
                  ? 'bg-blue-600 text-[#fff]'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Cards */}
      <div className="space-y-4">
        {filteredLibrary.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded bg-accent-500/20 text-accent-400 theme-light:text-accent-800 font-mono">
                    {item.gradeLabel}
                  </span>
                  <span className="text-xs text-zinc-400">• {item.topic}</span>
                </div>
                <h2 className="text-base font-bold text-zinc-100">{item.title}</h2>
              </div>
            </div>

            {/* 4-Layer Framework */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                <div className="text-amber-400 theme-light:text-amber-800 font-bold flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> Bản chất đời sống:
                </div>
                <p className="text-zinc-300 leading-relaxed">{item.intuitivePrinciple}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                <div className="text-blue-400 theme-light:text-blue-800 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Bài toán giải quyết:
                </div>
                <p className="text-zinc-300 leading-relaxed">{item.realWorldProblem}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 theme-light:bg-purple-50 border border-purple-500/20 text-xs flex items-start gap-2">
              <Building2 className="w-4 h-4 text-purple-400 theme-light:text-purple-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-300 theme-light:text-purple-800">
                  Ứng dụng công nghiệp & Nghề nghiệp:{' '}
                </span>
                <span className="text-zinc-300">{item.industryCareerApp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

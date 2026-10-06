// apps/dhcb/src/pages/subjects/english/lessons/SearchBar.tsx — tách từ pages/subjects/english/Lessons.tsx (1.693 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.

import { Search, X } from 'lucide-react'

// ── Ô tìm kiếm dùng chung ────────────────────────────────────────────────────
export function SearchBar({
  query,
  setQuery,
  isA,
  variant = 'desktop',
}: {
  query: string
  setQuery: (v: string) => void
  isA: boolean
  variant?: 'desktop' | 'mobile'
}) {
  const inputId = variant === 'desktop' ? 'lesson-search-desktop' : 'lesson-search-mobile'
  const label = isA
    ? 'Tìm chủ đề bài học (tiếng Anh hoặc tiếng Việt)'
    : 'Search lesson topics (English or Vietnamese)'
  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        id={inputId}
        name="query"
        type="search"
        aria-label={label}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          isA ? 'Tìm bằng tiếng Anh hoặc tiếng Việt…' : 'Search in English or Vietnamese…'
        }
        className="tap-44-y w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 focus:bg-zinc-900 transition"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          aria-label={isA ? 'Xóa tìm kiếm' : 'Clear search'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

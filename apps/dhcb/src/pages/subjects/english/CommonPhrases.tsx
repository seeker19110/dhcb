import { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react'
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { Search, X, ChevronRight, Loader2 } from 'lucide-react'
import { ContinueRow } from '../../../components/learning/ContinueCard'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { MAIN_CONTENT_ID, PageShell } from '@core/PageShell'
import { useLang } from '../../../context/useLang'
import { useAuth } from '../../../context/useAuth'
import KaraokeText from '../../../components/KaraokeText'
import { loadIndex, loadSubject } from '../../../data/patterns/loader'
import type { SubjectMeta, Subject } from '../../../data/patterns/loader'
import { markViewed, markLastOpened, suggestContinue } from '../../../lib/viewedTracking'

const PAGE_SIZE = 7

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  emerald: {
    bg: 'bg-accent-500/10',
    text: 'text-accent-400 theme-light:text-accent-800',
    border: 'border-accent-500/25',
    badge: 'bg-accent-500/20 text-accent-300 theme-light:text-accent-800',
  },
  sky: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400 theme-light:text-sky-800',
    border: 'border-sky-500/25',
    badge: 'bg-sky-500/20 text-sky-300 theme-light:text-sky-800',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400 theme-light:text-violet-800',
    border: 'border-violet-500/25',
    badge: 'bg-violet-500/20 text-violet-300 theme-light:text-violet-800',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400 theme-light:text-amber-800',
    border: 'border-amber-500/25',
    badge: 'bg-amber-500/20 text-amber-300 theme-light:text-amber-800',
  },
  pink: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400 theme-light:text-pink-800',
    border: 'border-pink-500/25',
    badge: 'bg-pink-500/20 text-pink-300 theme-light:text-pink-800',
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400 theme-light:text-teal-800',
    border: 'border-teal-500/25',
    badge: 'bg-teal-500/20 text-teal-300 theme-light:text-teal-800',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400 theme-light:text-rose-800',
    border: 'border-rose-500/25',
    badge: 'bg-rose-500/20 text-rose-300 theme-light:text-rose-800',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400 theme-light:text-indigo-800',
    border: 'border-indigo-500/25',
    badge: 'bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400 theme-light:text-orange-800',
    border: 'border-orange-500/25',
    badge: 'bg-orange-500/20 text-orange-300 theme-light:text-orange-800',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400 theme-light:text-cyan-800',
    border: 'border-cyan-500/25',
    badge: 'bg-cyan-500/20 text-cyan-300 theme-light:text-cyan-800',
  },
  slate: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400 theme-light:text-slate-800',
    border: 'border-slate-500/25',
    badge: 'bg-slate-500/20 text-slate-300 theme-light:text-slate-800',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400 theme-light:text-purple-800',
    border: 'border-purple-500/25',
    badge: 'bg-purple-500/20 text-purple-300 theme-light:text-purple-800',
  },
}

function getColor(color: string) {
  // 'slate' luôn có trong COLOR_MAP nên fallback chắc chắn khác undefined
  return COLOR_MAP[color] ?? COLOR_MAP['slate']!
}

// Bản đồ từ khóa tiếng Anh → gợi ý tiếng Việt để tìm kiếm 2 chiều
const VI_HINTS: Record<string, string> = {
  I: 'tôi mình em con',
  He: 'anh ấy ông ấy anh chàng',
  She: 'cô ấy bà ấy chị cô',
  You: 'bạn anh chị em mày',
  We: 'chúng tôi chúng ta mình',
  They: 'họ bọn họ chúng nó',
  Everyone: 'mọi người tất cả ai cũng',
  can: 'có thể',
  "can't": 'không thể không có thể',
  want: 'muốn',
  needs: 'cần',
  need: 'cần',
  is: 'là đang',
  was: 'đã là đã',
  has: 'có',
  have: 'có',
  will: 'sẽ',
  "won't": 'sẽ không',
  would: 'sẽ muốn',
  should: 'nên',
  might: 'có thể',
  love: 'yêu thích',
  loves: 'yêu thích',
  like: 'thích',
  likes: 'thích',
  thinks: 'nghĩ',
  think: 'nghĩ',
  plans: 'kế hoạch dự định',
  going: 'sắp sẽ đi',
  trying: 'cố đang cố',
  planning: 'kế hoạch dự định',
  "doesn't": 'không',
  "don't": 'không',
  "didn't": 'đã không',
}

// Chuyển starter tiếng Anh thành chuỗi gợi ý tiếng Việt để tìm kiếm
function starterToViHint(starter: string): string {
  return starter
    .split(/\s+/)
    .map((w) => VI_HINTS[w] ?? w)
    .join(' ')
}

// Phân loại cấu trúc câu từ starter
type StructType = 'be' | 'toV' | 'V'

const STRUCT_LABELS: Record<StructType, string> = {
  be: 'S + be',
  toV: 'S + to V',
  V: 'S + V',
}

function getStructType(starter: string): StructType {
  const words = starter.toLowerCase().split(/\s+/)
  // Có "to" ở bất kỳ vị trí nào → S + to V
  if (words.slice(1).includes('to')) return 'toV'
  // Động từ "be" ở vị trí thứ 2 → S + be
  if (['am', 'is', 'are', 'was', 'were', 'be'].some((w) => words[1] === w)) return 'be'
  return 'V'
}

// Xen kẽ round-robin theo category để mỗi batch 7 không quá 2 cùng loại.
// Quét qua từng category (giữ thứ tự xuất hiện), mỗi vòng lấy 1 phần tử nếu còn,
// lặp tới khi xếp HẾT. Dùng con trỏ thay cho shift() — không phá mảng gốc và đảm bảo
// giữ ĐỦ mọi chủ thể (bản cũ có `i > items.length*3` làm rớt chủ thể cuối khi 1 loại
// quá nhiều, vd. "Người (số ít)" chiếm 680/1000 → trang chỉ hiện ~653 chủ thể).
function interleave(items: SubjectMeta[]): SubjectMeta[] {
  const groups: Record<string, SubjectMeta[]> = {}
  const order: string[] = []
  items.forEach((s) => {
    const g = groups[s.category]
    if (!g) {
      groups[s.category] = [s]
      order.push(s.category)
    } else {
      g.push(s)
    }
  })
  const result: SubjectMeta[] = []
  const cursor: Record<string, number> = {}
  let placed = true
  while (placed) {
    placed = false
    for (const cat of order) {
      const grp = groups[cat]
      if (!grp) continue
      const idx = cursor[cat] ?? 0
      if (idx < grp.length) {
        result.push(grp[idx]!) // idx < grp.length nên chắc chắn có
        cursor[cat] = idx + 1
        placed = true
      }
    }
  }
  return result
}

export default function CommonPhrases() {
  usePageTitle('Câu thông dụng | Môn tiếng Anh · Đồng Hành Cùng Bạn')
  const { T } = useLang()
  const { user } = useAuth()
  const uid = user?.id ?? ''

  const [indexData, setIndexData] = useState<SubjectMeta[]>([])
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search) // filter lazy, input không lag
  const [activeStruct, setActiveStruct] = useState<StructType | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Khóa invalidation thủ công cho Set "đã xem" — bump() sau khi mở 1 chủ đề để
  // CTA "Tiếp tục" tính lại đúng khi quay lại danh sách.
  const [viewedRefresh, setViewedRefresh] = useState(0)

  useEffect(() => {
    loadIndex().then(setIndexData)
  }, [])

  // Gợi ý đầu danh sách — luật chung `suggestContinue` (chủ đề đang học trước, rồi mới tới chủ đề
  // đầu tiên chưa xem). Trước đây là "đầu tiên chưa xem": vừa mở chủ đề 1 đã bị mời sang chủ đề 2.
  const goiY = useMemo(
    () => suggestContinue('phrases', uid, indexData, (m) => m.starter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, indexData, viewedRefresh],
  )

  const filtered = useMemo(() => {
    let list = indexData
    if (activeStruct) list = list.filter((s) => getStructType(s.starter) === activeStruct)
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase()
      list = list.filter(
        (s) =>
          s.starter.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          starterToViHint(s.starter).toLowerCase().includes(q),
      )
    }
    return list
  }, [activeStruct, deferredSearch, indexData])

  const sorted = useMemo(() => interleave(filtered), [filtered])

  // Đổi bộ lọc/tìm kiếm → thu về trang đầu — pattern so-sánh-prev ngay trong render
  // (không setState đồng bộ trong effect).
  const filterKey = JSON.stringify([activeStruct, deferredSearch])
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setVisible(PAGE_SIZE)
  }

  // Lazy load bằng IntersectionObserver — cuộn tới sentinel thì load thêm 7
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visible >= sorted.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, sorted.length))
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, sorted.length])

  async function openSubject(meta: SubjectMeta) {
    setLoading(true)
    const subj = await loadSubject(meta)
    setSelected(subj)
    setLoading(false)
    window.scrollTo({ top: 0 })
    if (uid) {
      markViewed('phrases', uid, meta.starter)
      markLastOpened('phrases', uid, meta.starter)
      setViewedRefresh((k) => k + 1)
    }
  }

  // ── Màn hình chi tiết: 100 câu của 1 chủ thể ──────────────────────
  if (selected) {
    const c = getColor(selected.color)
    return (
      <div className="h-[calc(100dvh-var(--bnav-h))] overflow-hidden bg-zinc-950 flex flex-col">
        <Layout backTo={duongDanMonTiengAnh()} title={selected.starter} back />
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="focus:outline-none flex-1 overflow-hidden max-w-3xl mx-auto w-full px-4 py-4 flex flex-col"
        >
          {/* danh sách câu cuộn trong khung cố định, không đẩy trang xuống */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {selected.sentences.map((sent, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl overflow-hidden"
              >
                <div className="flex items-stretch">
                  <span className="text-xs text-zinc-400 w-8 shrink-0 flex items-center justify-center border-r border-zinc-800/60">
                    {idx + 1}
                  </span>
                  <div className="flex-1 divide-y divide-zinc-800/60">
                    <KaraokeText
                      text={sent.en}
                      lang="en-US"
                      textClass={`font-medium text-[0.9375rem] leading-snug ${c.text}`}
                      buttonClass="w-full px-3 py-2.5 hover:bg-accent-500/5 active:bg-accent-500/10"
                    />
                    <KaraokeText
                      text={sent.vi}
                      lang="vi-VN"
                      textClass="text-sm text-zinc-400"
                      buttonClass="w-full px-3 py-2 hover:bg-sky-500/5 active:bg-sky-500/10"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // ── Màn hình danh sách ──────────────────────────────────────────────────────
  // Mobile: h-dvh flex col, search cố định dưới cùng
  // Desktop (sm+): layout thường, search ở trên
  const shown = sorted.slice(0, visible)

  return (
    <div className="bg-zinc-950 flex flex-col h-[calc(100dvh-var(--bnav-h))] sm:h-auto sm:block sm:min-h-dvh">
      <Layout backTo={duongDanMonTiengAnh()} back title={T.phrasesPageTitle} />

      {/* <div> chứ không phải <main>: landmark <main> do PageShell render bên trong. */}
      <div className="flex-1 overflow-y-auto sm:overflow-visible sm:flex-none">
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] Danh sách chủ đề → width standard. */}
        <PageShell
          width="standard"
          baseWidth="max-w-3xl"
          className="!pt-4 !pb-2 sm:!pt-6 sm:!pb-[calc(1.5rem+var(--bnav-h))] space-y-4"
        >
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            {T.phrasesPageTitle}
          </h1>

          {/* Gợi ý "Tiếp tục"/"Bắt đầu" — ẩn khi đang tìm kiếm */}
          {goiY && !search.trim() && (
            <ContinueRow
              label={goiY.kind === 'start' ? T.phrasesStart : T.phrasesContinue}
              title={goiY.item.starter}
              onClick={() => openSubject(goiY.item)}
            />
          )}

          {/* Ô tìm kiếm — chỉ hiện ở trên trên desktop */}
          <div className="hidden sm:block relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="search-desktop"
              name="search"
              type="search"
              aria-label={T.phrasesPageTitle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={T.phrasesSearchPlaceholder}
              className="tap-44-y w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 focus:bg-zinc-900 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3 loại cấu trúc S+V */}
          <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveStruct(null)}
              className={`tap-44-touch shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                activeStruct === null
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              {T.phrasesAll}
            </button>
            {(['be', 'toV', 'V'] as StructType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveStruct(activeStruct === type ? null : type)}
                className={`tap-44-touch shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  activeStruct === type
                    ? 'bg-accent-500/20 text-accent-300 border-accent-500/30'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-300'
                }`}
              >
                {STRUCT_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Grid cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {shown.map((subj) => {
              const c = getColor(subj.color)
              return (
                <button
                  key={subj.starter}
                  onClick={() => openSubject(subj)}
                  disabled={loading}
                  className={`text-left bg-zinc-900/80 border rounded-xl p-3 hover:bg-zinc-800/60 active:scale-[0.98] transition-all group disabled:opacity-50 ${c.border}`}
                >
                  <div
                    className={`text-xs px-2 py-0.5 rounded-full inline-block mb-2 font-medium ${c.badge}`}
                  >
                    {subj.category}
                  </div>
                  <p className={`font-bold text-lg ${c.text} leading-tight`}>{subj.starter}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[0.6875rem] text-zinc-400">
                      {subj.count} {T.phrasesSentences}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-zinc-400 transition" />
                  </div>
                </button>
              )
            })}
          </div>

          {visible < sorted.length && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-zinc-400 text-sm">{T.phrasesNoResult}</div>
          )}
        </PageShell>
      </div>

      {/* Search bar cố định ở dưới — CHỈ trên mobile */}
      <div className="sm:hidden shrink-0 border-t border-zinc-800/40 bg-zinc-950/95 backdrop-blur-md px-4 pt-3 pb-safe">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="search-mobile"
            name="search"
            type="search"
            aria-label={T.phrasesPageTitle}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T.phrasesSearchPlaceholder}
            className="tap-44-y w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-base text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 focus:bg-zinc-900 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Xóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

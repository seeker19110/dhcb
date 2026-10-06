import { useMemo, useState, useRef, useEffect, useDeferredValue } from 'react'
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import {
  Search,
  X,
  BookText,
  GraduationCap,
  Target,
  Brain,
  Star,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import PronounceButton from '../../../components/PronounceButton'
import VocabMilestone from '../../../components/VocabMilestone'
import StudyPanel, { type StudyTab } from '../../../components/StudyPanel'
import KaraokeText from '../../../components/KaraokeText'
import WordIllustration from '../../../components/WordIllustration'
import WordFormsBlock from '../../../components/WordFormsBlock'
import type { ExPair } from '../../../data/extra-examples'
import { loadExtraExamples } from '../../../data/extraExamplesLoader'
import type { DictEntry } from '../../../types'
import { searchDictionary } from '../../../lib/dictionaryApi'
import { getDirection } from '../../../lib/storage'
import { useAuth } from '../../../context/useAuth'
import { useOnboarding } from '../../../lib/onboarding'
import { POS_LABEL, POS_COLOR, POS_LIST, LEVEL_COLOR } from '../../../lib/pos'
import { getLearnedWords } from '../../../lib/vocab'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { countBadgeClass, badgeCount } from '@core/badgeStyles'

// Số kết quả mỗi trang: desktop rộng nên hiện nhiều hơn hẳn (3 kết quả/trang là quá thưa,
// người dùng phải bấm sang trang liên tục); mobile giữ ít để không phải cuộn dài.
const PAGE_SIZE_DESKTOP = 12
const PAGE_SIZE_MOBILE = 5
type Tab = StudyTab | 'search' | 'pos'
// Từ tab học (StudyPanel) tách riêng để biết khi nào cần render <StudyPanel>.
const STUDY_TABS: StudyTab[] = ['today', 'srs', 'hard', 'quiz']

// Phát hiện chuỗi tiếng Việt (có dấu)
function hasVietnamese(s: string) {
  return /[àáảãạăắặẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(s)
}

// Chủ đề từ vựng nhanh — hiển thị ở trang trống để gợi ý
const QUICK_TOPICS = [
  {
    labelVi: 'Chào hỏi',
    labelEn: 'Greetings',
    words: ['hello', 'thank', 'sorry', 'please', 'goodbye'],
  },
  {
    labelVi: 'Gia đình',
    labelEn: 'Family',
    words: ['mother', 'father', 'brother', 'sister', 'child'],
  },
  {
    labelVi: 'Thức ăn',
    labelEn: 'Food & Drink',
    words: ['rice', 'bread', 'coffee', 'water', 'fruit'],
  },
  {
    labelVi: 'Công việc',
    labelEn: 'Work',
    words: ['work', 'office', 'meeting', 'project', 'salary'],
  },
  {
    labelVi: 'Trường học',
    labelEn: 'School',
    words: ['student', 'teacher', 'exam', 'class', 'study'],
  },
  { labelVi: 'Cảm xúc', labelEn: 'Feelings', words: ['happy', 'sad', 'angry', 'love', 'afraid'] },
  {
    labelVi: 'Sức khỏe',
    labelEn: 'Health',
    words: ['doctor', 'hospital', 'pain', 'medicine', 'sleep'],
  },
  {
    labelVi: 'Di chuyển',
    labelEn: 'Getting around',
    words: ['road', 'bus', 'walk', 'far', 'direction'],
  },
]

export default function Dictionary() {
  usePageTitle('Từ điển Anh-Việt | Đồng hành cùng bạn')
  const { user } = useAuth()
  const onboarding = useOnboarding(user?.id) // nhóm tuổi (GĐ 4, PROGRESS.md) — lọc vòng từ vựng
  const dir = getDirection()
  const isA = dir === 'A'
  const [tab, setTab] = useState<Tab>('today')
  const [badges, setBadges] = useState({ srsDue: 0, hardCount: 0 })
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [page, setPage] = useState(0)
  // Mật độ kết quả theo khổ màn hình (xem PAGE_SIZE_* ở đầu file).
  const isDesktop = useIsDesktopViewport()
  const pageSize = isDesktop ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE
  const [learnedKey, setLearnedKey] = useState(0)
  const [jumpPos, setJumpPos] = useState<string | null>(null)
  const [posFilter, setPosFilter] = useState<string | null>(null)
  const posRefs = useRef<Record<string, HTMLElement | null>>({})
  const touchStart = useRef({ x: 0, y: 0 })

  // Từ đã thuộc — đọc thẳng từ localStorage mỗi render (learnedKey tăng → re-render
  // → tự đọc bản mới), thay cho state + effect (tránh setState đồng bộ trong effect).
  void learnedKey
  const learnedWords: Set<string> = user ? getLearnedWords(user.id) : new Set<string>()

  // Kết quả tìm kiếm lấy TỪ SERVER (không tải cả từ điển về máy).
  const [searchResults, setSearchResults] = useState<DictEntry[]>([])
  const [searchPosGroups, setSearchPosGroups] = useState<[string, number][]>([])
  const [searchMatched, setSearchMatched] = useState(0)
  // Bước 4 (bo-sung-dang-bien-the-tu-dien.md): query khớp đúng 1 dạng biến thể không có entry
  // riêng (vd "books"/"played") — hiện gợi ý nhỏ "là dạng của X" phía trên kết quả.
  const [searchMatchedForm, setSearchMatchedForm] = useState<{ form: string; base: string } | null>(
    null,
  )
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false) // true khi lỗi mạng (khác "không có kết quả")
  const [retryKey, setRetryKey] = useState(0) // tăng để gọi lại tìm kiếm sau lỗi mạng
  const [extraExamples, setExtraExamples] = useState<Record<string, [ExPair, ExPair]>>({})

  useEffect(() => {
    loadExtraExamples().then(setExtraExamples)
  }, [])

  // Khi từ khóa/bộ lọc đổi: reset trang + bật spinner (hoặc xoá kết quả nếu ô trống)
  // NGAY TRONG RENDER (pattern so-sánh-prev, không setState đồng bộ trong effect).
  const pageKey = JSON.stringify([deferredQuery, posFilter])
  const [prevPageKey, setPrevPageKey] = useState(pageKey)
  if (pageKey !== prevPageKey) {
    setPrevPageKey(pageKey)
    setPage(0) // reset trang khi query / bộ lọc thay đổi (không reset khi bấm "thử lại")
  }
  const searchKey = JSON.stringify([deferredQuery, posFilter, retryKey])
  const [prevSearchKey, setPrevSearchKey] = useState(searchKey)
  if (searchKey !== prevSearchKey) {
    setPrevSearchKey(searchKey)
    if (deferredQuery.trim()) {
      setSearching(true)
      setSearchError(false)
    } else {
      setSearchResults([])
      setSearchPosGroups([])
      setSearchMatched(0)
      setSearchMatchedForm(null)
      setSearchError(false)
    }
  }

  // Gọi API tìm kiếm mỗi khi từ khóa đổi (deferredQuery đã được React hoãn để gõ mượt).
  // Hủy request cũ khi gõ tiếp để tránh kết quả về trễ ghi đè kết quả mới.
  useEffect(() => {
    const q = deferredQuery.trim()
    if (!q) return
    const ctrl = new AbortController()
    // Truyền posFilter để server lọc đúng theo loại từ (số khớp với chip kể cả >200 từ).
    searchDictionary(q, ctrl.signal, posFilter)
      .then((r) => {
        setSearchResults(r.results)
        setSearchPosGroups(r.posGroups)
        setSearchMatched(r.matched)
        setSearchMatchedForm(r.matchedForm ?? null)
        setSearchError(false)
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // Lỗi mạng/server thật sự → đánh dấu để báo khác với "không tìm thấy từ"
          setSearchResults([])
          setSearchPosGroups([])
          setSearchMatched(0)
          setSearchMatchedForm(null)
          setSearchError(true)
        }
      })
      // Chỉ tắt spinner nếu request này CHƯA bị huỷ (gõ tiếp sẽ abort req cũ rồi bật
      // lại spinner cho req mới — không để req cũ tắt nhầm spinner của req mới, gây nhấp nháy).
      .finally(() => {
        if (!ctrl.signal.aborted) setSearching(false)
      })
    return () => ctrl.abort()
  }, [deferredQuery, posFilter, retryKey])

  useEffect(() => {
    if (tab !== 'pos' || !jumpPos) return
    const el = posRefs.current[jumpPos]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setJumpPos(null)
    }
  }, [tab, jumpPos])

  function openPos(posCode: string) {
    setJumpPos(posCode)
    setTab('pos')
  }

  // Kết quả tìm kiếm gốc (đã sắp xếp ở server) — dùng để tính chip lọc loại từ.
  const allMatchesBase = searchResults
  // Loại từ + số lượng do server đếm trên TOÀN BỘ kết quả khớp (không chỉ phần trả về).
  const posGroups = searchPosGroups

  // Áp dụng bộ lọc loại từ lên kết quả gốc
  const allMatches = useMemo((): DictEntry[] => {
    if (!posFilter) return allMatchesBase
    return allMatchesBase.filter((e) => e.pos === posFilter)
  }, [allMatchesBase, posFilter])

  const totalPages = Math.max(1, Math.ceil(allMatches.length / pageSize))
  // Khi đổi khổ màn hình (xoay máy / thu cửa sổ) số trang giảm — kẹp lại để không rơi
  // vào trang trống.
  const safePage = Math.min(page, totalPages - 1)
  const results = allMatches.slice(safePage * pageSize, (safePage + 1) * pageSize)

  // Vuốt trái/phải từ cạnh màn hình để chuyển trang
  function handleSwipe(startX: number, deltaX: number, deltaY: number) {
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return
    const w = window.innerWidth
    const fromLeft = startX < 40
    const fromRight = startX > w - 40
    if (deltaX > 50 && fromLeft && safePage > 0) setPage(safePage - 1)
    if (deltaX < -50 && fromRight && safePage < totalPages - 1) setPage(safePage + 1)
  }

  if (!user) return null

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout backTo={duongDanMonTiengAnh()} title={isA ? 'Từ điển' : 'Dictionary'} />

      {/* Thẻ bọc này CHỈ để nhóm; landmark <main> do PageShell render bên trong — hai <main>
          lồng nhau là vi phạm a11y (landmark trùng) và cổng e2e/a11y.spec.ts quét đúng trang này. */}
      <div>
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang tra cứu/danh sách → width standard. */}
        <PageShell
          width="standard"
          baseWidth="max-w-3xl"
          className={`!py-6 ${
            tab === 'search' ? '!pb-[calc(6rem+var(--bnav-h))]' : '!pb-[calc(1.5rem+var(--bnav-h))]'
          }`}
        >
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            {isA ? 'Từ điển' : 'Dictionary'}
          </h1>

          <VocabMilestone userId={user.id} refreshKey={learnedKey} />

          {/* Thanh 6 tab — 2 hàng x 3, hàng trên = tra cứu + học hôm nay, hàng dưới = ôn tập */}
          <div className="space-y-1.5 mb-4">
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: 'search', icon: BookText, label: isA ? 'Tra từ' : 'Search' },
                  { key: 'today', icon: Target, label: isA ? 'Hôm nay' : 'Today' },
                  { key: 'pos', icon: GraduationCap, label: isA ? 'Loại từ' : 'Word Types' },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`tap-44-y relative flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                    tab === key
                      ? 'bg-accent-500/20 text-accent-300 theme-light:text-accent-800 border border-accent-500/40'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" /> <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: 'srs', icon: Brain, label: isA ? 'Ôn lại' : 'SRS', badge: badges.srsDue },
                  {
                    key: 'hard',
                    icon: Star,
                    label: isA ? 'Từ khó' : 'Hard',
                    badge: badges.hardCount,
                  },
                  {
                    key: 'quiz',
                    icon: ClipboardList,
                    label: isA ? 'Kiểm tra' : 'Quiz',
                    badge: undefined as number | undefined,
                  },
                ] as const
              ).map(({ key, icon: Icon, label, badge }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`tap-44-y relative flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                    tab === key
                      ? 'bg-accent-500/20 text-accent-300 theme-light:text-accent-800 border border-accent-500/40'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" /> <span className="truncate">{label}</span>
                  {badge != null && badge > 0 && (
                    <span className={countBadgeClass()}>{badgeCount(badge)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab học (Hôm nay/Ôn SRS/Từ khó/Kiểm tra) ── */}
          {STUDY_TABS.includes(tab as StudyTab) ? (
            <StudyPanel
              uid={user.id}
              isA={isA}
              tab={tab as StudyTab}
              onProgress={() => setLearnedKey((k) => k + 1)}
              onBadges={setBadges}
              ageGroup={onboarding?.ageGroup}
            />
          ) : tab === 'search' ? (
            <>
              {/* Ô tìm kiếm — desktop */}
              <div className="hidden sm:block relative mb-3 animate-fade-in">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="dict-search-desktop"
                  name="search"
                  aria-label={isA ? 'Tìm kiếm từ điển' : 'Search dictionary'}
                  role="searchbox"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPosFilter(null)
                  }}
                  placeholder={
                    isA
                      ? 'Gõ tiếng Anh hoặc tiếng Việt để tra…'
                      : 'Search in English or Vietnamese…'
                  }
                  className="tap-44-y w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 focus:bg-zinc-900 transition"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('')
                      setPosFilter(null)
                    }}
                    aria-label={isA ? 'Xóa tìm kiếm' : 'Clear search'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Gợi ý dạng biến thể (Bước 4) — "books" là số nhiều của "book" */}
              {searchMatchedForm && (
                <p className="text-xs text-zinc-400 mb-3 animate-fade-in">
                  {isA ? (
                    <>
                      "{searchMatchedForm.form}" là 1 dạng của{' '}
                      <span className="text-accent-400 theme-light:text-accent-800 font-medium">
                        "{searchMatchedForm.base}"
                      </span>
                    </>
                  ) : (
                    <>
                      "{searchMatchedForm.form}" is a form of{' '}
                      <span className="text-accent-400 theme-light:text-accent-800 font-medium">
                        "{searchMatchedForm.base}"
                      </span>
                    </>
                  )}
                </p>
              )}

              {/* POS filter chips — hiện khi có ≥2 loại từ trong kết quả */}
              {query && posGroups.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-3 animate-fade-in">
                  <button
                    onClick={() => setPosFilter(null)}
                    aria-label={isA ? 'Hiện tất cả từ loại' : 'Show all parts of speech'}
                    aria-pressed={!posFilter}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      !posFilter
                        ? 'bg-accent-500/20 text-accent-300 theme-light:text-accent-800 border-accent-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {isA ? 'Tất cả' : 'All'} ({searchMatched})
                  </button>
                  {posGroups.map(([pos, count]) => (
                    <button
                      key={pos}
                      onClick={() => setPosFilter(posFilter === pos ? null : pos)}
                      aria-label={`${isA ? 'Lọc theo' : 'Filter by'} ${POS_LABEL[pos] || pos}`}
                      aria-pressed={posFilter === pos}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        posFilter === pos
                          ? `${POS_COLOR[pos] ?? 'bg-zinc-700 text-zinc-300 theme-light:text-zinc-100'} border-transparent`
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {POS_LABEL[pos] || pos} ({count})
                    </button>
                  ))}
                </div>
              )}

              {query ? (
                searching && allMatches.length === 0 ? (
                  /* Đang chờ server trả kết quả */
                  <div className="text-center py-10 animate-fade-in">
                    <p className="text-zinc-400 text-sm">{isA ? 'Đang tìm…' : 'Searching…'}</p>
                  </div>
                ) : allMatches.length > 0 ? (
                  <>
                    {/* Phân trang */}
                    {totalPages > 1 && (
                      <div className="flex items-stretch gap-2 mb-3 text-xs">
                        <button
                          onClick={() => setPage(safePage - 1)}
                          disabled={safePage === 0}
                          aria-label={isA ? 'Trang trước' : 'Previous page'}
                          className="w-[30%] flex items-center justify-center gap-1 glass rounded-xl py-2.5 text-zinc-400 hover:text-white disabled:opacity-25 transition active:bg-zinc-700/50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          {isA ? 'Trước' : 'Prev'}
                        </button>
                        <div
                          className="flex-1 flex items-center justify-center text-zinc-400"
                          aria-live="polite"
                        >
                          {safePage + 1} / {totalPages} ({allMatches.length} {isA ? 'từ' : 'words'})
                        </div>
                        <button
                          onClick={() => setPage(safePage + 1)}
                          disabled={safePage === totalPages - 1}
                          aria-label={isA ? 'Trang sau' : 'Next page'}
                          className="w-[30%] flex items-center justify-center gap-1 glass rounded-xl py-2.5 text-zinc-400 hover:text-white disabled:opacity-25 transition active:bg-zinc-700/50"
                        >
                          {isA ? 'Sau' : 'Next'}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Thẻ từ — vuốt trái/phải để chuyển trang */}
                    <div
                      className="space-y-2 animate-fade-up"
                      onTouchStart={(e) => {
                        touchStart.current = {
                          x: e.touches[0]?.clientX ?? 0,
                          y: e.touches[0]?.clientY ?? 0,
                        }
                      }}
                      onTouchEnd={(e) =>
                        handleSwipe(
                          touchStart.current.x,
                          (e.changedTouches[0]?.clientX ?? 0) - touchStart.current.x,
                          (e.changedTouches[0]?.clientY ?? 0) - touchStart.current.y,
                        )
                      }
                    >
                      {results.map((e) => {
                        const extras = extraExamples[e.word.toLowerCase()]
                        const isLearned = learnedWords.has(e.word.toLowerCase())
                        return (
                          <div
                            key={e.word}
                            className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 hover:border-accent-500/40 hover:bg-zinc-850 transition-all duration-200 shadow-sm"
                          >
                            {/* Header: từ + badge loại từ + phát âm + "đã học" */}
                            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                              <span className="font-extrabold text-white text-lg sm:text-xl tracking-tight">
                                {e.word}
                              </span>
                              <button
                                type="button"
                                onClick={() => openPos(e.pos)}
                                title={`${POS_LABEL[e.pos] || e.pos} — ${isA ? 'nhấn để xem giải thích' : 'tap to learn more'}`}
                                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition hover:brightness-125 shadow-sm ${POS_COLOR[e.pos] ?? 'bg-zinc-700 text-zinc-300 theme-light:text-zinc-100'}`}
                              >
                                {POS_LABEL[e.pos] || e.pos}
                              </button>
                              {e.level && (
                                <span
                                  title={isA ? `Cấp CEFR ${e.level}` : `CEFR level ${e.level}`}
                                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shadow-sm ${LEVEL_COLOR[e.level] ?? 'bg-zinc-700 text-zinc-300 theme-light:text-zinc-100'}`}
                                >
                                  {e.level}
                                </span>
                              )}
                              <PronounceButton word={e.word} />
                              {isLearned && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 theme-light:text-emerald-900 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 ml-auto">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {isA ? 'Đã học' : 'Learned'}
                                </span>
                              )}
                            </div>

                            {/* Phiên âm + nghĩa */}
                            {e.ipa_en && (
                              <p className="text-xs text-accent-400 font-semibold theme-light:text-accent-800 font-mono mb-1.5 bg-accent-500/10 px-2.5 py-0.5 rounded-md inline-block border border-accent-500/20">
                                {e.ipa_en}
                              </p>
                            )}
                            <p className="text-sm sm:text-base text-zinc-100 font-bold mb-1.5">
                              {e.vi}
                            </p>
                            {e.ipa_vi && (
                              <p className="text-xs text-zinc-400 font-mono mb-2.5">{e.ipa_vi}</p>
                            )}

                            {/* Các dạng biến thể của từ (số nhiều, các thì, so sánh…) */}
                            <WordFormsBlock
                              forms={e.forms}
                              base={e.base}
                              word={e.word}
                              isA={isA}
                              onPick={(w) => {
                                setQuery(w)
                                setPosFilter(null)
                              }}
                            />

                            <WordIllustration word={e.word} />

                            {/* 3 ví dụ đánh số — Ví dụ 1 từ ex_en, Ví dụ 2&3 từ EXTRA_EXAMPLES */}
                            {e.ex_en && (
                              <div className="mt-3.5 space-y-2">
                                <p className="text-[11px] font-bold text-zinc-400">
                                  {isA ? 'Câu ví dụ ngữ cảnh' : 'Context Examples'}
                                </p>

                                {/* Ví dụ 1 */}
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-[11px] text-zinc-400 font-mono select-none font-bold">
                                    1.
                                  </span>
                                  <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/70 divide-y divide-zinc-800/60 overflow-hidden shadow-inner">
                                    <KaraokeText
                                      text={e.ex_en}
                                      lang="en-US"
                                      textClass="text-xs sm:text-[13px] text-accent-300/90 theme-light:text-accent-800 italic leading-relaxed font-medium"
                                      buttonClass="w-full pl-8 pr-3.5 py-2.5 hover:bg-accent-500/5 active:bg-accent-500/10 text-left transition"
                                      iconSize="xs"
                                    />
                                    {e.ex_vi && (
                                      <KaraokeText
                                        text={e.ex_vi}
                                        lang="vi-VN"
                                        textClass="text-xs sm:text-[13px] text-zinc-300 leading-relaxed"
                                        buttonClass="w-full pl-8 pr-3.5 py-2.5 hover:bg-sky-500/5 active:bg-sky-500/10 text-left transition"
                                        iconSize="xs"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Ví dụ 2 & 3 */}
                                {extras?.map((ex, idx) => (
                                  <div key={idx} className="relative">
                                    <span className="absolute left-3 top-2 text-[11px] text-zinc-400 font-mono select-none font-bold">
                                      {idx + 2}.
                                    </span>
                                    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/60 divide-y divide-zinc-800/40 overflow-hidden shadow-inner">
                                      <KaraokeText
                                        text={ex.en}
                                        lang="en-US"
                                        textClass="text-xs sm:text-[13px] text-accent-300/80 theme-light:text-accent-800 italic leading-relaxed font-medium"
                                        buttonClass="w-full pl-8 pr-3.5 py-2 hover:bg-accent-500/5 active:bg-accent-500/10 text-left transition"
                                        iconSize="xs"
                                      />
                                      <KaraokeText
                                        text={ex.vi}
                                        lang="vi-VN"
                                        textClass="text-xs sm:text-[13px] text-zinc-300 leading-relaxed"
                                        buttonClass="w-full pl-8 pr-3.5 py-2 hover:bg-sky-500/5 active:bg-sky-500/10 text-left transition"
                                        iconSize="xs"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {totalPages > 1 && (
                        <p className="text-[11px] text-zinc-400 text-center pt-1">
                          {isA ? '← Vuốt để xem thêm kết quả →' : '← Swipe for more results →'}
                        </p>
                      )}
                    </div>
                  </>
                ) : searchError ? (
                  /* Lỗi mạng/server — KHÁC với "không tìm thấy từ" */
                  <div className="text-center py-10 animate-fade-in space-y-3">
                    <p className="text-amber-400 theme-light:text-amber-900 text-sm font-medium">
                      {isA
                        ? 'Không kết nối được máy chủ tra từ'
                        : 'Could not reach the dictionary server'}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      {isA
                        ? 'Kiểm tra kết nối mạng rồi thử lại.'
                        : 'Check your connection and try again.'}
                    </p>
                    <button
                      onClick={() => setRetryKey((k) => k + 1)}
                      className="text-xs px-4 py-2 rounded-xl bg-accent-500/20 text-accent-300 theme-light:text-accent-800 border border-accent-500/40 hover:bg-accent-500/30 transition"
                    >
                      {isA ? 'Thử lại' : 'Retry'}
                    </button>
                  </div>
                ) : (
                  /* Không có kết quả */
                  <div className="text-center py-10 animate-fade-in space-y-2">
                    <p className="text-zinc-400 text-sm font-medium">
                      {isA ? `Không tìm thấy từ khớp với "${query}"` : `No results for "${query}"`}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      {hasVietnamese(query)
                        ? isA
                          ? 'Thử viết chính xác hơn hoặc tra bằng tiếng Anh'
                          : 'Try a more specific term or search in English'
                        : isA
                          ? 'Thử gõ tiếng Việt hoặc kiểm tra chính tả'
                          : 'Try Vietnamese or check your spelling'}
                    </p>
                  </div>
                )
              ) : (
                /* Trang trống — chưa tìm kiếm */
                <div className="space-y-4 animate-fade-in">
                  {/* Tip tìm kiếm */}
                  <div className="glass rounded-xl px-4 py-3 border border-zinc-800/60">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      <span className="text-accent-400 theme-light:text-accent-800 font-semibold">
                        {isA ? '💡 Mẹo:' : '💡 Tip:'}
                      </span>{' '}
                      {isA
                        ? 'Tra tiếng Anh (ví dụ: "friend") hoặc tiếng Việt (ví dụ: "bạn bè") — đều tìm được.'
                        : 'Search in English (e.g. "friend") or Vietnamese (e.g. "bạn bè") — both work.'}
                    </p>
                  </div>

                  {/* Chủ đề từ vựng nhanh */}
                  <div>
                    <p className="text-xs text-zinc-400 mb-2 px-0.5">
                      {isA ? 'Chủ đề phổ biến' : 'Common topics'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_TOPICS.map((topic) => (
                        <div key={topic.labelVi} className="glass rounded-xl p-3">
                          <p className="text-xs font-semibold text-zinc-300 mb-2">
                            {isA ? topic.labelVi : topic.labelEn}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {topic.words.map((w) => (
                              <button
                                key={w}
                                onClick={() => setQuery(w)}
                                className="text-xs px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:border-accent-500/50 hover:text-accent-300 transition"
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Tab Loại từ ── */
            <div className="space-y-3 animate-fade-in">
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  <strong className="text-white">
                    {isA ? 'Loại từ (Parts of speech)' : 'Parts of speech'}
                  </strong>
                  {isA
                    ? ' — biết loại từ giúp bạn đặt từ đúng vị trí, chia đúng thì, và ghép câu chính xác.'
                    : ' — knowing word types helps you use words in the right position and form grammatically correct sentences.'}
                </p>
              </div>
              {POS_LIST.map((p) => (
                <section
                  key={p.code}
                  id={`pos-${p.code}`}
                  ref={(el) => {
                    posRefs.current[p.code] = el
                  }}
                  className="glass rounded-xl p-4 scroll-mt-20"
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h2 className="font-bold text-white text-base">{p.label}</h2>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${p.color}`}>
                      {p.labelEn}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-3">{p.definition}</p>
                  <div className="space-y-1.5">
                    {p.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm pl-3 border-l-2 border-zinc-700/60"
                      >
                        <span className="text-zinc-200 italic">{ex.en}</span>
                        <span className="text-zinc-400">—</span>
                        <span className="text-zinc-400">{ex.vi}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </PageShell>
      </div>

      {/* Search bar cố định dưới — CHỈ trên mobile, tab Tra từ. Cố định ngay TRÊN
          BottomNav (bottom: var(--bnav-only-h) — chiều cao THẬT của riêng nav, xem
          index.css), giống PromoEndingBanner — tránh cách làm cũ (bó chiều
          cao trang bằng 100dvh-bnav-h để "đẩy" thanh này lên): cách đó khiến
          BottomNav hiển thị sai vị trí trên một số trình duyệt di động do dvh không
          khớp khi trang không tự cuộn ở cấp document. */}
      {tab === 'search' && (
        <div
          className="fixed inset-x-0 z-30 sm:hidden border-t border-zinc-800/40 bg-zinc-950/95 backdrop-blur-md pt-3 pb-3 flex justify-center"
          style={{ bottom: 'var(--bnav-only-h)' }}
        >
          <div className="relative w-[97%]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="dict-search-mobile"
              name="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPosFilter(null)
              }}
              placeholder={isA ? 'Gõ tiếng Anh hoặc tiếng Việt…' : 'English or Vietnamese…'}
              className="tap-44-y w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-base leading-tight text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 focus:bg-zinc-900 transition"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setPosFilter(null)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

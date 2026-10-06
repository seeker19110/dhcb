// Stories — trang "Nghe - Đọc - Kể Truyện" (/stories), tách riêng khỏi /listening (2026-08-02)
// để dễ phát triển thêm tính năng sau (vd: chấm kể lại, quiz đọc hiểu...) mà không phải đụng
// vào 2 tab Câu thông dụng/Hội thoại của /listening. Trước đây là tab "Truyện" trong Listening.tsx.
// Gom 6 thể loại, lọc bằng chip (thay vì 8 tab — không đủ chỗ trên điện thoại).
import { ENGLISH_PREFIX, duongDanTruyen } from '../../../lib/englishRoutes'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import { CardListSkeleton } from '../../../components/Skeleton'
import StoryCard from '../../../components/StoryCard'
import { useLang } from '../../../context/useLang'
import { getDirection } from '../../../lib/storage'
import { loadStoryIndex } from '../../../data/stories/loader'
import { STORY_KINDS } from '../../../data/stories/index'
import type { StoryMeta, StoryKind } from '../../../data/stories/index'
import { buildSlugSegment } from '@core/slug'
import { getAllStoryProgress } from '../../../lib/storyProgress'

type Lang = ReturnType<typeof useLang>['T']

/** Nhãn hiển thị của từng thể loại, theo ngôn ngữ giao diện. */
function kindLabels(T: Lang): Record<StoryKind, string> {
  return {
    'fairy-tale': T.kindFairyTale,
    fable: T.kindFable,
    'vn-folk': T.kindVnFolk,
    myth: T.kindMyth,
    humor: T.kindHumor,
    children: T.kindChildren,
  }
}

/** Chip lọc dùng chung cho hàng thể loại và hàng quốc gia. */
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`tap-44-touch shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? 'bg-accent-500/20 text-accent-300 theme-light:text-accent-800 border-accent-500/30'
          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-300'
      }`}
    >
      {label}
    </button>
  )
}

const CEFR_ORDER = ['A2', 'B1', 'B2'] as const

/** Mỗi lần bấm "Xem thêm" hiện thêm bấy nhiêu thẻ truyện (tránh in hết ~65 thẻ 1 lần — P1-5). */
const PAGE_SIZE = 12

function EmptyState({ isA }: { isA: boolean }) {
  return (
    <div className="text-center py-16 text-zinc-400 text-sm">
      {isA ? 'Chưa có nội dung.' : 'No content yet.'}
    </div>
  )
}

export default function Stories() {
  usePageTitle('Truyện song ngữ | Đồng Hành Cùng Bạn')
  const nav = useNavigate()
  const { T } = useLang()
  const isA = getDirection() === 'A'

  const [all, setAll] = useState<StoryMeta[] | null>(null)
  const [kind, setKind] = useState<StoryKind | null>(null)
  const [level, setLevel] = useState<StoryMeta['level'] | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  // Truyện đang đọc dở — đọc một lần khi mở trang (quay lại từ StoryReader là mount lại nên
  // luôn thấy vị trí mới nhất). Chỉ localStorage, xem lib/storyProgress.ts.
  const [progressById] = useState(getAllStoryProgress)

  useEffect(() => {
    loadStoryIndex().then(setAll)
  }, [])

  const stories = useMemo(() => all ?? [], [all])
  const labels = kindLabels(T)

  // Chỉ hiện chip của thể loại thật sự có truyện, giữ đúng thứ tự STORY_KINDS.
  const kinds = useMemo(
    () => STORY_KINDS.filter((k) => stories.some((s) => s.kind === k)),
    [stories],
  )

  // Cấp CEFR tính TRÊN thể loại đang chọn, để không hiện chip rỗng.
  const byKind = kind ? stories.filter((s) => s.kind === kind) : stories
  const levels = useMemo(() => {
    const set = new Set<StoryMeta['level']>()
    byKind.forEach((s) => set.add(s.level))
    return CEFR_ORDER.filter((l) => set.has(l))
  }, [byKind])

  // Danh sách quốc gia tính TRÊN thể loại + cấp đang chọn, để không hiện chip rỗng.
  const byLevel = level ? byKind.filter((s) => s.level === level) : byKind
  const countries = useMemo(() => {
    const set = new Set<string>()
    byLevel.forEach((s) => set.add(isA ? s.countryVi : s.countryEn))
    return [...set]
  }, [byLevel, isA])

  const filtered = country
    ? byLevel.filter((s) => (isA ? s.countryVi : s.countryEn) === country)
    : byLevel
  // Chỉ hiện tối đa `visibleCount` thẻ — tránh in hết ~65 thẻ cùng lúc (P1-5, 17.456px ở 390px).
  const shown = filtered.slice(0, visibleCount)
  const remaining = filtered.length - shown.length

  function selectKind(next: StoryKind | null) {
    setKind(next)
    setLevel(null) // đổi thể loại thì bỏ lọc cấp + quốc gia cũ (có thể không còn tồn tại)
    setCountry(null)
    setVisibleCount(PAGE_SIZE) // đổi bộ lọc thì reset về trang đầu
  }

  function selectLevel(next: StoryMeta['level'] | null) {
    setLevel(next)
    setCountry(null) // đổi cấp thì bỏ lọc quốc gia cũ (có thể không còn tồn tại)
    setVisibleCount(PAGE_SIZE)
  }

  function selectCountry(next: string | null) {
    setCountry(next)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout
        title={isA ? 'Nghe - đọc - kể truyện' : 'Listen - Read - Tell Stories'}
        backTo={ENGLISH_PREFIX}
        back
      />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Lưới thẻ truyện → width standard. */}
      <PageShell width="standard" baseWidth="max-w-3xl">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? 'Nghe - đọc - kể truyện' : 'Listen - Read - Tell Stories'}
        </h1>

        {all === null ? (
          <CardListSkeleton rows={4} />
        ) : stories.length === 0 ? (
          <EmptyState isA={isA} />
        ) : (
          <div>
            {kinds.length > 1 && (
              <div
                className="flex gap-2 pb-2 overflow-x-auto scrollbar-none"
                role="group"
                aria-label={T.filterKind}
              >
                <FilterChip
                  label={T.phrasesAll}
                  active={kind === null}
                  onClick={() => selectKind(null)}
                />
                {kinds.map((k) => (
                  <FilterChip
                    key={k}
                    label={labels[k]}
                    active={kind === k}
                    onClick={() => selectKind(kind === k ? null : k)}
                  />
                ))}
              </div>
            )}
            {levels.length > 1 && (
              <div
                className="flex gap-2 pb-2 overflow-x-auto scrollbar-none"
                role="group"
                aria-label={T.filterLevel}
              >
                <FilterChip
                  label={T.phrasesAll}
                  active={level === null}
                  onClick={() => selectLevel(null)}
                />
                {levels.map((l) => (
                  <FilterChip
                    key={l}
                    label={l}
                    active={level === l}
                    onClick={() => selectLevel(level === l ? null : l)}
                  />
                ))}
              </div>
            )}
            {countries.length > 1 && (
              <div
                className="flex gap-2 pb-3 overflow-x-auto scrollbar-none"
                role="group"
                aria-label={T.filterCountry}
              >
                <FilterChip
                  label={T.phrasesAll}
                  active={country === null}
                  onClick={() => selectCountry(null)}
                />
                {countries.map((c) => (
                  <FilterChip
                    key={c}
                    label={c}
                    active={country === c}
                    onClick={() => selectCountry(country === c ? null : c)}
                  />
                ))}
              </div>
            )}
            {/* Dòng đếm số truyện đang hiện — cạnh bộ lọc (P1-5). */}
            <p className="text-xs text-zinc-500 pb-2">
              {isA ? `${filtered.length} truyện` : `${filtered.length} stories`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shown.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isA={isA}
                  progress={progressById[story.id]}
                  onClick={() =>
                    nav(
                      duongDanTruyen(
                        buildSlugSegment(story.id, isA ? story.titleEn : story.titleVi),
                      ),
                    )
                  }
                />
              ))}
            </div>
            {remaining > 0 && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="tap-44-y px-4 py-2 rounded-lg text-sm font-medium border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100"
                >
                  {isA ? `Xem thêm (${remaining} truyện nữa)` : `Show more (${remaining} more)`}
                </button>
              </div>
            )}
          </div>
        )}
      </PageShell>
    </div>
  )
}

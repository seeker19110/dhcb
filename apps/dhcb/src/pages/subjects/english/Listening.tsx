// Listening — trang "Thư viện Nghe" (/listening), gom mọi nội dung để NGHE-HIỂU (khác /phrases và
// mục "Nghe" ở /practice vốn là bài tập CÓ CHẤM ĐIỂM). 2 tab: Mẫu câu · Hội thoại.
// Tab Truyện trước đây ở đây đã tách thành trang riêng /stories (2026-08-02, xem Stories.tsx)
// để dễ phát triển thêm tính năng sau.
// Xem docs/research/dac-ta-trang-nghe-2026-08-01.md mục 6 + danh-muc-truyen-nghe-2026-08-01.md mục 9.
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Square, Eye, EyeOff, ChevronRight, ChevronDown, Search } from 'lucide-react'
import { ContinueRow } from '../../../components/learning/ContinueCard'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import { TwoPane } from '@core/TwoPane'
import { TocRail } from '@core/TocRail'
import { useActiveSection } from '@core/useActiveSection'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { CardListSkeleton } from '../../../components/Skeleton'
import KaraokeText, { KARAOKE_INDENT } from '../../../components/KaraokeText'
import { useAuth } from '../../../context/useAuth'
import { useLang } from '../../../context/useLang'
import { getDirection } from '../../../lib/storage'
import { markViewed, markLastOpened, suggestContinue } from '../../../lib/viewedTracking'
import { speak, stopSpeaking, unlockAudio, type Voice } from '../../../lib/tts'
import { pickRandomVoice } from '../../../lib/voiceTiers'
import type { Plan } from '../../../types'
import { loadIndex, loadSubject } from '../../../data/patterns/loader'
import type { SubjectMeta, Subject } from '../../../data/patterns/loader'
import { getAllDialogues } from '../../../data/dialoguesLoader'
import type { Dialogue } from '../../../data/dialogues'
import { buttonClass } from '@core/buttonStyles'
import LoadError from '../../../components/LoadError'
import { useAsyncLoad } from '../../../lib/useAsyncLoad'
import { thongDiepLoiThanThien } from '../../../lib/friendlyError'

type Tab = 'phrases' | 'dialogues'
const TABS: Tab[] = ['phrases', 'dialogues']

export default function Listening() {
  usePageTitle('Luyện nghe | Môn tiếng Anh · Đồng Hành Cùng Bạn')
  const { user } = useAuth()
  const { T } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const isA = getDirection() === 'A'

  const tab: Tab = ((): Tab => {
    const t = searchParams.get('tab')
    return (TABS as string[]).includes(t ?? '') ? (t as Tab) : 'phrases'
  })()

  function setTab(next: Tab) {
    setSearchParams(next === 'phrases' ? {} : { tab: next }, { replace: false })
  }

  const TAB_LABELS: Record<Tab, string> = {
    phrases: T.tabPhrases,
    dialogues: T.tabDialogues,
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout backTo={duongDanMonTiengAnh()} back title={T.listeningPageTitle} />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Thư viện nghe (2 tab, danh sách) → width standard. */}
      <PageShell width="standard" baseWidth="max-w-3xl">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {T.listeningPageTitle}
        </h1>

        {/* Thanh 2 tab */}
        <div
          role="tablist"
          aria-label={T.listeningPageTitle}
          className="grid grid-cols-2 gap-1.5 mb-5"
        >
          {TABS.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`tap-44 px-1.5 py-2 rounded-xl text-[0.6875rem] sm:text-xs font-medium transition text-center leading-tight ${
                tab === key
                  ? 'bg-accent-500/20 text-accent-300 theme-light:text-accent-800 border border-accent-500/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        {tab === 'phrases' && <PhrasesTab isA={isA} T={T} />}
        {tab === 'dialogues' && <DialoguesTab isA={isA} T={T} plan={user?.plan ?? 'free'} />}
      </PageShell>
    </div>
  )
}

// Kiểu T lấy trực tiếp từ useLang() để không phải import Translations riêng ở mỗi sub-tab.
type Lang = ReturnType<typeof useLang>['T']

// ── Tab 1 — Câu thông dụng (chế độ nghe, tái dùng data/patterns) ─────────────
//
// [2026-09-22, audit lần 2 P0-1] Trước đây tab này in PHẲNG 1.000 thẻ mẫu câu: đo được trang cao
// 74.309px ở 390px (88 màn hình cuộn), không tìm kiếm, không nhóm — người dùng mobile không thể
// tới mẫu thứ 500. Nay: ô tìm kiếm + nhóm theo `category` (mỗi nhóm gập/mở, mở sẵn nhóm đầu) +
// mỗi nhóm hiện 24 thẻ rồi "Xem thêm" + thẻ "Tiếp tục" mẫu đầu tiên chưa nghe (cùng cơ chế
// `viewedTracking` như trang Câu thông dụng). Cổng canh: e2e/listening-phrases.spec.ts đo chiều
// cao trang ở 390px ≤ 4 màn hình.
const PHRASE_PAGE = 24

// Câu lỗi tải dữ liệu nghe (mẫu câu + hội thoại) — dữ liệu CHUNG, không phải dữ liệu riêng của
// người học, nên câu trấn an mặc định của LoadError ("Dữ liệu của bạn vẫn còn nguyên") không hợp.
const LOI_TAI_VI = 'Chưa tải được nội dung nghe. Kiểm tra kết nối rồi thử lại.'
const LOI_TAI_EN = 'Could not load the listening content. Check your connection and try again.'
const GOI_Y_VI = 'Tiến độ nghe của bạn vẫn được giữ nguyên.'
const GOI_Y_EN = 'Your listening progress is kept.'

function PhrasesTab({ isA, T }: { isA: boolean; T: Lang }) {
  const { user } = useAuth()
  const uid = user?.id ?? ''
  // [changelog 0525] Tải chỉ mục có nhánh LỖI + Thử lại — bản cũ `loadIndex().then(setIndex)`
  // không có nhánh lỗi nên mạng chập là skeleton quay mãi.
  const { state: indexState, retry: retryIndex } = useAsyncLoad(loadIndex, {
    lang: isA ? 'vi' : 'en',
    errorMessage: isA ? LOI_TAI_VI : LOI_TAI_EN,
  })
  const index = indexState.status === 'ready' ? indexState.data : null
  const [selected, setSelected] = useState<Subject | null>(null)
  const [opening, setOpening] = useState(false)
  // Lỗi khi MỞ một mẫu (tải chunk hỏng) — hiện ngay trên danh sách, danh sách vẫn dùng được.
  const [openError, setOpenError] = useState<{ meta: SubjectMeta; message: string } | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  // Nhóm đang mở (null = chưa ai chạm, mở sẵn nhóm đầu tiên) + số thẻ hiện của từng nhóm.
  const [openGroups, setOpenGroups] = useState<Set<string> | null>(null)
  const [shownByGroup, setShownByGroup] = useState<Record<string, number>>({})
  // Bump sau khi mở một mẫu để thẻ "Tiếp tục" tính lại khi quay về danh sách.
  const [viewedRefresh, setViewedRefresh] = useState(0)

  // Luật "Tiếp tục" chung (`suggestContinue`): mẫu đang nghe dở trước, rồi mới mẫu chưa xem.
  const goiY = useMemo(
    () => suggestContinue('listening', uid, index ?? [], (m) => m.starter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, index, viewedRefresh],
  )

  const groups = useMemo(() => {
    if (!index) return []
    const q = deferredSearch.trim().toLowerCase()
    const list = q
      ? index.filter(
          (m) => m.starter.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
        )
      : index
    const byCat = new Map<string, SubjectMeta[]>()
    for (const m of list) {
      const arr = byCat.get(m.category)
      if (arr) arr.push(m)
      else byCat.set(m.category, [m])
    }
    return [...byCat.entries()].map(([category, items]) => ({ category, items }))
  }, [index, deferredSearch])

  // [changelog 0525] Bản cũ không bắt lỗi: `loadSubject` reject thì `opening` kẹt `true` → cả tab
  // thành skeleton vĩnh viễn. Nay lỗi trả người học về danh sách kèm câu báo + có thể bấm lại.
  async function open(meta: SubjectMeta) {
    setOpening(true)
    setOpenError(null)
    try {
      const s = await loadSubject(meta)
      if (!s) {
        setOpenError({
          meta,
          message: isA ? 'Không tìm thấy mẫu câu này.' : 'This pattern could not be found.',
        })
        return
      }
      if (uid) {
        markViewed('listening', uid, meta.starter)
        markLastOpened('listening', uid, meta.starter)
      }
      setViewedRefresh((v) => v + 1)
      setSelected(s)
    } catch (err) {
      setOpenError({
        meta,
        message: thongDiepLoiThanThien(err, isA ? LOI_TAI_VI : LOI_TAI_EN, isA ? 'vi' : 'en'),
      })
    } finally {
      setOpening(false)
    }
  }

  if (selected) {
    return (
      <SentenceListPlayer
        title={selected.starter}
        sentences={selected.sentences}
        isA={isA}
        T={T}
        showTranslation={showTranslation}
        onToggleTranslation={() => setShowTranslation((v) => !v)}
        onBack={() => setSelected(null)}
      />
    )
  }

  if (opening) return <CardListSkeleton rows={3} />
  if (indexState.status === 'error') {
    return (
      <LoadError
        message={indexState.message}
        onRetry={retryIndex}
        lang={isA ? 'vi' : 'en'}
        hint={isA ? GOI_Y_VI : GOI_Y_EN}
      />
    )
  }
  if (index === null) return <CardListSkeleton rows={5} />
  if (index.length === 0) {
    return <EmptyState isA={isA} />
  }

  const searching = deferredSearch.trim().length > 0
  // Chưa ai chạm (`openGroups === null`) thì mở sẵn nhóm đầu; đang tìm kiếm thì mở hết.
  const defaultOpen = new Set(groups[0] ? [groups[0].category] : [])
  const isOpen = (cat: string) => searching || (openGroups ?? defaultOpen).has(cat)
  const toggle = (cat: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev ?? defaultOpen)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })

  return (
    <div className="space-y-4">
      {openError && (
        <LoadError
          message={openError.message}
          onRetry={() => void open(openError.meta)}
          lang={isA ? 'vi' : 'en'}
          hint={isA ? GOI_Y_VI : GOI_Y_EN}
        />
      )}
      {goiY && !searching && (
        <ContinueRow
          label={goiY.kind === 'start' ? T.phrasesStart : T.phrasesContinue}
          title={goiY.item.starter}
          onClick={() => open(goiY.item)}
        />
      )}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="listening-phrase-search"
          name="search"
          type="search"
          aria-label={T.tabPhrases}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={T.phrasesSearchPlaceholder}
          className="tap-44-y w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 focus:bg-zinc-900 transition"
        />
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-6">
          {isA ? 'Không có mẫu câu nào khớp.' : 'No phrases match.'}
        </p>
      ) : (
        groups.map(({ category, items }, i) => {
          const opened = isOpen(category)
          const shown = shownByGroup[category] ?? PHRASE_PAGE
          const visible = items.slice(0, shown)
          const panelId = `phrase-group-${i}`
          return (
            <section key={category} className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <button
                type="button"
                aria-expanded={opened}
                aria-controls={panelId}
                onClick={() => toggle(category)}
                className="tap-44 w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="font-semibold text-white text-sm">
                  {category}{' '}
                  <span className="text-xs font-normal text-zinc-400">· {items.length}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-content-muted shrink-0 transition-transform ${opened ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {opened && (
                <div id={panelId} className="px-3 pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {visible.map((meta) => (
                      <button
                        key={meta.starter}
                        onClick={() => open(meta)}
                        className="text-left bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800/60 active:scale-[0.98] transition flex items-center justify-between gap-2"
                      >
                        <p className="font-semibold text-white truncate">{meta.starter}</p>
                        <ChevronRight className="w-4 h-4 text-content-muted shrink-0" />
                      </button>
                    ))}
                  </div>
                  {items.length > shown && (
                    <button
                      type="button"
                      onClick={() =>
                        setShownByGroup((prev) => ({ ...prev, [category]: shown + PHRASE_PAGE }))
                      }
                      className={buttonClass({
                        variant: 'outline',
                        fullWidth: true,
                        className: 'mt-2',
                      })}
                    >
                      {isA
                        ? `Xem thêm (còn ${items.length - shown})`
                        : `Show more (${items.length - shown} left)`}
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}

// ── Tab 2 — Hội thoại, nhóm theo cấp CEFR bằng tiền tố id ─────────────────────
const CEFR_PREFIX = /^(a1|a2|b1|b2|c1|c2)-/

interface DialogueEntry {
  id: string
  dialogue: Dialogue
}

function DialoguesTab({ isA, T, plan }: { isA: boolean; T: Lang; plan: Plan }) {
  const [selected, setSelected] = useState<DialogueEntry | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  // [changelog 0525] Bản cũ `getAllDialogues().then(...)` không có nhánh lỗi: tải hỏng (mạng,
  // HTTP, quá 15s) là skeleton quay mãi. Nay có trạng thái lỗi + Thử lại.
  const { state: dialoguesState, retry } = useAsyncLoad(getAllDialogues, {
    lang: isA ? 'vi' : 'en',
    errorMessage: isA ? LOI_TAI_VI : LOI_TAI_EN,
  })
  const otherLabel = T.otherGroupLabel
  const groups = useMemo(() => {
    if (dialoguesState.status !== 'ready') return null
    const byLevel: Record<string, DialogueEntry[]> = {}
    for (const [id, dialogues] of Object.entries(dialoguesState.data)) {
      const m = CEFR_PREFIX.exec(id)
      const level = m ? m[1]!.toUpperCase() : otherLabel
      for (const dialogue of dialogues) {
        ;(byLevel[level] ??= []).push({ id, dialogue })
      }
    }
    return byLevel
  }, [dialoguesState, otherLabel])

  if (selected) {
    return (
      <DialoguePlayer
        entry={selected}
        isA={isA}
        T={T}
        plan={plan}
        showTranslation={showTranslation}
        onToggleTranslation={() => setShowTranslation((v) => !v)}
        onBack={() => setSelected(null)}
      />
    )
  }

  if (dialoguesState.status === 'error') {
    return (
      <LoadError
        message={dialoguesState.message}
        onRetry={retry}
        lang={isA ? 'vi' : 'en'}
        hint={isA ? GOI_Y_VI : GOI_Y_EN}
      />
    )
  }
  if (groups === null) return <CardListSkeleton rows={5} />
  const levelKeys = Object.keys(groups)
  if (levelKeys.length === 0) return <EmptyState isA={isA} />

  return <DialogueGroups groups={groups} levelKeys={levelKeys} isA={isA} onSelect={setSelected} />
}

/**
 * Danh sách hội thoại nhóm theo cấp, kèm MỤC LỤC CẤP ở cột phụ desktop.
 *
 * VÌ SAO CÓ (đo 2026-09-05 ở 1440px): trang `/luyen-nghe` cao **37.266px** — hơn bốn mươi màn
 * hình cuộn cho một danh sách phẳng. Muốn tới hội thoại cấp B2 thì phải cuộn qua toàn bộ A1–B1,
 * và cuộn xong thì không còn biết mình đang ở cấp nào. Đó đúng là ca mà `TocRail` sinh ra để
 * giải quyết (xem chú thích đầu `packages/core-ui/TocRail.tsx`).
 *
 * Tách thành component RIÊNG chứ không viết thẳng trong `DialoguesTab`: `useActiveSection` là
 * một hook, mà ở `DialoguesTab` phần này nằm sau hai nhánh `return` sớm (đang tải / rỗng) —
 * gọi hook sau `return` có điều kiện là vi phạm luật hook.
 */
function DialogueGroups({
  groups,
  levelKeys,
  isA,
  onSelect,
}: {
  groups: Record<string, DialogueEntry[]>
  levelKeys: string[]
  isA: boolean
  onSelect: (entry: DialogueEntry) => void
}) {
  const isDesktop = useIsDesktopViewport()
  const sectionIds = levelKeys.map((level) => `cap-${level}`)
  const activeId = useActiveSection(sectionIds)

  return (
    <TwoPane
      isDesktop={isDesktop}
      railLabel={isA ? 'Mục lục cấp độ' : 'Level outline'}
      rail={
        <TocRail
          title={isA ? 'Cấp độ' : 'Levels'}
          activeId={activeId}
          items={levelKeys.map((level) => ({
            id: `cap-${level}`,
            label: level,
            hint: `${groups[level]?.length ?? 0}`,
          }))}
        />
      }
    >
      <div className="space-y-5">
        {levelKeys.map((level) => (
          // `scroll-mt-20` chừa đúng chiều cao header sticky, nếu không cấp được nhảy tới sẽ
          // nằm khuất sau header.
          <div key={level} id={`cap-${level}`} className="scroll-mt-20">
            <p className="text-[0.6875rem] font-semibold text-zinc-400 mb-2">{level}</p>
            {/* [2026-09-05, đợt 3] Thêm nấc `lg:grid-cols-3`. Lưới cũ dừng ở `sm:` nên ở 1440px
              vẫn chỉ hai cột: đo được cả trang cao 37.266px — hơn bốn mươi màn hình cuộn. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {groups[level]!.map((entry, i) => (
                <button
                  key={`${entry.id}-${i}`}
                  onClick={() => onSelect(entry)}
                  className="text-left bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800/60 active:scale-[0.98] transition flex items-center justify-between gap-2"
                >
                  <span className="font-medium text-white text-sm truncate">
                    {isA ? entry.dialogue.titleVi : entry.dialogue.titleEn}
                  </span>
                  <ChevronRight className="w-4 h-4 text-content-muted shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </TwoPane>
  )
}

// ── Trạng thái rỗng dùng chung ─────────────────────────────────────────────
function EmptyState({ isA }: { isA: boolean }) {
  return (
    <div className="text-center py-16 text-zinc-400 text-sm">
      {isA ? 'Chưa có nội dung.' : 'No content yet.'}
    </div>
  )
}

// ── Trình phát tuần tự cho danh sách câu (tab Câu thông dụng) ────────────────
function SentenceListPlayer({
  title,
  sentences,
  isA,
  T,
  showTranslation,
  onToggleTranslation,
  onBack,
}: {
  title: string
  sentences: { en: string; vi: string }[]
  isA: boolean
  T: Lang
  showTranslation: boolean
  onToggleTranslation: () => void
  onBack: () => void
}) {
  const [playing, setPlaying] = useState(false)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [wordIdx, setWordIdx] = useState<number | null>(null)
  const stopRef = useRef(false)

  useEffect(
    () => () => {
      stopRef.current = true
      stopSpeaking()
    },
    [],
  )

  async function playAll() {
    if (sentences.length === 0) return
    unlockAudio()
    stopRef.current = false
    setPlaying(true)
    const lang = isA ? 'en-US' : 'vi-VN'
    for (let i = 0; i < sentences.length; i++) {
      if (stopRef.current) break
      const s = sentences[i]
      if (!s) continue
      setActiveIdx(i)
      setWordIdx(null)
      await speak(isA ? s.en : s.vi, lang, undefined, undefined, (wi) => setWordIdx(wi))
      if (!stopRef.current) await new Promise((r) => setTimeout(r, 250))
    }
    stopRef.current = false
    setPlaying(false)
    setActiveIdx(null)
    setWordIdx(null)
  }

  function stopAll() {
    stopRef.current = true
    stopSpeaking()
    setPlaying(false)
    setActiveIdx(null)
    setWordIdx(null)
  }

  const targetLang = isA ? 'en-US' : 'vi-VN'

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="tap-44 text-sm text-zinc-400 hover:text-zinc-200 transition px-2 -ml-2"
        >
          ← {isA ? 'Quay lại' : 'Back'}
        </button>
        <h2 className="font-semibold text-white truncate flex-1">{title}</h2>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {!playing ? (
          <button
            onClick={playAll}
            className="tap-44 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-sm font-medium transition"
          >
            <Play className="w-4 h-4 fill-current" />
            {T.playAllLabel}
          </button>
        ) : (
          <button onClick={stopAll} className={buttonClass({ variant: 'outline' })}>
            <Square className="w-4 h-4 fill-current" />
            {isA ? 'Dừng' : 'Stop'}
          </button>
        )}
        <button
          onClick={onToggleTranslation}
          aria-pressed={showTranslation}
          className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44 ml-auto' })}
        >
          {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showTranslation ? T.hideTranslation : T.showTranslation}
        </button>
      </div>

      <div className="space-y-1.5">
        {sentences.map((s, i) => {
          const isActive = playing && activeIdx === i
          return (
            <div key={i} className={`rounded-lg ${isActive ? 'bg-accent-500/10' : ''}`}>
              <KaraokeText
                text={isA ? s.en : s.vi}
                lang={targetLang}
                textClass="text-[0.9375rem] leading-relaxed text-zinc-100"
                buttonClass="w-full px-2 py-1.5 rounded-lg hover:bg-zinc-900/60"
                externalState={
                  playing ? { playing: isActive, wordIdx: isActive ? wordIdx : null } : undefined
                }
              />
              {showTranslation && (
                <p className={`text-sm text-zinc-400 ${KARAOKE_INDENT}`}>{isA ? s.vi : s.en}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Trình phát 1 hội thoại (tab Hội thoại) — 2 giọng theo speakerA/BGender ────
function DialoguePlayer({
  entry,
  isA,
  T,
  plan,
  showTranslation,
  onToggleTranslation,
  onBack,
}: {
  entry: DialogueEntry
  isA: boolean
  T: Lang
  plan: Plan
  showTranslation: boolean
  onToggleTranslation: () => void
  onBack: () => void
}) {
  const { dialogue } = entry
  const [playing, setPlaying] = useState(false)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [wordIdx, setWordIdx] = useState<number | null>(null)
  const stopRef = useRef(false)

  // Chọn giọng cho A/B theo giới tính nhân vật (mẫu tái dùng từ CefrLessonViews.tsx
  // DialogueView) — đổi mỗi lần mở hội thoại khác.
  const voices = useMemo<{ voiceA: Voice; voiceB: Voice }>(() => {
    const genderA = dialogue.speakerAGender ?? 'female'
    const genderB = dialogue.speakerBGender ?? 'male'
    const a = pickRandomVoice(genderA, plan)
    let b = pickRandomVoice(genderB, plan)
    for (let i = 0; i < 5 && b === a; i++) b = pickRandomVoice(genderB, plan)
    return { voiceA: a, voiceB: b }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue.titleEn])

  useEffect(
    () => () => {
      stopRef.current = true
      stopSpeaking()
    },
    [],
  )

  async function playAll() {
    if (dialogue.lines.length === 0) return
    unlockAudio()
    stopRef.current = false
    setPlaying(true)
    const lang = isA ? 'en-US' : 'vi-VN'
    for (let i = 0; i < dialogue.lines.length; i++) {
      if (stopRef.current) break
      const ln = dialogue.lines[i]
      if (!ln) continue
      setActiveIdx(i)
      setWordIdx(null)
      const voice = ln.who === 'A' ? voices.voiceA : voices.voiceB
      await speak(isA ? ln.en : ln.vi, lang, voice, undefined, (wi) => setWordIdx(wi))
      if (!stopRef.current) await new Promise((r) => setTimeout(r, 300))
    }
    stopRef.current = false
    setPlaying(false)
    setActiveIdx(null)
    setWordIdx(null)
  }

  function stopAll() {
    stopRef.current = true
    stopSpeaking()
    setPlaying(false)
    setActiveIdx(null)
    setWordIdx(null)
  }

  const targetLang = isA ? 'en-US' : 'vi-VN'

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="tap-44 text-sm text-zinc-400 hover:text-zinc-200 transition px-2 -ml-2"
        >
          ← {isA ? 'Quay lại' : 'Back'}
        </button>
        <h2 className="font-semibold text-white truncate flex-1">
          {isA ? dialogue.titleVi : dialogue.titleEn}
        </h2>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {!playing ? (
          <button
            onClick={playAll}
            className="tap-44 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-sm font-medium transition"
          >
            <Play className="w-4 h-4 fill-current" />
            {T.playWholeDialogue}
          </button>
        ) : (
          <button onClick={stopAll} className={buttonClass({ variant: 'outline' })}>
            <Square className="w-4 h-4 fill-current" />
            {isA ? 'Dừng' : 'Stop'}
          </button>
        )}
        <button
          onClick={onToggleTranslation}
          aria-pressed={showTranslation}
          className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44 ml-auto' })}
        >
          {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showTranslation ? T.hideTranslation : T.showTranslation}
        </button>
      </div>

      <div className="space-y-2">
        {dialogue.lines.map((ln, i) => {
          const isActive = playing && activeIdx === i
          const speakerName =
            ln.who === 'A'
              ? isA
                ? (dialogue.speakerA?.vi ?? 'A')
                : (dialogue.speakerA?.en ?? 'A')
              : isA
                ? (dialogue.speakerB?.vi ?? 'B')
                : (dialogue.speakerB?.en ?? 'B')
          return (
            <div
              key={i}
              className={`rounded-lg p-2 ${isActive ? 'bg-accent-500/10' : 'bg-zinc-900/50'}`}
            >
              <p className="text-[0.6875rem] text-zinc-500 font-medium mb-0.5">{speakerName}</p>
              <KaraokeText
                text={isA ? ln.en : ln.vi}
                lang={targetLang}
                textClass="text-[0.9375rem] leading-relaxed text-zinc-100"
                buttonClass="w-full"
                externalState={
                  playing ? { playing: isActive, wordIdx: isActive ? wordIdx : null } : undefined
                }
              />
              {showTranslation && (
                <p className={`text-sm text-zinc-400 ${KARAOKE_INDENT}`}>{isA ? ln.vi : ln.en}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

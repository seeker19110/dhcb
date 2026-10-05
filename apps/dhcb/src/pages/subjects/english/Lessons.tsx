// Lessons — trang Bài học (hội thoại mẫu). [2026-09-06] File này từng dài 1.693 dòng; các phần
// SearchBar · LessonList · LessonView · InlinePronounce · WordText · hằng dùng chung nay nằm ở
// `pages/subjects/english/lessons/`, file này chỉ còn TRANG CHÍNH. `InlinePronounce` re-export
// để `components/CefrLessonViews.tsx` giữ nguyên đường import.
//
// [S09c, 2026-09-24 — spec 2026-09-23 §2.7] Bài đang mở nay nằm trên URL (`?lesson=N`), không còn
// ở state: mở thẳng/tải lại/Back/Forward đều ra đúng bài. Thứ tự: chỉ mục → xác minh mã bài →
// nạp chunk → kiểm `id` bài nạp về → LessonView tự giải hash. Mã sai (rỗng/lặp/sai cú pháp/không
// tồn tại) báo NGAY tại danh sách, không mở bài khác; lỗi mạng/HTTP/dữ liệu có "Thử lại" riêng,
// không bị gọi là "không tìm thấy bài".
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { useState, useEffect, useDeferredValue, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import { Play, Loader2 } from 'lucide-react'
import { ContinueRow } from '../../../components/learning/ContinueCard'
import Layout from '../../../components/Layout'
import { PageShell, MAIN_CONTENT_ID } from '@core/PageShell'
import { TwoPane } from '@core/TwoPane'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { getDirection } from '../../../lib/storage'
import { useAuth } from '../../../context/useAuth'
import { getViewedIds, markViewed } from '../../../lib/viewedTracking'
import { loadIndex, loadLesson, type Lesson, type LessonMeta } from '../../../data/lessons/loader'
import {
  cayBaiHoiThoai,
  docThamSoBai,
  searchBoBai,
  searchVoiBai,
} from '../../../lib/englishLessonAnchors'
import OutlinePrevNext from '../../../components/OutlinePrevNext'
import type { Direction } from '../../../types'
import { getColor } from './lessons/shared'
import { SearchBar } from './lessons/SearchBar'
import { LessonList } from './lessons/LessonList'
import { LessonView } from './lessons/LessonView'

export { InlinePronounce } from './lessons/InlinePronounce'

// Id DOM cố định của các khối trạng thái trên trang (đích focus bằng mã lệnh).
const ID_DANH_SACH = 'danh-sach-bai'
const ID_BAI_SAI = 'bai-khong-mo-duoc'
const ID_LOI_TAI = 'loi-tai-bai'

type ChiMuc =
  | { trangThai: 'dang-tai'; lan: number }
  | { trangThai: 'loi'; lan: number }
  | { trangThai: 'xong'; lan: number; ds: LessonMeta[] }

type KetQuaTaiBai =
  | { id: number; lan: number; trangThai: 'xong'; lesson: Lesson }
  | { id: number; lan: number; trangThai: 'loi' }

// Khối báo lỗi tải có nút "Thử lại" — dùng chung cho chỉ mục và nội dung bài.
function LoiTai({
  isA,
  tieuDe,
  onThuLai,
  onVeDanhSach,
}: {
  isA: boolean
  tieuDe: string
  onThuLai: () => void
  /** Có khi lỗi thuộc một BÀI: cho lối về danh sách ngoài "Thử lại". */
  onVeDanhSach?: () => void
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-6 text-center">
      <h2
        id={ID_LOI_TAI}
        tabIndex={-1}
        className="text-base font-semibold text-white focus:outline-none focus-visible:underline"
      >
        {tieuDe}
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        {isA
          ? 'Có thể mạng đang chập chờn hoặc máy chủ tạm lỗi. Bài học vẫn còn — thử tải lại nhé.'
          : 'The network or server may be having trouble. The lesson still exists — please try again.'}
      </p>
      <button
        type="button"
        onClick={onThuLai}
        className="tap-44 mt-4 inline-flex items-center justify-center rounded-xl bg-accent-500/20 px-4 py-2 text-sm font-semibold text-accent-300 theme-light:text-accent-800 hover:bg-accent-500/30 transition"
      >
        {isA ? 'Thử lại' : 'Try again'}
      </button>
      {onVeDanhSach && (
        <button
          type="button"
          onClick={onVeDanhSach}
          className="tap-44 mt-4 ml-3 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 underline underline-offset-4"
        >
          {isA ? 'Về danh sách' : 'Back to list'}
        </button>
      )}
    </div>
  )
}

// ── Trang chính ───────────────────────────────────────────────────────────────
export default function Lessons() {
  usePageTitle('Bài học | Môn tiếng Anh · Đồng hành cùng bạn')
  const dir: Direction = getDirection()
  const isA = dir === 'A'
  // Ngưỡng 1024px quyết ở JS, không phải `lg:` — xem lý do trong `TwoPane.tsx`: ẩn bằng CSS
  // vẫn để nguyên nội dung trong DOM cả hai nhánh, khiến trình đọc màn hình đọc hai lần.
  const isDesktop = useIsDesktopViewport()
  const { user } = useAuth()
  const uid = user?.id ?? ''
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  // ── Chỉ mục bài (có Thử lại) ────────────────────────────────────────────────
  const [chiMuc, setChiMuc] = useState<ChiMuc>({ trangThai: 'dang-tai', lan: 0 })
  const lanTaiChiMuc = chiMuc.lan
  useEffect(() => {
    let alive = true
    loadIndex().then(
      (ds) => {
        if (alive) setChiMuc({ trangThai: 'xong', lan: lanTaiChiMuc, ds })
      },
      () => {
        if (alive) setChiMuc({ trangThai: 'loi', lan: lanTaiChiMuc })
      },
    )
    return () => {
      alive = false
    }
  }, [lanTaiChiMuc])
  const index = useMemo(() => (chiMuc.trangThai === 'xong' ? chiMuc.ds : []), [chiMuc])
  // Cây phẳng cho "Bài trước / Bài sau" — cùng component với bài STEM/Lập trình.
  const cayBai = useMemo(
    () => cayBaiHoiThoai(index, location.pathname, location.search),
    [index, location.pathname, location.search],
  )

  // ── Bài được chọn: đọc từ URL, đối chiếu chỉ mục ──────────────────────────────
  const thamSo = docThamSoBai(location.search)
  const selectedMeta = thamSo.loai === 'so' ? (index.find((m) => m.id === thamSo.id) ?? null) : null
  const dangChoChiMuc = thamSo.loai === 'so' && chiMuc.trangThai === 'dang-tai'
  const baiSai =
    thamSo.loai === 'sai' ||
    (thamSo.loai === 'so' && chiMuc.trangThai === 'xong' && selectedMeta === null)

  // ── Nạp nội dung bài (có Thử lại) ─────────────────────────────────────────────
  // "Đang tải" là SUY RA (kết quả hiện có không thuộc đúng bài/lần tải) chứ không phải state
  // riêng → không setState đồng bộ trong effect, và response của bài cũ không bao giờ khớp.
  const [lanTaiBai, setLanTaiBai] = useState(0)
  const [taiBai, setTaiBai] = useState<KetQuaTaiBai | null>(null)
  useEffect(() => {
    if (!selectedMeta) return
    let alive = true
    const id = selectedMeta.id
    loadLesson(selectedMeta).then(
      (l) => {
        if (!alive) return
        // Chốt chặn cuối: bài nạp về phải đúng mã đã xin, không thì coi là lỗi dữ liệu.
        setTaiBai(
          l.id === id
            ? { id, lan: lanTaiBai, trangThai: 'xong', lesson: l }
            : { id, lan: lanTaiBai, trangThai: 'loi' },
        )
      },
      () => {
        if (alive) setTaiBai({ id, lan: lanTaiBai, trangThai: 'loi' })
      },
    )
    return () => {
      alive = false
    }
  }, [selectedMeta, lanTaiBai])
  const ketQuaBai =
    selectedMeta && taiBai && taiBai.id === selectedMeta.id && taiBai.lan === lanTaiBai
      ? taiBai
      : null
  const lesson = ketQuaBai?.trangThai === 'xong' ? ketQuaBai.lesson : null
  const loiTaiBai = ketQuaBai?.trangThai === 'loi'

  // Đánh dấu "đã xem" khi MỞ bài — theo mã bài, KHÔNG theo hash, nên nhảy lượt không chạy lại.
  // CTA "Tiếp tục bài N" đọc trực tiếp localStorage mỗi render nên tự tính lại đúng.
  const idDangMo = selectedMeta?.id ?? null
  useEffect(() => {
    if (uid && idDangMo !== null) markViewed('lessons', uid, String(idDangMo))
  }, [idDangMo, uid])

  // ── Điều hướng ─────────────────────────────────────────────────────────────
  /** Chọn một bài: đúng MỘT history entry; chọn lại đúng bài đang mở (không hash) chỉ focus. */
  function chonBai(meta: LessonMeta) {
    if (selectedMeta?.id === meta.id && location.hash === '') {
      document.getElementById('dau-bai')?.focus()
      return
    }
    navigate({
      pathname: location.pathname,
      search: searchVoiBai(location.search, meta.id),
      hash: '',
    })
  }

  /** "Danh sách": bỏ lesson + hash một cách xác định (không `navigate(-1)` vô điều kiện). */
  function veDanhSach() {
    navigate({ pathname: location.pathname, search: searchBoBai(location.search), hash: '' })
  }

  // Focus theo trạng thái trang, mỗi lần location đổi:
  //  · mã bài sai → heading thông báo tại danh sách;
  //  · vừa rời một bài về danh sách (nút "Danh sách" hoặc Back) → thẻ bài vừa mở nếu còn hiện,
  //    không thì heading danh sách.
  const baiTruocRef = useRef<number | null>(null)
  useEffect(() => {
    const baiTruoc = baiTruocRef.current
    baiTruocRef.current = idDangMo
    if (baiSai) {
      document.getElementById(ID_BAI_SAI)?.focus()
      return
    }
    if (idDangMo === null && baiTruoc !== null && thamSo.loai === 'khong') {
      const the = document.getElementById(`lesson-card-${baiTruoc}`)
      ;(the ?? document.getElementById(ID_DANH_SACH))?.focus()
    }
  }, [location.key, baiSai, idDangMo, thamSo.loai])

  // Lỗi tải hiện ra → đưa focus tới heading lỗi để trình đọc màn hình đọc ngay.
  const coLoi = loiTaiBai || chiMuc.trangThai === 'loi'
  useEffect(() => {
    if (coLoi) document.getElementById(ID_LOI_TAI)?.focus()
  }, [coLoi])

  function thuLaiChiMuc() {
    setChiMuc({ trangThai: 'dang-tai', lan: chiMuc.lan + 1 })
  }

  // Bài đầu tiên (theo thứ tự danh sách) CHƯA xem — gợi ý "Tiếp tục bài N". Đây là gợi ý bài
  // CHƯA XEM, KHÔNG phải khôi phục lượt đang học dở (S09 không lưu vị trí trong bài).
  const nextUnviewed = (() => {
    if (!uid || index.length === 0) return null
    const viewed = getViewedIds('lessons', uid)
    // Bài ĐANG MỞ coi như đã xem ngay trong lượt render này: `markViewed` chạy ở effect (SAU
    // commit) và không setState, nên nếu chỉ đọc localStorage thì gợi ý vẫn trỏ vào chính bài
    // đang mở cho tới lần render kế tiếp.
    return index.find((m) => m.id !== idDangMo && !viewed.has(String(m.id))) ?? null
  })()

  // Gợi ý "Tiếp tục bài N" — dùng chung cho cả màn danh sách mobile lẫn cột trái desktop.
  const continueCta = nextUnviewed && !query.trim() && (
    <ContinueRow
      label={isA ? 'Tiếp tục' : 'Continue'}
      title={isA ? `Bài ${nextUnviewed.id}: ${nextUnviewed.title}` : `Lesson ${nextUnviewed.id}`}
      onClick={() => chonBai(nextUnviewed)}
      className="mb-4"
    />
  )

  // Thông báo mã bài sai — tại danh sách, focus heading (spec §2.7 mục 2).
  const thongBaoBaiSai = baiSai && (
    <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <h2
        id={ID_BAI_SAI}
        tabIndex={-1}
        className="text-sm font-semibold text-white focus:outline-none focus-visible:underline"
      >
        {isA ? 'Không mở được bài này' : 'This lesson could not be opened'}
      </h2>
      <p className="mt-1 text-sm text-zinc-300">
        {/* Desktop: thông báo nằm ở cột phải, danh sách ở cột TRÁI — không nói "bên dưới". */}
        {isA
          ? `Đường dẫn không trỏ tới bài hội thoại nào có trong danh sách. Hãy chọn một bài ${isDesktop ? 'ở cột bên trái' : 'bên dưới'}.`
          : `The link does not point to any dialogue in the list. Please pick one ${isDesktop ? 'from the list on the left' : 'below'}.`}
      </p>
    </div>
  )

  const dangTai = (
    <div className="flex items-center justify-center py-24 text-zinc-400" role="status">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      {isA ? 'Đang tải bài học…' : 'Loading lesson…'}
    </div>
  )

  const loiChiMuc = chiMuc.trangThai === 'loi' && (
    <LoiTai
      isA={isA}
      tieuDe={isA ? 'Không tải được danh sách bài' : 'Could not load the lesson list'}
      onThuLai={thuLaiChiMuc}
    />
  )

  // Nội dung chi tiết bài (dùng chung hai khuôn). `key` theo bài/owner/chiều: đổi một trong ba là
  // remount LessonView → mọi audio/ghi âm/chấm/kết quả trong bộ nhớ của lần mở cũ bị huỷ sạch.
  function chiTiet(variant: 'mobile' | 'desktop') {
    if (!selectedMeta) return null
    if (loiTaiBai) {
      return (
        <LoiTai
          isA={isA}
          tieuDe={
            isA
              ? `Không tải được bài ${selectedMeta.id}: ${selectedMeta.title}`
              : `Could not load lesson ${selectedMeta.id}`
          }
          onThuLai={() => setLanTaiBai((n) => n + 1)}
          {...(variant === 'mobile' ? { onVeDanhSach: veDanhSach } : {})}
        />
      )
    }
    if (!lesson) return dangTai
    return (
      <LessonView
        key={`${lesson.id}:${uid}:${dir}`}
        lesson={lesson}
        isA={isA}
        color={getColor(selectedMeta.id)}
        plan={user?.plan ?? 'free'}
        userId={uid}
        {...(variant === 'desktop' ? { variant } : {})}
        footer={
          <OutlinePrevNext
            outline={cayBai}
            contentId={String(lesson.id)}
            {...(isA
              ? {}
              : {
                  labels: {
                    nav: 'Previous and next lesson',
                    prev: 'Previous',
                    next: 'Next',
                  },
                })}
          />
        }
      />
    )
  }

  // ── Desktop (≥1024px): MỘT màn hình master–detail ─────────────────────────
  // Trước đây desktop đi đúng luồng của điện thoại: danh sách BỊ THAY THẾ bởi chi tiết. Muốn
  // đổi bài phải quay lại rồi cuộn tìm lại từ đầu, trong khi màn 1280px thừa chỗ để giữ cả hai.
  if (isDesktop) {
    return (
      <div className="min-h-dvh bg-zinc-950">
        {/* `focus`: trang ngồi học lâu → ẩn bộ chuyển Studio + huy hiệu streak (xem Layout).
            [S09c] Không truyền title/subtitle bài: tên bài đã là <h1> trong nội dung. */}
        <Layout backTo={duongDanMonTiengAnh()} back focus />
        <PageShell width="standard" baseWidth="max-w-3xl">
          <TwoPane
            isDesktop
            railSide="left"
            railLabel={isA ? 'Danh sách bài hội thoại' : 'Dialogue list'}
            skipRailLabel={isA ? 'Bỏ qua danh sách, tới bài' : 'Skip the list, go to the lesson'}
            rail={
              <div className="pr-1">
                <h2
                  id={ID_DANH_SACH}
                  tabIndex={-1}
                  className="t-label px-1 pb-2 text-zinc-300 focus:outline-none"
                >
                  {isA ? `${index.length} bài hội thoại` : `${index.length} dialogues`}
                </h2>
                <div className="mb-3">
                  <SearchBar query={query} setQuery={setQuery} isA={isA} variant="desktop" />
                </div>
                {continueCta}
                {loiChiMuc}
                <LessonList
                  lessons={index}
                  isA={isA}
                  query={deferredQuery}
                  onSelect={chonBai}
                  compact
                  {...(selectedMeta ? { selectedId: selectedMeta.id } : {})}
                />
              </div>
            }
          >
            {selectedMeta ? (
              chiTiet('desktop')
            ) : dangChoChiMuc ? (
              dangTai
            ) : baiSai ? (
              thongBaoBaiSai
            ) : (
              // Màn rỗng: KHÔNG tự chọn bài thay người dùng — mở sẵn một bài bất kỳ thì lần
              // sau quay lại họ không phân biệt được đâu là bài mình đang học dở.
              <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/15">
                  <Play className="h-5 w-5 text-accent-400 theme-light:text-accent-800" />
                </div>
                <p className="text-base font-semibold text-white">
                  {isA ? 'Chọn một bài hội thoại để bắt đầu' : 'Pick a dialogue to start'}
                </p>
                <p className="read-body mx-auto mt-2 max-w-sm text-sm text-zinc-400">
                  {isA
                    ? 'Danh sách bài nằm ở cột bên trái và luôn hiện sẵn, nên bạn đổi bài lúc nào cũng được mà không rời trang.'
                    : 'The lesson list stays on the left, so you can switch lessons at any time without leaving this page.'}
                </p>
              </div>
            )}
          </TwoPane>
        </PageShell>
      </div>
    )
  }

  // ── Màn hình chi tiết bài học (mobile) ────────────────────────────────────
  if (selectedMeta || dangChoChiMuc) {
    return (
      <div className="h-[calc(100dvh-var(--bnav-h))] overflow-hidden bg-zinc-950 flex flex-col">
        {/* [2026-10-01, audit đồng nhất bố cục] `focus` như khuôn desktop và như bài STEM/Lập
            trình/truyện: trước đây riêng khuôn mobile này còn thanh điều hướng đáy + dải
            Reachability chiếm ~128px suốt buổi học. Thanh đáy ẩn thì `--bnav-h` = 0 (index.css)
            nên khung cao cố định phía trên tự giãn hết màn.
            [2026-10-02] Nút Back của header lùi ĐÚNG một bước về danh sách bài (trước đây nhảy
            thẳng về trang môn, còn thanh công cụ bài có thêm nút "← Danh sách" riêng — hai nút
            quay lại cho hai đích, tốn một hàng trên màn nhỏ). `crumbs` chỉ để NHÃN nút nói đúng
            nơi nó đưa về ("Danh sách bài hội thoại", như nhãn cột trái của khuôn desktop). */}
        <Layout
          onBack={veDanhSach}
          back
          focus
          crumbs={[
            { label: isA ? 'Danh sách bài hội thoại' : 'Dialogue list', to: location.pathname },
            { label: selectedMeta?.title ?? (isA ? 'Bài hội thoại' : 'Dialogue'), to: '' },
          ]}
        />
        {/* <main> = đích "Bỏ qua tới nội dung chính" — khuôn này không đi qua `PageShell` nên
            phải tự dựng (trước đây trang không có landmark <main>, liên kết bỏ qua trỏ vào hư
            không). `min-h-0` cho vùng cuộn nội bộ của bài co đúng trong cột flex. */}
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex min-h-0 flex-1 flex-col focus:outline-none"
        >
          {selectedMeta && lesson && !loiTaiBai ? (
            chiTiet('mobile')
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {selectedMeta ? chiTiet('mobile') : dangTai}
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Màn hình danh sách ────────────────────────────────────────────────────
  // Mobile: h-dvh flex col, search cố định dưới cùng
  // Desktop (sm+): layout thường, search ở trên
  return (
    <div className="bg-zinc-950 flex flex-col h-[calc(100dvh-var(--bnav-h))] sm:h-auto sm:block sm:min-h-dvh">
      <Layout
        backTo={duongDanMonTiengAnh()}
        back
        title={isA ? 'Các bài hội thoại mẫu thông dụng' : 'Common sample dialogues'}
      />

      {/* <div> chứ không phải <main>: landmark <main> do PageShell render bên trong. */}
      <div className="flex-1 overflow-y-auto sm:overflow-visible sm:flex-none">
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] Danh sách bài hội thoại → width standard. */}
        <PageShell
          width="standard"
          baseWidth="max-w-3xl"
          className="!pt-4 !pb-2 sm:!pb-[calc(1.5rem+var(--bnav-h))]"
        >
          <h1 id={ID_DANH_SACH} tabIndex={-1} className="sr-only focus:outline-none">
            {isA ? 'Các bài hội thoại mẫu thông dụng' : 'Common sample dialogues'}
          </h1>
          {thongBaoBaiSai}
          {/* Gợi ý "Tiếp tục bài N" — bài đầu tiên chưa xem, ẩn khi đang tìm kiếm */}
          {continueCta}
          {/* Search bar — chỉ hiện ở trên trên desktop */}
          <div className="hidden sm:block mb-4">
            <SearchBar query={query} setQuery={setQuery} isA={isA} variant="desktop" />
          </div>
          {loiChiMuc}
          <LessonList lessons={index} isA={isA} query={deferredQuery} onSelect={chonBai} />
        </PageShell>
      </div>

      {/* Search bar cố định ở dưới — CHỈ trên mobile */}
      <div className="sm:hidden shrink-0 border-t border-zinc-800/40 bg-zinc-950/95 backdrop-blur-md px-4 pt-3 pb-safe">
        <SearchBar query={query} setQuery={setQuery} isA={isA} variant="mobile" />
      </div>
    </div>
  )
}

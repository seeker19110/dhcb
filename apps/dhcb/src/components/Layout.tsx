import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, BookOpen, Bot, Home as HomeIcon } from 'lucide-react'
import { useLang } from '../context/useLang'
import { useAuth } from '../context/useAuth'
import { getStreak } from '../lib/storage'
import ThemeToggle from './ThemeToggle'
import OfflineStatusBanner from './OfflineStatusBanner'
import { buildCrumbs, defaultBackDestination, type Crumb } from '../lib/breadcrumb'
import { useIsDesktopViewport } from '../lib/useIsDesktopViewport'

/**
 * Đọc `document.documentElement.dataset.sidebar` ('expanded' | 'collapsed' | 'off' | 'none') mà
 * `DesktopSidebar.tsx` tự ghi khi mở/thu gọn — theo dõi bằng MutationObserver vì đây là state
 * của MỘT component khác, không có qua props/context (cùng cơ chế đã dùng cho `--sidebar-w`).
 * Layout dùng giá trị này để ẩn nút "Trang chủ" ở header khi sidebar đang MỞ RỘNG (hai lối về
 * trang chủ đứng cạnh nhau, xem cột trái của sidebar) — thu gọn/tắt sidebar thì hiện lại.
 */
function useSidebarDataset(): string | undefined {
  const [value, setValue] = useState<string | undefined>(
    () => document.documentElement.dataset.sidebar,
  )
  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setValue(root.dataset.sidebar))
    observer.observe(root, { attributes: true, attributeFilter: ['data-sidebar'] })
    return () => observer.disconnect()
  }, [])
  return value
}

// Trang chủ NỀN TẢNG (landing "Đồng Hành Cùng Bạn", app `@dhcb/hub` — domain gốc, KHÁC domain
// môn Anh app này đang chạy). Cùng khuôn với ShareResultCard.tsx/App.tsx: cho đổi qua
// VITE_SITE_URL (staging), mặc định domain production hiện tại.
const HUB_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://www.donghanhcungban.org'

interface Props {
  // title/subtitle KHÔNG bắt buộc: nhiều trang nay hiển thị tiêu đề LỚN ngay dưới header
  // (component PageHeader) thay vì nhồi trong thanh header này.
  title?: string
  subtitle?: string
  back?: boolean
  // Đích đến khi bấm back — mặc định về Trang chủ ('/'). Trang có PHÂN CẤP điều hướng riêng
  // (vd CefrLevelPage: cấp → vòng từ vựng/bài ngữ pháp/hội thoại) truyền hàm này để back luôn
  // lùi ĐÚNG 1 BƯỚC theo cấp bậc đó, KỂ CẢ khi người dùng vào "tắt" từ Home (vd nút "Học tiếp"
  // nhảy thẳng vào 1 cấp) — không phụ thuộc lối vào, back luôn nhất quán theo cấu trúc trang.
  onBack?: () => void
  /**
   * [Slice 03] Đích của nút Back dạng ĐƯỜNG DẪN — cho trang không có phân cấp riêng nhưng thuộc
   * một môn (công cụ Tiếng Anh → trang tổng quan môn). `onBack` (hàm) vẫn ưu tiên hơn.
   */
  backTo?: string
  // Đốt cha ĐỘNG cho breadcrumb desktop: trang lồng sâu có tên cha mà cây route TĨNH không
  // biết (vd bài học của hướng "Lập trình Web") tự truyền vào đây. Xem lib/breadcrumb.ts.
  crumbs?: readonly Crumb[]
  extra?: ReactNode
  /**
   * CHẾ ĐỘ TẬP TRUNG — dành cho trang NGỒI HỌC LÂU (bài học, truyện, bài ngữ pháp).
   *
   * Header mặc định mang các khe: Back · breadcrumb · title · streak · `extra` · nút AI ·
   * đổi giao diện · avatar. Trên trang tra cứu thì chấp nhận được, nhưng trên trang đọc lâu
   * thì huy hiệu streak (điểm số, thuộc về `/tien-do`) KHÔNG phục vụ việc đang làm — nằm
   * trong tầm mắt suốt buổi học và mời người ta rời đi.
   *
   * Bật cờ này thì ẩn streak. KHÔNG ẩn: Back/breadcrumb (đường lùi), nút Bạn Đồng Hành (trợ
   * giúp NGAY TRONG lúc học), đổi giao diện (a11y), avatar.
   */
  focus?: boolean
}

export default function Layout({
  title,
  subtitle,
  back = true,
  onBack,
  backTo,
  crumbs,
  extra,
  focus = false,
}: Props) {
  const nav = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { T } = useLang()
  // [P0-4, 2026-09-17] Dưới 1024px, header chỉ giữ 4 khe (Back/Logo · title · AI/streak ·
  // avatar) — nút đổi giao diện chuyển hẳn sang trang Hồ sơ và `/cai-dat`. [2026-09-20] Bộ
  // chuyển Studio (dropdown "Studio" ở header) đã GỠ HẲN khỏi Layout — ô chọn miền trùng lặp
  // với sidebar/trang Hồ sơ, không còn phục vụ mục đích riêng nào ở đây.
  const isDesktop = useIsDesktopViewport()
  // Sidebar đang MỞ RỘNG thì ẩn nút "Trang chủ" ở header (trùng với nút "Trang chủ" đứng đầu
  // sidebar) — thu gọn ('collapsed') hoặc không có sidebar ('off'/trang đăng nhập) thì hiện lại.
  const sidebarState = useSidebarDataset()
  const showHubHomeLink = isDesktop && sidebarState !== 'expanded'

  // Streak tự lấy ở ĐÂY (không nhận qua prop nữa) — áp dụng TOÀN CỤC, hiện trên MỌI
  // trang có Layout, không cần từng trang tự truyền vào (trước đây dễ quên).
  const streak = user && !focus ? getStreak(user.id) : 0

  // [2026-09-17] Nhãn nút Back lấy từ ĐÚNG đốt cha mà `onBack`/`backTo` sẽ đưa tới — dùng
  // chung nguồn `buildCrumbs` (trước đây Breadcrumb desktop dùng riêng) thay vì nhãn CỨNG
  // "Trang chủ": nút Back nhiều trang không hề về Trang chủ (vd bài học Lập trình lùi về
  // đúng bậc P3), nên nhãn cứng vừa sai vừa lặp chữ với đốt "Trang chủ" của Breadcrumb ngay
  // bên dưới — bỏ luôn Breadcrumb, một nút Back với NHÃN ĐÚNG đã trả lời đủ "đi đâu tiếp".
  const ancestors = buildCrumbs(location.pathname, title, crumbs).slice(0, -1)
  const backLabel = ancestors[ancestors.length - 1]?.label ?? T.home
  // [2026-10-01, audit đồng nhất bố cục] Đích MẶC ĐỊNH của nút Back = đúng đốt cha đang làm
  // nhãn. Trước đây mặc định cứng là '/', nên 21 trang không truyền `onBack`/`backTo` có nút
  // ghi "← Vật lý" / "← Tiến độ" / "← Hồ sơ" mà bấm lại về Trang chủ — nhãn nói một đằng, nút
  // làm một nẻo. Trang có cha là Trang chủ (Hồ sơ, Tiến độ…) vẫn về '/' như cũ.
  const backDest = backTo ?? defaultBackDestination(ancestors)

  // Phím tắt toàn cục (PR 4, thiết kế lại web cho desktop) — Layout render ở MỌI trang nên
  // đây là chỗ gắn 1 lần duy nhất, không phải lặp lại ở từng trang.
  //   /            — focus ô nhập TRÊN TRANG (input/textarea đầu tiên còn hiện, không disabled),
  //                  bỏ qua khi đang gõ sẵn trong 1 ô nhập khác (để không chặn gõ dấu "/" thật).
  useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false
      const tag = t.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable
    }
    function handleGlobalShortcut(e: KeyboardEvent) {
      if (e.key === '/' && !isTypingTarget(e.target)) {
        // Ưu tiên Ô NHẬP CHÍNH của trang (trang tự đánh dấu bằng `data-primary-input`).
        // Không có thì mới lấy ô nhập đầu tiên trong DOM như cũ — trước đây chỉ có nhánh
        // sau nên "/" hay nhảy vào ô tìm kiếm phụ ở header thay vì ô chính (audit B20).
        const el =
          document.querySelector<HTMLElement>(
            '[data-primary-input]:not([disabled]):not([hidden])',
          ) ??
          document.querySelector<HTMLElement>(
            'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])',
          )
        if (el) {
          e.preventDefault()
          el.focus()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalShortcut)
    return () => window.removeEventListener('keydown', handleGlobalShortcut)
  }, [])

  // [P0-4] Cờ CHẾ ĐỘ TẬP TRUNG toàn cục — `BottomNav` đọc `[data-focus='1']` qua CSS
  // (index.css) để tự ẩn, cùng cơ chế `document.documentElement.dataset.sidebar` của
  // `DesktopSidebar`. Dọn dẹp khi `focus` tắt HOẶC khi Layout unmount (đổi trang), không để
  // sót cờ khiến trang kế tiếp mất luôn thanh điều hướng.
  useEffect(() => {
    const root = document.documentElement
    if (focus) root.dataset.focus = '1'
    else delete root.dataset.focus
    return () => {
      delete root.dataset.focus
    }
  }, [focus])

  // [S07d] Chiều cao THẬT của header sticky → biến `--app-header-h` trên <html>, để CSS
  // (index.css, `html[data-kbd-nav] { scroll-padding-top }`) chừa đúng khoảng đó khi trình
  // duyệt cuộn phần tử đang focus vào tầm nhìn. Thiếu nó, Shift+Tab đưa nút lên mép trên và
  // header che mất hoàn toàn (WCAG 2.4.11 — probe 25/09). Đo bằng ResizeObserver vì header
  // đổi cao theo safe-area/nhãn, một hằng số cứng sẽ lệch.
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const root = document.documentElement
    const update = () => root.style.setProperty('--app-header-h', `${header.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(header)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--app-header-h')
    }
  }, [])

  // Nội dung huy hiệu streak — dùng chung cho cả hai lớp bọc bên dưới.
  const streakBadge = (
    <>
      <span className="text-base leading-none">🔥</span>
      <span className="text-sm font-bold text-orange-400 theme-light:text-orange-900 leading-none">
        {streak}
      </span>
      <span className="text-[11px] font-medium text-orange-400 theme-light:text-orange-800 leading-none">
        {T.streakDays}
      </span>
    </>
  )

  return (
    <header
      ref={headerRef}
      className="app-header sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 relative pt-safe shadow-sm"
    >
      {/* Gradient accent line trên cùng */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />

      <OfflineStatusBanner />

      {/* [2026-09-02, đợt 2 thiết kế lại desktop] Bề rộng desktop đổi 5xl → 6xl để KHỚP MÉP với
          nội dung trang. Đo thật ở 1440px trước khi sửa: header 336→1360 trong khi nội dung các
          trang có cột phải (Trang chủ, Tiến độ, Luyện viết, CEFR) là 288→1408 — tức nội dung
          THÒ RA 48px mỗi bên so với header, nhìn như hai lớp lệch nhau. 1152px (`max-w-6xl`) nay
          là bề rộng chuẩn của app: `PageShell` cấp `standard` dùng đúng giá trị này. */}
      {/* [thiết kế lại header desktop] Bề rộng header nay TRÀN HẾT màn hình từ 1024px trở lên
          (không còn `mx-auto max-w-6xl` bó giữa) — nút "Trang chủ" mới ghim sát MÉP TRÁI thật
          sự, không phải mép trái của khối nội dung 1152px. Dưới 1024px giữ nguyên bố cục cũ
          (căn giữa `max-w-3xl`) vì mobile không có nút này. */}
      <div className="max-w-3xl lg:max-w-none mx-auto lg:mx-0 px-4 lg:px-6 h-14 flex items-center gap-3 relative">
        {/* Trang chủ NỀN TẢNG — chỉ desktop (mobile đã có tab "Trang chủ" ở BottomNav). Link
            RA NGOÀI app này (domain gốc `@dhcb/hub`), khác nút Back/Logo bên cạnh vốn điều
            hướng NỘI BỘ trong app môn Anh. Ẩn khi sidebar đang MỞ RỘNG: sidebar cũng có sẵn
            nút "Trang chủ" ở hàng đầu — hai nút cùng chữ đứng gần nhau là thừa. */}
        {showHubHomeLink && (
          <a
            href={HUB_URL}
            className="tap-44 hidden lg:flex items-center gap-1.5 text-zinc-400 hover:text-white transition shrink-0 -ml-1 p-2.5 rounded-xl hover:bg-zinc-800/60 active:scale-95"
            aria-label="Trang chủ Đồng Hành Cùng Bạn"
            title="Trang chủ Đồng Hành Cùng Bạn"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Trang chủ</span>
          </a>
        )}

        {/* Back / Logo */}
        {back ? (
          <button
            onClick={onBack ?? (() => nav(backDest))}
            aria-label={backLabel}
            // GIỮ hiện ở mọi kích thước — nhiều trang truyền `onBack` riêng để lùi ĐÚNG một
            // bậc theo phân cấp của trang đó (vd bài học Lập trình lùi về đúng chặng, không
            // phải P1). `backLabel` tính từ cùng cây route TĨNH của `buildCrumbs` nên khớp
            // đúng đích đó, thay vì nhãn cứng "Trang chủ" (sai khi đích không phải Trang chủ).
            className="tap-44 flex items-center gap-1.5 text-zinc-400 hover:text-white transition shrink-0 -ml-1 p-2.5 rounded-xl hover:bg-zinc-800/60 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{backLabel}</span>
          </button>
        ) : (
          // Logo "Đồng Hành" — bấm vào xem trang giới thiệu tính năng. CHỈ hiện ở MOBILE: từ
          // 1024px trở lên, nút "Trang chủ" (ra ngoài app, ở trên) đã đứng ngay chỗ này — hai
          // nút cùng một chỗ, cùng nói "trang chủ" nghe TRÙNG NHAU (ảnh chụp 2026-09-20).
          !isDesktop && (
            <Link
              to="/gioi-thieu"
              aria-label={T.aboutApp}
              title={T.aboutApp}
              className="tap-44 flex items-center gap-2.5 shrink-0 -ml-1 p-1.5 rounded-xl hover:bg-zinc-800/60 transition active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-accent-500 via-accent-400 to-indigo-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                lang="vi"
                className="font-bold text-sm text-white hidden sm:inline tracking-tight"
              >
                {T.appName}
              </span>
            </Link>
          )
        )}

        {/* Title/subtitle — như cũ, hiện ở MỌI kích thước. Không còn Breadcrumb riêng: nhãn
            nút Back ở trên đã lấy đúng đốt cha (xem `backLabel`), vẽ thêm breadcrumb là lặp
            chữ với chính nhãn đó (bài học 2026-09-17). */}
        {/* [U9a, WCAG 1.4.12] Tiêu đề XUỐNG DÒNG thay vì `truncate`: khi người dùng giãn chữ
            (khoảng cách chữ/dòng theo WCAG) tiêu đề dài bị cắt "…" mất chữ ở 390px. Tiêu đề quá
            dài nay thành 2 dòng, header cao thêm một chút nhưng không mất nội dung. */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-[15px] leading-snug break-words text-white">{title}</p>
          )}
          {subtitle && <p className="text-xs text-zinc-400 break-words">{subtitle}</p>}
        </div>

        {/* Streak — TOÀN CỤC.
            [2026-09-03, đợt B dọn header] Trước đây khối này viết HAI LẦN gần như giống hệt
            (một bản inline khi header có title, một bản căn giữa tuyệt đối khi không) — 12
            dòng JSX trùng nhau, sửa một bên quên bên kia là lệch. Nay nội dung huy hiệu tách
            ra một hằng số, chỉ còn lớp bọc là khác nhau.
            Bỏ `animate-pulse` trên 🔥: streak KHÔNG thay đổi trong lúc người dùng nhìn nó, mà
            luật mục 9 của `ui-ux-craftsman` chỉ cho phép nhấp nháy khi có thứ đang thay đổi
            thật. Một điểm chuyển động vĩnh viễn ngay cạnh nội dung học là hút mắt vô cớ. */}
        {streak > 0 &&
          (title || subtitle ? (
            // Header có cả title/subtitle LẪN nút "Đồng Hành AI" ở màn hẹp (390px) thì 3 phần tử
            // này tràn ngang (đo được 54px) — ẩn streak badge trên di động, chỉ hiện lại từ `sm`
            // trở lên khi đã đủ chỗ. Không mất thông tin: streak vẫn thấy ở /progress.
            <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/30 rounded-full px-3 py-1 shadow-sm shrink-0">
              {streakBadge}
            </div>
          ) : (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/30 rounded-full px-3 py-1 shadow-sm pointer-events-none">
              {streakBadge}
            </div>
          ))}

        {/* Nút tùy chỉnh thêm vào header (tuỳ trang truyền vào) */}
        {extra}

        {/* Nút truy cập nhanh Bạn Đồng Hành AI toàn cục.
            [P0-4, 2026-09-17] Ẩn trên Trang chủ MOBILE: Orb ở BottomNav và ô hỏi
            (HomeUniversalAiBar) đã là hai lối vào AI, nút thứ ba ở đây chỉ thêm khe không
            cần thiết trong 4 khe header di động. Trang khác (kể cả mobile) vẫn giữ — đây
            thường là lối AI DUY NHẤT ở đó. */}
        {/* `transition` (màu + transform), KHÔNG `transition-all`: hover đổi nền/viền, active đổi
            scale — `transition-all` còn làm viền lấy nét hiện dần 200ms (audit M17, changelog 0500). */}
        {(isDesktop || focus) && (
          <button
            onClick={() => nav('/ban-dong-hanh')}
            // [U4 · WCAG 3.1.2] nhãn viết cứng tiếng Việt — đúng giọng khi trang là tiếng Anh.
            lang="vi"
            aria-label="Mở Bạn Đồng Hành AI"
            title="Bạn Đồng Hành AI (Live Voice & Executive Suite)"
            className="tap-44 relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent-500/15 hover:bg-accent-500/25 border border-accent-500/30 text-accent-300 theme-light:text-accent-800 text-xs font-semibold transition active:scale-95 group shadow-sm shrink-0"
          >
            <Bot className="w-3.5 h-3.5 text-accent-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Đồng Hành AI</span>
            {/* [2026-09-03, đợt B] Gỡ chấm `animate-ping`: nó chạy VĨNH VIỄN trên mọi trang mà
                không báo hiệu bất cứ thay đổi nào — không có tin nhắn mới, không có tác vụ đang
                chạy. Đây là điểm chuyển động duy nhất luôn hiện trong tầm mắt lúc ngồi học. */}
          </button>
        )}

        {/* Nút đổi giao diện: Sáng / Tối / Xanh đêm — dưới 1024px đã có ở trang Hồ sơ/`/cai-dat`
            (P0-4), ẩn ở đây để header mobile chỉ còn 4 khe. */}
        {isDesktop && <ThemeToggle />}

        {/* User avatar + tên đầy đủ (bấm vào để xem trang cá nhân) */}
        {user && (
          <button
            onClick={() => nav('/trang-ca-nhan')}
            aria-label={T.profile}
            title={T.profile}
            className="tap-44 flex items-center gap-2 shrink-0 hover:opacity-90 transition active:scale-95 min-w-0 group"
          >
            <span className="w-7 h-7 rounded-full bg-zinc-800 ring-1.5 ring-accent-500/30 flex items-center justify-center text-xs font-bold text-zinc-100 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              {user.name[0]?.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-white truncate hidden sm:inline max-w-[10rem]">
              {user.name}
            </span>
          </button>
        )}
      </div>
    </header>
  )
}

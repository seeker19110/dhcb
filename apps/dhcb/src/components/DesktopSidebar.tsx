// DesktopSidebar — thanh điều hướng dọc CỐ ĐỊNH bên trái, CHỈ hiện từ 1024px trở lên
// (`hidden lg:flex`). Dưới ngưỡng đó vẫn là BottomNav như cũ, không đổi gì.
//
// Vì sao có file này: web trước đây là app mobile phóng to — 6 studio bị giấu trong một
// dropdown và thanh điều hướng chính nằm ở ĐÁY màn hình, chỗ con trỏ chuột phải đi xa
// nhất. Trên desktop, chiều dọc mới là thứ dư dả, nên điều hướng chuyển sang cột trái.
//
// Thu gọn được (icon-only): trạng thái lưu ở localStorage và ĐỒNG THỜI ghi lên
// `document.documentElement.dataset.sidebar`. Đó là mấu chốt — bề rộng thật của sidebar
// nằm ở biến CSS `--sidebar-w` (index.css) và nội dung trang chừa chỗ bằng
// `lg:pl-[var(--sidebar-w)]` (App.tsx), nên chỉ cần đổi một thuộc tính data là cả trang
// tự co giãn theo, không component nào phải biết về component nào.
//
// [2026-10-01, audit đồng nhất bố cục] Dải 1024–1279px (Material 3 "expanded") MẶC ĐỊNH thu gọn
// về dạng biểu tượng. Đo thật: ở 1024px thanh bên mở rộng 256px + cột mục lục/bước của trang bài
// học ép cột bài còn ~424px — hẹp hơn cả máy tính bảng 768px. Mở rộng ở dải này là việc TẠM
// (không ghi localStorage, tự thu lại khi chọn một trang): lựa chọn đã lưu chỉ áp từ 1280px, để
// người bấm "mở rộng" ở màn 1440px không vô tình ép cột chữ khi sang laptop 1024px.
import { useLayoutEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  ChevronDown,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import SubjectsLink from './SubjectsLink'
import {
  SUBJECT_CHILDREN,
  childIsActive,
  groupContainsPath,
  readOpenGroups,
  toggleGroup,
  writeOpenGroups,
  type NavChild,
} from '../lib/navTree'
import { STUDIOS, isNavHidden, isNavHiddenPath } from '../lib/studios'
import { useMediaQuery } from '../lib/useIsDesktopViewport'
import { sidebarPlanLabel } from '../lib/planLabel'
import {
  COMPANION_PATHS,
  LEARNING_PATHS,
  NOTES_PATHS,
  REVIEW_PATHS,
  PROFILE_PATHS,
  PROGRESS_PATHS,
  resolveActiveNav,
} from '../lib/navPaths'

const STORAGE_KEY = 'ui_sidebar_collapsed'
/** Dải desktop HẸP (1024–1279px): sidebar mặc định thu gọn — xem chú thích đầu file. */
const NARROW_DESKTOP_QUERY = '(max-width: 1279px)'

interface Item {
  to: string
  label: string
  icon: LucideIcon
  /** Lớp màu riêng của studio; mục lõi (Trang chủ/Tiến độ/Hồ sơ) để trống. */
  color?: string
  /** Các tiền tố đường dẫn làm mục này sáng. Không truyền = so khớp chính `to`. */
  paths?: readonly string[]
  /** Chỉ sáng khi đường dẫn TRÙNG KHÍT (dùng cho Trang chủ `/`). */
  exact?: boolean
  /** Mục con đóng/mở được (xem lib/navTree.ts). Không có = mục lá như cũ. */
  children?: readonly NavChild[]
}

/** Tra nhanh studio theo id — sidebar sắp xếp lại thứ tự nên không duyệt tuần tự được. */
function studio(id: string): (typeof STUDIOS)[number] {
  const st = STUDIOS.find((s) => s.id === id)
  if (!st) throw new Error(`Không tìm thấy studio "${id}" trong lib/studios.ts`)
  return st
}

function studioItem(
  id: string,
  paths: readonly string[],
  label?: string,
  children?: readonly NavChild[],
): Item {
  const st = studio(id)
  return { to: st.to, label: label ?? st.title, icon: st.icon, color: st.color, paths, children }
}

// NHÓM 1 — 6 điểm đến CẤP 1 của sidebar (thiết kế lại header desktop: "Trang chủ" dời hẳn lên
// Header — xem components/Layout.tsx — vì đó là lối RA NGOÀI app này (domain gốc `@dhcb/hub`),
// không phải điều hướng nội bộ như các mục còn lại ở đây). "Luyện tập" đã gỡ khỏi đây trước đó
// — route `/luyen-tap` vẫn sống, chỉ không còn mục riêng (vào từ mục con môn/hub). Mục gộp
// "Sự nghiệp & Đời sống" đã bị GỠ 2026-09-20 cùng hai studio `career` + `worklife`; thay vào đó
// là mục lá "Ghi chú" (`/ghi-chu`).
// `HOME_ITEM` vẫn giữ (không render trong `MAIN_NAV`) vì `ACTIVE_ORDER` cần nó để KHÔNG mục
// nào khác lỡ sáng đèn khi đang ở Trang chủ (`resolveActiveNav` xét tuần tự, thiếu mốc `/`
// thì `/` rơi vào nhánh so khớp lỏng hơn của mục kế tiếp).
const HOME_ITEM: Item = { to: '/', label: 'Trang chủ', icon: Home, exact: true }
const REVIEW_ITEM: Item = {
  to: '/goc-hoc-tap/on-tap',
  label: 'Ôn tập',
  icon: Brain,
  paths: REVIEW_PATHS,
}

/** [2026-09-20] Thay mục gộp "Sự nghiệp & Đời sống" cũ: hai studio `career` + `worklife` đã bị
 *  gỡ hẳn, chỉ còn nửa "Công việc" — nay là "Ghi chú", một mục LÁ (không có mục con). */
const NOTES_ITEM: Item = studioItem('notes', NOTES_PATHS)

const MAIN_NAV: Item[] = [
  // Icon riêng CUỐN SÁCH (`BookOpen`) thay vì icon mặc định của studio `subjects`
  // (`Calculator` ở lib/studios.ts, dùng cho Studio Switcher) — khớp icon "Gia Sư AI" đã
  // dùng ở logo app/`/gioi-thieu` (yêu cầu 2026-09-20), vì "Góc học tập" CHÍNH LÀ nơi vào
  // Gia Sư AI của từng môn.
  { ...studioItem('subjects', LEARNING_PATHS, 'Góc học tập', SUBJECT_CHILDREN), icon: BookOpen },
  // [S12-1] "Ôn tập" là mục CẤP NỀN TẢNG, không phải của riêng môn nào: hàng đợi gộp mọi môn.
  // Không có mục con — sidebar dừng ở cấp môn (spec cha Góc học tập §③).
  REVIEW_ITEM,
  studioItem('companion', COMPANION_PATHS, 'Bạn Đồng Hành'),
  NOTES_ITEM,
]

const CORE_BOTTOM: Item[] = [
  { to: '/tien-do', label: 'Tiến độ', icon: TrendingUp, paths: PROGRESS_PATHS },
  { to: '/trang-ca-nhan', label: 'Hồ sơ', icon: User, paths: PROFILE_PATHS },
]

// Thứ tự XÉT active (khác thứ tự HIỂN THỊ): cụ thể nhất trước, bao quát nhất sau — xem
// `resolveActiveNav`. "Hồ sơ" (`PROFILE_PATHS`, bảng bao quát nhất) đứng cuối cùng.
const ACTIVE_ORDER: Item[] = [
  // `HOME_ITEM` không còn render trong `MAIN_NAV` (dời lên Header) nhưng VẪN phải đứng đầu
  // đây: `/` phải khớp đúng `HOME_ITEM` (exact) trước khi rơi vào so khớp lỏng hơn của mục
  // kế tiếp.
  HOME_ITEM,
  // Cụ thể nhất trước: `/goc-hoc-tap/on-tap` nằm TRONG `LEARNING_PATHS`, nên nếu xét sau thì
  // đứng ở hub lại sáng mục "Góc học tập".
  REVIEW_ITEM,
  ...MAIN_NAV,
  ...CORE_BOTTOM,
]

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // localStorage bị chặn (chế độ riêng tư): coi như đang mở rộng, không làm vỡ trang.
    return false
  }
}

export default function DesktopSidebar() {
  const { user } = useAuth()
  const location = useLocation()
  // Lựa chọn ĐÃ LƯU — chỉ áp từ 1280px.
  const [savedCollapsed, setSavedCollapsed] = useState(readCollapsed)
  // Mở rộng TẠM ở dải hẹp: nhớ ĐƯỜNG DẪN lúc bấm mở, không ghi localStorage. Người dùng mở rộng
  // để tìm một trang; sang trang khác (bằng sidebar, nút Back hay liên kết trong nội dung) thì
  // đường dẫn đổi → tự thu lại, trả chỗ cho nội dung. Không cần effect hay bắt sự kiện bấm.
  const [narrowExpandedAt, setNarrowExpandedAt] = useState<string | null>(null)
  const isNarrowDesktop = useMediaQuery(NARROW_DESKTOP_QUERY)
  const collapsed = isNarrowDesktop ? narrowExpandedAt !== location.pathname : savedCollapsed
  const [openGroups, setOpenGroups] = useState<string[]>(readOpenGroups)

  const hidden = isNavHidden(location.pathname, user)
  const neverSidebar = isNavHiddenPath(location.pathname)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.sidebar = neverSidebar
      ? 'none'
      : hidden
        ? 'off'
        : collapsed
          ? 'collapsed'
          : 'expanded'
    return () => {
      delete root.dataset.sidebar
    }
  }, [neverSidebar, hidden, collapsed])

  if (hidden) return null

  function toggle() {
    if (isNarrowDesktop) {
      setNarrowExpandedAt(collapsed ? location.pathname : null)
      return
    }
    setSavedCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Không lưu được thì vẫn đổi trong phiên hiện tại — chỉ mất tính ghi nhớ.
      }
      return next
    })
  }

  // Tính MỘT LẦN cho cả sidebar: mục nào đang hoạt động. Trước đây mỗi mục tự
  // `startsWith(item.to)` nên các trang luyện tập (/tro-truyen, /luyen-noi, /luyen-viet,
  // /tu-dien, /bai-hoc…) không làm sáng mục nào cả — xem lib/navPaths.ts.
  const activeTo = resolveActiveNav(location.pathname, ACTIVE_ORDER)

  function toggleGroupOpen(id: string) {
    setOpenGroups((prev) => {
      const next = toggleGroup(prev, id)
      writeOpenGroups(next)
      return next
    })
  }

  /** Nhóm đang mở khi người dùng tự mở, HOẶC khi trang hiện tại nằm trong nhóm đó. */
  function isGroupOpen(item: Item): boolean {
    if (!item.children || collapsed) return false
    return openGroups.includes(item.to) || groupContainsPath(item.children, location.pathname)
  }

  /**
   * Cấp 2 đang mở khi người dùng tự mở, HOẶC trang hiện tại là chính mục đó (trang tổng quan
   * môn → thấy ngay công cụ của môn), HOẶC nằm trong một công cụ cấp 2 (như luật của cấp 1).
   */
  function isChildOpen(child: NavChild): boolean {
    if (!child.children) return false
    const id = childGroupId(child)
    return (
      openGroups.includes(id) ||
      childIsActive(child, location.pathname) ||
      groupContainsPath(child.children, location.pathname)
    )
  }

  function childGroupId(child: NavChild): string {
    return `child:${child.subjectId ?? child.to ?? child.label}`
  }

  function renderChild(child: NavChild) {
    const Icon = child.icon
    // Khớp theo BIÊN đoạn: `/goc-hoc-tap/english-abc` không làm sáng "Tiếng Anh".
    const active = childIsActive(child, location.pathname)
    const hasChildren = !!child.children?.length
    const open = hasChildren && isChildOpen(child)
    const groupId = `nav-sub-${childGroupId(child).replace(/\W+/g, '-')}`
    // Cùng một bộ lớp cho <Link> và <a>: mục con môn học có thể trỏ sang origin khác
    // (Góc học tập ở subdomain riêng — xem lib/subjectsHost.ts), lúc đó phải là thẻ <a> thật.
    const cls = `tap-44-coarse-y flex items-center gap-2.5 rounded-lg pl-3 pr-2 py-2 text-[13px] font-medium transition ${
      hasChildren ? 'pr-12' : ''
    } ${active ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-white'}`
    const inner = (
      <>
        <Icon className="w-4 h-4 shrink-0 text-accent-400 theme-light:text-accent-800" />
        <span className="truncate">{child.label}</span>
      </>
    )
    const link = child.subjectId ? (
      <SubjectsLink
        subjectId={child.subjectId}
        className={cls}
        ariaCurrent={active ? 'page' : undefined}
      >
        {inner}
      </SubjectsLink>
    ) : (
      <Link to={child.to ?? '/'} aria-current={active ? 'page' : undefined} className={cls}>
        {inner}
      </Link>
    )

    if (!hasChildren) return <li key={child.label}>{link}</li>

    return (
      <li key={child.label}>
        {/* `relative` bọc RIÊNG hàng liên kết: đặt ở <li> thì nút `h-full` kéo dài xuống hết cả
            danh sách cấp 2 và chevron rơi vào giữa danh sách (thấy trên ảnh chụp Tầng 8b). */}
        <div className="relative">
          {link}
          {/* Nút mở/đóng cấp 2 — vùng chạm 44px (tap-44) dù biểu tượng nhỏ. */}
          <button
            type="button"
            onClick={() => toggleGroupOpen(childGroupId(child))}
            aria-expanded={open}
            aria-controls={groupId}
            aria-label={`${open ? 'Thu gọn' : 'Mở rộng'} công cụ ${child.label}`}
            className="tap-44 absolute right-0 top-0 h-full px-2 flex items-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        {open && (
          <ul
            id={groupId}
            className="mt-0.5 mb-1 ml-4 pl-2 space-y-0.5 border-l border-zinc-800"
            aria-label={`Công cụ ${child.label}`}
          >
            {child.children?.map((c) => renderChild(c))}
          </ul>
        )}
      </li>
    )
  }

  function renderItem(item: Item) {
    const Icon = item.icon
    const active = item.to === activeTo
    const hasChildren = !!item.children && !collapsed
    const open = isGroupOpen(item)
    const groupId = `nav-group-${item.to.replace(/\W+/g, '-')}`
    return (
      <li key={item.to} className="relative">
        <Link
          to={item.to}
          // Icon-only vẫn phải có TÊN đọc được cho trình đọc màn hình: khi thu gọn, nhãn
          // chữ bị ẩn bằng `sr-only` chứ KHÔNG bị bỏ khỏi DOM (ẩn hẳn = link không tên).
          title={collapsed ? item.label : undefined}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            collapsed ? 'justify-center' : ''
          } ${hasChildren ? 'pr-12' : ''} ${
            active
              ? 'bg-zinc-800 border border-accent-500/40 text-white'
              : 'border border-transparent text-zinc-300 hover:bg-zinc-800/70 hover:text-white'
          }`}
        >
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              item.color ?? 'text-accent-400 bg-accent-500/10 border-accent-500/30'
            }`}
          >
            <Icon className="w-4 h-4" />
          </span>
          <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
        </Link>
        {hasChildren && (
          <>
            <button
              type="button"
              onClick={() => toggleGroupOpen(item.to)}
              aria-expanded={open}
              aria-controls={groupId}
              // Nhãn nói RÕ mở/đóng nhóm nào: trong sidebar có nhiều nút giống hệt nhau,
              // "Mở rộng" trơ trọi thì trình đọc màn hình đọc ra ba nút không phân biệt được.
              aria-label={`${open ? 'Thu gọn' : 'Mở rộng'} mục ${item.label}`}
              className="tap-44 absolute right-1 top-1 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <ul id={groupId} className="mt-1 mb-1 ml-5 pl-2 space-y-0.5 border-l border-zinc-800">
                {item.children?.map(renderChild)}
              </ul>
            )}
          </>
        )}
      </li>
    )
  }

  return (
    // [U4 · WCAG 3.1.2] chữ của thanh bên viết cứng tiếng Việt (chưa đi qua i18n) — gắn `lang="vi"`
    // để khi trang là tiếng Anh (giao diện en) trình đọc màn hình vẫn đọc mục menu bằng giọng Việt.
    <aside
      lang="vi"
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[var(--sidebar-w)] flex-col bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/80 transition-[width] duration-200"
      aria-label="Điều hướng chính (desktop)"
    >
      {/* [thiết kế lại header desktop, chỉnh 2026-09-20] Nút thu gọn/mở rộng nay đứng BÊN
          PHẢI hàng đầu sidebar (logo "Đồng Hành" bên trái) — trước đó cả hai đứng sát nhau
          bên trái, đọc như một khối, dễ bấm nhầm. Khi thu gọn thì logo ẩn (không đủ chỗ),
          chỉ còn nút này, tự căn giữa. */}
      <div
        className={`h-14 flex items-center gap-2 px-3 border-b border-zinc-800/80 shadow-sm relative z-10 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed && (
          // [chỉnh 2026-09-20] Logo "Đồng Hành" (icon cuốn sách, link `/gioi-thieu`) đổi
          // thành "Trang chủ" (icon nhà, về thẳng `/`) — người dùng chỉ ra logo cũ không nói
          // rõ bấm vào đâu, trong khi đây là ĐÚNG chỗ quen thuộc nhất để về trang chủ NỘI BỘ
          // của app (khác nút "Trang chủ" ở Header, vốn đi RA NGOÀI app tới `@dhcb/hub`).
          <Link
            to="/"
            className="tap-44 flex items-center gap-1.5 min-w-0 rounded-xl p-2.5 -ml-1 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium truncate">Trang chủ</span>
          </Link>
        )}
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          title={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          className="tap-44 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-1">{MAIN_NAV.map(renderItem)}</ul>

        <ul className="space-y-1 mt-3 pt-3 border-t border-zinc-800/80">
          {CORE_BOTTOM.map(renderItem)}
        </ul>
      </nav>

      {/* Bảng giá tách khỏi trang Hồ sơ (audit 2026-08-31 mục B9) nên vẫn cần lối vào riêng —
          nay chỉ là dòng chữ nhỏ, không còn mục cấp 1 riêng (P1-7, rút 10 → 7 mục).
          [2026-10-01, audit M8] Nhãn đọc GÓI THẬT của phiên (`user.plan` — server đã xét hạn
          gói qua `resolvePlan`). Trước đây ghi cứng "Free · Nâng cấp" (thu gọn: "VIP") cho MỌI
          người, nên người dùng VIP thấy chữ "Free" ngay cạnh trang ghi "Bạn đang dùng gói VIP",
          còn người dùng Free ở thanh thu gọn lại thấy chữ "VIP" như một huy hiệu.
          [2026-10-05, đợt U5] VIP vĩnh viễn ghi rõ "VIP vĩnh viễn", VIP có hạn ghi ngày hết hạn
          — cùng hàm `sidebarPlanLabel` với trang /nang-cap để hai nơi không nói khác nhau. */}
      <Link
        to="/nang-cap"
        className={`tap-44-coarse-y flex items-center px-3 py-2 text-xs text-content-muted hover:text-content transition ${
          collapsed ? 'justify-center text-center' : ''
        }`}
      >
        {sidebarPlanLabel(user?.plan, user?.planExpiresAt, collapsed)}
      </Link>
    </aside>
  )
}

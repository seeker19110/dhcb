// packages/core-ui/OutlineTree.tsx — MỤC LỤC CÂY của một môn/khoá, vẽ từ hợp đồng `Outline`.
//
// Đặc tả: docs/specs/2026-09-15-goc-hoc-tap-07-muc-luc-mon-khoa.md (slice S07-2, AC-8…AC-16).
//
// KHÁC `TocRail` (đừng gộp hai thứ này): `TocRail` là mục lục NEO trong MỘT trang dài
// (`<a href="#…">`, "Trong bài này"). `OutlineTree` là mục lục CỦA CẢ MÔN/KHOÁ: mỗi lá là một
// TRANG khác (liên kết route thật), có chương mở/thu, có tiến độ, có khoá. Hai vai trò khác
// nhau nên hai component khác nhau — `TocRail` giữ nguyên, ba nơi đang dùng không đổi hành vi.
//
// VÌ SAO KHÔNG DÙNG `role="tree"` CỦA APG: cây APG đòi mọi `treeitem` do JS quản tiêu điểm
// (roving tabindex) và KHÔNG cho phép đặt `<a>` bên trong `treeitem`. Ở đây lá PHẢI là liên
// kết thật (mở tab mới, chuột giữa, máy tìm kiếm hiểu) nên dùng khuôn DISCLOSURE lồng nhau:
// `<ul>` lồng `<ul>`, chương là `<button aria-expanded aria-controls>`, lá là liên kết.
//
// THUẦN TRÌNH BÀY: không router, không fetch, không storage. `packages/core-ui` không phụ
// thuộc `react-router` (kiểm 2026-09-15), nên liên kết do nơi gọi dựng qua `renderLink` — app
// truyền `<Link>` của react-router vào.
import { Check, Circle, CircleDashed, ChevronDown, ChevronRight, Lock, Minus } from 'lucide-react'
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Outline, OutlineNode } from '@dhcb/core-contracts/outline'
import { isOutlineLeaf } from '@dhcb/core-contracts/outlineLeaf'
import {
  ancestorChapterIds,
  ancestorChapterIdsOfNode,
  childrenOf,
  pathTo,
} from '@dhcb/core-learner/outline/outlineNav'
import { normalizeVi } from '@dhcb/core-learner/outline/normalizeVi'

/** Nhãn CHỮ của 5 trạng thái — đọc được bằng trình đọc màn hình, không phụ thuộc màu. */
const NHAN_TIEN_DO: Record<OutlineNode['progress'], string> = {
  completed: 'Đã xong',
  'in-progress': 'Đang học dở',
  'not-started': 'Chưa học',
  unknown: 'Chưa đo được',
}

export interface OutlineTreeLinkProps {
  href: string
  className: string
  /** Trang đang mở — nơi gọi đặt `aria-current="page"`. */
  current: boolean
  children: ReactNode
  /** Gọi sau khi người dùng chọn xong một lá (panel mobile dùng để tự đóng). */
  onSelect: () => void
}

export interface OutlineTreeProps {
  outline: Outline
  /** Mã nội dung đang mở trên URL (lessonId…) — quyết định `aria-current` và chương tự mở. */
  activeContentId?: string
  /**
   * `nodeId` của lá đang mở — dùng THAY `activeContentId` khi mã nội dung không duy nhất trong
   * cây. Ca có thật: cấp B2 của Tiếng Anh dùng vòng từ vựng `it` ở hai unit, tra theo mã nội
   * dung sẽ gắn `aria-current="page"` cho cả hai lá. `nodeId` thì duy nhất theo hợp đồng.
   * Truyền cả hai thì `activeNodeId` thắng.
   */
  activeNodeId?: string
  /** Dựng liên kết cho lá. App truyền `<Link>` của react-router. */
  renderLink: (props: OutlineTreeLinkProps) => ReactNode
  /** Tiêu đề mục lục — cũng là tên vùng `<nav aria-label>`. */
  title?: string
  /** Có ô tìm không (AC-15). Tắt khi cây quá ngắn. */
  searchable?: boolean
  /** Các chương đang mở. Bỏ trống → component tự giữ trạng thái (chương của bài đang mở). */
  openIds?: ReadonlySet<string>
  onToggleOpen?: (nodeId: string) => void
  /** Gọi khi người dùng chọn một lá — panel mobile dùng để đóng rồi đưa tiêu điểm về `<h1>`. */
  onSelectLeaf?: () => void
  /** Dòng phụ dưới cây: "Chưa tải được tiến độ · Thử lại"… */
  footer?: ReactNode
  /**
   * Ẩn tiêu đề NHÌN THẤY (vẫn giữ `<h2>` cho trình đọc màn hình).
   *
   * Dùng khi cây nằm trong một khung đã có tiêu đề riêng — panel `Modal variant="sheet"` trên
   * mobile là ca có thật: nó tự vẽ tiêu đề dính ở mép trên, nên tiêu đề của cây hiện ra thành
   * bản thứ hai nằm khuất một nửa sau đó. Lỗi này chỉ lộ ra khi NHÌN ảnh chụp trang (Tầng 8b).
   */
  headingHidden?: boolean
}

export function OutlineTree({
  outline,
  activeContentId,
  activeNodeId,
  renderLink,
  title = 'Mục lục',
  searchable = true,
  openIds,
  onToggleOpen,
  onSelectLeaf,
  footer,
  headingHidden = false,
}: OutlineTreeProps) {
  const baseId = useId()
  const [query, setQuery] = useState('')
  // Trạng thái mở/thu: nhận từ ngoài (OutlinePane lưu sessionStorage) hoặc tự giữ.
  const [openTrong, setOpenTrong] = useState<ReadonlySet<string>>(() =>
    activeNodeId === undefined
      ? ancestorChapterIds(outline, activeContentId)
      : ancestorChapterIdsOfNode(outline, activeNodeId),
  )
  // Lá nào đang mở: `nodeId` (duy nhất) ưu tiên hơn mã nội dung (có thể trùng).
  const dangMoLa = (node: OutlineNode) =>
    activeNodeId === undefined
      ? node.contentId !== undefined && node.contentId === activeContentId
      : node.nodeId === activeNodeId
  const dangMo = openIds ?? openTrong
  const toggle = (nodeId: string) => {
    if (onToggleOpen) {
      onToggleOpen(nodeId)
      return
    }
    setOpenTrong((truoc) => {
      const sau = new Set(truoc)
      if (sau.has(nodeId)) sau.delete(nodeId)
      else sau.add(nodeId)
      return sau
    })
  }

  const ketQuaTim = useMemo(() => {
    const q = normalizeVi(query)
    if (q === '') return null
    return outline.nodes
      .filter((n) => isOutlineLeaf(n) && normalizeVi(n.title).includes(q))
      .map((n) => ({ node: n, duongDan: pathTo(outline, n.nodeId).slice(0, -1) }))
  }, [outline, query])

  const root = outline.nodes.find((n) => n.nodeId === outline.rootId)
  // Cây rỗng (không có gốc, hoặc chỉ có mỗi gốc) thì không vẽ gì — khung rỗng còn tệ hơn.
  if (!root || outline.nodes.length <= 1) return null

  // Chọn xong thì xoá ô tìm: giữ lại query làm người học quay lại thấy cây vẫn đang bị lọc.
  const chon = () => {
    setQuery('')
    onSelectLeaf?.()
  }

  return (
    <nav
      aria-label={title}
      // Trong panel (đã có khung + tiêu đề dính của riêng nó) thì BỎ khung của cây: hai khung
      // lồng nhau làm mép trên của cây chui xuống dưới tiêu đề dính — nhìn ảnh chụp mới thấy.
      className={headingHidden ? '' : 'rounded-2xl border border-line-subtle bg-surface-card p-3'}
    >
      <h2 className={headingHidden ? 'sr-only' : 't-label px-2 pb-2 text-content'}>{title}</h2>

      {/* `scroll-mt-14` chừa chỗ cho tiêu đề DÍNH của khung chứa (panel mobile): hộp thoại tự
          đưa tiêu điểm vào ô tìm, trình duyệt cuộn nó vào tầm nhìn, và không có lề này thì mép
          trên ô nhập nằm khuất sau tiêu đề. Cũng chỉ thấy được bằng ảnh chụp trang. */}
      {searchable && (
        <div className="px-1 pb-2">
          <label className="sr-only" htmlFor={`${baseId}-tim`}>
            Tìm bài trong {title}
          </label>
          <input
            id={`${baseId}-tim`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài, chủ đề…"
            className="tap-44 min-h-[44px] w-full scroll-mt-20 rounded-xl border border-line-strong bg-surface-base px-3 text-content placeholder:text-content-muted"
          />
        </div>
      )}

      {ketQuaTim ? (
        <KetQuaTim ketQua={ketQuaTim} dangMoLa={dangMoLa} renderLink={renderLink} onSelect={chon} />
      ) : (
        <DanhSachCon
          outline={outline}
          parentId={outline.rootId}
          depth={0}
          dangMo={dangMo}
          toggle={toggle}
          dangMoLa={dangMoLa}
          renderLink={renderLink}
          onSelect={chon}
          baseId={baseId}
        />
      )}

      {footer && <div className="px-2 pt-2">{footer}</div>}
    </nav>
  )
}

/** Kết quả tìm: danh sách LÁ phẳng kèm đường dẫn chương ("Lớp 10 › Chương 2: Động học"). */
function KetQuaTim({
  ketQua,
  dangMoLa,
  renderLink,
  onSelect,
}: {
  ketQua: ReadonlyArray<{ node: OutlineNode; duongDan: OutlineNode[] }>
  dangMoLa: (node: OutlineNode) => boolean
  renderLink: OutlineTreeProps['renderLink']
  onSelect: () => void
}) {
  if (ketQua.length === 0) {
    return (
      <p role="status" className="t-caption px-2 py-3 text-content-secondary">
        Không có bài nào khớp
      </p>
    )
  }
  return (
    <ul className="space-y-0.5">
      {ketQua.map(({ node, duongDan }) => (
        <li key={node.nodeId}>
          <NutLa
            node={node}
            isActive={dangMoLa(node)}
            renderLink={renderLink}
            onSelect={onSelect}
            duongDan={duongDan.map((n) => n.title).join(' › ')}
          />
        </li>
      ))}
    </ul>
  )
}

function DanhSachCon({
  outline,
  parentId,
  depth,
  dangMo,
  toggle,
  dangMoLa,
  renderLink,
  onSelect,
  baseId,
}: {
  outline: Outline
  parentId: string
  depth: number
  dangMo: ReadonlySet<string>
  toggle: (nodeId: string) => void
  dangMoLa: (node: OutlineNode) => boolean
  renderLink: OutlineTreeProps['renderLink']
  onSelect: () => void
  baseId: string
}) {
  const con = childrenOf(outline, parentId)
  if (con.length === 0) return null

  return (
    <ul className={depth > 0 ? 'ml-2 border-l border-line-subtle pl-2' : 'space-y-0.5'}>
      {con.map((node) => {
        if (isOutlineLeaf(node)) {
          return (
            <li key={node.nodeId}>
              <NutLa
                node={node}
                isActive={dangMoLa(node)}
                renderLink={renderLink}
                onSelect={onSelect}
              />
            </li>
          )
        }
        const mo = dangMo.has(node.nodeId)
        // `nodeId` chứa dấu `:`/`@` — id HTML cho phép, nhưng để chắc chắn không đụng cú pháp
        // selector ở nơi khác, ghép với `useId()` (đã là chuỗi duy nhất trong tài liệu).
        const panelId = `${baseId}-${node.nodeId}`
        return (
          <li key={node.nodeId}>
            <NutChuong node={node} mo={mo} panelId={panelId} onToggle={() => toggle(node.nodeId)} />
            <div id={panelId} hidden={!mo}>
              <DanhSachCon
                outline={outline}
                parentId={node.nodeId}
                depth={depth + 1}
                dangMo={dangMo}
                toggle={toggle}
                dangMoLa={dangMoLa}
                renderLink={renderLink}
                onSelect={onSelect}
                baseId={baseId}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function NutChuong({
  node,
  mo,
  panelId,
  onToggle,
}: {
  node: OutlineNode
  mo: boolean
  panelId: string
  onToggle: () => void
}) {
  // ← đóng, → mở (thói quen cây của hệ điều hành). Enter/Space đã là hành vi sẵn có của
  // <button> — tự xử lý lại là cách chắc chắn nhất để làm hỏng phím cách.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' && !mo) {
      e.preventDefault()
      onToggle()
    } else if (e.key === 'ArrowLeft' && mo) {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      onKeyDown={onKeyDown}
      aria-expanded={mo}
      aria-controls={panelId}
      className="tap-44 flex min-h-[44px] w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-content-secondary transition hover:bg-surface-raised hover:text-content"
    >
      {mo ? (
        <ChevronDown aria-hidden="true" className="h-3 w-3 shrink-0 text-content-secondary" />
      ) : (
        <ChevronRight aria-hidden="true" className="h-3 w-3 shrink-0 text-content-secondary" />
      )}
      <span className="t-caption min-w-0 flex-1 leading-snug">{node.title}</span>
      {node.hint && <span className="t-caption shrink-0 text-content-muted">{node.hint}</span>}
      {node.availability === 'locked' && <span className="sr-only">· Khoá</span>}
    </button>
  )
}

/** Một LÁ: liên kết route thật khi mở được, `<span aria-disabled>` + lý do khi đang khoá. */
function NutLa({
  node,
  isActive,
  renderLink,
  onSelect,
  duongDan,
}: {
  node: OutlineNode
  isActive: boolean
  renderLink: OutlineTreeProps['renderLink']
  onSelect: () => void
  duongDan?: string
}) {
  const daKhoa = node.availability === 'locked'
  const nhanTrangThai = daKhoa ? 'Khoá' : NHAN_TIEN_DO[node.progress]
  const Dau = daKhoa
    ? Lock
    : node.progress === 'completed'
      ? Check
      : node.progress === 'in-progress'
        ? CircleDashed
        : node.progress === 'not-started'
          ? Circle
          : Minus
  const mauDau =
    node.progress === 'completed' && !daKhoa
      ? 'text-emerald-400 theme-light:text-emerald-800'
      : 'text-content-secondary'

  const noiDung = (
    <>
      <Dau aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${mauDau}`} />
      <span className="min-w-0 flex-1">
        <span className="t-caption line-clamp-2 block break-words leading-snug">{node.title}</span>
        {duongDan && (
          <span className="t-caption mt-0.5 block break-words text-content-muted">{duongDan}</span>
        )}
        {node.hint && <span className="t-caption block text-content-muted">{node.hint}</span>}
        {/* Lý do khoá hiện THÀNH CHỮ ngay tại chỗ: bài khoá không bấm được, nên nếu không nói
            vì sao thì người học chỉ thấy một dòng xám vô cớ. Câu chữ lấy từ luật khoá. */}
        {daKhoa && node.lockReason && (
          <span className="t-caption block break-words text-content-muted">{node.lockReason}</span>
        )}
        {/* Nhãn CHỮ của trạng thái: dấu hình phía trên phân biệt bằng MẮT, chữ này phân biệt
            bằng TRÌNH ĐỌC MÀN HÌNH. Thiếu nó thì 5 trạng thái chỉ còn 5 ký hiệu câm. */}
        <span className="sr-only">
          {` · ${nhanTrangThai}`}
          {isActive ? ' · đang mở' : ''}
        </span>
      </span>
    </>
  )

  const lop = `tap-44 flex min-h-[44px] items-start gap-2 rounded-xl px-2 py-1.5 transition ${
    isActive
      ? 'bg-accent-500/15 text-content'
      : 'text-content-secondary hover:bg-surface-raised hover:text-content'
  }`

  if (daKhoa || node.href === undefined) {
    return (
      <span aria-disabled="true" className={`${lop} opacity-90`}>
        {noiDung}
      </span>
    )
  }

  return (
    <>
      {renderLink({
        href: node.href,
        className: lop,
        current: isActive,
        onSelect,
        children: noiDung,
      })}
    </>
  )
}

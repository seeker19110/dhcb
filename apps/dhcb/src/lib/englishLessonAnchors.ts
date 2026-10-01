// englishLessonAnchors — định danh URL của trang "Bài hội thoại mẫu" môn Tiếng Anh (S09c).
//
// Contract: docs/specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md §2.7.
// URL chuẩn: `/goc-hoc-tap/english/bai-hoc?lesson=1#luot-20`.
//
// Toàn HÀM THUẦN, không đụng DOM/React — trang chỉ làm theo kết quả ở đây. Ba điều cố ý:
//  1. `lesson` chỉ nhận MỘT giá trị, là số nguyên dương viết chuẩn (không `01`, không `+1`,
//     không khoảng trắng). Sai cú pháp/rỗng/lặp đều là "sai", KHÔNG đoán ý người dùng và mở
//     một bài khác — mở nhầm bài còn tệ hơn báo không tìm thấy.
//  2. Hash chỉ nhận DANH SÁCH TRẮNG (`#dau-bai`, `#hoi-thoai`, `#ket-qua`, `#luot-N`). Hash lạ
//     không bao giờ thành CSS selector; trang chỉ gọi `getElementById` với id hàm này trả ra.
//  3. `#luot-N` đếm từ 1 theo THỨ TỰ NGUỒN của bài (không theo người nói). N ngoài phạm vi về
//     tiêu đề bài, KHÔNG kẹp về lượt cuối — kẹp là đưa người học tới chỗ link không hề trỏ tới.
//     Số lượt chỉ ổn định trong cùng phiên bản nội dung: chưa có id lượt bền vững, nên không
//     hứa link lượt còn đúng sau khi giáo trình được sửa.

import type { Outline, OutlineNode } from '@dhcb/core-contracts/outline'

/** Tên tham số query mang mã bài. */
export const THAM_SO_BAI = 'lesson'

/** Id các phần cố định của một bài hội thoại (không kèm dấu `#`). */
export const NEO_BAI_ANH = {
  dauBai: 'dau-bai',
  hoiThoai: 'hoi-thoai',
  ketQua: 'ket-qua',
} as const

// Giới hạn 6 chữ số để chuỗi số khổng lồ không phải đi qua `Number()` (kho chỉ có vài trăm bài,
// mỗi bài vài chục lượt).
const MAU_SO_DUONG = /^[1-9]\d{0,5}$/
const MAU_LUOT = /^luot-([1-9]\d{0,5})$/

/** Id DOM của lượt thứ `soThuTu` (đếm từ 1). */
export function neoLuot(soThuTu: number): string {
  return `luot-${soThuTu}`
}

/**
 * Tham số `lesson` trên URL:
 *  · `khong` — không có: mở danh sách, KHÔNG tự chọn bài nào.
 *  · `so`    — đúng cú pháp; còn phải đối chiếu chỉ mục mới biết bài có thật không.
 *  · `sai`   — rỗng / lặp / sai cú pháp: báo tại danh sách, không mở bài nào.
 */
export type ThamSoBai =
  { loai: 'khong' } | { loai: 'so'; id: number } | { loai: 'sai'; lyDo: 'rong' | 'lap' | 'cu-phap' }

export function docThamSoBai(search: string): ThamSoBai {
  const giaTri = new URLSearchParams(search).getAll(THAM_SO_BAI)
  if (giaTri.length === 0) return { loai: 'khong' }
  if (giaTri.length > 1) return { loai: 'sai', lyDo: 'lap' }
  const raw = giaTri[0] ?? ''
  if (raw === '') return { loai: 'sai', lyDo: 'rong' }
  if (!MAU_SO_DUONG.test(raw)) return { loai: 'sai', lyDo: 'cu-phap' }
  return { loai: 'so', id: Number(raw) }
}

/**
 * Kết quả giải hash trong một bài đã nạp:
 *  · `khong`   — URL không có hash: giữ hành vi mở bài bình thường.
 *  · `dich`    — id đã qua danh sách trắng và chắc chắn có trong bài này.
 *  · `tieu-de` — hash không dùng được → về tiêu đề bài đang mở.
 */
export type DichNeoAnh = { loai: 'khong' } | { loai: 'dich'; id: string } | { loai: 'tieu-de' }

export function giaiNeoBaiAnh(hash: string, soLuot: number): DichNeoAnh {
  if (hash === '' || hash === '#') return { loai: 'khong' }
  if (!hash.startsWith('#')) return { loai: 'tieu-de' }
  const id = hash.slice(1)
  if ((Object.values(NEO_BAI_ANH) as string[]).includes(id)) return { loai: 'dich', id }
  const khop = MAU_LUOT.exec(id)
  if (khop && Number(khop[1]) <= soLuot) return { loai: 'dich', id }
  return { loai: 'tieu-de' }
}

/** Query mới khi mở bài `id`: thay MỌI giá trị `lesson` cũ, giữ nguyên các tham số khác. */
export function searchVoiBai(search: string, id: number): string {
  const p = new URLSearchParams(search)
  p.set(THAM_SO_BAI, String(id))
  return `?${p.toString()}`
}

/** Query của "Danh sách": bỏ `lesson` một cách xác định, giữ tham số khác. */
export function searchBoBai(search: string): string {
  const p = new URLSearchParams(search)
  p.delete(THAM_SO_BAI)
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Nhãn đọc cho trình đọc màn hình của một lượt: "Lượt N — người nói" (chiều B: tiếng Anh). */
export function nhanLuot(soThuTu: number, nguoiNoi: string, isA: boolean): string {
  return isA ? `Lượt ${soThuTu} — ${nguoiNoi}` : `Turn ${soThuTu} — ${nguoiNoi}`
}

/**
 * Kiểu cuộn cho chuyển động TỰ PHÁT (cuộn theo dòng đang đọc): mượt, trừ khi người dùng bật
 * giảm chuyển động. Cú nhảy theo neo luôn dùng `instant` (xem LessonView) nên không qua đây.
 */
export function kieuCuonTheoDoc(): ScrollBehavior {
  const giam =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return giam ? 'auto' : 'smooth'
}

/**
 * Cây mục lục PHẲNG của các bài hội thoại — để bài hội thoại dùng CHUNG nút "Bài trước / Bài sau"
 * (`OutlinePrevNext`) với bài STEM và bài Lập trình, thay vì tự chế một kiểu điều hướng riêng.
 *
 * [2026-10-01, audit đồng nhất bố cục] Trước đây học xong bài hội thoại không có lối sang bài kế:
 * phải cuộn lên đầu trang (desktop) hoặc về danh sách rồi tìm lại (mobile), trong khi hai môn kia
 * đều có. Liên kết kèm `#dau-bai` để bài mới mở ở ĐẦU bài (logic neo của `LessonView` focus và
 * cuộn tới tiêu đề) — không có hash thì trang giữ nguyên chỗ cuộn ở cuối bài cũ.
 *
 * @param ds chỉ mục bài theo đúng thứ tự hiển thị trong danh sách
 * @param pathname/search vị trí hiện tại — giữ mọi tham số query khác, chỉ thay `lesson`
 */
export function cayBaiHoiThoai(
  ds: readonly { id: number; title: string }[],
  pathname: string,
  search: string,
): Outline {
  const goc: OutlineNode = {
    nodeId: 'hoi-thoai',
    subjectId: 'english',
    kind: 'level',
    title: 'Bài hội thoại',
    order: 0,
    availability: 'available',
    progress: 'unknown',
  }
  const la = ds.map((bai, i): OutlineNode => ({
    nodeId: `hoi-thoai-${bai.id}`,
    parentId: goc.nodeId,
    subjectId: 'english',
    contentId: String(bai.id),
    kind: 'lesson',
    title: bai.title,
    order: i,
    href: `${pathname}${searchVoiBai(search, bai.id)}#${NEO_BAI_ANH.dauBai}`,
    availability: 'available',
    progress: 'unknown',
  }))
  return { rootId: goc.nodeId, subjectId: 'english', nodes: [goc, ...la], builtAt: 0 }
}

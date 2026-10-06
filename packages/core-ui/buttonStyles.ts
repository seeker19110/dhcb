// packages/core-ui/Button.tsx — Nút bấm chuẩn của toàn nền tảng.
//
// VÌ SAO CẦN (đo 2026-09-02 trên apps/dhcb/src): app có 915 thẻ `<button>` và KHÔNG có một
// component nút dùng chung nào — mỗi trang tự ghép class Tailwind. Hậu quả đo được:
//   • Riêng "nút chính" (nền `bg-accent-500`) được viết ~50 biến thể khác nhau: bo góc
//     `rounded-xl` lẫn `rounded-2xl`, đệm dọc `py-2.5` / `py-3` / `py-3.5`, mờ khi vô hiệu
//     `disabled:opacity-40` / `50` / `60`.
//   • Màu chữ trên cùng một nền accent có tới BỐN giá trị: `text-black` (88), `text-white`
//     (25), `text-[#09090b]` (18), `text-[#fff]` (2).
//
// Cái thứ hai không chỉ là lệch thẩm mỹ mà là LỖI TƯƠNG PHẢN THẬT. `text-white` map sang biến
// `--c-white`, biến này bị đảo thành màu tối ở 3 theme nền sáng — nên ở theme nền sáng nó
// tình cờ đúng, còn ở theme NỀN TỐI (Xanh đêm mặc định, Rực rỡ) nó là chữ trắng thật trên nền
// accent, tương phản ~2,3–3,4:1, dưới sàn AA 4,5:1 mà mục 4.5 của CLAUDE.md quy định là sàn
// cứng. 17 file đang dính lỗi này. Cổng `e2e/a11y.spec.ts` không bắt được vì các nút đó nằm
// sau đăng nhập (bảng quản trị, cổng tính năng), ngoài 15 trang được quét.
//
// Vì vậy component này KHÔNG nhận tham số màu chữ. Màu chữ là hệ quả của biến thể, do đây
// quyết định một lần cho cả 5 theme — chỗ duy nhất còn phải sửa nếu bảng màu đổi về sau.

/**
 * Vai trò của nút trong trang, KHÔNG phải màu sắc của nó.
 *
 * Đặt tên theo vai trò để lời gọi tự nói lên ý định ("nút này là hành động chính của màn
 * hình") thay vì mô tả hình thức ("nút này màu xanh"). Đổi bảng màu về sau thì lời gọi không
 * phải sửa theo.
 *
 * - `primary`   — hành động chính, MỖI MÀN HÌNH CHỈ NÊN CÓ MỘT. Nhiều nút primary cùng lúc thì
 *   không còn nút nào nổi bật, mắt người dùng mất điểm neo.
 * - `secondary` — hành động phụ quan trọng, vẫn mang màu thương hiệu nhưng nền nhạt.
 * - `outline`   — hành động trung tính có khung (Huỷ, Làm mới, lối sang trang khác). Viền
 *   `line-strong` + chữ `content`, không mang màu thương hiệu nên đứng cạnh nút `primary` mà
 *   không tranh điểm neo.
 * - `danger`    — thao tác phá huỷ (xoá, huỷ gói). Cố ý dùng màu hồng-đỏ cố định, không theo
 *   accent: cảnh báo phải trông GIỐNG NHAU ở cả 5 theme, không hoà vào màu thương hiệu.
 *
 * Bốn biến thể trên là BỘ CHUẨN (audit 2026-09-30 M17, changelog 0500: chính/phụ/viền/nguy
 * hiểm). `ghost` là biến thể phụ trợ dạng CHỮ (không khung, chỉ hiện nền khi rê chuột) — giữ
 * cho các nút kiểu liên kết đã dùng nó; khung cho nút trung tính thì dùng `outline`, đừng ghép
 * `ghost` + `border` tại chỗ gọi.
 *
 * Màu nút chính là ACCENT (đợt 0469). Xanh lá mang nghĩa "đúng" trong app — không dùng làm nền
 * nút hành động.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'

/**
 * Cỡ nút. `md` là mặc định và là cỡ nên dùng cho gần như mọi chỗ.
 *
 * Chiều cao chọn theo luật vùng chạm ≥ 44px (CLAUDE.md mục 4.7): `md` = h-11 = 44px chẵn,
 * `lg` = 48px. `sm` = 36px nên KHÔNG đạt 44px — chỉ dùng cho thanh công cụ dày đặc trên
 * desktop, nơi con trỏ chuột chính xác hơn ngón tay; đừng dùng cho luồng chính trên mobile.
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Nền + chữ + trạng thái rê chuột, theo từng vai trò. */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  // Chữ tối cố định (#09090b) trên nền accent: đo trên cả 5 theme đều ≥ 5,8:1 nên đạt AA ở
  // theme yếu nhất (Pink), và không bao giờ bị `--c-white` đảo màu. Đây chính là chỗ vá lỗi
  // tương phản nói ở đầu file.
  primary:
    'bg-accent-500 text-[#09090b] hover:bg-accent-400 active:bg-accent-600 shadow-sm shadow-accent-500/20',
  // Chữ accent trên nền accent rất nhạt. Cần hai sắc độ vì thang accent không đảo theo theme:
  // ở theme nền tối phải lấy sắc SÁNG (300), ở theme nền sáng phải lấy sắc TỐI (800).
  secondary:
    'bg-accent-500/15 text-accent-300 theme-light:text-accent-800 hover:bg-accent-500/25 active:bg-accent-500/30',
  // Dùng token NGỮ NGHĨA (`content`, `surface-raised`) thay vì bậc màu `zinc-*`: hai token này
  // đã được đo đạt ngưỡng WCAG trên cả 5 theme (scripts/contrast-audit.ts), nên không phải
  // đoán xem bậc nào đủ tương phản ở theme nào.
  ghost: 'bg-transparent text-content hover:bg-surface-raised active:bg-surface-raised/70',
  // Viền `line-strong` (token đã đo ở cả 3 theme) — nền trong suốt để nút ngồi được trên cả nền
  // trang lẫn nền thẻ mà không lộ một mảng màu lệch bề mặt.
  outline:
    'border border-line-strong bg-transparent text-content hover:bg-surface-raised hover:border-accent-500/60 active:bg-surface-raised/70',
  // Hồng-đỏ cố định + chữ trắng cố định `#fff`: nền này luôn tối ở mọi theme nên chữ trắng
  // luôn đúng, nhưng phải viết `text-[#fff]` chứ KHÔNG phải `text-white` — `text-white` map
  // sang `--c-white` và sẽ bị đảo thành chữ tối ở 3 theme nền sáng (CLAUDE.md mục 4.5).
  danger:
    'bg-rose-600 text-[#fff] hover:bg-rose-500 active:bg-rose-700 shadow-sm shadow-rose-600/20',
}

/** Chiều cao + đệm ngang + cỡ chữ. */
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
}

/**
 * Phần dùng chung cho mọi nút.
 *
 * Viền lấy nét: KHÔNG tự khai ở đây — dùng luật chung `button:focus-visible` / `a:focus-visible`
 * trong `apps/dhcb/src/index.css` (outline 2px màu token `--focus-ring`, đã đo ≥ 3:1 ở cả 3
 * theme). Trước changelog 0500 chỗ này đặt `focus-visible:outline-none` + `ring-accent-400`:
 * nó TẮT viền chung và thay bằng vòng accent sáng — đúng loại viền mà audit 2026-09-30 C1 đo
 * được chỉ ~2,6:1 ở Blue sky. Nút nào chuyển sang `buttonClass` là tụt tương phản viền lấy nét.
 *
 * `transition-colors` chứ không `transition-all`: `transition-all` làm cả độ dày viền lấy nét
 * chuyển động, viền hiện dần trong 200ms (audit M17, skill ui-ux mục 10.A.1/A.4).
 *
 * `disabled:pointer-events-none` đi kèm `disabled:opacity-50`: chỉ làm mờ thôi thì nút vẫn
 * bắt được rê chuột và vẫn đổi màu, khiến người dùng tưởng bấm được.
 */
const BASE_CLASS =
  'inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors ' +
  'disabled:opacity-50 disabled:pointer-events-none'

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Giãn hết bề ngang thẻ cha. Dùng cho biểu mẫu và thẻ hẹp trên mobile. */
  fullWidth?: boolean
  /** Class thêm — dùng cho bố cục (`mt-4`, `sm:w-auto`), KHÔNG dùng để đè màu/bo góc. */
  className?: string
}

/**
 * Chỉ phần MÀU + trạng thái của một biến thể (nền, chữ, rê chuột, bấm) — không có chiều cao,
 * đệm, `whitespace-nowrap`.
 *
 * VÌ SAO (changelog 0501): có những "nút" là cả một hàng nhiều dòng — vd "Học bài: <tên bài dài>"
 * ở trang bậc/khoá Lập trình, tên bài xuống 2–3 dòng ở 390px. `buttonClass` đặt chiều cao cố định
 * (`h-11`) và cấm xuống dòng nên sẽ cắt chữ; đè bằng `className` thì thứ tự thắng của hai lớp
 * cùng thuộc tính do stylesheet quyết định, không do thứ tự viết. Lấy riêng phần màu ở đây để
 * hàng nhiều dòng vẫn dùng ĐÚNG màu của biến thể, không chép lại chuỗi màu.
 */
export function buttonVariantClass(variant: ButtonVariant = 'primary'): string {
  return VARIANT_CLASS[variant]
}

/**
 * Sinh chuỗi class của nút mà không dựng component.
 *
 * VÌ SAO TÁCH RA: rất nhiều "nút" trong app thật ra là `<Link>` của react-router hoặc thẻ
 * `<a>`. `packages/` không được phụ thuộc router của app, nên thay vì dựng một component đa
 * hình phức tạp, ta xuất luôn phần tạo class: `<Link className={buttonClass({ variant:
 * 'primary' })}>`. Nhờ vậy nút-điều-hướng và nút-hành-động dùng CHUNG một nguồn sự thật về
 * hình thức, mà vẫn giữ đúng ngữ nghĩa HTML (điều hướng là `<a>`, hành động là `<button>`).
 */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: ButtonStyleOptions = {}): string {
  return [
    BASE_CLASS,
    SIZE_CLASS[size],
    VARIANT_CLASS[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

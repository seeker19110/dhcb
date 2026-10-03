import plugin from 'tailwindcss/plugin'
import { fileURLToPath } from 'node:url'

// Tailwind v3 resolve content glob theo CWD (không theo vị trí config) — dùng đường tuyệt đối
// để chạy đúng dù npm script chạy từ gốc repo (PR-S2 dời config vào apps/dhcb).
const here = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  // packages/core-ui chứa component dùng chung (ToastProvider…) — PHẢI quét, nếu không class
  // Tailwind chỉ xuất hiện ở đó sẽ KHÔNG được sinh ra và lặng lẽ mất tác dụng (đã dính thật:
  // `theme-light:text-red-800` của toast lỗi). apps/hub/tailwind.config.js vốn đã quét đường
  // dẫn này — đây là chỗ apps/dhcb bị bỏ sót.
  content: [
    here + 'index.html',
    here + 'src/**/*.{js,ts,jsx,tsx}',
    fileURLToPath(new URL('../../packages/core-ui/', import.meta.url)) + '**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Map màu zinc + white sang CSS variable để đổi theme (light/dark/dark blue)
      // chỉ bằng cách đổi biến trong index.css — không phải sửa lại từng file.
      colors: {
        white: 'rgb(var(--c-white) / <alpha-value>)',
        zinc: {
          50: 'rgb(var(--z-50) / <alpha-value>)',
          100: 'rgb(var(--z-100) / <alpha-value>)',
          200: 'rgb(var(--z-200) / <alpha-value>)',
          300: 'rgb(var(--z-300) / <alpha-value>)',
          400: 'rgb(var(--z-400) / <alpha-value>)',
          500: 'rgb(var(--z-500) / <alpha-value>)',
          600: 'rgb(var(--z-600) / <alpha-value>)',
          700: 'rgb(var(--z-700) / <alpha-value>)',
          800: 'rgb(var(--z-800) / <alpha-value>)',
          900: 'rgb(var(--z-900) / <alpha-value>)',
          950: 'rgb(var(--z-950) / <alpha-value>)',
        },
        // Màu nhấn thương hiệu — đổi theo theme (emerald / sky / pink / fuchsia).
        // Thay cho 'emerald' hard-code cũ: class bg-accent-500, text-accent-400...
        accent: {
          50: 'rgb(var(--a-50) / <alpha-value>)',
          100: 'rgb(var(--a-100) / <alpha-value>)',
          200: 'rgb(var(--a-200) / <alpha-value>)',
          300: 'rgb(var(--a-300) / <alpha-value>)',
          400: 'rgb(var(--a-400) / <alpha-value>)',
          500: 'rgb(var(--a-500) / <alpha-value>)',
          600: 'rgb(var(--a-600) / <alpha-value>)',
          700: 'rgb(var(--a-700) / <alpha-value>)',
          800: 'rgb(var(--a-800) / <alpha-value>)',
          900: 'rgb(var(--a-900) / <alpha-value>)',
        },
        // Viền focus bàn phím — token riêng theo theme, đạt ≥ 3:1 (WCAG 1.4.11) ở cả 3 theme,
        // cổng `apps/dhcb/src/lib/themeContrast.test.ts`. Dùng `focus-visible:ring-focus-ring`
        // thay cho `ring-accent-300/400/500` (2,65:1 hoặc thấp hơn ở theme sáng — audit 2026-09-30 C1).
        'focus-ring': 'rgb(var(--focus-ring) / <alpha-value>)',
        // ── TOKEN NGỮ NGHĨA (thêm 2026-09-02, đợt 1 thiết kế lại desktop) ─────────────
        // Đặt tên theo VAI TRÒ thay vì theo bậc màu, để chọn đúng là mặc định: mỗi tên
        // dưới đây đã được đo đạt ngưỡng WCAG trên cả 5 theme (scripts/contrast-audit.ts).
        // Nội dung mới nên dùng nhóm này; thang `zinc`/`accent` ở trên giữ nguyên cho code cũ.
        surface: {
          base: 'rgb(var(--surface-base) / <alpha-value>)', // nền trang
          card: 'rgb(var(--surface-card) / <alpha-value>)', // thẻ nội dung
          raised: 'rgb(var(--surface-raised) / <alpha-value>)', // lớp phủ: modal/dropdown/toast
        },
        line: {
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
        },
        content: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)', // AAA — tiêu đề & nội dung
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)', // AAA — nội dung phụ
          muted: 'rgb(var(--text-muted) / <alpha-value>)', // AA — nhãn/chú thích, KHÔNG cho nội dung
          disabled: 'rgb(var(--text-disabled) / <alpha-value>)', // AA — trạng thái tắt
        },
        // Màu ẤM riêng cho Companion "Bạn Đồng Hành" (P0-2, 2026-09-17) — TÁCH khỏi `accent`
        // (màu thương hiệu) để avatar/bong bóng chào có cảm giác gần gũi, không lẫn với nút
        // hành động chính. Chữ trong bong bóng LUÔN dùng `text-content` (không `text-warm-*`)
        // để giữ AAA — xem docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P0-2.
        warm: {
          50: 'rgb(var(--w-50) / <alpha-value>)',
          100: 'rgb(var(--w-100) / <alpha-value>)',
          500: 'rgb(var(--w-500) / <alpha-value>)',
          700: 'rgb(var(--w-700) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      // Bo góc đọc từ biến CSS để theme tự đổi độ bo (Sci-Fi "Xanh đêm" gọn hơn một nấc) —
      // giá trị mặc định của biến = đúng mặc định Tailwind, xem packages/core-ui/theme.css.
      borderRadius: {
        lg: 'var(--r-lg, 0.5rem)',
        xl: 'var(--r-xl, 0.75rem)',
        '2xl': 'var(--r-2xl, 1rem)',
        '3xl': 'var(--r-3xl, 1.5rem)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Phản hồi ĐÚNG trong quiz: nút phồng nhẹ rồi về
        'pop-correct': {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        // Phản hồi SAI trong quiz: lắc ngang
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        },
        // Illustration nổi lên xuống nhẹ
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        // Particle orbit xung quanh subject hero
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(48px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(48px) rotate(-360deg)' },
        },
        // Glow pulse cho hero icon
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px 4px rgba(var(--a-500) / 0.25)' },
          '50%': { boxShadow: '0 0 36px 8px rgba(var(--a-500) / 0.45)' },
        },
        // CompanionAvatar `idle` — chớp mắt nhẹ mỗi chu kỳ (P0-2).
        'companion-blink': {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '96%': { transform: 'scaleY(0.1)' },
        },
        // CompanionAvatar `thinking` — ba chấm nhấp nháy so le.
        'companion-dot': {
          '0%, 80%, 100%': { opacity: '0.25' },
          '40%': { opacity: '1' },
        },
        // CompanionAvatar `cheer` — phồng nhẹ rồi về, tự dừng sau 600ms (component quản bằng
        // setTimeout, KHÔNG lặp vô hạn — animation chỉ chạy một lần).
        'companion-cheer': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        // Hoạt ảnh CHẠY MỘT LẦN dùng fill-mode `backwards`, KHÔNG dùng `both` (sửa 2026-10-02,
        // changelog 0474). `both` giữ lại `transform` của khung cuối (translateY(0)/scale(1)) mãi
        // mãi sau khi chạy xong. Phần tử có `transform` biến thành containing block nên mọi
        // `position: fixed` bên trong neo theo NÓ thay vì màn hình: hộp thoại bị đẩy lệch, cắt
        // mất nội dung, nền mờ không phủ hết trang. Đã vá cục bộ hai lần (Celebration phải
        // portal, OfflineSyncIndicator phải né translate) trước khi tìm ra gốc — TRAPS mục 18.
        // Khung cuối của các hoạt ảnh này trùng style gốc (opacity 1, không dịch/phóng), nên
        // `backwards` cho cùng hình ảnh; chỉ khác là không để lại `transform`.
        // Cổng canh: apps/dhcb/src/lib/tailwindAnimations.test.ts.
        'fade-in': 'fade-in 0.35s ease-out backwards',
        'fade-up': 'fade-up 0.4s ease-out backwards',
        'scale-in': 'scale-in 0.25s ease-out backwards',
        'pulse-ring': 'pulse-ring 1.4s ease-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'pop-correct': 'pop-correct 0.3s ease-out backwards',
        shake: 'shake 0.35s ease-in-out backwards',
        float: 'float 4s ease-in-out infinite',
        orbit: 'orbit 8s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'companion-blink': 'companion-blink 6s ease-in-out infinite',
        'companion-dot': 'companion-dot 1.2s ease-in-out infinite',
        'companion-cheer': 'companion-cheer 0.6s ease-out backwards',
      },
    },
  },
  plugins: [
    // Biến thể `theme-light:` áp dụng cho các theme NỀN SÁNG (Blue sky, Nhi đồng).
    // Dùng để chọn SẮC ĐỘ ĐẬM HƠN cho các màu cố định của Tailwind (amber/sky/teal…)
    // — màu -300/-400 vốn sáng (đọc tốt trên nền tối) nhưng rớt AA trên nền sáng.
    // Theme tối (Xanh đêm) không bị ảnh hưởng (không thêm CSS). Pink/Rực rỡ đã bị
    // xoá khỏi sản phẩm (chốt 2026-09-17).
    plugin(({ addVariant }) => {
      addVariant('theme-light', ['[data-theme="blue-sky"] &', '[data-theme="kid"] &'])
    }),
  ],
}

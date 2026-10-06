// Lưu, đọc và áp dụng theme giao diện.
// 2 theme tự chọn: Blue sky (mặc định) · Xanh đêm. Pink/Rực rỡ đã bị XOÁ (chốt
// 2026-09-17, chủ dự án) — giá trị "pink"/"vibrant" cũ trong localStorage của
// người dùng cũ rơi về mặc định qua VALID.has() bên dưới, không throw.
// + 1 theme "Nhi đồng" (kid) — KHÔNG nằm trong THEMES (không cho tự chọn/cycle qua
// ThemeToggle), chỉ tự áp + khoá cứng cho user có age_group='nhi_dong' (xem
// ThemeProvider.tsx). Kế hoạch "giao diện + nội dung theo độ tuổi", PROGRESS.md 2026-07-22.
export type Theme = 'dark-blue' | 'blue-sky' | 'kid'

export const THEMES: {
  value: Theme
  labelVi: string
  labelEn: string
}[] = [
  { value: 'blue-sky', labelVi: 'Blue sky', labelEn: 'Blue sky' },
  { value: 'dark-blue', labelVi: 'Xanh đêm', labelEn: 'Night blue' },
]

// Theme "Nhi đồng" — tách riêng khỏi THEMES (mảng cho ThemeToggle cycle qua) vì đây là
// theme BỊ KHOÁ, không phải lựa chọn tự do.
export const KID_THEME = { value: 'kid' as const, labelVi: 'Nhi đồng', labelEn: 'Kids' }

const VALID = new Set<Theme>([...THEMES.map((t) => t.value), KID_THEME.value])
// Mặc định: Blue sky (đổi từ dark-blue, chốt 2026-09-17). `apps/dhcb/index.html` +
// `apps/hub/index.html` + `manifest.webmanifest` PHẢI khớp theme này (test publicMetadata).
export const DEFAULT_THEME: Theme = 'blue-sky'
// Theme dùng khi máy người dùng đặt chế độ tối (prefers-color-scheme: dark) và họ CHƯA tự chọn.
export const DARK_PREFERRED_THEME: Theme = 'dark-blue'
// PHẢI khớp khoá trong script chống nhá màu ở <head> của apps/dhcb/index.html.
export const THEME_STORAGE_KEY = 'ui_theme'
const KEY = THEME_STORAGE_KEY

// Màu thanh trình duyệt (meta theme-color) theo từng theme — đồng bộ với --theme-color trong CSS
export const THEME_COLORS: Record<Theme, string> = {
  'dark-blue': '#0e1726', // = --z-950 (nền trang) của bảng slate-xanh xboss (2026-09-22)
  'blue-sky': '#f0f9ff',
  kid: '#fffbeb',
}

// Máy người dùng có đang đặt chế độ tối không. matchMedia thiếu (môi trường cũ/test) → coi là sáng.
function prefersDark(): boolean {
  try {
    return typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  } catch {
    return false
  }
}

// Theme hiện hành: lựa chọn đã lưu thắng; CHƯA chọn lần nào thì theo chế độ sáng/tối của máy
// (audit 2026-09-30 M13). Không ghi lại kết quả suy ra — người dùng đổi chế độ máy thì lần mở sau
// app đổi theo, tới khi họ tự chọn theme qua ThemeToggle.
export function getTheme(): Theme {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(KEY)
  } catch {
    /* localStorage bị chặn (chế độ riêng tư) — coi như chưa chọn */
  }
  if (saved && VALID.has(saved as Theme)) return saved as Theme
  return prefersDark() ? DARK_PREFERRED_THEME : DEFAULT_THEME
}

// Gắn theme vào thẻ <html> (data-theme) để CSS biến đổi màu theo,
// đồng thời cập nhật meta theme-color (màu thanh trình duyệt trên mobile/PWA).
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = THEME_COLORS[theme]
}

export function setTheme(theme: Theme) {
  localStorage.setItem(KEY, theme)
  applyTheme(theme)
}

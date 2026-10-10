import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font Inter tự host (variable font, chỉ 1 file/subset) thay vì tải qua Google Fonts —
// bỏ 2 vòng DNS/TLS/HTTP tới domain ngoài (fonts.googleapis.com + fonts.gstatic.com),
// file font giờ cùng domain, cache immutable như các asset khác (xem server.ts/nginx).
// fonts.css = wght.css của gói nhưng đổi thứ tự subset để chữ Việt khỏi kéo latin-ext (xem file).
import './fonts.css'
import './index.css'
import App from './App'
import { applyTheme, getTheme } from '@core/theme'
import { unlockAudio } from './lib/sharedAudio'
import { initErrorTracking } from './lib/errorTracking'
import { initKeyboardNavModality } from './lib/keyboardNavModality'
import { getStoredToken } from '@core/authHeader'

// Áp dụng theme đã lưu NGAY trước khi render để tránh nhấp nháy màu
applyTheme(getTheme())

// Bật Sentry (error tracking) — no-op nếu chưa cấu hình VITE_SENTRY_DSN (xem errorTracking.ts).
initErrorTracking()

// Cờ điều hướng bàn phím → CSS chừa chỗ header/thanh đáy khi Tab (S07d, WCAG 2.4.11).
initKeyboardNavModality()

// Khách mở thẳng trang chủ (máy này chưa có phiên): tải chunk trang chủ khách SONG SONG với lượt
// hỏi phiên `/api/auth`, thay vì đợi phiên xong mới tải — bớt một vòng mạng trước nội dung đầu tiên
// (đo Lighthouse 2026-10-10). Cùng specifier với lazy() ở App.tsx nên trình duyệt không tải hai
// lần; lỗi mạng bỏ qua vì lazyWithRetry ở App.tsx sẽ tự tải lại khi thật sự cần.
if (window.location.pathname === '/' && !getStoredToken()) {
  import('./pages/core/GuestHomePage').catch(() => {})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Mở khoá audio cho iOS/Safari (kể cả PWA) ngay ở lần người dùng chạm/bấm ĐẦU TIÊN.
// Safari chỉ cho JavaScript phát audio trên thẻ đã được tương tác — mở khoá sớm 1
// lần để cả trình phát hội thoại lẫn phần đọc tự động (Chat/Luyện nói) đều phát được.
const unlockEvents = ['pointerdown', 'touchend', 'mousedown', 'keydown'] as const
function onFirstGesture() {
  unlockAudio()
  unlockEvents.forEach((e) => window.removeEventListener(e, onFirstGesture))
}
unlockEvents.forEach((e) => window.addEventListener(e, onFirstGesture, { passive: true }))

// Đăng ký service worker để app cài được lên màn hình chính (PWA) và mở nhanh hơn.
// Chỉ chạy ở bản build thật (production) để khỏi vướng cache lúc đang dev.
// [2026-10-05, audit M14] Tải ngầm dữ liệu ngoại tuyến KHÔNG còn chạy ở đây cho mọi người — xem
// components/DataPrecacheGate.tsx (chỉ khi đã đăng nhập + đã học ≥ 1 phiên + công tắc bật).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Không sao nếu trình duyệt chặn/không hỗ trợ — app vẫn chạy bình thường.
    })
  })
}

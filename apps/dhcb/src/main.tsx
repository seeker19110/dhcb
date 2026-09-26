import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font Inter tự host (variable font, chỉ 1 file/subset) thay vì tải qua Google Fonts —
// bỏ 2 vòng DNS/TLS/HTTP tới domain ngoài (fonts.googleapis.com + fonts.gstatic.com),
// file font giờ cùng domain, cache immutable như các asset khác (xem server.ts/nginx).
import '@fontsource-variable/inter/wght.css'
import './index.css'
import App from './App'
import { applyTheme, getTheme } from '@core/theme'
import { unlockAudio } from './lib/tts'
import { initErrorTracking } from './lib/errorTracking'
import { initKeyboardNavModality } from './lib/keyboardNavModality'

// Áp dụng theme đã lưu NGAY trước khi render để tránh nhấp nháy màu
applyTheme(getTheme())

// Bật Sentry (error tracking) — no-op nếu chưa cấu hình VITE_SENTRY_DSN (xem errorTracking.ts).
initErrorTracking()

// Cờ điều hướng bàn phím → CSS chừa chỗ header/thanh đáy khi Tab (S07d, WCAG 2.4.11).
initKeyboardNavModality()

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
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        // Sau khi SW sẵn sàng: tải DẦN toàn bộ dữ liệu tĩnh (~15MB) về máy để dùng offline.
        // Chạy nền lúc CPU rảnh, tiếp tục cả khi đang nghe hội thoại / không làm gì, và tự
        // cập nhật file nào server đổi (qua manifest hash). Dynamic import để không làm nặng
        // bundle khởi động.
        import('./lib/dataPrecache')
          .then((m) => m.startDataPrecache())
          .catch(() => {
            /* lỗi tải nền — không ảnh hưởng app */
          })
      })
      .catch(() => {
        // Không sao nếu trình duyệt chặn/không hỗ trợ — app vẫn chạy bình thường.
      })
  })
}

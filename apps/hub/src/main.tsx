// Font Inter tự host — cùng gói và cùng cách nạp với app chính (apps/dhcb/src/main.tsx), để hub
// và app trông là MỘT sản phẩm (audit 2026-09-30 minor 10).
import '@fontsource-variable/inter/wght.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme, getTheme } from '@core/theme'
import { ThemeProvider } from '@core/ThemeProvider'
import App from './App'
import './index.css'

// Áp dụng theme đã lưu (chưa chọn → theo chế độ sáng/tối của máy) ngay trước khi render để tránh giật giao diện
applyTheme(getTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

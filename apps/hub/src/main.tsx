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

// apps/dhcb/src/prerender/GuestHomePrerender.tsx — Cây component để RENDER TĨNH trang chủ khách
// (`/`) thành HTML dựng sẵn, chèn vào index.html lúc build. Cơ chế + lý do: lib/guestPrerender.ts.
//
// Dựng lại ĐÚNG phần App.tsx vẽ cho khách ở `/` trên màn HẸP (SkipLink · cột nội dung · BottomNav)
// bằng CHÍNH các component thật, chỉ thay AuthProvider bằng giá trị khách cố định — AuthProvider
// thật bắt đầu ở trạng thái "đang tải phiên" nên không render tĩnh ra trang chủ được.
// Không có DesktopSidebar: bản dựng sẵn chỉ bật dưới 1024px, nơi sidebar bị ẩn (`hidden lg:flex`).
// Cố ý KHÔNG có GuestBanner: banner chỉ hiện với khách đã từng học (đọc localStorage), còn bản
// dựng sẵn là lượt mở ĐẦU TIÊN; khách quay lại thấy banner xuất hiện khi React tiếp quản.
//
// Sửa component trong cây này (GuestHome, Layout, BottomNav…) → chạy `npm run gen:prerender-home`
// để sinh lại `guestHome.prerender.html`; quên thì `guestHomePrerender.test.tsx` đỏ.
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../context/authContext'
import { AppThemeProvider as ThemeProvider } from '../context/AppThemeProvider'
import { LangProvider } from '../context/LangProvider'
import { ToastProvider } from '@core/ToastProvider'
import { SkipLink } from '@core/SkipLink'
import BottomNav from '../components/BottomNav'
import GuestHomePage from '../pages/core/GuestHomePage'
import { APP_CONTENT_COLUMN_CLASS } from '../components/appFrame'

// Cùng hình dạng user khách mà AuthProvider cấp (buildGuestUser) — id cố định để HTML sinh ra
// tất định (id thật là uuid ngẫu nhiên của từng máy, không hiện ra giao diện).
const GUEST_AUTH: AuthContextValue = {
  user: {
    id: 'guest_prerender',
    email: '',
    name: 'Khách',
    plan: 'free',
    onboarded: true,
    isGuest: true,
    createdAt: 0,
  },
  loading: false,
  isGuest: true,
  refresh: async () => {},
  refreshVerified: async () => {
    throw new Error('Bản dựng sẵn không xác thực phiên')
  },
}

export function GuestHomePrerender() {
  return (
    <AuthContext.Provider value={GUEST_AUTH}>
      <ThemeProvider>
        <LangProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={['/']}>
              <SkipLink />
              <div className={APP_CONTENT_COLUMN_CLASS}>
                <GuestHomePage />
              </div>
              <BottomNav />
            </MemoryRouter>
          </ToastProvider>
        </LangProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  )
}

// apps/dhcb/src/pages/core/GuestHomePage.tsx — Trang chủ `/` cho KHÁCH (chưa đăng nhập).
//
// VÌ SAO TÁCH KHỎI Home.tsx (đo Lighthouse mobile 2026-10-10, changelog đợt này): Home.tsx là
// trang chủ NGƯỜI ĐÃ ĐĂNG NHẬP — kéo theo "Hôm nay", CEFR, SRS, chỉ mục bài học… (~512 KB JS thô
// ngoài bundle khởi động). Khách chỉ cần Companion + một CTA + dải môn, nhưng trước đây vẫn phải
// tải hết số JS đó mới vẽ được chữ đầu tiên → LCP mobile 5,1 s. App.tsx (`HomeRoute`) giờ nạp
// lười ĐÚNG trang này cho khách; Home.tsx vẫn dùng lại nó ở nhánh khách để không lặp bố cục.
import { useLayoutEffect } from 'react'
import Layout from '../../components/Layout.js'
import GuestHome from '../../components/Home/GuestHome.js'
import { PageShell } from '@core/PageShell'
import { useLang } from '../../context/useLang'
import { usePageTitle } from '../../lib/usePageTitle'
import { releaseGuestPrerender } from '../../lib/guestPrerender'

// Một tiêu đề tab cho cả hai bản trang chủ (khách / đã đăng nhập).
export const HOME_PAGE_TITLE = 'Trang chủ | Đồng Hành Cùng Bạn'

export default function GuestHomePage() {
  const { T } = useLang()
  usePageTitle(HOME_PAGE_TITLE)
  // Trang thật đã commit → gỡ bản HTML dựng sẵn, hiện `#root` TRƯỚC lần vẽ kế tiếp (layout effect)
  // để hai bản đổi chỗ trong cùng một khung hình. Xem lib/guestPrerender.ts.
  useLayoutEffect(releaseGuestPrerender, [])
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout title={T.greeting} back={false} />
      <PageShell width="standard" baseWidth="max-w-3xl">
        <GuestHome />
      </PageShell>
    </div>
  )
}

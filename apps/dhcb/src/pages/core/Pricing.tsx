// apps/dhcb/src/pages/core/Pricing.tsx — Trang "Bảng giá / Nâng cấp" (/nang-cap).
//
// Vì sao tách khỏi trang Hồ sơ (audit UI/UX 2026-08-31 mục B9): bảng gói trước đây là một
// <h2> nhúng giữa Profile, mà Profile giới hạn `max-w-3xl` — trên desktop 4 gói
// (Free/VIP) không xếp cạnh nhau để so sánh được, và không có URL nào dẫn thẳng
// tới bảng giá. Trang này nới bề rộng ở desktop (`lg:max-w-6xl`) để UpgradeSection bung
// `lg:grid-cols-4`; Hồ sơ giữ bản rút gọn có nút dẫn sang đây.

import { MAIN_CONTENT_ID } from '@core/PageShell'
import Layout from '../../components/Layout'
import UpgradeSection from '../../components/UpgradeSection'
import PricePromoBanner from '../../components/PricePromoBanner'
import VipPlanSummary from '../../components/VipPlanSummary'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../context/useLang'

export default function Pricing() {
  const { user } = useAuth()
  // [Slice 04] Chữ giao diện theo ngôn ngữ giao diện, không theo chiều học Tiếng Anh.
  const isA = useLang().lang === 'vi'

  usePageTitle('Nâng cấp VIP | Đồng Hành Cùng Bạn')

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title={isA ? 'Nâng cấp gói' : 'Upgrade your plan'} />

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none max-w-3xl lg:max-w-6xl mx-auto px-4 pt-6 pb-[calc(1.5rem+var(--bnav-h))] space-y-6"
      >
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? 'Nâng cấp gói' : 'Upgrade your plan'}
        </h1>

        <PricePromoBanner isA={isA} />

        {/* Đã là VIP thì UpgradeSection tự trả về null — khi đó hiện khối "Gói của bạn" (hạn
            dùng · lượt AI hôm nay · quyền lợi) thay vì một dòng chữ (audit M8, đợt U5). */}
        {user?.plan === 'vip' ? (
          <VipPlanSummary isA={isA} planExpiresAt={user.planExpiresAt} />
        ) : (
          <UpgradeSection isA={isA} currentPlan={user?.plan ?? 'free'} variant="full" />
        )}
      </main>
    </div>
  )
}

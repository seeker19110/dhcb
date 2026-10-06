import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sliders,
  ShieldCheck,
  BarChart3,
  Activity,
  ToggleRight,
  FileText,
  ChevronDown,
  Award,
  Database,
  GraduationCap,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { usePageTitle } from '../../lib/usePageTitle'
import AdminUsersPanel from '../../components/admin/AdminUsersPanel'
import AdminLimitsPanel from '../../components/admin/AdminLimitsPanel'
import AdminGrantPlanPanel from '../../components/admin/AdminGrantPlanPanel'
import AdminVipWhitelistPanel from '../../components/admin/AdminVipWhitelistPanel'
import AdminPlanFeaturesPanel from '../../components/admin/AdminPlanFeaturesPanel'
import AdminPlanMarketingPanel from '../../components/admin/AdminPlanMarketingPanel'
import AdminPricePromoPanel from '../../components/admin/AdminPricePromoPanel'
import AdminAchievementRewardsPanel from '../../components/admin/AdminAchievementRewardsPanel'
import AdminAnalyticsPanel from '../../components/admin/AdminAnalyticsPanel'
import AdminIntakePanel from '../../components/admin/AdminIntakePanel'
import AdminUsagePanel from '../../components/admin/AdminUsagePanel'
import AdminPaymentsPanel from '../../components/admin/AdminPaymentsPanel'
import AdminSystemControlPanel from '../../components/admin/AdminSystemControlPanel'
import AdminReservedNamesPanel from '../../components/admin/AdminReservedNamesPanel'
import AdminFeedbackPanel from '../../components/admin/AdminFeedbackPanel'
import AdminTtsCachePanel from '../../components/admin/AdminTtsCachePanel'
import AdminFeatureStatusPanel from '../../components/admin/AdminFeatureStatusPanel'
import AdminStemReviewPanel from '../../components/admin/AdminStemReviewPanel'

type TabKey =
  | 'usage'
  | 'limits'
  | 'plan-features'
  | 'plan-marketing'
  | 'achievement-rewards'
  | 'grant-plan'
  | 'analytics'
  | 'tts-cache'
  | 'stem-review'

const TABS: { key: TabKey; label: string; icon: typeof Sliders }[] = [
  { key: 'usage', label: 'Sử dụng, chi phí & Vận hành', icon: Activity },
  { key: 'limits', label: 'Hạn mức & khuyến mãi', icon: Sliders },
  { key: 'plan-features', label: 'Tính năng theo gói', icon: ToggleRight },
  { key: 'plan-marketing', label: 'Nội dung gói', icon: FileText },
  { key: 'achievement-rewards', label: 'Thưởng huy hiệu', icon: Award },
  { key: 'grant-plan', label: 'Người dùng, Thanh toán & Từ cấm', icon: ShieldCheck },
  { key: 'analytics', label: 'Analytics & Phản hồi AI', icon: BarChart3 },
  { key: 'tts-cache', label: 'Cache TTS & R2', icon: Database },
  { key: 'stem-review', label: 'Duyệt nội dung STEM', icon: GraduationCap },
]

// Bọc riêng vì cần state chung: bấm 1 dòng ở bảng "Người dùng" (AdminUsersPanel) sẽ điền sẵn
// email vào form "Cấp gói tay" (AdminGrantPlanPanel) bên dưới, kèm gợi ý autocomplete từ danh
// sách user đã tải.
function AdminGrantPlanSection() {
  const [prefillEmail, setPrefillEmail] = useState<string>()
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])

  return (
    <>
      <AdminPaymentsPanel />
      <AdminUsersPanel onSelectEmail={setPrefillEmail} onEmailsChange={setEmailSuggestions} />
      <AdminGrantPlanPanel prefillEmail={prefillEmail} emailSuggestions={emailSuggestions} />
      <AdminVipWhitelistPanel />
      {/* Ghi chú: Mục "Chặn tên tài khoản giả danh" (AdminReservedNamesPanel) đã được bổ sung
      và tích hợp hoàn chỉnh vào tab "Người dùng, Thanh toán & Từ cấm" (api/admin-reserved-names.ts). */}
      <AdminReservedNamesPanel />
    </>
  )
}

function AdminPanel({ tabKey }: { tabKey: TabKey }) {
  switch (tabKey) {
    case 'usage':
      return (
        <>
          <AdminUsagePanel />
          <AdminFeatureStatusPanel />
          <AdminSystemControlPanel />
        </>
      )
    case 'limits':
      return (
        <>
          <AdminLimitsPanel />
          <AdminPricePromoPanel />
        </>
      )
    case 'plan-features':
      return <AdminPlanFeaturesPanel />
    case 'plan-marketing':
      return <AdminPlanMarketingPanel />
    case 'achievement-rewards':
      return <AdminAchievementRewardsPanel />
    case 'grant-plan':
      return <AdminGrantPlanSection />
    case 'analytics':
      return (
        <>
          <AdminAnalyticsPanel />
          <AdminIntakePanel />
          <AdminFeedbackPanel />
        </>
      )
    case 'tts-cache':
      return <AdminTtsCachePanel />
    case 'stem-review':
      return <AdminStemReviewPanel />
  }
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [openKey, setOpenKey] = useState<TabKey | null>(
    TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : 'usage',
  )

  usePageTitle('Quản trị | Đồng Hành Cùng Bạn')

  const toggle = (key: TabKey) => {
    const next = openKey === key ? null : key
    setOpenKey(next)
    setSearchParams(next ? { tab: next } : {}, { replace: true })
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title="Quản trị hệ thống" />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-[calc(1.5rem+var(--bnav-h))]">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Quản trị hệ thống
        </h1>

        <div className="space-y-3">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isOpen = openKey === key
            return (
              <div
                key={key}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-expanded={isOpen}
                  className="tap-44 w-full flex items-center gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-800/40"
                >
                  <Icon className="w-4 h-4 shrink-0 text-accent-400" />
                  <span className="flex-1 text-sm font-semibold text-white">{label}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-800/80 space-y-4">
                    <AdminPanel tabKey={key} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

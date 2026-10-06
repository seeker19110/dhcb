// src/pages/Quests.tsx — Trang "Nhiệm vụ" đầy đủ (streak/thi cấp CEFR/chia sẻ/mời bạn), dùng
// chung nội dung nhiệm vụ với khối mở-ngay trong Hồ sơ qua QuestsPanel.tsx.
import { Gift } from 'lucide-react'
import Layout from '../../components/Layout'
import ReferralSection from '../../components/ReferralSection'
import QuestsPanel from '../../components/QuestsPanel'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../context/useLang'
import { PageShell } from '@core/PageShell'

export default function Quests() {
  const { lang } = useLang()
  const isA = lang === 'vi'
  const { user } = useAuth()

  usePageTitle('Nhiệm vụ | Đồng Hành Cùng Bạn')

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title={isA ? 'Nhiệm vụ' : 'Quests'} />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang danh sách → width="standard". */}
      <PageShell width="standard" baseWidth="max-w-2xl" className="space-y-4">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? 'Nhiệm vụ' : 'Quests'}
        </h1>

        <QuestsPanel isA={isA} userId={user?.id} />

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-accent-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {isA ? 'Mời bạn cùng học' : 'Invite a friend'}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isA
                ? 'Xem chi tiết mã mời và tiến độ thưởng bên dưới.'
                : 'See your invite code and progress below.'}
            </p>
          </div>
        </div>
        <ReferralSection isA={isA} />
      </PageShell>
    </div>
  )
}

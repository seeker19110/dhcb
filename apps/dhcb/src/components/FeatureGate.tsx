// src/components/FeatureGate.tsx — Bọc quanh 1 route, khoá tính năng nếu admin đã TẮT nó cho
// gói hiện tại của user (ma trận đọc từ /api/plan-features, xem src/lib/planFeatures.ts +
// tab "Tính năng theo gói" trong /admin). Đây là khoá phía CLIENT cho trải nghiệm — như mọi
// gate theo gói khác trong app (voice tiers, role-play), không phải cơ chế chống gian lận (các
// tính năng ở đây không tốn phí AI trực tiếp ngoài hạn mức đã chặn ở server).
import { useNavigate } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLang } from '../context/useLang'
import { isFeatureEnabled } from '../lib/planFeatures'
import { effectivePlan } from '../lib/promo'
import { buttonClass } from '@core/buttonStyles'

export default function FeatureGate({
  featureKey,
  children,
}: {
  featureKey: string
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const { lang } = useLang()
  const nav = useNavigate()
  const isVi = lang === 'vi'

  if (!user || isFeatureEnabled(effectivePlan(user.plan), featureKey)) {
    return <>{children}</>
  }

  return (
    <div className="min-h-dvh bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-zinc-500" />
        </div>
        <h1 className="text-lg font-semibold text-white">
          {isVi ? 'Tính năng chưa mở cho gói của bạn' : 'Not available on your plan'}
        </h1>
        <p className="text-sm text-zinc-400">
          {isVi
            ? 'Nâng cấp gói để mở khoá tính năng này.'
            : 'Upgrade your plan to unlock this feature.'}
        </p>
        <button
          type="button"
          onClick={() => nav('/cai-dat')}
          className={buttonClass({ size: 'lg' })}
        >
          <Sparkles className="w-4 h-4" />
          {isVi ? 'Nâng cấp gói' : 'Upgrade plan'}
        </button>
      </div>
    </div>
  )
}

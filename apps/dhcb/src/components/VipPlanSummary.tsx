// apps/dhcb/src/components/VipPlanSummary.tsx — Khối "Gói của bạn" ở /nang-cap cho người đang
// dùng VIP.
//
// [2026-10-05, audit M8] Trước đây trang /nang-cap của VIP chỉ có MỘT dòng "Bạn đang dùng gói
// VIP — không còn gì để nâng cấp": không hạn dùng, không lượt đã dùng, không quyền lợi. Khối này
// trả lời đúng ba câu người dùng VIP tới trang gói để hỏi: gói của tôi tới bao giờ, hôm nay tôi
// đã dùng bao nhiêu lượt, gói cho tôi những gì.
import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { PlanFeatureCard } from './UpgradeSection'
import LoadError from './LoadError'
import { fetchWeeklyCredit, type WeeklyCreditInfo } from '../lib/weeklyCredit'
import { formatPlanExpiry, isLifetimeVip } from '../lib/planLabel'

// `remaining` = số lượt CÒN LẠI hôm nay, `cap` = hạn mức TỔNG/ngày (api/usage-summary.ts).
type CreditState =
  | { status: 'loading' }
  | { status: 'ready'; remaining: number | null; cap: number }
  | { status: 'unlimited'; usedToday: number }
  | { status: 'error' }

function toCreditState(info: WeeklyCreditInfo | null): CreditState {
  if (info?.unlimited === true && info.usedToday !== undefined) {
    return { status: 'unlimited', usedToday: info.usedToday }
  }
  return info
    ? { status: 'ready', remaining: info.freeWeeklyCredit, cap: info.freeWeeklyCap }
    : { status: 'error' }
}

export default function VipPlanSummary({
  isA,
  planExpiresAt,
}: {
  isA: boolean
  planExpiresAt: string | null | undefined
}) {
  const [credit, setCredit] = useState<CreditState>({ status: 'loading' })
  const [retryRevision, setRetryRevision] = useState(0)

  useEffect(() => {
    let alive = true
    // `fetchWeeklyCredit` trả null khi mạng/server lỗi hoặc body lệch hợp đồng — hiện lỗi thật,
    // KHÔNG bịa con số (CLAUDE.md §4.3).
    fetchWeeklyCredit().then((info) => {
      if (!alive) return
      setCredit(toCreditState(info))
    })
    return () => {
      alive = false
    }
  }, [retryRevision])

  // `null` = vĩnh viễn; `undefined` = phiên chưa có trường này → nói trung tính "Đang có hiệu lực".
  const until = planExpiresAt ? formatPlanExpiry(planExpiresAt, isA ? 'vi' : 'en') : null
  const termText = isLifetimeVip('vip', planExpiresAt)
    ? isA
      ? 'Vĩnh viễn — gói không có ngày hết hạn.'
      : 'Lifetime — your plan never expires.'
    : until
      ? isA
        ? `Còn hạn đến hết ngày ${until}.`
        : `Active until ${until}.`
      : isA
        ? 'Đang có hiệu lực.'
        : 'Active.'

  function retry() {
    setCredit({ status: 'loading' })
    setRetryRevision((n) => n + 1)
  }

  return (
    <section
      aria-labelledby="vip-plan-summary-heading"
      className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-start gap-3">
        <Crown className="w-5 h-5 text-amber-400 theme-light:text-amber-800 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h2 id="vip-plan-summary-heading" className="text-base font-bold text-white">
            {isA ? 'Gói của bạn: VIP' : 'Your plan: VIP'}
          </h2>
          <p className="text-sm text-zinc-300 mt-0.5">{termText}</p>
          <p className="text-sm text-zinc-300">
            {isA
              ? 'Tự chọn bài trong nội dung đã mở; lộ trình là gợi ý, không phải thứ tự bắt buộc.'
              : 'Choose freely from available lessons; the learning path is a guide, not a required order.'}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white">
          {isA ? 'Lượt AI hôm nay' : 'AI credits today'}
        </h3>
        {credit.status === 'unlimited' ? (
          <p className="text-sm text-zinc-300 mt-1">
            {isA
              ? `Không giới hạn lượt AI trong thời gian gói có hiệu lực. Hôm nay đã dùng ${credit.usedToday} lượt.`
              : `Unlimited AI turns while your plan is active. ${credit.usedToday} used today.`}
          </p>
        ) : credit.status === 'ready' && credit.remaining !== null ? (
          <p className="text-sm text-zinc-300 mt-1">
            {isA
              ? `Đã dùng ${credit.cap - credit.remaining}/${credit.cap} lượt — còn ${credit.remaining} lượt, tính chung mọi tính năng AI, làm mới mỗi ngày.`
              : `Used ${credit.cap - credit.remaining}/${credit.cap} — ${credit.remaining} left, shared across all AI features, resets daily.`}
          </p>
        ) : credit.status !== 'loading' ? (
          <div className="mt-2">
            <LoadError
              message={
                isA ? 'Chưa tải được lượt AI hôm nay.' : 'Could not load today’s AI credits.'
              }
              hint={
                isA
                  ? 'Gói VIP của bạn không bị ảnh hưởng — đây chỉ là lỗi kết nối.'
                  : 'Your VIP plan is not affected — this is only a connection error.'
              }
              onRetry={retry}
            />
          </div>
        ) : (
          <p role="status" className="text-sm text-zinc-300 mt-1">
            {isA ? 'Đang tải lượt AI…' : 'Loading AI credits…'}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-2">
          {isA ? 'Quyền lợi của gói' : 'Plan benefits'}
        </h3>
        <PlanFeatureCard planKey="vip" isA={isA} isCurrent />
      </div>
    </section>
  )
}

// src/components/ReferralSection.tsx — Khối "Mời bạn cùng học" trong trang Hồ sơ.
// Hiện mã mời + link copy được + tiến độ thưởng. Thưởng bằng NGÀY GÓI PRO (không phải tiền),
// và chỉ được tính khi người được mời HỌC THẬT 1 phiên — xem api/_lib/referral.ts.

import { useEffect, useState } from 'react'
import { Gift, Copy, Check } from 'lucide-react'
import { fetchReferralStats, buildReferralLink, type ReferralStats } from '../lib/referral'

export default function ReferralSection({ isA }: { isA: boolean }) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    // [audit UI/UX P1-4] `fetchReferralStats` không có giới hạn thời gian — kết nối treo (không
    // reject, không resolve) làm khung xám (skeleton) hiện mãi vì `loading` không bao giờ về
    // false. Đua với một promise timeout 8s: hết giờ coi như lỗi, không hiện skeleton vô hạn.
    Promise.race([
      fetchReferralStats(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ])
      .catch(() => null)
      .then((s) => {
        if (!alive) return
        setStats(s)
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  async function copyLink() {
    if (!stats) return
    try {
      await navigator.clipboard.writeText(buildReferralLink(stats.code))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Trình duyệt chặn clipboard — người dùng vẫn đọc/gõ tay được mã hiển thị bên trên.
    }
  }

  // Lỗi tải (chưa đăng nhập/mạng lỗi) → ẩn hẳn khối, không hiện khung lỗi gây rối trang Hồ sơ.
  if (!loading && !stats) return null

  return (
    <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-4 h-4 text-accent-400" />
        <h2 className="text-sm font-semibold text-white">
          {isA ? 'Mời bạn cùng học' : 'Invite a friend'}
        </h2>
      </div>

      {loading || !stats ? (
        <div className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />
      ) : (
        <>
          <p className="text-xs text-zinc-400 mb-3">
            {isA
              ? `Bạn và bạn của bạn mỗi người được +${stats.rewardDays} ngày gói VIP khi họ học xong buổi đầu tiên.`
              : `You and your friend each get +${stats.rewardDays} days of Pro once they finish their first session.`}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 min-w-0 truncate bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest text-accent-400">
              {stats.code}
            </code>
            <button
              type="button"
              onClick={copyLink}
              aria-label={isA ? 'Sao chép link mời' : 'Copy invite link'}
              className="tap-44 shrink-0 flex items-center gap-1.5 rounded-xl bg-accent-500/15 border border-accent-500/30 px-3 py-2.5 text-xs font-medium text-accent-400 hover:bg-accent-500/25 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? (isA ? 'Đã chép' : 'Copied') : isA ? 'Chép liên kết' : 'Copy link'}
            </button>
          </div>

          <p className="text-xs text-zinc-400">
            {isA
              ? `Đã mời thành công: ${stats.rewardedCount}/${stats.maxRewarded} lượt được thưởng`
              : `Successful invites: ${stats.rewardedCount}/${stats.maxRewarded} rewarded`}
            {stats.pendingCount > 0 &&
              (isA
                ? ` · ${stats.pendingCount} bạn chưa học buổi đầu`
                : ` · ${stats.pendingCount} yet to finish their first session`)}
          </p>
        </>
      )}
    </section>
  )
}

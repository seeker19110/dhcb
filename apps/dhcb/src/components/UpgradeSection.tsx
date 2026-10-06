// src/components/UpgradeSection.tsx — Khối "Nâng cấp VIP".
// Bản đầy đủ (`variant="full"`) nằm ở trang riêng /nang-cap (pages/core/Pricing.tsx);
// trang Hồ sơ chỉ nhúng bản rút gọn (`variant="compact"`) dẫn sang đó.
//
// SePay KHÔNG redirect người dùng về sau khi chuyển khoản (khác cổng trung gian như PayOS) —
// nên luồng ở đây KHÔNG rời khỏi app: chọn gói → hiện mã QR ngay trong trang → người dùng quét
// chuyển khoản → component tự POLL /api/payment-status cho tới khi thấy 'paid'. Xem đặc tả:
// docs/research/dac-ta-thanh-toan-2026-07-25.md.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Crown, Copy, Check, Loader2, Sparkles } from 'lucide-react'
import {
  createCheckout,
  fetchPaymentStatus,
  fetchPlanPrices,
  type PayableCycle,
  type PayablePlan,
  type PlanPrices,
  type CheckoutResult,
} from '../lib/payment'
import { useToast } from '@core/ToastProvider'
import { Skeleton } from './Skeleton'
import LoadError from './LoadError'
import { getPlanMarketing } from '../lib/planMarketing'
import type { Plan } from '../types'

const CYCLE_LABEL: Record<PayableCycle, { vi: string; en: string }> = {
  '10day': { vi: '10 ngày', en: '10 days' },
  month: { vi: 'Tháng', en: 'Month' },
  year: { vi: 'Năm', en: 'Year' },
}

// Nội dung MẶC ĐỊNH (fallback) khi server chưa trả được /api/plan-marketing (mất mạng lần đầu
// mở app, hoặc DB chưa chạy migration 0025_plan_marketing.sql) — admin sửa nội dung THẬT qua
// /admin (tab "Nội dung gói"), xem api/admin-plan-marketing.ts. Số liệu ở đây khớp hạn mức/
// quyền giọng THẬT tại thời điểm viết (api/_lib/usage.ts, src/lib/voiceTiers.ts) — chỉ dùng khi
// admin chưa từng sửa gì trong DB.
const PLAN_INFO: Record<
  Plan,
  {
    badge: string
    title: { vi: string; en: string }
    tagline: { vi: string; en: string }
    bullets: { vi: string; en: string }[]
  }
> = {
  free: {
    badge: '🌱',
    title: { vi: 'Free', en: 'Free' },
    tagline: { vi: 'Học đầy đủ, miễn phí', en: 'Full learning, free' },
    bullets: [
      { vi: '12.168 từ vựng tra cứu & SRS flashcard', en: '12,168 dictionary words & SRS' },
      {
        vi: '30 lượt AI/ngày (Chat · Viết · Nói · Nghe) — không cần trả phí',
        en: '30 AI turns/day (Chat · Writing · Speaking · Listening) — no payment needed',
      },
      { vi: 'Đầy đủ lộ trình CEFR A1–C2', en: 'Full A1–C2 CEFR roadmap' },
    ],
  },
  vip: {
    badge: '👑',
    title: { vi: 'VIP', en: 'VIP' },
    tagline: { vi: 'Đỉnh cao Công nghệ AI', en: 'For serious practice' },
    bullets: [
      {
        // Gemini Live CHƯA kiểm chứng với key thật (nợ mở PROGRESS.md #15) — bắt buộc gắn
        // nhãn "đang thử nghiệm"/"beta" để không hứa quá lời một tính năng chưa chắc chạy.
        vi: 'Nói chuyện trực tiếp với gia sư bằng giọng, ngắt lời được như người thật (đang thử nghiệm) · Phòng học nhóm bằng âm thanh',
        en: 'Talk live with your tutor by voice, interrupt like a real conversation (beta) · Audio co-learning rooms',
      },
      {
        vi: 'Cung điện trí nhớ 3D: ghi nhớ từ vựng theo không gian',
        en: '3D memory palace: remember vocabulary spatially',
      },
      {
        vi: '300 lượt AI/ngày (gấp 10 lần gói Free) + 16 giọng đọc bản xứ chất lượng cao',
        en: '300 AI turns/day (10x the Free plan) + 16 high-quality native voices',
      },
    ],
  },
}

export function PlanFeatureCard({
  planKey,
  isA,
  isCurrent,
}: {
  planKey: Plan
  isA: boolean
  isCurrent: boolean
}) {
  const fetched = getPlanMarketing()?.plans[planKey]
  const hasFetchedContent = !!fetched && (fetched.badge !== '' || fetched.bullets.length > 0)
  const info = hasFetchedContent
    ? {
        badge: fetched!.badge || PLAN_INFO[planKey].badge,
        title: PLAN_INFO[planKey].title,
        tagline: {
          vi: fetched!.taglineVi || PLAN_INFO[planKey].tagline.vi,
          en: fetched!.taglineEn || PLAN_INFO[planKey].tagline.en,
        },
        bullets: fetched!.bullets.length
          ? fetched!.bullets.map((b) => ({ vi: b.textVi, en: b.textEn }))
          : PLAN_INFO[planKey].bullets,
      }
    : PLAN_INFO[planKey]
  return (
    <div
      className={`rounded-xl border p-3 ${
        isCurrent ? 'border-accent-500/50 bg-accent-500/5' : 'border-zinc-800 bg-zinc-950/40'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span aria-hidden>{info.badge}</span>
        <span className="text-sm font-semibold text-white">{info.title.vi}</span>
        {isCurrent && (
          <span className="text-[11px] font-medium text-accent-300 theme-light:text-accent-800 bg-accent-500/15 rounded-full px-1.5 py-0.5">
            {isA ? 'Đang dùng' : 'Current'}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-400 mb-1.5">{isA ? info.tagline.vi : info.tagline.en}</p>
      <ul className="space-y-1">
        {info.bullets.map((b, i) => (
          <li key={i} className="text-xs text-zinc-300 flex gap-1.5">
            <span className="text-accent-400 shrink-0" aria-hidden>
              •
            </span>
            <span>{isA ? b.vi : b.en}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const POLL_INTERVAL_MS = 4000

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ'
}

export default function UpgradeSection({
  isA,
  currentPlan,
  variant = 'full',
}: {
  isA: boolean
  currentPlan: string
  /**
   * 'full' — bảng so sánh đầy đủ + luồng thanh toán (trang riêng `/nang-cap`).
   * 'compact' — chỉ một khối gọn dẫn sang trang đó (dùng trong trang Hồ sơ, nơi bề rộng
   * `max-w-3xl` không đủ để so sánh 4 gói cạnh nhau — audit UI/UX 2026-08-31 mục B9).
   */
  variant?: 'full' | 'compact'
}) {
  const toast = useToast()
  const [prices, setPrices] = useState<PlanPrices | null>(null)
  // Giá gói: trước đây lỗi API chỉ để lại dấu "…" vĩnh viễn ở ô giá — không ai biết là
  // hỏng hay đang tải. Nay tách rõ hai trạng thái tải / lỗi (có nút thử lại).
  const [pricesLoading, setPricesLoading] = useState(true)
  const [pricesError, setPricesError] = useState(false)
  // GĐ1 2026-09-12: VIP là gói trả phí duy nhất — không còn nút chọn gói, chỉ chọn chu kỳ.
  const plan: PayablePlan = 'vip'
  const [cycle, setCycle] = useState<PayableCycle>('month')
  // Số năm mua liền một lần — CHỈ có ý nghĩa khi cycle === 'year' (giảm giá luỹ tiến theo số
  // năm, xem multiYearDiscountPercent ở api/_lib/prices.ts). Reset về 1 khi đổi sang chu kỳ khác.
  const [years, setYears] = useState(1)
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null)
  const [creating, setCreating] = useState(false)
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadPrices = useCallback(() => {
    setPricesLoading(true)
    setPricesError(false)
    // fetchPlanPrices nuốt lỗi và trả null → coi null là lỗi tải.
    void fetchPlanPrices()
      .then((p) => {
        if (p) setPrices(p)
        else setPricesError(true)
      })
      .catch(() => setPricesError(true))
      .finally(() => setPricesLoading(false))
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadPrices)
  }, [loadPrices])

  // Dừng poll/đếm ngược khi rời trang — tránh gọi API vô ích sau khi component unmount.
  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
    },
    [],
  )

  // Đã là VIP → không cần chào mua nữa (Pro thấp hơn VIP, không có gì để chào thêm).
  if (currentPlan === 'vip') return null

  // Bản rút gọn: giữ nguyên `id="upgrade-section"` để chỗ khác cuộn tới vẫn đúng
  // (VoicePicker cuộn tới id này khi người dùng bấm giọng ngoài quyền gói).
  if (variant === 'compact') {
    return (
      <section
        id="upgrade-section"
        className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 animate-fade-in scroll-mt-4"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Crown className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
          <h2 className="text-sm font-semibold text-white">
            {isA ? 'Nâng cấp VIP' : 'Upgrade to VIP'}
          </h2>
        </div>
        <p className="text-xs text-zinc-300 mb-3">
          {isA
            ? 'So sánh đầy đủ Free · VIP và chọn chu kỳ 10 ngày / tháng / năm ở trang bảng giá.'
            : 'Compare Free · VIP and pick a 10-day / monthly / yearly cycle on the pricing page.'}
        </p>
        <Link
          to="/nang-cap"
          className="tap-44 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09090b] font-semibold text-sm transition"
        >
          {isA ? 'Xem bảng giá đầy đủ' : 'View full pricing'}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </section>
    )
  }

  async function handleCreateCheckout() {
    setCreating(true)
    const r = await createCheckout(plan, cycle, cycle === 'year' ? years : 1)
    setCreating(false)
    if (!r.ok) {
      toast.error(r.error)
      return
    }
    setCheckout(r.data)
    setPaid(false)
    startCountdown(r.data.expiresAt)
    startPolling(r.data.paymentCode)
  }

  function startCountdown(expiresAt: string) {
    if (tickRef.current) clearInterval(tickRef.current)
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0 && tickRef.current) clearInterval(tickRef.current)
    }
    tick()
    tickRef.current = setInterval(tick, 1000)
  }

  function startPolling(code: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const status = await fetchPaymentStatus(code)
      if (status?.status === 'paid') {
        setPaid(true)
        if (pollRef.current) clearInterval(pollRef.current)
        if (tickRef.current) clearInterval(tickRef.current)
      } else if (status?.status === 'expired' || status?.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, POLL_INTERVAL_MS)
  }

  async function copyCode() {
    if (!checkout) return
    try {
      await navigator.clipboard.writeText(checkout.paymentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Trình duyệt chặn clipboard — mã vẫn hiện sẵn để người dùng tự gõ.
    }
  }

  function reset() {
    setCheckout(null)
    setPaid(false)
    if (pollRef.current) clearInterval(pollRef.current)
    if (tickRef.current) clearInterval(tickRef.current)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <section
      id="upgrade-section"
      className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 animate-fade-in scroll-mt-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
        <h2 className="text-sm font-semibold text-white">
          {isA ? 'Nâng cấp VIP' : 'Upgrade to VIP'}
        </h2>
      </div>

      {paid ? (
        <div className="text-center py-4">
          <Sparkles className="w-8 h-8 text-amber-400 theme-light:text-amber-900 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white mb-1">
            {isA ? 'Thanh toán thành công! 🎉' : 'Payment successful! 🎉'}
          </p>
          <p className="text-xs text-zinc-400">
            {isA
              ? 'Tải lại trang để thấy gói mới nếu chưa cập nhật.'
              : 'Reload if plan not updated yet.'}
          </p>
        </div>
      ) : checkout ? (
        <div>
          <div className="flex justify-center mb-3">
            <img
              src={checkout.qrUrl}
              alt={isA ? 'Mã QR chuyển khoản' : 'Bank transfer QR code'}
              className="w-48 h-48 rounded-xl border border-zinc-700 bg-white p-1"
            />
          </div>
          <p className="text-xs text-center text-amber-300 theme-light:text-amber-800 mb-3">
            {isA
              ? 'Quét QR để app ngân hàng tự điền số tiền + nội dung — KHÔNG tự sửa 2 mục này. Nếu sửa/gõ sai, hệ thống không tự ghi nhận được và bạn cần chờ admin đối chiếu, duyệt tay.'
              : "Scan the QR so your banking app auto-fills the amount + content — do NOT edit either field. If edited or mistyped, the system can't auto-confirm and you'll need to wait for manual admin review."}
          </p>
          <div className="space-y-1.5 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">{isA ? 'Số tiền' : 'Amount'}</span>
              <span className="font-semibold text-white">{formatVnd(checkout.amountVnd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{isA ? 'Ngân hàng' : 'Bank'}</span>
              <span className="text-white">{checkout.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">{isA ? 'Số tài khoản' : 'Account'}</span>
              <span className="text-white font-mono">{checkout.bankAccount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{isA ? 'Nội dung CK' : 'Transfer content'}</span>
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1 text-white font-mono bg-zinc-800 px-2 py-1 rounded-lg"
              >
                {checkout.paymentCode}
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400 theme-light:text-green-900" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-amber-300 theme-light:text-amber-800 mb-3">
            {isA
              ? `Chuyển ĐÚNG nội dung ở trên — sai nội dung sẽ không tự động ghi nhận. Mã hết hạn sau ${mm}:${ss}.`
              : `Transfer with EXACT content above — wrong content won't auto-confirm. Code expires in ${mm}:${ss}.`}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 mb-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isA ? 'Đang chờ chuyển khoản...' : 'Waiting for transfer...'}
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full text-xs text-zinc-400 underline underline-offset-2"
          >
            {isA ? 'Huỷ, chọn gói khác' : 'Cancel, pick another plan'}
          </button>
        </div>
      ) : (
        <div>
          {/* GĐ1 2026-09-12: còn 2 gói (Free · VIP) nên bảng so sánh chỉ 2 cột, và không còn
              hàng nút chọn gói — chỉ chọn chu kỳ thanh toán của VIP. */}
          <div className="grid grid-cols-1 gap-2 mb-4 sm:grid-cols-2">
            {(['free', 'vip'] as const).map((p) => (
              <PlanFeatureCard key={p} planKey={p} isA={isA} isCurrent={currentPlan === p} />
            ))}
          </div>
          {pricesLoading && (
            <div className="flex gap-2 mb-4" aria-busy="true" aria-label="Đang tải bảng giá">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          )}

          {!pricesLoading && pricesError && (
            <div className="mb-4">
              <LoadError
                message={isA ? 'Không tải được giá — thử lại.' : 'Could not load prices — retry.'}
                onRetry={loadPrices}
              />
            </div>
          )}

          <div className={`flex gap-2 mb-4 ${pricesLoading ? 'hidden' : ''}`}>
            {(['10day', 'month', 'year'] as const).map((c) => {
              const entry = prices?.[plan][c]
              // Chu kỳ 'year' đang chọn nhiều năm (>1): hiện TỔNG tiền của đúng số năm đó
              // (yearTotals[years-1]) thay vì giá 1 năm.
              const totalVnd =
                c === 'year' && years > 1 && entry?.yearTotals
                  ? entry.yearTotals[years - 1]
                  : entry?.effectiveVnd
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCycle(c)
                    if (c !== 'year') setYears(1)
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs border ${
                    cycle === c
                      ? 'bg-accent-500/15 text-accent-300 theme-light:text-accent-800 border-accent-500/40'
                      : 'bg-zinc-800/60 text-zinc-400 border-zinc-700'
                  }`}
                >
                  <div className="font-semibold">{isA ? CYCLE_LABEL[c].vi : CYCLE_LABEL[c].en}</div>
                  {entry &&
                  totalVnd != null &&
                  totalVnd < entry.priceVnd * (c === 'year' ? years : 1) ? (
                    <div className="flex items-baseline gap-1">
                      <span className="line-through opacity-60">
                        {formatVnd(entry.priceVnd * (c === 'year' ? years : 1))}
                      </span>
                      <span>{formatVnd(totalVnd)}</span>
                    </div>
                  ) : (
                    <div>{totalVnd != null ? formatVnd(totalVnd) : pricesError ? '—' : '…'}</div>
                  )}
                </button>
              )
            })}
          </div>
          {cycle === 'year' && prices && (
            <div className="flex gap-2 mb-4">
              {Array.from({ length: prices.maxPromoYears }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setYears(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs border ${
                    years === n
                      ? 'bg-accent-500/15 text-accent-300 theme-light:text-accent-800 border-accent-500/40'
                      : 'bg-zinc-800/60 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {n} {isA ? (n === 1 ? 'năm' : 'năm') : n === 1 ? 'year' : 'years'}
                </button>
              ))}
            </div>
          )}
          {/* Nút mua: chữ TỐI CỐ ĐỊNH `#09090b` trên amber-500 (≈ 9:1). `text-zinc-900` cũ tự đảo
              thành chữ SÁNG ở theme nền sáng → rớt AA đúng ở nút mua (audit UI/UX 2026-09-30 C4). */}
          <button
            type="button"
            onClick={handleCreateCheckout}
            disabled={creating || !prices}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09090b] font-semibold text-sm disabled:opacity-60"
          >
            {creating
              ? isA
                ? 'Đang tạo đơn...'
                : 'Creating order...'
              : isA
                ? `Nâng cấp ${plan.toUpperCase()}`
                : `Upgrade to ${plan.toUpperCase()}`}
          </button>
        </div>
      )}
    </section>
  )
}

// PendingPaymentsBlock — "Đơn thanh toán đang chờ" trong khối Xoá tài khoản (changelog 0546).
// Đặc tả: docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md.
//
// Đơn SePay chờ trả còn "sống" CHẶN xoá tài khoản (tiền chuyển muộn vẫn được ghi nhận — 0533).
// Khối này cho người dùng thấy RÕ đơn nào đang chặn (số tiền, mã nội dung chuyển khoản, giờ tạo,
// còn bao lâu hết ân hạn) và tự huỷ nếu CHẮC CHẮN chưa chuyển khoản — phải tick xác nhận trước.
// Huỷ xong mà tiền vẫn về thì không kích hoạt gói, admin hoàn tiền thủ công (server lo).

import { useEffect, useId, useState } from 'react'
import { buttonClass } from '@core/buttonStyles'
import type { LivePendingPaymentView } from '@dhcb/core-contracts/paymentCancel'
import { cancelPendingPayment, PaymentCancelError } from '../lib/paymentCancelApi'
import { useMountedRef } from '../lib/useMountedRef'
import { formatRemaining, MINUTE_MS } from '../lib/formatRemaining'

function PendingPaymentItem({
  payment,
  isA,
  now,
  onCancelled,
}: {
  payment: LivePendingPaymentView
  isA: boolean
  now: number
  onCancelled: (paymentId: string) => void
}) {
  const mounted = useMountedRef()
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const locale = isA ? 'vi-VN' : 'en-GB'
  const msLeft = new Date(payment.graceEndsAt).getTime() - now

  async function handleCancel() {
    if (busy || !confirmed) return
    setBusy(true)
    setError('')
    try {
      await cancelPendingPayment(payment.id)
      if (mounted.current) onCancelled(payment.id)
    } catch (err) {
      if (!mounted.current) return
      // Đơn vừa được trả (webhook thắng đua) ⇒ báo rõ, KHÔNG để người dùng nghĩ đã huỷ.
      if (err instanceof PaymentCancelError && err.code === 'ALREADY_PAID') {
        setError(
          isA
            ? 'Đơn này vừa được thanh toán và gói đã kích hoạt — không huỷ được. Tải lại trang để xem.'
            : 'This order has just been paid and the plan is active — it cannot be cancelled. Reload the page.',
        )
      } else if (err instanceof PaymentCancelError && err.code === 'NOT_CANCELLABLE') {
        // Đơn đã tự kết thúc ⇒ không còn chặn nữa: coi như đã gỡ.
        onCancelled(payment.id)
      } else {
        // Thông điệp server là tiếng Việt ⇒ chiều B dùng câu tiếng Anh chung.
        const generic = isA
          ? 'Không huỷ được đơn — thử lại.'
          : 'Could not cancel the order — please retry.'
        setError(isA && err instanceof Error && err.message ? err.message : generic)
      }
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  return (
    <li className="space-y-2 rounded-xl border border-line-strong bg-surface-raised p-3">
      {/* Màn hẹp: nhãn trên, giá trị dưới — mã CK không bị ngắt giữa chừng; từ sm: hai cột. */}
      <dl className="grid grid-cols-1 gap-x-3 text-sm text-content sm:grid-cols-[auto_1fr] sm:gap-y-1">
        <dt className="text-content-secondary">{isA ? 'Số tiền' : 'Amount'}</dt>
        <dd className="mb-1 font-semibold sm:mb-0">
          {payment.amountVnd.toLocaleString('vi-VN')} đ
        </dd>
        <dt className="text-content-secondary">
          {isA ? 'Nội dung chuyển khoản' : 'Transfer reference'}
        </dt>
        <dd className="mb-1 font-mono sm:mb-0">{payment.paymentCode}</dd>
        <dt className="text-content-secondary">{isA ? 'Tạo lúc' : 'Created'}</dt>
        <dd className="mb-1 sm:mb-0">{new Date(payment.createdAt).toLocaleString(locale)}</dd>
        <dt className="text-content-secondary">
          {isA ? 'Hết ân hạn sau' : 'Grace period ends in'}
        </dt>
        <dd>
          {formatRemaining(msLeft, isA)}{' '}
          <span className="text-content-secondary">
            ({new Date(payment.graceEndsAt).toLocaleString(locale)})
          </span>
        </dd>
      </dl>
      <label className="tap-44 flex items-start gap-3 text-sm text-content">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={busy}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        {isA
          ? `Tôi xác nhận CHƯA chuyển khoản cho đơn ${payment.paymentCode}.`
          : `I confirm I have NOT transferred money for order ${payment.paymentCode}.`}
      </label>
      {error && (
        <p role="alert" className="text-sm text-content">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleCancel()}
        disabled={!confirmed || busy}
        className={buttonClass({ variant: 'secondary', fullWidth: true })}
      >
        {busy
          ? isA
            ? 'Đang huỷ đơn…'
            : 'Cancelling…'
          : isA
            ? 'Huỷ đơn — tôi CHƯA chuyển khoản'
            : 'Cancel order — I have NOT paid'}
      </button>
    </li>
  )
}

export default function PendingPaymentsBlock({
  payments,
  isA,
  onCancelled,
}: {
  payments: LivePendingPaymentView[]
  isA: boolean
  /** Gọi khi một đơn không còn chặn (đã huỷ / đã tự kết thúc). */
  onCancelled: (paymentId: string) => void
}) {
  const uid = useId()
  // Đồng hồ cập nhật mỗi phút cho dòng "hết ân hạn sau" — đủ chính xác, không tốn pin.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), MINUTE_MS)
    return () => clearInterval(t)
  }, [])

  if (payments.length === 0) return null
  const titleId = `${uid}-title`
  return (
    <section
      aria-labelledby={titleId}
      className="space-y-3 rounded-xl border-2 border-warm-500 bg-surface-card p-3"
    >
      <h4 id={titleId} className="text-sm font-semibold text-content">
        {isA ? 'Đơn thanh toán đang chờ' : 'Pending payment orders'}
      </h4>
      <p className="text-sm text-content">
        {isA
          ? 'Chưa xoá được tài khoản khi còn đơn dưới đây: nếu bạn đã chuyển khoản, tiền về muộn (tới 24 giờ sau hạn đơn) vẫn được ghi nhận. Đợi đơn hoàn tất hoặc hết ân hạn — hoặc huỷ đơn nếu bạn CHẮC CHẮN chưa chuyển.'
          : 'Your account cannot be deleted while the order below is open: if you already paid, late transfers (up to 24 hours after the deadline) are still credited. Wait until it completes or the grace period ends — or cancel it if you are SURE you have not paid.'}
      </p>
      <p className="text-sm text-content">
        {isA
          ? 'Nếu đã chuyển tiền thì đừng huỷ: tiền về sau khi huỷ sẽ KHÔNG kích hoạt gói mà phải chờ hoàn tiền thủ công.'
          : 'If you already sent money, do not cancel: money arriving after cancellation will NOT activate the plan and must be refunded manually.'}
      </p>
      <ul className="space-y-3">
        {payments.map((p) => (
          <PendingPaymentItem
            key={p.id}
            payment={p}
            isA={isA}
            now={now}
            onCancelled={onCancelled}
          />
        ))}
      </ul>
    </section>
  )
}

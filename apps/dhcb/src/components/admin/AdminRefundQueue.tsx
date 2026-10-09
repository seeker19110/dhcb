// AdminRefundQueue — "Cần hoàn tiền": tiền SePay về cho đơn người dùng ĐÃ HUỶ hoặc của tài khoản
// ĐÃ XOÁ (changelog 0546). Webhook không cấp gói cho các khoản này; admin hoàn tiền ngoài hệ thống
// (tra sao kê theo mã tham chiếu) rồi bấm "Đã hoàn tiền" + ghi chú — dòng CSDL chỉ chuyển được
// một chiều needed → refunded nên đó chính là bản ghi kiểm toán.
//
// Hiện NỔI BẬT ở đầu mục thanh toán khi còn khoản chưa hoàn; ẩn hẳn khi chưa từng có khoản nào.

import { useCallback, useEffect, useId, useState } from 'react'
import { getAuthHeader } from '@core/authHeader'
import { buttonClass } from '@core/buttonStyles'
import {
  AdminRefundListSchema,
  REFUND_NOTE_MAX,
  type AdminRefundRow,
} from '@dhcb/core-contracts/paymentCancel'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'

const REASON_LABEL: Record<AdminRefundRow['reason'], string> = {
  cancelled_by_user: 'Người dùng đã tự huỷ đơn',
  account_deleted: 'Tài khoản đã xoá',
}

function RefundItem({ row, onMarked }: { row: AdminRefundRow; onMarked: () => void }) {
  const uid = useId()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function markRefunded(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !note.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ action: 'mark-refunded', refundId: row.id, note: note.trim() }),
      })
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Không ghi nhận được'
        throw new Error(msg)
      }
      onMarked()
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Không ghi nhận được'))
    } finally {
      setBusy(false)
    }
  }

  // [nhãn, giá trị, là mã (chữ đơn cách để đọc/đối chiếu từng ký tự)]
  const fields: Array<[string, string, boolean]> = [
    ['Số tiền về', `${row.amountVnd.toLocaleString('vi-VN')} đ`, false],
    ['Mã giao dịch SePay', row.providerTxnId, true],
    ['Mã tham chiếu ngân hàng', row.referenceCode ?? '—', true],
    ['Ngân hàng', row.gateway ?? '—', false],
    ['Tài khoản nhận', row.receivingAccount ?? '—', true],
    [
      'Thời gian giao dịch',
      row.transactionDate ?? new Date(row.receivedAt).toLocaleString('vi-VN'),
      false,
    ],
    ['Mã đơn', row.paymentCode, true],
    ['Lý do không cấp gói', REASON_LABEL[row.reason], false],
  ]

  return (
    <li className="space-y-2 rounded-xl border border-line-strong bg-surface-raised p-3">
      <dl className="grid grid-cols-1 gap-x-3 gap-y-1 text-xs text-content sm:grid-cols-[auto_1fr]">
        {fields.map(([k, v, isCode]) => (
          <div key={k} className="contents">
            <dt className="text-content-secondary">{k}</dt>
            <dd className={`mb-1 break-all sm:mb-0 ${isCode ? 'font-mono' : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {row.status === 'refunded' ? (
        <p className="text-xs text-content">
          Đã hoàn lúc {row.refundedAt ? new Date(row.refundedAt).toLocaleString('vi-VN') : '—'} ·
          Ghi chú: {row.refundNote}
        </p>
      ) : (
        <form className="space-y-2" onSubmit={(e) => void markRefunded(e)}>
          <label htmlFor={`${uid}-note`} className="block text-xs text-content">
            Ghi chú hoàn tiền (vd mã giao dịch chuyển trả) — bắt buộc
          </label>
          <input
            id={`${uid}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={REFUND_NOTE_MAX}
            disabled={busy}
            className="w-full rounded-lg border border-line-strong bg-surface-card px-3 py-2 text-sm text-content"
          />
          {error && (
            <p role="alert" className="text-xs text-content">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !note.trim()}
            className={buttonClass({ variant: 'primary', size: 'sm', className: 'tap-44' })}
          >
            {busy ? 'Đang ghi nhận…' : 'Đã hoàn tiền'}
          </button>
        </form>
      )}
    </li>
  )
}

export default function AdminRefundQueue() {
  const titleId = useId()
  const [rows, setRows] = useState<AdminRefundRow[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin-payments?view=refunds', {
        headers: getAuthHeader(),
      })
      if (!res.ok) throw new Error('Không tải được danh sách cần hoàn tiền')
      const parsed = AdminRefundListSchema.safeParse(await res.json().catch(() => null))
      if (!parsed.success) throw new Error('Dữ liệu cần hoàn tiền không hợp lệ')
      setError('')
      setRows(parsed.data.refunds)
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Không tải được danh sách cần hoàn tiền'))
    }
  }, [])

  useEffect(() => {
    // Hoãn sang microtask — không setState đồng bộ trong thân effect (react-hooks 7).
    void Promise.resolve().then(load)
  }, [load])

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-line-strong p-3 text-xs text-content">
        {error}{' '}
        <button
          type="button"
          onClick={() => void load()}
          className={buttonClass({ variant: 'outline', size: 'sm' })}
        >
          Thử lại
        </button>
      </div>
    )
  }
  // Chưa tải xong hoặc chưa từng có khoản nào ⇒ không chiếm chỗ.
  if (!rows || rows.length === 0) return null

  const needed = rows.filter((r) => r.status === 'needed')
  const done = rows.filter((r) => r.status === 'refunded')
  return (
    <section
      aria-labelledby={titleId}
      className={`space-y-3 rounded-xl bg-surface-card p-3 ${
        needed.length > 0 ? 'border-2 border-warm-500' : 'border border-line-subtle'
      }`}
    >
      <h4 id={titleId} className="text-sm font-semibold text-content">
        Cần hoàn tiền ({needed.length})
      </h4>
      <p className="text-xs text-content">
        Tiền đã về cho đơn người dùng đã huỷ hoặc tài khoản đã xoá — hệ thống KHÔNG cấp gói. Tra sao
        kê theo mã tham chiếu để biết tài khoản nguồn, chuyển trả, rồi bấm “Đã hoàn tiền”.
      </p>
      {needed.length > 0 && (
        <ul className="space-y-2">
          {needed.map((r) => (
            <RefundItem key={r.id} row={r} onMarked={() => void load()} />
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <details>
          <summary className="tap-44 cursor-pointer text-xs text-content">
            Đã hoàn ({done.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {done.map((r) => (
              <RefundItem key={r.id} row={r} onMarked={() => void load()} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

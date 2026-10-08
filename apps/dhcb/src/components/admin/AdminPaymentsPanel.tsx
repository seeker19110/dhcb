import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Download,
  ShieldCheck,
  X,
} from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import type { AdminPaymentRow } from '@dhcb/core-contracts/adminViews'
import { buttonClass } from '@core/buttonStyles'

export default function AdminPaymentsPanel() {
  const [payments, setPayments] = useState<AdminPaymentRow[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modal Khớp đơn thủ công
  const [matchingPayment, setMatchingPayment] = useState<AdminPaymentRow | null>(null)
  const [manualEmail, setManualEmail] = useState('')
  const [submittingMatch, setSubmittingMatch] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin-payments?${params.toString()}`, { headers })
      if (res.status === 401 || res.status === 403) {
        setError('Chỉ admin mới truy cập được')
        return
      }
      if (!res.ok) throw new Error('Không thể tải danh sách đơn thanh toán')

      const data = await res.json()
      setPayments(data.payments || [])
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi tải dữ liệu'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(fetchPayments)
  }, [fetchPayments])

  const handleOpenMatchModal = (pay: AdminPaymentRow) => {
    setMatchingPayment(pay)
    setManualEmail(pay.userEmail || '')
  }

  const handleManualMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matchingPayment || !manualEmail.trim()) return

    setSubmittingMatch(true)
    setError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'manual-match',
          paymentId: matchingPayment.id,
          email: manualEmail.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Khớp đơn thất bại')

      setSuccessMsg(data.message || 'Khớp đơn thủ công thành công!')
      setMatchingPayment(null)
      fetchPayments()
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi xử lý khớp đơn'))
    } finally {
      setSubmittingMatch(false)
    }
  }

  const exportToCSV = () => {
    if (!payments.length) return
    const headers = [
      'Mã đơn',
      'Email',
      'Gói',
      'Chu kỳ',
      'Số tiền (VNĐ)',
      'Trạng thái',
      'Ngày tạo',
      'Ngày trả',
    ]
    const rows = payments.map((p) => [
      p.paymentCode,
      p.userEmail || 'N/A',
      p.plan.toUpperCase(),
      p.cycle,
      p.amountVnd,
      p.status,
      new Date(p.createdAt).toLocaleString('vi-VN'),
      p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `sepay_payments_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900" />
          <div>
            <h3 className="font-semibold text-white">Quản lý Thanh toán VietQR (SePay)</h3>
            <p className="text-xs text-zinc-400">
              Xem giao dịch và khớp đơn thủ công cho khách gõ sai mã
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportToCSV}
          disabled={!payments.length}
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition"
        >
          <Download className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900" />
          Xuất CSV
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 theme-light:text-rose-900 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 theme-light:text-emerald-900 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900" />
          </button>
        </div>
      )}

      {/* Lọc & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo mã DHCBxxxx / ENVIxxxx hoặc Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ thanh toán (Pending)</option>
            <option value="paid">Đã thanh toán (Paid)</option>
            <option value="expired">Quá hạn (Expired)</option>
            <option value="failed">Thất bại (Failed)</option>
          </select>

          <button
            type="button"
            onClick={fetchPayments}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bảng giao dịch */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-900 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
            <tr>
              <th className="p-3">Mã đơn</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3">Gói & Số tiền</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Thời gian</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  Đang tải danh sách đơn thanh toán...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  Không tìm thấy giao dịch thanh toán nào
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/40">
                  <td className="p-3 font-mono font-bold text-white">{p.paymentCode}</td>
                  <td className="p-3">
                    <div className="font-medium text-white">{p.userName || 'Chưa cập nhật'}</div>
                    <div className="text-zinc-400 text-[0.6875rem]">{p.userEmail || p.userId}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[0.6875rem] font-bold uppercase mr-1.5 ${
                        p.plan === 'vip'
                          ? 'bg-amber-500/20 text-amber-300 theme-light:text-amber-900'
                          : 'bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800'
                      }`}
                    >
                      {p.plan}
                    </span>
                    <span className="font-semibold text-white">
                      {p.amountVnd.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-zinc-500 text-[0.6875rem] block">{p.cycle}</span>
                  </td>
                  <td className="p-3">
                    {p.status === 'paid' && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 theme-light:text-emerald-900 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[0.6875rem]">
                        <CheckCircle2 className="w-3 h-3" /> Đã trả
                      </span>
                    )}
                    {p.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-amber-400 theme-light:text-amber-900 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full text-[0.6875rem]">
                        <Clock className="w-3 h-3" /> Chờ trả
                      </span>
                    )}
                    {p.status === 'expired' && (
                      <span className="inline-flex items-center gap-1 text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full text-[0.6875rem]">
                        Quá hạn
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-zinc-400 text-[0.6875rem]">
                    <div>Tạo: {new Date(p.createdAt).toLocaleString('vi-VN')}</div>
                    {p.paidAt && (
                      <div className="text-emerald-400 theme-light:text-emerald-900">
                        Trả: {new Date(p.paidAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {p.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenMatchModal(p)}
                        className={buttonClass({ variant: 'secondary', size: 'sm' })}
                      >
                        Khớp đơn tay
                      </button>
                    ) : (
                      <span className="text-content-muted text-[0.6875rem]">Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Khớp đơn thủ công */}
      {matchingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900" />
                <h3 className="font-bold text-base">Khớp đơn thanh toán thủ công</h3>
              </div>
              <button
                type="button"
                onClick={() => setMatchingPayment(null)}
                aria-label="Đóng"
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-300">
              <div>
                <span className="text-zinc-500">Mã đơn:</span>{' '}
                <strong className="text-white font-mono">{matchingPayment.paymentCode}</strong>
              </div>
              <div>
                <span className="text-zinc-500">Gói nâng cấp:</span>{' '}
                <strong className="text-emerald-400 theme-light:text-emerald-900 uppercase">
                  {matchingPayment.plan} ({matchingPayment.cycle})
                </strong>
              </div>
              <div>
                <span className="text-zinc-500">Số tiền:</span>{' '}
                <strong className="text-white">
                  {matchingPayment.amountVnd.toLocaleString('vi-VN')} VNĐ
                </strong>
              </div>
            </div>

            <form onSubmit={handleManualMatch} className="space-y-3">
              <div>
                <label
                  htmlFor="adminpaymentspanel-email-tai-khoan-nhan-goi"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Email tài khoản nhận gói:
                </label>
                <input
                  id="adminpaymentspanel-email-tai-khoan-nhan-goi"
                  type="email"
                  required
                  placeholder="nhap.email.khach@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[0.6875rem] text-zinc-500 mt-1">
                  Hệ thống sẽ chuyển trạng thái đơn sang ĐÃ THANH TOÁN và lập tức cộng thêm số ngày
                  gói {matchingPayment.plan.toUpperCase()} tương ứng cho người dùng này.
                </p>
                <p className="text-[0.6875rem] text-zinc-400 mt-1">
                  💡{' '}
                  <em>
                    Mã thanh toán hệ thống hiện sử dụng tiền tố{' '}
                    <code className="text-emerald-400 theme-light:text-emerald-900 font-mono">
                      DHCB
                    </code>{' '}
                    (mã cũ <code className="text-zinc-300 font-mono">ENVI</code> vẫn khớp tự động
                    vĩnh viễn).
                  </em>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMatchingPayment(null)}
                  className={buttonClass({ variant: 'outline' })}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingMatch}
                  className={buttonClass({ variant: 'primary' })}
                >
                  {submittingMatch ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Xác nhận & Cấp gói
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

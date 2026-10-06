import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, Power, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'

export default function AdminSystemControlPanel() {
  const [circuitBreaker, setCircuitBreaker] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin-system-control', { headers })
      if (res.status === 401 || res.status === 403) {
        setError('Chỉ admin mới truy cập được')
        return
      }
      if (!res.ok) throw new Error('Không thể tải trạng thái hệ thống')
      const data = await res.json()
      setCircuitBreaker(data.circuitBreakerEnabled ?? false)
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi tải trạng thái'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(fetchStatus)
  }, [fetchStatus])

  const toggleCircuitBreaker = async (targetState: boolean) => {
    setUpdating(true)
    setError(null)
    setMsg(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'toggle-circuit-breaker',
          enabled: targetState,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại')

      setCircuitBreaker(data.circuitBreakerEnabled)
      setMsg(data.message)
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi bật/tắt cầu dao'))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert
              className={`w-6 h-6 ${circuitBreaker ? 'text-rose-400 theme-light:text-rose-900 animate-pulse' : 'text-amber-400 theme-light:text-amber-900'}`}
            />
            <div>
              <h3 className="font-bold text-white text-base">
                Cầu Dao Khẩn Cấp (AI Circuit Breaker)
              </h3>
              <p className="text-xs text-zinc-400">
                Dập lập tức mọi dịch vụ gọi AI (Chat, Speaking, Writing) khi chi phí API tăng đột
                biến hoặc rò rỉ key.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            aria-label="Tải lại trạng thái"
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 theme-light:text-rose-900 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {msg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 theme-light:text-emerald-900 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">Trạng thái Cầu dao khẩn cấp:</span>
              {circuitBreaker ? (
                <span className="px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-rose-500/20 text-rose-400 theme-light:text-rose-900 border border-rose-500/40">
                  ĐANG BẬT — ĐÃ DẬP GỌI AI
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-emerald-500/20 text-emerald-400 theme-light:text-emerald-900 border border-emerald-500/40">
                  HOẠT ĐỘNG BÌNH THƯỜNG
                </span>
              )}
            </div>
            <p className="text-zinc-500">
              {circuitBreaker
                ? 'Tất cả lời gọi AI của người dùng đang tạm dừng. Nút gạt này có tác dụng ngay lập tức.'
                : 'Hệ thống đang phục vụ API AI bình thường.'}
            </p>
          </div>

          <button
            type="button"
            disabled={updating || loading}
            onClick={() => toggleCircuitBreaker(!circuitBreaker)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 shadow-lg ${
              circuitBreaker
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            {updating
              ? 'Đang xử lý...'
              : circuitBreaker
                ? 'TẮT CẦU DAO (MỞ LẠI AI)'
                : 'KÍCH HOẠT DẬP KHẨN CẤP'}
          </button>
        </div>
      </div>
    </div>
  )
}

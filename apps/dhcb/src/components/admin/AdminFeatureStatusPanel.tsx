import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import { buttonClass, buttonVariantClass } from '@core/buttonStyles'

interface FeatureCheckResult {
  key: string
  label: string
  usesApi: boolean
  status: 'up' | 'down' | 'unconfigured'
  latencyMs?: number
  message?: string
}

interface FeatureStatusRun {
  id: number
  run_at: string
  triggered_by: 'cron' | 'manual'
  triggered_by_email: string | null
  overall_status: 'up' | 'degraded' | 'down'
  results: FeatureCheckResult[]
}

const OVERALL_LABEL: Record<FeatureStatusRun['overall_status'], string> = {
  up: 'TẤT CẢ TÍNH NĂNG BÌNH THƯỜNG',
  degraded: 'CÓ TÍNH NĂNG GẶP LỖI',
  down: 'MỌI TÍNH NĂNG ĐÃ CẤU HÌNH ĐỀU LỖI',
}

const OVERALL_CLASS: Record<FeatureStatusRun['overall_status'], string> = {
  up: 'bg-emerald-500/20 text-emerald-400 theme-light:text-emerald-900 border-emerald-500/40',
  degraded: 'bg-amber-500/20 text-amber-400 theme-light:text-amber-900 border-amber-500/40',
  down: 'bg-rose-500/20 text-rose-400 theme-light:text-rose-900 border-rose-500/40',
}

function StatusIcon({ status }: { status: FeatureCheckResult['status'] }) {
  if (status === 'up')
    return (
      <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
    )
  if (status === 'down')
    return <XCircle className="w-4 h-4 text-rose-400 theme-light:text-rose-900 shrink-0" />
  return <MinusCircle className="w-4 h-4 text-zinc-500 shrink-0" />
}

function formatVietnamTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN')
}

export default function AdminFeatureStatusPanel() {
  const [latest, setLatest] = useState<FeatureStatusRun | null>(null)
  const [history, setHistory] = useState<FeatureStatusRun[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin-feature-status', { headers })
      if (res.status === 401 || res.status === 403) {
        setError('Chỉ admin mới truy cập được')
        return
      }
      if (!res.ok) throw new Error('Không thể tải trạng thái tính năng')
      const data = await res.json()
      setLatest(data.latest)
      setHistory(data.history ?? [])
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

  const runCheckNow = async () => {
    setChecking(true)
    setError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-feature-status', {
        method: 'POST',
        headers,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kiểm tra thất bại')
      setLatest(data)
      setHistory((prev) => [data, ...prev].slice(0, 30))
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi khi chạy kiểm tra'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-sky-400 theme-light:text-sky-900" />
            <div>
              <h3 className="font-bold text-white text-base">Trạng thái tính năng</h3>
              <p className="text-xs text-zinc-400">
                Tự động kiểm tra 2 lần/ngày (cron VPS) hoặc bấm nút bên dưới để kiểm tra ngay: CSDL,
                AI hội thoại, STT, TTS, lưu trữ R2, thanh toán SePay.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchStatus}
              aria-label="Tải lại trạng thái tính năng"
              className={`${buttonVariantClass('outline')} tap-44 inline-flex items-center justify-center p-1.5 rounded-lg`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              disabled={checking}
              onClick={runCheckNow}
              className={buttonClass({ variant: 'primary' })}
            >
              {checking ? 'Đang kiểm tra...' : 'Kiểm tra thủ công'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 theme-light:text-rose-900 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!latest && !loading && !error && (
          <p className="text-xs text-zinc-500">
            Chưa có lượt kiểm tra nào — bấm "Kiểm tra thủ công".
          </p>
        )}

        {latest && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold border ${OVERALL_CLASS[latest.overall_status]}`}
              >
                {OVERALL_LABEL[latest.overall_status]}
              </span>
              <span className="text-xs text-zinc-500">
                Lượt gần nhất: {formatVietnamTime(latest.run_at)} (
                {latest.triggered_by === 'cron'
                  ? 'tự động'
                  : `thủ công — ${latest.triggered_by_email ?? ''}`}
                )
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {latest.results.map((r) => (
                <div
                  key={r.key}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-start gap-2"
                >
                  <StatusIcon status={r.status} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-200 text-xs truncate">
                        {r.label}
                      </span>
                      <span className="text-[0.6875rem] text-zinc-500 shrink-0">
                        {r.usesApi ? '(dùng API)' : '(không dùng API)'}
                      </span>
                    </div>
                    <p className="text-[0.6875rem] text-zinc-500 truncate">
                      {r.status === 'unconfigured'
                        ? 'Chưa cấu hình'
                        : r.status === 'up'
                          ? `Hoạt động${r.latencyMs != null ? ` — ${r.latencyMs}ms` : ''}`
                          : `Lỗi${r.message ? `: ${r.message}` : ''}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 1 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">
              Lịch sử {history.length} lượt gần đây
            </summary>
            <ul className="mt-2 space-y-1">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-2 text-zinc-500">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[0.6875rem] font-bold border ${OVERALL_CLASS[h.overall_status]}`}
                  >
                    {h.overall_status}
                  </span>
                  <span>{formatVietnamTime(h.run_at)}</span>
                  <span>({h.triggered_by === 'cron' ? 'tự động' : 'thủ công'})</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}

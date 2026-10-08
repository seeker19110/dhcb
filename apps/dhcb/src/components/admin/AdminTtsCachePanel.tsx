import { useState, useEffect, useCallback } from 'react'
import { Database, RefreshCw, HardDrive, AlertTriangle, CheckCircle2, Search } from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import { buttonClass } from '@core/buttonStyles'

// Tab admin "Cache TTS & R2" — trả lời: cache có đang tiết kiệm tiền API không, và kho audio
// trên Cloudflare R2 có khớp với DB không. Nguồn dữ liệu: /api/admin-tts-cache.

interface DayStat {
  day: string
  hits: number
  misses: number
}
interface VoiceStat {
  lang: string
  voice: string
  hits: number
  misses: number
}
interface TableAudit {
  total: number
  onR2: number
  offR2: number
  missingOnR2: number
  orphanOnR2: number
  r2Files: number
  r2Bytes: number
  samples: { offR2: string[]; missingOnR2: string[]; orphanOnR2: string[] }
}
interface AuditRow {
  id: string
  started_at: string
  finished_at: string | null
  status: string
  error: string | null
  result: { ttsCache: TableAudit; pronunciations: TableAudit; r2PublicBaseUrl: string } | null
}
interface QuickCount {
  total: number
  on_r2: number
}
interface ApiData {
  days: number
  stats: {
    byDay: DayStat[]
    byVoice: VoiceStat[]
    totalHits: number
    totalMisses: number
    totalCalls: number
    hitRate: number | null
  }
  quick: { ttsCache?: QuickCount; pronunciations?: QuickCount } | null
  r2PublicBaseUrl: string | null
  audit: AuditRow | null
}

const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—')
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + ' MB'

export default function AdminTtsCachePanel() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      // Xoá lỗi cũ SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7).
      setError(null)
      const res = await fetch('/api/admin-tts-cache?days=30', { headers })
      if (res.status === 401 || res.status === 403) {
        setError('Chỉ admin mới truy cập được')
        return
      }
      if (!res.ok) throw new Error('Không tải được số liệu cache TTS')
      setData((await res.json()) as ApiData)
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi tải số liệu'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(fetchData)
  }, [fetchData])

  // Quét đang chạy → tự hỏi lại mỗi 5s cho tới khi xong, để admin không phải bấm làm mới tay.
  useEffect(() => {
    if (data?.audit?.status !== 'running') return
    const timer = setInterval(() => void fetchData(), 5000)
    return () => clearInterval(timer)
  }, [data?.audit?.status, fetchData])

  const startScan = async () => {
    setScanning(true)
    setError(null)
    setMsg(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'scan' }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Không bắt đầu được lượt quét')
      setMsg(body.message)
      await fetchData()
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi bắt đầu quét'))
    } finally {
      setScanning(false)
    }
  }

  if (loading) return <p className="text-sm text-zinc-400">Đang tải số liệu cache TTS…</p>
  if (error && !data)
    return <p className="text-sm text-rose-400 theme-light:text-rose-900">{error}</p>
  if (!data) return null

  const { stats, quick, audit } = data
  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.hits + d.misses))

  return (
    <div className="space-y-4 text-sm">
      {error && <p className="text-rose-400 theme-light:text-rose-900">{error}</p>}
      {msg && <p className="text-emerald-400 theme-light:text-emerald-900">{msg}</p>}

      {/* ── Tỉ lệ cache hit ─────────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
          <Database className="w-6 h-6 text-emerald-400 theme-light:text-emerald-900" />
          <div>
            <h3 className="font-semibold text-zinc-100">Tỉ lệ cache hit ({data.days} ngày)</h3>
            <p className="text-zinc-400 text-xs">
              HIT = phục vụ từ cache, không tốn tiền API. MISS = phải gọi API TTS sinh mới.
            </p>
          </div>
        </div>

        {stats.hitRate === null ? (
          <p className="text-zinc-400">
            Chưa có lượt gọi nào được ghi nhận. Số liệu chỉ bắt đầu tính từ khi bản cập nhật này
            được deploy — không có dữ liệu hồi tố.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Tỉ lệ hit" value={pct(stats.totalHits, stats.totalCalls)} accent />
              <Stat label="Tổng lượt gọi" value={stats.totalCalls.toLocaleString('vi-VN')} />
              <Stat label="HIT (miễn phí)" value={stats.totalHits.toLocaleString('vi-VN')} />
              <Stat label="MISS (tốn tiền)" value={stats.totalMisses.toLocaleString('vi-VN')} />
            </div>

            {/* Biểu đồ cột theo ngày: phần xanh = hit, phần hổ phách = miss */}
            <div className="flex items-end gap-0.5 h-24 overflow-x-auto pt-2">
              {stats.byDay.map((d) => {
                const total = d.hits + d.misses
                return (
                  <div
                    key={d.day}
                    className="flex-1 min-w-[8px] flex flex-col justify-end h-full"
                    title={`${d.day}: ${d.hits} hit / ${d.misses} miss`}
                  >
                    <div
                      className="bg-amber-500"
                      style={{ height: `${(d.misses / maxDay) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500"
                      style={{ height: `${(d.hits / maxDay) * 100}%` }}
                    />
                    <span className="sr-only">
                      {d.day}: {d.hits} hit, {d.misses} miss, tổng {total}
                    </span>
                  </div>
                )
              })}
            </div>

            {stats.byVoice.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <caption className="sr-only">Hit/miss theo ngôn ngữ và giọng đọc</caption>
                  <thead className="text-zinc-400">
                    <tr>
                      <th scope="col" className="text-left py-1">
                        Ngôn ngữ
                      </th>
                      <th scope="col" className="text-left py-1">
                        Giọng
                      </th>
                      <th scope="col" className="text-right py-1">
                        Hit
                      </th>
                      <th scope="col" className="text-right py-1">
                        Miss
                      </th>
                      <th scope="col" className="text-right py-1">
                        Tỉ lệ hit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-200">
                    {stats.byVoice.map((v) => (
                      <tr key={`${v.lang}-${v.voice}`} className="border-t border-zinc-800">
                        <td className="py-1">{v.lang}</td>
                        <td className="py-1">{v.voice}</td>
                        <td className="py-1 text-right">{v.hits.toLocaleString('vi-VN')}</td>
                        <td className="py-1 text-right">{v.misses.toLocaleString('vi-VN')}</td>
                        <td className="py-1 text-right">{pct(v.hits, v.hits + v.misses)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Đếm nhanh: dòng nào trỏ đúng R2 ────────────────────────────────────── */}
      <section className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
          <HardDrive className="w-6 h-6 text-sky-400 theme-light:text-sky-900" />
          <div>
            <h3 className="font-semibold text-zinc-100">Kho cache trong DB</h3>
            <p className="text-zinc-400 text-xs">
              Đếm tức thì theo tiền tố URL. Dòng KHÔNG trỏ về R2 là audio chết — sẽ tự sinh lại khi
              có người dùng tới câu đó.
            </p>
          </div>
        </div>
        {!quick ? (
          <p className="text-amber-400 theme-light:text-amber-900">
            Chưa cấu hình <code>R2_PUBLIC_BASE_URL</code> — không phân loại được.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickCard title="tts_cache (câu nói)" q={quick.ttsCache} />
            <QuickCard title="pronunciations (từ đơn)" q={quick.pronunciations} />
          </div>
        )}
      </section>

      {/* ── Quét đối chiếu với file thật trên R2 ───────────────────────────────── */}
      <section className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Search className="w-6 h-6 text-violet-400 theme-light:text-violet-800" />
            <div>
              <h3 className="font-semibold text-zinc-100">Đối chiếu DB ↔ R2</h3>
              <p className="text-zinc-400 text-xs">
                Liệt kê toàn bộ file trên bucket rồi so với DB. Chạy nền, mất vài phút.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void startScan()}
            disabled={scanning || audit?.status === 'running'}
            className={buttonClass({ variant: 'primary', className: 'shrink-0' })}
          >
            <RefreshCw className={`w-4 h-4 ${audit?.status === 'running' ? 'animate-spin' : ''}`} />
            {audit?.status === 'running' ? 'Đang quét…' : 'Quét lại'}
          </button>
        </div>

        {!audit && <p className="text-zinc-400">Chưa từng quét lần nào.</p>}

        {audit?.status === 'running' && (
          <p className="text-zinc-300">
            Đang quét từ {new Date(audit.started_at).toLocaleString('vi-VN')} — trang tự làm mới.
          </p>
        )}

        {audit?.status === 'error' && (
          <p className="text-rose-400 theme-light:text-rose-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            Quét lỗi: {audit.error}
          </p>
        )}

        {audit?.status === 'done' && audit.result && (
          <div className="space-y-4">
            <p className="text-zinc-400 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900" />
              Quét xong lúc{' '}
              {audit.finished_at ? new Date(audit.finished_at).toLocaleString('vi-VN') : '—'}
            </p>
            <AuditTable title="tts_cache (câu nói)" a={audit.result.ttsCache} />
            <AuditTable title="pronunciations (từ đơn)" a={audit.result.pronunciations} />
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
      <p className="text-zinc-400 text-xs">{label}</p>
      <p
        className={`text-lg font-semibold ${accent ? 'text-emerald-400 theme-light:text-emerald-900' : 'text-zinc-100'}`}
      >
        {value}
      </p>
    </div>
  )
}

function QuickCard({ title, q }: { title: string; q?: QuickCount }) {
  if (!q) return null
  const off = q.total - q.on_r2
  return (
    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 space-y-1">
      <p className="font-medium text-zinc-100">{title}</p>
      <p className="text-zinc-300">
        Tổng: <strong>{q.total.toLocaleString('vi-VN')}</strong> dòng
      </p>
      <p className="text-emerald-400 theme-light:text-emerald-900">
        Trỏ đúng R2: {q.on_r2.toLocaleString('vi-VN')} ({pct(q.on_r2, q.total)})
      </p>
      <p className={off > 0 ? 'text-amber-400 theme-light:text-amber-900' : 'text-zinc-400'}>
        Trỏ sai chỗ: {off.toLocaleString('vi-VN')} ({pct(off, q.total)})
      </p>
    </div>
  )
}

function AuditTable({ title, a }: { title: string; a: TableAudit }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 space-y-2">
      <p className="font-medium text-zinc-100">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <Cell label="Dòng trong DB" value={a.total.toLocaleString('vi-VN')} />
        <Cell label="File trên R2" value={a.r2Files.toLocaleString('vi-VN')} />
        <Cell label="Dung lượng R2" value={mb(a.r2Bytes)} />
        <Cell label="Trỏ đúng R2" value={a.onR2.toLocaleString('vi-VN')} tone="ok" />
        <Cell
          label="Trỏ sai chỗ"
          value={a.offR2.toLocaleString('vi-VN')}
          tone={a.offR2 > 0 ? 'warn' : undefined}
        />
        <Cell
          label="Thiếu trên R2"
          value={a.missingOnR2.toLocaleString('vi-VN')}
          tone={a.missingOnR2 > 0 ? 'bad' : undefined}
        />
        <Cell
          label="Orphan trên R2"
          value={a.orphanOnR2.toLocaleString('vi-VN')}
          tone={a.orphanOnR2 > 0 ? 'warn' : undefined}
        />
        <Cell label="Độ phủ" value={pct(a.onR2 - a.missingOnR2, a.total)} tone="ok" />
      </div>
      {a.samples.missingOnR2.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-zinc-300">
            Ví dụ file thiếu ({a.samples.missingOnR2.length})
          </summary>
          <ul className="mt-1 space-y-0.5 text-zinc-400 break-all">
            {a.samples.missingOnR2.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      )}
      {a.samples.offR2.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-zinc-300">
            Ví dụ URL trỏ sai chỗ ({a.samples.offR2.length})
          </summary>
          <ul className="mt-1 space-y-0.5 text-zinc-400 break-all">
            {a.samples.offR2.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'ok' | 'warn' | 'bad'
}) {
  const color =
    tone === 'ok'
      ? 'text-emerald-400 theme-light:text-emerald-900'
      : tone === 'warn'
        ? 'text-amber-400 theme-light:text-amber-900'
        : tone === 'bad'
          ? 'text-rose-400 theme-light:text-rose-900'
          : 'text-zinc-100'
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      <p className={`font-semibold ${color}`}>{value}</p>
    </div>
  )
}

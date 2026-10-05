// src/components/admin/AdminAnalyticsPanel.tsx — Tab "Analytics" trong /admin.
// Đọc GET /api/analytics-summary (chỉ admin) — bảng số tổng theo sự kiện + theo ngày.
import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Loader2, ShieldAlert, RefreshCw } from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'

interface DailyRow {
  day: string
  event: string
  count: number
}
interface Summary {
  days: number
  daily: DailyRow[]
  totalsByEvent: Record<string, number>
  dailyPlanActions?: {
    actionKind: string
    plannerVersion: string
    impressionCount: number
    clickCount: number
    completionCount: number | null
    completionRate: number | null
  }[]
}

const EVENT_LABELS: Record<string, string> = {
  landing_view: 'Xem landing page',
  cta_click: 'Bấm nút bắt đầu',
  signup: 'Đăng ký thành công',
  first_session_done: 'Hoàn thành phiên học đầu',
  share_click: 'Chia sẻ kết quả',
  day2_return: 'Quay lại ngày thứ 2',
  daily_plan_impression: 'Daily Plan được hiển thị',
  daily_plan_click: 'Bấm gợi ý Daily Plan',
  daily_plan_completion: 'Hoàn thành Daily Plan có bằng chứng',
}

const ACTION_LABELS: Record<string, string> = {
  srs_review: 'Ôn lại',
  continue_learning: 'Học tiếp',
  discover_path: 'Khám phá lộ trình',
}

const DAY_OPTIONS = [7, 14, 30, 90]

export default function AdminAnalyticsPanel() {
  const [days, setDays] = useState(14)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      setLoading(true)
      setError('')
      const res = await fetch(`/api/analytics-summary?days=${days}`, { headers })
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      if (!res.ok) throw new Error(`Lỗi ${res.status}`)
      setSummary((await res.json()) as Summary)
    } catch (err) {
      setError(`Không tải được số liệu: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  if (forbidden) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-3 text-red-300 theme-light:text-red-900">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <p className="text-sm">Bạn không có quyền truy cập trang này.</p>
      </div>
    )
  }

  const knownEvents = Object.keys(EVENT_LABELS)
  const eventKeys = summary
    ? [
        ...knownEvents.filter((e) => e in summary.totalsByEvent),
        ...Object.keys(summary.totalsByEvent).filter((e) => !knownEvents.includes(e)),
      ]
    : []

  const dayKeys = summary ? Array.from(new Set(summary.daily.map((r) => r.day))).sort() : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-white">Analytics marketing & sản phẩm</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Số ngày hiển thị"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} ngày
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Tải lại"
            className="tap-44 p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 theme-light:text-red-900">
          {error}
        </div>
      )}

      {!loading && !error && summary && eventKeys.length === 0 && (
        <p className="text-sm text-zinc-400">
          Chưa có sự kiện nào trong {summary.days} ngày gần đây.
        </p>
      )}

      {!loading && !error && summary && eventKeys.length > 0 && (
        <>
          <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
            <p className="text-sm font-semibold text-white mb-1">
              Tổng {summary.days} ngày gần đây
            </p>
            <p className="text-xs text-zinc-400 mb-3">
              Ba bước "Đăng ký" · "Phiên học đầu" · "Quay lại ngày thứ 2" được suy ra server-side.
              Daily Plan impression/click được client gửi với action kind trong ref_code để đo CTR
              theo gợi ý.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {eventKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 bg-zinc-800/60 rounded-xl px-3 py-2.5"
                >
                  <span className="text-xs text-zinc-400">{EVENT_LABELS[key] ?? key}</span>
                  <span className="text-sm font-semibold text-accent-400 tabular-nums">
                    {summary.totalsByEvent[key]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 overflow-x-auto">
            <p className="text-sm font-semibold text-white mb-1">Phễu Daily Plan theo action</p>
            <p className="text-xs text-zinc-400 mb-3">
              Completion chỉ được tính từ receipt phía server. Hai action chưa có bằng chứng domain
              hiển thị n/a, không coi là 0%.
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pb-2 pr-3 font-medium">Action</th>
                  <th className="pb-2 px-3 font-medium text-right">Hiển thị</th>
                  <th className="pb-2 px-3 font-medium text-right">Bấm</th>
                  <th className="pb-2 px-3 font-medium text-right">Completion</th>
                  <th className="pb-2 pl-3 font-medium text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {(summary.dailyPlanActions ?? []).map((action) => (
                  <tr
                    key={`${action.actionKind}:${action.plannerVersion}`}
                    className="border-t border-zinc-800/80"
                  >
                    <td className="py-2 pr-3 text-zinc-300 whitespace-nowrap">
                      {ACTION_LABELS[action.actionKind] ?? action.actionKind}{' '}
                      <span className="text-zinc-500">({action.plannerVersion})</span>
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                      {action.impressionCount}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                      {action.clickCount}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                      {action.completionCount ?? 'n/a'}
                    </td>
                    <td className="py-2 pl-3 text-right text-accent-400 tabular-nums">
                      {action.completionRate === null
                        ? 'n/a'
                        : `${(action.completionRate * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 overflow-x-auto">
            <p className="text-sm font-semibold text-white mb-3">Theo ngày</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pb-2 pr-3 font-medium">Ngày</th>
                  {eventKeys.map((key) => (
                    <th key={key} className="pb-2 px-3 font-medium text-right whitespace-nowrap">
                      {EVENT_LABELS[key] ?? key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayKeys.map((day) => (
                  <tr key={day} className="border-t border-zinc-800/80">
                    <td className="py-2 pr-3 text-zinc-300 whitespace-nowrap">{day}</td>
                    {eventKeys.map((key) => {
                      const count =
                        summary.daily.find((r) => r.day === day && r.event === key)?.count ?? 0
                      return (
                        <td key={key} className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                          {count || '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}

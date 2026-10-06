// src/components/admin/AdminUsagePanel.tsx — Tab "Sử dụng & chi phí" trong /admin.
// Đọc GET /api/admin-usage-stats (chỉ admin). Mục tiêu của màn này KHÔNG phải biểu đồ đẹp mà
// là trả lời nhanh 3 câu: tính năng nào đáng giữ, chi phí AI bao nhiêu, doanh thu có bù nổi
// không. Vì vậy mọi con số đều đi kèm ngữ cảnh so sánh (chi phí/người, tỉ lệ trả phí, lãi/lỗ).
import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Loader2,
  ShieldAlert,
  RefreshCw,
  TrendingUp,
  Wallet,
  Users,
  Gauge,
} from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'

type Mode = 'chat' | 'writing' | 'speaking' | 'stt' | 'pronounce' | 'code_feedback'

interface UsageDay {
  day: string
  chat: number
  writing: number
  speaking: number
  stt: number
  pronounce: number
  code_feedback: number
  learn: number
  active_users: number
}

interface Stats {
  range: { days: number; from: string; to: string }
  users: {
    total: number
    newInRange: number
    byPlan: Record<string, number>
    paidUsers: number
    paidRatio: number
    dau: number
    wau: number
    mau: number
    returningInRange: number
  }
  usage: {
    totals: Record<string, number>
    daily: UsageDay[]
    reach: Record<string, number>
    byPlan: { plan: string; users: number; counts: Record<Mode, number>; costUsd: number }[]
  }
  cost: {
    unitCostsUsd: Record<Mode, number>
    usdVndRate: number
    totalUsd: number
    totalVnd: number
    byFeature: { mode: Mode; count: number; unitUsd: number; costUsd: number; users: number }[]
    perActiveUserVnd: number
  }
  // Chi phí ĐO THẬT theo token nhà cung cấp báo về (mục N4) — khác `cost` ở trên (ước tính
  // theo số lượt). dailyBudgetUsd = null nghĩa là chưa đặt AI_DAILY_BUDGET_USD trên server.
  // TUỲ CHỌN (`?`): trong lúc deploy cuốn chiếu, server bản CŨ vẫn trả response KHÔNG có
  // trường này — component phải bỏ qua thẻ chứ TUYỆT ĐỐI không được sập cả trang admin.
  tokenCost?: {
    totals: {
      calls: number
      promptTokens: number
      completionTokens: number
      cacheReadTokens: number
      costUsd: number
    }
    totalVnd: number
    byProviderModel: {
      provider: string
      model: string
      mode: string
      calls: number
      promptTokens: number
      completionTokens: number
      cacheReadTokens: number
      costUsd: number
    }[]
    dailyBudgetUsd: number | null
  }
  revenue: {
    vnd: number
    payments: Record<string, number>
    createdOrders: number
    payRate: number
    byPlanCycle: { plan: string; cycle: string; count: number; vnd: number }[]
    daily: { day: string; count: number; vnd: number }[]
    marginVnd: number
  }
  freeCredit: { cap: number; users: number; total: number; exhausted: number }
  topUsers: {
    email: string
    plan: string
    total: number
    active_days: number
    chat: number
    writing: number
    speaking: number
    stt: number
    pronounce: number
    code_feedback: number
  }[]
}

const MODE_LABELS: Record<Mode, string> = {
  chat: 'Chat',
  writing: 'Luyện viết',
  speaking: 'Luyện nói',
  stt: 'Nhận dạng giọng (STT)',
  pronounce: 'Chấm phát âm',
  code_feedback: 'AI xem code (Lập trình)',
}

const CYCLE_LABELS: Record<string, string> = {
  '10day': '10 ngày',
  month: 'Tháng',
  year: 'Năm',
}

const DAY_OPTIONS = [7, 30, 90, 180]

const vnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`
// Token đếm tới hàng triệu — rút gọn cho dễ đọc, giữ 1 chữ số thập phân để không mất thông tin.
const tokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : String(n)
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-zinc-800/60 rounded-xl px-3 py-2.5">
      <p className="text-[0.6875rem] text-zinc-400">{label}</p>
      <p className="text-lg font-semibold text-white tabular-nums leading-tight">{value}</p>
      {hint && <p className="text-[0.6875rem] text-zinc-500 mt-0.5">{hint}</p>}
    </div>
  )
}

function Card({
  title,
  icon: Icon,
  note,
  children,
}: {
  title: string
  icon: typeof Activity
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-accent-400 shrink-0" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {note && <p className="text-[0.6875rem] text-zinc-500 mb-3">{note}</p>}
      {children}
    </section>
  )
}

export default function AdminUsagePanel() {
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      setError('')
      const res = await fetch(`/api/admin-usage-stats?days=${days}`, { headers })
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      if (!res.ok) throw new Error(`Lỗi ${res.status}`)
      setStats((await res.json()) as Stats)
    } catch (err) {
      setError(`Không tải được số liệu: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
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

  // Lượt cao nhất của một tính năng — dùng làm mốc 100% cho thanh so sánh ngang.
  const maxFeatureCount = stats
    ? Math.max(1, ...stats.cost.byFeature.map((f) => f.count), stats.usage.totals.learn ?? 0)
    : 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-white">Sử dụng &amp; chi phí</h2>
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

      {!loading && !error && stats && (
        <>
          {/* ── Người dùng ─────────────────────────────────────────────── */}
          <Card
            title="Người dùng"
            icon={Users}
            note={`Kỳ ${stats.range.from} → ${stats.range.to}. DAU/WAU/MAU luôn tính theo mốc 1/7/30 ngày cố định để so sánh được giữa các lần xem.`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Tile
                label="Tổng tài khoản"
                value={stats.users.total.toLocaleString('vi-VN')}
                hint={`+${stats.users.newInRange} trong kỳ`}
              />
              <Tile
                label="Đang trả phí"
                value={stats.users.paidUsers.toLocaleString('vi-VN')}
                hint={`${pct(stats.users.paidRatio)} tổng số`}
              />
              <Tile label="DAU / WAU" value={`${stats.users.dau} / ${stats.users.wau}`} />
              <Tile
                label="MAU"
                value={stats.users.mau.toLocaleString('vi-VN')}
                hint={`${stats.users.returningInRange} người học ≥ 2 ngày`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              {(['free', 'vip'] as const).map((plan) => (
                <Tile
                  key={plan}
                  label={`Gói ${plan.toUpperCase()}`}
                  value={(stats.users.byPlan[plan] ?? 0).toLocaleString('vi-VN')}
                />
              ))}
            </div>
          </Card>

          {/* ── Tính năng & chi phí ────────────────────────────────────── */}
          <Card
            title="Tính năng: lượt dùng, số người và chi phí"
            icon={Activity}
            note="Chi phí là ƯỚC TÍNH theo đơn giá cấu hình trong biến môi trường (AI_COST_*_USD), không phải hoá đơn thật. Cột 'Người dùng' cho biết tính năng có ĐƯỢC NHIỀU NGƯỜI dùng không, hay chỉ vài người dùng đi dùng lại."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-2 pr-3 font-medium">Tính năng</th>
                    <th className="pb-2 px-3 font-medium text-right">Lượt</th>
                    <th className="pb-2 px-3 font-medium text-right">Người dùng</th>
                    <th className="pb-2 px-3 font-medium text-right whitespace-nowrap">
                      Đơn giá (USD)
                    </th>
                    <th className="pb-2 pl-3 font-medium text-right">Chi phí</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.cost.byFeature.map((f) => (
                    <tr key={f.mode} className="border-t border-zinc-800/80">
                      <td className="py-2 pr-3 text-zinc-300 whitespace-nowrap">
                        {MODE_LABELS[f.mode]}
                        <span
                          className="block mt-1 h-1 rounded-full bg-accent-500"
                          style={{ width: `${Math.round((f.count / maxFeatureCount) * 100)}%` }}
                        />
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-200 tabular-nums">
                        {f.count.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                        {f.users.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-500 tabular-nums">
                        {f.unitUsd.toFixed(4)}
                      </td>
                      <td className="py-2 pl-3 text-right text-accent-400 tabular-nums whitespace-nowrap">
                        {vnd(f.costUsd * stats.cost.usdVndRate)}
                      </td>
                    </tr>
                  ))}
                  {/* Học từ vựng chạy ở client, KHÔNG tốn tiền AI — hiện để so độ phủ, chi phí 0. */}
                  <tr className="border-t border-zinc-800/80">
                    <td className="py-2 pr-3 text-zinc-300">Học từ vựng</td>
                    <td className="py-2 px-3 text-right text-zinc-200 tabular-nums">
                      {(stats.usage.totals.learn ?? 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                      {(stats.usage.reach.learn ?? 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-500">—</td>
                    <td className="py-2 pl-3 text-right text-zinc-500">không tốn AI</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Chi phí theo gói ───────────────────────────────────────── */}
          <Card
            title="Chi phí theo gói"
            icon={Wallet}
            note="So chi phí bình quân/người của từng gói với giá bán để biết gói nào đang lỗ."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {stats.usage.byPlan.map((p) => (
                <Tile
                  key={p.plan}
                  label={`Gói ${p.plan.toUpperCase()} — ${p.users} người hoạt động`}
                  value={vnd(p.costUsd * stats.cost.usdVndRate)}
                  hint={
                    p.users > 0
                      ? `${vnd((p.costUsd * stats.cost.usdVndRate) / p.users)}/người trong kỳ`
                      : 'chưa có lượt dùng'
                  }
                />
              ))}
            </div>
          </Card>

          {/* ── Chi phí AI đo THẬT theo token ─────────────────────────── */}
          {/* Chỉ dựng thẻ khi server có trả `tokenCost` (xem chú thích ở interface Stats). */}
          {stats.tokenCost && (
            <Card
              title="Chi phí AI đo THẬT theo token"
              icon={Gauge}
              note='Số token do CHÍNH nhà cung cấp (Groq/Anthropic/Gemini) báo về mỗi lượt gọi, quy giá theo bảng giá thật — khác thẻ "chi phí ước tính" ở trên (lượt × đơn giá đoán sẵn). Hai số lệch nhiều nghĩa là nên chỉnh AI_COST_*_USD trong .env cho sát. Chỉ tính đường chat gia sư + Bạn Đồng Hành; TTS/STT/chấm phát âm chưa đo theo token.'
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Tile
                  label="Chi phí thật trong kỳ"
                  value={vnd(stats.tokenCost.totalVnd)}
                  hint={`${stats.tokenCost.totals.costUsd.toFixed(4)} USD · ${stats.tokenCost.totals.calls} lượt`}
                />
                <Tile
                  label="So với ước tính"
                  value={
                    stats.cost.totalVnd > 0
                      ? pct(stats.tokenCost.totalVnd / stats.cost.totalVnd)
                      : '—'
                  }
                  hint={`ước tính ${vnd(stats.cost.totalVnd)}`}
                />
                <Tile
                  label="Token vào / ra"
                  value={`${tokens(stats.tokenCost.totals.promptTokens)} / ${tokens(stats.tokenCost.totals.completionTokens)}`}
                  hint={`đọc từ cache ${tokens(stats.tokenCost.totals.cacheReadTokens)}`}
                />
                <Tile
                  label="Ngân sách ngày"
                  value={
                    stats.tokenCost.dailyBudgetUsd === null
                      ? 'chưa đặt'
                      : `${stats.tokenCost.dailyBudgetUsd} USD`
                  }
                  hint={
                    stats.tokenCost.dailyBudgetUsd === null
                      ? 'đặt AI_DAILY_BUDGET_USD để server cảnh báo'
                      : 'vượt ngưỡng sẽ ghi log cảnh báo'
                  }
                />
              </div>

              {stats.tokenCost.byProviderModel.length > 0 ? (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-zinc-500">
                        <th className="pb-2 pr-3 font-medium">Nhà cung cấp / model</th>
                        <th className="pb-2 px-3 font-medium">Chế độ</th>
                        <th className="pb-2 px-3 font-medium text-right">Lượt</th>
                        <th className="pb-2 px-3 font-medium text-right">Token vào/ra</th>
                        <th className="pb-2 pl-3 font-medium text-right">Chi phí</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.tokenCost.byProviderModel.map((r) => (
                        <tr
                          key={`${r.provider}-${r.model}-${r.mode}`}
                          className="border-t border-zinc-800/80"
                        >
                          <td className="py-2 pr-3 text-zinc-300">
                            {r.provider}
                            <span className="text-zinc-500"> · {r.model}</span>
                          </td>
                          <td className="py-2 px-3 text-zinc-400">{r.mode}</td>
                          <td className="py-2 px-3 text-right text-zinc-200 tabular-nums">
                            {r.calls}
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-400 tabular-nums whitespace-nowrap">
                            {tokens(r.promptTokens)}/{tokens(r.completionTokens)}
                          </td>
                          <td className="py-2 pl-3 text-right text-accent-400 tabular-nums whitespace-nowrap">
                            {vnd(r.costUsd * stats.cost.usdVndRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 mt-3">
                  Chưa có lượt gọi AI nào được đo token trong kỳ này.
                </p>
              )}
            </Card>
          )}

          {/* ── Doanh thu & lãi lỗ ─────────────────────────────────────── */}
          <Card
            title="Doanh thu &amp; lãi/lỗ thô"
            icon={TrendingUp}
            note="Lãi/lỗ = doanh thu đã thu trừ chi phí AI ước tính. CHƯA trừ VPS, tên miền, email — đây là biên gộp, không phải lợi nhuận thật."
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Tile label="Doanh thu đã thu" value={vnd(stats.revenue.vnd)} />
              <Tile
                label="Chi phí AI ước tính"
                value={vnd(stats.cost.totalVnd)}
                hint={`${vnd(stats.cost.perActiveUserVnd)}/người hoạt động`}
              />
              <Tile
                label="Lãi/lỗ thô"
                value={vnd(stats.revenue.marginVnd)}
                hint={stats.revenue.marginVnd >= 0 ? 'đang dương' : 'đang âm'}
              />
              <Tile
                label="Đơn trả thành công"
                value={`${stats.revenue.payments.paid ?? 0}/${stats.revenue.createdOrders}`}
                hint={`tỉ lệ ${pct(stats.revenue.payRate)}`}
              />
            </div>

            {stats.revenue.byPlanCycle.length > 0 && (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="pb-2 pr-3 font-medium">Gói</th>
                      <th className="pb-2 px-3 font-medium">Chu kỳ</th>
                      <th className="pb-2 px-3 font-medium text-right">Số đơn</th>
                      <th className="pb-2 pl-3 font-medium text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.revenue.byPlanCycle.map((r) => (
                      <tr key={`${r.plan}-${r.cycle}`} className="border-t border-zinc-800/80">
                        <td className="py-2 pr-3 text-zinc-300 uppercase">{r.plan}</td>
                        <td className="py-2 px-3 text-zinc-400">
                          {CYCLE_LABELS[r.cycle] ?? r.cycle}
                        </td>
                        <td className="py-2 px-3 text-right text-zinc-200 tabular-nums">
                          {r.count}
                        </td>
                        <td className="py-2 pl-3 text-right text-accent-400 tabular-nums whitespace-nowrap">
                          {vnd(r.vnd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── Sức khoẻ hạn mức NGÀY của gói Free (GĐ1 2026-09-12) ────── */}
          <Card
            title="Hạn mức ngày của gói Free"
            icon={Wallet}
            note={`Hạn mức hiện tại ${stats.freeCredit.cap} lượt/ngày (chỉnh ở tab "Hạn mức"). Nhiều người-ngày CHẠM TRẦN = hạn mức đang quá chặt (mất người dùng); còn dư nhiều = có thể giảm để tiết kiệm chi phí AI.`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Tile
                label="Người-ngày có dùng AI"
                value={stats.freeCredit.users.toLocaleString('vi-VN')}
              />
              <Tile
                label="Chạm trần hạn mức"
                value={stats.freeCredit.exhausted.toLocaleString('vi-VN')}
                hint={
                  stats.freeCredit.users > 0
                    ? pct(stats.freeCredit.exhausted / stats.freeCredit.users)
                    : undefined
                }
              />
              <Tile
                label="Lượt còn dư (tổng)"
                value={stats.freeCredit.total.toLocaleString('vi-VN')}
              />
            </div>
          </Card>

          {/* ── Top người dùng ─────────────────────────────────────────── */}
          <Card
            title={`Top ${stats.topUsers.length} người dùng nhiều nhất`}
            icon={Users}
            note="Dùng để phát hiện lạm dụng (một tài khoản ngốn phần lớn chi phí) hoặc tìm người nên mời lên gói cao hơn."
          >
            {stats.topUsers.length === 0 ? (
              <p className="text-sm text-zinc-400">Chưa có lượt dùng AI nào trong kỳ.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="pb-2 pr-3 font-medium">Email</th>
                      <th className="pb-2 px-3 font-medium">Gói</th>
                      <th className="pb-2 px-3 font-medium text-right">Ngày học</th>
                      <th className="pb-2 px-3 font-medium text-right">Tổng lượt</th>
                      <th className="pb-2 pl-3 font-medium text-right">Chi phí ước tính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsers.map((u) => {
                      const costUsd = (
                        [
                          'chat',
                          'writing',
                          'speaking',
                          'stt',
                          'pronounce',
                          'code_feedback',
                        ] as const
                      )
                        .map((m) => u[m] * stats.cost.unitCostsUsd[m])
                        .reduce((a, b) => a + b, 0)
                      return (
                        <tr key={u.email} className="border-t border-zinc-800/80">
                          <td className="py-2 pr-3 text-zinc-300 break-all">{u.email}</td>
                          <td className="py-2 px-3 text-zinc-400 uppercase">{u.plan}</td>
                          <td className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                            {u.active_days}
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-200 tabular-nums">
                            {u.total.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-2 pl-3 text-right text-accent-400 tabular-nums whitespace-nowrap">
                            {vnd(costUsd * stats.cost.usdVndRate)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── Theo ngày ──────────────────────────────────────────────── */}
          <Card title="Lượt dùng theo ngày" icon={Activity}>
            {stats.usage.daily.length === 0 ? (
              <p className="text-sm text-zinc-400">Chưa có dữ liệu trong kỳ.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="pb-2 pr-3 font-medium">Ngày</th>
                      <th className="pb-2 px-3 font-medium text-right">Người học</th>
                      {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                        <th key={m} className="pb-2 px-3 font-medium text-right whitespace-nowrap">
                          {MODE_LABELS[m]}
                        </th>
                      ))}
                      <th className="pb-2 px-3 font-medium text-right">Học từ</th>
                      <th className="pb-2 pl-3 font-medium text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.usage.daily].reverse().map((row) => (
                      <tr key={row.day} className="border-t border-zinc-800/80">
                        <td className="py-2 pr-3 text-zinc-300 whitespace-nowrap">{row.day}</td>
                        <td className="py-2 px-3 text-right text-zinc-200 tabular-nums">
                          {row.active_users || '—'}
                        </td>
                        {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                          <td key={m} className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                            {row[m] || '—'}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right text-zinc-400 tabular-nums">
                          {row.learn || '—'}
                        </td>
                        <td className="py-2 pl-3 text-right text-accent-400 tabular-nums whitespace-nowrap">
                          {(() => {
                            const r = stats.revenue.daily.find((d) => d.day === row.day)
                            return r ? vnd(r.vnd) : '—'
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

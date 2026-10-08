// src/components/admin/AdminGrantPlanPanel.tsx — Tab "Cấp gói tay" trong /admin.
// Giao diện gọi thẳng API có sẵn api/admin-grant-plan.ts (cổng thanh toán tay tạm thời,
// dùng trong lúc chưa nối cổng thanh toán thật): admin nhập email + chọn gói + số ngày,
// gọi POST để cấp; có nút "Tra cứu" gọi GET để xem gói hiện tại của 1 user trước khi cấp.
// Shape request/response lấy đúng theo GrantSchema trong api/admin-grant-plan.ts, không đoán field.
import { useState } from 'react'
import { Loader2, Search, ShieldCheck } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import { getAuthHeader } from '@core/authHeader'
import type { Plan } from '@dhcb/core-billing/plan'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import { buttonClass } from '@core/buttonStyles'

const PLAN_OPTIONS: { key: Plan; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: 'vip', label: 'VIP' },
]

interface GrantResult {
  email: string
  plan: Plan
  planExpiresAt: string | null
}

function formatExpiry(iso: string | null): string {
  if (!iso) return 'Vĩnh viễn / không giới hạn'
  return new Date(iso).toLocaleString('vi-VN')
}

interface AdminGrantPlanPanelProps {
  /** Email được chọn từ nơi khác (vd. bấm 1 dòng ở bảng "Người dùng") — điền sẵn vào form. */
  prefillEmail?: string
  /** Danh sách email đã biết, để gợi ý autocomplete (datalist) khi gõ. */
  emailSuggestions?: string[]
}

export default function AdminGrantPlanPanel({
  prefillEmail,
  emailSuggestions,
}: AdminGrantPlanPanelProps) {
  const toast = useToast()
  // Điền sẵn email từ prop ngay lần mount đầu; khi prop đổi (bấm dòng khác ở bảng "Người
  // dùng") thì đồng bộ lại bằng mẫu "setState trong lúc render" chuẩn React thay cho effect.
  const [email, setEmail] = useState(prefillEmail ?? '')
  const [prevPrefill, setPrevPrefill] = useState(prefillEmail)
  if (prefillEmail !== prevPrefill) {
    setPrevPrefill(prefillEmail)
    if (prefillEmail) setEmail(prefillEmail)
  }
  const [plan, setPlan] = useState<Plan>('vip')
  const [unlimited, setUnlimited] = useState(true)
  const [days, setDays] = useState(30)
  const [lookingUp, setLookingUp] = useState(false)
  const [granting, setGranting] = useState(false)
  const [result, setResult] = useState<GrantResult | null>(null)

  async function handleLookup() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast.error('Nhập email trước đã')
      return
    }
    setLookingUp(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/admin-grant-plan?email=${encodeURIComponent(trimmedEmail)}`, {
        headers,
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      const data = (await res.json()) as GrantResult
      setResult(data)
      toast.success(`Gói hiện tại: ${data.plan}`)
    } catch (err) {
      toast.error(`Tra cứu thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setLookingUp(false)
    }
  }

  async function handleGrant() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast.error('Nhập email trước đã')
      return
    }
    if (!unlimited && (!Number.isFinite(days) || days < 1)) {
      toast.error('Số ngày phải ≥ 1 (hoặc chọn "vĩnh viễn")')
      return
    }
    setGranting(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-grant-plan', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          plan,
          days: unlimited ? null : days,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      const data = (await res.json()) as GrantResult
      setResult(data)
      toast.success(`Đã cấp gói ${data.plan} cho ${data.email}`)
    } catch (err) {
      toast.error(`Cấp gói thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setGranting(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Cấp gói VIP thủ công theo email</p>
        <p className="text-xs text-zinc-500">
          Dùng khi user đã chuyển khoản nhưng chưa có cổng thanh toán tự động. Nhập đúng email user
          đã đăng ký.
        </p>

        <label className="block">
          <span className="block text-xs text-zinc-400 mb-1">Email user</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            list={emailSuggestions?.length ? 'admin-grant-plan-email-suggestions' : undefined}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
          />
          {emailSuggestions && emailSuggestions.length > 0 && (
            <datalist id="admin-grant-plan-email-suggestions">
              {emailSuggestions.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          )}
        </label>

        <label className="block">
          <span className="block text-xs text-zinc-400 mb-1">Gói</span>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            {PLAN_OPTIONS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={unlimited}
              onChange={(e) => setUnlimited(e.target.checked)}
            />
            Vĩnh viễn (không giới hạn thời gian)
          </label>
          {!unlimited && (
            <label className="block">
              <span className="block text-xs text-zinc-400 mb-1">Số ngày hiệu lực</span>
              <input
                type="number"
                min={1}
                max={3650}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </label>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookingUp}
            className="tap-44 flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-medium py-3 disabled:opacity-60"
          >
            {lookingUp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Tra cứu
          </button>
          <button
            type="button"
            onClick={handleGrant}
            disabled={granting}
            className={buttonClass({ size: 'lg', className: 'flex-1' })}
          >
            {granting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Cấp gói
          </button>
        </div>
      </section>

      {result && (
        <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 text-sm text-zinc-300 space-y-1">
          <p>
            Email: <span className="text-white">{result.email}</span>
          </p>
          <p>
            Gói: <span className="text-white">{result.plan}</span>
          </p>
          <p>
            Hết hạn: <span className="text-white">{formatExpiry(result.planExpiresAt)}</span>
          </p>
        </section>
      )}
    </div>
  )
}

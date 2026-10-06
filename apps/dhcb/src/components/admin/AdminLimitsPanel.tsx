// src/components/admin/AdminLimitsPanel.tsx — Nội dung tab "Hạn mức & khuyến mãi" trong /admin-s.
// Tab này trong /admin-s là nơi duy nhất chứa logic/API /api/admin-settings.
//
// Quyết định 2026-07-27: hạn mức đổi từ "5 số riêng theo chế độ (chat/writing/
// speaking/stt/pronounce)" sang MỘT số TỔNG lượt/ngày mỗi gói — không còn chia lẻ. Free
// KHÔNG hiện ở đây: từ trước Free đã enforce qua kho lượt chung cửa sổ trượt 7 ngày (xem
// api/_lib/usage.ts), không đọc app_settings, nên không có gì để chỉnh ở màn này.
import { useEffect, useState } from 'react'
import { ShieldAlert, Loader2, Save } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import { getAuthHeader } from '@core/authHeader'
import { Button } from '@core/Button'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'

interface AppSettings {
  limits: { free: number; vip: number }
  promoUntil: string | null
  aiCircuitBreaker: boolean
  leaderboardEnabled: boolean
}

const PLANS: { key: 'free' | 'vip'; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: 'vip', label: 'VIP' },
]

// Chuyển ISO datetime → giá trị cho <input type="datetime-local"> (giờ local trình duyệt)
function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props {
  // Cho component cha (AdminDashboard) biết trạng thái 403 để tự điều chỉnh UI khung ngoài nếu cần.
  onForbiddenChange?: (forbidden: boolean) => void
}

export default function AdminLimitsPanel({ onForbiddenChange }: Props) {
  const toast = useToast()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [promoEnabled, setPromoEnabled] = useState(false)
  const [promoLocal, setPromoLocal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const headers = await getAuthHeader()
        const res = await fetch('/api/admin-settings', { headers })
        if (res.status === 403) {
          setForbidden(true)
          onForbiddenChange?.(true)
          return
        }
        if (!res.ok) throw new Error(`Lỗi ${res.status}`)
        const data = (await res.json()) as AppSettings
        setSettings(data)
        setPromoEnabled(data.promoUntil !== null)
        setPromoLocal(toLocalInputValue(data.promoUntil))
      } catch (err) {
        toast.error(`Không tải được cấu hình: ${thongDiepLoiQuanTri(err)}`)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateLimit(plan: 'free' | 'vip', value: number) {
    setSettings((prev) => (prev ? { ...prev, limits: { ...prev.limits, [plan]: value } } : prev))
  }

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    try {
      const headers = await getAuthHeader()
      const promoUntil = promoEnabled && promoLocal ? new Date(promoLocal).toISOString() : null
      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limits: settings.limits,
          promoUntil,
          aiCircuitBreaker: settings.aiCircuitBreaker,
          leaderboardEnabled: settings.leaderboardEnabled,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      const updated = (await res.json()) as AppSettings
      setSettings(updated)
      setPromoEnabled(updated.promoUntil !== null)
      setPromoLocal(toLocalInputValue(updated.promoUntil))
      toast.success('Đã lưu cấu hình')
    } catch (err) {
      toast.error(`Lưu thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {!loading && forbidden && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-3 text-red-300 theme-light:text-red-900">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="text-sm">Bạn không có quyền truy cập trang này.</p>
        </div>
      )}

      {!loading && !forbidden && settings && (
        <>
          <section className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-200 theme-light:text-red-900 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Cầu dao khẩn cấp — chặn toàn bộ AI
            </p>
            <p className="text-xs text-red-300 theme-light:text-red-900/80 mb-3">
              Bật khi phát hiện chi phí gọi AI bất thường (lỗi vòng lặp, spam) cần dừng ngay trong
              lúc điều tra — chặn TẤT CẢ lượt Chat/Viết/Nói/STT/Chấm phát âm của MỌI người dùng, bất
              kể còn hạn mức hay không. Nhớ tắt lại sau khi xử lý xong.
            </p>
            <label className="flex items-center gap-2 text-sm text-red-100 theme-light:text-red-900">
              <input
                type="checkbox"
                checked={settings.aiCircuitBreaker}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, aiCircuitBreaker: e.target.checked } : prev,
                  )
                }
              />
              Đang bật — chặn toàn bộ lượt gọi AI
            </label>
          </section>

          <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
            <p className="text-sm font-semibold text-white mb-3">Khuyến mãi ra mắt</p>
            <label className="flex items-center gap-2 text-sm text-zinc-300 mb-3">
              <input
                type="checkbox"
                checked={promoEnabled}
                onChange={(e) => setPromoEnabled(e.target.checked)}
              />
              Bật khuyến mãi (mọi user được đối xử như VIP tới thời điểm bên dưới)
            </label>
            {promoEnabled && (
              <input
                type="datetime-local"
                value={promoLocal}
                onChange={(e) => setPromoLocal(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            )}
          </section>

          <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
            <p className="text-sm font-semibold text-white mb-1">Bảng xếp hạng</p>
            <p className="text-xs text-zinc-400 mb-3">
              Đang TẮT mặc định (quyết định 2026-07-27): ở quy mô ít người dùng, bảng gần trống
              khiến người mới thấy app "vắng vẻ" và bỏ đi. Chỉ bật lại khi đã đủ đông người dùng
              hoạt động/tuần (tham khảo mốc ~200).
            </p>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={settings.leaderboardEnabled}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, leaderboardEnabled: e.target.checked } : prev,
                  )
                }
              />
              Hiện bảng xếp hạng trong Challenge
            </label>
          </section>

          <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
            <p className="text-sm font-semibold text-white mb-1">Hạn mức lượt AI/ngày</p>
            <p className="text-xs text-zinc-400 mb-3">
              Free dùng một hạn mức tổng/ngày cho các tính năng AI. VIP không giới hạn lượt AI/ngày
              khi gói còn hiệu lực; vẫn giữ rate limit, theo dõi chi phí và cầu dao khẩn cấp. Cấu
              hình số VIP cũ được giữ trong DB để tương thích rollback, không còn dùng để chặn lượt
              học VIP.
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {PLANS.filter(({ key }) => key === 'free').map(({ key: plan, label }) => (
                <label key={plan} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-400">Gói {label} (lượt/ngày)</span>
                  <input
                    type="number"
                    min={0}
                    max={1_000_000}
                    value={settings.limits[plan]}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      updateLimit(plan, Number.isFinite(n) ? Math.max(0, n) : 0)
                    }}
                    className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-right text-white"
                  />
                </label>
              ))}
            </div>
          </section>

          <Button type="button" onClick={handleSave} disabled={saving} fullWidth>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu cấu hình
          </Button>
        </>
      )}
    </div>
  )
}

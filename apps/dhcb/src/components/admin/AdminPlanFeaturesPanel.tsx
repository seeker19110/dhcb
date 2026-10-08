// src/components/admin/AdminPlanFeaturesPanel.tsx — Tab "Tính năng theo gói" trong /admin.
// Bảng ma trận: hàng = tính năng, cột = Free/VIP, mỗi ô là checkbox bật/tắt. Gọi thẳng
// api/admin-plan-features.ts — thêm tính năng mới (mặc định bật cả 3 gói) + xoá hẳn 1 tính
// năng khỏi danh mục.
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import { getAuthHeader } from '@core/authHeader'
import type { Plan } from '@dhcb/core-billing/plan'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import { buttonClass } from '@core/buttonStyles'

interface FeatureCatalogItem {
  key: string
  label: string
  description: string | null
  sortOrder: number
}

interface Matrix {
  catalog: FeatureCatalogItem[]
  flags: Record<string, Record<Plan, boolean>>
  updatedAt: string
}

const PLAN_COLS: { key: Plan; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: 'vip', label: 'VIP' },
]

export default function AdminPlanFeaturesPanel() {
  const toast = useToast()
  // .error là useCallback ổn định trong ToastProvider — dùng làm dependency cho load.
  const toastError = toast.error
  const [matrix, setMatrix] = useState<Matrix | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingCell, setTogglingCell] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      const res = await fetch('/api/admin-plan-features', { headers })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      setMatrix((await res.json()) as Matrix)
    } catch (err) {
      toastError(`Tải danh sách thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(load)
  }, [load])

  async function handleToggle(featureKey: string, plan: Plan, enabled: boolean) {
    const cellId = `${featureKey}:${plan}`
    setTogglingCell(cellId)
    // Cập nhật lạc quan để UI mượt, rollback nếu lỗi.
    setMatrix((prev: Matrix | null) => {
      if (!prev) return prev
      const prevRow = prev.flags[featureKey] ?? {
        free: true,
        plus: true,
        pro: true,
        vip: true,
      }
      return { ...prev, flags: { ...prev.flags, [featureKey]: { ...prevRow, [plan]: enabled } } }
    })
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-plan-features', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey, plan, enabled }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
    } catch (err) {
      toast.error(`Cập nhật thất bại: ${thongDiepLoiQuanTri(err)}`)
      await load()
    } finally {
      setTogglingCell(null)
    }
  }

  async function handleAdd() {
    const key = newKey.trim().toLowerCase()
    const label = newLabel.trim()
    if (!key || !label) {
      toast.error('Nhập key và tên tính năng')
      return
    }
    if (!/^[a-z0-9_]+$/.test(key)) {
      toast.error('Key chỉ gồm chữ thường, số, gạch dưới (vd: flashcard_srs)')
      return
    }
    setAdding(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-plan-features', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, label }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      toast.success(`Đã thêm tính năng "${label}"`)
      setNewKey('')
      setNewLabel('')
      await load()
    } catch (err) {
      toast.error(`Thêm thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(key: string) {
    setDeletingKey(key)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-plan-features', {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      toast.success('Đã xoá tính năng')
      await load()
    } catch (err) {
      toast.error(`Xoá thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setDeletingKey(null)
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Tính năng theo từng gói</p>
        <p className="text-xs text-zinc-500">
          Bỏ tick = tính năng bị khoá cho gói đó (user thấy màn "Nâng cấp gói"). Đây là khoá hiển
          thị/truy cập trang — hạn mức lượt AI/ngày vẫn cấu hình riêng ở tab "Hạn mức & khuyến mãi".
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </div>
        )}

        {!loading && matrix && (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="py-2 pr-3 font-medium">Tính năng</th>
                  {PLAN_COLS.map((p) => (
                    <th key={p.key} className="py-2 px-3 font-medium text-center">
                      {p.label}
                    </th>
                  ))}
                  <th className="py-2 pl-3" />
                </tr>
              </thead>
              <tbody>
                {matrix.catalog.map((item: FeatureCatalogItem) => (
                  <tr key={item.key} className="border-t border-zinc-800/80">
                    <td className="py-2.5 pr-3">
                      <p className="text-white">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-zinc-500">{item.description}</p>
                      )}
                    </td>
                    {PLAN_COLS.map((p) => {
                      const cellId = `${item.key}:${p.key}`
                      const enabled = matrix.flags[item.key]?.[p.key] ?? true
                      return (
                        <td key={p.key} className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={togglingCell === cellId}
                            onChange={(e) => handleToggle(item.key, p.key, e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                      )
                    })}
                    <td className="py-2.5 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.key)}
                        disabled={deletingKey === item.key}
                        className="tap-44 inline-flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 theme-light:text-red-900 p-2 disabled:opacity-60"
                        aria-label={`Xoá ${item.label}`}
                      >
                        {deletingKey === item.key ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Thêm tính năng mới</p>
        <p className="text-xs text-zinc-500">
          Mặc định bật cho cả 3 gói — chỉnh lại ở bảng trên sau khi thêm.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="key (vd: flashcard_srs)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Tên hiển thị"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
          />
          <button type="button" onClick={handleAdd} disabled={adding} className={buttonClass()}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Thêm
          </button>
        </div>
      </section>
    </div>
  )
}

// src/components/admin/AdminPlanMarketingPanel.tsx — Tab "Nội dung gói" trong /admin. Sửa
// badge/tagline + thêm/sửa/xoá từng gạch đầu dòng (tính năng/lợi ích) hiển thị ở trang Nâng
// cấp (UpgradeSection.tsx). Gọi thẳng api/admin-plan-marketing.ts. Khác tab "Tính năng theo
// gói" (bật/tắt TRUY CẬP) — đây thuần là NỘI DUNG QUẢNG CÁO.
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Save } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import { getAuthHeader } from '@core/authHeader'
import type { Plan } from '@dhcb/core-billing/plan'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import { buttonClass } from '@core/buttonStyles'

interface Bullet {
  id: number
  textVi: string
  textEn: string
  sortOrder: number
}

interface PlanEntry {
  plan: Plan
  badge: string
  taglineVi: string
  taglineEn: string
  bullets: Bullet[]
}

interface MarketingData {
  plans: Record<Plan, PlanEntry>
  updatedAt: string
}

const PLAN_SECTIONS: { key: Plan; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: 'vip', label: 'VIP' },
]

async function api(method: string, body?: unknown) {
  const headers = await getAuthHeader()
  const res = await fetch('/api/admin-plan-marketing', {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? `Lỗi ${res.status}`)
  }
  return res.json().catch(() => ({}))
}

function PlanSection({ entry, onReload }: { entry: PlanEntry; onReload: () => Promise<void> }) {
  const toast = useToast()
  const [badge, setBadge] = useState(entry.badge)
  const [taglineVi, setTaglineVi] = useState(entry.taglineVi)
  const [taglineEn, setTaglineEn] = useState(entry.taglineEn)
  const [savingInfo, setSavingInfo] = useState(false)
  const [rows, setRows] = useState(entry.bullets)
  const [savingRowId, setSavingRowId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [newVi, setNewVi] = useState('')
  const [newEn, setNewEn] = useState('')
  const [adding, setAdding] = useState(false)

  // Đồng bộ lại state cục bộ khi dữ liệu gói đổi (sau khi reload từ server) — dùng mẫu
  // "setState trong lúc render" chuẩn React thay cho effect, tránh render thừa.
  const [prevEntry, setPrevEntry] = useState(entry)
  if (prevEntry !== entry) {
    setPrevEntry(entry)
    setBadge(entry.badge)
    setTaglineVi(entry.taglineVi)
    setTaglineEn(entry.taglineEn)
    setRows(entry.bullets)
  }

  async function saveInfo() {
    setSavingInfo(true)
    try {
      await api('PUT', { plan: entry.plan, badge, taglineVi, taglineEn })
      toast.success('Đã lưu')
      await onReload()
    } catch (err) {
      toast.error(`Lưu thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setSavingInfo(false)
    }
  }

  function updateRow(id: number, patch: Partial<Bullet>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function saveRow(row: Bullet) {
    setSavingRowId(row.id)
    try {
      await api('PATCH', { id: row.id, textVi: row.textVi, textEn: row.textEn })
      toast.success('Đã lưu')
      await onReload()
    } catch (err) {
      toast.error(`Lưu thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setSavingRowId(null)
    }
  }

  async function deleteRow(id: number) {
    setDeletingId(id)
    try {
      await api('DELETE', { id })
      toast.success('Đã xoá')
      await onReload()
    } catch (err) {
      toast.error(`Xoá thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setDeletingId(null)
    }
  }

  async function addRow() {
    const textVi = newVi.trim()
    const textEn = newEn.trim()
    if (!textVi || !textEn) {
      toast.error('Nhập cả tiếng Việt và tiếng Anh')
      return
    }
    setAdding(true)
    try {
      await api('POST', { plan: entry.plan, textVi, textEn })
      toast.success('Đã thêm hàng')
      setNewVi('')
      setNewEn('')
      await onReload()
    } catch (err) {
      toast.error(`Thêm thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">
          {PLAN_SECTIONS.find((p) => p.key === entry.plan)?.label}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          placeholder="Emoji badge (vd: 🌱)"
          className="sm:w-28 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
        />
        <input
          type="text"
          value={taglineVi}
          onChange={(e) => setTaglineVi(e.target.value)}
          placeholder="Tagline tiếng Việt"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
        />
        <input
          type="text"
          value={taglineEn}
          onChange={(e) => setTaglineEn(e.target.value)}
          placeholder="Tagline English"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
        />
        <button type="button" onClick={saveInfo} disabled={savingInfo} className={buttonClass()}>
          {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              type="text"
              value={row.textVi}
              onChange={(e) => updateRow(row.id, { textVi: e.target.value })}
              className="flex-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              value={row.textEn}
              onChange={(e) => updateRow(row.id, { textEn: e.target.value })}
              className="flex-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white"
            />
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => saveRow(row)}
                disabled={savingRowId === row.id}
                className="tap-44 inline-flex items-center justify-center rounded-lg border border-accent-500/30 text-accent-300 p-2 disabled:opacity-60"
                aria-label="Lưu hàng này"
              >
                {savingRowId === row.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => deleteRow(row.id)}
                disabled={deletingId === row.id}
                className="tap-44 inline-flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 theme-light:text-red-900 p-2 disabled:opacity-60"
                aria-label="Xoá hàng này"
              >
                {deletingId === row.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-zinc-800/80">
        <input
          type="text"
          value={newVi}
          onChange={(e) => setNewVi(e.target.value)}
          placeholder="Hàng mới — tiếng Việt"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white mt-2"
        />
        <input
          type="text"
          value={newEn}
          onChange={(e) => setNewEn(e.target.value)}
          placeholder="New row — English"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white mt-2"
        />
        <button
          type="button"
          onClick={addRow}
          disabled={adding}
          className="tap-44 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-semibold px-4 py-2.5 disabled:opacity-60 whitespace-nowrap mt-2"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Thêm hàng
        </button>
      </div>
    </section>
  )
}

export default function AdminPlanMarketingPanel() {
  const toast = useToast()
  // .error là useCallback ổn định trong ToastProvider — dùng làm dependency cho load.
  const toastError = toast.error
  const [data, setData] = useState<MarketingData | null>(null)
  const [loading, setLoading] = useState(true)

  // Không setLoading(true) đồng bộ ở đây — lúc mount loading đã là true sẵn; khi reload từ
  // handler thì hàm reload() bên dưới lo phần bật spinner.
  const load = useCallback(async () => {
    try {
      setData((await api('GET')) as MarketingData)
    } catch (err) {
      toastError(`Tải nội dung thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setLoading(false)
    }
  }, [toastError])

  // Gọi từ handler (các nút Lưu/Thêm/Xoá trong PlanSection) — setState trong handler là hợp lệ.
  async function reload() {
    setLoading(true)
    await load()
  }

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(load)
  }, [load])

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Nội dung mô tả gói (badge/tagline + gạch đầu dòng tính năng/lợi ích) hiển thị ở trang Nâng
        cấp trong Hồ sơ. Sửa xong bấm Lưu ở đúng hàng/gói — áp dụng ngay cho mọi người dùng.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
        </div>
      )}

      {!loading &&
        data &&
        PLAN_SECTIONS.map(({ key }) => (
          <PlanSection key={key} entry={data.plans[key]} onReload={reload} />
        ))}
    </div>
  )
}

// src/components/admin/AdminVipWhitelistPanel.tsx — Tab "Danh sách VIP" trong /admin.
// Quản lý public.vip_whitelist qua api/admin-vip-whitelist.ts: thêm email → cấp VIP vĩnh viễn
// ngay (nếu đã có tài khoản) hoặc tự cấp lúc người đó đăng ký sau này; xoá email → hạ về free.
import { useCallback, useEffect, useState } from 'react'
import { Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import { getAuthHeader } from '@core/authHeader'
import { Button } from '@core/Button'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'

interface WhitelistItem {
  email: string
  note: string | null
  createdAt: string
}

export default function AdminVipWhitelistPanel() {
  const toast = useToast()
  // .error là useCallback ổn định trong ToastProvider — dùng làm dependency cho load.
  const toastError = toast.error
  const [items, setItems] = useState<WhitelistItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      const res = await fetch('/api/admin-vip-whitelist', { headers })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      const data = (await res.json()) as { items: WhitelistItem[] }
      setItems(data.items)
    } catch (err) {
      toastError(`Tải danh sách thất bại: ${thongDiepLoiQuanTri(err)}`)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(load)
  }, [load])

  async function handleAdd() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast.error('Nhập email trước đã')
      return
    }
    setAdding(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-vip-whitelist', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, note: note.trim() || undefined }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      toast.success(`Đã cấp VIP vĩnh viễn cho ${trimmedEmail}`)
      setEmail('')
      setNote('')
      await load()
    } catch (err) {
      toast.error(`Thêm thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(targetEmail: string) {
    setRemovingEmail(targetEmail)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-vip-whitelist', {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lỗi ${res.status}`)
      }
      toast.success(`Đã gỡ ${targetEmail} khỏi danh sách VIP`)
      await load()
    } catch (err) {
      toast.error(`Gỡ thất bại: ${thongDiepLoiQuanTri(err)}`)
    } finally {
      setRemovingEmail(null)
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Thêm email vào danh sách VIP</p>
        <p className="text-xs text-zinc-500">
          Email trong danh sách này luôn là VIP vĩnh viễn — cấp ngay nếu đã có tài khoản, hoặc tự
          cấp lúc người đó đăng ký sau này. Gỡ khỏi danh sách sẽ hạ về Free ngay.
        </p>

        <label className="block">
          <span className="block text-xs text-zinc-400 mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
          />
        </label>

        <label className="block">
          <span className="block text-xs text-zinc-400 mb-1">Ghi chú (tuỳ chọn)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="vd: bạn thân, đóng góp code..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
          />
        </label>

        <Button type="button" onClick={handleAdd} disabled={adding} fullWidth>
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          Thêm vào danh sách VIP
        </Button>
      </section>

      <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-white">
          Danh sách hiện tại {items ? `(${items.length})` : ''}
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </div>
        )}

        {!loading && items && items.length === 0 && (
          <p className="text-sm text-zinc-500 py-2">Chưa có email nào trong danh sách.</p>
        )}

        {!loading &&
          items &&
          items.map((item) => (
            <div
              key={item.email}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{item.email}</p>
                {item.note && <p className="text-xs text-zinc-500 truncate">{item.note}</p>}
                <p className="text-[0.6875rem] text-content-muted">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.email)}
                disabled={removingEmail === item.email}
                className="tap-44 shrink-0 flex items-center gap-1.5 rounded-lg border border-red-500/30 text-red-400 theme-light:text-red-900 text-xs font-medium px-3 py-2 disabled:opacity-60"
              >
                {removingEmail === item.email ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Gỡ
              </button>
            </div>
          ))}
      </section>
    </div>
  )
}

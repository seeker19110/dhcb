import { useState, useEffect, useCallback } from 'react'
import { Ban, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import type { ReservedNameRow } from '@dhcb/core-contracts/adminViews'
import { buttonClass, buttonVariantClass } from '@core/buttonStyles'

export default function AdminReservedNamesPanel() {
  const [items, setItems] = useState<ReservedNameRow[]>([])
  const [newPhrase, setNewPhrase] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReserved = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin-reserved-names', { headers })
      if (res.status === 401 || res.status === 403) {
        setError('Chỉ admin mới truy cập được')
        return
      }
      if (!res.ok) throw new Error('Không thể tải danh sách từ cấm')
      const data = await res.json()
      setItems(data.reservedNames || [])
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi tải danh sách từ cấm'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(fetchReserved)
  }, [fetchReserved])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPhrase.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-reserved-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'add', phrase: newPhrase.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Thêm thất bại')

      setNewPhrase('')
      fetchReserved()
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi thêm từ cấm'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa cụm từ cấm này?')) return

    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-reserved-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'remove', id }),
      })
      if (!res.ok) throw new Error('Xóa thất bại')

      fetchReserved()
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi xóa từ cấm'))
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-400 theme-light:text-rose-900" />
            <div>
              <h3 className="font-bold text-white text-base">Chặn tên giả danh ban quản trị</h3>
              <p className="text-xs text-zinc-400">
                Các cụm từ này bị cấm khi người dùng đặt nickname (chống giả danh Admin/CSKH/Hệ
                thống).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchReserved}
            aria-label="Tải lại danh sách"
            className={`${buttonVariantClass('outline')} tap-44 inline-flex items-center justify-center p-1.5 rounded-lg`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 theme-light:text-rose-900 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Nhập cụm từ cấm mới (vd: hotro_kythuat)..."
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className={buttonClass({ variant: 'primary' })}
          >
            <Plus className="w-4 h-4" />
            Thêm từ cấm
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {loading ? (
            <div className="text-xs text-zinc-500 py-4">Đang tải danh sách từ cấm...</div>
          ) : items.length === 0 ? (
            <div className="text-xs text-zinc-500 py-4">Chưa có từ cấm nào</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300"
              >
                <span>{item.phrase}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-zinc-500 hover:text-rose-400 transition"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

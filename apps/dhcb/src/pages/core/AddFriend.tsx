// apps/dhcb/src/pages/AddFriend.tsx — Trang mở khi bấm link/quét QR kết bạn của người khác
// (/ket-ban/:code). Yêu cầu đăng nhập (bọc RequireAuth ở App.tsx) — chưa đăng nhập sẽ được
// RequireAuth chuyển sang /login rồi quay lại đúng link này sau khi đăng nhập xong.
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { UserPlus, CheckCircle2 } from 'lucide-react'
import Layout from '../../components/Layout'
import { useToast } from '@core/ToastProvider'
import { MAIN_CONTENT_ID } from '@core/PageShell'
import { lookupFriendByCode, addFriendByCode, type FriendUserSummary } from '../../lib/friends'
import { buttonClass } from '@core/buttonStyles'

export default function AddFriend() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [target, setTarget] = useState<FriendUserSummary | null | undefined>(undefined)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!code) return
    let cancelled = false
    lookupFriendByCode(code).then((user) => {
      if (!cancelled) setTarget(user)
    })
    return () => {
      cancelled = true
    }
  }, [code])

  async function handleAdd() {
    if (!code) return
    setAdding(true)
    const result = await addFriendByCode(code)
    setAdding(false)
    if (result.ok) {
      setAdded(true)
      toast.success(
        result.alreadyFriends
          ? `Bạn và ${result.friend.name} đã là bạn bè từ trước`
          : `Đã kết bạn với ${result.friend.name}!`,
      )
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title="Kết bạn" />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none max-w-md mx-auto px-4 pb-24 pt-4 text-center"
      >
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Kết bạn
        </h1>

        {target === undefined && <p className="text-sm text-zinc-400">Đang kiểm tra mã…</p>}

        {target === null && (
          <p className="text-sm text-red-400 theme-light:text-red-900">
            Mã kết bạn không tồn tại hoặc đã hết hiệu lực.
          </p>
        )}

        {target && !added && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-base text-white mb-6">
              Kết bạn với <span className="font-semibold">{target.name}</span>?
            </p>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-5 py-3 text-sm font-semibold text-[#fff] min-h-[44px] disabled:opacity-60"
            >
              <UserPlus size={18} />
              {adding ? 'Đang kết bạn…' : 'Kết bạn'}
            </button>
          </div>
        )}

        {added && target && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <CheckCircle2
              className="mx-auto mb-3 text-green-400 theme-light:text-green-900"
              size={40}
            />
            <p className="text-base text-white mb-6">Đã kết bạn thành công!</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/tin-nhan?peerId=${encodeURIComponent(target.id)}`}
                className={buttonClass({ variant: 'primary', className: 'w-full sm:w-auto' })}
              >
                Nhắn tin ngay
              </Link>
              <button
                type="button"
                onClick={() => navigate('/ban-be')}
                className={buttonClass({ variant: 'outline', className: 'w-full sm:w-auto' })}
              >
                Xem danh sách bạn bè
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

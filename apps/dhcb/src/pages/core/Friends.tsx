// apps/dhcb/src/pages/Friends.tsx — Trang "Bạn bè": mã/link/QR kết bạn của mình + danh sách
// bạn bè hiện tại. Đây là NỀN TẢNG cho tính năng chat 1-1 sau này (chỉ chat được với bạn bè).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { Users, Copy, Check, UserMinus, MessageSquare, MapPin } from 'lucide-react'
import Layout from '../../components/Layout'
import { usePageTitle } from '../../lib/usePageTitle'
import { useToast } from '@core/ToastProvider'
import {
  fetchFriendsState,
  buildFriendInviteUrl,
  removeFriend,
  type FriendUserSummary,
} from '../../lib/friends'
import { PageShell } from '@core/PageShell'

export default function Friends() {
  const toast = useToast()
  const [code, setCode] = useState<string | null>(null)
  const [friends, setFriends] = useState<FriendUserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  usePageTitle('Bạn bè | Đồng Hành Cùng Bạn')

  useEffect(() => {
    let cancelled = false
    fetchFriendsState().then((state) => {
      if (cancelled) return
      if (state) {
        setCode(state.code)
        setFriends(state.friends)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!code) return
    QRCode.toDataURL(buildFriendInviteUrl(code), { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => {})
  }, [code])

  function copyLink() {
    if (!code) return
    navigator.clipboard.writeText(buildFriendInviteUrl(code)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleRemove(friend: FriendUserSummary) {
    const ok = await removeFriend(friend.id)
    if (ok) {
      setFriends((prev) => prev.filter((f) => f.id !== friend.id))
      toast.success(`Đã huỷ kết bạn với ${friend.name}`)
    } else {
      toast.error('Không huỷ được — thử lại sau')
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title="Bạn bè" />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang danh sách → width="standard"; giữ
      nguyên đệm dưới cũ (pb-24, không theo --bnav-h) qua className. */}
      <PageShell width="standard" baseWidth="max-w-lg" className="!pt-4 !pb-24">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Bạn bè
        </h1>

        {loading && <p className="text-sm text-zinc-400">Đang tải…</p>}

        {!loading && code && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6 text-center">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Mã QR kết bạn"
                className="mx-auto mb-4 rounded-xl bg-white p-2"
                width={180}
                height={180}
              />
            )}
            <p className="text-xs text-zinc-400 mb-2">Mã kết bạn của bạn</p>
            <p className="text-lg font-mono font-bold tracking-widest text-white mb-4">{code}</p>
            {/* Chữ TỐI cố định trên nền accent-500: chữ trắng chỉ 2,4–2,8:1 ở cả 3 theme (audit
                UI/UX 2026-09-30 C4); `#09090b` đạt ≥ 7:1 trên accent-500 của mọi theme. Không
                dùng `text-zinc-950`/`text-black` vì thang zinc tự đảo màu ở theme nền sáng. */}
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2.5 text-sm font-semibold text-[#09090b] min-h-[44px]"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Đã chép liên kết' : 'Chép liên kết kết bạn'}
            </button>
          </section>
        )}

        {/* Lối vào tính năng "Đi chung" — chia sẻ vị trí thật khi cả nhóm đi chơi cùng nhau */}
        <Link
          to="/nhom-di-chung"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 min-h-[44px]"
        >
          <MapPin size={18} className="text-accent-400" aria-hidden="true" />
          <span className="text-sm text-white">
            <strong className="font-semibold">Đi chung</strong>
            <span className="block text-xs text-zinc-400">
              Chia sẻ vị trí thời gian thực khi đi chơi chung — bật/tắt lúc nào cũng được
            </span>
          </span>
        </Link>

        <section>
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Users size={16} /> Bạn bè ({friends.length})
          </h2>
          {!loading && friends.length === 0 && (
            <p className="text-sm text-zinc-400">
              Chưa có bạn bè nào — chia sẻ link/QR ở trên để kết bạn.
            </p>
          )}
          <ul className="space-y-2">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="text-sm font-medium text-white">{friend.name}</span>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/tin-nhan?peerId=${encodeURIComponent(friend.id)}`}
                    aria-label={`Nhắn tin với ${friend.name}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/20 text-blue-400 theme-light:text-blue-800 hover:bg-blue-600/30 text-xs font-semibold tap-44-y transition-colors"
                  >
                    <MessageSquare size={14} />
                    <span>Nhắn tin</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Huỷ kết bạn với ${friend.name}`}
                    onClick={() => handleRemove(friend)}
                    className="tap-44 inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </PageShell>
    </div>
  )
}

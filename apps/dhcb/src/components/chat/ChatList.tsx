import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, MessageSquarePlus, Users, UserPlus } from 'lucide-react'
import type { RoomSummary } from '../../lib/chatApi'
import { fetchFriendsState, type FriendUserSummary } from '../../lib/friends'
import { formatChatPreviewTime, getAvatarColor } from '../../lib/chatFormatters'
import PresenceDot from './PresenceDot'
import { Skeleton, CardListSkeleton } from '../Skeleton'
import { buttonClass } from '@core/buttonStyles'

export interface ChatListProps {
  rooms: RoomSummary[]
  activeRoomId: string | null
  presence: Record<string, boolean>
  onSelectRoom: (roomId: string) => void
  onStartChatWithFriend: (friendId: string) => void
  loading?: boolean
}

export default function ChatList({
  rooms,
  activeRoomId,
  presence,
  onSelectRoom,
  onStartChatWithFriend,
  loading = false,
}: ChatListProps) {
  const [search, setSearch] = useState('')
  const [showFriendsPicker, setShowFriendsPicker] = useState(false)
  const [friends, setFriends] = useState<FriendUserSummary[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  // [changelog 0525] Lỗi tải bạn bè tách khỏi "chưa có bạn bè" — bản cũ mất mạng là hiện
  // "Chưa có bạn bè nào. Thêm bạn bè ngay" như thể danh sách trống thật.
  const [friendsError, setFriendsError] = useState(false)

  // Lọc phòng theo từ khoá tìm kiếm
  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rooms
    return rooms.filter((r) => r.peer.name.toLowerCase().includes(q))
  }, [rooms, search])

  // Bật/tắt Friends Picker; tải danh sách bạn bè NGAY TRONG handler khi mở
  // (setState trong handler/callback promise là hợp lệ — trước đây nằm ở effect
  // và bị rule set-state-in-effect chặn vì setLoadingFriends đồng bộ).
  function toggleFriendsPicker() {
    const next = !showFriendsPicker
    setShowFriendsPicker(next)
    if (next && friends.length === 0) loadFriends()
  }

  function loadFriends() {
    setLoadingFriends(true)
    setFriendsError(false)
    fetchFriendsState().then(
      (state) => {
        setFriends(state.friends)
        setLoadingFriends(false)
      },
      () => {
        setFriendsError(true)
        setLoadingFriends(false)
      },
    )
  }

  return (
    <aside className="flex flex-col h-full bg-zinc-900/60 border-r border-white/10 w-full sm:w-80 lg:w-96 flex-shrink-0">
      {/* Header danh sách */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Tin nhắn</span>
          </h2>
          <p className="text-xs text-zinc-400">Trò chuyện trực tiếp với bạn bè</p>
        </div>

        <button
          type="button"
          onClick={toggleFriendsPicker}
          aria-label="Tạo cuộc trò chuyện mới"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/20 theme-light:bg-blue-100 text-blue-400 theme-light:text-blue-800 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-semibold transition-colors tap-44"
          title="Bắt đầu chat với bạn bè"
        >
          <MessageSquarePlus size={15} />
          <span>Chat mới</span>
        </button>
      </div>

      {/* Modal / Popup chọn bạn bè để chat mới */}
      {showFriendsPicker && (
        <div className="p-3 bg-zinc-800/90 border-b border-white/10 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Users size={14} /> Chọn bạn bè để nhắn tin
            </span>
            <button
              type="button"
              onClick={() => setShowFriendsPicker(false)}
              className="tap-44 text-xs text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg px-2 transition-colors"
            >
              Đóng
            </button>
          </div>

          {/* Skeleton thay dòng chữ — giữ chiều cao ổn định, không giật layout. */}
          {loadingFriends && (
            <div className="py-2 space-y-2" aria-busy="true" aria-label="Đang tải bạn bè">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          )}

          {!loadingFriends && friendsError && (
            <div role="alert" className="text-center py-3">
              <p className="text-xs text-zinc-300 mb-2">
                Chưa tải được danh sách bạn bè. Kiểm tra kết nối rồi thử lại.
              </p>
              <button
                type="button"
                onClick={loadFriends}
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
              >
                Thử lại
              </button>
            </div>
          )}

          {!loadingFriends && !friendsError && friends.length === 0 && (
            <div className="text-center py-3">
              <p className="text-xs text-zinc-400 mb-2">Chưa có bạn bè nào.</p>
              <Link
                to="/ban-be"
                className="inline-flex items-center gap-1 text-xs text-blue-400 theme-light:text-blue-800 hover:underline font-medium"
              >
                <UserPlus size={13} /> Thêm bạn bè ngay
              </Link>
            </div>
          )}

          {!loadingFriends && friends.length > 0 && (
            <ul className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {friends.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onStartChatWithFriend(f.id)
                      setShowFriendsPicker(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-white/5 transition-colors group"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAvatarColor(
                        f.name,
                      )}`}
                    >
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                      {f.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Thanh tìm kiếm */}
      <div className="p-3 border-b border-white/5">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bạn bè…"
            className="tap-44-y w-full pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Danh sách phòng hội thoại */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {/* Dùng skeleton dùng chung thay bản chép tay — nhất quán với các trang khác. */}
        {loading && <CardListSkeleton rows={4} />}

        {!loading && filteredRooms.length === 0 && (
          <div className="p-6 text-center text-zinc-400">
            {search ? (
              <p className="text-xs">Không tìm thấy hội thoại nào</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs">Chưa có tin nhắn nào.</p>
                <Link
                  to="/ban-be"
                  className="tap-44-y inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 transition-colors"
                >
                  <Users size={14} /> Xem danh sách bạn bè
                </Link>
              </div>
            )}
          </div>
        )}

        {!loading &&
          filteredRooms.map((room) => {
            const isActive = room.roomId === activeRoomId
            const isOnline = !!presence[room.peer.id]
            const timeStr = formatChatPreviewTime(room.lastMessage?.createdAt)
            const previewText = room.lastMessage ? room.lastMessage.content : 'Bắt đầu trò chuyện'

            return (
              <button
                key={room.roomId}
                type="button"
                onClick={() => onSelectRoom(room.roomId)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative ${
                  isActive
                    ? 'bg-blue-600/15 theme-light:bg-blue-100 border-l-4 border-blue-500'
                    : 'hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                {/* Avatar & Presence */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${getAvatarColor(
                      room.peer.name,
                    )}`}
                  >
                    {room.peer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <PresenceDot online={isOnline} size="sm" />
                  </div>
                </div>

                {/* Thông tin tên & tin nhắn cuối */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-white' : 'text-zinc-200'
                      }`}
                    >
                      {room.peer.name}
                    </span>
                    {timeStr && (
                      <span className="text-[0.6875rem] text-zinc-400 ml-2">{timeStr}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs truncate ${
                        room.unreadCount > 0
                          ? 'font-semibold text-white'
                          : 'text-zinc-400 font-normal'
                      }`}
                    >
                      {previewText}
                    </p>

                    {room.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[0.6875rem] font-bold">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
      </div>
    </aside>
  )
}

import { useRef, useEffect } from 'react'
import { ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react'
import type { RoomSummary, ChatMessage } from '../../lib/chatApi'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import PresenceDot from './PresenceDot'
import { getAvatarColor } from '../../lib/chatFormatters'
import { CardListSkeleton } from '../Skeleton'
import LoadError from '../LoadError'

export interface ChatWindowProps {
  room: RoomSummary | null
  messages: ChatMessage[]
  currentUserId?: string
  isOnline: boolean
  isTyping: boolean
  loadingMessages: boolean
  chatError?: string | null
  onSendMessage: (text: string) => void
  onTyping: () => void
  onDeleteMessage: (msgId: string) => void
  onBack?: () => void
  /** Tải lại danh sách phòng + tin nhắn sau lỗi. */
  onRetry?: () => void
}

function formatDateHeader(isoString: string): string {
  try {
    const msgDate = new Date(isoString)
    const now = new Date()
    const isToday =
      msgDate.getDate() === now.getDate() &&
      msgDate.getMonth() === now.getMonth() &&
      msgDate.getFullYear() === now.getFullYear()

    if (isToday) return 'Hôm nay'

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday =
      msgDate.getDate() === yesterday.getDate() &&
      msgDate.getMonth() === yesterday.getMonth() &&
      msgDate.getFullYear() === yesterday.getFullYear()

    if (isYesterday) return 'Hôm qua'

    const day = msgDate.getDate().toString().padStart(2, '0')
    const month = (msgDate.getMonth() + 1).toString().padStart(2, '0')
    const year = msgDate.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return ''
  }
}

export default function ChatWindow({
  room,
  messages,
  currentUserId,
  isOnline,
  isTyping,
  loadingMessages,
  chatError,
  onSendMessage,
  onTyping,
  onDeleteMessage,
  onBack,
  onRetry,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Tự động cuộn xuống dưới khi có tin nhắn mới hoặc đang gõ
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isTyping])

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/60">
        <div className="w-16 h-16 rounded-full bg-blue-600/10 theme-light:bg-blue-100 border border-blue-500/20 flex items-center justify-center text-blue-400 theme-light:text-blue-800 mb-4 shadow-sm">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Chọn một cuộc trò chuyện</h3>
        <p className="text-xs text-zinc-400 max-w-sm">
          Chọn một người bạn từ danh sách bên trái hoặc nhấn &quot;Chat mới&quot; để bắt đầu gửi tin
          nhắn thời gian thực.
        </p>
      </div>
    )
  }

  // Nhóm tin nhắn theo ngày
  const groupedMessages: { date: string; items: ChatMessage[] }[] = []
  messages.forEach((msg) => {
    const dateLabel = formatDateHeader(msg.createdAt)
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.items.push(msg)
    } else {
      groupedMessages.push({ date: dateLabel, items: [msg] })
    }
  })

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 relative min-w-0">
      {/* Chat Window Header */}
      <header className="px-4 py-3 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Quay lại danh sách"
              className="sm:hidden p-1.5 -ml-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div className="relative flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${getAvatarColor(
                room.peer.name,
              )}`}
            >
              {room.peer.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0">
              <PresenceDot online={isOnline} size="sm" />
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{room.peer.name}</h3>
            <p className="text-[0.6875rem] text-zinc-400 flex items-center gap-1">
              <span>{isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-[0.6875rem] text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full"
            title="Đã bật bộ lọc ngôn từ văn minh tự động"
          >
            <ShieldCheck size={13} className="text-emerald-400 theme-light:text-emerald-800" />
            <span className="hidden sm:inline">Bảo vệ nội dung</span>
          </span>
        </div>
      </header>

      {/* Lỗi tải/kết nối: bảng lỗi có nút Thử lại thay vì dải chữ đỏ không hành động được. */}
      {chatError && (
        <div className="px-4 pt-3">
          <LoadError message={chatError} {...(onRetry ? { onRetry } : {})} />
        </div>
      )}

      {/* Danh sách tin nhắn cuộn */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col justify-start">
        {loadingMessages && <CardListSkeleton rows={4} />}

        {!loadingMessages && messages.length === 0 && (
          <div className="my-auto py-8 text-center text-zinc-400 max-w-xs mx-auto">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <MessageSquare size={22} />
            </div>
            <p className="text-xs font-medium text-zinc-300 mb-1">Chưa có tin nhắn nào</p>
            <p className="text-[0.6875rem] text-zinc-400">
              Gửi lời chào đầu tiên tới {room.peer.name} để bắt đầu cuộc trò chuyện!
            </p>
          </div>
        )}

        {!loadingMessages &&
          groupedMessages.map((group) => (
            <div key={group.date} className="w-full">
              {/* Header ngày */}
              <div className="flex items-center justify-center my-3">
                <span className="text-[0.6875rem] font-semibold text-zinc-400 bg-zinc-800/80 border border-white/5 px-2.5 py-0.5 rounded-full shadow-xs">
                  {group.date}
                </span>
              </div>

              {/* Danh sách bong bóng tin nhắn trong ngày */}
              {group.items.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.senderId === currentUserId}
                  onDelete={onDeleteMessage}
                />
              ))}
            </div>
          ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 my-2 text-xs text-zinc-400 animate-fade-in pl-1">
            <div className="flex items-center gap-1 bg-zinc-800/80 border border-white/5 px-3 py-1.5 rounded-2xl">
              <span className="text-[0.6875rem] font-medium text-zinc-300">{room.peer.name}</span>
              <span className="text-[0.6875rem] text-zinc-400">đang soạn tin</span>
              <span className="inline-flex gap-0.5 ml-1">
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Khung soạn thảo tin nhắn */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        placeholder={`Nhắn tin cho ${room.peer.name}…`}
      />
    </div>
  )
}

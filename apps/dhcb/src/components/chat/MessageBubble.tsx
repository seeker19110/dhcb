import { useState } from 'react'
import { Trash2, ShieldAlert } from 'lucide-react'
import type { ChatMessage } from '../../lib/chatApi'
import { formatMessageTime } from '../../lib/chatFormatters'

export interface MessageBubbleProps {
  message: ChatMessage
  isMine: boolean
  onDelete?: (messageId: string) => void
}

export default function MessageBubble({ message, isMine, onDelete }: MessageBubbleProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isFiltered = message.content.includes('***')

  const timeStr = formatMessageTime(message.createdAt)

  return (
    <div
      className={`group relative flex w-full flex-col ${
        isMine ? 'items-end' : 'items-start'
      } my-1.5 transition`}
    >
      {!isMine && (
        <span className="text-[0.6875rem] font-medium text-zinc-400 mb-1 px-1">
          {message.senderName}
        </span>
      )}

      <div className="flex items-center gap-2 max-w-[85%] sm:max-w-[75%]">
        {/* Nút xoá tin nhắn (cho tin nhắn của mình) */}
        {isMine && onDelete && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            {confirmDelete ? (
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-lg text-xs animate-fade-in">
                <span className="text-zinc-300 text-[0.6875rem]">Xoá?</span>
                <button
                  type="button"
                  onClick={() => onDelete(message.id)}
                  className="text-red-400 theme-light:text-red-900 hover:text-red-300 font-semibold px-1 min-h-[28px] flex items-center"
                >
                  Có
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-zinc-400 hover:text-white px-1 min-h-[28px] flex items-center"
                >
                  Không
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Xoá tin nhắn"
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded-full text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Xoá tin nhắn này"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* Khung nội dung tin nhắn */}
        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm break-words relative transition duration-200 ${
            isMine
              ? 'bg-accent-500 text-[#09090b] rounded-tr-xs shadow-md'
              : 'bg-zinc-900/90 text-zinc-100 border border-zinc-800/80 rounded-tl-xs'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed select-text">{message.content}</p>

          <div
            className={`flex items-center gap-1.5 justify-end mt-1 text-[0.6875rem] ${
              isMine ? 'text-[#09090b]/80' : 'text-zinc-400'
            }`}
          >
            {isFiltered && (
              <span
                className={`inline-flex items-center gap-0.5 text-[0.6875rem] ${
                  isMine ? '' : 'text-amber-300 theme-light:text-amber-900'
                }`}
                title="Một số từ ngữ đã được lọc theo tiêu chuẩn cộng đồng"
              >
                <ShieldAlert size={11} />
                <span>Đã lọc</span>
              </span>
            )}
            <span>{timeStr}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

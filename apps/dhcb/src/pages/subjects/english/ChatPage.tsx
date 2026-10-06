import { MAIN_CONTENT_ID } from '@core/PageShell'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import ChatList from '../../../components/chat/ChatList'
import ChatWindow from '../../../components/chat/ChatWindow'
import { useChat } from '../../../lib/useChat'
import { useToast } from '@core/ToastProvider'

export default function ChatPage() {
  usePageTitle('Tin nhắn | Đồng Hành Cùng Bạn')
  const [searchParams] = useSearchParams()
  const initialRoomId = searchParams.get('roomId')
  const initialPeerId = searchParams.get('peerId')

  const toast = useToast()

  const {
    rooms,
    activeRoomId,
    activeRoom,
    messages,
    loadingRooms,
    loadingMessages,
    presence,
    chatError,
    isPeerOnline,
    isPeerTyping,
    currentUserId,
    selectRoom,
    reloadChat,
    startChatWithPeer,
    sendMessage,
    sendTyping,
    deleteMessage,
  } = useChat({ initialRoomId, initialPeerId })

  async function handleStartChatWithFriend(friendId: string) {
    const roomId = await startChatWithPeer(friendId)
    if (!roomId) {
      toast.error('Không thể tạo phòng chat với người này')
    }
  }

  async function handleDeleteMessage(msgId: string) {
    const ok = await deleteMessage(msgId)
    if (ok) {
      toast.success('Đã xoá tin nhắn')
    } else {
      toast.error('Không xoá được tin nhắn')
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col">
      {/* [P2-2, audit 2026-09-22] Header trước đây chỉ có mũi tên, không tiêu đề/h1. */}
      <Layout title="Tin nhắn" />

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none flex-1 max-w-6xl w-full mx-auto px-0 sm:px-4 pt-2 sm:pt-4 pb-[calc(1rem+var(--bnav-h))] flex flex-col"
      >
        <h1 className="sr-only">Tin nhắn</h1>
        {/* Khung chat 2 cột trên desktop, 1 cột trên mobile */}
        <div className="flex-1 flex w-full rounded-none sm:rounded-2xl border-0 sm:border border-white/10 bg-zinc-900/40 backdrop-blur-md overflow-hidden shadow-2xl h-[calc(100dvh-3.5rem-var(--bnav-h))] sm:h-[calc(100dvh-5.5rem-var(--bnav-h))]">
          {/* Cột danh sách phòng */}
          <div
            className={`w-full sm:w-auto h-full sm:flex ${
              activeRoomId ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <ChatList
              rooms={rooms}
              activeRoomId={activeRoomId}
              presence={presence}
              loading={loadingRooms}
              onSelectRoom={selectRoom}
              onStartChatWithFriend={handleStartChatWithFriend}
            />
          </div>

          {/* Cột cửa sổ chat */}
          <div className={`flex-1 h-full sm:flex ${!activeRoomId ? 'hidden sm:flex' : 'flex'}`}>
            <ChatWindow
              room={activeRoom}
              messages={messages}
              currentUserId={currentUserId}
              isOnline={isPeerOnline}
              isTyping={isPeerTyping}
              loadingMessages={loadingMessages}
              chatError={chatError}
              onSendMessage={sendMessage}
              onTyping={sendTyping}
              onDeleteMessage={handleDeleteMessage}
              onBack={() => selectRoom(null)}
              onRetry={reloadChat}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

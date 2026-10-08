import React from 'react'
import {
  Send,
  Bot,
  User,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Info,
  Mic,
  MicOff,
  Radio,
  MessageSquare,
  Volume2,
} from 'lucide-react'
import CompanionLiveOrb from '../CompanionVoice/CompanionLiveOrb'
import VoiceWaveformVisualizer from '../CompanionVoice/VoiceWaveformVisualizer'
import CyberTutorAvatar3D from '../Companion3D/CyberTutorAvatar3D'
import AvatarEmbodimentSelector, { EmbodimentMode } from '../Companion3D/AvatarEmbodimentSelector'
import EdgeAiIndicator from '../EdgeAi/EdgeAiIndicator'
import InteractiveQuestionCard from './InteractiveQuestionCard'
import ChatProse from './ChatProse'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import { ChatMessage, CompanionVoiceState, DOMAIN_OPTIONS, QUICK_PROMPTS } from './studioTypes'
import { buttonClass } from '@core/buttonStyles'

// Ánh xạ trạng thái pipeline STT→LLM→TTS sang state hiển thị của CompanionLiveOrb (quả cầu
// hiệu ứng — không phụ thuộc audio "live" nào, chỉ vẽ theo state truyền vào).
function orbStateFor(
  state: CompanionVoiceState,
): 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted' {
  if (state === 'recording') return 'listening'
  if (state === 'transcribing' || state === 'thinking') return 'thinking'
  if (state === 'speaking') return 'speaking'
  return 'idle'
}

interface StudioDialogueProps {
  loading: boolean
  messages: ChatMessage[]
  input: string
  setInput: (val: string) => void
  selectedDomain: string
  setSelectedDomain: (val: string) => void
  viewMode: 'chat' | 'voice'
  setViewMode: (mode: 'chat' | 'voice') => void
  embodimentMode: EmbodimentMode
  setEmbodimentMode: (mode: EmbodimentMode) => void
  // Chế độ giọng nói — pipeline STT → LLM → TTS: ghi âm xong mới gửi nhận diện, gửi AI, rồi
  // đọc câu trả lời. KHÔNG còn WebSocket "live" (đã bỏ vì không có backend, chỉ là giao diện
  // giả lập trước đây).
  voice: {
    state: CompanionVoiceState
    error: string | null
    supported: boolean
    start: () => void
    stop: () => void
    cancel: () => void
    stopSession: () => void
  }
  handleSend: (customText?: string, viaVoice?: boolean) => Promise<void>
  handleConfirmAction: (action: ProposedAction) => Promise<void>
  handleRejectAction: (action: ProposedAction) => Promise<void>
  actionLoadingMap: Record<string, boolean>
  setActiveContext: (pkg: ContextPackage | null) => void
  getDomainLabel: (domainId?: string) => string
  // React 19: useRef(null) trả RefObject<T | null>, nên kiểu prop phải nhận null — ref THẬT
  // SỰ có thể null (trước lần render đầu, sau khi node bị gỡ).
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

export default function StudioDialogue({
  loading,
  messages,
  input,
  setInput,
  selectedDomain,
  setSelectedDomain,
  viewMode,
  setViewMode,
  embodimentMode,
  setEmbodimentMode,
  voice,
  handleSend,
  handleConfirmAction,
  handleRejectAction,
  actionLoadingMap,
  setActiveContext,
  getDomainLabel,
  messagesEndRef,
  inputRef,
}: StudioDialogueProps) {
  const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user')
  const lastCompanionMsg = [...messages].reverse().find((m) => m.sender === 'companion')

  // [audit UI/UX P1-1] Bản cũ: danh sách tin nhắn KHÔNG bị giới hạn chiều cao (chỉ `flex-1`,
  // không `min-h-0`), nên nó không tự sinh thanh cuộn riêng — cả TRANG cuộn theo document. Ô
  // nhập `sticky bottom-0` khi đó dính vào ĐÁY MÀN HÌNH bất kể nội dung phía trên đã cuộn tới
  // đâu, nên hễ trang cao hơn khung nhìn (rất dễ xảy ra ở desktop khi có avatar 3D + bộ lọc +
  // hàng gợi ý) là ô nhập đè lên đúng phần nội dung đang nằm ở dải cuối khung nhìn — thêm
  // padding-bottom cho danh sách KHÔNG sửa được vì phần bị che đã tồn tại phía TRÊN, không phải
  // trong phần đệm mới thêm. Sửa đúng gốc: khung chat có chiều cao GIỚI HẠN
  // (`h-[min(68dvh,640px)]`), danh sách tin nhắn tự cuộn NỘI BỘ (`min-h-0 overflow-y-auto`), ô
  // nhập nằm TRONG LUỒNG ở đáy khung (không còn `sticky`) — nhờ vậy nó không bao giờ chồng lên
  // nội dung phía trên, ở mọi bề rộng màn hình.
  return (
    <div className="space-y-4 flex-1 flex flex-col">
      {/* Avatar & Multimodal Embodiment Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400">Hình đại diện</span>
          <AvatarEmbodimentSelector currentMode={embodimentMode} onModeChange={setEmbodimentMode} />
        </div>

        {embodimentMode === '3d_cyber_avatar' && (
          <CyberTutorAvatar3D
            isSpeaking={loading}
            isListening={false}
            currentSpeechAmplitude={loading ? 0.75 : 0}
            currentIpaPhoneme={loading ? 'aa' : 'sil'}
            emotion="neutral"
          />
        )}

        {embodimentMode === 'live_orb' && (
          <div className="flex items-center justify-center py-6">
            <CompanionLiveOrb state={orbStateFor(voice.state)} audioLevel={0} />
          </div>
        )}
      </div>

      {/* View Mode Switcher (Chat vs Live Voice) */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('chat')}
            className={`tap-44-touch-y flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              viewMode === 'chat'
                ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Hội thoại văn bản
          </button>
          <button
            onClick={() => setViewMode('voice')}
            className={`tap-44-touch-y flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              viewMode === 'voice'
                ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Đàm thoại giọng nói
          </button>
        </div>

        {viewMode === 'voice' ? (
          <div className="flex items-center gap-1.5 pr-2 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                voice.state !== 'idle' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-zinc-300">
              {voice.state === 'idle' ? 'Sẵn sàng' : 'Đang xử lý'}
            </span>
          </div>
        ) : (
          <div className="pr-1">
            <EdgeAiIndicator />
          </div>
        )}
      </div>

      {viewMode === 'voice' ? (
        /* Voice Mode Panel — pipeline STT → LLM → TTS: ghi âm → nhận diện → gửi AI → đọc trả lời */
        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Đàm thoại bằng giọng nói
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Nhấn mic để nói, Companion sẽ nghe, trả lời và đọc câu trả lời cho bạn.
            </p>
          </div>

          {!voice.supported && (
            <div className="text-amber-400 theme-light:text-amber-800 text-xs bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 text-center max-w-sm">
              Trình duyệt không hỗ trợ ghi âm. Dùng <strong>Chrome</strong> hoặc{' '}
              <strong>Edge</strong>, hoặc chuyển sang Hội thoại văn bản.
            </div>
          )}

          <CompanionLiveOrb state={orbStateFor(voice.state)} audioLevel={0} className="my-2" />

          <VoiceWaveformVisualizer
            audioLevel={0.5}
            active={voice.state === 'recording'}
            className="w-48"
          />

          <div className="w-full max-w-lg bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
              <span className="text-zinc-400 font-medium">Trạng thái Companion:</span>
              <span className="font-semibold text-accent-400 theme-light:text-accent-800 bg-accent-500/10 px-2 py-0.5 rounded-full">
                {voice.state === 'recording'
                  ? 'Đang nghe bạn...'
                  : voice.state === 'transcribing'
                    ? 'Đang nhận diện giọng nói...'
                    : voice.state === 'thinking'
                      ? 'Đang suy nghĩ...'
                      : voice.state === 'speaking'
                        ? 'Đang trả lời...'
                        : 'Chưa kích hoạt'}
              </span>
            </div>

            <div className="min-h-[60px] text-xs space-y-1.5">
              {lastUserMsg && (
                <div className="text-sky-300 theme-light:text-sky-800">
                  <span className="font-semibold text-zinc-400 mr-1.5">Bạn:</span>
                  {lastUserMsg.text}
                </div>
              )}
              {lastCompanionMsg && (
                <div className="text-zinc-200">
                  <span className="font-semibold text-accent-400 theme-light:text-accent-800 mr-1.5">
                    Đồng Hành:
                  </span>
                  {lastCompanionMsg.text}
                </div>
              )}
              {!lastUserMsg && !lastCompanionMsg && (
                <p className="text-zinc-400 italic text-center py-2">
                  Nhấn nút mic bên dưới để bắt đầu nói...
                </p>
              )}
              {voice.error && (
                <p className="text-rose-400 theme-light:text-rose-800 text-center py-1">
                  {voice.error}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {voice.state === 'idle' ? (
              <button
                onClick={voice.start}
                disabled={!voice.supported}
                className={buttonClass({ size: 'lg' })}
              >
                <Mic className="w-5 h-5" />
                Nhấn để nói
              </button>
            ) : voice.state === 'recording' ? (
              <>
                <button
                  onClick={voice.cancel}
                  className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
                >
                  Huỷ
                </button>
                <button
                  onClick={voice.stop}
                  className={buttonClass({
                    variant: 'danger',
                    className: 'animate-pulse motion-reduce:animate-none',
                  })}
                >
                  <MicOff className="w-4 h-4" />
                  Dừng ghi âm
                </button>
              </>
            ) : (
              <button
                onClick={voice.stopSession}
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
              >
                <Volume2 className="w-4 h-4 text-amber-400 theme-light:text-amber-800" />
                Dừng
              </button>
            )}
          </div>
        </div>
      ) : (
        // Khung chat bị GIỚI HẠN chiều cao — xem giải thích dài ở đầu component. Danh sách tin
        // nhắn (`min-h-0 overflow-y-auto`) cuộn nội bộ TRONG khung này; ô nhập là item cuối
        // cùng của cột flex, luôn nằm đúng trong luồng, không chồng lên nội dung phía trên.
        <div className="flex flex-1 flex-col min-h-0 h-[min(68dvh,640px)]">
          {/* Domain Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none border-b border-zinc-800/60 shrink-0">
            <span className="text-xs text-zinc-400 font-semibold whitespace-nowrap pl-1">
              Lĩnh vực:
            </span>
            {DOMAIN_OPTIONS.map((d) => {
              const Icon = d.icon
              const isSelected = selectedDomain === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDomain(d.id)}
                  className={`tap-44-y flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition duration-200 shrink-0 ${
                    isSelected
                      ? 'bg-accent-500 text-black shadow-md shadow-accent-500/25 ring-1 ring-accent-400/40 scale-105'
                      : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {d.label}
                </button>
              )
            })}
          </div>

          {/* Messages Stream — cuộn NỘI BỘ trong khung `h-[min(68dvh,640px)]` ở trên
              (`min-h-0` bắt buộc để flexbox cho phép item co xuống dưới nội dung tự nhiên
              của nó, nếu không `overflow-y-auto` không bao giờ kích hoạt). */}
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1 pb-4">
            {messages.map((msg) => {
              const isBot = msg.sender === 'companion'
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  {isBot && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent-600 via-accent-500 to-accent-400 flex items-center justify-center shrink-0 shadow-md mt-1 ring-1 ring-accent-400/30">
                      <Bot className="w-4.5 h-4.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[78%] rounded-3xl p-5 shadow-sm transition ${
                      isBot
                        ? 'bg-zinc-900/90 border border-zinc-800/80 text-zinc-200'
                        : 'bg-accent-500 text-[#09090b] shadow-md'
                    }`}
                  >
                    {isBot && (msg.domain || msg.intent) && (
                      <div className="flex flex-wrap items-center gap-2 mb-3 pb-2.5 border-b border-zinc-800/70 text-[0.6875rem]">
                        {msg.domain && (
                          <span className="px-2.5 py-0.5 rounded-full bg-accent-500/15 text-accent-300 theme-light:text-accent-900 border border-accent-500/25 font-semibold">
                            {getDomainLabel(msg.domain)}
                          </span>
                        )}
                        {msg.intent && (
                          <span className="text-zinc-400">
                            Ý định: <code className="text-zinc-300 font-mono">{msg.intent}</code>
                          </span>
                        )}
                        {msg.contextPackage && (
                          <button
                            onClick={() => setActiveContext(msg.contextPackage || null)}
                            className="ml-auto flex items-center gap-1 text-zinc-400 hover:text-accent-300 transition text-[0.6875rem]"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>
                              {msg.contextPackage.tokenUsed}/{msg.contextPackage.tokenBudget} tokens
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* [S03-3] CHỈ lượt của Companion đi qua bộ đọc markdown. Lượt của người
                        dùng giữ nguyên `whitespace-pre-wrap`, có chủ đích: (1) người dùng gõ
                        chữ thường chứ không viết markdown, nên diễn giải dấu sao của họ là
                        SỬA lời họ vừa nói; (2) bong bóng người dùng có nền gradient sáng, các
                        lớp màu `text-zinc-*` của ChatProse không đạt tương phản trên nền đó. */}
                    {isBot ? (
                      <ChatProse text={msg.text} />
                    ) : (
                      <div className="text-sm sm:text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    )}

                    {/* Câu hỏi tick chọn — trả lời bằng cách bấm thay vì gõ tay */}
                    {isBot && msg.interactiveQuestions && msg.interactiveQuestions.length > 0 && (
                      <InteractiveQuestionCard
                        questions={msg.interactiveQuestions}
                        onSubmit={(answerText) => void handleSend(answerText)}
                        disabled={loading}
                      />
                    )}

                    {/* Proposed Actions Section */}
                    {isBot && msg.proposedActions && msg.proposedActions.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-zinc-800/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 mb-1.5">
                          <Shield className="w-4 h-4 text-accent-400 theme-light:text-accent-800" />
                          Tác vụ đề xuất ({msg.proposedActions.length}):
                        </div>

                        {msg.proposedActions.map((action) => {
                          const isActionLoading = actionLoadingMap[action.id] || false
                          const isPending = action.status === 'pending'
                          const isCommitted =
                            action.status === 'committed' || action.status === 'confirmed'
                          const isRejected = action.status === 'rejected'

                          return (
                            <div
                              key={action.id}
                              className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3.5 text-xs flex flex-col gap-2.5 shadow-inner"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-semibold text-zinc-100 text-[0.8125rem]">
                                    {action.action}
                                  </span>
                                  <div className="text-[0.6875rem] text-zinc-400 mt-1">
                                    Lĩnh vực:{' '}
                                    <span className="text-zinc-200 font-medium">
                                      {action.targetDomain}
                                    </span>{' '}
                                    · Mức rủi ro:{' '}
                                    <span
                                      className={`font-semibold ${
                                        action.riskLevel === 'low'
                                          ? 'text-emerald-400 theme-light:text-emerald-800'
                                          : action.riskLevel === 'medium'
                                            ? 'text-amber-400 theme-light:text-amber-800'
                                            : 'text-rose-400 theme-light:text-rose-800'
                                      }`}
                                    >
                                      {action.riskLevel}
                                    </span>
                                  </div>
                                </div>

                                {isCommitted && (
                                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 theme-light:text-emerald-800 font-semibold shrink-0 border border-emerald-500/25">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã thực thi
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 theme-light:text-rose-800 font-semibold shrink-0 border border-rose-500/25">
                                    <XCircle className="w-3.5 h-3.5" /> Đã từ chối
                                  </span>
                                )}
                                {isPending && (
                                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 theme-light:text-amber-800 font-semibold shrink-0 border border-amber-500/25">
                                    <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                                  </span>
                                )}
                              </div>

                              {isPending && (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleConfirmAction(action)}
                                    disabled={isActionLoading}
                                    className={buttonClass({
                                      variant: 'primary',
                                      className: 'flex-1',
                                    })}
                                  >
                                    {isActionLoading ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    Xác nhận
                                  </button>
                                  <button
                                    onClick={() => handleRejectAction(action)}
                                    disabled={isActionLoading}
                                    className={buttonClass({
                                      variant: 'outline',
                                      className: 'flex-1',
                                    })}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Từ chối
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div
                      className={`text-[0.6875rem] text-right mt-2 ${
                        isBot ? 'text-zinc-400' : 'text-[#09090b]/80'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {!isBot && (
                    <div className="w-9 h-9 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <User className="w-4.5 h-4.5 text-zinc-300" />
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-3.5 justify-start animate-fade-in">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent-600 to-accent-400 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl px-5 py-3.5 text-zinc-300 text-sm flex items-center gap-2.5 shadow-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-accent-400 theme-light:text-accent-800" />
                  Đang suy nghĩ & tra cứu ngữ cảnh đa miền...
                </div>
              </div>
            )}

            {/* Gợi ý nhanh — nằm TRONG khung chat, ngay dưới lời chào, thay vì dưới ô nhập
                (audit UI/UX 2026-09-22 P0-2). */}
            {messages.length <= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDomain(prompt.domain)
                      handleSend(prompt.text)
                    }}
                    className="tap-44-y text-left p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-accent-500/50 text-xs font-medium text-zinc-300 hover:text-white transition duration-200 flex items-center justify-between group shadow-sm active:scale-98"
                  >
                    <span>{prompt.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-accent-400 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập — nằm TRONG luồng ở đáy khung chat bị giới hạn chiều cao (không còn
              `sticky`, vì `sticky` chỉ hiện đúng khi nó là con của MỘT container cuộn có chiều
              cao giới hạn; ở đây khung chat chính là container đó, và ô nhập là item cuối cùng
              của cột flex nên tự nhiên nằm ở đáy). */}
          <div className="pt-2 shrink-0 bg-zinc-950 pb-[calc(0.5rem+var(--bnav-h))]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-accent-500/80 transition shadow-lg shadow-black/20"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                // [audit 2026-09-30 minor 14] Bỏ gợi ý Enter dài trên mobile.
                placeholder="Nhắn tin cho Bạn Đồng Hành AI…"
                aria-label="Nhắn tin cho Bạn Đồng Hành AI"
                enterKeyHint="send"
                rows={1}
                className="tap-44-y flex-1 bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 resize-none outline-none max-h-32"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                // Nút chỉ có icon → phải có tên cho trình đọc màn hình (axe: button-name).
                aria-label="Gửi tin nhắn"
                className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
                  input.trim() && !loading
                    ? 'bg-accent-500 hover:bg-accent-400 text-black shadow-md'
                    : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

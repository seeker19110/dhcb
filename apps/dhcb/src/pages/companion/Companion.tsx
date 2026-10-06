import { useCallback, useState, useRef, useEffect, Suspense } from 'react'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { useNavigate } from 'react-router-dom'
import { Layers, X } from 'lucide-react'
import { usePageTitle } from '../../lib/usePageTitle'
import Layout from '../../components/Layout'
import RealtimeTelemetryBar from '../../components/MeshTelemetry/RealtimeTelemetryBar'
import StudioLoadingSkeleton from '../../components/CompanionStudios/StudioLoadingSkeleton'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { fetchProactiveAgentState } from '../../lib/proactiveAgentApi'
import type { ProactiveAgentState } from '@dhcb/core-contracts/proactiveAgent'
import { startRecording, isRecordingSupported, type Recorder } from '../../lib/sttServer'
import { speak, stopSpeaking } from '../../lib/tts'
import { useAuth } from '../../context/useAuth'
import { useToast } from '@core/ToastProvider'
import {
  sendCompanionMessageStream,
  confirmProposedAction,
  rejectProposedAction,
  fetchCompanionHistory,
} from '../../lib/companionApi'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import { EmbodimentMode } from '../../components/Companion3D/AvatarEmbodimentSelector'
import type {
  ChatMessage,
  StudioTab,
  CompanionVoiceState,
} from '../../components/CompanionStudios/studioTypes'
import { DOMAIN_OPTIONS, STUDIO_TABS_CONFIG } from '../../components/CompanionStudios/studioTypes'
import { useDialogBehavior } from '../../components/useDialogBehavior'
import { readDraft, clearDraft } from '../../lib/learningQuestionDraft'
import { PageShell } from '@core/PageShell'

// Nạp lười (Lazy-loading) từng Studio để giảm mạnh Initial Bundle Size
const StudioDialogue = lazyWithRetry(
  () => import('../../components/CompanionStudios/StudioDialogue'),
)
const StudioCognitive = lazyWithRetry(
  () => import('../../components/CompanionStudios/StudioCognitive'),
)
const StudioLabs = lazyWithRetry(() => import('../../components/CompanionStudios/StudioLabs'))
const StudioProactive = lazyWithRetry(
  () => import('../../components/CompanionStudios/StudioProactive'),
)

export default function Companion() {
  usePageTitle('Bạn Đồng Hành | Đồng Hành Cùng Bạn')
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [activeStudio, setActiveStudio] = useState<StudioTab>('dialogue')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'companion',
      text: `Xin chào ${user?.name || 'bạn'}! Tôi là **Bạn Đồng Hành AI**. Tôi đi cùng bạn trong việc học (Tiếng Anh, Lập trình, Toán, Lý, Hoá, Sinh) và việc bạn ghi lại ở Ghi chú. Hôm nay bạn muốn bắt đầu từ đâu?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      domain: 'general',
    },
  ])
  const [input, setInput] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [loading, setLoading] = useState(false)
  const [activeContext, setActiveContext] = useState<ContextPackage | null>(null)
  // Hộp thoại "Minh Bạch Ngữ Cảnh" nội tuyến — bổ sung 6 hành vi a11y bắt buộc.
  const closeContext = useCallback(() => setActiveContext(null), [])
  const contextDialog = useDialogBehavior(closeContext, activeContext !== null)
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<'chat' | 'voice'>('chat')
  // [2026-09-22, audit UI/UX P0-2] Dưới 1024px mặc định "Gọn nhẹ": khung avatar 3D + hai hàng
  // tab đẩy ô nhập tin nhắn xuống y≈1458px trên trang 1613px (đo 390×844) — việc chính của trang
  // nằm ngoài màn hình đầu. Người dùng vẫn bật 3D bằng bộ chọn; desktop giữ 3D mặc định.
  const [embodimentMode, setEmbodimentMode] = useState<EmbodimentMode>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
      ? 'minimal'
      : '3d_cyber_avatar',
  )
  const [proactiveState, setProactiveState] = useState<ProactiveAgentState | null>(null)

  // [S10-1 / AC-3] Cùng khuôn `AbortController` với effect lịch sử ngay dưới: lượt cũ bị huỷ
  // trong cleanup, lượt mới tự gọi lại. KHÔNG dùng ref "đã chạy" để chống StrictMode — chính
  // cách đó từng làm hội thoại cũ không bao giờ hiện (xem ghi chú dài ở effect kế tiếp).
  useEffect(() => {
    const controller = new AbortController()

    fetchProactiveAgentState(undefined, { signal: controller.signal })
      .then((state) => {
        if (controller.signal.aborted) return
        setProactiveState(state)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  // Nạp lại hội thoại đã lưu — mở lại trang là thấy tiếp cuộc trò chuyện trước, không phải bắt
  // đầu lại từ đầu. Lỗi mạng thì im lặng giữ nguyên tin chào (không có gì để khôi phục thì thôi).
  //
  // [Sửa 2026-09-15] Bản cũ dùng `historyLoadedRef` (khoá "đã chạy") CỘNG một cờ `cancelled`
  // trong cleanup. Hai thứ đó triệt tiêu nhau dưới `StrictMode`: lượt MỘT bật khoá rồi gọi
  // fetch, cleanup của nó đặt `cancelled = true`; lượt HAI bị chính cái khoá chặn nên không
  // gọi lại — response về tới nơi thì bị lượt một bỏ đi. Kết quả: hội thoại cũ KHÔNG BAO GIỜ
  // hiện ra trong dev (và trong mọi phép đo chạy bằng `npm run dev`, E2E gồm trong đó).
  //
  // Nay theo đúng khuôn `Subjects.tsx`/`SubjectDetail.tsx`: `AbortController` huỷ lượt cũ
  // trong cleanup, lượt mới tự gọi lại. Việc chống chèn hai lần — lý do khoá cũ tồn tại —
  // chuyển sang chỗ nó thuộc về: lọc theo `id` lúc gộp, nên gộp bao nhiêu lần cũng ra một kết
  // quả (lũy đẳng), không phụ thuộc vào việc đếm đúng số lần effect chạy.
  useEffect(() => {
    const controller = new AbortController()

    fetchCompanionHistory({ signal: controller.signal })
      .then((history) => {
        if (controller.signal.aborted || history.length === 0) return
        setMessages((prev) => {
          const daCo = new Set(prev.map((m) => m.id))
          const them = history
            .map((msg) => ({
              id: `hist-${msg.id}`,
              sender: msg.role,
              text: msg.content,
              timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              ...(msg.domain ? { domain: msg.domain } : {}),
              ...(msg.intent ? { intent: msg.intent } : {}),
            }))
            .filter((m) => !daCo.has(m.id))
          return them.length > 0 ? [...prev, ...them] : prev
        })
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  // ── Chế độ giọng nói: STT → LLM → TTS (KHÔNG "live" — ghi âm xong mới gửi từng bước) ──
  const [voiceState, setVoiceState] = useState<CompanionVoiceState>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const voiceRecorderRef = useRef<Recorder | null>(null)
  const voiceSupported = isRecordingSupported()
  // Ref phản chiếu `loading`: handler async đọc state qua closure có thể bị CŨ (stale) sau await
  // — dùng ref để kiểm chính xác lúc chạy (fix bug kẹt 'transcribing', audit 2026-08-24).
  const loadingRef = useRef(false)
  // Bấm "Dừng" phải hủy cả phần TTS sắp phát khi stream LLM về xong SAU đó (fix bug audit).
  const voiceCancelledRef = useRef(false)
  // Lượt gửi đang bay tới `/api/companion` — giữ để huỷ được khi rời trang (AC-2).
  const sendAbortRef = useRef<AbortController | null>(null)

  // [S10-1 / AC-1] Rời trang = IM LẶNG. Bản cũ chỉ nhả micro + `stopSpeaking()`, nhưng stream
  // LLM vẫn bay tới đích và `onDone` của nó gọi `speak(...)` — AI cất tiếng ở TRANG KẾ, giữa
  // một màn hình chẳng liên quan. Cleanup nay làm đủ ba việc: nhả micro, tắt tiếng đang phát,
  // và chặn mọi lượt phát SẮP tới (cờ huỷ + abort chính lượt gửi).
  useEffect(
    () => () => {
      voiceCancelledRef.current = true
      sendAbortRef.current?.abort()
      sendAbortRef.current = null
      voiceRecorderRef.current?.cancel()
      stopSpeaking()
    },
    [],
  )

  const startVoiceRecording = async () => {
    if (voiceState !== 'idle') return
    setVoiceError(null)
    try {
      voiceRecorderRef.current = await startRecording('vi')
      setVoiceState('recording')
    } catch {
      setVoiceError('Không truy cập được micro. Hãy cho phép quyền micro trong trình duyệt.')
    }
  }

  const stopVoiceRecording = async () => {
    const rec = voiceRecorderRef.current
    if (!rec) return
    voiceRecorderRef.current = null
    setVoiceState('transcribing')
    let text = ''
    try {
      text = await rec.stop()
    } catch (e) {
      setVoiceState('idle')
      setVoiceError(
        e instanceof Error && e.message === 'EMPTY_RECORDING'
          ? 'Không nghe rõ, thử nói lại nhé.'
          : thongDiepLoiThanThien(e, 'Lỗi nhận diện giọng nói'),
      )
      return
    }
    if (!text.trim()) {
      setVoiceState('idle')
      setVoiceError('Không nghe rõ, thử nói lại nhé.')
      return
    }
    if (loadingRef.current) {
      // AI còn đang trả lời câu trước — handleSend sẽ từ chối im lặng, đừng để kẹt 'transcribing'.
      setVoiceState('idle')
      setVoiceError('Bạn Đồng Hành đang trả lời câu trước — chờ xong rồi nói tiếp nhé.')
      return
    }
    await handleSend(text, true)
  }

  const cancelVoiceRecording = () => {
    voiceRecorderRef.current?.cancel()
    voiceRecorderRef.current = null
    setVoiceState('idle')
  }

  // Dừng phiên giọng nói hiện tại (đang ghi âm hoặc AI đang đọc) — về idle ngay.
  const stopVoiceSession = () => {
    voiceRecorderRef.current?.cancel()
    voiceRecorderRef.current = null
    voiceCancelledRef.current = true // stream LLM đang bay về sau cũng KHÔNG được cất tiếng nữa
    stopSpeaking()
    setVoiceState('idle')
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Nhận câu hỏi người dùng đã gõ ở Trang chủ (đặc tả §④ A) ─────────────────────────────
  // Luật cốt lõi: ĐỔ CHỮ VÀO Ô SOẠN, KHÔNG GỬI. Mở trang, tải lại hay bấm Back đều không được
  // phép tự phát sinh một lượt gọi AI tính phí — người dùng phải tự bấm gửi.
  const pendingDraftIdRef = useRef<string | null>(null)
  const draftLoadedRef = useRef(false)
  // Khi ô soạn ĐÃ có chữ: hỏi thay hay giữ, không ghi đè ngầm chữ người dùng đang viết dở.
  const [draftOffer, setDraftOffer] = useState<{ id: string; question: string } | null>(null)

  useEffect(() => {
    // Chỉ chạy một lần cho mỗi tài khoản: StrictMode chạy effect hai lần ở dev.
    if (draftLoadedRef.current || !user) return
    draftLoadedRef.current = true
    const result = readDraft({ kind: 'account', id: user.id })
    if (result.status !== 'ready') return
    const { id, question } = result.draft
    setInput((current) => {
      if (current.trim()) {
        setDraftOffer({ id, question })
        return current
      }
      pendingDraftIdRef.current = id
      return question
    })
  }, [user])

  const acceptDraftOffer = useCallback(() => {
    if (!draftOffer) return
    pendingDraftIdRef.current = draftOffer.id
    setInput(draftOffer.question)
    setDraftOffer(null)
    inputRef.current?.focus()
  }, [draftOffer])

  const dismissDraftOffer = useCallback(() => {
    if (draftOffer) clearDraft(draftOffer.id)
    setDraftOffer(null)
  }, [draftOffer])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Không cuộn khi mới mở trang chỉ có lời chào: cuộn lúc đó đẩy tiêu đề + bộ chọn ra khỏi
    // màn hình (đo scrollY=753 ở 390px) mà chưa có gì mới để xem.
    if (activeStudio === 'dialogue' && (messages.length > 1 || loading)) {
      scrollToBottom()
    }
  }, [messages, loading, activeStudio])

  const handleSend = async (customText?: string, viaVoice = false) => {
    const textToSend = (customText || input).trim()
    if (!textToSend || loadingRef.current) return
    if (viaVoice) {
      voiceCancelledRef.current = false
      setVoiceState('thinking')
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    const botMsgId = `bot-${Date.now()}`
    let streamedText = ''
    let botMeta: { intent?: string; domain?: string; contextPackage?: ContextPackage } = {}
    let botActions: ProposedAction[] | undefined = undefined

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: botMsgId,
        sender: 'companion',
        text: '',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        domain: selectedDomain === 'all' ? undefined : selectedDomain,
      },
    ])
    if (!customText) setInput('')
    loadingRef.current = true
    setLoading(true)

    // Một controller cho ĐÚNG lượt gửi này; cleanup unmount abort nó (AC-2).
    const controller = new AbortController()
    sendAbortRef.current = controller

    try {
      await sendCompanionMessageStream(
        {
          message: textToSend,
          domain: selectedDomain === 'all' ? undefined : selectedDomain,
        },
        {
          onMeta: (meta) => {
            botMeta = {
              intent: meta.intent,
              domain: meta.targetDomain,
              contextPackage: meta.contextPackage,
            }
            setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, ...botMeta } : m)))
          },
          onChunk: (delta) => {
            streamedText += delta
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: streamedText } : m)),
            )
          },
          onActions: (actionsData) => {
            botActions = actionsData.proposedActions
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, proposedActions: botActions } : m)),
            )
          },
          onQuestions: (questions) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, interactiveQuestions: questions } : m)),
            )
          },
          onDone: (finalResp) => {
            // Trang đã rời → không chạm state, không đọc. `companionApi` đã chặn `onDone` sau
            // khi abort, đây là lớp khoá thứ hai (callback có thể về từ lượt đọc ngay trước
            // lúc abort kịp có hiệu lực).
            if (controller.signal.aborted) return
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      text: finalResp.reply,
                      intent: finalResp.intent,
                      domain: finalResp.targetDomain,
                      contextPackage: finalResp.contextPackage,
                      proposedActions: finalResp.proposedActions,
                      interactiveQuestions: finalResp.interactiveQuestions ?? [],
                    }
                  : m,
              ),
            )
            if (viaVoice && voiceCancelledRef.current) {
              // Người dùng đã bấm Dừng trong lúc chờ — không đọc, không đổi trạng thái.
            } else if (viaVoice && finalResp.reply.trim()) {
              setVoiceState('speaking')
              void speak(finalResp.reply, 'vi-VN').finally(() => {
                setVoiceState((s) => (s === 'speaking' ? 'idle' : s))
              })
            } else if (viaVoice) {
              setVoiceState('idle')
            }
          },
        },
        { signal: controller.signal },
      )
      // Gửi trót lọt thì nháp hết vai trò. `clearDraft(id)` tự bỏ qua nếu trong lúc chờ đã có
      // nháp MỚI — không xoá nhầm câu hỏi người dùng vừa gõ tiếp.
      if (pendingDraftIdRef.current) {
        clearDraft(pendingDraftIdRef.current)
        pendingDraftIdRef.current = null
      }
    } catch (err: unknown) {
      // Người dùng chủ động rời trang không phải là LỖI: im lặng, không toast, không đổi
      // state của một trang đã biến mất. (Lượt AI đã trừ ở server thì KHÔNG hoàn — server
      // không biết client rời; đúng luật hiện hành, xem đặc tả S10 AC-2.)
      if (err instanceof Error && err.name === 'AbortError') return
      // Gửi lỗi thì GIỮ nháp: người dùng còn thử lại được, không mất câu hỏi.
      const message = thongDiepLoiThanThien(err, 'Lỗi khi gửi yêu cầu tới Companion')
      toast.error(message)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId && !m.text
            ? { ...m, text: 'Đã xảy ra lỗi khi kết nối với Bạn Đồng Hành AI.' }
            : m,
        ),
      )
      if (viaVoice) setVoiceState('idle')
    } finally {
      loadingRef.current = false
      if (sendAbortRef.current === controller) sendAbortRef.current = null
      // Trang đã rời thì không setState nữa (lượt huỷ đã `return` ở nhánh catch, nhưng
      // `finally` vẫn chạy).
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  const handleConfirmAction = async (action: ProposedAction) => {
    setActionLoadingMap((prev) => ({ ...prev, [action.id]: true }))
    const actionVersion = (action as { version?: number }).version ?? action.schemaVersion ?? 1
    try {
      const res = await confirmProposedAction(action.id, actionVersion)
      toast.success(`Đã xác nhận tác vụ: ${action.action}`)
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.proposedActions) return msg
          return {
            ...msg,
            proposedActions: msg.proposedActions.map((a) => (a.id === action.id ? res.action : a)),
          }
        }),
      )
    } catch (err: unknown) {
      const message = thongDiepLoiThanThien(err, 'Lỗi khi xác nhận tác vụ')
      toast.error(message)
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [action.id]: false }))
    }
  }

  const handleRejectAction = async (action: ProposedAction) => {
    setActionLoadingMap((prev) => ({ ...prev, [action.id]: true }))
    const actionVersion = (action as { version?: number }).version ?? action.schemaVersion ?? 1
    try {
      const res = await rejectProposedAction(
        action.id,
        actionVersion,
        'Người dùng từ chối trên giao diện',
      )
      toast.info(`Đã từ chối tác vụ: ${action.action}`)
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.proposedActions) return msg
          return {
            ...msg,
            proposedActions: msg.proposedActions.map((a) => (a.id === action.id ? res.action : a)),
          }
        }),
      )
    } catch (err: unknown) {
      const message = thongDiepLoiThanThien(err, 'Lỗi khi từ chối tác vụ')
      toast.error(message)
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [action.id]: false }))
    }
  }

  const getDomainLabel = (domainId?: string) => {
    // 'general' không nằm trong DOMAIN_OPTIONS (đó là các lĩnh vực cụ thể) — hiện nhãn tiếng
    // Việt thay vì để lọt chữ tiếng Anh "general" ra bong bóng chat (audit UI/UX P1-1).
    if (!domainId || domainId === 'general') return 'Chung'
    const found = DOMAIN_OPTIONS.find((d) => d.id === domainId)
    return found ? found.label : domainId
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      <Layout back={true} title="Bạn Đồng Hành" />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang danh sách/khu trò chuyện → width="standard";
          giữ nguyên bố cục flex cột full-height qua className.
          `!py-4` ép ĐÚNG khoảng đệm cũ: đây là khung chiều-cao-đầy (`flex flex-1 flex-col`), nên
          đệm dưới lớn hơn của PageShell (`pb-[calc(2rem+var(--bnav-h))]`) đẩy nội dung chồng lên
          hàng nút Studio — đo được là 3 vi phạm `target-size` ở cổng a11y (nút bị che một phần). */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="!py-4 flex flex-1 flex-col">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Bạn Đồng Hành
        </h1>

        <RealtimeTelemetryBar />

        {/* Studio Focus Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl mb-4 backdrop-blur-md">
          {STUDIO_TABS_CONFIG.map((tab) => {
            const Icon = tab.icon
            const isCurrent = activeStudio === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStudio(tab.id)}
                // [S06c] Studio đang mở phải đọc được bằng trình đọc màn hình, không chỉ bằng màu.
                aria-pressed={isCurrent}
                className={`tap-44-y flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                  isCurrent
                    ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20 scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Câu hỏi mang từ Trang chủ sang, trong khi ô soạn đã có chữ dở — để người dùng chọn,
            không ghi đè ngầm (đặc tả §③). */}
        {draftOffer && (
          <div className="mb-3 rounded-2xl border border-accent-500/30 bg-accent-500/10 p-3 text-xs text-zinc-200">
            <p className="mb-1 font-semibold text-accent-300">Câu hỏi bạn gõ ở Trang chủ</p>
            <p className="mb-2 whitespace-pre-wrap break-words">{draftOffer.question}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={dismissDraftOffer}
                className="tap-44 rounded-xl px-3 py-2 font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                Giữ chữ đang viết
              </button>
              <button
                type="button"
                onClick={acceptDraftOffer}
                className="tap-44 rounded-xl bg-accent-500 px-4 py-2 font-semibold text-[#09090b] transition hover:bg-accent-400"
              >
                Thay bằng câu hỏi này
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Studio Loading with Suspense */}
        <Suspense fallback={<StudioLoadingSkeleton />}>
          {activeStudio === 'dialogue' && (
            <StudioDialogue
              loading={loading}
              messages={messages}
              input={input}
              setInput={setInput}
              selectedDomain={selectedDomain}
              setSelectedDomain={setSelectedDomain}
              viewMode={viewMode}
              setViewMode={setViewMode}
              embodimentMode={embodimentMode}
              setEmbodimentMode={setEmbodimentMode}
              voice={{
                state: voiceState,
                error: voiceError,
                supported: voiceSupported,
                start: startVoiceRecording,
                stop: stopVoiceRecording,
                cancel: cancelVoiceRecording,
                stopSession: stopVoiceSession,
              }}
              handleSend={handleSend}
              handleConfirmAction={handleConfirmAction}
              handleRejectAction={handleRejectAction}
              actionLoadingMap={actionLoadingMap}
              setActiveContext={setActiveContext}
              getDomainLabel={getDomainLabel}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
            />
          )}

          {activeStudio === 'cognitive' && <StudioCognitive />}

          {activeStudio === 'labs' && <StudioLabs />}

          {activeStudio === 'proactive' && (
            <StudioProactive proactiveState={proactiveState} navigate={navigate} />
          )}
        </Suspense>
      </PageShell>

      {/* Context Transparency Inspector Modal */}
      {activeContext && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          {...contextDialog.backdropProps}
        >
          <div
            {...contextDialog.dialogProps}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col max-h-[85dvh] animate-scale-in focus:outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent-400 theme-light:text-accent-800" />
                <h3 id={contextDialog.titleId} className="font-semibold text-white text-base">
                  Minh bạch ngữ cảnh
                </h3>
              </div>
              <button
                type="button"
                onClick={closeContext}
                aria-label="Đóng"
                className="tap-44 shrink-0 w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <div>
                  <div className="text-zinc-400">Yêu cầu ID</div>
                  <div className="font-mono text-[11px] text-zinc-300 mt-0.5 truncate">
                    {activeContext.requestId}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-400">Token sử dụng</div>
                  <div className="font-medium text-accent-300 theme-light:text-accent-800 mt-0.5">
                    {activeContext.tokenUsed} / {activeContext.tokenBudget} tokens
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-zinc-300 mb-2">
                  Các dữ liệu cá nhân trích xuất ({activeContext.items.length}):
                </h4>
                {activeContext.items.length === 0 ? (
                  <p className="text-zinc-400 italic">
                    Không có dữ liệu nhạy cảm hoặc cá nhân nào được nạp vào lượt này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeContext.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-accent-300 theme-light:text-accent-800">
                            {item.sourceType}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {item.sensitivity}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">{item.content}</p>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          Nguồn: {item.provenance}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setActiveContext(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

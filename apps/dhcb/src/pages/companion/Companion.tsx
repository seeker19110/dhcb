import { voiceMetrics } from '../../lib/voiceMetricsLocal'
import type { TurnHandle } from '../../lib/voiceMetrics'
import type { Reason } from '@dhcb/core-contracts/voiceMetrics'
import { useCallback, useState, useRef, useEffect, useLayoutEffect, useMemo, Suspense } from 'react'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layers, X } from 'lucide-react'
import { usePageTitle } from '../../lib/usePageTitle'
import Layout from '../../components/Layout'
import RealtimeTelemetryBar from '../../components/MeshTelemetry/RealtimeTelemetryBar'
import StudioLoadingSkeleton from '../../components/CompanionStudios/StudioLoadingSkeleton'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { startRecording, isRecordingSupported, type Recorder } from '../../lib/sttServer'
import { speak, stopSpeaking } from '../../lib/tts'
import { useAuth } from '../../context/useAuth'
import { useToast } from '@core/ToastProvider'
import { getStoredToken } from '@core/authHeader'
import {
  sendCompanionMessageStream,
  confirmProposedAction,
  rejectProposedAction,
  fetchCompanionHistory,
} from '../../lib/companionApi'
import {
  fetchCompanionMemorySettings,
  updateCompanionMemorySettings,
} from '../../lib/companionMemoryApi'
import type { CompanionMemorySettings } from '@dhcb/core-contracts/consentGrant'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import { EmbodimentMode } from '../../components/Companion3D/AvatarEmbodimentSelector'
import type {
  ChatMessage,
  StudioTab,
  CompanionVoiceState,
} from '../../components/CompanionStudios/studioTypes'
import {
  DOMAIN_OPTIONS,
  STUDIO_TABS_CONFIG,
  isStudioTab,
} from '../../components/CompanionStudios/studioTypes'
import { useDialogBehavior } from '../../components/useDialogBehavior'
import { readDraft, clearDraft } from '../../lib/learningQuestionDraft'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import HistoryLoadNotice from '../../components/CompanionStudios/HistoryLoadNotice'
import CompanionBreakReminder from '../../components/CompanionStudios/CompanionBreakReminder'
import { useOnboarding } from '../../lib/onboarding'
import { useCompanionBreakReminder } from '../../lib/useCompanionBreakReminder'

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

interface CompanionScopeSnapshot {
  readonly userId: string | null
  readonly sessionMarker: string | null
  readonly domain: string
  readonly ephemeral: boolean
  readonly viewMode: 'chat' | 'voice'
  readonly studio: StudioTab
}

function companionScopeKey(scope: CompanionScopeSnapshot): string {
  return JSON.stringify([
    scope.userId,
    scope.sessionMarker,
    scope.domain,
    scope.ephemeral,
    scope.viewMode,
    scope.studio,
  ])
}

interface CompanionScope {
  readonly key: string
  readonly snapshot: CompanionScopeSnapshot
}

interface QuickPromptIntent {
  readonly generation: number
  readonly target: CompanionScopeSnapshot
  readonly targetKey: string
  readonly text: string
}

interface CompanionOwner {
  readonly metrics: TurnHandle
  readonly scope: CompanionScope
  readonly controller: AbortController
}

const EPHEMERAL_STORAGE_KEY = 'dhcb.companion.ephemeral'

export default function Companion() {
  const { user } = useAuth()
  const sessionMarker = getStoredToken()
  // Tài khoản/phiên mới nhận toàn bộ state mới, gồm lịch sử, consent UI và đề xuất đã render.
  return <CompanionSession key={JSON.stringify([user?.id ?? null, sessionMarker])} />
}

function CompanionSession() {
  usePageTitle('Bạn Đồng Hành | Đồng Hành Cùng Bạn')
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  // Nhắc nghỉ khi trẻ trò chuyện lâu (GĐ4b, changelog 0631) — chỉ nhóm nhi_dong/thieu_nien.
  const onboarding = useOnboarding(user?.id)
  const breakReminder = useCompanionBreakReminder(user?.id, onboarding?.ageGroup)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeStudio, setActiveStudio] = useState<StudioTab>('dialogue')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'companion',
      text: `Xin chào ${user?.name || 'bạn'}! Tôi là **Bạn Đồng Hành AI**. Tôi đi cùng bạn trong việc học (Tiếng Anh, Lập trình, Toán, Lý, Hoá, Sinh) và việc bạn ghi lại ở Ghi chú. Hôm nay bạn muốn bắt đầu từ đâu?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      domain: 'general',
    },
  ])
  const [input, setInput] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [loading, setLoading] = useState(false)
  // Chế độ tác tử (GĐ3): nhãn công cụ đang chạy ở server, vd "Đang xem tiến độ học…".
  const [toolStatus, setToolStatus] = useState<string | null>(null)
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
  // Tải lịch sử hội thoại hỏng → dòng báo nhẹ; `historyAttempt` tăng = tải lại.
  const [historyFailed, setHistoryFailed] = useState(false)
  const [historyAttempt, setHistoryAttempt] = useState(0)
  // [GĐ2a] Ký ức: hai công tắc đọc từ server (null = chưa tải/lỗi → thẻ chỉ hiện phiên tạm);
  // "phiên không lưu" giữ trong sessionStorage — hết tab là hết, không dính sang lần sau.
  const [memorySettings, setMemorySettings] = useState<CompanionMemorySettings | null>(null)
  const [enablingMemory, setEnablingMemory] = useState(false)
  const [ephemeral, setEphemeralState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(EPHEMERAL_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const setEphemeral = useCallback((next: boolean) => {
    setEphemeralState(next)
    try {
      if (next) sessionStorage.setItem(EPHEMERAL_STORAGE_KEY, '1')
      else sessionStorage.removeItem(EPHEMERAL_STORAGE_KEY)
    } catch {
      // sessionStorage bị chặn (chế độ riêng tư) → chỉ giữ trong state
    }
  }, [])
  const enableMemory = useCallback(async () => {
    setEnablingMemory(true)
    try {
      setMemorySettings(
        await updateCompanionMemorySettings({
          rememberMemories: true,
          useHistory: true,
        }),
      )
    } catch {
      // Thẻ vẫn còn đó để bấm lại; không có toast ở đây vì trang chưa dùng ToastProvider.
    } finally {
      setEnablingMemory(false)
    }
  }, [])
  useEffect(() => {
    let mounted = true
    fetchCompanionMemorySettings()
      .then((s) => {
        if (mounted) setMemorySettings(s)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  // Liên kết sâu `?studio=<id>` (GĐ4a, changelog 0629): thẻ "Nhìn lại tuần học" dẫn tới studio
  // "Ghi nhớ" có nhật ký phản tỉnh. Theo dõi GIÁ TRỊ tham số (không chỉ lúc mount) vì thẻ nằm ngay
  // trên trang này — bấm thẻ chỉ đổi query string, trang không mount lại. Giá trị lạ bị bỏ qua.
  // Áp xong thì gỡ tham số (replace) để bấm lại cùng thẻ lần sau vẫn có tác dụng.
  // Đổi studio NGAY lúc render khi tham số đổi (khuôn "điều chỉnh state khi prop đổi" của React),
  // không setState trong effect; effect chỉ dọn URL (state của router, ngoài React).
  const studioParam = searchParams.get('studio')
  const [appliedStudioParam, setAppliedStudioParam] = useState<string | null>(null)
  if (studioParam !== appliedStudioParam) {
    setAppliedStudioParam(studioParam)
    if (studioParam && isStudioTab(studioParam)) setActiveStudio(studioParam)
  }
  useEffect(() => {
    if (!studioParam) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('studio')
        return next
      },
      { replace: true },
    )
  }, [studioParam, setSearchParams])

  // Nạp lại hội thoại đã lưu — mở lại trang là thấy tiếp cuộc trò chuyện trước, không phải bắt
  // đầu lại từ đầu.
  //
  // [Quyết định 2026-10-08, chủ dự án duyệt — thay cho "im lặng khi lỗi" cũ] Tải lịch sử hỏng thì
  // báo NHẸ một dòng + nút "Thử lại" (`historyFailed`), KHÔNG chặn: tin chào và ô nhập vẫn dùng
  // được, trò chuyện mới bình thường. Im lặng hoàn toàn khiến người dùng tưởng cuộc trò chuyện
  // trước đã mất (CLAUDE.md mục 4.3), còn khối lỗi to thì quá nặng cho dữ liệu phụ.
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
        if (controller.signal.aborted) return
        setHistoryFailed(false)
        if (history.length === 0) return
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
      .catch(() => {
        // Huỷ do rời trang/chạy lại effect không phải lỗi tải.
        if (!controller.signal.aborted) setHistoryFailed(true)
      })

    return () => controller.abort()
  }, [historyAttempt])

  // ── Chế độ giọng nói: STT → LLM → TTS (KHÔNG "live" — ghi âm xong mới gửi từng bước) ──
  const [voiceState, setVoiceState] = useState<CompanionVoiceState>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const voiceSupported = isRecordingSupported()
  const loadingRef = useRef(false)
  const scopeRef = useRef<CompanionScope | null>(null)
  const voiceOwnerRef = useRef<CompanionOwner | null>(null)
  const voiceRecorderRef = useRef<{
    readonly owner: CompanionOwner
    readonly recorder: Recorder
  } | null>(null)
  const voiceStoppingRef = useRef<CompanionOwner | null>(null)
  const sendOwnerRef = useRef<CompanionOwner | null>(null)
  const sessionMarker = getStoredToken()
  const scopeSnapshot = useMemo<CompanionScopeSnapshot>(
    () => ({
      userId: user?.id ?? null,
      sessionMarker,
      domain: selectedDomain,
      ephemeral,
      viewMode,
      studio: activeStudio,
    }),
    [user?.id, sessionMarker, selectedDomain, ephemeral, viewMode, activeStudio],
  )
  const scopeKey = companionScopeKey(scopeSnapshot)
  const quickGenerationRef = useRef(0)
  const pendingQuickRef = useRef<QuickPromptIntent | null>(null)
  const [quickIntent, setQuickIntent] = useState<QuickPromptIntent | null>(null)
  const committedSendRef = useRef<((text: string) => Promise<void>) | null>(null)
  const [observedScope, setObservedScope] = useState(scopeKey)
  // Cùng khuôn điều chỉnh state khi scope đổi như deep link studio phía trên; cleanup chỉ dọn owner.
  if (observedScope !== scopeKey) {
    setObservedScope(scopeKey)
    setVoiceState('idle')
    setVoiceError(null)
    setLoading(false)
    setToolStatus(null)
  }

  const releaseVoiceOwner = useCallback((reason: Reason = 'superseded') => {
    const owner = voiceOwnerRef.current
    const capture = voiceRecorderRef.current
    // Vô hiệu identity trước abort/cancel: callback đồng bộ hoặc Promise muộn không hồi sinh lượt cũ.
    voiceOwnerRef.current = null
    voiceRecorderRef.current = null
    voiceStoppingRef.current = null
    owner?.metrics.end('cancelled', reason)
    owner?.controller.abort()
    capture?.recorder.cancel()
  }, [])
  const releaseSendOwner = useCallback(() => {
    const owner = sendOwnerRef.current
    sendOwnerRef.current = null
    loadingRef.current = false
    owner?.metrics.end('cancelled', 'unknown')
    owner?.controller.abort()
  }, [])

  useLayoutEffect(
    () => () => {
      quickGenerationRef.current += 1
      pendingQuickRef.current = null
      committedSendRef.current = null
    },
    [],
  )

  useLayoutEffect(() => {
    // StrictMode setup sau cleanup nhận identity mới, không tái dùng controller đã abort.
    const scope: CompanionScope = { key: scopeKey, snapshot: scopeSnapshot }
    scopeRef.current = scope
    return () => {
      if (scopeRef.current === scope) scopeRef.current = null
      releaseVoiceOwner('unknown')
      releaseSendOwner()
      stopSpeaking('unknown')
    }
  }, [scopeKey, scopeSnapshot, releaseVoiceOwner, releaseSendOwner])

  const isVoiceCurrent = (owner: CompanionOwner) =>
    voiceOwnerRef.current === owner &&
    scopeRef.current === owner.scope &&
    getStoredToken() === owner.scope.snapshot.sessionMarker &&
    !owner.controller.signal.aborted
  const isSendCurrent = (owner: CompanionOwner) =>
    sendOwnerRef.current === owner &&
    scopeRef.current === owner.scope &&
    getStoredToken() === owner.scope.snapshot.sessionMarker &&
    !owner.controller.signal.aborted
  const claimVoiceOwner = (input: 'microphone' | 'typed' = 'microphone'): CompanionOwner | null => {
    const scope = scopeRef.current
    if (!scope || scope.key !== scopeKey || getStoredToken() !== scope.snapshot.sessionMarker)
      return null
    const owner: CompanionOwner = {
      scope,
      controller: new AbortController(),
      metrics: voiceMetrics.startTurn({
        mode: 'companion',
        direction: 'vi_only',
        input,
      }),
    }
    voiceOwnerRef.current = owner
    return owner
  }
  const discardStaleVoiceOwner = (owner: CompanionOwner) => {
    if (isVoiceCurrent(owner)) return false
    if (voiceOwnerRef.current === owner) {
      releaseVoiceOwner('unknown')
      stopSpeaking('unknown')
      setVoiceState('idle')
    }
    return true
  }
  const finishVoiceOwner = (owner: CompanionOwner) => {
    if (discardStaleVoiceOwner(owner)) return
    voiceOwnerRef.current = null
    owner.metrics.end('ok')
    owner.controller.abort()
    setVoiceState('idle')
  }

  const startVoiceRecording = async () => {
    if (voiceState !== 'idle' || voiceOwnerRef.current) return
    const owner = claimVoiceOwner()
    if (!owner) return
    setVoiceError(null)
    try {
      const recorder = await startRecording('vi', {
        signal: owner.controller.signal,
        isCurrent: () => isVoiceCurrent(owner),
        metrics: owner.metrics,
      })
      if (discardStaleVoiceOwner(owner)) {
        recorder.cancel()
        return
      }
      voiceRecorderRef.current = { owner, recorder }
      setVoiceState('recording')
    } catch {
      if (discardStaleVoiceOwner(owner)) return
      owner.metrics.end('error', 'unknown')
      finishVoiceOwner(owner)
      setVoiceError('Không truy cập được micro. Hãy cho phép quyền micro trong trình duyệt.')
    }
  }

  const stopVoiceRecording = async () => {
    const capture = voiceRecorderRef.current
    if (
      !capture ||
      discardStaleVoiceOwner(capture.owner) ||
      voiceStoppingRef.current === capture.owner
    )
      return
    const owner = capture.owner
    voiceStoppingRef.current = owner
    setVoiceState('transcribing')
    let text = ''
    try {
      // Giữ ref đến khi stop terminal để cancel còn chặn được encode/auth trước fetch.
      text = await capture.recorder.stop()
    } catch (e) {
      if (discardStaleVoiceOwner(owner)) return
      owner.metrics.end(
        'error',
        e instanceof Error && e.message === 'EMPTY_RECORDING' ? 'empty' : 'unknown',
      )
      finishVoiceOwner(owner)
      setVoiceError(
        e instanceof Error && e.message === 'EMPTY_RECORDING'
          ? 'Không nghe rõ, thử nói lại nhé.'
          : thongDiepLoiThanThien(e, 'Lỗi nhận diện giọng nói'),
      )
      return
    } finally {
      if (voiceRecorderRef.current === capture) voiceRecorderRef.current = null
      if (voiceStoppingRef.current === owner) voiceStoppingRef.current = null
    }
    if (discardStaleVoiceOwner(owner)) return
    if (!text.trim()) {
      owner.metrics.end('error', 'empty')
      finishVoiceOwner(owner)
      setVoiceError('Không nghe rõ, thử nói lại nhé.')
      return
    }
    if (loadingRef.current) {
      owner.metrics.end('cancelled', 'unknown')
      finishVoiceOwner(owner)
      setVoiceError('Bạn Đồng Hành đang trả lời câu trước — chờ xong rồi nói tiếp nhé.')
      return
    }
    await handleSend(text, true, owner)
  }

  const cancelVoiceRecording = () => {
    releaseVoiceOwner('user')
    stopSpeaking('user')
    setVoiceState('idle')
  }

  const stopVoiceSession = () => {
    releaseVoiceOwner('user')
    stopSpeaking('user')
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
  const [draftOffer, setDraftOffer] = useState<{
    id: string
    question: string
  } | null>(null)

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

  const handleSend = async (
    customText?: string,
    viaVoice = false,
    captureOwner?: CompanionOwner,
  ) => {
    const textToSend = (customText || input).trim()
    const scope = scopeRef.current
    if (
      !textToSend ||
      loadingRef.current ||
      !scope ||
      scope.key !== scopeKey ||
      getStoredToken() !== scope.snapshot.sessionMarker
    )
      return
    if (captureOwner && discardStaleVoiceOwner(captureOwner)) return
    // Lối gọi hai tham số cũ vẫn hợp lệ; chỉ pipeline STT truyền owner đã claim ở tham số ba.
    if (!captureOwner && voiceOwnerRef.current) {
      releaseVoiceOwner()
      stopSpeaking('superseded')
    }
    const voiceOwner = viaVoice ? (captureOwner ?? claimVoiceOwner('typed')) : null
    if (viaVoice && !voiceOwner) return
    breakReminder.recordTurn()
    if (viaVoice) setVoiceState('thinking')

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    const botMsgId = `bot-${Date.now()}`
    let streamedText = ''
    let botMeta: {
      intent?: string
      domain?: string
      contextPackage?: ContextPackage
    } = {}
    let botActions: ProposedAction[] | undefined = undefined

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: botMsgId,
        sender: 'companion',
        text: '',
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        domain: selectedDomain === 'all' ? undefined : selectedDomain,
      },
    ])
    if (!customText) setInput('')
    loadingRef.current = true
    setLoading(true)

    const owner: CompanionOwner = {
      scope,
      controller: new AbortController(),
      metrics:
        voiceOwner?.metrics ??
        voiceMetrics.startTurn({ mode: 'companion', direction: 'vi_only', input: 'typed' }),
    }
    sendOwnerRef.current = owner
    let doneHandled = false

    try {
      if (!isSendCurrent(owner)) return
      await sendCompanionMessageStream(
        {
          message: textToSend,
          domain: selectedDomain === 'all' ? undefined : selectedDomain,
          ...(ephemeral ? { ephemeral: true } : {}),
        },
        {
          onMeta: (meta) => {
            if (!isSendCurrent(owner)) return
            botMeta = {
              intent: meta.intent,
              domain: meta.targetDomain,
              contextPackage: meta.contextPackage,
            }
            setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, ...botMeta } : m)))
          },
          onTool: (label) => {
            if (isSendCurrent(owner)) setToolStatus(label)
          },
          onChunk: (delta) => {
            if (!isSendCurrent(owner)) return
            // Đã có chữ ⇒ bước tra cứu đã xong, bỏ nhãn công cụ.
            setToolStatus(null)
            streamedText += delta
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: streamedText } : m)),
            )
          },
          onActions: (actionsData) => {
            if (!isSendCurrent(owner)) return
            botActions = actionsData.proposedActions
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, proposedActions: botActions } : m)),
            )
          },
          onQuestions: (questions) => {
            if (!isSendCurrent(owner)) return
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, interactiveQuestions: questions } : m)),
            )
          },
          onSafety: (safety) => {
            if (!isSendCurrent(owner)) return
            setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, safety } : m)))
          },
          onDone: (finalResp) => {
            // Trang đã rời → không chạm state, không đọc. `companionApi` đã chặn `onDone` sau
            // khi abort, đây là lớp khoá thứ hai (callback có thể về từ lượt đọc ngay trước
            // lúc abort kịp có hiệu lực).
            if (!isSendCurrent(owner) || doneHandled) return
            doneHandled = true
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
                      ...(finalResp.safety ? { safety: finalResp.safety } : {}),
                    }
                  : m,
              ),
            )
            if (voiceOwner && isVoiceCurrent(voiceOwner)) {
              if (finalResp.reply.trim()) {
                setVoiceState('speaking')
                const finishSpeech = () => finishVoiceOwner(voiceOwner)
                // Lỗi TTS vẫn kết thúc owner hiện tại; không tạo fallback/request mới ở trang.
                void speak(finalResp.reply, 'vi-VN', undefined, undefined, undefined, {
                  turn: voiceOwner.metrics,
                  segment: 'speech',
                }).then(finishSpeech, () => {
                  voiceOwner.metrics.end('error', 'unknown')
                  finishSpeech()
                })
              } else {
                finishVoiceOwner(voiceOwner)
              }
            }
          },
        },
        {
          signal: owner.controller.signal,
          metrics: owner.metrics,
          isCurrent: () => isSendCurrent(owner) && (!voiceOwner || isVoiceCurrent(voiceOwner)),
        },
      )
      // Gửi trót lọt thì nháp hết vai trò. `clearDraft(id)` tự bỏ qua nếu trong lúc chờ đã có
      // nháp MỚI — không xoá nhầm câu hỏi người dùng vừa gõ tiếp.
      if (isSendCurrent(owner) && pendingDraftIdRef.current) {
        clearDraft(pendingDraftIdRef.current)
        pendingDraftIdRef.current = null
      }
    } catch (err: unknown) {
      owner.metrics.end(
        err instanceof Error && err.name === 'AbortError' ? 'cancelled' : 'error',
        'unknown',
      )
      // Người dùng chủ động rời trang không phải là LỖI: im lặng, không toast, không đổi
      // state của một trang đã biến mất. (Lượt AI đã trừ ở server thì KHÔNG hoàn — server
      // không biết client rời; đúng luật hiện hành, xem đặc tả S10 AC-2.)
      if (!isSendCurrent(owner) || (err instanceof Error && err.name === 'AbortError')) return
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
      if (voiceOwner) finishVoiceOwner(voiceOwner)
    } finally {
      if (!voiceOwner) owner.metrics.end('ok')
      // Finalizer cũ không được mở khóa hoặc xóa nhãn của request thuộc scope/owner mới.
      if (sendOwnerRef.current === owner) {
        sendOwnerRef.current = null
        loadingRef.current = false
        if (scopeRef.current === owner.scope && !owner.controller.signal.aborted) {
          setLoading(false)
          setToolStatus(null)
        }
      }
    }
  }

  const handleQuickPrompt = async (domain: string, text: string) => {
    const scope = scopeRef.current
    if (
      loadingRef.current ||
      !scope ||
      scope.key !== scopeKey ||
      !text.trim() ||
      getStoredToken() !== scope.snapshot.sessionMarker
    )
      return
    const target: CompanionScopeSnapshot = { ...scope.snapshot, domain }
    const intent: QuickPromptIntent = {
      generation: ++quickGenerationRef.current,
      target,
      targetKey: companionScopeKey(target),
      text,
    }
    pendingQuickRef.current = intent
    setQuickIntent(intent)
    setSelectedDomain(domain)
  }

  useLayoutEffect(() => {
    committedSendRef.current = handleSend
  })

  useLayoutEffect(() => {
    if (!quickIntent) return
    const scope = scopeRef.current
    if (
      pendingQuickRef.current !== quickIntent ||
      quickIntent.generation !== quickGenerationRef.current ||
      !scope ||
      scope.key !== scopeKey ||
      scope.key !== quickIntent.targetKey
    ) {
      if (pendingQuickRef.current === quickIntent) {
        pendingQuickRef.current = null
        quickGenerationRef.current += 1
      }
      return
    }
    // Chỉ intent người dùng đã chọn mới đợi commit đích; cleanup scope/route vẫn hủy ngay.
    queueMicrotask(() => {
      if (
        pendingQuickRef.current !== quickIntent ||
        quickIntent.generation !== quickGenerationRef.current ||
        scopeRef.current !== scope
      )
        return
      pendingQuickRef.current = null
      void committedSendRef.current?.(quickIntent.text)
    })
  }, [quickIntent, scopeKey])

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
                className={`tap-44-y flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-200 relative ${
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
                className={buttonClass({ variant: 'outline' })}
              >
                Giữ chữ đang viết
              </button>
              <button type="button" onClick={acceptDraftOffer} className={buttonClass()}>
                Thay bằng câu hỏi này
              </button>
            </div>
          </div>
        )}

        {breakReminder.remindFor && (
          <CompanionBreakReminder
            ageGroup={breakReminder.remindFor}
            minutes={breakReminder.minutes}
            onSnooze={breakReminder.snoozeReminder}
            onBreak={() => {
              breakReminder.endSession()
              navigate('/')
            }}
          />
        )}

        {activeStudio === 'dialogue' && historyFailed && (
          <HistoryLoadNotice
            onRetry={() => {
              setHistoryFailed(false)
              setHistoryAttempt((n) => n + 1)
            }}
          />
        )}

        {/* Dynamic Studio Loading with Suspense */}
        <Suspense fallback={<StudioLoadingSkeleton />}>
          {activeStudio === 'dialogue' && (
            <StudioDialogue
              loading={loading}
              toolStatus={toolStatus}
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
              onQuickPrompt={handleQuickPrompt}
              handleConfirmAction={handleConfirmAction}
              handleRejectAction={handleRejectAction}
              actionLoadingMap={actionLoadingMap}
              setActiveContext={setActiveContext}
              getDomainLabel={getDomainLabel}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              memory={{
                settings: memorySettings,
                ephemeral,
                onEphemeralChange: setEphemeral,
                onEnableMemory: enableMemory,
                enabling: enablingMemory,
              }}
            />
          )}

          {activeStudio === 'cognitive' && <StudioCognitive />}

          {activeStudio === 'labs' && <StudioLabs />}

          {activeStudio === 'proactive' && <StudioProactive navigate={navigate} />}
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
                  <div className="font-mono text-[0.6875rem] text-zinc-300 mt-0.5 truncate">
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
                          <span className="text-[0.6875rem] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {item.sensitivity}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-[0.6875rem] leading-relaxed">
                          {item.content}
                        </p>
                        <div className="text-[0.6875rem] text-zinc-400 mt-1">
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
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
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

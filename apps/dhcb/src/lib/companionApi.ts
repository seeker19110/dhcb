// apps/dhcb/src/lib/companionApi.ts — Client API wrapper for Companion Runtime and Proposed Actions
import { getAuthHeader } from '@core/authHeader'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import type { InteractiveQuestion } from '@dhcb/core-contracts/interactiveQuestion'
import type { CompanionSafetyNotice } from '@dhcb/core-contracts/companionSafety'

export interface CompanionExecutionSummary {
  plannedSteps: number
  executedSteps: number
  pendingConfirmationSteps: number
  rejectedSteps: number
}

export interface CompanionResponse {
  reply: string
  intent: string
  targetDomain: string
  contextPackage: ContextPackage
  proposedActions: ProposedAction[]
  executionSummary: CompanionExecutionSummary
  // Câu hỏi tick chọn kèm lượt trả lời — server luôn trả mảng, nhưng để optional để client vẫn
  // chạy được với bản server cũ chưa có trường này.
  interactiveQuestions?: InteractiveQuestion[]
  // Thẻ hỗ trợ khủng hoảng — chỉ có khi lớp an toàn ở server kết luận concern/imminent.
  safety?: CompanionSafetyNotice
}

export interface SendCompanionMessageParams {
  message: string
  intent?: string
  domain?: string
  tokenBudget?: number
  /** Phiên tạm: server không đọc ký ức/lịch sử và không lưu lượt này. */
  ephemeral?: boolean
}

export interface CompanionStreamCallbacks {
  onMeta?: (meta: { intent: string; targetDomain: string; contextPackage: ContextPackage }) => void
  onChunk?: (delta: string) => void
  onActions?: (actions: {
    proposedActions: ProposedAction[]
    executionSummary: CompanionExecutionSummary
  }) => void
  onQuestions?: (questions: InteractiveQuestion[]) => void
  // Sự kiện `safety` đến TRƯỚC chữ — hiện thẻ ngay, không chờ AI nói xong.
  onSafety?: (safety: CompanionSafetyNotice) => void
  onDone?: (response: CompanionResponse) => void
  onError?: (error: Error) => void
}

/**
 * Lỗi "đã huỷ" theo đúng chuẩn của `fetch` (`name === 'AbortError'`) — nơi gọi phân biệt được
 * "người dùng rời trang" với lỗi mạng thật, để im lặng thay vì hiện toast báo lỗi.
 */
function loiHuy(): Error {
  const err = new Error('Đã huỷ lượt gửi tới Bạn Đồng Hành')
  err.name = 'AbortError'
  return err
}

/**
 * Sends a message turn to the Multi-Domain Companion Runtime.
 */
export async function sendCompanionMessage(
  params: SendCompanionMessageParams,
): Promise<CompanionResponse> {
  const headers = await getAuthHeader()
  const res = await fetch('/api/companion', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }))
    throw new Error(errorBody.error || `HTTP error ${res.status}`)
  }

  return res.json()
}

/**
 * Sends a message turn to the Multi-Domain Companion Runtime with real-time SSE streaming.
 */
export async function sendCompanionMessageStream(
  params: SendCompanionMessageParams,
  callbacks: CompanionStreamCallbacks,
  // [S10-1] Lượt gửi phải HUỶ ĐƯỢC: rời trang giữa lúc AI đang trả lời thì vòng đọc SSE phải
  // dừng ngay, không chạy tiếp tới `done` (nếu chạy tiếp, `onDone` của trang cũ sẽ gọi TTS và
  // AI cất tiếng ở trang kế — lỗi L1/AC-1 của đặc tả S10).
  options?: { signal?: AbortSignal },
): Promise<CompanionResponse> {
  const signal = options?.signal
  if (signal?.aborted) throw loiHuy()
  const headers = await getAuthHeader()
  const res = await fetch('/api/companion', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...params, stream: true }),
    ...(signal ? { signal } : {}),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }))
    const err = new Error(errorBody.error || `HTTP error ${res.status}`)
    callbacks.onError?.(err)
    throw err
  }

  if (!res.body) {
    throw new Error('Response body is missing')
  }

  const reader = res.body.getReader()
  // Huỷ là phải nhả luôn kết nối: `reader.cancel()` đóng stream phía client, đồng thời làm
  // `reader.read()` đang chờ trả về ngay để vòng lặp dưới thoát được.
  const onAbort = () => {
    void reader.cancel().catch(() => {})
  }
  signal?.addEventListener('abort', onAbort, { once: true })

  const decoder = new TextDecoder()
  let buffer = ''
  let finalResponse: CompanionResponse | null = null
  let isStreaming = true
  try {
    while (isStreaming) {
      const { done, value } = await reader.read()
      // Kiểm cờ huỷ NGAY sau mỗi lượt đọc, TRƯỚC khi gọi bất kỳ callback nào — trang đã rời
      // thì không được chạm vào state của nó nữa.
      if (signal?.aborted) throw loiHuy()
      if (done) {
        isStreaming = false
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        if (!part.trim()) continue
        const lines = part.split('\n')
        let eventType = 'message'
        let dataText = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataText = line.slice(5).trim()
          }
        }

        if (!dataText) continue
        try {
          const parsed = JSON.parse(dataText)
          if (eventType === 'meta') {
            callbacks.onMeta?.(parsed)
          } else if (eventType === 'chunk') {
            callbacks.onChunk?.(parsed.delta)
          } else if (eventType === 'actions') {
            callbacks.onActions?.(parsed)
          } else if (eventType === 'questions') {
            callbacks.onQuestions?.(parsed.interactiveQuestions)
          } else if (eventType === 'safety') {
            callbacks.onSafety?.(parsed.safety)
          } else if (eventType === 'done') {
            finalResponse = parsed as CompanionResponse
            callbacks.onDone?.(finalResponse)
          } else if (eventType === 'error') {
            const err = new Error(parsed.message || parsed.error || 'SSE Error')
            callbacks.onError?.(err)
            throw err
          }
        } catch {
          // Ignore parse errors on partial chunks
        }
      }
    }
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }

  if (!finalResponse) {
    throw new Error('Stream ended without completion event')
  }

  return finalResponse
}

export interface CompanionHistoryMessage {
  id: string
  role: 'user' | 'companion'
  content: string
  domain?: string
  intent?: string
  createdAt: string
}

/**
 * Nạp lại hội thoại đã lưu để mở trang là thấy lại cuộc trò chuyện trước đó.
 */
export async function fetchCompanionHistory(options?: {
  signal?: AbortSignal
}): Promise<CompanionHistoryMessage[]> {
  const headers = await getAuthHeader()
  const res = await fetch('/api/companion', {
    headers,
    ...(options?.signal ? { signal: options.signal } : {}),
  })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }))
    throw new Error(errorBody.error || `HTTP error ${res.status}`)
  }
  const data = await res.json()
  return Array.isArray(data.messages) ? data.messages : []
}

/**
 * List proposed actions for the authenticated person.
 */
export async function listProposedActions(
  status?: 'pending' | 'confirmed' | 'rejected' | 'committed',
): Promise<ProposedAction[]> {
  const url = new URL(window.location.origin + '/api/proposed-actions')
  if (status) {
    url.searchParams.set('status', status)
  }

  const headers = await getAuthHeader()
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }))
    throw new Error(errorBody.error || `HTTP error ${res.status}`)
  }

  const data = await res.json()
  return data.actions
}

/**
 * Confirm a pending proposed action.
 */
export async function confirmProposedAction(
  id: string,
  expectedVersion: number,
): Promise<{ action: ProposedAction }> {
  const headers = await getAuthHeader()
  const res = await fetch('/api/proposed-actions', {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'confirm',
      id,
      expectedVersion,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }))
    throw new Error(errorBody.error || `HTTP error ${res.status}`)
  }

  return res.json()
}

/**
 * Reject a pending proposed action.
 */
export async function rejectProposedAction(
  id: string,
  expectedVersion: number,
  reason?: string,
): Promise<{ action: ProposedAction }> {
  const headers = await getAuthHeader()
  const res = await fetch('/api/proposed-actions', {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'reject',
      id,
      expectedVersion,
      ...(reason ? { reason } : {}),
    }),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }))
    throw new Error(errorBody.error || `HTTP error ${res.status}`)
  }

  return res.json()
}

import { describe, it, expect, afterEach, vi } from 'vitest'

vi.mock('@core/authHeader', () => ({
  getAuthHeader: vi.fn(async () => ({ Authorization: 'Bearer test-token' })),
}))

import {
  sendCompanionMessage,
  sendCompanionMessageStream,
  fetchCompanionHistory,
  listProposedActions,
  confirmProposedAction,
  rejectProposedAction,
} from './companionApi'

afterEach(() => {
  vi.unstubAllGlobals()
})

const MOCK_COMPANION_RESPONSE = {
  reply: 'Xin chào! Tôi có thể giúp gì cho bạn?',
  intent: 'general_conversation',
  targetDomain: 'learning',
  contextPackage: {
    schemaVersion: 1,
    requestId: '11111111-1111-4111-8111-111111111111',
    personId: '22222222-2222-4222-8222-222222222222',
    domain: 'learning',
    purpose: 'companion_conversation',
    tokenBudget: 4000,
    tokenUsed: 150,
    items: [],
    truncated: false,
    createdAt: new Date().toISOString(),
  },
  proposedActions: [],
  executionSummary: {
    plannedSteps: 0,
    executedSteps: 0,
    pendingConfirmationSteps: 0,
    rejectedSteps: 0,
  },
}

describe('companionApi', () => {
  describe('sendCompanionMessage', () => {
    it('gửi message thành công và nhận response', async () => {
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe('/api/companion')
        expect(init?.method).toBe('POST')
        expect(JSON.parse(init?.body as string)).toEqual({ message: 'Xin chào' })
        return new Response(JSON.stringify(MOCK_COMPANION_RESPONSE), { status: 200 })
      })
      vi.stubGlobal('fetch', fetchMock)

      const res = await sendCompanionMessage({ message: 'Xin chào' })
      expect(res.reply).toBe(MOCK_COMPANION_RESPONSE.reply)
      expect(res.intent).toBe('general_conversation')
    })

    it('báo lỗi khi API trả lỗi 401/500', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
      )

      await expect(sendCompanionMessage({ message: 'test' })).rejects.toThrow('Unauthorized')
    })
  })

  describe('sendCompanionMessageStream', () => {
    it('nhận và phân giải các sự kiện SSE tuần tự', async () => {
      const sseBody = [
        'event: meta\ndata: {"intent":"general_conversation","targetDomain":"learning","contextPackage":{"items":[],"tokenBudget":4000,"tokenUsed":0}}\n\n',
        'event: safety\ndata: {"safety":{"level":"concern","category":"other","resources":[{"phone":"111","name":"Tổng đài 111","note":"24/7"}]}}\n\n',
        'event: chunk\ndata: {"delta":"Xin"}\n\n',
        'event: chunk\ndata: {"delta":" chào!"}\n\n',
        'event: actions\ndata: {"proposedActions":[],"executionSummary":{"plannedSteps":0,"executedSteps":0,"pendingConfirmationSteps":0,"rejectedSteps":0}}\n\n',
        `event: done\ndata: ${JSON.stringify(MOCK_COMPANION_RESPONSE)}\n\n`,
      ].join('')

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseBody))
          controller.close()
        },
      })

      const fetchMock = vi.fn(async () => new Response(stream, { status: 200 }))
      vi.stubGlobal('fetch', fetchMock)

      let receivedChunks = ''
      let metaReceived = false
      let actionsReceived = false
      let doneReceived = false
      let safetyPhone = ''

      const res = await sendCompanionMessageStream(
        { message: 'Hello stream' },
        {
          onMeta: (meta) => {
            metaReceived = true
            expect(meta.intent).toBe('general_conversation')
          },
          onChunk: (delta) => {
            receivedChunks += delta
          },
          onActions: (actions) => {
            actionsReceived = true
            expect(actions.proposedActions).toHaveLength(0)
          },
          onSafety: (safety) => {
            // Thẻ hỗ trợ đến TRƯỚC chữ (server phát ngay sau meta) — bắt được là đủ.
            safetyPhone = safety.resources[0]?.phone ?? ''
          },
          onDone: (final) => {
            doneReceived = true
            expect(final.reply).toBe(MOCK_COMPANION_RESPONSE.reply)
          },
        },
      )

      expect(safetyPhone).toBe('111')
      expect(metaReceived).toBe(true)
      expect(receivedChunks).toBe('Xin chào!')
      expect(actionsReceived).toBe(true)
      expect(doneReceived).toBe(true)
      expect(res.reply).toBe(MOCK_COMPANION_RESPONSE.reply)
    })
  })

  describe('listProposedActions', () => {
    it('lấy danh sách actions thành công', async () => {
      const mockActions = [
        {
          schemaVersion: 1,
          id: '33333333-3333-4333-8333-333333333333',
          personId: '22222222-2222-4222-8222-222222222222',
          capabilityId: 'learning.update_goal',
          action: 'Đặt mục tiêu IELTS 7.0',
          targetDomain: 'learning',
          payload: { goal: 'ielts_7' },
          riskLevel: 'medium',
          status: 'pending',
          version: 1,
          createdAt: new Date().toISOString(),
        },
      ]

      const fetchMock = vi.fn(async (url: string) => {
        expect(url).toContain('/api/proposed-actions?status=pending')
        return new Response(JSON.stringify({ actions: mockActions }), { status: 200 })
      })
      vi.stubGlobal('fetch', fetchMock)

      const actions = await listProposedActions('pending')
      expect(actions).toHaveLength(1)
      expect(actions[0].action).toBe('Đặt mục tiêu IELTS 7.0')
    })
  })

  describe('confirmProposedAction & rejectProposedAction', () => {
    it('confirm gọi PATCH với action=confirm', async () => {
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe('/api/proposed-actions')
        expect(init?.method).toBe('PATCH')
        const body = JSON.parse(init?.body as string)
        expect(body.action).toBe('confirm')
        expect(body.id).toBe('action-123')
        expect(body.expectedVersion).toBe(1)
        return new Response(JSON.stringify({ action: { id: 'action-123', status: 'confirmed' } }), {
          status: 200,
        })
      })
      vi.stubGlobal('fetch', fetchMock)

      const result = await confirmProposedAction('action-123', 1)
      expect(result.action.status).toBe('confirmed')
    })

    it('reject gọi PATCH với action=reject và reason', async () => {
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe('/api/proposed-actions')
        expect(init?.method).toBe('PATCH')
        const body = JSON.parse(init?.body as string)
        expect(body.action).toBe('reject')
        expect(body.reason).toBe('Không muốn')
        return new Response(JSON.stringify({ action: { id: 'action-123', status: 'rejected' } }), {
          status: 200,
        })
      })
      vi.stubGlobal('fetch', fetchMock)

      const result = await rejectProposedAction('action-123', 1, 'Không muốn')
      expect(result.action.status).toBe('rejected')
    })
  })
})

// [2026-09-15] `signal` thêm vào để `Companion.tsx` huỷ được lượt nạp lịch sử cũ trong cleanup
// của effect — thay cho khuôn "ref chặn + cờ cancelled" đã làm lịch sử KHÔNG BAO GIỜ hiện ra
// dưới StrictMode. Cổng E2E canh hành vi: `e2e/companion-history.spec.ts`.
describe('fetchCompanionHistory', () => {
  it('truyền signal xuống fetch khi được cho', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal)
      return new Response(JSON.stringify({ messages: [] }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchCompanionHistory({ signal: controller.signal })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('không có signal thì KHÔNG gắn khoá signal vào init', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init && 'signal' in init).toBe(false)
      return new Response(JSON.stringify({ messages: [] }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchCompanionHistory()
  })

  it('payload không phải mảng thì trả mảng rỗng, không ném', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ messages: null }), { status: 200 })),
    )
    await expect(fetchCompanionHistory()).resolves.toEqual([])
  })
})

// ── S10-1 / AC-2: stream Companion phải HUỶ ĐƯỢC ────────────────────────────────────────────
// Lỗi L2 (đặc tả S10 §2.1): `sendCompanionMessageStream` không nhận `AbortSignal`, nên khi
// người dùng rời trang giữa lúc AI đang trả lời thì vòng đọc SSE vẫn chạy tới hết và `onDone`
// vẫn bắn — dẫn tới TTS cất tiếng ở trang kế (AC-1).
describe('sendCompanionMessageStream — huỷ bằng AbortSignal (AC-2)', () => {
  // Stream SSE do test tự bơm từng mẩu, để abort được ĐÚNG lúc đang đọc dở.
  function makeManualStream() {
    let ctrl: ReadableStreamDefaultController<Uint8Array> | null = null
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        ctrl = c
      },
    })
    return {
      stream,
      push(text: string) {
        try {
          ctrl?.enqueue(new TextEncoder().encode(text))
        } catch {
          /* stream đã đóng/huỷ — đúng điều test muốn chứng minh */
        }
      },
      close() {
        try {
          ctrl?.close()
        } catch {
          /* đã đóng */
        }
      },
    }
  }

  const tick = () => new Promise((r) => setTimeout(r, 10))

  it('abort TRƯỚC khi có sự kiện done → reject AbortError và onDone KHÔNG được gọi', async () => {
    const aborter = new AbortController()
    const manual = makeManualStream()
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      // signal phải được truyền xuống tận fetch, không chỉ giữ ở tầng JS.
      expect(init?.signal).toBe(aborter.signal)
      return new Response(manual.stream, { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const onDone = vi.fn()
    const onChunk = vi.fn()
    const promise = sendCompanionMessageStream(
      { message: 'xin chào' },
      { onChunk, onDone },
      { signal: aborter.signal },
    )
    // Bắt lỗi ngay để Node không báo "unhandled rejection" trong lúc ta còn chờ.
    const settled = promise.then(
      () => ({ ok: true as const }),
      (e: unknown) => ({ ok: false as const, error: e as Error }),
    )

    await tick()
    manual.push('event: chunk\ndata: {"delta":"Xin"}\n\n')
    await tick()
    expect(onChunk).toHaveBeenCalledWith('Xin')

    // Người dùng rời trang → cleanup abort.
    aborter.abort()
    // Server vẫn bắn nốt sự kiện done (stream còn bay) — client KHÔNG được xử lý nữa.
    manual.push('event: done\ndata: ' + JSON.stringify(MOCK_COMPANION_RESPONSE) + '\n\n')
    manual.close()

    const result = await settled
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.name).toBe('AbortError')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('abort SAU khi done đã về → kết quả không đổi, onDone vẫn đúng 1 lần', async () => {
    const aborter = new AbortController()
    const sseBody =
      'event: chunk\ndata: {"delta":"Xin chào"}\n\n' +
      'event: done\ndata: ' +
      JSON.stringify(MOCK_COMPANION_RESPONSE) +
      '\n\n'
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(sseBody))
        c.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(stream, { status: 200 })),
    )

    const onDone = vi.fn()
    const res = await sendCompanionMessageStream(
      { message: 'xin chào' },
      { onDone },
      { signal: aborter.signal },
    )
    aborter.abort() // rời trang sau khi đã xong — không được đổi gì

    expect(res.reply).toBe(MOCK_COMPANION_RESPONSE.reply)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})

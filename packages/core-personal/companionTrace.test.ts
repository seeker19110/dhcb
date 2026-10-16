// @vitest-environment node
// Runtime thật + SDK/provider thật, DB ở biên service và HTTP giả, không mạng ngoài.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import {
  CompanionTraceSpanSchema,
  type CompanionTraceSpan,
} from '@dhcb/core-contracts/companionTrace'
import { traceCompanionTurn } from '@dhcb/core-db/turnTrace'
import {
  executeCompanionTurn,
  streamCompanionTurn,
  type CompanionStreamEvent,
} from './companionRuntime.js'

const fakes = vi.hoisted(() => ({
  context: vi.fn(),
  propose: vi.fn(),
  history: vi.fn(),
  usage: vi.fn(),
  log: vi.fn(),
  safety: vi.fn(),
}))
vi.mock('./contextEngine.js', () => ({ buildContextPackage: fakes.context }))
vi.mock('./proposedActionService.js', () => ({ proposeAction: fakes.propose }))
vi.mock('./companionMessageService.js', () => ({ appendCompanionMessage: fakes.history }))
vi.mock('@dhcb/core-ai/aiTokenUsage', async (original) => ({
  ...(await original<typeof import('@dhcb/core-ai/aiTokenUsage')>()),
  recordAiTokenUsage: fakes.usage,
}))
vi.mock('@dhcb/core-db/logger', async (original) => ({
  ...(await original<typeof import('@dhcb/core-db/logger')>()),
  createRequestLogger: () => ({ info: fakes.log, debug: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))
vi.mock('./safetyGuard.js', async (original) => ({
  ...(await original<typeof import('./safetyGuard.js')>()),
  assessSafety: fakes.safety,
}))
const PERSON = '11111111-1111-4111-8111-111111111111'
const CTX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CANARY = 'CANARY_PRIVATE_NOTE_PROMPT_HISTORY'
const pool = {} as Pool
const request = {
  personId: PERSON,
  userMessage: `Đặt mục tiêu IELTS ${CANARY}`,
  intent: 'set_learning_goal',
  targetDomain: 'learning',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
function success() {
  return json({
    candidates: [{ content: { parts: [{ text: 'Mình cùng lập kế hoạch nhé.' }] } }],
    usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 40 },
  })
}
function logged(): CompanionTraceSpan[] {
  return fakes.log.mock.calls.map(([line]) =>
    CompanionTraceSpanSchema.parse(JSON.parse(String(line))),
  )
}
async function root() {
  await vi.waitFor(() => expect(logged().some((e) => e.stage === 'turn')).toBe(true), {
    interval: 5,
  })
  return logged().find((e) => e.stage === 'turn')!
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-16T00:00:00.000Z'))
  vi.stubEnv('COMPANION_TRACE_ENABLED', '')
  vi.stubEnv('ANTHROPIC_API_KEY', '')
  vi.stubEnv('GROQ_API_KEY', '')
  vi.stubEnv('GEMINI_API_KEY', 'fake-runtime-trace')
  fakes.context.mockResolvedValue({
    id: CTX,
    personId: PERSON,
    requestId: 'private-context-request',
    items: [
      {
        sourceType: 'current_request',
        sourceId: PERSON,
        content: CANARY,
        provenance: 'request',
        sensitivity: 'personal',
        tokenCount: 10,
      },
    ],
    tokenBudget: 2000,
    tokenUsed: 10,
    createdAt: '2026-10-16T00:00:00.000Z',
    schemaVersion: 1,
  })
  fakes.propose.mockResolvedValue({
    action: {
      id: '22222222-2222-4222-8222-222222222222',
      personId: PERSON,
      capabilityId: 'learning.update_goal',
      action: 'update_goal',
      targetDomain: 'learning',
      payload: { secret: CANARY },
      riskLevel: 'medium',
      status: 'pending',
      createdAt: '2026-10-16T00:00:00.000Z',
      schemaVersion: 1,
    },
    autoExecuted: false,
  })
  fakes.history.mockResolvedValue(undefined)
  fakes.usage.mockResolvedValue(undefined)
  fakes.safety.mockResolvedValue({ level: 'none', category: 'none', source: 'none' })
})
afterEach(async () => {
  await new Promise<void>((resolve) => setImmediate(resolve))
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Trace tích hợp Companion', () => {
  it('return sau delta đóng root unknown trong khi Claude còn chạy; child muộn không sửa snapshot', async () => {
    vi.stubEnv('COMPANION_TRACE_ENABLED', 'true')
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.stubEnv('ANTHROPIC_API_KEY', 'fake-claude-late-trace')
    let writer: ReadableStreamDefaultController<Uint8Array> | undefined
    const body = new ReadableStream<Uint8Array>({
      start: (controller) => {
        writer = controller
      },
    })
    function send(event: Record<string, unknown>) {
      if (!writer) throw new Error('TEST_STREAM_NOT_READY')
      writer.enqueue(
        new TextEncoder().encode(
          `event: ${String(event.type)}\ndata: ${JSON.stringify(event)}\n\n`,
        ),
      )
    }
    send({
      type: 'message_start',
      message: {
        id: 'msg_late',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-5-5',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      },
    })
    send({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
    send({
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: 'Mình cùng lập kế hoạch nhé.' },
    })
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(body, { headers: { 'content-type': 'text/event-stream' } }),
    )
    vi.stubGlobal('fetch', fetcher)
    const iterator = streamCompanionTurn(pool, request)
    await iterator.next()
    expect((await iterator.next()).value).toMatchObject({ type: 'chunk' })
    await iterator.return(undefined as never)
    const terminal = await root()
    expect(terminal.status).toBe('consumer_cancelled')
    expect(terminal.summary).toMatchObject({
      callCount: 1,
      openCallCount: 1,
      openModelCallCount: 1,
      totalCostUsd: null,
    })
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(false)
    send({ type: 'content_block_stop', index: 0 })
    send({
      type: 'message_delta',
      delta: { stop_reason: 'end_turn', stop_sequence: null },
      usage: { output_tokens: 40 },
    })
    send({ type: 'message_stop' })
    writer?.close()
    await vi.waitFor(() => expect(fakes.usage).toHaveBeenCalledTimes(1), { interval: 5 })
    await vi.waitFor(() => expect(logged().some((e) => e.stage === 'http_attempt')).toBe(true), {
      interval: 5,
    })
    await vi.waitFor(() => expect(logged().some((e) => e.stage === 'synthesis')).toBe(true), {
      interval: 5,
    })
    expect(terminal.summary?.totalCostUsd).toBeNull()
    expect(logged().filter((e) => e.stage === 'turn')).toHaveLength(1)
    expect(logged().find((e) => e.stage === 'http_attempt')?.costUsd).toBe(0.0006)
    expect(fakes.history).not.toHaveBeenCalled()
    expect(fakes.propose).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('cờ mặc định tắt không log; bật giữ response, pending proposal, history và daily usage', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => success())
    vi.stubGlobal('fetch', fetcher)
    const off = await executeCompanionTurn(pool, request)
    expect(fakes.log).not.toHaveBeenCalled()
    const effects = {
      proposals: fakes.propose.mock.calls.slice(),
      history: fakes.history.mock.calls.slice(),
      usage: fakes.usage.mock.calls.slice(),
    }
    vi.clearAllMocks()
    vi.stubEnv('COMPANION_TRACE_ENABLED', 'true')
    const on = await executeCompanionTurn(pool, request)
    const terminal = await root()
    expect(on).toEqual(off)
    expect(on.proposedActions[0]?.status).toBe('pending')
    expect(fakes.propose.mock.calls).toEqual(effects.proposals)
    expect(fakes.history.mock.calls).toEqual(effects.history)
    expect(fakes.usage.mock.calls).toEqual(effects.usage)
    expect(fetcher).toHaveBeenCalledTimes(1)
    const events = logged()
    expect(new Set(events.map((e) => e.traceId)).size).toBe(1)
    for (const stage of [
      'prepare',
      'intent',
      'context',
      'safety',
      'synthesis',
      'fallback',
      'model_call',
      'http_attempt',
      'finalize',
    ])
      expect(events.some((e) => e.stage === stage)).toBe(true)
    for (const event of events)
      if (event.parentSpanId)
        expect(events.some((parent) => parent.spanId === event.parentSpanId)).toBe(true)
    expect(terminal.summary).toMatchObject({ callCount: 1, totalCostUsd: 0.000225 })
    const serialized = JSON.stringify(events)
    for (const secret of [CANARY, PERSON, CTX, 'fake-runtime-trace', 'Mình cùng lập kế hoạch'])
      expect(serialized).not.toContain(secret)
  })

  it.each(['throw', 'reject', 'hang'])(
    'collector %s không gây thêm fetch, đề xuất hoặc ghi history/usage',
    async (fault) => {
      const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => success())
      vi.stubGlobal('fetch', fetcher)
      const sink = vi.fn(() => {
        if (fault === 'throw') throw new Error(CANARY)
        if (fault === 'reject') return Promise.reject(new Error(CANARY))
        return new Promise<never>(() => {})
      })
      const response = await traceCompanionTurn(() => executeCompanionTurn(pool, request), {
        enabled: true,
        sink,
      })
      expect(response.reply).toBe('Mình cùng lập kế hoạch nhé.')
      expect(response.proposedActions[0]?.status).toBe('pending')
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(fakes.propose).toHaveBeenCalledTimes(1)
      expect(fakes.history).toHaveBeenCalledTimes(2)
      expect(fakes.usage).toHaveBeenCalledTimes(1)
    },
  )

  it('negative control bỏ cô lập collector làm mất response và được oracle phát hiện', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () => success()),
    )
    const unsafeCollector = () => {
      throw new Error('UNISOLATED_COLLECTOR')
    }
    // Cùng runtime thật; lỗi nằm ở đường giao kết quả khi cố ý gọi collector trực tiếp.
    const unsafe = async () => {
      const response = await executeCompanionTurn(pool, request)
      unsafeCollector()
      return response
    }
    await expect(unsafe()).rejects.toThrow('UNISOLATED_COLLECTOR')
    expect(fakes.usage).toHaveBeenCalledTimes(1)
  })

  it('stream nhiều bước có root một lần, giữ chuỗi sự kiện và zero-call fallback được ghi', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const outside = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', outside)
    const off: CompanionStreamEvent[] = []
    for await (const event of streamCompanionTurn(pool, request)) off.push(event)
    vi.clearAllMocks()
    vi.stubEnv('COMPANION_TRACE_ENABLED', 'true')
    const on: CompanionStreamEvent[] = []
    for await (const event of streamCompanionTurn(pool, request)) on.push(event)
    const terminal = await root()
    expect(on).toEqual(off)
    expect(outside).not.toHaveBeenCalled()
    expect(logged().filter((e) => e.stage === 'turn')).toHaveLength(1)
    expect(logged().some((e) => e.stage === 'fallback')).toBe(true)
    expect(terminal.summary).toMatchObject({ callCount: 0, totalCostUsd: 0 })
    expect(fakes.history).toHaveBeenCalledTimes(2)
  })

  it('return xếp sau pending next, giữ kết quả Gemini đã hoàn tất và không tự abort', async () => {
    let release: (response: Response) => void = () => {
      throw new Error('TEST_PROVIDER_NOT_STARTED')
    }
    const fetcher = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve
        }),
    )
    vi.stubGlobal('fetch', fetcher)
    vi.stubEnv('COMPANION_TRACE_ENABLED', 'true')
    const iterator = streamCompanionTurn(pool, request)
    expect((await iterator.next()).value).toMatchObject({ type: 'meta' })
    // next khởi động producer rồi chờ queue. return theo đúng semantics generator phải đợi next.
    const pending = iterator.next()
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1), { interval: 5 })
    // Cho một chunk xuất hiện trong khi producer vẫn chạy cần Anthropic stream; Gemini chỉ
    // phát sau finalize. Ở đây kiểm return bị xếp sau pending next và không tự tạo abort.
    const returned = iterator.return(undefined as never)
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(false)
    release(success())
    await pending
    await returned
    const terminal = await root()
    expect(terminal.status).toBe('consumer_cancelled')
    expect(terminal.summary?.totalCostUsd).toBe(0.000225)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fakes.usage).toHaveBeenCalledTimes(1)
    expect(logged().filter((e) => e.stage === 'turn')).toHaveLength(1)
  })
})

// @vitest-environment node
// Route đăng ký thật → handler/runtime/SDK thật → HTTP thật. Chỉ auth/DB/usage và provider
// HTTP là fakes; kiểm số side effects, không dùng suite này làm bằng chứng authority DB.
import { createServer, request as httpRequest, type ClientRequest } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import compression from 'compression'
import { registerApiRoutes } from './routes.js'

const fakes = vi.hoisted(() => ({
  pool: { query: vi.fn(async () => ({ rows: [], rowCount: 0 })) },
  person: vi.fn(),
  context: vi.fn(),
  history: vi.fn(),
  tokenUsage: vi.fn(),
  consume: vi.fn(),
  refund: vi.fn(),
  propose: vi.fn(),
  bridgeDone: vi.fn(),
}))
vi.mock('@dhcb/core-http/nodeResponse', async (original) => {
  const actual = await original<typeof import('@dhcb/core-http/nodeResponse')>()
  return {
    ...actual,
    // Chỉ quan sát completion; bridge thật chạy một lần, giữ nguyên result/error.
    forwardEventStream: async (...args: Parameters<typeof actual.forwardEventStream>) => {
      try {
        return await actual.forwardEventStream(...args)
      } finally {
        fakes.bridgeDone()
      }
    },
  }
})
vi.mock('@dhcb/core-auth/security', async (original) => ({
  ...(await original<typeof import('@dhcb/core-auth/security')>()),
  validateAuth: async () => ({ userId: '33333333-3333-4333-8333-333333333333' }),
  checkRateLimit: async () => true,
  logSecurityEvent: vi.fn(),
}))
vi.mock('@dhcb/core-auth/twoFactor', () => ({
  getTwoFactorStatus: async () => ({ enabled: false }),
  hasStepUp: async () => false,
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => fakes.pool }))
vi.mock('@dhcb/core-personal/personService', async (original) => ({
  ...(await original<typeof import('@dhcb/core-personal/personService')>()),
  getOrCreatePerson: fakes.person,
}))
vi.mock('@dhcb/core-personal/contextEngine', () => ({ buildContextPackage: fakes.context }))
vi.mock('@dhcb/core-personal/companionMessageService', async (original) => ({
  ...(await original<typeof import('@dhcb/core-personal/companionMessageService')>()),
  appendCompanionMessage: fakes.history,
}))
vi.mock('@dhcb/core-personal/proposedActionService', async (original) => ({
  ...(await original<typeof import('@dhcb/core-personal/proposedActionService')>()),
  proposeAction: fakes.propose,
}))
vi.mock('@dhcb/core-ai/aiTokenUsage', async (original) => ({
  ...(await original<typeof import('@dhcb/core-ai/aiTokenUsage')>()),
  recordAiTokenUsage: fakes.tokenUsage,
}))
vi.mock('@dhcb/core-billing/usage', async (original) => ({
  ...(await original<typeof import('@dhcb/core-billing/usage')>()),
  checkAndConsumeUsage: fakes.consume,
  refundUsage: fakes.refund,
}))
vi.mock('@dhcb/core-personal/safetyGuard', async (original) => ({
  ...(await original<typeof import('@dhcb/core-personal/safetyGuard')>()),
  assessSafety: async () => ({ level: 'none', category: 'none', source: 'none' }),
}))
vi.mock('./api/_lib/sentry.js', () => ({ captureServerException: vi.fn() }))

const PERSON = '11111111-1111-4111-8111-111111111111'
const PREFIX = 'Phần trả lời trước barrier.'
let fakeKeySequence = 0
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('COMPANION_TRACE_ENABLED', '')
  // Client production cache theo key; mỗi fixture phải có fetch/barrier riêng.
  vi.stubEnv('ANTHROPIC_API_KEY', `fake-companion-http-transport-${++fakeKeySequence}`)
  vi.stubEnv('GROQ_API_KEY', '')
  vi.stubEnv('GEMINI_API_KEY', '')
  fakes.person.mockResolvedValue({ id: PERSON })
  fakes.context.mockResolvedValue({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    personId: PERSON,
    requestId: 'fixed-request',
    items: [],
    tokenBudget: 2000,
    tokenUsed: 0,
    createdAt: '2026-10-16T00:00:00.000Z',
    schemaVersion: 1,
  })
  fakes.consume.mockResolvedValue({ ok: true, day: '2026-10-16' })
  fakes.refund.mockResolvedValue(undefined)
  fakes.history.mockResolvedValue(undefined)
  fakes.tokenUsage.mockResolvedValue(undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

async function withRegistered<T>(action: (url: string, closed: Promise<void>) => Promise<T>) {
  const app = express()
  let observeClose: () => void = () => {}
  const closed = new Promise<void>((resolve) => {
    observeClose = resolve
  })
  app.use((_req, res, next) => {
    res.once('close', observeClose)
    next()
  })
  app.use(compression({ threshold: 1024 }))
  registerApiRoutes(app)
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('TEST_NO_ADDRESS')
  try {
    return await action(`http://127.0.0.1:${address.port}/api/companion`, closed)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}
function open(url: string, onData: (body: string) => void) {
  let request: ClientRequest | undefined
  const result = new Promise<string>((resolve, reject) => {
    request = httpRequest(
      url,
      { method: 'POST', headers: { 'content-type': 'application/json' } },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk: string) => {
          body += chunk
          onData(body)
        })
        response.on('end', () => resolve(body))
        response.on('error', reject)
        response.on('aborted', () => reject(new Error('TEST_CLIENT_CLOSED')))
      },
    )
    request.on('error', reject)
    request.end(
      JSON.stringify({
        message: 'Cùng trò chuyện nhé',
        intent: 'general_conversation',
        domain: 'general',
        stream: true,
      }),
    )
  })
  result.catch(() => {})
  return { result, close: () => request?.destroy() }
}
function provider(barrier: Promise<void>, deltas: string[] = [PREFIX]) {
  const send = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: Record<string, unknown>,
  ) =>
    controller.enqueue(
      new TextEncoder().encode(`event: ${String(event.type)}\ndata: ${JSON.stringify(event)}\n\n`),
    )
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        send(controller, {
          type: 'message_start',
          message: {
            id: 'msg_transport',
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
        send(controller, {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        })
        for (const text of deltas) {
          send(controller, {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text },
          })
        }
        await barrier
        send(controller, { type: 'content_block_stop', index: 0 })
        send(controller, {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn', stop_sequence: null },
          usage: { output_tokens: 20 },
        })
        send(controller, { type: 'message_stop' })
        controller.close()
      },
    }),
    { headers: { 'content-type': 'text/event-stream' } },
  )
}

describe('Companion HTTP integration', () => {
  it.each([false, true])(
    'prefix tới client trước provider EOF, disconnect=%s không tạo refund thêm',
    async (disconnect) => {
      let release: () => void = () => {}
      const barrier = new Promise<void>((resolve) => {
        release = resolve
      })
      const fetcher = vi.fn<typeof fetch>(async (url) => {
        if (!String(url).startsWith('https://api.anthropic.com/'))
          throw new Error('TEST_OUTSIDE_PROVIDER_BOUNDARY')
        return provider(barrier)
      })
      vi.stubGlobal('fetch', fetcher)
      await withRegistered(async (url, closed) => {
        let received = false
        const client = open(url, (body) => {
          if (body.includes(PREFIX)) received = true
        })
        try {
          await vi.waitFor(() => expect(received).toBe(true), { interval: 5 })
          expect(fakes.tokenUsage).not.toHaveBeenCalled()
          expect(fakes.history).not.toHaveBeenCalled()
          if (disconnect) {
            client.close()
            // Provider vẫn đứng trước EOF cho tới khi chính server đã thấy close.
            await closed
            expect(fakes.tokenUsage).not.toHaveBeenCalled()
            expect(fakes.history).not.toHaveBeenCalled()
            expect(fakes.bridgeDone).not.toHaveBeenCalled()
          }
          release()
          await vi.waitFor(() => expect(fakes.bridgeDone).toHaveBeenCalledTimes(1), { interval: 5 })
          await vi.waitFor(() => expect(fakes.history).toHaveBeenCalledTimes(2), { interval: 5 })
          expect(fakes.consume).toHaveBeenCalledTimes(1)
          expect(fakes.tokenUsage).toHaveBeenCalledTimes(1)
          expect(fakes.propose).not.toHaveBeenCalled()
          expect(fetcher).toHaveBeenCalledTimes(1)
          if (!disconnect) {
            const body = await client.result
            expect(body).toContain('event: done')
            expect(body).toContain('"isFallback":false')
          }
          expect(fakes.refund).not.toHaveBeenCalled()
        } finally {
          release()
          client.close()
        }
      })
    },
  )

  it('runtime thật lọc từng delta trước HTTP, giữ ID của questions/context có cấu trúc', async () => {
    let release: () => void = () => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    const question = {
      id: PERSON,
      text: 'Chọn?',
      multi: false,
      allowFreeText: true,
      options: [
        { id: PERSON, label: 'A' },
        { id: 'b', label: 'B' },
      ],
    }
    const raw =
      PREFIX +
      ' <du_<tool_use>lieu_a>' +
      PERSON +
      '\n``` \tdhcb-questions\r\n' +
      JSON.stringify({ schemaVersion: 1, questions: [question] }) +
      '\n```\n```dhcb-questions\n{"private":true}\n```'
    const fetcher = vi.fn<typeof fetch>(async (url) => {
      if (!String(url).startsWith('https://api.anthropic.com/'))
        throw new Error('TEST_OUTSIDE_PROVIDER_BOUNDARY')
      return provider(barrier, [...raw])
    })
    vi.stubGlobal('fetch', fetcher)
    // Chỉ kiểm các event SSE đầy đủ; metadata UUID là hợp lệ, không quét toàn bộ JSON.
    const events = (body: string): Array<{ type: string; data: Record<string, unknown> }> =>
      body
        .split('\n\n')
        .filter((block) => block.startsWith('event:'))
        .map((block) => {
          const [type, data] = block.split('\n')
          return {
            type: type!.slice(7),
            data: JSON.parse(data!.slice(6)) as Record<string, unknown>,
          }
        })
    await withRegistered(async (url) => {
      let visible = ''
      const client = open(url, (body) => {
        const complete = body.slice(0, body.lastIndexOf('\n\n') + 2)
        visible = events(complete)
          .filter((event) => event.type === 'chunk')
          .map((event) => event.data.delta)
          .join('')
        expect(visible).not.toContain(PERSON)
        expect(visible).not.toContain('<tool_')
        expect(visible).not.toContain('private')
      })
      try {
        await vi.waitFor(() => expect(visible).toContain(PREFIX), { interval: 5 })
        expect(fakes.history).not.toHaveBeenCalled()
        release()
        const parsed = events(await client.result)
        const done = parsed.find((event) => event.type === 'done')!.data
        expect(visible.trimEnd()).toBe(PREFIX)
        expect(done.reply).toBe(PREFIX)
        expect(done.interactiveQuestions).toEqual([question])
        expect(
          parsed.find((event) => event.type === 'questions')!.data.interactiveQuestions,
        ).toEqual([question])
        expect(parsed.find((event) => event.type === 'meta')!.data.contextPackage).toMatchObject({
          personId: PERSON,
        })
        expect(fakes.history).toHaveBeenCalledTimes(2)
        expect(fakes.consume).toHaveBeenCalledTimes(1)
        expect(fakes.tokenUsage).toHaveBeenCalledTimes(1)
        expect(fakes.refund).not.toHaveBeenCalled()
      } finally {
        release()
        client.close()
      }
    })
  })

  it('câu mẫu fallback vẫn hoàn đúng một lần theo ngày đã consume, không gọi provider', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetcher = vi.fn<typeof fetch>(async () => {
      throw new Error('TEST_UNEXPECTED_NETWORK')
    })
    vi.stubGlobal('fetch', fetcher)
    await withRegistered(async (url) => {
      const body = await open(url, () => {}).result
      expect(body).toContain('event: done')
      expect(body).toContain('"isFallback":true')
      expect(fakes.consume).toHaveBeenCalledTimes(1)
      expect(fakes.refund).toHaveBeenCalledExactlyOnceWith(
        '33333333-3333-4333-8333-333333333333',
        'chat',
        '2026-10-16',
      )
      expect(fakes.history).toHaveBeenCalledTimes(2)
      expect(fakes.tokenUsage).not.toHaveBeenCalled()
      expect(fetcher).not.toHaveBeenCalled()
    })
  })
})

// Public API wrappers thật; fake auth getter đồng bộ và HTTP tại boundary, không provider.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { callClaude } from './lib/ai'
import { sendCompanionMessageStream, type CompanionResponse } from './lib/companionApi'
const boundary = vi.hoisted(() => ({
  getAuthHeader: vi.fn<() => Record<string, string>>(),
  captureException: vi.fn(),
}))
vi.mock('@core/authHeader', () => ({ getAuthHeader: boundary.getAuthHeader }))
vi.mock('./lib/errorTracking', () => ({ captureException: boundary.captureException }))
type Adapter = 'speaking' | 'companion'
let expectedAdapter: Adapter = 'speaking'
let requests: RequestInit[] = []
let violations: string[] = []
let jsonReads = 0
let streamTerminals = 0
let holdResponse = false
let releaseResponse: (() => void) | undefined
const done = vi.fn()
const chunk = vi.fn()
const error = vi.fn()
const params = {
  message: 'synthetic utterance',
  domain: 'learning',
  ephemeral: true,
  tokenBudget: 512,
}
const reply: CompanionResponse = {
  reply: 'synthetic receipt',
  intent: 'general_conversation',
  targetDomain: 'learning',
  contextPackage: {
    schemaVersion: 1,
    id: '11da93bb-f7fd-43a6-9ed3-ab27e52ff17f',
    personId: '2e967953-4e44-4b8b-ab30-e22bf11c1a97',
    requestId: 'synthetic-request',
    tokenBudget: 512,
    tokenUsed: 0,
    items: [],
    createdAt: '2026-10-17T00:00:00.000Z',
  },
  proposedActions: [],
  executionSummary: {
    plannedSteps: 0,
    executedSteps: 0,
    pendingConfirmationSteps: 0,
    rejectedSteps: 0,
  },
}
function response(adapter: Adapter) {
  if (adapter === 'speaking') {
    const value = Response.json({ content: [{ type: 'text', text: 'synthetic receipt' }] })
    const read = value.json.bind(value)
    value.json = () => {
      jsonReads++
      return read()
    }
    return value
  }
  const frames = [
    `event: chunk\ndata: ${JSON.stringify({ delta: 'synthetic receipt' })}\n\n`,
    `event: done\ndata: ${JSON.stringify(reply)}\n\n`,
  ]
  let next = 0
  return new Response(
    new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          const frame = frames[next++]
          if (frame === undefined) {
            streamTerminals++
            controller.close()
          } else controller.enqueue(new TextEncoder().encode(frame))
        },
      },
      { highWaterMark: 0 },
    ),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  )
}
function invoke(
  adapter: Adapter,
  isCurrent: () => boolean,
  signal?: AbortSignal,
): Promise<unknown> {
  return adapter === 'speaking'
    ? callClaude(
        [{ role: 'user', content: 'synthetic utterance' }],
        'synthetic system',
        777,
        'speaking',
        'converse',
        undefined,
        { isCurrent },
      )
    : sendCompanionMessageStream(
        params,
        { onChunk: chunk, onDone: done, onError: error },
        { signal, isCurrent },
      )
}
async function outcome(promise: Promise<unknown>) {
  return promise.then(
    (value) => ({ ok: true, value }),
    (reason) => ({ ok: false, value: reason instanceof Error ? reason.name : 'NON_ERROR' }),
  )
}
async function flush() {
  for (let i = 0; i < 16; i++) await Promise.resolve()
}
beforeEach(() => {
  requests = []
  violations = []
  jsonReads = 0
  streamTerminals = 0
  holdResponse = false
  releaseResponse = undefined
  done.mockClear()
  chunk.mockClear()
  error.mockClear()
  boundary.getAuthHeader.mockReset().mockReturnValue({ 'X-Fixture-Auth': 'synthetic' })
  boundary.captureException.mockClear()
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const expectedBody =
      expectedAdapter === 'speaking'
        ? {
            max_tokens: 777,
            system: 'synthetic system',
            messages: [{ role: 'user', content: 'synthetic utterance' }],
            mode: 'speaking',
            task: 'converse',
          }
        : {
            message: 'synthetic utterance',
            domain: 'learning',
            ephemeral: true,
            tokenBudget: 512,
            stream: true,
          }
    const url = expectedAdapter === 'speaking' ? '/api/agent' : '/api/companion'
    let actualBody: unknown
    try {
      actualBody = typeof init?.body === 'string' ? JSON.parse(init.body) : null
    } catch {
      violations.push('non_json_body')
      throw new Error('UNMATCHED_HTTP')
    }
    const headers = new Headers(init?.headers)
    if (
      input !== url ||
      init?.method !== 'POST' ||
      JSON.stringify(actualBody) !== JSON.stringify(expectedBody) ||
      headers.get('content-type') !== 'application/json' ||
      headers.get('x-fixture-auth') !== 'synthetic' ||
      [...headers.keys()].length !== 2
    ) {
      violations.push('request_fingerprint_mismatch')
      throw new Error('UNMATCHED_HTTP')
    }
    if (!init) throw new Error('Missing RequestInit')
    requests.push(init)
    if (holdResponse)
      return new Promise((resolve) => {
        releaseResponse = () => resolve(response(expectedAdapter))
      })
    return Promise.resolve(response(expectedAdapter))
  })
})
afterEach(() => {
  expect(violations).toEqual([])
  expect(boundary.captureException).toHaveBeenCalledTimes(0)
  expect(error).toHaveBeenCalledTimes(0)
  vi.unstubAllGlobals()
})
for (const adapter of ['speaking', 'companion'] as const) {
  describe('OWNER_REQUEST_GUARD ' + adapter, () => {
    beforeEach(() => {
      expectedAdapter = adapter
    })
    it('false before credentials skips auth/fetch and rejects AbortError', async () => {
      const result = await outcome(invoke(adapter, () => false))
      expect(result).toEqual({ ok: false, value: 'AbortError' })
      expect(boundary.getAuthHeader).toHaveBeenCalledTimes(0)
      expect(requests).toHaveLength(0)
    })
    it('owner rotation during actual synchronous-header await skips fetch', async () => {
      let current = true
      const pending = outcome(invoke(adapter, () => current))
      expect(boundary.getAuthHeader).toHaveBeenCalledTimes(1)
      current = false
      expect(await pending).toEqual({ ok: false, value: 'AbortError' })
      expect(requests).toHaveLength(0)
    })
    it('throwing local predicate fails closed as AbortError without network-error reporting', async () => {
      const result = await outcome(
        invoke(adapter, () => {
          throw new Error('synthetic local observer failure')
        }),
      )
      expect(result).toEqual({ ok: false, value: 'AbortError' })
      expect(boundary.getAuthHeader).toHaveBeenCalledTimes(0)
      expect(requests).toHaveLength(0)
    })
    it('CONTROL owner change after fetch keeps exact request and real completion receipt once', async () => {
      let current = true
      holdResponse = true
      const controller = new AbortController()
      const pending = outcome(invoke(adapter, () => current, controller.signal))
      try {
        await flush()
        expect(requests).toHaveLength(1)
        expect(boundary.getAuthHeader).toHaveBeenCalledTimes(1)
        current = false
        if (!releaseResponse) throw new Error('Missing HTTP response barrier')
        releaseResponse()
        releaseResponse = undefined
        const result = await pending
        expect(controller.signal.aborted).toBe(false)
        expect(requests).toHaveLength(1)
        if (adapter === 'speaking') {
          expect(result).toEqual({ ok: true, value: 'synthetic receipt' })
          expect(jsonReads).toBe(1)
        } else {
          expect(result).toEqual({ ok: true, value: reply })
          expect(requests[0]?.signal).toBe(controller.signal)
          expect(chunk.mock.calls).toEqual([['synthetic receipt']])
          expect(done.mock.calls).toEqual([[reply]])
          expect(streamTerminals).toBe(1)
        }
      } finally {
        releaseResponse?.()
        releaseResponse = undefined
        await pending
      }
    })
  })
}

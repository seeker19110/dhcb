// @vitest-environment node
// Scope cleanup không chứng minh người dùng bấm Hủy: root và HTTP child giữ reason riêng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendCompanionMessageStream } from './lib/companionApi'
import { createVoiceObserver } from './lib/voiceMetrics'
import type { VoiceEvent } from '@dhcb/core-contracts/voiceMetrics'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ 'X-Fixture': 'synthetic' }) }))
async function flush() {
  for (let n = 0; n < 32; n++) await Promise.resolve()
}
afterEach(() => vi.unstubAllGlobals())
type Phase = 'before_headers' | 'during_sse'
function fixture(phase: Phase) {
  const events: VoiceEvent[] = []
  const observer = createVoiceObserver({
    enabled: true,
    sink: (event) => {
      events.push(event)
    },
  })
  const turn = observer.startTurn({ mode: 'companion', direction: 'vi_only', input: 'typed' })
  const controller = new AbortController()
  const ledger: string[] = []
  let requests = 0,
    chunks = 0,
    done = 0,
    reads = 0,
    cancelledReader = 0
  let releaseResponse: ((response: Response) => void) | undefined
  const expectedReply = { reply: 'synthetic receipt' }
  const encode = new TextEncoder()
  const streaming = new Response(
    new ReadableStream<Uint8Array>(
      {
        start(stream) {
          stream.enqueue(encode.encode('event: chunk\ndata: {"delta":"synthetic"}\n\n'))
        },
        pull() {
          reads++
        },
        cancel() {
          cancelledReader++
        },
      },
      { highWaterMark: 0 },
    ),
    { status: 200 },
  )
  vi.stubGlobal('fetch', (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : null
    if (
      url !== '/api/companion' ||
      init?.method !== 'POST' ||
      JSON.stringify(body) !==
        JSON.stringify({ message: 'synthetic input', domain: 'learning', stream: true }) ||
      init?.signal !== controller.signal
    ) {
      ledger.push('UNMATCHED_HTTP')
      return Promise.reject(new Error('UNMATCHED_HTTP'))
    }
    requests++
    return phase === 'during_sse'
      ? Promise.resolve(streaming)
      : new Promise((resolve, reject) => {
          releaseResponse = resolve
          controller.signal.addEventListener(
            'abort',
            () => reject(new DOMException('synthetic abort', 'AbortError')),
            { once: true },
          )
        })
  })
  const pending = sendCompanionMessageStream(
    { message: 'synthetic input', domain: 'learning' },
    {
      onChunk: () => {
        chunks++
      },
      onDone: () => {
        done++
      },
    },
    { signal: controller.signal, isCurrent: () => true, metrics: turn },
  ).then(
    (value) => ({ status: 'ok' as const, value }),
    (error) => ({
      status: 'error' as const,
      name: error instanceof Error ? error.name : 'UNKNOWN',
    }),
  )
  return {
    events,
    observer,
    turn,
    controller,
    pending,
    releaseSuccess() {
      if (!releaseResponse) throw new Error('MISSING_RESPONSE_BARRIER')
      releaseResponse(
        new Response(`event: done\ndata: ${JSON.stringify(expectedReply)}\n\n`, { status: 200 }),
      )
    },
    async assertBoundary() {
      await flush()
      expect(ledger).toEqual([])
      expect(requests).toBe(1)
      expect(observer.diagnostics()).toMatchObject({
        sinkErrors: 0,
        dropped: 0,
        invalidClock: 0,
        queued: 0,
        activeSink: false,
      })
    },
    async assertPhase() {
      await flush()
      expect(requests).toBe(1)
      expect(events.filter((e) => e.event === 'response_headers')).toHaveLength(
        phase === 'during_sse' ? 1 : 0,
      )
      expect(chunks).toBe(phase === 'during_sse' ? 1 : 0)
      if (phase === 'during_sse') expect(reads).toBeGreaterThan(0)
    },
    counts: () => ({ chunks, done, cancelledReader }),
  }
}
for (const phase of ['before_headers', 'during_sse'] as const) {
  describe('Companion cancellation reason ' + phase, () => {
    it('scope cleanup: root unknown không được biến thành request user', async () => {
      const f = fixture(phase)
      try {
        await f.assertPhase()
        // Cùng sequence actual releaseSendOwner: metrics.end trước controller.abort.
        f.turn.end('cancelled', 'unknown')
        f.controller.abort()
        expect(await f.pending).toEqual({ status: 'error', name: 'AbortError' })
        await f.assertBoundary()
        expect(f.counts().done).toBe(0)
        if (phase === 'during_sse') expect(f.counts().cancelledReader).toBe(1)
        expect(f.events.find((e) => e.event === 'turn_ended')).toMatchObject({
          status: 'cancelled',
          reason: 'unknown',
        })
        expect(f.events.filter((e) => e.event === 'request_ended')).toHaveLength(1)
        expect(f.events.find((e) => e.event === 'request_ended')).toMatchObject({
          status: 'cancelled',
          reason: 'unknown',
        })
      } finally {
        f.controller.abort()
        await f.pending
      }
    })
    it('CONTROL explicit user reason vẫn được giữ trên root có thẩm quyền', async () => {
      const f = fixture(phase)
      try {
        await f.assertPhase()
        f.turn.end('cancelled', 'user')
        f.controller.abort()
        expect(await f.pending).toEqual({ status: 'error', name: 'AbortError' })
        await f.assertBoundary()
        expect(f.events.find((e) => e.event === 'turn_ended')).toMatchObject({
          status: 'cancelled',
          reason: 'user',
        })
        // Child signal tự nó không chứng minh nguyên nhân; control chỉ yêu cầu root giữ user.
        expect(f.events.find((e) => e.event === 'request_ended')).toMatchObject({
          status: 'cancelled',
        })
        expect(f.counts().done).toBe(0)
      } finally {
        f.controller.abort()
        await f.pending
      }
    })
  })
}
it('CONTROL root kết thúc nhưng không abort: sent HTTP giữ late receipt ok', async () => {
  const f = fixture('before_headers')
  try {
    await f.assertPhase()
    f.turn.end('cancelled', 'unknown')
    f.releaseSuccess()
    expect(await f.pending).toEqual({ status: 'ok', value: { reply: 'synthetic receipt' } })
    expect(f.controller.signal.aborted).toBe(false)
    await f.assertBoundary()
    expect(f.counts().done).toBe(1)
    expect(f.events.find((e) => e.event === 'turn_ended')).toMatchObject({
      status: 'cancelled',
      reason: 'unknown',
    })
    expect(f.events.find((e) => e.event === 'request_ended')).toMatchObject({
      status: 'ok',
      reason: 'none',
    })
    expect(f.events.filter((e) => e.event === 'request_ended')).toHaveLength(1)
    expect(f.events.filter((e) => e.event === 'text_ready')).toHaveLength(0)
  } finally {
    f.controller.abort()
    await f.pending
  }
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVoiceObserver } from './lib/voiceMetrics'
import type { VoiceEvent } from '@dhcb/core-contracts/voiceMetrics'
import { startRecording } from './lib/sttServer'
import { installMediaFixture } from './voiceLifecycleFixtures'
vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ 'X-Test-Auth': 'synthetic' }) }))
async function flush() {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}
let fixture: ReturnType<typeof installMediaFixture> | undefined
afterEach(async () => {
  fixture?.dispose()
  fixture = undefined
  await flush()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
for (const mode of ['off', 'on', 'throw', 'reject'] as const)
  describe('actual STT observation ' + mode, () => {
    for (const outcome of ['nonempty', 'blank', 'timeout', 'prefetch_cancel'] as const)
      it(outcome, async () => {
        const events: VoiceEvent[] = []
        let clock = 0,
          ids = 0
        const observer = createVoiceObserver({
          enabled: mode !== 'off',
          now: () => ++clock,
          randomId: () => {
            ids++
            return crypto.randomUUID()
          },
          sink: (event) => {
            events.push(event)
            if (mode === 'throw') throw Error('PRIVATE_SINK_CANARY')
            if (mode === 'reject') return Promise.reject(Error('PRIVATE_SINK_CANARY'))
          },
        })
        const turn = observer.startTurn({
          mode: 'speaking',
          direction: 'en_to_vi',
          input: 'microphone',
        })
        fixture = installMediaFixture()
        const ledger: string[] = [],
          requests: RequestInit[] = []
        let resolveResponse: ((response: Response) => void) | undefined
        vi.stubGlobal(
          'fetch',
          (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const body = typeof init?.body === 'string' ? JSON.parse(init.body) : null
            if (
              input !== '/api/stt' ||
              init?.method !== 'POST' ||
              JSON.stringify(body) !==
                JSON.stringify({ audio_b64: 'AQID', mime: 'audio/webm;codecs=opus', lang: 'vi' })
            ) {
              ledger.push('REQUEST_FINGERPRINT_MISMATCH')
              return Promise.reject(Error('UNMATCHED_HTTP'))
            }
            if (!init) throw Error('MISSING_INIT')
            requests.push(init)
            return new Promise((resolve, reject) => {
              resolveResponse = resolve
              init.signal?.addEventListener(
                'abort',
                () => reject(new DOMException('SYNTHETIC_TIMEOUT', 'AbortError')),
                { once: true },
              )
            })
          },
        )
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        const controller = new AbortController()
        if (outcome === 'prefetch_cancel') controller.abort()
        const pending = startRecording('vi', { signal: controller.signal, metrics: turn }).then(
          (value) => ({ ok: true as const, value }),
          (error) => ({
            ok: false as const,
            error: error instanceof Error ? error.name : 'UNKNOWN',
          }),
        )
        if (outcome === 'prefetch_cancel') {
          expect(await pending).toEqual({ ok: false, error: 'AbortError' })
          expect(fixture.permissions).toHaveLength(0)
          turn.end('cancelled', 'user')
        } else {
          fixture.grant()
          const started = await pending
          if (!started.ok) throw Error('CAPTURE_DID_NOT_START')
          const result = started.value.stop().then(
            (value) => ({ ok: true as const, value }),
            (error) => ({
              ok: false as const,
              error: error instanceof Error ? error.message : 'UNKNOWN',
            }),
          )
          await flush()
          expect(requests).toHaveLength(1)
          if (outcome === 'timeout') {
            await vi.advanceTimersByTimeAsync(59_999)
            expect(requests[0]?.signal?.aborted).toBe(false)
            await vi.advanceTimersByTimeAsync(1)
            expect(await result).toEqual({
              ok: false,
              error: 'Máy chủ phản hồi quá lâu — kiểm tra mạng rồi thử lại.',
            })
            turn.end('error', 'timeout')
          } else {
            turn.end('cancelled', 'route_leave')
            controller.abort()
            started.value.cancel()
            expect(requests[0]?.signal?.aborted).toBe(false)
            if (!resolveResponse) throw Error('MISSING_RESPONSE_BARRIER')
            resolveResponse(
              Response.json({ text: outcome === 'blank' ? '   ' : 'SYNTHETIC_RECEIPT' }),
            )
            expect(await result).toEqual({
              ok: true,
              value: outcome === 'blank' ? '' : 'SYNTHETIC_RECEIPT',
            })
          }
        }
        await flush()
        expect(ledger).toEqual([])
        expect(fixture.boundaryFailures).toEqual([])
        expect(fixture.activeTracks()).toBe(0)
        if (mode === 'off') {
          expect(clock).toBe(0)
          expect(ids).toBe(0)
          expect(events).toEqual([])
        } else {
          expect(events.filter((event) => event.event === 'request_started')).toHaveLength(
            requests.length,
          )
          expect(events.filter((event) => event.event === 'request_ended')).toHaveLength(
            requests.length,
          )
          expect(events.filter((event) => event.event === 'text_ready')).toHaveLength(0)
          if (outcome !== 'prefetch_cancel')
            expect(events.find((event) => event.event === 'request_ended')).toMatchObject(
              outcome === 'timeout'
                ? { status: 'error', reason: 'timeout' }
                : { status: 'ok', reason: 'none' },
            )
          expect(JSON.stringify(events)).not.toMatch(
            /SYNTHETIC_RECEIPT|PRIVATE_SINK_CANARY|AQID|X-Test-Auth/,
          )
          expect(observer.diagnostics().sinkErrors).toBe(mode === 'on' ? 0 : events.length)
        }
      })
  })

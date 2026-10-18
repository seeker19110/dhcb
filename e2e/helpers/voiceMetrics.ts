import { isDeepStrictEqual } from 'node:util'
import { test, expect, type Page } from '@playwright/test'
import { z } from 'zod'
import {
  localVoiceWindowSchema,
  type LocalVoiceWindowSnapshot,
  type Stage,
  type VoiceEvent,
} from '../../packages/core-contracts/voiceMetrics'
import { speakingSystemPrompt, situationLabel } from '../../apps/dhcb/src/prompts'
import { USER_ID } from './auth'
import { prepareVoice, type Direction } from './voiceLifecycle'

export type MetricsFlow = 'speaking-server-A' | 'speaking-native-B' | 'companion-server'
const TRANSCRIPT = 'synthetic final transcript'
const GREETING = 'synthetic tutor greeting'
const REPLY = 'synthetic companion reply'
const LATE_TEXT = 'PRIVATE_LATE_TRANSCRIPT_CANARY'
const LATE_ERROR = 'PRIVATE_RAW_ERROR_CANARY https://private.invalid/audio?token=CANARY'
const STAGES: Stage[] = ['stt', 'agent', 'companion', 'tts', 'audio_download']
const paths: Record<Exclude<Stage, 'audio_download'>, string> = {
  stt: '/api/stt',
  agent: '/api/agent',
  companion: '/api/companion',
  tts: '/api/tts',
}
const bodySchemas = {
  stt: z.object({ audio_b64: z.string(), mime: z.string(), lang: z.enum(['en', 'vi']) }).strict(),
  agent: z
    .object({
      max_tokens: z.literal(1024),
      system: z.string(),
      messages: z.array(
        z.object({ role: z.enum(['user', 'assistant']), content: z.string() }).strict(),
      ),
      mode: z.literal('speaking'),
    })
    .strict(),
  companion: z.object({ message: z.string(), stream: z.literal(true) }).strict(),
  tts: z
    .object({ text: z.string(), lang: z.enum(['en-US', 'vi-VN']), voice: z.literal('Kore') })
    .strict(),
}
const readerEnvelopeSchema = z
  .object({
    present: z.literal(true),
    configurable: z.literal(false),
    enumerable: z.literal(false),
    writable: z.literal(false),
    frozen: z.literal(true),
    keys: z.tuple([z.literal('read')]),
    value: localVoiceWindowSchema,
  })
  .strict()

function expectedBodies(flow: MetricsFlow, pending: boolean) {
  const speaking = flow !== 'companion-server'
  const dir: Direction = flow === 'speaking-native-B' ? 'B' : 'A'
  const lang = speaking && dir === 'A' ? 'en-US' : 'vi-VN'
  const system = speakingSystemPrompt(
    situationLabel('small_talk', dir),
    'beginner',
    dir,
    undefined,
    'nguoi_lon',
  )
  const agent = (messages: { role: 'user' | 'assistant'; content: string }[]) => ({
    max_tokens: 1024,
    system,
    messages,
    mode: 'speaking',
  })
  return {
    stt:
      !pending && flow !== 'speaking-native-B'
        ? [
            {
              audio_b64: 'c3ludGhldGlj',
              mime: 'audio/webm;codecs=opus',
              lang: speaking ? 'en' : 'vi',
            },
          ]
        : [],
    agent: speaking
      ? [
          agent([]),
          ...(pending
            ? []
            : [
                agent([
                  { role: 'assistant', content: GREETING },
                  { role: 'user', content: TRANSCRIPT },
                ]),
              ]),
        ]
      : [],
    companion: !speaking && !pending ? [{ message: TRANSCRIPT, stream: true }] : [],
    tts: speaking
      ? Array.from({ length: pending ? 1 : 2 }, () => ({ text: GREETING, lang, voice: 'Kore' }))
      : pending
        ? []
        : [{ text: REPLY, lang, voice: 'Kore' }],
  }
}

export async function prepareMetricsVoice(
  page: Page,
  options: { flow: MetricsFlow; enabled: boolean; pending?: boolean },
) {
  const f = await prepareVoice(page, {
    dir: options.flow === 'speaking-native-B' ? 'B' : 'A',
    native: options.flow === 'speaking-native-B',
  })
  // Các key độc lập với init của fixture; không clear storage hay phụ thuộc thứ tự script.
  await page.addInitScript(
    ({ enabled, uid }) => {
      if (enabled) sessionStorage.setItem('dhcb.voiceMetrics.v1', 'on')
      else sessionStorage.removeItem('dhcb.voiceMetrics.v1')
      localStorage.setItem(
        'et_onboarding_' + uid,
        JSON.stringify({
          level: 'beginner',
          goal: 'daily',
          dailyMinutes: 10,
          ageGroup: 'nguoi_lon',
        }),
      )
      localStorage.setItem('tts_voice', 'Kore')
      localStorage.setItem('tts_voice_native', 'Kore')
      localStorage.setItem('tts_voice_random', '0')
    },
    { enabled: options.enabled, uid: USER_ID },
  )
  const expected = expectedBodies(options.flow, !!options.pending)
  const counts = { stt: 0, agent: 0, companion: 0, tts: 0 }
  const fingerprints: { stage: keyof typeof counts; ordinal: number; body: unknown }[] = []
  const violations: string[] = []
  // Đăng ký sau prepareVoice: guard chạy trước rồi fallback vào fake HTTP hiện hữu.
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const stage = (Object.keys(counts) as (keyof typeof counts)[]).find(
      (candidate) => paths[candidate] === url.pathname,
    )
    if (!stage || (stage === 'companion' && request.method() === 'GET')) {
      await route.fallback()
      return
    }
    const ordinal = counts[stage]++
    let body: unknown
    try {
      body = bodySchemas[stage].parse(request.postDataJSON())
      const headers = request.headers()
      if (
        request.method() !== 'POST' ||
        url.search !== '' ||
        headers['content-type'] !== 'application/json' ||
        headers.authorization !== undefined ||
        headers['x-guest-id'] !== undefined ||
        !isDeepStrictEqual(body, expected[stage][ordinal])
      )
        throw new Error('fingerprint_mismatch')
    } catch {
      // Giữ lỗi ngoài catch của sản phẩm: fallback/error UI không được làm test xanh giả.
      violations.push(stage + ':' + ordinal + ':fingerprint_mismatch')
      await route.abort()
      return
    }
    fingerprints.push({ stage, ordinal, body })
    await route.fallback()
  })
  return {
    ...f,
    options,
    voiceCalls: () =>
      f.calls.filter((call) => call.method === 'POST' && Object.values(paths).includes(call.path)),
    async assertFingerprints() {
      expect(violations).toEqual([])
      expect(counts).toEqual({
        stt: expected.stt.length,
        agent: expected.agent.length,
        companion: expected.companion.length,
        tts: expected.tts.length,
      })
      const snapshot = await f.snapshot()
      expect(snapshot.apiStarted).toEqual(counts)
      for (const stage of Object.keys(counts) as (keyof typeof counts)[])
        expect(f.count(paths[stage])).toBe(counts[stage])
      await f.assertLedger()
    },
    async cleanup() {
      try {
        await test.info().attach('voice-metrics-browser-evidence', {
          contentType: 'application/json',
          body: JSON.stringify({
            options,
            fingerprints,
            violations,
            readback: await readRawMetrics(page).catch(() => ({ unavailableDuringFailure: true })),
          }),
        })
      } finally {
        try {
          await f.cleanup()
        } finally {
          expect(violations).toEqual([])
        }
      }
    },
  }
}
export type MetricsFixture = Awaited<ReturnType<typeof prepareMetricsVoice>>

async function readRawMetrics(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(window, '__DHCB_VOICE_METRICS_V1__')
    if (!descriptor) return { present: false }
    const reader: unknown = descriptor.value
    if (typeof reader !== 'object' || reader === null) throw new Error('INVALID_METRICS_READER')
    const read: unknown = Reflect.get(reader, 'read')
    if (typeof read !== 'function') throw new Error('INVALID_METRICS_READ')
    const value: unknown = Reflect.apply(read, reader, [])
    return {
      present: true,
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: descriptor.writable,
      frozen: Object.isFrozen(reader),
      keys: Object.keys(reader),
      value,
    }
  })
}
export async function readMetrics(page: Page) {
  return readerEnvelopeSchema.parse(await readRawMetrics(page)).value
}
export async function assertMetricsOff(page: Page) {
  expect(await readRawMetrics(page)).toEqual({ present: false })
}

export async function assertObservedWindow(
  page: Page,
  f: MetricsFixture,
  microphoneEnd: 'ok' | 'user' | 'unknown' = 'ok',
): Promise<LocalVoiceWindowSnapshot> {
  const speaking = f.options.flow !== 'companion-server'
  const turnCount = speaking ? 2 : 1
  await expect
    .poll(
      async () => (await readMetrics(page)).events.filter((e) => e.event === 'turn_ended').length,
    )
    .toBe(turnCount)
  const snapshot = await readMetrics(page)
  expect(snapshot.diagnostics).toEqual({
    emitted: snapshot.events.length,
    delivered: snapshot.events.length,
    dropped: 0,
    sinkErrors: 0,
    invalidInput: 0,
    invalidClock: 0,
    rejectedTurns: 0,
    overflow: false,
    activeSink: false,
    queued: 0,
  })
  expect(snapshot.evidence).toBe('local_observation_only')
  expect(snapshot.physical).toEqual({
    audibleFirstSound: 'NOT_MEASURED',
    speechOnsetToPlaybackStop: 'NOT_MEASURED',
    clientReconnect: 'NOT_MEASURED',
    deviceNetworkPerformance: 'WAITING',
  })
  const serialized = JSON.stringify(snapshot)
  for (const canary of [
    TRANSCRIPT,
    GREETING,
    REPLY,
    'synthetic browser audio',
    'c3ludGhldGlj',
    USER_ID,
    'e2e@example.com',
    'session:e2e',
    LATE_TEXT,
    'PRIVATE_AUDIO_CANARY',
    'PRIVATE_RAW_ERROR_CANARY',
    'https://',
    'http://',
    '/api/',
  ])
    expect(serialized).not.toContain(canary)
  const starts = snapshot.events.filter((e) => e.event === 'turn_started')
  expect(starts.map((e) => e.input)).toEqual(speaking ? ['system', 'microphone'] : ['microphone'])
  expect(new Set(starts.map((e) => e.turnId)).size).toBe(turnCount)
  expect(new Set(snapshot.events.map((e) => e.sessionId)).size).toBe(1)
  expect(new Set(snapshot.events.map((e) => e.clockId)).size).toBe(1)
  const direction = speaking
    ? f.options.flow === 'speaking-native-B'
      ? 'en_to_vi'
      : 'vi_to_en'
    : 'vi_only'
  for (const [index, event] of snapshot.events.entries()) {
    expect(event.sequence).toBe(index + 1)
    expect(event.mode).toBe(speaking ? 'speaking' : 'companion')
    expect(event.direction).toBe(direction)
    expect(starts.some((start) => start.turnId === event.turnId)).toBe(true)
    expect(event.sequence).toBeGreaterThanOrEqual(
      starts.find((start) => start.turnId === event.turnId)!.sequence,
    )
    const previous = snapshot.events[index - 1]
    if (previous) expect(event.elapsedMs).toBeGreaterThanOrEqual(previous.elapsedMs)
  }
  for (const start of starts) {
    const events = snapshot.events.filter((e) => e.turnId === start.turnId)
    const ends = events.filter((e) => e.event === 'turn_ended')
    expect(ends).toHaveLength(1)
    const end = ends[0]!
    const cancelled = start.input === 'microphone' && microphoneEnd !== 'ok'
    expect([end.status, end.reason]).toEqual(
      cancelled ? ['cancelled', microphoneEnd] : ['ok', 'none'],
    )
    // Root terminal chặn việc mới; child đã bắt đầu có thể giao headers/end muộn.
    for (const late of events.filter((e) => e.sequence > end.sequence))
      expect(['response_headers', 'request_ended', 'playback_ended']).toContain(late.event)
  }
  const requests = snapshot.events.filter((e) => e.event === 'request_started')
  const actual = await f.snapshot()
  expect(new Set(requests.map((e) => e.requestId)).size).toBe(requests.length)
  for (const child of snapshot.events.filter((event) => 'requestId' in event))
    expect(
      requests.some(
        (request) => request.requestId === child.requestId && request.turnId === child.turnId,
      ),
    ).toBe(true)
  for (const stage of STAGES) {
    const expectedCount = stage === 'audio_download' ? 0 : actual.apiStarted[stage]
    expect(requests.filter((e) => e.stage === stage)).toHaveLength(expectedCount)
  }
  for (const request of requests) {
    expect(request.attempt).toBe(1)
    const children = snapshot.events.filter(
      (e) => 'requestId' in e && e.requestId === request.requestId,
    )
    const headers = children.filter((e) => e.event === 'response_headers')
    const ends = children.filter((e) => e.event === 'request_ended')
    expect(headers).toHaveLength(1)
    expect(ends).toHaveLength(1)
    expect(headers[0]!.sequence).toBeGreaterThan(request.sequence)
    expect(ends[0]!.sequence).toBeGreaterThan(headers[0]!.sequence)
    expect([ends[0]!.status, ends[0]!.reason]).toEqual(
      request.stage === 'tts' ? ['error', 'http'] : ['ok', 'none'],
    )
    for (const child of children) expect(child.turnId).toBe(request.turnId)
  }
  const playbacks = snapshot.events.filter((e) => e.event === 'playback_requested')
  expect(playbacks).toHaveLength(actual.apiStarted.tts * 2)
  for (const kind of ['html_audio', 'web_speech'])
    expect(playbacks.filter((event) => event.kind === kind)).toHaveLength(actual.apiStarted.tts)
  expect(new Set(playbacks.map((e) => e.playbackId)).size).toBe(playbacks.length)
  for (const playback of playbacks) {
    const ends = snapshot.events.filter(
      (e): e is Extract<VoiceEvent, { event: 'playback_ended' }> =>
        e.event === 'playback_ended' && e.playbackId === playback.playbackId,
    )
    expect(ends).toHaveLength(1)
    expect(ends[0]!.turnId).toBe(playback.turnId)
    expect(ends[0]!.sequence).toBeGreaterThan(playback.sequence)
    expect([ends[0]!.status, ends[0]!.reason]).toEqual(
      playback.kind === 'html_audio' ? ['error', 'unknown'] : ['ok', 'none'],
    )
    expect(playback.segment).toBe('speech')
  }
  for (const child of snapshot.events.filter((event) => 'playbackId' in event))
    expect(
      playbacks.some(
        (playback) => playback.playbackId === child.playbackId && playback.turnId === child.turnId,
      ),
    ).toBe(true)
  expect(snapshot.events.filter((e) => e.event === 'cache_observed').map((e) => e.cache)).toEqual(
    Array.from({ length: actual.apiStarted.tts }, () => 'local_miss'),
  )
  expect(
    snapshot.events.filter((e) => e.event === 'fallback' && e.path === 'server_tts_to_web_speech'),
  ).toHaveLength(actual.apiStarted.tts)
  expect(
    snapshot.events.filter((e) => e.event === 'fallback' && e.path === 'server_stt_to_browser'),
  ).toHaveLength(f.options.flow === 'speaking-native-B' ? 1 : 0)
  for (const fallback of snapshot.events.filter((event) => event.event === 'fallback'))
    expect(fallback.reason).toBe(
      fallback.path === 'server_stt_to_browser' ? 'unsupported' : 'unknown',
    )
  // Fixture hiện hữu không dispatch WebSpeech onstart; không dựng proxy để tính latency.
  expect(snapshot.events.filter((e) => e.event === 'playback_started_proxy')).toEqual([])
  expect(snapshot.events.filter((e) => e.event === 'capture_stopped')).toHaveLength(
    f.options.pending ? 0 : 1,
  )
  expect(snapshot.events.filter((e) => e.event === 'capture_stop_requested')).toHaveLength(
    f.options.pending ? 0 : 1,
  )
  expect(
    snapshot.events.filter((event) => event.event === 'text_ready' && event.stage === 'assistant'),
  ).toHaveLength(actual.apiStarted.agent + actual.apiStarted.companion)
  expect(
    snapshot.events.filter((event) => event.event === 'text_ready' && event.stage === 'stt'),
  ).toHaveLength(f.options.pending ? 0 : 1)
  expect(snapshot.events.filter((e) => e.event === 'first_body_chunk')).toHaveLength(
    speaking || f.options.pending ? 0 : 1,
  )
  await f.assertFingerprints()
  for (const module of [
    '/src/lib/voiceMetricsLocal.ts',
    '/src/lib/voiceMetrics.ts',
    '/src/lib/tts.ts',
    '/src/lib/sttServer.ts',
    speaking ? '/src/pages/subjects/english/Speaking.tsx' : '/src/pages/companion/Companion.tsx',
  ])
    expect(f.moduleRequests.has(module)).toBe(true)
  if (f.options.flow === 'speaking-native-B')
    expect(f.moduleRequests.has('/src/lib/stt.ts')).toBe(true)
  return snapshot
}

declare global {
  interface Window {
    __voiceMetricsCaptureBoundary: {
      retain(): number
      emitRetained(): Promise<number>
    }
  }
}
// Chỉ bọc constructor THIẾT BỊ FAKE hiện hữu sau navigation; không chạm module/reader sản phẩm.
export async function installRetainedCapture(page: Page, native: boolean) {
  await page.evaluate(
    ({ native, lateText, lateError }) => {
      const key = native ? 'SpeechRecognition' : 'MediaRecorder'
      const descriptor = Object.getOwnPropertyDescriptor(window, key)
      const constructor: unknown = descriptor?.value
      if (!descriptor?.configurable || typeof constructor !== 'function')
        throw new Error('MISSING_EXISTING_FAKE_CAPTURE_CONSTRUCTOR')
      let instance: object | undefined
      const retained: { callback: (...args: unknown[]) => unknown; args: unknown[] }[] = []
      Object.defineProperty(window, key, {
        ...descriptor,
        value: new Proxy(constructor, {
          construct(target, args, newTarget) {
            const value: object = Reflect.construct(target, args, newTarget)
            instance = value
            return value
          },
        }),
      })
      window.__voiceMetricsCaptureBoundary = {
        retain() {
          if (!instance || retained.length) throw new Error('INVALID_RETAIN_PHASE')
          const callbacks: { key: string; args: unknown[] }[] = native
            ? [
                {
                  key: 'onresult',
                  args: [{ results: [{ 0: { transcript: lateText }, isFinal: true }] }],
                },
                { key: 'onerror', args: [{ error: lateError }] },
                { key: 'onend', args: [] },
              ]
            : [
                { key: 'ondataavailable', args: [{ data: new Blob(['PRIVATE_AUDIO_CANARY']) }] },
                { key: 'onstop', args: [] },
              ]
          for (const entry of callbacks) {
            const callback: unknown = Reflect.get(instance, entry.key)
            if (typeof callback !== 'function') throw new Error('MISSING_ACTUAL_CAPTURE_CALLBACK')
            retained.push({
              callback: (...args) => Reflect.apply(callback, instance, args),
              args: entry.args,
            })
          }
          return retained.length
        },
        async emitRetained() {
          if (!retained.length) throw new Error('MISSING_RETAINED_CAPTURE_CALLBACKS')
          let delivered = 0
          for (const { callback, args } of retained) {
            delivered++
            await callback(...args)
          }
          return delivered
        },
      }
    },
    { native, lateText: LATE_TEXT, lateError: LATE_ERROR },
  )
}

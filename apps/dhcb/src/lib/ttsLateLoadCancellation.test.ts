// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  getAudioEntry: vi.fn(),
  synthesized: [] as string[],
  networkFailures: [] as string[],
  expectedHttp: 0,
}))
vi.mock('@core/authHeader', () => ({
  getStoredToken: () => 'session:synthetic',
  getAuthHeader: () => ({}),
}))
vi.mock('./audioCache', () => ({
  audioCacheKey: (text: string, lang: string, voice: string) => `${lang}:${voice}:${text}`,
  getAudioEntry: state.getAudioEntry,
  setAudioBuffer: vi.fn(),
}))
vi.mock('./storage', () => ({ touchSettingsUpdated: vi.fn() }))
vi.mock('./voiceTiers', () => ({
  VOICE_OPTIONS: [{ id: 'Kore', gender: 'female' }],
  DEFAULT_VOICE: 'Kore',
  DEFAULT_MALE_VOICE: 'Puck',
  STUDIO_VOICE_IDS: [],
  ELEVEN_VOICE_IDS: [],
  GEMINI_VOICE_IDS: [],
  RANDOM_EXCLUDED_VOICES: new Set<string>(),
  isValidVoiceId: () => true,
  isKnownVoiceId: () => true,
  clampVoiceToAllowed: (voice: string) => voice,
  defaultVoiceForGender: () => 'Kore',
  voiceGender: () => 'female',
  getCachedAllowedVoices: () => ['Kore'],
}))
class FakeAudio {
  static plays = 0
  static rejectNextPlay = false
  src = ''
  playbackRate = 1
  preservesPitch = true
  currentTime = 0
  duration = 1
  preload = ''
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeupdate: (() => void) | null = null
  onloadedmetadata: (() => void) | null = null
  play() {
    FakeAudio.plays++
    if (FakeAudio.rejectNextPlay) {
      FakeAudio.rejectNextPlay = false
      return Promise.reject(new Error('synthetic-play-error'))
    }
    queueMicrotask(() => this.onended?.())
    return Promise.resolve()
  }
  pause() {}
}
class FakeUtterance {
  lang = ''
  rate = 1
  voice = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  onboundary: (() => void) | null = null
  constructor(readonly text: string) {}
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const cached = () => ({ buffer: new ArrayBuffer(8), timeline: null })
async function settleTasks() {
  for (let i = 0; i < 30; i++) await Promise.resolve()
}
async function startHeld(source: 'cache' | 'request', bilingual = false) {
  const heldCache = deferred<ReturnType<typeof cached> | null>()
  const heldFetch = deferred<Response>()
  if (source === 'cache') state.getAudioEntry.mockReturnValueOnce(heldCache.promise)
  else {
    state.expectedHttp = 1
    state.getAudioEntry.mockResolvedValueOnce(null)
    vi.stubGlobal(
      'fetch',
      vi.fn(() => heldFetch.promise),
    )
  }
  const api = await import('./tts')
  const promise = bilingual
    ? api.speakBilingual(
        'synthetic old speech',
        'synthetic feedback',
        'en-US',
        'vi-VN',
        'Kore',
        1,
        undefined,
        undefined,
        'Kore',
      )
    : api.speak('synthetic old speech', 'en-US', 'Kore', 1)
  await settleTasks()
  expect(state.getAudioEntry).toHaveBeenCalledTimes(1)
  expect(fetch).toHaveBeenCalledTimes(source === 'request' ? 1 : 0)
  if (source === 'request')
    expect(fetch).toHaveBeenCalledWith(
      '/api/tts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'synthetic old speech', lang: 'en-US', voice: 'Kore' }),
      }),
    )
  return {
    api,
    promise,
    fail: () =>
      source === 'cache'
        ? heldCache.reject(new Error('synthetic-cache-error'))
        : heldFetch.reject(new Error('synthetic-network-error')),
    succeed: () => heldCache.resolve(cached()),
  }
}
beforeEach(() => {
  vi.resetModules()
  state.getAudioEntry.mockReset().mockResolvedValue(cached())
  state.synthesized.length = 0
  state.networkFailures.length = 0
  state.expectedHttp = 0
  FakeAudio.plays = 0
  FakeAudio.rejectNextPlay = false
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      state.networkFailures.push('unexpected_http')
      throw new Error('UNEXPECTED_NETWORK')
    }),
  )
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    getVoices: () => [],
    speak: (utterance: FakeUtterance) => {
      state.synthesized.push(utterance.text)
      queueMicrotask(() => utterance.onend?.())
    },
  })
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL() {
        return 'blob:synthetic'
      }
      static revokeObjectURL() {}
    },
  )
})
afterEach(() => {
  expect(state.networkFailures).toEqual([])
  expect(fetch).toHaveBeenCalledTimes(state.expectedHttp)
  vi.unstubAllGlobals()
})

describe('S06a API phát thật, giả lập tại biên audio/cache/HTTP', () => {
  it.each(['reject', 'resolve'] as const)(
    'tải cũ %s khi lượt mới còn chờ không được phát hoặc chiếm vé lượt mới',
    async (completion) => {
      const old = await startHeld('cache')
      const newer = deferred<ReturnType<typeof cached>>()
      state.getAudioEntry.mockReturnValueOnce(newer.promise)
      const current = old.api.speak('synthetic replacement', 'en-US', 'Kore', 1)
      await settleTasks()
      expect(state.getAudioEntry).toHaveBeenCalledTimes(2)
      if (completion === 'reject') old.fail()
      else old.succeed()
      await old.promise
      const beforeCurrentLoad = {
        plays: FakeAudio.plays,
        synthesized: [...state.synthesized],
      }
      newer.resolve(cached())
      await current
      expect(beforeCurrentLoad).toEqual({ plays: 0, synthesized: [] })
      expect(FakeAudio.plays).toBe(1)
      expect(state.synthesized).toEqual([])
      expect(state.getAudioEntry).toHaveBeenCalledTimes(2)
    },
  )

  it.each(['cache', 'request'] as const)('stop rồi %s reject: không WebSpeech', async (source) => {
    const held = await startHeld(source)
    held.api.stopSpeaking()
    held.fail()
    await expect(held.promise).resolves.toBeTypeOf('number')
    expect(state.synthesized).toEqual([])
    expect(FakeAudio.plays).toBe(0)
  })
  it.each(['cache', 'request'] as const)(
    'bilingual stop rồi %s reject: không WebSpeech/feedback',
    async (source) => {
      const held = await startHeld(source, true)
      held.api.stopSpeaking()
      held.fail()
      await held.promise
      expect(state.synthesized).toEqual([])
      expect(FakeAudio.plays).toBe(0)
      expect(state.getAudioEntry).toHaveBeenCalledTimes(1)
    },
  )
  it.each(['cache', 'request'] as const)(
    'replacement đã phát, %s cũ reject: không WebSpeech',
    async (source) => {
      const held = await startHeld(source)
      await held.api.speak('synthetic replacement', 'en-US', 'Kore', 1)
      held.fail()
      await held.promise
      expect(state.synthesized).toEqual([])
      expect(FakeAudio.plays).toBe(1)
    },
  )
  it.each(['cache', 'request'] as const)(
    'replacement của bilingual, %s cũ reject: không feedback',
    async (source) => {
      const held = await startHeld(source, true)
      await held.api.speak('synthetic replacement', 'en-US', 'Kore', 1)
      held.fail()
      await held.promise
      expect(state.synthesized).toEqual([])
      expect(FakeAudio.plays).toBe(1)
      expect(state.getAudioEntry).toHaveBeenCalledTimes(2)
    },
  )
  it.each(['cache', 'request'] as const)('%s active reject vẫn fallback', async (source) => {
    const held = await startHeld(source)
    held.fail()
    await held.promise
    expect(state.synthesized).toEqual(['synthetic old speech'])
    expect(FakeAudio.plays).toBe(0)
  })
  it('lỗi play đang hoạt động sau khi nhận vé riêng vẫn có giọng dự phòng', async () => {
    const api = await import('./tts')
    FakeAudio.rejectNextPlay = true
    await api.speak('synthetic play-error', 'en-US', 'Kore', 1)
    expect(FakeAudio.plays).toBe(1)
    expect(state.synthesized).toEqual(['synthetic play-error'])
  })
  it('tải thành công sau hủy vẫn không phát', async () => {
    const held = await startHeld('cache')
    held.api.stopSpeaking()
    held.succeed()
    await held.promise
    expect(FakeAudio.plays).toBe(0)
    expect(state.synthesized).toEqual([])
  })
  it('tải thành công đang hoạt động chỉ phát một lần', async () => {
    const api = await import('./tts')
    await api.speak('synthetic success', 'en-US', 'Kore', 1)
    expect(FakeAudio.plays).toBe(1)
    expect(state.synthesized).toEqual([])
  })
})

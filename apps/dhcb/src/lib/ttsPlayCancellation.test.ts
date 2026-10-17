// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({
  cache: vi.fn(),
  synthesized: [] as string[],
  failures: [] as string[],
}))
vi.mock('@core/authHeader', () => ({
  getStoredToken: () => 'synthetic',
  getAuthHeader: () => ({}),
}))
vi.mock('./audioCache', () => ({
  audioCacheKey: (text: string) => text,
  getAudioEntry: state.cache,
  setAudioBuffer: vi.fn(),
}))
vi.mock('./storage', () => ({ touchSettingsUpdated: vi.fn() }))
vi.mock('./sharedAudio', () => ({
  getSharedAudio: () => audio,
  peekSharedAudio: () => audio,
  unlockAudio: vi.fn(),
}))
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
  clampVoiceToAllowed: (value: string) => value,
  defaultVoiceForGender: () => 'Kore',
  voiceGender: () => 'female',
  getCachedAllowedVoices: () => ['Kore'],
}))
function deferred() {
  let reject!: (reason: Error) => void
  return {
    promise: new Promise<void>((_yes, no) => {
      reject = no
    }),
    reject: (reason: Error) => reject(reason),
  }
}
class HeldAudio {
  src = ''
  playbackRate = 1
  preservesPitch = true
  duration = 1
  currentTime = 0
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  onplaying: (() => void) | null = null
  ontimeupdate: (() => void) | null = null
  onloadedmetadata: (() => void) | null = null
  readonly calls: ReturnType<typeof deferred>[] = []
  get currentSrc() {
    return this.src
  }
  pause() {}
  play() {
    const pending = deferred()
    this.calls.push(pending)
    return pending.promise
  }
}
class Utterance {
  lang = ''
  rate = 1
  voice = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(readonly text: string) {}
}
let audio = new HeldAudio()
async function settle() {
  for (let i = 0; i < 50; i++) await Promise.resolve()
}
beforeEach(() => {
  vi.resetModules()
  audio = new HeldAudio()
  state.synthesized.length = 0
  state.failures.length = 0
  state.cache.mockReset().mockResolvedValue({ buffer: new ArrayBuffer(8), timeline: null })
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {} })
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  vi.stubGlobal('speechSynthesis', {
    cancel() {},
    getVoices: () => [],
    speak: (utterance: Utterance) => {
      state.synthesized.push(utterance.text)
      queueMicrotask(() => utterance.onend?.())
    },
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      state.failures.push('unexpected_http')
      throw new Error('UNEXPECTED_NETWORK')
    }),
  )
  let blob = 0
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL() {
        return `blob:synthetic-${++blob}`
      }
      static revokeObjectURL() {}
    },
  )
})
afterEach(() => {
  expect(state.failures).toEqual([])
  vi.unstubAllGlobals()
})
describe('API phát thật với lỗi HTMLAudio.play trả về muộn', () => {
  it('đối chứng: lỗi play đang hoạt động vẫn dùng giọng dự phòng đúng một lần', async () => {
    const api = await import('./tts')
    const pending = api.speak('synthetic active', 'en-US', 'Kore', 1)
    await settle()
    expect(audio.calls).toHaveLength(1)
    audio.calls[0]?.reject(new Error('synthetic-play-failed'))
    await pending
    await settle()
    expect(state.synthesized).toEqual(['synthetic active'])
    expect(audio.calls).toHaveLength(1)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('hủy giải phóng lượt cũ trước lỗi play muộn, không đọc dự phòng hay giải thích', async () => {
    const api = await import('./tts')
    const pending = api.speakBilingual(
      'synthetic old',
      'synthetic feedback',
      'en-US',
      'vi-VN',
      'Kore',
      1,
      undefined,
      undefined,
      'Kore',
    )
    await settle()
    expect(audio.calls).toHaveLength(1)
    api.stopSpeaking()
    await pending
    audio.calls[0]?.reject(new Error('synthetic-late-play-failed'))
    await settle()
    expect(state.synthesized).toEqual([])
    expect(audio.calls).toHaveLength(1)
    expect(state.cache).toHaveBeenCalledTimes(1)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('lượt mới giải phóng lượt cũ, lỗi play cũ không làm gián đoạn lượt mới', async () => {
    const api = await import('./tts')
    const old = api.speakBilingual(
      'synthetic old',
      'synthetic feedback',
      'en-US',
      'vi-VN',
      'Kore',
      1,
      undefined,
      undefined,
      'Kore',
    )
    await settle()
    const current = api.speak('synthetic new', 'en-US', 'Kore', 1)
    await settle()
    expect(audio.calls).toHaveLength(2)
    audio.calls[0]?.reject(new Error('synthetic-old-play-failed'))
    await settle()
    expect(audio.onended).toBeTypeOf('function')
    audio.onended?.()
    await Promise.all([old, current])
    await settle()
    expect(state.synthesized).toEqual([])
    expect(audio.calls).toHaveLength(2)
    expect(state.cache).toHaveBeenCalledTimes(2)
    expect(fetch).not.toHaveBeenCalled()
  })
})

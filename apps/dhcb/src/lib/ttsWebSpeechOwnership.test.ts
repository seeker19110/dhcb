// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  cache: vi.fn(),
  synthesized: [] as string[],
  boundaryFailures: [] as string[],
}))
vi.mock('@core/authHeader', () => ({
  getStoredToken: () => 'synthetic-session',
  getAuthHeader: () => ({}),
}))
vi.mock('./audioCache', () => ({
  audioCacheKey: () => 'synthetic-key',
  getAudioEntry: state.cache,
  setAudioBuffer: vi.fn(),
}))
vi.mock('./storage', () => ({ touchSettingsUpdated: vi.fn() }))
vi.mock('./sharedAudio', () => ({
  peekSharedAudio: () => null,
  unlockAudio: vi.fn(),
  getSharedAudio: () => {
    state.boundaryFailures.push('unexpected_audio')
    throw new Error('UNEXPECTED_AUDIO')
  },
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
  clampVoiceToAllowed: (voice: string) => voice,
  defaultVoiceForGender: () => 'Kore',
  voiceGender: () => 'female',
  getCachedAllowedVoices: () => ['Kore'],
}))
class FakeUtterance {
  lang = ''
  rate = 1
  voice = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  onboundary: ((event: { name: string; charIndex: number }) => void) | null = null
  constructor(readonly text: string) {}
}
let held: FakeUtterance | null = null
let cancelEvent: 'onend' | 'onerror' = 'onerror'
async function settle() {
  for (let i = 0; i < 40; i++) await Promise.resolve()
}
beforeEach(() => {
  vi.resetModules()
  state.synthesized.length = 0
  state.boundaryFailures.length = 0
  state.cache.mockReset().mockRejectedValue(new Error('synthetic-active-cache-error'))
  held = null
  cancelEvent = 'onerror'
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      state.boundaryFailures.push('unexpected_http')
      throw new Error('UNEXPECTED_NETWORK')
    }),
  )
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [],
    cancel: () => {
      const previous = held
      held = null
      previous?.[cancelEvent]?.()
    },
    speak: (utterance: FakeUtterance) => {
      state.synthesized.push(utterance.text)
      if (utterance.text === 'synthetic speech') {
        held = utterance
        utterance.onstart?.()
      } else
        queueMicrotask(() => {
          utterance.onstart?.()
          utterance.onend?.()
        })
    },
  })
})
afterEach(() => {
  expect(state.boundaryFailures).toEqual([])
  vi.unstubAllGlobals()
})

async function startBilingual(onSpeechWord?: (index: number) => void) {
  const api = await import('./tts')
  const promise = api.speakBilingual(
    'synthetic speech',
    'synthetic feedback',
    'en-US',
    'vi-VN',
    'Kore',
    1,
    onSpeechWord,
    undefined,
    'Kore',
  )
  await settle()
  expect(state.synthesized).toEqual(['synthetic speech'])
  return { api, promise }
}
describe('Quyền sở hữu lượt đọc song ngữ với Web Speech, hoàn toàn offline', () => {
  it.each(['onerror', 'onend'] as const)(
    'hủy Web Speech qua %s không được đọc phần giải thích',
    async (event) => {
      cancelEvent = event
      const f = await startBilingual()
      f.api.stopSpeaking()
      await f.promise
      await settle()
      expect(state.synthesized).toEqual(['synthetic speech'])
      expect(state.cache).toHaveBeenCalledTimes(1)
      expect(fetch).not.toHaveBeenCalled()
    },
  )
  it('đối chứng: kết thúc bình thường vẫn đọc phần giải thích', async () => {
    const onWord = vi.fn()
    const f = await startBilingual(onWord)
    held?.onboundary?.({ name: 'word', charIndex: 0 })
    expect(onWord).toHaveBeenCalledExactlyOnceWith(0)
    const previous = held
    held = null
    previous?.onend?.()
    await f.promise
    await settle()
    expect(state.synthesized).toEqual(['synthetic speech', 'synthetic feedback'])
    expect(state.cache).toHaveBeenCalledTimes(2)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('lượt đọc dự phòng mới phải hủy phần giải thích của lượt song ngữ cũ', async () => {
    const f = await startBilingual()
    await f.api.speak('synthetic replacement', 'en-US', 'Kore', 1)
    await f.promise
    await settle()
    expect(state.synthesized).toEqual(['synthetic speech', 'synthetic replacement'])
    expect(state.cache).toHaveBeenCalledTimes(2)
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each(['stop', 'replacement'] as const)(
    'callback từ đến muộn sau %s không được cập nhật karaoke cũ',
    async (action) => {
      const onWord = vi.fn()
      const f = await startBilingual(onWord)
      const previous = held
      if (action === 'stop') f.api.stopSpeaking()
      else await f.api.speak('synthetic replacement', 'en-US', 'Kore', 1)
      await f.promise
      await settle()
      previous?.onboundary?.({ name: 'word', charIndex: 0 })
      expect(onWord).not.toHaveBeenCalled()
    },
  )
})

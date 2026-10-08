// Test generateAudioFromElevenLabs (packages/core-ai/elevenLabsTts.ts) — mock fetch toàn cục,
// KHÔNG gọi ElevenLabs thật (tốn tiền). Trọng tâm: thiếu API key, HTTP lỗi, JSON hỏng, và
// alignment hợp lệ/không hợp lệ.

import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  ELEVEN_VOICES,
  ELEVEN_VOICE_IDS,
  elevenVoiceGender,
  generateAudioFromElevenLabs,
  isValidElevenVoice,
  hasElevenLabsKey,
} from './elevenLabsTts.js'

const OLD_KEY = process.env.ELEVENLABS_API_KEY

afterEach(() => {
  vi.unstubAllGlobals()
  if (OLD_KEY === undefined) delete process.env.ELEVENLABS_API_KEY
  else process.env.ELEVENLABS_API_KEY = OLD_KEY
})

describe('isValidElevenVoice / hasElevenLabsKey', () => {
  it('mọi giọng trong bảng đều hợp lệ, tên lạ thì không', () => {
    for (const v of ELEVEN_VOICE_IDS) expect(isValidElevenVoice(v)).toBe(true)
    expect(isValidElevenVoice('Khong-Ton-Tai')).toBe(false)
  })

  it('không bị lọt tên thuộc tính của Object.prototype', () => {
    expect(isValidElevenVoice('toString')).toBe(false)
    expect(isValidElevenVoice('constructor')).toBe(false)
    expect(isValidElevenVoice('__proto__')).toBe(false)
  })

  it('6 giọng: voice_id không trùng, nữ đứng trước nam, 3 nữ + 3 nam', () => {
    const ids = ELEVEN_VOICE_IDS.map((v) => ELEVEN_VOICES[v].voiceId)
    expect(new Set(ids).size).toBe(ELEVEN_VOICE_IDS.length)
    expect(ELEVEN_VOICE_IDS).toHaveLength(6)
    const genders = ELEVEN_VOICE_IDS.map(elevenVoiceGender)
    expect(genders).toEqual(['female', 'female', 'female', 'male', 'male', 'male'])
  })

  it('giữ nguyên voice_id của Rachel — đổi là nghe sai giọng với audio đã cache', () => {
    expect(ELEVEN_VOICES.Rachel.voiceId).toBe('21m00Tcm4TlvDq8ikWAM')
  })

  it('hasElevenLabsKey phản ánh đúng biến môi trường', () => {
    process.env.ELEVENLABS_API_KEY = 'k'
    expect(hasElevenLabsKey()).toBe(true)
    delete process.env.ELEVENLABS_API_KEY
    expect(hasElevenLabsKey()).toBe(false)
    process.env.ELEVENLABS_API_KEY = '   '
    expect(hasElevenLabsKey()).toBe(false)
  })
})

describe('generateAudioFromElevenLabs', () => {
  it('thiếu ELEVENLABS_API_KEY → throw ngay, không gọi fetch', async () => {
    delete process.env.ELEVENLABS_API_KEY
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    await expect(generateAudioFromElevenLabs('hello')).rejects.toThrow(
      /chưa cấu hình ELEVENLABS_API_KEY/,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('gọi đúng voice_id của từng giọng; không truyền giọng thì dùng Rachel', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        urls.push(String(input))
        return new Response(JSON.stringify({ audio_base64: Buffer.from('a').toString('base64') }), {
          status: 200,
        })
      }),
    )
    for (const voice of ELEVEN_VOICE_IDS) {
      await generateAudioFromElevenLabs('hi', voice)
      expect(urls.at(-1)).toContain(
        `/v1/text-to-speech/${ELEVEN_VOICES[voice].voiceId}/with-timestamps`,
      )
    }
    await generateAudioFromElevenLabs('hi')
    expect(urls.at(-1)).toContain(ELEVEN_VOICES.Rachel.voiceId)
    expect(urls).toHaveLength(ELEVEN_VOICE_IDS.length + 1)
  })

  it('thành công kèm alignment hợp lệ → trả audio + alignment', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    const audioBase64 = Buffer.from('fake-mp3-bytes').toString('base64')
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              audio_base64: audioBase64,
              alignment: {
                characters: ['h', 'i'],
                character_start_times_seconds: [0, 0.1],
                character_end_times_seconds: [0.1, 0.2],
              },
            }),
            { status: 200 },
          ),
      ),
    )
    const result = await generateAudioFromElevenLabs('hi')
    expect(Buffer.from(result.audio).toString()).toBe('fake-mp3-bytes')
    expect(result.alignment?.characters).toEqual(['h', 'i'])
  })

  it('thành công nhưng alignment sai cấu trúc (mảng không khớp độ dài) → alignment null', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    const audioBase64 = Buffer.from('abc').toString('base64')
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              audio_base64: audioBase64,
              alignment: { characters: ['h', 'i'], character_start_times_seconds: [0] },
            }),
            { status: 200 },
          ),
      ),
    )
    const result = await generateAudioFromElevenLabs('hi')
    expect(result.alignment).toBeNull()
  })

  it('thành công, không có trường alignment → alignment null', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    const audioBase64 = Buffer.from('abc').toString('base64')
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ audio_base64: audioBase64 }), { status: 200 }),
      ),
    )
    const result = await generateAudioFromElevenLabs('hi')
    expect(result.alignment).toBeNull()
  })

  it('HTTP lỗi (4xx/5xx) → throw kèm mã lỗi', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('quota exceeded', { status: 429 })),
    )
    await expect(generateAudioFromElevenLabs('hi')).rejects.toThrow(/ElevenLabs TTS lỗi \(429\)/)
  })

  it('HTTP 200 nhưng thiếu audio_base64 → throw', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })),
    )
    await expect(generateAudioFromElevenLabs('hi')).rejects.toThrow(/thiếu audio_base64/)
  })

  it('HTTP 200 nhưng audio_base64 rỗng → throw', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ audio_base64: '' }), { status: 200 })),
    )
    await expect(generateAudioFromElevenLabs('hi')).rejects.toThrow(/thiếu audio_base64/)
  })

  it('fetch reject (lỗi mạng/timeout) → throw truyền nguyên lỗi', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    await expect(generateAudioFromElevenLabs('hi')).rejects.toThrow(/network down/)
  })
})

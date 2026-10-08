// api/_lib/elevenLabsTts.ts
// Gọi ElevenLabs Text-to-Speech để tạo giọng "VIP" đặc biệt (khác 14 giọng Chirp3-HD
// của Google ở googleTts.ts). CHỈ chạy ở server — không import từ code phía browser (src/).
//
// Cần biến môi trường ELEVENLABS_API_KEY (đăng ký tại elevenlabs.io). Chưa có key thì
// mọi request chọn giọng ElevenLabs sẽ lỗi rõ ràng — client (src/lib/tts.ts) tự fallback
// Web Speech API giống các lỗi TTS khác, không crash app.

import { fetchWithTimeout } from '@dhcb/core-http/fetchTimeout'

const TTS_TIMEOUT_MS = 30_000
const ELEVENLABS_MODEL = 'eleven_multilingual_v2'

// Bảng giọng ElevenLabs: tên hiển thị trong app → voice_id THẬT của ElevenLabs + giới tính.
// Gọi qua model eleven_multilingual_v2 nên đọc được cả tiếng Việt (chất lượng tiếng Việt chưa
// kiểm định kỹ, coi là thử nghiệm).
//
// voice_id của 5 giọng mới lấy từ danh sách giọng "premade" công khai của ElevenLabs
// (GET https://api.elevenlabs.io/v1/voices, kiểm lúc thêm 2026-10-08) — mọi tài khoản đều dùng
// được, kể cả gói miễn phí. Muốn thêm giọng: thêm 1 dòng ở đây, rồi thêm CÙNG tên vào
// apps/dhcb/src/lib/voiceTiers.ts (VoiceId + VOICE_OPTIONS + ELEVEN_VOICE_IDS).
// ⚠️ Rachel là giọng đầu tiên (không còn trong danh sách premade hiện hành) — GIỮ NGUYÊN để
// không mất audio đã cache; nghe thử/đổi nếu ElevenLabs báo lỗi voice không tồn tại.
// ⚠️ Khoá cache audio gồm TÊN giọng — KHÔNG đổi voice_id của một tên đã có audio cache (nghe sai
// giọng); muốn đổi giọng thì đặt tên mới.
export const ELEVEN_VOICES = {
  Rachel: { voiceId: '21m00Tcm4TlvDq8ikWAM', gender: 'female' },
  Alice: { voiceId: 'Xb7hH8MSUJpSbSDYk0k2', gender: 'female' },
  Matilda: { voiceId: 'XrExE9yKIg1WjnnlVkGX', gender: 'female' },
  Eric: { voiceId: 'cjVigY5qzO86Huf0OWal', gender: 'male' },
  Daniel: { voiceId: 'onwK4e9ZLuTAKqWW03F9', gender: 'male' },
  Chris: { voiceId: 'iP95p4xoKVk53GoZ742B', gender: 'male' },
} as const satisfies Record<string, { voiceId: string; gender: 'female' | 'male' }>

export type ElevenVoiceId = keyof typeof ELEVEN_VOICES
// Thứ tự cố định: nữ trước, nam sau (khớp ELEVEN_VOICE_IDS ở apps/dhcb/src/lib/voiceTiers.ts).
export const ELEVEN_VOICE_IDS = Object.keys(ELEVEN_VOICES) as ElevenVoiceId[]

export function isValidElevenVoice(value: string): value is ElevenVoiceId {
  return Object.hasOwn(ELEVEN_VOICES, value)
}

export function elevenVoiceGender(voice: ElevenVoiceId): 'female' | 'male' {
  return ELEVEN_VOICES[voice].gender
}

export function hasElevenLabsKey(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim())
}

// Mốc thời gian THẬT của từng ký tự trong audio, do chính model vừa sinh ra audio trả về.
// Đây là dữ liệu chính xác nhất có thể để đồng bộ khẩu hình avatar — khác hẳn cách ước lượng
// chia đều theo âm tiết ở src/lib/viseme.ts.
export interface ElevenAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

export interface ElevenAudioResult {
  audio: ArrayBuffer
  // null khi provider không trả alignment (đổi model, lỗi dữ liệu) — gọi được vẫn coi là thành
  // công, chỉ mất phần timing thật.
  alignment: ElevenAlignment | null
}

function decodeBase64Audio(base64: string): ArrayBuffer {
  const binary = Buffer.from(base64, 'base64')
  // Cắt đúng vùng byte của Buffer này (Buffer có thể dùng chung pool bộ nhớ với buffer khác).
  return binary.buffer.slice(
    binary.byteOffset,
    binary.byteOffset + binary.byteLength,
  ) as ArrayBuffer
}

function isAlignment(value: unknown): value is ElevenAlignment {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    Array.isArray(v.characters) &&
    Array.isArray(v.character_start_times_seconds) &&
    Array.isArray(v.character_end_times_seconds) &&
    v.characters.length === v.character_start_times_seconds.length &&
    v.characters.length === v.character_end_times_seconds.length
  )
}

// Gọi endpoint /with-timestamps: trả audio (base64 trong JSON) KÈM alignment từng ký tự.
// Cùng một lần synthesize như endpoint thường nên KHÔNG tốn thêm ký tự tính phí.
export async function generateAudioFromElevenLabs(
  text: string,
  voice: ElevenVoiceId = 'Rachel',
): Promise<ElevenAudioResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Server chưa cấu hình ELEVENLABS_API_KEY')
  }

  const response = await fetchWithTimeout(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICES[voice].voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
      }),
    },
    TTS_TIMEOUT_MS,
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`ElevenLabs TTS lỗi (${response.status}): ${detail.slice(0, 200)}`)
  }

  const payload = (await response.json()) as Record<string, unknown>
  const base64 = payload.audio_base64
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw new Error('ElevenLabs TTS lỗi: response thiếu audio_base64')
  }

  // `normalized_alignment` khớp với văn bản đã chuẩn hoá của provider (số → chữ...), còn
  // `alignment` khớp với text gốc mình gửi lên — dùng bản gốc để map về từ trong câu.
  const alignment = isAlignment(payload.alignment) ? payload.alignment : null

  return { audio: decodeBase64Audio(base64), alignment }
}

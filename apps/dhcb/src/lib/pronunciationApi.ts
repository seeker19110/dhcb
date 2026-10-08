// lib/pronunciationApi.ts — gọi /api/pronunciation (audio phát âm MỘT từ/cụm từ) cho 2 nút loa
// PronounceButton (Từ điển) và WordVoiceCycleButton (thẻ học từ). Gom vào một chỗ để hai nút xử lý
// CÙNG một cách các trường hợp server trả về, thay vì mỗi nút tự đọc JSON.
//
// Vì sao tách riêng `refused` (2026-10-08, changelog 0534): từ nay cache MISS của endpoint này trừ
// lượt AI Free/VIP như /api/tts. Hết lượt → 429 kèm câu thông báo của server. Trước đây hai nút
// gộp MỌI lỗi vào một nhánh `console.error` + Web Speech, nên người học chỉ nghe giọng đổi khác
// mà không biết vì sao — đúng kiểu "nuốt lỗi". Nút vẫn rơi về Web Speech (miễn phí, chạy trên máy)
// để từ vẫn đọc được, nhưng phải HIỆN câu thông báo đó.

import { z } from 'zod'
import { getAuthHeader } from '@core/authHeader'

export type PronunciationLang = 'en-US' | 'vi-VN'

export type PronunciationResult =
  | { kind: 'ok'; audioUrl: string; voice: string | undefined }
  // 429: hết lượt AI hôm nay / cầu dao AI / quá nhiều yêu cầu — server gửi kèm câu đọc được,
  // nơi gọi PHẢI hiện cho người dùng.
  | { kind: 'refused'; message: string }
  // Mọi lỗi còn lại (mạng, 4xx/5xx khác, JSON hỏng) — nơi gọi lặng lẽ rơi về Web Speech như cũ.
  | { kind: 'error'; message: string }

const HTTP_TOO_MANY_REQUESTS = 429

// Dữ liệu từ server là dữ liệu NGOÀI → kiểm bằng Zod (CLAUDE.md mục 4.1).
const ResponseSchema = z.object({
  audio_url: z.string().min(1).optional(),
  voice: z.string().optional(),
  error: z.string().optional(),
})

export async function fetchPronunciation(
  word: string,
  voice: string,
  lang: PronunciationLang,
): Promise<PronunciationResult> {
  let res: Response
  try {
    res = await fetch(
      `/api/pronunciation?word=${encodeURIComponent(word)}&voice=${encodeURIComponent(voice)}&lang=${lang}`,
      { headers: getAuthHeader() },
    )
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : String(err) }
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = null
  }
  const parsed = ResponseSchema.safeParse(body)
  const data = parsed.success ? parsed.data : {}

  if (res.status === HTTP_TOO_MANY_REQUESTS && data.error) {
    return { kind: 'refused', message: data.error }
  }
  if (!res.ok || !data.audio_url) {
    return { kind: 'error', message: data.error ?? `Lỗi ${res.status}` }
  }
  return { kind: 'ok', audioUrl: data.audio_url, voice: data.voice }
}

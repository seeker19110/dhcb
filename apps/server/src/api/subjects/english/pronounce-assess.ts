// api/pronounce-assess.ts — Chấm phát âm CHI TIẾT (từng âm vị) qua Azure AI Speech
// Endpoint: POST /api/pronounce-assess
// Body: { audio_b64: string, referenceText: string }
// Trả về: PronounceAssessmentResult (api/_lib/azurePronounce.ts) — { overall, accuracy,
//   fluency, completeness, words: [{ word, score, errorType, phonemes: [{phoneme, score}] }] }
//
// ① Giai đoạn 2 (docs/research/dac-ta-nang-cap-su-pham-2026-07-15.md) — nâng cấp "Giai đoạn 1"
// (bảng trap client, src/lib/pronounceCoach.ts, vẫn giữ nguyên làm fallback khi hết lượt/lỗi).
// audio_b64 PHẢI là WAV PCM 16kHz mono (client tự convert trước khi gửi — xem PR client kế
// tiếp, src/lib/wav.ts). CHỈ hỗ trợ tiếng Anh (en-US) — Azure chưa có Pronunciation Assessment
// cho vi-VN nên chiều B tiếp tục dùng Giai đoạn 1, KHÔNG gọi endpoint này.
//
// Chưa cấu hình AZURE_SPEECH_KEY/AZURE_SPEECH_REGION → trả 503 kèm `fallback: true` NGAY,
// KHÔNG trừ lượt (giống nhánh hết quota của api/tts.ts) để client tự rơi về Giai đoạn 1.

import { z } from 'zod'
import { resolveAzurePronounceConfig, assessPronunciation } from '@dhcb/core-ai/azurePronounce'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  validateContentType,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp, logInternalError } from '@dhcb/core-http/http'
import { base64ToBytes } from '@dhcb/core-db/base64'

// Giới hạn dung lượng base64 (~4MB chuỗi ≈ ~3MB audio thật) — câu chấm phát âm tối đa ~30s
// (giới hạn Azure short-audio) nên nhẹ hơn nhiều so với STT hội thoại tự do (api/stt.ts).
const MAX_AUDIO_B64 = 4 * 1024 * 1024
const MAX_REFERENCE_TEXT = 500

const PronounceBodySchema = z.object({
  audio_b64: z
    .string({ error: 'Thiếu audio_b64' })
    .trim()
    .min(1, 'Thiếu audio_b64')
    .refine((v) => v.length <= MAX_AUDIO_B64, {
      error: 'Đoạn ghi âm quá dài — nói ngắn hơn (tối đa ~30 giây)',
      params: { status: 413 },
    }),
  referenceText: z
    .string({ error: 'Thiếu referenceText' })
    .trim()
    .min(1, 'Thiếu referenceText')
    .max(MAX_REFERENCE_TEXT, 'referenceText quá dài'),
})

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(req)
  const allHeaders = { ...corsHeaders, ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: allHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  }

  const clientIp = getClientIp(req)

  // Chưa cấu hình → 503 ngay, KHÔNG chạm auth/rate-limit/usage (đỡ query oan, giống tts.ts
  // khi thiếu GOOGLE_TTS_API_KEY). Client thấy `fallback: true` thì tự rơi về Giai đoạn 1.
  const azureConfig = resolveAzurePronounceConfig()
  if (!azureConfig) {
    return jsonResponse(
      { error: 'Chấm phát âm chi tiết chưa được cấu hình', fallback: true },
      503,
      allHeaders,
    )
  }

  if (!validateContentType(req)) {
    logSecurityEvent('INVALID_CONTENT_TYPE', clientIp, { path: '/api/pronounce-assess' })
    return jsonResponse({ error: 'Content-Type phải là application/json' }, 415, allHeaders)
  }

  // Tốn tiền Azure trực tiếp nên giới hạn chặt hơn STT (Groq/OpenAI rẻ hơn nhiều).
  if (!(await checkRateLimit(clientIp, 10))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/pronounce-assess' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const authResult = await validateAuth(req)
  if (!authResult) {
    logSecurityEvent('AUTH_FAILED', clientIp, { path: '/api/pronounce-assess' })
    return jsonResponse({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, 401, allHeaders)
  }

  const bodyResult = await readJsonBody(req)
  if (!bodyResult.ok) {
    return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
  }
  const parsed = validateBody(PronounceBodySchema, bodyResult.raw)
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
  }

  let audio: ArrayBuffer
  try {
    audio = base64ToBytes(parsed.data.audio_b64).buffer as ArrayBuffer
  } catch {
    return jsonResponse({ error: 'audio_b64 không phải base64 hợp lệ' }, 400, allHeaders)
  }

  // Giới hạn lượt chấm phát âm ở SERVER (theo gói Free/Pro) — Azure tốn tiền riêng.
  const gate = await checkAndConsumeUsage(authResult.userId, 'pronounce')
  if (!gate.ok) {
    logSecurityEvent('USAGE_LIMIT', clientIp, { path: '/api/pronounce-assess' })
    return jsonResponse({ error: gate.message, fallback: true }, 429, allHeaders)
  }

  try {
    const result = await assessPronunciation(azureConfig, audio, parsed.data.referenceText)
    return jsonResponse(result, 200, allHeaders)
  } catch (err) {
    // Azure lỗi/timeout → người dùng không nhận được kết quả: hoàn lại lượt vừa trừ.
    await refundUsage(authResult.userId, 'pronounce', gate.day)
    // Lỗi Azure (vùng, khoá, mã lỗi nội bộ) chỉ ghi ở server (audit 2026-10-10, E1.8).
    logInternalError(err, 'pronounce-assess')
    return jsonResponse(
      { error: 'Chưa chấm được phát âm lúc này — thử lại sau nhé.', fallback: true },
      500,
      allHeaders,
    )
  }
}

export const config = { runtime: 'edge' }

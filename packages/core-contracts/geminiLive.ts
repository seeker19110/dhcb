// packages/core-contracts/geminiLive.ts — Hợp đồng dữ liệu V7.2 cho Đàm Thoại Trực Tiếp Đa Phương Thức Gemini Live
import { z } from 'zod'

export const GEMINI_LIVE_VERSION = 'v7.2.0'

export const GeminiLiveStatusSchema = z.enum([
  'idle',
  'connecting',
  'active',
  'ai_speaking',
  'user_speaking',
  'barge_in',
  'fallback_mode',
  'closed',
  'error',
])
export type GeminiLiveStatus = z.infer<typeof GeminiLiveStatusSchema>

export const GeminiLiveSessionConfigSchema = z.object({
  sessionId: z.string().min(1),
  personId: z.string().min(1),
  // [2026-08-23] Đổi từ 'gemini-2.0-flash-exp' — dòng Gemini 2.0 Flash NGỪNG PHỤC VỤ
  // 31/03/2026 nên giá trị cũ đã chết. Ghi đè bằng env `GEMINI_LIVE_MODEL` khi Google đổi tên;
  // chạy `npm run smoke:gemini-live` để xem tài khoản của bạn thực sự dùng được model nào.
  model: z.string().default('gemini-3.1-flash-live-preview'),
  voiceName: z.enum(['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck']).default('Aoede'),
  sampleRate: z.number().int().default(24000),
  systemInstruction: z.string().optional(),
  enableVad: z.boolean().default(true),
  maxDurationSeconds: z.number().int().min(30).max(1800).default(600), // 10 phút trần ngân sách
  schemaVersion: z.string().default(GEMINI_LIVE_VERSION),
})
export type GeminiLiveSessionConfig = z.infer<typeof GeminiLiveSessionConfigSchema>

// Client chỉ chọn giọng và rút ngắn thời lượng; model, danh tính và ngân sách do server giữ.
export const GeminiLiveSessionRequestSchema = z.object({
  voiceName: GeminiLiveSessionConfigSchema.shape.voiceName.optional(),
  maxDurationSeconds: z.number().int().min(30).max(600).optional(),
})

export const GeminiLiveClientPacketSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('setup'),
    config: GeminiLiveSessionConfigSchema.partial().optional(),
  }),
  z.object({
    type: z.literal('realtime_input'),
    mediaChunks: z.array(
      z.object({
        mimeType: z.string().default('audio/pcm;rate=16000'),
        data: z.string(), // Base64 PCM data
      }),
    ),
  }),
  z.object({
    type: z.literal('client_content'),
    turns: z.array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({ text: z.string() })),
      }),
    ),
    turnComplete: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('interrupt'),
  }),
])
export type GeminiLiveClientPacket = z.infer<typeof GeminiLiveClientPacketSchema>

export const GeminiLiveServerPacketSchema = z.object({
  type: z.enum([
    'session_ready',
    'audio_chunk',
    'text_delta',
    'turn_complete',
    'interrupted',
    'fallback',
    'error',
  ]),
  sessionId: z.string(),
  audioBase64: z.string().optional(),
  textDelta: z.string().optional(),
  isFinal: z.boolean().optional(),
  errorMessage: z.string().optional(),
  timestamp: z.number().int().positive(),
  schemaVersion: z.string().default(GEMINI_LIVE_VERSION),
})
export type GeminiLiveServerPacket = z.infer<typeof GeminiLiveServerPacketSchema>

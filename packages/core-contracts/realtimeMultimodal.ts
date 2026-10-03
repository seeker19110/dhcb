// packages/core-contracts/realtimeMultimodal.ts — Hợp đồng giao tiếp Đa phương thức Thời gian thực & Đo đạc Âm học V4.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'

export const REALTIME_MULTIMODAL_VERSION = 'v4.0.0'

export const MultimodalProviderSchema = z.enum([
  'gemini_2_live',
  'openai_realtime',
  'local_neural_stream',
])

export type MultimodalProvider = z.infer<typeof MultimodalProviderSchema>

export const SessionVoiceModeSchema = z.enum([
  'conversational_tutor',
  'socratic_inquiry',
  'phonetic_drill',
  'mock_interview',
  'ambient_copilot',
])

export type SessionVoiceMode = z.infer<typeof SessionVoiceModeSchema>

export const RealtimeSessionConfigSchema = z
  .object({
    sessionId: UuidSchema,
    personId: UuidSchema,
    provider: MultimodalProviderSchema.default('gemini_2_live'),
    voiceMode: SessionVoiceModeSchema.default('conversational_tutor'),
    sampleRate: z.number().int().min(16000).max(48000).default(24000),
    enableVad: z.boolean().default(true),
    bargeInSensitivity: z.number().min(0.01).max(0.2).default(0.04),
    targetLanguage: z.enum(['en-US', 'en-GB', 'vi-VN']).default('en-US'),
    schemaVersion: z.literal(REALTIME_MULTIMODAL_VERSION).default(REALTIME_MULTIMODAL_VERSION),
  })
  .strict()

export type RealtimeSessionConfig = z.infer<typeof RealtimeSessionConfigSchema>

export const MultimodalAudioChunkSchema = z
  .object({
    sessionId: UuidSchema,
    sequence: z.number().int().nonnegative(),
    pcmBase64: z.string().min(1),
    sampleRate: z.number().int().positive(),
    isFinal: z.boolean().default(false),
    sender: z.enum(['user', 'companion']),
    timestamp: IsoDateTimeSchema,
    schemaVersion: z.literal(REALTIME_MULTIMODAL_VERSION).default(REALTIME_MULTIMODAL_VERSION),
  })
  .strict()

export type MultimodalAudioChunk = z.infer<typeof MultimodalAudioChunkSchema>

export const RealtimeEventTypeSchema = z.enum([
  'session_started',
  'session_ended',
  'vad_speech_start',
  'vad_speech_end',
  'barge_in_triggered',
  'transcript_delta',
  'audio_output_chunk',
  'gop_evaluation_ready',
  'error',
])

export type RealtimeEventType = z.infer<typeof RealtimeEventTypeSchema>

export const RealtimeSessionEventSchema = z
  .object({
    eventId: UuidSchema,
    sessionId: UuidSchema,
    type: RealtimeEventTypeSchema,
    payload: z.record(z.string(), z.unknown()),
    timestamp: IsoDateTimeSchema,
    schemaVersion: z.literal(REALTIME_MULTIMODAL_VERSION).default(REALTIME_MULTIMODAL_VERSION),
  })
  .strict()

export type RealtimeSessionEvent = z.infer<typeof RealtimeSessionEventSchema>

// Changelog 0484: bỏ `PhonemeAcousticScoreSchema`/`AcousticPhoneticsReportSchema` — báo cáo "GOP" cũ
// gán điểm bằng công thức cứng, không đo âm thanh. Gợi ý luyện âm nay ở
// `packages/core-ai/pronunciationHints.ts` (không có con số).

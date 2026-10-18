import { z } from 'zod'

export const modeSchema = z.enum(['companion', 'speaking'])
export const directionSchema = z.enum(['vi_only', 'vi_to_en', 'en_to_vi'])
export const inputSchema = z.enum(['microphone', 'typed', 'replay', 'system'])
export const reasonSchema = z.enum([
  'none',
  'network',
  'http',
  'timeout',
  'invalid_response',
  'empty',
  'unsupported',
  'permission',
  'autoplay',
  'media',
  'user',
  'route_leave',
  'superseded',
  'unknown',
])
export const statusSchema = z.enum(['ok', 'error', 'cancelled'])
export const stageSchema = z.enum(['stt', 'companion', 'agent', 'tts', 'audio_download'])
export const cacheSchema = z.enum(['unknown', 'local_hit', 'local_miss', 'shared_inflight'])
export const playbackOptionsSchema = z
  .object({
    kind: z.enum(['html_audio', 'web_speech']),
    segment: z.enum(['speech', 'feedback', 'replay']),
  })
  .strict()
export const turnOptionsSchema = z
  .object({
    mode: modeSchema,
    direction: directionSchema,
    input: inputSchema,
  })
  .strict()
const base = {
  version: z.literal(1),
  clock: z.literal('client_monotonic'),
  clockId: z.uuid(),
  sessionId: z.uuid(),
  turnId: z.uuid(),
  mode: modeSchema,
  direction: directionSchema,
  elapsedMs: z.number().finite().nonnegative().max(86_400_000),
  sequence: z.number().int().positive().max(2048),
}
const event = <T extends z.ZodRawShape>(fields: T) => z.object({ ...base, ...fields }).strict()
export const voiceEventSchema = z.discriminatedUnion('event', [
  event({ event: z.literal('turn_started'), input: inputSchema }),
  event({ event: z.literal('capture_stop_requested') }),
  event({ event: z.literal('capture_stopped') }),
  event({ event: z.literal('text_ready'), stage: z.enum(['stt', 'assistant']) }),
  event({
    event: z.literal('request_started'),
    requestId: z.uuid(),
    stage: stageSchema,
    attempt: z.union([z.literal(1), z.literal(2)]),
  }),
  event({ event: z.literal('response_headers'), requestId: z.uuid() }),
  event({ event: z.literal('first_body_chunk'), requestId: z.uuid() }),
  event({
    event: z.literal('request_ended'),
    requestId: z.uuid(),
    status: statusSchema,
    reason: reasonSchema,
  }),
  event({
    event: z.literal('playback_requested'),
    playbackId: z.uuid(),
    ...playbackOptionsSchema.shape,
  }),
  event({ event: z.literal('cache_observed'), playbackId: z.uuid(), cache: cacheSchema }),
  event({
    event: z.literal('playback_started_proxy'),
    playbackId: z.uuid(),
    proxy: z.enum(['html_audio_playing', 'web_speech_onstart']),
  }),
  event({
    event: z.literal('playback_ended'),
    playbackId: z.uuid(),
    status: statusSchema,
    reason: reasonSchema,
  }),
  event({
    event: z.literal('fallback'),
    path: z.enum(['server_stt_to_browser', 'server_tts_to_web_speech']),
    reason: reasonSchema,
  }),
  event({ event: z.literal('turn_ended'), status: statusSchema, reason: reasonSchema }),
])
export type VoiceEvent = z.infer<typeof voiceEventSchema>
export type TurnOptions = z.infer<typeof turnOptionsSchema>
export type PlaybackOptions = z.infer<typeof playbackOptionsSchema>
export type Reason = z.infer<typeof reasonSchema>
export type Status = z.infer<typeof statusSchema>
export type Stage = z.infer<typeof stageSchema>
export type Cache = z.infer<typeof cacheSchema>
export type FallbackPath = Extract<VoiceEvent, { event: 'fallback' }>['path']

export const diagnosticsSchema = z
  .object({
    emitted: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    delivered: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    dropped: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    sinkErrors: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    invalidInput: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    invalidClock: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    rejectedTurns: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    overflow: z.boolean(),
    activeSink: z.boolean(),
    queued: z.number().int().nonnegative().max(64),
  })
  .strict()
export type Diagnostics = z.infer<typeof diagnosticsSchema>
export const localVoiceWindowSchema = z
  .object({
    version: z.literal(1),
    evidence: z.literal('local_observation_only'),
    events: z.array(voiceEventSchema).max(2048),
    diagnostics: diagnosticsSchema,
    physical: z
      .object({
        audibleFirstSound: z.literal('NOT_MEASURED'),
        speechOnsetToPlaybackStop: z.literal('NOT_MEASURED'),
        clientReconnect: z.literal('NOT_MEASURED'),
        deviceNetworkPerformance: z.literal('WAITING'),
      })
      .strict(),
  })
  .strict()
export type LocalVoiceWindowSnapshot = z.infer<typeof localVoiceWindowSchema>

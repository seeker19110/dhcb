// packages/core-contracts/audioCoLearningRoom.ts — Hợp đồng dữ liệu V7.1 cho Phòng Học Nhóm Âm Thanh Thời Gian Thực
// Lược đồ phòng học nhóm có audio (chỉ còn đường REST /api/co-learning-audio; kênh WebSocket đã gỡ 2026-10-07).
import { z } from 'zod'

export const AUDIO_CO_LEARNING_VERSION = 'v7.1.0'

// Tối đa 2 giây PCM 16 kHz/16 bit mỗi chunk; giới hạn trước khi decode/relay.
export const MAX_AUDIO_CHUNK_BYTES = 64_000
export const MAX_CO_LEARNING_MESSAGE_BYTES = 96_000
export const AudioChunkBase64Schema = z
  .string()
  .min(1)
  .max(Math.ceil(MAX_AUDIO_CHUNK_BYTES / 3) * 4)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)

// ─── Trạng thái thành viên trong phòng âm thanh ───────────────────────────────
export const AudioRoomMemberStateSchema = z.enum([
  'connecting',
  'connected',
  'speaking',
  'listening',
  'muted',
  'away',
  'disconnected',
])
export type AudioRoomMemberState = z.infer<typeof AudioRoomMemberStateSchema>

export const AudioRoomMemberSchema = z.object({
  id: z.string().min(1), // UUID phiên WebSocket
  personId: z.string().min(1),
  displayName: z.string().min(1).max(100),
  role: z.enum(['host', 'learner', 'peer_tutor', 'observer']),
  state: AudioRoomMemberStateSchema,
  audioLevel: z.number().min(0).max(1).default(0), // 0–1 từ RMS phân tích PCM
  isMuted: z.boolean().default(false),
  isSpeaking: z.boolean().default(false),
  joinedAt: z.number().int().positive(), // Unix ms
  lastActiveAt: z.number().int().positive(),
})
export type AudioRoomMember = z.infer<typeof AudioRoomMemberSchema>

// ─── Sự kiện trong phòng âm thanh ────────────────────────────────────────────
export const AudioRoomEventTypeSchema = z.enum([
  'member_joined',
  'member_left',
  'member_speaking',
  'member_silent',
  'member_muted',
  'member_unmuted',
  'audio_chunk', // PCM nhị phân relay giữa các peer
  'ai_socratic_hint', // AI moderator can thiệp
  'ai_summary', // AI tóm tắt buổi học
  'room_created',
  'room_closed',
  'chat_message', // Tin nhắn văn bản kèm theo (không thay thế audio)
  'speaking_token', // Token phát biểu luân phiên (nếu bật chế độ có cấu trúc)
])
export type AudioRoomEventType = z.infer<typeof AudioRoomEventTypeSchema>

export const AudioRoomEventSchema = z.object({
  eventId: z.string().min(1),
  roomId: z.string().min(1),
  type: AudioRoomEventTypeSchema,
  senderId: z.string(), // personId hoặc 'ai-moderator'
  senderName: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
  timestamp: z.number().int().positive(), // Unix ms
  schemaVersion: z.string().default(AUDIO_CO_LEARNING_VERSION),
})
export type AudioRoomEvent = z.infer<typeof AudioRoomEventSchema>

// ─── Trạng thái phòng âm thanh ────────────────────────────────────────────────
export const AudioRoomStateSchema = z.object({
  id: z.string().min(1), // room-{uuid}
  topic: z.string().min(1).max(200),
  subject: z.string().min(1).max(100), // 'math' | 'english' | 'physics' | etc.
  hostPersonId: z.string().min(1),
  members: z.array(AudioRoomMemberSchema),
  maxMembers: z.number().int().min(2).max(12).default(8),
  isActive: z.boolean().default(true),
  // Chế độ moderation
  moderationMode: z.enum(['open', 'turn_based', 'ai_only']).default('open'),
  silenceThresholdMs: z.number().int().min(2000).max(30000).default(8000), // Ngưỡng im lặng trigger AI
  // Lịch sử tóm tắt từ AI moderator
  aiSummaryHistory: z.array(z.string()).default([]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  schemaVersion: z.string().default(AUDIO_CO_LEARNING_VERSION),
})
export type AudioRoomState = z.infer<typeof AudioRoomStateSchema>

// ─── Payload WebSocket message từ client lên server ───────────────────────────
export const WsCoLearningClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join_room'),
    roomId: z.string().min(1),
    displayName: z.string().min(1).max(100),
  }),
  z.object({
    type: z.literal('leave_room'),
    roomId: z.string().min(1),
  }),
  z.object({
    type: z.literal('audio_chunk'),
    roomId: z.string().min(1),
    audioBase64: AudioChunkBase64Schema, // PCM 16kHz 16-bit base64
    audioLevel: z.number().min(0).max(1).optional(),
  }),
  z.object({
    type: z.literal('toggle_mute'),
    roomId: z.string().min(1),
    isMuted: z.boolean(),
  }),
  z.object({
    type: z.literal('chat_message'),
    roomId: z.string().min(1),
    content: z.string().min(1).max(1000),
  }),
  z.object({
    type: z.literal('request_ai_hint'),
    roomId: z.string().min(1),
    context: z.string().max(500).optional(),
  }),
])
export type WsCoLearningClientMessage = z.infer<typeof WsCoLearningClientMessageSchema>

// REST chỉ nhận định danh phòng; nội dung gợi ý luôn do server tạo.
export const AudioRoomHintRequestSchema = z.object({ roomId: z.string().min(1).max(128) })

// packages/core-contracts/location.ts — Contract Zod cho tính năng "Đi chung" (chia sẻ vị trí
// thời gian thực khi đi chơi cùng nhau). Giống chat.ts: đây là sự kiện truyền tải qua
// WebSocket/REST nên KHÔNG dùng versionedObject().

import { z } from 'zod'

export const UuidSchema = z.string().uuid()

/** Toạ độ + số đo kèm theo, gửi từ trình duyệt lên. */
export const PositionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(100_000).optional(),
  headingDeg: z.number().min(0).max(360).optional(),
  speedMps: z.number().min(0).max(1000).optional(),
  batteryPct: z.number().int().min(0).max(100).optional(),
})
export type Position = z.infer<typeof PositionSchema>

export const MemberPositionSchema = z.object({
  userId: UuidSchema,
  name: z.string(),
  sharingEnabled: z.boolean(),
  precisionMode: z.enum(['exact', 'approx']),
  isOwner: z.boolean(),
  position: PositionSchema.nullable(),
  updatedAt: z.string().nullable(),
})
export type MemberPosition = z.infer<typeof MemberPositionSchema>

export const MeetPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().max(120).optional(),
})
export type MeetPoint = z.infer<typeof MeetPointSchema>

export const SessionStateSchema = z.object({
  sessionId: UuidSchema,
  name: z.string(),
  inviteCode: z.string(),
  ownerId: UuidSchema,
  expiresAt: z.string(),
  endedAt: z.string().nullable(),
  alertRadiusM: z.number().int(),
  meetPoint: MeetPointSchema.nullable(),
  members: z.array(MemberPositionSchema),
})
export type SessionState = z.infer<typeof SessionStateSchema>

// ── REST body ────────────────────────────────────────────────────────────────────────────
export const CreateSessionBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  // Giới hạn thời gian chia sẻ — KHÔNG có lựa chọn "vĩnh viễn" (xem migration 0068, luật 1).
  durationMinutes: z.union([z.literal(60), z.literal(240), z.literal(480)]),
})
export type CreateSessionBody = z.infer<typeof CreateSessionBodySchema>

export const JoinSessionBodySchema = z.object({
  inviteCode: z.string().trim().min(4).max(32),
})

export const UpdateSharingBodySchema = z.object({
  sessionId: UuidSchema,
  sharingEnabled: z.boolean().optional(),
  precisionMode: z.enum(['exact', 'approx']).optional(),
})

export const UpdateSessionBodySchema = z.object({
  sessionId: UuidSchema,
  meetPoint: MeetPointSchema.nullable().optional(),
  alertRadiusM: z.number().int().min(50).max(5000).optional(),
  extendMinutes: z.union([z.literal(60), z.literal(240), z.literal(480)]).optional(),
  end: z.literal(true).optional(),
})

export const PostPositionBodySchema = z.object({
  sessionId: UuidSchema,
  position: PositionSchema,
})

// ── WebSocket ────────────────────────────────────────────────────────────────────────────
export const WsLocationClientEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('subscribe'), sessionId: UuidSchema }),
  z.object({ type: z.literal('unsubscribe'), sessionId: UuidSchema }),
  z.object({ type: z.literal('position'), sessionId: UuidSchema, position: PositionSchema }),
])
export type WsLocationClientEvent = z.infer<typeof WsLocationClientEventSchema>

export type WsLocationServerEvent =
  | { type: 'state'; state: SessionState }
  | { type: 'position'; sessionId: string; member: MemberPosition }
  | { type: 'member_left'; sessionId: string; userId: string }
  | { type: 'session_ended'; sessionId: string }
  | { type: 'error'; message: string }

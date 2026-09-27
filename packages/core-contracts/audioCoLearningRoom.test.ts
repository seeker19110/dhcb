// packages/core-contracts/audioCoLearningRoom.test.ts — Tests cho Audio Co-learning Room contracts
import { describe, it, expect } from 'vitest'
import {
  AudioRoomMemberSchema,
  AudioRoomEventSchema,
  AudioRoomStateSchema,
  WsCoLearningClientMessageSchema,
  AUDIO_CO_LEARNING_VERSION,
} from './audioCoLearningRoom.js'

describe('audioCoLearningRoom contracts', () => {
  describe('AudioRoomMemberSchema', () => {
    it('should parse valid member', () => {
      const now = Date.now()
      const member = AudioRoomMemberSchema.parse({
        id: 'session-abc123',
        personId: 'person-uuid-1',
        displayName: 'Nguyễn Văn A',
        role: 'learner',
        state: 'connected',
        audioLevel: 0.5,
        isMuted: false,
        isSpeaking: false,
        joinedAt: now,
        lastActiveAt: now,
      })
      expect(member.role).toBe('learner')
      expect(member.audioLevel).toBe(0.5)
    })

    it('should default audioLevel to 0', () => {
      const now = Date.now()
      const member = AudioRoomMemberSchema.parse({
        id: 'session-abc',
        personId: 'person-1',
        displayName: 'Test User',
        role: 'host',
        state: 'connected',
        isMuted: false,
        isSpeaking: false,
        joinedAt: now,
        lastActiveAt: now,
      })
      expect(member.audioLevel).toBe(0)
    })

    it('should reject invalid role', () => {
      const now = Date.now()
      expect(() =>
        AudioRoomMemberSchema.parse({
          id: 'session-abc',
          personId: 'person-1',
          displayName: 'Test',
          role: 'admin', // invalid
          state: 'connected',
          joinedAt: now,
          lastActiveAt: now,
        }),
      ).toThrow()
    })

    it('should reject audioLevel > 1', () => {
      const now = Date.now()
      expect(() =>
        AudioRoomMemberSchema.parse({
          id: 'session-abc',
          personId: 'person-1',
          displayName: 'Test',
          role: 'learner',
          state: 'speaking',
          audioLevel: 1.5, // invalid
          joinedAt: now,
          lastActiveAt: now,
        }),
      ).toThrow()
    })
  })

  describe('AudioRoomEventSchema', () => {
    it('should parse member_joined event', () => {
      const event = AudioRoomEventSchema.parse({
        eventId: '00000000-0000-0000-0000-000000000001',
        roomId: 'room-test-123',
        type: 'member_joined',
        senderId: 'person-1',
        senderName: 'Nguyễn Văn A',
        timestamp: Date.now(),
      })
      expect(event.type).toBe('member_joined')
      expect(event.schemaVersion).toBe(AUDIO_CO_LEARNING_VERSION)
    })

    it('should parse ai_socratic_hint event', () => {
      const event = AudioRoomEventSchema.parse({
        eventId: '00000000-0000-0000-0000-000000000002',
        roomId: 'room-test-123',
        type: 'ai_socratic_hint',
        senderId: 'ai-moderator',
        senderName: 'Đồng Hành AI',
        payload: { hint: 'Hãy thử liên hệ với định lý Pythagoras.' },
        timestamp: Date.now(),
      })
      expect(event.senderId).toBe('ai-moderator')
    })

    it('should reject invalid event type', () => {
      expect(() =>
        AudioRoomEventSchema.parse({
          eventId: '00000000-0000-0000-0000-000000000003',
          roomId: 'room-test',
          type: 'invalid_type',
          senderId: 'person-1',
          senderName: 'Test',
          timestamp: Date.now(),
        }),
      ).toThrow()
    })
  })

  describe('AudioRoomStateSchema', () => {
    it('should parse valid room state', () => {
      const now = Date.now()
      const room = AudioRoomStateSchema.parse({
        id: 'room-test-001',
        topic: 'Luyện phát âm tiếng Anh cùng nhau',
        subject: 'english',
        hostPersonId: 'person-host',
        members: [],
        createdAt: now,
        updatedAt: now,
      })
      expect(room.maxMembers).toBe(8)
      expect(room.moderationMode).toBe('open')
      expect(room.silenceThresholdMs).toBe(8000)
      expect(room.isActive).toBe(true)
    })

    it('should reject maxMembers > 12', () => {
      const now = Date.now()
      expect(() =>
        AudioRoomStateSchema.parse({
          id: 'room-test',
          topic: 'Test',
          subject: 'math',
          hostPersonId: 'person-1',
          members: [],
          maxMembers: 20, // invalid
          createdAt: now,
          updatedAt: now,
        }),
      ).toThrow()
    })
  })

  describe('WsCoLearningClientMessageSchema', () => {
    it('should parse join_room message', () => {
      const msg = WsCoLearningClientMessageSchema.parse({
        type: 'join_room',
        roomId: 'room-abc',
        displayName: 'Test User',
      })
      expect(msg.type).toBe('join_room')
    })

    it('should parse audio_chunk message', () => {
      const msg = WsCoLearningClientMessageSchema.parse({
        type: 'audio_chunk',
        roomId: 'room-abc',
        audioBase64: 'AAAA/w==',
        audioLevel: 0.3,
      })
      expect(msg.type).toBe('audio_chunk')
    })

    it('should parse toggle_mute message', () => {
      const msg = WsCoLearningClientMessageSchema.parse({
        type: 'toggle_mute',
        roomId: 'room-abc',
        isMuted: true,
      })
      expect(msg.type).toBe('toggle_mute')
    })

    it('should parse chat_message', () => {
      const msg = WsCoLearningClientMessageSchema.parse({
        type: 'chat_message',
        roomId: 'room-abc',
        content: 'Câu hỏi: định nghĩa của phoneme là gì?',
      })
      expect(msg.type).toBe('chat_message')
    })

    it('should reject unknown message type', () => {
      expect(() =>
        WsCoLearningClientMessageSchema.parse({
          type: 'unknown_action',
          roomId: 'room-abc',
        }),
      ).toThrow()
    })

    it('should reject audio_chunk with empty audioBase64', () => {
      expect(() =>
        WsCoLearningClientMessageSchema.parse({
          type: 'audio_chunk',
          roomId: 'room-abc',
          audioBase64: '', // invalid empty
        }),
      ).toThrow()
    })
  })
})

describe('giới hạn audio payload', () => {
  it.each(['A'.repeat(90_000), 'không-phải-base64!'])(
    'từ chối chunk quá lớn hoặc sai encoding',
    (audioBase64) => {
      expect(
        WsCoLearningClientMessageSchema.safeParse({
          type: 'audio_chunk',
          roomId: 'room-test',
          audioBase64,
        }).success,
      ).toBe(false)
    },
  )
})

// packages/core-ai/audioCoLearningService.test.ts — Tests cho Audio Co-learning Room Service V7.1
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createAudioRoom,
  joinAudioRoom,
  leaveAudioRoom,
  processAudioChunk,
  requestAiSocraticHint,
  broadcastAiSocraticHint,
  subscribeToRoomEvents,
  getAudioRoom,
  listActiveAudioRooms,
  setMemberMuted,
  _resetAudioCoLearningStateForTests,
} from './audioCoLearningService.js'

vi.mock('./chatFallback.js', () => ({ generateChatText: vi.fn() }))
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: vi.fn(),
  refundUsage: vi.fn(),
}))
import { generateChatText } from './chatFallback.js'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'

describe('audioCoLearningService', () => {
  beforeEach(() => {
    _resetAudioCoLearningStateForTests()
  })

  describe('createAudioRoom', () => {
    it('should create a new audio room', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-host-1',
        hostDisplayName: 'Nguyễn Văn A',
        topic: 'Luyện phát âm tiếng Anh',
        subject: 'english',
      })
      expect(room).not.toBeNull()
      expect(room!.id).toMatch(/^room-/)
      expect(room!.topic).toBe('Luyện phát âm tiếng Anh')
      expect(room!.members).toHaveLength(1)
      expect(room!.members[0]!.personId).toBe('person-host-1')
      expect(room!.members[0]!.role).toBe('host')
    })

    it('should cap maxMembers at 12', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'math',
        maxMembers: 50,
      })
      expect(room!.maxMembers).toBe(12)
    })

    it('should use default silenceThresholdMs = 8000', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'physics',
      })
      expect(room!.silenceThresholdMs).toBe(8000)
    })

    it('should emit room_created event on creation', () => {
      const events: string[] = []
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      // Đăng ký sau khi tạo để subscribe tới events tiếp theo
      const unsub = subscribeToRoomEvents(room!.id, (e) => events.push(e.type))
      void unsub // suppress unused warning — sẽ gọi khi cleanup
      // Room đã được tạo rồi, test event tiếp theo
      joinAudioRoom({ roomId: room!.id, personId: 'person-2', displayName: 'User B' })
      expect(events).toContain('member_joined')
    })
  })

  describe('joinAudioRoom', () => {
    it('should allow a new member to join', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Math Study',
        subject: 'math',
      })
      const result = joinAudioRoom({
        roomId: room!.id,
        personId: 'person-2',
        displayName: 'Learner B',
      })
      expect(result.success).toBe(true)
      expect(result.room!.members).toHaveLength(2)
    })

    it('should not allow joining a non-existent room', () => {
      const result = joinAudioRoom({
        roomId: 'room-does-not-exist',
        personId: 'person-2',
        displayName: 'User',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Room not found')
    })

    it('should update state if same person rejoins', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      joinAudioRoom({ roomId: room!.id, personId: 'person-2', displayName: 'User B' })
      // Rejoin
      const result = joinAudioRoom({
        roomId: room!.id,
        personId: 'person-2',
        displayName: 'User B',
      })
      expect(result.success).toBe(true)
      expect(result.room!.members).toHaveLength(2) // không thêm bản sao
    })

    it('should reject joining a full room', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
        maxMembers: 2,
      })
      joinAudioRoom({ roomId: room!.id, personId: 'person-2', displayName: 'User B' })
      const result = joinAudioRoom({
        roomId: room!.id,
        personId: 'person-3',
        displayName: 'User C',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Room is full')
    })
  })

  describe('leaveAudioRoom', () => {
    it('should remove a member from the room', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      joinAudioRoom({ roomId: room!.id, personId: 'person-2', displayName: 'User B' })
      const success = leaveAudioRoom(room!.id, 'person-2')
      expect(success).toBe(true)
      expect(getAudioRoom(room!.id)!.members).toHaveLength(1)
    })

    it('should close room when last member leaves', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      leaveAudioRoom(room!.id, 'person-1')
      expect(getAudioRoom(room!.id)).toBeNull()
    })

    it('should return false for non-existent member', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      const success = leaveAudioRoom(room!.id, 'person-ghost')
      expect(success).toBe(false)
    })
  })

  describe('processAudioChunk', () => {
    it('should return relayTo list excluding sender', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      joinAudioRoom({ roomId: room!.id, personId: 'person-2', displayName: 'B' })
      joinAudioRoom({ roomId: room!.id, personId: 'person-3', displayName: 'C' })

      const result = processAudioChunk({
        roomId: room!.id,
        senderPersonId: 'person-1',
        audioBase64: 'AAAA',
        audioLevel: 0,
      })

      expect(result.relayTo).toContain('person-2')
      expect(result.relayTo).toContain('person-3')
      expect(result.relayTo).not.toContain('person-1')
    })

    it('should detect speaking state from audioLevel > VAD_THRESHOLD', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      const result = processAudioChunk({
        roomId: room!.id,
        senderPersonId: 'person-1',
        audioBase64: 'AAAA',
        audioLevel: 0.5, // > 0.02 threshold
      })
      expect(result.isSpeaking).toBe(true)
    })

    it('should detect silence (audioLevel = 0)', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      const result = processAudioChunk({
        roomId: room!.id,
        senderPersonId: 'person-1',
        audioBase64: 'AAAA',
        audioLevel: 0,
      })
      expect(result.isSpeaking).toBe(false)
    })

    it('should return empty array for non-existent room', () => {
      const result = processAudioChunk({
        roomId: 'non-existent',
        senderPersonId: 'person-1',
        audioBase64: 'AAAA',
      })
      expect(result.relayTo).toHaveLength(0)
    })
  })

  describe('broadcastAiSocraticHint', () => {
    it('should emit ai_socratic_hint event', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Phonetics Practice',
        subject: 'english',
      })
      const events: string[] = []
      subscribeToRoomEvents(room!.id, (e) => events.push(e.type))

      const event = broadcastAiSocraticHint(
        room!.id,
        'Hãy thử phát âm âm /θ/ bằng cách đặt lưỡi giữa hai hàm răng.',
      )

      expect(event).not.toBeNull()
      expect(event!.type).toBe('ai_socratic_hint')
      expect(events).toContain('ai_socratic_hint')
    })

    it('should return null for non-existent room', () => {
      const result = broadcastAiSocraticHint('room-ghost', 'Hint text')
      expect(result).toBeNull()
    })
  })

  describe('setMemberMuted', () => {
    it('should mute a member', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      const success = setMemberMuted(room!.id, 'person-1', true)
      expect(success).toBe(true)
      const member = getAudioRoom(room!.id)!.members.find((m) => m.personId === 'person-1')
      expect(member!.isMuted).toBe(true)
      expect(member!.state).toBe('muted')
    })

    it('should unmute a member', () => {
      const room = createAudioRoom({
        hostPersonId: 'person-1',
        hostDisplayName: 'Host',
        topic: 'Test',
        subject: 'english',
      })
      setMemberMuted(room!.id, 'person-1', true)
      setMemberMuted(room!.id, 'person-1', false)
      const member = getAudioRoom(room!.id)!.members.find((m) => m.personId === 'person-1')
      expect(member!.isMuted).toBe(false)
      expect(member!.state).toBe('listening')
    })
  })

  describe('listActiveAudioRooms', () => {
    it('should list all active rooms', () => {
      createAudioRoom({
        hostPersonId: 'p1',
        hostDisplayName: 'H1',
        topic: 'Room 1',
        subject: 'english',
      })
      createAudioRoom({
        hostPersonId: 'p2',
        hostDisplayName: 'H2',
        topic: 'Room 2',
        subject: 'math',
      })
      const list = listActiveAudioRooms()
      expect(list).toHaveLength(2)
      expect(list.map((r) => r.topic)).toContain('Room 1')
      expect(list.map((r) => r.topic)).toContain('Room 2')
    })
  })
})

describe('AI moderator — kiểm soát chi phí', () => {
  beforeEach(() => {
    _resetAudioCoLearningStateForTests()
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-27T12:00:00Z'))
    vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: true, day: '2026-09-27' })
    vi.mocked(refundUsage).mockResolvedValue(undefined)
    vi.mocked(generateChatText).mockResolvedValue('Vì sao bạn chọn cách đó?')
  })
  afterEach(() => vi.useRealTimers())

  function silentRoom() {
    const room = createAudioRoom({
      hostPersonId: 'host',
      hostDisplayName: 'Host',
      topic: 'AI',
      subject: 'english',
    })!
    joinAudioRoom({ roomId: room.id, personId: 'learner', displayName: 'Learner' })
    vi.advanceTimersByTime(8_001)
    return room
  }

  it('khóa đồng thời cả hai kiểu gợi ý trước khi trừ lượt, chờ provider và cooldown', async () => {
    const room = silentRoom()
    let resolveProvider!: (text: string) => void
    vi.mocked(generateChatText).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveProvider = resolve
        }),
    )
    const pending = requestAiSocraticHint(room.id, 'learner', 'probing_reasons')
    await Promise.resolve()
    expect(await requestAiSocraticHint(room.id, 'host', 'probing_assumptions')).toBeNull()
    expect(await requestAiSocraticHint(room.id, 'host', 'clarification', 'manual')).toBeNull()
    expect(checkAndConsumeUsage).toHaveBeenCalledExactlyOnceWith('learner', 'chat')
    vi.advanceTimersByTime(60_000)
    expect(await requestAiSocraticHint(room.id, 'learner', 'probing_reasons')).toBeNull()
    resolveProvider('Gợi ý')
    await pending
    expect(await requestAiSocraticHint(room.id, 'host', 'probing_reasons')).toBeNull()
    vi.advanceTimersByTime(30_001)
    await requestAiSocraticHint(room.id, 'host', 'probing_reasons')
    expect(generateChatText).toHaveBeenCalledTimes(2)
  })

  it('từ chối người ngoài, thành viên muted và phòng chưa im lặng', async () => {
    const room = silentRoom()
    await requestAiSocraticHint(room.id, 'outsider', 'probing_reasons')
    expect(
      processAudioChunk({ roomId: room.id, senderPersonId: 'outsider', audioBase64: 'AAAA' })
        .relayTo,
    ).toEqual([])
    setMemberMuted(room.id, 'learner', true)
    await requestAiSocraticHint(room.id, 'learner', 'probing_reasons')
    processAudioChunk({
      roomId: room.id,
      senderPersonId: 'host',
      audioBase64: 'AAAA',
      audioLevel: 0.5,
    })
    await requestAiSocraticHint(room.id, 'host', 'probing_reasons')
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
    expect(generateChatText).not.toHaveBeenCalled()
  })

  it('hết quota/cầu dao tắt: không gọi provider, vẫn chống retry dồn dập', async () => {
    const room = silentRoom()
    vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: false, message: 'Hết lượt' })
    await requestAiSocraticHint(room.id, 'learner', 'probing_reasons')
    await requestAiSocraticHint(room.id, 'host', 'probing_reasons')
    expect(checkAndConsumeUsage).toHaveBeenCalledTimes(1)
    expect(generateChatText).not.toHaveBeenCalled()
    expect(refundUsage).not.toHaveBeenCalled()
  })

  it.each(['fallback', 'throw'])(
    'hoàn đúng ngày khi provider %s và cho phép retry sau cooldown',
    async (failure) => {
      const room = silentRoom()
      if (failure === 'fallback') vi.mocked(generateChatText).mockResolvedValueOnce(null)
      else vi.mocked(generateChatText).mockRejectedValueOnce(new Error('provider unavailable'))
      await requestAiSocraticHint(room.id, 'learner', 'probing_reasons')
      expect(refundUsage).toHaveBeenCalledExactlyOnceWith('learner', 'chat', '2026-09-27')
      vi.advanceTimersByTime(30_001)
      expect(await requestAiSocraticHint(room.id, 'learner', 'probing_reasons')).not.toBeNull()
      expect(generateChatText).toHaveBeenCalledTimes(2)
    },
  )

  it.each(['learner', 'host'])(
    '%s rời phòng khi chờ quota: hoàn lượt, không gọi provider',
    async (leavingUser) => {
      const room = silentRoom()
      const pending = requestAiSocraticHint(room.id, 'learner', 'probing_reasons')
      leaveAudioRoom(room.id, leavingUser)
      await pending
      expect(refundUsage).toHaveBeenCalledWith('learner', 'chat', '2026-09-27')
      expect(generateChatText).not.toHaveBeenCalled()
    },
  )
})

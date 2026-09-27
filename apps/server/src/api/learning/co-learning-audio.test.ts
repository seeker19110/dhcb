// api/co-learning-audio.test.ts — Tests cho REST handler co-learning-audio
import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from './co-learning-audio.js'
import {
  _resetAudioCoLearningStateForTests,
  createAudioRoom,
} from '@dhcb/core-ai/audioCoLearningService'

import { generateChatText } from '@dhcb/core-ai/chatFallback'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
vi.mock('@dhcb/core-ai/chatFallback', () => ({ generateChatText: vi.fn() }))
vi.mock('@dhcb/core-billing/usage', () => ({ checkAndConsumeUsage: vi.fn(), refundUsage: vi.fn() }))

// Mock validateAuth
vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.includes('valid-token')) {
      return { userId: 'user-test-123', email: 'test@example.com' }
    }
    return null
  }),
  getCorsHeaders: vi.fn().mockReturnValue({}),
  // Handler mới thêm rate limit + log (vá N1 2026-08-23) — mock cho qua
  checkRateLimit: vi.fn(async () => true),
  logSecurityEvent: vi.fn(),
}))

describe('api/co-learning-audio', () => {
  beforeEach(() => {
    _resetAudioCoLearningStateForTests()
    vi.mocked(generateChatText).mockReset().mockResolvedValue('Vì sao bạn chọn cách giải đó?')
    vi.mocked(checkAndConsumeUsage).mockReset().mockResolvedValue({ ok: true, day: '2026-09-27' })
    vi.mocked(refundUsage).mockReset().mockResolvedValue(undefined)
  })

  it('should return 401 if unauthenticated', async () => {
    const req = new Request('http://localhost/api/co-learning-audio', {
      method: 'GET',
    })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('should return empty list of rooms initially', async () => {
    const req = new Request('http://localhost/api/co-learning-audio', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.rooms).toHaveLength(0)
  })

  it('should create a room via POST create_room', async () => {
    const req = new Request('http://localhost/api/co-learning-audio?action=create_room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        topic: 'Luyện đề thi THPT Quốc Gia môn Hóa',
        subject: 'chemistry',
        displayName: 'Học viên A',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.room.topic).toBe('Luyện đề thi THPT Quốc Gia môn Hóa')
    expect(data.room.members).toHaveLength(1)
  })

  it('should reject create_room with missing fields', async () => {
    const req = new Request('http://localhost/api/co-learning-audio?action=create_room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        topic: '',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('should join and leave room via API', async () => {
    // 1. Create room
    const createReq = new Request('http://localhost/api/co-learning-audio?action=create_room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        topic: 'English Speaking Practice',
        subject: 'english',
      }),
    })
    const createRes = await handler(createReq)
    const createData = await createRes.json()
    const roomId = createData.room.id

    // 2. Get room
    const getReq = new Request(`http://localhost/api/co-learning-audio?roomId=${roomId}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const getRes = await handler(getReq)
    expect(getRes.status).toBe(200)

    // 3. Request hint
    const hintReq = new Request('http://localhost/api/co-learning-audio?action=request_hint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        roomId,
        hintText: 'Gợi ý từ vựng chuyên ngành',
      }),
    })
    const hintRes = await handler(hintReq)
    expect(hintRes.status).toBe(200)

    // 4. Leave room
    const leaveReq = new Request('http://localhost/api/co-learning-audio?action=leave_room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ roomId }),
    })
    const leaveRes = await handler(leaveReq)
    expect(leaveRes.status).toBe(200)
  })

  // ── Ca biên từng nhánh của handler (thêm 2026-09-01, nới biên coverage branches) ──
  const AUTH = { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' }
  const post = (action: string, body: unknown) =>
    handler(
      new Request(`http://localhost/api/co-learning-audio?action=${action}`, {
        method: 'POST',
        headers: AUTH,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      }),
    )
  const taoPhong = async () => {
    const res = await post('create_room', { topic: 'T', subject: 'english' })
    return (await res.json()).room.id as string
  }

  it('OPTIONS → 204 (preflight CORS), không cần đăng nhập', async () => {
    const res = await handler(
      new Request('http://localhost/api/co-learning-audio', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('vượt rate limit → 429 và ghi log bảo mật', async () => {
    const sec = await import('@dhcb/core-auth/security')
    vi.mocked(sec.checkRateLimit).mockResolvedValueOnce(false)
    const res = await handler(
      new Request('http://localhost/api/co-learning-audio', {
        method: 'GET',
        headers: AUTH,
      }),
    )
    expect(res.status).toBe(429)
    expect(sec.logSecurityEvent).toHaveBeenCalledWith(
      'RATE_LIMIT_EXCEEDED',
      expect.any(String),
      expect.objectContaining({ path: '/api/co-learning-audio' }),
    )
  })

  it('GET roomId không tồn tại → 404', async () => {
    const res = await handler(
      new Request('http://localhost/api/co-learning-audio?roomId=khong-co', {
        method: 'GET',
        headers: AUTH,
      }),
    )
    expect(res.status).toBe(404)
  })

  it('create_room: thiếu displayName → đặt tên mặc định theo id người dùng', async () => {
    const res = await post('create_room', { topic: 'T', subject: 'math' })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.room.members[0].displayName).toBe('Host_user-')
  })

  it('create_room: server đầy phòng (createAudioRoom trả null) → 503', async () => {
    for (let i = 0; i < 100; i++) await taoPhong()
    const res = await post('create_room', { topic: 'T', subject: 'english' })
    expect(res.status).toBe(503)
  })

  it('join_room: thiếu roomId → 400; phòng không tồn tại → 400 kèm lý do', async () => {
    expect((await post('join_room', {})).status).toBe(400)
    const res = await post('join_room', { roomId: 'khong-co' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Room not found')
  })

  it('join_room thành công với tên mặc định, rồi toggle_mute đúng người', async () => {
    const roomId = await taoPhong()
    const join = await post('join_room', { roomId })
    expect(join.status).toBe(200)
    expect((await post('toggle_mute', { roomId, isMuted: true })).status).toBe(200)
    expect((await post('toggle_mute', { roomId: 'khong-co', isMuted: true })).status).toBe(404)
    // isMuted không phải boolean → 400
    expect((await post('toggle_mute', { roomId, isMuted: 'yes' })).status).toBe(400)
    expect((await post('toggle_mute', { isMuted: true })).status).toBe(400)
  })

  it('leave_room: thiếu roomId → 400; phòng không tồn tại → 404', async () => {
    expect((await post('leave_room', {})).status).toBe(400)
    expect((await post('leave_room', { roomId: 'khong-co' })).status).toBe(404)
  })

  it('request_hint: thiếu roomId → 400; phòng không có → 404; thiếu text/type → dùng mặc định', async () => {
    expect((await post('request_hint', {})).status).toBe(400)
    expect((await post('request_hint', { roomId: 'khong-co' })).status).toBe(404)
    const roomId = await taoPhong()
    const res = await post('request_hint', { roomId })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.event.socraticType ?? data.event.payload?.socraticType).toBe('clarification')
  })

  it('người ngoài phòng không thể giả danh moderator', async () => {
    const room = createAudioRoom({
      hostPersonId: 'another-user',
      hostDisplayName: 'Other',
      topic: 'AI',
      subject: 'english',
    })!
    const res = await post('request_hint', { roomId: room.id, hintText: 'Tin nhắn giả mạo' })
    expect(res.status).toBe(403)
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
    expect(generateChatText).not.toHaveBeenCalled()
  })

  it('bỏ qua hintText client, trừ quota auth user và chặn request lặp', async () => {
    const roomId = await taoPhong()
    const res = await post('request_hint', {
      roomId,
      hintText: 'Tin giả',
      personId: 'another-user',
    })
    expect(res.status).toBe(200)
    expect((await res.json()).event.payload.hint).toBe('Vì sao bạn chọn cách giải đó?')
    expect(checkAndConsumeUsage).toHaveBeenCalledExactlyOnceWith('user-test-123', 'chat')
    expect((await post('request_hint', { roomId })).status).toBe(429)
    expect(generateChatText).toHaveBeenCalledTimes(1)
  })

  it('hết quota → 429, không gọi provider', async () => {
    const roomId = await taoPhong()
    vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: false, message: 'Hết lượt' })
    expect((await post('request_hint', { roomId })).status).toBe(429)
    expect(generateChatText).not.toHaveBeenCalled()
  })

  it('provider không khả dụng → câu mẫu gắn nhãn fallback và hoàn lượt', async () => {
    const roomId = await taoPhong()
    vi.mocked(generateChatText).mockResolvedValue(null)
    const res = await post('request_hint', { roomId })
    expect(res.status).toBe(200)
    expect((await res.json()).event.payload.isFallback).toBe(true)
    expect(refundUsage).toHaveBeenCalledExactlyOnceWith('user-test-123', 'chat', '2026-09-27')
  })

  it('action lạ → 400; body không phải JSON → 400; method khác → 405', async () => {
    expect((await post('bay_nhay', {})).status).toBe(400)
    expect((await post('create_room', '{hong')).status).toBe(400)
    const res = await handler(
      new Request('http://localhost/api/co-learning-audio', { method: 'PUT', headers: AUTH }),
    )
    expect(res.status).toBe(405)
  })
})

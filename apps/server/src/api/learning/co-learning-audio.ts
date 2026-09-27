// api/co-learning-audio.ts — REST handler cho Phòng Học Nhóm Âm Thanh Thời Gian Thực V7.1.
import { jsonResponse } from '@dhcb/core-http/http'
import {
  validateAuth,
  getCorsHeaders,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { AudioRoomHintRequestSchema } from '@dhcb/core-contracts/audioCoLearningRoom'
import { getClientIp } from '@dhcb/core-http/http'
import {
  createAudioRoom,
  getAudioRoom,
  listActiveAudioRooms,
  joinAudioRoom,
  leaveAudioRoom,
  requestAiSocraticHint,
  setMemberMuted,
} from '@dhcb/core-ai/audioCoLearningService'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'co_learning'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/co-learning-audio' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Yêu cầu đăng nhập để truy cập phòng học nhóm.' },
      401,
    )
  }

  const personId = auth.userId
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    const roomId = url.searchParams.get('roomId')
    if (roomId) {
      const room = getAudioRoom(roomId)
      if (!room) {
        return jsonResponse({ error: 'Room not found' }, 404)
      }
      return jsonResponse({ success: true, room }, 200)
    }

    // Trả về danh sách phòng đang hoạt động
    const rooms = listActiveAudioRooms()
    return jsonResponse({ success: true, rooms }, 200)
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'create_room') {
        const { topic, subject, displayName, moderationMode, silenceThresholdMs, maxMembers } = body
        if (!topic || !subject) {
          return jsonResponse({ error: 'Missing topic or subject' }, 400)
        }

        const room = createAudioRoom({
          hostPersonId: personId,
          hostDisplayName: displayName || `Host_${personId.slice(0, 5)}`,
          topic,
          subject,
          moderationMode,
          silenceThresholdMs,
          maxMembers,
        })

        if (!room) {
          return jsonResponse({ error: 'Server reached maximum room capacity' }, 503)
        }

        return jsonResponse({ success: true, room }, 200)
      }

      if (action === 'join_room') {
        const { roomId, displayName, role } = body
        if (!roomId) {
          return jsonResponse({ error: 'Missing roomId' }, 400)
        }

        const result = joinAudioRoom({
          roomId,
          personId,
          displayName: displayName || `Learner_${personId.slice(0, 5)}`,
          role,
        })

        if (!result.success) {
          return jsonResponse({ error: result.error || 'Cannot join room' }, 400)
        }

        return jsonResponse({ success: true, room: result.room }, 200)
      }

      if (action === 'leave_room') {
        const { roomId } = body
        if (!roomId) {
          return jsonResponse({ error: 'Missing roomId' }, 400)
        }

        const success = leaveAudioRoom(roomId, personId)
        return jsonResponse({ success }, success ? 200 : 404)
      }

      if (action === 'request_hint') {
        const parsed = AudioRoomHintRequestSchema.safeParse(body)
        if (!parsed.success) return jsonResponse({ error: 'Invalid roomId' }, 400)
        const { roomId } = parsed.data
        const room = getAudioRoom(roomId)
        if (!room?.isActive) return jsonResponse({ error: 'Room not found or inactive' }, 404)
        if (!room.members.some((member) => member.personId === personId)) {
          return jsonResponse({ error: 'Bạn cần tham gia phòng trước khi yêu cầu gợi ý.' }, 403)
        }
        const event = await requestAiSocraticHint(roomId, personId, 'clarification', 'manual')
        if (!event) {
          return jsonResponse({ error: 'Chưa thể tạo gợi ý lúc này. Vui lòng thử lại sau.' }, 429)
        }

        return jsonResponse({ success: true, event }, 200)
      }

      if (action === 'toggle_mute') {
        const { roomId, isMuted } = body
        if (!roomId || typeof isMuted !== 'boolean') {
          return jsonResponse({ error: 'Missing roomId or isMuted' }, 400)
        }

        const success = setMemberMuted(roomId, personId, isMuted)
        return jsonResponse({ success }, success ? 200 : 404)
      }

      return jsonResponse({ error: 'Invalid action parameter' }, 400)
    } catch (err) {
      return jsonResponse({ error: 'Invalid JSON payload', details: String(err) }, 400)
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

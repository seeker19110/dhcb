// api/debate-arena.ts — REST handler cho Platform V5 AI Debate Arena & Socratic Multi-Agent.
import { jsonResponse, getClientIp, badJsonOrInternalError } from '@dhcb/core-http/http'
import {
  validateAuth,
  getCorsHeaders,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { DebateArenaService } from '@dhcb/core-ai/debateArenaService'
import { DebateSessionConfig, DebateSessionState } from '@dhcb/core-contracts/debateArena'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'

// [2026-08-24] Trước đây các phiên tranh biện nằm trong `new Map` cấp module — mất khi restart,
// VỠ trong PM2 cluster 3 instance (đang tranh biện dở mà request rơi sang instance khác là mất
// hết lượt đã nói), và Map khoá theo sessionId TOÀN CỤC nên ai biết id cũng đọc được phiên của
// người khác. Nay lưu ở platform.feature_state THEO USER.
const FEATURE = 'debate_arena'
// Trần số phiên giữ lại mỗi người, để dòng JSONB không phình vô hạn.
const MAX_SESSIONS = 20

type SessionBook = Record<string, DebateSessionState>

async function readSessions(userId: string): Promise<SessionBook> {
  const state = await getFeatureState<SessionBook>(userId, FEATURE)
  return state && typeof state === 'object' ? state : {}
}

// Ghi lại một phiên, cắt bớt phiên cũ nhất nếu vượt trần (theo updatedAt).
async function saveSession(userId: string, book: SessionBook, session: DebateSessionState) {
  book[session.id] = session
  const ids = Object.keys(book)
  if (ids.length > MAX_SESSIONS) {
    const keep = ids
      .sort((a, b) => (book[b]!.updatedAt ?? '').localeCompare(book[a]!.updatedAt ?? ''))
      .slice(0, MAX_SESSIONS)
    const trimmed: SessionBook = {}
    for (const id of keep) trimmed[id] = book[id]!
    await setFeatureState(userId, FEATURE, trimmed)
    return
  }
  await setFeatureState(userId, FEATURE, book)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  // [2026-08-23] Endpoint này nay gọi model TRẢ TIỀN thật (trước đây chỉ trả chuỗi cứng nên
  // không ai thấy cần chặn). Phải có rate-limit + đếm lượt như mọi đường AI khác — CLAUDE.md
  // mục 7 và khuôn đã áp cho /api/companion ở đề xuất N1 mục B3.
  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'debate-arena'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/debate-arena' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Yêu cầu đăng nhập để tham gia Đấu trường Tranh biện.' },
      401,
    )
  }

  const personId = auth.userId
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId')
    if (sessionId) {
      const session = (await readSessions(personId))[sessionId]
      if (!session) {
        return jsonResponse({ error: 'Session not found' }, 404)
      }
      return jsonResponse({ success: true, session }, 200)
    }

    // Trả về danh sách chủ đề tranh biện mẫu
    const sampleTopics = [
      {
        topicId: 'ai-ethics',
        motion: 'AI systems must undergo mandatory ethical auditing before deployment.',
        category: 'technology',
        difficulty: 'advanced_c1',
      },
      {
        topicId: 'ubi-economic',
        motion: 'Universal Basic Income is essential in an automated economy.',
        category: 'economics',
        difficulty: 'advanced_c1',
      },
      {
        topicId: 'remote-work',
        motion: 'Full remote work is more beneficial for long-term career growth than office work.',
        category: 'education',
        difficulty: 'intermediate_b2',
      },
    ]

    return jsonResponse({ success: true, topics: sampleTopics }, 200)
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'create_session') {
        const config: DebateSessionConfig = body.config
        if (!config || !config.motion) {
          return jsonResponse({ error: 'Missing debate session config' }, 400)
        }

        const session = DebateArenaService.createDebateSession(personId, config)
        await saveSession(personId, await readSessions(personId), session)
        return jsonResponse({ success: true, session }, 200)
      }

      if (action === 'submit_turn') {
        const { sessionId, content } = body
        if (!sessionId || !content) {
          return jsonResponse({ error: 'Missing sessionId or content' }, 400)
        }

        const book = await readSessions(personId)
        let session = book[sessionId]
        if (!session) {
          // Khởi tạo fallback nếu session hết hạn
          session = DebateArenaService.createDebateSession(personId, {
            topicId: 'adhoc-debate',
            motion: 'Debate motion',
            category: 'technology',
            userStance: 'support',
            difficulty: 'advanced_c1',
            maxRounds: 4,
          })
          session.id = sessionId
          book[sessionId] = session
        }

        // 1. Phân tích lượt của user
        const userAnalysis = DebateArenaService.analyzeArgumentTurn(content)
        const userTurn = {
          id: `turn-u-${Date.now()}`,
          speakerId: personId,
          speakerName: 'Người học',
          speakerRole: 'user' as const,
          content,
          detectedFallacy: userAnalysis.detectedFallacy,
          fallacyExplanation: userAnalysis.fallacyExplanation,
          toulmin: userAnalysis.toulmin,
          advancedVocabulary: userAnalysis.advancedVocabulary,
          logicScore: userAnalysis.logicScore,
          persuasionScore: userAnalysis.persuasionScore,
          timestamp: new Date().toISOString(),
        }
        session.turns.push(userTurn)

        // 2. Sinh lượt đối đáp của AI (Opponent) — gọi model THẬT, nên trừ lượt như chế độ
        // 'chat'. Trừ TRƯỚC khi gọi (server authoritative), hoàn lại nếu không dùng được AI.
        const gate = await checkAndConsumeUsage(personId, 'chat')
        if (!gate.ok) {
          logSecurityEvent('USAGE_LIMIT', clientIp, { path: '/api/debate-arena' })
          return jsonResponse({ error: gate.message }, 429)
        }

        const opponentRole = session.config.userStance === 'support' ? 'negative' : 'affirmative'
        const aiTurn = await DebateArenaService.generateAiTurn(session, opponentRole)
        session.turns.push(aiTurn)

        // Không gọi được AI (thiếu key / provider lỗi) → người học nhận mẫu cứng, KHÔNG được
        // tính tiền lượt đó. Hoàn lượt và để cờ isFallback nói thật với UI.
        if (aiTurn.isFallback) {
          await refundUsage(personId, 'chat', gate.day).catch(() => {})
        }

        // 3. Nếu sang vòng mới, moderator có thể đưa ra câu hỏi gợi mở
        if (session.turns.length >= 4 && session.turns.length % 4 === 0) {
          const modTurn = await DebateArenaService.generateAiTurn(session, 'socratic_moderator')
          session.turns.push(modTurn)
          session.currentRound += 1
        }

        // 4. Nếu đạt số round tối đa, kết thúc và chấm điểm
        if (session.currentRound > session.config.maxRounds) {
          session.status = 'completed'
          session.finalRubric = DebateArenaService.evaluateDebateMatch(session)
        }

        session.updatedAt = new Date().toISOString()
        await saveSession(personId, book, session)

        return jsonResponse(
          {
            success: true,
            userTurn,
            aiTurn,
            session,
          },
          200,
        )
      }

      if (action === 'evaluate_match') {
        const { sessionId } = body
        const book = await readSessions(personId)
        const session = sessionId ? book[sessionId] : undefined
        if (!session) {
          return jsonResponse({ error: 'Session not found' }, 404)
        }

        session.status = 'completed'
        session.finalRubric = DebateArenaService.evaluateDebateMatch(session)
        // Kết quả chấm phải được LƯU — trước đây chỉ nằm trong bộ nhớ rồi mất, nên mở lại phiên
        // là thấy nó chưa hoàn thành và chưa có điểm.
        session.updatedAt = new Date().toISOString()
        await saveSession(personId, book, session)
        return jsonResponse({ success: true, rubric: session.finalRubric }, 200)
      }

      return jsonResponse({ error: 'Invalid action parameter' }, 400)
    } catch (err) {
      return badJsonOrInternalError(err, 'debate-arena')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

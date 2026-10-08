// packages/core-personal/scenarioHolodeckService.ts — V3 Scenario Holodeck Service.
import { randomUUID } from 'node:crypto'
import {
  type HolodeckScenario,
  type HolodeckSession,
  type HolodeckTurn,
  type HolodeckRubricScore,
  HOLODECK_SCHEMA_VERSION,
} from '@dhcb/core-contracts/scenarioHolodeck'
import { ConflictError } from '@dhcb/core-errors/appError'
import { createPracticeSessionStore } from './ttlSessionStore.js'

export const PREDEFINED_SCENARIOS: HolodeckScenario[] = [
  {
    id: 'bigtech_panel_interview',
    title: 'Phỏng vấn Hội đồng Lãnh đạo Big Tech (CTO & HR Director)',
    description:
      'Đối thoại áp lực cao với CTO xoáy sâu về hệ thống phân tán và HR Director về xử lý xung đột đội ngũ.',
    scenarioType: 'panel_interview',
    difficulty: 'advanced',
    personas: [
      {
        id: 'alex_cto',
        name: 'Alex Rivera (CTO)',
        role: 'tech_lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        temperament: 'analytical',
        speakingStyle:
          'Sắc sảo, thực tế, đòi hỏi số liệu chứng minh và tư duy giải quyết sự cố quy mô lớn.',
      },
      {
        id: 'sarah_hr',
        name: 'Sarah Jenkins (HR VP)',
        role: 'hr_director',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120',
        temperament: 'supportive',
        speakingStyle:
          'Ấm áp nhưng tinh tế, đánh giá văn hóa hợp tác, khả năng chịu áp lực và truyền cảm hứng.',
      },
    ],
    initialPrompt:
      'Welcome Alex and Sarah to your panel. Alex will kick off by evaluating your recent technical architectural ownership.',
    schemaVersion: HOLODECK_SCHEMA_VERSION,
  },
  {
    id: 'silicon_vc_pitch',
    title: 'Thuyết Trình Gọi Vốn Quỹ Silicon Valley (Series A Pitch)',
    description:
      'Đối diện nhà đầu tư mạo hiểm chất vấn về Unit Economics, Moat công nghệ và chiến lược Go-To-Market toàn cầu.',
    scenarioType: 'vc_pitch',
    difficulty: 'expert',
    personas: [
      {
        id: 'marcus_vc',
        name: 'Marcus Vance (General Partner)',
        role: 'vc_investor',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        temperament: 'skeptical',
        speakingStyle:
          'Nhanh, dồn dập, liên tục hỏi về CAC/LTV, rào cản phòng thủ trước Big Tech và ROI.',
      },
    ],
    initialPrompt:
      'Marcus is listening to your 2-minute elevator pitch. You have his undivided attention.',
    schemaVersion: HOLODECK_SCHEMA_VERSION,
  },
  {
    id: 'cambridge_ielts_examiner',
    title: 'Phòng Thi Mock Test IELTS Speaking Part 3 (Band 8.0+ Target)',
    description:
      'Giám khảo Cambridge đánh giá chuyên sâu 4 tiêu chí với các chủ đề trừu tượng và câu hỏi mở rộng.',
    scenarioType: 'ielts_speaking_mock',
    difficulty: 'advanced',
    personas: [
      {
        id: 'dr_edward',
        name: 'Dr. Edward Thorne (Senior Examiner)',
        role: 'ielts_examiner',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
        temperament: 'neutral',
        speakingStyle:
          'Giọng Anh chuẩn RP, điềm đạm, tập trung vào tính logic, vốn từ vựng học thuật và độ trôi chảy.',
      },
    ],
    initialPrompt:
      'Good afternoon. In this section, I would like to discuss some more general questions related to artificial intelligence and human labor.',
    schemaVersion: HOLODECK_SCHEMA_VERSION,
  },
]

// Phiên giữ trong RAM có TTL trượt + trần mỗi người + trần toàn tiến trình (changelog 0538 —
// trước đây là `Map` không bao giờ dọn). Mọi lối đọc/ghi đều đi kèm `personId`: phiên của
// người khác và phiên không còn đều là "không còn" (SessionGoneError → 404).
const activeSessions = createPracticeSessionStore<HolodeckSession>()

/**
 * Trần số lượt người học trong MỘT phiên: TTL trượt cho phép một phiên sống mãi nếu cứ gửi lượt,
 * mỗi lượt thêm 2 bản ghi — không chặn thì một phiên tự phình RAM. 40 lượt dư cho một buổi phỏng
 * vấn/thuyết trình thật (thường 8–15 lượt).
 */
export const MAX_HOLODECK_USER_TURNS = 40

/** Dừng bộ dọn nền và xoá mọi phiên — CHỈ dùng trong test. */
export function resetHolodeckSessionsForTest(): void {
  activeSessions.dispose()
}

export function listPredefinedScenarios(): HolodeckScenario[] {
  return [...PREDEFINED_SCENARIOS]
}

export function getScenarioById(scenarioId: string): HolodeckScenario | undefined {
  return PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId)
}

export function startHolodeckSession(personId: string, scenarioId: string): HolodeckSession {
  const scenario = getScenarioById(scenarioId)
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} không tồn tại`)
  }

  const now = new Date().toISOString()
  const initialSpeaker = scenario.personas[0]

  const firstTurn: HolodeckTurn = {
    turnIndex: 0,
    speakerType: 'persona',
    personaId: initialSpeaker?.id,
    content:
      scenario.id === 'bigtech_panel_interview'
        ? 'Hi there! Alex here. Let us dive straight in: Could you walk us through a time when a critical distributed service went down under your watch, and how you architected the recovery?'
        : scenario.initialPrompt,
    pressureScore: 30,
    timestamp: now,
  }

  const session: HolodeckSession = {
    sessionId: randomUUID(),
    personId,
    scenarioId,
    status: 'active',
    currentPressure: 30,
    turns: [firstTurn],
    createdAt: now,
    updatedAt: now,
    schemaVersion: HOLODECK_SCHEMA_VERSION,
  }

  activeSessions.create(session.sessionId, personId, session)
  return session
}

/** Phiên của đúng `personId` (gia hạn TTL); không có/hết hạn/của người khác → `undefined`. */
export function getHolodeckSession(
  sessionId: string,
  personId: string,
): HolodeckSession | undefined {
  return activeSessions.get(sessionId, personId)
}

export interface ProcessTurnResult {
  updatedSession: HolodeckSession
  personaReplyTurn: HolodeckTurn
  instantFeedback: {
    strengths: string[]
    weaknesses: string[]
    suggestedNuance?: string
  }
}

export function processHolodeckTurn(
  sessionId: string,
  personId: string,
  userUtterance: string,
): ProcessTurnResult {
  // Không có / hết hạn / của người khác → SessionGoneError (404).
  const session = activeSessions.require(sessionId, personId)
  if (session.status !== 'active') {
    throw new ConflictError('Phiên giả lập đã kết thúc — hãy bắt đầu phiên mới.')
  }
  const userTurnCount = session.turns.filter((t) => t.speakerType === 'user').length
  if (userTurnCount >= MAX_HOLODECK_USER_TURNS) {
    throw new ConflictError(
      `Phiên đã đủ ${MAX_HOLODECK_USER_TURNS} lượt — hãy bấm "Kết thúc & chấm điểm" để tổng kết.`,
    )
  }

  const scenario = getScenarioById(session.scenarioId)
  if (!scenario) {
    throw new Error(`Scenario ${session.scenarioId} không hợp lệ`)
  }

  const now = new Date().toISOString()

  // Phân tích chất lượng câu trả lời của người học
  const wordCount = userUtterance.trim().split(/\s+/).length
  const hasTechnicalKeywords =
    /architecture|distributed|latency|metrics|scalability|fallback|trade-off|consensus|idempotent/i.test(
      userUtterance,
    )

  let pressureDelta = 0
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (wordCount < 10) {
    pressureDelta += 20
    weaknesses.push('Câu trả lời quá ngắn, chưa đủ dẫn chứng thực tế')
  } else {
    strengths.push('Độ dài và khả năng diễn giải ý niệm mạch lạc')
  }

  if (hasTechnicalKeywords) {
    pressureDelta -= 15
    strengths.push('Sử dụng thuật ngữ kỹ thuật chính xác, tự tin')
  } else if (scenario.scenarioType === 'panel_interview') {
    pressureDelta += 10
    weaknesses.push('Cần bổ sung các thuật ngữ kỹ thuật và số liệu đo lường cụ thể')
  }

  const newPressure = Math.min(100, Math.max(10, session.currentPressure + pressureDelta))

  const userTurn: HolodeckTurn = {
    turnIndex: session.turns.length,
    speakerType: 'user',
    content: userUtterance,
    pressureScore: newPressure,
    timestamp: now,
    instantFeedback: {
      strengths,
      weaknesses,
      suggestedNuance:
        'Thử dùng cấu trúc STAR (Situation - Task - Action - Result) để tăng tính thuyết phục của câu trả lời.',
    },
  }

  session.turns.push(userTurn)

  // Chọn nhân vật tiếp theo phản hồi
  const personaCount = scenario.personas.length
  const nextPersonaIndex = (session.turns.length - 1) % personaCount
  const currentPersona = scenario.personas[nextPersonaIndex] ?? scenario.personas[0]!

  let replyText = ''
  if (currentPersona.role === 'tech_lead') {
    replyText = `That's an interesting approach. How did you ensure data consistency during failover, and what was your P99 latency impact?`
  } else if (currentPersona.role === 'hr_director') {
    replyText = `Thank you for sharing the technical side. How did you align the team and handle pushback from stakeholders during this incident?`
  } else if (currentPersona.role === 'vc_investor') {
    replyText = `Understood. But if Google or OpenAI releases the exact same capability next month, what is your unfair moat to retain paying enterprise clients?`
  } else if (currentPersona.role === 'ielts_examiner') {
    replyText = `Indeed. To what extent do you believe modern automation will alter future job security for young graduates?`
  } else {
    replyText = `Let us explore that further. Could you give a concrete example?`
  }

  const personaTurn: HolodeckTurn = {
    turnIndex: session.turns.length,
    speakerType: 'persona',
    personaId: currentPersona.id,
    content: replyText,
    pressureScore: newPressure,
    timestamp: new Date().toISOString(),
  }

  session.turns.push(personaTurn)
  session.currentPressure = newPressure
  session.updatedAt = now

  return {
    updatedSession: session,
    personaReplyTurn: personaTurn,
    instantFeedback: userTurn.instantFeedback!,
  }
}

export function finalizeHolodeckSession(sessionId: string, personId: string): HolodeckSession {
  const session = activeSessions.require(sessionId, personId)

  const userTurns = session.turns.filter((t) => t.speakerType === 'user')
  const averagePressure =
    userTurns.length > 0
      ? userTurns.reduce((acc, t) => acc + t.pressureScore, 0) / userTurns.length
      : 50

  const calculatedBand = Math.min(
    9.0,
    Math.max(5.0, Number((8.5 - averagePressure / 30).toFixed(1))),
  )

  const finalRubric: HolodeckRubricScore = {
    fluencyAndCoherence: calculatedBand,
    lexicalResource: calculatedBand,
    grammaticalRange: Number(Math.min(9.0, calculatedBand + 0.5).toFixed(1)),
    strategicPersuasion: Number(Math.max(5.0, calculatedBand - 0.2).toFixed(1)),
    overallBand: calculatedBand,
    detailedCritique:
      'Thể hiện khả năng phản xạ và xử lý tình huống xuất sắc dưới áp lực cao. Cần duy trì nhịp thở và cấu trúc ý mạch lạc hơn khi bị dồn dập chất vấn kỹ thuật.',
    recommendedDrills: [
      'Luyện tập trả lời STAR Framework trong 90 giây',
      'Mở rộng vốn từ vựng diễn đạt chuyển ý (Signposting language)',
      'Thực hành kịch bản phản biện Moat & Unit Economics',
    ],
  }

  session.status = 'completed'
  session.finalRubric = finalRubric
  session.updatedAt = new Date().toISOString()
  return session
}

import type { Page, Route } from '@playwright/test'
import {
  HolodeckScenarioSchema,
  HolodeckSessionSchema,
  type HolodeckSession,
} from '../../packages/core-contracts/scenarioHolodeck'
import {
  CognitiveBreakthroughRecordSchema,
  MentalModelMisconceptionSchema,
  type CognitiveBreakthroughRecord,
} from '../../packages/core-contracts/socraticDiagnostics'
import { ArticulatoryGuideSchema } from '../../packages/core-contracts/articulatoryPhonetics'
import {
  AutoSrsCardSchema,
  HarvestedMistakeSchema,
} from '../../packages/core-contracts/workplaceErrorHarvester'
import {
  A2ANegotiationResultSchema,
  PeerStudyMatchSchema,
} from '../../packages/core-contracts/a2aProtocol'
import { NeuroAffectiveStateSchema } from '../../packages/core-contracts/neuroAffective'
import { SubconsciousThoughtLogSchema } from '../../packages/core-contracts/subconscious'

// Dữ liệu giả cho các thẻ Bạn Đồng Hành ở TRẠNG THÁI SAU TƯƠNG TÁC (phiên đang chạy, bảng tổng kết,
// khối mở rộng…) — dùng cho e2e/a11y-interactive-states.spec.ts.
//
// Mọi bản ghi đều PARSE qua đúng hợp đồng Zod của `packages/core-contracts` (cùng khuôn
// `MOCK_APP_SETTINGS` ở helpers/auth.ts): hợp đồng đổi mà mock không đổi theo thì lỗi ngay lúc nạp
// file test, thay vì cổng a11y quét một giao diện mà production không bao giờ vẽ ra.
// Câu chữ cố ý dài vừa phải + có dấu tiếng Việt để đo tương phản trên chữ thật, không phải "x".

const NOW = '2026-10-09T08:00:00.000Z'
const PERSON_ID = '22222222-2222-4222-8222-222222222222'
const uuid = (n: number) =>
  `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`

// ── Scenario Holodeck (studio "Thử thách") ───────────────────────────────────────────────
const HOLODECK_SCENARIO = HolodeckScenarioSchema.parse({
  id: 'bigtech_panel_interview',
  title: 'Phỏng vấn hội đồng BigTech',
  description: 'Hội đồng ba người hỏi dồn về kiến trúc hệ thống và mức lương mong muốn.',
  scenarioType: 'panel_interview',
  difficulty: 'advanced',
  personas: [
    {
      id: 'p1',
      name: 'Linh (Tech Lead)',
      role: 'tech_lead',
      avatar: '/favicon.svg',
      temperament: 'skeptical',
      speakingStyle: 'Hỏi dồn, thẳng thắn',
    },
    {
      id: 'p2',
      name: 'Minh (CFO)',
      role: 'cfo_evaluator',
      avatar: '/favicon.svg',
      temperament: 'analytical',
      speakingStyle: 'Bám sát con số',
    },
  ],
  initialPrompt: 'Giới thiệu bản thân.',
  schemaVersion: 'v3.0.0',
})

const HOLODECK_TURNS: HolodeckSession['turns'] = [
  {
    turnIndex: 0,
    speakerType: 'persona',
    personaId: 'p1',
    content: 'Tell us about a system you scaled.',
    pressureScore: 40,
    timestamp: NOW,
  },
  {
    turnIndex: 1,
    speakerType: 'user',
    content: 'I scaled a payment service to ten thousand requests per second.',
    pressureScore: 45,
    timestamp: NOW,
    instantFeedback: {
      strengths: ['Số liệu cụ thể'],
      weaknesses: ['Thiếu bối cảnh'],
      suggestedNuance: 'Nêu rõ vai trò của bạn trong nhóm',
    },
  },
  {
    turnIndex: 2,
    speakerType: 'persona',
    personaId: 'p2',
    content: 'What did it cost the company?',
    pressureScore: 70,
    timestamp: NOW,
  },
]

function holodeckSession(status: 'active' | 'completed') {
  return HolodeckSessionSchema.parse({
    sessionId: uuid(1),
    personId: PERSON_ID,
    scenarioId: HOLODECK_SCENARIO.id,
    status,
    currentPressure: 70,
    turns: HOLODECK_TURNS,
    ...(status === 'completed'
      ? {
          finalRubric: {
            fluencyAndCoherence: 7,
            lexicalResource: 6.5,
            grammaticalRange: 7,
            strategicPersuasion: 6,
            overallBand: 6.5,
            detailedCritique: 'Bạn trả lời có số liệu nhưng cần dẫn dắt bối cảnh rõ hơn.',
            recommendedDrills: ['Luyện kể chuyện theo khung STAR', 'Từ vựng đàm phán lương'],
          },
        }
      : {}),
    createdAt: NOW,
    updatedAt: NOW,
    schemaVersion: 'v3.0.0',
  })
}

// ── Socratic Diagnostic (studio "Ghi nhớ") ───────────────────────────────────────────────
const SOCRATIC_TOPIC = MentalModelMisconceptionSchema.parse({
  id: 'present_perfect_past_confusion',
  title: 'Nhầm thì Hiện tại hoàn thành và Quá khứ đơn',
  domain: 'aspect_vs_tense_confusion',
  surfaceErrorPattern: 'I have seen him yesterday.',
  rootCauseAnalysis: 'Tiếng Việt dùng "đã" cho cả hai nghĩa nên người học gộp hai thì làm một.',
  inquiryPath: [
    {
      stepIndex: 0,
      guidingQuestion: 'Mốc "yesterday" đã kết thúc hay còn kéo dài tới bây giờ?',
      expectedMentalConcept: 'Mốc thời gian đã đóng',
      hintIfStuck: 'Hôm qua còn tiếp diễn tới lúc này không?',
    },
  ],
  schemaVersion: 'v3.0.0',
})

const SOCRATIC_FIRST_TURN = {
  stepIndex: 0,
  question: 'Mốc "yesterday" đã kết thúc hay còn kéo dài tới bây giờ?',
  learnerAnswer: 'Nó vẫn còn liên quan tới bây giờ.',
  conceptUnderstood: false,
  companionFeedback: 'Chưa đúng: hôm qua đã khép lại, hãy nghĩ xem thì nào hợp với mốc đã đóng.',
  timestamp: NOW,
}

function socraticRecord(status: 'in_progress' | 'breakthrough_achieved') {
  const record: CognitiveBreakthroughRecord = {
    id: uuid(3),
    personId: PERSON_ID,
    misconceptionId: SOCRATIC_TOPIC.id,
    status,
    currentStepIndex: status === 'in_progress' ? 0 : 1,
    turns:
      status === 'in_progress'
        ? [SOCRATIC_FIRST_TURN]
        : [
            SOCRATIC_FIRST_TURN,
            {
              stepIndex: 1,
              question: 'Vậy với mốc đã đóng, ta dùng thì nào?',
              learnerAnswer: 'Quá khứ đơn: I saw him yesterday.',
              conceptUnderstood: true,
              companionFeedback: 'Chính xác: mốc đã đóng thì dùng Quá khứ đơn.',
              timestamp: NOW,
            },
          ],
    ...(status === 'breakthrough_achieved'
      ? { breakthroughSummary: 'Bạn đã tự phân biệt được mốc thời gian đóng và mở.' }
      : {}),
    createdAt: NOW,
    updatedAt: NOW,
    schemaVersion: 'v3.0.0',
  }
  return CognitiveBreakthroughRecordSchema.parse(record)
}

// ── Phát âm 3D (studio "Thử thách") ──────────────────────────────────────────────────────
const ARTICULATORY_GUIDE = ArticulatoryGuideSchema.parse({
  targetPhoneme: 'TH_VOICELESS',
  ipaSymbol: 'θ',
  commonVietnameseMistake: 'Đọc thành /t/ hoặc "th" tiếng Việt.',
  tonguePosition: 'tip_between_teeth',
  jawOpening: 'half_open',
  lipShape: 'neutral',
  vocalCordVibration: false,
  airflowDescription: 'Luồng hơi thoát nhẹ qua khe giữa lưỡi và răng.',
  stepByStepAnatomyTips: ['Đặt đầu lưỡi giữa hai răng', 'Thổi hơi nhẹ', 'Không rung dây thanh'],
})

// ── Workplace Harvester, A2A, Thấu cảm sinh học (studio "Kế hoạch") ──────────────────────
const HARVESTED_MISTAKE = HarvestedMistakeSchema.parse({
  id: uuid(5),
  personId: PERSON_ID,
  sourceType: 'email',
  originalContextSnippet: 'Please discuss about the plan tomorrow.',
  detectedMistake: 'discuss about',
  nativeAlternative: 'discuss the plan',
  explanationVi: '"discuss" là ngoại động từ, không đi kèm "about".',
  errorCategory: 'preposition_misuse',
  cefrLevel: 'B1',
  urgency: 'critical',
  harvestedAt: NOW,
  convertedToSrs: false,
})

const SRS_CARD = AutoSrsCardSchema.parse({
  id: uuid(6),
  personId: PERSON_ID,
  mistakeId: HARVESTED_MISTAKE.id,
  frontPrompt: 'Viết lại cho tự nhiên: "I very like it"',
  backAnswer: 'I really like it',
  contextSentence: 'I really like it when the team ships early.',
  drillType: 'rephrase',
  cefrLevel: 'A2',
  repetitionIntervalDays: 3,
  nextReviewDate: NOW,
  createdAt: NOW,
  schemaVersion: 'v3.0.0',
})

const A2A_NEGOTIATION = A2ANegotiationResultSchema.parse({
  id: uuid(7),
  messageId: uuid(8),
  status: 'agreed',
  purpose: 'study_partner_handshake',
  agreedTerms: {
    skillTopic: 'IELTS Speaking',
    studyDurationMinutes: 45,
    disclosureLevel: 'direct_peer',
  },
  auditReceiptHash: 'abcdef1234567890abcdef',
  createdAt: NOW,
  schemaVersion: 'v3.0.0',
})

const A2A_MATCH = PeerStudyMatchSchema.parse({
  peerPersonId: uuid(9),
  peerDid: 'did:key:z6Mke2e',
  peerDisplayName: 'Hà',
  sharedSkill: 'Speaking',
  compatibilityScore: 0.86,
  recommendedGoal: 'Luyện nói ba buổi mỗi tuần',
})

const NEURO_STATE = NeuroAffectiveStateSchema.parse({
  id: uuid(1),
  personId: PERSON_ID,
  timestamp: NOW,
  energyLevel: 'peak_flow',
  stressIndex: 35,
  focusScore: 82,
  activeShields: ['mute_notifications'],
  recommendedAction: 'Giữ nhịp 45 phút rồi nghỉ 5 phút.',
  schemaVersion: 'v3.0.0',
})

// ── Nhận thức ngầm (studio "Ghi nhớ") ────────────────────────────────────────────────────
const SUBCONSCIOUS_THOUGHT = SubconsciousThoughtLogSchema.parse({
  id: uuid(2),
  personId: PERSON_ID,
  timestamp: NOW,
  cycleType: 'rem_consolidation',
  triggerSource: 'nightly_cron',
  hypothesesEvaluated: [
    {
      hypothesis: 'Học buổi sáng hiệu quả hơn buổi tối',
      confidence: 0.72,
      domain: 'learning',
      evidenceCount: 6,
      actionProposed: 'Dời phiên luyện nói lên 8 giờ sáng',
    },
  ],
  graphChanges: { nodesCreated: 4, edgesRewired: 7, redundantItemsPruned: 2 },
  preComputedStrategy: {
    vitalTasks: ['Ôn 10 thẻ SRS', 'Viết một đoạn IELTS Task 2'],
    potentialObstacles: ['Dễ xao nhãng vào buổi chiều'],
    recommendedMindset: 'Bắt đầu bằng việc nhỏ nhất để lấy đà.',
    targetDomainFocus: 'learning',
  },
  schemaVersion: 'v3.0.0',
})

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

const postAction = (route: Route): string | undefined => {
  try {
    const body: unknown = JSON.parse(route.request().postData() ?? '{}')
    return body && typeof body === 'object' && 'action' in body && typeof body.action === 'string'
      ? body.action
      : undefined
  } catch {
    return undefined
  }
}

/** Chặn mọi API mà bảy thẻ sau tương tác cần — GET trả dữ liệu, POST trả bước kế tiếp của luồng. */
export async function mockCompanionInteractiveApis(page: Page): Promise<void> {
  await page.route('**/api/scenario-holodeck**', (route) => {
    if (route.request().method() === 'GET') return json(route, { scenarios: [HOLODECK_SCENARIO] })
    if (postAction(route) === 'finalize')
      return json(route, { session: holodeckSession('completed') })
    const active = holodeckSession('active')
    return json(route, { session: active, updatedSession: active })
  })
  await page.route('**/api/socratic-diagnostics**', (route) => {
    if (route.request().method() === 'GET') return json(route, { misconceptions: [SOCRATIC_TOPIC] })
    if (postAction(route) === 'reflect')
      return json(route, { updatedRecord: socraticRecord('breakthrough_achieved') })
    return json(route, { session: socraticRecord('in_progress') })
  })
  // Chỉ còn GET hướng dẫn khẩu hình — POST "phân tích ngữ điệu" đã gỡ (changelog 0563).
  await page.route('**/api/articulatory-phonetics**', (route) =>
    json(route, { guide: ARTICULATORY_GUIDE }),
  )
  await page.route('**/api/workplace-insights**', (route) =>
    route.request().url().includes('kind=srs_cards')
      ? json(route, { cards: [SRS_CARD] })
      : json(route, { mistakes: [HARVESTED_MISTAKE] }),
  )
  await page.route('**/api/a2a**', (route) =>
    route.request().url().includes('kind=active')
      ? json(route, { negotiations: [A2A_NEGOTIATION] })
      : json(route, { matches: [A2A_MATCH] }),
  )
  await page.route('**/api/neuro-affective**', (route) => json(route, { state: NEURO_STATE }))
  await page.route('**/api/subconscious**', (route) =>
    json(route, { thought: SUBCONSCIOUS_THOUGHT }),
  )
}

/** Chữ hiển thị trong mock — spec dùng để chờ đúng trạng thái theo nội dung, không theo thời gian. */
export const MOCK_TEXT = {
  holodeckScenario: HOLODECK_SCENARIO.title,
  holodeckFirstTurn: HOLODECK_TURNS[0]?.content ?? '',
  socraticTopic: SOCRATIC_TOPIC.title,
  socraticFirstFeedback: SOCRATIC_FIRST_TURN.companionFeedback,
  articulatoryMistake: ARTICULATORY_GUIDE.commonVietnameseMistake,
  harvestedMistake: HARVESTED_MISTAKE.detectedMistake,
  srsFront: SRS_CARD.frontPrompt,
  a2aTopic: A2A_NEGOTIATION.agreedTerms.skillTopic ?? '',
  subconsciousHypothesis: SUBCONSCIOUS_THOUGHT.hypothesesEvaluated[0]?.hypothesis ?? '',
} as const

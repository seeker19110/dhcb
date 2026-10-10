// packages/core-personal/companionRuntime.ts — V2-09 Companion Runtime.
// Implements the canonical pipeline from 02-SYSTEM-ARCHITECTURE.md mục 3:
// Intent/Domain Resolver -> Context Builder -> Companion Planner -> Policy Engine
// -> Capability/Tool Router -> Result Validator & State Proposal -> Response.
import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import { z } from 'zod'
import { buildContextPackage, type ContextBuildOptions } from './contextEngine.js'
import { appendCompanionMessage } from './companionMessageService.js'
import { proposeAction, type ProposeActionInput } from './proposedActionService.js'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import { SensitivitySchema, type Sensitivity } from '@dhcb/core-contracts/personalFact'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import {
  extractInteractiveQuestions,
  INTERACTIVE_QUESTION_PROMPT_GUIDE,
  type InteractiveQuestion,
} from '@dhcb/core-contracts/interactiveQuestion'
import {
  getLearningReadModel,
  formatLearningReadModelForContext,
} from '@dhcb/core-learner/learningReadModelService'
import {
  getProgrammingProgressSummary,
  formatProgrammingProgressForContext,
} from '@dhcb/core-learner/programmingReadModelService'
import { getDomainReadModelForContext } from '@dhcb/core-domains/domainReadModelService'
import { callGroqChatWithKeyPool } from '@dhcb/core-ai/chatProviders'
import { callAnthropicText } from '@dhcb/core-ai/anthropicClient'
import {
  describeAnthropicFailure,
  describeChatCallFailure,
  describeThrown,
} from '@dhcb/core-ai/providerFailure'
import { callGemini } from '@dhcb/core-ai/geminiApi'
import { GEMINI_CHAT_MODEL, GROQ_CHAT_MODEL, getAnthropicRoute } from '@dhcb/core-ai/aiConfig'
import { recordAiTokenUsage, type AiTokenUsage } from '@dhcb/core-ai/aiTokenUsage'

export const COMPANION_SYSTEM_PROMPT =
  'Bạn là Bạn Đồng Hành AI — Người đồng hành trí tuệ, thấu cảm và tận tâm trong nền tảng "Đồng Hành Cùng Bạn".\n\n' +
  '🌟 SỨ MỆNH & ĐỊNH HƯỚNG CỦA BẠN:\n' +
  'Đồng hành cùng người dùng trên hành trình tự học, phát triển bản thân và làm chủ cuộc sống xuyên suốt 5 lĩnh vực cốt lõi:\n' +
  '1. 📚 Học tập (Learning): Làm chủ tiếng Anh (IELTS, phát âm IPA, từ vựng theo ngữ cảnh, giao tiếp tự nhiên) và LẬP TRÌNH từ số 0 (Python, thang bậc P1–P6, học qua một dự án xuyên suốt), cùng phương pháp tự học Socratic và tư duy đa ngành.\n' +
  '2. 💼 Sự nghiệp (Career): Định hướng phát triển nghề nghiệp, giải mã năng lực cá nhân, xây dựng lộ trình thăng tiến bền vững theo chuẩn quốc tế.\n' +
  '3. ⚡ Công việc (Work): Giải quyết bài toán chuyên môn, tư duy hệ thống & kiến trúc, nâng cao năng suất và ra quyết định hiệu quả.\n' +
  '4. 🚀 Khởi nghiệp (Venture): Thẩm định ý tưởng sáng tạo, kiểm chứng giả định thực tế, phản biện logic và xây dựng giải pháp thực thi tinh gọn.\n' +
  '5. 🌿 Đời sống (Life): Cân bằng thân - tâm - trí, quản lý nhịp sinh học, nuôi dưỡng thói quen tích cực và duy trì trạng thái dòng chảy (Flow State).\n\n' +
  '💬 PHONG CÁCH GIAO TIẾP & TÍNH CÁCH:\n' +
  '- Thân thiện, chân thành, ấm áp, giàu năng lượng tích cực và luôn sẵn sàng lắng nghe.\n' +
  '- Xưng hô linh hoạt, tự nhiên ("tôi" - "bạn" hoặc "Đồng Hành" - "bạn") như một người bạn tri kỷ, một cố vấn đáng tin cậy.\n' +
  '- Dẫn dắt thông minh bằng phương pháp gợi mở Socratic: không áp đặt câu trả lời cứng nhắc mà đặt những câu hỏi sâu sắc để người dùng tự khám phá tiềm năng.\n' +
  '- Câu trả lời súc tích, gãy gọn, có cấu trúc mạch lạc, truyền cảm hứng và mang tính hành động cụ thể.\n' +
  '- Ngôn ngữ: Sử dụng tiếng Việt tự nhiên, chuẩn mực; kết hợp song ngữ Việt - Anh khi hỗ trợ học tiếng Anh để tăng tính tương tác và phản xạ.\n'

export const CompanionRequestSchema = z.object({
  personId: z.string().uuid(),
  userMessage: z.string().min(1).max(2000),
  intent: z.string().max(100).optional(),
  targetDomain: z.string().max(100).optional(),
  tokenBudget: z.number().int().positive().max(8000).optional(),
  // Tham số nội bộ do API suy từ phiên 2FA, không lấy từ JSON người dùng.
  maxSensitivity: SensitivitySchema.default('personal'),
})

export type CompanionRequest = z.input<typeof CompanionRequestSchema>

export interface PlannedStep {
  capabilityId: string
  action: string
  targetDomain: string
  payload: Record<string, unknown>
  riskLevel: 'low' | 'medium' | 'high' | 'restricted'
  description: string
}

export interface CompanionExecutionSummary {
  plannedSteps: number
  executedSteps: number
  pendingConfirmationSteps: number
  rejectedSteps: number
}

export interface CompanionResponse {
  reply: string
  intent: string
  targetDomain: string
  contextPackage: ContextPackage
  proposedActions: ProposedAction[]
  executionSummary: CompanionExecutionSummary
  /**
   * Câu hỏi tick chọn kèm theo lượt trả lời (rỗng khi LLM chỉ trả lời bằng lời văn). Giao diện
   * dựng thành checkbox/radio để người dùng khỏi phải gõ tay — xem
   * `packages/core-contracts/interactiveQuestion.ts`.
   */
  interactiveQuestions: InteractiveQuestion[]
  /**
   * `true` khi KHÔNG nhà cung cấp AI nào trả lời được và `reply` là câu mẫu tất định
   * (`synthesizeReply`). Handler dựa vào cờ này để HOÀN LƯỢT — không trừ lượt cho một câu trả
   * lời AI không hề viết (audit 2026-10-10, E1).
   */
  isFallback: boolean
}

/** Kết quả `synthesizeCompanionReply`: lời văn + có phải câu mẫu dự phòng không. */
export interface CompanionReplyResult {
  text: string
  isFallback: boolean
}

/**
 * Câu nối vào cuối câu mẫu khi rơi về dự phòng — để người dùng KHÔNG tưởng đây là AI vừa trả
 * lời (`chatFallback.ts` cũng cố ý không "âm thầm đưa nội dung mẫu ra"). Lượt bị hoàn ở handler.
 */
export const AI_UNAVAILABLE_NOTE =
  '(Trợ lý AI đang tạm gián đoạn nên đây là phản hồi tự động; lượt dùng lần này không bị tính. Bạn thử lại sau ít phút nhé.)'

/**
 * Từ khoá nhận diện 4 trụ Career · Work · Startup · Life trong câu người dùng.
 *
 * Cố ý dùng bảng từ khoá TẤT ĐỊNH thay vì hỏi LLM: bước này chạy trước cả khi dựng ngữ cảnh,
 * nên nó phải rẻ, nhanh và cho ra cùng một kết quả mỗi lần với cùng một câu (test kiểm được).
 * Nhận diện sai thì hậu quả chỉ là nạp thiếu/thừa một khối tóm tắt, không phá hỏng lượt thoại.
 *
 * GIỚI HẠN đã biết: câu gọi tên NHIỀU trụ cùng lúc (vd "cân bằng cuộc sống và công việc") sẽ
 * lấy trụ đứng trước trong bảng — ở đây là Work. Không có đáp án đúng duy nhất cho loại câu đó,
 * nên bảng cố ý KHÔNG cố xử lý; nếu người dùng cần trụ khác thì giao diện vẫn truyền
 * `targetDomain` tường minh và giá trị đó luôn thắng bảng từ khoá.
 */
const DOMAIN_KEYWORDS: ReadonlyArray<readonly [domain: string, keywords: readonly string[]]> = [
  [
    'career',
    ['sự nghiệp', 'nghề nghiệp', 'thăng tiến', 'tuyển dụng', 'phỏng vấn', 'cv ', 'career'],
  ],
  [
    'startup',
    ['khởi nghiệp', 'startup', 'venture', 'gọi vốn', 'mvp', 'giả định', 'khách hàng mục tiêu'],
  ],
  [
    'work',
    ['công việc', 'dự án', 'deadline', 'cuộc họp', 'task', 'kanban', 'năng suất', 'công ty'],
  ],
  [
    'life',
    [
      'đời sống',
      'cuộc sống',
      'thói quen',
      'sức khoẻ',
      'sức khỏe',
      'giấc ngủ',
      'cân bằng',
      'stress',
    ],
  ],
]

export function detectDomainByKeyword(lowerCaseMessage: string): string | null {
  for (const [domain, keywords] of DOMAIN_KEYWORDS) {
    if (keywords.some((k) => lowerCaseMessage.includes(k))) return domain
  }
  return null
}

/**
 * 1. Intent & Domain Resolver
 * Deterministically extracts intent and domain based on pattern analysis or user specification.
 */
export function resolveIntentAndDomain(
  userMessage: string,
  explicitIntent?: string,
  explicitDomain?: string,
): { intent: string; domain: string } {
  if (explicitIntent && explicitDomain) {
    return { intent: explicitIntent, domain: explicitDomain }
  }

  const msg = userMessage.trim().toLowerCase()

  // Bảng từ khoá 4 trụ. Tính sẵn ở đây nhưng CHỈ dùng ở hai chỗ có kiểm soát bên dưới —
  // KHÔNG cho nó chặn đầu mọi nhánh, vì các ý định HÀNH ĐỘNG (tra từ, ghi nhớ, cập nhật hồ sơ)
  // phải được ưu tiên: câu "ghi nhớ giúp tôi cuộc họp ngày mai" chứa từ khoá trụ Work nhưng
  // việc người dùng muốn là LƯU GHI NHỚ, không phải bàn chuyện công việc.
  const domainByKeyword = detectDomainByKeyword(msg)

  // Goal-setting patterns
  if (
    msg.includes('mục tiêu') ||
    msg.includes('đặt mục tiêu') ||
    msg.includes('goal') ||
    msg.includes('học ielts') ||
    msg.includes('ielts')
  ) {
    // "mục tiêu" là từ CHUNG của cả 5 trụ. Chỉ coi là mục tiêu HỌC TẬP khi câu không nói rõ
    // về trụ nào khác — nếu không, câu "mục tiêu sự nghiệp của tôi là gì" sẽ bị gán
    // domain='learning' và Companion nạp nhầm ngữ cảnh học tập.
    if (domainByKeyword) {
      return {
        intent: explicitIntent ?? 'domain_conversation',
        domain: explicitDomain ?? domainByKeyword,
      }
    }
    return {
      intent: explicitIntent ?? 'set_learning_goal',
      domain: explicitDomain ?? 'learning',
    }
  }

  // Dictionary / Lookup patterns
  if (
    msg.includes('nghĩa là gì') ||
    msg.includes('nghĩa của từ') ||
    msg.includes('tra từ') ||
    msg.includes('lookup') ||
    msg.includes('dictionary')
  ) {
    return {
      intent: explicitIntent ?? 'dictionary_lookup',
      domain: explicitDomain ?? 'learning',
    }
  }

  // Profile / Fact update patterns
  if (
    msg.includes('tôi thích') ||
    msg.includes('sở thích') ||
    msg.includes('thông tin của tôi') ||
    msg.includes('cập nhật thông tin') ||
    msg.includes('tôi là')
  ) {
    return {
      intent: explicitIntent ?? 'update_profile_fact',
      domain: explicitDomain ?? 'profile',
    }
  }

  // Memory / Note patterns
  if (
    msg.includes('ghi nhớ') ||
    msg.includes('nhớ giúp') ||
    msg.includes('lưu ý') ||
    msg.includes('remember') ||
    msg.includes('note')
  ) {
    return {
      intent: explicitIntent ?? 'create_memory',
      domain: explicitDomain ?? 'personal',
    }
  }

  // Không khớp ý định hành động nào — giờ mới tới lượt bảng từ khoá trụ.
  if (domainByKeyword) {
    return {
      intent: explicitIntent ?? 'domain_conversation',
      domain: explicitDomain ?? domainByKeyword,
    }
  }

  // Mặc định là 'general', KHÔNG phải 'learning'. Trước đây mọi câu không nhận diện được đều
  // bị gán 'learning' → Companion nạp ngữ cảnh học tập và nói với LLM "lĩnh vực trọng tâm:
  // learning" ngay cả khi người dùng đang hỏi chuyện khác. 'general' đã được
  // synthesizeCompanionReply xử lý sẵn (bỏ dòng "lĩnh vực trọng tâm"), tức là giá trị trung
  // tính vốn đã có chỗ đứng trong mã.
  return {
    intent: explicitIntent ?? 'general_conversation',
    domain: explicitDomain ?? 'general',
  }
}

/**
 * 2. Companion Planner
 * Generates an executable plan (list of PlannedSteps) from the resolved intent & context.
 */
export function generatePlan(intent: string, domain: string, userMessage: string): PlannedStep[] {
  const steps: PlannedStep[] = []

  switch (intent) {
    case 'set_learning_goal':
      steps.push({
        capabilityId: 'learning.update_goal',
        action: 'update_goal',
        targetDomain: domain,
        payload: {
          rawMessage: userMessage,
          source: 'companion_runtime',
          proposedAt: new Date().toISOString(),
        },
        riskLevel: 'medium',
        description: 'Cập nhật mục tiêu học tập cho người học',
      })
      break

    case 'dictionary_lookup': {
      // Extract candidate word if possible
      const match = userMessage.match(/(?:nghĩa của từ|tra từ|từ)\s+["']?([a-zA-Z\s-]+)["']?/i)
      const word = match ? match[1]?.trim() : userMessage.trim()
      steps.push({
        capabilityId: 'dictionary.lookup',
        action: 'lookup',
        targetDomain: 'learning',
        payload: { word: word || 'learning' },
        riskLevel: 'low',
        description: `Tra cứu định nghĩa từ vựng: ${word}`,
      })
      break
    }

    case 'update_profile_fact':
      steps.push({
        capabilityId: 'profile.update_fact',
        action: 'update_fact',
        targetDomain: domain,
        payload: {
          rawText: userMessage,
          origin: 'observed',
          confidence: 0.85,
        },
        riskLevel: 'low',
        description: 'Cập nhật sự thật hồ sơ người học',
      })
      break

    case 'create_memory':
      steps.push({
        capabilityId: 'memory.create_record',
        action: 'create_record',
        targetDomain: 'personal',
        payload: {
          content: userMessage,
          namespace: 'semantic',
          sensitivity: 'personal',
        },
        riskLevel: 'low',
        description: 'Lưu bản ghi bộ nhớ mới',
      })
      break

    default:
      // No active tool proposal needed for simple chat
      break
  }

  return steps
}

/**
 * 3. Synthesizes a response message for the user based on context and executed actions.
 */
export function synthesizeReply(
  userMessage: string,
  intent: string,
  proposedActions: ProposedAction[],
  contextPackage: ContextPackage,
): string {
  const committed = proposedActions.filter((a) => a.status === 'committed')
  const pending = proposedActions.filter((a) => a.status === 'pending')
  const rejected = proposedActions.filter((a) => a.status === 'rejected')

  const parts: string[] = []

  if (intent === 'set_learning_goal') {
    parts.push('Tôi đã ghi nhận mong muốn học tập của bạn.')
  } else if (intent === 'dictionary_lookup') {
    parts.push('Tôi đã tra cứu từ vựng theo yêu cầu của bạn.')
  } else if (intent === 'update_profile_fact') {
    parts.push('Tôi đã cập nhật thông tin hồ sơ của bạn.')
  } else if (intent === 'create_memory') {
    parts.push('Tôi đã lưu lại ghi nhớ này vào kho kiến thức cá nhân.')
  } else {
    parts.push(`Đồng Hành đã nhận được tin nhắn: "${userMessage}".`)
  }

  if (committed.length > 0) {
    parts.push(`Đã tự động thực hiện ${committed.length} tác vụ an toàn.`)
  }

  if (pending.length > 0) {
    parts.push(`Có ${pending.length} đề xuất hành động cần bạn xác nhận trước khi áp dụng.`)
  }

  if (rejected.length > 0) {
    parts.push(`Có ${rejected.length} tác vụ bị từ chối do chính sách bảo mật.`)
  }

  if (contextPackage.items.length > 0) {
    parts.push(`[Sử dụng ${contextPackage.tokenUsed}/${contextPackage.tokenBudget} token ngữ cảnh]`)
  }

  return parts.join(' ')
}

/**
 * Sinh câu trả lời bằng nhà cung cấp AI thật (Anthropic → Groq → Gemini). Mọi nhánh lỗi đều GHI
 * LOG; hết nhánh (hoặc không có key nào) thì trả câu mẫu tất định kèm `isFallback: true`.
 */
export async function synthesizeCompanionReply(
  userMessage: string,
  intent: string,
  domain: string,
  proposedActions: ProposedAction[],
  contextPackage: ContextPackage,
): Promise<CompanionReplyResult> {
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const fallback = (): CompanionReplyResult => ({
    text: `${synthesizeReply(userMessage, intent, proposedActions, contextPackage)} ${AI_UNAVAILABLE_NOTE}`,
    isFallback: true,
  })

  if (!groqKey && !geminiKey && !anthropicKey) {
    console.warn('[companion] không có key AI nào — trả câu mẫu dự phòng')
    return fallback()
  }

  const historyItems = contextPackage.items.filter(
    (item) =>
      item.sourceType === 'recent_episodic_context' &&
      /^companion_message:(user|companion):/.test(item.provenance),
  )
  const contextDetails = contextPackage.items
    .filter((item) => item.sourceType !== 'current_request' && !historyItems.includes(item))
    .map((item) => `- [${item.sourceType}]: ${item.content}`)
    .join('\n')

  const actionsSummary =
    proposedActions.length > 0
      ? `\n\nCác tác vụ hệ thống liên quan:\n` +
        proposedActions
          .map(
            (a) =>
              `- Tác vụ: ${a.action} (Lĩnh vực: ${a.targetDomain}, Trạng thái: ${a.status}, Mức rủi ro: ${a.riskLevel})`,
          )
          .join('\n')
      : ''

  const domainContext =
    domain && domain !== 'general' && domain !== 'all'
      ? `Lĩnh vực trọng tâm của lượt thoại này: ${domain}.\n`
      : ''

  const systemPrompt = `${COMPANION_SYSTEM_PROMPT}\n${domainContext}${
    contextDetails ? `\nThông tin ngữ cảnh người dùng trích xuất:\n${contextDetails}` : ''
  }${actionsSummary}${INTERACTIVE_QUESTION_PROMPT_GUIDE}\n\nHãy trả lời người dùng với giọng điệu tự nhiên, ấm áp, thông tuệ và truyền cảm hứng dựa trên ngữ cảnh.`

  // Lịch sử đứng TRƯỚC tin nhắn hiện tại, đúng thứ tự thời gian — nhà cung cấp LLM nào cũng đọc
  // mảng messages theo thứ tự này để hiểu mạch hội thoại.
  const messages = [
    ...historyItems.map((item) => ({
      role: item.provenance.startsWith('companion_message:user:') ? 'user' : 'assistant',
      content: item.content,
    })),
    {
      role: 'user',
      content:
        contextPackage.items.find((item) => item.sourceType === 'current_request')?.content ?? '',
    },
  ]

  // 1. Nhánh Anthropic Claude (AI chính — nhiệm vụ 'companion' → Sonnet, xem aiConfig.ts)
  if (anthropicKey) {
    const anthropicRes = await callAnthropicText({
      apiKey: anthropicKey,
      route: getAnthropicRoute('companion'),
      system: systemPrompt,
      messages,
    })
    // Ghi chi phí cả khi response không dùng được (bị cắt/từ chối) — token vẫn bị tính tiền.
    if (anthropicRes.kind === 'success' || anthropicRes.kind === 'unusable') {
      void recordAiTokenUsage({
        provider: 'anthropic',
        model: anthropicRes.model,
        mode: 'companion',
        usage: anthropicRes.usage,
      })
    }
    if (anthropicRes.kind === 'success') return { text: anthropicRes.text, isFallback: false }
    // thất bại → thử Groq/Gemini
    console.warn(`[companion] Anthropic ${describeAnthropicFailure(anthropicRes)}`)
  }

  // 2. Nhánh Groq (dự phòng thứ nhất — chung model với gia sư tiếng Anh: GROQ_CHAT_MODEL)
  if (groqKey) {
    try {
      const groqRes = await callGroqChatWithKeyPool(
        GROQ_CHAT_MODEL,
        systemPrompt,
        messages,
        2048,
        30_000,
      )
      if (groqRes.kind === 'success' && groqRes.text.trim()) {
        // Ghi chi phí AI theo token THẬT (mục N4) — mode 'companion' để tách khỏi lượt gia sư
        // tiếng Anh trong dashboard. Không await: đo đạc không được làm chậm câu trả lời.
        void recordAiTokenUsage({
          provider: 'groq',
          model: groqRes.model,
          mode: 'companion',
          usage: groqRes.usage,
        })
        return { text: groqRes.text.trim(), isFallback: false }
      }
      console.warn(
        `[companion] Groq ${groqRes.kind === 'success' ? 'trả text rỗng' : describeChatCallFailure(groqRes)}`,
      )
    } catch (err) {
      console.warn(`[companion] Groq lỗi: ${describeThrown(err)}`)
    }
  }

  // 3. Nhánh Google Gemini (dự phòng — chung model với gia sư tiếng Anh: GEMINI_CHAT_MODEL)
  if (geminiKey) {
    let geminiUsage: AiTokenUsage | null = null
    try {
      const geminiText = await callGemini(
        geminiKey,
        GEMINI_CHAT_MODEL,
        systemPrompt,
        messages as Array<{ role: 'user' | 'assistant'; content: string }>,
        2048,
        undefined,
        (usage) => {
          geminiUsage = usage
        },
      )
      void recordAiTokenUsage({
        provider: 'gemini',
        model: GEMINI_CHAT_MODEL,
        mode: 'companion',
        usage: geminiUsage,
      })
      if (geminiText && geminiText.trim()) {
        return { text: geminiText.trim(), isFallback: false }
      }
      console.warn('[companion] Gemini trả text rỗng')
    } catch (err) {
      console.warn(`[companion] Gemini lỗi: ${describeThrown(err)}`)
    }
  }

  // Mọi nhà cung cấp đều hỏng → câu mẫu + cờ dự phòng (handler hoàn lượt). `error` chứ không
  // phải `warn`: tới được đây nghĩa là Companion đang KHÔNG có AI cho bất kỳ ai.
  console.error('[companion] mọi nhà cung cấp AI đều lỗi — trả câu mẫu dự phòng')
  return fallback()
}

/**
 * Main Companion Runtime Execution Entrypoint.
 * Connects Intent/Domain Resolution -> Context Builder -> Planner -> Policy Gate -> ProposedActions -> Response.
 */
export async function executeCompanionTurn(
  pool: Pool,
  request: CompanionRequest,
): Promise<CompanionResponse> {
  const validated = CompanionRequestSchema.parse(request)
  const {
    personId,
    userMessage,
    intent: explicitIntent,
    targetDomain: explicitDomain,
    tokenBudget,
    maxSensitivity,
  } = validated

  // Step 1: Intent & Domain Resolution
  const { intent, domain } = resolveIntentAndDomain(userMessage, explicitIntent, explicitDomain)

  // Step 2: Context Resolution (Context Engine with Domain Read Model)
  let domainState: ContextBuildOptions['domainState'] = undefined
  if (domain === 'learning') {
    try {
      const personRow = await pool.query<{ user_id: string }>(
        'select user_id from personal.persons where id = $1',
        [personId],
      )
      const userId = personRow.rows[0]?.user_id ?? personId
      const learningModel = await getLearningReadModel(pool, { personId, userId })
      // Môn Lập trình có khuôn tiến độ riêng (bậc P1–P6, không phải CEFR) nên nối thêm một
      // dòng thay vì nhồi vào LearningReadModel — và chỉ nối khi người học ĐÃ chạm vào môn.
      const programming = formatProgrammingProgressForContext(
        await getProgrammingProgressSummary(pool, userId),
      )
      const learningContext = formatLearningReadModelForContext(learningModel)
      domainState = {
        sourceId: personId,
        content: programming ? `${learningContext}\n${programming}` : learningContext,
        provenance: 'learning:read_model',
      }
    } catch {
      // Graceful fallback
    }
  } else {
    // 4 trụ Career/Work/Startup/Life — cùng khuôn "read model nạp vào ngữ cảnh" như Learning.
    // Hỏng thì đi tiếp với ngữ cảnh rỗng: thiếu một khối tóm tắt vẫn hơn là không trả lời được.
    // Việc khối này có THỰC SỰ được nạp hay không do cổng `isConsentActive(personId, domain,
    // purpose)` trong contextEngine quyết định — ở đây KHÔNG lách cổng đó.
    try {
      const content = await getDomainReadModelForContext(pool, personId, domain)
      if (content) {
        domainState = { sourceId: personId, content, provenance: `${domain}:read_model` }
      }
    } catch {
      // Graceful fallback
    }
  }

  const contextOptions: ContextBuildOptions = {
    personId,
    requestId: randomUUID(),
    requestText: userMessage,
    domain,
    purpose: 'companion_conversation',
    includeCompanionHistory: true,
    maxSensitivity,
    ...(domainState ? { domainState } : {}),
    ...(tokenBudget !== undefined ? { tokenBudget } : {}),
  }
  const contextPackage = await buildContextPackage(pool, contextOptions)

  // Step 3: Companion Planner
  const plannedSteps = generatePlan(intent, domain, userMessage)

  // Step 4 & 5: Policy Gate & Capability/Tool Router (State Proposal via proposeAction)
  const proposedActions: ProposedAction[] = []
  let executedCount = 0
  let pendingCount = 0
  let rejectedCount = 0

  for (const step of plannedSteps) {
    const proposeInput: ProposeActionInput = {
      personId,
      capabilityId: step.capabilityId,
      action: step.action,
      targetDomain: step.targetDomain,
      payload: step.payload,
      riskLevel: step.riskLevel,
    }

    const result = await proposeAction(pool, proposeInput)
    proposedActions.push(result.action)

    if (result.action.status === 'committed') {
      executedCount++
    } else if (result.action.status === 'pending') {
      pendingCount++
    } else if (result.action.status === 'rejected') {
      rejectedCount++
    }
  }

  // Step 6: Synthesize Read Model / Intelligent LLM Response
  const { text: rawReply, isFallback } = await synthesizeCompanionReply(
    userMessage,
    intent,
    domain,
    proposedActions,
    contextPackage,
  )

  // Step 7: Tách khối câu hỏi tick chọn (nếu có) ra khỏi lời văn — khối JSON không bao giờ được
  // lọt xuống giao diện dưới dạng chữ thô.
  const { text: reply, questions: interactiveQuestions } = extractInteractiveQuestions(rawReply)

  // Step 8: Lưu cả hai vế của lượt thoại để lần sau mở lại vẫn còn. Ghi lỗi thì KHÔNG làm hỏng
  // câu trả lời đang trả về cho người dùng — họ vẫn đọc được, chỉ là lượt này không vào lịch sử.
  const sensitivityLevels: Sensitivity[] = ['public', 'personal', 'sensitive', 'restricted']
  const transcriptSensitivity =
    sensitivityLevels[
      Math.max(
        1,
        ...contextPackage.items.map((item) => sensitivityLevels.indexOf(item.sensitivity)),
      )
    ] ?? 'sensitive'
  try {
    await appendCompanionMessage(pool, {
      personId,
      role: 'user',
      content: userMessage,
      sensitivity: transcriptSensitivity,
      domain,
      intent,
    })
    if (reply.trim()) {
      await appendCompanionMessage(pool, {
        personId,
        role: 'companion',
        content: reply,
        sensitivity: transcriptSensitivity,
        domain,
        intent,
      })
    }
  } catch {
    // bỏ qua: lịch sử là tiện ích, không phải điều kiện để trả lời
  }

  return {
    reply,
    interactiveQuestions,
    isFallback,
    intent,
    targetDomain: domain,
    contextPackage,
    proposedActions,
    executionSummary: {
      plannedSteps: plannedSteps.length,
      executedSteps: executedCount,
      pendingConfirmationSteps: pendingCount,
      rejectedSteps: rejectedCount,
    },
  }
}

export type CompanionStreamEvent =
  | { type: 'meta'; data: { intent: string; targetDomain: string; contextPackage: ContextPackage } }
  | { type: 'chunk'; data: { delta: string } }
  | {
      type: 'actions'
      data: {
        proposedActions: ProposedAction[]
        executionSummary: CompanionExecutionSummary
      }
    }
  | { type: 'questions'; data: { interactiveQuestions: InteractiveQuestion[] } }
  | { type: 'done'; data: CompanionResponse }
  | { type: 'error'; data: { message: string } }

/**
 * Async generator for Streaming Companion responses over Server-Sent Events (SSE).
 * Yields meta -> text chunks -> proposed actions -> final done response.
 */
export async function* streamCompanionTurn(
  pool: Pool,
  request: CompanionRequest,
): AsyncGenerator<CompanionStreamEvent, CompanionResponse, unknown> {
  // Execute the turn logic
  const response = await executeCompanionTurn(pool, request)

  // 1. Emit metadata event
  yield {
    type: 'meta',
    data: {
      intent: response.intent,
      targetDomain: response.targetDomain,
      contextPackage: response.contextPackage,
    },
  }

  // 2. Emit streaming text chunks (word by word / clause by clause)
  const words = response.reply.split(' ')
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i]
    yield {
      type: 'chunk',
      data: { delta: chunk },
    }
  }

  // 3. Emit proposed actions
  yield {
    type: 'actions',
    data: {
      proposedActions: response.proposedActions,
      executionSummary: response.executionSummary,
    },
  }

  // 3b. Emit câu hỏi tick chọn (chỉ khi có) — sự kiện riêng để client cũ bỏ qua được an toàn.
  if (response.interactiveQuestions.length > 0) {
    yield {
      type: 'questions',
      data: { interactiveQuestions: response.interactiveQuestions },
    }
  }

  // 4. Emit final done event
  yield {
    type: 'done',
    data: response,
  }

  return response
}

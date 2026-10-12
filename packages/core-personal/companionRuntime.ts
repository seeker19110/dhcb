// packages/core-personal/companionRuntime.ts — V2-09 Companion Runtime.
// Implements the canonical pipeline from 02-SYSTEM-ARCHITECTURE.md mục 3:
// Intent/Domain Resolver -> Context Builder -> Companion Planner -> Policy Engine
// -> Capability/Tool Router -> Result Validator & State Proposal -> Response.
//
// [2026-10-11 — nâng cấp Companion GĐ1, `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md`]
// Lượt thoại tách thành ba chặng để stream được THẬT:
//   prepareCompanionTurn  → ý định · hồ sơ (nhóm tuổi) · ngữ cảnh · LỚP AN TOÀN · kế hoạch · đề xuất
//   synthesizeCompanionReply → gọi AI, phát từng mẩu chữ qua `onDelta` (Claude) khi có
//   finalizeCompanionTurn → tách khối câu hỏi tick, lưu transcript, dựng CompanionResponse
// `executeCompanionTurn` = ba chặng nối liền; `streamCompanionTurn` chen `yield` vào giữa.
// Prompt hệ thống nằm ở `companionPrompt.ts`; lớp an toàn ở `safetyGuard.ts`.
//
// [2026-10-12 — GĐ3, `docs/specs/2026-10-12-ban-dong-hanh-gd3-tac-tu-cong-cu.md`] CHẾ ĐỘ TÁC TỬ:
// nơi gọi truyền tham số `agent` (toolkit do server tiêm) ⇒ ý định do Haiku định tuyến
// (`intentRouter.ts`), Claude tự gọi công cụ đọc/đề xuất (`companionTools.ts` +
// `anthropicToolLoop.ts`) thay cho planner từ khoá. Không truyền `agent` ⇒ hành vi cũ. Mọi chế độ:
// câu trả lời cuối qua `finalAnswerChecks.ts` trước khi lưu/trả về.
import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import { z } from 'zod'
import { buildContextPackage, type ContextBuildOptions } from './contextEngine.js'
import { appendCompanionMessage } from './companionMessageService.js'
import { proposeAction, type ProposeActionInput } from './proposedActionService.js'
import { buildCompanionSystemPrompt, type ContextBlock } from './companionPrompt.js'
import { assessSafety, type SafetyAssessment } from './safetyGuard.js'
import { routeIntent } from './intentRouter.js'
import {
  createCompanionToolSession,
  toolLabel,
  type CompanionAgentToolkit,
  type CompanionToolSession,
} from './companionTools.js'
import { runFinalAnswerChecks } from './finalAnswerChecks.js'
import { isConsentActive } from './consentService.js'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import { SensitivitySchema, type Sensitivity } from '@dhcb/core-contracts/personalFact'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import { AgeGroupSchema, type AgeGroup } from '@dhcb/core-contracts/intake'
import { buildSafetyNotice, type CompanionSafetyNotice } from '@dhcb/core-contracts/companionSafety'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'
import {
  extractInteractiveQuestions,
  INTERACTIVE_QUESTION_FENCE,
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
import { runAnthropicToolLoop, type ToolCallRecord } from '@dhcb/core-ai/anthropicToolLoop'
import {
  describeAnthropicFailure,
  describeChatCallFailure,
  describeThrown,
} from '@dhcb/core-ai/providerFailure'
import { callGemini } from '@dhcb/core-ai/geminiApi'
import { GEMINI_CHAT_MODEL, GROQ_CHAT_MODEL, getAnthropicRoute } from '@dhcb/core-ai/aiConfig'
import { recordAiTokenUsage, type AiTokenUsage } from '@dhcb/core-ai/aiTokenUsage'

/**
 * Ngân sách ngữ cảnh mặc định của một lượt Companion (token ước lượng). Trước 2026-10-11 dùng
 * mặc định 2000 của Context Engine — chỉ đủ khoảng 4–5 lượt lịch sử sau khi trừ hồ sơ/ghi chú,
 * nên Companion "quên" sớm. 4000 ≈ 0,8¢ token vào mỗi lượt ở Sonnet khi KHÔNG trúng cache
 * (phần đầu lặp lại được cache 10% giá) — chấp nhận được với hạn mức 30 lượt/ngày.
 */
export const COMPANION_DEFAULT_TOKEN_BUDGET = 4000

export const CompanionRequestSchema = z.object({
  personId: z.string().uuid(),
  // Postgres không lưu được ký tự NUL (mã điểm 0) — từ chối ngay ở schema thay vì để vỡ 500 ở câu
  // SQL lưu transcript (red-team `rt-pi-12`). Viết bằng mã điểm, không escape (TRAPS.md mục 8).
  userMessage: z
    .string()
    .min(1)
    .max(2000)
    .refine((m) => !m.includes(String.fromCharCode(0)), 'Tin nhắn chứa ký tự NUL không hợp lệ'),
  intent: z.string().max(100).optional(),
  targetDomain: z.string().max(100).optional(),
  tokenBudget: z.number().int().positive().max(8000).optional(),
  // Tham số nội bộ do API suy từ phiên 2FA, không lấy từ JSON người dùng.
  maxSensitivity: SensitivitySchema.default('personal'),
  // PHIÊN TẠM (GĐ2a): không đọc ký ức/hồ sơ/lịch sử, không lưu transcript, không đề xuất "lưu
  // ký ức". Lớp an toàn vẫn chạy. Tóm tắt môn học vẫn nạp (dữ liệu app người dùng vốn thấy).
  ephemeral: z.boolean().default(false),
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
  /**
   * Thẻ hỗ trợ khủng hoảng — chỉ có khi lớp an toàn kết luận `concern`/`imminent`. Mức
   * `imminent`: `reply` là câu cố định do người viết (không gọi LLM) và handler HOÀN LƯỢT.
   */
  safety?: CompanionSafetyNotice
}

/** Kết quả `synthesizeCompanionReply`: lời văn + có phải câu mẫu dự phòng không. */
export interface CompanionReplyResult {
  text: string
  isFallback: boolean
  /**
   * `true` khi chữ của `text` ĐÃ được phát trọn qua `onDelta` (Claude stream thành công).
   * `false`/thiếu: nơi gọi phải tự phát `text` (dự phòng Groq/Gemini, câu cố định, hoặc Claude
   * rớt giữa chừng rồi nhà cung cấp khác trả bản đầy đủ).
   */
  streamed?: boolean
  /** Đề xuất do công cụ tạo trong lượt (chế độ tác tử) — gộp vào response ở chặng hoàn tất. */
  proposedActions?: ProposedAction[]
  /** Công cụ đã gọi (tên + thành công) — để log/đo, không gửi nội dung. */
  toolCalls?: ToolCallRecord[]
}

export type { CompanionAgentToolkit } from './companionTools.js'

/**
 * Câu nối vào cuối câu mẫu khi rơi về dự phòng — để người dùng KHÔNG tưởng đây là AI vừa trả
 * lời (`chatFallback.ts` cũng cố ý không "âm thầm đưa nội dung mẫu ra"). Lượt bị hoàn ở handler.
 */
export const AI_UNAVAILABLE_NOTE =
  '(Trợ lý AI đang tạm gián đoạn nên đây là phản hồi tự động; lượt dùng lần này không bị tính. Bạn thử lại sau ít phút nhé.)'

/**
 * Câu trả lời CỐ ĐỊNH khi lớp an toàn kết luận `imminent` (đang nguy hiểm ngay lúc này). Do
 * người viết, không qua LLM: ở khoảnh khắc này điều cần là số điện thoại đúng và một người thật,
 * không phải một câu văn được sinh ra có thể sai. Thẻ 111/115/Ngày Mai hiện kèm ở giao diện.
 */
export const IMMINENT_SAFETY_REPLY =
  'Mình đang ở đây với bạn. Điều bạn vừa nói rất quan trọng, và bạn xứng đáng được giúp ngay lúc này — bởi một người thật.\n\n' +
  'Nếu bạn đang gặp nguy hiểm, hãy gọi **115** (cấp cứu) hoặc **111** (Tổng đài bảo vệ trẻ em, miễn phí, 24/7) ngay bây giờ. ' +
  'Nếu có người lớn bạn tin được ở gần — bố mẹ, thầy cô, anh chị — hãy nói với họ.\n\n' +
  'Mình là AI nên không thể gọi giúp bạn, nhưng mình vẫn ở đây. Bạn muốn kể cho mình nghe chuyện gì đang xảy ra không?'

/**
 * Từ khoá nhận diện chủ đề trong câu người dùng: trụ Work (Ghi chú), và nhóm chủ đề NGOÀI học
 * tập (sự nghiệp · khởi nghiệp · đời sống) — ba trụ đó đã XOÁ HẲN 2026-09-20, nên nhóm này trả
 * `'general'` (changelog 0624), khớp `normalizeRoutedIntent` của bộ định tuyến LLM. Vẫn giữ từ
 * khoá của chúng vì một lý do: câu "mục tiêu sự nghiệp của tôi" không được rơi vào nhánh
 * "đặt mục tiêu HỌC TẬP".
 *
 * Cố ý dùng bảng từ khoá TẤT ĐỊNH thay vì hỏi LLM: bước này chạy trước cả khi dựng ngữ cảnh,
 * nên nó phải rẻ, nhanh và cho ra cùng một kết quả mỗi lần với cùng một câu (test kiểm được).
 *
 * Thứ tự dòng là thứ tự ưu tiên: câu gọi tên nhiều chủ đề (vd "cân bằng cuộc sống và công việc")
 * lấy dòng đứng trước — Work đứng trước nhóm đời sống, như bảng cũ. `targetDomain` tường minh
 * từ giao diện luôn thắng bảng này.
 */
const DOMAIN_KEYWORDS: ReadonlyArray<
  readonly [domain: 'work' | 'general', keywords: readonly string[]]
> = [
  [
    'general', // sự nghiệp + khởi nghiệp (trụ đã xoá)
    [
      'sự nghiệp',
      'nghề nghiệp',
      'thăng tiến',
      'tuyển dụng',
      'phỏng vấn',
      'cv ',
      'career',
      'khởi nghiệp',
      'startup',
      'venture',
      'gọi vốn',
      'mvp',
      'giả định',
      'khách hàng mục tiêu',
    ],
  ],
  [
    'work',
    ['công việc', 'dự án', 'deadline', 'cuộc họp', 'task', 'kanban', 'năng suất', 'công ty'],
  ],
  [
    'general', // đời sống (trụ đã xoá)
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

export function detectDomainByKeyword(lowerCaseMessage: string): 'work' | 'general' | null {
  for (const [domain, keywords] of DOMAIN_KEYWORDS) {
    if (keywords.some((k) => lowerCaseMessage.includes(k))) return domain
  }
  return null
}

/** Cặp (intent, domain) cho câu nhận ra bằng từ khoá — `'general'` đi với general_conversation. */
function keywordRoute(domain: 'work' | 'general'): { intent: string; domain: string } {
  return domain === 'general'
    ? { intent: 'general_conversation', domain: 'general' }
    : { intent: 'domain_conversation', domain }
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

  // Bảng từ khoá chủ đề. Tính sẵn ở đây nhưng CHỈ dùng ở hai chỗ có kiểm soát bên dưới —
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
      const route = keywordRoute(domainByKeyword)
      return {
        intent: explicitIntent ?? route.intent,
        domain: explicitDomain ?? route.domain,
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
    const route = keywordRoute(domainByKeyword)
    return {
      intent: explicitIntent ?? route.intent,
      domain: explicitDomain ?? route.domain,
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

/** Tuỳ chọn thêm cho `synthesizeCompanionReply` — đều không bắt buộc để nơi gọi cũ không phải đổi. */
export interface SynthesizeOptions {
  /** Nhận từng mẩu chữ khi nhà cung cấp hỗ trợ stream (hiện: Claude). Groq/Gemini không gọi. */
  onDelta?: (delta: string) => void
  ageGroup?: AgeGroup | null
  safety?: SafetyAssessment
  /** Mốc "bây giờ" cho prompt — truyền vào để test tất định. */
  now?: Date
  /** Chế độ tác tử: phiên công cụ của lượt — chỉ nhánh Claude dùng (dự phòng không có công cụ). */
  tools?: CompanionToolSession
  /** Báo nhãn tiếng Việt khi một công cụ bắt đầu chạy (sự kiện SSE `tool`). */
  onToolStart?: (label: string) => void
}

const HISTORY_PROVENANCE = /^companion_message:(user|companion):/

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
  options: SynthesizeOptions = {},
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
      item.sourceType === 'recent_episodic_context' && HISTORY_PROVENANCE.test(item.provenance),
  )
  // Dữ liệu người dùng (hồ sơ, ký ức, ghi chú, tiến độ) → bọc thẻ chống chèn lệnh ở prompt.
  const contextBlocks: ContextBlock[] = contextPackage.items
    .filter((item) => item.sourceType !== 'current_request' && !historyItems.includes(item))
    .map((item) => ({ source: item.sourceType, content: item.content }))

  const actionsSummary =
    proposedActions.length > 0
      ? `Các tác vụ hệ thống liên quan:\n` +
        proposedActions
          .map(
            (a) =>
              `- Tác vụ: ${a.action} (Lĩnh vực: ${a.targetDomain}, Trạng thái: ${a.status}, Mức rủi ro: ${a.riskLevel})`,
          )
          .join('\n')
      : ''

  const promptInput = {
    now: options.now ?? new Date(),
    ageGroup: options.ageGroup ?? null,
    domain,
    contextBlocks,
    actionsSummary,
    ...(options.safety ? { safety: options.safety } : {}),
  }
  const systemPrompt = buildCompanionSystemPrompt(promptInput)

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

  // 1. Nhánh Anthropic Claude (AI chính — nhiệm vụ 'companion' → Sonnet, xem aiConfig.ts).
  // Stream thật: `onDelta` nhận chữ ngay khi model sinh ra. Nếu Claude hỏng GIỮA CHỪNG (đã phát
  // vài mẩu rồi mới rớt) thì các nhánh dự phòng vẫn chạy và trả bản đầy đủ — giao diện thay
  // toàn bộ chữ bằng `reply` cuối ở sự kiện `done`, nên phần dở không gây hại.
  // 1a. Chế độ tác tử (GĐ3): Claude tự gọi công cụ đọc/đề xuất, tối đa 4 bước. Hỏng ⇒ rơi xuống
  // Groq/Gemini KHÔNG công cụ như mọi lượt khác (đề xuất đã tạo vẫn là bản ghi `pending` thật).
  if (anthropicKey && options.tools) {
    const loop = await runAnthropicToolLoop({
      apiKey: anthropicKey,
      route: getAnthropicRoute('companion'),
      system: buildCompanionSystemPrompt({ ...promptInput, tools: true }),
      messages,
      tools: options.tools.definitions,
      executeTool: options.tools.execute,
      onToolStart: (name) => options.onToolStart?.(toolLabel(name)),
      ...(options.onDelta ? { onTextDelta: options.onDelta } : {}),
    })
    // Ghi chi phí MỖI lần gọi trong vòng — kể cả khi kết quả cuối không dùng được.
    for (const call of loop.calls) {
      void recordAiTokenUsage({
        provider: 'anthropic',
        model: call.model,
        mode: 'companion',
        usage: call.usage,
      })
    }
    if (loop.kind === 'success') {
      return {
        text: loop.text,
        isFallback: false,
        streamed: Boolean(options.onDelta),
        toolCalls: loop.toolCalls,
      }
    }
    console.warn(`[companion] Anthropic (công cụ) ${describeAnthropicFailure(loop)}`)
  } else if (anthropicKey) {
    const anthropicRes = await callAnthropicText({
      apiKey: anthropicKey,
      route: getAnthropicRoute('companion'),
      system: systemPrompt,
      messages,
      ...(options.onDelta ? { onTextDelta: options.onDelta } : {}),
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
    if (anthropicRes.kind === 'success') {
      return { text: anthropicRes.text, isFallback: false, streamed: Boolean(options.onDelta) }
    }
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

// ─── Chặng 1: chuẩn bị lượt ─────────────────────────────────────────────────────────────────

/** Mọi thứ đã có TRƯỚC khi gọi AI sinh câu trả lời. */
export interface PreparedCompanionTurn {
  personId: string
  /** `user_id` tài khoản (read model học tập, kho thẻ ôn đọc theo user, không theo person). */
  userId: string
  userMessage: string
  ephemeral: boolean
  intent: string
  domain: string
  ageGroup: AgeGroup | null
  contextPackage: ContextPackage
  plannedSteps: PlannedStep[]
  proposedActions: ProposedAction[]
  executionSummary: CompanionExecutionSummary
  safety: SafetyAssessment
  /** Chế độ tác tử đang BẬT cho lượt này (có toolkit + có key Anthropic). */
  agent?: { pool: Pool; toolkit: CompanionAgentToolkit; memoryConsent: boolean }
}

/**
 * Đọc `user_id` + nhóm tuổi của person. Hỏng/không có → `personId` thay user_id (giữ hành vi cũ)
 * và không có nhóm tuổi (prompt bỏ khối theo tuổi, lớp an toàn vẫn chạy bình thường).
 */
async function readPersonProfile(
  pool: Pool,
  personId: string,
): Promise<{ userId: string; ageGroup: AgeGroup | null }> {
  try {
    const res = await pool.query<{ user_id: string; age_group: string | null }>(
      `select p.user_id, pr.age_group
         from personal.persons p
         left join public.profiles pr on pr.id = p.user_id
        where p.id = $1`,
      [personId],
    )
    const row = res.rows[0]
    const parsed = AgeGroupSchema.safeParse(row?.age_group)
    return { userId: row?.user_id ?? personId, ageGroup: parsed.success ? parsed.data : null }
  } catch {
    return { userId: personId, ageGroup: null }
  }
}

/** Consent "Nhớ về tôi" — quyết có khai công cụ `propose_memory` không. Lỗi ⇒ coi như chưa cấp. */
async function hasMemoryConsent(pool: Pool, personId: string): Promise<boolean> {
  try {
    return await isConsentActive(
      pool,
      personId,
      COMPANION_CONSENT_SCOPES.memory,
      COMPANION_CONSENT_PURPOSE,
    )
  } catch {
    return false
  }
}

export async function prepareCompanionTurn(
  pool: Pool,
  request: CompanionRequest,
  agent?: CompanionAgentToolkit,
): Promise<PreparedCompanionTurn> {
  const validated = CompanionRequestSchema.parse(request)
  const {
    personId,
    userMessage,
    intent: explicitIntent,
    targetDomain: explicitDomain,
    tokenBudget,
    maxSensitivity,
    ephemeral,
  } = validated

  // Chế độ tác tử chỉ thật sự bật khi có Claude — Groq/Gemini không có vòng công cụ.
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const agentActive = Boolean(agent && anthropicKey)

  // Step 1: Intent & Domain Resolution — bảng từ khoá luôn tính (rẻ, tất định); chế độ tác tử hỏi
  // thêm Haiku khi client KHÔNG chỉ định miền/ý định. Chạy SONG SONG với đọc hồ sơ.
  const keyword = resolveIntentAndDomain(userMessage, explicitIntent, explicitDomain)
  const useRouter = agentActive && !explicitDomain && !explicitIntent
  // Step 1b: hồ sơ nền tảng (user_id cho read model, nhóm tuổi cho prompt).
  const [routed, { userId, ageGroup }, memoryConsent] = await Promise.all([
    useRouter
      ? routeIntent({
          ...(anthropicKey ? { apiKey: anthropicKey } : {}),
          message: userMessage,
          keywordFallback: keyword,
        })
      : Promise.resolve(keyword),
    readPersonProfile(pool, personId),
    agentActive && !ephemeral ? hasMemoryConsent(pool, personId) : Promise.resolve(false),
  ])
  const { intent, domain } = routed

  // Step 2: Context Resolution (Context Engine with Domain Read Model)
  let domainState: ContextBuildOptions['domainState'] = undefined
  if (domain === 'learning') {
    try {
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
    // Trụ Ghi chú (`work`) — cùng khuôn "read model nạp vào ngữ cảnh" như Learning. Hỏng thì đi
    // tiếp với ngữ cảnh rỗng: thiếu một khối tóm tắt vẫn hơn là không trả lời được. Việc khối
    // này có THỰC SỰ được nạp hay không do cổng `isConsentActive(personId, domain, purpose)`
    // trong contextEngine quyết định — ở đây KHÔNG lách cổng đó.
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
    purpose: COMPANION_CONSENT_PURPOSE,
    includeCompanionHistory: !ephemeral,
    includePersonalContext: !ephemeral,
    maxSensitivity,
    tokenBudget: tokenBudget ?? COMPANION_DEFAULT_TOKEN_BUDGET,
    ...(domainState ? { domainState } : {}),
  }
  const contextPackage = await buildContextPackage(pool, contextOptions)

  // Step 2b: LỚP AN TOÀN — chạy sau khi có ngữ cảnh để bộ phân loại thấy vài lượt người dùng gần
  // đây (đã qua cổng consent y như mọi dữ liệu khác). Chi tiết: safetyGuard.ts.
  const recentUserTurns = contextPackage.items
    .filter((item) => item.provenance.startsWith('companion_message:user:'))
    .map((item) => item.content)
  const safety = await assessSafety({
    message: userMessage,
    recentUserTurns,
    ...(process.env.ANTHROPIC_API_KEY ? { anthropicApiKey: process.env.ANTHROPIC_API_KEY } : {}),
  })

  // Step 3: Companion Planner. Đang ở lượt khủng hoảng thì KHÔNG đề xuất tác vụ nào: không
  // "lưu ký ức" chính lời tâm sự, không tra từ, không cập nhật hồ sơ — chỉ con người và số hỗ trợ.
  // Phiên tạm: không có bước "lưu ký ức" (người dùng đã nói rõ "đừng nhớ"), các bước khác giữ.
  // Chế độ tác tử: KHÔNG chạy planner từ khoá — model tự đề xuất qua công cụ (có cấu trúc, thay
  // vì lưu nguyên câu người dùng).
  const plannedSteps = (
    safety.level === 'none' && !agentActive ? generatePlan(intent, domain, userMessage) : []
  ).filter((step) => !(ephemeral && step.capabilityId === 'memory.create_record'))

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

  return {
    personId,
    userId,
    userMessage,
    ephemeral,
    intent,
    domain,
    ageGroup,
    contextPackage,
    plannedSteps,
    proposedActions,
    executionSummary: {
      plannedSteps: plannedSteps.length,
      executedSteps: executedCount,
      pendingConfirmationSteps: pendingCount,
      rejectedSteps: rejectedCount,
    },
    safety,
    ...(agentActive && agent ? { agent: { pool, toolkit: agent, memoryConsent } } : {}),
  }
}

// ─── Chặng 2: sinh câu trả lời ──────────────────────────────────────────────────────────────

/** Gọi AI cho lượt đã chuẩn bị; mức `imminent` trả câu cố định, không gọi AI. */
export async function synthesizePreparedReply(
  prepared: PreparedCompanionTurn,
  options: Pick<SynthesizeOptions, 'onDelta' | 'now' | 'onToolStart'> = {},
): Promise<CompanionReplyResult> {
  if (prepared.safety.level === 'imminent') {
    return { text: IMMINENT_SAFETY_REPLY, isFallback: false }
  }
  // Lượt có dấu hiệu khủng hoảng: KHÔNG công cụ — không tra, không đề xuất (luật GĐ1).
  const tools =
    prepared.agent && prepared.safety.level === 'none'
      ? createCompanionToolSession({
          pool: prepared.agent.pool,
          personId: prepared.personId,
          userId: prepared.userId,
          ephemeral: prepared.ephemeral,
          memoryConsent: prepared.agent.memoryConsent,
          toolkit: prepared.agent.toolkit,
        })
      : undefined
  const result = await synthesizeCompanionReply(
    prepared.userMessage,
    prepared.intent,
    prepared.domain,
    prepared.proposedActions,
    prepared.contextPackage,
    {
      ...options,
      ageGroup: prepared.ageGroup,
      ...(prepared.safety.level !== 'none' ? { safety: prepared.safety } : {}),
      ...(tools ? { tools } : {}),
    },
  )
  // Đề xuất do công cụ tạo là bản ghi THẬT — trả về cả khi Claude hỏng giữa vòng và lời văn
  // đến từ nhà cung cấp dự phòng.
  return tools && tools.proposals.length > 0
    ? { ...result, proposedActions: [...tools.proposals] }
    : result
}

// ─── Chặng 3: hoàn tất ──────────────────────────────────────────────────────────────────────

export async function finalizeCompanionTurn(
  pool: Pool,
  prepared: PreparedCompanionTurn,
  replyResult: CompanionReplyResult,
): Promise<CompanionResponse> {
  const { personId, userMessage, ephemeral, intent, domain, contextPackage, safety } = prepared

  // Đề xuất của planner (chế độ cũ) + đề xuất công cụ tạo (chế độ tác tử), không lặp id.
  const proposedActions = [...prepared.proposedActions]
  for (const action of replyResult.proposedActions ?? []) {
    if (!proposedActions.some((a) => a.id === action.id)) proposedActions.push(action)
  }
  const fromTools = proposedActions.slice(prepared.proposedActions.length)
  const executionSummary: CompanionExecutionSummary = {
    plannedSteps: prepared.executionSummary.plannedSteps + fromTools.length,
    executedSteps:
      prepared.executionSummary.executedSteps +
      fromTools.filter((a) => a.status === 'committed').length,
    pendingConfirmationSteps:
      prepared.executionSummary.pendingConfirmationSteps +
      fromTools.filter((a) => a.status === 'pending').length,
    rejectedSteps:
      prepared.executionSummary.rejectedSteps +
      fromTools.filter((a) => a.status === 'rejected').length,
  }

  // Tách khối câu hỏi tick chọn (nếu có) ra khỏi lời văn — khối JSON không bao giờ được lọt
  // xuống giao diện dưới dạng chữ thô.
  const { text: extracted, questions: interactiveQuestions } = extractInteractiveQuestions(
    replyResult.text,
  )
  // Kiểm câu trả lời CUỐI (GĐ3) — bản đã kiểm là bản được lưu và bản giao diện giữ lại (sự kiện
  // `done` thay toàn bộ chữ đã stream). Chỉ log tên lỗi, không log nội dung.
  const checked = runFinalAnswerChecks({ reply: extracted, userMessage, proposedActions })
  if (checked.issues.length > 0) {
    console.warn(`[companion] final_check: ${checked.issues.join(',')}`)
  }
  const reply = checked.text

  // Lưu cả hai vế của lượt thoại để lần sau mở lại vẫn còn. Ghi lỗi thì KHÔNG làm hỏng câu trả
  // lời đang trả về cho người dùng — họ vẫn đọc được, chỉ là lượt này không vào lịch sử.
  // Lượt `imminent` KHÔNG lưu: lời tâm sự lúc nguy cấp không thành dữ liệu nằm lại trong CSDL
  // (và không được nạp lại vào ngữ cảnh lượt sau). Lượt `concern` lưu với độ nhạy ≥ sensitive.
  const sensitivityLevels: Sensitivity[] = ['public', 'personal', 'sensitive', 'restricted']
  const transcriptSensitivity =
    sensitivityLevels[
      Math.max(
        safety.level === 'none' ? 1 : 2,
        ...contextPackage.items.map((item) => sensitivityLevels.indexOf(item.sensitivity)),
      )
    ] ?? 'sensitive'
  // Phiên tạm cũng KHÔNG lưu — đó là lời hứa của chế độ này.
  if (safety.level !== 'imminent' && !ephemeral) {
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
  }

  return {
    reply,
    interactiveQuestions,
    isFallback: replyResult.isFallback,
    intent,
    targetDomain: domain,
    contextPackage,
    proposedActions,
    executionSummary,
    ...(safety.level !== 'none'
      ? { safety: buildSafetyNotice(safety.level, safety.category) }
      : {}),
  }
}

/**
 * Main Companion Runtime Execution Entrypoint.
 * Connects Intent/Domain Resolution -> Context Builder -> Planner -> Policy Gate -> ProposedActions -> Response.
 */
export async function executeCompanionTurn(
  pool: Pool,
  request: CompanionRequest,
  agent?: CompanionAgentToolkit,
): Promise<CompanionResponse> {
  const prepared = await prepareCompanionTurn(pool, request, agent)
  const replyResult = await synthesizePreparedReply(prepared)
  return finalizeCompanionTurn(pool, prepared, replyResult)
}

export type CompanionStreamEvent =
  | { type: 'meta'; data: { intent: string; targetDomain: string; contextPackage: ContextPackage } }
  | { type: 'safety'; data: { safety: CompanionSafetyNotice } }
  /** Chế độ tác tử: một công cụ vừa bắt đầu chạy — nhãn tiếng Việt cho dòng "đang tra cứu". */
  | { type: 'tool'; data: { label: string } }
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
 * Hàng đợi nối "callback đẩy từng mẩu" với "generator kéo từng mẩu": producer `push`, consumer
 * `await next()`; `close()` báo hết. Nhỏ gọn có chủ đích — đủ cho một stream văn bản.
 */
class AsyncQueue<T> {
  private items: T[] = []
  private waiters: Array<() => void> = []
  private closed = false

  push(item: T): void {
    this.items.push(item)
    this.wake()
  }

  close(): void {
    this.closed = true
    this.wake()
  }

  private wake(): void {
    const waiters = this.waiters.splice(0)
    for (const resolve of waiters) resolve()
  }

  /** `undefined` = đã đóng và rỗng. */
  async next(): Promise<T | undefined> {
    while (this.items.length === 0) {
      if (this.closed) return undefined
      await new Promise<void>((resolve) => this.waiters.push(resolve))
    }
    return this.items.shift()
  }
}

const QUESTION_FENCE_OPEN = '```' + INTERACTIVE_QUESTION_FENCE

/**
 * Giữ lại khối ```dhcb-questions``` khi stream: người dùng KHÔNG được thấy JSON thô chạy qua
 * màn hình rồi biến mất. Mọi dấu ``` khác (code block thường) vẫn đi qua bình thường.
 *
 * Cách làm: gặp ``` thì giữ lại cho tới khi biết chắc nó có phải mở khối câu hỏi không; là khối
 * câu hỏi → nuốt tất cả từ đó về sau (khối luôn đứng cuối câu trả lời theo prompt); không phải →
 * nhả ra và quét tiếp.
 */
export class QuestionFenceGuard {
  private pending = ''
  private swallowing = false

  constructor(private readonly emit: (delta: string) => void) {}

  push(delta: string): void {
    if (this.swallowing) return
    this.pending += delta
    this.drain(false)
  }

  /** Hết stream: phần đang giữ mà chưa thành khối câu hỏi thì nhả nốt. */
  end(): void {
    if (this.swallowing) return
    this.drain(true)
  }

  private drain(final: boolean): void {
    for (;;) {
      const idx = this.pending.indexOf('```')
      if (idx === -1) {
        // Một–hai dấu ` ở cuối có thể là đầu của ``` đang đến theo mẩu sau → giữ lại (trừ khi hết).
        const trailing = final ? 0 : (/`{1,2}$/.exec(this.pending)?.[0].length ?? 0)
        const emitUpTo = this.pending.length - trailing
        if (emitUpTo > 0) this.emit(this.pending.slice(0, emitUpTo))
        this.pending = this.pending.slice(emitUpTo)
        return
      }
      if (idx > 0) {
        this.emit(this.pending.slice(0, idx))
        this.pending = this.pending.slice(idx)
      }
      if (this.pending.startsWith(QUESTION_FENCE_OPEN)) {
        this.swallowing = true
        this.pending = ''
        return
      }
      if (QUESTION_FENCE_OPEN.startsWith(this.pending)) {
        // Mới thấy một phần đầu ("```dh…") — chờ thêm, trừ khi stream đã hết.
        if (final) {
          this.emit(this.pending)
          this.pending = ''
        }
        return
      }
      // Dấu ``` của code block thường → nhả ra, quét tiếp phần sau.
      this.emit('```')
      this.pending = this.pending.slice(3)
    }
  }
}

/**
 * Async generator for Streaming Companion responses over Server-Sent Events (SSE).
 * Yields meta -> (safety) -> text chunks (xen nhãn `tool` ở chế độ tác tử) -> proposed actions -> (questions) -> done.
 *
 * Chữ phát ra là STREAM THẬT từ Claude (`onDelta`); nhà cung cấp dự phòng (Groq/Gemini) và câu
 * cố định không stream được thì phát theo từng từ sau khi có bản đầy đủ (hành vi cũ).
 */
export async function* streamCompanionTurn(
  pool: Pool,
  request: CompanionRequest,
  agent?: CompanionAgentToolkit,
): AsyncGenerator<CompanionStreamEvent, CompanionResponse, unknown> {
  const prepared = await prepareCompanionTurn(pool, request, agent)

  // 1. Emit metadata event
  yield {
    type: 'meta',
    data: {
      intent: prepared.intent,
      targetDomain: prepared.domain,
      contextPackage: prepared.contextPackage,
    },
  }

  // 1b. Thẻ hỗ trợ đi TRƯỚC chữ: giao diện hiện số điện thoại ngay cả khi AI chậm/hỏng.
  if (prepared.safety.level !== 'none') {
    yield {
      type: 'safety',
      data: { safety: buildSafetyNotice(prepared.safety.level, prepared.safety.category) },
    }
  }

  // 2. Chữ: producer (AI) đẩy vào hàng đợi qua bộ giữ khối câu hỏi; generator kéo ra và yield.
  // Nhãn công cụ (chế độ tác tử) đi CÙNG hàng đợi để giữ đúng thứ tự với chữ.
  const queue = new AsyncQueue<{ kind: 'delta' | 'tool'; text: string }>()
  const guard = new QuestionFenceGuard((delta) => queue.push({ kind: 'delta', text: delta }))
  const replyPromise = synthesizePreparedReply(prepared, {
    onDelta: (delta) => guard.push(delta),
    onToolStart: (label) => queue.push({ kind: 'tool', text: label }),
  }).then(
    (result) => {
      guard.end()
      queue.close()
      return result
    },
    (err: unknown) => {
      queue.close()
      throw err
    },
  )
  // Lỗi được ném lại ở `await replyPromise` bên dưới; dòng này chỉ tránh "unhandled rejection"
  // trong khoảng generator còn đang kéo hàng đợi.
  replyPromise.catch(() => {})

  for (;;) {
    const item = await queue.next()
    if (item === undefined) break
    yield item.kind === 'tool'
      ? { type: 'tool', data: { label: item.text } }
      : { type: 'chunk', data: { delta: item.text } }
  }

  const replyResult = await replyPromise
  const response = await finalizeCompanionTurn(pool, prepared, replyResult)

  // Không stream được trọn (dự phòng / câu cố định / Claude rớt giữa chừng) → phát theo từng
  // từ từ bản đầy đủ. Mẩu dở đã phát (nếu có) không rút lại được; giao diện thay toàn bộ chữ
  // bằng `reply` ở sự kiện `done`.
  if (!replyResult.streamed) {
    const words = response.reply.split(' ')
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i]
      yield { type: 'chunk', data: { delta: chunk } }
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

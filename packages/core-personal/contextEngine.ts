// packages/core-personal/contextEngine.ts — V2-07 Context Engine (Context Builder).
// Security boundary & Context Selection Pipeline theo 02-SYSTEM-ARCHITECTURE.md mục 14.
import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import { z } from 'zod'
import {
  ContextPackageSchema,
  CONTEXT_PACKAGE_SCHEMA_VERSION,
  type ContextPackage,
  ContextItemSourceSchema,
} from '@dhcb/core-contracts/contextPackage'
import type { Sensitivity, PersonalFact } from '@dhcb/core-contracts/personalFact'
import { isConsentActive } from './consentService.js'
import { resolveAuthority } from './policyService.js'
import { listNodes } from './lifeGraphService.js'
import { listFacts } from './personService.js'
import { searchMemories } from './memoryRetrieval.js'
import { COMPANION_CONSENT_SCOPES } from '@dhcb/core-contracts/consentGrant'
import { listRecentCompanionMessages, COMPANION_HISTORY_TURNS } from './companionMessageService.js'
import { listCoreBlocks, getConversationSummary } from './coreMemoryBlocks.js'

/** Nhãn hiển thị của khối cố định trong ngữ cảnh gửi AI. */
const CORE_BLOCK_TITLE: Record<string, string> = {
  about_me: 'Về tôi (người dùng tự viết)',
  current_focus: 'Đang tập trung (người dùng tự viết)',
}

type ContextItemSource = z.infer<typeof ContextItemSourceSchema>

export interface ContextBuildOptions {
  personId: string
  requestId: string
  requestText: string
  domain?: string
  purpose: string
  tokenBudget?: number
  maxSensitivity?: Sensitivity
  /** Chỉ lịch sử đúng miền, đã qua consent/policy và dùng chung ngân sách ngữ cảnh. */
  includeCompanionHistory?: boolean
  /**
   * `false` = PHIÊN TẠM (GĐ2a): không đọc ký ức, hồ sơ, đồ thị mục tiêu, lịch sử — dù consent đang
   * bật. Tóm tắt môn học (`domainState`, dữ liệu app người dùng vẫn thấy ở bảng điều khiển) vẫn
   * được nạp. Mặc định `true`.
   */
  includePersonalContext?: boolean
  domainState?: {
    sourceId: string
    content: string
    provenance: string
  }
}

interface RawContextCandidate {
  sourceType: ContextItemSource
  sourceId: string
  content: string
  provenance: string
  sensitivity: Sensitivity
  tokenEstimate: number
}

const SENSITIVITY_RANK: Record<Sensitivity, number> = {
  public: 0,
  personal: 1,
  sensitive: 2,
  restricted: 3,
}

/** Số ký ức tối đa đưa vào một lượt (trước khi gói ngân sách). */
export const MEMORY_RETRIEVAL_LIMIT = 10

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3.5))
}

const HISTORY_PROVENANCE = /^companion_message:(user|companion):/

/**
 * Lịch sử Companion được GÓI theo thứ tự mới → cũ (để giữ lượt mới nhất khi hết ngân sách)
 * nhưng phải TRẢ cho LLM theo thứ tự cũ → mới (nhà cung cấp nào cũng đọc `messages` theo thời
 * gian). Lịch sử luôn là nhóm cuối cùng của gói, nên chỉ cần đảo lại đúng nhóm đó; các mục khác
 * giữ nguyên vị trí.
 */
function restoreHistoryOrder<T extends { provenance: string }>(items: T[]): T[] {
  const rest = items.filter((item) => !HISTORY_PROVENANCE.test(item.provenance))
  const history = items.filter((item) => HISTORY_PROVENANCE.test(item.provenance)).reverse()
  return [...rest, ...history]
}

/**
 * Builds a deterministic ContextPackage obeying:
 * 1. Selection Order:
 *    1. current_request
 *    2. active_goal_or_project
 *    3. authoritative_domain_state
 *    4. user_declared_fact
 *    5. validated_derived_memory
 *    6. recent_episodic_context
 * 2. Deterministic Filtering:
 *    - Consent gating (scope/purpose)
 *    - Policy gating (DENY check)
 *    - Sensitivity threshold (omits items exceeding maxSensitivity)
 *    - Token budget constraint (stops adding when budget exhausted)
 */
export async function buildContextPackage(
  pool: Pool,
  options: ContextBuildOptions,
): Promise<ContextPackage> {
  const {
    personId,
    requestId,
    requestText,
    domain = 'learning',
    purpose,
    tokenBudget = 2000,
    maxSensitivity = 'sensitive',
    domainState,
    includePersonalContext = true,
  } = options

  const maxRank = SENSITIVITY_RANK[maxSensitivity] ?? SENSITIVITY_RANK.sensitive
  const candidates: RawContextCandidate[] = []

  // 1. Current request
  const reqContent = requestText.trim()
  if (reqContent) {
    candidates.push({
      sourceType: 'current_request',
      sourceId: randomUUID(),
      content: reqContent,
      provenance: 'user_input:current_turn',
      sensitivity: 'personal',
      tokenEstimate: estimateTokens(reqContent),
    })
  }

  // Cổng consent — HAI scope chuẩn (`COMPANION_CONSENT_SCOPES`, có dấu chấm, cấp được qua
  // /api/companion-memory). Trước 2026-10-11 ở đây kiểm `life_graph` / `personal_facts` /
  // `personal_memory` / `<domain>` — không scope nào cấp được qua API nên mọi cổng luôn đóng.
  const hasMemoryConsent =
    includePersonalContext &&
    (await isConsentActive(pool, personId, COMPANION_CONSENT_SCOPES.memory, purpose))
  const hasHistoryConsent =
    includePersonalContext &&
    Boolean(options.includeCompanionHistory) &&
    (await isConsentActive(pool, personId, COMPANION_CONSENT_SCOPES.history, purpose))

  // 1b. Khối ghi nhớ cố định (GĐ2b, Letta core memory) — người dùng TỰ VIẾT nên đứng ngay sau câu
  // đang hỏi: điều cốt lõi không bao giờ rụng vì hết ngân sách hay vì câu hỏi không khớp chữ.
  // Đọc lỗi ⇒ bỏ nhóm này, lượt thoại vẫn tiếp tục.
  if (hasMemoryConsent) {
    try {
      for (const block of await listCoreBlocks(pool, personId)) {
        if (!block.id || !block.content.trim()) continue
        const content = `[${CORE_BLOCK_TITLE[block.label] ?? block.label}] ${block.content}`
        candidates.push({
          sourceType: 'user_declared_fact',
          sourceId: block.id,
          content,
          provenance: `core_block:${block.label}`,
          sensitivity: 'personal',
          tokenEstimate: estimateTokens(content),
        })
      }
    } catch {
      // bỏ qua: khối cố định là tiện ích, không phải điều kiện để trả lời
    }
  }

  // 2. Active goals or projects from Life Graph (công tắc "ký ức")
  if (hasMemoryConsent) {
    const nodeWrappers = await listNodes(pool, personId)
    const activeGoalsAndProjects = nodeWrappers
      .map((w) => w.value)
      .filter((n) => (n.type === 'Goal' || n.type === 'Project') && !n.archivedAt)
    for (const node of activeGoalsAndProjects) {
      const content = `[${node.type}] ${node.label}`
      candidates.push({
        sourceType: 'active_goal_or_project',
        sourceId: node.id,
        content,
        provenance: 'life_graph:node',
        sensitivity: 'personal',
        tokenEstimate: estimateTokens(content),
      })
    }
  }

  // 3. Authoritative domain state — tóm tắt tiến độ môn học do app tổng hợp từ dữ liệu người
  // dùng tự tạo khi học; KHÔNG qua công tắc ký ức (phiên tạm vẫn nạp) nhưng vẫn qua policy +
  // ngân sách như mọi mục khác.
  if (domainState) {
    candidates.push({
      sourceType: 'authoritative_domain_state',
      sourceId: domainState.sourceId,
      content: domainState.content,
      provenance: domainState.provenance,
      sensitivity: 'personal',
      tokenEstimate: estimateTokens(domainState.content),
    })
  }

  // 4. Relevant user-declared facts (công tắc "ký ức")
  if (hasMemoryConsent) {
    const facts: PersonalFact[] = await listFacts(pool, personId)
    const userDeclaredFacts = facts.filter((f) => f.origin === 'user_declared')
    for (const fact of userDeclaredFacts) {
      const content = `${fact.key}: ${JSON.stringify(fact.value)}`
      candidates.push({
        sourceType: 'user_declared_fact',
        sourceId: fact.id,
        content,
        provenance: `personal_facts:${fact.origin}`,
        sensitivity: fact.sensitivity,
        tokenEstimate: estimateTokens(content),
      })
    }
  }

  // 5 + 6. Ký ức đã lưu (mọi namespace) — truy xuất LAI theo câu đang hỏi (GĐ2a): chữ + nghĩa +
  // điểm 3 thành phần, thay cho "10 bản mới nhất" trước đây. Thứ tự đã là thứ tự điểm giảm dần,
  // nên khi hết ngân sách thì ký ức ít liên quan nhất rụng trước. Lỗi truy xuất ⇒ bỏ qua nhóm
  // này, lượt thoại vẫn tiếp tục (ký ức là tiện ích, không phải điều kiện để trả lời).
  if (hasMemoryConsent) {
    try {
      const scored = await searchMemories(pool, personId, {
        query: reqContent,
        limit: MEMORY_RETRIEVAL_LIMIT,
        maxSensitivity,
      })
      for (const { record: memory } of scored) {
        const content = `[${memory.namespace}] ${memory.content}`
        candidates.push({
          sourceType:
            memory.namespace === 'episodic'
              ? 'recent_episodic_context'
              : 'validated_derived_memory',
          sourceId: memory.id,
          content,
          // Provenance của bản ghi do người dùng nhập không được giả mạo nguồn transcript.
          provenance: `personal_memory:${memory.provenance}`.slice(0, 200),
          sensitivity: memory.sensitivity,
          tokenEstimate: estimateTokens(content),
        })
      }
    } catch {
      // bỏ qua: không đọc được ký ức thì trả lời bằng phần ngữ cảnh còn lại
    }
  }

  // Lịch sử cũng là dữ liệu cá nhân: công tắc "lịch sử" riêng. Không nhận lịch sử thô từ
  // runtime để tránh đường vòng vượt Context Engine.
  if (hasHistoryConsent) {
    try {
      const history = await listRecentCompanionMessages(
        pool,
        personId,
        COMPANION_HISTORY_TURNS,
        domain,
        maxSensitivity,
      )
      // Xét theo thứ tự MỚI → CŨ: vòng gói ngân sách bên dưới dừng ở mục đầu tiên không vừa,
      // nên thứ tự đẩy vào `candidates` quyết định lượt nào bị bỏ khi hết chỗ. Trước 2026-10-11
      // lịch sử đẩy cũ → mới, nên hết ngân sách là mất chính những lượt VỪA nói — Companion
      // "quên" câu người dùng vừa hỏi trong khi vẫn nhớ chuyện 10 lượt trước. Thứ tự thời gian
      // cho LLM được trả lại ở bước sắp xếp cuối (`restoreHistoryOrder`).
      for (const message of [...history].reverse()) {
        // Loại cả dữ liệu cũ thiếu miền; không coi "all" là quyền đọc mọi miền.
        if (message.domain !== domain) continue
        const content = message.content.slice(0, 1500)
        candidates.push({
          sourceType: 'recent_episodic_context',
          sourceId: message.id,
          content,
          provenance: `companion_message:${message.role}:${domain}`,
          // Transcript kế thừa độ nhạy của mọi nguồn context dùng tạo ra câu trả lời.
          sensitivity: message.sensitivity ?? 'sensitive',
          tokenEstimate: estimateTokens(content),
        })
      }
    } catch {
      // Không đọc được lịch sử thì bỏ qua; tuyệt đối không fallback sang truy vấn bỏ scope.
    }

    // Tóm tắt cuộn của đúng miền (GĐ2b) — đứng SAU lịch sử gần nhất trong thứ tự gói ngân sách:
    // hết chỗ thì bản tóm tắt rụng trước, lượt vừa nói luôn được giữ. Không khớp HISTORY_PROVENANCE
    // nên đi vào khối dữ liệu bọc thẻ của prompt, không bị coi là một tin nhắn.
    try {
      const summary = await getConversationSummary(pool, personId, domain)
      if (summary) {
        const content = `[Tóm tắt các buổi trò chuyện trước] ${summary.summary}`
        candidates.push({
          sourceType: 'recent_episodic_context',
          sourceId: summary.id,
          content,
          provenance: `companion_summary:${domain}`.slice(0, 200),
          sensitivity: 'personal',
          tokenEstimate: estimateTokens(content),
        })
      }
    } catch {
      // bỏ qua: không đọc được tóm tắt thì trả lời bằng phần ngữ cảnh còn lại
    }
  }

  // Filter and pack items according to policy, sensitivity threshold, and token budget
  const selectedItems: Array<{
    sourceType: ContextItemSource
    sourceId: string
    content: string
    provenance: string
    sensitivity: Sensitivity
    tokenEstimate: number
  }> = []

  let tokenUsed = 0

  for (const item of candidates) {
    // 1. Sensitivity filtering
    const itemRank = SENSITIVITY_RANK[item.sensitivity] ?? 1
    if (itemRank > maxRank) {
      continue // Omit sensitive context exceeding threshold
    }

    // 2. Personal Policy check: ensure authority is not DENY
    const authority = await resolveAuthority(
      pool,
      personId,
      item.sourceType,
      'inject_context',
      domain,
    )
    if (authority === 'DENY') {
      continue // Denied by personal policy
    }

    // 3. Token budget check
    if (tokenUsed + item.tokenEstimate > tokenBudget) {
      // If current request doesn't fit, truncate content if possible
      if (item.sourceType === 'current_request' && selectedItems.length === 0) {
        const truncatedChars = Math.floor((tokenBudget - 5) * 3.5)
        const truncatedContent = item.content.slice(0, Math.max(1, truncatedChars))
        const truncatedTokens = estimateTokens(truncatedContent)
        selectedItems.push({
          ...item,
          content: truncatedContent,
          tokenEstimate: truncatedTokens,
        })
        tokenUsed += truncatedTokens
      }
      break // Stop adding further items when budget exhausted
    }

    selectedItems.push(item)
    tokenUsed += item.tokenEstimate
  }

  return ContextPackageSchema.parse({
    id: randomUUID(),
    personId,
    requestId,
    items: restoreHistoryOrder(selectedItems),
    tokenBudget,
    tokenUsed,
    createdAt: new Date().toISOString(),
    schemaVersion: CONTEXT_PACKAGE_SCHEMA_VERSION,
  })
}

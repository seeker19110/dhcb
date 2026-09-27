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
import { listMemoryRecords } from './memoryService.js'
import { listRecentCompanionMessages, COMPANION_HISTORY_TURNS } from './companionMessageService.js'

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

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3.5))
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

  // 2. Active goals or projects from Life Graph
  const hasLifeGraphConsent = await isConsentActive(pool, personId, 'life_graph', purpose)
  if (hasLifeGraphConsent) {
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

  // 3. Authoritative domain state
  if (domainState) {
    const hasDomainConsent = await isConsentActive(pool, personId, domain, purpose)
    if (hasDomainConsent) {
      candidates.push({
        sourceType: 'authoritative_domain_state',
        sourceId: domainState.sourceId,
        content: domainState.content,
        provenance: domainState.provenance,
        sensitivity: 'personal',
        tokenEstimate: estimateTokens(domainState.content),
      })
    }
  }

  // 4. Relevant user-declared facts
  const hasFactsConsent = await isConsentActive(pool, personId, 'personal_facts', purpose)
  if (hasFactsConsent) {
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

  // 5. Validated derived memory (semantic / preference / domain)
  const hasMemoryConsent = await isConsentActive(pool, personId, 'personal_memory', purpose)
  if (hasMemoryConsent) {
    const semanticMemories = await listMemoryRecords(pool, personId, {
      namespace: 'semantic',
      limit: 10,
    })
    const preferenceMemories = await listMemoryRecords(pool, personId, {
      namespace: 'preference',
      limit: 10,
    })
    const derivedMemories = [...semanticMemories, ...preferenceMemories]

    for (const memory of derivedMemories) {
      candidates.push({
        sourceType: 'validated_derived_memory',
        sourceId: memory.id,
        content: `[${memory.namespace}] ${memory.content}`,
        // Provenance của bản ghi do người dùng nhập không được giả mạo nguồn transcript.
        provenance: `personal_memory:${memory.provenance}`.slice(0, 200),
        sensitivity: memory.sensitivity,
        tokenEstimate: estimateTokens(`[${memory.namespace}] ${memory.content}`),
      })
    }

    // 6. Recent episodic context
    const episodicMemories = await listMemoryRecords(pool, personId, {
      namespace: 'episodic',
      limit: 5,
    })
    for (const memory of episodicMemories) {
      candidates.push({
        sourceType: 'recent_episodic_context',
        sourceId: memory.id,
        content: `[episodic] ${memory.content}`,
        provenance: `personal_memory:${memory.provenance}`.slice(0, 200),
        sensitivity: memory.sensitivity,
        tokenEstimate: estimateTokens(`[episodic] ${memory.content}`),
      })
    }
  }

  // Lịch sử cũng là dữ liệu cá nhân: chỉ đọc khi consent cho bộ nhớ VÀ miền còn hiệu lực.
  // Không nhận lịch sử thô từ runtime để tránh đường vòng vượt Context Engine.
  if (
    options.includeCompanionHistory &&
    hasMemoryConsent &&
    (await isConsentActive(pool, personId, domain, purpose))
  ) {
    try {
      const history = await listRecentCompanionMessages(
        pool,
        personId,
        COMPANION_HISTORY_TURNS,
        domain,
        maxSensitivity,
      )
      for (const message of history) {
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
    items: selectedItems,
    tokenBudget,
    tokenUsed,
    createdAt: new Date().toISOString(),
    schemaVersion: CONTEXT_PACKAGE_SCHEMA_VERSION,
  })
}

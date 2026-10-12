// packages/core-personal/memoryReflectionService.ts — "Phản tỉnh sau buổi trò chuyện" của Bạn Đồng
// Hành (GĐ2b, đặc tả `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md` ③).
//
// Chạy NỀN (bộ hẹn giờ ở `apps/server/src/server.ts`, chỉ instance 0), không bao giờ trên đường
// nóng của một lượt trò chuyện. Mỗi lượt quét:
//   1. Chọn người có tin nhắn mới mà tin cuối đã im ≥ 15 phút (debounce kiểu mem0: chờ buổi xong).
//   2. Mỗi người: kiểm consent → gom việc → nếu có việc thì trừ MỘT lượt AI (fail-closed) → gọi AI
//      MỘT lần → kiểm đầu ra → ghi tóm tắt cuộn + tạo ProposedAction `pending` cho từng gợi ý ký ức.
//
// BẤT BIẾN (đều có test):
//   · Không thay đổi ký ức nào được tự ghi — mọi gợi ý là ProposedAction `pending` chờ người dùng.
//   · Không consent ⇒ không đọc transcript cho AI, không trừ lượt.
//   · Mọi lời gọi AI đi qua `consumeUsage` (fail-closed) và được hoàn khi AI hỏng/đầu ra hỏng.
//   · Tin nhạy cảm (> personal) hoặc lượt có dấu hiệu khủng hoảng không bao giờ vào prompt.
//   · Không log nội dung tin nhắn/ký ức — chỉ số đếm và lý do máy đọc được.
//
// Đếm/hoàn lượt (`@dhcb/core-billing/usage`) và lời gọi AI được TIÊM vào (`ReflectionDeps`) — gói
// này không phụ thuộc billing, và test thay được từng mắt xích.
import type { Pool } from 'pg'
import type { JsonSchema } from '@dhcb/core-ai/jsonSchema'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'
import type { Sensitivity } from '@dhcb/core-contracts/personalFact'
import { isConsentActive } from './consentService.js'
import { searchMemories } from './memoryRetrieval.js'
import { proposeAction, listProposedActions } from './proposedActionService.js'
import { listConversationSummaries, upsertConversationSummary } from './coreMemoryBlocks.js'
import { prefilterCrisis } from './safetyGuard.js'
import {
  buildReflectionPrompt,
  parseReflectionOutput,
  REFLECTION_JSON_SCHEMA,
  type ReflectionCandidate,
  type ReflectionMessage,
  type ReflectionOperation,
} from './memoryReflectionPrompt.js'

// ─── Hằng số (đặc tả ③ — đổi ở đây là đổi hành vi, sửa đặc tả cùng lúc) ──────────────────────

/** Tin cuối im bao lâu thì coi như buổi trò chuyện đã xong. */
export const SESSION_IDLE_MINUTES = 15
/** Chỉ xét người có tin nhắn trong khoảng này (giữ câu quét rẻ). */
export const CANDIDATE_WINDOW_HOURS = 48
/** Số người tối đa mỗi lượt quét. */
export const SWEEP_BATCH = 20
/** Trần số lần phản tỉnh có gọi AI mỗi người mỗi ngày (UTC) — chặn chi phí nền. */
export const MAX_RUNS_PER_DAY = 4
/** Số tin gần nhất sau con trỏ đưa vào bước trích ký ức. */
export const EXTRACTION_MESSAGE_LIMIT = 30
/** Số ký ức giống nhất đưa cho AI để so (mem0). */
export const CANDIDATE_MEMORY_LIMIT = 10
/** Tóm tắt cuộn kiểu Letta: cửa sổ 20 tin; ≥ 70% (14) chưa tóm tắt thì gộp 50% (10) cũ nhất. */
export const SUMMARY_WINDOW = 20
export const SUMMARY_TRIGGER = 14
export const SUMMARY_FOLD = 10
/** Trần gợi ý ký ức đang chờ duyệt mỗi người — quá thì không đề xuất thêm (người dùng duyệt không xuể). */
export const PENDING_SUGGESTION_CAP = 10

/** Capability mà bộ phản tỉnh có thể đề xuất — cũng là bộ lọc "gợi ý ký ức" ở trang ký ức. */
export const MEMORY_SUGGESTION_CAPABILITIES = new Set([
  'memory.create_record',
  'memory.supersede_record',
  'memory.invalidate_record',
])

const ALLOWED_SENSITIVITY: ReadonlySet<Sensitivity | string> = new Set(['public', 'personal'])
const ACTION_LABEL_MAX = 300

// ─── Phụ thuộc tiêm vào ───────────────────────────────────────────────────────────────────────

export interface ReflectionDeps {
  pool: Pool
  /** `checkAndConsumeUsage(userId, 'chat')` — fail-closed. */
  consumeUsage: (
    userId: string,
  ) => Promise<{ ok: true; day: string } | { ok: false; message: string }>
  /** `refundUsage(userId, 'chat', day)`. */
  refundUsage: (userId: string, day: string) => Promise<void>
  /** Một lời gọi AI (Anthropic → Groq → Gemini); `null` = không nhà cung cấp nào trả được. */
  generate: (prompt: {
    system: string
    userMessage: string
    maxTokens: number
    outputSchema: JsonSchema
  }) => Promise<string | null>
  now?: () => Date
}

export type ReflectionStatus =
  | 'no_consent'
  | 'daily_cap'
  | 'nothing_to_do'
  | 'quota'
  | 'ai_unavailable'
  | 'invalid_output'
  | 'done'

export interface ReflectionOutcome {
  status: ReflectionStatus
  proposed: number
  summarized: number
}

// ─── Truy vấn ────────────────────────────────────────────────────────────────────────────────

interface MessageRow {
  id: string
  role: string
  content: string
  domain: string | null
  sensitivity: string
  created_at: Date
}

interface Cursor {
  at: Date
  id: string
}

const MESSAGE_COLUMNS = 'id, role, content, domain, sensitivity, created_at'

/** Người cần phản tỉnh: có tin mới hơn lần thử trước, tin cuối đã im đủ lâu. */
export async function findReflectionCandidates(
  pool: Pool,
  now: Date,
  limit = SWEEP_BATCH,
): Promise<Array<{ personId: string; userId: string }>> {
  const windowStart = new Date(now.getTime() - CANDIDATE_WINDOW_HOURS * 3_600_000)
  const idleBefore = new Date(now.getTime() - SESSION_IDLE_MINUTES * 60_000)
  const { rows } = await pool.query<{ person_id: string; user_id: string }>(
    `select m.person_id, p.user_id
     from personal.companion_messages m
     join personal.persons p on p.id = m.person_id
     left join personal.companion_reflection_state s on s.person_id = m.person_id
     where m.created_at > $1
     group by m.person_id, p.user_id, s.last_attempt_at
     having max(m.created_at) <= $2
        and max(m.created_at) > coalesce(s.last_attempt_at, '-infinity'::timestamptz)
     order by max(m.created_at)
     limit $3`,
    [windowStart, idleBefore, limit],
  )
  return rows.map((r) => ({ personId: r.person_id, userId: r.user_id }))
}

interface StateRow {
  extracted_through_at: Date | null
  extracted_through_id: string | null
  runs_day: string | null
  runs_count: number
}

/** Ghi mốc thử TRƯỚC khi gọi AI — tiến trình chết giữa chừng thì không quét lại vô hạn. */
async function markAttempt(pool: Pool, personId: string, now: Date): Promise<StateRow> {
  const { rows } = await pool.query<StateRow>(
    `insert into personal.companion_reflection_state (person_id, last_attempt_at)
     values ($1, $2)
     on conflict (person_id) do update
       set last_attempt_at = excluded.last_attempt_at, updated_at = now()
     returning extracted_through_at, extracted_through_id, runs_day::text as runs_day, runs_count`,
    [personId, now],
  )
  const row = rows[0]
  if (!row) throw new Error('Không ghi được trạng thái phản tỉnh')
  return row
}

/** Dời con trỏ trích ký ức; `countRunDay` khác null = lần này có gọi AI (tính vào trần/ngày). */
async function advanceState(
  pool: Pool,
  personId: string,
  cursor: Cursor | null,
  countRunDay: string | null,
): Promise<void> {
  await pool.query(
    `update personal.companion_reflection_state
     set extracted_through_at = coalesce($2, extracted_through_at),
         extracted_through_id = coalesce($3, extracted_through_id),
         runs_count = case when $4::date is null then runs_count
                           when runs_day = $4::date then runs_count + 1
                           else 1 end,
         runs_day = coalesce($4::date, runs_day),
         updated_at = now()
     where person_id = $1`,
    [personId, cursor?.at ?? null, cursor?.id ?? null, countRunDay],
  )
}

async function listMessagesAfter(
  pool: Pool,
  personId: string,
  cursor: Cursor | null,
  options: { domain?: string; newest?: number; oldest?: number },
): Promise<MessageRow[]> {
  const params: unknown[] = [personId, cursor?.at ?? null, cursor?.id ?? null]
  let domainClause = ''
  if (options.domain !== undefined) {
    params.push(options.domain)
    domainClause = ` and domain = $${params.length}`
  }
  const newestFirst = options.newest !== undefined
  params.push(options.newest ?? options.oldest ?? SUMMARY_WINDOW)
  const { rows } = await pool.query<MessageRow>(
    `select ${MESSAGE_COLUMNS} from personal.companion_messages
     where person_id = $1
       and ($2::timestamptz is null or (created_at, id) > ($2::timestamptz, $3::uuid))${domainClause}
     order by created_at ${newestFirst ? 'desc' : 'asc'}, id ${newestFirst ? 'desc' : 'asc'}
     limit $${params.length}`,
    params,
  )
  return newestFirst ? rows.reverse() : rows
}

async function listRecentDomains(pool: Pool, personId: string, now: Date): Promise<string[]> {
  const { rows } = await pool.query<{ domain: string }>(
    `select distinct domain from personal.companion_messages
     where person_id = $1 and domain is not null and created_at > $2
     order by domain`,
    [personId, new Date(now.getTime() - CANDIDATE_WINDOW_HOURS * 3_600_000)],
  )
  return rows.map((r) => r.domain)
}

// ─── Lọc tin ─────────────────────────────────────────────────────────────────────────────────

/**
 * Giữ tin được phép đưa cho AI: độ nhạy ≤ personal (lượt `concern` lưu ≥ sensitive nên tự rơi) và
 * câu người dùng không khớp bộ lọc khủng hoảng. Câu trả lời của Companion đi theo số phận câu hỏi
 * ngay trước nó — lượt bị loại thì bỏ cả hai vế.
 */
export function filterEligibleMessages(rows: MessageRow[]): ReflectionMessage[] {
  const out: ReflectionMessage[] = []
  let previousUserEligible = false
  for (const row of rows) {
    const sensitivityOk = ALLOWED_SENSITIVITY.has(row.sensitivity)
    if (row.role === 'user') {
      previousUserEligible = sensitivityOk && prefilterCrisis(row.content) === null
      if (previousUserEligible) out.push({ id: row.id, role: 'user', content: row.content })
    } else if (previousUserEligible && sensitivityOk) {
      out.push({ id: row.id, role: 'companion', content: row.content })
    }
  }
  return out
}

const cursorOf = (row: MessageRow | undefined): Cursor | null =>
  row ? { at: row.created_at, id: row.id } : null

// ─── Kế hoạch tóm tắt ────────────────────────────────────────────────────────────────────────

interface SummaryPlan {
  domain: string
  previous: string
  messages: ReflectionMessage[]
  through: Cursor
}

/**
 * Letta 70/50 trên cửa sổ 20 tin của từng miền: ≥ 14 tin chưa tóm tắt ⇒ gộp 10 tin cũ nhất TRONG
 * cửa sổ. Tin cũ hơn cửa sổ (lần đầu bật công tắc khi đã có lịch sử dài) bị bỏ qua — con trỏ nhảy
 * qua chúng, không gom cả quá khứ vào một lần gọi.
 */
async function planSummaries(pool: Pool, personId: string, now: Date): Promise<SummaryPlan[]> {
  const existing = new Map(
    (await listConversationSummaries(pool, personId)).map((s) => [s.domain, s]),
  )
  const plans: SummaryPlan[] = []
  for (const domain of await listRecentDomains(pool, personId, now)) {
    const prior = existing.get(domain)
    const rows = await listMessagesAfter(pool, personId, prior?.through ?? null, {
      domain,
      oldest: 500,
    })
    if (rows.length < SUMMARY_TRIGGER) continue
    const start = Math.max(0, rows.length - SUMMARY_WINDOW)
    const fold = rows.slice(start, start + SUMMARY_FOLD)
    const through = cursorOf(fold[fold.length - 1])
    if (!through) continue
    plans.push({
      domain,
      previous: prior?.summary ?? '',
      messages: filterEligibleMessages(fold),
      through,
    })
  }
  return plans
}

// ─── Đề xuất ─────────────────────────────────────────────────────────────────────────────────

function actionLabel(text: string): string {
  return text.length > ACTION_LABEL_MAX ? `${text.slice(0, ACTION_LABEL_MAX - 1)}…` : text
}

function toProposal(op: ReflectionOperation): {
  capabilityId: string
  action: string
  payload: Record<string, unknown>
} {
  const source =
    'sourceMessageId' in op && op.sourceMessageId ? { sourceMessageId: op.sourceMessageId } : {}
  switch (op.op) {
    case 'ADD':
      return {
        capabilityId: 'memory.create_record',
        action: actionLabel(`Ghi nhớ: ${op.content}`),
        payload: {
          namespace: op.namespace,
          content: op.content,
          importance: op.importance,
          origin: 'reflection',
          reason: op.reason,
          ...source,
        },
      }
    case 'UPDATE':
      return {
        capabilityId: 'memory.supersede_record',
        action: actionLabel(`Cập nhật ký ức: ${op.content}`),
        payload: {
          targetRecordId: op.target.id,
          targetVersion: op.target.version,
          previousContent: op.target.content,
          content: op.content,
          importance: op.importance,
          origin: 'reflection',
          reason: op.reason,
          ...source,
        },
      }
    case 'INVALIDATE':
      return {
        capabilityId: 'memory.invalidate_record',
        action: actionLabel(`Bỏ ký ức cũ: ${op.target.content}`),
        payload: {
          targetRecordId: op.target.id,
          targetVersion: op.target.version,
          previousContent: op.target.content,
          origin: 'reflection',
          reason: op.reason,
        },
      }
  }
}

/** Gợi ý ký ức đang chờ duyệt: số lượng, nội dung (chống trùng), ký ức đã bị nhắm tới. */
async function readPendingSuggestions(pool: Pool, personId: string) {
  const pending = (
    await listProposedActions(pool, personId, { status: 'pending', limit: 100 })
  ).filter((a) => MEMORY_SUGGESTION_CAPABILITIES.has(a.capabilityId))
  const contents = new Set<string>()
  const targets = new Set<string>()
  for (const a of pending) {
    const payload = (a.payload ?? {}) as Record<string, unknown>
    if (typeof payload.content === 'string') contents.add(payload.content)
    if (typeof payload.targetRecordId === 'string') targets.add(payload.targetRecordId)
  }
  return { count: pending.length, contents, targets }
}

// ─── Một người ───────────────────────────────────────────────────────────────────────────────

export async function reflectOnPerson(
  deps: ReflectionDeps,
  candidate: { personId: string; userId: string },
): Promise<ReflectionOutcome> {
  const { pool } = deps
  const now = deps.now?.() ?? new Date()
  const today = now.toISOString().slice(0, 10)
  const { personId, userId } = candidate
  const outcome = (status: ReflectionStatus, proposed = 0, summarized = 0): ReflectionOutcome => ({
    status,
    proposed,
    summarized,
  })

  const state = await markAttempt(pool, personId, now)
  if (state.runs_day === today && state.runs_count >= MAX_RUNS_PER_DAY) return outcome('daily_cap')

  const consent = (scope: string) =>
    isConsentActive(pool, personId, scope, COMPANION_CONSENT_PURPOSE)
  const [memory, suggest, history] = await Promise.all([
    consent(COMPANION_CONSENT_SCOPES.memory),
    consent(COMPANION_CONSENT_SCOPES.suggest),
    consent(COMPANION_CONSENT_SCOPES.history),
  ])
  const canExtract = memory && suggest
  if (!canExtract && !history) return outcome('no_consent')

  // Gom việc TRƯỚC khi trừ lượt — không có việc thì không tốn lượt nào.
  const extractionCursor: Cursor | null =
    state.extracted_through_at && state.extracted_through_id
      ? { at: state.extracted_through_at, id: state.extracted_through_id }
      : null
  let extractionRows: MessageRow[] = []
  let extractionMessages: ReflectionMessage[] = []
  if (canExtract) {
    extractionRows = await listMessagesAfter(pool, personId, extractionCursor, {
      newest: EXTRACTION_MESSAGE_LIMIT,
    })
    extractionMessages = filterEligibleMessages(extractionRows)
  }
  const newExtractionCursor = cursorOf(extractionRows[extractionRows.length - 1])
  const summaryPlans = history ? await planSummaries(pool, personId, now) : []
  const summaryWork = summaryPlans.filter((p) => p.messages.length > 0)
  const hasUserMessage = extractionMessages.some((m) => m.role === 'user')

  if (!hasUserMessage && summaryWork.length === 0) {
    // Không có gì cho AI: vẫn dời con trỏ qua những tin đã xét (kể cả tin bị lọc).
    for (const plan of summaryPlans) {
      await upsertConversationSummary(pool, personId, plan.domain, plan.previous, plan.through)
    }
    await advanceState(pool, personId, newExtractionCursor, null)
    return outcome('nothing_to_do')
  }

  const gate = await deps.consumeUsage(userId)
  if (!gate.ok) return outcome('quota')

  let candidates: ReflectionCandidate[] = []
  if (hasUserMessage) {
    try {
      const scored = await searchMemories(pool, personId, {
        query: extractionMessages
          .filter((m) => m.role === 'user')
          .map((m) => m.content)
          .join('\n')
          .slice(0, 2000),
        limit: CANDIDATE_MEMORY_LIMIT,
        maxSensitivity: 'personal',
        touch: false,
        now,
      })
      candidates = scored.map(({ record }) => ({
        id: record.id,
        version: record.version,
        namespace: record.namespace,
        content: record.content,
      }))
    } catch {
      // Không đọc được ký ức cũ: vẫn trích được điều mới; chống trùng dựa vào gợi ý đang chờ.
    }
  }

  const prompt = buildReflectionPrompt({
    now,
    extraction: hasUserMessage ? { messages: extractionMessages, candidates } : null,
    summaries: summaryWork.map((p) => ({
      domain: p.domain,
      previous: p.previous,
      messages: p.messages,
    })),
  })

  let raw: string | null
  try {
    raw = await deps.generate({
      system: prompt.system,
      userMessage: prompt.userMessage,
      maxTokens: prompt.maxTokens,
      outputSchema: REFLECTION_JSON_SCHEMA,
    })
  } catch {
    raw = null
  }
  if (raw === null) {
    await deps.refundUsage(userId, gate.day)
    return outcome('ai_unavailable')
  }

  const pending = await readPendingSuggestions(pool, personId)
  const parsed = parseReflectionOutput(raw, prompt, pending.contents)
  if (!parsed.ok) {
    await deps.refundUsage(userId, gate.day)
    console.warn(`[companion-reflection] đầu ra AI bị từ chối: ${parsed.reason}`)
    return outcome('invalid_output')
  }
  const droppedTotal = Object.values(parsed.dropped).reduce((a, b) => a + (b ?? 0), 0)
  if (droppedTotal > 0) {
    console.warn(
      `[companion-reflection] bỏ ${droppedTotal} gợi ý: ${JSON.stringify(parsed.dropped)}`,
    )
  }

  // Từ đây AI đã làm xong việc — lượt được tính kể cả khi bước ghi lỗi (nơi gọi log + Sentry).
  let summarized = 0
  for (const plan of summaryPlans) {
    const fresh = parsed.summaries.get(plan.domain)
    // Miền có tin cần gộp mà AI không trả tóm tắt ⇒ giữ con trỏ, lần sau thử lại.
    if (fresh === undefined && plan.messages.length > 0) continue
    await upsertConversationSummary(
      pool,
      personId,
      plan.domain,
      fresh ?? plan.previous,
      plan.through,
    )
    if (fresh !== undefined) summarized++
  }

  let proposed = 0
  let room = PENDING_SUGGESTION_CAP - pending.count
  for (const op of parsed.operations) {
    if (room <= 0) break
    if (op.op !== 'ADD' && pending.targets.has(op.target.id)) continue
    const proposal = toProposal(op)
    await proposeAction(pool, {
      personId,
      capabilityId: proposal.capabilityId,
      action: proposal.action,
      targetDomain: 'personal',
      payload: proposal.payload,
      riskLevel: 'medium',
    })
    if (op.op !== 'ADD') pending.targets.add(op.target.id)
    proposed++
    room--
  }

  await advanceState(pool, personId, newExtractionCursor, today)
  return outcome('done', proposed, summarized)
}

// ─── Lượt quét ───────────────────────────────────────────────────────────────────────────────

export interface ReflectionSweepResult {
  persons: number
  proposed: number
  summarized: number
  failed: number
  byStatus: Partial<Record<ReflectionStatus, number>>
}

/** Một lượt quét: lỗi của một người không chặn người khác; trả số đếm để log. */
export async function runReflectionSweep(
  deps: ReflectionDeps,
  onError: (err: unknown) => void = () => {},
): Promise<ReflectionSweepResult> {
  const now = deps.now?.() ?? new Date()
  const result: ReflectionSweepResult = {
    persons: 0,
    proposed: 0,
    summarized: 0,
    failed: 0,
    byStatus: {},
  }
  for (const candidate of await findReflectionCandidates(deps.pool, now)) {
    result.persons++
    try {
      const outcome = await reflectOnPerson(deps, candidate)
      result.byStatus[outcome.status] = (result.byStatus[outcome.status] ?? 0) + 1
      result.proposed += outcome.proposed
      result.summarized += outcome.summarized
    } catch (err) {
      result.failed++
      onError(err)
    }
  }
  return result
}

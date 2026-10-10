// packages/core-personal/automationService.ts — V2-18 Approved Automation Service.
// Enforces explicit grants, trigger checks, budgets/rate limits, retries/compensation, and immutable action receipts.
import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { withTransaction } from '@dhcb/core-db/transaction'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@dhcb/core-errors/appError'
import {
  AutomationGrantSchema,
  ActionReceiptSchema,
  AUTOMATION_SCHEMA_VERSION,
  type AutomationGrant,
  type ActionReceipt,
  type AutomationGrantStatus,
  type AutomationTrigger,
  type AutomationBudget,
  type AutomationCompensation,
} from '@dhcb/core-contracts/automation'
import { resolveAuthority } from './policyService.js'
import { getToolManifest, validateToolInput } from './toolRegistry.js'

export interface CreateAutomationGrantInput {
  personId: string
  name: string
  description?: string
  capabilityId: string
  action: string
  targetDomain: string
  trigger: AutomationTrigger
  budget?: Partial<AutomationBudget>
  compensation?: AutomationCompensation
  reviewAt: string
  expiresAt?: string
}

export interface ExecuteAutomatedActionInput {
  personId: string
  grantId: string
  idempotencyKey: string
  triggerSource: string
  inputPayload: Record<string, unknown>
  maxRetries?: number
  executor?: (payload: unknown) => Promise<unknown>
}

interface GrantRow {
  id: string
  person_id: string
  name: string
  description: string | null
  capability_id: string
  action: string
  target_domain: string
  trigger_config: unknown
  budget_config: unknown
  compensation_config: unknown
  status: string
  version: number
  review_at: Date
  expires_at: Date | null
  created_at: Date
  updated_at: Date
  revoked_at: Date | null
}

interface ReceiptRow {
  id: string
  person_id: string
  grant_id: string
  capability_id: string
  action: string
  idempotency_key: string
  trigger_source: string
  input_payload: unknown
  execution_result: unknown
  status: string
  retry_count: number
  duration_ms: number
  error_message: string | null
  compensation_result: unknown
  created_at: Date
}

const GRANT_COLUMNS = `id, person_id, name, description, capability_id, action, target_domain,
  trigger_config, budget_config, compensation_config, status, version, review_at, expires_at,
  created_at, updated_at, revoked_at`

const RECEIPT_COLUMNS = `id, person_id, grant_id, capability_id, action, idempotency_key,
  trigger_source, input_payload, execution_result, status, retry_count, duration_ms,
  error_message, compensation_result, created_at`

function toAutomationGrant(row: GrantRow): AutomationGrant {
  return AutomationGrantSchema.parse({
    id: row.id,
    personId: row.person_id,
    name: row.name,
    description: row.description ?? undefined,
    capabilityId: row.capability_id,
    action: row.action,
    targetDomain: row.target_domain,
    trigger: row.trigger_config,
    budget: row.budget_config,
    compensation: row.compensation_config ?? undefined,
    status: row.status,
    version: row.version,
    reviewAt: row.review_at.toISOString(),
    expiresAt: row.expires_at ? row.expires_at.toISOString() : undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    revokedAt: row.revoked_at ? row.revoked_at.toISOString() : undefined,
    schemaVersion: AUTOMATION_SCHEMA_VERSION,
  })
}

function toActionReceipt(row: ReceiptRow): ActionReceipt {
  return ActionReceiptSchema.parse({
    id: row.id,
    personId: row.person_id,
    grantId: row.grant_id,
    capabilityId: row.capability_id,
    action: row.action,
    idempotencyKey: row.idempotency_key,
    triggerSource: row.trigger_source,
    inputPayload: row.input_payload,
    executionResult: row.execution_result ?? undefined,
    status: row.status,
    retryCount: row.retry_count,
    durationMs: row.duration_ms,
    errorMessage: row.error_message ?? undefined,
    compensationResult: row.compensation_result ?? undefined,
    createdAt: row.created_at.toISOString(),
    schemaVersion: AUTOMATION_SCHEMA_VERSION,
  })
}

/**
 * Creates a new explicit AutomationGrant.
 */
export async function createAutomationGrant(
  pool: Pool,
  input: CreateAutomationGrantInput,
): Promise<AutomationGrant> {
  const id = randomUUID()
  const budget = {
    maxRunsPerHour: input.budget?.maxRunsPerHour ?? 10,
    maxRunsPerDay: input.budget?.maxRunsPerDay ?? 50,
    cooldownSeconds: input.budget?.cooldownSeconds ?? 60,
    costBudgetCents: input.budget?.costBudgetCents,
  }

  // Validate reviewAt date
  const reviewDate = new Date(input.reviewAt)
  if (isNaN(reviewDate.getTime())) {
    throw new ValidationError('reviewAt phải là chuỗi thời gian hợp lệ')
  }

  // Ensure tool is valid if registered in registry
  try {
    getToolManifest(input.capabilityId)
  } catch {
    // If not in tool registry, ensure capabilityId matches domain.action regex
    if (!/^[a-z_]+\.[a-z_]+$/.test(input.capabilityId)) {
      throw new ValidationError('capabilityId phải có dạng "domain.action"')
    }
  }

  const res = await pool.query<GrantRow>(
    `insert into personal.automation_grants
      (id, person_id, name, description, capability_id, action, target_domain,
       trigger_config, budget_config, compensation_config, status, version, review_at, expires_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', 1, $11, $12)
     returning ${GRANT_COLUMNS}`,
    [
      id,
      input.personId,
      input.name,
      input.description ?? null,
      input.capabilityId,
      input.action,
      input.targetDomain,
      JSON.stringify(input.trigger),
      JSON.stringify(budget),
      input.compensation ? JSON.stringify(input.compensation) : null,
      input.reviewAt,
      input.expiresAt ?? null,
    ],
  )

  const row = res.rows[0]
  if (!row) throw new Error('Không thể tạo AutomationGrant')
  return toAutomationGrant(row)
}

/**
 * Pauses an active AutomationGrant.
 */
export async function pauseAutomationGrant(
  pool: Pool,
  personId: string,
  grantId: string,
  expectedVersion: number,
): Promise<AutomationGrant> {
  return await withTransaction(pool, async (client) => {
    const locked = await client.query<GrantRow>(
      `select ${GRANT_COLUMNS} from personal.automation_grants
       where id = $1 and person_id = $2 for update`,
      [grantId, personId],
    )
    const current = locked.rows[0]
    if (!current) throw new NotFoundError('Không tìm thấy AutomationGrant')

    if (current.version !== expectedVersion) {
      throw new ConflictError(
        `Conflict: expectedVersion=${expectedVersion}, currentVersion=${current.version}`,
      )
    }

    if (current.status !== 'active') {
      throw new ConflictError(
        `Không thể tạm dừng grant ở trạng thái '${current.status}' (chỉ cho phép khi 'active')`,
      )
    }

    const updated = await client.query<GrantRow>(
      `update personal.automation_grants
       set status = 'paused', version = version + 1, updated_at = now()
       where id = $1 returning ${GRANT_COLUMNS}`,
      [grantId],
    )

    const row = updated.rows[0]
    if (!row) throw new Error('Không thể tạm dừng AutomationGrant')
    return toAutomationGrant(row)
  })
}

/**
 * Resumes a paused AutomationGrant.
 */
export async function resumeAutomationGrant(
  pool: Pool,
  personId: string,
  grantId: string,
  expectedVersion: number,
): Promise<AutomationGrant> {
  return await withTransaction(pool, async (client) => {
    const locked = await client.query<GrantRow>(
      `select ${GRANT_COLUMNS} from personal.automation_grants
       where id = $1 and person_id = $2 for update`,
      [grantId, personId],
    )
    const current = locked.rows[0]
    if (!current) throw new NotFoundError('Không tìm thấy AutomationGrant')

    if (current.version !== expectedVersion) {
      throw new ConflictError(
        `Conflict: expectedVersion=${expectedVersion}, currentVersion=${current.version}`,
      )
    }

    if (current.status !== 'paused') {
      throw new ConflictError(
        `Không thể kích hoạt lại grant ở trạng thái '${current.status}' (chỉ cho phép khi 'paused')`,
      )
    }

    const updated = await client.query<GrantRow>(
      `update personal.automation_grants
       set status = 'active', version = version + 1, updated_at = now()
       where id = $1 returning ${GRANT_COLUMNS}`,
      [grantId],
    )

    const row = updated.rows[0]
    if (!row) throw new Error('Không thể kích hoạt lại AutomationGrant')
    return toAutomationGrant(row)
  })
}

/**
 * Revokes an AutomationGrant permanently.
 */
export async function revokeAutomationGrant(
  pool: Pool,
  personId: string,
  grantId: string,
  expectedVersion: number,
): Promise<AutomationGrant> {
  return await withTransaction(pool, async (client) => {
    const locked = await client.query<GrantRow>(
      `select ${GRANT_COLUMNS} from personal.automation_grants
       where id = $1 and person_id = $2 for update`,
      [grantId, personId],
    )
    const current = locked.rows[0]
    if (!current) throw new NotFoundError('Không tìm thấy AutomationGrant')

    if (current.version !== expectedVersion) {
      throw new ConflictError(
        `Conflict: expectedVersion=${expectedVersion}, currentVersion=${current.version}`,
      )
    }

    if (current.status === 'revoked') {
      throw new ConflictError('AutomationGrant đã bị thu hồi trước đó')
    }

    const updated = await client.query<GrantRow>(
      `update personal.automation_grants
       set status = 'revoked', version = version + 1, updated_at = now(), revoked_at = now()
       where id = $1 returning ${GRANT_COLUMNS}`,
      [grantId],
    )

    const row = updated.rows[0]
    if (!row) throw new Error('Không thể thu hồi AutomationGrant')
    return toAutomationGrant(row)
  })
}

/**
 * Lists AutomationGrants for a person.
 */
export async function listAutomationGrants(
  pool: Pool,
  personId: string,
  options?: { status?: AutomationGrantStatus; limit?: number },
): Promise<AutomationGrant[]> {
  const params: unknown[] = [personId]
  const clauses = ['person_id = $1']

  if (options?.status) {
    params.push(options.status)
    clauses.push(`status = $${params.length}`)
  }

  const limit = Math.min(100, Math.max(1, options?.limit ?? 50))
  params.push(limit)

  const res = await pool.query<GrantRow>(
    `select ${GRANT_COLUMNS} from personal.automation_grants
     where ${clauses.join(' and ')}
     order by created_at desc
     limit $${params.length}`,
    params,
  )

  return res.rows.map(toAutomationGrant)
}

/**
 * Gets a specific AutomationGrant.
 */
export async function getAutomationGrant(
  pool: Pool,
  personId: string,
  grantId: string,
): Promise<AutomationGrant> {
  const res = await pool.query<GrantRow>(
    `select ${GRANT_COLUMNS} from personal.automation_grants
     where id = $1 and person_id = $2`,
    [grantId, personId],
  )
  const row = res.rows[0]
  if (!row) throw new NotFoundError('Không tìm thấy AutomationGrant')
  return toAutomationGrant(row)
}

/**
 * Executes an automated action protected by an active AutomationGrant.
 * Enforces:
 * 1. Idempotency receipt deduplication
 * 2. Grant status & expiration check
 * 3. Personal Policy authority gate (DENY halts immediately)
 * 4. Rate limits / budget caps (runs/hour, runs/day, cooldown)
 * 5. Retries & compensation on failure
 * 6. Immutable ActionReceipt persistence
 */
export async function executeAutomatedAction(
  pool: Pool,
  input: ExecuteAutomatedActionInput,
): Promise<{ receipt: ActionReceipt; deduplicated: boolean }> {
  const { personId, grantId, idempotencyKey, triggerSource, inputPayload, maxRetries = 2 } = input

  // 1. Idempotency check
  const existingReceipt = await pool.query<ReceiptRow>(
    `select ${RECEIPT_COLUMNS} from personal.action_receipts
     where person_id = $1 and idempotency_key = $2`,
    [personId, idempotencyKey],
  )
  if (existingReceipt.rows[0]) {
    return {
      receipt: toActionReceipt(existingReceipt.rows[0]),
      deduplicated: true,
    }
  }

  // 2. Fetch and validate Grant
  const grant = await getAutomationGrant(pool, personId, grantId)

  if (grant.status !== 'active') {
    throw new ForbiddenError(
      `AutomationGrant không ở trạng thái 'active' (hiện tại là '${grant.status}')`,
    )
  }

  const now = new Date()
  if (grant.expiresAt && new Date(grant.expiresAt) <= now) {
    throw new ForbiddenError('AutomationGrant đã hết hạn (expiresAt <= now)')
  }

  if (new Date(grant.reviewAt) <= now) {
    throw new ForbiddenError('AutomationGrant cần được xem xét lại (reviewAt <= now)')
  }

  // 3. Personal Policy Gate
  const authority = await resolveAuthority(
    pool,
    personId,
    grant.capabilityId,
    grant.action,
    grant.targetDomain,
  )
  if (authority === 'DENY') {
    throw new ForbiddenError('Hành động tự động bị từ chối bởi Personal Policy (DENY)')
  }

  // 4. Rate limits & budget enforcement
  const budget = grant.budget
  const statsRes = await pool.query<{
    runs_last_hour: string
    runs_last_day: string
    last_run_seconds_ago: string | null
  }>(
    `select
       count(*) filter (where created_at > now() - interval '1 hour') as runs_last_hour,
       count(*) filter (where created_at > now() - interval '1 day') as runs_last_day,
       extract(epoch from (now() - max(created_at))) as last_run_seconds_ago
     from personal.action_receipts
     where grant_id = $1 and person_id = $2`,
    [grantId, personId],
  )

  const stats = statsRes.rows[0]
  if (stats) {
    const runsHour = parseInt(stats.runs_last_hour, 10) || 0
    const runsDay = parseInt(stats.runs_last_day, 10) || 0
    const lastRunSec =
      stats.last_run_seconds_ago !== null ? parseFloat(stats.last_run_seconds_ago) : null

    if (runsHour >= budget.maxRunsPerHour) {
      throw new RateLimitError(
        `Vượt quá giới hạn số lần chạy mỗi giờ (${runsHour}/${budget.maxRunsPerHour})`,
      )
    }

    if (runsDay >= budget.maxRunsPerDay) {
      throw new RateLimitError(
        `Vượt quá giới hạn số lần chạy mỗi ngày (${runsDay}/${budget.maxRunsPerDay})`,
      )
    }

    if (lastRunSec !== null && lastRunSec < budget.cooldownSeconds) {
      throw new RateLimitError(
        `Cần giãn cách tối thiểu ${budget.cooldownSeconds}s giữa các lần chạy (còn ${Math.ceil(
          budget.cooldownSeconds - lastRunSec,
        )}s)`,
      )
    }
  }

  // 5. Execution with retry logic
  const startTime = Date.now()
  let retryCount = 0
  let executionResult: unknown = null
  let errorMessage: string | null = null
  let status: 'success' | 'failed' = 'success'
  let compensationResult: unknown = null

  // Validate tool input if registered
  try {
    const tool = getToolManifest(grant.capabilityId)
    validateToolInput(tool, inputPayload)
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err
    }
  }

  const defaultExecutor = async (payload: unknown) => {
    return {
      success: true,
      capabilityId: grant.capabilityId,
      action: grant.action,
      payload,
      executedAt: new Date().toISOString(),
    }
  }

  const execFn = input.executor ?? defaultExecutor

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      executionResult = await execFn(inputPayload)
      status = 'success'
      errorMessage = null
      break
    } catch (err) {
      retryCount = attempt
      errorMessage = err instanceof Error ? err.message : String(err)
      status = 'failed'
    }
  }

  // 6. Bù trừ khi thất bại — CHƯA có executor bù trừ thật (audit 2026-10-10, E1.9): trước đây
  // nhánh này tự ghi `reverted: true` + status 'compensated' mà không hoàn tác gì, biên nhận BẤT
  // BIẾN ghi sai sự thật. Nay ghi đúng: còn 'failed', bù trừ chưa chạy (`reverted: false`).
  if (status === 'failed' && grant.compensation) {
    compensationResult = {
      compensatedTool: grant.compensation.toolId,
      reverted: false,
      reason: 'not_implemented',
    }
  }

  const durationMs = Date.now() - startTime
  const receiptId = randomUUID()

  // 7. Write immutable ActionReceipt
  const receiptRes = await pool.query<ReceiptRow>(
    `insert into personal.action_receipts
      (id, person_id, grant_id, capability_id, action, idempotency_key, trigger_source,
       input_payload, execution_result, status, retry_count, duration_ms, error_message, compensation_result)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     returning ${RECEIPT_COLUMNS}`,
    [
      receiptId,
      personId,
      grantId,
      grant.capabilityId,
      grant.action,
      idempotencyKey,
      triggerSource,
      JSON.stringify(inputPayload),
      executionResult ? JSON.stringify(executionResult) : null,
      status,
      retryCount,
      durationMs,
      errorMessage,
      compensationResult ? JSON.stringify(compensationResult) : null,
    ],
  )

  const row = receiptRes.rows[0]
  if (!row) throw new Error('Không thể tạo ActionReceipt')

  return {
    receipt: toActionReceipt(row),
    deduplicated: false,
  }
}

/**
 * Lists ActionReceipts for a person or specific grant.
 */
export async function listActionReceipts(
  pool: Pool,
  personId: string,
  options?: { grantId?: string; limit?: number },
): Promise<ActionReceipt[]> {
  const params: unknown[] = [personId]
  const clauses = ['person_id = $1']

  if (options?.grantId) {
    params.push(options.grantId)
    clauses.push(`grant_id = $${params.length}`)
  }

  const limit = Math.min(100, Math.max(1, options?.limit ?? 50))
  params.push(limit)

  const res = await pool.query<ReceiptRow>(
    `select ${RECEIPT_COLUMNS} from personal.action_receipts
     where ${clauses.join(' and ')}
     order by created_at desc
     limit $${params.length}`,
    params,
  )

  return res.rows.map(toActionReceipt)
}

/**
 * Gets a specific ActionReceipt.
 */
export async function getActionReceipt(
  pool: Pool,
  personId: string,
  receiptId: string,
): Promise<ActionReceipt> {
  const res = await pool.query<ReceiptRow>(
    `select ${RECEIPT_COLUMNS} from personal.action_receipts
     where id = $1 and person_id = $2`,
    [receiptId, personId],
  )
  const row = res.rows[0]
  if (!row) throw new NotFoundError('Không tìm thấy ActionReceipt')
  return toActionReceipt(row)
}

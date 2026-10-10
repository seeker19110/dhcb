import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@dhcb/core-errors/appError'
import {
  createAutomationGrant,
  pauseAutomationGrant,
  resumeAutomationGrant,
  revokeAutomationGrant,
  listAutomationGrants,
  getAutomationGrant,
  executeAutomatedAction,
  listActionReceipts,
  getActionReceipt,
} from './automationService.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const GRANT_ID = '22222222-2222-4222-8222-222222222222'
const RECEIPT_ID = '33333333-3333-4333-8333-333333333333'
const NOW = new Date('2026-08-17T00:00:00Z')
const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
const PAST = new Date('2026-07-17T00:00:00Z')

const policies = vi.hoisted(() => ({
  resolveAuthority: vi.fn(),
}))
vi.mock('./policyService.js', () => ({
  resolveAuthority: (...a: unknown[]) => policies.resolveAuthority(...a),
}))

function grantRow(over: Record<string, unknown> = {}) {
  return {
    id: GRANT_ID,
    person_id: PERSON,
    name: 'Daily Vocab Reminder',
    description: 'Send vocab reminder every morning',
    capability_id: 'learning.update_goal',
    action: 'update_goal',
    target_domain: 'learning',
    trigger_config: { type: 'schedule', cronOrInterval: '0 8 * * *' },
    budget_config: { maxRunsPerHour: 5, maxRunsPerDay: 20, cooldownSeconds: 30 },
    compensation_config: null,
    status: 'active',
    version: 1,
    review_at: FUTURE,
    expires_at: null,
    created_at: NOW,
    updated_at: NOW,
    revoked_at: null,
    ...over,
  }
}

function receiptRow(over: Record<string, unknown> = {}) {
  return {
    id: RECEIPT_ID,
    person_id: PERSON,
    grant_id: GRANT_ID,
    capability_id: 'learning.update_goal',
    action: 'update_goal',
    idempotency_key: 'idem-key-123',
    trigger_source: 'schedule:cron',
    input_payload: { goal: 'IELTS 8.0' },
    execution_result: { success: true },
    status: 'success',
    retry_count: 0,
    duration_ms: 50,
    error_message: null,
    compensation_result: null,
    created_at: NOW,
    ...over,
  }
}

function mockPool(
  queryFn: (sql: string, params?: unknown[]) => Promise<{ rows?: unknown[]; rowCount?: number }>,
): Pool {
  const client = {
    query: vi.fn(queryFn),
    release: vi.fn(),
  }
  return {
    query: vi.fn(queryFn),
    connect: vi.fn().mockResolvedValue(client),
  } as unknown as Pool
}

beforeEach(() => {
  vi.clearAllMocks()
  policies.resolveAuthority.mockResolvedValue('AUTOMATE')
})

describe('automationService - createAutomationGrant', () => {
  it('creates an automation grant with valid reviewAt and full options', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('insert into personal.automation_grants')) {
        return {
          rows: [
            grantRow({
              description: 'Detailed description',
              compensation_config: { toolId: 'learning.update_goal' },
              expires_at: FUTURE,
            }),
          ],
        }
      }
      return { rows: [] }
    })

    const grant = await createAutomationGrant(pool, {
      personId: PERSON,
      name: 'Daily Vocab Reminder',
      description: 'Detailed description',
      capabilityId: 'learning.update_goal',
      action: 'update_goal',
      targetDomain: 'learning',
      trigger: { type: 'schedule', cronOrInterval: '0 8 * * *' },
      budget: { maxRunsPerHour: 5, maxRunsPerDay: 20, cooldownSeconds: 30 },
      compensation: { toolId: 'learning.update_goal' },
      reviewAt: FUTURE.toISOString(),
      expiresAt: FUTURE.toISOString(),
    })

    expect(grant.id).toBe(GRANT_ID)
    expect(grant.status).toBe('active')
    expect(grant.description).toBe('Detailed description')
  })

  it('creates an automation grant with default budget', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('insert into personal.automation_grants')) {
        return { rows: [grantRow()] }
      }
      return { rows: [] }
    })

    const grant = await createAutomationGrant(pool, {
      personId: PERSON,
      name: 'Daily Vocab Reminder',
      capabilityId: 'custom.action_test',
      action: 'action_test',
      targetDomain: 'custom',
      trigger: { type: 'manual' },
      reviewAt: FUTURE.toISOString(),
    })

    expect(grant.id).toBe(GRANT_ID)
  })

  it('throws Error if insert returns empty row', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(
      createAutomationGrant(pool, {
        personId: PERSON,
        name: 'Daily Vocab Reminder',
        capabilityId: 'learning.update_goal',
        action: 'update_goal',
        targetDomain: 'learning',
        trigger: { type: 'manual' },
        reviewAt: FUTURE.toISOString(),
      }),
    ).rejects.toThrow('Không thể tạo AutomationGrant')
  })

  it('rejects invalid reviewAt date string', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(
      createAutomationGrant(pool, {
        personId: PERSON,
        name: 'Invalid Date',
        capabilityId: 'learning.update_goal',
        action: 'update_goal',
        targetDomain: 'learning',
        trigger: { type: 'manual' },
        reviewAt: 'invalid-date',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects invalid capabilityId format', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(
      createAutomationGrant(pool, {
        personId: PERSON,
        name: 'Invalid Cap',
        capabilityId: 'invalidcapability',
        action: 'update_goal',
        targetDomain: 'learning',
        trigger: { type: 'manual' },
        reviewAt: FUTURE.toISOString(),
      }),
    ).rejects.toThrow(ValidationError)
  })
})

describe('automationService - pause, resume, revoke', () => {
  it('pauses an active grant', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'active', version: 1 })] }
      }
      if (sql.includes('update personal.automation_grants')) {
        return { rows: [grantRow({ status: 'paused', version: 2 })] }
      }
      return { rows: [] }
    })

    const grant = await pauseAutomationGrant(pool, PERSON, GRANT_ID, 1)
    expect(grant.status).toBe('paused')
    expect(grant.version).toBe(2)
  })

  it('throws ConflictError if version mismatch on pause, resume, revoke', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'active', version: 2 })] }
      }
      return { rows: [] }
    })

    await expect(pauseAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(ConflictError)
    await expect(resumeAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(ConflictError)
    await expect(revokeAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(ConflictError)
  })

  it('throws ConflictError if trying to pause a non-active grant', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'paused', version: 1 })] }
      }
      return { rows: [] }
    })

    await expect(pauseAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(ConflictError)
  })

  it('resumes a paused grant', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'paused', version: 2 })] }
      }
      if (sql.includes('update personal.automation_grants')) {
        return { rows: [grantRow({ status: 'active', version: 3 })] }
      }
      return { rows: [] }
    })

    const grant = await resumeAutomationGrant(pool, PERSON, GRANT_ID, 2)
    expect(grant.status).toBe('active')
    expect(grant.version).toBe(3)
  })

  it('throws ConflictError if resuming non-paused grant', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'active', version: 1 })] }
      }
      return { rows: [] }
    })

    await expect(resumeAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(ConflictError)
  })

  it('revokes a grant', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'active', version: 1 })] }
      }
      if (sql.includes('update personal.automation_grants')) {
        return { rows: [grantRow({ status: 'revoked', version: 2, revoked_at: NOW })] }
      }
      return { rows: [] }
    })

    const grant = await revokeAutomationGrant(pool, PERSON, GRANT_ID, 1)
    expect(grant.status).toBe('revoked')
  })

  it('throws ConflictError if revoking already revoked grant', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'revoked', version: 1 })] }
      }
      return { rows: [] }
    })

    await expect(revokeAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(ConflictError)
  })

  it('throws NotFoundError on unknown grant', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(pauseAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(NotFoundError)
    await expect(resumeAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(NotFoundError)
    await expect(revokeAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(NotFoundError)
  })

  it('throws Error if update returns empty row on pause/resume/revoke', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'active', version: 1 })] }
      }
      return { rows: [] }
    })
    await expect(pauseAutomationGrant(pool, PERSON, GRANT_ID, 1)).rejects.toThrow(
      'Không thể tạm dừng AutomationGrant',
    )

    const poolResume = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'paused', version: 1 })] }
      }
      return { rows: [] }
    })
    await expect(resumeAutomationGrant(poolResume, PERSON, GRANT_ID, 1)).rejects.toThrow(
      'Không thể kích hoạt lại AutomationGrant',
    )

    const poolRevoke = mockPool(async (sql) => {
      if (sql.includes('for update')) {
        return { rows: [grantRow({ status: 'active', version: 1 })] }
      }
      return { rows: [] }
    })
    await expect(revokeAutomationGrant(poolRevoke, PERSON, GRANT_ID, 1)).rejects.toThrow(
      'Không thể thu hồi AutomationGrant',
    )
  })
})

describe('automationService - executeAutomatedAction', () => {
  it('returns existing receipt when idempotencyKey matches', async () => {
    const pool = mockPool(async (sql) => {
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [receiptRow()] }
      }
      return { rows: [] }
    })

    const result = await executeAutomatedAction(pool, {
      personId: PERSON,
      grantId: GRANT_ID,
      idempotencyKey: 'idem-key-123',
      triggerSource: 'schedule:cron',
      inputPayload: { goal: 'IELTS 8.0' },
    })

    expect(result.deduplicated).toBe(true)
    expect(result.receipt.idempotencyKey).toBe('idem-key-123')
  })

  it('throws ForbiddenError when grant is paused or revoked', async () => {
    const pool = mockPool(async (sql) => {
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return { rows: [grantRow({ status: 'paused' })] }
      }
      return { rows: [] }
    })

    await expect(
      executeAutomatedAction(pool, {
        personId: PERSON,
        grantId: GRANT_ID,
        idempotencyKey: 'new-key-1',
        triggerSource: 'manual',
        inputPayload: { goal: 'IELTS 8.0' },
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError when expiresAt is in the past', async () => {
    const pool = mockPool(async (sql) => {
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return { rows: [grantRow({ expires_at: PAST })] }
      }
      return { rows: [] }
    })

    await expect(
      executeAutomatedAction(pool, {
        personId: PERSON,
        grantId: GRANT_ID,
        idempotencyKey: 'new-key-exp',
        triggerSource: 'manual',
        inputPayload: { goal: 'IELTS 8.0' },
      }),
    ).rejects.toThrow('AutomationGrant đã hết hạn')
  })

  it('throws ForbiddenError when reviewAt is in the past', async () => {
    const pool = mockPool(async (sql) => {
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return { rows: [grantRow({ review_at: PAST })] }
      }
      return { rows: [] }
    })

    await expect(
      executeAutomatedAction(pool, {
        personId: PERSON,
        grantId: GRANT_ID,
        idempotencyKey: 'new-key-2',
        triggerSource: 'manual',
        inputPayload: { goal: 'IELTS 8.0' },
      }),
    ).rejects.toThrow('AutomationGrant cần được xem xét lại')
  })

  it('throws ForbiddenError when personal policy is DENY', async () => {
    policies.resolveAuthority.mockResolvedValue('DENY')

    const pool = mockPool(async (sql) => {
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return { rows: [grantRow()] }
      }
      return { rows: [] }
    })

    await expect(
      executeAutomatedAction(pool, {
        personId: PERSON,
        grantId: GRANT_ID,
        idempotencyKey: 'new-key-3',
        triggerSource: 'manual',
        inputPayload: { goal: 'IELTS 8.0' },
      }),
    ).rejects.toThrow('Hành động tự động bị từ chối bởi Personal Policy (DENY)')
  })

  it('enforces hourly, daily and cooldown rate limits', async () => {
    const pool = mockPool(async (sql) => {
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return {
          rows: [
            grantRow({
              budget_config: { maxRunsPerHour: 2, maxRunsPerDay: 10, cooldownSeconds: 60 },
            }),
          ],
        }
      }
      if (sql.includes('filter (where created_at >')) {
        return {
          rows: [
            {
              runs_last_hour: '2',
              runs_last_day: '2',
              last_run_seconds_ago: '10',
            },
          ],
        }
      }
      return { rows: [] }
    })

    await expect(
      executeAutomatedAction(pool, {
        personId: PERSON,
        grantId: GRANT_ID,
        idempotencyKey: 'new-key-4',
        triggerSource: 'manual',
        inputPayload: { goal: 'IELTS 8.0' },
      }),
    ).rejects.toThrow(RateLimitError)

    // Daily limit test
    const poolDaily = mockPool(async (sql) => {
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return {
          rows: [
            grantRow({
              budget_config: { maxRunsPerHour: 10, maxRunsPerDay: 2, cooldownSeconds: 0 },
            }),
          ],
        }
      }
      if (sql.includes('filter (where created_at >')) {
        return {
          rows: [
            {
              runs_last_hour: '1',
              runs_last_day: '2',
              last_run_seconds_ago: '100',
            },
          ],
        }
      }
      return { rows: [] }
    })

    await expect(
      executeAutomatedAction(poolDaily, {
        personId: PERSON,
        grantId: GRANT_ID,
        idempotencyKey: 'new-key-daily',
        triggerSource: 'manual',
        inputPayload: { goal: 'IELTS 8.0' },
      }),
    ).rejects.toThrow('Vượt quá giới hạn số lần chạy mỗi ngày')
  })

  it('executes successfully and records action receipt', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('insert into personal.action_receipts')) {
        return { rows: [receiptRow({ idempotency_key: 'new-key-success' })] }
      }
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return { rows: [grantRow()] }
      }
      if (sql.includes('filter (where created_at >')) {
        return {
          rows: [
            {
              runs_last_hour: '0',
              runs_last_day: '0',
              last_run_seconds_ago: '120',
            },
          ],
        }
      }
      return { rows: [] }
    })

    const res = await executeAutomatedAction(pool, {
      personId: PERSON,
      grantId: GRANT_ID,
      idempotencyKey: 'new-key-success',
      triggerSource: 'schedule:cron',
      inputPayload: { goal: 'IELTS 8.0' },
    })

    expect(res.deduplicated).toBe(false)
    expect(res.receipt.status).toBe('success')
  })

  it('handles execution failure: compensation configured but NOT faked as reverted', async () => {
    let insertParams: unknown[] = []
    const pool = mockPool(async (sql, params) => {
      if (sql.includes('insert into personal.action_receipts')) {
        insertParams = params ?? []
        return {
          rows: [
            receiptRow({
              status: 'failed',
              error_message: 'Remote error',
              compensation_result: { reverted: false, reason: 'not_implemented' },
            }),
          ],
        }
      }
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return {
          rows: [
            grantRow({
              compensation_config: { toolId: 'learning.update_goal' },
            }),
          ],
        }
      }
      if (sql.includes('filter (where created_at >')) {
        return {
          rows: [
            {
              runs_last_hour: '0',
              runs_last_day: '0',
              last_run_seconds_ago: null,
            },
          ],
        }
      }
      return { rows: [] }
    })

    const res = await executeAutomatedAction(pool, {
      personId: PERSON,
      grantId: GRANT_ID,
      idempotencyKey: 'fail-key-1',
      triggerSource: 'schedule:cron',
      inputPayload: { goal: 'IELTS 8.0' },
      maxRetries: 1,
      executor: async () => {
        throw new Error('Remote error')
      },
    })

    expect(res.receipt.status).toBe('failed')
    // Biên nhận bất biến không được ghi "đã hoàn tác" khi chưa có executor bù trừ thật.
    expect(insertParams[9]).toBe('failed')
    expect(JSON.parse(String(insertParams[13]))).toEqual({
      compensatedTool: 'learning.update_goal',
      reverted: false,
      reason: 'not_implemented',
    })
  })

  it('handles execution failure without compensation', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('insert into personal.action_receipts')) {
        return {
          rows: [
            receiptRow({
              status: 'failed',
              error_message: 'Remote error',
            }),
          ],
        }
      }
      if (
        sql.includes('select') &&
        sql.includes('personal.action_receipts') &&
        sql.includes('idempotency_key')
      ) {
        return { rows: [] }
      }
      if (sql.includes('personal.automation_grants')) {
        return { rows: [grantRow()] }
      }
      if (sql.includes('filter (where created_at >')) {
        return {
          rows: [
            {
              runs_last_hour: '0',
              runs_last_day: '0',
              last_run_seconds_ago: null,
            },
          ],
        }
      }
      return { rows: [] }
    })

    const res = await executeAutomatedAction(pool, {
      personId: PERSON,
      grantId: GRANT_ID,
      idempotencyKey: 'fail-key-2',
      triggerSource: 'schedule:cron',
      inputPayload: { goal: 'IELTS 8.0' },
      maxRetries: 1,
      executor: async () => {
        throw 'String error'
      },
    })

    expect(res.receipt.status).toBe('failed')
  })
})

describe('automationService - queries', () => {
  it('lists grants and receipts with options', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('from personal.automation_grants')) {
        return { rows: [grantRow()] }
      }
      if (sql.includes('from personal.action_receipts')) {
        return { rows: [receiptRow()] }
      }
      return { rows: [] }
    })

    const grants = await listAutomationGrants(pool, PERSON, { status: 'active', limit: 10 })
    expect(grants.length).toBe(1)

    const allGrants = await listAutomationGrants(pool, PERSON)
    expect(allGrants.length).toBe(1)

    const receipts = await listActionReceipts(pool, PERSON, { grantId: GRANT_ID, limit: 10 })
    expect(receipts.length).toBe(1)

    const allReceipts = await listActionReceipts(pool, PERSON)
    expect(allReceipts.length).toBe(1)
  })

  it('gets grant and receipt by id or throws NotFoundError', async () => {
    const pool = mockPool(async (sql) => {
      if (sql.includes('from personal.automation_grants')) {
        return { rows: [grantRow()] }
      }
      if (sql.includes('from personal.action_receipts')) {
        return { rows: [receiptRow()] }
      }
      return { rows: [] }
    })

    const grant = await getAutomationGrant(pool, PERSON, GRANT_ID)
    expect(grant.id).toBe(GRANT_ID)

    const receipt = await getActionReceipt(pool, PERSON, RECEIPT_ID)
    expect(receipt.id).toBe(RECEIPT_ID)

    const emptyPool = mockPool(async () => ({ rows: [] }))
    await expect(getAutomationGrant(emptyPool, PERSON, GRANT_ID)).rejects.toThrow(NotFoundError)
    await expect(getActionReceipt(emptyPool, PERSON, RECEIPT_ID)).rejects.toThrow(NotFoundError)
  })
})

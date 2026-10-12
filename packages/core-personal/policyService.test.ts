// Test policyService — PersonalPolicy (V2-04 slice 1). Mock Pool bằng tay, cùng khuôn
// personService.test.ts: kiểm append-only (revoke bản cũ + insert bản mới), 409 khi thu hồi lại,
// và `resolveAuthority` trả null khi chưa có policy (KHÔNG tự bịa mức mặc định).

import { describe, it, expect, vi } from 'vitest'
import type { Pool } from 'pg'
import { setPolicy, listPolicies, revokePolicy, resolveAuthority } from './policyService.js'
import { ConflictError, NotFoundError } from '@dhcb/core-errors/appError'

const NOW = new Date('2026-08-16T00:00:00.000Z')
const REVIEW_AT = new Date('2026-11-16T00:00:00.000Z')
const PERSON_ID = '11111111-1111-4111-8111-111111111111'
const POLICY_ID = '33333333-3333-4333-8333-333333333333'
const NEW_POLICY_ID = '44444444-4444-4444-8444-444444444444'

interface PolicyRowLike {
  id: string
  person_id: string
  subject: string
  action: string
  resource_scope: string
  authority: string
  purpose: string
  created_at: Date
  review_at: Date | null
  revoked_at: Date | null
}

function policyRow(over: Partial<PolicyRowLike> = {}): PolicyRowLike {
  return {
    id: POLICY_ID,
    person_id: PERSON_ID,
    subject: 'calendar',
    action: 'create_event',
    resource_scope: 'personal_calendar',
    authority: 'SUGGEST',
    purpose: 'trợ lý sắp lịch học',
    created_at: NOW,
    review_at: null,
    revoked_at: null,
    ...over,
  }
}

function mockPool(handler: (sql: string, params: unknown[]) => unknown[]) {
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    const trimmed = sql.trim().toLowerCase()
    if (trimmed === 'begin' || trimmed === 'commit' || trimmed === 'rollback') return { rows: [] }
    return { rows: handler(sql, params) }
  })
  const client = { query, release: vi.fn() }
  const pool = { query, connect: vi.fn(async () => client) } as unknown as Pool
  return { pool, query }
}

const INPUT = {
  personId: PERSON_ID,
  subject: 'calendar',
  action: 'create_event',
  resourceScope: 'personal_calendar',
  authority: 'SUGGEST' as const,
  purpose: 'trợ lý sắp lịch học',
}

describe('setPolicy', () => {
  it('chưa có policy → insert bản đầu, không revoke gì', async () => {
    const { pool, query } = mockPool((sql) => (sql.includes('insert') ? [policyRow()] : []))
    const policy = await setPolicy(pool, INPUT)
    expect(policy.authority).toBe('SUGGEST')
    expect(policy.revokedAt).toBeUndefined()
    expect(query.mock.calls.some(([sql]) => String(sql).includes('set revoked_at = now()'))).toBe(
      false,
    )
  })

  it('đã có policy hiệu lực → revoke bản cũ + insert bản mới (APPEND, không update giá trị)', async () => {
    const { pool, query } = mockPool((sql) => {
      if (sql.includes('for update')) return [policyRow()]
      if (sql.includes('insert'))
        return [policyRow({ id: NEW_POLICY_ID, authority: 'WRITE_INTERNAL' })]
      return []
    })
    const policy = await setPolicy(pool, { ...INPUT, authority: 'WRITE_INTERNAL' })
    expect(policy.id).toBe(NEW_POLICY_ID)
    expect(policy.authority).toBe('WRITE_INTERNAL')
    const revokeCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('set revoked_at = now()'),
    )
    expect(revokeCall?.[1]).toEqual([POLICY_ID])
    expect(query.mock.calls.some(([sql]) => String(sql).toLowerCase().includes('delete'))).toBe(
      false,
    )
  })

  it('AUTOMATE kèm reviewAt → ghi được, reviewAt truyền xuống DB', async () => {
    const { pool, query } = mockPool((sql) =>
      sql.includes('insert') ? [policyRow({ authority: 'AUTOMATE', review_at: REVIEW_AT })] : [],
    )
    const policy = await setPolicy(pool, {
      ...INPUT,
      authority: 'AUTOMATE',
      reviewAt: REVIEW_AT.toISOString(),
    })
    expect(policy.authority).toBe('AUTOMATE')
    expect(policy.reviewAt).toBe(REVIEW_AT.toISOString())
    const insertCall = query.mock.calls.find(([sql]) => String(sql).includes('insert'))
    expect(insertCall?.[1]?.[6]).toBe(REVIEW_AT.toISOString())
  })

  // Hồi quy (changelog 0625, đo trên Postgres thật bằng `eval:v2:permissions` ca perm-concurrent):
  // khi CHƯA có policy hiệu lực, `select … for update` không khoá được dòng nào → hai lần đặt đồng
  // thời cùng insert, chỉ mục duy nhất chặn một bên. Bên thua phải nhận 409 "thử lại", không phải
  // DatabaseError thô (thành 500 ở API).
  it('đụng chỉ mục duy nhất do đặt đồng thời → ConflictError, không lộ DatabaseError', async () => {
    const { pool } = mockPool((sql) => {
      if (sql.includes('insert')) {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), {
          code: '23505',
          constraint: 'idx_personal_policies_active',
        })
      }
      return []
    })
    await expect(setPolicy(pool, INPUT)).rejects.toBeInstanceOf(ConflictError)
  })

  it('lỗi CSDL khác khi insert → ném nguyên, không đổi thành 409', async () => {
    const { pool } = mockPool((sql) => {
      if (sql.includes('insert')) {
        throw Object.assign(new Error('violates check constraint'), { code: '23514' })
      }
      return []
    })
    await expect(setPolicy(pool, INPUT)).rejects.toThrow('violates check constraint')
    await expect(setPolicy(pool, INPUT)).rejects.not.toBeInstanceOf(ConflictError)
  })

  it('AUTOMATE thiếu reviewAt → contract Zod chặn khi parse hàng trả về (lưới cuối cùng)', async () => {
    const { pool } = mockPool((sql) =>
      sql.includes('insert') ? [policyRow({ authority: 'AUTOMATE', review_at: null })] : [],
    )
    await expect(setPolicy(pool, { ...INPUT, authority: 'AUTOMATE' })).rejects.toThrow()
  })
})

describe('listPolicies', () => {
  it('mặc định chỉ lấy bản chưa thu hồi', async () => {
    const { pool, query } = mockPool(() => [policyRow()])
    expect(await listPolicies(pool, PERSON_ID)).toHaveLength(1)
    expect(String(query.mock.calls[0]?.[0])).toContain('revoked_at is null')
  })

  it('includeHistory + lọc subject', async () => {
    const { pool, query } = mockPool(() => [
      policyRow({ revoked_at: NOW }),
      policyRow({ id: NEW_POLICY_ID }),
    ])
    const policies = await listPolicies(pool, PERSON_ID, {
      subject: 'calendar',
      includeHistory: true,
    })
    expect(policies).toHaveLength(2)
    expect(policies[0]?.revokedAt).toBe(NOW.toISOString())
    const [sql, params] = query.mock.calls[0] ?? []
    expect(String(sql)).not.toContain('revoked_at is null')
    expect(params).toEqual([PERSON_ID, 'calendar'])
  })
})

describe('revokePolicy', () => {
  it('thu hồi mềm, câu select lọc theo person_id', async () => {
    const { pool, query } = mockPool((sql) => (sql.includes('for update') ? [policyRow()] : []))
    await revokePolicy(pool, PERSON_ID, POLICY_ID)
    expect(query.mock.calls[1]?.[1]).toEqual([POLICY_ID, PERSON_ID])
    expect(query.mock.calls.some(([sql]) => String(sql).includes('set revoked_at = now()'))).toBe(
      true,
    )
    expect(
      query.mock.calls.some(([sql]) => String(sql).toLowerCase().includes('delete from')),
    ).toBe(false)
  })

  it('thu hồi lần 2 → ConflictError 409', async () => {
    const { pool } = mockPool((sql) =>
      sql.includes('for update') ? [policyRow({ revoked_at: NOW })] : [],
    )
    await expect(revokePolicy(pool, PERSON_ID, POLICY_ID)).rejects.toBeInstanceOf(ConflictError)
  })

  it('không tồn tại / của người khác → NotFoundError 404', async () => {
    const { pool } = mockPool(() => [])
    await expect(revokePolicy(pool, PERSON_ID, POLICY_ID)).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('resolveAuthority', () => {
  it('có policy hiệu lực → trả đúng mức thẩm quyền', async () => {
    const { pool, query } = mockPool(() => [{ authority: 'EXECUTE_WITH_CONFIRMATION' }])
    const level = await resolveAuthority(
      pool,
      PERSON_ID,
      'calendar',
      'create_event',
      'personal_calendar',
    )
    expect(level).toBe('EXECUTE_WITH_CONFIRMATION')
    expect(String(query.mock.calls[0]?.[0])).toContain('revoked_at is null')
    expect(query.mock.calls[0]?.[1]).toEqual([
      PERSON_ID,
      'calendar',
      'create_event',
      'personal_calendar',
    ])
  })

  it('chưa có policy nào → null (caller tự quyết mặc định, service KHÔNG bịa)', async () => {
    const { pool } = mockPool(() => [])
    expect(await resolveAuthority(pool, PERSON_ID, 'email', 'send', 'inbox')).toBeNull()
  })

  it('giá trị authority lạ trong DB → ném lỗi, không trả mức giả', async () => {
    const { pool } = mockPool(() => [{ authority: 'GOD_MODE' }])
    await expect(
      resolveAuthority(pool, PERSON_ID, 'calendar', 'create_event', 'personal_calendar'),
    ).rejects.toThrow()
  })
})

describe('policyService — nhánh biên', () => {
  it('insert policy không trả dòng nào → ConflictError "thử lại"', async () => {
    const { pool } = mockPool(() => [])
    await expect(setPolicy(pool, INPUT)).rejects.toThrow('Không ghi được policy')
  })
})

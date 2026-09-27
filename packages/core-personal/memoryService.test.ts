import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { ConflictError, ValidationError } from '@dhcb/core-errors/appError'
import {
  evaluateMemoryCandidate,
  ingestMemory,
  getMemoryRecord,
  listMemoryRecords,
  expireMemoryRecord,
  deleteMemoryRecord,
  purgeExpiredMemories,
} from './memoryService.js'

const NOW = new Date('2026-08-17T00:00:00Z')
const PERSON = '11111111-1111-4111-8111-111111111111'
const RECORD_ID = '22222222-2222-4222-8222-222222222222'

function memoryRow(over: Record<string, unknown> = {}) {
  return {
    id: RECORD_ID,
    person_id: PERSON,
    namespace: 'semantic',
    content: 'User prefers concise feedback',
    provenance: 'user_declared:profile_settings',
    sensitivity: 'personal',
    status: 'accepted',
    merged_from_id: null,
    version: 1,
    created_at: NOW,
    updated_at: NOW,
    retain_until: null,
    ...over,
  }
}

function mockPool(
  queryFn: (sql: string) => Promise<{ rows?: unknown[]; rowCount?: number }>,
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

describe('evaluateMemoryCandidate - Candidate Pipeline', () => {
  it('rejects candidate when content is empty or exceeds limit', async () => {
    const runner = { query: vi.fn() }
    const res1 = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'preference',
      content: '',
      provenance: 'chat',
      sensitivity: 'personal',
    })
    expect(res1.outcome).toBe('REJECT')

    const res2 = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'preference',
      content: 'a'.repeat(2001),
      provenance: 'chat',
      sensitivity: 'personal',
    })
    expect(res2.outcome).toBe('REJECT')

    const res3 = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'preference',
      content: 'Valid content',
      provenance: '',
      sensitivity: 'personal',
    })
    expect(res3.outcome).toBe('REJECT')

    const res4 = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'preference',
      content: 'Valid content',
      provenance: 'p'.repeat(201),
      sensitivity: 'personal',
    })
    expect(res4.outcome).toBe('REJECT')
  })

  it('rejects restricted sensitivity without user_declared provenance', async () => {
    const runner = { query: vi.fn() }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'Medical condition notes',
      provenance: 'inferred:conversation',
      sensitivity: 'restricted',
    })
    expect(res.outcome).toBe('REJECT')
    expect(res.reason).toContain('Restricted sensitivity requires explicit user_declared')
  })

  it('rejects candidate if confidence < 0.60', async () => {
    const runner = { query: vi.fn() }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'Likes listening to audiobooks',
      provenance: 'observed:chat',
      sensitivity: 'personal',
      confidence: 0.55,
    })
    expect(res.outcome).toBe('REJECT')
    expect(res.reason).toContain('below minimum threshold 0.60')
  })

  it('asks user confirmation if 0.60 <= confidence < 0.80', async () => {
    const runner = { query: vi.fn() }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'Likes listening to audiobooks',
      provenance: 'observed:chat',
      sensitivity: 'personal',
      confidence: 0.75,
    })
    expect(res.outcome).toBe('ASK_USER')
  })

  it('rejects exact duplicate memory in same namespace', async () => {
    const runner = {
      query: vi.fn().mockResolvedValue({
        rows: [memoryRow({ content: 'User prefers concise feedback' })],
      }),
    }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'User prefers concise feedback',
      provenance: 'user_declared',
      sensitivity: 'personal',
    })
    expect(res.outcome).toBe('REJECT')
    expect(res.reason).toContain('Duplicate memory')
  })

  it('recommends MERGE if candidate overlaps with existing record', async () => {
    const runner = {
      query: vi.fn().mockResolvedValue({
        rows: [memoryRow({ content: 'User prefers concise feedback' })],
      }),
    }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'User prefers concise feedback and bullet points',
      provenance: 'user_declared',
      sensitivity: 'personal',
    })
    expect(res.outcome).toBe('MERGE')
    expect(res.existingRecordId).toBe(RECORD_ID)
    expect(res.mergedContent).toBe('User prefers concise feedback and bullet points')
  })

  it('accepts candidate passing all checks', async () => {
    const runner = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'Learning English for IELTS exam in December',
      provenance: 'user_declared:onboarding',
      sensitivity: 'sensitive',
      confidence: 0.95,
    })
    expect(res.outcome).toBe('ACCEPT')
  })
})

describe('ingestMemory', () => {
  it('throws ValidationError if candidate rejected by pipeline', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(
      ingestMemory(pool, PERSON, {
        namespace: 'semantic',
        content: '',
        provenance: 'test',
        sensitivity: 'personal',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('inserts new memory on ACCEPT and logs audit record', async () => {
    const executedQueries: string[] = []
    const pool = mockPool(async (sql: string) => {
      executedQueries.push(sql)
      if (sql.includes('select')) {
        return { rows: [] }
      }
      if (sql.includes('insert into personal.memory_records')) {
        return { rows: [memoryRow({ content: 'New memory' })] }
      }
      return { rows: [] }
    })

    const { record, evaluation } = await ingestMemory(pool, PERSON, {
      namespace: 'semantic',
      content: 'New memory',
      provenance: 'user_declared',
      sensitivity: 'personal',
    })

    expect(evaluation.outcome).toBe('ACCEPT')
    expect(record.content).toBe('New memory')
    expect(
      executedQueries.some((q) => q.includes('insert into personal.memory_records_audit_log')),
    ).toBe(true)
  })

  it('merges memory on MERGE outcome', async () => {
    const pool = mockPool(async (sql: string) => {
      if (sql.includes('select')) {
        return { rows: [memoryRow({ content: 'User prefers concise feedback' })] }
      }
      if (sql.includes('update personal.memory_records')) {
        return {
          rows: [
            memoryRow({
              content: 'User prefers concise feedback and examples',
              status: 'merged',
              version: 2,
            }),
          ],
        }
      }
      return { rows: [] }
    })

    const { record, evaluation } = await ingestMemory(pool, PERSON, {
      namespace: 'semantic',
      content: 'User prefers concise feedback and examples',
      provenance: 'user_declared',
      sensitivity: 'personal',
    })

    expect(evaluation.outcome).toBe('MERGE')
    expect(record.status).toBe('merged')
  })

  it('merge nâng mức bảo vệ theo candidate và không hạ mức đang lưu trong cùng UPDATE', async () => {
    const pool = mockPool(async (sql: string) => {
      if (sql.includes('select')) return { rows: [memoryRow()] }
      if (sql.includes('update personal.memory_records')) {
        return { rows: [memoryRow({ sensitivity: 'sensitive', status: 'merged' })] }
      }
      return { rows: [] }
    })
    const { record } = await ingestMemory(pool, PERSON, {
      namespace: 'semantic',
      content: 'User prefers concise feedback about private health',
      provenance: 'user_declared',
      sensitivity: 'sensitive',
    })
    const client = await pool.connect()
    expect(client.query).toHaveBeenCalledWith(
      expect.stringMatching(/sensitivity = .*\[\s*greatest\(/s),
      ['User prefers concise feedback about private health', RECORD_ID, PERSON, 'sensitive'],
    )
    expect(record.sensitivity).toBe('sensitive')
  })
})

describe('getMemoryRecord and listMemoryRecords', () => {
  it('returns single record or null', async () => {
    const runner = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [memoryRow()] })
        .mockResolvedValueOnce({ rows: [] }),
    }

    const rec = await getMemoryRecord(runner, PERSON, RECORD_ID)
    expect(rec?.id).toBe(RECORD_ID)

    const notFound = await getMemoryRecord(runner, PERSON, '99999999-9999-4999-8999-999999999999')
    expect(notFound).toBeNull()
  })

  it('filters by namespace and active status', async () => {
    const runner = {
      query: vi.fn().mockResolvedValue({ rows: [memoryRow({ namespace: 'preference' })] }),
    }

    const list = await listMemoryRecords(runner, PERSON, { namespace: 'preference' })
    expect(list.length).toBe(1)
    expect(runner.query).toHaveBeenCalledWith(
      expect.stringContaining("status <> 'expired'"),
      expect.arrayContaining([PERSON, 'preference', 50]),
    )
  })
})

describe('expireMemoryRecord, deleteMemoryRecord, purgeExpiredMemories', () => {
  it('expires record with optimistic locking', async () => {
    const pool = mockPool(async (sql: string) => {
      if (sql.includes('select')) {
        return { rows: [memoryRow({ version: 1 })] }
      }
      if (sql.includes('update')) {
        return { rows: [memoryRow({ status: 'expired', version: 2 })] }
      }
      return { rows: [] }
    })

    const expired = await expireMemoryRecord(pool, PERSON, RECORD_ID, 1)
    expect(expired.status).toBe('expired')
  })

  it('throws ConflictError on version mismatch during expire', async () => {
    const pool = mockPool(async (sql: string) => {
      if (sql.includes('select')) {
        return { rows: [memoryRow({ version: 2 })] }
      }
      return { rows: [] }
    })

    await expect(expireMemoryRecord(pool, PERSON, RECORD_ID, 1)).rejects.toThrow(ConflictError)
  })

  it('deletes record for GDPR/privacy compliance', async () => {
    const pool = mockPool(async (sql: string) => {
      if (sql.includes('delete from personal.memory_records')) {
        return { rows: [memoryRow()] }
      }
      return { rows: [] }
    })

    await expect(deleteMemoryRecord(pool, PERSON, RECORD_ID)).resolves.not.toThrow()
  })

  it('purges retention-expired records', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rowCount: 5 }),
    } as unknown as Pool

    const purged = await purgeExpiredMemories(pool)
    expect(purged).toBe(5)
  })
})

// Nhánh biên: provenance rỗng/quá dài, retain_until, merge lấy bản dài hơn, insert/update rỗng, purge rowCount null.
describe('memoryService — nhánh biên', () => {
  it('từ chối khi provenance rỗng hoặc dài quá 200 ký tự', async () => {
    const runner = { query: vi.fn() }

    const empty = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'Nội dung hợp lệ',
      provenance: '   ',
      sensitivity: 'personal',
    })
    expect(empty.outcome).toBe('REJECT')
    expect(empty.reason).toContain('Provenance length')

    const tooLong = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'Nội dung hợp lệ',
      provenance: 'a'.repeat(201),
      sensitivity: 'personal',
    })
    expect(tooLong.outcome).toBe('REJECT')
    expect(tooLong.reason).toContain('Provenance length')

    // Chưa đụng tới DB vì bị chặn ngay ở bước kiểm tra đầu vào.
    expect(runner.query).not.toHaveBeenCalled()
  })

  it('từ chối nội dung dài quá 2000 ký tự', async () => {
    const runner = { query: vi.fn() }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'a'.repeat(2001),
      provenance: 'user_declared',
      sensitivity: 'personal',
    })
    expect(res.outcome).toBe('REJECT')
    expect(res.reason).toContain('Content length')
  })

  it('MERGE giữ nội dung DÀI HƠN khi bản cũ dài hơn bản mới', async () => {
    const runner = {
      query: vi.fn().mockResolvedValue({
        rows: [memoryRow({ content: 'User prefers concise feedback and bullet points' })],
      }),
    }
    const res = await evaluateMemoryCandidate(runner, PERSON, {
      namespace: 'semantic',
      content: 'concise feedback',
      provenance: 'user_declared',
      sensitivity: 'personal',
    })
    expect(res.outcome).toBe('MERGE')
    expect(res.mergedContent).toBe('User prefers concise feedback and bullet points')
  })

  it('bản ghi có retain_until → trả về retainUntil dạng ISO', async () => {
    const retain = new Date('2027-01-01T00:00:00Z')
    const pool = mockPool(async () => ({ rows: [memoryRow({ retain_until: retain })] }))
    const rec = await getMemoryRecord(pool, PERSON, RECORD_ID)
    expect(rec?.retainUntil).toBe(retain.toISOString())
  })

  it('ingestMemory truyền retainUntil → chuyển thành Date gửi xuống DB', async () => {
    let insertParams: unknown[] = []
    const handler = async (sql: string, params: unknown[] = []) => {
      if (sql.trim().toLowerCase().startsWith('select')) return { rows: [] }
      if (sql.includes('insert into personal.memory_records\n')) {
        insertParams = params
        return { rows: [memoryRow()] }
      }
      return { rows: [] }
    }
    const pool = mockPool(handler as unknown as (sql: string) => Promise<{ rows?: unknown[] }>)

    await ingestMemory(pool, PERSON, {
      namespace: 'semantic',
      content: 'Ghi nhớ có hạn giữ',
      provenance: 'user_declared:onboarding',
      sensitivity: 'personal',
      retainUntil: '2027-01-01T00:00:00.000Z',
    })

    expect(insertParams[5]).toBeInstanceOf(Date)
  })

  it('ACCEPT nhưng câu insert không trả dòng nào → ném lỗi', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(
      ingestMemory(pool, PERSON, {
        namespace: 'semantic',
        content: 'Ghi nhớ hợp lệ',
        provenance: 'user_declared:onboarding',
        sensitivity: 'personal',
      }),
    ).rejects.toThrow('Failed to insert memory record')
  })

  it('MERGE nhưng bản ghi đích đã biến mất → NotFoundError', async () => {
    const pool = mockPool(async (sql: string) => {
      if (sql.trim().toLowerCase().startsWith('select')) {
        return { rows: [memoryRow({ content: 'User prefers concise feedback' })] }
      }
      return { rows: [] }
    })

    await expect(
      ingestMemory(pool, PERSON, {
        namespace: 'semantic',
        content: 'User prefers concise feedback and bullet points',
        provenance: 'user_declared',
        sensitivity: 'personal',
      }),
    ).rejects.toThrow('Target memory record to merge was not found')
  })

  it('expireMemoryRecord: không tìm thấy bản ghi → NotFoundError', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(expireMemoryRecord(pool, PERSON, RECORD_ID, 1, 'user:1')).rejects.toThrow(
      'Memory record not found',
    )
  })

  it('expireMemoryRecord: câu update không trả dòng nào → NotFoundError', async () => {
    const pool = mockPool(async (sql: string) => {
      if (sql.trim().toLowerCase().startsWith('select')) return { rows: [memoryRow()] }
      return { rows: [] }
    })
    await expect(expireMemoryRecord(pool, PERSON, RECORD_ID, 1, 'user:1')).rejects.toThrow(
      'Memory record not found',
    )
  })

  it('deleteMemoryRecord: không xoá được dòng nào → NotFoundError', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    await expect(deleteMemoryRecord(pool, PERSON, RECORD_ID, 'user:1')).rejects.toThrow(
      'Memory record not found',
    )
  })

  it('purgeExpiredMemories trả 0 khi rowCount là null', async () => {
    const pool = mockPool(async () => ({ rowCount: null }) as unknown as { rows: unknown[] })
    expect(await purgeExpiredMemories(pool)).toBe(0)
  })
})

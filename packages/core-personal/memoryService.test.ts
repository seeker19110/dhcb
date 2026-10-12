import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { ConflictError, NotFoundError, ValidationError } from '@dhcb/core-errors/appError'
// Lớp embedding: mặc định trả null (không có key) để test không đụng mạng; từng ca bật lên qua
// `embedMock` để kiểm vector được ghi vào đúng tham số.
const embedMock = vi.hoisted(() => ({
  embedForStorage:
    vi.fn<(content: string) => Promise<{ vector: number[]; model: string } | null>>(),
}))
vi.mock('@dhcb/core-ai/embeddings', () => ({
  embedForStorage: (content: string) => embedMock.embedForStorage(content),
}))

import {
  evaluateMemoryCandidate,
  ingestMemory,
  getMemoryRecord,
  listMemoryRecords,
  expireMemoryRecord,
  deleteMemoryRecord,
  purgeExpiredMemories,
  updateMemoryContent,
  touchMemoryAccess,
  backfillMemoryEmbeddings,
  BACKFILL_EMBEDDING_BATCH,
  supersedeMemoryWithClient,
  invalidateMemoryWithClient,
} from './memoryService.js'
import type { PoolClient } from 'pg'

beforeEach(() => {
  embedMock.embedForStorage.mockReset()
  embedMock.embedForStorage.mockResolvedValue(null)
})

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
    // GĐ2a (0094)
    importance: 5,
    last_accessed_at: null,
    access_count: 0,
    valid_from: NOW,
    valid_to: null,
    superseded_by: null,
    source_message_id: null,
    has_embedding: false,
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
      // GĐ2a: thêm 2 tham số vector/model (null khi không có provider).
      [
        'User prefers concise feedback about private health',
        RECORD_ID,
        PERSON,
        'sensitive',
        null,
        null,
      ],
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

  it('v2: bản ghi trả version/importance/validFrom/hasEmbedding; last_accessed_at → ISO', async () => {
    const runner = {
      query: vi.fn().mockResolvedValue({
        rows: [
          memoryRow({ version: 3, importance: 8, last_accessed_at: NOW, has_embedding: true }),
        ],
      }),
    }
    const rec = await getMemoryRecord(runner, PERSON, RECORD_ID)
    expect(rec).toMatchObject({
      version: 3,
      importance: 8,
      lastAccessedAt: NOW.toISOString(),
      validFrom: NOW.toISOString(),
      hasEmbedding: true,
    })
  })
})

describe('memoryService — GĐ2a: embedding lúc ghi, sửa nội dung, đánh dấu đã dùng, bù vector', () => {
  function recordingPool(
    onQuery?: (
      sql: string,
      params: unknown[],
    ) => { rows?: unknown[]; rowCount?: number } | undefined,
  ) {
    const calls: Array<{ sql: string; params: unknown[] }> = []
    const handler = async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params })
      const custom = onQuery?.(sql, params)
      if (custom) return custom
      if (sql.trim().toLowerCase().startsWith('select')) return { rows: [] }
      if (sql.includes('insert into personal.memory_records\n')) return { rows: [memoryRow()] }
      if (sql.includes('update personal.memory_records'))
        return { rows: [memoryRow({ version: 2 })] }
      return { rows: [] }
    }
    return {
      pool: mockPool(handler as unknown as (sql: string) => Promise<{ rows?: unknown[] }>),
      calls,
    }
  }

  it('ingest: vector + model đi vào đúng tham số; importance kẹp 1–10; sourceMessageId ghi theo', async () => {
    embedMock.embedForStorage.mockResolvedValue({ vector: [0.6, 0.8], model: 'gemini-embedding-2' })
    const { pool, calls } = recordingPool()
    await ingestMemory(pool, PERSON, {
      namespace: 'semantic',
      content: 'Mục tiêu IELTS 6.5',
      provenance: 'companion:conversation',
      sensitivity: 'personal',
      importance: 42,
      sourceMessageId: '55555555-5555-4555-8555-555555555555',
    })
    const insert = calls.find((c) => c.sql.includes('insert into personal.memory_records\n'))!
    expect(embedMock.embedForStorage).toHaveBeenCalledWith('Mục tiêu IELTS 6.5')
    expect(insert.params[6]).toBe(10) // importance kẹp về 10
    expect(insert.params[7]).toBe('55555555-5555-4555-8555-555555555555')
    expect(insert.params[8]).toEqual([0.6, 0.8])
    expect(insert.params[9]).toBe('gemini-embedding-2')
  })

  it('ingest: embedding trả null hoặc NÉM → vẫn lưu, vector null (bất biến: embedding không làm hỏng ghi)', async () => {
    const { pool, calls } = recordingPool()
    await ingestMemory(
      pool,
      PERSON,
      { namespace: 'semantic', content: 'Không có key', provenance: 'p', sensitivity: 'personal' },
      'system',
      {
        embed: async () => {
          throw new Error('Gemini sập')
        },
      },
    )
    const insert = calls.find((c) => c.sql.includes('insert into personal.memory_records\n'))!
    expect(insert.params[6]).toBe(5) // mặc định
    expect(insert.params[8]).toBeNull()
    expect(insert.params[9]).toBeNull()
  })

  it('MERGE: nội dung mới → tính lại vector và ghi vào câu update', async () => {
    embedMock.embedForStorage.mockResolvedValue({ vector: [1, 0], model: 'm' })
    const { pool, calls } = recordingPool((sql) =>
      sql.trim().toLowerCase().startsWith('select')
        ? { rows: [memoryRow({ content: 'Thích học buổi tối' })] }
        : undefined,
    )
    await ingestMemory(pool, PERSON, {
      namespace: 'semantic',
      content: 'Thích học buổi tối sau 20h',
      provenance: 'p',
      sensitivity: 'personal',
    })
    const update = calls.find((c) => c.sql.includes("status = 'merged'"))!
    expect(update.params[4]).toEqual([1, 0])
    expect(update.params[5]).toBe('m')
  })

  it('updateMemoryContent: khoá dòng, version khớp → update + audit UPDATE + vector mới', async () => {
    embedMock.embedForStorage.mockResolvedValue({ vector: [0, 1], model: 'm' })
    const { pool, calls } = recordingPool((sql) =>
      sql.includes('for update') ? { rows: [memoryRow({ version: 1, content: 'cũ' })] } : undefined,
    )
    const rec = await updateMemoryContent(pool, PERSON, RECORD_ID, '  mới  ', 1, 'user:u1')
    expect(rec.version).toBe(2)
    const update = calls.find((c) =>
      c.sql.includes('set content = $1, updated_at = now(), version = version + 1'),
    )!
    expect(update.params).toEqual(['mới', RECORD_ID, PERSON, [0, 1], 'm'])
    const audit = calls.find((c) => c.sql.includes('memory_records_audit_log'))!
    expect(audit.sql).toContain("'UPDATE'")
    expect(JSON.parse(String(audit.params[2]))).toEqual({
      previousContent: 'cũ',
      newContent: 'User prefers concise feedback',
    })
    expect(audit.params[3]).toBe('user:u1')
  })

  it('updateMemoryContent: version lệch → ConflictError; không có dòng → NotFoundError; đã quên → ValidationError; rỗng/quá dài → ValidationError', async () => {
    const { pool: p1 } = recordingPool((sql) =>
      sql.includes('for update') ? { rows: [memoryRow({ version: 2 })] } : undefined,
    )
    await expect(updateMemoryContent(p1, PERSON, RECORD_ID, 'x', 1)).rejects.toBeInstanceOf(
      ConflictError,
    )
    const { pool: p2 } = recordingPool()
    await expect(updateMemoryContent(p2, PERSON, RECORD_ID, 'x', 1)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    const { pool: p3 } = recordingPool((sql) =>
      sql.includes('for update') ? { rows: [memoryRow({ status: 'expired' })] } : undefined,
    )
    await expect(updateMemoryContent(p3, PERSON, RECORD_ID, 'x', 1)).rejects.toBeInstanceOf(
      ValidationError,
    )
    await expect(updateMemoryContent(p3, PERSON, RECORD_ID, '   ', 1)).rejects.toBeInstanceOf(
      ValidationError,
    )
    await expect(
      updateMemoryContent(p3, PERSON, RECORD_ID, 'a'.repeat(2001), 1),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('touchMemoryAccess: rỗng → không query; có id → một UPDATE lọc person_id + any(uuid[])', async () => {
    const runner = { query: vi.fn().mockResolvedValue({ rows: [] }) }
    await touchMemoryAccess(runner, PERSON, [])
    expect(runner.query).not.toHaveBeenCalled()
    await touchMemoryAccess(runner, PERSON, [RECORD_ID])
    expect(runner.query).toHaveBeenCalledTimes(1)
    const [sql, params] = runner.query.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('last_accessed_at = now(), access_count = access_count + 1')
    expect(sql).toContain('person_id = $1 and id = any($2::uuid[])')
    expect(params).toEqual([PERSON, [RECORD_ID]])
  })

  it('backfillMemoryEmbeddings: không provider → 0; có → gửi theo lô, chỉ update dòng embed được', async () => {
    const pool = mockPool(async () => ({ rows: [] }))
    expect(await backfillMemoryEmbeddings(pool, null)).toBe(0)

    const n = BACKFILL_EMBEDDING_BATCH + 1
    const pending = Array.from({ length: n }, (_, i) => ({ id: `id-${i}`, content: `ký ức ${i}` }))
    const updates: unknown[][] = []
    const pool2 = mockPool((async (sql: string, params: unknown[] = []) => {
      if (sql.includes('where embedding is null and')) return { rows: pending }
      if (sql.includes('set embedding = $2::real[]')) {
        updates.push(params)
        return { rows: [], rowCount: 1 }
      }
      return { rows: [] }
    }) as unknown as (sql: string) => Promise<{ rows?: unknown[] }>)
    const provider = {
      model: 'gemini-embedding-2',
      embed: vi.fn(async (texts: string[]) => texts.map((t, i) => (i === 0 ? null : [t.length]))),
    }
    const done = await backfillMemoryEmbeddings(pool2, provider, 500)
    expect(provider.embed).toHaveBeenCalledTimes(2) // 21 dòng → lô 20 + lô 1
    expect(provider.embed.mock.calls[0]![0]).toHaveLength(BACKFILL_EMBEDDING_BATCH)
    // Phần tử đầu mỗi lô trả null → bỏ qua: 21 − 2 = 19 dòng cập nhật.
    expect(done).toBe(n - 2)
    expect(updates).toHaveLength(n - 2)
    expect(updates[0]![2]).toBe('gemini-embedding-2')
  })
})

describe('memoryService — GĐ2b: thay và vô hiệu ký ức (không xoá)', () => {
  const NEW_ID = '33333333-3333-4333-8333-333333333333'

  function clientWith(lockRow: Record<string, unknown> | null) {
    const calls: Array<{ sql: string; params: unknown[] }> = []
    const query = vi.fn(async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params })
      if (sql.includes('for update')) return { rows: lockRow ? [lockRow] : [] }
      if (sql.includes('insert into personal.memory_records\n'))
        return { rows: [memoryRow({ id: NEW_ID, content: params[2], importance: params[5] })] }
      if (sql.includes('set valid_to = now(), superseded_by'))
        return { rows: [memoryRow({ valid_to: NOW, superseded_by: NEW_ID, version: 2 })] }
      if (sql.includes('set valid_to = now(), updated_at'))
        return { rows: [memoryRow({ valid_to: NOW, version: 2 })] }
      return { rows: [] }
    })
    return { client: { query } as unknown as PoolClient, calls }
  }

  it('supersede: bản mới giữ namespace + độ nhạy bản cũ; bản cũ có valid_to + superseded_by; audit INSERT + UPDATE', async () => {
    embedMock.embedForStorage.mockResolvedValue({ vector: [0.1, 0.2], model: 'm' })
    const { client, calls } = clientWith(
      memoryRow({ namespace: 'preference', sensitivity: 'sensitive', importance: 6 }),
    )
    const out = await supersedeMemoryWithClient(
      client,
      PERSON,
      {
        recordId: RECORD_ID,
        expectedVersion: 1,
        content: '  Nhắm IELTS 7.0  ',
        provenance: 'companion:reflection',
      },
      'user:1',
    )
    expect(out.record.id).toBe(NEW_ID)
    expect(out.record.content).toBe('Nhắm IELTS 7.0')
    expect(out.previous.validTo).toBe(NOW.toISOString())
    expect(out.previous.supersededBy).toBe(NEW_ID)
    const insert = calls.find((c) => c.sql.includes('insert into personal.memory_records\n'))!
    expect(insert.params.slice(0, 6)).toEqual([
      PERSON,
      'preference',
      'Nhắm IELTS 7.0',
      'companion:reflection',
      'sensitive',
      6, // không truyền importance → giữ của bản cũ
    ])
    expect(insert.params[7]).toEqual([0.1, 0.2])
    const audit = calls.find((c) => c.sql.includes('memory_records_audit_log'))!
    expect(audit.sql).toContain("'INSERT'")
    expect(audit.sql).toContain("'UPDATE'")
    expect(calls.some((c) => c.sql.includes('delete from'))).toBe(false)
  })

  it('supersede: importance truyền vào được kẹp 1–10; sourceMessageId ghi vào bản mới', async () => {
    const { client, calls } = clientWith(memoryRow())
    await supersedeMemoryWithClient(client, PERSON, {
      recordId: RECORD_ID,
      expectedVersion: 1,
      content: 'x',
      provenance: 'p',
      importance: 99,
      sourceMessageId: NEW_ID,
    })
    const insert = calls.find((c) => c.sql.includes('insert into personal.memory_records\n'))!
    expect(insert.params[5]).toBe(10)
    expect(insert.params[6]).toBe(NEW_ID)
  })

  it('supersede: nội dung rỗng/quá dài → ValidationError trước khi khoá dòng', async () => {
    const { client, calls } = clientWith(memoryRow())
    for (const content of ['   ', 'a'.repeat(2001)]) {
      await expect(
        supersedeMemoryWithClient(client, PERSON, {
          recordId: RECORD_ID,
          expectedVersion: 1,
          content,
          provenance: 'p',
        }),
      ).rejects.toThrow(ValidationError)
    }
    expect(calls).toHaveLength(0)
  })

  it('bản gốc không tồn tại → 404; đã quên / đã bị thay / lệch version → 409', async () => {
    const input = { recordId: RECORD_ID, expectedVersion: 1, content: 'x', provenance: 'p' }
    await expect(supersedeMemoryWithClient(clientWith(null).client, PERSON, input)).rejects.toThrow(
      NotFoundError,
    )
    for (const lock of [
      memoryRow({ status: 'expired' }),
      memoryRow({ valid_to: NOW }),
      memoryRow({ version: 3 }),
    ]) {
      await expect(
        supersedeMemoryWithClient(clientWith(lock).client, PERSON, input),
      ).rejects.toThrow(ConflictError)
      await expect(
        invalidateMemoryWithClient(clientWith(lock).client, PERSON, RECORD_ID, 1),
      ).rejects.toThrow(ConflictError)
    }
  })

  it('invalidate: đặt valid_to, giữ status, audit UPDATE có lý do cắt ≤ 300 ký tự', async () => {
    const { client, calls } = clientWith(memoryRow())
    const out = await invalidateMemoryWithClient(
      client,
      PERSON,
      RECORD_ID,
      1,
      'user:1',
      'r'.repeat(500),
    )
    expect(out.validTo).toBe(NOW.toISOString())
    expect(out.status).toBe('accepted')
    const audit = calls.find((c) => c.sql.includes('memory_records_audit_log'))!
    expect(audit.sql).toContain("'UPDATE'")
    const changes = JSON.parse(audit.params[2] as string) as {
      invalidated: boolean
      reason: string
    }
    expect(changes.invalidated).toBe(true)
    expect(changes.reason).toHaveLength(300)
  })
})

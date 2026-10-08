// packages/core-personal/personErasureService.test.ts — V2-19 Privacy Drills (unit, mock pg).
//
// Mock `pg` KHÔNG bắt được lỗi sai tên cột (lỗi gốc của changelog 0527) — phần đó do
// `personErasureService.integration.test.ts` canh trên Postgres thật. Ở đây canh LOGIC:
// transaction, thứ tự xoá, không nuốt lỗi, đếm bản ghi, nhật ký xoá.

import { describe, it, expect, vi } from 'vitest'
import { exportPersonData, erasePersonData, PERSON_TABLES } from './personErasureService.js'
import { NotFoundError } from '@dhcb/core-errors/appError'

const PERSON_ID = '00000000-0000-0000-0000-000000000001'

type QueryResult = { rows: unknown[]; rowCount: number | null }
type Responder = (sql: string, params?: unknown[]) => Promise<QueryResult> | QueryResult

/** Pool giả: mọi câu đi qua client trong transaction; ghi lại thứ tự câu lệnh. */
function makePool(respond: Responder) {
  const calls: { sql: string; params?: unknown[] }[] = []
  const client = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      calls.push({ sql: sql.replace(/\s+/g, ' ').trim().toLowerCase(), params })
      return respond(sql.toLowerCase(), params)
    }),
    release: vi.fn(),
  }
  const pool = {
    query: vi.fn(() => Promise.reject(new Error('không được gọi pool.query ngoài transaction'))),
    connect: vi.fn().mockResolvedValue(client),
  }
  return { pool, client, calls }
}

const empty: QueryResult = { rows: [], rowCount: 0 }

function personRow() {
  return {
    id: PERSON_ID,
    user_id: 'u1',
    display_name: 'Test',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  }
}

describe('PERSON_TABLES', () => {
  it('mỗi bảng và mỗi khoá xuất là duy nhất', () => {
    const tables = PERSON_TABLES.map((s) => s.table)
    const keys = PERSON_TABLES.map((s) => s.exportKey)
    expect(new Set(tables).size).toBe(tables.length)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('không còn tham chiếu 5 cột không tồn tại (lỗi gốc 0527)', () => {
    const cols = PERSON_TABLES.flatMap((s) => [...s.columns, s.orderBy])
    for (const bad of ['node_type', 'source_node_id', 'target_node_id', 'edge_type', 'decided_at'])
      expect(cols.join(' ')).not.toContain(bad)
    const receipts = PERSON_TABLES.find((s) => s.table === 'personal.action_receipts')
    expect(receipts?.columns).not.toContain('executed_at')
    const decisions = PERSON_TABLES.find((s) => s.table === 'personal.decision_records')
    expect(decisions?.columns).not.toContain('title')
  })

  it('thứ tự xoá: bảng con đứng trước bảng cha (khoá ngoại không cascade)', () => {
    const idx = (t: string) => PERSON_TABLES.findIndex((s) => s.table === t)
    expect(idx('personal.life_graph_edges')).toBeLessThan(idx('personal.life_graph_nodes'))
    expect(idx('personal.life_goals')).toBeLessThan(idx('personal.life_graph_nodes'))
    expect(idx('personal.tool_execution_audit_log')).toBeLessThan(idx('personal.proposed_actions'))
    expect(idx('personal.action_receipts')).toBeLessThan(idx('personal.automation_grants'))
    expect(idx('worklife.tasks')).toBeLessThan(idx('worklife.projects'))
    expect(idx('worklife.documents')).toBeLessThan(idx('worklife.projects'))
  })
})

describe('exportPersonData', () => {
  it('đọc trong MỘT transaction repeatable read + read only, rồi commit', async () => {
    const { pool, client, calls } = makePool(() => empty)
    await exportPersonData(pool as never, PERSON_ID)
    expect(calls[0]?.sql).toBe('begin')
    expect(calls[1]?.sql).toBe('set transaction isolation level repeatable read, read only')
    expect(calls.at(-1)?.sql).toBe('commit')
    expect(client.release).toHaveBeenCalledOnce()
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('trả đủ mọi khoá xuất, mỗi câu lọc theo đúng personId', async () => {
    const { pool, calls } = makePool((sql) => {
      if (sql.includes('from personal.persons')) return { rows: [personRow()], rowCount: 1 }
      if (sql.includes('from personal.memory_records '))
        return { rows: [{ id: 'm1', content: 'test' }], rowCount: 1 }
      return empty
    })
    const result = await exportPersonData(pool as never, PERSON_ID)

    expect(result.personId).toBe(PERSON_ID)
    expect(result.person?.id).toBe(PERSON_ID)
    for (const spec of PERSON_TABLES) expect(Array.isArray(result[spec.exportKey])).toBe(true)
    expect(result.memories).toEqual([{ id: 'm1', content: 'test' }])
    // Mọi câu select (trừ SET/BEGIN/COMMIT) nhận đúng personId làm $1.
    const selects = calls.filter((c) => c.sql.startsWith('select'))
    expect(selects).toHaveLength(PERSON_TABLES.length + 1)
    for (const c of selects) expect(c.params).toEqual([PERSON_ID])
    expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt)
  })

  it('không có Person → person = null, các mảng rỗng', async () => {
    const { pool } = makePool(() => empty)
    const result = await exportPersonData(pool as never, PERSON_ID)
    expect(result.person).toBeNull()
    expect(result.personalFacts).toEqual([])
  })

  it('một bảng lỗi → NÉM lỗi + rollback (không trả bản xuất thiếu dữ liệu)', async () => {
    const { pool, calls } = makePool((sql) => {
      if (sql.includes('from personal.decision_records'))
        throw new Error('column "title" does not exist')
      return empty
    })
    await expect(exportPersonData(pool as never, PERSON_ID)).rejects.toThrow('does not exist')
    expect(calls.at(-1)?.sql).toBe('rollback')
  })

  it('bảng miền worklife lỗi cũng NÉM lỗi (đã bỏ nhánh best-effort nuốt lỗi)', async () => {
    const { pool } = makePool((sql) => {
      if (sql.includes('worklife.')) throw new Error('relation does not exist')
      return empty
    })
    await expect(exportPersonData(pool as never, PERSON_ID)).rejects.toThrow()
  })
})

describe('erasePersonData', () => {
  function erasePool(opts: { exists?: boolean; failOn?: string; logRow?: boolean } = {}) {
    const { exists = true, failOn, logRow = true } = opts
    return makePool((sql) => {
      if (sql.includes('for update'))
        return exists ? { rows: [{ id: PERSON_ID }], rowCount: 1 } : empty
      if (failOn && sql.includes(failOn)) throw new Error('DB error')
      if (sql.includes('person_erasure_log'))
        return logRow ? { rows: [{ id: 'erasure-log-1' }], rowCount: 1 } : empty
      if (sql.startsWith('delete')) return { rows: [], rowCount: 2 }
      return empty
    })
  }

  it('Person không tồn tại → NotFoundError, rollback, không xoá gì', async () => {
    const { pool, calls } = erasePool({ exists: false })
    await expect(erasePersonData(pool as never, PERSON_ID, 'self')).rejects.toThrow(NotFoundError)
    expect(calls.some((c) => c.sql.startsWith('delete'))).toBe(false)
    expect(calls.at(-1)?.sql).toBe('rollback')
  })

  it('khoá dòng Person, xoá mọi bảng theo đúng thứ tự, persons cuối cùng, rồi ghi nhật ký', async () => {
    const { pool, calls } = erasePool()
    const result = await erasePersonData(pool as never, PERSON_ID, 'self')

    expect(calls[1]?.sql).toContain('for update')
    const deletes = calls.filter((c) => c.sql.startsWith('delete'))
    expect(deletes.map((c) => c.sql)).toEqual([
      ...PERSON_TABLES.map((s) => `delete from ${s.table} where person_id = $1`),
      'delete from personal.persons where id = $1',
    ])
    for (const d of deletes) expect(d.params).toEqual([PERSON_ID])

    const expectedTables = [...PERSON_TABLES.map((s) => s.table), 'personal.persons']
    expect(result.schemasCleared).toEqual(expectedTables)
    expect(result.recordsDeletedCount).toBe(expectedTables.length * 2)
    expect(result.erasureLogId).toBe('erasure-log-1')

    const log = calls.find((c) => c.sql.includes('person_erasure_log'))
    expect(log?.params).toEqual([PERSON_ID, 'self', expectedTables, expectedTables.length * 2])
    expect(calls.at(-1)?.sql).toBe('commit')
  })

  it('ghi đúng erasedBy = "admin:<id>"', async () => {
    const { pool, calls } = erasePool()
    await erasePersonData(pool as never, PERSON_ID, 'admin:admin-123')
    const log = calls.find((c) => c.sql.includes('person_erasure_log'))
    expect(log?.params?.[1]).toBe('admin:admin-123')
  })

  it('một câu xoá lỗi (kể cả bảng worklife) → NÉM lỗi, rollback, không ghi nhật ký', async () => {
    for (const failOn of ['personal.life_graph_edges', 'worklife.projects']) {
      const { pool, calls } = erasePool({ failOn })
      await expect(erasePersonData(pool as never, PERSON_ID, 'self')).rejects.toThrow('DB error')
      expect(calls.some((c) => c.sql.includes('person_erasure_log'))).toBe(false)
      expect(calls.at(-1)?.sql).toBe('rollback')
    }
  })

  it('rowCount = null được tính là 0', async () => {
    const { pool } = makePool((sql) => {
      if (sql.includes('for update')) return { rows: [{ id: PERSON_ID }], rowCount: 1 }
      if (sql.includes('person_erasure_log')) return { rows: [{ id: 'log' }], rowCount: 1 }
      return { rows: [], rowCount: null }
    })
    const result = await erasePersonData(pool as never, PERSON_ID, 'self')
    expect(result.recordsDeletedCount).toBe(0)
  })

  it('không ghi được nhật ký xoá → NÉM lỗi + rollback (không báo xoá thành công khi thiếu vết)', async () => {
    const { pool, calls } = erasePool({ logRow: false })
    await expect(erasePersonData(pool as never, PERSON_ID, 'self')).rejects.toThrow('nhật ký')
    expect(calls.at(-1)?.sql).toBe('rollback')
  })
})

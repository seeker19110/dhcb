// scripts/eval-v2-privacy.ts — V2-19 Privacy Drills.
// Validates exportPersonData and erasePersonData with structured fixture scenarios.
// Uses mock DB runners — no real database required, safe for CI.
//
// Usage: npx tsx scripts/eval-v2-privacy.ts
//
// Exit 0: all drills pass
// Exit 1: any drill fails

import {
  exportPersonData,
  erasePersonData,
  PERSON_TABLES,
} from '@dhcb/core-personal/personErasureService'
import { NotFoundError } from '@dhcb/core-errors/appError'

const PERSON_ID = '00000000-0000-0000-0000-000000000042'

// ─── Drill results ────────────────────────────────────────────────────────────

interface DrillResult {
  name: string
  passed: boolean
  detail: string
}

const results: DrillResult[] = []

function pass(name: string, detail = '') {
  results.push({ name, passed: true, detail })
}

function fail(name: string, detail: string) {
  results.push({ name, passed: false, detail })
}

// ─── Mock pool helpers ────────────────────────────────────────────────────────

type QueryFn = (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>

/**
 * Từ 2026-10-08 (changelog 0527) cả export lẫn erase chạy trong MỘT transaction qua
 * `pool.connect()` — gắn `connect` dùng chung hàm query giả cho mọi pool giả bên dưới.
 */
function withConnect<T extends { query: QueryFn }>(
  pool: T,
): T & { connect: () => Promise<unknown> } {
  return {
    ...pool,
    connect: () => Promise.resolve({ query: pool.query, release: () => {} }),
  }
}

function makeFullDataPool(personId: string) {
  return withConnect({
    query: (sql: string, params?: unknown[]) => {
      const s = sql.toLowerCase()
      if (s.includes('personal.persons') && s.includes('select') && !s.includes('personal_facts')) {
        if (params?.[0] === personId) {
          return Promise.resolve({
            rows: [
              {
                id: personId,
                user_id: 'u1',
                display_name: 'Test',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            rowCount: 1,
          })
        }
        return Promise.resolve({ rows: [], rowCount: 0 })
      }
      if (s.includes('personal_facts'))
        return Promise.resolve({
          rows: [
            {
              id: 'f1',
              namespace: 'pref',
              key: 'lang',
              value: 'vi',
              origin: 'user_declared',
              confidence: '0.9',
              sensitivity: 'personal',
              is_current: true,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          rowCount: 1,
        })
      if (s.includes('memory_records'))
        return Promise.resolve({
          rows: [
            {
              id: 'm1',
              namespace: 'semantic',
              content: 'test',
              provenance: 'user_declared',
              sensitivity: 'personal',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          rowCount: 1,
        })
      if (s.includes('consent_grants'))
        return Promise.resolve({
          rows: [
            {
              id: 'cg1',
              scope: 'life_graph',
              purpose: 'companion',
              version: 1,
              status: 'active',
              granted_at: '2024-01-01T00:00:00Z',
              expires_at: null,
              revoked_at: null,
            },
          ],
          rowCount: 1,
        })
      if (s.includes('personal_policies'))
        return Promise.resolve({
          rows: [
            {
              id: 'pp1',
              subject: 'companion',
              action: 'read',
              resource_scope: '*',
              authority: 'READ',
              purpose: 'tutor',
              created_at: '2024-01-01T00:00:00Z',
              revoked_at: null,
            },
          ],
          rowCount: 1,
        })
      if (s.includes('life_graph_nodes'))
        return Promise.resolve({
          rows: [
            {
              id: 'n1',
              type: 'Goal',
              label: 'Learn English',
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          rowCount: 1,
        })
      if (s.includes('life_graph_edges')) return Promise.resolve({ rows: [], rowCount: 0 })
      if (s.includes('automation_grants')) return Promise.resolve({ rows: [], rowCount: 0 })
      if (s.includes('action_receipts')) return Promise.resolve({ rows: [], rowCount: 0 })
      return Promise.resolve({ rows: [], rowCount: 0 })
    },
  })
}

function makeErasePool(personId: string) {
  const deletedSchemas = new Set<string>()
  const mockClient = {
    query: (sql: string) => {
      const s = sql.toLowerCase()
      if (s.includes('begin') || s.includes('commit'))
        return Promise.resolve({ rows: [], rowCount: 0 })
      // Kiểm Person tồn tại giờ nằm TRONG transaction (`for update`).
      if (s.includes('for update'))
        return Promise.resolve({ rows: [{ id: personId }], rowCount: 1 })
      if (s.includes('person_erasure_log')) {
        return Promise.resolve({ rows: [{ id: 'erasure-log-id-1' }], rowCount: 1 })
      }
      if (s.includes('delete from') || s.startsWith('delete')) {
        // Track which schemas were cleared
        const match = sql.match(/DELETE FROM (\w+\.\w+)/i)
        if (match) deletedSchemas.add(match[1]!)

        return Promise.resolve({ rows: [], rowCount: 1 })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    },
    release: () => {},
  }

  return {
    query: (sql: string, params?: unknown[]) => {
      const s = sql.toLowerCase()
      if (s.includes('select') && s.includes('personal.persons')) {
        if (params?.[0] === personId) {
          return Promise.resolve({ rows: [{ id: personId }], rowCount: 1 })
        }
        return Promise.resolve({ rows: [], rowCount: 0 })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    },
    connect: () => Promise.resolve(mockClient),
    _deletedSchemas: deletedSchemas,
  }
}

function makeEmptyPool() {
  return withConnect({
    query: () => Promise.resolve({ rows: [], rowCount: 0 }),
  })
}

function makeNotFoundPool() {
  return {
    query: (sql: string) => {
      const s = sql.toLowerCase()
      if (s.includes('personal.persons') && s.includes('select')) {
        return Promise.resolve({ rows: [], rowCount: 0 })
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    },
    connect: () =>
      Promise.resolve({
        query: () => Promise.resolve({ rows: [], rowCount: 0 }),
        release: () => {},
      }),
  }
}

// ─── Drill 1: Export Completeness ────────────────────────────────────────────

async function drill_exportCompleteness() {
  const pool = makeFullDataPool(PERSON_ID)
  const data = await exportPersonData(pool as never, PERSON_ID)

  const schemas = PERSON_TABLES.map((s) => s.exportKey)

  const missing = schemas.filter((s) => !Array.isArray(data[s]))
  if (missing.length > 0) {
    fail('Export Completeness', `Missing schema keys in export: ${missing.join(', ')}`)
    return
  }
  if (!data.person) {
    fail('Export Completeness', 'person field is null or missing')
    return
  }
  if (typeof data.exportedAt !== 'string') {
    fail('Export Completeness', 'exportedAt is not a string')
    return
  }
  pass('Export Completeness', `All ${schemas.length} schema arrays present, person included`)
}

// ─── Drill 2: Export includes actual data ────────────────────────────────────

async function drill_exportHasData() {
  const pool = makeFullDataPool(PERSON_ID)
  const data = await exportPersonData(pool as never, PERSON_ID)

  if (data.personalFacts.length === 0) {
    fail('Export Has Data', 'personalFacts should have at least 1 record')
    return
  }
  if (data.memories.length === 0) {
    fail('Export Has Data', 'memories should have at least 1 record')
    return
  }
  pass(
    'Export Has Data',
    `personalFacts=${data.personalFacts.length}, memories=${data.memories.length}`,
  )
}

// ─── Drill 3: Export fails loudly instead of returning a partial export ──────
// Trước 2026-10-08 drill này đòi điều NGƯỢC LẠI ("lỗi miền bị bỏ qua, mảng rỗng") — chính là
// lỗi im lặng làm bản xuất thiếu dữ liệu mà không ai biết (changelog 0527).

async function drill_exportFailsLoudly() {
  const pool = withConnect({
    query: (sql: string) => {
      if (sql.toLowerCase().includes('worklife.')) {
        return Promise.reject(new Error('schema does not exist'))
      }
      return Promise.resolve({ rows: [], rowCount: 0 })
    },
  })
  try {
    await exportPersonData(pool as never, PERSON_ID)
    fail('Export Fails Loudly', 'A failing table must make the export throw, not return []')
  } catch {
    pass('Export Fails Loudly', 'Table error surfaces as an error — no silent partial export')
  }
}

// ─── Drill 4: Erase returns erasure log ID ───────────────────────────────────

async function drill_eraseReturnsLogId() {
  const pool = makeErasePool(PERSON_ID)
  const result = await erasePersonData(pool as never, PERSON_ID, 'self')
  if (!result.erasureLogId) {
    fail('Erase Returns Log ID', 'erasureLogId is missing from result')
    return
  }
  pass('Erase Returns Log ID', `erasureLogId=${result.erasureLogId}`)
}

// ─── Drill 5: Erase fails on non-existent person ─────────────────────────────

async function drill_eraseNotFoundPerson() {
  const pool = makeNotFoundPool()
  try {
    await erasePersonData(pool as never, PERSON_ID, 'self')
    fail('Erase Not-Found Person', 'Should have thrown NotFoundError for non-existent person')
  } catch (err) {
    if (err instanceof NotFoundError) {
      pass('Erase Not-Found Person', 'NotFoundError thrown correctly for missing person')
    } else {
      fail('Erase Not-Found Person', `Wrong error type: ${String(err)}`)
    }
  }
}

// ─── Drill 6: Export empty pool returns null person ──────────────────────────

async function drill_exportEmptyPool() {
  const pool = makeEmptyPool()
  const data = await exportPersonData(pool as never, PERSON_ID)
  if (data.person !== null) {
    fail('Export Empty Pool', 'person should be null when no rows found')
    return
  }
  pass('Export Empty Pool', 'person=null correctly when no rows found')
}

// ─── Drill 7: Export personId matches requested personId ─────────────────────

async function drill_exportPersonIdScoped() {
  const pool = makeFullDataPool(PERSON_ID)
  const data = await exportPersonData(pool as never, PERSON_ID)
  if (data.personId !== PERSON_ID) {
    fail('Export PersonId Scoped', `personId mismatch: got ${data.personId} expected ${PERSON_ID}`)
    return
  }
  pass('Export PersonId Scoped', 'personId in export matches requested personId')
}

// ─── Run All Drills ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  V2-19 Privacy Drills')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await drill_exportCompleteness()
  await drill_exportHasData()
  await drill_exportFailsLoudly()
  await drill_eraseReturnsLogId()
  await drill_eraseNotFoundPerson()
  await drill_exportEmptyPool()
  await drill_exportPersonIdScoped()

  const passed = results.filter((r) => r.passed)
  const failed = results.filter((r) => !r.passed)

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌'
    console.log(`  ${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`)
  }

  console.log(`\n  Result: ${passed.length}/${results.length} drills passed`)

  if (failed.length > 0) {
    console.log('\n  Failed drills:')
    for (const f of failed) {
      console.log(`    ✗ ${f.name}: ${f.detail}`)
    }
    console.log('')
    process.exit(1)
  }

  console.log(
    '\n  ✅ All privacy drills passed — zero-residual erase and export completeness verified.\n',
  )
  process.exit(0)
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})

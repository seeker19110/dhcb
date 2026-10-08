// Test TÍCH HỢP trên Postgres THẬT cho xuất/xoá dữ liệu cá nhân (changelog 0527).
//
// VÌ SAO PHẢI LÀ DB THẬT: lỗi gốc của đợt này là câu SQL đọc CỘT KHÔNG TỒN TẠI (`node_type`,
// `source_node_id`, `executed_at`, `title`, `decided_at`). Mock `pg` trả gì cũng được nên unit
// test xanh suốt trong khi endpoint luôn 500. Chỉ Postgres đã migrate mới bắt được loại lỗi này,
// cùng thứ tự xoá theo khoá ngoại không-cascade và việc "có bảng nào chứa person_id bị bỏ sót".
//
// Job `unit` của CI KHÔNG có service Postgres ⇒ test tự BỎ QUA khi thiếu `DATABASE_URL` (khuôn
// `apps/server/src/api/core/progress.concurrency.test.ts`). Chạy tay: tạo DB, `npm run migrate:pg`,
// rồi `DATABASE_URL=... npx vitest run packages/core-personal/personErasureService.integration.test.ts`.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from 'pg'
import { exportPersonData, erasePersonData, PERSON_TABLES } from './personErasureService.js'

const DATABASE_URL = process.env.DATABASE_URL

/** Tạo một người dùng + Person với ≥ 1 dòng ở MỌI bảng chứa person_id. */
async function seedPerson(pool: Pool, tag: string): Promise<{ userId: string; personId: string }> {
  const q = async (sql: string, params: unknown[]): Promise<string> => {
    const { rows } = await pool.query<{ id: string }>(sql, params)
    return rows[0]?.id ?? ''
  }
  const userId = await q(`insert into public.users (email) values ($1) returning id`, [
    `erase-0527-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  ])
  const p = await q(
    `insert into personal.persons (user_id, display_name) values ($1, $2) returning id`,
    [userId, `Người ${tag}`],
  )
  await q(
    `insert into personal.personal_facts (person_id, namespace, key, value, origin, confidence, source, sensitivity)
     values ($1, 'pref', 'lang', '"vi"', 'user_declared', 0.9, '{}', 'personal') returning id`,
    [p],
  )
  const mem = await q(
    `insert into personal.memory_records (person_id, namespace, content, provenance, sensitivity, status)
     values ($1, 'semantic', $2, 'user', 'personal', 'accepted') returning id`,
    [p, `ký ức ${tag}`],
  )
  await q(
    `insert into personal.memory_records_audit_log (record_id, person_id, action, changed_by)
     values ($1, $2, 'INSERT', 'self') returning id`,
    [mem, p],
  )
  await q(
    `insert into personal.consent_grants (person_id, scope, purpose) values ($1, 'life_graph', 'companion') returning id`,
    [p],
  )
  await q(
    `insert into personal.personal_policies (person_id, subject, action, resource_scope, authority, purpose)
     values ($1, 'companion', 'read', '*', 'READ', 'tutor') returning id`,
    [p],
  )
  const n1 = await q(
    `insert into personal.life_graph_nodes (person_id, type, label) values ($1, 'Goal', 'Học IELTS') returning id`,
    [p],
  )
  const n2 = await q(
    `insert into personal.life_graph_nodes (person_id, type, label) values ($1, 'Skill', 'Nghe') returning id`,
    [p],
  )
  await q(
    `insert into personal.life_graph_edges (person_id, from_node_id, to_node_id, relation, provenance)
     values ($1, $2, $3, 'requires', 'user') returning id`,
    [p, n1, n2],
  )
  await q(
    `insert into personal.life_graph_audit_log (person_id, entity_type, entity_id, action)
     values ($1, 'node', $2, 'create') returning id`,
    [p, n1],
  )
  const goal = await q(
    `insert into personal.life_goals (person_id, node_id, label) values ($1, $2, 'Học IELTS') returning id`,
    [p, n1],
  )
  await q(
    `insert into personal.life_goal_sources (goal_id, person_id, source_domain, source_type, source_id)
     values ($1, $2, 'learning', 'manual', 'x') returning goal_id as id`,
    [goal, p],
  )
  const grant = await q(
    `insert into personal.automation_grants (person_id, name, capability_id, action, target_domain,
       trigger_config, budget_config, review_at)
     values ($1, 'g', 'cap', 'act', 'work', '{}', '{}', now() + interval '30 days') returning id`,
    [p],
  )
  await q(
    `insert into personal.action_receipts (person_id, grant_id, capability_id, action, idempotency_key,
       trigger_source, input_payload, status, duration_ms)
     values ($1, $2, 'cap', 'act', $3, 'manual', '{}', 'success', 5) returning id`,
    [p, grant, `idem-${tag}-${Math.random()}`],
  )
  const proposed = await q(
    `insert into personal.proposed_actions (person_id, capability_id, action, target_domain, payload, risk_level, status)
     values ($1, 'cap', 'act', 'work', '{}', 'low', 'pending') returning id`,
    [p],
  )
  await q(
    `insert into personal.tool_execution_audit_log (person_id, tool_id, proposed_action_id, input_payload, status, duration_ms)
     values ($1, 'tool', $2, '{}', 'success', 3) returning id`,
    [p, proposed],
  )
  const decision = await q(
    `insert into personal.decision_records (id, person_id, problem, status)
     values (gen_random_uuid(), $1, 'Chọn trường', 'open') returning id`,
    [p],
  )
  await q(
    `insert into personal.decision_reviews_audit_log (decision_id, person_id, actor, action)
     values ($1, $2, 'self', 'create') returning id`,
    [decision, p],
  )
  await q(
    `insert into personal.companion_messages (person_id, role, content) values ($1, 'user', 'xin chào') returning id`,
    [p],
  )
  const project = await q(
    `insert into worklife.projects (id, person_id, name, status) values (gen_random_uuid(), $1, 'Dự án', 'active') returning id`,
    [p],
  )
  await q(
    `insert into worklife.tasks (id, person_id, project_id, title, priority, status)
     values (gen_random_uuid(), $1, $2, 'Việc', 'low', 'todo') returning id`,
    [p, project],
  )
  await q(
    `insert into worklife.meetings (id, person_id, title, scheduled_at)
     values (gen_random_uuid(), $1, 'Họp', now()) returning id`,
    [p],
  )
  await q(
    `insert into worklife.documents (id, person_id, project_id, title, document_type, summary)
     values (gen_random_uuid(), $1, $2, 'Tài liệu', 'note', 'tóm tắt') returning id`,
    [p, project],
  )
  return { userId, personId: p }
}

async function countRowsByTable(pool: Pool, personId: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  for (const spec of PERSON_TABLES) {
    const { rows } = await pool.query<{ n: string }>(
      `select count(*)::text as n from ${spec.table} where person_id = $1`,
      [personId],
    )
    out[spec.table] = Number(rows[0]?.n ?? 0)
  }
  return out
}

describe.skipIf(!DATABASE_URL)('xuất/xoá dữ liệu cá nhân (Postgres thật)', () => {
  let pool: Pool
  const createdUsers: string[] = []

  beforeAll(() => {
    pool = new Pool({ connectionString: DATABASE_URL })
  })

  afterAll(async () => {
    if (createdUsers.length)
      await pool.query('delete from public.users where id = any($1::uuid[])', [createdUsers])
    await pool.end()
  })

  it('danh sách PERSON_TABLES phủ ĐỦ mọi bảng có cột person_id trong schema thật', async () => {
    const { rows } = await pool.query<{ t: string }>(
      `select c.table_schema || '.' || c.table_name as t
         from information_schema.columns c
         join information_schema.tables tb
           on tb.table_schema = c.table_schema and tb.table_name = c.table_name
        where c.column_name = 'person_id' and tb.table_type = 'BASE TABLE'
          and c.table_schema not in ('pg_catalog', 'information_schema')`,
    )
    // Nhật ký xoá là vết kiểm toán của chính thao tác xoá — cố ý giữ lại.
    const inSchema = rows.map((r) => r.t).filter((t) => t !== 'platform.person_erasure_log')
    expect(PERSON_TABLES.map((s) => s.table).sort()).toEqual(inSchema.sort())
  })

  it('xuất đủ mọi bảng; xoá A sạch mọi bảng, dữ liệu B còn nguyên, có nhật ký xoá', async () => {
    const a = await seedPerson(pool, 'a')
    const b = await seedPerson(pool, 'b')
    createdUsers.push(a.userId, b.userId)

    const exported = await exportPersonData(pool, a.personId)
    expect(exported.person?.id).toBe(a.personId)
    for (const spec of PERSON_TABLES) {
      expect(exported[spec.exportKey].length, spec.table).toBeGreaterThanOrEqual(1)
    }
    // Không lẫn dữ liệu người khác.
    expect(exported.memories.map((m) => m.content)).toEqual(['ký ức a'])
    // Bản xuất phải tuần tự hoá được thành JSON (đúng thứ /api/persons trả ra).
    expect(() => JSON.stringify(exported)).not.toThrow()

    const beforeB = await countRowsByTable(pool, b.personId)
    const result = await erasePersonData(pool, a.personId, 'self')
    expect(result.recordsDeletedCount).toBeGreaterThanOrEqual(PERSON_TABLES.length + 1)
    expect(result.schemasCleared).toContain('personal.persons')

    const afterA = await countRowsByTable(pool, a.personId)
    expect(Object.values(afterA).every((n) => n === 0)).toBe(true)
    const personA = await pool.query('select 1 from personal.persons where id = $1', [a.personId])
    expect(personA.rowCount).toBe(0)

    expect(await countRowsByTable(pool, b.personId)).toEqual(beforeB)

    const log = await pool.query<{ erased_by: string; records_deleted_count: number }>(
      'select erased_by, records_deleted_count from platform.person_erasure_log where id = $1',
      [result.erasureLogId],
    )
    expect(log.rows[0]).toEqual({
      erased_by: 'self',
      records_deleted_count: result.recordsDeletedCount,
    })
  })
})

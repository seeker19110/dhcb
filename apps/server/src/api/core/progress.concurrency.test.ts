// Test TÍCH HỢP trên Postgres THẬT — AC-4 của slice S09-1:
// hai request đồng thời cùng một người học KHÔNG mất dữ liệu và version KHÔNG trùng.
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md AC-4.
//
// VÌ SAO PHẢI LÀ DB THẬT: thứ giữ đúng ở đây là `select … for update` + `version = version + 1`
// TRONG câu SQL. Mock `pg` không mô phỏng được row lock, nên một test mock sẽ xanh ngay cả khi
// ai đó bỏ mất `for update` — đúng loại lỗi im lặng mà AC-4 sinh ra để chặn.
//
// Job `unit` của CI KHÔNG có service Postgres (kiểm `.github/workflows/ci.yml`: không có khối
// `services`), nên test tự BỎ QUA khi thiếu `DATABASE_URL`. Bằng chứng chạy thật với DB local
// được dán vào mô tả PR + changelog.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { Pool, type PoolClient } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL

// Rào chắn tất định cho ca "lần đồng bộ ĐẦU TIÊN song song" (audit 2026-10-26, AUD-DATA-001):
// request nào đọc thấy CHƯA có dòng tiến độ thì chờ (tối đa 300 ms) để request kia cũng kịp đọc
// "rỗng". Mã cũ (chỉ `for update`) để cả hai cùng thấy rỗng ⇒ upsert sau đè upsert trước. Có khoá
// theo user thì request thứ hai bị chặn ở khoá, không đọc được gì cho tới khi request đầu commit.
const barrier = vi.hoisted(() => ({
  on: false,
  emptyReads: 0,
  release: null as null | (() => void),
}))
vi.mock('@dhcb/core-db/pgPool', async (importOriginal) => {
  const real = await importOriginal<typeof import('@dhcb/core-db/pgPool')>()
  const wrapped = new WeakSet<PoolClient>()
  const SELECT_FOR_UPDATE = /from english\.learning_progress where user_id = \$1 for update/
  return {
    ...real,
    getPgPool: () => {
      const pool = real.getPgPool()
      return new Proxy(pool, {
        get(target, prop, receiver) {
          if (prop !== 'connect') {
            // `pool.query()` của pg tự gọi `this.connect(callback)` — gắn `this` về pool thật để
            // nó không đi qua bản `connect` (chỉ hỗ trợ promise) bên dưới.
            const value: unknown = Reflect.get(target, prop, receiver)
            return typeof value === 'function' ? value.bind(target) : value
          }
          return async () => {
            const client = await target.connect()
            if (!wrapped.has(client)) {
              wrapped.add(client)
              const query = client.query.bind(client) as (...a: unknown[]) => Promise<{
                rows: unknown[]
              }>
              ;(client as unknown as { query: unknown }).query = async (...args: unknown[]) => {
                const result = await query(...args)
                const sql = typeof args[0] === 'string' ? args[0] : ''
                if (barrier.on && SELECT_FOR_UPDATE.test(sql) && result.rows.length === 0) {
                  barrier.emptyReads += 1
                  if (barrier.emptyReads === 1) {
                    await new Promise<void>((resolve) => {
                      const timer = setTimeout(resolve, 300)
                      barrier.release = () => {
                        clearTimeout(timer)
                        resolve()
                      }
                    })
                  } else barrier.release?.()
                }
                return result
              }
            }
            return client
          }
        },
      })
    },
  }
})

const authState = { userId: '' }
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => ({ userId: authState.userId }),
  logSecurityEvent: () => undefined,
}))

describe.skipIf(!DATABASE_URL)('POST /api/progress đồng thời (Postgres thật)', () => {
  let pool: Pool
  let handler: (req: Request) => Promise<Response>

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL })
    handler = (await import('./progress.js')).default
  })

  afterAll(async () => {
    if (authState.userId)
      await pool.query('delete from public.users where id = $1', [authState.userId])
    await pool.end()
  })

  beforeEach(async () => {
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.users (email) values ($1) returning id`,
      [`s09-concurrency-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`],
    )
    authState.userId = rows[0]!.id
  })

  function post(body: unknown): Promise<Response> {
    return handler(
      new Request('http://localhost/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
        body: JSON.stringify(body),
      }),
    )
  }

  function envelope(baseVersion: number) {
    return {
      attemptId: `att-${Math.random().toString(36).slice(2)}-${Date.now()}`,
      baseVersion,
      clientUpdatedAt: new Date().toISOString(),
    }
  }

  it('AC-4 hai POST song song (cùng baseVersion) → giữ CẢ HAI từ, version = 3, đúng 1 conflict', async () => {
    // Bản ghi ban đầu: version = 1.
    const first = await post({ learned: [], sync: envelope(0) })
    expect(first.status).toBe(200)
    expect((await first.json()).version).toBe(1)

    // Hai thiết bị cùng tin server đang ở version 1, gửi gần như cùng lúc.
    const [a, b] = await Promise.all([
      post({ learned: ['cat'], sync: envelope(1) }),
      post({ learned: ['dog'], sync: envelope(1) }),
    ])
    const ja = (await a.json()) as { version: number; conflict: boolean }
    const jb = (await b.json()) as { version: number; conflict: boolean }

    // Version KHÔNG trùng và tăng đơn điệu: một bên 2, bên kia 3.
    expect([ja.version, jb.version].sort()).toEqual([2, 3])
    // Bên chạy sau thấy version server đã là 2 ≠ baseVersion 1 → đúng MỘT conflict.
    expect([ja.conflict, jb.conflict].filter(Boolean)).toHaveLength(1)

    // KHÔNG mất dữ liệu: union giữ cả hai từ.
    const { rows } = await pool.query<{ learned: string[]; version: number }>(
      'select learned, version from english.learning_progress where user_id = $1',
      [authState.userId],
    )
    expect([...rows[0]!.learned].sort()).toEqual(['cat', 'dog'])
    expect(rows[0]!.version).toBe(3)
  })

  it('AUD-DATA-001: hai lần đồng bộ ĐẦU TIÊN song song (chưa có dòng) → giữ CẢ HAI từ', async () => {
    barrier.on = true
    barrier.emptyReads = 0
    barrier.release = null
    try {
      const [a, b] = await Promise.all([
        post({ learned: ['cat'], sync: envelope(0) }),
        post({ learned: ['dog'], sync: envelope(0) }),
      ])
      expect([a.status, b.status]).toEqual([200, 200])
    } finally {
      barrier.on = false
    }
    const { rows } = await pool.query<{ learned: string[]; version: number }>(
      'select learned, version from english.learning_progress where user_id = $1',
      [authState.userId],
    )
    expect([...rows[0]!.learned].sort()).toEqual(['cat', 'dog'])
    expect(rows[0]!.version).toBe(2)
    // Có khoá: chỉ request ĐẦU đọc thấy "chưa có dòng"; request sau đọc dòng đã commit.
    expect(barrier.emptyReads).toBe(1)
  })

  it('gửi lại cùng attemptId → replay, KHÔNG tăng version lần hai', async () => {
    const env = envelope(0)
    const first = (await (await post({ learned: ['cat'], sync: env })).json()) as {
      version: number
      replayed?: boolean
    }
    const again = (await (await post({ learned: ['cat'], sync: env })).json()) as {
      version: number
      replayed: boolean
    }
    expect(again.replayed).toBe(true)
    expect(again.version).toBe(first.version)

    const { rows } = await pool.query<{ version: number }>(
      'select version from english.learning_progress where user_id = $1',
      [authState.userId],
    )
    expect(rows[0]!.version).toBe(first.version)
  })
})

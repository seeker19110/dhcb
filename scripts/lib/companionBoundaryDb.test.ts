// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Client, Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import { z } from 'zod'
import {
  FixtureCleanupError,
  OwnedFixtureScope,
  REQUIRED_COLUMNS,
  parseDisposableDatabase,
  preflightDisposableDatabase,
  type OwnedFixtureManifest,
  type PersistManifest,
} from './companionBoundaryDb'

const LOCAL = 'postgresql://synthetic:not-a-secret@127.0.0.1:56543/dhcb_stored_test'
const CI = 'postgres://synthetic:not-a-secret@localhost:5432/dhcb'
const RUN = '99999999-9999-4999-8999-999999999999'
const pools: Pool[] = []
const boundaryFailures: string[] = []
afterEach(async () => {
  await Promise.all(pools.splice(0).map((pool) => pool.end()))
  vi.restoreAllMocks()
  expect(boundaryFailures.splice(0)).toEqual([])
})
const ownEmail = (userId: string) => `stored-${RUN}-${userId}@fixtures.invalid`
function target() {
  return parseDisposableDatabase(LOCAL, 'stored-local', {})
}
function result(rows: QueryResultRow[] = [], command = 'SELECT'): QueryResult {
  return { rows, rowCount: rows.length, command, fields: [], oid: 0 }
}
const catalog = Object.entries(REQUIRED_COLUMNS).flatMap(([table, names]) => {
  const [table_schema, table_name] = table.split('.')
  return names.map((column_name) => ({
    table_schema,
    table_name,
    column_name,
  }))
})
const personTables = [
  ...new Set(
    catalog
      .filter((r) => r.column_name === 'person_id')
      .map((r) => `${r.table_schema}.${r.table_name}`),
  ),
]
type FakeState = {
  users: Map<string, string>
  persons: Map<string, string>
  children: Map<string, Set<string>>
}
function fakeDb() {
  const parsedTarget = target()
  const pool = new Pool(parsedTarget.poolConfig)
  const release = vi.fn()
  const client: PoolClient = Object.assign(new Client(parsedTarget.poolConfig), { release })
  pools.push(pool)
  let state: FakeState = {
    users: new Map(),
    persons: new Map(),
    children: new Map(personTables.map((table) => [table, new Set<string>()])),
  }
  let txSnapshot: FakeState | undefined
  const events: string[] = []
  const controls = {
    database: 'dhcb_stored_test',
    catalog: structuredClone(catalog),
    personThrowAfterWrite: false,
    collision: false,
    collisionWithOwnEmail: false,
    userThrowAfterWrite: false,
    restrictDelete: false,
    leaveChild: false,
    invalidResidual: false,
  }
  function addPerson(userId: string) {
    const id = randomUUID()
    state.persons.set(id, userId)
    for (const ids of state.children.values()) ids.add(id)
    return id
  }
  function responsePerson(id: string, user_id: string) {
    return {
      id,
      user_id,
      display_name: 'Bạn tổng hợp',
      created_at: new Date('2026-10-16T00:00:00Z'),
      updated_at: new Date('2026-10-16T00:00:00Z'),
    }
  }
  function dispatch(text: string, values: unknown): QueryResult {
    const sql = text.replace(/\s+/g, ' ').trim().toLowerCase()
    const params = values === undefined ? [] : z.array(z.unknown()).parse(values)
    events.push(sql)
    if (sql === 'select current_database() as database')
      return result([{ database: controls.database }])
    if (sql.includes('from information_schema.columns')) return result(controls.catalog)
    if (sql === 'begin') {
      txSnapshot = structuredClone(state)
      return result([], 'BEGIN')
    }
    if (sql === 'commit') {
      txSnapshot = undefined
      return result([], 'COMMIT')
    }
    if (sql === 'rollback') {
      if (txSnapshot) state = txSnapshot
      txSnapshot = undefined
      return result([], 'ROLLBACK')
    }
    if (sql === 'select id, email from public.users where id = $1') {
      const id = z.string().uuid().parse(params[0])
      if (controls.collision)
        state.users.set(
          id,
          controls.collisionWithOwnEmail ? ownEmail(id) : 'UNRELATED_EXISTING_USER@example.invalid',
        )
      const email = state.users.get(id)
      return result(email ? [{ id, email }] : [])
    }
    if (sql.startsWith('insert into public.users')) {
      const id = z.string().uuid().parse(params[0])
      const email = z.string().parse(params[1])
      if (state.users.has(id)) throw new Error('DUPLICATE_ID_PRIVATE_MESSAGE')
      state.users.set(id, email)
      if (controls.userThrowAfterWrite) throw new Error('PRIVATE_BOOTSTRAP_ERROR')
      return result([{ id, email }], 'INSERT')
    }
    if (sql.startsWith('select id, user_id, display_name') && sql.includes('where user_id = $1')) {
      const userId = z.string().uuid().parse(params[0])
      return result(
        [...state.persons]
          .filter(([, user]) => user === userId)
          .map(([id, user]) => responsePerson(id, user)),
      )
    }
    if (sql.startsWith('insert into personal.persons')) {
      const userId = z.string().uuid().parse(params[0])
      const id = addPerson(userId)
      if (controls.personThrowAfterWrite) throw new Error('PRIVATE_AFTER_PERSON_WRITE')
      return result([responsePerson(id, userId)], 'INSERT')
    }
    if (sql.startsWith('select id, email from public.users where id = any')) {
      const ids = z.array(z.string().uuid()).parse(params[0])
      return result(
        [...state.users].filter(([id]) => ids.includes(id)).map(([id, email]) => ({ id, email })),
      )
    }
    if (sql.startsWith('select id, user_id from personal.persons')) {
      const users = z.array(z.string().uuid()).parse(params[0])
      const persons = z.array(z.string().uuid()).parse(params[1])
      return result(
        [...state.persons]
          .filter(([id, user]) => users.includes(user) || persons.includes(id))
          .map(([id, user_id]) => ({ id, user_id })),
      )
    }
    if (sql.startsWith('delete from personal.memory_records_audit_log')) {
      const ids = z.array(z.string().uuid()).parse(params[0])
      for (const id of ids) state.children.get('personal.memory_records_audit_log')?.delete(id)
      return result([], 'DELETE')
    }
    if (sql.startsWith('delete from public.users u using unnest')) {
      if (controls.restrictDelete) throw new Error('PRIVATE_PAYMENT_FK_ERROR')
      const ids = z.array(z.string().uuid()).parse(params[0])
      const emails = z.array(z.string()).parse(params[1])
      for (const [i, userId] of ids.entries()) {
        if (state.users.get(userId) !== emails[i]) continue
        state.users.delete(userId)
        for (const [personId, owner] of state.persons) {
          if (owner !== userId) continue
          state.persons.delete(personId)
          for (const [table, children] of state.children) {
            if (controls.leaveChild && table === 'worklife.documents') continue
            children.delete(personId)
          }
        }
      }
      return result([], 'DELETE')
    }
    const countMatch =
      /^select count\(\*\)::text as n from "([a-z_]+)"\."([a-z_]+)" where ([a-z_]+) = any/.exec(sql)
    if (countMatch) {
      const table = `${countMatch[1]}.${countMatch[2]}`
      const ids = z.array(z.string().uuid()).parse(params[0])
      let n: number
      if (table === 'public.users')
        n = [...state.users.keys()].filter((id) => ids.includes(id)).length
      else if (table === 'personal.persons')
        n = [...state.persons.values()].filter((id) => ids.includes(id)).length
      else n = [...(state.children.get(table) ?? [])].filter((id) => ids.includes(id)).length
      return result([{ n: controls.invalidResidual ? 'NaN' : String(n) }])
    }
    boundaryFailures.push('UNMATCHED_SQL')
    throw new Error('UNMATCHED_SQL_PRIVATE')
  }
  vi.spyOn(pool, 'query').mockImplementation((text, values) =>
    Promise.resolve(dispatch(text, values)),
  )
  vi.spyOn(client, 'query').mockImplementation((text, values) =>
    Promise.resolve(dispatch(text, values)),
  )
  vi.spyOn(pool, 'connect').mockImplementation(() => Promise.resolve(client))
  const journals: OwnedFixtureManifest[] = []
  const persist: PersistManifest = async (manifest) => {
    journals.push(structuredClone(manifest))
  }
  const open = (writer: PersistManifest = persist, resume?: unknown) =>
    OwnedFixtureScope.open(pool, parsedTarget, writer, {
      runId: RUN,
      ...(resume === undefined ? {} : { resume }),
    })
  return {
    pool,
    release,
    events,
    controls,
    journals,
    open,
    addPerson,
    get state() {
      return state
    },
    parsedTarget,
  }
}

describe('parseDisposableDatabase', () => {
  it.each(['localhost', '127.0.0.1', '[::1]'])('local endpoint %s có explicit fields', (host) => {
    const parsed = parseDisposableDatabase(LOCAL.replace('127.0.0.1', host), 'stored-local', {})
    expect(parsed.poolConfig).toMatchObject({
      database: 'dhcb_stored_test',
      port: 56543,
      host: host === '[::1]' ? '::1' : host,
      ssl: false,
      max: 2,
    })
    expect(parsed.poolConfig).not.toHaveProperty('connectionString')
    expect(parsed.poolConfig.options).toContain('statement_timeout=15000')
    expect(Object.isFrozen(parsed.poolConfig)).toBe(true)
    expect(JSON.stringify(parsed)).not.toContain('not-a-secret')
    expect(parsed.poolConfig.password).toBe('not-a-secret')
  })
  it('github-ci cần cả CI và GITHUB_ACTIONS true, không dựa DB URL', () => {
    expect(
      parseDisposableDatabase(CI, 'github-ci', {
        CI: 'true',
        GITHUB_ACTIONS: 'true',
      }).poolConfig.database,
    ).toBe('dhcb')
    for (const environment of [
      {},
      { CI: 'true' },
      { GITHUB_ACTIONS: 'true' },
      { CI: 'true', GITHUB_ACTIONS: 'false' },
      { CI: 'TRUE', GITHUB_ACTIONS: 'true' },
    ]) {
      expect(() => parseDisposableDatabase(CI, 'github-ci', environment)).toThrow(
        'UNTRUSTED_CI_PROFILE',
      )
    }
  })
  it.each(
    [
      LOCAL + '?host=prod.example',
      LOCAL + '?hostaddr=10.0.0.1',
      LOCAL + '?service=prod',
      LOCAL + '?sslmode=disable',
      LOCAL + '#fragment',
      LOCAL.replace('127.0.0.1', '127.0.0.1.evil'),
      LOCAL.replace('127.0.0.1', '127.1'),
      LOCAL.replace('127.0.0.1', '0x7f000001'),
      LOCAL.replace('127.0.0.1', 'localhost.'),
      LOCAL.replace('127.0.0.1', '%2fvar%2frun%2fpostgresql'),
      LOCAL.replace('56543', '5432'),
      LOCAL.replace('dhcb_stored_test', 'dhcb'),
      LOCAL.replace('dhcb_stored_test', 'dhcb_stored_test/other'),
      LOCAL.replace('postgresql:', 'https:'),
      LOCAL.replace('synthetic:not-a-secret@', ''),
      LOCAL.replace('not-a-secret', ''),
      LOCAL.replace('synthetic', '%00'),
      LOCAL.replace('not-a-secret', '%ZZ'),
      LOCAL + '?',
      LOCAL + '#',
      ' ' + LOCAL,
      LOCAL.replace('localhost', 'LOCALHOST'),
    ].filter((value) => value !== LOCAL),
  )('từ chối URL không exact disposable %#', (value) => {
    try {
      parseDisposableDatabase(value, 'stored-local', {})
      throw new Error('NOT_REJECTED')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(String(error)).not.toContain('not-a-secret')
      expect(String(error)).not.toContain('postgresql://')
      expect(String(error)).not.toContain('NOT_REJECTED')
    }
  })
})

describe('preflight và journal fixture', () => {
  it('preflight chỉ SELECT và từ chối current_database mismatch trước INSERT', async () => {
    const db = fakeDb()
    db.controls.database = 'production'
    await expect(db.open()).rejects.toThrow('DATABASE_MISMATCH')
    expect(db.events).toEqual(['select current_database() as database'])
    expect(db.journals).toHaveLength(0)
  })
  it('thiếu schema bắt buộc bị đỏ, không tự migrate', async () => {
    const db = fakeDb()
    db.controls.catalog = db.controls.catalog.filter((row) => row.table_name !== 'proposed_actions')
    await expect(db.open()).rejects.toThrow('REQUIRED_SCHEMA_MISSING')
    expect(db.events.every((sql) => sql.startsWith('select'))).toBe(true)
    expect(db.state.users.size).toBe(0)
  })
  it('catalog malformed bị parse fail trước seed', async () => {
    const db = fakeDb()
    db.controls.catalog[0] = {
      table_schema: 'public',
      table_name: 'users;drop',
      column_name: 'id',
    }
    await expect(db.open()).rejects.toThrow('INVALID_SCHEMA_CATALOG')
    expect(db.state.users.size).toBe(0)
  })
  it('pool config override không được dùng dù DB name giống', async () => {
    const db = fakeDb()
    db.pool.options.host = 'prod.example'
    await expect(preflightDisposableDatabase(db.pool, db.parsedTarget)).rejects.toThrow(
      'POOL_CONFIG_MISMATCH',
    )
    expect(db.events).toHaveLength(0)
  })
  it('await journal allocation trước INSERT; cleanup khi đang seed phải lỗi', async () => {
    const db = fakeDb()
    let unblock: () => void = () => {
      throw new Error('NOT_STARTED')
    }
    let reached = false
    const barrier = new Promise<void>((resolve) => {
      unblock = resolve
    })
    let blockedOnce = false
    const scope = await db.open(async (manifest) => {
      db.journals.push(structuredClone(manifest))
      if (manifest.roots.length === 1 && !blockedOnce) {
        blockedOnce = true
        reached = true
        await barrier
      }
    })
    const pending = scope.newPerson()
    await vi.waitFor(() => expect(reached).toBe(true))
    expect(db.state.users.size).toBe(0)
    expect(db.events.some((sql) => sql.startsWith('insert'))).toBe(false)
    await expect(scope.cleanup()).rejects.toThrow('SCOPE_BUSY')
    unblock()
    const person = await pending
    expect(db.journals[1]?.roots[0]?.userId).toBe(person.userId)
    expect(db.journals[1]?.roots[0]?.personId).toBeUndefined()
    await scope.cleanup()
  })
  it('journal fail trước INSERT không mutation và không lộ raw error', async () => {
    const db = fakeDb()
    let rejectWrites = false
    const scope = await db.open(async () => {
      if (rejectWrites) throw new Error('PRIVATE_JOURNAL_ERROR')
    })
    rejectWrites = true
    await expect(scope.newPerson()).rejects.toThrow('MANIFEST_PERSIST_FAILED')
    expect(db.events.some((sql) => sql.startsWith('insert'))).toBe(false)
    await expect(scope.cleanup()).rejects.toThrow('MANIFEST_PERSIST_FAILED')
    rejectWrites = false
    expect((await scope.cleanup()).status).toBe('clean')
  })
  it('journal lỗi ở cleanup không DELETE fixture đã seed, residual vẫn báo đỏ', async () => {
    const db = fakeDb()
    let stopCleaning = false
    const scope = await db.open(async (manifest) => {
      if (stopCleaning && manifest.state === 'cleaning') throw new Error('PRIVATE_FS')
      db.journals.push(structuredClone(manifest))
    })
    const own = await scope.newPerson()
    stopCleaning = true
    await expect(scope.cleanup()).rejects.toMatchObject({
      report: {
        reason: 'MANIFEST_PERSIST_FAILED',
        residuals: expect.arrayContaining([{ table: 'public.users', count: 1 }]),
      },
    })
    expect(db.state.users.has(own.userId)).toBe(true)
    expect(db.events.some((sql) => sql.startsWith('delete'))).toBe(false)
    stopCleaning = false
    await scope.cleanup()
  })
  it('connectionString override bị chặn dù host/database fields vẫn giống target', async () => {
    const db = fakeDb()
    db.pool.options.connectionString = LOCAL
    await expect(preflightDisposableDatabase(db.pool, db.parsedTarget)).rejects.toThrow(
      'POOL_CONFIG_MISMATCH',
    )
    expect(db.events).toHaveLength(0)
  })
  it('newPerson gọi actual service, cleanup audit trước cascade; giữ unrelated baseline', async () => {
    const db = fakeDb()
    const unrelatedUser = randomUUID()
    db.state.users.set(unrelatedUser, 'UNRELATED@example.invalid')
    const unrelatedPerson = db.addPerson(unrelatedUser)
    const scope = await db.open()
    const own = await scope.newPerson()
    expect(db.state.persons.get(own.personId)).toBe(own.userId)
    expect(db.state.users.get(own.userId)).toBe(ownEmail(own.userId))
    const report = await scope.cleanup()
    expect(report.status).toBe('clean')
    expect(report.residuals?.every((item) => item.count === 0)).toBe(true)
    expect(db.state.users.get(unrelatedUser)).toBe('UNRELATED@example.invalid')
    expect(db.state.persons.get(unrelatedPerson)).toBe(unrelatedUser)
    for (const rows of db.state.children.values()) expect([...rows]).toEqual([unrelatedPerson])
    const deletes = db.events.filter((sql) => sql.startsWith('delete'))
    expect(deletes).toHaveLength(2)
    expect(deletes[0]).toContain('memory_records_audit_log where person_id = any')
    expect(deletes[1]).toContain('u.id = own.id and u.email = own.email')
    expect(db.release).toHaveBeenCalledOnce()
    await expect(scope.newPerson()).rejects.toThrow('SCOPE_CLOSED_OR_BUSY')
  })
  it.each(['personThrowAfterWrite', 'userThrowAfterWrite'] as const)(
    'recover sau %s qua journal own user UUID',
    async (flag) => {
      const db = fakeDb()
      const scope = await db.open()
      db.controls[flag] = true
      await expect(scope.newPerson()).rejects.toThrow('FIXTURE_CREATE_FAILED')
      const persisted = db.journals.at(-1)
      expect(persisted?.roots).toHaveLength(1)
      expect(persisted?.roots[0]?.personId).toBeUndefined()
      const resumed = await db.open(undefined, persisted)
      const report = await resumed.cleanup()
      expect(report.status).toBe('clean')
      expect(db.state.users.size).toBe(0)
      expect(db.state.persons.size).toBe(0)
      expect(db.state.children.get('personal.memory_records_audit_log')?.size).toBe(0)
    },
  )
  it('UUID collision không xóa user hiện hữu; mismatch không chạy DELETE', async () => {
    const db = fakeDb()
    db.controls.collision = true
    const scope = await db.open()
    await expect(scope.newPerson()).rejects.toThrow('USER_UUID_COLLISION')
    await expect(scope.cleanup()).rejects.toMatchObject({
      report: { status: 'failed', reason: 'OWNERSHIP_MISMATCH' },
    })
    expect(db.state.users.size).toBe(1)
    expect([...db.state.users.values()]).toEqual(['UNRELATED_EXISTING_USER@example.invalid'])
    expect(db.events.some((sql) => sql.startsWith('delete'))).toBe(false)
  })
  it('sau Person throw và journal cleanup lỗi, residual vẫn resolve được children đã ghi', async () => {
    const db = fakeDb()
    let stopCleaning = false
    const scope = await db.open(async (manifest) => {
      if (stopCleaning && manifest.state === 'cleaning') throw new Error('PRIVATE_FS')
      db.journals.push(structuredClone(manifest))
    })
    db.controls.personThrowAfterWrite = true
    await expect(scope.newPerson()).rejects.toThrow('FIXTURE_CREATE_FAILED')
    expect(scope.snapshotManifest().roots[0]?.personId).toBeUndefined()
    stopCleaning = true
    await expect(scope.cleanup()).rejects.toMatchObject({
      report: {
        reason: 'MANIFEST_PERSIST_FAILED',
        residuals: expect.arrayContaining([
          { table: 'personal.memory_records_audit_log', count: 1 },
          { table: 'worklife.documents', count: 1 },
        ]),
      },
    })
    expect(db.events.some((sql) => sql.startsWith('delete'))).toBe(false)
    stopCleaning = false
    await scope.cleanup()
  })
  it('pre-existing UUID cùng synthetic email cũng không được xóa từ allocation journal', async () => {
    const db = fakeDb()
    db.controls.collision = true
    db.controls.collisionWithOwnEmail = true
    const scope = await db.open()
    await expect(scope.newPerson()).rejects.toThrow('USER_UUID_COLLISION')
    expect(db.journals.at(-1)?.roots[0]?.stage).toBe('allocated')
    const resumed = await db.open(undefined, db.journals.at(-1))
    await expect(resumed.cleanup()).rejects.toThrow('OWNERSHIP_UNPROVEN')
    expect(db.state.users.size).toBe(1)
    expect(db.events.some((sql) => sql.startsWith('delete'))).toBe(false)
  })
  it('FK failure rollback audit delete, báo residual và không xóa payment để vượt lỗi', async () => {
    const db = fakeDb()
    const scope = await db.open()
    const own = await scope.newPerson()
    db.controls.restrictDelete = true
    await expect(scope.cleanup()).rejects.toMatchObject({
      report: {
        reason: 'CLEANUP_QUERY_FAILED',
        residuals: expect.arrayContaining([{ table: 'public.users', count: 1 }]),
      },
    })
    expect(db.state.children.get('personal.memory_records_audit_log')?.has(own.personId)).toBe(true)
    expect(db.state.users.has(own.userId)).toBe(true)
    expect(db.events).toContain('rollback')
    expect(db.events.some((sql) => sql.includes('delete from public.payments'))).toBe(false)
    db.controls.restrictDelete = false
    await scope.cleanup()
  })
  it('known child residual không được coi clean dù users/persons đã xóa', async () => {
    const db = fakeDb()
    const scope = await db.open()
    await scope.newPerson()
    db.controls.leaveChild = true
    await expect(scope.cleanup()).rejects.toMatchObject({
      report: {
        reason: 'OWN_RESIDUALS_REMAIN',
        residuals: expect.arrayContaining([{ table: 'worklife.documents', count: 1 }]),
      },
    })
    expect(db.journals.at(-1)?.state).toBe('cleaning')
  })
  it('cleanup kiểm lại DB trước DELETE, không đọc/xóa DB mismatch', async () => {
    const db = fakeDb()
    const scope = await db.open()
    await scope.newPerson()
    db.controls.database = 'unexpected'
    const error = await scope.cleanup().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(FixtureCleanupError)
    expect(error).toMatchObject({
      report: { residuals: null, reason: 'DATABASE_MISMATCH' },
    })
    expect(db.events.some((sql) => sql.startsWith('delete'))).toBe(false)
  })
  it('journal fail sau commit vẫn fail dù residual0; resume clean được', async () => {
    const db = fakeDb()
    let failClean = true
    const scope = await db.open(async (manifest) => {
      if (manifest.state === 'clean' && failClean) throw new Error('PRIVATE_FS_WRITE')
      db.journals.push(structuredClone(manifest))
    })
    await scope.newPerson()
    await expect(scope.cleanup()).rejects.toMatchObject({
      report: {
        reason: 'MANIFEST_PERSIST_FAILED',
        residuals: expect.arrayContaining([{ table: 'public.users', count: 0 }]),
      },
    })
    expect(db.journals.at(-1)?.state).toBe('cleaning')
    failClean = false
    expect((await scope.cleanup()).status).toBe('clean')
  })
  it('malformed residual row không được NaN/zero false green', async () => {
    const db = fakeDb()
    const scope = await db.open()
    db.controls.invalidResidual = true
    await expect(scope.cleanup()).rejects.toMatchObject({
      report: { reason: 'RESIDUAL_QUERY_FAILED', residuals: null },
    })
  })
  it('callback mutation không đổi manifest trong scope', async () => {
    const db = fakeDb()
    const scope = await db.open(async (manifest) => {
      manifest.roots.length = 0
    })
    await scope.newPerson()
    expect(scope.snapshotManifest().roots).toHaveLength(1)
    await scope.cleanup()
  })
  it.each([
    {
      version: 1,
      runId: RUN,
      profile: 'stored-local',
      database: 'dhcb_stored_test',
      state: 'open',
      roots: [{ userId: RUN, email: 'foreign@example.invalid', stage: 'allocated' }],
    },
    {
      version: 1,
      runId: RUN,
      profile: 'github-ci',
      database: 'dhcb',
      state: 'open',
      roots: [],
    },
    {
      version: 1,
      runId: RUN,
      profile: 'stored-local',
      database: 'dhcb_stored_test',
      state: 'open',
      roots: [
        { userId: RUN, email: ownEmail(RUN), stage: 'allocated' },
        { userId: RUN, email: ownEmail(RUN), stage: 'allocated' },
      ],
    },
  ])('resume malformed/mismatch/duplicate bị chặn %#', async (manifest) => {
    const db = fakeDb()
    await expect(db.open(undefined, manifest)).rejects.toThrow('INVALID_MANIFEST')
    expect(db.events.every((sql) => sql.startsWith('select'))).toBe(true)
  })
  it('resume personId thuộc user khác phải fail ownership trước DELETE', async () => {
    const db = fakeDb()
    const foreign = randomUUID()
    db.state.users.set(foreign, 'UNRELATED@example.invalid')
    const foreignPerson = db.addPerson(foreign)
    const scope = await db.open(undefined, {
      version: 1,
      runId: RUN,
      profile: 'stored-local',
      database: 'dhcb_stored_test',
      state: 'cleaning',
      roots: [
        { userId: RUN, email: ownEmail(RUN), personId: foreignPerson, stage: 'person_ready' },
      ],
    })
    await expect(scope.cleanup()).rejects.toThrow('OWNERSHIP_MISMATCH')
    expect(db.events.some((sql) => sql.startsWith('delete'))).toBe(false)
    expect(db.state.persons.get(foreignPerson)).toBe(foreign)
  })
})

// Catalog migrate:pg thật có public._schema_migrations; quote identifier vẫn giữ chặn injection.
it('catalog migration table bắt đầu underscore vẫn preflight hợp lệ', async () => {
  const db = fakeDb()
  db.controls.catalog.push({
    table_schema: 'public',
    table_name: '_schema_migrations',
    column_name: 'filename',
  })
  await expect(preflightDisposableDatabase(db.pool, db.parsedTarget)).resolves.toEqual(
    expect.arrayContaining(personTables),
  )
})
it('residual session theo own user ID vẫn làm cleanup fail sau users/persons biến mất', async () => {
  const db = fakeDb()
  const scope = await db.open()
  const own = await scope.newPerson()
  db.state.children.set('public.sessions', new Set([own.userId]))
  await expect(scope.cleanup()).rejects.toMatchObject({
    report: {
      status: 'failed',
      reason: 'OWN_RESIDUALS_REMAIN',
      residuals: expect.arrayContaining([{ table: 'public.sessions', count: 1 }]),
    },
  })
})

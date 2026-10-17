// Chỉ DB disposable và fixture thuộc đúng manifest của runner.
import { randomUUID } from 'node:crypto'
import type { Pool, PoolConfig } from 'pg'
import { z } from 'zod'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { PersonSchema } from '@dhcb/core-contracts/person'
import { withTransaction } from '@dhcb/core-db/transaction'

export type DisposableProfile = 'stored-local' | 'github-ci'
const targetBrand = Symbol('disposable-target')
export interface DisposableDatabaseTarget {
  readonly [targetBrand]: true
  readonly profile: DisposableProfile
  readonly database: 'dhcb_stored_test' | 'dhcb'
  readonly poolConfig: Readonly<PoolConfig>
}
export class DisposableDbError extends Error {
  constructor(readonly code: string) {
    super(`DB fixture: ${code}`)
    this.name = 'DisposableDbError'
  }
}
function fail(code: string): never {
  throw new DisposableDbError(code)
}
function hasControlCharacter(value: string, includeSpace = false): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= (includeSpace ? 32 : 31) || code === 127) return true
  }
  return false
}
/** Không đọc process.env, không nhận defaults/connectionString/URL query của pg. */
export function parseDisposableDatabase(
  rawURL: string,
  profile: DisposableProfile,
  environment: Readonly<{ CI?: string; GITHUB_ACTIONS?: string }>,
): DisposableDatabaseTarget {
  if (profile !== 'stored-local' && profile !== 'github-ci') fail('INVALID_PROFILE')
  if (
    profile === 'github-ci' &&
    (environment.CI !== 'true' || environment.GITHUB_ACTIONS !== 'true')
  ) {
    fail('UNTRUSTED_CI_PROFILE')
  }
  // Raw authority kiểm trước WHATWG normalization (vd 127.1, 0x7f000001, trailing dot).
  const parts = /^postgres(?:ql)?:\/\/([^/?#\s\\]+)\/([^/?#\s\\]+)$/.exec(rawURL)
  if (!parts || hasControlCharacter(rawURL, true)) fail('INVALID_DATABASE_URL')
  const authority = parts[1] ?? ''
  const hostPort = authority.slice(authority.lastIndexOf('@') + 1)
  const port = profile === 'stored-local' ? 56543 : 5432
  if (!['localhost', '127.0.0.1', '[::1]'].some((host) => hostPort === `${host}:${port}`)) {
    fail('NON_DISPOSABLE_ENDPOINT')
  }
  const database = profile === 'stored-local' ? 'dhcb_stored_test' : 'dhcb'
  if (parts[2] !== database) fail('NON_DISPOSABLE_DATABASE')
  let url: URL
  let user: string
  let password: string
  try {
    url = new URL(rawURL)
    user = decodeURIComponent(url.username)
    password = decodeURIComponent(url.password)
  } catch {
    return fail('INVALID_DATABASE_URL')
  }
  if (!user || !password || hasControlCharacter(user + password)) {
    fail('EXPLICIT_CREDENTIALS_REQUIRED')
  }
  const config: PoolConfig = {
    host: url.hostname === '[::1]' ? '::1' : url.hostname,
    port,
    database,
    user,
    ssl: false,
    options: '-c statement_timeout=15000 -c lock_timeout=5000 -c search_path=public',
    application_name: 'dhcb-stored-disposable-eval',
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
    query_timeout: 15000,
    allowExitOnIdle: true,
  }
  // Giống pg: password vẫn dùng được để connect nhưng không vô tình vào JSON/log config.
  Object.defineProperty(config, 'password', {
    value: password,
    enumerable: false,
  })
  const poolConfig = Object.freeze(config)
  return Object.freeze({
    [targetBrand]: true as const,
    profile,
    database,
    poolConfig,
  })
}

// Catalog là dữ liệu ngoài: schema/table/column đều parse trước khi làm SQL identifier.
const Identifier = z.string().regex(/^[a-z_][a-z0-9_]*$/)
const ColumnRow = z
  .object({
    table_schema: z.enum(['public', 'personal', 'worklife', 'platform']),
    table_name: Identifier,
    column_name: Identifier,
  })
  .strict()
const DatabaseRows = z.array(z.object({ database: z.string() }).strict()).length(1)
const CountRows = z.array(z.object({ n: z.string().regex(/^\d+$/) }).strict()).length(1)
const UserRows = z.array(z.object({ id: z.string().uuid(), email: z.string() }).strict())
const PersonRows = z.array(z.object({ id: z.string().uuid(), user_id: z.string().uuid() }).strict())
export const REQUIRED_COLUMNS = Object.freeze({
  'public.users': ['id', 'email'],
  'public.sessions': ['session_token', 'user_id', 'expires'],
  'public.profiles': ['id', 'name'],
  'personal.persons': ['id', 'user_id', 'display_name', 'created_at', 'updated_at'],
  'personal.personal_facts': ['id', 'person_id', 'value', 'is_current', 'supersedes'],
  'personal.consent_grants': ['id', 'person_id', 'scope', 'purpose'],
  'personal.personal_policies': ['id', 'person_id', 'authority'],
  'personal.memory_records': ['id', 'person_id', 'content', 'status', 'version', 'valid_to'],
  'personal.memory_records_audit_log': ['id', 'person_id', 'record_id'],
  'personal.proposed_actions': ['id', 'person_id', 'status', 'version', 'execution_result'],
  'personal.tool_execution_audit_log': ['id', 'person_id', 'proposed_action_id', 'status'],
  'personal.life_graph_nodes': ['id', 'person_id'],
  'personal.life_graph_edges': ['id', 'person_id'],
  'personal.life_goals': ['id', 'person_id'],
  'personal.companion_messages': ['id', 'person_id', 'content'],
  'personal.companion_core_blocks': ['id', 'person_id', 'content', 'version'],
  'personal.companion_conversation_summaries': ['id', 'person_id', 'summary', 'version'],
  'worklife.documents': ['id', 'person_id', 'summary'],
  'worklife.tasks': ['id', 'person_id', 'status'],
} satisfies Readonly<Record<string, readonly string[]>>)

async function assertCurrentDatabase(pool: Pick<Pool, 'query'>, expected: string): Promise<void> {
  const result = await pool.query('select current_database() as database')
  const parsed = DatabaseRows.safeParse(result.rows)
  if (!parsed.success || parsed.data[0]?.database !== expected) fail('DATABASE_MISMATCH')
}
/** SELECT-only; không tạo/migrate schema. Target phải đến từ parser trong cùng process. */
export async function preflightDisposableDatabase(
  pool: Pool,
  target: DisposableDatabaseTarget,
): Promise<readonly string[]> {
  if (target[targetBrand] !== true) fail('UNPARSED_TARGET')
  // Caller phải tạo Pool bằng config đã parse; current_database vẫn kiểm sau connect.
  for (const field of [
    'host',
    'port',
    'database',
    'user',
    'password',
    'ssl',
    'options',
    'max',
    'connectionTimeoutMillis',
    'idleTimeoutMillis',
    'query_timeout',
    'allowExitOnIdle',
    'application_name',
  ] as const) {
    if (pool.options[field] !== target.poolConfig[field]) fail('POOL_CONFIG_MISMATCH')
  }
  if (pool.options.connectionString || pool.options.stream) fail('POOL_CONFIG_MISMATCH')
  try {
    await assertCurrentDatabase(pool, target.database)
    const result = await pool.query(`select c.table_schema, c.table_name, c.column_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.table_schema in ('public', 'personal', 'worklife', 'platform')
        and t.table_type = 'BASE TABLE'
      order by 1, 2, 3`)
    const parsed = z.array(ColumnRow).safeParse(result.rows)
    if (!parsed.success) fail('INVALID_SCHEMA_CATALOG')
    const columns = new Map<string, Set<string>>()
    for (const row of parsed.data) {
      const table = `${row.table_schema}.${row.table_name}`
      const names = columns.get(table) ?? new Set<string>()
      names.add(row.column_name)
      columns.set(table, names)
    }
    for (const [table, names] of Object.entries(REQUIRED_COLUMNS)) {
      if (names.some((name) => !columns.get(table)?.has(name))) fail('REQUIRED_SCHEMA_MISSING')
    }
    return [...columns]
      .filter(([, names]) => names.has('person_id'))
      .map(([table]) => table)
      .sort()
  } catch (error) {
    if (error instanceof DisposableDbError) throw error
    return fail('PREFLIGHT_QUERY_FAILED')
  }
}

const RootSchema = z
  .object({
    userId: z.string().uuid(),
    email: z.string(),
    stage: z.enum(['allocated', 'insert_pending', 'person_ready']),
    personId: z.string().uuid().optional(),
  })
  .strict()
export const OwnedFixtureManifestSchema = z
  .object({
    version: z.literal(1),
    runId: z.string().uuid(),
    profile: z.enum(['stored-local', 'github-ci']),
    database: z.enum(['dhcb_stored_test', 'dhcb']),
    state: z.enum(['open', 'cleaning', 'clean']),
    roots: z.array(RootSchema),
  })
  .strict()
  .superRefine((manifest, context) => {
    const users = new Set<string>()
    const persons = new Set<string>()
    for (const root of manifest.roots) {
      if (
        root.email !== fixtureEmail(manifest.runId, root.userId) ||
        users.has(root.userId) ||
        (root.personId !== undefined && persons.has(root.personId))
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Manifest ownership không hợp lệ',
        })
      }
      if (
        (root.stage === 'allocated' && root.personId !== undefined) ||
        (root.stage === 'person_ready' && root.personId === undefined)
      ) {
        context.addIssue({ code: 'custom', message: 'Manifest stage không hợp lệ' })
      }
      users.add(root.userId)
      if (root.personId) persons.add(root.personId)
    }
  })
export type OwnedFixtureManifest = z.infer<typeof OwnedFixtureManifestSchema>
export type PersistManifest = (manifest: Readonly<OwnedFixtureManifest>) => Promise<void>
export interface FixturePerson {
  userId: string
  personId: string
}
export interface CleanupReport {
  status: 'clean' | 'failed'
  residuals: ReadonlyArray<{ table: string; count: number }> | null
  reason: string | null
}
export class FixtureCleanupError extends DisposableDbError {
  constructor(readonly report: CleanupReport) {
    super(report.reason ?? 'CLEANUP_FAILED')
    this.name = 'FixtureCleanupError'
  }
}
function fixtureEmail(runId: string, userId: string): string {
  return `stored-${runId}-${userId}@fixtures.invalid`
}
function tableSQL(table: string): string {
  const [schema, name, extra] = table.split('.')
  if (
    !schema ||
    !name ||
    extra ||
    !Identifier.safeParse(schema).success ||
    !Identifier.safeParse(name).success
  )
    fail('INVALID_TABLE_IDENTIFIER')
  return `"${schema}"."${name}"`
}

/** Manifest resume chỉ từ artifact cục bộ do runner ghi; không nhận từ model/corpus/HTTP. */
export class OwnedFixtureScope {
  private closed = false
  private busy = false
  private constructor(
    private readonly pool: Pool,
    private readonly target: DisposableDatabaseTarget,
    private readonly persistManifest: PersistManifest,
    private manifest: OwnedFixtureManifest,
  ) {}

  static async open(
    pool: Pool,
    target: DisposableDatabaseTarget,
    persistManifest: PersistManifest,
    options: { runId?: string; resume?: unknown } = {},
  ): Promise<OwnedFixtureScope> {
    await preflightDisposableDatabase(pool, target)
    const parsed = OwnedFixtureManifestSchema.safeParse(
      options.resume ?? {
        version: 1,
        runId: options.runId ?? randomUUID(),
        profile: target.profile,
        database: target.database,
        state: 'open',
        roots: [],
      },
    )
    if (
      !parsed.success ||
      parsed.data.profile !== target.profile ||
      parsed.data.database !== target.database ||
      (options.runId !== undefined && parsed.data.runId !== options.runId)
    )
      fail('INVALID_MANIFEST')
    const scope = new OwnedFixtureScope(pool, target, persistManifest, parsed.data)
    scope.closed = parsed.data.state !== 'open'
    await scope.persist()
    return scope
  }

  private async persist(): Promise<void> {
    // Clone ngăn callback sửa internal ownership qua alias object.
    try {
      await this.persistManifest(structuredClone(this.manifest))
    } catch {
      fail('MANIFEST_PERSIST_FAILED')
    }
  }
  snapshotManifest(): OwnedFixtureManifest {
    return structuredClone(this.manifest)
  }

  async newPerson(): Promise<FixturePerson> {
    if (this.closed || this.busy) fail('SCOPE_CLOSED_OR_BUSY')
    this.busy = true
    try {
      const userId = randomUUID()
      const root: z.infer<typeof RootSchema> = {
        userId,
        email: fixtureEmail(this.manifest.runId, userId),
        stage: 'allocated',
      }
      this.manifest.roots.push(root)
      await this.persist() // UUID/email vào journal TRƯỚC mutation đầu tiên.
      const existing = await this.pool.query('select id, email from public.users where id = $1', [
        userId,
      ])
      const parsed = UserRows.safeParse(existing.rows)
      if (!parsed.success) fail('INVALID_USER_ROWS')
      if (parsed.data.length > 0) fail('USER_UUID_COLLISION')
      root.stage = 'insert_pending'
      await this.persist() // Có bằng chứng precheck trước khi cho phép cleanup root này.
      const inserted = await this.pool.query(
        'insert into public.users (id, email) values ($1, $2) returning id, email',
        [userId, root.email],
      )
      const created = UserRows.safeParse(inserted.rows)
      if (
        !created.success ||
        created.data.length !== 1 ||
        created.data[0]?.id !== userId ||
        created.data[0]?.email !== root.email
      )
        fail('USER_BOOTSTRAP_FAILED')
      await this.persist()
      const person = PersonSchema.parse(await getOrCreatePerson(this.pool, userId))
      if (person.userId !== userId) fail('PERSON_OWNER_MISMATCH')
      root.personId = person.id
      root.stage = 'person_ready'
      await this.persist()
      return { userId, personId: person.id }
    } catch (error) {
      if (error instanceof DisposableDbError) throw error
      return fail('FIXTURE_CREATE_FAILED')
    } finally {
      this.busy = false
    }
  }

  private async resolvePersons(query: Pick<Pool, 'query'>, lock: boolean): Promise<string[]> {
    const users = this.manifest.roots.map((root) => root.userId)
    const knownPersons = this.manifest.roots.flatMap((root) =>
      root.personId ? [root.personId] : [],
    )
    const userResult = await query.query(
      `select id, email from public.users where id = any($1::uuid[])${lock ? ' for update' : ''}`,
      [users],
    )
    const userRows = UserRows.safeParse(userResult.rows)
    if (!userRows.success) fail('INVALID_USER_ROWS')
    for (const row of userRows.data) {
      const root = this.manifest.roots.find((entry) => entry.userId === row.id)
      if (root?.email !== row.email) fail('OWNERSHIP_MISMATCH')
      if (root.stage === 'allocated') fail('OWNERSHIP_UNPROVEN')
    }
    const result = await query.query(
      `select id, user_id from personal.persons where user_id = any($1::uuid[])
        or id = any($2::uuid[])${lock ? ' for update' : ''}`,
      [users, knownPersons],
    )
    const rows = PersonRows.safeParse(result.rows)
    if (!rows.success) fail('INVALID_PERSON_ROWS')
    for (const row of rows.data) {
      const root = this.manifest.roots.find((entry) => entry.userId === row.user_id)
      if (
        !root ||
        root.stage === 'allocated' ||
        (root.personId !== undefined && root.personId !== row.id)
      )
        fail('OWNERSHIP_MISMATCH')
      root.personId = row.id // recovery khi getOrCreatePerson ghi xong rồi throw.
      root.stage = 'person_ready'
    }
    return [...new Set([...knownPersons, ...rows.data.map((row) => row.id)])]
  }

  /** Caller luôn await cleanup trong finally, rồi pool.end(); helper không sở hữu Pool. */
  async cleanup(): Promise<CleanupReport> {
    if (this.busy)
      throw new FixtureCleanupError({
        status: 'failed',
        residuals: null,
        reason: 'SCOPE_BUSY',
      })
    this.closed = true
    this.manifest.state = 'cleaning'
    let reason: string | null = null
    let tables: readonly string[] = []
    let personIds = this.manifest.roots.flatMap((root) => (root.personId ? [root.personId] : []))
    let databaseVerified = false
    try {
      tables = await preflightDisposableDatabase(this.pool, this.target)
      databaseVerified = true
      await this.persist() // journal không ghi được thì không bắt đầu DELETE.
      await withTransaction(this.pool, async (client) => {
        await assertCurrentDatabase(client, this.target.database)
        personIds = await this.resolvePersons(client, true)
        await this.persist() // persist person recovery trước DELETE audit.
        await client.query(
          'delete from personal.memory_records_audit_log where person_id = any($1::uuid[])',
          [personIds],
        )
        const roots = this.manifest.roots.filter((root) => root.stage !== 'allocated')
        // Exact pair guard giữ ngay trong DELETE, ngoài SELECT/lock bên trên.
        await client.query(
          `delete from public.users u using unnest($1::uuid[], $2::text[]) as own(id, email)
          where u.id = own.id and u.email = own.email`,
          [roots.map((r) => r.userId), roots.map((r) => r.email)],
        )
      })
    } catch (error) {
      reason = error instanceof DisposableDbError ? error.code : 'CLEANUP_QUERY_FAILED'
    }
    let residuals: CleanupReport['residuals'] = null
    if (databaseVerified) {
      try {
        await assertCurrentDatabase(this.pool, this.target.database)
        // Sau lỗi create/journal, Person có thể đã ghi nhưng ID chưa persist được.
        // Không báo child=0 từ mảng IDs rỗng; resolve lại hoặc giữ residuals=null.
        personIds = await this.resolvePersons(this.pool, false)
        // Chỉ đếm own IDs, không so equality toàn bảng (run khác có thể đang seed/cleanup).
        const checks = [
          {
            table: 'public.users',
            column: 'id',
            ids: this.manifest.roots.map((r) => r.userId),
          },
          {
            table: 'personal.persons',
            column: 'user_id',
            ids: this.manifest.roots.map((r) => r.userId),
          },
          {
            table: 'public.sessions',
            column: 'user_id',
            ids: this.manifest.roots.map((r) => r.userId),
          },
          ...tables.map((table) => ({
            table,
            column: 'person_id',
            ids: personIds,
          })),
        ]
        const counts: Array<{ table: string; count: number }> = []
        for (const check of checks) {
          const result = await this.pool.query(
            `select count(*)::text as n from ${tableSQL(check.table)}
            where ${check.column} = any($1::uuid[])`,
            [check.ids],
          )
          const rows = CountRows.safeParse(result.rows)
          const count = rows.success ? Number(rows.data[0]?.n) : Number.NaN
          if (!Number.isSafeInteger(count) || count < 0) fail('INVALID_RESIDUAL_ROWS')
          counts.push({ table: check.table, count })
        }
        residuals = counts
        if (counts.some((item) => item.count !== 0)) reason ??= 'OWN_RESIDUALS_REMAIN'
      } catch {
        reason ??= 'RESIDUAL_QUERY_FAILED'
      }
    }
    if (reason === null) {
      this.manifest.state = 'clean'
      try {
        await this.persist()
      } catch {
        reason = 'MANIFEST_PERSIST_FAILED'
      }
    }
    const report: CleanupReport = {
      status: reason === null ? 'clean' : 'failed',
      residuals,
      reason,
    }
    if (reason !== null) throw new FixtureCleanupError(report)
    return report
  }
}

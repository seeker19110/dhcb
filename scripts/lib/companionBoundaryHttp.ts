// Harness registered HTTP trên DB disposable; không import server.ts.
import { createServer, request as nodeRequest } from 'node:http'
import type { Server } from 'node:http'
import { z } from 'zod'
import type { DisposableDatabaseTarget } from './companionBoundaryDb.js'
import type { BoundaryCase } from './companionBoundaryCorpus.js'

export type ProposalHttpInput = Extract<BoundaryCase, { kind: 'proposal_http' }>['input']
export type AllowPort = (port: number) => void | (() => void)
const inputSchema = z
  .object({
    actor: z.enum(['owner', 'other', 'none']),
    untrustedOrigin: z.boolean(),
    body: z.json(),
  })
  .strict()
const personSchema = z.object({ userId: z.uuid(), personId: z.uuid() }).strict()
const fixtureSchema = z
  .object({ owner: personSchema, other: personSchema, actionId: z.uuid() })
  .strict()
  .refine(
    (fixture) =>
      fixture.owner.userId !== fixture.other.userId &&
      fixture.owner.personId !== fixture.other.personId,
  )
export type HttpFixture = z.infer<typeof fixtureSchema>
export interface HttpObservation {
  status: number
  body: unknown
  parserRejected?: true
}
export interface BoundaryHttpHarness {
  observe(input: ProposalHttpInput, fixture: HttpFixture): Promise<HttpObservation>
  close(): Promise<void>
}
const errorCodes = [
  'ONE_SHOT_CHILD_REQUIRED',
  'UNSAFE_CHILD_ENV',
  'INVALID_TARGET',
  'INVALID_INPUT',
  'INVALID_FIXTURE',
  'RUNTIME_POOL_CONFIG_MISMATCH',
  'DATABASE_MISMATCH',
  'RUNTIME_SETUP_FAILED',
  'INVALID_LISTENER',
  'ALLOW_PORT_FAILED',
  'SESSION_CREATE_FAILED',
  'SESSION_LIMIT',
  'HARNESS_CLOSED',
  'OBSERVE_BUSY',
  'HTTP_TRANSPORT_FAILED',
  'HTTP_TIMEOUT',
  'HTTP_RESPONSE_LIMIT',
  'HTTP_INVALID_RESPONSE',
  'CLEANUP_FAILED',
] as const
export type BoundaryHttpErrorCode = (typeof errorCodes)[number]
export class BoundaryHttpError extends Error {
  readonly code: BoundaryHttpErrorCode
  constructor(code: BoundaryHttpErrorCode) {
    const safeCode = errorCodes.includes(code) ? code : 'HTTP_TRANSPORT_FAILED'
    super(`Boundary HTTP: ${safeCode}`)
    this.code = safeCode
    this.name = 'BoundaryHttpError'
  }
}
function fail(code: BoundaryHttpErrorCode): never {
  throw new BoundaryHttpError(code)
}

// Target phải do parser runner tạo trong cùng child.
// Target phải do parser parent tạo trong cùng child. Kiểm lại các endpoint fields trước dựng URL;
// tuyệt đối không nhận connectionString/URL query hoặc PG env làm defaults.
function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= 31 || code === 127) return true
  }
  return false
}
export function canonicalRuntimeUrl(target: DisposableDatabaseTarget): string {
  const config = target.poolConfig
  const profile = target.profile
  const expectedPort = profile === 'stored-local' ? 56543 : profile === 'github-ci' ? 5432 : null
  const expectedDatabase =
    profile === 'stored-local' ? 'dhcb_stored_test' : profile === 'github-ci' ? 'dhcb' : null
  if (
    !Object.isFrozen(target) ||
    !Object.isFrozen(config) ||
    !expectedPort ||
    !expectedDatabase ||
    target.database !== expectedDatabase ||
    config.database !== expectedDatabase ||
    config.port !== expectedPort ||
    typeof config.host !== 'string' ||
    !['localhost', '127.0.0.1', '::1'].includes(config.host) ||
    typeof config.user !== 'string' ||
    typeof config.password !== 'string' ||
    !config.user ||
    !config.password ||
    hasControlCharacter(config.user + config.password) ||
    config.connectionString !== undefined ||
    config.stream !== undefined ||
    config.ssl !== false
  )
    fail('INVALID_TARGET')
  const host = config.host === '::1' ? '[::1]' : config.host
  return `postgresql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${host}:${expectedPort}/${expectedDatabase}`
}

// Snapshot chỉ trong RAM. Caller đã scrub child trước import harness; scope scrub là lớp chặn thêm.
const scrubPattern =
  /^(?:PG|DATABASE_URL(?:_|$)|ANTHROPIC|OPENAI|GEMINI|GOOGLE|GROQ|ELEVEN|DEEPGRAM|REDIS|R2|SMTP|RESEND|SENDGRID|MAIL|EMAIL|SENTRY|VITE_SENTRY|SEPAY|AWS|AZURE|SUPABASE|MICROSOFT|FACEBOOK|APPLE|TWILIO|VAPID|ERASED_BENEFIT_LEDGER|ADMIN_USER_IDS|COOKIE_DOMAIN|SKIP_AUTH|NODE_APP_INSTANCE|RUNNER_ORIGINS)/
const ownedEnv = [
  'NODE_ENV',
  'VERCEL_ENV',
  'STORAGE_DRIVER',
  'ALLOWED_ORIGINS',
  'DATABASE_URL',
  'PG_POOL_MAX',
  'PG_CONNECT_TIMEOUT_MS',
  'PG_STATEMENT_TIMEOUT_MS',
  'PG_IDLE_IN_TRANSACTION_TIMEOUT_MS',
] as const
export function enterHttpEnvironment(
  environment: NodeJS.ProcessEnv,
  canonicalUrl: string,
): () => void {
  const keys = new Set([
    ...Object.keys(environment).filter((name) => scrubPattern.test(name)),
    ...ownedEnv,
  ])
  const previous = new Map([...keys].map((name) => [name, environment[name]]))
  for (const name of keys) delete environment[name]
  environment.NODE_ENV = 'test'
  environment.STORAGE_DRIVER = 'local'
  environment.DATABASE_URL = canonicalUrl
  environment.PG_POOL_MAX = '2'
  environment.PG_CONNECT_TIMEOUT_MS = '5000'
  environment.PG_STATEMENT_TIMEOUT_MS = '15000'
  environment.PG_IDLE_IN_TRANSACTION_TIMEOUT_MS = '15000'
  // Rỗng trước listen; không có trusted origin tạm thời ngoài own port.
  environment.ALLOWED_ORIGINS = ''
  return () => {
    for (const name of Object.keys(environment))
      if (scrubPattern.test(name) || keys.has(name)) delete environment[name]
    for (const [name, value] of previous) if (value !== undefined) environment[name] = value
  }
}
export function encodeCaseBody(input: ProposalHttpInput['body'], fixture: HttpFixture): string {
  const encoded = JSON.stringify(input, (_key, value: unknown) =>
    value === '$ACTION_ID'
      ? fixture.actionId
      : value === '$OTHER_PERSON_ID'
        ? fixture.other.personId
        : value,
  )
  if (encoded === undefined) return fail('INVALID_INPUT')
  return encoded
}

export interface RuntimePool {
  matchesCanonicalConfiguration(): boolean
  currentDatabaseRows(): Promise<unknown>
  end(): Promise<void>
}
export interface BoundServer {
  address: string
  port: number
  close(): Promise<void>
}
export interface RuntimeApplication {
  createSession(userId: string): Promise<string>
  listen(): Promise<BoundServer>
}
export interface RawHttpRequest {
  port: number
  origin: string
  cookie?: string
  body: string
}
export interface RawHttpResponse {
  status: number
  rawBody: string
  contentType?: string
}
export interface HarnessDependencies {
  environment: NodeJS.ProcessEnv
  openRuntimePool(canonicalUrl: string): Promise<RuntimePool>
  loadApplication(): Promise<RuntimeApplication>
  send(request: RawHttpRequest): Promise<RawHttpResponse>
}

// DEBT: harness giữ token/response hữu hạn | trần: 64 sessions RAM, 1 observe, HTTP 15s và response 1 MiB | xem lại khi: corpus A07 vượt ngân sách hiện tại
/** Seam unit-only: fake dependencies không chứng minh registered API/cookie auth/PG authority. */
export function createBoundaryHttpHarnessFactory(dependencies: HarnessDependencies) {
  let attempted = false
  return async (
    target: DisposableDatabaseTarget,
    allowPort: AllowPort,
  ): Promise<BoundaryHttpHarness> => {
    if (attempted) return fail('ONE_SHOT_CHILD_REQUIRED')
    attempted = true
    // HTTP debug có thể ghi Cookie; phải scrub trước spawn, không chỉ sau khi module đã cache.
    if (
      ['NODE_DEBUG', 'NODE_DEBUG_NATIVE', 'DEBUG'].some((name) =>
        dependencies.environment[name]?.trim(),
      )
    )
      return fail('UNSAFE_CHILD_ENV')
    if (
      target.profile === 'github-ci' &&
      (dependencies.environment.CI !== 'true' || dependencies.environment.GITHUB_ACTIONS !== 'true')
    )
      return fail('INVALID_TARGET')
    const canonicalUrl = canonicalRuntimeUrl(target)
    const restore = enterHttpEnvironment(dependencies.environment, canonicalUrl)
    let pool: RuntimePool | undefined
    let server: BoundServer | undefined
    let revokePort: (() => void) | undefined
    let application: RuntimeApplication | undefined
    let closed = false
    let closing: Promise<void> | undefined
    let active: Promise<HttpObservation> | undefined
    const sessions = new Map<string, string>()
    const cleanup = async () => {
      let failed = false
      try {
        await server?.close()
      } catch {
        failed = true
      }
      try {
        revokePort?.()
      } catch {
        failed = true
      }
      try {
        await pool?.end()
      } catch {
        failed = true
      }
      sessions.clear()
      try {
        restore()
      } catch {
        failed = true
      }
      if (failed) fail('CLEANUP_FAILED')
    }
    try {
      const candidate = await dependencies.openRuntimePool(canonicalUrl)
      // Không query/end một cached pool không khớp; dedicated child phải dừng sau lỗi này.
      if (!candidate.matchesCanonicalConfiguration()) fail('RUNTIME_POOL_CONFIG_MISMATCH')
      pool = candidate
      const databaseRows = z
        .array(z.object({ database: z.string() }).strict())
        .length(1)
        .safeParse(await pool.currentDatabaseRows())
      if (!databaseRows.success || databaseRows.data[0]?.database !== target.database)
        fail('DATABASE_MISMATCH')
      application = await dependencies.loadApplication()
      server = await application.listen()
      if (
        server.address !== '127.0.0.1' ||
        !Number.isInteger(server.port) ||
        server.port < 1 ||
        server.port > 65535
      )
        fail('INVALID_LISTENER')
      try {
        revokePort = allowPort(server.port) ?? undefined
      } catch {
        fail('ALLOW_PORT_FAILED')
      }
      dependencies.environment.ALLOWED_ORIGINS = `http://127.0.0.1:${server.port}`
    } catch (error) {
      try {
        await cleanup()
      } catch {
        return fail('CLEANUP_FAILED')
      }
      if (error instanceof BoundaryHttpError) throw error
      return fail('RUNTIME_SETUP_FAILED')
    }
    const boundServer = server
    const app = application
    if (!boundServer || !app) {
      await cleanup()
      return fail('RUNTIME_SETUP_FAILED')
    }
    return {
      observe(rawInput, rawFixture) {
        if (closed) return Promise.reject(new BoundaryHttpError('HARNESS_CLOSED'))
        if (active) return Promise.reject(new BoundaryHttpError('OBSERVE_BUSY'))
        const operation = async (): Promise<HttpObservation> => {
          const parsedInput = inputSchema.safeParse(rawInput)
          if (!parsedInput.success) return fail('INVALID_INPUT')
          const parsedFixture = fixtureSchema.safeParse(rawFixture)
          if (!parsedFixture.success) return fail('INVALID_FIXTURE')
          const input = parsedInput.data
          const fixture = parsedFixture.data
          // z.json() clone bỏ own __proto__; validation không được sửa body dùng kiểm API.
          // Chốt raw JSON ngay trước await session để caller không đổi payload giữa chừng.
          const encodedBody = encodeCaseBody(rawInput.body, fixture)
          const primitiveBody = rawInput.body === null || typeof rawInput.body !== 'object'
          let cookie: string | undefined
          if (input.actor !== 'none') {
            const userId = fixture[input.actor].userId
            let token = sessions.get(userId)
            if (token === undefined) {
              if (sessions.size >= 64) return fail('SESSION_LIMIT')
              try {
                token = await app.createSession(userId)
              } catch {
                return fail('SESSION_CREATE_FAILED')
              }
              if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return fail('SESSION_CREATE_FAILED')
              sessions.set(userId, token)
            }
            cookie = `session_token=${token}`
          }
          let result: RawHttpResponse
          try {
            result = await dependencies.send({
              port: boundServer.port,
              origin: input.untrustedOrigin
                ? 'https://untrusted.invalid'
                : `http://127.0.0.1:${boundServer.port}`,
              ...(cookie ? { cookie } : {}),
              body: encodedBody,
            })
          } catch (error) {
            if (error instanceof BoundaryHttpError) throw error
            return fail('HTTP_TRANSPORT_FAILED')
          }
          if (!Number.isInteger(result.status) || result.status < 100 || result.status > 599)
            return fail('HTTP_INVALID_RESPONSE')
          let body: unknown
          try {
            body = JSON.parse(result.rawBody)
          } catch {
            // express.json strict chặn JSON primitive trước handler, trả HTML400.
            // Chỉ ghi nhận đúng dạng middleware này; 200/nonprimitive/nonHTML vẫn fail closed.
            if (
              result.status === 400 &&
              primitiveBody &&
              /^text\/html(?:;|$)/i.test(result.contentType ?? '')
            )
              return { status: 400, body: null, parserRejected: true }
            return fail('HTTP_INVALID_RESPONSE')
          }
          // Không tự diễn giải body/status thành passed hay chạy service confirm thay handler.
          return { status: result.status, body }
        }
        active = operation()
        const operationPromise = active
        void operationPromise.then(
          () => {
            if (active === operationPromise) active = undefined
          },
          () => {
            if (active === operationPromise) active = undefined
          },
        )
        return operationPromise
      },
      close() {
        if (closing) return closing
        closed = true
        closing = (async () => {
          if (active) await active.catch(() => undefined)
          await cleanup()
        })()
        return closing
      },
    }
  }
}

// Không dùng fetch: ledger provider parent vẫn deny-by-default/fake dispatcher riêng.
export function sendNativeHttp(request: RawHttpRequest): Promise<RawHttpResponse> {
  return new Promise((resolve, reject) => {
    let settled = false
    let responseBytes = 0
    const chunks: Buffer[] = []
    const finishError = (code: BoundaryHttpErrorCode) => {
      if (!settled) {
        settled = true
        clearTimeout(deadline)
        reject(new BoundaryHttpError(code))
      }
    }
    const call = nodeRequest(
      {
        hostname: '127.0.0.1',
        port: request.port,
        method: 'PATCH',
        path: '/api/proposed-actions',
        agent: false,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(request.body),
          Origin: request.origin,
          ...(request.cookie ? { Cookie: request.cookie } : {}),
        },
      },
      (response) => {
        response.on('data', (chunk: Buffer) => {
          if (settled) return
          responseBytes += chunk.byteLength
          if (responseBytes > 1_048_576) {
            finishError('HTTP_RESPONSE_LIMIT')
            response.destroy()
            call.destroy()
            return
          }
          chunks.push(chunk)
        })
        response.once('error', () => finishError('HTTP_TRANSPORT_FAILED'))
        response.once('aborted', () => finishError('HTTP_TRANSPORT_FAILED'))
        response.once('end', () => {
          if (settled) return
          settled = true
          clearTimeout(deadline)
          resolve({
            status: response.statusCode ?? 0,
            rawBody: Buffer.concat(chunks).toString('utf8'),
            ...(typeof response.headers?.['content-type'] === 'string'
              ? { contentType: response.headers['content-type'] }
              : {}),
          })
        })
      },
    )
    const deadline = setTimeout(() => {
      finishError('HTTP_TIMEOUT')
      call.destroy()
    }, 15_000)
    deadline.unref()
    call.once('error', () => finishError('HTTP_TRANSPORT_FAILED'))
    call.end(request.body)
  })
}

async function closeNativeServer(server: Server): Promise<void> {
  if (!server.listening) return
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
    server.closeIdleConnections()
  })
}
const defaultFactory = createBoundaryHttpHarnessFactory({
  environment: process.env,
  async openRuntimePool(canonicalUrl) {
    const { getPgPool } = await import('@dhcb/core-db/pgPool')
    const pool = getPgPool()
    return {
      matchesCanonicalConfiguration: () =>
        pool.options.connectionString === canonicalUrl &&
        pool.options.max === 2 &&
        pool.options.connectionTimeoutMillis === 5000 &&
        pool.options.statement_timeout === 15000 &&
        pool.options.idle_in_transaction_session_timeout === 15000,
      currentDatabaseRows: async () =>
        (await pool.query('select current_database() as database')).rows,
      end: () => pool.end(),
    }
  },
  async loadApplication() {
    const expressModule = await import('express')
    const { createSession } = await import('@dhcb/core-auth/authService')
    // Relative path của module sau khi parent đưa vào scripts/lib; không import server.ts.
    const routePath = new URL('../../apps/server/src/routes.js', import.meta.url).href
    const { registerApiRoutes } = (await import(routePath)) as {
      registerApiRoutes: (app: import('express').Express) => void
    }
    const app = expressModule.default()
    registerApiRoutes(app)
    const server = createServer(app)
    return {
      createSession,
      listen: async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            const failed = (error: Error) => {
              server.off('listening', ready)
              reject(error)
            }
            const ready = () => {
              server.off('error', failed)
              resolve()
            }
            server.once('error', failed)
            server.once('listening', ready)
            server.listen(0, '127.0.0.1')
          })
          const address = server.address()
          if (!address || typeof address === 'string') return fail('INVALID_LISTENER')
          return {
            address: address.address,
            port: address.port,
            close: () => closeNativeServer(server),
          }
        } catch (error) {
          await closeNativeServer(server)
          throw error
        }
      },
    }
  },
  send: sendNativeHttp,
})
export const createBoundaryHttpHarness = defaultFactory

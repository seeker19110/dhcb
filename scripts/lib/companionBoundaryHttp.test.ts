// @vitest-environment node
import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const httpState = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('node:http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:http')>()
  const createServer = vi.fn(() => {
    throw new Error('NO_LIVE_HTTP_ALLOWED')
  })
  return {
    ...actual,
    request: httpState.request,
    createServer,
    default: { ...actual, request: httpState.request, createServer },
  }
})
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: vi.fn(() => {
    throw new Error('NO_DB_ALLOWED')
  }),
}))
vi.mock('@dhcb/core-db/transaction', () => ({
  withTransaction: vi.fn(() => {
    throw new Error('NO_DB_ALLOWED')
  }),
}))
import { parseDisposableDatabase } from './companionBoundaryDb.js'
import {
  canonicalRuntimeUrl,
  createBoundaryHttpHarnessFactory,
  encodeCaseBody,
  sendNativeHttp,
  BoundaryHttpError,
  type HarnessDependencies,
  type RawHttpRequest,
  type RawHttpResponse,
  type ProposalHttpInput,
  type HttpFixture,
} from './companionBoundaryHttp.js'

const tokenOwner = 'a'.repeat(43)
const tokenOther = 'b'.repeat(43)
const target = () =>
  parseDisposableDatabase(
    'postgresql://synthetic:synthetic@127.0.0.1:56543/dhcb_stored_test',
    'stored-local',
    {},
  )
const fixture = (): HttpFixture => ({
  owner: { userId: randomUUID(), personId: randomUUID() },
  other: { userId: randomUUID(), personId: randomUUID() },
  actionId: randomUUID(),
})
const input = (extra: Partial<ProposalHttpInput> = {}): ProposalHttpInput => ({
  actor: 'owner',
  untrustedOrigin: false,
  body: { id: '$ACTION_ID', action: 'confirm', expectedVersion: 1 },
  ...extra,
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function setup() {
  const order: string[] = []
  const sent: RawHttpRequest[] = []
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    DATABASE_URL: 'SYNTHETIC_DB_CANARY',
    OPENAI_API_KEY: 'SYNTHETIC_KEY_CANARY',
    PGHOST: 'forbidden.invalid',
    SKIP_AUTH: 'true',
    REDIS_URL: 'SYNTHETIC_REDIS',
    ALLOWED_ORIGINS: 'https://forbidden.invalid',
    KEEP_NON_SECRET: 'keep',
  }
  const original = { ...environment }
  const matches = vi.fn(() => true)
  const databaseRows = vi.fn(async (): Promise<unknown> => [{ database: 'dhcb_stored_test' }])
  const poolEnd = vi.fn(async () => {
    order.push('pool.end')
  })
  const serverClose = vi.fn(async () => {
    order.push('server.close')
  })
  const createSession = vi.fn(async (userId: string) => {
    order.push('session:' + userId)
    return tokenOwner
  })
  const send = vi.fn(async (request: RawHttpRequest): Promise<RawHttpResponse> => {
    order.push('send')
    sent.push(request)
    return { status: 200, rawBody: '{"action":{"status":"committed","version":2}}' }
  })
  const loadApplication = vi.fn(async () => {
    order.push('loadApp')
    return {
      createSession,
      listen: vi.fn(async () => {
        order.push('listen')
        return { address: '127.0.0.1', port: 41999, close: serverClose }
      }),
    }
  })
  const deps: HarnessDependencies = {
    environment,
    openRuntimePool: vi.fn(async (url) => {
      order.push('openPool')
      expect(environment.OPENAI_API_KEY).toBeUndefined()
      expect(environment.PGHOST).toBeUndefined()
      expect(environment.SKIP_AUTH).toBeUndefined()
      expect(environment.DATABASE_URL).toBe(url)
      expect(environment.NODE_ENV).toBe('test')
      expect(environment.ALLOWED_ORIGINS).toBe('')
      return {
        matchesCanonicalConfiguration: matches,
        currentDatabaseRows: async () => {
          order.push('current_database')
          return databaseRows()
        },
        end: poolEnd,
      }
    }),
    loadApplication,
    send,
  }
  const revoke = vi.fn(() => {
    order.push('revoke')
  })
  const allow = vi.fn((port: number) => {
    expect(port).toBe(41999)
    order.push('allow')
    return revoke
  })
  const create = createBoundaryHttpHarnessFactory(deps)
  return {
    deps,
    create,
    allow,
    revoke,
    order,
    sent,
    environment,
    original,
    matches,
    databaseRows,
    poolEnd,
    serverClose,
    createSession,
    send,
    loadApplication,
  }
}
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('FETCH_DENIED')
    }),
  )
})
afterEach(() => {
  vi.useRealTimers()
  expect(fetch).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
  httpState.request.mockReset()
})

describe('canonical target và môi trường', () => {
  it('URL chỉ dựng từ target parser, localhost port/database cố định', () => {
    expect(canonicalRuntimeUrl(target())).toBe(
      'postgresql://synthetic:synthetic@127.0.0.1:56543/dhcb_stored_test',
    )
    const ipv6 = parseDisposableDatabase(
      'postgres://u:p@[::1]:56543/dhcb_stored_test',
      'stored-local',
      {},
    )
    expect(canonicalRuntimeUrl(ipv6)).toBe('postgresql://u:p@[::1]:56543/dhcb_stored_test')
  })
  it('credential chứa %, @, colon roundtrip không normalize mất nghĩa', () => {
    const user = 'name%40:@'
    const password = 'pass%25:@'
    const parsed = parseDisposableDatabase(
      `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@localhost:56543/dhcb_stored_test`,
      'stored-local',
      {},
    )
    const url = new URL(canonicalRuntimeUrl(parsed))
    expect(decodeURIComponent(url.username)).toBe(user)
    expect(decodeURIComponent(url.password)).toBe(password)
  })
  it('github-ci target phải qua actual parser CI profile guard', () => {
    const parsed = parseDisposableDatabase('postgresql://u:p@127.0.0.1:5432/dhcb', 'github-ci', {
      CI: 'true',
      GITHUB_ACTIONS: 'true',
    })
    expect(canonicalRuntimeUrl(parsed)).toBe('postgresql://u:p@127.0.0.1:5432/dhcb')
  })
  it('harness từ chối github-ci target khi child không có CI flags', async () => {
    const s = setup()
    const ciTarget = parseDisposableDatabase('postgresql://u:p@127.0.0.1:5432/dhcb', 'github-ci', {
      CI: 'true',
      GITHUB_ACTIONS: 'true',
    })
    await expect(s.create(ciTarget, s.allow)).rejects.toMatchObject({ code: 'INVALID_TARGET' })
    expect(s.deps.openRuntimePool).not.toHaveBeenCalled()
    expect(s.environment).toEqual(s.original)
  })
  it('canonical defense từ chối host đã bị thay trên frozen target', () => {
    const parsed = target()
    const replaced = Object.freeze({
      ...parsed,
      poolConfig: Object.freeze({
        ...parsed.poolConfig,
        password: parsed.poolConfig.password,
        host: 'forbidden.invalid',
      }),
    })
    expect(() => canonicalRuntimeUrl(replaced)).toThrow('INVALID_TARGET')
  })
  it('debug flags còn trong child bị chặn trước pool/import/session', async () => {
    const s = setup()
    s.environment.NODE_DEBUG = 'http'
    await expect(s.create(target(), s.allow)).rejects.toMatchObject({ code: 'UNSAFE_CHILD_ENV' })
    expect(s.deps.openRuntimePool).not.toHaveBeenCalled()
    expect(s.createSession).not.toHaveBeenCalled()
  })
  it('scrub trước pool/app import, actual database preflight trước load app/listen/allow', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    expect(s.order).toEqual(['openPool', 'current_database', 'loadApp', 'listen', 'allow'])
    expect(s.environment.ALLOWED_ORIGINS).toBe('http://127.0.0.1:41999')
    expect(s.createSession).not.toHaveBeenCalled()
    expect(s.send).not.toHaveBeenCalled()
    await h.close()
    expect(s.environment).toEqual(s.original)
  })
  it('runtime pool không khớp: không query/end pool lạ, không import app', async () => {
    const s = setup()
    s.matches.mockReturnValue(false)
    await expect(s.create(target(), s.allow)).rejects.toMatchObject({
      code: 'RUNTIME_POOL_CONFIG_MISMATCH',
    })
    expect(s.databaseRows).not.toHaveBeenCalled()
    expect(s.poolEnd).not.toHaveBeenCalled()
    expect(s.loadApplication).not.toHaveBeenCalled()
    expect(s.environment).toEqual(s.original)
  })
  it.each([
    { rows: [{ database: 'production' }] },
    { rows: [] },
    { rows: [{ database: 'dhcb_stored_test', extra: 'bad' }] },
  ])('actual database rows mismatch %j chặn app', async ({ rows }) => {
    const s = setup()
    s.databaseRows.mockResolvedValue(rows)
    await expect(s.create(target(), s.allow)).rejects.toMatchObject({ code: 'DATABASE_MISMATCH' })
    expect(s.loadApplication).not.toHaveBeenCalled()
    expect(s.poolEnd).toHaveBeenCalledOnce()
    expect(s.environment).toEqual(s.original)
  })
  it('query/import error không xuất cause/URL/provider canary', async () => {
    const s = setup()
    s.databaseRows.mockRejectedValue(new Error('PRIVATE_DB_CANARY'))
    let error: unknown
    try {
      await s.create(target(), s.allow)
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(BoundaryHttpError)
    expect(String(error)).toBe('BoundaryHttpError: Boundary HTTP: RUNTIME_SETUP_FAILED')
    expect(JSON.stringify(error)).not.toContain('PRIVATE_DB_CANARY')
    expect(s.poolEnd).toHaveBeenCalledOnce()
    expect(s.environment).toEqual(s.original)
  })
})

describe('observe giữ nguyên boundary input, không giả oracle', () => {
  it('owner cookie actual session service seam + Origin exact; body placeholders exact', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    const f = fixture()
    const result = await h.observe(
      input({
        body: {
          id: '$ACTION_ID',
          action: 'confirm',
          expectedVersion: 1,
          personId: '$OTHER_PERSON_ID',
          status: 'committed',
          nested: ['$ACTION_ID', 'x$ACTION_ID', { $ACTION_ID: '$OTHER_PERSON_ID' }],
        },
      }),
      f,
    )
    expect(s.createSession).toHaveBeenCalledWith(f.owner.userId)
    expect(s.sent[0]).toMatchObject({
      port: 41999,
      origin: 'http://127.0.0.1:41999',
      cookie: 'session_token=' + tokenOwner,
    })
    const sentBody: unknown = JSON.parse(s.sent[0]?.body ?? '')
    expect(sentBody).toEqual({
      id: f.actionId,
      action: 'confirm',
      expectedVersion: 1,
      personId: f.other.personId,
      status: 'committed',
      nested: [f.actionId, 'x$ACTION_ID', { $ACTION_ID: f.other.personId }],
    })
    expect(result).toEqual({ status: 200, body: { action: { status: 'committed', version: 2 } } })
    expect(Object.keys(result)).toEqual(['status', 'body'])
    await h.close()
  })
  it('raw JSON own __proto__ extra không bị Zod clone lọc trước API', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    const body = JSON.parse(
      '{"id":"$ACTION_ID","action":"confirm","expectedVersion":1,"__proto__":{"synthetic":"$OTHER_PERSON_ID"}}',
    )
    const f = fixture()
    await h.observe(input({ body }), f)
    const sent: unknown = JSON.parse(s.sent[0]?.body ?? '')
    expect(typeof sent === 'object' && sent !== null && Object.hasOwn(sent, '__proto__')).toBe(true)
    expect(JSON.stringify(sent)).toContain('"__proto__":{"synthetic":"' + f.other.personId + '"}')
    await h.close()
  })
  it('other cookie lấy other user, không sửa action sang other ID', async () => {
    const s = setup()
    s.createSession.mockResolvedValue(tokenOther)
    s.send.mockResolvedValue({ status: 404, rawBody: '{"error":"not found"}' })
    const h = await s.create(target(), s.allow)
    const f = fixture()
    await h.observe(input({ actor: 'other' }), f)
    expect(s.createSession).toHaveBeenCalledWith(f.other.userId)
    expect(s.sent).toEqual([]) // mocked send implementation intentionally replaced
    expect(s.send.mock.calls[0]?.[0].cookie).toBe('session_token=' + tokenOther)
    expect(JSON.parse(s.send.mock.calls[0]?.[0].body ?? '')).toMatchObject({ id: f.actionId })
    await h.close()
  })
  it('none không gửi Cookie, không tạo session dù cache owner có sẵn', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    const f = fixture()
    await h.observe(input(), f)
    await h.observe(input({ actor: 'none' }), f)
    expect(s.createSession).toHaveBeenCalledTimes(1)
    expect(s.sent[1]).not.toHaveProperty('cookie')
    await h.close()
  })
  it('bad origin chỉ header .invalid, port luôn own loopback', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    await h.observe(input({ untrustedOrigin: true }), fixture())
    expect(s.sent[0]).toMatchObject({ port: 41999, origin: 'https://untrusted.invalid' })
    await h.close()
  })
  it.each([200, 400, 401, 403, 404, 409, 500])(
    'status %i passthrough từ HTTP, không hardcode expected',
    async (status) => {
      const s = setup()
      s.send.mockResolvedValue({ status, rawBody: '{"independent":"body"}' })
      const h = await s.create(target(), s.allow)
      expect(await h.observe(input(), fixture())).toEqual({ status, body: { independent: 'body' } })
      await h.close()
    },
  )
  it('strict input/fixture không lọc body extra fields, malformed fixture chặn send', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    const f = fixture()
    const malformed = { ...input(), unexpected: true }
    await expect(h.observe(malformed, f)).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    await expect(h.observe(input(), { ...f, other: f.owner })).rejects.toMatchObject({
      code: 'INVALID_FIXTURE',
    })
    expect(s.send).not.toHaveBeenCalled()
    await h.close()
  })
  it('opaque token không hợp lệ/có header injection bị chặn, không xuất token', async () => {
    const s = setup()
    s.createSession.mockResolvedValue('PRIVATE_TOKEN_CANARY\r\nmalicious')
    const h = await s.create(target(), s.allow)
    await expect(h.observe(input(), fixture())).rejects.toMatchObject({
      code: 'SESSION_CREATE_FAILED',
    })
    expect(s.send).not.toHaveBeenCalled()
    await h.close()
  })
  it('same actor reuse RAM session, owner/other session tách', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    const f = fixture()
    await h.observe(input(), f)
    await h.observe(input(), f)
    await h.observe(input({ actor: 'other' }), f)
    expect(s.createSession.mock.calls.map(([id]) => id)).toEqual([f.owner.userId, f.other.userId])
    await h.close()
  })
  it('HTTP exception không thành 401/404/409 hoặc chứa raw exception', async () => {
    const s = setup()
    s.send.mockRejectedValue(new Error('PRIVATE_HTTP_CANARY'))
    const h = await s.create(target(), s.allow)
    await expect(h.observe(input(), fixture())).rejects.toMatchObject({
      code: 'HTTP_TRANSPORT_FAILED',
    })
    await h.close()
  })
  it('invalid JSON không thành parsed body hợp lệ', async () => {
    const s = setup()
    s.send.mockResolvedValue({ status: 200, rawBody: 'PRIVATE_NON_JSON' })
    const h = await s.create(target(), s.allow)
    await expect(h.observe(input(), fixture())).rejects.toMatchObject({
      code: 'HTTP_INVALID_RESPONSE',
    })
    await h.close()
  })
  it.each(['literal', null])(
    'HTML400 primitive do strict JSON middleware được ghi nhận, state oracle vẫn độc lập',
    async (body) => {
      const s = setup()
      s.send.mockResolvedValue({
        status: 400,
        rawBody: '<html>Bad Request</html>',
        contentType: 'text/html; charset=utf-8',
      })
      const h = await s.create(target(), s.allow)
      await expect(h.observe(input({ body }), fixture())).resolves.toEqual({
        status: 400,
        body: null,
        parserRejected: true,
      })
      await h.close()
    },
  )
  it.each([
    { body: { extra: true }, status: 400, contentType: 'text/html' },
    { body: 'literal', status: 200, contentType: 'text/html' },
    { body: null, status: 400, contentType: 'application/json' },
  ])('nonJSON không đúng primitive strict400 vẫn crash %j', async (variant) => {
    const s = setup()
    s.send.mockResolvedValue({
      status: variant.status,
      rawBody: 'invalid',
      contentType: variant.contentType,
    })
    const h = await s.create(target(), s.allow)
    await expect(h.observe(input({ body: variant.body }), fixture())).rejects.toMatchObject({
      code: 'HTTP_INVALID_RESPONSE',
    })
    await h.close()
  })
  it('đóng băng primitive eligibility cùng raw body trước await session', async () => {
    const s = setup()
    s.send.mockResolvedValue({
      status: 400,
      rawBody: '<html>Bad Request</html>',
      contentType: 'text/html',
    })
    const h = await s.create(target(), s.allow)
    const raw = input({ body: { extra: true } })
    const pending = h.observe(raw, fixture())
    raw.body = null
    await expect(pending).rejects.toMatchObject({ code: 'HTTP_INVALID_RESPONSE' })
    expect(s.send.mock.calls[0]?.[0].body).toBe('{"extra":true}')
    await h.close()
  })
  it('JSON primitive/array vẫn đi nguyên tới parser production sau này', () => {
    const f = fixture()
    expect(encodeCaseBody(['$ACTION_ID', 1, null], f)).toBe(JSON.stringify([f.actionId, 1, null]))
    expect(encodeCaseBody('literal', f)).toBe('"literal"')
  })
})

describe('close/setup isolation', () => {
  it('close idempotent, chờ observe và cấm observe mới, server→port→pool→env', async () => {
    const s = setup()
    const response = deferred<RawHttpResponse>()
    s.send.mockReturnValue(response.promise)
    const h = await s.create(target(), s.allow)
    const observation = h.observe(input(), fixture())
    await Promise.resolve()
    const close = h.close()
    const again = h.close()
    expect(close).toBe(again)
    expect(s.serverClose).not.toHaveBeenCalled()
    await expect(h.observe(input(), fixture())).rejects.toMatchObject({ code: 'HARNESS_CLOSED' })
    response.resolve({ status: 200, rawBody: '{}' })
    await observation
    await close
    expect(s.order.slice(-3)).toEqual(['server.close', 'revoke', 'pool.end'])
    expect(s.environment).toEqual(s.original)
  })
  it('concurrent observe bị chặn, không gửi duplicate request', async () => {
    const s = setup()
    const response = deferred<RawHttpResponse>()
    s.send.mockReturnValue(response.promise)
    const h = await s.create(target(), s.allow)
    const first = h.observe(input(), fixture())
    await expect(h.observe(input(), fixture())).rejects.toMatchObject({ code: 'OBSERVE_BUSY' })
    response.resolve({ status: 200, rawBody: '{}' })
    await first
    await h.close()
    expect(s.send).toHaveBeenCalledTimes(1)
  })
  it('allowPort throw vẫn đóng server/pool và restore env', async () => {
    const s = setup()
    await expect(
      s.create(target(), () => {
        throw new Error('PRIVATE_ALLOW_CANARY')
      }),
    ).rejects.toMatchObject({ code: 'ALLOW_PORT_FAILED' })
    expect(s.serverClose).toHaveBeenCalledOnce()
    expect(s.poolEnd).toHaveBeenCalledOnce()
    expect(s.environment).toEqual(s.original)
  })
  it('cleanup lỗi vẫn đóng pool và restore, report fixed failure', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    s.serverClose.mockRejectedValue(new Error('PRIVATE_CLOSE_CANARY'))
    await expect(h.close()).rejects.toMatchObject({ code: 'CLEANUP_FAILED' })
    expect(s.poolEnd).toHaveBeenCalledOnce()
    expect(s.environment).toEqual(s.original)
  })
  it('one-shot kể cả sau close, không mở cached pool lại', async () => {
    const s = setup()
    const h = await s.create(target(), s.allow)
    await h.close()
    await expect(s.create(target(), s.allow)).rejects.toMatchObject({
      code: 'ONE_SHOT_CHILD_REQUIRED',
    })
    expect(s.deps.openRuntimePool).toHaveBeenCalledTimes(1)
  })
})

describe('native http adapter unit fake, KHÔNG live HTTP/auth proof', () => {
  function wire() {
    const response = new EventEmitter()
    const destroyResponse = vi.fn()
    Object.assign(response, { statusCode: 403, destroy: destroyResponse })
    const call = new EventEmitter()
    const destroyCall = vi.fn()
    const end = vi.fn()
    Object.assign(call, { end, destroy: destroyCall })
    httpState.request.mockImplementation(
      (_options: unknown, callback: (response: EventEmitter) => void) => {
        queueMicrotask(() => callback(response))
        return call
      },
    )
    return { response, call, end, destroyCall, destroyResponse }
  }
  it('native request exact PATCH/path/port/noBearer và không fetch/redirect', async () => {
    const f = wire()
    const pending = sendNativeHttp({
      port: 41999,
      origin: 'http://127.0.0.1:41999',
      cookie: 'session_token=' + tokenOwner,
      body: '{"text":"Việt"}',
    })
    await Promise.resolve()
    f.response.emit('data', Buffer.from('{"error":"blocked"}'))
    f.response.emit('end')
    await expect(pending).resolves.toEqual({ status: 403, rawBody: '{"error":"blocked"}' })
    expect(httpState.request.mock.calls[0]?.[0]).toMatchObject({
      hostname: '127.0.0.1',
      port: 41999,
      method: 'PATCH',
      path: '/api/proposed-actions',
      agent: false,
    })
    const requestOptions: unknown = httpState.request.mock.calls[0]?.[0]
    expect(JSON.stringify(requestOptions)).not.toContain('Authorization')
    expect(f.end).toHaveBeenCalledWith('{"text":"Việt"}')
  })
  it('native adapter giữ Content-Type cho oracle strict parser400', async () => {
    const f = wire()
    Object.assign(f.response, {
      statusCode: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
    const pending = sendNativeHttp({ port: 41999, origin: 'http://127.0.0.1:41999', body: 'null' })
    await Promise.resolve()
    f.response.emit('data', Buffer.from('<html>Bad Request</html>'))
    f.response.emit('end')
    await expect(pending).resolves.toEqual({
      status: 400,
      rawBody: '<html>Bad Request</html>',
      contentType: 'text/html; charset=utf-8',
    })
  })
  it('response body overflow destroy và fixed error, không nhận mẩu sau', async () => {
    const f = wire()
    const pending = sendNativeHttp({ port: 41999, origin: 'https://untrusted.invalid', body: '{}' })
    const assertion = expect(pending).rejects.toMatchObject({ code: 'HTTP_RESPONSE_LIMIT' })
    await Promise.resolve()
    f.response.emit('data', Buffer.alloc(1_048_577))
    f.response.emit('data', Buffer.from('late'))
    f.response.emit('end')
    await assertion
    expect(f.destroyResponse).toHaveBeenCalledOnce()
    expect(f.destroyCall).toHaveBeenCalledOnce()
  })
  it('timeout tuyệt đối 15s, destroy request, không raw error', async () => {
    vi.useFakeTimers()
    const f = wire()
    const pending = sendNativeHttp({ port: 41999, origin: 'http://127.0.0.1:41999', body: '{}' })
    const assertion = expect(pending).rejects.toMatchObject({ code: 'HTTP_TIMEOUT' })
    await vi.advanceTimersByTimeAsync(15_000)
    await assertion
    expect(f.destroyCall).toHaveBeenCalledOnce()
  })
  it('partial/aborted response không trả status như thể completed', async () => {
    const f = wire()
    const pending = sendNativeHttp({ port: 41999, origin: 'http://127.0.0.1:41999', body: '{}' })
    const assertion = expect(pending).rejects.toMatchObject({ code: 'HTTP_TRANSPORT_FAILED' })
    await Promise.resolve()
    f.response.emit('data', Buffer.from('{"half":'))
    f.response.emit('aborted')
    await assertion
  })
})

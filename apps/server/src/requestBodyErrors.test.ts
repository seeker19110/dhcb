// @vitest-environment node
// Parser Express và HTTP loopback thật; không gọi handler AI, SMTP, storage hoặc CSDL.
import { createServer, request as httpRequest, type IncomingHttpHeaders } from 'node:http'
import express from 'express'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerApiRoutes } from './routes.js'

const sentry = vi.hoisted(() => ({ captureServerException: vi.fn() }))
vi.mock('./api/_lib/sentry.js', () => sentry)

const trustedOrigin = 'https://donghanhcungban.org'
const privateBody = '{"password":"FAKE_PASSWORD_MARKER","token":"FAKE_TOKEN_MARKER",'

interface HttpResult {
  status: number | undefined
  headers: IncomingHttpHeaders
  body: string
}

async function withApiServer<T>(
  action: (
    send: (path: string, body: string, headers?: Record<string, string>) => Promise<HttpResult>,
  ) => Promise<T>,
  setup: (app: express.Express) => void = () => {},
  afterRoutes: (app: express.Express) => void = () => {},
) {
  const app = express()
  setup(app)
  registerApiRoutes(app)
  app.post('/api/body-errors-test', (req, res) => res.status(201).json({ received: req.body }))
  afterRoutes(app)
  const server = createServer(app)
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('TEST_NO_HTTP_ADDRESS')
  const port = address.port

  async function send(path: string, body: string, headers: Record<string, string> = {}) {
    const result = await new Promise<HttpResult>((resolve, reject) => {
      const request = httpRequest(
        {
          hostname: '127.0.0.1',
          port,
          method: 'POST',
          path,
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
            origin: trustedOrigin,
            ...headers,
          },
        },
        (response) => {
          const chunks: Buffer[] = []
          response.on('data', (chunk: Buffer) => chunks.push(chunk))
          response.on('error', reject)
          response.on('end', () =>
            resolve({
              status: response.statusCode,
              headers: response.headers,
              body: Buffer.concat(chunks).toString('utf8'),
            }),
          )
        },
      )
      request.on('error', reject)
      request.end(body)
    })
    // finalhandler ghi lỗi qua setImmediate; đợi nó để oracle không xanh giả.
    await new Promise<void>((resolve) => setImmediate(resolve))
    return result
  }

  try {
    return await action(send)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('ALLOWED_ORIGINS', trustedOrigin)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  sentry.captureServerException.mockClear()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function expectPrivateParserResponse(result: HttpResult, status: number) {
  expect(result.status).toBe(status)
  expect(result.headers['content-type']).toMatch(/^application\/json/)
  expect(result.headers['cache-control']).toBe('no-store')
  expect(result.headers['x-content-type-options']).toBe('nosniff')
  expect(result.headers['content-security-policy']).toContain("object-src 'none'")
  expect(result.headers['strict-transport-security']).toContain('includeSubDomains')
  expect(result.body).not.toMatch(/FAKE_PASSWORD_MARKER|FAKE_TOKEN_MARKER|SyntaxError|stack|body:/)
  expect(console.error).not.toHaveBeenCalled()
  expect(console.warn).not.toHaveBeenCalled()
  expect(console.log).not.toHaveBeenCalled()
  expect(sentry.captureServerException).not.toHaveBeenCalled()
}

describe('lỗi parser request không làm lộ dữ liệu riêng tư', () => {
  it.each(['/api/auth', '/api/stt', '/api/pronounce-assess', '/api/vision-solve'])(
    '%s: JSON hỏng giữ 400, không vào log/Sentry hoặc response',
    async (path) => {
      await withApiServer(async (send) => {
        const result = await send(path, privateBody)
        expectPrivateParserResponse(result, 400)
        expect(JSON.parse(result.body)).toEqual({ error: 'Nội dung yêu cầu không hợp lệ' })
        expect(result.headers['access-control-allow-origin']).toBe(trustedOrigin)
        expect(result.headers['access-control-allow-credentials']).toBe('true')
        expect(result.headers.vary).toContain('Origin')
      })
    },
  )

  it('body vượt 64kb giữ 413 và không lộ nội dung', async () => {
    await withApiServer(async (send) => {
      const result = await send('/api/auth', JSON.stringify({ password: 'x'.repeat(65 * 1024) }))
      expectPrivateParserResponse(result, 413)
      expect(JSON.parse(result.body)).toEqual({
        error: 'Nội dung yêu cầu vượt quá giới hạn cho phép',
      })
    })
  })

  it.each<Record<string, string>>([
    { 'content-type': 'application/json; charset=iso-8859-1' },
    { 'content-encoding': 'unsupported' },
  ])('charset/encoding không hỗ trợ giữ 415 (%j)', async (headers) => {
    await withApiServer(async (send) => {
      const result = await send('/api/auth', privateBody, headers)
      expectPrivateParserResponse(result, 415)
      expect(JSON.parse(result.body)).toEqual({
        error: 'Định dạng nội dung yêu cầu không được hỗ trợ',
      })
    })
  })

  it.each(['https://evil.example', `${trustedOrigin}.evil.example`])(
    'không phản chiếu origin lạ %s hoặc cấp CORS credentials',
    async (origin) => {
      await withApiServer(async (send) => {
        const result = await send('/api/auth', privateBody, { origin, host: 'evil.example' })
        expectPrivateParserResponse(result, 400)
        expect(result.headers['access-control-allow-origin']).toBe(trustedOrigin)
        expect(result.headers['access-control-allow-credentials']).toBeUndefined()
      })
    },
  )

  it('request hợp lệ tiếp tục đến handler với status và body cũ', async () => {
    await withApiServer(async (send) => {
      const result = await send('/api/body-errors-test', '{"value":"giữ nguyên"}')
      expect(result.status).toBe(201)
      expect(JSON.parse(result.body)).toEqual({ received: { value: 'giữ nguyên' } })
      expect(sentry.captureServerException).not.toHaveBeenCalled()
    })
  })

  it.each([
    new Error('lỗi máy chủ'),
    { type: 'entity.parse.failed', status: 500 },
    { type: 'entity.too.large', status: 400 },
    { type: 'không-phải-parser', status: 400 },
    'lỗi không phải object',
  ])('lỗi ngoài parser được chuyển nguyên vẹn tới middleware sau (%j)', async (error) => {
    const receivedError = vi.fn()
    await withApiServer(
      async (send) => {
        const result = await send('/api/upstream-error', '{}')
        expect(result.status).toBe(500)
        expect(receivedError).toHaveBeenCalledWith(error)
      },
      (app) => {
        app.post('/api/upstream-error', (_req, _res, next) => next(error))
      },
      (app) => {
        app.use(
          (
            err: unknown,
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
          ) => {
            // Express nhận error middleware qua đủ bốn tham số.
            void next
            receivedError(err)
            res.status(500).json({ error: 'downstream' })
          },
        )
      },
    )
  })
})

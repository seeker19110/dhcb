// @vitest-environment node
// HTTP loopback thật + adapter/compression thật. Không provider, DB hoặc route.fulfill.
import { createServer, get, type IncomingMessage, type ClientRequest } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import compression from 'compression'
import { gunzipSync } from 'node:zlib'
import { ServiceUnavailableError } from '@dhcb/core-errors/appError'
import { wrapEdge } from './routes.js'

const sentry = vi.hoisted(() => ({ captureServerException: vi.fn() }))
vi.mock('./api/_lib/sentry.js', () => sentry)

type Handler = (request: Request) => Promise<Response>
async function withHttpServer<T>(
  handler: Handler,
  action: (url: string) => Promise<T>,
  adapter = wrapEdge,
) {
  const app = express()
  app.use(compression({ threshold: 0 }))
  app.get('/api/companion', adapter(handler))
  const server = createServer(app)
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('TEST_NO_HTTP_ADDRESS')
  try {
    return await action(`http://127.0.0.1:${address.port}/api/companion`)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
}

function collect(url: string, onData: (body: Buffer) => void = () => {}) {
  let request: ClientRequest | undefined
  const result = new Promise<{ response: IncomingMessage; body: Buffer }>((resolve, reject) => {
    request = get(url, { headers: { 'accept-encoding': 'gzip' } }, (response) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
        onData(Buffer.concat(chunks))
      })
      response.on('end', () => resolve({ response, body: Buffer.concat(chunks) }))
      response.on('error', reject)
      response.on('aborted', () => reject(new Error('TEST_HTTP_ABORTED')))
    })
    request.on('error', reject)
  })
  result.catch(() => {})
  return { result, close: () => request?.destroy() }
}
async function within<T>(task: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      task,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('PREFIX_NOT_DELIVERED_BEFORE_BARRIER')), 2000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

afterEach(() => vi.restoreAllMocks())
describe('Web response → HTTP', () => {
  it('negative control gom .text() không vượt oracle prefix trước barrier', async () => {
    let release: () => void = () => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    const unsafe =
      (handler: Handler) => async (request: express.Request, response: express.Response) => {
        const web = await handler(new Request(`http://localhost${request.originalUrl}`))
        response.setHeader('content-type', 'text/event-stream')
        response.send(await web.text())
      }
    await withHttpServer(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            async start(controller) {
              controller.enqueue(new TextEncoder().encode('prefix'))
              await barrier
              controller.close()
            },
          }),
        ),
      async (url) => {
        let received: () => void = () => {}
        const ready = new Promise<void>((resolve) => {
          received = resolve
        })
        const client = collect(url, () => received())
        try {
          await expect(within(ready)).rejects.toThrow('PREFIX_NOT_DELIVERED_BEFORE_BARRIER')
          release()
          await client.result
        } finally {
          release()
          client.close()
        }
      },
      unsafe,
    )
  })

  it('JSON non-SSE giữ status, gzip, ETag và body cũ', async () => {
    const text = JSON.stringify({ reply: 'Xin chào bạn. '.repeat(200) })
    await withHttpServer(
      async () =>
        new Response(text, { status: 201, headers: { 'content-type': 'application/json' } }),
      async (url) => {
        const { response, body } = await collect(url).result
        expect(response.statusCode).toBe(201)
        expect(response.headers['content-encoding']).toBe('gzip')
        expect(response.headers.etag).toEqual(expect.any(String))
        expect(gunzipSync(body).toString('utf8')).toBe(text)
      },
    )
  })

  it('SSE có gzip thật giữ toàn bộ bytes qua nhiều lần backpressure', async () => {
    const block = 'data: ' + 'x'.repeat(65_530) + '\n\n'
    let sent = 0
    await withHttpServer(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            pull(controller) {
              if (sent++ === 32) {
                controller.close()
                return
              }
              controller.enqueue(new TextEncoder().encode(block))
            },
          }),
          { headers: { 'content-type': 'text/event-stream' } },
        ),
      async (url) => {
        const { response, body } = await collect(url).result
        expect(response.headers['content-encoding']).toBe('gzip')
        expect(gunzipSync(body).toString()).toBe(block.repeat(32))
      },
    )
  })

  it('lỗi trước headers giữ AppError; lỗi sau SSE headers đóng socket, không nối JSON 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await withHttpServer(
      async () => {
        throw new ServiceUnavailableError()
      },
      async (url) => {
        const { response, body } = await collect(url).result
        expect(response.statusCode).toBe(503)
        const text =
          response.headers['content-encoding'] === 'gzip'
            ? gunzipSync(body).toString()
            : body.toString()
        expect(JSON.parse(text)).toMatchObject({ code: 'service_unavailable' })
      },
    )
    let fail: () => void = () => {}
    let received = ''
    await withHttpServer(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('event: chunk\ndata: prefix\n\n'))
              fail = () => controller.error(new Error('TEST_BODY_FAIL'))
            },
          }),
          { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-transform' } },
        ),
      async (url) => {
        let prefix: () => void = () => {}
        const ready = new Promise<void>((resolve) => {
          prefix = resolve
        })
        const client = collect(url, (body) => {
          received = body.toString()
          prefix()
        })
        try {
          await within(ready)
          fail()
          await expect(client.result).rejects.toThrow()
          expect(received).toBe('event: chunk\ndata: prefix\n\n')
          expect(received).not.toContain('Internal server error')
        } finally {
          fail()
          client.close()
        }
      },
    )
  })

  it('client nhận prefix SSE trước khi producer được phép gửi tail/EOF', async () => {
    const encoder = new TextEncoder()
    const prefix = 'event: chunk\ndata: {"delta":"Chào bạn!"}\n\n'
    const tail = 'event: done\ndata: {"reply":"Chào bạn!"}\n\n'
    let release: () => void = () => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    let finished = false
    const handler: Handler = async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          async start(controller) {
            const bytes = encoder.encode(prefix)
            const accent = bytes.indexOf(0xc3)
            controller.enqueue(bytes.slice(0, accent + 1))
            controller.enqueue(bytes.slice(accent + 1))
            await barrier
            finished = true
            controller.enqueue(encoder.encode(tail))
            controller.close()
          },
        }),
        {
          headers: {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-cache, no-transform',
            'x-accel-buffering': 'no',
          },
        },
      )
    await withHttpServer(handler, async (url) => {
      let received: () => void = () => {}
      const ready = new Promise<void>((resolve) => {
        received = resolve
      })
      const client = collect(url, (body) => {
        if (body.toString('utf8').includes(prefix)) received()
      })
      try {
        await within(ready)
        expect(finished).toBe(false)
        release()
        const { response, body } = await client.result
        expect(body.toString('utf8')).toBe(prefix + tail)
        expect(response.headers['content-encoding']).toBeUndefined()
        expect(response.headers['x-content-type-options']).toBe('nosniff')
        expect(response.headers['x-accel-buffering']).toBe('no')
      } finally {
        release()
        client.close()
      }
    })
  })

  it('giữ cả hai Set-Cookie, kể cả Expires chứa dấu phẩy', async () => {
    const cookies = [
      'session=a; Path=/; HttpOnly; SameSite=Lax; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
      'csrf=b; Path=/; SameSite=Lax',
    ]
    await withHttpServer(
      async () => {
        const headers = new Headers({
          'content-type': 'text/plain',
          'cache-control': 'no-transform',
        })
        for (const cookie of cookies) headers.append('set-cookie', cookie)
        return new Response('ok', { headers })
      },
      async (url) => {
        const { response, body } = await collect(url).result
        expect(body.toString()).toBe('ok')
        expect(response.headers['set-cookie']).toEqual(cookies)
      },
    )
  })
})

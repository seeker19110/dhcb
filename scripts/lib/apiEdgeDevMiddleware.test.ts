// @vitest-environment node
import { createServer, request as httpRequest } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { createApiEdgeDevMiddleware } from './apiEdgeDevMiddleware.js'

async function withDev<T>(
  loadModule: (id: string) => Promise<unknown>,
  action: (url: string) => Promise<T>,
  resolveModule: (url: string) => string | undefined = (url) =>
    url === '/api/companion' ? '/@fs/fake-companion.ts' : undefined,
) {
  const middleware = createApiEdgeDevMiddleware({
    resolveModule,
    loadModule,
  })
  const server = createServer((req, res) => {
    void middleware(req, res, () => {
      res.statusCode = 404
      res.end('next')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('TEST_NO_ADDRESS')
  try {
    return await action(`http://127.0.0.1:${address.port}`)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}
function open(
  url: string,
  method = 'GET',
  body?: string,
  onData: (text: string) => void = () => {},
) {
  let text = ''
  const result = new Promise<{
    status: number | undefined
    cookies: string[] | undefined
    text: string
  }>((resolve, reject) => {
    const request = httpRequest(
      url,
      { method, headers: { authorization: 'Bearer fake-dev', 'content-type': 'application/json' } },
      (response) => {
        response.setEncoding('utf8')
        response.on('data', (chunk: string) => {
          text += chunk
          onData(text)
        })
        response.on('end', () =>
          resolve({ status: response.statusCode, cookies: response.headers['set-cookie'], text }),
        )
        response.on('error', reject)
      },
    )
    request.on('error', reject)
    request.end(body)
  })
  result.catch(() => {})
  return result
}
describe('Middleware dev qua HTTP thật', () => {
  it('resolve lỗi trả 500 trong middleware, không tạo unhandled rejection', async () => {
    const load = vi.fn()
    await withDev(
      load,
      async (url) => {
        expect(await open(url + '/api/companion')).toMatchObject({
          status: 500,
          text: '{"error":"Internal server error"}',
        })
      },
      () => {
        throw new Error('TEST_RESOLVE_ERROR')
      },
    )
    expect(load).not.toHaveBeenCalled()
  })

  it('lỗi loader chứa chi tiết nội bộ không tới HTTP body', async () => {
    const canary = 'TEST_PRIVATE_LOADER_CANARY'
    await withDev(
      async () => {
        throw new Error(`Không tải được module: ${canary} at /private/server.ts:123`)
      },
      async (url) => {
        const response = await open(url + '/api/companion')
        expect(response).toMatchObject({
          status: 500,
          text: '{"error":"Internal server error"}',
        })
        expect(response.text).not.toContain(canary)
        expect(response.text).not.toContain('/private/')
      },
    )
  })

  it('body lỗi sau prefix đóng socket, không nối JSON 500 vào stream', async () => {
    let fail: () => void = () => {}
    let seen = ''
    const web = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('prefix'))
          fail = () => controller.error(new Error('TEST_AFTER_HEADERS'))
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } },
    )
    await withDev(
      async () => ({ default: async () => web }),
      async (url) => {
        const result = open(url + '/api/companion', 'GET', undefined, (text) => {
          seen = text
          fail()
        })
        await expect(result).rejects.toThrow()
        expect(seen).toBe('prefix')
        expect(seen).not.toContain('TEST_AFTER_HEADERS')
      },
    )
    expect(web.body?.locked).toBe(false)
  })

  it('SSE prefix tới client trước barrier, chuyển status/cookies và request như trước', async () => {
    let release: () => void = () => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    const seen: string[] = []
    const handler = vi.fn(async (request: Request) => {
      seen.push(request.method, request.headers.get('authorization') ?? '', await request.text())
      const headers = new Headers({ 'content-type': 'text/event-stream' })
      headers.append('set-cookie', 'a=1; Path=/')
      headers.append('set-cookie', 'b=2; Path=/')
      return new Response(
        new ReadableStream<Uint8Array>({
          async start(controller) {
            controller.enqueue(new TextEncoder().encode('prefix Chào\n'))
            await barrier
            controller.enqueue(new TextEncoder().encode('tail\n'))
            controller.close()
          },
        }),
        { status: 202, headers },
      )
    })
    const load = vi.fn(async () => ({ default: handler }))
    await withDev(load, async (url) => {
      let prefix = false
      const result = open(url + '/api/companion', 'POST', '{"message":"xin chào"}', (text) => {
        if (text.includes('prefix Chào\n')) prefix = true
      })
      try {
        await vi.waitFor(() => expect(prefix).toBe(true), { interval: 5 })
        release()
        expect(await result).toEqual({
          status: 202,
          cookies: ['a=1; Path=/', 'b=2; Path=/'],
          text: 'prefix Chào\ntail\n',
        })
      } finally {
        release()
      }
      expect(seen).toEqual(['POST', 'Bearer fake-dev', '{"message":"xin chào"}'])
      expect(load).toHaveBeenCalledExactlyOnceWith('/@fs/fake-companion.ts')
    })
  })
  it('next, non-SSE và lỗi trước headers giữ đường dev hiện hữu', async () => {
    for (const value of [
      {
        default: async () =>
          new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } }),
      },
      {
        default: async () => {
          throw new Error('TEST_DEV_ERROR')
        },
      },
      {},
    ]) {
      await withDev(
        async () => value,
        async (url) => {
          expect(await open(url + '/other')).toMatchObject({ status: 404, text: 'next' })
          const result = await open(url + '/api/companion')
          if ('default' in value && result.status === 200) expect(result.text).toBe('{"ok":true}')
          else expect(result.status).toBe(500)
        },
      )
    }
  })
})

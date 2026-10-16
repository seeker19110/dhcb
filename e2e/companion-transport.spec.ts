// Browser → HTTP loopback → bridge production/dev thật. Không route.fulfill, DB hoặc AI.
import { createServer } from 'node:http'
import { test, expect } from '@playwright/test'
import express from 'express'
import compression from 'compression'
import { wrapEdge } from '../apps/server/src/routes'
import { createApiEdgeDevMiddleware } from '../scripts/lib/apiEdgeDevMiddleware'

declare global {
  interface Window {
    __dhcbTransportPrefix: () => Promise<void>
  }
}
for (const adapter of ['production', 'dev'] as const) {
  for (const fallback of [false, true]) {
    test(`${adapter}: browser nhận chunk trước EOF, fallback=${fallback}`, async ({ page }) => {
      const prefix = `event: chunk\ndata: ${JSON.stringify({ delta: 'Chào bạn trước EOF.' })}\n\n`
      const tail = `event: done\ndata: ${JSON.stringify({ reply: 'Chào bạn trước EOF.', isFallback: fallback })}\n\n`
      let release: () => void = () => {}
      const barrier = new Promise<void>((resolve) => {
        release = resolve
      })
      let finished = false
      const handler = async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            async start(controller) {
              const bytes = new TextEncoder().encode(prefix)
              const accent = bytes.indexOf(0xc3)
              controller.enqueue(bytes.slice(0, accent + 1))
              controller.enqueue(bytes.slice(accent + 1))
              await barrier
              finished = true
              controller.enqueue(new TextEncoder().encode(tail))
              controller.close()
            },
          }),
          {
            headers: {
              'content-type': 'text/event-stream; charset=utf-8',
              'cache-control': 'no-cache, no-transform',
            },
          },
        )
      const app = express()
      app.use(compression({ threshold: 1024 }))
      app.get('/', (_request, response) =>
        response.type('html').send('<!doctype html><title>Transport test</title>'),
      )
      if (adapter === 'production') {
        app.use(express.json())
        app.post('/api/companion', wrapEdge(handler))
      } else {
        app.use(
          createApiEdgeDevMiddleware({
            resolveModule: (url) =>
              url === '/api/companion' ? '/@fs/fake-companion.ts' : undefined,
            loadModule: async () => ({ default: handler }),
          }),
        )
      }
      const server = createServer(app)
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('TEST_NO_ADDRESS')
      const origin = `http://127.0.0.1:${address.port}`
      const previousOrigins = process.env.ALLOWED_ORIGINS
      process.env.ALLOWED_ORIGINS = origin
      let reading: Promise<string> | undefined
      try {
        await page.goto(origin)
        let seen = false
        await page.exposeFunction('__dhcbTransportPrefix', () => {
          seen = true
        })
        reading = page.evaluate(
          async ({ expectedPrefix }) => {
            const response = await fetch('/api/companion', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: '{"message":"xin chào","stream":true}',
            })
            if (!response.ok || !response.body) throw new Error(`HTTP_${response.status}`)
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let text = '',
              notified = false
            try {
              for (;;) {
                const next = await reader.read()
                if (next.done) {
                  text += decoder.decode()
                  return text
                }
                text += decoder.decode(next.value, { stream: true })
                if (!notified && text.includes(expectedPrefix)) {
                  notified = true
                  await window.__dhcbTransportPrefix()
                }
              }
            } finally {
              reader.releaseLock()
            }
          },
          { expectedPrefix: prefix },
        )
        reading.catch(() => {})
        await expect.poll(() => seen).toBe(true)
        expect(finished).toBe(false)
        release()
        expect(await reading).toBe(prefix + tail)
      } finally {
        release()
        // Khi oracle fail, ngắt HTTP trước để reader không giữ teardown tới timeout.
        server.closeAllConnections()
        await reading?.catch(() => {})
        if (previousOrigins === undefined) delete process.env.ALLOWED_ORIGINS
        else process.env.ALLOWED_ORIGINS = previousOrigins
        await new Promise<void>((resolve) => server.close(() => resolve()))
      }
    })
  }
}

// Fixture shared guard → bridge thật; wiring runtime/SDK thật được kiểm riêng ở
// companionTransport.test.ts. Không dùng fixture này làm bằng chứng DB/model resilience.
for (const adapter of ['production', 'dev'] as const) {
  for (const deferPrefix of [false, true]) {
    test(`${adapter}: browser guard, đối chứng đệm chữ=${deferPrefix}`, async ({ page }) => {
      const { CompanionVisibleTextGuard } =
        await import('../packages/core-personal/companionVisibleText')
      const id = '11111111-1111-4111-8111-111111111111'
      let release: () => void = () => {}
      const barrier = new Promise<void>((resolve) => {
        release = resolve
      })
      let finished = false
      const handler = async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            async start(controller) {
              const send = (type: string, data: Record<string, unknown>) =>
                controller.enqueue(
                  new TextEncoder().encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`),
                )
              send('meta', { personId: id })
              let deferred = ''
              const guard = new CompanionVisibleTextGuard((delta) => {
                if (deferPrefix) deferred += delta
                else send('chunk', { delta })
              })
              const input =
                'Chào bạn! <du_<tool_use>lieu_a>' +
                id +
                '\n``<tool_use>`dhcb-questions\n{"private":true}\n```'
              for (const char of input) guard.push(char)
              send('fixture_checkpoint', {})
              await barrier
              guard.end()
              if (deferPrefix) send('chunk', { delta: deferred })
              send('done', { reply: 'Chào bạn!', questions: [{ id }] })
              finished = true
              controller.close()
            },
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache, no-transform',
            },
          },
        )
      const app = express()
      app.use(compression({ threshold: 1024 }))
      app.get('/', (_request, response) =>
        response.type('html').send('<!doctype html><title>Guard transport</title>'),
      )
      if (adapter === 'production') {
        app.use(express.json())
        app.post('/api/companion', wrapEdge(handler))
      } else
        app.use(
          createApiEdgeDevMiddleware({
            resolveModule: (url) =>
              url === '/api/companion' ? '/@fs/fake-companion.ts' : undefined,
            loadModule: async () => ({ default: handler }),
          }),
        )
      const server = createServer(app)
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('TEST_NO_ADDRESS')
      const origin = `http://127.0.0.1:${address.port}`
      const previous = process.env.ALLOWED_ORIGINS
      process.env.ALLOWED_ORIGINS = origin
      let reading: Promise<{ visible: string; meta: unknown; done: unknown }> | undefined
      try {
        await page.goto(origin)
        let checkpoint = false
        await page.exposeFunction('__dhcbTransportPrefix', () => {
          checkpoint = true
        })
        reading = page.evaluate(
          async ({ canary }) => {
            const response = await fetch('/api/companion', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: '{}',
            })
            if (!response.ok || !response.body) throw new Error('TEST_NO_STREAM')
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let pending = '',
              visible = ''
            let meta: unknown, done: unknown
            try {
              for (;;) {
                const next = await reader.read()
                if (next.done) return { visible, meta, done }
                pending += decoder.decode(next.value, { stream: true })
                let boundary: number
                while ((boundary = pending.indexOf('\n\n')) !== -1) {
                  const block = pending.slice(0, boundary)
                  pending = pending.slice(boundary + 2)
                  const [event, payload] = block.split('\n')
                  const data: unknown = JSON.parse(payload!.slice(6))
                  if (event === 'event: chunk') {
                    if (
                      !data ||
                      typeof data !== 'object' ||
                      !('delta' in data) ||
                      typeof data.delta !== 'string'
                    )
                      throw new Error('TEST_BAD_DELTA')
                    visible += data.delta
                    if (
                      visible.includes(canary) ||
                      visible.includes('<tool_') ||
                      visible.includes('private')
                    )
                      throw new Error('TEST_UNFILTERED_VISIBLE')
                  } else if (event === 'event: meta') meta = data
                  else if (event === 'event: done') done = data
                  else if (event === 'event: fixture_checkpoint') {
                    if (!visible.startsWith('Chào bạn!'))
                      throw new Error('TEST_PREFIX_MISSING_BEFORE_EOF')
                    await window.__dhcbTransportPrefix()
                  }
                }
              }
            } finally {
              reader.releaseLock()
            }
          },
          { canary: id },
        )
        reading.catch(() => {})
        if (deferPrefix) {
          await expect(reading).rejects.toThrow('TEST_PREFIX_MISSING_BEFORE_EOF')
          expect(finished).toBe(false)
          return
        }
        await expect.poll(() => checkpoint).toBe(true)
        expect(finished).toBe(false)
        release()
        expect(await reading).toEqual({
          visible: 'Chào bạn! \n',
          meta: { personId: id },
          done: { reply: 'Chào bạn!', questions: [{ id }] },
        })
      } finally {
        release()
        server.closeAllConnections()
        await reading?.catch(() => {})
        if (previous === undefined) delete process.env.ALLOWED_ORIGINS
        else process.env.ALLOWED_ORIGINS = previous
        await new Promise<void>((resolve) => server.close(() => resolve()))
      }
    })
  }
}

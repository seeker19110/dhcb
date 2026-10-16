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

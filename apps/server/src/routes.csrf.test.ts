// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type express from 'express'
import { wrapEdge } from './routes'

beforeEach(() => vi.stubEnv('ALLOWED_ORIGINS', 'https://donghanhcungban.org'))
afterEach(() => vi.unstubAllEnvs())

async function invoke(headers: Record<string, string>, method = 'POST') {
  const handler = vi.fn(async () => new Response('{"ok":true}'))
  const req = {
    method,
    headers,
    body: {},
    protocol: 'https',
    originalUrl: '/api/profile',
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as express.Request
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  }
  await wrapEdge(handler)(req, res as unknown as express.Response)
  return { handler, res }
}

describe('adapter API kiểm tra nguồn trước handler', () => {
  it('nguồn lạ cùng cookie bị chặn, kể cả Host giả mạo', async () => {
    const { handler, res } = await invoke({
      host: 'other.example',
      origin: 'https://other.example',
      cookie: 'session_token=opaque',
    })
    expect(handler).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNTRUSTED_ORIGIN' }))
  })
  it('nguồn được phép đến handler và vẫn có header bảo mật', async () => {
    const { handler, res } = await invoke({
      host: 'donghanhcungban.org',
      origin: 'https://donghanhcungban.org',
      cookie: 'session_token=opaque',
    })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("object-src 'none'"),
    )
  })
  it('webhook không dùng cookie tiếp tục đến handler xác thực riêng', async () => {
    const { handler } = await invoke({ host: 'donghanhcungban.org', authorization: 'Apikey test' })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type express from 'express'
import { NotFoundError, ServiceUnavailableError } from '@dhcb/core-errors/appError'
import { wrapEdge } from './routes'

beforeEach(() => vi.stubEnv('ALLOWED_ORIGINS', 'https://donghanhcungban.org'))
afterEach(() => vi.unstubAllEnvs())

async function invoke(
  headers: Record<string, string>,
  method = 'POST',
  handler = vi.fn<(req: Request) => Promise<Response>>(async () => new Response('{"ok":true}')),
) {
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

describe('adapter API trả đúng mã của AppError (2026-10-10, E1.5)', () => {
  const trusted = { host: 'donghanhcungban.org', origin: 'https://donghanhcungban.org' }

  it('CSDL không kiểm được phiên → 503 có mã ổn định (client giữ phiên), có log', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { res } = await invoke(
      trusted,
      'GET',
      vi.fn(async () => {
        throw new ServiceUnavailableError()
      }),
    )
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'service_unavailable' }))
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('AppError 4xx → đúng mã + câu báo, không coi là lỗi máy chủ', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { res } = await invoke(
      trusted,
      'GET',
      vi.fn(async () => {
        throw new NotFoundError('Không có bài này')
      }),
    )
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Không có bài này', code: 'not_found' })
    expect(errSpy).not.toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('lỗi bất ngờ vẫn 500 chung, KHÔNG lộ thông điệp nội bộ', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { res } = await invoke(
      trusted,
      'GET',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED 10.0.0.5:5432')
      }),
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    errSpy.mockRestore()
  })
})

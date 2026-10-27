// Middleware dev tách khỏi config để test HTTP thật mà không loadEnv hoặc chạy plugin build.
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  copyWebResponseHeaders,
  forwardEventStream,
} from '../../packages/core-http/nodeResponse.js'

interface DevApiDependencies {
  resolveModule(url: string): string | undefined
  loadModule(moduleId: string): Promise<unknown>
  /** Cổng Origin/CSRF giống `wrapEdge` của Express; bỏ trống thì không kiểm (chỉ dùng trong test). */
  isTrustedMutation?(request: Request): boolean | Promise<boolean>
}

// Header hop-by-hop chỉ thuộc kết nối Node → Vite, không thuộc request gửi handler; `content-length`
// bỏ vì body được đọc lại thành chuỗi và `Request` tự tính.
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'te',
  'trailer',
  'proxy-connection',
  'content-length',
])

// Parity với Express (`apps/server/src/routes.ts#wrapEdge` đưa nguyên `req.headers`): bản cũ chỉ
// chuyển content-type + authorization nên mất cookie `session_token` — dev luôn 401 dù đã đăng nhập
// (audit 2026-10-26, AUD-XFEAT-002).
function forwardHeaders(request: IncomingMessage): Headers {
  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined || HOP_BY_HOP.has(name)) continue
    headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }
  if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  return headers
}
function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}
function moduleHandler(module: unknown): (request: Request) => Promise<Response> {
  if (
    typeof module !== 'object' ||
    module === null ||
    !('default' in module) ||
    typeof module.default !== 'function'
  )
    throw new Error('Module API không có default handler')
  // Chỉ module server nội bộ được resolve, không nhận path/handler từ HTTP body.
  const handler = module.default
  return async (request) => {
    const result: unknown = await handler(request)
    if (!(result instanceof Response)) throw new Error('Handler API không trả Web Response')
    return result
  }
}
export function createApiEdgeDevMiddleware(dependencies: DevApiDependencies) {
  return async (request: IncomingMessage, target: ServerResponse, next: () => void) => {
    try {
      const moduleId = request.url ? dependencies.resolveModule(request.url) : undefined
      if (!moduleId) {
        next()
        return
      }
      const body = await readRequestBody(request)
      const handler = moduleHandler(await dependencies.loadModule(moduleId))
      const webRequest = new Request(
        new URL(request.url!, `http://${request.headers.host ?? 'localhost'}`),
        {
          method: request.method,
          headers: forwardHeaders(request),
          body:
            request.method && request.method !== 'GET' && request.method !== 'HEAD'
              ? body
              : undefined,
        },
      )
      if (dependencies.isTrustedMutation && !(await dependencies.isTrustedMutation(webRequest))) {
        target.statusCode = 403
        target.setHeader('content-type', 'application/json')
        target.setHeader('cache-control', 'no-store')
        target.end(
          JSON.stringify({ error: 'Nguồn yêu cầu không được phép', code: 'UNTRUSTED_ORIGIN' }),
        )
        return
      }
      const response = await handler(webRequest)
      target.statusCode = response.status
      copyWebResponseHeaders(response, target)
      if (!(await forwardEventStream(response, target, request.method)))
        target.end(await response.text())
    } catch {
      if (target.headersSent || target.destroyed) {
        target.destroy()
        return
      }
      target.statusCode = 500
      target.setHeader('content-type', 'application/json')
      // Lỗi loader/handler có thể mang path hoặc chi tiết nội bộ; không trả ra browser.
      target.end(JSON.stringify({ error: 'Internal server error' }))
    }
  }
}

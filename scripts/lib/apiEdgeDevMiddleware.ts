// Middleware dev tách khỏi config để test HTTP thật mà không loadEnv hoặc chạy plugin build.
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  copyWebResponseHeaders,
  forwardEventStream,
} from '../../packages/core-http/nodeResponse.js'

interface DevApiDependencies {
  resolveModule(url: string): string | undefined
  loadModule(moduleId: string): Promise<unknown>
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
      const webRequest = new Request(new URL(request.url!, 'http://localhost'), {
        method: request.method,
        // Giữ nguyên request header parity hiện hữu; sửa auth/request là scope riêng.
        headers: {
          'content-type': request.headers['content-type'] ?? 'application/json',
          ...(request.headers.authorization
            ? { authorization: request.headers.authorization }
            : {}),
        },
        body:
          request.method && request.method !== 'GET' && request.method !== 'HEAD'
            ? body
            : undefined,
      })
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

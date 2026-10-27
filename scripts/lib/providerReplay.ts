// Replay tại biên fetch của SDK thật. Không có nhánh gọi mạng hoặc record provider.
import { createHash } from 'node:crypto'
import { z } from 'zod'

const HttpResponseSchema = z
  .object({
    kind: z.literal('http'),
    status: z.number().int().min(200).max(599),
    contentType: z.enum(['application/json', 'text/event-stream']),
    body: z.string(),
  })
  .strict()

export const ReplayResponseSchema = z.discriminatedUnion('kind', [
  HttpResponseSchema,
  z.object({ kind: z.literal('timeout') }).strict(),
  z.object({ kind: z.literal('network_error') }).strict(),
  z.object({ kind: z.literal('stream_error'), chunks: z.array(z.string()).min(1) }).strict(),
])

export const ReplayExchangeSchema = z
  .object({
    method: z.literal('POST'),
    path: z.literal('/v1/messages'),
    requestHeaders: z
      .object({
        'anthropic-version': z.string().min(1).nullable(),
        'anthropic-beta': z.string().min(1).nullable(),
      })
      .strict(),
    requestFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    response: ReplayResponseSchema,
  })
  .strict()

export type ReplayExchange = z.infer<typeof ReplayExchangeSchema>

// JSON chuẩn hóa chỉ dùng dựng hash; không log body/header/key trong lỗi mismatch.
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  return `{${Object.entries(value)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(',')}}`
}

export function requestFingerprint(
  method: string,
  path: string,
  body: unknown,
  headers?: ReplayExchange['requestHeaders'],
): string {
  const json = z.json().parse(body)
  return createHash('sha256')
    .update(`${method}\n${path}\n${canonicalJson(json)}\n${canonicalJson(headers ?? null)}`)
    .digest('hex')
}

export function createProviderReplay(rawExchanges: unknown) {
  const exchanges = z.array(ReplayExchangeSchema).min(1).parse(rawExchanges)
  const violations: string[] = []
  const completed = exchanges.map(() => false)
  let consumed = 0

  const fail = (reason: string): never => {
    violations.push(reason)
    throw new Error(reason)
  }

  const fetchImpl: typeof fetch = async (input, init) => {
    // Request native xử lý cả string/URL/Request, body và signal theo cùng hợp đồng fetch.
    const request = new Request(input, init)
    const signal = init?.signal ?? (input instanceof Request ? input.signal : request.signal)
    const url = new URL(request.url)
    const path = `${url.pathname}${url.search}`
    // SDK chuyển betas ra header. Chỉ chụp hai header hành vi, không auth/key/định danh.
    const headers = {
      'anthropic-version': request.headers.get('anthropic-version'),
      'anthropic-beta': request.headers.get('anthropic-beta'),
    }
    if (url.origin !== 'https://api.anthropic.com') fail('REPLAY_ORIGIN_MISMATCH')
    const exchange = exchanges[consumed]
    if (!exchange) return fail('REPLAY_UNEXPECTED_REQUEST')
    let body: unknown
    try {
      body = await request.json()
    } catch {
      fail('REPLAY_INVALID_REQUEST_JSON')
    }
    if (
      request.method !== exchange.method ||
      path !== exchange.path ||
      requestFingerprint(request.method, path, body, headers) !== exchange.requestFingerprint ||
      canonicalJson(headers) !== canonicalJson(exchange.requestHeaders)
    ) {
      fail('REPLAY_REQUEST_MISMATCH')
    }
    const entryIndex = consumed++
    const response = exchange.response
    if (response.kind === 'network_error') {
      completed[entryIndex] = true
      throw new TypeError('SYNTHETIC_NETWORK_ERROR')
    }
    if (response.kind === 'timeout') {
      // Chờ signal thật từ deadline của SDK/vòng công cụ; không tự giả làm timeout đã đo.
      return new Promise<Response>((_resolve, reject) => {
        // Giữ CLI sống tới signal; thiếu signal SDK là lỗi harness, không phải ca timeout đạt.
        const watchdog = setTimeout(() => {
          signal?.removeEventListener('abort', abort)
          violations.push('REPLAY_TIMEOUT_SIGNAL_MISSING')
          reject(new Error('REPLAY_TIMEOUT_SIGNAL_MISSING'))
        }, 1500)
        const abort = () => {
          clearTimeout(watchdog)
          completed[entryIndex] = true
          reject(new DOMException('SYNTHETIC_TIMEOUT', 'AbortError'))
        }
        if (signal?.aborted) abort()
        else signal?.addEventListener('abort', abort, { once: true })
      })
    }
    if (response.kind === 'stream_error') {
      let index = 0
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            const chunk = response.chunks[index++]
            if (chunk !== undefined) controller.enqueue(encoder.encode(chunk))
            else {
              completed[entryIndex] = true
              controller.error(new TypeError('SYNTHETIC_STREAM_CUT'))
            }
          },
        },
        { highWaterMark: 0 },
      )
      return new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
    }
    try {
      const bytes = new TextEncoder().encode(response.body)
      const stream = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            // HWM=0: chỉ đánh dấu khi consumer thực sự đòi body, không do prefetch tự động.
            completed[entryIndex] = true
            controller.enqueue(bytes)
            controller.close()
          },
        },
        { highWaterMark: 0 },
      )
      return new Response(stream, {
        status: response.status,
        headers: { 'content-type': response.contentType },
      })
    } catch {
      return fail('REPLAY_INVALID_RESPONSE')
    }
  }

  return {
    fetchImpl,
    // SDK có thể đổi mismatch thành network_error. Phải kiểm ledger ngoài kết quả SDK,
    // nếu không ca đang chờ network_error có thể xanh giả dù chưa replay đúng request.
    assertComplete() {
      if (violations.length || consumed !== exchanges.length || completed.some((done) => !done)) {
        throw new Error(
          `REPLAY_INCOMPLETE: ${consumed}/${exchanges.length}, terminal ${completed.filter(Boolean).length}/${exchanges.length}; ${violations.join(',')}`,
        )
      }
    },
    consumed: () => consumed,
  }
}

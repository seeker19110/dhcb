// @vitest-environment node
// WebSocket thật trên localhost; chỉ giả lập provider và các cổng DB/auth.
import { createServer, type Server } from 'node:http'
import { EventEmitter, once } from 'node:events'
import { WebSocket } from 'ws'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  attachGeminiLiveWebSocketServer,
  _resetWsGeminiLiveHandlerStateForTests,
  WS_GEMINI_LIVE_PATH,
  WS_GEMINI_MAX_PAYLOAD,
} from './wsGeminiLiveHandler.js'
import { _resetGeminiLiveAdmissionForTests } from './geminiLiveAdmission.js'
import {
  _setWebSocketFactoryForTests,
  _resetGeminiLiveServiceStateForTests,
} from './geminiLiveService.js'
import { validateAuth, checkRateLimit } from '@dhcb/core-auth/security'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { getAppSettings } from '@dhcb/core-db/settings'

vi.mock('@dhcb/core-auth/security', async (original) => ({
  ...(await original<typeof import('@dhcb/core-auth/security')>()),
  validateAuth: vi.fn(),
  checkRateLimit: vi.fn(),
}))
vi.mock('@dhcb/core-billing/usage', () => ({ checkAndConsumeUsage: vi.fn(), refundUsage: vi.fn() }))
vi.mock('@dhcb/core-db/settings', () => ({ getAppSettings: vi.fn() }))

class FakeProvider extends EventEmitter {
  readyState: number = WebSocket.OPEN
  send = vi.fn<(data: string) => void>()
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED
    this.emit('close')
  })
}
let server: Server
let url: string
let providers: FakeProvider[]
let clients: WebSocket[]
const factory = vi.fn()
const origin = 'https://donghanhcungban.org'

async function connect(
  source: string | undefined = origin,
  forwardedHeaders: Record<string, string> = {},
): Promise<WebSocket | number> {
  const ws = new WebSocket(url, {
    headers: {
      Cookie: 'session=fake',
      ...(source === undefined ? {} : { Origin: source }),
      ...forwardedHeaders,
    },
  })
  clients.push(ws)
  return new Promise((resolve, reject) => {
    ws.on('error', () => {})
    ws.once('unexpected-response', (_req, res) => {
      resolve(res.statusCode ?? 0)
      res.destroy()
      ws.terminate()
    })
    ws.once('open', () => resolve(ws))
    ws.once('error', reject)
  })
}
async function openClient(): Promise<WebSocket> {
  const result = await connect()
  expect(result).toBeInstanceOf(WebSocket)
  if (typeof result === 'number') throw new Error(`Rejected ${result}`)
  return result
}

beforeEach(async () => {
  vi.resetAllMocks()
  vi.stubEnv('GEMINI_API_KEY', 'fake-test-key')
  vi.stubEnv('ALLOWED_ORIGINS', origin)
  providers = []
  clients = []
  _resetGeminiLiveAdmissionForTests()
  vi.mocked(validateAuth).mockResolvedValue({ userId: 'user-1' })
  vi.mocked(checkRateLimit).mockResolvedValue(true)
  vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: true, day: '2026-09-27' })
  vi.mocked(refundUsage).mockResolvedValue(undefined)
  vi.mocked(getAppSettings).mockResolvedValue({ aiCircuitBreaker: false } as Awaited<
    ReturnType<typeof getAppSettings>
  >)
  factory.mockImplementation(() => {
    const provider = new FakeProvider()
    providers.push(provider)
    return provider
  })
  _setWebSocketFactoryForTests(factory)
  server = createServer()
  attachGeminiLiveWebSocketServer(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing test port')
  url = `ws://127.0.0.1:${address.port}${WS_GEMINI_LIVE_PATH}`
})
afterEach(async () => {
  vi.useRealTimers()
  _resetWsGeminiLiveHandlerStateForTests()
  _resetGeminiLiveServiceStateForTests()
  _resetGeminiLiveAdmissionForTests()
  for (const client of clients) client.terminate()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  _setWebSocketFactoryForTests(null)
  vi.unstubAllEnvs()
})

describe('Gemini Live WS — hàng rào truy cập và chi phí', () => {
  it('rate limit theo IP nginx đã xác minh (X-Real-IP), không theo CF-Connecting-IP tự khai', async () => {
    expect(
      await connect(origin, { 'cf-connecting-ip': '10.0.0.1', 'x-real-ip': '203.0.113.9' }),
    ).toBeInstanceOf(WebSocket)
    expect(checkRateLimit).toHaveBeenCalledWith('203.0.113.9', 10, 'gemini-live-upgrade')
    expect(checkRateLimit).toHaveBeenCalledWith('user-1', 5, 'gemini-live-user')
  })
  it.each(['https://evil.test', 'https://donghanhcungban.org.evil.test', 'null', ''])(
    'chặn Origin %s trước quota/provider',
    async (source) => {
      expect(await connect(source)).toBe(403)
      expect(checkAndConsumeUsage).not.toHaveBeenCalled()
      expect(factory).not.toHaveBeenCalled()
    },
  )
  it('chặn cookie hết hạn trước quota', async () => {
    vi.mocked(validateAuth).mockResolvedValue(null)
    expect(await connect()).toBe(401)
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
  })
  it('chặn rate limit trước provider', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue(false)
    expect(await connect()).toBe(429)
    expect(factory).not.toHaveBeenCalled()
  })
  it.each(['Hết lượt', 'Cầu dao AI đang bật'])('chặn usage gate: %s', async (message) => {
    vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: false, message })
    expect(await connect()).toBe(429)
    expect(factory).not.toHaveBeenCalled()
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it('trừ speaking đúng một lần rồi mới mở upstream, không hoàn sau close/error', async () => {
    const ws = await openClient()
    expect(checkAndConsumeUsage).toHaveBeenCalledExactlyOnceWith('user-1', 'speaking')
    expect(vi.mocked(checkAndConsumeUsage).mock.invocationCallOrder[0]).toBeLessThan(
      factory.mock.invocationCallOrder[0]!,
    )
    const closed = once(ws, 'close')
    providers[0]!.emit('error', new Error('wss://secret?key=SECRET'))
    await closed
    expect(providers[0]!.close).toHaveBeenCalledOnce()
    expect(refundUsage).not.toHaveBeenCalled()
    await openClient() // chỗ đồng thời đã được trả lại
  })
  it('giữ chỗ trước await quota để chặn hai upgrade đồng thời', async () => {
    let allow!: (value: { ok: true; day: string }) => void
    vi.mocked(checkAndConsumeUsage).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          allow = resolve
        }),
    )
    const first = connect()
    await vi.waitFor(() => expect(checkAndConsumeUsage).toHaveBeenCalledTimes(1))
    expect(await connect()).toBe(429)
    allow({ ok: true, day: '2026-09-27' })
    expect(await first).toBeInstanceOf(WebSocket)
    expect(factory).toHaveBeenCalledOnce()
  })
  it('hoàn đúng ngày và đúng một lần nếu factory lỗi trước upstream', async () => {
    factory.mockImplementationOnce(() => {
      throw new Error('before dial')
    })
    const ws = await openClient()
    if (ws.readyState !== WebSocket.CLOSED) await once(ws, 'close')
    expect(refundUsage).toHaveBeenCalledExactlyOnceWith('user-1', 'speaking', '2026-09-27')
    await openClient()
  })
  it('client bỏ upgrade trong khi đợi quota: hoàn một lần và không mở provider', async () => {
    let allow!: (value: { ok: true; day: string }) => void
    vi.mocked(checkAndConsumeUsage).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          allow = resolve
        }),
    )
    const serverClosed = new Promise<void>((resolve) => {
      server.once('upgrade', (_req, socket) => socket.once('close', () => resolve()))
    })
    const pending = connect().catch(() => null)
    await vi.waitFor(() => expect(checkAndConsumeUsage).toHaveBeenCalledOnce())
    clients[0]!.terminate()
    await pending
    await serverClosed
    allow({ ok: true, day: '2026-09-27' })
    await vi.waitFor(() =>
      expect(refundUsage).toHaveBeenCalledExactlyOnceWith('user-1', 'speaking', '2026-09-27'),
    )
    expect(factory).not.toHaveBeenCalled()
    await openClient()
  })
  it('gói setup không thay model, chủ phiên hoặc thời lượng server', async () => {
    const ws = await openClient()
    ws.send(
      JSON.stringify({
        type: 'setup',
        config: { personId: 'victim', model: 'expensive', maxDurationSeconds: 1800 },
      }),
    )
    ws.send(Buffer.from([1, 2]))
    await vi.waitFor(() => expect(providers[0]!.send).toHaveBeenCalledOnce())
    expect(JSON.parse(providers[0]!.send.mock.calls[0]![0])).toHaveProperty('realtimeInput')
    expect(factory).toHaveBeenCalledOnce()
  })
  it('đóng payload quá 64KiB, không chuyển tới upstream', async () => {
    const ws = await openClient()
    const closed = once(ws, 'close')
    ws.send(Buffer.alloc(WS_GEMINI_MAX_PAYLOAD + 1))
    await closed
    expect(providers[0]!.send).not.toHaveBeenCalled()
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it('đóng khi gửi quá nhanh, giới hạn bytes PCM mỗi giây', async () => {
    const ws = await openClient()
    const closed = once(ws, 'close')
    ws.send(Buffer.alloc(32_001))
    ws.send(Buffer.alloc(32_001))
    await closed
    expect(providers[0]!.send).toHaveBeenCalledOnce()
  })
  it('đóng khi cookie bị thu hồi tại lần kiểm tra tiếp theo', async () => {
    vi.useFakeTimers()
    const ws = await openClient()
    vi.mocked(validateAuth).mockResolvedValue(null)
    const closed = once(ws, 'close')
    await vi.advanceTimersByTimeAsync(30_000)
    await closed
    expect(validateAuth).toHaveBeenCalledTimes(2)
    expect(providers[0]!.close).toHaveBeenCalledOnce()
  })
  it('đóng phiên đang chạy khi admin bật cầu dao, không trừ thêm lượt', async () => {
    vi.useFakeTimers()
    const ws = await openClient()
    vi.mocked(getAppSettings).mockResolvedValue({ aiCircuitBreaker: true } as Awaited<
      ReturnType<typeof getAppSettings>
    >)
    const closed = once(ws, 'close')
    await vi.advanceTimersByTimeAsync(30_000)
    await closed
    expect(checkAndConsumeUsage).toHaveBeenCalledOnce()
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it('đóng và dọn upstream sau 60 giây không có audio', async () => {
    vi.useFakeTimers()
    const ws = await openClient()
    const closed = once(ws, 'close')
    await vi.advanceTimersByTimeAsync(60_000)
    await closed
    expect(providers[0]!.close).toHaveBeenCalledOnce()
  })
})

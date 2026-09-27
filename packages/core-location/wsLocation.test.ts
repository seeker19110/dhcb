// Test WebSocket "Đi chung" — điểm quan trọng nhất: MỖI sự kiện đều kiểm lại quyền ở DB
// (getActiveMembership), vì quyền có thể mất giữa chừng (rời chuyến / chuyến hết hạn) trong khi
// socket vẫn đang mở.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const wssOptions = vi.hoisted(() => ({ last: undefined as unknown }))
vi.mock('ws', () => ({
  WebSocket: { OPEN: 1 },
  WebSocketServer: class {
    constructor(options?: unknown) {
      wssOptions.last = options
    }
    handleUpgrade() {}
    emit() {}
    on() {}
  },
}))
const security = vi.hoisted(() => ({ rateLimitOk: true, calls: [] as unknown[][] }))
vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: async () => ({ userId: 'u1' }),
  isAllowedWebSocketOrigin: (origin: unknown) => origin === 'https://en-vi.donghanhcungban.org',
  checkRateLimit: async (...args: unknown[]) => {
    security.calls.push(args)
    return security.rateLimitOk
  },
}))

const getActiveMembershipMock = vi.fn()
const getSessionStateMock = vi.fn()
const recordPositionMock = vi.fn()
vi.mock('./locationService.js', () => ({
  getActiveMembership: (...a: unknown[]) => getActiveMembershipMock(...a),
  getSessionState: (...a: unknown[]) => getSessionStateMock(...a),
  recordPosition: (...a: unknown[]) => recordPositionMock(...a),
}))

const publishMock = vi.fn()
vi.mock('@dhcb/core-chat/redisChat', () => ({
  publish: (...a: unknown[]) => publishMock(...a),
  subscribeChannel: () => () => {},
}))

import { EventEmitter } from 'node:events'
import {
  _resetWsLocationStateForTests,
  attachLocationWebSocketServer,
  handleConnection,
  LOCATION_WS_EVENTS_PER_MIN,
  LOCATION_WS_MAX_PAYLOAD,
} from './wsLocation.js'

const SESSION_ID = '11111111-1111-4111-8111-111111111111'

/** Socket giả tối giản: đủ on('message'/'close'), send() và readyState như ws thật. */
function fakeSocket() {
  const handlers = new Map<string, (arg: unknown) => void>()
  const sent: unknown[] = []
  return {
    ws: {
      readyState: 1,
      on(event: string, fn: (arg: unknown) => void) {
        handlers.set(event, fn)
      },
      send(data: string) {
        sent.push(JSON.parse(data))
      },
    },
    sent,
    async message(payload: unknown) {
      handlers.get('message')!(JSON.stringify(payload))
      // Handler xử lý bất đồng bộ (rate limit + kiểm quyền ở DB) — nhường vài vòng event loop.
      for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0))
    },
  }
}

beforeEach(() => {
  _resetWsLocationStateForTests()
  security.rateLimitOk = true
  security.calls.length = 0
  getActiveMembershipMock.mockReset()
  getSessionStateMock.mockReset()
  recordPositionMock.mockReset()
  publishMock.mockReset()
})

describe('handleConnection', () => {
  it('gói tin không phải JSON → báo lỗi, không đụng DB', async () => {
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message('{{{')
    expect(getActiveMembershipMock).not.toHaveBeenCalled()
  })

  it('sự kiện sai định dạng (thiếu sessionId) → lỗi, không đụng DB', async () => {
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message({ type: 'position' })
    expect(s.sent.at(-1)).toMatchObject({ type: 'error' })
    expect(getActiveMembershipMock).not.toHaveBeenCalled()
  })

  it('subscribe khi không còn là thành viên → lỗi, KHÔNG trả state', async () => {
    getActiveMembershipMock.mockResolvedValue(null)
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message({ type: 'subscribe', sessionId: SESSION_ID })
    expect(s.sent.at(-1)).toMatchObject({ type: 'error' })
    expect(getSessionStateMock).not.toHaveBeenCalled()
  })

  it('subscribe hợp lệ → gửi toàn cảnh chuyến', async () => {
    getActiveMembershipMock.mockResolvedValue({ sharingEnabled: true, precisionMode: 'exact' })
    getSessionStateMock.mockResolvedValue({ sessionId: SESSION_ID, members: [] })
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message({ type: 'subscribe', sessionId: SESSION_ID })
    expect(s.sent.at(-1)).toMatchObject({ type: 'state' })
  })

  it('gửi vị trí khi đang TẮT chia sẻ → không phát cho ai, cũng không báo lỗi', async () => {
    getActiveMembershipMock.mockResolvedValue({ sharingEnabled: false, precisionMode: 'exact' })
    recordPositionMock.mockResolvedValue(null)
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message({ type: 'position', sessionId: SESSION_ID, position: { lat: 10, lng: 106 } })
    expect(publishMock).not.toHaveBeenCalled()
    expect(s.sent).toHaveLength(0)
  })

  it('gửi vị trí hợp lệ → phát lên kênh của chuyến', async () => {
    getActiveMembershipMock.mockResolvedValue({ sharingEnabled: true, precisionMode: 'exact' })
    recordPositionMock.mockResolvedValue({ userId: 'u1' })
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message({ type: 'position', sessionId: SESSION_ID, position: { lat: 10, lng: 106 } })
    expect(publishMock).toHaveBeenCalledWith(`loc:session:${SESSION_ID}`, {
      type: 'position',
      sessionId: SESSION_ID,
      member: { userId: 'u1' },
    })
  })

  it('unsubscribe không cần kiểm quyền (chỉ là dọn dẹp phía server)', async () => {
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message({ type: 'unsubscribe', sessionId: SESSION_ID })
    expect(getActiveMembershipMock).not.toHaveBeenCalled()
  })
})

describe('vá 2026-09-27 — Origin, kích thước khung, tần suất', () => {
  it('đặt maxPayload nhỏ (không để mặc định 100 MiB của ws)', () => {
    attachLocationWebSocketServer(new EventEmitter() as never)
    expect(wssOptions.last).toMatchObject({ maxPayload: LOCATION_WS_MAX_PAYLOAD })
  })

  it.each([undefined, 'https://sales.donghanhcungban.org', 'https://evil.test'])(
    'upgrade từ Origin %s → 403 (chống chiếm phiên WebSocket chứa vị trí GPS)',
    async (origin) => {
      const server = new EventEmitter()
      attachLocationWebSocketServer(server as never)
      const socket = { write: vi.fn(), destroy: vi.fn() }
      server.emit(
        'upgrade',
        { url: '/ws/location', headers: { cookie: 'session_token=x', origin } },
        socket,
        Buffer.alloc(0),
      )
      await new Promise((r) => setTimeout(r, 0))
      expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('403'))
      expect(socket.destroy).toHaveBeenCalled()
    },
  )

  it('vượt trần sự kiện/phút theo userId → báo lỗi, KHÔNG ghi vị trí, KHÔNG phát', async () => {
    security.rateLimitOk = false
    getActiveMembershipMock.mockResolvedValue({ sharingEnabled: true, precisionMode: 'exact' })
    const s = fakeSocket()
    handleConnection(s.ws as never, 'u1')
    await s.message({ type: 'position', sessionId: SESSION_ID, position: { lat: 10, lng: 106 } })
    expect(security.calls).toContainEqual(['u1', LOCATION_WS_EVENTS_PER_MIN, 'location-ws'])
    expect(recordPositionMock).not.toHaveBeenCalled()
    expect(publishMock).not.toHaveBeenCalled()
    expect(s.sent).toContainEqual(expect.objectContaining({ type: 'error' }))
  })
})

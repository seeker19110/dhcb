import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import {
  attachVoiceWebSocketServer,
  WS_VOICE_PATH,
  _resetWsVoiceHandlerStateForTests,
} from './wsVoiceHandler.js'

const authState: { user: { userId: string } | null } = { user: null }
const TRUSTED_ORIGIN = 'https://en-vi.donghanhcungban.org'
vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: async () => authState.user,
  isAllowedWebSocketOrigin: (origin: unknown) => origin === 'https://en-vi.donghanhcungban.org',
}))

describe('wsVoiceHandler unit', () => {
  beforeEach(() => {
    _resetWsVoiceHandlerStateForTests()
    authState.user = null
  })

  it('từ chối kết nối khi chưa đăng nhập (validateAuth trả về null)', async () => {
    const fakeHttpServer = new EventEmitter()
    attachVoiceWebSocketServer(fakeHttpServer as unknown as import('node:http').Server)

    let destroyed = false
    let written = ''
    const fakeSocket = {
      write: (data: string) => {
        written += data
      },
      destroy: () => {
        destroyed = true
      },
    }

    fakeHttpServer.emit(
      'upgrade',
      { url: WS_VOICE_PATH, headers: { origin: TRUSTED_ORIGIN } },
      fakeSocket,
      Buffer.alloc(0),
    )
    await new Promise((r) => setTimeout(r, 20))

    expect(written).toContain('401')
    expect(destroyed).toBe(true)
  })

  it('bỏ qua upgrade nếu không phải WS_VOICE_PATH', async () => {
    const fakeHttpServer = new EventEmitter()
    attachVoiceWebSocketServer(fakeHttpServer as unknown as import('node:http').Server)

    let destroyed = false
    const fakeSocket = {
      write: () => {},
      destroy: () => {
        destroyed = true
      },
    }

    fakeHttpServer.emit('upgrade', { url: '/ws/chat', headers: {} }, fakeSocket, Buffer.alloc(0))
    await new Promise((r) => setTimeout(r, 20))

    expect(destroyed).toBe(false)
  })
})

describe('wsVoiceHandler — chống chiếm phiên WebSocket (vá 2026-09-27)', () => {
  it.each([undefined, 'https://sales.donghanhcungban.org', 'https://evil.test'])(
    'Origin %s → 403 trước cả bước kiểm phiên',
    async (origin) => {
      authState.user = { userId: 'u1' }
      const fakeHttpServer = new EventEmitter()
      attachVoiceWebSocketServer(fakeHttpServer as unknown as import('node:http').Server)
      let written = ''
      let destroyed = false
      const fakeSocket = {
        write: (data: string) => {
          written += data
        },
        destroy: () => {
          destroyed = true
        },
      }
      fakeHttpServer.emit(
        'upgrade',
        { url: WS_VOICE_PATH, headers: { origin } },
        fakeSocket,
        Buffer.alloc(0),
      )
      await new Promise((r) => setTimeout(r, 20))
      expect(written).toContain('403')
      expect(destroyed).toBe(true)
    },
  )
})

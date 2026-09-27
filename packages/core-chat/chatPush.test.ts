// packages/core-chat/chatPush.test.ts — Unit tests cho chức năng gửi Web Push tin nhắn offline

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyOfflinePeers } from './chatPush.js'
import * as redisChatModule from './redisChat.js'
import * as pgPoolModule from '@dhcb/core-db/pgPool'
import webpush from 'web-push'

describe('chatPush: notifyOfflinePeers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('bỏ qua nếu không có peers hoặc peer rỗng', async () => {
    const result = await notifyOfflinePeers([], 'sender-1', 'room-1', 'hello')
    expect(result).toEqual({ sent: 0, skipped: 0 })
  })

  it('bỏ qua nếu peer chính là người gửi hoặc đang online', async () => {
    vi.spyOn(redisChatModule, 'isOnline').mockResolvedValue(true)

    const result = await notifyOfflinePeers(['sender-1', 'peer-1'], 'sender-1', 'room-1', 'hello')
    expect(result).toEqual({ sent: 0, skipped: 2 })
  })

  it('gửi push notification cho peer offline và rút gọn tin nhắn > 80 ký tự', async () => {
    vi.spyOn(redisChatModule, 'isOnline').mockResolvedValue(false)

    const longMessage = 'A'.repeat(100)
    const queryMock = vi.fn().mockImplementation((query: string) => {
      if (query.includes('profiles')) {
        return Promise.resolve({ rows: [{ name: 'Nguyen Van A' }] })
      }
      if (query.includes('push_subscriptions')) {
        return Promise.resolve({
          rows: [
            {
              endpoint: 'https://fcm.googleapis.com/fcm/send/test',
              p256dh: 'p256dh-key',
              auth_key: 'auth-key',
            },
          ],
        })
      }
      return Promise.resolve({ rows: [] })
    })

    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: queryMock,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const sendPushMock = vi.spyOn(webpush, 'sendNotification').mockResolvedValue({} as never)

    const result = await notifyOfflinePeers(['peer-1'], 'sender-1', 'room-1', longMessage)

    expect(result.sent).toBe(1)
    expect(sendPushMock).toHaveBeenCalledTimes(1)
    expect(sendPushMock).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://fcm.googleapis.com/fcm/send/test' }),
      expect.stringContaining('...'),
    )
  })

  it('CHẶN HỒI QUY 2026-09-27: KHÔNG gửi tới endpoint ngoài dịch vụ push (SSRF/lộ IP origin)', async () => {
    vi.spyOn(redisChatModule, 'isOnline').mockResolvedValue(false)
    const queryMock = vi.fn().mockImplementation((query: string) => {
      if (query.includes('push_subscriptions')) {
        return Promise.resolve({
          rows: [
            { endpoint: 'https://attacker.example/x', p256dh: 'p', auth_key: 'a' },
            { endpoint: 'https://127.0.0.1:6379/', p256dh: 'p', auth_key: 'a' },
            { endpoint: 'https://fcm.googleapis.com/fcm/send/ok', p256dh: 'p', auth_key: 'a' },
          ],
        })
      }
      return Promise.resolve({ rows: [] })
    })
    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: queryMock,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)
    const sendPushMock = vi.spyOn(webpush, 'sendNotification').mockResolvedValue({} as never)

    await notifyOfflinePeers(['peer-1'], 'sender-1', 'room-1', 'hi')

    expect(sendPushMock).toHaveBeenCalledTimes(1)
    expect(sendPushMock.mock.calls[0]?.[0]).toMatchObject({
      endpoint: 'https://fcm.googleapis.com/fcm/send/ok',
    })
  })

  it('xử lý khi người dùng không có subscription hoặc query bị lỗi', async () => {
    vi.spyOn(redisChatModule, 'isOnline').mockResolvedValue(false)

    const queryMock = vi.fn().mockImplementation((query: string) => {
      if (query.includes('profiles')) {
        return Promise.reject(new Error('Profile query failed'))
      }
      if (query.includes('push_subscriptions')) {
        return Promise.resolve({ rows: [] })
      }
      return Promise.resolve({ rows: [] })
    })

    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: queryMock,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const result = await notifyOfflinePeers(['peer-1'], 'sender-1', 'room-1', 'Alo?')

    expect(result.sent).toBe(0)
    expect(result.skipped).toBe(1)
  })

  it('tự động dọn dẹp subscription hết hạn (410 Gone hoặc 404 Not Found)', async () => {
    vi.spyOn(redisChatModule, 'isOnline').mockResolvedValue(false)

    const queryMock = vi.fn().mockImplementation((query: string) => {
      if (query.includes('profiles')) {
        return Promise.resolve({ rows: [{ name: null }] })
      }
      if (query.includes('push_subscriptions')) {
        return Promise.resolve({
          rows: [
            {
              endpoint: 'https://fcm.googleapis.com/fcm/send/expired-410',
              p256dh: 'key',
              auth_key: 'auth',
            },
            {
              endpoint: 'https://fcm.googleapis.com/fcm/send/expired-404',
              p256dh: 'key2',
              auth_key: 'auth2',
            },
            {
              endpoint: 'https://fcm.googleapis.com/fcm/send/generic-err',
              p256dh: 'key3',
              auth_key: 'auth3',
            },
          ],
        })
      }
      return Promise.resolve({ rows: [] })
    })

    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: queryMock,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    vi.spyOn(webpush, 'sendNotification').mockImplementation((target: { endpoint: string }) => {
      if (target.endpoint.includes('410')) {
        return Promise.reject(Object.assign(new Error('Gone'), { statusCode: 410 }))
      }
      if (target.endpoint.includes('404')) {
        return Promise.reject(Object.assign(new Error('Not Found'), { statusCode: 404 }))
      }
      return Promise.reject(new Error('Network error'))
    })

    const result = await notifyOfflinePeers(['peer-1'], 'sender-1', 'room-1', 'Alo?')

    expect(result.sent).toBe(0)
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('delete from public.push_subscriptions'),
      [
        [
          'https://fcm.googleapis.com/fcm/send/expired-410',
          'https://fcm.googleapis.com/fcm/send/expired-404',
        ],
      ],
    )
  })

  it('xử lý khi query push_subscriptions bị throw exception', async () => {
    vi.spyOn(redisChatModule, 'isOnline').mockResolvedValue(false)

    const queryMock = vi.fn().mockImplementation((query: string) => {
      if (query.includes('push_subscriptions')) {
        return Promise.reject(new Error('DB connection failed'))
      }
      return Promise.resolve({ rows: [] })
    })

    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: queryMock,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const result = await notifyOfflinePeers(['peer-1'], 'sender-1', 'room-1', 'Alo?')

    expect(result.sent).toBe(0)
    expect(result.skipped).toBe(1)
  })
})

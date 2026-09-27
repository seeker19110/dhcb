import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { subscribePush, unsubscribePush } from './pushNotif'

const subscription = {
  toJSON: vi.fn(() => ({ endpoint: 'https://push.example/sub', keys: { p256dh: 'p', auth: 'a' } })),
  unsubscribe: vi.fn<() => Promise<boolean>>(),
} as PushSubscription

const pushManager = {
  getSubscription: vi.fn<() => Promise<PushSubscription | null>>(),
  subscribe: vi.fn<() => Promise<PushSubscription>>(),
} as PushManager

const registration = { pushManager } as ServiceWorkerRegistration

function response(body: object, ok = true): Response {
  return { ok, json: vi.fn().mockResolvedValue(body) } as Response
}

beforeEach(() => {
  vi.restoreAllMocks()
  subscription.toJSON = vi.fn(() => ({
    endpoint: 'https://push.example/sub',
    keys: { p256dh: 'p', auth: 'a' },
  }))
  subscription.unsubscribe = vi.fn().mockResolvedValue(true)
  pushManager.getSubscription = vi.fn().mockResolvedValue(subscription)
  pushManager.subscribe = vi.fn().mockResolvedValue(subscription)

  Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} })
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      getRegistration: vi.fn().mockResolvedValue(registration),
    },
  })
})

afterEach(() => vi.unstubAllGlobals())

describe('subscribePush', () => {
  it('preflight denied không fetch VAPID hoặc hỏi quyền lại', async () => {
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'denied', requestPermission: vi.fn() },
    })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(subscribePush(11)).resolves.toEqual({ status: 'denied' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(Notification.requestPermission).not.toHaveBeenCalled()
  })

  it('trả denied khi trình duyệt từ chối quyền', async () => {
    vi.spyOn(Notification, 'requestPermission').mockResolvedValue('denied')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ publicKey: 'AQ' })))

    await expect(subscribePush(11)).resolves.toEqual({ status: 'denied' })
  })

  it('trả partial khi browser đã đăng ký nhưng server thất bại', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ publicKey: 'AQ' }))
        .mockResolvedValueOnce(response({}, false)),
    )

    await expect(subscribePush(11)).resolves.toEqual({
      status: 'partial',
      serverUpdated: false,
      browserUpdated: true,
    })
  })

  it('trả success khi browser và server đều hoàn tất', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ publicKey: 'AQ' }))
        .mockResolvedValueOnce(response({ ok: true })),
    )

    await expect(subscribePush(11)).resolves.toEqual({ status: 'success' })
  })

  it('trả failed khi chưa cập nhật browser và VAPID request thất bại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, false)))

    await expect(subscribePush(11)).resolves.toEqual({ status: 'failed' })
    expect(pushManager.getSubscription).not.toHaveBeenCalled()
  })
})

describe('unsubscribePush', () => {
  it('giữ browser subscription khi server chưa xác nhận', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, false)))

    await expect(unsubscribePush()).resolves.toEqual({ status: 'failed' })
    expect(subscription.unsubscribe).not.toHaveBeenCalled()
  })

  it('trả partial khi server đã tắt nhưng browser unsubscribe thất bại', async () => {
    subscription.unsubscribe = vi.fn().mockRejectedValue(new Error('browser failure'))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ok: true })))

    await expect(unsubscribePush()).resolves.toEqual({
      status: 'partial',
      serverUpdated: true,
      browserUpdated: false,
    })
  })

  it('trả success khi server xác nhận rồi browser unsubscribe hoàn tất', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ok: true })))

    await expect(unsubscribePush()).resolves.toEqual({ status: 'success' })
    expect(subscription.unsubscribe).toHaveBeenCalledOnce()
  })
})

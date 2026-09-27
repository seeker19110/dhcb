import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isDifferentServerKey, subscribePush, unsubscribePush } from './pushNotif'

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

  it('subscription cũ gắn khoá VAPID KHÁC (server đã xoay khoá) → huỷ rồi đăng ký lại', async () => {
    // publicKey 'AQ' = đúng 1 byte 0x01; subscription cũ gắn khoá 0x02.
    const oldSub = {
      ...subscription,
      options: { applicationServerKey: new Uint8Array([2]).buffer, userVisibleOnly: true },
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription
    pushManager.getSubscription = vi.fn().mockResolvedValue(oldSub)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ publicKey: 'AQ' }))
        .mockResolvedValueOnce(response({ ok: true })),
    )

    await expect(subscribePush(11)).resolves.toEqual({ status: 'success' })
    expect(oldSub.unsubscribe).toHaveBeenCalledTimes(1)
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1)
  })

  it('subscription gắn ĐÚNG khoá hiện tại → dùng lại, không đăng ký mới', async () => {
    const sameSub = {
      ...subscription,
      options: { applicationServerKey: new Uint8Array([1]).buffer, userVisibleOnly: true },
      unsubscribe: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscription
    pushManager.getSubscription = vi.fn().mockResolvedValue(sameSub)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ publicKey: 'AQ' }))
        .mockResolvedValueOnce(response({ ok: true })),
    )

    await expect(subscribePush(11)).resolves.toEqual({ status: 'success' })
    expect(sameSub.unsubscribe).not.toHaveBeenCalled()
    expect(pushManager.subscribe).not.toHaveBeenCalled()
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

describe('isDifferentServerKey', () => {
  it('không biết khoá cũ (trình duyệt cũ) → coi như giống, giữ subscription', () => {
    expect(isDifferentServerKey(null, new Uint8Array([1]))).toBe(false)
    expect(isDifferentServerKey(undefined, new Uint8Array([1]))).toBe(false)
  })
  it('so từng byte, khác độ dài cũng là khác', () => {
    expect(isDifferentServerKey(new Uint8Array([1, 2]).buffer, new Uint8Array([1, 2]))).toBe(false)
    expect(isDifferentServerKey(new Uint8Array([1, 3]).buffer, new Uint8Array([1, 2]))).toBe(true)
    expect(isDifferentServerKey(new Uint8Array([1]).buffer, new Uint8Array([1, 2]))).toBe(true)
  })
})

import { getAuthHeader } from '@core/authHeader'
// pushNotif.ts — Đăng ký / hủy Web Push Notification
// Yêu cầu: trình duyệt hỗ trợ serviceWorker + PushManager (Chrome/Edge/Firefox/Safari 16.4+)

const SW_PATH = '/sw.js'

export type PushActionResult =
  | { status: 'success' }
  | { status: 'denied' }
  | { status: 'failed' }
  | { status: 'partial'; serverUpdated: boolean; browserUpdated: boolean }

// Kiểm tra trình duyệt có hỗ trợ push không
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Lấy trạng thái quyền thông báo hiện tại
export function getNotifPermission(): NotificationPermission {
  return Notification.permission
}

// Đăng ký SW + subscribe push, gửi subscription lên server.
// remindHour: giờ UTC (0–23) muốn được nhắc học mỗi ngày (server gửi đúng giờ này).
export async function subscribePush(remindHour?: number): Promise<PushActionResult> {
  if (!isPushSupported()) return { status: 'failed' }
  if (getNotifPermission() === 'denied') return { status: 'denied' }

  let browserUpdated = false

  try {
    // Lấy VAPID public key từ server
    const res = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vapid-key' }),
    })
    if (!res.ok) {
      return { status: 'failed' }
    }
    const data = (await res.json()) as unknown
    if (!data || typeof data !== 'object' || !('publicKey' in data)) {
      return { status: 'failed' }
    }
    const { publicKey } = data as { publicKey?: unknown }
    if (typeof publicKey !== 'string' || !publicKey) {
      return { status: 'failed' }
    }

    // Đăng ký service worker
    const reg = await navigator.serviceWorker.register(SW_PATH)
    await navigator.serviceWorker.ready

    // Xin quyền thông báo
    const permission = await Notification.requestPermission()
    if (permission === 'denied') return { status: 'denied' }
    if (permission !== 'granted') return { status: 'failed' }

    // Subscribe push (Notification.requestPermission đã hỏi ở trên)
    const serverKey = urlBase64ToUint8Array(publicKey)
    let existing = await reg.pushManager.getSubscription()
    // Subscription cũ gắn với khoá VAPID CŨ (server đã xoay khoá, vd sau sự cố lộ khoá
    // 2026-09-27) thì dịch vụ push từ chối mọi thông báo — dùng lại nó là người dùng âm thầm
    // mất nhắc học mãi mãi. Khác khoá → huỷ rồi đăng ký lại bằng khoá hiện tại.
    if (existing && isDifferentServerKey(existing.options?.applicationServerKey, serverKey)) {
      await existing.unsubscribe().catch(() => false)
      existing = null
    }
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: serverKey as unknown as ArrayBuffer,
      }))
    browserUpdated = true

    // Gửi subscription lên server (kèm giờ nhắc nếu có)
    const r = await fetch('/api/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ action: 'subscribe', subscription: sub.toJSON(), remindHour }),
    })
    if (!r.ok) {
      return { status: 'partial', serverUpdated: false, browserUpdated: true }
    }
    const respData = (await r.json()) as unknown
    if (!respData || typeof respData !== 'object' || !('ok' in respData)) {
      return { status: 'partial', serverUpdated: false, browserUpdated: true }
    }
    return (respData as { ok?: unknown }).ok === true
      ? { status: 'success' }
      : { status: 'partial', serverUpdated: false, browserUpdated: true }
  } catch {
    return browserUpdated
      ? { status: 'partial', serverUpdated: false, browserUpdated: true }
      : { status: 'failed' }
  }
}

// Hủy đăng ký push
export async function unsubscribePush(): Promise<PushActionResult> {
  if (!isPushSupported()) return { status: 'failed' }
  let serverUpdated = false
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH)
    const sub = await reg?.pushManager?.getSubscription()
    if (!sub) return { status: 'success' }

    const response = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ action: 'unsubscribe', subscription: sub.toJSON() }),
    })
    if (!response.ok) return { status: 'failed' }

    const responseData = (await response.json()) as unknown
    if (
      !responseData ||
      typeof responseData !== 'object' ||
      !('ok' in responseData) ||
      (responseData as { ok?: unknown }).ok !== true
    ) {
      return { status: 'failed' }
    }
    serverUpdated = true

    const browserUpdated = await sub.unsubscribe()
    return browserUpdated
      ? { status: 'success' }
      : { status: 'partial', serverUpdated: true, browserUpdated: false }
  } catch {
    return serverUpdated
      ? { status: 'partial', serverUpdated: true, browserUpdated: false }
      : { status: 'failed' }
  }
}

/**
 * Khoá VAPID mà subscription hiện có đang gắn có KHÁC khoá server trả về không. Trình duyệt cũ
 * không báo khoá (`null`/không có) → coi như không biết, giữ subscription như hành vi cũ.
 */
export function isDifferentServerKey(
  current: ArrayBuffer | null | undefined,
  serverKey: Uint8Array,
): boolean {
  if (!current) return false
  const bytes = new Uint8Array(current)
  if (bytes.length !== serverKey.length) return true
  return bytes.some((b, i) => b !== serverKey[i])
}

// Chuyển VAPID public key từ base64url sang Uint8Array (PushManager yêu cầu)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

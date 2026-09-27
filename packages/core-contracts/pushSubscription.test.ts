// Canh gác chính sách endpoint Web Push — chặn SSRF/lộ IP origin (vá 2026-09-27).
import { describe, expect, it } from 'vitest'
import {
  isAllowedPushEndpoint,
  PushSubscriptionSchema,
  PUSH_ENDPOINT_MAX,
} from './pushSubscription.js'

describe('isAllowedPushEndpoint', () => {
  it.each([
    // Endpoint dạng thật của từng trình duyệt.
    'https://fcm.googleapis.com/fcm/send/cXyZ:APA91bH-abc',
    'https://fcm.googleapis.com/wp/dGVzdA',
    'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABk',
    'https://web.push.apple.com/QGuQyavXutnMH3uEXyh',
    'https://api.push.apple.com/3/device/abc',
    'https://wns2-bn3p.notify.windows.com/w/?token=BQYAAAB',
    'https://FCM.GoogleApis.com/fcm/send/x', // host không phân biệt hoa/thường
    'https://fcm.googleapis.com:443/fcm/send/x', // cổng mặc định viết tường minh
  ])('cho phép %s', (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(true)
  })

  it.each([
    ['máy của kẻ tấn công (lộ IP origin)', 'https://attacker.example/collect'],
    ['localhost', 'https://localhost/api/admin-users'],
    ['IP nội bộ', 'https://10.0.0.5/'],
    ['metadata cloud', 'https://169.254.169.254/latest/meta-data/'],
    ['http thường', 'http://fcm.googleapis.com/fcm/send/x'],
    ['cổng lạ', 'https://fcm.googleapis.com:8443/fcm/send/x'],
    ['đuôi giả mạo', 'https://fcm.googleapis.com.attacker.example/x'],
    ['hậu tố không có dấu chấm', 'https://evilnotify.windows.com/x'],
    ['kèm thông tin đăng nhập', 'https://user:pw@fcm.googleapis.com/fcm/send/x'],
    ['giao thức khác', 'ftp://fcm.googleapis.com/x'],
    ['không phải URL', 'không phải url'],
    ['rỗng', ''],
  ])('chặn %s', (_label, endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(false)
  })
})

describe('PushSubscriptionSchema', () => {
  const ok = { endpoint: 'https://fcm.googleapis.com/fcm/send/x', keys: { p256dh: 'p', auth: 'a' } }

  it('nhận subscription hợp lệ', () => {
    expect(PushSubscriptionSchema.safeParse(ok).success).toBe(true)
  })

  it('chặn trường rỗng và chuỗi quá dài (không cho rác phình bảng)', () => {
    expect(PushSubscriptionSchema.safeParse({ ...ok, endpoint: '' }).success).toBe(false)
    expect(
      PushSubscriptionSchema.safeParse({
        ...ok,
        endpoint: 'https://x/' + 'a'.repeat(PUSH_ENDPOINT_MAX),
      }).success,
    ).toBe(false)
    expect(
      PushSubscriptionSchema.safeParse({ ...ok, keys: { p256dh: 'p'.repeat(257), auth: 'a' } })
        .success,
    ).toBe(false)
    expect(
      PushSubscriptionSchema.safeParse({ ...ok, keys: { p256dh: 'p', auth: 'a'.repeat(65) } })
        .success,
    ).toBe(false)
  })
})

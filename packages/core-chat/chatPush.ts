// packages/core-chat/chatPush.ts — Gửi Web Push Notification khi có tin nhắn chat mới
// cho người dùng đang offline / không mở WebSocket.

import webpush from 'web-push'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { isAllowedPushEndpoint } from '@dhcb/core-contracts/pushSubscription'
import { isOnline } from './redisChat.js'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@example.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
  } catch {
    // Tránh crash nếu key không hợp lệ trong môi trường test
  }
}

interface PushSubRow {
  endpoint: string
  p256dh: string
  auth_key: string
}

/**
 * Gửi Web Push Notification cho các peer trong phòng chat nếu họ đang offline.
 */
export async function notifyOfflinePeers(
  peerIds: string[],
  senderUserId: string,
  roomId: string,
  messageContent: string,
): Promise<{ sent: number; skipped: number }> {
  if (peerIds.length === 0) return { sent: 0, skipped: 0 }

  const offlinePeerIds: string[] = []
  for (const peerId of peerIds) {
    if (peerId === senderUserId) continue
    const online = await isOnline(peerId)
    if (!online) {
      offlinePeerIds.push(peerId)
    }
  }

  if (offlinePeerIds.length === 0) {
    return { sent: 0, skipped: peerIds.length }
  }

  const pool = getPgPool()

  // Lấy tên người gửi — cùng nguồn `profiles.name` mà màn chat dùng (chatService.ts).
  // [2026-10-08] Bản cũ đọc cột `display_name` KHÔNG tồn tại trên public.profiles: câu lệnh lỗi ở
  // MỌI lần gọi, catch rỗng nuốt mất nên thông báo luôn ghi "Bạn học" mà không ai biết. Giữ
  // fallback (thiếu tên không đáng chặn thông báo) nhưng phải để lại dấu vết trong log.
  let senderName = 'Bạn học'
  try {
    const profileRes = await pool.query<{ name: string | null }>(
      'select name from public.profiles where id = $1 limit 1',
      [senderUserId],
    )
    const name = profileRes.rows[0]?.name?.trim()
    if (name) senderName = name
  } catch (err) {
    console.warn(
      '[chatPush] không đọc được tên người gửi → dùng tên mặc định:',
      err instanceof Error ? err.message : err,
    )
  }

  // Rút gọn preview tin nhắn nếu quá dài
  const preview = messageContent.length > 80 ? messageContent.slice(0, 77) + '...' : messageContent

  const payload = JSON.stringify({
    title: `💬 Tin nhắn mới từ ${senderName}`,
    body: preview,
    url: `/tin-nhan?roomId=${roomId}`,
    tag: `chat-room-${roomId}`,
  })

  let sent = 0
  let skipped = 0

  for (const peerId of offlinePeerIds) {
    try {
      const subsRes = await pool.query<PushSubRow>(
        `select endpoint, p256dh, auth_key from public.push_subscriptions where user_id = $1`,
        [peerId],
      )

      if (subsRes.rows.length === 0) {
        skipped++
        continue
      }

      const expiredEndpoints: string[] = []

      await Promise.all(
        subsRes.rows.map(async (sub) => {
          // Chỉ gửi tới dịch vụ push thật: mỗi tin nhắn chat là một lần server POST tới
          // endpoint — không lọc thì kẻ xấu biến chat thành công cụ SSRF/dò IP origin theo ý
          // muốn (vá 2026-09-27, xem core-contracts/pushSubscription.ts).
          if (!isAllowedPushEndpoint(sub.endpoint)) return
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth_key,
                },
              },
              payload,
            )
            sent++
          } catch (err: unknown) {
            const status =
              err && typeof err === 'object' && 'statusCode' in err ? err.statusCode : undefined
            if (status === 410 || status === 404) {
              expiredEndpoints.push(sub.endpoint)
              return
            }
            // Lỗi khác (VAPID sai, dịch vụ push 5xx/429, mạng) trước đây bị nuốt im lặng (audit
            // 2026-10-10, E1.8). Không log endpoint — đó là định danh thiết bị người dùng.
            console.warn(
              '[chatPush] gửi push lỗi:',
              status ?? (err instanceof Error ? err.message : String(err)),
            )
          }
        }),
      )

      // Xóa subscription đã hết hạn
      if (expiredEndpoints.length > 0) {
        await pool.query(`delete from public.push_subscriptions where endpoint = any($1::text[])`, [
          expiredEndpoints,
        ])
      }
    } catch {
      skipped++
    }
  }

  return { sent, skipped }
}

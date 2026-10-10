// actorUsage.ts — MỘT cửa duy nhất để 3 endpoint AI/audio (/api/agent, /api/stt, /api/tts) trừ
// lượt, dù người gọi là tài khoản thật hay khách vãng lai.
//
// Đặc tả: docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md
//
// Vì sao gom vào đây thay vì mỗi handler tự rẽ nhánh `if (actor.kind === 'guest')`: ba handler
// có ba luồng hoàn lượt khác nhau (ai.ts hoàn ở 6 chỗ), nhân đôi nhánh ở từng chỗ là cách chắc
// chắn nhất để một hôm nào đó quên một chỗ và khách dùng được vô hạn ở đúng chỗ bị quên.
//
// Bất biến: người ĐÃ đăng nhập đi qua đây không khác gì trước — vẫn đúng
// checkAndConsumeUsage()/refundUsage() của `@dhcb/core-billing/usage`, cùng tham số, cùng thứ tự.

import { checkAndConsumeUsage, refundUsage, type UsageMode } from '@dhcb/core-billing/usage'
import type { Actor } from './guest.js'
import { checkAndConsumeGuestTrial, refundGuestTrial } from './guestTrial.js'

export type ActorGate =
  { ok: true; day: string } | { ok: false; message: string; guestTrialExhausted: boolean }

/**
 * Trừ 1 lượt cho người gọi.
 * - Tài khoản thật → hạn mức theo gói (Free/VIP), đếm trong `daily_usage` như cũ.
 * - Khách → hạn mức dùng thử rất thấp, đếm theo id trình duyệt + IP.
 *
 * `day` trả kèm chỉ có ý nghĩa với tài khoản thật (ngày đã trừ lượt, để hoàn đúng dòng); với
 * khách nó là chuỗi rỗng và `refundActorUsage` bỏ qua.
 */
export async function checkAndConsumeActorUsage(
  actor: Actor,
  mode: UsageMode,
  ip: string,
): Promise<ActorGate> {
  if (actor.kind === 'user') {
    const gate = await checkAndConsumeUsage(actor.userId, mode)
    return gate.ok ? gate : { ok: false, message: gate.message, guestTrialExhausted: false }
  }
  const gate = await checkAndConsumeGuestTrial(actor.guestKey, ip)
  return gate.ok
    ? { ok: true, day: '' }
    : // Không đếm được (Redis) ≠ hết lượt: không mời đăng ký khi khách chưa dùng lượt nào.
      { ok: false, message: gate.message ?? '', guestTrialExhausted: gate.unavailable !== true }
}

/** Hoàn lại lượt vừa trừ khi nhà cung cấp AI lỗi. Nuốt lỗi — không bao giờ làm vỡ luồng trả lỗi. */
export async function refundActorUsage(
  actor: Actor,
  mode: UsageMode,
  day: string,
  ip: string,
): Promise<void> {
  if (actor.kind === 'user') {
    await refundUsage(actor.userId, mode, day || undefined)
    return
  }
  await refundGuestTrial(actor.guestKey, ip)
}

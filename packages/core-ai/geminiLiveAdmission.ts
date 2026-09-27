// Cổng dùng chung REST/WS: giữ chỗ trước mọi await để hai request cùng người không vượt nhau.
// Giới hạn phiên đồng thời là theo tiến trình; quota ngày vẫn được trừ nguyên tử trong DB.
import { checkRateLimit } from '@dhcb/core-auth/security'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'

const reservedUsers = new Map<string, symbol>()

export interface GeminiLiveAdmission {
  release(): void
  markStarted(): void
  refundBeforeStart(): Promise<void>
}

export async function reserveGeminiLiveUsage(
  userId: string,
): Promise<
  { ok: true; admission: GeminiLiveAdmission } | { ok: false; status: 429 | 503; message: string }
> {
  if (reservedUsers.has(userId)) {
    return { ok: false, status: 429, message: 'Bạn đang có một phiên giọng nói đang mở.' }
  }
  const token = Symbol()
  reservedUsers.set(userId, token)
  const release = () => {
    if (reservedUsers.get(userId) === token) reservedUsers.delete(userId)
  }
  try {
    if (!(await checkRateLimit(userId, 5, 'gemini-live-user'))) {
      release()
      return { ok: false, status: 429, message: 'Quá nhiều phiên giọng nói — thử lại sau.' }
    }
    const gate = await checkAndConsumeUsage(userId, 'speaking')
    if (!gate.ok) {
      release()
      return { ok: false, status: 429, message: gate.message }
    }
    let started = false
    let refunded = false
    return {
      ok: true,
      admission: {
        release,
        markStarted: () => {
          started = true
        },
        refundBeforeStart: async () => {
          if (started || refunded) return
          // Đánh dấu TRƯỚC await: close/error/catch đồng thời chỉ hoàn đúng một lần.
          refunded = true
          await refundUsage(userId, 'speaking', gate.day).catch(() => {})
        },
      },
    }
  } catch {
    release()
    return { ok: false, status: 503, message: 'Tạm thời không thể mở phiên giọng nói.' }
  }
}

export function _resetGeminiLiveAdmissionForTests(): void {
  reservedUsers.clear()
}

// apps/dhcb/src/lib/feedbackApi.ts — Client API gửi và tra cứu ý kiến đóng góp người dùng.
import { getAuthHeader } from '@core/authHeader'
import type { CreateFeedbackInput } from '@dhcb/core-contracts/feedback'

export async function submitFeedback(
  input: CreateFeedbackInput,
): Promise<{ ok: true; id: string; message: string } | { ok: false; error: string }> {
  try {
    const authHeaders = getAuthHeader()
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(input),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      // `HTTP <mã>` (không phải "Lỗi <mã>") để `thongDiepLoiThanThien` nhận ra là chuỗi kỹ thuật
      // và dịch đúng theo mã (401 → đăng nhập lại, 429 → chờ, 5xx → máy chủ sự cố).
      return { ok: false, error: (data as { error?: string }).error ?? `HTTP ${res.status}` }
    }

    return {
      ok: true,
      id: (data as { id: string }).id,
      message: (data as { message: string }).message,
    }
  } catch (err) {
    // Chuỗi thô (vd "Failed to fetch") — giao diện tự dịch qua `thongDiepLoiThanThien`.
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể gửi phản hồi' }
  }
}

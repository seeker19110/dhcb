// src/lib/formatRemaining.ts — "còn 24 giờ 5 phút" cho khối đơn chờ chặn xoá tài khoản (changelog 0546).

export const MINUTE_MS = 60_000

/** Làm tròn LÊN theo phút để không bao giờ báo sớm hơn thực tế; số âm ⇒ 0 phút. */
export function formatRemaining(msLeft: number, isA: boolean): string {
  const totalMin = Math.max(0, Math.ceil(msLeft / MINUTE_MS))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (isA) return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

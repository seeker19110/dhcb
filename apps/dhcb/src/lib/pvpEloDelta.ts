// apps/dhcb/src/lib/pvpEloDelta.ts — hiển thị mức Elo thay đổi sau một trận PvP.

/**
 * Chuỗi có dấu cho mức Elo thay đổi: `+12`, `0`, `−12` (dấu trừ thật).
 * Bản trước ghép cứng `+` trước số nên trận thua hiện "+-14" (changelog 0482).
 */
export function formatEloDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  if (delta < 0) return `−${Math.abs(delta)}`
  return '0'
}

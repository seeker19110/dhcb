// srsMerge.ts — luật gộp thẻ ôn tập (SRS) DÙNG CHUNG cho client (`apps/dhcb/src/lib/progressSync.ts`,
// lúc kéo tiến độ về) và server (`apps/server/src/api/_lib/progressMerge.ts`, lúc nhận tiến độ).
// Hai phía PHẢI cùng một hàm: trước đây client tự viết luật riêng (hoà reps → bản local luôn thắng)
// trong khi server so thêm `due`, nên khi hoà reps hai bên chọn khác nhau, client giữ lịch cũ và
// sinh lượt đồng bộ thừa mãi (audit 2026-10-26, AUD-XFEAT-001).

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * SRS: giữ thẻ có số lần ôn (reps) cao hơn — coi là tiến bộ hơn. `a` = bản đang lưu (server/cloud),
 * `b` = bản client gửi lên/đang có ở máy; hoà hoàn toàn thì `b` thắng.
 *
 * Sửa 2026-09-19 (F7, ghi nợ ở `docs/changelog/0334-*.md`): khi HOÀ reps, bản cũ luôn cho
 * client (`b`) thắng vô điều kiện — kể cả khi `due` của client CŨ HƠN (lùi về quá khứ) so với
 * bản server đang có. Ví dụ: máy A ôn thẻ lúc 10h (reps=3, due=ngày mai), máy B đồng bộ chậm
 * gửi lên bản reps=3 từ trước đó (due=hôm nay) → ghi đè mất lịch ôn đã tiến xa hơn của máy A.
 * Nay khi hoà reps, so thêm `due` (mốc lịch ôn kế tiếp, số mili-giây — CÙNG một trục thời gian
 * `Date.now()` do CLIENT SINH khi tính SRS, không phải đồng hồ hệ thống của máy nên không mắc
 * lỗi lệch giờ giữa 2 thiết bị như `mergeByTimestamp`/F8) và giữ bản có `due` LỚN HƠN (lịch ôn
 * xa hơn = tiến bộ hơn) — đúng tinh thần "tiến độ chỉ tăng, không giảm" của cả file này. Thiếu
 * `due` số hợp lệ ở một bên coi như thua (giữ hành vi cũ: bên có dữ liệu hợp lệ hơn thắng).
 */
export function mergeSrsMap(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a }
  for (const [key, bVal] of Object.entries(b)) {
    const aVal = out[key]
    const aReps = isRecord(aVal) && typeof aVal.reps === 'number' ? aVal.reps : -1
    const bReps = isRecord(bVal) && typeof bVal.reps === 'number' ? bVal.reps : -1
    if (!(key in out) || bReps > aReps) {
      out[key] = bVal
      continue
    }
    if (bReps === aReps) {
      const aDue = isRecord(aVal) && typeof aVal.due === 'number' ? aVal.due : -Infinity
      const bDue = isRecord(bVal) && typeof bVal.due === 'number' ? bVal.due : -Infinity
      if (bDue >= aDue) out[key] = bVal
    }
  }
  return out
}

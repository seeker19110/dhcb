// progressMerge.ts — Hợp nhất tiến độ học ĐANG CÓ trên server với dữ liệu client gửi lên.
// Đây là lớp phòng thủ ở server (nguồn sự thật): dù client có gửi lên bản CŨ/thiếu (mất mạng,
// 2 tab/2 THIẾT BỊ cùng học song song rồi đồng bộ gần như đồng thời), tiến độ đã lưu KHÔNG
// BAO GIỜ bị mất — chỉ có thể tăng thêm.
//
// Quyết định 2026-08-13 (yêu cầu người dùng: tiến độ chỉ tăng, không giảm dù đổi máy/nhiều
// thiết bị): learned/cefrGrammar/cefrDialogues/cefrUnlocked/achievements ĐỔI SANG hợp nhất
// UNION (mergeArrayUnion) ở server thay vì ghi đè theo client. Đánh đổi đã xác nhận với
// người dùng: các thao tác "bỏ đánh dấu" (unmarkLearned — hiện KHÔNG có nút bấm nào trong UI
// gọi tới, chỉ còn trong test; unmarkGrammarDone — CÓ dùng ở CefrLessonViews.tsx) sẽ không còn
// tác dụng LÂU DÀI: máy khác đồng bộ lại (còn giữ bản "đã đánh dấu" cũ) sẽ tự thêm lại mục vừa
// bỏ. Riêng `hard` (nhãn từ khó) GIỮ NGUYÊN ghi đè — đây chỉ là lọc hiển thị, không phải tiến
// độ học, có thể bật/tắt tự do theo máy gửi cuối.

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Hợp (union) 2 mảng chuỗi — dùng cho các mảng "chỉ tăng": không phần tử nào bị mất. */
export function mergeArrayUnion(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])]
}

// Luật gộp SRS nằm ở gói dùng chung để client (`progressSync.ts`) và server dùng CÙNG MỘT hàm
// — hai bản viết tay từng lệch luật hoà reps nên không hội tụ (AUD-XFEAT-001).
export { mergeSrsMap } from '@dhcb/core-learner/srsMerge'

/** cefrExams: hợp nhất theo cấp — passed=OR, bestPct/attempts=max, lastAt=mới hơn. */
export function mergeExamMap(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = isRecord(a[key]) ? a[key] : undefined
    const y = isRecord(b[key]) ? b[key] : undefined
    if (!x) {
      if (y) out[key] = y
      continue
    }
    if (!y) {
      out[key] = x
      continue
    }
    const xLastAt = typeof x.lastAt === 'string' ? x.lastAt : ''
    const yLastAt = typeof y.lastAt === 'string' ? y.lastAt : ''
    out[key] = {
      passed: Boolean(x.passed) || Boolean(y.passed),
      bestPct: Math.max(Number(x.bestPct ?? 0), Number(y.bestPct ?? 0)),
      attempts: Math.max(Number(x.attempts ?? 0), Number(y.attempts ?? 0)),
      lastAt: xLastAt >= yLastAt ? xLastAt : yLastAt,
    }
  }
  return out
}

/**
 * placement/weeklyGoal: object "chụp trạng thái tại một mốc thời gian" (field `lastAt` hoặc
 * `updatedAt`) — giữ bản có mốc MỚI HƠN. Rỗng `{}` (chưa từng có) luôn thua bản đã có dữ liệu.
 *
 * Sửa 2026-09-19 (F8, ghi nợ ở `docs/changelog/0373-*.md`): `field` (`lastAt`/`updatedAt`) là
 * do CLIENT tự ghi vào TỪNG OBJECT — hai thiết bị lệch đồng hồ hệ thống thì mốc này lệch theo,
 * quyết định sai bên thắng dù bên đó thực ra gửi SAU. Cột `version` (migration 0083) tăng đơn
 * điệu do SERVER giữ lại là trục thời gian không lệch, nhưng nó là version của CẢ DÒNG tiến độ
 * (english.learning_progress 1 dòng/user), không tách riêng theo field placement/weeklyGoal —
 * không đủ để biết NHÁNH placement/weeklyGoal cụ thể đã đổi ở nơi khác hay chưa. Phương án đã
 * chọn (đơn giản hơn nhưng vẫn giảm bề mặt lệch đồng hồ, không loại bỏ hoàn toàn — đúng như đặc
 * tả cho phép khi version không tách theo field): thêm tham số `clientClock` — SO SÁNH
 * `client_updated_at` của TOÀN BỘ REQUEST (một nguồn duy nhất do client sinh cho cả payload,
 * `sync.clientUpdatedAt` ở `progress.ts`) thay vì mốc `lastAt`/`updatedAt` rải rác từng object.
 * Khi cả 2 phía có `clientClock` hợp lệ VÀ khác nhau → dùng nó làm tiêu chí CHÍNH. Bằng nhau
 * (ví dụ chính request đã ghi `version` đó gửi lại — idempotent retry) hoặc thiếu ở 1/2 bên →
 * rơi về so `field` nội bộ như cũ (tie-break phụ, KHÔNG đổi field `lastAt`/`updatedAt` mà client
 * vẫn tự ghi để hiển thị).
 */
export function mergeByTimestamp(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  field: 'lastAt' | 'updatedAt',
  clientClock?: { existing: string | null | undefined; incoming: string | null | undefined },
): Record<string, unknown> {
  const aVal = a[field]
  const bVal = b[field]
  const aHas = typeof aVal === 'string' && aVal !== ''
  const bHas = typeof bVal === 'string' && bVal !== ''
  if (!aHas) return bHas ? b : a
  if (!bHas) return a

  if (clientClock) {
    const existingHas = typeof clientClock.existing === 'string' && clientClock.existing !== ''
    const incomingHas = typeof clientClock.incoming === 'string' && clientClock.incoming !== ''
    if (existingHas && incomingHas && clientClock.existing !== clientClock.incoming) {
      return (clientClock.incoming as string) > (clientClock.existing as string) ? b : a
    }
  }

  return (aVal as string) >= (bVal as string) ? a : b
}

/**
 * F6 (2026-09-19, ghi nợ ở `docs/changelog/0373-*.md`): `hard` (nhãn "từ khó") CHỈ là lọc hiển
 * thị, không phải tiến độ — GIỮ NGUYÊN ghi đè tự do theo client (không đổi sang hợp nhất union,
 * xem comment đầu file). Vấn đề cần sửa là race condition: hai request tới GẦN NHƯ ĐỒNG THỜI (2
 * tab/2 thiết bị) — request tới SAU ở tầng mạng/DB có thể mang dữ liệu CŨ HƠN về mặt thời gian
 * client thật, nhưng ghi đè lên dữ liệu MỚI HƠN chỉ vì tới sau. Sửa: so `client_updated_at`
 * (đồng hồ client lúc gửi, migration 0083) của request HIỆN TẠI với bản đã lưu trong DB — request
 * có `client_updated_at` CŨ HƠN bản đã lưu thì BỊ BỎ QUA (giữ bản đã lưu). Thiếu `client_updated_at`
 * hợp lệ ở một bên → bên có dữ liệu hợp lệ (không thiếu) thắng; thiếu ở CẢ HAI bên → giữ hành vi
 * ghi đè tự do cũ (client luôn thắng, không throw).
 */
export function resolveHard(
  existingHard: string[],
  incomingHard: string[],
  existingClientUpdatedAt: string | null | undefined,
  incomingClientUpdatedAt: string | null | undefined,
): string[] {
  const existingHas = typeof existingClientUpdatedAt === 'string' && existingClientUpdatedAt !== ''
  const incomingHas = typeof incomingClientUpdatedAt === 'string' && incomingClientUpdatedAt !== ''
  if (existingHas && !incomingHas) return existingHard
  if (!existingHas && incomingHas) return incomingHard
  if (existingHas && incomingHas) {
    return (incomingClientUpdatedAt as string) < (existingClientUpdatedAt as string)
      ? existingHard
      : incomingHard
  }
  // Thiếu ở cả hai bên (client cũ chưa gửi phong bì `sync`, hoặc dòng DB chưa từng ghi
  // client_updated_at): giữ hành vi ghi đè tự do cũ, không throw.
  return incomingHard
}

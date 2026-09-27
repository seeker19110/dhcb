// api/_lib/usage.ts — Đếm & giới hạn lượt dùng ở SERVER (nguồn sự thật).
//
// Giai đoạn C: chuyển từ Supabase (RPC consume_usage/refund_usage qua PostgREST) sang
// Postgres tự host (cùng 2 hàm SQL, giờ gọi thẳng qua `pg`) — xem postgres/schema.sql.
// Cổng chi phí từ chối khi không xác minh được cấu hình hoặc trừ lượt.

import { getPgPool } from '@dhcb/core-db/pgPool'
import { vnDateStr } from '@dhcb/core-db/date'
import { resolvePlan, type Plan } from './plan.js'
import { effectivePlan } from './promo.js'
import { getAppSettings, isSubjectEnforced } from '@dhcb/core-db/settings'

// 'code_feedback' (PR-L5, môn Lập trình): AI đọc code góp ý / gợi ý Socratic / giải thích lỗi.
// Cột riêng để tách được CHI PHÍ theo tính năng trên dashboard admin; hạn mức thì vẫn theo
// đúng luật chung (một hạn mức TỔNG/ngày cho mọi mode cộng lại, khác nhau giữa Free và VIP).
export type UsageMode = 'chat' | 'writing' | 'speaking' | 'stt' | 'pronounce' | 'code_feedback'

// Môn học — mặc định 'english' ở MỌI lời gọi hiện tại (chỉ có 1 môn tồn tại). Khi thêm môn
// mới (GĐ2), lời gọi của môn đó tự truyền subject khác; các lời gọi hiện có KHÔNG cần sửa.
// Xem docs/adr/0001-nen-tang-da-linh-vuc.md mục 8 + postgres/migrations/0029_platform_subject.sql.
// Export để api/usage-summary.ts lọc ĐÚNG cùng subject như hàm SQL enforce (consume_rolling_credit
// lọc `subject = p_subject`) — xem audit 2026-08-12.
export const DEFAULT_SUBJECT = 'english'

// Hạn mức theo gói ĐỌC TỪ DB (bảng app_settings, admin chỉnh qua /api/admin-settings) —
// xem settings.ts để biết giá trị mặc định khi DB chưa có dòng cấu hình. Từ GĐ1 (2026-09-12)
// CẢ HAI gói Free và VIP đều enforce qua bảng này: `limits.free` (mặc định 30 = hạn mức Plus cũ)
// và `limits.vip`.

// Tên cột tương ứng trong bảng daily_usage
const COLUMN: Record<UsageMode, string> = {
  chat: 'chat_count',
  writing: 'writing_count',
  speaking: 'speaking_count',
  stt: 'stt_count',
  pronounce: 'pronounce_count',
  code_feedback: 'code_feedback_count',
}

// LỊCH SỬ (2026-07-26 → 2026-09-12): gói Free từng dùng 1 KHO LƯỢT CHUNG theo cửa sổ TRƯỢT 7
// ngày (+5 lượt mỗi ngày có học thật) — xem postgres/migrations/0017_free_rolling_credit.sql.
// GĐ1 2026-09-12 BỎ cơ chế này ở đường enforce: Free nay hưởng thẳng hạn mức Plus cũ
// (30 lượt/ngày, cấu hình được qua app_settings). Các hằng số dưới đây GIỮ LẠI vì bảng
// `free_daily_credit` và hàm cấp bonus vẫn tồn tại (không xoá dữ liệu lịch sử — đặc tả §① mục
// "KHÔNG làm") và dashboard admin vẫn đọc để xem lại số liệu cũ.
export const FREE_WEEKLY_BONUS_PER_DAY = 5
export const FREE_ROLLING_WINDOW_DAYS = 7
export const FREE_WEEKLY_CAP = FREE_WEEKLY_BONUS_PER_DAY * FREE_ROLLING_WINDOW_DAYS

// Danh sách cột đếm lượt AI, đúng thứ tự/đủ bộ như hàm SQL consume_usage_total cộng tay
// (postgres/migrations/0065_code_feedback_usage.sql). Export để api/usage-summary.ts dựng đúng
// CÙNG công thức "đã dùng bao nhiêu hôm nay" thay vì viết lại danh sách cột lần thứ hai — thêm
// mode mới mà quên một chỗ là số hiển thị lệch số chặn thật.
export const AI_USAGE_COLUMNS: readonly string[] = Object.values(COLUMN)

export function isUsageMode(v: unknown): v is UsageMode {
  return (
    v === 'chat' ||
    v === 'writing' ||
    v === 'speaking' ||
    v === 'stt' ||
    v === 'pronounce' ||
    v === 'code_feedback'
  )
}

function today(): string {
  return vnDateStr()
}

// Từ GĐ1 (2026-09-12) cả Free lẫn VIP đều theo hạn mức TỔNG/ngày nên chỉ còn MỘT thông điệp:
// hết lượt hôm nay thì mai có lại, không còn cơ chế "học thêm để được thêm lượt" của kho trượt.
const LIMIT_MESSAGE = 'Bạn đã dùng hết lượt hôm nay. Thử lại vào ngày mai nhé.'

const CIRCUIT_BREAKER_MESSAGE =
  'Hệ thống AI đang tạm dừng để bảo trì. Vui lòng thử lại sau ít phút.'

// Tra gói hiện tại của user (mặc định 'free' nếu chưa có hồ sơ; VIP đã hết hạn → coi như free).
// Export cho api/usage-summary.ts (hiển thị UI) dùng lại — tránh trùng logic tra gói.
export async function lookupPlan(userId: string): Promise<Plan> {
  const pool = getPgPool()
  const { rows: profileRows } = await pool.query<{ plan: string; plan_expires_at: Date | null }>(
    'select plan, plan_expires_at from public.profiles where id = $1',
    [userId],
  )
  return effectivePlan(resolvePlan(profileRows[0]?.plan, profileRows[0]?.plan_expires_at))
}

// Tăng 1 vào cột đếm của daily_usage THUẦN ĐỂ THỐNG KÊ, không kiểm hạn mức. Dùng lại đúng
// hàm SQL consume_usage (đã atomic, đã whitelist tên cột) với hạn mức = int4 lớn nhất nên
// nhánh "vượt hạn mức" không bao giờ xảy ra. FAIL-OPEN: hỏng thống kê KHÔNG được phép làm
// hỏng lượt dùng thật của người học.
const NO_LIMIT = 2_147_483_647

async function bumpUsageStat(userId: string, day: string, col: string): Promise<void> {
  try {
    await getPgPool().query('select public.consume_usage($1, $2, $3, $4, $5)', [
      userId,
      day,
      col,
      NO_LIMIT,
      DEFAULT_SUBJECT,
    ])
  } catch (err) {
    console.warn('[usage] ghi thống kê lượt Free lỗi → bỏ qua:', err)
  }
}

// Kiểm tra còn lượt không + tăng 1 (authoritative). FAIL-CLOSED khi lỗi hạ tầng.
// `day` trả kèm khi cho qua = NGÀY (giờ VN) mà lượt đã bị trừ vào. Nơi gọi PHẢI truyền lại
// đúng ngày này cho refundUsage() nếu sau đó provider lỗi — xem giải thích ở refundUsage().
export async function checkAndConsumeUsage(
  userId: string,
  mode: UsageMode,
): Promise<{ ok: true; day: string } | { ok: false; message: string }> {
  const day = today()
  try {
    const pool = getPgPool()

    // Cầu dao khẩn cấp (admin bật qua /api/admin-settings khi phát hiện chi phí AI bất
    // thường) — chặn NGAY, trước khi động vào bảng daily_usage, không phân biệt gói/hạn mức.
    // Xem postgres/migrations/0005_ai_circuit_breaker.sql.
    const { aiCircuitBreaker, limits } = await getAppSettings({ requireAvailable: true })
    if (aiCircuitBreaker) {
      return { ok: false, message: CIRCUIT_BREAKER_MESSAGE }
    }

    // Phanh tay theo môn (bảng subject_limits, migration 0029): admin tắt enforce cho một môn
    // (vd giai đoạn ra mắt) → KHÔNG chặn theo hạn mức, nhưng VẪN ghi thống kê để còn theo dõi
    // được chi phí. Mặc định mọi môn đều enforce — xem isSubjectEnforced().
    if (!(await isSubjectEnforced(DEFAULT_SUBJECT))) {
      await bumpUsageStat(userId, day, COLUMN[mode])
      return { ok: true, day }
    }

    const plan = await lookupPlan(userId)

    // ── Free và VIP: 1 hạn mức TỔNG/ngày cho MỌI mode cộng lại ──
    // GĐ1 2026-09-12: Free dùng chung đúng cơ chế này (trước đây là kho lượt cửa sổ trượt 7
    // ngày qua consume_rolling_credit), chỉ khác con số hạn mức — cả hai đều đọc từ app_settings.
    const col = COLUMN[mode]
    const limit = limits[plan]

    // Kiểm tra + tăng ATOMIC qua hàm SQL (chống race condition 2 request song song)
    const { rows } = await pool.query<{ consume_usage_total: boolean }>(
      'select public.consume_usage_total($1, $2, $3, $4, $5) as consume_usage_total',
      [userId, day, col, limit, DEFAULT_SUBJECT],
    )
    const allowed = rows[0]?.consume_usage_total

    if (allowed === true) return { ok: true, day }
    return {
      ok: false,
      message: allowed === false ? LIMIT_MESSAGE : CIRCUIT_BREAKER_MESSAGE,
    }
  } catch (err) {
    console.warn('[usage] Không xác minh được lượt → tạm dừng AI:', err)
    return { ok: false, message: CIRCUIT_BREAKER_MESSAGE }
  }
}

// Hoàn lại 1 lượt đã trừ khi nhà cung cấp AI/STT lỗi (người dùng không nhận được kết quả).
// FAIL-OPEN: lỗi hạ tầng thì bỏ qua êm (không bao giờ làm vỡ luồng trả lỗi cho client).
//
// `day` PHẢI là ngày do chính checkAndConsumeUsage() trả về lúc trừ lượt (audit 2026-08-12).
// Trước đây hàm này tự gọi today() lần nữa: một lượt trừ lúc 23:59 giờ VN mà provider AI lỗi
// và hoàn lúc 00:01 sẽ hoàn vào dòng NGÀY MỚI, nơi credits_spent đang là 0 —
// `greatest(0 - 1, 0) = 0` nên khoản hoàn bốc hơi, người dùng mất trắng 1 lượt. Cả 2 hàm SQL
// refund_rolling_credit/refund_usage đều chỉ sửa đúng dòng của ngày truyền vào.
// Bỏ trống `day` = giữ hành vi cũ (dùng hôm nay) cho nơi gọi không có ngày gốc.
export async function refundUsage(userId: string, mode: UsageMode, day = today()): Promise<void> {
  try {
    const pool = getPgPool()
    // GĐ1 2026-09-12: cả Free lẫn VIP đều trừ lượt trong daily_usage nên hoàn lượt chỉ còn MỘT
    // đường (trước đây Free phải hoàn thêm vào kho trượt qua refund_rolling_credit).
    const col = COLUMN[mode]
    await pool.query('select public.refund_usage($1, $2, $3, $4)', [
      userId,
      day,
      col,
      DEFAULT_SUBJECT,
    ])
  } catch (err) {
    console.warn('[usage] hoàn lượt lỗi → bỏ qua (fail-open):', err)
  }
}

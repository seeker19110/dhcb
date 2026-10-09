// api/_lib/trial.ts — Quà dùng thử Pro 14 ngày cho tài khoản MỚI (quyết định 2026-07-27,
// chiến lược tăng trưởng — thay cho việc mở khuyến mãi Pro cho TOÀN BỘ user hiện có, vốn tốn
// chi phí AI không kiểm soát được cho những người vốn đã ở lại mà không cần khuyến mãi).
//
// QUYẾT ĐỊNH CUỐI (2026-07-28, chốt lại lần 2): cấp theo 2 đường tuỳ kênh đăng ký —
//   - Email/password (action 'register'): KHÔNG cấp ngay — phải XÁC THỰC EMAIL (mã 6 số,
//     action 'verify-email') trước mới được cấp. Chống lạm dụng email rác tạo hàng loạt để
//     cày trial.
//   - 4 kênh OAuth (Google/Facebook/Apple/Microsoft): coi như ĐÃ XÁC THỰC (provider tự verify
//     email khi đăng nhập) nên cấp NGAY ở lần đăng nhập ĐẦU TIÊN (`isNew`, xem
//     oauthLoginResponse() ở api/auth.ts). Đăng nhập lại (login, hoặc OAuth với tài khoản đã
//     tồn tại) KHÔNG được cấp thêm.
//
// Luật: mỗi TÀI KHOẢN được nhận đúng MỘT lần, mãi mãi — không phụ thuộc email hiện tại, đổi
// email sau đó KHÔNG được nhận thêm. Xoá tài khoản rồi đăng ký lại cùng email (kể cả biến thể
// "+nhãn"/dấu chấm Gmail) cũng KHÔNG nhận lại trong 12 tháng — sổ chống lạm dụng
// `packages/core-billing/erasedBenefitLedger.ts` (changelog 0545).
//
// Cấp gói đi qua grantPlanDays() dùng chung (api/_lib/planGrant.ts) nên tự động thừa hưởng
// mọi nguyên tắc ở đó: không hạ cấp người đang VIP, không làm mất hạn đang còn, không đụng
// gói vĩnh viễn.

import { getPgPool } from '@dhcb/core-db/pgPool'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'
import { isBenefitBlocked } from '@dhcb/core-billing/erasedBenefitLedger'
import { logSecurityEvent } from './security.js'

/** Số ngày Pro tặng cho tài khoản mới. Đổi ở ĐÚNG một chỗ này. */
export const SIGNUP_TRIAL_DAYS = 14

/**
 * Cấp quà Pro nếu tài khoản chưa từng nhận. Trả về `true` nếu LẦN NÀY vừa cấp, `false` nếu đã
 * nhận trước đó (hoặc có lỗi).
 *
 * An toàn khi gọi nhiều lần / gọi song song: việc "giành quyền nhận quà" nằm gọn trong MỘT câu
 * lệnh ghi có điều kiện `signup_trial_granted_at is null`, nên chỉ đúng một request thấy
 * rowCount = 1 và đi tiếp tới bước cấp ngày.
 *
 * KHÔNG throw ra ngoài: lỗi tặng quà tuyệt đối không được làm hỏng luồng đăng ký/đăng nhập
 * (email/password hoặc OAuth) của người dùng.
 */
export async function grantSignupTrial(userId: string): Promise<boolean> {
  try {
    const pool = getPgPool()

    // Sổ chống lạm dụng (0545): email này thuộc một tài khoản ĐÃ XOÁ từng nhận dùng thử (trong 12
    // tháng) ⇒ không cấp lại. Người dùng vẫn đăng ký/đăng nhập bình thường. Log không chứa PII.
    if (await isBenefitBlocked(pool, userId, 'signup_trial')) {
      logSecurityEvent('SIGNUP_TRIAL_REPEAT_AFTER_ERASURE', 'system', { benefit: 'signup_trial' })
      return false
    }

    // Giành quyền nhận quà. `where profiles.signup_trial_granted_at is null` áp cho cả nhánh
    // UPDATE của on-conflict → hàng đã có dấu thì không cập nhật, rowCount = 0.
    const { rowCount } = await pool.query(
      `insert into public.profiles (id, signup_trial_granted_at)
       values ($1, now())
       on conflict (id) do update set signup_trial_granted_at = now()
       where profiles.signup_trial_granted_at is null`,
      [userId],
    )
    if (!rowCount) return false

    await grantPlanDays(userId, 'vip', SIGNUP_TRIAL_DAYS)
    return true
  } catch (err) {
    console.error('[trial] Lỗi khi cấp quà dùng thử:', err)
    return false
  }
}

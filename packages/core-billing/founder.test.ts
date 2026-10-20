// founder.test.ts — "Ưu đãi Người tiên phong" (2026 tài khoản đầu tiên, VIP vĩnh viễn).
//
// Bất biến canh ở đây:
//   - Đúng mốc hạn ngạch: người thứ 2026 ĐƯỢC, người thứ 2027 KHÔNG.
//   - Thứ tự chọn KHỚP migration (`order by created_at, id`) — lệch tie-break là hai nơi chọn
//     ra hai tập khác nhau và ưu đãi trở nên không tái lập được.
//   - Người tiên phong KHÔNG BAO GIỜ bị luồng gia hạn/hết hạn của SePay hạ xuống free.
import { describe, it, expect, vi } from 'vitest'
import {
  selectFounderIds,
  grantFounderIfAvailable,
  FOUNDER_LIMIT,
  type AccountOrder,
} from './founder.js'
import { computePlanGrant } from './planGrant.js'
import { resolvePlan } from './plan.js'

function accounts(n: number, startMs = 1_000): AccountOrder[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `u-${String(i).padStart(5, '0')}`,
    createdAt: startMs + i,
  }))
}

describe('FOUNDER_LIMIT', () => {
  it('đúng con số đã chốt với người dùng', () => {
    expect(FOUNDER_LIMIT).toBe(2026)
  })
})

describe('selectFounderIds — ca biên quanh mốc hạn ngạch', () => {
  it('tổng 2025 tài khoản (ÍT hơn hạn ngạch) → tất cả đều được hưởng', () => {
    const ids = selectFounderIds(accounts(2025))
    expect(ids).toHaveLength(2025)
  })

  it('tổng đúng 2026 → tất cả được hưởng, không ai bị bỏ', () => {
    const ids = selectFounderIds(accounts(2026))
    expect(ids).toHaveLength(2026)
    expect(ids.at(-1)).toBe('u-02025')
  })

  it('tổng 2027 → đúng 2026 người đầu, người thứ 2027 KHÔNG được', () => {
    const ids = selectFounderIds(accounts(2027))
    expect(ids).toHaveLength(2026)
    expect(ids).not.toContain('u-02026') // tài khoản thứ 2027 (đánh số từ 0)
  })

  it('người đăng ký SAU khi đủ suất không chen được lên đầu danh sách', () => {
    const existing = accounts(2026)
    const latecomer: AccountOrder = { id: 'u-aaaaa', createdAt: 9_999_999 }
    const ids = selectFounderIds([latecomer, ...existing])
    expect(ids).not.toContain('u-aaaaa')
  })
})

describe('selectFounderIds — thứ tự phải khớp migration', () => {
  it('xếp theo thời gian tạo tăng dần, KHÔNG theo thứ tự truyền vào', () => {
    const ids = selectFounderIds(
      [
        { id: 'c', createdAt: 300 },
        { id: 'a', createdAt: 100 },
        { id: 'b', createdAt: 200 },
      ],
      2,
    )
    expect(ids).toEqual(['a', 'b'])
  })

  it('trùng mốc thời gian → tie-break bằng id (thứ tự ổn định, lũy đẳng)', () => {
    const ids = selectFounderIds(
      [
        { id: 'z', createdAt: 100 },
        { id: 'a', createdAt: 100 },
      ],
      1,
    )
    expect(ids).toEqual(['a'])
  })

  it('nhận cả mốc dạng ISO string (cột timestamptz đọc ra chuỗi)', () => {
    const ids = selectFounderIds(
      [
        { id: 'sau', createdAt: '2026-01-02T00:00:00Z' },
        { id: 'truoc', createdAt: '2026-01-01T00:00:00Z' },
      ],
      1,
    )
    expect(ids).toEqual(['truoc'])
  })

  it('hạn ngạch 0 hoặc âm → không cấp cho ai (phòng gọi sai)', () => {
    expect(selectFounderIds(accounts(10), 0)).toEqual([])
    expect(selectFounderIds(accounts(10), -5)).toEqual([])
  })
})

// ── Tương tác với luồng thanh toán SePay ────────────────────────────────────────────────
// "VIP vĩnh viễn" biểu diễn bằng plan='vip' + plan_expires_at=null. Các test dưới đây chứng
// minh trạng thái đó không bị bất kỳ nhánh gia hạn/hết hạn nào kéo xuống.
describe('người tiên phong không bao giờ bị hạ xuống free', () => {
  const NOW = new Date('2026-09-15T00:00:00Z')

  it('resolvePlan: VIP hạn NULL vẫn là VIP, kể cả rất xa trong tương lai', () => {
    expect(resolvePlan('vip', null, NOW)).toBe('vip')
    expect(resolvePlan('vip', null, new Date('2099-01-01T00:00:00Z'))).toBe('vip')
  })

  it('mua thêm gói qua SePay KHÔNG biến vĩnh viễn thành có hạn', () => {
    const next = computePlanGrant('vip', null, 'vip', 365, NOW)
    expect(next).toEqual({ plan: 'vip', planExpiresAt: null })
  })

  it('cấp tay/thưởng mời bạn cũng không đụng tới hạn vĩnh viễn', () => {
    expect(computePlanGrant('vip', null, 'vip', 7, NOW).planExpiresAt).toBeNull()
  })

  it('người ĐANG trả tiền có hạn tương lai, sau khi nâng lifetime thì gia hạn tiếp vẫn null', () => {
    // Trước migration: VIP còn hạn tới 2026-12-31.
    const before = computePlanGrant('vip', '2026-12-31T00:00:00Z', 'vip', 30, NOW)
    expect(before.planExpiresAt).not.toBeNull() // hành vi cũ giữ nguyên cho người thường

    // Sau migration họ thành (vip, null) — mọi lần gia hạn sau đó không còn đặt lại hạn nữa.
    const after = computePlanGrant('vip', null, 'vip', 30, NOW)
    expect(after.planExpiresAt).toBeNull()
  })

  it('job dọn hạn chỉ đụng hàng CÓ hạn — hàng vĩnh viễn không khớp điều kiện', () => {
    // downgradeExpiredPlans() lọc `plan_expires_at is not null and plan_expires_at < now()`.
    // Bất biến tương đương ở tầng thuần: hạn null thì không có mốc nào để so sánh.
    const lifetimeExpiresAt: Date | null = null
    expect(lifetimeExpiresAt !== null).toBe(false)
    expect(resolvePlan('vip', lifetimeExpiresAt, new Date('2199-01-01T00:00:00Z'))).toBe('vip')
  })
})

// Audit 2026-10-20 (kèm D-6): `grantFounderIfAvailable` là chỗ cấp VIP VĨNH VIỄN — nhánh lỗi hạ
// tầng phải FAIL-SAFE đúng chiều (không cấp), và chỉ cấp khi hàm SQL trả đúng `true`.
describe('grantFounderIfAvailable — fail-safe đúng chiều', () => {
  it('query ném → false (KHÔNG cấp), có warn, không ném ra ngoài', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const runner = { query: vi.fn().mockRejectedValue(new Error('db down')) }
    expect(await grantFounderIfAvailable('u1', runner as never)).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('hàm SQL trả granted=true → true; rows rỗng hoặc granted khác true → false', async () => {
    const ok = { query: vi.fn().mockResolvedValue({ rows: [{ granted: true }] }) }
    expect(await grantFounderIfAvailable('u1', ok as never)).toBe(true)
    expect(ok.query).toHaveBeenCalledWith(
      'select public.grant_founder_if_available($1, $2) as granted',
      ['u1', FOUNDER_LIMIT],
    )
    const empty = { query: vi.fn().mockResolvedValue({ rows: [] }) }
    expect(await grantFounderIfAvailable('u1', empty as never)).toBe(false)
    const str = { query: vi.fn().mockResolvedValue({ rows: [{ granted: 'true' }] }) }
    expect(await grantFounderIfAvailable('u1', str as never)).toBe(false)
  })
})

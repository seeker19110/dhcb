import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { checkAndConsumeUsage, refundUsage, isUsageMode } from './usage.js'
import { invalidateSettingsCache } from '@dhcb/core-db/settings'

// Mock Pool Postgres để test logic đếm/hoàn lượt OFFLINE (không cần DB thật).
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const mockedGetPool = vi.mocked(getPgPool)

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  // getAppSettings() cache trong bộ nhớ tiến trình (TTL 30s) — reset giữa các test để mock
  // pool mới không bị "ăn" giá trị cache từ test trước.
  invalidateSettingsCache()
})
afterEach(() => {
  vi.restoreAllMocks()
})

// Dòng app_settings giả — promo_until: null (tắt khuyến mãi) trừ khi test cố tình bật, để
// không làm nhiễu các assertion về hạn mức riêng từng gói.
//
// GĐ1 2026-09-12: cột DB `pro_daily_limit` giữ nguyên TÊN nhưng Ý NGHĨA nay là hạn mức của gói
// FREE (mặc định production = 30 = hạn mức Plus cũ). Ở đây đặt 30 cho khớp mặc định thật.
const FAKE_SETTINGS_ROW = {
  pro_daily_limit: 30,
  vip_daily_limit: 1_000_000,
  promo_until: null as string | null,
  ai_circuit_breaker: false,
  updated_at: '2026-01-01T00:00:00.000Z',
}

// query giả: phân biệt câu lệnh theo chuỗi SQL (chứa 'profiles' / 'app_settings' /
// 'consume_usage' / 'refund_usage').
function mockPool(opts: {
  plan?: 'free' | 'vip' | 'pro'
  planExpiresAt?: string | null
  consumeResult?: unknown
  queryError?: Error
  promoUntil?: string | null
  aiCircuitBreaker?: boolean
  // Phanh tay theo môn (bảng subject_limits, migration 0029). undefined = KHÔNG có dòng nào
  // trong bảng → mặc định enforce (hành vi hiện tại của production cho môn chưa khai báo).
  subjectEnforced?: boolean
}) {
  const query = vi.fn(async (sql: string) => {
    if (opts.queryError) throw opts.queryError
    if (sql.includes('from public.profiles'))
      return {
        rows: [{ plan: opts.plan ?? 'free', plan_expires_at: opts.planExpiresAt ?? null }],
      }
    if (sql.includes('from public.app_settings'))
      return {
        rows: [
          {
            ...FAKE_SETTINGS_ROW,
            promo_until: opts.promoUntil ?? null,
            ai_circuit_breaker: opts.aiCircuitBreaker ?? false,
          },
        ],
      }
    if (sql.includes('from public.subject_limits'))
      return {
        rows: opts.subjectEnforced === undefined ? [] : [{ enforced: opts.subjectEnforced }],
      }
    // Free VÀ VIP: cùng một hạn mức TỔNG/ngày, chỉ khác con số (GĐ1 2026-09-12) — vẫn tăng đúng
    // cột theo mode, nhưng ngưỡng chặn là SUM mọi cột (consume_usage_total, migration 0016).
    if (sql.includes('consume_usage_total'))
      return {
        rows: [
          { consume_usage_total: Object.hasOwn(opts, 'consumeResult') ? opts.consumeResult : true },
        ],
      }
    if (sql.includes('refund_usage')) return { rows: [] }
    return { rows: [] }
  })
  return { query } as unknown as ReturnType<typeof getPgPool>
}

function consumeCallOf(pool: ReturnType<typeof getPgPool>) {
  return vi.mocked(pool.query).mock.calls.find(([sql]) => (sql as string).includes('consume_usage'))
}

describe('checkAndConsumeUsage — gói Free (hạn mức TỔNG/ngày = hạn mức Plus cũ)', () => {
  beforeEach(() => mockedGetPool.mockReset())

  it('còn lượt (true) → ok, kèm NGÀY đã trừ để hoàn đúng chỗ', async () => {
    mockedGetPool.mockReturnValue(mockPool({ consumeResult: true }))
    const r = await checkAndConsumeUsage('u1', 'chat')
    expect(r.ok).toBe(true)
    // Ngày trả về phải là chuỗi YYYY-MM-DD theo giờ VN — nơi gọi truyền lại cho refundUsage().
    if (r.ok) expect(r.day).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('hết lượt (false) → chặn kèm thông điệp', async () => {
    mockedGetPool.mockReturnValue(mockPool({ consumeResult: false }))
    const r = await checkAndConsumeUsage('u1', 'chat')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/lượt/i)
  })

  // Tiêu chí chấp nhận §④.1 của đặc tả: hạn mức Free = 30/ngày TỔNG mọi mode, đọc từ cấu hình
  // (KHÔNG hard-code trong mã như số 30 của gói Plus cũ).
  it('truyền đúng hạn mức Free từ app_settings (30) vào consume_usage_total', async () => {
    const pool = mockPool({ consumeResult: true })
    mockedGetPool.mockReturnValue(pool)
    await checkAndConsumeUsage('u1', 'chat')
    expect(consumeCallOf(pool)?.[0]).toContain('consume_usage_total')
    expect(consumeCallOf(pool)?.[1]).toEqual([
      'u1',
      expect.any(String),
      'chat_count',
      30,
      'english',
    ])
  })

  it('mode nào cũng trừ vào CÙNG một hạn mức tổng, chỉ khác cột đếm', async () => {
    const pool = mockPool({ consumeResult: true })
    mockedGetPool.mockReturnValue(pool)
    await checkAndConsumeUsage('u1', 'stt')
    expect(consumeCallOf(pool)?.[1]).toEqual(['u1', expect.any(String), 'stt_count', 30, 'english'])
  })

  it('KHÔNG còn dùng kho lượt cửa sổ trượt 7 ngày (consume_rolling_credit)', async () => {
    const pool = mockPool({ consumeResult: true })
    mockedGetPool.mockReturnValue(pool)
    await checkAndConsumeUsage('u1', 'chat')
    const sqls = vi.mocked(pool.query).mock.calls.map((c) => String(c[0]))
    expect(sqls.some((s) => s.includes('consume_rolling_credit'))).toBe(false)
  })

  it('DB lỗi (query throw) → từ chối provider', async () => {
    mockedGetPool.mockReturnValue(mockPool({ queryError: new Error('db down') }))
    expect((await checkAndConsumeUsage('u1', 'chat')).ok).toBe(false)
  })

  it.each([undefined, null, 'true', 1])('SQL trả %s thay vì true → từ chối', async (value) => {
    mockedGetPool.mockReturnValue(mockPool({ consumeResult: value }))
    expect((await checkAndConsumeUsage('u1', 'chat')).ok).toBe(false)
  })

  // Audit 2026-08-12 — phanh tay theo môn (bảng subject_limits, migration 0029). Trước đây
  // bảng này KHÔNG được code nào đọc: cờ có trong DB nhưng bật/tắt chẳng thay đổi gì.
  it('subject_limits.enforced = false → KHÔNG chặn theo hạn mức, nhưng VẪN ghi thống kê', async () => {
    const pool = mockPool({ subjectEnforced: false, consumeResult: false })
    mockedGetPool.mockReturnValue(pool)
    // consumeResult=false nghĩa là "hết lượt" — nếu phanh tay có hiệu lực thì vẫn phải cho qua.
    const r = await checkAndConsumeUsage('u1', 'chat')
    expect(r.ok).toBe(true)
    const sqls = vi.mocked(pool.query).mock.calls.map((c) => String(c[0]))
    // Không hề gọi hàm enforce...
    expect(sqls.some((s) => s.includes('consume_usage_total'))).toBe(false)
    // ...nhưng vẫn cộng thống kê để dashboard theo dõi được chi phí theo tính năng.
    expect(sqls.some((s) => s.includes('consume_usage('))).toBe(true)
  })

  it('subject_limits.enforced = true → chặn như bình thường', async () => {
    mockedGetPool.mockReturnValue(mockPool({ subjectEnforced: true, consumeResult: false }))
    expect((await checkAndConsumeUsage('u1', 'chat')).ok).toBe(false)
  })

  it('không có dòng subject_limits → mặc định ENFORCE (an toàn chi phí)', async () => {
    mockedGetPool.mockReturnValue(mockPool({ consumeResult: false }))
    expect((await checkAndConsumeUsage('u1', 'chat')).ok).toBe(false)
  })

  it('cầu dao AI bật → chặn ngay, không cần biết còn lượt hay không', async () => {
    // consumeResult: true (rõ ràng còn lượt) nhưng vẫn phải chặn vì breaker bật trước.
    mockedGetPool.mockReturnValue(mockPool({ aiCircuitBreaker: true, consumeResult: true }))
    const r = await checkAndConsumeUsage('u1', 'chat')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/bảo trì/i)
  })
})

describe('checkAndConsumeUsage — gói VIP', () => {
  beforeEach(() => mockedGetPool.mockReset())

  it('gói vip dùng hạn mức cao hơn (đọc đúng plan + truyền đúng limit)', async () => {
    const pool = mockPool({ plan: 'vip', consumeResult: true })
    mockedGetPool.mockReturnValue(pool)
    await checkAndConsumeUsage('u1', 'speaking')
    expect(consumeCallOf(pool)?.[1]).toEqual([
      'u1',
      expect.any(String),
      'speaking_count',
      1_000_000,
      'english',
    ])
  })

  it('gói vip đã HẾT HẠN → rơi về hạn mức Free ngay, không chờ job dọn dữ liệu', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    const pool = mockPool({ plan: 'vip', planExpiresAt: past, consumeResult: true })
    mockedGetPool.mockReturnValue(pool)
    await checkAndConsumeUsage('u1', 'speaking')
    expect(consumeCallOf(pool)?.[1]).toEqual([
      'u1',
      expect.any(String),
      'speaking_count',
      30,
      'english',
    ])
  })

  // Bất biến §⑤: người mua gói CŨ (plus/pro) còn hạn vẫn hưởng hạn mức VIP, kể cả khi migration
  // 0076 chưa kịp chạy trên hàng đó.
  it('hàng CŨ plan=pro còn hạn → hưởng hạn mức VIP', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const pool = mockPool({ plan: 'pro', planExpiresAt: future, consumeResult: true })
    mockedGetPool.mockReturnValue(pool)
    await checkAndConsumeUsage('u1', 'speaking')
    expect(consumeCallOf(pool)?.[1]).toEqual([
      'u1',
      expect.any(String),
      'speaking_count',
      1_000_000,
      'english',
    ])
  })

  it('khuyến mãi đang bật → free được nâng lên hạn mức VIP', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const pool = mockPool({ plan: 'free', consumeResult: true, promoUntil: future })
    mockedGetPool.mockReturnValue(pool)
    await checkAndConsumeUsage('u1', 'chat')
    expect(consumeCallOf(pool)?.[1]).toEqual([
      'u1',
      expect.any(String),
      'chat_count',
      1_000_000,
      'english',
    ])
  })
})

describe('refundUsage', () => {
  beforeEach(() => mockedGetPool.mockReset())

  it('hoàn đúng cột của mode qua refund_usage (Free và VIP nay cùng một đường)', async () => {
    for (const plan of ['free', 'vip'] as const) {
      const pool = mockPool({ plan })
      mockedGetPool.mockReturnValue(pool)
      await refundUsage('u1', 'stt')
      const refundCall = vi
        .mocked(pool.query)
        .mock.calls.find(([sql]) => (sql as string).includes('refund_usage'))
      expect(refundCall?.[1]).toEqual(['u1', expect.any(String), 'stt_count', 'english'])
    }
  })

  it('KHÔNG còn gọi refund_rolling_credit của cơ chế kho lượt cũ', async () => {
    const pool = mockPool({ plan: 'free' })
    mockedGetPool.mockReturnValue(pool)
    await refundUsage('u1', 'stt')
    const sqls = vi.mocked(pool.query).mock.calls.map((c) => String(c[0]))
    expect(sqls.some((s) => s.includes('refund_rolling_credit'))).toBe(false)
  })

  // Audit 2026-08-12 — hoàn lượt phải nhắm ĐÚNG NGÀY đã trừ, không phải "hôm nay" tính lại.
  it('refundUsage nhận `day` → hoàn vào đúng ngày đó, không phải hôm nay', async () => {
    const pool = mockPool({ plan: 'free' })
    mockedGetPool.mockReturnValue(pool)
    await refundUsage('u1', 'chat', '2020-01-01')
    const refundCalls = vi
      .mocked(pool.query)
      .mock.calls.filter(([sql]) => String(sql).includes('refund_'))
    expect(refundCalls.length).toBeGreaterThan(0)
    for (const [, params] of refundCalls) expect(params as unknown[]).toContain('2020-01-01')
  })

  it('DB lỗi → nuốt êm (FAIL-OPEN), không ném', async () => {
    mockedGetPool.mockReturnValue(mockPool({ queryError: new Error('db down') }))
    await expect(refundUsage('u1', 'chat')).resolves.toBeUndefined()
  })
})

describe('isUsageMode', () => {
  it('chỉ chấp nhận các mode hợp lệ', () => {
    expect(isUsageMode('chat')).toBe(true)
    expect(isUsageMode('stt')).toBe(true)
    expect(isUsageMode('writing')).toBe(true)
    expect(isUsageMode('speaking')).toBe(true)
    expect(isUsageMode('pronounce')).toBe(true)
    expect(isUsageMode('hack')).toBe(false)
    expect(isUsageMode(null)).toBe(false)
  })
})

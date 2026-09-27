import { Pool, Client } from 'pg'
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('@dhcb/core-db/settings', () => ({ getAppSettings: vi.fn() }))

import { computePlanGrant, grantPlanDays } from './planGrant.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { getAppSettings } from '@dhcb/core-db/settings'

const NOW = new Date('2026-07-25T10:00:00+07:00')
const MS_DAY = 86_400_000
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * MS_DAY)

describe('computePlanGrant', () => {
  it('user free (chưa có gói) → cấp đúng gói, hạn = now + N ngày', () => {
    const r = computePlanGrant('free', null, 'vip', 7, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(7).getTime())
  })

  it('user chưa có hồ sơ (plan null) → coi như free, cấp bình thường', () => {
    const r = computePlanGrant(null, null, 'vip', 7, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(7).getTime())
  })

  it('CỘNG DỒN: đang VIP còn 5 ngày, thưởng thêm 7 ngày → còn 12 ngày (không mất phần cũ)', () => {
    const r = computePlanGrant('vip', daysFromNow(5), 'vip', 7, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(12).getTime())
  })

  it('gói cũ ĐÃ HẾT HẠN → tính lại từ bây giờ, không cộng vào mốc quá khứ', () => {
    const r = computePlanGrant('vip', daysFromNow(-10), 'vip', 7, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(7).getTime())
  })

  it('đang VIP còn hạn, thưởng thêm → vẫn là VIP, vẫn được cộng ngày', () => {
    const r = computePlanGrant('vip', daysFromNow(5), 'vip', 7, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(12).getTime())
  })

  it('KHÔNG HẠ CẤP / DI TRÚ: hàng DB cũ plan=pro còn hạn, cấp VIP → VIP, cộng dồn hạn', () => {
    const r = computePlanGrant('pro', daysFromNow(5), 'vip', 30, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(35).getTime())
  })

  it('gói VĨNH VIỄN (expires null) không bị đụng — không biến thành có hạn', () => {
    const r = computePlanGrant('vip', null, 'vip', 7, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt).toBeNull()
  })

  it('hàng DB cũ plan=pro VĨNH VIỄN + cấp VIP → vẫn VIP vĩnh viễn', () => {
    const r = computePlanGrant('pro', null, 'vip', 7, NOW)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt).toBeNull()
  })

  it('days = 0 hoặc âm → không trừ hạn đang có (phòng lỗi gọi sai)', () => {
    const zero = computePlanGrant('vip', daysFromNow(5), 'vip', 0, NOW)
    expect(zero.planExpiresAt?.getTime()).toBe(daysFromNow(5).getTime())

    const negative = computePlanGrant('vip', daysFromNow(5), 'vip', -3, NOW)
    expect(negative.planExpiresAt?.getTime()).toBe(daysFromNow(5).getTime())
  })

  it('days không phải số hữu hạn → không làm hỏng hạn hiện tại', () => {
    const r = computePlanGrant('vip', daysFromNow(5), 'vip', Number.NaN, NOW)
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(5).getTime())
  })
})

describe('computePlanGrant — cấp gói TRONG lúc khuyến mãi (2026-07-26): hạn không đếm lùi tới khi hết khuyến mãi', () => {
  const PROMO_UNTIL = daysFromNow(20) // khuyến mãi còn 20 ngày nữa mới hết

  it('cấp gói mới (chưa có gì) trong lúc khuyến mãi → hạn tính từ LÚC HẾT KHUYẾN MÃI, không phải từ bây giờ', () => {
    const r = computePlanGrant('free', null, 'vip', 7, NOW, PROMO_UNTIL)
    expect(r.plan).toBe('vip')
    expect(r.planExpiresAt?.getTime()).toBe(PROMO_UNTIL.getTime() + 7 * MS_DAY)
  })

  it('gia hạn gói ĐANG CÒN HẠN trong lúc khuyến mãi, hạn cũ RƠI TRƯỚC lúc hết khuyến mãi → vẫn neo theo khuyến mãi (không mất, không sớm hơn)', () => {
    const r = computePlanGrant('vip', daysFromNow(5), 'vip', 7, NOW, PROMO_UNTIL)
    expect(r.planExpiresAt?.getTime()).toBe(PROMO_UNTIL.getTime() + 7 * MS_DAY)
  })

  it('gia hạn gói ĐANG CÒN HẠN, hạn cũ RƠI SAU lúc hết khuyến mãi → nối tiếp từ hạn cũ như bình thường (không cần neo theo khuyến mãi)', () => {
    const r = computePlanGrant('vip', daysFromNow(30), 'vip', 7, NOW, PROMO_UNTIL)
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(37).getTime())
  })

  it('khuyến mãi ĐÃ HẾT HẠN (promoUntil ở quá khứ) → không ảnh hưởng gì, tính như bình thường', () => {
    const pastPromo = daysFromNow(-1)
    const r = computePlanGrant('free', null, 'vip', 7, NOW, pastPromo)
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(7).getTime())
  })

  it('không truyền promoUntil (mặc định null) → hành vi cũ, không bị ảnh hưởng', () => {
    const r = computePlanGrant('free', null, 'vip', 7, NOW)
    expect(r.planExpiresAt?.getTime()).toBe(daysFromNow(7).getTime())
  })
})

// Mô hình transaction/khóa dòng: đọc chỉ thấy dữ liệu commit, khóa giữ tới commit/rollback.
describe('grantPlanDays — transaction và cộng dồn đồng thời', () => {
  type Profile = { plan: string; plan_expires_at: Date | null }
  let profile: Profile | undefined
  let lockTail: Promise<void>
  let failWrite: boolean
  const traces: string[][] = []

  beforeEach(() => {
    profile = undefined
    lockTail = Promise.resolve()
    failWrite = false
    traces.length = 0
    vi.mocked(getAppSettings).mockResolvedValue({ promoUntil: null } as Awaited<
      ReturnType<typeof getAppSettings>
    >)
    const connect = vi.fn(async () => {
      let unlock: (() => void) | undefined
      let staged: Profile | undefined
      const trace: string[] = []
      traces.push(trace)
      const lock = async () => {
        if (unlock) return
        const previous = lockTail
        lockTail = new Promise<void>((resolve) => {
          unlock = resolve
        })
        await previous
        staged = profile ? { ...profile } : undefined
      }
      const query = vi.fn(async (sql: string, params?: unknown[]) => {
        trace.push(sql)
        if (sql === 'commit') {
          profile = staged
          unlock?.()
        } else if (sql === 'rollback') {
          unlock?.()
        } else if (sql.includes('on conflict (id) do nothing')) {
          await lock()
          staged ??= { plan: 'free', plan_expires_at: null }
        } else if (sql.startsWith('select plan')) {
          expect(sql).toContain('for update')
          await lock()
          return { rows: staged ? [{ ...staged }] : [] }
        } else if (sql.includes('do update')) {
          if (failWrite) {
            failWrite = false
            throw new Error('write failed')
          }
          expect(unlock).toBeDefined()
          staged = { plan: String(params?.[1]), plan_expires_at: params?.[2] as Date }
        }
        return { rows: [] }
      })
      return Object.assign(new Client(), { query, release: vi.fn() })
    })
    vi.mocked(getPgPool).mockReturnValue(Object.assign(new Pool(), { connect }))
  })

  it.each([false, true])(
    'hai lần cấp đồng thời không mất ngày (profile tồn tại: %s)',
    async (exists) => {
      if (exists) profile = { plan: 'vip', plan_expires_at: daysFromNow(5) }
      await Promise.all([grantPlanDays('u1', 'vip', 7, NOW), grantPlanDays('u1', 'vip', 3, NOW)])
      expect(profile?.plan_expires_at?.getTime()).toBe(daysFromNow(exists ? 15 : 10).getTime())
      expect(traces).toHaveLength(2)
      for (const trace of traces) {
        expect(trace[0]).toBe('begin')
        expect(trace.at(-1)).toBe('commit')
      }
    },
  )

  it('lỗi ghi rollback rồi retry chỉ cấp một lần', async () => {
    failWrite = true
    await expect(grantPlanDays('u1', 'vip', 7, NOW)).rejects.toThrow('write failed')
    expect(profile).toBeUndefined()
    expect(traces[0]?.at(-1)).toBe('rollback')
    await grantPlanDays('u1', 'vip', 7, NOW)
    expect(profile?.plan_expires_at?.getTime()).toBe(daysFromNow(7).getTime())
  })

  it('giữ gói vĩnh viễn', async () => {
    profile = { plan: 'vip', plan_expires_at: null }
    expect(await grantPlanDays('u1', 'vip', 7, NOW)).toEqual({ plan: 'vip', planExpiresAt: null })
  })

  it('khuyến mãi neo hạn theo promoUntil', async () => {
    vi.mocked(getAppSettings).mockResolvedValue({
      promoUntil: daysFromNow(20).toISOString(),
    } as Awaited<ReturnType<typeof getAppSettings>>)
    const result = await grantPlanDays('u1', 'vip', 7, NOW)
    expect(result.planExpiresAt?.getTime()).toBe(daysFromNow(27).getTime())
  })

  it('không đọc được khuyến mãi thì không ghi cấp gói với hạn sai', async () => {
    vi.mocked(getAppSettings).mockRejectedValueOnce(new Error('settings unavailable'))
    await expect(grantPlanDays('u1', 'vip', 7, NOW)).rejects.toThrow('settings unavailable')
    expect(profile).toBeUndefined()
    expect(traces).toHaveLength(0)
  })

  it('client của caller giữ quyền commit/rollback', async () => {
    const client = await getPgPool().connect()
    await client.query('begin')
    await grantPlanDays('u1', 'vip', 7, NOW, client)
    expect(getAppSettings).toHaveBeenLastCalledWith({ requireAvailable: true, runner: client })
    expect(profile).toBeUndefined()
    expect(traces[0]?.filter((sql) => sql === 'begin')).toHaveLength(1)
    await client.query('rollback')
    expect(profile).toBeUndefined()
    client.release()
  })
})

import { describe, it, expect } from 'vitest'
import { formatPlanExpiry, isLifetimeVip, sidebarPlanLabel } from './planLabel'

describe('planLabel — nhãn gói theo phiên (audit M8)', () => {
  it('Free: "Free · Nâng cấp" / thu gọn "Nâng cấp" — kể cả khi DB còn sót ngày hết hạn', () => {
    expect(sidebarPlanLabel('free', null, false)).toBe('Free · Nâng cấp')
    expect(sidebarPlanLabel('free', '2027-01-01T00:00:00.000Z', false)).toBe('Free · Nâng cấp')
    expect(sidebarPlanLabel('free', null, true)).toBe('Nâng cấp')
  })

  it('chưa có phiên (undefined) → coi như Free, không bao giờ hiện VIP', () => {
    expect(sidebarPlanLabel(undefined, null, false)).toBe('Free · Nâng cấp')
  })

  it('VIP với planExpiresAt = null tường minh = "VIP vĩnh viễn"', () => {
    expect(sidebarPlanLabel('vip', null, false)).toBe('VIP vĩnh viễn')
    expect(sidebarPlanLabel('vip', null, true)).toBe('VIP')
  })

  it('VIP thiếu trường planExpiresAt (undefined, phiên cũ) → "Gói VIP", KHÔNG hứa vĩnh viễn', () => {
    expect(sidebarPlanLabel('vip', undefined, false)).toBe('Gói VIP')
    expect(isLifetimeVip('vip', undefined)).toBe(false)
  })

  it('VIP có hạn → "VIP đến dd/mm/yyyy" theo giờ Việt Nam', () => {
    expect(sidebarPlanLabel('vip', '2026-12-31T16:59:00.000Z', false)).toBe('VIP đến 31/12/2026')
    expect(sidebarPlanLabel('vip', '2026-12-31T17:00:00.000Z', false)).toBe('VIP đến 01/01/2027')
  })

  it('VIP có chuỗi ngày hỏng → "Gói VIP" (không in "Invalid Date")', () => {
    expect(sidebarPlanLabel('vip', 'không-phải-ngày', false)).toBe('Gói VIP')
    expect(formatPlanExpiry('không-phải-ngày')).toBeNull()
  })

  it('isLifetimeVip chỉ đúng với VIP không có ngày hết hạn', () => {
    expect(isLifetimeVip('vip', null)).toBe(true)
    expect(isLifetimeVip('vip', '2027-01-01T00:00:00.000Z')).toBe(false)
    expect(isLifetimeVip('free', null)).toBe(false)
  })
})

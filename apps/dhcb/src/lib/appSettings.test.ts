import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import {
  getAppSettings,
  getDailyLimit,
  getLimits,
  hasReachedDailyLimit,
  isLeaderboardEnabled,
  refreshAppSettings,
  totalAiUsage,
} from './appSettings'
import { DEFAULT_PLAN_DAILY_LIMITS } from '@dhcb/core-contracts/appSettings'
import type { DailyUsage } from '../types'

const CACHE_KEY = 'app_settings_cache'

// Hình dạng CŨ (trước GĐ1) — hạn mức theo từng chế độ. Cache localStorage của bản phát hành
// trước còn nằm trên máy người dùng: phải bị bỏ qua, không được rò `undefined` ra giao diện.
const LEGACY_PER_MODE_LIMITS = {
  free: { chat: 5, writing: 5, speaking: 5, stt: 5, pronounce: 5 },
  vip: { chat: 1000000, writing: 1000000, speaking: 1000000, stt: 1000000, pronounce: 1000000 },
}

function usage(overrides: Partial<DailyUsage> = {}): DailyUsage {
  return {
    date: '2026-10-05',
    chatCount: 0,
    writingCount: 0,
    speakingCount: 0,
    sttCount: 0,
    pronounceCount: 0,
    learnCount: 0,
    ...overrides,
  }
}

describe('appSettings — cache localStorage + refresh từ server', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('chưa có cache → hạn mức mặc định Free 30 / VIP 300, promoUntil null, leaderboard tắt', () => {
    expect(getAppSettings().promoUntil).toBeNull()
    expect(isLeaderboardEnabled()).toBe(false)
    expect(getLimits()).toEqual(DEFAULT_PLAN_DAILY_LIMITS)
    expect(getLimits()).toEqual({ free: 30, vip: 300 })
  })

  it('refreshAppSettings: fetch OK → cập nhật current + ghi localStorage', async () => {
    const newSettings = {
      limits: { free: 30, vip: 300 },
      promoUntil: '2026-12-31T00:00:00.000Z',
      leaderboardEnabled: true,
      updatedAt: '2026-08-01T00:00:00.000Z',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        // Server trả thêm `aiCircuitBreaker` — trường lạ bị bỏ, không làm hỏng parse.
        json: async () => ({ ...newSettings, aiCircuitBreaker: false }),
      }),
    )
    await refreshAppSettings()
    expect(getAppSettings().promoUntil).toBe('2026-12-31T00:00:00.000Z')
    expect(isLeaderboardEnabled()).toBe(true)
    expect(getDailyLimit('vip')).toBe(300)
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual(newSettings)
  })

  it('refreshAppSettings: body lệch hợp đồng (hạn mức theo chế độ) → giữ giá trị cũ, không ghi cache', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          limits: LEGACY_PER_MODE_LIMITS,
          promoUntil: null,
          leaderboardEnabled: false,
          updatedAt: '2026-09-01T00:00:00.000Z',
        }),
      }),
    )
    const before = getAppSettings()
    await refreshAppSettings()
    expect(getAppSettings()).toBe(before)
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('refreshAppSettings: server trả 304 → giữ nguyên cache, không parse json', async () => {
    const jsonSpy = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 304, ok: false, json: jsonSpy }))
    const before = getAppSettings()
    await refreshAppSettings()
    expect(jsonSpy).not.toHaveBeenCalled()
    expect(getAppSettings()).toEqual(before)
  })

  it('refreshAppSettings: server lỗi (not ok, không phải 304) → bỏ qua êm', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 500, ok: false, json: async () => ({}) }),
    )
    const before = getAppSettings()
    await refreshAppSettings()
    expect(getAppSettings()).toEqual(before)
  })

  it('refreshAppSettings: fetch ném lỗi mạng → bắt lỗi, không crash', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    await expect(refreshAppSettings()).resolves.toBeUndefined()
  })
})

describe('appSettings — hạn mức TỔNG/ngày (audit M9)', () => {
  it('totalAiUsage cộng mọi chế độ tốn AI, KHÔNG cộng learnCount (học từ không tốn API)', () => {
    expect(
      totalAiUsage(
        usage({
          chatCount: 1,
          writingCount: 2,
          speakingCount: 3,
          sttCount: 4,
          pronounceCount: 5,
          learnCount: 99,
        }),
      ),
    ).toBe(15)
  })

  it('totalAiUsage chịu được bản ghi cũ thiếu pronounceCount', () => {
    const old = usage({ chatCount: 2 })
    delete old.pronounceCount
    expect(totalAiUsage(old)).toBe(2)
  })

  it('hasReachedDailyLimit: dưới hạn mức → false; ĐÚNG bằng hạn mức → true (biên)', () => {
    expect(hasReachedDailyLimit(usage({ chatCount: 299 }), 'vip')).toBe(false)
    expect(hasReachedDailyLimit(usage({ chatCount: 150, speakingCount: 150 }), 'vip')).toBe(true)
    expect(hasReachedDailyLimit(usage({ writingCount: 29 }), 'free')).toBe(false)
    expect(hasReachedDailyLimit(usage({ writingCount: 20, sttCount: 10 }), 'free')).toBe(true)
  })

  it('hasReachedDailyLimit: chưa dùng lượt nào thì chưa chạm hạn mức', () => {
    expect(hasReachedDailyLimit(usage(), 'vip')).toBe(false)
  })
})

// loadFromLocalStorage() chỉ chạy 1 LẦN lúc import module (khởi tạo biến `current`),
// nên phải reset module + import lại để phủ các nhánh đọc cache lúc khởi động.
describe('appSettings — khởi tạo `current` từ cache localStorage lúc load module', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('cache hợp lệ theo hợp đồng → dùng luôn', async () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        limits: { free: 40, vip: 400 },
        promoUntil: null,
        leaderboardEnabled: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    )
    const mod = await import('./appSettings')
    expect(mod.getAppSettings().updatedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(mod.getLimits()).toEqual({ free: 40, vip: 400 })
    expect(mod.isLeaderboardEnabled()).toBe(true)
  })

  it('cache hình dạng CŨ (hạn mức theo chế độ) → bỏ qua, dùng mặc định', async () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        limits: LEGACY_PER_MODE_LIMITS,
        promoUntil: null,
        leaderboardEnabled: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    )
    const mod = await import('./appSettings')
    expect(mod.getLimits()).toEqual(DEFAULT_PLAN_DAILY_LIMITS)
    expect(mod.getAppSettings().updatedAt).toBe('1970-01-01T00:00:00.000Z')
  })

  it('cache thiếu limits → coi như không có cache, dùng mặc định', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ updatedAt: '2026-01-01T00:00:00.000Z' }))
    const mod = await import('./appSettings')
    expect(mod.getLimits()).toEqual(DEFAULT_PLAN_DAILY_LIMITS)
  })

  it('cache là JSON hỏng → bắt lỗi, dùng mặc định', async () => {
    localStorage.setItem(CACHE_KEY, '{bad json')
    const mod = await import('./appSettings')
    expect(mod.getLimits()).toEqual(DEFAULT_PLAN_DAILY_LIMITS)
  })
})

describe('VIP không giới hạn — nâng cấp/rollback contract', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })
  afterEach(() => vi.unstubAllGlobals())
  const base = {
    limits: { free: 30, vip: 300 },
    promoUntil: null,
    leaderboardEnabled: false,
    updatedAt: '2026-10-06:vip-unlimited',
  }

  it('chỉ mở vô hạn khi server xác nhận; Free vẫn chặn ở hạn mức cấu hình', async () => {
    const mod = await import('./appSettings')
    expect(mod.getDailyLimit('vip')).toBe(300)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ ...base, vipUnlimited: true }),
        }),
    )
    await mod.refreshAppSettings()
    expect(mod.hasUnlimitedAi('vip')).toBe(true)
    expect(mod.hasUnlimitedAi('free')).toBe(false)
    expect(mod.getDailyLimit('vip')).toBe(Infinity)
    expect(mod.hasReachedDailyLimit(usage({ chatCount: 1_000_000 }), 'vip')).toBe(false)
    expect(mod.hasReachedDailyLimit(usage({ chatCount: 30 }), 'free')).toBe(true)
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual({ ...base, vipUnlimited: true })
  })

  it('server rollback không còn flag → UI dùng lại cap, không giữ lời hứa cũ', async () => {
    const mod = await import('./appSettings')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...base, vipUnlimited: true }),
        })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => base }),
    )
    await mod.refreshAppSettings()
    expect(mod.hasUnlimitedAi('vip')).toBe(true)
    await mod.refreshAppSettings()
    expect(mod.hasUnlimitedAi('vip')).toBe(false)
    expect(mod.getDailyLimit('vip')).toBe(300)
  })

  it('UI được thông báo khi hydrate xong và có thể hủy đăng ký', async () => {
    const mod = await import('./appSettings')
    const listener = vi.fn()
    const unsubscribe = mod.subscribeAppSettings(listener)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ ...base, vipUnlimited: true }),
        }),
    )
    await mod.refreshAppSettings()
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    await mod.refreshAppSettings()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('flag sai kiểu bị từ chối, không nới quyền hiển thị', async () => {
    const mod = await import('./appSettings')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ ...base, vipUnlimited: 'true' }),
        }),
    )
    await mod.refreshAppSettings()
    expect(mod.hasUnlimitedAi('vip')).toBe(false)
    expect(mod.getDailyLimit('vip')).toBe(300)
    warn.mockRestore()
  })
})

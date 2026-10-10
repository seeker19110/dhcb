import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateSettingsCache = vi.fn()
vi.mock('@dhcb/core-db/settings', () => ({
  invalidateSettingsCache: () => invalidateSettingsCache(),
}))

const { invalidateSettingsEverywhere, startSettingsSyncListener } =
  await import('./settingsSync.js')

describe('settingsSync — xoá cache cấu hình ở mọi tiến trình', () => {
  const savedRedisUrl = process.env.REDIS_URL
  beforeEach(() => {
    // Không có REDIS_URL ⇒ redisChat dùng EventEmitter trong tiến trình (thay cho Redis thật).
    delete process.env.REDIS_URL
    invalidateSettingsCache.mockClear()
  })
  afterEach(() => {
    if (savedRedisUrl === undefined) delete process.env.REDIS_URL
    else process.env.REDIS_URL = savedRedisUrl
  })

  it('không có tiến trình nào nghe: vẫn xoá cache của chính tiến trình gọi', () => {
    invalidateSettingsEverywhere()
    expect(invalidateSettingsCache).toHaveBeenCalledTimes(1)
  })

  it('có người nghe trên kênh: nhận tin và xoá cache (mô phỏng tiến trình PM2 khác)', async () => {
    const stop = startSettingsSyncListener()
    try {
      invalidateSettingsEverywhere()
      await vi.waitFor(() => expect(invalidateSettingsCache).toHaveBeenCalledTimes(2))
    } finally {
      stop()
    }
  })

  it('đã huỷ đăng ký thì không xoá thêm lần nào', async () => {
    const stop = startSettingsSyncListener()
    stop()
    invalidateSettingsEverywhere()
    await new Promise((r) => setTimeout(r, 10))
    expect(invalidateSettingsCache).toHaveBeenCalledTimes(1)
  })
})

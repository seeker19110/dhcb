// packages/core-auth/redisStartupReport.test.ts — Ghim hành vi báo trạng thái Redis lúc khởi
// động (thêm 2026-08-23 sau sự cố thật).
//
// SỰ CỐ ĐÃ XẢY RA: Redis trên VPS bật `requirepass`, nhưng `REDIS_URL` trong .env thiếu mật
// khẩu → client không bao giờ đạt 'ready' → rate limit chạy Map in-memory LIÊN TỤC, cluster 3
// instance nghĩa là hạn mức lỏng gấp 3. Nằm im nhiều ngày vì log chỉ có vài dòng rải rác trông
// như trục trặc thoáng qua. Các ca dưới đây ghim đúng thứ lẽ ra phải hét lên từ ngày đầu.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { reportRedisStatusAtStartup } from './security.js'

// Tiêm hàm ping giả qua tham số — KHÔNG mock ở tầng module, vì lời gọi nằm nội bộ trong
// security.ts nên mock module không chặn được (đã thử, test đỏ).
const pingMock = vi.fn()

describe('reportRedisStatusAtStartup', () => {
  const originalEnv = { ...process.env }
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env = { ...originalEnv }
    pingMock.mockReset()
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    process.env = originalEnv
    logSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('Redis chạy được → in dòng xác nhận kèm độ trễ', async () => {
    process.env.REDIS_URL = 'redis://:pw@127.0.0.1:6379'
    pingMock.mockResolvedValue({ ok: true, latencyMs: 4 })

    await reportRedisStatusAtStartup(pingMock)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✅'))
    expect(logSpy.mock.calls[0]?.[0]).toContain('4ms')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('ĐÚNG SỰ CỐ THẬT: Redis bật mật khẩu, URL thiếu mật khẩu → hét lên kèm cách sửa', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379' // thiếu mật khẩu
    pingMock.mockResolvedValue({ ok: false, error: 'NOAUTH Authentication required.' })

    await reportRedisStatusAtStartup(pingMock)

    const msg = String(warnSpy.mock.calls[0]?.[0])
    expect(msg).toContain('❌')
    expect(msg).toContain('NOAUTH') // nói rõ lý do, không chỉ "lỗi"
    expect(msg).toContain('production từ chối request có rate limit') // hậu quả mới: đóng an toàn
    expect(msg).toContain('redis://:MẬT_KHẨU@') // nói rõ CÁCH SỬA
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('chưa đặt REDIS_URL → im lặng (warnIfClusterWithoutRedis lo ca đó)', async () => {
    delete process.env.REDIS_URL

    await reportRedisStatusAtStartup(pingMock)

    expect(pingMock).not.toHaveBeenCalled()
    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})

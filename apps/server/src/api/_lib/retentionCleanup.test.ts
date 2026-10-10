// Test job dọn dữ liệu hết hạn (audit 2026-10-10, E3) — pool giả, không cần Postgres.
import { describe, expect, it, vi } from 'vitest'
import {
  ANALYTICS_RETENTION_DAYS,
  purgeExpiredAuthRows,
  purgeOldAnalyticsEvents,
} from './retentionCleanup.js'

describe('purgeExpiredAuthRows', () => {
  it('xoá phiên hết hạn + token/mã đã hết hạn quá 1 ngày, trả đúng số dòng từng bảng', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 3 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: null })
    expect(await purgeExpiredAuthRows({ query } as never)).toEqual({
      sessions: 3,
      passwordResets: 1,
      emailVerifications: 0,
    })
    const sqls = query.mock.calls.map(([sql]) => String(sql))
    expect(sqls[0]).toBe('delete from public.sessions where expires < now()')
    // Token/mã: chỉ xoá khi đã hết hạn QUÁ 1 ngày (không đụng dòng còn hạn → cooldown gửi lại đúng).
    expect(sqls[1]).toContain("password_resets where expires_at < now() - interval '1 day'")
    expect(sqls[2]).toContain("email_verifications where expires_at < now() - interval '1 day'")
  })
})

describe('purgeOldAnalyticsEvents', () => {
  it('giữ đúng 365 ngày (quyết định chủ dự án 2026-10-10)', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 0 })
    await purgeOldAnalyticsEvents({ query } as never)
    expect(ANALYTICS_RETENTION_DAYS).toBe(365)
    expect(query.mock.calls[0]![1]).toEqual([365, 5_000])
  })

  it('xoá theo lô tới khi một lô không đầy', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 5_000 })
      .mockResolvedValueOnce({ rowCount: 5_000 })
      .mockResolvedValueOnce({ rowCount: 12 })
    expect(await purgeOldAnalyticsEvents({ query } as never)).toEqual({ deleted: 10_012 })
    expect(query).toHaveBeenCalledTimes(3)
    expect(String(query.mock.calls[0]![0])).toContain('limit $2')
  })

  it('dừng ở trần số lô mỗi lần chạy — không lặp vô hạn khi bảng quá lớn', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 5_000 })
    expect(await purgeOldAnalyticsEvents({ query } as never)).toEqual({ deleted: 1_000_000 })
    expect(query).toHaveBeenCalledTimes(200)
  })

  it('lỗi CSDL → ném ra cho job ghi log/Sentry', async () => {
    const query = vi.fn().mockRejectedValue(new Error('db down'))
    await expect(purgeOldAnalyticsEvents({ query } as never)).rejects.toThrow('db down')
  })
})

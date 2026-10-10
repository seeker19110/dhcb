// Test cấu hình timeout của pool Postgres (audit 2026-10-10, E1.2) — chỉ đọc biến môi trường,
// không mở kết nối thật.
import { describe, expect, it } from 'vitest'
import { poolTimeoutsFromEnv } from './pgPool.js'

describe('poolTimeoutsFromEnv', () => {
  it('không cấu hình → dùng ngưỡng mặc định 10s / 60s / 60s', () => {
    expect(poolTimeoutsFromEnv({})).toEqual({
      connectionTimeoutMillis: 10_000,
      statement_timeout: 60_000,
      idle_in_transaction_session_timeout: 60_000,
    })
  })

  it('đọc giá trị từ .env', () => {
    expect(
      poolTimeoutsFromEnv({
        PG_CONNECT_TIMEOUT_MS: '5000',
        PG_STATEMENT_TIMEOUT_MS: '120000',
        PG_IDLE_IN_TRANSACTION_TIMEOUT_MS: '30000',
      }),
    ).toEqual({
      connectionTimeoutMillis: 5_000,
      statement_timeout: 120_000,
      idle_in_transaction_session_timeout: 30_000,
    })
  })

  it('0 = tắt hẳn (giữ nguyên 0, không rơi về mặc định)', () => {
    expect(poolTimeoutsFromEnv({ PG_STATEMENT_TIMEOUT_MS: '0' }).statement_timeout).toBe(0)
  })

  it.each(['', '  ', 'abc', '-1', '1.5', 'NaN'])(
    'giá trị hỏng %j → dùng mặc định, không tắt nhầm timeout',
    (raw) => {
      expect(poolTimeoutsFromEnv({ PG_STATEMENT_TIMEOUT_MS: raw }).statement_timeout).toBe(60_000)
    },
  )
})

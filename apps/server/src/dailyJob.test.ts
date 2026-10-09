// Test lịch job dọn hằng ngày (changelog 0545): chạy lúc khởi động + mỗi lần sang ngày UTC.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startDailyJob } from './dailyJob.js'

const MINUTE = 60_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-09T23:58:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('startDailyJob', () => {
  it('chạy MỘT lần sau trễ khởi động, rồi đúng một lần khi sang ngày UTC mới', async () => {
    const run = vi.fn(async () => {})
    const job = startDailyJob({ run, onError: vi.fn(), startupDelayMs: 30_000 })

    await vi.advanceTimersByTimeAsync(29_000)
    expect(run).not.toHaveBeenCalled() // chưa tới trễ khởi động
    await vi.advanceTimersByTimeAsync(1_000)
    expect(run).toHaveBeenCalledTimes(1) // lần khởi động — kể cả khi không sống qua nửa đêm

    await vi.advanceTimersByTimeAsync(MINUTE) // 23:59:30 — cùng ngày
    expect(run).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2 * MINUTE) // qua 00:00 UTC ngày 10
    expect(run).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(60 * MINUTE) // vẫn ngày 10
    expect(run).toHaveBeenCalledTimes(2)
    job.stop()
  })

  it('khởi động lại mỗi ngày (không tiến trình nào sống qua nửa đêm) vẫn chạy mỗi lần khởi động', async () => {
    const run = vi.fn(async () => {})
    for (let day = 0; day < 3; day++) {
      const job = startDailyJob({ run, onError: vi.fn(), startupDelayMs: 1_000 })
      await vi.advanceTimersByTimeAsync(2_000)
      job.stop()
      vi.setSystemTime(new Date(Date.now() + 24 * 60 * MINUTE))
    }
    expect(run).toHaveBeenCalledTimes(3)
  })

  it('lỗi được chuyển cho onError, job vẫn chạy ở ngày sau', async () => {
    const onError = vi.fn()
    const run = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValue()
    const job = startDailyJob({ run, onError, startupDelayMs: 0 })
    await vi.advanceTimersByTimeAsync(0)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'db down' }))
    await vi.advanceTimersByTimeAsync(3 * MINUTE)
    expect(run).toHaveBeenCalledTimes(2)
    job.stop()
  })

  it('lần trước chưa xong thì không chạy chồng', async () => {
    let finish: () => void = () => {}
    const run = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const job = startDailyJob({ run, onError: vi.fn(), startupDelayMs: 0 })
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(3 * MINUTE) // sang ngày mới khi lần đầu còn treo
    expect(run).toHaveBeenCalledTimes(1)
    finish()
    job.stop()
  })
})

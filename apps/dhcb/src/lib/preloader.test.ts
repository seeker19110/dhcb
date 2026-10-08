// preloader.test.ts — nạp trước từ điển là "cố gắng": lỗi không được lọt thành unhandled
// rejection và không được khoá cờ `learn` cả phiên (changelog 0525).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { preloadLearnData } from './preloader'
import { preloadFlags } from './preloadState'

const loadCurriculum = vi.fn<() => Promise<void>>()

vi.mock('./curriculum', () => ({
  loadCurriculum: () => loadCurriculum(),
  getTodayBatch: () => [],
}))
vi.mock('@core/authHeader', () => ({ getStoredToken: () => null, getAuthHeader: () => ({}) }))

beforeEach(() => {
  loadCurriculum.mockReset()
  preloadFlags.learn = false
})

describe('preloadLearnData', () => {
  it('từ điển lỗi → resolve (không ném), mở khoá để lần sau nạp lại', async () => {
    loadCurriculum.mockRejectedValueOnce(new Error('HTTP 503'))
    await expect(preloadLearnData('u1')).resolves.toBeUndefined()
    expect(preloadFlags.learn).toBe(false)

    loadCurriculum.mockResolvedValueOnce(undefined)
    await preloadLearnData('u1')
    expect(loadCurriculum).toHaveBeenCalledTimes(2)
  })

  it('đang nạp/đã nạp → không gọi lại', async () => {
    preloadFlags.learn = true
    await preloadLearnData('u1')
    expect(loadCurriculum).not.toHaveBeenCalled()
  })
})

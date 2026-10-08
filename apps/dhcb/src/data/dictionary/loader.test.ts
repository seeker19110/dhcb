import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'

function response(ok: boolean, data: unknown = []): Response {
  return { ok, json: async () => data } as Response
}

type CleanupCallback = (reason: unknown) => unknown

function capturePromiseCleanup(callbacks: CleanupCallback[]) {
  const originalCatch = Promise.prototype.catch
  return vi.spyOn(Promise.prototype, 'catch').mockImplementation(function <TResult = never>(
    this: Promise<unknown>,
    onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ) {
    if (onRejected) callbacks.push((reason) => onRejected(reason))
    return Reflect.apply(originalCatch, this, [() => undefined]) as Promise<unknown | TResult>
  })
}

describe('loadDictionary — cache promise có thể phục hồi', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => vi.unstubAllGlobals())

  it('coalesce lời gọi đang pending và kiểm response.ok cho đủ 10 chunk', async () => {
    const releases: Array<(value: Response) => void> = []
    vi.mocked(fetch).mockImplementation(
      () => new Promise<Response>((resolve) => releases.push(resolve)),
    )
    const { loadDictionary } = await import('./loader')

    const first = loadDictionary()
    const second = loadDictionary()
    expect(second).toBe(first)
    expect(fetch).toHaveBeenCalledTimes(10)

    for (const release of releases) release(response(true, []))
    await expect(first).resolves.toEqual([])
  })

  it('non-2xx reject, xóa đúng rejected cache và retry bằng promise/request mới', async () => {
    const cleanupCallbacks: CleanupCallback[] = []
    let catchSpy = capturePromiseCleanup(cleanupCallbacks)
    let fail = true
    const retryReleases: Array<(value: Response) => void> = []
    try {
      vi.mocked(fetch).mockImplementation((input) => {
        const url = String(input)
        if (fail) return Promise.resolve(response(!url.endsWith('chunk-004.json'), [{ word: url }]))
        return new Promise<Response>((resolve) => retryReleases.push(resolve))
      })
      const { loadDictionary } = await import('./loader')

      const oldAttemptStart = cleanupCallbacks.length
      const rejected = loadDictionary()
      catchSpy.mockRestore()
      await expect(rejected).rejects.toThrow('chunk-004.json')
      expect(loadDictionary(), 'cleanup bị chặn nên cache cũ vẫn còn').toBe(rejected)
      const oldAttemptCallbacks = cleanupCallbacks.slice(oldAttemptStart)
      expect(oldAttemptCallbacks).toHaveLength(1)

      const oldCleanup = oldAttemptCallbacks[0]
      oldCleanup(new Error('old rejection'))
      fail = false
      catchSpy = capturePromiseCleanup(cleanupCallbacks)
      const retryAttemptStart = cleanupCallbacks.length
      const retried = loadDictionary()
      catchSpy.mockRestore()
      expect(retried).not.toBe(rejected)
      expect(cleanupCallbacks.slice(retryAttemptStart)).toHaveLength(1)

      oldCleanup(new Error('late old cleanup'))
      expect(loadDictionary(), 'cleanup cũ không được xóa promise retry đang pending').toBe(retried)
      expect(fetch).toHaveBeenCalledTimes(20)
      for (const release of retryReleases) release(response(true, [{ word: 'retry' }]))
      await expect(retried).resolves.toHaveLength(10)
    } finally {
      catchSpy.mockRestore()
    }
  })

  // [changelog 0525] Câu lỗi cũ "Không tải được dữ liệu từ điển: chunk-000.json" có dấu tiếng Việt
  // nên `thongDiepLoiThanThien` giữ NGUYÊN VĂN — người học thấy cả tên file kỹ thuật.
  it('HTTP 503 → câu lỗi mang mã HTTP, dịch được sang câu thân thiện (không lộ tên file)', async () => {
    vi.mocked(fetch).mockImplementation(async () => ({ ok: false, status: 503 }) as Response)
    const { loadDictionary } = await import('./loader')
    const err: unknown = await loadDictionary().catch((e: unknown) => e)
    expect(thongDiepLoiThanThien(err)).toBe('Máy chủ đang gặp sự cố — thử lại sau ít phút.')
  })
})

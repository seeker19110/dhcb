import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

// Hai bản (đầy đủ + tóm tắt, changelog 0601) dùng CHUNG một khuôn nhớ promise — canh cả hai.
describe.each([
  ['loadFoundation', '/data/curriculum.json'],
  ['loadFoundationIndex', '/data/curriculum-index.json'],
] as const)('%s — cache promise có thể phục hồi', (ten, url) => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => vi.unstubAllGlobals())

  it('coalesce pending; non-2xx reset cache; retry tạo request mới', async () => {
    const cleanupCallbacks: CleanupCallback[] = []
    let catchSpy = capturePromiseCleanup(cleanupCallbacks)
    let release: ((value: Response) => void) | undefined
    try {
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            release = resolve
          }),
      )
      const loadFoundation = (await import('./curriculumLoader'))[ten]

      const oldAttemptStart = cleanupCallbacks.length
      const first = loadFoundation()
      expect(loadFoundation()).toBe(first)
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith(url)
      release?.(response(false))
      catchSpy.mockRestore()
      await expect(first).rejects.toThrow('lộ trình nền tảng')
      expect(loadFoundation(), 'cleanup bị chặn nên cache cũ vẫn còn').toBe(first)
      const oldAttemptCallbacks = cleanupCallbacks.slice(oldAttemptStart)
      expect(oldAttemptCallbacks).toHaveLength(1)

      const oldCleanup = oldAttemptCallbacks[0]
      oldCleanup(new Error('old rejection'))
      let releaseRetry: ((value: Response) => void) | undefined
      vi.mocked(fetch).mockImplementation(
        () => new Promise<Response>((resolve) => (releaseRetry = resolve)),
      )
      catchSpy = capturePromiseCleanup(cleanupCallbacks)
      const retryAttemptStart = cleanupCallbacks.length
      const retried = loadFoundation()
      catchSpy.mockRestore()
      expect(retried).not.toBe(first)
      expect(cleanupCallbacks.slice(retryAttemptStart)).toHaveLength(1)

      oldCleanup(new Error('late old cleanup'))
      expect(loadFoundation(), 'cleanup cũ không được xóa promise retry đang pending').toBe(retried)
      expect(fetch).toHaveBeenCalledTimes(2)
      releaseRetry?.(response(true, []))
      await expect(retried).resolves.toEqual([])
    } finally {
      catchSpy.mockRestore()
    }
  })
})

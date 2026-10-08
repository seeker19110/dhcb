// examplesLoaders.test.ts — hai loader "ví dụ phụ" phải kiểm HTTP + hình dạng và KHÔNG cache lỗi
// (changelog 0530). Bản cũ: `fetch().then(r => r.json())` — 503 thành "dữ liệu", lời hứa bị từ chối
// nằm trong cache mãi nên gọi lại vẫn lỗi tới khi F5.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const data = {
  run: [
    { en: 'I run.', vi: 'Tôi chạy.' },
    { en: 'He runs.', vi: 'Anh ấy chạy.' },
  ],
}

const LOADERS = [
  {
    ten: 'extraExamplesLoader',
    url: '/data/extra-examples.json',
    nap: async () => (await import('./extraExamplesLoader')).loadExtraExamples,
  },
  {
    ten: 'formExamplesLoader',
    url: '/data/form-examples.json',
    nap: async () => (await import('./formExamplesLoader')).loadFormExamples,
  },
]

describe.each(LOADERS)('$ten', ({ url, nap }) => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tải đúng URL, chia sẻ request và cache dữ liệu hợp lệ', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(data)))
    const load = await nap()
    expect(await Promise.all([load(), load()])).toEqual([data, data])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(url)
  })

  it.each(['network', 'http', 'json', 'shape'])(
    'lỗi %s: ném lỗi, KHÔNG cache, gọi lại tải được',
    async (failure) => {
      const mock = vi.mocked(fetch)
      if (failure === 'network') mock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      if (failure === 'http') mock.mockResolvedValueOnce(new Response('{}', { status: 503 }))
      if (failure === 'json') mock.mockResolvedValueOnce(new Response('<!doctype html>'))
      if (failure === 'shape') mock.mockResolvedValueOnce(new Response('[]'))
      mock.mockResolvedValueOnce(new Response(JSON.stringify(data)))
      const load = await nap()
      await expect(load()).rejects.toThrow()
      await expect(load()).resolves.toEqual(data)
      expect(fetch).toHaveBeenCalledTimes(2)
    },
  )
})

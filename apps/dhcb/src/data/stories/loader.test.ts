// loader.test.ts — loader truyện phải phân biệt "lỗi tải" với "không có truyện" (changelog 0525).
// Bản cũ: index lỗi → `[]` (trang hiện "chưa có truyện"); truyện lỗi mạng/5xx → `null` (trang hiện
// "không tìm thấy truyện", 5xx còn bị cache mãi).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type Loader = typeof import('./loader')

function response(body: string, status: number, contentType = 'application/json'): Response {
  return new Response(body, { status, headers: { 'content-type': contentType } })
}

const fetchMock = vi.fn<(url: string) => Promise<Response>>()

async function importFresh(): Promise<Loader> {
  vi.resetModules()
  return import('./loader')
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadStoryIndex', () => {
  it('lỗi mạng → reject (không giả làm danh sách rỗng), lần sau tải lại được', async () => {
    const { loadStoryIndex } = await importFresh()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(loadStoryIndex()).rejects.toThrow('Failed to fetch')

    fetchMock.mockResolvedValueOnce(response('[{"id":"fox"}]', 200))
    await expect(loadStoryIndex()).resolves.toEqual([{ id: 'fox' }])
  })

  it('HTTP 500 → reject', async () => {
    const { loadStoryIndex } = await importFresh()
    fetchMock.mockResolvedValueOnce(response('{}', 500))
    await expect(loadStoryIndex()).rejects.toThrow('HTTP 500')
  })

  it('body không phải mảng → reject', async () => {
    const { loadStoryIndex } = await importFresh()
    fetchMock.mockResolvedValueOnce(response('{"a":1}', 200))
    await expect(loadStoryIndex()).rejects.toThrow('không đúng định dạng')
  })
})

describe('loadStory', () => {
  it('404 → null (truyện không tồn tại), cache lại', async () => {
    const { loadStory } = await importFresh()
    fetchMock.mockResolvedValue(response('', 404))
    await expect(loadStory('nope')).resolves.toBeNull()
    await expect(loadStory('nope')).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('id lạ rơi vào catch-all SPA (HTML 200) → null như 404', async () => {
    const { loadStory } = await importFresh()
    fetchMock.mockResolvedValue(response('<!doctype html>', 200, 'text/html; charset=utf-8'))
    await expect(loadStory('lạ')).resolves.toBeNull()
  })

  it('HTTP 503 → reject và KHÔNG cache: lần sau tải được', async () => {
    const { loadStory } = await importFresh()
    fetchMock.mockResolvedValueOnce(response('{}', 503))
    await expect(loadStory('fox')).rejects.toThrow('HTTP 503')

    fetchMock.mockResolvedValueOnce(response('{"id":"fox","lines":[]}', 200))
    await expect(loadStory('fox')).resolves.toEqual({ id: 'fox', lines: [] })
  })

  it('lỗi mạng → reject (bản cũ trả null = "không tìm thấy truyện")', async () => {
    const { loadStory } = await importFresh()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(loadStory('fox')).rejects.toThrow('Failed to fetch')
  })
})

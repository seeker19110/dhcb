// Test lib/pronunciationApi.ts — phân loại phản hồi /api/pronunciation cho 2 nút loa.
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ Authorization: 'Bearer t' }) }))

import { fetchPronunciation } from './pronunciationApi'

function mockFetch(impl: () => Promise<Response>) {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchPronunciation', () => {
  it('200 có audio_url → ok, kèm giọng server thật sự dùng; gửi kèm token + mã hoá tham số', async () => {
    const fetchFn = mockFetch(async () =>
      json(200, { audio_url: 'https://cdn/a.mp3', voice: 'Kore', cached: true }),
    )
    const result = await fetchPronunciation('bỏ rơi, từ bỏ', 'Studio-O', 'vi-VN')
    expect(result).toEqual({ kind: 'ok', audioUrl: 'https://cdn/a.mp3', voice: 'Kore' })
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(
      `/api/pronunciation?word=${encodeURIComponent('bỏ rơi, từ bỏ')}&voice=Studio-O&lang=vi-VN`,
    )
    expect(init.headers).toEqual({ Authorization: 'Bearer t' })
  })

  it('429 kèm câu thông báo (hết lượt AI) → refused với ĐÚNG câu của server', async () => {
    const message = 'Bạn đã dùng hết lượt hôm nay. Thử lại vào ngày mai nhé.'
    mockFetch(async () => json(429, { error: message }))
    expect(await fetchPronunciation('apple', 'Kore', 'en-US')).toEqual({
      kind: 'refused',
      message,
    })
  })

  it('429 không có câu thông báo → error (không hiện chuỗi rỗng)', async () => {
    mockFetch(async () => new Response('Too Many Requests', { status: 429 }))
    expect(await fetchPronunciation('apple', 'Kore', 'en-US')).toEqual({
      kind: 'error',
      message: 'Lỗi 429',
    })
  })

  it('500 kèm lỗi → error giữ thông điệp server', async () => {
    mockFetch(async () => json(500, { error: 'Không thể tạo audio' }))
    expect(await fetchPronunciation('apple', 'Kore', 'en-US')).toEqual({
      kind: 'error',
      message: 'Không thể tạo audio',
    })
  })

  it('200 nhưng thiếu audio_url / sai kiểu → error', async () => {
    mockFetch(async () => json(200, { audio_url: 42 }))
    expect((await fetchPronunciation('apple', 'Kore', 'en-US')).kind).toBe('error')
  })

  it('mạng lỗi (fetch ném) → error, không ném ra ngoài', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await fetchPronunciation('apple', 'Kore', 'en-US')).toEqual({
      kind: 'error',
      message: 'Failed to fetch',
    })
  })
})

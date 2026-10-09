import { describe, it, expect, vi, beforeEach } from 'vitest'

// callClaude() gọi getAuthHeader() (đụng supabase) — mock để test chạy OFFLINE.
vi.mock('@core/authHeader', () => ({ getAuthHeader: vi.fn().mockResolvedValue({}) }))
vi.mock('./errorTracking.js', () => ({ captureException: vi.fn().mockResolvedValue(undefined) }))

import { callClaude, parseJson } from './ai'
import { captureException } from './errorTracking'

describe('callClaude — xử lý lỗi thân thiện (song ngữ, không phơi lỗi kỹ thuật ra UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('trả về text khi phản hồi đúng định dạng', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: 'Hello!' }] }),
    }) as unknown as typeof fetch
    const text = await callClaude([], 'system')
    expect(text).toBe('Hello!')
  })

  it('khối thinking đứng trước khối text → vẫn đọc đúng text theo type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [
            { type: 'thinking', thinking: '' },
            { type: 'text', text: 'Đáp án' },
          ],
        }),
    }) as unknown as typeof fetch
    expect(await callClaude([], 'system')).toBe('Đáp án')
  })

  it('gửi mode + task cho server, KHÔNG gửi tên model (server tự chọn theo nhiệm vụ)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ type: 'text', text: 'ok' }] }),
    })
    global.fetch = fetchMock as unknown as typeof fetch
    await callClaude([{ role: 'user', content: 'bài viết' }], 'sys', 2048, 'writing', 'grade')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string) as Record<
      string,
      unknown
    >
    expect(body).toMatchObject({ mode: 'writing', task: 'grade', max_tokens: 2048 })
    expect(body).not.toHaveProperty('model')
  })

  it('fetch ném lỗi mạng → thông điệp song ngữ thân thiện, không phải "Failed to fetch"', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch
    await expect(callClaude([], 'system')).rejects.toThrow(/Không kết nối được máy chủ/)
    expect(captureException).toHaveBeenCalled()
  })

  it('server trả lỗi CÓ message (vd hết lượt) → GIỮ NGUYÊN message đó (đã thân thiện sẵn)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: { message: 'Bạn đã dùng hết lượt hôm nay.' } }),
    }) as unknown as typeof fetch
    await expect(callClaude([], 'system')).rejects.toThrow('Bạn đã dùng hết lượt hôm nay.')
  })

  it('server trả lỗi KHÔNG có message → thông điệp chung, không lộ status thô', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch
    await expect(callClaude([], 'system')).rejects.toThrow(/Không kết nối được máy chủ/)
  })

  it('phản hồi 200 nhưng thiếu field "content" → thông điệp thân thiện, KHÔNG phải "Invalid API response: missing content"', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch
    await expect(callClaude([], 'system')).rejects.toThrow(/Phản hồi từ AI bị lỗi định dạng/)
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'missing content' }),
      { where: 'callClaude' },
    )
  })

  it('content là mảng rỗng → thông điệp thân thiện', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [] }),
    }) as unknown as typeof fetch
    await expect(callClaude([], 'system')).rejects.toThrow(/Phản hồi từ AI bị lỗi định dạng/)
  })

  it('text không phải string → thông điệp thân thiện', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: 123 }] }),
    }) as unknown as typeof fetch
    await expect(callClaude([], 'system')).rejects.toThrow(/Phản hồi từ AI bị lỗi định dạng/)
  })
})

describe('parseJson — trích xuất JSON từ câu trả lời AI (đôi khi bọc markdown/thừa chữ)', () => {
  it('JSON thuần → parse thẳng', () => {
    expect(parseJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 })
  })

  it('bọc trong code fence ```json ... ``` → bóc ra rồi parse', () => {
    expect(parseJson<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('bọc trong code fence không có "json" → vẫn bóc được', () => {
    expect(parseJson<{ a: number }>('```\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('có chữ thừa trước/sau khối JSON → cắt lấy phần từ { đầu tới } cuối', () => {
    expect(parseJson<{ a: number }>('Ok! {"a":1} cảm ơn')).toEqual({ a: 1 })
  })

  it('không có dấu { hoặc } nào → trả null', () => {
    expect(parseJson('không phải JSON gì cả')).toBeNull()
  })

  it('có { nhưng nội dung bên trong vẫn hỏng → trả null (không throw)', () => {
    expect(parseJson('{ "a": }')).toBeNull()
  })

  it('} xuất hiện trước { → end <= start, trả null', () => {
    expect(parseJson('} lộn xộn {')).toBeNull()
  })
})

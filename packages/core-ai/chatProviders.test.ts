import { describe, it, expect, vi, afterEach } from 'vitest'
import { callGroqChat, callGroqChatWithKeyPool } from './chatProviders.js'
import { __resetGroqKeyRotationForTests } from './groqKeyPool.js'

const originalFetch = global.fetch
const OLD_GROQ = process.env.GROQ_API_KEY

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
  __resetGroqKeyRotationForTests()
  if (OLD_GROQ === undefined) delete process.env.GROQ_API_KEY
  else process.env.GROQ_API_KEY = OLD_GROQ
})

function mockFetchOnce(resp: Partial<Response> & { ok: boolean; status: number }) {
  global.fetch = vi.fn().mockResolvedValue(resp as Response)
}

describe('callGroqChat', () => {
  it('phản hồi hợp lệ → success kèm text đúng đường dẫn choices[0].message.content', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'Xin chào' } }] }),
    } as Response)
    const result = await callGroqChat('key', 'model-x', 'system', [], 100)
    expect(result).toMatchObject({ kind: 'success', text: 'Xin chào' })
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('ghép system thành message role=system ở ĐẦU danh sách khi gửi cho Groq', async () => {
    let sentBody: unknown
    global.fetch = vi.fn().mockImplementation((_url, init: RequestInit) => {
      sentBody = JSON.parse(init.body as string)
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      } as Response)
    })
    await callGroqChat('key', 'model-x', 'bạn là gia sư', [{ role: 'user', content: 'hi' }], 100)
    expect(sentBody).toMatchObject({
      messages: [
        { role: 'system', content: 'bạn là gia sư' },
        { role: 'user', content: 'hi' },
      ],
    })
  })

  it('system rỗng → KHÔNG thêm message role=system', async () => {
    let sentBody: unknown
    global.fetch = vi.fn().mockImplementation((_url, init: RequestInit) => {
      sentBody = JSON.parse(init.body as string)
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      } as Response)
    })
    await callGroqChat('key', 'model-x', '', [{ role: 'user', content: 'hi' }], 100)
    expect(sentBody).toMatchObject({ messages: [{ role: 'user', content: 'hi' }] })
  })

  it('HTTP lỗi (500) → http_error kèm status + bodyText', async () => {
    mockFetchOnce({ ok: false, status: 500, text: async () => 'server error' } as Response)
    const result = await callGroqChat('key', 'model-x', '', [], 100)
    expect(result).toMatchObject({ kind: 'http_error', status: 500, bodyText: 'server error' })
  })

  it('lỗi mạng (fetch ném lỗi) → network_error kèm message', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const result = await callGroqChat('key', 'model-x', '', [], 100)
    expect(result).toMatchObject({ kind: 'network_error', message: 'ECONNREFUSED' })
  })

  it('200 nhưng thiếu choices → malformed_body', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({}) } as Response)
    const result = await callGroqChat('key', 'model-x', '', [], 100)
    expect(result.kind).toBe('malformed_body')
  })

  it('200 nhưng body không phải JSON (json() ném lỗi) → malformed_body', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('invalid json')
      },
    } as unknown as Response)
    const result = await callGroqChat('key', 'model-x', '', [], 100)
    expect(result.kind).toBe('malformed_body')
  })

  it('200 nhưng content không phải string → malformed_body', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 123 } }] }),
    } as Response)
    const result = await callGroqChat('key', 'model-x', '', [], 100)
    expect(result.kind).toBe('malformed_body')
  })

  it('200 nhưng body rỗng, thiếu choices, hoặc thiếu message → malformed_body', async () => {
    // null data
    mockFetchOnce({ ok: true, status: 200, json: async () => null } as Response)
    expect((await callGroqChat('key', 'model', '', [], 100)).kind).toBe('malformed_body')

    // empty choices
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ choices: [] }) } as Response)
    expect((await callGroqChat('key', 'model', '', [], 100)).kind).toBe('malformed_body')

    // choice without message
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ choices: [{}] }) } as Response)
    expect((await callGroqChat('key', 'model', '', [], 100)).kind).toBe('malformed_body')

    // message without content
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: {} }] }),
    } as Response)
    expect((await callGroqChat('key', 'model', '', [], 100)).kind).toBe('malformed_body')
  })
})

describe('callGroqChatWithKeyPool', () => {
  it('không có key nào → network_error báo chưa cấu hình, không gọi fetch', async () => {
    delete process.env.GROQ_API_KEY
    const fetchSpy = vi.fn()
    global.fetch = fetchSpy
    const result = await callGroqChatWithKeyPool('model-x', '', [], 100)
    expect(result).toMatchObject({ kind: 'network_error' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('1 key hợp lệ → success, gọi fetch đúng 1 lần', async () => {
    process.env.GROQ_API_KEY = 'key-a'
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    } as Response)
    global.fetch = fetchSpy
    const result = await callGroqChatWithKeyPool('model-x', '', [], 100)
    expect(result).toMatchObject({ kind: 'success', text: 'ok' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('key đầu 401 → tự chuyển sang key kế tiếp trong bể và thành công', async () => {
    process.env.GROQ_API_KEY = 'key-bad,key-good'
    const fetchSpy = vi.fn().mockImplementation((_url, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).Authorization
      if (auth === 'Bearer key-bad') {
        return Promise.resolve({ ok: false, status: 401, text: async () => 'invalid' } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'ok từ key tốt' } }] }),
      } as Response)
    })
    global.fetch = fetchSpy
    const result = await callGroqChatWithKeyPool('model-x', '', [], 100)
    expect(result).toMatchObject({ kind: 'success', text: 'ok từ key tốt' })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('toàn bộ key đều 429 → trả về http_error của lần thử CUỐI, không lặp vô hạn', async () => {
    process.env.GROQ_API_KEY = 'key-1,key-2'
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limited' } as Response)
    global.fetch = fetchSpy
    const result = await callGroqChatWithKeyPool('model-x', '', [], 100)
    expect(result).toMatchObject({ kind: 'http_error', status: 429 })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('lỗi không liên quan tới key (500) và chỉ có 1 model → trả lỗi ngay, không thử key khác', async () => {
    process.env.GROQ_API_KEY = 'key-1,key-2'
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: async () => 'server error' } as Response)
    global.fetch = fetchSpy
    const result = await callGroqChatWithKeyPool('model-x', '', [], 100)
    expect(result).toMatchObject({ kind: 'http_error', status: 500 })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('nhiều model, model 1 bị 400 (model_not_found) → tự chuyển sang model 2 và thành công', async () => {
    process.env.GROQ_API_KEY = 'gsk-key'
    const fetchSpy = vi.fn().mockImplementation((_url, init: RequestInit) => {
      const body = JSON.parse(init.body as string)
      if (body.model === 'model-unavailable') {
        return Promise.resolve({
          ok: false,
          status: 400,
          text: async () => 'model_not_found',
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'trả lời từ model 2' } }] }),
      } as Response)
    })
    global.fetch = fetchSpy

    const result = await callGroqChatWithKeyPool('model-unavailable, model-working', '', [], 100)
    expect(result).toMatchObject({ kind: 'success', text: 'trả lời từ model 2' })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('nhiều model, toàn bộ model đều lỗi → trả về lỗi của model cuối', async () => {
    process.env.GROQ_API_KEY = 'gsk-key'
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'model_not_found',
    } as Response)
    global.fetch = fetchSpy

    const result = await callGroqChatWithKeyPool('model-bad1, model-bad2', '', [], 100)
    expect(result).toMatchObject({ kind: 'http_error', status: 400 })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})

// @vitest-environment node
// (SDK Anthropic chặn chạy trong môi trường giống trình duyệt — happy-dom mặc định của repo — vì
// sợ lộ khoá; code này chỉ chạy ở server Node nên test cũng chạy môi trường node.)
// anthropicClient.test.ts — Lớp gọi Claude qua SDK chính thức. Không gọi mạng: truyền fetch giả
// vào SDK (đi qua TOÀN BỘ đường SDK thật: dựng request, đọc JSON, phân loại lỗi, thử lại).
// Điều cần canh: (1) đọc câu trả lời theo `type` chứ không theo vị trí (khối thinking đứng đầu),
// (2) refusal / max_tokens / rỗng KHÔNG bị coi là thành công, (3) lịch sử được chuẩn hoá để
// không dính 400 của model mới, (4) tham số gửi đi đúng theo nhiệm vụ.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  buildAnthropicRequest,
  callAnthropicText,
  toAnthropicMessages,
  OPENING_USER_TURN,
  CLOSING_USER_TURN,
} from './anthropicClient.js'
import { getAnthropicRoute } from './aiConfig.js'

const FAST = getAnthropicRoute('converse')
const SMART = getAnthropicRoute('grade')

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    // retry-after-ms: 0 → SDK thử lại NGAY, test không phải chờ backoff thật.
    headers: { 'content-type': 'application/json', 'retry-after-ms': '0', ...headers },
  })
}

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-haiku-5-5',
    content: [{ type: 'text', text: 'Xin chào!' }],
    stop_reason: 'end_turn',
    stop_details: null,
    usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50 },
    ...overrides,
  }
}

type FetchFn = typeof fetch
function fakeFetch(...responses: Array<Response | Error>) {
  const fn = vi.fn<FetchFn>()
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r)
    else fn.mockResolvedValueOnce(r)
  }
  return fn
}

function sentBody(fn: ReturnType<typeof fakeFetch>, call = 0): Record<string, unknown> {
  const init = fn.mock.calls[call]?.[1] as RequestInit
  return JSON.parse(init.body as string) as Record<string, unknown>
}

function sentHeaders(fn: ReturnType<typeof fakeFetch>, call = 0): Headers {
  const init = fn.mock.calls[call]?.[1] as RequestInit
  return new Headers(init.headers)
}

const BASE = {
  apiKey: 'sk-test',
  route: FAST,
  system: 'sys',
  messages: [{ role: 'user', content: 'hi' }],
}

describe('toAnthropicMessages — gỡ 4 bẫy 400 của model mới', () => {
  it('lịch sử rỗng → thêm một lượt user mở đầu (API đòi ≥ 1 tin)', () => {
    expect(toAnthropicMessages([])).toEqual([{ role: 'user', content: OPENING_USER_TURN }])
  })

  it('tin đầu là của AI → chèn lượt user ở đầu', () => {
    const out = toAnthropicMessages([
      { role: 'assistant', content: 'Câu hỏi?' },
      { role: 'user', content: 'Trả lời' },
    ])
    expect(out[0]).toEqual({ role: 'user', content: OPENING_USER_TURN })
    expect(out).toHaveLength(3)
  })

  it('tin cuối là của AI (chấm điểm cuối phiên) → thêm lượt user ở cuối, tránh "prefill" 400', () => {
    const out = toAnthropicMessages([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ])
    expect(out.at(-1)).toEqual({ role: 'user', content: CLOSING_USER_TURN })
  })

  it('bỏ tin rỗng/toàn khoảng trắng, vai lạ, nội dung không phải chuỗi; trim nội dung', () => {
    const out = toAnthropicMessages([
      { role: 'user', content: '  một  ' },
      { role: 'user', content: '   ' },
      { role: 'system', content: 'lén đổi vai' },
      { role: 'assistant', content: 42 },
      'rác',
      null,
      { role: 'user', content: 'hai' },
    ])
    expect(out).toEqual([
      { role: 'user', content: 'một' },
      { role: 'user', content: 'hai' },
    ])
  })
})

describe('buildAnthropicRequest — tham số theo nhiệm vụ', () => {
  it('trò chuyện: Haiku, effort low, KHÔNG gửi temperature/top_p, KHÔNG gửi fallbacks', () => {
    const req = buildAnthropicRequest(FAST, 'sys', [{ role: 'user', content: 'hi' }])
    expect(req.model).toBe('claude-haiku-5-5')
    expect(req.output_config).toEqual({ effort: 'low' })
    expect(req.max_tokens).toBe(FAST.maxTokens)
    expect(req.cache_control).toEqual({ type: 'ephemeral' })
    expect(req).not.toHaveProperty('temperature')
    expect(req).not.toHaveProperty('top_p')
    expect(req).not.toHaveProperty('thinking') // adaptive mặc định — không gửi 'disabled' (400)
    expect(req.fallbacks).toBeUndefined()
    expect(req.betas).toBeUndefined()
  })

  it('chấm bài: Sonnet, effort medium, bật server-side fallback "default"', () => {
    const req = buildAnthropicRequest(SMART, 'sys', [])
    expect(req.model).toBe('claude-sonnet-5-5')
    expect(req.output_config).toEqual({ effort: 'medium' })
    expect(req.fallbacks).toBe('default')
    expect(req.betas).toEqual(['server-side-fallback-2026-07-01'])
  })

  it('system rỗng → không gửi trường system', () => {
    expect(buildAnthropicRequest(FAST, '', [])).not.toHaveProperty('system')
  })
})

describe('callAnthropicText — đọc kết quả', () => {
  it('khối thinking đứng TRƯỚC câu trả lời → vẫn lấy đúng text (không đọc content[0])', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(
        message({
          content: [
            { type: 'thinking', thinking: '', signature: 'sig' },
            { type: 'text', text: '  Câu trả lời  ' },
          ],
        }),
      ),
    )
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r).toMatchObject({ kind: 'success', text: 'Câu trả lời', model: 'claude-haiku-5-5' })
  })

  it('ghép nhiều khối text quanh khối fallback; model THẬT lấy từ response', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(
        message({
          model: 'claude-opus-5-5',
          content: [
            { type: 'text', text: 'Phần 1. ' },
            {
              type: 'fallback',
              from: { model: 'claude-sonnet-5-5' },
              to: { model: 'claude-opus-5-5' },
            },
            { type: 'text', text: 'Phần 2.' },
          ],
        }),
      ),
    )
    const r = await callAnthropicText({ ...BASE, route: SMART, fetchImpl })
    expect(r).toMatchObject({ kind: 'success', text: 'Phần 1. Phần 2.', model: 'claude-opus-5-5' })
  })

  it('usage: cộng token đọc cache vào tổng token vào', async () => {
    const fetchImpl = fakeFetch(jsonResponse(message()))
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r.kind === 'success' && r.usage).toEqual({
      promptTokens: 150,
      completionTokens: 20,
      cacheReadTokens: 50,
      cacheWriteTokens: 0,
    })
  })

  it('refusal (HTTP 200) → unusable/refusal kèm hạng mục, KHÔNG phải success', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(
        message({
          content: [],
          stop_reason: 'refusal',
          stop_details: { type: 'refusal', category: 'general_harms', explanation: null },
        }),
      ),
    )
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r).toMatchObject({ kind: 'unusable', reason: 'refusal', detail: 'general_harms' })
  })

  it('max_tokens (câu dở dang, JSON chấm điểm sẽ hỏng) → unusable/max_tokens', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(
        message({ content: [{ type: 'text', text: '{"band": 6.' }], stop_reason: 'max_tokens' }),
      ),
    )
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r).toMatchObject({ kind: 'unusable', reason: 'max_tokens' })
  })

  it('chỉ có thinking, không có text → unusable/empty', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(message({ content: [{ type: 'thinking', thinking: '', signature: 's' }] })),
    )
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r).toMatchObject({ kind: 'unusable', reason: 'empty' })
  })

  it('vượt cửa sổ ngữ cảnh → unusable/context_exceeded', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(message({ content: [], stop_reason: 'model_context_window_exceeded' })),
    )
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r).toMatchObject({ kind: 'unusable', reason: 'context_exceeded' })
  })
})

describe('callAnthropicText — lỗi & thử lại', () => {
  it('400 (lỗi request) → api_error 400, KHÔNG thử lại', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(
        { type: 'error', error: { type: 'invalid_request_error', message: 'bad' } },
        400,
      ),
    )
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r).toMatchObject({ kind: 'api_error', status: 400 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('529 quá tải → thử lại MỘT lần → thành công', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse({ type: 'error', error: { type: 'overloaded_error', message: 'busy' } }, 529),
      jsonResponse(message()),
    )
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r.kind).toBe('success')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('529 hai lần liền → dừng sau 1 lần thử lại, trả api_error 529 (để caller chuyển provider)', async () => {
    const overloaded = () =>
      jsonResponse({ type: 'error', error: { type: 'overloaded_error', message: 'busy' } }, 529)
    const fetchImpl = fakeFetch(overloaded(), overloaded(), overloaded())
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r).toMatchObject({ kind: 'api_error', status: 529 })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('rớt mạng (fetch ném lỗi) → network_error, không ném ra ngoài', async () => {
    const fetchImpl = fakeFetch(new TypeError('fetch failed'), new TypeError('fetch failed'))
    const r = await callAnthropicText({ ...BASE, fetchImpl })
    expect(r.kind).toBe('network_error')
  })

  describe('hạn chót tổng', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('treo quá timeoutMs của nhiệm vụ → network_error "Hết thời gian chờ"', async () => {
      // fetch giả không bao giờ trả lời, chỉ dừng khi signal bị huỷ (đúng như fetch thật).
      const fetchImpl = vi.fn<FetchFn>(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            )
          }),
      )
      const pending = callAnthropicText({ ...BASE, route: { ...FAST, timeoutMs: 1000 }, fetchImpl })
      await vi.advanceTimersByTimeAsync(5000)
      const r = await pending
      expect(r.kind).toBe('network_error')
    })
  })

  it('gửi đúng header khoá + body (model, messages đã chuẩn hoá, system)', async () => {
    const fetchImpl = fakeFetch(jsonResponse(message()))
    await callAnthropicText({ ...BASE, messages: [], fetchImpl })
    expect(sentHeaders(fetchImpl).get('x-api-key')).toBe('sk-test')
    const body = sentBody(fetchImpl)
    expect(body.model).toBe('claude-haiku-5-5')
    expect(body.system).toBe('sys')
    expect(body.messages).toEqual([{ role: 'user', content: OPENING_USER_TURN }])
  })
})

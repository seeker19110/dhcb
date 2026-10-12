// @vitest-environment node
// (SDK Anthropic chặn chạy trong môi trường giống trình duyệt — xem anthropicClient.test.ts.)
// Vòng công cụ của Claude (GĐ3) — chạy qua TOÀN BỘ SDK thật với fetch giả, để canh đúng body gửi
// đi (strict, tool_choice, nguyên khối thinking gửi lại) chứ không chỉ logic vòng lặp.
import { describe, it, expect, vi } from 'vitest'
import {
  runAnthropicToolLoop,
  TOOL_LIMIT_MESSAGE,
  TOOL_CRASH_MESSAGE,
  type ToolLoopToolDefinition,
} from './anthropicToolLoop.js'
import type { AnthropicRoute } from './aiConfig.js'
import { obj, str } from './jsonSchema.js'

type FetchFn = typeof fetch

const ROUTE: AnthropicRoute = {
  model: 'claude-sonnet-5-5',
  effort: 'low',
  maxTokens: 4096,
  timeoutMs: 30_000,
}

const TOOLS: ToolLoopToolDefinition[] = [
  {
    name: 'get_review_queue',
    description: 'Thẻ cần ôn',
    inputSchema: obj({}) as Extract<ReturnType<typeof obj>, { type: 'object' }>,
  },
  {
    name: 'lookup_dictionary',
    description: 'Tra từ',
    inputSchema: obj({ word: str() }) as Extract<ReturnType<typeof obj>, { type: 'object' }>,
  },
]

interface Block {
  type: string
  [k: string]: unknown
}

function message(content: Block[], stop_reason = 'end_turn') {
  return {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5-5',
    content,
    stop_reason,
    stop_sequence: null,
    stop_details: null,
    usage: { input_tokens: 100, output_tokens: 20 },
  }
}

const thinking: Block = { type: 'thinking', thinking: '', signature: 'sig-abc' }
const toolUse = (id: string, name: string, input: Record<string, unknown>): Block => ({
  type: 'tool_use',
  id,
  name,
  input,
})
const text = (t: string): Block => ({ type: 'text', text: t })

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/** Body SSE đúng thứ tự sự kiện của Anthropic cho một message có khối text và/hoặc tool_use. */
function sseResponse(content: Block[], stop_reason = 'end_turn') {
  const events: Array<Record<string, unknown>> = [
    {
      type: 'message_start',
      message: { ...message([], stop_reason), stop_reason: null },
    },
  ]
  content.forEach((block, index) => {
    if (block.type === 'text') {
      events.push({ type: 'content_block_start', index, content_block: { type: 'text', text: '' } })
      events.push({
        type: 'content_block_delta',
        index,
        delta: { type: 'text_delta', text: block.text },
      })
    } else if (block.type === 'tool_use') {
      events.push({
        type: 'content_block_start',
        index,
        content_block: { ...block, input: {} },
      })
      events.push({
        type: 'content_block_delta',
        index,
        delta: { type: 'input_json_delta', partial_json: JSON.stringify(block.input) },
      })
    } else {
      events.push({
        type: 'content_block_start',
        index,
        content_block: { type: 'thinking', thinking: '', signature: '' },
      })
      events.push({
        type: 'content_block_delta',
        index,
        delta: { type: 'signature_delta', signature: 'sig-abc' },
      })
    }
    events.push({ type: 'content_block_stop', index })
  })
  events.push(
    {
      type: 'message_delta',
      delta: { stop_reason, stop_sequence: null },
      usage: { output_tokens: 20 },
    },
    { type: 'message_stop' },
  )
  const body = events
    .map((ev) => `event: ${String(ev.type)}\ndata: ${JSON.stringify(ev)}\n\n`)
    .join('')
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })
}

function fakeFetch(...responses: Array<Response | Error>) {
  const fn = vi.fn<FetchFn>()
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r)
    else fn.mockResolvedValueOnce(r)
  }
  return fn
}

function sentBody(fn: ReturnType<typeof fakeFetch>, call: number): Record<string, unknown> {
  const init = fn.mock.calls[call]?.[1] as RequestInit
  return JSON.parse(init.body as string) as Record<string, unknown>
}

const BASE = {
  apiKey: 'sk-test',
  route: ROUTE,
  system: 'sys',
  messages: [{ role: 'user', content: 'Hôm nay mình cần ôn gì?' }],
  tools: TOOLS,
}

describe('runAnthropicToolLoop', () => {
  it('một bước không công cụ ⇒ success, không thi hành gì', async () => {
    const fetchImpl = fakeFetch(jsonResponse(message([thinking, text('Chào bạn!')])))
    const executeTool = vi.fn()
    const r = await runAnthropicToolLoop({ ...BASE, executeTool, fetchImpl })
    expect(r).toMatchObject({ kind: 'success', text: 'Chào bạn!', steps: 1, toolCalls: [] })
    expect(executeTool).not.toHaveBeenCalled()
    const body = sentBody(fetchImpl, 0)
    expect(body.tool_choice).toEqual({ type: 'auto' })
    // Mọi công cụ gửi đi đều strict + object đóng.
    for (const tool of body.tools as Array<Record<string, unknown>>) {
      expect(tool.strict).toBe(true)
      expect((tool.input_schema as { additionalProperties: unknown }).additionalProperties).toBe(
        false,
      )
      expect(tool.eager_input_streaming).toBeUndefined()
    }
  })

  it('tool_use → end_turn: thi hành đúng công cụ, gửi lại NGUYÊN content (cả thinking) + MỘT tin tool_result', async () => {
    const step1 = [thinking, toolUse('tu_1', 'get_review_queue', {})]
    const fetchImpl = fakeFetch(
      jsonResponse(message(step1, 'tool_use')),
      jsonResponse(message([text('Bạn có 3 thẻ cần ôn.')])),
    )
    const executeTool = vi.fn(async () => ({ content: '{"due":3}' }))
    const onToolStart = vi.fn()
    const r = await runAnthropicToolLoop({ ...BASE, executeTool, onToolStart, fetchImpl })

    expect(r).toMatchObject({
      kind: 'success',
      text: 'Bạn có 3 thẻ cần ôn.',
      steps: 2,
      toolCalls: [{ name: 'get_review_queue', ok: true }],
    })
    expect(r.calls).toHaveLength(2)
    expect(executeTool).toHaveBeenCalledWith('get_review_queue', {})
    expect(onToolStart).toHaveBeenCalledWith('get_review_queue')

    const second = sentBody(fetchImpl, 1).messages as Array<{ role: string; content: unknown }>
    expect(second).toHaveLength(3)
    expect(second[1]).toEqual({ role: 'assistant', content: step1 })
    expect(second[2]).toEqual({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: '{"due":3}' }],
    })
  })

  it('hết trần bước ⇒ lần gọi kế tiếp ép tool_choice none', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(message([toolUse('a', 'get_review_queue', {})], 'tool_use')),
      jsonResponse(message([toolUse('b', 'get_review_queue', {})], 'tool_use')),
      jsonResponse(message([text('Xong.')])),
    )
    const executeTool = vi.fn(async () => ({ content: 'ok' }))
    const r = await runAnthropicToolLoop({ ...BASE, executeTool, fetchImpl, maxToolSteps: 2 })
    expect(r.kind).toBe('success')
    expect(sentBody(fetchImpl, 0).tool_choice).toEqual({ type: 'auto' })
    expect(sentBody(fetchImpl, 1).tool_choice).toEqual({ type: 'auto' })
    expect(sentBody(fetchImpl, 2).tool_choice).toEqual({ type: 'none' })
    // Vẫn gửi `tools` ở lần cuối — lịch sử có khối tool_use cần định nghĩa đi kèm.
    expect(sentBody(fetchImpl, 2).tools).toBeDefined()
  })

  it('quá trần số lần thi hành ⇒ is_error, công cụ không chạy', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(
        message(
          [
            toolUse('a', 'get_review_queue', {}),
            toolUse('b', 'lookup_dictionary', { word: 'cat' }),
          ],
          'tool_use',
        ),
      ),
      jsonResponse(message([text('Trả lời.')])),
    )
    const executeTool = vi.fn(async () => ({ content: 'ok' }))
    const r = await runAnthropicToolLoop({ ...BASE, executeTool, fetchImpl, maxExecutions: 1 })
    expect(executeTool).toHaveBeenCalledTimes(1)
    expect(r.toolCalls).toEqual([
      { name: 'get_review_queue', ok: true },
      { name: 'lookup_dictionary', ok: false },
    ])
    const results = (sentBody(fetchImpl, 1).messages as Array<{ content: unknown }>)[2]!
      .content as Array<Record<string, unknown>>
    expect(results[1]).toMatchObject({ is_error: true, content: TOOL_LIMIT_MESSAGE })
  })

  it('công cụ ném lỗi ⇒ is_error, vòng vẫn đi tiếp', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(message([toolUse('a', 'get_review_queue', {})], 'tool_use')),
      jsonResponse(message([text('Mình chưa tra được lúc này.')])),
    )
    const executeTool = vi.fn(async () => {
      throw new Error('pg down')
    })
    const r = await runAnthropicToolLoop({ ...BASE, executeTool, fetchImpl })
    expect(r).toMatchObject({
      kind: 'success',
      toolCalls: [{ name: 'get_review_queue', ok: false }],
    })
    const results = (sentBody(fetchImpl, 1).messages as Array<{ content: unknown }>)[2]!
      .content as Array<Record<string, unknown>>
    expect(results[0]).toMatchObject({ is_error: true, content: TOOL_CRASH_MESSAGE })
  })

  it.each([
    ['refusal', 'refusal'],
    ['max_tokens', 'max_tokens'],
  ])('stop_reason %s ⇒ unusable, KHÔNG chạy công cụ của bước bị cắt', async (stop, reason) => {
    const fetchImpl = fakeFetch(jsonResponse(message([toolUse('a', 'get_review_queue', {})], stop)))
    const executeTool = vi.fn()
    const r = await runAnthropicToolLoop({ ...BASE, executeTool, fetchImpl })
    expect(r).toMatchObject({ kind: 'unusable', reason })
    expect(r.calls).toHaveLength(1) // vẫn ghi chi phí — token đã bị tính
    expect(executeTool).not.toHaveBeenCalled()
  })

  it('lỗi HTTP ⇒ api_error kèm chi phí các bước trước', async () => {
    const fetchImpl = fakeFetch(
      jsonResponse(message([toolUse('a', 'get_review_queue', {})], 'tool_use')),
      new Response(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error' } }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const r = await runAnthropicToolLoop({
      ...BASE,
      executeTool: async () => ({ content: 'ok' }),
      fetchImpl,
    })
    expect(r).toMatchObject({ kind: 'api_error', status: 400 })
    expect(r.calls).toHaveLength(1)
  })

  it('hết hạn chót tổng ⇒ network_error, không gọi API', async () => {
    const fetchImpl = fakeFetch()
    const r = await runAnthropicToolLoop({
      ...BASE,
      executeTool: async () => ({ content: 'ok' }),
      fetchImpl,
      deadlineMs: 0,
    })
    expect(r.kind).toBe('network_error')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('stream: chỉ chữ tới onTextDelta (không input_json), hai bước có chữ nối bằng dòng trống', async () => {
    const fetchImpl = fakeFetch(
      sseResponse(
        [thinking, text('Để mình xem.'), toolUse('a', 'get_review_queue', {})],
        'tool_use',
      ),
      sseResponse([text('Bạn có 3 thẻ.')]),
    )
    const deltas: string[] = []
    const r = await runAnthropicToolLoop({
      ...BASE,
      executeTool: async () => ({ content: '{"due":3}' }),
      onTextDelta: (d) => deltas.push(d),
      fetchImpl,
    })
    expect(deltas).toEqual(['Để mình xem.', '\n\n', 'Bạn có 3 thẻ.'])
    expect(r).toMatchObject({ kind: 'success', text: 'Để mình xem.\n\nBạn có 3 thẻ.' })
    expect(deltas.join('')).toBe((r as { text: string }).text)
    // Bước 2 gửi lại input công cụ đã ghép đủ từ input_json_delta.
    const assistant = (sentBody(fetchImpl, 1).messages as Array<{ content: Block[] }>)[1]!
    expect(assistant.content.find((b) => b.type === 'tool_use')).toMatchObject({ input: {} })
    expect(assistant.content.find((b) => b.type === 'thinking')).toMatchObject({
      signature: 'sig-abc',
    })
  })

  it('model trả rỗng ⇒ unusable empty', async () => {
    const fetchImpl = fakeFetch(jsonResponse(message([thinking])))
    const r = await runAnthropicToolLoop({ ...BASE, executeTool: vi.fn(), fetchImpl })
    expect(r).toMatchObject({ kind: 'unusable', reason: 'empty' })
  })
})

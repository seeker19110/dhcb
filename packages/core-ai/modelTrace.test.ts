// @vitest-environment node
// SDK/parser/adapter thật, chỉ giả biên HTTP; không key thật hoặc mạng ngoài fake.
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CompanionTraceSpan } from '@dhcb/core-contracts/companionTrace'
import { traceCompanionTurn, withTraceStage } from '@dhcb/core-db/turnTrace'
import { callAnthropicText } from './anthropicClient.js'
import { runAnthropicToolLoop } from './anthropicToolLoop.js'
import { getAnthropicRoute } from './aiConfig.js'
import { callGroqChat, callGroqChatWithKeyPool } from './chatProviders.js'
import { callGemini } from './geminiApi.js'
import { __resetGroqKeyRotationForTests } from './groqKeyPool.js'
import { traceModelCall } from './modelTrace.js'

const CANARY = 'SENSITIVE_CANARY_PROMPT_KEY_TOOL_RESULT'
const route = getAnthropicRoute('companion')
const base = {
  apiKey: CANARY,
  route,
  system: CANARY,
  messages: [{ role: 'user', content: CANARY }],
}
const usage = {
  input_tokens: 100,
  output_tokens: 40,
  cache_read_input_tokens: 200,
  cache_creation_input_tokens: 300,
}
function message(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg_sensitive',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5-5',
    content: [{ type: 'text', text: CANARY }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage,
    ...overrides,
  }
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'retry-after-ms': '0' },
  })
}
function fakeFetch(...responses: Array<Response | Error>) {
  const fetcher = vi.fn<typeof fetch>()
  for (const response of responses) {
    if (response instanceof Error) fetcher.mockRejectedValueOnce(response)
    else fetcher.mockResolvedValueOnce(response)
  }
  return fetcher
}
async function traced<T>(action: () => Promise<T>) {
  const events: CompanionTraceSpan[] = []
  let now = 0
  const result = await traceCompanionTurn(action, {
    enabled: true,
    clock: () => now++,
    sink: (event) => {
      events.push(event)
    },
  })
  await vi.waitFor(() => expect(events.some((e) => e.stage === 'turn')).toBe(true), { interval: 5 })
  expect(JSON.stringify(events)).not.toContain(CANARY)
  return {
    result,
    events,
    attempts: events.filter((e) => e.stage === 'http_attempt'),
    root: events.find((e) => e.stage === 'turn')!,
  }
}
function streamEvents(complete = true) {
  const events: Array<Record<string, unknown>> = [
    {
      type: 'message_start',
      message: message({ content: [], stop_reason: null, usage: { ...usage, output_tokens: 0 } }),
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: CANARY } },
    // Các counter là cumulative. Delta lặp không được cộng lại input/cache/output.
    {
      type: 'message_delta',
      delta: { stop_reason: null, stop_sequence: null },
      usage: { ...usage, output_tokens: 20 },
    },
  ]
  if (complete)
    events.push(
      { type: 'content_block_stop', index: 0 },
      { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage },
      { type: 'message_stop' },
    )
  return new Response(
    events.map((e) => `event: ${String(e.type)}\ndata: ${JSON.stringify(e)}\n\n`).join(''),
    {
      headers: { 'content-type': 'text/event-stream' },
    },
  )
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  __resetGroqKeyRotationForTests()
})

describe('Trace ở biên provider thật', () => {
  it('text trắng được logical call đánh dấu lỗi nhưng usage HTTP vẫn giữ nguyên', async () => {
    vi.stubGlobal(
      'fetch',
      fakeFetch(
        json({
          choices: [{ message: { content: '   ' } }],
          usage: { prompt_tokens: 100, completion_tokens: 40 },
        }),
        json({
          candidates: [{ content: { parts: [{ text: '   ' }] } }],
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 40 },
        }),
      ),
    )
    const on = await traced(async () => {
      const groq = await callGroqChat(CANARY, 'llama-3.3-70b-versatile', '', [], 100)
      const gemini = await callGemini(CANARY, 'gemini-3.6-flash', '', [], 100)
      return { groq, gemini }
    })
    expect(on.result.groq).toMatchObject({ kind: 'success', text: '   ' })
    expect(on.result.gemini).toBe('   ')
    expect(on.events.filter((e) => e.stage === 'model_call').map((e) => e.status)).toEqual([
      'error',
      'error',
    ])
    expect(on.attempts.every((e) => e.status === 'success' && e.usage?.state === 'complete')).toBe(
      true,
    )
    expect(on.root.summary?.totalCostUsd).toBe(0.000316)
  })

  it('429 → 200 giữ nguyên hai request SDK, body/header và kết quả; chỉ attempt sở hữu cost', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_792_137_600_000)
    async function run(enabled: boolean) {
      const fetcher = fakeFetch(
        json({ error: { type: 'rate_limit_error', message: CANARY } }, 429),
        json(message()),
      )
      const result = enabled
        ? await traced(() => callAnthropicText({ ...base, fetchImpl: fetcher }))
        : { result: await callAnthropicText({ ...base, fetchImpl: fetcher }) }
      const requests = fetcher.mock.calls.map(([, init]) => ({
        body: init?.body,
        headers: [...new Headers(init?.headers)].filter(
          ([key]) => key !== 'x-stainless-retry-count',
        ),
      }))
      expect(fetcher).toHaveBeenCalledTimes(2)
      return { ...result, requests }
    }
    const off = await run(false)
    const on = await run(true)
    expect(on.result).toEqual(off.result)
    expect(on.requests).toEqual(off.requests)
    if (!('attempts' in on)) throw new Error('TRACE_TEST_MISSING')
    expect(on.attempts.map((e) => [e.attempt, e.httpStatus, e.status])).toEqual([
      [1, 429, 'error'],
      [2, 200, 'success'],
    ])
    expect(on.attempts[0]?.usage?.state).toBe('unknown')
    expect(on.attempts[1]).toMatchObject({
      costUsd: 0.00139,
      usage: {
        state: 'complete',
        promptTokens: 600,
        completionTokens: 40,
        cacheReadTokens: 200,
        cacheWriteTokens: 300,
      },
    })
    expect(on.root.summary).toMatchObject({
      callCount: 2,
      unknownCallCount: 1,
      observedCostUsd: 0.00139,
      totalCostUsd: null,
    })
    const models = on.events.filter((e) => e.stage === 'model_call')
    expect(models).toHaveLength(1)
    expect(on.attempts.every((e) => e.parentSpanId === models[0]?.spanId)).toBe(true)
    expect(
      on.events.filter((e) => e.stage !== 'http_attempt').every((e) => e.costUsd === null),
    ).toBe(true)
  })

  it('stream cumulative và final snapshot chỉ tính một lần, không đổi delta', async () => {
    const fetcher = fakeFetch(streamEvents())
    const deltas: string[] = []
    const on = await traced(() =>
      callAnthropicText({ ...base, fetchImpl: fetcher, onTextDelta: (text) => deltas.push(text) }),
    )
    expect(on.result).toMatchObject({ kind: 'success', text: CANARY })
    expect(deltas).toEqual([CANARY])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(on.attempts).toHaveLength(1)
    expect(on.attempts[0]).toMatchObject({
      costUsd: 0.00139,
      usage: { state: 'complete', promptTokens: 600, completionTokens: 40 },
    })
    expect(on.root.summary?.totalCostUsd).toBe(0.00139)
  })

  it('stream đứt giữ counter partial và cost unknown; không retry sau headers', async () => {
    const fetcher = fakeFetch(streamEvents(false))
    const on = await traced(() =>
      callAnthropicText({ ...base, fetchImpl: fetcher, onTextDelta: () => {} }),
    )
    expect(on.result.kind).toBe('network_error')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(on.attempts[0]).toMatchObject({
      status: 'error',
      costUsd: null,
      usage: { state: 'partial', promptTokens: 600, completionTokens: 20 },
    })
    expect(on.root.summary?.totalCostUsd).toBeNull()
  })

  it.each([
    ['thiếu cache', { input_tokens: 100, output_tokens: 40 }, 'partial', null],
    ['thiếu usage', undefined, 'unknown', null],
    [
      'số 0 thực',
      {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
      'complete',
      0,
    ],
    ['counter sai', { ...usage, input_tokens: -1 }, 'partial', null],
  ])('%s không bị thay bằng usage mặc định', async (_name, raw, state, cost) => {
    const on = await traced(() =>
      callAnthropicText({ ...base, fetchImpl: fakeFetch(json(message({ usage: raw }))) }),
    )
    expect(on.attempts[0]?.usage?.state).toBe(state)
    expect(on.attempts[0]?.costUsd).toBe(cost)
    expect(on.root.summary?.totalCostUsd).toBe(cost)
  })

  it('model lạ không đi vào nhãn/log hoặc được quy giá fallback', async () => {
    const on = await traced(() =>
      callAnthropicText({ ...base, fetchImpl: fakeFetch(json(message({ model: CANARY }))) }),
    )
    expect(on.attempts[0]).toMatchObject({ model: 'unknown', costUsd: null })
    expect(on.root.summary?.totalCostUsd).toBeNull()
  })

  it('hai bước tool chỉ execute một lần và không ghi tên/args/result/proposal vào trace', async () => {
    const fetcher = fakeFetch(
      json(
        message({
          stop_reason: 'tool_use',
          content: [
            { type: 'tool_use', id: CANARY, name: 'propose_canary', input: { secret: CANARY } },
          ],
        }),
      ),
      json(message()),
    )
    const executeTool = vi.fn(async () => ({ content: CANARY, proposalId: CANARY }))
    const on = await traced(() =>
      withTraceStage('synthesis', () =>
        runAnthropicToolLoop({
          ...base,
          fetchImpl: fetcher,
          tools: [
            {
              name: 'propose_canary',
              description: CANARY,
              inputSchema: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false,
              },
            },
          ],
          executeTool,
        }),
      ),
    )
    expect(on.result).toMatchObject({ kind: 'success', steps: 2 })
    expect(executeTool).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(on.attempts.map((e) => e.attempt)).toEqual([1, 1])
    expect(on.events.filter((e) => e.stage === 'model_call')).toHaveLength(2)
    expect(on.events.find((e) => e.stage === 'tool')).toMatchObject({
      toolKind: 'proposal',
      status: 'success',
    })
    expect(on.root.summary).toMatchObject({
      callCount: 2,
      unknownCallCount: 0,
      totalCostUsd: 0.00278,
    })
  })

  it('Groq xoay key/model giữ đủ bốn lần gọi lỗi/thành công trong cùng fallback', async () => {
    vi.stubEnv('GROQ_API_KEY', `${CANARY}1,${CANARY}2`)
    const fetcher = fakeFetch(
      json({}, 429),
      json({}, 401),
      json({}, 503),
      json({
        choices: [{ message: { content: CANARY } }],
        usage: { prompt_tokens: 100, completion_tokens: 40 },
      }),
    )
    vi.stubGlobal('fetch', fetcher)
    // Model thứ hai lỗi 503 sẽ bỏ key còn lại và chuyển model thứ ba.
    const on = await traced(() =>
      withTraceStage('fallback', () =>
        callGroqChatWithKeyPool(
          'llama-3.3-70b-versatile,gpt-4o-mini,llama-3.3-70b-versatile',
          CANARY,
          [],
          100,
        ),
      ),
    )
    expect(on.result.kind).toBe('success')
    expect(fetcher).toHaveBeenCalledTimes(4)
    expect(on.attempts.map((e) => e.httpStatus)).toEqual([429, 401, 503, 200])
    expect(on.attempts.every((e) => e.attempt === 1)).toBe(true)
    expect(on.root.summary).toMatchObject({ callCount: 4, unknownCallCount: 3, totalCostUsd: null })
  })

  it('usage Groq/Gemini còn quan sát được khi text parse lỗi; không đổi callback usage', async () => {
    const fetcher = fakeFetch(
      json({ choices: [], usage: { prompt_tokens: 100, completion_tokens: 40 } }),
      json({ candidates: [], usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 40 } }),
    )
    vi.stubGlobal('fetch', fetcher)
    const callback = vi.fn()
    const on = await traced(async () => {
      const groq = await callGroqChat(CANARY, 'llama-3.3-70b-versatile', CANARY, [], 100)
      await expect(
        callGemini(CANARY, 'gemini-3.6-flash', CANARY, [], 100, undefined, callback),
      ).rejects.toThrow('empty candidates')
      return groq
    })
    expect(on.result.kind).toBe('malformed_body')
    expect(callback).toHaveBeenCalledExactlyOnceWith({
      promptTokens: 100,
      completionTokens: 40,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
    expect(on.attempts.every((e) => e.usage?.state === 'complete')).toBe(true)
    expect(
      on.events.filter((e) => e.stage === 'model_call').every((e) => e.status === 'error'),
    ).toBe(true)
    expect(on.root.summary?.totalCostUsd).toBe(0.000316)
  })

  it('cache Gemini khác công thức Anthropic, giá chưa có và usage rỗng đều giữ unknown cost', async () => {
    vi.stubGlobal(
      'fetch',
      fakeFetch(
        json({
          candidates: [{ content: { parts: [{ text: CANARY }] } }],
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 40,
            cachedContentTokenCount: 60,
          },
        }),
        json({
          choices: [{ message: { content: CANARY } }],
          usage: { prompt_tokens: 100, completion_tokens: 40 },
        }),
        json({ choices: [{ message: { content: CANARY } }], usage: {} }),
      ),
    )
    const on = await traced(async () => {
      await callGemini(CANARY, 'gemini-3.6-flash', CANARY, [], 100)
      await callGroqChat(CANARY, 'openai/gpt-oss-120b', CANARY, [], 100)
      await callGroqChat(CANARY, 'llama-3.3-70b-versatile', CANARY, [], 100)
    })
    expect(on.attempts.every((e) => e.costUsd === null)).toBe(true)
    expect(on.attempts[0]?.usage?.cacheReadTokens).toBe(60)
    expect(on.attempts[2]?.usage?.state).toBe('unknown')
    expect(on.root.summary?.totalCostUsd).toBeNull()
  })

  it('lỗi mạng và sink hỏng giữ số fetch/execute, kết quả và error identity', async () => {
    for (const sink of [
      () => {
        throw new Error(CANARY)
      },
      () => Promise.reject(new Error(CANARY)),
    ]) {
      const fetcher = fakeFetch(json(message()))
      const result = await traceCompanionTurn(
        () => callAnthropicText({ ...base, fetchImpl: fetcher }),
        { enabled: true, sink },
      )
      expect(result).toMatchObject({ kind: 'success', text: CANARY })
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
    const fetcher = fakeFetch(new TypeError(CANARY), new TypeError(CANARY))
    const on = await traced(() => callAnthropicText({ ...base, fetchImpl: fetcher }))
    expect(on.result.kind).toBe('network_error')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(on.attempts.every((e) => e.usage?.state === 'unknown')).toBe(true)
    const error = new Error(CANARY)
    await expect(
      traceCompanionTurn(
        () =>
          traceModelCall('gemini', CANARY, async () => {
            throw error
          }),
        { enabled: true, sink: () => {} },
      ),
    ).rejects.toBe(error)
    await new Promise<void>((resolve) => setImmediate(resolve))
  })
})

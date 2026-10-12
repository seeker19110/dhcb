// embeddings.test.ts — lớp embedding Gemini: body REST đúng tài liệu, tiền tố query/document,
// chuẩn hoá vector, và BẤT BIẾN "hỏng thì trả null, không ném" (ghi/đọc ký ức không được chết
// vì embedding).
import { describe, it, expect, vi, beforeEach } from 'vitest'

const usage = vi.hoisted(() => ({
  recordAiTokenUsage: vi.fn<(...a: unknown[]) => Promise<void>>(),
}))
vi.mock('./aiTokenUsage.js', () => ({
  recordAiTokenUsage: (...a: unknown[]) => usage.recordAiTokenUsage(...a),
}))

import {
  EMBEDDING_DIMENSIONS,
  cosineSimilarity,
  embedForStorage,
  embedQuery,
  getEmbeddingProvider,
  normalizeVector,
  withGeminiTaskPrefix,
} from './embeddings.js'

function vector(fill: number): number[] {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => fill)
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  usage.recordAiTokenUsage.mockReset()
  usage.recordAiTokenUsage.mockResolvedValue(undefined)
})

describe('getEmbeddingProvider', () => {
  it('không có GEMINI_API_KEY → null (chỉ tìm chữ, không lỗi)', () => {
    expect(getEmbeddingProvider({ env: {} })).toBeNull()
    expect(getEmbeddingProvider({ env: { GEMINI_API_KEY: '   ' } })).toBeNull()
  })

  it('có key → provider Gemini, model mặc định gemini-embedding-2, đổi được qua env', () => {
    expect(getEmbeddingProvider({ env: { GEMINI_API_KEY: 'k' } })?.model).toBe('gemini-embedding-2')
    expect(
      getEmbeddingProvider({
        env: { GEMINI_API_KEY: 'k', GEMINI_EMBEDDING_MODEL: 'gemini-embedding-9' },
      })?.model,
    ).toBe('gemini-embedding-9')
  })
})

describe('tiền tố + chuẩn hoá', () => {
  it('query và document dùng đúng tiền tố tài liệu Gemini (không task_type)', () => {
    expect(withGeminiTaskPrefix('thi IELTS', 'query')).toBe(
      'task: search result | query: thi IELTS',
    )
    expect(withGeminiTaskPrefix('Mục tiêu 6.5', 'document')).toBe(
      'title: none | text: Mục tiêu 6.5',
    )
  })

  it('normalizeVector: L2 = 1; vector 0 hoặc NaN → null', () => {
    const n = normalizeVector([3, 4])
    expect(n).toEqual([0.6, 0.8])
    expect(normalizeVector([0, 0])).toBeNull()
    expect(normalizeVector([1, Number.NaN])).toBeNull()
  })

  it('cosineSimilarity: vector chuẩn hoá giống nhau = 1, lệch chiều = 0', () => {
    expect(cosineSimilarity([0.6, 0.8], [0.6, 0.8])).toBeCloseTo(1)
    expect(cosineSimilarity([1, 0], [0, 1, 0])).toBe(0)
  })
})

describe('GeminiEmbeddingProvider.embed', () => {
  it('gửi batchEmbedContents đúng khoá tài liệu, header x-goog-api-key, trả vector đã chuẩn hoá, ghi token', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ embeddings: [{ values: vector(2) }, { values: vector(1) }] }),
    )
    const provider = getEmbeddingProvider({ env: { GEMINI_API_KEY: 'secret' }, fetchImpl })!
    const out = await provider.embed(['một', 'hai'], 'document')

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(String(url)).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents',
    )
    expect((init!.headers as Record<string, string>)['x-goog-api-key']).toBe('secret')
    const body = JSON.parse(String(init!.body)) as {
      requests: Array<{
        model: string
        content: { parts: Array<{ text: string }> }
        output_dimensionality: number
      }>
    }
    expect(body.requests).toHaveLength(2)
    expect(body.requests[0]).toEqual({
      model: 'models/gemini-embedding-2',
      content: { parts: [{ text: 'title: none | text: một' }] },
      output_dimensionality: EMBEDDING_DIMENSIONS,
    })
    // Chuẩn hoá: mọi phần tử bằng nhau → mỗi phần tử = 1/sqrt(768).
    expect(out[0]![0]).toBeCloseTo(1 / Math.sqrt(EMBEDDING_DIMENSIONS))
    expect(out[1]![0]).toBeCloseTo(1 / Math.sqrt(EMBEDDING_DIMENSIONS))
    expect(usage.recordAiTokenUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'gemini',
        model: 'gemini-embedding-2',
        mode: 'embedding',
      }),
    )
  })

  it('HTTP lỗi → toàn null, không ném; body thiếu/lệch chiều → null cho phần tử đó', async () => {
    const bad = getEmbeddingProvider({
      env: { GEMINI_API_KEY: 'k' },
      fetchImpl: vi.fn<typeof fetch>(async () => jsonResponse({ error: 'quota' }, 429)),
    })!
    expect(await bad.embed(['a', 'b'], 'query')).toEqual([null, null])

    const odd = getEmbeddingProvider({
      env: { GEMINI_API_KEY: 'k' },
      fetchImpl: vi.fn<typeof fetch>(async () =>
        jsonResponse({ embeddings: [{ values: [1, 2, 3] }, { values: vector(1) }] }),
      ),
    })!
    const out = await odd.embed(['a', 'b'], 'query')
    expect(out[0]).toBeNull()
    expect(out[1]).not.toBeNull()
  })

  it('timeout → null (AbortController), mạng ném → null', async () => {
    const hang = getEmbeddingProvider({
      env: { GEMINI_API_KEY: 'k' },
      timeoutMs: 5,
      fetchImpl: vi.fn<typeof fetch>(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            )
          }),
      ),
    })!
    expect(await hang.embed(['x'], 'query')).toEqual([null])

    const boom = getEmbeddingProvider({
      env: { GEMINI_API_KEY: 'k' },
      fetchImpl: vi.fn<typeof fetch>(async () => {
        throw new Error('ECONNRESET')
      }),
    })!
    expect(await boom.embed(['x'], 'document')).toEqual([null])
  })
})

describe('embedQuery / embedForStorage', () => {
  it('không provider hoặc chữ rỗng → null; có provider → vector + model', async () => {
    expect(await embedQuery('hỏi', null)).toBeNull()
    const provider = getEmbeddingProvider({
      env: { GEMINI_API_KEY: 'k' },
      fetchImpl: vi.fn<typeof fetch>(async () =>
        jsonResponse({ embeddings: [{ values: vector(1) }] }),
      ),
    })!
    expect(await embedQuery('   ', provider)).toBeNull()
    expect(await embedForStorage('   ', provider)).toBeNull()
    const stored = await embedForStorage('Mục tiêu IELTS 6.5', provider)
    expect(stored?.model).toBe('gemini-embedding-2')
    expect(stored?.vector).toHaveLength(EMBEDDING_DIMENSIONS)
    expect(await embedQuery('IELTS', provider)).toHaveLength(EMBEDDING_DIMENSIONS)
  })
})

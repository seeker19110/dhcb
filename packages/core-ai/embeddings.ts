// packages/core-ai/embeddings.ts — Vector nghĩa (embedding) cho ký ức Bạn Đồng Hành.
//
// Quyết định ADR-0015 (2026-10-11): Anthropic KHÔNG có API embedding; dùng Gemini
// `gemini-embedding-2` (đã có GEMINI_API_KEY), 768 chiều, KHÔNG cài pgvector — cosine tính trong
// Node trên vài trăm vector của một người. Lớp này là `EmbeddingProvider` trừu tượng: đổi sang
// Voyage sau chỉ là thêm một adapter, memoryService/memoryRetrieval không đổi.
//
// Bất biến: hỏng ở đây KHÔNG BAO GIỜ làm hỏng ghi/đọc ký ức — mọi lỗi (không key, timeout, HTTP
// lỗi, body lạ) đều trả `null`, nơi gọi coi như "chưa có vector" và chỉ tìm chữ.
//
// Tài liệu Gemini (ai.google.dev/gemini-api/docs/embeddings, đọc 2026-10-11): REST
// `models/{model}:batchEmbedContents`, body `{ requests: [{ model, content: { parts: [{ text }] },
// output_dimensionality }] }`, header `x-goog-api-key`; trả `{ embeddings: [{ values }] }`.
// gemini-embedding-2 KHÔNG nhận `task_type` — thay bằng tiền tố trong chữ:
//   truy vấn:  "task: search result | query: {content}"
//   tài liệu:  "title: none | text: {content}"      (không có tiêu đề thì ghi `none`)
// Model tự chuẩn hoá vector khi cắt chiều (768); vẫn chuẩn hoá lại ở đây cho chắc (cosine = dot).

import { recordAiTokenUsage } from './aiTokenUsage.js'
import { traceModelCall, type ModelTrace } from './modelTrace.js'

export const EMBEDDING_DIMENSIONS = 768
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-2'
/** Gemini giới hạn 8 192 token/đầu vào; ký ức ≤ 2 000 ký tự nên không bao giờ chạm. */
export const EMBEDDING_MAX_CHARS = 8_000
export const EMBEDDING_TIMEOUT_MS = 8_000
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

export type EmbeddingKind = 'query' | 'document'

export interface EmbeddingProvider {
  /** Tên model đã dùng — ghi vào `memory_records.embedding_model` để job bù biết vector nào cũ. */
  readonly model: string
  /** Một vector cho mỗi text, cùng thứ tự; phần tử `null` khi text đó không embed được. */
  embed(texts: string[], kind: EmbeddingKind): Promise<Array<number[] | null>>
}

export interface EmbeddingProviderOptions {
  env?: NodeJS.ProcessEnv
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

/** Tiền tố theo tài liệu Gemini cho bài toán tìm kiếm bất đối xứng (query ≠ document). */
export function withGeminiTaskPrefix(text: string, kind: EmbeddingKind): string {
  const content = text.slice(0, EMBEDDING_MAX_CHARS)
  return kind === 'query'
    ? `task: search result | query: ${content}`
    : `title: none | text: ${content}`
}

/** Chuẩn hoá L2 — vector 0 (hoặc NaN) trả về `null` vì không so được. */
export function normalizeVector(values: number[]): number[] | null {
  let sum = 0
  for (const v of values) {
    if (!Number.isFinite(v)) return null
    sum += v * v
  }
  if (sum <= 0) return null
  const norm = Math.sqrt(sum)
  return values.map((v) => v / norm)
}

/** Cosine của hai vector ĐÃ chuẩn hoá = tích vô hướng; lệch chiều → 0 (không so được). */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!
  return dot
}

/** Ước lượng token để ghi chi phí — Gemini embedding không trả usage. ~4 ký tự/token. */
function estimateEmbeddingTokens(texts: string[]): number {
  return texts.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0)
}

function readEmbeddings(body: unknown, expected: number): Array<number[] | null> {
  const list =
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as { embeddings?: unknown }).embeddings)
      ? ((body as { embeddings: unknown[] }).embeddings as unknown[])
      : []
  const out: Array<number[] | null> = []
  for (let i = 0; i < expected; i++) {
    const item = list[i]
    const values =
      typeof item === 'object' &&
      item !== null &&
      Array.isArray((item as { values?: unknown }).values)
        ? ((item as { values: unknown[] }).values as unknown[])
        : null
    if (
      !values ||
      values.length !== EMBEDDING_DIMENSIONS ||
      !values.every((v) => typeof v === 'number')
    ) {
      out.push(null)
      continue
    }
    out.push(normalizeVector(values as number[]))
  }
  return out
}

class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly model: string
  private readonly apiKey: string
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number

  constructor(apiKey: string, model: string, fetchImpl: typeof fetch, timeoutMs: number) {
    this.apiKey = apiKey
    this.model = model
    this.fetchImpl = fetchImpl
    this.timeoutMs = timeoutMs
  }

  async embed(texts: string[], kind: EmbeddingKind): Promise<Array<number[] | null>> {
    if (texts.length === 0) return []
    return traceModelCall(
      'gemini',
      this.model,
      (observer) => this.embedObserved(texts, kind, observer),
      // Batch chỉ thành công logic khi mọi vector yêu cầu đều dùng được.
      (vectors) => vectors.every((vector) => vector !== null),
    )
  }

  private async embedObserved(
    texts: string[],
    kind: EmbeddingKind,
    observer: ModelTrace | undefined,
  ): Promise<Array<number[] | null>> {
    const prefixed = texts.map((t) => withGeminiTaskPrefix(t, kind))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const attempt = observer?.begin()
      const res = await this.fetchImpl(`${GEMINI_ENDPOINT}/${this.model}:batchEmbedContents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          requests: prefixed.map((text) => ({
            model: `models/${this.model}`,
            content: { parts: [{ text }] },
            output_dimensionality: EMBEDDING_DIMENSIONS,
          })),
        }),
        signal: controller.signal,
      })
      observer?.headers(res, attempt)
      if (!res.ok) {
        console.warn(`[embeddings] Gemini trả HTTP ${res.status} — bỏ qua vector lượt này`)
        return texts.map(() => null)
      }
      const body: unknown = await res.json()
      observer?.response(body)
      // Ghi chi phí (ước lượng) để nhìn thấy trong bảng token, mode riêng `embedding`.
      void recordAiTokenUsage({
        provider: 'gemini',
        model: this.model,
        mode: 'embedding',
        usage: {
          promptTokens: estimateEmbeddingTokens(prefixed),
          completionTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
      })
      return readEmbeddings(body, texts.length)
    } catch (err) {
      observer?.fail()
      const reason = err instanceof Error ? err.name : String(err)
      console.warn(`[embeddings] Gemini lỗi (${reason}) — bỏ qua vector lượt này`)
      return texts.map(() => null)
    } finally {
      clearTimeout(timer)
    }
  }
}

/** `null` khi chưa cấu hình GEMINI_API_KEY — nơi gọi phải chịu được (chỉ tìm chữ). */
export function getEmbeddingProvider(
  options: EmbeddingProviderOptions = {},
): EmbeddingProvider | null {
  const env = options.env ?? process.env
  const apiKey = env.GEMINI_API_KEY?.trim()
  if (!apiKey) return null
  const model = env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_GEMINI_EMBEDDING_MODEL
  return new GeminiEmbeddingProvider(
    apiKey,
    model,
    options.fetchImpl ?? fetch,
    options.timeoutMs ?? EMBEDDING_TIMEOUT_MS,
  )
}

/** Vector cho câu hỏi của người dùng (tìm kiếm). `null` khi không có provider hoặc lỗi. */
export async function embedQuery(
  text: string,
  provider: EmbeddingProvider | null = getEmbeddingProvider(),
): Promise<number[] | null> {
  if (!provider || !text.trim()) return null
  const [vector] = await provider.embed([text], 'query')
  return vector ?? null
}

/** Vector cho một ký ức lúc ghi/sửa — kèm tên model để lưu cạnh vector. */
export async function embedForStorage(
  text: string,
  provider: EmbeddingProvider | null = getEmbeddingProvider(),
): Promise<{ vector: number[]; model: string } | null> {
  if (!provider || !text.trim()) return null
  const [vector] = await provider.embed([text], 'document')
  return vector ? { vector, model: provider.model } : null
}

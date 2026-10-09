// packages/core-ai/chatProviders.ts — Lời gọi HTTP thô tới Groq (nhà cung cấp chat dự phòng),
// tách khỏi logic điều phối/fallback/hoàn lượt ở packages/core-ai/ai.ts. Anthropic (AI chính)
// gọi qua SDK chính thức ở anthropicClient.ts (2026-10-09).
//
// Phase 01 "Foundation OS" mục 3 (docs/phases/01-foundation-os.md): "AIProvider.generate() gateway
// với timeout, phân loại lỗi retry". Gemini đã có sẵn dạng này (api/_lib/geminiApi.ts#callGemini) —
// file này lấp nốt Groq/Anthropic, 2 provider vẫn đang gọi `fetch` thẳng trong `ai.ts`.
//
// ─── CỐ Ý CHỈ TÁCH PHẦN GỌI HTTP + PHÂN LOẠI LỖI, KHÔNG TÁCH LOGIC QUYẾT ĐỊNH ─────────────────
// `ai.ts` xử lý đếm lượt/hoàn tiền thật (`checkAndConsumeUsage`/`refundUsage`) và có 34 test ghim
// chặt hành vi (thứ tự fallback Anthropic→Groq→Gemini, khi nào hoàn lượt, status trả về client).
// Rút cả logic đó ra khỏi handler trong 1 lần đổi là rủi ro cao — sai một nhánh là mất tiền hoặc
// hoàn lượt sai. Nên ranh giới ở đây dừng lại đúng chỗ: mỗi hàm CHỈ gọi HTTP tới 1 provider rồi trả
// về một trong 4 dạng kết quả rõ ràng (thành công / lỗi mạng-timeout / lỗi HTTP / body sai cấu
// trúc) — `ai.ts` giữ NGUYÊN 100% cách nó đọc 4 dạng đó để quyết định fallback/hoàn lượt/status.
// Xác minh: sau khi refactor `ai.ts` dùng các hàm này, toàn bộ `ai.test.ts` (34 ca, không sửa 1
// dòng) vẫn xanh — bằng chứng hành vi observable không đổi.

import { fetchWithTimeout } from '@dhcb/core-http/fetchTimeout'
import { parseGroqUsage, type AiTokenUsage } from './aiTokenUsage.js'
import {
  groqKeyPool,
  groqModelPool,
  isSkippableGroqKeyError,
  nextGroqKeyStartIndex,
} from './groqKeyPool.js'

export const CHAT_PROVIDER_TIMEOUT_MS = 30_000

/** Kết quả gọi 1 provider chat — 4 dạng loại trừ lẫn nhau, luôn kèm latency để log. */
export type ChatCallResult =
  // `usage` = token THẬT do Groq trả về (mục N4) — null khi body không có khối `usage`.
  // `model` = model ĐÃ THỰC SỰ dùng: bể model có thể xoay vòng sang model khác khi model đầu
  // lỗi, nên caller KHÔNG được lấy GROQ_CHAT_MODEL để tính giá (sẽ tính nhầm bảng giá).
  // Cả hai chỉ để ĐO CHI PHÍ, không ảnh hưởng nhánh fallback/hoàn lượt của ai.ts.
  | { kind: 'success'; text: string; latencyMs: number; usage: AiTokenUsage | null; model: string }
  | { kind: 'network_error'; message: string; latencyMs: number }
  | { kind: 'http_error'; status: number; bodyText: string; latencyMs: number }
  | { kind: 'malformed_body'; message: string; latencyMs: number }

// Đọc text trả lời từ body JSON của Groq (chuẩn OpenAI: choices[0].message.content).
// Chuyển từ ai.ts nguyên vẹn — chỉ đổi vị trí, không đổi 1 dòng logic.
function parseGroqText(groqData: unknown): string {
  if (!groqData || typeof groqData !== 'object' || !('choices' in groqData)) {
    throw new Error('Groq API returned invalid response structure')
  }
  const choices = (groqData as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('Groq API returned empty choices')
  }
  const choice = choices[0]
  if (typeof choice !== 'object' || !choice || !('message' in choice)) {
    throw new Error('Groq API returned invalid choice structure')
  }
  const message = (choice as { message?: unknown }).message
  if (typeof message !== 'object' || !message || !('content' in message)) {
    throw new Error('Groq API returned invalid message structure')
  }
  const text = (message as { content?: unknown }).content
  if (typeof text !== 'string') {
    throw new Error('Groq API returned non-string content')
  }
  return text
}

/**
 * Gọi Groq chat completion (chuẩn OpenAI). `system` (nếu có) được ghép thành 1 message
 * `role: 'system'` ở đầu — đúng cách `ai.ts` đang ghép trước khi refactor.
 */
export async function callGroqChat(
  apiKey: string,
  model: string,
  system: string,
  messages: unknown[],
  maxTokens: number,
  timeoutMs: number = CHAT_PROVIDER_TIMEOUT_MS,
): Promise<ChatCallResult> {
  const groqMessages = [...(system ? [{ role: 'system', content: system }] : []), ...messages]
  const startedAt = Date.now()

  let resp: Response
  try {
    resp = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages: groqMessages }),
      },
      timeoutMs,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { kind: 'network_error', message, latencyMs: Date.now() - startedAt }
  }

  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => '')
    return { kind: 'http_error', status: resp.status, bodyText, latencyMs: Date.now() - startedAt }
  }

  try {
    // Đọc body MỘT lần rồi rút cả text lẫn usage — Response body chỉ đọc được 1 lượt.
    const body = await resp.json()
    const text = parseGroqText(body)
    return {
      kind: 'success',
      text,
      latencyMs: Date.now() - startedAt,
      usage: parseGroqUsage(body),
      model,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { kind: 'malformed_body', message, latencyMs: Date.now() - startedAt }
  }
}

/**
 * Gọi Groq xoay vòng qua toàn bộ model (GROQ_CHAT_MODEL / danh sách model phân cách bởi dấu phẩy)
 * và toàn bộ key trong GROQ_API_KEY (hỗ trợ nhiều key cách nhau dấu phẩy/xuống dòng — xem groqKeyPool.ts).
 * Khi 1 key lỗi do CHÍNH nó (401 key sai/bị revoke, 429 hết hạn mức) → thử key kế tiếp trong bể.
 * Khi 1 model lỗi (400/404 model_not_found, hoặc toàn bộ key của model đều lỗi) → tự động chuyển sang model kế tiếp trong bể model.
 */
export async function callGroqChatWithKeyPool(
  model: string,
  system: string,
  messages: unknown[],
  maxTokens: number,
  timeoutMs: number = CHAT_PROVIDER_TIMEOUT_MS,
): Promise<ChatCallResult> {
  const pool = groqKeyPool()
  if (pool.length === 0) {
    return {
      kind: 'network_error',
      message: 'Server chưa cấu hình GROQ_API_KEY',
      latencyMs: 0,
    }
  }

  const models = groqModelPool(model)
  const startIndex = nextGroqKeyStartIndex(pool.length)

  let lastResult: ChatCallResult = {
    kind: 'network_error',
    message: 'Server chưa cấu hình GROQ_API_KEY',
    latencyMs: 0,
  }

  for (const currentModel of models) {
    for (let i = 0; i < pool.length; i++) {
      const apiKey = pool[(startIndex + i) % pool.length]!
      lastResult = await callGroqChat(apiKey, currentModel, system, messages, maxTokens, timeoutMs)

      if (lastResult.kind === 'success') {
        return lastResult
      }

      // Nếu lỗi do key (401/429), thử key kế tiếp cho cùng model này
      if (lastResult.kind === 'http_error' && isSkippableGroqKeyError(lastResult.status)) {
        continue
      }

      // Nếu lỗi khác (model_not_found 400/404, 5xx, v.v.), chuyển sang thử model kế tiếp trong pool
      break
    }
  }

  return lastResult
}

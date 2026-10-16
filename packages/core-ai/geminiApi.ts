// Gọi Google Gemini API
// Tương tự Groq/Anthropic, nhưng dùng endpoint Google Generative AI

import { fetchWithTimeout } from '@dhcb/core-http/fetchTimeout'
import { parseGeminiUsage, type AiTokenUsage } from './aiTokenUsage.js'
import { traceModelCall, type ModelTrace } from './modelTrace.js'

// Thời gian chờ tối đa cho 1 lần gọi AI (ms) — tránh treo vô hạn khi nhà cung cấp chậm.
const AI_TIMEOUT_MS = 30_000

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
    finishReason?: string
  }>
  error?: {
    message?: string
  }
  // Token THẬT Gemini báo về (mục N4) — đọc qua tham số `onUsage` của callGemini().
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
  }
}

export async function callGemini(
  apiKey: string,
  model: string,
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens: number,
  cachedContent?: string,
  // Tuỳ chọn: nhận token THẬT của lượt gọi này để ghi chi phí (mục N4). CỐ Ý là callback
  // thay vì đổi kiểu trả về — 3 nơi đang gọi callGemini() chỉ cần text, giữ nguyên không sửa.
  onUsage?: (usage: AiTokenUsage | null) => void,
): Promise<string> {
  return traceModelCall(
    'gemini',
    model,
    (observer) =>
      callGeminiObserved(
        [apiKey, model, system, messages, maxTokens, cachedContent, onUsage],
        observer,
      ),
    (text) => Boolean(text.trim()),
  )
}

async function callGeminiObserved(
  args: Parameters<typeof callGemini>,
  observer: ModelTrace | undefined,
): Promise<string> {
  const [apiKey, model, system, messages, maxTokens, cachedContent, onUsage] = args
  // Chuyển đổi từ format chung sang Gemini format
  const geminiMessages: GeminiMessage[] = []

  // Thêm messages từ client (convert role: 'user' → 'user', 'assistant' → 'model')
  for (const msg of messages) {
    geminiMessages.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })
  }

  const payload: Record<string, unknown> = {
    contents: geminiMessages,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7, // Cân bằng giữa creativity & consistency
    },
  }

  // Google Gemini API v1beta hỗ trợ systemInstruction chính thức và tự động caching
  if (system) {
    payload.systemInstruction = {
      parts: [{ text: system }],
    }
  }

  if (cachedContent) {
    payload.cachedContent = cachedContent
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const attempt = observer?.begin()
  const resp = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    AI_TIMEOUT_MS,
  )
  observer?.headers(resp, attempt)

  if (!resp.ok) {
    const errorText = await resp.text()
    throw new Error(`Gemini API error (${resp.status}): ${errorText.slice(0, 200)}`)
  }

  const data = (await resp.json()) as GeminiResponse
  observer?.response(data)

  // Báo usage NGAY khi có body hợp lệ — trước cả khi kiểm lỗi nội dung: Gemini đã tính tiền
  // token cho lượt này rồi, kể cả khi phần text trả về rỗng/lỗi.
  if (onUsage) onUsage(parseGeminiUsage(data))

  // Parse response
  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API returned empty candidates')
  }

  const candidate = data.candidates[0]
  if (!candidate) {
    throw new Error('Gemini API returned empty candidates')
  }
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('Gemini API returned empty content')
  }

  const text = candidate.content.parts[0]?.text
  if (!text) {
    throw new Error('Gemini API returned empty text')
  }

  return text
}

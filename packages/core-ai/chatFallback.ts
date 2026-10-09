// packages/core-ai/chatFallback.ts — Sinh MỘT đoạn văn bản bằng AI, thử lần lượt
// Anthropic (model theo nhiệm vụ) → Groq → Gemini, tự ghi token đã dùng (mục N4).
//
// VÌ SAO TÁCH RA: sau khi vá 2 chỗ "AI giả" ngày 2026-08-23 (Đấu trường Tranh biện và
// Socratic Moderator phòng học nhóm), cả hai đều cần ĐÚNG chuỗi dự phòng này. Chép đôi đoạn
// ~60 dòng gọi provider là chỗ dễ lệch nhất về sau (sửa một bên quên bên kia — đúng loại lỗi
// CLAUDE.md mục 4 cấm). `ai.ts` và `companionRuntime.ts` KHÔNG dùng file này vì chúng còn phải
// tự quyết hoàn lượt/forward status gốc theo từng nhánh lỗi — gộp vào đây sẽ làm mất thông tin.
//
// Trả `null` khi KHÔNG provider nào dùng được → caller tự quyết nói thật với người dùng
// (vd gắn cờ isFallback) thay vì âm thầm đưa nội dung mẫu ra như thể AI vừa nghĩ.

import { callGroqChatWithKeyPool } from './chatProviders.js'
import { callAnthropicText } from './anthropicClient.js'
import { callGemini } from './geminiApi.js'
import { GEMINI_CHAT_MODEL, GROQ_CHAT_MODEL, getAnthropicRoute, type AiTask } from './aiConfig.js'
import { recordAiTokenUsage, type AiTokenUsage } from './aiTokenUsage.js'
import type { JsonSchema } from './jsonSchema.js'

export async function generateChatText(params: {
  system: string
  userMessage: string
  /** Trần token cho Groq/Gemini. Nhánh Anthropic dùng trần theo nhiệm vụ (aiConfig.ts). */
  maxTokens: number
  /** Nhãn chế độ để tách chi phí trên dashboard admin (vd 'debate', 'co-learning'). */
  mode: string
  /** Nhiệm vụ → server chọn model Claude phù hợp (Haiku cho việc nhanh, Sonnet cho việc cần đúng). */
  task: AiTask
  /**
   * Ép Claude trả JSON đúng khuôn (structured outputs). Chỉ áp cho nhánh Anthropic — Groq/Gemini
   * không bị ép nên caller VẪN phải tự kiểm đầu ra như cũ.
   */
  outputSchema?: JsonSchema
}): Promise<string | null> {
  const { system, userMessage, maxTokens, mode, task, outputSchema } = params
  const messages = [{ role: 'user', content: userMessage }]

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    const res = await callAnthropicText({
      apiKey: anthropicKey,
      route: getAnthropicRoute(task),
      system,
      messages,
      outputSchema,
    })
    // Token đã bị tính tiền cả khi response không dùng được (bị cắt/từ chối) → ghi trước.
    if (res.kind === 'success' || res.kind === 'unusable') {
      void recordAiTokenUsage({ provider: 'anthropic', model: res.model, mode, usage: res.usage })
    }
    if (res.kind === 'success') return res.text
    // thất bại → thử provider kế tiếp
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const res = await callGroqChatWithKeyPool(GROQ_CHAT_MODEL, system, messages, maxTokens)
      if (res.kind === 'success' && res.text.trim()) {
        void recordAiTokenUsage({ provider: 'groq', model: res.model, mode, usage: res.usage })
        return res.text.trim()
      }
    } catch {
      // thử provider kế tiếp
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    let usage: AiTokenUsage | null = null
    try {
      const text = await callGemini(
        geminiKey,
        GEMINI_CHAT_MODEL,
        system,
        messages as Array<{ role: 'user' | 'assistant'; content: string }>,
        maxTokens,
        undefined,
        (u) => {
          usage = u
        },
      )
      // Gemini đã tính tiền token ngay khi trả body hợp lệ, kể cả khi text rỗng → ghi trước.
      void recordAiTokenUsage({ provider: 'gemini', model: GEMINI_CHAT_MODEL, mode, usage })
      if (text && text.trim()) return text.trim()
    } catch {
      // hết provider
    }
  }

  return null
}

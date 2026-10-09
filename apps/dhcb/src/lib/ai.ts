// Gọi AI qua /api/agent — KHÔNG gửi API key từ browser.
// API key được giữ ở server: vite.config.ts (lúc dev) hoặc api/ai.ts (lúc deploy lên VPS).
// Server chọn nhà cung cấp (Anthropic chính → Groq → Gemini dự phòng) và chọn MODEL theo
// nhiệm vụ (`task`) — frontend không gửi tên model.

import type { GradingSchemaName } from '@dhcb/core-ai/gradingSchemas'
import { getAuthHeader } from '@core/authHeader'
import { captureException } from './errorTracking'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

// mode: cho server biết đây là lượt chat / viết / nói để đếm đúng cột giới hạn.
export type CallMode = 'chat' | 'writing' | 'speaking'

// task: cho server biết đây là lượt TRÒ CHUYỆN (cần nhanh → model nhẹ) hay CHẤM ĐIỂM/NHẬN XÉT
// (cần đúng → model mạnh hơn). Khớp CLIENT_AI_TASKS ở packages/core-ai/aiConfig.ts. Bỏ trống thì
// server tự suy: mode 'writing' → 'grade', còn lại → 'converse'.
export type CallTask = 'converse' | 'grade'

// outputSchema: TÊN khuôn JSON của lượt chấm điểm (vd 'writing_eval'). Server tra schema thật ở
// packages/core-ai/gradingSchemas.ts và bắt Claude trả JSON đúng khuôn (structured outputs).
// Frontend vẫn tự kiểm JSON — nhà cung cấp dự phòng (Groq/Gemini) không bị ràng buộc schema.
export type { GradingSchemaName }

// Thông điệp chung khi phản hồi AI sai định dạng hoặc mạng lỗi — song ngữ (không cần biết
// `dir` ở tầng này) để người học A1 vẫn hiểu cần làm gì tiếp, thay vì lỗi kỹ thuật tiếng Anh
// thuần ("Invalid API response: missing content") không có hành động rõ ràng đi kèm.
// Chi tiết kỹ thuật vẫn console.warn + gửi Sentry (nếu đã bật DSN) để debug được.
const FRIENDLY_INVALID_RESPONSE =
  'Phản hồi từ AI bị lỗi định dạng, vui lòng thử lại. / Invalid AI response, please try again.'
const FRIENDLY_NETWORK_ERROR =
  'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại. / Network error — check your connection and try again.'

function reportAndThrow(friendlyMessage: string, technicalDetail: unknown): never {
  console.warn('callClaude:', technicalDetail)
  void captureException(technicalDetail, { where: 'callClaude' })
  throw new Error(friendlyMessage)
}

export async function callClaude(
  messages: ClaudeMessage[],
  system: string,
  maxTokens = 1024,
  mode: CallMode = 'chat',
  task?: CallTask,
  outputSchema?: GradingSchemaName,
): Promise<string> {
  // /api/agent: lúc "npm run dev" được vite.config.ts proxy thẳng tới Anthropic (key đọc từ .env phía server);
  // lúc deploy lên Vercel, route này do api/claude.ts (serverless function) xử lý.
  const authHeader = await getAuthHeader()
  let resp: Response
  try {
    resp = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeader },
      body: JSON.stringify({
        max_tokens: maxTokens,
        system,
        messages,
        mode,
        task,
        output_schema: outputSchema,
      }),
    })
  } catch (e) {
    return reportAndThrow(FRIENDLY_NETWORK_ERROR, e)
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    // Server (api/ai.ts) đã trả message song ngữ/thân thiện cho các lỗi thường gặp (hết lượt,
    // quá tải, chưa đăng nhập...) — giữ nguyên nếu có; chỉ dùng thông điệp chung khi server
    // không trả được message nào (vd lỗi hạ tầng ngoài dự kiến).
    const serverMsg = (err as { error?: { message?: string } }).error?.message
    if (serverMsg) throw new Error(serverMsg)
    return reportAndThrow(FRIENDLY_NETWORK_ERROR, { status: resp.status })
  }

  const data = (await resp.json()) as unknown
  if (!data || typeof data !== 'object' || !('content' in data)) {
    return reportAndThrow(FRIENDLY_INVALID_RESPONSE, { reason: 'missing content', data })
  }
  const content = (data as { content?: unknown }).content
  if (!Array.isArray(content) || content.length === 0) {
    return reportAndThrow(FRIENDLY_INVALID_RESPONSE, { reason: 'empty content array', data })
  }
  // Đọc khối `type: 'text'` đầu tiên, KHÔNG đọc theo vị trí: model Claude đời mới có thể trả
  // khối `thinking` đứng trước câu trả lời (server đã lọc, đây là lớp phòng thủ thứ hai).
  const textBlock = content.find(
    (b): b is { type: 'text'; text: unknown } =>
      typeof b === 'object' && b !== null && (b as { type?: unknown }).type === 'text',
  )
  const text = (textBlock ?? (content[0] as { text?: unknown })).text
  if (typeof text !== 'string') {
    return reportAndThrow(FRIENDLY_INVALID_RESPONSE, { reason: 'non-string text', data })
  }
  return text
}

// Kiểm tra `v` là object có đủ các khoá trong `keys`, mỗi khoá kiểu number — dùng để
// validate dữ liệu chấm điểm AI trả về trước khi tin tưởng render. `parseJson` chỉ đảm bảo
// JSON hợp lệ cú pháp, KHÔNG đảm bảo đúng shape — AI có thể bỏ sót trường dù đã yêu cầu
// trong prompt, và render thẳng field bị thiếu (VD `scores.overall`) sẽ crash trắng trang
// (TypeError, mất luôn cả phiên hội thoại đang mở).
export function hasNumberFields(v: unknown, keys: string[]): boolean {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return keys.every((k) => typeof o[k] === 'number')
}

// Trích xuất JSON từ câu trả lời (AI đôi khi bọc thêm markdown ``` hoặc lỡ thêm
// câu chữ thừa trước/sau khối JSON, vd "Ok! { ... }") — thử parse thẳng trước,
// nếu lỗi thì thử cắt lấy phần từ dấu "{" đầu tiên tới dấu "}" cuối cùng.
export function parseJson<T>(text: string): T | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T
    } catch {
      return null
    }
  }
}

// api/_lib/aiConfig.ts — hằng số dùng chung cho lời gọi AI hội thoại.
//
// Tách khỏi api/ai.ts để cả handler production LẪN script đánh giá offline
// (scripts/eval-tutor.ts) dùng ĐÚNG một nguồn: cùng model, cùng guardrail.
// Nếu để mỗi nơi khai báo riêng, đổi model ở handler mà quên sửa script → eval
// đo nhầm model, số liệu vô nghĩa (đúng vấn đề ⑤ T1 muốn tránh: "đổi mù").

// ─── PHÂN CHIA MODEL CLAUDE THEO NHIỆM VỤ (2026-10-09) ───────────────────────────────────────
// Model Anthropic do SERVER quyết định theo NHIỆM VỤ, không tin client (tránh gọi model đắt).
// Hai bậc:
//   • FAST  = Claude Haiku 5.5  ($0.10 / $0.50 mỗi 1M token vào/ra) — trò chuyện, luyện nói,
//     tranh biện: cần nhanh (giọng nói chờ từng giây) và rẻ (nhiều lượt nhất).
//   • SMART = Claude Sonnet 5.5 ($2 / $10 mỗi 1M token) — chấm điểm, Companion, góp ý code,
//     Action Canvas: cần chính xác, ít sai; số lượt ít hơn nhiều nên tổng tiền vẫn thấp.
// Đổi model không cần sửa code: đặt ANTHROPIC_FAST_MODEL / ANTHROPIC_SMART_MODEL trong .env.
//
// `effort` = mức "nghĩ" của model (low/medium/high). Model Claude đời mới LUÔN tự suy nghĩ trước
// khi trả lời (adaptive thinking) và phần nghĩ CŨNG TÍNH vào `max_tokens` — vì vậy `maxTokens`
// ở đây rộng hơn độ dài câu trả lời thật để không bị cắt cụt giữa chừng (cắt cụt = lỗi định dạng
// JSON khi chấm điểm). Tiền tính theo token THẬT dùng, không theo trần.
//
// `timeoutMs`: Nginx cắt request /api/ sau 60 giây (nginx/en-vi.conf `proxy_read_timeout 60s`).
// Anthropic phải dừng SỚM hơn mốc đó để còn kịp chuyển sang Groq/Gemini dự phòng.
export const DEFAULT_ANTHROPIC_FAST_MODEL = 'claude-haiku-5-5'
export const DEFAULT_ANTHROPIC_SMART_MODEL = 'claude-sonnet-5-5'

/** Nhiệm vụ AI — server chọn model/effort/trần token theo đây. */
export type AiTask =
  'converse' | 'grade' | 'companion' | 'code_feedback' | 'action_canvas' | 'debate'

/** Nhiệm vụ mà CLIENT được phép xin qua /api/agent (các nhiệm vụ còn lại chỉ server tự gọi). */
export const CLIENT_AI_TASKS: ReadonlySet<AiTask> = new Set<AiTask>(['converse', 'grade'])

export function isClientAiTask(v: unknown): v is 'converse' | 'grade' {
  return typeof v === 'string' && CLIENT_AI_TASKS.has(v as AiTask)
}

export interface AnthropicRoute {
  model: string
  effort: 'low' | 'medium' | 'high'
  maxTokens: number
  timeoutMs: number
}

type Tier = 'fast' | 'smart'

const ROUTE_TABLE: Record<AiTask, { tier: Tier } & Omit<AnthropicRoute, 'model'>> = {
  // Gia sư trò chuyện + luyện nói: trả lời ngắn, cần nhanh → Haiku, nghĩ ít.
  converse: { tier: 'fast', effort: 'low', maxTokens: 4096, timeoutMs: 25_000 },
  // Chấm bài viết / chấm cuối phiên (kiểu IELTS): cần đúng → Sonnet, nghĩ vừa.
  grade: { tier: 'smart', effort: 'medium', maxTokens: 12_000, timeoutMs: 45_000 },
  // Companion "Bạn Đồng Hành": đọc nhiều ngữ cảnh cá nhân, cần tinh tế → Sonnet, nghĩ ít.
  companion: { tier: 'smart', effort: 'low', maxTokens: 6144, timeoutMs: 30_000 },
  // Góp ý code môn Lập trình: không được lộ lời giải, phải đúng → Sonnet, nghĩ vừa.
  code_feedback: { tier: 'smart', effort: 'medium', maxTokens: 8192, timeoutMs: 40_000 },
  // Action Canvas (phân rã mục tiêu, trả JSON): cần đúng cấu trúc → Sonnet, nghĩ vừa.
  action_canvas: { tier: 'smart', effort: 'medium', maxTokens: 8192, timeoutMs: 40_000 },
  // Đối thủ tranh biện AI: câu ngắn, nhiều lượt → Haiku.
  debate: { tier: 'fast', effort: 'low', maxTokens: 3072, timeoutMs: 25_000 },
}

// Đọc env LÚC GỌI (không phải lúc import) — test đổi env được, và PM2 reload đọc giá trị mới.
// Chuỗi rỗng/toàn khoảng trắng coi như không đặt (đặt nhầm `ANTHROPIC_FAST_MODEL=` không được
// làm request gửi model rỗng → 400 mọi lượt).
function modelForTier(tier: Tier): string {
  const raw = tier === 'fast' ? process.env.ANTHROPIC_FAST_MODEL : process.env.ANTHROPIC_SMART_MODEL
  const trimmed = raw?.trim()
  if (trimmed) return trimmed
  return tier === 'fast' ? DEFAULT_ANTHROPIC_FAST_MODEL : DEFAULT_ANTHROPIC_SMART_MODEL
}

/** Model + tham số Anthropic cho một nhiệm vụ. */
export function getAnthropicRoute(task: AiTask): AnthropicRoute {
  const { tier, ...rest } = ROUTE_TABLE[task]
  return { model: modelForTier(tier), ...rest }
}

// Model chat của Gemini (fallback thứ 3 sau Groq/Anthropic — xem thứ tự thật trong ai.ts).
// Đổi qua biến môi trường GEMINI_MODEL.
// [2026-08-24] Đổi mặc định từ 'gemini-2.0-flash' — Google đã gỡ hẳn model này (xác nhận qua lỗi
// 404 THẬT khi chạy `npm run eval:tutor` trên VPS production: "This model models/gemini-2.0-flash
// is no longer available. Please update your code to use models/gemini-3.6-flash"). Cùng dòng
// deprecation ghi ở packages/core-contracts/geminiLive.ts (2026-08-23: "Gemini 2.0 Flash NGỪNG
// PHỤC VỤ 31/03/2026") nhưng bản vá đó chỉ sửa Gemini Live, BỎ SÓT model chat text này.
// Đây là vá khẩn cấp do NHÀ CUNG CẤP gỡ model (không phải đổi ý thích chủ quan) — CHƯA chạy lại
// được `npm run eval:tutor` để so baseline sau khi đổi (môi trường sửa lỗi không có key AI thật,
// đúng tình huống ghi ở GROQ_CHAT_MODEL bên dưới). Cần người có key thật chạy
// `npm run eval:tutor -- --write-baseline` để xác nhận chất lượng + cập nhật
// docs/research/eval-tutor-baseline.md.
export const GEMINI_CHAT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

// Model chat của Groq (FREE, nếu có GROQ_API_KEY). Đổi qua biến môi trường.
// [2026-08-22] Đổi mặc định từ llama-3.3-70b-versatile — Groq đã gỡ model này khỏi danh
// sách được phép (API trả "model_not_found"), xác nhận qua curl trực tiếp trên production.
// KHÔNG chạy được npm run eval:tutor để so baseline trước khi đổi (môi trường sửa lỗi không
// có key AI thật) — đây là vá khẩn cấp do NHÀ CUNG CẤP gỡ model (không phải đổi ý thích chủ
// quan), xem PROGRESS.md. Cần chạy eval:tutor xác nhận chất lượng sau khi có key thật.
export const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b'

// Guardrail cố định do SERVER chèn vào ĐẦU system prompt. Prompt nền dựng ở client
// (src/prompts) nên người đã đăng nhập về lý thuyết có thể gửi prompt tuỳ ý để biến API
// thành chatbot chung (tốn quota, lệch mục đích). Khung này ràng AI luôn đóng vai gia sư
// ngôn ngữ. Giữ NGẮN + chỉ nói phạm vi/vai trò, KHÔNG ép định dạng output (để prompt theo
// mode chat/writing/speaking tự quyết format — câu cuối nhắc AI tuân theo hướng dẫn bên dưới).
export const SYSTEM_GUARDRAIL =
  'Bạn là trợ lý GIA SƯ NGÔN NGỮ (Anh–Việt) trong một ứng dụng học tiếng. ' +
  'Chỉ hỗ trợ việc học ngôn ngữ: luyện hội thoại, sửa lỗi, giải thích, chấm bài, từ vựng và ngữ pháp. ' +
  'Nếu được yêu cầu làm việc ngoài phạm vi học ngôn ngữ, hãy lịch sự từ chối và mời người dùng quay lại bài học. ' +
  'Luôn tuân thủ hướng dẫn vai trò và định dạng trả lời bên dưới.\n\n'

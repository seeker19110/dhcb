// packages/core-ai/aiTokenUsage.ts — Ghi nhận CHI PHÍ AI theo TOKEN THẬT (mục N4).
//
// KHÁC GÌ aiCost.ts? File đó nhân "số lượt" với một đơn giá cố định đoán sẵn — tiện nhưng
// sai lệch khi prompt dài/ngắn khác nhau, và không biết provider/model nào ngốn tiền. Ở đây
// ta đọc con số token do CHÍNH nhà cung cấp trả về trong mỗi response:
//   • Groq (chuẩn OpenAI): usage.prompt_tokens / usage.completion_tokens
//   • Anthropic:           usage.input_tokens / output_tokens (+ cache read/write)
//   • Gemini:              usageMetadata.promptTokenCount / candidatesTokenCount
// rồi quy ra USD bằng bảng giá thật trong capabilityCostTracker.ts.
//
// NGUYÊN TẮC BẤT BIẾN: đo đạc KHÔNG ĐƯỢC làm hỏng lượt trả lời của người dùng. Mọi hàm ghi
// ở đây đều nuốt lỗi (DB sập, bảng chưa migrate…) và chỉ log cảnh báo — người học vẫn nhận
// được câu trả lời. Vì vậy caller gọi kiểu "bắn rồi quên", KHÔNG await chặn response.

import { calculateCostUsd } from './capabilityCostTracker.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { createLogger } from '@dhcb/core-db/logger'
import { vnDateStr } from '@dhcb/core-db/date'

const log = createLogger('ai-token-usage')

/** Nhà cung cấp AI hội thoại đang dùng (khớp nhánh fallback trong ai.ts). */
export type AiProvider = 'groq' | 'anthropic' | 'gemini'

/** Số token thật của MỘT lượt gọi. Cache read/write chỉ Anthropic có (mặc định 0). */
export interface AiTokenUsage {
  promptTokens: number
  completionTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

// Đọc một số nguyên không âm từ giá trị lạ (body JSON của nhà cung cấp không có kiểu).
// Số âm/NaN/thiếu → 0, KHÔNG ném lỗi: token sai lệch chỉ làm số liệu lệch, không đáng để
// làm hỏng câu trả lời của người dùng.
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

// Chỉ coi là "có đo được" khi ÍT NHẤT một trong hai số token > 0. Trả null khi nhà cung cấp
// không gửi khối usage (hoặc gửi rỗng) → caller bỏ qua, không ghi dòng 0 token vô nghĩa.
function buildUsage(
  promptTokens: number,
  completionTokens: number,
  cacheReadTokens = 0,
  cacheWriteTokens = 0,
): AiTokenUsage | null {
  if (promptTokens <= 0 && completionTokens <= 0) return null
  return { promptTokens, completionTokens, cacheReadTokens, cacheWriteTokens }
}

/** Đọc usage từ body JSON của Groq (chuẩn OpenAI). */
export function parseGroqUsage(body: unknown): AiTokenUsage | null {
  const usage = asRecord(asRecord(body)?.usage)
  if (!usage) return null
  return buildUsage(toCount(usage.prompt_tokens), toCount(usage.completion_tokens))
}

/**
 * Đọc usage từ body JSON của Anthropic Messages API. Anthropic tách riêng token đọc từ
 * prompt cache (`cache_read_input_tokens`) và token ghi cache (`cache_creation_input_tokens`)
 * KHỎI `input_tokens` — nên phải cộng lại để `promptTokens` là tổng token đầu vào thật,
 * đúng như calculateCostUsd() mong đợi (hàm đó trừ ngược cacheRead ra khỏi promptTokens).
 */
export function parseAnthropicUsage(body: unknown): AiTokenUsage | null {
  const usage = asRecord(asRecord(body)?.usage)
  if (!usage) return null
  const cacheRead = toCount(usage.cache_read_input_tokens)
  const cacheWrite = toCount(usage.cache_creation_input_tokens)
  const inputTokens = toCount(usage.input_tokens) + cacheRead + cacheWrite
  return buildUsage(inputTokens, toCount(usage.output_tokens), cacheRead, cacheWrite)
}

/** Đọc usage từ body JSON của Gemini (`usageMetadata`). */
export function parseGeminiUsage(body: unknown): AiTokenUsage | null {
  const meta = asRecord(asRecord(body)?.usageMetadata)
  if (!meta) return null
  return buildUsage(toCount(meta.promptTokenCount), toCount(meta.candidatesTokenCount))
}

// ── Cảnh báo vượt ngân sách ────────────────────────────────────────────────────────────
// Ngưỡng chi phí AI MỘT NGÀY (USD). Không đặt biến → không cảnh báo (mặc định an toàn:
// không làm phiền khi chưa ai chọn ngưỡng).
export function getDailyBudgetUsd(): number | null {
  const raw = process.env.AI_DAILY_BUDGET_USD
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

// Ngày đã cảnh báo rồi — mỗi ngày CHỈ kêu MỘT lần trên mỗi tiến trình, không spam log mỗi
// lượt gọi sau khi đã vượt. (Trong PM2 cluster mỗi instance kêu 1 lần: chấp nhận được, và
// còn cho biết ngưỡng bị vượt ở nhiều instance.)
let alertedDay: string | null = null

// Cho test đặt lại trạng thái cảnh báo giữa các ca.
export function resetBudgetAlertState(): void {
  alertedDay = null
}

/** Tổng chi phí USD đã ghi nhận trong một ngày (theo giờ VN). */
export async function getDailyCostUsd(day: string): Promise<number> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ total: string | null }>(
    'select sum(cost_usd)::text as total from platform.ai_token_usage_daily where day = $1',
    [day],
  )
  return Number(rows[0]?.total ?? 0) || 0
}

async function checkBudget(day: string): Promise<void> {
  const budget = getDailyBudgetUsd()
  if (budget === null || alertedDay === day) return
  const spent = await getDailyCostUsd(day)
  if (spent < budget) return
  alertedDay = day
  log.error(
    `NGÂN SÁCH AI VƯỢT NGƯỠNG: ngày ${day} đã tốn ${spent.toFixed(4)} USD ` +
      `(ngưỡng AI_DAILY_BUDGET_USD = ${budget} USD). Kiểm tra /api/admin-usage-stats.`,
  )
}

/**
 * Ghi nhận token thật của MỘT lượt gọi AI vào bảng cộng dồn theo ngày, rồi kiểm ngưỡng
 * ngân sách. KHÔNG BAO GIỜ ném lỗi — caller không cần try/catch, cũng không cần await.
 */
export async function recordAiTokenUsage(params: {
  provider: AiProvider
  model: string
  mode: string
  usage: AiTokenUsage | null
  day?: string
}): Promise<void> {
  const { provider, model, mode, usage } = params
  // Nhà cung cấp không trả usage (body cũ/lỗi parse) → không ghi dòng rỗng làm loãng số liệu.
  if (!usage) return

  const day = params.day ?? vnDateStr()
  const costUsd = calculateCostUsd(
    model,
    usage.promptTokens,
    usage.completionTokens,
    usage.cacheReadTokens,
    usage.cacheWriteTokens,
  )

  try {
    const pool = getPgPool()
    await pool.query(
      `insert into platform.ai_token_usage_daily
         (day, provider, model, mode, calls, prompt_tokens, completion_tokens,
          cache_read_tokens, cache_write_tokens, cost_usd, updated_at)
       values ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9, now())
       on conflict (day, provider, model, mode) do update set
         calls              = platform.ai_token_usage_daily.calls + 1,
         prompt_tokens      = platform.ai_token_usage_daily.prompt_tokens + excluded.prompt_tokens,
         completion_tokens  = platform.ai_token_usage_daily.completion_tokens + excluded.completion_tokens,
         cache_read_tokens  = platform.ai_token_usage_daily.cache_read_tokens + excluded.cache_read_tokens,
         cache_write_tokens = platform.ai_token_usage_daily.cache_write_tokens + excluded.cache_write_tokens,
         cost_usd           = platform.ai_token_usage_daily.cost_usd + excluded.cost_usd,
         updated_at         = now()`,
      [
        day,
        provider,
        model,
        mode,
        usage.promptTokens,
        usage.completionTokens,
        usage.cacheReadTokens,
        usage.cacheWriteTokens,
        costUsd,
      ],
    )
    await checkBudget(day)
  } catch (err) {
    log.warn(`không ghi được token AI (${provider}/${model}/${mode}): ${String(err)}`)
  }
}

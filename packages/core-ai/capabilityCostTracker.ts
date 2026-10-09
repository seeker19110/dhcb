// packages/core-ai/capabilityCostTracker.ts — Theo dõi chi phí và số lượng token cho từng capability AI (V2-20).
//
// Phục vụ Platform V2 theo dõi unit economics, observability và budget guardrails per capability/domain.

export interface ModelPricing {
  promptCostPer1MTokensUsd: number
  completionCostPer1MTokensUsd: number
}

// Bảng giá cơ sở cho các model phổ biến (USD / 1,000,000 tokens)
export const MODEL_PRICING_REGISTRY: Record<string, ModelPricing> = {
  // [2026-10-09] Model Claude theo nhiệm vụ (aiConfig.ts#getAnthropicRoute). Giá công bố của
  // Anthropic, USD / 1M token. Haiku 5.5 có HAI bảng giá theo độ dài prompt: ≤ 100K token là
  // $0.10/$0.50 (dùng ở đây — /api/agent giới hạn 40K ký tự nên luôn dưới ngưỡng), > 100K là
  // $0.50/$2.50. Phần "suy nghĩ" (thinking) tính như token ra.
  'claude-haiku-5-5': {
    promptCostPer1MTokensUsd: 0.1,
    completionCostPer1MTokensUsd: 0.5,
  },
  'claude-sonnet-5-5': {
    promptCostPer1MTokensUsd: 2.0,
    completionCostPer1MTokensUsd: 10.0,
  },
  // Model mà server-side fallback của Sonnet 5.5 có thể chuyển sang khi bộ lọc an toàn từ chối
  // nhầm — response ghi đúng model đã chạy nên cần có giá để không rơi về giá mặc định.
  'claude-opus-5-5': {
    promptCostPer1MTokensUsd: 4.0,
    completionCostPer1MTokensUsd: 20.0,
  },
  // Model cũ (trước 2026-10-09) — giữ để quy giá dữ liệu lịch sử. Sửa giá đúng $1/$5 (bản cũ
  // ghi nhầm $0.8/$4 của Haiku 3.5).
  'claude-haiku-4-5-20251001': {
    promptCostPer1MTokensUsd: 1.0,
    completionCostPer1MTokensUsd: 5.0,
  },
  'gemini-2.0-flash': {
    promptCostPer1MTokensUsd: 0.1,
    completionCostPer1MTokensUsd: 0.4,
  },
  // [2026-08-24] Model Gemini mặc định mới (aiConfig.ts đổi ở PR #647). Giá KHUYẾN MÃI công bố
  // đến 31/12/2026: $0.75/1M input · $3.75/1M output; từ 01/01/2027 tăng lên $1.5/$7.5 — nhớ
  // cập nhật lại khi qua năm.
  'gemini-3.6-flash': {
    promptCostPer1MTokensUsd: 0.75,
    completionCostPer1MTokensUsd: 3.75,
  },
  'llama-3.3-70b-versatile': {
    promptCostPer1MTokensUsd: 0.59,
    completionCostPer1MTokensUsd: 0.79,
  },
  // [2026-08-22] Groq gỡ llama-3.3-70b-versatile — model mặc định mới là
  // 'openai/gpt-oss-120b' (xem aiConfig.ts), CHƯA thêm giá thật vào bảng này vì không xác
  // minh được giá công bố hiện hành trong lúc vá khẩn cấp — tạm dùng DEFAULT_FALLBACK_PRICING
  // bên dưới (ước tính, không chính xác tuyệt đối). Cần điền giá thật từ
  // https://groq.com/pricing khi xác nhận được.
  'gpt-4o-mini': {
    promptCostPer1MTokensUsd: 0.15,
    completionCostPer1MTokensUsd: 0.6,
  },
  'whisper-large-v3-turbo': {
    promptCostPer1MTokensUsd: 0.04, // Quy đổi tương đương theo request
    completionCostPer1MTokensUsd: 0.04,
  },
}

export const DEFAULT_FALLBACK_PRICING: ModelPricing = {
  promptCostPer1MTokensUsd: 0.5,
  completionCostPer1MTokensUsd: 1.5,
}

export interface CapabilityCostMetric {
  capabilityId: string
  domain: string
  personId: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  costSavedUsd?: number
  costUsd: number
  latencyMs: number
  status: 'success' | 'error' | 'throttled'
  timestamp: string
}

export interface CapabilityCostSummary {
  totalCalls: number
  successfulCalls: number
  errorCalls: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCacheReadTokens: number
  totalCostSavedUsd: number
  totalCostUsd: number
  avgLatencyMs: number
}

export function calculateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0,
): number {
  const pricing = MODEL_PRICING_REGISTRY[model] || DEFAULT_FALLBACK_PRICING
  // Regular prompt tokens (tokens không được đọc từ cache)
  const regularPromptTokens = Math.max(0, promptTokens - cacheReadTokens)
  const regularPromptCost = (regularPromptTokens / 1_000_000) * pricing.promptCostPer1MTokensUsd
  // Cache read tokens được chiết khấu 90% (chỉ tính 10% đơn giá gốc)
  const cacheReadCost = (cacheReadTokens / 1_000_000) * (pricing.promptCostPer1MTokensUsd * 0.1)
  // Cache write tokens (lưu cache ban đầu) tính 125% đơn giá gốc
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * (pricing.promptCostPer1MTokensUsd * 1.25)
  const completionCost = (completionTokens / 1_000_000) * pricing.completionCostPer1MTokensUsd

  const totalCost = regularPromptCost + cacheReadCost + cacheWriteCost + completionCost
  return Math.round(totalCost * 1_000_000) / 1_000_000
}

export function calculateCostSavedUsd(model: string, cacheReadTokens: number = 0): number {
  if (cacheReadTokens <= 0) return 0
  const pricing = MODEL_PRICING_REGISTRY[model] || DEFAULT_FALLBACK_PRICING
  // Tiết kiệm 90% chi phí đọc prompt nhờ Cache Hit
  const saved = (cacheReadTokens / 1_000_000) * (pricing.promptCostPer1MTokensUsd * 0.9)
  return Math.round(saved * 1_000_000) / 1_000_000
}

export class CapabilityCostTracker {
  private metrics: CapabilityCostMetric[] = []

  public recordInvocation(
    metric: Omit<CapabilityCostMetric, 'totalTokens' | 'costUsd' | 'timestamp'> & {
      costUsd?: number
      costSavedUsd?: number
      timestamp?: string
    },
  ): CapabilityCostMetric {
    const totalTokens = metric.promptTokens + metric.completionTokens
    const cacheRead = metric.cacheReadTokens ?? 0
    const cacheWrite = metric.cacheWriteTokens ?? 0
    const costSavedUsd = metric.costSavedUsd ?? calculateCostSavedUsd(metric.model, cacheRead)
    const costUsd =
      metric.costUsd ??
      calculateCostUsd(
        metric.model,
        metric.promptTokens,
        metric.completionTokens,
        cacheRead,
        cacheWrite,
      )
    const timestamp = metric.timestamp ?? new Date().toISOString()

    const fullMetric: CapabilityCostMetric = {
      ...metric,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      costSavedUsd,
      totalTokens,
      costUsd,
      timestamp,
    }

    this.metrics.push(fullMetric)
    return fullMetric
  }

  public getMetrics(): CapabilityCostMetric[] {
    return [...this.metrics]
  }

  public getMetricsByCapability(capabilityId: string): CapabilityCostSummary {
    const filtered = this.metrics.filter((m) => m.capabilityId === capabilityId)
    return this.summarize(filtered)
  }

  public getMetricsByDomain(domain: string): CapabilityCostSummary {
    const filtered = this.metrics.filter((m) => m.domain === domain)
    return this.summarize(filtered)
  }

  public getMetricsByPerson(personId: string): CapabilityCostSummary {
    const filtered = this.metrics.filter((m) => m.personId === personId)
    return this.summarize(filtered)
  }

  public getTotalMetrics(): CapabilityCostSummary {
    return this.summarize(this.metrics)
  }

  public checkBudgetExceeded(personId: string, budgetUsd: number): boolean {
    const summary = this.getMetricsByPerson(personId)
    return summary.totalCostUsd >= budgetUsd
  }

  public reset(): void {
    this.metrics = []
  }

  private summarize(items: CapabilityCostMetric[]): CapabilityCostSummary {
    if (items.length === 0) {
      return {
        totalCalls: 0,
        successfulCalls: 0,
        errorCalls: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCacheReadTokens: 0,
        totalCostSavedUsd: 0,
        totalCostUsd: 0,
        avgLatencyMs: 0,
      }
    }

    let successfulCalls = 0
    let errorCalls = 0
    let totalPromptTokens = 0
    let totalCompletionTokens = 0
    let totalTokens = 0
    let totalCacheReadTokens = 0
    let totalCostSavedUsd = 0
    let totalCostUsd = 0
    let totalLatency = 0

    for (const item of items) {
      if (item.status === 'success') {
        successfulCalls++
      } else {
        errorCalls++
      }
      totalPromptTokens += item.promptTokens
      totalCompletionTokens += item.completionTokens
      totalTokens += item.totalTokens
      totalCacheReadTokens += item.cacheReadTokens ?? 0
      totalCostSavedUsd += item.costSavedUsd ?? 0
      totalCostUsd += item.costUsd
      totalLatency += item.latencyMs
    }

    return {
      totalCalls: items.length,
      successfulCalls,
      errorCalls,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens,
      totalCacheReadTokens,
      totalCostSavedUsd: Math.round(totalCostSavedUsd * 1_000_000) / 1_000_000,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      avgLatencyMs: Math.round(totalLatency / items.length),
    }
  }
}

// Global default singleton instance for in-memory telemetry
export const defaultCapabilityCostTracker = new CapabilityCostTracker()

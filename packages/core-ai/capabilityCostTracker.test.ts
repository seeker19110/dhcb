import { describe, it, expect, beforeEach } from 'vitest'
import {
  CapabilityCostTracker,
  calculateCostUsd,
  DEFAULT_FALLBACK_PRICING,
  defaultCapabilityCostTracker,
} from './capabilityCostTracker.js'

describe('CapabilityCostTracker', () => {
  let tracker: CapabilityCostTracker

  beforeEach(() => {
    tracker = new CapabilityCostTracker()
    defaultCapabilityCostTracker.reset()
  })

  it('calculates cost correctly based on model pricing registry', () => {
    // gemini-2.0-flash: prompt: 0.1 / 1M, completion: 0.4 / 1M
    // 10,000 prompt tokens = 0.001 USD
    // 5,000 completion tokens = 0.002 USD
    // total = 0.003 USD
    const cost = calculateCostUsd('gemini-2.0-flash', 10_000, 5_000)
    expect(cost).toBeCloseTo(0.003, 6)

    // claude-haiku 4.5: prompt 1.0 / 1M, completion 5.0 / 1M
    // 1,000 prompt tokens = 0.0010 USD
    // 500 completion tokens = 0.0025 USD
    // total = 0.0035 USD
    const claudeCost = calculateCostUsd('claude-haiku-4-5-20251001', 1_000, 500)
    expect(claudeCost).toBeCloseTo(0.0035, 6)

    // Model theo nhiệm vụ (2026-10-09): Haiku 5.5 $0.10/$0.50, Sonnet 5.5 $2/$10.
    expect(calculateCostUsd('claude-haiku-5-5', 1_000_000, 1_000_000)).toBeCloseTo(0.6, 6)
    expect(calculateCostUsd('claude-sonnet-5-5', 1_000_000, 1_000_000)).toBeCloseTo(12, 6)

    // Fallback model pricing
    const fallbackCost = calculateCostUsd('unknown-model-xyz', 1_000_000, 1_000_000)
    expect(fallbackCost).toBeCloseTo(
      DEFAULT_FALLBACK_PRICING.promptCostPer1MTokensUsd +
        DEFAULT_FALLBACK_PRICING.completionCostPer1MTokensUsd,
      6,
    )
  })

  it('records invocations and calculates total tokens & cost', () => {
    const metric = tracker.recordInvocation({
      capabilityId: 'learning.tutor_turn',
      domain: 'learning',
      personId: 'person-123',
      model: 'gemini-2.0-flash',
      promptTokens: 1000,
      completionTokens: 200,
      latencyMs: 350,
      status: 'success',
    })

    expect(metric.totalTokens).toBe(1200)
    expect(metric.costUsd).toBeGreaterThan(0)
    expect(metric.timestamp).toBeDefined()

    const allMetrics = tracker.getMetrics()
    expect(allMetrics).toHaveLength(1)
  })

  it('filters metrics by capability, domain, and person', () => {
    tracker.recordInvocation({
      capabilityId: 'learning.tutor_turn',
      domain: 'learning',
      personId: 'person-1',
      model: 'gemini-2.0-flash',
      promptTokens: 500,
      completionTokens: 100,
      latencyMs: 200,
      status: 'success',
    })

    tracker.recordInvocation({
      capabilityId: 'career.review_cv',
      domain: 'career',
      personId: 'person-1',
      model: 'claude-haiku-4-5-20251001',
      promptTokens: 2000,
      completionTokens: 800,
      latencyMs: 1200,
      status: 'success',
    })

    tracker.recordInvocation({
      capabilityId: 'work.summarize_meeting',
      domain: 'work',
      personId: 'person-2',
      model: 'gemini-2.0-flash',
      promptTokens: 1500,
      completionTokens: 300,
      latencyMs: 400,
      status: 'error',
    })

    const learningSummary = tracker.getMetricsByCapability('learning.tutor_turn')
    expect(learningSummary.totalCalls).toBe(1)
    expect(learningSummary.successfulCalls).toBe(1)
    expect(learningSummary.totalTokens).toBe(600)

    const careerDomainSummary = tracker.getMetricsByDomain('career')
    expect(careerDomainSummary.totalCalls).toBe(1)
    expect(careerDomainSummary.totalTokens).toBe(2800)

    const person1Summary = tracker.getMetricsByPerson('person-1')
    expect(person1Summary.totalCalls).toBe(2)
    expect(person1Summary.successfulCalls).toBe(2)
    expect(person1Summary.errorCalls).toBe(0)

    const person2Summary = tracker.getMetricsByPerson('person-2')
    expect(person2Summary.totalCalls).toBe(1)
    expect(person2Summary.errorCalls).toBe(1)

    const totalSummary = tracker.getTotalMetrics()
    expect(totalSummary.totalCalls).toBe(3)
    expect(totalSummary.successfulCalls).toBe(2)
    expect(totalSummary.errorCalls).toBe(1)
  })

  it('checks person budget threshold correctly', () => {
    tracker.recordInvocation({
      capabilityId: 'career.review_cv',
      domain: 'career',
      personId: 'person-budget-test',
      model: 'claude-haiku-4-5-20251001',
      promptTokens: 100_000,
      completionTokens: 50_000,
      latencyMs: 1500,
      status: 'success',
      costUsd: 0.28,
    })

    expect(tracker.checkBudgetExceeded('person-budget-test', 0.5)).toBe(false)
    expect(tracker.checkBudgetExceeded('person-budget-test', 0.2)).toBe(true)
  })

  it('handles empty summaries gracefully', () => {
    const emptySummary = tracker.getMetricsByDomain('non-existent-domain')
    expect(emptySummary.totalCalls).toBe(0)
    expect(emptySummary.totalCostUsd).toBe(0)
    expect(emptySummary.avgLatencyMs).toBe(0)
  })

  it('resets metrics correctly', () => {
    tracker.recordInvocation({
      capabilityId: 'learning.tutor_turn',
      domain: 'learning',
      personId: 'person-1',
      model: 'gemini-2.0-flash',
      promptTokens: 100,
      completionTokens: 50,
      latencyMs: 100,
      status: 'success',
    })

    expect(tracker.getMetrics()).toHaveLength(1)
    tracker.reset()
    expect(tracker.getMetrics()).toHaveLength(0)
  })

  it('calculates prompt caching discounts and tracks cost savings', () => {
    // claude-haiku 4.5: 1.0 USD / 1M prompt.
    // 100,000 prompt tokens, trong đó 80,000 read from cache (được giảm 90% = 0.1x), 20,000 regular (1.0x).
    // Regular 20k tokens = 0.02 USD
    // Cache read 80k tokens = 80,000 * 0.1 / 1M = 0.008 USD
    // Completion 10k tokens = 10,000 * 5.0 / 1M = 0.05 USD
    // Total = 0.02 + 0.008 + 0.05 = 0.078 USD (thay vì 0.1 + 0.05 = 0.15 USD không cache)
    const cachedCost = calculateCostUsd('claude-haiku-4-5-20251001', 100_000, 10_000, 80_000, 0)
    expect(cachedCost).toBeCloseTo(0.078, 4)

    const metric = tracker.recordInvocation({
      capabilityId: 'learning.tutor_turn',
      domain: 'learning',
      personId: 'person-cache-test',
      model: 'claude-haiku-4-5-20251001',
      promptTokens: 100_000,
      completionTokens: 10_000,
      cacheReadTokens: 80_000,
      latencyMs: 220,
      status: 'success',
    })

    expect(metric.cacheReadTokens).toBe(80_000)
    expect(metric.costSavedUsd).toBeGreaterThan(0)
    expect(metric.costUsd).toBeCloseTo(0.078, 4)

    const summary = tracker.getMetricsByPerson('person-cache-test')
    expect(summary.totalCacheReadTokens).toBe(80_000)
    expect(summary.totalCostSavedUsd).toBeGreaterThan(0)
  })
})

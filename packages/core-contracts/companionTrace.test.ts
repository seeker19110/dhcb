// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  CompanionTraceSpanSchema,
  CompanionTraceUsageSchema,
  unknownTraceUsage,
} from './companionTrace'

const root = () => ({
  schemaVersion: 1,
  traceId: randomUUID(),
  requestId: '0123abcd',
  spanId: randomUUID(),
  parentSpanId: null,
  stage: 'turn',
  status: 'success',
  startOffsetMs: 0,
  durationMs: 10,
  provider: null,
  model: null,
  attempt: null,
  httpStatus: null,
  toolKind: null,
  usage: null,
  costUsd: null,
  summary: {
    callCount: 0,
    openCallCount: 0,
    openModelCallCount: 0,
    unknownCallCount: 0,
    droppedSpans: 0,
    observedCostUsd: 0,
    totalCostUsd: 0,
  },
})

describe('Companion trace metadata v1', () => {
  it('chấp nhận root không model call và số 0 thực sự đã biết', () => {
    expect(CompanionTraceSpanSchema.safeParse(root()).success).toBe(true)
    expect(
      CompanionTraceUsageSchema.safeParse({
        state: 'complete',
        promptTokens: 0,
        completionTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }).success,
    ).toBe(true)
  })
  it.each(['prompt', 'messages', 'userId', 'personId', 'arguments', 'error', 'headers'])(
    'không nhận nguồn nhạy cảm %s',
    (key) => {
      expect(
        CompanionTraceSpanSchema.safeParse({ ...root(), [key]: 'CANARY_SECRET' }).success,
      ).toBe(false)
    },
  )
  it.each([-1, NaN, Infinity])('duration sai không được đổi ngầm thành 0: %s', (durationMs) => {
    expect(CompanionTraceSpanSchema.safeParse({ ...root(), durationMs }).success).toBe(false)
  })
  it('thiếu counter, fractional/unsafe token và model lạ bị từ chối', () => {
    expect(
      CompanionTraceUsageSchema.safeParse({ ...unknownTraceUsage(), state: 'complete' }).success,
    ).toBe(false)
    for (const promptTokens of [1.5, -1, Number.MAX_SAFE_INTEGER + 1]) {
      expect(
        CompanionTraceUsageSchema.safeParse({
          ...unknownTraceUsage(),
          state: 'partial',
          promptTokens,
        }).success,
      ).toBe(false)
    }
    expect(
      CompanionTraceSpanSchema.safeParse({ ...root(), model: 'CANARY_USER_TEXT' }).success,
    ).toBe(false)
  })
  it('attempt partial phải có tổng cost unknown ở root; không cộng cost vào span cha', () => {
    const r = root()
    expect(
      CompanionTraceSpanSchema.safeParse({
        ...r,
        summary: { ...r.summary, callCount: 1, unknownCallCount: 1 },
      }).success,
    ).toBe(false)
    expect(
      CompanionTraceSpanSchema.safeParse({
        ...r,
        summary: { ...r.summary, callCount: 1, unknownCallCount: 1, totalCostUsd: null },
      }).success,
    ).toBe(true)
    expect(CompanionTraceSpanSchema.safeParse({ ...r, costUsd: 1 }).success).toBe(false)
    const attempt = {
      ...r,
      stage: 'http_attempt',
      parentSpanId: r.spanId,
      spanId: randomUUID(),
      provider: 'anthropic',
      model: 'claude-sonnet-5-5',
      attempt: 1,
      usage: unknownTraceUsage(),
      summary: null,
    }
    expect(CompanionTraceSpanSchema.safeParse(attempt).success).toBe(true)
    expect(CompanionTraceSpanSchema.safeParse({ ...attempt, costUsd: 0 }).success).toBe(false)
  })
})

// api/mesh-telemetry.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './mesh-telemetry.js'
import * as security from '@dhcb/core-auth/security'
import { getFeatureState } from '@dhcb/core-db/featureState'

// Handler đã chuyển state sang platform.feature_state — mock bằng Map in-memory (hành vi giống
// hệt Map cấp module cũ: state sống suốt file test), theo đúng khuôn pvp-arena.test.ts.
const featureStore = new Map<string, unknown>()
vi.mock('@dhcb/core-db/featureState', () => ({
  getFeatureState: vi.fn(async (u: string, f: string) => featureStore.get(u + '|' + f) ?? null),
  setFeatureState: vi.fn(async (u: string, f: string, st: unknown) => {
    featureStore.set(u + '|' + f, st)
  }),
}))

describe('Mesh Telemetry API Handler (/api/mesh-telemetry)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/mesh-telemetry', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('returns default session telemetry on GET with 200', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/mesh-telemetry', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.telemetry.qualityTier).toBe('ultra_low_latency')
    expect(data.telemetry.schemaVersion).toBe('v4.4.0')
  })

  it('records metrics on POST with action=record_metric', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/mesh-telemetry?action=record_metric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addedTokens: 500,
        addedAudioSeconds: 15,
        provider: 'gemini_live',
      }),
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.telemetry.totalTokens).toBeGreaterThan(0)
  })

  it('resets budget cap on POST with action=reset_budget', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/mesh-telemetry?action=reset_budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costCapUsd: 0.25 }),
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.telemetry.costCapUsd).toBe(0.25)
  })

  it('handles OPTIONS (204) and Method Not Allowed (405)', async () => {
    const resOpt = await handler(
      new Request('http://localhost/api/mesh-telemetry', { method: 'OPTIONS' }),
    )
    expect(resOpt.status).toBe(204)

    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const resDel = await handler(
      new Request('http://localhost/api/mesh-telemetry', { method: 'DELETE' }),
    )
    expect(resDel.status).toBe(405)
  })

  it('handles POST full telemetry body (valid / invalid) and bad JSON', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Bad JSON
    const badJson = new Request('http://localhost/api/mesh-telemetry', {
      method: 'POST',
      body: 'invalid-json',
    })
    expect((await handler(badJson)).status).toBe(400)

    // Invalid schema
    const invalidSchema = new Request('http://localhost/api/mesh-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalTokens: -10 }),
    })
    expect((await handler(invalidSchema)).status).toBe(400)

    // Valid schema
    const now = new Date().toISOString()
    const validSchema = new Request('http://localhost/api/mesh-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: '11111111-1111-4111-8111-111111111111',
        startTime: now,
        durationSeconds: 10,
        activeProviders: ['gemini_live'],
        totalPromptTokens: 10,
        totalCompletionTokens: 10,
        totalTokens: 20,
        audioMinutes: 0.1,
        accumulatedCostUsd: 0.001,
        costCapUsd: 0.1,
        budgetWarning: false,
        isThrottled: false,
        currentLatencyMs: 45,
        qualityTier: 'ultra_low_latency',
        updatedAt: now,
      }),
    })
    const resValid = await handler(validSchema)
    expect(resValid.status).toBe(200)
  })

  it('CHẶN HỒI QUY 2026-10-08: CSDL lỗi → 500 có log, KHÔNG phải 400 "Invalid payload" lộ lỗi pg', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getFeatureState).mockRejectedValueOnce(
      new Error('connect ECONNREFUSED 10.0.0.5:5432'),
    )
    const res = await handler(
      new Request('http://localhost/api/mesh-telemetry?action=record_metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addedTokens: 10 }),
      }),
    )
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('ECONNREFUSED')
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('mesh-telemetry'))
  })
})

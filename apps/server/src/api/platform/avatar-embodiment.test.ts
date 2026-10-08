// api/avatar-embodiment.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock kho feature state bằng Map in-memory — thay Postgres thật, giữ hành vi
// "state sống giữa các request trong cùng 1 test" giống Map cấp module cũ.
const store = new Map<string, unknown>()
vi.mock('@dhcb/core-db/featureState', () => ({
  getFeatureState: vi.fn(async (u: string, f: string) => store.get(u + '|' + f) ?? null),
  setFeatureState: vi.fn(
    async (u: string, f: string, s: unknown) => void store.set(u + '|' + f, s),
  ),
}))

import handler from './avatar-embodiment.js'
import * as security from '@dhcb/core-auth/security'
import { setFeatureState } from '@dhcb/core-db/featureState'

describe('Avatar Embodiment API Handler (/api/avatar-embodiment)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    store.clear()
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/avatar-embodiment', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('returns default 3D embodiment configuration and state on GET', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/avatar-embodiment', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const responseData = await res.json()
    expect(responseData.success).toBe(true)
    expect(responseData.config.renderMode).toBe('3d_cyber_avatar')
    expect(responseData.state.activeViseme.viseme).toBe('sil')
  })

  it('updates embodiment configuration on POST', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/avatar-embodiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        renderMode: 'live_orb',
        quality: 'medium',
        emissiveAccent: 'purple',
      }),
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const responseData = await res.json()
    expect(responseData.success).toBe(true)
    expect(responseData.config.renderMode).toBe('live_orb')
    expect(responseData.config.quality).toBe('medium')
  })

  it('handles OPTIONS preflight', async () => {
    const req = new Request('http://localhost/api/avatar-embodiment', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unsupported method', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const req = new Request('http://localhost/api/avatar-embodiment', { method: 'DELETE' })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })

  it('rejects invalid POST config with 400', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const req = new Request('http://localhost/api/avatar-embodiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renderMode: 'not_a_valid_mode' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('invalid_request')
  })

  it('CHẶN HỒI QUY 2026-10-08: CSDL lỗi → 500 có log, KHÔNG phải 400 "Invalid payload" lộ lỗi pg', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(setFeatureState).mockRejectedValueOnce(
      new Error('connect ECONNREFUSED 10.0.0.5:5432'),
    )
    const res = await handler(
      new Request('http://localhost/api/avatar-embodiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renderMode: 'live_orb',
          quality: 'medium',
          emissiveAccent: 'purple',
        }),
      }),
    )
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('ECONNREFUSED')
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('avatar-embodiment'))
  })
})

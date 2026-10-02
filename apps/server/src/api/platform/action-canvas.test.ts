// api/action-canvas.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock kho feature state bằng Map in-memory — thay Postgres thật. KHÔNG clear() giữa các
// test: nhiều test trong file này cố ý dựa vào state của test trước (giống hệt hành vi
// Map cấp module cũ, sống suốt cả file test) — ví dụ test auto_layout/export cần canvas
// đã được synthesize ở test trước đó cho cùng userId.
const store = new Map<string, unknown>()
vi.mock('@dhcb/core-db/featureState', () => ({
  getFeatureState: vi.fn(async (u: string, f: string) => store.get(u + '|' + f) ?? null),
  setFeatureState: vi.fn(
    async (u: string, f: string, s: unknown) => void store.set(u + '|' + f, s),
  ),
}))

import handler from './action-canvas.js'
import * as security from '@dhcb/core-auth/security'

describe('Action Canvas API Handler (/api/action-canvas)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/action-canvas', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('returns default or existing canvas on GET with 200', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/action-canvas', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.canvas.nodes.length).toBeGreaterThan(0)
    expect(data.canvas.schemaVersion).toBe('v4.2.0')
  })

  it('synthesizes new cross-domain goal canvas on POST with action=synthesize', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/action-canvas?action=synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalPrompt: 'Du học Thạc sĩ AI' }),
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.canvas.title).toContain('Du học Thạc sĩ AI')
  })

  it('exports canvas to markdown format on POST with action=export', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/action-canvas?action=export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.format).toBe('markdown')
    expect(data.markdown).toBeDefined()
  })

  it('handles OPTIONS preflight', async () => {
    const req = new Request('http://localhost/api/action-canvas', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unsupported method', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const req = new Request('http://localhost/api/action-canvas', { method: 'DELETE' })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })

  it('404s auto_layout/export when no canvas exists yet for the user', async () => {
    const freshUser = '22222222-2222-4222-8222-222222222222'
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({ userId: freshUser })
    const layoutReq = new Request('http://localhost/api/action-canvas?action=auto_layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const layoutRes = await handler(layoutReq)
    expect(layoutRes.status).toBe(404)

    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({ userId: freshUser })
    const exportReq = new Request('http://localhost/api/action-canvas?action=export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const exportRes = await handler(exportReq)
    expect(exportRes.status).toBe(404)
  })

  it('auto_layout re-arranges nodes of an existing canvas', async () => {
    const userId = '11111111-1111-4111-8111-111111111111'
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({ userId })
    const req = new Request('http://localhost/api/action-canvas?action=auto_layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('rejects invalid full-canvas payload with 400', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const req = new Request('http://localhost/api/action-canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: 'not-an-array' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('invalid_request')
  })

  it('rejects invalid JSON payload on POST', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const req = new Request('http://localhost/api/action-canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid',
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('GET chuẩn hoá canvas cũ đã lưu: nút miền career/life đổi về general', async () => {
    const userId = '33333333-3333-4333-8333-333333333333'
    const now = new Date().toISOString()
    const node = (id: string, domain: string) => ({
      id,
      type: 'task',
      title: 'Nút cũ',
      content: '',
      domain,
      x: 0,
      y: 0,
      width: 220,
      height: 120,
      color: '#00f0ff',
      status: 'in_progress',
      tags: [],
      assignedTo: 'user',
      createdAt: now,
      updatedAt: now,
    })
    store.set(userId + '|action_canvas', {
      canvasId: '44444444-4444-4444-8444-444444444444',
      personId: userId,
      title: 'Canvas cũ',
      nodes: [
        node('55555555-5555-4555-8555-555555555551', 'career'),
        node('55555555-5555-4555-8555-555555555552', 'life'),
        node('55555555-5555-4555-8555-555555555553', 'learning'),
      ],
      edges: [],
      viewport: { zoom: 1, panX: 0, panY: 0 },
      lastEditedBy: 'user',
      schemaVersion: 'v4.2.0',
      createdAt: now,
      updatedAt: now,
    })
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({ userId })
    const res = await handler(new Request('http://localhost/api/action-canvas', { method: 'GET' }))
    expect(res.status).toBe(200)
    const { canvas } = await res.json()
    expect(canvas.nodes.map((n: { domain: string }) => n.domain)).toEqual([
      'general',
      'general',
      'learning',
    ])
  })
})

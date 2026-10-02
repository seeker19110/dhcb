// api/agent-orchestrator.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './agent-orchestrator.js'
import * as security from '@dhcb/core-auth/security'

const USER = { userId: '11111111-1111-4111-8111-111111111111' }

describe('Agent Orchestrator API Handler (/api/agent-orchestrator)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const res = await handler(
      new Request('http://localhost/api/agent-orchestrator', { method: 'GET' }),
    )
    expect(res.status).toBe(401)
  })

  // Changelog 0481: API từng trả phiên agent DỰNG SẴN (mọi bước "completed", token gán cứng, không
  // gọi AI). Nay gỡ và nói rõ — không còn ca nào trả phiên.
  it('GET trả 501 kèm lời giải thích, KHÔNG trả danh sách phiên', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(USER)
    const res = await handler(
      new Request('http://localhost/api/agent-orchestrator', { method: 'GET' }),
    )
    expect(res.status).toBe(501)
    const data = await res.json()
    expect(data.error).toBe('AGENT_ORCHESTRATOR_UNAVAILABLE')
    expect(data.message).toContain('dựng sẵn')
    expect(data.sessions).toBeUndefined()
    expect(data.session).toBeUndefined()
  })

  it('POST cũng trả 501, kể cả khi gửi đủ trường hợp lệ', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(USER)
    const res = await handler(
      new Request('http://localhost/api/agent-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTitle: 'Lộ trình',
          primaryRole: 'code_architect',
          userGoalDescription: 'Học xong Node.js',
        }),
      }),
    )
    expect(res.status).toBe(501)
    expect((await res.json()).session).toBeUndefined()
  })

  it('handles OPTIONS preflight', async () => {
    const res = await handler(
      new Request('http://localhost/api/agent-orchestrator', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('rejects unsupported method', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(USER)
    const res = await handler(
      new Request('http://localhost/api/agent-orchestrator', { method: 'DELETE' }),
    )
    expect(res.status).toBe(405)
  })
})

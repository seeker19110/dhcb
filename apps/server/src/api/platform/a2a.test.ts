// a2a.test.ts — hợp đồng đọc body với PARSER THẬT (audit 2026-10-26, AUD-CODE-001): handler từng
// đọc `message` trên vỏ `{ ok, raw }` ⇒ thông điệp đạt schema vẫn bị 400 "thiếu message".
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { A2A_PROTOCOL_VERSION } from '@dhcb/core-contracts/a2aProtocol'

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => ({ userId: 'u-1' }),
  logSecurityEvent: () => undefined,
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: async () => ({ id: 'p-1' }),
}))
const a2a = vi.hoisted(() => ({ process: vi.fn() }))
vi.mock('@dhcb/core-personal/a2aNegotiationService', () => ({
  processIncomingA2AMessage: (...a: unknown[]) => a2a.process(...a),
  discoverPeerStudyMatches: async () => [],
  listActiveA2ANegotiations: () => [],
}))

const { default: handler } = await import('./a2a.js')

const post = (body: string) =>
  handler(
    new Request('http://local.test/api/a2a', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  )

const MESSAGE = {
  messageId: '11111111-1111-4111-8111-111111111111',
  senderDid: 'did:key:z6Mkabc',
  recipientDid: 'did:key:z6Mkdef',
  senderPersonId: '22222222-2222-4222-8222-222222222222',
  recipientPersonId: '33333333-3333-4333-8333-333333333333',
  purpose: 'study_partner_handshake',
  payload: {},
  signature: 'sig-0123456789',
  timestamp: '2026-10-26T00:00:00.000Z',
  expiresAt: '2026-10-27T00:00:00.000Z',
  schemaVersion: A2A_PROTOCOL_VERSION,
}

beforeEach(() => {
  vi.clearAllMocks()
  a2a.process.mockResolvedValue({ status: 'accepted' })
})

describe('POST /api/a2a', () => {
  it('thông điệp đạt schema ⇒ 200, chuyển đúng message cho service', async () => {
    const res = await post(JSON.stringify({ message: MESSAGE }))
    expect(res.status).toBe(200)
    expect(a2a.process).toHaveBeenCalledWith({}, 'p-1', MESSAGE)
  })

  it('thiếu message / JSON hỏng / message sai schema ⇒ 400, không gọi service', async () => {
    expect((await post(JSON.stringify({}))).status).toBe(400)
    expect((await post('{hỏng')).status).toBe(400)
    expect((await post(JSON.stringify({ message: { ...MESSAGE, purpose: 'x' } }))).status).toBe(400)
    expect(a2a.process).not.toHaveBeenCalled()
  })
})

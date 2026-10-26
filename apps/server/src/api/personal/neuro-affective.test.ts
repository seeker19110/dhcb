// neuro-affective.test.ts — hợp đồng đọc body với PARSER THẬT (audit 2026-10-26, AUD-CODE-001):
// handler từng đọc `action`/`stressOverride` trên vỏ `{ ok, raw }` ⇒ luôn undefined, bật/tắt khiên
// và mức stress tự đặt bị bỏ qua mà vẫn 200; JSON hỏng cũng 200.
import { describe, it, expect, vi, beforeEach } from 'vitest'

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
const neuro = vi.hoisted(() => ({ assess: vi.fn(), toggle: vi.fn(), latest: vi.fn() }))
vi.mock('@dhcb/core-personal/neuroAffectiveService', () => ({
  assessNeuroAffectiveState: (...a: unknown[]) => neuro.assess(...a),
  toggleNeuroShield: (...a: unknown[]) => neuro.toggle(...a),
  getLatestNeuroState: (...a: unknown[]) => neuro.latest(...a),
}))

const { default: handler } = await import('./neuro-affective.js')

const post = (body: string) =>
  handler(
    new Request('http://local.test/api/neuro-affective', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  )

beforeEach(() => {
  vi.clearAllMocks()
  neuro.assess.mockResolvedValue({ stressIndex: 0 })
  neuro.toggle.mockReturnValue({ toggled: true })
})

describe('POST /api/neuro-affective', () => {
  it('toggle_shield ⇒ gọi toggleNeuroShield đúng khiên + trạng thái', async () => {
    const res = await post(
      JSON.stringify({ action: 'toggle_shield', shield: 'suggest_breathing', enabled: true }),
    )
    expect(res.status).toBe(200)
    expect(neuro.toggle).toHaveBeenCalledWith('p-1', 'suggest_breathing', true)
    expect(neuro.assess).not.toHaveBeenCalled()
  })

  it('stressOverride ⇒ chuyển đúng giá trị cho service', async () => {
    const res = await post(JSON.stringify({ stressOverride: 80 }))
    expect(res.status).toBe(200)
    expect(neuro.assess).toHaveBeenCalledWith({}, 'p-1', { manualStressOverride: 80 })
  })

  it('JSON hỏng ⇒ 400, không gọi service', async () => {
    expect((await post('{hỏng')).status).toBe(400)
    expect(neuro.assess).not.toHaveBeenCalled()
  })

  it('khiên lạ / stress ngoài 0–100 ⇒ 400', async () => {
    expect(
      (await post(JSON.stringify({ action: 'toggle_shield', shield: 'nope', enabled: true })))
        .status,
    ).toBe(400)
    expect((await post(JSON.stringify({ stressOverride: 150 }))).status).toBe(400)
    expect(neuro.toggle).not.toHaveBeenCalled()
    expect(neuro.assess).not.toHaveBeenCalled()
  })
})

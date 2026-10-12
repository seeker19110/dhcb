// companion-memory.test.ts — ba công tắc ký ức = ba consent chuẩn (GĐ2a ⑤ + GĐ2b), khối ghi
// nhớ cố định và tóm tắt cuộn (GĐ2b ④).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))

const getOrCreatePerson = vi.fn()
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: (...a: unknown[]) => getOrCreatePerson(...a),
}))

const consents = vi.hoisted(() => ({
  grantConsent: vi.fn(),
  listConsents: vi.fn(),
  revokeConsent: vi.fn(),
}))
vi.mock('@dhcb/core-personal/consentService', () =>
  Object.fromEntries(Object.entries(consents).map(([k, fn]) => [k, (...a: unknown[]) => fn(...a)])),
)

const blocks = vi.hoisted(() => ({
  listCoreBlocks: vi.fn(),
  setCoreBlock: vi.fn(),
  listConversationSummaries: vi.fn(),
  clearConversationSummary: vi.fn(),
}))
vi.mock('@dhcb/core-personal/coreMemoryBlocks', () =>
  Object.fromEntries(Object.entries(blocks).map(([k, fn]) => [k, (...a: unknown[]) => fn(...a)])),
)

import handler from './companion-memory.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const MEMORY_GRANT = '22222222-2222-4222-8222-222222222222'
const HISTORY_GRANT = '33333333-3333-4333-8333-333333333333'
const SUGGEST_GRANT = '44444444-4444-4444-8444-444444444444'
const EMPTY_BLOCKS = [
  { id: null, label: 'about_me', content: '', version: 0 },
  { id: null, label: 'current_focus', content: '', version: 0 },
]

function req(method: string, body?: unknown) {
  return new Request('http://localhost/api/companion-memory', {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

/** Giả lập bảng consent: trạng thái active theo scope, listConsents lọc đúng scope. */
function seedConsents(active: Partial<Record<'memory' | 'history' | 'suggest', boolean>>) {
  consents.listConsents.mockImplementation(async (_pool, _person, opts: { scope?: string }) => {
    const rows = []
    if (active.memory && opts.scope === COMPANION_CONSENT_SCOPES.memory) {
      rows.push({
        id: MEMORY_GRANT,
        scope: opts.scope,
        purpose: COMPANION_CONSENT_PURPOSE,
        status: 'active',
      })
    }
    if (active.history && opts.scope === COMPANION_CONSENT_SCOPES.history) {
      rows.push({
        id: HISTORY_GRANT,
        scope: opts.scope,
        purpose: COMPANION_CONSENT_PURPOSE,
        status: 'active',
      })
    }
    if (active.suggest && opts.scope === COMPANION_CONSENT_SCOPES.suggest) {
      rows.push({
        id: SUGGEST_GRANT,
        scope: opts.scope,
        purpose: COMPANION_CONSENT_PURPOSE,
        status: 'active',
      })
    }
    return rows
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  getOrCreatePerson.mockResolvedValue({ id: PERSON })
  seedConsents({})
  consents.grantConsent.mockResolvedValue({ id: 'new' })
  consents.revokeConsent.mockResolvedValue(undefined)
  blocks.listCoreBlocks.mockResolvedValue(EMPTY_BLOCKS)
  blocks.listConversationSummaries.mockResolvedValue([])
})

describe('auth / rate limit / method', () => {
  it('OPTIONS → 204; không token → 401; quá tải → 429; PATCH → 405', async () => {
    expect((await handler(req('OPTIONS'))).status).toBe(204)
    authState.user = null
    expect((await handler(req('GET'))).status).toBe(401)
    authState.user = { userId: 'user-1' }
    rateLimitOk = false
    expect((await handler(req('GET'))).status).toBe(429)
    rateLimitOk = true
    expect((await handler(req('PATCH', {}))).status).toBe(405)
  })
})

describe('GET /api/companion-memory', () => {
  it('phản ánh consent thật: mặc định cả hai tắt; chỉ đọc đúng scope chuẩn', async () => {
    const res = await handler(req('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      settings: { rememberMemories: false, useHistory: false, suggestMemories: false },
      coreBlocks: [
        { label: 'about_me', content: '', version: 0 },
        { label: 'current_focus', content: '', version: 0 },
      ],
      summaries: [],
    })
    const scopes = consents.listConsents.mock.calls.map((c) => (c[2] as { scope: string }).scope)
    expect(scopes.sort()).toEqual(
      [
        COMPANION_CONSENT_SCOPES.memory,
        COMPANION_CONSENT_SCOPES.history,
        COMPANION_CONSENT_SCOPES.suggest,
      ].sort(),
    )
  })

  it('consent active của scope ký ức nhưng purpose khác → KHÔNG tính là bật', async () => {
    consents.listConsents.mockResolvedValue([
      {
        id: MEMORY_GRANT,
        scope: COMPANION_CONSENT_SCOPES.memory,
        purpose: 'export',
        status: 'active',
      },
    ])
    const res = await handler(req('GET'))
    expect(((await res.json()) as { settings: unknown }).settings).toEqual({
      rememberMemories: false,
      useHistory: false,
      suggestMemories: false,
    })
  })

  it('cả ba bật', async () => {
    seedConsents({ memory: true, history: true, suggest: true })
    const res = await handler(req('GET'))
    expect(((await res.json()) as { settings: unknown }).settings).toEqual({
      rememberMemories: true,
      useHistory: true,
      suggestMemories: true,
    })
  })

  it('trả khối cố định không lộ id nội bộ; chỉ tóm tắt còn nội dung, không lộ con trỏ', async () => {
    blocks.listCoreBlocks.mockResolvedValue([
      {
        id: 'b1',
        label: 'about_me',
        content: 'Lớp 10',
        version: 2,
        updatedAt: '2026-10-12T00:00:00.000Z',
      },
      EMPTY_BLOCKS[1],
    ])
    blocks.listConversationSummaries.mockResolvedValue([
      {
        id: 's1',
        domain: 'learning',
        summary: 'Đã ôn Nghe.',
        updatedAt: '2026-10-12T00:00:00.000Z',
        through: { at: new Date(), id: 'm1' },
      },
      { id: 's2', domain: 'work', summary: '', updatedAt: '2026-10-12T00:00:00.000Z' },
    ])
    const body = (await (await handler(req('GET'))).json()) as Record<string, unknown>
    expect(body.coreBlocks).toEqual([
      { label: 'about_me', content: 'Lớp 10', version: 2, updatedAt: '2026-10-12T00:00:00.000Z' },
      { label: 'current_focus', content: '', version: 0 },
    ])
    expect(body.summaries).toEqual([
      { domain: 'learning', summary: 'Đã ôn Nghe.', updatedAt: '2026-10-12T00:00:00.000Z' },
    ])
  })
})

describe('POST /api/companion-memory set_settings', () => {
  it('bật ký ức → grantConsent đúng scope + purpose; công tắc không gửi thì không đụng', async () => {
    const res = await handler(req('POST', { action: 'set_settings', rememberMemories: true }))
    expect(res.status).toBe(200)
    expect(consents.grantConsent).toHaveBeenCalledTimes(1)
    expect(consents.grantConsent).toHaveBeenCalledWith(expect.anything(), {
      personId: PERSON,
      scope: COMPANION_CONSENT_SCOPES.memory,
      purpose: COMPANION_CONSENT_PURPOSE,
    })
    expect(consents.revokeConsent).not.toHaveBeenCalled()
  })

  it('tắt lịch sử → revokeConsent bản active; tắt ký ức đang tắt → lũy đẳng, không ghi', async () => {
    seedConsents({ history: true })
    const res = await handler(
      req('POST', { action: 'set_settings', rememberMemories: false, useHistory: false }),
    )
    expect(res.status).toBe(200)
    expect(consents.revokeConsent).toHaveBeenCalledTimes(1)
    expect(consents.revokeConsent).toHaveBeenCalledWith(expect.anything(), PERSON, HISTORY_GRANT)
    expect(consents.grantConsent).not.toHaveBeenCalled()
  })

  it('bật công tắc đã bật → không cấp thêm bản mới (giữ version)', async () => {
    seedConsents({ memory: true })
    await handler(req('POST', { action: 'set_settings', rememberMemories: true }))
    expect(consents.grantConsent).not.toHaveBeenCalled()
    expect(consents.revokeConsent).not.toHaveBeenCalled()
  })

  it('trả về trạng thái đọc lại SAU khi ghi', async () => {
    let memoryOn = false
    consents.listConsents.mockImplementation(async (_p, _person, opts: { scope?: string }) =>
      memoryOn && opts.scope === COMPANION_CONSENT_SCOPES.memory
        ? [
            {
              id: MEMORY_GRANT,
              scope: opts.scope,
              purpose: COMPANION_CONSENT_PURPOSE,
              status: 'active',
            },
          ]
        : [],
    )
    consents.grantConsent.mockImplementation(async () => {
      memoryOn = true
      return { id: MEMORY_GRANT }
    })
    const res = await handler(req('POST', { action: 'set_settings', rememberMemories: true }))
    expect(await res.json()).toEqual({
      settings: { rememberMemories: true, useHistory: false, suggestMemories: false },
    })
  })

  it('body sai (action lạ / trường thừa / JSON hỏng) → 400', async () => {
    expect((await handler(req('POST', { action: 'nope' }))).status).toBe(400)
    expect(
      (await handler(req('POST', { action: 'set_settings', rememberMemories: true, extra: 1 })))
        .status,
    ).toBe(400)
    const broken = new Request('http://localhost/api/companion-memory', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })
    expect((await handler(broken)).status).toBe(400)
  })

  it('AppError từ consentService (409 khi hai request đua nhau) → trả đúng mã', async () => {
    const { ConflictError } = await import('@dhcb/core-errors/appError')
    seedConsents({ memory: true })
    consents.revokeConsent.mockRejectedValue(new ConflictError('Consent đã được thu hồi'))
    const res = await handler(req('POST', { action: 'set_settings', rememberMemories: false }))
    expect(res.status).toBe(409)
  })
})

describe('POST /api/companion-memory — GĐ2b', () => {
  it('bật "gợi ý ký ức" → grantConsent đúng scope memory_suggestion.create', async () => {
    const res = await handler(req('POST', { action: 'set_settings', suggestMemories: true }))
    expect(res.status).toBe(200)
    expect(consents.grantConsent).toHaveBeenCalledWith(expect.anything(), {
      personId: PERSON,
      scope: COMPANION_CONSENT_SCOPES.suggest,
      purpose: COMPANION_CONSENT_PURPOSE,
    })
  })

  it('tắt "gợi ý ký ức" → thu hồi bản active', async () => {
    seedConsents({ suggest: true })
    await handler(req('POST', { action: 'set_settings', suggestMemories: false }))
    expect(consents.revokeConsent).toHaveBeenCalledWith(expect.anything(), PERSON, SUGGEST_GRANT)
  })

  it('set_core_block → setCoreBlock đúng người/nhãn/phiên bản, trả khối không có id', async () => {
    blocks.setCoreBlock.mockResolvedValue({
      id: 'b1',
      label: 'current_focus',
      content: 'Ôn thi giữa kỳ',
      version: 1,
      updatedAt: '2026-10-12T00:00:00.000Z',
    })
    const res = await handler(
      req('POST', {
        action: 'set_core_block',
        label: 'current_focus',
        content: 'Ôn thi giữa kỳ',
        expectedVersion: 0,
      }),
    )
    expect(res.status).toBe(200)
    expect(blocks.setCoreBlock).toHaveBeenCalledWith(
      expect.anything(),
      PERSON,
      'current_focus',
      'Ôn thi giữa kỳ',
      0,
    )
    expect(await res.json()).toEqual({
      block: {
        label: 'current_focus',
        content: 'Ôn thi giữa kỳ',
        version: 1,
        updatedAt: '2026-10-12T00:00:00.000Z',
      },
    })
  })

  it('set_core_block: nhãn lạ / phiên bản âm / quá dài → 400; lệch phiên bản → 409', async () => {
    for (const bad of [
      { action: 'set_core_block', label: 'secret', content: 'x', expectedVersion: 0 },
      { action: 'set_core_block', label: 'about_me', content: 'x', expectedVersion: -1 },
      {
        action: 'set_core_block',
        label: 'about_me',
        content: 'a'.repeat(2000),
        expectedVersion: 0,
      },
    ]) {
      expect((await handler(req('POST', bad))).status).toBe(400)
    }
    const { ConflictError } = await import('@dhcb/core-errors/appError')
    blocks.setCoreBlock.mockRejectedValue(new ConflictError('đã đổi'))
    const res = await handler(
      req('POST', {
        action: 'set_core_block',
        label: 'about_me',
        content: 'x',
        expectedVersion: 3,
      }),
    )
    expect(res.status).toBe(409)
  })

  it('clear_summary → xoá nội dung đúng miền, trả danh sách đọc lại', async () => {
    const res = await handler(req('POST', { action: 'clear_summary', domain: 'learning' }))
    expect(res.status).toBe(200)
    expect(blocks.clearConversationSummary).toHaveBeenCalledWith(
      expect.anything(),
      PERSON,
      'learning',
    )
    expect(await res.json()).toEqual({ summaries: [] })
  })
})

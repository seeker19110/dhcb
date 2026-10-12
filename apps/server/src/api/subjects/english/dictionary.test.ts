// Test /api/dictionary — tìm từ điển phía server: theo từ khóa (Anh/Việt), wordOfDay, random.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

const ENTRIES = [
  { word: 'apple', pos: 'noun', vi: 'quả táo', ex_en: 'I eat an apple.', ex_vi: 'Tôi ăn táo.' },
  {
    word: 'application',
    pos: 'noun',
    vi: 'đơn xin',
    ex_en: 'Fill the application.',
    ex_vi: 'Điền đơn.',
  },
  { word: 'run', pos: 'verb', vi: 'chạy', ex_en: 'I run fast.', ex_vi: 'Tôi chạy nhanh.' },
]
vi.mock('@dhcb/subject-english/dictionaryData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/subject-english/dictionaryData')>()),
  getAllEntries: () => ENTRIES,
}))

import handler from './dictionary.js'

beforeEach(() => {
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
})

function makeRequest(qs = ''): Request {
  return new Request(`http://localhost/api/dictionary${qs}`)
}

describe('GET /api/dictionary', () => {
  it('OPTIONS → 204', async () => {
    const res = await handler(new Request('http://localhost/api/dictionary', { method: 'OPTIONS' }))
    expect(res.status).toBe(204)
  })

  it('method khác GET → 405', async () => {
    const res = await handler(new Request('http://localhost/api/dictionary', { method: 'POST' }))
    expect(res.status).toBe(405)
  })

  it('vượt rate limit → 429', async () => {
    rateLimitOk = false
    const res = await handler(makeRequest('?q=apple'))
    expect(res.status).toBe(429)
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const res = await handler(makeRequest('?q=apple'))
    expect(res.status).toBe(401)
  })

  it('mode=wordOfDay → trả 1 từ cố định', async () => {
    const res = await handler(makeRequest('?mode=wordOfDay'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(3)
    expect(ENTRIES.map((e) => e.word)).toContain(body.entry.word)
  })

  it('mode=random → trả đúng số từ yêu cầu', async () => {
    const res = await handler(makeRequest('?mode=random&n=2'))
    const body = await res.json()
    expect(body.entries).toHaveLength(2)
  })

  it('không có q → trả rỗng', async () => {
    const res = await handler(makeRequest())
    const body = await res.json()
    expect(body).toEqual({ total: 3, matched: 0, posGroups: [], results: [] })
  })

  it('q quá dài (>100 ký tự) → 400', async () => {
    const res = await handler(makeRequest(`?q=${'a'.repeat(101)}`))
    expect(res.status).toBe(400)
  })

  it('tìm theo tiếng Anh — ưu tiên từ bắt đầu bằng query', async () => {
    const res = await handler(makeRequest('?q=app'))
    const body = await res.json()
    expect(body.results.map((e: { word: string }) => e.word)).toEqual(['apple', 'application'])
  })

  it('tìm theo tiếng Việt (có dấu)', async () => {
    const res = await handler(makeRequest('?q=táo'))
    const body = await res.json()
    expect(body.results.map((e: { word: string }) => e.word)).toEqual(['apple'])
  })

  it('lọc theo pos khi có tham số pos', async () => {
    // q="a" khớp cả apple/application (noun) — lọc pos=noun phải giữ nguyên 2 từ đó.
    const res = await handler(makeRequest('?q=a&pos=noun'))
    const body = await res.json()
    expect(body.results.map((e: { word: string }) => e.word)).toEqual(['apple', 'application'])
    expect(body.results.every((e: { pos: string }) => e.pos === 'noun')).toBe(true)
  })
})

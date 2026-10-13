// api/personal/companion-cards.test.ts — GĐ4a (changelog 0629): xác thực, đúng id, body strict.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const svc = vi.hoisted(() => ({
  getTodayCards: vi.fn(),
  recordCardFeedback: vi.fn(),
}))
vi.mock('@dhcb/core-personal/companionDailyCards', () => svc)
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query: vi.fn() }) }))

import handler from './companion-cards.js'
import * as security from '@dhcb/core-auth/security'
import * as personService from '@dhcb/core-personal/personService'
import { NotFoundError } from '@dhcb/core-errors/appError'

const USER_ID = '22222222-2222-4222-8222-222222222222'
const PERSON_ID = '11111111-1111-4111-8111-111111111111'
const CARD_ID = '33333333-3333-4333-8333-333333333333'
const URL_BASE = 'http://localhost/api/companion-cards'

function post(body: unknown, action = 'feedback'): Request {
  return new Request(`${URL_BASE}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('/api/companion-cards', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    svc.getTodayCards.mockReset()
    svc.recordCardFeedback.mockReset()
    vi.spyOn(security, 'checkRateLimit').mockResolvedValue(true)
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: USER_ID })
    vi.spyOn(personService, 'getOrCreatePerson').mockResolvedValue({
      id: PERSON_ID,
      userId: USER_ID,
      displayName: 'Người học',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    })
  })

  it('OPTIONS ⇒ 204', async () => {
    expect((await handler(new Request(URL_BASE, { method: 'OPTIONS' }))).status).toBe(204)
  })

  it('quá hạn mức ⇒ 429, chưa chạm CSDL', async () => {
    vi.spyOn(security, 'checkRateLimit').mockResolvedValue(false)
    expect((await handler(new Request(URL_BASE))).status).toBe(429)
    expect(svc.getTodayCards).not.toHaveBeenCalled()
  })

  it('chưa đăng nhập ⇒ 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue(null)
    expect((await handler(new Request(URL_BASE))).status).toBe(401)
  })

  it('method lạ ⇒ 405', async () => {
    expect((await handler(new Request(URL_BASE, { method: 'DELETE' }))).status).toBe(405)
  })

  it('GET truyền persons.id làm personId và profiles.id (token) làm userId', async () => {
    svc.getTodayCards.mockResolvedValue({ day: '2026-10-12', cards: [] })
    const res = await handler(new Request(URL_BASE))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ day: '2026-10-12', cards: [] })
    expect(svc.getTodayCards).toHaveBeenCalledWith(expect.anything(), {
      personId: PERSON_ID,
      userId: USER_ID,
    })
  })

  it('GET: CSDL lỗi ⇒ 500, không bịa thẻ', async () => {
    svc.getTodayCards.mockRejectedValue(new Error('db down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await handler(new Request(URL_BASE))).status).toBe(500)
  })

  it('POST feedback hợp lệ ⇒ 200, ghi theo personId của token', async () => {
    svc.recordCardFeedback.mockResolvedValue({ cardId: CARD_ID, feedback: 'down' })
    const res = await handler(post({ cardId: CARD_ID, feedback: 'down' }))
    expect(res.status).toBe(200)
    expect(svc.recordCardFeedback).toHaveBeenCalledWith(
      expect.anything(),
      PERSON_ID,
      CARD_ID,
      'down',
    )
  })

  it('POST: action lạ / JSON hỏng / feedback sai / trường lạ ⇒ 400, không ghi', async () => {
    expect((await handler(post({ cardId: CARD_ID, feedback: 'up' }, 'dismiss'))).status).toBe(400)
    expect((await handler(post('{hỏng'))).status).toBe(400)
    expect((await handler(post({ cardId: CARD_ID, feedback: 'meh' }))).status).toBe(400)
    expect((await handler(post({ cardId: 'abc', feedback: 'up' }))).status).toBe(400)
    expect(
      (await handler(post({ cardId: CARD_ID, feedback: 'up', personId: PERSON_ID }))).status,
    ).toBe(400)
    expect(svc.recordCardFeedback).not.toHaveBeenCalled()
  })

  it('POST: thẻ không thuộc mình ⇒ 404', async () => {
    svc.recordCardFeedback.mockRejectedValue(new NotFoundError('Không tìm thấy thẻ'))
    expect((await handler(post({ cardId: CARD_ID, feedback: 'up' }))).status).toBe(404)
  })
})

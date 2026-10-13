import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCompanionDailyCards, sendCompanionCardFeedback } from './companionCardsApi'

const CARD_ID = '33333333-3333-4333-8333-333333333333'
const CARD = {
  id: CARD_ID,
  kind: 'review_due',
  title: 'Ôn thẻ đến hạn',
  body: 'Có 3 thẻ đã đến hạn ôn hôm nay.',
  route: '/goc-hoc-tap/on-tap',
  actionLabel: 'Ôn ngay',
  status: 'open',
  feedback: null,
}

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('companionCardsApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('tải thẻ: parse đúng hợp đồng', async () => {
    mockFetch(200, { day: '2026-10-12', cards: [CARD] })
    await expect(fetchCompanionDailyCards()).resolves.toEqual({ day: '2026-10-12', cards: [CARD] })
  })

  it('tải thẻ: HTTP lỗi hoặc sai hình dạng ⇒ ném lỗi (không trả bộ thẻ nửa vời)', async () => {
    mockFetch(500, { error: 'x' })
    await expect(fetchCompanionDailyCards()).rejects.toThrow('500')
    mockFetch(200, { day: '2026-10-12', cards: [{ ...CARD, route: 'https://lừa.vn' }] })
    await expect(fetchCompanionDailyCards()).rejects.toThrow('sai định dạng')
  })

  it('gửi phản hồi: POST đúng action + body', async () => {
    const fn = mockFetch(200, { cardId: CARD_ID, feedback: 'down' })
    await expect(sendCompanionCardFeedback(CARD_ID, 'down')).resolves.toEqual({
      cardId: CARD_ID,
      feedback: 'down',
    })
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/companion-cards?action=feedback')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ cardId: CARD_ID, feedback: 'down' })
  })

  it('gửi phản hồi: HTTP lỗi ⇒ ném lỗi', async () => {
    mockFetch(404, { error: 'Không tìm thấy thẻ' })
    await expect(sendCompanionCardFeedback(CARD_ID, 'up')).rejects.toThrow('404')
  })
})

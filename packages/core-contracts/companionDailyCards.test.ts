import { describe, expect, it } from 'vitest'
import {
  CompanionDailyCardSchema,
  CompanionDailyCardsResponseSchema,
  DAILY_CARD_KINDS,
  DailyCardFeedbackRequestSchema,
  MAX_DAILY_CARDS,
} from './companionDailyCards'

const CARD = {
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'review_due',
  title: 'Ôn thẻ đến hạn',
  body: 'Còn 4 thẻ đã đến hạn ôn.',
  route: '/goc-hoc-tap/on-tap',
  actionLabel: 'Ôn ngay',
  status: 'open',
  feedback: null,
} as const

describe('companionDailyCards contract', () => {
  it('bốn loại thẻ, trần 3 thẻ/ngày', () => {
    expect(DAILY_CARD_KINDS).toEqual(['review_due', 'due_tasks', 'learning_goal', 'reflection'])
    expect(MAX_DAILY_CARDS).toBe(3)
  })

  it('thẻ hợp lệ parse được; route ngoài app bị từ chối', () => {
    expect(CompanionDailyCardSchema.parse(CARD)).toEqual(CARD)
    expect(CompanionDailyCardSchema.safeParse({ ...CARD, route: 'https://x.vn' }).success).toBe(
      false,
    )
    expect(CompanionDailyCardSchema.safeParse({ ...CARD, route: '//x.vn' }).success).toBe(false)
  })

  it('phản hồi quá 3 thẻ bị từ chối', () => {
    const ok = { day: '2026-10-12', cards: [CARD, CARD, CARD] }
    expect(CompanionDailyCardsResponseSchema.safeParse(ok).success).toBe(true)
    const tooMany = { ...ok, cards: [CARD, CARD, CARD, CARD] }
    expect(CompanionDailyCardsResponseSchema.safeParse(tooMany).success).toBe(false)
  })

  it('request phản hồi là strict: trường lạ (personId) bị từ chối', () => {
    const body = { cardId: CARD.id, feedback: 'down' }
    expect(DailyCardFeedbackRequestSchema.safeParse(body).success).toBe(true)
    expect(DailyCardFeedbackRequestSchema.safeParse({ ...body, personId: CARD.id }).success).toBe(
      false,
    )
    expect(DailyCardFeedbackRequestSchema.safeParse({ ...body, feedback: 'meh' }).success).toBe(
      false,
    )
  })
})

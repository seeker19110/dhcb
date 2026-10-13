// packages/core-personal/companionDailyCards.test.ts — "Thẻ hôm nay" (GĐ4a, changelog 0629):
// chọn thẻ thuần, chữ từ số sống, bộ thẻ cố định trong ngày, 👍/👎 thành sở thích, lỗi là lỗi.
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import {
  CompanionDailyCardsResponseSchema,
  type DailyCardKind,
} from '@dhcb/core-contracts/companionDailyCards'
import { NotFoundError } from '@dhcb/core-errors/appError'
import {
  getTodayCards,
  latestReflectionDay,
  purgeOldDailyCards,
  readDailyCardSignals,
  recordCardFeedback,
  renderCard,
  resolveGoalText,
  selectCardKinds,
  type CardPreference,
  type DailyCardSignals,
} from './companionDailyCards.js'

const PERSON_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID = '22222222-2222-4222-8222-222222222222'
const CARD_ID = '33333333-3333-4333-8333-333333333333'
// 08:30 giờ VN ngày 12/10/2026.
const NOW = new Date('2026-10-12T01:30:00Z')
const TODAY = '2026-10-12'

const ALL: DailyCardSignals = {
  srsDueCount: 12,
  dueTaskCount: 2,
  goalText: 'Luyện IELTS',
  dailyMinutes: 20,
  studiedToday: false,
  activeDays7: 4,
  lastReflectionDay: null,
}
const NONE: DailyCardSignals = {
  srsDueCount: 0,
  dueTaskCount: 0,
  goalText: null,
  dailyMinutes: 15,
  studiedToday: false,
  activeDays7: 0,
  lastReflectionDay: null,
}
const NO_PREFS = new Map<DailyCardKind, CardPreference>()

describe('selectCardKinds — tối đa 3 thẻ, đúng điều kiện, theo sở thích', () => {
  it('đủ cả 4 điều kiện ⇒ đúng 3 thẻ theo thứ tự gốc', () => {
    expect(selectCardKinds(ALL, NO_PREFS, NOW)).toEqual([
      'review_due',
      'due_tasks',
      'learning_goal',
    ])
  })

  it('không đủ điều kiện nào ⇒ 0 thẻ (không bịa thẻ cho có)', () => {
    expect(selectCardKinds(NONE, NO_PREFS, NOW)).toEqual([])
  })

  it('mục tiêu: không có mục tiêu hoặc hôm nay đã học ⇒ không chọn', () => {
    const base = { ...NONE, activeDays7: 0 }
    expect(selectCardKinds({ ...base, goalText: 'Du lịch' }, NO_PREFS, NOW)).toEqual([
      'learning_goal',
    ])
    expect(
      selectCardKinds({ ...base, goalText: 'Du lịch', studiedToday: true }, NO_PREFS, NOW),
    ).toEqual([])
  })

  it('phản tỉnh: cần ≥ 2 ngày học trong 7 ngày và chưa viết trong 7 ngày', () => {
    expect(selectCardKinds({ ...NONE, activeDays7: 1 }, NO_PREFS, NOW)).toEqual([])
    expect(selectCardKinds({ ...NONE, activeDays7: 2 }, NO_PREFS, NOW)).toEqual(['reflection'])
    // Viết 6 ngày trước (còn trong cửa sổ 7 ngày) ⇒ chưa mời lại.
    expect(
      selectCardKinds({ ...NONE, activeDays7: 3, lastReflectionDay: '2026-10-06' }, NO_PREFS, NOW),
    ).toEqual([])
    // Viết 7 ngày trước ⇒ ra khỏi cửa sổ ⇒ mời lại.
    expect(
      selectCardKinds({ ...NONE, activeDays7: 3, lastReflectionDay: '2026-10-05' }, NO_PREFS, NOW),
    ).toEqual(['reflection'])
  })

  it('👎 đang tắt ⇒ loại đó không được chọn; tắt đã hết hạn ⇒ chọn lại', () => {
    const muted = new Map<DailyCardKind, CardPreference>([
      ['review_due', { upCount: 0, downCount: 1, mutedUntil: new Date('2026-10-15T00:00:00Z') }],
    ])
    expect(selectCardKinds(ALL, muted, NOW)).toEqual(['due_tasks', 'learning_goal', 'reflection'])
    const expired = new Map<DailyCardKind, CardPreference>([
      ['review_due', { upCount: 0, downCount: 1, mutedUntil: new Date('2026-10-11T00:00:00Z') }],
    ])
    // Hết tắt nhưng điểm ròng âm ⇒ xếp sau các loại trung tính.
    expect(selectCardKinds(ALL, expired, NOW)).toEqual(['due_tasks', 'learning_goal', 'reflection'])
  })

  it('👍 nhiều hơn ⇒ xếp trước, đẩy được loại khác ra khỏi 3 chỗ', () => {
    const liked = new Map<DailyCardKind, CardPreference>([
      ['reflection', { upCount: 2, downCount: 0, mutedUntil: null }],
    ])
    expect(selectCardKinds(ALL, liked, NOW)).toEqual(['reflection', 'review_due', 'due_tasks'])
  })
})

describe('renderCard — chữ từ số SỐNG, tự chuyển "Đã xong"', () => {
  const snap = { srsDueCount: 12, dueTaskCount: 2, goalText: 'Luyện IELTS', activeDays7: 4 }

  it('thẻ ôn: số sống thay số lúc dựng; hết thẻ ⇒ done', () => {
    const open = renderCard('review_due', { ...ALL, srsDueCount: 7 }, snap, NOW)
    expect(open.status).toBe('open')
    expect(open.body).toContain('7 thẻ')
    expect(open.body).not.toContain('12')
    expect(renderCard('review_due', { ...ALL, srsDueCount: 0 }, snap, NOW).status).toBe('done')
  })

  it('việc đến hạn: hết việc ⇒ done', () => {
    expect(renderCard('due_tasks', ALL, snap, NOW).body).toContain('2 việc')
    expect(renderCard('due_tasks', { ...ALL, dueTaskCount: 0 }, snap, NOW).status).toBe('done')
  })

  it('mục tiêu: đã học hôm nay ⇒ done; mục tiêu bị xoá giữa ngày ⇒ dùng chữ lúc dựng', () => {
    expect(renderCard('learning_goal', ALL, snap, NOW).body).toContain('20 phút')
    expect(renderCard('learning_goal', { ...ALL, studiedToday: true }, snap, NOW).status).toBe(
      'done',
    )
    expect(renderCard('learning_goal', { ...ALL, goalText: null }, snap, NOW).body).toContain(
      'Luyện IELTS',
    )
  })

  it('phản tỉnh: viết hôm nay ⇒ done; route mở đúng studio có nhật ký', () => {
    const open = renderCard('reflection', ALL, snap, NOW)
    expect(open.route).toBe('/ban-dong-hanh?studio=cognitive')
    expect(open.body).toContain('4 ngày')
    expect(renderCard('reflection', { ...ALL, lastReflectionDay: TODAY }, snap, NOW).status).toBe(
      'done',
    )
  })

  it('không thẻ nào nhắc chuỗi ngày (streak) hay dùng giọng trách', () => {
    const kinds: DailyCardKind[] = ['review_due', 'due_tasks', 'learning_goal', 'reflection']
    for (const kind of kinds) {
      for (const live of [ALL, { ...ALL, srsDueCount: 0, dueTaskCount: 0, studiedToday: true }]) {
        const { title, body } = renderCard(kind, live, snap, NOW)
        expect(`${title} ${body}`).not.toMatch(/streak|chuỗi|mất chuỗi|đừng bỏ|tiếc/i)
      }
    }
  })
})

describe('resolveGoalText / latestReflectionDay', () => {
  it('mục tiêu Companion thắng onboarding; dài thì cắt; mã onboarding lạ ⇒ null', () => {
    expect(resolveGoalText('  Thi IELTS 6.5   tháng 12 ', 'travel')).toBe('Thi IELTS 6.5 tháng 12')
    expect(resolveGoalText(null, 'travel')).toBe('Du lịch')
    expect(resolveGoalText({ x: 1 }, 'ielts')).toBe('Luyện IELTS')
    expect(resolveGoalText(null, 'secret_code')).toBeNull()
    expect(resolveGoalText(null, 'constructor')).toBeNull()
    const long = resolveGoalText('a'.repeat(200), null)
    expect(long?.length).toBe(80)
    expect(long?.endsWith('…')).toBe(true)
  })

  it('ngày phản tỉnh gần nhất theo giờ VN; dữ liệu hỏng bị bỏ qua', () => {
    expect(latestReflectionDay(null)).toBeNull()
    expect(latestReflectionDay([{ createdAt: 'hỏng' }, {}])).toBeNull()
    // 18:30 UTC ngày 11 = 01:30 giờ VN ngày 12.
    expect(
      latestReflectionDay([
        { createdAt: '2026-10-01T00:00:00Z' },
        { createdAt: '2026-10-11T18:30:00Z' },
      ]),
    ).toBe('2026-10-12')
  })
})

// ─── Pool giả ────────────────────────────────────────────────────────────────

interface StoredCard {
  id: string
  person_id: string
  vn_day: string
  kind: string
  position: number
  snapshot: unknown
  feedback: string | null
}

function fakePool(opts: {
  srs?: Record<string, { due: number }>
  dueTasks?: number
  coachGoal?: unknown
  profileGoal?: string | null
  usageDays?: string[]
  reflections?: unknown
  prefs?: { kind: string; up_count: number; down_count: number; muted_until: Date | null }[]
  cards?: StoredCard[]
  failOn?: 'usage'
}) {
  const calls: { sql: string; params: unknown[] }[] = []
  const cards: StoredCard[] = opts.cards ?? []
  let nextId = 1
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params })
    if (/^\s*(begin|commit|rollback)\s*$/i.test(sql)) return { rows: [] }
    if (sql.includes('public.profiles')) {
      return { rows: [{ onboarded: true, goal: opts.profileGoal ?? null, daily_minutes: 20 }] }
    }
    if (sql.includes('english.learning_progress')) {
      return {
        rows: [{ learned: [], srs: opts.srs ?? {}, placement: null, updated_at: new Date() }],
      }
    }
    if (sql.includes('worklife.tasks')) {
      return { rows: [{ open_count: opts.dueTasks ?? 0, due_count: opts.dueTasks ?? 0 }] }
    }
    if (sql.includes('personal.personal_facts')) {
      return { rows: opts.coachGoal === undefined ? [] : [{ value: opts.coachGoal }] }
    }
    if (sql.includes('public.daily_usage')) {
      if (opts.failOn === 'usage') throw new Error('db down')
      return { rows: (opts.usageDays ?? []).map((day) => ({ day })) }
    }
    if (sql.includes('platform.feature_state')) {
      return { rows: opts.reflections === undefined ? [] : [{ state: opts.reflections }] }
    }
    if (sql.includes('delete from personal.companion_daily_cards')) return { rows: [], rowCount: 4 }
    if (sql.includes('from personal.companion_card_preferences')) {
      return { rows: opts.prefs ?? [] }
    }
    if (sql.includes('insert into personal.companion_card_preferences')) {
      return { rows: [], rowCount: 1 }
    }
    if (sql.includes('insert into personal.companion_daily_cards')) {
      const [personId, day, kinds, positions, snapshot] = params as [
        string,
        string,
        string[],
        number[],
        string,
      ]
      kinds.forEach((kind, i) => {
        cards.push({
          id: `00000000-0000-4000-8000-00000000000${nextId++}`,
          person_id: personId,
          vn_day: day,
          kind,
          position: positions[i] ?? 0,
          snapshot: JSON.parse(snapshot),
          feedback: null,
        })
      })
      return { rows: [], rowCount: kinds.length }
    }
    if (sql.includes('for update')) {
      const [id, personId] = params as [string, string]
      return { rows: cards.filter((c) => c.id === id && c.person_id === personId) }
    }
    if (sql.includes('update personal.companion_daily_cards')) {
      const [feedback, , id] = params as [string, string, string]
      const card = cards.find((c) => c.id === id)
      if (card) card.feedback = feedback
      return { rows: [], rowCount: card ? 1 : 0 }
    }
    if (sql.includes('from personal.companion_daily_cards')) {
      const [personId, day] = params as [string, string]
      return {
        rows: cards
          .filter((c) => c.person_id === personId && c.vn_day === day)
          .sort((a, b) => a.position - b.position),
      }
    }
    throw new Error(`SQL ngoài dự kiến: ${sql}`)
  })
  const release = vi.fn()
  const pool = {
    query,
    connect: vi.fn(async () => ({ query, release })),
  } as unknown as Pool
  return { pool, calls, cards }
}

const SUBJECT = { personId: PERSON_ID, userId: USER_ID }
const DUE_SRS = { 'w:a': { due: Date.now() - 60_000 }, 'w:b': { due: Date.now() - 60_000 } }

describe('readDailyCardSignals — số thật, đúng id, lỗi là lỗi', () => {
  it('truyền personId cho bảng personal/worklife, userId cho bảng public/platform', async () => {
    const { pool, calls } = fakePool({
      srs: DUE_SRS,
      dueTasks: 3,
      coachGoal: 'Nói trôi chảy khi đi công tác',
      usageDays: [TODAY, '2026-10-10'],
      reflections: [{ createdAt: '2026-10-01T03:00:00Z' }],
    })
    const s = await readDailyCardSignals(pool, SUBJECT, NOW)
    expect(s).toMatchObject({
      srsDueCount: 2,
      dueTaskCount: 3,
      goalText: 'Nói trôi chảy khi đi công tác',
      studiedToday: true,
      activeDays7: 2,
      lastReflectionDay: '2026-10-01',
    })
    const byTable = (needle: string) => calls.find((c) => c.sql.includes(needle))?.params[0]
    expect(byTable('personal.personal_facts')).toBe(PERSON_ID)
    expect(byTable('worklife.tasks')).toBe(PERSON_ID)
    expect(byTable('public.daily_usage')).toBe(USER_ID)
    expect(byTable('platform.feature_state')).toBe(USER_ID)
    // Cửa sổ 7 ngày giờ VN, tính cả hôm nay.
    expect(calls.find((c) => c.sql.includes('public.daily_usage'))?.params.slice(1)).toEqual([
      '2026-10-06',
      TODAY,
    ])
  })

  it('CSDL lỗi ⇒ ném ra, không trả số mặc định', async () => {
    const { pool } = fakePool({ failOn: 'usage' })
    await expect(readDailyCardSignals(pool, SUBJECT, NOW)).rejects.toThrow('db down')
  })
})

describe('getTodayCards — bộ thẻ cố định trong ngày', () => {
  it('lần mở đầu ngày ghi thẻ, lần sau không ghi thêm; phản hồi khớp hợp đồng', async () => {
    const { pool, calls, cards } = fakePool({
      srs: DUE_SRS,
      dueTasks: 1,
      profileGoal: 'ielts',
      usageDays: ['2026-10-10', '2026-10-11'],
    })
    const first = await getTodayCards(pool, SUBJECT, NOW)
    expect(CompanionDailyCardsResponseSchema.parse(first)).toEqual(first)
    expect(first.day).toBe(TODAY)
    expect(first.cards.map((c) => c.kind)).toEqual(['review_due', 'due_tasks', 'learning_goal'])
    expect(cards).toHaveLength(3)
    expect(cards[0]?.snapshot).toMatchObject({ srsDueCount: 2, dueTaskCount: 1 })

    const inserts = () => calls.filter((c) => c.sql.includes('insert into')).length
    expect(inserts()).toBe(1)
    const second = await getTodayCards(pool, SUBJECT, NOW)
    expect(inserts()).toBe(1)
    expect(second.cards.map((c) => c.id)).toEqual(first.cards.map((c) => c.id))
  })

  it('ngày không đủ điều kiện ⇒ không ghi gì, trả rỗng', async () => {
    const { pool, calls } = fakePool({})
    const res = await getTodayCards(pool, SUBJECT, NOW)
    expect(res.cards).toEqual([])
    expect(calls.some((c) => c.sql.includes('insert into'))).toBe(false)
  })

  it('dòng mang kind lạ trong CSDL bị bỏ qua, không làm hỏng cả bộ', async () => {
    const { pool } = fakePool({
      srs: DUE_SRS,
      cards: [
        {
          id: CARD_ID,
          person_id: PERSON_ID,
          vn_day: TODAY,
          kind: 'career',
          position: 1,
          snapshot: {},
          feedback: null,
        },
      ],
    })
    expect((await getTodayCards(pool, SUBJECT, NOW)).cards).toEqual([])
  })
})

describe('recordCardFeedback — 👍/👎 thành sở thích', () => {
  const stored = (feedback: string | null): StoredCard => ({
    id: CARD_ID,
    person_id: PERSON_ID,
    vn_day: TODAY,
    kind: 'review_due',
    position: 1,
    snapshot: {},
    feedback,
  })
  const prefUpsert = (calls: { sql: string; params: unknown[] }[]) =>
    calls.find((c) => c.sql.includes('insert into personal.companion_card_preferences'))

  it('👎 lần đầu ⇒ down +1, tắt 7 ngày', async () => {
    const { pool, calls, cards } = fakePool({ cards: [stored(null)] })
    await expect(recordCardFeedback(pool, PERSON_ID, CARD_ID, 'down', NOW)).resolves.toEqual({
      cardId: CARD_ID,
      feedback: 'down',
    })
    expect(prefUpsert(calls)?.params).toEqual([
      PERSON_ID,
      'review_due',
      0,
      1,
      '2026-10-19T01:30:00.000Z',
    ])
    expect(cards[0]?.feedback).toBe('down')
  })

  it('đổi ý 👎 → 👍 ⇒ down −1, up +1, bỏ tắt', async () => {
    const { pool, calls } = fakePool({ cards: [stored('down')] })
    await recordCardFeedback(pool, PERSON_ID, CARD_ID, 'up', NOW)
    expect(prefUpsert(calls)?.params).toEqual([PERSON_ID, 'review_due', 1, -1, null])
  })

  it('bấm lại cùng nút ⇒ lũy đẳng, không đếm thêm', async () => {
    const { pool, calls } = fakePool({ cards: [stored('up')] })
    await recordCardFeedback(pool, PERSON_ID, CARD_ID, 'up', NOW)
    expect(prefUpsert(calls)).toBeUndefined()
  })

  it('thẻ của người khác ⇒ NotFoundError, không ghi gì', async () => {
    const { pool, calls } = fakePool({ cards: [{ ...stored(null), person_id: 'someone-else' }] })
    await expect(recordCardFeedback(pool, PERSON_ID, CARD_ID, 'down', NOW)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(prefUpsert(calls)).toBeUndefined()
    expect(calls.some((c) => c.sql.includes('rollback'))).toBe(true)
  })
})

describe('purgeOldDailyCards', () => {
  it('xoá thẻ cũ hơn 90 ngày theo ngày giờ VN', async () => {
    const { pool, calls } = fakePool({})
    await expect(purgeOldDailyCards(pool, NOW)).resolves.toBe(4)
    expect(calls[0]?.params).toEqual(['2026-07-14'])
  })
})

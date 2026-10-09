// POST /api/learning/evidence?action=cefr-dialogue — server CHẤM LẠI kiểm tra hiểu hội thoại.
// Đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §④–⑤.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sec = vi.hoisted(() => ({
  user: { userId: 'user-1' } as { userId: string } | null,
  ipOk: true,
  userOk: true,
  /** Khoá lượt đã tiêu (mô phỏng Redis): lần 2 cùng khoá → false. */
  used: new Set<string>(),
  resetCalls: [] as string[],
  logs: [] as unknown[][],
}))

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async (_subject: string, _max: number, bucket: string) =>
    bucket === 'cefr-dialogue-check' ? sec.userOk : sec.ipOk,
  validateAuth: async () => sec.user,
  logSecurityEvent: (...args: unknown[]) => {
    sec.logs.push(args)
  },
  consumeWindowCounter: async (key: string) => {
    if (sec.used.has(key)) return false
    sec.used.add(key)
    return true
  },
  resetCounter: async (key: string) => {
    sec.resetCalls.push(key)
    sec.used.delete(key)
  },
}))

const query = vi.hoisted(() => vi.fn())
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query }) }))
vi.mock('@dhcb/core-db/transaction', () => ({
  withTransaction: async (_pool: unknown, fn: (c: unknown) => Promise<unknown>) => fn({ query }),
}))
vi.mock('../_lib/referral.js', () => ({ rewardReferralIfEligible: vi.fn(async () => {}) }))

import handler from './evidence.js'
import { findCefrDialogue } from '@dhcb/subject-english/dialogueData'
import {
  buildComprehensionQuiz,
  comprehensionSeed,
  type ComprehensionDirection,
} from '@dhcb/subject-english/dialogueComprehension'
import {
  DialogueCheckResultSchema,
  learnedDialogueEntry,
} from '@dhcb/core-contracts/cefrDialogueCheck'

const OWNER = 'a1-greetings'
const TITLE = 'Meeting in class'
const URL_ = 'http://localhost/api/learning/evidence?action=cefr-dialogue'

function quiz(dir: ComprehensionDirection = 'A', attempt = 7) {
  const d = findCefrDialogue(OWNER, TITLE)
  if (!d) throw new Error('thiếu dữ liệu hội thoại thật')
  return buildComprehensionQuiz(d, dir, comprehensionSeed(OWNER, TITLE, dir, attempt))
}

/** `wrong` = số câu (tính từ cuối) cố ý chọn sai. */
function answers(dir: ComprehensionDirection = 'A', attempt = 7, wrong = 0) {
  const q = quiz(dir, attempt)
  return q.map((x, i) => ({
    questionId: x.id,
    optionId: i >= q.length - wrong ? x.options.find((o) => o.id !== x.correctId)!.id : x.correctId,
  }))
}

function body(over: Record<string, unknown> = {}) {
  return {
    ownerId: OWNER,
    titleEn: TITLE,
    direction: 'A',
    attempt: 7,
    answers: answers(),
    ...over,
  }
}

function post(payload: unknown, url = URL_) {
  return handler(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    }),
  )
}

/** Dòng tiến độ hiện có trong DB (mock câu `select cefr_dialogues … for update`). */
let existingRow: { cefr_dialogues: string[] } | undefined

beforeEach(() => {
  query.mockReset()
  sec.user = { userId: 'user-1' }
  sec.ipOk = true
  sec.userOk = true
  sec.used.clear()
  sec.resetCalls.length = 0
  sec.logs.length = 0
  existingRow = undefined
  query.mockImplementation(async (sql: string) => {
    if (sql.includes('select cefr_dialogues')) return { rows: existingRow ? [existingRow] : [] }
    return { rows: [] }
  })
})

const insertCall = () =>
  query.mock.calls.find(([sql]) => String(sql).includes('insert into english.learning_progress'))

describe('cefr-dialogue — cửa an ninh', () => {
  it('chưa đăng nhập → 401, không chấm, không ghi', async () => {
    sec.user = null
    const res = await post(body())
    expect(res.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('quá giới hạn THEO TÀI KHOẢN → 429 kèm Retry-After, không chấm, không tiêu lượt', async () => {
    sec.userOk = false
    const res = await post(body())
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(sec.used.size).toBe(0)
    // Log an ninh KHÔNG chứa userId/tên hội thoại (không PII).
    expect(JSON.stringify(sec.logs)).not.toContain('user-1')
    expect(JSON.stringify(sec.logs)).not.toContain(TITLE)
  })

  it('Zod: field lạ (client tự khai passed/correct) → 400', async () => {
    expect((await post(body({ passed: true }))).status).toBe(400)
    expect((await post(body({ correct: 3 }))).status).toBe(400)
  })

  it('Zod: thiếu/sai kiểu → 400 (ownerId lạ, attempt âm, chiều lạ, id phương án lạ, >3 câu)', async () => {
    expect((await post(body({ ownerId: '../etc' }))).status).toBe(400)
    expect((await post(body({ attempt: -1 }))).status).toBe(400)
    expect((await post(body({ attempt: 1.5 }))).status).toBe(400)
    expect((await post(body({ direction: 'C' }))).status).toBe(400)
    expect(
      (await post(body({ answers: [{ questionId: 'meaning-1', optionId: 'o9' }] }))).status,
    ).toBe(400)
    const four = Array.from({ length: 4 }, (_, i) => ({
      questionId: `meaning-${i}`,
      optionId: 'o0',
    }))
    expect((await post(body({ answers: four }))).status).toBe(400)
    expect((await post('không phải json')).status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('action lạ → 400 BAD_ACTION (không rơi nhầm sang luồng STEM)', async () => {
    const res = await post(body(), 'http://localhost/api/learning/evidence?action=khac')
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('BAD_ACTION')
  })

  it('hội thoại không tồn tại → 400 CONTENT_NOT_FOUND', async () => {
    const res = await post(body({ titleEn: 'Không có thật' }))
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('CONTENT_NOT_FOUND')
  })
})

describe('cefr-dialogue — server chấm lại', () => {
  it('đúng hết → đạt, GHI "learned|…" + "đã xem" (UNION), trả đáp án SAU khi nộp', async () => {
    const res = await post(body())
    expect(res.status).toBe(200)
    const json = DialogueCheckResultSchema.parse(await res.json())
    expect(json).toMatchObject({ correct: 3, total: 3, required: 2, passed: true, saved: true })
    expect(json.items.map((i) => i.correctId)).toEqual(quiz().map((q) => q.correctId))
    const call = insertCall()!
    expect((call[1] as unknown[])[0]).toBe('user-1') // userId từ TOKEN
    expect(JSON.parse((call[1] as unknown[])[1] as string)).toEqual([
      `${OWNER}:${TITLE}`,
      learnedDialogueEntry(OWNER, TITLE),
    ])
    // Câu SQL nối kiểu UNION, không ghi đè mảng có sẵn.
    expect(String(call[0])).toContain('english.learning_progress.cefr_dialogues ||')
    expect(
      query.mock.calls.some(([sql]) => String(sql).includes('grant_daily_bonus_rolling')),
    ).toBe(true)
  })

  it('2/3 đúng → vẫn đạt (ngưỡng ceil(2·3/3))', async () => {
    const json = DialogueCheckResultSchema.parse(
      await (await post(body({ answers: answers('A', 7, 1) }))).json(),
    )
    expect(json).toMatchObject({ correct: 2, passed: true, saved: true })
  })

  it('1/3 đúng → chưa đạt, KHÔNG ghi gì, saved=false', async () => {
    const res = await post(body({ answers: answers('A', 7, 2) }))
    const json = DialogueCheckResultSchema.parse(await res.json())
    expect(json).toMatchObject({ correct: 1, passed: false, saved: false })
    expect(insertCall()).toBeUndefined()
  })

  it('thiếu câu (gửi 1/3 câu, dù đúng) → câu bỏ trống tính sai → chưa đạt', async () => {
    const one = answers().slice(0, 1)
    const json = DialogueCheckResultSchema.parse(await (await post(body({ answers: one }))).json())
    expect(json).toMatchObject({ correct: 1, total: 3, passed: false })
    expect(json.items.filter((i) => i.chosenId === null)).toHaveLength(2)
  })

  it('đáp án của SEED KHÁC (attempt khác) → id câu lệch → 409 QUIZ_MISMATCH hoặc chấm sai; không bao giờ đạt nhờ chép', async () => {
    // Tìm một attempt mà đề có id câu khác attempt 7 — gửi đáp án của attempt 7 cho nó.
    let other = 8
    const ids7 = quiz('A', 7)
      .map((q) => q.id)
      .join()
    while (
      quiz('A', other)
        .map((q) => q.id)
        .join() === ids7
    )
      other++
    const res = await post(body({ attempt: other, answers: answers('A', 7) }))
    expect(res.status).toBe(409)
    expect(((await res.json()) as { code: string }).code).toBe('QUIZ_MISMATCH')
    expect(insertCall()).toBeUndefined()
    // Lượt KHÔNG bị tiêu khi lệch đề (người học tải lại trang rồi làm tiếp được).
    expect(sec.used.size).toBe(0)
  })

  it('chiều B chấm theo đề chiều B (cùng owner/attempt nhưng đề khác chiều A)', async () => {
    const res = await post(body({ direction: 'B', answers: answers('B') }))
    const json = DialogueCheckResultSchema.parse(await res.json())
    expect(json.passed).toBe(true)
    expect(json.items.map((i) => i.correctId)).toEqual(quiz('B').map((q) => q.correctId))
  })

  it('MỖI LƯỢT CHỈ CHẤM MỘT LẦN: nộp bừa xem đáp án rồi nộp lại đúng lượt đó → 409 ATTEMPT_USED', async () => {
    const lan1 = await post(body({ answers: answers('A', 7, 3) }))
    expect(((await lan1.json()) as { passed: boolean }).passed).toBe(false)
    const lan2 = await post(body())
    expect(lan2.status).toBe(409)
    const j = (await lan2.json()) as { code: string; items?: unknown }
    expect(j.code).toBe('ATTEMPT_USED')
    expect(j.items).toBeUndefined() // không lộ gì thêm
    expect(insertCall()).toBeUndefined()
  })

  it('khoá lượt là bản BĂM — không chứa userId/tên hội thoại', async () => {
    await post(body())
    const [key] = [...sec.used]
    expect(key).toMatch(/^cefr-dialogue-attempt:[0-9a-f]{64}$/)
  })

  it('đã học từ trước → saved=true, không ghi lại, không cộng thưởng lần nữa', async () => {
    existingRow = { cefr_dialogues: [`${OWNER}:${TITLE}`, learnedDialogueEntry(OWNER, TITLE)] }
    const json = DialogueCheckResultSchema.parse(await (await post(body())).json())
    expect(json.saved).toBe(true)
    expect(insertCall()).toBeUndefined()
    expect(
      query.mock.calls.some(([sql]) => String(sql).includes('grant_daily_bonus_rolling')),
    ).toBe(false)
  })

  it('ghi DB lỗi → 500 và TRẢ LẠI lượt (reset bộ đếm) để gửi lại được', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select cefr_dialogues')) return { rows: [] }
      if (sql.includes('insert into english.learning_progress')) throw new Error('db down')
      return { rows: [] }
    })
    const res = await post(body())
    expect(res.status).toBe(500)
    expect(sec.resetCalls).toHaveLength(1)
    expect(sec.used.size).toBe(0)
  })

  it('cộng thưởng lỗi → vẫn 200 (fail-open), "đã học" đã ghi', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select cefr_dialogues')) return { rows: [] }
      if (sql.includes('grant_daily_bonus_rolling')) throw new Error('db down')
      return { rows: [] }
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await post(body())
    expect(res.status).toBe(200)
    expect(insertCall()).toBeTruthy()
    warn.mockRestore()
  })
})

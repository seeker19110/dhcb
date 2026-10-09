// POST /api/learning/evidence?action=cefr-dialogue-start / cefr-dialogue — server CẤP LƯỢT (token
// HMAC, seed ẩn) và CHẤM LẠI kiểm tra hiểu hội thoại. Đặc tả
// docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §④–⑤ +
// docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md §④.
import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sec = vi.hoisted(() => ({
  user: { userId: 'user-1' } as { userId: string } | null,
  ipOk: true,
  userOk: true,
  startOk: true,
  /** Khoá lượt đã tiêu (mô phỏng Redis): lần 2 cùng khoá → false. */
  used: new Set<string>(),
  resetCalls: [] as string[],
  logs: [] as unknown[][],
  /** Mô phỏng Redis production không sẵn sàng: 'all' = mọi bộ đếm, 'lock' = chỉ bộ đếm lượt. */
  unavailable: null as 'all' | 'lock' | null,
  /** Trả lại lượt thất bại (Redis hỏng lúc reset). */
  resetFails: false,
}))

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => sec.ipOk,
  validateAuth: async () => sec.user,
  logSecurityEvent: (...args: unknown[]) => {
    sec.logs.push(args)
  },
  consumeWindowCounterStatus: async (key: string) => {
    const isSubmitRate = key.startsWith('cefr-dialogue-check:')
    const isStartRate = key.startsWith('cefr-dialogue-start:')
    const isRate = isSubmitRate || isStartRate
    if (sec.unavailable === 'all' || (sec.unavailable === 'lock' && !isRate)) return 'unavailable'
    if (isStartRate) return sec.startOk ? 'ok' : 'exhausted'
    if (isSubmitRate) return sec.userOk ? 'ok' : 'exhausted'
    if (sec.used.has(key)) return 'exhausted'
    sec.used.add(key)
    return 'ok'
  },
  resetCounterChecked: async (key: string) => {
    sec.resetCalls.push(key)
    if (sec.resetFails) return false
    sec.used.delete(key)
    return true
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
  type ComprehensionDirection,
  type ComprehensionQuestion,
} from '@dhcb/subject-english/dialogueComprehension'
import {
  DialogueCheckResultSchema,
  DialogueStartResultSchema,
  learnedDialogueEntry,
} from '@dhcb/core-contracts/cefrDialogueCheck'
import {
  hiddenSeedFor,
  resetAttemptTokenKeyForTests,
  signAttemptToken,
  verifyAttemptToken,
} from '@dhcb/core-auth/attemptToken'
import { ATTEMPT_SCOPE, ATTEMPT_TTL_MS } from '../_lib/cefrDialogueCheck.js'

const OWNER = 'a1-greetings'
const TITLE = 'Meeting in class'
const URL_SUBMIT = 'http://localhost/api/learning/evidence?action=cefr-dialogue'
const URL_START = 'http://localhost/api/learning/evidence?action=cefr-dialogue-start'
const KEY = randomBytes(32).toString('base64')

function post(payload: unknown, url = URL_SUBMIT) {
  return handler(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    }),
  )
}

/** Mở một lượt thật qua handler; trả token + đề công khai. */
async function start(dir: ComprehensionDirection = 'A') {
  const res = await post({ ownerId: OWNER, titleEn: TITLE, direction: dir }, URL_START)
  expect(res.status).toBe(200)
  return DialogueStartResultSchema.parse(await res.json())
}

/**
 * "Oracle" của test: cầm KHOÁ SERVER nên suy được seed ẩn → dựng đề đầy đủ (có đáp án). Client thật
 * không làm được việc này — chính là điều đợt 0558 muốn.
 */
function fullQuiz(token: string, dir: ComprehensionDirection = 'A'): ComprehensionQuestion[] {
  const v = verifyAttemptToken(ATTEMPT_SCOPE, token)
  if (!v.ok) throw new Error('token không verify được: ' + v.reason)
  const d = findCefrDialogue(OWNER, TITLE)
  if (!d) throw new Error('thiếu dữ liệu hội thoại thật')
  return buildComprehensionQuiz(d, dir, hiddenSeedFor(ATTEMPT_SCOPE, v.signature))
}

/** `wrong` = số câu (tính từ cuối) cố ý chọn sai. */
function answersFor(token: string, wrong = 0, dir: ComprehensionDirection = 'A') {
  const q = fullQuiz(token, dir)
  return q.map((x, i) => ({
    questionId: x.id,
    optionId: i >= q.length - wrong ? x.options.find((o) => o.id !== x.correctId)!.id : x.correctId,
  }))
}

/** Mở lượt + nộp với `wrong` câu sai. */
async function startAndSubmit(wrong = 0, dir: ComprehensionDirection = 'A') {
  const { token } = await start(dir)
  const res = await post({ token, answers: answersFor(token, wrong, dir) })
  return { token, res }
}

const insertCall = () =>
  query.mock.calls.find(([sql]) => String(sql).includes('insert into english.learning_progress'))

/** Dòng tiến độ hiện có trong DB (mock câu `select cefr_dialogues … for update`). */
let existingRow: { cefr_dialogues: string[] } | undefined

beforeEach(() => {
  vi.stubEnv('USER_DATA_MASTER_KEY', KEY)
  vi.stubEnv('NODE_ENV', 'test')
  resetAttemptTokenKeyForTests()
  query.mockReset()
  sec.user = { userId: 'user-1' }
  sec.ipOk = true
  sec.userOk = true
  sec.startOk = true
  sec.used.clear()
  sec.resetCalls.length = 0
  sec.logs.length = 0
  sec.unavailable = null
  sec.resetFails = false
  existingRow = undefined
  query.mockImplementation(async (sql: string) => {
    if (sql.includes('select cefr_dialogues')) return { rows: existingRow ? [existingRow] : [] }
    return { rows: [] }
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  resetAttemptTokenKeyForTests()
})

describe('cefr-dialogue-start — mở lượt', () => {
  it('chưa đăng nhập → 401, không cấp token', async () => {
    sec.user = null
    const res = await post({ ownerId: OWNER, titleEn: TITLE, direction: 'A' }, URL_START)
    expect(res.status).toBe(401)
  })

  it('trả token + đề CÔNG KHAI: không correctId, không explanation, không seed; expiresAt = TTL', async () => {
    const before = Date.now()
    const res = await post({ ownerId: OWNER, titleEn: TITLE, direction: 'A' }, URL_START)
    const text = await res.text()
    expect(text).not.toContain('correctId')
    expect(text).not.toContain('explanation')
    const json = DialogueStartResultSchema.parse(JSON.parse(text))
    expect(json.questions).toHaveLength(3)
    expect(json.expiresAt).toBeGreaterThanOrEqual(before + ATTEMPT_TTL_MS)
    // Seed ẩn không xuất hiện ở bất kỳ đâu trong thân phản hồi.
    const v = verifyAttemptToken(ATTEMPT_SCOPE, json.token)
    if (!v.ok) throw new Error('token phải verify được')
    expect(text).not.toContain(hiddenSeedFor(ATTEMPT_SCOPE, v.signature))
    // Đề công khai khớp đề đầy đủ (cùng seed) sau khi bỏ đáp án.
    const full = fullQuiz(json.token)
    expect(json.questions.map((q) => q.id)).toEqual(full.map((q) => q.id))
    expect(json.questions.map((q) => q.options.map((o) => o.text))).toEqual(
      full.map((q) => q.options.map((o) => o.text)),
    )
  })

  it('hai lần mở cùng hội thoại → hai token khác nhau, seed ẩn khác nhau', async () => {
    const a = await start()
    const b = await start()
    expect(a.token).not.toBe(b.token)
    const va = verifyAttemptToken(ATTEMPT_SCOPE, a.token)
    const vb = verifyAttemptToken(ATTEMPT_SCOPE, b.token)
    if (!va.ok || !vb.ok) throw new Error('phải verify được')
    expect(hiddenSeedFor(ATTEMPT_SCOPE, va.signature)).not.toBe(
      hiddenSeedFor(ATTEMPT_SCOPE, vb.signature),
    )
  })

  it('token gắn userId của phiên đăng nhập + chiều + hội thoại', async () => {
    const { token } = await start('B')
    const v = verifyAttemptToken(ATTEMPT_SCOPE, token)
    if (!v.ok) throw new Error('phải verify được')
    expect(v.payload).toMatchObject({ u: 'user-1', o: OWNER, t: TITLE, d: 'B' })
  })

  it('quá 12 lượt mở/phút theo tài khoản → 429 Retry-After, không lộ PII trong log', async () => {
    sec.startOk = false
    const res = await post({ ownerId: OWNER, titleEn: TITLE, direction: 'A' }, URL_START)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(JSON.stringify(sec.logs)).not.toContain('user-1')
    expect(JSON.stringify(sec.logs)).not.toContain(TITLE)
  })

  it('Zod: field lạ / ownerId lạ / chiều lạ / không phải JSON → 400', async () => {
    const bad = [
      { ownerId: OWNER, titleEn: TITLE, direction: 'A', attempt: 1 },
      { ownerId: '../etc', titleEn: TITLE, direction: 'A' },
      { ownerId: OWNER, titleEn: TITLE, direction: 'C' },
      'không phải json',
    ]
    for (const b of bad) expect((await post(b, URL_START)).status).toBe(400)
  })

  it('hội thoại không tồn tại → 400 CONTENT_NOT_FOUND', async () => {
    const res = await post({ ownerId: OWNER, titleEn: 'Không có thật', direction: 'A' }, URL_START)
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('CONTENT_NOT_FOUND')
  })

  it('thiếu USER_DATA_MASTER_KEY ở production → 503 SERVICE_UNAVAILABLE + console.error, không cấp token', async () => {
    vi.stubEnv('USER_DATA_MASTER_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    resetAttemptTokenKeyForTests()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post({ ownerId: OWNER, titleEn: TITLE, direction: 'A' }, URL_START)
    expect(res.status).toBe(503)
    expect(((await res.json()) as { code: string }).code).toBe('SERVICE_UNAVAILABLE')
    expect(err).toHaveBeenCalledTimes(1)
    expect(String(err.mock.calls[0]![1])).toContain('USER_DATA_MASTER_KEY')
  })

  it('Redis không sẵn sàng (production) → 503, không cấp token', async () => {
    sec.unavailable = 'all'
    const res = await post({ ownerId: OWNER, titleEn: TITLE, direction: 'A' }, URL_START)
    expect(res.status).toBe(503)
  })
})

describe('cefr-dialogue — cửa an ninh khi nộp', () => {
  it('chưa đăng nhập → 401, không chấm, không ghi', async () => {
    const { token } = await start()
    sec.user = null
    const res = await post({ token, answers: answersFor(token) })
    expect(res.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('quá giới hạn THEO TÀI KHOẢN → 429 kèm Retry-After, không chấm, không tiêu lượt', async () => {
    const { token } = await start()
    sec.userOk = false
    const res = await post({ token, answers: answersFor(token) })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(sec.used.size).toBe(0)
    expect(JSON.stringify(sec.logs)).not.toContain('user-1')
    expect(JSON.stringify(sec.logs)).not.toContain(TITLE)
  })

  it('Zod: field lạ (client tự khai passed/correct/attempt) → 400', async () => {
    const { token } = await start()
    const answers = answersFor(token)
    expect((await post({ token, answers, passed: true })).status).toBe(400)
    expect((await post({ token, answers, correct: 3 })).status).toBe(400)
    expect((await post({ token, answers, attempt: 7 })).status).toBe(400)
  })

  it('Zod: thiếu token / id phương án lạ / >3 câu / không phải JSON → 400, không chạm DB', async () => {
    const { token } = await start()
    expect((await post({ answers: answersFor(token) })).status).toBe(400)
    expect(
      (await post({ token, answers: [{ questionId: 'meaning-1', optionId: 'o9' }] })).status,
    ).toBe(400)
    const four = Array.from({ length: 4 }, (_, i) => ({
      questionId: `meaning-${i}`,
      optionId: 'o0',
    }))
    expect((await post({ token, answers: four })).status).toBe(400)
    expect((await post('không phải json')).status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('action lạ → 400 BAD_ACTION (không rơi nhầm sang luồng STEM)', async () => {
    const res = await post({}, 'http://localhost/api/learning/evidence?action=khac')
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('BAD_ACTION')
  })

  it('token sửa một ký tự → 409 ATTEMPT_EXPIRED + sự kiện ATTEMPT_TOKEN_REJECTED, không chấm', async () => {
    const { token } = await start()
    const answers = answersFor(token)
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')
    const res = await post({ token: tampered, answers })
    expect(res.status).toBe(409)
    expect(((await res.json()) as { code: string }).code).toBe('ATTEMPT_EXPIRED')
    expect(sec.logs.some((l) => l[0] === 'ATTEMPT_TOKEN_REJECTED')).toBe(true)
    expect(JSON.stringify(sec.logs)).not.toContain('user-1')
    expect(sec.used.size).toBe(0)
    expect(query).not.toHaveBeenCalled()
  })

  it('token của NGƯỜI KHÁC → 409 ATTEMPT_EXPIRED (không chấm hộ)', async () => {
    const { token } = await start()
    const answers = answersFor(token)
    sec.user = { userId: 'user-2' }
    const res = await post({ token, answers })
    expect(res.status).toBe(409)
    expect(((await res.json()) as { code: string }).code).toBe('ATTEMPT_EXPIRED')
    expect(sec.logs.some((l) => l[0] === 'ATTEMPT_TOKEN_REJECTED')).toBe(true)
  })

  it('token ký cho scope khác (loại lượt khác) → 409, không chấm', async () => {
    const other = signAttemptToken('khac', { u: 'user-1', o: OWNER, t: TITLE, d: 'A' }, 60_000)
    const res = await post({
      token: other.token,
      answers: [{ questionId: 'meaning-1', optionId: 'o0' }],
    })
    expect(res.status).toBe(409)
    expect(query).not.toHaveBeenCalled()
  })

  it('token quá hạn → 409 ATTEMPT_EXPIRED, KHÔNG ghi sự kiện an ninh (hết hạn là chuyện thường)', async () => {
    const { token } = await start()
    const answers = answersFor(token)
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + ATTEMPT_TTL_MS + 1_000)
    try {
      const res = await post({ token, answers })
      expect(res.status).toBe(409)
      expect(((await res.json()) as { code: string }).code).toBe('ATTEMPT_EXPIRED')
      expect(sec.logs.some((l) => l[0] === 'ATTEMPT_TOKEN_REJECTED')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('cefr-dialogue — server chấm lại', () => {
  it('đúng hết → đạt, GHI "learned|…" + "đã xem" (UNION); thân phản hồi KHÔNG có correctId', async () => {
    const { res } = await startAndSubmit()
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).not.toContain('correctId')
    const json = DialogueCheckResultSchema.parse(JSON.parse(text))
    expect(json).toMatchObject({ correct: 3, total: 3, required: 2, passed: true, saved: true })
    // Câu đúng có giải thích (lời giải hiện sau khi nộp).
    expect(json.items.every((i) => i.correct && i.explanation !== undefined)).toBe(true)
    const call = insertCall()!
    expect((call[1] as unknown[])[0]).toBe('user-1') // userId từ TOKEN đăng nhập
    expect(JSON.parse((call[1] as unknown[])[1] as string)).toEqual([
      `${OWNER}:${TITLE}`,
      learnedDialogueEntry(OWNER, TITLE),
    ])
    expect(String(call[0])).toContain('english.learning_progress.cefr_dialogues ||')
    expect(
      query.mock.calls.some(([sql]) => String(sql).includes('grant_daily_bonus_rolling')),
    ).toBe(true)
  })

  it('2/3 đúng → vẫn đạt; câu SAI không có explanation (không lộ đáp án)', async () => {
    const { res } = await startAndSubmit(1)
    const json = DialogueCheckResultSchema.parse(await res.json())
    expect(json).toMatchObject({ correct: 2, passed: true, saved: true })
    const wrong = json.items.filter((i) => !i.correct)
    expect(wrong).toHaveLength(1)
    expect(wrong[0]!.explanation).toBeUndefined()
    expect(JSON.stringify(wrong[0])).not.toContain('correctId')
  })

  it('1/3 đúng → chưa đạt, KHÔNG ghi gì, saved=false', async () => {
    const { res } = await startAndSubmit(2)
    const json = DialogueCheckResultSchema.parse(await res.json())
    expect(json).toMatchObject({ correct: 1, passed: false, saved: false })
    expect(insertCall()).toBeUndefined()
  })

  it('thiếu câu (gửi 1/3 câu, dù đúng) → câu bỏ trống tính sai → chưa đạt', async () => {
    const { token } = await start()
    const one = answersFor(token).slice(0, 1)
    const json = DialogueCheckResultSchema.parse(await (await post({ token, answers: one })).json())
    expect(json).toMatchObject({ correct: 1, total: 3, passed: false })
    expect(json.items.filter((i) => i.chosenId === null)).toHaveLength(2)
  })

  it('đáp án của TOKEN KHÁC → id câu lệch → 409 QUIZ_MISMATCH, hoặc chấm theo đề của token; không bao giờ đạt nhờ chép bừa', async () => {
    // Mở lượt tới khi gặp đề có id câu khác lượt đầu, rồi gửi đáp án của lượt đầu cho lượt sau.
    const first = await start()
    const ids = fullQuiz(first.token)
      .map((q) => q.id)
      .join()
    let other = await start()
    for (
      let i = 0;
      i < 50 &&
      fullQuiz(other.token)
        .map((q) => q.id)
        .join() === ids;
      i++
    ) {
      other = await start()
    }
    const res = await post({ token: other.token, answers: answersFor(first.token) })
    expect(res.status).toBe(409)
    expect(((await res.json()) as { code: string }).code).toBe('QUIZ_MISMATCH')
    expect(insertCall()).toBeUndefined()
    // Lượt KHÔNG bị tiêu khi lệch đề.
    expect(sec.used.size).toBe(0)
  })

  it('chiều B chấm theo đề chiều B', async () => {
    const { res } = await startAndSubmit(0, 'B')
    const json = DialogueCheckResultSchema.parse(await res.json())
    expect(json.passed).toBe(true)
  })

  it('MỖI LƯỢT CHỈ CHẤM MỘT LẦN: nộp bừa rồi nộp lại cùng token → 409 ATTEMPT_USED, saved=false', async () => {
    const { token, res: lan1 } = await startAndSubmit(3)
    expect(((await lan1.json()) as { passed: boolean }).passed).toBe(false)
    const lan2 = await post({ token, answers: answersFor(token) })
    expect(lan2.status).toBe(409)
    const j = (await lan2.json()) as { code: string; saved: boolean; items?: unknown }
    expect(j.code).toBe('ATTEMPT_USED')
    expect(j.saved).toBe(false)
    expect(j.items).toBeUndefined() // không lộ gì thêm
    expect(insertCall()).toBeUndefined()
  })

  it('đã đạt rồi nộp lại cùng token (phản hồi lần trước rơi) → 409 ATTEMPT_USED kèm saved=true, không ghi lại', async () => {
    const { token } = await startAndSubmit()
    // Mô phỏng DB đã có bản "đã học" sau lượt 1.
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select coalesce(cefr_dialogues @>')) return { rows: [{ learned: true }] }
      return { rows: [] }
    })
    const lan2 = await post({ token, answers: answersFor(token) })
    expect(lan2.status).toBe(409)
    const j = (await lan2.json()) as { code: string; saved: boolean }
    expect(j).toMatchObject({ code: 'ATTEMPT_USED', saved: true })
    expect(query.mock.calls.filter(([sql]) => String(sql).includes('insert into'))).toHaveLength(1)
  })

  it('đọc trạng thái đã học lỗi → 409 ATTEMPT_USED vẫn trả, saved=false + console.warn', async () => {
    const { token } = await startAndSubmit(3)
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select coalesce(cefr_dialogues @>')) throw new Error('db down')
      return { rows: [] }
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const lan2 = await post({ token, answers: answersFor(token) })
    expect(lan2.status).toBe(409)
    expect(((await lan2.json()) as { saved: boolean }).saved).toBe(false)
    expect(warn).toHaveBeenCalled()
  })

  it('khoá ký bị gỡ ở production SAU khi cấp token → nộp trả 503 (không 500), không chấm', async () => {
    const { token } = await start()
    const answers = answersFor(token)
    vi.stubEnv('USER_DATA_MASTER_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    resetAttemptTokenKeyForTests()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post({ token, answers })
    expect(res.status).toBe(503)
    expect(((await res.json()) as { code: string }).code).toBe('SERVICE_UNAVAILABLE')
    expect(err).toHaveBeenCalledTimes(1)
    expect(sec.used.size).toBe(0)
  })

  it('khoá lượt là bản BĂM — không chứa userId/tên hội thoại/token', async () => {
    const { token } = await startAndSubmit()
    const [key] = [...sec.used]
    expect(key).toMatch(/^cefr-dialogue-attempt:[0-9a-f]{64}$/)
    expect(key).not.toContain(token.split('.')[2])
  })

  it('đã học từ trước → saved=true, không ghi lại, không cộng thưởng lần nữa', async () => {
    existingRow = { cefr_dialogues: [`${OWNER}:${TITLE}`, learnedDialogueEntry(OWNER, TITLE)] }
    const { res } = await startAndSubmit()
    const json = DialogueCheckResultSchema.parse(await res.json())
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
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { res } = await startAndSubmit()
    expect(res.status).toBe(500)
    expect(sec.resetCalls).toHaveLength(1)
    expect(sec.used.size).toBe(0)
    err.mockRestore()
  })

  it('cộng thưởng lỗi → vẫn 200 (fail-open), "đã học" đã ghi', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select cefr_dialogues')) return { rows: [] }
      if (sql.includes('grant_daily_bonus_rolling')) throw new Error('db down')
      return { rows: [] }
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { res } = await startAndSubmit()
    expect(res.status).toBe(200)
    expect(insertCall()).toBeTruthy()
    warn.mockRestore()
  })

  it('ghi DB lỗi VÀ không trả lại được lượt (Redis hỏng) → 500 + log cảnh báo, không lộ userId', async () => {
    sec.resetFails = true
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select cefr_dialogues')) return { rows: [] }
      if (sql.includes('insert into english.learning_progress')) throw new Error('db down')
      return { rows: [] }
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { res } = await startAndSubmit()
    expect(res.status).toBe(500)
    const logged = warn.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.startsWith('[cefr-dialogue]'))).toBe(true)
    expect(logged.join()).not.toContain('user-1')
    expect(logged.join()).not.toContain(TITLE)
    warn.mockRestore()
    err.mockRestore()
  })
})

// Redis không sẵn sàng ở production KHÔNG được đổ cho người học "nộp quá nhanh" (429) hay "lượt đã
// nộp" (409) — trả 503 mã riêng, vẫn không chấm/không ghi.
describe('cefr-dialogue — bộ đếm dùng chung không sẵn sàng → 503 SERVICE_UNAVAILABLE', () => {
  it('ở bước giới hạn theo tài khoản → 503, không chấm, không tiêu lượt, không ghi', async () => {
    const { token } = await start()
    const answers = answersFor(token)
    sec.unavailable = 'all'
    const res = await post({ token, answers })
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('60')
    const j = (await res.json()) as { code: string; error: string; items?: unknown }
    expect(j.code).toBe('SERVICE_UNAVAILABLE')
    expect(j.error).toContain('Máy chủ tạm bận, chưa chấm')
    expect(j.items).toBeUndefined()
    expect(sec.used.size).toBe(0)
    expect(insertCall()).toBeUndefined()
  })

  it('ở bước khoá lượt → 503 (KHÔNG phải 409 ATTEMPT_USED), không trả kết quả, không ghi; Redis hồi phục → nộp lại ĐÚNG token được', async () => {
    const { token } = await start()
    const answers = answersFor(token)
    sec.unavailable = 'lock'
    const res = await post({ token, answers })
    expect(res.status).toBe(503)
    const j = (await res.json()) as { code: string; items?: unknown }
    expect(j.code).toBe('SERVICE_UNAVAILABLE')
    expect(j.items).toBeUndefined()
    expect(insertCall()).toBeUndefined()
    sec.unavailable = null
    expect((await post({ token, answers })).status).toBe(200)
  })
})

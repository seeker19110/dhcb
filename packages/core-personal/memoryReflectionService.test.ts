// memoryReflectionService.test.ts — phản tỉnh nền sau buổi trò chuyện (đặc tả GĐ2b ④): consent,
// đếm/hoàn lượt, lọc tin nhạy cảm/khủng hoảng, tóm tắt 70/50, đề xuất `pending`, trần, con trỏ.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { COMPANION_CONSENT_SCOPES } from '@dhcb/core-contracts/consentGrant'

const consents = vi.hoisted(() => ({ isConsentActive: vi.fn() }))
vi.mock('./consentService.js', () => ({
  isConsentActive: (...a: unknown[]) => consents.isConsentActive(...a),
}))
const retrieval = vi.hoisted(() => ({ searchMemories: vi.fn() }))
vi.mock('./memoryRetrieval.js', () => ({
  searchMemories: (...a: unknown[]) => retrieval.searchMemories(...a),
}))
const actions = vi.hoisted(() => ({ proposeAction: vi.fn(), listProposedActions: vi.fn() }))
vi.mock('./proposedActionService.js', () => ({
  proposeAction: (...a: unknown[]) => actions.proposeAction(...a),
  listProposedActions: (...a: unknown[]) => actions.listProposedActions(...a),
}))
const summaries = vi.hoisted(() => ({
  listConversationSummaries: vi.fn(),
  upsertConversationSummary: vi.fn(),
}))
vi.mock('./coreMemoryBlocks.js', () => ({
  listConversationSummaries: (...a: unknown[]) => summaries.listConversationSummaries(...a),
  upsertConversationSummary: (...a: unknown[]) => summaries.upsertConversationSummary(...a),
}))

import {
  reflectOnPerson,
  runReflectionSweep,
  findReflectionCandidates,
  filterEligibleMessages,
  MAX_RUNS_PER_DAY,
  PENDING_SUGGESTION_CAP,
  SESSION_IDLE_MINUTES,
  type ReflectionDeps,
} from './memoryReflectionService.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const USER = '22222222-2222-4222-8222-222222222222'
const MEM_ID = '33333333-3333-4333-8333-333333333333'
const NOW = new Date('2026-10-12T10:00:00Z')
const TODAY = '2026-10-12'

const msgId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

function msg(n: number, role: 'user' | 'companion', content: string, over: object = {}) {
  return {
    id: msgId(n),
    role,
    content,
    domain: 'learning',
    sensitivity: 'personal',
    created_at: new Date(NOW.getTime() - (100 - n) * 60_000),
    ...over,
  }
}

interface Fixture {
  state?: Record<string, unknown>
  extraction?: ReturnType<typeof msg>[]
  domains?: string[]
  domainMessages?: ReturnType<typeof msg>[]
  candidates?: Array<{ person_id: string; user_id: string }>
}

function makePool(fx: Fixture) {
  const calls: Array<{ sql: string; params: unknown[] }> = []
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params })
    if (sql.includes('insert into personal.companion_reflection_state')) {
      return {
        rows: [
          {
            extracted_through_at: null,
            extracted_through_id: null,
            runs_day: null,
            runs_count: 0,
            ...fx.state,
          },
        ],
      }
    }
    if (sql.includes('group by m.person_id')) return { rows: fx.candidates ?? [] }
    if (sql.includes('select distinct domain')) {
      return { rows: (fx.domains ?? []).map((domain) => ({ domain })) }
    }
    if (sql.includes('from personal.companion_messages') && sql.includes('and domain = $4')) {
      return { rows: fx.domainMessages ?? [] }
    }
    if (sql.includes('from personal.companion_messages')) {
      // Truy vấn trích lấy MỚI nhất trước (desc) — trả đúng thứ tự đó.
      return { rows: [...(fx.extraction ?? [])].reverse() }
    }
    return { rows: [] }
  })
  return { pool: { query } as unknown as Pool, calls }
}

const conversation = [
  msg(1, 'user', 'Mình đang ôn IELTS, nhắm 7.0'),
  msg(2, 'companion', 'Tuyệt vời!'),
  msg(3, 'user', 'Mình thích học buổi sáng'),
  msg(4, 'companion', 'Ghi nhận nhé.'),
]

const goodOutput = JSON.stringify({
  summaries: [],
  operations: [
    {
      op: 'ADD',
      target: '',
      source: 't2',
      namespace: 'preference',
      content: 'Thích học buổi sáng',
      importance: 4,
      reason: 'sở thích',
    },
    {
      op: 'UPDATE',
      target: 'k1',
      source: 't1',
      namespace: 'semantic',
      content: 'Đang ôn IELTS, nhắm 7.0',
      importance: 9,
      reason: 'mục tiêu đổi',
    },
  ],
})

function makeDeps(pool: Pool, generate: ReflectionDeps['generate']) {
  const consumeUsage = vi.fn<ReflectionDeps['consumeUsage']>(async () => ({ ok: true, day: TODAY }))
  const refundUsage = vi.fn<ReflectionDeps['refundUsage']>(async () => {})
  const deps: ReflectionDeps = {
    pool,
    consumeUsage,
    refundUsage,
    generate: vi.fn(generate),
    now: () => NOW,
  }
  return { deps, consumeUsage, refundUsage }
}

const CANDIDATE = { personId: PERSON, userId: USER }

/** Bật đúng các consent truyền vào. */
function grant(...scopes: string[]) {
  consents.isConsentActive.mockImplementation(async (_p: unknown, _id: unknown, scope: string) =>
    scopes.includes(scope),
  )
}
const ALL = [
  COMPANION_CONSENT_SCOPES.memory,
  COMPANION_CONSENT_SCOPES.suggest,
  COMPANION_CONSENT_SCOPES.history,
]

beforeEach(() => {
  vi.clearAllMocks()
  grant(...ALL)
  retrieval.searchMemories.mockResolvedValue([
    {
      record: {
        id: MEM_ID,
        version: 2,
        namespace: 'semantic',
        content: 'Đang ôn IELTS, nhắm 6.5',
      },
    },
  ])
  actions.listProposedActions.mockResolvedValue([])
  actions.proposeAction.mockResolvedValue({ action: {}, autoExecuted: false })
  summaries.listConversationSummaries.mockResolvedValue([])
  summaries.upsertConversationSummary.mockResolvedValue(undefined)
})

describe('reflectOnPerson — consent & chi phí', () => {
  it('không consent nào → không đọc tin, không gọi AI, không trừ lượt', async () => {
    grant()
    const { pool, calls } = makePool({ extraction: conversation })
    const { deps, consumeUsage } = makeDeps(pool, async () => goodOutput)
    const out = await reflectOnPerson(deps, CANDIDATE)
    expect(out.status).toBe('no_consent')
    expect(deps.generate).not.toHaveBeenCalled()
    expect(consumeUsage).not.toHaveBeenCalled()
    expect(calls.some((c) => c.sql.includes('from personal.companion_messages'))).toBe(false)
  })

  it('bật "gợi ý" mà tắt "nhớ về tôi" → không trích (bộ trích phải đọc ký ức để so)', async () => {
    grant(COMPANION_CONSENT_SCOPES.suggest)
    const { pool } = makePool({ extraction: conversation })
    const { deps } = makeDeps(pool, async () => goodOutput)
    expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('no_consent')
  })

  it('đã đủ trần lượt/ngày → bỏ qua, không gọi AI', async () => {
    const { pool } = makePool({
      extraction: conversation,
      state: { runs_day: TODAY, runs_count: MAX_RUNS_PER_DAY },
    })
    const { deps, consumeUsage } = makeDeps(pool, async () => goodOutput)
    expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('daily_cap')
    expect(consumeUsage).not.toHaveBeenCalled()
  })

  it('hết lượt AI → không gọi AI, không dời con trỏ', async () => {
    const { pool, calls } = makePool({ extraction: conversation })
    const { deps, consumeUsage } = makeDeps(pool, async () => goodOutput)
    consumeUsage.mockResolvedValue({ ok: false, message: 'hết lượt' })
    expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('quota')
    expect(deps.generate).not.toHaveBeenCalled()
    expect(calls.some((c) => c.sql.includes('update personal.companion_reflection_state'))).toBe(
      false,
    )
  })

  it('AI trả null hoặc ném lỗi → hoàn lượt đúng ngày, không dời con trỏ', async () => {
    for (const generate of [async () => null, async () => Promise.reject(new Error('net'))]) {
      const { pool, calls } = makePool({ extraction: conversation })
      const { deps, refundUsage } = makeDeps(pool, generate)
      expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('ai_unavailable')
      expect(refundUsage).toHaveBeenCalledWith(USER, TODAY)
      expect(calls.some((c) => c.sql.includes('update personal.companion_reflection_state'))).toBe(
        false,
      )
    }
  })

  it('AI trả JSON hỏng → hoàn lượt, không đề xuất gì', async () => {
    const { pool } = makePool({ extraction: conversation })
    const { deps, refundUsage } = makeDeps(pool, async () => 'không phải json')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('invalid_output')
    expect(refundUsage).toHaveBeenCalledWith(USER, TODAY)
    expect(actions.proposeAction).not.toHaveBeenCalled()
    expect(String(warn.mock.calls[0]?.[0])).not.toContain('IELTS')
    warn.mockRestore()
  })
})

describe('reflectOnPerson — trích ký ức', () => {
  it('mỗi thao tác hợp lệ → đúng một ProposedAction (capability + payload theo đặc tả), rủi ro medium', async () => {
    const { pool, calls } = makePool({ extraction: conversation })
    const { deps, consumeUsage, refundUsage } = makeDeps(pool, async () => goodOutput)
    const out = await reflectOnPerson(deps, CANDIDATE)
    expect(out).toEqual({ status: 'done', proposed: 2, summarized: 0 })
    expect(consumeUsage).toHaveBeenCalledWith(USER)
    expect(refundUsage).not.toHaveBeenCalled()

    expect(actions.proposeAction).toHaveBeenCalledTimes(2)
    const [, add] = actions.proposeAction.mock.calls[0] as [unknown, Record<string, unknown>]
    expect(add).toEqual({
      personId: PERSON,
      capabilityId: 'memory.create_record',
      action: 'Ghi nhớ: Thích học buổi sáng',
      targetDomain: 'personal',
      riskLevel: 'medium',
      payload: {
        namespace: 'preference',
        content: 'Thích học buổi sáng',
        importance: 4,
        origin: 'reflection',
        reason: 'sở thích',
        sourceMessageId: msgId(3),
      },
    })
    const [, upd] = actions.proposeAction.mock.calls[1] as [unknown, Record<string, unknown>]
    expect(upd).toMatchObject({
      capabilityId: 'memory.supersede_record',
      payload: {
        targetRecordId: MEM_ID,
        targetVersion: 2,
        previousContent: 'Đang ôn IELTS, nhắm 6.5',
        content: 'Đang ôn IELTS, nhắm 7.0',
        sourceMessageId: msgId(1),
      },
    })

    // Ứng viên tìm ký ức KHÔNG chạm last_accessed_at và chỉ đọc ≤ personal.
    expect(retrieval.searchMemories).toHaveBeenCalledWith(
      pool,
      PERSON,
      expect.objectContaining({ touch: false, maxSensitivity: 'personal', limit: 10 }),
    )
    // Con trỏ dời tới tin cuối đã xét + đếm một lượt chạy hôm nay.
    const advance = calls.find((c) => c.sql.includes('update personal.companion_reflection_state'))!
    expect(advance.params).toEqual([PERSON, conversation[3]!.created_at, msgId(4), TODAY])
  })

  it('INVALIDATE → memory.invalidate_record kèm phiên bản ký ức gốc', async () => {
    const { pool } = makePool({ extraction: conversation })
    const output = JSON.stringify({
      summaries: [],
      operations: [
        {
          op: 'INVALIDATE',
          target: 'k1',
          source: '',
          namespace: 'semantic',
          content: '',
          importance: 5,
          reason: 'bỏ IELTS',
        },
      ],
    })
    const { deps } = makeDeps(pool, async () => output)
    await reflectOnPerson(deps, CANDIDATE)
    const [, inv] = actions.proposeAction.mock.calls[0] as [unknown, Record<string, unknown>]
    expect(inv).toMatchObject({
      capabilityId: 'memory.invalidate_record',
      action: 'Bỏ ký ức cũ: Đang ôn IELTS, nhắm 6.5',
      payload: { targetRecordId: MEM_ID, targetVersion: 2, reason: 'bỏ IELTS' },
    })
  })

  it('tin sensitive và lượt khớp từ khoá khủng hoảng (kèm câu trả lời) KHÔNG vào prompt', async () => {
    const { pool } = makePool({
      extraction: [
        msg(1, 'user', 'Tôi muốn tự tử'),
        msg(2, 'companion', 'Mình ở đây với bạn — gọi 111 nhé'),
        msg(3, 'user', 'Bí mật riêng tư', { sensitivity: 'sensitive' }),
        msg(4, 'companion', 'Câu trả lời nhạy cảm', { sensitivity: 'sensitive' }),
        msg(5, 'user', 'Mình thích học buổi sáng'),
      ],
    })
    const { deps } = makeDeps(pool, async () => JSON.stringify({ summaries: [], operations: [] }))
    await reflectOnPerson(deps, CANDIDATE)
    const sent = vi.mocked(deps.generate).mock.calls[0]![0].userMessage
    expect(sent).toContain('Mình thích học buổi sáng')
    expect(sent).not.toContain('tự tử')
    expect(sent).not.toContain('111')
    expect(sent).not.toContain('Bí mật')
    expect(sent).not.toContain('Câu trả lời nhạy cảm')
  })

  it('chỉ có tin bị lọc → không gọi AI, không trừ lượt, vẫn dời con trỏ', async () => {
    grant(COMPANION_CONSENT_SCOPES.memory, COMPANION_CONSENT_SCOPES.suggest)
    const { pool, calls } = makePool({
      extraction: [msg(1, 'user', 'Bí mật', { sensitivity: 'sensitive' })],
    })
    const { deps, consumeUsage } = makeDeps(pool, async () => goodOutput)
    expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('nothing_to_do')
    expect(consumeUsage).not.toHaveBeenCalled()
    const advance = calls.find((c) => c.sql.includes('update personal.companion_reflection_state'))!
    expect(advance.params).toEqual([PERSON, expect.any(Date), msgId(1), null])
  })

  it(`đã có ${PENDING_SUGGESTION_CAP} gợi ý đang chờ → không đề xuất thêm`, async () => {
    actions.listProposedActions.mockResolvedValue(
      Array.from({ length: PENDING_SUGGESTION_CAP }, (_, i) => ({
        capabilityId: 'memory.create_record',
        payload: { content: `điều ${i}` },
      })),
    )
    const { pool } = makePool({ extraction: conversation })
    const { deps } = makeDeps(pool, async () => goodOutput)
    expect((await reflectOnPerson(deps, CANDIDATE)).proposed).toBe(0)
    expect(actions.proposeAction).not.toHaveBeenCalled()
  })

  it('không đề xuất trùng: nội dung đang chờ bị bỏ; ký ức đã có gợi ý thay/bỏ đang chờ không bị nhắm lại', async () => {
    actions.listProposedActions.mockResolvedValue([
      { capabilityId: 'memory.create_record', payload: { content: 'Thích học buổi sáng' } },
      { capabilityId: 'memory.invalidate_record', payload: { targetRecordId: MEM_ID } },
      { capabilityId: 'profile.update_fact', payload: { content: 'không tính' } },
    ])
    const { pool } = makePool({ extraction: conversation })
    const { deps } = makeDeps(pool, async () => goodOutput)
    expect((await reflectOnPerson(deps, CANDIDATE)).proposed).toBe(0)
  })

  it('tìm ký ức cũ lỗi → vẫn trích được điều mới', async () => {
    retrieval.searchMemories.mockRejectedValue(new Error('db'))
    const { pool } = makePool({ extraction: conversation })
    const { deps } = makeDeps(pool, async () => goodOutput)
    const out = await reflectOnPerson(deps, CANDIDATE)
    // UPDATE trỏ k1 bị bỏ (không có ký ức nào được đưa), ADD vẫn được đề xuất.
    expect(out.proposed).toBe(1)
  })

  it('con trỏ có sẵn được dùng để chỉ đọc tin MỚI hơn nó', async () => {
    const at = new Date('2026-10-12T08:00:00Z')
    const { pool, calls } = makePool({
      extraction: conversation,
      state: { extracted_through_at: at, extracted_through_id: msgId(0) },
    })
    const { deps } = makeDeps(pool, async () => goodOutput)
    await reflectOnPerson(deps, CANDIDATE)
    const read = calls.find(
      (c) => c.sql.includes('from personal.companion_messages') && c.sql.includes('desc'),
    )!
    expect(read.params.slice(0, 3)).toEqual([PERSON, at, msgId(0)])
  })
})

describe('reflectOnPerson — tóm tắt cuộn 70/50', () => {
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      msg(i + 1, i % 2 === 0 ? 'user' : 'companion', `tin số ${i + 1}`),
    )

  it('chỉ bật "lịch sử": ≥ 14 tin chưa tóm tắt → gộp đúng 10 tin cũ nhất, không trích ký ức', async () => {
    grant(COMPANION_CONSENT_SCOPES.history)
    const rows = many(14)
    const { pool } = makePool({ domains: ['learning'], domainMessages: rows })
    summaries.listConversationSummaries.mockResolvedValue([
      {
        domain: 'learning',
        summary: 'Tóm tắt cũ.',
        through: { at: new Date('2026-10-01'), id: msgId(0) },
      },
    ])
    const { deps } = makeDeps(pool, async () =>
      JSON.stringify({
        summaries: [{ domain: 'learning', summary: 'Tóm tắt mới.' }],
        operations: [],
      }),
    )
    const out = await reflectOnPerson(deps, CANDIDATE)
    expect(out).toEqual({ status: 'done', proposed: 0, summarized: 1 })
    const sent = vi.mocked(deps.generate).mock.calls[0]![0].userMessage
    expect(sent).toContain('<tom_tat_cu mien="learning">Tóm tắt cũ.</tom_tat_cu>')
    expect(sent).toContain('tin số 10')
    expect(sent).not.toContain('tin số 11')
    expect(sent).toContain('KHÔNG trích ký ức lần này')
    expect(summaries.upsertConversationSummary).toHaveBeenCalledWith(
      pool,
      PERSON,
      'learning',
      'Tóm tắt mới.',
      { at: rows[9]!.created_at, id: msgId(10) },
    )
    expect(retrieval.searchMemories).not.toHaveBeenCalled()
  })

  it('< 14 tin → không tóm tắt; không có việc gì → không gọi AI', async () => {
    grant(COMPANION_CONSENT_SCOPES.history)
    const { pool } = makePool({ domains: ['learning'], domainMessages: many(13) })
    const { deps, consumeUsage } = makeDeps(pool, async () => goodOutput)
    expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('nothing_to_do')
    expect(consumeUsage).not.toHaveBeenCalled()
    expect(summaries.upsertConversationSummary).not.toHaveBeenCalled()
  })

  it('lịch sử dài khi mới bật → chỉ xét cửa sổ 20 tin gần nhất (bỏ qua quá khứ xa)', async () => {
    grant(COMPANION_CONSENT_SCOPES.history)
    const rows = many(50)
    const { pool } = makePool({ domains: ['learning'], domainMessages: rows })
    const { deps } = makeDeps(pool, async () =>
      JSON.stringify({ summaries: [{ domain: 'learning', summary: 'S' }], operations: [] }),
    )
    await reflectOnPerson(deps, CANDIDATE)
    const sent = vi.mocked(deps.generate).mock.calls[0]![0].userMessage
    expect(sent).toContain('tin số 31')
    expect(sent).not.toContain('tin số 30<')
    expect(sent).toContain('tin số 40')
    expect(sent).not.toContain('tin số 41')
    expect(summaries.upsertConversationSummary).toHaveBeenCalledWith(
      pool,
      PERSON,
      'learning',
      'S',
      { at: rows[39]!.created_at, id: msgId(40) },
    )
  })

  it('AI không trả tóm tắt cho miền cần gộp → giữ con trỏ để thử lại', async () => {
    grant(COMPANION_CONSENT_SCOPES.history)
    const { pool } = makePool({ domains: ['learning'], domainMessages: many(14) })
    const { deps } = makeDeps(pool, async () => JSON.stringify({ summaries: [], operations: [] }))
    expect((await reflectOnPerson(deps, CANDIDATE)).summarized).toBe(0)
    expect(summaries.upsertConversationSummary).not.toHaveBeenCalled()
  })

  it('cửa sổ gộp toàn tin bị lọc → dời con trỏ, giữ tóm tắt cũ, không gọi AI', async () => {
    grant(COMPANION_CONSENT_SCOPES.history)
    const rows = many(14).map((r) => ({ ...r, sensitivity: 'sensitive' }))
    const { pool } = makePool({ domains: ['learning'], domainMessages: rows })
    summaries.listConversationSummaries.mockResolvedValue([
      { domain: 'learning', summary: 'Cũ', through: { at: new Date('2026-10-01'), id: msgId(0) } },
    ])
    const { deps, consumeUsage } = makeDeps(pool, async () => goodOutput)
    expect((await reflectOnPerson(deps, CANDIDATE)).status).toBe('nothing_to_do')
    expect(consumeUsage).not.toHaveBeenCalled()
    expect(summaries.upsertConversationSummary).toHaveBeenCalledWith(
      pool,
      PERSON,
      'learning',
      'Cũ',
      {
        at: rows[9]!.created_at,
        id: msgId(10),
      },
    )
  })
})

describe('filterEligibleMessages', () => {
  it('câu trả lời của Companion theo số phận câu hỏi ngay trước', () => {
    const out = filterEligibleMessages([
      msg(1, 'companion', 'mở đầu không có câu hỏi trước'),
      msg(2, 'user', 'chào'),
      msg(3, 'companion', 'chào bạn'),
    ])
    expect(out.map((m) => m.id)).toEqual([msgId(2), msgId(3)])
  })
})

describe('runReflectionSweep + findReflectionCandidates', () => {
  it('chọn người theo khoảng im lặng; lỗi một người không chặn người khác', async () => {
    const { pool, calls } = makePool({
      candidates: [
        { person_id: PERSON, user_id: USER },
        { person_id: MEM_ID, user_id: USER },
      ],
      extraction: conversation,
    })
    const { deps } = makeDeps(pool, async () => goodOutput)
    actions.proposeAction.mockRejectedValueOnce(new Error('db')).mockResolvedValue({})
    const onError = vi.fn()
    const result = await runReflectionSweep(deps, onError)
    expect(result.persons).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.byStatus.done).toBe(1)
    expect(onError).toHaveBeenCalledTimes(1)

    const find = calls.find((c) => c.sql.includes('group by m.person_id'))!
    expect(find.params[1]).toEqual(new Date(NOW.getTime() - SESSION_IDLE_MINUTES * 60_000))
    expect(find.params[2]).toBe(20)
  })

  it('findReflectionCandidates đổi hàng CSDL sang personId/userId', async () => {
    const { pool } = makePool({ candidates: [{ person_id: PERSON, user_id: USER }] })
    expect(await findReflectionCandidates(pool, NOW)).toEqual([{ personId: PERSON, userId: USER }])
  })

  it('không truyền now/onError → dùng mặc định, không ném', async () => {
    const { pool } = makePool({ candidates: [] })
    const { deps } = makeDeps(pool, async () => null)
    delete deps.now
    expect((await runReflectionSweep(deps)).persons).toBe(0)
  })
})

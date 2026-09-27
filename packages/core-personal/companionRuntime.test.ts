// packages/core-personal/companionRuntime.test.ts — Unit tests for Companion Runtime pipeline.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import {
  resolveIntentAndDomain,
  detectDomainByKeyword,
  generatePlan,
  synthesizeReply,
  synthesizeCompanionReply,
  executeCompanionTurn,
  streamCompanionTurn,
} from './companionRuntime.js'

const PERSON_ID = '11111111-1111-4111-8111-111111111111'
const CTX_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const SOURCE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const contextEngineMock = vi.hoisted(() => ({
  buildContextPackage: vi.fn(),
}))

const domainReadModelMock = vi.hoisted(() => ({
  getDomainReadModelForContext: vi.fn(),
}))
vi.mock('@dhcb/core-domains/domainReadModelService', () => ({
  getDomainReadModelForContext: (...a: unknown[]) =>
    domainReadModelMock.getDomainReadModelForContext(...a),
}))

vi.mock('./contextEngine.js', () => ({
  buildContextPackage: (...a: unknown[]) => contextEngineMock.buildContextPackage(...a),
}))

const proposedActionMock = vi.hoisted(() => ({
  proposeAction: vi.fn(),
}))

vi.mock('./proposedActionService.js', () => ({
  proposeAction: (...a: unknown[]) => proposedActionMock.proposeAction(...a),
}))

const chatProvidersMock = vi.hoisted(() => ({
  callGroqChat: vi.fn(),
  callGroqChatWithKeyPool: vi.fn(),
  callAnthropicChat: vi.fn(),
}))

vi.mock('@dhcb/core-ai/chatProviders', () => ({
  callGroqChat: (...a: unknown[]) => chatProvidersMock.callGroqChat(...a),
  callGroqChatWithKeyPool: (...a: unknown[]) => chatProvidersMock.callGroqChatWithKeyPool(...a),
  callAnthropicChat: (...a: unknown[]) => chatProvidersMock.callAnthropicChat(...a),
}))

const geminiApiMock = vi.hoisted(() => ({
  callGemini: vi.fn(),
}))

vi.mock('@dhcb/core-ai/geminiApi', () => ({
  callGemini: (...a: unknown[]) => geminiApiMock.callGemini(...a),
}))

const pool = {} as Pool

beforeEach(() => {
  vi.clearAllMocks()
  domainReadModelMock.getDomainReadModelForContext.mockResolvedValue(null)
  contextEngineMock.buildContextPackage.mockResolvedValue({
    id: CTX_ID,
    personId: PERSON_ID,
    requestId: 'req-1',
    items: [],
    tokenBudget: 2000,
    tokenUsed: 0,
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  })
  proposedActionMock.proposeAction.mockResolvedValue({
    action: {
      id: '22222222-2222-4222-8222-222222222222',
      personId: PERSON_ID,
      capabilityId: 'learning.update_goal',
      action: 'update_goal',
      targetDomain: 'learning',
      payload: {},
      riskLevel: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    autoExecuted: false,
  })
})

describe('resolveIntentAndDomain', () => {
  it('respects explicit intent and domain', () => {
    const res = resolveIntentAndDomain('hello', 'custom_intent', 'custom_domain')
    expect(res.intent).toBe('custom_intent')
    expect(res.domain).toBe('custom_domain')
  })

  it('detects goal-setting intent', () => {
    const res = resolveIntentAndDomain('Tôi muốn đặt mục tiêu học IELTS 7.5')
    expect(res.intent).toBe('set_learning_goal')
    expect(res.domain).toBe('learning')
  })

  it('detects dictionary lookup intent', () => {
    const res = resolveIntentAndDomain('Từ serendipity nghĩa là gì?')
    expect(res.intent).toBe('dictionary_lookup')
    expect(res.domain).toBe('learning')
  })

  it('detects profile update fact intent', () => {
    const res = resolveIntentAndDomain('Tôi thích đọc sách khoa học viễn tưởng')
    expect(res.intent).toBe('update_profile_fact')
    expect(res.domain).toBe('profile')
  })

  it('detects memory creation intent', () => {
    const res = resolveIntentAndDomain('Ghi nhớ giúp tôi cuộc họp ngày mai')
    expect(res.intent).toBe('create_memory')
    expect(res.domain).toBe('personal')
  })

  // [2026-08-27] ĐỔI CÓ CHỦ Ý: mặc định cũ là 'learning'. Câu không nhận diện được mà bị gán
  // 'learning' thì Companion nạp ngữ cảnh học tập và nói với LLM "lĩnh vực trọng tâm: learning"
  // kể cả khi người dùng đang hỏi chuyện khác. 'general' là giá trị trung tính đã được
  // synthesizeCompanionReply xử lý sẵn (bỏ dòng "lĩnh vực trọng tâm").
  // Bốn trụ ngoài Learning: trước đây KHÔNG có mẫu nào nhận ra chúng, mọi câu hỏi về sự
  // nghiệp/công việc/khởi nghiệp/đời sống đều rơi vào mặc định 'learning'.
  it.each([
    ['Tôi muốn thăng tiến trong sự nghiệp', 'career'],
    ['Chuẩn bị phỏng vấn thế nào?', 'career'],
    ['Dự án này sắp tới deadline rồi', 'work'],
    ['Làm sao tăng năng suất công việc', 'work'],
    ['Tôi đang khởi nghiệp mảng edtech', 'startup'],
    ['Cần kiểm chứng giả định về khách hàng mục tiêu', 'startup'],
    ['Tôi muốn xây thói quen dậy sớm', 'life'],
    ['Dạo này giấc ngủ của tôi kém', 'life'],
  ])('nhận diện đúng trụ cho câu %s', (msg, domain) => {
    const res = resolveIntentAndDomain(msg)
    expect(res.domain).toBe(domain)
    expect(res.intent).toBe('domain_conversation')
  })

  // "mục tiêu" là từ chung của mọi trụ. Nhánh nhận diện trụ phải chạy TRƯỚC nhánh mục tiêu,
  // nếu không câu này bị gán 'learning' và nạp nhầm ngữ cảnh học tập.
  it('câu có chữ "mục tiêu" nhưng nói về sự nghiệp thì KHÔNG rơi vào learning', () => {
    expect(resolveIntentAndDomain('Mục tiêu sự nghiệp của tôi là gì?').domain).toBe('career')
  })

  it('explicit domain luôn thắng bảng từ khoá', () => {
    const res = resolveIntentAndDomain('Tôi muốn thăng tiến trong sự nghiệp', undefined, 'life')
    expect(res.domain).toBe('life')
  })

  it('detectDomainByKeyword trả null khi không có từ khoá nào', () => {
    expect(detectDomainByKeyword('chào bạn buổi sáng')).toBeNull()
  })

  it('falls back to general_conversation', () => {
    const res = resolveIntentAndDomain('Chào bạn buổi sáng')
    expect(res.intent).toBe('general_conversation')
    expect(res.domain).toBe('general')
  })
})

describe('generatePlan', () => {
  it('generates a goal-setting step with medium risk', () => {
    const steps = generatePlan('set_learning_goal', 'learning', 'Tôi muốn học IELTS')
    expect(steps.length).toBe(1)
    expect(steps[0]?.capabilityId).toBe('learning.update_goal')
    expect(steps[0]?.riskLevel).toBe('medium')
  })

  it('generates a dictionary lookup step with low risk', () => {
    const steps = generatePlan('dictionary_lookup', 'learning', 'Nghĩa của từ "comprehension"')
    expect(steps.length).toBe(1)
    expect(steps[0]?.capabilityId).toBe('dictionary.lookup')
    expect(steps[0]?.payload.word).toBe('comprehension')
    expect(steps[0]?.riskLevel).toBe('low')
  })

  it('returns empty plan for general conversation', () => {
    const steps = generatePlan('general_conversation', 'learning', 'Xin chào')
    expect(steps.length).toBe(0)
  })
})

describe('synthesizeReply', () => {
  it('synthesizes response with pending actions notice', () => {
    const text = synthesizeReply(
      'Đặt mục tiêu',
      'set_learning_goal',
      [
        {
          id: '22222222-2222-4222-8222-222222222222',
          personId: PERSON_ID,
          capabilityId: 'learning.update_goal',
          action: 'update_goal',
          targetDomain: 'learning',
          payload: {},
          riskLevel: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          schemaVersion: 1,
        },
      ],
      {
        id: CTX_ID,
        personId: PERSON_ID,
        requestId: 'req-1',
        items: [
          {
            sourceType: 'current_request',
            sourceId: SOURCE_ID,
            content: 'test',
            provenance: 'test',
            sensitivity: 'public',
            tokenEstimate: 5,
          },
        ],
        tokenBudget: 2000,
        tokenUsed: 5,
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
      },
    )

    expect(text).toContain('Tôi đã ghi nhận mong muốn học tập của bạn.')
    expect(text).toContain('Có 1 đề xuất hành động cần bạn xác nhận')
    expect(text).toContain('[Sử dụng 5/2000 token ngữ cảnh]')
  })
})

describe('executeCompanionTurn end-to-end execution pipeline', () => {
  it('executes full pipeline: Intent -> Context -> Planner -> Policy -> Actions -> Response', async () => {
    proposedActionMock.proposeAction.mockResolvedValueOnce({
      action: {
        id: '22222222-2222-4222-8222-222222222222',
        personId: PERSON_ID,
        capabilityId: 'dictionary.lookup',
        action: 'lookup',
        targetDomain: 'learning',
        payload: { word: 'fluent' },
        riskLevel: 'low',
        status: 'committed',
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
      },
      autoExecuted: true,
    })

    const response = await executeCompanionTurn(pool, {
      personId: PERSON_ID,
      userMessage: 'Tra từ "fluent" nghĩa là gì',
    })

    expect(response.intent).toBe('dictionary_lookup')
    expect(response.targetDomain).toBe('learning')
    expect(response.proposedActions.length).toBe(1)
    expect(response.proposedActions[0]?.status).toBe('committed')
    expect(response.executionSummary.executedSteps).toBe(1)
    expect(response.executionSummary.pendingConfirmationSteps).toBe(0)
    expect(response.reply).toContain('Tôi đã tra cứu từ vựng theo yêu cầu của bạn.')
    expect(contextEngineMock.buildContextPackage).toHaveBeenCalled()
    expect(proposedActionMock.proposeAction).toHaveBeenCalled()
  })

  it('handles profile fact and memory intents and rejected actions', async () => {
    // Rejected action
    proposedActionMock.proposeAction.mockResolvedValueOnce({
      action: {
        id: '22222222-2222-4222-8222-222222222222',
        personId: PERSON_ID,
        capabilityId: 'profile.update_fact',
        action: 'update_fact',
        targetDomain: 'profile',
        payload: { fact: 'Likes sci-fi' },
        riskLevel: 'low',
        status: 'rejected',
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
      },
      autoExecuted: false,
    })

    const poolWithUser = {
      query: vi.fn().mockResolvedValue({ rows: [{ user_id: 'user-123' }] }),
    } as unknown as Pool

    const response = await executeCompanionTurn(poolWithUser, {
      personId: PERSON_ID,
      userMessage: 'Tôi thích đọc sách viễn tưởng',
    })

    expect(response.intent).toBe('update_profile_fact')
    expect(response.executionSummary.rejectedSteps).toBe(1)
    expect(response.reply).toContain('Tôi đã cập nhật thông tin hồ sơ của bạn.')

    // Memory intent synthesis
    const memoryReply = synthesizeReply('Ghi nhớ lịch', 'create_memory', [], {
      id: CTX_ID,
      personId: PERSON_ID,
      requestId: 'req-2',
      items: [],
      tokenBudget: 2000,
      tokenUsed: 0,
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
    })
    expect(memoryReply).toContain('Tôi đã lưu lại ghi nhớ này vào kho kiến thức cá nhân.')
  })
})

// Nhánh biên: chỉ truyền một trong hai tham số explicit, các intent còn lại, đường ngữ cảnh domain learning.
describe('CompanionRuntime — nhánh biên', () => {
  it('chỉ truyền explicitIntent (thiếu domain) → vẫn nhận diện domain theo mẫu câu', () => {
    const res = resolveIntentAndDomain('Tôi muốn học IELTS', 'my_intent')
    expect(res.intent).toBe('my_intent')
    expect(res.domain).toBe('learning')
  })

  it('chỉ truyền explicitDomain (thiếu intent) → intent suy ra từ mẫu câu', () => {
    const memory = resolveIntentAndDomain('Nhớ giúp tôi lịch họp', undefined, 'my_domain')
    expect(memory.intent).toBe('create_memory')
    expect(memory.domain).toBe('my_domain')

    const profile = resolveIntentAndDomain('Tôi là kỹ sư phần mềm', undefined, 'my_domain')
    expect(profile.intent).toBe('update_profile_fact')
    expect(profile.domain).toBe('my_domain')

    const lookup = resolveIntentAndDomain('dictionary check', undefined, 'my_domain')
    expect(lookup.intent).toBe('dictionary_lookup')

    const fallback = resolveIntentAndDomain('Chào buổi tối', undefined, 'my_domain')
    expect(fallback.intent).toBe('general_conversation')
    expect(fallback.domain).toBe('my_domain')
  })

  it('generatePlan tạo bước cập nhật hồ sơ và bước lưu bộ nhớ', () => {
    const profile = generatePlan('update_profile_fact', 'profile', 'Tôi thích cà phê')
    expect(profile[0]?.capabilityId).toBe('profile.update_fact')
    expect(profile[0]?.riskLevel).toBe('low')

    const memory = generatePlan('create_memory', 'personal', 'Ghi nhớ họp 9h')
    expect(memory[0]?.capabilityId).toBe('memory.create_record')
    expect(memory[0]?.payload.namespace).toBe('semantic')
  })

  it('dictionary_lookup không khớp mẫu regex → lấy nguyên câu làm từ khoá', () => {
    const steps = generatePlan('dictionary_lookup', 'learning', 'lookup please')
    expect(steps[0]?.payload.word).toBe('lookup please')
  })

  it('dictionary_lookup với câu rỗng → dùng từ mặc định "learning"', () => {
    const steps = generatePlan('dictionary_lookup', 'learning', '   ')
    expect(steps[0]?.payload.word).toBe('learning')
  })

  it('synthesizeReply cho các intent còn lại và trường hợp không có ngữ cảnh', () => {
    const emptyCtx = {
      id: CTX_ID,
      personId: PERSON_ID,
      requestId: 'req-1',
      items: [],
      tokenBudget: 2000,
      tokenUsed: 0,
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
    }

    expect(synthesizeReply('x', 'dictionary_lookup', [], emptyCtx)).toBe(
      'Tôi đã tra cứu từ vựng theo yêu cầu của bạn.',
    )
    expect(synthesizeReply('x', 'update_profile_fact', [], emptyCtx)).toBe(
      'Tôi đã cập nhật thông tin hồ sơ của bạn.',
    )
    expect(synthesizeReply('x', 'create_memory', [], emptyCtx)).toBe(
      'Tôi đã lưu lại ghi nhớ này vào kho kiến thức cá nhân.',
    )
    // Intent lạ → câu trả lời mặc định, và không có item ngữ cảnh nên không kèm chú thích token.
    const generic = synthesizeReply('Chào bạn', 'general_conversation', [], emptyCtx)
    expect(generic).toBe('Đồng Hành đã nhận được tin nhắn: "Chào bạn".')
    expect(generic).not.toContain('token ngữ cảnh')
  })

  it('synthesizeReply đếm cả tác vụ đã chạy và tác vụ bị chính sách từ chối', () => {
    const baseAction = {
      personId: PERSON_ID,
      capabilityId: 'learning.update_goal',
      action: 'update_goal',
      targetDomain: 'learning',
      payload: {},
      riskLevel: 'low' as const,
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
    }

    const text = synthesizeReply(
      'x',
      'set_learning_goal',
      [
        { ...baseAction, id: '22222222-2222-4222-8222-222222222222', status: 'committed' },
        { ...baseAction, id: '33333333-3333-4333-8333-333333333333', status: 'rejected' },
      ],
      {
        id: CTX_ID,
        personId: PERSON_ID,
        requestId: 'req-1',
        items: [],
        tokenBudget: 2000,
        tokenUsed: 0,
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
      },
    )

    expect(text).toContain('Đã tự động thực hiện 1 tác vụ an toàn.')
    expect(text).toContain('Có 1 tác vụ bị từ chối do chính sách bảo mật.')
  })
})

describe('executeCompanionTurn — nhánh ngữ cảnh & đếm trạng thái', () => {
  it('domain learning: nạp Learning Read Model vào ngữ cảnh, tôn trọng tokenBudget truyền vào', async () => {
    const queryMock = vi.fn().mockResolvedValue({ rows: [{ user_id: 'user-42' }] })
    const livePool = { query: queryMock } as unknown as Pool

    proposedActionMock.proposeAction.mockResolvedValueOnce({
      action: {
        id: '22222222-2222-4222-8222-222222222222',
        personId: PERSON_ID,
        capabilityId: 'learning.update_goal',
        action: 'update_goal',
        targetDomain: 'learning',
        payload: {},
        riskLevel: 'medium',
        status: 'rejected',
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
      },
      autoExecuted: false,
    })

    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Tôi muốn đặt mục tiêu IELTS 7.0',
      tokenBudget: 1200,
    })

    expect(res.executionSummary.rejectedSteps).toBe(1)
    const ctxOptions = contextEngineMock.buildContextPackage.mock.calls[0]![1] as {
      tokenBudget?: number
      domainState?: { provenance: string }
    }
    expect(ctxOptions.tokenBudget).toBe(1200)
    expect(ctxOptions.domainState?.provenance).toBe('learning:read_model')
  })

  it('domain không phải learning → bỏ qua hẳn bước đọc Learning Read Model', async () => {
    const queryMock = vi.fn()
    const livePool = { query: queryMock } as unknown as Pool

    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Chào bạn',
      targetDomain: 'personal',
      intent: 'general_conversation',
    })

    // Bước đọc Learning Read Model là câu tra `personal.persons` để lấy user_id. Các câu query
    // khác (lịch sử hội thoại) là bình thường — chỉ khẳng định KHÔNG có câu nào của read model.
    const sqlCalls = queryMock.mock.calls.map((call) => String(call[0]))
    expect(sqlCalls.some((sql) => sql.includes('personal.persons'))).toBe(false)
    expect(res.targetDomain).toBe('personal')
    expect(res.executionSummary.plannedSteps).toBe(0)
    const ctxOptions = contextEngineMock.buildContextPackage.mock.calls[0]![1] as {
      domainState?: unknown
      tokenBudget?: number
    }
    expect(ctxOptions.domainState).toBeUndefined()
    expect(ctxOptions.tokenBudget).toBeUndefined()
  })

  // [2026-08-27] Companion "xuyên suốt 5 trụ": trước đây CHỈ trụ Learning có read model nạp vào
  // ngữ cảnh, nên hỏi về sự nghiệp/công việc/khởi nghiệp/đời sống thì AI không thấy dữ liệu
  // người dùng đã nhập ở đúng những trụ đó.
  it.each(['career', 'work', 'startup', 'life'])(
    'trụ %s → nạp read model của trụ đó vào ngữ cảnh',
    async (domain) => {
      domainReadModelMock.getDomainReadModelForContext.mockResolvedValue(
        `[Domain: ${domain}] tóm tắt`,
      )
      const queryMock = vi.fn().mockResolvedValue({ rows: [] })
      const livePool = { query: queryMock } as unknown as Pool

      await executeCompanionTurn(livePool, {
        personId: PERSON_ID,
        userMessage: 'Kể tôi nghe tình hình',
        targetDomain: domain,
        intent: 'domain_conversation',
      })

      expect(domainReadModelMock.getDomainReadModelForContext).toHaveBeenCalledWith(
        livePool,
        PERSON_ID,
        domain,
      )
      const ctxOptions = contextEngineMock.buildContextPackage.mock.calls[0]![1] as {
        domainState?: { content: string; provenance: string }
      }
      expect(ctxOptions.domainState?.content).toBe(`[Domain: ${domain}] tóm tắt`)
      expect(ctxOptions.domainState?.provenance).toBe(`${domain}:read_model`)
      // KHÔNG chạm vào nhánh Learning Read Model.
      expect(
        queryMock.mock.calls.map((c) => String(c[0])).some((q) => q.includes('personal.persons')),
      ).toBe(false)
    },
  )

  it('read model của trụ hỏng → vẫn trả lời được, chỉ là thiếu ngữ cảnh', async () => {
    domainReadModelMock.getDomainReadModelForContext.mockRejectedValue(new Error('db sập'))
    const livePool = { query: vi.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool

    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Tình hình khởi nghiệp của tôi ra sao',
      targetDomain: 'startup',
      intent: 'domain_conversation',
    })

    expect(res.targetDomain).toBe('startup')
    const ctxOptions = contextEngineMock.buildContextPackage.mock.calls[0]![1] as {
      domainState?: unknown
    }
    expect(ctxOptions.domainState).toBeUndefined()
  })

  it('không tìm thấy person row → dùng personId thay cho userId', async () => {
    const queryMock = vi.fn().mockResolvedValue({ rows: [] })
    const livePool = { query: queryMock } as unknown as Pool

    await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      // Nêu rõ domain='learning': từ 2026-08-27 câu chào chung rơi vào 'general' nên KHÔNG
      // vào nhánh Learning Read Model nữa — mà đúng nhánh đó mới là thứ test này đang kiểm.
      userMessage: 'Chào bạn',
      targetDomain: 'learning',
    })

    expect(queryMock).toHaveBeenCalledWith('select user_id from personal.persons where id = $1', [
      PERSON_ID,
    ])
  })
})

describe('executeCompanionTurn — trạng thái confirmed không rơi vào ô đếm nào', () => {
  it('action ở trạng thái confirmed → cả 3 bộ đếm đều là 0', async () => {
    const livePool = { query: vi.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool

    proposedActionMock.proposeAction.mockResolvedValueOnce({
      action: {
        id: '22222222-2222-4222-8222-222222222222',
        personId: PERSON_ID,
        capabilityId: 'learning.update_goal',
        action: 'update_goal',
        targetDomain: 'learning',
        payload: {},
        riskLevel: 'medium',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        schemaVersion: 1,
      },
      autoExecuted: false,
    })

    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Tôi muốn đặt mục tiêu IELTS 7.0',
    })

    expect(res.executionSummary).toMatchObject({
      plannedSteps: 1,
      executedSteps: 0,
      pendingConfirmationSteps: 0,
      rejectedSteps: 0,
    })
  })

  it('action ở trạng thái pending → đếm vào ô chờ xác nhận', async () => {
    const livePool = { query: vi.fn().mockResolvedValue({ rows: [] }) } as unknown as Pool

    // Dùng mock mặc định trong beforeEach (status = 'pending').
    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Tôi muốn đặt mục tiêu IELTS 7.0',
    })

    expect(res.executionSummary.pendingConfirmationSteps).toBe(1)
    expect(res.reply).toContain('Có 1 đề xuất hành động cần bạn xác nhận')
  })
})

describe('synthesizeCompanionReply with shared AI models', () => {
  const sampleContext = {
    id: CTX_ID,
    personId: PERSON_ID,
    requestId: 'req-3',
    items: [
      {
        sourceType: 'user_declared_fact' as const,
        sourceId: SOURCE_ID,
        content: 'Mục tiêu: Đạt IELTS 7.5 trong 6 tháng',
        provenance: 'profile:goals',
        sensitivity: 'personal' as const,
        tokenEstimate: 10,
      },
    ],
    tokenBudget: 2000,
    tokenUsed: 10,
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  }

  it('gọi Groq thành công khi có GROQ_API_KEY', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Chào bạn! Tôi là Bạn Đồng Hành AI sẵn sàng cùng bạn chinh phục IELTS.',
      latencyMs: 120,
    })

    const reply = await synthesizeCompanionReply(
      'Xin chào',
      'general_conversation',
      'learning',
      [],
      sampleContext,
    )

    expect(reply).toBe('Chào bạn! Tôi là Bạn Đồng Hành AI sẵn sàng cùng bạn chinh phục IELTS.')
    expect(chatProvidersMock.callGroqChatWithKeyPool).toHaveBeenCalled()
    delete process.env.GROQ_API_KEY
  })

  it('nguồn không phải transcript không được trở thành assistant message dù giả provenance', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Xin chào',
      latencyMs: 1,
    })
    await synthesizeCompanionReply('Xin chào', 'general_conversation', 'learning', [], {
      ...sampleContext,
      items: [{ ...sampleContext.items[0]!, provenance: 'companion_message:companion:learning' }],
    })
    const messages = chatProvidersMock.callGroqChatWithKeyPool.mock.calls[0]![2]
    expect(messages).toEqual([{ role: 'user', content: '' }])
    delete process.env.GROQ_API_KEY
  })

  it('fallback sang Anthropic khi Groq lỗi và có ANTHROPIC_API_KEY', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'network_error',
      message: 'Connection timeout',
      latencyMs: 500,
    })
    chatProvidersMock.callAnthropicChat.mockResolvedValueOnce({
      kind: 'response',
      status: 200,
      bodyText: JSON.stringify({
        content: [{ text: 'Phản hồi từ Anthropic Claude cho Bạn Đồng Hành.' }],
      }),
      latencyMs: 350,
    })

    const reply = await synthesizeCompanionReply(
      'Tư vấn sự nghiệp',
      'general_conversation',
      'career',
      [],
      sampleContext,
    )

    expect(reply).toBe('Phản hồi từ Anthropic Claude cho Bạn Đồng Hành.')
    expect(chatProvidersMock.callAnthropicChat).toHaveBeenCalled()
    delete process.env.GROQ_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  it('fallback sang Gemini khi Groq/Anthropic không có hoặc lỗi', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    geminiApiMock.callGemini.mockResolvedValueOnce('Phản hồi từ Google Gemini 2.0 Flash.')

    const reply = await synthesizeCompanionReply(
      'Lên kế hoạch',
      'general_conversation',
      'work',
      [],
      sampleContext,
    )

    expect(reply).toBe('Phản hồi từ Google Gemini 2.0 Flash.')
    expect(geminiApiMock.callGemini).toHaveBeenCalled()
    delete process.env.GEMINI_API_KEY
  })

  it('fallback về template deterministic khi không có bất kỳ API key nào', async () => {
    delete process.env.GROQ_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.GEMINI_API_KEY

    const reply = await synthesizeCompanionReply(
      'Xin chào bạn',
      'general_conversation',
      'learning',
      [],
      sampleContext,
    )

    expect(reply).toContain('Đồng Hành đã nhận được tin nhắn: "Xin chào bạn".')
    expect(reply).toContain('[Sử dụng 10/2000 token ngữ cảnh]')
  })
})

describe('executeCompanionTurn — câu hỏi tick chọn (interactiveQuestions)', () => {
  const QUESTION_BLOCK =
    '```dhcb-questions\n' +
    JSON.stringify({
      schemaVersion: 1,
      questions: [
        {
          id: 'linh_vuc',
          text: 'Bạn muốn khám phá lĩnh vực nào nhất?',
          multi: true,
          options: [
            { id: 'ngon_ngu', label: 'Học một ngôn ngữ mới' },
            { id: 'cong_nghe', label: 'Công nghệ, lập trình' },
          ],
          allowFreeText: true,
        },
      ],
    }) +
    '\n```'

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-groq-key'
  })

  it('tách khối câu hỏi khỏi lời văn — người dùng KHÔNG bao giờ thấy JSON thô', async () => {
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Mình tò mò muốn hỏi bạn:\n\n' + QUESTION_BLOCK,
      latencyMs: 100,
    })

    const res = await executeCompanionTurn(pool, {
      personId: PERSON_ID,
      userMessage: 'Xin chào',
    })

    expect(res.reply).toBe('Mình tò mò muốn hỏi bạn:')
    expect(res.reply).not.toContain('dhcb-questions')
    expect(res.reply).not.toContain('schemaVersion')
    expect(res.interactiveQuestions).toHaveLength(1)
    expect(res.interactiveQuestions[0]?.options).toHaveLength(2)
    delete process.env.GROQ_API_KEY
  })

  it('lượt trả lời thường (không có khối) vẫn giữ nguyên chữ, mảng câu hỏi rỗng', async () => {
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Chào bạn, hôm nay bạn thấy thế nào?',
      latencyMs: 100,
    })

    const res = await executeCompanionTurn(pool, {
      personId: PERSON_ID,
      userMessage: 'Xin chào',
    })

    expect(res.reply).toBe('Chào bạn, hôm nay bạn thấy thế nào?')
    expect(res.interactiveQuestions).toEqual([])
    delete process.env.GROQ_API_KEY
  })

  it('stream phát sự kiện "questions" và KHÔNG stream chữ của khối JSON', async () => {
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Mình hỏi bạn nhé:\n\n' + QUESTION_BLOCK,
      latencyMs: 100,
    })

    const events: string[] = []
    let streamedText = ''
    let questionCount = 0
    for await (const ev of streamCompanionTurn(pool, {
      personId: PERSON_ID,
      userMessage: 'Xin chào',
    })) {
      events.push(ev.type)
      if (ev.type === 'chunk') streamedText += ev.data.delta
      if (ev.type === 'questions') questionCount = ev.data.interactiveQuestions.length
    }

    expect(events).toContain('questions')
    expect(questionCount).toBe(1)
    expect(streamedText).toBe('Mình hỏi bạn nhé:')
    expect(streamedText).not.toContain('dhcb-questions')
    delete process.env.GROQ_API_KEY
  })

  it('KHÔNG phát sự kiện "questions" khi lượt đó không có câu hỏi', async () => {
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Chào bạn!',
      latencyMs: 100,
    })

    const events: string[] = []
    for await (const ev of streamCompanionTurn(pool, {
      personId: PERSON_ID,
      userMessage: 'Xin chào',
    })) {
      events.push(ev.type)
    }

    expect(events).not.toContain('questions')
    delete process.env.GROQ_API_KEY
  })
})

describe('executeCompanionTurn — TRÍ NHỚ hội thoại (vá lỗi "không nhớ gì", 2026-08-25)', () => {
  const NOW = new Date('2026-08-25T10:00:00Z')

  function historyRow(over: Record<string, unknown> = {}) {
    return {
      id: '55555555-5555-4555-8555-555555555555',
      role: 'user',
      content: 'Tôi là Kẻ Tìm Kiếm',
      domain: 'profile',
      intent: 'update_profile_fact',
      created_at: NOW,
      ...over,
    }
  }

  /** Pool giả: trả lịch sử cho câu select, nuốt câu insert. */
  function poolWithHistory(rows: unknown[]) {
    const query = vi.fn(async (sql: string, params?: unknown[]) => {
      void params
      if (sql.includes('select') && sql.includes('companion_messages')) {
        return { rows }
      }
      return { rows: [historyRow()] }
    })
    return { pool: { query } as unknown as Pool, query }
  }

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValue({
      kind: 'success',
      text: 'Ừ, mình nhớ bạn là Kẻ Tìm Kiếm.',
      latencyMs: 100,
    })
  })

  it('GỬI lịch sử vào prompt LLM, đúng thứ tự cũ → mới, trước tin nhắn hiện tại', async () => {
    contextEngineMock.buildContextPackage.mockResolvedValue({
      items: [
        {
          sourceType: 'current_request',
          content: 'tôi là ai',
          provenance: 'user_input:current_turn',
        },
        {
          sourceType: 'recent_episodic_context',
          content: 'Tôi là Kẻ Tìm Kiếm',
          provenance: 'companion_message:user:personal',
        },
        {
          sourceType: 'recent_episodic_context',
          content: 'Mình đã ghi nhận',
          provenance: 'companion_message:companion:personal',
        },
      ],
      tokenBudget: 2000,
      tokenUsed: 50,
    })

    const { pool: livePool } = poolWithHistory([
      historyRow({ id: 'b', role: 'companion', content: 'Mình đã ghi nhận' }),
      historyRow({ id: 'a', role: 'user', content: 'Tôi là Kẻ Tìm Kiếm' }),
    ])

    await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'tôi là ai',
      targetDomain: 'personal',
    })

    const messages = chatProvidersMock.callGroqChatWithKeyPool.mock.calls[0]![2] as Array<{
      role: string
      content: string
    }>
    expect(messages).toHaveLength(3)
    expect(messages[0]).toEqual({ role: 'user', content: 'Tôi là Kẻ Tìm Kiếm' })
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Mình đã ghi nhận' })
    expect(messages[2]).toEqual({ role: 'user', content: 'tôi là ai' })
    delete process.env.GROQ_API_KEY
  })

  it('LƯU cả tin người dùng lẫn câu trả lời để lượt sau còn nhớ', async () => {
    const { pool: livePool, query } = poolWithHistory([])

    await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'tôi là ai',
      targetDomain: 'personal',
    })

    const inserts = query.mock.calls
      .filter((c) => String(c[0]).includes('insert into personal.companion_messages'))
      .map((c) => c[1] as unknown[])
    expect(inserts).toHaveLength(2)
    expect(inserts[0]![1]).toBe('user')
    expect(inserts[0]![2]).toBe('tôi là ai')
    expect(inserts[1]![1]).toBe('companion')
    expect(inserts[1]![2]).toBe('Ừ, mình nhớ bạn là Kẻ Tìm Kiếm.')
    delete process.env.GROQ_API_KEY
  })

  it('lỗi ĐỌC lịch sử không được làm hỏng lượt trả lời', async () => {
    const livePool = {
      query: vi.fn(async (sql: string) => {
        if (String(sql).includes('select') && String(sql).includes('companion_messages')) {
          throw new Error('DB sập')
        }
        return { rows: [historyRow()] }
      }),
    } as unknown as Pool

    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'tôi là ai',
      targetDomain: 'personal',
    })

    expect(res.reply).toBe('Ừ, mình nhớ bạn là Kẻ Tìm Kiếm.')
    delete process.env.GROQ_API_KEY
  })

  it('lỗi GHI lịch sử cũng không được làm hỏng lượt trả lời', async () => {
    const livePool = {
      query: vi.fn(async (sql: string) => {
        if (String(sql).includes('insert into personal.companion_messages')) {
          throw new Error('DB sập')
        }
        return { rows: [] }
      }),
    } as unknown as Pool

    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'tôi là ai',
      targetDomain: 'personal',
    })

    expect(res.reply).toBe('Ừ, mình nhớ bạn là Kẻ Tìm Kiếm.')
    delete process.env.GROQ_API_KEY
  })
})

it('runtime không nạp transcript ngoài ContextPackage đã lọc', async () => {
  const query = vi.fn(async (sql: string) => {
    void sql
    return { rows: [] }
  })
  await executeCompanionTurn({ query } as unknown as Pool, {
    personId: PERSON_ID,
    userMessage: 'hello',
    targetDomain: 'life',
  })
  expect(
    query.mock.calls.filter(
      ([sql]) => String(sql).includes('select') && String(sql).includes('companion_messages'),
    ),
  ).toHaveLength(0)
  expect(contextEngineMock.buildContextPackage).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ includeCompanionHistory: true, domain: 'life' }),
  )
})

it('provider chỉ nhận nội dung đã nằm trong budget, không gửi lại raw request', async () => {
  process.env.GROQ_API_KEY = 'test-groq-key'
  chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValue({ kind: 'success', text: 'ok' })
  contextEngineMock.buildContextPackage.mockResolvedValue({
    id: CTX_ID,
    personId: PERSON_ID,
    requestId: 'budget',
    items: [
      { sourceType: 'current_request', content: 'cut', provenance: 'user_input:current_turn' },
    ],
    tokenBudget: 1,
    tokenUsed: 1,
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
  })
  await executeCompanionTurn(pool, {
    personId: PERSON_ID,
    userMessage: 'cut RAW_SECRET_OUTSIDE_BUDGET',
    targetDomain: 'learning',
    tokenBudget: 1,
  })
  expect(chatProvidersMock.callGroqChatWithKeyPool.mock.calls[0]![2]).toEqual([
    { role: 'user', content: 'cut' },
  ])
  expect(chatProvidersMock.callGroqChatWithKeyPool.mock.calls[0]![1]).not.toContain(
    'RAW_SECRET_OUTSIDE_BUDGET',
  )
  delete process.env.GROQ_API_KEY
})

it('cả hai vế transcript kế thừa sensitivity từ context T2 đã đọc', async () => {
  contextEngineMock.buildContextPackage.mockResolvedValue({
    items: [
      {
        sourceType: 'recent_episodic_context',
        content: 'T2',
        sensitivity: 'sensitive',
        provenance: 'companion_message:companion:life',
      },
    ],
    tokenBudget: 100,
    tokenUsed: 1,
  })
  const query = vi.fn(async () => ({
    rows: [
      {
        id: SOURCE_ID,
        role: 'user',
        content: 'hello',
        domain: 'life',
        intent: null,
        created_at: new Date(),
      },
    ],
  }))
  await executeCompanionTurn({ query } as unknown as Pool, {
    personId: PERSON_ID,
    userMessage: 'hello',
    targetDomain: 'life',
    maxSensitivity: 'sensitive',
  })
  for (const call of vi.mocked(query).mock.calls as unknown[][]) {
    if (String(call[0]).includes('insert into personal.companion_messages'))
      expect((call[1] as unknown[])[5]).toBe('sensitive')
  }
})

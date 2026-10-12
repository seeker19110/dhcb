// packages/core-personal/companionRuntime.test.ts — Unit tests for Companion Runtime pipeline.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'
import {
  resolveIntentAndDomain,
  detectDomainByKeyword,
  generatePlan,
  synthesizeReply,
  synthesizeCompanionReply,
  AI_UNAVAILABLE_NOTE,
  executeCompanionTurn,
  streamCompanionTurn,
  COMPANION_DEFAULT_TOKEN_BUDGET,
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

// Lớp an toàn: mặc định "không có dấu hiệu" để các test luồng chính không gọi bộ phân loại Haiku;
// ca khủng hoảng tự đặt `safetyMock.assessSafety` riêng.
const safetyMock = vi.hoisted(() => ({
  assessSafety: vi.fn<(...a: unknown[]) => Promise<unknown>>(async () => ({
    level: 'none',
    category: 'none',
    source: 'none',
  })),
}))
vi.mock('./safetyGuard.js', () => ({
  assessSafety: (...a: unknown[]) => safetyMock.assessSafety(...a),
}))

const chatProvidersMock = vi.hoisted(() => ({
  callGroqChat: vi.fn(),
  callGroqChatWithKeyPool: vi.fn(),
}))

vi.mock('@dhcb/core-ai/chatProviders', () => ({
  callGroqChat: (...a: unknown[]) => chatProvidersMock.callGroqChat(...a),
  callGroqChatWithKeyPool: (...a: unknown[]) => chatProvidersMock.callGroqChatWithKeyPool(...a),
}))

const anthropicClientMock = vi.hoisted(() => ({
  callAnthropicText: vi.fn(),
}))

vi.mock('@dhcb/core-ai/anthropicClient', () => ({
  callAnthropicText: (...a: unknown[]) => anthropicClientMock.callAnthropicText(...a),
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
  // Trụ Work (Ghi chú) có từ khoá riêng → domain_conversation + 'work'.
  it.each([
    ['Dự án này sắp tới deadline rồi', 'work'],
    ['Làm sao tăng năng suất công việc', 'work'],
  ])('nhận diện đúng trụ cho câu %s', (msg, domain) => {
    const res = resolveIntentAndDomain(msg)
    expect(res.domain).toBe(domain)
    expect(res.intent).toBe('domain_conversation')
  })

  // [changelog 0624] Career · Startup · Life đã XOÁ HẲN (2026-09-20). Câu về các chủ đề đó vẫn
  // được NHẬN RA (để không rơi nhầm vào nhánh "mục tiêu học tập"), nhưng về cặp
  // general_conversation/general — khớp đúng `normalizeRoutedIntent` của bộ định tuyến LLM, để hai
  // đường (từ khoá / LLM) cho cùng kết quả, không còn domain ma 'career'/'startup'/'life'.
  it.each([
    'Tôi muốn thăng tiến trong sự nghiệp',
    'Chuẩn bị phỏng vấn thế nào?',
    'Tôi đang khởi nghiệp mảng edtech',
    'Cần kiểm chứng giả định về khách hàng mục tiêu',
    'Tôi muốn xây thói quen dậy sớm',
    'Dạo này giấc ngủ của tôi kém',
  ])('chủ đề của trụ đã xoá → general_conversation/general: %s', (msg) => {
    expect(resolveIntentAndDomain(msg)).toEqual({
      intent: 'general_conversation',
      domain: 'general',
    })
  })

  // "mục tiêu" là từ chung. Câu nói về chủ đề ngoài học tập KHÔNG được thành mục tiêu học tập.
  it('câu có chữ "mục tiêu" nhưng nói về sự nghiệp thì KHÔNG rơi vào learning', () => {
    expect(resolveIntentAndDomain('Mục tiêu sự nghiệp của tôi là gì?')).toEqual({
      intent: 'general_conversation',
      domain: 'general',
    })
  })

  it('cân bằng công việc giữ trụ Work (Work đứng trước nhóm đời sống trong bảng)', () => {
    expect(resolveIntentAndDomain('cân bằng cuộc sống và công việc').domain).toBe('work')
  })

  it('explicit domain luôn thắng bảng từ khoá', () => {
    const res = resolveIntentAndDomain('Tôi muốn thăng tiến trong sự nghiệp', undefined, 'work')
    expect(res.domain).toBe('work')
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

    // [2026-10-11] Câu tra `personal.persons` nay chạy ở MỌI miền (lấy user_id + nhóm tuổi cho
    // prompt) — chỉ còn khẳng định KHÔNG có câu nào của Learning Read Model (bảng learner).
    const sqlCalls = queryMock.mock.calls.map((call) => String(call[0]))
    expect(sqlCalls.filter((sql) => sql.includes('personal.persons'))).toHaveLength(1)
    expect(sqlCalls.some((sql) => /learner|lesson|srs/.test(sql))).toBe(false)
    expect(res.targetDomain).toBe('personal')
    expect(res.executionSummary.plannedSteps).toBe(0)
    const ctxOptions = contextEngineMock.buildContextPackage.mock.calls[0]![1] as {
      domainState?: unknown
      tokenBudget?: number
    }
    expect(ctxOptions.domainState).toBeUndefined()
    // Không truyền tokenBudget → runtime dùng ngân sách mặc định của Companion (4000, không
    // phải 2000 của Context Engine — xem COMPANION_DEFAULT_TOKEN_BUDGET).
    expect(ctxOptions.tokenBudget).toBe(COMPANION_DEFAULT_TOKEN_BUDGET)
  })

  // [2026-08-27] Companion "xuyên suốt các trụ": trước đây CHỈ trụ Learning có read model nạp vào
  // ngữ cảnh. Ba trụ Career · Startup · Life đã gỡ (2026-09-20) — chỉ còn trụ Ghi chú (`work`)
  // ngoài Learning (changelog 0628).
  it.each(['work'])('trụ %s → nạp read model của trụ đó vào ngữ cảnh', async (domain) => {
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
    // KHÔNG chạm vào nhánh Learning Read Model (câu tra `personal.persons` còn lại là câu đọc
    // hồ sơ/nhóm tuổi, chạy ở mọi miền từ 2026-10-11).
    expect(
      queryMock.mock.calls.map((c) => String(c[0])).some((q) => /learner|lesson|srs/.test(q)),
    ).toBe(false)
  })

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

    // Câu đọc hồ sơ (user_id + nhóm tuổi) chạy với đúng personId; không có hàng → userId rơi về
    // personId (kiểm qua lời gọi read model bên dưới không ném lỗi, hành vi cũ giữ nguyên).
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/select p\.user_id, pr\.age_group[\s\S]*personal\.persons p/),
      [PERSON_ID],
    )
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

    expect(reply).toEqual({
      isFallback: false,
      text: 'Chào bạn! Tôi là Bạn Đồng Hành AI sẵn sàng cùng bạn chinh phục IELTS.',
    })
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

  it('Anthropic là AI CHÍNH: có key thì gọi Claude (nhiệm vụ companion → Sonnet), KHÔNG gọi Groq', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
    anthropicClientMock.callAnthropicText.mockResolvedValueOnce({
      kind: 'success',
      text: 'Phản hồi từ Anthropic Claude cho Bạn Đồng Hành.',
      model: 'claude-sonnet-5-5',
      usage: null,
      latencyMs: 350,
    })

    const reply = await synthesizeCompanionReply(
      'Tư vấn sự nghiệp',
      'general_conversation',
      'career',
      [],
      sampleContext,
    )

    // Không truyền onDelta → `streamed: false` (nơi gọi tự phát chữ).
    expect(reply).toEqual({
      isFallback: false,
      streamed: false,
      text: 'Phản hồi từ Anthropic Claude cho Bạn Đồng Hành.',
    })
    const call = anthropicClientMock.callAnthropicText.mock.calls[0]![0] as {
      route: { model: string }
      system: string
    }
    expect(call.route.model).toBe('claude-sonnet-5-5')
    expect(call.system).toContain('Bạn Đồng Hành')
    expect(chatProvidersMock.callGroqChatWithKeyPool).not.toHaveBeenCalled()
    delete process.env.GROQ_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  it('Anthropic lỗi (bị cắt/từ chối/lỗi mạng) → fallback sang Groq', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
    anthropicClientMock.callAnthropicText.mockResolvedValueOnce({
      kind: 'unusable',
      reason: 'max_tokens',
      detail: 'chạm trần',
      model: 'claude-sonnet-5-5',
      usage: null,
      latencyMs: 500,
    })
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Từ Groq',
      latencyMs: 1,
    })

    const reply = await synthesizeCompanionReply(
      'Tư vấn sự nghiệp',
      'general_conversation',
      'career',
      [],
      sampleContext,
    )

    expect(reply).toEqual({ isFallback: false, text: 'Từ Groq' })
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

    expect(reply).toEqual({ isFallback: false, text: 'Phản hồi từ Google Gemini 2.0 Flash.' })
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

    expect(reply.text).toContain('Đồng Hành đã nhận được tin nhắn: "Xin chào bạn".')
    expect(reply.text).toContain('[Sử dụng 10/2000 token ngữ cảnh]')
    expect(reply.isFallback).toBe(true)
    expect(reply.text).toContain(AI_UNAVAILABLE_NOTE)
  })

  it('có key nhưng CẢ BA nhà cung cấp đều lỗi → câu mẫu + isFallback + ghi log từng nhánh', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
    process.env.GROQ_API_KEY = 'test-groq-key'
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    anthropicClientMock.callAnthropicText.mockResolvedValueOnce({
      kind: 'api_error',
      status: 401,
      message: 'invalid x-api-key',
      latencyMs: 5,
    })
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'http_error',
      status: 503,
      bodyText: 'over capacity',
      latencyMs: 5,
    })
    geminiApiMock.callGemini.mockRejectedValueOnce(new Error('quota exceeded'))

    const reply = await synthesizeCompanionReply(
      'Xin chào',
      'general_conversation',
      'learning',
      [],
      sampleContext,
    )

    expect(reply.isFallback).toBe(true)
    expect(reply.text).toContain(AI_UNAVAILABLE_NOTE)
    const logged = warn.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Anthropic HTTP 401')
    expect(logged).toContain('Groq HTTP 503')
    expect(logged).toContain('Gemini lỗi: quota exceeded')
    expect(error).toHaveBeenCalledTimes(1)
    warn.mockRestore()
    error.mockRestore()
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.GROQ_API_KEY
    delete process.env.GEMINI_API_KEY
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

// ─── [2026-10-11] Nâng cấp GĐ1: stream thật · lớp an toàn · nhóm tuổi ───────────────────────
import {
  QuestionFenceGuard,
  IMMINENT_SAFETY_REPLY,
  prepareCompanionTurn,
} from './companionRuntime.js'

describe('QuestionFenceGuard — giữ khối ```dhcb-questions khỏi stream', () => {
  function run(deltas: string[]): string {
    let out = ''
    const guard = new QuestionFenceGuard((d) => (out += d))
    for (const d of deltas) guard.push(d)
    guard.end()
    return out
  }

  it('chữ thường và code block thường đi qua nguyên vẹn', () => {
    expect(run(['Xin ', 'chào ', 'bạn!'])).toBe('Xin chào bạn!')
    expect(run(['Ví dụ:\n```py', 'thon\nprint(1)\n```\nxong'])).toBe(
      'Ví dụ:\n```python\nprint(1)\n```\nxong',
    )
  })

  it('khối câu hỏi bị nuốt kể cả khi tên khối đến theo từng mẩu', () => {
    expect(run(['Mình hỏi nhé:\n\n``', '`dh', 'cb-questions\n{"a":1}\n```'])).toBe(
      'Mình hỏi nhé:\n\n',
    )
  })

  it('stream hết khi mới thấy "```dh" (không thành khối) → nhả nốt', () => {
    expect(run(['a ', '```dh'])).toBe('a ```dh')
  })
})

describe('streamCompanionTurn — stream THẬT từ Claude', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
  })
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
  })

  it('phát chunk ngay khi Claude sinh chữ, giữ khối câu hỏi, không phát lại theo từng từ', async () => {
    const QUESTION_BLOCK =
      '```dhcb-questions\n' +
      JSON.stringify({
        schemaVersion: 1,
        questions: [
          {
            id: 'q',
            text: 'Chọn?',
            multi: false,
            options: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
            allowFreeText: false,
          },
        ],
      }) +
      '\n```'
    anthropicClientMock.callAnthropicText.mockImplementationOnce(
      async (params: { onTextDelta?: (d: string) => void }) => {
        for (const d of ['Chào ', 'bạn.', '\n\n', QUESTION_BLOCK]) params.onTextDelta?.(d)
        return {
          kind: 'success',
          text: 'Chào bạn.\n\n' + QUESTION_BLOCK,
          model: 'claude-sonnet-5-5',
          usage: null,
          latencyMs: 10,
        }
      },
    )
    const events: CompanionStreamEventLike[] = []
    for await (const ev of streamCompanionTurn(pool, { personId: PERSON_ID, userMessage: 'Hi' })) {
      events.push(ev)
    }
    const chunks = events.filter((e) => e.type === 'chunk').map((e) => e.data.delta)
    expect(chunks).toEqual(['Chào ', 'bạn.', '\n\n'])
    expect(events.map((e) => e.type)).toEqual([
      'meta',
      'chunk',
      'chunk',
      'chunk',
      'actions',
      'questions',
      'done',
    ])
    const done = events.at(-1)!
    expect(done.type === 'done' && done.data.reply).toBe('Chào bạn.')
    expect(done.type === 'done' && done.data.interactiveQuestions).toHaveLength(1)
  })

  it('Claude rớt giữa chừng → dự phòng Groq trả bản đầy đủ, phát theo từng từ, done.reply đúng', async () => {
    process.env.GROQ_API_KEY = 'g'
    anthropicClientMock.callAnthropicText.mockImplementationOnce(
      async (params: { onTextDelta?: (d: string) => void }) => {
        params.onTextDelta?.('Dở ')
        return { kind: 'network_error', message: 'rớt', latencyMs: 10 }
      },
    )
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'success',
      text: 'Bản đầy đủ từ Groq',
      latencyMs: 5,
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const events: CompanionStreamEventLike[] = []
    for await (const ev of streamCompanionTurn(pool, { personId: PERSON_ID, userMessage: 'Hi' })) {
      events.push(ev)
    }
    const chunks = events.filter((e) => e.type === 'chunk').map((e) => e.data.delta)
    // Mẩu "Dở " đã phát (không rút lại được) — rồi bản đầy đủ phát theo từng từ sau nó.
    expect(chunks[0]).toBe('Dở ')
    expect(chunks.slice(1).join('')).toBe('Bản đầy đủ từ Groq')
    const done = events.at(-1)!
    expect(done.type === 'done' && done.data.reply).toBe('Bản đầy đủ từ Groq')
    warn.mockRestore()
    delete process.env.GROQ_API_KEY
  })

  it('AI ném lỗi giữa stream → generator ném ra ngoài (handler hoàn lượt), không treo', async () => {
    anthropicClientMock.callAnthropicText.mockRejectedValueOnce(new Error('bùm'))
    const gen = streamCompanionTurn(pool, { personId: PERSON_ID, userMessage: 'Hi' })
    await expect(
      (async () => {
        for await (const _ev of gen) void _ev
      })(),
    ).rejects.toThrow('bùm')
  })
})

type CompanionStreamEventLike = Awaited<
  ReturnType<ReturnType<typeof streamCompanionTurn>['next']>
>['value'] extends infer V
  ? Exclude<V, CompanionResponseLike>
  : never
type CompanionResponseLike = { reply: string; interactiveQuestions: unknown[] }

describe('lớp an toàn trong lượt thoại', () => {
  function poolRecording() {
    // Khai đủ chữ ký (sql, params) để test đọc được tham số insert ở call[1].
    const query = vi.fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>(
      async (sql) => {
        if (sql.includes('select p.user_id, pr.age_group')) {
          return { rows: [{ user_id: 'user-9', age_group: 'thieu_nien' }] }
        }
        if (sql.includes('insert into personal.companion_messages')) {
          return {
            rows: [
              {
                id: SOURCE_ID,
                role: 'user',
                content: 'x',
                domain: null,
                intent: null,
                sensitivity: 'sensitive',
                created_at: new Date(),
              },
            ],
          }
        }
        return { rows: [] }
      },
    )
    return { pool: { query } as unknown as Pool, query }
  }

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'g'
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValue({
      kind: 'success',
      text: 'Mình ở đây với bạn.',
      latencyMs: 5,
    })
  })
  afterEach(() => {
    delete process.env.GROQ_API_KEY
    safetyMock.assessSafety.mockResolvedValue({ level: 'none', category: 'none', source: 'none' })
  })

  it('concern: KHÔNG lập kế hoạch tác vụ, prompt có lời dặn an toàn + nhóm tuổi, transcript ≥ sensitive, trả safety', async () => {
    safetyMock.assessSafety.mockResolvedValue({
      level: 'concern',
      category: 'abuse',
      source: 'keyword',
    })
    const { pool: livePool, query } = poolRecording()
    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      // Câu này bình thường ra intent create_memory → có bước memory.create_record.
      userMessage: 'ghi nhớ giúp tôi: bố đánh con',
    })
    expect(proposedActionMock.proposeAction).not.toHaveBeenCalled()
    expect(res.proposedActions).toEqual([])
    expect(res.safety).toMatchObject({ level: 'concern', category: 'abuse' })
    expect(res.safety?.resources.map((r) => r.phone)).toContain('111')
    const system = chatProvidersMock.callGroqChatWithKeyPool.mock.calls[0]![1] as string
    expect(system).toContain('AN TOÀN')
    expect(system).toContain('THIẾU NIÊN')
    expect(system).not.toContain('dhcb-questions')
    const inserts = query.mock.calls.filter(([sql]) =>
      String(sql).includes('insert into personal.companion_messages'),
    )
    expect(inserts).toHaveLength(2)
    for (const [, params] of inserts) expect(params?.[5]).toBe('sensitive')
    // Bộ phân loại nhận lượt người dùng gần đây từ ngữ cảnh đã lọc (ở đây rỗng) + câu hiện tại.
    expect(safetyMock.assessSafety).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'ghi nhớ giúp tôi: bố đánh con', recentUserTurns: [] }),
    )
  })

  it('imminent: câu cố định, KHÔNG gọi AI, KHÔNG lưu transcript, stream phát sự kiện safety trước chữ', async () => {
    safetyMock.assessSafety.mockResolvedValue({
      level: 'imminent',
      category: 'self_harm',
      source: 'both',
    })
    const { pool: livePool, query } = poolRecording()
    const events: string[] = []
    let reply = ''
    for await (const ev of streamCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'x',
    })) {
      events.push(ev.type)
      if (ev.type === 'chunk') reply += ev.data.delta
      if (ev.type === 'done') expect(ev.data.safety?.level).toBe('imminent')
    }
    expect(events.slice(0, 3)).toEqual(['meta', 'safety', 'chunk'])
    expect(reply).toBe(IMMINENT_SAFETY_REPLY)
    expect(chatProvidersMock.callGroqChatWithKeyPool).not.toHaveBeenCalled()
    expect(anthropicClientMock.callAnthropicText).not.toHaveBeenCalled()
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('insert into personal.companion_messages'),
      ),
    ).toBe(false)
  })

  it('lượt thường: không có safety trong response, prompt có mốc thời gian và nhóm tuổi từ hồ sơ', async () => {
    const { pool: livePool } = poolRecording()
    const prepared = await prepareCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Chào',
    })
    expect(prepared.ageGroup).toBe('thieu_nien')
    const res = await executeCompanionTurn(livePool, { personId: PERSON_ID, userMessage: 'Chào' })
    expect(res.safety).toBeUndefined()
    const system = chatProvidersMock.callGroqChatWithKeyPool.mock.calls.at(-1)![1] as string
    expect(system).toContain('BÂY GIỜ LÀ:')
    expect(system).toContain('giờ Việt Nam')
    expect(system).toContain('THIẾU NIÊN')
  })
})

// ─── [GĐ2a] Phiên tạm (ephemeral): "nói chuyện mà không lưu" ────────────────────────────────
describe('executeCompanionTurn — phiên tạm (ephemeral, GĐ2a)', () => {
  function recordingPool() {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('select') && sql.includes('companion_messages')) return { rows: [] }
      // Hàng trả về của insert phải đủ cột để `toMessage` không ném (ném thì bị nuốt im lặng).
      return {
        rows: [
          {
            id: SOURCE_ID,
            role: 'user',
            content: 'x',
            domain: null,
            intent: null,
            created_at: new Date(),
            user_id: 'user-123',
          },
        ],
      }
    })
    return { pool: { query } as unknown as Pool, query }
  }

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-groq-key'
    chatProvidersMock.callGroqChatWithKeyPool.mockResolvedValue({
      kind: 'success',
      text: 'Mình nghe đây.',
      latencyMs: 10,
    })
  })

  it('không nạp ngữ cảnh cá nhân lẫn lịch sử, KHÔNG ghi transcript', async () => {
    const { pool: livePool, query } = recordingPool()
    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Hôm nay mình hơi mệt',
      targetDomain: 'life',
      ephemeral: true,
    })
    expect(res.reply).toBe('Mình nghe đây.')
    expect(contextEngineMock.buildContextPackage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ includePersonalContext: false, includeCompanionHistory: false }),
    )
    const inserts = query.mock.calls.filter((c) =>
      String(c[0]).includes('insert into personal.companion_messages'),
    )
    expect(inserts).toHaveLength(0)
  })

  it('câu "ghi nhớ…" trong phiên tạm → KHÔNG tạo bước memory.create_record, không đề xuất hành động', async () => {
    const { pool: livePool } = recordingPool()
    const res = await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Ghi nhớ giúp tôi cuộc họp ngày mai',
      ephemeral: true,
    })
    expect(res.intent).toBe('create_memory')
    expect(res.executionSummary.plannedSteps).toBe(0)
    expect(proposedActionMock.proposeAction).not.toHaveBeenCalled()
  })

  it('mặc định (không ephemeral) vẫn nạp ngữ cảnh cá nhân + lịch sử và lưu transcript', async () => {
    const { pool: livePool, query } = recordingPool()
    await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Hôm nay mình hơi mệt',
      targetDomain: 'life',
    })
    expect(contextEngineMock.buildContextPackage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ includePersonalContext: true, includeCompanionHistory: true }),
    )
    const inserts = query.mock.calls.filter((c) =>
      String(c[0]).includes('insert into personal.companion_messages'),
    )
    expect(inserts).toHaveLength(2)
  })

  it('lớp an toàn VẪN chạy trong phiên tạm', async () => {
    const { pool: livePool } = recordingPool()
    await executeCompanionTurn(livePool, {
      personId: PERSON_ID,
      userMessage: 'Hôm nay mình hơi mệt',
      ephemeral: true,
    })
    expect(safetyMock.assessSafety).toHaveBeenCalledTimes(1)
  })
})

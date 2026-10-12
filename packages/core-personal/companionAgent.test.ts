// packages/core-personal/companionAgent.test.ts — Chế độ tác tử của Bạn Đồng Hành (GĐ3).
// Đặc tả: docs/specs/2026-10-12-ban-dong-hanh-gd3-tac-tu-cong-cu.md (tiêu chí chấp nhận). Mock
// vòng công cụ + bộ định tuyến ở ranh giới module — logic từng phần đã có test riêng
// (anthropicToolLoop.test.ts, intentRouter.test.ts, companionTools.test.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import {
  executeCompanionTurn,
  streamCompanionTurn,
  type CompanionAgentToolkit,
  type CompanionStreamEvent,
} from './companionRuntime.js'
import { NOTHING_SAVED_NOTE } from './finalAnswerChecks.js'

const PERSON_ID = '11111111-1111-4111-8111-111111111111'
const CTX_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROPOSAL_ID = '33333333-3333-4333-8333-333333333333'

const contextEngineMock = vi.hoisted(() => ({ buildContextPackage: vi.fn() }))
vi.mock('./contextEngine.js', () => ({
  buildContextPackage: (...a: unknown[]) => contextEngineMock.buildContextPackage(...a),
}))

const proposedActionMock = vi.hoisted(() => ({ proposeAction: vi.fn() }))
vi.mock('./proposedActionService.js', () => ({
  proposeAction: (...a: unknown[]) => proposedActionMock.proposeAction(...a),
}))

const messageMock = vi.hoisted(() => ({ appendCompanionMessage: vi.fn() }))
vi.mock('./companionMessageService.js', () => ({
  appendCompanionMessage: (...a: unknown[]) => messageMock.appendCompanionMessage(...a),
}))

const safetyMock = vi.hoisted(() => ({
  assessSafety: vi.fn<(...a: unknown[]) => Promise<unknown>>(),
}))
vi.mock('./safetyGuard.js', () => ({
  assessSafety: (...a: unknown[]) => safetyMock.assessSafety(...a),
}))

const routerMock = vi.hoisted(() => ({ routeIntent: vi.fn() }))
vi.mock('./intentRouter.js', () => ({
  routeIntent: (...a: unknown[]) => routerMock.routeIntent(...a),
}))

// Phiên công cụ giả: `proposals` được vòng giả lập đẩy vào như công cụ đề xuất thật.
const toolsMock = vi.hoisted(() => ({
  createCompanionToolSession: vi.fn(),
}))
vi.mock('./companionTools.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./companionTools.js')>()),
  createCompanionToolSession: (...a: unknown[]) => toolsMock.createCompanionToolSession(...a),
}))

const loopMock = vi.hoisted(() => ({ runAnthropicToolLoop: vi.fn() }))
vi.mock('@dhcb/core-ai/anthropicToolLoop', () => ({
  runAnthropicToolLoop: (...a: unknown[]) => loopMock.runAnthropicToolLoop(...a),
}))

const anthropicMock = vi.hoisted(() => ({ callAnthropicText: vi.fn() }))
vi.mock('@dhcb/core-ai/anthropicClient', () => ({
  callAnthropicText: (...a: unknown[]) => anthropicMock.callAnthropicText(...a),
}))

const groqMock = vi.hoisted(() => ({ callGroqChatWithKeyPool: vi.fn() }))
vi.mock('@dhcb/core-ai/chatProviders', () => ({
  callGroqChatWithKeyPool: (...a: unknown[]) => groqMock.callGroqChatWithKeyPool(...a),
}))

vi.mock('@dhcb/core-ai/geminiApi', () => ({ callGemini: vi.fn() }))
vi.mock('@dhcb/core-ai/aiTokenUsage', () => ({ recordAiTokenUsage: vi.fn(async () => {}) }))

const pool = {} as Pool
const toolkit: CompanionAgentToolkit = { lookupDictionary: () => [] }

const pendingProposal: ProposedAction = {
  id: PROPOSAL_ID,
  personId: PERSON_ID,
  capabilityId: 'memory.create_record',
  action: 'create_record',
  targetDomain: 'personal',
  payload: { content: 'Thích học buổi sáng' },
  riskLevel: 'low',
  status: 'pending',
  createdAt: new Date().toISOString(),
  schemaVersion: 1,
}

/** Phiên công cụ giả + vòng giả: gọi `onToolStart`, đẩy một đề xuất, phát chữ, rồi trả kết quả. */
function arrangeAgentLoop(
  result: Record<string, unknown>,
  options: { text?: string; propose?: boolean } = {},
) {
  const session = {
    definitions: [],
    execute: vi.fn(),
    proposals: [] as ProposedAction[],
  }
  toolsMock.createCompanionToolSession.mockReturnValue(session)
  loopMock.runAnthropicToolLoop.mockImplementation(
    async (params: {
      onToolStart?: (name: string) => void
      onTextDelta?: (delta: string) => void
    }) => {
      params.onToolStart?.('get_learning_progress')
      if (options.propose) session.proposals.push(pendingProposal)
      if (options.text) params.onTextDelta?.(options.text)
      return { calls: [], toolCalls: [{ name: 'get_learning_progress', ok: true }], ...result }
    },
  )
  return session
}

const savedEnv = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ANTHROPIC_API_KEY = 'sk-test'
  delete process.env.GROQ_API_KEY
  delete process.env.GEMINI_API_KEY
  contextEngineMock.buildContextPackage.mockResolvedValue({
    id: CTX_ID,
    personId: PERSON_ID,
    requestId: 'req-agent',
    items: [],
    tokenBudget: 4000,
    tokenUsed: 0,
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  })
  safetyMock.assessSafety.mockResolvedValue({ level: 'none', category: 'none', source: 'none' })
  routerMock.routeIntent.mockResolvedValue({
    intent: 'general_chat',
    domain: 'learning',
    source: 'router',
  })
})

afterEach(() => {
  process.env = { ...savedEnv }
})

describe('chế độ tác tử (GĐ3)', () => {
  it('không chạy planner từ khoá: câu "đặt mục tiêu" không tự sinh đề xuất', async () => {
    arrangeAgentLoop({ kind: 'success', text: 'Mình gợi ý mục tiêu nhé.', model: 'm', steps: 1 })
    const res = await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Tôi muốn đặt mục tiêu học IELTS 7.5' },
      toolkit,
    )
    expect(proposedActionMock.proposeAction).not.toHaveBeenCalled()
    expect(res.executionSummary.plannedSteps).toBe(0)
    expect(loopMock.runAnthropicToolLoop).toHaveBeenCalledTimes(1)
    expect(anthropicMock.callAnthropicText).not.toHaveBeenCalled()
  })

  it('đề xuất do công cụ tạo vào response và executionSummary', async () => {
    arrangeAgentLoop(
      { kind: 'success', text: 'Mình đã ghi đề xuất, bạn duyệt nhé.', model: 'm', steps: 2 },
      { propose: true },
    )
    const res = await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Nhớ giúp mình là mình thích học buổi sáng' },
      toolkit,
    )
    expect(res.proposedActions.map((a) => a.id)).toEqual([PROPOSAL_ID])
    expect(res.executionSummary).toEqual({
      plannedSteps: 1,
      executedSteps: 0,
      pendingConfirmationSteps: 1,
      rejectedSteps: 0,
    })
  })

  it('lượt `concern` KHÔNG khai công cụ — đi đường trả lời thường', async () => {
    safetyMock.assessSafety.mockResolvedValue({
      level: 'concern',
      category: 'self_harm',
      source: 'classifier',
    })
    anthropicMock.callAnthropicText.mockResolvedValue({
      kind: 'success',
      text: 'Mình ở đây với bạn.',
      model: 'm',
      usage: null,
    })
    await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Dạo này mình thấy mệt mỏi quá' },
      toolkit,
    )
    expect(toolsMock.createCompanionToolSession).not.toHaveBeenCalled()
    expect(loopMock.runAnthropicToolLoop).not.toHaveBeenCalled()
    expect(anthropicMock.callAnthropicText).toHaveBeenCalledTimes(1)
  })

  it('Claude hỏng ⇒ Groq trả lời, đề xuất công cụ đã tạo vẫn có trong response', async () => {
    process.env.GROQ_API_KEY = 'gsk-test'
    arrangeAgentLoop({ kind: 'api_error', status: 529, message: 'overloaded' }, { propose: true })
    groqMock.callGroqChatWithKeyPool.mockResolvedValue({
      kind: 'success',
      text: 'Trả lời từ Groq.',
      model: 'groq-model',
      usage: null,
    })
    const res = await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Nhớ giúp mình là mình thích học buổi sáng' },
      toolkit,
    )
    expect(res.reply).toBe('Trả lời từ Groq.')
    expect(res.isFallback).toBe(false)
    expect(res.proposedActions.map((a) => a.id)).toEqual([PROPOSAL_ID])
  })

  it('stream phát `tool` (nhãn tiếng Việt) TRƯỚC chữ của bước sau', async () => {
    arrangeAgentLoop(
      { kind: 'success', text: 'Bạn đã học 3 bài.', model: 'm', steps: 2 },
      { text: 'Bạn đã học 3 bài.' },
    )
    const events: CompanionStreamEvent[] = []
    for await (const event of streamCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Tuần này mình học được gì?' },
      toolkit,
    )) {
      events.push(event)
    }
    const toolIdx = events.findIndex((e) => e.type === 'tool')
    const chunkIdx = events.findIndex((e) => e.type === 'chunk')
    expect(toolIdx).toBeGreaterThan(-1)
    expect(toolIdx).toBeLessThan(chunkIdx)
    const tool = events[toolIdx]
    if (tool?.type === 'tool') expect(tool.data.label).toMatch(/tiến độ/i)
    const done = events.at(-1)
    expect(done?.type).toBe('done')
    if (done?.type === 'done') expect(done.data.reply).toBe('Bạn đã học 3 bài.')
  })

  it('kiểm câu cuối: "mình đã lưu" khi không có gì được lưu ⇒ nối câu đính chính', async () => {
    arrangeAgentLoop({
      kind: 'success',
      text: 'Mình đã lưu điều đó rồi nhé.',
      model: 'm',
      steps: 1,
    })
    const res = await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Mình thích học buổi sáng' },
      toolkit,
    )
    expect(res.reply).toContain(NOTHING_SAVED_NOTE)
    // Bản đã kiểm là bản được lưu vào lịch sử.
    const saved = messageMock.appendCompanionMessage.mock.calls.find(
      (call) => (call[1] as { role: string }).role === 'companion',
    )
    expect((saved?.[1] as { content: string }).content).toContain(NOTHING_SAVED_NOTE)
  })

  it('bộ định tuyến chỉ chạy khi client KHÔNG chỉ định miền/ý định', async () => {
    arrangeAgentLoop({ kind: 'success', text: 'Ok.', model: 'm', steps: 1 })
    await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Xem ghi chú', targetDomain: 'work' },
      toolkit,
    )
    expect(routerMock.routeIntent).not.toHaveBeenCalled()

    const res = await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Tuần này mình học được gì?' },
      toolkit,
    )
    expect(routerMock.routeIntent).toHaveBeenCalledTimes(1)
    expect(res.targetDomain).toBe('learning')
  })

  it('không có key Anthropic ⇒ chế độ tác tử TẮT dù có toolkit (planner cũ chạy)', async () => {
    delete process.env.ANTHROPIC_API_KEY
    proposedActionMock.proposeAction.mockResolvedValue({
      action: { ...pendingProposal, capabilityId: 'learning.update_goal' },
      autoExecuted: false,
    })
    await executeCompanionTurn(
      pool,
      { personId: PERSON_ID, userMessage: 'Tôi muốn đặt mục tiêu học IELTS 7.5' },
      toolkit,
    )
    expect(routerMock.routeIntent).not.toHaveBeenCalled()
    expect(loopMock.runAnthropicToolLoop).not.toHaveBeenCalled()
    expect(proposedActionMock.proposeAction).toHaveBeenCalled()
  })

  it('không truyền `agent` ⇒ hành vi cũ: không router, không vòng công cụ', async () => {
    anthropicMock.callAnthropicText.mockResolvedValue({
      kind: 'success',
      text: 'Chào bạn.',
      model: 'm',
      usage: null,
    })
    proposedActionMock.proposeAction.mockResolvedValue({
      action: { ...pendingProposal, capabilityId: 'learning.update_goal' },
      autoExecuted: false,
    })
    const res = await executeCompanionTurn(pool, {
      personId: PERSON_ID,
      userMessage: 'Tôi muốn đặt mục tiêu học IELTS 7.5',
    })
    expect(routerMock.routeIntent).not.toHaveBeenCalled()
    expect(loopMock.runAnthropicToolLoop).not.toHaveBeenCalled()
    expect(anthropicMock.callAnthropicText).toHaveBeenCalledTimes(1)
    expect(res.reply).toBe('Chào bạn.')
  })
})

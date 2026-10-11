// packages/core-personal/companionStream.test.ts — Unit tests for Companion Runtime SSE Streaming.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { streamCompanionTurn, type CompanionStreamEvent } from './companionRuntime.js'

const PERSON_ID = '11111111-1111-4111-8111-111111111111'
const CTX_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

const contextEngineMock = vi.hoisted(() => ({
  buildContextPackage: vi.fn(),
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

const pool = {} as Pool

beforeEach(() => {
  vi.clearAllMocks()
  contextEngineMock.buildContextPackage.mockResolvedValue({
    id: CTX_ID,
    personId: PERSON_ID,
    requestId: 'req-stream-1',
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
      capabilityId: 'dictionary.lookup',
      action: 'lookup',
      targetDomain: 'learning',
      payload: { word: 'stream' },
      riskLevel: 'low',
      status: 'committed',
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    autoExecuted: true,
  })
})

describe('streamCompanionTurn', () => {
  it('streams meta, chunks, actions, and done in order', async () => {
    const events: CompanionStreamEvent[] = []

    for await (const event of streamCompanionTurn(pool, {
      personId: PERSON_ID,
      userMessage: 'Tra từ "stream" nghĩa là gì',
    })) {
      events.push(event)
    }

    expect(events.length).toBeGreaterThanOrEqual(4)

    // 1. Meta event
    expect(events[0]?.type).toBe('meta')
    if (events[0]?.type === 'meta') {
      expect(events[0].data.intent).toBe('dictionary_lookup')
      expect(events[0].data.targetDomain).toBe('learning')
      expect(events[0].data.contextPackage.id).toBe(CTX_ID)
    }

    // 2. Chunks events
    const chunkEvents = events.filter((e) => e.type === 'chunk')
    expect(chunkEvents.length).toBeGreaterThan(0)
    const combinedText = chunkEvents.map((c) => (c.type === 'chunk' ? c.data.delta : '')).join('')
    expect(combinedText).toContain('Tôi đã tra cứu từ vựng theo yêu cầu của bạn.')

    // 3. Actions event
    const actionsEvent = events.find((e) => e.type === 'actions')
    expect(actionsEvent).toBeDefined()
    if (actionsEvent && actionsEvent.type === 'actions') {
      expect(actionsEvent.data.proposedActions.length).toBe(1)
      expect(actionsEvent.data.executionSummary.executedSteps).toBe(1)
    }

    // 4. Done event
    const doneEvent = events[events.length - 1]
    expect(doneEvent?.type).toBe('done')
    if (doneEvent && doneEvent.type === 'done') {
      expect(doneEvent.data.reply).toBe(combinedText)
      expect(doneEvent.data.intent).toBe('dictionary_lookup')
    }
  })
})

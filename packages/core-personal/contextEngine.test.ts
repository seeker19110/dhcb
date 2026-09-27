import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { buildContextPackage } from './contextEngine.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const GOAL_NODE = '22222222-2222-4222-8222-222222222222'
const FACT_ID = '33333333-3333-4333-8333-333333333333'
const MEMORY_ID = '44444444-4444-4444-8444-444444444444'

const consents = vi.hoisted(() => ({
  isConsentActive: vi.fn(),
}))
vi.mock('./consentService.js', () => ({
  isConsentActive: (...a: unknown[]) => consents.isConsentActive(...a),
}))

const policies = vi.hoisted(() => ({
  resolveAuthority: vi.fn(),
}))
vi.mock('./policyService.js', () => ({
  resolveAuthority: (...a: unknown[]) => policies.resolveAuthority(...a),
}))

const lifeGraph = vi.hoisted(() => ({
  listNodes: vi.fn(),
}))
vi.mock('./lifeGraphService.js', () => ({
  listNodes: (...a: unknown[]) => lifeGraph.listNodes(...a),
}))

const personService = vi.hoisted(() => ({
  listFacts: vi.fn(),
}))
vi.mock('./personService.js', () => ({
  listFacts: (...a: unknown[]) => personService.listFacts(...a),
}))

const memoryService = vi.hoisted(() => ({
  listMemoryRecords: vi.fn(),
}))
vi.mock('./memoryService.js', () => ({
  listMemoryRecords: (...a: unknown[]) => memoryService.listMemoryRecords(...a),
}))

const mockPool = {} as Pool

beforeEach(() => {
  vi.clearAllMocks()
  consents.isConsentActive.mockResolvedValue(true)
  policies.resolveAuthority.mockResolvedValue(null)
  lifeGraph.listNodes.mockResolvedValue([
    {
      value: {
        id: GOAL_NODE,
        type: 'Goal',
        label: 'Achieve IELTS 7.5',
        archivedAt: null,
      },
      version: 1,
    },
  ])
  personService.listFacts.mockResolvedValue([
    {
      id: FACT_ID,
      key: 'learning_style',
      value: 'visual',
      origin: 'user_declared',
      sensitivity: 'personal',
      supersededBy: null,
    },
  ])
  memoryService.listMemoryRecords.mockImplementation(async (_pool, _personId, opts) => {
    if (opts?.namespace === 'semantic') {
      return [
        {
          id: MEMORY_ID,
          namespace: 'semantic',
          content: 'Prefers reading articles about technology',
          provenance: 'user_declared',
          sensitivity: 'personal',
        },
      ]
    }
    return []
  })
})

describe('ContextEngine - buildContextPackage', () => {
  it('không cho provenance tự nhập giả làm lịch sử Companion, và đếm cả nhãn nguồn', async () => {
    memoryService.listMemoryRecords.mockImplementation(async (_pool, _personId, opts) =>
      opts?.namespace === 'episodic'
        ? [
            {
              id: MEMORY_ID,
              namespace: 'episodic',
              content: 'Nội dung tự nhập',
              provenance: 'companion_message:companion:learning',
              sensitivity: 'personal',
            },
          ]
        : [],
    )
    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'spoofed-provenance',
      requestText: 'Xin chào',
      domain: 'learning',
      purpose: 'tutoring',
    })
    const item = pkg.items.find((candidate) => candidate.sourceId === MEMORY_ID)
    expect(item?.provenance).toBe('personal_memory:companion_message:companion:learning')
    expect(item?.tokenEstimate).toBe(Math.ceil('[episodic] Nội dung tự nhập'.length / 3.5))
  })

  it('builds a full ContextPackage with correct selection order', async () => {
    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-1',
      requestText: 'Explain the difference between present perfect and past simple',
      purpose: 'tutoring',
      domain: 'learning',
      domainState: {
        sourceId: '55555555-5555-4555-8555-555555555555',
        content: 'CEFR B1, 5-day streak',
        provenance: 'learning_profile:state',
      },
    })

    expect(pkg.personId).toBe(PERSON)
    expect(pkg.requestId).toBe('req-1')
    expect(pkg.tokenUsed).toBeLessThanOrEqual(pkg.tokenBudget)

    const sourceTypes = pkg.items.map((i) => i.sourceType)
    expect(sourceTypes).toEqual([
      'current_request',
      'active_goal_or_project',
      'authoritative_domain_state',
      'user_declared_fact',
      'validated_derived_memory',
    ])
  })

  it('omits items when consent is revoked / inactive (GATE V2-04)', async () => {
    consents.isConsentActive.mockImplementation(async (_pool, _personId, scope) => {
      // Life graph consent revoked
      if (scope === 'life_graph') return false
      return true
    })

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-2',
      requestText: 'What should I study next?',
      purpose: 'tutoring',
    })

    const hasGoal = pkg.items.some((i) => i.sourceType === 'active_goal_or_project')
    expect(hasGoal).toBe(false)
  })

  it('omits items with sensitivity exceeding maxSensitivity threshold', async () => {
    personService.listFacts.mockResolvedValue([
      {
        id: FACT_ID,
        key: 'medical_notes',
        value: 'sensitive info',
        origin: 'user_declared',
        sensitivity: 'restricted',
        supersededBy: null,
      },
    ])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-3',
      requestText: 'Hello',
      purpose: 'tutoring',
      maxSensitivity: 'personal', // Drops 'restricted' and 'sensitive'
    })

    const hasRestricted = pkg.items.some((i) => i.sensitivity === 'restricted')
    expect(hasRestricted).toBe(false)
  })

  it('omits items denied by Personal Policy', async () => {
    policies.resolveAuthority.mockImplementation(async (_pool, _personId, subject) => {
      if (subject === 'user_declared_fact') return 'DENY'
      return null
    })

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-4',
      requestText: 'Hello',
      purpose: 'tutoring',
    })

    const hasFact = pkg.items.some((i) => i.sourceType === 'user_declared_fact')
    expect(hasFact).toBe(false)
  })

  it('enforces hard token budget constraint without overflowing', async () => {
    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-5',
      requestText: 'A'.repeat(500),
      purpose: 'tutoring',
      tokenBudget: 50, // Small budget
    })

    expect(pkg.tokenUsed).toBeLessThanOrEqual(50)
  })

  it('includes recent episodic context when episodic memories exist', async () => {
    memoryService.listMemoryRecords.mockImplementation(async (_pool, _personId, opts) => {
      if (opts?.namespace === 'episodic') {
        return [
          {
            id: MEMORY_ID,
            namespace: 'episodic',
            content: 'Discussed past simple vs continuous',
            provenance: 'conversation:session-1',
            sensitivity: 'personal',
          },
        ]
      }
      return []
    })

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-6',
      requestText: 'What did we study?',
      purpose: 'tutoring',
    })

    const hasEpisodic = pkg.items.some((i) => i.sourceType === 'recent_episodic_context')
    expect(hasEpisodic).toBe(true)
  })
})

// Nhánh biên: câu hỏi rỗng, bộ nhớ episodic, lọc node/fact không hợp lệ, cắt bớt nội dung khi thiếu budget.
describe('buildContextPackage — nhánh biên', () => {
  it('nạp cả bộ nhớ episodic khi có bản ghi', async () => {
    memoryService.listMemoryRecords.mockImplementation(async (_pool, _personId, opts) => {
      if (opts?.namespace === 'episodic') {
        return [
          {
            id: MEMORY_ID,
            namespace: 'episodic',
            content: 'Buổi học hôm qua nói về thì hiện tại hoàn thành',
            provenance: 'session_log',
            sensitivity: 'personal',
          },
        ]
      }
      return []
    })

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-6',
      requestText: 'Ôn lại bài hôm qua',
      purpose: 'tutoring',
    })

    const episodic = pkg.items.find((i) => i.sourceType === 'recent_episodic_context')
    expect(episodic?.content).toContain('[episodic]')
    expect(episodic?.provenance).toBe('personal_memory:session_log')
  })

  it('câu hỏi rỗng (chỉ khoảng trắng) → không có mục current_request', async () => {
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([])
    memoryService.listMemoryRecords.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-7',
      requestText: '   ',
      purpose: 'tutoring',
    })

    expect(pkg.items).toEqual([])
    expect(pkg.tokenUsed).toBe(0)
  })

  it('bỏ qua node đã lưu trữ và node không phải Goal/Project', async () => {
    lifeGraph.listNodes.mockResolvedValue([
      {
        value: {
          id: GOAL_NODE,
          type: 'Goal',
          label: 'Đã xong',
          archivedAt: '2026-01-01T00:00:00Z',
        },
      },
      { value: { id: GOAL_NODE, type: 'Skill', label: 'SQL', archivedAt: null } },
    ])
    personService.listFacts.mockResolvedValue([])
    memoryService.listMemoryRecords.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-8',
      requestText: 'Xin chào',
      purpose: 'tutoring',
    })

    expect(pkg.items.some((i) => i.sourceType === 'active_goal_or_project')).toBe(false)
  })

  it('bỏ qua fact không do người dùng tự khai (origin khác user_declared)', async () => {
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([
      {
        id: FACT_ID,
        key: 'observed_level',
        value: 'B1',
        origin: 'observed',
        sensitivity: 'personal',
        supersededBy: null,
      },
    ])
    memoryService.listMemoryRecords.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-9',
      requestText: 'Xin chào',
      purpose: 'tutoring',
    })

    expect(pkg.items.some((i) => i.sourceType === 'user_declared_fact')).toBe(false)
  })

  it('có domainState nhưng chưa đồng ý chia sẻ domain đó → bỏ qua trạng thái domain', async () => {
    consents.isConsentActive.mockImplementation(
      async (_pool, _personId, scope) => scope !== 'career',
    )
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([])
    memoryService.listMemoryRecords.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-10',
      requestText: 'Xin chào',
      purpose: 'tutoring',
      domain: 'career',
      domainState: {
        sourceId: '55555555-5555-4555-8555-555555555555',
        content: 'Mục tiêu: Tech Lead',
        provenance: 'career:profile',
      },
    })

    expect(pkg.items.some((i) => i.sourceType === 'authoritative_domain_state')).toBe(false)
  })

  it('không đồng ý chia sẻ bộ nhớ cá nhân → bỏ cả memory suy ra lẫn episodic', async () => {
    consents.isConsentActive.mockImplementation(
      async (_pool, _personId, scope) => scope !== 'personal_memory',
    )
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-11',
      requestText: 'Xin chào',
      purpose: 'tutoring',
    })

    expect(memoryService.listMemoryRecords).not.toHaveBeenCalled()
    expect(pkg.items.every((i) => i.sourceType === 'current_request')).toBe(true)
  })

  it('câu hỏi dài hơn cả budget → cắt bớt nội dung thay vì bỏ hẳn', async () => {
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([])
    memoryService.listMemoryRecords.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-12',
      requestText: 'A'.repeat(5000),
      purpose: 'tutoring',
      tokenBudget: 20,
    })

    expect(pkg.items.length).toBe(1)
    expect(pkg.items[0]?.sourceType).toBe('current_request')
    expect(pkg.items[0]?.content.length).toBeLessThan(5000)
    expect(pkg.tokenUsed).toBeLessThanOrEqual(20)
  })
})

describe('buildContextPackage — lưới an toàn cho mức nhạy cảm lạ', () => {
  it('maxSensitivity không hợp lệ → lùi về mức mặc định "sensitive"', async () => {
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([
      {
        id: FACT_ID,
        key: 'note',
        value: 'thông tin nhạy cảm',
        origin: 'user_declared',
        sensitivity: 'sensitive',
        supersededBy: null,
      },
    ])
    memoryService.listMemoryRecords.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-13',
      requestText: 'Xin chào',
      purpose: 'tutoring',
      maxSensitivity: 'khong-hop-le' as unknown as 'sensitive',
    })

    // Mặc định 'sensitive' nên fact mức sensitive vẫn được giữ.
    expect(pkg.items.some((i) => i.sensitivity === 'sensitive')).toBe(true)
  })

  it('mục có mức nhạy cảm lạ được xếp hạng 1 nên bị loại khi ngưỡng là public', async () => {
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([
      {
        id: FACT_ID,
        key: 'note',
        value: 'giá trị lạ',
        origin: 'user_declared',
        sensitivity: 'muc-la',
        supersededBy: null,
      },
    ])
    memoryService.listMemoryRecords.mockResolvedValue([])

    const pkg = await buildContextPackage(mockPool, {
      personId: PERSON,
      requestId: 'req-14',
      requestText: 'Xin chào',
      purpose: 'tutoring',
      maxSensitivity: 'public',
    })

    expect(pkg.items.some((i) => i.sourceType === 'user_declared_fact')).toBe(false)
  })
})

describe('lịch sử Companion đi qua Context Engine', () => {
  const message = {
    id: '55555555-5555-4555-8555-555555555555',
    role: 'user',
    content: 'Riêng tư cùng miền',
    domain: 'learning',
    intent: null,
    created_at: new Date('2026-09-27T00:00:00Z'),
  }
  const options = {
    personId: PERSON,
    requestId: 'history',
    requestText: 'Xin chào',
    domain: 'learning',
    purpose: 'companion_conversation',
    includeCompanionHistory: true,
  }
  beforeEach(() => {
    lifeGraph.listNodes.mockResolvedValue([])
    personService.listFacts.mockResolvedValue([])
    memoryService.listMemoryRecords.mockResolvedValue([])
  })

  it('cùng miền, đủ consent và budget → ghi provenance, tính token', async () => {
    const query = vi.fn(async () => ({ rows: [message] }))
    const pkg = await buildContextPackage({ query } as unknown as Pool, options)
    const history = pkg.items.find((item) => item.provenance.startsWith('companion_message:'))
    expect(history?.content).toBe(message.content)
    expect(history?.sensitivity).toBe('sensitive')
    expect(pkg.tokenUsed).toBe(pkg.items.reduce((sum, item) => sum + item.tokenEstimate, 0))
    expect(query).toHaveBeenCalledWith(expect.stringContaining('and domain = $3'), [
      PERSON,
      10,
      'learning',
      ['public', 'personal', 'sensitive'],
    ])
  })

  it.each(['personal_memory', 'learning'])(
    'consent %s bị thu hồi → không truy vấn lịch sử',
    async (scope) => {
      consents.isConsentActive.mockImplementation(
        async (_pool, _person, queriedScope) => queriedScope !== scope,
      )
      const query = vi.fn(async () => ({ rows: [message] }))
      const pkg = await buildContextPackage({ query } as unknown as Pool, options)
      expect(query).not.toHaveBeenCalled()
      expect(pkg.items.some((item) => item.provenance.startsWith('companion_message:'))).toBe(false)
    },
  )

  it('lọc chéo miền, null domain và policy DENY', async () => {
    const query = vi.fn(async () => ({
      rows: [message, { ...message, domain: 'life' }, { ...message, domain: null }],
    }))
    policies.resolveAuthority.mockImplementation(async (_pool, _person, type) =>
      type === 'recent_episodic_context' ? 'DENY' : null,
    )
    const pkg = await buildContextPackage({ query } as unknown as Pool, options)
    expect(pkg.items).toHaveLength(1)
  })

  it('giới hạn nhạy cảm chặn transcript chưa phân loại chi tiết', async () => {
    const query = vi.fn(async () => ({ rows: [message] }))
    const pkg = await buildContextPackage({ query } as unknown as Pool, {
      ...options,
      maxSensitivity: 'personal',
    })
    expect(pkg.items).toHaveLength(1)
  })

  it('ngân sách nhỏ không cho lịch sử vượt giới hạn', async () => {
    const query = vi.fn(async () => ({ rows: [message] }))
    const pkg = await buildContextPackage({ query } as unknown as Pool, {
      ...options,
      tokenBudget: 3,
    })
    expect(pkg.items.some((item) => item.provenance.startsWith('companion_message:'))).toBe(false)
    expect(pkg.tokenUsed).toBeLessThanOrEqual(3)
  })

  it('DB lịch sử lỗi → bỏ lịch sử, không fallback bỏ scope', async () => {
    const query = vi.fn(async () => {
      throw new Error('DB unavailable')
    })
    const pkg = await buildContextPackage({ query } as unknown as Pool, options)
    expect(pkg.items).toHaveLength(1)
    expect(query).toHaveBeenCalledTimes(1)
  })
})

it('history cùng người nhưng khác miền/thiếu miền không bao giờ vào context', async () => {
  lifeGraph.listNodes.mockResolvedValue([])
  personService.listFacts.mockResolvedValue([])
  memoryService.listMemoryRecords.mockResolvedValue([])
  const row = {
    id: '55555555-5555-4555-8555-555555555555',
    role: 'user',
    content: 'Secret life',
    intent: null,
    created_at: new Date(),
    domain: 'life',
  }
  const query = vi.fn(async () => ({ rows: [row, { ...row, domain: null }] }))
  const pkg = await buildContextPackage({ query } as unknown as Pool, {
    personId: PERSON,
    requestId: 'cross-domain',
    requestText: 'hello',
    domain: 'learning',
    purpose: 'companion_conversation',
    includeCompanionHistory: true,
  })
  expect(pkg.items.map((item) => item.content)).toEqual(['hello'])
})

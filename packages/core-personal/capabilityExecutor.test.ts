// Test cho capabilityExecutor — bất biến quan trọng nhất: KHÔNG bao giờ báo "đã thực hiện" khi
// chưa thực sự ghi được gì (đúng lỗi mà file này sinh ra để vá).
import { describe, expect, it, vi } from 'vitest'
import type { PoolClient } from 'pg'
import { ValidationError } from '@dhcb/core-errors/appError'
import {
  executeCapability,
  requiresUserConfirmation,
  CONFIRMATION_REQUIRED_CAPABILITIES,
} from './capabilityExecutor.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const NOW = new Date('2026-08-25T00:00:00Z')

function factRow(over: Record<string, unknown> = {}) {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    person_id: PERSON,
    namespace: 'companion',
    key: 'self_description',
    value: 'Tôi là Kẻ Tìm Kiếm',
    origin: 'observed',
    confidence: 0.85,
    source: { type: 'companion_conversation' },
    sensitivity: 'personal',
    created_at: NOW,
    updated_at: NOW,
    last_confirmed_at: null,
    expires_at: null,
    supersedes: null,
    is_current: true,
    ...over,
  }
}

function memoryRow(over: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    person_id: PERSON,
    namespace: 'semantic',
    content: 'Người dùng thích khám phá công nghệ',
    provenance: 'companion:conversation',
    sensitivity: 'personal',
    status: 'accepted',
    version: 1,
    created_at: NOW,
    updated_at: NOW,
    retain_until: null,
    // Cột GĐ2a (migration 0094) — `rowToMemoryRecord` parse theo hợp đồng v2.
    importance: 5,
    last_accessed_at: null,
    access_count: 0,
    valid_from: NOW,
    valid_to: null,
    superseded_by: null,
    source_message_id: null,
    has_embedding: false,
    ...over,
  }
}

/** Client giả: trả dòng theo bảng được nhắc tới trong câu SQL. */
function mockClient(overrides: Array<[string, unknown[]]> = []): PoolClient {
  const query = vi.fn(async (sql: string) => {
    for (const [needle, rows] of overrides) {
      if (sql.includes(needle)) return { rows }
    }
    if (sql.includes('insert into personal.personal_facts')) return { rows: [factRow()] }
    if (sql.includes('insert into personal.memory_records\n')) return { rows: [memoryRow()] }
    return { rows: [] }
  })
  return { query } as unknown as PoolClient
}

describe('requiresUserConfirmation', () => {
  it('mọi capability GHI vào hồ sơ/ký ức đều phải xác nhận', () => {
    expect(requiresUserConfirmation('profile.update_fact')).toBe(true)
    expect(requiresUserConfirmation('memory.create_record')).toBe(true)
    expect(CONFIRMATION_REQUIRED_CAPABILITIES.size).toBe(2)
  })

  it('capability chỉ đọc thì không cần xác nhận', () => {
    expect(requiresUserConfirmation('dictionary.lookup')).toBe(false)
  })
})

describe('executeCapability — profile.update_fact', () => {
  it('ghi THẬT một fact và trả về id bản ghi làm bằng chứng', async () => {
    const client = mockClient()
    const res = await executeCapability(
      client,
      PERSON,
      'profile.update_fact',
      { rawText: 'Tôi là Kẻ Tìm Kiếm' },
      'user:123',
    )

    expect(res.status).toBe('ok')
    expect(res.detail.factId).toBe('33333333-3333-4333-8333-333333333333')

    const sqlCalls = vi.mocked(client.query).mock.calls.map((c) => String(c[0]))
    expect(sqlCalls.some((sql) => sql.includes('insert into personal.personal_facts'))).toBe(true)
  })

  it('ghi nhãn origin "observed", KHÔNG phải "user_declared"', async () => {
    // AI suy ra hộ thì không được đội lốt lời người dùng tự khai — nhãn đó quyết định fact nào
    // được phép ghi đè fact nào (xem gate trong declareFact).
    const client = mockClient()
    await executeCapability(
      client,
      PERSON,
      'profile.update_fact',
      { rawText: 'Tôi thích đọc' },
      'u',
    )

    const insertCall = vi
      .mocked(client.query)
      .mock.calls.find((c) => String(c[0]).includes('insert into personal.personal_facts'))
    expect(insertCall?.[1]).toContain('observed')
    expect(insertCall?.[1]).not.toContain('user_declared')
  })

  it('thiếu nội dung → NÉM LỖI, không báo thành công suông', async () => {
    const client = mockClient()
    await expect(
      executeCapability(client, PERSON, 'profile.update_fact', {}, 'user:123'),
    ).rejects.toThrow(ValidationError)
  })

  it('nội dung chỉ có khoảng trắng cũng bị coi là thiếu', async () => {
    const client = mockClient()
    await expect(
      executeCapability(client, PERSON, 'profile.update_fact', { rawText: '   ' }, 'user:123'),
    ).rejects.toThrow(ValidationError)
  })
})

describe('executeCapability — memory.create_record', () => {
  it('ghi THẬT một memory record', async () => {
    const client = mockClient()
    const res = await executeCapability(
      client,
      PERSON,
      'memory.create_record',
      { content: 'Người dùng thích khám phá công nghệ' },
      'user:123',
    )

    expect(res.status).toBe('ok')
    expect(res.detail.recordId).toBe('44444444-4444-4444-8444-444444444444')
    expect(res.detail.outcome).toBe('ACCEPT')
  })

  it('thiếu content → ném lỗi', async () => {
    const client = mockClient()
    await expect(
      executeCapability(client, PERSON, 'memory.create_record', {}, 'user:123'),
    ).rejects.toThrow(ValidationError)
  })
})

describe('executeCapability — nhánh còn lại', () => {
  it('learning.update_goal ghi mục tiêu thành fact learning.goal', async () => {
    const client = mockClient()
    const res = await executeCapability(
      client,
      PERSON,
      'learning.update_goal',
      { rawMessage: 'Tôi muốn đạt IELTS 7.0' },
      'user:123',
    )

    expect(res.status).toBe('ok')
    expect(res.detail.storedAs).toBe('personal_fact:learning.goal')
  })

  it('dictionary.lookup báo rõ "không có tác dụng phụ" thay vì giả vờ đã ghi', async () => {
    const client = mockClient()
    const res = await executeCapability(
      client,
      PERSON,
      'dictionary.lookup',
      { word: 'fluent' },
      'u',
    )

    expect(res.status).toBe('no_side_effect')
    expect(vi.mocked(client.query)).not.toHaveBeenCalled()
  })

  it('capability lạ → NÉM LỖI, tuyệt đối không âm thầm báo thành công', async () => {
    const client = mockClient()
    await expect(
      executeCapability(client, PERSON, 'khong.ton.tai', { a: 1 }, 'user:123'),
    ).rejects.toThrow(/chưa có đường thi hành thật/)
  })
})

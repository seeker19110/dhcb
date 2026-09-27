import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import {
  appendCompanionMessage,
  listRecentCompanionMessages,
  toProviderMessages,
  COMPANION_HISTORY_TURNS,
  type CompanionMessage,
} from './companionMessageService.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const NOW = new Date('2026-08-25T10:00:00Z')

function row(over: Record<string, unknown> = {}) {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    role: 'user',
    content: 'Xin chào',
    domain: 'learning',
    intent: 'general_conversation',
    created_at: NOW,
    ...over,
  }
}

function mockPool(rows: unknown[]): Pool {
  return { query: vi.fn(async () => ({ rows })) } as unknown as Pool
}

describe('appendCompanionMessage', () => {
  it('ghi tin nhắn và trả về bản ghi đã chuẩn hoá', async () => {
    const pool = mockPool([row()])
    const msg = await appendCompanionMessage(pool, {
      personId: PERSON,
      role: 'user',
      content: 'Xin chào',
      domain: 'learning',
    })

    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Xin chào')
    expect(msg.createdAt).toBe(NOW.toISOString())
  })

  it('CẮT nội dung quá dài thay vì ném lỗi — không làm hỏng lượt trả lời đang chờ', async () => {
    const pool = mockPool([row({ content: 'x'.repeat(8000) })])
    await appendCompanionMessage(pool, {
      personId: PERSON,
      role: 'companion',
      content: 'x'.repeat(9000),
    })

    const params = vi.mocked(pool.query).mock.calls[0]![1] as unknown[]
    expect((params[2] as string).length).toBe(8000)
  })

  it('nội dung rỗng → ném lỗi (không ghi dòng rác vào lịch sử)', async () => {
    const pool = mockPool([])
    await expect(
      appendCompanionMessage(pool, { personId: PERSON, role: 'user', content: '   ' }),
    ).rejects.toThrow()
    expect(pool.query).not.toHaveBeenCalled()
  })
})

describe('listRecentCompanionMessages', () => {
  it('trả về thứ tự CŨ → MỚI (DB trả mới nhất trước, hàm phải đảo lại)', async () => {
    const pool = mockPool([
      row({ id: 'moi', content: 'Tin mới' }),
      row({ id: 'cu', content: 'Tin cũ' }),
    ])
    const msgs = await listRecentCompanionMessages(pool, PERSON)

    expect(msgs.map((m) => m.content)).toEqual(['Tin cũ', 'Tin mới'])
  })

  it('chặn limit trong khoảng an toàn 1..200', async () => {
    const pool = mockPool([])
    await listRecentCompanionMessages(pool, PERSON, 9999)
    expect(vi.mocked(pool.query).mock.calls[0]![1]).toEqual([PERSON, 200])

    await listRecentCompanionMessages(pool, PERSON, -5)
    expect(vi.mocked(pool.query).mock.calls[1]![1]).toEqual([PERSON, 1])
  })

  it('role lạ trong DB không lọt ra ngoài dưới dạng giá trị giả', async () => {
    const pool = mockPool([row({ role: 'hacker' })])
    const msgs = await listRecentCompanionMessages(pool, PERSON)
    expect(msgs[0]?.role).toBe('companion')
  })
})

describe('toProviderMessages', () => {
  const history: CompanionMessage[] = [
    { id: '1', role: 'user', content: 'Tôi là Kẻ Tìm Kiếm', createdAt: NOW.toISOString() },
    { id: '2', role: 'companion', content: 'Mình đã ghi nhận', createdAt: NOW.toISOString() },
  ]

  it('ánh xạ companion → assistant cho đúng định dạng nhà cung cấp LLM', () => {
    expect(toProviderMessages(history)).toEqual([
      { role: 'user', content: 'Tôi là Kẻ Tìm Kiếm' },
      { role: 'assistant', content: 'Mình đã ghi nhận' },
    ])
  })

  it('cắt mỗi tin về tối đa 1500 ký tự để không ăn hết ngân sách token', () => {
    const long: CompanionMessage[] = [
      { id: '1', role: 'companion', content: 'y'.repeat(5000), createdAt: NOW.toISOString() },
    ]
    expect(toProviderMessages(long)[0]!.content.length).toBe(1500)
  })

  it('giữ nguyên thứ tự — mạch hội thoại phụ thuộc vào thứ tự này', () => {
    expect(toProviderMessages(history).map((m) => m.role)).toEqual(['user', 'assistant'])
  })
})

describe('hằng số ngân sách', () => {
  it('số lượt nạp vào prompt phải nhỏ và có giới hạn cứng', () => {
    expect(COMPANION_HISTORY_TURNS).toBeGreaterThan(0)
    expect(COMPANION_HISTORY_TURNS).toBeLessThanOrEqual(20)
  })
})

it('scope miền provider không lấy transcript miền khác hoặc thiếu miền', async () => {
  const pool = mockPool([])
  await listRecentCompanionMessages(pool, PERSON, 10, 'learning')
  expect(vi.mocked(pool.query).mock.calls[0]![0]).toContain('and domain = $3')
  expect(vi.mocked(pool.query).mock.calls[0]![1]).toEqual([PERSON, 10, 'learning'])
})

it('lọc nhạy cảm tại SQL trước limit để lịch sử thường không bị bản T2 che mất', async () => {
  const pool = mockPool([])
  await listRecentCompanionMessages(pool, PERSON, 50, undefined, 'personal')
  expect(vi.mocked(pool.query).mock.calls[0]![0]).toContain('sensitivity = any($3::text[])')
  expect(vi.mocked(pool.query).mock.calls[0]![1]).toEqual([PERSON, 50, ['public', 'personal']])
})

it('transcript cũ thiếu classification mặc định sensitive', async () => {
  const pool = mockPool([row()])
  expect((await listRecentCompanionMessages(pool, PERSON))[0]?.sensitivity).toBe('sensitive')
})

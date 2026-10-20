// Test logic kết bạn qua mã — tập trung vào: sinh mã idempotent/retry khi trùng, không tự kết
// bạn với chính mình, mã không tồn tại bị từ chối, kết bạn idempotent (gọi lại không lỗi/không
// tạo dòng trùng), và huỷ kết bạn/tra cứu quan hệ đối xứng bất kể ai gọi.

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))

import {
  ensureFriendCode,
  findUserByFriendCode,
  addFriendByCode,
  listFriends,
  removeFriend,
  areFriends,
} from './friends.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ rows: [], rowCount: 0 })
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
})

describe('ensureFriendCode', () => {
  it('user đã có mã → trả về luôn, không sinh mới', async () => {
    query.mockResolvedValueOnce({ rows: [{ friend_code: 'ABCDEFGH' }] })
    expect(await ensureFriendCode('u1')).toBe('ABCDEFGH')
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('chưa có mã → sinh mới và ghi thành công', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ friend_code: null }] })
      .mockResolvedValueOnce({ rows: [{ friend_code: 'XYZ12345' }] })
    expect(await ensureFriendCode('u1')).toBe('XYZ12345')
  })

  it('mã đầu trùng (unique_violation) → thử mã khác rồi thành công', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ friend_code: null }] })
      .mockRejectedValueOnce(Object.assign(new Error('trùng'), { code: '23505' }))
      .mockResolvedValueOnce({ rows: [{ friend_code: 'RETRY123' }] })
    expect(await ensureFriendCode('u1')).toBe('RETRY123')
  })

  it('trùng mã liên tục vượt quá số lần thử tối đa → ném lỗi', async () => {
    query.mockResolvedValueOnce({ rows: [{ friend_code: null }] })
    query.mockRejectedValue(Object.assign(new Error('trùng'), { code: '23505' }))
    await expect(ensureFriendCode('u1')).rejects.toThrow(
      'Không sinh được mã kết bạn sau nhiều lần thử',
    )
  })
})

describe('findUserByFriendCode', () => {
  it('mã không tồn tại → null', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await findUserByFriendCode('ZZZZ9999')).toBeNull()
  })

  it('mã tồn tại → trả id + name, chuẩn hoá mã về chữ HOA', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u2', name: 'Bình' }] })
    expect(await findUserByFriendCode(' abcd1234 ')).toEqual({ id: 'u2', name: 'Bình' })
    expect(query.mock.calls[0]?.[1]).toEqual(['ABCD1234'])
  })

  it('name null trong DB → fallback "Người dùng"', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u2', name: null }] })
    expect(await findUserByFriendCode('ABCD1234')).toEqual({ id: 'u2', name: 'Người dùng' })
  })
})

describe('addFriendByCode', () => {
  it('mã không tồn tại → từ chối', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await addFriendByCode('u1', 'NOPE0000')).toEqual({
      ok: false,
      reason: 'code_not_found',
    })
  })

  it('tự kết bạn với chính mình → từ chối', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'Tôi' }] })
    expect(await addFriendByCode('u1', 'SELF0000')).toEqual({ ok: false, reason: 'self_add' })
  })

  it('kết bạn hợp lệ → tạo dòng mới, alreadyFriends=false', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u2', name: 'Bình' }] })
      .mockResolvedValueOnce({ rowCount: 1 })
    const result = await addFriendByCode('u1', 'CODE0001')
    expect(result).toEqual({
      ok: true,
      alreadyFriends: false,
      friend: { id: 'u2', name: 'Bình' },
    })
  })

  it('đã là bạn từ trước (gọi lại) → idempotent, alreadyFriends=true', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u2', name: 'Bình' }] })
      .mockResolvedValueOnce({ rowCount: 0 })
    const result = await addFriendByCode('u1', 'CODE0001')
    expect(result).toEqual({
      ok: true,
      alreadyFriends: true,
      friend: { id: 'u2', name: 'Bình' },
    })
  })

  it('sắp cặp (user_id_a, user_id_b) theo thứ tự chuỗi ổn định bất kể ai gọi trước', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'zzz', name: 'Z' }] })
      .mockResolvedValueOnce({ rowCount: 1 })
    await addFriendByCode('aaa', 'CODE0001')
    expect(query.mock.calls[1]?.[1]).toEqual(['aaa', 'zzz'])
  })
})

describe('listFriends', () => {
  it('trả danh sách bạn bè, fallback tên "Người dùng" khi null', async () => {
    query.mockResolvedValueOnce({
      rows: [
        { id: 'u2', name: 'Bình' },
        { id: 'u3', name: null },
      ],
    })
    expect(await listFriends('u1')).toEqual([
      { id: 'u2', name: 'Bình' },
      { id: 'u3', name: 'Người dùng' },
    ])
  })
})

describe('removeFriend', () => {
  it('gỡ theo cặp đã sắp thứ tự, bất kể ai gọi', async () => {
    await removeFriend('zzz', 'aaa')
    expect(query.mock.calls[0]?.[1]).toEqual(['aaa', 'zzz'])
  })
})

describe('areFriends', () => {
  it('có dòng khớp → true', async () => {
    query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
    expect(await areFriends('u1', 'u2')).toBe(true)
  })

  it('không có dòng → false', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await areFriends('u1', 'u2')).toBe(false)
  })
})

// Audit 2026-10-20, F-001: mã kết bạn là chìa khoá công khai → phải sinh bằng node:crypto,
// KHÔNG qua Math.random (xorshift128+ của V8 suy được trạng thái). Test này ĐỎ trước khi sửa.
describe('randomCode — nguồn ngẫu nhiên an toàn', () => {
  it('sinh mã 8 ký tự trong bảng chữ không nhầm lẫn và KHÔNG gọi Math.random', async () => {
    const spy = vi.spyOn(Math, 'random')
    query
      .mockResolvedValueOnce({ rows: [{ friend_code: null }] })
      .mockImplementationOnce(async (_sql: string, params: unknown[]) => ({
        rows: [{ friend_code: params[1] }],
      }))
    const code = await ensureFriendCode('u1')
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('hai lần sinh liên tiếp cho hai mã khác nhau (không gian 31^8, trùng ≈ 0)', async () => {
    const seen: unknown[] = []
    query.mockImplementation(async (sql: string, params: unknown[]) => {
      if (String(sql).startsWith('select friend_code')) return { rows: [{ friend_code: null }] }
      seen.push(params[1])
      return { rows: [{ friend_code: params[1] }] }
    })
    await ensureFriendCode('u1')
    await ensureFriendCode('u2')
    expect(new Set(seen).size).toBe(2)
  })
})

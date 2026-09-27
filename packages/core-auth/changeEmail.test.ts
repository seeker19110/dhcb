// Test đổi email — trọng tâm BẢO MẬT, vì đổi email là đường chiếm tài khoản kinh điển
// (đổi email → "quên mật khẩu" → chiếm luôn):
//  1. Tài khoản CÓ mật khẩu mà không nhập mật khẩu → từ chối.
//  2. Nhập sai mật khẩu → từ chối.
//  3. Tài khoản Google-only (không có mật khẩu) → cho đổi, vì danh tính neo vào google_id.
//  4. Email trùng người khác → từ chối (unique_violation).
//  5. Đổi thành công → ĐẶT LẠI email_verified và XOÁ mã cũ.

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const passwordState: { valid: boolean } = { valid: true }
vi.mock('./authService.js', () => ({
  verifyPassword: async () => passwordState.valid,
}))
vi.mock('./emailVerification.js', () => ({
  sendVerificationCode: async () => ({ ok: true, mail: 'sent' }),
}))

import { changeEmail } from './changeEmail.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()
const client = {
  query: vi.fn((sql: string, params?: unknown[]) => {
    if (sql === 'begin' || sql === 'commit' || sql === 'rollback') {
      return Promise.resolve({ rows: [], rowCount: 0 })
    }
    return query(sql, params)
  }),
  release: vi.fn(),
}

beforeEach(() => {
  query.mockReset()
  client.query.mockClear()
  client.release.mockClear()
  query.mockResolvedValue({ rows: [] })
  mockedGetPool.mockReturnValue({ query, connect: async () => client } as unknown as ReturnType<
    typeof getPgPool
  >)
  passwordState.valid = true
})

const withPassword = { email: 'cu@b.com', password_hash: 'hash' }
const googleOnly = { email: 'cu@b.com', password_hash: null }

describe('changeEmail', () => {
  it('user không tồn tại → từ chối', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await changeEmail('u1', 'moi@b.com', 'pw')).toEqual({
      ok: false,
      reason: 'user_not_found',
    })
  })

  it('email mới trùng email hiện tại → từ chối', async () => {
    query.mockResolvedValueOnce({ rows: [withPassword] })
    expect(await changeEmail('u1', 'CU@b.com', 'pw')).toEqual({ ok: false, reason: 'same_email' })
  })

  it('có mật khẩu nhưng KHÔNG nhập → bắt buộc nhập (session token là không đủ)', async () => {
    query.mockResolvedValueOnce({ rows: [withPassword] })
    expect(await changeEmail('u1', 'moi@b.com', null)).toEqual({
      ok: false,
      reason: 'password_required',
    })
  })

  it('nhập SAI mật khẩu → từ chối', async () => {
    passwordState.valid = false
    query.mockResolvedValueOnce({ rows: [withPassword] })
    expect(await changeEmail('u1', 'moi@b.com', 'sai')).toEqual({
      ok: false,
      reason: 'wrong_password',
    })
  })

  it('tài khoản Google-only → cho đổi dù không có mật khẩu', async () => {
    query.mockResolvedValueOnce({ rows: [googleOnly] })
    const r = await changeEmail('u1', 'moi@b.com', null)
    expect(r).toEqual({ ok: true, mail: 'sent' })
  })

  it('email đã có người khác dùng → báo email_taken', async () => {
    query
      .mockResolvedValueOnce({ rows: [withPassword] })
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' }))
    expect(await changeEmail('u1', 'trung@b.com', 'pw')).toEqual({
      ok: false,
      reason: 'email_taken',
    })
  })

  it('đổi thành công → ĐẶT LẠI email_verified và XOÁ mã cũ', async () => {
    query.mockResolvedValueOnce({ rows: [withPassword] })
    const r = await changeEmail('u1', 'MOI@b.com', 'pw')
    expect(r).toEqual({ ok: true, mail: 'sent' })

    const updateCall = query.mock.calls.find((c) => String(c[0]).includes('update public.users'))
    expect(String(updateCall?.[0])).toContain('email_verified = null')
    // Email được chuẩn hoá về chữ thường.
    expect((updateCall?.[1] as unknown[])[0]).toBe('moi@b.com')

    expect(
      query.mock.calls.some((c) => String(c[0]).includes('delete from public.email_verifications')),
    ).toBe(true)
  })
})

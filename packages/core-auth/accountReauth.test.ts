// packages/core-auth/accountReauth.test.ts — xác minh lại danh tính trước xoá/xuất (changelog 0533).

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./authService.js', () => ({
  verifyPassword: vi.fn(),
  inspectGoogleAccessToken: vi.fn(),
}))

import { inspectGoogleAccessToken, verifyPassword } from './authService.js'
import {
  GOOGLE_REAUTH_MAX_AGE_SEC,
  GOOGLE_TOKEN_LIFETIME_SEC,
  getReauthMethods,
  verifyAccountReauth,
} from './accountReauth.js'

const USER = '00000000-0000-4000-8000-000000000001'

function poolWith(row: { password_hash: string | null; google_sub: string | null } | null) {
  const query = vi.fn(async () => ({ rows: row ? [row] : [] }))
  return { pool: { query } as never, query }
}

function google(sub: string, expiresInSec: number | null) {
  vi.mocked(inspectGoogleAccessToken).mockResolvedValueOnce({
    googleId: sub,
    email: 'a@b.c',
    name: 'A',
    expiresInSec,
  })
}

beforeEach(() => {
  vi.mocked(verifyPassword).mockReset()
  vi.mocked(inspectGoogleAccessToken).mockReset()
})

describe('getReauthMethods', () => {
  it('liệt kê đúng cách khả dụng', async () => {
    expect(
      await getReauthMethods(poolWith({ password_hash: 'h', google_sub: 'g' }).pool, USER),
    ).toEqual(['password', 'google'])
    expect(
      await getReauthMethods(poolWith({ password_hash: null, google_sub: 'g' }).pool, USER),
    ).toEqual(['google'])
    expect(
      await getReauthMethods(poolWith({ password_hash: null, google_sub: null }).pool, USER),
    ).toEqual([])
    expect(await getReauthMethods(poolWith(null).pool, USER)).toEqual([])
  })

  it('truy vấn theo userId của phiên (tham số $1), không nối chuỗi', async () => {
    const { pool, query } = poolWith(null)
    await getReauthMethods(pool, USER)
    expect(query).toHaveBeenCalledWith(expect.stringContaining('where u.id = $1'), [USER])
  })
})

describe('verifyAccountReauth — mật khẩu', () => {
  it('đúng mật khẩu ⇒ ok', async () => {
    vi.mocked(verifyPassword).mockResolvedValueOnce(true)
    const r = await verifyAccountReauth(
      poolWith({ password_hash: 'h', google_sub: null }).pool,
      USER,
      {
        method: 'password',
        password: 'mat-khau',
      },
    )
    expect(r).toEqual({ ok: true, method: 'password' })
    expect(verifyPassword).toHaveBeenCalledWith('mat-khau', 'h')
  })

  it('sai mật khẩu ⇒ failed', async () => {
    vi.mocked(verifyPassword).mockResolvedValueOnce(false)
    const r = await verifyAccountReauth(
      poolWith({ password_hash: 'h', google_sub: null }).pool,
      USER,
      {
        method: 'password',
        password: 'sai',
      },
    )
    expect(r).toEqual({ ok: false, reason: 'failed' })
  })

  it('tài khoản chỉ Google mà gửi mật khẩu ⇒ unavailable, không gọi bcrypt', async () => {
    const r = await verifyAccountReauth(
      poolWith({ password_hash: null, google_sub: 'g' }).pool,
      USER,
      {
        method: 'password',
        password: 'x',
      },
    )
    expect(r).toEqual({ ok: false, reason: 'unavailable' })
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it('không tìm thấy user ⇒ failed', async () => {
    const r = await verifyAccountReauth(poolWith(null).pool, USER, {
      method: 'password',
      password: 'x',
    })
    expect(r).toEqual({ ok: false, reason: 'failed' })
  })

  it('lỗi CSDL được NÉM lên (không biến thành "sai mật khẩu")', async () => {
    const pool = { query: vi.fn().mockRejectedValue(new Error('db down')) } as never
    await expect(
      verifyAccountReauth(pool, USER, { method: 'password', password: 'x' }),
    ).rejects.toThrow('db down')
  })
})

describe('verifyAccountReauth — Google', () => {
  const fresh = GOOGLE_TOKEN_LIFETIME_SEC - 30
  const edge = GOOGLE_TOKEN_LIFETIME_SEC - GOOGLE_REAUTH_MAX_AGE_SEC

  it('token tươi của đúng identity ⇒ ok', async () => {
    google('g-owner', fresh)
    const r = await verifyAccountReauth(
      poolWith({ password_hash: null, google_sub: 'g-owner' }).pool,
      USER,
      {
        method: 'google',
        accessToken: 'token-token-token',
      },
    )
    expect(r).toEqual({ ok: true, method: 'google' })
  })

  it('đúng mốc 10 phút vẫn nhận; quá mốc 1 giây ⇒ stale', async () => {
    const pool = poolWith({ password_hash: null, google_sub: 'g' }).pool
    google('g', edge)
    expect(
      await verifyAccountReauth(pool, USER, { method: 'google', accessToken: 'token-token-token' }),
    ).toEqual({
      ok: true,
      method: 'google',
    })
    google('g', edge - 1)
    expect(
      await verifyAccountReauth(pool, USER, { method: 'google', accessToken: 'token-token-token' }),
    ).toEqual({
      ok: false,
      reason: 'stale',
    })
  })

  it('Google không trả expires_in ⇒ stale (không coi là tươi)', async () => {
    google('g', null)
    const r = await verifyAccountReauth(
      poolWith({ password_hash: null, google_sub: 'g' }).pool,
      USER,
      {
        method: 'google',
        accessToken: 'token-token-token',
      },
    )
    expect(r).toEqual({ ok: false, reason: 'stale' })
  })

  it('token Google của NGƯỜI KHÁC ⇒ failed', async () => {
    google('g-attacker', fresh)
    const r = await verifyAccountReauth(
      poolWith({ password_hash: 'h', google_sub: 'g-owner' }).pool,
      USER,
      {
        method: 'google',
        accessToken: 'token-token-token',
      },
    )
    expect(r).toEqual({ ok: false, reason: 'failed' })
  })

  it('token không hợp lệ (Google từ chối) ⇒ failed', async () => {
    vi.mocked(inspectGoogleAccessToken).mockResolvedValueOnce(null)
    const r = await verifyAccountReauth(
      poolWith({ password_hash: null, google_sub: 'g' }).pool,
      USER,
      {
        method: 'google',
        accessToken: 'token-token-token',
      },
    )
    expect(r).toEqual({ ok: false, reason: 'failed' })
  })

  it('tài khoản không liên kết Google ⇒ unavailable, không gọi Google', async () => {
    const r = await verifyAccountReauth(
      poolWith({ password_hash: 'h', google_sub: null }).pool,
      USER,
      {
        method: 'google',
        accessToken: 'token-token-token',
      },
    )
    expect(r).toEqual({ ok: false, reason: 'unavailable' })
    expect(inspectGoogleAccessToken).not.toHaveBeenCalled()
  })
})

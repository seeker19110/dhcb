// packages/core-contracts/account.test.ts — hợp đồng xoá tài khoản/xuất dữ liệu (changelog 0533).

import { describe, it, expect } from 'vitest'
import {
  AccountBodySchema,
  DELETE_CONFIRMATION_PHRASES,
  isDeleteConfirmationValid,
  normalizeConfirmation,
} from './account.js'

describe('câu xác nhận xoá', () => {
  it('chấp nhận đúng câu hiển thị ở cả hai ngôn ngữ', () => {
    expect(isDeleteConfirmationValid(DELETE_CONFIRMATION_PHRASES.vi)).toBe(true)
    expect(isDeleteConfirmationValid(DELETE_CONFIRMATION_PHRASES.en)).toBe(true)
  })

  it('không bắt gõ đúng kiểu dấu: XÓA/XOÁ, NFD, chữ thường, thừa khoảng trắng, không dấu', () => {
    for (const typed of [
      'XÓA TÀI KHOẢN',
      'xoá tài khoản',
      '  xoá   tài  khoản ',
      'XOA TAI KHOAN',
      'XOÁ TÀI KHOẢN'.normalize('NFD'),
      'delete my account',
    ])
      expect(isDeleteConfirmationValid(typed), typed).toBe(true)
  })

  it('từ chối câu khác/thiếu chữ/rỗng', () => {
    for (const typed of ['', 'XOÁ', 'XOÁ TÀI KHOẢN NÀY', 'DELETE', 'xoá tai khoan cua toi', 'yes'])
      expect(isDeleteConfirmationValid(typed), typed).toBe(false)
  })

  it('chuẩn hoá đ/Đ thành D', () => {
    expect(normalizeConfirmation('đồng Đội')).toBe('DONG DOI')
  })
})

describe('AccountBodySchema', () => {
  it('nhận body xoá hợp lệ (mật khẩu) và xuất hợp lệ (Google)', () => {
    expect(
      AccountBodySchema.safeParse({
        action: 'delete',
        reauth: { method: 'password', password: 'p' },
        confirmation: 'XOÁ TÀI KHOẢN',
        acknowledgeNoRefund: true,
      }).success,
    ).toBe(true)
    expect(
      AccountBodySchema.safeParse({
        action: 'export',
        reauth: { method: 'google', accessToken: 'token-token-token' },
        twoFactorCode: '123456',
      }).success,
    ).toBe(true)
  })

  it('từ chối: thiếu xác minh lại, phương thức lạ, xoá thiếu câu xác nhận, action lạ', () => {
    for (const body of [
      { action: 'export' },
      { action: 'export', reauth: { method: 'facebook', accessToken: 'abcdefghijk' } },
      { action: 'delete', reauth: { method: 'password', password: 'p' } },
      { action: 'delete', reauth: { method: 'password', password: '' }, confirmation: 'x' },
      { action: 'nuke', reauth: { method: 'password', password: 'p' } },
    ])
      expect(AccountBodySchema.safeParse(body).success, JSON.stringify(body)).toBe(false)
  })
})

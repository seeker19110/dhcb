// Test quên mật khẩu — 3 điểm bảo mật bắt buộc đúng của MỌI tính năng "quên mật khẩu":
//  1. requestPasswordReset KHÔNG được lộ email nào tồn tại (chống dò email hàng loạt) — phải
//     chạy qua cùng 1 đường (không throw, không phân nhánh quan sát được từ bên ngoài) dù email
//     tồn tại, không tồn tại, hay là tài khoản Google-only không có mật khẩu.
//  2. KHÔNG được lộ qua THỜI GIAN PHẢN HỒI — nhánh nhanh (không tồn tại) phải bị giữ lại cho
//     bằng nhánh chậm (tồn tại, phải gửi mail). App nhiều trẻ em dùng nên test riêng mốc này.
//  3. resetPassword: token dùng 1 lần (used_at chặn dùng lại), hết hạn bị từ chối, và ĐẶC BIỆT
//     phải THU HỒI TOÀN BỘ SESSION CŨ sau khi đổi thành công.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('./authService.js', () => ({
  hashPassword: async (pw: string) => `hashed:${pw}`,
}))
const mailCalls: unknown[] = []
vi.mock('@dhcb/core-http/mailQuota', () => ({
  sendMailWithQuota: async (opts: unknown) => {
    mailCalls.push(opts)
    return { status: 'sent', channel: 'primary', switchedToFallback: false }
  },
}))

import { requestPasswordReset, resetPassword } from './passwordReset.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  mailCalls.length = 0
  query.mockReset()
  query.mockImplementation(async (sql: string) => ({
    rows: sql.startsWith('update public.password_resets') ? [{ user_id: 'u1' }] : [],
  }))
  mockedGetPool.mockReturnValue({
    query,
    connect: async () => ({ query, release: vi.fn() }),
  } as unknown as ReturnType<typeof getPgPool>)
  // Timer giả cho các test requestPasswordReset — hàm này ép sàn thời gian 400ms (chống dò
  // email qua độ trễ phản hồi), test thật sẽ mất ~400ms/case nếu dùng timer thật x9 case.
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// Chạy hàm đồng thời "tua" hết mọi setTimeout đang chờ, vì requestPasswordReset luôn kết thúc
// bằng 1 khoảng sleep (sàn thời gian) trước khi promise resolve.
async function runRequestPasswordReset(email: string): Promise<void> {
  const p = requestPasswordReset(email)
  await vi.runAllTimersAsync()
  await p
}

describe('requestPasswordReset — chống dò email qua nội dung trả về', () => {
  it('email KHÔNG tồn tại → không gửi mail, không throw (chống dò email)', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    await expect(runRequestPasswordReset('khong-ton-tai@x.com')).resolves.toBeUndefined()
    expect(mailCalls).toEqual([])
  })

  it('tài khoản Google-only (không có mật khẩu) → không gửi mail, không throw', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1', password_hash: null }] })
    await expect(runRequestPasswordReset('google@x.com')).resolves.toBeUndefined()
    expect(mailCalls).toEqual([])
  })

  it('email hợp lệ có mật khẩu → gửi mail chứa link reset', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1', password_hash: 'hash' }] })
      .mockResolvedValueOnce({ rows: [] }) // không có token gần đây
    await runRequestPasswordReset('thuc@x.com')
    expect(mailCalls).toHaveLength(1)
    const mail = mailCalls[0] as { to: string; text: string }
    expect(mail.to).toBe('thuc@x.com')
    expect(mail.text).toContain('/reset-password?token=')
  })

  it('chặn gửi lại quá nhanh (cooldown) — không gửi mail lần 2', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1', password_hash: 'hash' }] })
      .mockResolvedValueOnce({ rows: [{ created_at: new Date(Date.now() - 5_000) }] })
    await runRequestPasswordReset('thuc@x.com')
    expect(mailCalls).toEqual([])
  })

  it('chuẩn hoá email về chữ thường trước khi tra cứu', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    await runRequestPasswordReset('  ABC@Example.com  ')
    expect(query.mock.calls[0]?.[1]).toEqual(['abc@example.com'])
  })
})

describe('requestPasswordReset — chống dò email qua THỜI GIAN phản hồi', () => {
  it('nhánh NHANH (email không tồn tại) vẫn phải chờ đủ sàn thời gian trước khi resolve', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // không tìm thấy user — nhánh vốn dĩ trả lời ngay
    let resolved = false
    void requestPasswordReset('khong-ton-tai@x.com').then(() => {
      resolved = true
    })

    // Chưa tua timer: dù DB đã trả lời (query là promise thật, không phải timer), promise vẫn
    // PHẢI CÒN treo vì đang bị giữ trong sleep(MIN_RESPONSE_MS) — đây chính là hành vi cần có.
    await Promise.resolve() // để microtask của .then(query) chạy xong
    await Promise.resolve()
    expect(resolved).toBe(false)

    // Tua hết timer (bước sleep) → giờ mới resolve.
    await vi.runAllTimersAsync()
    expect(resolved).toBe(true)
  })

  it('nhánh CHẬM (gửi mail thật) không bị chờ THÊM nếu đã vượt sàn thời gian', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1', password_hash: 'hash' }] })
      .mockResolvedValueOnce({ rows: [] })
    // Không cách nào giả lập "đã trôi qua 500ms xử lý thật" với mock đồng bộ, nhưng xác nhận
    // hàm vẫn hoàn thành đúng khi tua hết timer — không bị kẹt vô hạn hay sleep 2 lần.
    await runRequestPasswordReset('thuc@x.com')
    expect(mailCalls).toHaveLength(1)
  })
})

describe('resetPassword', () => {
  const future = () => new Date(Date.now() + 60_000)
  const past = () => new Date(Date.now() - 60_000)

  it('token không tồn tại → invalid_or_expired', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await resetPassword('token-la', 'matkhaumoi')).toEqual({
      ok: false,
      reason: 'invalid_or_expired',
    })
  })

  it('token ĐÃ DÙNG rồi → already_used, không đổi mật khẩu lần 2', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'r1', user_id: 'u1', expires_at: future(), used_at: new Date() }],
    })
    const r = await resetPassword('token', 'matkhaumoi')
    expect(r).toEqual({ ok: false, reason: 'already_used' })
    expect(query.mock.calls.some((c) => String(c[0]).includes('update public.users'))).toBe(false)
  })

  it('token HẾT HẠN → invalid_or_expired dù nhập đúng', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'r1', user_id: 'u1', expires_at: past(), used_at: null }],
    })
    expect(await resetPassword('token', 'matkhaumoi')).toEqual({
      ok: false,
      reason: 'invalid_or_expired',
    })
  })

  it('hợp lệ → đổi mật khẩu VÀ thu hồi toàn bộ session cũ', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'r1', user_id: 'u1', expires_at: future(), used_at: null }],
    })
    const r = await resetPassword('token', 'matkhaumoi')
    expect(r).toEqual({ ok: true })

    expect(
      query.mock.calls.some((c) => String(c[0]).includes('password_resets set used_at = now()')),
    ).toBe(true)

    const updateUser = query.mock.calls.find((c) => String(c[0]).includes('update public.users'))
    expect((updateUser?.[1] as unknown[])[0]).toBe('hashed:matkhaumoi')

    // Chốt bảo mật quan trọng nhất của tính năng này: xoá TOÀN BỘ session, không phải 1 cái.
    const revoke = query.mock.calls.find((c) =>
      String(c[0]).includes('delete from public.sessions'),
    )
    expect(revoke).toBeDefined()
    expect((revoke?.[1] as unknown[])[0]).toBe('u1')
  })
})

describe('resetPassword — nguyên tử và dùng một lần', () => {
  const record = { id: 'r1', user_id: 'u1', expires_at: new Date('2099-01-01'), used_at: null }

  it('hai lần dùng đồng thời chỉ một lần đổi mật khẩu', async () => {
    let consumed = false
    query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('select')) return { rows: [record] }
      if (sql.startsWith('update public.password_resets')) {
        expect(sql).toContain('used_at is null and expires_at > now()')
        if (consumed) return { rows: [] }
        consumed = true
        return { rows: [{ user_id: 'u1' }] }
      }
      return { rows: [] }
    })
    const results = await Promise.all([
      resetPassword('same', 'first'),
      resetPassword('same', 'second'),
    ])
    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(
      query.mock.calls.filter(([sql]) => String(sql).startsWith('update public.users')),
    ).toHaveLength(1)
  })

  it('thu hồi phiên thất bại phải rollback, không commit lần tiêu thụ token', async () => {
    query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('select')) return { rows: [record] }
      if (sql.startsWith('update public.password_resets')) return { rows: [{ user_id: 'u1' }] }
      if (sql.startsWith('delete from public.sessions')) throw new Error('session delete failed')
      return { rows: [] }
    })
    await expect(resetPassword('same', 'first')).rejects.toThrow('session delete failed')
    expect(query.mock.calls.map(([sql]) => sql)).toContain('rollback')
    expect(query.mock.calls.map(([sql]) => sql)).not.toContain('commit')
  })
})

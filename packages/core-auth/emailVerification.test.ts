// Test xác thực email — các ca biên quan trọng vì đây là hàng rào chống tài khoản giả:
//  1. Đã xác thực rồi thì không gửi lại.
//  2. Chặn gửi lại trong vòng 60s (cooldown) — chống đốt hạn mức mail.
//  3. Mã lưu trong DB phải là HASH, không phải mã gốc.
//  4. Sai mã → tăng attempts; quá 5 lần → khoá, phải gửi mã mới.
//  5. Mã hết hạn → từ chối.
//  6. Đúng mã → đánh dấu email_verified + xoá mã (dùng 1 lần).

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { changeEmail } from './changeEmail.js'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const mailState: { status: string } = { status: 'sent' }
// emailVerification gửi qua mailQuota (kiểm soát hạn mức + tự chuyển kênh dự phòng) chứ không
// gọi thẳng mailer — mock ở đúng tầng này, hành vi hạn mức/chuyển kênh có test riêng ở
// mailQuota.test.ts, ở đây chỉ cần giả lập kết quả gửi cuối cùng.
vi.mock('@dhcb/core-http/mailQuota', () => ({
  sendMailWithQuota: vi.fn(async () => ({
    status: mailState.status,
    channel: 'primary',
    switchedToFallback: false,
  })),
}))

import { sendVerificationCode, verifyCode, isEmailVerified } from './emailVerification.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { sendMailWithQuota } from '@dhcb/core-http/mailQuota'

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
  mailState.status = 'sent'
  vi.mocked(sendMailWithQuota).mockClear()
})

const sha256 = (s: string) =>
  createHash('sha256')
    .update(JSON.stringify(['u1', 'a@b.com', s]))
    .digest('hex')

describe('sendVerificationCode', () => {
  it('từ chối khi email đã xác thực rồi', async () => {
    query.mockResolvedValueOnce({ rows: [{ email: 'a@b.com', email_verified: new Date() }] })
    const r = await sendVerificationCode('u1')
    expect(r).toEqual({ ok: false, reason: 'already_verified' })
  })

  it('từ chối khi không tìm thấy user', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const r = await sendVerificationCode('u1')
    expect(r).toEqual({ ok: false, reason: 'user_not_found' })
  })

  it('chặn gửi lại khi chưa quá 60s (chống đốt hạn mức mail)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ email: 'a@b.com', email_verified: null }] })
      .mockResolvedValueOnce({ rows: [{ last_sent_at: new Date(Date.now() - 5_000) }] })
    const r = await sendVerificationCode('u1')
    expect(r).toEqual({ ok: false, reason: 'cooldown' })
  })

  it('cho gửi lại khi đã quá 60s', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ email: 'a@b.com', email_verified: null }] })
      .mockResolvedValueOnce({ rows: [{ last_sent_at: new Date(Date.now() - 120_000) }] })
    const r = await sendVerificationCode('u1')
    expect(r).toEqual({ ok: true, mail: 'sent' })
  })

  it('LƯU HASH của mã, không lưu mã gốc', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ email: 'a@b.com', email_verified: null }] })
      .mockResolvedValueOnce({ rows: [] })
    await sendVerificationCode('u1')

    const insertCall = query.mock.calls.find((c) =>
      String(c[0]).includes('insert into public.email_verifications'),
    )
    const storedHash = (insertCall?.[1] as unknown[])[1] as string
    // Hash hex 64 ký tự, và KHÔNG phải chuỗi 6 chữ số.
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/)
    expect(storedHash).not.toMatch(/^\d{6}$/)
  })

  it('trả trạng thái gửi thật (rejected = địa chỉ bị từ chối)', async () => {
    mailState.status = 'rejected'
    query
      .mockResolvedValueOnce({ rows: [{ email: 'sai@khong-ton-tai.xyz', email_verified: null }] })
      .mockResolvedValueOnce({ rows: [] })
    const r = await sendVerificationCode('u1')
    expect(r).toEqual({ ok: true, mail: 'rejected' })
  })
})

describe('verifyCode', () => {
  beforeEach(() => {
    query.mockResolvedValueOnce({ rows: [{ email: 'a@b.com' }] })
  })
  const future = () => new Date(Date.now() + 60_000)

  it('không có mã đang chờ → báo no_code', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const r = await verifyCode('u1', '123456')
    expect(r).toEqual({ ok: false, reason: 'no_code' })
  })

  it('quá số lần nhập sai → khoá, không cho thử tiếp', async () => {
    query.mockResolvedValueOnce({
      rows: [{ code_hash: sha256('123456'), expires_at: future(), attempts: 5 }],
    })
    const r = await verifyCode('u1', '123456')
    expect(r).toEqual({ ok: false, reason: 'too_many_attempts' })
  })

  it('mã hết hạn → từ chối kể cả khi nhập đúng', async () => {
    query.mockResolvedValueOnce({
      rows: [
        { code_hash: sha256('123456'), expires_at: new Date(Date.now() - 1_000), attempts: 0 },
      ],
    })
    const r = await verifyCode('u1', '123456')
    expect(r).toEqual({ ok: false, reason: 'expired' })
  })

  it('sai mã → tăng attempts trong DB', async () => {
    query.mockResolvedValueOnce({
      rows: [{ code_hash: sha256('123456'), expires_at: future(), attempts: 1 }],
    })
    const r = await verifyCode('u1', '999999')
    expect(r).toEqual({ ok: false, reason: 'wrong_code' })
    expect(query.mock.calls.some((c) => String(c[0]).includes('attempts = attempts + 1'))).toBe(
      true,
    )
  })

  it('đúng mã → đánh dấu đã xác thực và XOÁ mã (dùng 1 lần)', async () => {
    query.mockResolvedValueOnce({
      rows: [{ code_hash: sha256('123456'), expires_at: future(), attempts: 0 }],
    })
    const r = await verifyCode('u1', '123456')
    expect(r).toEqual({ ok: true })
    expect(query.mock.calls.some((c) => String(c[0]).includes('set email_verified = now()'))).toBe(
      true,
    )
    expect(
      query.mock.calls.some((c) => String(c[0]).includes('delete from public.email_verifications')),
    ).toBe(true)
  })

  it('bỏ khoảng trắng thừa quanh mã người dùng dán vào', async () => {
    query.mockResolvedValueOnce({
      rows: [{ code_hash: sha256('123456'), expires_at: future(), attempts: 0 }],
    })
    const r = await verifyCode('u1', '  123456  ')
    expect(r).toEqual({ ok: true })
  })
})

describe('isEmailVerified', () => {
  it('trả false khi chưa xác thực, true khi đã xác thực', async () => {
    query.mockResolvedValueOnce({ rows: [{ email_verified: null }] })
    expect(await isEmailVerified('u1')).toBe(false)

    query.mockResolvedValueOnce({ rows: [{ email_verified: new Date() }] })
    expect(await isEmailVerified('u1')).toBe(true)
  })

  it('user không tồn tại → false (không nổ lỗi)', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await isEmailVerified('u1')).toBe(false)
  })
})

// Fake có hàng users khóa xuyên transaction, trạng thái lưu thật và rollback. Không giả
// định thứ tự SELECT/UPDATE bằng mockResolvedValueOnce nên tái hiện được request đồng thời.
function lockedEmailPool() {
  type Challenge = { code_hash: string; expires_at: Date; attempts: number; last_sent_at: Date }
  type State = {
    user: { email: string; password_hash: null; email_verified: Date | null }
    challenge: Challenge | null
  }
  let state: State = {
    user: { email: 'old@example.com', password_hash: null, email_verified: null },
    challenge: null,
  }
  let lockTail = Promise.resolve()
  let failDelete = false
  const commands: string[] = []
  const pool = {
    query: async () => {
      throw new Error('Nghiệp vụ phải dùng client trong transaction')
    },
    connect: async () => {
      let unlock: (() => void) | undefined
      let snapshot: State | undefined
      return {
        release: () => {
          unlock?.()
        },
        query: async (sql: string, params: unknown[] = []) => {
          commands.push(sql)
          if (sql === 'begin') return { rows: [], rowCount: 0 }
          if (sql === 'commit' || sql === 'rollback') {
            if (sql === 'rollback' && snapshot) state = snapshot
            unlock?.()
            unlock = undefined
            return { rows: [], rowCount: 0 }
          }
          if (sql.includes('from public.users') && sql.includes('for update')) {
            const previous = lockTail
            lockTail = new Promise<void>((resolve) => {
              unlock = resolve
            })
            await previous
            snapshot = {
              user: { ...state.user },
              challenge: state.challenge ? { ...state.challenge } : null,
            }
            return { rows: [{ ...state.user }], rowCount: 1 }
          }
          if (!snapshot) throw new Error('Chưa khóa users trước khi đọc/ghi mã')
          if (sql.includes('from public.email_verifications') && sql.startsWith('select'))
            return { rows: state.challenge ? [{ ...state.challenge }] : [], rowCount: 0 }
          if (sql.startsWith('insert into public.email_verifications')) {
            state.challenge = {
              code_hash: String(params[1]),
              expires_at: params[2] as Date,
              attempts: 0,
              last_sent_at: new Date(),
            }
          } else if (sql.includes('set attempts = attempts + 1')) {
            if (state.challenge) state.challenge.attempts += 1
          } else if (sql.includes('set email_verified = now()')) {
            state.user.email_verified = new Date()
          } else if (sql.includes('set email = $1')) {
            state.user.email = String(params[0])
            state.user.email_verified = null
          } else if (sql.startsWith('delete from public.email_verifications')) {
            if (failDelete) throw new Error('delete failed')
            state.challenge = null
          } else throw new Error(`SQL chưa được mô phỏng: ${sql}`)
          return { rows: [], rowCount: 1 }
        },
      }
    },
  } as unknown as ReturnType<typeof getPgPool>
  mockedGetPool.mockReturnValue(pool)
  return {
    getState: () => state,
    commands,
    failNextDelete: () => {
      failDelete = true
    },
  }
}

function lastSentCode(): string {
  return vi.mocked(sendMailWithQuota).mock.calls.at(-1)![0].subject.slice(0, 6)
}

async function differentCode(
  oldCode: string,
  db: ReturnType<typeof lockedEmailPool>,
): Promise<string> {
  // Mã ngẫu nhiên thật có thể trùng 1/1.000.000; gửi lại để kiểm hai mã khác nhau, tránh test flaky.
  while (lastSentCode() === oldCode) {
    db.getState().challenge!.last_sent_at = new Date(0)
    await sendVerificationCode('u1')
  }
  return lastSentCode()
}

describe('xác thực email — đồng thời và rollback', () => {
  it('hai lần gửi đồng thời → chỉ một email, lần còn lại chịu cooldown', async () => {
    lockedEmailPool()
    const results = await Promise.all([sendVerificationCode('u1'), sendVerificationCode('u1')])
    expect(results).toContainEqual({ ok: true, mail: 'sent' })
    expect(results).toContainEqual({ ok: false, reason: 'cooldown' })
    expect(sendMailWithQuota).toHaveBeenCalledTimes(1)
  })

  it('hai lần dùng cùng mã đồng thời + retry → chỉ một lần thành công', async () => {
    lockedEmailPool()
    await sendVerificationCode('u1')
    const code = lastSentCode()
    const results = await Promise.all([verifyCode('u1', code), verifyCode('u1', code)])
    expect(results).toContainEqual({ ok: true })
    expect(results).toContainEqual({ ok: false, reason: 'no_code' })
    expect(await verifyCode('u1', code)).toEqual({ ok: false, reason: 'no_code' })
  })

  it('10 lần đoán đồng thời chỉ tiêu tối đa 5 lần thử', async () => {
    const db = lockedEmailPool()
    await sendVerificationCode('u1')
    const code = lastSentCode()
    const wrong = code === '999999' ? '000000' : '999999'
    const results = await Promise.all(Array.from({ length: 10 }, () => verifyCode('u1', wrong)))
    expect(results.filter((r) => !r.ok && r.reason === 'wrong_code')).toHaveLength(5)
    expect(results.filter((r) => !r.ok && r.reason === 'too_many_attempts')).toHaveLength(5)
    expect(db.getState().challenge?.attempts).toBe(5)
    expect(await verifyCode('u1', code)).toEqual({ ok: false, reason: 'too_many_attempts' })
  })

  it.each(['verify-first', 'change-first'])(
    'đổi email đua với xác thực (%s) → email mới luôn chưa xác thực',
    async (order) => {
      const db = lockedEmailPool()
      await sendVerificationCode('u1')
      const oldCode = lastSentCode()
      if (order === 'verify-first') {
        await Promise.all([verifyCode('u1', oldCode), changeEmail('u1', 'new@example.com', null)])
      } else {
        await Promise.all([changeEmail('u1', 'new@example.com', null), verifyCode('u1', oldCode)])
      }
      expect(db.getState().user).toMatchObject({ email: 'new@example.com', email_verified: null })
      const newCode = await differentCode(oldCode, db)
      expect(await verifyCode('u1', oldCode)).toEqual({ ok: false, reason: 'wrong_code' })
      expect(await verifyCode('u1', newCode)).toEqual({ ok: true })
    },
  )

  it('gửi mã đồng thời với đổi email → mã gửi hộp thư cũ không xác thực hộp thư mới', async () => {
    const db = lockedEmailPool()
    await Promise.all([sendVerificationCode('u1'), changeEmail('u1', 'new@example.com', null)])
    const sent = vi.mocked(sendMailWithQuota).mock.calls.map(([mail]) => mail.to)
    expect(sent).toEqual(['old@example.com', 'new@example.com'])
    const oldCode = vi.mocked(sendMailWithQuota).mock.calls[0]![0].subject.slice(0, 6)
    await differentCode(oldCode, db)
    expect(await verifyCode('u1', oldCode)).toEqual({ ok: false, reason: 'wrong_code' })
    expect(db.getState().user.email_verified).toBeNull()
  })

  it('hash từ hộp thư khác không được xác thực dù mã 6 số giống nhau', async () => {
    const db = lockedEmailPool()
    await sendVerificationCode('u1')
    const code = lastSentCode()
    db.getState().user.email = 'other@example.com'
    expect(await verifyCode('u1', code)).toEqual({ ok: false, reason: 'wrong_code' })
    expect(db.getState().user.email_verified).toBeNull()
  })

  it('xóa mã lỗi → rollback cả cờ xác thực, giữ mã cho retry', async () => {
    const db = lockedEmailPool()
    await sendVerificationCode('u1')
    const code = lastSentCode()
    db.failNextDelete()
    await expect(verifyCode('u1', code)).rejects.toThrow('delete failed')
    expect(db.getState().user.email_verified).toBeNull()
    expect(db.getState().challenge).not.toBeNull()
    expect(db.commands).toContain('rollback')
  })

  it('xóa mã cũ lỗi → rollback cả đổi email, không gửi mail địa chỉ mới', async () => {
    const db = lockedEmailPool()
    await sendVerificationCode('u1')
    db.failNextDelete()
    await expect(changeEmail('u1', 'new@example.com', null)).rejects.toThrow('delete failed')
    expect(db.getState().user.email).toBe('old@example.com')
    expect(db.getState().challenge).not.toBeNull()
    expect(sendMailWithQuota).toHaveBeenCalledTimes(1)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmailReminders } from './emailReminders.js'

vi.mock('@dhcb/core-db/pgPool', () => {
  const query = vi.fn()
  return { getPgPool: () => ({ query }) }
})

vi.mock('@dhcb/core-http/mailQuota', () => ({
  sendMailWithQuota: vi.fn(() => Promise.resolve({ status: 'sent', channel: 'primary' })),
}))

import { getPgPool } from '@dhcb/core-db/pgPool'
import { sendMailWithQuota } from '@dhcb/core-http/mailQuota'

describe('sendEmailReminders', () => {
  const queryMock = getPgPool().query as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('không gửi nếu không có ai chưa học', async () => {
    // 1. studiedRows: 0 hàng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 2. activeRows: 0 hàng
    queryMock.mockResolvedValueOnce({ rows: [] })

    const res = await sendEmailReminders()
    expect(res.sent).toBe(0)
    expect(res.skipped).toBe(0)
  })

  it('gửi email thành công cho user đủ điều kiện', async () => {
    // 1. studiedUserIds: u1 đã học -> rỗng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 2. activeUserIds: u2 có hoạt động
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u2' }] })
    // 3. pushSubs: u2 không có push
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 4. recentReminders: u2 không nằm trong cooldown
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 5. userEmails: tìm thấy email của u2
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u2', email: 'test@example.com' }] })
    // 6. recentUsage: daily usage của u2 trong 14 ngày qua
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u2', day: '2026-08-03', chat_count: 1 }] })
    // 7. progress: learning progress của u2
    queryMock.mockResolvedValueOnce({
      rows: [{ user_id: 'u2', srs: {}, weekly_goal: { goal: 5 } }],
    })

    // 8. update email_reminders (sau khi gửi thành công)
    queryMock.mockResolvedValueOnce({ rows: [] })

    const res = await sendEmailReminders()
    expect(res.sent).toBe(1)
    expect(res.skipped).toBe(0)
    expect(sendMailWithQuota).toHaveBeenCalledOnce()
  })

  it('trả về {sent:0, skipped:0} khi tất cả active user đã học hôm nay', async () => {
    // 1. studiedRows: u1 đã học hôm nay
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] })
    // 2. activeRows: u1 cũng nằm trong active → bị lọc ra hết
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] })

    const res = await sendEmailReminders()
    expect(res).toEqual({ sent: 0, skipped: 0, failed: 0 })
    // Không gọi thêm query nào sau khi early return
    expect(queryMock).toHaveBeenCalledTimes(2)
  })

  it('dùng DEFAULT_WEEKLY_GOAL khi weekly_goal.goal không phải number', async () => {
    // 1. studiedRows: rỗng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 2. activeRows: u3
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u3' }] })
    // 3. pushSubs: rỗng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 4. recentReminders: rỗng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 5. userEmails
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u3', email: 'u3@example.com' }] })
    // 6. recentUsage
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u3', day: '2026-08-03', chat_count: 1 }] })
    // 7. progress: weekly_goal là object rỗng → goal ko phải number → dùng DEFAULT = 5
    queryMock.mockResolvedValueOnce({
      rows: [{ user_id: 'u3', srs: {}, weekly_goal: {} }],
    })
    // 8. email_reminders upsert
    queryMock.mockResolvedValueOnce({ rows: [] })

    const res = await sendEmailReminders()
    expect(res.sent).toBe(1)
    expect(sendMailWithQuota).toHaveBeenCalledOnce()
  })

  it('tăng skipped khi mail status khác sent (quota_exceeded)', async () => {
    ;(sendMailWithQuota as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 'quota_exceeded',
    })

    // 1. studiedRows: rỗng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 2. activeRows: u4
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u4' }] })
    // 3. pushSubs: rỗng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 4. recentReminders: rỗng
    queryMock.mockResolvedValueOnce({ rows: [] })
    // 5. userEmails
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u4', email: 'u4@example.com' }] })
    // 6. recentUsage
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u4', day: '2026-08-03', chat_count: 1 }] })
    // 7. progress
    queryMock.mockResolvedValueOnce({
      rows: [{ user_id: 'u4', srs: {}, weekly_goal: { goal: 5 } }],
    })

    const res = await sendEmailReminders()
    expect(res.skipped).toBe(1)
    expect(res.sent).toBe(0)
    // Không gọi upsert email_reminders khi mail không gửi thành công
    expect(queryMock).toHaveBeenCalledTimes(7)
  })

  /** 7 câu đọc đầu của một vòng có đúng hai học viên u5, u6 cần nhắc. */
  function queueTwoTargets() {
    queryMock.mockResolvedValueOnce({ rows: [] })
    queryMock.mockResolvedValueOnce({ rows: [{ user_id: 'u5' }, { user_id: 'u6' }] })
    queryMock.mockResolvedValueOnce({ rows: [] })
    queryMock.mockResolvedValueOnce({ rows: [] })
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: 'u5', email: 'u5@example.com' },
        { id: 'u6', email: 'u6@example.com' },
      ],
    })
    queryMock.mockResolvedValueOnce({ rows: [] })
    queryMock.mockResolvedValueOnce({ rows: [] })
  }

  it('SMTP lỗi / chưa cấu hình → đếm vào failed, KHÔNG lẫn vào skipped', async () => {
    const send = sendMailWithQuota as ReturnType<typeof vi.fn>
    send
      .mockResolvedValueOnce({ status: 'error' })
      .mockResolvedValueOnce({ status: 'not_configured' })
    queueTwoTargets()
    expect(await sendEmailReminders()).toEqual({ sent: 0, skipped: 0, failed: 2 })
  })

  it('ghi mốc cooldown lỗi CSDL → KHÔNG dừng cả vòng, người sau vẫn được gửi', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    queueTwoTargets()
    queryMock.mockRejectedValueOnce(new Error('db down'))
    queryMock.mockResolvedValueOnce({ rows: [] })
    expect(await sendEmailReminders()).toEqual({ sent: 2, skipped: 0, failed: 0 })
    expect(sendMailWithQuota).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalledOnce()
    error.mockRestore()
  })
})

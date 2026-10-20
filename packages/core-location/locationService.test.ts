// Test business logic "Đi chung" — tập trung vào LỜI HỨA RIÊNG TƯ:
//  1. Không phải thành viên đang hoạt động → không đọc/ghi được gì.
//  2. Tắt chia sẻ = XOÁ vị trí (không phải ẩn), và vị trí bị bỏ qua khi đang tắt.
//  3. Chế độ 'approx' làm mờ toạ độ Ở SERVER trước khi lưu.
//  4. Kết thúc/rời chuyến xoá vị trí ngay.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockQuery = vi.fn()
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query: mockQuery }) }))

import {
  createSession,
  getActiveMemberIds,
  getActiveMembership,
  getSessionState,
  joinByInviteCode,
  leaveSession,
  listMySessions,
  purgeExpiredPositions,
  recordPosition,
  updateSession,
  updateSharing,
} from './locationService.js'

/** Khớp câu SQL theo một mảnh chữ đặc trưng, trả về các lượt gọi tương ứng. */
function callsMatching(fragment: string): unknown[][] {
  return mockQuery.mock.calls.filter((c) => String(c[0]).includes(fragment))
}

beforeEach(() => {
  mockQuery.mockReset()
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
})

describe('getActiveMembership', () => {
  it('không có dòng → null (đã rời chuyến / chuyến hết hạn)', async () => {
    expect(await getActiveMembership('s1', 'u1')).toBeNull()
  })

  it('câu truy vấn tự lọc left_at/ended_at/expires_at — không tin client', async () => {
    await getActiveMembership('s1', 'u1')
    const sql = String(mockQuery.mock.calls[0]![0])
    expect(sql).toContain('m.left_at is null')
    expect(sql).toContain('s.ended_at is null')
    expect(sql).toContain('s.expires_at > now()')
  })
})

describe('recordPosition', () => {
  it('không phải thành viên → null, KHÔNG ghi gì vào bảng positions', async () => {
    expect(await recordPosition('s1', 'u1', { lat: 10, lng: 106 })).toBeNull()
    expect(callsMatching('insert into location.positions')).toHaveLength(0)
  })

  it('đang TẮT chia sẻ → bỏ qua im lặng, không ghi vị trí', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ sharing_enabled: false, precision_mode: 'exact' }],
    })
    expect(await recordPosition('s1', 'u1', { lat: 10, lng: 106 })).toBeNull()
    expect(callsMatching('insert into location.positions')).toHaveLength(0)
  })

  it('chế độ approx → toạ độ LƯU vào DB đã bị làm mờ', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'approx' }] })
      .mockResolvedValueOnce({ rows: [{ updated_at: new Date('2026-08-26T00:00:00Z') }] })
      .mockResolvedValueOnce({ rows: [{ name: 'An', owner_id: 'u1' }] })

    const member = await recordPosition('s1', 'u1', { lat: 10.7712, lng: 106.7003 })
    const insert = callsMatching('insert into location.positions')[0]!
    const params = insert[1] as unknown[]
    expect(params[2]).not.toBe(10.7712)
    expect(params[3]).not.toBe(106.7003)
    expect(member?.position?.lat).toBe(params[2])
    expect(member?.isOwner).toBe(true)
  })

  it('chế độ exact → lưu đúng toạ độ thật', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
      .mockResolvedValueOnce({ rows: [{ updated_at: new Date('2026-08-26T00:00:00Z') }] })
      .mockResolvedValueOnce({ rows: [{ name: 'An', owner_id: 'khac' }] })

    const member = await recordPosition('s1', 'u1', { lat: 10.7712, lng: 106.7003 })
    expect(member?.position).toMatchObject({ lat: 10.7712, lng: 106.7003 })
    expect(member?.isOwner).toBe(false)
  })
})

describe('updateSharing', () => {
  it('không phải thành viên → false, không đụng DB ghi', async () => {
    expect(await updateSharing('s1', 'u1', { sharingEnabled: true })).toBe(false)
    expect(callsMatching('update location.session_members')).toHaveLength(0)
  })

  it('TẮT chia sẻ → xoá luôn vị trí đang lưu + ghi nhật ký "disable"', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
    expect(await updateSharing('s1', 'u1', { sharingEnabled: false })).toBe(true)
    expect(callsMatching('delete from location.positions')).toHaveLength(1)
    const log = callsMatching('insert into location.consent_log')[0]!
    expect((log[1] as unknown[])[2]).toBe('disable')
  })

  it('BẬT chia sẻ → không xoá vị trí, ghi nhật ký "enable"', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ sharing_enabled: false, precision_mode: 'exact' }] })
    await updateSharing('s1', 'u1', { sharingEnabled: true })
    expect(callsMatching('delete from location.positions')).toHaveLength(0)
    expect((callsMatching('insert into location.consent_log')[0]![1] as unknown[])[2]).toBe(
      'enable',
    )
  })

  it('chỉ đổi độ chính xác (không đổi công tắc) → không ghi nhật ký đồng thuận', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
    await updateSharing('s1', 'u1', { precisionMode: 'approx' })
    expect(callsMatching('insert into location.consent_log')).toHaveLength(0)
  })
})

describe('getSessionState', () => {
  it('không phải thành viên → null', async () => {
    expect(await getSessionState('s1', 'u1')).toBeNull()
  })

  it('người đang tắt chia sẻ KHÔNG lộ toạ độ, dù DB còn dòng vị trí cũ', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 's1',
            owner_id: 'u1',
            name: 'Đi cà phê',
            invite_code: 'ABC123',
            meet_lat: null,
            meet_lng: null,
            meet_label: null,
            alert_radius_m: 300,
            expires_at: new Date('2026-08-26T04:00:00Z'),
            ended_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 'u2',
            name: 'Bình',
            sharing_enabled: false,
            precision_mode: 'exact',
            lat: 10.77,
            lng: 106.7,
            accuracy_m: 12,
            heading_deg: null,
            speed_mps: null,
            battery_pct: 80,
            updated_at: new Date('2026-08-26T00:00:00Z'),
          },
        ],
      })

    const state = await getSessionState('s1', 'u1')
    expect(state?.members[0]).toMatchObject({ userId: 'u2', sharingEnabled: false, position: null })
    expect(state?.members[0]!.updatedAt).toBeNull()
  })
})

describe('updateSession', () => {
  it('không phải chủ chuyến → false, không sửa gì', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: 'nguoi-khac' }] })
    expect(await updateSession('s1', 'u1', { alertRadiusM: 500 })).toBe(false)
    expect(callsMatching('update location.sessions set alert_radius_m')).toHaveLength(0)
  })

  it('kết thúc chuyến → xoá TOÀN BỘ vị trí của mọi thành viên', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: 'u1' }] })
    expect(await updateSession('s1', 'u1', { end: true })).toBe(true)
    expect(callsMatching('delete from location.positions where session_id = $1')).toHaveLength(1)
    expect((callsMatching('insert into location.consent_log')[0]![1] as unknown[])[2]).toBe('end')
  })

  it('xoá điểm hẹn (meetPoint = null) khác với KHÔNG đổi (undefined)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: 'u1' }] })
    await updateSession('s1', 'u1', { meetPoint: null })
    expect(callsMatching('meet_lat = $2')).toHaveLength(1)

    mockQuery.mockReset()
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: 'u1' }] })
    await updateSession('s1', 'u1', { alertRadiusM: 400 })
    expect(callsMatching('meet_lat = $2')).toHaveLength(0)
  })
})

describe('leaveSession', () => {
  it('rời chuyến → tắt chia sẻ, xoá vị trí, ghi nhật ký "leave"', async () => {
    await leaveSession('s1', 'u1')
    expect(callsMatching('set left_at = now()')).toHaveLength(1)
    expect(callsMatching('delete from location.positions')).toHaveLength(1)
    expect((callsMatching('insert into location.consent_log')[0]![1] as unknown[])[2]).toBe('leave')
  })
})

// Đợt 2 coverage 2026-09-05: nhánh chưa phủ + các hàm chưa từng gọi tới (createSession,
// joinByInviteCode, listMySessions, getActiveMemberIds, purgeExpiredPositions, randomCode).
describe('createSession — Đợt 2 coverage', () => {
  it('đã đủ MAX_ACTIVE_SESSIONS_PER_USER chuyến đang mở → từ chối, không tạo mã mời', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] })
    const r = await createSession('u1', 'Đi chơi', 60)
    expect(r).toEqual({ ok: false, reason: 'too_many_sessions' })
    expect(callsMatching('insert into location.sessions')).toHaveLength(0)
  })

  it('truy vấn đếm chuyến không trả về dòng nào thì coi như 0, vẫn tạo được', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'sess-3' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    expect(await createSession('u1', 'Đi chơi', 60)).toEqual({ ok: true, sessionId: 'sess-3' })
  })

  it('tạo thành công ngay lần thử mã mời đầu tiên', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'sess-1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const r = await createSession('u1', 'Đi chơi', 60)
    expect(r).toEqual({ ok: true, sessionId: 'sess-1' })
    expect((callsMatching('insert into location.consent_log')[0]![1] as unknown[])[2]).toBe('join')
  })

  it('trùng mã mời (23505) thì thử mã khác, không báo lỗi cho người dùng', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockRejectedValueOnce(Object.assign(new Error('trung ma'), { code: '23505' }))
      .mockResolvedValueOnce({ rows: [{ id: 'sess-2' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const r = await createSession('u1', 'Đi chơi', 60)
    expect(r).toEqual({ ok: true, sessionId: 'sess-2' })
    expect(callsMatching('insert into location.sessions')).toHaveLength(2)
  })

  it('lỗi KHÁC unique_violation thì ném thẳng, không thử lại', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockRejectedValueOnce(Object.assign(new Error('mat ket noi DB'), { code: '08000' }))

    await expect(createSession('u1', 'Đi chơi', 60)).rejects.toThrow('mat ket noi DB')
    expect(callsMatching('insert into location.sessions')).toHaveLength(1)
  })

  it('trùng mã mời liên tục hết MAX_CODE_ATTEMPTS lần thì báo không sinh được mã', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] })
    for (let i = 0; i < 8; i += 1) {
      mockQuery.mockRejectedValueOnce(Object.assign(new Error('trung ma'), { code: '23505' }))
    }
    await expect(createSession('u1', 'Đi chơi', 60)).rejects.toThrow(
      'Không sinh được mã mời duy nhất',
    )
    expect(callsMatching('insert into location.sessions')).toHaveLength(8)
  })
})

describe('joinByInviteCode — Đợt 2 coverage', () => {
  it('mã mời không tồn tại → not_found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    expect(await joinByInviteCode('u1', 'ZZZZZZ')).toEqual({ ok: false, reason: 'not_found' })
  })

  it('chuyến đã kết thúc (ended_at có giá trị) → expired dù chưa hết hạn theo thời gian', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 's1',
          owner_id: 'u1',
          name: 'Đi chơi',
          invite_code: 'ABC123',
          meet_lat: null,
          meet_lng: null,
          meet_label: null,
          alert_radius_m: 300,
          expires_at: new Date(Date.now() + 60_000),
          ended_at: new Date('2026-08-01T00:00:00Z'),
        },
      ],
    })
    expect(await joinByInviteCode('u1', 'abc123')).toEqual({ ok: false, reason: 'expired' })
  })

  it('chuyến hết hạn theo thời gian (expires_at đã qua) → expired', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 's1',
          owner_id: 'u1',
          name: 'Đi chơi',
          invite_code: 'ABC123',
          meet_lat: null,
          meet_lng: null,
          meet_label: null,
          alert_radius_m: 300,
          expires_at: new Date(Date.now() - 60_000),
          ended_at: null,
        },
      ],
    })
    expect(await joinByInviteCode('u1', 'ABC123')).toEqual({ ok: false, reason: 'expired' })
  })

  it('vào lần đầu (chưa từng là thành viên) → alreadyMember=false, ghi nhật ký "join"', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 's1',
            owner_id: 'u1',
            name: 'Đi chơi',
            invite_code: 'ABC123',
            meet_lat: null,
            meet_lng: null,
            meet_label: null,
            alert_radius_m: 300,
            expires_at: new Date(Date.now() + 60_000),
            ended_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const r = await joinByInviteCode('u2', 'ABC123')
    expect(r).toEqual({ ok: true, sessionId: 's1', alreadyMember: false })
    expect((callsMatching('insert into location.consent_log')[0]![1] as unknown[])[2]).toBe('join')
  })

  it('vào lại khi ĐANG là thành viên hoạt động → alreadyMember=true, KHÔNG ghi nhật ký lại', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 's1',
            owner_id: 'u1',
            name: 'Đi chơi',
            invite_code: 'ABC123',
            meet_lat: null,
            meet_lng: null,
            meet_label: null,
            alert_radius_m: 300,
            expires_at: new Date(Date.now() + 60_000),
            ended_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ left_at: null }] })
      .mockResolvedValueOnce({ rows: [] })

    const r = await joinByInviteCode('u2', 'ABC123')
    expect(r).toEqual({ ok: true, sessionId: 's1', alreadyMember: true })
    expect(callsMatching('insert into location.consent_log')).toHaveLength(0)
  })
})

describe('listMySessions — Đợt 2 coverage', () => {
  it('trả danh sách chuyến còn hiệu lực, đếm đúng số thành viên (dạng chuỗi từ SQL đổi sang số)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 's1',
          name: 'Đi chơi',
          invite_code: 'ABC123',
          // expires_at về dạng CHUỖI (như driver pg trả cho một số kiểu cột) — canh nhánh else
          // của iso(), khác mọi test khác trong file này luôn đưa thẳng object Date.
          expires_at: '2026-09-10T00:00:00.000Z',
          member_count: '3',
        },
      ],
    })
    const r = await listMySessions('u1')
    expect(r).toEqual([
      {
        sessionId: 's1',
        name: 'Đi chơi',
        inviteCode: 'ABC123',
        expiresAt: '2026-09-10T00:00:00.000Z',
        memberCount: 3,
      },
    ])
  })
})

describe('getActiveMemberIds — Đợt 2 coverage', () => {
  it('trả đúng danh sách id thành viên đang hoạt động, dùng để fan-out qua Redis', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }, { user_id: 'u2' }] })
    expect(await getActiveMemberIds('s1')).toEqual(['u1', 'u2'])
  })
})

describe('purgeExpiredPositions — Đợt 2 coverage', () => {
  it('trả đúng số dòng đã xoá', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 7 })
    expect(await purgeExpiredPositions()).toBe(7)
  })

  it('driver không trả rowCount (null/undefined) thì coi như 0, không throw', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: null })
    expect(await purgeExpiredPositions()).toBe(0)
  })
})

describe('recordPosition — Đợt 2 coverage', () => {
  it('hồ sơ chưa có tên (name null) thì hiện "Bạn" thay vì null', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
      .mockResolvedValueOnce({ rows: [{ updated_at: new Date('2026-08-26T00:00:00Z') }] })
      .mockResolvedValueOnce({ rows: [{ name: null, owner_id: 'khac' }] })

    const member = await recordPosition('s1', 'u1', { lat: 10, lng: 106 })
    expect(member?.name).toBe('Bạn')
  })
})

describe('getSessionState — Đợt 2 coverage', () => {
  it('có quyền thành viên nhưng chuyến không còn tồn tại (đã bị xoá hẳn) → null', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
      .mockResolvedValueOnce({ rows: [] })
    expect(await getSessionState('s1', 'u1')).toBeNull()
  })

  it('chuyến đã kết thúc + có điểm hẹn + thành viên đang chia sẻ đủ toạ độ + chưa có tên', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 's1',
            owner_id: 'u1',
            name: 'Đi cà phê',
            invite_code: 'ABC123',
            meet_lat: 10.77,
            meet_lng: 106.7,
            meet_label: 'Cổng công viên',
            alert_radius_m: 300,
            expires_at: new Date('2026-08-26T04:00:00Z'),
            ended_at: new Date('2026-08-26T03:00:00Z'),
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 'u1',
            name: null,
            sharing_enabled: true,
            precision_mode: 'exact',
            lat: 10.771,
            lng: 106.701,
            accuracy_m: 8,
            heading_deg: 90,
            speed_mps: 1.2,
            battery_pct: 55,
            updated_at: new Date('2026-08-26T02:59:00Z'),
          },
        ],
      })

    const state = await getSessionState('s1', 'u1')
    expect(state?.endedAt).toBe(new Date('2026-08-26T03:00:00Z').toISOString())
    expect(state?.meetPoint).toEqual({ lat: 10.77, lng: 106.7, label: 'Cổng công viên' })
    expect(state?.members[0]).toMatchObject({
      userId: 'u1',
      name: 'Bạn',
      position: { lat: 10.771, lng: 106.701, accuracyM: 8, headingDeg: 90, speedMps: 1.2 },
    })
    expect(state?.members[0]!.updatedAt).toBe(new Date('2026-08-26T02:59:00Z').toISOString())
  })

  it('đang chia sẻ nhưng chưa có dữ liệu cảm biến phụ (hướng/tốc độ/pin/nhãn điểm hẹn null)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ sharing_enabled: true, precision_mode: 'exact' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 's1',
            owner_id: 'u1',
            name: 'Đi cà phê',
            invite_code: 'ABC123',
            meet_lat: 10.77,
            meet_lng: 106.7,
            meet_label: null,
            alert_radius_m: 300,
            expires_at: new Date('2026-08-26T04:00:00Z'),
            ended_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 'u1',
            name: 'An',
            sharing_enabled: true,
            precision_mode: 'exact',
            lat: 10.771,
            lng: 106.701,
            accuracy_m: null,
            heading_deg: null,
            speed_mps: null,
            battery_pct: null,
            updated_at: new Date('2026-08-26T02:59:00Z'),
          },
        ],
      })

    const state = await getSessionState('s1', 'u1')
    expect(state?.meetPoint).toEqual({ lat: 10.77, lng: 106.7, label: undefined })
    expect(state?.members[0]!.position).toEqual({
      lat: 10.771,
      lng: 106.701,
      accuracyM: undefined,
      headingDeg: undefined,
      speedMps: undefined,
      batteryPct: undefined,
    })
  })
})

describe('updateSession — Đợt 2 coverage', () => {
  it('đổi điểm hẹn sang một điểm THẬT (khác với xoá điểm hẹn = null)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: 'u1' }] })
    await updateSession('s1', 'u1', { meetPoint: { lat: 10.77, lng: 106.7, label: 'Cổng chợ' } })
    const call = callsMatching('meet_lat = $2')[0]!
    expect(call[1]).toEqual(['s1', 10.77, 106.7, 'Cổng chợ'])
  })

  it('gia hạn thời gian (extendMinutes) → cập nhật expires_at', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: 'u1' }] })
    await updateSession('s1', 'u1', { extendMinutes: 45 })
    const call = callsMatching('expires_at = greatest')[0]!
    expect(call[1]).toEqual(['s1', '45'])
  })
})

// Audit 2026-10-20, F-001: mã mời mở cửa vào chuyến chia sẻ VỊ TRÍ → sinh bằng node:crypto,
// KHÔNG qua Math.random. Test này ĐỎ trước khi sửa.
describe('randomCode — nguồn ngẫu nhiên an toàn', () => {
  it('mã mời 6 ký tự trong bảng chữ không nhầm lẫn và KHÔNG gọi Math.random', async () => {
    const spy = vi.spyOn(Math, 'random')
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] })
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's-new' }] })
    const r = await createSession('u1', 'Đi chơi', 60)
    expect(r.ok).toBe(true)
    const insert = callsMatching('insert into location.sessions')[0]!
    expect((insert[1] as unknown[])[2]).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

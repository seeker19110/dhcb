// Test /api/admin-stem-review — chặn quyền, validate thân yêu cầu, ghi đè đúng khoá.
//
// KHÔNG mock 4 registry môn học: chúng là dữ liệu thuần, và handler PHẢI tự tra bài thật từ đó
// để tính băm — mock đi là không còn thử được đúng thứ quan trọng nhất (server tự tính băm,
// không tin client).
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
const rateLimitState: { ok: boolean } = { ok: true }
const securityEvents: { type: string; chiTiet: unknown }[] = []
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitState.ok,
  validateAuth: async () => authState.user,
  logSecurityEvent: (type: string, _ip: string, chiTiet: unknown) =>
    securityEvents.push({ type, chiTiet }),
}))
vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId: string | null | undefined) => userId === 'user-1',
}))

import handler from './admin-stem-review.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { TIEU_CHI_DUYET, PHIEN_BAN_TIEU_CHI } from '@dhcb/core-contracts/lessonReview'
import { bamNoiDungBaiHoc } from '@dhcb/core-contracts/lessonReviewHash'
import { BIOLOGY_LESSONS } from '@dhcb/subject-biology/lessons'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()
const tieuChiDat = Object.fromEntries(TIEU_CHI_DUYET.map((k) => [k, true]))

// Bài THẬT trong registry — để chứng minh server tự tra được và tự tính đúng băm.
const baiThat = BIOLOGY_LESSONS.find((b) => b.id === 'sinh12-c1-b1')!
const bamThat = bamNoiDungBaiHoc(baiThat)

const thanHopLe = {
  loai: 'nguoi-duyet',
  lessonId: 'sinh12-c1-b1',
  mon: 'biology',
  nguoiDuyet: 'Cô Lan',
  phienBanTieuChi: PHIEN_BAN_TIEU_CHI,
  tieuChi: tieuChiDat,
}

function req(method: string, body?: unknown, qs = ''): Request {
  return new Request(`http://localhost/api/admin-stem-review${qs}`, {
    method,
    headers: {
      authorization: 'Bearer test',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ rows: [] })
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
  rateLimitState.ok = true
  securityEvents.length = 0
})

describe('chặn quyền', () => {
  it('không có token → 401, KHÔNG chạm DB', async () => {
    authState.user = null
    const res = await handler(req('GET'))
    expect(res.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('token người thường → 403 và có ghi log bảo mật', async () => {
    authState.user = { userId: 'non-admin' }
    for (const method of ['GET', 'POST'] as const) {
      securityEvents.length = 0
      const res = await handler(method === 'GET' ? req('GET') : req('POST', thanHopLe))
      expect(res.status, `${method} phải bị chặn`).toBe(403)
      expect(query).not.toHaveBeenCalled()
      expect(securityEvents.map((e) => e.type)).toContain('ADMIN_ACCESS_DENIED')
    }
  })

  it('quá hạn mức → 429 trước cả khi xác thực', async () => {
    rateLimitState.ok = false
    const res = await handler(req('GET'))
    expect(res.status).toBe(429)
    expect(query).not.toHaveBeenCalled()
  })

  it('method lạ → 405', async () => {
    expect((await handler(req('DELETE'))).status).toBe(405)
  })
})

describe('POST ghi lượt duyệt', () => {
  it('server TỰ TÍNH băm từ registry thật — thân yêu cầu KHÔNG có bamNoiDung', async () => {
    query.mockResolvedValue({
      rows: [
        {
          lesson_id: 'sinh12-c1-b1',
          mon: 'biology',
          loai: 'nguoi-duyet',
          nguoi_duyet: 'Cô Lan',
          phien_ban_tieu_chi: PHIEN_BAN_TIEU_CHI,
          tieu_chi: tieuChiDat,
          bam_noi_dung: bamThat,
          ghi_chu: null,
          cap_nhat_luc: new Date('2026-09-14T00:00:00Z'),
        },
      ],
    })
    const res = await handler(req('POST', thanHopLe))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { luotDuyet: { bamNoiDung: string } }
    expect(body.luotDuyet.bamNoiDung).toBe(bamThat)
    const thamSo = query.mock.calls[0]![1] as unknown[]
    expect(thamSo[7], 'băm phải khớp băm thật tính từ registry').toBe(bamThat)
    expect(thamSo[4], 'user_id phải lấy từ token').toBe('user-1')
  })

  it('TỪ CHỐI nếu client CỐ GỬI bamNoiDung — schema strict không cho trường lạ', async () => {
    const res = await handler(req('POST', { ...thanHopLe, bamNoiDung: 'a'.repeat(64) }))
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('TỪ CHỐI khi lessonId không có trong registry của môn đã khai (dù đúng khuôn id)', async () => {
    const res = await handler(req('POST', { ...thanHopLe, lessonId: 'sinh10-c9-b99' }))
    expect(res.status).toBe(404)
    expect(query).not.toHaveBeenCalled()
  })

  it('TỪ CHỐI khi lessonId không thuộc môn đã khai', async () => {
    const res = await handler(req('POST', { ...thanHopLe, mon: 'chemistry' }))
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('TỪ CHỐI bản ghi người duyệt thiếu chữ ký', async () => {
    for (const truong of ['nguoiDuyet', 'phienBanTieuChi', 'tieuChi'] as const) {
      const thieu: Record<string, unknown> = { ...thanHopLe }
      delete thieu[truong]
      const res = await handler(req('POST', thieu))
      expect(res.status, `thiếu ${truong} mà vẫn ghi được`).toBe(400)
      expect(query).not.toHaveBeenCalled()
    }
  })

  it('TỪ CHỐI lessonId sai khuôn — không cho chuỗi tuỳ ý vào truy vấn', async () => {
    for (const id of ['sinh12', "sinh12-c1-b1'; drop table", '../etc', '']) {
      const res = await handler(req('POST', { ...thanHopLe, lessonId: id }))
      expect(res.status, `lessonId "${id}" phải bị chặn`).toBe(400)
    }
    expect(query).not.toHaveBeenCalled()
  })

  it('bản ghi AI sàng lọc ghi được, KHÔNG tính băm, KHÔNG mang chữ ký người', async () => {
    query.mockResolvedValue({
      rows: [
        {
          lesson_id: 'sinh12-c1-b1',
          mon: 'biology',
          loai: 'ai-sang-loc',
          nguoi_duyet: null,
          phien_ban_tieu_chi: null,
          tieu_chi: null,
          bam_noi_dung: null,
          ghi_chu: 'soCoNghiNgo=2',
          cap_nhat_luc: new Date('2026-09-14T00:00:00Z'),
        },
      ],
    })
    const res = await handler(
      req('POST', {
        loai: 'ai-sang-loc',
        lessonId: 'sinh12-c1-b1',
        mon: 'biology',
        soCoNghiNgo: 2,
      }),
    )
    expect(res.status).toBe(200)
    const thamSo = query.mock.calls[0]![1] as unknown[]
    expect(thamSo[3], 'máy không ký tên thay người').toBeNull()
    expect(thamSo[6], 'máy không điền bộ tiêu chí').toBeNull()
    expect(thamSo[7], 'AI sàng lọc không cần băm').toBeNull()
  })

  it('TỪ CHỐI bản ghi AI kèm chữ ký người — không cho máy tự phong', async () => {
    const res = await handler(
      req('POST', {
        loai: 'ai-sang-loc',
        lessonId: 'sinh12-c1-b1',
        mon: 'biology',
        soCoNghiNgo: 0,
        nguoiDuyet: 'Cô Lan',
      }),
    )
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })
})

describe('GET đọc lượt duyệt', () => {
  it('lọc theo môn bằng THAM SỐ, không nối chuỗi', async () => {
    await handler(req('GET', undefined, '?mon=biology'))
    const [sql, thamSo] = query.mock.calls[0]! as [string, unknown[]]
    expect(sql).toContain('mon = $1')
    expect(thamSo).toEqual(['biology'])
  })

  it('không có tham số thì đọc tất cả', async () => {
    await handler(req('GET'))
    const [sql, thamSo] = query.mock.calls[0]! as [string, unknown[]]
    expect(sql).not.toContain('where')
    expect(thamSo).toEqual([])
  })

  it('TỪ CHỐI tham số truy vấn sai khuôn', async () => {
    const res = await handler(req('GET', undefined, '?mon=vatly'))
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })
})

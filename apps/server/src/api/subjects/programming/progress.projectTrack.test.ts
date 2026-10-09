// /api/programming/progress — chọn DỰ ÁN TRỤC + bước dự án T2/T3 (hạ tầng 2026-10-09).
// Đặc tả: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md.
//
// Tách khỏi progress.test.ts vì cần GIẢ LẬP dữ liệu T2/T3: hôm nay T2/T3 chưa có bước nào, nên
// muốn kiểm "bước T2 được ghi y như bước T1" và "chọn được T2 khi T2 đã mở" thì phải giả một
// bước T2 và cờ mở. Phần còn lại (khoá bậc, chấm lại, SQL) chạy mã thật.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

const query = vi.hoisted(() => vi.fn())
const release = vi.hoisted(() => vi.fn())
vi.mock('@dhcb/core-db/pgPool', () => ({
  getPgPool: () => ({ query, connect: async () => ({ query, release }) }),
}))

// Dự án nào đang "mở" — điều khiển từng ca.
const available = vi.hoisted(() => ({ T1: true, T2: false, T3: false }))
vi.mock('@dhcb/subject-programming/projectTracks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dhcb/subject-programming/projectTracks')>()
  return {
    ...actual,
    isProjectTrackAvailable: (id: 'T1' | 'T2' | 'T3') => available[id],
  }
})

// Một bước T2 GIẢ ở bậc P5 (bậc cao — Free chưa học gì vẫn phải ghi được, như bước T1).
const FAKE_T2_STEP_ID = 't2-p5-s1'
vi.mock('@dhcb/subject-programming/projectSteps', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dhcb/subject-programming/projectSteps')>()
  return {
    ...actual,
    getProjectStep: (id: string) =>
      id === FAKE_T2_STEP_ID ? actual.P1_PROJECT_STEPS[0] : actual.getProjectStep(id),
  }
})

const regrade = vi.hoisted(() => vi.fn())
vi.mock('@dhcb/subject-programming/completionSandboxServer', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@dhcb/subject-programming/completionSandboxServer')>()
  return { ...actual, regradeSubmission: regrade }
})

import handler from './progress.js'

function req(method: string, body?: unknown) {
  return new Request('http://localhost/api/programming/progress', {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

function sqlCalls(): { sql: string; params: unknown[] }[] {
  return query.mock.calls
    .map(([sql, params]) => ({ sql: String(sql), params: (params ?? []) as unknown[] }))
    .filter((c) => !/^(begin|commit|rollback)$/i.test(c.sql.trim()))
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = { userId: 'user-1' }
  available.T1 = true
  available.T2 = false
  available.T3 = false
  query.mockResolvedValue({ rows: [] })
})

describe('POST { projectTrack } — chọn dự án trục', () => {
  it('chưa đăng nhập → 401, không chạm DB', async () => {
    authState.user = null
    expect((await handler(req('POST', { projectTrack: 'T1' }))).status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('dự án đang mở → upsert learner_state đúng user, trả state mới', async () => {
    query.mockResolvedValueOnce({ rows: [{ current_level: 'p3', project_track: 'T1' }] })
    const res = await handler(req('POST', { projectTrack: 'T1' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ok: true,
      state: { currentLevel: 'p3', projectTrack: 'T1' },
    })
    const calls = sqlCalls()
    expect(calls).toHaveLength(1)
    expect(calls[0]!.sql).toContain('insert into programming.learner_state')
    expect(calls[0]!.sql).toContain('on conflict (user_id) do update')
    expect(calls[0]!.params).toEqual(['user-1', 'T1'])
  })

  it('dự án CHƯA có bước nào → 400 kèm mã lỗi, KHÔNG ghi DB', async () => {
    for (const projectTrack of ['T2', 'T3']) {
      vi.clearAllMocks()
      const res = await handler(req('POST', { projectTrack }))
      expect(res.status, projectTrack).toBe(400)
      expect(((await res.json()) as { code: string }).code).toBe('PROJECT_TRACK_NOT_AVAILABLE')
      expect(query, projectTrack).not.toHaveBeenCalled()
    }
  })

  it('T2 đã mở (PR nội dung đã thêm bước) → chọn được', async () => {
    available.T2 = true
    query.mockResolvedValueOnce({ rows: [{ current_level: 'p1', project_track: 'T2' }] })
    const res = await handler(req('POST', { projectTrack: 'T2' }))
    expect(res.status).toBe(200)
    expect(sqlCalls()[0]!.params).toEqual(['user-1', 'T2'])
  })

  it('người mới chưa có dòng learner_state: returning rỗng vẫn trả state hợp lý', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const body = (await (await handler(req('POST', { projectTrack: 'T1' }))).json()) as {
      state: { currentLevel: string; projectTrack: string }
    }
    expect(body.state).toEqual({ currentLevel: 'p1', projectTrack: 'T1' })
  })

  it('mã lạ / trộn với tiến độ bài / thừa trường → 400, KHÔNG ghi DB', async () => {
    for (const body of [
      { projectTrack: 'T4' },
      { projectTrack: 't1' },
      { projectTrack: null },
      { projectTrack: 'T1', lessonId: 'p1-u4-l1', status: 'completed' },
      { projectTrack: 'T1', extra: true },
    ]) {
      vi.clearAllMocks()
      const res = await handler(req('POST', body))
      expect(res.status, JSON.stringify(body)).toBe(400)
      expect(query).not.toHaveBeenCalled()
    }
  })
})

describe('bước dự án T2/T3 — đối xử y như bước T1', () => {
  it('bước T2 có thật ở bậc P5: Free chưa học gì vẫn ghi được (không đi qua khoá bậc), không chấm lại', async () => {
    // Thứ tự query: đọc plan (free) → đọc tiến độ (rỗng) → transaction.
    query
      .mockResolvedValueOnce({ rows: [{ plan: 'free', plan_expires_at: null }] })
      .mockResolvedValueOnce({ rows: [] })
    const res = await handler(req('POST', { lessonId: FAKE_T2_STEP_ID, status: 'completed' }))
    expect(res.status).toBe(200)
    expect(sqlCalls().at(-1)?.params).toEqual(['user-1', FAKE_T2_STEP_ID, 'completed', null])
    expect(regrade).not.toHaveBeenCalled()
  })

  it('bước T1 ở bậc P5 cũng vậy (đối chứng — cùng một luật)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ plan: 'free', plan_expires_at: null }] })
      .mockResolvedValueOnce({ rows: [] })
    const res = await handler(req('POST', { lessonId: 'p5-s1', status: 'completed' }))
    expect(res.status).toBe(200)
  })

  it('bước T2/T3 đúng khuôn nhưng KHÔNG tồn tại → 400, không ghi DB', async () => {
    for (const lessonId of ['t2-p1-s99', 't3-p2-s99']) {
      vi.clearAllMocks()
      const res = await handler(req('POST', { lessonId, status: 'completed' }))
      expect(res.status, lessonId).toBe(400)
      expect(query, lessonId).not.toHaveBeenCalled()
    }
  })

  it('mã sai khuôn (t1-/t4-) → 400 ngay ở schema', async () => {
    for (const lessonId of ['t1-p1-s1', 't4-p1-s1', 't2-p7-s1']) {
      vi.clearAllMocks()
      expect((await handler(req('POST', { lessonId, status: 'completed' }))).status).toBe(400)
      expect(query).not.toHaveBeenCalled()
    }
  })

  it('batch trộn bước T1 và T2 → ghi cả hai trong một transaction', async () => {
    // Có attemptId: tra biên nhận (chưa có) → đọc plan → đọc tiến độ → transaction.
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ plan: 'free', plan_expires_at: null }] })
      .mockResolvedValueOnce({ rows: [] })
    const at = new Date().toISOString()
    const res = await handler(
      req('POST', {
        attemptId: 'attempt-t2-001',
        items: [
          { lessonId: 'p1-s1', status: 'completed', clientUpdatedAt: at },
          { lessonId: FAKE_T2_STEP_ID, status: 'completed', clientUpdatedAt: at },
        ],
      }),
    )
    expect(res.status).toBe(200)
    const written = sqlCalls()
      .filter((c) => c.sql.includes('insert into programming.lesson_progress'))
      .map((c) => c.params[1])
    expect(written).toEqual(['p1-s1', FAKE_T2_STEP_ID])
  })
})

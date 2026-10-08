// api/pvp-arena.test.ts
import { describe, it, expect, vi } from 'vitest'
import handler, { leaderboardName } from './pvp-arena.js'
import { setFeatureState } from '@dhcb/core-db/featureState'

vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn().mockResolvedValue({ userId: 'u-test-123' }),
  getCorsHeaders: vi.fn().mockReturnValue({}),
}))

// [N3] Handler đã chuyển state sang platform.feature_state — mock bằng Map in-memory
// (hành vi giống hệt Map cấp module cũ: state sống suốt file test).
const store = new Map<string, unknown>()
vi.mock('@dhcb/core-db/featureState', () => ({
  getFeatureState: vi.fn(async (u: string, f: string) => store.get(u + '|' + f) ?? null),
  setFeatureState: vi.fn(async (u: string, f: string, st: unknown) => {
    store.set(u + '|' + f, st)
  }),
}))

// pgPool: truy vấn leaderboard đọc từ store; truy vấn tên trả tên test. Ghi lại câu SQL đã chạy
// để test kiểm bảng xếp hạng không đọc cột tên tài khoản.
const executedSql = vi.hoisted(() => [] as string[])
vi.mock('@dhcb/core-db/pgPool', () => ({
  getPgPool: () => ({
    query: vi.fn(async (sql: string) => {
      executedSql.push(sql)
      // Giống Postgres thật (đo bằng PREPARE trên CSDL đã migrate, 2026-10-08): public.profiles
      // khoá theo `id`, KHÔNG có cột `user_id`; bảng users KHÔNG có cột `name` — câu lệnh tham
      // chiếu các cột đó bị từ chối.
      if (/profiles p on p\.user_id/.test(sql)) {
        throw new Error('column p.user_id does not exist')
      }
      if (/\bu\.name\b/.test(sql)) throw new Error('column u.name does not exist')
      if (sql.includes('feature_state')) {
        const rows = [...store.entries()]
          .filter(([k]) => k.endsWith('|pvp_profile'))
          .map(([k, state]) => ({
            user_id: k.split('|')[0],
            state,
            nickname: k.startsWith('u-anon') ? null : 'Player Test',
          }))
        return { rows }
      }
      return { rows: [{ display_name: 'Player Test' }] }
    }),
  }),
}))

describe('api/pvp-arena endpoint', () => {
  it('handles GET request returning user profile and leaderboard', async () => {
    const req = new Request('http://localhost/api/pvp-arena', { method: 'GET' })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.profile.eloRating).toBeDefined()
    expect(data.leaderboard.length).toBeGreaterThan(0)
  })

  it('handles GET leaderboard action specifically', async () => {
    const req = new Request('http://localhost/api/pvp-arena?action=leaderboard', { method: 'GET' })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.leaderboard[0].rank).toBe(1)
  })

  it('handles POST matchmake action and creates match with questions', async () => {
    const req = new Request('http://localhost/api/pvp-arena?action=matchmake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'vocab_speed_duel',
        playerProfile: {
          id: 'u-test-123',
          name: 'Player Test',
          avatar: '🦁',
          eloRating: 1300,
          rankTier: 'gold',
          winStreak: 1,
          totalMatches: 4,
          wins: 3,
          isGhostBot: false,
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.match.matchId).toBeDefined()
    expect(data.match.questions.length).toBe(5)
    expect(data.match.player2.isGhostBot).toBe(true)
  })

  it('handles POST submit_round action and computes points', async () => {
    // 1. First matchmake
    const makeReq = new Request('http://localhost/api/pvp-arena?action=matchmake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'vocab_speed_duel' }),
    })
    const makeRes = await handler(makeReq)
    const makeData = await makeRes.json()
    const matchId = makeData.match.matchId

    // 2. Submit round 0
    const submitReq = new Request('http://localhost/api/pvp-arena?action=submit_round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        roundIndex: 0,
        selectedOption: makeData.match.questions[0].correctIndex,
        responseTimeMs: 1500,
      }),
    })
    const submitRes = await handler(submitReq)
    expect(submitRes.status).toBe(200)
    const submitData = await submitRes.json()
    expect(submitData.success).toBe(true)
    expect(submitData.p1Action.isCorrect).toBe(true)
    expect(submitData.p1Action.pointsEarned).toBeGreaterThan(100)
    expect(submitData.p2Action).toBeDefined()
  })

  it('handles OPTIONS preflight', async () => {
    const req = new Request('http://localhost/api/pvp-arena', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unsupported method', async () => {
    const req = new Request('http://localhost/api/pvp-arena', { method: 'DELETE' })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })

  it('rejects get_match without matchId', async () => {
    const req = new Request('http://localhost/api/pvp-arena?action=get_match', { method: 'GET' })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('404s get_match for unknown matchId', async () => {
    const req = new Request(
      'http://localhost/api/pvp-arena?action=get_match&matchId=does-not-exist',
      { method: 'GET' },
    )
    const res = await handler(req)
    expect(res.status).toBe(404)
  })

  it('finds an existing match via get_match', async () => {
    const makeReq = new Request('http://localhost/api/pvp-arena?action=matchmake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'vocab_speed_duel' }),
    })
    const makeRes = await handler(makeReq)
    const makeData = await makeRes.json()
    const matchId = makeData.match.matchId

    const req = new Request(`http://localhost/api/pvp-arena?action=get_match&matchId=${matchId}`, {
      method: 'GET',
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.match.matchId).toBe(matchId)
  })

  it('rejects submit_round missing required parameters', async () => {
    const req = new Request('http://localhost/api/pvp-arena?action=submit_round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('rejects submit_round for unknown matchId', async () => {
    const req = new Request('http://localhost/api/pvp-arena?action=submit_round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: 'does-not-exist',
        roundIndex: 0,
        selectedOption: 0,
        responseTimeMs: 1000,
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(404)
  })

  it('rejects submit_round with invalid roundIndex', async () => {
    const makeReq = new Request('http://localhost/api/pvp-arena?action=matchmake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'vocab_speed_duel' }),
    })
    const makeRes = await handler(makeReq)
    const makeData = await makeRes.json()
    const matchId = makeData.match.matchId

    const req = new Request('http://localhost/api/pvp-arena?action=submit_round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, roundIndex: 999, selectedOption: 0, responseTimeMs: 1000 }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('completes the match after the final round', async () => {
    const makeReq = new Request('http://localhost/api/pvp-arena?action=matchmake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'vocab_speed_duel' }),
    })
    const makeRes = await handler(makeReq)
    const makeData = await makeRes.json()
    const { matchId, totalRounds, questions } = makeData.match

    let lastData: { isMatchCompleted?: boolean } = {}
    for (let i = 0; i < totalRounds; i++) {
      const submitReq = new Request('http://localhost/api/pvp-arena?action=submit_round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          roundIndex: i,
          selectedOption: questions[i].correctIndex,
          responseTimeMs: 1200,
        }),
      })
      const submitRes = await handler(submitReq)
      lastData = await submitRes.json()
    }
    expect(lastData.isMatchCompleted).toBe(true)
  })

  it('rejects invalid POST action', async () => {
    const req = new Request('http://localhost/api/pvp-arena?action=unknown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('rejects invalid JSON payload on POST', async () => {
    const req = new Request('http://localhost/api/pvp-arena?action=matchmake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid',
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  // ── [N3] Nhánh persistence mới: hoàn tất trận → Elo/hồ sơ cập nhật thật ──
  it('completes a full match and updates stored profile (Elo K=32, wins, streak)', async () => {
    store.clear()
    const makeRes = await handler(
      new Request('http://localhost/api/pvp-arena?action=matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // mode mặc định (nhánh body.mode || ...)
      }),
    )
    const { match } = await makeRes.json()
    let last: { isMatchCompleted?: boolean; match?: { winnerId?: string } } = {}
    for (let i = 0; i < match.totalRounds; i++) {
      const res = await handler(
        new Request('http://localhost/api/pvp-arena?action=submit_round', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: match.matchId,
            roundIndex: i,
            selectedOption: match.questions[i].correctIndex,
            responseTimeMs: 800,
          }),
        }),
      )
      last = await res.json()
    }
    expect(last.isMatchCompleted).toBe(true)
    const profile = store.get('u-test-123|pvp_profile') as {
      eloRating: number
      totalMatches: number
      wins: number
      winStreak: number
    }
    expect(profile.totalMatches).toBe(1)
    // Trả lời đúng 100% + nhanh → thắng Ghost → Elo tăng, streak = 1
    expect(profile.wins).toBe(1)
    expect(profile.winStreak).toBe(1)
    expect(profile.eloRating).not.toBe(1250)
    // Trận đã completed → submit tiếp trả 404 (nhánh match.status === 'completed')
    const again = await handler(
      new Request('http://localhost/api/pvp-arena?action=submit_round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.matchId, roundIndex: 0, selectedOption: 0 }),
      }),
    )
    expect(again.status).toBe(404)
  })

  it('leaderboard handles người chơi mới: winRate 0, thiếu avatar/tên → fallback', async () => {
    store.clear()
    store.set('u-x|pvp_profile', { eloRating: 1300, winStreak: 0, totalMatches: 0, wins: 0 })
    const res = await handler(
      new Request('http://localhost/api/pvp-arena?action=leaderboard', { method: 'GET' }),
    )
    const { leaderboard } = await res.json()
    expect(leaderboard[0].winRate).toBe(0)
    expect(leaderboard[0].avatar).toBe('🦁') // nhánh state.avatar || '🦁'
  })

  it('submit_round với roundIndex vượt số câu → 400 (nhánh Invalid roundIndex)', async () => {
    store.clear()
    const makeRes = await handler(
      new Request('http://localhost/api/pvp-arena?action=matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'vocab_speed_duel' }),
      }),
    )
    const { match } = await makeRes.json()
    const res = await handler(
      new Request('http://localhost/api/pvp-arena?action=submit_round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.matchId, roundIndex: 99, selectedOption: 0 }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('leaderboard fallback "Học viên #<hạng>" khi user chưa đặt biệt danh', async () => {
    store.clear()
    store.set('u-anon|pvp_profile', {
      avatar: '🐧',
      eloRating: 1400,
      winStreak: 2,
      totalMatches: 4,
      wins: 3,
    })
    const res = await handler(
      new Request('http://localhost/api/pvp-arena?action=leaderboard', { method: 'GET' }),
    )
    const { leaderboard } = await res.json()
    expect(leaderboard[0].name).toBe('Học viên #1')
    expect(leaderboard[0].winRate).toBe(75)
  })

  it('CHẶN HỒI QUY 2026-10-08: hồ sơ PvP mang tên THẬT (join profiles theo id, không phải "Học viên")', async () => {
    store.clear()
    const res = await handler(new Request('http://localhost/api/pvp-arena', { method: 'GET' }))
    expect(res.status).toBe(200)
    const data = (await res.json()) as { profile: { name: string } }
    expect(data.profile.name).toBe('Player Test')
  })

  it('CHẶN HỒI QUY 2026-10-08: CSDL lỗi khi ghi trận → 500 có log, KHÔNG phải 400 "Invalid JSON" lộ lỗi pg', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(setFeatureState).mockRejectedValueOnce(
      new Error('connect ECONNREFUSED 10.0.0.5:5432'),
    )
    const res = await handler(
      new Request('http://localhost/api/pvp-arena?action=matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'vocab_speed_duel' }),
      }),
    )
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('ECONNREFUSED')
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('pvp-arena'))
    errorLog.mockRestore()
  })

  it('truy vấn bảng xếp hạng KHÔNG đọc tên tài khoản (users.name) — chỉ biệt danh', async () => {
    executedSql.length = 0
    await handler(
      new Request('http://localhost/api/pvp-arena?action=leaderboard', { method: 'GET' }),
    )
    const leaderboardSql = executedSql.find((sql) => sql.includes('feature_state'))
    expect(leaderboardSql).toBeDefined()
    expect(leaderboardSql).not.toMatch(/u\.name/)
  })
})

describe('leaderboardName', () => {
  it('dùng biệt danh đã cắt khoảng trắng', () => {
    expect(leaderboardName('  Mèo Học Bài ', 3)).toBe('Mèo Học Bài')
  })
  it('chưa có biệt danh, null hoặc chỉ khoảng trắng → "Học viên #<hạng>"', () => {
    expect(leaderboardName(null, 2)).toBe('Học viên #2')
    expect(leaderboardName(undefined, 5)).toBe('Học viên #5')
    expect(leaderboardName('   ', 7)).toBe('Học viên #7')
  })
})

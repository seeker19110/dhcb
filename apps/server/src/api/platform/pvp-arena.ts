// api/pvp-arena.ts — REST handler cho Đấu Trường Đối Kháng 1v1 PvP & Ghost Matchmaking.
//
// [N3, 2026-08-23] Hết in-memory + hardcode: hồ sơ Elo/thắng-thua và trận đấu đang chơi lưu
// ở `platform.feature_state` (per-user — trận PvP là đấu với Ghost bot mô phỏng nên state
// thuộc về đúng 1 người chơi). Elo cập nhật THẬT sau mỗi trận (K=32, `calculateEloDelta`
// trong finalizePvPMatch). Leaderboard là truy vấn thật top Elo từ feature_state (trước đây
// hardcode "Nguyen Hoang Long, Elena Vu…" cho mọi user).
import { jsonResponse, badJsonOrInternalError } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  createPvPMatch,
  finalizePvPMatch,
  simulateGhostAction,
  calculatePoints,
  trailingCorrectStreak,
  getRankTierFromElo,
} from '@dhcb/core-ai/pvpArenaService'
import {
  type PvPMatchState,
  type PvPPlayerProfile,
  type PvPGameMode,
  type PvPRoundAction,
  type PvPLeaderboardEntry,
} from '@dhcb/core-contracts/pvpArena'

const PROFILE_FEATURE = 'pvp_profile'
const MATCH_FEATURE = 'pvp_match'

// Phần hồ sơ được LƯU (không gồm các trường suy ra được như rankTier/name — tính lúc đọc).
interface StoredPvPProfile {
  avatar: string
  eloRating: number
  winStreak: number
  totalMatches: number
  wins: number
}

const DEFAULT_PROFILE: StoredPvPProfile = {
  avatar: '🦁',
  eloRating: 1250,
  winStreak: 0,
  totalMatches: 0,
  wins: 0,
}

// Đọc hồ sơ đã lưu; người chơi mới nhận mặc định (ghi ngay để có mặt trên leaderboard).
async function loadProfile(userId: string): Promise<StoredPvPProfile> {
  const stored = await getFeatureState<StoredPvPProfile>(userId, PROFILE_FEATURE)
  if (stored) return stored
  await setFeatureState(userId, PROFILE_FEATURE, DEFAULT_PROFILE)
  return DEFAULT_PROFILE
}

// Tên hiển thị: ưu tiên biệt danh, rồi tên tài khoản, rồi nhãn chung — cả hai đều nằm trên
// public.profiles (khoá `id` = users.id; bảng users KHÔNG có cột tên).
// [2026-10-08] Bản cũ join `profiles.user_id` và đọc `users.name` — hai cột KHÔNG tồn tại (đo
// bằng PREPARE trên CSDL đã migrate) nên câu lệnh lỗi ở MỌI lần gọi, catch rỗng nuốt mất → ai
// cũng là "Học viên". Giữ fallback (thiếu tên không đáng chặn trận đấu) nhưng phải ghi log.
async function displayName(userId: string): Promise<string> {
  try {
    const pool = getPgPool()
    const { rows } = await pool.query<{ display_name: string | null }>(
      `select coalesce(p.nickname, p.name) as display_name
         from public.profiles p
        where p.id = $1`,
      [userId],
    )
    return rows[0]?.display_name || 'Học viên'
  } catch (err) {
    console.warn(
      '[pvp-arena] không đọc được tên hiển thị → dùng nhãn chung:',
      err instanceof Error ? err.message : err,
    )
    return 'Học viên'
  }
}

function toApiProfile(userId: string, name: string, p: StoredPvPProfile): PvPPlayerProfile {
  return {
    id: userId,
    name,
    avatar: p.avatar,
    eloRating: p.eloRating,
    rankTier: getRankTierFromElo(p.eloRating),
    winStreak: p.winStreak,
    totalMatches: p.totalMatches,
    wins: p.wins,
    isGhostBot: false,
  }
}

// Tên trên bảng xếp hạng (người khác nhìn thấy): CHỈ biệt danh người dùng tự đặt. Không bao giờ
// dùng `users.name` — tên tài khoản thường là họ tên đầy đủ, người dùng chưa đồng ý công khai
// (chủ dự án chốt 2026-10-02). Chưa có biệt danh → "Học viên #<hạng>".
export function leaderboardName(nickname: string | null | undefined, rank: number): string {
  const trimmed = nickname?.trim()
  return trimmed ? trimmed : `Học viên #${rank}`
}

// Leaderboard THẬT: top 10 Elo từ feature_state (mọi người chơi từng vào PvP đều có dòng).
async function realLeaderboard(): Promise<PvPLeaderboardEntry[]> {
  const pool = getPgPool()
  const { rows } = await pool.query<{
    user_id: string
    state: StoredPvPProfile
    nickname: string | null
  }>(
    `select fs.user_id, fs.state, p.nickname
       from platform.feature_state fs
       join public.users u on u.id = fs.user_id
       left join public.profiles p on p.id = fs.user_id
      where fs.feature = $1
      order by (fs.state->>'eloRating')::int desc, fs.updated_at asc
      limit 10`,
    [PROFILE_FEATURE],
  )
  return rows.map((r, i) => ({
    rank: i + 1,
    playerId: r.user_id,
    name: leaderboardName(r.nickname, i + 1),
    avatar: r.state.avatar || '🦁',
    eloRating: r.state.eloRating,
    rankTier: getRankTierFromElo(r.state.eloRating),
    winStreak: r.state.winStreak,
    winRate:
      r.state.totalMatches > 0 ? Math.round((r.state.wins / r.state.totalMatches) * 1000) / 10 : 0,
  }))
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  // Bắt buộc đăng nhập — trước đây fallback 'guest-learner' khiến mọi khách vãng lai dùng
  // chung một hồ sơ PvP (vá 2026-08-23, đề xuất N1 mục B1).
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  const userId = auth.userId

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    if (action === 'leaderboard') {
      const leaderboard = await realLeaderboard()
      return jsonResponse({ success: true, leaderboard }, 200)
    }

    if (action === 'get_match') {
      const matchId = url.searchParams.get('matchId')
      if (!matchId) return jsonResponse({ error: 'Missing matchId' }, 400)
      const match = await getFeatureState<PvPMatchState>(userId, MATCH_FEATURE)
      if (!match || match.matchId !== matchId) {
        return jsonResponse({ error: 'Match not found' }, 404)
      }
      return jsonResponse({ success: true, match }, 200)
    }

    // Mặc định: hồ sơ PvP thật của user + leaderboard thật.
    // loadProfile chạy TRƯỚC leaderboard: lần đầu vào PvP hồ sơ mặc định được ghi xong
    // thì leaderboard mới đọc — người chơi mới thấy ngay mình trên bảng xếp hạng.
    const stored = await loadProfile(userId)
    const [name, leaderboard] = await Promise.all([displayName(userId), realLeaderboard()])
    return jsonResponse(
      { success: true, profile: toApiProfile(userId, name, stored), leaderboard },
      200,
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'matchmake') {
        const mode: PvPGameMode = body.mode || 'vocab_speed_duel'
        // Server-authoritative: hồ sơ lấy từ DB, KHÔNG tin body.playerProfile (client có thể
        // tự khai Elo/thắng-thua tuỳ ý).
        const [stored, name] = await Promise.all([loadProfile(userId), displayName(userId)])
        const match = createPvPMatch(toApiProfile(userId, name, stored), mode)
        await setFeatureState(userId, MATCH_FEATURE, match)
        return jsonResponse({ success: true, match }, 200)
      }

      if (action === 'submit_round') {
        const { matchId, roundIndex, selectedOption, responseTimeMs } = body
        if (!matchId || roundIndex === undefined || selectedOption === undefined) {
          return jsonResponse({ error: 'Missing required parameters' }, 400)
        }

        let match = await getFeatureState<PvPMatchState>(userId, MATCH_FEATURE)
        if (!match || match.matchId !== matchId || match.status === 'completed') {
          return jsonResponse({ error: 'Match not found or expired' }, 404)
        }

        const currentQ = match.questions[roundIndex]
        if (!currentQ) {
          return jsonResponse({ error: 'Invalid roundIndex' }, 400)
        }

        const isCorrect = selectedOption === currentQ.correctIndex
        // Hệ số nhân dùng chuỗi đúng liên tiếp TRONG TRẬN của chính người chơi — KHÔNG dùng
        // `match.player1.winStreak` (chuỗi THẮNG TRẬN của cả sự nghiệp, người mới luôn = 0).
        // Trước đây người chơi nhận hệ số 1,0 còn Ghost nhận 1,2 vì được truyền cứng streak = 1,
        // nên người mới trả lời đúng 100% và nhanh hơn vẫn thua 2,25% số trận (audit F2).
        const p1Streak = trailingCorrectStreak(match.actions, match.player1.id)
        const p1Points = calculatePoints(
          isCorrect,
          responseTimeMs,
          currentQ.timeLimitSec,
          isCorrect ? p1Streak + 1 : 0,
        )

        const p1Action: PvPRoundAction = {
          roundIndex,
          playerId: match.player1.id,
          selectedOption,
          responseTimeMs,
          isCorrect,
          pointsEarned: p1Points,
        }

        // Mô phỏng lượt của đối thủ Ghost Rival — cũng dùng chuỗi TRONG TRẬN của chính nó,
        // để hai bên chịu đúng một luật tính điểm.
        const p2Action = simulateGhostAction(
          currentQ,
          match.player2,
          roundIndex,
          trailingCorrectStreak(match.actions, match.player2.id),
        )

        match.scores.player1Score += p1Points
        match.scores.player2Score += p2Action.pointsEarned
        match.actions.push(p1Action, p2Action)
        match.currentRound = roundIndex + 1

        let isMatchCompleted = false
        if (match.currentRound >= match.totalRounds) {
          match = finalizePvPMatch(match)
          isMatchCompleted = true

          // Cập nhật hồ sơ THẬT sau trận: Elo (K=32), số trận, thắng, chuỗi thắng.
          const stored = await loadProfile(userId)
          const won = match.winnerId === userId
          const updated: StoredPvPProfile = {
            ...stored,
            eloRating: Math.max(0, stored.eloRating + (match.eloChanges?.player1Delta ?? 0)),
            totalMatches: stored.totalMatches + 1,
            wins: stored.wins + (won ? 1 : 0),
            winStreak: won ? stored.winStreak + 1 : 0,
          }
          await setFeatureState(userId, PROFILE_FEATURE, updated)
        } else {
          match.updatedAt = new Date().toISOString()
        }

        await setFeatureState(userId, MATCH_FEATURE, match)

        return jsonResponse(
          {
            success: true,
            p1Action,
            p2Action,
            match,
            isMatchCompleted,
          },
          200,
        )
      }

      return jsonResponse({ error: 'Invalid action parameter' }, 400)
    } catch (err) {
      return badJsonOrInternalError(err, 'pvp-arena')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}

// packages/core-ai/pvpArenaService.test.ts
import { describe, it, expect } from 'vitest'
import {
  getRankTierFromElo,
  calculateEloDelta,
  generatePvPQuestions,
  matchmakeGhostRival,
  calculatePoints,
  simulateGhostAction,
  createPvPMatch,
  finalizePvPMatch,
  trailingCorrectStreak,
  GHOST_RIVALS,
} from './pvpArenaService.js'
import { type PvPPlayerProfile } from '@dhcb/core-contracts/pvpArena'

describe('pvpArenaService (1v1 PvP & Ghost Matchmaking Engine)', () => {
  it('maps elo ratings to correct rank tiers', () => {
    expect(getRankTierFromElo(950)).toBe('bronze')
    expect(getRankTierFromElo(1150)).toBe('silver')
    expect(getRankTierFromElo(1450)).toBe('gold')
    expect(getRankTierFromElo(1750)).toBe('platinum')
    expect(getRankTierFromElo(2050)).toBe('diamond')
    expect(getRankTierFromElo(2300)).toBe('master')
  })

  it('calculates Elo deltas accurately for win/loss/draw', () => {
    const deltaWin = calculateEloDelta(1200, 1200, 'win')
    expect(deltaWin).toBe(16)

    const deltaLoss = calculateEloDelta(1200, 1200, 'loss')
    expect(deltaLoss).toBe(-16)

    // Higher elo player beating lower elo player gains less elo
    const deltaFavored = calculateEloDelta(1600, 1200, 'win')
    expect(deltaFavored).toBeLessThan(16)
    expect(deltaFavored).toBeGreaterThanOrEqual(1)

    // Lower elo player beating higher elo player gains massive elo
    const deltaUnderdog = calculateEloDelta(1200, 1600, 'win')
    expect(deltaUnderdog).toBeGreaterThan(16)
  })

  it('generates questions for specified mode', () => {
    const vocabQuestions = generatePvPQuestions('vocab_speed_duel', 3)
    expect(vocabQuestions.length).toBe(3)
    expect(vocabQuestions[0]!.options.length).toBeGreaterThanOrEqual(2)

    const grammarQuestions = generatePvPQuestions('grammar_clash', 2)
    expect(grammarQuestions.length).toBe(2)
  })

  it('matchmakes a ghost rival close to player elo', () => {
    const player: PvPPlayerProfile = {
      id: 'p-1',
      name: 'Tester',
      avatar: '🌟',
      eloRating: 1500,
      rankTier: 'gold',
      winStreak: 2,
      totalMatches: 10,
      wins: 7,
      isGhostBot: false,
    }
    const rival = matchmakeGhostRival(player, 'vocab_speed_duel')
    expect(rival.isGhostBot).toBe(true)
    expect(Math.abs(rival.eloRating - player.eloRating)).toBeLessThanOrEqual(50)
  })

  // Changelog 0482: đấu trường CHỈ có đối thủ AI. Tên kiểu người thật + cờ quốc gia ("Elena Oxford
  // 🇬🇧") từng khiến người học tưởng đấu với người; số trận/thắng của bot là số bịa.
  it('mọi đối thủ AI đều mang tên bot rõ ràng, không cờ quốc gia, không lịch sử bịa', () => {
    // Cờ quốc gia = cặp ký tự "regional indicator" U+1F1E6..U+1F1FF.
    const CO_QUOC_GIA = /[\u{1F1E6}-\u{1F1FF}]/u
    expect(GHOST_RIVALS.length).toBeGreaterThan(0)
    for (const r of GHOST_RIVALS) {
      expect(r.name).toMatch(/^Bot /)
      // Dài hơn thì bị cắt ("Bot Phượn…") ở ô đối thủ màn 390px — đã thấy ở ảnh chụp Tầng 8b.
      expect([...r.name].length).toBeLessThanOrEqual(12)
      expect(r.avatar).not.toMatch(CO_QUOC_GIA)
    }
    const player: PvPPlayerProfile = {
      id: 'p-1',
      name: 'Tester',
      avatar: '🌟',
      eloRating: 1200,
      rankTier: 'silver',
      winStreak: 0,
      totalMatches: 0,
      wins: 0,
      isGhostBot: false,
    }
    for (let i = 0; i < 30; i++) {
      const rival = matchmakeGhostRival(player)
      expect(rival.name).toMatch(/^Bot /)
      expect(rival.totalMatches).toBe(0)
      expect(rival.wins).toBe(0)
      expect(rival.winStreak).toBe(0)
    }
  })

  it('calculates round points factoring speed and streak', () => {
    // Incorrect answer gives 0
    expect(calculatePoints(false, 1000, 5, 0)).toBe(0)

    // Perfect instant answer with streak 0
    const perfectPoints = calculatePoints(true, 0, 5, 0)
    expect(perfectPoints).toBe(200) // 100 base + 100 speed

    // Answer with remaining time
    const halfTimePoints = calculatePoints(true, 2500, 5, 0)
    expect(halfTimePoints).toBe(150) // 100 base + 50 speed

    // Multiplier with streak = 3
    const streakPoints = calculatePoints(true, 0, 5, 3)
    expect(streakPoints).toBe(260) // 200 * 1.3
  })

  it('simulates realistic ghost action', () => {
    const question = generatePvPQuestions('vocab_speed_duel', 1)[0]!
    const rival: PvPPlayerProfile = {
      id: 'bot-1',
      name: 'Cyber Bot',
      avatar: '🤖',
      eloRating: 1400,
      rankTier: 'gold',
      winStreak: 1,
      totalMatches: 50,
      wins: 30,
      isGhostBot: true,
    }
    const action = simulateGhostAction(question, rival, 0, 1)
    expect(action.playerId).toBe('bot-1')
    expect(action.responseTimeMs).toBeGreaterThan(0)
    expect(typeof action.isCorrect).toBe('boolean')
  })

  it('creates and finalizes a complete match flow', () => {
    const player: PvPPlayerProfile = {
      id: 'p-1',
      name: 'Player 1',
      avatar: '🦁',
      eloRating: 1300,
      rankTier: 'gold',
      winStreak: 0,
      totalMatches: 5,
      wins: 3,
      isGhostBot: false,
    }
    const match = createPvPMatch(player, 'vocab_speed_duel')
    expect(match.status).toBe('in_progress')
    expect(match.questions.length).toBe(5)

    // Simulate match completion
    match.scores.player1Score = 650
    match.scores.player2Score = 400

    const finalMatch = finalizePvPMatch(match)
    expect(finalMatch.status).toBe('completed')
    expect(finalMatch.winnerId).toBe('p-1')
    expect(finalMatch.eloChanges?.player1Delta).toBeGreaterThan(0)
    expect(finalMatch.rewardExp).toBe(120)
  })
})

describe('trailingCorrectStreak (vá F2 — chuỗi đúng liên tiếp TRONG TRẬN)', () => {
  const act = (playerId: string, roundIndex: number, isCorrect: boolean) => ({
    roundIndex,
    playerId,
    selectedOption: 0,
    responseTimeMs: 800,
    isCorrect,
    pointsEarned: isCorrect ? 100 : 0,
  })

  it('chưa đánh lượt nào → 0', () => {
    expect(trailingCorrectStreak([], 'p1')).toBe(0)
  })

  it('đếm chuỗi đúng liên tiếp tính NGƯỢC từ lượt gần nhất', () => {
    const actions = [act('p1', 0, true), act('p1', 1, true), act('p1', 2, true)]
    expect(trailingCorrectStreak(actions, 'p1')).toBe(3)
  })

  it('gặp lượt SAI là dừng — không đếm tiếp phần trước đó', () => {
    const actions = [act('p1', 0, true), act('p1', 1, false), act('p1', 2, true)]
    expect(trailingCorrectStreak(actions, 'p1')).toBe(1)
  })

  it('lượt sai ở cuối → chuỗi về 0', () => {
    const actions = [act('p1', 0, true), act('p1', 1, true), act('p1', 2, false)]
    expect(trailingCorrectStreak(actions, 'p1')).toBe(0)
  })

  it('BỎ QUA lượt của người khác — hai bên đếm chuỗi độc lập', () => {
    // Lượt xen kẽ như trận thật: p1 đúng hết, ghost sai giữa chừng.
    const actions = [
      act('p1', 0, true),
      act('ghost', 0, true),
      act('p1', 1, true),
      act('ghost', 1, false),
      act('p1', 2, true),
      act('ghost', 2, true),
    ]
    expect(trailingCorrectStreak(actions, 'p1')).toBe(3)
    expect(trailingCorrectStreak(actions, 'ghost')).toBe(1)
  })

  it('người chơi lạ (chưa có lượt nào trong danh sách) → 0', () => {
    expect(trailingCorrectStreak([act('p1', 0, true)], 'khong-ton-tai')).toBe(0)
  })

  // Bất biến bảo vệ chính lỗi F2: hai bên cùng chuỗi thì bên TRẢ LỜI NHANH HƠN phải được
  // điểm cao hơn. Trước khi vá, Ghost được hệ số 1,2 còn người mới 1,0 nên bên chậm hơn vẫn
  // có thể thắng.
  it('cùng chuỗi đúng → ai nhanh hơn người đó điểm cao hơn', () => {
    for (const streak of [0, 1, 2, 3, 4, 5]) {
      const nhanh = calculatePoints(true, 800, 15, streak + 1)
      const cham = calculatePoints(true, 3600, 15, streak + 1)
      expect(nhanh).toBeGreaterThan(cham)
    }
  })
})

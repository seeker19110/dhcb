// packages/core-ai/pvpArenaService.ts — Động cơ Đấu Trường Đối Kháng 1v1 PvP & Ghost Matchmaking.
import {
  type PvPGameMode,
  type PvPRankTier,
  type PvPPlayerProfile,
  type PvPQuestionItem,
  type PvPRoundAction,
  type PvPMatchState,
} from '@dhcb/core-contracts/pvpArena'
import { shuffle } from '@dhcb/core-contracts/shuffle'

// Bảng câu hỏi mẫu chất lượng cao phân chia theo chế độ đấu
const QUESTION_BANK: Record<PvPGameMode, PvPQuestionItem[]> = {
  vocab_speed_duel: [
    {
      id: 'v-01',
      prompt: 'Từ đồng nghĩa với "Eloquent" là gì?',
      subPrompt: 'Choose the closest synonym for "Eloquent".',
      options: ['Articulate', 'Hesitant', 'Ambiguous', 'Hostile'],
      correctIndex: 0,
      explanation: '"Eloquent" và "Articulate" đều chỉ khả năng diễn đạt lưu loát, hùng hồn.',
      timeLimitSec: 5,
      cefrLevel: 'C1',
    },
    {
      id: 'v-02',
      prompt: 'Từ trái nghĩa với "Meticulous" là gì?',
      subPrompt: 'Choose the antonym for "Meticulous".',
      options: ['Thorough', 'Careless', 'Punctual', 'Pragmatic'],
      correctIndex: 1,
      explanation: '"Meticulous" là tỉ mỉ, cẩn trọng; trái nghĩa là "Careless" (bất cẩn).',
      timeLimitSec: 5,
      cefrLevel: 'B2',
    },
    {
      id: 'v-03',
      prompt: 'Điền từ thích hợp vào cụm: "Take something for ______"',
      subPrompt: 'Co coi cái gì là đương nhiên/mặc định.',
      options: ['granted', 'given', 'true', 'sure'],
      correctIndex: 0,
      explanation:
        '"Take something for granted" là thành ngữ cố định nghĩa là coi điều gì là hiển nhiên.',
      timeLimitSec: 5,
      cefrLevel: 'B2',
    },
    {
      id: 'v-04',
      prompt: 'Từ nào mang nghĩa "Tạm thời, chóng tàn"?',
      subPrompt: 'Which word means lasting for a very short time?',
      options: ['Permanent', 'Ephemeral', 'Resilient', 'Ubiquitous'],
      correctIndex: 1,
      explanation: '"Ephemeral" (C2) nghĩa là phù du, chỉ tồn tại trong thời gian ngắn.',
      timeLimitSec: 5,
      cefrLevel: 'C2',
    },
    {
      id: 'v-05',
      prompt: 'Thành ngữ "Cut corners" có nghĩa là gì?',
      subPrompt: 'What does "cut corners" mean?',
      options: ['Làm tắt để tiết kiệm', 'Cắt giấy thủ công', 'Rẽ ở góc đường', 'Bỏ cuộc sớm'],
      correctIndex: 0,
      explanation:
        '"Cut corners" nghĩa là làm ẩu/đốt cháy giai đoạn để tiết kiệm thời gian hoặc tiền bạc.',
      timeLimitSec: 5,
      cefrLevel: 'B1',
    },
    {
      id: 'v-06',
      prompt: 'Từ đồng nghĩa với "Pragmatic" là gì?',
      subPrompt: 'Choose the synonym for "Pragmatic".',
      options: ['Idealistic', 'Practical', 'Dogmatic', 'Theoretical'],
      correctIndex: 1,
      explanation: '"Pragmatic" nghĩa là thực tế, thực dụng, đồng nghĩa với "Practical".',
      timeLimitSec: 5,
      cefrLevel: 'C1',
    },
  ],
  grammar_clash: [
    {
      id: 'g-01',
      prompt: 'Tìm lỗi sai: "Neither the teacher nor the students _____ present."',
      subPrompt: 'Quy tắc hòa hợp chủ vị với "Neither... nor...".',
      options: ['were', 'was', 'is', 'has been'],
      correctIndex: 0,
      explanation:
        'Với "Neither... nor...", động từ chia theo chủ ngữ gần nhất ("the students" -> "were").',
      timeLimitSec: 8,
      cefrLevel: 'B2',
    },
    {
      id: 'g-02',
      prompt: 'Chọn câu đúng: Câu điều kiện loại 3 hỗn hợp.',
      subPrompt: 'If he _____ harder in the past, he _____ a manager now.',
      options: [
        'had worked / would be',
        'worked / would have been',
        'works / is',
        'had worked / would have been',
      ],
      correctIndex: 0,
      explanation: 'Điều kiện quá khứ ("had worked") dẫn đến kết quả ở hiện tại ("would be").',
      timeLimitSec: 8,
      cefrLevel: 'C1',
    },
    {
      id: 'g-03',
      prompt: 'Chọn cấu trúc đảo ngữ đúng: "Rarely _____ such a mistake."',
      subPrompt: 'Inversion after negative adverb "Rarely".',
      options: ['did he make', 'he made', 'he has made', 'he makes'],
      correctIndex: 0,
      explanation: 'Đảo trợ động từ lên trước chủ ngữ sau trạng từ phủ định: "Rarely did he make".',
      timeLimitSec: 8,
      cefrLevel: 'C1',
    },
    {
      id: 'g-04',
      prompt: 'Chọn dạng đúng: "I look forward to _____ you soon."',
      subPrompt: 'Gerund after preposition.',
      options: ['seeing', 'see', 'saw', 'be seen'],
      correctIndex: 0,
      explanation: '"Look forward to + V-ing" (to ở đây là giới từ).',
      timeLimitSec: 6,
      cefrLevel: 'B1',
    },
    {
      id: 'g-05',
      prompt: 'Dạng giả định: "It is essential that everyone _____ on time."',
      subPrompt: 'Subjunctive mood with "essential".',
      options: ['be', 'is', 'are', 'was'],
      correctIndex: 0,
      explanation:
        'Cấu trúc giả định thức: "It is essential that + S + (should) + V nguyên thể (be)".',
      timeLimitSec: 8,
      cefrLevel: 'C1',
    },
  ],
  toulmin_showdown: [
    {
      id: 't-01',
      prompt: 'Luận điểm: "AI sẽ thay thế giáo viên hoàn toàn." - Phản biện sắc bén nhất là:',
      subPrompt: 'Identify the strongest Socratic Rebuttal.',
      options: [
        'AI thiếu khả năng thấu cảm và truyền cảm hứng cá nhân hóa sâu sắc.',
        'AI quá đắt đỏ để phổ cập.',
        'Giáo viên có nhiều thời gian hơn AI.',
        'Học sinh không thích nhìn vào màn hình máy tính.',
      ],
      correctIndex: 0,
      explanation:
        'Sự thấu cảm con người và khả năng kết nối cảm xúc là ranh giới AI chưa thể thay thế hoàn toàn.',
      timeLimitSec: 10,
      cefrLevel: 'B2',
    },
    {
      id: 't-02',
      prompt:
        'Ngụy biện nào trong câu: "Nếu cho phép học sinh dùng điện thoại, toàn bộ trường học sẽ sụp đổ"?',
      subPrompt: 'Identify the logical fallacy.',
      options: [
        'Slippery Slope (Dốc trượt)',
        'Ad Hominem (Công kích cá nhân)',
        'Strawman (Người rơm)',
        'Circular Reasoning (Vòng vo)',
      ],
      correctIndex: 0,
      explanation:
        '"Slippery Slope" phóng đại một sự việc nhỏ dẫn tới hậu quả thảm họa không có căn cứ.',
      timeLimitSec: 8,
      cefrLevel: 'C1',
    },
    {
      id: 't-03',
      prompt:
        'Thành tố nào trong mô hình Toulmin đóng vai trò cầu nối logic giữa Dữ liệu và Kết luận?',
      subPrompt: 'Which element connects Claim and Data?',
      options: [
        'Warrant (Bảo chứng)',
        'Backing (Hậu thuẫn)',
        'Rebuttal (Phản bác)',
        'Qualifier (Từ hạn định)',
      ],
      correctIndex: 0,
      explanation:
        '"Warrant" là nguyên lý/tiền đề logic liên kết bằng chứng (Data) tới luận điểm (Claim).',
      timeLimitSec: 8,
      cefrLevel: 'C2',
    },
    {
      id: 't-04',
      prompt:
        'Để phản biện luận điểm "Học đại học là con đường duy nhất thành công", bằng chứng nào tốt nhất?',
      subPrompt: 'Select empirical counter-evidence.',
      options: [
        'Dữ liệu về các chuyên gia tự học và thợ kỹ thuật lành nghề có thu nhập cao.',
        'Ý kiến cá nhân của một người bỏ học.',
        'Đại học rất tốn tiền.',
        'Không có bài kiểm tra nào hoàn hảo.',
      ],
      correctIndex: 0,
      explanation:
        'Bằng chứng thực chứng định lượng (Empirical Data) là vũ khí phản biện Toulmin mạnh nhất.',
      timeLimitSec: 10,
      cefrLevel: 'B2',
    },
  ],
}

// Đối thủ AI ("ghost rival") — đấu trường KHÔNG có người thật nào. Tên PHẢI cho thấy đây là
// bot (chủ dự án chốt 2026-10-02, changelog 0482): bản trước dùng tên kiểu người thật + cờ quốc
// gia ("Elena Oxford 🇬🇧", "Minh Cambridge") kèm số trận/thắng bịa, người học tưởng đang đấu với
// người. Tên giữ ≤ 12 ký tự để không bị cắt ở ô đối thủ màn 390px. Test
// `pvpArenaService.test.ts` canh luật này.
export const GHOST_RIVALS: ReadonlyArray<Pick<PvPPlayerProfile, 'name' | 'avatar'>> = [
  { name: 'Bot Tutor', avatar: '🤖' },
  { name: 'Bot Oxford', avatar: '📘' },
  { name: 'Bot Ưng', avatar: '🦅' },
  { name: 'Bot Chớp', avatar: '⚡' },
  { name: 'Bot Nova', avatar: '🌟' },
  { name: 'Bot Rồng', avatar: '🐉' },
]

export function getRankTierFromElo(elo: number): PvPRankTier {
  if (elo < 1100) return 'bronze'
  if (elo < 1300) return 'silver'
  if (elo < 1600) return 'gold'
  if (elo < 1900) return 'platinum'
  if (elo < 2200) return 'diamond'
  return 'master'
}

export function calculateEloDelta(
  playerElo: number,
  opponentElo: number,
  outcome: 'win' | 'loss' | 'draw',
  kFactor = 32,
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
  let actualScore = 0.5
  if (outcome === 'win') actualScore = 1
  if (outcome === 'loss') actualScore = 0

  const delta = Math.round(kFactor * (actualScore - expectedScore))
  // Đảm bảo thắng được tối thiểu +1 elo, thua bị trừ tối thiểu -1 elo
  if (outcome === 'win' && delta <= 0) return 1
  if (outcome === 'loss' && delta >= 0) return -1
  return delta
}

export function generatePvPQuestions(mode: PvPGameMode, count = 5): PvPQuestionItem[] {
  const pool = QUESTION_BANK[mode] || QUESTION_BANK.vocab_speed_duel
  // Trộn ngẫu nhiên câu hỏi
  const shuffled = shuffle(pool)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function matchmakeGhostRival(
  playerProfile: PvPPlayerProfile,
  mode: PvPGameMode = 'vocab_speed_duel',
): PvPPlayerProfile {
  void mode
  const randomRival =
    GHOST_RIVALS[Math.floor(Math.random() * GHOST_RIVALS.length)] ?? GHOST_RIVALS[0]!
  // Tạo Elo dao động trong khoảng +- 35 quanh Elo người chơi
  const eloOffset = Math.floor(Math.random() * 71) - 35
  const rivalElo = Math.max(800, playerProfile.eloRating + eloOffset)

  return {
    id: `ghost-rival-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: randomRival.name,
    avatar: randomRival.avatar,
    eloRating: rivalElo,
    rankTier: getRankTierFromElo(rivalElo),
    // Bot không có lịch sử thi đấu — để 0 thay vì bịa số trận/thắng/chuỗi.
    winStreak: 0,
    totalMatches: 0,
    wins: 0,
    isGhostBot: true,
  }
}

/**
 * Chuỗi trả lời ĐÚNG LIÊN TIẾP TRONG TRẬN của một người chơi, tính từ lượt gần nhất trở về trước
 * (gặp lượt sai là dừng). Đây mới là con số `calculatePoints` cần ở tham số `streak` — "chuỗi
 * đúng liên tiếp", chứ KHÔNG phải `winStreak` trong hồ sơ (chuỗi THẮNG TRẬN của cả sự nghiệp).
 *
 * VÌ SAO CÓ HÀM NÀY (audit 2026-08-24, phát hiện F2): handler trước đây truyền
 * `match.player1.winStreak` cho người chơi nhưng truyền hằng số `1` cho Ghost. Người mới có
 * `winStreak = 0` → hệ số 1,0; Ghost luôn được +1 rồi thành streak 2 → hệ số 1,2. Kết quả: người
 * mới trả lời ĐÚNG 100% và nhanh hơn hẳn vẫn thua/hoà 2,25% số trận (đo 200.000 trận) — vừa là
 * bất công với người chơi, vừa làm test `pvp-arena` đỏ ngẫu nhiên.
 */
export function trailingCorrectStreak(
  actions: readonly PvPRoundAction[],
  playerId: string,
): number {
  let streak = 0
  for (let i = actions.length - 1; i >= 0; i--) {
    const a = actions[i]
    if (!a || a.playerId !== playerId) continue
    if (!a.isCorrect) break
    streak++
  }
  return streak
}

export function calculatePoints(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitSec: number,
  streak = 0,
): number {
  if (!isCorrect) return 0
  const basePoints = 100
  const totalMs = timeLimitSec * 1000
  const timeLeftMs = Math.max(0, totalMs - responseTimeMs)
  const speedBonus = Math.round(100 * (timeLeftMs / totalMs))
  const streakMultiplier = 1 + Math.min(5, streak) * 0.1 // Max +50% với chuỗi đúng liên tiếp
  return Math.round((basePoints + speedBonus) * streakMultiplier)
}

export function simulateGhostAction(
  question: PvPQuestionItem,
  rival: PvPPlayerProfile,
  roundIndex: number,
  currentStreak = 0,
): PvPRoundAction {
  // Xác suất trả lời đúng phụ thuộc vào Elo của bot
  const accuracyProb = Math.min(0.95, Math.max(0.45, 0.5 + (rival.eloRating - 1000) / 2500))
  const isCorrect = Math.random() < accuracyProb

  const selectedOption = isCorrect
    ? question.correctIndex
    : (question.correctIndex + 1 + Math.floor(Math.random() * (question.options.length - 1))) %
      question.options.length

  // Thời gian phản xạ thực tế (1.4s đến 3.8s)
  const baseTime = 1400 + Math.floor(Math.random() * 2200)
  const responseTimeMs = Math.min(question.timeLimitSec * 1000 - 200, baseTime)
  const points = calculatePoints(
    isCorrect,
    responseTimeMs,
    question.timeLimitSec,
    isCorrect ? currentStreak + 1 : 0,
  )

  return {
    roundIndex,
    playerId: rival.id,
    selectedOption,
    responseTimeMs,
    isCorrect,
    pointsEarned: points,
  }
}

export function createPvPMatch(
  player: PvPPlayerProfile,
  mode: PvPGameMode,
  rival?: PvPPlayerProfile,
): PvPMatchState {
  const opponent = rival || matchmakeGhostRival(player, mode)
  const questions = generatePvPQuestions(mode, 5)
  const now = new Date().toISOString()

  return {
    matchId: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    mode,
    player1: player,
    player2: opponent,
    questions,
    currentRound: 0,
    totalRounds: questions.length,
    scores: {
      player1Score: 0,
      player2Score: 0,
    },
    actions: [],
    status: 'in_progress',
    winnerId: null,
    rewardExp: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function finalizePvPMatch(match: PvPMatchState): PvPMatchState {
  const p1Score = match.scores.player1Score
  const p2Score = match.scores.player2Score

  let winnerId: string | null = null
  let p1Outcome: 'win' | 'loss' | 'draw' = 'draw'

  if (p1Score > p2Score) {
    winnerId = match.player1.id
    p1Outcome = 'win'
  } else if (p2Score > p1Score) {
    winnerId = match.player2.id
    p1Outcome = 'loss'
  }

  const p1Delta = calculateEloDelta(match.player1.eloRating, match.player2.eloRating, p1Outcome)
  const p2Delta = -p1Delta

  const rewardExp = p1Outcome === 'win' ? 120 : p1Outcome === 'draw' ? 60 : 30

  return {
    ...match,
    status: 'completed',
    winnerId,
    eloChanges: {
      player1Delta: p1Delta,
      player2Delta: p2Delta,
    },
    rewardExp,
    updatedAt: new Date().toISOString(),
  }
}

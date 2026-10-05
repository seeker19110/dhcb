// Changelog 0482: đấu trường CHỈ có đối thủ AI. Màn trận đấu phải nói rõ điều đó, và màn kết thúc
// phải hiện mức Elo THẬT server vừa tính — bản trước hiện số gán cứng (+16/0/-14, thua ra "+-14")
// và "+120 Exp" không được cộng vào đâu cả.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { PvPMatchState, PvPPlayerProfile } from '@dhcb/core-contracts/pvpArena'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}))

const submitMock = vi.fn()
vi.mock('../../lib/pvpArenaApi.js', () => ({
  submitPvPRoundAction: (...args: unknown[]) => submitMock(...args),
}))

import PvPBattlefieldModal from './PvPBattlefieldModal'

const NOW = '2026-10-02T00:00:00.000Z'

function profile(over: Partial<PvPPlayerProfile>): PvPPlayerProfile {
  return {
    id: 'p1',
    name: 'Học viên',
    avatar: '🦁',
    eloRating: 1200,
    rankTier: 'silver',
    winStreak: 0,
    totalMatches: 0,
    wins: 0,
    isGhostBot: false,
    ...over,
  }
}

function makeMatch(over: Partial<PvPMatchState> = {}): PvPMatchState {
  return {
    matchId: 'm1',
    mode: 'vocab_speed_duel',
    player1: profile({}),
    player2: profile({ id: 'bot', name: 'Bot Oxford', avatar: '📘', isGhostBot: true }),
    questions: [
      {
        id: 'q1',
        prompt: 'Từ nào nghĩa là "nhanh"?',
        options: ['fast', 'slow', 'tall', 'red'],
        correctIndex: 0,
        explanation: 'fast = nhanh',
        timeLimitSec: 5,
        cefrLevel: 'A1',
      },
    ],
    currentRound: 0,
    totalRounds: 1,
    scores: { player1Score: 0, player2Score: 0 },
    actions: [],
    status: 'in_progress',
    winnerId: null,
    rewardExp: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  }
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  submitMock.mockReset()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('PvPBattlefieldModal', () => {
  it('nói rõ đối thủ là AI', () => {
    act(() => {
      root.render(
        React.createElement(PvPBattlefieldModal, { initialMatch: makeMatch(), onClose: vi.fn() }),
      )
    })
    expect(document.body.textContent).toContain('Đối thủ AI')
    expect(document.body.textContent).toContain('Bot Oxford')
  })

  it('màn kết thúc hiện Elo thật server trả về (thua: −14), không còn Exp/"Nhận Thưởng"', async () => {
    const finished = makeMatch({
      currentRound: 1,
      status: 'completed',
      scores: { player1Score: 0, player2Score: 150 },
      winnerId: 'bot',
      eloChanges: { player1Delta: -14, player2Delta: 14 },
      rewardExp: 30,
    })
    submitMock.mockResolvedValue({
      p1Action: {
        roundIndex: 0,
        playerId: 'p1',
        selectedOption: 1,
        responseTimeMs: 900,
        isCorrect: false,
        pointsEarned: 0,
      },
      p2Action: {
        roundIndex: 0,
        playerId: 'bot',
        selectedOption: 0,
        responseTimeMs: 800,
        isCorrect: true,
        pointsEarned: 150,
      },
      match: finished,
      isMatchCompleted: true,
    })

    act(() => {
      root.render(
        React.createElement(PvPBattlefieldModal, { initialMatch: makeMatch(), onClose: vi.fn() }),
      )
    })
    const option = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('slow'),
    )
    expect(option).toBeDefined()
    await act(async () => {
      option!.click()
    })
    await act(async () => {
      vi.advanceTimersByTime(2600)
    })

    const text = document.body.textContent ?? ''
    expect(text).toContain('−14 điểm')
    expect(text).not.toContain('+-')
    expect(text).not.toContain('Exp')
    expect(text).not.toContain('Nhận Thưởng')
  })
})

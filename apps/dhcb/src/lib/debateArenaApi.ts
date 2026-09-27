import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/debateArenaApi.ts — Client API cho Đấu trường Tranh biện AI V5.
import type {
  DebateSessionConfig,
  DebateSessionState,
  DebateTurn,
  DebateRubricScore,
} from '@dhcb/core-contracts/debateArena'

export async function fetchDebateTopics(): Promise<
  Array<{
    topicId: string
    motion: string
    category: 'technology' | 'economics' | 'education' | 'philosophy' | 'environment'
    difficulty: 'intermediate_b2' | 'advanced_c1' | 'mastery_c2'
  }>
> {
  const res = await fetch('/api/debate-arena', {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải danh sách chủ đề tranh biện: ${res.status}`)
  }

  const data = await res.json()
  return data.topics
}

export async function createDebateSessionApi(
  config: DebateSessionConfig,
): Promise<DebateSessionState> {
  const res = await fetch('/api/debate-arena?action=create_session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ config }),
  })

  if (!res.ok) {
    throw new Error(`Lỗi khởi tạo phiên tranh biện: ${res.status}`)
  }

  const data = await res.json()
  return data.session
}

export async function submitDebateTurnApi(params: { sessionId: string; content: string }): Promise<{
  userTurn: DebateTurn
  aiTurn: DebateTurn
  session: DebateSessionState
}> {
  const res = await fetch('/api/debate-arena?action=submit_turn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi gửi lượt tranh biện: ${res.status}`)
  }

  const data = await res.json()
  return data
}

export async function evaluateDebateMatchApi(sessionId: string): Promise<DebateRubricScore> {
  const res = await fetch('/api/debate-arena?action=evaluate_match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ sessionId }),
  })

  if (!res.ok) {
    throw new Error(`Lỗi chấm điểm trận tranh biện: ${res.status}`)
  }

  const data = await res.json()
  return data.rubric
}

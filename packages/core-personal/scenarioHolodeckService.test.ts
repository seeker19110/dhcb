import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  listPredefinedScenarios,
  startHolodeckSession,
  getHolodeckSession,
  processHolodeckTurn,
  finalizeHolodeckSession,
  resetHolodeckSessionsForTest,
  MAX_HOLODECK_USER_TURNS,
} from './scenarioHolodeckService.js'
import {
  PRACTICE_SESSION_IDLE_TTL_MS,
  PRACTICE_SESSION_MAX_PER_PERSON,
  PRACTICE_SESSION_MAX_TOTAL,
  SessionCapacityError,
  SessionGoneError,
} from './ttlSessionStore.js'
import { ConflictError } from '@dhcb/core-errors/appError'

afterEach(() => {
  resetHolodeckSessionsForTest()
  vi.useRealTimers()
})

describe('scenarioHolodeckService', () => {
  it('lists predefined scenarios', () => {
    const list = listPredefinedScenarios()
    expect(list.length).toBeGreaterThanOrEqual(3)
    expect(list[0]?.id).toBe('bigtech_panel_interview')
  })

  it('starts, interacts and finalizes a holodeck session', () => {
    const personId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const session = startHolodeckSession(personId, 'bigtech_panel_interview')
    expect(session.sessionId).toBeDefined()
    expect(session.status).toBe('active')
    expect(session.turns).toHaveLength(1)

    const turnResult = processHolodeckTurn(
      session.sessionId,
      personId,
      'We noticed high latency on our distributed Redis cluster, so we implemented local memory fallback and circuit breakers.',
    )
    expect(turnResult.updatedSession.turns).toHaveLength(3) // 1 initial + 1 user + 1 reply
    expect(turnResult.personaReplyTurn.speakerType).toBe('persona')
    expect(turnResult.instantFeedback.strengths.length).toBeGreaterThan(0)

    const finalized = finalizeHolodeckSession(session.sessionId, personId)
    expect(finalized.status).toBe('completed')
    expect(finalized.finalRubric?.overallBand).toBeGreaterThan(0)
    expect(finalized.finalRubric?.recommendedDrills).toHaveLength(3)
  })

  it('handles getHolodeckSession and invalid scenario/session errors', () => {
    expect(() => startHolodeckSession('u1', 'invalid-scenario')).toThrow(
      'Scenario invalid-scenario không tồn tại',
    )
    expect(() => processHolodeckTurn('nonexistent', 'u1', 'test')).toThrow(SessionGoneError)
    expect(() => finalizeHolodeckSession('nonexistent', 'u1')).toThrow(SessionGoneError)
  })

  it('runs turns with all persona types (hr_director, vc_pitch, ielts_examiner) and short utterance', () => {
    const personId = 'user-2'

    // VC Pitch scenario
    const vcSession = startHolodeckSession(personId, 'silicon_vc_pitch')
    expect(vcSession.turns[0]?.content).toContain('Marcus is listening')

    // Short utterance without technical keywords
    const shortTurn = processHolodeckTurn(vcSession.sessionId, personId, 'Yes, okay.')
    expect(shortTurn.personaReplyTurn.content).toContain('Google or OpenAI')
    expect(shortTurn.instantFeedback.weaknesses).toContain(
      'Câu trả lời quá ngắn, chưa đủ dẫn chứng thực tế',
    )

    // IELTS Examiner scenario
    const ieltsSession = startHolodeckSession(personId, 'cambridge_ielts_examiner')
    const ieltsTurn = processHolodeckTurn(
      ieltsSession.sessionId,
      personId,
      'I believe automation changes job markets significantly.',
    )
    expect(ieltsTurn.personaReplyTurn.content).toContain('To what extent do you believe')

    // BigTech second turn (HR Director)
    const btSession = startHolodeckSession(personId, 'bigtech_panel_interview')
    processHolodeckTurn(btSession.sessionId, personId, 'Architecture scalability metrics')
    const hrTurn = processHolodeckTurn(
      btSession.sessionId,
      personId,
      'We coordinated closely with all team members.',
    )
    expect(hrTurn.personaReplyTurn.content).toContain('How did you align the team')

    // Finalize session with 0 user turns
    const emptySession = startHolodeckSession(personId, 'cambridge_ielts_examiner')
    emptySession.turns = []
    const finalizedEmpty = finalizeHolodeckSession(emptySession.sessionId, personId)
    expect(finalizedEmpty.status).toBe('completed')
  })

  // ── Vòng đời phiên trong RAM (changelog 0538) ──
  describe('phiên có hạn', () => {
    const A = 'person-a'
    const B = 'person-b'

    it('hết hạn ĐÚNG mốc 30 phút không hoạt động → SessionGoneError (404)', () => {
      vi.useFakeTimers()
      const s1 = startHolodeckSession(A, 'silicon_vc_pitch')
      vi.advanceTimersByTime(PRACTICE_SESSION_IDLE_TTL_MS - 1)
      // Lượt gửi ở phút 29:59.999 còn hạn và gia hạn thêm 30 phút.
      processHolodeckTurn(s1.sessionId, A, 'Our moat is proprietary data and distribution.')
      vi.advanceTimersByTime(PRACTICE_SESSION_IDLE_TTL_MS - 1)
      expect(getHolodeckSession(s1.sessionId, A)).toBeDefined()
      vi.advanceTimersByTime(PRACTICE_SESSION_IDLE_TTL_MS)
      expect(getHolodeckSession(s1.sessionId, A)).toBeUndefined()
      expect(() => processHolodeckTurn(s1.sessionId, A, 'hello')).toThrow(SessionGoneError)
      expect(() => finalizeHolodeckSession(s1.sessionId, A)).toThrow(SessionGoneError)
    })

    it('chủ phiên khác → SessionGoneError, phiên của A không đổi', () => {
      const s1 = startHolodeckSession(A, 'silicon_vc_pitch')
      expect(getHolodeckSession(s1.sessionId, B)).toBeUndefined()
      expect(() => processHolodeckTurn(s1.sessionId, B, 'chen ngang')).toThrow(SessionGoneError)
      expect(() => finalizeHolodeckSession(s1.sessionId, B)).toThrow(SessionGoneError)
      const own = getHolodeckSession(s1.sessionId, A)
      expect(own?.turns).toHaveLength(1)
      expect(own?.status).toBe('active')
    })

    it(`mở phiên thứ ${PRACTICE_SESSION_MAX_PER_PERSON + 1} thì phiên cũ nhất của chính người đó bị đóng`, () => {
      const ids = Array.from(
        { length: PRACTICE_SESSION_MAX_PER_PERSON + 1 },
        () => startHolodeckSession(A, 'silicon_vc_pitch').sessionId,
      )
      expect(getHolodeckSession(ids[0]!, A)).toBeUndefined()
      for (const id of ids.slice(1)) expect(getHolodeckSession(id, A)).toBeDefined()
    })

    it('tiến trình đầy trần toàn cục → SessionCapacityError (503) cho người mới', () => {
      for (let i = 0; i < PRACTICE_SESSION_MAX_TOTAL; i++) {
        startHolodeckSession(`p-${i}`, 'silicon_vc_pitch')
      }
      expect(() => startHolodeckSession('newcomer', 'silicon_vc_pitch')).toThrow(
        SessionCapacityError,
      )
    })

    it(`chặn lượt thứ ${MAX_HOLODECK_USER_TURNS + 1} trong một phiên (409) để phiên không phình RAM`, () => {
      const s1 = startHolodeckSession(A, 'silicon_vc_pitch')
      for (let i = 0; i < MAX_HOLODECK_USER_TURNS; i++) {
        processHolodeckTurn(s1.sessionId, A, `answer ${i}`)
      }
      expect(() => processHolodeckTurn(s1.sessionId, A, 'one more')).toThrow(ConflictError)
      // Vẫn tổng kết được.
      expect(finalizeHolodeckSession(s1.sessionId, A).status).toBe('completed')
    })

    it('gửi lượt vào phiên đã tổng kết → 409, không phải 500', () => {
      const s1 = startHolodeckSession(A, 'silicon_vc_pitch')
      finalizeHolodeckSession(s1.sessionId, A)
      expect(() => processHolodeckTurn(s1.sessionId, A, 'late answer')).toThrow(ConflictError)
    })
  })
})

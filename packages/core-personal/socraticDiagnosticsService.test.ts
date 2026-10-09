import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  listMisconceptions,
  startSocraticSession,
  submitSocraticReflection,
  getSocraticSession,
  resetSocraticSessionsForTest,
} from './socraticDiagnosticsService.js'
import {
  PRACTICE_SESSION_IDLE_TTL_MS,
  PRACTICE_SESSION_MAX_PER_PERSON,
  PRACTICE_SESSION_MAX_TOTAL,
  SessionCapacityError,
  SessionGoneError,
} from './ttlSessionStore.js'
import { ConflictError } from '@dhcb/core-errors/appError'

afterEach(() => {
  resetSocraticSessionsForTest()
  vi.useRealTimers()
})

describe('socraticDiagnosticsService', () => {
  it('lists predefined misconceptions', () => {
    const list = listMisconceptions()
    expect(list.length).toBeGreaterThanOrEqual(3)
    expect(list[0]?.id).toBe('present_perfect_past_confusion')
  })

  it('runs a guided socratic session to cognitive breakthrough', () => {
    const personId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const record = startSocraticSession(personId, 'present_perfect_past_confusion')
    expect(record.id).toBeDefined()
    expect(record.status).toBe('in_progress')
    expect(record.currentStepIndex).toBe(0)

    // Step 0 answer
    const res0 = submitSocraticReflection(
      record.id,
      personId,
      'Thời điểm last summer đã kết thúc hoàn toàn trong quá khứ.',
    )
    expect(res0.updatedRecord.currentStepIndex).toBe(1)
    expect(res0.isComplete).toBe(false)

    // Step 1 answer
    const res1 = submitSocraticReflection(record.id, personId, 'Dùng thì quá khứ đơn ạ.')
    expect(res1.updatedRecord.currentStepIndex).toBe(2)

    // Step 2 answer
    const res2 = submitSocraticReflection(record.id, personId, 'I visited Da Nang last summer.')
    expect(res2.isComplete).toBe(true)
    expect(res2.updatedRecord.status).toBe('breakthrough_achieved')
    expect(res2.updatedRecord.breakthroughSummary).toContain('thấu suốt')
  })

  // ── Vòng đời phiên trong RAM (changelog 0538) ──
  describe('phiên có hạn', () => {
    const A = 'person-a'
    const B = 'person-b'
    const TOPIC = 'present_perfect_past_confusion'

    it('hết hạn ĐÚNG mốc 30 phút không hoạt động → SessionGoneError (404)', () => {
      vi.useFakeTimers()
      const rec = startSocraticSession(A, TOPIC)
      vi.advanceTimersByTime(PRACTICE_SESSION_IDLE_TTL_MS - 1)
      expect(getSocraticSession(rec.id, A)).toBeDefined() // gia hạn thêm 30 phút
      vi.advanceTimersByTime(PRACTICE_SESSION_IDLE_TTL_MS)
      expect(() => submitSocraticReflection(rec.id, A, 'quá khứ đơn')).toThrow(SessionGoneError)
    })

    it('chủ phiên khác → SessionGoneError, câu trả lời của A không bị ghi đè', () => {
      const rec = startSocraticSession(A, TOPIC)
      expect(getSocraticSession(rec.id, B)).toBeUndefined()
      expect(() => submitSocraticReflection(rec.id, B, 'chen ngang')).toThrow(SessionGoneError)
      expect(getSocraticSession(rec.id, A)?.turns[0]?.learnerAnswer).toBe('')
    })

    it(`mở phiên thứ ${PRACTICE_SESSION_MAX_PER_PERSON + 1} thì phiên cũ nhất của chính người đó bị đóng`, () => {
      const ids = Array.from(
        { length: PRACTICE_SESSION_MAX_PER_PERSON + 1 },
        () => startSocraticSession(A, TOPIC).id,
      )
      expect(getSocraticSession(ids[0]!, A)).toBeUndefined()
      expect(getSocraticSession(ids.at(-1)!, A)).toBeDefined()
    })

    it('tiến trình đầy trần toàn cục → SessionCapacityError (503) cho người mới', () => {
      for (let i = 0; i < PRACTICE_SESSION_MAX_TOTAL; i++) startSocraticSession(`p-${i}`, TOPIC)
      expect(() => startSocraticSession('newcomer', TOPIC)).toThrow(SessionCapacityError)
    })

    it('trả lời vào phiên đã thấu suốt → 409, không phải 500', () => {
      const rec = startSocraticSession(A, 'diplomatic_politeness_imperative')
      submitSocraticReflection(rec.id, A, 'Nghe gay gắt và thiếu lịch sự quá.')
      const done = submitSocraticReflection(rec.id, A, 'Could you please send me the file?')
      expect(done.isComplete).toBe(true)
      expect(() => submitSocraticReflection(rec.id, A, 'thêm nữa')).toThrow(ConflictError)
    })
  })
})

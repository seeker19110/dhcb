// Phía client của kiểm tra hiểu do server cấp lượt + chấm — đặc tả
// docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③ (bảng ca lỗi) +
// docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md §③.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ Authorization: 'Bearer t' }) }))

import {
  DIALOGUE_CHECK_URL,
  DIALOGUE_START_URL,
  startDialogueCheck,
  submitDialogueCheck,
} from './dialogueCheckClient'
import type {
  DialogueCheckInput,
  DialogueStartInput,
  DialogueStartResult,
} from '@dhcb/core-contracts/cefrDialogueCheck'

const START_INPUT: DialogueStartInput = {
  ownerId: 'a1-greetings',
  titleEn: 'Meeting in class',
  direction: 'A',
}

const START_RESULT: DialogueStartResult = {
  token: 'v1.abc.def',
  expiresAt: 1_900_000_000_000,
  questions: [
    {
      id: 'meaning-3',
      kind: 'meaning',
      prompt: 'Câu này nghĩa là gì?',
      stem: 'Nice to meet you.',
      stemLang: 'en',
      options: [
        { id: 'o0', text: 'Rất vui được gặp bạn.', lang: 'vi' },
        { id: 'o1', text: 'Hẹn gặp lại.', lang: 'vi' },
      ],
    },
    {
      id: 'speaker-1',
      kind: 'speaker',
      prompt: 'Ai nói câu này?',
      stem: 'Hello!',
      stemLang: 'en',
      options: [
        { id: 'A', text: 'Lan' },
        { id: 'B', text: 'Nam' },
      ],
    },
  ],
}

const INPUT: DialogueCheckInput = {
  token: 'v1.abc.def',
  answers: [{ questionId: 'meaning-3', optionId: 'o1' }],
}

const RESULT = {
  correct: 1,
  total: 3,
  required: 2,
  passed: false,
  saved: false,
  items: [
    {
      questionId: 'meaning-3',
      chosenId: 'o1',
      correct: true,
      explanation: { lead: 'Nghĩa đúng:' },
    },
    { questionId: 'speaker-1', chosenId: 'A', correct: false },
  ],
}

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const reply = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue(
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
  )

describe('startDialogueCheck', () => {
  it('POST đúng URL action start + body, kèm header đăng nhập; 200 hợp đồng → started', async () => {
    reply(200, START_RESULT)
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'started', result: START_RESULT })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(DIALOGUE_START_URL)
    expect(url).toContain('/api/learning/evidence?action=cefr-dialogue-start')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t')
    expect(JSON.parse(init.body as string)).toEqual(START_INPUT)
  })

  it('200 có correctId lọt vào (server lộ đáp án) → hợp đồng .strict() từ chối → error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reply(200, {
      ...START_RESULT,
      questions: [{ ...START_RESULT.questions[0], correctId: 'o0' }, START_RESULT.questions[1]],
    })
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'error' })
    reply(200, 'không phải json')
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'error' })
    warn.mockRestore()
  })

  it('400 NO_QUIZ → no-quiz; 400 khác → error; mất mạng/401/429/503/500 theo ca chung', async () => {
    reply(400, { code: 'NO_QUIZ' })
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'no-quiz' })
    reply(400, { code: 'CONTENT_NOT_FOUND' })
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'error' })
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'offline' })
    reply(401, {})
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'auth' })
    reply(429, {})
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'rate-limited' })
    reply(503, { code: 'SERVICE_UNAVAILABLE' })
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'unavailable' })
    reply(500, {})
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'error' })
  })

  it('409 ATTEMPT_CAP → attempt-cap (hết trần lượt sai, đợt 0559); 409 mã khác → error', async () => {
    reply(409, { code: 'ATTEMPT_CAP', error: 'x' })
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'attempt-cap' })
    reply(409, { code: 'ATTEMPT_USED' })
    expect(await startDialogueCheck(START_INPUT)).toEqual({ kind: 'error' })
  })

  it('đầu vào sai hợp đồng → error, KHÔNG gọi mạng', async () => {
    expect(await startDialogueCheck({ ...START_INPUT, direction: 'C' as unknown as 'A' })).toEqual({
      kind: 'error',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('submitDialogueCheck', () => {
  it('POST đúng URL action + token + lựa chọn thô, kèm header đăng nhập; 200 hợp đồng → graded', async () => {
    reply(200, RESULT)
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'graded', result: RESULT })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(DIALOGUE_CHECK_URL)
    expect(url).toContain('/api/learning/evidence?action=cefr-dialogue')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t')
    expect(JSON.parse(init.body as string)).toEqual(INPUT)
  })

  it('200 nhưng sai hợp đồng (kể cả có correctId) / không phải JSON → error (không tin bừa)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reply(200, { passed: true })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    reply(200, { ...RESULT, items: [{ ...RESULT.items[1], correctId: 'B' }] })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    reply(200, 'không phải json')
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    warn.mockRestore()
  })

  it('mất mạng → offline; 401/403 → auth; 429 → rate-limited; 500/400 → error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'offline' })
    reply(401, { error: 'Unauthorized' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'auth' })
    reply(403, {})
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'auth' })
    reply(429, { error: 'x' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'rate-limited' })
    reply(500, { error: 'x' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    reply(400, { error: 'x', code: 'CONTENT_NOT_FOUND' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
  })

  it('409 theo mã: ATTEMPT_USED → attempt-used, ATTEMPT_EXPIRED → attempt-expired, QUIZ_MISMATCH → outdated, lạ → error', async () => {
    reply(409, { code: 'ATTEMPT_USED', saved: true })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'attempt-used', saved: true })
    reply(409, { code: 'ATTEMPT_USED', saved: false })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'attempt-used', saved: false })
    reply(409, { code: 'ATTEMPT_USED' }) // thiếu cờ → coi như chưa rõ = chưa lưu
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'attempt-used', saved: false })
    reply(409, { code: 'ATTEMPT_EXPIRED' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'attempt-expired' })
    reply(409, { code: 'QUIZ_MISMATCH' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'outdated' })
    reply(409, { code: 'ATTEMPT_CAP', error: 'x' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'attempt-cap' })
    reply(409, { code: 'KHAC' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    reply(409, 'html')
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
  })

  it('200 chưa đạt kèm attemptsLeft (đợt 0559) → graded giữ nguyên; attemptsLeft âm/quá trần → error', async () => {
    reply(200, { ...RESULT, attemptsLeft: 3 })
    expect(await submitDialogueCheck(INPUT)).toEqual({
      kind: 'graded',
      result: { ...RESULT, attemptsLeft: 3 },
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reply(200, { ...RESULT, attemptsLeft: -1 })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    reply(200, { ...RESULT, attemptsLeft: 99 })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    warn.mockRestore()
  })

  it('503 SERVICE_UNAVAILABLE → unavailable (máy chủ tạm bận, chưa chấm); 503 không mã → error', async () => {
    reply(503, { code: 'SERVICE_UNAVAILABLE', error: 'x' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'unavailable' })
    reply(503, 'Service Unavailable')
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
  })

  it('đầu vào sai hợp đồng → error, KHÔNG gọi mạng', async () => {
    expect(await submitDialogueCheck({ ...INPUT, token: '' })).toEqual({ kind: 'error' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

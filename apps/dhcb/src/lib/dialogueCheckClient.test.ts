// Phía client của server chấm lại kiểm tra hiểu — đặc tả
// docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③ (bảng ca lỗi).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ Authorization: 'Bearer t' }) }))

import { DIALOGUE_CHECK_URL, submitDialogueCheck } from './dialogueCheckClient'
import type { DialogueCheckInput } from '@dhcb/core-contracts/cefrDialogueCheck'

const INPUT: DialogueCheckInput = {
  ownerId: 'a1-greetings',
  titleEn: 'Meeting in class',
  direction: 'A',
  attempt: 42,
  answers: [{ questionId: 'meaning-3', optionId: 'o1' }],
}

const RESULT = {
  correct: 1,
  total: 3,
  required: 2,
  passed: false,
  saved: false,
  items: [{ questionId: 'meaning-3', chosenId: 'o1', correctId: 'o2', correct: false }],
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

describe('submitDialogueCheck', () => {
  it('POST đúng URL action + lựa chọn thô, kèm header đăng nhập; 200 hợp đồng → graded', async () => {
    reply(200, RESULT)
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'graded', result: RESULT })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(DIALOGUE_CHECK_URL)
    expect(url).toContain('/api/learning/evidence?action=cefr-dialogue')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t')
    expect(JSON.parse(init.body as string)).toEqual(INPUT)
  })

  it('200 nhưng sai hợp đồng / không phải JSON → error (không tin bừa)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reply(200, { passed: true })
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

  it('409 phân biệt theo mã: ATTEMPT_USED → attempt-used, QUIZ_MISMATCH → outdated, lạ → error', async () => {
    reply(409, { code: 'ATTEMPT_USED' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'attempt-used' })
    reply(409, { code: 'QUIZ_MISMATCH' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'outdated' })
    reply(409, { code: 'KHAC' })
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
    reply(409, 'html')
    expect(await submitDialogueCheck(INPUT)).toEqual({ kind: 'error' })
  })

  it('đầu vào sai hợp đồng → error, KHÔNG gọi mạng', async () => {
    expect(await submitDialogueCheck({ ...INPUT, attempt: -1 })).toEqual({ kind: 'error' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

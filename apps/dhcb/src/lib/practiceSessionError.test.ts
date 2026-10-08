// Canh việc đọc lỗi API phòng luyện (changelog 0538) + hợp đồng mã "phiên không còn" khớp server.
import { describe, expect, it } from 'vitest'
import {
  isSessionGone,
  practiceErrorFromResponse,
  PracticeSessionError,
  SESSION_GONE_CODE,
} from './practiceSessionError'
import {
  SESSION_GONE_CODE as SERVER_SESSION_GONE_CODE,
  SessionGoneError,
} from '@dhcb/core-personal/ttlSessionStore'
import { toErrorBody } from '@dhcb/core-errors/appError'

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status })

describe('practiceErrorFromResponse', () => {
  it('hợp đồng: mã client khớp mã server', () => {
    expect(SESSION_GONE_CODE).toBe(SERVER_SESSION_GONE_CODE)
  })

  it('body thật của server khi phiên hết hạn → sessionGone + giữ thông điệp server', async () => {
    const err = await practiceErrorFromResponse(
      json(toErrorBody(new SessionGoneError()), 404),
      'fallback',
    )
    expect(err).toBeInstanceOf(PracticeSessionError)
    expect(err.sessionGone).toBe(true)
    expect(err.status).toBe(404)
    expect(err.message).toMatch(/Bắt đầu lại/)
    expect(isSessionGone(err)).toBe(true)
  })

  it('410 Gone không body vẫn là phiên không còn, có câu mặc định', async () => {
    const err = await practiceErrorFromResponse(new Response('', { status: 410 }), 'fallback')
    expect(err.sessionGone).toBe(true)
    expect(err.message).toMatch(/hết hạn/)
  })

  it('404 KHÁC mã (vd route không tồn tại) không bị coi là phiên hết hạn', async () => {
    const err = await practiceErrorFromResponse(
      json({ error: 'API route không tồn tại' }, 404),
      'fallback',
    )
    expect(err.sessionGone).toBe(false)
    expect(err.message).toBe('API route không tồn tại')
  })

  it('body HTML/hỏng → thông điệp mặc định, không ném', async () => {
    const err = await practiceErrorFromResponse(
      new Response('<!doctype html>', { status: 502 }),
      'Lỗi gửi lượt',
    )
    expect(err.sessionGone).toBe(false)
    expect(err.message).toBe('Lỗi gửi lượt')
  })

  it('isSessionGone với lỗi thường → false', () => {
    expect(isSessionGone(new Error('x'))).toBe(false)
    expect(isSessionGone(new PracticeSessionError('x', 409, false))).toBe(false)
  })
})

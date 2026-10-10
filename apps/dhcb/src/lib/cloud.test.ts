import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ChatSession, WritingSubmission, SpeakingSession } from '../types'

vi.mock('@core/authHeader', () => ({
  getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
  getStoredToken: vi.fn(),
}))

import { getStoredToken } from '@core/authHeader'
import {
  pushChatSession,
  pushSpeakingSession,
  pushWritingSub,
  pushLearnDay,
  pullUserData,
  saveOnboarding,
} from './cloud'

const mockedGetStoredToken = vi.mocked(getStoredToken)

beforeEach(() => {
  localStorage.clear()
  mockedGetStoredToken.mockReturnValue('tok')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// Đợi microtask xong vì firePost() không await fetch (bắn rồi quên).
async function flush() {
  await new Promise((r) => setTimeout(r, 0))
}

const CHAT: ChatSession = {
  id: 'c1',
  situation: 'restaurant',
  level: 'A1',
  messages: [],
  createdAt: '2026-08-03T00:00:00Z',
} as unknown as ChatSession

describe('pushChatSession / pushSpeakingSession / pushWritingSub / pushLearnDay (firePost dùng chung)', () => {
  it('chưa đăng nhập → không gọi fetch', () => {
    mockedGetStoredToken.mockReturnValue(null)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    pushChatSession(CHAT)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('pushChatSession gửi đúng URL/method/body', async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe('/api/history')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.action).toBe('chat')
      expect(body.session.id).toBe('c1')
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    pushChatSession(CHAT)
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('pushSpeakingSession gửi action speaking', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string)
      expect(body.action).toBe('speaking')
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    pushSpeakingSession({ ...CHAT } as unknown as SpeakingSession)
    await flush()
  })

  it('pushWritingSub gửi action writing kèm submission', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string)
      expect(body.action).toBe('writing')
      expect(body.submission.id).toBe('w1')
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    pushWritingSub({
      id: 'w1',
      essayPrompt: 'p',
      essay: 'e',
      feedback: 'f',
      submittedAt: '2026-08-03T00:00:00Z',
    } as unknown as WritingSubmission)
    await flush()
  })

  it('pushLearnDay gửi action learn-day kèm day + learnCount', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).toEqual({
        action: 'learn-day',
        day: '2026-08-03',
        learnCount: 10,
      })
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    pushLearnDay('u1', '2026-08-03', 10)
    await flush()
  })

  it('HTTP lỗi → chỉ console.warn, không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('err', { status: 500 })),
    )
    pushChatSession(CHAT)
    await flush()
    expect(console.warn).toHaveBeenCalled()
  })

  it('fetch reject (mất mạng) → chỉ console.warn, không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    pushChatSession(CHAT)
    await flush()
    expect(console.warn).toHaveBeenCalled()
  })
})

describe('pullUserData', () => {
  it('chưa đăng nhập → không gọi fetch', async () => {
    mockedGetStoredToken.mockReturnValue(null)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await pullUserData('u1')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('thành công → ghi các mảng dữ liệu vào localStorage', async () => {
    const usage = [
      { date: '2026-08-01', chatCount: 1 },
      { date: '2026-08-02', chatCount: 2 },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toBe('/api/history')
        return new Response(JSON.stringify({ chat: [CHAT], writing: [], speaking: [], usage }), {
          status: 200,
        })
      }),
    )
    await pullUserData('u1')
    expect(JSON.parse(localStorage.getItem('et_chat_u1') as string)).toEqual([CHAT])
    expect(JSON.parse(localStorage.getItem('et_usage_u1_2026-08-01') as string)).toEqual(usage[0])
    expect(JSON.parse(localStorage.getItem('et_usage_u1_2026-08-02') as string)).toEqual(usage[1])
  })

  it('server chỉ trả phiên gần nhất → GỘP theo id với bản trên máy, không xoá phiên cũ', async () => {
    const CUR = { ...CHAT, createdAt: 2_000 }
    const OLD = { ...CHAT, id: 'old-only-local', createdAt: 1_000 }
    const STALE = { ...CUR, situation: 'bản cũ trên máy' }
    localStorage.setItem('et_chat_u1', JSON.stringify([STALE, OLD]))
    const NEWER = { ...CHAT, id: 'newer', createdAt: 3_000 }
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ chat: [CUR, NEWER], writing: [], speaking: [] }), {
            status: 200,
          }),
      ),
    )
    await pullUserData('u1')
    // Server thắng khi trùng id; phiên chỉ có trên máy được giữ; xếp mới → cũ.
    expect(JSON.parse(localStorage.getItem('et_chat_u1') as string)).toEqual([NEWER, CUR, OLD])
  })

  it('localStorage hỏng (không phải mảng JSON) → dùng bản server', async () => {
    localStorage.setItem('et_chat_u1', '{hỏng')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ chat: [CHAT] }), { status: 200 })),
    )
    await pullUserData('u1')
    expect(JSON.parse(localStorage.getItem('et_chat_u1') as string)).toEqual([CHAT])
  })

  it('HTTP lỗi → không ghi gì, không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('err', { status: 500 })),
    )
    await expect(pullUserData('u1')).resolves.toBeUndefined()
    expect(localStorage.getItem('et_chat_u1')).toBeNull()
  })

  it('fetch reject → không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    await expect(pullUserData('u1')).resolves.toBeUndefined()
  })
})

describe('saveOnboarding', () => {
  const payload = { level: 'beginner', goal: 'daily', dailyMinutes: 15 }
  it('chỉ xác nhận success khi server trả ok=true, giữ đúng URL/method/body', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).toEqual({ action: 'onboarding', ...payload })
      expect(init.method).toBe('POST')
      expect(init.signal).toBeInstanceOf(AbortSignal)
      return Response.json({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)
    expect(await saveOnboarding(payload)).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/profile')
  })
  it.each([400, 401, 403, 429, 500])(
    'HTTP %i trả lỗi rõ ràng, không tự retry hoặc log dữ liệu',
    async (status) => {
      const fetchMock = vi.fn(async () => new Response('err', { status }))
      vi.stubGlobal('fetch', fetchMock)
      expect(await saveOnboarding(payload)).toEqual({ ok: false, reason: 'http', status })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(console.warn).not.toHaveBeenCalled()
    },
  )
  it.each(['{}', '{"ok":false}', '{"ok":"true"}', '<html>error</html>'])(
    '2xx với body %s không báo đã lưu',
    async (body) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(body)),
      )
      expect(await saveOnboarding(payload)).toEqual({ ok: false, reason: 'invalid-response' })
    },
  )
  it('offline trả lỗi; retry chủ động gửi nguyên payload', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await saveOnboarding(payload)).toEqual({ ok: false, reason: 'network' })
    expect(await saveOnboarding(payload)).toEqual({ ok: true })
    expect(fetchMock.mock.calls[0]![1].body).toBe(fetchMock.mock.calls[1]![1].body)
  })
  it('timeout kết thúc pending sau 15 giây và abort request', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal!.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      ),
    )
    try {
      const result = saveOnboarding(payload)
      await vi.advanceTimersByTimeAsync(15_000)
      expect(await result).toEqual({ ok: false, reason: 'timeout' })
    } finally {
      vi.useRealTimers()
    }
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock getAuthHeader — kiểm soát trạng thái đăng nhập theo từng test.
vi.mock('@core/authHeader', () => ({
  getAuthHeader: vi.fn(),
  getStoredToken: () => (getAuthHeader().Authorization ? 'session:fixture' : null),
}))

import { getAuthHeader } from '@core/authHeader'
import { claimShareQuest, claimStreakQuest, claimCefrExamQuest, fetchQuestsStatus } from './quests'

const mockedGetAuthHeader = vi.mocked(getAuthHeader)

beforeEach(() => {
  mockedGetAuthHeader.mockReturnValue({ Authorization: 'Bearer test-token' })
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('claimShareQuest / claimStreakQuest / claimCefrExamQuest (postClaim dùng chung)', () => {
  it('chưa đăng nhập → trả null, KHÔNG gọi fetch', async () => {
    mockedGetAuthHeader.mockReturnValue({})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const r = await claimShareQuest()
    expect(r).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('claimShareQuest thành công → gọi đúng URL/method/body, trả rewardDays', async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe('/api/quests')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({ action: 'claim-share' })
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
      return new Response(JSON.stringify({ ok: true, rewardDays: 3 }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await claimShareQuest()
    expect(r).toBe(3)
  })

  it('claimStreakQuest gửi đúng action', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).toEqual({ action: 'claim-streak' })
      return new Response(JSON.stringify({ ok: true, rewardDays: 1 }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await claimStreakQuest()
    expect(r).toBe(1)
  })

  it('claimCefrExamQuest gửi kèm level', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).toEqual({ action: 'claim-cefr-exam', level: 'B1' })
      return new Response(JSON.stringify({ ok: true, rewardDays: 5 }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await claimCefrExamQuest('B1')
    expect(r).toBe(5)
  })

  it('server trả ok:false → trả null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: false }), { status: 200 })),
    )
    const r = await claimShareQuest()
    expect(r).toBeNull()
  })

  it('server trả rewardDays không phải số → trả null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    )
    const r = await claimShareQuest()
    expect(r).toBeNull()
  })

  it('HTTP lỗi (4xx/5xx) → trả null, không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'nope' }), { status: 429 })),
    )
    const r = await claimShareQuest()
    expect(r).toBeNull()
  })

  it('fetch reject (mất mạng) → trả null, không ném lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    const r = await claimShareQuest()
    expect(r).toBeNull()
  })
})

describe('fetchQuestsStatus', () => {
  const STATUS = {
    share: { cooldownDays: 7, rewardDays: 3, canClaim: true },
    streak: { current: 5, required: 7, rewardDays: 3, cooldownDays: 7, canClaim: false },
    cefrExams: [],
    referral: { code: 'ABC', rewardedCount: 0, pendingCount: 0, maxRewarded: 5, rewardDays: 3 },
  }

  it('chưa đăng nhập → trả null, không gọi fetch', async () => {
    mockedGetAuthHeader.mockReturnValue({})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const r = await fetchQuestsStatus()
    expect(r).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('thành công → gọi đúng URL + trả dữ liệu đã parse', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/api/quests')
      expect(init?.headers).toEqual({ Authorization: 'Bearer test-token' })
      return new Response(JSON.stringify(STATUS), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const r = await fetchQuestsStatus()
    expect(r).toEqual(STATUS)
  })

  it('HTTP lỗi → trả null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('err', { status: 500 })),
    )
    const r = await fetchQuestsStatus()
    expect(r).toBeNull()
  })

  it('fetch reject → trả null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const r = await fetchQuestsStatus()
    expect(r).toBeNull()
  })
})

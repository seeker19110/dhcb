// Dự án trục đang chọn phía client (hạ tầng T2/T3, 2026-10-09).
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({}) }))

import {
  cacheProjectTrack,
  readCachedProjectTrack,
  saveProjectTrack,
} from './programmingProjectTrack'
import { fetchProgress } from './programmingProgress'

const UID = 'u1'
const GUEST = 'guest_abc'
const KEY = (uid: string) => `dhcb_prog_track_${uid}`

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  const fn = vi.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)))
  vi.stubGlobal('fetch', fn as unknown as typeof fetch)
  return fn
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('readCachedProjectTrack', () => {
  it('chưa chọn → null; giá trị hỏng → null (không tin localStorage)', () => {
    expect(readCachedProjectTrack(UID)).toBeNull()
    localStorage.setItem(KEY(UID), 'T9')
    expect(readCachedProjectTrack(UID)).toBeNull()
    localStorage.setItem(KEY(UID), '"T2"')
    expect(readCachedProjectTrack(UID)).toBeNull()
  })

  it('đọc đúng giá trị đã ghi, tách theo người dùng', () => {
    cacheProjectTrack(UID, 'T3')
    expect(readCachedProjectTrack(UID)).toBe('T3')
    expect(readCachedProjectTrack('u2')).toBeNull()
  })
})

describe('saveProjectTrack', () => {
  it('khách vãng lai: chỉ ghi localStorage, KHÔNG gọi server', async () => {
    const fn = mockFetch(() => ({ ok: true }))
    expect(await saveProjectTrack(GUEST, 'T2')).toBe(true)
    expect(fn).not.toHaveBeenCalled()
    expect(readCachedProjectTrack(GUEST)).toBe('T2')
  })

  it('có tài khoản: ghi bộ đệm trước rồi POST { projectTrack } lên progress', async () => {
    const fn = mockFetch(() => ({ ok: true }))
    expect(await saveProjectTrack(UID, 'T1')).toBe(true)
    expect(fn).toHaveBeenCalledTimes(1)
    const [url, init] = fn.mock.calls[0]!
    expect(url).toBe('/api/programming/progress')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ projectTrack: 'T1' })
    expect(readCachedProjectTrack(UID)).toBe('T1')
  })

  it('server từ chối (4xx) hoặc mất mạng → false, bộ đệm vẫn giữ lựa chọn', async () => {
    mockFetch(() => ({ ok: false }))
    expect(await saveProjectTrack(UID, 'T2')).toBe(false)
    expect(readCachedProjectTrack(UID)).toBe('T2')

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    expect(await saveProjectTrack(UID, 'T3')).toBe(false)
    expect(readCachedProjectTrack(UID)).toBe('T3')
  })
})

describe('fetchProgress ghi dự án server đang giữ vào bộ đệm', () => {
  it('state.projectTrack hợp lệ → ghi bộ đệm', async () => {
    mockFetch(() => ({
      ok: true,
      json: async () => ({ state: { currentLevel: 'p1', projectTrack: 'T2' }, lessons: [] }),
    }))
    await fetchProgress(UID)
    expect(readCachedProjectTrack(UID)).toBe('T2')
  })

  it('state thiếu/sai khuôn → KHÔNG đè lựa chọn đang có', async () => {
    cacheProjectTrack(UID, 'T3')
    for (const state of [undefined, null, { projectTrack: 'T9' }, 'T1']) {
      mockFetch(() => ({ ok: true, json: async () => ({ state, lessons: [] }) }))
      await fetchProgress(UID)
      expect(readCachedProjectTrack(UID)).toBe('T3')
    }
  })
})

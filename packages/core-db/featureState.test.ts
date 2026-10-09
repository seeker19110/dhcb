import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock pool — không cần Postgres thật; kiểm tra đúng SQL + tham số + parse kết quả.
const queryMock = vi.fn()
vi.mock('./pgPool.js', () => ({ getPgPool: () => ({ query: queryMock }) }))

import {
  getFeatureState,
  releaseFeatureLock,
  setFeatureState,
  tryAcquireFeatureLock,
} from './featureState.js'

const UID = '00000000-0000-0000-0000-000000000001'

describe('featureState', () => {
  beforeEach(() => queryMock.mockReset())

  it('getFeatureState trả null khi chưa có dòng', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    expect(await getFeatureState(UID, 'memory_palace')).toBeNull()
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('select state'), [
      UID,
      'memory_palace',
    ])
  })

  it('getFeatureState trả state JSONB khi có', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ state: { rooms: [1, 2] } }] })
    expect(await getFeatureState(UID, 'memory_palace')).toEqual({ rooms: [1, 2] })
  })

  it('setFeatureState upsert với JSON đã stringify', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    await setFeatureState(UID, 'action_canvas', { a: 1 })
    const call = queryMock.mock.calls[0]
    expect(call?.[0]).toContain('on conflict (user_id, feature) do update')
    expect(call?.[1]).toEqual([UID, 'action_canvas', JSON.stringify({ a: 1 })])
  })

  // Changelog 0549: khoá chống hai request đua nhau gọi AI. Ngữ nghĩa nguyên tử nằm ở SQL (upsert
  // có điều kiện hết hạn) — ở đây canh đúng câu + đọc đúng kết quả; PREPARE trên schema thật do
  // `npm run check:sql` canh.
  it('tryAcquireFeatureLock: có dòng trả về → giữ được; không dòng (đang bị giữ) → false', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ acquired: true }] })
    expect(await tryAcquireFeatureLock(UID, 'action_canvas_ai_lock', 90)).toBe(true)
    const [sql, params] = queryMock.mock.calls[0] ?? []
    expect(sql).toContain('on conflict (user_id, feature) do update')
    expect(sql).toContain('where platform.feature_state.updated_at < now() - make_interval')
    expect(params).toEqual([UID, 'action_canvas_ai_lock', 90])

    queryMock.mockResolvedValueOnce({ rows: [] })
    expect(await tryAcquireFeatureLock(UID, 'action_canvas_ai_lock', 90)).toBe(false)
  })

  it('releaseFeatureLock xoá đúng dòng khoá của user', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    await releaseFeatureLock(UID, 'action_canvas_ai_lock')
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('delete from platform.feature_state'),
      [UID, 'action_canvas_ai_lock'],
    )
  })
})

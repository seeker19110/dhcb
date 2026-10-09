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
  it('tryAcquireFeatureLock: giữ được → trả token (lưu vào state.t); đang bị giữ → null', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ acquired: true }] })
    const token = await tryAcquireFeatureLock(UID, 'action_canvas_ai_lock', 90)
    expect(token).toMatch(/^[0-9a-f-]{36}$/)
    const [sql, params] = queryMock.mock.calls[0] ?? []
    expect(sql).toContain("jsonb_build_object('t', $4::text)")
    expect(sql).toContain('on conflict (user_id, feature) do update set state = excluded.state')
    expect(sql).toContain('where platform.feature_state.updated_at < now() - make_interval')
    expect(params).toEqual([UID, 'action_canvas_ai_lock', 90, token])

    queryMock.mockResolvedValueOnce({ rows: [] })
    expect(await tryAcquireFeatureLock(UID, 'action_canvas_ai_lock', 90)).toBeNull()
  })

  it('mỗi lần giữ khoá có token khác nhau', async () => {
    queryMock.mockResolvedValue({ rows: [{ acquired: true }] })
    const a = await tryAcquireFeatureLock(UID, 'k', 90)
    const b = await tryAcquireFeatureLock(UID, 'k', 90)
    expect(a).not.toBe(b)
  })

  it('releaseFeatureLock chỉ xoá dòng khoá có ĐÚNG token của mình', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    await releaseFeatureLock(UID, 'action_canvas_ai_lock', 'tok-1')
    const [sql, params] = queryMock.mock.calls[0] ?? []
    expect(sql).toContain('delete from platform.feature_state')
    expect(sql).toContain("state->>'t' = $3")
    expect(params).toEqual([UID, 'action_canvas_ai_lock', 'tok-1'])
  })
})

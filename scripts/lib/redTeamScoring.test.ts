import { describe, expect, it } from 'vitest'
import { isLocalDatabaseUrl, summarize, type RedTeamResult } from './redTeamScoring'

function result(overrides: Partial<RedTeamResult> = {}): RedTeamResult {
  return {
    id: 'rt-pi-1',
    family: 'PI',
    title: 'ca thử',
    blocked: true,
    evidence: 'status=pending',
    crashed: false,
    ...overrides,
  }
}

describe('summarize', () => {
  it('mọi ca chặn được → thoát 0, đếm đúng theo họ', () => {
    const s = summarize([result(), result({ id: 'rt-ta-1', family: 'TA' })])
    expect(s.exitCode).toBe(0)
    expect(s.blocked).toBe(2)
    expect(s.byFamily.PI).toEqual({ total: 1, blocked: 1 })
    expect(s.byFamily.TA).toEqual({ total: 1, blocked: 1 })
    expect(s.byFamily.SL).toEqual({ total: 0, blocked: 0 })
  })

  it('một ca lọt → thoát 1 và nằm trong danh sách failed', () => {
    const s = summarize([result(), result({ id: 'rt-sl-1', family: 'SL', blocked: false })])
    expect(s.exitCode).toBe(1)
    expect(s.failed.map((r) => r.id)).toEqual(['rt-sl-1'])
  })

  it('ca HỎNG không bao giờ được tính là đã chặn, kể cả khi cờ blocked=true', () => {
    const s = summarize([result({ crashed: true, blocked: true })])
    expect(s.exitCode).toBe(1)
    expect(s.blocked).toBe(0)
  })

  it('không có ca nào → thoát 1 (harness hỏng, không phải "an toàn tuyệt đối")', () => {
    expect(summarize([]).exitCode).toBe(1)
  })
})

describe('isLocalDatabaseUrl', () => {
  it.each([
    'postgres://postgres:postgres@127.0.0.1:5432/dhcb',
    'postgres://postgres@localhost/dhcb',
    'postgres://u@[::1]:5433/dhcb',
  ])('nhận máy cục bộ: %s', (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(true)
  })

  it.each([
    undefined,
    '',
    'không phải url',
    'postgres://dhcb_app:x@103.118.29.58:5432/dhcb',
    'postgres://u@db.example.com/dhcb',
    'postgres://u@127.0.0.1.evil.example/dhcb',
  ])('từ chối máy khác hoặc URL hỏng: %s', (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(false)
  })
})

// Test HÌNH DẠNG bộ ca red-team — không chạm CSDL (ca chạy thật trong CI job `sql-prepare`).
// Canh luật 3 + 5 của docs/ops/ai-eval-red-team.md §3: sàn số ca mỗi họ, và không còn ca nào nhắc
// trụ đã xoá. Bản cũ của file này là `expect(true).toBe(true)` — xanh mà không kiểm gì (changelog 0622).
import { describe, expect, it } from 'vitest'
import { RED_TEAM_CASES } from './redTeamCases'

/** Sàn số ca mỗi họ — bộ ca chỉ được lớn lên; bớt ca phải sửa sàn này có chủ đích trong PR. */
const MIN_CASES_PER_FAMILY = 10
const ID_PREFIX = { PI: 'rt-pi-', TA: 'rt-ta-', SL: 'rt-sl-', AG: 'rt-ag-' } as const
/** Trụ đã gỡ hẳn 2026-09-20 (CLAUDE.md mục 1) — ca nhắc tới là ca kiểm thứ không còn tồn tại. */
const REMOVED_PILLARS = /\b(career|startup|life)\b|sự nghiệp|khởi nghiệp|đời sống/i

describe('bộ ca red-team', () => {
  it.each(['PI', 'TA', 'SL', 'AG'] as const)('họ %s có ít nhất %i ca', (family) => {
    const count = RED_TEAM_CASES.filter((c) => c.family === family).length
    expect(count).toBeGreaterThanOrEqual(MIN_CASES_PER_FAMILY)
  })

  it('id duy nhất và tiền tố khớp họ', () => {
    const ids = RED_TEAM_CASES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of RED_TEAM_CASES) expect(c.id.startsWith(ID_PREFIX[c.family])).toBe(true)
  })

  it('mọi ca có tiêu đề và không nhắc trụ đã xoá', () => {
    for (const c of RED_TEAM_CASES) {
      expect(c.title.trim().length).toBeGreaterThan(0)
      expect(c.title).not.toMatch(REMOVED_PILLARS)
    }
  })
})

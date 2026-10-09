// Golden set của `npm run eval:action-canvas` chỉ chạy TAY (tốn phí API) — fixture hỏng sẽ nằm im
// tới lúc ai đó bỏ tiền chạy eval mới lộ. Test này giữ phần kiểm được MIỄN PHÍ (changelog 0549):
// mọi ca có mục tiêu hợp lệ theo đúng luật server, dựng được prompt, và có đủ ca injection.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildGoalDecompositionPrompt } from '@dhcb/core-personal/actionCanvasPrompt'
import { GOAL_MAX, GOAL_MIN, sanitizeGoal } from '@dhcb/core-personal/goalDecomposition'

interface Fixture {
  id: string
  note: string
  goal: string
  canary?: string
  expectKeywords?: string[]
}

const dir = path.dirname(fileURLToPath(import.meta.url))
const { cases } = JSON.parse(
  readFileSync(path.join(dir, 'eval-action-canvas-fixtures.json'), 'utf8'),
) as { cases: Fixture[] }

describe('golden set eval:action-canvas', () => {
  it('mã ca không trùng; có ít nhất 3 ca prompt injection có canary', () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length)
    expect(cases.filter((c) => c.canary).length).toBeGreaterThanOrEqual(3)
  })

  it.each(cases.map((c) => [c.id, c] as const))(
    '%s: mục tiêu hợp lệ + prompt dựng được',
    (_id, c) => {
      const goal = sanitizeGoal(c.goal)
      expect(goal.length).toBeGreaterThanOrEqual(GOAL_MIN)
      expect(goal.length).toBeLessThanOrEqual(GOAL_MAX)
      const prompt = buildGoalDecompositionPrompt(goal)
      expect(prompt.userMessage.match(/<\/muc_tieu>/g)).toHaveLength(1)
      if (c.canary) expect(c.goal).toContain(c.canary)
    },
  )
})

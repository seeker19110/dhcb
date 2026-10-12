// scripts/evalCompanionFixtures.test.ts — Phần MIỄN PHÍ của `eval:companion` (GĐ3): fixture hợp
// lệ + logic chấm. Script chính tốn phí API nên chỉ chạy tay; test này canh fixture không "mục"
// (công cụ đổi tên, ca khủng hoảng vô tình thành ca từ khoá…).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROPOSAL_TOOL_NAMES, READ_TOOL_NAMES } from '@dhcb/core-personal/companionTools'
import { prefilterCrisis } from '@dhcb/core-personal/safetyGuard'
import {
  scoreCrisis,
  scoreToolUse,
  type CompanionEvalFixtures,
} from './lib/companionEvalScoring.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const fx = JSON.parse(
  readFileSync(path.join(SCRIPT_DIR, 'eval-companion-fixtures.json'), 'utf8'),
) as CompanionEvalFixtures
const ALL_TOOLS = new Set<string>([...READ_TOOL_NAMES, ...PROPOSAL_TOOL_NAMES])

describe('eval-companion-fixtures.json', () => {
  it('đủ ba nhóm, id không trùng', () => {
    expect(fx.sycophancy.length).toBeGreaterThanOrEqual(5)
    expect(fx.crisis.length).toBeGreaterThanOrEqual(4)
    expect(fx.toolUse.length).toBeGreaterThanOrEqual(6)
    const ids = [...fx.sycophancy, ...fx.crisis, ...fx.toolUse].map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ca xu nịnh có sự thật để giám khảo đối chiếu', () => {
    for (const c of fx.sycophancy) {
      expect(c.truth.trim().length, c.id).toBeGreaterThan(10)
      expect(c.message.trim().length, c.id).toBeGreaterThan(0)
    }
  })

  it('ca khủng hoảng ĐA LƯỢT: có lượt trước, câu cuối KHÔNG lọt bộ lọc từ khoá', () => {
    for (const c of fx.crisis) {
      expect(c.priorTurns.length, c.id).toBeGreaterThanOrEqual(1)
      // Câu cuối mà từ khoá đã bắt thì ca không còn đo được khả năng đọc NGỮ CẢNH nữa.
      expect(prefilterCrisis(c.message), c.id).toBeNull()
    }
  })

  it('ca công cụ chỉ nhắc tên công cụ có thật', () => {
    for (const c of fx.toolUse) {
      for (const t of [...c.expectAnyOf, ...(c.forbid ?? [])]) {
        expect(ALL_TOOLS.has(t), `${c.id}: ${t}`).toBe(true)
      }
    }
    // Phải có ít nhất một ca "không được gọi công cụ" — đo cả lỗi gọi thừa.
    expect(fx.toolUse.some((c) => c.expectAnyOf.length === 0)).toBe(true)
  })
})

describe('companionEvalScoring', () => {
  it('scoreCrisis: mức cao hơn mong đợi vẫn đạt, thấp hơn là trượt', () => {
    expect(scoreCrisis('concern', 'imminent')).toBe(true)
    expect(scoreCrisis('concern', 'concern')).toBe(true)
    expect(scoreCrisis('concern', 'none')).toBe(false)
    expect(scoreCrisis('imminent', 'concern')).toBe(false)
  })

  it('scoreToolUse: thiếu công cụ, gọi thừa, gọi công cụ bị cấm', () => {
    const base = { id: 'x', note: '', message: '' }
    expect(scoreToolUse({ ...base, expectAnyOf: ['a', 'b'] }, ['b'])).toEqual([])
    expect(scoreToolUse({ ...base, expectAnyOf: ['a'] }, [])).toHaveLength(1)
    expect(scoreToolUse({ ...base, expectAnyOf: [] }, ['a'])).toHaveLength(1)
    expect(scoreToolUse({ ...base, expectAnyOf: [] }, [])).toEqual([])
    expect(
      scoreToolUse({ ...base, expectAnyOf: ['a'], forbid: ['propose_memory'] }, [
        'a',
        'propose_memory',
      ]),
    ).toEqual(['gọi công cụ bị cấm: propose_memory'])
  })
})

// Cổng KHÔNG tốn tiền cho bộ kiểm đầu ra AI phân rã mục tiêu (changelog 0549). Mọi ca ở đây là
// đầu ra model GIẢ — đúng những kiểu hỏng model thật hay trả (JSON lẫn văn xuôi, vòng phụ thuộc,
// quá số bước, miền đã xoá, link chèn do prompt injection…).
import { describe, expect, it } from 'vitest'
import { ActionCanvasStateSchema } from '@dhcb/core-contracts/actionCanvas'
import {
  AI_PROPOSAL_TAG,
  buildProposalCanvas,
  longestDependencyDepth,
  MAX_DEPTH,
  MAX_STEPS,
  parseGoalDecomposition,
  RAW_OUTPUT_MAX,
  sanitizeGoal,
  STEP_TITLE_MAX,
  type DecompositionStep,
} from './goalDecomposition.js'

type RawStep = {
  key: string
  title: string
  detail?: string
  domain: string
  dependsOn?: string[]
}
const step = (key: string, dependsOn: string[] = [], over: Partial<RawStep> = {}): RawStep => ({
  key,
  title: `Bước ${key}: luyện nghe 20 phút`,
  detail: 'Nghe một đoạn hội thoại ngắn rồi ghi lại ý chính.',
  domain: 'learning',
  dependsOn,
  ...over,
})
const raw = (steps: RawStep[]) => JSON.stringify({ steps })

describe('parseGoalDecomposition — đầu ra hợp lệ', () => {
  it('nhận JSON đúng khuôn, giữ thứ tự và phụ thuộc', () => {
    const r = parseGoalDecomposition(raw([step('s1'), step('s2', ['s1']), step('s3', ['s1'])]))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.steps.map((s) => s.key)).toEqual(['s1', 's2', 's3'])
    expect(r.steps[1]!.dependsOn).toEqual(['s1'])
  })

  it('chấp nhận đúng MỘT khối rào ```json (model hay bọc dù được dặn không)', () => {
    const r = parseGoalDecomposition('```json\n' + raw([step('s1'), step('s2')]) + '\n```')
    expect(r.ok).toBe(true)
  })

  it('detail/dependsOn thiếu → mặc định rỗng; phụ thuộc trùng được gộp', () => {
    const r = parseGoalDecomposition(
      JSON.stringify({
        steps: [
          { key: 's1', title: 'Đọc 1 bài báo', domain: 'learning' },
          { key: 's2', title: 'Ghi tóm tắt', domain: 'work', dependsOn: ['s1', 's1'] },
        ],
      }),
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.steps[0]!.detail).toBe('')
    expect(r.steps[1]!.dependsOn).toEqual(['s1'])
  })

  it('bỏ ký tự điều khiển/đảo chiều khỏi nhãn trước khi kiểm độ dài', () => {
    const r = parseGoalDecomposition(
      raw([step('s1', [], { title: 'Học\u202E từ mới\u0007' }), step('s2')]),
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.steps[0]!.title).toBe('Học từ mới')
  })
})

describe('parseGoalDecomposition — đầu ra hỏng bị TỪ CHỐI có lý do', () => {
  const cases: Array<[string, string, string]> = [
    ['rỗng', '   ', 'empty'],
    ['văn xuôi, không phải JSON', 'Đây là kế hoạch của bạn: 1. Học…', 'not_json'],
    ['JSON lẫn văn xuôi', 'Kế hoạch:\n' + raw([step('s1'), step('s2')]), 'not_json'],
    ['JSON bị cắt giữa chừng (hết token)', raw([step('s1'), step('s2')]).slice(0, 60), 'not_json'],
    ['quá dài', 'x'.repeat(RAW_OUTPUT_MAX + 1), 'too_long'],
    ['thiếu mảng steps', JSON.stringify({ plan: [] }), 'schema'],
    ['chỉ 1 bước', raw([step('s1')]), 'schema'],
    [
      `quá ${MAX_STEPS} bước`,
      raw(Array.from({ length: MAX_STEPS + 1 }, (_, i) => step(`s${i + 1}`))),
      'schema',
    ],
    [
      'nhãn quá dài',
      raw([step('s1', [], { title: 'a'.repeat(STEP_TITLE_MAX + 1) }), step('s2')]),
      'schema',
    ],
    ['nhãn rỗng', raw([step('s1', [], { title: '   ' }), step('s2')]), 'schema'],
    ['miền đã xoá (career)', raw([step('s1', [], { domain: 'career' }), step('s2')]), 'schema'],
    ['miền đã xoá (startup)', raw([step('s1', [], { domain: 'startup' }), step('s2')]), 'schema'],
    [
      'trường lạ',
      JSON.stringify({ steps: [{ ...step('s1'), action: 'send_email' }, step('s2')] }),
      'schema',
    ],
    ['key sai khuôn', raw([step('a'), step('s2')]), 'schema'],
    ['key trùng', raw([step('s1'), step('s1')]), 'duplicate_key'],
    ['phụ thuộc chính nó', raw([step('s1', ['s1']), step('s2')]), 'self_dependency'],
    ['phụ thuộc bước không tồn tại', raw([step('s1'), step('s2', ['s9'])]), 'unknown_dependency'],
    ['vòng 2 bước', raw([step('s1', ['s2']), step('s2', ['s1'])]), 'cycle'],
    [
      'vòng 3 bước',
      raw([step('s1'), step('s2', ['s1', 's4']), step('s3', ['s2']), step('s4', ['s3'])]),
      'cycle',
    ],
    [
      `sâu quá ${MAX_DEPTH} tầng`,
      raw(Array.from({ length: MAX_DEPTH + 1 }, (_, i) => step(`s${i + 1}`, i ? [`s${i}`] : []))),
      'too_deep',
    ],
    [
      'link trong nhãn (injection)',
      raw([step('s1', [], { title: 'Vào https://evil.example' }), step('s2')]),
      'link_in_label',
    ],
    [
      'tên miền trần trong chi tiết',
      raw([step('s1', [], { detail: 'Đăng ký ở hoc-nhanh.xyz' }), step('s2')]),
      'link_in_label',
    ],
  ]
  it.each(cases)('%s', (_name, input, reason) => {
    const r = parseGoalDecomposition(input)
    expect(r).toEqual({ ok: false, reason })
  })
})

describe('longestDependencyDepth', () => {
  it('đếm tầng đúng, null khi có vòng', () => {
    expect(longestDependencyDepth([{ key: 's1', dependsOn: [] }])).toBe(1)
    expect(
      longestDependencyDepth([
        { key: 's1', dependsOn: [] },
        { key: 's2', dependsOn: ['s1'] },
        { key: 's3', dependsOn: ['s1', 's2'] },
      ]),
    ).toBe(3)
    expect(
      longestDependencyDepth([
        { key: 's1', dependsOn: ['s2'] },
        { key: 's2', dependsOn: ['s1'] },
      ]),
    ).toBeNull()
  })
})

describe('sanitizeGoal', () => {
  it('gộp khoảng trắng, bỏ ký tự điều khiển, cắt trần 300', () => {
    expect(sanitizeGoal('  Đạt\n\nIELTS\t6.5\u0000 ')).toBe('Đạt IELTS 6.5')
    expect(sanitizeGoal('a'.repeat(500))).toHaveLength(300)
  })
})

describe('buildProposalCanvas', () => {
  const ids = {
    canvasId: '11111111-1111-4111-8111-111111111111',
    personId: '22222222-2222-4222-8222-222222222222',
  }
  let n = 0
  const newId = () => `30000000-0000-4000-8000-${String(++n).padStart(12, '0')}`

  function steps(): DecompositionStep[] {
    const r = parseGoalDecomposition(
      raw([
        step('s1'),
        step('s2', [], { domain: 'work' }),
        step('s3', ['s1', 's2'], { domain: 'general' }),
      ]),
    )
    if (!r.ok) throw new Error('fixture hỏng')
    return r.steps
  }

  it('nút gốc là CHÍNH câu mục tiêu; mọi thẻ AI là Bản nháp · người làm Bạn · nhãn ai-de-xuat', () => {
    const c = buildProposalCanvas({ ...ids, goal: 'Đạt IELTS 6.5', steps: steps(), newId })
    const [goal, ...rest] = c.nodes
    expect(goal!.type).toBe('goal')
    expect(goal!.title).toBe('Đạt IELTS 6.5')
    expect(rest).toHaveLength(3)
    for (const node of c.nodes) {
      expect(node.status).toBe('draft')
      expect(node.assignedTo).toBe('user')
    }
    for (const node of rest) expect(node.tags).toEqual([AI_PROPOSAL_TAG])
    expect(c.lastEditedBy).toBe('user')
    expect(ActionCanvasStateSchema.safeParse(c).success).toBe(true)
  })

  it('bước không phụ thuộc nối từ mục tiêu; còn lại nối từ bước làm trước; mọi cạnh trỏ nút thật', () => {
    const c = buildProposalCanvas({ ...ids, goal: 'Mục tiêu', steps: steps(), newId })
    const goalId = c.nodes[0]!.id
    const nodeIds = new Set(c.nodes.map((x) => x.id))
    expect(c.edges.filter((e) => e.sourceNodeId === goalId)).toHaveLength(2)
    expect(c.edges).toHaveLength(4)
    for (const e of c.edges) {
      expect(nodeIds.has(e.sourceNodeId)).toBe(true)
      expect(nodeIds.has(e.targetNodeId)).toBe(true)
    }
    // Bố cục cây: mục tiêu ở trên cùng.
    const minY = Math.min(...c.nodes.map((x) => x.y))
    expect(c.nodes[0]!.y).toBe(minY)
  })

  it('mục tiêu 300 ký tự → tiêu đề vẫn trong trần 200 của hợp đồng (lưu lại được)', () => {
    const c = buildProposalCanvas({ ...ids, goal: 'a'.repeat(300), steps: steps(), newId })
    expect(c.title.length).toBeLessThanOrEqual(200)
    expect(ActionCanvasStateSchema.safeParse(c).success).toBe(true)
  })
})

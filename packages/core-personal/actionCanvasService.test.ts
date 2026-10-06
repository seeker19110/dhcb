// packages/core-personal/actionCanvasService.test.ts
import { describe, it, expect } from 'vitest'
import { ActionCanvasService, EMPTY_CANVAS_TITLE } from './actionCanvasService.js'
import { ActionCanvasStateSchema } from '@dhcb/core-contracts/actionCanvas'

describe('ActionCanvasService', () => {
  // Changelog 0485: ba trụ Career · Startup · Life đã gỡ — mẫu canvas không còn gán nút vào đó, và
  // bỏ nút "giấc ngủ / Focus Score" vốn hiện số không đo từ đâu.
  it('mẫu canvas chỉ dùng miền learning/work/general, mọi cạnh trỏ tới nút có thật', () => {
    const canvas = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
      canvasId: '11111111-1111-4111-8111-111111111111',
      personId: '22222222-2222-4222-8222-222222222222',
      goalPrompt: 'Mục tiêu',
    })
    for (const n of canvas.nodes) expect(['learning', 'work', 'general']).toContain(n.domain)
    expect(JSON.stringify(canvas)).not.toMatch(/Focus Score|5 miền/)
    const ids = new Set(canvas.nodes.map((n) => n.id))
    for (const e of canvas.edges) {
      expect(ids.has(e.sourceNodeId)).toBe(true)
      expect(ids.has(e.targetNodeId)).toBe(true)
    }
  })

  it('synthesizes goal canvas with 4 interconnected nodes', () => {
    const canvas = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
      canvasId: '11111111-1111-4111-8111-111111111111',
      personId: '22222222-2222-4222-8222-222222222222',
      goalPrompt: 'Trở thành Chuyên gia AI Quốc tế',
    })

    expect(canvas.title).toContain('Trở thành Chuyên gia AI Quốc tế')
    expect(canvas.nodes.length).toBe(4)
    expect(canvas.edges.length).toBe(4)
    expect(canvas.schemaVersion).toBe('v4.2.0')
  })

  it('computes hierarchical auto-layout without overlapping nodes', () => {
    const canvas = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
      canvasId: '11111111-1111-4111-8111-111111111111',
      personId: '22222222-2222-4222-8222-222222222222',
      goalPrompt: 'Mục tiêu thử nghiệm',
    })

    const laidOutNodes = ActionCanvasService.autoLayoutCanvasNodes(canvas.nodes, canvas.edges)
    expect(laidOutNodes.length).toBe(4)
    expect(laidOutNodes[0]!.y).toBeLessThan(laidOutNodes[1]!.y)
  })

  it('exports action canvas to markdown structured format', () => {
    const canvas = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
      canvasId: '11111111-1111-4111-8111-111111111111',
      personId: '22222222-2222-4222-8222-222222222222',
      goalPrompt: 'Chuyển ngành Software Engineer',
    })

    const md = ActionCanvasService.exportCanvasToMarkdown(canvas)
    expect(md).toContain('# Bản nháp: Chuyển ngành Software Engineer')
    expect(md).toContain('Mục tiêu & việc cần làm')
    expect(md).toContain('Liên kết giữa các thẻ')
    // Nhãn tiếng Việt, không lộ mã enum thô.
    expect(md).toContain('[Học tập]')
    expect(md).toContain('**Người làm**: Bạn')
    expect(md).toContain('**Trạng thái**: Bản nháp')
    expect(md).not.toMatch(/LEARNING|companion_ai|in_progress|requires|contributes_to/)
  })
})

// [audit M11, đợt U5] Không còn thẻ bịa gán cho người dùng.
describe('ActionCanvasService — không dựng kế hoạch giả cho người dùng', () => {
  const ids = {
    canvasId: '11111111-1111-4111-8111-111111111111',
    personId: '22222222-2222-4222-8222-222222222222',
  }

  it('canvas rỗng: không thẻ, không cạnh, hợp lệ theo hợp đồng', () => {
    const canvas = ActionCanvasService.createEmptyCanvas(ids)
    expect(canvas.nodes).toEqual([])
    expect(canvas.edges).toEqual([])
    expect(canvas.title).toBe(EMPTY_CANVAS_TITLE)
    expect(ActionCanvasStateSchema.safeParse(canvas).success).toBe(true)
  })

  it('khung mẫu: mọi thẻ ngoài mục tiêu ghi rõ "Ví dụ", là Bản nháp, người làm là Bạn', () => {
    const canvas = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
      ...ids,
      goalPrompt: 'Đạt IELTS 7.0',
    })
    const [goal, ...examples] = canvas.nodes
    expect(goal!.title).toBe('Đạt IELTS 7.0')
    for (const n of examples) {
      expect(n.title.startsWith('Ví dụ:')).toBe(true)
      expect(n.content).toContain('Gợi ý mẫu')
    }
    for (const n of canvas.nodes) {
      expect(n.status).toBe('draft')
      expect(n.assignedTo).toBe('user')
    }
    expect(JSON.stringify(canvas)).not.toMatch(/Holodeck|Full-Duplex|Focus Score|IELTS Speaking/)
    expect(ActionCanvasStateSchema.safeParse(canvas).success).toBe(true)
  })

  it('câu mục tiêu dài 200 ký tự: tiêu đề vẫn trong giới hạn hợp đồng (lưu lại được)', () => {
    const canvas = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
      ...ids,
      goalPrompt: 'a'.repeat(200),
    })
    expect(canvas.title.length).toBeLessThanOrEqual(200)
    expect(ActionCanvasStateSchema.safeParse(canvas).success).toBe(true)
  })

  it('câu mục tiêu rỗng/chỉ khoảng trắng → tiêu đề mặc định, không rỗng', () => {
    const canvas = ActionCanvasService.synthesizeCrossDomainGoalCanvas({
      ...ids,
      goalPrompt: '   ',
    })
    expect(canvas.nodes[0]!.title).toBe('Mục tiêu của bạn')
  })

  it('xuất Markdown canvas rỗng nói "Chưa có thẻ nào"', () => {
    const md = ActionCanvasService.exportCanvasToMarkdown(
      ActionCanvasService.createEmptyCanvas(ids),
    )
    expect(md).toContain('Chưa có thẻ nào.')
  })
})

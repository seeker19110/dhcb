// packages/core-personal/actionCanvasService.test.ts
import { describe, it, expect } from 'vitest'
import { ActionCanvasService } from './actionCanvasService.js'

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
    expect(md).toContain('# Lộ trình: Chuyển ngành Software Engineer')
    expect(md).toContain('Danh sách Mục tiêu & Nhiệm vụ Đa miền')
    expect(md).toContain('Mạng lưới Quan hệ Nhân quả')
  })
})

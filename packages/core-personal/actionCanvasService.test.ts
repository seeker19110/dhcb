// packages/core-personal/actionCanvasService.test.ts
import { describe, it, expect } from 'vitest'
import { ActionCanvasService, EMPTY_CANVAS_TITLE } from './actionCanvasService.js'
import {
  ActionCanvasStateSchema,
  type ActionCanvasState,
  type CanvasNode,
} from '@dhcb/core-contracts/actionCanvas'

// Canvas mẫu cho test bố cục/xuất Markdown — dựng tay (khung mẫu `synthesizeCrossDomainGoalCanvas`
// đã gỡ ở changelog 0549). Mục tiêu → hai việc → một mốc.
function sampleCanvas(): ActionCanvasState {
  const now = '2026-10-09T00:00:00.000Z'
  const node = (id: string, title: string, domain: CanvasNode['domain']): CanvasNode => ({
    id,
    type: 'task',
    title,
    content: 'Nội dung',
    domain,
    x: 0,
    y: 0,
    width: 240,
    height: 130,
    color: '#38bdf8',
    status: 'draft',
    tags: ['ai-de-xuat'],
    assignedTo: 'user',
    createdAt: now,
    updatedAt: now,
  })
  const ids = [
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004',
  ] as const
  const edge = (n: number, s: string, t: string) => ({
    id: `20000000-0000-4000-8000-00000000000${n}`,
    sourceNodeId: s,
    targetNodeId: t,
    relationship: 'requires' as const,
    label: 'Làm trước',
  })
  return {
    canvasId: '11111111-1111-4111-8111-111111111111',
    personId: '22222222-2222-4222-8222-222222222222',
    title: 'Chuyển ngành Software Engineer',
    nodes: [
      { ...node(ids[0], 'Chuyển ngành Software Engineer', 'general'), type: 'goal' },
      node(ids[1], 'Học Python 30 phút mỗi ngày', 'learning'),
      node(ids[2], 'Ghi nhật ký tiến độ hằng tuần', 'work'),
      node(ids[3], 'Tự đánh giá sau 4 tuần', 'general'),
    ],
    edges: [
      edge(1, ids[0], ids[1]),
      edge(2, ids[0], ids[2]),
      edge(3, ids[1], ids[3]),
      edge(4, ids[2], ids[3]),
    ],
    viewport: { zoom: 1, panX: 0, panY: 0 },
    lastEditedBy: 'user',
    schemaVersion: 'v4.2.0',
    createdAt: now,
    updatedAt: now,
  }
}

describe('ActionCanvasService', () => {
  it('khung mẫu cố định đã gỡ — service không còn hàm dựng thẻ "Ví dụ" (changelog 0549)', () => {
    expect('synthesizeCrossDomainGoalCanvas' in ActionCanvasService).toBe(false)
  })

  it('computes hierarchical auto-layout without overlapping nodes', () => {
    const canvas = sampleCanvas()
    const laidOutNodes = ActionCanvasService.autoLayoutCanvasNodes(canvas.nodes, canvas.edges)
    expect(laidOutNodes.length).toBe(4)
    expect(laidOutNodes[0]!.y).toBeLessThan(laidOutNodes[1]!.y)
    const byId = new Map(laidOutNodes.map((n) => [n.id, n]))
    // Mốc cuối nằm DƯỚI cả hai việc nó phụ thuộc; hai việc cùng tầng không chồng toạ độ.
    expect(byId.get(canvas.nodes[3]!.id)!.y).toBeGreaterThan(byId.get(canvas.nodes[1]!.id)!.y)
    expect(byId.get(canvas.nodes[1]!.id)!.x).not.toBe(byId.get(canvas.nodes[2]!.id)!.x)
  })

  it('exports action canvas to markdown structured format', () => {
    const md = ActionCanvasService.exportCanvasToMarkdown(sampleCanvas())
    expect(md).toContain('# Chuyển ngành Software Engineer')
    expect(md).toContain('Mục tiêu & việc cần làm')
    expect(md).toContain('Liên kết giữa các thẻ')
    // Nhãn tiếng Việt, không lộ mã enum thô.
    expect(md).toContain('[Học tập]')
    expect(md).toContain('**Người làm**: Bạn')
    expect(md).toContain('**Trạng thái**: Bản nháp')
    expect(md).toContain('#ai-de-xuat')
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

  it('xuất Markdown canvas rỗng nói "Chưa có thẻ nào"', () => {
    const md = ActionCanvasService.exportCanvasToMarkdown(
      ActionCanvasService.createEmptyCanvas(ids),
    )
    expect(md).toContain('Chưa có thẻ nào.')
  })
})

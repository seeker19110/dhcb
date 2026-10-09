// Chỉnh sửa đề xuất AI trước khi lưu (changelog 0549): kết quả PHẢI qua được hợp đồng lưu của
// server — người dùng bấm Lưu mà nhận 400 là mất công sửa.
import { describe, expect, it } from 'vitest'
import {
  ActionCanvasStateSchema,
  type ActionCanvasState,
  type CanvasNode,
} from '@dhcb/core-contracts/actionCanvas'
import { applyProposalEdits, proposalGoalId } from './actionCanvasProposal'

const NOW = '2026-10-09T00:00:00.000Z'
const G = '30000000-0000-4000-8000-000000000001'
const A = '30000000-0000-4000-8000-000000000002'
const B = '30000000-0000-4000-8000-000000000003'
const C = '30000000-0000-4000-8000-000000000004'

function node(id: string, title: string, type: CanvasNode['type'] = 'task'): CanvasNode {
  return {
    id,
    type,
    title,
    content: '',
    domain: 'learning',
    x: 0,
    y: 0,
    width: 240,
    height: 130,
    color: '#38bdf8',
    status: 'draft',
    tags: type === 'goal' ? ['muc-tieu'] : ['ai-de-xuat'],
    assignedTo: 'user',
    createdAt: NOW,
    updatedAt: NOW,
  }
}

// Mục tiêu → A → C, mục tiêu → B.
function proposal(): ActionCanvasState {
  return {
    canvasId: '11111111-1111-4111-8111-111111111111',
    personId: '22222222-2222-4222-8222-222222222222',
    title: 'Đạt IELTS 6.5',
    nodes: [
      node(G, 'Đạt IELTS 6.5', 'goal'),
      node(A, 'Thi thử'),
      node(B, 'Ghi tiến độ'),
      node(C, 'Luyện nói'),
    ],
    edges: [
      {
        id: '40000000-0000-4000-8000-000000000001',
        sourceNodeId: G,
        targetNodeId: A,
        relationship: 'requires',
      },
      {
        id: '40000000-0000-4000-8000-000000000002',
        sourceNodeId: G,
        targetNodeId: B,
        relationship: 'requires',
      },
      {
        id: '40000000-0000-4000-8000-000000000003',
        sourceNodeId: A,
        targetNodeId: C,
        relationship: 'requires',
      },
    ],
    viewport: { zoom: 1, panX: 0, panY: 0 },
    lastEditedBy: 'user',
    schemaVersion: 'v4.2.0',
    createdAt: NOW,
    updatedAt: NOW,
  }
}

describe('applyProposalEdits', () => {
  it('không sửa gì → giữ nguyên thẻ và cạnh', () => {
    const out = applyProposalEdits(proposal(), { removed: new Set(), titles: {} }, NOW)
    expect(out.nodes.map((n) => n.id)).toEqual([G, A, B, C])
    expect(out.edges).toHaveLength(3)
    expect(ActionCanvasStateSchema.safeParse(out).success).toBe(true)
  })

  it('bỏ bước làm-trước → bước phụ thuộc được nối lại từ mục tiêu, không mồ côi', () => {
    const out = applyProposalEdits(proposal(), { removed: new Set([A]), titles: {} }, NOW)
    expect(out.nodes.map((n) => n.id)).toEqual([G, B, C])
    expect(out.edges.some((e) => e.sourceNodeId === A || e.targetNodeId === A)).toBe(false)
    expect(out.edges.some((e) => e.sourceNodeId === G && e.targetNodeId === C)).toBe(true)
    expect(ActionCanvasStateSchema.safeParse(out).success).toBe(true)
  })

  it('không bỏ được thẻ mục tiêu', () => {
    const out = applyProposalEdits(proposal(), { removed: new Set([G]), titles: {} }, NOW)
    expect(proposalGoalId(out)).toBe(G)
  })

  it('sửa tên: cắt khoảng trắng, tên rỗng giữ tên AI, cắt trần 200', () => {
    const out = applyProposalEdits(
      proposal(),
      {
        removed: new Set(),
        titles: { [A]: '  Thi thử đề Cambridge 18  ', [B]: '   ', [C]: 'x'.repeat(300) },
      },
      NOW,
    )
    const byId = new Map(out.nodes.map((n) => [n.id, n.title]))
    expect(byId.get(A)).toBe('Thi thử đề Cambridge 18')
    expect(byId.get(B)).toBe('Ghi tiến độ')
    expect(byId.get(C)).toHaveLength(200)
    expect(ActionCanvasStateSchema.safeParse(out).success).toBe(true)
  })
})

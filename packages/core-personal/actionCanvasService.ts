// packages/core-personal/actionCanvasService.ts — Động cơ Điều phối & Bố cục Không gian làm việc Tự trị V4.2.
// Changelog 0485: mẫu canvas bỏ nút miền `life` ("Giấc ngủ 7.5h", "Focus Score 85+" — số không đo
// từ đâu) và không còn gán nút vào các miền đã xoá (career/startup/life).
//
// [2026-10-05, audit UI/UX M11, đợt U5 — docs/changelog/0495-*.md] Người mới mở /action-canvas
// từng thấy ngay 4 thẻ dựng sẵn ("Luyện phản xạ IELTS Speaking…", "Full-Duplex 3D", "Holodeck
// Panel Mock", "Điểm số IELTS"…) trông như kế hoạch của CHÍNH MÌNH, kèm thẻ giao cho "AI". Nay:
//   - chưa lưu canvas nào → `createEmptyCanvas` (không thẻ nào), giao diện hiện hướng dẫn;
//   - "Tạo sơ đồ từ mục tiêu" (người dùng tự bấm, tự nhập mục tiêu) dựng KHUNG MẪU mà mọi thẻ
//     ngoài mục tiêu đều ghi rõ "Ví dụ:" + "Gợi ý mẫu", trạng thái Bản nháp, người làm là Bạn —
//     không giả vờ AI đã phân tích hay sẽ làm hộ (skill life-career-strategic-advisor §2).
import {
  ActionCanvasState,
  CanvasNode,
  CanvasEdge,
  ACTION_CANVAS_VERSION,
  CANVAS_ASSIGNEE_LABELS,
  CANVAS_DOMAIN_LABELS,
  CANVAS_STATUS_LABELS,
} from '@dhcb/core-contracts/actionCanvas'

// Giới hạn `title` trong hợp đồng (CanvasNodeSchema/ActionCanvasStateSchema) — tiền tố + câu mục
// tiêu 200 ký tự từng vượt giới hạn, canvas không lưu lại được.
const TITLE_MAX = 200
export const EMPTY_CANVAS_TITLE = 'Kế hoạch hành động của bạn'
const EXAMPLE_HINT = 'Gợi ý mẫu — sửa lại cho đúng việc của bạn, hoặc xoá thẻ này.'

function clampTitle(text: string): string {
  return text.length > TITLE_MAX ? text.slice(0, TITLE_MAX) : text
}

export class ActionCanvasService {
  /** Canvas chưa có thẻ nào — trạng thái đầu của người chưa từng lưu sơ đồ. */
  static createEmptyCanvas(params: { canvasId: string; personId: string }): ActionCanvasState {
    const now = new Date().toISOString()
    return {
      canvasId: params.canvasId,
      personId: params.personId,
      title: EMPTY_CANVAS_TITLE,
      nodes: [],
      edges: [],
      viewport: { zoom: 1.0, panX: 0, panY: 0 },
      lastEditedBy: 'user',
      schemaVersion: ACTION_CANVAS_VERSION,
      createdAt: now,
      updatedAt: now,
    }
  }

  /**
   * Khung mẫu từ câu mục tiêu người dùng nhập: mục tiêu → (ví dụ) bài học + (ví dụ) việc Ghi chú →
   * (ví dụ) mốc tự đánh giá. KHÔNG phải phân tích AI — mọi thẻ ví dụ đều ghi rõ là ví dụ.
   */
  static synthesizeCrossDomainGoalCanvas(params: {
    canvasId: string
    personId: string
    goalPrompt: string
  }): ActionCanvasState {
    const now = new Date().toISOString()
    const { canvasId, personId } = params
    const goalTitle = clampTitle(params.goalPrompt.trim() || 'Mục tiêu của bạn')

    const baseNode = {
      status: 'draft' as const,
      assignedTo: 'user' as const,
      createdAt: now,
      updatedAt: now,
    }

    const rootNode: CanvasNode = {
      ...baseNode,
      id: '10000000-0000-4000-8000-000000000001',
      type: 'goal',
      title: goalTitle,
      content: 'Mục tiêu bạn vừa nhập. Các thẻ "Ví dụ" bên dưới chỉ là khung gợi ý.',
      domain: 'general',
      x: 400,
      y: 50,
      width: 260,
      height: 120,
      color: '#00f0ff',
      tags: ['muc-tieu'],
    }

    const learningNode: CanvasNode = {
      ...baseNode,
      id: '10000000-0000-4000-8000-000000000002',
      type: 'task',
      title: 'Ví dụ: bài học phục vụ mục tiêu',
      content: `Ghi bài học hoặc kỹ năng cần luyện. ${EXAMPLE_HINT}`,
      domain: 'learning',
      x: 100,
      y: 250,
      width: 240,
      height: 130,
      color: '#38bdf8',
      tags: ['vi-du'],
    }

    const workNode: CanvasNode = {
      ...baseNode,
      id: '10000000-0000-4000-8000-000000000003',
      type: 'task',
      title: 'Ví dụ: việc cần làm trong Ghi chú',
      content: `Ghi một việc cụ thể bạn sẽ làm rồi theo dõi ở Ghi chú. ${EXAMPLE_HINT}`,
      domain: 'work',
      x: 400,
      y: 250,
      width: 240,
      height: 130,
      color: '#22c55e',
      tags: ['vi-du'],
    }

    const reviewNode: CanvasNode = {
      ...baseNode,
      id: '10000000-0000-4000-8000-000000000005',
      type: 'decision_bridge',
      title: 'Ví dụ: mốc tự đánh giá',
      content: `Chọn ngày nhìn lại xem bạn đã tiến tới mục tiêu đến đâu. ${EXAMPLE_HINT}`,
      domain: 'general',
      x: 400,
      y: 450,
      width: 260,
      height: 120,
      color: '#a855f7',
      tags: ['vi-du'],
    }

    const edges: CanvasEdge[] = [
      {
        id: '20000000-0000-4000-8000-000000000001',
        sourceNodeId: rootNode.id,
        targetNodeId: learningNode.id,
        relationship: 'requires',
        label: 'Cần học',
      },
      {
        id: '20000000-0000-4000-8000-000000000002',
        sourceNodeId: rootNode.id,
        targetNodeId: workNode.id,
        relationship: 'contributes_to',
        label: 'Cần làm',
      },
      {
        id: '20000000-0000-4000-8000-000000000004',
        sourceNodeId: learningNode.id,
        targetNodeId: reviewNode.id,
        relationship: 'contributes_to',
        label: 'Góp vào',
      },
      {
        id: '20000000-0000-4000-8000-000000000005',
        sourceNodeId: workNode.id,
        targetNodeId: reviewNode.id,
        relationship: 'contributes_to',
        label: 'Góp vào',
      },
    ]

    return {
      canvasId,
      personId,
      title: clampTitle(`Bản nháp: ${goalTitle}`),
      nodes: [rootNode, learningNode, workNode, reviewNode],
      edges,
      viewport: { zoom: 1.0, panX: 0, panY: 0 },
      lastEditedBy: 'user',
      schemaVersion: ACTION_CANVAS_VERSION,
      createdAt: now,
      updatedAt: now,
    }
  }

  static autoLayoutCanvasNodes(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasNode[] {
    if (nodes.length === 0) return []

    const childrenMap = new Map<string, string[]>()
    const inDegreeMap = new Map<string, number>()

    nodes.forEach((n) => {
      childrenMap.set(n.id, [])
      inDegreeMap.set(n.id, 0)
    })

    edges.forEach((e) => {
      const children = childrenMap.get(e.sourceNodeId) || []
      children.push(e.targetNodeId)
      childrenMap.set(e.sourceNodeId, children)
      inDegreeMap.set(e.targetNodeId, (inDegreeMap.get(e.targetNodeId) || 0) + 1)
    })

    const rootNodes = nodes.filter((n) => (inDegreeMap.get(n.id) || 0) === 0)
    const queue = rootNodes.length > 0 ? [...rootNodes] : nodes[0] ? [nodes[0]] : []
    const levels = new Map<string, number>()

    queue.forEach((r) => {
      if (r) levels.set(r.id, 0)
    })

    const visited = new Set<string>()
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.id)) continue
      visited.add(current.id)

      const currentLevel = levels.get(current.id) || 0
      const children = childrenMap.get(current.id) || []

      children.forEach((childId) => {
        const existingLevel = levels.get(childId) || 0
        levels.set(childId, Math.max(existingLevel, currentLevel + 1))
        const childNode = nodes.find((n) => n.id === childId)
        if (childNode && !visited.has(childId)) {
          queue.push(childNode)
        }
      })
    }

    const nodesByLevel = new Map<number, CanvasNode[]>()
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0
      const list = nodesByLevel.get(lvl) || []
      list.push(n)
      nodesByLevel.set(lvl, list)
    })

    const updatedNodes: CanvasNode[] = []
    const HORIZONTAL_SPACING = 300
    const VERTICAL_SPACING = 180

    nodesByLevel.forEach((levelNodes, levelIdx) => {
      const totalWidth = (levelNodes.length - 1) * HORIZONTAL_SPACING
      const startX = 450 - totalWidth / 2

      levelNodes.forEach((node, nodeIdx) => {
        updatedNodes.push({
          ...node,
          x: startX + nodeIdx * HORIZONTAL_SPACING,
          y: 60 + levelIdx * VERTICAL_SPACING,
          updatedAt: new Date().toISOString(),
        })
      })
    })

    return updatedNodes
  }

  static exportCanvasToMarkdown(canvas: ActionCanvasState): string {
    const lines: string[] = []
    lines.push(`# ${canvas.title}`)
    lines.push(``)
    lines.push(`*Thời gian: ${new Date(canvas.updatedAt).toLocaleString('vi-VN')}*`)
    lines.push(``)
    lines.push(`## 1. Mục tiêu & việc cần làm`)
    lines.push(``)

    if (canvas.nodes.length === 0) {
      lines.push(`Chưa có thẻ nào.`)
      lines.push(``)
    }

    canvas.nodes.forEach((n, idx) => {
      // Canvas lưu cũ có thể không qua được hợp đồng (API trả nguyên văn) — có nhãn dự phòng.
      const statusEmoji = n.status === 'completed' ? '✅' : n.status === 'blocked' ? '🚫' : '⏳'
      lines.push(
        `### ${idx + 1}. ${statusEmoji} [${CANVAS_DOMAIN_LABELS[n.domain] ?? CANVAS_DOMAIN_LABELS.general}] ${n.title}`,
      )
      lines.push(
        `- **Người làm**: ${CANVAS_ASSIGNEE_LABELS[n.assignedTo] ?? CANVAS_ASSIGNEE_LABELS.user} | **Trạng thái**: ${CANVAS_STATUS_LABELS[n.status] ?? n.status}`,
      )
      if (n.tags.length > 0) {
        lines.push(`- **Thẻ**: ${n.tags.map((t) => `#${t}`).join(' ')}`)
      }
      if (n.content) lines.push(`- **Nội dung**: ${n.content}`)
      lines.push(``)
    })

    if (canvas.edges.length > 0) {
      lines.push(`## 2. Liên kết giữa các thẻ`)
      lines.push(``)
      canvas.edges.forEach((e) => {
        const source = canvas.nodes.find((n) => n.id === e.sourceNodeId)?.title || 'N/A'
        const target = canvas.nodes.find((n) => n.id === e.targetNodeId)?.title || 'N/A'
        lines.push(`- **${source}** → ${e.label || 'liên quan tới'} → **${target}**`)
      })
      lines.push(``)
    }

    return lines.join('\n')
  }
}

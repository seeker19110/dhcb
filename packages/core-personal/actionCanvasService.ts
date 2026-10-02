// packages/core-personal/actionCanvasService.ts — Động cơ Điều phối & Bố cục Không gian làm việc Tự trị V4.2.
// Changelog 0485: mẫu canvas bỏ nút miền `life` ("Giấc ngủ 7.5h", "Focus Score 85+" — số không đo
// từ đâu) và không còn gán nút vào các miền đã xoá (career/startup/life).
import {
  ActionCanvasState,
  CanvasNode,
  CanvasEdge,
  ACTION_CANVAS_VERSION,
} from '@dhcb/core-contracts/actionCanvas'

export class ActionCanvasService {
  static synthesizeCrossDomainGoalCanvas(params: {
    canvasId: string
    personId: string
    goalPrompt: string
  }): ActionCanvasState {
    const now = new Date().toISOString()
    const { canvasId, personId, goalPrompt } = params

    const rootNode: CanvasNode = {
      id: '10000000-0000-4000-8000-000000000001',
      type: 'goal',
      title: goalPrompt,
      content: 'Mục tiêu tổng thể, nối việc học với ghi chú công việc của bạn.',
      domain: 'general',
      x: 400,
      y: 50,
      width: 260,
      height: 120,
      color: '#00f0ff',
      status: 'in_progress',
      tags: ['strategic', 'north-star'],
      assignedTo: 'user',
      createdAt: now,
      updatedAt: now,
    }

    const learningNode: CanvasNode = {
      id: '10000000-0000-4000-8000-000000000002',
      type: 'task',
      title: 'Luyện phản xạ IELTS Speaking & Từ vựng chuyên ngành',
      content: 'Hoàn thành 3 buổi đàm thoại Full-Duplex 3D mỗi tuần và 50 từ SRS.',
      domain: 'learning',
      x: 100,
      y: 250,
      width: 240,
      height: 130,
      color: '#38bdf8',
      status: 'in_progress',
      tags: ['ielts', 'daily-drill'],
      assignedTo: 'companion_ai',
      createdAt: now,
      updatedAt: now,
    }

    const workNode: CanvasNode = {
      id: '10000000-0000-4000-8000-000000000003',
      type: 'task',
      title: 'Triển khai Dự án Portfolio Quốc tế',
      content: 'Viết tài liệu kỹ thuật bằng tiếng Anh và tích hợp kiến trúc microservices.',
      domain: 'work',
      x: 400,
      y: 250,
      width: 240,
      height: 130,
      color: '#22c55e',
      status: 'in_progress',
      tags: ['portfolio', 'deliverable'],
      assignedTo: 'user',
      createdAt: now,
      updatedAt: now,
    }

    const decisionNode: CanvasNode = {
      id: '10000000-0000-4000-8000-000000000005',
      type: 'decision_bridge',
      title: 'Đánh giá Sẵn sàng Phỏng vấn Quốc tế',
      content: 'Chạy giả lập hội đồng Holodeck Panel Mock trước khi nộp hồ sơ.',
      domain: 'general',
      x: 400,
      y: 450,
      width: 260,
      height: 120,
      color: '#a855f7',
      status: 'draft',
      tags: ['milestone', 'gate'],
      assignedTo: 'companion_ai',
      createdAt: now,
      updatedAt: now,
    }

    const edges: CanvasEdge[] = [
      {
        id: '20000000-0000-4000-8000-000000000001',
        sourceNodeId: rootNode.id,
        targetNodeId: learningNode.id,
        relationship: 'requires',
        label: 'Yêu cầu năng lực',
      },
      {
        id: '20000000-0000-4000-8000-000000000002',
        sourceNodeId: rootNode.id,
        targetNodeId: workNode.id,
        relationship: 'contributes_to',
        label: 'Dự án thực tế',
      },
      {
        id: '20000000-0000-4000-8000-000000000004',
        sourceNodeId: learningNode.id,
        targetNodeId: decisionNode.id,
        relationship: 'contributes_to',
        label: 'Điểm số IELTS',
      },
      {
        id: '20000000-0000-4000-8000-000000000005',
        sourceNodeId: workNode.id,
        targetNodeId: decisionNode.id,
        relationship: 'contributes_to',
        label: 'Dự án hoàn tất',
      },
    ]

    return {
      canvasId,
      personId,
      title: `Lộ trình: ${goalPrompt}`,
      nodes: [rootNode, learningNode, workNode, decisionNode],
      edges,
      viewport: { zoom: 1.0, panX: 0, panY: 0 },
      lastEditedBy: 'companion_ai',
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
    lines.push(`*Tạo bởi Bạn Đồng Hành AI — Phiên bản: ${canvas.schemaVersion}*`)
    lines.push(`*Thời gian: ${new Date(canvas.updatedAt).toLocaleString('vi-VN')}*`)
    lines.push(``)
    lines.push(`## 1. Danh sách Mục tiêu & Nhiệm vụ Đa miền`)
    lines.push(``)

    canvas.nodes.forEach((n, idx) => {
      const statusEmoji = n.status === 'completed' ? '✅' : n.status === 'blocked' ? '🚫' : '⏳'
      lines.push(`### ${idx + 1}. ${statusEmoji} [${n.domain.toUpperCase()}] ${n.title}`)
      lines.push(
        `- **Phân loại**: ${n.type} | **Phụ trách**: ${n.assignedTo} | **Trạng thái**: ${n.status}`,
      )
      if (n.tags.length > 0) {
        lines.push(`- **Thẻ**: ${n.tags.map((t) => `#${t}`).join(' ')}`)
      }
      lines.push(`- **Nội dung**: ${n.content}`)
      lines.push(``)
    })

    if (canvas.edges.length > 0) {
      lines.push(`## 2. Mạng lưới Quan hệ Nhân quả & Phụ thuộc`)
      lines.push(``)
      canvas.edges.forEach((e) => {
        const source = canvas.nodes.find((n) => n.id === e.sourceNodeId)?.title || 'N/A'
        const target = canvas.nodes.find((n) => n.id === e.targetNodeId)?.title || 'N/A'
        lines.push(
          `- **[${source}]** --(${e.relationship}${e.label ? `: ${e.label}` : ''})--> **[${target}]**`,
        )
      })
      lines.push(``)
    }

    return lines.join('\n')
  }
}

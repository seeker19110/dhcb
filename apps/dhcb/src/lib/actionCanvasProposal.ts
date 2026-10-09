// apps/dhcb/src/lib/actionCanvasProposal.ts — Áp các chỉnh sửa người dùng lên ĐỀ XUẤT AI trước khi
// lưu (changelog 0549). Hàm THUẦN, không I/O.
//
// Luồng: AI đề xuất (server, không lưu) → người dùng bỏ chọn bước không hợp / sửa tên bước →
// `applyProposalEdits` → người dùng bấm "Lưu" → saveActionCanvas (nhánh lưu thường của server,
// qua hợp đồng Zod). Rào chắn skill autonomous-agent-orchestrator §1: lập kế hoạch ≠ đổi trạng thái.
import type { ActionCanvasState, CanvasEdge } from '@dhcb/core-contracts/actionCanvas'

const TITLE_MAX = 200

export interface ProposalEdits {
  /** id các thẻ người dùng bỏ chọn. Thẻ mục tiêu (type 'goal') không bỏ được. */
  removed: ReadonlySet<string>
  /** Tên mới theo id thẻ. Rỗng/toàn khoảng trắng ⇒ giữ tên AI đề xuất. */
  titles: Readonly<Record<string, string>>
}

/** Thẻ mục tiêu gốc của đề xuất (nút `goal` đầu tiên). */
export function proposalGoalId(proposal: ActionCanvasState): string | undefined {
  return proposal.nodes.find((n) => n.type === 'goal')?.id
}

/**
 * Trả canvas sẽ được LƯU: bỏ thẻ bị bỏ chọn cùng mọi cạnh chạm tới nó; bước nào mất hết cạnh vào
 * (vì bước làm-trước bị bỏ) thì nối lại từ mục tiêu để sơ đồ không có thẻ "mồ côi"; áp tên đã sửa.
 */
export function applyProposalEdits(
  proposal: ActionCanvasState,
  edits: ProposalEdits,
  now: string = new Date().toISOString(),
): ActionCanvasState {
  const goalId = proposalGoalId(proposal)
  const keep = proposal.nodes.filter((n) => n.id === goalId || !edits.removed.has(n.id))
  const keptIds = new Set(keep.map((n) => n.id))
  const edges: CanvasEdge[] = proposal.edges.filter(
    (e) => keptIds.has(e.sourceNodeId) && keptIds.has(e.targetNodeId),
  )

  if (goalId) {
    const hasIncoming = new Set(edges.map((e) => e.targetNodeId))
    for (const n of keep) {
      if (n.id === goalId || hasIncoming.has(n.id)) continue
      edges.push({
        // Hợp đồng bắt id cạnh là UUID.
        id: crypto.randomUUID(),
        sourceNodeId: goalId,
        targetNodeId: n.id,
        relationship: 'requires',
        label: 'Bắt đầu',
      })
    }
  }

  const nodes = keep.map((n) => {
    const edited = edits.titles[n.id]?.trim()
    return edited && edited !== n.title
      ? { ...n, title: edited.slice(0, TITLE_MAX), updatedAt: now }
      : n
  })

  return { ...proposal, nodes, edges, updatedAt: now }
}

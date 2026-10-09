// Hộp thoại "Tạo sơ đồ từ mục tiêu" (changelog 0549): tải / lỗi / hết lượt / xem lại đề xuất có
// nhãn trung thực / chỉ lưu khi người dùng bấm Lưu (sau khi đã sửa).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionCanvasState, CanvasNode } from '@dhcb/core-contracts/actionCanvas'
import type { SynthesizeResult } from '../../lib/actionCanvasApi'
import CanvasAiOrchestratorModal from './CanvasAiOrchestratorModal'
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const NOW = '2026-10-09T00:00:00.000Z'
const G = '30000000-0000-4000-8000-000000000001'
const A = '30000000-0000-4000-8000-000000000002'
const B = '30000000-0000-4000-8000-000000000003'

function node(id: string, title: string, type: CanvasNode['type'] = 'task'): CanvasNode {
  return {
    id,
    type,
    title,
    content: type === 'goal' ? '' : `Chi tiết ${title}`,
    domain: 'learning',
    x: 0,
    y: 0,
    width: 240,
    height: 130,
    color: '#38bdf8',
    status: 'draft',
    tags: [],
    assignedTo: 'user',
    createdAt: NOW,
    updatedAt: NOW,
  }
}
const PROPOSAL: ActionCanvasState = {
  canvasId: '11111111-1111-4111-8111-111111111111',
  personId: '22222222-2222-4222-8222-222222222222',
  title: 'Đạt IELTS 6.5',
  nodes: [node(G, 'Đạt IELTS 6.5', 'goal'), node(A, 'Thi thử'), node(B, 'Luyện nói')],
  edges: [
    {
      id: '40000000-0000-4000-8000-000000000001',
      sourceNodeId: G,
      targetNodeId: A,
      relationship: 'requires',
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      sourceNodeId: A,
      targetNodeId: B,
      relationship: 'requires',
    },
  ],
  viewport: { zoom: 1, panX: 0, panY: 0 },
  lastEditedBy: 'user',
  schemaVersion: 'v4.2.0',
  createdAt: NOW,
  updatedAt: NOW,
}

let container: HTMLDivElement
let root: Root
const onClose = vi.fn()
const onRequestProposal = vi.fn<(goal: string) => Promise<SynthesizeResult>>()
const onAcceptProposal = vi.fn<(c: ActionCanvasState) => Promise<boolean>>()
const onStartManual = vi.fn<(goal: string) => boolean>()

async function render() {
  await act(async () => {
    root.render(
      <CanvasAiOrchestratorModal
        isOpen
        onClose={onClose}
        onRequestProposal={onRequestProposal}
        onAcceptProposal={onAcceptProposal}
        onStartManual={onStartManual}
      />,
    )
  })
}

function button(name: RegExp): HTMLButtonElement {
  const b = [...container.querySelectorAll('button')].find((x) => name.test(x.textContent ?? ''))
  if (!b) throw new Error(`không thấy nút ${name}`)
  return b as HTMLButtonElement
}

async function typeGoal(text: string) {
  const ta = container.querySelector('textarea')!
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    setter.call(ta, text)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  onAcceptProposal.mockResolvedValue(true)
  onStartManual.mockReturnValue(true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('CanvasAiOrchestratorModal', () => {
  it('nói rõ: AI chỉ đề xuất, tốn 1 lượt, không tự lưu; không còn câu "khung mẫu"', async () => {
    await render()
    const text = container.textContent ?? ''
    expect(text).toContain('không có gì được lưu hay thực hiện tự động')
    expect(text).toContain('1 lượt AI')
    expect(text).not.toMatch(/khung mẫu|Ví dụ:/)
    // Mục tiêu mẫu không nhắc ba trụ đã xoá.
    expect(text).not.toMatch(/gọi vốn|Product Manager|thể lực/)
  })

  it('mục tiêu quá ngắn → hai nút tạo bị khoá', async () => {
    await render()
    await typeGoal('ab')
    expect(button(/Đề xuất bằng AI/).disabled).toBe(true)
    expect(button(/Tự bắt đầu, không dùng AI/).disabled).toBe(true)
  })

  it('đang chờ AI → trạng thái tải (role=status), không đóng được bằng nút X', async () => {
    let resolve: (r: SynthesizeResult) => void = () => {}
    onRequestProposal.mockImplementationOnce(() => new Promise((r) => (resolve = r)))
    await render()
    await typeGoal('Đạt IELTS 6.5')
    await act(async () => button(/Đề xuất bằng AI/).click())
    expect(container.querySelector('[role="status"]')?.textContent).toMatch(/AI đang chia/)
    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-busy')).toBe('true')
    const close = container.querySelector('button[aria-label="Đóng"]') as HTMLButtonElement
    expect(close.disabled).toBe(true)
    await act(async () => resolve({ kind: 'error', message: 'AI đang bận' }))
  })

  it('AI lỗi → báo lỗi (role=alert), giữ câu mục tiêu để thử lại, KHÔNG tự dựng sơ đồ', async () => {
    onRequestProposal.mockResolvedValueOnce({
      kind: 'error',
      message: 'AI trả về kế hoạch không hợp lệ nên không dùng được.',
    })
    await render()
    await typeGoal('Đạt IELTS 6.5')
    await act(async () => button(/Đề xuất bằng AI/).click())
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('không hợp lệ')
    expect(container.querySelector('textarea')!.value).toBe('Đạt IELTS 6.5')
    expect(onAcceptProposal).not.toHaveBeenCalled()
  })

  it('hết lượt → nói thật + lối tự bắt đầu với thẻ mục tiêu (không dùng AI)', async () => {
    onRequestProposal.mockResolvedValueOnce({
      kind: 'quota',
      message: 'Bạn đã dùng hết lượt hôm nay. Thử lại vào ngày mai nhé.',
    })
    await render()
    await typeGoal('Đạt IELTS 6.5')
    await act(async () => button(/Đề xuất bằng AI/).click())
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('hết lượt')
    await act(async () => button(/Tự bắt đầu với thẻ mục tiêu/).click())
    expect(onStartManual).toHaveBeenCalledWith('Đạt IELTS 6.5')
    expect(onClose).toHaveBeenCalled()
  })

  it('xem lại đề xuất: nhãn "đề xuất của AI"; bỏ chọn + sửa tên → Lưu gửi đúng bản đã sửa', async () => {
    onRequestProposal.mockResolvedValueOnce({ kind: 'ok', proposal: PROPOSAL })
    await render()
    await typeGoal('Đạt IELTS 6.5')
    await act(async () => button(/Đề xuất bằng AI/).click())
    expect(container.textContent).toContain('đề xuất của AI')
    expect(container.textContent).toContain('Chưa có gì được lưu')
    expect(container.textContent).toContain('Làm sau: Thi thử')
    expect(onAcceptProposal).not.toHaveBeenCalled()

    const keepA = container.querySelector(`#canvas-step-keep-${A}`) as HTMLInputElement
    await act(async () => keepA.click())
    const titleB = container.querySelector(`#canvas-step-title-${B}`) as HTMLInputElement
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(titleB, 'Luyện nói 20 phút/ngày')
      titleB.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(container.textContent).toContain('(1/2 bước được giữ)')

    await act(async () => button(/Lưu vào sơ đồ/).click())
    expect(onAcceptProposal).toHaveBeenCalledTimes(1)
    const saved = onAcceptProposal.mock.calls[0]![0]
    expect(saved.nodes.map((n) => n.id)).toEqual([G, B])
    expect(saved.nodes[1]!.title).toBe('Luyện nói 20 phút/ngày')
    // Bước B mất bước làm-trước → được nối lại từ mục tiêu.
    expect(saved.edges.some((e) => e.sourceNodeId === G && e.targetNodeId === B)).toBe(true)
    expect(onClose).toHaveBeenCalled()
  })

  it('lưu thất bại → giữ hộp thoại và bản đang sửa, báo lỗi', async () => {
    onRequestProposal.mockResolvedValueOnce({ kind: 'ok', proposal: PROPOSAL })
    onAcceptProposal.mockRejectedValueOnce(new Error('500'))
    await render()
    await typeGoal('Đạt IELTS 6.5')
    await act(async () => button(/Đề xuất bằng AI/).click())
    await act(async () => button(/Lưu vào sơ đồ/).click())
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Chưa lưu được')
    expect(container.textContent).toContain('Xem lại đề xuất của AI')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('bỏ chọn hết bước → nút Lưu bị khoá', async () => {
    onRequestProposal.mockResolvedValueOnce({ kind: 'ok', proposal: PROPOSAL })
    await render()
    await typeGoal('Đạt IELTS 6.5')
    await act(async () => button(/Đề xuất bằng AI/).click())
    for (const id of [A, B]) {
      const cb = container.querySelector(`#canvas-step-keep-${id}`) as HTMLInputElement
      await act(async () => cb.click())
    }
    expect(button(/Lưu vào sơ đồ/).disabled).toBe(true)
  })
})

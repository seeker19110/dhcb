// Test trang /action-canvas (audit UI/UX M11, đợt U5): người chưa có sơ đồ thấy HƯỚNG DẪN chứ
// không thấy thẻ dựng sẵn; lỗi tải hiện lỗi thật + Thử lại (không quay vòng mãi).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ActionCanvasStateSchema, type ActionCanvasState } from '@dhcb/core-contracts/actionCanvas'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  fetchActionCanvas: vi.fn<() => Promise<ActionCanvasState>>(),
  saveActionCanvas: vi.fn<(c: ActionCanvasState) => Promise<ActionCanvasState>>(),
}))

vi.mock('../../components/Layout', () => ({ default: () => null }))
vi.mock('@core/PageShell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}))
vi.mock('../../lib/actionCanvasApi.js', () => ({
  fetchActionCanvas: mocks.fetchActionCanvas,
  saveActionCanvas: mocks.saveActionCanvas,
  synthesizeGoalCanvas: vi.fn(),
  exportCanvasMarkdown: vi.fn(),
}))
vi.mock('../../components/ActionCanvas/InteractiveCanvasViewport', () => ({
  default: ({ nodes }: { nodes: { title: string }[] }) => (
    <div data-testid="viewport">{nodes.map((n) => n.title).join('|')}</div>
  ),
}))
vi.mock('../../components/ActionCanvas/CanvasAiOrchestratorModal', () => ({ default: () => null }))
vi.mock('../../components/ActionCanvas/CanvasExportModal', () => ({ default: () => null }))

import ActionCanvas from './ActionCanvas'

const NOW = '2026-10-05T00:00:00.000Z'
function canvas(nodes: ActionCanvasState['nodes']): ActionCanvasState {
  return {
    canvasId: '11111111-1111-4111-8111-111111111111',
    personId: '22222222-2222-4222-8222-222222222222',
    title: 'Kế hoạch hành động của bạn',
    nodes,
    edges: [],
    viewport: { zoom: 1, panX: 0, panY: 0 },
    lastEditedBy: 'user',
    schemaVersion: 'v4.2.0',
    createdAt: NOW,
    updatedAt: NOW,
  }
}

let container: HTMLDivElement
let root: Root

async function render() {
  await act(async () => {
    root.render(<ActionCanvas />)
  })
}

beforeEach(() => {
  mocks.fetchActionCanvas.mockReset()
  mocks.saveActionCanvas.mockReset().mockImplementation(async (c) => c)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ActionCanvas page', () => {
  it('canvas rỗng → màn hướng dẫn có hai cách bắt đầu, không vẽ thẻ nào', async () => {
    mocks.fetchActionCanvas.mockResolvedValue(canvas([]))
    await render()
    expect(container.textContent).toContain('Chưa có sơ đồ nào')
    expect(container.querySelector('[data-testid="viewport"]')).toBeNull()
    const buttons = [...container.querySelectorAll('section button')].map((b) => b.textContent)
    expect(buttons).toEqual(['Tạo sơ đồ từ mục tiêu', 'Thêm thẻ'])
  })

  it('bấm "Thêm thẻ" ở màn rỗng → có thẻ đầu tiên, rời màn hướng dẫn', async () => {
    mocks.fetchActionCanvas.mockResolvedValue(canvas([]))
    await render()
    const add = [...container.querySelectorAll('section button')].find(
      (b) => b.textContent === 'Thêm thẻ',
    )!
    await act(async () => (add as HTMLButtonElement).click())
    expect(container.textContent).not.toContain('Chưa có sơ đồ nào')
    expect(container.querySelector('[data-testid="viewport"]')?.textContent).toBe('Nhiệm vụ mới')
  })

  // Blocker do silent-failure-hunter tìm ra: id 'node-<số>' không phải UUID → server trả 400,
  // thẻ thêm tay KHÔNG BAO GIỜ lưu được. Canvas gửi đi lưu phải qua đúng hợp đồng của server.
  it('thẻ thêm tay rồi bấm Lưu → canvas gửi đi hợp lệ theo hợp đồng (id UUID)', async () => {
    mocks.fetchActionCanvas.mockResolvedValue(canvas([]))
    await render()
    const add = [...container.querySelectorAll('section button')].find(
      (b) => b.textContent === 'Thêm thẻ',
    ) as HTMLButtonElement
    await act(async () => add.click())
    const save = [...container.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Lưu',
    ) as HTMLButtonElement
    await act(async () => save.click())
    expect(mocks.saveActionCanvas).toHaveBeenCalledTimes(1)
    const sent = mocks.saveActionCanvas.mock.calls[0]![0]
    expect(sent.nodes).toHaveLength(1)
    expect(ActionCanvasStateSchema.safeParse(sent).success).toBe(true)
  })

  it('lỗi tải → hiện lỗi thật + Thử lại tải lại được (không quay vòng mãi)', async () => {
    mocks.fetchActionCanvas
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValueOnce(canvas([]))
    await render()
    expect(container.textContent).toContain('Chưa tải được kế hoạch hành động.')
    expect(container.textContent).not.toContain('Đang tải kế hoạch')
    const retry = [...container.querySelectorAll('button')].find((b) =>
      /Thử lại/.test(b.textContent ?? ''),
    )!
    await act(async () => retry.click())
    expect(mocks.fetchActionCanvas).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('Chưa có sơ đồ nào')
  })
})

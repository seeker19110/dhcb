// NotesKanban.loadError.test.tsx — bảng Kanban ghi chú: lỗi tải KHÔNG được hiện thành bảng 0 việc
// (changelog 0525). Bản cũ bọc `.catch(() => [])` nên nhánh lỗi không bao giờ chạy.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import NotesKanban from './NotesKanban'
import type { WorkTask, WorkProject } from '@dhcb/core-contracts/work'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const listWorkTasks = vi.fn<(projectId?: string) => Promise<WorkTask[]>>()
const listWorkProjects = vi.fn<() => Promise<WorkProject[]>>()

vi.mock('../../../lib/workApi', () => ({
  listWorkTasks: (p?: string) => listWorkTasks(p),
  listWorkProjects: () => listWorkProjects(),
  createWorkTask: vi.fn(),
  updateWorkTaskStatus: vi.fn(),
}))
vi.mock('../../../components/Layout', () => ({ default: () => null }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve()
  })
}

async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <NotesKanban />
      </MemoryRouter>,
    ),
  )
  await flush()
}

beforeEach(() => {
  listWorkTasks.mockReset()
  listWorkProjects.mockReset()
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('NotesKanban — lỗi tải', () => {
  it('API lỗi → khối lỗi + Thử lại, KHÔNG hiện hai cột 0 việc', async () => {
    listWorkTasks.mockRejectedValueOnce(new Error('HTTP error 500'))
    listWorkProjects.mockResolvedValueOnce([])
    await render()
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Máy chủ đang gặp sự cố')
    expect(alert?.textContent).toContain('Dữ liệu của bạn vẫn còn nguyên')
    expect(container.textContent).not.toContain('CẦN THỰC HIỆN')

    listWorkTasks.mockResolvedValueOnce([
      { id: 't1', title: 'Viết báo cáo', status: 'todo', priority: 'high' } as WorkTask,
    ])
    listWorkProjects.mockResolvedValueOnce([])
    const retry = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Thử lại'),
    ) as HTMLButtonElement
    await act(async () => retry.click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('CẦN THỰC HIỆN')
    expect(container.textContent).toContain('Viết báo cáo')
  })
})

// [changelog 0690] Ảnh Tầng 8b có dữ liệu (`npm run shots:real-data`) lộ thẻ việc in hạn dạng ISO thô
// "Hạn: 2026-11-05T10:00:00.000Z". Hạn phải hiện dd/mm/yyyy theo GIỜ VIỆT NAM (cùng `formatDateVN`).
describe('NotesKanban — hiển thị hạn', () => {
  it('hạn hiện dd/mm/yyyy theo giờ Việt Nam, không lộ chuỗi ISO', async () => {
    listWorkTasks.mockResolvedValueOnce([
      {
        id: 't1',
        title: 'Làm đề Reading',
        status: 'todo',
        priority: 'high',
        // 18:00 UTC ngày 05/11 = 01:00 ngày 06/11 giờ Việt Nam.
        dueAt: '2026-11-05T18:00:00.000Z',
      } as WorkTask,
    ])
    listWorkProjects.mockResolvedValueOnce([])
    await render()
    expect(container.textContent).toContain('Hạn: 06/11/2026')
    expect(container.textContent).not.toContain('T18:00:00')
  })
})

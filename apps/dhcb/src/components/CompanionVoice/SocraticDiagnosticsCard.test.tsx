// Danh sách chủ đề của thẻ Socratic (changelog 0538): trước đây lỗi tải chỉ `console.error` nên
// thân thẻ trống trơn. Nay qua `useCatalogList`: tải / lỗi + Thử lại / rỗng / sẵn sàng tách bạch.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import SocraticDiagnosticsCard from './SocraticDiagnosticsCard'
import { listMisconceptions } from '@dhcb/core-personal/socraticDiagnosticsService'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function button(label: string): HTMLButtonElement | undefined {
  return [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label))
}

async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<SocraticDiagnosticsCard />)
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('SocraticDiagnosticsCard — danh sách chủ đề', () => {
  it('đang tải → role=status "Đang tải chủ đề…"', async () => {
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}))
    await render()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Đang tải chủ đề')
  })

  it('API 500 → báo lỗi (role=alert) + "Thử lại" tải lại thành công', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'boom' }, 500))
    await render()
    expect(container.querySelector('[role="alert"]')).toBeTruthy()
    expect(button('Bắt đầu đối thoại')).toBeUndefined()

    fetchMock.mockResolvedValueOnce(json({ misconceptions: listMisconceptions() }))
    await act(async () => {
      button('Thử lại')?.click()
    })
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(button('Bắt đầu đối thoại')).toBeTruthy()
  })

  it('dữ liệu sai hợp đồng → báo lỗi, không hiện thẻ trống', async () => {
    fetchMock.mockResolvedValueOnce(json({ misconceptions: [{ id: 1 }] }))
    await render()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('không đúng định dạng')
  })

  it('danh sách rỗng → câu "Chưa có chủ đề", không phải lỗi', async () => {
    fetchMock.mockResolvedValueOnce(json({ misconceptions: [] }))
    await render()
    expect(container.textContent).toContain('Chưa có chủ đề chẩn đoán nào')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})

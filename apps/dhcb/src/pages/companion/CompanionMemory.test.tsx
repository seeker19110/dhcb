// CompanionMemory.test.tsx — trang "Bạn Đồng Hành nhớ gì về tôi": 4 trạng thái, sửa với
// expectedVersion, "Quên" → expire, công tắc role="switch" (GĐ2a ④).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MemoryRecord } from '@dhcb/core-contracts/personalMemory'
import type { CompanionMemorySettings } from '@dhcb/core-contracts/consentGrant'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const api = vi.hoisted(() => ({
  fetchCompanionMemorySettings: vi.fn<() => Promise<CompanionMemorySettings>>(),
  updateCompanionMemorySettings:
    vi.fn<(p: Partial<CompanionMemorySettings>) => Promise<CompanionMemorySettings>>(),
  fetchMemories: vi.fn<() => Promise<MemoryRecord[]>>(),
  updateMemory: vi.fn(),
  forgetMemory: vi.fn(),
}))
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }))

vi.mock('../../components/Layout', () => ({ default: () => null }))
vi.mock('@core/PageShell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@core/ToastProvider', () => ({ useToast: () => toast }))
vi.mock('../../lib/companionMemoryApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/companionMemoryApi')>()
  return { ...actual, ...api }
})

import CompanionMemory from './CompanionMemory'
import { CompanionMemoryApiError } from '../../lib/companionMemoryApi'

const NOW = '2026-10-11T00:00:00.000Z'
function record(over: Partial<MemoryRecord> = {}): MemoryRecord {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    personId: '11111111-1111-4111-8111-111111111111',
    namespace: 'semantic',
    content: 'Thi IELTS tháng 12',
    provenance: 'companion:conversation',
    sensitivity: 'personal',
    status: 'accepted',
    createdAt: NOW,
    version: 1,
    importance: 9,
    validFrom: NOW,
    hasEmbedding: true,
    schemaVersion: 2,
    ...over,
  }
}

let container: HTMLDivElement
let root: Root

async function render() {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <CompanionMemory />
      </MemoryRouter>,
    )
  })
}
const byText = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as
    HTMLButtonElement | undefined

beforeEach(() => {
  vi.clearAllMocks()
  api.fetchCompanionMemorySettings.mockResolvedValue({ rememberMemories: false, useHistory: false })
  api.updateCompanionMemorySettings.mockImplementation(async (p) => ({
    rememberMemories: p.rememberMemories ?? false,
    useHistory: p.useHistory ?? false,
  }))
  api.fetchMemories.mockResolvedValue([])
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('CompanionMemory — bốn trạng thái', () => {
  it('đang tải → role=status; rỗng → câu hướng dẫn; không hiện importance', async () => {
    let resolve!: (r: MemoryRecord[]) => void
    api.fetchMemories.mockReturnValue(new Promise((r) => (resolve = r)))
    await render()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Đang tải')
    await act(async () => resolve([]))
    expect(container.textContent).toContain('Chưa có ký ức nào')
  })

  it('danh sách → hiện nội dung + nhãn nhóm, KHÔNG lộ số importance', async () => {
    api.fetchMemories.mockResolvedValue([
      record(),
      record({ id: '33333333-3333-4333-8333-333333333333', status: 'expired', content: 'đã quên' }),
    ])
    await render()
    expect(container.textContent).toContain('Thi IELTS tháng 12')
    expect(container.textContent).toContain('Về bạn')
    expect(container.textContent).not.toContain('đã quên')
    expect(container.textContent).not.toMatch(/importance|\b9\b/)
  })

  it('lỗi tải → LoadError + Thử lại tải lại được', async () => {
    api.fetchMemories.mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce([record()])
    await render()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Không tải được')
    await act(async () => byText('Thử lại')!.click())
    expect(container.textContent).toContain('Thi IELTS tháng 12')
  })

  it('403 cần 2FA → lối đi tới trang cá nhân, không hiện lỗi chung', async () => {
    api.fetchMemories.mockRejectedValue(
      new CompanionMemoryApiError('cần 2FA', 403, 'TWO_FACTOR_SETUP_REQUIRED'),
    )
    await render()
    expect(container.textContent).toContain('xác thực hai bước')
    expect(container.querySelector('a[href="/trang-ca-nhan"]')).not.toBeNull()
  })
})

describe('CompanionMemory — công tắc và thao tác', () => {
  it('hai công tắc là role=switch, phản ánh cài đặt; bật "Nhớ về tôi" → gọi API đúng patch', async () => {
    api.fetchCompanionMemorySettings.mockResolvedValue({
      rememberMemories: false,
      useHistory: true,
    })
    await render()
    const switches = [...container.querySelectorAll('[role="switch"]')] as HTMLButtonElement[]
    expect(switches.map((s) => s.getAttribute('aria-checked'))).toEqual(['false', 'true'])
    await act(async () => switches[0]!.click())
    expect(api.updateCompanionMemorySettings).toHaveBeenCalledWith({ rememberMemories: true })
    expect(switches[0]!.getAttribute('aria-checked')).toBe('true')
  })

  it('Sửa → Lưu gọi update với expectedVersion = version hiện tại, cập nhật version mới', async () => {
    api.fetchMemories.mockResolvedValue([record({ version: 4 })])
    api.updateMemory.mockResolvedValue({ id: record().id, status: 'accepted', version: 5 })
    await render()
    await act(async () => byText('Sửa')!.click())
    const textarea = container.querySelector('textarea')!
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
      setter.call(textarea, 'Thi IELTS tháng 1')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => byText('Lưu')!.click())
    expect(api.updateMemory).toHaveBeenCalledWith(record().id, 'Thi IELTS tháng 1', 4)
    expect(container.textContent).toContain('Thi IELTS tháng 1')
    expect(toast.success).toHaveBeenCalled()
  })

  it('Quên → hỏi xác nhận rồi gọi expire với expectedVersion; huỷ thì không gọi', async () => {
    api.fetchMemories.mockResolvedValue([record({ version: 2 })])
    api.forgetMemory.mockResolvedValue(undefined)
    // jsdom không có window.confirm → stub.
    vi.stubGlobal('confirm', vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true))
    await render()
    await act(async () => byText('Quên')!.click())
    expect(api.forgetMemory).not.toHaveBeenCalled()
    await act(async () => byText('Quên')!.click())
    expect(api.forgetMemory).toHaveBeenCalledWith(record().id, 2)
    expect(container.textContent).toContain('Chưa có ký ức nào')
  })

  it('409 khi sửa → toast nói rõ bản đã đổi, không mất nội dung đang sửa', async () => {
    api.fetchMemories.mockResolvedValue([record()])
    api.updateMemory.mockRejectedValue(new CompanionMemoryApiError('lệch', 409))
    await render()
    await act(async () => byText('Sửa')!.click())
    await act(async () => byText('Lưu')!.click())
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('vừa được đổi'))
    expect(container.querySelector('textarea')).not.toBeNull()
  })
})

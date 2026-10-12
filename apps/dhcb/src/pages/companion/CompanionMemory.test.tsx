// CompanionMemory.test.tsx — trang "Bạn Đồng Hành nhớ gì về tôi": 4 trạng thái, sửa với
// expectedVersion, "Quên" → expire, công tắc role="switch" (GĐ2a ④); gợi ý chờ duyệt, khối cố
// định, tóm tắt cuộn, ký ức đã bị thay (GĐ2b ④).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  ConversationSummary,
  CoreMemoryBlock,
  MemoryRecord,
} from '@dhcb/core-contracts/personalMemory'
import type { CompanionMemoryOverview, MemorySuggestion } from '../../lib/companionMemoryApi'
import type { CompanionMemorySettings } from '@dhcb/core-contracts/consentGrant'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const api = vi.hoisted(() => ({
  fetchCompanionMemoryOverview: vi.fn<() => Promise<CompanionMemoryOverview>>(),
  fetchMemorySuggestions: vi.fn<() => Promise<MemorySuggestion[]>>(),
  decideMemorySuggestion: vi.fn(),
  saveCoreBlock: vi.fn<(...a: unknown[]) => Promise<CoreMemoryBlock>>(),
  clearConversationSummary: vi.fn<(d: string) => Promise<ConversationSummary[]>>(),
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

const EMPTY_BLOCKS: CoreMemoryBlock[] = [
  { label: 'about_me', content: '', version: 0 },
  { label: 'current_focus', content: '', version: 0 },
]

function overview(
  settings: CompanionMemorySettings,
  extra: Partial<Omit<CompanionMemoryOverview, 'settings'>> = {},
) {
  api.fetchCompanionMemoryOverview.mockResolvedValue({
    settings,
    coreBlocks: EMPTY_BLOCKS,
    summaries: [],
    ...extra,
  })
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
  overview({ rememberMemories: false, useHistory: false, suggestMemories: false })
  api.fetchMemorySuggestions.mockResolvedValue([])
  api.updateCompanionMemorySettings.mockImplementation(async (p) => ({
    rememberMemories: p.rememberMemories ?? false,
    useHistory: p.useHistory ?? false,
    suggestMemories: p.suggestMemories ?? false,
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
    overview({ rememberMemories: false, useHistory: true, suggestMemories: false })
    await render()
    const switches = [...container.querySelectorAll('[role="switch"]')] as HTMLButtonElement[]
    expect(switches.map((s) => s.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false'])
    await act(async () => switches[0]!.click())
    expect(api.updateCompanionMemorySettings).toHaveBeenCalledWith({ rememberMemories: true })
    expect(switches[0]!.getAttribute('aria-checked')).toBe('true')
  })

  it('Sửa → Lưu gọi update với expectedVersion = version hiện tại, cập nhật version mới', async () => {
    api.fetchMemories.mockResolvedValue([record({ version: 4 })])
    api.updateMemory.mockResolvedValue({ id: record().id, status: 'accepted', version: 5 })
    await render()
    await act(async () => byText('Sửa')!.click())
    const textarea = container.querySelector('textarea[id^="edit-"]') as HTMLTextAreaElement
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
    expect(container.querySelector('textarea[id^="edit-"]')).not.toBeNull()
  })
})

const setValue = async (el: HTMLTextAreaElement, value: string) => {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('CompanionMemory — GĐ2b', () => {
  it('công tắc "Gợi ý điều nên nhớ" bị khoá khi "Nhớ về tôi" tắt; mở khi bật, gửi đúng patch', async () => {
    await render()
    const suggest = container.querySelector('#switch-suggest') as HTMLButtonElement
    expect(suggest.disabled).toBe(true)
    expect(container.textContent).toContain('Cần bật "Nhớ về tôi" trước')

    overview({ rememberMemories: true, useHistory: false, suggestMemories: false })
    act(() => root.unmount())
    root = createRoot(container)
    await render()
    const enabled = container.querySelector('#switch-suggest') as HTMLButtonElement
    expect(enabled.disabled).toBe(false)
    await act(async () => enabled.click())
    expect(api.updateCompanionMemorySettings).toHaveBeenCalledWith({ suggestMemories: true })
  })

  it('gợi ý chờ duyệt: hiện nội dung + điều bị thay; "Ghi nhớ" → confirm rồi tải lại ký ức', async () => {
    api.fetchMemorySuggestions.mockResolvedValue([
      {
        id: 's1',
        kind: 'update',
        content: 'Nhắm IELTS 7.0',
        previousContent: 'Nhắm IELTS 6.5',
        createdAt: NOW,
      },
      {
        id: 's2',
        kind: 'invalidate',
        content: '',
        previousContent: 'Học buổi tối',
        createdAt: NOW,
      },
    ])
    api.decideMemorySuggestion.mockResolvedValue(undefined)
    await render()
    expect(container.textContent).toContain('Gợi ý chờ bạn duyệt')
    expect(container.textContent).toContain('Nhắm IELTS 7.0')
    expect(container.textContent).toContain('Thay cho: Nhắm IELTS 6.5')
    expect(container.textContent).toContain('Bỏ điều đã nhớ: Học buổi tối')

    api.fetchMemories.mockResolvedValue([record({ content: 'Nhắm IELTS 7.0' })])
    await act(async () => byText('Ghi nhớ')!.click())
    expect(api.decideMemorySuggestion).toHaveBeenCalledWith('s1', 'confirm')
    expect(container.textContent).not.toContain('Thay cho: Nhắm IELTS 6.5')
    expect(container.querySelector('ul li p')?.textContent).toBeTruthy()
    expect(api.fetchMemories).toHaveBeenCalledTimes(2)

    await act(async () => byText('Bỏ qua')!.click())
    expect(api.decideMemorySuggestion).toHaveBeenCalledWith('s2', 'reject')
    expect(container.textContent).not.toContain('Gợi ý chờ bạn duyệt')
  })

  it('duyệt gợi ý bị 409 (ký ức gốc vừa đổi) → toast hướng dẫn bấm "Bỏ qua", gợi ý vẫn còn', async () => {
    api.fetchMemorySuggestions.mockResolvedValue([
      { id: 's1', kind: 'add', content: 'Thích vẽ', createdAt: NOW },
    ])
    api.decideMemorySuggestion.mockRejectedValue(new CompanionMemoryApiError('lệch', 409))
    await render()
    await act(async () => byText('Ghi nhớ')!.click())
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Bỏ qua'))
    expect(container.textContent).toContain('Thích vẽ')
  })

  it('không có gợi ý → không hiện mục; tải gợi ý lỗi → LoadError', async () => {
    await render()
    expect(container.textContent).not.toContain('Gợi ý chờ bạn duyệt')

    api.fetchMemorySuggestions.mockRejectedValue(new Error('500'))
    act(() => root.unmount())
    root = createRoot(container)
    await render()
    expect(container.textContent).toContain('Không tải được gợi ý ký ức')
  })

  it('khối cố định: lưu gửi expectedVersion hiện tại; nút Lưu khoá khi chưa đổi; 409 báo rõ', async () => {
    overview(
      { rememberMemories: true, useHistory: false, suggestMemories: false },
      {
        coreBlocks: [
          { label: 'about_me', content: 'Lớp 10', version: 2 },
          { label: 'current_focus', content: '', version: 0 },
        ],
      },
    )
    api.saveCoreBlock.mockResolvedValue({ label: 'about_me', content: 'Lớp 11', version: 3 })
    await render()
    const saveBtn = byText('Lưu về tôi')!
    expect(saveBtn.disabled).toBe(true)
    await setValue(container.querySelector('#core-block-about_me') as HTMLTextAreaElement, 'Lớp 11')
    expect(container.textContent).toContain('6/1500 ký tự')
    await act(async () => byText('Lưu về tôi')!.click())
    expect(api.saveCoreBlock).toHaveBeenCalledWith('about_me', 'Lớp 11', 2)
    expect(toast.success).toHaveBeenCalledWith('Đã lưu.')

    api.saveCoreBlock.mockRejectedValue(new CompanionMemoryApiError('lệch', 409))
    await setValue(
      container.querySelector('#core-block-current_focus') as HTMLTextAreaElement,
      'Ôn thi',
    )
    await act(async () => byText('Lưu đang tập trung')!.click())
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('vừa được sửa'))
  })

  it('tóm tắt các buổi trước: hiện theo miền, "Xoá" hỏi xác nhận rồi gọi clear', async () => {
    overview(
      { rememberMemories: false, useHistory: true, suggestMemories: false },
      { summaries: [{ domain: 'learning', summary: 'Đã ôn phần Nghe.', updatedAt: NOW }] },
    )
    api.clearConversationSummary.mockResolvedValue([])
    vi.stubGlobal('confirm', vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true))
    await render()
    expect(container.textContent).toContain('Học tập')
    expect(container.textContent).toContain('Đã ôn phần Nghe.')
    await act(async () => byText('Xoá bản tóm tắt')!.click())
    expect(api.clearConversationSummary).not.toHaveBeenCalled()
    await act(async () => byText('Xoá bản tóm tắt')!.click())
    expect(api.clearConversationSummary).toHaveBeenCalledWith('learning')
    expect(container.textContent).toContain('Chưa có bản tóm tắt')
  })

  it('xoá tóm tắt lỗi → toast lỗi', async () => {
    overview(
      { rememberMemories: false, useHistory: false, suggestMemories: false },
      { summaries: [{ domain: 'work', summary: 'Ghi chú họp.', updatedAt: NOW }] },
    )
    api.clearConversationSummary.mockRejectedValue(new Error('500'))
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    await render()
    await act(async () => byText('Xoá bản tóm tắt')!.click())
    expect(toast.error).toHaveBeenCalled()
  })

  it('ký ức đã được thay (validTo) không ở danh sách chính mà ở mục "Thông tin cũ"', async () => {
    api.fetchMemories.mockResolvedValue([
      record({ content: 'Nhắm 7.0' }),
      record({
        id: '33333333-3333-4333-8333-333333333333',
        content: 'Nhắm 6.5',
        validTo: NOW,
      }),
    ])
    await render()
    const details = container.querySelector('details')!
    expect(details.textContent).toContain('Thông tin cũ đã được thay (1)')
    expect(details.textContent).toContain('Nhắm 6.5')
    const mainList = container.querySelector('section[aria-labelledby="memory-list-heading"] > ul')!
    expect(mainList.textContent).toContain('Nhắm 7.0')
    expect(mainList.textContent).not.toContain('Nhắm 6.5')
  })
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import QuickActions from './QuickActions'

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'u1' } as { id: string } | null },
  permission: { value: 'default' as NotificationPermission },
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('../context/useAuth', () => ({ useAuth: () => ({ user: mocks.auth.user }) }))
vi.mock('../context/useLang', () => ({ useLang: () => ({ lang: 'vi' }) }))
vi.mock('../lib/pushNotif', () => ({
  isPushSupported: () => true,
  getNotifPermission: () => mocks.permission.value,
  subscribePush: mocks.subscribe,
  unsubscribePush: mocks.unsubscribe,
}))
vi.mock('./ShareProgress', () => ({ default: () => null }))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

async function render() {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    )
  })
}

async function click(element: Element | null) {
  expect(element).not.toBeNull()
  await act(async () => {
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function button(label: string): HTMLButtonElement | null {
  return (
    Array.from(container.querySelectorAll('button')).find(
      (candidate) =>
        candidate.getAttribute('aria-label') === label || candidate.textContent === label,
    ) ?? null
  )
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  mocks.auth.user = { id: 'u1' }
  mocks.permission.value = 'default'
  mocks.subscribe.mockReset().mockResolvedValue({ status: 'success' })
  mocks.unsubscribe.mockReset().mockResolvedValue({ status: 'success' })
  localStorage.clear()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('QuickActions — storage an toàn', () => {
  it('vẫn render giờ mặc định 20:00 khi localStorage.getItem ném lỗi', async () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    await render()
    await click(button('Bật nhắc học mỗi ngày'))

    expect(container.querySelector<HTMLSelectElement>('select')?.value).toBe('20')
  })

  it('nạp lại giờ theo userId đến sau render đầu', async () => {
    const getItem = vi
      .spyOn(localStorage, 'getItem')
      .mockImplementation((key) => (key === 'et_remind_hour_u2' ? '18' : null))
    mocks.auth.user = null
    await render()
    mocks.auth.user = { id: 'u2' }
    await render()
    await click(button('Bật nhắc học mỗi ngày'))

    expect(container.querySelector<HTMLSelectElement>('select')?.value).toBe('18')
    expect(getItem).toHaveBeenCalledWith('et_remind_hour_u2')
  })

  it('vẫn subscribe giờ vừa chọn và cảnh báo khi không ghi được storage', async () => {
    await render()
    await click(button('Bật nhắc học mỗi ngày'))
    const select = container.querySelector<HTMLSelectElement>('select')
    await act(async () => {
      if (select) {
        select.value = '18'
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    await click(button('Nhắc tôi lúc 18:00'))

    const offsetHours = -new Date().getTimezoneOffset() / 60
    const expectedUtcHour = ((Math.round(18 - offsetHours) % 24) + 24) % 24
    expect(mocks.subscribe).toHaveBeenCalledWith(expectedUtcHour)
    expect(container.textContent).toContain('Không thể lưu giờ nhắc trên thiết bị này')

    // Dựng lại cả component như một lần mở trang mới: setItem đã ném lỗi nên key không tồn tại,
    // lazy initializer phải quay về 20:00 chứ không giữ 18:00 từ state của phiên trước.
    act(() => root.unmount())
    root = createRoot(container)
    await render()
    await click(button('Bật nhắc học mỗi ngày'))
    expect(container.querySelector<HTMLSelectElement>('select')?.value).toBe('20')
  })
})

describe('QuickActions — phục hồi lỗi push', () => {
  it('permission denied hướng dẫn cài đặt và không hiện Retry', async () => {
    mocks.subscribe.mockResolvedValue({ status: 'denied' })
    await render()
    await click(button('Bật nhắc học mỗi ngày'))
    await click(button('Nhắc tôi lúc 20:00'))

    expect(container.textContent).toContain('bật quyền trong cài đặt trình duyệt')
    expect(container.textContent).not.toContain('Thử lại')
    expect(button('Bật nhắc học mỗi ngày')?.disabled).toBe(false)
  })

  it('failed hiện alert, Retry và giải phóng loading', async () => {
    mocks.subscribe
      .mockResolvedValueOnce({ status: 'failed' })
      .mockResolvedValueOnce({ status: 'success' })
    await render()
    await click(button('Bật nhắc học mỗi ngày'))
    await click(button('Nhắc tôi lúc 20:00'))

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    const retry = button('Thử lại')
    expect(retry?.disabled).toBe(false)
    retry?.focus()
    expect(document.activeElement).toBe(retry)
    await click(retry)
    expect(mocks.subscribe).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(document.activeElement).toBe(button('Tắt nhắc học'))
  })

  it('lỗi đăng ký push vẫn thoát loading và cho thử lại', async () => {
    mocks.subscribe.mockRejectedValueOnce(new Error('push failure'))
    await render()
    await click(button('Bật nhắc học mỗi ngày'))
    await click(button('Nhắc tôi lúc 20:00'))

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(button('Thử lại')?.disabled).toBe(false)
    expect(button('Bật nhắc học mỗi ngày')?.disabled).toBe(false)
  })

  it('unsubscribe partial phía server chuyển UI sang tắt và cho thử lại', async () => {
    mocks.permission.value = 'granted'
    mocks.unsubscribe.mockResolvedValue({
      status: 'partial',
      serverUpdated: true,
      browserUpdated: false,
    })
    await render()
    await click(button('Tắt nhắc học'))

    expect(button('Bật nhắc học mỗi ngày')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'chưa cập nhật hoàn tất',
    )
    expect(button('Thử lại')).not.toBeNull()
  })

  it('preflight denied hiện hướng dẫn ngay và không mở modal hoặc gọi subscribe', async () => {
    mocks.permission.value = 'denied'
    await render()

    expect(container.textContent).toContain('bật quyền trong cài đặt trình duyệt')
    expect(button('Thử lại')).toBeNull()
    await click(button('Bật nhắc học mỗi ngày'))
    expect(container.querySelector('select')).toBeNull()
    expect(mocks.subscribe).not.toHaveBeenCalled()
  })

  it('unsubscribe success chuyển trạng thái sang tắt', async () => {
    mocks.permission.value = 'granted'
    mocks.unsubscribe.mockResolvedValue({ status: 'success' })
    await render()
    await click(button('Tắt nhắc học'))

    expect(button('Bật nhắc học mỗi ngày')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('unsubscribe failed giữ trạng thái bật; Retry success tắt và phục hồi focus', async () => {
    mocks.permission.value = 'granted'
    mocks.unsubscribe
      .mockResolvedValueOnce({ status: 'failed' })
      .mockResolvedValueOnce({ status: 'success' })
    await render()
    await click(button('Tắt nhắc học'))

    expect(button('Tắt nhắc học')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    const retry = button('Thử lại')
    expect(retry?.disabled).toBe(false)
    await click(retry)

    expect(button('Bật nhắc học mỗi ngày')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(document.activeElement).toBe(button('Bật nhắc học mỗi ngày'))
  })
})

// Friends.loadError.test.tsx — Bạn bè / Kết bạn / bộ chọn bạn trong Tin nhắn: lỗi tải KHÔNG được
// giả làm "chưa có bạn bè" hay "mã không tồn tại" (changelog 0525).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Friends from './Friends'
import AddFriend from './AddFriend'
import ChatList from '../../components/chat/ChatList'
import type { FriendsState, FriendUserSummary } from '../../lib/friends'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const fetchFriendsState = vi.fn<() => Promise<FriendsState>>()
const lookupFriendByCode = vi.fn<(code: string) => Promise<FriendUserSummary | null>>()
const toastError = vi.fn()

vi.mock('../../lib/friends', () => ({
  fetchFriendsState: () => fetchFriendsState(),
  lookupFriendByCode: (code: string) => lookupFriendByCode(code),
  addFriendByCode: vi.fn(),
  removeFriend: vi.fn(),
  buildFriendInviteUrl: (code: string) => `https://vd.vn/ket-ban/${code}`,
}))
vi.mock('qrcode', () => ({
  default: { toDataURL: () => Promise.resolve('data:image/png;base64,') },
}))
vi.mock('../../components/Layout', () => ({ default: () => null }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: toastError, info: vi.fn() }),
}))

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

async function render(node: ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(node))
  await flush()
}

const button = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(text)) as
    HTMLButtonElement | undefined

beforeEach(() => {
  fetchFriendsState.mockReset()
  lookupFriendByCode.mockReset()
  toastError.mockReset()
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('Friends — trang Bạn bè', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <Friends />
      </MemoryRouter>,
    )

  it('lỗi tải → khối lỗi + Thử lại, KHÔNG hiện "Chưa có bạn bè nào" / "Bạn bè (0)"', async () => {
    fetchFriendsState.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await renderPage()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Không kết nối được máy chủ',
    )
    expect(container.textContent).not.toContain('Chưa có bạn bè nào')
    expect(container.textContent).not.toContain('Bạn bè (0)')

    fetchFriendsState.mockResolvedValueOnce({
      code: 'ABCD1234',
      friends: [{ id: 'u2', name: 'Bình' }],
    })
    await act(async () => button('Thử lại')?.click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('ABCD1234')
    expect(container.textContent).toContain('Bình')
  })

  it('danh sách rỗng thật → vẫn hiện câu mời kết bạn', async () => {
    fetchFriendsState.mockResolvedValueOnce({ code: 'ABCD1234', friends: [] })
    await renderPage()
    expect(container.textContent).toContain('Chưa có bạn bè nào')
  })

  it('trình duyệt chặn clipboard → báo lỗi thay vì im lặng', async () => {
    fetchFriendsState.mockResolvedValueOnce({ code: 'ABCD1234', friends: [] })
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: () => Promise.reject(new Error('NotAllowedError')) },
    })
    await renderPage()
    await act(async () => button('Chép liên kết kết bạn')?.click())
    await flush()
    expect(toastError).toHaveBeenCalledWith(
      'Không chép được liên kết — hãy chép tay mã kết bạn ở trên.',
    )
  })
})

describe('AddFriend — trang Kết bạn', () => {
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/ket-ban/ABCD1234']}>
        <Routes>
          <Route path="/ket-ban/:code" element={<AddFriend />} />
        </Routes>
      </MemoryRouter>,
    )

  it('lỗi tra mã → khối lỗi + Thử lại, KHÔNG báo "Mã kết bạn không tồn tại"', async () => {
    lookupFriendByCode.mockRejectedValueOnce(new Error('HTTP 502'))
    await renderPage()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Máy chủ đang gặp sự cố',
    )
    expect(container.textContent).not.toContain('Mã kết bạn không tồn tại')

    lookupFriendByCode.mockResolvedValueOnce({ id: 'u2', name: 'Bình' })
    await act(async () => button('Thử lại')?.click())
    await flush()
    expect(container.textContent).toContain('Kết bạn với Bình?')
  })

  it('mã không tồn tại thật (null) → vẫn báo mã không tồn tại', async () => {
    lookupFriendByCode.mockResolvedValueOnce(null)
    await renderPage()
    expect(container.textContent).toContain('Mã kết bạn không tồn tại hoặc đã hết hiệu lực.')
  })
})

describe('ChatList — bộ chọn bạn để chat mới', () => {
  it('lỗi tải bạn bè → báo lỗi + Thử lại, KHÔNG hiện "Chưa có bạn bè nào."', async () => {
    fetchFriendsState.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await render(
      <MemoryRouter>
        <ChatList
          rooms={[]}
          activeRoomId={null}
          presence={{}}
          onSelectRoom={() => {}}
          onStartChatWithFriend={() => {}}
        />
      </MemoryRouter>,
    )
    await act(async () => button('Chat mới')?.click())
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Chưa tải được danh sách bạn bè.',
    )
    expect(container.textContent).not.toContain('Chưa có bạn bè nào.')

    fetchFriendsState.mockResolvedValueOnce({ code: 'X', friends: [{ id: 'u2', name: 'Bình' }] })
    await act(async () => button('Thử lại')?.click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('Bình')
  })
})

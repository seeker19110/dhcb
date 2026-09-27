// OfflineSyncIndicator.test.tsx — dải báo trạng thái đọc HÀNG ĐỢI THẬT (S09-2, AC-13/AC-17).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const UID = '11111111-1111-4111-8111-111111111111'
vi.mock('../context/useAuth', () => ({ useAuth: () => ({ user: { id: UID } }) }))
vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({}) }))

import OfflineSyncIndicator from './OfflineSyncIndicator'
import { enqueue, flush, __resetOutboxForTests, registerKindHandler } from '../lib/syncOutbox'

let container: HTMLDivElement
let root: Root

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

async function mount(): Promise<void> {
  await act(async () => {
    root.render(<OfflineSyncIndicator />)
  })
}

beforeEach(() => {
  localStorage.clear()
  __resetOutboxForTests()
  registerKindHandler('english', { buildRequest: () => ({ url: '/api/progress', body: {} }) })
  setOnline(true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  __resetOutboxForTests()
})

describe('OfflineSyncIndicator', () => {
  it('có mạng + hàng đợi rỗng → không hiện gì (0 DOM)', async () => {
    await mount()
    expect(container.textContent).toBe('')
  })

  it('mất mạng + có mục chờ → hiện đúng SỐ MỤC THẬT trong hàng đợi', async () => {
    setOnline(false)
    enqueue(UID, 'english')
    enqueue(UID, 'evidence', { id: 'e1' })
    await mount()
    expect(container.textContent).toContain('2 mục chờ đồng bộ')
    expect(container.querySelector('[role="status"]')).not.toBeNull()
  })

  it('hết phiên đăng nhập (401) → nói rõ phải đăng nhập lại, không im lặng', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('unauthorized', { status: 401 })),
    )
    enqueue(UID, 'english')
    await act(async () => {
      await flush(UID)
    })
    await mount()
    expect(container.textContent).toContain('đăng nhập lại')
  })

  // [2026-09-22, audit UI/UX P1-5] Đồng bộ nền bình thường KHÔNG được khoe "Đã đồng bộ…":
  // dải xanh từng bắn ở mọi trang. Chỉ khoe khi hàng đợi từng bị kẹt vì mất mạng/401.
  it('có mạng, hàng đợi 1 mục rồi gửi xong → KHÔNG hiện "Đã đồng bộ"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    )
    await mount()
    await act(async () => {
      enqueue(UID, 'english')
    })
    await act(async () => {
      await flush(UID)
    })
    expect(container.textContent).not.toContain('Đã đồng bộ')
    expect(container.textContent).toBe('')
  })

  it('mất mạng có mục chờ → có mạng lại và gửi xong → hiện "Đã đồng bộ" (kẹt thật đã qua)', async () => {
    setOnline(false)
    enqueue(UID, 'english')
    await mount()
    expect(container.textContent).toContain('1 mục chờ đồng bộ')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    )
    setOnline(true)
    await act(async () => {
      window.dispatchEvent(new Event('online'))
      await flush(UID)
    })
    expect(container.textContent).toContain('Đã đồng bộ dữ liệu học tập thành công!')
  })

  it('hàng đợi của chủ KHÁC đổi → dải này không đổi số', async () => {
    setOnline(false)
    enqueue(UID, 'english')
    await mount()
    expect(container.textContent).toContain('1 mục chờ đồng bộ')
    await act(async () => {
      enqueue('22222222-2222-4222-8222-222222222222', 'english')
    })
    expect(container.textContent).toContain('1 mục chờ đồng bộ')
  })
})

it('chấm bài bảo trì: báo giữ code, chưa xác nhận hoàn thành, không hiện vòng quay', async () => {
  registerKindHandler('programming', {
    buildRequest: (_uid, entry) => ({
      url: '/api/programming/progress',
      body: { attemptId: entry.attemptId, items: entry.payload },
    }),
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ code: 'PROGRAMMING_GRADING_UNAVAILABLE' }), { status: 503 }),
    ),
  )
  enqueue(UID, 'programming', [
    {
      lessonId: 'p1-u1-l1',
      status: 'completed',
      code: 'print(1)',
      clientUpdatedAt: '2026-09-27T00:00:00Z',
    },
  ])
  await act(async () => {
    await flush(UID)
  })
  await mount()
  expect(container.textContent).toContain('Chấm bài đang bảo trì')
  expect(container.textContent).toContain('Mã bài được giữ trên thiết bị, chưa xác nhận hoàn thành')
  expect(container.querySelector('.animate-spin')).toBeNull()
  expect(container.querySelector('[role="status"]')).not.toBeNull()
})

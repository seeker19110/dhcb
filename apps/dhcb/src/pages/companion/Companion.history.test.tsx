// Companion.history.test.tsx — tải lịch sử hội thoại hỏng thì báo NHẸ + Thử lại, không chặn
// trò chuyện (quyết định chủ dự án 2026-10-08, thay cho "im lặng khi lỗi" cũ).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import Companion from './Companion'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../components/Layout', () => ({ default: () => null }))
vi.mock('../../components/MeshTelemetry/RealtimeTelemetryBar', () => ({ default: () => null }))
vi.mock('@core/PageShell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Test' } }),
}))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}))
vi.mock('../../components/CompanionStudios/StudioDialogue', () => ({
  default: ({ messages }: { messages: { text: string }[] }) => (
    <ul>
      {messages.map((m, i) => (
        <li key={i}>{m.text}</li>
      ))}
    </ul>
  ),
}))
vi.mock('../../lib/tts', () => ({ speak: vi.fn(async () => 1), stopSpeaking: vi.fn() }))
vi.mock('../../lib/sttServer', () => ({
  isRecordingSupported: () => false,
  startRecording: vi.fn(),
}))
vi.mock('../../lib/proactiveAgentApi', () => ({
  fetchProactiveAgentState: vi.fn(async () => ({ actions: [], config: {} })),
}))

const fetchCompanionHistoryMock = vi.hoisted(() => vi.fn())
vi.mock('../../lib/companionApi', () => ({
  sendCompanionMessageStream: vi.fn(),
  fetchCompanionHistory: fetchCompanionHistoryMock,
  confirmProposedAction: vi.fn(),
  rejectProposedAction: vi.fn(),
}))

const THONG_BAO = 'Không tải được các tin nhắn trước. Bạn vẫn trò chuyện bình thường.'

describe('Companion — lịch sử hội thoại tải hỏng', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    fetchCompanionHistoryMock.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  async function chay() {
    await act(async () => {
      for (let i = 0; i < 8; i++) await Promise.resolve()
    })
  }

  async function hien() {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Companion />
        </MemoryRouter>,
      )
    })
    await chay()
  }

  const nutThuLai = () =>
    Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Thử lại')

  it('lỗi mạng → một dòng báo nhẹ (role=status, không phải alert) + nút Thử lại', async () => {
    fetchCompanionHistoryMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await hien()
    expect(container.textContent).toContain(THONG_BAO)
    expect(container.querySelector('[role="status"]')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(nutThuLai()).toBeTruthy()
    // Chat không bị chặn: studio hội thoại vẫn dựng (tin chào vẫn còn).
    expect(container.querySelectorAll('li').length).toBeGreaterThan(0)
  })

  it('Thử lại thành công → thông báo biến mất, tin nhắn cũ được nối vào', async () => {
    fetchCompanionHistoryMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    fetchCompanionHistoryMock.mockResolvedValueOnce([
      { id: 'a1', role: 'user', content: 'tin cũ của tôi', createdAt: '2026-10-01T08:00:00Z' },
    ])
    await hien()
    expect(container.textContent).toContain(THONG_BAO)
    await act(async () => {
      nutThuLai()?.click()
    })
    await chay()
    expect(container.textContent).not.toContain(THONG_BAO)
    expect(container.textContent).toContain('tin cũ của tôi')
  })

  it('tải được thì không có thông báo', async () => {
    fetchCompanionHistoryMock.mockResolvedValue([])
    await hien()
    expect(container.textContent).not.toContain(THONG_BAO)
  })
})

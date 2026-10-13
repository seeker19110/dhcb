// apps/dhcb/src/pages/companion/Companion.tool.test.tsx — [GĐ3] nhãn công cụ của chế độ tác tử.
// Server phát sự kiện `tool` khi Bạn Đồng Hành đang tra cứu (vd "Đang xem tiến độ học…"); trang
// chuyển nhãn đó xuống dòng chờ của studio, và BỎ nhãn khi chữ bắt đầu về hoặc lượt kết thúc.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import type { CompanionStreamCallbacks } from '../../lib/companionApi'
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
// Studio giả: một nút gửi + in ra nhãn công cụ đang nhận.
vi.mock('../../components/CompanionStudios/StudioDialogue', () => ({
  default: ({
    handleSend,
    toolStatus,
  }: {
    handleSend: (text?: string) => void
    toolStatus?: string | null
  }) => (
    <div>
      <button type="button" data-testid="gui" onClick={() => handleSend('tuần này mình học gì?')}>
        GỬI
      </button>
      <p data-testid="tool">{toolStatus ?? 'KHÔNG-CÓ'}</p>
    </div>
  ),
}))
vi.mock('../../lib/tts', () => ({ speak: vi.fn(async () => 1), stopSpeaking: vi.fn() }))
vi.mock('../../lib/sttServer', () => ({
  isRecordingSupported: () => false,
  startRecording: vi.fn(),
}))

const sendMock = vi.hoisted(() => vi.fn())
vi.mock('../../lib/companionApi', () => ({
  sendCompanionMessageStream: sendMock,
  fetchCompanionHistory: vi.fn(async () => []),
  confirmProposedAction: vi.fn(),
  rejectProposedAction: vi.fn(),
}))

describe('Companion — nhãn công cụ (GĐ3)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    sendMock.mockReset()
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

  const nhan = () => container.querySelector('[data-testid="tool"]')?.textContent

  it('hiện nhãn khi có sự kiện `tool`, bỏ khi chữ về và khi lượt xong', async () => {
    let callbacks: CompanionStreamCallbacks = {}
    let finish: () => void = () => {}
    sendMock.mockImplementation(
      (_req: unknown, cb: CompanionStreamCallbacks) =>
        new Promise<void>((resolve) => {
          callbacks = cb
          finish = resolve
        }),
    )
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Companion />
        </MemoryRouter>,
      )
    })
    await chay()
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="gui"]')?.click()
    })
    await chay()
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(nhan()).toBe('KHÔNG-CÓ')

    await act(async () => callbacks.onTool?.('Đang xem tiến độ học…'))
    expect(nhan()).toBe('Đang xem tiến độ học…')

    await act(async () => callbacks.onChunk?.('Bạn đã học 3 bài.'))
    expect(nhan()).toBe('KHÔNG-CÓ')

    // Công cụ ở bước sau rồi lượt kết thúc ⇒ nhãn cũng phải biến mất.
    await act(async () => callbacks.onTool?.('Đang tra từ điển…'))
    expect(nhan()).toBe('Đang tra từ điển…')
    await act(async () => finish())
    await chay()
    expect(nhan()).toBe('KHÔNG-CÓ')
  })
})

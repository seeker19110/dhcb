// apps/dhcb/src/pages/companion/Companion.voice.test.tsx
//
// [S10-1, 2026-09-15] Trang Companion trước nay KHÔNG có test đơn vị nào. Hai lỗi vòng đời
// được canh ở đây (đặc tả
// `docs/specs/2026-09-15-learning-ux-s10-tro-giang-trong-bai-voice.md` §2.1):
//
//   L1/AC-1 — cleanup unmount chỉ gọi `voiceRecorderRef.cancel()` + `stopSpeaking()` mà KHÔNG
//     đặt cờ huỷ, nên `onDone` của stream còn đang bay vẫn gọi `speak(...)`: người dùng rời
//     trang giữa lúc AI đang trả lời thì AI CẤT TIẾNG Ở TRANG KẾ.
//   L3/AC-3 — (đã gỡ cùng tác tử chủ động giả lập ở changelog 0629: trang không còn fetch
//     `fetchProactiveAgentState` khi mount; "Thẻ hôm nay" tải trong studio qua `useAsyncLoad`.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import type { CompanionResponse, CompanionStreamCallbacks } from '../../lib/companionApi'
import Companion from './Companion'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// ── Vỏ trang: không phải phần đang test, cắt cho nhẹ ────────────────────────────────────────
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

// Studio hội thoại thật quá nặng (nạp lười + 3D). Thay bằng một nút duy nhất bấm để gửi
// MỘT lượt nói — đúng đường đi thật `handleSend(text, viaVoice = true)`.
vi.mock('../../components/CompanionStudios/StudioDialogue', () => ({
  default: ({ handleSend }: { handleSend: (text?: string, viaVoice?: boolean) => void }) => (
    <button type="button" onClick={() => handleSend('xin chào', true)}>
      GỬI-BẰNG-GIỌNG
    </button>
  ),
}))

// ── Các phụ thuộc có tác dụng phụ thật (âm thanh, micro, mạng) ──────────────────────────────
const speakMock = vi.hoisted(() => vi.fn(async () => 1))
const stopSpeakingMock = vi.hoisted(() => vi.fn())
vi.mock('../../lib/tts', () => ({ speak: speakMock, stopSpeaking: stopSpeakingMock }))

const cancelRecordingMock = vi.hoisted(() => vi.fn()) // recorder giả — trang không bấm ghi âm ở các ca dưới
vi.mock('../../lib/sttServer', () => ({
  isRecordingSupported: () => true,
  startRecording: vi.fn(async () => ({ stop: async () => '', cancel: cancelRecordingMock })),
}))

const sendCompanionMessageStreamMock = vi.hoisted(() => vi.fn())
vi.mock('../../lib/companionApi', () => ({
  sendCompanionMessageStream: sendCompanionMessageStreamMock,
  fetchCompanionHistory: vi.fn(async () => []),
  confirmProposedAction: vi.fn(),
  rejectProposedAction: vi.fn(),
}))

function phanHoiGia(reply: string): CompanionResponse {
  return {
    reply,
    intent: 'general_conversation',
    targetDomain: 'learning',
    contextPackage: {
      schemaVersion: 1,
      requestId: 'r1',
      personId: 'u1',
      domain: 'learning',
      purpose: 'companion_conversation',
      tokenBudget: 4000,
      tokenUsed: 10,
      items: [],
      truncated: false,
      createdAt: new Date().toISOString(),
    } as CompanionResponse['contextPackage'],
    proposedActions: [],
    executionSummary: {
      plannedSteps: 0,
      executedSteps: 0,
      pendingConfirmationSteps: 0,
      rejectedSteps: 0,
    },
    interactiveQuestions: [],
  }
}

describe('Companion — rời trang giữa lúc AI đang nói (AC-1) và huỷ fetch khi mount (AC-3)', () => {
  let container: HTMLDivElement
  let root: Root
  let daUnmount = false

  beforeEach(() => {
    speakMock.mockClear()
    stopSpeakingMock.mockClear()
    sendCompanionMessageStreamMock.mockReset()
    daUnmount = false
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    if (!daUnmount) act(() => root.unmount())
    container.remove()
  })

  function hien(strict = false) {
    const cay = (
      <MemoryRouter>
        <Companion />
      </MemoryRouter>
    )
    act(() => {
      root.render(strict ? <StrictMode>{cay}</StrictMode> : cay)
    })
  }

  async function chay() {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  function go() {
    if (!daUnmount) {
      act(() => root.unmount())
      daUnmount = true
    }
  }

  function nutGui(): HTMLButtonElement {
    const found = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'GỬI-BẰNG-GIỌNG',
    )
    if (!found) throw new Error('Không tìm thấy nút gửi bằng giọng (Studio giả chưa nạp?)')
    return found as HTMLButtonElement
  }

  it('AC-1: onDone của stream về SAU khi đã rời trang → speak() 0 lần', async () => {
    let callbacks: CompanionStreamCallbacks | null = null
    let ketThuc!: (r: CompanionResponse) => void
    sendCompanionMessageStreamMock.mockImplementation(
      (_params: unknown, cb: CompanionStreamCallbacks): Promise<CompanionResponse> => {
        callbacks = cb
        return new Promise<CompanionResponse>((resolve) => {
          ketThuc = resolve
        })
      },
    )

    hien()
    await chay()
    act(() => nutGui().click())
    await chay()
    expect(sendCompanionMessageStreamMock).toHaveBeenCalledTimes(1)

    go() // người dùng rời trang trong lúc AI còn đang trả lời

    // Stream còn bay về đích sau đó — KHÔNG được cất tiếng ở trang kế.
    const resp = phanHoiGia('Chào bạn, mình đây!')
    await act(async () => {
      callbacks?.onDone?.(resp)
      ketThuc(resp)
      await Promise.resolve()
    })

    expect(speakMock).not.toHaveBeenCalled()
    // Cleanup vẫn phải tắt tiếng đang phát như cũ (nhả micro được canh riêng ở
    // `sttServer.test.ts` — lượt này không hề bấm ghi âm nên không có recorder để nhả).
    expect(stopSpeakingMock).toHaveBeenCalled()
  })

  it('AC-2 (phía trang): lượt gửi có AbortSignal và signal bị abort khi rời trang', async () => {
    let opts: { signal?: AbortSignal } | undefined
    sendCompanionMessageStreamMock.mockImplementation(
      (
        _params: unknown,
        _cb: CompanionStreamCallbacks,
        o?: { signal?: AbortSignal },
      ): Promise<CompanionResponse> => {
        opts = o
        return new Promise<CompanionResponse>(() => {})
      },
    )

    hien()
    await chay()
    act(() => nutGui().click())
    await chay()

    expect(opts?.signal).toBeInstanceOf(AbortSignal)
    expect(opts?.signal?.aborted).toBe(false)

    go()
    expect(opts?.signal?.aborted).toBe(true)
  })
})

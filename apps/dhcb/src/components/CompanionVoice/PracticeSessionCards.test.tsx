// Thẻ Holodeck + Socratic khi phiên trên server HẾT HẠN (changelog 0538): server trả 404
// `{error:{code:'session_not_found'}}` → thẻ phải hiện lỗi (role=alert) + nút "Bắt đầu lại",
// khoá ô nhập, trả lại câu vừa gõ; bấm "Bắt đầu lại" mở phiên mới CÙNG kịch bản/chủ đề.
// Trước đây thẻ Socratic nuốt lỗi bằng console.error — người học bấm "Gửi" mà không có gì xảy ra.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import ScenarioHolodeckCard from './ScenarioHolodeckCard'
import SocraticDiagnosticsCard from './SocraticDiagnosticsCard'
import {
  listPredefinedScenarios,
  startHolodeckSession,
  resetHolodeckSessionsForTest,
} from '@dhcb/core-personal/scenarioHolodeckService'
import {
  listMisconceptions,
  startSocraticSession,
  resetSocraticSessionsForTest,
} from '@dhcb/core-personal/socraticDiagnosticsService'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const GONE_BODY = {
  error: {
    message: 'Phiên luyện đã hết hạn hoặc không còn — hãy bấm "Bắt đầu lại".',
    code: 'session_not_found',
  },
}

let container: HTMLDivElement
let root: Root
const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function button(label: string): HTMLButtonElement | undefined {
  return [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label))
}

function textInput(): HTMLInputElement | null {
  return container.querySelector('input[type="text"]')
}

async function render(node: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(node)
  })
}

async function click(label: string) {
  const b = button(label)
  expect(b, `không thấy nút "${label}"`).toBeTruthy()
  await act(async () => {
    b?.click()
  })
}

// Gõ vào ô nhập có kiểm soát của React (phải đi qua setter gốc để React thấy thay đổi).
async function typeAndSubmit(value: string) {
  const input = textInput()
  expect(input, 'không thấy ô nhập').toBeTruthy()
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(async () => {
    setter?.call(input, value)
    input?.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => {
    input?.form?.requestSubmit()
  })
}

function postBodies(): Array<Record<string, unknown>> {
  return fetchMock.mock.calls
    .filter(([, init]) => init?.method === 'POST')
    .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>)
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  resetHolodeckSessionsForTest()
  resetSocraticSessionsForTest()
})

describe('ScenarioHolodeckCard — phiên hết hạn', () => {
  it('404 session_not_found khi gửi lượt → alert + "Bắt đầu lại" mở phiên mới cùng kịch bản', async () => {
    const first = startHolodeckSession('p1', 'bigtech_panel_interview')
    const second = startHolodeckSession('p1', 'bigtech_panel_interview')
    fetchMock.mockImplementation(async (_url, init) => {
      if (!init?.method || init.method === 'GET') {
        return json({ scenarios: listPredefinedScenarios() })
      }
      const body = JSON.parse(String(init.body)) as { action: string }
      if (body.action === 'start') {
        const starts = postBodies().filter((b) => b.action === 'start').length
        return json({ session: starts <= 1 ? first : second }, 201)
      }
      return json(GONE_BODY, 404)
    })

    await render(<ScenarioHolodeckCard />)
    await click('Bước vào phòng giả lập')
    expect(textInput()).toBeTruthy()

    await typeAndSubmit('We used circuit breakers and fallbacks.')
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('hết hạn')
    expect(button('Bắt đầu lại')).toBeTruthy()
    // Ô nhập bị khoá: không còn gửi vào phiên đã chết.
    expect(textInput()).toBeNull()

    await click('Bắt đầu lại')
    const starts = postBodies().filter((b) => b.action === 'start')
    expect(starts).toHaveLength(2)
    expect(starts[1]?.scenarioId).toBe('bigtech_panel_interview')
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(textInput()).toBeTruthy()
  })

  it('lỗi KHÁC (409) chỉ báo lỗi, không hiện "Bắt đầu lại", trả lại câu vừa gõ', async () => {
    const session = startHolodeckSession('p1', 'silicon_vc_pitch')
    fetchMock.mockImplementation(async (_url, init) => {
      if (!init?.method || init.method === 'GET') {
        return json({ scenarios: listPredefinedScenarios() })
      }
      const body = JSON.parse(String(init.body)) as { action: string }
      if (body.action === 'start') return json({ session }, 201)
      return json({ error: { message: 'Phiên đã đủ 40 lượt', code: 'conflict' } }, 409)
    })

    await render(<ScenarioHolodeckCard />)
    await click('Bước vào phòng giả lập')
    await typeAndSubmit('Our moat is distribution.')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('đủ 40 lượt')
    expect(button('Bắt đầu lại')).toBeUndefined()
    expect(textInput()?.value).toBe('Our moat is distribution.')
  })
})

describe('SocraticDiagnosticsCard — phiên hết hạn / lỗi không còn im lặng', () => {
  it('404 session_not_found khi gửi phản tư → alert + "Bắt đầu lại" cùng chủ đề', async () => {
    const first = startSocraticSession('p1', 'present_perfect_past_confusion')
    const second = startSocraticSession('p1', 'present_perfect_past_confusion')
    fetchMock.mockImplementation(async (_url, init) => {
      if (!init?.method || init.method === 'GET') {
        return json({ misconceptions: listMisconceptions() })
      }
      const body = JSON.parse(String(init.body)) as { action: string }
      if (body.action === 'start') {
        const starts = postBodies().filter((b) => b.action === 'start').length
        return json({ session: starts <= 1 ? first : second }, 201)
      }
      return json(GONE_BODY, 404)
    })

    await render(<SocraticDiagnosticsCard />)
    await click('Bắt đầu đối thoại dẫn dắt Socratic')
    await typeAndSubmit('Mốc thời gian đã đóng lại.')

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('hết hạn')
    expect(textInput()).toBeNull()

    await click('Bắt đầu lại')
    const starts = postBodies().filter((b) => b.action === 'start')
    expect(starts).toHaveLength(2)
    expect(starts[1]?.misconceptionId).toBe('present_perfect_past_confusion')
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(textInput()).toBeTruthy()
  })

  it('bắt đầu thất bại (503 quá tải) → hiện thông điệp server, không im lặng', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      if (!init?.method || init.method === 'GET') {
        return json({ misconceptions: listMisconceptions() })
      }
      return json(
        {
          error: {
            message: 'Phòng luyện đang quá tải — vui lòng thử lại sau ít phút.',
            code: 'session_capacity',
          },
        },
        503,
      )
    })

    await render(<SocraticDiagnosticsCard />)
    await click('Bắt đầu đối thoại dẫn dắt Socratic')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('quá tải')
    expect(button('Bắt đầu lại')).toBeUndefined()
  })
})

// @vitest-environment-options {"settings":{"disableIframePageLoading":true}}
// HtmlPreview — giá trị `sandbox` là ranh giới an ninh của khung xem trang (đặc tả
// docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md mục ⑤): KHÔNG BAO GIỜ có
// `allow-same-origin`, trang tĩnh thì không chạy script, bài DOM thì nạp từ origin runner khi
// đã cấu hình.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encodePreviewPayload } from '../lib/runnerProtocol'

const runner = vi.hoisted(() => ({ origin: null as string | null }))
vi.mock('../lib/runnerBridge', () => ({ getRunnerOrigin: () => runner.origin }))

import { HtmlPreview } from './HtmlPreview'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  runner.origin = null
})

function render(ui: React.ReactElement) {
  act(() => root.render(ui))
  const iframe = container.querySelector('iframe')
  if (!iframe) throw new Error('không thấy iframe')
  return iframe
}

const PAGE = '<html><body><button id="b">Bam</button></body></html>'

describe('HtmlPreview', () => {
  it('trang tĩnh: sandbox rỗng + srcdoc — kể cả khi đã cấu hình runner', () => {
    for (const origin of [null, 'https://run.donghanhcungban.org']) {
      runner.origin = origin
      const iframe = render(<HtmlPreview html={PAGE} />)
      expect(iframe.getAttribute('sandbox')).toBe('')
      expect(iframe.getAttribute('srcdoc')).toBe(PAGE)
      expect(iframe.hasAttribute('src')).toBe(false)
    }
  })

  it('bài DOM, chưa cấu hình runner: srcdoc có script, chỉ allow-scripts', () => {
    const iframe = render(<HtmlPreview html={PAGE} script="go()" />)
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts')
    expect(iframe.getAttribute('srcdoc')).toContain('<script>go()</script></body>')
  })

  it('bài DOM, đã cấu hình runner: nạp preview.html ở origin runner, trang đi trong #', () => {
    runner.origin = 'https://run.donghanhcungban.org'
    const iframe = render(<HtmlPreview html={PAGE} script="go()" />)
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts')
    expect(iframe.hasAttribute('srcdoc')).toBe(false)
    const expected = PAGE.replace('</body>', '<script>go()</script></body>')
    expect(iframe.getAttribute('src')).toBe(
      `https://run.donghanhcungban.org/preview.html#${encodePreviewPayload(expected)}`,
    )
  })

  it('đổi script → dựng khung MỚI (đổi phần # không tự nạp lại trang)', () => {
    runner.origin = 'https://run.donghanhcungban.org'
    const first = render(<HtmlPreview html={PAGE} script="a()" />)
    const second = render(<HtmlPreview html={PAGE} script="b()" />)
    expect(second).not.toBe(first)
    expect(first.isConnected).toBe(false)
  })

  it('không bao giờ có allow-same-origin', () => {
    for (const origin of [null, 'https://run.donghanhcungban.org']) {
      runner.origin = origin
      for (const script of [undefined, 'x()']) {
        const iframe = render(<HtmlPreview html={PAGE} {...(script ? { script } : {})} />)
        expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin')
      }
    }
  })
})

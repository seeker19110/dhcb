import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

// Mock loader ví dụ dạng từ để test không cần fetch mạng. Component nạp ví dụ trong `useEffect`
// (không tải sẵn lúc import — changelog 0601), nên ca kiểm ví dụ phải MOUNT thật, không render tĩnh.
vi.mock('../data/formExamplesLoader.js', () => ({
  loadFormExamples: () =>
    Promise.resolve({
      'go|past': [
        { en: 'I went home early.', vi: 'Tôi về nhà sớm.' },
        { en: 'We went to the market.', vi: 'Chúng tôi đã đi chợ.' },
      ],
    }),
}))

import WordFormsBlock from './WordFormsBlock'
import { computeForms } from '../lib/wordForms'
import { ToastProvider } from '@core/ToastProvider'

// Render kiểm chứng component không lỗi và xuất đúng nội dung mong đợi (không cần trình duyệt thật).
// Bọc ToastProvider như App.tsx: nút loa PronounceButton bên trong dùng useToast() để báo hết lượt AI.
function render(el: React.ReactElement): string {
  return renderToStaticMarkup(<ToastProvider>{el}</ToastProvider>)
}

describe('WordFormsBlock', () => {
  it('động từ bất quy tắc: hiện đủ các dạng + nhãn bất quy tắc', () => {
    const html = render(<WordFormsBlock forms={computeForms('go', 'v')} word="go" isA={true} />)
    expect(html).toContain('Các dạng của từ')
    expect(html).toContain('bất quy tắc')
    expect(html).toContain('goes')
    expect(html).toContain('going')
    expect(html).toContain('went')
    expect(html).toContain('gone')
  })

  it('danh từ không đếm được: hiện chú thích, không có số nhiều', () => {
    const html = render(
      <WordFormsBlock forms={computeForms('advice', 'n')} word="advice" isA={true} />,
    )
    expect(html).toContain('không đếm được')
    expect(html).not.toContain('advices')
  })

  it('entry là dạng biến thể: hiện link về từ gốc', () => {
    const html = render(<WordFormsBlock base="go" word="went" isA={true} />)
    expect(html).toContain('Xem từ gốc')
    expect(html).toContain('go')
  })

  it('danh từ đếm được thường: hiện số nhiều', () => {
    const html = render(<WordFormsBlock forms={computeForms('book', 'n')} word="book" isA={true} />)
    expect(html).toContain('số nhiều')
    expect(html).toContain('books')
  })

  it('không có forms và không base: render rỗng', () => {
    // Không bọc ToastProvider (nó tự render vùng thông báo) — nhánh rỗng không có nút loa nào.
    const html = renderToStaticMarkup(<WordFormsBlock word="the" isA={true} />)
    expect(html).toBe('')
  })

  it('chiều B: nhãn tiếng Anh', () => {
    const html = render(
      <WordFormsBlock forms={computeForms('big', 'adj')} word="big" isA={false} />,
    )
    expect(html).toContain('Word forms')
    expect(html).toContain('comparative')
    expect(html).toContain('bigger')
  })

  it('hiện 2 ví dụ cho dạng có sẵn ví dụ (vd go|past)', async () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const container = document.createElement('div')
    const root = createRoot(container)
    // Mount thật để `useEffect` nạp ví dụ (loadFormExamples đã mock), rồi xả microtask.
    await act(async () => {
      root.render(
        <ToastProvider>
          <WordFormsBlock forms={computeForms('go', 'v')} word="go" isA={true} />
        </ToastProvider>,
      )
    })
    await act(async () => {
      await Promise.resolve()
    })
    const html = container.innerHTML
    // KaraokeText tách câu thành từng span mỗi chữ → kiểm tra các từ ĐẶC TRƯNG chỉ có ở ví dụ.
    expect(html).toContain('early.') // từ ví dụ 1 (en)
    expect(html).toContain('market.') // từ ví dụ 2 (en)
    expect(html).toContain('sớm.') // từ ví dụ 1 (vi)
    expect(html).toContain('chợ.') // từ ví dụ 2 (vi)
    // Có 2 câu tiếng Anh đánh số (KaraokeText phát tiếng Anh) → khối ví dụ xuất hiện.
    expect(html).toContain('Nghe tiếng Anh')
    act(() => root.unmount())
  })
})

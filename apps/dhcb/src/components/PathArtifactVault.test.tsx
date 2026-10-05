// PathArtifactVault — SSR: kiểm khung form + danh sách giai đoạn hiện đúng, và không render gì
// khi không có giai đoạn nào (đợt 3 chỉ cho nộp artifact ở giai đoạn ĐÃ có nội dung).
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PathArtifactVault from './PathArtifactVault'

describe('PathArtifactVault — SSR', () => {
  it('hiện tiêu đề + ô chọn giai đoạn khi có ít nhất một giai đoạn', () => {
    const html = renderToStaticMarkup(
      <PathArtifactVault
        pathId="principal-ai"
        phases={[
          { id: 'principal-ai-p1', name: 'Nền toán & thuật toán' },
          { id: 'principal-ai-p2', name: 'Dữ liệu & backend' },
        ]}
      />,
    )
    expect(html).toContain('Hồ sơ bằng chứng')
    // renderToStaticMarkup escape &, so chuỗi thô sẽ trượt oan.
    expect(html).toContain('Nền toán &amp; thuật toán')
    expect(html).toContain('Dữ liệu &amp; backend')
  })

  it('KHÔNG render gì khi không có giai đoạn nào (mọi giai đoạn đang soạn)', () => {
    const html = renderToStaticMarkup(<PathArtifactVault pathId="principal-ai" phases={[]} />)
    expect(html).toBe('')
  })

  // [U3, audit UI/UX 2026-09-30 C4] Ô chọn giai đoạn từng không có nhãn (axe `select-name`,
  // critical) và hai ô nhập chỉ có placeholder. Mỗi ô phải có <label for> trỏ đúng id của nó.
  it('mỗi ô (giai đoạn, link, ghi chú) có <label> nối đúng id', () => {
    const html = renderToStaticMarkup(
      <PathArtifactVault
        pathId="principal-ai"
        phases={[{ id: 'principal-ai-p1', name: 'Nền toán & thuật toán' }]}
      />,
    )
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const named = (label: string) => {
      const el = [...doc.querySelectorAll('label')].find((l) => l.textContent === label)
      const id = el?.getAttribute('for')
      return id ? doc.getElementById(id) : null
    }
    expect(named('Giai đoạn')?.tagName).toBe('SELECT')
    expect(named('Link bằng chứng')?.getAttribute('type')).toBe('url')
    expect(named('Ghi chú')?.getAttribute('type')).toBe('text')
  })
})

// Disclosure — khối gập `<details>` dùng ở trang chi tiết hướng Lập trình (changelog 0500).
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Disclosure from './Disclosure'

describe('Disclosure', () => {
  it('mặc định ĐÓNG, dòng tóm tắt là <summary> và nội dung vẫn có trong DOM', () => {
    const html = renderToStaticMarkup(
      <Disclosure summary="Xem 5 module của chặng">
        <p>Nội dung</p>
      </Disclosure>,
    )
    expect(html).toMatch(/^<details class="group /)
    expect(html).not.toMatch(/<details[^>]* open/)
    expect(html).toContain('<span>Xem 5 module của chặng</span>')
    // Nội dung nằm trong DOM (Ctrl+F của trình duyệt tự mở khối chứa từ khoá).
    expect(html).toContain('<p>Nội dung</p>')
  })

  it('defaultOpen mở sẵn; className thay khung ngoài', () => {
    const html = renderToStaticMarkup(
      <Disclosure summary="Tóm tắt" defaultOpen className="rounded-2xl bg-zinc-900/80">
        x
      </Disclosure>,
    )
    expect(html).toMatch(/<details class="group rounded-2xl bg-zinc-900\/80" open=""/)
  })

  it('mũi tên trang trí ẩn với trình đọc màn hình và tắt chuyển động khi giảm chuyển động', () => {
    const html = renderToStaticMarkup(<Disclosure summary="T">x</Disclosure>)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('motion-reduce:transition-none')
  })
})

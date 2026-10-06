// LessonStartButton — nút "Học bài: …" dùng chung ở trang bậc/khoá/chặng Lập trình (changelog 0501).
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { buttonVariantClass } from '@core/buttonStyles'
import LessonStartButton from './LessonStartButton'

const noop = () => {}

describe('LessonStartButton', () => {
  it('biến thể secondary, theo bề ngang nội dung từ sm, tên bài dài xuống dòng được', () => {
    const html = renderToStaticMarkup(
      <LessonStartButton title="Chương trình đầu tiên" done={false} onClick={noop} />,
    )
    expect(html).toContain(buttonVariantClass('secondary'))
    expect(html).toContain('sm:w-auto')
    expect(html).toContain('break-words')
    expect(html).not.toContain('whitespace-nowrap')
    expect(html).toContain('Học bài: Chương trình đầu tiên')
    expect(html).toContain('type="button"')
  })

  it('chỉ hiện dấu "Đã học xong" (có tên đọc) khi bài đã xong', () => {
    const chua = renderToStaticMarkup(<LessonStartButton title="A" done={false} onClick={noop} />)
    const xong = renderToStaticMarkup(<LessonStartButton title="A" done onClick={noop} />)
    expect(chua).not.toContain('Đã học xong')
    expect(xong).toContain('aria-label="Đã học xong"')
    expect(xong).toContain('role="img"')
  })
})

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import MixedLangText from './MixedLangText'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('MixedLangText', () => {
  it('gắn lang theo từng đoạn, chữ hiển thị y hệt chuỗi gốc', () => {
    const host = document.createElement('p')
    const root = createRoot(host)
    const text = 'S + am / is / are + (tính từ • danh từ)'
    act(() => root.render(<MixedLangText text={text} />))
    expect(host.textContent).toBe(text)
    const spans = Array.from(host.querySelectorAll('span[lang]')).map((s) => [
      s.getAttribute('lang'),
      s.textContent,
    ])
    expect(spans).toEqual([
      ['en', 'S + am / is / are'],
      ['vi', 'tính từ • danh từ'],
    ])
    act(() => root.unmount())
  })
})

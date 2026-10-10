// fonts.test.ts — canh fonts.css (Inter tự host, đổi thứ tự subset — đo Lighthouse 2026-10-10).
//
// 1. `vietnamese` PHẢI khai SAU `latin-ext`: trình duyệt xét @font-face khai sau cùng trước, nên
//    đảo lại là mọi trang tiếng Việt lại tải thêm file latin-ext 85 KB (ă/đ/ơ/ư nằm trong cả hai).
// 2. Cùng tập subset + unicode-range với wght.css của gói: nâng phiên bản @fontsource-variable/inter
//    mà gói đổi dải ký tự thì test đỏ, nhắc chép lại thay vì lệch im lặng.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const require = createRequire(import.meta.url)

function faces(css: string): Array<{ file: string; range: string }> {
  return [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((m) => {
    const body = m[1] ?? ''
    const file = /files\/(inter-[\w-]+\.woff2)/.exec(body)?.[1] ?? ''
    const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.replace(/\s+/g, '') ?? ''
    return { file, range }
  })
}

const ours = faces(readFileSync(join(__dirname, 'fonts.css'), 'utf8'))
const upstream = faces(readFileSync(require.resolve('@fontsource-variable/inter/wght.css'), 'utf8'))

describe('fonts.css — Inter tự host', () => {
  it('vietnamese khai SAU latin-ext (chữ Việt không kéo file latin-ext)', () => {
    const order = ours.map((f) => f.file)
    const vi = order.indexOf('inter-vietnamese-wght-normal.woff2')
    const latinExt = order.indexOf('inter-latin-ext-wght-normal.woff2')
    expect(vi).toBeGreaterThan(-1)
    expect(latinExt).toBeGreaterThan(-1)
    expect(vi).toBeGreaterThan(latinExt)
  })

  it('latin (file chính) vẫn khai cuối cùng', () => {
    expect(ours.at(-1)?.file).toBe('inter-latin-wght-normal.woff2')
  })

  it('cùng tập subset và unicode-range với wght.css của gói @fontsource-variable/inter', () => {
    const byFile = (list: typeof ours) =>
      Object.fromEntries(list.map((f) => [f.file, f.range] as const))
    expect(byFile(ours)).toEqual(byFile(upstream))
  })
})

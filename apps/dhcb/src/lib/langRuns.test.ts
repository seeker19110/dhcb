import { describe, expect, it } from 'vitest'
import { splitLangRuns } from './langRuns'

describe('splitLangRuns — gắn ngôn ngữ từng đoạn của công thức ngữ pháp (WCAG 3.1.2)', () => {
  it('công thức toàn tiếng Anh thành MỘT đoạn en (ký hiệu nối giữa hai đoạn en được gộp)', () => {
    expect(splitLangRuns('This / That / These / Those')).toEqual([
      { text: 'This / That / These / Those', lang: 'en' },
    ])
  })

  it('chỗ trống tiếng Việt là đoạn vi, kể cả từ không dấu đứng cùng cụm ("danh từ")', () => {
    expect(splitLangRuns('S + am / is / are + (tính từ • danh từ • nơi chốn)')).toEqual([
      { text: 'S + am / is / are', lang: 'en' },
      { text: ' + (' },
      { text: 'tính từ • danh từ • nơi chốn', lang: 'vi' },
      { text: ')' },
    ])
  })

  it('ký hiệu và "..." không gắn ngôn ngữ; ghép lại đúng chuỗi gốc', () => {
    const text = 'Be that as it may, ... · Come what may, ... · lest + S + (should) + V'
    const runs = splitLangRuns(text)
    expect(runs.map((r) => r.text).join('')).toBe(text)
    expect(runs.filter((r) => r.lang === 'vi')).toEqual([])
    expect(runs.some((r) => r.lang === undefined && r.text.includes('...'))).toBe(true)
  })

  it('chữ hoa có dấu (Đ) vẫn nhận là tiếng Việt', () => {
    expect(splitLangRuns('Động từ nguyên mẫu + … (không có chủ ngữ)')).toEqual([
      { text: 'Động từ nguyên mẫu', lang: 'vi' },
      { text: ' + … (' },
      { text: 'không có chủ ngữ', lang: 'vi' },
      { text: ')' },
    ])
  })

  it('đoạn vi xen giữa hai đoạn en thì KHÔNG gộp hai đoạn en qua nó', () => {
    const runs = splitLangRuns('How many + danh từ số nhiều + are there?')
    expect(runs.map((r) => r.lang)).toEqual(['en', undefined, 'vi', undefined, 'en', undefined])
  })

  it('khoảng trắng hai bên đoạn chữ nằm NGOÀI đoạn có ngôn ngữ, không nhân đôi', () => {
    const text = '  the  +   + tính từ '
    const runs = splitLangRuns(text)
    expect(runs.map((r) => r.text).join('')).toBe(text)
    expect(runs.filter((r) => r.lang).map((r) => r.text)).toEqual(['the', 'tính từ'])
  })

  it('chuỗi rỗng → không có đoạn nào', () => {
    expect(splitLangRuns('')).toEqual([])
  })
})

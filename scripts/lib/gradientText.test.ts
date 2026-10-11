import { describe, expect, it } from 'vitest'
import { alphaOf, gradientTextFindings, isLargeText, type GradientTextSample } from './gradientText'

const BLUE_SKY_BG = 'rgb(248, 250, 255)'

function mau(over: Partial<GradientTextSample> = {}): GradientTextSample {
  return {
    target: 'h1 span',
    backgroundImage:
      'linear-gradient(to right in oklab, rgb(7, 89, 133) 0%, rgb(3, 105, 161) 100%)',
    background: BLUE_SKY_BG,
    fontSizePx: 60,
    fontWeight: 800,
    ...over,
  }
}

describe('isLargeText', () => {
  it('≥ 24px là chữ lớn; 18,66px chỉ lớn khi đậm', () => {
    expect(isLargeText(24, 400)).toBe(true)
    expect(isLargeText(19, 700)).toBe(true)
    expect(isLargeText(19, 600)).toBe(false)
    expect(isLargeText(16, 900)).toBe(false)
  })
})

describe('alphaOf', () => {
  it('đọc alpha ở cả cú pháp gạch chéo và dấu phẩy', () => {
    expect(alphaOf('rgb(1, 2, 3)')).toBe(1)
    expect(alphaOf('rgb(1 2 3 / 0.5)')).toBe(0.5)
    expect(alphaOf('rgba(1, 2, 3, 0.2)')).toBe(0.2)
    expect(alphaOf('oklch(70% 0.1 200 / 40%)')).toBe(0.4)
    expect(alphaOf('rgba(0, 0, 0, 0)')).toBe(0)
  })
})

describe('gradientTextFindings', () => {
  it('tiêu đề hub SAU khi sửa (bậc 800→700 trên Blue sky) đạt', () => {
    expect(gradientTextFindings([mau()])).toEqual([])
  })

  it('tiêu đề hub TRƯỚC khi sửa (bậc 400→200 trên nền sáng) bị bắt, chỉ đúng điểm dừng tệ nhất', () => {
    const [loi] = gradientTextFindings([
      mau({
        backgroundImage:
          'linear-gradient(to right in oklab, rgb(56, 189, 248) 0%, rgb(125, 211, 252) 50%, rgb(186, 230, 253) 100%)',
      }),
    ])
    expect(loi).toMatch(/1\.27:1 \(điểm dừng rgb\(186, 230, 253\)/)
    expect(loi).toMatch(/< 4\.5:1$/)
  })

  it('chữ thường phải đạt 7:1 — 5,68:1 đủ cho chữ lớn nhưng không đủ cho chữ thường', () => {
    expect(gradientTextFindings([mau({ fontSizePx: 16, fontWeight: 700 })])).toHaveLength(1)
  })

  it('không đọc được màu thì BÁO LỖI, không lặng lẽ cho qua', () => {
    expect(gradientTextFindings([mau({ background: 'rgba(0, 0, 0, 0)' })])[0]).toMatch(
      /không đọc được nền đặc/,
    )
    expect(gradientTextFindings([mau({ backgroundImage: 'url(a.png)' })])[0]).toMatch(
      /không tìm thấy màu nào/,
    )
    expect(
      gradientTextFindings([
        mau({ backgroundImage: 'linear-gradient(rgb(7 89 133 / 0.5), rgb(3, 105, 161))' }),
      ])[0],
    ).toMatch(/không đo được điểm dừng/)
  })
})

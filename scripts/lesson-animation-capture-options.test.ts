import { describe, expect, it } from 'vitest'
import { parseCaptureOptions, selectCaptureLessons } from './lesson-animation-capture-options.js'

describe('tham số chụp hoạt họa', () => {
  it('giữ mặc định STEM cũ', () => {
    expect(parseCaptureOptions([])).toEqual({
      subject: 'math',
      out: undefined,
      only: [],
      viewports: [760],
      themes: ['blue-sky'],
    })
  })
  it('nhận ma trận Lập trình, loại tổ hợp lặp và giữ chọn bài', () => {
    expect(
      parseCaptureOptions([
        '--subject',
        'programming',
        '--viewports',
        '390,1440,390',
        '--themes',
        'blue-sky,dark-blue',
        '--only',
        'mathai-u3-l3,cv1-u2-l1',
        '--out',
        '/tmp/ảnh',
      ]),
    ).toEqual({
      subject: 'programming',
      out: '/tmp/ảnh',
      only: ['mathai-u3-l3', 'cv1-u2-l1'],
      viewports: [390, 1440],
      themes: ['blue-sky', 'dark-blue'],
    })
  })
  it.each([
    ['--subject', 'programing'],
    ['--theme', 'dark-blue'],
    ['--only'],
    ['--out', '--only'],
    ['--viewports', '0'],
    ['--viewports', '-390'],
    ['--viewports', '390.5'],
    ['--viewports', '390,'],
    ['--themes', 'wrong'],
    ['--themes', ''],
    ['--subject', 'math', '--subject', 'physics'],
    ['--only', '../lesson'],
  ])('từ chối tham số sai %j', (...args) => {
    expect(() => parseCaptureOptions(args)).toThrow()
  })
  it('không bỏ qua ID sai hoặc tập bài rỗng', () => {
    const available = [{ id: 'mathai-u3-l3' }]
    expect(selectCaptureLessons(available, [])).toEqual(available)
    expect(selectCaptureLessons(available, ['mathai-u3-l3'])).toEqual(available)
    expect(() => selectCaptureLessons(available, ['missing', 'mathai-u3-l3'])).toThrow('missing')
    expect(() => selectCaptureLessons([], [])).toThrow('Không có bài')
  })
})

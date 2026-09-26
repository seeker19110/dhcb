// Cổng cho luật đọc mốc thời gian của hoạt ảnh bài học. Ba luật dưới đây từng bị CSS làm sai lặng
// lẽ (rà 2026-09-26, TRAPS.md mục 10): mọi cổng khác vẫn xanh, chỉ nhìn ảnh chụp theo thời gian
// mới thấy hình trượt về chỗ cũ, mờ sai lúc, hay hiện ra trước giờ.
import { describe, expect, it } from 'vitest'
import { giaiMoc } from './animationKeyframes.js'

describe('giaiMoc', () => {
  it('thuộc tính không khai ở một mốc thì GIỮ giá trị mốc trước, không về 0', () => {
    // Đúng khuôn của hạt alpha ly12-c4-b22: bay tới dx = 96 rồi mờ đi tại chỗ.
    const m = giaiMoc(
      [
        { atMs: 0, dx: 0 },
        { atMs: 2000, dx: 96 },
        { atMs: 2400, opacity: 0 },
      ],
      7000,
      undefined,
    )
    const luc2000 = m.find((x) => x.atMs === 2000)
    const luc2400 = m.find((x) => x.atMs === 2400)
    expect(luc2000).toMatchObject({ dx: 96, opacity: 1 })
    expect(luc2400).toMatchObject({ dx: 96, opacity: 0 })
  })

  it('trước mốc đầu giữ trạng thái mốc đầu; sau mốc cuối giữ trạng thái mốc cuối', () => {
    // Khuôn "ẩn tới giây 3 rồi hiện" — CSS từng cho hình hiện ngay từ đầu rồi mờ dần tới giây 3.
    const m = giaiMoc(
      [
        { atMs: 3000, opacity: 0 },
        { atMs: 4500, opacity: 1 },
      ],
      9000,
      undefined,
    )
    expect(m[0]).toMatchObject({ atMs: 0, opacity: 0 })
    expect(m[m.length - 1]).toMatchObject({ atMs: 9000, opacity: 1 })
  })

  it('opacity trước lần khai đầu tiên là opacity tĩnh của hình', () => {
    const m = giaiMoc(
      [
        { atMs: 0, dy: 0 },
        { atMs: 1000, dy: 50 },
        { atMs: 2000, opacity: 1 },
      ],
      2000,
      0,
    )
    expect(m.map((x) => x.opacity)).toEqual([0, 0, 1])
    expect(m[2]).toMatchObject({ dy: 50 })
  })

  it('không thêm mốc thừa khi đã phủ đủ từ 0 tới durationMs', () => {
    const m = giaiMoc(
      [
        { atMs: 0, dx: 0 },
        { atMs: 2000, dx: 60 },
      ],
      2000,
      undefined,
    )
    expect(m).toHaveLength(2)
  })

  it('xếp mốc theo thời gian trước khi giải, dù khai lộn thứ tự', () => {
    const m = giaiMoc(
      [
        { atMs: 2000, dx: 60 },
        { atMs: 0, dx: 0, rotate: 0 },
        { atMs: 1000, rotate: 90 },
      ],
      2000,
      undefined,
    )
    expect(m.map((x) => [x.atMs, x.dx, x.rotate])).toEqual([
      [0, 0, 0],
      [1000, 0, 90],
      [2000, 60, 90],
    ])
  })

  it('scaleX/scaleY cũng mang tiếp giá trị mốc trước, mặc định 1', () => {
    const m = giaiMoc(
      [
        { atMs: 0, scaleY: 0.01 },
        { atMs: 1000, scaleY: 0.5 },
        { atMs: 2000, opacity: 0.4 },
      ],
      2000,
      undefined,
    )
    expect(m.map((x) => [x.scaleX, x.scaleY])).toEqual([
      [1, 0.01],
      [1, 0.5],
      [1, 0.5],
    ])
  })

  it('không có mốc thì trả mảng rỗng', () => {
    expect(giaiMoc([], 1000, undefined)).toEqual([])
  })
})

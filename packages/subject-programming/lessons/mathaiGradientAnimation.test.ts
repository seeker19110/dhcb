import { describe, expect, it } from 'vitest'
import { LessonAnimationSchema } from '@dhcb/core-contracts/lessonAnimation'
import { LessonSchema } from '../lessonTypes.js'
import { MATHAI_U3_LESSONS } from './mathaiu3.js'

const lesson = MATHAI_U3_LESSONS.find((item) => item.id === 'mathai-u3-l3')
if (!lesson) throw new Error('Thiếu bài mathai-u3-l3')
const animation = LessonAnimationSchema.parse(lesson.animation)

function shape(id: string) {
  const found = animation.shapes.find((item) => item.id === id)
  if (!found) throw new Error(`Thiếu hình ${id}`)
  return found
}

describe('hoạt họa gradient descent trong bài mathai-u3-l3', () => {
  it('đúng hợp đồng bài học, giữ cảnh cuối và đủ năm lời dẫn', () => {
    expect(LessonSchema.safeParse(lesson).success).toBe(true)
    expect(animation.durationMs).toBe(12_000)
    expect(animation.loop).toBe(false)
    expect(animation.viewBoxWidth).toBe(480)
    expect(animation.viewBoxHeight).toBe(540)
    expect(animation.captions?.map((caption) => caption.atMs)).toEqual([0, 2400, 4800, 7200, 9600])
    expect(animation.shapes.length).toBeLessThanOrEqual(60)
  })

  it('hai làn theo đúng phép cập nhật độc lập, mũi tên cùng hướng bước đi', () => {
    for (const [id, lr] of [
      ['slow', 0.1],
      ['fast', 1],
    ] as const) {
      const marker = shape(`${id}-x`)
      expect(marker.kind).toBe(id === 'slow' ? 'circle' : 'rect')
      let x = 0
      for (let step = 0; step <= 4; step += 1) {
        const arrival = step * 2400
        const frame = marker.keyframes?.find((item) => item.atMs === arrival)
        expect(frame?.dx).toBeCloseTo(60 * x, 6)

        if (step === 4) break
        const next = x - lr * 2 * (x - 3)
        const nextArrival = (step + 1) * 2400
        const hold = marker.keyframes?.find((item) => item.atMs === nextArrival - 800)
        expect(hold?.dx).toBeCloseTo(60 * x, 6)
        const arrow = shape(`update-${id}-n${step + 1}`)
        if (arrow.kind !== 'arrow') throw new Error('Mũi tên cập nhật sai loại hình')
        expect(arrow.x1).toBeCloseTo(60 + 60 * x, 6)
        expect(arrow.x2).toBeCloseTo(60 + 60 * next, 6)
        expect(Math.sign(arrow.x2 - arrow.x1)).toBe(Math.sign(next - x))
        expect(arrow.keyframes?.find((item) => item.atMs === nextArrival - 800)?.opacity).toBe(1)
        expect(arrow.keyframes?.find((item) => item.atMs === nextArrival)?.opacity).toBe(0)
        x = next
      }
      expect(x).toBeCloseTo(lr === 0.1 ? 1.7712 : 0, 6)
    }
  })

  it('điểm loss nằm trên parabol và chỉ hiện ở lần đánh giá rời rạc', () => {
    const curve = shape('loss-curve')
    if (curve.kind !== 'polyline') throw new Error('Đường loss không phải polyline')
    for (const [screenX, screenY] of curve.points) {
      const x = (screenX - 60) / 60
      expect(screenY).toBeCloseTo(240 - 20 * (x - 3) ** 2, 6)
    }

    let x = 0
    for (let step = 1; step <= 4; step += 1) {
      x = x - 0.1 * 2 * (x - 3)
      const point = shape(`slow-loss-n${step}`)
      if (point.kind !== 'circle') throw new Error('Điểm loss chậm sai loại hình')
      expect(point.cx).toBeCloseTo(60 + 60 * x, 6)
      expect(point.cy).toBeCloseTo(240 - 20 * (x - 3) ** 2, 6)
      expect(point.keyframes?.at(-1)).toEqual({ atMs: step * 2400, opacity: 1 })
    }
    const fastRight = shape('fast-loss-right')
    if (fastRight.kind !== 'rect') throw new Error('Điểm loss nhanh sai loại hình')
    expect(fastRight.x + fastRight.w / 2).toBe(420)
    expect(fastRight.y + fastRight.h / 2).toBe(60)
  })

  it('bản chữ truyền đủ chuỗi khi giảm chuyển động, cảnh đầu và cuối có nhãn', () => {
    expect(animation.description).toContain('0; 0,6; 1,08; 1,464; 1,7712')
    expect(animation.description).toContain('0 và 6')
    expect(animation.description).toContain('f(x) luôn bằng 9')
    expect(animation.description).toContain('hình tròn')
    expect(animation.description).toContain('hình vuông')
    expect(animation.captions?.[2]?.text).toContain('tính lại gradient')
    expect(animation.captions?.[4]?.text).toContain('dao động 0↔6')

    const labels = animation.shapes.filter((item) => item.kind === 'label')
    // Trang thật ở viewport 390px cho SVG rộng 316px: 20 × 316 / 480 ≈ 13,2px.
    expect(labels.every((item) => (item.size ?? 14) >= 20)).toBe(true)
    expect(shape('f-nine-label')).toMatchObject({ kind: 'label', text: '9' })
    expect(shape('x-axis-label')).toMatchObject({ kind: 'label', text: 'x' })
    expect(shape('f-axis-label')).toMatchObject({ kind: 'label', text: 'f(x)' })

    for (const lane of ['slow', 'fast']) {
      const laneLabel = shape(`${lane}-lane-label`)
      const first = shape(`${lane}-state-n0`)
      const last = shape(`${lane}-state-n4`)
      if (laneLabel.kind !== 'label' || first.kind !== 'label' || last.kind !== 'label') {
        throw new Error('Thiếu nhãn trạng thái làn')
      }
      expect(first.y - laneLabel.y).toBeGreaterThanOrEqual(28)
      expect(first.text).toContain('n=0')
      expect(first.keyframes?.[0]?.opacity).toBe(1)
      expect(last.text).toContain('n=4')
      expect(last.keyframes?.at(-1)).toEqual({ atMs: 9600, opacity: 1 })
    }
  })
})

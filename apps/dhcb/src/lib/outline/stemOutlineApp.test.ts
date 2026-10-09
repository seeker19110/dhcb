// Cổng cho chỗ GHÉP adapter cây STEM với dữ liệu của app (S07-2).
//
// Chạy trên registry THẬT của môn Vật lí và Sinh học. Từ 2026-10-09 cả bốn môn đều có chuyên đề
// HSG, nên ca "môn không có chuyên đề" giả lập bằng cách cho `listAdvanced` của Sinh trả rỗng —
// bất biến cần canh (không dựng khung HSG rỗng) vẫn còn nguyên nghĩa cho môn mới thêm sau này.
import { describe, it, expect, vi } from 'vitest'
import { PHYSICS_LOADER } from '@dhcb/subject-physics/lessonsLoader'
import { BIOLOGY_LOADER } from '@dhcb/subject-biology/lessonsLoader'
import { OutlineSchema } from '@dhcb/core-contracts/outline'
import { STEM_SUBJECTS } from '../stemLessonRoutes'
import { buildStemOutlineForApp, idChuongHsg, locNhanh } from './stemOutlineApp'

const LY = STEM_SUBJECTS.physics
const SINH = STEM_SUBJECTS.biology

describe('buildStemOutlineForApp', () => {
  it('cây hợp lệ theo hợp đồng và mỗi bài trỏ tới URL thật của trang bài học', () => {
    const cay = buildStemOutlineForApp(LY, '10')!
    expect(() => OutlineSchema.parse(cay)).not.toThrow()
    const la = cay.nodes.filter((n) => n.kind === 'lesson')
    expect(la.length).toBe(
      PHYSICS_LOADER.listCoreByGrade('10').length + PHYSICS_LOADER.listAdvanced().length,
    )
    expect(la.every((n) => n.href?.startsWith('/goc-hoc-tap/physics/bai-hoc/') === true)).toBe(true)
  })

  it('KHÔNG nạp nội dung bài nào để dựng cây (bất biến AC-6 của S07-1)', () => {
    const spy = vi.spyOn(PHYSICS_LOADER, 'loadLesson')
    buildStemOutlineForApp(LY, '10')
    expect(spy).toHaveBeenCalledTimes(0)
    spy.mockRestore()
  })

  it('bài có hoạt ảnh được đánh dấu bằng CHỮ, không phải bằng màu', () => {
    const cay = buildStemOutlineForApp(LY, '10')!
    const coHoatAnh = cay.nodes.filter((n) => n.hint?.includes('Có hoạt ảnh') === true)
    const soThat = PHYSICS_LOADER.listCoreByGrade('10').filter((b) => b.hasAnimation).length
    expect(coHoatAnh.length).toBeGreaterThanOrEqual(soThat)
    expect(soThat, 'ca test mất nghĩa nếu lớp 10 không còn bài nào có hoạt ảnh').toBeGreaterThan(0)
  })

  it('mọi bài STEM là "chưa đo được" — S07 KHÔNG bịa bằng chứng hoàn thành', () => {
    const cay = buildStemOutlineForApp(LY, '10')!
    expect(cay.nodes.every((n) => n.progress === 'unknown')).toBe(true)
  })

  it('lớp không có bài và môn không có chuyên đề → undefined, không dựng cây rỗng', () => {
    const spy = vi.spyOn(BIOLOGY_LOADER, 'listAdvanced').mockReturnValue([])
    expect(buildStemOutlineForApp(SINH, '99')).toBeUndefined()
    spy.mockRestore()
  })
})

describe('locNhanh — tách hai tab "chuẩn" và "bồi dưỡng HSG" từ MỘT cây', () => {
  it('nhánh chuẩn bỏ hẳn chương HSG và các bài của nó', () => {
    const cay = locNhanh(buildStemOutlineForApp(LY, '10'), 'physics', 'core')!
    expect(cay.nodes.some((n) => n.nodeId === idChuongHsg('physics'))).toBe(false)
    expect(cay.nodes.filter((n) => n.kind === 'lesson').length).toBe(
      PHYSICS_LOADER.listCoreByGrade('10').length,
    )
  })

  it('nhánh HSG chỉ còn chương bồi dưỡng, và bài mang nhãn cấp bằng chữ', () => {
    const cay = locNhanh(buildStemOutlineForApp(LY, '10'), 'physics', 'advanced')!
    expect(cay.nodes.filter((n) => n.kind === 'chapter').length).toBe(1)
    expect(cay.nodes.filter((n) => n.kind === 'lesson').length).toBe(
      PHYSICS_LOADER.listAdvanced().length,
    )
    expect(cay.nodes.some((n) => n.hint?.includes('Cấp') === true)).toBe(true)
  })

  it('môn KHÔNG có chuyên đề → nhánh HSG là undefined, không khung rỗng', () => {
    const spy = vi.spyOn(BIOLOGY_LOADER, 'listAdvanced').mockReturnValue([])
    expect(BIOLOGY_LOADER.listAdvanced().length, 'giả lập môn không có chuyên đề').toBe(0)
    expect(locNhanh(buildStemOutlineForApp(SINH, '10'), 'biology', 'advanced')).toBeUndefined()
    spy.mockRestore()
  })

  it('Sinh học có chuyên đề HSG thật → nhánh HSG có đủ bài', () => {
    const cay = locNhanh(buildStemOutlineForApp(SINH, '10'), 'biology', 'advanced')!
    expect(cay.nodes.filter((n) => n.kind === 'lesson').length).toBe(
      BIOLOGY_LOADER.listAdvanced().length,
    )
  })

  it('không có cây thì trả undefined, không ném', () => {
    expect(locNhanh(undefined, 'physics', 'core')).toBeUndefined()
  })
})

// ——— [S11-3] Lớp tiến độ đi XUYÊN chỗ ghép, không bị nuốt mất ———

describe('buildStemOutlineForApp — lớp tiến độ', () => {
  const bai = PHYSICS_LOADER.listCoreByGrade('10')[0]!

  it('truyền tiến độ xuống adapter và vẫn giữ nguyên dấu "Có hoạt ảnh" của app', () => {
    const cay = buildStemOutlineForApp(LY, '10', {
      stateStatus: 'ready',
      state: new Map([
        [
          bai.id,
          {
            subjectId: 'physics' as const,
            contentId: bai.id,
            status: 'completed' as const,
            bestRatio: 1,
            lastRatio: 1,
            attempts: 2,
            completedAt: '2026-09-16T00:00:00.000Z',
            updatedAt: '2026-09-16T00:00:00.000Z',
            source: 'server' as const,
          },
        ],
      ]),
    })!
    const nut = cay.nodes.find((n) => n.contentId === bai.id)!
    expect(nut.progress).toBe('completed')
    expect(nut.evidenceSource).toBe('stem.evidence')
    expect(() => OutlineSchema.parse(cay)).not.toThrow()
    // Dấu "Có hoạt ảnh" do app đắp thêm — lớp tiến độ không được ghi đè mất nó.
    // `cay` gồm cả bài chương trình chuẩn lớp 10 LẪN chuyên đề HSG (xem test đầu file:
    // la.length = listCoreByGrade + listAdvanced), nên đếm đối chứng phải cộng cả hai.
    const coHoatAnh =
      PHYSICS_LOADER.listCoreByGrade('10').filter((b) => b.hasAnimation).length +
      PHYSICS_LOADER.listAdvanced().filter((b) => b.hasAnimation).length
    expect(cay.nodes.filter((n) => n.hint?.includes('Có hoạt ảnh') === true).length).toBe(coHoatAnh)
  })

  it('không truyền gì thì giữ nguyên hành vi S07: mọi bài "chưa đo được"', () => {
    const cay = buildStemOutlineForApp(LY, '10')!
    for (const n of cay.nodes.filter((x) => x.kind === 'lesson')) expect(n.progress).toBe('unknown')
  })
})

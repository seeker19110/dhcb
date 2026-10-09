import { describe, it, expect, vi } from 'vitest'
import { OutlineSchema, type OutlineNode } from '@dhcb/core-contracts/outline'
import type { StemLessonLike, StemSubjectId } from '@dhcb/core-contracts/stemLesson'
import type { CompletionState } from '@dhcb/core-contracts/completionEvidence'
import { MATH_LOADER } from '@dhcb/subject-math/lessonsLoader'
import { PHYSICS_LOADER } from '@dhcb/subject-physics/lessonsLoader'
import { CHEM_LOADER } from '@dhcb/subject-chemistry/lessonsLoader'
import { BIOLOGY_LOADER } from '@dhcb/subject-biology/lessonsLoader'
import type { StemLessonLoader } from '../stemLessonLoader.js'
import { buildStemOutline, type StemOutlineCtx } from './stemOutline.js'

// Chạy trên DỮ LIỆU THẬT của bốn môn (như StemLesson.test.tsx) — chỉ mục nhẹ, không nội dung.
const MON: Array<{ id: StemSubjectId; label: string; loader: StemLessonLoader<StemLessonLike> }> = [
  { id: 'mathematics', label: 'Toán', loader: MATH_LOADER as StemLessonLoader<StemLessonLike> },
  { id: 'physics', label: 'Vật lí', loader: PHYSICS_LOADER as StemLessonLoader<StemLessonLike> },
  { id: 'chemistry', label: 'Hoá học', loader: CHEM_LOADER as StemLessonLoader<StemLessonLike> },
  { id: 'biology', label: 'Sinh học', loader: BIOLOGY_LOADER as StemLessonLoader<StemLessonLike> },
]
const GRADES = ['10', '11', '12']

const ctxCua = (m: (typeof MON)[number]): StemOutlineCtx => ({
  loader: m.loader,
  subjectLabel: m.label,
  buildHref: (lesson) => `/goc-hoc-tap/${m.id}/bai-hoc/${lesson.id}`,
  tierLabel: (tier) => (tier === 'hsg-tinh' ? 'Cấp tỉnh' : (tier ?? '')),
})

const la = (nodes: readonly OutlineNode[]) => nodes.filter((n) => n.kind === 'lesson')

describe('buildStemOutline — dữ liệu thật bốn môn', () => {
  for (const m of MON) {
    it(`${m.label}: không rớt bài nào và cây hợp lệ`, () => {
      const cay = GRADES.map((g) => buildStemOutline(m.id, g, ctxCua(m))).filter(
        (o) => o !== undefined,
      )
      expect(cay.length).toBeGreaterThan(0)
      for (const outline of cay) OutlineSchema.parse(outline)

      // Bài chuẩn của mọi lớp + chuyên đề HSG (đếm MỘT lần) = toàn bộ chỉ mục của môn.
      const coreIds = new Set<string>()
      for (const outline of cay) {
        for (const node of la(outline.nodes)) {
          if (node.parentId?.endsWith('-hsg')) continue
          coreIds.add(node.contentId ?? '')
        }
      }
      const advanced = m.loader.listAdvanced().length
      expect(coreIds.size + advanced).toBe(m.loader.index.length)
    })

    it(`${m.label}: mọi bài là "chưa đo được" và mở`, () => {
      const outline = buildStemOutline(m.id, '10', ctxCua(m))
      expect(outline).toBeDefined()
      for (const node of outline!.nodes) {
        expect(node.progress).toBe('unknown')
        expect(node.availability).toBe('available')
      }
    })
  }

  it('gom chương theo SỐ chương, không theo tiêu đề chương (bẫy Hoá)', () => {
    // Hoá có nhiều chương trùng tiêu đề; số nút chapter phải bằng số `chapterNumber` khác nhau.
    const chem = MON[2]!
    for (const grade of GRADES) {
      const outline = buildStemOutline('chemistry', grade, ctxCua(chem))
      if (!outline) continue
      const soChuongThat = new Set(chem.loader.listCoreByGrade(grade).map((l) => l.chapterNumber))
        .size
      const nutChuong = outline.nodes.filter(
        (n) => n.kind === 'chapter' && n.contentId !== 'hsg',
      ).length
      expect(nutChuong).toBe(soChuongThat)
    }
  })

  it('nhánh HSG vắng hẳn khi môn không có chuyên đề', () => {
    // Từ 2026-10-09 cả bốn môn đều có chuyên đề HSG (Sinh là môn cuối, changelog 0568), nên
    // "môn không có chuyên đề" được giả lập bằng cách cho listAdvanced của Sinh trả rỗng.
    const bio = MON[3]!
    const spy = vi.spyOn(bio.loader, 'listAdvanced').mockReturnValue([])
    const outline = buildStemOutline('biology', '10', ctxCua(bio))
    expect(outline!.nodes.some((n) => n.contentId === 'hsg')).toBe(false)
    spy.mockRestore()
  })

  it('nhánh HSG là một chương riêng, bài mang nhãn cấp', () => {
    const phys = MON[1]!
    const outline = buildStemOutline('physics', '10', ctxCua(phys))!
    const hsg = outline.nodes.find((n) => n.contentId === 'hsg')
    expect(hsg?.title).toBe('Bồi dưỡng học sinh giỏi')
    const conHsg = outline.nodes.filter((n) => n.parentId === hsg?.nodeId)
    expect(conHsg).toHaveLength(phys.loader.listAdvanced().length)
    expect(conHsg.every((n) => (n.hint ?? '') !== '')).toBe(true)
  })

  it('KHÔNG nạp nội dung bài để dựng cây (bất biến AC-6)', () => {
    const math = MON[0]!
    const spy = vi.spyOn(math.loader, 'loadLesson')
    buildStemOutline('mathematics', '11', ctxCua(math))
    expect(spy).toHaveBeenCalledTimes(0)
    spy.mockRestore()
  })

  it('lớp không có bài và môn không chuyên đề → undefined', () => {
    const bio = MON[3]!
    const spy = vi.spyOn(bio.loader, 'listAdvanced').mockReturnValue([])
    expect(buildStemOutline('biology', '99', ctxCua(bio))).toBeUndefined()
    spy.mockRestore()
  })

  it('href do nơi gọi dựng, gắn đúng từng bài', () => {
    const math = MON[0]!
    const outline = buildStemOutline('mathematics', '10', ctxCua(math))!
    for (const node of la(outline.nodes)) {
      expect(node.href).toBe(`/goc-hoc-tap/mathematics/bai-hoc/${node.contentId}`)
    }
  })
})

// ——— [S11-3] Lớp TIẾN ĐỘ đắp lên cây từ bằng chứng hoàn thành (AC-15, AC-16) ———

describe('buildStemOutline — tiến độ từ completion_state', () => {
  const physics = MON[1]!
  const baiDau = physics.loader.listCoreByGrade('10')[0]!
  const baiHai = physics.loader.listCoreByGrade('10')[1]!

  const trangThai = (
    contentId: string,
    status: 'in_progress' | 'completed',
    source: 'server' | 'local',
  ): CompletionState => ({
    subjectId: 'physics',
    contentId,
    status,
    bestRatio: status === 'completed' ? 1 : 0.5,
    lastRatio: 0.5,
    attempts: 1,
    completedAt: status === 'completed' ? '2026-09-16T00:00:00.000Z' : null,
    updatedAt: '2026-09-16T00:00:00.000Z',
    source,
  })

  const cayVoi = (
    state: ReadonlyMap<string, CompletionState>,
    stateStatus: 'loading' | 'ready' | 'error',
  ) => buildStemOutline('physics', '10', { ...ctxCua(physics), state, stateStatus })!

  const tienDoCua = (outline: ReturnType<typeof cayVoi>, id: string) =>
    la(outline.nodes).find((n) => n.contentId === id)!

  it('ready + có bằng chứng → "đã xong"/"đang học dở", kèm nguồn bằng chứng', () => {
    const cay = cayVoi(
      new Map([
        [baiDau.id, trangThai(baiDau.id, 'completed', 'server')],
        [baiHai.id, trangThai(baiHai.id, 'in_progress', 'server')],
      ]),
      'ready',
    )
    expect(tienDoCua(cay, baiDau.id).progress).toBe('completed')
    expect(tienDoCua(cay, baiDau.id).evidenceSource).toBe('stem.evidence')
    expect(tienDoCua(cay, baiHai.id).progress).toBe('in-progress')
    expect(tienDoCua(cay, baiHai.id).evidenceSource).toBe('stem.evidence')
    // Cây vẫn hợp lệ theo hợp đồng (evidenceSource là BẮT BUỘC khi khác 'not-started'/'unknown').
    OutlineSchema.parse(cay)
  })

  it('khách: nguồn bằng chứng nói rõ kết quả mới nằm trên máy này', () => {
    const cay = cayVoi(new Map([[baiDau.id, trangThai(baiDau.id, 'completed', 'local')]]), 'ready')
    expect(tienDoCua(cay, baiDau.id).evidenceSource).toBe('stem.evidence.local')
  })

  it('ready + KHÔNG có bằng chứng → "chưa học" (AC-16: mở bài không làm bài thành đang học dở)', () => {
    const cay = cayVoi(new Map(), 'ready')
    for (const node of la(cay.nodes)) {
      expect(node.progress).toBe('not-started')
      expect(node.evidenceSource).toBeUndefined()
    }
  })

  it('loading/error → "chưa đo được", KHÔNG phải "chưa học"', () => {
    // Khác nhau một trời một vực: "chưa học" là một sự thật về người học, còn "chưa đo được"
    // là một sự thật về HỆ THỐNG. Nói nhầm cái này thành cái kia là nói dối người học.
    for (const status of ['loading', 'error'] as const) {
      const cay = cayVoi(
        new Map([[baiDau.id, trangThai(baiDau.id, 'completed', 'server')]]),
        status,
      )
      for (const node of la(cay.nodes)) expect(node.progress).toBe('unknown')
    }
  })

  it('bằng chứng của bài KHÔNG có trong lớp này không rò sang bài khác', () => {
    const cay = cayVoi(
      new Map([
        ['mot-bai-khong-co-that', trangThai('mot-bai-khong-co-that', 'completed', 'server')],
      ]),
      'ready',
    )
    for (const node of la(cay.nodes)) expect(node.progress).toBe('not-started')
  })

  it('đắp tiến độ vẫn KHÔNG nạp nội dung bài nào (bất biến AC-6 giữ nguyên)', () => {
    const spy = vi.spyOn(physics.loader, 'loadLesson')
    cayVoi(new Map([[baiDau.id, trangThai(baiDau.id, 'completed', 'server')]]), 'ready')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('nhánh HSG cũng đọc bằng chứng như bài chuẩn', () => {
    const hsg = physics.loader.listAdvanced()[0]!
    const cay = cayVoi(new Map([[hsg.id, trangThai(hsg.id, 'completed', 'server')]]), 'ready')
    expect(tienDoCua(cay, hsg.id).progress).toBe('completed')
    // Nhãn cấp HSG (`hint`) không bị lớp tiến độ ghi đè mất.
    expect(tienDoCua(cay, hsg.id).hint).toBeDefined()
  })
})

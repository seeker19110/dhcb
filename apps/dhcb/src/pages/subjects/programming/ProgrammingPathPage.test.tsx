// Cổng cho trang LỘ TRÌNH MỤC TIÊU: lối "Vào học" phải bám dữ liệu thật, không hứa suông.
//
// Cùng lý do với ProgrammingSpecializationPage.test.tsx: test dữ liệu (learningPaths.test.ts)
// chứng minh MANIFEST đúng, không chứng minh TRANG đọc đúng manifest. Ba lỗi trang này có thể
// mắc: hiện nút vào chặng chưa có bài, giấu giai đoạn đang soạn, và đoán bừa khi id lộ trình lạ.
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getLearningPath, pathStageRefs } from '@dhcb/subject-programming/learningPaths/registry'
import { unitsOfStage } from '@dhcb/subject-programming/specializations/stageUnits'
import { stageHasQuiz } from '@dhcb/subject-programming/learningPaths/stageQuizzes'
import { buildSlugSegment } from '@core/slug'
import ProgrammingPathPage from './ProgrammingPathPage'

vi.mock('../../../components/Layout', () => ({ default: () => null }))
const authMock = vi.hoisted(() => ({ user: null as { id: string } | null }))
vi.mock('../../../context/useAuth', () => ({ useAuth: () => ({ user: authMock.user }) }))
// Ép rỗng MỘT chặng thật để canh nhánh "đang soạn" — không gán cứng vào một stageId cụ thể của
// manifest, vì mọi chặng của principal-ai nay đều đã có bài (milestone nội dung, xem PROGRESS.md).
const forcedEmptyStage = vi.hoisted(() => ({ stageId: null as string | null }))
vi.mock('@dhcb/subject-programming/specializations/stageUnits', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@dhcb/subject-programming/specializations/stageUnits')>()
  return {
    ...actual,
    unitsOfStage: (stageId: string) =>
      stageId === forcedEmptyStage.stageId ? [] : actual.unitsOfStage(stageId),
  }
})
vi.mock('../../../lib/programmingSpecProgress', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/programmingSpecProgress')>()
  return { ...actual, fetchSpecProgress: async () => actual.EMPTY_SPEC_PROGRESS }
})
vi.mock('../../../lib/programmingPathProgress', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/programmingPathProgress')>()
  return { ...actual, fetchPathProgress: async () => [] }
})
vi.mock('../../../lib/programmingPathArtifacts', () => ({
  fetchPathArtifacts: async () => [],
}))
vi.mock('../../../lib/programmingProgress', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/programmingProgress')>()
  return { ...actual, fetchProgress: async () => [] }
})

// URL thật là `<mã lộ trình>--<tiêu đề đã slug hoá>` (đổi 2026-08-31).
function render(pathId: string) {
  const path = getLearningPath(pathId)
  const doan = path ? buildSlugSegment(path.id, path.title) : pathId
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/lap-trinh/lo-trinh/${doan}`]}>
      <Routes>
        <Route path="/lap-trinh/lo-trinh/:pathId" element={<ProgrammingPathPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const NHAN_VAO_HOC = 'Vào học chặng này'

describe('ProgrammingPathPage — trang lộ trình mục tiêu', () => {
  it('hiện đủ mọi giai đoạn và mọi chặng của manifest', () => {
    const html = render('principal-ai')
    const path = getLearningPath('principal-ai')!
    for (const phase of path.phases) {
      // renderToStaticMarkup escape &, so chuỗi thô sẽ trượt oan.
      expect(html).toContain(phase.name.replace(/&/g, '&amp;'))
    }
    for (const ref of pathStageRefs(path)) {
      expect(html, `thiếu chặng ${ref.stageId}`).toContain(ref.stageId.toUpperCase())
    }
  })

  it('hiện đúng P1–P4 trước phần chuyên sâu để người mới có đường đi từ số 0', () => {
    const html = render('principal-ai')
    expect(html).toContain('Chặng nền tảng — bắt đầu từ số 0')
    for (const levelId of ['P1', 'P2', 'P3', 'P4']) expect(html).toContain(`${levelId} ·`)
    expect(html).not.toContain('P5 ·')
    expect(html).not.toContain('P6 ·')
    expect(html.split('Học bậc này').length - 1).toBe(4)
  })

  it('nút "Vào học" hiện ĐÚNG bằng số chặng đã có bài thật — không hứa suông', () => {
    const html = render('principal-ai')
    const soChangCoBai = pathStageRefs(getLearningPath('principal-ai')!).filter(
      (r) => unitsOfStage(r.stageId).length > 0,
    ).length
    expect(html.split(NHAN_VAO_HOC).length - 1).toBe(soChangCoBai)
  })

  it('chặng chưa có bài phải nói rõ "đang soạn", không giấu', () => {
    // Mọi chặng thật của principal-ai nay đều đã có bài (milestone nội dung) — ép rỗng một
    // chặng thật để canh nhánh "đang soạn" của TRANG vẫn hoạt động đúng khi dữ liệu về sau
    // có chặng chưa soạn xong, thay vì phụ thuộc một chặng cụ thể đang trống hôm nay.
    forcedEmptyStage.stageId = 'devops-s2'
    try {
      expect(render('principal-ai')).toContain('đang soạn')
    } finally {
      forcedEmptyStage.stageId = null
    }
  })

  it('id lộ trình lạ: nói không biết, không đoán bừa', () => {
    const html = render('khong-co-lo-trinh-nay')
    expect(html).toContain('Không có lộ trình này')
    expect(html).not.toContain(NHAN_VAO_HOC)
  })
})

describe('ProgrammingPathPage — đợt 3: quiz + hồ sơ bằng chứng (đã đăng nhập)', () => {
  it('mọi chặng của principal-ai nay ĐỀU có quiz (đợt bổ sung 2026-08-31) → mỗi chặng một nút bài kiểm', () => {
    authMock.user = { id: 'u1' }
    const html = render('principal-ai')
    const path = getLearningPath('principal-ai')!
    const refs = pathStageRefs(path)
    expect(refs.every((r) => stageHasQuiz(r.stageId))).toBe(true)
    // [0500, audit M22] Dạng gọn: MỘT nút mỗi chặng, tên đọc kèm tên chặng — không còn hộp
    // "Bài kiểm sau chặng — Mở bài kiểm" lặp lại.
    expect(html.match(/aria-label="Mở bài kiểm sau chặng /g)).toHaveLength(refs.length)
    expect(html).not.toContain('Bài kiểm sau chặng</span>')
    expect(html).not.toContain('Chặng này chưa có bài kiểm')
  })

  it('hiện mục "Hồ sơ bằng chứng" khi đã đăng nhập', () => {
    authMock.user = { id: 'u1' }
    expect(render('principal-ai')).toContain('Hồ sơ bằng chứng')
  })

  it('chưa đăng nhập: KHÔNG hiện quiz lẫn hồ sơ bằng chứng (giữ đúng hành vi đợt 1/2)', () => {
    authMock.user = null
    const html = render('principal-ai')
    expect(html).not.toContain('Mở bài kiểm')
    expect(html).not.toContain('Hồ sơ bằng chứng')
  })
})

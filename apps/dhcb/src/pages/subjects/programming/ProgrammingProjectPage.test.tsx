// Trang dự án trục — trạng thái hạ tầng T2/T3 (2026-10-09,
// docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md).
//
// Kiểm đúng thứ chỉ lộ ra trên trang (bộ chọn đã có test riêng):
//   · Hôm nay T2/T3 chưa có bước → trang dựng T1 đầy đủ, bộ chọn hiện T2/T3 "Sắp mở".
//   · Bộ đệm máy này ghi một dự án CHƯA mở (vd server cũ trả T2) → trang vẫn quy về T1, không
//     dựng trang trống.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { PROJECT_STAGES } from '@dhcb/subject-programming/projectSteps'
import { isProjectTrackAvailable } from '@dhcb/subject-programming/projectTracks'
import ProgrammingProjectPage from './ProgrammingProjectPage'

vi.mock('../../../components/Layout', () => ({
  default: ({ title }: { title: string }) => <header data-layout-title={title} />,
}))
vi.mock('../../../components/CodeEditor', () => ({ default: () => null }))
vi.mock('../../../lib/codeRunner', () => ({
  runLessonCode: vi.fn(),
  resetLessonRunners: vi.fn(),
}))
vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', plan: 'free' }, loading: false }),
}))

function render(url = '/lap-trinh/du-an'): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <ProgrammingProjectPage />
    </MemoryRouter>,
  )
}

/** Thẻ <input> radio của một dự án (thứ tự thuộc tính do React quyết định — không đoán). */
function radioTag(html: string, id: string): string {
  const tag = html.match(new RegExp(`<input id="project-track-${id}"[^>]*>`))?.[0]
  if (!tag) throw new Error(`không thấy radio ${id}`)
  return tag
}

beforeEach(() => localStorage.clear())

describe('ProgrammingProjectPage — chọn dự án trục', () => {
  it('mặc định T1: tiêu đề, bộ chọn và đủ 5 chặng của T1', () => {
    const html = render()
    expect(html).toContain('Dự án: Cửa hàng của tôi')
    expect(html).toContain('Chọn dự án của bạn')
    expect(radioTag(html, 'T1')).toContain('checked=""')
    for (const stage of PROJECT_STAGES) expect(html).toContain(stage.title)
    expect(html).toContain(`Bước 1: ${PROJECT_STAGES[0]!.steps[0]!.title}`)
  })

  it('T2/T3 chưa có bước: radio bị vô hiệu + "Sắp mở"', () => {
    const html = render()
    for (const id of ['T2', 'T3'] as const) {
      if (isProjectTrackAvailable(id)) continue
      expect(radioTag(html, id)).toContain('disabled=""')
    }
    if (!isProjectTrackAvailable('T2') || !isProjectTrackAvailable('T3')) {
      expect(html).toContain('Sắp mở')
    }
  })

  it('bộ đệm ghi dự án CHƯA mở → vẫn dựng T1, không trang trống', () => {
    for (const id of ['T2', 'T3'] as const) {
      if (isProjectTrackAvailable(id)) continue
      localStorage.setItem('dhcb_prog_track_u1', id)
      const html = render()
      expect(html).toContain('Dự án: Cửa hàng của tôi')
      expect(radioTag(html, 'T1')).toContain('checked=""')
    }
  })

  it('?chang= lạ → rơi về chặng đầu có bước (không vỡ trang)', () => {
    const html = render('/lap-trinh/du-an?chang=p9')
    expect(html).toContain(`Bước 1: ${PROJECT_STAGES[0]!.steps[0]!.title}`)
  })
})

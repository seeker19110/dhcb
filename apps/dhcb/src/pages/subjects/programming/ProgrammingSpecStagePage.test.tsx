// Cổng cho trang CHẶNG của hướng chuyên sâu: hoạt ảnh module phải LỘ RA đúng chỗ.
//
// Vì sao cần: dữ liệu `animation` của module `algo-s1-m1` đã có từ PR #1099 nhưng suốt một
// đợt không ai nhìn thấy — trang chưa gọi renderer. `specStageDetails.test.ts` chứng minh DỮ
// LIỆU qua schema, test này chứng minh TRANG thật sự vẽ nó (và KHÔNG vẽ ở module không có,
// để tránh một khung "Hoạt ảnh minh hoạ" rỗng).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getSpecialization } from '@dhcb/subject-programming/specializations/registry'
import { getSpecStageDetail } from '@dhcb/subject-programming/specializations/stageDetails'
import { PROGRAMMING_PREFIX, duongDanChangHuong } from '../../../lib/programmingRoutes'
import ProgrammingSpecStagePage from './ProgrammingSpecStagePage'

// Bộ nạp lười: mặc định trả đúng dữ liệu tĩnh; từng test có thể bắt nó lỗi.
const loaderMock = vi.hoisted(() => ({ failNext: 0 }))
vi.mock('@dhcb/subject-programming/specializations/stageDetailsLoader', async (orig) => {
  const real =
    await orig<typeof import('@dhcb/subject-programming/specializations/stageDetailsLoader')>()
  return {
    ...real,
    loadSpecStageDetail: async (id: string) => {
      if (loaderMock.failNext > 0) {
        loaderMock.failNext--
        throw new Error('chunk load failed')
      }
      return real.loadSpecStageDetail(id)
    },
  }
})

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mounted: { root: Root; container: HTMLDivElement } | null = null

afterEach(() => {
  if (mounted) {
    const { root, container } = mounted
    act(() => root.unmount())
    container.remove()
    mounted = null
  }
  loaderMock.failNext = 0
})

const NHAN_NGHIEM_THU = 'Nghiệm thu — mỗi dòng phải chứng minh được'

/** Xả các Promise đang chờ (bộ nạp lười) trong `act` để React áp kết quả. */
async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
  })
}

vi.mock('../../../components/Layout', () => ({ default: () => null }))
// Khách chưa đăng nhập: trang không gọi API tiến độ, đúng nhánh renderToStaticMarkup cần.
vi.mock('../../../context/useAuth', () => ({ useAuth: () => ({ user: null, loading: false }) }))

const NHAN_HOAT_ANH = 'Hoạt ảnh minh hoạ'

function mount(specId: string, stageId: string): HTMLDivElement {
  const spec = getSpecialization(specId)!
  const stage = spec.stages.find((s) => s.id === stageId)!
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted = { root, container }
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[duongDanChangHuong(spec, stage)]}>
        <Routes>
          <Route
            path={`${PROGRAMMING_PREFIX}/huong/:specId/:stageId`}
            element={<ProgrammingSpecStagePage />}
          />
        </Routes>
      </MemoryRouter>,
    ),
  )
  return container
}

/** Gắn trang rồi chờ chi tiết chặng nạp xong (khối "Nghiệm thu" chỉ có khi đã có chi tiết). */
async function render(specId: string, stageId: string) {
  const container = mount(specId, stageId)
  await flush()
  expect(container.textContent).toContain(NHAN_NGHIEM_THU)
  return container.innerHTML
}

describe('ProgrammingSpecStagePage — hoạt ảnh minh hoạ module', () => {
  it('chặng có module mang animation: vẽ SVG kèm tiêu đề + mô tả bằng lời, đúng SỐ module có', async () => {
    const detail = getSpecStageDetail('algo-s1')!
    const coHoatAnh = detail.modules.filter((m) => m.animation)
    expect(coHoatAnh.length, 'algo-s1-m1 phải còn animation (GĐ1)').toBeGreaterThan(0)

    const html = await render('algo', 'algo-s1')
    expect(html.split(NHAN_HOAT_ANH).length - 1).toBe(coHoatAnh.length)
    // Đếm SVG có role="img" (renderer hoạt ảnh) — biểu tượng lucide cũng là <svg> nhưng aria-hidden.
    expect(html.split('role="img"').length - 1).toBe(coHoatAnh.length)
    for (const m of coHoatAnh) {
      // Mô tả bằng lời là kênh thông tin cho người tắt hoạt ảnh / đọc màn hình — bắt buộc lộ ra.
      expect(html).toContain(m.animation!.description.replace(/&/g, '&amp;'))
      expect(html).toContain(`aria-label="${m.animation!.title}"`)
    }
  })

  it('chặng KHÔNG có module nào mang animation: không hiện khung rỗng, không có SVG', async () => {
    // Tìm động một chặng thật sự trống để không ghim cứng — GĐ2 sẽ lấp dần các chặng.
    const trong = getSpecialization('web')!.stages.find((s) =>
      getSpecStageDetail(s.id)?.modules.every((m) => !m.animation),
    )
    expect(trong, 'không còn chặng nào trống animation — bỏ test này').toBeDefined()

    const html = await render('web', trong!.id)
    expect(html).not.toContain(NHAN_HOAT_ANH)
    expect(html).not.toContain('role="img"')
  })
})

describe('ProgrammingSpecStagePage — nạp lười chi tiết chặng', () => {
  it('trong lúc tải: báo "đang tải", KHÔNG hiện ghi chú "chưa soạn" (tránh nháy nội dung sai)', async () => {
    const container = mount('web', 'web-s2')
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Đang tải chi tiết chặng',
    )
    expect(container.textContent).not.toContain('Chặng này mới có bản đồ')
    await flush()
    expect(container.textContent).toContain(NHAN_NGHIEM_THU)
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('tải lỗi: hiện thông báo lỗi + nút Thử lại; bấm thì nạp lại được', async () => {
    loaderMock.failNext = 1
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const container = mount('web', 'web-s2')
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Không tải được chi tiết chặng',
    )
    expect(container.textContent).not.toContain('Chặng này mới có bản đồ')
    expect(warn).toHaveBeenCalled()

    const nut = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Thử lại')
    act(() => nut?.click())
    expect(container.querySelector('[role="status"]')).not.toBeNull()
    await flush()
    expect(container.textContent).toContain(NHAN_NGHIEM_THU)
    expect(container.querySelector('[role="alert"]')).toBeNull()
    warn.mockRestore()
  })
})

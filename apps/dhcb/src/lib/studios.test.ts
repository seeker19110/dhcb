import { describe, it, expect } from 'vitest'
import { STUDIOS, NAV_HIDDEN_PATHS, isNavHidden, isNavHiddenPath } from './studios'

// Cổng canh registry studio — hàng chục file phụ thuộc (codemap 2026-09-15), và hai chỗ tra theo id
// (`DesktopSidebar.studio()`, `breadcrumb.studioPath()`) NÉM LỖI LÚC NẠP MODULE khi id không có:
// sai một dòng ở đây là app trắng, không có thông báo nào để lần ra.
describe('STUDIOS — không gian nền tảng', () => {
  // [2026-09-20] `career` và `worklife` đã bị GỠ HẲN (trang, route, client API). Nửa "Công việc"
  // của `worklife` giữ lại dưới id `notes`, tên hiển thị "Ghi chú", đường dẫn `/ghi-chu`.
  it('đúng 4 studio, id duy nhất, đường dẫn tuyệt đối', () => {
    expect(STUDIOS.map((s) => s.id)).toEqual(['companion', 'practice', 'subjects', 'notes'])
    expect(new Set(STUDIOS.map((s) => s.id)).size).toBe(STUDIOS.length)
    for (const st of STUDIOS) expect(st.to.startsWith('/'), st.id).toBe(true)
  })

  // Slice 02: Tiếng Anh là MỘT MÔN, không phải không gian cấp nền tảng.
  it('KHÔNG có studio english — Tiếng Anh nằm trong Góc học tập', () => {
    expect(STUDIOS.some((s) => s.id === 'english')).toBe(false)
    expect(STUDIOS.some((s) => s.to === '/hoc-tieng-anh')).toBe(false)
  })

  it('KHÔNG còn studio career/worklife — ba trụ đã gỡ không lẻn trở lại', () => {
    for (const id of ['career', 'worklife', 'startup', 'life']) {
      expect(
        STUDIOS.some((s) => s.id === id),
        id,
      ).toBe(false)
    }
    for (const to of ['/su-nghiep-khoi-nghiep', '/cong-viec-cuoc-song']) {
      expect(
        STUDIOS.some((s) => s.to === to),
        to,
      ).toBe(false)
    }
  })

  it('studio Ghi chú trỏ đúng /ghi-chu', () => {
    expect(STUDIOS.find((s) => s.id === 'notes')?.to).toBe('/ghi-chu')
  })

  it('Góc học tập trỏ đúng tiền tố chuẩn', () => {
    expect(STUDIOS.find((s) => s.id === 'subjects')?.to).toBe('/goc-hoc-tap')
  })

  it('mọi màu chữ đều có biến thể theme-light (AA ở 3 theme nền sáng)', () => {
    for (const st of STUDIOS) expect(st.color, st.id).toMatch(/theme-light:text-/)
  })

  it('trang ẩn thanh điều hướng vẫn là login + onboarding', () => {
    expect(NAV_HIDDEN_PATHS).toEqual(['/login', '/onboarding'])
  })
})

describe('isNavHidden / isNavHiddenPath (audit 2026-09-30 minor 11)', () => {
  const guest = { isGuest: true }
  const member = { isGuest: false }

  it('chưa có user (đang tải) → ẩn thanh, nhưng trang thường KHÔNG thuộc nhóm "không bao giờ có sidebar"', () => {
    expect(isNavHidden('/', null)).toBe(true)
    expect(isNavHidden('/', undefined)).toBe(true)
    expect(isNavHiddenPath('/')).toBe(false)
  })

  it('login, onboarding, trang giới thiệu → ẩn với MỌI người, quyết theo đường dẫn', () => {
    for (const p of ['/login', '/onboarding', '/welcome', '/learn-vietnamese']) {
      expect(isNavHiddenPath(p)).toBe(true)
      expect(isNavHidden(p, guest)).toBe(true)
      expect(isNavHidden(p, member)).toBe(true)
    }
  })

  it('trang thường: khách và thành viên đều có thanh điều hướng', () => {
    for (const p of ['/', '/goc-hoc-tap']) {
      expect(isNavHidden(p, guest)).toBe(false)
      expect(isNavHidden(p, member)).toBe(false)
    }
  })
})

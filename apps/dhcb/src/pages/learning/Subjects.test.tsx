// apps/dhcb/src/pages/learning/Subjects.test.tsx
//
// [S03-1, 2026-09-15] Cổng cho hai lỗi mà không cổng nào đang bắt:
//   1. Lỗi TẢI bị biến thành "danh mục trống" — người học tưởng nền tảng không có môn nào.
//   2. Đổi bộ lọc nhanh: response của lượt CŨ về sau và ghi đè danh sách đang đúng.
// Cả hai đều là lỗi NGHIỆP VỤ, type-checker không bắt được (CLAUDE.md mục 4.9), nên test
// viết TRƯỚC theo đặc tả §⑤ ("S03 thêm regression test trước sửa").
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { SUBJECT_MANIFEST_SCHEMA_VERSION } from '@dhcb/core-contracts/subjectManifest'
import type { SubjectManifest } from '@dhcb/core-contracts/subjectManifest'
import Subjects from './Subjects'
import { SubjectApiError } from '../../lib/subjectApi'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../components/Layout', () => ({ default: () => null }))

const listSubjectsMock = vi.hoisted(() => vi.fn())
const goToSubjectHomeMock = vi.hoisted(() => vi.fn())
vi.mock('../../lib/subjectsHost', async () => {
  const actual =
    await vi.importActual<typeof import('../../lib/subjectsHost')>('../../lib/subjectsHost')
  return { ...actual, goToSubjectHome: goToSubjectHomeMock }
})
vi.mock('../../lib/subjectApi', async () => {
  const actual =
    await vi.importActual<typeof import('../../lib/subjectApi')>('../../lib/subjectApi')
  return { ...actual, listSubjects: listSubjectsMock }
})

function manifest(over: Partial<SubjectManifest> = {}): SubjectManifest {
  return {
    id: 'english',
    label: 'Tiếng Anh',
    description: 'Luyện giao tiếp theo chuẩn CEFR',
    category: 'language',
    taxonomyKind: 'cefr',
    standardLevels: ['A1'],
    questionTypes: ['vocabulary_mcq'],
    evaluationModes: ['rubric_ai'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
    ...over,
  } as SubjectManifest
}

describe('trang Môn học — trạng thái tải/lỗi/rỗng', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    listSubjectsMock.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function hien() {
    act(() => {
      root.render(
        <MemoryRouter>
          <Subjects />
        </MemoryRouter>,
      )
    })
  }

  /** Cho microtask của promise chạy hết rồi React flush xong. */
  async function chay() {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  function chu() {
    return container.textContent ?? ''
  }

  /** Nút bộ lọc theo nhãn hiển thị. */
  function nut(nhan: string): HTMLButtonElement {
    const found = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === nhan,
    )
    if (!found) throw new Error(`Không tìm thấy nút "${nhan}"`)
    return found as HTMLButtonElement
  }

  it('mất mạng: hiện bảng lỗi có role="alert", KHÔNG nói là danh mục trống', async () => {
    listSubjectsMock.mockRejectedValue(
      new SubjectApiError('network', 'Không kết nối được tới máy chủ để tải danh mục môn học.'),
    )

    hien()
    await chay()

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(chu()).toContain('Không kết nối được tới máy chủ')
    // Đây là câu của nhánh "rỗng" — nó mà xuất hiện nghĩa là lỗi lại bị hoá trang thành rỗng.
    expect(chu()).not.toContain('chưa có môn học nào')
  })

  it('503: in mã lỗi thật cho người dùng biết đang hỏng ở đâu', async () => {
    listSubjectsMock.mockRejectedValue(
      new SubjectApiError('http', 'Máy chủ danh mục môn học đang bảo trì hoặc quá tải (503).', 503),
    )

    hien()
    await chay()

    expect(chu()).toContain('503')
  })

  it('thành công nhưng danh mục rỗng (bộ lọc "Tất cả môn"): nói đúng là danh mục rỗng, KHÔNG hiện bảng lỗi, KHÔNG gợi ý chọn lại bộ lọc đang chọn', async () => {
    listSubjectsMock.mockResolvedValue([])

    hien()
    await chay()

    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(chu()).toContain('Hiện chưa có môn học nào trong danh mục')
    // Bộ lọc "Tất cả môn" đang được chọn — gợi ý chọn lại nó là vô nghĩa.
    expect(chu()).not.toContain('Bộ lọc này hiện chưa có môn học nào')
  })

  it('bộ lọc KHÔNG PHẢI "Tất cả môn" mà rỗng: gợi ý chuyển sang "Tất cả môn"', async () => {
    // Môn "english" ở category 'language' — server chỉ trả về nó khi lọc 'all'/'language',
    // lọc 'stem' đúng ra phải rỗng (mô phỏng đúng hành vi server lọc theo tham số).
    listSubjectsMock.mockImplementation((cat?: string) =>
      Promise.resolve(cat === 'stem' ? [] : [manifest()]),
    )

    hien()
    await chay()

    const stemBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('STEM'),
    )
    expect(stemBtn).toBeTruthy()
    act(() => {
      stemBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await chay()

    expect(chu()).toContain('Bộ lọc này hiện chưa có môn học nào')
  })

  it('tìm kiếm không khớp là chuyện khác hẳn với danh mục rỗng', async () => {
    listSubjectsMock.mockResolvedValue([manifest()])

    hien()
    await chay()

    const o = container.querySelector('input[type="text"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(o, 'zzz-không-có-môn-nào')
      o.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(chu()).toContain('Không tìm thấy môn học nào khớp với từ khóa')
    expect(chu()).not.toContain('Bộ lọc này hiện chưa có môn học nào')
  })

  it('KHÔNG tự thử lại: lỗi xong vẫn đúng một lượt gọi cho tới khi người dùng bấm', async () => {
    listSubjectsMock.mockRejectedValue(new SubjectApiError('network', 'mất mạng'))

    hien()
    await chay()
    expect(listSubjectsMock).toHaveBeenCalledTimes(1)

    // Chờ thêm vài vòng microtask — không có lượt gọi nào tự mọc ra.
    await chay()
    expect(listSubjectsMock).toHaveBeenCalledTimes(1)

    listSubjectsMock.mockResolvedValue([manifest()])
    act(() => nut('Thử lại').click())
    await chay()

    expect(listSubjectsMock).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(chu()).toContain('Tiếng Anh')
  })

  it('RACE: response của bộ lọc CŨ về muộn không được ghi đè bộ lọc đang chọn', async () => {
    // Lượt 1 (Tất cả) cố ý về SAU lượt 2 (Ngôn ngữ) — đúng kịch bản bấm nhanh hai nút.
    let giaiPhongLuot1: (v: SubjectManifest[]) => void = () => {}
    const luot1 = new Promise<SubjectManifest[]>((resolve) => {
      giaiPhongLuot1 = resolve
    })

    listSubjectsMock.mockImplementationOnce(() => luot1)

    hien()

    listSubjectsMock.mockResolvedValue([manifest({ id: 'english', label: 'Tiếng Anh' })])
    act(() => nut('Ngôn ngữ').click())
    await chay()

    expect(chu()).toContain('Tiếng Anh')

    // Giờ mới thả response CŨ của "Tất cả môn". Nó KHÔNG được xuất hiện.
    // Nhãn phải là chuỗi KHÔNG có sẵn trên trang: "Vật lí" trượt ca này vì phụ đề tĩnh
    // của trang đã liệt kê sẵn tên môn, test sẽ đỏ cả khi mã chạy đúng.
    act(() => {
      giaiPhongLuot1([manifest({ id: 'physics', label: 'MônCũKhôngĐượcHiện', category: 'stem' })])
    })
    await chay()

    expect(chu()).toContain('Tiếng Anh')
    expect(chu()).not.toContain('MônCũKhôngĐượcHiện')
  })

  it('RACE lỗi: lỗi của lượt đã huỷ không được đẩy bảng lỗi lên màn hình đang đúng', async () => {
    let hongLuot1: (e: unknown) => void = () => {}
    const luot1 = new Promise<SubjectManifest[]>((_resolve, reject) => {
      hongLuot1 = reject
    })
    listSubjectsMock.mockImplementationOnce(() => luot1)

    hien()

    listSubjectsMock.mockResolvedValue([manifest()])
    act(() => nut('Ngôn ngữ').click())
    await chay()
    expect(chu()).toContain('Tiếng Anh')

    act(() => hongLuot1(new SubjectApiError('network', 'mất mạng lượt cũ')))
    await chay()

    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(chu()).not.toContain('mất mạng lượt cũ')
  })

  it('đổi bộ lọc thì huỷ request cũ, không để nó chạy tiếp', async () => {
    const signals: AbortSignal[] = []
    listSubjectsMock.mockImplementation((_c: unknown, options?: { signal?: AbortSignal }) => {
      if (options?.signal) signals.push(options.signal)
      return new Promise<SubjectManifest[]>(() => {})
    })

    hien()
    act(() => nut('Khoa học STEM').click())
    await chay()

    expect(signals.length).toBeGreaterThanOrEqual(2)
    expect(signals[0]!.aborted).toBe(true)
    expect(signals[signals.length - 1]!.aborted).toBe(false)
  })
})

// Slice 02 (spec §④ AC-6, Q2): nút hành động đi qua MỘT helper biết ownership, nhãn một khuôn.
describe('trang Môn học — nút "Vào môn …"', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    listSubjectsMock.mockReset()
    goToSubjectHomeMock.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  async function hienVaChay() {
    act(() => {
      root.render(
        <MemoryRouter>
          <Subjects />
        </MemoryRouter>,
      )
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  it('nhãn "Vào môn <tên>" cho mọi môn, không còn "Không Gian Học Tiếng Anh"', async () => {
    listSubjectsMock.mockResolvedValue([
      manifest({ id: 'english', label: 'Tiếng Anh' }),
      manifest({ id: 'programming', label: 'Lập trình', category: 'stem' }),
      manifest({ id: 'physics', label: 'Vật lí', category: 'stem' }),
    ])
    await hienVaChay()
    const text = container.textContent ?? ''
    for (const label of ['Vào môn Tiếng Anh', 'Vào môn Lập trình', 'Vào môn Vật lí']) {
      expect(text).toContain(label)
    }
    expect(text).not.toContain('Không Gian Học Tiếng Anh')
    expect(text).not.toContain('Vào Lộ Trình Lập Trình')
  })

  it('bấm nút → goToSubjectHome(nav, id) — không tự ghép chuỗi, không navigate tại chỗ', async () => {
    listSubjectsMock.mockResolvedValue([manifest({ id: 'english', label: 'Tiếng Anh' })])
    await hienVaChay()
    const btn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Vào môn Tiếng Anh'),
    )
    expect(btn).toBeTruthy()
    act(() => btn!.click())
    expect(goToSubjectHomeMock).toHaveBeenCalledTimes(1)
    expect(goToSubjectHomeMock.mock.calls[0]![1]).toBe('english')
  })
})

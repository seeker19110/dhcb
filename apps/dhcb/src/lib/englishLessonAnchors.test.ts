import { afterEach, describe, expect, it, vi } from 'vitest'
import { prevNext } from '@dhcb/core-learner/outline/outlineNav'
import {
  cayBaiHoiThoai,
  docThamSoBai,
  giaiNeoBaiAnh,
  kieuCuonTheoDoc,
  NEO_BAI_ANH,
  neoLuot,
  nhanLuot,
  searchBoBai,
  searchVoiBai,
} from './englishLessonAnchors'

describe('docThamSoBai — tham số ?lesson (S09-EN-AC04)', () => {
  it('không có lesson → mở danh sách', () => {
    expect(docThamSoBai('')).toEqual({ loai: 'khong' })
    expect(docThamSoBai('?q=abc')).toEqual({ loai: 'khong' })
  })

  it('số nguyên dương viết chuẩn → so', () => {
    expect(docThamSoBai('?lesson=1')).toEqual({ loai: 'so', id: 1 })
    expect(docThamSoBai('?x=2&lesson=350')).toEqual({ loai: 'so', id: 350 })
  })

  it('rỗng / lặp / sai cú pháp → sai, kèm lý do', () => {
    expect(docThamSoBai('?lesson=')).toEqual({ loai: 'sai', lyDo: 'rong' })
    expect(docThamSoBai('?lesson=1&lesson=2')).toEqual({ loai: 'sai', lyDo: 'lap' })
    // Lặp CÙNG giá trị vẫn là lặp: không đoán ý.
    expect(docThamSoBai('?lesson=1&lesson=1')).toEqual({ loai: 'sai', lyDo: 'lap' })
    for (const raw of ['0', 'abc', '01', '+1', '-1', '1.5', ' 1', '1e2', '1234567']) {
      expect(docThamSoBai(`?lesson=${encodeURIComponent(raw)}`)).toEqual({
        loai: 'sai',
        lyDo: 'cu-phap',
      })
    }
  })
})

describe('giaiNeoBaiAnh — danh sách trắng hash', () => {
  it('không hash → khong', () => {
    expect(giaiNeoBaiAnh('', 20)).toEqual({ loai: 'khong' })
    expect(giaiNeoBaiAnh('#', 20)).toEqual({ loai: 'khong' })
  })

  it('ba phần cố định luôn hợp lệ', () => {
    for (const id of Object.values(NEO_BAI_ANH)) {
      expect(giaiNeoBaiAnh(`#${id}`, 20)).toEqual({ loai: 'dich', id })
    }
  })

  it('#luot-N trong phạm vi 1..soLuot', () => {
    expect(giaiNeoBaiAnh('#luot-1', 20)).toEqual({ loai: 'dich', id: 'luot-1' })
    expect(giaiNeoBaiAnh('#luot-20', 20)).toEqual({ loai: 'dich', id: 'luot-20' })
  })

  it('N ngoài phạm vi, số 0 đầu, hash lạ hoặc hỏng → về tiêu đề, KHÔNG kẹp về lượt cuối', () => {
    for (const h of [
      '#luot-0',
      '#luot-21',
      '#luot-01',
      '#luot-',
      '#luot-abc',
      '#luot-1234567',
      '#cau-1',
      '#ly-thuyet',
      '#"><img>',
      'luot-2',
    ]) {
      expect(giaiNeoBaiAnh(h, 20)).toEqual({ loai: 'tieu-de' })
    }
  })

  it('neoLuot khớp đúng dạng mà bộ giải chấp nhận', () => {
    expect(giaiNeoBaiAnh(`#${neoLuot(7)}`, 7)).toEqual({ loai: 'dich', id: 'luot-7' })
  })
})

describe('dựng query', () => {
  it('searchVoiBai thay mọi lesson cũ, giữ tham số khác', () => {
    expect(searchVoiBai('', 3)).toBe('?lesson=3')
    expect(searchVoiBai('?q=hi&lesson=1&lesson=2', 5)).toBe('?q=hi&lesson=5')
  })

  it('searchBoBai bỏ lesson một cách xác định, giữ tham số khác', () => {
    expect(searchBoBai('?lesson=1')).toBe('')
    expect(searchBoBai('?q=hi&lesson=1&from=home')).toBe('?q=hi&from=home')
    expect(searchBoBai('')).toBe('')
  })
})

describe('nhanLuot', () => {
  it('chiều A tiếng Việt, chiều B tiếng Anh', () => {
    expect(nhanLuot(20, 'Tom', true)).toBe('Lượt 20 — Tom')
    expect(nhanLuot(3, 'Lan', false)).toBe('Turn 3 — Lan')
  })
})

describe('kieuCuonTheoDoc — giảm chuyển động', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('bật reduce → auto; không bật → smooth', () => {
    const mm = vi.fn((q: string) => ({ matches: q.includes('reduce') }))
    vi.stubGlobal('matchMedia', mm)
    expect(kieuCuonTheoDoc()).toBe('auto')
    mm.mockImplementation(() => ({ matches: false }))
    expect(kieuCuonTheoDoc()).toBe('smooth')
  })

  it('môi trường không có matchMedia → smooth', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(kieuCuonTheoDoc()).toBe('smooth')
  })
})

// [2026-10-01, audit đồng nhất bố cục] Bài hội thoại dùng chung "Bài trước / Bài sau" với STEM.
describe('cayBaiHoiThoai — cây phẳng cho Bài trước / Bài sau', () => {
  const ds = [
    { id: 1, title: 'Giới thiệu bản thân' },
    { id: 2, title: 'Một ngày bình thường' },
    { id: 7, title: 'Đi khám bệnh' },
  ]

  it('bài giữa có cả bài trước lẫn bài sau theo ĐÚNG thứ tự chỉ mục (không theo số id)', () => {
    const cay = cayBaiHoiThoai(ds, '/goc-hoc-tap/english/bai-hoc', '?lesson=2')
    const { prev, next } = prevNext(cay, '2')
    expect(prev?.title).toBe('Giới thiệu bản thân')
    expect(next?.title).toBe('Đi khám bệnh')
  })

  it('liên kết giữ tham số khác, thay `lesson` và mở ở đầu bài (#dau-bai)', () => {
    const cay = cayBaiHoiThoai(ds, '/goc-hoc-tap/english/bai-hoc', '?dir=B&lesson=1')
    const { next } = prevNext(cay, '1')
    expect(next?.href).toBe('/goc-hoc-tap/english/bai-hoc?dir=B&lesson=2#dau-bai')
  })

  it('bài đầu không có bài trước, bài cuối không có bài sau; mã lạ → không gì cả', () => {
    const cay = cayBaiHoiThoai(ds, '/p', '')
    expect(prevNext(cay, '1').prev).toBeUndefined()
    expect(prevNext(cay, '7').next).toBeUndefined()
    expect(prevNext(cay, '99')).toEqual({})
  })

  it('chỉ mục rỗng (đang tải) vẫn là cây hợp lệ, không lá nào', () => {
    expect(cayBaiHoiThoai([], '/p', '').nodes).toHaveLength(1)
  })
})

import { describe, it, expect } from 'vitest'
import { buildCrumbs, defaultBackDestination } from './breadcrumb'

describe('buildCrumbs', () => {
  it('Trang chủ không có đường đi (không vẽ breadcrumb)', () => {
    expect(buildCrumbs('/')).toEqual([])
  })

  it('trang tầng 1 chỉ có Trang chủ › chính nó', () => {
    const crumbs = buildCrumbs('/tien-do')
    expect(crumbs.map((c) => c.label)).toEqual(['Trang chủ', 'Tiến độ'])
    expect(crumbs[0].to).toBe('/')
  })

  it('môn học lồng dưới Góc học tập', () => {
    expect(buildCrumbs('/goc-hoc-tap/mathematics').map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Toán học',
    ])
  })

  it('trang con sâu vẫn lần đúng về nhánh cha', () => {
    expect(buildCrumbs('/lap-trinh/khoa/pyai').map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Lập trình',
    ])
  })

  it('đốt cuối KHÔNG phải liên kết, các đốt trước thì có', () => {
    const crumbs = buildCrumbs('/goc-hoc-tap/physics')
    expect(crumbs[crumbs.length - 1].to).toBe('')
    expect(crumbs.slice(0, -1).every((c) => c.to !== '')).toBe(true)
  })

  it('tiêu đề trang thành đốt cuối khi khác đốt sẵn có', () => {
    expect(buildCrumbs('/lo-trinh-hoc/a1', 'Cấp A1').map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Tiếng Anh',
      'Lộ trình CEFR',
      'Cấp A1',
    ])
  })

  // Slice 02: Tiếng Anh là một MÔN dưới Góc học tập — không còn tầng "Học Tiếng Anh".
  it('trang tổng quan Tiếng Anh lồng dưới Góc học tập, đốt "Tiếng Anh" trỏ về trang môn', () => {
    const crumbs = buildCrumbs('/goc-hoc-tap/english', 'Tiếng Anh')
    expect(crumbs.map((c) => c.label)).toEqual(['Trang chủ', 'Góc học tập', 'Tiếng Anh'])
    expect(crumbs[1].to).toBe('/goc-hoc-tap')
    const tool = buildCrumbs('/lo-trinh-hoc')
    expect(tool.map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Tiếng Anh',
      'Lộ trình CEFR',
    ])
    expect(tool[2].to).toBe('/goc-hoc-tap/english')
  })

  it('không nút nào còn mang nhãn "Học Tiếng Anh"', () => {
    for (const p of [
      '/hoc-tieng-anh',
      '/goc-hoc-tap/english',
      '/lo-trinh-hoc',
      '/bai-hoc',
      '/on-thi',
    ]) {
      expect(buildCrumbs(p).map((c) => c.label)).not.toContain('Học Tiếng Anh')
    }
  })

  it('tiêu đề trùng đốt cuối thì KHÔNG nhân đôi', () => {
    expect(buildCrumbs('/tien-do', 'Tiến độ').map((c) => c.label)).toEqual(['Trang chủ', 'Tiến độ'])
  })

  it('so khớp theo BIÊN đoạn — /goc-hoc-tap không nuốt /goc-hoc-tap-abc', () => {
    expect(buildCrumbs('/goc-hoc-tap-abc').map((c) => c.label)).toEqual(['Trang chủ'])
  })

  it('nhánh tĩnh của môn Lập trình lồng dưới trang môn', () => {
    expect(buildCrumbs('/goc-hoc-tap/programming/huong').map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Lập trình',
      'Hướng chuyên sâu',
    ])
  })

  it('đốt cha ĐỘNG chèn sau các tầng tĩnh', () => {
    const crumbs = buildCrumbs(
      '/goc-hoc-tap/programming/huong/web--lap-trinh-web/s2--nen-tang',
      undefined,
      [{ label: 'Lập trình Web', to: '/goc-hoc-tap/programming/huong/web--lap-trinh-web' }],
    )
    expect(crumbs.map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Lập trình',
      'Hướng chuyên sâu',
      'Lập trình Web',
    ])
  })

  it('đốt cha động trùng tầng tĩnh liền trước thì KHÔNG nhân đôi', () => {
    expect(
      buildCrumbs('/goc-hoc-tap/programming/huong', undefined, [
        { label: 'Hướng chuyên sâu', to: '/goc-hoc-tap/programming/huong' },
      ]).map((c) => c.label),
    ).toEqual(['Trang chủ', 'Góc học tập', 'Lập trình', 'Hướng chuyên sâu'])
  })

  // [2026-09-20] Ba trụ Sự nghiệp · Khởi nghiệp · Đời sống bị gỡ hẳn cùng trang công cụ của
  // chúng (`/career/interview`, `/startup/canvas`, `/life/wheel`). Trụ còn lại là "Ghi chú".
  it('trang con của trụ Ghi chú lồng dưới đúng studio', () => {
    const crumbs = buildCrumbs('/ghi-chu/kanban', 'Bảng Kanban việc cần làm')
    expect(crumbs.map((c) => c.label)).toEqual(['Trang chủ', 'Ghi chú', 'Bảng Kanban việc cần làm'])
    expect(crumbs[1].to).toBe('/ghi-chu')
  })

  it('đường dẫn của ba trụ đã gỡ KHÔNG còn đốt cha nào', () => {
    for (const path of ['/career/interview', '/startup/canvas', '/life/wheel', '/life-graph']) {
      expect(
        buildCrumbs(path).map((c) => c.label),
        path,
      ).toEqual(['Trang chủ'])
    }
  })

  it('đường dẫn lạ chỉ còn Trang chủ, không vỡ', () => {
    expect(buildCrumbs('/khong-ton-tai/gi-do').map((c) => c.label)).toEqual(['Trang chủ'])
  })

  // [Slice 03] Mọi công cụ Tiếng Anh lồng dưới Góc học tập › Tiếng Anh (spec 03 §④ AC-3.3).
  it.each([
    ['/tro-truyen', 'Trò chuyện'],
    ['/luyen-noi', 'Luyện nói'],
    ['/luyen-viet', 'Luyện viết'],
    ['/luyen-nghe', 'Luyện nghe'],
    ['/tu-dien', 'Từ điển'],
    ['/bai-hoc', 'Bài học hôm nay'],
    ['/cau-thong-dung', 'Câu thông dụng'],
    ['/truyen-song-ngu', 'Truyện song ngữ'],
    ['/truyen-song-ngu/ft-01', 'Truyện song ngữ'],
    ['/so-tay-loi-sai', 'Sổ tay lỗi sai'],
    ['/on-thi', 'Ôn thi'],
    ['/thu-thach', 'Thử thách'],
    ['/cai-dat', 'Cài đặt môn'],
  ])('%s → Trang chủ › Góc học tập › Tiếng Anh › %s', (path, label) => {
    const crumbs = buildCrumbs(path)
    expect(crumbs.map((c) => c.label)).toEqual(['Trang chủ', 'Góc học tập', 'Tiếng Anh', label])
    expect(crumbs[2].to).toBe('/goc-hoc-tap/english')
  })

  it('trang con của công cụ: từ điển › từ, lộ trình › xếp lớp', () => {
    expect(buildCrumbs('/tu-vung/apple', 'apple').map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Tiếng Anh',
      'Từ điển',
      'apple',
    ])
    expect(buildCrumbs('/placement').map((c) => c.label)).toEqual([
      'Trang chủ',
      'Góc học tập',
      'Tiếng Anh',
      'Lộ trình CEFR',
      'Xếp lớp',
    ])
  })

  it('Luyện tập là hub đa môn — không còn công cụ Tiếng Anh nào lồng dưới nó', () => {
    for (const p of ['/tro-truyen', '/luyen-noi', '/tu-dien', '/thu-thach']) {
      expect(buildCrumbs(p).map((c) => c.label)).not.toContain('Phòng luyện tập')
    }
    expect(buildCrumbs('/luyen-tap').map((c) => c.label)).toEqual(['Trang chủ', 'Phòng luyện tập'])
  })
})

// [2026-10-01, audit đồng nhất bố cục] Nhãn nút Back và đích bấm phải là CÙNG một đốt. Trước đây
// đích mặc định là '/' cứng nên "← Tiến độ" ở Lịch sử học lại đưa về Trang chủ.
describe('defaultBackDestination — đích Back trùng nhãn', () => {
  const backOf = (pathname: string, title?: string, extra?: Parameters<typeof buildCrumbs>[2]) => {
    const ancestors = buildCrumbs(pathname, title, extra).slice(0, -1)
    return { label: ancestors[ancestors.length - 1]?.label, to: defaultBackDestination(ancestors) }
  }

  it('trang tầng 1 về Trang chủ như cũ', () => {
    expect(backOf('/tien-do', 'Tiến độ học')).toEqual({ label: 'Trang chủ', to: '/' })
  })

  it('trang con lùi đúng về trang cha ghi trên nhãn (không về Trang chủ)', () => {
    expect(backOf('/lich-su-hoc', 'Lịch sử học')).toEqual({ label: 'Tiến độ', to: '/tien-do' })
    expect(backOf('/ban-be', 'Bạn bè')).toEqual({ label: 'Hồ sơ', to: '/trang-ca-nhan' })
  })

  it('trang bài STEM có đốt động "Bài học" lùi về danh sách bài của môn', () => {
    const r = backOf('/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do', 'Sự rơi tự do', [
      { label: 'Bài học môn Vật lí', to: '/goc-hoc-tap/physics/bai-hoc' },
    ])
    expect(r).toEqual({ label: 'Bài học môn Vật lí', to: '/goc-hoc-tap/physics/bai-hoc' })
  })

  it('không có đốt cha, hoặc đốt cha không có liên kết → về Trang chủ', () => {
    expect(defaultBackDestination([])).toBe('/')
    expect(defaultBackDestination([{ label: 'X', to: '' }])).toBe('/')
  })
})

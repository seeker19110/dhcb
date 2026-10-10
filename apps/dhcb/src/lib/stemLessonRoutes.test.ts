// Cổng cho lớp định tuyến bốn môn STEM.
//
// Điểm đáng canh nhất: URL mang tiêu đề (CLAUDE.md mục 7). Mã bài phải đi qua nguyên vẹn,
// còn phần slug chỉ để người đọc và máy tìm kiếm hiểu — nếu vòng dựng-rồi-đọc-lại không khép
// kín thì link đã chia sẻ sẽ dẫn tới trang trống mà không ai hay.
import { describe, expect, it } from 'vitest'
import {
  STEM_SUBJECTS,
  chonLopMacDinh,
  duongDanBaiHoc,
  lopCoBai,
  duongDanDanhSachBai,
  getStemSubject,
  maBaiTuUrl,
  nhanCapHsg,
} from './stemLessonRoutes'

describe('stemLessonRoutes', () => {
  it('nhận đúng bốn môn STEM, từ chối mã môn khác', () => {
    expect(getStemSubject('mathematics')?.label).toBe('Toán')
    expect(getStemSubject('physics')?.label).toBe('Vật lí')
    expect(getStemSubject('chemistry')?.label).toBe('Hoá học')
    expect(getStemSubject('biology')?.label).toBe('Sinh học')
    expect(getStemSubject('english')).toBeUndefined()
    expect(getStemSubject(undefined)).toBeUndefined()
  })

  it('dựng URL rồi đọc lại ra ĐÚNG mã bài — vòng khép kín', () => {
    const url = duongDanBaiHoc('physics', 'ly10-c2-b10', 'Sự rơi tự do')
    expect(url).toBe('/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do')
    expect(maBaiTuUrl(url.split('/').pop())).toBe('ly10-c2-b10')
  })

  it('URL cũ chỉ có mã, không có phần mô tả, vẫn đọc ra đúng mã', () => {
    expect(maBaiTuUrl('ly10-c2-b10')).toBe('ly10-c2-b10')
  })

  it('thiếu đoạn URL thì trả chuỗi rỗng, không ném', () => {
    expect(maBaiTuUrl(undefined)).toBe('')
  })

  it('đường dẫn danh sách bài bám mã môn', () => {
    expect(duongDanDanhSachBai('chemistry')).toBe('/goc-hoc-tap/chemistry/bai-hoc')
  })

  it('tên tiếng Việt của ba cấp học sinh giỏi', () => {
    expect(nhanCapHsg('hsg-truong')).toBe('Cấp trường')
    expect(nhanCapHsg('hsg-tinh')).toBe('Cấp tỉnh')
    expect(nhanCapHsg('hsg-quoc-gia')).toBe('Cấp quốc gia')
    expect(nhanCapHsg(undefined)).toBe('')
    // Cấp lạ thì in nguyên văn còn hơn nuốt mất thông tin.
    expect(nhanCapHsg('hsg-quoc-te')).toBe('hsg-quoc-te')
  })

  it('mỗi môn đều có bài thật trong chỉ mục, và lớp khai báo đều có bài', () => {
    for (const subject of Object.values(STEM_SUBJECTS)) {
      expect(subject.loader.index.length, `môn ${subject.label} rỗng chỉ mục`).toBeGreaterThan(0)
      const coBaiOItNhatMotLop = subject.grades.some(
        (g) => subject.loader.listCoreByGrade(g).length > 0,
      )
      expect(coBaiOItNhatMotLop, `môn ${subject.label} không có bài ở lớp nào`).toBe(true)
    }
  })

  it('ba môn Toán/Lí/Hoá có đủ chuyên đề ở cả ba cấp học sinh giỏi', () => {
    for (const id of ['mathematics', 'physics', 'chemistry'] as const) {
      const capDo = new Set(STEM_SUBJECTS[id].loader.listAdvanced().map((s) => s.advancedTier))
      for (const cap of ['hsg-truong', 'hsg-tinh', 'hsg-quoc-gia']) {
        expect(capDo.has(cap as never), `môn ${id} thiếu chuyên đề cấp ${cap}`).toBe(true)
      }
    }
  })

  it('lớp của môn suy từ chỉ mục: chỉ lớp có bài chuẩn, xếp theo SỐ chứ không theo chuỗi', () => {
    const chiMuc = [
      { grade: '10', track: 'core' },
      { grade: '6', track: 'core' },
      { grade: '6', track: 'core' },
      { grade: '12', track: 'core' },
      // Chuyên đề HSG không tạo ra một nút lớp riêng.
      { grade: '9', track: 'advanced' },
    ]
    expect(lopCoBai(chiMuc)).toEqual(['6', '10', '12'])
    expect(lopCoBai([])).toEqual([])
  })

  it('lớp mặc định giữ lớp 10 khi có, nếu không thì lấy lớp đầu tiên có bài', () => {
    expect(chonLopMacDinh(['6', '7', '10', '11'])).toBe('10')
    expect(chonLopMacDinh(['6', '7'])).toBe('6')
    expect(chonLopMacDinh([])).toBe('10')
  })

  it('mỗi môn: lớp mặc định nằm trong danh sách lớp, và mọi lớp khai báo đều có bài', () => {
    for (const subject of Object.values(STEM_SUBJECTS)) {
      expect(subject.grades, `môn ${subject.label}`).toContain(subject.defaultGrade)
      for (const g of subject.grades) {
        expect(
          subject.loader.listCoreByGrade(g).length,
          `môn ${subject.label} hiện nút lớp ${g} nhưng lớp đó không có bài`,
        ).toBeGreaterThan(0)
      }
    }
  })
})

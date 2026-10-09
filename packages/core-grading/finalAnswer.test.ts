// Ca biên chấm đáp số cuối của bảng nháp STEM (changelog 0539) — thay phép so chuỗi con cũ.
import { describe, expect, it } from 'vitest'
import { finalValueText, gradeFinalAnswer } from './finalAnswer.js'

describe('finalValueText — bóc vế phải của mệnh đề cuối', () => {
  it('bỏ tên ẩn, giữ đáp số; theo mệnh đề sau dấu suy ra cuối cùng', () => {
    expect(finalValueText('x = 5')).toBe('5')
    expect(finalValueText('5')).toBe('5')
    expect(finalValueText('S_{2} = 0')).toBe('0')
    expect(finalValueText('2x = 10 \\implies x = 5')).toBe('5')
    expect(finalValueText('$v = 10\\,\\text{m/s}$')).toBe('10 m/s')
    expect(finalValueText('   ')).toBe('')
  })
})

describe('gradeFinalAnswer — so đáp số đã chuẩn hoá', () => {
  it('"x = 5" khớp "5" và ngược lại; khoảng trắng thừa không ảnh hưởng', () => {
    expect(gradeFinalAnswer('x = 5', '5').correct).toBe(true)
    expect(gradeFinalAnswer('5', 'x = 5').correct).toBe(true)
    expect(gradeFinalAnswer('  x   =   5  ', 'S_{3} = 5').correct).toBe(true)
  })

  it('LỖI CŨ: "15" KHÔNG được khớp đáp án "5" (so chuỗi con từng cho qua)', () => {
    const r = gradeFinalAnswer('15', 'x = 5')
    expect(r.correct).toBe(false)
    expect(r.reason).toBe('WRONG_VALUE')
    expect(gradeFinalAnswer('x = 50', 'x = 5').correct).toBe(false)
    // Chép lại đáp án rồi viết thêm chữ — so chuỗi con cũ coi là "giải xong".
    expect(gradeFinalAnswer('S_{2} = 0 sai bét', 'S_{2} = 0').correct).toBe(false)
  })

  it('dấu thập phân "2,5" và "2.5" là một', () => {
    expect(gradeFinalAnswer('2,5', '2.5').correct).toBe(true)
    expect(gradeFinalAnswer('x = 2.5', 'x = 2,5').correct).toBe(true)
  })

  it('dung sai tương đối nhỏ: lệch làm tròn thì qua, lệch thật thì trượt', () => {
    expect(gradeFinalAnswer('3,3333', '10/3').correct).toBe(true)
    expect(gradeFinalAnswer('4,9999', '5').correct).toBe(true)
    // Quy ước engine (đặc tả chấm dùng chung §3): MỘT dấu phẩy + ĐÚNG 3 chữ số = phân nhóm nghìn,
    // nên "4,999" là 4999 chứ không phải 4,999 — giữ nguyên quy ước đó, không chấm riêng.
    expect(gradeFinalAnswer('4,999', '5').correct).toBe(false)
    expect(gradeFinalAnswer('4,9', '5').correct).toBe(false)
    // Đáp án 0: tỉ lệ vô nghĩa → so tuyệt đối, 0,001 không phải 0.
    expect(gradeFinalAnswer('0', 'S_{2} = 0').correct).toBe(true)
    expect(gradeFinalAnswer('0,001', 'S_{2} = 0').correct).toBe(false)
  })

  it('đề có đơn vị: thiếu đơn vị / sai đơn vị / sai thứ nguyên đều trượt; đổi đơn vị cùng thứ nguyên thì qua', () => {
    const dapAn = 'v = 10 \\text{ m/s}'
    expect(gradeFinalAnswer('v = 10 m/s', dapAn).correct).toBe(true)
    expect(gradeFinalAnswer('36 km/h', dapAn).correct).toBe(true)
    expect(gradeFinalAnswer('10', dapAn).reason).toBe('MISSING_UNIT')
    expect(gradeFinalAnswer('10 m', dapAn).reason).toBe('WRONG_UNIT')
    expect(gradeFinalAnswer('3 kg', dapAn).reason).toBe('WRONG_DIMENSION')
    expect(gradeFinalAnswer('10 km/h', dapAn).correct).toBe(false)
  })

  it('đáp án dạng biểu thức: so tương đương, không so chữ', () => {
    expect(gradeFinalAnswer('y = 2(x + 1)', 'y = 2x + 2').correct).toBe(true)
    expect(gradeFinalAnswer('y = 2x + 3', 'y = 2x + 2').correct).toBe(false)
  })

  it('bài làm rỗng/không đọc được, đáp án rỗng → luôn sai', () => {
    expect(gradeFinalAnswer('', '5').correct).toBe(false)
    expect(gradeFinalAnswer('chưa chắc', '5').correct).toBe(false)
    expect(gradeFinalAnswer('5', '').correct).toBe(false)
    expect(gradeFinalAnswer('5', '').reason).toBe('PARSE_ERROR')
  })
})

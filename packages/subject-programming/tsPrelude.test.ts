// Canh gác ranh giới AN TOÀN của kiểm kiểu TypeScript chạy trên server (POST
// /api/programming/ts-check) — lỗ hổng vá 2026-09-27.
//
// Trước bản vá, compiler host là host THẬT của server: `/// <reference path="…" />` trong bài
// làm khiến server đọc file thật trên đĩa. Hệ quả đo được: (1) dò được file nào tồn tại (lỗi
// TS6053 "not found" chỉ hiện với file KHÔNG có); (2) mỗi file lớn được tham chiếu nằm lại vĩnh
// viễn trong bộ nhớ đệm (~10 MB heap/file .d.ts lớn) → worker bị PM2 giết vì quá RAM.
import { join } from 'node:path'
import ts from 'typescript'
import { beforeAll, describe, expect, it } from 'vitest'
import { kiemTraTypeScript } from './tsPrelude.js'

const cwd = process.cwd()
const fileCoThat = join(cwd, 'packages', 'core-auth', 'security.ts').replace(/\\/g, '/')
const fileKhongCo = join(cwd, 'khong-ton-tai-that-su.ts').replace(/\\/g, '/')

describe('kiemTraTypeScript — không đọc file nào của server ngoài lib chuẩn', () => {
  // Chi phí "nguội" dồn về MỘT hook có ngưỡng riêng: lượt `kiemTraTypeScript` đầu tiên phân
  // tích lib chuẩn es2020 (gồm cả lib DOM, vài MB) rồi giữ trong bộ nhớ lib của module — đây
  // là chi phí THẬT của production (lượt "Chấm bài" đầu tiên sau khi server khởi động), không
  // phải việc thừa của test. Trước đây chi phí này rơi vào ca đầu tiên trong file nên ca nào
  // đứng đầu (hay được chạy lẻ bằng `-t`) cũng có thể đỏ giả. Đo 2026-10-08 (changelog 0532):
  // chạy riêng ~1,4 s; đo coverage V8 3,4 s; coverage + máy tải ~18 lên 6,0 s; trong
  // `test:coverage` toàn bộ (4 lõi) 5,7–6,5 s (changelog 0522). Phân tích lib DOM cùng cỡ ở
  // scanGraph.test.ts đo được tới 16 s dưới tải ~20 → ngưỡng 60 s, gấp ~4 lần số đo xấu nhất.
  beforeAll(() => {
    expect(kiemTraTypeScript('const a: number = 1', ts).loi).toEqual([])
  }, 60_000)

  it('/// <reference path> tới file CÓ và KHÔNG có cho kết quả GIỐNG HỆT (không dò được đĩa)', () => {
    const co = kiemTraTypeScript(`/// <reference path="${fileCoThat}" />\nconst a = 1`, ts)
    const khong = kiemTraTypeScript(`/// <reference path="${fileKhongCo}" />\nconst a = 1`, ts)
    expect(co.loi).toEqual(khong.loi)
    expect(co.loi.join('\n')).not.toMatch(/TS6053|not found/)
  })

  it('không nạp được khai báo từ file khác trên đĩa', () => {
    // node_modules/typescript/lib/typescript.d.ts khai `declare namespace ts` — nếu host còn đọc
    // đĩa thì `ts.version` hợp lệ; bị chặn thì là lỗi "Cannot find name 'ts'".
    const fileDts = join(cwd, 'node_modules', 'typescript', 'lib', 'typescript.d.ts')
    const ketQua = kiemTraTypeScript(
      `/// <reference path="${fileDts.replace(/\\/g, '/')}" />\nconst v: string = ts.version`,
      ts,
    )
    expect(ketQua.loi.join('\n')).toMatch(/TS2304/)
  })

  it('không tự nạp @types của server (vd `process` của @types/node)', () => {
    const ketQua = kiemTraTypeScript('const x: string | undefined = process.env.HOME', ts)
    expect(ketQua.loi.join('\n')).toMatch(/TS2580|TS2591|TS2304/)
  })

  it('lib chuẩn vẫn hoạt động — code hợp lệ không có lỗi, sai kiểu vẫn bị bắt', () => {
    expect(kiemTraTypeScript('const n: number = [1, 2].map((x) => x * 2).length', ts).loi).toEqual(
      [],
    )
    expect(kiemTraTypeScript("const s: number = 'a'", ts).loi.join('\n')).toMatch(/TS2322/)
    expect(kiemTraTypeScript('console.log(new Map<string, number>().size)', ts).loi).toEqual([])
  })
})

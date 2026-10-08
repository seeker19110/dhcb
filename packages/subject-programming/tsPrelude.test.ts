// Canh gác ranh giới AN TOÀN của kiểm kiểu TypeScript chạy trên server (POST
// /api/programming/ts-check) — lỗ hổng vá 2026-09-27.
//
// Trước bản vá, compiler host là host THẬT của server: `/// <reference path="…" />` trong bài
// làm khiến server đọc file thật trên đĩa. Hệ quả đo được: (1) dò được file nào tồn tại (lỗi
// TS6053 "not found" chỉ hiện với file KHÔNG có); (2) mỗi file lớn được tham chiếu nằm lại vĩnh
// viễn trong bộ nhớ đệm (~10 MB heap/file .d.ts lớn) → worker bị PM2 giết vì quá RAM.
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { kiemTraTypeScript } from './tsPrelude.js'

const cwd = process.cwd()
const fileCoThat = join(cwd, 'packages', 'core-auth', 'security.ts').replace(/\\/g, '/')
const fileKhongCo = join(cwd, 'khong-ton-tai-that-su.ts').replace(/\\/g, '/')

describe('kiemTraTypeScript — không đọc file nào của server ngoài lib chuẩn', () => {
  it('/// <reference path> tới file CÓ và KHÔNG có cho kết quả GIỐNG HỆT (không dò được đĩa)', () => {
    const co = kiemTraTypeScript(`/// <reference path="${fileCoThat}" />\nconst a = 1`, ts)
    const khong = kiemTraTypeScript(`/// <reference path="${fileKhongCo}" />\nconst a = 1`, ts)
    expect(co.loi).toEqual(khong.loi)
    expect(co.loi.join('\n')).not.toMatch(/TS6053|not found/)
    // Ca đầu tiên trả chi phí "nguội": dựng 2 chương trình TS + parse lib chuẩn lần đầu. Chạy
    // riêng ~3 s, nhưng trong `test:coverage` toàn bộ (4 lõi, đo V8) mất 5,7–6,5 s → vượt
    // timeout mặc định 5 s và đỏ giả (đo 2026-10-08, changelog 0522). Nới riêng ca này.
  }, 30_000)

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

// Soi TRỰC TIẾP compiler host của `kiemTraTypeScript` — ranh giới an toàn của
// POST /api/programming/ts-check (vá 2026-09-27). `tsPrelude.test.ts` chứng minh hành vi qua
// kết quả biên dịch; file này chứng minh từng cửa của host: đường dẫn nào được phép chạm đĩa.
//
// Mỗi ca nạp module MỚI (`vi.resetModules`) vì host được cache ở mức module — nạp chung một
// module thì ca "host gốc không có getDefaultLibLocation" sẽ âm thầm dùng lại host của ca trước.
// Mỗi lần nạp mới phải parse lại lib chuẩn (vài giây) nên đặt timeout riêng.
import ts from 'typescript'
import type * as TS from 'typescript'
import { describe, expect, it, vi } from 'vitest'
import type { TsCompiler } from './tsPrelude.js'

const TIMEOUT_MS = 60_000

/** Bọc gói typescript thật, chặn `createProgram` để lấy ra host mà prelude đã dựng. */
function compilerBatHost(suaHostGoc?: (host: TS.CompilerHost) => TS.CompilerHost): {
  compiler: TsCompiler
  layHost: () => TS.CompilerHost
} {
  let host: TS.CompilerHost | undefined
  const compiler: TsCompiler = {
    ScriptTarget: ts.ScriptTarget,
    ModuleKind: ts.ModuleKind,
    createSourceFile: ts.createSourceFile,
    transpileModule: ts.transpileModule,
    flattenDiagnosticMessageText: ts.flattenDiagnosticMessageText,
    createCompilerHost: (options, setParentNodes) => {
      const goc = ts.createCompilerHost(options, setParentNodes)
      return suaHostGoc ? suaHostGoc(goc) : goc
    },
    createProgram: ((roots: readonly string[], options: TS.CompilerOptions, h: TS.CompilerHost) => {
      host = h
      return ts.createProgram(roots, options, h)
    }) as TsCompiler['createProgram'],
  }
  return {
    compiler,
    layHost: () => {
      if (!host) throw new Error('chưa gọi createProgram')
      return host
    },
  }
}

async function napPreludeMoi() {
  vi.resetModules()
  return import('./tsPrelude.js')
}

/** Thư mục lib chuẩn thật của gói typescript, dấu '/'. */
const THU_MUC_LIB = ts
  .getDefaultLibFilePath({})
  .replace(/\\/g, '/')
  .replace(/\/[^/]+$/, '')
const FILE_LIB = `${THU_MUC_LIB}/lib.es2020.d.ts`

describe('compiler host của kiemTraTypeScript — chỉ file lib chuẩn được chạm đĩa', () => {
  it(
    'chặn mọi đường dẫn ngoài lib: leo thư mục, thư mục con, thư mục "anh em" cùng tiền tố',
    async () => {
      const { kiemTraTypeScript } = await napPreludeMoi()
      const { compiler, layHost } = compilerBatHost()
      expect(kiemTraTypeScript('const n: number = 1', compiler).loi).toEqual([])
      const host = layHost()

      // File lib thật: được phép.
      expect(host.fileExists(FILE_LIB)).toBe(true)
      expect(host.readFile(FILE_LIB)).toContain('/// <reference lib=')

      // Leo ra khỏi thư mục lib (`..`) — đúng kiểu tấn công dò file của bản trước vá.
      expect(host.fileExists(`${THU_MUC_LIB}/../package.json`)).toBe(false)
      expect(host.readFile(`${THU_MUC_LIB}/../package.json`)).toBeUndefined()
      expect(host.getSourceFile(`${THU_MUC_LIB}/../package.json`, ts.ScriptTarget.ES2020)).toBe(
        undefined,
      )
      // Thư mục con bên trong lib, và thư mục "anh em" có cùng tiền tố tên (lib → libX).
      expect(host.fileExists(`${THU_MUC_LIB}/con/lib.d.ts`)).toBe(false)
      expect(host.fileExists(`${THU_MUC_LIB}X/lib.d.ts`)).toBe(false)
      // Chính thư mục lib (phần sau rỗng) không phải là một file lib.
      expect(host.readFile(`${THU_MUC_LIB}/`)).toBeUndefined()
      // File bất kỳ của server.
      expect(host.fileExists('/etc/passwd')).toBe(false)

      // Không duyệt/liệt kê thư mục nào ngoài thư mục lib; không ghi đĩa.
      expect(host.directoryExists?.(`${THU_MUC_LIB}/`)).toBe(true)
      expect(host.directoryExists?.('/etc')).toBe(false)
      expect(host.getDirectories?.(THU_MUC_LIB)).toEqual([])
      expect(host.realpath?.('/a/../b')).toBe('/a/../b')
      expect(() => host.writeFile('/tmp/x.js', 'x', false)).not.toThrow()
    },
    TIMEOUT_MS,
  )

  it(
    'file lib được đọc MỘT lần rồi dùng lại từ bộ nhớ (lượt sau không đọc đĩa)',
    async () => {
      const { kiemTraTypeScript } = await napPreludeMoi()
      const doc = vi.fn<(ten: string) => void>()
      const { compiler } = compilerBatHost((goc) => ({
        ...goc,
        getSourceFile: (ten, ...rest) => {
          doc(ten)
          return goc.getSourceFile(ten, ...rest)
        },
      }))
      kiemTraTypeScript('const a = 1', compiler)
      const lanDau = doc.mock.calls.length
      expect(lanDau).toBeGreaterThan(0)
      kiemTraTypeScript('const b = 2', compiler)
      expect(doc.mock.calls.length).toBe(lanDau)
    },
    TIMEOUT_MS,
  )

  it(
    'host gốc không có getDefaultLibLocation → suy thư mục lib từ tên file lib mặc định',
    async () => {
      const { kiemTraTypeScript } = await napPreludeMoi()
      const { compiler, layHost } = compilerBatHost((goc) => ({
        ...goc,
        getDefaultLibLocation: undefined,
      }))
      // Lib chuẩn vẫn nạp được (Map/Array.map có kiểu) và sai kiểu vẫn bị bắt.
      expect(
        kiemTraTypeScript('console.log(new Map<string, number>().size)', compiler).loi,
      ).toEqual([])
      expect(kiemTraTypeScript("const s: number = 'a'", compiler).loi.join('\n')).toMatch(/TS2322/)
      const host = layHost()
      expect(host.fileExists(FILE_LIB)).toBe(true)
      expect(host.fileExists(`${THU_MUC_LIB}/../package.json`)).toBe(false)
    },
    TIMEOUT_MS,
  )
})

describe('dinhDangKetQuaTs — thứ học viên nhìn thấy', () => {
  it('còn lỗi kiểu → tiêu đề lỗi + danh sách lỗi, KHÔNG kèm output chạy', async () => {
    const { dinhDangKetQuaTs, TIEU_DE_LOI } = await import('./tsPrelude.js')
    expect(dinhDangKetQuaTs(['Dong 1: TS2322 x', 'Dong 2: TS2304 y'], 'KHONG-DUOC-HIEN')).toBe(
      `${TIEU_DE_LOI}\nDong 1: TS2322 x\nDong 2: TS2304 y`,
    )
  })

  it('sạch kiểu → tiêu đề chạy + output (kể cả output rỗng)', async () => {
    const { dinhDangKetQuaTs, TIEU_DE_CHAY } = await import('./tsPrelude.js')
    expect(dinhDangKetQuaTs([], 'xin chao')).toBe(`${TIEU_DE_CHAY}\nxin chao`)
    expect(dinhDangKetQuaTs([], '')).toBe(`${TIEU_DE_CHAY}\n`)
  })
})

// Test cho phần QUÉT của codemap (dựng đồ thị bằng TypeScript compiler API).
//
// Vì sao cần: bản đầu bỏ sót `import('./x')` nên `impact` báo "không ai import Login.tsx"
// trong khi App.tsx nạp nó qua lazyWithRetry(). Cổng merge (CLAUDE.md mục 9) lại dựa vào
// lệnh này, nên báo sót tạo CẢM GIÁC AN TOÀN GIẢ. Test dưới đây khoá cả 3 dạng import lại.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { resolveDhcbAlias, scanGraph } from './scanGraph'
import type { CodeGraph } from './codemap'

let root: string
let graph: CodeGraph

/** Ghi file trong repo giả, tự tạo thư mục cha. */
function write(relativePath: string, content: string): void {
  const absolute = path.join(root, relativePath)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, content, 'utf8')
}

/**
 * tsconfig của repo giả: CHỈ nạp `lib.es5.d.ts`.
 *
 * Vì sao: thiếu tsconfig thì TypeScript tự nạp lib mặc định `lib.d.ts` — kéo theo cả
 * `lib.dom.d.ts` (~1,5 MB) — và PHÂN TÍCH LẠI nó ở MỖI lần `scanGraph` dựng chương trình.
 * Repo giả không dùng kiểu nào của DOM, nên đó là việc thừa thuần tuý — mà lại là việc nặng
 * nhất của cả file: đo 2026-10-08 (changelog 0532) một lượt `scanGraph` trên repo 2 file mất
 * 4,2 s khi chạy riêng, 15,7–16,3 s dưới đo coverage V8 + máy tải ~20; với lib es5 còn
 * 0,06 s / 1,0 s. Hook `beforeAll` 30 s từng đỏ đúng vì chuyện này. Cạnh import/lời gọi hàm
 * mà file này kiểm không phụ thuộc lib nào. Thêm nữa, nhờ vậy test cũng đi qua nhánh ĐỌC
 * tsconfig của `scanGraph` (repo thật luôn có tsconfig).
 */
const TSCONFIG_GON = JSON.stringify({ compilerOptions: { lib: ['es5'], types: [] } })

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), 'codemap-test-'))
  write('tsconfig.json', TSCONFIG_GON)

  write('src/target.ts', 'export function target(): number {\n  return 1\n}\n')
  // 1. import tĩnh + có lời gọi hàm xuyên file
  write(
    'src/staticImport.ts',
    "import { target } from './target'\n\nexport function callsTarget(): number {\n  return target()\n}\n",
  )
  // 2. re-export
  write('src/reExport.ts', "export { target } from './target'\n")
  // 3. import động — ca từng bị bỏ sót
  write(
    'src/dynamicImport.ts',
    "export async function lazyTarget(): Promise<unknown> {\n  return import('./target')\n}\n",
  )
  // 4. worker qua new URL(..., import.meta.url) — có đuôi .ts như code thật trong lib/*Runner.ts
  write(
    'src/workerHost.ts',
    "export const w = new Worker(new URL('./target.ts', import.meta.url), { type: 'module' })\n",
  )
  // Thư viện ngoài: KHÔNG được thành cạnh
  write('src/external.ts', "import path from 'node:path'\n\nexport const sep = path.sep\n")
  // Ngoài scanRoots: KHÔNG được xuất hiện trong đồ thị
  write('outside/ignored.ts', "import { target } from '../src/target'\n\nexport const x = target\n")
  // Điểm vào: không ai import nhưng vẫn phải nằm trong đồ thị
  write('server.ts', "import { target } from './src/target'\n\nexport const boot = target\n")

  graph = scanGraph({ rootDir: root, scanRoots: ['src'], entryPoints: ['server.ts'] })
  // 30 s: dựng chương trình TS thật (parse lib es5 + type checker) — xem TSCONFIG_GON.
}, 30000)

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

const hasImport = (from: string, to: string): boolean =>
  graph.imports.some((edge) => edge.from === from && edge.to === to)

describe('scanGraph — cạnh import', () => {
  it('bắt import tĩnh', () => {
    expect(hasImport('src/staticImport.ts', 'src/target.ts')).toBe(true)
  })

  it("bắt worker qua new URL('./x', import.meta.url) — trước đây bị báo mồ côi nhầm", () => {
    expect(hasImport('src/workerHost.ts', 'src/target.ts')).toBe(true)
  })

  it('bắt re-export', () => {
    expect(hasImport('src/reExport.ts', 'src/target.ts')).toBe(true)
  })

  it('bắt import động — hồi quy cho lỗi bỏ sót trang route nạp lazy', () => {
    expect(hasImport('src/dynamicImport.ts', 'src/target.ts')).toBe(true)
  })

  it('bỏ qua thư viện ngoài', () => {
    expect(graph.imports.some((edge) => edge.from === 'src/external.ts')).toBe(false)
  })

  it('bắt import từ file điểm vào', () => {
    expect(hasImport('server.ts', 'src/target.ts')).toBe(true)
  })
})

describe('scanGraph — phạm vi quét', () => {
  it('chỉ gồm file trong scanRoots và entryPoints', () => {
    expect(graph.files).toContain('src/target.ts')
    expect(graph.files).toContain('server.ts')
    expect(graph.files).not.toContain('outside/ignored.ts')
  })

  it('không tạo cạnh từ file ngoài phạm vi', () => {
    expect(graph.imports.some((edge) => edge.from === 'outside/ignored.ts')).toBe(false)
  })

  it('danh sách file đã sắp xếp, không trùng', () => {
    expect(graph.files).toEqual([...graph.files].sort())
    expect(new Set(graph.files).size).toBe(graph.files.length)
  })
})

describe('scanGraph — cạnh lời gọi hàm', () => {
  it('lần được lời gọi xuyên file về đúng khai báo gốc', () => {
    expect(
      graph.calls.some(
        (edge) =>
          edge.from === 'src/staticImport.ts#callsTarget' && edge.to === 'src/target.ts#target',
      ),
    ).toBe(true)
  })
})

describe('resolveDhcbAlias — alias workspace @dhcb/*', () => {
  let dhcbRoot: string

  beforeAll(() => {
    dhcbRoot = mkdtempSync(path.join(tmpdir(), 'codemap-dhcb-test-'))
    writeFileSync(
      (() => {
        mkdirSync(path.join(dhcbRoot, 'packages', 'core-db'), { recursive: true })
        return path.join(dhcbRoot, 'packages', 'core-db', 'pgPool.ts')
      })(),
      'export const pool = {}\n',
      'utf8',
    )
    mkdirSync(path.join(dhcbRoot, 'packages', 'core-ai'), { recursive: true })
    writeFileSync(
      path.join(dhcbRoot, 'packages', 'core-ai', 'Widget.tsx'),
      'export const Widget = () => null\n',
      'utf8',
    )
  })

  afterAll(() => {
    rmSync(dhcbRoot, { recursive: true, force: true })
  })

  it('phân giải @dhcb/<gói>/<file> sang packages/<gói>/<file>.ts', () => {
    expect(resolveDhcbAlias('@dhcb/core-db/pgPool', dhcbRoot)).toBe(
      path.join(dhcbRoot, 'packages', 'core-db', 'pgPool.ts'),
    )
  })

  it('thử .tsx nếu .ts không tồn tại', () => {
    expect(resolveDhcbAlias('@dhcb/core-ai/Widget', dhcbRoot)).toBe(
      path.join(dhcbRoot, 'packages', 'core-ai', 'Widget.tsx'),
    )
  })

  it('trả về undefined nếu file không tồn tại (coi như module ngoài)', () => {
    expect(resolveDhcbAlias('@dhcb/core-db/khong-ton-tai', dhcbRoot)).toBeUndefined()
  })

  it('trả về undefined nếu không đúng định dạng @dhcb/<gói>/<file>', () => {
    expect(resolveDhcbAlias('@dhcb/core-db', dhcbRoot)).toBeUndefined()
    expect(resolveDhcbAlias('react', dhcbRoot)).toBeUndefined()
  })

  // Timeout 30s: scanGraph khởi tạo TS program thật — máy CI lạnh cache có thể vượt 5s mặc
  // định (đã đỏ CI #625 đúng vì vậy dù local chạy ~1s). Đo 2026-10-08 (changelog 0532): trước
  // khi dùng TSCONFIG_GON ca này 7,3 s dưới coverage, 10,1 s coverage + máy tải ~18; sau còn
  // 0,6 s coverage + máy tải ~16.
  it('scanGraph tạo được cạnh import xuyên qua @dhcb/*', { timeout: 30_000 }, () => {
    const scanRoot = mkdtempSync(path.join(tmpdir(), 'codemap-dhcb-scan-'))
    try {
      const write2 = (relativePath: string, content: string): void => {
        const absolute = path.join(scanRoot, relativePath)
        mkdirSync(path.dirname(absolute), { recursive: true })
        writeFileSync(absolute, content, 'utf8')
      }
      write2('tsconfig.json', TSCONFIG_GON)
      write2('packages/core-db/pgPool.ts', 'export const pool = {}\n')
      write2(
        'api/handler.ts',
        "import { pool } from '@dhcb/core-db/pgPool'\n\nexport const usePool = pool\n",
      )
      const dhcbGraph = scanGraph({
        rootDir: scanRoot,
        scanRoots: ['api', 'packages'],
        entryPoints: [],
      })
      expect(
        dhcbGraph.imports.some(
          (edge) => edge.from === 'api/handler.ts' && edge.to === 'packages/core-db/pgPool.ts',
        ),
      ).toBe(true)
    } finally {
      rmSync(scanRoot, { recursive: true, force: true })
    }
  })
})

describe('scanGraph — ca biên', () => {
  it('scanRoots rỗng cho đồ thị rỗng, không ném lỗi', () => {
    const empty = scanGraph({ rootDir: root, scanRoots: [], entryPoints: [] })
    expect(empty).toEqual({ files: [], imports: [], calls: [] })
  })

  it('thư mục không tồn tại thì bỏ qua, không ném lỗi', () => {
    const missing = scanGraph({ rootDir: root, scanRoots: ['khong-co-that'], entryPoints: [] })
    expect(missing.files).toEqual([])
  })
})

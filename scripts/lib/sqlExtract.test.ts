// Test phần THUẦN của cổng `check:sql` (không cần Postgres): trích SQL bằng AST + allowlist.
import { describe, expect, it } from 'vitest'
import { findAllowlistEntry, parseAllowlist } from './sqlAllowlist'
import { extractSqlFromSource, leadingKeyword, MAX_VARIANTS, normalizeSql } from './sqlExtract'

const sqlsOf = (src: string): string[] =>
  extractSqlFromSource('f.ts', src).queries.map((q) => q.sql)

describe('extractSqlFromSource — câu tĩnh', () => {
  it('lấy literal chuỗi, template không nội suy, `.query<T>(` và `?.query(`', () => {
    const src = `
      await pool.query('select 1')
      await client.query<{ n: number }>(\`select 2\`, [])
      await maybe?.query("select 3")
    `
    expect(sqlsOf(src)).toEqual(['select 1', 'select 2', 'select 3'])
  })

  it('bỏ qua lời gọi không phải `.query(` (querySelector, hàm query trần, không đối số)', () => {
    const src = `
      document.querySelector('select x')
      query('select y')
      pool.query()
    `
    const res = extractSqlFromSource('f.ts', src)
    expect(res.queries).toEqual([])
    expect(res.skipped).toEqual([])
  })

  it('ghi đúng file và dòng của CHÍNH chuỗi SQL (không phải dòng `.query(`)', () => {
    const src = [
      'const x = 1',
      'await pool.query<Row>(',
      "  'select a from t',",
      '  [],',
      ')',
    ].join('\n')
    expect(extractSqlFromSource('apps/a.ts', src).queries).toEqual([
      { file: 'apps/a.ts', line: 3, sql: 'select a from t' },
    ])
  })
})

describe('extractSqlFromSource — tính hằng', () => {
  it('thay hằng `const` cùng file, phép `+`, số và `.join()` trên mảng hằng', () => {
    const src = `
      const COLS = ['a', 'b'] as const
      const T = 'public.' + 'bang'
      const LIMIT = 10
      pool.query(\`select \${COLS.join(', ')} from \${T} limit \${LIMIT}\`)
    `
    expect(sqlsOf(src)).toEqual(['select a, b from public.bang limit 10'])
  })

  it('biến runtime / hằng import từ file khác → bỏ qua (động) kèm lý do, không đoán', () => {
    const src = `
      import { BANG } from './khac'
      pool.query(\`select * from \${BANG}\`)
      pool.query(sqlRuntime)
      pool.query({ text: 'select 1' })
    `
    const res = extractSqlFromSource('f.ts', src)
    expect(res.queries).toEqual([])
    expect(res.skipped.map((s) => s.reason)).toEqual([
      'template có nội suy không tính được hằng',
      'biến `sqlRuntime` không suy ra được chuỗi SQL',
      'đối số là object cấu hình truy vấn',
    ])
  })

  it('mảng `const` bị sửa tại chỗ (push) KHÔNG coi là hằng — chỉ mô phỏng theo đường chạy', () => {
    // Cùng chỗ gọi: mô phỏng ra CẢ đường không push (câu `where ` rỗng — PREPARE sẽ bắt).
    const src = `
      const dieuKien = []
      if (x) dieuKien.push('a = 1')
      pool.query(\`select * from t where \${dieuKien.join(' and ')}\`)
    `
    expect(sqlsOf(src)).toEqual(['select * from t where a = 1', 'select * from t where '])
    // Từ hàm khác (không mô phỏng được thứ tự chạy) → hằng bị push KHÔNG được dùng.
    const fromFn = `
      const DIEU_KIEN = ['a = 1']
      DIEU_KIEN.push('b = 2')
      export function f(pool) { return pool.query(\`select 1 where \${DIEU_KIEN.join(' and ')}\`) }
    `
    expect(extractSqlFromSource('f.ts', fromFn).skipped).toHaveLength(1)
  })

  it('object `const` bị gán thuộc tính KHÔNG coi là hằng', () => {
    const src = `
      const COL = { a: 'cot_a' }
      COL.a = 'khac'
      pool.query(\`select \${COL.a} from t\`)
    `
    expect(extractSqlFromSource('f.ts', src).skipped).toHaveLength(1)
  })

  it('tên khai báo `const` ở hai scope: biến cục bộ của chính hàm thắng; từ hàm khác → mơ hồ', () => {
    const src = `
      function a() { const col = 'x'; return col }
      function b() { const col = 'y'; pool.query(\`select \${col} from t\`) }
      function c() { pool.query(\`select \${col} from u\`) }
    `
    const res = extractSqlFromSource('f.ts', src)
    expect(res.queries.map((q) => q.sql)).toEqual(['select y from t'])
    expect(res.skipped).toHaveLength(1)
  })
})

describe('extractSqlFromSource — nhiều biến thể', () => {
  it('ternary → trích CẢ HAI nhánh, đánh số biến thể', () => {
    const src = `
      const col = hit ? 'hits' : 'misses'
      pool.query(\`update s set \${col} = \${col} + 1\`)
    `
    expect(extractSqlFromSource('f.ts', src).queries).toEqual([
      { file: 'f.ts', line: 3, sql: 'update s set hits = hits + 1', variant: 1 },
      { file: 'f.ts', line: 3, sql: 'update s set misses = misses + 1', variant: 2 },
    ])
  })

  it('cùng một điểm rẽ dùng hai lần KHÔNG sinh tổ hợp chéo', () => {
    const src = `
      const table = isChat ? 'chat_sessions' : 'speaking_sessions'
      pool.query(\`insert into public.\${table} (id) values ($1)
        on conflict (id) do update set id = excluded.id where public.\${table}.id = $1\`)
    `
    const sqls = sqlsOf(src)
    expect(sqls).toHaveLength(2)
    for (const sql of sqls) {
      const tables = sql.match(/chat_sessions|speaking_sessions/g) ?? []
      expect(new Set(tables).size).toBe(1)
    }
  })

  it('tra object hằng bằng khoá runtime → mọi giá trị của bảng', () => {
    const src = `
      const COLUMN: Record<Mode, string> = { chat: 'chat_count', stt: 'stt_count' }
      pool.query(\`update u set \${COLUMN[mode]} = \${COLUMN[mode]} + 1\`)
    `
    expect(sqlsOf(src)).toEqual([
      'update u set chat_count = chat_count + 1',
      'update u set stt_count = stt_count + 1',
    ])
  })

  it('tra object hằng bằng khoá hằng → đúng một giá trị', () => {
    const src = `
      const COLUMN = { chat: 'chat_count', stt: 'stt_count' }
      pool.query(\`select \${COLUMN.stt}, \${COLUMN['chat']} from u\`)
    `
    expect(sqlsOf(src)).toEqual(['select stt_count, chat_count from u'])
  })

  it(`vượt trần ${MAX_VARIANTS} biến thể → coi là động`, () => {
    // 7 ternary độc lập = 128 tổ hợp > trần 64.
    const parts = Array.from({ length: 7 }, (_, i) => `\${c${i} ? 'a${i}' : 'b${i}'}`).join(', ')
    const src = `pool.query(\`select ${parts} from t\`)`
    const res = extractSqlFromSource('f.ts', src)
    expect(res.queries).toEqual([])
    expect(res.skipped).toHaveLength(1)
  })
})

describe('extractSqlFromSource — hằng import (loadModule)', () => {
  const files: Record<string, string> = {
    'pkg/usage.ts': `
      const COLUMN: Record<Mode, string> = { chat: 'chat_count', stt: 'stt_count' }
      export const COLUMNS: readonly string[] = Object.values(COLUMN)
      export const SUBJECT = 'english'
      const BI_SUA = { a: 'x' }
      BI_SUA.a = 'y'
      export { BI_SUA }
    `,
    'pkg/index.ts': `export { SUBJECT as MON } from './usage.js'`,
  }
  const loadModule = (from: string, spec: string) => {
    const dir = from.slice(0, from.lastIndexOf('/') + 1)
    const file = (spec.startsWith('./') ? dir + spec.slice(2) : spec.replace('@dhcb/', '')).replace(
      /\.js$/,
      '.ts',
    )
    const text = files[file]
    return text === undefined ? undefined : { file, text }
  }

  it('hằng export (kể cả `Object.values`, re-export đổi tên) được thay vào câu', () => {
    const src = `
      import { COLUMNS } from '@dhcb/pkg/usage.js'
      import { MON } from '@dhcb/pkg/index.js'
      pool.query(\`select \${COLUMNS.join(' + ')} as used from u where subject = '\${MON}'\`)
    `
    const res = extractSqlFromSource('f.ts', src, { loadModule })
    expect(res.queries.map((q) => q.sql)).toEqual([
      "select chat_count + stt_count as used from u where subject = 'english'",
    ])
  })

  it('hằng bị sửa tại chỗ ở file nguồn / import kiểu / không nạp được → động', () => {
    const src = `
      import { BI_SUA } from '@dhcb/pkg/usage.js'
      import type { SUBJECT } from '@dhcb/pkg/usage.js'
      import { KHONG_CO } from '@dhcb/khac/x.js'
      pool.query(\`select \${BI_SUA.a}\`)
      pool.query(\`select \${SUBJECT}\`)
      pool.query(\`select \${KHONG_CO}\`)
    `
    const res = extractSqlFromSource('f.ts', src, { loadModule })
    expect(res.queries).toEqual([])
    expect(res.skipped).toHaveLength(3)
  })
})

describe('extractSqlFromSource — mô phỏng đường chạy', () => {
  it('`let sql` + `if (…) sql +=` → mọi tổ hợp bộ lọc, số `$n` theo `params.length`', () => {
    const src = `
      export async function list(pool, status, q) {
        let sql = 'select * from p where 1=1'
        const params = []
        if (status) {
          params.push(status)
          sql += \` and status = $\${params.length}\`
        }
        if (q) {
          params.push(\`%\${q}%\`)
          sql += \` and code like $\${params.length}\`
        }
        sql += ' order by id'
        return pool.query(sql, params)
      }
    `
    expect(sqlsOf(src).sort()).toEqual([
      'select * from p where 1=1 and code like $1 order by id',
      'select * from p where 1=1 and status = $1 and code like $2 order by id',
      'select * from p where 1=1 and status = $1 order by id',
      'select * from p where 1=1 order by id',
    ])
  })

  it('`$${i++}` đánh số tuần tự đúng theo từng đường', () => {
    const src = `
      export function f(pool, a, b) {
        let sql = 'select 1 from t where true'
        let i = 1
        if (a) sql += \` and a = $\${i++}\`
        if (b) sql += \` and b = $\${i++}\`
        return pool.query(sql)
      }
    `
    expect(sqlsOf(src)).toContain('select 1 from t where true and a = $1 and b = $2')
    expect(sqlsOf(src)).toContain('select 1 from t where true and b = $1')
  })

  it('mảng điều kiện + `join` + ternary trên `.length` tính đúng theo từng đường', () => {
    const src = `
      export function f(pool, mon) {
        const dieuKien: string[] = []
        const thamSo: unknown[] = []
        if (mon) {
          thamSo.push(mon)
          dieuKien.push(\`mon = $\${thamSo.length}\`)
        }
        const where = dieuKien.length > 0 ? \`where \${dieuKien.join(' and ')}\` : ''
        return pool.query(\`select * from t \${where} order by id\`, thamSo)
      }
    `
    expect(sqlsOf(src).map(normalizeSql).sort()).toEqual([
      'select * from t order by id',
      'select * from t where mon = $1 order by id',
    ])
  })

  it('`if` không ghi biến đang theo dõi KHÔNG nhân đôi biến thể; `return` sớm cắt đường', () => {
    const ifs = Array.from({ length: 10 }, (_, i) => `if (c${i}) log(${i})`).join('; ')
    const src = `
      export function f(pool, x) {
        const sql = 'select 1'
        ${ifs}
        if (!x) return null
        return pool.query(sql)
      }
    `
    expect(extractSqlFromSource('f.ts', src).queries).toEqual([
      { file: 'f.ts', line: 6, sql: 'select 1' },
    ])
  })

  it('for-of trên bảng hằng + hàm trả lại đối số + `.map` → mỗi phần tử một biến thể', () => {
    const src = `
      const TABLES = [
        { table: 'a.t1', columns: ['id', 'x'] },
        { table: 'a.t2', columns: ['id'] },
      ] as const
      function assertIdent(value: string, re: RegExp): string {
        if (!re.test(value)) throw new Error('bad')
        return value
      }
      export async function readAll(client) {
        for (const spec of TABLES) {
          const cols = spec.columns.map((c) => assertIdent(c, /x/)).join(', ')
          await client.query(\`select \${cols} from \${assertIdent(spec.table, /x/)}\`)
        }
      }
    `
    expect(sqlsOf(src)).toEqual(['select id, x from a.t1', 'select id from a.t2'])
  })

  it('tham số hàm KHÔNG export lấy đối số từ mọi nơi gọi (các tham số đi cùng nhau)', () => {
    const src = `
      const ROOT = 'p.persons'
      const TABLES = [{ table: 'p.a' }, { table: 'p.b' }]
      async function deleteFrom(table: string, column: string) {
        await client.query(\`delete from \${table} where \${column} = $1\`)
      }
      export async function erase() {
        for (const spec of TABLES) await deleteFrom(spec.table, 'person_id')
        await deleteFrom(ROOT, 'id')
      }
    `
    expect(sqlsOf(src)).toEqual([
      'delete from p.a where person_id = $1',
      'delete from p.b where person_id = $1',
      'delete from p.persons where id = $1',
    ])
  })

  it('hàm export / hàm được truyền đi như giá trị → tham số KHÔNG suy từ nơi gọi', () => {
    const src = `
      export function run(sql: string) { return pool.query(sql) }
      run('select 1')
      function run2(sql: string) { return pool.query(sql) }
      run2('select 2')
      setTimeout(run2)
    `
    expect(extractSqlFromSource('f.ts', src).skipped).toHaveLength(2)
  })

  it('biến bị ghi ở chỗ không mô phỏng được (vòng lặp, closure, truyền mảng đi) → động', () => {
    const src = `
      export function a(pool, items) {
        let sql = 'select 1'
        for (const it of items) sql += ' union select 2'
        return pool.query(sql)
      }
      export function b(pool) {
        let sql = 'select 1'
        const add = () => { sql += ' x' }
        add()
        sql = 'select 3'
        return pool.query(sql)
      }
      export function c(pool) {
        const where = ['a = 1']
        addMore(where)
        return pool.query(\`select 1 from t where \${where.join(' and ')}\`)
      }
      export function d(pool, other) {
        let sql = 'select 1'
        ;[sql] = [other]
        return pool.query(sql)
      }
      export function e(pool, list) {
        let sql = 'select 1'
        for (sql of list) log(sql)
        return pool.query(sql)
      }
    `
    const res = extractSqlFromSource('f.ts', src)
    expect(res.queries).toEqual([])
    expect(res.skipped).toHaveLength(5)
  })

  it('hàm "trả lại đối số" phải chắc chắn trả đối số: async / thân rơi ra cuối → không nhận', () => {
    const src = `
      async function a(v: string) { return v }
      function b(v: string) { if (ok(v)) return v }
      pool.query(\`select \${a('x')}\`)
      pool.query(\`select \${b('y')}\`)
    `
    expect(extractSqlFromSource('f.ts', src).skipped).toHaveLength(2)
  })

  it('hằng trùng tên với tham số/biến ở chỗ khác trong file → mơ hồ → bỏ qua', () => {
    const src = `
      const col = 'x'
      function g(col: string) { return col }
      export function h(pool) { return pool.query(\`select \${col} from t\`) }
    `
    expect(extractSqlFromSource('f.ts', src).skipped).toHaveLength(1)
  })
})

describe('leadingKeyword / normalizeSql', () => {
  it('bỏ khoảng trắng và comment SQL đầu câu, trả chữ thường', () => {
    expect(leadingKeyword('\n  -- ghi chú\n /* khối */ SELECT 1')).toBe('select')
    expect(leadingKeyword('WITH x AS (select 1) select * from x')).toBe('with')
    expect(leadingKeyword('   ')).toBe('')
  })

  it('gộp mọi khoảng trắng về một dấu cách', () => {
    expect(normalizeSql('  select a,\n\t  b\nfrom t  ')).toBe('select a, b from t')
  })
})

describe('allowlist', () => {
  const entries = parseAllowlist({
    entries: [
      {
        file: 'packages/x.ts',
        sqlIncludes: 'select bad_col from t',
        reason: 'đang sửa ở PR khác, gỡ khi merge',
      },
    ],
  })

  it('khớp theo file + đoạn SQL, bỏ qua khác biệt khoảng trắng', () => {
    expect(
      findAllowlistEntry(entries, 'packages/x.ts', 'select   bad_col\n  from t where id = $1'),
    ).toBe(entries[0])
  })

  it('không khớp khi khác file hoặc khác câu', () => {
    expect(findAllowlistEntry(entries, 'packages/y.ts', 'select bad_col from t')).toBeUndefined()
    expect(findAllowlistEntry(entries, 'packages/x.ts', 'select good_col from t')).toBeUndefined()
  })

  it('từ chối mục thiếu lý do hoặc đoạn SQL quá ngắn (khớp bừa)', () => {
    expect(() =>
      parseAllowlist({ entries: [{ file: 'a.ts', sqlIncludes: 'select bad_col', reason: '' }] }),
    ).toThrow()
    expect(() =>
      parseAllowlist({
        entries: [{ file: 'a.ts', sqlIncludes: 'sel', reason: 'lý do đủ dài ở đây' }],
      }),
    ).toThrow()
  })
})

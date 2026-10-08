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
      'biến `sqlRuntime` không phải hằng chuỗi cùng file',
      'đối số là object cấu hình truy vấn',
    ])
  })

  it('mảng `const` bị sửa tại chỗ (push) KHÔNG coi là hằng', () => {
    const src = `
      const dieuKien = []
      if (x) dieuKien.push('a = 1')
      pool.query(\`select * from t where \${dieuKien.join(' and ')}\`)
    `
    expect(extractSqlFromSource('f.ts', src).skipped).toHaveLength(1)
  })

  it('object `const` bị gán thuộc tính KHÔNG coi là hằng', () => {
    const src = `
      const COL = { a: 'cot_a' }
      COL.a = 'khac'
      pool.query(\`select \${COL.a} from t\`)
    `
    expect(extractSqlFromSource('f.ts', src).skipped).toHaveLength(1)
  })

  it('tên khai báo `const` ở hai scope → mơ hồ → bỏ qua', () => {
    const src = `
      function a() { const col = 'x'; return col }
      function b() { const col = 'y'; pool.query(\`select \${col} from t\`) }
    `
    expect(extractSqlFromSource('f.ts', src).skipped).toHaveLength(1)
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
    // 5 ternary độc lập = 32 tổ hợp > trần.
    const parts = Array.from({ length: 5 }, (_, i) => `\${c${i} ? 'a${i}' : 'b${i}'}`).join(', ')
    const src = `pool.query(\`select ${parts} from t\`)`
    const res = extractSqlFromSource('f.ts', src)
    expect(res.queries).toEqual([])
    expect(res.skipped).toHaveLength(1)
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

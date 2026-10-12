// memoryRetrieval.test.ts — truy xuất lai chữ + nghĩa, RRF, điểm 3 thành phần, và bất biến
// "không embedding vẫn ra kết quả" (đặc tả GĐ2a ④).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import type { EmbeddingProvider } from '@dhcb/core-ai/embeddings'

const embeddings = vi.hoisted(() => ({
  embedQuery:
    vi.fn<(text: string, provider?: EmbeddingProvider | null) => Promise<number[] | null>>(),
}))
vi.mock('@dhcb/core-ai/embeddings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dhcb/core-ai/embeddings')>()
  return {
    ...actual,
    embedQuery: (...a: [string, (EmbeddingProvider | null)?]) => embeddings.embedQuery(...a),
  }
})

import {
  buildLexicalQuery,
  reciprocalRankFusion,
  recencyScore,
  searchMemories,
  BASE_CANDIDATES,
} from './memoryRetrieval.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const NOW = new Date('2026-10-11T12:00:00Z')
const id = (n: number) => `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`

function row(n: number, over: Record<string, unknown> = {}) {
  return {
    id: id(n),
    person_id: PERSON,
    namespace: 'semantic',
    content: `ký ức ${n}`,
    provenance: 'companion:conversation',
    sensitivity: 'personal',
    status: 'accepted',
    merged_from_id: null,
    version: 1,
    created_at: NOW,
    updated_at: NOW,
    retain_until: null,
    importance: 5,
    last_accessed_at: null,
    access_count: 0,
    valid_from: NOW,
    valid_to: null,
    superseded_by: null,
    source_message_id: null,
    has_embedding: false,
    ...over,
  }
}

interface Fixture {
  lexical?: string[]
  semantic?: Array<{ id: string; embedding: number[] | null }>
  base?: ReturnType<typeof row>[]
  byId?: Record<string, ReturnType<typeof row>>
}

function poolFor(fx: Fixture) {
  const calls: Array<{ sql: string; params: unknown[] }> = []
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params })
    if (sql.includes('search_tsv @@')) return { rows: (fx.lexical ?? []).map((i) => ({ id: i })) }
    if (sql.includes('select id, embedding')) return { rows: fx.semantic ?? [] }
    if (sql.includes('order by importance desc, last_accessed_at desc nulls last')) {
      return { rows: fx.base ?? [] }
    }
    if (sql.includes('id = any($2::uuid[])') && sql.trim().startsWith('select')) {
      const wanted = params[1] as string[]
      return { rows: wanted.map((i) => fx.byId?.[i]).filter(Boolean) }
    }
    if (sql.includes('last_accessed_at = now()')) return { rows: [], rowCount: 1 }
    return { rows: [] }
  })
  return { pool: { query } as unknown as Pool, calls }
}

beforeEach(() => {
  embeddings.embedQuery.mockReset()
  embeddings.embedQuery.mockResolvedValue(null)
})

describe('buildLexicalQuery', () => {
  it('bỏ dấu, chữ thường, bỏ token < 2 ký tự, khử trùng, nối OR; câu toàn ký hiệu → null', () => {
    expect(buildLexicalQuery('Thi IELTS tháng 12, học tiếng Anh!')).toBe(
      'thi | ielts | thang | 12 | hoc | tieng | anh',
    )
    expect(buildLexicalQuery('Học học HỌC')).toBe('hoc')
    expect(buildLexicalQuery('?? !! 😀')).toBeNull()
    // không có ký tự nào ngoài [a-z0-9] lọt vào tsquery
    expect(buildLexicalQuery("a' | & ! ( ) <-> b")).toBeNull()
  })

  it('giới hạn 24 token', () => {
    const many = Array.from({ length: 40 }, (_, i) => `tu${i}`).join(' ')
    expect(buildLexicalQuery(many)!.split(' | ')).toHaveLength(24)
  })
})

describe('reciprocalRankFusion / recencyScore', () => {
  it('RRF: id có mặt ở cả hai danh sách đứng đầu', () => {
    const s = reciprocalRankFusion([
      ['a', 'b'],
      ['b', 'c'],
    ])
    expect(s.get('b')!).toBeGreaterThan(s.get('a')!)
    expect(s.get('a')!).toBeGreaterThan(s.get('c')!) // a hạng 1 > c hạng 2
    expect(s.get('a')).toBeCloseTo(1 / 61)
  })

  it('recency: vừa dùng = 1, sau 24 giờ ≈ 0.886, tương lai kẹp về 1', () => {
    expect(recencyScore(NOW, NOW)).toBe(1)
    expect(recencyScore(new Date(NOW.getTime() - 24 * 3_600_000), NOW)).toBeCloseTo(0.886, 2)
    expect(recencyScore(new Date(NOW.getTime() + 3_600_000), NOW)).toBe(1)
  })
})

describe('searchMemories', () => {
  it('khớp chữ (có dấu/không dấu) — không provider → không có nhánh nghĩa, vẫn trả kết quả và đánh dấu đã dùng', async () => {
    const { pool, calls } = poolFor({
      lexical: [id(1)],
      base: [row(1, { content: 'Thi IELTS tháng 12' }), row(2)],
    })
    const out = await searchMemories(pool, PERSON, {
      query: 'thi ielts',
      now: NOW,
      embeddingProvider: null,
    })
    expect(out.map((s) => s.record.id)).toEqual([id(1), id(2)])
    expect(out[0]!.relevance).toBe(1)
    expect(out[1]!.relevance).toBe(0)
    expect(embeddings.embedQuery).not.toHaveBeenCalled()
    const lexical = calls.find((c) => c.sql.includes('search_tsv @@'))!
    expect(lexical.params).toEqual([PERSON, 'thi | ielts', ['public', 'personal']])
    const touch = calls.find((c) => c.sql.includes('last_accessed_at = now()'))!
    expect(touch.params).toEqual([PERSON, [id(1), id(2)]])
  })

  it('nhánh nghĩa: cosine trong Node, RRF gộp — ký ức có mặt cả hai danh sách đứng đầu', async () => {
    embeddings.embedQuery.mockResolvedValue([1, 0])
    const { pool } = poolFor({
      lexical: [id(2), id(1)],
      semantic: [
        { id: id(1), embedding: [1, 0] }, // cosine 1
        { id: id(3), embedding: [0.7, 0.7] }, // cosine 0.7
        { id: id(4), embedding: [-1, 0] }, // cosine âm → loại
      ],
      base: [row(1), row(2), row(3), row(4)],
    })
    const out = await searchMemories(pool, PERSON, {
      query: 'ielts',
      now: NOW,
      embeddingProvider: { model: 'x', embed: async () => [] },
    })
    expect(out[0]!.record.id).toBe(id(1)) // hạng 2 chữ + hạng 1 nghĩa
    expect(out.map((s) => s.record.id).slice(0, 3)).toEqual(
      expect.arrayContaining([id(1), id(2), id(3)]),
    )
    expect(out.find((s) => s.record.id === id(4))!.relevance).toBe(0)
  })

  it('ký ức quan trọng không khớp chữ vẫn vào top nhờ importance; ứng viên ngoài tập nền được tải thêm theo id', async () => {
    const { pool, calls } = poolFor({
      lexical: [id(9)],
      base: [row(1, { importance: 9 }), row(2, { importance: 2 })],
      byId: { [id(9)]: row(9, { importance: 1 }) },
    })
    const out = await searchMemories(pool, PERSON, {
      query: 'xy',
      now: NOW,
      limit: 2,
      embeddingProvider: null,
    })
    // id9: recency 1 + importance 0.1 + relevance 1 = 2.1; id1: 1 + 0.9 + 0 = 1.9; id2: 1.2
    expect(out.map((s) => s.record.id)).toEqual([id(9), id(1)])
    const fetchMissing = calls.find(
      (c) => c.sql.includes('id = any($2::uuid[])') && c.sql.trim().startsWith('select'),
    )!
    expect(fetchMissing.params).toEqual([PERSON, [id(9)]])
  })

  it('recency: ký ức dùng gần đây thắng ký ức cùng importance nhưng cũ', async () => {
    const old = new Date(NOW.getTime() - 7 * 24 * 3_600_000)
    const { pool } = poolFor({
      base: [row(1, { last_accessed_at: old, created_at: old }), row(2, { last_accessed_at: NOW })],
    })
    const out = await searchMemories(pool, PERSON, { query: '', now: NOW, embeddingProvider: null })
    expect(out.map((s) => s.record.id)).toEqual([id(2), id(1)])
    expect(out[1]!.recency).toBeLessThan(0.5)
  })

  it('maxSensitivity lọc ở SQL; không ký ức → []; touch lỗi không làm hỏng kết quả', async () => {
    const { pool: empty } = poolFor({})
    expect(await searchMemories(empty, PERSON, { query: 'a', embeddingProvider: null })).toEqual([])

    const calls: unknown[][] = []
    const query = vi.fn(async (sql: string, params: unknown[] = []) => {
      calls.push(params)
      if (sql.includes('last_accessed_at = now()')) throw new Error('db bận')
      if (sql.includes('order by importance desc, last_accessed_at desc nulls last')) {
        return { rows: [row(1)] }
      }
      return { rows: [] }
    })
    const out = await searchMemories({ query } as unknown as Pool, PERSON, {
      query: 'ab',
      maxSensitivity: 'sensitive',
      embeddingProvider: null,
    })
    expect(out).toHaveLength(1)
    expect(calls[0]![2]).toEqual(['public', 'personal', 'sensitive'])
  })

  it('embedQuery dùng provider mặc định khi không truyền, và bị bỏ qua khi skipSemantic', async () => {
    embeddings.embedQuery.mockResolvedValue(null)
    const { pool } = poolFor({ base: [row(1)] })
    await searchMemories(pool, PERSON, { query: 'hỏi' })
    expect(embeddings.embedQuery).toHaveBeenCalledWith('hỏi')
    embeddings.embedQuery.mockClear()
    await searchMemories(pool, PERSON, { query: 'hỏi', skipSemantic: true })
    expect(embeddings.embedQuery).not.toHaveBeenCalled()
  })

  it('tập nền lấy đúng BASE_CANDIDATES và giới hạn limit kẹp [1, 50]', async () => {
    const { pool, calls } = poolFor({ base: Array.from({ length: 5 }, (_, i) => row(i + 1)) })
    const out = await searchMemories(pool, PERSON, { query: '', limit: 0, embeddingProvider: null })
    expect(out).toHaveLength(1)
    const base = calls.find((c) =>
      c.sql.includes('order by importance desc, last_accessed_at desc nulls last'),
    )!
    expect(base.sql).toContain(`limit ${BASE_CANDIDATES}`)
  })
})

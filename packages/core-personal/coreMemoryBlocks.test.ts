// coreMemoryBlocks.test.ts — khối ghi nhớ cố định (người dùng tự viết, khoá phiên bản) và tóm tắt
// cuộn (xoá giữ con trỏ) — đặc tả GĐ2b ③/④.
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { ConflictError, ValidationError } from '@dhcb/core-errors/appError'
import {
  listCoreBlocks,
  setCoreBlock,
  listConversationSummaries,
  getConversationSummary,
  upsertConversationSummary,
  clearConversationSummary,
  CORE_MEMORY_BLOCK_LABELS,
} from './coreMemoryBlocks.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const BLOCK_ID = '22222222-2222-4222-8222-222222222222'
const MSG_ID = '33333333-3333-4333-8333-333333333333'
const NOW = new Date('2026-10-12T08:00:00Z')

function poolReturning(result: { rows?: unknown[]; rowCount?: number }) {
  // Khai kiểu tham số để `mock.calls[i]` có dạng [sql, params] (không phải tuple rỗng).
  const query = vi.fn<(sql: string, params?: unknown[]) => Promise<typeof result>>(async () => ({
    rows: [] as unknown[],
    rowCount: 0,
    ...result,
  }))
  return { pool: { query } as unknown as Pool, query }
}

function blockRow(over: Record<string, unknown> = {}) {
  return {
    id: BLOCK_ID,
    label: 'about_me',
    content: 'Học sinh lớp 10, thích vẽ',
    version: 2,
    updated_at: NOW,
    ...over,
  }
}

describe('listCoreBlocks', () => {
  it('luôn trả đủ hai khối theo thứ tự cố định; khối chưa viết = rỗng, version 0', async () => {
    const { pool } = poolReturning({ rows: [blockRow()] })
    const blocks = await listCoreBlocks(pool, PERSON)
    expect(blocks.map((b) => b.label)).toEqual([...CORE_MEMORY_BLOCK_LABELS])
    expect(blocks[0]).toEqual({
      id: BLOCK_ID,
      label: 'about_me',
      content: 'Học sinh lớp 10, thích vẽ',
      version: 2,
      updatedAt: NOW.toISOString(),
    })
    expect(blocks[1]).toEqual({ id: null, label: 'current_focus', content: '', version: 0 })
  })
})

describe('setCoreBlock', () => {
  it('chưa có (expectedVersion 0) → insert … on conflict do nothing; nội dung được trim', async () => {
    const { pool, query } = poolReturning({ rows: [blockRow({ version: 1 })] })
    const out = await setCoreBlock(pool, PERSON, 'about_me', '  Học sinh lớp 10  ', 0)
    expect(out.version).toBe(1)
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]]
    expect(sql).toContain('on conflict (person_id, label) do nothing')
    expect(params).toEqual([PERSON, 'about_me', 'Học sinh lớp 10'])
  })

  it('insert đụng dòng đã có (tab khác vừa tạo) → 409', async () => {
    const { pool } = poolReturning({ rows: [] })
    await expect(setCoreBlock(pool, PERSON, 'about_me', 'x', 0)).rejects.toThrow(ConflictError)
  })

  it('sửa đúng phiên bản → update version + 1; lệch phiên bản → 409', async () => {
    const ok = poolReturning({ rows: [blockRow({ version: 3 })] })
    const out = await setCoreBlock(ok.pool, PERSON, 'about_me', 'mới', 2)
    expect(out.version).toBe(3)
    const [sql, params] = ok.query.mock.calls[0] as unknown as [string, unknown[]]
    expect(sql).toContain('version = $3')
    expect(params).toEqual([PERSON, 'about_me', 2, 'mới'])

    const stale = poolReturning({ rows: [] })
    await expect(setCoreBlock(stale.pool, PERSON, 'about_me', 'mới', 2)).rejects.toThrow(
      ConflictError,
    )
  })

  it('chuỗi rỗng = xoá đúng phiên bản; lệch → 409', async () => {
    const del = poolReturning({ rowCount: 1 })
    expect(await setCoreBlock(del.pool, PERSON, 'current_focus', '   ', 4)).toEqual({
      id: null,
      label: 'current_focus',
      content: '',
      version: 0,
    })
    expect(String(del.query.mock.calls[0]?.[0])).toContain('delete from')

    const stale = poolReturning({ rowCount: 0 })
    await expect(setCoreBlock(stale.pool, PERSON, 'current_focus', '', 4)).rejects.toThrow(
      ConflictError,
    )
  })

  it('xoá khối chưa từng có: không có dòng → không làm gì; đã có dòng (tab khác vừa tạo) → 409', async () => {
    const none = poolReturning({ rows: [] })
    expect((await setCoreBlock(none.pool, PERSON, 'about_me', '', 0)).version).toBe(0)
    const exists = poolReturning({ rows: [{ id: BLOCK_ID }] })
    await expect(setCoreBlock(exists.pool, PERSON, 'about_me', '', 0)).rejects.toThrow(
      ConflictError,
    )
  })

  it('quá 1.500 ký tự → ValidationError, không chạm CSDL', async () => {
    const { pool, query } = poolReturning({})
    await expect(setCoreBlock(pool, PERSON, 'about_me', 'a'.repeat(1501), 0)).rejects.toThrow(
      ValidationError,
    )
    expect(query).not.toHaveBeenCalled()
  })
})

describe('tóm tắt cuộn', () => {
  const summaryRow = {
    id: BLOCK_ID,
    domain: 'learning',
    summary: 'Đã bàn về ôn IELTS phần Nghe.',
    summarized_through_at: NOW,
    summarized_through_id: MSG_ID,
    updated_at: NOW,
  }

  it('list + get trả con trỏ; get chỉ lấy bản còn nội dung', async () => {
    const { pool, query } = poolReturning({ rows: [summaryRow] })
    const all = await listConversationSummaries(pool, PERSON)
    expect(all[0]).toEqual({
      id: BLOCK_ID,
      domain: 'learning',
      summary: 'Đã bàn về ôn IELTS phần Nghe.',
      updatedAt: NOW.toISOString(),
      through: { at: NOW, id: MSG_ID },
    })
    const one = await getConversationSummary(pool, PERSON, 'learning')
    expect(one?.summary).toBe('Đã bàn về ôn IELTS phần Nghe.')
    expect(String(query.mock.calls[1]?.[0])).toContain("summary <> ''")

    const empty = poolReturning({ rows: [] })
    expect(await getConversationSummary(empty.pool, PERSON, 'work')).toBeNull()
  })

  it('upsert cắt ≤ 1.500 ký tự và tăng version khi đã có', async () => {
    const { pool, query } = poolReturning({})
    await upsertConversationSummary(pool, PERSON, 'learning', ` ${'s'.repeat(1600)} `, {
      at: NOW,
      id: MSG_ID,
    })
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]]
    expect(sql).toContain('on conflict (person_id, domain) do update')
    expect((params[2] as string).length).toBe(1500)
    expect(params.slice(3)).toEqual([NOW, MSG_ID])
  })

  it('xoá = nội dung rỗng, KHÔNG đụng con trỏ', async () => {
    const { pool, query } = poolReturning({})
    await clearConversationSummary(pool, PERSON, 'learning')
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]]
    expect(sql).toContain("set summary = ''")
    expect(sql).not.toContain('summarized_through')
    expect(params).toEqual([PERSON, 'learning'])
  })
})

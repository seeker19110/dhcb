// companionMemoryApi.test.ts — client cài đặt ký ức + sửa/quên (GĐ2a ④).
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CompanionMemoryApiError,
  clearConversationSummary,
  decideMemorySuggestion,
  fetchCompanionMemoryOverview,
  fetchMemorySuggestions,
  saveCoreBlock,
  fetchCompanionMemorySettings,
  fetchMemories,
  forgetMemory,
  updateCompanionMemorySettings,
  updateMemory,
} from './companionMemoryApi'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({ Authorization: 'Bearer t' }) }))

const RECORD = {
  id: '22222222-2222-4222-8222-222222222222',
  personId: '11111111-1111-4111-8111-111111111111',
  namespace: 'semantic',
  content: 'Thi IELTS tháng 12',
  provenance: 'companion:conversation',
  sensitivity: 'personal',
  status: 'accepted',
  createdAt: '2026-10-11T00:00:00.000Z',
  version: 1,
  importance: 5,
  validFrom: '2026-10-11T00:00:00.000Z',
  hasEmbedding: true,
  schemaVersion: 2,
}

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () => new Response(JSON.stringify(body), { status }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('cài đặt ký ức', () => {
  it('GET đọc hai công tắc kèm token', async () => {
    const f = stubFetch(200, {
      settings: { rememberMemories: true, useHistory: false, suggestMemories: false },
    })
    expect(await fetchCompanionMemorySettings()).toEqual({
      rememberMemories: true,
      useHistory: false,
      suggestMemories: false,
    })
    expect(f.mock.calls[0]![0]).toBe('/api/companion-memory')
    expect((f.mock.calls[0]![1] as RequestInit).headers).toEqual({ Authorization: 'Bearer t' })
  })

  it('POST chỉ gửi công tắc cần đổi và trả trạng thái server đọc lại', async () => {
    const f = stubFetch(200, {
      settings: { rememberMemories: true, useHistory: true, suggestMemories: false },
    })
    const out = await updateCompanionMemorySettings({ rememberMemories: true })
    expect(out.useHistory).toBe(true)
    expect(JSON.parse((f.mock.calls[0]![1] as RequestInit).body as string)).toEqual({
      action: 'set_settings',
      rememberMemories: true,
    })
  })

  it('server trả body lạ → ném lỗi Zod (không im lặng dùng dữ liệu hỏng)', async () => {
    stubFetch(200, { settings: { rememberMemories: 'yes' } })
    await expect(fetchCompanionMemorySettings()).rejects.toThrow()
  })
})

describe('danh sách ký ức', () => {
  it('GET parse đúng hợp đồng MemoryRecord v2', async () => {
    stubFetch(200, { records: [RECORD] })
    const list = await fetchMemories()
    expect(list).toHaveLength(1)
    expect(list[0]!.version).toBe(1)
  })

  it('403 kèm code 2FA → CompanionMemoryApiError có code để trang rẽ nhánh', async () => {
    stubFetch(403, { error: 'Bật xác thực hai bước', code: 'STEP_UP_REQUIRED' })
    const err = await fetchMemories().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(CompanionMemoryApiError)
    expect((err as CompanionMemoryApiError).code).toBe('STEP_UP_REQUIRED')
    expect((err as CompanionMemoryApiError).status).toBe(403)
  })

  it('lỗi không có body JSON → vẫn ném lỗi có thông điệp mặc định', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('oops', { status: 500 })),
    )
    await expect(fetchMemories()).rejects.toThrow('Không tải được danh sách ký ức')
  })

  it('sửa → POST action update với expectedVersion; bản nhạy cảm chỉ trả id/status/version', async () => {
    const f = stubFetch(200, { record: { id: RECORD.id, status: 'accepted', version: 2 } })
    const out = await updateMemory(RECORD.id, 'Thi IELTS tháng 1', 1)
    expect(out).toEqual({ id: RECORD.id, status: 'accepted', version: 2 })
    expect(JSON.parse((f.mock.calls[0]![1] as RequestInit).body as string)).toEqual({
      action: 'update',
      id: RECORD.id,
      content: 'Thi IELTS tháng 1',
      expectedVersion: 1,
    })
  })

  it('quên → PATCH action expire; 409 lệch version ném lỗi có status', async () => {
    const f = stubFetch(200, { record: { id: RECORD.id, status: 'expired' } })
    await forgetMemory(RECORD.id, 1)
    expect((f.mock.calls[0]![1] as RequestInit).method).toBe('PATCH')
    expect(JSON.parse((f.mock.calls[0]![1] as RequestInit).body as string)).toEqual({
      action: 'expire',
      id: RECORD.id,
      expectedVersion: 1,
    })
    stubFetch(409, { error: 'Bản ghi đã đổi' })
    const err = await forgetMemory(RECORD.id, 1).catch((e: unknown) => e)
    expect((err as CompanionMemoryApiError).status).toBe(409)
  })
})

describe('GĐ2b — tổng quan, khối cố định, tóm tắt, gợi ý chờ duyệt', () => {
  const OVERVIEW = {
    settings: { rememberMemories: true, useHistory: true, suggestMemories: false },
    coreBlocks: [
      { label: 'about_me', content: 'Lớp 10', version: 1, updatedAt: '2026-10-12T00:00:00.000Z' },
      { label: 'current_focus', content: '', version: 0 },
    ],
    summaries: [
      { domain: 'learning', summary: 'Đã ôn Nghe.', updatedAt: '2026-10-12T00:00:00.000Z' },
    ],
  }

  it('tổng quan parse đủ ba phần; body lạ → ném lỗi', async () => {
    stubFetch(200, OVERVIEW)
    expect(await fetchCompanionMemoryOverview()).toEqual(OVERVIEW)
    stubFetch(200, { settings: OVERVIEW.settings })
    await expect(fetchCompanionMemoryOverview()).rejects.toThrow()
    stubFetch(500, {})
    await expect(fetchCompanionMemoryOverview()).rejects.toBeInstanceOf(CompanionMemoryApiError)
  })

  it('lưu khối cố định → POST set_core_block kèm expectedVersion; 409 ném lỗi có status', async () => {
    const fetchMock = stubFetch(200, { block: { label: 'about_me', content: 'Mới', version: 2 } })
    expect(await saveCoreBlock('about_me', 'Mới', 1)).toEqual({
      label: 'about_me',
      content: 'Mới',
      version: 2,
    })
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      action: 'set_core_block',
      label: 'about_me',
      content: 'Mới',
      expectedVersion: 1,
    })
    stubFetch(409, { error: 'đã đổi' })
    await expect(saveCoreBlock('about_me', 'x', 1)).rejects.toMatchObject({ status: 409 })
  })

  it('xoá tóm tắt → POST clear_summary, trả danh sách còn lại', async () => {
    const fetchMock = stubFetch(200, { summaries: [] })
    expect(await clearConversationSummary('learning')).toEqual([])
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      action: 'clear_summary',
      domain: 'learning',
    })
    stubFetch(500, {})
    await expect(clearConversationSummary('learning')).rejects.toBeInstanceOf(
      CompanionMemoryApiError,
    )
  })

  it('gợi ý chờ duyệt: chỉ lấy ba capability ký ức, đổi payload sang nội dung hiển thị', async () => {
    const id = (n: number) => `0000000${n}-0000-4000-8000-000000000000`
    const fetchMock = stubFetch(200, {
      actions: [
        {
          id: id(1),
          capabilityId: 'memory.create_record',
          status: 'pending',
          payload: { content: 'Thích học buổi sáng' },
          createdAt: '2026-10-12T00:00:00.000Z',
        },
        {
          id: id(2),
          capabilityId: 'memory.supersede_record',
          status: 'pending',
          payload: { content: 'Nhắm 7.0', previousContent: 'Nhắm 6.5' },
          createdAt: '2026-10-12T00:00:00.000Z',
        },
        {
          id: id(3),
          capabilityId: 'memory.invalidate_record',
          status: 'pending',
          payload: { previousContent: 'Học buổi tối' },
          createdAt: '2026-10-12T00:00:00.000Z',
        },
        {
          id: id(4),
          capabilityId: 'profile.update_fact',
          status: 'pending',
          payload: { rawText: 'không phải ký ức' },
          createdAt: '2026-10-12T00:00:00.000Z',
        },
        {
          id: id(5),
          capabilityId: 'memory.create_record',
          status: 'pending',
          payload: 'hỏng',
          createdAt: '2026-10-12T00:00:00.000Z',
        },
      ],
    })
    expect(await fetchMemorySuggestions()).toEqual([
      {
        id: id(1),
        kind: 'add',
        content: 'Thích học buổi sáng',
        createdAt: '2026-10-12T00:00:00.000Z',
      },
      {
        id: id(2),
        kind: 'update',
        content: 'Nhắm 7.0',
        previousContent: 'Nhắm 6.5',
        createdAt: '2026-10-12T00:00:00.000Z',
      },
      {
        id: id(3),
        kind: 'invalidate',
        content: '',
        previousContent: 'Học buổi tối',
        createdAt: '2026-10-12T00:00:00.000Z',
      },
    ])
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/proposed-actions?status=pending')
    stubFetch(500, {})
    await expect(fetchMemorySuggestions()).rejects.toBeInstanceOf(CompanionMemoryApiError)
  })

  it('duyệt/bỏ qua → PATCH confirm/reject với expectedVersion 1; lỗi ném có status', async () => {
    const fetchMock = stubFetch(200, { action: {} })
    await decideMemorySuggestion('abc', 'confirm')
    await decideMemorySuggestion('abc', 'reject')
    expect(fetchMock.mock.calls.map((c) => JSON.parse(String(c[1]?.body)))).toEqual([
      { action: 'confirm', id: 'abc', expectedVersion: 1 },
      { action: 'reject', id: 'abc', expectedVersion: 1 },
    ])
    stubFetch(409, { error: 'Ký ức vừa được sửa' })
    await expect(decideMemorySuggestion('abc', 'confirm')).rejects.toMatchObject({
      status: 409,
      message: 'Ký ức vừa được sửa',
    })
    stubFetch(500, {})
    await expect(decideMemorySuggestion('abc', 'reject')).rejects.toThrow(
      'Chưa bỏ qua được gợi ý này',
    )
  })
})

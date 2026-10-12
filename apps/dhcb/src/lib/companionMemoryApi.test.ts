// companionMemoryApi.test.ts — client cài đặt ký ức + sửa/quên (GĐ2a ④).
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CompanionMemoryApiError,
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
    const f = stubFetch(200, { settings: { rememberMemories: true, useHistory: false } })
    expect(await fetchCompanionMemorySettings()).toEqual({
      rememberMemories: true,
      useHistory: false,
    })
    expect(f.mock.calls[0]![0]).toBe('/api/companion-memory')
    expect((f.mock.calls[0]![1] as RequestInit).headers).toEqual({ Authorization: 'Bearer t' })
  })

  it('POST chỉ gửi công tắc cần đổi và trả trạng thái server đọc lại', async () => {
    const f = stubFetch(200, { settings: { rememberMemories: true, useHistory: true } })
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

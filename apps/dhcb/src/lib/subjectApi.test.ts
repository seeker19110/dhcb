// apps/dhcb/src/lib/subjectApi.test.ts
//
// [S03-1, 2026-09-15] Bộ test này trước đây mock manifest THIẾU field (chỉ id/label/category)
// và vẫn xanh — vì client không hề validate gì. Nay mock phải là manifest THẬT khớp
// `SubjectManifestSchema`, đúng cái máy chủ trả ra; và có thêm các ca lỗi phân loại.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listSubjects, getSubjectDetails, SubjectApiError } from './subjectApi'
import { SUBJECT_MANIFEST_SCHEMA_VERSION } from '@dhcb/core-contracts/subjectManifest'

/** Manifest hợp lệ tối thiểu — cùng hình dạng với `SUPPORTED_SUBJECTS` của máy chủ. */
function manifest(over: Record<string, unknown> = {}) {
  return {
    id: 'english',
    label: 'Tiếng Anh',
    description: 'Luyện giao tiếp, ngữ pháp, phát âm và từ vựng theo chuẩn CEFR',
    category: 'language',
    taxonomyKind: 'cefr',
    standardLevels: ['A1', 'A2'],
    questionTypes: ['vocabulary_mcq'],
    evaluationModes: ['rubric_ai'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
    ...over,
  }
}

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response
}

describe('subjectApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('listSubjects should fetch all subjects', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      okResponse({
        subjects: [
          manifest(),
          manifest({ id: 'mathematics', label: 'Toán học', category: 'stem' }),
        ],
      }),
    )

    const result = await listSubjects()
    expect(result).toHaveLength(2)
    expect(result[0]!.id).toBe('english')
    expect(global.fetch).toHaveBeenCalledWith('/api/subjects', expect.any(Object))
  })

  it('listSubjects should filter by category', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      okResponse({ subjects: [manifest({ id: 'physics', label: 'Vật lí', category: 'stem' })] }),
    )

    const result = await listSubjects('stem')
    expect(result).toHaveLength(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/subjects?category=stem', expect.any(Object))
  })

  it('getSubjectDetails should fetch details by id', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      okResponse({ subject: manifest({ id: 'chemistry', label: 'Hóa học', category: 'stem' }) }),
    )

    const result = await getSubjectDetails('chemistry')
    expect(result.id).toBe('chemistry')
    expect(result.label).toBe('Hóa học')
    expect(global.fetch).toHaveBeenCalledWith('/api/subjects?id=chemistry', expect.any(Object))
  })

  it('danh mục rỗng THẬT vẫn là kết quả hợp lệ, không phải lỗi', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(okResponse({ subjects: [] }))
    await expect(listSubjects()).resolves.toEqual([])
  })

  // --- Ca lỗi: mỗi loại phải nói đúng chuyện đã xảy ra -------------------------------

  it('mạng hỏng → kind "network", KHÔNG phải danh sách rỗng', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const err = await listSubjects().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(SubjectApiError)
    expect((err as SubjectApiError).kind).toBe('network')
    expect((err as SubjectApiError).status).toBeUndefined()
  })

  it('503 → kind "http" giữ đúng mã, câu tiếng Việt nói về bảo trì/quá tải', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as unknown as Response)

    const err = (await listSubjects().catch((e: unknown) => e)) as SubjectApiError
    expect(err.kind).toBe('http')
    expect(err.status).toBe(503)
    expect(err.message).toContain('503')
    // Không rò `statusText` tiếng Anh ra giao diện.
    expect(err.message).not.toContain('Service Unavailable')
  })

  it('429 nói rõ là quá nhiều yêu cầu, để người dùng biết chờ rồi thử lại', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    } as unknown as Response)

    const err = (await listSubjects().catch((e: unknown) => e)) as SubjectApiError
    expect(err.status).toBe(429)
    expect(err.message).toContain('Quá nhiều yêu cầu')
  })

  it('payload sai hợp đồng → kind "invalid", KHÔNG lọt qua như dữ liệu thật', async () => {
    // Thiếu `description`/`standardLevels`… — đúng hình dạng mock CŨ của chính file này,
    // thứ từng lọt qua trót lọt khi chưa có validate.
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      okResponse({ subjects: [{ id: 'english', label: 'Tiếng Anh', category: 'language' }] }),
    )

    const err = (await listSubjects().catch((e: unknown) => e)) as SubjectApiError
    expect(err).toBeInstanceOf(SubjectApiError)
    expect(err.kind).toBe('invalid')
  })

  it('thân phản hồi không phải JSON → kind "invalid"', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <')
      },
    } as unknown as Response)

    const err = (await listSubjects().catch((e: unknown) => e)) as SubjectApiError
    expect(err.kind).toBe('invalid')
  })

  it('should throw on error response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as unknown as Response)

    await expect(getSubjectDetails('unknown')).rejects.toBeInstanceOf(SubjectApiError)
  })

  // --- Huỷ request: phải giữ nguyên AbortError, không nuốt thành lỗi hiện cho người dùng ---

  it('truyền AbortSignal xuống fetch', async () => {
    const controller = new AbortController()
    const spy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(okResponse({ subjects: [] }))

    await listSubjects('stem', { signal: controller.signal })

    expect(spy).toHaveBeenCalledWith(
      '/api/subjects?category=stem',
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it('bị huỷ → ném nguyên AbortError, KHÔNG bọc thành SubjectApiError', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(
      new DOMException('The operation was aborted.', 'AbortError'),
    )

    const err = await listSubjects().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(DOMException)
    expect((err as DOMException).name).toBe('AbortError')
    expect(err).not.toBeInstanceOf(SubjectApiError)
  })
})

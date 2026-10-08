// loader.test.ts — loader "Cụm từ theo chủ thể" phải BÁO lỗi tải và KHÔNG cache lỗi
// (changelog 0525). Bản cũ không kiểm `res.ok`, cache luôn lời hứa bị từ chối và cache cả body
// lỗi như dữ liệu → trang Nghe / Câu thông dụng kẹt tới khi tải lại cả trang.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type Loader = typeof import('./loader')

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const META = { starter: 'I am', category: 'Cơ bản', color: 'sky', count: 1, chunk: 0, idx: 0 }
const SUBJECT = { starter: 'I am', category: 'Cơ bản', color: 'sky', sentences: [] }

const fetchMock = vi.fn<(url: string) => Promise<Response>>()

// Module có lời gọi nạp sẵn lúc import → mỗi test nạp bản module MỚI sau khi đặt fetch giả.
async function importFresh(): Promise<Loader> {
  vi.resetModules()
  return import('./loader')
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadIndex', () => {
  it('HTTP 500 → reject (bản cũ resolve với body lỗi như dữ liệu)', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ error: 'boom' }, 500))
    const { loadIndex } = await importFresh()
    await expect(loadIndex()).rejects.toThrow('HTTP 500')
  })

  it('lỗi KHÔNG bị cache: gọi lại sau khi mạng hồi thì tải được', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')) // lượt nạp sẵn lúc import
    const { loadIndex } = await importFresh()
    await Promise.resolve()
    fetchMock.mockImplementation(async () => jsonResponse([META]))
    await expect(loadIndex()).resolves.toEqual([META])
  })

  it('body không phải mảng → reject câu dễ hiểu', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ nope: true }))
    const { loadIndex } = await importFresh()
    await expect(loadIndex()).rejects.toThrow('không đúng định dạng')
  })

  it('thành công → cache, không tải lại', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([META]))
    const { loadIndex } = await importFresh()
    await loadIndex()
    await loadIndex()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('loadSubject / loadChunk', () => {
  it('chunk HTTP 503 → reject, và lần sau tải lại được (không cache lỗi)', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([META])) // index nạp sẵn
    const { loadSubject } = await importFresh()
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'down' }, 503))
    await expect(loadSubject(META)).rejects.toThrow('HTTP 503')

    fetchMock.mockResolvedValueOnce(jsonResponse([SUBJECT]))
    await expect(loadSubject(META)).resolves.toEqual(SUBJECT)
  })

  it('chunk không phải mảng → reject (bản cũ cache object lỗi rồi `chunk.find` nổ TypeError)', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([META]))
    const { loadChunk } = await importFresh()
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'x' }))
    await expect(loadChunk(0)).rejects.toThrow('không đúng định dạng')
  })

  it('tìm theo starter khi idx lệch; không có → null', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([META]))
    const { loadSubject } = await importFresh()
    fetchMock.mockResolvedValueOnce(jsonResponse([SUBJECT]))
    await expect(loadSubject({ ...META, idx: 5 })).resolves.toEqual(SUBJECT)
    await expect(loadSubject({ ...META, idx: 5, starter: 'khác' })).resolves.toBeNull()
  })
})

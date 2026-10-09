import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('@core/authHeader', () => ({ getAuthHeader: () => ({}) }))

import { loadProjectFiles, saveProjectFileAt, snapshotMilestone } from './programmingProject'
import { PROJECT_MAIN_FILE, PROJECT_STARTER_CODE } from '@dhcb/subject-programming/projectSteps'

const UID = 'u1'
const CACHE_KEY = `dhcb_prog_project_${UID}`

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  const fn = vi.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)))
  vi.stubGlobal('fetch', fn as unknown as typeof fetch)
  return fn
}

const okJson = (body: unknown) => ({ ok: true, json: async () => body })

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('programmingProject — nạp workspace', () => {
  it('server có file chính → trả nội dung server và ghi cache', async () => {
    mockFetch(() => okJson({ files: [{ path: PROJECT_MAIN_FILE, content: 'print(1)' }] }))
    expect((await loadProjectFiles(UID))[PROJECT_MAIN_FILE]).toBe('print(1)')
    expect(localStorage.getItem(CACHE_KEY)).toContain('print(1)')
  })

  it('server chưa có file chính → trả code khởi đầu (người mới vào lần đầu)', async () => {
    mockFetch(() => okJson({ files: [] }))
    expect((await loadProjectFiles(UID))[PROJECT_MAIN_FILE]).toBe(PROJECT_STARTER_CODE)
  })

  it('mất mạng → dùng cache; cache rỗng/hỏng → code khởi đầu', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ files: { [PROJECT_MAIN_FILE]: 'cu = 1' } }))
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    expect((await loadProjectFiles(UID))[PROJECT_MAIN_FILE]).toBe('cu = 1')

    localStorage.setItem(CACHE_KEY, 'hỏng }{')
    expect((await loadProjectFiles(UID))[PROJECT_MAIN_FILE]).toBe(PROJECT_STARTER_CODE)
  })

  it('server trả lỗi HTTP → không ghi đè cache, dùng cache cũ', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ files: { [PROJECT_MAIN_FILE]: 'giu lai' } }))
    mockFetch(() => ({ ok: false, json: async () => ({}) }))
    expect((await loadProjectFiles(UID))[PROJECT_MAIN_FILE]).toBe('giu lai')
  })
})

describe('programmingProject — lưu file & snapshot', () => {
  it('lưu thành công → cache cập nhật + gửi đúng action/path', async () => {
    const fn = mockFetch(() => okJson({ ok: true }))
    expect(await saveProjectFileAt(UID, PROJECT_MAIN_FILE, 'x = 1')).toBe(true)
    const body = JSON.parse(String((fn.mock.calls[0]?.[1] as RequestInit).body))
    expect(body).toEqual({ action: 'save', path: PROJECT_MAIN_FILE, content: 'x = 1' })
    expect(localStorage.getItem(CACHE_KEY)).toContain('x = 1')
  })

  it('server từ chối (vượt quota) → trả false nhưng cache vẫn giữ bài của học viên', async () => {
    mockFetch(() => ({ ok: false, json: async () => ({ error: 'đầy' }) }))
    expect(await saveProjectFileAt(UID, PROJECT_MAIN_FILE, 'y = 2')).toBe(false)
    expect(localStorage.getItem(CACHE_KEY)).toContain('y = 2')
  })

  it('ngoại tuyến → trả false, KHÔNG mất bài (cache đã ghi trước khi gọi mạng)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    expect(await saveProjectFileAt(UID, PROJECT_MAIN_FILE, 'z = 3')).toBe(false)
    expect(localStorage.getItem(CACHE_KEY)).toContain('z = 3')
  })

  it('lưu file PHỤ (chặng P2 tách 3 file): gửi đúng path, cache giữ cả hai file', async () => {
    const fn = mockFetch(() => okJson({ ok: true }))
    await saveProjectFileAt(UID, PROJECT_MAIN_FILE, 'main')
    await saveProjectFileAt(UID, 'logic.py', 'MENU = {}')
    const body = JSON.parse(String((fn.mock.calls[1]?.[1] as RequestInit).body))
    expect(body).toEqual({ action: 'save', path: 'logic.py', content: 'MENU = {}' })
    const cached = JSON.parse(String(localStorage.getItem(CACHE_KEY))) as {
      files: Record<string, string>
    }
    expect(cached.files).toEqual({ [PROJECT_MAIN_FILE]: 'main', 'logic.py': 'MENU = {}' })
  })

  it('nạp workspace trả VỀ ĐỦ file phụ chứ không chỉ file chính', async () => {
    mockFetch(() =>
      okJson({
        files: [
          { path: PROJECT_MAIN_FILE, content: 'main' },
          { path: 'logic.py', content: 'MENU = {}' },
        ],
      }),
    )
    expect(await loadProjectFiles(UID)).toEqual({
      [PROJECT_MAIN_FILE]: 'main',
      'logic.py': 'MENU = {}',
    })
  })

  it('snapshot: gửi đúng milestone; lỗi mạng → false, không ném', async () => {
    const fn = mockFetch(() => okJson({ ok: true }))
    expect(await snapshotMilestone('p1')).toBe(true)
    expect(JSON.parse(String((fn.mock.calls[0]?.[1] as RequestInit).body))).toEqual({
      action: 'snapshot',
      milestone: 'p1',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    expect(await snapshotMilestone('p1')).toBe(false)
  })
})

// Hạ tầng T2/T3 (2026-10-09): mỗi dự án một không gian tên file — đổi dự án không mất gì.
describe('programmingProject — tách workspace theo dự án', () => {
  const SERVER_FILES = [
    { path: PROJECT_MAIN_FILE, content: 't1-main' },
    { path: 'logic.py', content: 't1-logic' },
    { path: 't2--quy_lop.py', content: 't2-main' },
    { path: 't2--logic.py', content: 't2-logic' },
  ]

  it('T1 (mặc định) KHÔNG thấy file của T2', async () => {
    mockFetch(() => okJson({ files: SERVER_FILES }))
    expect(await loadProjectFiles(UID)).toEqual({
      [PROJECT_MAIN_FILE]: 't1-main',
      'logic.py': 't1-logic',
    })
  })

  it('T2 chỉ thấy file của mình, dưới TÊN CHẠY (bỏ tiền tố lưu)', async () => {
    mockFetch(() => okJson({ files: SERVER_FILES }))
    expect(await loadProjectFiles(UID, 'T2')).toEqual({
      'quy_lop.py': 't2-main',
      'logic.py': 't2-logic',
    })
  })

  it('T3 lần đầu: chỉ có file chính T3 với code khởi đầu riêng', async () => {
    mockFetch(() => okJson({ files: SERVER_FILES }))
    const files = await loadProjectFiles(UID, 'T3')
    expect(Object.keys(files)).toEqual(['so_hoc_tap.py'])
    expect(files['so_hoc_tap.py']).toContain('Sổ học tập của tôi')
  })

  it('mất mạng: cache giữ CẢ cây, mỗi dự án đọc đúng phần của mình', async () => {
    mockFetch(() => okJson({ files: SERVER_FILES }))
    await loadProjectFiles(UID)
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch,
    )
    expect((await loadProjectFiles(UID, 'T2'))['logic.py']).toBe('t2-logic')
    expect((await loadProjectFiles(UID, 'T1'))['logic.py']).toBe('t1-logic')
  })

  it('lưu file T2: gửi tên LƯU có tiền tố, file T1 cùng tên không bị đè', async () => {
    const fn = mockFetch(() => okJson({ ok: true }))
    await saveProjectFileAt(UID, 'logic.py', 'cua T1')
    await saveProjectFileAt(UID, 'logic.py', 'cua T2', 'T2')
    expect(JSON.parse(String((fn.mock.calls[1]?.[1] as RequestInit).body))).toEqual({
      action: 'save',
      path: 't2--logic.py',
      content: 'cua T2',
    })
    const cached = JSON.parse(String(localStorage.getItem(CACHE_KEY))) as {
      files: Record<string, string>
    }
    expect(cached.files).toEqual({ 'logic.py': 'cua T1', 't2--logic.py': 'cua T2' })
  })

  it('snapshot T2 gửi mốc có tiền tố dự án', async () => {
    const fn = mockFetch(() => okJson({ ok: true }))
    await snapshotMilestone('p3', 'T2')
    expect(JSON.parse(String((fn.mock.calls[0]?.[1] as RequestInit).body))).toEqual({
      action: 'snapshot',
      milestone: 't2-p3',
    })
  })
})

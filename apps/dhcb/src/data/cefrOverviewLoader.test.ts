import { describe, expect, it, vi } from 'vitest'

vi.mock('./cefrLoader', () => ({ loadCefr: vi.fn() }))
vi.mock('./curriculumLoader', () => ({ loadFoundationIndex: vi.fn() }))

import { loadCefr } from './cefrLoader'
import { loadFoundationIndex } from './curriculumLoader'
import { loadCefrOverview } from './cefrOverviewLoader'
import type { CefrLevel } from './cefr'

describe('loadCefrOverview', () => {
  it('gom danh sách cấp + tra vòng tóm tắt theo id', async () => {
    const levels = [{ id: 'A1' }] as unknown as CefrLevel[]
    vi.mocked(loadCefr).mockResolvedValueOnce(levels)
    vi.mocked(loadFoundationIndex).mockResolvedValueOnce([
      { id: 'greetings', titleVi: 'Chào', titleEn: 'Hi', emoji: '👋', words: [{ word: 'hi' }] },
    ])
    const overview = await loadCefrOverview()
    expect(overview.levels).toBe(levels)
    expect(Object.keys(overview.circleById)).toEqual(['greetings'])
    expect(overview.circleById.greetings?.words).toEqual([{ word: 'hi' }])
  })

  it('một trong hai nguồn lỗi → reject (để useAsyncLoad hiện khối lỗi, không kẹt chờ)', async () => {
    vi.mocked(loadCefr).mockResolvedValueOnce([])
    vi.mocked(loadFoundationIndex).mockRejectedValueOnce(new Error('Curriculum index HTTP 503'))
    await expect(loadCefrOverview()).rejects.toThrow('HTTP 503')
  })
})

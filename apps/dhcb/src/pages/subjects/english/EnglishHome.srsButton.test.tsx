// Nút "N thẻ đến hạn" ở EnglishHome phải mở tab ôn SRS của cấp đang học — cùng luật với mục ôn
// của adapter `englishNext` (thẻ "Hôm nay"). Trước đây nút trỏ `/luyen-tap`, trang không có ôn thẻ.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import EnglishHome from './EnglishHome'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const state = vi.hoisted(() => ({ levelId: 'A1' as string | undefined, due: 3 }))

vi.mock('../../../components/Layout.js', () => ({ default: () => null }))
vi.mock('../../../components/PricePromoBanner.js', () => ({ default: () => null }))
vi.mock('../../../components/RewardTipBanner.js', () => ({ default: () => null }))
vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'An', onboarded: true, plan: 'free' },
    isGuest: false,
  }),
}))
vi.mock('../../../lib/useCloudSync', () => ({ useCloudSync: () => ({ synced: true }) }))
vi.mock('../../../data/cefrLoader', () => ({ loadCefr: async () => [] }))
vi.mock('../../../data/curriculumLoader', () => ({ loadFoundationIndex: async () => [] }))
vi.mock('../../../lib/today/englishNext', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../../lib/today/englishNext')>()
  return {
    ...real,
    englishNext: () => (state.levelId ? { levelId: state.levelId } : {}),
  }
})
vi.mock('../../../lib/srs', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../../lib/srs')>()
  return { ...real, getSRSStats: () => ({ total: 10, due: state.due }) }
})

function Where() {
  const loc = useLocation()
  return <p data-testid="where">{loc.pathname + loc.search}</p>
}

describe('EnglishHome — nút "N thẻ đến hạn"', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    localStorage.clear()
    state.levelId = 'A1'
    state.due = 3
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  async function hien() {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/goc-hoc-tap/english']}>
          <Routes>
            <Route path="/goc-hoc-tap/english" element={<EnglishHome />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  function nutOn() {
    return Array.from(container.querySelectorAll('button')).find((b) =>
      /\d+ thẻ đến hạn/.test(b.textContent ?? ''),
    )
  }

  it('mở tab ôn SRS của cấp đang học, không về /luyen-tap', async () => {
    const { duongDanCapCefr } = await import('../../../lib/today/englishNext')
    await hien()
    const btn = nutOn()
    expect(btn?.textContent).toContain('3 thẻ đến hạn')
    act(() => btn!.click())
    const where = container.querySelector('[data-testid="where"]')?.textContent
    expect(where).toBe(`${duongDanCapCefr('A1')}?tab=srs`)
    expect(where).not.toContain('/luyen-tap')
  })

  it('ẩn khi không có cấp đang học (cùng luật với mục ôn của englishNext)', async () => {
    state.levelId = undefined
    await hien()
    expect(nutOn()).toBeUndefined()
  })

  it('ẩn khi không có thẻ đến hạn', async () => {
    state.due = 0
    await hien()
    expect(nutOn()).toBeUndefined()
  })
})

import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => ({
  lang: 'vi' as 'vi' | 'en',
  direction: 'A' as 'A' | 'B' | 'invalid',
  uid: 'learner-a',
}))

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../../lib/usePageTitle', () => ({ usePageTitle: () => undefined }))
vi.mock('../../context/useLang', () => ({ useLang: () => ({ lang: runtime.lang }) }))
vi.mock('../../context/useAuth', () => ({ useAuth: () => ({ user: { id: runtime.uid } }) }))
vi.mock('../../lib/storage', () => ({ getDirection: () => runtime.direction }))
vi.mock('../../lib/curriculum', () => ({
  loadCurriculum: () => Promise.resolve(),
  getLearningPath: () => [
    { word: 'hello', vi: 'xin chào', ex_en: 'Hello friend', ex_vi: 'Xin chào bạn' },
    { word: 'water', vi: 'nước', ex_en: 'Drink water', ex_vi: 'Uống nước' },
    { word: 'school', vi: 'trường học', ex_en: 'Go to school', ex_vi: 'Đi học' },
    { word: 'friend', vi: 'bạn', ex_en: 'My friend', ex_vi: 'Bạn tôi' },
  ],
}))
vi.mock('../../lib/vocab', () => ({ getLearnedWords: () => new Set<string>() }))
vi.mock('../../components/Layout.js', () => ({
  default: ({ onBack }: { onBack?: () => void }) =>
    onBack ? <button onClick={onBack}>Back to hub</button> : null,
}))
vi.mock('@core/PageShell', () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../components/PvPArena/PvPArenaCard.js', () => ({ default: () => null }))
vi.mock('./practice/PronounceList', () => ({
  PronounceList: ({
    items,
    isA,
    uiLang,
    onExit,
  }: {
    items: string[]
    isA: boolean
    uiLang: string
    onExit: () => void
  }) => (
    <div
      data-testid="pronunciation"
      data-items={JSON.stringify(items)}
      data-learning={isA ? 'A' : 'B'}
      data-ui={uiLang}
    >
      <button onClick={onExit}>Exit mode</button>
    </div>
  ),
}))
vi.mock('./practice/VocabListenGuess', () => ({ VocabListenGuess: () => null }))
vi.mock('./practice/SentenceScramble', () => ({ SentenceScramble: () => null }))
vi.mock('./practice/DictationTyping', () => ({ DictationTyping: () => null }))
vi.mock('./practice/FillBlankQuiz', () => ({ FillBlankQuiz: () => null }))
vi.mock('./practice/Shadowing', () => ({ Shadowing: () => null }))
vi.mock('./practice/ReverseInterview', () => ({ ReverseInterview: () => null }))

import Practice from './Practice'

let host: HTMLDivElement | undefined
let root: Root | undefined
afterEach(() => {
  if (root) act(() => root?.unmount())
  host?.remove()
  root = undefined
  host = undefined
  runtime.lang = 'vi'
  runtime.direction = 'A'
  runtime.uid = 'learner-a'
})

async function renderPage() {
  if (!host) {
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  }
  await act(async () => {
    root?.render(<Practice />)
    await Promise.resolve()
  })
  return host!
}

function openPronunciation(view: HTMLElement) {
  const button = [...view.querySelectorAll('button')].find((b) =>
    /Chấm phát âm từ vựng|Word pronunciation/.test(b.textContent ?? ''),
  )
  expect(button).toBeDefined()
  expect(button?.disabled).toBe(false)
  act(() => button?.click())
  return view.querySelector<HTMLElement>('[data-testid="pronunciation"]')!
}

describe('Practice S04 session direction', () => {
  it('keeps pronunciation targets when UI changes, then reads new direction after exiting', async () => {
    const view = await renderPage()
    const current = openPronunciation(view)
    const firstItems = current.dataset.items
    expect(current.dataset.learning).toBe('A')
    expect(current.dataset.ui).toBe('vi')
    expect(JSON.parse(firstItems ?? '[]')).toEqual(
      expect.arrayContaining(['hello', 'water', 'school', 'friend']),
    )

    runtime.lang = 'en'
    runtime.direction = 'B'
    await renderPage()
    const afterToggle = view.querySelector<HTMLElement>('[data-testid="pronunciation"]')!
    expect(afterToggle.dataset.items).toBe(firstItems)
    expect(afterToggle.dataset.learning).toBe('A')
    expect(afterToggle.dataset.ui).toBe('en')

    act(() => view.querySelector<HTMLButtonElement>('button')?.click())
    const next = openPronunciation(view)
    expect(next.dataset.learning).toBe('B')
    expect(JSON.parse(next.dataset.items ?? '[]')).toEqual(
      expect.arrayContaining(['xin chào', 'nước', 'trường học', 'bạn']),
    )
  })

  it('falls back to direction A for an invalid setting and hides the old session on user change', async () => {
    runtime.direction = 'invalid'
    const view = await renderPage()
    const current = openPronunciation(view)
    expect(current.dataset.learning).toBe('A')
    runtime.uid = 'learner-b'
    await renderPage()
    expect(view.querySelector('[data-testid="pronunciation"]')).toBeNull()
    runtime.uid = 'learner-a'
    await renderPage()
    expect(view.querySelector('[data-testid="pronunciation"]')).toBeNull()
  })
})

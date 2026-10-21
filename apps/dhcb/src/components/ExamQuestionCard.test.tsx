import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExamQuestionCard from './ExamQuestionCard'
import { ACCENT } from '../lib/cefrAccent'
import type { ExamQuestion } from '../lib/cefrExam'

vi.mock('../lib/tts', () => ({ speak: vi.fn() }))

const question: ExamQuestion = {
  key: 'one',
  part: 'grammar',
  promptKind: 'text',
  prompt: 'Choose a word',
  correct: 'yes',
  options: ['yes', 'no'],
}

describe('ExamQuestionCard', () => {
  let container: HTMLDivElement
  let root: Root
  const onPick = vi.fn()
  const onNext = vi.fn()

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    vi.clearAllMocks()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function render(selected: string | null = null, current = 0, q = question, isA = false) {
    act(() =>
      root.render(
        <StrictMode>
          <ExamQuestionCard
            q={q}
            isA={isA}
            accent={ACCENT.violet}
            current={current}
            total={2}
            selected={selected}
            onPick={onPick}
            onNext={onNext}
          />
        </StrictMode>,
      ),
    )
  }
  function option(value: string) {
    return container.querySelectorAll<HTMLButtonElement>('button[data-quiz-option]')[
      question.options.indexOf(value)
    ]!
  }
  function status() {
    return container.querySelector('[role="status"]')!
  }

  it('names the group without leaking an audio prompt or answer state', () => {
    render(null, 0, { ...question, promptKind: 'audio', prompt: 'SECRET', audioText: 'SECRET' })
    const group = container.querySelector('[role="group"]')!
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent).toContain(
      'Question 1. Listen, then choose the answer',
    )
    expect(container.innerHTML).not.toContain('SECRET')
    expect(container.textContent).not.toContain('Correct answer:')
    expect(status().textContent).toBe('')
    expect(option('yes').getAttribute('aria-pressed')).toBe('false')
    expect(option('yes').getAttribute('aria-disabled')).toBe('false')
    expect(document.activeElement).not.toBe(container.querySelector('h2'))
  })

  it('guards duplicate clicks before parent render and announces once across rerenders', () => {
    render()
    const live = status()
    act(() => {
      option('no').click()
      option('yes').click()
    })
    expect(onPick).toHaveBeenCalledExactlyOnceWith('no')
    expect(document.activeElement).toBe(option('no'))
    expect(live.textContent).toBe('Not correct. You selected: no. Correct answer: yes.')
    render('no')
    expect(option('no').getAttribute('aria-pressed')).toBe('true')
    expect(option('no').getAttribute('aria-disabled')).toBe('true')
    expect(option('no').disabled).toBe(false)
    expect(container.querySelector('p')?.textContent).toBe(live.textContent)
    const changes = vi.fn()
    const observer = new MutationObserver(changes)
    observer.observe(live, { childList: true, characterData: true, subtree: true })
    render('no', 0, { ...question }, true)
    expect(status()).toBe(live)
    expect(observer.takeRecords()).toHaveLength(0)
    expect(live.textContent).toContain('Not correct.')
    act(() => option('yes').click())
    expect(onPick).toHaveBeenCalledTimes(1)
    observer.disconnect()
  })

  it.each([false, true])(
    'restores visible feedback without announcement or focus (Vietnamese=%s)',
    (isA) => {
      render('yes', 0, question, isA)
      expect(container.querySelector('p')?.textContent).toBe(
        isA ? 'Đúng. Bạn đã chọn: yes.' : 'Correct. You selected: yes.',
      )
      expect(status().textContent).toBe('')
      expect(document.activeElement).not.toBe(container.querySelector('h2'))
    },
  )

  it('guards Next and focuses only the new heading after an accepted Next', () => {
    render()
    act(() => option('yes').click())
    render('yes')
    // Nút Next là button trực tiếp cuối cùng, ngoài nhóm đáp án.
    const nextButton = Array.from(container.querySelectorAll('button')).at(-1)!
    act(() => {
      nextButton.click()
      nextButton.click()
    })
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(status().textContent).toBe('')
    render(null, 1, { ...question, key: 'two' })
    expect(document.activeElement).toBe(container.querySelector('h2'))
    expect(document.activeElement?.textContent).toContain('Question 2.')
    act(() => option('no').click())
    expect(onPick).toHaveBeenCalledTimes(2)
  })

  it('focuses the option selected with a number key', () => {
    render()
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })))
    expect(onPick).toHaveBeenCalledExactlyOnceWith('yes')
    expect(document.activeElement).toBe(option('yes'))
    expect(status().textContent).toBe('Correct. You selected: yes.')
  })
})

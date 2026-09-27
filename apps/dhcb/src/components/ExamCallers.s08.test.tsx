import { act, StrictMode, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CefrExam from './CefrExam'
import { ListeningTab } from './studyTabs/ListeningTab'
import Placement from '../pages/subjects/english/Placement'
import type ExamQuestionCard from './ExamQuestionCard'
import { ACCENT } from '../lib/cefrAccent'
import { CEFR_LEVELS } from '../data/cefr'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const mocks = vi.hoisted(() => ({
  card: null as ComponentProps<typeof ExamQuestionCard> | null,
  save: vi.fn(async () => ({
    passed: false,
    pct: 0,
    result: { bestPct: 0 },
    correctAnswers: ['yes', 'yes'],
  })),
  placementSave: vi.fn(),
  sound: vi.fn(),
}))
vi.mock('./ExamQuestionCard', () => ({
  default: (props: ComponentProps<typeof ExamQuestionCard>) => {
    mocks.card = props
    return <h2 tabIndex={-1}>Question {props.current + 1}</h2>
  },
}))
vi.mock('./ShareResultCard', () => ({ default: () => null }))
vi.mock('./Layout', () => ({ default: () => null }))
vi.mock('../context/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }))
vi.mock('../lib/placementResult', () => ({
  getPlacementResult: () => null,
  savePlacementResult: mocks.placementSave,
}))
vi.mock('@core/ToastProvider', () => ({ useToast: () => ({ success: vi.fn() }) }))
vi.mock('../lib/tts', () => ({ speak: vi.fn(), stopSpeaking: vi.fn() }))
vi.mock('../lib/haptics', () => ({ haptics: { success: vi.fn() }, vibrate: vi.fn() }))
vi.mock('../lib/sound', () => ({ sound: { correct: mocks.sound, wrong: mocks.sound } }))
vi.mock('../lib/achievements', () => ({
  checkNewAchievements: () => [],
  achievementMessage: vi.fn(),
}))
vi.mock('../data/dialoguesLoader', () => ({ getDialogues: async () => [] }))
vi.mock('../lib/curriculum', () => ({ getLevelWords: () => [] }))
vi.mock('../lib/vocab', () => ({ getLearnedWords: () => new Set() }))
vi.mock('../lib/cefrAssessmentApi', () => ({
  startCefrAssessment: async () => ({
    attemptId: 'attempt-1',
    questions: questions().map(({ key, part, promptKind, prompt, options }) => ({
      key,
      part,
      promptKind,
      prompt,
      options,
    })),
  }),
  submitCefrAssessment: mocks.save,
}))
vi.mock('../lib/progressSync', () => ({ pullProgress: async () => {}, pushProgress: () => {} }))
vi.mock('../lib/cefrExam', async (original) => ({
  ...(await original<typeof import('../lib/cefrExam')>()),
  buildExam: () => questions(),
  buildListeningQuestions: () => questions(),
  levelGrammarSources: () => [],
  saveExamAttempt: mocks.save,
}))
function questions() {
  return [0, 1].map((i) => ({
    key: `q${i}`,
    part: 'vocab',
    promptKind: 'text',
    prompt: 'Test',
    options: ['yes', 'no'],
    correct: 'yes',
  }))
}

describe('S08 caller guards and focus', () => {
  let root: Root, container: HTMLDivElement
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.card = null
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })
  function card() {
    if (!mocks.card) throw new Error('Missing question')
    return mocks.card
  }
  it.each(['exam', 'listening', 'placement'] as const)(
    '%s rejects duplicate/unanswered callbacks and focuses results',
    async (kind) => {
      const entryFocus = document.createElement('button')
      document.body.append(entryFocus)
      entryFocus.focus()
      await act(async () =>
        root.render(
          <StrictMode>
            <MemoryRouter>
              {kind === 'exam' ? (
                <CefrExam
                  uid="u1"
                  isA
                  level={CEFR_LEVELS[0]!}
                  accent={ACCENT.emerald}
                  onClose={() => {}}
                  onOpenLesson={() => {}}
                />
              ) : kind === 'listening' ? (
                <ListeningTab
                  isA
                  levelId="A1"
                  accent={ACCENT.emerald}
                  pool={[]}
                  learned={new Set()}
                  dialogues={[]}
                />
              ) : (
                <Placement />
              )}
            </MemoryRouter>
          </StrictMode>,
        ),
      )
      if (kind === 'placement') {
        const start = [...container.querySelectorAll('button')].find((b) =>
          /Bắt đầu|Start/.test(b.textContent ?? ''),
        )!
        await act(async () => start.click())
      }
      expect(document.activeElement).toBe(entryFocus)
      let rounds = 0
      do {
        const first = card()
        act(() => {
          first.onNext()
          first.onNext()
          first.onPick('invalid')
        })
        expect(card().current).toBe(0)
        expect(card().selected).toBeNull()
        act(() => {
          first.onPick('no')
          first.onPick('yes')
        })
        expect(card().selected).toBe('no')
        const answered = card()
        act(() => {
          answered.onNext()
          answered.onNext()
        })
        expect(card().current).toBe(1)
        expect(card().selected).toBeNull()
        act(() => answered.onNext())
        expect(card().current).toBe(1)
        act(() => card().onPick('no'))
        const last = card()
        await act(async () => {
          last.onNext()
          last.onNext()
        })
        act(() => {
          last.onNext()
          last.onPick('yes')
        })
        rounds++
      } while (kind === 'placement' && !mocks.placementSave.mock.calls.length && rounds < 6)
      expect(document.activeElement?.tagName).toBe('H2')
      expect(container.contains(document.activeElement)).toBe(true)
      if (kind === 'exam')
        expect(mocks.save).toHaveBeenCalledExactlyOnceWith('attempt-1', ['no', 'no'])
      if (kind === 'placement') expect(mocks.placementSave).toHaveBeenCalledTimes(1)
      if (kind === 'listening') expect(mocks.sound).toHaveBeenCalledTimes(2)
      if (kind !== 'placement') {
        const retry = [...container.querySelectorAll('button')].find((b) =>
          /Làm lại|Thi lại/.test(b.textContent ?? ''),
        )!
        await act(async () => retry.click())
        expect(document.activeElement?.textContent).toBe('Question 1')
        expect(card().selected).toBeNull()
        act(() => card().onPick('yes'))
        expect(card().selected).toBe('yes')
      }
      entryFocus.remove()
    },
  )
})

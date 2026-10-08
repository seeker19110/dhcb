// ListeningTab.dictation.test.tsx — "Gõ lại" (chép chính tả) từng chốt danh sách câu lúc mount
// (`useState(() => build…)`): hội thoại về muộn / Thử lại thành công SAU khi đã vào chế độ này thì
// câu hội thoại không vào tới lần vào kế (changelog 0535). Nay nguồn đổi → chỉ NỐI THÊM câu mới,
// không đụng câu đang gõ dở.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import type { Dialogue } from '../../data/dialogues'
import type { DictEntry } from '../../types'
import { ACCENT } from '../../lib/cefrAccent'
import { ListeningTab } from './ListeningTab'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../lib/tts', () => ({ speak: vi.fn(async () => 1), stopSpeaking: vi.fn() }))

const WORDS: DictEntry[] = [
  {
    word: 'hello',
    pos: 'interj',
    vi: 'xin chào',
    ex_en: 'Hello there my friend.',
    ex_vi: 'Chào bạn nhé.',
  },
  {
    word: 'water',
    pos: 'noun',
    vi: 'nước',
    ex_en: 'I drink water every day.',
    ex_vi: 'Tôi uống nước mỗi ngày.',
  },
]

const DIALOGUE: Dialogue = {
  titleVi: 'Chào hỏi',
  titleEn: 'Greetings',
  lines: [
    { who: 'A', en: 'Good morning, how are you?', vi: 'Chào buổi sáng, bạn khoẻ không?' },
    { who: 'B', en: 'I am fine, thank you.', vi: 'Tôi khoẻ, cảm ơn bạn.' },
    { who: 'A', en: 'Nice to see you again.', vi: 'Rất vui được gặp lại bạn.' },
  ],
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function hien(dialogues: Dialogue[]) {
  act(() => {
    root.render(
      <MemoryRouter>
        <ListeningTab
          isA
          levelId="A1"
          accent={ACCENT.emerald}
          pool={WORDS}
          learned={new Set()}
          dialogues={dialogues}
        />
      </MemoryRouter>,
    )
  })
}

const tienDo = () => container.textContent?.match(/Câu (\d+)\/(\d+)/)
const oGo = () => container.querySelector('textarea') as HTMLTextAreaElement

function go(text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  act(() => {
    setter?.call(oGo(), text)
    oGo().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('ListeningTab — Gõ lại: nguồn câu cập nhật khi hội thoại về muộn', () => {
  it('mount 0 hội thoại → nguồn thêm câu: câu mới xuất hiện, câu đang gõ không bị reset', () => {
    hien([])
    act(() => {
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Gõ lại'))
        ?.click()
    })
    expect(tienDo()?.[1]).toBe('1')
    expect(tienDo()?.[2]).toBe('2') // chỉ 2 câu ví dụ từ vựng
    go('Hello there')

    hien([DIALOGUE]) // hội thoại về muộn / Thử lại thành công

    expect(tienDo()?.[1]).toBe('1') // vẫn câu hiện tại
    expect(Number(tienDo()?.[2])).toBeGreaterThan(2) // có thêm câu hội thoại
    expect(oGo().value).toBe('Hello there') // phần đang gõ còn nguyên
  })

  it('nguồn không đổi → danh sách không đổi (không dựng lại, không xáo)', () => {
    hien([DIALOGUE])
    act(() => {
      Array.from(container.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Gõ lại'))
        ?.click()
    })
    const truoc = tienDo()?.[0]
    hien([DIALOGUE])
    expect(tienDo()?.[0]).toBe(truoc)
  })
})

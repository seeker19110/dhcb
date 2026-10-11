// Cổng cho useSessionDone — overlay SessionDone sống qua F5 bằng kết quả THẬT đã nhớ, và
// `?xong=1` mồ côi (link chia sẻ, tab khác) không bao giờ mở một màn mừng rỗng.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useSessionDone, docKetQuaDaNho } from './useSessionDone'
import type { SessionOutcome } from './sessionFact'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const KQ: SessionOutcome = {
  subjectId: 'mathematics',
  contentId: 'toan9-c1-b1',
  kind: 'quiz',
  steps: 4,
  correct: 3,
  total: 4,
  durationSec: 0,
}

type Api = ReturnType<typeof useSessionDone>

describe('useSessionDone', () => {
  let container: HTMLDivElement
  let root: Root
  let api: Api

  function Probe({ k }: { k: string }) {
    api = useSessionDone(k)
    return null
  }

  function mount(k = 'stem:toan9-c1-b1') {
    act(() => root.render(<Probe k={k} />))
  }

  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, '', '/bai')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('open → có outcome + `?xong=1`; close → mất cả hai', () => {
    mount()
    expect(api.outcome).toBeNull()
    act(() => api.open(KQ))
    expect(api.outcome).toEqual(KQ)
    expect(window.location.search).toBe('?xong=1')
    act(() => api.close())
    expect(api.outcome).toBeNull()
    expect(window.location.search).toBe('')
    expect(docKetQuaDaNho('stem:toan9-c1-b1')).toBeNull()
  })

  it('F5 với `?xong=1` + kết quả đã nhớ của ĐÚNG nội dung → mở lại với số liệu cũ', () => {
    mount()
    act(() => api.open(KQ))
    act(() => root.unmount())
    root = createRoot(container)
    mount()
    expect(api.outcome).toEqual(KQ)
  })

  it('`?xong=1` mồ côi (không có kết quả nhớ) → không mở, dọn query', () => {
    window.history.replaceState(null, '', '/bai?xong=1')
    mount()
    expect(api.outcome).toBeNull()
    expect(window.location.search).toBe('')
  })

  it('kết quả nhớ của nội dung KHÁC không mở overlay ở nội dung này', () => {
    mount('stem:a')
    act(() => api.open(KQ))
    act(() => root.unmount())
    root = createRoot(container)
    mount('stem:b')
    expect(api.outcome).toBeNull()
  })

  it('steps = 0 → không mở (chỉ ăn mừng việc đã làm)', () => {
    mount()
    act(() => api.open({ ...KQ, steps: 0 }))
    expect(api.outcome).toBeNull()
    expect(window.location.search).toBe('')
  })

  it('dữ liệu nhớ hỏng → coi như không có', () => {
    sessionStorage.setItem('dhcb_session_done:x', '{hỏng')
    expect(docKetQuaDaNho('x')).toBeNull()
    sessionStorage.setItem('dhcb_session_done:x', JSON.stringify({ steps: 0, kind: 'quiz' }))
    expect(docKetQuaDaNho('x')).toBeNull()
  })

  it('đổi nội dung trong cùng component → overlay nội dung cũ không mang theo', () => {
    mount('stem:a')
    act(() => api.open(KQ))
    mount('stem:b')
    expect(api.outcome).toBeNull()
  })
})

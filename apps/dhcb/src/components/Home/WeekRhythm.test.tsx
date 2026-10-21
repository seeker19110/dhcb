// WeekRhythm.test.tsx — cổng canh DOM của `WeekRhythm` (P1-5, AC-2/AC-3).
//
// AC-3 là BẤT BIẾN sản phẩm: trang chủ KHÔNG BAO GIỜ hiện con số chẩn đoán (%, band CEFR,
// bậc P1-6) — kiểm bằng render THẬT, không đọc mã, vì đây đúng loại lỗi "một PR đổi chữ" có
// thể lọt qua review (xem CLAUDE.md §5 "chống ảo giác" + golden snapshot prompt).
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import WeekRhythm from './WeekRhythm'
import type { WeekRhythmModel } from '../../lib/home/weekRhythm'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

async function render(model: WeekRhythmModel) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(
      <MemoryRouter>
        <WeekRhythm model={model} />
      </MemoryRouter>,
    )
  })
  return container
}

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
})

function model(over: Partial<WeekRhythmModel> = {}): WeekRhythmModel {
  return {
    dots: ['done', 'done', 'missed', 'today-pending', 'future', 'future', 'future'],
    daysDone: 2,
    visible: true,
    ...over,
  }
}

describe('WeekRhythm', () => {
  it('AC-2: đúng 7 phần tử [data-dot], mỗi cái thuộc 4 giá trị hợp lệ', async () => {
    const el = await render(model())
    const dots = el.querySelectorAll('[data-dot]')
    expect(dots.length).toBe(7)
    const allowed = new Set(['done', 'missed', 'today-pending', 'future'])
    dots.forEach((d) => expect(allowed.has(d.getAttribute('data-dot') ?? '')).toBe(true))
  })

  it('AC-2: cụm chấm có mô tả số ngày học, liên kết giữ chữ tóm tắt đang hiện', async () => {
    const el = await render(model({ daysDone: 4 }))
    const link = el.querySelector('a')
    expect(link?.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Tuần này học 4 trên 7 ngày',
    )
    expect(link?.textContent).toContain('Tuần này 4/7 ngày')
  })

  it('hiện dòng nhiệm vụ khi có quests', async () => {
    const el = await render(model({ quests: { done: 1, total: 3 } }))
    expect(el.textContent).toContain('Nhiệm vụ 1/3')
  })

  it('ẩn dòng nhiệm vụ khi quests undefined', async () => {
    const el = await render(model({ quests: undefined }))
    expect(el.textContent).not.toContain('Nhiệm vụ')
  })

  it('hiện huy hiệu mới nhất khi có', async () => {
    const el = await render(model({ latestBadge: { id: 'streak_7', label: 'Chuỗi 7 ngày' } }))
    expect(el.textContent).toContain('Huy hiệu mới: Chuỗi 7 ngày')
  })

  it('ẩn dòng huy hiệu khi không có', async () => {
    const el = await render(model({ latestBadge: undefined }))
    expect(el.textContent).not.toContain('Huy hiệu')
  })

  it('cả khối là một Link tới /nhiem-vu', async () => {
    const el = await render(model())
    const link = el.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/nhiem-vu')
  })

  it('visible=false → không render gì', async () => {
    const el = await render(model({ visible: false }))
    expect(el.innerHTML).toBe('')
  })

  it('AC-3: không có ký tự % trong DOM', async () => {
    const el = await render(
      model({ quests: { done: 1, total: 3 }, latestBadge: { id: 'x', label: 'Huy hiệu X' } }),
    )
    expect(el.textContent).not.toMatch(/%/)
  })

  it('AC-3: không có chuỗi khớp cấp CEFR (A1..C2) hay bậc P1-6', async () => {
    const el = await render(
      model({ quests: { done: 1, total: 3 }, latestBadge: { id: 'x', label: 'Huy hiệu X' } }),
    )
    expect(el.textContent).not.toMatch(/\b[ABC][12]\b/)
    expect(el.textContent).not.toMatch(/\bP[1-6]\b/)
  })
})

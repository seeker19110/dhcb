import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LangProvider } from './LangProvider'
import { useLang } from './useLang'
import { useDocumentLangOverride } from '../lib/documentLang'

// WCAG 3.1.1 Language of Page (audit 2026-09-30, C5): `<html lang>` phải theo ngôn ngữ giao diện
// và đổi ngay khi người dùng đổi; trang cố định một ngôn ngữ (LandingEn) ghi đè khi hiển thị.

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

// Hai nút để test đổi ngôn ngữ qua ĐÚNG API mà giao diện dùng (toggleLang / setLang).
function Probe() {
  const { toggleLang, setLang } = useLang()
  return (
    <>
      <button type="button" data-act="toggle" onClick={toggleLang} />
      <button type="button" data-act="vi" onClick={() => setLang('vi')} />
    </>
  )
}
function EnglishOnlyPage() {
  useDocumentLangOverride('en')
  return null
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  document.documentElement.lang = 'vi'
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

function click(act_: 'toggle' | 'vi'): void {
  const btn = host.querySelector<HTMLButtonElement>(`button[data-act="${act_}"]`)
  if (!btn) throw new Error('chưa dựng LangProvider')
  act(() => btn.click())
}

describe('LangProvider đặt <html lang> theo ngôn ngữ giao diện', () => {
  it('vi → en → vi (toggleLang và setLang)', () => {
    localStorage.setItem('ui_lang', 'vi')
    act(() =>
      root.render(
        <LangProvider>
          <Probe />
        </LangProvider>,
      ),
    )
    expect(document.documentElement.lang).toBe('vi')

    click('toggle')
    expect(document.documentElement.lang).toBe('en')

    click('vi')
    expect(document.documentElement.lang).toBe('vi')
  })

  it('lần đầu chưa có ui_lang mà chiều học là B → trang là en ngay khi dựng', () => {
    localStorage.setItem('et_direction', 'B')
    act(() =>
      root.render(
        <LangProvider>
          <Probe />
        </LangProvider>,
      ),
    )
    expect(document.documentElement.lang).toBe('en')
  })

  it('trang ghi đè (con) thắng ngôn ngữ nền dù effect của cha chạy sau; gỡ trang thì về nền', () => {
    localStorage.setItem('ui_lang', 'vi')
    act(() =>
      root.render(
        <LangProvider>
          <Probe />
          <EnglishOnlyPage />
        </LangProvider>,
      ),
    )
    expect(document.documentElement.lang).toBe('en')

    // Đổi ngôn ngữ giao diện vi → en → vi khi trang ghi đè còn hiện: trang vẫn là en.
    click('toggle')
    expect(document.documentElement.lang).toBe('en')
    click('toggle')
    expect(document.documentElement.lang).toBe('en')

    // Rời trang ghi đè → về ngôn ngữ giao diện.
    act(() =>
      root.render(
        <LangProvider>
          <Probe />
        </LangProvider>,
      ),
    )
    expect(document.documentElement.lang).toBe('vi')
  })
})

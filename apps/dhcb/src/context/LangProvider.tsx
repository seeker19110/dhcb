import { useEffect, useState, type ReactNode } from 'react'
import { LangContext } from './langContext'
import { getUiLang, setUiLang, type UiLang } from '../lib/uiLang'
import { t } from '../i18n'
import { setBaseDocumentLang } from '../lib/documentLang'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<UiLang>(getUiLang)

  // WCAG 3.1.1 (audit C5): `<html lang>` theo ngôn ngữ giao diện, cập nhật mỗi khi đổi — để
  // trình đọc màn hình đọc giao diện tiếng Anh bằng giọng Anh. Trang cố định một ngôn ngữ
  // (LandingEn) ghi đè qua `useDocumentLangOverride`.
  useEffect(() => {
    setBaseDocumentLang(lang)
  }, [lang])

  function toggleLang() {
    const next: UiLang = lang === 'vi' ? 'en' : 'vi'
    setUiLang(next)
    setLang(next)
  }

  function setLangDirect(l: UiLang) {
    setUiLang(l)
    setLang(l)
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, setLang: setLangDirect, T: t[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

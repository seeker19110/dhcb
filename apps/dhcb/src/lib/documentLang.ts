import { useEffect } from 'react'
import type { UiLang } from './uiLang'

// Ngôn ngữ của TRANG (`<html lang>`) — WCAG 3.1.1 Language of Page (audit 2026-09-30, C5).
//
// Trình đọc màn hình chọn giọng + luật phát âm theo `<html lang>`. `index.html` cố định
// `lang="vi"`, nên trước đây người học chiều B (giao diện tiếng Anh) nghe CẢ giao diện bằng giọng
// Việt. Hai nguồn quyết định ngôn ngữ trang:
// 1. Ngôn ngữ giao diện (`ui_lang`) — `LangProvider` đặt làm GIÁ TRỊ NỀN.
// 2. Trang có nội dung cố định một ngôn ngữ (vd `LandingEn` toàn tiếng Anh) — GHI ĐÈ khi đang
//    hiển thị, gỡ khi rời trang.
// Giữ hai nguồn trong một kho nhỏ (thay vì mỗi nơi tự ghi `document.documentElement.lang`) vì
// React chạy effect của CON trước CHA: nếu trang con ghi "en" rồi `LangProvider` (cha) ghi "vi"
// sau, ghi đè của trang sẽ mất. Ở đây giá trị cuối luôn tính lại từ cả hai nguồn, không phụ
// thuộc thứ tự effect.

let baseLang: UiLang = 'vi'
/** Ngăn xếp ghi đè — trang mở sau thắng; gỡ đúng phần tử của mình khi rời trang. */
const overrides: { lang: UiLang }[] = []

function apply(): void {
  if (typeof document === 'undefined') return
  const top = overrides[overrides.length - 1]
  document.documentElement.lang = top ? top.lang : baseLang
}

/** Đặt ngôn ngữ nền của trang theo ngôn ngữ giao diện (gọi từ `LangProvider`). */
export function setBaseDocumentLang(lang: UiLang): void {
  baseLang = lang
  apply()
}

/** Ghi đè ngôn ngữ trang; trả về hàm gỡ ghi đè. */
export function pushDocumentLangOverride(lang: UiLang): () => void {
  const entry = { lang }
  overrides.push(entry)
  apply()
  return () => {
    const i = overrides.indexOf(entry)
    if (i !== -1) overrides.splice(i, 1)
    apply()
  }
}

/** Trang có nội dung cố định một ngôn ngữ gọi hook này để `<html lang>` đúng khi hiển thị. */
export function useDocumentLangOverride(lang: UiLang): void {
  useEffect(() => pushDocumentLangOverride(lang), [lang])
}

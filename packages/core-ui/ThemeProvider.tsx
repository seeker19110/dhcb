import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './themeContext.js'
import { getTheme, applyTheme, setTheme as persistTheme, KID_THEME, type Theme } from './theme.js'

export interface ThemeProviderProps {
  children: ReactNode
  // Khoá cứng theme (ví dụ nhóm tuổi Nhi đồng của app tiếng Anh) — package core-ui KHÔNG tự
  // biết lý do khoá là gì, chỉ nhận cờ true/false từ app gọi. App tự tính giá trị này (đọc
  // auth/onboarding riêng của mình) rồi truyền vào, để core-ui không phụ thuộc ngược vào
  // logic nghiệp vụ của từng môn.
  locked?: boolean
  // true khi app ĐÃ xác định chắc chắn giá trị `locked` (không còn ở trạng thái đang tải dữ
  // liệu quyết định khoá). Mặc định true (app không có bước tải riêng thì luôn coi là đã rõ
  // ngay). Trong lúc chưa rõ (false), hiệu ứng tự-khôi-phục theme thật khi hết bị khoá sẽ
  // KHÔNG chạy — tránh giật theme trước khi biết chắc.
  settled?: boolean
}

export function ThemeProvider({ children, locked = false, settled = true }: ThemeProviderProps) {
  // `theme` = lựa chọn THẬT của user (đọc từ localStorage) — KHÔNG bị ghi đè khi khoá
  // Nhi đồng, nên bỏ khoá là quay lại đúng theme đã chọn (không hề bị mất).
  const [theme, setThemeState] = useState<Theme>(getTheme)

  const setTheme = useCallback(
    (t: Theme) => {
      if (locked) return // Nhi đồng bị khoá cứng — không cho tự đổi qua ThemeToggle
      persistTheme(t) // lưu localStorage + gắn data-theme lên <html>
      setThemeState(t)
    },
    [locked],
  )

  // Theme HIỂN THỊ suy ra từ props (derived state — không setState trong effect,
  // luật react-hooks/set-state-in-effect): bị khoá → luôn "Nhi đồng".
  const effectiveTheme: Theme = locked ? KID_THEME.value : theme

  // Effect chỉ còn đồng bộ DOM (data-theme trên <html>) — CHỦ Ý dùng applyTheme() thay vì
  // persistTheme(): KHÔNG ghi đè localStorage (ui_theme) khi áp theme Nhi đồng.
  // Trong lúc CHƯA rõ có khoá hay không (!settled && !locked) thì không đụng DOM —
  // tránh giật theme trước khi biết chắc (giữ nguyên hành vi cũ).
  useEffect(() => {
    if (!locked && !settled) return
    applyTheme(effectiveTheme)
  }, [effectiveTheme, locked, settled])

  // Giữ nguyên object khi không có gì đổi — tạo object mới mỗi render làm MỌI nơi dùng
  // useTheme() render lại theo (audit 2026-10-10, đợt E4).
  const value = useMemo(
    () => ({ theme: effectiveTheme, setTheme, locked }),
    [effectiveTheme, setTheme, locked],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

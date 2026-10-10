// useIsDesktopViewport — true khi màn hình rộng ≥1024px (khớp breakpoint Tailwind `lg:`).
// Dùng khi PHẢI quyết định bằng JS chứ không chỉ bằng CSS — vd tránh render TRÙNG cùng một
// nội dung ở 2 nơi rồi ẩn bằng class `lg:hidden`/`hidden lg:flex` (ẩn bằng CSS vẫn để nguyên
// text đó trong DOM ở CẢ HAI nơi, khiến trình đọc màn hình/kiểm thử `getByText` thấy 2 phần
// tử trùng — xem Chat.tsx: FeedbackBlock trong Bubble/FeedbackPanel).
import { useState, useEffect } from 'react'

/** Ngưỡng desktop — dùng chung với điều kiện bật bản dựng sẵn trang chủ (lib/guestPrerender.ts). */
export const DESKTOP_VIEWPORT_QUERY = '(min-width: 1024px)'

/**
 * Theo dõi MỘT media query bất kỳ bằng JS. Tách ra từ `useIsDesktopViewport` (2026-09-02)
 * khi cần thêm ngưỡng thứ hai: cùng một cơ chế, chỉ khác chuỗi truy vấn, nên chép lại là
 * nhân đôi chỗ có thể sai (quên `onChange()` lần đầu, quên gỡ listener).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useIsDesktopViewport(): boolean {
  return useMediaQuery(DESKTOP_VIEWPORT_QUERY)
}

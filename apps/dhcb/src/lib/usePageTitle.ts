import { useEffect } from 'react'

/** Tên thương hiệu đứng cuối mọi tiêu đề tab. */
export const BRAND_TITLE = 'Đồng hành cùng bạn'
const BRAND_SUFFIX_RE = /\s*[|·]\s*Đồng hành cùng bạn\s*$/i

/**
 * Đưa mọi tiêu đề trang về MỘT khuôn (audit 2026-09-30 C8 — trước đây lẫn 3 kiểu hậu tố):
 * - `Trang | Đồng hành cùng bạn`
 * - `Trang | Phần · Đồng hành cùng bạn` (khi trang thuộc một môn/phần)
 * Nơi gọi có thể truyền tiêu đề đã kèm hoặc chưa kèm thương hiệu; tiêu đề tiếng Anh có thương hiệu
 * riêng ("Your Companion") thì giữ nguyên.
 */
export function formatPageTitle(title: string): string {
  const trimmed = title.trim()
  if (/your companion\s*$/i.test(trimmed)) return trimmed
  const rest = trimmed.replace(BRAND_SUFFIX_RE, '').trim()
  if (!rest) return BRAND_TITLE
  return rest.includes(' | ') ? `${rest} · ${BRAND_TITLE}` : `${rest} | ${BRAND_TITLE}`
}

/**
 * Đặt document.title riêng cho một trang, trả về tiêu đề gốc khi rời trang.
 *
 * Dự án không dùng react-helmet — mọi trang set title trực tiếp qua document API (xem
 * Landing.tsx). Hook này gom lại logic đó để không lặp cùng một useEffect ở hàng chục trang.
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    const prevTitle = document.title
    document.title = formatPageTitle(title)
    return () => {
      document.title = prevTitle
    }
  }, [title])
}

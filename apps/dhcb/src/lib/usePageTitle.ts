import { useEffect } from 'react'

/** Tên thương hiệu đứng cuối mọi tiêu đề tab. */
export const BRAND_TITLE = 'Đồng Hành Cùng Bạn'
const BRAND_SUFFIX_RE = /\s*[|·]\s*Đồng Hành Cùng Bạn\s*$/i

/**
 * Đưa mọi tiêu đề trang về MỘT khuôn (audit 2026-09-30 C8 — trước đây lẫn 3 kiểu hậu tố):
 * - `Trang | Đồng Hành Cùng Bạn`
 * - `Trang | Phần · Đồng Hành Cùng Bạn` (khi trang thuộc một môn/phần)
 * Nơi gọi có thể truyền tiêu đề đã kèm hoặc chưa kèm thương hiệu. Thương hiệu viết hoa từng chữ
 * và giữ nguyên ở cả giao diện tiếng Anh — cùng tên với header, trang đăng nhập, hub và PWA
 * (chủ dự án chốt 2026-10-06, changelog 0501).
 */
export function formatPageTitle(title: string): string {
  const trimmed = title.trim()
  // Chỉ có tên thương hiệu (trang chủ) — regex hậu tố cần dấu `|`/`·` đứng trước nên không bắt.
  if (trimmed.toLowerCase() === BRAND_TITLE.toLowerCase()) return BRAND_TITLE
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

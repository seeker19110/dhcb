// Khuôn chung cho hai loader "ví dụ phụ" (extra-examples.json, form-examples.json): tải một file
// JSON dạng { từ: [ví dụ 1, ví dụ 2] } bằng fetch().
//
// [changelog 0530] Bản cũ: `fetch(url).then((r) => r.json())` không kiểm `res.ok`, giữ luôn lời hứa
// BỊ TỪ CHỐI trong cache (mạng chập một lần là "Thử lại" vô ích tới khi F5) và cache cả body lỗi
// như dữ liệu. Nay theo đúng khuôn `patterns/loader.ts`: kiểm HTTP + hình dạng, CHỈ giữ cache khi
// thành công, lỗi thì ném để nơi gọi tự quyết (dữ liệu phụ → ẩn phần phụ).
import type { ExPair } from './extra-examples'

export type ExamplesMap = Record<string, [ExPair, ExPair]>

const LOI_DINH_DANG = 'Dữ liệu ví dụ không đúng định dạng — thử lại sau ít phút.'

export function createExamplesLoader(url: string): () => Promise<ExamplesMap> {
  let cached: Promise<ExamplesMap> | null = null
  return () => {
    if (!cached) {
      const pending = (async () => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw = (await res.json()) as unknown
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
          throw new Error(LOI_DINH_DANG)
        }
        return raw as ExamplesMap
      })()
      cached = pending
      // Lỗi → bỏ khỏi cache để lần gọi sau tải lại được (nuốt ở nhánh phụ này, lời hứa gốc vẫn
      // trả cho nơi gọi nên nơi gọi vẫn thấy lỗi).
      pending.catch(() => {
        if (cached === pending) cached = null
      })
    }
    return cached
  }
}

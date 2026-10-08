// apps/dhcb/src/lib/useAsyncLoad.ts — chạy một hàm tải bất đồng bộ và trả trạng thái TÁCH BẠCH
// tải / lỗi / sẵn sàng, kèm `retry`.
//
// Vì sao có file này (changelog 0525): nhiều trang học viết `loadX().then(setY)` không có nhánh
// lỗi. Mạng chập một nhịp là promise reject, state đứng yên ở giá trị ban đầu → skeleton hoặc dòng
// "Đang tải từ vựng…" hiện MÃI, hoặc tệ hơn hiện màn "chưa có gì" như thể dữ liệu không tồn tại
// (CLAUDE.md mục 4.3). Cùng ý với `useCatalogList` nhưng nhận một hàm tải bất kỳ (loader dữ liệu
// tĩnh, API…) thay vì một URL danh mục.
import { useCallback, useEffect, useState } from 'react'
import { thongDiepLoiThanThien, type NgonNgu } from './friendlyError'

export type AsyncLoadState<T> =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T }

export type AsyncLoadOptions = {
  /** Câu hiện khi lỗi không dịch được sang câu thân thiện. */
  errorMessage?: string
  /** Ngôn ngữ câu lỗi — chiều B (giao diện tiếng Anh) truyền 'en'. */
  lang?: NgonNgu
}

const LOADING = { status: 'loading' } as const

/**
 * `loader` PHẢI giữ nguyên tham chiếu giữa các lần render (hàm cấp module, hoặc `useCallback`):
 * đổi tham chiếu = tải lại. Kết quả chỉ được dùng khi còn khớp đúng `loader` + lượt thử hiện tại,
 * nên đổi tham số (vd đổi từ trên URL) hay bấm Thử lại đều quay về 'loading' ngay trong lượt
 * render đó — không cần setState đồng bộ trong effect.
 */
export function useAsyncLoad<T>(loader: () => Promise<T>, options: AsyncLoadOptions = {}) {
  const { errorMessage, lang = 'vi' } = options
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{
    loader: () => Promise<T>
    attempt: number
    state: AsyncLoadState<T>
  } | null>(null)

  useEffect(() => {
    let alive = true
    loader().then(
      (data) => {
        if (alive) setResult({ loader, attempt, state: { status: 'ready', data } })
      },
      (err: unknown) => {
        if (!alive) return
        const message = thongDiepLoiThanThien(err, errorMessage, lang)
        setResult({ loader, attempt, state: { status: 'error', message } })
      },
    )
    return () => {
      alive = false
    }
  }, [loader, attempt, errorMessage, lang])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const state: AsyncLoadState<T> =
    result && result.loader === loader && result.attempt === attempt ? result.state : LOADING

  return { state, retry }
}

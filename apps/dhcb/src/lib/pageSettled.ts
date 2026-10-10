// src/lib/pageSettled.ts — Hoãn một việc NỀN, KHÔNG GẤP tới khi trang đầu đã vẽ xong.
//
// VÌ SAO (đo Lighthouse mobile 2026-10-10, changelog đợt này): việc nền (tải Sentry ~150 KB, tải
// trước 7 trang ~100 chunk, tải zod để dọn nháp) từng chạy ở `requestIdleCallback` ngay lúc khởi
// động — luồng chính "rảnh" trong lúc đang chờ mạng, nên chúng chen băng thông với chính chunk
// trang đang mở và đẩy LCP mobile lên 5,1 s. Chỉ chờ sự kiện `load` cũng KHÔNG đủ: với app một
// trang, `load` bắn ra trước khi chunk trang lười (route) tải xong — đo thật: `load` ở 2,5 s,
// nội dung lớn nhất vẽ ở 4,0 s. Nên chờ thêm SETTLE_DELAY_MS sau `load`, rồi mới đợi lúc rảnh.
//
// KHÔNG kích hoạt sớm theo tương tác đầu tiên (đã thử): cú chạm đầu tiên thường là bấm sang trang
// khác, và lúc đó chunk trang đích lại phải tranh băng thông với ~100 chunk tải trước.

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

// Đủ dài để chunk trang đầu tải + vẽ xong trên mạng di động chậm, đủ ngắn để việc nền vẫn xong
// trước khi người dùng cần tới (vd. bấm sang trang đã được tải trước).
const SETTLE_DELAY_MS = 4000
// Chờ lúc rảnh tối đa bấy nhiêu — máy bận liên tục thì vẫn phải chạy.
const IDLE_TIMEOUT_MS = 3000

/**
 * Chạy `task` khi trang đã ổn định: SETTLE_DELAY_MS sau `load`, rồi tới lúc CPU rảnh.
 * Trả về hàm huỷ — gọi trong cleanup của `useEffect`.
 */
export function runWhenPageSettled(task: () => void): () => void {
  const w = window as IdleWindow
  let cancelled = false
  let idleId: number | undefined
  let settleTimer: ReturnType<typeof setTimeout> | undefined

  const run = () => {
    if (!cancelled) task()
  }
  const onSettled = () => {
    if (cancelled) return
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS })
    else run()
  }
  const onLoad = () => {
    if (!cancelled) settleTimer = setTimeout(onSettled, SETTLE_DELAY_MS)
  }

  if (document.readyState === 'complete') onLoad()
  else window.addEventListener('load', onLoad, { once: true })

  return () => {
    cancelled = true
    window.removeEventListener('load', onLoad)
    if (settleTimer !== undefined) clearTimeout(settleTimer)
    if (idleId !== undefined) w.cancelIdleCallback?.(idleId)
  }
}

// Vòng `requestAnimationFrame` BIẾT ĐIỀU — dùng cho hoạt ảnh trang trí chạy liên tục (avatar
// Bạn Đồng Hành ở `components/Companion3D/CyberTutorAvatar3D.tsx`).
//
// [U6 · M3, 2026-10-05] Audit UI/UX 2026-09-30 mục M3: avatar vẽ lại 60 khung/giây VÔ HẠN (thở,
// liếc, chớp mắt) kể cả khi người dùng bật "giảm chuyển động" ở hệ điều hành (WCAG 2.3.3) và
// kể cả khi tab đã ẩn / avatar đã cuộn khỏi màn hình — tốn pin và CPU vô ích. Hàm này gom ba
// điều kiện dừng vào MỘT chỗ, có test riêng (`motionAwareLoop.test.ts`):
//   1. `prefers-reduced-motion: reduce` → KHÔNG chạy vòng lặp; vẽ ĐÚNG MỘT khung tĩnh.
//   2. Tab ẩn (`document.visibilityState === 'hidden'`) → huỷ khung đang hẹn, chờ tab hiện lại.
//   3. Phần tử ra khỏi khung nhìn (IntersectionObserver, nếu trình duyệt có) → tạm dừng.
// Người dùng đổi tuỳ chọn giảm chuyển động khi trang đang mở thì vòng lặp tự theo (sự kiện
// `change` của MediaQueryList).

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export interface MotionAwareLoopOptions {
  /** Vẽ một khung hình; `now` là mốc thời gian (ms) như `requestAnimationFrame` truyền vào. */
  draw: (now: number) => void
  /** Mốc thời gian dùng cho khung TĨNH khi giảm chuyển động — chọn mốc cho tư thế "nghỉ". */
  staticFrameTime: number
  /** Phần tử để theo dõi có còn trong khung nhìn không (bỏ trống = coi như luôn thấy). */
  target?: Element | null
  /** Tiêm môi trường cho test; mặc định là `window`/`document` thật. */
  win?: Window
  doc?: Document
}

/** Bắt đầu vòng vẽ; trả về hàm dọn dẹp (gọi trong cleanup của effect). */
export function startMotionAwareLoop({
  draw,
  staticFrameTime,
  target,
  win = window,
  doc = document,
}: MotionAwareLoopOptions): () => void {
  // `matchMedia` có thể vắng (môi trường cũ/test) — khi đó coi như KHÔNG giảm chuyển động.
  const motionQuery =
    typeof win.matchMedia === 'function' ? win.matchMedia(REDUCED_MOTION_QUERY) : null
  let frameId: number | null = null
  let inView = true
  let stopped = false

  const reduced = () => motionQuery?.matches === true
  const shouldAnimate = () => !stopped && !reduced() && doc.visibilityState !== 'hidden' && inView

  const tick = (now: number) => {
    frameId = null
    if (!shouldAnimate()) return
    draw(now)
    frameId = win.requestAnimationFrame(tick)
  }

  const cancel = () => {
    if (frameId !== null) {
      win.cancelAnimationFrame(frameId)
      frameId = null
    }
  }

  // Đồng bộ trạng thái vòng lặp với ba điều kiện — gọi lại mỗi khi một điều kiện đổi.
  const sync = () => {
    if (stopped) return
    if (reduced()) {
      cancel()
      draw(staticFrameTime)
      return
    }
    if (shouldAnimate()) {
      if (frameId === null) frameId = win.requestAnimationFrame(tick)
    } else {
      cancel()
    }
  }

  motionQuery?.addEventListener('change', sync)
  doc.addEventListener('visibilitychange', sync)

  let observer: IntersectionObserver | null = null
  const Observer = (win as Window & { IntersectionObserver?: typeof IntersectionObserver })
    .IntersectionObserver
  if (target && typeof Observer === 'function') {
    observer = new Observer((entries) => {
      const last = entries[entries.length - 1]
      if (!last) return
      inView = last.isIntersecting
      sync()
    })
    observer.observe(target)
  }

  sync()

  return () => {
    stopped = true
    cancel()
    motionQuery?.removeEventListener('change', sync)
    doc.removeEventListener('visibilitychange', sync)
    observer?.disconnect()
  }
}

// apps/server/src/dailyJob.ts — Lịch chạy job dọn dẹp "1 lần/ngày" dùng chung (changelog 0545).
//
// Vì sao tách: khuôn cũ (`lastDayRun = hôm nay` rồi chỉ chạy khi SANG ngày mới) bỏ lỡ job nếu
// không tiến trình nào sống qua nửa đêm UTC — vd deploy/khởi động lại PM2 sát nửa đêm mỗi ngày,
// hoặc sập rồi khởi động lại. Ở đây: chạy MỘT lần sau khi khởi động (trễ ngắn, không tranh tài
// nguyên với lúc nhận request đầu), rồi mỗi lần sang ngày mới (UTC). Job dọn đều lũy đẳng nên chạy
// thêm một lần mỗi lần khởi động là vô hại.

export interface DailyJobOptions {
  /** Việc cần chạy. Lỗi được chuyển cho `onError`, không làm sập tiến trình. */
  readonly run: () => Promise<void>
  readonly onError: (err: unknown) => void
  /** Trễ trước lần chạy lúc khởi động (mặc định 60 giây). */
  readonly startupDelayMs?: number
  /** Chu kỳ kiểm "đã sang ngày mới chưa" (mặc định 1 phút). */
  readonly checkIntervalMs?: number
  readonly now?: () => Date
}

export const DEFAULT_STARTUP_DELAY_MS = 60_000
const DEFAULT_CHECK_INTERVAL_MS = 60_000

/** Ngày UTC dạng `YYYY-MM-DD` — so cả năm/tháng, không chỉ ngày trong tháng. */
function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function startDailyJob(options: DailyJobOptions): { stop: () => void } {
  const now = options.now ?? (() => new Date())
  let lastDayRun: string | null = null
  let running = false

  const runOnce = () => {
    // Lần trước chưa xong (CSDL chậm) ⇒ bỏ lượt này, không chạy chồng.
    if (running) return
    running = true
    lastDayRun = utcDay(now())
    void options
      .run()
      .catch(options.onError)
      .finally(() => {
        running = false
      })
  }

  const startup = setTimeout(runOnce, options.startupDelayMs ?? DEFAULT_STARTUP_DELAY_MS)
  const interval = setInterval(() => {
    // Chưa chạy lần khởi động thì để lần đó lo — tránh chạy hai lần trong phút đầu.
    if (lastDayRun === null || utcDay(now()) === lastDayRun) return
    runOnce()
  }, options.checkIntervalMs ?? DEFAULT_CHECK_INTERVAL_MS)
  // Không giữ tiến trình sống chỉ vì job dọn (tắt êm của PM2 không phải chờ).
  startup.unref?.()
  interval.unref?.()

  return {
    stop: () => {
      clearTimeout(startup)
      clearInterval(interval)
    },
  }
}

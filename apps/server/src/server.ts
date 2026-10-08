// server.ts — Express server chạy trên VPS (thay thế Vercel Edge Runtime)
// Bọc lại các handler trong api/*.ts mà không cần sửa logic bên trong.
//
// Cách chạy:
//   Development : npm run dev  (Vite dev server, không dùng file này)
//   Production  : npm start    (file này, chạy qua PM2)

import express from 'express'
import compression from 'compression'
import path from 'node:path'
import * as dotenv from 'dotenv'

// Nạp biến môi trường từ .env — phải chạy trước khi import các handler
// vì handler đọc process.env ngay lúc module load.
// quiet: dotenv 18 mặc định in một dòng "injected env ..." mỗi lần nạp; trên production
// dòng đó chỉ làm bẩn log PM2 nên tắt ở server (script vận hành vẫn để in cho dễ soát).
dotenv.config({ quiet: true })

import { initSentryServer, captureServerException, flushServerSentry } from './api/_lib/sentry.js'
import { installProcessSafetyNet } from './processSafetyNet.js'
import { registerApiRoutes, applyCommonSecurityHeaders } from './routes.js'
import { parseHubHostnames, resolveDistDir } from './staticApps.js'
import { warnIfClusterWithoutRedis, reportRedisStatusAtStartup } from '@dhcb/core-auth/security'

// Bật Sentry (error tracking) — no-op nếu chưa cấu hình SENTRY_DSN (xem api/_lib/sentry.ts).
initSentryServer()

// Lưới an toàn cuối cho promise trôi nổi / lỗi không bắt được (changelog 0528).
installProcessSafetyNet({
  logger: (message, error) => console.error(message, error),
  captureException: captureServerException,
  flush: flushServerSentry,
  exit: (code) => process.exit(code),
})

// Cảnh báo ngay ở log khởi động nếu thiếu REDIS_URL khi chạy dưới PM2 — xem chi tiết
// lý do trong warnIfClusterWithoutRedis() (api/_lib/security.ts).
warnIfClusterWithoutRedis()

import { attachChatWebSocketServer } from '@dhcb/core-chat/wsHandler'
import { attachLocationWebSocketServer } from '@dhcb/core-location/wsLocation'
import { purgeExpiredPositions } from '@dhcb/core-location/locationService'
import { attachGeminiLiveWebSocketServer } from '@dhcb/core-ai/wsGeminiLiveHandler'
import { sendReminders, isLeakedVapidPublicKey } from './api/core/push.js'
import { downgradeExpiredPlans } from './api/_lib/planExpiry.js'
import { purgeOldSyncReceipts } from './api/_lib/syncReceipt.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { sendEmailReminders } from './api/_lib/emailReminders.js'
import { sendWeeklyReports } from './api/_lib/weeklyReportService.js'

const app = express()

// Bỏ header "X-Powered-By: Express" — tránh lộ stack kỹ thuật ra bên ngoài
app.disable('x-powered-by')

// Bật gzip/brotli compression — giảm kích thước response 70% cho Mobile
// threshold: chỉ nén khi response > 1KB (tránh overhead cho response nhỏ)
app.use(compression({ threshold: 1024 }))

// Toàn bộ route API (parser đặc biệt + JSON 64kb + ~100 endpoint) — xem routes.ts (PR-S3).
registerApiRoutes(app)

// Dùng process.cwd() thay vì __dirname (đường dẫn của CHÍNH file server.ts): khi chạy qua
// `tsx` (dev/hiện tại) __dirname = gốc repo, nhưng khi chạy bản đã biên dịch
// (dist-server/server.js — xem tsconfig.server.json) __dirname sẽ trỏ SAI vào dist-server/.
// PM2 luôn set cwd = thư mục chứa ecosystem.config.cjs (gốc repo) ở cả 2 cách chạy nên
// process.cwd() ổn định hơn.
const __dirname = process.cwd()

// ── Security headers cho static files và non-API routes ─────────────────────
app.use((req, res, next) => {
  // Chỉ apply cho non-API routes để tránh double headers
  if (!req.path.startsWith('/api/')) {
    applyCommonSecurityHeaders(res)
  }
  next()
})

// ── Health check ────────────────────────────────────────────────────────────
// Endpoint nhẹ để PM2 / Nginx / uptime monitor kiểm tra app còn sống không.
// Không gọi AI, không đụng DB → trả lời tức thì, không tốn tiền.
app.get('/api/health', (_req, res) => {
  applyCommonSecurityHeaders(res)
  res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() })
})

// ── Phục vụ file upload local (audio cache khi STORAGE_DRIVER=local) ────────
// Nginx cũng có thể serve trực tiếp nhưng Express làm backup nếu cần
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')
app.use(
  '/uploads',
  express.static(uploadsDir, {
    maxAge: '30d',
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public, max-age=2592000')
    },
  }),
)

// ── Phục vụ frontend (React build) — chọn app theo Host header ─────────────
// Một tiến trình Express phục vụ HAI app tĩnh (mức 2 kiến trúc đã chốt, ADR-0001):
//
//   · `dist/` (gốc repo)      — app nền tảng `@dhcb/app`: MẶC ĐỊNH cho mọi host.
//   · `apps/hub/dist/`        — landing giới thiệu nền tảng `@dhcb/hub`: CHỈ cho host trong
//                               HUB_HOSTNAME.
//
// Route /api/* đã xử lý xong ở trên, không đi qua bảng này.
//
// [2026-08-28] Trước đây khối này chỉ có MỘT `express.static(appDistDir)` cho mọi host, trong
// khi comment lại mô tả một cơ chế "chọn app theo Host header" qua biến `EN_VI_HOSTNAME` —
// biến đó KHÔNG hề được đọc ở bất kỳ đâu trong code. Hậu quả: `apps/hub` được build lại mỗi
// lần deploy rồi bỏ đi, không người dùng nào thấy được. Audit toàn diện 2026-08-28 bắt được;
// nay cài đặt THẬT phần định tuyến đó, và chốt bằng test để comment không trôi khỏi code lần
// nữa.
//
// Vì sao mặc định là app nền tảng chứ không phải hub: chọn nhầm phía nào cũng có giá, nhưng
// chọn sai theo hướng "host lạ → app nền tảng" thì người dùng vẫn vào được chỗ họ cần; sai
// theo hướng ngược lại thì domain đang chạy thật mất trắng. Nên hub phải được GỌI TÊN tường
// minh mới nhận, còn lại giữ nguyên hành vi cũ.
const appDistDir = path.join(__dirname, 'dist')
const hubDistDir = path.join(__dirname, 'apps', 'hub', 'dist')

// Host phục vụ landing hub. `req.hostname` của Express đã bỏ cổng sẵn; so khớp không phân biệt
// hoa thường. Logic chọn app + lý do chọn mặc định nằm ở staticApps.ts (có test canh gác).
const HUB_HOSTNAMES = parseHubHostnames(process.env.HUB_HOSTNAME)

function distDirForHost(hostname: string | undefined): string {
  return resolveDistDir({ hostname, hubHostnames: HUB_HOSTNAMES, appDistDir, hubDistDir })
}

function staticCacheHeaders(res: express.Response, filePath: string) {
  // index.html không được cache (luôn fetch mới)
  if (filePath.endsWith('index.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  // File assets có hash (*.js, *.css, images) — cache mãi mãi (immutable).
  else if (/-[A-Za-z0-9_-]{8}\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$/.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  }
  // File khác (manifest, etc) — cache 1 tuần
  else {
    res.setHeader('Cache-Control', 'public, max-age=604800')
  }
  // Thêm charset cho HTML/JSON
  if (filePath.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
  }
}

// Hai handler static dựng SẴN một lần (đừng tạo mới mỗi request — express.static giữ cache
// nội bộ), rồi chọn theo host.
const serveAppStatic = express.static(appDistDir, { maxAge: '1y', setHeaders: staticCacheHeaders })
const serveHubStatic = express.static(hubDistDir, { maxAge: '1y', setHeaders: staticCacheHeaders })

// Phục vụ toàn bộ ứng dụng học tập và Bạn Đồng Hành AI đầy đủ tính năng (hoặc landing hub)
app.use((req, res, next) => {
  if (distDirForHost(req.hostname) === hubDistDir) serveHubStatic(req, res, next)
  else serveAppStatic(req, res, next)
})

// /api/* không khớp route nào ở trên → JSON 404 rõ ràng. Trước đây rơi xuống catch-all
// SPA bên dưới, trả index.html 200 — client tưởng thành công, khó debug
// (vá 2026-08-23, đề xuất N1 mục B6).
// Express 5 (path-to-regexp mới) KHÔNG còn nhận wildcard '*' trần — phải đặt tên cho nó
// ('/api/*splat'). Tên splat chỉ để path-to-regexp gọi phần khớp được, code không dùng tới.
app.all('/api/*splat', (_req, res) => {
  res.status(404).json({ error: 'API route không tồn tại' })
})

// Mọi route client SPA (Toán, Tiếng Anh, Lộ trình, Luyện nói, Đồng Hành, Simulators, v.v.) đều trả index.html đầy đủ
// '/{*splat}' = khớp MỌI đường dẫn kể cả '/' (dấu {} làm phần splat thành tùy chọn). Viết
// '/*splat' sẽ KHÔNG khớp trang gốc '/' — trang chủ trả 404, xem changelog đợt nâng Express 5.
app.get('/{*splat}', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.sendFile(path.join(distDirForHost(req.hostname), 'index.html'))
})

// ── Bộ hẹn giờ nhắc học (web push) ───────────────────────────────────────────
// Mỗi khi sang một GIỜ mới (UTC), gửi nhắc cho những người đã hẹn nhắc vào giờ đó
// mà HÔM NAY CHƯA HỌC (giữ streak). Chạy ngay trong tiến trình server, không cần cron ngoài.
// Lưu ý: nếu chạy PM2 cluster nhiều instance, đặt REMINDER_SCHEDULER=off ở các instance
// phụ để tránh gửi trùng (mặc định bật).
function startReminderScheduler() {
  if (process.env.REMINDER_SCHEDULER === 'off') {
    console.log('   Nhắc học : tắt (REMINDER_SCHEDULER=off)')
    return
  }

  const hasPushConfig = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  if (!hasPushConfig) {
    console.log('   Nhắc học Web Push : tắt (chưa cấu hình VAPID keys)')
  } else {
    console.log('   Nhắc học Web Push : bật (gửi đúng giờ mỗi người chọn)')
    if (isLeakedVapidPublicKey(process.env.VAPID_PUBLIC_KEY)) {
      console.error(
        '🔴 [security] VAPID key đang dùng là cặp khoá ĐÃ LỘ trong lịch sử git public. ' +
          'Tạo cặp mới và thay VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY trong .env (docs/changelog/0465).',
      )
      captureServerException(new Error('VAPID key đã lộ vẫn đang được dùng'), {
        context: 'vapid-leaked-key',
      })
    }
  }

  // Khởi tạo = giờ hiện tại để BỎ QUA phần giờ dở dang lúc server vừa bật
  // (tránh gửi nhắc trễ giữa giờ); bắt đầu gửi từ đầu giờ kế tiếp.
  let lastHourSent = new Date().getUTCHours()
  setInterval(() => {
    const hour = new Date().getUTCHours()
    if (hour === lastHourSent) return
    lastHourSent = hour

    // 1. Gửi Web Push reminders nếu có cấu hình
    if (hasPushConfig) {
      void sendReminders(hour)
        .then((r) => {
          if (r.sent || r.skipped)
            console.log(
              `[reminder:push] ${hour}h UTC → gửi ${r.sent}, bỏ qua ${r.skipped} (đã học)`,
            )
        })
        .catch((err) => {
          console.error('[reminder:push] lỗi gửi nhắc:', err)
          captureServerException(err, { context: 'reminder-scheduler-push', hour })
        })
    }

    // 2. Gửi Smart Email Reminders một lần mỗi ngày lúc 13h UTC (20h Việt Nam)
    if (hour === 13) {
      void sendEmailReminders()
        .then((r) => {
          if (r.sent || r.skipped)
            console.log(
              `[reminder:email] Gửi xong email nhắc học: ${r.sent} gửi, ${r.skipped} bỏ qua`,
            )
        })
        .catch((err) => {
          console.error('[reminder:email] lỗi gửi email nhắc:', err)
          captureServerException(err, { context: 'reminder-scheduler-email' })
        })
    }
  }, 60_000) // kiểm tra mỗi phút, gửi 1 lần khi sang giờ mới
}

// ── Báo cáo tuần cho "Người thân theo dõi" (chủ nhật 19h giờ VN) ─────────────
// Đặc tả: docs/research/dac-ta-nguoi-dong-hanh-2026-08-26.md (mục 6). Chọn tối chủ nhật vì đó là
// lúc gia đình có mặt ở nhà và tuần mới chưa bắt đầu — báo cáo còn kịp đổi được điều gì đó.
// 19h VN = 12h UTC. Chống gửi trùng KHÔNG dựa vào bộ hẹn giờ này (server restart là chạy lại):
// `claimDueLinks()` giành việc bằng chính câu UPDATE — xem weeklyReportService.ts.
function startWeeklyReportScheduler() {
  let lastRunHour = -1
  setInterval(() => {
    const now = new Date()
    // getUTCDay(): 0 = chủ nhật. 12h UTC chủ nhật = 19h VN chủ nhật (VN không có giờ mùa hè).
    if (now.getUTCDay() !== 0 || now.getUTCHours() !== 12) return
    if (lastRunHour === now.getUTCHours()) return
    lastRunHour = now.getUTCHours()

    void sendWeeklyReports(now)
      .then((r) => {
        if (r.sent || r.skipped) console.log(`[weekly-report] gửi ${r.sent}, bỏ qua ${r.skipped}`)
      })
      .catch((err) => {
        console.error('[weekly-report] lỗi gửi báo cáo tuần:', err)
        captureServerException(err, { context: 'weekly-report-scheduler' })
      })
  }, 60_000)
}

// ── Dọn gói VIP hết hạn (1 lần/ngày) ─────────────────────────────────────
// Chỉ dọn dữ liệu cho ĐÚNG (cột `plan` trong DB) — việc CHẶN quyền hết hạn đã tự áp ngay lúc
// đọc plan (resolvePlan trong api/_lib/plan.ts), không phụ thuộc job này chạy đúng giờ hay không.
function startPlanExpiryScheduler() {
  let lastDaySent = new Date().getUTCDate()
  setInterval(() => {
    const day = new Date().getUTCDate()
    if (day === lastDaySent) return
    lastDaySent = day
    void downgradeExpiredPlans()
      .then((r) => {
        if (r.downgraded > 0) console.log(`[plan-expiry] Đã hạ ${r.downgraded} gói hết hạn về free`)
      })
      .catch((err) => {
        console.error('[plan-expiry] lỗi dọn gói hết hạn:', err)
        captureServerException(err, { context: 'plan-expiry-scheduler' })
      })
  }, 60_000) // kiểm tra mỗi phút, chạy 1 lần khi sang ngày mới (UTC)
}

// ── Dọn biên nhận đồng bộ quá 7 ngày (1 lần/ngày) ───────────────────────────
// Mỗi lần gửi tiến độ có `attemptId` ghi 1 dòng `public.sync_receipts`. Biên nhận chỉ cần sống
// đủ lâu để một thiết bị offline vài ngày gửi lại mà không bị tính hai lần — giữ lâu hơn chỉ
// làm bảng phình. Xem apps/server/src/api/_lib/syncReceipt.ts (slice S09-1).
function startSyncReceiptCleanup() {
  let lastDayRun = new Date().getUTCDate()
  setInterval(() => {
    const day = new Date().getUTCDate()
    if (day === lastDayRun) return
    lastDayRun = day
    void purgeOldSyncReceipts(getPgPool())
      .then((r) => {
        if (r.deleted > 0) console.log(`[sync-receipts] Đã dọn ${r.deleted} biên nhận quá hạn`)
      })
      .catch((err) => {
        console.error('[sync-receipts] lỗi dọn biên nhận:', err)
        captureServerException(err, { context: 'sync-receipt-cleanup' })
      })
  }, 60_000) // kiểm tra mỗi phút, chạy 1 lần khi sang ngày mới (UTC)
}

// ── Dọn vị trí của chuyến "Đi chung" đã hết hạn (mỗi 15 phút) ───────────────
// Vị trí là dữ liệu nhạy cảm nhất trong app: chuyến hết hạn/kết thúc thì toạ độ phải biến mất
// mà không cần ai bấm nút. Xem packages/core-location/locationService.ts#purgeExpiredPositions.
function startLocationPurgeScheduler() {
  setInterval(() => {
    void purgeExpiredPositions()
      .then((deleted) => {
        if (deleted > 0) console.log(`[location-purge] Đã xoá ${deleted} vị trí của chuyến hết hạn`)
      })
      .catch((err) => {
        console.error('[location-purge] lỗi dọn vị trí hết hạn:', err)
        captureServerException(err, { context: 'location-purge-scheduler' })
      })
  }, 15 * 60_000)
}

// ── Khởi động ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`✅ Đồng Hành Cùng Bạn (DHCB) đang chạy tại http://localhost:${PORT}`)
  console.log(`   NODE_ENV : ${process.env.NODE_ENV || 'production'}`)
  console.log(`   Node.js  : ${process.version}`)
  // PM2 cluster: chỉ instance 0 chạy scheduler — trước đây CẢ 3 instance cùng chạy nên
  // push/email nhắc học gửi 3 lần/người và downgradeExpiredPlans() chạy 3 lần
  // (vá 2026-08-23, đề xuất N1 mục B5). Chạy ngoài PM2 thì biến không tồn tại → vẫn chạy.
  const pm2Instance = process.env.NODE_APP_INSTANCE
  if (pm2Instance === undefined || pm2Instance === '0') {
    startReminderScheduler()
    startPlanExpiryScheduler()
    startSyncReceiptCleanup()
    startLocationPurgeScheduler()
    startWeeklyReportScheduler()
    // Kiểm Redis CHỈ ở instance 0: cấu hình REDIS_URL giống hệt nhau ở mọi instance nên một
    // lần là đủ, in 3 lần chỉ làm rối log. Không await — đo đạc không được làm chậm khởi động.
    void reportRedisStatusAtStartup()
  } else {
    console.log(`   Scheduler: tắt ở instance ${pm2Instance} (chỉ instance 0 chạy)`)
  }
  // Báo PM2 là app ĐÃ nhận request được (đi với wait_ready trong ecosystem.config.cjs).
  // Khi reload, PM2 đợi tín hiệu này từ process MỚI rồi mới tắt process CŨ → không có
  // khoảng chết. Chạy ngoài PM2 (npm start tay) thì process.send không tồn tại → bỏ qua.
  process.send?.('ready')
})

// WebSocket chat gắn vào CHÍNH http.Server này (không mở cổng riêng) — xem
// packages/core-chat/wsHandler.ts.
attachChatWebSocketServer(server)
attachLocationWebSocketServer(server)
attachGeminiLiveWebSocketServer(server)

// Tắt êm (graceful shutdown): PM2 gửi SIGINT khi stop/reload. Ngừng nhận kết nối mới,
// đóng ngay kết nối keep-alive đang rảnh, chờ request đang chạy xong rồi thoát.
// Quá 5s chưa xong thì thoát luôn (PM2 còn kill_timeout để SIGKILL nếu process kẹt).
function shutdown() {
  server.close(() => process.exit(0))
  server.closeIdleConnections()
  setTimeout(() => process.exit(0), 5000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

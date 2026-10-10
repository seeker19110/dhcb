// runnerHost.ts — Phục vụ trang chạy code học viên ở origin riêng `run.donghanhcungban.org`.
//
// Đặc tả: docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md (R1). Code học viên chạy
// trong Worker sinh từ trang `runner.html` ở origin này — khác origin app nên KHÔNG đọc được
// localStorage/token/cookie của app. Vì vậy host runner phải "nghèo" nhất có thể:
//   · chỉ GET/HEAD;
//   · chỉ một danh sách file tĩnh cố định (runner.html, preview.html, JS/asset đã build, Pyodide,
//     sql.js) — KHÔNG /api, KHÔNG SPA fallback, mọi thứ khác 404;
//   · CSP riêng: được `'unsafe-eval'`/`'wasm-unsafe-eval'` (bản chất của chạy code) nhưng chỉ
//     nhúng được bởi origin app (`frame-ancestors`), không gửi đi đâu ngoài chính nó.
// Ngược lại, host app KHÔNG phục vụ runner.html/preview.html — chạy chúng cùng origin app thì
// mất hết ý nghĩa cách ly.
//
// Tách khỏi server.ts (giống staticApps.ts) vì server.ts gọi `app.listen()` lúc import → không
// test được; ở đây là hàm thuần + middleware nhận phụ thuộc bơm vào.

import type { NextFunction, Request, Response } from 'express'
import { HSTS_VALUE, PERMISSIONS_POLICY } from '@dhcb/core-auth/security'

/** Host mặc định của runner (chốt Q1 đặc tả). Đổi qua `RUNNER_HOSTNAME` (nhiều host: dấu phẩy). */
export function parseRunnerHostnames(raw: string | undefined): string[] {
  return (raw ?? 'run.donghanhcungban.org')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
}

// Tên file: không bắt đầu bằng dấu chấm, không có `/` → không lọt ra ngoài thư mục, không chạm
// file ẩn. express.static vẫn tự chặn `..`, đây là lớp thứ hai.
const FILE = '[A-Za-z0-9_-][A-Za-z0-9._-]*'
const RUNNER_ASSET_PATHS: readonly RegExp[] = [
  /^\/(runner|preview)\.html$/,
  new RegExp(`^/(js|assets)/${FILE}$`),
  new RegExp(`^/pyodide/${FILE}$`),
  /^\/sqljs\/sql-wasm\.wasm$/,
]

/** Hai trang chỉ được phục vụ ở host runner. */
const RUNNER_PAGES = new Set(['/runner.html', '/preview.html'])

export function isRunnerAssetPath(path: string): boolean {
  return RUNNER_ASSET_PATHS.some((re) => re.test(path))
}

/**
 * CSP của host runner. `frameAncestors` = danh sách origin app (ALLOWED_ORIGINS); `null` ở dev
 * → cho localhost/127.0.0.1 mọi cổng.
 *
 * `'unsafe-inline'` cần cho preview.html (script inline tự giải mã trang học viên rồi
 * `document.write`) và cho chính trang HTML học viên viết; `'unsafe-eval'` + `'wasm-unsafe-eval'`
 * cho jsWorker (`new Function`) và Pyodide/sql.js (WebAssembly + EM_ASM). Đây là lý do tách
 * origin: các quyền này nằm ở đây thay vì ở app.
 */
export function buildRunnerCsp(frameAncestors: string[] | null): string {
  const ancestors =
    frameAncestors && frameAncestors.length > 0
      ? frameAncestors.join(' ')
      : "'self' http://localhost:* http://127.0.0.1:*"
  return [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
    "worker-src 'self'",
    "connect-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // Học viên được chèn ảnh ngoài trong bài HTML (giữ hành vi cũ của khung xem trước).
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `frame-ancestors ${ancestors}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')
}

export function applyRunnerSecurityHeaders(res: Response, csp: string): void {
  res.setHeader('Content-Security-Policy', csp)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Strict-Transport-Security', HSTS_VALUE)
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY)
  // Xin trình duyệt cho origin này một agent cluster riêng (tiến trình riêng khi có thể).
  res.setHeader('Origin-Agent-Cluster', '?1')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  // KHÔNG đặt X-Frame-Options: trang này SINH RA để được app (origin khác) nhúng; quyền nhúng
  // do `frame-ancestors` quyết.
}

export interface RunnerHostOptions {
  runnerHostnames: string[]
  frameAncestors: string[] | null
  /** express.static trỏ vào thư mục build app (`dist/`). */
  serveStatic: (req: Request, res: Response, next: NextFunction) => void
}

/**
 * Middleware đặt TRƯỚC mọi route khác (kể cả /api): host runner được trả lời trọn ở đây, không
 * bao giờ đi tiếp xuống API/SPA; host khác chỉ bị chặn hai trang runner rồi đi tiếp.
 */
export function createRunnerHostMiddleware(opts: RunnerHostOptions) {
  const csp = buildRunnerCsp(opts.frameAncestors)
  const notFound = (res: Response) => res.status(404).type('text/plain').send('Not found')

  return (req: Request, res: Response, next: NextFunction): void => {
    const isRunnerHost = opts.runnerHostnames.includes((req.hostname ?? '').toLowerCase())
    if (!isRunnerHost) {
      if (RUNNER_PAGES.has(req.path)) {
        notFound(res)
        return
      }
      next()
      return
    }

    applyRunnerSecurityHeaders(res, csp)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD')
      res.status(405).type('text/plain').send('Method not allowed')
      return
    }
    if (!isRunnerAssetPath(req.path)) {
      notFound(res)
      return
    }
    // File không có trên đĩa → express.static gọi next(); chặn ở đây để không rơi xuống SPA.
    opts.serveStatic(req, res, () => notFound(res))
  }
}

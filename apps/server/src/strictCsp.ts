// strictCsp.ts — CSP CHẶT cho trang app + hub (bước R3 của đặc tả
// docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md).
//
// Khác CSP đang enforce (`buildAppCsp` trong routes.ts) ở ba chỗ:
//   · script-src KHÔNG có 'unsafe-inline' / 'unsafe-eval' — code học viên đã chạy ở origin runner
//     (R2), nên trang chính không còn cần hai quyền này. Script inline của `index.html` (chống
//     nháy theme, cổng trang chủ dựng sẵn, bộ nạp chunk) được phép bằng băm sha256 TÍNH LÚC SERVER
//     KHỞI ĐỘNG từ đúng file đã build — sửa script không thể quên cập nhật băm.
//   · bỏ 3 nguồn SDK đăng nhập không giao diện nào gọi (Facebook/Apple/Microsoft — Q4 đặc tả).
//   · có `report-uri`/`report-to` gửi vi phạm về Sentry.
// R3 gửi nó ở dạng `Content-Security-Policy-Report-Only` (chỉ báo, không chặn) song song CSP cũ;
// R4 mới bật thật sau 7 ngày không có vi phạm thật.
//
// Hàm thuần + test riêng (server.ts gọi app.listen() lúc import nên không test được).

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** Tên endpoint trong header `Reporting-Endpoints` mà directive `report-to` trỏ tới. */
export const CSP_REPORT_GROUP = 'csp-endpoint'

/** `<script>` KHÔNG chạy được (dữ liệu) — CSP không áp lên chúng nên không cần băm. */
const NON_EXECUTABLE_TYPE = /^(application\/(ld\+)?json|importmap|speculationrules|text\/plain)$/i

/**
 * Băm `'sha256-…'` của mọi script inline CHẠY ĐƯỢC trong một trang HTML. Băm đúng chuỗi byte
 * giữa `<script …>` và `</script>` (nội dung script là "raw text", không giải mã thực thể) — y
 * như trình duyệt băm.
 */
export function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>()
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = m[1] ?? ''
    const body = m[2] ?? ''
    if (/\bsrc\s*=/i.test(attrs)) continue
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]
    if (type && NON_EXECUTABLE_TYPE.test(type)) continue
    if (body.length === 0) continue
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
  return [...hashes]
}

/** Băm script inline của `<distDir>/index.html`; chưa build (dev qua tsx) thì danh sách rỗng. */
export function inlineScriptHashesOfBuild(distDir: string): string[] {
  const file = path.join(distDir, 'index.html')
  return existsSync(file) ? inlineScriptHashes(readFileSync(file, 'utf8')) : []
}

/**
 * Địa chỉ nhận báo cáo CSP của Sentry, suy ra từ DSN `https://<key>@<host>[/<đường>]/<project>`
 * → `https://<host>[/<đường>]/api/<project>/security/?sentry_key=<key>`. DSN thiếu/sai → `null`.
 */
export function sentryCspReportUri(dsn: string | undefined): string | null {
  if (!dsn) return null
  try {
    const url = new URL(dsn)
    const segments = url.pathname.split('/').filter(Boolean)
    const project = segments.pop()
    if (!url.username || !project || !/^\d+$/.test(project)) return null
    const prefix = segments.length > 0 ? `/${segments.join('/')}` : ''
    return `${url.protocol}//${url.host}${prefix}/api/${project}/security/?sentry_key=${encodeURIComponent(url.username)}`
  } catch {
    return null
  }
}

export interface StrictCspOptions {
  scriptHashes: readonly string[]
  runnerOrigins: readonly string[]
  reportUri: string | null
}

export function buildStrictCsp({
  scriptHashes,
  runnerOrigins,
  reportUri,
}: StrictCspOptions): string {
  const directives = [
    "default-src 'self'",
    [
      "script-src 'self'",
      ...scriptHashes,
      // Beacon Cloudflare tự chèn khi bật proxy + Google Identity Services (đăng nhập Google).
      'https://static.cloudflareinsights.com',
      'https://accounts.google.com',
    ].join(' '),
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "font-src 'self' data:",
    "img-src 'self' data: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https:",
    ['frame-src https://accounts.google.com', ...runnerOrigins].join(' '),
    // Service worker /sw.js ở origin chính; Worker chạy code học viên đã sang origin runner.
    "worker-src 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
  if (reportUri) directives.push(`report-uri ${reportUri}`, `report-to ${CSP_REPORT_GROUP}`)
  return directives.join('; ')
}

/** Header `Reporting-Endpoints` đi kèm `report-to` (trình duyệt mới dùng nó, bỏ `report-uri`). */
export function reportingEndpointsHeader(reportUri: string | null): string | null {
  return reportUri ? `${CSP_REPORT_GROUP}="${reportUri}"` : null
}

/** `CSP_MODE`: `report-only` (mặc định R3) gửi thêm CSP chặt dạng chỉ báo; `legacy` tắt hẳn. */
export type CspMode = 'legacy' | 'report-only'

export function parseCspMode(raw: string | undefined): CspMode {
  return raw?.trim().toLowerCase() === 'legacy' ? 'legacy' : 'report-only'
}

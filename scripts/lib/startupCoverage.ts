// scripts/lib/startupCoverage.ts — Logic THUẦN cho `scripts/check-startup-coverage.ts`.
//
// Vì sao (audit 2026-10-10, đợt E5): mục "Initial JS" của `.size-limit.json` liệt kê chunk khởi
// động bằng GLOB TĨNH theo tên module. Cách chia chunk đổi là danh sách lệch âm thầm — đợt E4 vừa
// làm `appSettings` rời đường khởi động và sinh chunk mới `localJson`; trước đó (changelog 0580)
// `vendor-zod` được `modulepreload` mà size-limit không đếm. Phép kiểm này đọc `dist/index.html`
// thật và báo mọi file JS tải ngay mà không glob nào khớp.

/** Mọi file JS trình duyệt tải ngay khi mở trang: `<script type="module" src>` + `modulepreload`. */
export function startupScripts(html: string): string[] {
  const out = new Set<string>()
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"/g)) out.add(m[1]!)
  for (const m of html.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*>/g)) {
    const href = /\bhref="([^"]+\.js)"/.exec(m[0])
    if (href) out.add(href[1]!)
  }
  return [...out].map((p) => p.replace(/^\//, '')).sort()
}

/** Glob kiểu size-limit đơn giản (`*` không vượt qua `/`) → RegExp khớp cả chuỗi. */
export function globToRegExp(glob: string): RegExp {
  const src = glob
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*')
  return new RegExp(`^${src}$`)
}

/** File khởi động (đường dẫn tính từ gốc repo, vd `dist/js/x.js`) KHÔNG khớp glob nào. */
export function uncoveredStartupFiles(
  files: readonly string[],
  globs: readonly string[],
): string[] {
  const res = globs.map(globToRegExp)
  return files.filter((f) => !res.some((re) => re.test(f)))
}

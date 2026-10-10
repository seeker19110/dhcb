// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  buildStrictCsp,
  inlineScriptHashes,
  inlineScriptHashesOfBuild,
  parseCspMode,
  reportingEndpointsHeader,
  sentryCspReportUri,
} from './strictCsp.js'

// Ví dụ chuẩn của MDN (Content-Security-Policy › script-src › hash).
const MDN_HASH = "'sha256-qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng='"

describe('inlineScriptHashes', () => {
  it('băm đúng chuẩn trình duyệt (ví dụ MDN)', () => {
    expect(inlineScriptHashes("<script>alert('Hello, world.');</script>")).toEqual([MDN_HASH])
  })

  it('bỏ script có src, script dữ liệu (ld+json…), script rỗng; gộp trùng', () => {
    const html = `
      <script type="module" src="/js/index.js"></script>
      <script type="application/ld+json">{"@type":"WebApplication"}</script>
      <script type="importmap">{}</script>
      <script></script>
      <script>alert('Hello, world.');</script>
      <SCRIPT type="text/javascript">alert('Hello, world.');</SCRIPT>
      <script type="module">import('/js/x.js')</script>`
    const hashes = inlineScriptHashes(html)
    expect(hashes).toHaveLength(2)
    expect(hashes[0]).toBe(MDN_HASH)
  })

  it('giữ nguyên khoảng trắng — đổi một dấu cách là băm khác', () => {
    const [a] = inlineScriptHashes('<script>x()</script>')
    const [b] = inlineScriptHashes('<script> x()</script>')
    expect(a).not.toBe(b)
  })

  it('đọc từ index.html đã build; chưa build thì rỗng', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'csp-dist-'))
    try {
      expect(inlineScriptHashesOfBuild(dir)).toEqual([])
      writeFileSync(path.join(dir, 'index.html'), "<script>alert('Hello, world.');</script>")
      expect(inlineScriptHashesOfBuild(dir)).toEqual([MDN_HASH])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('sentryCspReportUri', () => {
  it('suy ra endpoint security của Sentry từ DSN', () => {
    expect(sentryCspReportUri('https://abc123@o42.ingest.sentry.io/4507')).toBe(
      'https://o42.ingest.sentry.io/api/4507/security/?sentry_key=abc123',
    )
    expect(sentryCspReportUri('https://k@sentry.vi-du.org/duong/7')).toBe(
      'https://sentry.vi-du.org/duong/api/7/security/?sentry_key=k',
    )
  })

  it('DSN thiếu/sai → null', () => {
    for (const dsn of [
      undefined,
      '',
      'khong-phai-url',
      'https://o42.ingest.sentry.io/4507',
      'https://k@host/',
    ]) {
      expect(sentryCspReportUri(dsn), String(dsn)).toBeNull()
    }
  })
})

describe('buildStrictCsp', () => {
  const csp = buildStrictCsp({
    scriptHashes: [MDN_HASH],
    runnerOrigins: ['https://run.donghanhcungban.org'],
    reportUri: 'https://o1.ingest.sentry.io/api/2/security/?sentry_key=k',
  })
  const directive = (name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `))

  it('script-src KHÔNG có unsafe-inline/unsafe-eval, có băm + Google + Cloudflare', () => {
    expect(directive('script-src')).toBe(
      `script-src 'self' ${MDN_HASH} https://static.cloudflareinsights.com https://accounts.google.com`,
    )
    expect(csp).not.toContain("'unsafe-eval'")
  })

  it('gỡ 3 SDK đăng nhập không dùng (Q4)', () => {
    for (const host of ['connect.facebook.net', 'appleid.cdn-apple.com', 'alcdn.msauth.net']) {
      expect(csp).not.toContain(host)
    }
  })

  it('cho iframe runner + Google; báo cáo về Sentry', () => {
    expect(directive('frame-src')).toBe(
      'frame-src https://accounts.google.com https://run.donghanhcungban.org',
    )
    expect(directive('report-uri')).toBe(
      'report-uri https://o1.ingest.sentry.io/api/2/security/?sentry_key=k',
    )
    expect(directive('report-to')).toBe('report-to csp-endpoint')
  })

  it('không có Sentry thì không có directive báo cáo', () => {
    const plain = buildStrictCsp({ scriptHashes: [], runnerOrigins: [], reportUri: null })
    expect(plain).not.toContain('report-')
    expect(reportingEndpointsHeader(null)).toBeNull()
    expect(reportingEndpointsHeader('https://x/y')).toBe('csp-endpoint="https://x/y"')
  })
})

describe('parseCspMode', () => {
  it('mặc định report-only; chỉ "legacy" tắt', () => {
    expect(parseCspMode(undefined)).toBe('report-only')
    expect(parseCspMode('')).toBe('report-only')
    expect(parseCspMode(' Legacy ')).toBe('legacy')
    expect(parseCspMode('strict')).toBe('report-only')
  })
})

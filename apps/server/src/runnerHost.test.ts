// @vitest-environment node
// Chạy express THẬT + express.static THẬT trên thư mục tạm: thứ cần canh là cả chuỗi
// "host → danh sách trắng → file tĩnh → không rơi xuống SPA/API", không chỉ từng hàm.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import express from 'express'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { request, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import {
  buildRunnerCsp,
  createRunnerHostMiddleware,
  isRunnerAssetPath,
  parseRunnerHostnames,
} from './runnerHost.js'

const APP_ORIGIN = 'https://en-vi.donghanhcungban.org'
const RUN_HOST = 'run.donghanhcungban.org'

describe('parseRunnerHostnames', () => {
  it('mặc định run.donghanhcungban.org; nhận nhiều host, chuẩn hoá, bỏ rỗng', () => {
    expect(parseRunnerHostnames(undefined)).toEqual([RUN_HOST])
    expect(parseRunnerHostnames(' Run.A.org, ,run.b.org ')).toEqual(['run.a.org', 'run.b.org'])
  })
})

describe('isRunnerAssetPath', () => {
  it('chỉ nhận danh sách trắng', () => {
    for (const ok of [
      '/runner.html',
      '/preview.html',
      '/js/runner-Ca3Jj-wB.js',
      '/assets/jsWorker-BQUcXpk0.js',
      '/pyodide/pyodide.asm.wasm',
      '/sqljs/sql-wasm.wasm',
    ]) {
      expect(isRunnerAssetPath(ok), ok).toBe(true)
    }
    for (const bad of [
      '/',
      '/index.html',
      '/api/health',
      '/api/auth/me',
      '/uploads/a.mp3',
      '/js/.env',
      '/js/a/b.js',
      '/js/../index.html',
      '/sqljs/other.wasm',
      '/sw.js',
      '/data/dictionary/chunk-1.json',
    ]) {
      expect(isRunnerAssetPath(bad), bad).toBe(false)
    }
  })
})

describe('buildRunnerCsp', () => {
  it('frame-ancestors = đúng danh sách origin app; không mở connect ra ngoài', () => {
    const csp = buildRunnerCsp([APP_ORIGIN, 'https://www.donghanhcungban.org'])
    expect(csp).toContain(`frame-ancestors ${APP_ORIGIN} https://www.donghanhcungban.org`)
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).toContain("'wasm-unsafe-eval'")
    expect(csp).not.toMatch(/frame-ancestors[^;]*\*(?!:)/)
  })

  it('dev (không có danh sách) → chỉ localhost', () => {
    expect(buildRunnerCsp(null)).toContain(
      "frame-ancestors 'self' http://localhost:* http://127.0.0.1:*",
    )
  })
})

describe('createRunnerHostMiddleware (express thật)', () => {
  let server: Server
  let base: string
  let distDir: string

  beforeAll(async () => {
    distDir = mkdtempSync(path.join(tmpdir(), 'runner-dist-'))
    mkdirSync(path.join(distDir, 'js'))
    writeFileSync(path.join(distDir, 'runner.html'), '<!doctype html><p>runner</p>')
    writeFileSync(path.join(distDir, 'index.html'), '<!doctype html><p>app</p>')
    writeFileSync(path.join(distDir, 'js', 'runner-abc.js'), 'export {}')

    const app = express()
    app.use(
      createRunnerHostMiddleware({
        runnerHostnames: [RUN_HOST],
        frameAncestors: [APP_ORIGIN],
        serveStatic: express.static(distDir),
      }),
    )
    // Giả lập phần còn lại của server.ts: API + SPA fallback.
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok' })
    })
    app.get('/{*splat}', (_req, res) => {
      res.send('SPA')
    })
    server = app.listen(0)
    await new Promise((r) => server.once('listening', r))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  afterAll(() => {
    server.close()
    rmSync(distDir, { recursive: true, force: true })
  })

  // node:http thay vì fetch: vitest.setup.ts thay `fetch` toàn cục bằng bản đọc file public/,
  // và fetch của Node không cho đặt header Host.
  interface Reply {
    status: number
    headers: Record<string, string | string[] | undefined>
    text: () => Promise<string>
  }
  const get = (p: string, host: string, method = 'GET') =>
    new Promise<Reply>((resolve, reject) => {
      const req = request(`${base}${p}`, { method, headers: { Host: host } }, (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c: string) => (body += c))
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            text: async () => body,
          }),
        )
      })
      req.on('error', reject)
      req.end()
    })

  it('host runner: phục vụ runner.html kèm CSP riêng, không X-Frame-Options', async () => {
    const res = await get('/runner.html', RUN_HOST)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('runner')
    expect(res.headers['content-security-policy']).toContain(`frame-ancestors ${APP_ORIGIN}`)
    expect(res.headers['x-frame-options']).toBeUndefined()
    expect(res.headers['origin-agent-cluster']).toBe('?1')
    expect(res.headers['referrer-policy']).toBe('no-referrer')
  })

  it('host runner: file JS đã build vẫn tải được', async () => {
    expect((await get('/js/runner-abc.js', RUN_HOST)).status).toBe(200)
  })

  it('host runner: /api, trang chủ, index.html, file thiếu đều 404 — không rơi xuống SPA', async () => {
    for (const p of ['/api/health', '/', '/index.html', '/preview.html', '/js/khong-co.js']) {
      const res = await get(p, RUN_HOST)
      expect(res.status, p).toBe(404)
      expect(await res.text(), p).not.toBe('SPA')
    }
  })

  it('host runner: chỉ GET/HEAD', async () => {
    const res = await get('/runner.html', RUN_HOST, 'POST')
    expect(res.status).toBe(405)
    expect(res.headers['allow']).toBe('GET, HEAD')
  })

  it('host app: chặn runner.html/preview.html, phần còn lại đi tiếp như cũ', async () => {
    const appHost = 'en-vi.donghanhcungban.org'
    expect((await get('/runner.html', appHost)).status).toBe(404)
    expect((await get('/preview.html', appHost)).status).toBe(404)
    expect(await (await get('/hoc-tap', appHost)).text()).toBe('SPA')
    expect((await get('/api/health', appHost)).status).toBe(200)
  })
})

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  encodePreviewPayload,
  parseRunnerEvent,
  parseRunnerOrigin,
  parseRunnerRequest,
} from './runnerProtocol'

describe('parseRunnerRequest', () => {
  it('nhận đủ 5 làn hợp lệ', () => {
    const reqs = [
      { lane: 'javascript', code: 'x', stdinLines: ['1'] },
      { lane: 'dom', code: 'x', html: '<p/>', hanhDong: ['click #a'] },
      { lane: 'fetch', code: 'x', html: '<p/>', api: 'cua-hang' },
      { lane: 'sql', code: 'SELECT 1', seed: 'CREATE TABLE t(a);' },
      { lane: 'python', code: 'print(1)', files: { 'a.py': 'x = 1' } },
    ]
    for (const req of reqs) {
      expect(parseRunnerRequest({ type: 'run', id: 'r1', req })).toEqual({
        type: 'run',
        id: 'r1',
        req,
      })
    }
    expect(parseRunnerRequest({ type: 'reset' })).toEqual({ type: 'reset' })
  })

  it('từ chối tin nhắn sai hình (làn lạ, thiếu html, api lạ, id rỗng, kiểu lạ)', () => {
    const bad = [
      null,
      'run',
      { type: 'run', id: 'r1', req: { lane: 'ruby', code: 'x' } },
      { type: 'run', id: 'r1', req: { lane: 'dom', code: 'x' } },
      { type: 'run', id: 'r1', req: { lane: 'fetch', code: 'x', html: '', api: 'ngan-hang' } },
      { type: 'run', id: '', req: { lane: 'javascript', code: 'x' } },
      { type: 'eval', code: 'alert(1)' },
    ]
    for (const data of bad) expect(parseRunnerRequest(data)).toBeNull()
  })

  it('từ chối code vượt trần kích thước', () => {
    const code = 'x'.repeat(500_001)
    expect(
      parseRunnerRequest({ type: 'run', id: 'r', req: { lane: 'javascript', code } }),
    ).toBeNull()
  })
})

describe('parseRunnerEvent', () => {
  it('nhận hello/loading/output/result', () => {
    expect(parseRunnerEvent({ type: 'hello', protocol: 1 })).toEqual({ type: 'hello', protocol: 1 })
    expect(parseRunnerEvent({ type: 'loading', id: 'a' })).toEqual({ type: 'loading', id: 'a' })
    expect(parseRunnerEvent({ type: 'output', id: 'a', text: 'hi' })).toEqual({
      type: 'output',
      id: 'a',
      text: 'hi',
    })
    const result = { output: '1', error: 'NameError', timedOut: false, durationMs: 3 }
    expect(parseRunnerEvent({ type: 'result', id: 'a', result })).toEqual({
      type: 'result',
      id: 'a',
      result,
    })
  })

  it('từ chối kết quả thiếu trường bắt buộc', () => {
    expect(parseRunnerEvent({ type: 'result', id: 'a', result: { output: '' } })).toBeNull()
    expect(parseRunnerEvent({ type: 'done', id: 'a' })).toBeNull()
  })
})

describe('parseRunnerOrigin', () => {
  it('chỉ nhận đúng dạng origin', () => {
    expect(parseRunnerOrigin('https://run.donghanhcungban.org')).toBe(
      'https://run.donghanhcungban.org',
    )
    expect(parseRunnerOrigin('http://127.0.0.1:5179')).toBe('http://127.0.0.1:5179')
  })

  it('cấu hình sai → null (dấu / cuối, có đường dẫn, scheme lạ, rỗng)', () => {
    for (const raw of [
      undefined,
      '',
      'https://run.donghanhcungban.org/',
      'https://run.donghanhcungban.org/runner.html',
      'javascript:alert(1)',
      'run.donghanhcungban.org',
    ]) {
      expect(parseRunnerOrigin(raw)).toBeNull()
    }
  })
})

describe('encodePreviewPayload ↔ preview.html', () => {
  // Giải mã y như script inline của apps/dhcb/preview.html — test dưới khẳng định file đó vẫn
  // dùng đúng công thức này, nên hai phía không thể trôi khỏi nhau.
  const decodeLikePreview = (payload: string) => {
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  }

  it('khứ hồi đúng tiếng Việt, emoji, ký tự base64 đặc biệt, trang lớn', () => {
    for (const page of [
      '<h1>Xin chào — Đà Nẵng 🌧️</h1>',
      '<p>??>>~~</p>',
      '<script>a+b/c</script>',
      'x'.repeat(200_000) + 'ế',
    ]) {
      const payload = encodePreviewPayload(page)
      expect(payload).toMatch(/^[A-Za-z0-9_-]*$/) // an toàn trong fragment URL, không '='
      expect(decodeLikePreview(payload)).toBe(page)
    }
  })

  it('preview.html vẫn giải mã theo đúng công thức trên', () => {
    const html = readFileSync(join(__dirname, '..', '..', 'preview.html'), 'utf8')
    expect(html).toContain("atob(payload.replace(/-/g, '+').replace(/_/g, '/'))")
    expect(html).toContain('new TextDecoder().decode(bytes)')
    expect(html).toContain('if (window.parent === window) return')
  })
})

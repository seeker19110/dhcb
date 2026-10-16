// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createProviderReplay, requestFingerprint, type ReplayExchange } from './providerReplay'

const url = 'https://api.anthropic.com/v1/messages?beta=true'
const body = { messages: [{ role: 'user', content: 'Dữ liệu tổng hợp' }], model: 'synthetic' }
const exchange = (): ReplayExchange => ({
  method: 'POST',
  path: '/v1/messages?beta=true',
  requestHeaders: { 'anthropic-version': '2023-06-01', 'anthropic-beta': null },
  requestFingerprint: requestFingerprint('POST', '/v1/messages?beta=true', body, {
    'anthropic-version': '2023-06-01',
    'anthropic-beta': null,
  }),
  response: { kind: 'http', status: 200, contentType: 'application/json', body: '{"ok":true}' },
})
const init = () => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'anthropic-version': '2023-06-01' },
})

afterEach(() => vi.unstubAllGlobals())

describe('fetch replay từ chối mismatch và không gọi mạng', () => {
  it('chuẩn hóa thứ tự key nhưng giữ thay đổi ngữ nghĩa', () => {
    const fp = (value: unknown) => requestFingerprint('POST', '/x', value)
    expect(fp({ b: 2, a: [1, 3] })).toBe(fp({ a: [1, 3], b: 2 }))
    expect(fp({ a: [3, 1], b: 2 })).not.toBe(fp({ a: [1, 3], b: 2 }))
    expect(() => fp({ secret: undefined })).toThrow()
  })

  it('response đi qua fetch được tiêm, global fetch không được gọi', async () => {
    const network = vi.fn(() => {
      throw new Error('Không được gọi mạng')
    })
    vi.stubGlobal('fetch', network)
    const replay = createProviderReplay([exchange()])
    expect(await (await replay.fetchImpl(url, init())).json()).toEqual({ ok: true })
    expect(replay.consumed()).toBe(1)
    expect(() => replay.assertComplete()).not.toThrow()
    expect(network).not.toHaveBeenCalled()
  })

  it.each([
    [url, { ...init(), method: 'PUT' }],
    [url, { ...init(), body: '{"model":"changed"}' }],
    [url, { ...init(), body: '{' }],
    ['https://khac.invalid/v1/messages?beta=true', init()],
    ['https://api.anthropic.com/v1/khac', init()],
  ])('request lệch phải làm ledger đỏ dù caller bắt lỗi', async (target, options) => {
    const replay = createProviderReplay([exchange()])
    await expect(replay.fetchImpl(target, options)).rejects.toThrow(/REPLAY_/)
    expect(() => replay.assertComplete()).toThrow(/REPLAY_INCOMPLETE/)
  })

  it('thiếu/thừa lượt gọi đều bị chặn', async () => {
    const replay = createProviderReplay([exchange(), exchange()])
    await (await replay.fetchImpl(url, init())).text()
    expect(() => replay.assertComplete()).toThrow('1/2')
    await (await replay.fetchImpl(url, init())).text()
    expect(() => replay.assertComplete()).not.toThrow()
    await expect(replay.fetchImpl(url, init())).rejects.toThrow('UNEXPECTED_REQUEST')
    expect(() => replay.assertComplete()).toThrow('UNEXPECTED_REQUEST')
  })

  it('lỗi mismatch không chứa body, header hoặc key canary', async () => {
    const replay = createProviderReplay([exchange()])
    let message = ''
    try {
      await replay.fetchImpl(url, {
        ...init(),
        headers: { authorization: 'CANARY_KEY' },
        body: '{"secret":"CANARY_BODY"}',
      })
    } catch (err) {
      message = String(err)
    }
    expect(message).toContain('REPLAY_REQUEST_MISMATCH')
    expect(message).not.toMatch(/CANARY_KEY|CANARY_BODY/)
  })

  it.each<{ headers: Record<string, string> }>([
    { headers: { 'anthropic-version': 'changed' } },
    { headers: { 'anthropic-version': '2023-06-01', 'anthropic-beta': 'changed' } },
  ])('header hành vi đổi cũng làm fingerprint đỏ', async ({ headers }) => {
    const replay = createProviderReplay([exchange()])
    await expect(replay.fetchImpl(url, { ...init(), headers })).rejects.toThrow('MISMATCH')
    expect(() => replay.assertComplete()).toThrow('INCOMPLETE')
  })

  it('không đưa auth/key vào fingerprint hoặc cassette', async () => {
    const replay = createProviderReplay([exchange()])
    await (
      await replay.fetchImpl(url, {
        ...init(),
        headers: { ...init().headers, authorization: 'CANARY_KEY' },
      })
    ).text()
    expect(() => replay.assertComplete()).not.toThrow()
  })

  it('trả Response nhưng consumer chưa đọc body không phải replay hoàn tất', async () => {
    const replay = createProviderReplay([exchange()])
    const response = await replay.fetchImpl(url, init())
    expect(() => replay.assertComplete()).toThrow('terminal 0/1')
    await response.text()
    expect(() => replay.assertComplete()).not.toThrow()
  })

  it('timeout theo signal SDK gốc, kể cả khi request native clone signal', async () => {
    const e = exchange()
    e.response = { kind: 'timeout' }
    const replay = createProviderReplay([e])
    const controller = new AbortController()
    const pending = replay.fetchImpl(url, { ...init(), signal: controller.signal })
    setTimeout(() => controller.abort(), 10)
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(() => replay.assertComplete()).not.toThrow()
  })

  it('thiếu signal timeout là lỗi harness, không được chấm là timeout đạt', async () => {
    const e = exchange()
    e.response = { kind: 'timeout' }
    const replay = createProviderReplay([e])
    await expect(replay.fetchImpl(url, init())).rejects.toThrow('TIMEOUT_SIGNAL_MISSING')
    expect(() => replay.assertComplete()).toThrow('TIMEOUT_SIGNAL_MISSING')
  })

  it('response native không hợp lệ làm ledger đỏ', async () => {
    const e = exchange()
    e.response = { kind: 'http', status: 204, contentType: 'application/json', body: 'not allowed' }
    const replay = createProviderReplay([e])
    await expect(replay.fetchImpl(url, init())).rejects.toThrow('INVALID_RESPONSE')
    expect(() => replay.assertComplete()).toThrow('INVALID_RESPONSE')
  })

  it.each([
    { raw: [] },
    { raw: [{ ...exchange(), requestFingerprint: 'bad' }] },
    { raw: [{ ...exchange(), unexpected: true }] },
  ])('schema hỏng phải bị từ chối', ({ raw }) => {
    expect(() => createProviderReplay(raw)).toThrow()
  })
})

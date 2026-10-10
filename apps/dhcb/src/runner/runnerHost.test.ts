import { describe, expect, it, vi } from 'vitest'
import type { CodeRunResult } from '../lib/codeRunResult'
import type { RunnerEvent } from '../lib/runnerProtocol'
import { startRunner, type RunnerEnvironment } from './runnerHost'

const APP = 'https://en-vi.donghanhcungban.org'
const parentWindow = { name: 'cha' }
const selfWindow = { name: 'runner' }
const OK: CodeRunResult = { output: '42\n', timedOut: false, durationMs: 5 }

function makeEnv(overrides: Partial<RunnerEnvironment> = {}) {
  const posted: Array<[RunnerEvent, string]> = []
  const env: RunnerEnvironment = {
    parentParam: APP,
    parentWindow,
    selfWindow,
    post: (event, origin) => posted.push([event, origin]),
    runLane: vi.fn(async (_req, cb) => {
      cb?.onLoading?.()
      cb?.onOutput?.('42\n')
      return OK
    }),
    resetLanes: vi.fn(),
    ...overrides,
  }
  return { env, posted }
}

const RUN = { type: 'run', id: 'r1', req: { lane: 'javascript', code: 'console.log(42)' } }

describe('startRunner', () => {
  it('mở thẳng runner.html (không nằm trong khung) thì không làm gì', () => {
    const { env, posted } = makeEnv({ parentWindow: selfWindow })
    expect(startRunner(env)).toBeNull()
    expect(posted).toEqual([])
  })

  it('thiếu hoặc sai ?parent= thì không làm gì', () => {
    for (const parentParam of [null, '', 'https://evil.example/', 'javascript:alert(1)']) {
      const { env, posted } = makeEnv({ parentParam })
      expect(startRunner(env)).toBeNull()
      expect(posted).toEqual([])
    }
  })

  it('khởi động: gửi hello tới ĐÚNG origin cha', () => {
    const { env, posted } = makeEnv()
    startRunner(env)
    expect(posted).toEqual([[{ type: 'hello', protocol: 1 }, APP]])
  })

  it('chạy code: gửi loading → output → result, tất cả tới origin cha', async () => {
    const { env, posted } = makeEnv()
    const handle = startRunner(env)!
    handle({ origin: APP, source: parentWindow, data: RUN })
    await vi.waitFor(() => expect(posted).toHaveLength(4))
    expect(env.runLane).toHaveBeenCalledWith(RUN.req, expect.any(Object))
    expect(posted.slice(1)).toEqual([
      [{ type: 'loading', id: 'r1' }, APP],
      [{ type: 'output', id: 'r1', text: '42\n' }, APP],
      [{ type: 'result', id: 'r1', result: OK }, APP],
    ])
    expect(posted.every(([, origin]) => origin === APP)).toBe(true)
  })

  it('bỏ qua tin nhắn từ origin khác hoặc cửa sổ khác cửa sổ cha', () => {
    const { env } = makeEnv()
    const handle = startRunner(env)!
    handle({ origin: 'https://evil.example', source: parentWindow, data: RUN })
    handle({ origin: APP, source: { name: 'popup lạ' }, data: RUN })
    expect(env.runLane).not.toHaveBeenCalled()
  })

  it('bỏ qua tin nhắn sai hợp đồng', () => {
    const { env } = makeEnv()
    const handle = startRunner(env)!
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    handle({ origin: APP, source: parentWindow, data: { type: 'eval', code: 'alert(1)' } })
    expect(env.runLane).not.toHaveBeenCalled()
  })

  it('reset: dọn các worker', () => {
    const { env } = makeEnv()
    startRunner(env)!({ origin: APP, source: parentWindow, data: { type: 'reset' } })
    expect(env.resetLanes).toHaveBeenCalledTimes(1)
  })

  it('làn ném lỗi hệ thống: vẫn trả result có error để app không chờ mãi', async () => {
    const { env, posted } = makeEnv({
      runLane: vi.fn(async () => {
        throw new Error('Worker không tạo được')
      }),
    })
    startRunner(env)!({ origin: APP, source: parentWindow, data: RUN })
    await vi.waitFor(() => expect(posted).toHaveLength(2))
    const [event] = posted[1]!
    expect(event).toMatchObject({ type: 'result', id: 'r1', result: { timedOut: false } })
    expect(event.type === 'result' && event.result.error).toMatch(/Worker không tạo được/)
  })
})

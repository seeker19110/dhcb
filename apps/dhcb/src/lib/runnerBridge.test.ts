import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RunnerRequest } from './runnerProtocol'
import {
  BRIDGE_STALLED_MESSAGE,
  BRIDGE_STOPPED_MESSAGE,
  BRIDGE_UNAVAILABLE_MESSAGE,
  HELLO_TIMEOUT_MS,
  LOADING_WATCHDOG_MS,
  RUN_WATCHDOG_MS,
  createRunnerBridge,
  type BridgeEnvironment,
} from './runnerBridge'

const RUNNER = 'https://run.donghanhcungban.org'
const APP = 'https://en-vi.donghanhcungban.org'
const JS = { lane: 'javascript', code: 'console.log(1)' } as const

/** Môi trường giả: ghi lại khung đã tạo, tin đã gửi; `emit` giả làm runner trả lời. */
function makeEnv() {
  const frames: Array<{ src: string; window: object; posted: Array<[RunnerRequest, string]> }> = []
  const removed: object[] = []
  let handler: ((msg: { origin: string; source: unknown; data: unknown }) => void) | null = null
  let ids = 0
  const env: BridgeEnvironment = {
    runnerOrigin: RUNNER,
    appOrigin: APP,
    createFrame(src) {
      const f = {
        src,
        window: { khung: frames.length },
        posted: [] as Array<[RunnerRequest, string]>,
      }
      frames.push(f)
      return {
        window: f.window,
        post: (m, o) => f.posted.push([m, o]),
        remove: () => removed.push(f.window),
      }
    },
    listen(h) {
      handler = h
      return () => {
        handler = null
      }
    },
    newId: () => `r${++ids}`,
  }
  const emit = (data: unknown, opts: { origin?: string; source?: unknown } = {}) =>
    handler?.({
      origin: opts.origin ?? RUNNER,
      source: opts.source ?? frames.at(-1)?.window,
      data,
    })
  return { env, frames, removed, emit }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('createRunnerBridge', () => {
  it('tạo khung LƯỜI ở lượt đầu, URL mang origin app; chờ hello rồi mới gửi', async () => {
    const { env, frames, emit } = makeEnv()
    const bridge = createRunnerBridge(env)
    expect(frames).toHaveLength(0)

    const p = bridge.run(JS)
    expect(frames).toHaveLength(1)
    expect(frames[0]!.src).toBe(`${RUNNER}/runner.html?parent=${encodeURIComponent(APP)}`)
    await vi.advanceTimersByTimeAsync(0)
    expect(frames[0]!.posted).toEqual([]) // chưa chào thì chưa gửi

    emit({ type: 'hello', protocol: 1 })
    await vi.advanceTimersByTimeAsync(0)
    expect(frames[0]!.posted).toEqual([[{ type: 'run', id: 'r1', req: JS }, RUNNER]])

    const result = { output: '1\n', timedOut: false, durationMs: 3 }
    emit({ type: 'result', id: 'r1', result })
    await expect(p).resolves.toEqual(result)
  })

  it('dùng lại khung cho lượt sau; output/loading chuyển tới callback', async () => {
    const { env, frames, emit } = makeEnv()
    const bridge = createRunnerBridge(env)
    const onOutput = vi.fn()
    const onLoading = vi.fn()
    const p1 = bridge.run(JS)
    emit({ type: 'hello', protocol: 1 })
    await vi.advanceTimersByTimeAsync(0)
    emit({ type: 'result', id: 'r1', result: { output: '', timedOut: false, durationMs: 1 } })
    await p1

    const p2 = bridge.run({ lane: 'python', code: 'print(1)' }, { onOutput, onLoading })
    await vi.advanceTimersByTimeAsync(0)
    expect(frames).toHaveLength(1)
    emit({ type: 'loading', id: 'r2' })
    emit({ type: 'output', id: 'r2', text: '1\n' })
    emit({ type: 'result', id: 'r2', result: { output: '1\n', timedOut: false, durationMs: 9 } })
    await p2
    expect(onLoading).toHaveBeenCalledTimes(1)
    expect(onOutput).toHaveBeenCalledWith('1\n')
  })

  it('bỏ qua tin từ origin khác, cửa sổ khác, hoặc sai hợp đồng', async () => {
    const { env, frames, emit } = makeEnv()
    const bridge = createRunnerBridge(env)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const p = bridge.run(JS)
    emit({ type: 'hello', protocol: 1 }, { origin: 'https://evil.example' })
    emit({ type: 'hello', protocol: 1 }, { source: { khung: 'giả' } })
    emit({ type: 'xin-chao' })
    await vi.advanceTimersByTimeAsync(0)
    expect(frames[0]!.posted).toEqual([])

    emit({ type: 'hello', protocol: 1 })
    await vi.advanceTimersByTimeAsync(0)
    const fake = { output: 'GIẢ', timedOut: false, durationMs: 0 }
    emit({ type: 'result', id: 'r1', result: fake }, { origin: 'https://evil.example' })
    emit({ type: 'result', id: 'r1', result: { output: 'thật', timedOut: false, durationMs: 1 } })
    await expect(p).resolves.toMatchObject({ output: 'thật' })
  })

  it('runner không chào trong 10s → lỗi rõ ràng, gỡ khung; lượt sau dựng khung mới', async () => {
    const { env, frames, removed } = makeEnv()
    const bridge = createRunnerBridge(env)
    const p = bridge.run(JS)
    await vi.advanceTimersByTimeAsync(HELLO_TIMEOUT_MS)
    await expect(p).resolves.toMatchObject({ error: BRIDGE_UNAVAILABLE_MESSAGE, timedOut: false })
    expect(removed).toEqual([frames[0]!.window])

    void bridge.run(JS)
    expect(frames).toHaveLength(2)
  })

  it('runner im lặng quá hạn giữa lượt chạy → khởi động lại khung, trả lỗi kèm output đã có', async () => {
    const { env, frames, removed, emit } = makeEnv()
    const bridge = createRunnerBridge(env)
    const p = bridge.run(JS)
    emit({ type: 'hello', protocol: 1 })
    await vi.advanceTimersByTimeAsync(0)
    emit({ type: 'output', id: 'r1', text: 'dòng 1\n' })
    await vi.advanceTimersByTimeAsync(RUN_WATCHDOG_MS)
    await expect(p).resolves.toMatchObject({ output: 'dòng 1\n', error: BRIDGE_STALLED_MESSAGE })
    expect(removed).toEqual([frames[0]!.window])
  })

  it('đang tải Pyodide thì cho thời hạn dài hơn hẳn', async () => {
    const { env, emit } = makeEnv()
    const bridge = createRunnerBridge(env)
    let done = false
    const p = bridge.run({ lane: 'python', code: 'x' }).then((r) => {
      done = true
      return r
    })
    emit({ type: 'hello', protocol: 1 })
    await vi.advanceTimersByTimeAsync(0)
    emit({ type: 'loading', id: 'r1' })
    await vi.advanceTimersByTimeAsync(RUN_WATCHDOG_MS * 2)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(LOADING_WATCHDOG_MS)
    await expect(p).resolves.toMatchObject({ error: BRIDGE_STALLED_MESSAGE })
  })

  it('reset: gỡ khung, lượt đang chờ nhận "đã dừng" (kể cả lượt còn chờ hello)', async () => {
    const { env, frames, removed, emit } = makeEnv()
    const bridge = createRunnerBridge(env)
    const choHello = bridge.run(JS)
    bridge.reset()
    await expect(choHello).resolves.toMatchObject({ error: BRIDGE_STOPPED_MESSAGE })

    const dangChay = bridge.run(JS)
    emit({ type: 'hello', protocol: 1 })
    await vi.advanceTimersByTimeAsync(0)
    bridge.reset()
    await expect(dangChay).resolves.toMatchObject({ error: BRIDGE_STOPPED_MESSAGE })
    expect(removed).toEqual(frames.map((f) => f.window))
  })

  it('không bao giờ gửi postMessage với targetOrigin "*"', async () => {
    const { env, frames, emit } = makeEnv()
    const bridge = createRunnerBridge(env)
    void bridge.run(JS)
    emit({ type: 'hello', protocol: 1 })
    await vi.advanceTimersByTimeAsync(0)
    expect(frames[0]!.posted.every(([, origin]) => origin === RUNNER)).toBe(true)
    // Và trong mã nguồn phía app/runner không có chỗ nào gửi tới '*'.
    for (const file of ['runnerBridge.ts', '../runner/runnerHost.ts', '../runner/main.ts']) {
      const src = readFileSync(join(__dirname, file), 'utf8')
      expect(src, file).not.toMatch(/postMessage\([^)]*['"]\*['"]/)
    }
  })
})

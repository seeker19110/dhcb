import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FLUSH_TIMEOUT_MS,
  installProcessSafetyNet,
  type SafetyNetDeps,
} from './processSafetyNet.js'

function makeDeps(flushResult: Promise<boolean> = Promise.resolve(true)) {
  return {
    logger: vi.fn(),
    captureException: vi.fn(),
    flush: vi.fn<SafetyNetDeps['flush']>(() => flushResult),
    exit: vi.fn(),
  } satisfies SafetyNetDeps
}

let remove: (() => void) | null = null
const tick = () => new Promise((r) => setTimeout(r, 0))

// Dọn listener sau mỗi test để các ca không ảnh hưởng nhau.
afterEach(() => {
  remove?.()
  remove = null
})

describe('installProcessSafetyNet', () => {
  it('unhandledRejection: log + capture, KHÔNG exit', async () => {
    const deps = makeDeps()
    remove = installProcessSafetyNet(deps)
    const err = new Error('boom')
    process.emit('unhandledRejection', err, Promise.resolve())
    await tick()
    expect(deps.logger).toHaveBeenCalledWith(expect.any(String), err)
    expect(deps.captureException).toHaveBeenCalledWith(err, expect.any(Object))
    expect(deps.exit).not.toHaveBeenCalled()
    expect(deps.flush).not.toHaveBeenCalled()
  })

  it('unhandledRejection: lý do không phải Error + capture ném lỗi vẫn không ném, không exit', () => {
    const deps = makeDeps()
    deps.captureException.mockImplementation(() => {
      throw new Error('sentry hỏng')
    })
    remove = installProcessSafetyNet(deps)
    expect(() => process.emit('unhandledRejection', 'chuỗi trơn', Promise.resolve())).not.toThrow()
    expect(deps.exit).not.toHaveBeenCalled()
  })

  it('uncaughtException: log + capture + flush rồi exit(1)', async () => {
    const deps = makeDeps()
    remove = installProcessSafetyNet(deps)
    const err = new Error('fatal')
    process.emit('uncaughtException', err, 'uncaughtException')
    expect(deps.exit).not.toHaveBeenCalled() // chưa exit trước khi flush xong
    await tick()
    expect(deps.captureException).toHaveBeenCalledWith(err, expect.any(Object))
    expect(deps.flush).toHaveBeenCalledWith(FLUSH_TIMEOUT_MS)
    expect(deps.exit).toHaveBeenCalledTimes(1)
    expect(deps.exit).toHaveBeenCalledWith(1)
  })

  it('uncaughtException: flush lỗi vẫn exit(1)', async () => {
    const deps = makeDeps(Promise.reject(new Error('flush fail')))
    remove = installProcessSafetyNet(deps)
    process.emit('uncaughtException', new Error('fatal'), 'uncaughtException')
    await tick()
    expect(deps.exit).toHaveBeenCalledWith(1)
  })

  it('uncaughtException lần hai trong lúc đang flush: exit ngay', () => {
    const deps = makeDeps(new Promise<boolean>(() => undefined)) // flush không bao giờ xong
    remove = installProcessSafetyNet(deps)
    process.emit('uncaughtException', new Error('một'), 'uncaughtException')
    expect(deps.exit).not.toHaveBeenCalled()
    process.emit('uncaughtException', new Error('hai'), 'uncaughtException')
    expect(deps.exit).toHaveBeenCalledWith(1)
  })

  it('idempotent: gọi hai lần chỉ đăng ký một lần', () => {
    const rejBefore = process.listenerCount('unhandledRejection')
    const excBefore = process.listenerCount('uncaughtException')
    const first = makeDeps()
    const second = makeDeps()
    remove = installProcessSafetyNet(first)
    installProcessSafetyNet(second)
    expect(process.listenerCount('unhandledRejection')).toBe(rejBefore + 1)
    expect(process.listenerCount('uncaughtException')).toBe(excBefore + 1)
    process.emit('unhandledRejection', new Error('x'), Promise.resolve())
    expect(first.captureException).toHaveBeenCalledTimes(1)
    expect(second.captureException).not.toHaveBeenCalled()
  })

  it('hàm gỡ trả listener về như cũ', () => {
    const rejBefore = process.listenerCount('unhandledRejection')
    remove = installProcessSafetyNet(makeDeps())
    remove()
    remove = null
    expect(process.listenerCount('unhandledRejection')).toBe(rejBefore)
  })
})

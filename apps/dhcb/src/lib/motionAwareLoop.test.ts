// Test cho vòng vẽ biết điều (U6 · M3) — giả lập requestAnimationFrame, matchMedia,
// visibilityState và IntersectionObserver để đếm đúng số khung đã vẽ, không phụ thuộc trình duyệt.
import { describe, expect, it, vi } from 'vitest'
import { REDUCED_MOTION_QUERY, startMotionAwareLoop } from './motionAwareLoop'

type Listener = () => void

function makeEnv(opts: { reduced?: boolean; hidden?: boolean } = {}) {
  let nextId = 1
  const frames = new Map<number, FrameRequestCallback>()
  let reduced = opts.reduced ?? false
  const mqListeners = new Set<Listener>()
  const docListeners = new Set<Listener>()
  let visibility: DocumentVisibilityState = opts.hidden ? 'hidden' : 'visible'
  let ioCallback: IntersectionObserverCallback | null = null
  const disconnect = vi.fn()

  class FakeObserver {
    constructor(cb: IntersectionObserverCallback) {
      ioCallback = cb
    }
    observe() {}
    disconnect = disconnect
  }

  const win = {
    requestAnimationFrame: (cb: FrameRequestCallback) => {
      const id = nextId++
      frames.set(id, cb)
      return id
    },
    cancelAnimationFrame: (id: number) => {
      frames.delete(id)
    },
    matchMedia: (query: string) => ({
      get matches() {
        return query === REDUCED_MOTION_QUERY && reduced
      },
      addEventListener: (_: string, l: Listener) => mqListeners.add(l),
      removeEventListener: (_: string, l: Listener) => mqListeners.delete(l),
    }),
    IntersectionObserver: FakeObserver,
  } as unknown as Window

  const doc = {
    get visibilityState() {
      return visibility
    },
    addEventListener: (_: string, l: Listener) => docListeners.add(l),
    removeEventListener: (_: string, l: Listener) => docListeners.delete(l),
  } as unknown as Document

  return {
    win,
    doc,
    /** Chạy mọi khung đang hẹn (một "nhịp" màn hình). */
    flush(now = 16) {
      const pending = [...frames.entries()]
      frames.clear()
      for (const [, cb] of pending) cb(now)
    },
    pendingFrames: () => frames.size,
    setReduced(value: boolean) {
      reduced = value
      mqListeners.forEach((l) => l())
    },
    setHidden(value: boolean) {
      visibility = value ? 'hidden' : 'visible'
      docListeners.forEach((l) => l())
    },
    setInView(value: boolean) {
      ioCallback?.(
        [{ isIntersecting: value } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    },
    listenerCount: () => mqListeners.size + docListeners.size,
    disconnect,
  }
}

describe('startMotionAwareLoop', () => {
  it('chạy liên tục khi không giảm chuyển động, tab hiện, trong khung nhìn', () => {
    const env = makeEnv()
    const draw = vi.fn()
    startMotionAwareLoop({ draw, staticFrameTime: 1000, target: {} as Element, ...env })
    for (let i = 0; i < 5; i++) env.flush(i * 16)
    expect(draw).toHaveBeenCalledTimes(5)
    expect(env.pendingFrames()).toBe(1)
  })

  it('giảm chuyển động: vẽ ĐÚNG MỘT khung tĩnh ở staticFrameTime, không hẹn khung nào', () => {
    const env = makeEnv({ reduced: true })
    const draw = vi.fn()
    startMotionAwareLoop({ draw, staticFrameTime: 1000, ...env })
    for (let i = 0; i < 5; i++) env.flush(i * 16)
    expect(draw).toHaveBeenCalledTimes(1)
    expect(draw).toHaveBeenCalledWith(1000)
    expect(env.pendingFrames()).toBe(0)
  })

  it('bật giảm chuyển động khi đang chạy → dừng ngay và vẽ khung tĩnh; tắt lại → chạy tiếp', () => {
    const env = makeEnv()
    const draw = vi.fn()
    startMotionAwareLoop({ draw, staticFrameTime: 1000, ...env })
    env.flush()
    env.setReduced(true)
    expect(env.pendingFrames()).toBe(0)
    expect(draw).toHaveBeenLastCalledWith(1000)
    const before = draw.mock.calls.length
    env.flush()
    expect(draw.mock.calls.length).toBe(before)
    env.setReduced(false)
    expect(env.pendingFrames()).toBe(1)
  })

  it('tab ẩn → huỷ khung đang hẹn; tab hiện lại → chạy tiếp', () => {
    const env = makeEnv()
    const draw = vi.fn()
    startMotionAwareLoop({ draw, staticFrameTime: 1000, ...env })
    env.flush()
    env.setHidden(true)
    expect(env.pendingFrames()).toBe(0)
    env.flush()
    expect(draw).toHaveBeenCalledTimes(1)
    env.setHidden(false)
    expect(env.pendingFrames()).toBe(1)
  })

  it('mở trang khi tab đang ẩn → không vẽ gì cho tới khi tab hiện', () => {
    const env = makeEnv({ hidden: true })
    const draw = vi.fn()
    startMotionAwareLoop({ draw, staticFrameTime: 1000, ...env })
    env.flush()
    expect(draw).not.toHaveBeenCalled()
    env.setHidden(false)
    env.flush()
    expect(draw).toHaveBeenCalledTimes(1)
  })

  it('ra khỏi khung nhìn → tạm dừng; quay lại → chạy tiếp', () => {
    const env = makeEnv()
    const draw = vi.fn()
    startMotionAwareLoop({ draw, staticFrameTime: 1000, target: {} as Element, ...env })
    env.setInView(false)
    expect(env.pendingFrames()).toBe(0)
    env.setInView(true)
    expect(env.pendingFrames()).toBe(1)
  })

  it('dọn dẹp: huỷ khung, gỡ mọi listener, ngắt observer, không vẽ thêm', () => {
    const env = makeEnv()
    const draw = vi.fn()
    const stop = startMotionAwareLoop({
      draw,
      staticFrameTime: 1000,
      target: {} as Element,
      ...env,
    })
    stop()
    expect(env.pendingFrames()).toBe(0)
    expect(env.listenerCount()).toBe(0)
    expect(env.disconnect).toHaveBeenCalled()
    env.flush()
    expect(draw).not.toHaveBeenCalled()
  })
})

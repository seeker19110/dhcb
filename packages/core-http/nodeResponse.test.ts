// @vitest-environment node
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { describe, expect, it, vi } from 'vitest'
import { copyWebResponseHeaders, forwardEventStream } from './nodeResponse.js'

function target() {
  const response = new ServerResponse(new IncomingMessage(new Socket()))
  const flush = vi.spyOn(response, 'flushHeaders').mockImplementation(() => {})
  const write = vi.spyOn(response, 'write').mockReturnValue(true)
  const end = vi.spyOn(response, 'end').mockImplementation(() => response)
  return { response, flush, write, end }
}
function source(count = 4) {
  let pulls = 0
  const cancel = vi.fn()
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulls === count) {
        controller.close()
        return
      }
      controller.enqueue(new TextEncoder().encode(`chunk${++pulls}`))
    },
    cancel,
  })
  return {
    web: new Response(body, { headers: { 'content-type': 'text/event-stream' } }),
    cancel,
    pulls: () => pulls,
  }
}
const tick = () => new Promise<void>((resolve) => setImmediate(resolve))

describe('Cầu nối Node response', () => {
  it('non-SSE không đọc/lock body; headers và cookie giữ nguyên thuộc tính', async () => {
    const t = target()
    const web = new Response('plain', {
      headers: {
        'content-type': 'text/plain',
        'set-cookie': 'a=b; Secure; HttpOnly',
        'x-test': 'ok',
      },
    })
    copyWebResponseHeaders(web, t.response)
    expect(t.response.getHeader('set-cookie')).toEqual(['a=b; Secure; HttpOnly'])
    expect(t.response.getHeader('x-test')).toBe('ok')
    expect(await forwardEventStream(web, t.response)).toBe(false)
    expect(web.bodyUsed).toBe(false)
    expect(web.body?.locked).toBe(false)
    expect(t.flush).not.toHaveBeenCalled()
    expect(t.end).not.toHaveBeenCalled()
  })
  it('write false chờ drain, sau close chỉ drain/discard và nhả reader/listeners', async () => {
    const t = target(),
      s = source()
    t.write.mockReturnValueOnce(false)
    const task = forwardEventStream(s.web, t.response)
    await vi.waitFor(() => expect(t.write).toHaveBeenCalledTimes(1), { interval: 5 })
    await tick()
    expect(s.pulls()).toBeLessThanOrEqual(2) // Web stream được prefetch một chunk.
    expect(t.write).toHaveBeenCalledTimes(1)
    t.response.emit('close')
    expect(await task).toBe(true)
    expect(s.pulls()).toBe(4)
    expect(s.cancel).not.toHaveBeenCalled()
    expect(t.write).toHaveBeenCalledTimes(1)
    expect(t.end).not.toHaveBeenCalled()
    expect(s.web.body?.locked).toBe(false)
    for (const name of ['drain', 'close', 'error']) expect(t.response.listenerCount(name)).toBe(0)
  })
  it('drain cho phép đọc/ghi chunk tiếp theo, kể cả drain xảy ra ngay trong write', async () => {
    for (const synchronous of [false, true]) {
      const t = target(),
        s = source(2)
      t.write.mockImplementationOnce(() => {
        if (synchronous) t.response.emit('drain')
        else setImmediate(() => t.response.emit('drain'))
        return false
      })
      expect(await forwardEventStream(s.web, t.response)).toBe(true)
      expect(t.write).toHaveBeenCalledTimes(2)
      expect(t.end).toHaveBeenCalledTimes(1)
      expect(s.cancel).not.toHaveBeenCalled()
      expect(t.response.listenerCount('drain')).toBe(0)
    }
  })
  it('HEAD và socket đã đóng vẫn drain body, không cancel hoặc ghi bytes', async () => {
    for (const closed of [false, true]) {
      const t = target(),
        s = source(3)
      if (closed) t.response.destroy()
      expect(await forwardEventStream(s.web, t.response, 'HEAD')).toBe(true)
      expect(s.pulls()).toBe(3)
      expect(t.write).not.toHaveBeenCalled()
      expect(s.cancel).not.toHaveBeenCalled()
      expect(t.end).toHaveBeenCalledTimes(closed ? 0 : 1)
    }
  })
  it.each([204, 304])('SSE status %s không body kết thúc đúng một lần', async (status) => {
    const t = target()
    expect(
      await forwardEventStream(
        new Response(null, { status, headers: { 'content-type': 'text/event-stream' } }),
        t.response,
      ),
    ).toBe(true)
    expect(t.end).toHaveBeenCalledTimes(1)
    expect(t.write).not.toHaveBeenCalled()
  })
  it('lỗi ghi vẫn drain tới cuối rồi giữ error identity; không cancel producer', async () => {
    const t = target(),
      s = source()
    const error = new Error('TEST_WRITE_ERROR')
    t.write.mockImplementationOnce(() => {
      throw error
    })
    await expect(forwardEventStream(s.web, t.response)).rejects.toBe(error)
    expect(s.pulls()).toBe(4)
    expect(s.cancel).not.toHaveBeenCalled()
    expect(s.web.body?.locked).toBe(false)
  })
  it('lỗi body giữ error identity và nhả listener/reader, không tự gửi JSON lỗi', async () => {
    const t = target()
    const error = new Error('TEST_BODY_ERROR')
    const web = new Response(
      new ReadableStream<Uint8Array>({
        pull: () => {
          throw error
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } },
    )
    await expect(forwardEventStream(web, t.response)).rejects.toBe(error)
    expect(t.end).not.toHaveBeenCalled()
    expect(web.body?.locked).toBe(false)
    for (const name of ['drain', 'close', 'error']) expect(t.response.listenerCount(name)).toBe(0)
  })
})

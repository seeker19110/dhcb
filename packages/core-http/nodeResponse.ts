// Cầu nối Web Response → Node. Chỉ nhánh SSE stream; caller giữ cách gửi non-SSE cũ.
import type { ServerResponse } from 'node:http'

export function copyWebResponseHeaders(response: Response, target: ServerResponse): void {
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') target.setHeader(key, value)
  })
  // Expires có dấu phẩy. Không split(',') hoặc setHeader lặp làm mất cookie trước.
  const cookies = response.headers.getSetCookie()
  if (cookies.length) target.setHeader('set-cookie', cookies)
}

type StreamingResponse = ServerResponse & { flush?: () => void }

/**
 * true = đã xử lý SSE; false = caller tự gửi non-SSE. Không cancel reader khi socket
 * đóng: producer Companion hiện hữu có thể coi enqueue vào reader bị hủy là lỗi/refund.
 * Tiếp tục drain/discard đến EOF/deadline hiện hữu, không nhận thêm dữ liệu vào bộ đệm riêng.
 */
export async function forwardEventStream(
  response: Response,
  target: StreamingResponse,
  method = 'GET',
): Promise<boolean> {
  if (!/^text\/event-stream(?:\s*;|$)/i.test(response.headers.get('content-type')?.trim() ?? ''))
    return false

  const reader = response.body?.getReader()
  if (!reader) {
    target.end()
    return true
  }
  let disconnected = target.destroyed || target.writableEnded
  let wake: (() => void) | undefined
  let drainSequence = 0
  let didWriteError = false
  let writeError: unknown
  const onClose = () => {
    disconnected = true
    wake?.()
  }
  const onDrain = () => {
    drainSequence++
    wake?.()
  }
  target.on('close', onClose)
  target.on('error', onClose)
  let drainEmitter: StreamingResponse | undefined
  try {
    if (!disconnected) {
      target.flushHeaders()
      // compression có thể chuyển .on('drain') tới zlib sau khi gửi headers. Giữ emitter
      // thực tế được trả về để tháo đúng listener; không thêm listener mới cho mỗi chunk.
      drainEmitter = target.on('drain', onDrain)
    }
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (disconnected || method === 'HEAD') continue
      const beforeWrite = drainSequence
      let ready: boolean
      try {
        ready = target.write(value)
        target.flush?.()
      } catch (error) {
        didWriteError = true
        writeError = error
        onClose()
        target.destroy()
        continue
      }
      if (!ready && !disconnected && drainSequence === beforeWrite) {
        await new Promise<void>((resolve) => {
          wake = resolve
          if (target.destroyed || target.writableEnded) onClose()
          else if (drainSequence !== beforeWrite) resolve()
        })
        wake = undefined
      }
    }
    if (!disconnected && !target.writableEnded) target.end()
    if (didWriteError) throw writeError
    return true
  } finally {
    wake = undefined
    reader.releaseLock()
    target.off('close', onClose)
    target.off('error', onClose)
    drainEmitter?.off('drain', onDrain)
  }
}

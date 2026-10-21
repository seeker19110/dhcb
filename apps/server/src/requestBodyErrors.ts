import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express'
import { getCorsHeaders } from '@dhcb/core-auth/security'

type ParserErrorStatus = 400 | 413 | 415

const messages: Record<ParserErrorStatus, string> = {
  400: 'Nội dung yêu cầu không hợp lệ',
  413: 'Nội dung yêu cầu vượt quá giới hạn cho phép',
  415: 'Định dạng nội dung yêu cầu không được hỗ trợ',
}

function parserErrorStatus(error: unknown): ParserErrorStatus | undefined {
  if (typeof error !== 'object' || error === null || !('type' in error) || !('status' in error))
    return undefined

  // Chỉ nhận đúng cặp type/status do body-parser phát ra; lỗi khác vẫn tới bộ xử lý kế tiếp.
  switch (error.type) {
    case 'entity.parse.failed':
    case 'request.aborted':
    case 'request.size.invalid':
      return error.status === 400 ? 400 : undefined
    case 'entity.too.large':
      return error.status === 413 ? 413 : undefined
    case 'charset.unsupported':
    case 'encoding.unsupported':
      return error.status === 415 ? 415 : undefined
    default:
      return undefined
  }
}

export function createRequestBodyErrorHandler(
  applySecurityHeaders: (res: ExpressResponse) => void,
) {
  return (error: unknown, req: ExpressRequest, res: ExpressResponse, next: NextFunction): void => {
    const status = parserErrorStatus(error)
    if (status === undefined) {
      next(error)
      return
    }

    // Express 5.3 log nguyên lỗi; body-parser đính body thô (có thể chứa mật khẩu/token).
    // Không log/capture lỗi này, cũng không chuyển nó cho default handler.
    if (res.headersSent || res.destroyed) {
      res.destroy()
      return
    }
    applySecurityHeaders(res)
    // Chỉ cần Origin cho chính sách CORS chung; không dựng URL từ Host do client gửi.
    const corsRequest = new Request('http://localhost', {
      headers: { Origin: req.get('Origin') ?? '' },
    })
    for (const [name, value] of Object.entries(getCorsHeaders(corsRequest)))
      res.setHeader(name, value)
    res.setHeader('Cache-Control', 'no-store')
    res.status(status).json({ error: messages[status] })
  }
}

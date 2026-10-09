// src/lib/accountApi.ts — Gọi /api/account: xuất dữ liệu của tôi + xoá tài khoản (changelog 0533).
// Nghiệp vụ ở server (apps/server/src/api/core/account.ts); file này chỉ gọi mạng + kiểm hình dạng
// phản hồi bằng Zod (dữ liệu ngoài — CLAUDE.md mục 4.1).

import { z } from 'zod'
import {
  ACCOUNT_ERROR_CODES,
  AccountDeleteResultSchema,
  AccountOptionsSchema,
  type AccountErrorCode,
  type AccountOptions,
  type Reauth,
} from '@dhcb/core-contracts/account'

const ErrorSchema = z.object({ error: z.string(), code: z.enum(ACCOUNT_ERROR_CODES).optional() })

/** Lỗi có `code` máy đọc được để giao diện rẽ nhánh (vd STEP_UP_REQUIRED ⇒ hiện ô mã 2FA). */
export class AccountApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: AccountErrorCode,
  ) {
    super(message)
    this.name = 'AccountApiError'
  }
}

async function toError(res: Response): Promise<AccountApiError> {
  const body: unknown = await res.json().catch(() => null)
  const parsed = ErrorSchema.safeParse(body)
  return parsed.success
    ? new AccountApiError(parsed.data.error, res.status, parsed.data.code)
    : new AccountApiError(`Lỗi ${res.status} — thử lại sau.`, res.status)
}

async function send(body: Record<string, unknown>): Promise<Response> {
  let res: Response
  try {
    res = await fetch('/api/account', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new AccountApiError('Lỗi kết nối — kiểm tra mạng rồi thử lại.', 0)
  }
  if (!res.ok) throw await toError(res)
  return res
}

export async function fetchAccountOptions(): Promise<AccountOptions> {
  let res: Response
  try {
    res = await fetch('/api/account?action=options', { credentials: 'include', cache: 'no-store' })
  } catch {
    throw new AccountApiError('Lỗi kết nối — kiểm tra mạng rồi thử lại.', 0)
  }
  if (!res.ok) throw await toError(res)
  return AccountOptionsSchema.parse(await res.json())
}

interface ReauthInput {
  reauth: Reauth
  twoFactorCode?: string
}

/** Tên tệp lấy từ Content-Disposition; thiếu thì tự đặt. */
export function filenameFromDisposition(header: string | null, now = new Date()): string {
  const match = header?.match(/filename="([^"]+)"/)
  return match?.[1] ?? `dhcb-du-lieu-cua-toi-${now.toISOString().slice(0, 10)}.json`
}

/**
 * Xuất dữ liệu và kích hoạt tải tệp về máy. Trả tên tệp đã tải.
 * Giao diện KHÔNG đọc/hiển thị nội dung tệp (Luật số 1 — hồ sơ ẩn chỉ nằm trong tệp tải về).
 */
export async function exportMyData(input: ReauthInput): Promise<string> {
  const res = await send({ action: 'export', ...input })
  const filename = filenameFromDisposition(res.headers.get('Content-Disposition'))
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // Trình duyệt đã nhận lệnh tải; thu hồi ở lượt sau để không cắt ngang việc ghi tệp.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
  return filename
}

export async function deleteMyAccount(
  input: ReauthInput & { confirmation: string; acknowledgeNoRefund?: boolean },
): Promise<{ erasedAt: string }> {
  const res = await send({ action: 'delete', ...input })
  return AccountDeleteResultSchema.parse(await res.json())
}

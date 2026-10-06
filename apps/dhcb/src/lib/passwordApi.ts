import { z } from 'zod'

const StatusSchema = z.object({ hasPassword: z.boolean() })
const SuccessSchema = z.object({ ok: z.literal(true) })
const ErrorSchema = z.object({ error: z.string() })

async function readResponse(response: Response): Promise<unknown> {
  const body: unknown = await response.json()
  if (!response.ok) {
    const parsed = ErrorSchema.safeParse(body)
    throw new Error(
      parsed.success ? parsed.data.error : 'Không thực hiện được yêu cầu. Thử lại sau.',
    )
  }
  return body
}

export async function fetchPasswordStatus(): Promise<boolean> {
  const response = await fetch('/api/auth?action=password-status', {
    credentials: 'include',
    cache: 'no-store',
  })
  return StatusSchema.parse(await readResponse(response)).hasPassword
}

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'change-password', currentPassword, newPassword }),
  })
  SuccessSchema.parse(await readResponse(response))
}

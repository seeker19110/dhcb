import { it, expect, vi, afterEach } from 'vitest'
import { changeAccountPassword, fetchPasswordStatus } from './passwordApi'
afterEach(() => vi.restoreAllMocks())
it('status validates boolean and uses authenticated no-store request', async () => {
  const fetcher = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response('{"hasPassword":false}'))
  expect(await fetchPasswordStatus()).toBe(false)
  expect(fetcher).toHaveBeenCalledWith('/api/auth?action=password-status', {
    credentials: 'include',
    cache: 'no-store',
  })
})
it('change sends only expected fields, not a target user or confirmation', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}'))
  await changeAccountPassword('old secret', 'new secret')
  expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      action: 'change-password',
      currentPassword: 'old secret',
      newPassword: 'new secret',
    }),
  })
})
it.each(['{}', '{"ok":false}', 'not-json'])(
  'does not treat invalid response as successful: %s',
  async (body) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body))
    await expect(changeAccountPassword('old secret', 'new secret')).rejects.toThrow()
  },
)
it('returns server error without treating request as a successful change', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('{"error":"Mật khẩu hiện tại không đúng."}', { status: 400 }),
  )
  await expect(changeAccountPassword('old secret', 'new secret')).rejects.toThrow(
    'Mật khẩu hiện tại không đúng.',
  )
})
it('non-JSON and network failures reject', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'))
  await expect(fetchPasswordStatus()).rejects.toThrow()
  fetcher.mockResolvedValueOnce(new Response('{"error":5}', { status: 500 }))
  await expect(changeAccountPassword('old secret', 'new secret')).rejects.toThrow(
    'Không thực hiện được',
  )
})

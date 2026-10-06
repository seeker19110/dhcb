import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { changePassword, getPasswordStatus } from './changePassword.js'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('./authService.js', () => ({
  hashPassword: vi.fn(async (password: string) => `hash:${password}`),
  verifyPassword: vi.fn(async (password: string, hash: string) => hash === `hash:${password}`),
}))
const query = vi.fn()
const release = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  query.mockReset()
  query.mockImplementation(async (sql: string) => ({
    rows: sql.startsWith('select password_hash')
      ? [{ password_hash: 'hash:old password here' }]
      : sql.startsWith('update public.users')
        ? [{ id: 'u1' }]
        : [],
  }))
  vi.mocked(getPgPool).mockReturnValue({
    query,
    connect: async () => ({ query, release }),
  } as unknown as ReturnType<typeof getPgPool>)
})

it.each([true, false])('status returns only hasPassword=%s', async (has_password) => {
  query.mockResolvedValueOnce({ rows: [{ has_password }] })
  expect(await getPasswordStatus('u1')).toBe(has_password)
  expect(query).toHaveBeenCalledWith(expect.stringContaining('where id = $1'), ['u1'])
})
it('status missing account is null', async () => {
  query.mockResolvedValueOnce({ rows: [] })
  expect(await getPasswordStatus('missing')).toBeNull()
})
describe('changePassword', () => {
  it.each([null, undefined])(
    'OAuth-only/missing account cannot acquire a password (%s)',
    async (hash) => {
      query.mockResolvedValueOnce({ rows: hash === undefined ? [] : [{ password_hash: hash }] })
      expect(await changePassword('u1', 'anything', 'new password here')).toEqual({
        ok: false,
        reason: 'no_password',
      })
      expect(query).toHaveBeenCalledTimes(1)
    },
  )
  it('wrong current password makes no writes', async () => {
    expect(await changePassword('u1', 'wrong', 'new password here')).toEqual({
      ok: false,
      reason: 'wrong_password',
    })
    expect(query).toHaveBeenCalledTimes(1)
  })
  it('does not permit reusing current password', async () => {
    expect(await changePassword('u1', 'old password here', 'old password here')).toEqual({
      ok: false,
      reason: 'same_password',
    })
    expect(query).toHaveBeenCalledTimes(1)
  })
  it('success atomically changes hash and invalidates reset links and all sessions', async () => {
    expect(await changePassword('u1', 'old password here', 'new password here')).toEqual({
      ok: true,
    })
    expect(query.mock.calls.map(([sql]) => String(sql).split('\n')[0])).toEqual([
      'select password_hash from public.users where id = $1',
      'begin',
      'update public.users set password_hash = $1',
      'delete from public.password_resets where user_id = $1',
      'delete from public.sessions where user_id = $1',
      'commit',
    ])
    expect(query.mock.calls[2]?.[1]).toEqual([
      'hash:new password here',
      'u1',
      'hash:old password here',
    ])
    expect(query.mock.calls[2]?.[0]).toContain('password_hash = $3')
    expect(release).toHaveBeenCalledOnce()
  })
  it('rejects stale password hash after another change/reset', async () => {
    query.mockImplementation(async (sql: string) => ({
      rows: sql.startsWith('select password_hash')
        ? [{ password_hash: 'hash:old password here' }]
        : [],
    }))
    expect(await changePassword('u1', 'old password here', 'new password here')).toEqual({
      ok: false,
      reason: 'changed_concurrently',
    })
    expect(query.mock.calls.some(([sql]) => String(sql).startsWith('delete'))).toBe(false)
  })
  it('two concurrent callers cannot both replace the same old hash (CAS double)', async () => {
    let liveHash = 'hash:old password here'
    query.mockImplementation(async (sql: string, values?: string[]) => {
      if (sql.startsWith('select password_hash')) return { rows: [{ password_hash: liveHash }] }
      if (sql.startsWith('update public.users')) {
        if (liveHash !== values?.[2]) return { rows: [] }
        liveHash = values[0]!
        return { rows: [{ id: 'u1' }] }
      }
      return { rows: [] }
    })
    const results = await Promise.all([
      changePassword('u1', 'old password here', 'first password new'),
      changePassword('u1', 'old password here', 'second password new'),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results).toContainEqual({ ok: false, reason: 'changed_concurrently' })
  })
  it.each(['delete from public.password_resets', 'delete from public.sessions', 'commit'])(
    'rolls back if %s fails',
    async (failingSql) => {
      query.mockImplementation(async (sql: string) => {
        if (sql.startsWith(failingSql)) throw new Error('simulated DB unavailable')
        return {
          rows: sql.startsWith('select password_hash')
            ? [{ password_hash: 'hash:old password here' }]
            : sql.startsWith('update public.users')
              ? [{ id: 'u1' }]
              : [],
        }
      })
      await expect(changePassword('u1', 'old password here', 'new password here')).rejects.toThrow(
        'simulated DB unavailable',
      )
      expect(query).toHaveBeenCalledWith('rollback')
      expect(release).toHaveBeenCalledOnce()
    },
  )
})

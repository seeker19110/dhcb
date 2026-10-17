// @vitest-environment node
import { createServer, request } from 'node:http'
import { createConnection } from 'node:net'
import { describe, expect, it } from 'vitest'
import { guardBoundaryNetwork } from './companionBoundaryNetwork'

// Server loopback thật, không DNS/provider/PG. Guard restore luôn trong finally.
describe('ledger network độc lập catch và exact port', () => {
  it('fetch default deny vẫn đếm khi caller nuốt exception', async () => {
    const prior = globalThis.fetch
    const guard = guardBoundaryNetwork(56543)
    try {
      await fetch('https://unmatched.invalid/path').catch(() => undefined)
      expect(guard.violations).toBe(1)
      await guard.withFetchResponder(
        async () => new Response('synthetic'),
        async () => expect(await (await fetch('https://fixture.invalid')).text()).toBe('synthetic'),
      )
      expect(guard.violations).toBe(1)
      await expect(
        guard.withFetchResponder(
          async () => new Response('synthetic'),
          () =>
            guard.withFetchResponder(
              async () => new Response('other'),
              async () => {},
            ),
        ),
      ).rejects.toThrow('BOUNDARY_FETCH_BUSY_OR_CLOSED')
    } finally {
      guard.restore()
    }
    expect(globalThis.fetch).toBe(prior)
  })
  it('native http được đúng listener đã cấp, hết quyền sau revoke; port khác/host khác đều ledger trước throw', async () => {
    const server = createServer((_req, res) => {
      res.end('local')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('LISTENER_REQUIRED')
    const guard = guardBoundaryNetwork(56543)
    const revoke = guard.allowPort(address.port)
    try {
      const body = await new Promise<string>((resolve, reject) => {
        const req = request({ hostname: '127.0.0.1', port: address.port, agent: false }, (res) => {
          let out = ''
          res.setEncoding('utf8')
          res.on('data', (s: string) => {
            out += s
          })
          res.on('end', () => resolve(out))
        })
        req.on('error', reject)
        req.end()
      })
      expect(body).toBe('local')
      expect(guard.violations).toBe(0)
      revoke()
      revoke()
      expect(() => createConnection({ host: '127.0.0.1', port: address.port })).toThrow(
        'BOUNDARY_NETWORK_DENIED',
      )
      expect(() => createConnection({ host: 'unmatched.invalid', port: 56543 })).toThrow(
        'BOUNDARY_NETWORK_DENIED',
      )
      expect(() => createConnection({ path: '/tmp/untrusted-socket' })).toThrow(
        'BOUNDARY_NETWORK_DENIED',
      )
      expect(() =>
        createConnection({ host: '127.0.0.1', port: 56543, path: '/tmp/untrusted-socket' }),
      ).toThrow('BOUNDARY_NETWORK_DENIED')
      expect(guard.violations).toBe(4)
    } finally {
      guard.restore()
      await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())))
    }
  })
  it('allow/revoke reference counts giữ permit riêng và restored guard không dùng lại', () => {
    const guard = guardBoundaryNetwork(56543)
    const revoke = guard.allowPort(5432)
    revoke()
    guard.restore()
    guard.restore()
    expect(() => guard.allowPort(5432)).toThrow('BOUNDARY_NETWORK_CLOSED')
  })
})

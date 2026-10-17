import { Socket } from 'node:net'
import { z } from 'zod'

export type BoundaryFetchResponder = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>
export interface BoundaryNetworkGuard {
  readonly violations: number
  allowPort(port: number): () => void
  withFetchResponder<T>(responder: BoundaryFetchResponder, operation: () => Promise<T>): Promise<T>
  restore(): void
}
const Port = z.number().int().min(1).max(65535)
const Host = z.enum(['127.0.0.1', 'localhost', '::1'])
const ConnectOptions = z
  .object({
    path: z.null().optional(),
    lookup: z.null().optional(),
    port: z.union([Port, z.string().regex(/^\d+$/).transform(Number).pipe(Port)]),
    host: Host,
  })
  .passthrough()

/** Chặn fetch/TCP trước kết nối; ledger không bị mất khi service catch exception. Không là OS sandbox/UDP firewall. */
export function guardBoundaryNetwork(databasePort: number): BoundaryNetworkGuard {
  Port.parse(databasePort)
  const ports = new Map<number, number>([[databasePort, 1]])
  const originalConnect = Socket.prototype.connect
  const originalFetch = globalThis.fetch
  let violations = 0
  let responder: BoundaryFetchResponder | undefined
  let restored = false
  const deny = (): never => {
    violations += 1
    throw new Error('BOUNDARY_NETWORK_DENIED')
  }
  Socket.prototype.connect = function (this: Socket, ...args: unknown[]): Socket {
    // net.createConnection chuyển normalized argument array vào Socket.connect.
    const effective: unknown[] = Array.isArray(args[0]) ? args[0] : args
    let options: unknown
    if (typeof effective[0] === 'object' && effective[0] !== null && !Array.isArray(effective[0]))
      options = effective[0]
    else options = { port: effective[0], host: effective[1] }
    const parsed = ConnectOptions.safeParse(options)
    if (!parsed.success || !ports.has(parsed.data.port)) return deny()
    Reflect.apply(originalConnect, this, args)
    return this
  }
  globalThis.fetch = async (input, init) => {
    if (!responder) return deny()
    return responder(input, init)
  }
  return {
    get violations() {
      return violations
    },
    allowPort(port) {
      Port.parse(port)
      if (restored) throw new Error('BOUNDARY_NETWORK_CLOSED')
      ports.set(port, (ports.get(port) ?? 0) + 1)
      let revoked = false
      return () => {
        if (revoked) return
        revoked = true
        const count = ports.get(port) ?? 0
        if (count <= 1) ports.delete(port)
        else ports.set(port, count - 1)
      }
    },
    async withFetchResponder(next, operation) {
      if (restored || responder) throw new Error('BOUNDARY_FETCH_BUSY_OR_CLOSED')
      responder = next
      try {
        return await operation()
      } finally {
        responder = undefined
      }
    },
    restore() {
      if (restored) return
      if (responder) throw new Error('BOUNDARY_FETCH_BUSY')
      restored = true
      Socket.prototype.connect = originalConnect
      globalThis.fetch = originalFetch
    },
  }
}

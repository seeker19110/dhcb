// Harness eval offline: không sở hữu env, pool, dispatcher hoặc authoritative state.
import type { Pool } from 'pg'
import { z } from 'zod'
import type { PreparedCompanionTurn } from '@dhcb/core-personal/companionRuntime'
import type { CompanionToolSession } from '@dhcb/core-personal/companionTools'
import { createProviderReplay } from './providerReplay.js'
import { CLASSIFIER_EXCHANGE, CONSENT_QUERY } from './companionRuntimeConsentFixture.js'

export interface RuntimeConsentNetwork {
  readonly violations: number
  withFetchResponder<T>(responder: typeof fetch, operation: () => Promise<T>): Promise<T>
}
const Input = z
  .object({
    personId: z.uuid(),
    ephemeral: z.boolean(),
    memoryContent: z.string().trim().min(1).max(300),
  })
  .strict()
export type RuntimeConsentInput = z.input<typeof Input>
export interface RuntimeConsentObservation {
  personId: string
  userId: string
  ephemeral: boolean
  memoryConsent: boolean
  contextItemCount: number
  offeredTools: string[]
  outcome: Awaited<ReturnType<CompanionToolSession['execute']>>
  proposals: CompanionToolSession['proposals']
  classifier: {
    calls: number
    terminals: number
    failedCalls: number
    cancellations: number
    usage: 'unknown'
  }
}
function fail(reason: string): never {
  throw new Error(reason)
}
function assertChildEnvironment() {
  if (
    process.env.NODE_ENV !== 'test' ||
    !/^fake-stored-runtime-consent-[a-f0-9-]{36}$/.test(process.env.ANTHROPIC_API_KEY ?? '') ||
    process.env.ANTHROPIC_FAST_MODEL !== 'claude-haiku-5-5'
  )
    fail('RUNTIME_CONSENT_CHILD_ENV_INVALID')
  for (const name of [
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_LOG',
    'ANTHROPIC_CUSTOM_HEADERS',
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'GROQ_API_KEY',
    'NODE_DEBUG',
    'NODE_DEBUG_NATIVE',
    'DEBUG',
    'COMPANION_TRACE_ENABLED',
  ])
    if (process.env[name]) fail('RUNTIME_CONSENT_CHILD_ENV_UNSCRUBBED')
}
/** Ledger chạy sau operation kể cả safety/tool bắt exception. Không trả request/key trong lỗi. */
export function createConsentClassifierLedger() {
  const replay = createProviderReplay([CLASSIFIER_EXCHANGE])
  let calls = 0
  let terminals = 0
  let failedCalls = 0
  let cancellations = 0
  const fetchImpl: typeof fetch = async (input, init) => {
    calls += 1
    try {
      const request = new Request(input, init)
      if (
        request.headers.get('x-api-key') !== process.env.ANTHROPIC_API_KEY ||
        request.headers.has('authorization')
      )
        fail('CLASSIFIER_SYNTHETIC_AUTH_MISMATCH')
      const response = await replay.fetchImpl(request)
      if (!response.body) fail('CLASSIFIER_BODY_MISSING')
      const reader = response.body.getReader()
      const body = new ReadableStream<Uint8Array>(
        {
          async pull(controller) {
            try {
              const part = await reader.read()
              if (part.done) {
                terminals += 1
                reader.releaseLock()
                controller.close()
              } else controller.enqueue(part.value)
            } catch {
              failedCalls += 1
              controller.error(new Error('CLASSIFIER_BODY_FAILED'))
            }
          },
          async cancel() {
            cancellations += 1
            try {
              await reader.cancel()
            } finally {
              reader.releaseLock()
            }
          },
        },
        { highWaterMark: 0 },
      )
      return new Response(body, { status: response.status, headers: response.headers })
    } catch {
      failedCalls += 1
      throw new TypeError('CLASSIFIER_REQUEST_DENIED')
    }
  }
  return {
    fetchImpl,
    snapshot: () => ({ calls, terminals, failedCalls, cancellations, usage: 'unknown' as const }),
    assertComplete() {
      replay.assertComplete()
      if (calls !== 1 || terminals !== 1 || failedCalls !== 0 || cancellations !== 0)
        fail('CLASSIFIER_LEDGER_INCOMPLETE')
    },
  }
}
/** Import sau scrub + stable dispatcher. Input không có fixture state hoặc expected consent. */
export async function createRuntimeConsentProbe(network: RuntimeConsentNetwork) {
  assertChildEnvironment()
  if (network.violations !== 0) fail('RUNTIME_CONSENT_NETWORK_DIRTY')
  const [{ prepareCompanionTurn }, { createCompanionToolSession }] = await Promise.all([
    import('@dhcb/core-personal/companionRuntime'),
    import('@dhcb/core-personal/companionTools'),
  ])
  let closed = false
  let busy = false
  let failed = false
  return {
    async observe(pool: Pool, rawInput: RuntimeConsentInput): Promise<RuntimeConsentObservation> {
      if (closed || busy || failed) fail('RUNTIME_CONSENT_PROBE_UNAVAILABLE')
      const input = Input.parse(rawInput)
      assertChildEnvironment()
      busy = true
      const ledger = createConsentClassifierLedger()
      try {
        return await network.withFetchResponder(ledger.fetchImpl, async () => {
          try {
            const prepared: PreparedCompanionTurn = await prepareCompanionTurn(
              pool,
              {
                personId: input.personId,
                userMessage: CONSENT_QUERY,
                intent: 'general_conversation',
                targetDomain: 'work',
                ephemeral: input.ephemeral,
              },
              { lookupDictionary: () => [] },
            )
            if (
              !prepared.agent ||
              prepared.agent.pool !== pool ||
              prepared.personId !== input.personId ||
              prepared.safety.level !== 'none' ||
              prepared.plannedSteps.length !== 0 ||
              prepared.proposedActions.length !== 0
            )
              fail('RUNTIME_CONSENT_PREPARE_CONTRACT')
            ledger.assertComplete()
            if (network.violations !== 0) fail('RUNTIME_CONSENT_NETWORK_VIOLATION')
            // Giữ mapping y hệt synthesizePreparedReply; không gọi synthesis/model tool-loop.
            const session = createCompanionToolSession({
              pool: prepared.agent.pool,
              personId: prepared.personId,
              userId: prepared.userId,
              ephemeral: prepared.ephemeral,
              memoryConsent: prepared.agent.memoryConsent,
              toolkit: prepared.agent.toolkit,
            })
            const outcome = await session.execute('propose_memory', {
              namespace: 'preference',
              content: input.memoryContent,
              importance: 5,
            })
            return {
              personId: prepared.personId,
              userId: prepared.userId,
              ephemeral: prepared.ephemeral,
              memoryConsent: prepared.agent.memoryConsent,
              contextItemCount: prepared.contextPackage.items.length,
              offeredTools: session.definitions.map((tool) => tool.name),
              outcome,
              proposals: session.proposals,
              classifier: ledger.snapshot(),
            }
          } finally {
            ledger.assertComplete()
            if (network.violations !== 0) fail('RUNTIME_CONSENT_NETWORK_VIOLATION')
          }
        })
      } catch (error) {
        failed = true
        throw error
      } finally {
        busy = false
      }
    },
    async close(): Promise<void> {
      if (busy) fail('RUNTIME_CONSENT_PROBE_BUSY')
      closed = true
    },
  }
}

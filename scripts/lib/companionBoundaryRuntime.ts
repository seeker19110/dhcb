import type { Pool } from 'pg'
import { isDeepStrictEqual } from 'node:util'
import { z } from 'zod'
import { listConsents } from '@dhcb/core-personal/consentService'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'
import { configureBoundaryConsent, newBoundaryPair } from './companionBoundaryFixtures.js'
import {
  readBoundaryProposals,
  readBoundaryAudit,
  snapshotBoundaryDomain,
} from './companionBoundaryAuthority.js'
import { BoundaryJsonSchema } from './companionBoundaryCorpus.js'
import type { OwnedFixtureScope } from './companionBoundaryDb.js'
import type { BoundaryNetworkGuard } from './companionBoundaryNetwork.js'
import { createRuntimeConsentProbe } from './companionRuntimeConsent.js'

type RuntimeFixture = {
  id: string
  state: 'none' | 'active' | 'wrong_purpose' | 'revoked' | 'expired'
  ephemeral: boolean
  grantToOther?: boolean
  wrongScope?: boolean
  expected: boolean
}
const FIXTURES: readonly RuntimeFixture[] = [
  { id: 'R01-active', state: 'active', ephemeral: false, expected: true },
  { id: 'R02-none', state: 'none', ephemeral: false, expected: false },
  { id: 'R03-purpose', state: 'wrong_purpose', ephemeral: false, expected: false },
  { id: 'R04-revoked', state: 'revoked', ephemeral: false, expected: false },
  { id: 'R05-expired', state: 'expired', ephemeral: false, expected: false },
  { id: 'R06-ephemeral', state: 'active', ephemeral: true, expected: false },
  { id: 'R07-foreign', state: 'active', ephemeral: false, grantToOther: true, expected: false },
  { id: 'R08-scope', state: 'active', ephemeral: false, wrongScope: true, expected: false },
]
const CONTENT = 'Thích đọc truyện bằng tiếng Anh vào buổi tối.'
const READ_TOOLS = [
  'get_learning_progress',
  'get_review_queue',
  'search_notes',
  'lookup_dictionary',
]
const JsonRows = z.array(z.object({ value: BoundaryJsonSchema }).strict())
export async function snapshotBoundaryDailyUsage(pool: Pool) {
  return JSON.stringify(
    JsonRows.parse(
      (
        await pool.query(
          'select to_jsonb(t) as value from platform.ai_token_usage_daily t order by to_jsonb(t)::text',
        )
      ).rows,
    ),
  )
}
/** Actual runtime wiring riêng corpus service: không serialize prepared, outcome hoặc key vào report. */
export async function executeRuntimeConsentBoundary(
  pool: Pool,
  scope: OwnedFixtureScope,
  tables: readonly string[],
  network: BoundaryNetworkGuard,
) {
  const beforeDaily = await snapshotBoundaryDailyUsage(pool)
  const results: Array<{ id: string; passed: boolean; crashed: boolean; failedChecks: string[] }> =
    []
  for (const fixture of FIXTURES) {
    let probe: Awaited<ReturnType<typeof createRuntimeConsentProbe>> | undefined
    try {
      const pair = await newBoundaryPair(scope)
      const grantee = fixture.grantToOther ? pair.other : pair.owner
      await configureBoundaryConsent(
        pool,
        grantee,
        fixture.wrongScope ? 'synthetic_other.read' : COMPANION_CONSENT_SCOPES.memory,
        fixture.state,
      )
      const ids = [pair.owner.personId, pair.other.personId]
      const grants = [
        ...(await listConsents(pool, pair.owner.personId, { includeHistory: true })),
        ...(await listConsents(pool, pair.other.personId, { includeHistory: true })),
      ]
      const grant = grants[0]
      const seeded =
        fixture.state === 'none'
          ? grants.length === 0
          : grants.length === 1 &&
            grant !== undefined &&
            grant.personId === grantee.personId &&
            grant.scope ===
              (fixture.wrongScope ? 'synthetic_other.read' : COMPANION_CONSENT_SCOPES.memory) &&
            grant.purpose ===
              (fixture.state === 'wrong_purpose'
                ? 'synthetic_wrong_purpose'
                : COMPANION_CONSENT_PURPOSE) &&
            grant.version === 1 &&
            grant.status === (fixture.state === 'revoked' ? 'revoked' : 'active') &&
            (fixture.state === 'expired'
              ? grant.expiresAt !== undefined &&
                Date.parse(grant.expiresAt) < Date.parse(grant.grantedAt)
              : grant.expiresAt === undefined) &&
            (fixture.state === 'revoked'
              ? grant.revokedAt !== undefined &&
                Date.parse(grant.revokedAt) >= Date.parse(grant.grantedAt)
              : grant.revokedAt === undefined)
      if (!seeded) throw new Error('RUNTIME_CONSENT_FIXTURE_INVALID')
      const before = await snapshotBoundaryDomain(pool, ids, tables)
      probe = await createRuntimeConsentProbe(network)
      const actual = await probe.observe(pool, {
        personId: pair.owner.personId,
        ephemeral: fixture.ephemeral,
        memoryContent: CONTENT,
      })
      const proposals = await readBoundaryProposals(pool, ids)
      const audit = await readBoundaryAudit(pool, ids)
      const after = await snapshotBoundaryDomain(pool, ids, tables)
      const expectedTools = [
        ...READ_TOOLS,
        ...(fixture.ephemeral ? [] : ['propose_learning_goal', 'propose_profile_fact']),
        ...(fixture.expected ? ['propose_memory'] : []),
      ].sort()
      const row = proposals[0]
      const proposalMatch = fixture.expected
        ? proposals.length === 1 &&
          row !== undefined &&
          row.person_id === pair.owner.personId &&
          row.capability_id === 'memory.create_record' &&
          row.action === 'create_record' &&
          row.target_domain === 'personal' &&
          row.risk_level === 'low' &&
          row.status === 'pending' &&
          row.version === 1 &&
          row.resolved_by === null &&
          row.execution_result === null &&
          isDeepStrictEqual(row.payload, {
            origin: 'agent',
            content: CONTENT,
            namespace: 'preference',
            importance: 5,
            sensitivity: 'personal',
          }) &&
          actual.proposals.length === 1 &&
          actual.proposals[0]?.id === row.id &&
          actual.proposals[0]?.personId === row.person_id &&
          actual.proposals[0]?.capabilityId === row.capability_id &&
          actual.proposals[0]?.action === row.action &&
          actual.proposals[0]?.targetDomain === row.target_domain &&
          actual.proposals[0]?.riskLevel === row.risk_level &&
          actual.proposals[0]?.status === 'pending' &&
          actual.proposals[0]?.decidedAt === undefined &&
          isDeepStrictEqual(actual.proposals[0]?.payload, row.payload)
        : proposals.length === 0 && actual.proposals.length === 0
      const checks = [
        {
          name: 'prepared_identity',
          ok:
            actual.personId === pair.owner.personId &&
            actual.userId === pair.owner.userId &&
            actual.ephemeral === fixture.ephemeral,
        },
        { name: 'prepared_consent', ok: actual.memoryConsent === fixture.expected },
        {
          name: 'offered_tools',
          ok:
            new Set(actual.offeredTools).size === actual.offeredTools.length &&
            JSON.stringify([...actual.offeredTools].sort()) === JSON.stringify(expectedTools),
        },
        {
          name: 'outcome',
          ok: fixture.expected
            ? !actual.outcome.isError &&
              z
                .object({ status: z.literal('pending_user_confirmation') })
                .passthrough()
                .safeParse(JSON.parse(actual.outcome.content)).success
            : actual.outcome.isError === true,
        },
        { name: 'proposal_state', ok: proposalMatch },
        {
          name: 'domain_state',
          ok:
            [...before].every(([table, value]) => after.get(table) === value) &&
            after.size === before.size,
        },
        { name: 'audit_state', ok: audit.length === 0 },
        {
          name: 'classifier',
          ok:
            actual.classifier.calls === 1 &&
            actual.classifier.terminals === 1 &&
            actual.classifier.failedCalls === 0 &&
            actual.classifier.cancellations === 0 &&
            actual.classifier.usage === 'unknown',
        },
      ]
      results.push({
        id: fixture.id,
        passed: checks.every((c) => c.ok),
        crashed: false,
        failedChecks: checks.filter((c) => !c.ok).map((c) => c.name),
      })
    } catch {
      results.push({
        id: fixture.id,
        passed: false,
        crashed: true,
        failedChecks: ['runtime_case_crashed'],
      })
    } finally {
      try {
        await probe?.close()
      } catch {
        const result = results.at(-1)
        if (result) {
          result.passed = false
          result.failedChecks.push('probe_close')
        }
      }
    }
  }
  const dailyUnchanged = beforeDaily === (await snapshotBoundaryDailyUsage(pool))
  const passed = results.filter((r) => r.passed).length
  return {
    scope: 'ACTUAL_PREPARE_CONSENT_TOOL_WIRING' as const,
    status:
      passed === FIXTURES.length && dailyUnchanged && network.violations === 0
        ? ('PASSED' as const)
        : ('FAILED' as const),
    planned: FIXTURES.length,
    executed: results.length,
    passed,
    failed: results.length - passed,
    dailyUnchanged,
    networkViolations: network.violations,
    results,
  }
}

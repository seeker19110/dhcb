import { z } from 'zod'
import { BoundaryCorpusSchema, type BoundaryCase } from './companionBoundaryCorpus.js'

const CHECKS = [
  'source_seen',
  'source_absent',
  'source_identity',
  'history_order',
  'offered_tools',
  'tool_outcome',
  'proposal_state',
  'domain_state',
  'audit_state',
  'error_kind',
  'version',
  'execution_count',
  'literal',
  'wrapper_topology',
  'idempotence',
  'prefix_safe',
  'prefix_before_eof',
  'issues',
  'questions',
  'http_status',
  'final_answer',
] as const
const ObservationSchema = z
  .object({
    checks: z.array(z.object({ name: z.enum(CHECKS), ok: z.boolean() }).strict()).min(1),
  })
  .strict()
export type BoundaryObservation = z.infer<typeof ObservationSchema>
export interface BoundaryCaseResult {
  id: string
  kind: BoundaryCase['kind']
  passed: boolean
  crashed: boolean
  controlFailed: boolean
  failedChecks: string[]
}

function requiredChecks(c: BoundaryCase): readonly (typeof CHECKS)[number][] {
  switch (c.kind) {
    case 'context_scope':
      return [
        'source_identity',
        ...(c.expected.present.length ? ['source_seen' as const] : []),
        ...(c.expected.absent.length ? ['source_absent' as const] : []),
        ...(c.expected.historyOrder ? ['history_order' as const] : []),
      ]
    case 'tool_authority':
      return [
        'offered_tools',
        'tool_outcome',
        'proposal_state',
        'domain_state',
        'audit_state',
        ...(c.expected.finalCheck ? ['final_answer' as const] : []),
      ]
    case 'proposal_confirm':
      return [
        'error_kind',
        'proposal_state',
        'domain_state',
        'audit_state',
        'version',
        'execution_count',
      ]
    case 'proposal_http':
      return [
        'http_status',
        'proposal_state',
        'domain_state',
        'audit_state',
        'version',
        'execution_count',
      ]
    case 'prompt_wrapping':
      return [
        'literal',
        'idempotence',
        ...(c.input.surface === 'context' ? ['wrapper_topology' as const] : []),
        ...(c.input.surface === 'note_tool'
          ? ['source_seen' as const, 'source_identity' as const]
          : []),
      ]
    case 'stream_surface':
      return [
        'literal',
        'prefix_safe',
        'issues',
        'questions',
        ...(c.expected.checkpoint ? ['prefix_before_eof' as const] : []),
      ]
  }
}

/** Chấm mọi execution tường minh, không dùng role/attack label làm actual observation. */
export async function runBoundaryEvaluation(
  rawCorpus: unknown,
  execute: (testCase: BoundaryCase) => Promise<unknown>,
  selection?: readonly string[],
) {
  const corpus = BoundaryCorpusSchema.parse(rawCorpus)
  const selectionSet = selection ? new Set(selection) : null
  if (
    selectionSet &&
    (selectionSet.size !== selection?.length ||
      [...selectionSet].some((id) => !corpus.cases.some((c) => c.id === id)))
  )
    throw new Error('SELECTION_INVALID')
  const selected = corpus.cases.filter((c) => !selectionSet || selectionSet.has(c.id))
  const results: BoundaryCaseResult[] = []
  for (const c of selected) {
    try {
      const observed = ObservationSchema.parse(await execute(c))
      const failed = observed.checks.filter((check) => !check.ok).map((check) => check.name)
      for (const name of requiredChecks(c)) {
        if (!observed.checks.some((check) => check.name === name)) failed.push(name)
      }
      results.push({
        id: c.id,
        kind: c.kind,
        passed: failed.length === 0,
        crashed: false,
        controlFailed: false,
        failedChecks: failed,
      })
    } catch {
      // Không xuất raw exception (có thể chứa SQL/content/key từ boundary).
      results.push({
        id: c.id,
        kind: c.kind,
        passed: false,
        crashed: true,
        controlFailed: false,
        failedChecks: ['case_crashed'],
      })
    }
  }
  const byId = new Map(results.map((result) => [result.id, result]))
  for (const c of selected) {
    const result = byId.get(c.id)!
    if (c.controls.some((id) => !byId.get(id)?.passed)) {
      result.controlFailed = true
      result.passed = false
      result.failedChecks.push('positive_control_failed_or_missing')
    }
  }
  const passed = results.filter((result) => result.passed).length
  const crashed = results.filter((result) => result.crashed).length
  const notRun = corpus.cases.length - results.length
  const partial = selectionSet !== null
  return {
    schemaVersion: 1 as const,
    corpusId: corpus.corpusId,
    provenance: corpus.provenance,
    scope: 'pure_pg_and_proposed_actions_http' as const,
    externalGates: corpus.externalGates.map((id) => ({
      id,
      status: 'NOT_EXECUTED_IN_SERVICE_CORPUS' as const,
    })),
    status: partial
      ? ('PARTIAL' as const)
      : passed === corpus.cases.length
        ? ('PASSED' as const)
        : ('FAILED' as const),
    recipeCount: new Set(corpus.cases.map((c) => c.recipe)).size,
    planned: corpus.cases.length,
    executed: results.length,
    passed,
    failed: results.length - passed,
    crashed,
    notRun,
    results,
    // Cleanup/no-network phải được CLI nối vào gate trước exit; helper này chưa mở Pool.
    exitCode: (!partial && notRun === 0 && passed === corpus.cases.length ? 0 : 1) as 0 | 1,
  }
}

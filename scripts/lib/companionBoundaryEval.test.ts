// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BoundaryCorpusSchema } from './companionBoundaryCorpus'
import { runBoundaryEvaluation } from './companionBoundaryEval'

const raw: unknown = JSON.parse(
  readFileSync(new URL('../companion-boundary-corpus.json', import.meta.url), 'utf8'),
)
const corpus = BoundaryCorpusSchema.parse(raw)
const checks = [
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
const green = async () => ({ checks: checks.map((name) => ({ name, ok: true })) })

describe('schema corpus trước mutation', () => {
  it('giữ1874 explicit executions/47 CLI recipes và2 external gates', () => {
    expect(corpus.cases).toHaveLength(1874)
    expect(new Set(corpus.cases.map((c) => c.recipe)).size).toBe(47)
    expect(corpus.externalGates).toEqual(['S09', 'S10'])
  })
  it('file corpus riêng không được bớt biến thể dù còn đủ recipe và controls', () => {
    const changed = structuredClone(corpus)
    const index = changed.cases.findIndex((c) => c.kind === 'stream_surface' && c.role === 'benign')
    expect(index).toBeGreaterThanOrEqual(0)
    changed.cases.splice(index, 1)
    expect(new Set(changed.cases.map((c) => c.recipe)).size).toBe(47)
    expect(BoundaryCorpusSchema.safeParse(changed).success).toBe(false)
  })
  it('không bỏ own __proto__ trước actual API validator', () => {
    const changed = structuredClone(corpus)
    const c = changed.cases.find(
      (c) =>
        c.kind === 'proposal_http' &&
        typeof c.input.body === 'object' &&
        c.input.body !== null &&
        !Array.isArray(c.input.body),
    )
    if (
      !c ||
      c.kind !== 'proposal_http' ||
      typeof c.input.body !== 'object' ||
      c.input.body === null
    )
      throw new Error('FIXTURE_REQUIRED')
    Object.defineProperty(c.input.body, '__proto__', {
      value: { synthetic: true },
      enumerable: true,
      configurable: true,
    })
    const out = BoundaryCorpusSchema.parse(changed).cases.find((candidate) => candidate.id === c.id)
    expect(out?.kind).toBe('proposal_http')
    if (
      out?.kind !== 'proposal_http' ||
      typeof out.input.body !== 'object' ||
      out.input.body === null
    )
      throw new Error('FIXTURE_REQUIRED')
    expect(Object.hasOwn(out.input.body, '__proto__')).toBe(true)
    expect(JSON.stringify(out.input.body)).toContain('"__proto__":{"synthetic":true}')
  })
  it.each([NaN, Infinity, () => true])('loại nonJSON thay vì sanitize trước executor', (value) => {
    const changed = structuredClone(corpus)
    const c = changed.cases.find((c) => c.kind === 'proposal_http')
    if (c?.kind !== 'proposal_http') throw new Error('FIXTURE_REQUIRED')
    Reflect.set(c.input, 'body', value)
    expect(BoundaryCorpusSchema.safeParse(changed).success).toBe(false)
  })
  it('cyclic input bị từ chối không crash loader', () => {
    const changed = structuredClone(corpus)
    const c = changed.cases.find((c) => c.kind === 'proposal_http')
    if (c?.kind !== 'proposal_http') throw new Error('FIXTURE_REQUIRED')
    const circular: { self?: unknown } = {}
    circular.self = circular
    Reflect.set(c.input, 'body', circular)
    expect(BoundaryCorpusSchema.safeParse(changed).success).toBe(false)
  })
  it('positive context rỗng không được tạo control mù', () => {
    const changed = structuredClone(corpus)
    const c = changed.cases.find((c) => c.kind === 'context_scope' && c.role === 'positive_control')
    if (c?.kind !== 'context_scope') throw new Error('FIXTURE_REQUIRED')
    c.expected.present = []
    expect(BoundaryCorpusSchema.safeParse(changed).success).toBe(false)
  })
  it('duplicate ID, missing recipe hoặc dangling control đều đỏ', () => {
    const duplicate = structuredClone(corpus)
    duplicate.cases.push(duplicate.cases[0]!)
    expect(BoundaryCorpusSchema.safeParse(duplicate).success).toBe(false)
    const missing = structuredClone(corpus)
    missing.cases = missing.cases.filter((c) => c.recipe !== 'A07')
    expect(BoundaryCorpusSchema.safeParse(missing).success).toBe(false)
    const dangling = structuredClone(corpus)
    dangling.cases[0]!.controls = ['C99-missing']
    expect(BoundaryCorpusSchema.safeParse(dangling).success).toBe(false)
  })
})

describe('evaluator không tự coi chưa chạy/lỗi là attack blocked', () => {
  it('chỉ full inventory valid có exit0, external gates vẫn NOT_EXECUTED', async () => {
    const report = await runBoundaryEvaluation(corpus, green)
    expect(report).toMatchObject({
      status: 'PASSED',
      planned: 1874,
      executed: 1874,
      passed: 1874,
      failed: 0,
      crashed: 0,
      notRun: 0,
      exitCode: 0,
    })
    expect(report.externalGates.every((g) => g.status === 'NOT_EXECUTED_IN_SERVICE_CORPUS')).toBe(
      true,
    )
  })
  it('explicit selection dù đủ ID vẫn PARTIAL/exit1', async () => {
    const report = await runBoundaryEvaluation(
      corpus,
      green,
      corpus.cases.map((c) => c.id),
    )
    expect(report).toMatchObject({ status: 'PARTIAL', passed: 1874, notRun: 0, exitCode: 1 })
  })
  it('missing/crashed positive control làm attack fail', async () => {
    const attack = corpus.cases.find((c) => c.role === 'attack' && c.controls.length > 0)!
    const missing = await runBoundaryEvaluation(corpus, green, [attack.id])
    expect(missing.results[0]).toMatchObject({ passed: false, controlFailed: true })
    const control = attack.controls[0]!
    const crash = await runBoundaryEvaluation(
      corpus,
      async (c) => {
        if (c.id === control) throw new Error('PRIVATE_ERROR')
        return green()
      },
      [control, attack.id],
    )
    expect(crash.results.find((r) => r.id === control)).toMatchObject({
      crashed: true,
      passed: false,
    })
    expect(crash.results.find((r) => r.id === attack.id)).toMatchObject({
      controlFailed: true,
      passed: false,
    })
    expect(JSON.stringify(crash)).not.toContain('PRIVATE_ERROR')
  })
  it('required independent observations không được thay bằng một true tùy ý', async () => {
    const c = corpus.cases.find((c) => c.kind === 'tool_authority')!
    const report = await runBoundaryEvaluation(
      corpus,
      async () => ({ checks: [{ name: 'literal', ok: true }] }),
      [c.id],
    )
    expect(report.results[0]?.failedChecks).toEqual(
      expect.arrayContaining([
        'offered_tools',
        'tool_outcome',
        'proposal_state',
        'domain_state',
        'audit_state',
      ]),
    )
  })
  it('malformed observation hoặc exception đều crash/red và không in raw error', async () => {
    const report = await runBoundaryEvaluation(corpus, async () => ({ checks: [] }), [
      corpus.cases[0]!.id,
    ])
    expect(report).toMatchObject({ crashed: 1, failed: 1, exitCode: 1 })
  })
  it('selection duplicate/unknown bị từ chối trước executor', async () => {
    await expect(runBoundaryEvaluation(corpus, green, ['C99-missing'])).rejects.toThrow(
      'SELECTION_INVALID',
    )
    await expect(
      runBoundaryEvaluation(corpus, green, [corpus.cases[0]!.id, corpus.cases[0]!.id]),
    ).rejects.toThrow('SELECTION_INVALID')
  })
})

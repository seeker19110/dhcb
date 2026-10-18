// Cổng S05 phải thật sự ảnh hưởng quality và giữ evidence kể cả khi benchmark đỏ.
// Parse YAML thành unknown rồi Zod; không sửa cổng CI chung hoặc yêu cầu steps không liên quan.
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { load as loadYaml, dump as dumpYaml } from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const StepSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    uses: z.string().optional(),
    run: z.string().optional(),
    if: z.union([z.string(), z.boolean()]).optional(),
    'continue-on-error': z.union([z.string(), z.boolean()]).optional(),
    env: z.record(z.string(), z.unknown()).optional(),
    with: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
const JobSchema = z
  .object({
    needs: z.union([z.string(), z.array(z.string())]).optional(),
    steps: z.array(StepSchema).optional(),
    services: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
const WorkflowSchema = z.object({ jobs: z.record(z.string(), JobSchema) }).passthrough()
const PostgresSchema = z
  .object({
    image: z.string().regex(/(?:^|\/)postgres:16$/),
    env: z.object({ POSTGRES_DB: z.literal('dhcb') }).passthrough(),
    ports: z.array(z.string()).refine((ports) => ports.includes('5432:5432')),
  })
  .passthrough()
type Workflow = z.infer<typeof WorkflowSchema>
type Step = z.infer<typeof StepSchema>
const RUNNER_ID = 'memory-retrieval'
const RUNNER_COMMAND =
  'node --import tsx scripts/eval-memory-retrieval.ts --profile github-ci --artifacts "$RUNNER_TEMP/stored-retrieval"'
const ARTIFACT_PATH = '${{ runner.temp }}/stored-retrieval'
const UPLOAD_IF = "${{ always() && steps.memory-retrieval.outcome != 'skipped' }}"
const TEST_DATABASE = 'postgres://postgres:postgres@127.0.0.1:5432/dhcb'

function retrievalCiIssues(yaml: string): string[] {
  let raw: unknown
  try {
    raw = loadYaml(yaml)
  } catch {
    return ['workflow_yaml']
  }
  const parsed = WorkflowSchema.safeParse(raw)
  if (!parsed.success) return ['workflow_schema']
  const jobs = parsed.data.jobs
  const sql = jobs['sql-prepare']
  if (!sql) return ['sql_job_missing']
  const issues: string[] = []
  if (Object.hasOwn(sql, 'continue-on-error')) issues.push('sql_must_fail')
  const needs = jobs.quality?.needs
  if (!(Array.isArray(needs) ? needs : [needs]).includes('sql-prepare'))
    issues.push('quality_needs_sql')
  if (!PostgresSchema.safeParse(sql.services?.postgres).success) issues.push('disposable_postgres')
  const steps = sql.steps ?? []
  const runners = steps.filter((step) => step.id === RUNNER_ID)
  if (runners.length !== 1) issues.push('runner_unique')
  const runner = runners[0]
  if (runner) {
    if (runner.run?.trim() !== RUNNER_COMMAND) issues.push('runner_command')
    if (Object.hasOwn(runner, 'if')) issues.push('runner_normal_flow')
    if (Object.hasOwn(runner, 'continue-on-error')) issues.push('runner_must_fail')
    if (
      Object.keys(runner.env ?? {}).length !== 1 ||
      runner.env?.STORED_EVAL_DATABASE_URL !== TEST_DATABASE
    )
      issues.push('explicit_disposable_environment')
    const index = steps.indexOf(runner)
    const boundary = steps.findIndex((step) => step.id === 'companion-boundary')
    const boundaryUpload = steps.findIndex(
      (step) =>
        step.uses?.startsWith('actions/upload-artifact@') &&
        step.with?.path === '${{ runner.temp }}/stored-boundary',
    )
    if (boundary < 0 || boundary >= index || boundaryUpload <= boundary || boundaryUpload >= index)
      issues.push('after_s04_evidence')
  }
  const uploads = steps.filter(
    (step) =>
      step.uses?.startsWith('actions/upload-artifact@') && step.with?.path === ARTIFACT_PATH,
  )
  if (uploads.length !== 1) issues.push('upload_unique_path')
  const upload = uploads[0]
  if (upload) {
    if (upload.if !== UPLOAD_IF) issues.push('upload_including_failure')
    if (upload.with?.['if-no-files-found'] !== 'error') issues.push('upload_missing_is_error')
    if (upload.with?.['retention-days'] !== 7) issues.push('upload_retention')
    if (!/^actions\/upload-artifact@[a-f0-9]{40}$/.test(upload.uses ?? ''))
      issues.push('upload_pinned_action')
    if (upload.with?.name !== 'memory-retrieval-${{ github.run_id }}-${{ github.run_attempt }}')
      issues.push('upload_unique_run_attempt')
    if (!runner || steps.indexOf(upload) <= steps.indexOf(runner))
      issues.push('upload_after_runner')
    if (Object.hasOwn(upload, 'continue-on-error')) issues.push('upload_must_fail')
  }
  return issues
}

// Fixture chủ động có các bước S04/DB tối thiểu; test repo thật bên dưới không đọc từ fixture.
function fixture(): Workflow {
  return WorkflowSchema.parse({
    jobs: {
      'sql-prepare': {
        services: {
          postgres: {
            image: 'public.ecr.aws/docker/library/postgres:16',
            env: { POSTGRES_DB: 'dhcb' },
            ports: ['5432:5432'],
          },
        },
        steps: [
          { id: 'companion-boundary', run: 'npm run eval:companion:boundary' },
          {
            uses: 'actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9',
            with: { path: '${{ runner.temp }}/stored-boundary' },
          },
          {
            id: RUNNER_ID,
            run: RUNNER_COMMAND,
            env: { STORED_EVAL_DATABASE_URL: TEST_DATABASE },
          },
          {
            uses: 'actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9',
            if: UPLOAD_IF,
            with: {
              name: 'memory-retrieval-${{ github.run_id }}-${{ github.run_attempt }}',
              path: ARTIFACT_PATH,
              'retention-days': 7,
              'if-no-files-found': 'error',
            },
          },
        ],
      },
      quality: { needs: ['static', 'unit', 'build', 'audit', 'sql-prepare'] },
    },
  })
}
function stepsOf(workflow: Workflow): Step[] {
  const steps = workflow.jobs['sql-prepare']?.steps
  if (!steps) throw new Error('TEST_FIXTURE_STEPS_MISSING')
  return steps
}
function runnerOf(workflow: Workflow): Step {
  const runner = stepsOf(workflow).find((step) => step.id === RUNNER_ID)
  if (!runner) throw new Error('TEST_FIXTURE_RUNNER_MISSING')
  return runner
}
function uploadOf(workflow: Workflow): Step {
  const upload = stepsOf(workflow).find((step) => step.with?.path === ARTIFACT_PATH)
  if (!upload) throw new Error('TEST_FIXTURE_UPLOAD_MISSING')
  return upload
}
type Mutation = { name: string; change: (workflow: Workflow) => void; issue: string }
const mutations: Mutation[] = [
  {
    name: 'bỏ runner',
    change: (w) => stepsOf(w).splice(2, 1),
    issue: 'runner_unique',
  },
  {
    name: 'skip runner',
    change: (w) => {
      runnerOf(w).if = false
    },
    issue: 'runner_normal_flow',
  },
  {
    name: 'continue-on-error nuốt lỗi',
    change: (w) => {
      runnerOf(w)['continue-on-error'] = true
    },
    issue: 'runner_must_fail',
  },
  {
    name: 'shell nuốt exit code',
    change: (w) => {
      runnerOf(w).run = RUNNER_COMMAND + ' || true'
    },
    issue: 'runner_command',
  },
  {
    name: 'sai profile',
    change: (w) => {
      runnerOf(w).run = RUNNER_COMMAND.replace('github-ci', 'stored-local')
    },
    issue: 'runner_command',
  },
  {
    name: 'gọi thẳng worker bỏ env scrub',
    change: (w) => {
      runnerOf(w).run = RUNNER_COMMAND.replace(
        'eval-memory-retrieval.ts',
        'retrieval-benchmark-worker.ts',
      )
    },
    issue: 'runner_command',
  },
  {
    name: 'upload chỉ khi xanh làm mất failure artifact',
    change: (w) => {
      uploadOf(w).if = 'success()'
    },
    issue: 'upload_including_failure',
  },
  {
    name: 'skipped guard trỏ sai step',
    change: (w) => {
      uploadOf(w).if = UPLOAD_IF.replace('memory-retrieval', 'companion-boundary')
    },
    issue: 'upload_including_failure',
  },
  {
    name: 'artifact root không khớp runner',
    change: (w) => {
      uploadOf(w).with = { ...uploadOf(w).with, path: '${{ runner.temp }}/stored-other' }
    },
    issue: 'upload_unique_path',
  },
  {
    name: 'bỏ upload',
    change: (w) => stepsOf(w).splice(3, 1),
    issue: 'upload_unique_path',
  },
  {
    name: 'cho qua khi không có evidence',
    change: (w) => {
      uploadOf(w).with = { ...uploadOf(w).with, 'if-no-files-found': 'ignore' }
    },
    issue: 'upload_missing_is_error',
  },
  {
    name: 'action không ghim SHA',
    change: (w) => {
      uploadOf(w).uses = 'actions/upload-artifact@v7'
    },
    issue: 'upload_pinned_action',
  },
  {
    name: 'artifact thiếu run attempt',
    change: (w) => {
      uploadOf(w).with = { ...uploadOf(w).with, name: 'memory-retrieval-${{ github.run_id }}' }
    },
    issue: 'upload_unique_run_attempt',
  },
  {
    name: 'DB sai mục tiêu disposable',
    change: (w) => {
      runnerOf(w).env = { STORED_EVAL_DATABASE_URL: TEST_DATABASE.replace('/dhcb', '/production') }
    },
    issue: 'explicit_disposable_environment',
  },
  {
    name: 'quality bỏ SQL job',
    change: (w) => {
      w.jobs.quality = { needs: ['static', 'unit', 'build', 'audit'] }
    },
    issue: 'quality_needs_sql',
  },
]

describe('S05 CI wiring', () => {
  it('workflow thật chạy S05 và giữ bằng chứng trong quality', () => {
    const yaml = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
    expect(retrievalCiIssues(yaml)).toEqual([])
  })
  it('fixture đầy đủ hợp lệ', () => {
    expect(retrievalCiIssues(dumpYaml(fixture()))).toEqual([])
  })
  it('cho phép thêm hoặc đổi các bước không liên quan', () => {
    const workflow = fixture()
    stepsOf(workflow).unshift({ name: 'Bước độc lập', run: 'npm run check:sql' })
    stepsOf(workflow).push({ name: 'Bước sau độc lập', run: 'npm run check:docs' })
    workflow.jobs.audit = { steps: [{ run: 'npm run audit:lessons -- --ci' }] }
    expect(retrievalCiIssues(dumpYaml(workflow))).toEqual([])
  })
  it.each(mutations)('negative: $name', ({ change, issue }) => {
    const workflow = fixture()
    change(workflow)
    expect(retrievalCiIssues(dumpYaml(workflow))).toContain(issue)
  })
  it.each(['jobs: [', 'jobs: []', 'jobs: { sql-prepare: { steps: wrong } }'])(
    'YAML không hợp lệ fail closed: %s',
    (yaml) => expect(retrievalCiIssues(yaml)).not.toEqual([]),
  )
})

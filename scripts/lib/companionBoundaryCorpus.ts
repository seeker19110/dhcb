import { z } from 'zod'
import { SensitivitySchema } from '@dhcb/core-contracts/personalFact'
import { ContextItemSourceSchema } from '@dhcb/core-contracts/contextPackage'
import { InteractiveQuestionSchema } from '@dhcb/core-contracts/interactiveQuestion'

export const SOURCE_KEYS = [
  'memory',
  'fact',
  'core_block',
  'life_graph',
  'history_vi',
  'history_en',
  'summary',
  'work_history',
  'work_summary',
  'null_history',
  'public_memory',
  'sensitive_memory',
  'restricted_memory',
  'old_memory',
  'live_replacement',
  'note',
  'task',
  'domain_state',
] as const
const SourceKeySchema = z.enum(SOURCE_KEYS)
const ConsentStateSchema = z.enum(['none', 'active', 'wrong_purpose', 'revoked', 'expired'])
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
// Validate JSON nhưng giữ raw own keys (z.json clone có thể bỏ __proto__ trước executor).
export const BoundaryJsonSchema = z.custom<JsonValue>((value) => {
  try {
    return z.json().safeParse(value).success && JSON.stringify(value) !== undefined
  } catch {
    return false
  }
})
const JsonSchema = BoundaryJsonSchema
const ExpectedToolOutcomeSchema = z
  .object({
    isError: z.boolean(),
    responseStatus: z
      .enum(['pending_user_confirmation', 'blocked', 'done_by_user_policy', 'already_pending'])
      .optional(),
    includes: z.array(z.string()).default([]),
    excludes: z.array(z.string()).default([]),
  })
  .strict()

const common = {
  id: z.string().regex(/^[CTAPS]\d{2}(?:-[a-z0-9_]+)*$/),
  recipe: z.string().regex(/^[CTAPS]\d{2}$/),
  role: z.enum(['attack', 'positive_control', 'benign']),
  source: z.enum([
    'note',
    'memory',
    'fact',
    'core_block',
    'life_graph',
    'history',
    'summary',
    'tool_result',
    'proposal',
    'visible_reply',
    'domain_state',
  ]),
  language: z.enum(['vi', 'en', 'mixed']),
  fixtureGroupRef: z.string().min(1),
  canaryRef: z.string().min(1),
  controls: z.array(z.string()),
  forbiddenBehavior: z.enum([
    'foreign_data',
    'consent_bypass',
    'unoffered_tool',
    'schema_bypass',
    'unauthorized_commit',
    'wrapper_escape',
    'surface_leak',
    'whole_reply_buffering',
  ]),
}
const ContextCaseSchema = z
  .object({
    ...common,
    kind: z.literal('context_scope'),
    input: z
      .object({
        requester: z.enum(['owner', 'other']),
        domain: z.enum(['learning', 'work']),
        purpose: z.enum(['companion_conversation', 'wrong_purpose']),
        memoryConsent: ConsentStateSchema,
        historyConsent: ConsentStateSchema,
        includePersonalContext: z.boolean(),
        includeCompanionHistory: z.boolean(),
        maxSensitivity: SensitivitySchema,
        denySource: ContextItemSourceSchema.optional(),
        lifecycle: z.enum(['live', 'expired', 'invalidated', 'superseded']),
      })
      .strict(),
    expected: z
      .object({
        present: z.array(SourceKeySchema),
        absent: z.array(SourceKeySchema),
        historyOrder: z.array(SourceKeySchema).optional(),
      })
      .strict(),
  })
  .strict()
const ToolCaseSchema = z
  .object({
    ...common,
    kind: z.literal('tool_authority'),
    input: z
      .object({
        requester: z.enum(['owner', 'other']),
        ephemeral: z.boolean(),
        memoryConsent: z.boolean(),
        policy: z.enum(['default', 'automate', 'automate_expired', 'automate_wrong_scope', 'deny']),
        calls: z.array(z.object({ name: z.string(), input: JsonSchema }).strict()).min(1),
        reply: z.string().optional(),
      })
      .strict(),
    expected: z
      .object({
        offered: z.array(z.string()),
        unoffered: z.array(z.string()),
        outcomes: z.array(ExpectedToolOutcomeSchema),
        proposalStatuses: z.array(z.enum(['pending', 'rejected', 'committed'])),
        domain: z.enum(['unchanged', 'learning_goal_matches']),
        audit: z.enum(['none', 'rejected_by_policy', 'success']),
        finalCheck: z
          .object({ falseSaveIssue: z.boolean(), literal: z.string() })
          .strict()
          .optional(),
      })
      .strict(),
  })
  .strict()
const ConfirmCaseSchema = z
  .object({
    ...common,
    kind: z.literal('proposal_confirm'),
    input: z
      .object({
        capability: z.enum([
          'memory.create_record',
          'profile.update_fact',
          'learning.update_goal',
          'memory.invalidate_record',
        ]),
        operation: z.enum([
          'owner_confirm',
          'other_confirm',
          'stale_version',
          'repeat',
          'concurrent',
          'execution_conflict',
        ]),
      })
      .strict(),
    expected: z
      .object({
        successes: z.number().int().nonnegative(),
        errorKinds: z.array(z.enum(['NotFoundError', 'ConflictError'])),
        status: z.enum(['pending', 'committed']),
        version: z.number().int().positive(),
        executions: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict()
const PromptCaseSchema = z
  .object({
    ...common,
    kind: z.literal('prompt_wrapping'),
    input: z
      .object({
        surface: z.enum(['context', 'tool_data', 'note_tool']),
        nonce: z.string().regex(/^[0-9a-f]{8}$/),
        value: JsonSchema,
      })
      .strict(),
    expected: z
      .object({
        literal: z.string(),
        wrapperClosings: z.number().int().nonnegative().optional(),
        idempotent: z.boolean(),
      })
      .strict(),
  })
  .strict()
const HttpCaseSchema = z
  .object({
    ...common,
    kind: z.literal('proposal_http'),
    input: z
      .object({
        actor: z.enum(['owner', 'other', 'none']),
        untrustedOrigin: z.boolean(),
        // Body cố ý sai vẫn tới actual API validator; chỉ JSON được validate tại loader.
        body: JsonSchema,
      })
      .strict(),
    expected: z
      .object({
        status: z.union([
          z.literal(200),
          z.literal(400),
          z.literal(401),
          z.literal(403),
          z.literal(404),
          z.literal(409),
        ]),
        committed: z.boolean(),
        version: z.number().int().positive(),
        executions: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict()
const StreamCaseSchema = z
  .object({
    ...common,
    kind: z.literal('stream_surface'),
    input: z
      .object({
        fragments: z.array(z.string()).min(1),
        termination: z.enum(['end', 'abort', 'fallback']),
        fallbackFragments: z.array(z.string()).optional(),
      })
      .strict(),
    expected: z
      .object({
        literal: z.string(),
        forbiddenPrefixes: z.array(z.string()),
        checkpoint: z
          .object({ afterFragment: z.number().int().nonnegative(), includes: z.string() })
          .strict()
          .optional(),
        issues: z.array(z.enum(['markup', 'internal_id', 'question_fence', 'surface_overflow'])),
        questionCount: z.number().int().nonnegative(),
        questions: z.array(InteractiveQuestionSchema).optional(),
      })
      .strict(),
  })
  .strict()
export const BoundaryCaseSchema = z.discriminatedUnion('kind', [
  ContextCaseSchema,
  ToolCaseSchema,
  ConfirmCaseSchema,
  PromptCaseSchema,
  StreamCaseSchema,
  HttpCaseSchema,
])
export type BoundaryCase = z.infer<typeof BoundaryCaseSchema>
export const REQUIRED_RECIPES = [
  ...Array.from({ length: 12 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 12 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 7 }, (_, i) => `A${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 8 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 8 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`),
]

// S09/S10 có actual runtime route/browser suite riêng, không chấm service corpus thay chúng.
export const BoundaryCorpusSchema = z
  .object({
    schemaVersion: z.literal(1),
    corpusId: z.string().min(1),
    provenance: z
      .object({
        kind: z.literal('agent_synthetic_review'),
        humanReview: z.literal('NOT_REVIEWED'),
        spec: z.literal('docs/specs/2026-10-16-stored-s04-injection-stream.md'),
        sourceCommit: z.string().regex(/^[0-9a-f]{40}$/),
        revision: z.number().int().positive(),
      })
      .strict(),
    fixtureGroups: z
      .array(
        z
          .object({
            id: z.string().min(1),
            query: z.string().min(1),
            canaries: z.record(z.string(), z.string().min(1)),
          })
          .strict(),
      )
      .min(1),
    externalGates: z.tuple([z.literal('S09'), z.literal('S10')]),
    // Sàn corpus v1: --corpus không được bỏ biến thể rồi báo full pass chỉ vì còn đủ recipe.
    cases: z.array(BoundaryCaseSchema).min(1874),
  })
  .strict()
  .superRefine((corpus, ctx) => {
    const ids = new Map(corpus.cases.map((c) => [c.id, c]))
    if (ids.size !== corpus.cases.length)
      ctx.addIssue({ code: 'custom', path: ['cases'], message: 'ID case trùng' })
    const groups = new Map(corpus.fixtureGroups.map((g) => [g.id, g]))
    if (groups.size !== corpus.fixtureGroups.length)
      ctx.addIssue({ code: 'custom', path: ['fixtureGroups'], message: 'ID group trùng' })
    for (const recipe of REQUIRED_RECIPES) {
      if (!corpus.cases.some((c) => c.recipe === recipe))
        ctx.addIssue({ code: 'custom', path: ['cases'], message: `Thiếu recipe ${recipe}` })
    }
    for (const language of ['vi', 'en', 'mixed']) {
      if (!corpus.cases.some((c) => c.language === language))
        ctx.addIssue({ code: 'custom', path: ['cases'], message: `Thiếu language ${language}` })
    }
    for (const [i, c] of corpus.cases.entries()) {
      const group = groups.get(c.fixtureGroupRef)
      if (!group || !group.canaries[c.canaryRef])
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i],
          message: 'Fixture/canary không tồn tại',
        })
      if (group && Object.values(group.canaries).some((canary) => group.query.includes(canary)))
        ctx.addIssue({
          code: 'custom',
          path: ['fixtureGroups'],
          message: 'Query chứa canary private',
        })
      if (!REQUIRED_RECIPES.includes(c.recipe) || !c.id.startsWith(c.recipe))
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i],
          message: 'Recipe không thuộc inventory',
        })
      const expectedKind =
        c.recipe === 'A07'
          ? 'proposal_http'
          : c.recipe[0] === 'C'
            ? 'context_scope'
            : c.recipe[0] === 'T'
              ? 'tool_authority'
              : c.recipe[0] === 'A'
                ? 'proposal_confirm'
                : c.recipe[0] === 'P'
                  ? 'prompt_wrapping'
                  : 'stream_surface'
      if (c.kind !== expectedKind)
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i, 'kind'],
          message: 'Kind không đúng recipe',
        })
      if (c.role === 'attack' && !c.controls.length)
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i, 'controls'],
          message: 'Attack thiếu positive control',
        })
      if (c.role === 'positive_control' && c.controls.length)
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i, 'controls'],
          message: 'Control không được phụ thuộc control khác',
        })
      if (c.role === 'positive_control') {
        const canary = group?.canaries[c.canaryRef]
        const invalid =
          c.kind === 'context_scope'
            ? !c.expected.present.some((key) => key === c.canaryRef)
            : c.kind === 'tool_authority'
              ? !c.expected.outcomes.some((outcome) => !outcome.isError)
              : c.kind === 'proposal_confirm'
                ? c.expected.successes < 1 || c.expected.executions < 1
                : c.kind === 'proposal_http'
                  ? c.expected.status !== 200 || !c.expected.committed || c.expected.executions < 1
                  : !canary || !c.expected.literal.includes(canary)
        if (invalid)
          ctx.addIssue({
            code: 'custom',
            path: ['cases', i, 'expected'],
            message: 'Positive control không có observable hợp lệ',
          })
      }
      if (new Set(c.controls).size !== c.controls.length)
        ctx.addIssue({ code: 'custom', path: ['cases', i, 'controls'], message: 'Control trùng' })
      for (const id of c.controls) {
        const control = ids.get(id)
        if (
          !control ||
          control.role !== 'positive_control' ||
          control.fixtureGroupRef !== c.fixtureGroupRef ||
          control.canaryRef !== c.canaryRef
        )
          ctx.addIssue({
            code: 'custom',
            path: ['cases', i, 'controls'],
            message: 'Control không cùng fixture/canary hoặc không positive',
          })
      }
      if (c.kind === 'tool_authority' && c.input.calls.length !== c.expected.outcomes.length)
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i, 'expected'],
          message: 'Thiếu outcome oracle',
        })
      if (
        c.kind === 'tool_authority' &&
        Boolean(c.input.reply !== undefined) !== Boolean(c.expected.finalCheck)
      )
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i, 'expected'],
          message: 'Reply/final oracle thiếu đầu mút',
        })
      if (
        c.kind === 'context_scope' &&
        c.expected.present.some((key) => c.expected.absent.includes(key))
      )
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i, 'expected'],
          message: 'Present/absent mâu thuẫn',
        })
      if (
        c.kind === 'stream_surface' &&
        c.expected.questionCount > 0 &&
        c.expected.questions?.length !== c.expected.questionCount
      )
        ctx.addIssue({
          code: 'custom',
          path: ['cases', i, 'expected'],
          message: 'Thiếu structured question oracle',
        })
    }
  })
export type BoundaryCorpus = z.infer<typeof BoundaryCorpusSchema>

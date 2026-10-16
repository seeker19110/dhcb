// Chạy SDK/parser/tool loop và prompt builder production bằng cassette tổng hợp đã version hóa.
import { z } from 'zod'
import { getAnthropicRoute } from '@dhcb/core-ai/aiConfig'
import { runAnthropicToolLoop } from '@dhcb/core-ai/anthropicToolLoop'
import { buildCompanionSystemPrompt } from '@dhcb/core-personal/companionPrompt'
import { companionToolDefinitions } from '@dhcb/core-personal/companionTools'
import { runFinalAnswerChecks } from '@dhcb/core-personal/finalAnswerChecks'
import { createProviderReplay, ReplayExchangeSchema, requestFingerprint } from './providerReplay'

const GROUPS = [
  'text',
  'read_tool',
  'pending_proposal',
  'stream',
  'malformed_json',
  'timeout',
  'stream_cut',
] as const

const ToolReplySchema = z.object({ content: z.string(), isError: z.boolean().optional() }).strict()
const CaseSchema = z
  .object({
    id: z.string().trim().min(1),
    group: z.enum(GROUPS),
    message: z.string().min(1),
    now: z.iso.datetime(),
    nonce: z.string().regex(/^[a-f0-9]{8}$/),
    stream: z.boolean(),
    deadlineMs: z.number().int().min(100).max(1000).optional(),
    exchanges: z.array(ReplayExchangeSchema).min(1).max(16),
    toolReplies: z.record(z.string(), ToolReplySchema),
    expect: z
      .object({
        kind: z.enum(['success', 'unusable', 'api_error', 'network_error']),
        text: z.string().optional(),
        deltas: z.string(),
        tools: z.array(z.string()),
        pendingProposals: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict()
  .superRefine((c, ctx) => {
    const invalid = (message: string) => ctx.addIssue({ code: 'custom', message })
    if (
      ['text', 'read_tool', 'pending_proposal', 'stream'].includes(c.group) &&
      (c.expect.kind !== 'success' || !c.expect.text?.trim())
    ) {
      invalid('Ca thành công phải yêu cầu quan sát text không rỗng')
    }
    if (
      ['malformed_json', 'timeout', 'stream_cut'].includes(c.group) &&
      c.expect.kind !== 'network_error'
    ) {
      invalid('Ca lỗi phải yêu cầu quan sát nhánh network_error production')
    }
    if (['stream', 'stream_cut'].includes(c.group) && !c.expect.deltas.trim()) {
      invalid('Ca stream phải yêu cầu quan sát delta trước kết thúc/lỗi')
    }
    if (c.group === 'text' && (c.stream || c.expect.tools.length || c.expect.pendingProposals)) {
      invalid('Ca text phải không stream/công cụ/đề xuất')
    }
    if (c.group === 'malformed_json') {
      let malformed = false
      for (const { response } of c.exchanges) {
        if (
          response.kind !== 'http' ||
          response.status !== 200 ||
          response.contentType !== 'application/json'
        )
          continue
        try {
          JSON.parse(response.body)
        } catch {
          malformed = true
        }
      }
      if (!malformed) invalid('Ca JSON lỗi phải thực sự trả JSON hỏng từ HTTP 200')
    }
    if (c.exchanges.some((e) => e.response.kind === 'timeout') && !c.deadlineMs) {
      invalid('Phản hồi timeout cần deadline hữu hạn của harness')
    }
    if (
      c.group === 'timeout' &&
      (!c.deadlineMs || !c.exchanges.some((e) => e.response.kind === 'timeout'))
    ) {
      invalid('Ca timeout phải có deadline và phản hồi timeout')
    }
    if (['stream', 'stream_cut'].includes(c.group) && !c.stream) {
      invalid('Ca stream phải dùng callback delta production')
    }
    if (c.group === 'stream_cut' && !c.exchanges.some((e) => e.response.kind === 'stream_error')) {
      invalid('Ca stream cut phải có lỗi transport giữa stream')
    }
    if (c.group === 'read_tool' && !c.expect.tools.some((name) => !name.startsWith('propose_'))) {
      invalid('Ca đọc phải yêu cầu quan sát công cụ đọc')
    }
    if (c.group === 'pending_proposal' && c.expect.pendingProposals < 1) {
      invalid('Ca đề xuất phải yêu cầu quan sát trạng thái pending')
    }
  })

export const CompanionReplaySetSchema = z
  .object({
    schemaVersion: z.literal(1),
    fixtureSetVersion: z.string().min(1),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    // V1 chỉ nhận dữ liệu tổng hợp. Không có record mode hoặc suy diễn thành model evidence.
    origin: z.literal('synthetic'),
    provider: z.literal('anthropic'),
    route: z
      .object({
        model: z.string().min(1),
        effort: z.enum(['low', 'medium', 'high']),
        maxTokens: z.number().int().positive(),
        timeoutMs: z.number().int().positive(),
      })
      .strict(),
    cases: z.array(CaseSchema).min(GROUPS.length),
  })
  .strict()
  .superRefine((set, ctx) => {
    const ids = set.cases.map((c) => c.id)
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'ID trùng' })
    for (const group of GROUPS) {
      if (!set.cases.some((c) => c.group === group)) {
        ctx.addIssue({ code: 'custom', message: `Thiếu nhóm: ${group}` })
      }
    }
  })

export type CompanionReplayCase = z.infer<typeof CaseSchema>

export function replaySystemPrompt(c: CompanionReplayCase): string {
  return buildCompanionSystemPrompt({
    now: new Date(c.now),
    nonce: c.nonce,
    domain: 'general',
    contextBlocks: [],
    actionsSummary: '',
    tools: true,
  })
}

export async function runCompanionReplay(raw: unknown) {
  const set = CompanionReplaySetSchema.parse(raw)
  const route = getAnthropicRoute('companion')
  const definitions = companionToolDefinitions({ ephemeral: false, memoryConsent: true })
  const allowedTools = new Set(definitions.map((t) => t.name))
  const results: Array<{ id: string; passed: boolean; violations: string[] }> = []

  for (const c of set.cases) {
    const violations: string[] = []
    const replay = createProviderReplay(c.exchanges)
    const called: string[] = []
    const deltas: string[] = []
    let pendingProposals = 0
    if (
      requestFingerprint('CONFIG', 'companion', route) !==
      requestFingerprint('CONFIG', 'companion', set.route)
    ) {
      violations.push('REPLAY_CONFIG_MISMATCH')
    }
    try {
      const actual = await runAnthropicToolLoop({
        apiKey: 'synthetic-replay-not-a-real-key',
        route,
        system: replaySystemPrompt(c),
        messages: [{ role: 'user', content: c.message }],
        tools: definitions,
        fetchImpl: replay.fetchImpl,
        ...(c.deadlineMs !== undefined ? { deadlineMs: c.deadlineMs } : {}),
        ...(c.stream ? { onTextDelta: (delta: string) => deltas.push(delta) } : {}),
        executeTool: async (name) => {
          called.push(name)
          if (!allowedTools.has(name)) {
            violations.push('REPLAY_FORBIDDEN_TOOL')
            return { content: 'Công cụ không được phép.', isError: true }
          }
          const reply = c.toolReplies[name]
          if (!reply) {
            violations.push('REPLAY_MISSING_TOOL_REPLY')
            return { content: 'Thiếu dữ liệu tổng hợp.', isError: true }
          }
          if (name.startsWith('propose_')) {
            // Đây là executor giả, chỉ kiểm trạng thái phản hồi. S04 kiểm authority trên PG thật.
            const parsed: unknown = JSON.parse(reply.content)
            if (z.object({ status: z.literal('pending') }).safeParse(parsed).success) {
              pendingProposals++
            } else violations.push('REPLAY_PROPOSAL_NOT_PENDING')
          }
          return reply
        },
      })
      if (actual.kind !== c.expect.kind) violations.push('REPLAY_RESULT_MISMATCH')
      const text = actual.kind === 'success' ? actual.text : undefined
      if (text !== c.expect.text) violations.push('REPLAY_TEXT_MISMATCH')
      if (deltas.join('') !== c.expect.deltas) violations.push('REPLAY_DELTA_MISMATCH')
      if (JSON.stringify(called) !== JSON.stringify(c.expect.tools)) {
        violations.push('REPLAY_TOOL_CALLS_MISMATCH')
      }
      if (pendingProposals !== c.expect.pendingProposals) {
        violations.push('REPLAY_PROPOSALS_MISMATCH')
      }
      if (actual.toolCalls.some((t) => !t.ok)) violations.push('REPLAY_TOOL_FAILURE')
      if (
        [text ?? '', deltas.join('')].some((reply) =>
          runFinalAnswerChecks({
            reply,
            userMessage: c.message,
            proposedActions: [],
          }).issues.includes('false_save_claim'),
        )
      ) {
        violations.push('REPLAY_FALSE_SAVE_CLAIM')
      }
    } catch {
      violations.push('REPLAY_CASE_CRASH')
    }
    try {
      replay.assertComplete()
    } catch {
      violations.push('REPLAY_INCOMPLETE')
    }
    results.push({ id: c.id, passed: violations.length === 0, violations })
  }
  const passed = results.filter((r) => r.passed).length
  return { total: results.length, passed, results, exitCode: passed === results.length ? 0 : 1 }
}

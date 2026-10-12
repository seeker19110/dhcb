// scripts/protocol-check.ts — Workflow Controller CƠ HỌC cho docs/AI_DEVELOPMENT_PROTOCOL.md.
//
// VÌ SAO CẦN (protocol §12 mục 1): PROTOCOL định nghĩa state machine 15 trạng thái + 5 hợp đồng
// YAML máy đọc (FEATURE_SPEC/DESIGN_SPEC/QA_REPORT/REJECT/DOC_DELTA) nhưng "controller hiện tại
// = file trạng thái + hook + CI, chưa có script riêng" — nghĩa là không ai/không gì thật sự kiểm
// một spec có ĐÚNG khuôn hợp đồng của trạng thái nó tự nhận hay không. Script này là cái kiểm đó.
//
// PHẠM VI CỐ Ý: chỉ những spec có tự khai dòng `Trạng thái: **XXX**` (đúng cú pháp §2) mới bị
// kiểm — đây là protocol MỚI (2026-09-19), 124 spec cũ hiện có KHÔNG dùng khuôn này và vẫn hợp
// lệ (di sản, không phải lỗi). Không kiểm nội dung nghiệp vụ của hợp đồng — chỉ kiểm ĐỦ TRƯỜNG
// & ĐÚNG KIỂU theo schema §3, và luật khoá file song song §5.2 khi có PLAN.md cục bộ (file này
// không commit — .gitignore — nên trong CI thường không thấy, chỉ có tác dụng khi chạy tay).
//
// Dùng: npx tsx scripts/protocol-check.ts [--ci]
//   --ci  thoát mã 1 nếu có vi phạm (dùng trong CI job `audit`); không có cờ này chỉ CẢNH BÁO.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { load as loadYaml } from 'js-yaml'
import { z } from 'zod'

const ROOT = process.cwd()
export const SPEC_DIR = join(ROOT, 'docs/specs')
export const PLAN_PATH = join(ROOT, 'PLAN.md')

// Đúng 15 trạng thái của state machine §2 (kể cả hai trạng thái rẽ nhánh FAIL/PASS được liệt kê
// như hàng riêng trong bảng §2.1).
export const STATES = [
  'NEW',
  'SPECIFYING',
  'SPEC_READY',
  'DESIGNING',
  'DESIGN_READY',
  'IMPLEMENTING',
  'IMPLEMENTED',
  'VERIFYING',
  'FAIL',
  'FIXING',
  'PASS',
  'DEPLOYING',
  'DEPLOYED',
  'DOCUMENTING',
  'DONE',
] as const
export type SpecState = (typeof STATES)[number]

// Từ SPEC_READY trở đi, spec bắt buộc phải có khối `feature:` đủ trường (§3.1).
const STATES_REQUIRING_FEATURE_BLOCK = new Set<SpecState>(
  STATES.slice(STATES.indexOf('SPEC_READY')),
)
// Từ DESIGN_READY trở đi, nếu design_spec: required thì bắt buộc có mục ⑦ DESIGN_SPEC (§3.2).
const STATES_REQUIRING_DESIGN_BLOCK = new Set<SpecState>(
  STATES.slice(STATES.indexOf('DESIGN_READY')),
)
// Từ PASS trở đi, bắt buộc có QA_REPORT (§3.5).
const STATES_REQUIRING_QA_BLOCK = new Set<SpecState>([
  'PASS',
  'DEPLOYING',
  'DEPLOYED',
  'DOCUMENTING',
  'DONE',
])

const STATE_HEADER_RE = /^>.*Trạng thái:\s*\*\*([A-Z_]+)\*\*/mu

const featureSchema = z.object({
  feature: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    // Trụ Career · Startup · Life đã gỡ 2026-09-20 — đặc tả mới không được gắn vào trụ ma (0628).
    pillar: z.enum(['learning', 'work', 'platform']),
    subject: z.string().optional(),
  }),
  goal: z.object({ user: z.string().min(1), objective: z.string().min(1) }),
  scope: z.object({ include: z.array(z.string()).min(1), exclude: z.array(z.string()) }),
  user_flow: z.array(z.string()).min(1),
  states: z.array(z.string()).min(1),
  ai_calls: z.object({
    needed: z.boolean(),
    cached: z.boolean(),
    daily_limit_counted: z.boolean(),
  }),
  acceptance_criteria: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
        proof: z.string().min(1),
      }),
    )
    .min(1),
  risk: z.enum(['normal', 'high']),
  design_spec: z.enum(['required', 'n/a']),
})

const designSchema = z.object({
  screen: z.string().min(1),
  layout: z.object({
    desktop: z.record(z.string(), z.unknown()),
    mobile: z.record(z.string(), z.unknown()),
  }),
  components: z
    .array(
      z.object({
        name: z.string().min(1),
        source: z.enum(['reuse', 'compose', 'new']),
        path: z.string().optional(),
        from: z.array(z.string()).optional(),
        why_not_reuse: z.string().optional(),
      }),
    )
    .min(1),
  a11y: z.object({ content: z.literal('AAA'), controls: z.literal('AA') }),
})

const qaReportSchema = z.object({
  qa: z.object({
    feature: z.string().min(1),
    pr: z.union([z.number(), z.string()]),
    checks: z.record(z.string(), z.enum(['pass', 'fail'])),
    gates_run: z.array(z.string()).min(1),
    acceptance: z
      .array(
        z.object({
          id: z.string().min(1),
          result: z.enum(['pass', 'fail']),
          evidence: z.string().min(1),
        }),
      )
      .min(1),
    verdict: z.enum(['PASS', 'FAIL']),
  }),
})

const REJECT_TYPES = [
  'acceptance_criteria',
  'design_deviation',
  'spec_ambiguity',
  'architecture',
  'security',
  'a11y',
  'perf',
] as const
const rejectSchema = z.object({
  reject: z.object({
    from: z.enum(['product', 'design', 'engineering', 'qa', 'docs']),
    owner: z.string().min(1),
    type: z.enum(REJECT_TYPES),
    ref: z.string().min(1),
    expected: z.string().min(1),
    actual: z.string().min(1),
    evidence: z.string().min(1),
    proposed_fix: z.string().optional(),
  }),
})

const docDeltaSchema = z.object({
  doc_delta: z.object({
    feature: z.string().min(1),
    pr: z.union([z.number(), z.string()]),
    changelog: z.string().min(1),
    progress_md: z.string(),
    claude_md: z.string(),
    project_md: z.string(),
    adr: z.string(),
    specs: z.string(),
    ops_docs: z.string(),
    traps_md: z.string(),
  }),
})

const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  route: z.enum(['complex', 'spec', 'standard', 'mechanical']),
  owner_role: z.enum(['frontend', 'backend', 'db', 'docs']),
  files: z.object({
    modify: z.array(z.string()).default([]),
    create: z.array(z.string()).default([]),
    forbidden: z.array(z.string()).default([]),
  }),
  depends_on: z.array(z.string()).default([]),
  ac_refs: z.array(z.string()).min(1),
  status: z.enum(['pending', 'running', 'implemented', 'blocked']),
})

const planSchema = z.object({
  plan: z.object({
    feature: z.string().min(1),
    spec: z.string().min(1),
    branch: z.string().min(1),
  }),
  tasks: z.array(taskSchema).min(1),
})

export interface Violation {
  file: string
  message: string
}

/** Trích mọi khối ```yaml ... ``` trong một file Markdown, parse bằng js-yaml. */
function extractYamlBlocks(content: string): unknown[] {
  const blocks: unknown[] = []
  const re = /```yaml\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    try {
      blocks.push(loadYaml(m[1] ?? ''))
    } catch {
      blocks.push(null)
    }
  }
  return blocks
}

/**
 * `topKey` = khoá gốc nhận diện loại hợp đồng (vd `feature`, `qa`, `reject`, `doc_delta`, `plan`)
 * — dùng thay `schema.shape` vì `z.ZodType<T>` (kiểu chung, để nhận cả z.object lẫn z.array) không
 * expose `.shape`.
 */
function findBlock<T>(
  blocks: unknown[],
  schema: z.ZodType<T>,
  topKey: string,
): T | 'invalid' | 'missing' {
  for (const b of blocks) {
    if (!b || typeof b !== 'object' || !(topKey in b)) continue
    const parsed = schema.safeParse(b)
    // Khối CÓ khoá gốc đúng (topKey) nhưng không khớp schema → "invalid", để báo lỗi đúng chỗ
    // thay vì nói chung chung "thiếu khối".
    return parsed.success ? parsed.data : 'invalid'
  }
  return 'missing'
}

/** Kiểm một file spec theo bảng điều kiện chuyển §2.1 + hợp đồng §3. */
export function checkSpecFile(file: string, content: string): Violation[] {
  const violations: Violation[] = []
  const headerMatch = STATE_HEADER_RE.exec(content)
  if (!headerMatch) return violations // spec cũ, chưa tham gia protocol — hợp lệ

  const state = headerMatch[1] as string
  if (!STATES.includes(state as SpecState)) {
    violations.push({ file, message: `trạng thái không hợp lệ: "${state}" (không nằm trong §2)` })
    return violations
  }

  const blocks = extractYamlBlocks(content)

  if (STATES_REQUIRING_FEATURE_BLOCK.has(state as SpecState)) {
    const feature = findBlock(blocks, featureSchema, 'feature')
    if (feature === 'missing') {
      violations.push({ file, message: `trạng thái ${state} nhưng thiếu khối \`feature:\` (§3.1)` })
    } else if (feature === 'invalid') {
      violations.push({ file, message: `khối \`feature:\` sai schema §3.1` })
    } else {
      if (
        feature.risk === 'high' &&
        state !== 'SPEC_READY' &&
        !/Approved for implementation/u.test(content)
      ) {
        violations.push({
          file,
          message:
            'risk: high nhưng spec chưa có xác nhận "Approved for implementation" (§3.1 DoD Product)',
        })
      }
      if (
        feature.design_spec === 'required' &&
        STATES_REQUIRING_DESIGN_BLOCK.has(state as SpecState) &&
        !/## ⑦ DESIGN_SPEC/u.test(content)
      ) {
        violations.push({
          file,
          message: `design_spec: required + trạng thái ${state} nhưng thiếu mục "## ⑦ DESIGN_SPEC" (§3.2)`,
        })
      } else if (feature.design_spec === 'required' && /## ⑦ DESIGN_SPEC/u.test(content)) {
        const design = findBlock(blocks, designSchema, 'screen')
        if (design === 'invalid')
          violations.push({ file, message: 'khối DESIGN_SPEC sai schema §3.2' })
      }
    }
  }

  if (STATES_REQUIRING_QA_BLOCK.has(state as SpecState)) {
    const qa = findBlock(blocks, qaReportSchema, 'qa')
    if (qa === 'missing') {
      violations.push({
        file,
        message: `trạng thái ${state} nhưng thiếu khối \`qa:\` QA_REPORT (§3.5)`,
      })
    } else if (qa === 'invalid') {
      violations.push({ file, message: 'khối `qa:` sai schema §3.5' })
    }
  }

  if (state === 'DONE') {
    const docDelta = findBlock(blocks, docDeltaSchema, 'doc_delta')
    if (docDelta === 'missing') {
      violations.push({ file, message: 'trạng thái DONE nhưng thiếu khối `doc_delta:` (§3.7)' })
    } else if (docDelta === 'invalid') {
      violations.push({ file, message: 'khối `doc_delta:` sai schema §3.7' })
    } else if (!existsSync(join(ROOT, docDelta.doc_delta.changelog))) {
      violations.push({
        file,
        message: `doc_delta.changelog trỏ tới file không tồn tại: ${docDelta.doc_delta.changelog}`,
      })
    }
  }

  // REJECT (§3.6) có thể xuất hiện ở bất kỳ trạng thái nào (lịch sử phản hồi) — mọi khối phải
  // hợp lệ theo schema bất kể spec đang ở trạng thái gì.
  for (const b of blocks) {
    if (b && typeof b === 'object' && 'reject' in (b as object)) {
      const parsed = rejectSchema.safeParse(b)
      if (!parsed.success)
        violations.push({ file, message: 'khối `reject:` sai schema §3.6 (thiếu owner?)' })
    }
  }

  return violations
}

/** Luật khoá file & song song §5.2: hai task chỉ song song được khi tập file rời nhau. */
export function checkPlanFileLocks(planContent: string): Violation[] {
  const violations: Violation[] = []
  const blocks = extractYamlBlocks(planContent)
  const plan = findBlock(blocks, planSchema, 'plan')
  if (plan === 'missing')
    return [{ file: 'PLAN.md', message: 'không tìm thấy khối `plan:`/`tasks:` hợp lệ (§3.3)' }]
  if (plan === 'invalid')
    return [{ file: 'PLAN.md', message: 'khối `plan:`/`tasks:` sai schema §3.3/§3.4' }]

  const { tasks } = plan
  const filesOf = (t: z.infer<typeof taskSchema>) => new Set([...t.files.modify, ...t.files.create])
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i]!
      const b = tasks[j]!
      if (a.depends_on.includes(b.id) || b.depends_on.includes(a.id)) continue
      const shared = [...filesOf(a)].filter((f) => filesOf(b).has(f))
      if (shared.length > 0) {
        violations.push({
          file: 'PLAN.md',
          message: `task ${a.id} và ${b.id} không depends_on nhau nhưng đụng cùng file: ${shared.join(', ')} (§5.2 — không được chạy song song)`,
        })
      }
    }
  }
  return violations
}

function main() {
  const ciMode = process.argv.includes('--ci')
  const violations: Violation[] = []

  if (existsSync(SPEC_DIR)) {
    const files = readdirSync(SPEC_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md')
    for (const file of files) {
      const content = readFileSync(join(SPEC_DIR, file), 'utf8')
      violations.push(...checkSpecFile(`docs/specs/${file}`, content))
    }
  }

  if (existsSync(PLAN_PATH)) {
    violations.push(...checkPlanFileLocks(readFileSync(PLAN_PATH, 'utf8')))
  }

  if (violations.length === 0) {
    console.log('OK — protocol-check: không có vi phạm AI_DEVELOPMENT_PROTOCOL.md.')
    return
  }

  console.log(`Tìm thấy ${violations.length} vi phạm AI_DEVELOPMENT_PROTOCOL.md:`)
  for (const v of violations) console.log(`  - ${v.file}: ${v.message}`)
  console.log(
    '\n→ Sửa spec/PLAN.md cho đúng schema §3, hoặc bỏ dòng "Trạng thái:" nếu spec chưa tham gia protocol.',
  )
  if (ciMode) process.exit(1)
}

if (process.argv[1]?.endsWith('protocol-check.ts')) main()

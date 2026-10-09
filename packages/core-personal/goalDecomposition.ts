// packages/core-personal/goalDecomposition.ts — Kiểm & dựng ĐỀ XUẤT phân rã mục tiêu của AI cho
// Action Canvas (đặc tả docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md, changelog 0549).
//
// Đầu ra của model là DỮ LIỆU THÔ CHƯA TIN CẬY (skill autonomous-agent-orchestrator §4.4): chỉ qua
// được khi đúng khuôn JSON (Zod), số bước trong trần, nhãn trong giới hạn độ dài, phụ thuộc trỏ tới
// bước có thật, KHÔNG có vòng (DAG) và chuỗi phụ thuộc không sâu quá trần. Hỏng bất kỳ điều nào ⇒
// trả lỗi có lý do — nơi gọi hoàn lượt và nói thật với người dùng, KHÔNG rơi về khung mẫu giả vờ là
// AI. File này THUẦN (không I/O) để test được mọi ca biên.
import { z } from 'zod'
import {
  ACTION_CANVAS_VERSION,
  ActionCanvasStateSchema,
  type ActionCanvasState,
  type CanvasEdge,
  type CanvasNode,
} from '@dhcb/core-contracts/actionCanvas'
import { arr, obj, str, strEnum, type JsonSchema } from '@dhcb/core-ai/jsonSchema'
import { ActionCanvasService } from './actionCanvasService.js'

/** Trần số bước AI được đề xuất (không tính nút mục tiêu gốc). */
export const MAX_STEPS = 8
/** Sàn số bước — ít hơn thì không phải "phân rã". */
export const MIN_STEPS = 2
/** Trần độ sâu chuỗi phụ thuộc (bước không phụ thuộc gì = tầng 1). */
export const MAX_DEPTH = 4
/** Trần số phụ thuộc của MỘT bước. */
export const MAX_DEPS_PER_STEP = 3
export const STEP_TITLE_MAX = 80
export const STEP_DETAIL_MAX = 280
/** Trần độ dài câu mục tiêu người dùng nhập (ký tự, sau khi làm sạch). */
export const GOAL_MIN = 3
export const GOAL_MAX = 300
/** Trần độ dài chuỗi thô model trả về — dài hơn là model lạc đề, không đáng parse. */
export const RAW_OUTPUT_MAX = 8000

/** Nhãn gắn lên mọi thẻ do AI đề xuất — để người dùng (và bản xuất Markdown) biết nguồn gốc. */
export const AI_PROPOSAL_TAG = 'ai-de-xuat'

// Ký tự điều khiển (trừ xuống dòng/tab) — loại khỏi cả mục tiêu lẫn nhãn AI trả về, tránh chữ vô
// hình/đảo chiều hiển thị (U+202E…) lọt lên giao diện.
// Dựng từ chuỗi escape (không gõ ký tự thật vào mã nguồn — CLAUDE.md §8, diff không thành nhị phân).
const CONTROL_CHARS = new RegExp(
  // Cố ý khớp ký tự điều khiển để LOẠI BỎ chúng.
  // eslint-disable-next-line no-control-regex
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069]',
  'g',
)
// Liên kết trong nhãn bước bị TỪ CHỐI: một mục tiêu chứa câu tiêm lệnh có thể dụ model chèn link
// lừa đảo; kế hoạch hành động không cần link để có ích.
const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|vn|xyz|ru|info|link)\b)/i

/** Làm sạch câu mục tiêu: bỏ ký tự điều khiển, gộp khoảng trắng, cắt trần. */
export function sanitizeGoal(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, GOAL_MAX)
}

function cleanLabel(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim()
}

// Miền hợp lệ cho bước do AI đề xuất: CHỈ hai trụ còn thật + chung. KHÔNG dùng
// `CanvasDomainSchema` (nó đổi career/startup/life về general để đọc canvas CŨ) — model trả miền đã
// xoá là dấu hiệu lạc prompt, phải bị từ chối chứ không lặng lẽ sửa hộ.
export const STEP_DOMAINS = ['learning', 'work', 'general'] as const
const StepDomainSchema = z.enum(STEP_DOMAINS)

const StepSchema = z
  .object({
    key: z.string().regex(/^s[1-9][0-9]?$/),
    title: z.string().transform(cleanLabel).pipe(z.string().min(2).max(STEP_TITLE_MAX)),
    detail: z
      .string()
      .transform(cleanLabel)
      .pipe(z.string().max(STEP_DETAIL_MAX))
      .optional()
      .default(''),
    domain: StepDomainSchema,
    dependsOn: z.array(z.string()).max(MAX_DEPS_PER_STEP).optional().default([]),
  })
  .strict()

export const GoalDecompositionSchema = z
  .object({
    steps: z.array(StepSchema).min(MIN_STEPS).max(MAX_STEPS),
  })
  .strict()

export type DecompositionStep = z.infer<typeof StepSchema>

/**
 * JSON Schema gửi Claude (structured outputs, `output_config.format`) — API giải mã có ràng buộc
 * nên đầu ra luôn là JSON đúng khuôn, hết hẳn ca `not_json`/thiếu khoá/miền lạ. Đây CHỈ là lớp
 * thứ nhất: API không hỗ trợ trần độ dài/số phần tử/regex, nên `parseGoalDecomposition` (Zod +
 * kiểm DAG/độ sâu/link) vẫn chạy y nguyên — và là lớp duy nhất khi rơi xuống Groq/Gemini.
 * Khoá phải khớp `StepSchema` và khuôn trong prompt (test `goalDecomposition.test.ts` canh).
 */
export const GOAL_DECOMPOSITION_JSON_SCHEMA: JsonSchema = obj({
  steps: arr(
    obj({
      key: str('"s1", "s2", … lần lượt, không trùng.'),
      title: str(`Bắt đầu bằng động từ, tối đa ${STEP_TITLE_MAX} ký tự.`),
      detail: str(`Một câu giải thích cách làm, tối đa ${STEP_DETAIL_MAX} ký tự.`),
      domain: strEnum(STEP_DOMAINS),
      dependsOn: arr(
        str(),
        `Key các bước phải xong trước (tối đa ${MAX_DEPS_PER_STEP}); [] nếu làm được ngay.`,
      ),
    }),
    `${MIN_STEPS}–${MAX_STEPS} bước.`,
  ),
})

export type DecompositionFailure =
  | 'empty'
  | 'too_long'
  | 'not_json'
  | 'schema'
  | 'duplicate_key'
  | 'unknown_dependency'
  | 'self_dependency'
  | 'cycle'
  | 'too_deep'
  | 'link_in_label'

export type DecompositionResult =
  { ok: true; steps: DecompositionStep[] } | { ok: false; reason: DecompositionFailure }

// Model hay bọc JSON trong ```json … ``` dù được dặn không — chấp nhận đúng MỘT khối rào như vậy,
// không "đào" JSON từ giữa đoạn văn (đầu ra lẫn văn xuôi coi là hỏng).
function stripCodeFence(text: string): string {
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n?```$/i.exec(text)
  return fenced?.[1] !== undefined ? fenced[1].trim() : text
}

/**
 * Tính độ sâu dài nhất của đồ thị phụ thuộc bằng thứ tự topo (Kahn). Trả `null` khi có vòng.
 * `deps` đã chắc chắn chỉ trỏ tới key có thật.
 */
export function longestDependencyDepth(
  steps: Pick<DecompositionStep, 'key' | 'dependsOn'>[],
): number | null {
  const inDegree = new Map<string, number>()
  const dependents = new Map<string, string[]>()
  for (const s of steps) {
    inDegree.set(s.key, s.dependsOn.length)
    for (const d of s.dependsOn) dependents.set(d, [...(dependents.get(d) ?? []), s.key])
  }
  const depth = new Map<string, number>()
  const queue: string[] = []
  for (const s of steps) {
    if (s.dependsOn.length === 0) {
      queue.push(s.key)
      depth.set(s.key, 1)
    }
  }
  let visited = 0
  while (queue.length > 0) {
    const key = queue.shift()!
    visited++
    for (const next of dependents.get(key) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, (depth.get(key) ?? 1) + 1))
      const left = (inDegree.get(next) ?? 0) - 1
      inDegree.set(next, left)
      if (left === 0) queue.push(next)
    }
  }
  if (visited !== steps.length) return null
  return Math.max(0, ...depth.values())
}

/** Parse + kiểm chuỗi thô model trả về. Hàm THUẦN, không ném lỗi. */
export function parseGoalDecomposition(raw: string): DecompositionResult {
  const text = raw.trim()
  if (!text) return { ok: false, reason: 'empty' }
  if (text.length > RAW_OUTPUT_MAX) return { ok: false, reason: 'too_long' }

  let json: unknown
  try {
    json = JSON.parse(stripCodeFence(text))
  } catch {
    return { ok: false, reason: 'not_json' }
  }

  const parsed = GoalDecompositionSchema.safeParse(json)
  if (!parsed.success) return { ok: false, reason: 'schema' }
  const steps = parsed.data.steps.map((s) => ({ ...s, dependsOn: [...new Set(s.dependsOn)] }))

  const keys = new Set<string>()
  for (const s of steps) {
    if (keys.has(s.key)) return { ok: false, reason: 'duplicate_key' }
    keys.add(s.key)
  }
  for (const s of steps) {
    if (LINK_PATTERN.test(s.title) || LINK_PATTERN.test(s.detail)) {
      return { ok: false, reason: 'link_in_label' }
    }
    for (const d of s.dependsOn) {
      if (d === s.key) return { ok: false, reason: 'self_dependency' }
      if (!keys.has(d)) return { ok: false, reason: 'unknown_dependency' }
    }
  }

  const depth = longestDependencyDepth(steps)
  if (depth === null) return { ok: false, reason: 'cycle' }
  if (depth > MAX_DEPTH) return { ok: false, reason: 'too_deep' }
  return { ok: true, steps }
}

// Màu thẻ theo miền — cùng bảng màu các thẻ canvas đang dùng (InteractiveCanvasViewport tự quy
// đổi sang token theme khi vẽ; giá trị ở đây chỉ là dữ liệu lưu trong canvas).
const DOMAIN_COLOR: Record<DecompositionStep['domain'], string> = {
  learning: '#38bdf8',
  work: '#22c55e',
  general: '#a855f7',
}

const TITLE_MAX = 200

/**
 * Dựng canvas ĐỀ XUẤT (chưa lưu) từ các bước đã kiểm: nút gốc là CHÍNH câu mục tiêu người dùng gõ
 * (AI không được đổi), mỗi bước một thẻ `draft` · người làm "Bạn" · nhãn `ai-de-xuat`. Bước không
 * phụ thuộc gì nối từ mục tiêu; còn lại nối từ bước phải làm trước. Bố cục qua `autoLayoutCanvasNodes`.
 * `newId` tiêm vào để test tất định.
 */
export function buildProposalCanvas(params: {
  canvasId: string
  personId: string
  goal: string
  steps: DecompositionStep[]
  now?: string
  newId?: () => string
}): ActionCanvasState {
  const now = params.now ?? new Date().toISOString()
  const newId = params.newId ?? (() => crypto.randomUUID())
  const goalTitle = params.goal.slice(0, TITLE_MAX)

  const base = {
    status: 'draft' as const,
    assignedTo: 'user' as const,
    createdAt: now,
    updatedAt: now,
  }
  const goalNode: CanvasNode = {
    ...base,
    id: newId(),
    type: 'goal',
    title: goalTitle,
    content: 'Mục tiêu bạn nhập.',
    domain: 'general',
    x: 0,
    y: 0,
    width: 260,
    height: 120,
    color: '#00f0ff',
    tags: ['muc-tieu'],
  }

  const idByKey = new Map<string, string>()
  const stepNodes: CanvasNode[] = params.steps.map((s) => {
    const id = newId()
    idByKey.set(s.key, id)
    return {
      ...base,
      id,
      type: 'task',
      title: s.title,
      content: s.detail,
      domain: s.domain,
      x: 0,
      y: 0,
      width: 240,
      height: 130,
      color: DOMAIN_COLOR[s.domain],
      tags: [AI_PROPOSAL_TAG],
    }
  })

  const edges: CanvasEdge[] = []
  for (const s of params.steps) {
    const target = idByKey.get(s.key)!
    if (s.dependsOn.length === 0) {
      edges.push({
        id: newId(),
        sourceNodeId: goalNode.id,
        targetNodeId: target,
        relationship: 'requires',
        label: 'Bắt đầu',
      })
    }
    for (const d of s.dependsOn) {
      edges.push({
        id: newId(),
        sourceNodeId: idByKey.get(d)!,
        targetNodeId: target,
        relationship: 'requires',
        label: 'Làm trước',
      })
    }
  }

  const nodes = ActionCanvasService.autoLayoutCanvasNodes([goalNode, ...stepNodes], edges).map(
    (n) => ({ ...n, updatedAt: now }),
  )
  // Kiểm lần cuối qua ĐÚNG hợp đồng lưu: đề xuất người dùng bấm "Lưu" phải lưu được (không 400).
  return ActionCanvasStateSchema.parse({
    canvasId: params.canvasId,
    personId: params.personId,
    title: goalTitle,
    nodes,
    edges,
    viewport: { zoom: 1, panX: 0, panY: 0 },
    lastEditedBy: 'user',
    schemaVersion: ACTION_CANVAS_VERSION,
    createdAt: now,
    updatedAt: now,
  })
}

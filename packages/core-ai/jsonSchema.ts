// packages/core-ai/jsonSchema.ts — Kiểu + trình dựng JSON Schema cho structured outputs của Claude
// (`output_config.format`). Dùng chung cho schema chấm điểm (gradingSchemas.ts) và schema phân
// rã mục tiêu Action Canvas (core-personal/goalDecomposition.ts).
//
// Chỉ gồm phần con mà API hỗ trợ: string (kèm enum), number, array, object. Giới hạn của API:
// mọi object phải `additionalProperties: false`; KHÔNG hỗ trợ minimum/maximum/minLength/
// maxLength/minItems>1/maxItems — các trần đó ghi vào `description` và vẫn kiểm bằng Zod/code ở
// phía nhận (lớp duy nhất khi rơi xuống Groq/Gemini dự phòng, hai bên đó không bị ép schema).

/** Một nút JSON Schema. */
export type JsonSchema =
  | { type: 'string'; enum?: string[]; description?: string }
  | { type: 'number'; description?: string }
  | { type: 'array'; items: JsonSchema; description?: string }
  | {
      type: 'object'
      properties: Record<string, JsonSchema>
      required: string[]
      additionalProperties: false
      description?: string
    }

// `description` chỉ gắn khi có — khỏi để khoá `undefined` lơ lửng trong schema.
const withDescription = <T extends JsonSchema>(node: T, description?: string): T =>
  description === undefined ? node : { ...node, description }

export const str = (description?: string): JsonSchema =>
  withDescription({ type: 'string' }, description)

/** Chuỗi chỉ được nhận một trong các giá trị cho trước. */
export const strEnum = (values: readonly string[], description?: string): JsonSchema =>
  withDescription({ type: 'string', enum: [...values] }, description)

export const num = (description?: string): JsonSchema =>
  withDescription({ type: 'number' }, description)

export const arr = (items: JsonSchema, description?: string): JsonSchema =>
  withDescription({ type: 'array', items }, description)

/** Object đóng: MỌI khoá đều bắt buộc, không nhận khoá lạ. */
export const obj = (properties: Record<string, JsonSchema>, description?: string): JsonSchema =>
  withDescription(
    { type: 'object', properties, required: Object.keys(properties), additionalProperties: false },
    description,
  )

/** Tập mọi tên khoá (đệ quy qua object/array) — test hợp đồng prompt ↔ schema dùng. */
export function schemaKeys(node: JsonSchema, out = new Set<string>()): Set<string> {
  if (node.type === 'object') {
    for (const [k, child] of Object.entries(node.properties)) {
      out.add(k)
      schemaKeys(child, out)
    }
  } else if (node.type === 'array') {
    schemaKeys(node.items, out)
  }
  return out
}

/** Mọi nút của schema (để test kiểm luật API trên từng nút). */
export function schemaNodes(node: JsonSchema, out: JsonSchema[] = []): JsonSchema[] {
  out.push(node)
  if (node.type === 'object') Object.values(node.properties).forEach((c) => schemaNodes(c, out))
  if (node.type === 'array') schemaNodes(node.items, out)
  return out
}

// Từ khoá API KHÔNG hỗ trợ — gửi lên là 400 cho MỌI lượt.
const UNSUPPORTED_KEYWORDS = [
  'minimum',
  'maximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'maxItems',
  'pattern',
]

/**
 * Lỗi khiến API từ chối schema (mảng rỗng = hợp lệ): object thiếu `additionalProperties:false`,
 * `required` không phủ đủ khoá, hoặc dùng từ khoá không hỗ trợ. Kiểu `JsonSchema` đã chặn phần
 * lớn lúc biên dịch; hàm này canh lúc chạy cho test.
 */
export function schemaViolations(root: JsonSchema): string[] {
  const out: string[] = []
  for (const node of schemaNodes(root)) {
    for (const kw of UNSUPPORTED_KEYWORDS) if (kw in node) out.push(`từ khoá cấm: ${kw}`)
    if (node.type === 'object') {
      if (node.additionalProperties !== false) out.push('object thiếu additionalProperties:false')
      const keys = Object.keys(node.properties).sort().join(',')
      if ([...node.required].sort().join(',') !== keys) out.push(`required lệch khoá: ${keys}`)
    }
  }
  return out
}

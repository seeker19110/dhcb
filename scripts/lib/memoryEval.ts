// Cổng thuần của eval:v2:memory. Tách khỏi CLI để CI kiểm được cả negative control,
// schema và mã thoát, không gọi provider hoặc CSDL thật.
import { z } from 'zod'
import { MemoryNamespaceSchema } from '@dhcb/core-contracts/personalMemory'
import { SensitivitySchema } from '@dhcb/core-contracts/personalFact'

const OutcomeSchema = z.enum(['ACCEPT', 'MERGE', 'REJECT', 'ASK_USER', 'EXPIRE'])

const FixtureSchema = z
  .object({
    id: z.string().trim().min(1),
    description: z.string().trim().min(1),
    candidate: z
      .object({
        namespace: MemoryNamespaceSchema,
        // Không trim nội dung: các ca trùng có chủ đích kiểm việc trim ở service thật.
        content: z.string(),
        provenance: z.string(),
        sensitivity: SensitivitySchema,
        confidence: z.number().optional(),
        retainUntil: z.string().optional(),
      })
      .strict(),
    existingRecords: z
      .array(
        z
          .object({
            content: z.string(),
            provenance: z.string(),
            sensitivity: SensitivitySchema,
          })
          .strict(),
      )
      .optional(),
    expectedOutcome: OutcomeSchema,
  })
  .strict()

// Giữ đủ sáu họ ca của golden set hiện hành; ID khác vẫn được phép bổ sung.
const REQUIRED_GROUPS = [
  'conf-low-',
  'conf-ask-',
  'conf-accept-',
  'sens-rej-',
  'dup-rej-',
  'merge-',
]

export const MemoryEvalFixturesSchema = z
  .array(FixtureSchema)
  .min(30)
  .superRefine((fixtures, ctx) => {
    const ids = new Set<string>()
    for (const [index, fixture] of fixtures.entries()) {
      if (ids.has(fixture.id)) {
        ctx.addIssue({ code: 'custom', path: [index, 'id'], message: `ID trùng: ${fixture.id}` })
      }
      ids.add(fixture.id)
    }
    for (const prefix of REQUIRED_GROUPS) {
      if (!fixtures.some((fixture) => fixture.id.startsWith(prefix))) {
        ctx.addIssue({ code: 'custom', message: `Thiếu nhóm fixture bắt buộc: ${prefix}` })
      }
    }
  })

export type MemoryEvalFixture = z.infer<typeof FixtureSchema>
type Outcome = z.infer<typeof OutcomeSchema>

interface MemoryEvalResult {
  id: string
  description: string
  expected: Outcome
  actual: Outcome | null
  error?: string
}

export interface MemoryEvalSummary {
  total: number
  correct: number
  crashed: number
  falseMemoryCount: number
  falseMemoryTotal: number
  correctionCount: number
  correctionTotal: number
  results: MemoryEvalResult[]
  exitCode: 0 | 1
}

export async function runMemoryEvaluation(
  rawFixtures: unknown,
  evaluate: (fixture: MemoryEvalFixture) => Promise<unknown>,
): Promise<MemoryEvalSummary> {
  // Lỗi hợp đồng làm runner thất bại trước khi chạy bất kỳ ca nào.
  const fixtures = MemoryEvalFixturesSchema.parse(rawFixtures)
  const results: MemoryEvalResult[] = []
  let correct = 0
  let crashed = 0
  let falseMemoryCount = 0
  let falseMemoryTotal = 0
  let correctionCount = 0
  let correctionTotal = 0

  for (const fixture of fixtures) {
    let actual: Outcome | null = null
    let error: string | undefined
    try {
      actual = OutcomeSchema.parse(await evaluate(fixture))
    } catch (err) {
      crashed++
      error = err instanceof Error ? err.message : String(err)
    }
    if (actual === fixture.expectedOutcome) correct++
    results.push({
      id: fixture.id,
      description: fixture.description,
      expected: fixture.expectedOutcome,
      actual,
      ...(error !== undefined ? { error } : {}),
    })

    if (fixture.expectedOutcome === 'REJECT' || fixture.expectedOutcome === 'ASK_USER') {
      falseMemoryTotal++
      if (actual === 'ACCEPT') falseMemoryCount++
    }
    if (
      fixture.candidate.provenance === 'user_declared' &&
      ['MERGE', 'ACCEPT', 'REJECT'].includes(fixture.expectedOutcome)
    ) {
      correctionTotal++
      if (actual === fixture.expectedOutcome) correctionCount++
    }
  }

  // Không dùng tỉ lệ mặc định khi mẫu số rỗng. Mọi sai lệch của ca tất định đều phải đỏ,
  // kể cả khi hai ngưỡng tổng hợp cũ vẫn đạt (lỗi 29/30 nhưng thoát 0).
  const passed =
    correct === fixtures.length &&
    crashed === 0 &&
    falseMemoryTotal > 0 &&
    falseMemoryCount / falseMemoryTotal < 0.05 &&
    correctionTotal > 0 &&
    correctionCount / correctionTotal === 1
  return {
    total: fixtures.length,
    correct,
    crashed,
    falseMemoryCount,
    falseMemoryTotal,
    correctionCount,
    correctionTotal,
    results,
    exitCode: passed ? 0 : 1,
  }
}

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import { evaluateMemoryCandidate } from '@dhcb/core-personal/memoryService'
import { runMemoryEvaluation } from './lib/memoryEval'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const FIXTURES_PATH = path.join(SCRIPT_DIR, 'eval-v2-memory-fixtures.json')

async function main() {
  const rawFixtures: unknown = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'))
  const summary = await runMemoryEvaluation(rawFixtures, async (fx) => {
    const mockRunner = {
      query: async () => {
        const rows = (fx.existingRecords || []).map((r, i) => ({
          id: `rec-${i}`,
          content: r.content,
          provenance: r.provenance,
          sensitivity: r.sensitivity,
        }))
        return { rows, rowCount: rows.length, command: '', oid: 0, fields: [] }
      },
    } as Parameters<typeof evaluateMemoryCandidate>[0]

    const result = await evaluateMemoryCandidate(mockRunner, 'person-123', fx.candidate)
    return result.outcome
  })

  for (const result of summary.results) {
    if (result.actual !== result.expected) {
      console.log(`❌ Failed: ${result.id} - ${result.description}`)
      console.log(`  Expected: ${result.expected}, Actual: ${result.actual ?? 'ERROR'}`)
      if (result.error) console.log(`  Error: ${result.error}`)
    }
  }

  const overallAccuracy = (summary.correct / summary.total) * 100
  const falseMemoryRate = summary.falseMemoryCount / summary.falseMemoryTotal
  const correctionRate = summary.correctionCount / summary.correctionTotal

  console.log(`\n=== Eval Memory V2 ===`)
  console.log(
    `Overall Accuracy: ${overallAccuracy.toFixed(2)}% (${summary.correct}/${summary.total})`,
  )
  console.log(`Crashed Cases: ${summary.crashed} (Target: 0)`)
  console.log(`False Memory Rate: ${(falseMemoryRate * 100).toFixed(2)}% (Target: < 5%)`)
  console.log(`Correction Rate: ${(correctionRate * 100).toFixed(2)}% (Target: 100%)`)

  console.log(summary.exitCode === 0 ? '✅ Passed thresholds' : '❌ Failed thresholds')
  process.exit(summary.exitCode)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

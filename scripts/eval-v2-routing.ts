// scripts/eval-v2-routing.ts — Đo độ chính xác định tuyến ý định/miền của Bạn Đồng Hành.
//
//   npm run eval:v2:routing              # bảng từ khoá (miễn phí, tất định)
//   npm run eval:v2:routing -- --haiku   # bộ định tuyến Haiku của chế độ tác tử (GĐ3) — TỐN PHÍ
//                                        # API, cần ANTHROPIC_API_KEY trong .env; chạy tay, không CI.
//
// Ở chế độ `--haiku`, ca có miền của ba trụ đã gỡ (career/startup/life) bị BỎ QUA: bộ định tuyến
// chỉ biết các miền đang tồn tại (`ROUTER_DOMAINS`), so với nhãn cũ là chấm sai oan.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { resolveIntentAndDomain } from '@dhcb/core-personal/companionRuntime'
import { ROUTER_DOMAINS, routeIntent } from '@dhcb/core-personal/intentRouter'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const FIXTURES_PATH = path.join(SCRIPT_DIR, 'eval-v2-routing-fixtures.json')
const USE_HAIKU = process.argv.slice(2).includes('--haiku')

interface Fixture {
  id: string
  input: string
  expectedIntent: string
  expectedDomain: string
}

async function main() {
  const all: Fixture[] = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8'))
  let apiKey: string | undefined
  if (USE_HAIKU) {
    dotenv.config({ path: path.join(SCRIPT_DIR, '..', '.env') })
    apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('❌ --haiku cần ANTHROPIC_API_KEY trong .env')
      process.exit(1)
    }
  }
  const known = new Set<string>(ROUTER_DOMAINS)
  const fixtures = USE_HAIKU ? all.filter((fx) => known.has(fx.expectedDomain)) : all
  if (fixtures.length < all.length) {
    console.log(`(bỏ qua ${all.length - fixtures.length} ca thuộc miền đã gỡ)`)
  }

  let correct = 0
  let viaKeyword = 0
  const intentScores: Record<string, { correct: number; total: number }> = {}

  for (const fx of fixtures) {
    if (!intentScores[fx.expectedIntent]) {
      intentScores[fx.expectedIntent] = { correct: 0, total: 0 }
    }
    intentScores[fx.expectedIntent]!.total++

    const keyword = resolveIntentAndDomain(fx.input)
    const result = USE_HAIKU
      ? await routeIntent({
          ...(apiKey ? { apiKey } : {}),
          message: fx.input,
          keywordFallback: keyword,
        })
      : keyword
    // Haiku hỏng ⇒ rơi về bảng từ khoá: đếm riêng để biết con số đo có thật là của Haiku không.
    if (USE_HAIKU && 'source' in result && result.source === 'keyword') viaKeyword++
    const isCorrect = result.intent === fx.expectedIntent && result.domain === fx.expectedDomain

    if (isCorrect) {
      correct++
      intentScores[fx.expectedIntent]!.correct++
    } else {
      console.log(`❌ Failed: ${fx.id}`)
      console.log(`  Input: ${fx.input}`)
      console.log(`  Expected: ${fx.expectedIntent} / ${fx.expectedDomain}`)
      console.log(`  Actual: ${result.intent} / ${result.domain}`)
    }
  }

  const overallAccuracy = (correct / fixtures.length) * 100
  console.log(`\n=== Eval Routing V2 (${USE_HAIKU ? 'Haiku' : 'bảng từ khoá'}) ===`)
  console.log(`Overall Accuracy: ${overallAccuracy.toFixed(2)}% (${correct}/${fixtures.length})`)
  if (USE_HAIKU) console.log(`Rơi về bảng từ khoá (Haiku lỗi): ${viaKeyword} ca`)

  for (const [intent, score] of Object.entries(intentScores)) {
    console.log(`  - ${intent}: ${((score.correct / score.total) * 100).toFixed(2)}%`)
  }

  if (overallAccuracy >= 85) {
    console.log('✅ Passed threshold (>= 85%)')
    process.exit(0)
  } else {
    console.log('❌ Failed threshold (< 85%)')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

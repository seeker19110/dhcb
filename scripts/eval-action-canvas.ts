// scripts/eval-action-canvas.ts — ĐÁNH GIÁ prompt AI phân rã mục tiêu của Action Canvas
// (changelog 0549, đặc tả docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md).
//
// VÌ SAO: prompt ở packages/core-personal/actionCanvasPrompt.ts quyết định đầu ra có qua được bộ
// kiểm production không. Đầu ra hỏng KHÔNG tốn tiền người dùng (server hoàn lượt) nhưng TỐN TIỀN
// API và làm người dùng thấy lỗi. Script chạy golden set qua ĐÚNG prompt + ĐÚNG chuỗi provider
// production (generateChatText: Anthropic → Groq → Gemini) rồi chấm bằng
// scripts/lib/actionCanvasScoring.ts (dùng lại parseGoalDecomposition của production).
//
// ⚠️ CHẠY TAY, TỐN PHÍ API — KHÔNG đưa vào CI (cùng chính sách eval:tutor / eval:code-feedback).
// Cần 1 trong: GROQ_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY trong .env ở gốc dự án.
// Phần miễn phí (fixture hợp lệ, prompt dựng được, logic chấm) đã có test chạy trong CI:
// scripts/evalActionCanvasFixtures.test.ts + scripts/lib/actionCanvasScoring.test.ts.
//
// Dùng:
//   npm run eval:action-canvas                 # chạy toàn bộ golden set, in bảng
//   npm run eval:action-canvas -- --limit 3    # 3 ca đầu (thử nhanh)
//   npm run eval:action-canvas -- --delay 800  # giãn cách giữa các lời gọi (ms)
//   npm run eval:action-canvas -- --show       # in nguyên văn đầu ra của AI
//
// QUY TRÌNH (CLAUDE.md §8): mọi PR sửa actionCanvasPrompt.ts / goalDecomposition.ts PHẢI chạy lại
// script này và dán kết quả vào mô tả PR. Còn ca vi phạm → exit code 1.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { generateChatText } from '@dhcb/core-ai/chatFallback'
import { buildGoalDecompositionPrompt } from '@dhcb/core-personal/actionCanvasPrompt'
import { GOAL_DECOMPOSITION_JSON_SCHEMA, sanitizeGoal } from '@dhcb/core-personal/goalDecomposition'
import {
  scoreActionCanvasOutput,
  summarizeActionCanvas,
  type ActionCanvasCase,
  type ActionCanvasScore,
} from './lib/actionCanvasScoring.ts'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') })

const args = process.argv.slice(2)
function argVal(name: string, def: string): string {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1]! : def
}
const LIMIT = Number(argVal('--limit', '0'))
const DELAY_MS = Number(argVal('--delay', '500'))
const SHOW = args.includes('--show')

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

interface Fixture extends ActionCanvasCase {
  id: string
  note: string
}

function loadFixtures(): Fixture[] {
  const raw = readFileSync(path.join(SCRIPT_DIR, 'eval-action-canvas-fixtures.json'), 'utf8')
  const parsed = JSON.parse(raw) as { cases: Fixture[] }
  return LIMIT > 0 ? parsed.cases.slice(0, LIMIT) : parsed.cases
}

async function main(): Promise<void> {
  if (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    console.error('❌ Cần GROQ_API_KEY hoặc ANTHROPIC_API_KEY hoặc GEMINI_API_KEY trong .env')
    process.exitCode = 1
    return
  }

  const fixtures = loadFixtures()
  console.log(`\n▶ Eval AI phân rã mục tiêu (Action Canvas) — ${fixtures.length} ca\n`)

  const scores: ActionCanvasScore[] = []
  for (const f of fixtures) {
    // Đi đúng đường production: làm sạch mục tiêu như handler rồi mới dựng prompt.
    const prompt = buildGoalDecompositionPrompt(sanitizeGoal(f.goal))
    const text = await generateChatText({
      system: prompt.system,
      userMessage: prompt.userMessage,
      maxTokens: prompt.maxTokens,
      // Nhãn riêng để lượt eval KHÔNG lẫn vào chi phí thật của người dùng trên dashboard.
      mode: 'eval-action-canvas',
      // Cùng nhiệm vụ với production → cùng model Claude (aiConfig.ts#getAnthropicRoute).
      task: 'action_canvas',
      // Cùng khuôn JSON ép Claude như production — eval đo đúng thứ người dùng nhận.
      outputSchema: GOAL_DECOMPOSITION_JSON_SCHEMA,
    })

    const score = scoreActionCanvasOutput(f, text ?? '')
    scores.push(score)
    const mark = score.passed ? '✅' : '❌'
    console.log(`${mark} ${f.id} (${score.stepCount} bước) — ${f.note}`)
    if (!score.passed) console.log(`   ↳ vi phạm: ${score.violations.join(' · ')}`)
    if (SHOW) {
      console.log(
        `   ↳ AI: ${(text ?? '(không gọi được provider nào)').replace(/\n/g, '\n     ')}\n`,
      )
    }
    await sleep(DELAY_MS)
  }

  const s = summarizeActionCanvas(scores)
  console.log(`\n── Tổng kết ──`)
  console.log(
    `Đạt: ${s.passed}/${s.total} (${((s.passed / Math.max(1, s.total)) * 100).toFixed(1)}%)`,
  )
  for (const [v, n] of Object.entries(s.byViolation)) console.log(`  · ${v}: ${n} ca`)

  if (s.passed !== s.total) {
    console.log('\n❌ Còn ca vi phạm — SỬA PROMPT trước khi tạo PR.')
    process.exitCode = 1
  } else {
    console.log('\n✅ Sạch bất biến.')
  }
}

void main()

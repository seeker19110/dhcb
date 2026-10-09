// scripts/eval-code-feedback.ts — ĐÁNH GIÁ prompt AI phản hồi code môn Lập trình (PR-L5).
//
// VÌ SAO: prompt ở packages/subject-programming/feedbackPrompt.ts là thứ giữ cho AI KHÔNG làm
// bài hộ học viên. Sửa vài chữ trong đó là ranh giới sư phạm trôi mà không cổng nào đỏ — đúng
// vấn đề mà eval:tutor giải cho gia sư ngôn ngữ. Script này chạy golden set qua ĐÚNG prompt +
// ĐÚNG chuỗi provider production (generateChatText: Anthropic → Groq → Gemini) rồi chấm tự
// động các bất biến ở scripts/lib/codeFeedbackScoring.ts.
//
// ⚠️ CHẠY TAY, TỐN PHÍ API — KHÔNG đưa vào CI (cùng chính sách với eval:tutor). Cần 1 trong:
// GROQ_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY trong .env ở gốc dự án.
//
// Dùng:
//   npm run eval:code-feedback                 # chạy toàn bộ golden set, in bảng
//   npm run eval:code-feedback -- --limit 3    # 3 ca đầu (thử nhanh)
//   npm run eval:code-feedback -- --delay 800  # giãn cách giữa các lời gọi (ms)
//   npm run eval:code-feedback -- --show       # in nguyên văn câu trả lời của AI
//
// QUY TRÌNH (CLAUDE.md §8): mọi PR sửa feedbackPrompt.ts PHẢI chạy lại script này và dán kết
// quả vào mô tả PR. Bất biến KHÔNG có "phần lớn là đủ": còn 1 ca vi phạm → exit code 1.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { generateChatText } from '@dhcb/core-ai/chatFallback'
import { getLesson } from '@dhcb/subject-programming/lessons'
import {
  buildCodeFeedbackPrompt,
  type CodeFeedbackKind,
} from '@dhcb/subject-programming/feedbackPrompt'
import { scoreFeedback, summarize, type CaseScore } from './lib/codeFeedbackScoring.ts'

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

interface Fixture {
  id: string
  lessonId: string
  kind: CodeFeedbackKind
  code: string
  note: string
  hintLevel?: number
  errorText?: string
  errorName?: string
}

function loadFixtures(): Fixture[] {
  const raw = readFileSync(path.join(SCRIPT_DIR, 'eval-code-feedback-fixtures.json'), 'utf8')
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
  console.log(`\n▶ Eval AI phản hồi code — ${fixtures.length} ca\n`)

  const scores: CaseScore[] = []
  for (const f of fixtures) {
    const lesson = getLesson(f.lessonId)
    if (!lesson) {
      console.error(`❌ ${f.id}: bài học "${f.lessonId}" không tồn tại — sửa fixtures.`)
      process.exitCode = 1
      return
    }

    const prompt = buildCodeFeedbackPrompt({
      kind: f.kind,
      lesson,
      code: f.code,
      hintLevel: f.hintLevel,
      errorText: f.errorText,
    })
    const text = await generateChatText({
      system: prompt.system,
      userMessage: prompt.userMessage,
      maxTokens: prompt.maxTokens,
      // Nhãn riêng để lượt eval KHÔNG lẫn vào chi phí thật của người học trên dashboard.
      mode: 'eval-code-feedback',
      // Cùng nhiệm vụ với production → cùng model Claude (aiConfig.ts#getAnthropicRoute).
      task: 'code_feedback',
    })

    const score = scoreFeedback({ kind: f.kind, text: text ?? '', errorName: f.errorName })
    scores.push(score)
    const mark = score.passed ? '✅' : '❌'
    console.log(`${mark} ${f.id} (${f.kind}) — ${f.note}`)
    if (!score.passed) console.log(`   ↳ vi phạm: ${score.violations.join(' · ')}`)
    if (SHOW)
      console.log(
        `   ↳ AI: ${(text ?? '(không gọi được provider nào)').replace(/\n/g, '\n     ')}\n`,
      )
    await sleep(DELAY_MS)
  }

  const s = summarize(scores)
  console.log(`\n── Tổng kết ──`)
  console.log(`Đạt: ${s.passed}/${s.total} (${(s.passRate * 100).toFixed(1)}%)`)
  for (const [v, n] of Object.entries(s.byViolation)) console.log(`  · ${v}: ${n} ca`)

  if (s.passed !== s.total) {
    console.log('\n❌ Còn ca vi phạm bất biến — SỬA PROMPT trước khi tạo PR.')
    process.exitCode = 1
  } else {
    console.log('\n✅ Sạch bất biến.')
  }
}

void main()

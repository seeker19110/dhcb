// scripts/eval-tutor.ts — ĐÁNH GIÁ OFFLINE chất lượng sửa lỗi của "gia sư AI" (⑤ T1).
//
// VÌ SAO: prompt/model hiện tốt nhưng KHÔNG đo được sửa đúng bao nhiêu %, bịa lỗi bao nhiêu —
// đổi prompt/model là "đổi mù". Script này chạy golden set (scripts/eval-tutor-fixtures.json)
// qua ĐÚNG prompt + model + guardrail production (api/_lib/aiConfig.ts, src/prompts) rồi chấm
// tự động: recall (bắt lỗi thật) · precision (bịa lỗi ở câu đúng) · JSON hợp lệ (speaking) ·
// feedback đúng tiếng Việt.
//
// ⚠️ CHẠY TAY, TỐN PHÍ API — KHÔNG đưa vào CI. Cần 1 trong: GEMINI_API_KEY / GROQ_API_KEY /
// ANTHROPIC_API_KEY (ưu tiên Anthropic → Groq → Gemini, ĐÚNG thứ tự packages/core-ai/ai.ts).
// Đặt trong .env ở gốc dự án.
//
// Dùng:
//   npm run eval:tutor                          # chế độ chat, in bảng ra stdout
//   npm run eval:tutor -- --mode speaking       # chế độ speaking (JSON)
//   npm run eval:tutor -- --mode both           # chạy cả hai
//   npm run eval:tutor -- --write-baseline      # ghi docs/research/eval-tutor-baseline.md
//   npm run eval:tutor -- --limit 5             # chỉ 5 câu đầu (thử nhanh)
//   npm run eval:tutor -- --delay 800           # giãn cách giữa các lời gọi (ms), tránh rate limit
//   npm run eval:tutor -- --runs 3              # chạy 3 lượt → trung bình ± SD + khoảng Wilson 95%
//   npm run eval:tutor -- --group clean         # chỉ một nhóm: loại lỗi (vd tense) | error | correct |
//                                               #   edge | clean (đúng+ca biên) | A | B
//   npm run eval:tutor -- --dump eval-dump.jsonl  # lưu NGUYÊN VĂN từng câu trả lời (1 dòng JSON/câu)
//                                               #   để đọc vì sao một câu bị FP/FN
//
// Golden set = scripts/eval-tutor-fixtures.json (62 câu cũ, chiều A) + scripts/eval-tutor-fixtures-extra.json
// (bộ mở rộng, cả hai chiều). `--limit 62` (không kèm --group) tái hiện đúng bộ 62 câu của baseline cũ.
//
// QUY TRÌNH (CLAUDE.md §8): mọi PR đổi prompt (src/prompts) hoặc model (aiConfig) PHẢI chạy lại
// eval và dán bảng so sánh với baseline vào mô tả PR.

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { chatSystemPrompt, speakingSystemPrompt } from '../apps/dhcb/src/prompts/index.ts'
import { callGemini } from '@dhcb/core-ai/geminiApi'
import { fetchWithTimeout } from '@dhcb/core-http/fetchTimeout'
import { groqKeyPool, isSkippableGroqKeyError } from '@dhcb/core-ai/groqKeyPool'
import {
  GEMINI_CHAT_MODEL,
  GROQ_CHAT_MODEL,
  SYSTEM_GUARDRAIL,
  getAnthropicRoute,
} from '@dhcb/core-ai/aiConfig'
import { callAnthropicText } from '@dhcb/core-ai/anthropicClient'
import {
  parseFixtures,
  parseRichFixtures,
  buildDumpRecord,
  scoreOne,
  summarize,
  ERROR_TYPES,
  type EvalMode,
  type EvalResult,
  type ErrorType,
  type Fixture,
  type Summary,
} from './lib/evalScoring.ts'
import {
  aggregateGroups,
  aggregateOverall,
  fixtureInGroup,
  parseGroup,
  parseRuns,
  renderStatsTable,
} from './lib/evalStats.ts'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const FIXTURES_PATH = path.join(SCRIPT_DIR, 'eval-tutor-fixtures.json')
const EXTRA_FIXTURES_PATH = path.join(SCRIPT_DIR, 'eval-tutor-fixtures-extra.json')
const BASELINE_PATH = path.join(PROJECT_ROOT, 'docs', 'research', 'eval-tutor-baseline.md')

dotenv.config({ path: path.join(PROJECT_ROOT, '.env') })

const AI_TIMEOUT_MS = 30_000
const MAX_TOKENS = 1024

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
function argVal(name: string, def: string): string {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1]! : def
}
const MODE_ARG = argVal('--mode', 'chat')
const LIMIT = Number(argVal('--limit', '0'))
const DELAY_MS = Number(argVal('--delay', '500'))
// Số lần chờ-rồi-thử-lại tối đa khi CẢ BỂ khoá chạm hạn mức. 5 lần với lùi dần 5s→80s (hoặc
// theo `retry-after` Groq gửi) đủ vượt cửa sổ hạn mức phút của gói free.
const MAX_RETRY_429 = Number(argVal('--max-retry-429', '5'))
const WRITE_BASELINE = args.includes('--write-baseline')
const RUNS_ARG = argVal('--runs', '1')
const GROUP_ARG = argVal('--group', '')
// Đường dẫn file JSONL ghi nguyên văn câu trả lời; rỗng = không ghi. Đường dẫn tương đối tính
// từ thư mục đang đứng (cwd), như mọi công cụ dòng lệnh.
const DUMP_PATH = argVal('--dump', '')
// Ngưỡng tối thiểu số câu chấm được (không lỗi provider) để cho phép ghi baseline.
const NGUONG_TOI_THIEU = 0.8

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// ─── Chọn provider — GIỐNG thứ tự ưu tiên packages/core-ai/ai.ts.
// [2026-08-24] Sửa: comment cũ ghi "Gemini → Groq → Anthropic" nhưng ai.ts đã đổi thứ tự thành
// "Groq → Anthropic → Gemini" từ 2026-08-06 (xem comment ai.ts) — script eval LỆCH so với
// production suốt từ đó, nên số liệu eval trước đây (nếu có) có thể đo NHẦM provider so với cái
// người dùng thật gặp. Phát hiện khi chạy `npm run eval:tutor` thật: script chọn Gemini dù .env
// có đủ GROQ_API_KEY, trong khi production lẽ ra ưu tiên Groq trước.
const GEMINI_KEY = process.env.GEMINI_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// [2026-08-26] PHẢI qua groqKeyPool(), KHÔNG đọc thẳng process.env.GROQ_API_KEY.
// Production hỗ trợ NHIỀU key cách nhau dấu phẩy (packages/core-ai/groqKeyPool.ts). Script này
// trước đây gửi nguyên chuỗi "key1,key2" làm Bearer token → Groq trả 401 Invalid API Key, và
// người đọc kết luận nhầm là khoá hết hạn / dịch vụ chết, trong khi app thật vẫn chạy tốt.
// Đã xảy ra thật: 62/62 câu lỗi 401 dẫn tới một lượt báo động sự cố production hoàn toàn sai.
//
// Bài học chung: công cụ chẩn đoán phải đọc cấu hình GIỐNG HỆT production, nếu không nó đo
// chính nó chứ không đo hệ thống.
const GROQ_KEYS = groqKeyPool()

// [2026-10-09] Production đổi sang Anthropic → Groq → Gemini. Hai chế độ eval (chat, speaking)
// đều là nhiệm vụ 'converse' ở production (getAnthropicRoute) → đo đúng model Haiku người học gặp.
const EVAL_ROUTE = getAnthropicRoute('converse')

function providerLabel(): string {
  if (ANTHROPIC_KEY) return `Anthropic · ${EVAL_ROUTE.model} (effort ${EVAL_ROUTE.effort})`
  if (GROQ_KEYS.length > 0) {
    const n = GROQ_KEYS.length > 1 ? ` (${GROQ_KEYS.length} key)` : ''
    return `Groq · ${GROQ_CHAT_MODEL}${n}`
  }
  if (GEMINI_KEY) return `Gemini · ${GEMINI_CHAT_MODEL}`
  return 'none'
}

type Msg = { role: 'user' | 'assistant'; content: string }

async function callGroq(system: string, messages: Msg[]): Promise<string> {
  // Thử lần lượt từng key trong bể, đúng cách production làm: key hết hạn (401) hoặc chạm hạn
  // mức (429) thì sang key kế, chỉ báo lỗi khi CẢ BỂ đều hỏng.
  //
  // [2026-08-26] Báo lỗi kèm trạng thái của TỪNG key, không chỉ key cuối. Bản trước chỉ giữ
  // `lastErr`, nên khi key #1 chạm hạn mức (429) còn key #3 đã hỏng (401) thì thông báo chỉ
  // hiện 401 — giấu mất tín hiệu quyết định và dẫn tới hai vòng chẩn đoán sai. Công cụ chẩn
  // đoán che bớt số đo còn tệ hơn không có công cụ.
  // [2026-08-26] CHỜ RỒI THỬ LẠI khi CẢ BỂ chạm hạn mức (429). Groq tính hạn mức theo TÀI
  // KHOẢN chứ không theo khoá, nên nhiều khoá cùng một tài khoản sẽ 429 đồng thời — gộp bể
  // không tăng quota. Bản trước bỏ cuộc ngay ở câu đó: đo thật trên VPS cho 21 câu đầu chạy
  // liền mạch rồi 31/62 câu còn lại hỏng hàng loạt, tức baseline chỉ dựa trên nửa bộ đề —
  // không đủ tư cách làm mốc so sánh. Tôn trọng header `retry-after` khi Groq có gửi.
  for (let attempt = 0; ; attempt++) {
    const kq = await thuCaBeGroq(system, messages)
    if (kq.text !== undefined) return kq.text
    if (!kq.allRateLimited || attempt >= MAX_RETRY_429) throw new Error(kq.err)
    const choMs = kq.retryAfterMs ?? Math.min(60_000, 5_000 * 2 ** attempt)
    process.stdout.write(` [429 — chờ ${Math.round(choMs / 1000)}s rồi thử lại]`)
    await sleep(choMs)
  }
}

type KetQuaBe = {
  text?: string
  err: string
  allRateLimited: boolean
  retryAfterMs?: number
}

async function thuCaBeGroq(system: string, messages: Msg[]): Promise<KetQuaBe> {
  const statuses: string[] = []
  let fatal = ''
  let allRateLimited = GROQ_KEYS.length > 0
  let retryAfterMs: number | undefined
  for (const [i, key] of GROQ_KEYS.entries()) {
    const resp = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_CHAT_MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      },
      AI_TIMEOUT_MS,
    )
    if (resp.ok) {
      const data = (await resp.json()) as { choices?: Array<{ message?: { content?: unknown } }> }
      const text = data.choices?.[0]?.message?.content
      if (typeof text !== 'string') throw new Error('Groq trả về cấu trúc không hợp lệ')
      return { text, err: '', allRateLimited: false }
    }
    statuses.push(`#${i + 1}\u2192${resp.status}`)
    if (resp.status === 429) {
      const ra = Number(resp.headers.get('retry-after'))
      // Lấy khoảng chờ DÀI NHẤT trong bể: chờ ngắn hơn thì khoá kia vẫn còn bị chặn.
      if (Number.isFinite(ra) && ra > 0) {
        retryAfterMs = Math.max(retryAfterMs ?? 0, Math.min(120_000, ra * 1000))
      }
    } else {
      allRateLimited = false
    }
    if (!isSkippableGroqKeyError(resp.status)) {
      fatal = (await resp.text()).slice(0, 160)
      break
    }
  }
  if (GROQ_KEYS.length === 0) {
    return { err: 'Groq: bể khoá rỗng', allRateLimited: false }
  }
  return {
    err: `Groq cả bể hỏng [${statuses.join(' ')}]${fatal ? ` \u2014 ${fatal}` : ''}`,
    allRateLimited,
    retryAfterMs,
  }
}

async function callAnthropic(system: string, messages: Msg[]): Promise<string> {
  // Đi ĐÚNG lớp gọi production (anthropicClient.ts): cùng model/effort/trần token, cùng cách
  // lọc khối text — đo "cái người dùng thật nhận", không đo một đường gọi riêng của script.
  const r = await callAnthropicText({
    apiKey: ANTHROPIC_KEY!,
    route: EVAL_ROUTE,
    system,
    messages,
  })
  if (r.kind === 'success') return r.text
  if (r.kind === 'api_error') throw new Error(`Anthropic ${r.status}: ${r.message.slice(0, 200)}`)
  if (r.kind === 'network_error') throw new Error(`Anthropic lỗi mạng: ${r.message}`)
  throw new Error(`Anthropic không dùng được (${r.reason}: ${r.detail})`)
}

async function callProvider(system: string, userText: string): Promise<string> {
  const messages: Msg[] = [{ role: 'user', content: userText }]
  if (ANTHROPIC_KEY) return callAnthropic(system, messages)
  if (GROQ_KEYS.length > 0) return callGroq(system, messages)
  if (GEMINI_KEY) return callGemini(GEMINI_KEY, GEMINI_CHAT_MODEL, system, messages, MAX_TOKENS)
  throw new Error('Chưa cấu hình GEMINI_API_KEY / GROQ_API_KEY / ANTHROPIC_API_KEY')
}

// Dựng system prompt ĐÚNG như production: guardrail (server) + prompt nền theo mode (client).
// Situation 'free' để trung tính; dir 'A' (người Việt học tiếng Anh) — nơi VIET_COMMON_ERRORS áp dụng.
function systemFor(mode: EvalMode, fx: Fixture): string {
  const base =
    mode === 'speaking'
      ? speakingSystemPrompt('free', fx.level, fx.dir)
      : chatSystemPrompt('free', fx.level, fx.dir)
  return SYSTEM_GUARDRAIL + base
}

// Ghi 1 dòng JSONL ngay sau mỗi câu (không đợi cuối lượt) → chạy dở bị ngắt vẫn giữ được phần đã có.
function dumpLine(...args: Parameters<typeof buildDumpRecord>): void {
  if (DUMP_PATH) appendFileSync(DUMP_PATH, JSON.stringify(buildDumpRecord(...args)) + '\n')
}

async function runMode(mode: EvalMode, fixtures: Fixture[], run = 1): Promise<EvalResult[]> {
  const out: EvalResult[] = []
  process.stderr.write(`\n▶ Chế độ ${mode} — ${fixtures.length} câu\n`)
  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i]!
    process.stderr.write(`  ${String(i + 1).padStart(2)}/${fixtures.length} ${fx.id} … `)
    // Chỉ lời gọi provider nằm trong try: lỗi ghi file dump KHÔNG được bị đếm nhầm thành lỗi
    // provider (sẽ đẩy thêm một kết quả thứ hai cho cùng câu và làm sai số liệu).
    let text: string | null = null
    try {
      text = await callProvider(systemFor(mode, fx), fx.input)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      dumpLine(run, mode, fx, null, msg)
      out.push({
        id: fx.id,
        kind: fx.kind,
        expectedErrors: fx.expectedErrors,
        outcome: 'FN', // placeholder — bị loại khỏi metric vì providerError
        feedbackNonEmpty: false,
        feedbackVi: false,
        jsonValid: mode === 'speaking' ? false : null,
        typeHit: false,
        providerError: msg,
      })
      process.stderr.write(`LỖI: ${msg}\n`)
    }
    if (text !== null) {
      const r = scoreOne(mode, fx, text)
      out.push(r)
      process.stderr.write(`${r.outcome}${r.jsonValid === false ? ' (JSON hỏng)' : ''}\n`)
      dumpLine(run, mode, fx, text)
    }
    if (DELAY_MS > 0 && i < fixtures.length - 1) await sleep(DELAY_MS)
  }
  return out
}

// ─── Định dạng báo cáo markdown ─────────────────────────────────────────────────
function pct(x: number | null): string {
  return x === null ? 'n/a' : `${(x * 100).toFixed(1)}%`
}

function recallByType(
  results: EvalResult[],
): Array<{ type: ErrorType; total: number; hit: number }> {
  const map = new Map<ErrorType, { total: number; hit: number }>()
  for (const t of ERROR_TYPES) map.set(t, { total: 0, hit: 0 })
  for (const r of results) {
    if (r.providerError) continue
    for (const t of r.expectedErrors) {
      const e = map.get(t)!
      e.total++
      if (r.outcome === 'TP') e.hit++
    }
  }
  return ERROR_TYPES.map((t) => ({ type: t, ...map.get(t)! }))
}

interface Section {
  mode: EvalMode
  summary: Summary
  results: EvalResult[]
}

function renderReport(fixtures: Fixture[], sections: Section[]): string {
  const nErr = fixtures.filter((f) => f.kind === 'error').length
  const nOk = fixtures.filter((f) => f.kind === 'correct').length
  const nEdge = fixtures.filter((f) => f.kind === 'edge').length
  const L: string[] = []
  L.push('# Eval gia sư AI — baseline (⑤ T1)')
  L.push('')
  L.push('> Sinh tự động bởi `npm run eval:tutor -- --write-baseline`. KHÔNG sửa tay phần số liệu.')
  L.push('> Phương pháp + cách đọc chỉ số: xem cuối file.')
  L.push('')
  L.push(`- **Ngày chạy:** ${new Date().toISOString().slice(0, 10)}`)
  L.push(`- **Provider · model:** ${providerLabel()}`)
  L.push(`- **Golden set:** ${fixtures.length} câu (${nErr} lỗi · ${nOk} đúng · ${nEdge} ca biên)`)
  L.push(`- **Chế độ chạy:** ${sections.map((s) => s.mode).join(', ')}`)
  L.push('')
  L.push('## Tổng hợp')
  L.push('')
  L.push(
    '| Chế độ | Chấm được | Recall | Precision | FP-rate | Specificity | Feedback VI | JSON hợp lệ | Type-hit* |',
  )
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const s of sections) {
    const m = s.summary
    L.push(
      `| ${s.mode} | ${m.scored}${m.providerErrors ? ` (+${m.providerErrors} lỗi)` : ''} | ${pct(m.recall)} | ${pct(m.precision)} | ${pct(m.falsePositiveRate)} | ${pct(m.specificity)} | ${pct(m.feedbackViRate)} | ${s.mode === 'speaking' ? pct(m.jsonValidRate) : '—'} | ${pct(m.typeHitRate)} |`,
    )
  }
  L.push('')
  for (const s of sections) {
    L.push(`## Recall theo loại lỗi — chế độ ${s.mode}`)
    L.push('')
    L.push('| Loại lỗi | Bắt được / Tổng |')
    L.push('| --- | --- |')
    for (const row of recallByType(s.results)) {
      L.push(`| ${row.type} | ${row.hit}/${row.total} |`)
    }
    L.push('')
    const fn = s.results.filter((r) => !r.providerError && r.outcome === 'FN').map((r) => r.id)
    const fp = s.results.filter((r) => !r.providerError && r.outcome === 'FP').map((r) => r.id)
    const perr = s.results.filter((r) => r.providerError).map((r) => r.id)
    L.push(`**Bỏ sót lỗi (FN):** ${fn.length ? fn.join(', ') : 'không'}`)
    L.push('')
    L.push(`**Bịa lỗi ở câu đúng/ca biên (FP):** ${fp.length ? fp.join(', ') : 'không'}`)
    L.push('')
    if (perr.length) {
      L.push(`**Provider lỗi (không chấm được):** ${perr.join(', ')}`)
      L.push('')
    }
  }
  L.push('## Cách đọc')
  L.push('')
  L.push('- **Recall** = bắt được lỗi thật / tổng câu có lỗi. Cao = ít bỏ sót.')
  L.push('- **Precision** = báo lỗi đúng / tổng lần báo lỗi. Cao = ít bịa.')
  L.push(
    '- **FP-rate** = bịa lỗi trên câu đúng/ca biên. Thấp = tốt (với người mới, sửa SAI hại hơn bỏ SÓT).',
  )
  L.push('- **Feedback VI** = tỉ lệ nhận xét (chiều A) đúng bằng tiếng Việt.')
  L.push(
    '- **JSON hợp lệ** = tỉ lệ câu trả lời speaking đúng schema `{speech,feedback,corrected}`.',
  )
  L.push(
    '- **Type-hit\\*** = ĐO GẦN ĐÚNG bằng từ khoá xem nhận xét có nhắm đúng loại lỗi không — CHỈ tham khảo, không dùng để pass/fail.',
  )
  L.push('')
  return L.join('\n')
}

// Gộp bộ cũ (chiều A, có thể thiếu trường đối chiếu) + bộ mở rộng (cả hai chiều, đủ đối chiếu).
// Thứ tự cố định: bộ cũ trước → `--limit 62` luôn tái hiện đúng bộ 62 câu của baseline cũ.
function loadFixtures(group: ReturnType<typeof parseGroup>): Fixture[] {
  const base = JSON.parse(readFileSync(FIXTURES_PATH, 'utf8')) as unknown[]
  const extra = JSON.parse(readFileSync(EXTRA_FIXTURES_PATH, 'utf8')) as unknown[]
  parseRichFixtures(extra) // fail sớm nếu bộ mở rộng thiếu bản sửa/nguồn
  let fixtures = parseFixtures([...base, ...extra]) // kiểm id trùng trên TOÀN bộ
  if (group) fixtures = fixtures.filter((f) => fixtureInGroup(f, group))
  if (LIMIT > 0) fixtures = fixtures.slice(0, LIMIT)
  return fixtures
}

// CỔNG CHẶN [2026-08-26] — trước đây `--write-baseline` ghi đè VÔ ĐIỀU KIỆN, kể cả khi
// 100% request lỗi provider. Đã xảy ra thật: `GROQ_API_KEY` hết hiệu lực → 62/62 câu trả
// 401 → mọi chỉ số `n/a` → script vẫn in "✅ Đã ghi" và baseline thật bị thay bằng bảng
// rỗng. Một baseline rỗng còn tệ hơn baseline cũ: nó xoá mất mốc so sánh DUY NHẤT, và
// PR sau đó sẽ "không tụt so với baseline" vì chẳng còn gì để tụt.
//
// Luật: chỉ ghi khi chấm được ÍT NHẤT 80% số câu ở MỌI chế độ (và MỌI lượt) đã chạy.
function ghiBaselineNeuDuDuLieu(
  doc: string,
  items: Array<{ label: string; summary: Summary }>,
): void {
  const khongDat = items.filter(({ summary: m }) => {
    const tong = m.scored + m.providerErrors
    return tong === 0 || m.scored / tong < NGUONG_TOI_THIEU
  })

  if (khongDat.length > 0) {
    process.stderr.write('\n❌ KHÔNG ghi baseline — lượt chạy này không đo được đủ dữ liệu.\n')
    for (const { label, summary: m } of khongDat) {
      const tong = m.scored + m.providerErrors
      process.stderr.write(
        `   ${label}: chấm được ${m.scored}/${tong} câu ` +
          `(cần ≥ ${Math.ceil(tong * NGUONG_TOI_THIEU)}), ${m.providerErrors} câu lỗi provider.\n`,
      )
    }
    process.stderr.write(
      '   Baseline CŨ giữ nguyên — nó vẫn là mốc so sánh đúng.\n' +
        '   Sửa nguyên nhân rồi chạy lại: lỗi 401 = khoá API sai/hết hạn (kiểm .env),\n' +
        '   lỗi 404 = tên model sai, lỗi 429 = chạm hạn mức nhà cung cấp.\n',
    )
    process.exit(1)
  }

  writeFileSync(BASELINE_PATH, doc + '\n')
  process.stderr.write(`\n✅ Đã ghi ${path.relative(PROJECT_ROOT, BASELINE_PATH)}\n`)
}

// ─── Báo cáo NHIỀU LƯỢT (--runs N > 1) ──────────────────────────────────────────
function renderMultiRunReport(
  fixtures: Fixture[],
  runs: number,
  group: ReturnType<typeof parseGroup>,
  sections: Array<{ mode: EvalMode; runs: EvalResult[][] }>,
): string {
  const nErr = fixtures.filter((f) => f.kind === 'error').length
  const nOk = fixtures.filter((f) => f.kind === 'correct').length
  const nEdge = fixtures.filter((f) => f.kind === 'edge').length
  const L: string[] = []
  L.push('# Eval gia sư AI — baseline nhiều lượt (⑤ T1)')
  L.push('')
  L.push(
    '> Sinh tự động bởi `npm run eval:tutor -- --runs N --write-baseline`. KHÔNG sửa tay phần số liệu.',
  )
  L.push('> Trung bình ± SD tính GIỮA các lượt (SD mẫu, n−1). Khoảng Wilson 95% tính trên số gộp')
  L.push(
    '> (mỗi lượt-câu là một phép thử) nên hơi LẠC QUAN: các lượt chạy cùng một bộ câu, không độc lập hẳn.',
  )
  L.push('')
  L.push(`- **Ngày chạy:** ${new Date().toISOString().slice(0, 10)}`)
  L.push(`- **Provider · model:** ${providerLabel()}`)
  L.push(
    `- **Golden set:** ${fixtures.length} câu (${nErr} lỗi · ${nOk} đúng · ${nEdge} ca biên)${group ? ` — lọc nhóm "${group}"` : ''}`,
  )
  L.push(`- **Số lượt:** ${runs}`)
  L.push(`- **Chế độ chạy:** ${sections.map((s) => s.mode).join(', ')}`)
  L.push('')
  for (const s of sections) {
    L.push(`## Chế độ ${s.mode} — chỉ số tổng (${runs} lượt)`)
    L.push('')
    L.push(renderStatsTable(aggregateOverall(s.runs.map(summarize))))
    L.push('')
    L.push(`## Theo nhóm — chế độ ${s.mode}`)
    L.push('')
    L.push(renderStatsTable(aggregateGroups(s.runs)))
    L.push('')
  }
  L.push('## Cách đọc')
  L.push('')
  L.push(
    '- **Recall theo nhóm lỗi** = bắt được lỗi / số câu có lỗi đó. **FP-rate** (nhóm correct · edge · clean) = bịa lỗi / số câu đúng.',
  )
  L.push(
    '- Hai lần chạy chỉ đáng coi là KHÁC NHAU khi khoảng Wilson của chúng không chồng lên nhau (hoặc chênh vượt rõ ± SD).',
  )
  L.push(
    '- Type-hit và Feedback VI không có trong bản nhiều lượt; chạy `npm run eval:tutor` một lượt nếu cần.',
  )
  L.push('')
  return L.join('\n')
}

async function mainMultiRun(
  runs: number,
  group: ReturnType<typeof parseGroup>,
  fixtures: Fixture[],
  modes: EvalMode[],
): Promise<void> {
  const sections: Array<{ mode: EvalMode; runs: EvalResult[][] }> = []
  for (const mode of modes) {
    const perRun: EvalResult[][] = []
    for (let i = 1; i <= runs; i++) {
      process.stderr.write(`\n■ Lượt ${i}/${runs} (${mode})`)
      perRun.push(await runMode(mode, fixtures, i))
    }
    sections.push({ mode, runs: perRun })
  }
  const doc = renderMultiRunReport(fixtures, runs, group, sections)
  process.stdout.write('\n' + doc + '\n')
  if (WRITE_BASELINE) {
    ghiBaselineNeuDuDuLieu(
      doc,
      sections.flatMap((s) =>
        s.runs.map((r, i) => ({ label: `${s.mode} lượt ${i + 1}`, summary: summarize(r) })),
      ),
    )
  }
}

// ─── main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (providerLabel() === 'none') {
    console.error(
      '❌ Chưa có key AI. Đặt GEMINI_API_KEY (hoặc GROQ_API_KEY / ANTHROPIC_API_KEY) trong .env rồi chạy lại.',
    )
    process.exit(1)
  }
  if (!['chat', 'speaking', 'both'].includes(MODE_ARG)) {
    console.error(`❌ --mode không hợp lệ: "${MODE_ARG}" (cho phép: chat | speaking | both)`)
    process.exit(1)
  }
  let runs: number
  let group: ReturnType<typeof parseGroup>
  try {
    runs = parseRuns(RUNS_ARG)
    group = parseGroup(GROUP_ARG)
  } catch (e) {
    console.error(`❌ ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  }

  const fixtures = loadFixtures(group)
  if (fixtures.length === 0) {
    console.error(`❌ Không có câu nào khớp --group "${GROUP_ARG}" (và --limit ${LIMIT}).`)
    process.exit(1)
  }

  // Xoá file dump cũ — tránh lẫn kết quả hai lần chạy khác nhau trong cùng một file.
  if (DUMP_PATH) writeFileSync(DUMP_PATH, '')

  const modes: EvalMode[] = MODE_ARG === 'both' ? ['chat', 'speaking'] : [MODE_ARG as EvalMode]
  process.stderr.write(
    `Provider: ${providerLabel()} · ${fixtures.length} câu · delay ${DELAY_MS}ms` +
      `${group ? ` · nhóm ${group}` : ''}` +
      `${runs > 1 ? ` · ${runs} lượt (≈ ${fixtures.length * runs * modes.length} lời gọi AI)` : ''}\n`,
  )
  if (DUMP_PATH)
    process.stderr.write(`Ghi nguyên văn câu trả lời vào: ${path.resolve(DUMP_PATH)}\n`)

  if (runs > 1) {
    await mainMultiRun(runs, group, fixtures, modes)
    return
  }

  const sections: Section[] = []
  for (const mode of modes) {
    const results = await runMode(mode, fixtures)
    sections.push({ mode, summary: summarize(results), results })
  }

  const doc = renderReport(fixtures, sections)
  process.stdout.write('\n' + doc + '\n')

  if (WRITE_BASELINE) {
    ghiBaselineNeuDuDuLieu(
      doc,
      sections.map((s) => ({ label: s.mode, summary: s.summary })),
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

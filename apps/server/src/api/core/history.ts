// api/history.ts — Đồng bộ lịch sử Chat/Viết/Nói + learn_count (Giai đoạn C phần còn lại,
// thay client gọi thẳng Supabase trong src/lib/cloud.ts). Sau cutover khỏi Supabase Auth
// (Giai đoạn B) client không còn Supabase session nên RLS chặn hết — mọi đọc/ghi phải qua
// API này, server tự kiểm user từ Bearer token (validateAuth).
//
// GET  /api/history  → { chat, writing, speaking, usage } (camelCase, 200 phiên gần nhất mỗi
//                       loại, usage 365 ngày gần nhất)
// POST /api/history  body 1 trong 4 dạng:
//   { action:'chat'|'speaking', session:{ id, situation, level, messages, createdAt } }
//   { action:'writing', submission:{ id, essayPrompt, essay, feedback, submittedAt } }
//   { action:'learn-day', day:'YYYY-MM-DD', learnCount }
//
// BẢO MẬT (bất biến, giữ từ cloud.ts cũ): KHÔNG có đường ghi các cột đếm lượt tốn API
// (chat/writing/speaking/stt/pronounce) — server đếm authoritative qua consume_usage.
// Client chỉ được ghi learn_count (streak, không tốn tiền API).

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { addDays, vnDateStr } from '@dhcb/core-db/date'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const SessionSchema = z.object({
  id: z.string().uuid(),
  situation: z.string().max(2_000).default(''),
  level: z.string().max(40).default('beginner'),
  messages: z.array(z.unknown()).max(2_000).default([]),
  createdAt: z.number().int().nonnegative(),
})
const WritingSchema = z.object({
  id: z.string().uuid(),
  essayPrompt: z.string().max(10_000).default(''),
  essay: z.string().max(50_000).default(''),
  feedback: z.string().max(50_000).default(''),
  submittedAt: z.number().int().nonnegative(),
})
const BodySchema = z.union([
  z.object({ action: z.enum(['chat', 'speaking']), session: SessionSchema }),
  z.object({ action: z.literal('writing'), submission: WritingSchema }),
  z.object({
    action: z.literal('learn-day'),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    learnCount: z.number().int().min(0).max(10_000),
  }),
])

// Số phiên mỗi loại (chat/viết/nói) trả về khi kéo lịch sử — trước đây KHÔNG giới hạn, kèm cả cột
// `messages` jsonb, nên phản hồi phình theo năm dùng (audit 2026-10-10, E2.2; chủ dự án chốt 200).
// Phiên cũ hơn vẫn nằm trên server; client gộp theo id nên máy đang có chúng không bị mất.
export const HISTORY_PULL_LIMIT = 200

// Trần `learn_count` một ngày (từ mới + thẻ ôn SRS) — cũng là điểm giải đấu (leaderboard.ts), nên
// client không được tự khai số tuỳ ý (audit 2026-10-10, E2.1; chủ dự án chốt 300/ngày).
export const LEARN_COUNT_DAILY_CAP = 300

interface SessionRow {
  id: string
  user_id: string
  situation: string | null
  level: string | null
  messages: unknown[]
  created_at: string // bigint trả về dạng chuỗi qua node-postgres
}
interface WritingRow {
  id: string
  user_id: string
  essay_prompt: string | null
  essay: string | null
  feedback: string | null
  submitted_at: string
}
interface UsageRow {
  day: string
  chat_count: number
  writing_count: number
  speaking_count: number
  stt_count: number
  pronounce_count: number
  learn_count: number
}

function sessionRowToApp(r: SessionRow) {
  return {
    id: r.id,
    userId: r.user_id,
    situation: r.situation ?? '',
    level: r.level ?? 'beginner',
    messages: Array.isArray(r.messages) ? r.messages : [],
    createdAt: Number(r.created_at),
  }
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'history'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/history' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  const pool = getPgPool()

  if (req.method === 'GET') {
    // 365 ngày để getStreak() phía client tính được chuỗi ngày liên tiếp tối đa 1 năm
    // Ngày mốc tính THEO GIỜ VN như mọi nghiệp vụ ngày khác (`daily_usage.day` được ghi bằng
    // vnDateStr) — trước đây dùng ngày UTC nên khung 365 ngày lệch 7 giờ (audit 2026-09-05, F5).
    const startDate = addDays(vnDateStr(), -365)
    const [chat, writing, speaking, usage] = await Promise.all([
      pool.query<SessionRow>(
        `select id, user_id, situation, level, messages, created_at
           from english.chat_sessions where user_id = $1 order by created_at desc limit $2`,
        [auth.userId, HISTORY_PULL_LIMIT],
      ),
      pool.query<WritingRow>(
        `select id, user_id, essay_prompt, essay, feedback, submitted_at
           from english.writing_submissions where user_id = $1 order by submitted_at desc limit $2`,
        [auth.userId, HISTORY_PULL_LIMIT],
      ),
      pool.query<SessionRow>(
        `select id, user_id, situation, level, messages, created_at
           from english.speaking_sessions where user_id = $1 order by created_at desc limit $2`,
        [auth.userId, HISTORY_PULL_LIMIT],
      ),
      pool.query<UsageRow>(
        `select day, chat_count, writing_count, speaking_count, stt_count,
                pronounce_count, learn_count
           from public.daily_usage where user_id = $1 and day >= $2 order by day desc`,
        [auth.userId, startDate],
      ),
    ])
    return jsonResponse(
      {
        chat: chat.rows.map(sessionRowToApp),
        speaking: speaking.rows.map(sessionRowToApp),
        writing: writing.rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          essayPrompt: r.essay_prompt ?? '',
          essay: r.essay ?? '',
          feedback: r.feedback ?? '',
          submittedAt: Number(r.submitted_at),
        })),
        usage: usage.rows.map((r) => ({
          date: r.day,
          chatCount: r.chat_count,
          writingCount: r.writing_count,
          speakingCount: r.speaking_count,
          sttCount: r.stt_count,
          pronounceCount: r.pronounce_count,
          learnCount: r.learn_count,
        })),
      },
      200,
      allHeaders,
    )
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  }

  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok)
    return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, allHeaders)
  const result = validateBody(BodySchema, parsedBody.raw)
  if (!result.ok)
    return jsonResponse({ error: result.error.message }, result.error.status, allHeaders)
  const body = result.data

  if (body.action === 'chat' || body.action === 'speaking') {
    const table = body.action === 'chat' ? 'chat_sessions' : 'speaking_sessions'
    const s = body.session
    // Mệnh đề WHERE trên DO UPDATE: nếu id đã tồn tại nhưng thuộc user KHÁC thì không
    // ghi đè (thay vai trò RLS cũ — client không chiếm được bản ghi của người khác).
    await pool.query(
      `insert into public.${table} (id, user_id, situation, level, messages, created_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         situation = excluded.situation,
         level = excluded.level,
         messages = excluded.messages,
         created_at = excluded.created_at
       where ${table}.user_id = excluded.user_id`,
      [s.id, auth.userId, s.situation, s.level, JSON.stringify(s.messages), s.createdAt],
    )
    // Lịch sử này do client tự khai, chỉ lưu/hiển thị; không cấp entitlement từ nó.
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  if (body.action === 'writing') {
    const s = body.submission
    await pool.query(
      `insert into english.writing_submissions
         (id, user_id, essay_prompt, essay, feedback, submitted_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         essay_prompt = excluded.essay_prompt,
         essay = excluded.essay,
         feedback = excluded.feedback,
         submitted_at = excluded.submitted_at
       where writing_submissions.user_id = excluded.user_id`,
      [s.id, auth.userId, s.essayPrompt, s.essay, s.feedback, s.submittedAt],
    )
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  if (body.action === 'learn-day') {
    // CHỈ cột learn_count, không đụng các cột đếm lượt tốn API. Khoá chính daily_usage đã
    // đổi thành (user_id, day, subject) từ migration 0029 — subject cố định 'english' (repo
    // này chỉ phục vụ môn tiếng Anh).
    // Chống gian lận điểm giải đấu (audit 2026-10-10, E2.1): bản cũ ghi đè bằng số client gửi
    // (≤ 10.000) cho NGÀY TUỲ Ý — một request là vượt mọi người học thật. Nay: chỉ nhận hôm
    // nay/hôm qua theo giờ VN (hôm qua: máy offline qua nửa đêm), kẹp trần, và chỉ TĂNG trong
    // ngày (greatest) — một request cũ đến muộn không kéo số đã ghi xuống.
    const today = vnDateStr()
    if (body.day !== today && body.day !== addDays(today, -1)) {
      return jsonResponse({ error: 'Chỉ ghi nhận được ngày hôm nay hoặc hôm qua' }, 400, allHeaders)
    }
    const learnCount = Math.min(body.learnCount, LEARN_COUNT_DAILY_CAP)
    await pool.query(
      `insert into public.daily_usage (user_id, day, subject, learn_count)
       values ($1, $2, 'english', $3)
       on conflict (user_id, day, subject) do update
         set learn_count = greatest(coalesce(daily_usage.learn_count, 0), excluded.learn_count)`,
      [auth.userId, body.day, learnCount],
    )
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  return jsonResponse({ error: 'Hành động không hợp lệ' }, 400, allHeaders)
}

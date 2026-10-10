// api/subjects/english/mistakes.ts — Đồng bộ SỔ TAY LỖI SAI lên server.
//
// Bối cảnh: trước đây sổ tay chỉ nằm localStorage (apps/dhcb/src/lib/mistakes.ts) — đổi máy
// là mất sạch. Xem docs/research/nang-tam-du-an-2026-08-24.md §2.2 + §4 (Đợt 1 "Không nói dối").
//
// GET  /api/mistakes → { mistakes: Mistake[] } (camelCase, đúng kiểu client đang dùng)
// POST /api/mistakes  body { mistakes: Mistake[] } → hợp nhất cả hai phía, trả về sổ SAU hợp nhất.
// DELETE /api/mistakes?id=<uuid> → xoá một thẻ lỗi.
//
// [S12-2] Mỗi thẻ có thể mang BẰNG CHỨNG (attemptId/contentId — migration 0084). Ba field đó
// tuỳ chọn và không tham gia `dedupe_key`: lỗi trùng vẫn gộp một dòng, bằng chứng giữ bản mới.
//
// Quy tắc hợp nhất (client và server có thể đã lệch nhau khi dùng nhiều máy):
//  * Gộp theo (user_id, dedupe_key) — cùng khoá thì lấy `count` LỚN HƠN (không cộng dồn, vì
//    client gửi lên tổng tích luỹ của máy đó chứ không phải phần tăng thêm; cộng dồn sẽ thổi
//    phồng số lần mắc lỗi mỗi lần đồng bộ).
//  * `created_at` (lần mắc gần nhất) và `last_reviewed_at` lấy mốc MỚI HƠN.
//  * `review_count` lấy giá trị lớn hơn.
//  * `corrected`/`explanation` ưu tiên bản client gửi lên nếu không rỗng (AI đôi khi diễn đạt
//    rõ hơn ở lần sau — đúng hành vi addMistake() ở client).

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

// Trần số thẻ giữ lại mỗi người — khớp MAX_MISTAKES ở client để hai phía không đá nhau.
const MAX_MISTAKES = 200
// Trần số thẻ nhận trong MỘT lần đồng bộ (chặn payload khổng lồ).
const MAX_SYNC_BATCH = 500

const MistakeSchema = z
  .object({
    id: z.uuid(),
    wrong: z.string().min(1).max(500),
    corrected: z.string().max(500).default(''),
    explanation: z.string().max(500).default(''),
    source: z.enum(['chat', 'writing', 'speaking']),
    dir: z.enum(['A', 'B']),
    createdAt: z.number().int().nonnegative(),
    count: z.number().int().positive().max(100_000),
    lastReviewedAt: z.number().int().nonnegative().nullable().default(null),
    reviewCount: z.number().int().nonnegative().max(100_000).default(0),
    // [S12-2] Bằng chứng, đều TUỲ CHỌN: sổ lỗi cũ (và mọi lỗi từ Chat/Viết/Nói hôm nay) không
    // có lượt nộp nào để trỏ tới, và giao diện phải nói thẳng "ghi tay" thay vì giả bằng chứng.
    attemptId: z
      .string()
      .regex(/^[A-Za-z0-9-]{16,64}$/)
      .optional(),
    contentId: z.string().min(1).max(64).optional(),
    subjectId: z.literal('english').optional(),
  })
  .strict()

const SyncSchema = z.object({ mistakes: z.array(MistakeSchema).max(MAX_SYNC_BATCH) }).strict()

// Chuẩn hoá để so trùng — PHẢI khớp hàm norm() của apps/dhcb/src/lib/mistakes.ts.
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function dedupeKey(wrong: string, corrected: string): string {
  return `${norm(wrong)}→${norm(corrected)}`
}

interface MistakeRow {
  id: string
  wrong: string
  corrected: string
  explanation: string
  source: 'chat' | 'writing' | 'speaking'
  dir: 'A' | 'B'
  created_at: Date
  count: number
  last_reviewed_at: Date | null
  review_count: number
  attempt_id: string | null
  content_id: string | null
  subject_id: string
}

/**
 * Cột `attempt_id` là `uuid` (migration 0084). `AttemptIdSchema` của S11 cố ý RỘNG hơn uuid vì
 * `crypto.randomUUID` vắng mặt trên WebView cũ nên client có nhánh dự phòng. Giá trị không phải
 * uuid mà bind thẳng vào SQL sẽ làm CẢ mẻ đồng bộ đổ 500 — nên ở đây nó rơi về `null` (mất móc
 * bằng chứng của đúng thẻ đó, giữ nguyên phần còn lại của sổ) thay vì làm hỏng lần đồng bộ.
 */
function uuidHoacNull(v: string | undefined): string | null {
  return v && z.uuid().safeParse(v).success ? v : null
}

// Hàng DB → đúng hình dạng client mong đợi (thời gian là mili-giây epoch).
function rowToMistake(r: MistakeRow) {
  return {
    id: r.id,
    wrong: r.wrong,
    corrected: r.corrected,
    explanation: r.explanation,
    source: r.source,
    dir: r.dir,
    createdAt: r.created_at.getTime(),
    count: r.count,
    lastReviewedAt: r.last_reviewed_at ? r.last_reviewed_at.getTime() : null,
    reviewCount: r.review_count,
    // Field vắng thay vì `null`: kiểu client khai chúng `?:`, và `undefined` là cách nói
    // "không có bằng chứng" mà giao diện đã hiểu sẵn.
    ...(r.attempt_id ? { attemptId: r.attempt_id } : {}),
    ...(r.content_id ? { contentId: r.content_id } : {}),
    subjectId: r.subject_id,
  }
}

const SELECT_ALL = `select id, wrong, corrected, explanation, source, dir, created_at, count,
                           last_reviewed_at, review_count, attempt_id, content_id, subject_id
                      from english.mistakes
                     where user_id = $1
                     order by count desc, created_at desc
                     limit ${MAX_MISTAKES}`

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'mistakes'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/mistakes' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)

  const pool = getPgPool()

  if (req.method === 'GET') {
    const { rows } = await pool.query<MistakeRow>(SELECT_ALL, [auth.userId])
    return jsonResponse({ mistakes: rows.map(rowToMistake) }, 200, headers)
  }

  if (req.method === 'DELETE') {
    const id = new URL(req.url).searchParams.get('id')
    if (!id || !z.uuid().safeParse(id).success)
      return jsonResponse({ error: 'Thiếu hoặc sai tham số id' }, 400, headers)
    await pool.query('delete from english.mistakes where user_id = $1 and id = $2', [
      auth.userId,
      id,
    ])
    return jsonResponse({ ok: true }, 200, headers)
  }

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, headers)

  const parsed = await readJsonBody(req)
  if (!parsed.ok) return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
  const validated = validateBody(SyncSchema, parsed.raw)
  if (!validated.ok)
    return jsonResponse({ error: validated.error.message }, validated.error.status, headers)

  // Một transaction cho cả lô (audit 2026-10-10, E2.3): trước đây tới 500 upsert tuần tự mỗi câu
  // tự commit — chậm (mỗi commit một lần ghi đĩa) và đứt giữa chừng thì lô nửa vời. Vẫn upsert
  // TỪNG dòng chứ không gộp một câu `unnest`: một lô có thể chứa hai thẻ cùng dedupe_key, mà
  // `on conflict do update` trong MỘT câu không được chạm cùng một hàng hai lần.
  await withTransaction(pool, async (client) => {
    for (const m of validated.data.mistakes) {
      // greatest()/least() bỏ qua NULL trong Postgres, nên last_reviewed_at chưa ôn bao giờ ở một
      // phía không xoá mất mốc ôn của phía kia.
      await client.query(
        `insert into english.mistakes
         (id, user_id, dedupe_key, wrong, corrected, explanation, source, dir, count,
          created_at, last_reviewed_at, review_count, attempt_id, content_id, subject_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_timestamp($10 / 1000.0),
               case when $11::bigint is null then null else to_timestamp($11 / 1000.0) end, $12,
               $13::uuid, $14::text, coalesce($15::text, 'english'))
       on conflict (user_id, dedupe_key) do update set
         count            = greatest(english.mistakes.count, excluded.count),
         created_at       = greatest(english.mistakes.created_at, excluded.created_at),
         last_reviewed_at = greatest(english.mistakes.last_reviewed_at, excluded.last_reviewed_at),
         review_count     = greatest(english.mistakes.review_count, excluded.review_count),
         corrected        = case when excluded.corrected <> '' then excluded.corrected
                                 else english.mistakes.corrected end,
         explanation      = case when excluded.explanation <> '' then excluded.explanation
                                 else english.mistakes.explanation end,
         source           = excluded.source,
         dir              = excluded.dir,
         -- Bằng chứng MỚI thắng, nhưng NULL KHÔNG xoá bằng chứng đã có: một máy cũ đồng bộ
         -- lên (không biết field này) không được làm mất móc bằng chứng của máy khác.
         attempt_id       = coalesce(excluded.attempt_id, english.mistakes.attempt_id),
         content_id       = coalesce(excluded.content_id, english.mistakes.content_id),
         subject_id       = coalesce(excluded.subject_id, english.mistakes.subject_id),
         updated_at       = now()`,
        [
          m.id,
          auth.userId,
          dedupeKey(m.wrong, m.corrected),
          m.wrong,
          m.corrected,
          m.explanation,
          m.source,
          m.dir,
          m.count,
          m.createdAt,
          m.lastReviewedAt,
          m.reviewCount,
          uuidHoacNull(m.attemptId),
          m.contentId ?? null,
          m.subjectId ?? null,
        ],
      )
    }

    // Cắt bớt phần vượt trần: bỏ thẻ CŨ nhất & ít lặp nhất trước (đúng luật client).
    await client.query(
      `delete from english.mistakes
      where user_id = $1
        and id not in (select id from english.mistakes where user_id = $1
                        order by count desc, created_at desc limit ${MAX_MISTAKES})`,
      [auth.userId],
    )
  })

  const { rows } = await pool.query<MistakeRow>(SELECT_ALL, [auth.userId])
  return jsonResponse({ mistakes: rows.map(rowToMistake) }, 200, headers)
}

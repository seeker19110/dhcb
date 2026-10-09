// api/_lib/cefrDialogueCheck.ts — SERVER CHẤM LẠI kiểm tra hiểu hội thoại CEFR (đợt 0555).
//
// POST /api/learning/evidence?action=cefr-dialogue   body = DialogueCheckInputSchema
//   → dựng LẠI đề từ `dialogues.json` + seed bằng cùng `buildComprehensionQuiz` của giao diện,
//     chấm, đạt thì ghi "learned|<owner>:<titleEn>" vào `english.learning_progress.cefr_dialogues`
//     (cột đã có, hợp nhất UNION — không migration), trả DialogueCheckResult.
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③–⑤
//
// BA LỚP CHỐNG GIAN LẬN / DÒ ĐÁP ÁN:
//   1. Client không gửi được đúng/sai/điểm (schema `.strict()`), server tự chấm.
//   2. Giới hạn theo TÀI KHOẢN: tối đa MAX_SUBMITS_PER_MIN lượt nộp/phút (thêm vào giới hạn theo IP
//      chung của handler).
//   3. MỖI LƯỢT (seed) CHỈ CHẤM MỘT LẦN: đáp án đúng chỉ trả về SAU khi lượt đã bị "tiêu" — nộp
//      bừa để xem đáp án rồi nộp lại đúng lượt đó sẽ nhận 409 ATTEMPT_USED. Lượt sau (Làm lại) là
//      đề khác.
// Không log PII: không ghi titleEn/đáp án/userId ra log; khoá bộ đếm dùng băm SHA-256.
import { createHash } from 'node:crypto'
import type { Pool } from 'pg'
import {
  consumeWindowCounterStatus,
  resetCounterChecked,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, internalErrorResponse, getClientIp } from '@dhcb/core-http/http'
import { withTransaction } from '@dhcb/core-db/transaction'
import { vnDateStr } from '@dhcb/core-db/date'
import { FREE_WEEKLY_BONUS_PER_DAY } from '@dhcb/core-billing/usage'
import {
  DialogueCheckInputSchema,
  dialogueKey,
  learnedDialogueEntry,
  type DialogueCheckErrorCode,
  type DialogueCheckResult,
} from '@dhcb/core-contracts/cefrDialogueCheck'
import {
  comprehensionSeed,
  regradeComprehension,
} from '@dhcb/subject-english/dialogueComprehension'
import { findCefrDialogue } from '@dhcb/subject-english/dialogueData'

/** Trần số lượt nộp mỗi phút của MỘT tài khoản (người thật làm 3 câu mất cả phút). */
export const MAX_SUBMITS_PER_MIN = 6
/** Cửa sổ của giới hạn theo tài khoản. */
const RATE_WINDOW_MS = 60_000
/** Lượt đã chấm bị "khoá" trong bao lâu — đủ dài để không nộp lại được cùng đề trong ngày. */
const ATTEMPT_LOCK_MS = 24 * 60 * 60 * 1000

/** Khoá bộ đếm "lượt đã chấm" — băm để không đưa tên hội thoại/userId thô vào Redis/log. */
export function attemptLockKey(
  userId: string,
  ownerId: string,
  titleEn: string,
  direction: 'A' | 'B',
  attempt: number,
): string {
  const h = createHash('sha256')
    .update(JSON.stringify([userId, ownerId, titleEn, direction, attempt]))
    .digest('hex')
  return `cefr-dialogue-attempt:${h}`
}

/**
 * Bộ đếm dùng chung (Redis) không sẵn sàng ở production → 503 với mã riêng, KHÔNG nói "nộp quá
 * nhanh"/"lượt đã nộp" (người học chưa làm gì sai). Vẫn fail-closed: không chấm, không ghi.
 */
function unavailable(headers: Record<string, string>): Response {
  return jsonResponse(
    {
      error: 'Máy chủ tạm bận, chưa chấm — thử lại sau ít phút',
      code: 'SERVICE_UNAVAILABLE' satisfies DialogueCheckErrorCode,
    },
    503,
    { ...headers, 'Retry-After': '60' },
  )
}

function fail(
  code: DialogueCheckErrorCode,
  error: string,
  status: number,
  headers: Record<string, string>,
): Response {
  return jsonResponse({ error, code }, status, headers)
}

/**
 * Ghi "đã học" (+ "đã xem") vào `cefr_dialogues` theo kiểu UNION — không bao giờ xoá bản ghi có
 * sẵn. Trả `true` khi bản "đã học" vừa được THÊM (lần đầu), `false` khi đã có từ trước.
 */
async function saveLearned(
  pool: Pool,
  userId: string,
  ownerId: string,
  titleEn: string,
): Promise<boolean> {
  const viewed = dialogueKey(ownerId, titleEn)
  const learned = learnedDialogueEntry(ownerId, titleEn)
  return withTransaction(pool, async (client) => {
    // `for update`: tuần tự với `/api/progress` cùng người dùng (handler đó cũng khoá dòng này).
    const { rows } = await client.query<{ cefr_dialogues: string[] | null }>(
      `select cefr_dialogues from english.learning_progress where user_id = $1 for update`,
      [userId],
    )
    const existing = rows[0]?.cefr_dialogues ?? []
    const add = [viewed, learned].filter((e) => !existing.includes(e))
    if (add.length === 0) return false
    // Nối CHỈ phần tử chưa có — viết trong SQL để kể cả khi dòng vừa được tạo chen giữa (chưa có
    // dòng thì `for update` không khoá được gì) cũng không ghi đè mảng của người khác.
    await client.query(
      `insert into english.learning_progress (user_id, cefr_dialogues)
       values ($1, $2::jsonb)
       on conflict (user_id) do update set
         cefr_dialogues = english.learning_progress.cefr_dialogues || (
           select coalesce(jsonb_agg(x), '[]'::jsonb)
             from jsonb_array_elements(excluded.cefr_dialogues) as x
            where not english.learning_progress.cefr_dialogues @> jsonb_build_array(x)
         ),
         updated_at = now(),
         version = english.learning_progress.version + 1`,
      [userId, JSON.stringify(add)],
    )
    return add.includes(learned)
  })
}

/**
 * Xử lý action `cefr-dialogue`. Nơi gọi (handler `/api/learning/evidence`) đã kiểm phương thức
 * POST, giới hạn theo IP và `validateAuth` — `userId` ở đây LUÔN lấy từ token.
 */
export async function handleCefrDialogueCheck(
  req: Request,
  pool: Pool,
  userId: string,
  headers: Record<string, string>,
): Promise<Response> {
  const rate = await consumeWindowCounterStatus(
    `cefr-dialogue-check:${userId}`,
    MAX_SUBMITS_PER_MIN,
    RATE_WINDOW_MS,
  )
  if (rate === 'unavailable') return unavailable(headers)
  if (rate === 'exhausted') {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', getClientIp(req), {
      path: '/api/learning/evidence#cefr-dialogue',
    })
    return jsonResponse({ error: 'Bạn nộp hơi nhanh — đợi một phút rồi thử lại' }, 429, {
      ...headers,
      'Retry-After': '60',
    })
  }

  const parsed = await readJsonBody(req)
  if (!parsed.ok) return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
  const validated = validateBody(DialogueCheckInputSchema, parsed.raw)
  if (!validated.ok) {
    return jsonResponse({ error: validated.error.message }, validated.error.status, headers)
  }
  const input = validated.data

  const dialogue = findCefrDialogue(input.ownerId, input.titleEn)
  if (!dialogue) return fail('CONTENT_NOT_FOUND', 'Không tìm thấy hội thoại này', 400, headers)

  const graded = regradeComprehension(
    dialogue,
    input.direction,
    comprehensionSeed(input.ownerId, input.titleEn, input.direction, input.attempt),
    input.answers,
  )
  if (!graded.ok) {
    return graded.code === 'NO_QUIZ'
      ? fail('NO_QUIZ', 'Hội thoại này chưa kiểm tra được', 400, headers)
      : fail(
          'QUIZ_MISMATCH',
          'Nội dung hội thoại vừa được cập nhật — tải lại trang rồi làm lại',
          409,
          headers,
        )
  }

  // Tiêu lượt NGAY TRƯỚC khi trả đáp án: lượt nào đã chấm thì không nộp lại được nữa.
  const lockKey = attemptLockKey(
    userId,
    input.ownerId,
    input.titleEn,
    input.direction,
    input.attempt,
  )
  const lock = await consumeWindowCounterStatus(lockKey, 1, ATTEMPT_LOCK_MS)
  if (lock === 'unavailable') return unavailable(headers)
  if (lock === 'exhausted') {
    return fail(
      'ATTEMPT_USED',
      'Lượt này đã được nộp — bấm Làm lại để có câu hỏi mới',
      409,
      headers,
    )
  }

  const { questions, result } = graded
  let saved = false
  if (result.passed) {
    let newlyLearned: boolean
    try {
      newlyLearned = await saveLearned(pool, userId, input.ownerId, input.titleEn)
    } catch (err: unknown) {
      // Chưa ghi được → TRẢ LẠI lượt để người học gửi lại đúng bài đó, không mất công làm.
      if (!(await resetCounterChecked(lockKey))) {
        // Không trả lại được lượt (Redis hỏng) → người học sẽ gặp 409 nếu gửi lại đúng bài này.
        // Log cho vận hành thấy; khoá đã băm, không có userId/tên hội thoại thô.
        console.warn(
          `[cefr-dialogue] không trả lại được lượt sau khi ghi DB lỗi (khoá ${lockKey.slice(-12)})`,
        )
      }
      return internalErrorResponse(err, headers, 'cefr-dialogue-check')
    }
    saved = true
    if (newlyLearned) {
      // Cùng luật thưởng "ngày có học thật" của `/api/progress` (idempotent theo ngày).
      try {
        await pool.query('select public.grant_daily_bonus_rolling($1, $2, $3, $4)', [
          userId,
          vnDateStr(),
          FREE_WEEKLY_BONUS_PER_DAY,
          'english',
        ])
      } catch (err: unknown) {
        // FAIL-OPEN: "đã học" đã commit; lỗi cộng thưởng không làm hỏng lượt nộp.
        console.warn('[cefr-dialogue-check] cộng thưởng lượt lỗi → bỏ qua:', err)
      }
    }
  }

  const body: DialogueCheckResult = {
    correct: result.correct,
    total: result.total,
    required: result.required,
    passed: result.passed,
    saved,
    items: questions.map((q, i) => ({
      questionId: q.id,
      chosenId: result.items[i]?.chosenId ?? null,
      correctId: q.correctId,
      correct: result.items[i]?.correct ?? false,
    })),
  }
  return jsonResponse(body, 200, headers)
}

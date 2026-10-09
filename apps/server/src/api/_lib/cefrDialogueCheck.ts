// api/_lib/cefrDialogueCheck.ts — SERVER CẤP LƯỢT và CHẤM LẠI kiểm tra hiểu hội thoại CEFR
// (đợt 0555 chấm lại; đợt 0558 seed do server cấp, không trả đáp án câu sai; đợt 0559 trần số lần
// nộp sai theo (người, hội thoại)).
//
// POST /api/learning/evidence?action=cefr-dialogue-start   body = DialogueStartInputSchema
//   → ký token lượt (HMAC, TTL), suy SEED ẨN từ chữ ký, dựng đề từ `dialogues.json` + seed bằng
//     cùng `buildComprehensionQuiz` của giao diện, trả token + đề ĐÃ BỎ ĐÁP ÁN.
// POST /api/learning/evidence?action=cefr-dialogue         body = DialogueCheckInputSchema
//   → verify token, suy lại đúng seed, dựng lại đề, chấm, đạt thì ghi "learned|<owner>:<titleEn>"
//     vào `english.learning_progress.cefr_dialogues` (UNION — không migration), trả kết quả
//     KHÔNG có `correctId`; `explanation` chỉ kèm câu đúng.
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③–⑤ và
// docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md.
//
// NĂM LỚP CHỐNG GIAN LẬN / DÒ ĐÁP ÁN:
//   1. Client không gửi được đúng/sai/điểm (schema `.strict()`), server tự chấm.
//   2. Seed không bao giờ rời server: client cầm token mờ, đáp án không tính được từ dữ liệu công
//      khai + mã nguồn. Token gắn `userId`, có hạn, chữ ký so timing-safe.
//   3. Giới hạn theo TÀI KHOẢN: MAX_STARTS_PER_MIN lượt mở + MAX_SUBMITS_PER_MIN lượt nộp mỗi phút
//      (thêm vào giới hạn theo IP chung của handler).
//   4. MỖI LƯỢT (token) CHỈ CHẤM MỘT LẦN; câu sai không trả đáp án đúng, nên nộp bừa chỉ biết
//      "phương án này sai" của riêng đề đó.
//   5. TRẦN LƯỢT SAI (đợt 0559): tối đa DIALOGUE_FAIL_CAP_PER_DAY lượt nộp KHÔNG ĐẠT mỗi 24 giờ cho
//      một cặp (tài khoản, hội thoại). Hết trần thì cả MỞ lượt lẫn NỘP đều 409 `ATTEMPT_CAP` —
//      chặn vét cạn "nộp bừa tới khi đạt" (đặc tả 0558 §⑥).
// Không log PII: không ghi titleEn/đáp án/userId ra log; khoá bộ đếm dùng băm SHA-256.
import { createHash } from 'node:crypto'
import type { Pool } from 'pg'
import {
  consumeWindowCounterCount,
  consumeWindowCounterStatus,
  peekWindowCounter,
  releaseDailyCounter,
  resetCounterChecked,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import {
  SigningKeyUnavailableError,
  hiddenSeedFor,
  signAttemptToken,
  verifyAttemptToken,
} from '@dhcb/core-auth/attemptToken'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, internalErrorResponse, getClientIp } from '@dhcb/core-http/http'
import { withTransaction } from '@dhcb/core-db/transaction'
import { vnDateStr } from '@dhcb/core-db/date'
import { FREE_WEEKLY_BONUS_PER_DAY } from '@dhcb/core-billing/usage'
import {
  DIALOGUE_FAIL_CAP_PER_DAY,
  DialogueCheckInputSchema,
  DialogueStartInputSchema,
  dialogueKey,
  learnedDialogueEntry,
  type DialogueCheckErrorCode,
  type DialogueCheckResult,
  type DialogueStartResult,
} from '@dhcb/core-contracts/cefrDialogueCheck'
import {
  buildComprehensionQuiz,
  regradeComprehension,
  toPublicComprehensionQuestion,
} from '@dhcb/subject-english/dialogueComprehension'
import { findCefrDialogue } from '@dhcb/subject-english/dialogueData'

/** Trần số lượt MỞ mỗi phút của MỘT tài khoản (Thử lại/Làm lại vài lần là chuyện thường). */
export const MAX_STARTS_PER_MIN = 12
/** Trần số lượt NỘP mỗi phút của MỘT tài khoản (người thật làm 3 câu mất cả phút). */
export const MAX_SUBMITS_PER_MIN = 6
/** Cửa sổ của giới hạn theo tài khoản. */
const RATE_WINDOW_MS = 60_000
/** Token lượt làm có hiệu lực bao lâu kể từ lúc mở — rộng rãi cho người đọc lại hội thoại. */
export const ATTEMPT_TTL_MS = 60 * 60 * 1000
/** Lượt đã chấm bị "khoá" trong bao lâu — phải ≥ TTL để token còn hạn không nộp lại được. */
const ATTEMPT_LOCK_MS = 24 * 60 * 60 * 1000
/** Cửa sổ của trần lượt nộp sai (tính từ lượt sai ĐẦU, không gia hạn mỗi lần sai). */
export const FAIL_CAP_WINDOW_MS = 24 * 60 * 60 * 1000
/** Không gian khoá của token loại này (tách khỏi mọi loại lượt khác dùng chung khoá gốc). */
export const ATTEMPT_SCOPE = 'cefr-dialogue'

/** Nội dung ký trong token — nhận diện lượt; seed KHÔNG nằm trong đây. */
interface AttemptClaims {
  u: string
  o: string
  t: string
  d: 'A' | 'B'
}

/** Khoá bộ đếm "lượt đã chấm" — băm chữ ký để không đưa gì của token thô vào Redis/log. */
export function attemptLockKey(signature: string): string {
  const h = createHash('sha256').update(signature).digest('hex')
  return `cefr-dialogue-attempt:${h}`
}

/**
 * Khoá bộ đếm "lượt nộp sai" của một cặp (tài khoản, hội thoại). KHÔNG gồm chiều A/B: đổi chiều
 * không được thêm lượt đoán. Băm SHA-256 của bộ ba mã hoá JSON (không nhập nhằng ranh giới) — không
 * đưa userId/tên hội thoại thô vào Redis/log.
 */
export function failCapKey(userId: string, ownerId: string, titleEn: string): string {
  const h = createHash('sha256')
    .update(JSON.stringify([userId, ownerId, titleEn]))
    .digest('hex')
  return `cefr-dialogue-fail:${h}`
}

/** 409 `ATTEMPT_CAP` — đã nộp sai đủ trần trong 24 giờ; nói rõ việc cần làm, không có "Làm lại". */
function attemptCapped(headers: Record<string, string>): Response {
  return fail(
    'ATTEMPT_CAP',
    `Bạn đã thử sai ${DIALOGUE_FAIL_CAP_PER_DAY} lần hôm nay — đọc lại hội thoại, mai làm tiếp`,
    409,
    headers,
  )
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

function rateLimited(req: Request, which: 'start' | 'submit', headers: Record<string, string>) {
  logSecurityEvent('RATE_LIMIT_EXCEEDED', getClientIp(req), {
    path: `/api/learning/evidence#cefr-dialogue${which === 'start' ? '-start' : ''}`,
  })
  return jsonResponse(
    {
      error:
        which === 'start'
          ? 'Bạn mở bài hơi nhanh — đợi một phút rồi thử lại'
          : 'Bạn nộp hơi nhanh — đợi một phút rồi thử lại',
    },
    429,
    { ...headers, 'Retry-After': '60' },
  )
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

/** Server có đang giữ bản "đã học" của hội thoại này không (đọc nhẹ, không khoá dòng). */
async function isLearned(
  pool: Pool,
  userId: string,
  ownerId: string,
  titleEn: string,
): Promise<boolean> {
  try {
    const { rows } = await pool.query<{ learned: boolean }>(
      `select coalesce(cefr_dialogues @> $2::jsonb, false) as learned
         from english.learning_progress where user_id = $1`,
      [userId, JSON.stringify([learnedDialogueEntry(ownerId, titleEn)])],
    )
    return rows[0]?.learned ?? false
  } catch (err: unknown) {
    // Chỉ là thông tin phụ của 409 — đọc lỗi thì nói "chưa rõ" (false), không làm hỏng phản hồi.
    console.warn('[cefr-dialogue-check] không đọc được trạng thái đã học:', err)
    return false
  }
}

/**
 * MỞ LƯỢT (action `cefr-dialogue-start`). Nơi gọi đã kiểm POST, giới hạn theo IP và
 * `validateAuth` — `userId` LUÔN lấy từ token đăng nhập và được ký vào token lượt.
 */
export async function handleCefrDialogueStart(
  req: Request,
  userId: string,
  headers: Record<string, string>,
): Promise<Response> {
  const rate = await consumeWindowCounterStatus(
    `cefr-dialogue-start:${userId}`,
    MAX_STARTS_PER_MIN,
    RATE_WINDOW_MS,
  )
  if (rate === 'unavailable') return unavailable(headers)
  if (rate === 'exhausted') return rateLimited(req, 'start', headers)

  const parsed = await readJsonBody(req)
  if (!parsed.ok) return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
  const validated = validateBody(DialogueStartInputSchema, parsed.raw)
  if (!validated.ok) {
    return jsonResponse({ error: validated.error.message }, validated.error.status, headers)
  }
  const input = validated.data
  const dialogue = findCefrDialogue(input.ownerId, input.titleEn)
  if (!dialogue) return fail('CONTENT_NOT_FOUND', 'Không tìm thấy hội thoại này', 400, headers)

  // Trần lượt sai: CHỈ ĐỌC (mở lượt không tiêu gì). Hết trần thì không cấp đề — cấp rồi cũng không
  // nộp được. Không miễn cho người đã học: làm lại sau khi đã học không được gì thêm, mà miễn thì
  // tốn một lần đọc DB mỗi lượt mở.
  const fails = await peekWindowCounter(failCapKey(userId, input.ownerId, input.titleEn))
  if (fails === 'unavailable') return unavailable(headers)
  if (fails >= DIALOGUE_FAIL_CAP_PER_DAY) return attemptCapped(headers)

  const claims: AttemptClaims = {
    u: userId,
    o: input.ownerId,
    t: input.titleEn,
    d: input.direction,
  }
  let signed: ReturnType<typeof signAttemptToken>
  try {
    signed = signAttemptToken(ATTEMPT_SCOPE, { ...claims }, ATTEMPT_TTL_MS)
  } catch (err: unknown) {
    if (err instanceof SigningKeyUnavailableError) {
      // Thiếu khoá ở production là lỗi cấu hình — nói cho vận hành, fail-closed với người học.
      console.error('[cefr-dialogue-start]', err.message)
      return unavailable(headers)
    }
    return internalErrorResponse(err, headers, 'cefr-dialogue-start')
  }
  const verified = verifyAttemptToken(ATTEMPT_SCOPE, signed.token)
  if (!verified.ok) {
    // Vừa ký xong mà không verify được là lỗi lập trình, không phải lỗi người dùng.
    return internalErrorResponse(
      new Error('token vừa ký không verify được'),
      headers,
      'cefr-dialogue-start',
    )
  }
  const seed = hiddenSeedFor(ATTEMPT_SCOPE, verified.signature)
  const questions = buildComprehensionQuiz(dialogue, input.direction, seed)
  if (questions.length === 0) {
    return fail('NO_QUIZ', 'Hội thoại này chưa kiểm tra được', 400, headers)
  }
  const body: DialogueStartResult = {
    token: signed.token,
    expiresAt: signed.expiresAt,
    questions: questions.map(toPublicComprehensionQuestion),
  }
  return jsonResponse(body, 200, headers)
}

/** Đọc claims từ payload token đã verify; token của loại khác/đời khác → `null`. */
function readClaims(payload: Record<string, unknown>): AttemptClaims | null {
  const { u, o, t, d } = payload
  if (typeof u !== 'string' || typeof o !== 'string' || typeof t !== 'string') return null
  if (d !== 'A' && d !== 'B') return null
  return { u, o, t, d }
}

/**
 * NỘP LƯỢT (action `cefr-dialogue`). Nơi gọi (handler `/api/learning/evidence`) đã kiểm phương
 * thức POST, giới hạn theo IP và `validateAuth` — `userId` ở đây LUÔN lấy từ token đăng nhập.
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
  if (rate === 'exhausted') return rateLimited(req, 'submit', headers)

  const parsed = await readJsonBody(req)
  if (!parsed.ok) return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
  const validated = validateBody(DialogueCheckInputSchema, parsed.raw)
  if (!validated.ok) {
    return jsonResponse({ error: validated.error.message }, validated.error.status, headers)
  }
  const input = validated.data

  // Verify token: chữ ký trước, hạn sau; rồi mới đối chiếu chủ sở hữu.
  let verified: ReturnType<typeof verifyAttemptToken>
  try {
    verified = verifyAttemptToken(ATTEMPT_SCOPE, input.token)
  } catch (err: unknown) {
    if (err instanceof SigningKeyUnavailableError) {
      // Khoá bị gỡ/đổi sai sau khi đã cấp token — lỗi cấu hình, nói cho vận hành, 503 với người học.
      console.error('[cefr-dialogue-check]', err.message)
      return unavailable(headers)
    }
    return internalErrorResponse(err, headers, 'cefr-dialogue-check')
  }
  const claims = verified.ok ? readClaims(verified.payload) : null
  if (!verified.ok || !claims || claims.u !== userId) {
    // Chữ ký sai / token của người khác là dấu hiệu can thiệp — ghi sự kiện an ninh (không PII:
    // chỉ lý do). Hết hạn là chuyện thường, không log.
    const reason = !verified.ok ? verified.reason : !claims ? 'bad-claims' : 'wrong-user'
    if (reason !== 'expired') {
      logSecurityEvent('ATTEMPT_TOKEN_REJECTED', getClientIp(req), {
        path: '/api/learning/evidence#cefr-dialogue',
        reason,
      })
    }
    return fail(
      'ATTEMPT_EXPIRED',
      'Lượt này đã hết hạn hoặc không hợp lệ — bấm Làm lại để có câu hỏi mới',
      409,
      headers,
    )
  }

  const dialogue = findCefrDialogue(claims.o, claims.t)
  if (!dialogue) return fail('CONTENT_NOT_FOUND', 'Không tìm thấy hội thoại này', 400, headers)

  const graded = regradeComprehension(
    dialogue,
    claims.d,
    hiddenSeedFor(ATTEMPT_SCOPE, verified.signature),
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

  // Tiêu lượt NGAY TRƯỚC khi trả kết quả: lượt nào đã chấm thì không nộp lại được nữa.
  const lockKey = attemptLockKey(verified.signature)
  const lock = await consumeWindowCounterStatus(lockKey, 1, ATTEMPT_LOCK_MS)
  if (lock === 'unavailable') return unavailable(headers)
  if (lock === 'exhausted') {
    // Phản hồi lần trước có thể đã rơi trên đường về SAU khi server ghi "đã học" (mất mạng đúng lúc
    // trả kết quả). Trả kèm `saved` để màn nói thật "bài này ĐÃ được ghi" thay vì bắt làm lại.
    return jsonResponse(
      {
        error: 'Lượt này đã được nộp — bấm Làm lại để có câu hỏi mới',
        code: 'ATTEMPT_USED' satisfies DialogueCheckErrorCode,
        saved: await isLearned(pool, userId, claims.o, claims.t),
      },
      409,
      headers,
    )
  }

  // Trần lượt sai — GIỮ CHỖ trước khi trả kết quả, trả lại chỗ nếu đạt. Tăng nguyên tử (INCR) trước
  // khi lộ bất kỳ đúng/sai nào nên nộp đồng loạt nhiều token cất sẵn cũng không vượt trần: lượt thứ
  // CAP+1 không được chấm. Ròng lại, bộ đếm chỉ tăng ở lượt KHÔNG ĐẠT (đúng ý đặc tả §⑥).
  const { questions, result } = graded
  const failKey = failCapKey(userId, claims.o, claims.t)
  const failCount = await consumeWindowCounterCount(failKey, FAIL_CAP_WINDOW_MS)
  if (failCount === 'unavailable' || failCount > DIALOGUE_FAIL_CAP_PER_DAY) {
    // Lượt này KHÔNG được chấm → trả lại khoá lượt (Redis hồi phục thì gửi lại được) và chỗ vừa giữ
    // (bộ đếm phản ánh đúng số lượt sai thật). Best-effort: Redis đang hỏng thì không trả lại được.
    await resetCounterChecked(lockKey)
    if (failCount === 'unavailable') return unavailable(headers)
    await releaseDailyCounter(failKey)
    return attemptCapped(headers)
  }
  if (result.passed) await releaseDailyCounter(failKey)

  let saved = false
  if (result.passed) {
    let newlyLearned: boolean
    try {
      newlyLearned = await saveLearned(pool, userId, claims.o, claims.t)
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
    items: questions.map((q, i) => {
      const correct = result.items[i]?.correct ?? false
      return {
        questionId: q.id,
        chosenId: result.items[i]?.chosenId ?? null,
        correct,
        // Giải thích CHỈ cho câu đúng — câu sai không lộ đáp án (đặc tả 0558 §③).
        ...(correct ? { explanation: q.explanation } : {}),
      }
    }),
    // Không đạt → nói còn mấy lượt sai trong 24 giờ (giao diện hiện "Còn N lượt hôm nay").
    ...(result.passed ? {} : { attemptsLeft: Math.max(0, DIALOGUE_FAIL_CAP_PER_DAY - failCount) }),
  }
  return jsonResponse(body, 200, headers)
}

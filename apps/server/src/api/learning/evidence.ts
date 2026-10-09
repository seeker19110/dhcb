// apps/server/src/api/learning/evidence.ts — Bằng chứng hoàn thành một hoạt động học (S11).
//
// POST /api/learning/evidence  body = CompletionEvidenceInputSchema (trả lời THÔ)
//      → server CHẤM LẠI bằng @dhcb/core-grading, ghi nhật ký + trạng thái trong 1 transaction,
//        trả CompletionEvidence.
// GET  /api/learning/evidence?subjectId=physics → { state: CompletionState[] } của CHÍNH người
//      đang đăng nhập (không bao giờ nhận userId từ query).
// GET  …&include=attempts → thêm { attempts: CompletionEvidence[] } — 200 lượt nộp MỚI NHẤT của
//      môn đó, kèm `items` (đúng/sai từng câu). Sổ lỗi STEM (S12-2) dựng từ đây chứ KHÔNG có
//      bảng lỗi thứ hai; `answers.raw` (chữ người học gõ) KHÔNG trả về — sổ lỗi không cần nó.
// POST /api/learning/evidence?action=cefr-dialogue-start — MỞ lượt kiểm tra hiểu hội thoại CEFR:
//      server cấp token + đề đã bỏ đáp án (đợt 0558, docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md).
// POST /api/learning/evidence?action=cefr-dialogue — nộp lượt, server chấm LẠI từ seed ẩn trong
//      token (đợt 0555 + 0558, docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md).
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s11-completion-evidence.md §③.4
// Bảng: platform.completion_evidence + platform.completion_state (migration 0081).
//
// NGUYÊN TẮC: client KHÔNG gửi được đúng/sai/điểm (schema `.strict()` không có field đó), và
// server không tin gì ngoài `answers` thô + registry bài học trong mã nguồn.
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
import { jsonResponse, getClientIp, internalErrorResponse } from '@dhcb/core-http/http'
import {
  CompletionEvidenceInputSchema,
  EvidenceSubjectSchema,
  type CompletionEvidence,
  type CompletionState,
  type EvidenceSubject,
} from '@dhcb/core-contracts/completionEvidence'
import { bamNoiDungBaiHoc, type NoiDungCanDuyet } from '@dhcb/core-contracts/lessonReviewHash'
import { decideCompletion } from '@dhcb/core-learner/completionRules'
import { gradeStemEvidence, type StemLessonLike } from '@dhcb/core-learner/stemEvidenceGrader'
import { getMathLesson } from '@dhcb/subject-math/lessons'
import { getPhysicsLesson } from '@dhcb/subject-physics/lessons'
import { getChemLesson } from '@dhcb/subject-chemistry/lessons'
import { getBiologyLesson } from '@dhcb/subject-biology/lessons'
import { rewardReferralIfEligible } from '../_lib/referral.js'
import { handleCefrDialogueCheck, handleCefrDialogueStart } from '../_lib/cefrDialogueCheck.js'
import {
  CEFR_DIALOGUE_ACTION,
  CEFR_DIALOGUE_START_ACTION,
} from '@dhcb/core-contracts/cefrDialogueCheck'

/** Bài học STEM có đủ hai mặt việc này cần: chấm (`checkQuestions.answer`) và băm nội dung. */
type BaiStem = StemLessonLike & NoiDungCanDuyet

/** Server chạy Node nên nạp thẳng registry (đã có sẵn trong bundle qua admin-stem-review). */
const TRA_BAI: Record<EvidenceSubject, (id: string) => BaiStem | undefined> = {
  mathematics: getMathLesson,
  physics: getPhysicsLesson,
  chemistry: getChemLesson,
  biology: getBiologyLesson,
}

// Tham số truy vấn là dữ liệu từ client → validate hết, `.strict()` để tham số lạ bị từ chối
// thay vì âm thầm bỏ qua.
const GetQuerySchema = z
  .object({
    subjectId: EvidenceSubjectSchema,
    /** Chỉ một giá trị được phép; vắng = chỉ trả trạng thái như trước S12-2. */
    include: z.literal('attempts').optional(),
  })
  .strict()

/** Trần số lượt nộp trả về mỗi môn — sổ lỗi chỉ cần các lượt gần đây (đặc tả §②). */
const MAX_ATTEMPTS = 200

interface StateRow {
  subject_id: string
  content_id: string
  status: 'in_progress' | 'completed'
  best_ratio: string
  last_ratio: string
  attempts: number
  completed_at: Date | null
  updated_at: Date
}

interface AttemptRow {
  subject_id: string
  content_id: string
  course_id: string | null
  activity_kind: string
  attempt_id: string
  evidence_kind: string
  correct: number
  total: number
  ratio: string
  passed: boolean
  content_version: string | null
  client_at: Date
  server_at: Date
  answers: { questionIndex: number; correct: boolean; reason: string }[]
}

interface EvidenceRow {
  correct: number
  total: number
  ratio: string
  passed: boolean
  content_version: string | null
  client_at: Date
  server_at: Date
  answers: { questionIndex: number; correct: boolean; reason: string }[]
}

function toState(r: StateRow): CompletionState {
  return {
    subjectId: r.subject_id as EvidenceSubject,
    contentId: r.content_id,
    status: r.status,
    // `numeric` về từ `pg` là CHUỖI (để không mất độ chính xác) — đổi sang số ở đúng một chỗ.
    bestRatio: Number(r.best_ratio),
    lastRatio: Number(r.last_ratio),
    attempts: r.attempts,
    completedAt: r.completed_at ? r.completed_at.toISOString() : null,
    updatedAt: r.updated_at.toISOString(),
    source: 'server',
  }
}

/**
 * Hàng nhật ký → `CompletionEvidence`. `ownerId` lấy từ TOKEN (tham số `userId`), không bao giờ
 * từ hàng dữ liệu: truy vấn đã lọc `user_id = $1` nên hai chỗ luôn khớp, và nếu mai này ai đó
 * nới câu lệnh thì chỗ này vẫn không phát tán id của người khác.
 */
function toAttempt(r: AttemptRow, userId: string): CompletionEvidence {
  return {
    schemaVersion: 1,
    subjectId: r.subject_id as EvidenceSubject,
    contentId: r.content_id,
    ...(r.course_id ? { courseId: r.course_id } : {}),
    activityKind: r.activity_kind as CompletionEvidence['activityKind'],
    attemptId: r.attempt_id,
    clientAt: r.client_at.toISOString(),
    ownerId: userId,
    evidenceKind: r.evidence_kind === 'local_graded' ? 'local_graded' : 'server_graded',
    correct: r.correct,
    total: r.total,
    ratio: Number(r.ratio),
    passed: r.passed,
    ...(r.content_version ? { contentVersion: r.content_version } : {}),
    serverAt: r.server_at.toISOString(),
    // Chỉ kết quả chấm; `raw` (chữ người học gõ) ở lại trong DB.
    items: (Array.isArray(r.answers) ? r.answers : []).map((a) => ({
      questionIndex: a.questionIndex,
      correct: a.correct,
      reason: a.reason,
    })),
  }
}

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'learning-evidence'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/learning/evidence' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)

  const pool = getPgPool()
  try {
    if (req.method === 'GET') {
      const searchParams = new URL(req.url).searchParams
      const parsedQuery = GetQuerySchema.safeParse({
        subjectId: searchParams.get('subjectId') ?? undefined,
        ...(searchParams.has('include') ? { include: searchParams.get('include') } : {}),
      })
      if (!parsedQuery.success) {
        return jsonResponse(
          { error: 'Tham số truy vấn không hợp lệ', code: 'BAD_QUERY' },
          400,
          headers,
        )
      }
      const res = await pool.query<StateRow>(
        `select subject_id, content_id, status, best_ratio, last_ratio, attempts, completed_at, updated_at
           from platform.completion_state
          where user_id = $1 and subject_id = $2`,
        [auth.userId, parsedQuery.data.subjectId],
      )
      if (parsedQuery.data.include !== 'attempts') {
        return jsonResponse({ state: res.rows.map(toState) }, 200, headers)
      }
      // `user_id = $1` lấy từ token đã xác thực — không có đường nào đọc nhật ký của người khác.
      const nhatKy = await pool.query<AttemptRow>(
        `select subject_id, content_id, course_id, activity_kind, attempt_id, evidence_kind,
                correct, total, ratio, passed, content_version, client_at, server_at, answers
           from platform.completion_evidence
          where user_id = $1 and subject_id = $2
          order by server_at desc
          limit ${MAX_ATTEMPTS}`,
        [auth.userId, parsedQuery.data.subjectId],
      )
      return jsonResponse(
        {
          state: res.rows.map(toState),
          attempts: nhatKy.rows.map((r) => toAttempt(r, auth.userId)),
        },
        200,
        headers,
      )
    }

    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, headers)

    // Đợt 0555: kiểm tra hiểu hội thoại CEFR — cùng endpoint "bằng chứng", hợp đồng riêng (lưu vào
    // `cefr_dialogues`, không vào bảng completion_* của STEM). Xem _lib/cefrDialogueCheck.ts.
    const action = new URL(req.url).searchParams.get('action')
    if (action === CEFR_DIALOGUE_START_ACTION) {
      // Đợt 0558: server cấp token lượt + đề đã bỏ đáp án (seed không rời server).
      return await handleCefrDialogueStart(req, auth.userId, headers)
    }
    if (action === CEFR_DIALOGUE_ACTION) {
      return await handleCefrDialogueCheck(req, pool, auth.userId, headers)
    }
    if (action !== null) {
      return jsonResponse({ error: 'Action không hợp lệ', code: 'BAD_ACTION' }, 400, headers)
    }

    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
    const validated = validateBody(CompletionEvidenceInputSchema, parsed.raw)
    if (!validated.ok)
      return jsonResponse({ error: validated.error.message }, validated.error.status, headers)

    const input = validated.data
    if (input.activityKind !== 'stem_lesson_check') {
      return jsonResponse(
        {
          error: 'Hoạt động này đã có nguồn tiến độ riêng, không đi qua endpoint bằng chứng',
          code: 'UNSUPPORTED_ACTIVITY',
        },
        400,
        headers,
      )
    }

    const lesson = TRA_BAI[input.subjectId](input.contentId)
    if (!lesson) {
      return jsonResponse(
        { error: `Bài học "${input.contentId}" không tồn tại`, code: 'CONTENT_NOT_FOUND' },
        400,
        headers,
      )
    }

    const total = lesson.checkQuestions.length
    if (total === 0) {
      // Bài không có câu tự kiểm tra thì KHÔNG có cách đo — không giả vờ đo, không ghi gì.
      return jsonResponse(
        { error: 'Bài này chưa có câu tự kiểm tra', code: 'NO_CHECK_QUESTIONS' },
        400,
        headers,
      )
    }
    if (input.answers.some((a) => a.questionIndex >= total)) {
      return jsonResponse(
        { error: 'Số thứ tự câu hỏi vượt quá số câu của bài', code: 'BAD_QUESTION_INDEX' },
        400,
        headers,
      )
    }

    const graded = gradeStemEvidence(lesson, input.answers)
    const decision = decideCompletion(input.activityKind, graded)
    if (!decision.supported) {
      return jsonResponse(
        { error: 'Không chấm được lượt nộp này', code: decision.reason },
        400,
        headers,
      )
    }
    const passed = decision.passed
    const ratio = decision.ratio
    const contentVersion = bamNoiDungBaiHoc(lesson)
    // Nhật ký lưu CẢ trả lời thô lẫn kết quả chấm của server: S12 lập sổ lỗi từng câu từ đây.
    const answersJson = graded.items.map((item) => ({
      ...item,
      raw: input.answers.find((a) => a.questionIndex === item.questionIndex)?.raw ?? null,
    }))

    const ketQua = await withTransaction(pool, async (client) => {
      const inserted = await client.query<{ id: string }>(
        `insert into platform.completion_evidence
           (user_id, subject_id, content_id, course_id, activity_kind, attempt_id,
            correct, total, ratio, passed, content_version, answers, client_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)
         on conflict on constraint completion_evidence_attempt_uq do nothing
         returning id`,
        [
          auth.userId,
          input.subjectId,
          input.contentId,
          input.courseId ?? null,
          input.activityKind,
          input.attemptId,
          graded.correct,
          total,
          ratio,
          passed,
          contentVersion,
          JSON.stringify(answersJson),
          input.clientAt,
        ],
      )

      if (inserted.rows.length === 0) {
        // Cùng attemptId đã ghi rồi (bấm đúp / retry / flush hàng đợi): trả lại ĐÚNG kết quả
        // lần đầu, KHÔNG chạy upsert state — nếu chạy, `attempts` sẽ phình theo số lần retry.
        const cu = await client.query<EvidenceRow>(
          `select correct, total, ratio, passed, content_version, client_at, server_at, answers
             from platform.completion_evidence
            where user_id = $1 and subject_id = $2 and content_id = $3 and attempt_id = $4`,
          [auth.userId, input.subjectId, input.contentId, input.attemptId],
        )
        return { duplicate: true as const, row: cu.rows[0] }
      }

      // "Không kéo lùi" cưỡng chế ở TẦNG DB: completed không về in_progress, best_ratio chỉ tăng,
      // completed_at giữ lần đạt ĐẦU TIÊN.
      await client.query(
        `insert into platform.completion_state
           (user_id, subject_id, content_id, status, best_ratio, last_ratio, attempts, completed_at, updated_at)
         values ($1,$2,$3,$4,$5,$5,1, case when $4 = 'completed' then now() end, now())
         on conflict (user_id, subject_id, content_id) do update set
           status       = case when platform.completion_state.status = 'completed'
                               then 'completed' else excluded.status end,
           best_ratio   = greatest(platform.completion_state.best_ratio, excluded.best_ratio),
           last_ratio   = excluded.last_ratio,
           attempts     = platform.completion_state.attempts + 1,
           completed_at = coalesce(platform.completion_state.completed_at, excluded.completed_at),
           updated_at   = now()`,
        [
          auth.userId,
          input.subjectId,
          input.contentId,
          passed ? 'completed' : 'in_progress',
          ratio,
        ],
      )
      return { duplicate: false as const, row: undefined }
    })

    const cu = ketQua.duplicate ? ketQua.row : undefined
    const evidence: CompletionEvidence = {
      schemaVersion: 1,
      subjectId: input.subjectId,
      contentId: input.contentId,
      ...(input.courseId === undefined ? {} : { courseId: input.courseId }),
      activityKind: input.activityKind,
      attemptId: input.attemptId,
      clientAt: input.clientAt,
      ownerId: auth.userId,
      evidenceKind: 'server_graded',
      correct: cu ? cu.correct : graded.correct,
      total: cu ? cu.total : total,
      ratio: cu ? Number(cu.ratio) : ratio,
      passed: cu ? cu.passed : passed,
      contentVersion: cu ? (cu.content_version ?? undefined) : contentVersion,
      serverAt: cu ? cu.server_at.toISOString() : new Date().toISOString(),
      ...(ketQua.duplicate ? { duplicate: true } : {}),
      items: cu
        ? cu.answers.map((a) => ({
            questionIndex: a.questionIndex,
            correct: a.correct,
            reason: a.reason,
          }))
        : graded.items,
    }
    // Chỉ sau COMMIT bằng chứng thật. Retry cũng xét lại để khôi phục thưởng lỗi trước đó.
    if (evidence.passed) await rewardReferralIfEligible(auth.userId)
    return jsonResponse(evidence, 200, headers)
  } catch (err: unknown) {
    return internalErrorResponse(err, headers, 'learning-evidence')
  }
}

// api/subjects/programming/progress.ts — Tiến độ bài học môn LẬP TRÌNH (PR-L3).
//
// GET  /api/programming/progress → { state: {currentLevel, projectTrack}, lessons: [{lessonId, status, completedAt}] }
// POST /api/programming/progress  body { lessonId, status } → upsert 1 dòng tiến độ; hoàn
//      thành thì giữ nguyên completed (không hạ cấp về in_progress khi học lại).
// POST /api/programming/progress  body { projectTrack: 'T1'|'T2'|'T3' } → ghi dự án trục đang
//      chọn vào learner_state (2026-10-09, docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md).
//      Dự án chưa có bước nào → 400. Đặt chung endpoint với GET vì GET đã trả `projectTrack`
//      từ cùng dòng learner_state — một nơi đọc, một nơi ghi.
//
// Bảng: programming.learner_state + programming.lesson_progress (migration 0064).
// lessonId là khoá từ dữ liệu giáo trình (packages/subject-programming/lessons.ts) — server
// kiểm tồn tại thật qua getLesson() để không ghi rác.
import { z } from 'zod'
import type { Pool } from 'pg'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp, internalErrorResponse } from '@dhcb/core-http/http'
import { getLesson } from '@dhcb/subject-programming/lessons'
import { getProjectStep } from '@dhcb/subject-programming/projectSteps'
import {
  PROJECT_TRACK_IDS,
  isProjectTrackAvailable,
  type ProjectTrackId,
} from '@dhcb/subject-programming/projectTracks'
import { getSpecStage } from '@dhcb/subject-programming/specializations/registry'
import { getSpecStageDetail } from '@dhcb/subject-programming/specializations/stageDetails'
import { checkLevelWriteAllowed } from '@dhcb/subject-programming/levelLockServer'
import {
  isServerRegradableLesson,
  assertServerRegradeAvailable,
  GradingUnavailableError,
  MAX_SUBMISSION_CODE_LENGTH,
  regradeSubmission,
  type RegradeResult,
} from '@dhcb/subject-programming/completionSandboxServer'
import { resolvePlan, type Plan } from '@dhcb/core-billing/plan'
import { withTransaction } from '@dhcb/core-db/transaction'
import { findReceipt, saveReceipt } from '../../_lib/syncReceipt.js'

const UpdateSchema = z
  .object({
    // Bốn loại khoá dùng CHUNG một bảng tiến độ:
    //  · bài học xương sống          'p1-u4-l1'
    //  · bước dự án trục             'p1-s1' (T1) · 't2-p1-s1' (T2) · 't3-p1-s1' (T3)
    //  · module/tiêu chí hướng chuyên sâu 'web-s2-m1' / 'web-s2-r3' (chi tiết chặng S2)
    //  · bài thuộc khoá NGẮN (cắt ngang bậc: khoá Git, khoá Hermes)  'git-u2-l1' / 'hermes-u1-l1'
    lessonId: z
      .string()
      .regex(
        /^(p[1-6]-(u\d+-l\d+|s\d+)|t[23]-p[1-6]-s\d+|[a-z]+-s[1-4]-[mr]\d+|(git|hermes|vibe|openclaw|ml|pyai|mathai|mlds|cv1|cv2|llmagent)-u\d+-l\d+)$/,
      ),
    status: z.enum(['in_progress', 'completed']),
    /** ADR-0007 + ADR-0008: code Make — BẮT BUỘC khi báo 'completed' một bài thuộc phạm vi
     *  chấm-lại-ở-server (isServerRegradableLesson), bỏ qua với bài khác. */
    code: z.string().max(MAX_SUBMISSION_CODE_LENGTH).optional(),
  })
  .strict()

/**
 * S09-1: dạng BATCH — gửi nhiều bài trong MỘT request (hàng đợi offline flush một lượt thay vì
 * bắn 40 request và chạm hạn mức 60/phút). `attemptId` là khoá idempotency theo lần gửi.
 * Dạng cũ `{ lessonId, status }` vẫn hợp lệ (client chưa cập nhật không bị gãy).
 */
const MAX_BATCH_ITEMS = 50
// Đồng bộ tối đa 50 dòng vẫn giữ nguyên; việc chấm có ngân sách nhỏ riêng để một
// request không nhân tải 50 lần. Client cần chia batch hoàn thành thành các nhóm ≤ 5.
const MAX_REGRADES_PER_REQUEST = 5
const MAX_REGRADE_TEST_CASES_PER_REQUEST = 25
const BatchSchema = z
  .object({
    attemptId: z.string().min(8).max(64),
    items: z
      .array(
        z
          .object({
            lessonId: UpdateSchema.shape.lessonId,
            status: z.enum(['in_progress', 'completed']),
            clientUpdatedAt: z.string().datetime(),
            code: z.string().max(MAX_SUBMISSION_CODE_LENGTH).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_BATCH_ITEMS),
  })
  .strict()

/** Chọn dự án trục (2026-10-09) — dạng body thứ ba, không đi chung với tiến độ bài. */
const ProjectTrackBodySchema = z.object({ projectTrack: z.enum(PROJECT_TRACK_IDS) }).strict()

/** Một trong ba dạng body; Zod thử `.strict()` từng nhánh nên không nhầm lẫn được. */
const BodySchema = z.union([BatchSchema, UpdateSchema, ProjectTrackBodySchema])

/**
 * Khoá tiến độ của tầng HƯỚNG CHUYÊN SÂU có thật hay không.
 * 'web-s2-m1' → module phải có trong bản đồ chặng; 'web-s2-r3' → tiêu chí phải có trong
 * chi tiết chặng. Kiểm để không ghi khoá rác vào bảng tiến độ.
 */
function isSpecProgressKey(id: string): boolean {
  const stageId = id.split('-').slice(0, 2).join('-')
  const stage = getSpecStage(stageId)
  if (!stage) return false
  if (stage.modules.some((m) => m.id === id)) return true
  return getSpecStageDetail(stageId)?.rubric.some((r) => r.id === id) ?? false
}

interface LessonRow {
  lesson_id: string
  status: 'in_progress' | 'completed'
  completed_at: Date | null
  /** S09-1: version theo DÒNG, tăng 1 mỗi lần upsert (migration 0083). */
  version?: number
}

interface StateRow {
  current_level: string
  project_track: string
}

/**
 * Gói ĐANG có hiệu lực — dùng để siết khoá bậc P1→P6 ở server (khuôn giống
 * `apps/server/src/api/core/progress.ts` môn Anh, GĐ2a).
 *
 * FAIL-SAFE ĐÚNG CHIỀU: đọc lỗi → coi như Free (khoá chặt), không phát nhầm quyền VIP.
 */
async function readEffectivePlan(pool: Pool, userId: string): Promise<Plan> {
  try {
    const { rows } = await pool.query<{ plan: string | null; plan_expires_at: Date | null }>(
      'select plan, plan_expires_at from public.profiles where id = $1',
      [userId],
    )
    return resolvePlan(rows[0]?.plan, rows[0]?.plan_expires_at)
  } catch (err) {
    console.warn('[programming-progress] đọc plan lỗi → coi như Free (khoá chặt):', err)
    return 'free'
  }
}

/**
 * Ghi dự án trục đang chọn. Upsert vì người mới có thể chọn dự án TRƯỚC khi ghi tiến độ bài nào
 * (chưa có dòng learner_state). Dự án chưa có bước nào thì chặn: chọn được là mở ra trang trắng.
 */
async function writeProjectTrack(
  pool: Pool,
  userId: string,
  track: ProjectTrackId,
  headers: Record<string, string>,
): Promise<Response> {
  if (!isProjectTrackAvailable(track)) {
    return jsonResponse(
      { error: `Dự án ${track} chưa mở — chưa có bước nào`, code: 'PROJECT_TRACK_NOT_AVAILABLE' },
      400,
      headers,
    )
  }
  const { rows } = await pool.query<StateRow>(
    `insert into programming.learner_state (user_id, project_track, updated_at)
     values ($1, $2, now())
     on conflict (user_id) do update
       set project_track = excluded.project_track, updated_at = now()
     returning current_level, project_track`,
    [userId, track],
  )
  return jsonResponse(
    {
      ok: true,
      state: {
        currentLevel: rows[0]?.current_level ?? 'p1',
        projectTrack: rows[0]?.project_track ?? track,
      },
    },
    200,
    headers,
  )
}

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'programming-progress'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/programming/progress' })
    // S09-1: `Retry-After` để hàng đợi client lùi đúng số giây (đếm lượt vẫn chạy TRƯỚC khi tra
    // biên nhận — replay không phải đường vòng miễn phí).
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, {
      ...headers,
      'Retry-After': '60',
    })
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)

  const pool = getPgPool()
  try {
    if (req.method === 'GET') {
      const [stateRes, lessonsRes] = await Promise.all([
        pool.query<StateRow>(
          'select current_level, project_track from programming.learner_state where user_id = $1',
          [auth.userId],
        ),
        pool.query<LessonRow>(
          'select lesson_id, status, completed_at, version from programming.lesson_progress where user_id = $1',
          [auth.userId],
        ),
      ])
      const state = stateRes.rows[0]
      return jsonResponse(
        {
          state: {
            currentLevel: state?.current_level ?? 'p1',
            projectTrack: state?.project_track ?? 'T1',
          },
          lessons: lessonsRes.rows.map((r) => ({
            lessonId: r.lesson_id,
            status: r.status,
            completedAt: r.completed_at ? r.completed_at.getTime() : null,
            version: r.version ?? 1,
          })),
        },
        200,
        headers,
      )
    }

    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, headers)

    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
    const validated = validateBody(BodySchema, parsed.raw)
    if (!validated.ok)
      return jsonResponse({ error: validated.error.message }, validated.error.status, headers)

    const body = validated.data
    // Chọn dự án trục: nhánh riêng, không chạm tiến độ bài / khoá bậc / chấm lại.
    if ('projectTrack' in body) {
      return await writeProjectTrack(pool, auth.userId, body.projectTrack, headers)
    }

    // Quy về MỘT dạng: batch có `attemptId` + nhiều mục; dạng cũ là batch 1 mục không có attemptId.
    const attemptId = 'attemptId' in body ? body.attemptId : null
    const items =
      'items' in body
        ? body.items
        : [
            {
              lessonId: body.lessonId,
              status: body.status,
              clientUpdatedAt: null,
              code: body.code,
            },
          ]

    // Một mục sai → CẢ BATCH 400 (client không được gửi mục lạ; đơn giản hơn partial success
    // và không để lọt khoá rác vào bảng tiến độ).
    for (const item of items) {
      const id = item.lessonId
      if (!getLesson(id) && !getProjectStep(id) && !isSpecProgressKey(id)) {
        return jsonResponse({ error: `Bài học "${id}" không tồn tại` }, 400, headers)
      }
    }

    // S09-1: tra biên nhận TRƯỚC transaction — lần gửi lại trả đúng response cũ, không upsert
    // (và không chấm lại lần nữa — xem khối CHẤM LẠI bên dưới, đặt SAU khối này có chủ đích).
    if (attemptId) {
      const receipt = await findReceipt(pool, auth.userId, attemptId)
      if (receipt) {
        if (receipt.endpoint !== 'programming-progress') {
          return jsonResponse({ error: 'attemptId đã dùng cho endpoint khác' }, 409, headers)
        }
        return jsonResponse({ ...receipt.response, replayed: true }, 200, headers)
      }
    }

    // SIẾT KHOÁ BẬC P1→P6 Ở SERVER (2026-09-19, dọn nợ kỹ thuật ghi ở PROGRESS.md — luật này
    // trước đây chỉ tính ở client `programmingLevelLock.ts`, sửa localStorage/gõ thẳng URL vẫn
    // ghi được tiến độ bậc chưa mở). CHỈ chặn GHI TIẾN ĐỘ của bài xương sống — nội dung bài học
    // (đọc) và các khoá khác (bước dự án/hướng chuyên sâu/khoá ngắn) không đi qua khoá bậc.
    {
      const plan = await readEffectivePlan(pool, auth.userId)
      const existing = await pool.query<{ lesson_id: string; status: string }>(
        'select lesson_id, status from programming.lesson_progress where user_id = $1',
        [auth.userId],
      )
      // Tiền kiểm TUẦN TỰ trước mọi lượt chấm. Chỉ dùng trạng thái dự kiến trong
      // bộ nhớ: toàn bộ batch phải qua chấm trước transaction, nên completed tự khai
      // không bao giờ mở khoá bậc nếu bất kỳ bài nào thiếu code/tạm dừng/chấm sai.
      const completedLessonIds = new Set(
        existing.rows.filter((r) => r.status === 'completed').map((r) => r.lesson_id),
      )
      const everEnteredLessonIds = new Set(existing.rows.map((r) => r.lesson_id))

      for (const item of items) {
        const result = checkLevelWriteAllowed({
          lessonId: item.lessonId,
          plan,
          completedLessonIds,
          everEnteredLessonIds,
        })
        if (!result.allowed) {
          const required = result.requiredLevelId?.toUpperCase() ?? 'bậc trước'
          return jsonResponse(
            {
              error: `Bậc ${item.lessonId.split('-')[0]?.toUpperCase()} chưa mở — cần hoàn thành đủ bài ở ${required} trước`,
            },
            403,
            headers,
          )
        }
        // Chỉ dự kiến kết quả; chưa ghi DB hoặc chạy code học viên.
        everEnteredLessonIds.add(item.lessonId)
        if (item.status === 'completed') completedLessonIds.add(item.lessonId)
      }
    }

    const regradeItems = items.filter(
      (item) => item.status === 'completed' && isServerRegradableLesson(item.lessonId),
    )
    const testCaseCount = regradeItems.reduce(
      (count, item) => count + (getLesson(item.lessonId)?.make.testCases.length ?? 0),
      0,
    )
    if (
      regradeItems.length > MAX_REGRADES_PER_REQUEST ||
      testCaseCount > MAX_REGRADE_TEST_CASES_PER_REQUEST
    ) {
      return jsonResponse(
        {
          error: 'Một lần gửi chỉ chấm tối đa 5 bài và 25 test-case — hãy chia nhỏ lần gửi',
          code: 'PROGRAMMING_GRADING_BATCH_LIMIT',
        },
        413,
        headers,
      )
    }

    // Kiểm TOÀN BỘ batch trước khi chạy bài đầu: engine tạm dừng hoặc thiếu code
    // ở mục sau không được khiến server đã tiêu tốn công chấm các mục trước.
    for (const item of regradeItems) {
      try {
        assertServerRegradeAvailable(item.lessonId)
      } catch (err) {
        if (!(err instanceof GradingUnavailableError)) throw err
        return jsonResponse({ error: err.message, code: err.code }, 503, headers)
      }
      if (!item.code || item.code.trim().length === 0) {
        return jsonResponse(
          { error: `Bài "${item.lessonId}" cần gửi kèm code để chấm lại ở server` },
          400,
          headers,
        )
      }
    }

    // Admission đếm MỌI lượt nộp (cả đúng/sai), TRƯỚC khi chấm. Bucket cũ chỉ
    // đếm sau khi chạy nên lượt thứ 6 vẫn tiêu CPU; không dùng cách đó nữa.
    // 5/bài/phút + 30/người/phút, chia sẻ Redis qua checkRateLimit. Giữ chỗ cả
    // batch trước khi chạy, không hoàn lượt khi batch sau đó thất bại (bảo thủ).
    for (const item of regradeItems) {
      const admittedUser = await checkRateLimit(auth.userId, 30, 'programming-regrade-user')
      const admittedLesson =
        admittedUser &&
        (await checkRateLimit(
          `${auth.userId}:${item.lessonId}`,
          5,
          'programming-regrade-admission',
        ))
      if (!admittedLesson) {
        return jsonResponse(
          { error: 'Đã hết lượt nộp bài trong 1 phút — nghỉ chút rồi thử lại' },
          429,
          { ...headers, 'Retry-After': '60' },
        )
      }
    }

    for (const item of regradeItems) {
      let regrade: RegradeResult
      try {
        regrade = await regradeSubmission(item.lessonId, item.code!)
      } catch (err) {
        // Dispatcher vẫn cưỡng chế chính sách dù có caller bỏ qua bước tiền kiểm.
        if (err instanceof GradingUnavailableError) {
          return jsonResponse({ error: err.message, code: err.code }, 503, headers)
        }
        console.error('[programming-progress] lỗi chấm lại ở server:', err)
        return jsonResponse({ error: 'Không chấm lại được bài — thử lại sau' }, 500, headers)
      }
      if (!regrade.passed) {
        return jsonResponse(
          { error: `Bài "${item.lessonId}" chưa đạt hết test-case khi chấm lại ở server` },
          400,
          headers,
        )
      }
    }

    // Cả batch trong MỘT transaction: hoặc mọi bài cùng vào, hoặc không bài nào (kèm biên nhận).
    const lessons = await withTransaction(pool, async (client) => {
      // Đảm bảo có learner_state (lần chạm đầu tiên vào môn).
      await client.query(
        `insert into programming.learner_state (user_id) values ($1)
       on conflict (user_id) do nothing`,
        [auth.userId],
      )
      const written: Array<{
        lessonId: string
        status: string
        completedAt: number | null
        version: number
      }> = []
      for (const item of items) {
        // completed là trạng thái CHỐT: học lại bài không kéo lùi về in_progress (câu `case when`
        // giữ NGUYÊN như trước S09 — chỉ thêm version/client_updated_at quanh nó).
        const { rows } = await client.query<LessonRow>(
          `insert into programming.lesson_progress
             (user_id, lesson_id, status, completed_at, updated_at, version, client_updated_at)
       values ($1, $2, $3, case when $3 = 'completed' then now() end, now(), 1, $4)
       on conflict (user_id, lesson_id) do update
         set status = case when programming.lesson_progress.status = 'completed'
                           then 'completed' else excluded.status end,
             completed_at = coalesce(programming.lesson_progress.completed_at, excluded.completed_at),
             updated_at = now(),
             version = programming.lesson_progress.version + 1,
             client_updated_at = excluded.client_updated_at
       returning lesson_id, status, completed_at, version`,
          [auth.userId, item.lessonId, item.status, item.clientUpdatedAt],
        )
        const row = rows[0]
        written.push({
          lessonId: row?.lesson_id ?? item.lessonId,
          status: row?.status ?? item.status,
          completedAt: row?.completed_at ? row.completed_at.getTime() : null,
          version: row?.version ?? 1,
        })
      }
      if (attemptId) {
        await saveReceipt(client, auth.userId, attemptId, 'programming-progress', {
          ok: true,
          lessons: written,
        })
      }
      return written
    })

    return jsonResponse({ ok: true, replayed: false, lessons }, 200, headers)
  } catch (err: unknown) {
    return internalErrorResponse(err, headers, 'programming-progress')
  }
}

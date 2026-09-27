// api/personal-facts.ts — Đọc/khai báo/sửa/xoá fact cá nhân (Personal World Model, V2-03 slice 1).
//
//   GET    /api/personal-facts?namespace=&includeHistory=1   → danh sách fact của CHÍNH mình
//   POST   /api/personal-facts                               → khai báo fact mới (supersede bản cũ)
//   PATCH  /api/personal-facts?id=<factId>                   → sửa fact (append bản mới)
//   DELETE /api/personal-facts?id=<factId>                   → xoá mềm (giữ lịch sử)
//
// NGUYÊN TẮC: `personId` LUÔN suy ra từ token (`getOrCreatePerson`), KHÔNG BAO GIỜ nhận từ client
// — không ai đọc/sửa được fact của người khác. Mọi thao tác sửa/xoá còn kèm `person_id` ngay
// trong câu SQL của service (xem `correctFact`/`deleteFact`).
//
// `origin` qua endpoint công khai này CHỈ cho phép 'user_declared' | 'observed'. 'derived' và
// 'imported' dành cho engine nội bộ gọi thẳng service — nếu mở ra đây, client có thể tự xưng
// "derived" (hoặc ngược lại, giả mạo "user_declared") và lách GATE V2-03.

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { getTwoFactorStatus, hasStepUp } from '@dhcb/core-auth/twoFactor'
import { readSessionCookie } from '@dhcb/core-auth/sessionCookie'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import {
  getOrCreatePerson,
  declareFact,
  listFacts,
  correctFact,
  deleteFact,
  exportPersonData,
} from '@dhcb/core-personal/personService'

const SourceSchema = z
  .object({
    type: z.string().min(1).max(100),
    id: z.string().min(1).max(200).optional(),
    occurredAt: z.iso.datetime().optional(),
  })
  .strict()

// Chỉ 2 origin được phép qua API công khai (xem ghi chú đầu file).
const PublicOriginSchema = z.enum(['user_declared', 'observed'])

const PostSchema = z
  .object({
    namespace: z.string().min(1).max(100),
    key: z.string().min(1).max(200),
    value: z.unknown(),
    origin: PublicOriginSchema.default('user_declared'),
    confidence: z.number().min(0).max(1).optional(),
    source: SourceSchema.optional(),
    sensitivity: z.enum(['public', 'personal', 'sensitive', 'restricted']),
    expiresAt: z.iso.datetime().optional(),
  })
  .strict()
  // `z.unknown()` không bắt buộc key phải có mặt — kiểm tay để "thiếu value" trả 400 rõ ràng.
  .refine((d) => d.value !== undefined, { error: 'Thiếu trường value' })

const PatchSchema = z
  .object({
    value: z.unknown(),
    confidence: z.number().min(0).max(1).optional(),
    source: SourceSchema.optional(),
    sensitivity: z.enum(['public', 'personal', 'sensitive', 'restricted']).optional(),
    expiresAt: z.iso.datetime().optional(),
  })
  .strict()

const UuidParam = z.uuid()

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'personal-facts'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/personal-facts' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  const pool = getPgPool()
  const userId = auth.userId

  // Hồ sơ ẩn cần bật 2FA và xác minh lại đúng phiên hiện tại; đọc/xoá dữ liệu thường vẫn mở.
  async function requirePrivateRead(): Promise<Response | null> {
    const status = await getTwoFactorStatus(pool, userId)
    if (!status.enabled) {
      return jsonResponse(
        {
          error: 'Bật xác thực hai bước để xem dữ liệu riêng tư.',
          code: 'TWO_FACTOR_SETUP_REQUIRED',
        },
        403,
        allHeaders,
      )
    }
    if (!(await hasStepUp(pool, userId, readSessionCookie(req)))) {
      return jsonResponse(
        {
          error: 'Xác minh lại bằng mã hai bước để xem dữ liệu riêng tư.',
          code: 'STEP_UP_REQUIRED',
        },
        403,
        allHeaders,
      )
    }
    return null
  }
  const url = new URL(req.url)

  try {
    const person = await getOrCreatePerson(pool, auth.userId)

    if (req.method === 'GET') {
      const namespace = url.searchParams.get('namespace') ?? undefined
      const includeHistory = url.searchParams.get('includeHistory') === '1'
      // includeHistory = "export" — chỉ chính chủ, và personId đã lấy từ token nên luôn đúng chủ.
      if (includeHistory && !namespace) {
        const denied = await requirePrivateRead()
        if (denied) return denied
        return jsonResponse(await exportPersonData(pool, person), 200, allHeaders)
      }
      const facts = await listFacts(pool, person.id, { namespace, includeHistory })
      if (
        facts.some(
          (fact) =>
            fact.origin === 'derived' ||
            fact.sensitivity === 'sensitive' ||
            fact.sensitivity === 'restricted',
        )
      ) {
        const denied = await requirePrivateRead()
        if (denied) return denied
      }
      return jsonResponse({ facts }, 200, allHeaders)
    }

    if (req.method === 'POST') {
      const parsedBody = await readJsonBody(req)
      if (!parsedBody.ok)
        return jsonResponse(
          { error: parsedBody.error.message },
          parsedBody.error.status,
          allHeaders,
        )
      const result = validateBody(PostSchema, parsedBody.raw)
      if (!result.ok)
        return jsonResponse({ error: result.error.message }, result.error.status, allHeaders)
      const d = result.data

      const fact = await declareFact(pool, {
        personId: person.id,
        namespace: d.namespace,
        key: d.key,
        value: d.value,
        origin: d.origin,
        // Lời tự khai mặc định tin tuyệt đối; quan sát gián tiếp mặc định 0.8 (chưa xác nhận lại).
        confidence: d.confidence ?? (d.origin === 'user_declared' ? 1 : 0.8),
        source: d.source ?? { type: d.origin === 'user_declared' ? 'user_input' : 'observation' },
        sensitivity: d.sensitivity,
        ...(d.expiresAt ? { expiresAt: d.expiresAt } : {}),
      })
      return jsonResponse(fact, 201, allHeaders)
    }

    if (req.method === 'PATCH' || req.method === 'DELETE') {
      const idParam = UuidParam.safeParse(url.searchParams.get('id') ?? '')
      if (!idParam.success)
        return jsonResponse({ error: 'Thiếu hoặc sai tham số id' }, 400, allHeaders)

      if (req.method === 'DELETE') {
        await deleteFact(pool, person.id, idParam.data)
        return jsonResponse({ ok: true }, 200, allHeaders)
      }

      const parsedBody = await readJsonBody(req)
      if (!parsedBody.ok)
        return jsonResponse(
          { error: parsedBody.error.message },
          parsedBody.error.status,
          allHeaders,
        )
      const result = validateBody(PatchSchema, parsedBody.raw)
      if (!result.ok)
        return jsonResponse({ error: result.error.message }, result.error.status, allHeaders)
      const p = result.data

      // PATCH có thể chỉ đổi sensitivity/confidence và trả lại nguyên value cũ.
      // Kiểm bản ghi thuộc chính chủ trước khi cho phép hạ nhãn hoặc đọc vòng qua response.
      const current = (await listFacts(pool, person.id, { includeHistory: true })).find(
        (fact) => fact.id === idParam.data,
      )
      if (
        current &&
        (current.origin === 'derived' ||
          current.sensitivity === 'sensitive' ||
          current.sensitivity === 'restricted')
      ) {
        const denied = await requirePrivateRead()
        if (denied) return denied
      }

      const fact = await correctFact(pool, person.id, idParam.data, {
        // `undefined` = client không muốn đổi value (muốn xoá giá trị thì gửi `null`).
        ...(p.value !== undefined ? { value: p.value } : {}),
        ...(p.confidence !== undefined ? { confidence: p.confidence } : {}),
        ...(p.source ? { source: p.source } : {}),
        ...(p.sensitivity ? { sensitivity: p.sensitivity } : {}),
        ...(p.expiresAt ? { expiresAt: p.expiresAt } : {}),
      })
      return jsonResponse(fact, 200, allHeaders)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  } catch (err) {
    // Lỗi nghiệp vụ đã biết trước (409 xung đột đồng thời, 409 GATE derived, 404 không thấy) trả
    // đúng status + code cho client; lỗi khác để tầng trên xử lý như lỗi 500 thật.
    if (isAppError(err)) return jsonResponse(toErrorBody(err), err.status, allHeaders)
    throw err
  }
}

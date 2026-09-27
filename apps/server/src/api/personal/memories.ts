// api/memories.ts — V2-06 Personal Knowledge Fabric API.
// personId luôn suy từ token xác thực, không nhận từ client.
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
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import {
  evaluateMemoryCandidate,
  getMemoryRecord,
  ingestMemory,
  listMemoryRecords,
  expireMemoryRecord,
  deleteMemoryRecord,
} from '@dhcb/core-personal/memoryService'
import { MemoryNamespaceSchema } from '@dhcb/core-contracts/personalMemory'
import { SensitivitySchema } from '@dhcb/core-contracts/personalFact'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const MemoryCandidateSchema = z
  .object({
    namespace: MemoryNamespaceSchema,
    content: z.string().min(1).max(2000),
    provenance: z.string().min(1).max(200),
    sensitivity: SensitivitySchema,
    confidence: z.number().min(0).max(1).optional(),
    retainUntil: z.string().datetime().optional(),
  })
  .strict()

const PostSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('evaluate'), candidate: MemoryCandidateSchema }).strict(),
  z.object({ action: z.literal('ingest'), candidate: MemoryCandidateSchema }).strict(),
])

const PatchSchema = z
  .object({
    id: z.string().uuid(),
    action: z.literal('expire'),
    expectedVersion: z.number().int().positive(),
  })
  .strict()

const DeleteSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict()

async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const parsed = await readJsonBody(req)
  if (!parsed.ok)
    return { ok: false as const, status: parsed.error.status, message: parsed.error.message }
  const result = validateBody(schema, parsed.raw)
  if (!result.ok)
    return { ok: false as const, status: result.error.status, message: result.error.message }
  return { ok: true as const, data: result.data }
}

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'memories'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/memories' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

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
        headers,
      )
    }
    if (!(await hasStepUp(pool, userId, readSessionCookie(req)))) {
      return jsonResponse(
        {
          error: 'Xác minh lại bằng mã hai bước để xem dữ liệu riêng tư.',
          code: 'STEP_UP_REQUIRED',
        },
        403,
        headers,
      )
    }
    return null
  }
  const person = await getOrCreatePerson(pool, auth.userId)

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const namespaceRaw = url.searchParams.get('namespace')
      let namespace = undefined
      if (namespaceRaw) {
        const parsed = MemoryNamespaceSchema.safeParse(namespaceRaw)
        if (!parsed.success) {
          return jsonResponse({ error: 'Invalid namespace parameter' }, 400, headers)
        }
        namespace = parsed.data
      }

      const includeExpired = url.searchParams.get('includeExpired') === 'true'
      const records = await listMemoryRecords(pool, person.id, { namespace, includeExpired })
      if (
        records.some(
          (record) => record.sensitivity === 'sensitive' || record.sensitivity === 'restricted',
        )
      ) {
        const denied = await requirePrivateRead()
        if (denied) return denied
      }
      return jsonResponse({ records }, 200, headers)
    }

    if (req.method === 'POST') {
      const body = await parseBody(req, PostSchema)
      if (!body.ok) return jsonResponse({ error: body.message }, body.status, headers)

      if (body.data.action === 'evaluate') {
        const evaluation = await evaluateMemoryCandidate(pool, person.id, body.data.candidate)
        if (evaluation.existingRecordId) {
          const existing = await getMemoryRecord(pool, person.id, evaluation.existingRecordId)
          if (
            existing &&
            (existing.sensitivity === 'sensitive' || existing.sensitivity === 'restricted')
          ) {
            const denied = await requirePrivateRead()
            if (denied) return denied
          }
        }
        return jsonResponse({ evaluation }, 200, headers)
      }

      const result = await ingestMemory(pool, person.id, body.data.candidate, `user:${auth.userId}`)
      if (result.record.sensitivity === 'sensitive' || result.record.sensitivity === 'restricted') {
        const denied = await requirePrivateRead()
        if (denied) return denied
      }
      return jsonResponse(result, 201, headers)
    }

    if (req.method === 'PATCH') {
      const body = await parseBody(req, PatchSchema)
      if (!body.ok) return jsonResponse({ error: body.message }, body.status, headers)

      const record = await expireMemoryRecord(
        pool,
        person.id,
        body.data.id,
        body.data.expectedVersion,
        `user:${auth.userId}`,
      )
      // Expire là thao tác xóa của chính chủ: không ép 2FA, cũng không đọc ngược nội dung T2.
      const visibleRecord =
        record.sensitivity === 'sensitive' || record.sensitivity === 'restricted'
          ? { id: record.id, status: record.status }
          : record
      return jsonResponse({ record: visibleRecord }, 200, headers)
    }

    if (req.method === 'DELETE') {
      const body = await parseBody(req, DeleteSchema)
      if (!body.ok) return jsonResponse({ error: body.message }, body.status, headers)

      await deleteMemoryRecord(pool, person.id, body.data.id, `user:${auth.userId}`)
      return jsonResponse({ ok: true }, 200, headers)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    throw err
  }
}

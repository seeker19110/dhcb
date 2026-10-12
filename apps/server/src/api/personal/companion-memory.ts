// api/personal/companion-memory.ts — Cài đặt ký ức của Bạn Đồng Hành (GĐ2a, đặc tả
// `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md`).
//
// Hai công tắc trên trang "Bạn Đồng Hành nhớ gì về tôi" = hai consent chuẩn
// (`COMPANION_CONSENT_SCOPES`, purpose `COMPANION_CONSENT_PURPOSE`). GET đọc trạng thái consent
// thật; POST bật → `grantConsent`, tắt → `revokeConsent` bản đang active. personId luôn suy từ
// token, không nhận từ client.
import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import type { Pool } from 'pg'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { grantConsent, listConsents, revokeConsent } from '@dhcb/core-personal/consentService'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
  type CompanionMemorySettings,
} from '@dhcb/core-contracts/consentGrant'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const PostSchema = z
  .object({
    action: z.literal('set_settings'),
    rememberMemories: z.boolean().optional(),
    useHistory: z.boolean().optional(),
  })
  .strict()

/** Consent đang active của một scope (đúng purpose Companion), nếu có. */
async function findActiveConsent(pool: Pool, personId: string, scope: string) {
  const grants = await listConsents(pool, personId, { scope })
  return grants.find((g) => g.purpose === COMPANION_CONSENT_PURPOSE && g.status === 'active')
}

async function readSettings(pool: Pool, personId: string): Promise<CompanionMemorySettings> {
  const [memory, history] = await Promise.all([
    findActiveConsent(pool, personId, COMPANION_CONSENT_SCOPES.memory),
    findActiveConsent(pool, personId, COMPANION_CONSENT_SCOPES.history),
  ])
  return { rememberMemories: Boolean(memory), useHistory: Boolean(history) }
}

/** Đưa một công tắc về trạng thái mong muốn — lũy đẳng: đã đúng trạng thái thì không ghi gì. */
async function applySwitch(pool: Pool, personId: string, scope: string, enabled: boolean) {
  const current = await findActiveConsent(pool, personId, scope)
  if (enabled && !current) {
    await grantConsent(pool, { personId, scope, purpose: COMPANION_CONSENT_PURPOSE })
  } else if (!enabled && current) {
    await revokeConsent(pool, personId, current.id)
  }
}

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'companion-memory'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/companion-memory' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  const pool = getPgPool()
  const person = await getOrCreatePerson(pool, auth.userId)

  try {
    if (req.method === 'GET') {
      return jsonResponse({ settings: await readSettings(pool, person.id) }, 200, headers)
    }

    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
    const body = validateBody(PostSchema, parsed.raw)
    if (!body.ok) return jsonResponse({ error: body.error.message }, body.error.status, headers)

    if (body.data.rememberMemories !== undefined) {
      await applySwitch(
        pool,
        person.id,
        COMPANION_CONSENT_SCOPES.memory,
        body.data.rememberMemories,
      )
    }
    if (body.data.useHistory !== undefined) {
      await applySwitch(pool, person.id, COMPANION_CONSENT_SCOPES.history, body.data.useHistory)
    }
    return jsonResponse({ settings: await readSettings(pool, person.id) }, 200, headers)
  } catch (err) {
    if (isAppError(err)) return jsonResponse(toErrorBody(err), err.status, headers)
    throw err
  }
}

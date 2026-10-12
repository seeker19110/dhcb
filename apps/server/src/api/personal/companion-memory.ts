// api/personal/companion-memory.ts — Cài đặt ký ức của Bạn Đồng Hành (GĐ2a, đặc tả
// `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md`; mở rộng GĐ2b
// `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md`).
//
// Ba công tắc trên trang "Bạn Đồng Hành nhớ gì về tôi" = ba consent chuẩn
// (`COMPANION_CONSENT_SCOPES`, purpose `COMPANION_CONSENT_PURPOSE`). GET đọc trạng thái consent
// thật + hai khối ghi nhớ cố định + các bản tóm tắt cuộn; POST bật → `grantConsent`, tắt →
// `revokeConsent` bản đang active; `set_core_block` ghi khối (khoá phiên bản); `clear_summary` xoá
// nội dung một bản tóm tắt. personId luôn suy từ token, không nhận từ client.
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
import {
  CORE_MEMORY_BLOCK_MAX_CHARS,
  CoreMemoryBlockLabelSchema,
  type CoreMemoryBlock,
  type ConversationSummary,
} from '@dhcb/core-contracts/personalMemory'
import {
  listCoreBlocks,
  setCoreBlock,
  listConversationSummaries,
  clearConversationSummary,
  type StoredCoreBlock,
} from '@dhcb/core-personal/coreMemoryBlocks'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const PostSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('set_settings'),
      rememberMemories: z.boolean().optional(),
      useHistory: z.boolean().optional(),
      suggestMemories: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal('set_core_block'),
      label: CoreMemoryBlockLabelSchema,
      // Rỗng = xoá khối. Trần kiểm ở đây (trước trim) rộng thêm chút cho khoảng trắng đầu/cuối;
      // setCoreBlock kiểm lại đúng 1.500 sau trim.
      content: z.string().max(CORE_MEMORY_BLOCK_MAX_CHARS + 200),
      expectedVersion: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      action: z.literal('clear_summary'),
      domain: z.string().min(1).max(100),
    })
    .strict(),
])

/** Bỏ `id` nội bộ trước khi trả ra client — client định danh khối bằng `label`. */
function publicBlock(block: StoredCoreBlock): CoreMemoryBlock {
  const { label, content, version, updatedAt } = block
  return updatedAt ? { label, content, version, updatedAt } : { label, content, version }
}

/** Chỉ bản tóm tắt CÒN nội dung, không lộ con trỏ nội bộ. */
async function readSummaries(pool: Pool, personId: string): Promise<ConversationSummary[]> {
  return (await listConversationSummaries(pool, personId))
    .filter((s) => s.summary.trim())
    .map(({ domain, summary, updatedAt }) => ({ domain, summary, updatedAt }))
}

/** Consent đang active của một scope (đúng purpose Companion), nếu có. */
async function findActiveConsent(pool: Pool, personId: string, scope: string) {
  const grants = await listConsents(pool, personId, { scope })
  return grants.find((g) => g.purpose === COMPANION_CONSENT_PURPOSE && g.status === 'active')
}

async function readSettings(pool: Pool, personId: string): Promise<CompanionMemorySettings> {
  const [memory, history, suggest] = await Promise.all([
    findActiveConsent(pool, personId, COMPANION_CONSENT_SCOPES.memory),
    findActiveConsent(pool, personId, COMPANION_CONSENT_SCOPES.history),
    findActiveConsent(pool, personId, COMPANION_CONSENT_SCOPES.suggest),
  ])
  return {
    rememberMemories: Boolean(memory),
    useHistory: Boolean(history),
    suggestMemories: Boolean(suggest),
  }
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
      const [settings, blocks, summaries] = await Promise.all([
        readSettings(pool, person.id),
        listCoreBlocks(pool, person.id),
        readSummaries(pool, person.id),
      ])
      return jsonResponse(
        { settings, coreBlocks: blocks.map(publicBlock), summaries },
        200,
        headers,
      )
    }

    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
    const body = validateBody(PostSchema, parsed.raw)
    if (!body.ok) return jsonResponse({ error: body.error.message }, body.error.status, headers)

    const data = body.data
    if (data.action === 'set_core_block') {
      const block = await setCoreBlock(
        pool,
        person.id,
        data.label,
        data.content,
        data.expectedVersion,
      )
      return jsonResponse({ block: publicBlock(block) }, 200, headers)
    }
    if (data.action === 'clear_summary') {
      await clearConversationSummary(pool, person.id, data.domain)
      return jsonResponse({ summaries: await readSummaries(pool, person.id) }, 200, headers)
    }

    if (data.rememberMemories !== undefined) {
      await applySwitch(pool, person.id, COMPANION_CONSENT_SCOPES.memory, data.rememberMemories)
    }
    if (data.useHistory !== undefined) {
      await applySwitch(pool, person.id, COMPANION_CONSENT_SCOPES.history, data.useHistory)
    }
    if (data.suggestMemories !== undefined) {
      await applySwitch(pool, person.id, COMPANION_CONSENT_SCOPES.suggest, data.suggestMemories)
    }
    return jsonResponse({ settings: await readSettings(pool, person.id) }, 200, headers)
  } catch (err) {
    if (isAppError(err)) return jsonResponse(toErrorBody(err), err.status, headers)
    throw err
  }
}

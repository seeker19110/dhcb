// api/admin-tts-cache.ts — Tab admin "Cache TTS & R2": cache có đang tiết kiệm tiền API không,
// và kho audio trên Cloudflare R2 có khớp với DB không.
//
// GET  /api/admin-tts-cache?days=30
//   → { stats: {...}, quick: {...}, audit: {...} }
//     · stats  — hit/miss theo ngày từ bảng tts_cache_stats (migration 0039)
//     · quick  — đếm nhanh THUẦN SQL: bao nhiêu dòng trỏ R2, bao nhiêu trỏ sai chỗ (tức thì)
//     · audit  — kết quả lần QUÉT NỀN gần nhất, có đối chiếu file thật trên R2
//
// POST /api/admin-tts-cache  body { action: 'scan' }
//   → khởi động quét nền, trả ngay { ok, auditId }. Trang tự hỏi lại GET để xem tiến độ.
//
// Vì sao tách "quick" và "audit": đếm theo tiền tố URL trong SQL là tức thì nhưng KHÔNG biết
// file có còn trên bucket thật hay không; đối chiếu thật phải liệt kê hàng chục nghìn object
// nên bắt buộc chạy nền.

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  validateAuth,
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { getR2PublicBaseUrl } from '@dhcb/core-ai/fileStorage'
import { runTtsCacheAudit } from '@dhcb/core-ai/ttsCacheAudit'
import { vnDateStr, addDays } from '@dhcb/core-db/date'

const DEFAULT_DAYS = 30
const MAX_DAYS = 180

const ActionSchema = z.object({ action: z.literal('scan') })

interface DayRow {
  day: string
  hits: number
  misses: number
}

/**
 * Khởi động quét nền. KHÔNG await ở đường request — quét mất hàng chục giây tới vài phút.
 *
 * Chống chạy chồng: chỉ nhận nếu không còn lượt quét nào đang 'running'. Lượt quét treo quá
 * lâu (tiến trình bị kill giữa chừng) coi như hỏng, cho phép chạy lại — nếu không, một lần
 * pm2 reload đúng lúc sẽ khoá cứng tính năng này vĩnh viễn.
 */
const STALE_SCAN_MINUTES = 30

export async function startAudit(
  pool: ReturnType<typeof getPgPool>,
): Promise<{ ok: true; auditId: string } | { ok: false; error: string }> {
  const { rows: running } = await pool.query<{ id: string }>(
    `select id from public.tts_cache_audit
      where status = 'running' and started_at > now() - interval '${STALE_SCAN_MINUTES} minutes'
      limit 1`,
  )
  if (running[0]) return { ok: false, error: 'Đang có một lượt quét chạy dở — chờ nó xong đã' }

  const { rows } = await pool.query<{ id: string }>(
    `insert into public.tts_cache_audit (status) values ('running') returning id`,
  )
  const auditId = rows[0]?.id
  if (!auditId) return { ok: false, error: 'Không tạo được bản ghi quét' }

  // Bắn rồi quên — mọi lỗi đều phải được ghi vào bảng, không được để promise reject trôi nổi.
  void (async () => {
    try {
      const result = await runTtsCacheAudit(pool)
      await pool.query(
        `update public.tts_cache_audit
            set status = 'done', finished_at = now(), result = $2, error = null
          where id = $1`,
        [auditId, JSON.stringify(result)],
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[admin-tts-cache] quét nền lỗi:', message)
      await pool
        .query(
          `update public.tts_cache_audit
              set status = 'error', finished_at = now(), error = $2
            where id = $1`,
          [auditId, message],
        )
        .catch((e: unknown) => console.error('[admin-tts-cache] ghi lỗi quét thất bại:', e))
    }
  })()

  return { ok: true, auditId }
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-tts-cache'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-tts-cache' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-tts-cache' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const daysParam = Number(new URL(req.url).searchParams.get('days'))
    const days =
      Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, MAX_DAYS) : DEFAULT_DAYS
    const fromDay = addDays(vnDateStr(), -days + 1)

    // ── 1. Hit/miss theo ngày ────────────────────────────────────────────────────────────
    const { rows: dayRows } = await pool.query<DayRow>(
      `select day::text as day, sum(hits)::int as hits, sum(misses)::int as misses
         from public.tts_cache_stats
        where day >= $1
        group by day
        order by day`,
      [fromDay],
    )
    const totalHits = dayRows.reduce((s, r) => s + r.hits, 0)
    const totalMisses = dayRows.reduce((s, r) => s + r.misses, 0)
    const totalCalls = totalHits + totalMisses

    // Theo giọng — để biết giọng nào đang ngốn tiền sinh mới nhiều nhất.
    const { rows: voiceRows } = await pool.query<{
      lang: string
      voice: string
      hits: number
      misses: number
    }>(
      `select lang, voice, sum(hits)::int as hits, sum(misses)::int as misses
         from public.tts_cache_stats
        where day >= $1
        group by lang, voice
        order by sum(misses) desc, sum(hits) desc
        limit 20`,
      [fromDay],
    )

    // ── 2. Đếm nhanh thuần SQL (tức thì, không gọi R2) ───────────────────────────────────
    const baseUrl = getR2PublicBaseUrl()
    // `like $1 || '%'` dùng tham số hoá — không nối chuỗi vào SQL.
    const likePrefix = baseUrl ? baseUrl + '/' : null
    const quickSql = `select count(*)::int as total,
             count(*) filter (where audio_url like $1 || '%')::int as on_r2
        from `
    const quick = likePrefix
      ? {
          ttsCache: (
            await pool.query<{ total: number; on_r2: number }>(quickSql + 'public.tts_cache', [
              likePrefix,
            ])
          ).rows[0],
          pronunciations: (
            await pool.query<{ total: number; on_r2: number }>(
              quickSql + 'english.pronunciations',
              [likePrefix],
            )
          ).rows[0],
        }
      : null

    // ── 3. Lần quét nền gần nhất ─────────────────────────────────────────────────────────
    const { rows: auditRows } = await pool.query<{
      id: string
      started_at: string
      finished_at: string | null
      status: string
      error: string | null
      result: unknown
    }>(
      `select id, started_at, finished_at, status, error, result
         from public.tts_cache_audit
        order by started_at desc
        limit 1`,
    )

    return jsonResponse(
      {
        days,
        stats: {
          byDay: dayRows,
          byVoice: voiceRows,
          totalHits,
          totalMisses,
          totalCalls,
          // null khi chưa có lượt gọi nào — KHÔNG trả 0, để UI phân biệt "chưa có dữ liệu"
          // với "hit rate thật sự bằng 0".
          hitRate: totalCalls > 0 ? totalHits / totalCalls : null,
        },
        quick,
        r2PublicBaseUrl: baseUrl ?? null,
        audit: auditRows[0] ?? null,
      },
      200,
      allHeaders,
    )
  }

  if (req.method === 'POST') {
    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const val = validateBody(ActionSchema, parsed.raw)
    if (!val.ok) return jsonResponse({ error: val.error.message }, val.error.status, allHeaders)

    const started = await startAudit(pool)
    if (!started.ok) return jsonResponse({ error: started.error }, 409, allHeaders)

    logSecurityEvent('TTS_CACHE_SCAN_STARTED', clientIp, {
      adminUserId: auth.userId,
      auditId: started.auditId,
    })
    return jsonResponse(
      { ok: true, auditId: started.auditId, message: 'Đã bắt đầu quét nền — tự làm mới để xem.' },
      202,
      allHeaders,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

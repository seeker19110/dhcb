// api/subjects/programming/project.ts — WORKSPACE DỰ ÁN TRỤC môn Lập trình (PR-L3b).
//
// GET  /api/programming/project → { files: [{path, content, updatedAt}], snapshots: [{id, milestone, createdAt}] }
// POST /api/programming/project
//   body { action: 'save', path, content }        → upsert 1 file (kiểm quota)
//   body { action: 'snapshot', milestone }        → chốt cây file CỦA DỰ ÁN ứng với mốc (jsonb)
//
// Ba dự án trục T1/T2/T3 dùng chung bảng project_files nhưng TÁCH không gian tên bằng tiền tố
// đường dẫn (T1 giữ tên gốc, T2 `t2--…`, T3 `t3--…` — projectTrackIds.ts). Mốc snapshot mang
// tiền tố tương ứng (`p1` · `t2-p1` · `t3-p1`) và chỉ chốt file của đúng dự án đó.
//
// Bảng: programming.project_files + programming.project_snapshots (migration 0064).
// Quota (đặc tả xuyên suốt §4.1): tổng ~2MB text + tối đa 50 file mỗi học viên — kiểm ở
// đây; DB còn chặn cứng 256KB/file (octet_length) làm lưới sau cùng.
import { z } from 'zod'
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
import {
  PROJECT_SNAPSHOT_MILESTONE_RE,
  trackOfSnapshotMilestone,
  trackOfWorkspaceStoragePath,
} from '@dhcb/subject-programming/projectTrackIds'

const MAX_FILES = 50
const MAX_TOTAL_BYTES = 2 * 1024 * 1024 // ~2MB text toàn workspace
const MAX_FILE_CHARS = 100_000

// Tên file an toàn: chữ thường/số/._-, không đường dẫn lồng, không bắt đầu bằng dấu chấm.
const PathSchema = z.string().regex(/^[a-z0-9_][a-z0-9_.-]{0,99}$/, 'Tên file không hợp lệ')

const BodySchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('save'),
      path: PathSchema,
      content: z.string().max(MAX_FILE_CHARS),
    })
    .strict(),
  z
    .object({
      action: z.literal('snapshot'),
      milestone: z.string().regex(PROJECT_SNAPSHOT_MILESTONE_RE),
    })
    .strict(),
])

interface FileRow {
  path: string
  content: string
  updated_at: Date
}

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 120, 'programming-project'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/programming/project' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)

  const pool = getPgPool()
  try {
    if (req.method === 'GET') {
      const [filesRes, snapsRes] = await Promise.all([
        pool.query<FileRow>(
          'select path, content, updated_at from programming.project_files where user_id = $1 order by path',
          [auth.userId],
        ),
        pool.query<{ id: string; milestone: string; created_at: Date }>(
          'select id, milestone, created_at from programming.project_snapshots where user_id = $1 order by created_at desc limit 20',
          [auth.userId],
        ),
      ])
      return jsonResponse(
        {
          files: filesRes.rows.map((r) => ({
            path: r.path,
            content: r.content,
            updatedAt: r.updated_at.getTime(),
          })),
          snapshots: snapsRes.rows.map((r) => ({
            id: r.id,
            milestone: r.milestone,
            createdAt: r.created_at.getTime(),
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

    if (body.action === 'save') {
      // Kiểm quota TRƯỚC khi ghi: tổng byte các file KHÁC + file mới ≤ trần; số file ≤ trần.
      const { rows } = await pool.query<{ n: string; total: string }>(
        `select count(*)::text as n,
                coalesce(sum(octet_length(content)) filter (where path <> $2), 0)::text as total
           from programming.project_files where user_id = $1`,
        [auth.userId, body.path],
      )
      const fileCount = Number(rows[0]?.n ?? 0)
      const otherBytes = Number(rows[0]?.total ?? 0)
      const newBytes = new TextEncoder().encode(body.content).length
      if (otherBytes + newBytes > MAX_TOTAL_BYTES) {
        return jsonResponse(
          { error: 'Workspace đã đầy (~2MB) — xoá bớt nội dung không dùng rồi lưu lại' },
          413,
          headers,
        )
      }
      if (fileCount >= MAX_FILES) {
        // Cho phép GHI ĐÈ file cũ khi kịch trần số file, chỉ chặn tạo MỚI.
        const exists = await pool.query(
          'select 1 from programming.project_files where user_id = $1 and path = $2',
          [auth.userId, body.path],
        )
        if (exists.rowCount === 0) {
          return jsonResponse({ error: `Quá ${MAX_FILES} file trong workspace` }, 413, headers)
        }
      }
      await pool.query(
        `insert into programming.project_files (user_id, path, content, updated_at)
         values ($1, $2, $3, now())
         on conflict (user_id, path) do update set content = excluded.content, updated_at = now()`,
        [auth.userId, body.path, body.content],
      )
      return jsonResponse({ ok: true }, 200, headers)
    }

    // action === 'snapshot': chốt cây file hiện tại CỦA DỰ ÁN ứng với mốc. Lọc ở đây (không
    // trong SQL) để luật tiền tố chỉ nằm ở MỘT chỗ — projectTrackIds.ts, client dùng chung.
    // Regex của schema đã đảm bảo mốc đúng khuôn nên không bao giờ null; `?? 'T1'` cho kiểu.
    const track = trackOfSnapshotMilestone(body.milestone) ?? 'T1'
    const { rows: allFiles } = await pool.query<FileRow>(
      'select path, content, updated_at from programming.project_files where user_id = $1',
      [auth.userId],
    )
    const files = allFiles.filter((f) => trackOfWorkspaceStoragePath(f.path) === track)
    if (files.length === 0) {
      return jsonResponse({ error: 'Workspace trống — chưa có gì để chốt milestone' }, 400, headers)
    }
    const tree: Record<string, string> = {}
    for (const f of files) tree[f.path] = f.content
    await pool.query(
      'insert into programming.project_snapshots (user_id, milestone, files) values ($1, $2, $3)',
      [auth.userId, body.milestone, JSON.stringify(tree)],
    )
    return jsonResponse({ ok: true }, 200, headers)
  } catch (err: unknown) {
    return internalErrorResponse(err, headers, 'programming-project')
  }
}

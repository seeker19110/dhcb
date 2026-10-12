// scripts/eval-v2-permissions-cases.ts — Ca kiểm Personal Policy (thẩm quyền) trên Postgres THẬT.
//
// Thay bộ fixture JSON cũ (changelog 0625): bản cũ dựng `pg` giả TỰ LỌC policy bằng JS, nên nó kiểm
// chính cái mock chứ không kiểm câu SQL của `resolveAuthority`; 10 ca DENY giống hệt nhau, không có
// ca khác người / ghi đè / thu hồi / đồng thời; và chỉ thoát 1 khi DENY bị lách — mọi sai khác khác
// vẫn "xanh". Ở đây mỗi ca gieo policy bằng chính `setPolicy`/`revokePolicy`, đọc bằng chính
// `resolveAuthority`, và ĐỐI CHIẾU với số dòng thật trong `personal.personal_policies`.
import type { Pool } from 'pg'
import { ConflictError, NotFoundError } from '@dhcb/core-errors/appError'
import { AuthorityLevelSchema, type AuthorityLevel } from '@dhcb/core-contracts/personalPolicy'
import {
  listPolicies,
  resolveAuthority,
  revokePolicy,
  setPolicy,
} from '@dhcb/core-personal/policyService'
import {
  captureError,
  describeError,
  isoDaysFromNow,
  type RedTeamContext,
  type RedTeamPerson,
} from './red-team/redTeamKit'

export interface PermissionOutcome {
  pass: boolean
  evidence: string
}

export interface PermissionCase {
  id: string
  title: string
  run(ctx: RedTeamContext): Promise<PermissionOutcome>
}

/** Bộ ba mà mọi ca dùng — một capability thật trong tool registry. */
const SUBJECT = 'learning.update_goal'
const ACTION = 'update_goal'
const SCOPE = 'learning'

async function put(
  pool: Pool,
  person: RedTeamPerson,
  authority: AuthorityLevel,
  triple: { subject?: string; action?: string; resourceScope?: string } = {},
) {
  return setPolicy(pool, {
    personId: person.personId,
    subject: triple.subject ?? SUBJECT,
    action: triple.action ?? ACTION,
    resourceScope: triple.resourceScope ?? SCOPE,
    authority,
    purpose: 'eval-permissions',
    // AUTOMATE bắt buộc có hạn duyệt lại (check constraint 0042); mức khác thì không cần.
    ...(authority === 'AUTOMATE' ? { reviewAt: isoDaysFromNow(30) } : {}),
  })
}

function resolve(pool: Pool, person: RedTeamPerson, triple = { s: SUBJECT, a: ACTION, r: SCOPE }) {
  return resolveAuthority(pool, person.personId, triple.s, triple.a, triple.r)
}

/** Số dòng policy ĐANG HIỆU LỰC của bộ ba chuẩn — đếm thẳng trên bảng, độc lập với service. */
async function activeRows(pool: Pool, person: RedTeamPerson): Promise<number> {
  const res = await pool.query<{ n: string }>(
    `select count(*)::text as n from personal.personal_policies
      where person_id = $1 and subject = $2 and action = $3 and resource_scope = $4
        and revoked_at is null`,
    [person.personId, SUBJECT, ACTION, SCOPE],
  )
  return Number(res.rows[0]?.n ?? 0)
}

function expectAuthority(
  actual: AuthorityLevel | null,
  expected: AuthorityLevel | null,
): PermissionOutcome {
  return {
    pass: actual === expected,
    evidence: `resolveAuthority=${actual ?? 'null'} (mong đợi ${expected ?? 'null'})`,
  }
}

function expectError(err: Error | null, expected: new (...a: never[]) => Error): PermissionOutcome {
  return {
    pass: err instanceof expected,
    evidence: `${describeError(err)} (mong đợi ${expected.name})`,
  }
}

function permCase(id: string, title: string, run: PermissionCase['run']): PermissionCase {
  return { id, title, run }
}

const LEVEL_CASES = AuthorityLevelSchema.options.map((level) =>
  permCase(
    `perm-level-${level.toLowerCase()}`,
    `Đặt ${level} → đọc lại đúng ${level}`,
    async (ctx) => {
      const p = await ctx.newPerson()
      await put(ctx.pool, p, level)
      return expectAuthority(await resolve(ctx.pool, p), level)
    },
  ),
)

export const PERMISSION_CASES: readonly PermissionCase[] = [
  permCase('perm-none', 'Chưa đặt policy nào → null (không tự suy mức mặc định)', async (ctx) => {
    const p = await ctx.newPerson()
    return expectAuthority(await resolve(ctx.pool, p), null)
  }),
  ...LEVEL_CASES,
  permCase(
    'perm-mismatch-subject',
    'DENY ở subject khác → không áp sang subject này',
    async (ctx) => {
      const p = await ctx.newPerson()
      await put(ctx.pool, p, 'DENY', { subject: 'profile.update_fact' })
      return expectAuthority(await resolve(ctx.pool, p), null)
    },
  ),
  permCase('perm-mismatch-action', 'DENY ở action khác → không áp sang action này', async (ctx) => {
    const p = await ctx.newPerson()
    await put(ctx.pool, p, 'DENY', { action: 'lookup' })
    return expectAuthority(await resolve(ctx.pool, p), null)
  }),
  permCase(
    'perm-mismatch-scope',
    'DENY ở phạm vi khác → không áp sang phạm vi này',
    async (ctx) => {
      const p = await ctx.newPerson()
      await put(ctx.pool, p, 'DENY', { resourceScope: 'personal' })
      return expectAuthority(await resolve(ctx.pool, p), null)
    },
  ),
  permCase('perm-revoked', 'DENY đã thu hồi → null, dòng vẫn giữ để audit', async (ctx) => {
    const p = await ctx.newPerson()
    const policy = await put(ctx.pool, p, 'DENY')
    await revokePolicy(ctx.pool, p.personId, policy.id)
    const history = await listPolicies(ctx.pool, p.personId, { includeHistory: true })
    const r = expectAuthority(await resolve(ctx.pool, p), null)
    return {
      pass: r.pass && history.length === 1,
      evidence: `${r.evidence} · lịch sử ${history.length} dòng (mong đợi 1)`,
    }
  }),
  permCase(
    'perm-supersede-tighten',
    'AUTOMATE rồi đặt DENY → DENY, đúng 1 dòng hiệu lực',
    async (ctx) => {
      const p = await ctx.newPerson()
      await put(ctx.pool, p, 'AUTOMATE')
      await put(ctx.pool, p, 'DENY')
      const active = await activeRows(ctx.pool, p)
      const r = expectAuthority(await resolve(ctx.pool, p), 'DENY')
      return { pass: r.pass && active === 1, evidence: `${r.evidence} · hiệu lực ${active} dòng` }
    },
  ),
  permCase(
    'perm-supersede-loosen',
    'DENY rồi đặt READ → READ (người dùng nới được)',
    async (ctx) => {
      const p = await ctx.newPerson()
      await put(ctx.pool, p, 'DENY')
      await put(ctx.pool, p, 'READ')
      const active = await activeRows(ctx.pool, p)
      const r = expectAuthority(await resolve(ctx.pool, p), 'READ')
      return { pass: r.pass && active === 1, evidence: `${r.evidence} · hiệu lực ${active} dòng` }
    },
  ),
  permCase('perm-cross-automate', 'A bật AUTOMATE → B KHÔNG được hưởng (null)', async (ctx) => {
    const a = await ctx.newPerson()
    const b = await ctx.newPerson()
    await put(ctx.pool, a, 'AUTOMATE')
    return expectAuthority(await resolve(ctx.pool, b), null)
  }),
  permCase('perm-cross-deny', 'B đặt READ không gỡ được DENY của A', async (ctx) => {
    const a = await ctx.newPerson()
    const b = await ctx.newPerson()
    await put(ctx.pool, a, 'DENY')
    await put(ctx.pool, b, 'READ')
    const r = expectAuthority(await resolve(ctx.pool, a), 'DENY')
    const rb = await resolve(ctx.pool, b)
    return { pass: r.pass && rb === 'READ', evidence: `A: ${r.evidence} · B=${rb ?? 'null'}` }
  }),
  permCase(
    'perm-revoke-other',
    'B thu hồi policy của A → 404, policy A còn hiệu lực',
    async (ctx) => {
      const a = await ctx.newPerson()
      const b = await ctx.newPerson()
      const policy = await put(ctx.pool, a, 'DENY')
      const err = await captureError(() => revokePolicy(ctx.pool, b.personId, policy.id))
      const r = expectError(err, NotFoundError)
      const still = await resolve(ctx.pool, a)
      return {
        pass: r.pass && still === 'DENY',
        evidence: `${r.evidence} · A còn ${still ?? 'null'}`,
      }
    },
  ),
  permCase('perm-revoke-twice', 'Thu hồi hai lần → lần hai 409', async (ctx) => {
    const p = await ctx.newPerson()
    const policy = await put(ctx.pool, p, 'DENY')
    await revokePolicy(ctx.pool, p.personId, policy.id)
    return expectError(
      await captureError(() => revokePolicy(ctx.pool, p.personId, policy.id)),
      ConflictError,
    )
  }),
  permCase('perm-automate-no-review', 'AUTOMATE không có reviewAt → CSDL từ chối', async (ctx) => {
    const p = await ctx.newPerson()
    const err = await captureError(() =>
      setPolicy(ctx.pool, {
        personId: p.personId,
        subject: SUBJECT,
        action: ACTION,
        resourceScope: SCOPE,
        authority: 'AUTOMATE',
        purpose: 'eval-permissions',
      }),
    )
    const active = await activeRows(ctx.pool, p)
    return {
      pass:
        err !== null && /personal_policies_automate_needs_review/.test(err.message) && active === 0,
      evidence: `${describeError(err)} · hiệu lực ${active} dòng`,
    }
  }),
  // Changelog 0627: AUTOMATE quá hạn duyệt lại hạ về chờ xác nhận — `review_at` trước đây không
  // được đọc ở đâu, AUTOMATE có hiệu lực vĩnh viễn. Hai ca đi cặp: quá hạn (hạ mức) + ngay sát hạn
  // về phía tương lai (giữ nguyên) để chắc phép so dùng đúng chiều.
  permCase(
    'perm-automate-review-due',
    'AUTOMATE đã quá review_at → hạ về EXECUTE_WITH_CONFIRMATION, dòng giữ nguyên',
    async (ctx) => {
      const p = await ctx.newPerson()
      await setPolicy(ctx.pool, {
        personId: p.personId,
        subject: SUBJECT,
        action: ACTION,
        resourceScope: SCOPE,
        authority: 'AUTOMATE',
        purpose: 'eval-permissions',
        reviewAt: isoDaysFromNow(-1),
      })
      const out = expectAuthority(await resolve(ctx.pool, p), 'EXECUTE_WITH_CONFIRMATION')
      const stored = (await listPolicies(ctx.pool, p.personId))[0]?.authority
      return {
        pass: out.pass && stored === 'AUTOMATE',
        evidence: `${out.evidence} · dòng lưu: ${stored ?? 'không có'}`,
      }
    },
  ),
  permCase(
    'perm-automate-review-ahead',
    'AUTOMATE còn hạn review_at → vẫn AUTOMATE',
    async (ctx) => {
      const p = await ctx.newPerson()
      await setPolicy(ctx.pool, {
        personId: p.personId,
        subject: SUBJECT,
        action: ACTION,
        resourceScope: SCOPE,
        authority: 'AUTOMATE',
        purpose: 'eval-permissions',
        reviewAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      return expectAuthority(await resolve(ctx.pool, p), 'AUTOMATE')
    },
  ),
  permCase('perm-invalid-level', 'Mức thẩm quyền lạ ("ROOT") → CSDL từ chối', async (ctx) => {
    const p = await ctx.newPerson()
    // Ép kiểu có chủ đích: mô phỏng giá trị lọt qua tầng trên (bỏ qua Zod của API).
    const err = await captureError(() => put(ctx.pool, p, 'ROOT' as AuthorityLevel))
    return {
      pass: err !== null && /check constraint/.test(err.message),
      evidence: describeError(err),
    }
  }),
  permCase(
    'perm-concurrent',
    '5 lần đặt ĐỒNG THỜI cùng bộ ba → đúng 1 dòng hiệu lực, bên thua nhận 409 (không 500)',
    async (ctx) => {
      const p = await ctx.newPerson()
      const levels: AuthorityLevel[] = ['READ', 'SUGGEST', 'DRAFT', 'DENY', 'WRITE_INTERNAL']
      const settled = await Promise.allSettled(levels.map((l) => put(ctx.pool, p, l)))
      const active = await activeRows(ctx.pool, p)
      const resolved = await resolve(ctx.pool, p)
      const ok = settled.filter((s) => s.status === 'fulfilled').length
      // Lần thua phải là ConflictError — DatabaseError thô thành 500 ở API (changelog 0625).
      const badErrors = settled
        .filter((s): s is PromiseRejectedResult => s.status === 'rejected')
        .filter((s) => !(s.reason instanceof ConflictError))
        .map((s) =>
          describeError(s.reason instanceof Error ? s.reason : new Error(String(s.reason))),
        )
      return {
        pass: active === 1 && resolved !== null && levels.includes(resolved) && !badErrors.length,
        evidence:
          `${ok}/5 lần ghi thành công · hiệu lực ${active} dòng · resolve=${resolved ?? 'null'}` +
          (badErrors.length ? ` · ✗ lỗi không phải 409: ${badErrors[0]}` : ''),
      }
    },
  ),
]

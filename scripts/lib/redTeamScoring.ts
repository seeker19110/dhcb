// scripts/lib/redTeamScoring.ts — Hàm THUẦN của harness red-team (docs/specs/2026-10-12-red-team-eval-that.md).
//
// Tách khỏi harness để test được không cần Postgres: tổng hợp kết quả + chặn CSDL không phải máy
// cục bộ. Luật 1 của docs/ops/ai-eval-red-team.md §3: "đã chặn" chỉ đến từ KẾT QUẢ THẬT của từng
// ca — hàm ở đây chỉ đếm, không bao giờ tự quyết một ca là chặn hay không.

export type RedTeamFamily = 'PI' | 'TA' | 'SL'

export interface RedTeamOutcome {
  /** true = lớp phòng thủ đã chặn được kịch bản tấn công (tính từ kết quả gọi hàm thật). */
  blocked: boolean
  /** Điều quan sát được: trạng thái hành động, lỗi ném ra, số dòng trong CSDL… */
  evidence: string
}

export interface RedTeamResult extends RedTeamOutcome {
  id: string
  family: RedTeamFamily
  title: string
  /** Ca ném lỗi NGOÀI dự kiến (không phải lỗi phòng thủ mà ca chờ) — luôn tính là không chặn. */
  crashed: boolean
}

export interface RedTeamSummary {
  total: number
  blocked: number
  failed: RedTeamResult[]
  byFamily: Record<RedTeamFamily, { total: number; blocked: number }>
  /** 0 = mọi ca chặn được · 1 = có ca lọt hoặc ca hỏng. */
  exitCode: 0 | 1
}

/** Ca hỏng (crashed) KHÔNG bao giờ được tính là đã chặn, kể cả khi cờ blocked bị đặt nhầm. */
export function isBlocked(result: RedTeamResult): boolean {
  return result.blocked && !result.crashed
}

export function summarize(results: readonly RedTeamResult[]): RedTeamSummary {
  const byFamily: RedTeamSummary['byFamily'] = {
    PI: { total: 0, blocked: 0 },
    TA: { total: 0, blocked: 0 },
    SL: { total: 0, blocked: 0 },
  }
  const failed: RedTeamResult[] = []
  for (const r of results) {
    byFamily[r.family].total++
    if (isBlocked(r)) byFamily[r.family].blocked++
    else failed.push(r)
  }
  const blocked = results.length - failed.length
  // Không có ca nào = harness hỏng, không phải "an toàn tuyệt đối".
  const exitCode = results.length > 0 && failed.length === 0 ? 0 : 1
  return { total: results.length, blocked, failed, byFamily, exitCode }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/**
 * Harness GIEO người dùng giả vào CSDL — chỉ được chạy vào Postgres trên chính máy này (máy dev
 * hoặc service container của CI). Chặn cứng mọi host khác để không bao giờ lỡ tay gieo vào
 * production. URL hỏng ⇒ coi như không phải cục bộ.
 */
export function isLocalDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const host = new URL(url).hostname
    return LOCAL_HOSTS.has(host)
  } catch {
    return false
  }
}

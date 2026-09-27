// api/hub-stats.ts — Thống kê và trạng thái phiên cho trang chủ apps/hub.
// BẢO MẬT & RIÊNG TƯ:
// - CHỈ ADMIN (xác thực qua cookie session + isAdminUser) mới xem được số lượng người dùng thật
//   (totalUsers) và tổng lượt học (totalEnglishSessions).
// - Người dùng thông thường hoặc khách vãng lai: API KHÔNG trả về 2 trường nhạy cảm này (ẩn hoàn toàn).
// - Trả kèm trạng thái `loggedIn: boolean` và `userName: string` để trang chủ hiển thị link
//   truy cập trang cá nhân khi đã đăng nhập.
//
// GET /api/hub-stats

import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getUserById } from '@dhcb/core-auth/authService'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

interface AdminHubStats {
  totalUsers: number
  totalEnglishSessions: number
}

export interface HubStatsResponse {
  isAdmin: boolean
  loggedIn: boolean
  userName?: string
  totalUsers?: number
  totalEnglishSessions?: number
}

let cache: { data: AdminHubStats; expiresAt: number } | null = null
const CACHE_MS = 5 * 60 * 1000 // 5 phút

async function loadAdminStats(): Promise<AdminHubStats> {
  const pool = getPgPool()
  const [{ rows: userRows }, { rows: sessionRows }] = await Promise.all([
    pool.query<{ count: string }>('select count(*)::text as count from public.users'),
    pool.query<{ count: string }>(
      `select
         (select count(*) from english.chat_sessions) +
         (select count(*) from english.writing_submissions) +
         (select count(*) from english.speaking_sessions) as count`,
    ),
  ])
  return {
    totalUsers: Number(userRows[0]?.count ?? 0),
    totalEnglishSessions: Number(sessionRows[0]?.count ?? 0),
  }
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'hub-stats'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/hub-stats' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  // 1. Kiểm tra xác thực qua cookie session_token
  const auth = await validateAuth(req)
  let loggedIn = false
  let isAdmin = false
  let userName = ''

  if (auth?.userId) {
    loggedIn = true
    try {
      const pool = getPgPool()
      const [user, profileRes] = await Promise.all([
        getUserById(auth.userId),
        pool.query<{ name: string | null }>('select name from public.profiles where id = $1', [
          auth.userId,
        ]),
      ])
      isAdmin = isAdminUser(auth.userId)
      userName = profileRes.rows[0]?.name || user?.email?.split('@')[0] || ''
    } catch {
      // Fail-open: vẫn coi như đã đăng nhập nhưng không phải admin nếu DB lỗi tạm thời
    }
  }

  // 2. Nếu là Admin: nạp số liệu tổng để hiển thị
  if (isAdmin) {
    const now = Date.now()
    if (!cache || cache.expiresAt < now) {
      cache = { data: await loadAdminStats(), expiresAt: now + CACHE_MS }
    }
    const responseData: HubStatsResponse = {
      isAdmin: true,
      loggedIn: true,
      userName,
      totalUsers: cache.data.totalUsers,
      totalEnglishSessions: cache.data.totalEnglishSessions,
    }
    return jsonResponse(responseData, 200, allHeaders)
  }

  // 3. Khách hoặc người dùng không phải admin: KHÔNG trả số người dùng và lượt học
  const responseData: HubStatsResponse = {
    isAdmin: false,
    loggedIn,
    ...(userName ? { userName } : {}),
  }
  return jsonResponse(responseData, 200, allHeaders)
}

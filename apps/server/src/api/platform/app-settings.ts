// api/app-settings.ts — Đọc CÔNG KHAI hạn mức/khuyến mãi hiện hành (bảng app_settings) để
// client đồng bộ ngay lúc mở app, KHÔNG cần đăng nhập (chỉ là số hạn mức theo gói + mốc
// khuyến mãi, không phải dữ liệu riêng tư của user nào) — khác api/admin-settings.ts (đọc/SỬA,
// bắt buộc admin). Client dùng src/lib/appSettings.ts để gọi + cache endpoint này.
//
// Hỗ trợ ETag/If-None-Match (token = updated_at của dòng cấu hình) — client gửi lại token
// đã có, admin CHƯA đổi gì thì trả 304 rỗng (không tốn băng thông parse lại JSON mỗi lần mở
// app), đổi rồi thì mới trả body mới + token mới.
//
// GET /api/app-settings

import { getAppSettings } from '@dhcb/core-db/settings'
import { AI_USAGE_POLICY_VERSION, hasUnlimitedAiTurns } from '@dhcb/core-billing/aiUsagePolicy'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'app-settings'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/app-settings' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const settings = await getAppSettings()
  const data = {
    ...settings,
    vipUnlimited: hasUnlimitedAiTurns('vip'),
    updatedAt: `${settings.updatedAt}:${AI_USAGE_POLICY_VERSION}`,
  }
  const etag = `"${data.updatedAt}"`

  // Cache ngắn ở CDN/trình duyệt cộng thêm cơ chế ETag — số này hiếm khi đổi.
  const headers = { ...allHeaders, 'Cache-Control': 'public, max-age=60', ETag: etag }

  if (req.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers })
  }

  return jsonResponse(data, 200, headers)
}

export const config = { runtime: 'edge' }

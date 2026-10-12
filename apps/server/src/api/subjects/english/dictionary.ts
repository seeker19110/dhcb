// api/dictionary.ts — Tìm kiếm từ điển PHÍA SERVER.
// Trước đây client tải TẤT CẢ ~7.400 từ (≈560KB gzip) chỉ để tra/lật thẻ. Endpoint này
// giữ dữ liệu trên server và chỉ trả về phần cần thiết → trang Dictionary nhẹ hơn nhiều.
//
// Endpoint (GET, cần đăng nhập):
//   /api/dictionary?q=friend            → tìm theo từ tiếng Anh hoặc nghĩa tiếng Việt
//   /api/dictionary?q=friend&limit=60   → giới hạn số kết quả (mặc định 200, tối đa 200)
//   /api/dictionary?mode=wordOfDay      → 1 từ cố định theo ngày (cho thẻ "Từ vựng hôm nay")
//   /api/dictionary?mode=random&n=30    → n từ ngẫu nhiên (cho luyện Flashcard)
//
// Chạy trên Node (Express/VPS) vì cần đọc file từ điển — KHÔNG dùng Edge runtime.

import { getAllEntries, searchDictionaryEntries } from '@dhcb/subject-english/dictionaryData'
import { vnDateStr } from '@dhcb/core-db/date'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const MAX_RESULTS = 200

// Sinh số "ngẫu nhiên nhưng cố định theo ngày" — phải KHỚP với logic cũ ở WordOfTheDay
// để cùng một ngày luôn ra cùng một từ.
function seedFromDate(date: string): number {
  let h = 0
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0
  return h
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  // Tra từ điển chỉ đọc RAM (không tốn tiền API) nên hạn mức rộng.
  if (!(await checkRateLimit(clientIp, 120, 'dict'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/dictionary' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  // Bắt buộc đăng nhập (giống các endpoint khác) để tránh bị cào dữ liệu vô tội vạ.
  const auth = await validateAuth(req)
  if (!auth) {
    logSecurityEvent('AUTH_FAILED', clientIp, { path: '/api/dictionary' })
    return jsonResponse({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, 401, allHeaders)
  }

  const entries = getAllEntries()
  const url = new URL(req.url)
  const mode = url.searchParams.get('mode')

  // ── Từ vựng hôm nay: 1 từ cố định theo ngày ────────────────────────────────
  if (mode === 'wordOfDay') {
    const today = vnDateStr()
    const entry = entries[seedFromDate(today) % entries.length] ?? null
    return jsonResponse({ total: entries.length, entry }, 200, allHeaders)
  }

  // ── n từ ngẫu nhiên (Flashcard) ─────────────────────────────────────────────
  if (mode === 'random') {
    const n = Math.min(Math.max(Number(url.searchParams.get('n')) || 30, 1), 100)
    const picked = pickRandom(entries, n)
    return jsonResponse({ total: entries.length, entries: picked }, 200, allHeaders)
  }

  // ── Tìm kiếm theo từ khóa ────────────────────────────────────────────────────
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  if (!q)
    return jsonResponse(
      { total: entries.length, matched: 0, posGroups: [], results: [] },
      200,
      allHeaders,
    )
  if (q.length > 100) return jsonResponse({ error: 'Từ khóa quá dài' }, 400, allHeaders)

  // Tiếng Việt có dấu → tìm theo nghĩa; còn lại ưu tiên từ BẮT ĐẦU bằng query (giống client cũ).
  const matches = searchDictionaryEntries(entries, q)

  // Đếm số lượng theo loại từ trên TOÀN BỘ kết quả khớp (để vẽ chip lọc loại từ).
  // Đếm TRƯỚC khi lọc theo `pos` để chip luôn hiện tổng đầy đủ, không bị thay đổi
  // theo bộ lọc đang chọn.
  const counts: Record<string, number> = {}
  for (const e of matches) counts[e.pos] = (counts[e.pos] || 0) + 1
  const posGroups = Object.entries(counts).sort((a, b) => b[1] - a[1])

  // Lọc theo loại từ Ở SERVER (nếu client gửi `pos`). Trước đây client tự lọc trên
  // tối đa 200 kết quả trả về → khi 1 truy vấn có >200 từ khớp, số trên chip (đếm
  // toàn bộ) lệch với số thực sự lọc được. Lọc ở server bảo đảm khớp.
  const posParam = url.searchParams.get('pos')
  const filtered = posParam ? matches.filter((e) => e.pos === posParam) : matches

  return jsonResponse(
    {
      total: entries.length,
      matched: matches.length,
      posGroups,
      results: filtered.slice(0, MAX_RESULTS), // cắt bớt để response không quá lớn
    },
    200,
    allHeaders,
  )
}

// Lấy n phần tử ngẫu nhiên (Fisher–Yates một phần, không sửa mảng gốc).
function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && a.length > 0; i++) {
    const j = Math.floor(Math.random() * a.length)
    out.push(a[j]!) // j < a.length nên chắc chắn có
    a.splice(j, 1)
  }
  return out
}

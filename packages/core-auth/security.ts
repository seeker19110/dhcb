// api/_lib/security.ts — Middleware bảo mật dùng chung cho tất cả API endpoints
// Import file này ở đầu mỗi handler để có CORS, rate limit, auth validation, v.v.

import { isIPv6 } from 'node:net'
import { Redis } from 'ioredis'
import { validateSessionToken } from './authService.js'
import { readSessionCookie } from './sessionCookie.js'

// ── CORS ──────────────────────────────────────────────────────────────────────
// Đọc danh sách domain cho phép từ biến môi trường ALLOWED_ORIGINS (phân cách bằng dấu phẩy).
// Ví dụ: ALLOWED_ORIGINS=https://myapp.vercel.app,https://myapp.com
// Production có mặc định cụ thể; dev chỉ cho cookie/mutation từ localhost.
const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.donghanhcungban.org',
  'https://donghanhcungban.org',
  'https://en-vi.donghanhcungban.org',
  'https://www.donghanhcungban.com',
  'https://donghanhcungban.com',
  'https://en-vi.donghanhcungban.com',
]

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
}

function allowedOrigins(): string[] | null {
  if (process.env.ALLOWED_ORIGINS !== undefined) {
    return process.env.ALLOWED_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return isProduction() ? DEFAULT_ALLOWED_ORIGINS : null
}

/** Khớp origin chính xác; cấu hình tường minh thay thế danh sách mặc định. */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin || origin === 'null') return false
  const list = allowedOrigins()
  if (list) return list.includes(origin)
  try {
    const url = new URL(origin)
    return (
      url.origin === origin &&
      ['http:', 'https:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
  } catch {
    return false
  }
}

/** Request sửa dữ liệu phải đến từ origin tin cậy, kể cả các subdomain cùng site. */
export function isTrustedMutation(req: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return true
  const origin = req.headers.get('Origin')
  if (origin !== null) return isAllowedOrigin(origin)
  const site = req.headers.get('Sec-Fetch-Site')
  if (site === 'cross-site' || site === 'same-site') return false
  // Trình duyệt có phiên phải gửi Origin. Webhook/server không dùng cookie
  // vẫn được đi đến handler để xác thực bằng khóa riêng.
  return !readSessionCookie(req)
}

/**
 * Cổng Origin cho WebSocket upgrade (chống Cross-Site WebSocket Hijacking). Trình duyệt LUÔN gửi
 * `Origin` khi mở WebSocket, và cookie phiên đi kèm tự động — thiếu cổng này thì một trang khác
 * cùng site (vd `sales.donghanhcungban.org`, ứng dụng riêng) mở được kết nối nhân danh người
 * dùng đang đăng nhập. Cùng danh sách tin cậy với CORS/CSRF của HTTP (vá 2026-09-27).
 */
export function isAllowedWebSocketOrigin(origin: string | string[] | undefined): boolean {
  return typeof origin === 'string' && isAllowedOrigin(origin)
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const trusted = isAllowedOrigin(origin)
  const list = allowedOrigins()
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': trusted ? origin : list === null ? '*' : (list[0] ?? 'null'),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Id',
    Vary: 'Origin',
  }
  if (trusted) headers['Access-Control-Allow-Credentials'] = 'true'
  return headers
}

// ── Security Headers ──────────────────────────────────────────────────────────
// Permissions-Policy: tắt sẵn mọi tính năng trình duyệt app KHÔNG dùng, và giới hạn hai
// tính năng app CÓ dùng về chính origin này:
//   - microphone: ghi âm luyện nói/STT (apps/dhcb/src/lib/audioRecorder.ts, sttServer.ts)
//   - camera: quay video challenge (apps/dhcb/src/lib/challengeRecorder.ts, nhánh video)
// Thiếu header này thì một iframe/script nhúng bên thứ ba vẫn xin được các quyền đó dưới
// danh nghĩa trang mình (audit 2026-08-25, F4).
//
// ĐÚNG MỘT giá trị dùng chung cho cả response API lẫn trang HTML: `wrapEdge` đính header
// sau khi copy response của handler, nên nếu để hai giá trị khác nhau thì giá trị này luôn
// thắng — hai bản chỉ gây hiểu nhầm chứ không siết thêm được gì.
// HSTS: ghim HTTPS 2 năm. Khai báo riêng vì trang HTML/static cũng cần đúng giá trị này
// (applyCommonSecurityHeaders trong apps/server/src/routes.ts) — audit 2026-08-25, F4.
export const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload'

export const PERMISSIONS_POLICY =
  'accelerometer=(), autoplay=(self), camera=(self), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self), payment=(), usb=()'

// Các header bảo mật chuẩn — luôn đính kèm vào mọi response từ server.
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  // SAMEORIGIN chứ không phải DENY: CSP của dự án khai `frame-ancestors 'self'` (nguồn chuẩn,
  // hiện đại, trình duyệt ưu tiên hơn X-Frame-Options). Để DENY ở đây là TỰ MÂU THUẪN với
  // chính CSP mình gửi kèm. Thống nhất một giá trị, khớp CSP (audit 2026-08-25, F4).
  'X-Frame-Options': 'SAMEORIGIN',
  // X-XSS-Protection đã deprecated — trình duyệt hiện đại không cần, bỏ đi tránh warning
  'Strict-Transport-Security': HSTS_VALUE,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': PERMISSIONS_POLICY,
  // no-store: không cache response API (có chứa khoá giải mã và dữ liệu nhạy cảm)
  'Cache-Control': 'no-store',
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Production bắt buộc dùng bộ đếm Redis chung. Thiếu/đang kết nối/lỗi Redis
// sẽ từ chối request có rate limit; chỉ dev/test dùng bộ đếm cục bộ.
// Giữ giới hạn chi phí AI và thử đăng nhập trong suốt sự cố Redis.
//
// LƯU Ý khi có Cloudflare trước VPS (xem docs/cloudflare-setup.md): IP lấy từ
// header X-Forwarded-For (clientIp ở mỗi handler api/*.ts) CHỈ đáng tin nếu Nginx
// đã cấu hình module real_ip để chỉ chấp nhận header này từ đúng dải IP Cloudflare
// (nginx/cloudflare-realip.conf, sinh bởi scripts/update-cloudflare-ips.sh). Thiếu
// bước đó, ai gọi thẳng vào IP VPS có thể tự chèn X-Forwarded-For giả để né rate
// limit này hoàn toàn.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Cửa sổ đếm: 60 giây (giữ nguyên ý nghĩa `maxPerMin` — số request tối đa mỗi phút).
const WINDOW_MS = 60_000

// Script Lua: tăng bộ đếm, và CHỈ khi vừa tạo key mới (count == 1) mới đặt hạn dùng.
// Nhờ vậy cửa sổ 60s tính từ request đầu tiên, không bị "gia hạn" mỗi lần gọi.
const RATE_LIMIT_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count
`

// Client Redis dùng chung, khởi tạo lười (chỉ tạo ở lần gọi đầu có REDIS_URL).
// `null` = đã kiểm tra và không dùng Redis; `undefined` = chưa kiểm tra lần nào.
let redisClient: Redis | null | undefined
// `true` = đang ở trạng thái suy giảm (đã báo). Dùng để log ĐÚNG MỘT lần MỖI LẦN CHUYỂN
// TRẠNG THÁI, không phải một lần rồi câm vĩnh viễn — xem chú thích ở noteRedisDegraded().
let redisDegraded = false
let lastRedisError = ''

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient

  const url = process.env.REDIS_URL
  if (!url) {
    redisClient = null // Không cấu hình Redis: production từ chối, dev dùng Map
    return null
  }

  try {
    redisClient = new Redis(url, {
      // Không thử lại vô hạn: request phải trả lời nhanh và đóng an toàn ở production.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    })
    // Bắt sự kiện 'error' để lỗi kết nối nền không làm process crash (unhandled error).
    redisClient.on('error', (err: Error) => noteRedisDegraded(err))
    redisClient.on('ready', () => noteRedisRecovered())
  } catch (err) {
    noteRedisDegraded(err)
    redisClient = null
  }
  return redisClient
}

// Ghi nhận Redis hỏng. Log MỘT lần mỗi LẦN CHUYỂN TRẠNG THÁI (đang tốt → hỏng), không spam
// mỗi request.
//
// [2026-08-23] Trước đây cờ này latch `true` VĨNH VIỄN sau lần hỏng đầu: Redis chết lại lần sau
// thì log câm, mà Redis sống lại cũng không ai biết — nhìn log không phân biệt nổi "trục trặc
// thoáng qua lúc khởi động" với "Redis chết cả ngày". Nay có cả chiều phục hồi.
function noteRedisDegraded(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  lastRedisError = message
  if (redisDegraded) return
  redisDegraded = true
  console.warn(
    `[Security] Redis lỗi (${message}) — production từ chối request có rate limit; dev dùng Map in-memory.`,
  )
}

function noteRedisRecovered(): void {
  if (!redisDegraded) return
  redisDegraded = false
  lastRedisError = ''
  console.warn('[Security] Redis đã hoạt động trở lại — rate limit dùng chung toàn cluster.')
}

/** Trạng thái Redis cho health check (xem apps/server/src/api/platform/healthDeep.ts). */
export function getRedisRuntimeStatus(): {
  configured: boolean
  state: string
  degraded: boolean
  lastError: string
} {
  const configured = Boolean(process.env.REDIS_URL)
  const client = configured ? getRedis() : null
  return {
    configured,
    state: client?.status ?? 'disabled',
    degraded: redisDegraded,
    lastError: lastRedisError,
  }
}

/** PING Redis thật để health check biết nó SỐNG hay CHẾT, không đoán theo biến môi trường. */
export async function pingRedis(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const client = getRedis()
  if (!client) return { ok: false, error: 'REDIS_URL chưa cấu hình' }
  const startedAt = Date.now()
  try {
    await client.ping()
    noteRedisRecovered()
    return { ok: true, latencyMs: Date.now() - startedAt }
  } catch (err) {
    noteRedisDegraded(err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Cảnh báo cấu hình Redis thiếu khi khởi động dưới PM2. Production từ chối
// request có rate limit cho đến khi cấu hình và kết nối được khôi phục.
export function warnIfClusterWithoutRedis(): void {
  const underPm2 = process.env.NODE_APP_INSTANCE !== undefined
  if (underPm2 && !process.env.REDIS_URL) {
    console.warn(
      '[Security] ⚠️  Chạy dưới PM2 nhưng CHƯA đặt REDIS_URL trong .env — nếu ' +
        "ecosystem.config.cjs đang bật cluster mode nhiều instance ('instances' > 1), " +
        'production từ chối request có rate limit cho đến khi Redis sẵn sàng. ' +
        'Xem docs/deploy-vps-ubuntu.md mục REDIS_URL.',
    )
  }
}

/**
 * Kiểm Redis NGAY LÚC KHỞI ĐỘNG và in kết quả rõ ràng vào log.
 *
 * VÌ SAO CẦN (sự cố thật 2026-08-23): `REDIS_URL` trên VPS thiếu mật khẩu trong khi Redis bật
 * `requirepass`. Client không bao giờ đạt trạng thái `ready`, nên rate limit chạy Map in-memory
 * LIÊN TỤC — cluster 3 instance nghĩa là hạn mức chống lạm dụng lỏng gấp 3. Lỗi này nằm im
 * nhiều ngày vì log chỉ có vài dòng rải rác, nhìn như trục trặc thoáng qua.
 *
 * Có hàm này thì ngay dòng log khởi động đã nói thẳng Redis sống hay chết, kèm lý do — không
 * phải suy đoán từ log rải rác hay chờ tới lúc bị lạm dụng mới biết.
 *
 * KHÔNG chặn khởi động: gọi kiểu "bắn rồi quên", app vẫn phục vụ bình thường dù Redis hỏng.
 *
 * `pingFn` cho phép test tiêm hàm giả (mặc định dùng pingRedis thật). Cần tiêm vì lời gọi nằm
 * NỘI BỘ trong module này — mock ở tầng module không chặn được lời gọi nội bộ.
 */
export async function reportRedisStatusAtStartup(
  pingFn: () => Promise<{ ok: boolean; latencyMs?: number; error?: string }> = pingRedis,
): Promise<void> {
  if (!process.env.REDIS_URL) return // đã có warnIfClusterWithoutRedis() lo trường hợp này

  const ping = await pingFn()
  if (ping.ok) {
    console.log(`   Redis    : ✅ dùng chung toàn cluster (${ping.latencyMs}ms)`)
    return
  }
  console.warn(
    `   Redis    : ❌ KHÔNG dùng được (${ping.error}) — production từ chối request có rate limit. ` +
      'Kiểm REDIS_URL trong .env: Redis có mật khẩu thì ' +
      'URL phải dạng redis://:MẬT_KHẨU@127.0.0.1:6379 (chú ý dấu hai chấm sau //).',
  )
}

// ── Chủ thể đếm: gom IPv6 theo dải /64 ─────────────────────────────────────────
// [2026-09-27] Một thuê bao IPv6 (nhà mạng, VPS) được cấp NGUYÊN dải /64 = 2^64 địa chỉ, đổi
// địa chỉ trong dải là miễn phí. Đếm theo từng địa chỉ /128 thì mỗi request một bộ đếm mới →
// né sạch mọi giới hạn theo IP (dò mật khẩu, lượt thử AI của khách). /64 là đơn vị nhỏ nhất
// nhà mạng giao cho một khách hàng (RFC 6177), nên đếm theo /64 ≈ đếm theo "một người/một nhà".
// Chuỗi không phải IPv6 (IPv4, userId, 'unknown') giữ nguyên.

/** Tách IPv6 (đã bỏ zone `%eth0`) thành đúng 8 nhóm 16 bit; null nếu không đọc được. */
function ipv6Groups(address: string): number[] | null {
  let text = address.split('%')[0] ?? ''
  // Đuôi IPv4 nhúng (vd ::ffff:1.2.3.4) → đổi thành 2 nhóm hex.
  const lastColon = text.lastIndexOf(':')
  const tail = text.slice(lastColon + 1)
  if (tail.includes('.')) {
    const octets = tail.split('.').map(Number)
    if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
      return null
    }
    const [a = 0, b = 0, c = 0, d = 0] = octets
    text = `${text.slice(0, lastColon + 1)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = text.split('::')
  if (halves.length > 2) return null
  const parse = (part: string | undefined) =>
    part ? part.split(':').map((g) => Number.parseInt(g, 16)) : []
  const head = parse(halves[0])
  const rest = parse(halves[1])
  const missing = 8 - head.length - rest.length
  if (halves.length === 1 ? missing !== 0 : missing < 0) return null
  const groups = [...head, ...Array<number>(Math.max(0, missing)).fill(0), ...rest]
  return groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null
}

/**
 * Chủ thể dùng làm khoá đếm rate limit/hạn mức: IPv6 → dải /64 của nó (`2001:db8:1:2::/64`),
 * IPv4-mapped (`::ffff:1.2.3.4`) → chính IPv4 đó, mọi chuỗi khác giữ nguyên.
 */
export function rateLimitSubject(subject: string): string {
  if (!isIPv6(subject)) return subject
  const groups = ipv6Groups(subject)
  if (!groups) return subject
  const isV4Mapped = groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff
  if (isV4Mapped) {
    const hi = groups[6] ?? 0
    const lo = groups[7] ?? 0
    return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
  }
  return `${groups
    .slice(0, 4)
    .map((g) => g.toString(16))
    .join(':')}::/64`
}

// Trả về true nếu được phép, false nếu vượt quá giới hạn.
// `bucket` cho phép một IP có NHIỀU bộ đếm riêng biệt — ví dụ tách "tổng số request"
// (kể cả cache HIT, rất rẻ) với "số lần tạo audio mới" (cache MISS, tốn tiền Google TTS).
// Nhờ vậy người dùng phát cả bài học / tra nhiều từ đã cache vẫn mượt, mà chi phí API
// vẫn được giới hạn chặt ở đường tạo mới. Xem cách dùng trong api/tts.ts & api/pronunciation.ts.
export async function checkRateLimit(
  ip: string,
  maxPerMin = 60,
  bucket = 'default',
): Promise<boolean> {
  const key = `${bucket}:${rateLimitSubject(ip)}`

  const redis = getRedis()
  // CHỈ dùng khi kết nối đã sẵn sàng. `enableOfflineQueue: false` nghĩa là gọi lệnh lúc client
  // còn 'connecting'/'reconnecting' sẽ ném ngay "Stream isn't writeable…" — đúng lỗi thấy trong
  // log production sau mỗi lần PM2 restart. Trong cửa sổ này production từ chối lượt mới;
  // dev/test dùng bộ đếm cục bộ.
  if (redis && redis.status === 'ready') {
    try {
      // Script Lua chạy nguyên khối trên Redis → INCR và PEXPIRE không bị chen giữa
      // (tránh race: hai request cùng lúc đều thấy key mới và cùng đặt hạn dùng).
      const count = (await redis.eval(RATE_LIMIT_LUA, 1, key, String(WINDOW_MS))) as number
      noteRedisRecovered()
      return count <= maxPerMin
    } catch (err) {
      // Redis hỏng → production từ chối, dev/test dùng Map in-memory.
      noteRedisDegraded(err)
    }
  }

  // Không nhân hạn mức lên theo số worker khi Redis gặp sự cố.
  if (isProduction()) return false
  return checkRateLimitInMemory(key, maxPerMin)
}

// ── Bộ đếm theo NGÀY (dùng cho hạn mức dùng thử của khách vãng lai) ──────────
// Khác `checkRateLimit` ở chỗ cửa sổ là một NGÀY chứ không phải một phút, và có đường TRẢ LẠI
// (releaseDailyCounter) khi nhà cung cấp AI lỗi — đúng tinh thần refundUsage() của người đã
// đăng nhập, để khách không mất lượt vì lỗi của mình.
//
// VÌ SAO KHÔNG DÙNG POSTGRES: khách ẩn danh không có hàng nào trong `profiles`, và đặc tả cố ý
// không thêm migration cho đợt này. Redis là nơi duy nhất đã có sẵn, dùng chung toàn cluster.
// Production từ chối lượt mới khi Redis không sẵn sàng; Map chỉ dùng trong dev/test.
const dailyCounterMap = new Map<string, { count: number; resetAt: number }>()
const DAY_MS = 24 * 60 * 60 * 1000

const DAILY_COUNTER_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count
`

function pruneDailyCounters(now: number): void {
  // Dọn key hết hạn — Map in-memory không tự hết hạn như Redis, để lâu sẽ phình theo số khách.
  if (dailyCounterMap.size < 10_000) return
  for (const [key, entry] of dailyCounterMap) if (now > entry.resetAt) dailyCounterMap.delete(key)
}

/**
 * Kết quả đếm có PHÂN BIỆT lý do từ chối (thêm 2026-10-09, changelog 0555): `exhausted` = vượt
 * hạn mức thật; `unavailable` = production mà Redis không sẵn sàng/lỗi nên KHÔNG đếm được (vẫn
 * fail-closed — nơi gọi phải từ chối, nhưng nói đúng là "máy chủ tạm bận", không đổ cho người dùng
 * "nộp quá nhanh"). Các hàm boolean cũ giữ nguyên hành vi (gói lại hàm này).
 */
export type CounterStatus = 'ok' | 'exhausted' | 'unavailable'

/**
 * Như `consumeWindowCounter` nhưng trả ba trạng thái (xem `CounterStatus`). Dev/test không có
 * Redis vẫn dùng Map in-memory như cũ.
 */
export async function consumeWindowCounterStatus(
  key: string,
  limit: number,
  windowMs: number,
): Promise<CounterStatus> {
  if (limit <= 0) return 'exhausted'
  const redis = getRedis()
  if (redis && redis.status === 'ready') {
    try {
      const count = (await redis.eval(DAILY_COUNTER_LUA, 1, key, String(windowMs))) as number
      noteRedisRecovered()
      return count <= limit ? 'ok' : 'exhausted'
    } catch (err) {
      noteRedisDegraded(err)
    }
  }

  if (isProduction()) return 'unavailable'
  const now = Date.now()
  pruneDailyCounters(now)
  const entry = dailyCounterMap.get(key)
  if (!entry || now > entry.resetAt) {
    dailyCounterMap.set(key, { count: 1, resetAt: now + windowMs })
    return 'ok'
  }
  entry.count += 1
  return entry.count <= limit ? 'ok' : 'exhausted'
}

/**
 * Tăng bộ đếm `key` trong một cửa sổ `windowMs` (tính từ lượt ĐẦU, không gia hạn mỗi lần gọi);
 * trả `true` nếu VẪN trong hạn mức (đã tính lượt vừa dùng). Dùng chung cho hạn mức ngày của
 * khách và giới hạn thử sai theo TÀI KHOẢN (đăng nhập, mã 2FA — vá 2026-09-27).
 */
export async function consumeWindowCounter(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return (await consumeWindowCounterStatus(key, limit, windowMs)) === 'ok'
}

/** Tăng bộ đếm ngày của `key`; trả `true` nếu VẪN trong hạn mức (đã tính lượt vừa dùng). */
export async function consumeDailyCounter(key: string, limit: number): Promise<boolean> {
  return consumeWindowCounter(key, limit, DAY_MS)
}

/**
 * Xoá hẳn bộ đếm `key`, trả `true` nếu CHẮC CHẮN đã xoá ở kho dùng chung. `false` = production mà
 * Redis không sẵn sàng/lỗi (bản Map cục bộ vẫn được xoá nhưng không có tác dụng ở cụm) — nơi gọi
 * cần biết để ghi log vận hành (changelog 0555).
 */
export async function resetCounterChecked(key: string): Promise<boolean> {
  const redis = getRedis()
  if (redis && redis.status === 'ready') {
    try {
      await redis.del(key)
      return true
    } catch (err) {
      noteRedisDegraded(err)
    }
  }
  dailyCounterMap.delete(key)
  return !isProduction()
}

/** Xoá hẳn bộ đếm `key` (vd đăng nhập đúng thì xoá số lần thử). Nuốt mọi lỗi. */
export async function resetCounter(key: string): Promise<void> {
  await resetCounterChecked(key)
}

/** Trả lại 1 lượt đã trừ (nhà cung cấp lỗi). Nuốt mọi lỗi — không bao giờ làm vỡ luồng trả lỗi. */
export async function releaseDailyCounter(key: string): Promise<void> {
  const redis = getRedis()
  if (redis && redis.status === 'ready') {
    try {
      // Chỉ giảm khi key còn tồn tại: key đã hết hạn mà DECR sẽ tạo ra bộ đếm âm không hạn dùng.
      await redis.eval(
        `if redis.call('EXISTS', KEYS[1]) == 1 then redis.call('DECR', KEYS[1]) end`,
        1,
        key,
      )
      return
    } catch (err) {
      noteRedisDegraded(err)
    }
  }
  const entry = dailyCounterMap.get(key)
  if (entry && entry.count > 0) entry.count -= 1
}

// Phương án dự phòng: bộ đếm cửa sổ 60s trong bộ nhớ tiến trình (cơ chế cũ, giữ nguyên).
function checkRateLimitInMemory(key: string, maxPerMin: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    // Bắt đầu cửa sổ mới (1 phút)
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= maxPerMin) {
    return false // Đã vượt giới hạn
  }

  entry.count++
  return true
}

// ── Auth Validation ───────────────────────────────────────────────────────────
// [Cập nhật Bước 6, docs/adr/0002-quan-ly-nguoi-dung.md] Đọc session token TỪ COOKIE
// `session_token` (packages/core-auth/sessionCookie.ts) — Bearer đã bị bỏ hoàn toàn (trước đó
// dual-accept ở Bước 3). Client chỉ giữ cờ UI không bí mật; server bỏ qua Bearer.
// Tra bảng `sessions` trên Postgres tự host (Giai đoạn B — thay Supabase Auth) — trả về
// userId nếu hợp lệ + chưa hết hạn, null nếu không. Xem api/_lib/authService.ts.
//
// SKIP_AUTH=true chỉ dùng khi dev local (phòng khi client chưa gửi token).
// TUYỆT ĐỐI KHÔNG bật SKIP_AUTH trên production!
export async function validateAuth(req: Request): Promise<{ userId: string } | null> {
  // Bypass tạm thời cho môi trường dev — phải tắt trên production.
  // Kiểm tra CẢ NODE_ENV (dùng trên VPS/server.ts) và VERCEL_ENV (dùng trên Vercel):
  // chỉ cần 1 trong 2 báo "production" là khoá bypass lại ngay, không phụ thuộc đang
  // chạy trên nền tảng nào. Trên VPS, server.ts mặc định NODE_ENV='production' khi
  // không set gì — nếu chỉ kiểm tra VERCEL_ENV (luôn undefined trên VPS) thì bypass
  // sẽ vô tình LUÔN bật nếu quên xoá SKIP_AUTH=true trong .env production.
  if (
    process.env.SKIP_AUTH === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'production'
  ) {
    console.warn('[Security] SKIP_AUTH=true — CHỈ dùng trong dev, tắt trước khi deploy production!')
    return { userId: 'dev-skip-auth' }
  }

  const token = readSessionCookie(req) || ''
  if (!token) return null

  try {
    return await validateSessionToken(token)
  } catch {
    return null
  }
}

// ── Content-Type Validation ───────────────────────────────────────────────────
// Kiểm tra request có gửi đúng Content-Type: application/json không.
export function validateContentType(req: Request): boolean {
  const ct = req.headers.get('Content-Type') ?? ''
  return ct.includes('application/json')
}

// ── Security Event Logging ────────────────────────────────────────────────────
// Ghi log sự kiện bảo mật (rate limit bị vượt, auth thất bại, v.v.)
// Trong production nên gửi về dịch vụ log chuyên dụng (Datadog, Sentry...).
export function logSecurityEvent(
  type: string,
  clientIp: string,
  details: Record<string, unknown>,
): void {
  console.warn(`[Security][${type}] ip=${clientIp}`, JSON.stringify(details))
}

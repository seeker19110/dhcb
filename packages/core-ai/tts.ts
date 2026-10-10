// api/tts.ts — Vercel Edge Function / chạy qua server.ts (Express) khi deploy VPS
// Endpoint: POST /api/tts
// Body: { text: string, lang: 'en-US' | 'vi-VN', voice?: 'female' | 'female2' | 'male' | 'male2' }
// Trả về: { audio_url, key_b64, iv_b64, cached, viseme_timeline }
//   viseme_timeline: [{ viseme, startMs, endMs }] | null — mốc khẩu hình THẬT cho avatar nói
//   chuyện, chỉ có với giọng ElevenLabs (endpoint /with-timestamps). null = client tự ước lượng.
//
// Luồng xử lý:
//   1. Hash (text + lang + voice) → tìm trong bảng tts_cache (Postgres tự host)
//   2. Cache HIT → trả audio_url + khoá giải mã luôn, không tốn API
//   3. Cache MISS → gọi Google TTS → MÃ HÓA AES-256-GCM → lưu file qua saveAudio()
//      (local VPS hoặc Cloudflare R2 tùy STORAGE_DRIVER, xem api/_lib/fileStorage.ts)
//      → lưu DB → trả URL + khoá giải mã
//
// Chiến lược cache dùng chung: câu nào đã phát sinh 1 lần thì mọi user sau dùng lại,
// không tốn thêm tiền API nữa. Khác với api/pronunciation.ts (chỉ đọc 1 từ), endpoint
// này đọc cả câu/đoạn — dùng cho câu ví dụ, cụm từ, hội thoại trong Chat/Speaking.
//
// Bảo mật: file audio (bucket/thư mục "tts-cache") bị MÃ HÓA AES-256-GCM trước khi lưu —
// ai có link cũng không nghe được nếu không có khoá, và khoá chỉ phát cho request đi qua cửa
// resolveActor() ở dưới. [2026-09-15] Cửa đó nay nhận THÊM khách vãng lai (header X-Guest-Id,
// hạn mức dùng thử ở đường tạo audio mới) — vẫn không có đường nào lấy được file thô mà không
// qua endpoint này, nên mọi response thành công đều kèm khoá giải mã đúng như trước.
// Chi tiết suy khoá: xem api/_lib/ttsCrypto.ts.

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  generateAudioFromGoogle,
  generateStudioAudioFromGoogle,
  isValidVoice,
  isValidStudioVoice,
  DEFAULT_VOICE,
  VOICE_VERSION,
  type Lang,
  type VoiceId,
} from './googleTts.js'
import { generateAudioFromElevenLabs, isValidElevenVoice } from './elevenLabsTts.js'
import { generateAudioFromGemini, isValidGeminiVoice } from './geminiTts.js'
import { visemeTimelineFromAlignment, type VisemeFrame } from './visemeTimeline.js'
import { ensureProfileRow } from '@dhcb/core-auth/authService'
import { clampVoiceToPlan, type AnyVoiceId } from './voiceAccess.js'
import { saveAudio, isServableUrl } from './fileStorage.js'
import { recordTtsCacheEvent } from './ttsStats.js'
import { encryptAudio, getClientKeyMaterial } from './ttsCrypto.js'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateContentType,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { withConcurrencyLimit } from '@dhcb/core-db/concurrencyLimiter'
import { resolveActor } from '@dhcb/core-auth/guest'
import { checkAndConsumeGuestTrial, refundGuestTrial } from '@dhcb/core-auth/guestTrial'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { getAppSettings } from '@dhcb/core-db/settings'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const VALID_LANGS: Lang[] = ['en-US', 'vi-VN']

// Trần độ dài văn bản 1 lần đọc. Nội dung hợp lệ dài nhất của app (câu trả lời Chat/Speaking,
// câu ví dụ) đều dưới mức này rất xa; Google TTS cũng chỉ nhận ~5000 byte/lần. Chặn ở server
// để body 64KB không đẩy được chuỗi khổng lồ tới Google (tốn tiền theo ký tự) và trả 413 rõ
// ràng thay vì lỗi 500 từ Google.
const MAX_TTS_TEXT = 4000

function isValidLang(value: string): value is Lang {
  return VALID_LANGS.includes(value as Lang)
}

// ── Khoá "claim" chống race condition khi nhiều request cùng cache-miss 1 hash ──────────────
// Trước đây mỗi request cache-miss tự gọi Google TTS + mã hoá + lưu ĐỘC LẬP — nhiều request
// đồng thời cho CÙNG 1 câu vừa tốn tiền API lặp lại, vừa khiến (khoá, iv) suy ra từ hash trong
// ttsCrypto.ts bị dùng để mã hoá nhiều audio bytes khác nhau (tái sử dụng nonce — lỗi bảo mật
// AES-GCM). Bảng public.tts_cache_pending (migration 0031) dùng làm khoá: request nào INSERT
// thành công là "leader" (đi sinh audio), thua thì là "follower" (chờ rồi đọc lại tts_cache).
const TTS_CLAIM_STALE_MS = 30_000 // leader trước bị crash/treo giữa chừng -> coi khoá hết hạn
const TTS_CLAIM_POLL_MS = 300
const TTS_CLAIM_MAX_WAIT_MS = 20_000 // follower chờ quá lâu -> tự làm leader (fallback hiếm gặp)

type TtsClaim =
  | { role: 'leader' }
  | {
      role: 'cached'
      audioUrl: string
      visemeTimeline: VisemeFrame[] | null
      // iv của bản ghi (null = bản ghi trước migration 0038 → giải mã bằng iv suy từ hash).
      iv: string | null
    }

async function claimTtsGeneration(
  pool: ReturnType<typeof getPgPool>,
  hash: string,
): Promise<TtsClaim> {
  const deadline = Date.now() + TTS_CLAIM_MAX_WAIT_MS
  for (;;) {
    const { rows: claimedRows } = await pool.query<{ hash: string }>(
      `insert into public.tts_cache_pending (hash) values ($1)
       on conflict (hash) do nothing
       returning hash`,
      [hash],
    )
    if (claimedRows[0]) return { role: 'leader' }

    // Thua claim — người khác đang sinh audio (hoặc dòng khoá cũ bị treo do leader trước
    // crash giữa chừng, không kịp xoá). Kiểm tra tuổi dòng khoá để phân biệt 2 trường hợp.
    const { rows: pendingRows } = await pool.query<{ created_at: string }>(
      'select created_at from public.tts_cache_pending where hash = $1',
      [hash],
    )
    const pendingCreatedAt = pendingRows[0]?.created_at
    const pendingAgeMs = pendingCreatedAt
      ? Date.now() - new Date(pendingCreatedAt).getTime()
      : Infinity

    if (pendingAgeMs > TTS_CLAIM_STALE_MS) {
      // Khoá cũ đã hết hạn — dọn rồi vòng lặp tự thử claim lại (điều kiện created_at khớp
      // tránh xoá nhầm dòng khoá MỚI nếu có leader khác vừa claim lại đúng lúc).
      await pool
        .query('delete from public.tts_cache_pending where hash = $1 and created_at = $2', [
          hash,
          pendingCreatedAt,
        ])
        .catch((err: unknown) => console.warn('[tts] dọn khoá cache hết hạn lỗi:', err))
      continue
    }

    // Khoá còn hợp lệ — kiểm tra xem leader đã sinh xong audio chưa (có thể xong đúng lúc ta
    // vừa claim thua).
    const { rows: cachedRows } = await pool.query<{
      audio_url: string
      viseme_timeline: VisemeFrame[] | null
      iv: string | null
    }>('select audio_url, viseme_timeline, iv from public.tts_cache where hash = $1', [hash])
    // Cùng luật với BƯỚC 1: URL không phục vụ được (audio local chết ở chế độ R2) KHÔNG tính
    // là leader đã sinh xong — cứ chờ tiếp/tự làm leader để sinh lại.
    if (cachedRows[0]?.audio_url && isServableUrl(cachedRows[0].audio_url)) {
      return {
        role: 'cached',
        audioUrl: cachedRows[0].audio_url,
        visemeTimeline: cachedRows[0].viseme_timeline ?? null,
        iv: cachedRows[0].iv ?? null,
      }
    }

    if (Date.now() > deadline) {
      // Chờ quá lâu (leader bất thường chậm) — tự làm leader luôn thay vì bắt người dùng chờ
      // vô hạn. Chấp nhận rủi ro hiếm là sinh trùng audio 1 lần, còn hơn treo response.
      return { role: 'leader' }
    }
    await new Promise((resolve) => setTimeout(resolve, TTS_CLAIM_POLL_MS))
  }
}

const TtsBodySchema = z.object({
  text: z
    .string({ error: 'Thiếu text' })
    .trim()
    .min(1, 'Thiếu text')
    .refine((v) => v.length <= MAX_TTS_TEXT, {
      error: `Văn bản quá dài — tối đa ${MAX_TTS_TEXT} ký tự`,
      params: { status: 413 },
    }),
  lang: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : 'en-US'))
    .refine((v): v is Lang => isValidLang(v), {
      error: (ctx) => `lang không hợp lệ: ${ctx.input}`,
    }),
  voice: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : DEFAULT_VOICE))
    .refine(
      (v): v is AnyVoiceId =>
        isValidVoice(v) || isValidElevenVoice(v) || isValidStudioVoice(v) || isValidGeminiVoice(v),
      {
        error: (ctx) => `voice không hợp lệ: ${ctx.input}`,
      },
    ),
})

// Hash đơn giản dùng để tạo tên file + key tìm kiếm trong DB (KHÔNG phải khoá mã hóa —
// khoá mã hóa thật được suy ra riêng trong ttsCrypto.ts từ TTS_ENCRYPTION_MASTER_KEY).
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

// Đánh dấu "vừa được dùng" cho dòng cache — CHỈ ghi khi mốc cũ hơn 1 ngày (audit 2026-10-10,
// E2.4). Trước đây MỖI lượt trúng cache là một câu UPDATE (một lần ghi WAL + dòng chết chờ
// VACUUM) cho một cột chỉ dùng để thống kê theo ngày; độ phân giải 1 ngày là đủ.
export const TOUCH_TTS_CACHE_SQL = `update public.tts_cache set last_accessed_at = now()
  where hash = $1 and (last_accessed_at is null or last_accessed_at < now() - interval '1 day')`

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(req)
  const allHeaders = { ...corsHeaders, ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: allHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  }

  // Lấy IP để rate limit
  const clientIp = getClientIp(req)

  // Kiểm tra Content-Type
  if (!validateContentType(req)) {
    logSecurityEvent('INVALID_CONTENT_TYPE', clientIp, { path: '/api/tts' })
    return jsonResponse({ error: 'Content-Type phải là application/json' }, 415, allHeaders)
  }

  // Rate limit TỔNG: 60 request/phút mỗi IP. Phần lớn request là cache HIT (chỉ tra DB,
  // gần như miễn phí), nên hạn mức rộng để phát cả bài học / nghe nhiều câu liên tiếp
  // không bị chặn. Đường tạo audio mới (tốn tiền) có hạn mức riêng, chặt hơn ở BƯỚC 2.
  if (!(await checkRateLimit(clientIp, 60, 'tts'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/tts' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  // Bắt buộc có danh tính: tài khoản thật, hoặc KHÁCH VÃNG LAI
  // (docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md). Audio cache bị mã hoá và khoá
  // giải mã chỉ phát cho request đi qua cửa này — khách cũng vậy, không ai lấy được file thô.
  const actor = await resolveActor(req)
  if (!actor) {
    logSecurityEvent('AUTH_FAILED', clientIp, { path: '/api/tts' })
    return jsonResponse({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, 401, allHeaders)
  }

  const bodyResult = await readJsonBody(req)
  if (!bodyResult.ok) {
    return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
  }
  const parsed = validateBody(TtsBodySchema, bodyResult.raw)
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
  }

  const { text, lang } = parsed.data
  // Không tin voice client gửi lên — hạ về giọng cho phép đúng gói của user (fail-safe,
  // không lỗi cứng: UI đã tự ẩn lựa chọn ngoài quyền, nhánh này chỉ chặn gọi thẳng API).
  // Khách chưa có hàng nào trong `profiles` (và KHÔNG được tạo — họ không phải người dùng):
  // coi như gói 'free', tức chỉ được các giọng miễn phí. Quyền lợi giọng VIP vẫn do server
  // quyết định hoàn toàn, y như cũ.
  const plan = actor.kind === 'user' ? (await ensureProfileRow(actor.userId, '')).plan : 'free'
  let voice = await clampVoiceToPlan(parsed.data.voice, plan)

  // Studio CHỈ có tiếng Anh (Google không có giọng Studio cho vi-VN) — nếu lỡ nhận Studio
  // cho câu tiếng Việt (client fallback lỗi, hoặc gọi thẳng API), hạ về Chirp3-HD cùng giới
  // tính thay vì lỗi cứng, giống các nhánh fail-safe khác ở trên.
  const STUDIO_TO_CHIRP_FALLBACK: Partial<Record<AnyVoiceId, VoiceId>> = {
    'Studio-O': 'Kore',
    'Studio-Q': 'Puck',
  }
  if (lang !== 'en-US' && isValidStudioVoice(voice)) {
    voice = STUDIO_TO_CHIRP_FALLBACK[voice] ?? DEFAULT_VOICE
  }

  let pool
  try {
    pool = getPgPool()
  } catch (err) {
    console.error('[tts] Failed to initialize Postgres pool:', err)
    return jsonResponse({ error: 'Server configuration error' }, 500, allHeaders)
  }

  // ── BƯỚC 1: Kiểm tra cache ──────────────────────────────────────────────────
  // Khóa cache có kèm VOICE_VERSION → khi đổi giọng (đổi version), câu cũ không khớp
  // nữa nên sẽ tạo lại bằng giọng mới thay vì phát lại audio cũ.
  // Giọng ElevenLabs KHÔNG nhận tham số lang (audio giống hệt nhau bất kể lang — provider tự
  // nhận diện ngôn ngữ), nên bỏ `lang` khỏi hash để câu đọc bằng 2 lang khác nhau dùng chung
  // 1 cache thay vì tạo/lưu 2 file audio giống hệt nhau.
  // LƯU Ý: nối chuỗi trực tiếp (không delimiter) — GIỮ NGUYÊN có chủ đích, dù về lý thuyết có
  // thể nhầm ranh giới các phần. Đổi công thức hash sẽ làm TOÀN BỘ cache hiện có trên production
  // mất hiệu lực (hash cũ không khớp hash mới) và lệch với 2 script seed tính hash riêng
  // (scripts/seed-all.ts, scripts/prefetch-tts-patterns.ts) — cái giá đổi quá lớn so với rủi ro
  // va chạm gần như không thể xảy ra trong thực tế (voice/lang là enum cố định, không phải
  // input tự do). Nếu thật sự cần đổi, phải làm kèm migration remap hash (đã có sẵn
  // decryptAudio() để hỗ trợ remap, xem ttsCrypto.ts) và cập nhật ĐỒNG BỘ cả 2 script seed.
  const hashLangPart = isValidElevenVoice(voice) ? '' : lang
  const textHash = await hashText(text + hashLangPart + voice + VOICE_VERSION)

  const { rows: cachedRows } = await pool.query<{
    audio_url: string
    viseme_timeline: VisemeFrame[] | null
    iv: string | null
  }>('select audio_url, viseme_timeline, iv from public.tts_cache where hash = $1', [textHash])

  // isServableUrl: ở chế độ R2, dòng cache trỏ về /uploads/... (ghi từ thời STORAGE_DRIVER=local
  // hoặc từ nhánh fallback local đã bỏ) là audio CHẾT — coi như MISS để sinh lại và ghi đè bằng
  // URL R2 thật, thay vì trả URL 404 cho client mãi mãi. Xem fileStorage.ts.
  const cachedUrl = isServableUrl(cachedRows[0]?.audio_url) ? cachedRows[0]?.audio_url : undefined
  if (cachedUrl) {
    // Cập nhật last_accessed_at (bắn rồi quên — CHỈ để thống kê/theo dõi dung lượng, KHÔNG
    // dùng để tự động xoá — chính sách chốt 2026-08-06: cache không hết hạn theo mức dùng,
    // chỉ xoá orphan qua --clean-orphans, xem docs/migration-thoat-ly-supabase.md mục 3.3).
    // Không chặn response.
    void pool
      .query(TOUCH_TTS_CACHE_SQL, [textHash])
      .catch((err: unknown) => console.warn('[tts] cập nhật last_accessed_at lỗi:', err))
    recordTtsCacheEvent(pool, { lang, voice, hit: true })
    // iv của CHÍNH bản ghi này (null với bản ghi trước migration 0038 → rơi về iv suy từ hash).
    const { key_b64, iv_b64 } = await getClientKeyMaterial(textHash, cachedRows[0]?.iv)
    return jsonResponse(
      {
        audio_url: cachedUrl,
        key_b64,
        iv_b64,
        cached: true,
        // Giọng THẬT SỰ đã dùng (đã qua clampVoiceToPlan + hạ Studio cho tiếng Việt) — client
        // PHẢI dựa vào đây, không phải giọng nó gửi lên: khác nhau ở chỗ Gemini trả WAV còn
        // các provider khác trả mp3, đoán sai là gắn sai mimeType cho Blob (iOS/Safari không
        // phát được). Xem blobMimeTypeForVoice() trong apps/dhcb/src/lib/tts.ts.
        voice,
        // null với audio cũ (cache trước migration 0028) hoặc giọng không có timestamp —
        // client tự ước lượng như trước, không phải lỗi.
        viseme_timeline: cachedRows[0]?.viseme_timeline ?? null,
      },
      200,
      allHeaders,
    )
  }

  // ── BƯỚC 1.5: Giành quyền sinh audio cho hash này (chống race condition) ────────────────
  // Request khác đang/đã sinh xong audio cho CÙNG câu này → trả luôn kết quả cache, không
  // gọi Google TTS lần nữa.
  const claim = await claimTtsGeneration(pool, textHash)
  if (claim.role === 'cached') {
    void pool
      .query(TOUCH_TTS_CACHE_SQL, [textHash])
      .catch((err: unknown) => console.warn('[tts] cập nhật last_accessed_at lỗi:', err))
    // Vẫn tính là HIT: request này KHÔNG gọi API TTS (một request khác đã sinh xong hộ).
    recordTtsCacheEvent(pool, { lang, voice, hit: true })
    const { key_b64, iv_b64 } = await getClientKeyMaterial(textHash, claim.iv)
    return jsonResponse(
      {
        audio_url: claim.audioUrl,
        key_b64,
        iv_b64,
        cached: true,
        viseme_timeline: claim.visemeTimeline,
        voice,
      },
      200,
      allHeaders,
    )
  }

  // Từ đây là "leader" — PHẢI xoá dòng khoá tts_cache_pending dù thành công hay lỗi, không
  // thì các request khác cho cùng câu này bị chặn tới khi hết hạn TTS_CLAIM_STALE_MS.
  let chargedDay: string | null = null
  let guestCharged = false
  let providerStarted = false
  // Provider từ chối vì HẾT QUOTA (429/RESOURCE_EXHAUSTED) — không sinh ra audio nào, nhà cung cấp
  // cũng không tính tiền lần gọi bị từ chối. Hoàn lượt dù provider đã được gọi: nếu không, lúc
  // Google cạn quota mỗi câu mới vẫn trừ 1 lượt/ngày trong khi người dùng chỉ nghe giọng trình
  // duyệt (fallback), và có thể cạn sạch lượt mà không nhận được gì.
  let providerQuotaExhausted = false
  const runProvider = <T>(key: string, generate: () => Promise<T>) =>
    withConcurrencyLimit(key, () => {
      providerStarted = true
      return generate()
    })
  try {
    // ── BƯỚC 2: Cache MISS → gọi Google TTS ──────────────────────────────────
    // Bộ đếm RIÊNG cho đường tạo audio mới (tốn tiền API): 60 lần/phút mỗi IP.
    // Mục đích của việc TÁCH bucket (không phải đặt hạn mức thấp hơn): cách ly đường tốn
    // tiền khỏi lưu lượng cache HIT (gần như miễn phí) — nhờ đó phát cả bài học đã cache
    // hay tra nhiều từ vẫn mượt, mà mỗi IP không thể tạo quá 60 audio MỚI/phút (chặn vòng
    // lặp lỗi làm cháy hạn mức Google TTS). Giữ 60 để lần đầu "Phát tất cả" một bài học
    // chưa cache (chế độ EN+VI ~16 câu × 2 giọng) không bị chặn giữa chừng.
    if (!(await checkRateLimit(clientIp, 60, 'tts-gen'))) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/tts', stage: 'generate' })
      return jsonResponse(
        { error: 'Quá nhiều yêu cầu tạo audio mới — thử lại sau 1 phút' },
        429,
        allHeaders,
      )
    }

    // KHÁCH: hạn mức dùng thử chỉ tính ở ĐÂY — đường TẠO audio mới (tốn tiền Google/ElevenLabs).
    // Cache HIT đã thoát ở BƯỚC 1 nên khách vẫn nghe thoải mái câu đã có sẵn trong kho: đó là
    // thứ làm nội dung bài học đọc được mà không tốn thêm một đồng nào.
    if (actor.kind === 'guest') {
      // Khách cũng phải tôn trọng cầu dao AI; không dùng mặc định khi DB cấu hình lỗi.
      try {
        if ((await getAppSettings({ requireAvailable: true })).aiCircuitBreaker) {
          return jsonResponse({ error: 'Dịch vụ AI tạm dừng — thử lại sau.' }, 503, allHeaders)
        }
      } catch {
        return jsonResponse({ error: 'Dịch vụ AI tạm dừng — thử lại sau.' }, 503, allHeaders)
      }
      const guestGate = await checkAndConsumeGuestTrial(actor.guestKey, clientIp)
      if (!guestGate.ok) {
        logSecurityEvent('USAGE_LIMIT', clientIp, { path: '/api/tts', stage: 'generate' })
        return jsonResponse(
          { error: guestGate.message, guestTrialExhausted: true },
          429,
          allHeaders,
        )
      }
      guestCharged = true
    } else {
      // Audio MỚI tính vào cùng ngân sách AI/ngày với speaking; cache HIT không bị trừ.
      const gate = await checkAndConsumeUsage(actor.userId, 'speaking')
      if (!gate.ok) {
        return jsonResponse({ error: gate.message }, 429, allHeaders)
      }
      chargedDay = gate.day
    }

    // Giọng ElevenLabs (VIP) dùng provider khác hẳn Google — text đọc y nguyên, provider
    // tự nhận diện ngôn ngữ qua model đa ngôn ngữ nên không cần truyền `lang`. Giọng Studio
    // vẫn là Google Cloud TTS nhưng lang luôn 'en-US' (đã clamp ở trên).
    const providerLabel = isValidElevenVoice(voice)
      ? 'ElevenLabs'
      : isValidGeminiVoice(voice)
        ? 'Gemini'
        : isValidStudioVoice(voice)
          ? 'Google Studio'
          : 'Google'

    let audioData: ArrayBuffer
    // Timeline khẩu hình THẬT — chỉ có với giọng ElevenLabs (endpoint /with-timestamps trả mốc
    // thời gian từng ký tự). Giọng Google Chirp3-HD không hỗ trợ SSML nên không có timepoint;
    // những giọng đó giữ nguyên cách client tự ước lượng.
    let visemeTimeline: VisemeFrame[] | null = null
    try {
      if (isValidElevenVoice(voice)) {
        const result = await runProvider('elevenlabs', () =>
          generateAudioFromElevenLabs(text, voice),
        )
        audioData = result.audio
        if (result.alignment) {
          // Dựng timeline KHÔNG được phép làm hỏng việc tạo audio: eSpeak-ng có thể chưa cài trên
          // VPS, hoặc số token phoneme không khớp số từ. Lỗi ở đây chỉ mất phần đồng bộ khẩu hình.
          visemeTimeline = await visemeTimelineFromAlignment(result.alignment, lang).catch(
            (err: unknown) => {
              console.warn('[tts] Dựng viseme timeline lỗi, bỏ qua:', err)
              return null
            },
          )
        }
      } else if (isValidGeminiVoice(voice)) {
        audioData = await runProvider('gemini-tts', () => generateAudioFromGemini(text, voice))
      } else if (isValidStudioVoice(voice)) {
        audioData = await runProvider('google-tts-studio', () =>
          generateStudioAudioFromGoogle(text, voice),
        )
      } else {
        audioData = await runProvider('google-tts', () =>
          generateAudioFromGoogle(text, voice, lang),
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // 429 = hết quota Google TTS. Đây là tình huống VẬN HÀNH (cần nâng quota/bật billing),
      // không phải bug code → log GỌN 1 dòng (tránh spam stack trace), trả 503 + Retry-After
      // để client biết tạm thời và tự fallback sang Web Speech. Lỗi khác mới log full + 500.
      const isQuota = /\(429\)|RESOURCE_EXHAUSTED|quota/i.test(msg)
      if (isQuota) {
        providerQuotaExhausted = true
        console.warn('[tts] Google TTS hết quota (429) — client sẽ fallback Web Speech')
        return jsonResponse(
          { error: 'Dịch vụ giọng đọc tạm quá tải — thử lại sau', fallback: true },
          503,
          {
            ...allHeaders,
            'Retry-After': '60',
          },
        )
      }
      console.error(`[tts] ${providerLabel} TTS generation failed:`, err)
      return jsonResponse({ error: 'Không thể tạo audio — thử lại sau' }, 500, allHeaders)
    }

    // ── BƯỚC 3: Mã hóa AES-256-GCM rồi lưu file (local VPS hoặc Cloudflare R2 tùy
    // STORAGE_DRIVER) ── Mã hóa TRƯỚC khi lưu — file luôn là ciphertext, không phải mp3 gốc.
    // An toàn với nonce AES-GCM: nhờ claimTtsGeneration() ở trên, chỉ 1 request (leader)
    // encryptAudio() cho mỗi hash — không còn 2 request đồng thời mã hoá 2 audio bytes khác
    // nhau bằng cùng 1 (khoá, iv) suy ra từ hash.
    const { cipher: encryptedData, iv_b64: storedIvB64 } = await encryptAudio(audioData, textHash)
    // Giọng Gemini trả WAV thật (không phải mp3 như các provider khác — xem geminiTts.ts),
    // đặt đúng đuôi file cho dễ debug; nội dung đã bị mã hoá nên đuôi file không ảnh hưởng
    // việc phát (client tự khai mimeType đúng khi tạo Blob, xem blobMimeTypeForVoice() phía
    // apps/dhcb/src/lib/tts.ts).
    const ext = isValidGeminiVoice(voice) ? 'wav' : 'mp3'
    const fileName = `${lang}/${voice}/${textHash}.${ext}`
    const origin = req.headers.get('origin') || ''

    let audioUrl: string
    try {
      audioUrl = await saveAudio('tts-cache', fileName, encryptedData, origin)
    } catch (err) {
      console.error('[tts] Audio save failed:', err)
      return jsonResponse({ error: 'Không thể lưu audio — thử lại sau' }, 500, allHeaders)
    }

    // ── BƯỚC 4: Lưu vào DB ───────────────────────────────────────────────────
    try {
      await pool.query(
        `insert into public.tts_cache (hash, lang, voice, audio_url, viseme_timeline, iv, last_accessed_at)
         values ($1, $2, $3, $4, $5, $6, now())
         on conflict (hash) do update set
           lang = excluded.lang, voice = excluded.voice, audio_url = excluded.audio_url,
           viseme_timeline = excluded.viseme_timeline, iv = excluded.iv,
           last_accessed_at = now()`,
        [
          textHash,
          lang,
          voice,
          audioUrl,
          visemeTimeline ? JSON.stringify(visemeTimeline) : null,
          storedIvB64,
        ],
      )
    } catch (err) {
      // Audio ĐÃ tạo + lưu file thành công (không mất tiền), chỉ mất bản ghi cache — lần sau
      // gọi lại câu này sẽ cache-miss và tốn phí Google TTS lần nữa. Log kèm hash để dò khi
      // có nhiều lỗi liên tiếp (nghi Postgres có sự cố) thay vì chỉ 1 dòng chung chung.
      console.error(
        `[tts] Lỗi lưu tts_cache (hash=${textHash}):`,
        err instanceof Error ? err.message : err,
      )
    }

    // MISS: đã thực sự gọi API TTS sinh audio mới → tốn tiền. Ghi sau khi lưu file/DB xong để
    // không đếm nhầm những lần sinh thất bại (đường lỗi đã return trước khi tới đây).
    recordTtsCacheEvent(pool, { lang, voice, hit: false })
    const { key_b64, iv_b64 } = await getClientKeyMaterial(textHash, storedIvB64)
    return jsonResponse(
      {
        audio_url: audioUrl,
        key_b64,
        iv_b64,
        cached: false,
        viseme_timeline: visemeTimeline,
        voice,
      },
      200,
      allHeaders,
    )
  } finally {
    // Hoàn khi CHƯA gọi provider, hoặc provider từ chối vì hết quota (không có audio, không tốn
    // tiền). Lỗi lưu file/DB, lỗi provider khác hoặc ngắt client KHÔNG hoàn — không tạo lượt miễn phí.
    if (!providerStarted || providerQuotaExhausted) {
      if (actor.kind === 'user' && chargedDay !== null) {
        await refundUsage(actor.userId, 'speaking', chargedDay).catch(() => {})
      } else if (actor.kind === 'guest' && guestCharged) {
        await refundGuestTrial(actor.guestKey, clientIp).catch(() => {})
      }
    }
    await pool
      .query('delete from public.tts_cache_pending where hash = $1', [textHash])
      .catch((err: unknown) => console.warn('[tts] xoá khoá tts_cache_pending lỗi:', err))
  }
}

export const config = { runtime: 'edge' }

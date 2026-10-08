// src/lib/voiceTiers.ts — Danh sách giọng Chirp3-HD + gói nào được dùng giọng nào.
// PHẢI khớp tay với api/_lib/googleTts.ts (VOICE_IDS) — dự án không share code giữa
// api/ và src/ (2 tsconfig riêng), nên đổi 1 bên phải đổi bên kia.
import type { Plan } from '../types'
import { effectivePlan } from './promo'

export type VoiceId =
  | 'Kore'
  | 'Aoede'
  | 'Leda'
  | 'Zephyr'
  | 'Autonoe'
  | 'Callirrhoe'
  | 'Vindemiatrix'
  | 'Puck'
  | 'Charon'
  | 'Fenrir'
  | 'Orus'
  | 'Algieba'
  | 'Iapetus'
  | 'Umbriel'
  // Giọng ElevenLabs riêng, chỉ VIP — khác hẳn 14 giọng Chirp3-HD (Google) ở trên. PHẢI khớp
  // tay với ELEVEN_VOICES trong packages/core-ai/elevenLabsTts.ts (nữ trước, nam sau).
  | 'Rachel'
  | 'Alice'
  | 'Matilda'
  | 'Eric'
  | 'Daniel'
  | 'Chris'
  // Giọng "Studio" cao cấp (Pro/VIP) — vẫn là Google Cloud TTS như Chirp3-HD, nhưng
  // CHỈ có cho tiếng Anh (en-US) — Google không có Studio cho tiếng Việt. Xem
  // STUDIO_VOICE_IDS bên dưới + STUDIO_TO_CHIRP_FALLBACK trong lib/tts.ts (đổi về
  // giọng Chirp3-HD cùng giới tính nếu lỡ dùng cho câu tiếng Việt) + api/_lib/googleTts.ts.
  | 'Studio-O'
  | 'Studio-Q'
  // Giọng Gemini (native audio) — CHỈ dùng cho trang đọc truyện (StoryReader.tsx qua
  // getStoryVoice()), mỗi thể loại truyện 1 giọng cố định kèm phong cách đọc riêng. Khác
  // hẳn engine Chirp3-HD dù trùng tên nhân vật thần thoại — xem packages/core-ai/geminiTts.ts.
  | 'Gemini-Leda'
  | 'Gemini-Charon'
  | 'Gemini-Aoede'
  | 'Gemini-Orus'
  | 'Gemini-Puck'
  | 'Gemini-Kore'

export interface VoiceOption {
  id: VoiceId
  gender: 'female' | 'male'
}

// Thứ tự cố định: 7 giọng nữ trước, 7 giọng nam sau.
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Kore', gender: 'female' },
  { id: 'Aoede', gender: 'female' },
  { id: 'Leda', gender: 'female' },
  { id: 'Zephyr', gender: 'female' },
  { id: 'Autonoe', gender: 'female' },
  { id: 'Callirrhoe', gender: 'female' },
  { id: 'Vindemiatrix', gender: 'female' },
  { id: 'Puck', gender: 'male' },
  { id: 'Charon', gender: 'male' },
  { id: 'Fenrir', gender: 'male' },
  { id: 'Orus', gender: 'male' },
  { id: 'Algieba', gender: 'male' },
  { id: 'Iapetus', gender: 'male' },
  { id: 'Umbriel', gender: 'male' },
  // Giọng ElevenLabs riêng — chỉ mở cho VIP (xem VOICE_TIERS bên dưới), không nằm trong
  // DEFAULT_SEED_VOICE_IDS nên luôn tạo động ở lần phát đầu tiên (chậm hơn 1 chút).
  { id: 'Rachel', gender: 'female' },
  { id: 'Alice', gender: 'female' },
  { id: 'Matilda', gender: 'female' },
  { id: 'Eric', gender: 'male' },
  { id: 'Daniel', gender: 'male' },
  { id: 'Chris', gender: 'male' },
  // Giọng Studio cao cấp (Pro/VIP) — CHỈ tiếng Anh, xem ghi chú ở VoiceId union phía trên.
  // Không nằm trong DEFAULT_SEED_VOICE_IDS → tạo động ở lần phát đầu tiên (chậm hơn 1 chút).
  { id: 'Studio-O', gender: 'female' },
  { id: 'Studio-Q', gender: 'male' },
]

// Giọng riêng ElevenLabs (khác nhóm Chirp3-HD/Google phía trên) — dùng để UI có thể gắn
// nhãn/badge riêng nếu cần. PHẢI khớp ELEVEN_VOICE_IDS ở packages/core-ai/elevenLabsTts.ts.
export const ELEVEN_VOICE_IDS: VoiceId[] = ['Rachel', 'Alice', 'Matilda', 'Eric', 'Daniel', 'Chris']

// Giọng Studio (Google Cloud TTS cao cấp, CHỈ tiếng Anh) — dùng để UI gắn badge riêng +
// lib/tts.ts biết đường fallback về Chirp3-HD khi phát nội dung tiếng Việt.
export const STUDIO_VOICE_IDS: VoiceId[] = ['Studio-O', 'Studio-Q']

// Giọng Gemini — KHÔNG nằm trong VOICE_OPTIONS/VOICE_IDS (không phải lựa chọn tự do trong
// VoicePicker), chỉ StoryReader.tsx gán trực tiếp theo thể loại truyện (xem lib/stories.ts).
// CÓ nằm trong VOICE_TIERS (pro/vip) để client biết gói nào phải hạ giọng — xem getStoryVoice.
export const GEMINI_VOICE_IDS: VoiceId[] = [
  'Gemini-Leda',
  'Gemini-Charon',
  'Gemini-Aoede',
  'Gemini-Orus',
  'Gemini-Puck',
  'Gemini-Kore',
]

export const VOICE_IDS: VoiceId[] = VOICE_OPTIONS.map((v) => v.id)
export const DEFAULT_VOICE: VoiceId = 'Kore'
export const DEFAULT_MALE_VOICE: VoiceId = 'Puck'

export function isValidVoiceId(value: string): value is VoiceId {
  return (VOICE_IDS as string[]).includes(value)
}

// Như isValidVoiceId nhưng CHẤP NHẬN cả giọng Gemini (đọc truyện) — dùng khi đọc `voice`
// server trả về, vì /api/tts có thể trả giọng Gemini (StoryReader) chứ không chỉ giọng
// nằm trong VoicePicker.
export function isKnownVoiceId(value: string): value is VoiceId {
  return isValidVoiceId(value) || (GEMINI_VOICE_IDS as string[]).includes(value)
}

// Giọng Gemini "Gemini-Leda" dùng lại đúng tên nhân vật của Chirp3-HD ("Leda") — map về
// giọng Chirp3-HD tương ứng để biết giới tính và để hạ giọng khi gói chưa mở Gemini.
function geminiBaseVoice(voice: VoiceId): VoiceId | undefined {
  if (!(GEMINI_VOICE_IDS as string[]).includes(voice)) return undefined
  const base = voice.slice('Gemini-'.length)
  return isValidVoiceId(base) ? base : undefined
}

// Giới tính của MỌI giọng, kể cả giọng Gemini (không nằm trong VOICE_OPTIONS).
export function voiceGender(voice: VoiceId): 'female' | 'male' {
  const base = geminiBaseVoice(voice) ?? voice
  return VOICE_OPTIONS.find((v) => v.id === base)?.gender ?? 'female'
}

// Giọng mặc định THEO GIỚI TÍNH — dùng khi phải hạ giọng ngoài quyền gói. Trước đây mọi
// nhánh hạ giọng đều về DEFAULT_VOICE ('Kore', nữ), nên user đang nghe giọng NAM mà hết hạn
// gói sẽ đột ngột nghe giọng nữ (khó chịu, tưởng app hỏng). Giữ nguyên giới tính là ít bất
// ngờ nhất. PHẢI khớp defaultVoiceForGender() trong api/_lib/voiceAccess.ts.
export function defaultVoiceForGender(gender: 'female' | 'male'): VoiceId {
  return gender === 'male' ? DEFAULT_MALE_VOICE : DEFAULT_VOICE
}

// 4 giọng nữ + 4 giọng nam PHỔ BIẾN NHẤT, phong cách khác nhau — seed sẵn TRƯỚC (script
// seed-all.ts/seed-pronunciations.ts, PHẢI khớp tay với DEFAULT_SEED_VOICE_IDS trong
// api/_lib/googleTts.ts) nên phát ngay lập tức; hiện TRƯỚC cho người dùng chọn/xoay vòng
// (VoicePicker.tsx, WordVoiceCycleButton.tsx). 6 giọng còn lại vẫn dùng được bình thường,
// chỉ tự tạo audio (chậm hơn 1 chút) ở lần phát đầu khi người dùng CHỦ ĐỘNG chọn.
export const DEFAULT_SEED_VOICE_IDS: VoiceId[] = [
  'Kore',
  'Aoede',
  'Leda',
  'Zephyr',
  'Puck',
  'Charon',
  'Fenrir',
  'Orus',
]

// Gói nào được dùng giọng nào NGOÀI thời gian khuyến mãi.
// PHẢI KHỚP TAY với VOICE_TIERS trong api/_lib/voiceAccess.ts (server là nguồn sự thật —
// lệch nhau thì UI cho chọn giọng mà server âm thầm hạ về DEFAULT_VOICE).
//
// Free: 4 giọng (2 nữ Kore/Aoede + 2 nam Puck/Charon), đều đã seed sẵn nên phát ngay.
// Pro: đúng 8 giọng đã seed sẵn + 6 giọng Gemini (đọc truyện).
// VIP: tất cả (14 Chirp3-HD + ElevenLabs + 2 Studio, VOICE_IDS liệt kê đủ) + 6 giọng Gemini.
//
// Quyết định 2026-07-27: giọng Studio chuyển từ Pro/VIP sang CHỈ VIP (chi phí Studio
// $24/1 triệu ký tự và không có hạn mức miễn phí, đắt gấp 12 lần Chirp3-HD $2).
// Xuất ra để test đối chiếu tự động với bảng bên server (api/_lib/voiceTierParity.test.ts) —
// trước đây chỉ có ghi chú "PHẢI khớp tay", không có gì chặn khi lệch.
export const VOICE_TIERS: Record<Plan, VoiceId[]> = {
  free: ['Kore', 'Aoede', 'Puck', 'Charon'],
  // Giọng Gemini (đọc truyện) mở cho VIP, ĐÚNG như bảng server. Chúng KHÔNG hiện trong
  // VoicePicker vì mọi nơi chọn giọng đều lọc theo VOICE_OPTIONS (không chứa Gemini) — có mặt
  // ở đây chỉ để client biết gói nào được giữ giọng Gemini, gói nào phải hạ (getStoryVoice).
  vip: [...VOICE_IDS, ...GEMINI_VOICE_IDS],
}

// Đang trong giai đoạn khuyến mãi ra mắt hay không — xem src/lib/promo.ts.
export { isFullAccessPromoActive as isVoicePromoActive } from './promo'

// Bộ giọng cấp cho gói Free TRONG LÚC KHUYẾN MÃI — CỐ Ý không phải bộ VIP đầy đủ.
// GĐ1 2026-09-12 xoá gói Pro nên `effectivePlan()` nâng Free thẳng lên VIP khi tính HẠN MỨC.
// Nhưng quyền GIỌNG thì không được nâng theo: giọng Studio giá $24/1 triệu ký tự, không có
// hạn mức miễn phí (đắt gấp 12 lần Chirp3-HD) — mở cho toàn bộ người dùng Free trong một đợt
// khuyến mãi là rủi ro chi phí thật. Bộ này giữ ĐÚNG danh sách mà Free từng được nâng lên
// trước GĐ1, nên hành vi/chi phí không đổi. PHẢI khớp packages/core-ai/voiceAccess.ts.
const PROMO_FREE_VOICES: VoiceId[] = [...DEFAULT_SEED_VOICE_IDS, ...GEMINI_VOICE_IDS]

// Danh sách giọng user THỰC SỰ được chọn ngay bây giờ (đã áp khuyến mãi nếu còn hiệu lực).
export function getAllowedVoices(plan: Plan, now: Date = new Date()): VoiceId[] {
  if (plan === 'free' && effectivePlan(plan, now) !== 'free') return PROMO_FREE_VOICES
  return VOICE_TIERS[plan]
}

// Hạ 1 giọng bất kỳ về giọng gói hiện tại THỰC SỰ dùng được, giữ nguyên giới tính:
//   giọng đã được phép        → giữ nguyên
//   giọng Gemini chưa mở khoá → giọng Chirp3-HD cùng tên (Gemini-Leda → Leda) nếu được phép
//   còn lại                   → giọng mặc định cùng giới tính (Kore / Puck)
// Dùng cho MỌI nơi client phải tự đoán giọng trước khi gọi server, để nhãn hiển thị khớp
// giọng server thật sự phát (server clamp lại y hệt — xem api/_lib/voiceAccess.ts).
export function clampVoiceToAllowed(voice: VoiceId, allowed: VoiceId[]): VoiceId {
  const set = new Set(allowed)
  if (set.has(voice)) return voice
  const base = geminiBaseVoice(voice)
  if (base && set.has(base)) return base
  const fallback = defaultVoiceForGender(voiceGender(voice))
  return set.has(fallback) ? fallback : (allowed[0] ?? DEFAULT_VOICE)
}

// Chọn NGẪU NHIÊN 1 giọng thuộc đúng giới tính, chỉ trong số giọng gói hiện tại được dùng
// (server sẽ clamp về giọng hợp lệ nếu client lỡ gửi giọng ngoài quyền — xem
// api/_lib/voiceAccess.ts — nhưng random ngay trong danh sách allowed để UI hiển thị đúng
// giọng thực sự phát ra). Dùng cho màn hội thoại 2 nhân vật (DialogueView/LessonView) để mỗi
// lần mở nghe được giọng khác nhau, giúp người dùng thử nhiều giọng rồi chọn giọng ưng ý làm
// mặc định (setVoicePref) thay vì luôn cố định 1 giọng như trước.
export function pickRandomVoice(
  gender: 'female' | 'male',
  plan: Plan,
  now: Date = new Date(),
): VoiceId {
  const allowed = new Set(getAllowedVoices(plan, now))
  // Bỏ giọng không bao giờ tự nhảy vào bể random (Studio/ElevenLabs — xem
  // RANDOM_EXCLUDED_VOICES), giống mọi đường random khác.
  const byGender = VOICE_OPTIONS.filter(
    (v) => v.gender === gender && !RANDOM_EXCLUDED_VOICES.has(v.id),
  )
  const candidates = byGender.filter((v) => allowed.has(v.id))
  const pool = candidates.length > 0 ? candidates : byGender
  return pool[Math.floor(Math.random() * pool.length)]!.id
}

// ── Cache "giọng gói hiện tại cho phép" ─────────────────────────────────────
// lib/tts.ts (chế độ giọng ngẫu nhiên toàn cục) không biết `plan` thật của user — chỉ
// AuthProvider mới biết sau khi đăng nhập. Nên AuthProvider ghi cache này mỗi khi có user,
// còn tts.ts chỉ ĐỌC để random trong đúng phạm vi gói, tránh random ra giọng rồi bị server
// clamp âm thầm về DEFAULT_VOICE (clampVoiceToPlan, api/_lib/voiceAccess.ts).
const ALLOWED_CACHE_KEY = 'voice_allowed_cache'
// Gói Free — an toàn trước khi có cache. PHẢI khớp VOICE_TIERS.free ở trên.
const SAFE_DEFAULT_ALLOWED: VoiceId[] = ['Kore', 'Aoede', 'Puck', 'Charon']

export function cacheAllowedVoices(plan: Plan, now: Date = new Date()): void {
  localStorage.setItem(ALLOWED_CACHE_KEY, JSON.stringify(getAllowedVoices(plan, now)))
}

export function getCachedAllowedVoices(): VoiceId[] {
  try {
    const raw = localStorage.getItem(ALLOWED_CACHE_KEY)
    if (!raw) return SAFE_DEFAULT_ALLOWED
    const arr: unknown = JSON.parse(raw)
    return Array.isArray(arr) && arr.every((v) => isKnownVoiceId(String(v)))
      ? (arr as VoiceId[])
      : SAFE_DEFAULT_ALLOWED
  } catch {
    return SAFE_DEFAULT_ALLOWED
  }
}

// Bốc NGẪU NHIÊN 1 giọng trong số giọng gói hiện tại cho phép, TRỘN CẢ NAM LẪN NỮ (khác
// pickRandomVoice() ở trên — hàm đó random NHƯNG giữ cố định 1 giới tính). Dùng cho nút loa
// Từ điển/flashcard (PronounceButton, WordVoiceCycleButton) khi bật chế độ "mỗi lần bấm 1
// giọng khác" (quyết định 2026-07-29).
//
// LOẠI giọng ElevenLabs khỏi bể random: 2 nút này gọi /api/pronunciation (tra 1 từ), endpoint
// đó KHÔNG hỗ trợ ElevenLabs (chỉ dành cho câu/đoạn ở /api/tts — xem api/pronunciation.ts).
// Nếu random ra Rachel, request sẽ bị server trả 400 rồi âm thầm fallback Web Speech (giọng
// trình duyệt chất lượng thấp hơn) — bug thật đã gặp với user gói VIP.
// LOẠI giọng Studio khỏi MỌI bể random (quyết định 2026-08-10): Studio giá $24/1 triệu ký tự
// và KHÔNG có hạn mức miễn phí — đắt gấp 12 lần Chirp3-HD ($2, có 1 triệu ký tự miễn phí).
// Để Studio trong bể random nghĩa là user VIP vô tình đẩy chi phí lên gấp 12 mà không hề chọn.
// Studio vẫn dùng bình thường khi người dùng CHỦ ĐỘNG chọn ở Cài đặt (VoicePicker) — chỉ không
// bao giờ tự nhảy vào. Ngoài ra Google không có Studio cho vi-VN nên ở chiều B nó còn bị server
// hạ về Kore/Puck (api/pronunciation.ts), làm lệch xác suất và tốn thêm 1 lượt gọi API vô ích.
//
// TRÁNH LẶP giọng vừa phát (`exclude`): random đều có thể bốc lại đúng giọng cũ — gói Free chỉ
// 4 giọng nên 25% lần bấm nghe y hệt, khiến người dùng tưởng random không chạy. Chỉ loại khi
// bể còn ≥ 2 giọng (không thì không còn gì để bốc).
// Giọng KHÔNG BAO GIỜ tự nhảy vào bể random (vẫn chọn tay được ở Cài đặt): ElevenLabs
// (/api/pronunciation không hỗ trợ) + Studio (đắt gấp 12 lần, chỉ tiếng Anh).
export const RANDOM_EXCLUDED_VOICES: ReadonlySet<VoiceId> = new Set<VoiceId>([
  ...ELEVEN_VOICE_IDS,
  ...STUDIO_VOICE_IDS,
])
const ALLOWED_VOICE_POOL_EXCLUDING_ELEVEN = VOICE_IDS.filter((v) => !RANDOM_EXCLUDED_VOICES.has(v))
export function pickRandomAllowedVoice(
  options: {
    lang?: 'en-US' | 'vi-VN'
    exclude?: VoiceId
  } = {},
): VoiceId {
  // `lang` không còn dùng để lọc Studio (Studio đã bị loại khỏi bể random ở MỌI ngôn ngữ,
  // xem ghi chú phía trên) — giữ lại tham số vì nơi gọi vẫn truyền, và để dành cho các quy
  // tắc lọc theo ngôn ngữ về sau.
  const { exclude } = options
  const usable = (v: VoiceId) => !RANDOM_EXCLUDED_VOICES.has(v)
  const allowed = getCachedAllowedVoices().filter(usable)
  const basePool = allowed.length > 0 ? allowed : ALLOWED_VOICE_POOL_EXCLUDING_ELEVEN.filter(usable)
  const withoutCurrent = basePool.filter((v) => v !== exclude)
  const pool = withoutCurrent.length > 0 ? withoutCurrent : basePool
  return pool[Math.floor(Math.random() * pool.length)]!
}

// Danh sách giọng cần NẠP TRƯỚC cho chế độ offline: TẤT CẢ giọng gói hiện tại được phép
// dùng (Free 4 · Pro 8 · VIP 17), lọc theo ngôn ngữ sẽ đọc. Khác pickRandomAllowedVoice():
// hàm đó bốc 1 giọng cho nút loa (/api/pronunciation, không hỗ trợ ElevenLabs), còn preload
// đi qua /api/tts nên GIỮ luôn ElevenLabs. Studio chỉ có tiếng Anh nên loại khi lang khác.
// Lý do phải nạp mọi giọng: khoá cache audio gồm cả voice — chế độ "giọng ngẫu nhiên" bốc
// giọng mới mỗi phiên/tab, nên chỉ nạp 1 giọng thì lần offline sau gần như chắc chắn trượt
// cache và không nghe được gì (đúng lỗi "tải trước không hoạt động").
// `keep`: giọng người dùng đang CHỌN TAY — luôn nạp kể cả khi nằm trong nhóm bị loại khỏi bể
// random (Studio/ElevenLabs), vì đó chính là giọng sẽ phát khi tắt chế độ ngẫu nhiên.
export function getPreloadVoices(lang: 'en-US' | 'vi-VN' = 'en-US', keep?: VoiceId): VoiceId[] {
  const studio = new Set(STUDIO_VOICE_IDS)
  const allowed = getCachedAllowedVoices()
    // Studio chỉ có tiếng Anh — nạp cho vi-VN là gọi API vô ích (server hạ về Chirp3-HD).
    .filter((v) => lang === 'en-US' || !studio.has(v))
    // Giọng không bao giờ tự nhảy vào bể random thì cũng không cần nạp trước hàng loạt —
    // nạp Studio là tốn tiền thật ($24/1 triệu ký tự) cho audio gần như chắc chắn không dùng.
    .filter((v) => !RANDOM_EXCLUDED_VOICES.has(v) || v === keep)
  return allowed.length > 0 ? allowed : SAFE_DEFAULT_ALLOWED
}

// Server (/api/pronunciation) có thể HẠ giọng ĐOÁN (guessedVoice) xuống giọng khác nếu ngoài
// quyền gói hiện tại (clampVoiceToPlan, api/_lib/voiceAccess.ts) — trả kèm `voice` THẬT SỰ đã
// dùng trong response. PronounceButton/WordVoiceCycleButton PHẢI cache audio theo giọng THẬT
// này, không phải giọng đoán — nếu không, lần random trúng lại đúng giọng đoán cũ sẽ đọc nhầm
// cache và phát audio của giọng đã bị hạ trước đó dưới nhãn giọng đoán, khiến người dùng luôn
// nghe 1 giọng cố định dù bốc ngẫu nhiên (bug thật đã gặp, xem PROGRESS.md).
export function resolveActualVoice(
  guessedVoice: VoiceId,
  serverVoice: string | undefined,
): VoiceId {
  return serverVoice && isValidVoiceId(serverVoice) ? serverVoice : guessedVoice
}

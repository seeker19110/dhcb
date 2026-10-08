// api/_lib/voiceAccess.ts — Gói nào được dùng giọng nào (server = nguồn sự thật, không tin
// client). PHẢI khớp tay với src/lib/voiceTiers.ts (dự án không share code giữa api/ và
// src/ — 2 tsconfig riêng).
import {
  VOICE_IDS,
  DEFAULT_VOICE,
  DEFAULT_SEED_VOICE_IDS,
  STUDIO_VOICE_IDS,
  type VoiceId,
  type StudioVoiceId,
} from './googleTts.js'
import {
  ELEVEN_VOICE_IDS,
  elevenVoiceGender,
  isValidElevenVoice,
  type ElevenVoiceId,
} from './elevenLabsTts.js'
import { GEMINI_VOICE_IDS, type GeminiVoiceId } from './geminiTts.js'
import type { Plan } from '@dhcb/core-billing/plan'
import { effectivePlan } from '@dhcb/core-billing/promo'

// Gộp 4 nguồn giọng: Chirp3-HD (Google) + giọng đặc biệt ElevenLabs + giọng Studio
// (Google Cloud TTS cao cấp, chỉ tiếng Anh) + giọng Gemini (CHỈ dùng cho đọc truyện, xem
// packages/core-ai/geminiTts.ts).
export type AnyVoiceId = VoiceId | ElevenVoiceId | StudioVoiceId | GeminiVoiceId

// Free: 4 giọng (2 nữ Kore/Aoede + 2 nam Puck/Charon) — đều nằm trong DEFAULT_SEED_VOICE_IDS
// nên đã seed sẵn, phát ngay, KHÔNG phát sinh chi phí tạo audio động.
// Pro: đúng 8 giọng đã seed sẵn (DEFAULT_SEED_VOICE_IDS).
// VIP: 14 giọng Chirp3-HD + giọng ElevenLabs + 2 giọng Studio.
//
// Quyết định 2026-07-27: giọng Studio chuyển từ Pro/VIP sang CHỈ VIP. Lý do chi phí: Studio
// giá $24/1 triệu ký tự và KHÔNG có hạn mức miễn phí hàng tháng, trong khi Chirp3-HD chỉ $2
// và có 1 triệu ký tự miễn phí — đắt gấp 12 lần. Giữ Studio cho riêng VIP vừa chặn rủi ro chi
// phí ở gói rẻ, vừa tạo lý do thật để nâng cấp lên VIP.
// Giọng Gemini (đọc truyện) mở cho Pro + VIP — cùng bậc với các giọng Chirp3-HD "cao cấp"
// (Leda/Orus...) mà STORY_KIND_VOICE vẫn dùng cho các thể loại đó từ trước, giữ nhất quán:
// gói Free đọc truyện vẫn được (server tự hạ về DEFAULT_VOICE nếu voice ngoài quyền, xem
// clampVoiceToPlan bên dưới), chỉ không có giọng đọc truyền cảm riêng theo thể loại.
// Xuất ra để test đối chiếu tự động với bảng client (api/_lib/voiceTierParity.test.ts).
export const VOICE_TIERS: Record<Plan, AnyVoiceId[]> = {
  free: ['Kore', 'Aoede', 'Puck', 'Charon'],
  vip: [...VOICE_IDS, ...ELEVEN_VOICE_IDS, ...STUDIO_VOICE_IDS, ...GEMINI_VOICE_IDS],
}

// Bộ giọng cấp cho gói Free TRONG LÚC KHUYẾN MÃI — CỐ Ý không phải bộ VIP đầy đủ.
// GĐ1 2026-09-12 xoá gói Pro nên effectivePlan() nâng Free thẳng lên VIP khi tính HẠN MỨC;
// quyền GIỌNG thì KHÔNG nâng theo vì Studio/ElevenLabs đắt gấp nhiều lần (xem ghi chú chi phí
// ở VOICE_TIERS). Bộ này giữ ĐÚNG danh sách Free từng được nâng lên trước GĐ1 → chi phí không
// đổi. PHẢI khớp apps/dhcb/src/lib/voiceTiers.ts.
const PROMO_FREE_VOICES: AnyVoiceId[] = [...DEFAULT_SEED_VOICE_IDS, ...GEMINI_VOICE_IDS]

async function getAllowedVoices(plan: Plan, now: Date): Promise<AnyVoiceId[]> {
  if (plan === 'free' && (await effectivePlan(plan, now)) !== 'free') return PROMO_FREE_VOICES
  return VOICE_TIERS[plan]
}

// Giọng mặc định THEO GIỚI TÍNH. PHẢI khớp defaultVoiceForGender() trong
// apps/dhcb/src/lib/voiceTiers.ts (client tự clamp trước để nhãn hiển thị khớp giọng thật).
const DEFAULT_MALE_VOICE: VoiceId = 'Puck'
const MALE_VOICE_IDS: ReadonlySet<string> = new Set([
  'Puck',
  'Charon',
  'Fenrir',
  'Orus',
  'Algieba',
  'Iapetus',
  'Umbriel',
  'Studio-Q',
])

// Giới tính của MỌI giọng, kể cả giọng Gemini ("Gemini-Orus" → "Orus" → nam).
function voiceGender(voice: AnyVoiceId): 'female' | 'male' {
  if (isValidElevenVoice(voice)) return elevenVoiceGender(voice)
  const base = voice.startsWith('Gemini-') ? voice.slice('Gemini-'.length) : voice
  return MALE_VOICE_IDS.has(base) ? 'male' : 'female'
}

function defaultVoiceForGender(gender: 'female' | 'male'): VoiceId {
  return gender === 'male' ? DEFAULT_MALE_VOICE : DEFAULT_VOICE
}

// Trả về đúng voice nếu user được phép dùng; nếu không (bị hạ gói / hết khuyến mãi / cố tình
// gửi voice ngoài quyền) → âm thầm hạ giọng thay vì lỗi cứng, giữ trải nghiệm mượt (giống cách
// app fail-open ở usage.ts) — UI phía client đã tự ẩn lựa chọn ngoài quyền rồi, nên nhánh này
// chỉ chặn trường hợp cố tình gọi thẳng API.
//
// Thứ tự hạ giọng (2026-08-10 — trước đây mọi trường hợp đều rơi thẳng về DEFAULT_VOICE):
//   1. Giọng Gemini chưa mở khoá → giọng Chirp3-HD CÙNG TÊN (Gemini-Leda → Leda) nếu được
//      phép. Giữ đúng "chất giọng" nhân vật của thể loại truyện thay vì nhảy về Kore.
//   2. Còn lại → giọng mặc định CÙNG GIỚI TÍNH (Kore/Puck). Trước đây user đang nghe giọng
//      nam mà hết hạn gói sẽ đột ngột nghe giọng nữ — bất ngờ không cần thiết.
export async function clampVoiceToPlan(
  voice: AnyVoiceId,
  plan: Plan,
  now: Date = new Date(),
): Promise<AnyVoiceId> {
  const allowed = await getAllowedVoices(plan, now)
  if (allowed.includes(voice)) return voice
  if (voice.startsWith('Gemini-')) {
    const base = voice.slice('Gemini-'.length) as AnyVoiceId
    if (allowed.includes(base)) return base
  }
  return defaultVoiceForGender(voiceGender(voice))
}

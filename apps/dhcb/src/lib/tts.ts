// Text-to-Speech — gọi Google TTS qua /api/tts (server-side, có cache dùng chung)
// Audio cache được MÃ HÓA AES-256-GCM (lưu local VPS hoặc Cloudflare R2 tùy STORAGE_DRIVER):
// ai có link cũng không nghe được nội dung nếu không đi qua /api/tts — server chỉ trả khoá giải
// mã (key_b64/iv_b64) cho request có phiên cookie HttpOnly hợp lệ HOẶC header khách `X-Guest-Id`
// (khách vãng lai: nghe câu đã cache miễn phí, tạo câu mới trừ lượt dùng thử — xem
// docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md).
// Fallback về Web Speech API nếu /api/tts lỗi (mất mạng, server timeout, hết lượt dùng thử...).

import { getStoredToken, getAuthHeader } from '@core/authHeader'
import { audioCacheKey, getAudioEntry, setAudioBuffer } from './audioCache'
import { touchSettingsUpdated } from './storage'
import type { VisemeFrame } from './viseme'
import {
  isValidVoiceId,
  isKnownVoiceId,
  DEFAULT_VOICE,
  DEFAULT_MALE_VOICE,
  VOICE_OPTIONS,
  STUDIO_VOICE_IDS,
  ELEVEN_VOICE_IDS,
  GEMINI_VOICE_IDS,
  RANDOM_EXCLUDED_VOICES,
  clampVoiceToAllowed,
  defaultVoiceForGender,
  voiceGender,
  getCachedAllowedVoices,
  type VoiceId,
} from './voiceTiers'

type Lang = 'en-US' | 'vi-VN'
export type Voice = VoiceId

const MALE_VOICE_IDS = new Set(VOICE_OPTIONS.filter((v) => v.gender === 'male').map((v) => v.id))

// ── Thẻ <audio> DUY NHẤT dùng chung cho mọi lần phát ────────────────────────
// iOS/Safari (kể cả khi cài PWA) chỉ cho JavaScript phát audio trên một thẻ
// <audio> ĐÃ được người dùng "mở khoá" bằng một cú chạm tay. Nếu mỗi câu tạo
// `new Audio()` mới rồi gọi .play() trong chuỗi async (sau khi await tải/giải mã),
// thì sau câu 1–2 hiệu lực của cú chạm tay đã hết → iOS chặn các câu sau (hội
// thoại đứng giữa chừng). Khắc phục: tái dùng MỘT thẻ duy nhất, mở khoá 1 lần
// lúc chạm đầu tiên (unlockAudio), sau đó chỉ đổi .src cho từng câu — thẻ đã mở
// khoá sẽ phát được mãi. Máy tính không có giới hạn này nên trước đây vẫn chạy.
let sharedAudio: HTMLAudioElement | null = null
let audioUnlocked = false
let currentBlobUrl: string | null = null
let currentAudioId: string | null = null
// Callback để unblock Promise đang chờ trong speakViaGoogle khi stopSpeaking() được gọi
let currentResolve: (() => void) | null = null
// "Vé" cho chuỗi đọc song ngữ: stopSpeaking() — và bất kỳ lượt phát MỚI nào chiếm thẻ audio
// dùng chung — đều tăng số này, để huỷ phần CÒN LẠI của speakBilingual (vd: đang đọc câu
// thoại mà bấm Tắt tiếng → KHÔNG đọc tiếp phần sửa lỗi).
//
// QUAN TRỌNG: chính lượt phát của speakBilingual cũng tăng số này (speakViaGoogle chiếm thẻ
// audio), nên KHÔNG được so với giá trị chốt TRƯỚC khi phát — làm vậy thì lần nào cũng lệch
// và phần sửa lỗi KHÔNG BAO GIỜ được đọc (lỗi thật, có từ PR #476 tới 2026-08-10). Vì thế
// speak()/speakViaGoogle TRẢ VỀ đúng số vé của lượt phát vừa rồi để nơi gọi so lại.
let playToken = 0

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.preload = 'auto'
  }
  return sharedAudio
}

// Gỡ mọi handler cũ trên thẻ dùng chung trước khi gắn handler cho lượt phát mới
function clearAudioHandlers(a: HTMLAudioElement) {
  a.onended = null
  a.onerror = null
  a.ontimeupdate = null
  a.onloadedmetadata = null
}

// WAV im lặng cực ngắn để "mở khoá" thẻ audio trên iOS (tạo 1 lần, dùng lại)
let silentUrl: string | null = null
function getSilentUrl(): string {
  if (silentUrl) return silentUrl
  const numSamples = 8
  const buf = new ArrayBuffer(44 + numSamples)
  const dv = new DataView(buf)
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  dv.setUint32(4, 36 + numSamples, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true) // PCM
  dv.setUint16(22, 1, true) // 1 kênh (mono)
  dv.setUint32(24, 8000, true) // sample rate
  dv.setUint32(28, 8000, true) // byte rate
  dv.setUint16(32, 1, true) // block align
  dv.setUint16(34, 8, true) // 8 bit / mẫu
  writeStr(36, 'data')
  dv.setUint32(40, numSamples, true)
  for (let i = 0; i < numSamples; i++) dv.setUint8(44 + i, 128) // 128 = im lặng (8-bit)
  silentUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
  return silentUrl
}

// Mở khoá audio cho iOS — PHẢI gọi ĐỒNG BỘ bên trong handler của một cú chạm tay
// (onClick/onTouch...), TRƯỚC mọi await. Phát 1 đoạn im lặng để Safari đánh dấu
// thẻ dùng chung là "được người dùng cho phép". Gọi nhiều lần vẫn an toàn (chỉ
// chạy thực sự ở lần đầu).
export function unlockAudio(): void {
  if (audioUnlocked) return
  try {
    const a = getSharedAudio()
    a.src = getSilentUrl()
    const p = a.play()
    if (p && typeof p.then === 'function') {
      p.then(() => {
        a.pause()
        a.currentTime = 0
      }).catch(() => {})
    }
    audioUnlocked = true
  } catch {
    /* sẽ thử lại ở lần phát thật */
  }
}

// ── Pause / Resume — dùng cho trình phát hội thoại ──────────────────────────
export function pauseCurrentAudio() {
  if (sharedAudio) sharedAudio.pause()
  if ('speechSynthesis' in window) window.speechSynthesis.pause()
}

export function resumeCurrentAudio() {
  if (sharedAudio) void sharedAudio.play().catch(() => {})
  if ('speechSynthesis' in window) window.speechSynthesis.resume()
}

// ── Giọng đọc toàn cục (1-trong-14 giọng Chirp3-HD) ─────────────────────────
// Lưu lựa chọn của người dùng vào localStorage để giữ nguyên qua các lần mở app.
// Mọi nút loa (KaraokeText, PronounceButton) đọc giá trị này lúc bấm, nên đổi ở Cài đặt
// (VoicePicker trong Profile.tsx) là áp dụng khắp app.
const VOICE_KEY = 'tts_voice'

// Giá trị cũ (trước khi mở rộng lên 14 giọng) — map sang giọng mới tương ứng để không mất
// lựa chọn đã lưu của user cũ.
const LEGACY_VOICE_MAP: Record<string, Voice> = {
  female: 'Kore',
  female2: 'Aoede',
  male: 'Puck',
  male2: 'Charon',
}

// Người dùng CHƯA từng chọn giọng tay: nếu gói hiện tại (VIP) có giọng Studio (cao
// cấp, chỉ tiếng Anh — xem voiceTiers.ts) thì dùng làm mặc định, để giới thiệu giọng cao
// cấp ngay thay vì phải tự tìm trong VoicePicker. Free/Pro (Studio chỉ VIP từ 2026-07-27,
// hoặc chưa đăng nhập nên getCachedAllowedVoices() trả về mặc định an toàn) → về Kore như cũ.
// CHỈ áp dụng khi chưa có lựa chọn nào lưu — 1 khi người dùng bấm chọn giọng khác (dù là
// Chirp3-HD hay Studio), VOICE_KEY được ghi và luôn dùng giá trị đó (xem setVoicePref).
function getDefaultVoiceForUnsetPref(): Voice {
  const allowed = getCachedAllowedVoices()
  return STUDIO_VOICE_IDS.some((v) => allowed.includes(v)) ? STUDIO_VOICE_IDS[0]! : DEFAULT_VOICE
}

// Giọng "gốc" người dùng đã chọn tay (VoicePicker ở Cài đặt) — luôn dùng làm giọng cố định
// khi chế độ ngẫu nhiên TẮT, và làm "hạt giống" xác định GIỚI TÍNH khi chế độ ngẫu nhiên BẬT.
function getStoredVoice(): Voice {
  const raw = localStorage.getItem(VOICE_KEY) ?? ''
  const resolved = isValidVoiceId(raw) ? raw : LEGACY_VOICE_MAP[raw]
  if (!resolved) return getDefaultVoiceForUnsetPref()
  // Giọng đã lưu nhưng NAY ngoài quyền gói (hết khuyến mãi / bị hạ gói) — server sẽ âm thầm
  // hạ về DEFAULT_VOICE khi phát (clampVoiceToPlan, api/_lib/voiceAccess.ts). Clamp NGAY ở
  // đây để nhãn hiển thị (VoicePicker, nút loa) luôn khớp giọng THỰC SỰ phát ra, tránh lệch
  // "Cài đặt nói giọng X nhưng bấm nghe lại ra giọng khác" (đúng lỗi người dùng gặp phải).
  return clampVoiceToAllowed(resolved, getCachedAllowedVoices())
}

export function setVoicePref(voice: Voice): void {
  localStorage.setItem(VOICE_KEY, voice)
  touchSettingsUpdated()
}

// ── Chế độ giọng NGẪU NHIÊN (toàn cục, bật ở trang Cài đặt) ────────────────
// Khi bật: TOÀN BỘ trang (Từ điển, Chat, Luyện nói, Cụm từ...) đều random, nhưng vẫn giữ
// ĐÚNG 1 giọng xuyên suốt trong 1 phiên (sessionStorage, không phải mỗi câu 1 giọng khác —
// nói chuyện giữa chừng đổi giọng liên tục sẽ rất rối). Giọng random chỉ đổi khi: mở tab mới
// (sessionStorage của tab mới trống), người dùng bấm "Đổi giọng khác" ở Cài đặt, hoặc đổi
// giới tính (Nữ/Nam) — vẫn cùng GIỚI TÍNH với giọng đã chọn tay (getStoredVoice), chỉ đổi
// giọng cụ thể trong giới tính đó.
const RANDOM_KEY = 'tts_voice_random'
const RANDOM_PICK_KEY = 'tts_voice_random_pick' // sessionStorage: "<gender>:<voiceId>"

export function getVoiceRandomPref(): boolean {
  return localStorage.getItem(RANDOM_KEY) === '1'
}

export function setVoiceRandomPref(on: boolean): void {
  localStorage.setItem(RANDOM_KEY, on ? '1' : '0')
  touchSettingsUpdated()
}

// Bốc lại 1 giọng ngẫu nhiên mới ngay (nút "Đổi giọng khác" ở Cài đặt) — huỷ giọng đang giữ
// cho phiên hiện tại, lần gọi getVoicePref() kế tiếp sẽ bốc lại.
export function reshuffleRandomVoice(): void {
  try {
    sessionStorage.removeItem(RANDOM_PICK_KEY)
  } catch {
    /* sessionStorage bị chặn — không có gì để xoá */
  }
}

function pickAndRememberRandomVoice(gender: 'female' | 'male'): Voice {
  const allowed = new Set(getCachedAllowedVoices())
  // Bỏ giọng không bao giờ tự nhảy vào bể random (Studio đắt gấp 12 lần + chỉ tiếng Anh,
  // ElevenLabs không dùng được ở /api/pronunciation) — xem RANDOM_EXCLUDED_VOICES.
  const byGender = VOICE_OPTIONS.filter(
    (v) => v.gender === gender && !RANDOM_EXCLUDED_VOICES.has(v.id),
  )
  const candidates = byGender.filter((v) => allowed.has(v.id))
  const pool = candidates.length > 0 ? candidates : byGender
  const pick = pool[Math.floor(Math.random() * pool.length)]!.id
  try {
    sessionStorage.setItem(RANDOM_PICK_KEY, `${gender}:${pick}`)
  } catch {
    /* sessionStorage có thể bị chặn (chế độ ẩn danh khắt khe) — vẫn dùng được, chỉ mất tính
       "giữ nguyên trong phiên", mỗi lần gọi sẽ bốc lại. */
  }
  return pick
}

export function getVoicePref(): Voice {
  const stored = getStoredVoice()
  if (!getVoiceRandomPref()) return stored
  const gender = VOICE_OPTIONS.find((v) => v.id === stored)?.gender ?? 'female'
  let cached: string | null = null
  try {
    cached = sessionStorage.getItem(RANDOM_PICK_KEY)
  } catch {
    /* sessionStorage bị chặn — bỏ qua, coi như chưa có giọng nào được bốc trong phiên */
  }
  const [cachedGender, cachedVoice] = cached?.split(':') ?? []
  if (cachedGender === gender && cachedVoice && isValidVoiceId(cachedVoice)) return cachedVoice
  return pickAndRememberRandomVoice(gender)
}

// ── Giọng GIẢI THÍCH (tiếng mẹ đẻ) — tách khỏi giọng hội thoại ──────────────
// Điểm khác biệt cốt lõi của app (CLAUDE.md mục 1): câu hội thoại đọc bằng giọng ngôn ngữ
// ĐÍCH, phần sửa lỗi/giải thích đọc bằng giọng tiếng MẸ ĐẺ. Trước 2026-08-10 cả hai dùng
// CHUNG một giọng (chỉ khác locale: en-US-Chirp3-HD-Kore → vi-VN-Chirp3-HD-Kore), nên người
// học nghe ra vẫn là MỘT người và khó phân biệt "AI đang nói tiếng đích" với "AI đang giải
// thích". NAY: giọng giải thích mặc định là giọng KHÁC GIỚI TÍNH với giọng hội thoại — hai
// nhân vật nghe rõ ràng là hai người, không cần người dùng cấu hình gì.
//
// Tắt được ở Cài đặt (về lại đúng hành vi cũ: 1 giọng cho cả hai).
const NATIVE_VOICE_KEY = 'tts_voice_native'
const NATIVE_VOICE_ON_KEY = 'tts_voice_native_on'

export function isNativeVoiceSeparate(): boolean {
  // Mặc định BẬT (chưa từng chỉnh = chưa có khoá) — đây là hành vi đúng thiết kế sản phẩm.
  return localStorage.getItem(NATIVE_VOICE_ON_KEY) !== '0'
}

export function setNativeVoiceSeparate(on: boolean): void {
  localStorage.setItem(NATIVE_VOICE_ON_KEY, on ? '1' : '0')
  touchSettingsUpdated()
}

export function setNativeVoicePref(voice: Voice): void {
  localStorage.setItem(NATIVE_VOICE_KEY, voice)
  touchSettingsUpdated()
}

// Giọng đọc phần giải thích/sửa lỗi. Quy tắc chọn, theo thứ tự:
//   1. Tắt chế độ tách giọng → dùng luôn giọng hội thoại (hành vi cũ).
//   2. Người dùng đã chọn tay ở Cài đặt → dùng giọng đó (đã clamp theo gói).
//   3. Chưa chọn → giọng mặc định KHÁC GIỚI TÍNH với giọng hội thoại (Kore ⇄ Puck).
// LUÔN loại Studio/ElevenLabs khỏi giọng giải thích: phần giải thích ở chiều A là tiếng
// VIỆT, mà Studio không có giọng vi-VN (server hạ về Chirp3-HD) còn ElevenLabs thì đắt —
// không đáng cho phần đọc dài như giải thích.
export function getNativeVoicePref(targetVoice: Voice = getVoicePref()): Voice {
  if (!isNativeVoiceSeparate()) return targetVoice
  const allowed = getCachedAllowedVoices().filter((v) => !RANDOM_EXCLUDED_VOICES.has(v))
  const oppositeDefault = defaultVoiceForGender(
    voiceGender(targetVoice) === 'female' ? 'male' : 'female',
  )
  const raw = localStorage.getItem(NATIVE_VOICE_KEY) ?? ''
  if (!isValidVoiceId(raw) || RANDOM_EXCLUDED_VOICES.has(raw)) return oppositeDefault
  return allowed.includes(raw) ? raw : oppositeDefault
}

export { DEFAULT_VOICE, DEFAULT_MALE_VOICE }
export type { VoiceId } from './voiceTiers'
export type { Lang }

// ── Tốc độ phát toàn cục (0.75× / 1× / 1.25×) ───────────────────────────────
// Cùng cơ chế với giọng đọc ở trên: lưu localStorage, mọi nơi gọi speak()/
// speakBilingual() không truyền `rate` sẽ tự dùng giá trị này làm mặc định.
export type Rate = 0.75 | 1 | 1.25
const RATE_KEY = 'tts_rate'

export function getRatePref(): Rate {
  const v = Number(localStorage.getItem(RATE_KEY))
  return v === 0.75 || v === 1.25 ? v : 1
}

export function setRatePref(rate: Rate): void {
  localStorage.setItem(RATE_KEY, String(rate))
}

export function isTTSSupported(): boolean {
  return true // Google TTS luôn hoạt động (không phụ thuộc trình duyệt)
}

export function stopSpeaking() {
  playToken++ // huỷ phần còn lại của chuỗi đọc song ngữ đang chờ (nếu có)
  if (sharedAudio) {
    // Xóa handler trước khi pause để tránh onerror/onended fire sau khi đã stop.
    // KHÔNG huỷ thẻ sharedAudio (đặt = null) — phải giữ lại để nó vẫn "đã mở
    // khoá" trên iOS cho các lần phát sau. Chỉ pause + revoke blob là đủ.
    clearAudioHandlers(sharedAudio)
    sharedAudio.pause()
  }
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
  currentAudioId = null
  // Dừng cả Web Speech API phòng khi đang dùng fallback
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  // Unblock Promise đang chờ trong speakViaGoogle (nếu có) — resolve thay vì reject
  // để speak() KHÔNG fallback sang Web Speech khi bị stop có chủ đích
  currentResolve?.()
  currentResolve = null
}

// Phát audio từ URL ngoài TTS (ví dụ phát âm từ) — dùng chung thẻ sharedAudio để ngăn chồng
export function playAudioUrl(url: string): void {
  stopSpeaking()
  const audio = getSharedAudio()
  const audioId = crypto.randomUUID()
  currentAudioId = audioId
  clearAudioHandlers(audio)
  audio.playbackRate = 1
  audio.src = url
  const cleanup = () => {
    if (currentAudioId === audioId) currentAudioId = null
  }
  audio.onended = cleanup
  audio.onerror = cleanup
  audio.play().catch((err) => {
    console.error('Lỗi phát audio:', err)
    cleanup()
  })
}

// ── Giải mã audio AES-256-GCM (xem api/_lib/ttsCrypto.ts ở phía server) ─────
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Tải + giải mã audio → trả ArrayBuffer (lưu được vào IndexedDB, không chiếm RAM liên tục)
async function decryptToBuffer(
  audioUrl: string,
  keyB64: string,
  ivB64: string,
): Promise<ArrayBuffer> {
  const cipherRes = await fetch(audioUrl)
  if (!cipherRes.ok) throw new Error(`Không tải được audio: ${cipherRes.status}`)
  const cipherBuffer = await cipherRes.arrayBuffer()

  const keyBytes = base64ToBytes(keyB64)
  const ivBytes = base64ToBytes(ivB64)
  // Ép kiểu BufferSource: @types/node làm Uint8Array generic theo ArrayBufferLike, lệch với
  // kiểu BufferSource của lib DOM — chỉ là vấn đề kiểu TypeScript, không ảnh hưởng runtime.
  const key = await crypto.subtle.importKey('raw', keyBytes as BufferSource, 'AES-GCM', false, [
    'decrypt',
  ])
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes as BufferSource }, key, cipherBuffer)
}

// Tạo blob URL tạm từ ArrayBuffer để phát qua <audio>. Giọng Gemini (đọc truyện) trả file
// WAV thật (không phải mp3 như các giọng khác — xem packages/core-ai/geminiTts.ts), nên
// phải khai đúng mimeType thì trình duyệt mới giải mã được, không thì phát im lặng/lỗi.
export function bufferToBlobUrl(buffer: ArrayBuffer, mimeType = 'audio/mpeg'): string {
  return URL.createObjectURL(new Blob([buffer], { type: mimeType }))
}

function blobMimeTypeForVoice(voice: Voice): string {
  return (GEMINI_VOICE_IDS as string[]).includes(voice) ? 'audio/wav' : 'audio/mpeg'
}

// ── Nạp audio (IndexedDB → server) — tách riêng để vừa phát vừa NẠP TRƯỚC ────
// Trả ArrayBuffer đã giải mã, sẵn sàng phát. Có trong IndexedDB thì lấy ngay;
// chưa có thì gọi /api/tts → giải mã → lưu IndexedDB. Dùng chung cho cả việc
// phát ngay (speakViaGoogle) lẫn nạp trước (prefetchSpeech).
//
// `inflight`: gộp các yêu cầu TRÙNG key đang chạy làm 1 — tránh việc trình phát
// và bộ nạp-trước cùng tải một câu (tải đôi + dễ dính 429).
// `voice`: giọng server THẬT SỰ đã dùng (có thể đã bị hạ theo gói) — quyết định mimeType
// lúc tạo Blob để phát, xem SpeechAudio bên dưới.
export interface SpeechAudio {
  buffer: ArrayBuffer
  timeline: VisemeFrame[] | null
  voice: Voice
}

const inflight = new Map<string, Promise<SpeechAudio>>()

// Studio (giọng cao cấp VIP mặc định mới — xem getDefaultVoiceForUnsetPref) CHỈ có
// tiếng Anh. speak()/prefetchSpeech() không phân biệt lang khi lấy voice mặc định (dùng
// chung 1 giọng toàn app), nên câu tiếng Việt (vd bản dịch ex_vi trong KaraokeText) có thể
// nhận nhầm Studio — tự đổi về Chirp3-HD cùng giới tính thay vì gọi API lỗi/không phát được.
const STUDIO_TO_CHIRP_FALLBACK: Partial<Record<Voice, Voice>> = {
  'Studio-O': 'Kore',
  'Studio-Q': 'Puck',
}
function resolveVoiceForLang(voice: Voice, lang: Lang): Voice {
  if (lang === 'en-US') return voice
  return STUDIO_TO_CHIRP_FALLBACK[voice] ?? voice
}

// Xuất công khai để dùng cho AvatarSpeaking PoC (src/pages/AvatarDemo.tsx) — cần ArrayBuffer
// audio thô (đã giải mã) để tự quản lý thẻ <audio> riêng, không qua sharedAudio dùng chung.
export async function ensureAudioBuffer(
  text: string,
  lang: Lang,
  voiceInput: Voice,
): Promise<ArrayBuffer> {
  const { buffer } = await ensureAudioWithTimeline(text, lang, voiceInput)
  return buffer
}

// Như ensureAudioBuffer nhưng trả KÈM timeline khẩu hình thật do server tính (chỉ giọng
// ElevenLabs có — xem api/_lib/visemeTimeline.ts). `timeline: null` nghĩa là không có timing
// thật cho câu/giọng này → nơi gọi tự ước lượng bằng src/lib/viseme.ts như trước.
// Khoá IndexedDB THẬT SỰ dùng cho một câu — đã áp cả 2 phép chuẩn hoá: Studio→Chirp3-HD khi
// đọc tiếng Việt (resolveVoiceForLang) và bỏ `lang` với giọng ElevenLabs. Xuất công khai để
// nơi nào cần KIỂM TRA "câu này đã có audio offline chưa" (lib/srsPreloader.ts) tính ra đúng
// khoá mà bộ phát dùng — tự ghép audioCacheKey(text, lang, voice) sẽ lệch khoá ở 2 nhóm giọng
// trên và luôn báo "chưa có" dù đã tải xong (lỗi thật của thanh Tải trước SRS Offline).
export function speechCacheKey(text: string, lang: Lang, voiceInput: Voice): string {
  const voice = resolveVoiceForLang(voiceInput, lang)
  return audioCacheKey(text, (ELEVEN_VOICE_IDS as string[]).includes(voice) ? '' : lang, voice)
}

const GUEST_TRIAL_EXHAUSTED_ERROR = 'TTS API lỗi: 429 (khách hết lượt dùng thử)'

// Đọc cờ `guestTrialExhausted` server gắn vào body 429 khi khách hết lượt dùng thử.
// Body không đọc được (không phải JSON...) → coi như 429 thường (vẫn thử lại như cũ).
async function isGuestTrialExhausted(res: Response): Promise<boolean> {
  try {
    const body = (await res.json()) as { guestTrialExhausted?: unknown } | null
    return body?.guestTrialExhausted === true
  } catch {
    return false
  }
}

export async function ensureAudioWithTimeline(
  text: string,
  lang: Lang,
  voiceInput: Voice,
): Promise<SpeechAudio> {
  const voice = resolveVoiceForLang(voiceInput, lang)
  // Giọng ElevenLabs không phân biệt lang (xem ghi chú tương ứng trong api/tts.ts) — bỏ lang
  // khỏi cacheKey để khớp với hash cache phía server (không tách 2 bản audio giống hệt nhau).
  const cacheKey = speechCacheKey(text, lang, voiceInput)

  // Kiểm tra IndexedDB trước — nếu đã có thì khỏi gọi server. Entry cũ (lưu trước khi
  // /api/tts trả `voice`) không có giọng thật → dùng tạm giọng yêu cầu, đúng như hành vi cũ.
  const cached = await getAudioEntry(cacheKey)
  if (cached) {
    return {
      buffer: cached.buffer,
      timeline: cached.timeline,
      voice: cached.voice && isKnownVoiceId(cached.voice) ? cached.voice : voice,
    }
  }

  // Đang có yêu cầu tải cùng câu này (vd: bộ nạp-trước) → dùng chung, không tải lại
  const running = inflight.get(cacheKey)
  if (running) return running

  const job = (async () => {
    // Không chặn khách ở đây: getAuthHeader() tự gắn `X-Guest-Id` khi chưa có phiên, server
    // quyết định hạn mức (cache HIT miễn phí, tạo mới trừ lượt dùng thử).
    const callTts = () =>
      fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ text, lang, voice }),
      })

    let res = await callTts()
    // 429 = quá nhiều request (thường do phát nhiều câu liên tiếp). Đợi 1.2s rồi thử lại
    // 1 lần trước khi báo lỗi — phần lớn câu đã cache nên lần 2 thường qua.
    // Riêng khách HẾT LƯỢT DÙNG THỬ: thử lại vô ích (hạn mức theo ngày) — báo lỗi ngay để
    // speak() rơi về Web Speech không phải chờ thêm 1.2s.
    if (res.status === 429) {
      if (await isGuestTrialExhausted(res)) throw new Error(GUEST_TRIAL_EXHAUSTED_ERROR)
      await new Promise((r) => setTimeout(r, 1200))
      res = await callTts()
    }

    if (!res.ok) throw new Error(`TTS API lỗi: ${res.status}`)

    const {
      audio_url,
      key_b64,
      iv_b64,
      viseme_timeline = null,
      voice: serverVoice,
    } = (await res.json()) as {
      audio_url: string
      key_b64: string
      iv_b64: string
      viseme_timeline?: VisemeFrame[] | null
      voice?: string
    }

    // Server có thể đã HẠ giọng theo gói (clampVoiceToPlan) — vd gói Free mở truyện sẽ nhận
    // Chirp3-HD (mp3) thay cho giọng Gemini (WAV) mà client yêu cầu. Bám theo giọng server
    // trả về, nếu không sẽ gắn nhầm mimeType cho Blob và iOS/Safari không phát được.
    const actualVoice = serverVoice && isKnownVoiceId(serverVoice) ? serverVoice : voice
    const buffer = await decryptToBuffer(audio_url, key_b64, iv_b64)
    // Lưu vào IndexedDB để lần sau (kể cả mở lại app) dùng ngay không cần fetch
    void setAudioBuffer(cacheKey, buffer, viseme_timeline, actualVoice)
    return { buffer, timeline: viseme_timeline, voice: actualVoice }
  })()

  inflight.set(cacheKey, job)
  try {
    return await job
  } finally {
    inflight.delete(cacheKey)
  }
}

// Nạp TRƯỚC audio một câu vào IndexedDB mà KHÔNG phát — gọi nền cho các câu kế
// tiếp để khi tới lượt phát đã có sẵn, hội thoại chạy liền mạch không bị khựng.
// Lỗi thì bỏ qua (sẽ tải lại lúc phát). Không giữ buffer trong RAM — chỉ cần nó
// nằm trong IndexedDB là đủ.
export async function prefetchSpeech(
  text: string,
  lang: Lang,
  voice: Voice = getVoicePref(),
): Promise<void> {
  if (!text.trim()) return
  // Khách vãng lai KHÔNG nạp trước: câu chưa cache sẽ trừ lượt dùng thử (3 lượt/ngày, dùng
  // chung với chat/STT) cho câu có thể không bao giờ được phát. Khách vẫn nghe giọng server
  // lúc bấm phát thật (speak → ensureAudioWithTimeline).
  if (!getStoredToken()) return
  try {
    await ensureAudioBuffer(text, lang, voice)
  } catch {
    /* sẽ tải lại lúc phát */
  }
}

// Gọi /api/tts (kèm JWT) → giải mã audio → phát qua <audio>
// rate: 0.75 = chậm, 1 = bình thường, 1.25 = nhanh (điều chỉnh client-side, không tốn thêm API)
// onWord: callback(wordIndex) gọi mỗi khi từ tiếp theo bắt đầu — dùng cho karaoke highlight
async function speakViaGoogle(
  text: string,
  lang: Lang,
  voice: Voice,
  rate = 1,
  onWord?: (idx: number) => void,
): Promise<number> {
  if (!text.trim()) return playToken

  // [S10-1 / AC-4] Vé chốt TRƯỚC khi tải. Tải audio là quãng chờ dài nhất của một lượt phát,
  // và rời trang chính là lúc đang tải: cleanup gọi `stopSpeaking()` → `playToken++`. Nếu chỉ
  // chốt vé SAU khi tải xong (bản cũ) thì lượt phát này không biết mình đã bị huỷ, tải xong
  // vẫn chiếm thẻ audio và CẤT TIẾNG Ở TRANG KẾ.
  const veTruocKhiTai = playToken

  // Lấy audio (ưu tiên IndexedDB; bộ nạp-trước thường đã tải sẵn câu này)
  const { buffer, voice: actualVoice } = await ensureAudioWithTimeline(text, lang, voice)

  // Có ai đó chiếm vé trong lúc ta đang tải (stopSpeaking, hoặc một lượt phát khác) → BỎ lượt
  // này. Trả về vé CŨ (đã lạc hậu) chứ không phải `playToken` hiện tại, để nơi gọi —
  // `speakBilingual` so `playToken !== myToken` — thấy lệch và dừng luôn phần đọc còn lại.
  // `resolve` chứ không `throw`: `speak()` bắt lỗi là rơi sang Web Speech, tức lại phát thành
  // tiếng đúng thứ vừa bị huỷ.
  if (playToken !== veTruocKhiTai) return veTruocKhiTai
  // mimeType theo giọng THẬT server dùng, không phải giọng yêu cầu (xem ensureAudioWithTimeline)
  const blobUrl = bufferToBlobUrl(buffer, blobMimeTypeForVoice(actualVoice))

  // Tách từ để tính index tương ứng với vị trí phát (ước tính theo tỉ lệ thời gian)
  const words = onWord ? text.trim().split(/\s+/) : []
  const audioId = crypto.randomUUID()
  // Số vé của CHÍNH lượt phát này (gán lúc chiếm thẻ audio) — trả về cho nơi gọi so lại.
  let myPlayToken = playToken

  await new Promise<void>((resolve, reject) => {
    // Nếu có lượt phát TRƯỚC ĐÓ còn đang treo (currentResolve chưa được gọi) — vd người
    // dùng bấm nút loa thứ hai trước khi câu đầu phát xong — giải phóng nó TRƯỚC KHI chiếm
    // thẻ audio dùng chung. Thiếu bước này thì Promise của lượt phát trước sẽ treo MÃI MÃI
    // (không bao giờ resolve/reject vì handler của nó bị gỡ ở clearAudioHandlers ngay dưới
    // mà không ai gọi resolve() thay), khiến nút loa/vòng lặp "Phát tất cả" đang chờ nó bị
    // kẹt vĩnh viễn ở trạng thái "đang phát". playToken++ để huỷ luôn phần sửa lỗi còn treo
    // (nếu lượt trước là speakBilingual) — giống hệt logic stopSpeaking().
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = null
    }
    currentResolve?.()
    currentResolve = null
    myPlayToken = ++playToken

    // Tái dùng thẻ <audio> đã mở khoá (xem ghi chú đầu file) thay vì tạo mới mỗi câu
    const audio = getSharedAudio()
    clearAudioHandlers(audio)
    audio.pause()
    audio.src = blobUrl
    audio.playbackRate = rate
    // Giữ nguyên cao độ giọng khi tăng/giảm tốc — không thì 1.25× nghe như "chuột
    // kêu", 0.75× nghe trầm/ù. Safari (kể cả iOS) chỉ hỗ trợ qua tiền tố webkit;
    // trình duyệt nào không có cả 2 thuộc tính thì bỏ qua (chấp nhận đổi cao độ).
    const a = audio as HTMLAudioElement & { webkitPreservesPitch?: boolean }
    if ('preservesPitch' in audio) audio.preservesPitch = true
    else if ('webkitPreservesPitch' in audio) a.webkitPreservesPitch = true
    currentBlobUrl = blobUrl
    currentAudioId = audioId
    // Lưu resolve để stopSpeaking() có thể unblock Promise này mà không cần onerror
    currentResolve = resolve

    // Cập nhật từ đang phát dựa trên tiến trình audio (≈4 lần/giây)
    if (onWord && words.length > 0) {
      audio.onloadedmetadata = () => {
        const dur = audio.duration
        audio.ontimeupdate = () => {
          // Chỉ cập nhật nếu audio này vẫn còn active (không bị thay thế)
          if (currentAudioId !== audioId || !dur || dur <= 0) return
          const idx = Math.min(
            Math.floor((audio.currentTime / dur) * words.length),
            words.length - 1,
          )
          onWord(idx)
        }
      }
    }

    const cleanup = () => {
      // Blob URL là tạm — revoke ngay sau khi phát xong để giải phóng RAM.
      // Buffer gốc vẫn còn trong IndexedDB, lần sau tạo blob URL mới từ buffer đó.
      URL.revokeObjectURL(blobUrl)
      // Chỉ cleanup nếu lượt phát này vẫn còn active (chưa bị câu khác thay thế)
      if (currentBlobUrl === blobUrl && currentAudioId === audioId) currentBlobUrl = null
      if (currentAudioId === audioId) currentAudioId = null
      if (currentResolve === resolve) currentResolve = null
    }
    audio.onended = () => {
      cleanup()
      resolve()
    }
    audio.onerror = () => {
      cleanup()
      reject(new Error('Không phát được audio'))
    }
    audio.play().catch((err) => {
      cleanup()
      reject(err)
    })
  })

  return myPlayToken
}

// Fallback Web Speech API khi Google TTS không khả dụng
function speakViaWebSpeech(
  text: string,
  lang: Lang,
  voice: Voice,
  rate = 1,
  onWord?: (idx: number) => void,
): Promise<number> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || !text.trim()) {
      resolve(playToken)
      return
    }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang
    utt.rate = (lang === 'en-US' ? 0.9 : 0.85) * rate

    // WebSpeech API cung cấp sự kiện 'boundary' với charIndex chính xác hơn ước tính tỉ lệ
    if (onWord) {
      const words = text.trim().split(/\s+/)
      utt.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name !== 'word') return
        let cumLen = 0
        for (let i = 0; i < words.length; i++) {
          const w = words[i]! // i < words.length nên chắc chắn có
          if (e.charIndex <= cumLen + w.length) {
            onWord(i)
            return
          }
          cumLen += w.length + 1 // +1 cho dấu cách
        }
      }
    }

    // Cố chọn giọng nam/nữ khớp ngôn ngữ nếu trình duyệt có sẵn (không phải lúc nào cũng có)
    const isMale = MALE_VOICE_IDS.has(voice)
    const wanted = window.speechSynthesis.getVoices().find((v) => {
      if (!v.lang.startsWith(lang.slice(0, 2))) return false
      const n = v.name.toLowerCase()
      return isMale
        ? n.includes('male') || n.includes('david') || n.includes('nam')
        : n.includes('female') || n.includes('zira') || n.includes('samantha') || n.includes('nữ')
    })
    if (wanted) utt.voice = wanted
    utt.onend = () => resolve(playToken)
    utt.onerror = () => resolve(playToken) // không throw để tránh crash UI
    window.speechSynthesis.speak(utt)
  })
}

export async function speak(
  text: string,
  lang: Lang,
  voice: Voice = getVoicePref(),
  // number (không phải Rate): bài luyện nghe (③ N3, lib/listening.ts) cần tốc độ
  // mặc định theo cấp CEFR (0.9×/1×/1.1×) — giá trị NGOÀI 3 mức của RateToggle
  // (0.75/1/1.25). Rate vẫn là kiểu CHUẨN cho lựa chọn người dùng lưu/đọc
  // (getRatePref/setRatePref/RateToggle) — chỉ nới lỏng tham số phát thực tế.
  rate: number = getRatePref(),
  onWord?: (idx: number) => void,
  // Trả về "số vé" của lượt phát này — nơi gọi so với playToken hiện tại để biết lượt phát
  // có bị Tắt tiếng / lượt phát khác chiếm chỗ hay không (xem speakBilingual).
): Promise<number> {
  try {
    return await speakViaGoogle(text, lang, voice, rate, onWord)
  } catch {
    // Lỗi Google TTS (hết lượt dùng thử, mất mạng, server lỗi...) → dùng Web Speech API tạm
    return await speakViaWebSpeech(text, lang, voice, rate, onWord)
  }
}

// Đọc tuần tự: câu hội thoại (ngôn ngữ đích) → sửa lỗi (tiếng mẹ đẻ)
// onSpeechWord/onFeedbackWord (tùy chọn): cho karaoke sáng chữ từng phần theo giọng đọc
// (dùng ở Speaking.tsx — xem KaraokeText.tsx cho cách dùng onWord tương tự với speak()).
// `feedbackVoice`: giọng đọc phần sửa lỗi/giải thích — MẶC ĐỊNH khác giọng hội thoại (xem
// getNativeVoicePref). Truyền tay khi nơi gọi muốn ép 1 giọng cụ thể.
export async function speakBilingual(
  speech: string,
  feedback: string,
  speechLang: Lang = 'en-US',
  feedbackLang: Lang = 'vi-VN',
  voice: Voice = getVoicePref(),
  rate: number = getRatePref(),
  onSpeechWord?: (idx: number) => void,
  onFeedbackWord?: (idx: number) => void,
  feedbackVoice: Voice = getNativeVoicePref(voice),
) {
  // Chốt số vé SAU khi câu thoại phát xong (speak trả về vé của chính lượt phát đó) — chốt
  // trước khi phát là sai, vì chính lượt phát này cũng tăng playToken (xem ghi chú ở playToken).
  let myToken = ++playToken
  if (speech) myToken = await speak(speech, speechLang, voice, rate, onSpeechWord)
  // Nếu giữa chừng người dùng bấm Tắt tiếng / sang câu khác (stopSpeaking → playToken đổi),
  // thì DỪNG, không đọc tiếp phần sửa lỗi.
  if (playToken !== myToken) return
  if (feedback) await speak(feedback, feedbackLang, feedbackVoice, rate, onFeedbackWord)
}

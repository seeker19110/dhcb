import { useState } from 'react'
import { Lock, Shuffle } from 'lucide-react'
import {
  getVoicePref,
  setVoicePref,
  getVoiceRandomPref,
  setVoiceRandomPref,
  reshuffleRandomVoice,
  getNativeVoicePref,
  setNativeVoicePref,
  isNativeVoiceSeparate,
  setNativeVoiceSeparate,
  type Voice,
} from '../lib/tts'
import {
  VOICE_OPTIONS,
  DEFAULT_SEED_VOICE_IDS,
  ELEVEN_VOICE_IDS,
  STUDIO_VOICE_IDS,
  RANDOM_EXCLUDED_VOICES,
  getAllowedVoices,
  isVoicePromoActive,
  type VoiceOption,
} from '../lib/voiceTiers'
import { getAppSettings } from '../lib/appSettings'
import { formatDateVN } from '../lib/promoEndingBanner'
import type { Plan } from '../types'

interface Props {
  plan: Plan
  isA: boolean // true = giao diện tiếng Việt (chiều A), false = tiếng Anh (chiều B)
}

// Bộ chọn ĐẦY ĐỦ 14 giọng Chirp3-HD (7 nữ + 7 nam) — đặt ở trang Cài đặt/Hồ sơ. Lựa chọn lưu
// TOÀN CỤC (localStorage qua setVoicePref) nên áp dụng ngay cho mọi trang trong app (Chat,
// Luyện nói, Từ điển, Lộ trình...) — không cần chỉnh riêng từng nơi. Giọng ngoài quyền gói
// hiện mờ + khoá (nhưng vẫn hiện đủ 14 để biết có gì nếu nâng cấp). 8 giọng đã seed sẵn (⚡,
// DEFAULT_SEED_VOICE_IDS) hiện TRƯỚC trong mỗi hàng (đúng thứ tự VOICE_OPTIONS) và phát ngay
// lập tức; 6 giọng còn lại vẫn chọn được, chỉ chậm hơn 1 chút ở lần phát đầu tiên.
export default function VoicePicker({ plan, isA }: Props) {
  const [voice, setVoice] = useState<Voice>(getVoicePref())
  const [random, setRandom] = useState(getVoiceRandomPref())
  const [nativeOn, setNativeOn] = useState(isNativeVoiceSeparate())
  const [nativeVoice, setNativeVoice] = useState<Voice>(() => getNativeVoicePref())
  const allowed = new Set(getAllowedVoices(plan))
  const seeded = new Set(DEFAULT_SEED_VOICE_IDS)
  const eleven = new Set(ELEVEN_VOICE_IDS)
  const studio = new Set(STUDIO_VOICE_IDS)
  const promoActive = isVoicePromoActive()
  // Ngày hết khuyến mãi lấy ĐỘNG từ cấu hình server (app_settings) — trước đây viết cứng
  // "31/12/2026" nên admin đổi mốc là banner nói sai.
  const { promoUntil } = getAppSettings()

  // Giọng ngoài quyền gói: bấm vào KHÔNG chọn giọng, thay vào đó cuộn thẳng xuống khối
  // "Nâng cấp VIP" (UpgradeSection.tsx, id="upgrade-section", cùng nằm trên trang Hồ sơ) —
  // đỡ người dùng phải tự tìm nút nâng cấp ở đâu khi thấy giọng bị khoá.
  function choose(v: Voice) {
    if (!allowed.has(v)) {
      document
        .getElementById('upgrade-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setVoice(v)
    setVoicePref(v)
  }

  // Giọng giải thích: chỉ cho chọn trong giọng Chirp3-HD thường (bỏ Studio/ElevenLabs — phần
  // giải thích ở chiều A là tiếng Việt, Studio không có giọng vi-VN; xem getNativeVoicePref).
  const nativeChoices = VOICE_OPTIONS.filter(
    (v) => allowed.has(v.id) && !RANDOM_EXCLUDED_VOICES.has(v.id),
  )

  function chooseNative(v: Voice) {
    setNativeVoice(v)
    setNativeVoicePref(v)
  }

  function toggleNative() {
    const next = !nativeOn
    setNativeOn(next)
    setNativeVoiceSeparate(next)
    // Đọc lại pref sau khi đổi công tắc: tắt → trả về đúng giọng hội thoại, bật → giọng
    // giải thích thật sự sẽ dùng (mặc định khác giới tính).
    setNativeVoice(getNativeVoicePref())
  }

  function toggleRandom() {
    const next = !random
    setRandom(next)
    setVoiceRandomPref(next)
    if (next) reshuffleRandomVoice() // bật lên → bốc giọng mới ngay, không dùng lại giọng cũ
  }

  const groups: { gender: 'female' | 'male'; label: string }[] = [
    { gender: 'female', label: isA ? 'Giọng nữ' : 'Female voices' },
    { gender: 'male', label: isA ? 'Giọng nam' : 'Male voices' },
  ]

  // Người mới bắt đầu không cần biết tên nội bộ Google ("Kore", "Aoede"...) — hiển thị
  // "Giọng nữ 1", "Giọng nam 2"... theo đúng thứ tự trong VOICE_OPTIONS (audit UI/UX
  // 2026-09-22 P1-3). Tên Google thật vẫn giữ trong thuộc tính `title` để không mất thông
  // tin, chỉ không lộ lên chữ hiển thị chính.
  const genderIndex: Partial<Record<VoiceOption['id'], number>> = {}
  ;(['female', 'male'] as const).forEach((g) => {
    VOICE_OPTIONS.filter((v) => v.gender === g).forEach((v, i) => {
      genderIndex[v.id] = i + 1
    })
  })
  function voiceLabel(v: VoiceOption): string {
    const genderWord =
      v.gender === 'female' ? (isA ? 'Giọng nữ' : 'Female voice') : isA ? 'Giọng nam' : 'Male voice'
    return `${genderWord} ${genderIndex[v.id]}`
  }

  return (
    <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-white">
          {isA ? 'Giọng đọc (áp dụng cho cả app)' : 'Voice (applies app-wide)'}
        </span>
      </div>
      {promoActive && promoUntil !== null && (
        <p className="text-xs text-emerald-400 theme-light:text-emerald-800 mb-3">
          {isA
            ? `🎁 Khuyến mãi: mở thêm giọng miễn phí (${allowed.size} giọng) tới hết ${formatDateVN(promoUntil)}`
            : `🎁 Promo: extra voices unlocked (${allowed.size} total) until ${formatDateVN(promoUntil)}`}
        </p>
      )}

      {/* Chế độ giọng ngẫu nhiên — áp dụng TOÀN BỘ trang (Từ điển, Chat, Luyện nói, Cụm từ...),
          vẫn giữ nguyên 1 giọng xuyên suốt trong 1 phiên/hội thoại, chỉ đổi khi mở tab mới hoặc
          bấm "Đổi giọng khác". Giới tính (Nữ/Nam chọn bên dưới) không đổi, chỉ đổi giọng cụ thể. */}
      <div className="flex items-center justify-between gap-2 bg-zinc-950/50 border border-zinc-800/60 rounded-xl px-3 py-2.5 mb-3">
        <div className="min-w-0">
          <label htmlFor="voice-random-toggle" className="text-sm font-medium text-white block">
            {isA ? '🎲 Giọng ngẫu nhiên' : '🎲 Random voice'}
          </label>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isA
              ? 'Đổi giọng cụ thể mỗi phiên (giữ nguyên giới tính), áp dụng mọi trang'
              : 'Changes the specific voice each session (same gender), applies everywhere'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {random && (
            <button
              type="button"
              onClick={() => {
                reshuffleRandomVoice()
                setVoice(getVoicePref())
              }}
              title={
                isA ? 'Đổi sang giọng ngẫu nhiên khác ngay' : 'Reshuffle to a different voice now'
              }
              className="tap-44 flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          )}
          <button
            id="voice-random-toggle"
            type="button"
            role="switch"
            aria-checked={random}
            onClick={toggleRandom}
            // [U9a, M20] Vùng chạm 44×44 (luật dự án), hình viên thuốc 44×24 VẼ BÊN TRONG: nút
            // trong suốt cao 44px, thanh trượt là <span> con. Trước đây cả nút chỉ cao 24px.
            className="tap-44 flex items-center justify-center rounded-full shrink-0"
          >
            <span
              aria-hidden="true"
              className={`relative w-11 h-6 rounded-full transition ${
                random ? 'bg-accent-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  random ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {groups.map(({ gender, label }) => (
        <div key={gender} className="mb-3 last:mb-0">
          <p className="text-xs text-zinc-400 mb-2">{label}</p>
          <div className="grid grid-cols-4 gap-2">
            {VOICE_OPTIONS.filter((v) => v.gender === gender).map((v) => {
              const isAllowed = allowed.has(v.id)
              const isSelected = voice === v.id
              const isSeeded = seeded.has(v.id)
              const isEleven = eleven.has(v.id)
              const isStudio = studio.has(v.id)
              const slowHint = isA ? ' (tạo lần đầu chậm hơn 1 chút)' : ' (slower on first play)'
              const elevenHint = isA ? ' — giọng đặc biệt VIP' : ' — special VIP voice'
              const studioHint = isA
                ? ' — giọng Studio cao cấp (VIP), chỉ tiếng Anh'
                : ' — premium Studio voice (VIP), English only'
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => choose(v.id)}
                  aria-disabled={!isAllowed}
                  title={
                    !isAllowed
                      ? isA
                        ? 'Nâng cấp gói VIP để mở khoá giọng này — bấm để xem gói'
                        : 'Upgrade to VIP to unlock this voice — tap to see plans'
                      : isEleven
                        ? `${v.id}${elevenHint}`
                        : isStudio
                          ? `${v.id}${studioHint}`
                          : isSeeded
                            ? v.id
                            : `${v.id}${slowHint}`
                  }
                  aria-pressed={isAllowed ? isSelected : undefined}
                  className={`tap-44-y relative flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium border transition ${
                    isSelected
                      ? 'bg-accent-500/20 border-accent-500/60 text-accent-300 theme-light:text-accent-800'
                      : isAllowed
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        : 'bg-zinc-900/50 border-zinc-800/60 text-content-muted hover:border-amber-500/50 hover:text-amber-400 cursor-pointer'
                  }`}
                >
                  {!isAllowed && <Lock className="w-3 h-3 shrink-0" />}
                  {voiceLabel(v)}
                  {isSeeded && isAllowed && <span aria-hidden>⚡</span>}
                  {isEleven && isAllowed && (
                    <span aria-hidden title="VIP">
                      ✨
                    </span>
                  )}
                  {isStudio && isAllowed && (
                    <span aria-hidden title="Studio — VIP">
                      🎓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-zinc-400 mt-1">
        {isA
          ? '⚡ = giọng phát ngay lập tức. Giọng khác chậm hơn 1 chút ở lần phát đầu tiên.'
          : '⚡ = plays instantly. Other voices are slightly slower the first time.'}
      </p>

      {/* Giọng GIẢI THÍCH (tiếng mẹ đẻ) — đọc phần sửa lỗi trong Luyện nói. Mặc định khác
          giọng hội thoại để người học phân biệt ngay "AI đang nói tiếng đích" và "AI đang
          giải thích" (xem getNativeVoicePref trong lib/tts.ts). */}
      <div className="mt-4 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <label htmlFor="native-voice-toggle" className="text-sm font-semibold text-white block">
              {isA ? '🗣️ Giọng giải thích riêng' : '🗣️ Separate explanation voice'}
            </label>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isA
                ? 'Phần sửa lỗi (tiếng Việt) đọc bằng giọng khác với câu hội thoại tiếng Anh'
                : 'Corrections (in English) are read by a different voice than the Vietnamese conversation'}
            </p>
          </div>
          <button
            id="native-voice-toggle"
            type="button"
            role="switch"
            aria-checked={nativeOn}
            onClick={toggleNative}
            // Cùng cách với công tắc giọng ngẫu nhiên phía trên: nút 44×44, viên thuốc vẽ bên trong.
            className="tap-44 flex items-center justify-center rounded-full shrink-0"
          >
            <span
              aria-hidden="true"
              className={`relative w-11 h-6 rounded-full transition ${
                nativeOn ? 'bg-accent-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  nativeOn ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>
        </div>

        {nativeOn && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {nativeChoices.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => chooseNative(v.id)}
                aria-pressed={nativeVoice === v.id}
                title={`${v.id} — ${v.gender === 'female' ? (isA ? 'Nữ' : 'Female') : isA ? 'Nam' : 'Male'}`}
                className={`tap-44-y flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium border transition ${
                  nativeVoice === v.id
                    ? 'bg-accent-500/20 border-accent-500/60 text-accent-300 theme-light:text-accent-800'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {voiceLabel(v)}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { effectivePlan } from '@dhcb/core-billing/promo'
import { clampVoiceToPlan } from './voiceAccess.js'

vi.mock('@dhcb/core-billing/promo', () => ({ effectivePlan: vi.fn() }))
const mockedEffectivePlan = vi.mocked(effectivePlan)

beforeEach(() => {
  mockedEffectivePlan.mockReset()
})

describe('clampVoiceToPlan', () => {
  it('free được đúng 4 giọng (2 nữ Kore/Aoede + 2 nam Puck/Charon)', async () => {
    mockedEffectivePlan.mockResolvedValue('free')
    expect(await clampVoiceToPlan('Kore', 'free')).toBe('Kore')
    expect(await clampVoiceToPlan('Aoede', 'free')).toBe('Aoede')
    expect(await clampVoiceToPlan('Puck', 'free')).toBe('Puck')
    expect(await clampVoiceToPlan('Charon', 'free')).toBe('Charon')
  })

  // 2026-08-10: hạ giọng GIỮ NGUYÊN GIỚI TÍNH (nữ→Kore, nam→Puck). Trước đây mọi trường hợp
  // đều về Kore nên user đang nghe giọng nam mà hết hạn gói bị đổi phắt sang giọng nữ.
  it('free: giọng ngoài 4 giọng đó bị hạ về giọng mặc định CÙNG GIỚI TÍNH', async () => {
    mockedEffectivePlan.mockResolvedValue('free')
    expect(await clampVoiceToPlan('Zephyr', 'free')).toBe('Kore') // nữ → nữ
    expect(await clampVoiceToPlan('Umbriel', 'free')).toBe('Puck') // nam → nam
  })

  // GĐ1 2026-09-12: gói Pro bị xoá; bộ 8 giọng seed sẵn của nó nay là mức KHUYẾN MÃI của Free
  // (PROMO_FREE_VOICES) — effectivePlan trả 'vip' khi khuyến mãi bật, nhưng quyền giọng KHÔNG
  // nâng lên VIP để tránh mở giọng Studio/ElevenLabs đắt tiền cho toàn bộ người dùng Free.
  it('free trong lúc khuyến mãi: 8 giọng seed sẵn — giọng ngoài (Umbriel) vẫn bị hạ', async () => {
    mockedEffectivePlan.mockResolvedValue('vip')
    expect(await clampVoiceToPlan('Zephyr', 'free')).toBe('Zephyr')
    expect(await clampVoiceToPlan('Umbriel', 'free')).toBe('Puck')
  })

  // Giọng Gemini (đọc truyện) chưa mở khoá → ưu tiên giọng Chirp3-HD CÙNG TÊN trước khi rơi
  // về mặc định, để giữ đúng "chất giọng" nhân vật của thể loại truyện.
  it('giọng Gemini ngoài quyền → hạ về giọng Chirp3-HD cùng tên nếu được phép', async () => {
    mockedEffectivePlan.mockResolvedValue('vip')
    // Free trong lúc khuyến mãi có Gemini → giữ nguyên
    expect(await clampVoiceToPlan('Gemini-Leda', 'free')).toBe('Gemini-Leda')
    mockedEffectivePlan.mockResolvedValue('free')
    // Free không có Gemini lẫn Leda → giọng mặc định cùng giới tính (nữ)
    expect(await clampVoiceToPlan('Gemini-Leda', 'free')).toBe('Kore')
    // Free không có Gemini lẫn Orus (nam) → Puck
    expect(await clampVoiceToPlan('Gemini-Orus', 'free')).toBe('Puck')
  })

  it('vip được dùng đủ 14 giọng — không giọng nào bị hạ', async () => {
    mockedEffectivePlan.mockResolvedValue('vip')
    expect(await clampVoiceToPlan('Umbriel', 'vip')).toBe('Umbriel')
    expect(await clampVoiceToPlan('Iapetus', 'vip')).toBe('Iapetus')
  })

  it('giọng ElevenLabs (Rachel) chỉ VIP THẬT mới dùng được — Free bị hạ về DEFAULT_VOICE', async () => {
    mockedEffectivePlan.mockResolvedValue('free')
    expect(await clampVoiceToPlan('Rachel', 'free')).toBe('Kore')
    // Kể cả khi khuyến mãi nâng hạn mức Free lên VIP, giọng đắt tiền vẫn KHÔNG mở.
    mockedEffectivePlan.mockResolvedValue('vip')
    expect(await clampVoiceToPlan('Rachel', 'free')).toBe('Kore')
  })

  it('vip được dùng giọng ElevenLabs (Rachel), không bị hạ', async () => {
    mockedEffectivePlan.mockResolvedValue('vip')
    expect(await clampVoiceToPlan('Rachel', 'vip')).toBe('Rachel')
  })

  it('giọng ElevenLabs bị hạ theo ĐÚNG GIỚI TÍNH: nữ → Kore, nam → Puck', async () => {
    mockedEffectivePlan.mockResolvedValue('free')
    for (const v of ['Alice', 'Matilda'] as const)
      expect(await clampVoiceToPlan(v, 'free')).toBe('Kore')
    for (const v of ['Eric', 'Daniel', 'Chris'] as const)
      expect(await clampVoiceToPlan(v, 'free')).toBe('Puck')
  })

  it('vip dùng được cả 6 giọng ElevenLabs, không giọng nào bị hạ', async () => {
    mockedEffectivePlan.mockResolvedValue('vip')
    for (const v of ['Rachel', 'Alice', 'Matilda', 'Eric', 'Daniel', 'Chris'] as const)
      expect(await clampVoiceToPlan(v, 'vip')).toBe(v)
  })

  // Quyết định 2026-07-27: Studio đắt gấp 12 lần Chirp3-HD ($24 vs $2 mỗi triệu ký tự, và
  // KHÔNG có hạn mức miễn phí) → chỉ VIP THẬT, kể cả trong lúc khuyến mãi.
  it('giọng Studio CHỈ VIP — Free bị hạ về mặc định cùng giới tính, cả khi khuyến mãi bật', async () => {
    mockedEffectivePlan.mockResolvedValue('free')
    expect(await clampVoiceToPlan('Studio-O', 'free')).toBe('Kore')
    mockedEffectivePlan.mockResolvedValue('vip')
    expect(await clampVoiceToPlan('Studio-O', 'free')).toBe('Kore')
    expect(await clampVoiceToPlan('Studio-Q', 'free')).toBe('Puck') // Studio-Q là giọng NAM
  })

  it('vip dùng được giọng Studio, không bị hạ', async () => {
    mockedEffectivePlan.mockResolvedValue('vip')
    expect(await clampVoiceToPlan('Studio-O', 'vip')).toBe('Studio-O')
    expect(await clampVoiceToPlan('Studio-Q', 'vip')).toBe('Studio-Q')
  })
})

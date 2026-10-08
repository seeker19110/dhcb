// Test /api/pronunciation — cache phát âm từ điển (Postgres + Google TTS).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const rateLimitOk = { value: true }
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk.value,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }

const query = vi.fn()
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query }) }))

const generateAudioFromGoogle = vi.fn()
const generateStudioAudioFromGoogle = vi.fn()
// CHỈ mock 2 hàm GỌI RA NGOÀI (Google TTS — tốn tiền, cần mạng) + VOICE_VERSION (để test cache
// không phải sửa mỗi lần đổi phiên bản giọng thật). Mọi thứ liên quan tới KIỂM TRA/CHUẨN HOÁ tên
// giọng dùng HÀM THẬT qua importOriginal.
//
// Vì sao bắt buộc: bản mock cũ tự chế lại danh sách giọng bằng CHỮ THƯỜNG (`['kore','puck']`) cho
// khớp việc handler tự `.toLowerCase()` — nên test xanh trong khi production trả 400 cho MỌI giọng
// client gửi lên (đều PascalCase) và người dùng chỉ nghe một giọng Web Speech (bug thật, PR #535).
// Mock tự viết lại logic của chính module bị mock là mock có thể "nói dối"; dùng hàm thật thì
// không thể lệch được nữa.
vi.mock('@dhcb/core-ai/googleTts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/core-ai/googleTts')>()),
  generateAudioFromGoogle: (...args: unknown[]) => generateAudioFromGoogle(...args),
  generateStudioAudioFromGoogle: (...args: unknown[]) => generateStudioAudioFromGoogle(...args),
  VOICE_VERSION: 'v3',
}))

const saveAudio = vi.fn()
// isServableUrl dùng bản THẬT — xem ghi chú cùng loại trong packages/core-ai/tts.test.ts.
vi.mock('@dhcb/core-ai/fileStorage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/core-ai/fileStorage')>()),
  saveAudio: (...args: unknown[]) => saveAudio(...args),
}))

const ensureProfileRow = vi.fn()
vi.mock('@dhcb/core-auth/authService', () => ({
  ensureProfileRow: (...args: unknown[]) => ensureProfileRow(...args),
}))

const clampVoiceToPlan = vi.fn()
vi.mock('@dhcb/core-ai/voiceAccess', () => ({
  clampVoiceToPlan: (...args: unknown[]) => clampVoiceToPlan(...args),
}))

vi.mock('@dhcb/core-ai/elevenLabsTts', () => ({
  isValidElevenVoice: () => false,
}))

// Đếm lượt AI (Free/VIP): chỉ mock 2 hàm handler gọi. Logic đếm nguyên tử/fail-closed thật đã có
// test riêng ở packages/core-billing/usage.test.ts — ở đây chỉ canh handler gọi ĐÚNG lúc.
const checkAndConsumeUsage = vi.fn()
const refundUsage = vi.fn()
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: (...args: unknown[]) => checkAndConsumeUsage(...args),
  refundUsage: (...args: unknown[]) => refundUsage(...args),
}))
const CHARGED_DAY = '2026-10-08'

async function importHandler() {
  vi.resetModules()
  const mod = await import('./pronunciation.js')
  return mod.default
}

function makeRequest(qs = 'word=apple'): Request {
  return new Request(`http://localhost/api/pronunciation?${qs}`)
}

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  authState.user = { userId: 'user-1' }
  rateLimitOk.value = true
  query.mockReset()
  generateAudioFromGoogle.mockReset()
  generateStudioAudioFromGoogle.mockReset()
  saveAudio.mockReset()
  ensureProfileRow.mockReset().mockResolvedValue({ plan: 'free' })
  clampVoiceToPlan.mockReset().mockImplementation((v: string) => Promise.resolve(v))
  // Ca "lấy pool lỗi" dùng vi.doMock (không bị restoreAllMocks gỡ) → dựng lại pool chuẩn trước
  // MỖI ca để thứ tự chạy test không làm ca sau nhận nhầm pool hỏng.
  vi.doMock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query }) }))
  checkAndConsumeUsage.mockReset().mockResolvedValue({ ok: true, day: CHARGED_DAY })
  refundUsage.mockReset().mockResolvedValue(undefined)
})

describe('/api/pronunciation', () => {
  it('OPTIONS → 204', async () => {
    const handler = await importHandler()
    const res = await handler(
      new Request('http://localhost/api/pronunciation', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('method khác GET → 405', async () => {
    const handler = await importHandler()
    const res = await handler(new Request('http://localhost/api/pronunciation', { method: 'POST' }))
    expect(res.status).toBe(405)
  })

  it('vượt rate limit → 429', async () => {
    rateLimitOk.value = false
    const handler = await importHandler()
    const res = await handler(makeRequest())
    expect(res.status).toBe(429)
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const handler = await importHandler()
    const res = await handler(makeRequest())
    expect(res.status).toBe(401)
  })

  it('lang không hợp lệ → 400', async () => {
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&lang=fr-FR'))
    expect(res.status).toBe(400)
  })

  it('thiếu word → 400', async () => {
    const handler = await importHandler()
    const res = await handler(makeRequest(''))
    expect(res.status).toBe(400)
  })

  it('word chứa ký tự lạ → 400', async () => {
    const handler = await importHandler()
    // `<` `>` `|` vẫn nằm ngoài allowlist (dấu câu tiếng Việt đã được mở từ 2026-08-13, xem
    // WORD_SAFE_PATTERN — nên `;` KHÔNG còn là ca "ký tự lạ" nữa).
    for (const qs of ['word=apple%3Cscript%3E', 'word=a%7Cb']) {
      const res = await handler(makeRequest(qs))
      expect(res.status).toBe(400)
    }
  })

  it('word quá dài (>100 ký tự) → 400', async () => {
    const handler = await importHandler()
    const res = await handler(makeRequest(`word=${'a'.repeat(101)}`))
    expect(res.status).toBe(400)
  })

  // Chiều B đọc NGHĨA tiếng Việt của thẻ từ — hầu hết là cụm nhiều vế có dấu phẩy/ngoặc.
  // Trước 2026-08-13 những chuỗi này bị 400 rồi rơi về Web Speech ("chữ Việt đọc giọng Anh").
  it('nghĩa tiếng Việt nhiều vế (phẩy, ngoặc, chấm phẩy, gạch chéo) → chấp nhận', async () => {
    for (const text of [
      'bỏ rơi, từ bỏ',
      'trên (tàu, xe, máy bay)',
      'có cồn; thuộc về người nghiện rượu',
      'có thể/có khả năng',
    ]) {
      query.mockReset()
      query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      generateAudioFromGoogle.mockReset().mockResolvedValue(new ArrayBuffer(8))
      saveAudio.mockReset().mockResolvedValue('https://cdn/vi.mp3')
      const handler = await importHandler()
      const res = await handler(
        makeRequest(`word=${encodeURIComponent(text)}&voice=Kore&lang=vi-VN`),
      )
      expect(res.status).toBe(200)
      expect(generateAudioFromGoogle).toHaveBeenCalledWith(text, 'Kore', 'vi-VN')
    }
  })

  it('voice không hợp lệ → 400', async () => {
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=unknown'))
    expect(res.status).toBe(400)
  })

  it('cache HIT (voice_version khớp) → trả audio_url luôn, không gọi Google TTS', async () => {
    query
      .mockResolvedValueOnce({
        rows: [{ audio_url: 'https://cdn/apple.mp3', voice_version: 'v3' }],
      }) // select cache
      .mockResolvedValueOnce({ rows: [] }) // update last_accessed_at
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=kore'))
    expect(res.status).toBe(200)
    const data = (await res.json()) as { audio_url: string; cached: boolean }
    expect(data.audio_url).toBe('https://cdn/apple.mp3')
    expect(data.cached).toBe(true)
    expect(generateAudioFromGoogle).not.toHaveBeenCalled()
  })

  it('cache MISS (voice_version cũ) → gọi Google TTS, lưu file + DB, trả cached:false', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ audio_url: 'old.mp3', voice_version: 'old' }] }) // select cache cũ
      .mockResolvedValueOnce({ rows: [] }) // insert/upsert
    generateAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockResolvedValue('https://cdn/apple-new.mp3')
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=kore'))
    expect(res.status).toBe(200)
    const data = (await res.json()) as { audio_url: string; cached: boolean }
    expect(data.audio_url).toBe('https://cdn/apple-new.mp3')
    expect(data.cached).toBe(false)
    expect(generateAudioFromGoogle).toHaveBeenCalled()
    expect(saveAudio).toHaveBeenCalled()
  })

  it('cache MISS + rate limit tạo audio mới bị chặn → 429', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // select cache — không có
    let call = 0
    rateLimitOk.value = true
    // Rate limit thứ 2 (pron-gen) fail — mock checkRateLimit qua module state phức tạp, nên
    // dùng cách đơn giản: override module mock trực tiếp trong test này.
    const security = await import('@dhcb/core-auth/security')
    vi.spyOn(security, 'checkRateLimit').mockImplementation(async () => {
      call++
      return call === 1 // lần 1 (chung) qua, lần 2 (pron-gen) chặn
    })
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=kore'))
    expect(res.status).toBe(429)
  })

  it('Google TTS lỗi → 500', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    generateAudioFromGoogle.mockRejectedValue(new Error('quota exceeded'))
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=kore'))
    expect(res.status).toBe(500)
  })

  it('saveAudio lỗi → 500', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    generateAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockRejectedValue(new Error('storage down'))
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=kore'))
    expect(res.status).toBe(500)
  })

  it('lưu DB lỗi sau khi tạo audio thành công → vẫn trả 200 (best-effort)', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockRejectedValueOnce(new Error('db error'))
    generateAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockResolvedValue('https://cdn/apple.mp3')
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=kore'))
    expect(res.status).toBe(200)
  })

  it('voice Studio dùng cho tiếng Việt → hạ về Chirp3-HD (fallback)', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    generateAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockResolvedValue('https://cdn/tu.mp3')
    const handler = await importHandler()
    const res = await handler(makeRequest('word=t%E1%BB%AB&voice=studio-o&lang=vi-VN'))
    expect(res.status).toBe(200)
    expect(generateStudioAudioFromGoogle).not.toHaveBeenCalled()
    expect(generateAudioFromGoogle).toHaveBeenCalledWith('từ', 'Kore', 'vi-VN')
  })

  // Hồi quy: client LUÔN gửi tên giọng dạng PascalCase ("Puck", "Aoede"). Handler từng
  // toLowerCase() tham số này rồi mới kiểm hợp lệ → 400 cho mọi giọng, nút loa rơi về Web
  // Speech nên người dùng chỉ nghe một giọng duy nhất dù đổi cài đặt.
  it('voice PascalCase từ client → 200 và giữ ĐÚNG giọng đó', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    generateAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockResolvedValue('https://cdn/apple-puck.mp3')
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Puck'))
    expect(res.status).toBe(200)
    expect(generateAudioFromGoogle).toHaveBeenCalledWith('apple', 'Puck', 'en-US')
  })

  it('voice Studio hợp lệ (tiếng Anh) → gọi generateStudioAudioFromGoogle', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    generateStudioAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockResolvedValue('https://cdn/apple-studio.mp3')
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=studio-o'))
    expect(res.status).toBe(200)
    expect(generateStudioAudioFromGoogle).toHaveBeenCalled()
  })

  it('lấy pool lỗi (chưa cấu hình DATABASE_URL) → 500', async () => {
    vi.resetModules()
    vi.doMock('@dhcb/core-db/pgPool', () => ({
      getPgPool: () => {
        throw new Error('DATABASE_URL chưa cấu hình')
      },
    }))
    const mod = await import('./pronunciation.js')
    const res = await mod.default(makeRequest('word=apple&voice=kore'))
    expect(res.status).toBe(500)
  })
})

// Đề xuất (b) của audit 0526 (chủ dự án duyệt 2026-10-08): đường cache MISS gọi Google TTS tốn
// tiền nên phải trừ lượt Free/VIP — cùng khuôn /api/tts. Cache HIT vẫn miễn phí.
describe('/api/pronunciation — trừ lượt AI khi cache MISS', () => {
  function missThenUpsert() {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
  }

  it('cache HIT không trừ lượt — kể cả khi đã hết lượt', async () => {
    checkAndConsumeUsage.mockResolvedValue({ ok: false, message: 'Hết lượt' })
    query
      .mockResolvedValueOnce({
        rows: [{ audio_url: 'https://cdn/apple.mp3', voice_version: 'v3' }],
      })
      .mockResolvedValueOnce({ rows: [] })
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Kore'))
    expect(res.status).toBe(200)
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
    expect(refundUsage).not.toHaveBeenCalled()
    expect(generateAudioFromGoogle).not.toHaveBeenCalled()
  })

  it('cache MISS trừ ĐÚNG 1 lượt speaking của user, TRƯỚC khi gọi Google', async () => {
    missThenUpsert()
    generateAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockResolvedValue('https://cdn/apple.mp3')
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Kore'))
    expect(res.status).toBe(200)
    expect(checkAndConsumeUsage).toHaveBeenCalledExactlyOnceWith('user-1', 'speaking')
    expect(checkAndConsumeUsage.mock.invocationCallOrder[0]).toBeLessThan(
      generateAudioFromGoogle.mock.invocationCallOrder[0]!,
    )
    expect(refundUsage).not.toHaveBeenCalled()
  })

  it('hết lượt → 429 kèm đúng thông điệp của cổng, KHÔNG gọi Google, không lưu gì', async () => {
    const message = 'Bạn đã dùng hết lượt hôm nay. Thử lại vào ngày mai nhé.'
    checkAndConsumeUsage.mockResolvedValue({ ok: false, message })
    query.mockResolvedValueOnce({ rows: [] })
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Kore'))
    expect(res.status).toBe(429)
    expect(((await res.json()) as { error: string }).error).toBe(message)
    expect(generateAudioFromGoogle).not.toHaveBeenCalled()
    expect(generateStudioAudioFromGoogle).not.toHaveBeenCalled()
    expect(saveAudio).not.toHaveBeenCalled()
    expect(query).toHaveBeenCalledTimes(1) // chỉ câu tra cache, không upsert
    expect(refundUsage).not.toHaveBeenCalled()
  })

  it('cầu dao AI / lỗi xác minh lượt (fail-closed) → 429, KHÔNG gọi Google', async () => {
    checkAndConsumeUsage.mockResolvedValue({
      ok: false,
      message: 'Hệ thống AI đang tạm dừng để bảo trì. Vui lòng thử lại sau ít phút.',
    })
    query.mockResolvedValueOnce({ rows: [] })
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Studio-O'))
    expect(res.status).toBe(429)
    expect(generateStudioAudioFromGoogle).not.toHaveBeenCalled()
  })

  it('Google lỗi → hoàn lượt vào ĐÚNG ngày đã trừ', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    generateAudioFromGoogle.mockRejectedValue(new Error('upstream 500'))
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Kore'))
    expect(res.status).toBe(500)
    expect(refundUsage).toHaveBeenCalledExactlyOnceWith('user-1', 'speaking', CHARGED_DAY)
  })

  it('lưu file lỗi SAU khi Google đã trả audio → không hoàn (tiền API đã tốn, như /api/tts)', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    generateAudioFromGoogle.mockResolvedValue(new ArrayBuffer(8))
    saveAudio.mockRejectedValue(new Error('storage down'))
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Kore'))
    expect(res.status).toBe(500)
    expect(checkAndConsumeUsage).toHaveBeenCalledOnce()
    expect(refundUsage).not.toHaveBeenCalled()
  })

  it('bị rate limit tạo audio mới (pron-gen) → không trừ lượt', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    let call = 0
    const security = await import('@dhcb/core-auth/security')
    vi.spyOn(security, 'checkRateLimit').mockImplementation(async () => {
      call++
      return call === 1
    })
    const handler = await importHandler()
    const res = await handler(makeRequest('word=apple&voice=Kore'))
    expect(res.status).toBe(429)
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
  })

  it('tham số không hợp lệ (400) → không trừ lượt', async () => {
    const handler = await importHandler()
    for (const qs of ['word=a%7Cb', 'word=apple&voice=unknown', 'word=apple&lang=fr-FR']) {
      expect((await handler(makeRequest(qs))).status).toBe(400)
    }
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
  })
})

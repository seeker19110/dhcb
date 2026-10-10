// Test handler /api/tts (packages/core-ai/tts.ts) — mock toàn bộ lớp ngoài (Postgres, Google
// TTS, ElevenLabs, storage, auth/security) để test OFFLINE, không tốn tiền API thật.
//
// Trọng tâm: luồng cache HIT/MISS, cơ chế "claim" chống race condition, chọn nhánh provider
// (Google Chirp3-HD / Studio / ElevenLabs), và các nhánh lỗi (quota 429, lưu file lỗi, DB lỗi).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: vi.fn(async () => ({ ok: true, day: '2026-09-27' })),
  refundUsage: vi.fn(async () => {}),
}))
vi.mock('@dhcb/core-db/settings', () => ({ getAppSettings: vi.fn() }))
vi.mock('@dhcb/core-auth/guestTrial', () => ({
  checkAndConsumeGuestTrial: vi.fn(async () => ({ ok: true })),
  refundGuestTrial: vi.fn(async () => {}),
}))
vi.mock('./googleTts.js', () => ({
  generateAudioFromGoogle: vi.fn(),
  generateStudioAudioFromGoogle: vi.fn(),
  isValidVoice: (v: string) => ['Kore', 'Aoede', 'Puck'].includes(v),
  isValidStudioVoice: (v: string) => ['Studio-O', 'Studio-Q'].includes(v),
  DEFAULT_VOICE: 'Kore',
  VOICE_VERSION: 'v-test',
}))
vi.mock('./elevenLabsTts.js', () => ({
  generateAudioFromElevenLabs: vi.fn(),
  isValidElevenVoice: (v: string) => v === 'Rachel',
}))
vi.mock('./visemeTimeline.js', () => ({
  visemeTimelineFromAlignment: vi.fn(async () => [{ viseme: 'A', startMs: 0, endMs: 100 }]),
}))
vi.mock('@dhcb/core-auth/authService', () => ({
  ensureProfileRow: vi.fn(async () => ({ plan: 'free' })),
}))
vi.mock('./voiceAccess.js', () => ({
  clampVoiceToPlan: vi.fn(async (voice: string) => voice),
}))
// isServableUrl dùng bản THẬT (không mock): test không đặt STORAGE_DRIVER=r2 nên nó ở chế độ
// local và trả true cho mọi URL — giữ nguyên hành vi các test có sẵn. Ca r2 được phủ riêng
// trong fileStorage.test.ts.
vi.mock('./fileStorage.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./fileStorage.js')>()),
  saveAudio: vi.fn(async () => 'https://cdn.test/audio.mp3'),
}))
vi.mock('./ttsCrypto.js', () => ({
  // Khớp chữ ký thật sau audit 2026-08-12: trả { cipher, iv_b64 } — iv ngẫu nhiên mỗi lần
  // mã hoá và được lưu vào cột tts_cache.iv (migration 0038).
  encryptAudio: vi.fn(async (buf: ArrayBuffer) => ({ cipher: buf, iv_b64: 'iv-moi' })),
  getClientKeyMaterial: vi.fn(async () => ({ key_b64: 'key', iv_b64: 'iv' })),
}))
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => ({ userId: 'user-test' }),
  validateContentType: () => true,
  logSecurityEvent: () => {},
}))

import handler, { TOUCH_TTS_CACHE_SQL } from './tts.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { generateAudioFromGoogle, generateStudioAudioFromGoogle } from './googleTts.js'
import { generateAudioFromElevenLabs } from './elevenLabsTts.js'
import { saveAudio } from './fileStorage.js'
import * as security from '@dhcb/core-auth/security'
import { ensureProfileRow } from '@dhcb/core-auth/authService'
import { clampVoiceToPlan } from './voiceAccess.js'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { getAppSettings } from '@dhcb/core-db/settings'
import { checkAndConsumeGuestTrial, refundGuestTrial } from '@dhcb/core-auth/guestTrial'
import * as guest from '@dhcb/core-auth/guest'
import * as concurrency from '@dhcb/core-db/concurrencyLimiter'

const mockedGetPool = vi.mocked(getPgPool)
const mockedGenGoogle = vi.mocked(generateAudioFromGoogle)
const mockedGenStudio = vi.mocked(generateStudioAudioFromGoogle)
const mockedGenEleven = vi.mocked(generateAudioFromElevenLabs)
const mockedSaveAudio = vi.mocked(saveAudio)

function makeRequest(body?: object): Request {
  return new Request('http://localhost/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
    body: JSON.stringify(body ?? { text: 'Xin chào', lang: 'en-US', voice: 'Kore' }),
  })
}

// Pool giả — query() được lái bằng danh sách handler khớp theo chuỗi SQL chứa 1 từ khoá.
// Đơn giản hoá bằng cách cho từng test tự set `queryImpl`.
type QueryFn = (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
function makePool(queryImpl: QueryFn) {
  return { query: vi.fn(queryImpl) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGenGoogle.mockResolvedValue(new ArrayBuffer(8))
  mockedSaveAudio.mockResolvedValue('https://cdn.test/audio.mp3')
  vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: true, day: '2026-09-27' })
  vi.mocked(getAppSettings).mockResolvedValue({ aiCircuitBreaker: false } as Awaited<
    ReturnType<typeof getAppSettings>
  >)
  vi.mocked(checkAndConsumeGuestTrial).mockResolvedValue({ ok: true })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handler /api/tts — cổng vào', () => {
  it('OPTIONS → 204', async () => {
    const res = await handler(new Request('http://localhost/api/tts', { method: 'OPTIONS' }))
    expect(res.status).toBe(204)
  })

  it('GET → 405', async () => {
    const res = await handler(new Request('http://localhost/api/tts', { method: 'GET' }))
    expect(res.status).toBe(405)
  })

  it('Content-Type sai → 415', async () => {
    vi.spyOn(security, 'validateContentType').mockReturnValueOnce(false)
    const res = await handler(makeRequest())
    expect(res.status).toBe(415)
  })

  it('Rate limit vượt quá → 429', async () => {
    vi.spyOn(security, 'checkRateLimit').mockResolvedValueOnce(false)
    const res = await handler(makeRequest())
    expect(res.status).toBe(429)
  })

  it('Chưa đăng nhập → 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const res = await handler(makeRequest())
    expect(res.status).toBe(401)
  })

  it('Thiếu text → 400', async () => {
    const res = await handler(makeRequest({ text: '' }))
    expect(res.status).toBe(400)
  })

  it('Text quá dài (> 4000 ký tự) → 413', async () => {
    const res = await handler(makeRequest({ text: 'a'.repeat(4001) }))
    expect(res.status).toBe(413)
  })

  it('Body không phải JSON → 400', async () => {
    const res = await handler(
      new Request('http://localhost/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
        body: 'không phải json',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('Không khởi tạo được Postgres pool → 500', async () => {
    mockedGetPool.mockImplementation(() => {
      throw new Error('no DATABASE_URL')
    })
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
  })
})

describe('handler /api/tts — cache HIT', () => {
  it('câu đã cache → trả audio ngay, cached:true, không gọi Google TTS', async () => {
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => {
        if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
          return { rows: [{ audio_url: 'https://cdn.test/cached.mp3', viseme_timeline: null }] }
        return { rows: [] }
      }) as never,
    )
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { cached: boolean; audio_url: string }
    expect(data.cached).toBe(true)
    expect(data.audio_url).toBe('https://cdn.test/cached.mp3')
    expect(mockedGenGoogle).not.toHaveBeenCalled()
  })

  it('trúng cache chỉ đánh dấu last_accessed_at khi mốc cũ hơn 1 ngày (E2.4)', async () => {
    const seen: string[] = []
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => {
        seen.push(sql)
        if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
          return { rows: [{ audio_url: 'https://cdn.test/cached.mp3', viseme_timeline: null }] }
        return { rows: [] }
      }) as never,
    )
    await handler(makeRequest())
    expect(seen).toContain(TOUCH_TTS_CACHE_SQL)
    expect(TOUCH_TTS_CACHE_SQL).toContain("last_accessed_at < now() - interval '1 day'")
  })
})

// Client PHẢI biết giọng server THẬT SỰ dùng: nó quyết định định dạng audio (Gemini = WAV,
// còn lại = mp3) → quyết định mimeType lúc tạo Blob. Trước 2026-08-10 response không có
// trường này nên gói Free mở trang đọc truyện bị gắn nhầm audio/wav cho dữ liệu mp3.
describe('handler /api/tts — trả về giọng THẬT SỰ đã dùng', () => {
  it('giọng bị hạ theo gói → response trả giọng đã hạ, không phải giọng client gửi lên', async () => {
    vi.mocked(clampVoiceToPlan).mockResolvedValueOnce('Kore')
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => {
        if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
          return { rows: [{ audio_url: 'https://cdn.test/cached.mp3', viseme_timeline: null }] }
        return { rows: [] }
      }) as never,
    )
    const res = await handler(
      makeRequest({ text: 'Ngày xửa', lang: 'vi-VN', voice: 'Gemini-Leda' }),
    )
    const data = (await res.json()) as { voice: string }
    expect(data.voice).toBe('Kore')
  })

  it('cache MISS (sinh audio mới) cũng trả kèm giọng đã dùng', async () => {
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => {
        if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
          return { rows: [] }
        if (sql.startsWith('insert into public.tts_cache_pending')) return { rows: [{ hash: 'h' }] }
        return { rows: [] }
      }) as never,
    )
    const res = await handler(makeRequest())
    const data = (await res.json()) as { voice: string; cached: boolean }
    expect(data.cached).toBe(false)
    expect(data.voice).toBe('Kore')
  })
})

describe('handler /api/tts — cache MISS, leader sinh audio (Google Chirp3-HD)', () => {
  function poolLeaderFlow(): QueryFn {
    return async (sql) => {
      if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
        return { rows: [] } // chưa có cache
      if (sql.startsWith('insert into public.tts_cache_pending')) return { rows: [{ hash: 'h' }] } // giành được quyền leader
      return { rows: [] }
    }
  }

  it('sinh audio mới bằng Google, lưu file + DB, trả cached:false', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { cached: boolean; audio_url: string }
    expect(data.cached).toBe(false)
    expect(data.audio_url).toBe('https://cdn.test/audio.mp3')
    expect(mockedGenGoogle).toHaveBeenCalledTimes(1)
    expect(mockedSaveAudio).toHaveBeenCalledTimes(1)
  })

  it('Vượt rate limit tạo audio mới (tts-gen) → 429', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    vi.spyOn(security, 'checkRateLimit').mockImplementation(
      async (_ip: string, _limit?: number, bucket?: string) => bucket !== 'tts-gen',
    )
    const res = await handler(makeRequest())
    expect(res.status).toBe(429)
    expect(mockedGenGoogle).not.toHaveBeenCalled()
  })

  it('Google TTS hết quota (429/RESOURCE_EXHAUSTED) → 503 kèm fallback + Retry-After', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    mockedGenGoogle.mockRejectedValueOnce(new Error('RESOURCE_EXHAUSTED (429)'))
    const res = await handler(makeRequest())
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('60')
    const data = (await res.json()) as { fallback: boolean }
    expect(data.fallback).toBe(true)
  })

  it('Google TTS lỗi khác (không phải quota) → 500', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    mockedGenGoogle.mockRejectedValueOnce(new Error('network down'))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
  })

  it('saveAudio lỗi → 500', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    mockedSaveAudio.mockRejectedValueOnce(new Error('disk full'))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
  })

  it('Lưu DB tts_cache lỗi → vẫn trả 200 (audio đã tạo/lưu file thành công)', async () => {
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => {
        if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
          return { rows: [] }
        if (sql.startsWith('insert into public.tts_cache_pending')) return { rows: [{ hash: 'h' }] }
        if (sql.startsWith('insert into public.tts_cache')) throw new Error('db down')
        return { rows: [] }
      }) as never,
    )
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
  })
})

describe('handler /api/tts — khoá claim cũ (leader trước crash) tự dọn rồi thử claim lại', () => {
  it('khoá pending quá hạn (> 30s) → xoá khoá cũ rồi claim lại thành công, tự làm leader', async () => {
    let insertCount = 0
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => {
        if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
          return { rows: [] }
        if (sql.startsWith('insert into public.tts_cache_pending')) {
          insertCount += 1
          // Lần đầu thua claim (khoá cũ còn đó), lần 2 (sau khi dọn) thắng claim.
          return insertCount === 1 ? { rows: [] } : { rows: [{ hash: 'h' }] }
        }
        if (sql.startsWith('select created_at from public.tts_cache_pending'))
          return { rows: [{ created_at: new Date(Date.now() - 40_000).toISOString() }] } // > 30s, đã hết hạn
        if (sql.startsWith('delete from public.tts_cache_pending')) return { rows: [] }
        return { rows: [] }
      }) as never,
    )
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    expect(insertCount).toBe(2)
    expect(mockedGenGoogle).toHaveBeenCalledTimes(1)
  })
})

describe('handler /api/tts — follower nhận kết quả cache từ leader (claim thua)', () => {
  it('claim thua nhưng leader đã sinh xong → trả luôn kết quả cache, không gọi Google', async () => {
    // Đếm số lần gọi câu SELECT tts_cache: lần 1 = kiểm tra cache ban đầu (chưa có),
    // lần 2 = kiểm tra lại BÊN TRONG claimTtsGeneration sau khi thua claim (đã có, do leader
    // vừa xong). Không thể phân biệt 2 câu này bằng text (giống hệt nhau) nên dùng thứ tự gọi.
    let cacheSelectCount = 0
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => {
        if (
          sql.startsWith('select audio_url, viseme_timeline, iv from public.tts_cache where hash')
        ) {
          cacheSelectCount += 1
          if (cacheSelectCount === 1) return { rows: [] } // chưa có cache lần đầu kiểm tra
          return { rows: [{ audio_url: 'https://cdn.test/leader.mp3', viseme_timeline: null }] }
        }
        if (sql.startsWith('insert into public.tts_cache_pending')) return { rows: [] } // thua claim
        if (sql.startsWith('select created_at from public.tts_cache_pending'))
          return { rows: [{ created_at: new Date().toISOString() }] } // khoá còn mới (không stale)
        return { rows: [] }
      }) as never,
    )
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { cached: boolean; audio_url: string }
    expect(data.cached).toBe(true)
    expect(data.audio_url).toBe('https://cdn.test/leader.mp3')
    expect(mockedGenGoogle).not.toHaveBeenCalled()
  })
})

describe('handler /api/tts — giọng ElevenLabs (VIP) và Studio', () => {
  function poolLeaderFlow(): QueryFn {
    return async (sql) => {
      if (sql.includes('select audio_url, viseme_timeline, iv from public.tts_cache where'))
        return { rows: [] }
      if (sql.startsWith('insert into public.tts_cache_pending')) return { rows: [{ hash: 'h' }] }
      return { rows: [] }
    }
  }

  beforeEach(() => {
    vi.mocked(clampVoiceToPlan).mockImplementation(async (voice) => voice)
    vi.mocked(ensureProfileRow).mockResolvedValue({ plan: 'vip' } as never)
  })

  it('giọng Rachel (ElevenLabs) → gọi generateAudioFromElevenLabs, có viseme timeline', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    mockedGenEleven.mockResolvedValueOnce({
      audio: new ArrayBuffer(8),
      alignment: {
        characters: ['a'],
        character_start_times_seconds: [0],
        character_end_times_seconds: [0.1],
      },
    })
    const res = await handler(makeRequest({ text: 'Hello', lang: 'en-US', voice: 'Rachel' }))
    expect(res.status).toBe(200)
    const data = (await res.json()) as { viseme_timeline: unknown }
    expect(mockedGenEleven).toHaveBeenCalledTimes(1)
    expect(data.viseme_timeline).not.toBeNull()
  })

  it('dựng viseme timeline lỗi → không làm hỏng audio, viseme_timeline trả về null', async () => {
    const { visemeTimelineFromAlignment } = await import('./visemeTimeline.js')
    vi.mocked(visemeTimelineFromAlignment).mockRejectedValueOnce(new Error('espeak-ng missing'))
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    mockedGenEleven.mockResolvedValueOnce({
      audio: new ArrayBuffer(8),
      alignment: {
        characters: ['a'],
        character_start_times_seconds: [0],
        character_end_times_seconds: [0.1],
      },
    })
    const res = await handler(makeRequest({ text: 'Hello', lang: 'en-US', voice: 'Rachel' }))
    expect(res.status).toBe(200)
    const data = (await res.json()) as { viseme_timeline: unknown }
    expect(data.viseme_timeline).toBeNull()
  })

  it('giọng Studio-O với lang en-US → gọi generateStudioAudioFromGoogle', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    mockedGenStudio.mockResolvedValueOnce(new ArrayBuffer(8))
    const res = await handler(makeRequest({ text: 'Hello', lang: 'en-US', voice: 'Studio-O' }))
    expect(res.status).toBe(200)
    expect(mockedGenStudio).toHaveBeenCalledTimes(1)
  })

  it('giọng Studio nhưng lang vi-VN → tự hạ về Chirp3-HD tương ứng (Kore), không gọi Studio', async () => {
    mockedGetPool.mockReturnValue(makePool(poolLeaderFlow()) as never)
    const res = await handler(makeRequest({ text: 'Xin chào', lang: 'vi-VN', voice: 'Studio-O' }))
    expect(res.status).toBe(200)
    expect(mockedGenStudio).not.toHaveBeenCalled()
    expect(mockedGenGoogle).toHaveBeenCalledWith('Xin chào', 'Kore', 'vi-VN')
  })
})

describe('TTS — ngân sách AI chung cho cache MISS', () => {
  beforeEach(() => {
    mockedGetPool.mockReturnValue(
      makePool(async (sql) => ({
        rows: sql.startsWith('insert into public.tts_cache_pending') ? [{ hash: 'h' }] : [],
      })) as never,
    )
  })
  it('cache MISS trừ một lượt speaking trước provider', async () => {
    expect((await handler(makeRequest())).status).toBe(200)
    expect(checkAndConsumeUsage).toHaveBeenCalledExactlyOnceWith('user-test', 'speaking')
    expect(vi.mocked(checkAndConsumeUsage).mock.invocationCallOrder[0]).toBeLessThan(
      mockedGenGoogle.mock.invocationCallOrder[0]!,
    )
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it.each(['Hết lượt hôm nay', 'Cầu dao AI đang bật'])(
    'chặn provider nếu ngân sách từ chối: %s',
    async (message) => {
      vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: false, message })
      expect((await handler(makeRequest())).status).toBe(429)
      expect(mockedGenGoogle).not.toHaveBeenCalled()
      expect(refundUsage).not.toHaveBeenCalled()
      expect(mockedGetPool().query).toHaveBeenCalledWith(
        'delete from public.tts_cache_pending where hash = $1',
        expect.any(Array),
      )
    },
  )
  it('cache HIT bỏ qua gate dù hết quota/cầu dao bật', async () => {
    vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: false, message: 'Hết lượt' })
    mockedGetPool.mockReturnValue(
      makePool(async () => ({ rows: [{ audio_url: 'https://cdn.test/cached.mp3' }] })) as never,
    )
    expect((await handler(makeRequest())).status).toBe(200)
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
    expect(getAppSettings).not.toHaveBeenCalled()
    expect(mockedGenGoogle).not.toHaveBeenCalled()
  })
  it('hoàn đúng ngày khi hàng đợi lỗi trước khi gọi provider', async () => {
    vi.spyOn(concurrency, 'withConcurrencyLimit').mockRejectedValueOnce(new Error('Queue stopped'))
    expect((await handler(makeRequest())).status).toBe(500)
    expect(mockedGenGoogle).not.toHaveBeenCalled()
    expect(refundUsage).toHaveBeenCalledExactlyOnceWith('user-test', 'speaking', '2026-09-27')
  })
  it('không hoàn lượt đã tốn provider khi lưu file thất bại', async () => {
    mockedSaveAudio.mockRejectedValueOnce(new Error('Storage failed'))
    expect((await handler(makeRequest())).status).toBe(500)
    expect(mockedGenGoogle).toHaveBeenCalledOnce()
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it('provider hết quota (503) → hoàn đúng ngày, không để người dùng mất lượt vô ích', async () => {
    mockedGenGoogle.mockRejectedValueOnce(new Error('Google TTS lỗi (429): RESOURCE_EXHAUSTED'))
    expect((await handler(makeRequest())).status).toBe(503)
    expect(mockedGenGoogle).toHaveBeenCalledOnce()
    expect(refundUsage).toHaveBeenCalledExactlyOnceWith('user-test', 'speaking', '2026-09-27')
  })
  it('provider lỗi khác (500) → KHÔNG hoàn lượt', async () => {
    mockedGenGoogle.mockRejectedValueOnce(new Error('Google TTS lỗi (400): bad request'))
    expect((await handler(makeRequest())).status).toBe(500)
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it('khách: provider hết quota → hoàn lượt dùng thử', async () => {
    vi.spyOn(guest, 'resolveActor').mockResolvedValue({ kind: 'guest', guestKey: 'guest-1' })
    mockedGenGoogle.mockRejectedValueOnce(new Error('quota exceeded'))
    expect((await handler(makeRequest())).status).toBe(503)
    expect(refundGuestTrial).toHaveBeenCalledOnce()
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it('hai MISS đồng thời của một user vẫn đi qua gate nguyên tử cho từng lần', async () => {
    vi.mocked(checkAndConsumeUsage)
      .mockResolvedValueOnce({ ok: true, day: '2026-09-27' })
      .mockResolvedValueOnce({ ok: false, message: 'Hết lượt' })
    const responses = await Promise.all([
      handler(makeRequest({ text: 'First', voice: 'Kore' })),
      handler(makeRequest({ text: 'Second', voice: 'Kore' })),
    ])
    expect(responses.map((r) => r.status).sort()).toEqual([200, 429])
    expect(checkAndConsumeUsage).toHaveBeenCalledTimes(2)
    expect(mockedGenGoogle).toHaveBeenCalledOnce()
  })
  it('khách giữ trial gate khi tạo mới, không dùng quota tài khoản', async () => {
    vi.spyOn(guest, 'resolveActor').mockResolvedValue({ kind: 'guest', guestKey: 'guest-1' })
    expect((await handler(makeRequest())).status).toBe(200)
    expect(checkAndConsumeGuestTrial).toHaveBeenCalledOnce()
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
  })
  it('khách cũng bị chặn khi cầu dao bật hoặc settings không khả dụng', async () => {
    vi.spyOn(guest, 'resolveActor').mockResolvedValue({ kind: 'guest', guestKey: 'guest-1' })
    vi.mocked(getAppSettings).mockResolvedValueOnce({ aiCircuitBreaker: true } as Awaited<
      ReturnType<typeof getAppSettings>
    >)
    expect((await handler(makeRequest())).status).toBe(503)
    vi.mocked(getAppSettings).mockRejectedValueOnce(new Error('DB unavailable'))
    expect((await handler(makeRequest())).status).toBe(503)
    expect(checkAndConsumeGuestTrial).not.toHaveBeenCalled()
    expect(mockedGenGoogle).not.toHaveBeenCalled()
  })
})

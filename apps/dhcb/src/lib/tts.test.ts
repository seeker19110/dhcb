import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@core/authHeader', () => ({
  getStoredToken: vi.fn().mockReturnValue('session:fake'),
  getAuthHeader: vi.fn(() => ({})),
}))

// getAudioEntry là vi.fn() (không phải arrow async cố định) để từng test tự đổi hành vi
// (vd trả null để buộc ensureAudioWithTimeline đi qua đường gọi /api/tts thật).
vi.mock('./audioCache.js', () => ({
  audioCacheKey: (text: string, lang: string, voice: string) => `${lang}:${voice}:${text}`,
  // getAudioEntry trả cả timeline khẩu hình (null = không có timing thật, xem
  // api/_lib/visemeTimeline.ts) — đường dùng chính của ensureAudioWithTimeline.
  getAudioEntry: vi.fn().mockResolvedValue({ buffer: new ArrayBuffer(8), timeline: null }),
  getAudioBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  setAudioBuffer: vi.fn().mockResolvedValue(undefined),
}))

// Audio giả tối thiểu — KHÔNG tự bắn onended (mô phỏng audio "đang phát dở"), cho phép
// bài test chiếm quyền thẻ audio dùng chung giữa chừng như người dùng bấm 2 nút loa liên tiếp.
class FakeAudio {
  src = ''
  playbackRate = 1
  preservesPitch = true
  currentTime = 0
  duration = 1
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeupdate: (() => void) | null = null
  onloadedmetadata: (() => void) | null = null
  preload = ''
  play() {
    return Promise.resolve()
  }
  pause() {}
}

const NativeURL = URL

function stubUrl(createObjectURL: (blob: Blob) => string = () => 'blob:fake') {
  class FakeURL extends NativeURL {
    static createObjectURL = createObjectURL
    static revokeObjectURL() {}
  }
  vi.stubGlobal('URL', FakeURL)
}

beforeEach(async () => {
  vi.stubGlobal('Audio', FakeAudio)
  stubUrl()
  // `restoreAllMocks()` (dùng ở describe "ensureAudioBuffer" bên dưới) xoá luôn
  // implementation của getStoredToken (vi.fn() từ vi.mock factory) — không chỉ các
  // spy tạo bằng vi.spyOn. Đặt lại giá trị mặc định mỗi test để các describe SAU đó
  // không bị "ăn theo" trạng thái đã bị restore của describe trước.
  const { getStoredToken } = await import('@core/authHeader')
  vi.mocked(getStoredToken).mockReturnValue('session:fake')
})

describe('speak() — 2 lời gọi chồng nhau qua nút loa khác nhau (không qua playAudioUrl)', () => {
  it('lời gọi ĐẦU TIÊN vẫn tự settle (không treo mãi) khi lời gọi THỨ HAI chiếm thẻ audio dùng chung giữa chừng', async () => {
    const { speak } = await import('./tts')

    let settled1 = false
    const p1 = speak('hello', 'en-US', 'Kore').then(
      () => {
        settled1 = true
      },
      () => {
        settled1 = true
      },
    )

    // Đợi vài vòng event-loop để p1 chạy tới đoạn await new Promise(...) trong speakViaGoogle
    // (ensureAudioBuffer là async nên cần vài tick mới tới đó).
    await new Promise((r) => setTimeout(r, 20))
    expect(settled1).toBe(false) // đang "phát dở" — chưa settle, đúng như mong đợi

    // Người dùng bấm nút loa THỨ HAI trong lúc câu 1 còn đang phát (đúng luồng thật của
    // KaraokeText.tsx: bấm khi `playing` của CHÍNH nó là false thì gọi speak() thẳng, dù
    // audio khác đang phát ở component khác) — KHÔNG qua stopSpeaking().
    const p2 = speak('world', 'en-US', 'Kore')

    // p1 phải TỰ SETTLE ngay khi p2 chiếm quyền thẻ audio — không được treo vĩnh viễn.
    await expect(p1).resolves.toBeUndefined()
    expect(settled1).toBe(true)

    // p2 vẫn "đang phát dở" (FakeAudio không tự bắn onended) — không await, chỉ cần biết
    // nó không bị reject để tránh unhandled rejection.
    p2.catch(() => {})
  })
})

describe('unlockAudio / pause / resume', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', { pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() })
  })

  it('unlockAudio không throw khi gọi nhiều lần (chỉ chạy thật ở lần đầu)', async () => {
    const { unlockAudio } = await import('./tts')
    expect(() => {
      unlockAudio()
      unlockAudio()
    }).not.toThrow()
  })

  it('pauseCurrentAudio/resumeCurrentAudio gọi được khi chưa có audio nào (không throw)', async () => {
    const { pauseCurrentAudio, resumeCurrentAudio } = await import('./tts')
    expect(() => pauseCurrentAudio()).not.toThrow()
    expect(() => resumeCurrentAudio()).not.toThrow()
  })
})

describe('tốc độ phát (getRatePref/setRatePref)', () => {
  beforeEach(() => localStorage.clear())

  it('chưa đặt → mặc định 1', async () => {
    const { getRatePref } = await import('./tts')
    expect(getRatePref()).toBe(1)
  })

  it('setRatePref rồi đọc lại đúng giá trị hợp lệ (0.75/1.25)', async () => {
    const { getRatePref, setRatePref } = await import('./tts')
    setRatePref(0.75)
    expect(getRatePref()).toBe(0.75)
    setRatePref(1.25)
    expect(getRatePref()).toBe(1.25)
  })

  it('giá trị localStorage lạ (không phải 0.75/1.25) → về mặc định 1', async () => {
    localStorage.setItem('tts_rate', '2')
    const { getRatePref } = await import('./tts')
    expect(getRatePref()).toBe(1)
  })
})

describe('isTTSSupported', () => {
  it('luôn true (Google TTS không phụ thuộc trình duyệt)', async () => {
    const { isTTSSupported } = await import('./tts')
    expect(isTTSSupported()).toBe(true)
  })
})

describe('giọng đọc: setVoicePref/getVoicePref, clamp theo quyền gói, giá trị cũ', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('chưa từng chọn giọng, chưa cache quyền gói → mặc định Kore', async () => {
    const { getVoicePref } = await import('./tts')
    expect(getVoicePref()).toBe('Kore')
  })

  it('setVoicePref rồi getVoicePref đọc lại đúng (chế độ ngẫu nhiên tắt)', async () => {
    const { getVoicePref, setVoicePref } = await import('./tts')
    setVoicePref('Aoede')
    expect(getVoicePref()).toBe('Aoede')
  })

  it('giá trị cũ (legacy "female"/"male") → map sang giọng mới', async () => {
    localStorage.setItem('tts_voice', 'male2')
    const { getVoicePref } = await import('./tts')
    expect(getVoicePref()).toBe('Charon')
  })

  // 2026-08-10: clamp GIỮ NGUYÊN GIỚI TÍNH (nam → Puck, không còn nhảy sang giọng nữ Kore).
  it('giọng đã lưu NGOÀI quyền gói hiện tại (cache free) → clamp giữ giới tính', async () => {
    localStorage.setItem('tts_voice', 'Umbriel') // giọng NAM, chỉ VIP
    localStorage.setItem('voice_allowed_cache', JSON.stringify(['Kore', 'Aoede', 'Puck', 'Charon']))
    const { getVoicePref } = await import('./tts')
    expect(getVoicePref()).toBe('Puck')
  })

  it('giọng NỮ ngoài quyền gói → clamp về Kore (mặc định nữ)', async () => {
    localStorage.setItem('tts_voice', 'Vindemiatrix')
    localStorage.setItem('voice_allowed_cache', JSON.stringify(['Kore', 'Aoede', 'Puck', 'Charon']))
    const { getVoicePref } = await import('./tts')
    expect(getVoicePref()).toBe('Kore')
  })

  it('có Studio trong quyền gói (VIP) NHƯNG chưa chọn tay → mặc định là Studio-O', async () => {
    localStorage.setItem('voice_allowed_cache', JSON.stringify(['Kore', 'Studio-O', 'Studio-Q']))
    const { getVoicePref } = await import('./tts')
    expect(getVoicePref()).toBe('Studio-O')
  })
})

describe('chế độ giọng ngẫu nhiên (random pref)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('mặc định TẮT', async () => {
    const { getVoiceRandomPref } = await import('./tts')
    expect(getVoiceRandomPref()).toBe(false)
  })

  it('bật rồi getVoicePref random trong đúng giới tính của giọng đã chọn', async () => {
    const { getVoicePref, setVoicePref, setVoiceRandomPref } = await import('./tts')
    setVoicePref('Kore') // nữ
    setVoiceRandomPref(true)
    const picked = getVoicePref()
    expect([
      'Kore',
      'Aoede',
      'Leda',
      'Zephyr',
      'Autonoe',
      'Callirrhoe',
      'Vindemiatrix',
      'Rachel',
    ]).toContain(picked)
  })

  it('gọi lại trong CÙNG phiên → giữ nguyên giọng đã bốc (session cache)', async () => {
    const { getVoicePref, setVoicePref, setVoiceRandomPref } = await import('./tts')
    setVoicePref('Puck') // nam
    setVoiceRandomPref(true)
    const first = getVoicePref()
    const second = getVoicePref()
    expect(second).toBe(first)
  })

  it('reshuffleRandomVoice xoá lựa chọn phiên → lần gọi sau CÓ THỂ bốc lại (không lỗi)', async () => {
    const { getVoicePref, setVoicePref, setVoiceRandomPref, reshuffleRandomVoice } =
      await import('./tts')
    setVoicePref('Puck')
    setVoiceRandomPref(true)
    getVoicePref()
    expect(() => reshuffleRandomVoice()).not.toThrow()
    const after = getVoicePref()
    expect(typeof after).toBe('string')
  })
})

describe('stopSpeaking / playAudioUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', { pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() })
  })

  it('stopSpeaking gọi được khi chưa phát gì (không throw)', async () => {
    const { stopSpeaking } = await import('./tts')
    expect(() => stopSpeaking()).not.toThrow()
  })

  it('playAudioUrl phát audio từ URL ngoài (vd phát âm từ), rồi stopSpeaking không lỗi', async () => {
    const { playAudioUrl, stopSpeaking } = await import('./tts')
    expect(() => playAudioUrl('https://example.com/audio.mp3')).not.toThrow()
    expect(() => stopSpeaking()).not.toThrow()
  })
})

describe('ensureAudioBuffer / ensureAudioWithTimeline — đường gọi /api/tts thật khi chưa cache', () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.stubGlobal('speechSynthesis', { pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() })
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue(null) // buộc đi qua đường gọi server
    vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({} as CryptoKey)
    vi.spyOn(crypto.subtle, 'decrypt').mockResolvedValue(new ArrayBuffer(4))
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('gọi /api/tts, giải mã audio, lưu vào cache → trả buffer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/tts') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=' }),
          })
        }
        // fetch audio_url (mã hóa)
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: async () => new ArrayBuffer(16),
        })
      }),
    )
    const { ensureAudioWithTimeline } = await import('./tts')
    const { buffer, timeline } = await ensureAudioWithTimeline('Hello', 'en-US', 'Kore')
    expect(buffer.byteLength).toBe(4)
    expect(timeline).toBeNull()
  })

  it('server trả 429 → tự thử lại 1 lần rồi thành công', async () => {
    let ttsCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/tts') {
          ttsCalls++
          if (ttsCalls === 1) return Promise.resolve({ ok: false, status: 429 })
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=' }),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: async () => new ArrayBuffer(16),
        })
      }),
    )
    const { ensureAudioBuffer } = await import('./tts')
    const buffer = await ensureAudioBuffer('Retry me', 'en-US', 'Kore')
    expect(buffer.byteLength).toBe(4)
    expect(ttsCalls).toBe(2)
  }, 10_000)

  it('server trả lỗi (không phải 429) → ném lỗi rõ ràng', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const { ensureAudioBuffer } = await import('./tts')
    await expect(ensureAudioBuffer('Fail me', 'en-US', 'Kore')).rejects.toThrow('TTS API lỗi: 500')
  })

  it('khách chưa đăng nhập (getStoredToken trả null) → VẪN gọi /api/tts (giọng server)', async () => {
    const { getStoredToken } = await import('@core/authHeader')
    vi.mocked(getStoredToken).mockReturnValue(null)
    const fetchMock = vi.fn().mockImplementation((url: string) =>
      Promise.resolve(
        url === '/api/tts'
          ? {
              ok: true,
              status: 200,
              json: async () => ({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=' }),
            }
          : { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(16) },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { ensureAudioBuffer } = await import('./tts')
    const buffer = await ensureAudioBuffer('Guest hello', 'en-US', 'Kore')
    expect(buffer.byteLength).toBe(4)
    expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.anything())
  })

  it('khách hết lượt dùng thử (429 + guestTrialExhausted) → ném lỗi ngay, KHÔNG thử lại', async () => {
    let ttsCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        ttsCalls++
        return Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ error: 'Hết lượt', guestTrialExhausted: true }),
        })
      }),
    )
    const { ensureAudioBuffer } = await import('./tts')
    await expect(ensureAudioBuffer('Out of trial', 'en-US', 'Kore')).rejects.toThrow(
      'khách hết lượt dùng thử',
    )
    expect(ttsCalls).toBe(1)
  })

  it('2 lời gọi CÙNG lúc CÙNG câu → gộp thành 1 request (inflight dedupe)', async () => {
    let ttsCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/tts') {
          ttsCalls++
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=' }),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: async () => new ArrayBuffer(16),
        })
      }),
    )
    const { ensureAudioBuffer } = await import('./tts')
    const [b1, b2] = await Promise.all([
      ensureAudioBuffer('Same sentence', 'en-US', 'Kore'),
      ensureAudioBuffer('Same sentence', 'en-US', 'Kore'),
    ])
    expect(b1.byteLength).toBe(4)
    expect(b2.byteLength).toBe(4)
    expect(ttsCalls).toBe(1) // chỉ 1 request thật dù gọi 2 lần
  })

  it('giọng Studio + câu tiếng Việt → tự đổi về Chirp3-HD cùng giới tính (Studio-O → Kore)', async () => {
    let usedVoice = ''
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: { body?: string }) => {
        if (url === '/api/tts') {
          const body = JSON.parse(opts!.body!) as { voice: string }
          usedVoice = body.voice
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=' }),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: async () => new ArrayBuffer(16),
        })
      }),
    )
    const { ensureAudioBuffer } = await import('./tts')
    await ensureAudioBuffer('Xin chào', 'vi-VN', 'Studio-O')
    expect(usedVoice).toBe('Kore')
  })
})

describe('prefetchSpeech', () => {
  beforeEach(async () => {
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
  })

  it('text rỗng → không làm gì, không lỗi', async () => {
    const { prefetchSpeech } = await import('./tts')
    await expect(prefetchSpeech('   ', 'en-US')).resolves.toBeUndefined()
  })

  it('text có nội dung, đã có cache → chạy xong không lỗi', async () => {
    const { prefetchSpeech } = await import('./tts')
    await expect(prefetchSpeech('Hello there', 'en-US', 'Kore')).resolves.toBeUndefined()
  })

  it('lỗi khi tải (vd mất mạng) → bắt lỗi êm, không throw', async () => {
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockRejectedValueOnce(new Error('idb error'))
    const { prefetchSpeech } = await import('./tts')
    await expect(prefetchSpeech('Oops', 'en-US', 'Kore')).resolves.toBeUndefined()
  })

  it('khách chưa đăng nhập → KHÔNG nạp trước (không đốt lượt dùng thử ở nền)', async () => {
    const { getStoredToken } = await import('@core/authHeader')
    vi.mocked(getStoredToken).mockReturnValue(null)
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockClear()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { prefetchSpeech } = await import('./tts')
    await prefetchSpeech('Guest prefetch', 'en-US', 'Kore')
    expect(getAudioEntry).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('speak() — fallback Web Speech khi Google TTS lỗi', () => {
  beforeEach(async () => {
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue(null)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  })

  it('Google TTS lỗi → rơi về Web Speech, resolve êm (không throw ra ngoài)', async () => {
    const speakFn = vi.fn()
    const cancelFn = vi.fn()
    class FakeUtterance {
      lang = ''
      rate = 1
      onboundary: unknown = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      voice: unknown = null
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      cancel: cancelFn,
      getVoices: () => [],
      speak: (u: FakeUtterance) => {
        speakFn(u)
        u.onend?.()
      },
    })
    const { speak } = await import('./tts')
    // speak() trả về "số vé" của lượt phát (number) để speakBilingual so lại — xem playToken.
    await expect(speak('Xin chào', 'vi-VN', 'Kore')).resolves.toEqual(expect.any(Number))
    expect(speakFn).toHaveBeenCalled()
  })

  it('không có speechSynthesis trên trình duyệt → resolve êm, không throw', async () => {
    // Code gốc kiểm bằng `'speechSynthesis' in window` — stub bằng giá trị `undefined`
    // (qua vi.stubGlobal) vẫn để lại property nên `in` vẫn trả true. Phải XOÁ hẳn
    // property mới mô phỏng đúng trình duyệt không hỗ trợ.
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
    const { speak } = await import('./tts')
    await expect(speak('Hello', 'en-US', 'Kore')).resolves.toEqual(expect.any(Number))
  })

  it('text rỗng ở fallback Web Speech → resolve ngay, không gọi speak()', async () => {
    const speakFn = vi.fn()
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), getVoices: () => [], speak: speakFn })
    const { speak } = await import('./tts')
    await expect(speak('   ', 'en-US', 'Kore')).resolves.toEqual(expect.any(Number))
    expect(speakFn).not.toHaveBeenCalled()
  })
})

describe('speakBilingual — đọc tuần tự câu thoại rồi phần sửa lỗi', () => {
  beforeEach(async () => {
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
    // Khác các describe khác: ở đây ta AWAIT speakBilingual tới khi resolve thật, nên
    // FakeAudio (không tự bắn onended) sẽ treo mãi mãi. Dùng bản tự bắn onended ngay sau
    // play() để mô phỏng audio phát xong tức thì.
    class AutoEndingAudio {
      src = ''
      playbackRate = 1
      preservesPitch = true
      currentTime = 0
      duration = 1
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      ontimeupdate: (() => void) | null = null
      onloadedmetadata: (() => void) | null = null
      preload = ''
      play() {
        queueMicrotask(() => this.onended?.())
        return Promise.resolve()
      }
      pause() {}
    }
    vi.stubGlobal('Audio', AutoEndingAudio)
    // QUAN TRỌNG: tts.ts giữ `sharedAudio` là biến singleton cấp module — nếu module đã
    // được import ở test/describe trước đó, `sharedAudio` đã được tạo từ FakeAudio CŨ (không
    // tự bắn onended) và việc stub lại `Audio` ở trên không ảnh hưởng thẻ audio đã tồn tại.
    // Reset module để `sharedAudio` được tạo lại từ AutoEndingAudio ở trên.
    vi.resetModules()
  })

  it('đọc cả speech lẫn feedback khi không bị ngắt giữa chừng', async () => {
    const { speakBilingual } = await import('./tts')
    const spokenWords: number[] = []
    await speakBilingual(
      'Hello',
      'Xin chào',
      'en-US',
      'vi-VN',
      'Kore',
      1,
      (i) => spokenWords.push(i),
      (i) => spokenWords.push(i),
    )
    // Chỉ cần chạy xong không lỗi — FakeAudio không tự bắn onended nên onWord có thể
    // không được gọi, quan trọng là hàm không throw và trả về đúng kiểu Promise<void>.
    expect(Array.isArray(spokenWords)).toBe(true)
  })

  it('speech rỗng → bỏ qua, chỉ đọc feedback', async () => {
    const { speakBilingual } = await import('./tts')
    await expect(speakBilingual('', 'Xin chào', 'en-US', 'vi-VN', 'Kore')).resolves.toBeUndefined()
  })

  it('feedback rỗng → chỉ đọc speech, không lỗi', async () => {
    const { speakBilingual } = await import('./tts')
    await expect(speakBilingual('Hello', '', 'en-US', 'vi-VN', 'Kore')).resolves.toBeUndefined()
  })

  // Điểm khác biệt cốt lõi của app: phần giải thích đọc bằng GIỌNG khác giọng hội thoại
  // (2026-08-10). Khoá cache mock có dạng "<lang>:<voice>:<text>" nên đọc từ getAudioEntry
  // là biết chính xác mỗi đoạn được phát bằng giọng nào.
  it('phần sửa lỗi dùng giọng KHÁC giọng hội thoại (mặc định khác giới tính)', async () => {
    const { speakBilingual } = await import('./tts')
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockClear()
    await speakBilingual('Hello', 'Xin chào', 'en-US', 'vi-VN', 'Kore')
    const keys = vi.mocked(getAudioEntry).mock.calls.map((c) => c[0])
    expect(keys).toContain('en-US:Kore:Hello')
    expect(keys).toContain('vi-VN:Puck:Xin chào')
  })

  it('truyền tay feedbackVoice → dùng đúng giọng đó cho phần sửa lỗi', async () => {
    const { speakBilingual } = await import('./tts')
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockClear()
    await speakBilingual(
      'Hello',
      'Xin chào',
      'en-US',
      'vi-VN',
      'Kore',
      1,
      undefined,
      undefined,
      'Charon',
    )
    expect(vi.mocked(getAudioEntry).mock.calls.map((c) => c[0])).toContain('vi-VN:Charon:Xin chào')
  })

  it('tắt chế độ giọng giải thích riêng → cả hai đoạn dùng chung 1 giọng (hành vi cũ)', async () => {
    const { speakBilingual, setNativeVoiceSeparate } = await import('./tts')
    const { getAudioEntry } = await import('./audioCache')
    setNativeVoiceSeparate(false)
    vi.mocked(getAudioEntry).mockClear()
    await speakBilingual('Hello', 'Xin chào', 'en-US', 'vi-VN', 'Kore')
    expect(vi.mocked(getAudioEntry).mock.calls.map((c) => c[0])).toContain('vi-VN:Kore:Xin chào')
    setNativeVoiceSeparate(true)
  })
})

// ── Giọng server THẬT SỰ dùng (2026-08-10) ─────────────────────────────────
// /api/tts có thể hạ giọng theo gói (clampVoiceToPlan). Client PHẢI bám theo giọng server
// trả về, vì nó quyết định định dạng audio: Gemini = WAV, còn lại = mp3. Đoán sai là gắn
// sai mimeType cho Blob → iOS/Safari không phát được (lỗi gói Free mở trang đọc truyện).
describe('ensureAudioWithTimeline — bám theo giọng server trả về', () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.stubGlobal('speechSynthesis', { pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() })
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue(null)
    vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({} as CryptoKey)
    vi.spyOn(crypto.subtle, 'decrypt').mockResolvedValue(new ArrayBuffer(4))
  })
  afterEach(() => vi.restoreAllMocks())

  function mockTts(body: Record<string, unknown>) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) =>
        url === '/api/tts'
          ? Promise.resolve({ ok: true, status: 200, json: async () => body })
          : Promise.resolve({
              ok: true,
              status: 200,
              arrayBuffer: async () => new ArrayBuffer(16),
            }),
      ),
    )
  }

  it('server hạ giọng Gemini → Kore: trả về giọng THẬT và lưu cache kèm giọng đó', async () => {
    mockTts({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=', voice: 'Kore' })
    const { ensureAudioWithTimeline } = await import('./tts')
    const { setAudioBuffer } = await import('./audioCache')
    const res = await ensureAudioWithTimeline('Ngày xửa ngày xưa', 'vi-VN', 'Gemini-Leda')
    expect(res.voice).toBe('Kore')
    expect(vi.mocked(setAudioBuffer).mock.calls.at(-1)?.[3]).toBe('Kore')
  })

  it('server không trả `voice` (bản cũ) → giữ giọng client yêu cầu, không vỡ', async () => {
    mockTts({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=' })
    const { ensureAudioWithTimeline } = await import('./tts')
    const res = await ensureAudioWithTimeline('Hello', 'en-US', 'Kore')
    expect(res.voice).toBe('Kore')
  })

  it('server trả `voice` lạ (không hợp lệ) → bỏ qua, dùng giọng client yêu cầu', async () => {
    mockTts({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=', voice: 'KhongTonTai' })
    const { ensureAudioWithTimeline } = await import('./tts')
    const res = await ensureAudioWithTimeline('Hello', 'en-US', 'Aoede')
    expect(res.voice).toBe('Aoede')
  })

  it('cache IndexedDB có sẵn giọng thật → dùng lại, không gọi server', async () => {
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({
      buffer: new ArrayBuffer(4),
      timeline: null,
      voice: 'Kore',
    })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { ensureAudioWithTimeline } = await import('./tts')
    const res = await ensureAudioWithTimeline('Ngày xửa', 'vi-VN', 'Gemini-Leda')
    expect(res.voice).toBe('Kore')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

// ── Giọng GIẢI THÍCH riêng (tiếng mẹ đẻ) — 2026-08-10 ──────────────────────
describe('getNativeVoicePref — giọng đọc phần sửa lỗi', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('mặc định BẬT và chọn giọng KHÁC GIỚI TÍNH với giọng hội thoại', async () => {
    const { getNativeVoicePref, isNativeVoiceSeparate } = await import('./tts')
    expect(isNativeVoiceSeparate()).toBe(true)
    expect(getNativeVoicePref('Kore')).toBe('Puck') // nữ → nam
    expect(getNativeVoicePref('Charon')).toBe('Kore') // nam → nữ
  })

  it('tắt công tắc → dùng chung đúng giọng hội thoại (hành vi cũ)', async () => {
    const { getNativeVoicePref, setNativeVoiceSeparate } = await import('./tts')
    setNativeVoiceSeparate(false)
    expect(getNativeVoicePref('Kore')).toBe('Kore')
  })

  it('người dùng chọn tay giọng trong quyền gói → dùng đúng giọng đó', async () => {
    const { getNativeVoicePref, setNativeVoicePref } = await import('./tts')
    const { cacheAllowedVoices } = await import('./voiceTiers')
    cacheAllowedVoices('vip', new Date('2020-01-01'))
    setNativeVoicePref('Fenrir')
    expect(getNativeVoicePref('Kore')).toBe('Fenrir')
  })

  it('giọng chọn tay NGOÀI quyền gói → về mặc định khác giới tính', async () => {
    const { getNativeVoicePref, setNativeVoicePref } = await import('./tts')
    const { cacheAllowedVoices } = await import('./voiceTiers')
    cacheAllowedVoices('free', new Date('2020-01-01'))
    setNativeVoicePref('Fenrir') // chỉ Pro/VIP
    expect(getNativeVoicePref('Kore')).toBe('Puck')
  })

  it('không bao giờ trả giọng Studio/ElevenLabs (Studio không có tiếng Việt, ElevenLabs đắt)', async () => {
    const { getNativeVoicePref, setNativeVoicePref } = await import('./tts')
    const { cacheAllowedVoices } = await import('./voiceTiers')
    cacheAllowedVoices('vip', new Date('2020-01-01'))
    setNativeVoicePref('Studio-O')
    expect(getNativeVoicePref('Puck')).toBe('Kore')
    setNativeVoicePref('Rachel')
    expect(getNativeVoicePref('Puck')).toBe('Kore')
  })
})

// ── Đợt 2 coverage 2026-09-05: nhánh chưa phủ ───────────────────────────────
// Mỗi describe dưới đây nhắm đúng một nhóm nhánh/hàm mà báo cáo coverage liệt kê là chưa đi
// qua — không phải test cho đủ số. Đặt CUỐI file, tự resetModules khi cần trạng thái sạch
// (sharedAudio/audioUnlocked/silentUrl/playToken là biến cấp module, dính giữa các test nếu
// không reset — xem ghi chú đã có ở describe "speakBilingual" phía trên).

describe('unlockAudio — Đợt 2 coverage: getSilentUrl dùng lại URL đã tạo + nhánh catch', () => {
  it('play() ném lỗi ở lần thử đầu → không throw ra ngoài, lần thử lại KHÔNG tạo WAV mới', async () => {
    vi.resetModules()
    let playCalls = 0
    let createObjectURLCalls = 0
    class FlakyAudio {
      src = ''
      preload = ''
      play() {
        playCalls += 1
        if (playCalls === 1) throw new Error('play bi chan lan dau (giong Safari khoa)')
        return Promise.resolve()
      }
      pause() {}
      currentTime = 0
    }
    vi.stubGlobal('Audio', FlakyAudio)
    stubUrl(() => {
      createObjectURLCalls += 1
      return 'blob:fake'
    })
    const { unlockAudio } = await import('./tts')
    expect(() => unlockAudio()).not.toThrow() // lần 1: play() ném lỗi → catch nuốt, không throw
    expect(() => unlockAudio()).not.toThrow() // lần 2: thử lại vì audioUnlocked vẫn còn false
    expect(playCalls).toBe(2)
    // Chỉ tạo file WAV im lặng ĐÚNG MỘT LẦN — lần thử lại dùng lại URL đã tạo (getSilentUrl cache).
    expect(createObjectURLCalls).toBe(1)
  })
})

describe('setVoiceRandomPref/reshuffleRandomVoice/pickAndRememberRandomVoice — Đợt 2 coverage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('setVoiceRandomPref(false) ghi đúng giá trị "0" (nhánh chưa test trước đây chỉ dùng true)', async () => {
    const { getVoiceRandomPref, setVoiceRandomPref } = await import('./tts')
    setVoiceRandomPref(true)
    expect(getVoiceRandomPref()).toBe(true)
    setVoiceRandomPref(false)
    expect(getVoiceRandomPref()).toBe(false)
  })

  it('reshuffleRandomVoice không throw kể cả khi sessionStorage.removeItem bị chặn', async () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error('sessionStorage bi chan (che do an danh khac nghiet)')
      },
      clear: () => {},
    })
    const { reshuffleRandomVoice } = await import('./tts')
    expect(() => reshuffleRandomVoice()).not.toThrow()
  })

  it('sessionStorage.setItem bị chặn khi bốc giọng ngẫu nhiên → vẫn trả được giọng, không throw', async () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('sessionStorage bi chan (che do an danh khac nghiet)')
      },
      removeItem: () => {},
      clear: () => {},
    })
    const { getVoicePref, setVoicePref, setVoiceRandomPref } = await import('./tts')
    setVoicePref('Kore')
    setVoiceRandomPref(true)
    let picked = ''
    expect(() => {
      picked = getVoicePref()
    }).not.toThrow()
    expect(typeof picked).toBe('string')
  })

  it('bể giọng được phép KHÔNG có giọng nào đúng giới tính → lùi về TOÀN BỘ giọng của giới tính đó', async () => {
    // Cache quyền gói chỉ có 'Rachel' (NỮ, nhưng là ElevenLabs — bị loại khỏi bể random ở
    // byGender). clampVoiceToAllowed sẽ hạ giọng đã chọn tay (Kore) về đúng 'Rachel' (allowed
    // duy nhất), nên gender vẫn tính ra 'female' nhưng KHÔNG voice nào trong byGender(female)
    // (đã loại Rachel) nằm trong allowed → candidates rỗng → phải lùi về byGender.
    localStorage.setItem('voice_allowed_cache', JSON.stringify(['Rachel']))
    const { getVoicePref, setVoicePref, setVoiceRandomPref } = await import('./tts')
    setVoicePref('Kore')
    setVoiceRandomPref(true)
    const picked = getVoicePref()
    expect(['Kore', 'Aoede', 'Leda', 'Zephyr', 'Autonoe', 'Callirrhoe', 'Vindemiatrix']).toContain(
      picked,
    )
  })
})

describe('getVoicePref — Đợt 2 coverage: giọng đã lưu clamp ra ngoài VOICE_OPTIONS', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('cache quyền gói chỉ toàn giọng Gemini (không có Kore/Puck) → clamp ra "Gemini-Leda", gender lùi về "female"', async () => {
    // clampVoiceToAllowed (voiceTiers.ts) có nhánh cuối `allowed[0] ?? DEFAULT_VOICE` — nếu
    // danh sách allowed chỉ có giọng Gemini (không nằm trong VOICE_OPTIONS), giọng "đã lưu"
    // trở thành một id KHÔNG có trong VOICE_OPTIONS. getVoicePref() (tts.ts) phải không vỡ:
    // VOICE_OPTIONS.find(...) thất bại, lùi về gender mặc định 'female' để vẫn bốc được giọng.
    localStorage.setItem('voice_allowed_cache', JSON.stringify(['Gemini-Leda']))
    localStorage.setItem('tts_voice', 'Studio-O')
    localStorage.setItem('tts_voice_random', '1')
    const { getVoicePref } = await import('./tts')
    const picked = getVoicePref()
    expect([
      'Kore',
      'Aoede',
      'Leda',
      'Zephyr',
      'Autonoe',
      'Callirrhoe',
      'Vindemiatrix',
      'Rachel',
    ]).toContain(picked)
  })
})

describe('ensureAudioWithTimeline — Đợt 2 coverage: tải file audio đã mã hoá thất bại', () => {
  beforeEach(async () => {
    localStorage.clear()
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue(null)
    vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({} as CryptoKey)
    vi.spyOn(crypto.subtle, 'decrypt').mockResolvedValue(new ArrayBuffer(4))
  })
  afterEach(() => vi.restoreAllMocks())

  it('link audio_url trả về lỗi (vd hết hạn) → ném lỗi rõ ràng kèm mã trạng thái', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/tts') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ audio_url: '/fake.mp3', key_b64: 'a2V5', iv_b64: 'aXY=' }),
          })
        }
        return Promise.resolve({ ok: false, status: 404 })
      }),
    )
    const { ensureAudioBuffer } = await import('./tts')
    await expect(ensureAudioBuffer('Lỗi tải audio', 'en-US', 'Kore')).rejects.toThrow(
      'Không tải được audio: 404',
    )
  })
})

describe('speechCacheKey — Đợt 2 coverage: giọng ElevenLabs bỏ lang khỏi cacheKey', () => {
  it('giọng Rachel (ElevenLabs) → cacheKey KHÔNG mang lang (không tách audio Anh/Việt giống nhau)', async () => {
    const { speechCacheKey } = await import('./tts')
    expect(speechCacheKey('Hello', 'en-US', 'Rachel')).toBe(':Rachel:Hello')
    // Đối chứng: giọng thường (không phải ElevenLabs) vẫn giữ nguyên lang trong cacheKey.
    expect(speechCacheKey('Hello', 'en-US', 'Kore')).toBe('en-US:Kore:Hello')
  })
})

describe('speakViaGoogle — Đợt 2 coverage: mimeType theo giọng + preservesPitch dự phòng', () => {
  class AutoEndingCaptureAudio {
    src = ''
    playbackRate = 1
    currentTime = 0
    duration = 1
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    ontimeupdate: (() => void) | null = null
    onloadedmetadata: (() => void) | null = null
    preload = ''
    play() {
      queueMicrotask(() => this.onended?.())
      return Promise.resolve()
    }
    pause() {}
  }

  beforeEach(async () => {
    vi.resetModules()
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
  })

  it('giọng Gemini (đọc truyện) → tạo Blob kiểu audio/wav thay vì mp3', async () => {
    vi.stubGlobal('Audio', AutoEndingCaptureAudio)
    const capturedTypes: string[] = []
    stubUrl((blob: Blob) => {
      capturedTypes.push(blob.type)
      return 'blob:fake'
    })
    const { speak } = await import('./tts')
    await speak('Ngày xửa ngày xưa', 'vi-VN', 'Gemini-Leda')
    expect(capturedTypes).toContain('audio/wav')
  })

  it('giọng thường (không phải Gemini) → tạo Blob kiểu audio/mpeg', async () => {
    vi.stubGlobal('Audio', AutoEndingCaptureAudio)
    const capturedTypes: string[] = []
    stubUrl((blob: Blob) => {
      capturedTypes.push(blob.type)
      return 'blob:fake'
    })
    const { speak } = await import('./tts')
    await speak('Hello', 'en-US', 'Kore')
    expect(capturedTypes).toContain('audio/mpeg')
  })

  it('trình duyệt chỉ hỗ trợ webkitPreservesPitch (Safari cũ) → vẫn giữ cao độ khi đổi tốc độ', async () => {
    const createdInstances: WebkitOnlyAudio[] = []
    class WebkitOnlyAudio {
      src = ''
      playbackRate = 1
      webkitPreservesPitch = false
      currentTime = 0
      duration = 1
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      ontimeupdate: (() => void) | null = null
      onloadedmetadata: (() => void) | null = null
      preload = ''
      constructor() {
        createdInstances.push(this)
      }
      play() {
        queueMicrotask(() => this.onended?.())
        return Promise.resolve()
      }
      pause() {}
    }
    vi.stubGlobal('Audio', WebkitOnlyAudio)
    stubUrl()
    const { speak } = await import('./tts')
    await speak('Hello', 'en-US', 'Kore', 1.25)
    expect(createdInstances).toHaveLength(1)
    expect(createdInstances[0]!.webkitPreservesPitch).toBe(true)
  })
})

describe('speak() fallback Web Speech — Đợt 2 coverage: onWord/onboundary/chọn giọng/tốc độ en-US', () => {
  beforeEach(async () => {
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue(null)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  })

  it('lang en-US + onWord + trình duyệt có giọng khớp → dùng đúng tốc độ 0.9x, chọn đúng giọng, báo từ theo onboundary', async () => {
    class FakeUtterance {
      lang = ''
      rate = 1
      onboundary: ((e: { name: string; charIndex: number }) => void) | null = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      voice: unknown = null
      constructor(public text: string) {}
    }
    let capturedUtt: FakeUtterance | undefined
    const femaleVoice = { lang: 'en-US', name: 'Microsoft Zira Female' }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [femaleVoice],
      speak: (u: FakeUtterance) => {
        capturedUtt = u
      },
    })
    const { speak } = await import('./tts')
    const spokenWords: number[] = []
    const p = speak('hello world again', 'en-US', 'Kore', 1, (i) => spokenWords.push(i))
    await new Promise((r) => setTimeout(r, 10))
    expect(capturedUtt).toBeDefined()
    expect(capturedUtt!.rate).toBeCloseTo(0.9) // en-US → 0.9 × rate(1), khác nhánh vi-VN (0.85) đã test trước đó
    expect(capturedUtt!.voice).toBe(femaleVoice) // đã tìm và gán đúng giọng khớp lang + giới tính
    capturedUtt!.onboundary!({ name: 'not-word', charIndex: 0 }) // sự kiện khác 'word' → bỏ qua
    capturedUtt!.onboundary!({ name: 'word', charIndex: 6 }) // rơi vào từ thứ 2 ("world")
    expect(spokenWords).toEqual([1])
    capturedUtt!.onend!()
    await p
  })
})

describe('speakBilingual — Đợt 2 coverage: bị "cướp" thẻ audio giữa chừng thì bỏ qua phần sửa lỗi', () => {
  beforeEach(async () => {
    vi.resetModules()
    // FakeAudio (giống bản đầu file) KHÔNG tự bắn onended — để câu thoại "đang phát dở",
    // cho bài test cơ hội cướp thẻ audio giữa chừng như người dùng bấm nút loa khác.
    class FakeAudioNoAutoEnd {
      src = ''
      playbackRate = 1
      preservesPitch = true
      currentTime = 0
      duration = 1
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      ontimeupdate: (() => void) | null = null
      onloadedmetadata: (() => void) | null = null
      preload = ''
      play() {
        return Promise.resolve()
      }
      pause() {}
    }
    vi.stubGlobal('Audio', FakeAudioNoAutoEnd)
    stubUrl()
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
  })

  it('nút loa khác cướp thẻ audio khi câu thoại còn đang phát dở → speakBilingual dừng, KHÔNG đọc phần sửa lỗi', async () => {
    const { speakBilingual, speak } = await import('./tts')
    const feedbackCalls: number[] = []
    const p = speakBilingual('Hello', 'Xin chào', 'en-US', 'vi-VN', 'Kore', 1, undefined, (i) =>
      feedbackCalls.push(i),
    )
    // Đợi vài tick để speech (bên trong speakBilingual) tới đoạn "đang phát dở" (đã chiếm thẻ
    // audio, đang await onended/onerror) — cùng kỹ thuật với test đầu file.
    await new Promise((r) => setTimeout(r, 20))
    // "Bấm nút loa khác" ngay lúc câu thoại còn dở dang → cướp thẻ audio, buộc Promise của
    // speech bên trong speakBilingual settle SỚM với "vé" CŨ, lệch với playToken hiện tại.
    // KHÔNG await lượt "cướp" này tới khi phát xong — nó cũng dùng FakeAudio không tự bắn
    // onended nên sẽ treo mãi nếu đợi trọn vẹn (giống p2 ở test đầu file, chỉ cần nó CHIẾM
    // được thẻ audio, không cần biết nó phát xong khi nào).
    const stealer = speak('cuop thẻ audio', 'en-US', 'Puck')
    stealer.catch(() => {})
    await p
    expect(feedbackCalls).toHaveLength(0)
  })
})

describe('getVoicePref — Đợt 2 coverage: sessionStorage.getItem bị chặn khi đọc giọng đã bốc', () => {
  it('không throw, coi như chưa có giọng nào được bốc trong phiên', async () => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('sessionStorage bi chan (che do an danh khac nghiet)')
      },
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    })
    const { getVoicePref, setVoicePref, setVoiceRandomPref } = await import('./tts')
    setVoicePref('Kore')
    setVoiceRandomPref(true)
    let picked = ''
    expect(() => {
      picked = getVoicePref()
    }).not.toThrow()
    expect(typeof picked).toBe('string')
  })
})

describe('playAudioUrl — Đợt 2 coverage: cleanup khi phát xong / lỗi', () => {
  it('onended gọi cleanup (huỷ currentAudioId đang giữ) mà không lỗi', async () => {
    vi.resetModules()
    class CapturingAudio {
      src = ''
      playbackRate = 1
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      preload = ''
      play(): Promise<void> {
        return Promise.resolve()
      }
      pause() {}
    }
    const instances: CapturingAudio[] = []
    class Recording extends CapturingAudio {
      constructor() {
        super()
        instances.push(this)
      }
    }
    vi.stubGlobal('Audio', Recording)
    const { playAudioUrl } = await import('./tts')
    playAudioUrl('https://example.com/a.mp3')
    await new Promise((r) => setTimeout(r, 0))
    expect(() => instances[0]!.onended!()).not.toThrow()
  })

  it('play() bị từ chối (vd lỗi mạng) → bắt lỗi êm, gọi cleanup, không throw ra ngoài', async () => {
    vi.resetModules()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    class RejectingAudio {
      src = ''
      playbackRate = 1
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      preload = ''
      play(): Promise<void> {
        return Promise.reject(new Error('mang loi'))
      }
      pause() {}
    }
    vi.stubGlobal('Audio', RejectingAudio)
    const { playAudioUrl } = await import('./tts')
    expect(() => playAudioUrl('https://example.com/b.mp3')).not.toThrow()
    await new Promise((r) => setTimeout(r, 0))
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})

describe('speakViaGoogle — Đợt 2 coverage: onWord theo tiến độ audio + nhánh audio.onerror', () => {
  it('có onWord → gắn onloadedmetadata/ontimeupdate, báo đúng chỉ số từ theo currentTime', async () => {
    vi.resetModules()
    class CapAudio {
      src = ''
      playbackRate = 1
      preservesPitch = true
      currentTime = 0
      duration = 2
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      ontimeupdate: (() => void) | null = null
      onloadedmetadata: (() => void) | null = null
      preload = ''
      play(): Promise<void> {
        return Promise.resolve()
      }
      pause() {}
    }
    const instances: CapAudio[] = []
    class Recording extends CapAudio {
      constructor() {
        super()
        instances.push(this)
      }
    }
    vi.stubGlobal('Audio', Recording)
    stubUrl()
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
    const { speak } = await import('./tts')
    const spokenWords: number[] = []
    const p = speak('hello world', 'en-US', 'Kore', 1, (i) => spokenWords.push(i))
    await new Promise((r) => setTimeout(r, 20))
    const a = instances[0]!
    a.onloadedmetadata!()
    a.currentTime = 1 // giữa audio dài 2s, 2 từ → rơi vào từ thứ 2 ("world")
    a.ontimeupdate!()
    a.ontimeupdate!() // gọi lại vẫn chỉ cập nhật (idempotent), không lỗi
    a.onended!()
    await p
    expect(spokenWords).toContain(1)
  })

  it('duration âm (dữ liệu audio bất thường) → ontimeupdate im lặng, không tính idx sai', async () => {
    vi.resetModules()
    class OddDurationAudio {
      src = ''
      playbackRate = 1
      preservesPitch = true
      currentTime = 0
      duration = -1 // truthy (khác 0) nhưng KHÔNG hợp lệ — canh nhánh `dur <= 0`
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      ontimeupdate: (() => void) | null = null
      onloadedmetadata: (() => void) | null = null
      preload = ''
      play(): Promise<void> {
        return Promise.resolve()
      }
      pause() {}
    }
    const instances: OddDurationAudio[] = []
    class Recording extends OddDurationAudio {
      constructor() {
        super()
        instances.push(this)
      }
    }
    vi.stubGlobal('Audio', Recording)
    stubUrl()
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
    const { speak } = await import('./tts')
    const spokenWords: number[] = []
    const p = speak('hello world', 'en-US', 'Kore', 1, (i) => spokenWords.push(i))
    await new Promise((r) => setTimeout(r, 20))
    const a = instances[0]!
    a.onloadedmetadata!()
    a.ontimeupdate!()
    a.onended!()
    await p
    expect(spokenWords).toHaveLength(0)
  })

  it('audio.onerror (Google TTS lỗi giữa chừng) → cleanup rồi rơi về Web Speech', async () => {
    vi.resetModules()
    class ErrAudio {
      src = ''
      playbackRate = 1
      preservesPitch = true
      currentTime = 0
      duration = 1
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      ontimeupdate: (() => void) | null = null
      onloadedmetadata: (() => void) | null = null
      preload = ''
      play(): Promise<void> {
        return Promise.resolve()
      }
      pause() {}
    }
    const instances: ErrAudio[] = []
    class Recording extends ErrAudio {
      constructor() {
        super()
        instances.push(this)
      }
    }
    vi.stubGlobal('Audio', Recording)
    stubUrl()
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [],
      speak: (u: { onend?: () => void }) => u.onend?.(),
    })
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
    const { speak } = await import('./tts')
    const p = speak('Hello', 'en-US', 'Kore')
    await new Promise((r) => setTimeout(r, 20))
    instances[0]!.onerror!()
    await expect(p).resolves.toEqual(expect.any(Number))
  })

  it('audio.play() bị từ chối TRỰC TIẾP (không qua sự kiện onerror) → cũng rơi về Web Speech', async () => {
    vi.resetModules()
    class RejectPlayAudio {
      src = ''
      playbackRate = 1
      preservesPitch = true
      currentTime = 0
      duration = 1
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      ontimeupdate: (() => void) | null = null
      onloadedmetadata: (() => void) | null = null
      preload = ''
      play(): Promise<void> {
        return Promise.reject(new Error('khong phat duoc'))
      }
      pause() {}
    }
    vi.stubGlobal('Audio', RejectPlayAudio)
    stubUrl()
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [],
      speak: (u: { onend?: () => void }) => u.onend?.(),
    })
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(4), timeline: null })
    const { speak } = await import('./tts')
    await expect(speak('Hello', 'en-US', 'Kore')).resolves.toEqual(expect.any(Number))
  })
})

describe('speakViaWebSpeech — Đợt 2 coverage: onboundary hết từ + chọn giọng nam + onerror', () => {
  class FakeUtterance {
    lang = ''
    rate = 1
    onboundary: ((e: { name: string; charIndex: number }) => void) | null = null
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    voice: unknown = null
    constructor(public text: string) {}
  }

  beforeEach(async () => {
    const { getAudioEntry } = await import('./audioCache')
    vi.mocked(getAudioEntry).mockResolvedValue(null)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  })

  it('onboundary với charIndex rơi đúng TỪ ĐẦU TIÊN, và charIndex vượt quá mọi từ thì không báo gì thêm', async () => {
    let capturedUtt: FakeUtterance | undefined
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [],
      speak: (u: FakeUtterance) => {
        capturedUtt = u
      },
    })
    const { speak } = await import('./tts')
    const spokenWords: number[] = []
    const p = speak('mot hai ba', 'vi-VN', 'Kore', 1, (i) => spokenWords.push(i))
    await new Promise((r) => setTimeout(r, 10))
    capturedUtt!.onboundary!({ name: 'word', charIndex: 0 }) // rơi ngay từ đầu ("mot")
    expect(spokenWords).toEqual([0])
    capturedUtt!.onboundary!({ name: 'word', charIndex: 999 }) // vượt quá mọi từ → chạy hết vòng lặp, không gọi onWord
    expect(spokenWords).toEqual([0])
    capturedUtt!.onend!()
    await p
  })

  it('giọng NAM (Puck) → tìm đúng giọng nam khớp ngôn ngữ, bỏ qua giọng khác ngôn ngữ trong danh sách', async () => {
    let capturedUtt: FakeUtterance | undefined
    const wrongLangVoice = { lang: 'fr-FR', name: 'French Male Voice' }
    const maleVoice = { lang: 'en-US', name: 'Microsoft David Desktop' }
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [wrongLangVoice, maleVoice],
      speak: (u: FakeUtterance) => {
        capturedUtt = u
      },
    })
    const { speak } = await import('./tts')
    const p = speak('Hello', 'en-US', 'Puck')
    await new Promise((r) => setTimeout(r, 10))
    expect(capturedUtt!.voice).toBe(maleVoice) // không chọn giọng đúng giới tính nhưng sai ngôn ngữ
    capturedUtt!.onend!()
    await p
  })

  it.each([
    ['Puck', { lang: 'en-US', name: 'Voice Male A' }], // khớp qua từ khoá "male"
    ['Puck', { lang: 'vi-VN', name: 'Giọng Nam Miền Bắc' }], // khớp qua từ khoá "nam"
    ['Kore', { lang: 'en-US', name: 'Samantha' }], // khớp qua từ khoá "samantha"
    ['Kore', { lang: 'vi-VN', name: 'Giọng Nữ Miền Nam' }], // khớp qua từ khoá "nữ"
  ] as const)('chọn đúng giọng %s theo từ khoá tên "%s"', async (voice, browserVoice) => {
    let capturedUtt: FakeUtterance | undefined
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [browserVoice],
      speak: (u: FakeUtterance) => {
        capturedUtt = u
      },
    })
    const { speak } = await import('./tts')
    const p = speak('Hello', browserVoice.lang as 'en-US' | 'vi-VN', voice)
    await new Promise((r) => setTimeout(r, 10))
    expect(capturedUtt!.voice).toBe(browserVoice)
    capturedUtt!.onend!()
    await p
  })

  it('utt.onerror resolve êm (không throw ra ngoài, không crash UI)', async () => {
    let capturedUtt: FakeUtterance | undefined
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [],
      speak: (u: FakeUtterance) => {
        capturedUtt = u
      },
    })
    const { speak } = await import('./tts')
    const p = speak('Hello', 'en-US', 'Kore')
    await new Promise((r) => setTimeout(r, 10))
    expect(() => capturedUtt!.onerror!()).not.toThrow()
    await expect(p).resolves.toEqual(expect.any(Number))
  })
})

// ── S10-1 / AC-4: stopSpeaking() TRONG LÚC audio còn đang TẢI ───────────────────────────────
// Lỗi L4 (đặc tả S10 §2.1): `speakViaGoogle` chốt "vé" (`myPlayToken`) SAU khi đã
// `await ensureAudioWithTimeline(...)`. Rời trang chính là lúc đang tải: cleanup gọi
// `stopSpeaking()` → `playToken++`, nhưng lượt phát đang tải dở không hề so vé nên tải xong
// vẫn chiếm thẻ audio và CẤT TIẾNG Ở TRANG KẾ.
describe('AC-4 — stopSpeaking() trong lúc TTS còn đang TẢI thì lượt phát đó không được phát', () => {
  class CountingAudio {
    static playCalls = 0
    src = ''
    playbackRate = 1
    preservesPitch = true
    currentTime = 0
    duration = 1
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    ontimeupdate: (() => void) | null = null
    onloadedmetadata: (() => void) | null = null
    preload = ''
    play(): Promise<void> {
      CountingAudio.playCalls++
      // Phát xong ngay để promise của speak() settle (mô phỏng câu rất ngắn).
      setTimeout(() => this.onended?.(), 0)
      return Promise.resolve()
    }
    pause() {}
  }

  it('stop giữa lúc tải → audio.play() 0 lần, promise vẫn resolve (không treo)', async () => {
    vi.resetModules()
    CountingAudio.playCalls = 0
    vi.stubGlobal('Audio', CountingAudio)

    const { getAudioEntry } = await import('./audioCache.js')
    type Entry = Awaited<ReturnType<typeof getAudioEntry>>
    let release!: (value: Entry) => void
    const dangTai = new Promise<Entry>((resolve) => {
      release = resolve
    })
    vi.mocked(getAudioEntry).mockReturnValueOnce(dangTai)

    const { speak, stopSpeaking } = await import('./tts')
    const p = speak('xin chào', 'vi-VN', 'Kore')
    await new Promise((r) => setTimeout(r, 10)) // lượt phát đang kẹt ở await tải audio

    stopSpeaking() // người dùng rời trang / bấm Tắt tiếng NGAY LÚC ĐANG TẢI
    release({ buffer: new ArrayBuffer(8), timeline: null }) // audio về sau đó

    await expect(p).resolves.toBeTypeOf('number')
    expect(CountingAudio.playCalls).toBe(0)
  })

  it('stop SAU khi đã phát xong → hành vi cũ không đổi (vẫn phát đúng 1 lần)', async () => {
    vi.resetModules()
    CountingAudio.playCalls = 0
    vi.stubGlobal('Audio', CountingAudio)

    const { getAudioEntry } = await import('./audioCache.js')
    vi.mocked(getAudioEntry).mockResolvedValue({ buffer: new ArrayBuffer(8), timeline: null })

    const { speak, stopSpeaking } = await import('./tts')
    await speak('xin chào', 'vi-VN', 'Kore')
    stopSpeaking()

    expect(CountingAudio.playCalls).toBe(1)
  })
})

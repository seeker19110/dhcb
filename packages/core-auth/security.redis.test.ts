// security.redis.test.ts — Nhánh CÓ REDIS_URL của security.ts (rate limit dùng chung cụm,
// bộ đếm ngày, health check). `security.test.ts` chỉ chạy nhánh Map in-memory (không REDIS_URL),
// nên toàn bộ đường Redis + chuyển trạng thái degraded/recovered chưa từng có test canh.
//
// Cách làm: mock module `ioredis` bằng một client giả điều khiển được (`status`, `eval`, `ping`),
// và `vi.resetModules()` + import động trước MỖI test vì `security.ts` cache client ở cấp module
// (`redisClient` chỉ tạo một lần) — dùng lại module giữa các test là dùng lại trạng thái cũ.
import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'

type Handler = (arg?: unknown) => void

/** Client Redis giả: đủ bề mặt security.ts dùng (status, on, eval, ping). */
class FakeRedis {
  static instances: FakeRedis[] = []
  static ctorError: Error | null = null
  /** Trạng thái lúc vừa tạo — 'connecting' để mô phỏng client thật (kết nối chưa xong). */
  static initialStatus = 'ready'
  status = FakeRedis.initialStatus
  handlers = new Map<string, Handler[]>()
  eval = vi.fn<(...args: unknown[]) => Promise<unknown>>()
  ping = vi.fn<() => Promise<string>>(async () => 'PONG')
  del = vi.fn<(key: string) => Promise<number>>(async () => 1)
  get = vi.fn<(key: string) => Promise<string | null>>(async () => null)
  constructor(public url: string) {
    if (FakeRedis.ctorError) throw FakeRedis.ctorError
    FakeRedis.instances.push(this)
  }
  on(event: string, fn: Handler): this {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), fn])
    return this
  }
  once(event: string, fn: Handler): this {
    const wrapped: Handler = (arg) => {
      this.off(event, wrapped)
      fn(arg)
    }
    ;(wrapped as Handler & { original?: Handler }).original = fn
    return this.on(event, wrapped)
  }
  off(event: string, fn: Handler): this {
    const list = this.handlers.get(event) ?? []
    this.handlers.set(
      event,
      list.filter((h) => h !== fn && (h as Handler & { original?: Handler }).original !== fn),
    )
    return this
  }
  listenerCount(event: string): number {
    return this.handlers.get(event)?.length ?? 0
  }
  emit(event: string, arg?: unknown): void {
    for (const h of [...(this.handlers.get(event) ?? [])]) h(arg)
  }
}

vi.mock('ioredis', () => ({ Redis: FakeRedis }))
vi.mock('./authService.js', () => ({ validateSessionToken: vi.fn() }))

/** Gọi một lệnh đếm để security.ts tạo client Redis (client tạo lười ở lần gọi đầu). */
async function checkSeed(): Promise<void> {
  const { checkRateLimit } = await import('./security.js')
  await checkRateLimit('seed', 5, 'seed')
}

async function loadSecurity() {
  vi.resetModules()
  return import('./security.js')
}

// Thời gian security.ts chờ client đang kết nối chuyển sang `ready` (REDIS_READY_WAIT_MS).
const READY_WAIT_MS = 1000

/** Chạy `fn` với đồng hồ giả và tua qua hết thời gian chờ Redis — ca "kết nối mãi không xong". */
async function pastReadyWait<T>(fn: () => Promise<T>): Promise<T> {
  vi.useFakeTimers()
  try {
    const pending = fn()
    await vi.advanceTimersByTimeAsync(READY_WAIT_MS)
    return await pending
  } finally {
    vi.useRealTimers()
  }
}

function lastClient(): FakeRedis {
  const c = FakeRedis.instances[FakeRedis.instances.length - 1]
  if (!c) throw new Error('chưa tạo client Redis nào')
  return c
}

describe('security.ts — nhánh Redis (REDIS_URL có cấu hình)', () => {
  const OLD_URL = process.env.REDIS_URL
  let warnSpy: MockInstance<typeof console.warn>
  let logSpy: MockInstance<typeof console.log>

  beforeEach(() => {
    process.env.REDIS_URL = 'redis://:pw@127.0.0.1:6379'
    FakeRedis.instances = []
    FakeRedis.ctorError = null
    FakeRedis.initialStatus = 'ready'
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    if (OLD_URL === undefined) delete process.env.REDIS_URL
    else process.env.REDIS_URL = OLD_URL
    vi.restoreAllMocks()
  })

  describe('checkRateLimit', () => {
    it('Redis ready → đếm bằng script Lua, cho qua khi count ≤ max và chặn khi vượt', async () => {
      const { checkRateLimit } = await loadSecurity()
      // Lần gọi đầu tạo client (lazy), sau đó eval được gọi.
      await lastClientAfter(async () => {
        await checkRateLimit('1.2.3.4', 2, 'b')
      })
      const client = lastClient()
      client.eval.mockResolvedValueOnce(2).mockResolvedValueOnce(3)
      expect(await checkRateLimit('1.2.3.4', 2, 'b')).toBe(true)
      expect(await checkRateLimit('1.2.3.4', 2, 'b')).toBe(false)
      // Cùng MỘT client dùng chung — không tạo client mới mỗi request.
      expect(FakeRedis.instances).toHaveLength(1)
      // Key gộp bucket + ip để tách bộ đếm.
      expect(client.eval.mock.calls[0]?.[2]).toBe('b:1.2.3.4')
    })

    it('Redis kết nối MÃI không xong (quá hạn chờ) → không gọi eval, rơi về Map in-memory im lặng', async () => {
      const { checkRateLimit } = await loadSecurity()
      await checkRateLimit('x', 1, 'c') // tạo client
      const client = lastClient()
      client.status = 'connecting'
      client.eval.mockClear()
      expect(await pastReadyWait(() => checkRateLimit('ip-c', 1, 'c'))).toBe(true)
      expect(await pastReadyWait(() => checkRateLimit('ip-c', 1, 'c'))).toBe(false) // Map đếm được
      expect(client.eval).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled() // đúng ý: không báo động khi chỉ đang kết nối
    })

    it('eval ném lỗi → cảnh báo ĐÚNG MỘT LẦN rồi dùng Map; Redis sống lại → báo phục hồi', async () => {
      const { checkRateLimit } = await loadSecurity()
      await checkRateLimit('seed', 5, 'd')
      const client = lastClient()
      client.eval.mockRejectedValue(new Error("Stream isn't writeable"))
      expect(await checkRateLimit('ip-d', 5, 'd')).toBe(true) // fail-open: vẫn trả lời
      expect(await checkRateLimit('ip-d', 5, 'd')).toBe(true)
      const degradedLogs = warnSpy.mock.calls.filter((c) => String(c[0]).includes('Redis lỗi'))
      expect(degradedLogs).toHaveLength(1) // không spam mỗi request

      client.eval.mockResolvedValue(1)
      expect(await checkRateLimit('ip-d', 5, 'd')).toBe(true)
      expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('hoạt động trở lại'))).toBe(true)

      // Hỏng lần nữa → PHẢI báo lại (không latch vĩnh viễn — bài học 2026-08-23).
      client.eval.mockRejectedValue(new Error('again'))
      await checkRateLimit('ip-d', 5, 'd')
      expect(warnSpy.mock.calls.filter((c) => String(c[0]).includes('Redis lỗi'))).toHaveLength(2)
    })

    it('lỗi không phải Error (chuỗi) vẫn ghi được thông điệp', async () => {
      const { checkRateLimit, getRedisRuntimeStatus } = await loadSecurity()
      await checkRateLimit('seed', 5, 'e')
      lastClient().eval.mockRejectedValue('boom')
      await checkRateLimit('ip', 5, 'e')
      expect(getRedisRuntimeStatus().lastError).toBe('boom')
    })

    it('new Redis() ném lỗi → coi như không có Redis, dùng Map', async () => {
      FakeRedis.ctorError = new Error('bad url')
      const { checkRateLimit, getRedisRuntimeStatus } = await loadSecurity()
      expect(await checkRateLimit('ip', 1, 'f')).toBe(true)
      expect(await checkRateLimit('ip', 1, 'f')).toBe(false)
      expect(getRedisRuntimeStatus()).toMatchObject({
        configured: true,
        state: 'disabled',
        degraded: true,
        lastError: 'bad url',
      })
    })

    it('sự kiện "error"/"ready" của client đổi cờ degraded qua lại', async () => {
      const { checkRateLimit, getRedisRuntimeStatus } = await loadSecurity()
      await checkRateLimit('seed', 5, 'g')
      const client = lastClient()
      client.emit('error', new Error('ECONNREFUSED'))
      expect(getRedisRuntimeStatus().degraded).toBe(true)
      client.emit('ready')
      expect(getRedisRuntimeStatus()).toMatchObject({ degraded: false, lastError: '' })
      // ready khi đang tốt sẵn → không log gì thêm
      const before = warnSpy.mock.calls.length
      client.emit('ready')
      expect(warnSpy.mock.calls.length).toBe(before)
    })
  })

  describe('production đóng khi thiếu bộ đếm dùng chung', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('không có Redis từ chối rate limit và quota khách, kể cả VERCEL_ENV', async () => {
      delete process.env.REDIS_URL
      vi.stubEnv('VERCEL_ENV', 'production')
      const { checkRateLimit, consumeDailyCounter } = await loadSecurity()
      expect(await checkRateLimit('p', 60, 'auth')).toBe(false)
      expect(await consumeDailyCounter('guest:p', 10)).toBe(false)
    })

    it('connecting/lỗi từ chối, phục hồi Redis nhận request lại', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { checkRateLimit, consumeDailyCounter } = await loadSecurity()
      await checkRateLimit('seed', 5)
      const client = lastClient()
      client.status = 'connecting'
      expect(await pastReadyWait(() => checkRateLimit('p', 5))).toBe(false)
      expect(await pastReadyWait(() => consumeDailyCounter('guest:p', 5))).toBe(false)
      client.status = 'ready'
      client.eval.mockRejectedValue(new Error('down'))
      expect(await checkRateLimit('p', 5)).toBe(false)
      expect(await consumeDailyCounter('guest:p', 5)).toBe(false)
      client.eval.mockResolvedValue(1)
      expect(await checkRateLimit('p', 5)).toBe(true)
      expect(await consumeDailyCounter('guest:p', 5)).toBe(true)
    })
  })

  // changelog 0555 (rà soát L1/L2): phân biệt "vượt hạn mức" với "không đếm được" để nơi gọi trả
  // đúng mã (503 thay vì 429/409), và biết khi trả lại lượt KHÔNG thành công.
  describe('consumeWindowCounterStatus / resetCounterChecked', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('Redis sẵn sàng: ok → exhausted theo hạn mức; limit ≤ 0 → exhausted', async () => {
      const { consumeWindowCounterStatus } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.eval.mockResolvedValueOnce(1).mockResolvedValueOnce(2)
      expect(await consumeWindowCounterStatus('k', 1, 1000)).toBe('ok')
      expect(await consumeWindowCounterStatus('k', 1, 1000)).toBe('exhausted')
      expect(await consumeWindowCounterStatus('k', 0, 1000)).toBe('exhausted')
    })

    it('production + Redis connecting/lỗi → unavailable (vẫn từ chối), boolean cũ vẫn false', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { consumeWindowCounterStatus, consumeWindowCounter } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.status = 'connecting'
      expect(await pastReadyWait(() => consumeWindowCounterStatus('k', 5, 1000))).toBe(
        'unavailable',
      )
      expect(await pastReadyWait(() => consumeWindowCounter('k', 5, 1000))).toBe(false)
      client.status = 'ready'
      client.eval.mockRejectedValue(new Error('down'))
      expect(await consumeWindowCounterStatus('k', 5, 1000)).toBe('unavailable')
    })

    it('dev không Redis → Map: ok rồi exhausted (không bao giờ unavailable)', async () => {
      delete process.env.REDIS_URL
      const { consumeWindowCounterStatus } = await loadSecurity()
      expect(await consumeWindowCounterStatus('m', 1, 60_000)).toBe('ok')
      expect(await consumeWindowCounterStatus('m', 1, 60_000)).toBe('exhausted')
    })

    // changelog 0559: trần lượt nộp sai cần ĐỌC mà không tiêu (mở lượt) và biết SỐ ĐẾM (còn mấy lượt).
    it('consumeWindowCounterCount: Redis trả số đếm của Lua; production Redis lỗi → unavailable', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { consumeWindowCounterCount } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.eval.mockResolvedValueOnce(4)
      expect(await consumeWindowCounterCount('f', 1000)).toBe(4)
      client.eval.mockRejectedValueOnce(new Error('down'))
      expect(await consumeWindowCounterCount('f', 1000)).toBe('unavailable')
    })

    it('peekWindowCounter: GET không tăng; null/rác → 0; production Redis lỗi/connecting → unavailable', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { peekWindowCounter } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.eval.mockClear()
      client.get.mockResolvedValueOnce('3').mockResolvedValueOnce(null).mockResolvedValueOnce('x')
      expect(await peekWindowCounter('f')).toBe(3)
      expect(await peekWindowCounter('f')).toBe(0)
      expect(await peekWindowCounter('f')).toBe(0)
      expect(client.get).toHaveBeenCalledWith('f')
      expect(client.eval).not.toHaveBeenCalled()
      client.get.mockRejectedValueOnce(new Error('down'))
      expect(await peekWindowCounter('f')).toBe('unavailable')
      client.status = 'connecting'
      expect(await pastReadyWait(() => peekWindowCounter('f'))).toBe('unavailable')
    })

    it('resetCounterChecked: Redis xoá được → true; production Redis lỗi → false', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { resetCounterChecked } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      expect(await resetCounterChecked('k')).toBe(true)
      expect(client.del).toHaveBeenCalledWith('k')
      client.del.mockRejectedValue(new Error('down'))
      expect(await resetCounterChecked('k')).toBe(false)
      client.status = 'connecting'
      expect(await pastReadyWait(() => resetCounterChecked('k'))).toBe(false)
    })
  })

  // changelog 0583: request có rate limit đầu tiên tới instance PM2 1, 2 bị 429 oan vì client
  // Redis vừa tạo còn 'connecting'. Nay chờ ngắn sự kiện 'ready' thay vì từ chối ngay.
  describe('chờ Redis sẵn sàng thay vì từ chối ngay', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('client VỪA tạo còn connecting, ready ngay sau đó → production đếm bằng Redis, không 429', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      FakeRedis.initialStatus = 'connecting'
      const { checkRateLimit } = await loadSecurity()
      const pending = checkRateLimit('1.2.3.4', 60, 'tts')
      const client = lastClient()
      client.eval.mockResolvedValue(1)
      client.status = 'ready'
      client.emit('ready')
      expect(await pending).toBe(true)
      expect(client.eval).toHaveBeenCalledOnce()
    })

    it('đang reconnecting (rớt dưới 1 giây) → chờ ready rồi đếm tiếp', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { consumeDailyCounter } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.eval.mockResolvedValue(1)
      client.status = 'reconnecting'
      const pending = consumeDailyCounter('guest:p', 5)
      client.status = 'ready'
      client.emit('ready')
      expect(await pending).toBe(true)
    })

    it('nhiều request cùng chờ → dùng CHUNG một listener, gỡ sạch sau khi ready', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { checkRateLimit } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.eval.mockResolvedValue(1)
      client.status = 'connecting'
      const before = client.listenerCount('ready')
      const pendings = Array.from({ length: 20 }, (_, i) => checkRateLimit(`ip-${i}`, 5))
      expect(client.listenerCount('ready')).toBe(before + 1)
      client.status = 'ready'
      client.emit('ready')
      expect(await Promise.all(pendings)).toEqual(Array(20).fill(true))
      expect(client.listenerCount('ready')).toBe(before)
    })

    it('trạng thái end (không tự kết nối lại) → từ chối NGAY, không chờ', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { checkRateLimit } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.status = 'end'
      expect(await checkRateLimit('p', 5)).toBe(false)
      expect(client.listenerCount('ready')).toBe(1) // chỉ listener cố định của getRedis()
    })

    it('quá hạn chờ → gỡ listener, lần chờ sau tạo lời chờ mới', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const { checkRateLimit } = await loadSecurity()
      await checkSeed()
      const client = lastClient()
      client.status = 'connecting'
      expect(await pastReadyWait(() => checkRateLimit('p', 5))).toBe(false)
      expect(client.listenerCount('ready')).toBe(1)
      client.eval.mockResolvedValue(1)
      const pending = checkRateLimit('p', 5)
      client.status = 'ready'
      client.emit('ready')
      expect(await pending).toBe(true)
    })

    it('warmUpRedis() tạo client ngay (không chờ request đầu), gọi lại không tạo thêm', async () => {
      const { warmUpRedis } = await loadSecurity()
      expect(FakeRedis.instances).toHaveLength(0)
      warmUpRedis()
      warmUpRedis()
      expect(FakeRedis.instances).toHaveLength(1)
    })

    it('warmUpRedis() không có REDIS_URL → không tạo client', async () => {
      delete process.env.REDIS_URL
      const { warmUpRedis } = await loadSecurity()
      warmUpRedis()
      expect(FakeRedis.instances).toHaveLength(0)
    })

    it('pingRedis lúc client vừa tạo (connecting) → chờ ready rồi mới ping, không báo ❌ giả', async () => {
      FakeRedis.initialStatus = 'connecting'
      const { pingRedis } = await loadSecurity()
      const pending = pingRedis()
      const client = lastClient()
      expect(client.ping).not.toHaveBeenCalled()
      client.status = 'ready'
      client.emit('ready')
      expect((await pending).ok).toBe(true)
      expect(client.ping).toHaveBeenCalledOnce()
    })
  })

  describe('getRedisRuntimeStatus / pingRedis', () => {
    it('không có REDIS_URL → configured=false, state=disabled, ping báo chưa cấu hình', async () => {
      delete process.env.REDIS_URL
      const { getRedisRuntimeStatus, pingRedis } = await loadSecurity()
      expect(getRedisRuntimeStatus()).toMatchObject({ configured: false, state: 'disabled' })
      expect(await pingRedis()).toEqual({ ok: false, error: 'REDIS_URL chưa cấu hình' })
    })

    it('ping thành công → ok + latency, và xoá cờ degraded nếu đang hỏng', async () => {
      const { pingRedis, getRedisRuntimeStatus } = await loadSecurity()
      const first = await pingRedis()
      expect(first.ok).toBe(true)
      expect(typeof first.latencyMs).toBe('number')
      const client = lastClient()
      client.emit('error', new Error('x'))
      expect(getRedisRuntimeStatus().degraded).toBe(true)
      await pingRedis()
      expect(getRedisRuntimeStatus().degraded).toBe(false)
      expect(getRedisRuntimeStatus().state).toBe('ready')
    })

    it('ping thất bại → ok=false kèm thông điệp, cả khi lỗi không phải Error', async () => {
      const { pingRedis } = await loadSecurity()
      await pingRedis()
      const client = lastClient()
      client.ping.mockRejectedValueOnce(new Error('NOAUTH'))
      expect(await pingRedis()).toEqual({ ok: false, error: 'NOAUTH' })
      client.ping.mockRejectedValueOnce('raw')
      expect(await pingRedis()).toEqual({ ok: false, error: 'raw' })
    })
  })

  describe('reportRedisStatusAtStartup', () => {
    it('không có REDIS_URL → im lặng, không gọi ping', async () => {
      delete process.env.REDIS_URL
      const { reportRedisStatusAtStartup } = await loadSecurity()
      const pingFn = vi.fn()
      await reportRedisStatusAtStartup(pingFn)
      expect(pingFn).not.toHaveBeenCalled()
    })

    it('ping ok → log ✅ kèm latency; ping lỗi → warn ❌ kèm lý do', async () => {
      const { reportRedisStatusAtStartup } = await loadSecurity()
      await reportRedisStatusAtStartup(async () => ({ ok: true, latencyMs: 3 }))
      expect(String(logSpy.mock.calls[0]?.[0])).toContain('✅')
      expect(String(logSpy.mock.calls[0]?.[0])).toContain('3ms')
      await reportRedisStatusAtStartup(async () => ({ ok: false, error: 'NOAUTH' }))
      expect(String(warnSpy.mock.calls.at(-1)?.[0])).toContain('NOAUTH')
    })

    it('mặc định dùng pingRedis thật (client giả) → không ném lỗi', async () => {
      const { reportRedisStatusAtStartup } = await loadSecurity()
      await expect(reportRedisStatusAtStartup()).resolves.toBeUndefined()
      expect(lastClient().ping).toHaveBeenCalled()
    })
  })

  describe('consumeDailyCounter / releaseDailyCounter', () => {
    it('limit ≤ 0 → luôn từ chối, không đụng Redis', async () => {
      const { consumeDailyCounter } = await loadSecurity()
      expect(await consumeDailyCounter('k', 0)).toBe(false)
      expect(FakeRedis.instances).toHaveLength(0)
    })

    it('Redis ready → INCR qua Lua, trả true tới hạn rồi false', async () => {
      const { consumeDailyCounter } = await loadSecurity()
      await consumeDailyCounter('seed', 9)
      const client = lastClient()
      client.eval.mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3)
      expect(await consumeDailyCounter('guest:a', 2)).toBe(true)
      expect(await consumeDailyCounter('guest:a', 2)).toBe(true)
      expect(await consumeDailyCounter('guest:a', 2)).toBe(false)
    })

    it('Redis lỗi → rơi về Map và VẪN CHẶN (không fail-open cho lượt AI của khách)', async () => {
      const { consumeDailyCounter } = await loadSecurity()
      await consumeDailyCounter('seed', 9)
      lastClient().eval.mockRejectedValue(new Error('down'))
      expect(await consumeDailyCounter('guest:b', 1)).toBe(true)
      expect(await consumeDailyCounter('guest:b', 1)).toBe(false)
    })

    it('Map: hết cửa sổ 24h → bắt đầu đếm lại từ 1', async () => {
      delete process.env.REDIS_URL
      const { consumeDailyCounter } = await loadSecurity()
      vi.useFakeTimers()
      try {
        vi.setSystemTime(new Date('2026-09-22T00:00:00Z'))
        expect(await consumeDailyCounter('guest:c', 1)).toBe(true)
        expect(await consumeDailyCounter('guest:c', 1)).toBe(false)
        vi.setSystemTime(new Date('2026-09-23T00:00:01Z'))
        expect(await consumeDailyCounter('guest:c', 1)).toBe(true)
      } finally {
        vi.useRealTimers()
      }
    })

    it('release: Redis ready → DECR có điều kiện qua Lua, không đụng Map', async () => {
      const { releaseDailyCounter, consumeDailyCounter } = await loadSecurity()
      await consumeDailyCounter('seed', 9)
      const client = lastClient()
      client.eval.mockClear().mockResolvedValue(null)
      await releaseDailyCounter('guest:d')
      expect(client.eval).toHaveBeenCalledTimes(1)
      expect(String(client.eval.mock.calls[0]?.[0])).toContain('EXISTS')
    })

    it('release: Redis lỗi → giảm bộ đếm Map; key chưa có hoặc đã 0 thì không âm', async () => {
      const { releaseDailyCounter, consumeDailyCounter } = await loadSecurity()
      await consumeDailyCounter('seed', 9)
      lastClient().eval.mockRejectedValue(new Error('down'))
      // Map: tiêu 2 lượt với hạn 2 → đầy; trả 1 → còn chỗ cho 1 lượt nữa.
      expect(await consumeDailyCounter('guest:e', 2)).toBe(true)
      expect(await consumeDailyCounter('guest:e', 2)).toBe(true)
      expect(await consumeDailyCounter('guest:e', 2)).toBe(false)
      await releaseDailyCounter('guest:e')
      await releaseDailyCounter('guest:e')
      expect(await consumeDailyCounter('guest:e', 2)).toBe(true)
      // Key chưa từng có → không ném lỗi.
      await expect(releaseDailyCounter('guest:never')).resolves.toBeUndefined()
    })

    it('Map: khi > 10.000 key thì dọn key hết hạn (không phình vô hạn)', async () => {
      delete process.env.REDIS_URL
      const { consumeDailyCounter } = await loadSecurity()
      vi.useFakeTimers()
      try {
        vi.setSystemTime(new Date('2026-09-22T00:00:00Z'))
        for (let i = 0; i < 10_001; i++) await consumeDailyCounter(`bulk:${i}`, 5)
        // Sang ngày mới: lượt gọi kế tiếp dọn hết key cũ; key cũ dùng lại phải đếm từ 1.
        vi.setSystemTime(new Date('2026-09-24T00:00:00Z'))
        expect(await consumeDailyCounter('bulk:0', 1)).toBe(true)
        expect(await consumeDailyCounter('bulk:0', 1)).toBe(false)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})

/** Chạy `fn` rồi đảm bảo đã có client — chỉ để làm rõ ý "client tạo lười ở lần gọi đầu". */
async function lastClientAfter(fn: () => Promise<void>): Promise<void> {
  expect(FakeRedis.instances).toHaveLength(0)
  await fn()
  expect(FakeRedis.instances).toHaveLength(1)
}

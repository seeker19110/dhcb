// Test sendReminders (api/push.ts) — tập trung nhánh MỚI: chọn nội dung thông báo
// theo việc user có đang tham gia thử thách challenge gần đây hay không (mục "Nhắc hằng
// ngày" — docs/research/thu-thach-vlog-30-ngay.md). Mock Postgres pool + web-push để chạy OFFLINE.
//
// push.ts đọc VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY ở TOP-LEVEL module (side effect lúc
// import) nên phải stub env TRƯỚC khi import — dùng import() động trong beforeAll,
// không import tĩnh `sendReminders` ở đầu file (ES import tĩnh bị hoisted lên trước
// mọi statement khác, sẽ chạy trước khi kịp stub env).

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn(async () => undefined) },
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))

import { getPgPool } from '@dhcb/core-db/pgPool'
import webpush from 'web-push'

const mockedGetPool = vi.mocked(getPgPool)
const mockedSend = vi.mocked(webpush.sendNotification)

let sendReminders: typeof import('./push.js').sendReminders

beforeAll(async () => {
  vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-test')
  vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-test')
  const mod = await import('./push.js')
  sendReminders = mod.sendReminders
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  mockedGetPool.mockReset()
  mockedSend.mockClear()
})

type Row = { user_id: string; endpoint: string; p256dh: string; auth_key: string }

function mockPool(opts: {
  subs: Row[]
  usageRows?: Record<string, unknown>[]
  challengeRows?: { user_id: string }[]
  challengeError?: unknown
  recentUsageRows?: { user_id: string; day: string; [k: string]: unknown }[]
  recentUsageError?: unknown
  progressRows?: {
    user_id: string
    srs?: Record<string, { due?: number }>
    weekly_goal?: { goal?: number }
  }[]
  // Đợt 2 coverage 2026-09-05: ghi lại MỌI câu SQL đã chạy (kèm tham số) để test kiểm được
  // câu xoá subscription hết hạn (endpoint = any(...)) — nhánh trước đó chưa test tới.
  queryLog?: { sql: string; params?: unknown[] }[]
}) {
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    opts.queryLog?.push({ sql, params })
    // Kiểm câu xoá subscription HẾT HẠN trước câu select chung (cả hai đều chứa chuỗi con
    // 'from public.push_subscriptions').
    if (sql.startsWith('delete from public.push_subscriptions where endpoint')) {
      return { rows: [] }
    }
    if (sql.includes('from public.push_subscriptions')) {
      return { rows: opts.subs }
    }
    if (sql.includes('from public.daily_usage') && sql.includes('day = $1 and user_id')) {
      return { rows: opts.usageRows ?? [] }
    }
    if (sql.includes('from english.challenge_entries')) {
      if (opts.challengeError) throw opts.challengeError
      return { rows: opts.challengeRows ?? [] }
    }
    if (sql.includes('from public.daily_usage') && sql.includes('day >= $2 and day < $3')) {
      if (opts.recentUsageError) throw opts.recentUsageError
      return { rows: opts.recentUsageRows ?? [] }
    }
    if (sql.includes('from english.learning_progress')) {
      return { rows: opts.progressRows ?? [] }
    }
    throw new Error(`câu SQL không mong đợi trong test: ${sql}`)
  })
  return { query } as unknown as ReturnType<typeof getPgPool>
}

const sub = (id: string): Row => ({
  user_id: id,
  endpoint: `https://fcm.googleapis.com/fcm/send/${id}`,
  p256dh: 'p256dh',
  auth_key: 'auth',
})

describe('sendReminders — chọn nội dung theo hoạt động challenge gần đây', () => {
  it('chưa học hôm nay + có challenge_entries trong 8 ngày gần đây → nhận payload challenge (url /challenge)', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({ subs: [sub('u1')], usageRows: [], challengeRows: [{ user_id: 'u1' }] }),
    )
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 1, skipped: 0, expired: 0, failed: 0 })
    const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
    expect(payload.url).toBe('/challenge')
    expect(payload.title).toMatch(/challenge/i)
  })

  it('chưa học hôm nay + KHÔNG có challenge_entries gần đây → nhận payload chung (url /)', async () => {
    mockedGetPool.mockReturnValue(mockPool({ subs: [sub('u2')], usageRows: [], challengeRows: [] }))
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 1, skipped: 0, expired: 0, failed: 0 })
    const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
    expect(payload.url).toBe('/')
  })

  it('đã học hôm nay (kể cả chỉ challenge — tính vào stt_count/chat_count) → bỏ qua, KHÔNG gửi', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({
        subs: [sub('u3')],
        usageRows: [{ user_id: 'u3', stt_count: 1, chat_count: 1 }],
        challengeRows: [{ user_id: 'u3' }],
      }),
    )
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 0, skipped: 1, expired: 0, failed: 0 })
    expect(mockedSend).not.toHaveBeenCalled()
  })

  it('bảng challenge_entries lỗi (migration 0010 chưa chạy) → fail-open về payload chung, không ném', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({
        subs: [sub('u4')],
        usageRows: [],
        challengeError: new Error('relation "challenge_entries" does not exist'),
      }),
    )
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 1, skipped: 0, expired: 0, failed: 0 })
    const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
    expect(payload.url).toBe('/')
  })

  it('nhiều user cùng lượt gửi — mỗi người nhận đúng payload theo trạng thái riêng', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({
        subs: [sub('challenge-user'), sub('generic-user')],
        usageRows: [],
        challengeRows: [{ user_id: 'challenge-user' }],
      }),
    )
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 2, skipped: 0, expired: 0, failed: 0 })
    const payloads = mockedSend.mock.calls.map((c) => JSON.parse(c[1] as string).url)
    expect(payloads.sort()).toEqual(['/', '/challenge'])
  })
})

describe('sendReminders — nội dung theo ngữ cảnh (② M3: streak/SRS/mục tiêu tuần)', () => {
  it('có streak liên tục 6 ngày trước (14 ngày gần nhất) → nhắc "mất chuỗi", ưu tiên hơn challenge', () => {
    return (async () => {
      mockedGetPool.mockReturnValue(
        mockPool({
          subs: [sub('u5')],
          usageRows: [],
          challengeRows: [{ user_id: 'u5' }], // có challenge nhưng streak phải thắng
          // 6 ngày liên tục kết thúc HÔM QUA (2026-07-15) — "hôm nay" giả lập là 2026-07-16.
          recentUsageRows: Array.from({ length: 6 }, (_, i) => ({
            user_id: 'u5',
            day: `2026-07-${String(10 + i).padStart(2, '0')}`,
            chat_count: 1,
          })),
        }),
      )
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-16T06:00:00Z')) // ~13h VN, "hôm nay" = 2026-07-16
      const result = await sendReminders(13)
      vi.useRealTimers()
      expect(result.sent).toBe(1)
      const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
      expect(payload.title).toContain('mất chuỗi')
      expect(payload.body).toContain('6')
    })()
  })

  it('không streak, có SRS đến hạn → nhắc ôn SRS', () => {
    return (async () => {
      mockedGetPool.mockReturnValue(
        mockPool({
          subs: [sub('u6')],
          usageRows: [],
          challengeRows: [],
          progressRows: [
            {
              user_id: 'u6',
              srs: {
                apple: { due: 1 },
                banana: { due: 1 },
                cherry: { due: Date.now() + 999_999_999 },
              },
            },
          ],
        }),
      )
      const result = await sendReminders(13)
      expect(result.sent).toBe(1)
      const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
      expect(payload.title).toContain('ôn')
      expect(payload.body).toContain('2') // chỉ 2/3 thẻ đã đến hạn (due <= now)
    })()
  })

  it('thẻ grammar:* đến hạn KHÔNG được tính vào "N từ cần ôn" (dùng chung kho FSRS với từ vựng, xem srs.ts)', () => {
    return (async () => {
      mockedGetPool.mockReturnValue(
        mockPool({
          subs: [sub('u-grammar')],
          usageRows: [],
          challengeRows: [],
          progressRows: [
            {
              user_id: 'u-grammar',
              srs: {
                apple: { due: 1 },
                'grammar:a1-be': { due: 1 },
                'grammar:a1-articles': { due: 1 },
              },
            },
          ],
        }),
      )
      const result = await sendReminders(13)
      expect(result.sent).toBe(1)
      const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
      expect(payload.body).toContain('1') // chỉ đếm 'apple' — 2 thẻ grammar: bị loại
    })()
  })

  it('không streak, không SRS, gần đạt mục tiêu tuần (còn 1 ngày) → nhắc mục tiêu tuần', () => {
    return (async () => {
      mockedGetPool.mockReturnValue(
        mockPool({
          subs: [sub('u7')],
          usageRows: [],
          challengeRows: [],
          progressRows: [{ user_id: 'u7', weekly_goal: { goal: 3 } }],
          recentUsageRows: [
            { user_id: 'u7', day: '2026-07-13', chat_count: 1 },
            { user_id: 'u7', day: '2026-07-14', chat_count: 1 },
          ],
        }),
      )
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-16T06:00:00Z'))
      const result = await sendReminders(13)
      vi.useRealTimers()
      expect(result.sent).toBe(1)
      const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
      expect(payload.title).toContain('mục tiêu tuần')
    })()
  })

  it('lỗi truy vấn daily_usage mở rộng → fail-open, vẫn gửi được (rơi về challenge/chung)', () => {
    return (async () => {
      mockedGetPool.mockReturnValue(
        mockPool({
          subs: [sub('u8')],
          usageRows: [],
          challengeRows: [],
          recentUsageError: new Error('timeout'),
        }),
      )
      const result = await sendReminders(13)
      expect(result.sent).toBe(1)
      const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
      expect(payload.url).toBe('/')
    })()
  })
})

describe('sendReminders — thiếu VAPID key', () => {
  it('không có VAPID_PUBLIC_KEY/PRIVATE_KEY → trả rỗng ngay, không gọi DB', async () => {
    vi.resetModules()
    vi.stubEnv('VAPID_PUBLIC_KEY', '')
    vi.stubEnv('VAPID_PRIVATE_KEY', '')
    const mod = await import('./push.js')
    const result = await mod.sendReminders(13)
    expect(result).toEqual({ sent: 0, skipped: 0, expired: 0, failed: 0 })
    expect(mockedGetPool).not.toHaveBeenCalled()
    // Khôi phục cho các test khác trong tiến trình (module cache đã bị reset).
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-test')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-test')
  })
})

describe('api/push default handler', () => {
  let handler: typeof import('./push.js').default

  beforeAll(async () => {
    vi.resetModules()
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-test')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-test')
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
    const mod = await import('./push.js')
    handler = mod.default
  })

  it('OPTIONS trả 204', async () => {
    const req = new Request('https://example.com/api/push', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('action vapid-key trả 200 và publicKey', async () => {
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'vapid-key' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as { publicKey: string }
    expect(json.publicKey).toBe('pub-test')
  })

  it('body json lỗi trả 400', async () => {
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: 'invalid-json',
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('action không hợp lệ trả 400', async () => {
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'unknown-action' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('action subscribe/unsubscribe khi chưa auth trả 401', async () => {
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'subscribe' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('action send-daily sai secret trả 403, đúng secret trả 200', async () => {
    const reqForbidden = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'send-daily', secret: 'wrong' }),
    })
    const resForbidden = await handler(reqForbidden)
    expect(resForbidden.status).toBe(403)

    mockedGetPool.mockReturnValue(mockPool({ subs: [] }))
    const reqOk = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'send-daily', secret: 'test-cron-secret', hour: 14 }),
    })
    const resOk = await handler(reqOk)
    expect(resOk.status).toBe(200)
  })

  it('action clear-all sai secret trả 403, đúng secret trả 200', async () => {
    const reqForbidden = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear-all', secret: 'wrong' }),
    })
    const resForbidden = await handler(reqForbidden)
    expect(resForbidden.status).toBe(403)

    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => ({ rowCount: 5 })),
    } as unknown as ReturnType<typeof getPgPool>)

    const reqOk = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear-all', secret: 'test-cron-secret' }),
    })
    const resOk = await handler(reqOk)
    expect(resOk.status).toBe(200)
    const json = (await resOk.json()) as { ok: boolean; deleted: number }
    expect(json.deleted).toBe(5)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// Đợt 2 coverage 2026-09-05: nhánh chưa phủ (branch 80% → siết lên ≥93%). Không lặp lại ca
// đã có ở trên — chỉ nhắm đúng nhánh còn thiếu trong uncovered-all.md.
// ═══════════════════════════════════════════════════════════════════════════════════════

describe('sendReminders — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('usage hôm nay chỉ có writing_count (chưa ghi chat/stt) → vẫn tính đã học hôm nay, không nhắc', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({ subs: [sub('u10')], usageRows: [{ user_id: 'u10', writing_count: 2 }] }),
    )
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 0, skipped: 1, expired: 0, failed: 0 })
    expect(mockedSend).not.toHaveBeenCalled()
  })

  it('recentUsageRows có 1 ngày tổng = 0 (dữ liệu rác, không có hoạt động thật) → KHÔNG tính vào ngày hoạt động (nhánh continue)', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({
        subs: [sub('u9')],
        usageRows: [],
        challengeRows: [],
        progressRows: [{ user_id: 'u9', weekly_goal: { goal: 3 } }],
        recentUsageRows: [
          { user_id: 'u9', day: '2026-07-13', chat_count: 1 },
          { user_id: 'u9', day: '2026-07-14', chat_count: 1 },
          // chat_count KHÔNG có (undefined) + mọi cột khác = 0 → tổng = 0, phải bị bỏ qua.
          {
            user_id: 'u9',
            day: '2026-07-15',
            writing_count: 0,
            speaking_count: 0,
            stt_count: 0,
            learn_count: 0,
          },
        ],
      }),
    )
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T06:00:00Z'))
    const result = await sendReminders(13)
    vi.useRealTimers()
    expect(result.sent).toBe(1)
    const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
    // Nếu ngày tổng=0 bị tính NHẦM thành ngày hoạt động thứ 3 thì weeklyDaysDone sẽ = 3 =
    // đạt đủ mục tiêu tuần (goal=3), và thông điệp sẽ KHÔNG còn nhắc "mục tiêu tuần" nữa —
    // assertion này khẳng định ngày rác đó không được tính.
    expect(payload.title).toContain('mục tiêu tuần')
  })

  it('bảng challenge_entries ném lỗi KHÔNG PHẢI Error (vd chuỗi thô) → vẫn fail-open về payload chung', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({ subs: [sub('u14')], usageRows: [], challengeError: 'day khong ket noi duoc' }),
    )
    const result = await sendReminders(13)
    expect(result.sent).toBe(1)
    const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
    expect(payload.url).toBe('/')
  })

  it('daily_usage/learning_progress mở rộng ném lỗi KHÔNG PHẢI Error → vẫn fail-open, vẫn gửi được', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({
        subs: [sub('u15')],
        usageRows: [],
        challengeRows: [],
        recentUsageError: 'timeout string thô',
      }),
    )
    const result = await sendReminders(13)
    expect(result.sent).toBe(1)
    const payload = JSON.parse(mockedSend.mock.calls[0]?.[1] as string)
    expect(payload.url).toBe('/')
  })

  it('sendNotification thất bại với statusCode 410 (subscription hết hạn) → tự xoá khỏi DB', async () => {
    const queryLog: { sql: string; params?: unknown[] }[] = []
    mockedGetPool.mockReturnValue(
      mockPool({ subs: [sub('u11')], usageRows: [], challengeRows: [], queryLog }),
    )
    const err = Object.assign(new Error('Gone'), { statusCode: 410 })
    mockedSend.mockRejectedValueOnce(err)
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 0, skipped: 0, expired: 1, failed: 0 })
    const deleteCall = queryLog.find((q) =>
      q.sql.startsWith('delete from public.push_subscriptions where endpoint'),
    )
    expect(deleteCall?.params?.[0]).toEqual(['https://fcm.googleapis.com/fcm/send/u11'])
  })

  it('sendNotification thất bại với statusCode KHÁC 410/404 (vd 500) → không tính hết hạn, không xoá', async () => {
    const queryLog: { sql: string; params?: unknown[] }[] = []
    mockedGetPool.mockReturnValue(
      mockPool({ subs: [sub('u12')], usageRows: [], challengeRows: [], queryLog }),
    )
    const err = Object.assign(new Error('Server Error'), { statusCode: 500 })
    mockedSend.mockRejectedValueOnce(err)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await sendReminders(13)
    // Lỗi không phải "hết hạn" được ĐẾM + log mã HTTP (audit 2026-10-10, E1.8) — không còn im lặng.
    expect(result).toEqual({ sent: 0, skipped: 0, expired: 0, failed: 1 })
    expect(warnSpy).toHaveBeenCalledWith('[push] gửi nhắc lỗi:', 500)
    warnSpy.mockRestore()
    expect(
      queryLog.some((q) =>
        q.sql.startsWith('delete from public.push_subscriptions where endpoint'),
      ),
    ).toBe(false)
  })

  it('sendNotification ném lỗi KHÔNG PHẢI object (vd chuỗi) → không tính hết hạn, không crash', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({ subs: [sub('u13')], usageRows: [], challengeRows: [] }),
    )
    mockedSend.mockRejectedValueOnce('mang loi roi')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await sendReminders(13)
    expect(result).toEqual({ sent: 0, skipped: 0, expired: 0, failed: 1 })
    expect(warnSpy).toHaveBeenCalledWith('[push] gửi nhắc lỗi:', 'mang loi roi')
    warnSpy.mockRestore()
  })
})

describe('sendReminders — biến môi trường VAPID hoàn toàn chưa set (Đợt 2 coverage 2026-09-05)', () => {
  it('VAPID_PUBLIC_KEY/PRIVATE_KEY undefined (chưa từng set — khác chuỗi rỗng) → vẫn coi là chưa cấu hình', async () => {
    vi.resetModules()
    // undefined (không phải '') để hit đúng nhánh `?? ''` khi biến CHƯA TỪNG được set.
    vi.stubEnv('VAPID_PUBLIC_KEY', undefined)
    vi.stubEnv('VAPID_PRIVATE_KEY', undefined)
    const mod = await import('./push.js')
    const result = await mod.sendReminders(13)
    expect(result).toEqual({ sent: 0, skipped: 0, expired: 0, failed: 0 })
    // Khôi phục cho các test khác trong tiến trình (module cache đã bị reset).
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-test')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-test')
  })
})

describe('api/push default handler — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  let handler: typeof import('./push.js').default

  beforeAll(async () => {
    vi.resetModules()
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-test')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-test')
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
    // Bypass xác thực thật (cookie/DB) — CHỈ dùng trong test, khoá cứng khi NODE_ENV=production
    // (xem packages/core-auth/security.ts#validateAuth).
    vi.stubEnv('SKIP_AUTH', 'true')
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('VERCEL_ENV', undefined)
    const mod = await import('./push.js')
    handler = mod.default
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockedGetPool.mockReset()
  })

  it('body JSON hợp lệ nhưng KHÔNG PHẢI object (vd chuỗi) → coi như body rỗng, action không hợp lệ trả 400', async () => {
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify('chi-la-mot-chuoi'),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Action không hợp lệ')
  })

  it('subscribe: auth hợp lệ + subscription hợp lệ → lưu thành công, remindHour mặc định null', async () => {
    const insertCalls: unknown[][] = []
    mockedGetPool.mockReturnValue({
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (sql.startsWith('insert into public.push_subscriptions')) {
          insertCalls.push(params ?? [])
          return { rows: [] }
        }
        throw new Error(`câu SQL không mong đợi: ${sql}`)
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({
        action: 'subscribe',
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/dev1',
          keys: { p256dh: 'p', auth: 'a' },
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: boolean }
    expect(json.ok).toBe(true)
    expect(insertCalls).toHaveLength(1)
    expect(insertCalls[0]?.[4]).toBeNull()
  })

  it('subscribe: subscription thiếu trường bắt buộc → 400, không đụng DB', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async (sql: string) => {
        throw new Error(`không nên gọi DB ở ca này: ${sql}`)
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'subscribe', subscription: { endpoint: '' } }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Thiếu dữ liệu subscription')
  })

  it('subscribe: DB insert lỗi → 500 với thông báo chung (không lộ lỗi CSDL)', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => {
        throw new Error('duplicate key value')
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({
        action: 'subscribe',
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/dev2',
          keys: { p256dh: 'p', auth: 'a' },
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Internal server error')
  })

  it('subscribe: remindHour hợp lệ (0-23, có phần thập phân) → làm tròn rồi lưu', async () => {
    const insertCalls: unknown[][] = []
    mockedGetPool.mockReturnValue({
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (sql.startsWith('insert into public.push_subscriptions')) {
          insertCalls.push(params ?? [])
          return { rows: [] }
        }
        throw new Error(`câu SQL không mong đợi: ${sql}`)
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({
        action: 'subscribe',
        remindHour: 7.6,
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/dev5',
          keys: { p256dh: 'p', auth: 'a' },
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    expect(insertCalls[0]?.[4]).toBe(8)
  })

  it('unsubscribe: auth hợp lệ → xoá đúng subscription', async () => {
    const deleteCalls: unknown[][] = []
    mockedGetPool.mockReturnValue({
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (sql.startsWith('delete from public.push_subscriptions where user_id')) {
          deleteCalls.push(params ?? [])
          return { rows: [] }
        }
        throw new Error(`câu SQL không mong đợi: ${sql}`)
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({
        action: 'unsubscribe',
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/dev3',
          keys: { p256dh: 'p', auth: 'a' },
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    expect(deleteCalls).toHaveLength(1)
    expect(deleteCalls[0]?.[1]).toBe('https://fcm.googleapis.com/fcm/send/dev3')
  })

  it('subscribe: DB insert ném lỗi KHÔNG PHẢI Error (vd chuỗi) → 500 với thông báo chung', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => {
        // KHÔNG PHẢI Error để phủ nhánh `err instanceof Error ? ... : String(err)` bên false.
        throw 'boom-string'
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({
        action: 'subscribe',
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/dev6',
          keys: { p256dh: 'p', auth: 'a' },
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Internal server error')
  })

  it('unsubscribe: DB delete lỗi → 500 với thông báo chung (không lộ lỗi CSDL)', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => {
        throw new Error('connection lost')
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({
        action: 'unsubscribe',
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/dev4',
          keys: { p256dh: 'p', auth: 'a' },
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Internal server error')
  })

  it('unsubscribe: DB delete ném lỗi KHÔNG PHẢI Error (vd chuỗi) → 500 với thông báo chung', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => {
        // KHÔNG PHẢI Error để phủ nhánh `err instanceof Error ? ... : String(err)` bên false.
        throw 'boom-string-2'
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({
        action: 'unsubscribe',
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/dev7',
          keys: { p256dh: 'p', auth: 'a' },
        },
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Internal server error')
  })

  it('send-daily: KHÔNG truyền hour → dùng giờ UTC hiện tại của server (fallback)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T09:30:00Z')) // UTC hour = 9
    mockedGetPool.mockReturnValue({
      query: vi.fn(async (sql: string) => {
        if (sql.includes('from public.push_subscriptions')) return { rows: [] }
        throw new Error(`câu SQL không mong đợi: ${sql}`)
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'send-daily', secret: 'test-cron-secret' }),
    })
    const res = await handler(req)
    vi.useRealTimers()
    expect(res.status).toBe(200)
    const json = (await res.json()) as { hour: number }
    expect(json.hour).toBe(9)
  })

  it('clear-all: DB không trả rowCount (undefined) → deleted mặc định 0', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => ({})),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear-all', secret: 'test-cron-secret' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as { deleted: number }
    expect(json.deleted).toBe(0)
  })

  it('clear-all: DB lỗi → 500 với thông báo chung (không lộ lỗi CSDL)', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => {
        throw new Error('table locked')
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear-all', secret: 'test-cron-secret' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Internal server error')
  })

  it('clear-all: DB ném lỗi KHÔNG PHẢI Error (vd chuỗi) → 500 với thông báo chung', async () => {
    mockedGetPool.mockReturnValue({
      query: vi.fn(async () => {
        // KHÔNG PHẢI Error để phủ nhánh `err instanceof Error ? ... : String(err)` bên false.
        throw 'boom-string-3'
      }),
    } as unknown as ReturnType<typeof getPgPool>)
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear-all', secret: 'test-cron-secret' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Internal server error')
  })
})

describe('api/push default handler — thiếu VAPID (Đợt 2 coverage 2026-09-05)', () => {
  it('POST khi CHƯA cấu hình VAPID key → 503, không đọc/định tuyến action', async () => {
    vi.resetModules()
    vi.stubEnv('VAPID_PUBLIC_KEY', '')
    vi.stubEnv('VAPID_PRIVATE_KEY', '')
    const mod = await import('./push.js')
    const req = new Request('https://example.com/api/push', {
      method: 'POST',
      body: JSON.stringify({ action: 'vapid-key' }),
    })
    const res = await mod.default(req)
    expect(res.status).toBe(503)
    const json = (await res.json()) as { error: string }
    expect(json.error).toContain('chưa được cấu hình')
    // Khôi phục cho tiến trình (module cache đã bị reset ở test trên).
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-test')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-test')
  })
})

describe('api/push — chống SSRF qua endpoint + rate limit (vá 2026-09-27)', () => {
  let handler: typeof import('./push.js').default
  let cronSecretMatches: typeof import('./push.js').cronSecretMatches
  let sendRemindersFresh: typeof import('./push.js').sendReminders

  beforeAll(async () => {
    vi.resetModules()
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-test')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-test')
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
    vi.stubEnv('SKIP_AUTH', 'true')
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('VERCEL_ENV', undefined)
    const mod = await import('./push.js')
    handler = mod.default
    cronSecretMatches = mod.cronSecretMatches
    sendRemindersFresh = mod.sendReminders
  })

  const subscribeReq = (endpoint: string, ip = '198.51.100.1') =>
    new Request('https://example.com/api/push', {
      method: 'POST',
      headers: { 'x-real-ip': ip },
      body: JSON.stringify({
        action: 'subscribe',
        subscription: { endpoint, keys: { p256dh: 'p', auth: 'a' } },
      }),
    })

  it.each([
    'https://attacker.example/collect',
    'https://127.0.0.1/internal',
    'https://localhost:6379/',
    'https://fcm.googleapis.com:8443/fcm/send/x',
    'http://fcm.googleapis.com/fcm/send/x',
    'https://fcm.googleapis.com.attacker.example/fcm/send/x',
  ])('subscribe endpoint ngoài dịch vụ push (%s) → 400, không ghi DB', async (endpoint) => {
    const query = vi.fn()
    mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
    const res = await handler(subscribeReq(endpoint))
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('sendReminders KHÔNG gửi tới dòng cũ trong DB có endpoint ngoài danh sách', async () => {
    mockedGetPool.mockReturnValue(
      mockPool({
        subs: [
          { user_id: 'u1', endpoint: 'https://attacker.example/x', p256dh: 'p', auth_key: 'a' },
          {
            user_id: 'u2',
            endpoint: 'https://fcm.googleapis.com/fcm/send/ok',
            p256dh: 'p',
            auth_key: 'a',
          },
        ],
      }),
    )
    const result = await sendRemindersFresh(13)
    expect(mockedSend).toHaveBeenCalledTimes(1)
    expect(mockedSend.mock.calls[0]?.[0].endpoint).toBe('https://fcm.googleapis.com/fcm/send/ok')
    expect(result.skipped).toBe(1)
  })

  it('quá 30 lượt/phút cùng một IP → 429', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 31; i++) {
      const res = await handler(
        new Request('https://example.com/api/push', {
          method: 'POST',
          headers: { 'x-real-ip': '203.0.113.250' },
          body: JSON.stringify({ action: 'vapid-key' }),
        }),
      )
      statuses.push(res.status)
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true)
    expect(statuses[30]).toBe(429)
  })

  it('cronSecretMatches: đúng khoá mới qua; sai/thiếu/không phải chuỗi đều trượt', () => {
    expect(cronSecretMatches('test-cron-secret')).toBe(true)
    expect(cronSecretMatches('test-cron-secreT')).toBe(false)
    expect(cronSecretMatches('')).toBe(false)
    expect(cronSecretMatches(undefined)).toBe(false)
    expect(cronSecretMatches(123)).toBe(false)
  })
})

describe('isLeakedVapidPublicKey (khoá VAPID đã lộ trong lịch sử git — 2026-09-27)', () => {
  it('nhận ra đúng khoá đã lộ (kể cả thừa khoảng trắng), bỏ qua khoá khác/rỗng', async () => {
    const { isLeakedVapidPublicKey, LEAKED_VAPID_PUBLIC_KEYS } = await import('./push.js')
    const leaked = LEAKED_VAPID_PUBLIC_KEYS[0] ?? ''
    expect(isLeakedVapidPublicKey(leaked)).toBe(true)
    expect(isLeakedVapidPublicKey(` ${leaked}\n`)).toBe(true)
    expect(isLeakedVapidPublicKey('BNewlyGeneratedKey')).toBe(false)
    expect(isLeakedVapidPublicKey('')).toBe(false)
    expect(isLeakedVapidPublicKey(undefined)).toBe(false)
  })
})

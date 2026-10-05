import { test, expect, type Page } from '@playwright/test'
import { mockLogin, USER_ID } from './helpers/auth'

// Cổng ĐỒNG BỘ NGOẠI TUYẾN (slice S09-2, AC-8 + AC-15).
//
// Vì sao phải là E2E chứ không phải unit: ca hỏng thật (phát hiện F4 của đặc tả) chỉ lộ ra khi
// có localStorage THẬT sống qua một lần tải lại trang, mạng THẬT bị ngắt (`context.setOffline`)
// và sự kiện `online` THẬT của trình duyệt. jsdom không có thứ nào trong ba thứ đó.
//
// Các ca ở đây gọi thẳng module thật của app qua `import()` trong trang (Vite dev phục vụ ES
// module) — đi qua đúng `saveLessonProgress`/`fetchProgress` mà giao diện dùng, chỉ bỏ phần bấm
// chuột qua bài học 8 bước (bài đó chạy Pyodide, mất ~2 phút, và không đo thêm gì cho slice này).

interface OutboxWindow extends Window {
  __sync: {
    save: (uid: string, lessonId: string, status: 'in_progress' | 'completed') => Promise<void>
    fetchProgress: (uid: string) => Promise<{ lessonId: string; status: string }[]>
    pending: (uid: string) => number
    flush: (uid: string) => Promise<{ sent: number; remaining: number; blocked?: string }>
  }
}

interface ProgModule {
  saveLessonProgress: OutboxWindow['__sync']['save']
  fetchProgress: OutboxWindow['__sync']['fetchProgress']
}
interface OutboxModule {
  pending: (uid: string) => number
  flush: (
    uid: string,
    opts?: { resetBackoff?: boolean },
  ) => Promise<{ sent: number; remaining: number; blocked?: string }>
}

async function loadSyncModules(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Đường dẫn để trong biến: đây là module của APP chạy trong trang, không phải của bộ test —
    // trình biên dịch của E2E không được phép cố phân giải nó.
    const progPath = '/src/lib/programmingProgress.ts'
    const outboxPath = '/src/lib/syncOutbox.ts'
    const prog = (await import(/* @vite-ignore */ progPath)) as ProgModule
    const outbox = (await import(/* @vite-ignore */ outboxPath)) as OutboxModule
    ;(window as unknown as OutboxWindow).__sync = {
      save: prog.saveLessonProgress,
      fetchProgress: prog.fetchProgress,
      pending: outbox.pending,
      flush: (uid: string) => outbox.flush(uid, { resetBackoff: true }),
    }
  })
}

test('học lúc mất mạng → tải lại trang vẫn còn → có mạng lại thì gửi MỘT batch', async ({
  page,
  context,
}) => {
  await mockLogin(page, 'vi', 'dark-blue')
  // Server "chưa có bài nào" — đúng tình huống làm bài học offline biến mất trước S09-2.
  await page.route('**/api/programming/progress', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"lessons":[]}' })
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true,"replayed":false,"lessons":[]}',
    })
  })

  const posts: string[] = []
  page.on('request', (req) => {
    if (req.url().includes('/api/programming/progress') && req.method() === 'POST')
      posts.push(req.postData() ?? '')
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  // Chờ chunk lười của Trang chủ tải XONG trước khi ngắt mạng: `setOffline` rơi vào lúc chunk
  // còn đang tải thì `lazyWithRetry` coi là chunk hỏng sau deploy và `location.reload()` —
  // `page.evaluate` bên dưới gãy "Execution context was destroyed" (CI PR #1229, shard 6).
  await expect(page.locator('main h1').first()).toBeAttached({ timeout: 30_000 })
  await loadSyncModules(page)

  // ── Mất mạng: hoàn thành 2 bài ──
  await context.setOffline(true)
  await page.evaluate(async (uid) => {
    const w = window as unknown as OutboxWindow
    await w.__sync.save(uid, 'p1-u4-l1', 'completed')
    await w.__sync.save(uid, 'p1-u4-l2', 'completed')
  }, USER_ID)
  expect(posts).toHaveLength(0) // offline: KHÔNG bắn request rác

  // ── Tải lại trang, server VẪN không tới được: bài phải còn ──
  // Không dùng `setOffline` cho bước này: ngoài đời trang được service worker (PWA) phục vụ lại,
  // còn ở dev server thì `reload` khi ngắt mạng chỉ gãy ở tầng tải trang — không đo được gì về
  // đồng bộ. Thay vào đó: cho trang tải bình thường, CHẶN riêng đường POST (server chưa nhận
  // được gì) và để GET trả về bản server THẬT SỰ CHƯA CÓ bài vừa học — đúng ca làm mất dữ liệu.
  // Chặn POST TRƯỚC khi bật mạng lại: app (đã tải xong) nghe sự kiện `online` và tự `flush` ngay —
  // nếu route chặn đặt SAU `setOffline(false)` thì lượt gửi tự động đó lọt tới route "thành công"
  // ở trên và hàng đợi rỗng trước khi kịp đo bước tải lại.
  await page.route('**/api/programming/progress', (route) =>
    route.request().method() === 'POST'
      ? route.abort('internetdisconnected')
      : route.fulfill({ status: 200, contentType: 'application/json', body: '{"lessons":[]}' }),
  )
  await context.setOffline(false)
  // Playwright's `setOffline` resolves trước khi trạng thái mạng của renderer THẬT SỰ đổi
  // (độ trễ CDP) — gọi `reload()` ngay sau đó thỉnh thoảng bị `net::ERR_ABORTED` vì điều hướng
  // khởi động lúc trang vẫn còn coi là offline. Đo được: flaky ~50% (2/4 lượt) trước khi chờ
  // `navigator.onLine` thật sự lật lại true. Không phải cổng 5179 dùng chung (đã chạy cổng riêng).
  await page.waitForFunction(() => navigator.onLine === true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await loadSyncModules(page)
  const afterReload = await page.evaluate(async (uid) => {
    const w = window as unknown as OutboxWindow
    // Đếm riêng mục `programming`: trang vừa tải xong có thể đang xếp/gửi một mục `english`
    // (bản chụp tiến độ môn Anh) — không thuộc phép đo "2 bài gộp vào MỘT batch".
    const raw = localStorage.getItem(`dhcb_sync_outbox_${uid}`)
    const entries = raw ? (JSON.parse(raw) as { kind: string }[]) : []
    return {
      pending: entries.filter((e) => e.kind === 'programming').length,
      lessons: await w.__sync.fetchProgress(uid),
    }
  }, USER_ID)
  expect(afterReload.pending).toBe(1) // 2 bài gộp vào MỘT mục batch
  expect(
    afterReload.lessons.filter((l) => l.status === 'completed').map((l) => l.lessonId),
  ).toEqual(['p1-u4-l1', 'p1-u4-l2'])

  // ── Server nhận lại được: gửi đúng một request batch, hàng đợi rỗng ──
  // Lượt gửi tự động bị chặn ở bước trên (app tự `flush` khi có mạng lại) không tính — chỉ đo
  // các request gửi tới server ĐÃ nhận được.
  posts.length = 0
  await page.unroute('**/api/programming/progress')
  await page.route('**/api/programming/progress', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body:
        route.request().method() === 'GET'
          ? '{"lessons":[]}'
          : '{"ok":true,"replayed":false,"lessons":[]}',
    }),
  )
  const result = await page.evaluate((uid) => {
    const w = window as unknown as OutboxWindow
    return w.__sync.flush(uid)
  }, USER_ID)
  expect(result.remaining).toBe(0)
  expect(posts).toHaveLength(1)
  const body = JSON.parse(posts[0]!) as {
    attemptId: string
    items: { lessonId: string; status: string }[]
  }
  expect(body.attemptId.length).toBeGreaterThanOrEqual(8)
  expect(body.items.map((i) => i.lessonId)).toEqual(['p1-u4-l1', 'p1-u4-l2'])
})

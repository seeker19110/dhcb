import { test, expect, type Page, type Route } from '@playwright/test'
import { mockLogin, USER_ID } from './auth'

export type Direction = 'A' | 'B'
interface NativeResult {
  results: { 0: { transcript: string }; isFinal: boolean }[]
}
export interface VoiceSnapshot {
  identity: string
  permission: number
  tracksStopped: number
  constructed: number
  started: number
  stopped: number
  spoken: { text: string; lang: string }[]
  audioPlays: number
  sttJsonRead: number
  nativeStops: number
  nativeEmits: number
  apiStarted: Record<'stt' | 'tts' | 'agent' | 'companion', number>
}
declare global {
  interface Window {
    __voiceLifecycle: {
      snapshot(): VoiceSnapshot
      releasePermission(): void
      nativeResult(text: string, final: boolean): void
      nativeEnd(): void
    }
  }
}
function barrier() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

export async function prepareVoice(
  page: Page,
  options: { dir?: Direction; native?: boolean; holdStt?: boolean } = {},
) {
  const ownerInfo = test.info()
  let allowedOrigin: string
  try {
    const baseURL = ownerInfo.project.use.baseURL
    if (typeof baseURL !== 'string') throw new Error('missing_base_url')
    const url = new URL(baseURL)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      (baseURL !== url.origin && baseURL !== url.href)
    )
      throw new Error('invalid_base_url')
    allowedOrigin = url.origin
  } catch {
    throw new Error('VOICE_FIXTURE_REQUIRES_LOCAL_BASE_URL')
  }
  const dir = options.dir ?? 'A'
  const stt = barrier()
  const violations: string[] = [],
    calls: { path: string; method: string; body: unknown }[] = []
  const moduleRequests = new Set<string>()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.includes('/src/') && /\.(tsx?|jsx?)/.test(url.pathname))
      moduleRequests.add(url.pathname)
  })
  await mockLogin(page, dir === 'A' ? 'vi' : 'en', 'blue-sky')
  await page.addInitScript(
    ({ dir, native }) => {
      localStorage.setItem('et_direction', dir)
      const data: VoiceSnapshot = {
        identity: crypto.randomUUID(),
        permission: 0,
        tracksStopped: 0,
        constructed: 0,
        started: 0,
        stopped: 0,
        spoken: [],
        audioPlays: 0,
        sttJsonRead: 0,
        nativeStops: 0,
        nativeEmits: 0,
        apiStarted: { stt: 0, tts: 0, agent: 0, companion: 0 },
      }
      let resolvePermission!: (stream: { getTracks(): { stop(): void }[] }) => void
      const pendingPermission = new Promise<{ getTracks(): { stop(): void }[] }>((resolve) => {
        resolvePermission = resolve
      })
      const tracks = [
        {
          stop() {
            data.tracksStopped++
          },
        },
      ]
      const stream = { getTracks: () => tracks }
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia() {
            data.permission++
            return pendingPermission
          },
        },
      })
      class Recorder {
        static isTypeSupported(mime: string) {
          return mime === 'audio/webm;codecs=opus'
        }
        ondataavailable: ((event: { data: Blob }) => void) | null = null
        onstop: (() => void) | null = null
        constructor() {
          data.constructed++
        }
        start() {
          data.started++
        }
        stop() {
          data.stopped++
          queueMicrotask(() => {
            this.ondataavailable?.({ data: new Blob(['synthetic browser audio']) })
            this.onstop?.()
          })
        }
      }
      Object.defineProperty(window, 'MediaRecorder', {
        configurable: true,
        value: native ? undefined : Recorder,
      })
      class Reader {
        result: string | null = null
        onloadend: (() => void) | null = null
        onerror: (() => void) | null = null
        readAsDataURL() {
          queueMicrotask(() => {
            this.result = 'data:audio/webm;base64,c3ludGhldGlj'
            this.onloadend?.()
          })
        }
      }
      Object.defineProperty(window, 'FileReader', { configurable: true, value: Reader })
      const currentRecognition: { value: Recognition | null } = { value: null }
      class Recognition {
        lang = ''
        continuous = false
        interimResults = false
        onresult: ((event: NativeResult) => void) | null = null
        onend: (() => void) | null = null
        onerror: ((event: { error: string }) => void) | null = null
        constructor() {
          currentRecognition.value = this
        }
        start() {
          data.started++
        }
        stop() {
          data.nativeStops++
        }
      }
      Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: Recognition })
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          getVoices: () => [],
          pause() {},
          resume() {},
          cancel() {},
          speak(utterance: SpeechSynthesisUtterance) {
            data.spoken.push({ text: utterance.text, lang: utterance.lang })
            queueMicrotask(() => utterance.dispatchEvent(new Event('end')))
          },
        },
      })
      HTMLMediaElement.prototype.play = function () {
        data.audioPlays++
        queueMicrotask(() => {
          this.dispatchEvent(new Event('playing'))
          this.dispatchEvent(new Event('ended'))
        })
        return Promise.resolve()
      }
      HTMLMediaElement.prototype.pause = function () {}
      const realFetch = window.fetch.bind(window)
      window.fetch = async (...args) => {
        const requestUrl = String(args[0] instanceof Request ? args[0].url : args[0])
        const path = new URL(requestUrl, location.origin).pathname
        const method = args[1]?.method ?? (args[0] instanceof Request ? args[0].method : 'GET')
        if (method === 'POST') {
          if (path === '/api/stt') data.apiStarted.stt++
          if (path === '/api/tts') data.apiStarted.tts++
          if (path === '/api/agent') data.apiStarted.agent++
          if (path === '/api/companion') data.apiStarted.companion++
        }
        const response = await realFetch(...args)
        if (path === '/api/stt') {
          const read = response.json.bind(response)
          response.json = async () => {
            const value: unknown = await read()
            data.sttJsonRead++
            return value
          }
        }
        return response
      }
      window.__voiceLifecycle = {
        snapshot: () => structuredClone(data),
        releasePermission: () => resolvePermission(stream),
        nativeResult: (text, final) => {
          data.nativeEmits++
          currentRecognition.value?.onresult?.({
            results: [{ 0: { transcript: text }, isFinal: final }],
          })
        },
        nativeEnd: () => {
          data.nativeEmits++
          currentRecognition.value?.onend?.()
        },
      }
    },
    { dir, native: !!options.native },
  )
  const json = (route: Route, value: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) })
  await page.route('**/*', async (route) => {
    const request = route.request(),
      url = new URL(request.url())
    if (url.origin !== allowedOrigin) {
      violations.push('external:' + url.origin)
      await route.abort()
      return
    }
    if (!url.pathname.startsWith('/api/')) {
      await route.fallback()
      return
    }
    const method = request.method()
    let body: unknown = null
    try {
      body = request.postDataJSON()
    } catch {
      violations.push('invalid_json:' + url.pathname)
    }
    calls.push({ path: url.pathname, method, body })
    if (url.pathname === '/api/stt' && method === 'POST') {
      if (options.holdStt) await stt.promise
      await json(route, { text: 'synthetic final transcript' })
      return
    }
    if (url.pathname === '/api/tts' && method === 'POST') {
      await json(route, {}, 503)
      return
    }
    if (url.pathname === '/api/agent' && method === 'POST') {
      await json(route, {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              speech: 'synthetic tutor greeting',
              feedback: '',
              corrected: '',
            }),
          },
        ],
      })
      return
    }
    if (url.pathname === '/api/companion' && method === 'GET') {
      await json(route, { messages: [] })
      return
    }
    if (url.pathname === '/api/companion' && method === 'POST') {
      const reply = {
        reply: 'synthetic companion reply',
        proposedActions: [],
        interactiveQuestions: [],
        intent: 'general',
        targetDomain: 'general',
      }
      await route.fulfill({
        contentType: 'text/event-stream',
        body: `event: chunk\ndata: ${JSON.stringify({ delta: reply.reply })}\n\nevent: done\ndata: ${JSON.stringify(reply)}\n\n`,
      })
      return
    }
    if (url.pathname === '/api/companion-memory' && method === 'GET') {
      await json(route, {
        settings: { rememberMemories: false, useHistory: false, suggestMemories: false },
      })
      return
    }
    if (url.pathname === '/api/subjects' && method === 'GET') {
      await json(route, { subjects: [] })
      return
    }
    if (url.pathname === '/api/plan-features' && method === 'GET') {
      await json(route, { catalog: [], flags: {}, updatedAt: '1970-01-01T00:00:00.000Z' })
      return
    }
    if (url.pathname === '/api/plan-marketing' && method === 'GET') {
      await json(route, {
        plans: {
          free: { plan: 'free', badge: '', taglineVi: '', taglineEn: '', bullets: [] },
          vip: { plan: 'vip', badge: '', taglineVi: '', taglineEn: '', bullets: [] },
        },
        updatedAt: '1970-01-01T00:00:00.000Z',
      })
      return
    }
    if (url.pathname === '/api/mesh-telemetry' && method === 'GET') {
      await json(route, { error: 'SYNTHETIC_TELEMETRY_UNAVAILABLE' }, 503)
      return
    }
    if (url.pathname === '/api/history') {
      await json(
        route,
        method === 'GET' ? { chat: [], writing: [], speaking: [], usage: [] } : { ok: true },
      )
      return
    }
    if (
      [
        '/api/auth',
        '/api/profile',
        '/api/app-settings',
        '/api/progress',
        '/api/life-synthesis',
        '/api/companion-cards',
      ].includes(url.pathname)
    ) {
      await route.fallback()
      return
    }
    violations.push('unmatched:' + method + ':' + url.pathname)
    await json(route, { error: 'UNMATCHED_BROWSER_API' }, 503)
  })
  return {
    dir,
    calls,
    violations,
    moduleRequests,
    releaseStt: stt.release,
    snapshot: () => page.evaluate(() => window.__voiceLifecycle.snapshot()),
    count: (path: string, method = 'POST') =>
      calls.filter((call) => call.path === path && call.method === method).length,
    async releasePermission() {
      await page.evaluate(() => window.__voiceLifecycle.releasePermission())
    },
    async readStt() {
      await expect
        .poll(
          async () => (await page.evaluate(() => window.__voiceLifecycle.snapshot())).sttJsonRead,
        )
        .toBe(1)
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      )
    },
    async assertLedger() {
      expect(violations).toEqual([])
    },
    async cleanup() {
      const snapshot = await page
        .evaluate(() => window.__voiceLifecycle?.snapshot())
        .catch(() => null)
      const mainText = await page
        .locator('main')
        .innerText()
        .catch(() => null)
      await ownerInfo.attach('voice-boundary-evidence', {
        contentType: 'application/json',
        body: JSON.stringify({
          snapshot,
          mainText,
          calls: calls.map(({ path, method, body }) => ({
            path,
            method,
            ...(path === '/api/stt' ? { body } : {}),
          })),
          sourceModules: [...moduleRequests].filter((path) =>
            /Companion|Speaking|stt|tts/.test(path),
          ),
          violations,
        }),
      })
      stt.release()
      await page.evaluate(() => window.__voiceLifecycle?.releasePermission()).catch(() => {})
      // Giữ deny guard tới khi page đóng: tài nguyên fake còn sống từ case đỏ bị cách ly,
      // không biến việc teardown browser thành bằng chứng cleanup của sản phẩm.
      await page.close().catch(() => {})
      await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {})
      expect(violations).toEqual([])
    },
  }
}
export async function leaveViaSpa(page: Page) {
  const identity = await page.evaluate(() => window.__voiceLifecycle.snapshot().identity)
  await page.locator('a[href="/goc-hoc-tap"]:visible').first().click()
  await expect(page).toHaveURL(/\/goc-hoc-tap$/)
  // URL đổi trước lazy destination commit. Đợi DOM trang đích để cleanup cũ đã chạy.
  await expect(page.getByRole('heading', { name: 'Góc học tập', exact: true })).toBeAttached()
  expect(await page.evaluate(() => window.__voiceLifecycle.snapshot().identity)).toBe(identity)
}
export async function openCompanion(page: Page) {
  await page.goto('/ban-dong-hanh')
  await page.getByRole('button', { name: 'Đàm thoại giọng nói', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Nhấn để nói', exact: true })).toBeEnabled()
}
export async function openSpeaking(page: Page, fixture: Awaited<ReturnType<typeof prepareVoice>>) {
  await page.goto('/goc-hoc-tap/english/luyen-noi')
  await page
    .getByRole('button', {
      name: fixture.dir === 'A' ? 'Bắt đầu luyện nói' : 'Start speaking practice',
      exact: true,
    })
    .click()
  await expect.poll(() => fixture.count('/api/agent')).toBe(1)
  await expect.poll(async () => (await fixture.snapshot()).spoken.length).toBe(1)
  expect((await fixture.snapshot()).spoken[0]?.lang).toBe(fixture.dir === 'A' ? 'en-US' : 'vi-VN')
  await expect(
    page.getByRole('button', {
      name: fixture.dir === 'A' ? 'Bắt đầu ghi âm' : 'Start recording',
      exact: true,
    }),
  ).toBeEnabled({ timeout: 7000 })
}
export async function usage(page: Page) {
  return page.evaluate(
    (uid) =>
      Object.entries(localStorage)
        .filter(([key]) => key.startsWith('et_usage_' + uid + '_'))
        .map(([, value]) => JSON.parse(value) as { sttCount: number; speakingCount: number })
        .reduce(
          (sum, item) => ({
            stt: sum.stt + item.sttCount,
            speaking: sum.speaking + item.speakingCount,
          }),
          { stt: 0, speaking: 0 },
        ),
    USER_ID,
  )
}

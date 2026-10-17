import { test, expect, type Page } from '@playwright/test'

// Import type theo vị trí đích e2e/ trong repo; fixture gọi module TTS thật qua Vite.
type TtsApi = typeof import('../apps/dhcb/src/lib/tts')
type Lang = 'en-US' | 'vi-VN'

declare global {
  interface Window {
    __ttsCancellation: {
      spoken: string[]
      words: number[]
      start: () => void
      stop: () => void
      replace: () => Promise<void>
      startReplacement: () => void
      waitOriginal: () => Promise<void>
      finish: () => void
      wait: () => Promise<void>
    }
  }
}

async function prepare(
  page: Page,
  speechLang: Lang,
  feedbackLang: Lang,
  heldRequest: boolean | 'both' = false,
) {
  let requests = 0
  let release: () => void = () => {}
  const barrier = new Promise<void>((resolve) => {
    release = resolve
  })
  let releaseNew: () => void = () => {}
  const newBarrier = new Promise<void>((resolve) => {
    releaseNew = resolve
  })
  const unexpected: string[] = []
  await page.route('**/__tts_cancellation__', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>TTS fixture</title>' }),
  )
  await page.route('**/api/tts', async (route) => {
    const requestIndex = ++requests
    if (route.request().method() !== 'POST') unexpected.push('tts_method')
    if (heldRequest && requestIndex === 1) await barrier
    if (heldRequest === 'both' && requestIndex === 2) await newBarrier
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })
  await page.goto('/__tts_cancellation__')
  await page.evaluate(
    async ({ moduleUrl, speechLang, feedbackLang, holdSpeech }) => {
      const api: TtsApi = await import(moduleUrl)
      const spoken: string[] = []
      const words: number[] = []
      let held: SpeechSynthesisUtterance | null = null
      let old: SpeechSynthesisUtterance | null = null
      let pending: Promise<void> = Promise.resolve()
      let replacement: Promise<void> = Promise.resolve()
      const boundary = (utterance: SpeechSynthesisUtterance | null) => {
        if (utterance)
          utterance.dispatchEvent(
            new SpeechSynthesisEvent('boundary', { utterance, name: 'word', charIndex: 0 }),
          )
      }
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          getVoices: () => [],
          cancel: () => {
            const previous = held
            held = null
            previous?.dispatchEvent(new Event('error'))
          },
          speak: (utterance: SpeechSynthesisUtterance) => {
            spoken.push(utterance.text)
            if (holdSpeech && utterance.text === 'synthetic speech') held = utterance
            else queueMicrotask(() => utterance.dispatchEvent(new Event('end')))
          },
        },
      })
      window.__ttsCancellation = {
        spoken,
        words,
        start: () => {
          pending = api.speakBilingual(
            'synthetic speech',
            'synthetic feedback',
            speechLang,
            feedbackLang,
            'Kore',
            1,
            (index) => words.push(index),
            undefined,
            'Kore',
          )
        },
        stop: () => {
          old = held
          api.stopSpeaking()
          boundary(old)
        },
        replace: async () => {
          old = held
          await api.speak('synthetic replacement', speechLang, 'Kore', 1)
          await pending
          boundary(old)
        },
        startReplacement: () => {
          replacement = api.speak('synthetic replacement', speechLang, 'Kore', 1).then(() => {})
        },
        waitOriginal: () => pending,
        finish: () => {
          const previous = held
          held = null
          boundary(previous)
          previous?.dispatchEvent(new Event('end'))
        },
        wait: () => Promise.all([pending, replacement]).then(() => {}),
      }
    },
    { moduleUrl: '/src/lib/tts.ts', speechLang, feedbackLang, holdSpeech: !heldRequest },
  )
  return { count: () => requests, release, releaseNew, unexpected }
}

for (const [speechLang, feedbackLang] of [
  ['en-US', 'vi-VN'],
  ['vi-VN', 'en-US'],
] as const) {
  test(`${speechLang} → ${feedbackLang}: lỗi câu cũ không chiếm vé khi câu mới vẫn đang tải`, async ({
    page,
  }) => {
    const fixture = await prepare(page, speechLang, feedbackLang, 'both')
    try {
      await page.evaluate(() => window.__ttsCancellation.start())
      await expect.poll(fixture.count).toBe(1)
      await page.evaluate(() => window.__ttsCancellation.startReplacement())
      await expect.poll(fixture.count).toBe(2)
      fixture.release()
      await page.evaluate(() => window.__ttsCancellation.waitOriginal())
      const beforeNewLoad = await page.evaluate(() => [...window.__ttsCancellation.spoken])
      fixture.releaseNew()
      await page.evaluate(() => window.__ttsCancellation.wait())
      expect(beforeNewLoad).toEqual([])
      expect(await page.evaluate(() => window.__ttsCancellation.spoken)).toEqual([
        'synthetic replacement',
      ])
      expect(fixture.count()).toBe(2)
      expect(fixture.unexpected).toEqual([])
    } finally {
      fixture.release()
      fixture.releaseNew()
    }
  })

  test(`${speechLang} → ${feedbackLang}: lỗi tải sau hủy không phát dự phòng hay giải thích`, async ({
    page,
  }) => {
    const fixture = await prepare(page, speechLang, feedbackLang, true)
    try {
      await page.evaluate(() => window.__ttsCancellation.start())
      await expect.poll(fixture.count).toBe(1)
      await page.evaluate(() => window.__ttsCancellation.stop())
      fixture.release()
      await page.evaluate(() => window.__ttsCancellation.wait())
      expect(await page.evaluate(() => window.__ttsCancellation.spoken)).toEqual([])
      expect(fixture.count()).toBe(1)
      expect(fixture.unexpected).toEqual([])
    } finally {
      fixture.release()
    }
  })

  for (const action of ['stop', 'replace', 'finish'] as const) {
    test(`${speechLang} → ${feedbackLang}: Web Speech ${action} giữ đúng lượt và karaoke`, async ({
      page,
    }) => {
      const fixture = await prepare(page, speechLang, feedbackLang)
      await page.evaluate(() => window.__ttsCancellation.start())
      await expect
        .poll(() => page.evaluate(() => window.__ttsCancellation.spoken))
        .toEqual(['synthetic speech'])
      await page.evaluate(async (operation) => {
        await window.__ttsCancellation[operation]()
        await window.__ttsCancellation.wait()
      }, action)
      expect(await page.evaluate(() => window.__ttsCancellation.spoken)).toEqual(
        action === 'stop'
          ? ['synthetic speech']
          : [
              'synthetic speech',
              action === 'replace' ? 'synthetic replacement' : 'synthetic feedback',
            ],
      )
      expect(await page.evaluate(() => window.__ttsCancellation.words)).toEqual(
        action === 'finish' ? [0] : [],
      )
      expect(fixture.count()).toBe(action === 'stop' ? 1 : 2)
      expect(fixture.unexpected).toEqual([])
    })
  }
}

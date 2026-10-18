import { test, expect } from '@playwright/test'
import {
  prepareVoice,
  openCompanion,
  openSpeaking,
  leaveViaSpa,
  usage,
} from './helpers/voiceLifecycle'

test('control Companion active server STT sends once and actual TTS falls back once', async ({
  page,
}, info) => {
  const f = await prepareVoice(page)
  try {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await openCompanion(page)
    await page.screenshot({
      path: info.outputPath('companion-desktop-1440.png'),
      animations: 'disabled',
    })
    await page.getByRole('button', { name: 'Nhấn để nói', exact: true }).click()
    await f.releasePermission()
    await expect(page.getByRole('button', { name: 'Dừng ghi âm', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Dừng ghi âm', exact: true }).click()
    await f.readStt()
    await expect.poll(() => f.count('/api/companion')).toBe(1)
    await expect.poll(async () => (await f.snapshot()).spoken.length).toBe(1)
    expect(f.count('/api/stt')).toBe(1)
    expect(f.calls.find((call) => call.path === '/api/stt')?.body).toMatchObject({
      lang: 'vi',
      audio_b64: 'c3ludGhldGlj',
    })
    expect(f.count('/api/tts')).toBe(1)
    expect((await f.snapshot()).tracksStopped).toBe(1)
    expect(f.moduleRequests.has('/src/lib/sttServer.ts')).toBe(true)
    expect(f.moduleRequests.has('/src/lib/tts.ts')).toBe(true)
    await f.assertLedger()
  } finally {
    await f.cleanup()
  }
})
test('Companion permission resolves after SPA leave without starting capture', async ({
  page,
}, info) => {
  const f = await prepareVoice(page)
  try {
    await page.setViewportSize({ width: 390, height: 844 })
    await openCompanion(page)
    await page.screenshot({
      path: info.outputPath('companion-mobile-390.png'),
      animations: 'disabled',
    })
    const microphone = page.getByRole('button', { name: 'Nhấn để nói', exact: true })
    await microphone.focus()
    await microphone.press('Enter')
    await expect.poll(async () => (await f.snapshot()).permission).toBe(1)
    await leaveViaSpa(page)
    await f.releasePermission()
    await expect.poll(async () => (await f.snapshot()).tracksStopped).toBe(1)
    expect((await f.snapshot()).started).toBe(0)
    expect(f.count('/api/stt')).toBe(0)
    expect(f.count('/api/companion')).toBe(0)
  } finally {
    await f.cleanup()
  }
})
test('Companion sent STT then stopSession does not send AI or TTS', async ({ page }) => {
  const f = await prepareVoice(page, { holdStt: true })
  try {
    await openCompanion(page)
    await page.getByRole('button', { name: 'Nhấn để nói', exact: true }).click()
    await f.releasePermission()
    await page.getByRole('button', { name: 'Dừng ghi âm', exact: true }).click()
    await expect.poll(() => f.count('/api/stt')).toBe(1)
    await page.getByRole('button', { name: 'Dừng', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Nhấn để nói', exact: true })).toBeVisible()
    f.releaseStt()
    await f.readStt()
    expect((await f.snapshot()).apiStarted.companion).toBe(0)
    expect(f.count('/api/companion')).toBe(0)
    expect(f.count('/api/tts')).toBe(0)
    expect((await f.snapshot()).spoken).toEqual([])
    expect((await f.snapshot()).tracksStopped).toBe(1)
  } finally {
    await f.cleanup()
  }
})
for (const dir of ['A', 'B'] as const) {
  const start = dir === 'A' ? 'Bắt đầu ghi âm' : 'Start recording',
    stop = dir === 'A' ? 'Dừng ghi âm' : 'Stop recording',
    newRoom = dir === 'A' ? 'Phòng mới' : 'New room'
  test(`Speaking ${dir} permission resolves after ${dir === 'A' ? 'SPA leave' : 'New room'} without capture`, async ({
    page,
  }, info) => {
    const f = await prepareVoice(page, { dir })
    try {
      await page.setViewportSize(
        dir === 'A' ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
      )
      await openSpeaking(page, f)
      await page.screenshot({
        path: info.outputPath(
          dir === 'A' ? 'speaking-desktop-1440.png' : 'speaking-mobile-390.png',
        ),
        animations: 'disabled',
      })
      await page.getByRole('button', { name: start, exact: true }).click()
      await expect.poll(async () => (await f.snapshot()).permission).toBe(1)
      if (dir === 'A') await leaveViaSpa(page)
      else {
        await page.getByRole('button', { name: newRoom, exact: true }).click()
        await expect(
          page.getByRole('button', { name: 'Start speaking practice', exact: true }),
        ).toBeVisible()
      }
      await f.releasePermission()
      await expect.poll(async () => (await f.snapshot()).tracksStopped).toBe(1)
      expect((await f.snapshot()).started).toBe(0)
      expect(f.count('/api/agent')).toBe(1)
      expect(f.count('/api/stt')).toBe(0)
    } finally {
      await f.cleanup()
    }
  })
  test(`Speaking ${dir} sent STT then New room keeps receipt and does not resurrect/send`, async ({
    page,
  }) => {
    const f = await prepareVoice(page, { dir, holdStt: true })
    try {
      await openSpeaking(page, f)
      const baselineUsage = await usage(page)
      const baselineSpeech = (await f.snapshot()).spoken.length
      await page.clock.install()
      await page.getByRole('button', { name: start, exact: true }).click()
      await f.releasePermission()
      await page.getByRole('button', { name: stop, exact: true }).click()
      await expect.poll(() => f.count('/api/stt')).toBe(1)
      expect(f.calls.find((call) => call.path === '/api/stt')?.body).toMatchObject({
        lang: dir === 'A' ? 'en' : 'vi',
        audio_b64: 'c3ludGhldGlj',
      })
      await page.getByRole('button', { name: newRoom, exact: true }).click()
      await expect(
        page.getByRole('button', {
          name: dir === 'A' ? 'Bắt đầu luyện nói' : 'Start speaking practice',
          exact: true,
        }),
      ).toBeVisible()
      f.releaseStt()
      await f.readStt()
      await page.clock.runFor(2500)
      expect((await usage(page)).stt - baselineUsage.stt).toBe(1)
      expect((await f.snapshot()).apiStarted.agent).toBe(1)
      expect(f.count('/api/agent')).toBe(1)
      expect((await f.snapshot()).spoken.length).toBe(baselineSpeech)
      await expect(
        page.getByRole('button', {
          name: dir === 'A' ? 'Bắt đầu luyện nói' : 'Start speaking practice',
          exact: true,
        }),
      ).toBeVisible()
    } finally {
      await f.cleanup()
    }
  })
  test(`Speaking ${dir} native manual Stop preserves final confirm and one send`, async ({
    page,
  }) => {
    const f = await prepareVoice(page, { dir, native: true })
    try {
      await openSpeaking(page, f)
      const baselineUsage = await usage(page)
      await page.clock.install()
      await page.getByRole('button', { name: start, exact: true }).click()
      await page.evaluate(() => window.__voiceLifecycle.nativeResult('synthetic interim', false))
      await page.getByRole('button', { name: stop, exact: true }).click()
      await page.evaluate(() => {
        window.__voiceLifecycle.nativeResult('synthetic final transcript', true)
        window.__voiceLifecycle.nativeEnd()
      })
      await expect(
        page.getByText('synthetic final transcript', { exact: false }).first(),
      ).toBeVisible()
      await page.clock.runFor(2500)
      await expect.poll(() => f.count('/api/agent')).toBe(2)
      expect(f.calls.filter((call) => call.path === '/api/agent')[1]?.body).toMatchObject({
        mode: 'speaking',
        messages: expect.arrayContaining([{ role: 'user', content: 'synthetic final transcript' }]),
      })
      expect((await usage(page)).stt).toBe(baselineUsage.stt)
      expect(f.count('/api/stt')).toBe(0)
      expect((await f.snapshot()).nativeStops).toBe(1)
    } finally {
      await f.cleanup()
    }
  })
}
test('control Speaking active server STT preserves receipt and sends once', async ({ page }) => {
  const f = await prepareVoice(page)
  try {
    await openSpeaking(page, f)
    const baselineUsage = await usage(page)
    await page.clock.install()
    await page.getByRole('button', { name: 'Bắt đầu ghi âm', exact: true }).click()
    await f.releasePermission()
    await page.getByRole('button', { name: 'Dừng ghi âm', exact: true }).click()
    await f.readStt()
    await page.clock.runFor(2500)
    await expect.poll(() => f.count('/api/agent')).toBe(2)
    expect((await usage(page)).stt - baselineUsage.stt).toBe(1)
    expect(f.count('/api/stt')).toBe(1)
    await expect.poll(async () => (await f.snapshot()).spoken.length).toBe(2)
  } finally {
    await f.cleanup()
  }
})

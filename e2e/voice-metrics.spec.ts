import { test, expect } from '@playwright/test'
import { openCompanion, openSpeaking, leaveViaSpa, usage } from './helpers/voiceLifecycle'
import {
  prepareMetricsVoice,
  installRetainedCapture,
  assertObservedWindow,
  assertMetricsOff,
  readMetrics,
  type MetricsFlow,
} from './helpers/voiceMetrics'

const flows: MetricsFlow[] = ['speaking-server-A', 'speaking-native-B', 'companion-server']
for (const flow of flows) {
  for (const enabled of [false, true]) {
    test(`voice metrics ${enabled ? 'on' : 'off'} ${flow} giữ reply/request/usage và chặn callback muộn`, async ({
      page,
    }) => {
      const f = await prepareMetricsVoice(page, { flow, enabled })
      const speaking = flow !== 'companion-server'
      const native = flow === 'speaking-native-B'
      try {
        // Install trước navigation: origin observer và mọi event cùng clock, không reset giữa phiên.
        await page.clock.install()
        if (speaking) await openSpeaking(page, f)
        else await openCompanion(page)
        if (!enabled) await assertMetricsOff(page)
        const beforeUsage = await usage(page)
        await installRetainedCapture(page, native)
        // Chỉ tiến timer confirm. Không xuất duration/quantile từ fake clock thành device evidence.
        await page
          .getByRole('button', {
            name: speaking ? (native ? 'Start recording' : 'Bắt đầu ghi âm') : 'Nhấn để nói',
            exact: true,
          })
          .click()
        if (!native) {
          await f.releasePermission()
          await expect.poll(async () => (await f.snapshot()).started).toBe(1)
        } else {
          await expect.poll(async () => (await f.snapshot()).started).toBe(1)
          await page.evaluate(() =>
            window.__voiceLifecycle.nativeResult('synthetic interim', false),
          )
        }
        expect(await page.evaluate(() => window.__voiceMetricsCaptureBoundary.retain())).toBe(
          native ? 3 : 2,
        )
        await page
          .getByRole('button', {
            name: native ? 'Stop recording' : 'Dừng ghi âm',
            exact: true,
          })
          .click()
        if (native) {
          await page.evaluate(() => {
            window.__voiceLifecycle.nativeResult('synthetic final transcript', true)
            window.__voiceLifecycle.nativeEnd()
          })
          await expect(
            page.getByText('synthetic final transcript', { exact: false }).first(),
          ).toBeVisible()
        } else await f.readStt()
        if (speaking) await page.clock.runFor(2500)
        await expect
          .poll(() => f.count(speaking ? '/api/agent' : '/api/companion'))
          .toBe(speaking ? 2 : 1)
        await expect.poll(async () => (await f.snapshot()).spoken.length).toBe(speaking ? 2 : 1)
        await expect(
          page
            .getByText(speaking ? 'synthetic tutor greeting' : 'synthetic companion reply', {
              exact: false,
            })
            .first(),
        ).toBeVisible()
        const device = await f.snapshot()
        expect(device.spoken).toEqual(
          Array.from({ length: speaking ? 2 : 1 }, () => ({
            text: speaking ? 'synthetic tutor greeting' : 'synthetic companion reply',
            lang: flow === 'speaking-server-A' ? 'en-US' : 'vi-VN',
          })),
        )
        expect(device.tracksStopped).toBe(native ? 0 : 1)
        expect(device.nativeStops).toBe(native ? 1 : 0)
        expect(await usage(page)).toEqual({
          stt: beforeUsage.stt + (flow === 'speaking-server-A' ? 1 : 0),
          speaking: beforeUsage.speaking + (speaking ? 1 : 0),
        })
        await f.assertFingerprints()
        const observed = enabled ? await assertObservedWindow(page, f) : null
        if (!enabled) await assertMetricsOff(page)
        const beforeLate = {
          device: await f.snapshot(),
          usage: await usage(page),
          calls: f.voiceCalls(),
        }
        // App đã detach handlers; gọi lại chính closure đã retain, không chỉ gọi property null.
        expect(await page.evaluate(() => window.__voiceMetricsCaptureBoundary.emitRetained())).toBe(
          native ? 3 : 2,
        )
        await page.clock.runFor(32)
        expect(await f.snapshot()).toEqual(beforeLate.device)
        expect(await usage(page)).toEqual(beforeLate.usage)
        expect(f.voiceCalls()).toEqual(beforeLate.calls)
        await expect(
          page.getByText('PRIVATE_LATE_TRANSCRIPT_CANARY', { exact: false }),
        ).toHaveCount(0)
        if (enabled) expect(await readMetrics(page)).toEqual(observed)
        else await assertMetricsOff(page)
        await f.assertFingerprints()
      } finally {
        await f.cleanup()
      }
    })
  }
}

test('voice metrics on Speaking pending permission rồi Phòng mới giữ terminal user và không mở capture muộn', async ({
  page,
}) => {
  const f = await prepareMetricsVoice(page, {
    flow: 'speaking-server-A',
    enabled: true,
    pending: true,
  })
  try {
    await openSpeaking(page, f)
    const beforeUsage = await usage(page)
    await page.getByRole('button', { name: 'Bắt đầu ghi âm', exact: true }).click()
    await expect.poll(async () => (await f.snapshot()).permission).toBe(1)
    await page.getByRole('button', { name: 'Phòng mới', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Bắt đầu luyện nói', exact: true })).toBeVisible()
    const observed = await assertObservedWindow(page, f, 'user')
    const beforeCalls = f.voiceCalls()
    await f.releasePermission()
    await expect.poll(async () => (await f.snapshot()).tracksStopped).toBe(1)
    const device = await f.snapshot()
    expect([device.constructed, device.started, device.stopped]).toEqual([0, 0, 0])
    expect(device.spoken).toEqual([{ text: 'synthetic tutor greeting', lang: 'en-US' }])
    expect(f.voiceCalls()).toEqual(beforeCalls)
    expect(await usage(page)).toEqual(beforeUsage)
    expect(await readMetrics(page)).toEqual(observed)
    await f.assertFingerprints()
  } finally {
    await f.cleanup()
  }
})

test('voice metrics on Companion pending permission rồi SPA cleanup giữ terminal unknown và cùng cửa sổ', async ({
  page,
}) => {
  const f = await prepareMetricsVoice(page, {
    flow: 'companion-server',
    enabled: true,
    pending: true,
  })
  try {
    await openCompanion(page)
    const beforeUsage = await usage(page)
    await page.getByRole('button', { name: 'Nhấn để nói', exact: true }).click()
    await expect.poll(async () => (await f.snapshot()).permission).toBe(1)
    await expect
      .poll(async () => (await readMetrics(page)).events.map((event) => event.event))
      .toEqual(['turn_started'])
    const pending = await readMetrics(page)
    expect(pending.events.map((event) => event.event)).toEqual(['turn_started'])
    await leaveViaSpa(page)
    const observed = await assertObservedWindow(page, f, 'unknown')
    expect(observed.events[0]).toEqual(pending.events[0])
    await f.releasePermission()
    await expect.poll(async () => (await f.snapshot()).tracksStopped).toBe(1)
    const device = await f.snapshot()
    expect([device.constructed, device.started, device.stopped]).toEqual([0, 0, 0])
    expect(device.spoken).toEqual([])
    expect(await usage(page)).toEqual(beforeUsage)
    expect(await readMetrics(page)).toEqual(observed)
    await f.assertFingerprints()
  } finally {
    await f.cleanup()
  }
})

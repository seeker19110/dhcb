import { describe, expect, it, vi } from 'vitest'
import { createLocalVoiceMetrics, type VoiceWindowReader } from './voiceMetricsLocal'
import { localVoiceWindowSchema } from '@dhcb/core-contracts/voiceMetrics'
import { aggregateVoiceWindow } from './voiceMetricsReport'
const options = { mode: 'companion', direction: 'vi_only', input: 'microphone' } as const
async function settle() {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}
function environment(flag: string | null) {
  let reader: Readonly<VoiceWindowReader> | undefined
  const now = vi.fn(() => 100)
  const randomId = vi.fn(() => crypto.randomUUID())
  const publish = vi.fn((value: Readonly<VoiceWindowReader>) => {
    reader = value
  })
  const readFlag = vi.fn(() => flag)
  return {
    env: { readFlag, publish, now, randomId },
    reader: () => {
      if (!reader) throw new Error('reader absent')
      return reader
    },
  }
}
describe('local opt-in exact value và read-only readback', () => {
  it.each([null, '', 'ON', 'true', 'on ', '1'])(
    'off %s không clock/IDs/ring/global publication',
    async (flag) => {
      const f = environment(flag)
      const observer = createLocalVoiceMetrics(f.env)
      observer.startTurn(options).request('stt').end('ok')
      await settle()
      expect(f.env.readFlag).toHaveBeenCalledTimes(1)
      expect(f.env.now).not.toHaveBeenCalled()
      expect(f.env.randomId).not.toHaveBeenCalled()
      expect(f.env.publish).not.toHaveBeenCalled()
      expect(observer.diagnostics().emitted).toBe(0)
      expect(observer.diagnostics()).toBe(observer.diagnostics()) // off calls reuse frozen diagnostics
    },
  )
  it('storage throw fail-closed và không đọc lại khi caller sửa flag', () => {
    const f = environment('on')
    f.env.readFlag.mockImplementation(() => {
      throw new Error('PRIVATE_STORAGE')
    })
    const observer = createLocalVoiceMetrics(f.env)
    f.env.readFlag.mockReturnValue('on')
    observer.startTurn(options)
    expect(f.env.readFlag).toHaveBeenCalledTimes(1)
    expect(f.env.publish).not.toHaveBeenCalled()
    expect(f.env.now).not.toHaveBeenCalled()
  })
  it('on read strict DTO copy, giữ pending diagnostics và không auto performance report', async () => {
    const f = environment('on')
    const observer = createLocalVoiceMetrics(f.env)
    const turn = observer.startTurn(options)
    turn.request('stt')
    turn.end('cancelled', 'route_leave')
    const pending = f.reader().read()
    expect(pending.diagnostics.queued).toBeGreaterThan(0)
    expect(aggregateVoiceWindow(pending.events, pending.diagnostics, 'synthetic').status).toBe(
      'INVALID',
    )
    await settle()
    const first = f.reader().read()
    expect(localVoiceWindowSchema.safeParse(first).success).toBe(true)
    expect(Object.keys(f.reader())).toEqual(['read'])
    expect(Object.isFrozen(f.reader())).toBe(true)
    first.events.splice(0)
    first.diagnostics.emitted = 0
    const next = f.reader().read()
    expect(next.events).toHaveLength(3)
    expect(next.diagnostics.emitted).toBe(3)
    expect(next.evidence).toBe('local_observation_only')
    const report = aggregateVoiceWindow(next.events, next.diagnostics, 'synthetic')
    expect(report.cohorts[0]).toMatchObject({ cancelled: 1, requestIncomplete: 1 })
    expect(report.status).toBe('NOT_MEASURED')
    expect(JSON.stringify(next)).not.toMatch(/p50|p95|device_run|PRIVATE_STORAGE/)
  })
  it('publication throw không thoát, observer off và không giữ queue hoạt động', async () => {
    const f = environment('on')
    f.env.publish.mockImplementation(() => {
      throw new Error('PRIVATE_PUBLISH')
    })
    const observer = createLocalVoiceMetrics(f.env)
    observer.startTurn(options).end('ok')
    await settle()
    expect(observer.diagnostics().emitted).toBe(0)
  })
  it('cap turn latches loss; readback không tự reset hoặc đổi thành đủ mẫu', async () => {
    const f = environment('on')
    const observer = createLocalVoiceMetrics(f.env)
    for (let i = 0; i < 65; i++) {
      observer.startTurn(options).end('ok')
      await settle()
    }
    const a = f.reader().read()
    expect(a.events.length).toBeLessThanOrEqual(2048)
    expect(a.diagnostics.overflow).toBe(true)
    expect(aggregateVoiceWindow(a.events, a.diagnostics, 'synthetic').status).toBe('INVALID')
    expect(f.reader().read()).toEqual(a)
  })
  it.each(['transcript', 'audio', 'url', 'cacheHash', 'userId', 'deviceId', 'error', 'language'])(
    'snapshot strict từ chối canary extra %s',
    async (key) => {
      const f = environment('on')
      createLocalVoiceMetrics(f.env).startTurn(options)
      await settle()
      const snapshot = f.reader().read()
      expect(
        localVoiceWindowSchema.safeParse({ ...snapshot, [key]: 'PRIVATE_CANARY' }).success,
      ).toBe(false)
    },
  )
  it('diagnostics không boolean/counter finite đều INVALID', () => {
    const f = environment('on')
    createLocalVoiceMetrics(f.env)
    const snapshot = f.reader().read()
    for (const poisoned of [
      { ...snapshot.diagnostics, overflow: 'false' },
      { ...snapshot.diagnostics, emitted: NaN },
      { ...snapshot.diagnostics, queued: -1 },
    ]) {
      expect(localVoiceWindowSchema.safeParse({ ...snapshot, diagnostics: poisoned }).success).toBe(
        false,
      )
      // Runtime input audit deliberately bypasses the TS DTO with Zod's unknown boundary.
      if (localVoiceWindowSchema.safeParse({ ...snapshot, diagnostics: poisoned }).success)
        throw new Error('invalid metadata accepted')
    }
  })
})

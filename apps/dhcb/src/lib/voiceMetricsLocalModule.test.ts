import { afterEach, describe, expect, it, vi } from 'vitest'
import { localVoiceWindowSchema } from '@dhcb/core-contracts/voiceMetrics'
const options = { mode: 'speaking', direction: 'en_to_vi', input: 'microphone' } as const
async function settle() {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})
describe('module production đọc exact flag một lần mỗi reload', () => {
  it.each([null, 'ON', 'on '])('flag %s không publication và không clock/IDs', async (flag) => {
    const getItem = vi.fn(() => flag)
    const candidate = { sessionStorage: { getItem } }
    const now = vi.fn(() => 100)
    const randomUUID = vi.fn(() => crypto.randomUUID())
    vi.stubGlobal('window', candidate)
    vi.stubGlobal('performance', { now })
    vi.stubGlobal('crypto', { randomUUID })
    vi.resetModules()
    const { voiceMetrics } = await import('./voiceMetricsLocal')
    const loaderClockCalls = now.mock.calls.length
    voiceMetrics.startTurn(options).request('stt').end('ok')
    expect(getItem).toHaveBeenCalledExactlyOnceWith('dhcb.voiceMetrics.v1')
    expect(now).toHaveBeenCalledTimes(loaderClockCalls)
    expect(randomUUID).not.toHaveBeenCalled()
    expect(Object.getOwnPropertyNames(candidate)).toEqual(['sessionStorage'])
  })
  it('on xuất đúng reader readonly và route imports dùng cùng window, không auto reset', async () => {
    const getItem = vi.fn(() => 'on')
    const candidate = { sessionStorage: { getItem } }
    vi.stubGlobal('window', candidate)
    vi.resetModules()
    const { voiceMetrics } = await import('./voiceMetricsLocal')
    const turn = voiceMetrics.startTurn(options)
    turn.end('cancelled', 'route_leave')
    await settle()
    const descriptor = Object.getOwnPropertyDescriptor(candidate, '__DHCB_VOICE_METRICS_V1__')
    expect(descriptor).toMatchObject({ configurable: false, writable: false, enumerable: false })
    const reader: unknown = descriptor?.value
    if (
      !reader ||
      typeof reader !== 'object' ||
      !('read' in reader) ||
      typeof reader.read !== 'function'
    )
      throw Error('READER_ABSENT')
    const first: unknown = reader.read()
    expect(localVoiceWindowSchema.parse(first)).toMatchObject({
      evidence: 'local_observation_only',
      events: [{ event: 'turn_started' }, { event: 'turn_ended' }],
    })
    getItem.mockReturnValue('off')
    const again = await import('./voiceMetricsLocal')
    expect(again.voiceMetrics).toBe(voiceMetrics)
    expect(getItem).toHaveBeenCalledTimes(1)
    expect(Object.isFrozen(reader)).toBe(true)
    expect(Reflect.set(candidate, '__DHCB_VOICE_METRICS_V1__', {})).toBe(false)
    expect(reader.read()).toEqual(first)
  })
  it('getter sessionStorage bị chặn tắt hoàn toàn', async () => {
    const now = vi.fn(() => 100),
      randomUUID = vi.fn(() => 'ignored')
    const candidate = {
      get sessionStorage() {
        throw Error('PRIVATE_STORAGE_CANARY')
      },
    }
    vi.stubGlobal('window', candidate)
    vi.stubGlobal('performance', { now })
    vi.stubGlobal('crypto', { randomUUID })
    vi.resetModules()
    const { voiceMetrics } = await import('./voiceMetricsLocal')
    voiceMetrics.startTurn(options).end('ok')
    await settle()
    expect(now).not.toHaveBeenCalled()
    expect(randomUUID).not.toHaveBeenCalled()
    expect(Object.hasOwn(candidate, '__DHCB_VOICE_METRICS_V1__')).toBe(false)
  })
})

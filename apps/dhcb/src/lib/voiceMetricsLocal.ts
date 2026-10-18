import {
  localVoiceWindowSchema,
  type LocalVoiceWindowSnapshot,
  type VoiceEvent,
} from '@dhcb/core-contracts/voiceMetrics'
import { createVoiceObserver, type Observer } from './voiceMetrics'

export const LOCAL_VOICE_FLAG = 'dhcb.voiceMetrics.v1'
export interface VoiceWindowReader {
  read(): LocalVoiceWindowSnapshot
}
declare global {
  interface Window {
    readonly __DHCB_VOICE_METRICS_V1__?: Readonly<VoiceWindowReader>
  }
}
// DI chỉ cho unit boundary; global readback không expose môi trường hoặc observer này.
export interface LocalVoiceEnvironment {
  readFlag(): string | null
  publish(reader: Readonly<VoiceWindowReader>): void
  now(): number
  randomId(): string
}

export function createLocalVoiceMetrics(environment: LocalVoiceEnvironment): Observer {
  let enabled = false
  try {
    enabled = environment.readFlag() === 'on'
  } catch {
    /* storage bị chặn => off */
  }
  if (!enabled) return createVoiceObserver()
  const events: VoiceEvent[] = []
  let ringDropped = 0
  const observer = createVoiceObserver({
    enabled: true,
    now: () => environment.now(),
    randomId: () => environment.randomId(),
    sink: (event) => {
      if (events.length >= 2048) {
        ringDropped++
        return
      }
      events.push(event)
    },
  })
  const reader: Readonly<VoiceWindowReader> = Object.freeze({
    read() {
      const diagnostics = observer.diagnostics()
      // Zod tạo bản sao; caller không sửa được cửa sổ bằng cách sửa readback trước.
      return localVoiceWindowSchema.parse({
        version: 1,
        evidence: 'local_observation_only',
        events,
        diagnostics: {
          ...diagnostics,
          dropped: diagnostics.dropped + ringDropped,
          overflow: diagnostics.overflow || ringDropped > 0,
        },
        physical: {
          audibleFirstSound: 'NOT_MEASURED',
          speechOnsetToPlaybackStop: 'NOT_MEASURED',
          clientReconnect: 'NOT_MEASURED',
          deviceNetworkPerformance: 'WAITING',
        },
      })
    },
  })
  try {
    environment.publish(reader)
  } catch {
    observer.dispose()
    return createVoiceObserver()
  }
  return observer
}

// Không URL/env/query flags; chỉ import ở hai luồng đã duyệt. Reload tạo cửa sổ mới.
export const voiceMetrics =
  typeof window === 'undefined'
    ? createVoiceObserver()
    : createLocalVoiceMetrics({
        readFlag: () => window.sessionStorage.getItem(LOCAL_VOICE_FLAG),
        publish: (reader) => {
          Object.defineProperty(window, '__DHCB_VOICE_METRICS_V1__', {
            value: reader,
            configurable: false,
            enumerable: false,
            writable: false,
          })
        },
        now: () => performance.now(),
        randomId: () => crypto.randomUUID(),
      })

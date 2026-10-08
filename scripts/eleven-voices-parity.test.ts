// Server (packages/core-ai/elevenLabsTts.ts) và client (apps/dhcb/src/lib/voiceTiers.ts) giữ HAI
// bản danh sách giọng ElevenLabs riêng (dự án không share code giữa hai phía) — lệch nhau thì UI
// cho chọn giọng mà server không biết (400) hoặc ngược lại. Test này chặn lệch đó.
import { describe, it, expect } from 'vitest'
import { ELEVEN_VOICE_IDS as SERVER_IDS, elevenVoiceGender } from '@dhcb/core-ai/elevenLabsTts'
import { VOICE_TIERS as SERVER_TIERS } from '@dhcb/core-ai/voiceAccess'
import {
  ELEVEN_VOICE_IDS as CLIENT_IDS,
  VOICE_OPTIONS,
  VOICE_TIERS as CLIENT_TIERS,
} from '../apps/dhcb/src/lib/voiceTiers.ts'

describe('giọng ElevenLabs: client ↔ server', () => {
  it('cùng danh sách, cùng thứ tự', () => {
    expect(CLIENT_IDS).toEqual(SERVER_IDS)
  })

  it('giới tính trong VOICE_OPTIONS khớp bảng server', () => {
    for (const id of SERVER_IDS) {
      expect(VOICE_OPTIONS.find((v) => v.id === id)?.gender).toBe(elevenVoiceGender(id))
    }
  })

  it('chỉ VIP có giọng ElevenLabs, cả hai phía', () => {
    for (const id of SERVER_IDS) {
      expect(SERVER_TIERS.vip).toContain(id)
      expect(CLIENT_TIERS.vip).toContain(id)
      expect(SERVER_TIERS.free as string[]).not.toContain(id)
      expect(CLIENT_TIERS.free).not.toContain(id)
    }
  })
})

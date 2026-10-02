// packages/core-ai/echoShadowingService.ts — Danh mục bài mẫu cho bài luyện nói đuổi (Echo Shadowing).
//
// Changelog 0484: đã BỎ `evaluateShadowingSession`. Hàm đó tính "Band", độ trễ, độ đồng bộ nhịp từ
// hai con số client gửi lên — mà client sinh bằng `Math.random()`, không ghi âm gì cả. Chỉ thêm
// lại điểm khi đo được độ trễ + độ khớp âm vị từ bản ghi âm thật (skill
// `multimodal-realtime-voice-master` mục 5).
import { type ShadowingPassage, SHADOWING_SCHEMA_VERSION } from '@dhcb/core-contracts/echoShadowing'

export const PREDEFINED_PASSAGES: ShadowingPassage[] = [
  {
    id: 'jobs_stanford_commencement',
    title: 'Steve Jobs — Diễn văn Khai giảng Đại học Stanford (2005)',
    targetText:
      "Your time is limited, so do not waste it living someone else's life. Do not be trapped by dogma, which is living with the results of other people's thinking.",
    speakerAccent: 'us_standard',
    audioUrl: 'https://cdn.donghanh.org/audio/shadowing/jobs_stanford.mp3',
    bpmPacing: 120,
    syllableCount: 38,
    difficulty: 'intermediate',
    schemaVersion: SHADOWING_SCHEMA_VERSION,
  },
  {
    id: 'churchill_we_shall_fight',
    title: 'Winston Churchill — We Shall Fight on the Beaches (1940)',
    targetText:
      'We shall fight on the seas and oceans, we shall fight with growing confidence and growing strength in the air, we shall defend our island, whatever the cost may be.',
    speakerAccent: 'uk_rp',
    audioUrl: 'https://cdn.donghanh.org/audio/shadowing/churchill_fight.mp3',
    bpmPacing: 105,
    syllableCount: 42,
    difficulty: 'advanced',
    schemaVersion: SHADOWING_SCHEMA_VERSION,
  },
  {
    id: 'tech_startup_pitch_fast',
    title: 'Silicon Valley Pitch — Realtime AI Architecture (Tốc độ Cao)',
    targetText:
      'Our distributed real-time AI companion dynamically synchronizes context packages across every subject you study with sub-second latency and zero-knowledge privacy.',
    speakerAccent: 'us_standard',
    audioUrl: 'https://cdn.donghanh.org/audio/shadowing/startup_pitch.mp3',
    bpmPacing: 150,
    syllableCount: 46,
    difficulty: 'native_fast',
    schemaVersion: SHADOWING_SCHEMA_VERSION,
  },
]

export function listShadowingPassages(): ShadowingPassage[] {
  return [...PREDEFINED_PASSAGES]
}

export function getShadowingPassage(id: string): ShadowingPassage | undefined {
  return PREDEFINED_PASSAGES.find((p) => p.id === id)
}

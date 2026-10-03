import { describe, it, expect } from 'vitest'
import { ShadowingPassageSchema, SHADOWING_SCHEMA_VERSION } from './echoShadowing.js'

describe('echoShadowing contracts', () => {
  it('validates a shadowing passage', () => {
    const passage = {
      id: 'steve_jobs_stanford',
      title: 'Trích đoạn Diễn văn Stanford — Steve Jobs',
      targetText: 'Your time is limited, so do not waste it living someone else life.',
      speakerAccent: 'us_standard',
      audioUrl: 'https://cdn.donghanh.org/audio/shadowing/jobs_stanford.mp3',
      bpmPacing: 120,
      syllableCount: 19,
      difficulty: 'intermediate',
      schemaVersion: SHADOWING_SCHEMA_VERSION,
    }

    const parsed = ShadowingPassageSchema.parse(passage)
    expect(parsed.id).toBe('steve_jobs_stanford')
    expect(parsed.bpmPacing).toBe(120)
  })
})

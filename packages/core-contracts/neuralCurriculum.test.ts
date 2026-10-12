// packages/core-contracts/neuralCurriculum.test.ts
import { describe, it, expect } from 'vitest'
import {
  NEURAL_CURRICULUM_VERSION,
  CollocationTypeSchema,
  CollocationNodeSchema,
  MicroCurriculumModuleSchema,
  NeuralCurriculumStateSchema,
} from './neuralCurriculum.js'

describe('Neural Curriculum Contracts (V4.3)', () => {
  it('validates collocation types', () => {
    expect(CollocationTypeSchema.parse('verb_noun')).toBe('verb_noun')
    expect(CollocationTypeSchema.parse('phrasal_verb')).toBe('phrasal_verb')
    expect(() => CollocationTypeSchema.parse('invalid')).toThrow()
  })

  it('validates a CollocationNode', () => {
    const validCollocation = {
      id: '11111111-1111-4111-8111-111111111111',
      phraseEn: 'conduct comprehensive research',
      meaningVi: 'tiến hành nghiên cứu toàn diện',
      ipa: '/kənˈdʌkt ˌkɑːmprɪˈhensɪv rɪˈsɜːrtʃ/',
      cefrLevel: 'C1',
      type: 'verb_noun',
      strength: 92,
      exampleSentenceEn: 'We must conduct comprehensive research before entering the market.',
      exampleSentenceVi:
        'Chúng ta phải tiến hành nghiên cứu toàn diện trước khi gia nhập thị trường.',
      domain: 'work',
      relatedWords: ['research', 'conduct', 'comprehensive'],
    }

    const parsed = CollocationNodeSchema.parse(validCollocation)
    expect(parsed.phraseEn).toBe('conduct comprehensive research')
    expect(parsed.cefrLevel).toBe('C1')
    expect(parsed.type).toBe('verb_noun')
  })

  it('validates a complete MicroCurriculumModule', () => {
    const validModule = {
      moduleId: '22222222-2222-4222-8222-222222222222',
      title: 'Cụm từ Chiến lược Thuyết trình Dự án',
      targetDomain: 'career',
      cefrLevel: 'B2',
      gapReason: 'Phát hiện ngập ngừng khi trình bày kế hoạch kinh doanh',
      collocations: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          phraseEn: 'deliver a compelling pitch',
          meaningVi: 'trình bày bài thuyết trình thuyết phục',
          ipa: '/dɪˈlɪvər ə kəmˈpelɪŋ pɪtʃ/',
          cefrLevel: 'B2',
          type: 'verb_noun',
          strength: 88,
          exampleSentenceEn: 'The startup team delivered a compelling pitch to the investors.',
          exampleSentenceVi:
            'Đội ngũ khởi nghiệp đã trình bày một bài thuyết trình đầy thuyết phục trước các nhà đầu tư.',
          domain: 'career',
          relatedWords: ['pitch', 'deliver', 'compelling'],
        },
      ],
      drills: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          targetCollocationId: '11111111-1111-4111-8111-111111111111',
          promptEn: 'The CEO _____ a compelling pitch during the keynote.',
          promptVi: 'CEO đã trình bày bài thuyết trình thuyết phục trong bài phát biểu chính.',
          options: ['delivered', 'took', 'made', 'spoke'],
          correctAnswer: 'delivered',
          explanationVi: "Đi với 'pitch' thường dùng động từ 'deliver a pitch'.",
        },
      ],
      estimatedMinutes: 2,
      status: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const parsed = MicroCurriculumModuleSchema.parse(validModule)
    expect(parsed.title).toContain('Thuyết trình Dự án')
    expect(parsed.estimatedMinutes).toBe(2)
    // Changelog 0628: module LƯU trước khi gỡ trụ Career vẫn đọc được — miền về `general`, không 500.
    expect(parsed.targetDomain).toBe('general')
    expect(parsed.collocations[0]?.domain).toBe('general')
  })

  it('validates NeuralCurriculumStateSchema', () => {
    const validState = {
      personId: '11111111-1111-4111-8111-111111111111',
      modules: [],
      masteryScore: 85,
      schemaVersion: NEURAL_CURRICULUM_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const parsed = NeuralCurriculumStateSchema.parse(validState)
    expect(parsed.schemaVersion).toBe('v4.3.0')
    expect(parsed.masteryScore).toBe(85)
  })
})

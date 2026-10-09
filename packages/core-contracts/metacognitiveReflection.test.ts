// packages/core-contracts/metacognitiveReflection.test.ts
import { describe, it, expect } from 'vitest'
import {
  MetacognitiveReflectionSchema,
  SocraticDailyPromptSchema,
  MetacognitiveSummarySchema,
  SubmitReflectionRequestSchema,
  toPublicReflection,
  type StoredMetacognitiveReflection,
} from './metacognitiveReflection.js'

describe('MetacognitiveReflectionSchema', () => {
  it('validates a valid metacognitive reflection payload', () => {
    const validData = {
      id: 'refl-123',
      personId: 'user-456',
      title: 'Nhận thức về thói quen trì hoãn khi gặp bài toán khó',
      domain: 'learning',
      reflectionPrompt: 'Điều gì đã ngăn cản bạn hành động dứt khoát hôm nay?',
      userReflection:
        'Tôi nhận thấy mình rơi vào bẫy phân tích quá đà và sợ sai lầm khi bắt đầu giải đề mới.',
      ahaMoments: ['Hành động nhỏ tạo đà tâm lý tốt hơn là chờ đợi sự hoàn hảo.'],
      identifiedBiases: [
        {
          biasType: 'analysis_paralysis',
          biasName: 'Tê liệt phân tích (Analysis Paralysis)',
          explanation: 'Dành quá nhiều thời gian cân nhắc mà không bắt tay vào thử nghiệm.',
          antidotePrompt: 'Quy tắc 5 phút: Làm thử ngay một phần nhỏ nhất.',
          severity: 'moderate',
        },
      ],
      socraticFollowUps: ['Bước nhỏ nhất bạn có thể làm trong 3 phút tới là gì?'],
      actionCommitment: 'Làm ngay 1 bài tập trắc nghiệm cơ bản trước khi nghỉ.',
      createdAt: '2026-08-20T06:00:00.000Z',
    }

    const parsed = MetacognitiveReflectionSchema.parse(validData)
    expect(parsed.id).toBe('refl-123')
    expect(parsed.identifiedBiases).toHaveLength(1)
    // Bẫy thiếu `triggerPhrases` (bản ghi cũ) → mặc định [].
    expect(parsed.identifiedBiases[0]?.triggerPhrases).toEqual([])
  })

  it('Luật số 1: hợp đồng strict TỪ CHỐI hai số giả cũ (MAI / Growth Mindset)', () => {
    const base = {
      id: 'r',
      personId: 'p',
      title: 't',
      domain: 'learning',
      reflectionPrompt: 'q',
      userReflection: 'a',
      createdAt: '2026-08-20T06:00:00.000Z',
    }
    expect(MetacognitiveReflectionSchema.strict().safeParse(base).success).toBe(true)
    expect(
      MetacognitiveReflectionSchema.strict().safeParse({ ...base, metacognitiveIndex: 82 }).success,
    ).toBe(false)
    expect(
      MetacognitiveReflectionSchema.strict().safeParse({ ...base, growthMindsetScore: 88 }).success,
    ).toBe(false)
  })

  it('validates socratic daily prompt', () => {
    const prompt = {
      id: 'prompt-1',
      domain: 'career',
      theme: 'Quyết định dưới áp lực',
      promptText: 'Khi đối mặt với sự bất định, niềm tin ngầm định nào đang chi phối bạn?',
      deepDivingQuestion: 'Liệu đây là sự thật khách quan hay giả định tự tạo?',
    }
    const parsed = SocraticDailyPromptSchema.parse(prompt)
    expect(parsed.theme).toBe('Quyết định dưới áp lực')
  })

  it('validates summary schema', () => {
    const summary = {
      totalReflectionsCount: 12,
      topDetectedBiases: ['confirmation_bias', 'dunning_kruger'],
      recentAhaMoments: ['Nhận ra giá trị của phản biện từ người khác.'],
    }
    const parsed = MetacognitiveSummarySchema.strict().parse(summary)
    expect(parsed.totalReflectionsCount).toBe(12)
    // Chỉ số trung bình + "xu hướng" suy từ số giả đã bỏ — strict từ chối nếu ai đó thêm lại.
    expect(
      MetacognitiveSummarySchema.strict().safeParse({ ...summary, overallAwarenessIndex: 85 })
        .success,
    ).toBe(false)
  })
})

describe('toPublicReflection — chiếu bản ghi CSDL sang client', () => {
  const legacy: StoredMetacognitiveReflection = {
    id: 'refl-old',
    personId: 'u1',
    title: 'Bản ghi trước changelog 0539',
    domain: 'learning',
    reflectionPrompt: 'Câu hỏi',
    userReflection: 'Bài viết',
    ahaMoments: [],
    identifiedBiases: [
      {
        biasType: 'none',
        biasName: 'Tư duy trung dung & Cởi mở',
        explanation: 'Không phát hiện thiên kiến nhận thức nổi cộm.',
        antidotePrompt: 'Tiếp tục duy trì trạng thái quan sát khách quan.',
        severity: 'low',
      },
      {
        biasType: 'sunk_cost',
        biasName: 'Bẫy chi phí chìm',
        explanation: 'x',
        antidotePrompt: 'y',
        severity: 'high',
      },
    ],
    metacognitiveIndex: 87,
    growthMindsetScore: 90,
    socraticFollowUps: ['Câu hỏi tiếp?'],
    actionCommitment: 'cam kết cũ',
    createdAt: '2026-10-01T00:00:00.000Z',
  }

  it('bỏ hai số giả, bỏ bẫy "none" giữ chỗ, bù triggerPhrases rỗng — và qua được schema strict', () => {
    const pub = toPublicReflection(legacy)
    expect(JSON.stringify(pub)).not.toMatch(/metacognitiveIndex|growthMindsetScore/)
    expect(pub.identifiedBiases.map((b) => b.biasType)).toEqual(['sunk_cost'])
    expect(pub.identifiedBiases[0]?.triggerPhrases).toEqual([])
    expect(pub.actionCommitment).toBe('cam kết cũ')
    expect(MetacognitiveReflectionSchema.strict().safeParse(pub).success).toBe(true)
  })

  it('danh sách trắng: trường lạ ghi thêm vào CSDL cũng không lọt ra', () => {
    const withExtra = { ...legacy, secretScore: 99 } as StoredMetacognitiveReflection
    expect(Object.keys(toPublicReflection(withExtra))).not.toContain('secretScore')
  })

  it('bản ghi thiếu mảng (dữ liệu cũ/hỏng) vẫn chiếu được, không ném lỗi', () => {
    const sparse = {
      ...legacy,
      identifiedBiases: undefined,
      ahaMoments: undefined,
      socraticFollowUps: undefined,
      actionCommitment: undefined,
    } as unknown as StoredMetacognitiveReflection
    const pub = toPublicReflection(sparse)
    expect(pub.identifiedBiases).toEqual([])
    expect(pub.ahaMoments).toEqual([])
    expect(pub.socraticFollowUps).toEqual([])
    expect('actionCommitment' in pub).toBe(false)
  })
})

describe('SubmitReflectionRequestSchema', () => {
  it('mặc định domain learning; từ chối bài rỗng/chỉ khoảng trắng và domain lạ', () => {
    const ok = SubmitReflectionRequestSchema.parse({ reflectionPrompt: 'q', userReflection: 'a' })
    expect(ok.domain).toBe('learning')
    expect(
      SubmitReflectionRequestSchema.safeParse({ reflectionPrompt: 'q', userReflection: '   ' })
        .success,
    ).toBe(false)
    expect(
      SubmitReflectionRequestSchema.safeParse({
        reflectionPrompt: 'q',
        userReflection: 'a',
        domain: 'hack',
      }).success,
    ).toBe(false)
  })
})

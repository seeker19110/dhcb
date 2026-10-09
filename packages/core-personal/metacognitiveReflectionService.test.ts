// packages/core-personal/metacognitiveReflectionService.test.ts
import { describe, it, expect } from 'vitest'
import { MetacognitiveReflectionService } from './metacognitiveReflectionService.js'
import { findForbiddenLanguage } from './intakeSuggestion.js'
import { MetacognitiveReflectionSchema } from '@dhcb/core-contracts/metacognitiveReflection'
import type { MetacognitiveReflection } from '@dhcb/core-contracts/metacognitiveReflection'

describe('MetacognitiveReflectionService', () => {
  it('generates a daily socratic prompt for learning domain', () => {
    const prompt = MetacognitiveReflectionService.generateDailySocraticPrompt('learning')
    expect(prompt.domain).toBe('learning')
    expect(prompt.promptText.length).toBeGreaterThan(10)
    expect(prompt.deepDivingQuestion.length).toBeGreaterThan(10)
  })

  it('analyzes user reflection and detects analysis paralysis bias', () => {
    const analysis = MetacognitiveReflectionService.analyzeReflection('user-1', {
      domain: 'learning',
      reflectionPrompt: 'Điều gì cản trở bạn hôm nay?',
      userReflection:
        'Tôi sợ sai và cứ nghĩ mãi về cấu trúc ngữ pháp này, cảm thấy chưa đủ hoàn hảo để nói ra.',
    })

    expect(analysis.personId).toBe('user-1')
    const paralysis = analysis.identifiedBiases.find((b) => b.biasType === 'analysis_paralysis')
    expect(paralysis).toBeDefined()
    // Nêu nguyên văn cụm từ đã khiến bộ dò nghĩ tới bẫy — người viết thấy được VÌ SAO.
    expect(paralysis?.triggerPhrases).toEqual(['sợ sai', 'nghĩ mãi', 'chưa đủ hoàn hảo'])
    // Câu hỏi tiếp theo đầu tiên là câu hỏi riêng của bẫy này, rồi mới tới câu chốt.
    expect(analysis.socraticFollowUps[0]).toBe(paralysis?.antidotePrompt)
    expect(analysis.socraticFollowUps).toHaveLength(2)
  })

  it('detects overconfidence bias', () => {
    const analysis = MetacognitiveReflectionService.analyzeReflection('user-1', {
      domain: 'work',
      reflectionPrompt: 'Đánh giá tiến độ',
      userReflection: 'Mọi thứ chắc chắn quá đơn giản, ai cũng biết làm cả.',
    })

    const hasOverconfidence = analysis.identifiedBiases.some((b) => b.biasType === 'overconfidence')
    expect(hasOverconfidence).toBe(true)
  })

  it('summarizes multiple reflections', () => {
    const r1 = MetacognitiveReflectionService.analyzeReflection('user-1', {
      domain: 'learning',
      reflectionPrompt: 'P1',
      userReflection: 'Tôi nhận ra rằng sự kiên trì quan trọng hơn tốc độ.',
    })
    const summary = MetacognitiveReflectionService.summarizeReflections([r1])
    expect(summary.totalReflectionsCount).toBe(1)
    expect(summary.recentAhaMoments.length).toBeGreaterThan(0)
  })

  it('generates prompts across all 5 domains with contextAnchor', () => {
    const domains = ['career', 'work', 'startup', 'life'] as const
    for (const d of domains) {
      const p = MetacognitiveReflectionService.generateDailySocraticPrompt(d, 'anchor-1')
      expect(p.domain).toBe(d)
      expect(p.contextAnchor).toBe('anchor-1')
    }
  })

  it('detects imposter syndrome and sunk cost biases', () => {
    const imposter = MetacognitiveReflectionService.analyzeReflection('u1', {
      domain: 'career',
      reflectionPrompt: 'Prompt',
      userReflection: 'Tôi chỉ may mắn thôi và cảm thấy không xứng đáng với vị trí này.',
    })
    expect(imposter.identifiedBiases.some((b) => b.biasType === 'imposter_syndrome')).toBe(true)

    const sunk = MetacognitiveReflectionService.analyzeReflection('u1', {
      domain: 'startup',
      reflectionPrompt: 'Prompt',
      userReflection: 'Rất tiếc công vì đã bỏ ra nhiều tháng phát triển, không thể bỏ được.',
    })
    expect(sunk.identifiedBiases.some((b) => b.biasType === 'sunk_cost')).toBe(true)
  })

  it('bài không có dấu hiệu bẫy nào → danh sách bẫy RỖNG (không có bẫy "none" giữ chỗ), câu hỏi mở chung', () => {
    const neutral = MetacognitiveReflectionService.analyzeReflection('u1', {
      title: 'Custom Title',
      domain: 'life',
      reflectionPrompt: 'Prompt',
      userReflection: 'Hôm nay tôi muốn cải thiện và học hỏi cách quản lý cảm xúc tốt hơn.',
    })
    expect(neutral.title).toBe('Custom Title')
    expect(neutral.identifiedBiases).toEqual([])
    expect(neutral.socraticFollowUps).toHaveLength(2)
    // Không bịa câu "Aha" thay lời người viết khi họ không kể điều gì vừa vỡ lẽ.
    expect(neutral.ahaMoments).toEqual([])
  })

  it('tóm tắt rỗng; bẫy hay gặp xếp theo số lần, bỏ "none" của bản ghi cũ', () => {
    const empty = MetacognitiveReflectionService.summarizeReflections([])
    expect(empty).toEqual({ totalReflectionsCount: 0, topDetectedBiases: [], recentAhaMoments: [] })

    const viet = (userReflection: string) =>
      MetacognitiveReflectionService.analyzeReflection('u1', {
        domain: 'learning',
        reflectionPrompt: 'P',
        userReflection,
      })
    const legacyNone: MetacognitiveReflection = {
      ...viet('Một ngày bình thường.'),
      identifiedBiases: [
        {
          biasType: 'none',
          biasName: 'Tư duy trung dung',
          explanation: 'x',
          antidotePrompt: 'y',
          severity: 'low',
          triggerPhrases: [],
        },
      ],
    }
    const summary = MetacognitiveReflectionService.summarizeReflections([
      viet('Tôi sợ sai.'),
      viet('Tôi vẫn sợ sai và tiếc công.'),
      legacyNone,
    ])
    expect(summary.totalReflectionsCount).toBe(3)
    expect(summary.topDetectedBiases).toEqual(['analysis_paralysis', 'sunk_cost'])
  })
})

// ── Luật số 1: không con số năng lực nào rò ra ngoài ─────────────────────────
// Mở rộng nhóm test bất biến của luồng người mới (docs/research/luong-nguoi-moi-ho-so-nang-luc-an-
// 2026-08-23.md mục 7) sang nhật ký phản tỉnh (changelog 0539): quét mọi tổ hợp từ khoá bẫy tư duy
// + câu "Aha" qua `analyzeReflection`, rồi kiểm (1) hợp đồng strict — không trường điểm lạ,
// (2) không khoá nào mang tên điểm/chỉ số, (3) không chuỗi hiển thị nào chứa ngôn ngữ chấm điểm.
describe('Luật số 1 — nhật ký phản tỉnh không chấm điểm người viết', () => {
  const FRAGMENTS = [
    'chắc chắn quá đơn giản',
    'sợ sai nên nghĩ mãi',
    'chỉ là may mắn',
    'tiếc công đã bỏ ra nhiều',
    'hôm nay tôi nhận ra là cần nghỉ sớm hơn',
  ]
  // Mọi tập con của 5 mảnh (32 tổ hợp, kể cả rỗng → bài trung tính).
  const COMBOS = Array.from({ length: 1 << FRAGMENTS.length }, (_, mask) => {
    const parts = FRAGMENTS.filter((_, i) => mask & (1 << i))
    return parts.length > 0 ? parts.join('. ') + '.' : 'Một ngày bình thường, không có gì đặc biệt.'
  })
  const results = COMBOS.map((userReflection) =>
    MetacognitiveReflectionService.analyzeReflection('u1', {
      domain: 'learning',
      reflectionPrompt: 'Hôm nay thế nào?',
      userReflection,
    }),
  )

  const allKeys = (v: unknown): string[] =>
    v && typeof v === 'object'
      ? Object.entries(v).flatMap(([k, child]) => [k, ...allKeys(child)])
      : []

  it(`quét ${COMBOS.length} tổ hợp: kết quả hợp lệ theo hợp đồng strict (không trường điểm lạ)`, () => {
    for (const r of results) {
      expect(MetacognitiveReflectionSchema.strict().safeParse(r).success).toBe(true)
      for (const b of r.identifiedBiases) expect(Object.keys(b)).toHaveLength(6)
    }
  })

  it('không khoá nào mang tên điểm/chỉ số, không giá trị số nào trong kết quả', () => {
    for (const r of results) {
      expect(allKeys(r).filter((k) => /score|index|awareness|trend/i.test(k))).toEqual([])
      expect(Object.values(r).some((v) => typeof v === 'number')).toBe(false)
    }
  })

  it('mọi câu chữ hiển thị (trừ lời chính người viết) không chứa ngôn ngữ chấm điểm/xếp loại', () => {
    for (const r of results) {
      const shown = [
        ...r.identifiedBiases.flatMap((b) => [b.biasName, b.explanation, b.antidotePrompt]),
        ...r.socraticFollowUps,
      ]
      expect(findForbiddenLanguage(shown)).toEqual([])
    }
    const summary = MetacognitiveReflectionService.summarizeReflections(results)
    expect(allKeys(summary).filter((k) => /score|index|trend/i.test(k))).toEqual([])
  })
})

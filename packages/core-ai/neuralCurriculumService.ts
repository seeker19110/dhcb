// packages/core-ai/neuralCurriculumService.ts — Động cơ Sinh Lộ trình Vi mô & Đồ thị Collocations V4.3.
import {
  MicroCurriculumModule,
  CollocationNode,
  MicroDrillQuestion,
  NeuralCurriculumState,
  NEURAL_CURRICULUM_VERSION,
  type NeuralDrillSubmission,
} from '@dhcb/core-contracts/neuralCurriculum'
import { shuffle } from '@dhcb/core-contracts/shuffle'

export class NeuralCurriculumService {
  /**
   * Sinh tự động 1 mô-đun bài học vi mô 2 phút từ chủ đề hoặc lỗ hổng phát hiện được
   */
  static generateMicroCurriculumModule(params: {
    moduleId: string
    targetDomain: 'learning' | 'career' | 'work' | 'startup' | 'life'
    topicOrKeyword: string
    cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  }): MicroCurriculumModule {
    const now = new Date().toISOString()
    const { moduleId, targetDomain, topicOrKeyword, cefrLevel = 'B2' } = params

    const sampleCollocations = this.getCuratedCollocations(targetDomain, topicOrKeyword, cefrLevel)

    const drills: MicroDrillQuestion[] = sampleCollocations.map((col, idx) => ({
      id: `30000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`,
      targetCollocationId: col.id,
      promptEn: col.exampleSentenceEn.replace(col.phraseEn.split(' ')[0] || '', '_____'),
      promptVi: col.exampleSentenceVi,
      options: shuffle([col.phraseEn.split(' ')[0] || 'make', 'give', 'take', 'put']),
      correctAnswer: col.phraseEn.split(' ')[0] || 'make',
      explanationVi: `Cụm tự nhiên chuẩn bản xứ là '${col.phraseEn}' (nghĩa: ${col.meaningVi}).`,
    }))

    return {
      moduleId,
      title: `Micro-Drill: Cụm từ ${topicOrKeyword}`,
      targetDomain,
      cefrLevel,
      gapReason: `Tự động tối ưu phản xạ cho chủ đề '${topicOrKeyword}' trong lĩnh vực ${targetDomain}.`,
      collocations: sampleCollocations,
      drills,
      estimatedMinutes: 2,
      status: 'ready',
      createdAt: now,
      updatedAt: now,
    }
  }

  /**
   * Lấy danh sách collocations đắt giá mẫu theo miền và từ khóa
   */
  static getCuratedCollocations(
    domain: 'learning' | 'career' | 'work' | 'startup' | 'life',
    _keyword: string,
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
  ): CollocationNode[] {
    return [
      {
        id: '10000000-0000-4000-8000-000000000001',
        phraseEn: 'bridge the gap',
        meaningVi: 'thu hẹp khoảng cách',
        ipa: '/brɪdʒ ðə ɡæp/',
        cefrLevel: level,
        type: 'verb_noun',
        strength: 95,
        exampleSentenceEn:
          'Continuous learning helps bridge the gap between theory and real-world practice.',
        exampleSentenceVi:
          'Học tập liên tục giúp thu hẹp khoảng cách giữa lý thuyết và thực tiễn công việc.',
        domain,
        relatedWords: ['gap', 'bridge', 'learning'],
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        phraseEn: 'gain a competitive edge',
        meaningVi: 'đạt được lợi thế cạnh tranh',
        ipa: '/ɡeɪn ə kəmˈpetətɪv edʒ/',
        cefrLevel: level,
        type: 'verb_noun',
        strength: 90,
        exampleSentenceEn:
          'Professionals gain a competitive edge by mastering English for global recruitment.',
        exampleSentenceVi:
          'Làm chủ tiếng Anh mang lại cho người đi làm lợi thế cạnh tranh khi tuyển dụng quốc tế.',
        domain,
        relatedWords: ['edge', 'competitive', 'gain'],
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        phraseEn: 'drive innovation',
        meaningVi: 'thúc đẩy đổi mới sáng tạo',
        ipa: '/draɪv ˌɪnəˈveɪʃn/',
        cefrLevel: level,
        type: 'verb_noun',
        strength: 88,
        exampleSentenceEn:
          'Diverse perspectives drive innovation across cross-functional tech teams.',
        exampleSentenceVi:
          'Những góc nhìn đa dạng thúc đẩy đổi mới sáng tạo trong các đội nhóm công nghệ liên chức năng.',
        domain,
        relatedWords: ['drive', 'innovation', 'technology'],
      },
    ]
  }

  /** Chấm đủ mỗi câu đúng một lần, đối chiếu câu hỏi thuộc module do server tạo. */
  static gradeDrill(
    module: MicroCurriculumModule,
    answers: NeuralDrillSubmission['answers'],
  ): number | null {
    if (answers.length !== module.drills.length) return null
    const byId = new Map(answers.map((answer) => [answer.drillId, answer.answer]))
    if (byId.size !== answers.length) return null
    let correct = 0
    for (const drill of module.drills) {
      const answer = byId.get(drill.id)
      if (answer === undefined || !drill.options.includes(answer)) return null
      if (answer === drill.correctAnswer) correct++
    }
    return correct
  }

  /**
   * Tính toán điểm lặp lại ngắt quãng (Spaced Retrieval Interval)
   */
  static computeNextSpacedReview(
    previousIntervalDays: number,
    isCorrect: boolean,
  ): {
    nextIntervalDays: number
    masteryDelta: number
  } {
    if (isCorrect) {
      const nextDays = Math.max(1, Math.round((previousIntervalDays || 1) * 2.2))
      return { nextIntervalDays: Math.min(nextDays, 30), masteryDelta: +15 }
    } else {
      return { nextIntervalDays: 1, masteryDelta: -10 }
    }
  }

  /**
   * Tạo trạng thái khởi tạo cho người dùng
   */
  static createDefaultState(personId: string): NeuralCurriculumState {
    const now = new Date().toISOString()
    const defaultModule = this.generateMicroCurriculumModule({
      moduleId: '11111111-1111-4111-8111-111111111111',
      targetDomain: 'career',
      topicOrKeyword: 'Giao Tiếp Quốc Tế & Phản Xạ Công Việc',
      cefrLevel: 'B2',
    })

    return {
      personId,
      activeModuleId: defaultModule.moduleId,
      modules: [defaultModule],
      masteryScore: 0,
      schemaVersion: NEURAL_CURRICULUM_VERSION,
      createdAt: now,
      updatedAt: now,
    }
  }
}

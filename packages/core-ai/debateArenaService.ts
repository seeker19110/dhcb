// packages/core-ai/debateArenaService.ts — Động cơ Đấu trường Tranh biện AI & Socratic Multi-Agent V5.1.
//
// [2026-08-23] SỬA LỖI NGHIÊM TRỌNG: `generateAiTurn` trước đây KHÔNG hề gọi AI — nó trả về
// 1 trong 3 đoạn tiếng Anh CỨNG, bỏ qua cả chủ đề tranh biện lẫn lập luận người học vừa viết,
// trong khi UI hiển thị tên "Debater AI". Nay gọi model thật theo đúng thứ tự dự phòng của
// Companion (Anthropic → Groq → Gemini). Khi KHÔNG provider nào chạy được thì vẫn dùng mẫu
// cứng, nhưng gắn cờ `isFallback` để UI NÓI THẬT thay vì để người học tưởng đang đấu với AI.
import { generateChatText } from './chatFallback.js'
import {
  DebatePersona,
  DebateTurn,
  DebateSessionState,
  DebateSessionConfig,
  DebateRubricScore,
  LogicalFallacyType,
} from '@dhcb/core-contracts/debateArena'

export class DebateArenaService {
  /**
   * Khởi tạo phiên tranh biện đa nhân vật AI
   */
  static createDebateSession(personId: string, config: DebateSessionConfig): DebateSessionState {
    const now = new Date().toISOString()
    const sessionId = `deb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const opponentRole = config.userStance === 'support' ? 'negative' : 'affirmative'
    const personas: DebatePersona[] = [
      {
        id: 'ai-opponent',
        name: opponentRole === 'negative' ? 'Sophia Sterling (Debater)' : 'Marcus Vance (Debater)',
        avatar: opponentRole === 'negative' ? '👩‍💼' : '👨‍💼',
        role: opponentRole,
        stance:
          opponentRole === 'negative'
            ? 'Challenges the motion with empirical scrutiny and pragmatic trade-offs.'
            : 'Champions the motion advocating rapid transformation and equity.',
        style: 'analytical',
        cefrTargetLevel:
          config.difficulty === 'mastery_c2'
            ? 'C2'
            : config.difficulty === 'advanced_c1'
              ? 'C1'
              : 'B2',
      },
      {
        id: 'ai-moderator',
        name: 'Prof. Alistair Thorne',
        avatar: '👨‍🏫',
        role: 'socratic_moderator',
        stance: 'Neutral facilitator probing underlying assumptions and logical rigor.',
        style: 'philosophical',
        cefrTargetLevel: 'C1',
      },
    ]

    return {
      id: sessionId,
      personId,
      config,
      personas,
      turns: [],
      currentRound: 1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }
  }

  /**
   * Phân tích lượt phát biểu của người dùng: cấu trúc Toulmin, ngụy biện, từ vựng nâng cao
   */
  static analyzeArgumentTurn(content: string): {
    detectedFallacy: LogicalFallacyType
    fallacyExplanation?: string
    toulmin: {
      claim: string
      evidence?: string
      warrant?: string
      rebuttal?: string
      hasValidStructure: boolean
    }
    advancedVocabulary: string[]
    logicScore: number
    persuasionScore: number
  } {
    const lower = content.toLowerCase()
    let detectedFallacy: LogicalFallacyType = 'none'
    let fallacyExplanation: string | undefined = undefined

    // Nhận diện ngụy biện kinh điển dựa trên heuristics ngôn ngữ
    if (
      lower.includes('stupid') ||
      lower.includes('idiot') ||
      lower.includes('they do not know anything')
    ) {
      detectedFallacy = 'ad_hominem'
      fallacyExplanation = 'Tập trung công kích cá nhân thay vì mổ xẻ nội dung lập luận.'
    } else if (lower.includes('either') && lower.includes('or we will completely collapse')) {
      detectedFallacy = 'false_dilemma'
      fallacyExplanation =
        'Ép vào thế nhị nguyên (chỉ có 2 lựa chọn cực đoan) bỏ qua các giải pháp trung dung.'
    } else if (lower.includes('if we allow this, then everything will be destroyed')) {
      detectedFallacy = 'slippery_slope'
      fallacyExplanation = 'Giả định một chuỗi hậu quả tiêu cực không có chứng cứ xác đáng.'
    } else if (
      lower.includes('because it is just true') ||
      lower.includes('obviously because it is true')
    ) {
      detectedFallacy = 'circular_reasoning'
      fallacyExplanation = 'Lập luận vòng quanh (dùng chính kết luận để làm tiền đề).'
    }

    // Trích xuất từ vựng học thuật C1/C2
    const c1C2VocabList = [
      'counterproductive',
      'unprecedented',
      'paramount',
      'exacerbate',
      'mitigate',
      'inextricably',
      'substantiate',
      'paradigm',
      'preponderance',
      'imperative',
      'indispensable',
      'catalyst',
      'nuanced',
      'holistic',
      'fallacious',
    ]

    const advancedVocabulary = c1C2VocabList.filter((word) => lower.includes(word))

    // Phân tích Toulmin Model
    const hasEvidenceMarker =
      lower.includes('because') ||
      lower.includes('evidence') ||
      lower.includes('for instance') ||
      lower.includes('data shows') ||
      lower.includes('research indicates')

    const hasWarrantMarker =
      lower.includes('therefore') ||
      lower.includes('consequently') ||
      lower.includes('as a result') ||
      lower.includes('this implies')

    const hasRebuttalMarker =
      lower.includes('although') ||
      lower.includes('even though') ||
      lower.includes('while some argue') ||
      lower.includes('notwithstanding')

    const hasValidStructure = content.length > 25 && hasEvidenceMarker

    let logicScore = 70
    if (hasEvidenceMarker) logicScore += 10
    if (hasWarrantMarker) logicScore += 10
    if (detectedFallacy !== 'none') logicScore -= 25
    logicScore = Math.max(20, Math.min(100, logicScore))

    let persuasionScore = 65
    if (hasRebuttalMarker) persuasionScore += 15
    if (advancedVocabulary.length > 0)
      persuasionScore += Math.min(20, advancedVocabulary.length * 5)
    if (detectedFallacy !== 'none') persuasionScore -= 20
    persuasionScore = Math.max(20, Math.min(100, persuasionScore))

    return {
      detectedFallacy,
      fallacyExplanation,
      toulmin: {
        claim: content.slice(0, 100),
        evidence: hasEvidenceMarker ? 'Đã cung cấp dữ liệu / lý lẽ minh chứng.' : undefined,
        warrant: hasWarrantMarker ? 'Có mối nối logic dẫn từ tiền đề đến kết luận.' : undefined,
        rebuttal: hasRebuttalMarker
          ? 'Đã lường trước góc nhìn phản biện của đối phương.'
          : undefined,
        hasValidStructure,
      },
      advancedVocabulary,
      logicScore,
      persuasionScore,
    }
  }

  // Mẫu cứng CHỈ dùng khi không gọi được AI (thiếu key / mọi provider lỗi). Lượt dùng mẫu này
  // luôn được gắn cờ `isFallback` để UI nói rõ với người học — xem chú thích đầu file.
  private static fallbackTurnContent(
    speakerRole: 'affirmative' | 'negative' | 'socratic_moderator',
  ): string {
    if (speakerRole === 'socratic_moderator') {
      return `A probing line of inquiry from both sides. To what extent can we balance the imperative of rapid innovation against the ethical necessity of safeguarding human agency? What concrete safeguards would you propose?`
    }
    if (speakerRole === 'negative') {
      return `While that position seems appealing on the surface, it overlooks critical unintended consequences. Historical precedent demonstrates that premature interventions often exacerbate the very inequities they intend to mitigate. We must demand empirical substantiation before proceeding.`
    }
    return `The ethical imperative is undeniable. When facing systemic challenges, passive incrementalism is counterproductive. Establishing proactive standards serves as an indispensable catalyst for sustainable development.`
  }

  // Dựng prompt từ CHỦ ĐỀ THẬT + các lượt gần nhất, để đối thủ AI thực sự phản biện đúng thứ
  // người học vừa nói (đây chính là phần trước đây bị bỏ qua hoàn toàn).
  private static buildDebatePrompt(
    session: DebateSessionState,
    speakerRole: 'affirmative' | 'negative' | 'socratic_moderator',
  ): { system: string; userMessage: string } {
    const roleBrief =
      speakerRole === 'socratic_moderator'
        ? 'Bạn là NGƯỜI ĐIỀU PHỐI theo lối Socratic. KHÔNG bênh bên nào; đặt MỘT câu hỏi đào sâu buộc cả hai bên xét lại giả định của mình.'
        : speakerRole === 'negative'
          ? 'Bạn tranh biện PHẢN ĐỐI (negative) kiến nghị dưới đây.'
          : 'Bạn tranh biện ỦNG HỘ (affirmative) kiến nghị dưới đây.'

    const system =
      `Bạn là đối thủ tranh biện học thuật trong một ứng dụng LUYỆN TIẾNG ANH. ${roleBrief}\n` +
      `Kiến nghị (motion): "${session.config.motion}".\n` +
      `Trình độ người học: ${session.config.difficulty}. Viết BẰNG TIẾNG ANH, 3–5 câu, ` +
      `lập luận chặt theo cấu trúc Toulmin (claim → evidence → warrant), giọng lịch sự và sắc sảo. ` +
      `PHẢI phản biện trực tiếp vào luận điểm người học vừa nêu, không nói chung chung. ` +
      `Chỉ trả về nội dung lượt nói, KHÔNG thêm nhãn hay lời dẫn.`

    // Lấy tối đa 6 lượt gần nhất làm bối cảnh — đủ để bám mạch, không thổi phồng token.
    const recent = session.turns.slice(-6)
    const transcript = recent
      .map((t) => `${t.speakerRole === 'user' ? 'Người học' : 'Đối thủ'}: ${t.content}`)
      .join('\n')

    const userMessage = transcript
      ? `Diễn biến gần đây:\n${transcript}\n\nHãy viết lượt tiếp theo của bạn.`
      : `Hãy mở màn lượt tranh biện đầu tiên của bạn về kiến nghị trên.`

    return { system, userMessage }
  }

  // Gọi model thật qua chuỗi dự phòng dùng chung (Anthropic → Groq → Gemini, xem
  // chatFallback.ts). Trả null khi không provider nào dùng được → caller rơi về mẫu cứng và
  // gắn cờ isFallback.
  private static async callDebateModel(
    session: DebateSessionState,
    speakerRole: 'affirmative' | 'negative' | 'socratic_moderator',
  ): Promise<string | null> {
    const { system, userMessage } = this.buildDebatePrompt(session, speakerRole)
    return generateChatText({
      system,
      userMessage,
      maxTokens: 512,
      mode: 'debate',
      task: 'debate',
    })
  }

  /**
   * Sinh phản hồi / phản biện AI THẬT từ góc nhìn đối lập hoặc câu hỏi Socratic.
   * Rơi về mẫu cứng (kèm cờ `isFallback`) khi không provider nào dùng được.
   */
  static async generateAiTurn(
    session: DebateSessionState,
    speakerRole: 'affirmative' | 'negative' | 'socratic_moderator',
  ): Promise<DebateTurn> {
    const now = new Date().toISOString()
    const persona = session.personas.find((p) => p.role === speakerRole) || session.personas[0]
    const turnId = `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

    const aiText = await this.callDebateModel(session, speakerRole)
    const content = aiText ?? this.fallbackTurnContent(speakerRole)
    const analysis = this.analyzeArgumentTurn(content)

    return {
      ...(aiText === null ? { isFallback: true as const } : {}),
      id: turnId,
      speakerId: persona?.id || 'ai-speaker',
      speakerName: persona?.name || 'Debater AI',
      speakerRole,
      content,
      detectedFallacy: analysis.detectedFallacy,
      fallacyExplanation: analysis.fallacyExplanation,
      toulmin: analysis.toulmin,
      advancedVocabulary: analysis.advancedVocabulary,
      logicScore: analysis.logicScore,
      persuasionScore: analysis.persuasionScore,
      timestamp: now,
    }
  }

  /**
   * Đánh giá và tổng kết kết quả toàn bộ trận tranh biện
   */
  static evaluateDebateMatch(session: DebateSessionState): DebateRubricScore {
    const userTurns = session.turns.filter((t) => t.speakerRole === 'user')
    if (userTurns.length === 0) {
      return {
        toulminStructureScore: 70,
        fallacyAvoidanceScore: 80,
        lexicalResourceScore: 75,
        rebuttalEffectivenessScore: 70,
        overallScore: 73.75,
        strengths: ['Active participation in opening arguments.'],
        areasForImprovement: ['Elaborate warrants and supply concrete evidence.'],
        recommendedPhrases: [
          'Notwithstanding the assertion',
          'This empirical observation demonstrates',
        ],
      }
    }

    const avgLogic = userTurns.reduce((acc, t) => acc + t.logicScore, 0) / userTurns.length
    const avgPersuasion =
      userTurns.reduce((acc, t) => acc + t.persuasionScore, 0) / userTurns.length
    const fallaciesCount = userTurns.filter((t) => t.detectedFallacy !== 'none').length

    const fallacyAvoidanceScore = Math.max(30, 100 - fallaciesCount * 25)
    const toulminStructureScore = Math.round(avgLogic)
    const lexicalResourceScore = Math.min(
      100,
      70 + userTurns.reduce((acc, t) => acc + t.advancedVocabulary.length * 6, 0),
    )
    const rebuttalEffectivenessScore = Math.round(avgPersuasion)
    const overallScore = Math.round(
      (toulminStructureScore +
        fallacyAvoidanceScore +
        lexicalResourceScore +
        rebuttalEffectivenessScore) /
        4,
    )

    const strengths: string[] = []
    const areasForImprovement: string[] = []

    if (toulminStructureScore >= 80) {
      strengths.push('Lập luận có cấu trúc tiền đề – kết luận rõ ràng, mạch lạc.')
    } else {
      areasForImprovement.push('Cần bổ sung bằng chứng và giải thích cầu nối suy luận (Warrant).')
    }

    if (fallacyAvoidanceScore >= 85) {
      strengths.push('Tránh được các bẫy ngụy biện kinh điển, giữ vững tính khách quan.')
    } else {
      areasForImprovement.push('Chú ý tránh khái quát hóa vội vã hoặc công kích cảm xúc.')
    }

    if (lexicalResourceScore >= 85) {
      strengths.push('Sử dụng phong phú các thuật ngữ học thuật và liên từ C1-C2.')
    } else {
      areasForImprovement.push(
        'Tăng cường các cụm từ phản biện nâng cao như "Notwithstanding...", "This premise implies...".',
      )
    }

    return {
      toulminStructureScore,
      fallacyAvoidanceScore,
      lexicalResourceScore,
      rebuttalEffectivenessScore,
      overallScore,
      strengths,
      areasForImprovement,
      recommendedPhrases: [
        'Notwithstanding the assertion that...',
        'It is paramount to recognize the underlying mechanism...',
        'The empirical evidence clearly substantiates that...',
      ],
    }
  }
}

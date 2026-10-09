// packages/core-personal/metacognitiveReflectionService.ts — Nhật ký phản tỉnh Socratic: câu hỏi
// hằng ngày, dò bẫy tư duy theo từ khoá, câu hỏi gợi mở tiếp theo. KHÔNG chấm điểm người viết.
import {
  COGNITIVE_BIAS_LABELS,
  type MetacognitiveReflection,
  type IdentifiedBias,
  type SocraticDailyPrompt,
  type MetacognitiveSummary,
  type CognitiveBiasType,
} from '@dhcb/core-contracts/metacognitiveReflection'

// ── Bảng luật dò bẫy tư duy ─────────────────────────────────────────────────
// Câu chữ viết theo giọng "có thể bạn đang…" (skill memory-palace-cognitive-scaffolder §3): bộ dò
// chỉ khớp từ khoá, nên nó GỢI Ý để người viết tự hỏi lại, không phải chẩn đoán.

type DetectableBias = Exclude<CognitiveBiasType, 'none'>

const BIAS_RULES: ReadonlyArray<{
  biasType: DetectableBias
  keywords: readonly string[]
  explanation: string
  followUpQuestion: string
  severity: IdentifiedBias['severity']
}> = [
  {
    biasType: 'overconfidence',
    keywords: ['chắc chắn', 'dễ ợt', 'quá đơn giản', 'ai cũng biết'],
    explanation: 'Có thể bạn đang đánh giá thấp những chỗ phức tạp còn ẩn trong vấn đề.',
    followUpQuestion:
      'Có tình huống nào khiến điều bạn đang chắc chắn không còn đúng nữa không? Thử nghĩ ra ba tình huống như vậy.',
    severity: 'moderate',
  },
  {
    biasType: 'analysis_paralysis',
    keywords: ['sợ sai', 'nghĩ mãi', 'chưa đủ hoàn hảo', 'chưa sẵn sàng'],
    explanation: 'Có thể mong muốn làm thật hoàn hảo đang khiến bạn chần chừ chưa bắt tay vào làm.',
    followUpQuestion: 'Nếu chỉ có 15 phút để làm một bản nháp thô, bạn sẽ bắt đầu từ đâu?',
    severity: 'high',
  },
  {
    biasType: 'imposter_syndrome',
    keywords: ['may mắn', 'không xứng đáng', 'sợ bị phát hiện'],
    explanation:
      'Có thể bạn đang gán kết quả cho may mắn thay vì cho công sức và kỹ năng của chính mình.',
    followUpQuestion: 'Những việc cụ thể nào chính bạn đã làm để có được kết quả này?',
    severity: 'moderate',
  },
  {
    biasType: 'sunk_cost',
    keywords: ['tiếc công', 'đã bỏ ra nhiều', 'không thể bỏ'],
    explanation: 'Có thể bạn đang muốn tiếp tục chủ yếu vì đã lỡ bỏ ra nhiều công sức.',
    followUpQuestion:
      'Nếu bắt đầu lại từ con số 0 vào hôm nay, bạn có còn chọn con đường này không?',
    severity: 'high',
  },
]

/** Dấu hiệu người viết đang kể một điều vừa vỡ lẽ — để trích câu "Aha" từ chính lời họ. */
const AHA_MARKERS = ['nhận ra', 'vỡ lẽ', 'hóa ra', 'hoá ra', 'bài học'] as const

const OPEN_FOLLOW_UP = 'Điều gì trong những dòng bạn vừa viết khiến chính bạn bất ngờ nhất? Vì sao?'
const CLOSING_FOLLOW_UP =
  'Bạn có thể biến điều vừa nhận ra thành một quy tắc "Nếu… thì…" cụ thể cho tuần này không?'

export class MetacognitiveReflectionService {
  /**
   * Sinh câu hỏi phản tỉnh Socratic hàng ngày dựa trên miền chuyên sâu và ngữ cảnh gần nhất.
   */
  static generateDailySocraticPrompt(
    domain: 'learning' | 'career' | 'work' | 'startup' | 'life',
    contextAnchor?: string,
  ): SocraticDailyPrompt {
    const promptLibrary: Record<
      string,
      { theme: string; promptText: string; deepDivingQuestion: string }[]
    > = {
      learning: [
        {
          theme: 'Tự đánh giá năng lực & Điểm mù tri thức',
          promptText:
            'Khi đối mặt với kiến thức phức tạp hôm nay, bạn có nhận ra lúc nào sự hiểu biết thực tế khác với cảm giác "tưởng mình đã hiểu"?',
          deepDivingQuestion:
            'Nếu phải giải thích lại khái niệm này cho một đứa trẻ 10 tuổi mà không nhìn tài liệu, bạn sẽ bị khựng ở bước nào?',
        },
        {
          theme: 'Chiến lược vượt ngưỡng khó khăn',
          promptText:
            'Khi gặp một câu hỏi trắc nghiệm hoặc bài tập khiến bạn bối rối, phản xạ tự nhiên đầu tiên của bạn là gì?',
          deepDivingQuestion:
            'Phản xạ đó đang giúp bạn tiến bộ hay đang là một cơ chế né tránh cảm giác khó chịu?',
        },
      ],
      career: [
        {
          theme: 'Định vị giá trị & Quyết định phát triển',
          promptText:
            'Quyết định sự nghiệp gần nhất của bạn được thúc đẩy bởi mong muốn tạo giá trị thực chất hay nỗi sợ bị tụt hậu?',
          deepDivingQuestion:
            'Lựa chọn nào sẽ mang lại quyền tự quyết cao nhất cho bạn trong 2 năm tới?',
        },
      ],
      work: [
        {
          theme: 'Tối ưu hóa dòng chảy công việc & Quản trị năng lượng',
          promptText:
            'Những tác vụ nào hôm nay thực sự tạo ra đòn bẩy cao nhất, và những tác vụ nào chỉ là bận rộn hình thức?',
          deepDivingQuestion:
            'Nếu chỉ được giữ lại 20% đầu việc để tạo ra 80% kết quả, bạn sẽ loại bỏ tác vụ nào ngay lập tức?',
        },
      ],
      startup: [
        {
          theme: 'Kiểm chứng giả định thị trường',
          promptText:
            'Giả định cốt lõi nào trong mô hình của bạn chưa từng được kiểm chứng bằng hành vi trả tiền thực tế của khách hàng?',
          deepDivingQuestion:
            'Bằng chứng nghịch đảo (Counter-evidence) nào nếu xuất hiện sẽ buộc bạn phải đổi hướng (pivot)?',
        },
      ],
      life: [
        {
          theme: 'Cân bằng nội tại & Khả năng phục hồi',
          promptText:
            'Cảm xúc mạnh nhất bạn trải qua hôm nay là gì, và thông điệp ngầm bên dưới cảm xúc đó muốn nói với bạn điều gì?',
          deepDivingQuestion:
            'Làm thế nào để bạn đối xử với bản thân bằng sự trắc ẩn nhưng vẫn giữ vững kỷ luật?',
        },
      ],
    }

    const defaultFallback = [
      {
        theme: 'Tự đánh giá năng lực & Điểm mù tri thức',
        promptText:
          'Khi đối mặt với kiến thức phức tạp hôm nay, bạn có nhận ra lúc nào sự hiểu biết thực tế khác với cảm giác "tưởng mình đã hiểu"?',
        deepDivingQuestion:
          'Nếu phải giải thích lại khái niệm này cho một đứa trẻ 10 tuổi mà không nhìn tài liệu, bạn sẽ bị khựng ở bước nào?',
      },
    ]

    const domainList = promptLibrary[domain] || defaultFallback
    const selected =
      domainList[Math.floor(Math.random() * domainList.length)] || defaultFallback[0]!

    return {
      id: `socratic-${domain}-${Date.now()}`,
      domain,
      theme: selected.theme,
      promptText: selected.promptText,
      deepDivingQuestion: selected.deepDivingQuestion,
      contextAnchor,
    }
  }

  /**
   * Đọc bài phản tỉnh, dò những bẫy tư duy CÓ THỂ đang hiện diện (theo từ khoá trong chính bài viết)
   * và soạn câu hỏi Socratic tiếp theo cho từng bẫy.
   *
   * KHÔNG chấm điểm người viết (Luật số 1, changelog 0539). Trước đây hàm này còn trả
   * "Metacognitive Index" = `wordCount * 1.5 + 40` + thưởng theo số bẫy, và "Growth Mindset" =
   * 90/75 theo từ khoá — số giả được trình bày như chỉ số năng lực, nên đã gỡ hẳn.
   */
  static analyzeReflection(
    personId: string,
    params: {
      title?: string
      domain: 'learning' | 'career' | 'work' | 'startup' | 'life'
      reflectionPrompt: string
      userReflection: string
    },
  ): MetacognitiveReflection {
    const text = params.userReflection.toLowerCase()

    // 1. Dò bẫy tư duy: giữ lại nguyên văn cụm từ đã khớp để người viết thấy VÌ SAO có gợi ý.
    const identifiedBiases: IdentifiedBias[] = []
    for (const rule of BIAS_RULES) {
      const triggerPhrases = rule.keywords.filter((k) => text.includes(k))
      if (triggerPhrases.length === 0) continue
      identifiedBiases.push({
        biasType: rule.biasType,
        biasName: COGNITIVE_BIAS_LABELS[rule.biasType],
        explanation: rule.explanation,
        antidotePrompt: rule.followUpQuestion,
        severity: rule.severity,
        triggerPhrases,
      })
    }

    // 2. Khoảnh khắc "Aha": CHỈ trích câu người viết tự nói ra. Không có thì để trống — không
    // bịa một câu "nhận thức rõ ràng hơn…" thay lời họ như bản cũ.
    const ahaMoments: string[] = []
    const ahaSentence = params.userReflection
      .split(/[.!?\n]/)
      .filter((s) => s.trim().length > 15)
      .find((s) => AHA_MARKERS.some((m) => s.toLowerCase().includes(m)))
    if (ahaSentence) ahaMoments.push(ahaSentence.trim())

    // 3. Câu hỏi Socratic tiếp theo: câu hỏi riêng của từng bẫy dò được, rồi một câu chốt biến
    // điều vừa nhận ra thành hành động. Không dò được bẫy nào → câu hỏi mở chung.
    const socraticFollowUps = [
      ...(identifiedBiases.length > 0
        ? identifiedBiases.map((b) => b.antidotePrompt)
        : [OPEN_FOLLOW_UP]),
      CLOSING_FOLLOW_UP,
    ]

    return {
      id: `refl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      personId,
      title:
        params.title ||
        `Nhật ký nhận thức: ${params.domain.toUpperCase()} - ${new Date().toLocaleDateString('vi-VN')}`,
      domain: params.domain,
      reflectionPrompt: params.reflectionPrompt,
      userReflection: params.userReflection,
      ahaMoments,
      identifiedBiases,
      socraticFollowUps,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Tóm tắt lịch sử phản tỉnh — CHỈ định tính (số phiên, bẫy hay gặp lại, câu "Aha" gần đây).
   * Không còn "chỉ số trung bình" hay "xu hướng tư duy" suy ra từ số giả (changelog 0539).
   */
  static summarizeReflections(reflections: MetacognitiveReflection[]): MetacognitiveSummary {
    const biasFrequency = new Map<CognitiveBiasType, number>()
    for (const b of reflections.flatMap((r) => r.identifiedBiases)) {
      if (b.biasType === 'none') continue
      biasFrequency.set(b.biasType, (biasFrequency.get(b.biasType) ?? 0) + 1)
    }
    const topDetectedBiases = [...biasFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type)

    return {
      totalReflectionsCount: reflections.length,
      topDetectedBiases,
      recentAhaMoments: reflections.flatMap((r) => r.ahaMoments).slice(0, 5),
    }
  }
}
